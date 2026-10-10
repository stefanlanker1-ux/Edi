// Elementdaten Z = 1–118 (Wasserstoff bis Oganesson) inkl. Lanthanoide und Actinoide. Namen deutsch oder englisch (Sprache der Oberfläche).
// Die Ansichten zeigen meist nur Z = 1–86 (Unterstufe 1–20); die 7. Periode (87–118) nur das große PSE im Atombau (`PeriodicTable period7`).
// Quellen: Namen und Symbole nach IUPAC (deutsch nach Duden/IUPAC-Empfehlung, z. B. „Tenness“), Standardatommassen gekürzt nach CIAAW/IUPAC;
// Elemente ohne Standardatommasse: Massenzahl des langlebigsten bekannten Isotops, wie in gängigen Periodensystemen in eckigen Klammern
// (z. B. Tc 98, Rn 222, Og 294; bei den superschweren Elementen können neue Messungen die Angabe ändern).
// Elektronegativität nach Allred-Rochow (EN = 0,359 · Z_eff / r² + 0,744, r = Kovalenzradius in Å): Hauptgruppen nach A. L. Allred, E. G. Rochow,
// J. Inorg. Nucl. Chem. 5 (1958) 264; Übergangsmetalle und Lanthanoide nach E. J. Little, M. M. Jones, J. Chem. Educ. 37 (1960) 231 –
// Werte mit zwei Stellen, je Element mit mindestens einer weiteren veröffentlichten Tabelle dieser Skala abgeglichen.
// null: Edelgase (schulüblich ohne EN), Lanthanoide ohne abgeglichenen Wert (Nd, Pm, Eu–Tm, Lu) und die 7. Periode (keine abgeglichenen Werte).

import { tr, getLang } from "@lern/i18n";

export type Category =
  | "alkali" | "earth" | "transition" | "lanthanoid" | "metal"
  | "metalloid" | "nonmetal" | "halogen" | "noble" | "actinoid" | "unknown";

/** Art eines Elements; „unbekannt“ für die superschweren Elemente ab Meitnerium (nur einzelne Atome hergestellt, Eigenschaften nicht gemessen) */
export type Kind = "Metall" | "Halbmetall" | "Nichtmetall" | "unbekannt";

export interface Element {
  Z: number;
  symbol: string;
  name: string;
  /** Standardatommasse in u */
  mass: number;
  /** Elektronegativität nach Allred-Rochow (null = nicht definiert bzw. kein abgeglichener Wert, Edelgase ohne EN) */
  en: number | null;
  period: number;
  /** Gruppe 1–18, null für Lanthanoide und Actinoide (f-Block, im PSE in eigenen Zeilen unter der Tabelle) */
  group: number | null;
  category: Category;
  radioactive: boolean;
}

// [Z, Symbol, Name, Atommasse, Elektronegativität]
const RAW: [number, string, string, number, number | null][] = [
  [1,"H","Wasserstoff",1.008,2.20],   [2,"He","Helium",4.0026,null],
  [3,"Li","Lithium",6.94,0.97],       [4,"Be","Beryllium",9.0122,1.47],
  [5,"B","Bor",10.81,2.01],           [6,"C","Kohlenstoff",12.011,2.50],
  [7,"N","Stickstoff",14.007,3.07],   [8,"O","Sauerstoff",15.999,3.50],
  [9,"F","Fluor",18.998,4.10],        [10,"Ne","Neon",20.180,null],
  [11,"Na","Natrium",22.990,1.01],    [12,"Mg","Magnesium",24.305,1.23],
  [13,"Al","Aluminium",26.982,1.47],  [14,"Si","Silicium",28.085,1.74],
  [15,"P","Phosphor",30.974,2.06],    [16,"S","Schwefel",32.06,2.44],
  [17,"Cl","Chlor",35.45,2.83],       [18,"Ar","Argon",39.948,null],
  [19,"K","Kalium",39.098,0.91],      [20,"Ca","Calcium",40.078,1.04],
  [21,"Sc","Scandium",44.956,1.20],   [22,"Ti","Titan",47.867,1.32],
  [23,"V","Vanadium",50.942,1.45],    [24,"Cr","Chrom",51.996,1.56],
  [25,"Mn","Mangan",54.938,1.60],     [26,"Fe","Eisen",55.845,1.64],
  [27,"Co","Cobalt",58.933,1.70],     [28,"Ni","Nickel",58.693,1.75],
  [29,"Cu","Kupfer",63.546,1.75],     [30,"Zn","Zink",65.38,1.66],
  [31,"Ga","Gallium",69.723,1.82],    [32,"Ge","Germanium",72.630,2.02],
  [33,"As","Arsen",74.922,2.20],      [34,"Se","Selen",78.971,2.48],
  [35,"Br","Brom",79.904,2.74],       [36,"Kr","Krypton",83.798,null],
  [37,"Rb","Rubidium",85.468,0.89],   [38,"Sr","Strontium",87.62,0.99],
  [39,"Y","Yttrium",88.906,1.11],     [40,"Zr","Zirconium",91.224,1.22],
  [41,"Nb","Niob",92.906,1.23],       [42,"Mo","Molybdän",95.95,1.30],
  [43,"Tc","Technetium",98,1.36],     [44,"Ru","Ruthenium",101.07,1.42],
  [45,"Rh","Rhodium",102.91,1.45],    [46,"Pd","Palladium",106.42,1.35],
  [47,"Ag","Silber",107.87,1.42],     [48,"Cd","Cadmium",112.41,1.46],
  [49,"In","Indium",114.82,1.49],     [50,"Sn","Zinn",118.71,1.72],
  [51,"Sb","Antimon",121.76,1.82],    [52,"Te","Tellur",127.60,2.01],
  [53,"I","Iod",126.90,2.21],         [54,"Xe","Xenon",131.29,null],
  [55,"Cs","Caesium",132.91,0.86],    [56,"Ba","Barium",137.33,0.97],
  [57,"La","Lanthan",138.91,1.08],    [58,"Ce","Cer",140.12,1.08],
  [59,"Pr","Praseodym",140.91,1.07],  [60,"Nd","Neodym",144.24,null],
  [61,"Pm","Promethium",145,null],    [62,"Sm","Samarium",150.36,1.07],
  [63,"Eu","Europium",151.96,null],   [64,"Gd","Gadolinium",157.25,null],
  [65,"Tb","Terbium",158.93,null],    [66,"Dy","Dysprosium",162.50,null],
  [67,"Ho","Holmium",164.93,null],    [68,"Er","Erbium",167.26,null],
  [69,"Tm","Thulium",168.93,null],    [70,"Yb","Ytterbium",173.05,1.06],
  [71,"Lu","Lutetium",174.97,null],   [72,"Hf","Hafnium",178.49,1.23],
  [73,"Ta","Tantal",180.95,1.33],     [74,"W","Wolfram",183.84,1.40],
  [75,"Re","Rhenium",186.21,1.46],    [76,"Os","Osmium",190.23,1.52],
  [77,"Ir","Iridium",192.22,1.55],    [78,"Pt","Platin",195.08,1.44],
  [79,"Au","Gold",196.97,1.42],       [80,"Hg","Quecksilber",200.59,1.44],
  [81,"Tl","Thallium",204.38,1.44],   [82,"Pb","Blei",207.2,1.55],
  [83,"Bi","Bismut",208.98,1.67],     [84,"Po","Polonium",209,1.76],
  [85,"At","Astat",210,1.90],         [86,"Rn","Radon",222,null],
  // 7. Periode: alle radioaktiv. Th, Pa, U mit Standardatommasse (CIAAW), sonst Massenzahl des langlebigsten Isotops.
  // EN (Allred-Rochow) für die 7. Periode nicht abgeglichen → null.
  [87,"Fr","Francium",223,null],      [88,"Ra","Radium",226,null],
  [89,"Ac","Actinium",227,null],       [90,"Th","Thorium",232.04,null],
  [91,"Pa","Protactinium",231.04,null],[92,"U","Uran",238.03,null],
  [93,"Np","Neptunium",237,null],     [94,"Pu","Plutonium",244,null],
  [95,"Am","Americium",243,null],     [96,"Cm","Curium",247,null],
  [97,"Bk","Berkelium",247,null],     [98,"Cf","Californium",251,null],
  [99,"Es","Einsteinium",252,null],   [100,"Fm","Fermium",257,null],
  [101,"Md","Mendelevium",258,null],  [102,"No","Nobelium",259,null],
  [103,"Lr","Lawrencium",266,null],   [104,"Rf","Rutherfordium",267,null],
  [105,"Db","Dubnium",268,null],      [106,"Sg","Seaborgium",269,null],
  [107,"Bh","Bohrium",270,null],      [108,"Hs","Hassium",269,null],
  [109,"Mt","Meitnerium",278,null],   [110,"Ds","Darmstadtium",281,null],
  [111,"Rg","Roentgenium",282,null],  [112,"Cn","Copernicium",285,null],
  [113,"Nh","Nihonium",286,null],     [114,"Fl","Flerovium",289,null],
  [115,"Mc","Moscovium",290,null],    [116,"Lv","Livermorium",293,null],
  [117,"Ts","Tenness",294,null],      [118,"Og","Oganesson",294,null],
];

/** englische Namen je Ordnungszahl */
const EN_NAMES = ["Hydrogen", "Helium", "Lithium", "Beryllium", "Boron", "Carbon", "Nitrogen", "Oxygen", "Fluorine", "Neon", "Sodium", "Magnesium", "Aluminium", "Silicon", "Phosphorus", "Sulfur", "Chlorine", "Argon", "Potassium", "Calcium", "Scandium", "Titanium", "Vanadium", "Chromium", "Manganese", "Iron", "Cobalt", "Nickel", "Copper", "Zinc", "Gallium", "Germanium", "Arsenic", "Selenium", "Bromine", "Krypton", "Rubidium", "Strontium", "Yttrium", "Zirconium", "Niobium", "Molybdenum", "Technetium", "Ruthenium", "Rhodium", "Palladium", "Silver", "Cadmium", "Indium", "Tin", "Antimony", "Tellurium", "Iodine", "Xenon", "Caesium", "Barium", "Lanthanum", "Cerium", "Praseodymium", "Neodymium", "Promethium", "Samarium", "Europium", "Gadolinium", "Terbium", "Dysprosium", "Holmium", "Erbium", "Thulium", "Ytterbium", "Lutetium", "Hafnium", "Tantalum", "Tungsten", "Rhenium", "Osmium", "Iridium", "Platinum", "Gold", "Mercury", "Thallium", "Lead", "Bismuth", "Polonium", "Astatine", "Radon",
  "Francium", "Radium", "Actinium", "Thorium", "Protactinium", "Uranium", "Neptunium", "Plutonium", "Americium", "Curium", "Berkelium", "Californium",
  "Einsteinium", "Fermium", "Mendelevium", "Nobelium", "Lawrencium", "Rutherfordium", "Dubnium", "Seaborgium", "Bohrium", "Hassium", "Meitnerium",
  "Darmstadtium", "Roentgenium", "Copernicium", "Nihonium", "Flerovium", "Moscovium", "Livermorium", "Tennessine", "Oganesson"];

// Elemente ohne stabiles Isotop (Tc, Pm, ab Po alle)
const RADIOACTIVE = new Set([43, 61, ...Array.from({ length: 118 - 83 }, (_, i) => 84 + i)]);

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
  if (Z <= 86) return Z - 68;
  if (Z <= 88) return Z - 86;
  if (Z <= 103) return null; // Actinoide
  return Z - 100;
}

const SETS: Partial<Record<Category, number[]>> = {
  alkali: [3, 11, 19, 37, 55, 87],
  earth: [4, 12, 20, 38, 56, 88],
  noble: [2, 10, 18, 36, 54, 86],
  halogen: [9, 17, 35, 53, 85],
  metalloid: [5, 14, 32, 33, 51, 52],
  nonmetal: [1, 6, 7, 8, 15, 16, 34],
};

/** ab Meitnerium (Z = 109): Eigenschaften unbekannt (Rf–Hs sind als Übergangsmetalle der Gruppen 4–8 chemisch untersucht) */
const UNKNOWN_FROM = 109;

function categoryOf(Z: number, group: number | null): Category {
  for (const [k, list] of Object.entries(SETS)) if (list!.includes(Z)) return k as Category;
  if (Z >= UNKNOWN_FROM) return "unknown";
  if (group === null) return Z <= 71 ? "lanthanoid" : "actinoid";
  if (group >= 3 && group <= 12) return "transition";
  return "metal";
}

export const CATEGORIES: Record<Category, { label: string; kind: Kind }> = {
  alkali: { label: tr("Alkalimetalle", "Alkali metals"), kind: "Metall" },
  earth: { label: tr("Erdalkalimetalle", "Alkaline earth metals"), kind: "Metall" },
  transition: { label: tr("Übergangsmetalle", "Transition metals"), kind: "Metall" },
  lanthanoid: { label: tr("Lanthanoide", "Lanthanoids"), kind: "Metall" },
  actinoid: { label: tr("Actinoide", "Actinoids"), kind: "Metall" },
  metal: { label: tr("Weitere Metalle", "Other metals"), kind: "Metall" },
  metalloid: { label: tr("Halbmetalle", "Metalloids"), kind: "Halbmetall" },
  nonmetal: { label: tr("Nichtmetalle", "Non-metals"), kind: "Nichtmetall" },
  halogen: { label: tr("Halogene", "Halogens"), kind: "Nichtmetall" },
  noble: { label: tr("Edelgase", "Noble gases"), kind: "Nichtmetall" },
  unknown: { label: tr("Eigenschaften unbekannt", "Properties unknown"), kind: "unbekannt" },
};

/** Name der f-Block-Reihe (Lanthanoide 57–71, Actinoide 89–103), sonst null */
export const fSeriesName = (Z: number): string | null =>
  Z >= 57 && Z <= 71 ? tr("Lanthanoide", "Lanthanoids") : Z >= 89 && Z <= 103 ? tr("Actinoide", "Actinoids") : null;

export const GROUP_NAMES: Record<number, string> = {
  1: tr("Alkalimetalle", "Alkali metals"), 2: tr("Erdalkalimetalle", "Alkaline earth metals"), 13: tr("Borgruppe", "Boron group"),
  14: tr("Kohlenstoffgruppe", "Carbon group"), 15: tr("Stickstoffgruppe", "Nitrogen group"), 16: tr("Chalkogene", "Chalcogens"),
  17: tr("Halogene", "Halogens"), 18: tr("Edelgase", "Noble gases"),
};

/**
 * Name der Gruppe (Alkalimetalle, Halogene …) oder null – Wasserstoff steht in Gruppe 1, ist aber kein Alkalimetall;
 * die superschweren Elemente ab Mt (Eigenschaften unbekannt, z. B. Oganesson in Gruppe 18) bekommen keinen Gruppennamen.
 */
export const groupName = (Z: number): string | null => {
  const e = BY_Z[Z], g = e?.group;
  return Z === 1 || g == null || e.category === "unknown" ? null : GROUP_NAMES[g] ?? null;
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
 * das bekannteste bzw. langlebigste (Tc-98, Pm-145, Po-209, At-210, Rn-222; 7. Periode: Fr-223 … U-238 … Og-294, wie die Atommasse in eckigen Klammern).
 * Nicht einfach die gerundete Atommasse: Kupfer 63,55 u → Cu-63 (nicht Cu-64), Brom 79,90 u → Br-79.
 */
const COMMON_A = [
  1, 4, 7, 9, 11, 12, 14, 16, 19, 20, 23, 24, 27, 28, 31, 32, 35, 40, 39, 40,
  45, 48, 51, 52, 55, 56, 59, 58, 63, 64, 69, 74, 75, 80, 79, 84, 85, 88, 89, 90,
  93, 98, 98, 102, 103, 106, 107, 114, 115, 120, 121, 130, 127, 132, 133, 138, 139, 140, 141, 142,
  145, 152, 153, 158, 159, 164, 165, 166, 169, 174, 175, 180, 181, 184, 187, 192, 193, 195, 197, 202,
  205, 208, 209, 209, 210, 222,
  223, 226, 227, 232, 231, 238, 237, 244, 243, 247, 247, 251, 252, 257, 258, 259, 266, 267, 268, 269,
  270, 269, 278, 281, 282, 285, 286, 289, 290, 293, 294, 294,
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
export const kindLabel = (k: Kind) =>
  tr({ Metall: "Metall", Halbmetall: "Halbmetall", Nichtmetall: "Nichtmetall", unbekannt: "unbekannt" }, { Metall: "Metal", Halbmetall: "Metalloid", Nichtmetall: "Non-metal", unbekannt: "unknown" })[k];

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
