// Neutralisation: Metallhydroxid (Lauge) + Säure → Salz + Wasser – mit Ionen-Bausteinen wie in der Ionenbindung.
//   Ba(OH)₂ → Ba²⁺ + 2 OH⁻,  H₃PO₄ → 3 H⁺ + PO₄³⁻,  jedes H⁺ + OH⁻ → H₂O,  Ba²⁺ und PO₄³⁻ bilden das Salz:
//   3 Ba(OH)₂ + 2 H₃PO₄ → Ba₃(PO₄)₂ + 6 H₂O
// Oberstufe zusätzlich schrittweise (mehrprotonige Säuren geben nur einen Teil der H⁺ ab → Hydrogensalze):
//   NaOH + H₃PO₄ → NaH₂PO₄ + H₂O
// Reine Logik ohne UI; Formeln in ASCII ("Ba(OH)2"), Anzeige über toSubscript bzw. <Formula>.

import { ION_BY_ID, compoundName, formula as saltFormula, ionText, lcm, toSubscript, type Ion } from "./ions.ts";
import type { Equation } from "./reactions.ts";

/** Acetat-Ion für Essigsäure (nur hier gebraucht, nicht im Ionen-Baukasten) */
export const ACETATE: Ion = { id: "CH3COO-", formula: "CH3COO", charge: -1, part: "acetat", name: "Acetat-Ion", os: true };

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
  cation: Ion;
  /** nur Oberstufe */
  os?: boolean;
}

const ionId = (formula: string, charge: number) => `${formula}${Math.abs(charge) > 1 ? Math.abs(charge) : ""}${charge > 0 ? "+" : "-"}`;
/** Säurerest-Ion: vorhandenes Ion aus ions.ts (gleiche Farbe/Name wie in der Ionenbindung) oder neu */
const rest = (formula: string, charge: number, part: string, name: string): Ion =>
  ION_BY_ID[ionId(formula, charge)] ?? (formula === ACETATE.formula ? ACETATE : { id: ionId(formula, charge), formula, charge, part, name, os: true });

export const PROTIC_ACIDS: ProticAcid[] = [
  // einprotonige Säuren
  { id: "hcl", name: "Chlorwasserstoff", alt: "Hydrogenchlorid", aq: "Salzsäure", formula: "HCl", protons: 1, rests: [rest("Cl", -1, "chlorid", "Chlorid-Ion")] },
  { id: "hclo4", name: "Perchlorsäure", formula: "HClO4", protons: 1, rests: [rest("ClO4", -1, "perchlorat", "Perchlorat-Ion")] },
  { id: "hcooh", name: "Ameisensäure", formula: "HCOOH", protons: 1, rests: [rest("HCOO", -1, "formiat", "Formiat-Ion")] },
  { id: "hbr", name: "Hydrogenbromid", alt: "Bromwasserstoff", aq: "Bromwasserstoffsäure", formula: "HBr", protons: 1, rests: [rest("Br", -1, "bromid", "Bromid-Ion")] },
  { id: "hno3", name: "Salpetersäure", formula: "HNO3", protons: 1, rests: [rest("NO3", -1, "nitrat", "Nitrat-Ion")] },
  { id: "ch3cooh", name: "Essigsäure", formula: "CH3COOH", protons: 1, rests: [ACETATE] },
  // zweiprotonige Säuren
  { id: "h2s", name: "Schwefelwasserstoff", formula: "H2S", protons: 2,
    rests: [rest("HS", -1, "hydrogensulfid", "Hydrogensulfid-Ion"), rest("S", -2, "sulfid", "Sulfid-Ion")] },
  { id: "h2so3", name: "Schweflige Säure", formula: "H2SO3", protons: 2,
    rests: [rest("HSO3", -1, "hydrogensulfit", "Hydrogensulfit-Ion"), rest("SO3", -2, "sulfit", "Sulfit-Ion")] },
  { id: "h2so4", name: "Schwefelsäure", formula: "H2SO4", protons: 2,
    rests: [rest("HSO4", -1, "hydrogensulfat", "Hydrogensulfat-Ion"), rest("SO4", -2, "sulfat", "Sulfat-Ion")] },
  { id: "h2co3", name: "Kohlensäure", formula: "H2CO3", protons: 2,
    rests: [rest("HCO3", -1, "hydrogencarbonat", "Hydrogencarbonat-Ion"), rest("CO3", -2, "carbonat", "Carbonat-Ion")] },
  // dreiprotonige Säure
  { id: "h3po4", name: "Phosphorsäure", formula: "H3PO4", protons: 3,
    rests: [rest("H2PO4", -1, "dihydrogenphosphat", "Dihydrogenphosphat-Ion"), rest("HPO4", -2, "hydrogenphosphat", "Hydrogenphosphat-Ion"), rest("PO4", -3, "phosphat", "Phosphat-Ion")] },
];

const OH = ION_BY_ID["OH-"];
const hyd = (id: string, cation: string, name: string, lauge?: string, os?: boolean): Hydroxide =>
  ({ id, formula: saltFormula(ION_BY_ID[cation], OH), name, lauge, cation: ION_BY_ID[cation], ...(os ? { os } : {}) });

export const HYDROXIDES: Hydroxide[] = [
  hyd("lioh", "Li+", "Lithiumhydroxid"),
  hyd("naoh", "Na+", "Natriumhydroxid", "Natronlauge"),
  hyd("koh", "K+", "Kaliumhydroxid", "Kalilauge"),
  hyd("mgoh2", "Mg2+", "Magnesiumhydroxid"),
  hyd("caoh2", "Ca2+", "Calciumhydroxid", "Kalkwasser"),
  hyd("baoh2", "Ba2+", "Bariumhydroxid", "Barytwasser"),
  hyd("aloh3", "Al3+", "Aluminiumhydroxid", undefined, true),
];

export const PROTIC_BY_ID: Record<string, ProticAcid> = Object.fromEntries(PROTIC_ACIDS.map(a => [a.id, a]));
export const HYDROXIDE_BY_ID: Record<string, Hydroxide> = Object.fromEntries(HYDROXIDES.map(b => [b.id, b]));
export const hydroxidesFor = (os: boolean) => HYDROXIDES.filter(b => os || !b.os);

/** Säurerest nach Abgabe von `step` H⁺ (Standard: alle) */
export const restOf = (a: ProticAcid, step = a.protons): Ion => a.rests[Math.min(Math.max(step, 1), a.protons) - 1];
/** „einprotonig“, „zweiprotonig“, „dreiprotonig“ */
export const proticWord = (n: number) => ["einprotonig", "zweiprotonig", "dreiprotonig"][n - 1];

/**
 * Salze, die es in Wasser nicht gibt (sie zersetzen sich / reagieren mit Wasser): Aluminium mit den Säureresten schwacher Säuren
 * (Sulfid, Carbonat, Sulfit und ihre Hydrogen-Formen). Die App zeigt einen Hinweis, das Quiz fragt sie nicht ab.
 */
const NOT_IN_WATER = new Set(["Al3+|S2-", "Al3+|HS-", "Al3+|CO32-", "Al3+|HCO3-", "Al3+|SO32-", "Al3+|HSO3-"]);
export const isKnownSalt = (b: Hydroxide, r: Ion) => !NOT_IN_WATER.has(`${b.cation.id}|${r.id}`);

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
export const restName = (r: Ion) => r.name.replace(/-Ion$/, "");
/** „Natronlauge + Salzsäure → Natriumchlorid + Wasser“ */
export const neutralWords = (n: NeutralEq) => `${n.base.lauge ?? n.base.name} + ${n.acid.aq ?? n.acid.name} → ${n.saltName} + Wasser`;
