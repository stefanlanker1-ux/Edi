// Elektronenkonfiguration, Schalen, Ionen und Schreibweisen – reine Funktionen ohne UI.

import { BY_Z, BY_SYMBOL, ELEMENTS } from "./elements.ts";

export const L_NAMES = ["s", "p", "d", "f"] as const;
export type LName = (typeof L_NAMES)[number];
export const SHELL_NAMES = ["K", "L", "M", "N", "O", "P", "Q"] as const;

export interface Subshell {
  n: number;
  l: number;
  max: number;
  /** z. B. "3d" */
  key: string;
}
export interface Occupied extends Subshell {
  count: number;
}
export interface ConfigOptions {
  /** Ausnahmen vom Aufbauprinzip (Cr, Cu, …) berücksichtigen – Standard: true */
  exceptions?: boolean;
}

/** Unterschalen in Reihenfolge steigender Energie (Madelung-Regel) bis 6p */
export const MADELUNG: Subshell[] = [
  [1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [3, 2], [4, 1], [5, 0], [4, 2], [5, 1], [6, 0], [4, 3], [5, 2], [6, 1],
].map(([n, l]) => ({ n, l, max: 2 * (2 * l + 1), key: `${n}${L_NAMES[l]}` }));

/** Abweichende Besetzungen neutraler Atome im Grundzustand */
export const EXCEPTIONS: Record<number, Record<string, number>> = {
  24: { "3d": 5, "4s": 1 }, 29: { "3d": 10, "4s": 1 },
  41: { "4d": 4, "5s": 1 }, 42: { "4d": 5, "5s": 1 },
  44: { "4d": 7, "5s": 1 }, 45: { "4d": 8, "5s": 1 },
  46: { "4d": 10, "5s": 0 }, 47: { "4d": 10, "5s": 1 },
  57: { "4f": 0, "5d": 1 }, 58: { "4f": 1, "5d": 1 },
  64: { "4f": 7, "5d": 1 }, 78: { "5d": 9, "6s": 1 },
  79: { "5d": 10, "6s": 1 },
};

const ORDER_IDX: Record<string, number> = Object.fromEntries(MADELUNG.map((o, i) => [o.key, i]));
const sub = (key: string) => MADELUNG[ORDER_IDX[key]];

/** Aufbauprinzip ohne Ausnahmen */
export function aufbau(electrons: number): Occupied[] {
  const out: Occupied[] = [];
  let left = electrons;
  for (const o of MADELUNG) {
    if (left <= 0) break;
    const c = Math.min(o.max, left);
    out.push({ ...o, count: c });
    left -= c;
  }
  return out;
}

function withExceptions(Z: number): Occupied[] {
  const ex = EXCEPTIONS[Z];
  const cfg = aufbau(Z);
  if (!ex) return cfg;
  const map = new Map(cfg.map(o => [o.key, o.count]));
  for (const [k, v] of Object.entries(ex)) map.set(k, v);
  return [...map.entries()]
    .map(([key, count]) => ({ ...sub(key), count }))
    .filter(o => o.count > 0)
    .sort((a, b) => ORDER_IDX[a.key] - ORDER_IDX[b.key]);
}

/**
 * Elektronenkonfiguration für Z Protonen und `electrons` Elektronen.
 * Kationen: Elektronen werden von außen nach innen entfernt – zuerst aus der äußersten Schale (höchstes n: p vor s),
 * dann (n−1)d, dann (n−2)f → Fe²⁺ = [Ar] 3d⁶, Eu³⁺ = [Xe] 4f⁶, Pb²⁺ = [Xe] 4f¹⁴ 5d¹⁰ 6s².
 * Anionen: weitere Elektronen nach Aufbauprinzip.
 */
export function configuration(Z: number, electrons = Z, { exceptions = true }: ConfigOptions = {}): Occupied[] {
  if (electrons <= 0) return [];
  if (Z <= 0 || electrons >= Z) {
    if (electrons === Z && exceptions && EXCEPTIONS[Z]) return withExceptions(Z);
    return aufbau(electrons);
  }
  const cfg = (exceptions ? withExceptions(Z) : aufbau(Z)).map(o => ({ ...o }));
  // „Äußere“ Rangfolge: n + (d: 1 Schale tiefer, f: 2 Schalen tiefer gilt als weiter innen) – ns/np vor (n−1)d vor (n−2)f
  const outer = (o: Occupied) => (o.l === 3 ? o.n + 2 : o.l === 2 ? o.n + 1 : o.n) * 10 + (o.l <= 1 ? o.l + 5 : 0);
  for (let remove = Z - electrons; remove > 0; remove--) {
    let best: Occupied | null = null;
    for (const o of cfg) {
      if (o.count === 0) continue;
      if (!best || outer(o) > outer(best) || (outer(o) === outer(best) && o.n > best.n)) best = o;
    }
    best!.count--;
  }
  return cfg.filter(o => o.count > 0);
}

/** Elektronen je Hauptschale (K, L, M, …) */
export function shells(Z: number, electrons = Z, opts?: ConfigOptions): number[] {
  const out: number[] = [];
  for (const o of configuration(Z, electrons, opts)) {
    while (out.length < o.n) out.push(0);
    out[o.n - 1] += o.count;
  }
  return out;
}

export const shellCapacity = (n: number) => 2 * n * n;

const SUP: Record<string, string> = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹", "+": "⁺", "-": "⁻" };
export const sup = (v: number | string) => String(v).split("").map(c => SUP[c] ?? c).join("");

/** +2 → "²⁺", −1 → "⁻", 0 → "" */
export function chargeSup(charge: number): string {
  if (!charge) return "";
  const abs = Math.abs(charge);
  return (abs === 1 ? "" : sup(abs)) + (charge > 0 ? "⁺" : "⁻");
}
/** +2 → "2+", −1 → "−", 0 → "" */
export function chargeText(charge: number): string {
  if (!charge) return "";
  const abs = Math.abs(charge);
  return (abs === 1 ? "" : String(abs)) + (charge > 0 ? "+" : "−");
}
/** +2 → "+2", −1 → "−1", 0 → "0" */
export const signed = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : "0");

export const configString = (cfg: Occupied[]) => cfg.map(o => `${o.key}${sup(o.count)}`).join(" ");

const NOBLE = [2, 10, 18, 36, 54, 86];

/** Edelgas-Kurzschreibweise, z. B. [Ar] 4s² 3d⁶ */
export function shortConfigString(Z: number, electrons = Z, opts?: ConfigOptions): string {
  const cfg = configuration(Z, electrons, opts);
  let core = 0;
  for (const g of NOBLE) {
    if (g >= electrons) break;
    const ok = aufbau(g).every(c => (cfg.find(o => o.key === c.key)?.count ?? 0) >= c.count);
    if (ok) core = g;
  }
  if (!core) return configString(cfg);
  const coreKeys = new Set(aufbau(core).map(c => c.key));
  const rest = cfg.filter(o => !coreKeys.has(o.key));
  return `[${BY_Z[core].symbol}]` + (rest.length ? " " + configString(rest) : "");
}

/** Ungepaarte Elektronen nach Hund'scher Regel */
export function unpairedElectrons(cfg: Occupied[]): number {
  let u = 0;
  for (const o of cfg) {
    const boxes = o.max / 2;
    u += o.count <= boxes ? o.count : o.max - o.count;
  }
  return u;
}

/** Besetzung der Orbital-Kästchen einer Unterschale nach Hund (0/1/2 je Kästchen) */
export function hundBoxes(l: number, count: number): number[] {
  const boxes = 2 * l + 1;
  const arr = new Array<number>(boxes).fill(0);
  for (let i = 0; i < count; i++) arr[i % boxes]++;
  return arr;
}

/** Außenelektronen von Hauptgruppenelementen, sonst null */
export function valenceElectrons(Z: number): number | null {
  const el = BY_Z[Z];
  if (!el || el.group === null) return null;
  if (el.group <= 2) return el.group;
  if (el.group >= 13) return Z === 2 ? 2 : el.group - 10;
  return null;
}

export function blockOf(Z: number): LName {
  const el = BY_Z[Z];
  if (Z === 2) return "s";
  if (el.group === null) return "f";
  if (el.group <= 2) return "s";
  if (el.group >= 13) return "p";
  return "d";
}

/** Typische Ionenladung nach der Edelgasregel (Hauptgruppen), sonst null */
export function typicalIonCharge(Z: number): number | null {
  const el = BY_Z[Z];
  if (!el || el.group === null) return null;
  if (el.group === 1 && Z !== 1) return 1;
  if (el.group === 2) return 2;
  if (el.group === 13 && Z === 13) return 3;
  if (el.group === 15 && Z <= 15) return -3;
  if (el.group === 16 && Z <= 34) return -2;
  if (el.group === 17) return -1;
  return null;
}

/** Weitere häufige Ionenladungen von Metallen ohne Edelgaskonfiguration (Nebengruppen, Sn, Pb, …) */
const METAL_CHARGES: Record<number, number[]> = {
  21: [3], 22: [2, 4], 23: [2, 3], 24: [2, 3], 25: [2], 26: [2, 3], 27: [2, 3], 28: [2], 29: [1, 2], 30: [2],
  31: [3], 39: [3], 40: [4], 47: [1], 48: [2], 49: [3], 50: [2, 4], 78: [2], 79: [1, 3], 80: [2], 81: [1], 82: [2, 4], 83: [3],
};
/** Ladungen, die für ein Element als Ion wirklich vorkommen (leer = bildet keine einfachen Ionen, z. B. C, Edelgase) */
export function commonCharges(Z: number): number[] {
  const t = typicalIonCharge(Z);
  if (t !== null) return [t];
  if (METAL_CHARGES[Z]) return METAL_CHARGES[Z];
  if (Z >= 57 && Z <= 71) return [3];
  return [];
}

/** Hauptgruppen-Nummer (I–VIII) für Z, sonst null */
export function mainGroupNumber(Z: number): number | null {
  const g = BY_Z[Z]?.group;
  if (g == null) return null;
  if (g <= 2) return g;
  if (g >= 13) return g - 10;
  return null;
}
export const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/** Namensstamm einatomiger Anionen: Cl → Chlorid, O → Oxid, N → Nitrid … */
export const ANION_STEM: Record<string, string> = {
  H: "Hydrid", B: "Borid", C: "Carbid", N: "Nitrid", O: "Oxid", F: "Fluorid", Si: "Silicid", P: "Phosphid", S: "Sulfid",
  Cl: "Chlorid", As: "Arsenid", Se: "Selenid", Br: "Bromid", Te: "Tellurid", I: "Iodid", At: "Astatid",
};
/**
 * Name eines einatomigen Ions: Natrium-Ion, Chlorid-Ion, Eisen(III)-Ion.
 * Metalle mit mehreren üblichen Ladungen bekommen die römische Zahl.
 */
export function ionName(Z: number, charge: number): string {
  const el = BY_Z[Z];
  if (!el) return "";
  if (charge < 0) return ANION_STEM[el.symbol] ? `${ANION_STEM[el.symbol]}-Ion` : `${el.name}-Anion`;
  if (charge > 0 && commonCharges(Z).length > 1 && ROMAN[charge]) return `${el.name}(${ROMAN[charge]})-Ion`;
  return `${el.name}-Ion`;
}

/**
 * Elemente, die in einem Aufgabentext vorkommen (für Hilfsmittel wie das Periodensystem):
 * Namen („Sauerstoff“, „Natriumchlorid“), Anionen („Chlorid-Ion“) und Ionen-Symbole mit Ladung („Fe³⁺“, „Cl⁻“).
 */
export function elementsIn(text: string, maxZ = 86): number[] {
  const found = new Set<number>();
  // längere Namen zuerst, damit „Kohlenstoff“ nicht als „Kohle…“ o. Ä. halb erkannt wird
  let rest = text;
  for (const e of [...ELEMENTS].filter(x => x.Z <= maxZ).sort((a, b) => b.name.length - a.name.length)) {
    if (rest.includes(e.name)) { found.add(e.Z); rest = rest.split(e.name).join(" "); }
  }
  const low = rest.toLowerCase();
  for (const [sym, stem] of Object.entries(ANION_STEM)) if (low.includes(stem.toLowerCase()) && BY_SYMBOL[sym].Z <= maxZ) found.add(BY_SYMBOL[sym].Z);
  for (const m of text.matchAll(/(?<![A-Za-zÄÖÜäöü])([A-Z][a-z]?)(?=[⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻])/g)) {
    const e = BY_SYMBOL[m[1]];
    if (e && e.Z <= maxZ) found.add(e.Z);
  }
  return [...found];
}
