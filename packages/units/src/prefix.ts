// Vorsilben-Skala (Oberstufe): jede Vorsilbe ist eine Zehnerpotenz.
//   n 10⁻⁹ · µ 10⁻⁶ · m 10⁻³ · c 10⁻² · d 10⁻¹ · (Grundeinheit) 10⁰ · da 10¹ · h 10² · k 10³ · M 10⁶ · G 10⁹
// Umrechnungszahl = 10^(Hochzahl vorher − Hochzahl nachher), bei m² bzw. m³ mal 2 bzw. 3:
//   km → mm: 10^(3 − (−3)) = 10⁶,   km² → m²: (10³)² = 10⁶,   µg → mg: 10^(−6 − (−3)) = 10⁻³

import { div, pow10, eq, type Q } from "./rational.ts";
import { unitSi } from "./units.ts";

export interface Prefix { p: string; name: string; exp: number }
export const PREFIXES: Prefix[] = [
  { p: "n", name: "Nano", exp: -9 }, { p: "µ", name: "Mikro", exp: -6 }, { p: "m", name: "Milli", exp: -3 },
  { p: "c", name: "Zenti", exp: -2 }, { p: "d", name: "Dezi", exp: -1 }, { p: "", name: "", exp: 0 },
  { p: "da", name: "Deka", exp: 1 }, { p: "h", name: "Hekto", exp: 2 }, { p: "k", name: "Kilo", exp: 3 },
  { p: "M", name: "Mega", exp: 6 }, { p: "G", name: "Giga", exp: 9 },
];
/** Grundeinheiten, vor die eine Vorsilbe treten kann */
const BASES = ["m", "g", "l", "s", "N", "Pa", "J", "W", "V", "A", "Ω", "Hz", "Wh", "mol", "bar", "Ah"];
const SUP: Record<string, number> = { "²": 2, "³": 3 };

export interface PrefixedUnit { prefix: Prefix; base: string; power: number }

/** „km²“ → Kilo + m, Potenz 2; „dag“ → Deka + g; „h“ (Stunde), „t“, „ha“, „kcal“ → null */
export function splitPrefix(sym: string): PrefixedUnit | null {
  const m = sym.match(/^(.+?)([²³]?)$/)!;
  const body = m[1], power = SUP[m[2]] ?? 1;
  if (BASES.includes(body)) return { prefix: PREFIXES.find(x => x.p === "")!, base: body, power };
  // längere Vorsilben zuerst (da vor d)
  for (const pre of [...PREFIXES].filter(x => x.p).sort((a, b) => b.p.length - a.p.length)) {
    if (body.startsWith(pre.p) && BASES.includes(body.slice(pre.p.length))) return { prefix: pre, base: body.slice(pre.p.length), power };
  }
  return null;
}

export interface PrefixStep {
  from: PrefixedUnit; to: PrefixedUnit;
  /** Hochzahl-Differenz der Vorsilben (vorher − nachher) */
  diff: number;
  /** Hochzahl der Umrechnungszahl = diff · Potenz */
  exp: number;
  /** Ersetzungen vorher (1 l = 1 dm³) */
  alias: string[];
}

/** Hohlmaße als Kubik-Längen, falls die andere Einheit ein m³-Maß ist */
const ALIAS: Record<string, string> = { l: "dm³", ml: "cm³", µl: "mm³" };

/** Umrechnung über die Vorsilben-Skala, wenn beide Einheiten dieselbe Grundeinheit (und Potenz) haben */
export function prefixStep(from: string, to: string): PrefixStep | null {
  let a = splitPrefix(from), b = splitPrefix(to);
  const alias: string[] = [];
  if (a && b && (a.base !== b.base || a.power !== b.power)) {
    // l ↔ m³-Maße: zuerst 1 l = 1 dm³ ersetzen
    if (ALIAS[from] && b.base === "m" && b.power === 3) { a = splitPrefix(ALIAS[from]); alias.push(`1 ${from} = 1 ${ALIAS[from]}`); }
    else if (ALIAS[to] && a.base === "m" && a.power === 3) { b = splitPrefix(ALIAS[to]); alias.push(`1 ${to} = 1 ${ALIAS[to]}`); }
  }
  if (!a || !b || a.base !== b.base || a.power !== b.power) return null;
  const diff = a.prefix.exp - b.prefix.exp;
  const step = { from: a, to: b, diff, exp: diff * a.power, alias };
  // Sicherheit: muss zum Faktor des Katalogs passen
  if (!eq(pow10(step.exp), div(unitSi(from), unitSi(to)))) return null;
  return step;
}

/** 10^k als Bruch */
export const powerOf = (s: PrefixStep): Q => pow10(s.exp);

/** Hochzahl hochgestellt: −6 → „⁻⁶“ */
export function supExp(k: number): string {
  const map: Record<string, string> = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  return String(k).split("").map(c => map[c]).join("");
}
/** Einheit auf der Skala für eine Vorsilbe: Kilo + m² → „km²“, Grundeinheit → „m²“ */
export const unitAt = (pre: Prefix, base: string, power: number) => pre.p + base + (power === 2 ? "²" : power === 3 ? "³" : "");
