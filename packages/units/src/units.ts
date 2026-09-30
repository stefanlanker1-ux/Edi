// Einheitenkatalog. Jede Grundeinheit („Atom“) gehört zu einer Familie (Länge, Zeit, Masse, …) mit einem Faktor
// zur Familienbasis. Zusammengesetzte Einheiten (km/h, g/cm³, N/cm²) werden aus Atomen mit Exponenten gebildet.
// Definitionen verbinden Familien: 1 l = 1 dm³, 1 a = 100 m², 1 Pa = 1 N/m², 1 J = 1 W·s, 1 Wh = 1 W·h …

import { q, mul, pow, parseQ, type Q } from "./rational.ts";

/** Dimension: Länge, Zeit, Masse, Stromstärke, Stoffmenge */
export type Dim = [number, number, number, number, number];

export interface Family { id: string; name: string; si: Q; dim: Dim }
export interface Atom {
  sym: string;
  name: string;
  fam: string;
  /** Faktor zur Familienbasis (km: 1000 bezogen auf m) */
  f: Q;
  /** Definition über andere Familien, z. B. l → "dm³", a → "100 m²", kWh → "kW·h" */
  def?: string;
  /** erscheint in Umrechnungsketten (1 km = 1000 m = 10 000 dm …) */
  ladder?: boolean;
  os?: boolean;
}

const D = (L: number, T: number, M: number, I = 0, N = 0): Dim => [L, T, M, I, N];
const F = (s: string) => parseQ(s)!;

export const FAMILIES: Record<string, Family> = Object.fromEntries(([
  ["len", "Länge", "1", D(1, 0, 0)],
  ["time", "Zeit", "1", D(0, 1, 0)],
  ["mass", "Masse", "1/1000", D(0, 0, 1)],
  ["vol", "Hohlmaß", "1/1000", D(3, 0, 0)],
  ["ar", "Flächenmaß", "100", D(2, 0, 0)],
  ["force", "Kraft", "1", D(1, -2, 1)],
  ["press", "Druck", "1", D(-1, -2, 1)],
  ["energy", "Energie", "1", D(2, -2, 1)],
  ["wh", "Energie (Wh)", "3600", D(2, -2, 1)],
  ["power", "Leistung", "1", D(2, -3, 1)],
  ["volt", "Spannung", "1", D(2, -3, 1, -1)],
  ["amp", "Stromstärke", "1", D(0, 0, 0, 1)],
  ["ohm", "Widerstand", "1", D(2, -3, 1, -2)],
  ["charge", "Ladung", "1", D(0, 1, 0, 1)],
  ["ah", "Ladung (Ah)", "3600", D(0, 1, 0, 1)],
  ["freq", "Frequenz", "1", D(0, -1, 0)],
  ["mol", "Stoffmenge", "1", D(0, 0, 0, 0, 1)],
] as [string, string, string, Dim][]).map(([id, name, si, dim]) => [id, { id, name, si: F(si), dim }]));

const A = (sym: string, name: string, fam: string, f: string, extra: Partial<Atom> = {}): Atom => ({ sym, name, fam, f: F(f), ladder: true, ...extra });

export const ATOMS: Atom[] = [
  // Länge
  A("km", "Kilometer", "len", "1000"), A("m", "Meter", "len", "1"), A("dm", "Dezimeter", "len", "0,1"),
  A("cm", "Zentimeter", "len", "0,01"), A("mm", "Millimeter", "len", "0,001"),
  A("µm", "Mikrometer", "len", "0,000001", { os: true }), A("nm", "Nanometer", "len", "0,000000001", { os: true }),
  // Zeit
  A("d", "Tag", "time", "86400"), A("h", "Stunde", "time", "3600"), A("min", "Minute", "time", "60"),
  A("s", "Sekunde", "time", "1"), A("ms", "Millisekunde", "time", "0,001", { os: true }),
  A("µs", "Mikrosekunde", "time", "0,000001", { os: true }), A("ns", "Nanosekunde", "time", "0,000000001", { os: true }),
  // Masse (Basis g)
  A("t", "Tonne", "mass", "1000000"), A("kg", "Kilogramm", "mass", "1000"), A("dag", "Dekagramm", "mass", "10"),
  A("g", "Gramm", "mass", "1"), A("mg", "Milligramm", "mass", "0,001"), A("µg", "Mikrogramm", "mass", "0,000001", { os: true }),
  // Hohlmaße
  A("hl", "Hektoliter", "vol", "100"), A("l", "Liter", "vol", "1", { def: "dm³" }), A("dl", "Deziliter", "vol", "0,1"),
  A("cl", "Zentiliter", "vol", "0,01"), A("ml", "Milliliter", "vol", "0,001", { def: "cm³" }),
  A("µl", "Mikroliter", "vol", "0,000001", { os: true }),
  // Ar und Hektar
  A("ha", "Hektar", "ar", "100", { def: "10000 m²" }), A("a", "Ar", "ar", "1", { def: "100 m²" }),
  // Kraft, Druck
  A("kN", "Kilonewton", "force", "1000", { os: true }), A("N", "Newton", "force", "1", { os: true }), A("mN", "Millinewton", "force", "0,001", { os: true }),
  A("MPa", "Megapascal", "press", "1000000", { os: true }),
  A("bar", "Bar", "press", "100000", { os: true }), A("kPa", "Kilopascal", "press", "1000", { os: true }),
  A("hPa", "Hektopascal", "press", "100", { os: true }), A("mbar", "Millibar", "press", "100", { os: true, ladder: false }),
  A("Pa", "Pascal", "press", "1", { os: true, def: "N/m²" }),
  // Energie und Leistung
  A("GJ", "Gigajoule", "energy", "1000000000", { os: true }), A("MJ", "Megajoule", "energy", "1000000", { os: true }), A("kJ", "Kilojoule", "energy", "1000", { os: true }),
  A("kcal", "Kilokalorie", "energy", "4186,8", { os: true, ladder: false }), A("J", "Joule", "energy", "1", { os: true, def: "W·s" }),
  A("kWh", "Kilowattstunde", "wh", "1000", { os: true, def: "kW·h" }), A("Wh", "Wattstunde", "wh", "1", { os: true, def: "W·h" }),
  A("GW", "Gigawatt", "power", "1000000000", { os: true }), A("MW", "Megawatt", "power", "1000000", { os: true }), A("kW", "Kilowatt", "power", "1000", { os: true }),
  A("PS", "Pferdestärke", "power", "735,5", { os: true, ladder: false }), A("W", "Watt", "power", "1", { os: true }),
  A("mW", "Milliwatt", "power", "0,001", { os: true }),
  // Elektrik
  A("kV", "Kilovolt", "volt", "1000", { os: true }), A("V", "Volt", "volt", "1", { os: true }), A("mV", "Millivolt", "volt", "0,001", { os: true }),
  A("A", "Ampere", "amp", "1", { os: true }), A("mA", "Milliampere", "amp", "0,001", { os: true }), A("µA", "Mikroampere", "amp", "0,000001", { os: true }),
  A("MΩ", "Megaohm", "ohm", "1000000", { os: true }), A("kΩ", "Kiloohm", "ohm", "1000", { os: true }), A("Ω", "Ohm", "ohm", "1", { os: true, def: "V/A" }),
  A("C", "Coulomb", "charge", "1", { os: true, def: "A·s" }),
  A("Ah", "Amperestunde", "ah", "1", { os: true, def: "A·h" }), A("mAh", "Milliamperestunde", "ah", "0,001", { os: true, def: "mA·h" }),
  // Frequenz, Stoffmenge
  A("GHz", "Gigahertz", "freq", "1000000000", { os: true }), A("MHz", "Megahertz", "freq", "1000000", { os: true }), A("kHz", "Kilohertz", "freq", "1000", { os: true }), A("Hz", "Hertz", "freq", "1", { os: true }),
  A("mol", "Mol", "mol", "1", { os: true }), A("mmol", "Millimol", "mol", "0,001", { os: true }), A("µmol", "Mikromol", "mol", "0,000001", { os: true }),
];
export const ATOM: Record<string, Atom> = Object.fromEntries(ATOMS.map(a => [a.sym, a]));
export const atomSi = (a: Atom) => mul(a.f, FAMILIES[a.fam].si);

/** Faktor einer Einheit aus Atomen: {Atom, Exponent} */
export interface Factor { a: Atom; e: number }

const SUP_E: Record<string, number> = { "²": 2, "³": 3 };
/**
 * Zerlegt eine Einheit in Atome: "km/h" → km¹·h⁻¹, "g/cm³" → g¹·cm⁻³, "W·s" → W¹·s¹, "m²" → m².
 * Optional mit Zahl davor („100 m²“) – die Zahl wird als coef zurückgegeben.
 */
export function parseUnit(text: string): { coef: Q; factors: Factor[] } {
  let s = text.trim(), coef = q(1);
  const m = s.match(/^([\d.,]+)\s+(.*)$/);
  if (m) { coef = parseQ(m[1])!; s = m[2]; }
  const [numS, denS] = s.split("/");
  const factors: Factor[] = [];
  const read = (part: string, sign: number) => {
    for (const tok of part.split("·").map(t => t.trim()).filter(Boolean)) {
      const pm = tok.match(/^(.*?)([²³]?)$/)!;
      const a = ATOM[pm[1]];
      if (!a) throw new Error(`Unbekannte Einheit: ${pm[1]} in ${text}`);
      factors.push({ a, e: sign * (SUP_E[pm[2]] ?? 1) });
    }
  };
  read(numS, 1);
  if (denS) read(denS, -1);
  return { coef, factors };
}

/** Wert einer Einheit in SI-Grundeinheiten (m, s, kg, A, mol) */
export function unitSi(text: string): Q {
  const { coef, factors } = parseUnit(text);
  return factors.reduce((acc, f) => mul(acc, pow(atomSi(f.a), f.e)), coef);
}
export function unitDim(text: string): Dim {
  const out: Dim = [0, 0, 0, 0, 0];
  for (const f of parseUnit(text).factors) FAMILIES[f.a.fam].dim.forEach((v, i) => (out[i] += v * f.e));
  return out;
}

// ── Größen (Auswahl in der App) ─────────────────────────────────────────────

export type Kind = "len" | "area" | "vol" | "mass" | "time" | "compound";
export interface UnitChoice { sym: string; os?: boolean }
export interface Quantity {
  id: string;
  name: string;
  kind: Kind;
  os?: boolean;
  /** Formelzeichen und kurze Erklärung (zusammengesetzte Größen) */
  hint?: string;
  units: UnitChoice[];
  /** Einheiten der Stellenwerttafel (von groß nach klein), falls dezimal */
  table?: string[];
}

const U = (list: string, os = false): UnitChoice[] => list.split(" ").map(sym => ({ sym, os }));

export const QUANTITIES: Quantity[] = [
  { id: "len", name: "Länge", kind: "len", units: [...U("km m dm cm mm"), ...U("µm nm", true)], table: ["km", "m", "dm", "cm", "mm"] },
  { id: "area", name: "Fläche", kind: "area", units: U("km² ha a m² dm² cm² mm²"), table: ["km²", "ha", "a", "m²", "dm²", "cm²", "mm²"] },
  { id: "vol", name: "Volumen", kind: "vol", units: [...U("m³ hl dm³ l dl cl cm³ ml mm³"), ...U("µl", true)], table: ["m³", "dm³", "cm³", "mm³"] },
  { id: "mass", name: "Masse", kind: "mass", units: [...U("t kg dag g mg"), ...U("µg", true)], table: ["t", "kg", "dag", "g", "mg"] },
  { id: "time", name: "Zeit", kind: "time", units: [...U("d h min s"), ...U("ms µs ns", true)] },
  { id: "speed", name: "Geschwindigkeit", kind: "compound", os: true, hint: "v = s / t – Weg durch Zeit", units: U("m/s km/h km/s m/min cm/s", true) },
  { id: "density", name: "Dichte", kind: "compound", os: true, hint: "ρ = m / V – Masse durch Volumen", units: U("g/cm³ kg/dm³ kg/m³ g/l kg/l g/ml", true) },
  { id: "pressure", name: "Druck", kind: "compound", os: true, hint: "p = F / A – Kraft durch Fläche", units: U("Pa hPa kPa MPa bar mbar N/m² N/cm² N/mm²", true) },
  { id: "force", name: "Kraft", kind: "compound", os: true, hint: "F = m · a", units: U("N kN mN", true) },
  { id: "energy", name: "Energie", kind: "compound", os: true, hint: "E = P · t – Leistung mal Zeit", units: U("J kJ MJ GJ W·s Wh kWh kcal", true) },
  { id: "power", name: "Leistung", kind: "compound", os: true, hint: "P = E / t – Energie durch Zeit", units: U("W kW MW GW mW PS J/s", true) },
  { id: "voltage", name: "Spannung", kind: "compound", os: true, hint: "U – elektrische Spannung", units: U("V kV mV", true) },
  { id: "current", name: "Stromstärke", kind: "compound", os: true, hint: "I – elektrische Stromstärke", units: U("A mA µA", true) },
  { id: "resistance", name: "Widerstand", kind: "compound", os: true, hint: "R = U / I – Spannung durch Stromstärke", units: U("Ω kΩ MΩ V/A V/mA", true) },
  { id: "charge", name: "Ladung", kind: "compound", os: true, hint: "Q = I · t – Akku-Kapazität", units: U("C A·s mAh Ah", true) },
  { id: "freq", name: "Frequenz", kind: "compound", os: true, hint: "f – Schwingungen pro Sekunde", units: U("Hz kHz MHz GHz", true) },
  { id: "conc", name: "Konzentration", kind: "compound", os: true, hint: "c = n / V – Stoffmenge durch Volumen", units: U("mol/l mmol/l mol/m³ mmol/ml µmol/l", true) },
  { id: "flow", name: "Durchfluss", kind: "compound", os: true, hint: "Volumen pro Zeit", units: U("l/s l/min l/h m³/h m³/s", true) },
];
export const QUANTITY: Record<string, Quantity> = Object.fromEntries(QUANTITIES.map(x => [x.id, x]));

/** Einheiten einer Größe für die Stufe */
export const unitsFor = (qt: Quantity, os: boolean) => qt.units.filter(u => os || !u.os).map(u => u.sym);
export const quantitiesFor = (os: boolean) => QUANTITIES.filter(x => os || !x.os);

/** Name einer (auch zusammengesetzten) Einheit, z. B. „Kilometer pro Stunde“ */
export function unitName(sym: string): string {
  const { factors } = parseUnit(sym);
  const word = (f: Factor) => {
    const base = f.a.name;
    const p = Math.abs(f.e);
    if (p === 2) return f.a.fam === "len" ? `Quadrat${base.toLowerCase()}` : `${base}²`;
    if (p === 3) return f.a.fam === "len" ? `Kubik${base.toLowerCase()}` : `${base}³`;
    return base;
  };
  const join = (ws: string[]) => ws.map((w, i) => (i ? w.toLowerCase() : w)).join("");
  const num = factors.filter(f => f.e > 0).map(word), den = factors.filter(f => f.e < 0).map(word);
  if (!num.length && den.length) return `pro ${join(den)}`;
  return join(num) + (den.length ? " pro " + join(den) : "");
}

/** Einheitentreppen (von groß nach klein) für Treppe, Veranschaulichung und Stellenwerttafel */
export const LADDERS: Record<string, string[]> = {
  len: ["km", "m", "dm", "cm", "mm", "µm", "nm"],
  area: ["km²", "ha", "a", "m²", "dm²", "cm²", "mm²"],
  vol: ["m³", "dm³", "cm³", "mm³"],
  liter: ["hl", "l", "dl", "cl", "ml", "µl"],
  mass: ["t", "kg", "dag", "g", "mg", "µg"],
  time: ["d", "h", "min", "s", "ms", "µs", "ns"],
};
/** Treppe, auf der beide Einheiten liegen (Volumen: l = dm³, ml = cm³ werden auf die m³-Treppe abgebildet) */
export function ladderFor(from: string, to: string): { id: string; units: string[] } | null {
  const alias: Record<string, string> = { l: "dm³", ml: "cm³" };
  for (const [id, units] of Object.entries(LADDERS)) {
    if (units.includes(from) && units.includes(to)) return { id, units };
  }
  const f = alias[from] ?? from, t = alias[to] ?? to;
  if (LADDERS.vol.includes(f) && LADDERS.vol.includes(t)) return { id: "vol", units: LADDERS.vol };
  return null;
}

const TO_M3: Record<string, string> = { l: "dm³", ml: "cm³", µl: "mm³" };
const TO_L: Record<string, string> = Object.fromEntries(Object.entries(TO_M3).map(([a, b]) => [b, a]));
export interface ChainLadder {
  id: string;
  units: string[];
  /** Lage von Ausgangs- und Zieleinheit auf der Treppe (Hohlmaße ggf. als m³-Maß: l → dm³) */
  from: string; to: string;
  /** benutzte Gleichsetzung, z. B. „1 l = 1 dm³“ */
  notes: string[];
}
/** Einheitentreppe für die Pfeilkette: direkt, sonst Hohlmaße über 1 l = 1 dm³, 1 ml = 1 cm³ */
export function chainFor(from: string, to: string): ChainLadder | null {
  for (const [id, units] of Object.entries(LADDERS)) if (units.includes(from) && units.includes(to)) return { id, units, from, to, notes: [] };
  for (const [id, map] of [["vol", TO_M3], ["liter", TO_L]] as const) {
    const f = LADDERS[id].includes(from) ? from : map[from], t = LADDERS[id].includes(to) ? to : map[to];
    if (f && t && LADDERS[id].includes(f) && LADDERS[id].includes(t)) {
      const notes = [[from, f], [to, t]].filter(([a, b]) => a !== b).map(([a, b]) => `1 ${a} = 1 ${b}`);
      return { id, units: LADDERS[id], from: f, to: t, notes };
    }
  }
  return null;
}
