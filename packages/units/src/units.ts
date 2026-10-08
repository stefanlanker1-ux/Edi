// Einheitenkatalog. Jede Grundeinheit („Atom“) gehört zu einer Familie (Länge, Zeit, Masse, …) mit einem Faktor
// zur Familienbasis. Zusammengesetzte Einheiten (km/h, g/cm³, N/cm²) werden aus Atomen mit Exponenten gebildet.
// Definitionen verbinden Familien: 1 l = 1 dm³, 1 a = 100 m², 1 Pa = 1 N/m², 1 J = 1 W·s, 1 Wh = 1 W·h …

import { q, mul, pow, parseQ, type Q } from "./rational.ts";
import { getLang, tr } from "@lern/i18n";

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
  ["len", tr("Länge", "Length"), "1", D(1, 0, 0)],
  ["time", tr("Zeit", "Time"), "1", D(0, 1, 0)],
  ["mass", tr("Masse", "Mass"), "1/1000", D(0, 0, 1)],
  ["vol", tr("Hohlmaß", "Capacity"), "1/1000", D(3, 0, 0)],
  ["ar", tr("Flächenmaß", "Land area"), "100", D(2, 0, 0)],
  ["force", tr("Kraft", "Force"), "1", D(1, -2, 1)],
  ["press", tr("Druck", "Pressure"), "1", D(-1, -2, 1)],
  ["energy", tr("Energie", "Energy"), "1", D(2, -2, 1)],
  ["wh", tr("Energie (Wh)", "Energy (Wh)"), "3600", D(2, -2, 1)],
  ["power", tr("Leistung", "Power"), "1", D(2, -3, 1)],
  ["volt", tr("Spannung", "Voltage"), "1", D(2, -3, 1, -1)],
  ["amp", tr("Stromstärke", "Current"), "1", D(0, 0, 0, 1)],
  ["ohm", tr("Widerstand", "Resistance"), "1", D(2, -3, 1, -2)],
  ["charge", tr("Ladung", "Charge"), "1", D(0, 1, 0, 1)],
  ["ah", tr("Ladung (Ah)", "Charge (Ah)"), "3600", D(0, 1, 0, 1)],
  ["freq", tr("Frequenz", "Frequency"), "1", D(0, -1, 0)],
  ["mol", tr("Stoffmenge", "Amount of substance"), "1", D(0, 0, 0, 0, 1)],
] as [string, string, string, Dim][]).map(([id, name, si, dim]) => [id, { id, name, si: F(si), dim }]));

const A = (sym: string, name: string, fam: string, f: string, extra: Partial<Atom> = {}): Atom => ({ sym, name, fam, f: F(f), ladder: true, ...extra });

export const ATOMS: Atom[] = [
  // Länge
  A("km", tr("Kilometer", "kilometre"), "len", "1000"), A("m", tr("Meter", "metre"), "len", "1"), A("dm", tr("Dezimeter", "decimetre"), "len", "0,1"),
  A("cm", tr("Zentimeter", "centimetre"), "len", "0,01"), A("mm", tr("Millimeter", "millimetre"), "len", "0,001"),
  A("µm", tr("Mikrometer", "micrometre"), "len", "0,000001", { os: true }), A("nm", tr("Nanometer", "nanometre"), "len", "0,000000001", { os: true }),
  // Zeit
  A("d", tr("Tag", "day"), "time", "86400"), A("h", tr("Stunde", "hour"), "time", "3600"), A("min", tr("Minute", "minute"), "time", "60"),
  A("s", tr("Sekunde", "second"), "time", "1"), A("ms", tr("Millisekunde", "millisecond"), "time", "0,001", { os: true }),
  A("µs", tr("Mikrosekunde", "microsecond"), "time", "0,000001", { os: true }), A("ns", tr("Nanosekunde", "nanosecond"), "time", "0,000000001", { os: true }),
  // Masse (Basis g)
  A("t", tr("Tonne", "tonne"), "mass", "1000000"), A("kg", tr("Kilogramm", "kilogram"), "mass", "1000"), A("dag", tr("Dekagramm", "decagram"), "mass", "10"),
  A("g", tr("Gramm", "gram"), "mass", "1"), A("mg", tr("Milligramm", "milligram"), "mass", "0,001"), A("µg", tr("Mikrogramm", "microgram"), "mass", "0,000001", { os: true }),
  // Hohlmaße
  A("hl", tr("Hektoliter", "hectolitre"), "vol", "100"), A("l", tr("Liter", "litre"), "vol", "1", { def: "dm³" }), A("dl", tr("Deziliter", "decilitre"), "vol", "0,1"),
  A("cl", tr("Zentiliter", "centilitre"), "vol", "0,01"), A("ml", tr("Milliliter", "millilitre"), "vol", "0,001", { def: "cm³" }),
  A("µl", tr("Mikroliter", "microlitre"), "vol", "0,000001", { os: true }),
  // Ar und Hektar
  A("ha", tr("Hektar", "hectare"), "ar", "100", { def: "10000 m²" }), A("a", tr("Ar", "are"), "ar", "1", { def: "100 m²" }),
  // Kraft, Druck
  A("kN", tr("Kilonewton", "kilonewton"), "force", "1000", { os: true }), A("N", tr("Newton", "newton"), "force", "1", { os: true }), A("mN", tr("Millinewton", "millinewton"), "force", "0,001", { os: true }),
  A("MPa", tr("Megapascal", "megapascal"), "press", "1000000", { os: true }),
  A("bar", tr("Bar", "bar"), "press", "100000", { os: true }), A("kPa", tr("Kilopascal", "kilopascal"), "press", "1000", { os: true }),
  A("hPa", tr("Hektopascal", "hectopascal"), "press", "100", { os: true }), A("mbar", tr("Millibar", "millibar"), "press", "100", { os: true, ladder: false }),
  A("Pa", tr("Pascal", "pascal"), "press", "1", { os: true, def: "N/m²" }),
  // Energie und Leistung
  A("GJ", tr("Gigajoule", "gigajoule"), "energy", "1000000000", { os: true }), A("MJ", tr("Megajoule", "megajoule"), "energy", "1000000", { os: true }), A("kJ", tr("Kilojoule", "kilojoule"), "energy", "1000", { os: true }),
  A("kcal", tr("Kilokalorie", "kilocalorie"), "energy", "4186,8", { os: true, ladder: false }), A("J", tr("Joule", "joule"), "energy", "1", { os: true, def: "W·s" }),
  A("kWh", tr("Kilowattstunde", "kilowatt hour"), "wh", "1000", { os: true, def: "kW·h" }), A("Wh", tr("Wattstunde", "watt hour"), "wh", "1", { os: true, def: "W·h" }),
  A("GW", tr("Gigawatt", "gigawatt"), "power", "1000000000", { os: true }), A("MW", tr("Megawatt", "megawatt"), "power", "1000000", { os: true }), A("kW", tr("Kilowatt", "kilowatt"), "power", "1000", { os: true }),
  // 1 PS = 75 kp · m/s = 75 · 9,806 65 W = 735,498 75 W (genau; 735,5 W wäre gerundet)
  A("PS", tr("Pferdestärke", "metric horsepower"), "power", "735,49875", { os: true, ladder: false }), A("W", tr("Watt", "watt"), "power", "1", { os: true }),
  A("mW", tr("Milliwatt", "milliwatt"), "power", "0,001", { os: true }),
  // Elektrik
  A("kV", tr("Kilovolt", "kilovolt"), "volt", "1000", { os: true }), A("V", tr("Volt", "volt"), "volt", "1", { os: true }), A("mV", tr("Millivolt", "millivolt"), "volt", "0,001", { os: true }),
  A("A", tr("Ampere", "ampere"), "amp", "1", { os: true }), A("mA", tr("Milliampere", "milliampere"), "amp", "0,001", { os: true }), A("µA", tr("Mikroampere", "microampere"), "amp", "0,000001", { os: true }),
  A("MΩ", tr("Megaohm", "megaohm"), "ohm", "1000000", { os: true }), A("kΩ", tr("Kiloohm", "kiloohm"), "ohm", "1000", { os: true }), A("Ω", tr("Ohm", "ohm"), "ohm", "1", { os: true, def: "V/A" }),
  A("C", tr("Coulomb", "coulomb"), "charge", "1", { os: true, def: "A·s" }),
  A("Ah", tr("Amperestunde", "ampere hour"), "ah", "1", { os: true, def: "A·h" }), A("mAh", tr("Milliamperestunde", "milliampere hour"), "ah", "0,001", { os: true, def: "mA·h" }),
  // Frequenz, Stoffmenge
  A("GHz", tr("Gigahertz", "gigahertz"), "freq", "1000000000", { os: true }), A("MHz", tr("Megahertz", "megahertz"), "freq", "1000000", { os: true }), A("kHz", tr("Kilohertz", "kilohertz"), "freq", "1000", { os: true }), A("Hz", tr("Hertz", "hertz"), "freq", "1", { os: true }),
  A("mol", tr("Mol", "mole"), "mol", "1", { os: true }), A("mmol", tr("Millimol", "millimole"), "mol", "0,001", { os: true }), A("µmol", tr("Mikromol", "micromole"), "mol", "0,000001", { os: true }),
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
  { id: "len", name: tr("Länge", "Length"), kind: "len", units: [...U("km m dm cm mm"), ...U("µm nm", true)], table: ["km", "m", "dm", "cm", "mm"] },
  { id: "area", name: tr("Fläche", "Area"), kind: "area", units: U("km² ha a m² dm² cm² mm²"), table: ["km²", "ha", "a", "m²", "dm²", "cm²", "mm²"] },
  { id: "vol", name: tr("Volumen", "Volume"), kind: "vol", units: [...U("m³ hl dm³ l dl cl cm³ ml mm³"), ...U("µl", true)], table: ["m³", "dm³", "cm³", "mm³"] },
  { id: "mass", name: tr("Masse", "Mass"), kind: "mass", units: [...U("t kg dag g mg"), ...U("µg", true)], table: ["t", "kg", "dag", "g", "mg"] },
  { id: "time", name: tr("Zeit", "Time"), kind: "time", units: [...U("d h min s"), ...U("ms µs ns", true)] },
  { id: "speed", name: tr("Geschwindigkeit", "Speed"), kind: "compound", os: true, hint: tr("v = s / t – Weg durch Zeit", "v = s / t – distance over time"), units: U("m/s km/h km/s m/min cm/s", true) },
  { id: "density", name: tr("Dichte", "Density"), kind: "compound", os: true, hint: tr("ρ = m / V – Masse durch Volumen", "ρ = m / V – mass over volume"), units: U("g/cm³ kg/dm³ kg/m³ g/l kg/l g/ml", true) },
  { id: "pressure", name: tr("Druck", "Pressure"), kind: "compound", os: true, hint: tr("p = F / A – Kraft durch Fläche", "p = F / A – force over area"), units: U("Pa hPa kPa MPa bar mbar N/m² N/cm² N/mm²", true) },
  { id: "force", name: tr("Kraft", "Force"), kind: "compound", os: true, hint: tr("F = m · a", "F = m · a"), units: U("N kN mN", true) },
  { id: "energy", name: tr("Energie", "Energy"), kind: "compound", os: true, hint: tr("E = P · t – Leistung mal Zeit", "E = P · t – power times time"), units: U("J kJ MJ GJ W·s Wh kWh kcal", true) },
  { id: "power", name: tr("Leistung", "Power"), kind: "compound", os: true, hint: tr("P = E / t – Energie durch Zeit", "P = E / t – energy over time"), units: U("W kW MW GW mW PS J/s", true) },
  { id: "voltage", name: tr("Spannung", "Voltage"), kind: "compound", os: true, hint: tr("U – elektrische Spannung", "U – electric voltage"), units: U("V kV mV", true) },
  { id: "current", name: tr("Stromstärke", "Current"), kind: "compound", os: true, hint: tr("I – elektrische Stromstärke", "I – electric current"), units: U("A mA µA", true) },
  { id: "resistance", name: tr("Widerstand", "Resistance"), kind: "compound", os: true, hint: tr("R = U / I – Spannung durch Stromstärke", "R = U / I – voltage over current"), units: U("Ω kΩ MΩ V/A V/mA", true) },
  { id: "charge", name: tr("Ladung", "Charge"), kind: "compound", os: true, hint: tr("Q = I · t – Akku-Kapazität", "Q = I · t – battery capacity"), units: U("C A·s mAh Ah", true) },
  { id: "freq", name: tr("Frequenz", "Frequency"), kind: "compound", os: true, hint: tr("f – Schwingungen pro Sekunde", "f – oscillations per second"), units: U("Hz kHz MHz GHz", true) },
  { id: "conc", name: tr("Konzentration", "Concentration"), kind: "compound", os: true, hint: tr("c = n / V – Stoffmenge durch Volumen", "c = n / V – amount over volume"), units: U("mol/l mmol/l mol/m³ mmol/ml µmol/l", true) },
  { id: "flow", name: tr("Durchfluss", "Flow rate"), kind: "compound", os: true, hint: tr("Volumen pro Zeit", "volume per time"), units: U("l/s l/min l/h m³/h m³/s", true) },
];
export const QUANTITY: Record<string, Quantity> = Object.fromEntries(QUANTITIES.map(x => [x.id, x]));

/** Einheiten einer Größe für die Stufe */
export const unitsFor = (qt: Quantity, os: boolean) => qt.units.filter(u => os || !u.os).map(u => u.sym);
export const quantitiesFor = (os: boolean) => QUANTITIES.filter(x => os || !x.os);

/** Name einer (auch zusammengesetzten) Einheit, z. B. „Kilometer pro Stunde“ */
export function unitName(sym: string): string {
  const { factors } = parseUnit(sym);
  if (getLang() === "en") {
    const w = (f: Factor) => { const p = Math.abs(f.e); return (p === 2 ? "square " : p === 3 ? "cubic " : "") + f.a.name; };
    const n = factors.filter(f => f.e > 0).map(w), d = factors.filter(f => f.e < 0).map(w);
    return (n.length ? n.join("-") : "") + (d.length ? (n.length ? " per " : "per ") + d.join("-") : "");
  }
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
