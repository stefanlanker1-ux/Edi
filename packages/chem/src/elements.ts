// Elementdaten Z = 1–86 (Wasserstoff bis Radon) inkl. Lanthanoide. Namen deutsch oder englisch (Sprache der Oberfläche).

import { tr, getLang } from "@lern/i18n";

export type Category =
  | "alkali" | "earth" | "transition" | "lanthanoid" | "metal"
  | "metalloid" | "nonmetal" | "halogen" | "noble";

export interface Element {
  Z: number;
  symbol: string;
  name: string;
  /** Standardatommasse in u */
  mass: number;
  /** Elektronegativität nach Pauling (null = nicht definiert) */
  en: number | null;
  period: number;
  /** Gruppe 1–18, null für Lanthanoide */
  group: number | null;
  category: Category;
  radioactive: boolean;
}

// [Z, Symbol, Name, Atommasse, Elektronegativität]
const RAW: [number, string, string, number, number | null][] = [
  [1,"H","Wasserstoff",1.008,2.20],   [2,"He","Helium",4.0026,null],
  [3,"Li","Lithium",6.94,0.98],       [4,"Be","Beryllium",9.0122,1.57],
  [5,"B","Bor",10.81,2.04],           [6,"C","Kohlenstoff",12.011,2.55],
  [7,"N","Stickstoff",14.007,3.04],   [8,"O","Sauerstoff",15.999,3.44],
  [9,"F","Fluor",18.998,3.98],        [10,"Ne","Neon",20.180,null],
  [11,"Na","Natrium",22.990,0.93],    [12,"Mg","Magnesium",24.305,1.31],
  [13,"Al","Aluminium",26.982,1.61],  [14,"Si","Silicium",28.085,1.90],
  [15,"P","Phosphor",30.974,2.19],    [16,"S","Schwefel",32.06,2.58],
  [17,"Cl","Chlor",35.45,3.16],       [18,"Ar","Argon",39.948,null],
  [19,"K","Kalium",39.098,0.82],      [20,"Ca","Calcium",40.078,1.00],
  [21,"Sc","Scandium",44.956,1.36],   [22,"Ti","Titan",47.867,1.54],
  [23,"V","Vanadium",50.942,1.63],    [24,"Cr","Chrom",51.996,1.66],
  [25,"Mn","Mangan",54.938,1.55],     [26,"Fe","Eisen",55.845,1.83],
  [27,"Co","Cobalt",58.933,1.88],     [28,"Ni","Nickel",58.693,1.91],
  [29,"Cu","Kupfer",63.546,1.90],     [30,"Zn","Zink",65.38,1.65],
  [31,"Ga","Gallium",69.723,1.81],    [32,"Ge","Germanium",72.630,2.01],
  [33,"As","Arsen",74.922,2.18],      [34,"Se","Selen",78.971,2.55],
  [35,"Br","Brom",79.904,2.96],       [36,"Kr","Krypton",83.798,3.00],
  [37,"Rb","Rubidium",85.468,0.82],   [38,"Sr","Strontium",87.62,0.95],
  [39,"Y","Yttrium",88.906,1.22],     [40,"Zr","Zirconium",91.224,1.33],
  [41,"Nb","Niob",92.906,1.60],       [42,"Mo","Molybdän",95.95,2.16],
  [43,"Tc","Technetium",98,1.90],     [44,"Ru","Ruthenium",101.07,2.20],
  [45,"Rh","Rhodium",102.91,2.28],    [46,"Pd","Palladium",106.42,2.20],
  [47,"Ag","Silber",107.87,1.93],     [48,"Cd","Cadmium",112.41,1.69],
  [49,"In","Indium",114.82,1.78],     [50,"Sn","Zinn",118.71,1.96],
  [51,"Sb","Antimon",121.76,2.05],    [52,"Te","Tellur",127.60,2.10],
  [53,"I","Iod",126.90,2.66],         [54,"Xe","Xenon",131.29,2.60],
  [55,"Cs","Caesium",132.91,0.79],    [56,"Ba","Barium",137.33,0.89],
  [57,"La","Lanthan",138.91,1.10],    [58,"Ce","Cer",140.12,1.12],
  [59,"Pr","Praseodym",140.91,1.13],  [60,"Nd","Neodym",144.24,1.14],
  [61,"Pm","Promethium",145,1.13],    [62,"Sm","Samarium",150.36,1.17],
  [63,"Eu","Europium",151.96,1.20],   [64,"Gd","Gadolinium",157.25,1.20],
  [65,"Tb","Terbium",158.93,1.10],    [66,"Dy","Dysprosium",162.50,1.22],
  [67,"Ho","Holmium",164.93,1.23],    [68,"Er","Erbium",167.26,1.24],
  [69,"Tm","Thulium",168.93,1.25],    [70,"Yb","Ytterbium",173.05,1.10],
  [71,"Lu","Lutetium",174.97,1.27],   [72,"Hf","Hafnium",178.49,1.30],
  [73,"Ta","Tantal",180.95,1.50],     [74,"W","Wolfram",183.84,2.36],
  [75,"Re","Rhenium",186.21,1.90],    [76,"Os","Osmium",190.23,2.20],
  [77,"Ir","Iridium",192.22,2.20],    [78,"Pt","Platin",195.08,2.28],
  [79,"Au","Gold",196.97,2.54],       [80,"Hg","Quecksilber",200.59,2.00],
  [81,"Tl","Thallium",204.38,1.62],   [82,"Pb","Blei",207.2,2.33],
  [83,"Bi","Bismut",208.98,2.02],     [84,"Po","Polonium",209,2.00],
  [85,"At","Astat",210,2.20],         [86,"Rn","Radon",222,2.20],
];

/** englische Namen je Ordnungszahl */
const EN_NAMES = ["Hydrogen", "Helium", "Lithium", "Beryllium", "Boron", "Carbon", "Nitrogen", "Oxygen", "Fluorine", "Neon", "Sodium", "Magnesium", "Aluminium", "Silicon", "Phosphorus", "Sulfur", "Chlorine", "Argon", "Potassium", "Calcium", "Scandium", "Titanium", "Vanadium", "Chromium", "Manganese", "Iron", "Cobalt", "Nickel", "Copper", "Zinc", "Gallium", "Germanium", "Arsenic", "Selenium", "Bromine", "Krypton", "Rubidium", "Strontium", "Yttrium", "Zirconium", "Niobium", "Molybdenum", "Technetium", "Ruthenium", "Rhodium", "Palladium", "Silver", "Cadmium", "Indium", "Tin", "Antimony", "Tellurium", "Iodine", "Xenon", "Caesium", "Barium", "Lanthanum", "Cerium", "Praseodymium", "Neodymium", "Promethium", "Samarium", "Europium", "Gadolinium", "Terbium", "Dysprosium", "Holmium", "Erbium", "Thulium", "Ytterbium", "Lutetium", "Hafnium", "Tantalum", "Tungsten", "Rhenium", "Osmium", "Iridium", "Platinum", "Gold", "Mercury", "Thallium", "Lead", "Bismuth", "Polonium", "Astatine", "Radon"];

// Elemente ohne stabiles Isotop
const RADIOACTIVE = new Set([43, 61, 84, 85, 86]);

const PERIOD_START = [1, 3, 11, 19, 37, 55, 87];
function periodOf(Z: number): number {
  let p = 0;
  while (p < PERIOD_START.length && Z >= PERIOD_START[p]) p++;
  return p;
}
function groupOf(Z: number): number | null {
  const p = periodOf(Z);
  if (Z === 1) return 1;
  if (Z === 2) return 18;
  if (p <= 3) {
    const i = Z - PERIOD_START[p - 1];
    return i < 2 ? i + 1 : i + 11;
  }
  if (p === 4 || p === 5) return Z - PERIOD_START[p - 1] + 1;
  if (Z <= 56) return Z - 54;
  if (Z <= 71) return null; // Lanthanoide
  return Z - 68;
}

const SETS: Partial<Record<Category, number[]>> = {
  alkali: [3, 11, 19, 37, 55],
  earth: [4, 12, 20, 38, 56],
  noble: [2, 10, 18, 36, 54, 86],
  halogen: [9, 17, 35, 53, 85],
  metalloid: [5, 14, 32, 33, 51, 52],
  nonmetal: [1, 6, 7, 8, 15, 16, 34],
};

function categoryOf(Z: number, group: number | null): Category {
  for (const [k, list] of Object.entries(SETS)) if (list!.includes(Z)) return k as Category;
  if (group === null) return "lanthanoid";
  if (group >= 3 && group <= 12) return "transition";
  return "metal";
}

export const CATEGORIES: Record<Category, { label: string; kind: "Metall" | "Halbmetall" | "Nichtmetall" }> = {
  alkali: { label: tr("Alkalimetalle", "Alkali metals"), kind: "Metall" },
  earth: { label: tr("Erdalkalimetalle", "Alkaline earth metals"), kind: "Metall" },
  transition: { label: tr("Übergangsmetalle", "Transition metals"), kind: "Metall" },
  lanthanoid: { label: tr("Lanthanoide", "Lanthanoids"), kind: "Metall" },
  metal: { label: tr("Weitere Metalle", "Other metals"), kind: "Metall" },
  metalloid: { label: tr("Halbmetalle", "Metalloids"), kind: "Halbmetall" },
  nonmetal: { label: tr("Nichtmetalle", "Non-metals"), kind: "Nichtmetall" },
  halogen: { label: tr("Halogene", "Halogens"), kind: "Nichtmetall" },
  noble: { label: tr("Edelgase", "Noble gases"), kind: "Nichtmetall" },
};

export const GROUP_NAMES: Record<number, string> = {
  1: tr("Alkalimetalle", "Alkali metals"), 2: tr("Erdalkalimetalle", "Alkaline earth metals"), 13: tr("Borgruppe", "Boron group"),
  14: tr("Kohlenstoffgruppe", "Carbon group"), 15: tr("Stickstoffgruppe", "Nitrogen group"), 16: tr("Chalkogene", "Chalcogens"),
  17: tr("Halogene", "Halogens"), 18: tr("Edelgase", "Noble gases"),
};

/** Name der Gruppe (Alkalimetalle, Halogene …) oder null – Wasserstoff steht in Gruppe 1, ist aber kein Alkalimetall */
export const groupName = (Z: number): string | null => {
  const g = BY_Z[Z]?.group;
  return Z === 1 || g == null ? null : GROUP_NAMES[g] ?? null;
};

/** Elemente mit männlichem Namen (der Wasserstoff, Kohlenstoff, Stickstoff, Sauerstoff, Phosphor, Schwefel) – alle übrigen sind sächlich */
const MASCULINE = new Set([1, 6, 7, 8, 15, 16]);
/** Personalpronomen für einen Elementnamen am Satzanfang: „Er“ (Sauerstoff) bzw. „Es“ (Natrium); englisch „It“ */
export const elementPronoun = (Z: number) => tr(MASCULINE.has(Z) ? "Er" : "Es", "It");

export const ELEMENTS: Element[] = RAW.map(([Z, symbol, name, mass, en]) => {
  const period = periodOf(Z);
  const group = groupOf(Z);
  return { Z, symbol, name: tr(name, EN_NAMES[Z - 1]), mass, en, period, group, category: categoryOf(Z, group), radioactive: RADIOACTIVE.has(Z) };
});

export const BY_Z: Record<number, Element> = Object.fromEntries(ELEMENTS.map(e => [e.Z, e]));
export const BY_SYMBOL: Record<string, Element> = Object.fromEntries(ELEMENTS.map(e => [e.symbol, e]));
export const MAX_Z = ELEMENTS.length;

const EN_NAME_RE = new RegExp(`\\b(?:${EN_NAMES.join("|")})\\b`, "g");
/**
 * Englisch: Elementnamen mitten im Satz klein – auch am Anfang von Stoffnamen („Which ion does **sodium** form?“, „the formula of **iron(III) oxide**“).
 * Am Satzanfang (auch nach Markdown-Sternchen) bleibt der Großbuchstabe. Deutsch bleibt unverändert.
 */
export function namesInSentence(text: string): string {
  if (getLang() !== "en") return text;
  return text.replace(EN_NAME_RE, (w: string, i: number) =>
    /(^|[.!?]\s+|\n\s*)$/.test(text.slice(0, i).replace(/[*„“"'(]+$/, "")) ? w : w[0].toLowerCase() + w.slice(1));
}

/** {@link namesInSentence} für die Sätze einer Quizaufgabe: Frage, Tipp, Erklärung, Rückmeldungen (Antwortoptionen stehen für sich und bleiben) */
export function namesInSentenceTask<T extends { prompt: string; hint?: string; explain?: string; why?: Record<number, string>; traps?: { why?: string }[] }>(t: T): T {
  if (getLang() !== "en") return t;
  const f = namesInSentence;
  return {
    ...t, prompt: f(t.prompt),
    ...(t.hint !== undefined ? { hint: f(t.hint) } : {}),
    ...(t.explain !== undefined ? { explain: f(t.explain) } : {}),
    ...(t.why ? { why: Object.fromEntries(Object.entries(t.why).map(([i, w]) => [i, f(w)])) } : {}),
    ...(t.traps ? { traps: t.traps.map(x => (x.why !== undefined ? { ...x, why: f(x.why) } : x)) } : {}),
  };
}

/** Neutronenzahlen der stabilen Isotope für Z ≤ 20 */
export const STABLE_N: Record<number, number[]> = {
  1: [0, 1], 2: [1, 2], 3: [3, 4], 4: [5], 5: [5, 6], 6: [6, 7], 7: [7, 8], 8: [8, 9, 10],
  9: [10], 10: [10, 11, 12], 11: [12], 12: [12, 13, 14], 13: [14], 14: [14, 15, 16],
  15: [16], 16: [16, 17, 18, 20], 17: [18, 20], 18: [18, 20, 22], 19: [20, 22],
  20: [20, 22, 23, 24, 26, 28],
};

/**
 * Massenzahl des häufigsten natürlichen Isotops (Index = Z − 1); bei Elementen ohne stabiles Isotop
 * das bekannteste bzw. langlebigste (Tc-98, Pm-145, Po-209, At-210, Rn-222).
 * Nicht einfach die gerundete Atommasse: Kupfer 63,55 u → Cu-63 (nicht Cu-64), Brom 79,90 u → Br-79.
 */
const COMMON_A = [
  1, 4, 7, 9, 11, 12, 14, 16, 19, 20, 23, 24, 27, 28, 31, 32, 35, 40, 39, 40,
  45, 48, 51, 52, 55, 56, 59, 58, 63, 64, 69, 74, 75, 80, 79, 84, 85, 88, 89, 90,
  93, 98, 98, 102, 103, 106, 107, 114, 115, 120, 121, 130, 127, 132, 133, 138, 139, 140, 141, 142,
  145, 152, 153, 158, 159, 164, 165, 166, 169, 174, 175, 180, 181, 184, 187, 192, 193, 195, 197, 202,
  205, 208, 209, 209, 210, 222,
];

/** Neutronenzahl des häufigsten Isotops (z. B. Chlor-35 → 18, Kupfer-63 → 34) */
export function standardNeutrons(Z: number): number {
  const A = COMMON_A[Z - 1];
  return A ? A - Z : 0;
}

/** true/false für Z ≤ 20, sonst null (keine Daten) */
export function isStable(Z: number, N: number): boolean | null {
  if (!STABLE_N[Z]) return null;
  return STABLE_N[Z].includes(N);
}

/** Suche nach Name, Symbol oder Ordnungszahl */
/** Art zum Anzeigen (Metall, Halbmetall, Nichtmetall) in der Sprache der Oberfläche */
export const kindLabel = (k: "Metall" | "Halbmetall" | "Nichtmetall") =>
  tr({ Metall: "Metall", Halbmetall: "Halbmetall", Nichtmetall: "Nichtmetall" }, { Metall: "Metal", Halbmetall: "Metalloid", Nichtmetall: "Non-metal" })[k];

export function searchElements(query: string, maxZ = MAX_Z): Element[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const list = ELEMENTS.filter(e => e.Z <= maxZ);
  if (/^\d+$/.test(q)) return list.filter(e => String(e.Z) === q);
  const exact = list.filter(e => e.symbol.toLowerCase() === q);
  const starts = list.filter(e => !exact.includes(e) && e.name.toLowerCase().startsWith(q));
  const contains = list.filter(e => !exact.includes(e) && !starts.includes(e) && e.name.toLowerCase().includes(q));
  return [...exact, ...starts, ...contains];
}
