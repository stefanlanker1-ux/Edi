// Ionen und Ionenverbindungen: Ladungsausgleich, Formeln, Namen.

import { getLang, tr } from "@lern/i18n";
import { BY_Z } from "./elements.ts";
import { chargeSup } from "./config.ts";

export interface Ion {
  /** z. B. "Ca2+", "Cl-", "SO42-" */
  id: string;
  /** Formel ohne Ladung, Ziffern = Indizes, z. B. "SO4", "NH4", "Ca" */
  formula: string;
  charge: number;
  /** Name des Ions, z. B. „Calcium-Ion“, „Sulfat-Ion“ */
  name: string;
  /** Namensteil in der Verbindung: Kation „Calcium“, „Eisen(III)“ – Anion „chlorid“, „sulfat“ */
  part: string;
  /** Ordnungszahl bei einatomigen Ionen (für die Atom-Ansicht) */
  Z?: number;
  /** nur Oberstufe (mehratomige Ionen, Nebengruppen) */
  os?: boolean;
}

const ionId = (formula: string, charge: number) => `${formula}${Math.abs(charge) > 1 ? Math.abs(charge) : ""}${charge > 0 ? "+" : "-"}`;
// Englisch: Kation „Sodium“, Anion „chloride“, Ion „Sodium ion“ / „Chloride ion“
const enName = (en: string) => en[0].toUpperCase() + en.slice(1) + " ion";
const mono = (Z: number, charge: number, part: string, name: string, en: string, os = false): Ion =>
  ({ id: ionId(BY_Z[Z].symbol, charge), formula: BY_Z[Z].symbol, charge, Z, part: tr(part, en), name: tr(name, enName(en)), os });
const poly = (formula: string, charge: number, part: string, name: string, en: string): Ion =>
  ({ id: ionId(formula, charge), formula, charge, part: tr(part, en), name: tr(name, enName(en)), os: true });

export const CATIONS: Ion[] = [
  mono(3, 1, "Lithium", "Lithium-Ion", "Lithium"),
  mono(11, 1, "Natrium", "Natrium-Ion", "Sodium"),
  mono(19, 1, "Kalium", "Kalium-Ion", "Potassium"),
  mono(12, 2, "Magnesium", "Magnesium-Ion", "Magnesium"),
  mono(20, 2, "Calcium", "Calcium-Ion", "Calcium"),
  mono(56, 2, "Barium", "Barium-Ion", "Barium"),
  mono(13, 3, "Aluminium", "Aluminium-Ion", "Aluminium"),
  mono(47, 1, "Silber", "Silber-Ion", "Silver", true),
  mono(30, 2, "Zink", "Zink-Ion", "Zinc", true),
  mono(29, 1, "Kupfer(I)", "Kupfer(I)-Ion", "Copper(I)", true),
  mono(29, 2, "Kupfer(II)", "Kupfer(II)-Ion", "Copper(II)", true),
  mono(26, 2, "Eisen(II)", "Eisen(II)-Ion", "Iron(II)", true),
  mono(26, 3, "Eisen(III)", "Eisen(III)-Ion", "Iron(III)", true),
  mono(82, 2, "Blei(II)", "Blei(II)-Ion", "Lead(II)", true),
  poly("NH4", 1, "Ammonium", "Ammonium-Ion", "Ammonium"),
];

export const ANIONS: Ion[] = [
  mono(9, -1, "fluorid", "Fluorid-Ion", "fluoride"),
  mono(17, -1, "chlorid", "Chlorid-Ion", "chloride"),
  mono(35, -1, "bromid", "Bromid-Ion", "bromide"),
  mono(53, -1, "iodid", "Iodid-Ion", "iodide"),
  mono(8, -2, "oxid", "Oxid-Ion", "oxide"),
  mono(16, -2, "sulfid", "Sulfid-Ion", "sulfide"),
  mono(7, -3, "nitrid", "Nitrid-Ion", "nitride"),
  poly("OH", -1, "hydroxid", "Hydroxid-Ion", "hydroxide"),
  poly("NO2", -1, "nitrit", "Nitrit-Ion", "nitrite"),
  poly("NO3", -1, "nitrat", "Nitrat-Ion", "nitrate"),
  poly("HCO3", -1, "hydrogencarbonat", "Hydrogencarbonat-Ion", "hydrogen carbonate"),
  poly("SO3", -2, "sulfit", "Sulfit-Ion", "sulfite"),
  poly("SO4", -2, "sulfat", "Sulfat-Ion", "sulfate"),
  poly("CO3", -2, "carbonat", "Carbonat-Ion", "carbonate"),
  poly("PO4", -3, "phosphat", "Phosphat-Ion", "phosphate"),
];

export const ION_BY_ID: Record<string, Ion> = Object.fromEntries([...CATIONS, ...ANIONS].map(i => [i.id, i]));

/**
 * Kombinationen, die sich zwar aus den Ladungen aufstellen lassen, als Stoff aber nicht beständig bzw. nicht bekannt sind
 * (z. B. FeI₃ und CuI₂ – Iodid reduziert Fe³⁺/Cu²⁺; Al₂(CO₃)₃, AgOH, (NH₄)₂O). Das Quiz fragt sie nicht ab.
 */
const NOT_KNOWN = new Set([
  "Fe3+|I-", "Cu2+|I-", "Cu+|F-", "Al3+|CO32-", "Fe3+|CO32-", "Cu+|CO32-", "Cu+|NO3-", "Cu+|PO43-",
  "Ag+|OH-", "Cu+|OH-", "NH4+|OH-", "NH4+|O2-", "NH4+|N3-",
  "Cu2+|N3-", "Fe2+|N3-", "Fe3+|N3-", "Pb2+|N3-",
  // Na₃N und K₃N zerfallen schon wenig über Raumtemperatur bzw. darunter (beständig: Li₃N, Mg₃N₂, Ca₃N₂)
  "Na+|N3-", "K+|N3-",
  // Fe₂S₃ zerfällt schon über ca. 20 °C in FeS und Schwefel (beständig: FeS, FeS₂)
  "Fe3+|S2-",
  // Cu⁺ ist in Wasser nicht beständig (Cu₂SO₄ zerfällt in Cu und CuSO₄)
  "Cu+|SO42-", "Cu+|SO32-", "Cu+|NO2-", "Cu+|HCO3-",
  // Nitrit, Sulfit, Hydrogencarbonat: nicht mit Al³⁺, Fe³⁺, Cu²⁺; Nitrit auch nicht mit Fe²⁺, Zn²⁺, Pb²⁺,
  // Hydrogencarbonat nicht mit Ag⁺, Zn²⁺, Pb²⁺ (Eisen(II)-hydrogencarbonat gibt es wie Ca(HCO₃)₂ gelöst, z. B. im Grundwasser)
  "Al3+|NO2-", "Al3+|SO32-", "Al3+|HCO3-", "Fe3+|NO2-", "Fe3+|SO32-", "Fe3+|HCO3-", "Cu2+|NO2-", "Cu2+|SO32-", "Cu2+|HCO3-",
  "Fe2+|NO2-", "Zn2+|NO2-", "Pb2+|NO2-", "Ag+|HCO3-", "Pb2+|HCO3-", "Zn2+|HCO3-",
]);
/** Gibt es diese Ionenverbindung als beständigen Stoff? */
export const isKnownCompound = (cation: Ion, anion: Ion) => !NOT_KNOWN.has(`${cation.id}|${anion.id}`);
export const ionsFor = (list: Ion[], os: boolean) => list.filter(i => os || !i.os);

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
export const lcm = (a: number, b: number) => (a * b) / gcd(a, b);

/** Anzahl Kationen und Anionen für eine neutrale Verbindung (kleinste ganze Zahlen) */
export function ratio(cation: Ion, anion: Ion): { nC: number; nA: number } {
  const l = lcm(cation.charge, -anion.charge);
  return { nC: l / cation.charge, nA: l / -anion.charge };
}

const isPoly = (ion: Ion) => ion.Z === undefined;
const part = (ion: Ion, n: number) => (n === 1 ? ion.formula : isPoly(ion) ? `(${ion.formula})${n}` : `${ion.formula}${n}`);

/** Summenformel als Text mit Ziffern, z. B. "Al2(SO4)3" – Anzeige mit toSubscript() */
export function formula(cation: Ion, anion: Ion, nC?: number, nA?: number): string {
  const r = ratio(cation, anion);
  return part(cation, nC ?? r.nC) + part(anion, nA ?? r.nA);
}

const SUB: Record<string, string> = { 0: "₀", 1: "₁", 2: "₂", 3: "₃", 4: "₄", 5: "₅", 6: "₆", 7: "₇", 8: "₈", 9: "₉" };
/** "Al2(SO4)3" → "Al₂(SO₄)₃" */
export const toSubscript = (f: string) => f.replace(/\d/g, d => SUB[d]);

/** Ion als Text, z. B. "SO₄²⁻", "Na⁺" */
export function ionText(ion: Ion): string {
  // jede Ladung, auch große Werte wie 7− (Distraktor „bis zur 8 auffüllen“)
  return toSubscript(ion.formula) + chargeSup(ion.charge);
}
/** Ladung als Text, z. B. "2+", "−" */
export const ionChargeText = (charge: number) => (Math.abs(charge) === 1 ? "" : String(Math.abs(charge))) + (charge > 0 ? "+" : "−");

/** Ladung immer mit Zahl, z. B. "1+", "2−" (für Rechnungen wie 2 · (1−) = 2−) */
export const chargeFull = (charge: number) => `${Math.abs(charge)}${charge > 0 ? "+" : "−"}`;

/** Name der Verbindung, z. B. „Calciumchlorid“, „Eisen(III)-oxid“ */
export function compoundName(cation: Ion, anion: Ion): string {
  if (getLang() === "en") return `${cation.part} ${anion.part}`;
  return cation.part.endsWith(")") ? `${cation.part}-${anion.part}` : cation.part + anion.part;
}

/** Zerlegt eine Formel wie "SO4" in Elemente mit Anzahl: [["S",1],["O",4]] */
export function composition(f: string): [string, number][] {
  return [...f.matchAll(/([A-Z][a-z]?)(\d*)/g)].map(m => [m[1], m[2] ? Number(m[2]) : 1]);
}
