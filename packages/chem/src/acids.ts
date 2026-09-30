// Säuren, Basen (Laugen), pH-Wert, Indikatoren, Neutralisation – Unterstufe (Österreich, 4. Klasse).
// Altersgemäß nach Arrhenius: Säuren geben in Wasser H⁺ ab, Laugen enthalten OH⁻; Säure + Lauge → Salz + Wasser.
// Reine Logik ohne UI; Formeln in ASCII (H2SO4, Ca(OH)2), Anzeige über toSubscript.

import { ION_BY_ID, compoundName, formula as saltFormula, ionText, lcm, toSubscript, type Ion } from "./ions.ts";
import { balance, type Equation } from "./reactions.ts";

export interface Acid {
  id: string;
  /** Name der Säure (wässrige Lösung), z. B. „Salzsäure“ */
  name: string;
  /** Name des reinen Stoffs, wenn er anders heißt (Chlorwasserstoff) */
  pure?: string;
  /** ASCII-Formel, z. B. "H2SO4" */
  formula: string;
  /** Zahl der abgebbaren H⁺ */
  protons: number;
  /** id des Säurerest-Ions in ION_BY_ID */
  anion: string;
  /** Wo man ihr begegnet (Stoffebene) */
  everyday: string;
  strong: boolean;
}

export interface Base {
  id: string;
  /** Name der Lauge, z. B. „Natronlauge“ */
  name: string;
  /** Name des gelösten Stoffs, z. B. „Natriumhydroxid“ */
  solid: string;
  formula: string;
  /** Zahl der OH⁻ je Formeleinheit */
  hydroxides: number;
  /** id des Kations in ION_BY_ID */
  cation: string;
  everyday: string;
  strong: boolean;
}

export const ACIDS: Acid[] = [
  { id: "hcl", name: "Salzsäure", pure: "Chlorwasserstoff", formula: "HCl", protons: 1, anion: "Cl-", everyday: "Magensäure, Entkalker", strong: true },
  { id: "h2so4", name: "Schwefelsäure", formula: "H2SO4", protons: 2, anion: "SO42-", everyday: "Autobatterie", strong: true },
  { id: "hno3", name: "Salpetersäure", formula: "HNO3", protons: 1, anion: "NO3-", everyday: "Düngerherstellung", strong: true },
  { id: "h2co3", name: "Kohlensäure", formula: "H2CO3", protons: 2, anion: "CO32-", everyday: "Mineralwasser, Limonade", strong: false },
  { id: "h3po4", name: "Phosphorsäure", formula: "H3PO4", protons: 3, anion: "PO43-", everyday: "Cola", strong: false },
  { id: "ch3cooh", name: "Essigsäure", formula: "CH3COOH", protons: 1, anion: "CH3COO-", everyday: "Speiseessig", strong: false },
];

export const BASES: Base[] = [
  { id: "naoh", name: "Natronlauge", solid: "Natriumhydroxid", formula: "NaOH", hydroxides: 1, cation: "Na+", everyday: "Rohrreiniger, Seifenherstellung", strong: true },
  { id: "koh", name: "Kalilauge", solid: "Kaliumhydroxid", formula: "KOH", hydroxides: 1, cation: "K+", everyday: "Schmierseife", strong: true },
  { id: "caoh2", name: "Kalkwasser", solid: "Calciumhydroxid", formula: "Ca(OH)2", hydroxides: 2, cation: "Ca2+", everyday: "Mörtel, Kalkanstrich", strong: true },
  { id: "mgoh2", name: "Magnesiumhydroxid-Lösung", solid: "Magnesiumhydroxid", formula: "Mg(OH)2", hydroxides: 2, cation: "Mg2+", everyday: "Mittel gegen Sodbrennen", strong: false },
];

/** Acetat-Ion für Essigsäure (nur hier gebraucht, nicht im Ionen-Baukasten) */
export const ACETATE: Ion = { id: "CH3COO-", formula: "CH3COO", charge: -1, part: "acetat", name: "Acetat-Ion", os: true };
const ionById = (id: string): Ion => ION_BY_ID[id] ?? (id === ACETATE.id ? ACETATE : (() => { throw new Error(`Ion unbekannt: ${id}`); })());

export const ACID_BY_ID: Record<string, Acid> = Object.fromEntries(ACIDS.map(a => [a.id, a]));
export const BASE_BY_ID: Record<string, Base> = Object.fromEntries(BASES.map(b => [b.id, b]));

const coeff = (n: number) => (n === 1 ? "" : `${n} `);

/** Säurerest-Ion einer Säure */
export const acidAnion = (a: Acid): Ion => ionById(a.anion);
/** Kation einer Lauge */
export const baseCation = (b: Base): Ion => ionById(b.cation);

/** Dissoziation in Wasser als Text: H₂SO₄ → 2 H⁺ + SO₄²⁻ */
export function acidDissociation(a: Acid): string {
  return `${toSubscript(a.formula)} → ${coeff(a.protons)}H⁺ + ${ionText(acidAnion(a))}`;
}
/** Ca(OH)₂ → Ca²⁺ + 2 OH⁻ */
export function baseDissociation(b: Base): string {
  return `${toSubscript(b.formula)} → ${ionText(baseCation(b))} + ${coeff(b.hydroxides)}OH⁻`;
}

export interface Neutralization {
  acid: Acid; base: Base;
  /** Salz: ASCII-Formel und Name */
  salt: string; saltName: string;
  eq: Equation; coeffs: number[];
  /** Zahl der gebildeten Wassermoleküle = Zahl der H⁺ = Zahl der OH⁻ */
  water: number;
}

/** Säure + Lauge → Salz + Wasser, mit kleinsten ganzzahligen Koeffizienten */
export function neutralize(acid: Acid, base: Base): Neutralization {
  const c = baseCation(base), an = acidAnion(acid);
  const salt = saltFormula(c, an);
  const eq: Equation = { left: [acid.formula, base.formula], right: [salt, "H2O"] };
  const coeffs = balance(eq);
  if (!coeffs) throw new Error(`Neutralisation nicht ausgleichbar: ${acid.id} + ${base.id}`);
  const water = coeffs[3];
  // Kontrolle: H⁺ und OH⁻ müssen sich genau ausgleichen (Stoffmengen-Verhältnis über das kgV)
  const l = lcm(acid.protons, base.hydroxides);
  if (coeffs[0] * acid.protons !== water || coeffs[1] * base.hydroxides !== water || water % l !== 0) throw new Error(`Neutralisation unstimmig: ${acid.id} + ${base.id}`);
  return { acid, base, salt, saltName: compoundName(c, an), eq, coeffs, water };
}

/** „Salzsäure + Natronlauge → Natriumchlorid + Wasser“ */
export const neutralizationWords = (n: Neutralization) => `${n.acid.name} + ${n.base.name} → ${n.saltName} + Wasser`;

// ── pH-Wert ──────────────────────────────────────────────────────────────────

export type PhClass = "sauer" | "neutral" | "basisch";
/** sauer < 7, neutral = 7, basisch > 7 */
export const phClass = (ph: number): PhClass => (ph < 7 ? "sauer" : ph > 7 ? "basisch" : "neutral");
/** Feinere Einteilung: stark sauer 0–2, sauer 3–6, neutral 7, basisch 8–11, stark basisch 12–14 */
export function phLabel(ph: number): string {
  if (ph <= 2) return "stark sauer";
  if (ph < 7) return "schwach sauer";
  if (ph === 7) return "neutral";
  if (ph <= 11) return "schwach basisch";
  return "stark basisch";
}

export interface Substance { name: string; ph: number; /** Säure oder Lauge, die drinsteckt (falls im Lehrstoff) */ contains?: string }
/** Alltagsstoffe mit typischem pH-Wert (gerundete Richtwerte) */
export const SUBSTANCES: Substance[] = [
  { name: "Magensäure", ph: 1, contains: "hcl" },
  { name: "Zitronensaft", ph: 2 },
  { name: "Cola", ph: 3, contains: "h3po4" },
  { name: "Essig", ph: 3, contains: "ch3cooh" },
  { name: "Apfelsaft", ph: 4 },
  { name: "Kaffee", ph: 5 },
  { name: "Regenwasser", ph: 6, contains: "h2co3" },
  { name: "Milch", ph: 6 },
  { name: "Reines Wasser", ph: 7 },
  { name: "Blut", ph: 7 },
  { name: "Meerwasser", ph: 8 },
  { name: "Backpulver-Lösung", ph: 8 },
  { name: "Seifenlauge", ph: 10 },
  { name: "Kalkwasser", ph: 12, contains: "caoh2" },
  { name: "Rohrreiniger", ph: 14, contains: "naoh" },
];

// ── Indikatoren ──────────────────────────────────────────────────────────────

export interface Indicator {
  id: string; name: string;
  /** Farbe bei pH 0–14 (Index = pH) */
  color: (ph: number) => string;
}

const UNIVERSAL = ["rot", "rot", "rot", "orange", "orange", "gelb", "gelbgrün", "grün", "grün", "blaugrün", "blau", "blau", "violett", "violett", "violett"];
export const INDICATORS: Indicator[] = [
  { id: "universal", name: "Universalindikator", color: ph => UNIVERSAL[clampPh(ph)] },
  { id: "lackmus", name: "Lackmus", color: ph => (ph < 7 ? "rot" : ph > 7 ? "blau" : "violett") },
  { id: "phenolphthalein", name: "Phenolphthalein", color: ph => (ph >= 9 ? "pink" : "farblos") },
  { id: "rotkohl", name: "Rotkohlsaft", color: ph => (ph <= 2 ? "rot" : ph < 7 ? "rosa" : ph === 7 ? "violett" : ph <= 11 ? "blau" : "grün") },
];
export const INDICATOR_BY_ID: Record<string, Indicator> = Object.fromEntries(INDICATORS.map(i => [i.id, i]));
const clampPh = (ph: number) => Math.max(0, Math.min(14, Math.round(ph)));
/** Farbe eines Indikators bei einem pH-Wert */
export const indicatorColor = (indicator: string, ph: number) => INDICATOR_BY_ID[indicator].color(clampPh(ph));

/** Was der pH-Wert über die Teilchen sagt: sauer = mehr H⁺ als OH⁻ usw. */
export function ionsAtPh(ph: number): { more: "H⁺" | "OH⁻" | null } {
  const c = phClass(ph);
  return { more: c === "sauer" ? "H⁺" : c === "basisch" ? "OH⁻" : null };
}

/** Verdünnen mit Wasser: der pH-Wert rückt Richtung 7 (je Zehnerfaktor um 1), erreicht 7 aber nie ganz */
export function dilute(ph: number, factor10: number): number {
  const p = clampPh(ph);
  if (p === 7) return 7;
  return p < 7 ? Math.min(6, p + factor10) : Math.max(8, p - factor10);
}
