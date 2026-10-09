// Neutralisation: Metallhydroxid (Lauge) + Säure → Salz + Wasser – mit Ionen-Bausteinen wie in der Ionenbindung.
//   Ba(OH)₂ → Ba²⁺ + 2 OH⁻,  H₃PO₄ → 3 H⁺ + PO₄³⁻,  jedes H⁺ + OH⁻ → H₂O,  Ba²⁺ und PO₄³⁻ bilden das Salz:
//   3 Ba(OH)₂ + 2 H₃PO₄ → Ba₃(PO₄)₂ + 6 H₂O
// Oberstufe zusätzlich schrittweise (mehrprotonige Säuren geben nur einen Teil der H⁺ ab → Hydrogensalze):
//   NaOH + H₃PO₄ → NaH₂PO₄ + H₂O
// Reine Logik ohne UI; Formeln in ASCII ("Ba(OH)2"), Anzeige über toSubscript bzw. <Formula>.

import { tr } from "@lern/i18n";
import { ION_BY_ID, compoundName, formula as saltFormula, ionText, lcm, toSubscript, type Ion } from "./ions.ts";
import type { Equation } from "./reactions.ts";

/** Acetat-Ion für Essigsäure (nur hier gebraucht, nicht im Ionen-Baukasten) */
export const ACETATE: Ion = { id: "CH3COO-", formula: "CH3COO", charge: -1, part: tr("acetat", "acetate"), name: tr("Acetat-Ion", "Acetate ion"), os: true };

/** Säure mit ihren Säurerest-Ionen (Tabelle: einprotonig, zweiprotonig, dreiprotonig) */
export interface ProticAcid {
  id: string;
  /** Name wie in der Tabelle, z. B. „Chlorwasserstoff“ */
  name: string;
  /** zweiter Name, z. B. „Hydrogenchlorid“ */
  alt?: string;
  /** Name der wässrigen Lösung, falls anders (Salzsäure) – für die Wortgleichung */
  aq?: string;
  /** ASCII-Formel, z. B. "H3PO4" */
  formula: string;
  /** Zahl der abgebbaren H⁺ (einprotonig = 1 …) */
  protons: number;
  /** Säurerest nach Abgabe von 1, 2, 3 H⁺ (Index 0 = nach 1 H⁺) – der letzte ist der vollständige Säurerest */
  rests: Ion[];
}

/** Metallhydroxid: gibt in Wasser OH⁻ ab */
export interface Hydroxide {
  id: string;
  /** ASCII-Formel, z. B. "Ba(OH)2" */
  formula: string;
  /** Stoffname, z. B. „Bariumhydroxid“ */
  name: string;
  /** Name der Lauge, falls gebräuchlich (Natronlauge) */
  lauge?: string;
  /** in Wasser kaum löslich – keine typische Lauge (Mg(OH)₂, Al(OH)₃) */
  poor?: boolean;
  cation: Ion;
  /** nur Oberstufe */
  os?: boolean;
}

const ionId = (formula: string, charge: number) => `${formula}${Math.abs(charge) > 1 ? Math.abs(charge) : ""}${charge > 0 ? "+" : "-"}`;
/** Säurerest-Ion: vorhandenes Ion aus ions.ts (gleiche Farbe/Name wie in der Ionenbindung) oder neu */
const rest = (formula: string, charge: number, part: string, name: string, en: string): Ion =>
  ION_BY_ID[ionId(formula, charge)] ?? (formula === ACETATE.formula ? ACETATE
    : { id: ionId(formula, charge), formula, charge, part: tr(part, en), name: tr(name, en[0].toUpperCase() + en.slice(1) + " ion"), os: true });

export const PROTIC_ACIDS: ProticAcid[] = [
  // einprotonige Säuren
  { id: "hcl", name: tr("Chlorwasserstoff", "Hydrogen chloride"), alt: tr("Hydrogenchlorid", "Hydrogen chloride"), aq: tr("Salzsäure", "Hydrochloric acid"), formula: "HCl", protons: 1, rests: [rest("Cl", -1, "chlorid", "Chlorid-Ion", "chloride")] },
  { id: "hclo4", name: tr("Perchlorsäure", "Perchloric acid"), formula: "HClO4", protons: 1, rests: [rest("ClO4", -1, "perchlorat", "Perchlorat-Ion", "perchlorate")] },
  { id: "hcooh", name: tr("Ameisensäure", "Formic acid"), formula: "HCOOH", protons: 1, rests: [rest("HCOO", -1, "formiat", "Formiat-Ion", "formate")] },
  { id: "hbr", name: tr("Bromwasserstoff", "Hydrogen bromide"), alt: tr("Hydrogenbromid", "Hydrogen bromide"), aq: tr("Bromwasserstoffsäure", "Hydrobromic acid"), formula: "HBr", protons: 1, rests: [rest("Br", -1, "bromid", "Bromid-Ion", "bromide")] },
  { id: "hno3", name: tr("Salpetersäure", "Nitric acid"), formula: "HNO3", protons: 1, rests: [rest("NO3", -1, "nitrat", "Nitrat-Ion", "nitrate")] },
  { id: "ch3cooh", name: tr("Essigsäure", "Acetic acid"), formula: "CH3COOH", protons: 1, rests: [ACETATE] },
  // zweiprotonige Säuren
  // englisch nicht „hydrogen sulfide“ – so heißt dort auch das Ion HS⁻ (Säurename und Säurerest-Name wären gleich)
  { id: "h2s", name: tr("Schwefelwasserstoff", "Hydrosulfuric acid"), alt: tr("Hydrogensulfid", "Hydrogen sulfide (gas)"), formula: "H2S", protons: 2,
    rests: [rest("HS", -1, "hydrogensulfid", "Hydrogensulfid-Ion", "hydrogen sulfide"), rest("S", -2, "sulfid", "Sulfid-Ion", "sulfide")] },
  { id: "h2so3", name: tr("Schweflige Säure", "Sulfurous acid"), formula: "H2SO3", protons: 2,
    rests: [rest("HSO3", -1, "hydrogensulfit", "Hydrogensulfit-Ion", "hydrogen sulfite"), rest("SO3", -2, "sulfit", "Sulfit-Ion", "sulfite")] },
  { id: "h2so4", name: tr("Schwefelsäure", "Sulfuric acid"), formula: "H2SO4", protons: 2,
    rests: [rest("HSO4", -1, "hydrogensulfat", "Hydrogensulfat-Ion", "hydrogen sulfate"), rest("SO4", -2, "sulfat", "Sulfat-Ion", "sulfate")] },
  { id: "h2co3", name: tr("Kohlensäure", "Carbonic acid"), formula: "H2CO3", protons: 2,
    rests: [rest("HCO3", -1, "hydrogencarbonat", "Hydrogencarbonat-Ion", "hydrogen carbonate"), rest("CO3", -2, "carbonat", "Carbonat-Ion", "carbonate")] },
  // dreiprotonige Säure
  { id: "h3po4", name: tr("Phosphorsäure", "Phosphoric acid"), formula: "H3PO4", protons: 3,
    rests: [rest("H2PO4", -1, "dihydrogenphosphat", "Dihydrogenphosphat-Ion", "dihydrogen phosphate"), rest("HPO4", -2, "hydrogenphosphat", "Hydrogenphosphat-Ion", "hydrogen phosphate"), rest("PO4", -3, "phosphat", "Phosphat-Ion", "phosphate")] },
];

const OH = ION_BY_ID["OH-"];
const hyd = (id: string, cation: string, name: string, lauge?: string, os?: boolean, poor?: boolean): Hydroxide =>
  ({ id, formula: saltFormula(ION_BY_ID[cation], OH), name, lauge, cation: ION_BY_ID[cation], ...(os ? { os } : {}), ...(poor ? { poor } : {}) });

export const HYDROXIDES: Hydroxide[] = [
  hyd("lioh", "Li+", tr("Lithiumhydroxid", "Lithium hydroxide")),
  hyd("naoh", "Na+", tr("Natriumhydroxid", "Sodium hydroxide"), tr("Natronlauge", "Sodium hydroxide solution")),
  hyd("koh", "K+", tr("Kaliumhydroxid", "Potassium hydroxide"), tr("Kalilauge", "Potassium hydroxide solution")),
  hyd("mgoh2", "Mg2+", tr("Magnesiumhydroxid", "Magnesium hydroxide"), undefined, false, true),
  hyd("caoh2", "Ca2+", tr("Calciumhydroxid", "Calcium hydroxide"), tr("Kalkwasser", "Limewater")),
  hyd("baoh2", "Ba2+", tr("Bariumhydroxid", "Barium hydroxide"), tr("Barytwasser", "Baryta water")),
  hyd("aloh3", "Al3+", tr("Aluminiumhydroxid", "Aluminium hydroxide"), undefined, true, true),
];

export const PROTIC_BY_ID: Record<string, ProticAcid> = Object.fromEntries(PROTIC_ACIDS.map(a => [a.id, a]));
export const HYDROXIDE_BY_ID: Record<string, Hydroxide> = Object.fromEntries(HYDROXIDES.map(b => [b.id, b]));
export const hydroxidesFor = (os: boolean) => HYDROXIDES.filter(b => os || !b.os);

/** Säurerest nach Abgabe von `step` H⁺ (Standard: alle) */
export const restOf = (a: ProticAcid, step = a.protons): Ion => a.rests[Math.min(Math.max(step, 1), a.protons) - 1];
/** „einprotonig“, „zweiprotonig“, „dreiprotonig“ */
export const proticWord = (n: number) => tr(["einprotonig", "zweiprotonig", "dreiprotonig"], ["monoprotic", "diprotic", "triprotic"])[n - 1];

/**
 * Salze, die als Produkt einer Neutralisation in Wasser nicht entstehen – mit Grund (die App zeigt ihn, das Quiz fragt sie nicht ab):
 * - Aluminium mit den Säureresten schwacher Säuren (Sulfid, Carbonat, Sulfit und ihre Hydrogen-Formen) zersetzt sich.
 * - Sulfide der Erdalkalimetalle reagieren mit Wasser (MgS + 2 H₂O → Mg(OH)₂ + H₂S; CaS, BaS → Hydrogensulfid + Hydroxid):
 *   aus Ca(OH)₂ bzw. Ba(OH)₂ und H₂S entsteht in Wasser Ca(HS)₂ bzw. Ba(HS)₂, nicht CaS/BaS.
 * - Hydrogensulfat mit Ba²⁺ oder Ca²⁺: HSO₄⁻ gibt in Wasser leicht sein H⁺ ab, BaSO₄ (unlöslich) bzw. CaSO₄ (schwer löslich) fällt aus.
 */
const DECOMPOSES = tr("zersetzt sich in Wasser", "decomposes in water");
const NOT_IN_WATER: Record<string, string> = {
  "Al3+|S2-": DECOMPOSES, "Al3+|HS-": DECOMPOSES, "Al3+|CO32-": DECOMPOSES, "Al3+|HCO3-": DECOMPOSES, "Al3+|SO32-": DECOMPOSES, "Al3+|HSO3-": DECOMPOSES,
  "Mg2+|S2-": DECOMPOSES,
  "Ca2+|S2-": tr("reagiert mit Wasser zu Ca(HS)₂", "reacts with water to Ca(HS)₂"), "Ba2+|S2-": tr("reagiert mit Wasser zu Ba(HS)₂", "reacts with water to Ba(HS)₂"),
  "Ba2+|HSO4-": tr("in Wasser fällt BaSO₄ aus", "BaSO₄ precipitates in water"), "Ca2+|HSO4-": tr("in Wasser fällt CaSO₄ aus", "CaSO₄ precipitates in water"),
};
/** Warum es das Salz aus diesem Hydroxid und Säurerest in Wasser nicht gibt – null, wenn es entsteht */
export const saltProblem = (b: Hydroxide, r: Ion): string | null => NOT_IN_WATER[`${b.cation.id}|${r.id}`] ?? null;
export const isKnownSalt = (b: Hydroxide, r: Ion) => saltProblem(b, r) === null;

export interface NeutralEq {
  base: Hydroxide; acid: ProticAcid;
  /** abgegebene H⁺ je Säure-Formeleinheit (= Ladung des Säurerests) */
  step: number; rest: Ion;
  /** kleinste Anzahlen: nBase Hydroxid + nAcid Säure → 1 Salz + water H₂O */
  nBase: number; nAcid: number; water: number;
  /** Salz: ASCII-Formel und Name */
  salt: string; saltName: string;
  eq: Equation; coeffs: number[];
}

/**
 * Hydroxid + Säure → Salz + Wasser mit kleinsten ganzzahligen Koeffizienten.
 * Jedes H⁺ trifft ein OH⁻: Zahl der OH⁻ = Zahl der H⁺ = Zahl der H₂O = kgV(Ladung des Kations, abgegebene H⁺).
 */
export function neutralEquation(base: Hydroxide, acid: ProticAcid, step = acid.protons): NeutralEq {
  const r = restOf(acid, step), k = -r.charge, q = base.cation.charge;
  const water = lcm(q, k);
  const nBase = water / q, nAcid = water / k;
  const salt = saltFormula(base.cation, r);
  return {
    base, acid, step: k, rest: r, nBase, nAcid, water, salt, saltName: compoundName(base.cation, r),
    eq: { left: [base.formula, acid.formula], right: [salt, "H2O"] }, coeffs: [nBase, nAcid, 1, water],
  };
}

/** Summe der OH⁻ und H⁺ bei nB Hydroxid- und nA Säure-Formeleinheiten */
export function neutralCounts(base: Hydroxide, step: number, nB: number, nA: number) {
  const oh = nB * base.cation.charge, h = nA * step;
  return { oh, h, balanced: oh === h };
}

const coeff = (n: number) => (n === 1 ? "" : `${n} `);
/** Ba(OH)₂ → Ba²⁺ + 2 OH⁻ */
export const hydroxideDissociation = (b: Hydroxide) => `${toSubscript(b.formula)} → ${ionText(b.cation)} + ${coeff(b.cation.charge)}OH⁻`;
/** H₃PO₄ → 3 H⁺ + PO₄³⁻ bzw. schrittweise H₃PO₄ → H⁺ + H₂PO₄⁻ */
export const protolysis = (a: ProticAcid, step = a.protons) => `${toSubscript(a.formula)} → ${coeff(step)}H⁺ + ${ionText(restOf(a, step))}`;
/** Name des Säurerests ohne „-Ion“: „Dihydrogenphosphat“ */
export const restName = (r: Ion) => r.name.replace(/-Ion$| ion$/, "");
/** „Natronlauge + Salzsäure → Natriumchlorid + Wasser“ („schweflige Säure“ mitten in der Zeile klein) */
export const neutralWords = (n: NeutralEq) =>
  `${n.base.lauge ?? n.base.name} + ${(n.acid.aq ?? n.acid.name).replace(/^Schweflige /, "schweflige ")} → ${n.saltName} + ${tr("Wasser", "Water")}`;
