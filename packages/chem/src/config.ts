// Elektronenkonfiguration, Schalen, Ionen und Schreibweisen – reine Funktionen ohne UI.

import { getLang, tr } from "@lern/i18n";
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
/** Unterschalen in Reihenfolge steigender Energie (Madelung-Regel) bis 7p */
export const MADELUNG: Subshell[] = [
  [1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [3, 2], [4, 1], [5, 0], [4, 2], [5, 1], [6, 0], [4, 3], [5, 2], [6, 1],
  [7, 0], [5, 3], [6, 2], [7, 1],
].map(([n, l]) => ({ n, l, max: 2 * (2 * l + 1), key: `${n}${L_NAMES[l]}` }));

/** Aufbauprinzip (Madelung-Regel) – die Regel ohne Ausnahmen */
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

/**
 * Gemessene Grundzustände, die vom Aufbauprinzip abweichen (Z ≤ 86; nur die abweichenden Unterschalen):
 * Cr [Ar] 4s¹ 3d⁵, Cu [Ar] 4s¹ 3d¹⁰, Nb, Mo, Ru, Rh, Pd [Kr] 4d¹⁰, Ag, La [Xe] 6s² 5d¹, Ce, Gd [Xe] 6s² 4f⁷ 5d¹, Pt, Au.
 */
const GROUND_STATE: Record<number, Record<string, number>> = {
  24: { "4s": 1, "3d": 5 }, 29: { "4s": 1, "3d": 10 },
  41: { "5s": 1, "4d": 4 }, 42: { "5s": 1, "4d": 5 }, 44: { "5s": 1, "4d": 7 }, 45: { "5s": 1, "4d": 8 }, 46: { "5s": 0, "4d": 10 }, 47: { "5s": 1, "4d": 10 },
  57: { "4f": 0, "5d": 1 }, 58: { "4f": 1, "5d": 1 }, 64: { "4f": 7, "5d": 1 },
  78: { "6s": 1, "5d": 9 }, 79: { "6s": 1, "5d": 10 },
};
/** Elemente, deren Grundzustand vom Aufbauprinzip abweicht (Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, La, Ce, Gd, Pt, Au) */
export const AUFBAU_EXCEPTIONS: readonly number[] = Object.keys(GROUND_STATE).map(Number);

/**
 * Gemessene Grundzustände von Kationen, die von „zuerst die äußerste Schale abgeben“ abweichen (Schlüssel „Z:Ladung“,
 * nur die abweichenden Unterschalen): V⁺ [Ar] 3d⁴, Co⁺ [Ar] 3d⁸, Ni⁺ [Ar] 3d⁹, Y⁺ [Kr] 5s², La⁺ [Xe] 5d², Ce⁺ [Xe] 4f¹ 5d²,
 * Ce²⁺ [Xe] 4f², Lu⁺ [Xe] 6s² 4f¹⁴, Lu²⁺ [Xe] 6s¹ 4f¹⁴, Hf⁺ [Xe] 6s² 4f¹⁴ 5d¹.
 */
const ION_STATE: Record<string, Record<string, number>> = {
  "23:1": { "4s": 0, "3d": 4 }, "27:1": { "4s": 0, "3d": 8 }, "28:1": { "4s": 0, "3d": 9 }, "39:1": { "5s": 2, "4d": 0 },
  "57:1": { "6s": 0, "5d": 2 }, "58:1": { "6s": 0, "5d": 2 }, "58:2": { "4f": 2, "5d": 0 },
  "71:1": { "6s": 2, "5d": 0 }, "71:2": { "6s": 1, "5d": 0 }, "72:1": { "6s": 2, "5d": 1 },
};

/** Besetzung `cfg` mit einzelnen Unterschalen aus `counts` ersetzt */
const withCounts = (cfg: Occupied[], counts: Record<string, number>) =>
  MADELUNG.map(o => ({ ...o, count: counts[o.key] ?? cfg.find(c => c.key === o.key)?.count ?? 0 })).filter(o => o.count > 0);

/** Grundzustand des neutralen Atoms: Aufbauprinzip, bei den Ausnahmen die gemessene Besetzung */
export function groundState(Z: number): Occupied[] {
  const exc = GROUND_STATE[Z];
  return exc ? withCounts(aufbau(Z), exc) : aufbau(Z);
}

/**
 * Von `start` (neutrales Atom mit Z Elektronen) zu `electrons` Elektronen:
 * Kationen geben von außen nach innen ab – zuerst die äußerste Schale (höchstes n: p vor s),
 * dann (n−1)d, dann (n−2)f → Fe²⁺ = [Ar] 3d⁶, Cu⁺ = [Ar] 3d¹⁰, Eu³⁺ = [Xe] 4f⁶, Pb²⁺ = [Xe] 6s² 4f¹⁴ 5d¹⁰.
 * Anionen: weitere Elektronen in die tiefste noch freie Unterschale (Madelung).
 */
function ionize(start: Occupied[], Z: number, electrons: number): Occupied[] {
  const cfg = MADELUNG.map(o => ({ ...o, count: start.find(c => c.key === o.key)?.count ?? 0 }));
  for (let add = electrons - Z; add > 0; add--) {
    const free = cfg.find(o => o.count < o.max);
    if (!free) break;
    free.count++;
  }
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

/**
 * Elektronenkonfiguration für Z Protonen und `electrons` Elektronen – gemessener Grundzustand
 * (Cr [Ar] 4s¹ 3d⁵, Cu [Ar] 4s¹ 3d¹⁰ …), Ionen von dort aus (Cu⁺ [Ar] 3d¹⁰, Cu²⁺ [Ar] 3d⁹), gemessene Abweichungen wie V⁺ [Ar] 3d⁴.
 */
export function configuration(Z: number, electrons = Z): Occupied[] {
  if (electrons <= 0) return [];
  if (Z <= 0) return aufbau(electrons);
  const cfg = ionize(groundState(Z), Z, electrons), ion = ION_STATE[`${Z}:${Z - electrons}`];
  return ion ? withCounts(cfg, ion) : cfg;
}

/** Konfiguration allein nach dem Aufbauprinzip (ohne gemessene Ausnahmen), Ionen wie bei `configuration` */
export function ruleConfiguration(Z: number, electrons = Z): Occupied[] {
  if (electrons <= 0) return [];
  if (Z <= 0) return aufbau(electrons);
  return ionize(aufbau(Z), Z, electrons);
}

/**
 * Art der Abweichung vom Aufbauprinzip: halb bzw. voll besetzte d-Unterschale, halb besetzte f-Unterschale, sonstige;
 * bei Ionen: „ion“ = das Ion selbst ist gemessen anders besetzt (V⁺), „atom“ = das Atom ist eine Ausnahme, das Ion folgt der Regel (Cu⁺).
 */
export type ConfigException = "d5" | "d10" | "f7" | "other" | "ion" | "atom";
/** Weicht die gemessene Konfiguration vom Aufbauprinzip ab (Cr, Cu, Pd …; Ionen: V⁺, Cu⁺ …)? Sonst null. */
export function configException(Z: number, electrons = Z): ConfigException | null {
  if (electrons !== Z) return ION_STATE[`${Z}:${Z - electrons}`] ? "ion" : GROUND_STATE[Z] ? "atom" : null;
  if (!GROUND_STATE[Z]) return null;
  const real = configuration(Z, electrons), rule = ruleConfiguration(Z, electrons);
  const count = (c: Occupied[], key: string) => c.find(o => o.key === key)?.count ?? 0;
  // gleiche Elektronenzahl: stimmt jede Unterschale von real, ist es dieselbe Konfiguration
  const changed = real.filter(o => count(rule, o.key) !== o.count);
  if (!changed.length) return null;
  if (changed.some(o => o.l === 2 && o.count === 10)) return "d10";
  if (changed.some(o => o.l === 2 && o.count === 5)) return "d5";
  if (changed.some(o => o.l === 3 && o.count === 7)) return "f7";
  return "other";
}

/** Elektronen je Hauptschale (K, L, M, …) */
export function shells(Z: number, electrons = Z): number[] {
  const out: number[] = [];
  for (const o of configuration(Z, electrons)) {
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
/** Ladung in Ionenschreibweise wie im Formelzeichen (Na⁺ → „1+“, O²⁻ → „2−“), neutral „0“ */
export const signed = (v: number) => (v > 0 ? `${v}+` : v < 0 ? `${-v}−` : "0");
/** Zahl mit echtem Minuszeichen für Rechnungen: −1 */
export const minus = (v: number) => (v < 0 ? `−${-v}` : String(v));

export const configString = (cfg: Occupied[]) => cfg.map(o => `${o.key}${sup(o.count)}`).join(" ");

const NOBLE = [2, 10, 18, 36, 54, 86];

/**
 * Edelgas-Kurzschreibweise, z. B. [Ar] 4s² 3d⁶. Ionen mit der Elektronenzahl eines Edelgases ganz als Kern:
 * Na⁺, O²⁻ → [Ne]; Cl⁻, Ca²⁺ → [Ar] (das Edelgas-Atom selbst: Ne = [He] 2s² 2p⁶).
 */
export function shortConfigString(Z: number, electrons = Z): string {
  const cfg = configuration(Z, electrons);
  let core = 0;
  for (const g of NOBLE) {
    if (g > electrons || (g === electrons && Z === electrons)) break;
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

/** Typische Ionenladung der Hauptgruppen (Ion mit Edelgaskonfiguration), sonst null */
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
/**
 * Gruppe in der Schreibweise der Stufe – überall gleich (PSE-Kopf, Steckbrief, Quiz):
 * Unterstufe römische Hauptgruppe („IV. Hauptgruppe“), Oberstufe Gruppe 1–18 („Gruppe 14“).
 */
export function groupLabel(Z: number, os: boolean): string {
  const g = BY_Z[Z]?.group, mg = mainGroupNumber(Z);
  if (g == null) return tr("Lanthanoide", "Lanthanoids");
  if (getLang() === "en") return !os && mg ? `Main group ${ROMAN[mg]}` : `Group ${g}`;
  return !os && mg ? `${ROMAN[mg]}. Hauptgruppe` : `Gruppe ${g}`;
}

/** Namensstamm einatomiger Anionen: Cl → Chlorid, O → Oxid, N → Nitrid … */
const ANION_STEM_DE: Record<string, string> = {
  H: "Hydrid", B: "Borid", C: "Carbid", N: "Nitrid", O: "Oxid", F: "Fluorid", Si: "Silicid", P: "Phosphid", S: "Sulfid",
  Cl: "Chlorid", As: "Arsenid", Se: "Selenid", Br: "Bromid", Te: "Tellurid", I: "Iodid", At: "Astatid",
};
const ANION_STEM_EN: Record<string, string> = {
  H: "Hydride", B: "Boride", C: "Carbide", N: "Nitride", O: "Oxide", F: "Fluoride", Si: "Silicide", P: "Phosphide", S: "Sulfide",
  Cl: "Chloride", As: "Arsenide", Se: "Selenide", Br: "Bromide", Te: "Telluride", I: "Iodide", At: "Astatide",
};
export const ANION_STEM: Record<string, string> = tr(ANION_STEM_DE, ANION_STEM_EN);
/**
 * Name eines einatomigen Ions: Natrium-Ion, Chlorid-Ion, Eisen(III)-Ion.
 * Metalle mit mehreren üblichen Ladungen bekommen die römische Zahl.
 */
export function ionName(Z: number, charge: number): string {
  const el = BY_Z[Z];
  if (!el) return "";
  if (getLang() === "en") {
    if (charge < 0) return ANION_STEM[el.symbol] ? `${ANION_STEM[el.symbol]} ion` : `${el.name} anion`;
    if (charge > 0 && commonCharges(Z).length > 1 && ROMAN[charge]) return `${el.name}(${ROMAN[charge]}) ion`;
    return `${el.name} ion`;
  }
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
  // Symbol vor einer Ladung (Fe³⁺), nicht mitten im Wort; ohne Lookbehind (fehlt in älteren Safari-Versionen)
  for (const m of text.matchAll(/(^|[^A-Za-zÄÖÜäöü])([A-Z][a-z]?)(?=[⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻])/g)) {
    const e = BY_SYMBOL[m[2]];
    if (e && e.Z <= maxZ) found.add(e.Z);
  }
  return [...found];
}
