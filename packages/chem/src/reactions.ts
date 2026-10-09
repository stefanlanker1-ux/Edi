// Reaktionsgleichungen: Formeln zerlegen, Atome zählen, Koeffizienten ausgleichen (kleinste ganze Zahlen).
// Reine Logik ohne UI; Formeln in ASCII (H2O, Ca(OH)2), Anzeige über toSubscript.

import { tr } from "@lern/i18n";
import { toSubscript } from "./ions.ts";
import { BY_SYMBOL } from "./elements.ts";

export type Counts = Record<string, number>;

/** Atome je Element in einer Formel: parseFormula("Ca(OH)2") = { Ca: 1, O: 2, H: 2 }. Tiefgestellte Ziffern werden auch verstanden. */
export function parseFormula(formula: string): Counts {
  const f = formula.replace(/[₀-₉]/g, d => String(d.charCodeAt(0) - 0x2080));
  let i = 0;
  const num = () => { let s = ""; while (i < f.length && /\d/.test(f[i])) s += f[i++]; return s ? Number(s) : 1; };
  const group = (): Counts => {
    const out: Counts = {};
    while (i < f.length && f[i] !== ")") {
      if (f[i] === "(") {
        i++;
        const inner = group();
        i++; // ")"
        const n = num();
        for (const [el, c] of Object.entries(inner)) out[el] = (out[el] ?? 0) + c * n;
      } else if (/[A-Z]/.test(f[i])) {
        let el = f[i++];
        while (i < f.length && /[a-z]/.test(f[i])) el += f[i++];
        out[el] = (out[el] ?? 0) + num();
      } else throw new Error(`Ungültige Formel: ${formula}`);
    }
    return out;
  };
  return group();
}

/** Elemente (Ordnungszahlen) in Formeln, z. B. für das PSE als Hilfsmittel: formulaElements("H3PO4", "Ba(OH)2") → [1, 15, 8, 56] */
export function formulaElements(...formulas: string[]): number[] {
  const zs = formulas.flatMap(f => Object.keys(parseFormula(f)).map(s => BY_SYMBOL[s]?.Z));
  return [...new Set(zs.filter((z): z is number => !!z))];
}

/** Atome je Element auf einer Seite: Σ Koeffizient · Atome der Formel */
export function sideCounts(formulas: string[], coeffs: number[]): Counts {
  const out: Counts = {};
  formulas.forEach((f, k) => {
    for (const [el, c] of Object.entries(parseFormula(f))) out[el] = (out[el] ?? 0) + c * (coeffs[k] ?? 1);
  });
  return out;
}

/** Alle Elemente einer Gleichung in Reihenfolge des Auftretens (links zuerst) */
export function elementsOf(eq: { left: string[]; right: string[] }): string[] {
  const seen: string[] = [];
  for (const f of [...eq.left, ...eq.right]) for (const el of Object.keys(parseFormula(f))) if (!seen.includes(el)) seen.push(el);
  return seen;
}

export interface Equation { left: string[]; right: string[] }

/** Stimmt die Atombilanz für jedes Element? */
export function isBalanced(eq: Equation, coeffs: number[]): boolean {
  const l = sideCounts(eq.left, coeffs.slice(0, eq.left.length));
  const r = sideCounts(eq.right, coeffs.slice(eq.left.length));
  return elementsOf(eq).every(el => (l[el] ?? 0) === (r[el] ?? 0));
}

/** Elemente, deren Bilanz nicht stimmt */
export function unbalancedElements(eq: Equation, coeffs: number[]): string[] {
  const l = sideCounts(eq.left, coeffs.slice(0, eq.left.length));
  const r = sideCounts(eq.right, coeffs.slice(eq.left.length));
  return elementsOf(eq).filter(el => (l[el] ?? 0) !== (r[el] ?? 0));
}

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const gcdAll = (xs: number[]) => xs.reduce((g, x) => gcd(g, x), 0);

/**
 * Kleinste ganzzahlige Koeffizienten (alle ≥ 1), die die Gleichung ausgleichen. null, wenn es keine eindeutige Lösung gibt.
 * Verfahren: Nullraum der Elementmatrix mit Bruchrechnung (Gauß), dann auf ganze Zahlen skalieren und kürzen.
 */
export function balance(eq: Equation): number[] | null {
  const species = [...eq.left, ...eq.right];
  const els = elementsOf(eq);
  // Matrix: Zeile je Element, Spalte je Stoff; Produkte negativ. Brüche als [Zähler, Nenner].
  type Q = [number, number];
  const q = (n: number, d = 1): Q => { const g = gcd(n, d) || 1; const s = d < 0 ? -1 : 1; return [s * n / g, s * d / g]; };
  const sub = (a: Q, b: Q): Q => q(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
  const mul = (a: Q, b: Q): Q => q(a[0] * b[0], a[1] * b[1]);
  const div = (a: Q, b: Q): Q => q(a[0] * b[1], a[1] * b[0]);
  const M: Q[][] = els.map(el => species.map((f, k) => q((parseFormula(f)[el] ?? 0) * (k < eq.left.length ? 1 : -1))));
  const n = species.length;
  const pivots: number[] = [];
  let row = 0;
  for (let col = 0; col < n && row < M.length; col++) {
    const p = M.findIndex((r, i) => i >= row && r[col][0] !== 0);
    if (p < 0) continue;
    [M[row], M[p]] = [M[p], M[row]];
    const pv = M[row][col];
    M[row] = M[row].map(x => div(x, pv));
    for (let i = 0; i < M.length; i++) if (i !== row && M[i][col][0] !== 0) {
      const f = M[i][col];
      M[i] = M[i].map((x, j) => sub(x, mul(f, M[row][j])));
    }
    pivots.push(col);
    row++;
  }
  const free = [...Array(n).keys()].filter(c => !pivots.includes(c));
  if (free.length !== 1) return null; // keine oder mehrere unabhängige Lösungen
  const fc = free[0];
  const sol: Q[] = Array(n).fill(null).map(() => q(0));
  sol[fc] = q(1);
  pivots.forEach((pc, i) => { sol[pc] = q(-M[i][fc][0], M[i][fc][1]); });
  const lcm = sol.reduce((l, x) => l * x[1] / gcd(l, x[1]), 1);
  let ints = sol.map(x => x[0] * lcm / x[1]);
  if (ints.some(x => x < 0)) ints = ints.map(x => -x);
  if (ints.some(x => x <= 0)) return null;
  const g = gcdAll(ints);
  return ints.map(x => x / g);
}

/** Gleichung als Text: 2 H₂ + O₂ → 2 H₂O (Koeffizient 1 wird weggelassen; null = „?“) */
export function equationText(eq: Equation, coeffs?: (number | null)[]): string {
  const side = (fs: string[], off: number) => fs.map((f, k) => {
    const c = coeffs ? coeffs[off + k] : 1;
    return (c === null ? "? " : c === 1 ? "" : `${c} `) + toSubscript(f);
  }).join(" + ");
  return `${side(eq.left, 0)} → ${side(eq.right, eq.left.length)}`;
}

// ── Stoffnamen und Reaktionen der Unterstufe ─────────────────────────────────

const SPECIES_DE: Record<string, string> = {
  H2: "Wasserstoff", O2: "Sauerstoff", N2: "Stickstoff", Cl2: "Chlor", H2O: "Wasser", H2O2: "Wasserstoffperoxid",
  Mg: "Magnesium", MgO: "Magnesiumoxid", Fe: "Eisen", Fe2O3: "Eisen(III)-oxid", FeS: "Eisensulfid", S: "Schwefel",
  Na: "Natrium", NaCl: "Natriumchlorid", C: "Kohlenstoff", CO2: "Kohlendioxid", H2CO3: "Kohlensäure", CO: "Kohlenmonoxid", CH4: "Methan",
  NH3: "Ammoniak", Al: "Aluminium", Al2O3: "Aluminiumoxid", AlCl3: "Aluminiumchlorid", Cu: "Kupfer", CuO: "Kupferoxid",
  CaCO3: "Calciumcarbonat (Kalk)", CaO: "Calciumoxid", Zn: "Zink", HCl: "Chlorwasserstoff", ZnCl2: "Zinkchlorid",
  MgCl2: "Magnesiumchlorid", K: "Kalium", KOH: "Kaliumhydroxid", NaOH: "Natriumhydroxid", SO2: "Schwefeldioxid",
  H2S: "Schwefelwasserstoff", C3H8: "Propan", C2H6: "Ethan", HgO: "Quecksilberoxid", Hg: "Quecksilber", P: "Phosphor",
  P2O5: "Phosphorpentoxid", Ca: "Calcium", "Ca(OH)2": "Calciumhydroxid", Ag2O: "Silberoxid", Ag: "Silber", Li: "Lithium",
  LiOH: "Lithiumhydroxid", ZnO: "Zinkoxid", ZnS: "Zinksulfid", CuS: "Kupfersulfid", SO3: "Schwefeltrioxid", NO: "Stickstoffmonoxid",
  N2O: "Lachgas",
  // Niveau 3–4 der Unterstufe
  Na2O: "Natriumoxid", C2H5OH: "Ethanol (Alkohol)", C5H12: "Pentan", C4H10: "Butan", C2H2: "Ethin (Acetylen)", C6H12O6: "Traubenzucker (Glucose)",
  Fe3O4: "Eisen(II,III)-oxid (Magnetit)", FeCl3: "Eisen(III)-chlorid",
  // Oberstufe
  BaCl2: "Bariumchlorid", Na2SO4: "Natriumsulfat", BaSO4: "Bariumsulfat", AgNO3: "Silbernitrat", AgCl: "Silberchlorid", NaNO3: "Natriumnitrat",
  CuSO4: "Kupfer(II)-sulfat", FeSO4: "Eisen(II)-sulfat", H2SO4: "Schwefelsäure", CaCl2: "Calciumchlorid", KClO3: "Kaliumchlorat", KCl: "Kaliumchlorid",
  NaHCO3: "Natriumhydrogencarbonat (Natron)", Na2CO3: "Natriumcarbonat (Soda)", "Pb(NO3)2": "Blei(II)-nitrat", KI: "Kaliumiodid", PbI2: "Blei(II)-iodid",
  KNO3: "Kaliumnitrat", H3PO4: "Phosphorsäure", Na3PO4: "Natriumphosphat", HNO3: "Salpetersäure", "Ca(NO3)2": "Calciumnitrat",
  NO2: "Stickstoffdioxid", NaClO: "Natriumhypochlorit", P4: "Phosphor (weiß)", P4O10: "Tetraphosphordecaoxid (Phosphorpentoxid)",
  "Al2(SO4)3": "Aluminiumsulfat", "Ca3(PO4)2": "Calciumphosphat", CaSO4: "Calciumsulfat", CH3OH: "Methanol", MnO2: "Mangan(IV)-oxid (Braunstein)",
  MnCl2: "Mangan(II)-chlorid", "Cu(NO3)2": "Kupfer(II)-nitrat", KMnO4: "Kaliumpermanganat", FeS2: "Eisen(II)-disulfid (Pyrit)", C8H18: "Oktan (Benzin)",
  K2Cr2O7: "Kaliumdichromat", CrCl3: "Chrom(III)-chlorid",
  // Übungen (nur Moleküle)
  F2: "Fluor", HF: "Fluorwasserstoff", Br2: "Brom", HBr: "Bromwasserstoff", I2: "Iod", HI: "Iodwasserstoff", CS2: "Schwefelkohlenstoff",
  N2H4: "Hydrazin", PCl3: "Phosphortrichlorid", C2H4: "Ethen",
  CH2Cl2: "Dichlormethan", CHCl3: "Trichlormethan (Chloroform)", CCl4: "Tetrachlormethan", CH3CHO: "Ethanal", CH3COOH: "Essigsäure",
  CH2O: "Methanal (Formaldehyd)", HCOOH: "Ameisensäure", "CO(NH2)2": "Harnstoff", CH3COCH3: "Aceton", C6H6: "Benzol",
  HCN: "Cyanwasserstoff (Blausäure)", PH3: "Phosphan", NH2CH2COOH: "Glycin",
  // Gemische
  O3: "Ozon", He: "Helium", Ne: "Neon", Ar: "Argon", C12H26: "Dodecan (Öl)", C12H22O11: "Saccharose (Zucker)",
};

const SPECIES_EN: Record<string, string> = {
  H2: "Hydrogen", O2: "Oxygen", N2: "Nitrogen", Cl2: "Chlorine", H2O: "Water", H2O2: "Hydrogen peroxide",
  Mg: "Magnesium", MgO: "Magnesium oxide", Fe: "Iron", Fe2O3: "Iron(III) oxide", FeS: "Iron sulfide", S: "Sulfur",
  Na: "Sodium", NaCl: "Sodium chloride", C: "Carbon", CO2: "Carbon dioxide", H2CO3: "Carbonic acid", CO: "Carbon monoxide", CH4: "Methane",
  NH3: "Ammonia", Al: "Aluminium", Al2O3: "Aluminium oxide", AlCl3: "Aluminium chloride", Cu: "Copper", CuO: "Copper oxide",
  CaCO3: "Calcium carbonate (limestone)", CaO: "Calcium oxide", Zn: "Zinc", HCl: "Hydrogen chloride", ZnCl2: "Zinc chloride",
  MgCl2: "Magnesium chloride", K: "Potassium", KOH: "Potassium hydroxide", NaOH: "Sodium hydroxide", SO2: "Sulfur dioxide",
  H2S: "Hydrogen sulfide", C3H8: "Propane", C2H6: "Ethane", HgO: "Mercury oxide", Hg: "Mercury", P: "Phosphorus",
  P2O5: "Phosphorus pentoxide", Ca: "Calcium", "Ca(OH)2": "Calcium hydroxide", Ag2O: "Silver oxide", Ag: "Silver", Li: "Lithium",
  LiOH: "Lithium hydroxide", ZnO: "Zinc oxide", ZnS: "Zinc sulfide", CuS: "Copper sulfide", SO3: "Sulfur trioxide", NO: "Nitrogen monoxide",
  N2O: "Laughing gas",
  Na2O: "Sodium oxide", C2H5OH: "Ethanol (alcohol)", C5H12: "Pentane", C4H10: "Butane", C2H2: "Ethyne (acetylene)", C6H12O6: "Glucose",
  Fe3O4: "Iron(II,III) oxide (magnetite)", FeCl3: "Iron(III) chloride",
  BaCl2: "Barium chloride", Na2SO4: "Sodium sulfate", BaSO4: "Barium sulfate", AgNO3: "Silver nitrate", AgCl: "Silver chloride", NaNO3: "Sodium nitrate",
  CuSO4: "Copper(II) sulfate", FeSO4: "Iron(II) sulfate", H2SO4: "Sulfuric acid", CaCl2: "Calcium chloride", KClO3: "Potassium chlorate", KCl: "Potassium chloride",
  NaHCO3: "Sodium hydrogen carbonate (baking soda)", Na2CO3: "Sodium carbonate (soda)", "Pb(NO3)2": "Lead(II) nitrate", KI: "Potassium iodide", PbI2: "Lead(II) iodide",
  KNO3: "Potassium nitrate", H3PO4: "Phosphoric acid", Na3PO4: "Sodium phosphate", HNO3: "Nitric acid", "Ca(NO3)2": "Calcium nitrate",
  NO2: "Nitrogen dioxide", NaClO: "Sodium hypochlorite", P4: "Phosphorus (white)", P4O10: "Tetraphosphorus decaoxide (phosphorus pentoxide)",
  "Al2(SO4)3": "Aluminium sulfate", "Ca3(PO4)2": "Calcium phosphate", CaSO4: "Calcium sulfate", CH3OH: "Methanol", MnO2: "Manganese(IV) oxide",
  MnCl2: "Manganese(II) chloride", "Cu(NO3)2": "Copper(II) nitrate", KMnO4: "Potassium permanganate", FeS2: "Iron(II) disulfide (pyrite)", C8H18: "Octane (petrol)",
  K2Cr2O7: "Potassium dichromate", CrCl3: "Chromium(III) chloride",
  F2: "Fluorine", HF: "Hydrogen fluoride", Br2: "Bromine", HBr: "Hydrogen bromide", I2: "Iodine", HI: "Hydrogen iodide", CS2: "Carbon disulfide",
  N2H4: "Hydrazine", PCl3: "Phosphorus trichloride", C2H4: "Ethene",
  CH2Cl2: "Dichloromethane", CHCl3: "Trichloromethane (chloroform)", CCl4: "Tetrachloromethane", CH3CHO: "Ethanal", CH3COOH: "Acetic acid",
  CH2O: "Methanal (formaldehyde)", HCOOH: "Formic acid", "CO(NH2)2": "Urea", CH3COCH3: "Acetone", C6H6: "Benzene",
  HCN: "Hydrogen cyanide", PH3: "Phosphine", NH2CH2COOH: "Glycine",
  O3: "Ozone", He: "Helium", Ne: "Neon", Ar: "Argon", C12H26: "Dodecane (oil)", C12H22O11: "Sucrose (sugar)",
};
export const SPECIES_NAMES: Record<string, string> = tr(SPECIES_DE, SPECIES_EN);

export const speciesName = (f: string) => SPECIES_NAMES[f] ?? toSubscript(f);

export type ReactionKind = "synthese" | "analyse" | "umsetzung";
export const KIND_NAMES: Record<ReactionKind, string> = tr(
  { synthese: "Synthese (Verbinden)", analyse: "Analyse (Zerlegen)", umsetzung: "Umsetzung (Austausch)" },
  { synthese: "Synthesis (combining)", analyse: "Decomposition (splitting)", umsetzung: "Exchange (swapping)" });

export type Niveau = 1 | 2 | 3 | 4;
export const NIVEAUS: Niveau[] = [1, 2, 3, 4];

export interface Reaction extends Equation {
  id: string;
  /** typisches Beispiel, kurz */
  title: string;
  kind: ReactionKind;
  stufe: "us" | "os";
  /** Schwierigkeit 1–4 (Unterstufe: 1 = höchstens eine Zahl ≠ 1, 2 = zwei bis drei Zahlen, 3 = Verbrennungen/Metalloxide, 4 = knifflig – verdoppeln; Oberstufe nach Art, siehe REACTIONS) */
  niveau: Niveau;
  /** Koeffizienten links … rechts (kleinste ganze Zahlen) */
  coeffs: number[];
}

const TITLE_EN: Record<string, string> = {
  knallgas: "Oxyhydrogen reaction", mgo: "Magnesium burns", nacl: "Sodium and chlorine", co2: "Charcoal burns", so2: "Sulfur burns",
  fes: "Iron and sulfur", cuo: "Copper turns black", hcl: "Hydrogen and chlorine", zns: "Zinc and sulfur", caco3: "Burning limestone",
  hgo: "Splitting mercury oxide", wasser: "Splitting water (electrolysis)", "zn-hcl": "Zinc in hydrochloric acid", "mg-hcl": "Magnesium in hydrochloric acid",
  "cuo-h2": "Copper oxide and hydrogen", neutral: "Neutralisation",
  fe2o3: "Iron rusts", al2o3: "Aluminium burns", alcl3: "Aluminium and chlorine", nh3: "Ammonia synthesis", p4o10: "Phosphorus burns",
  na2o: "Sodium in air", h2o2: "Hydrogen peroxide decomposes", ag2o: "Splitting silver oxide", "na-h2o": "Sodium in water", "k-h2o": "Potassium in water",
  "ca-h2o": "Calcium in water", methan: "Methane burns", "mg-co2": "Magnesium burns in CO₂",
  fecl3: "Iron in chlorine", magnetit: "Iron burns (magnetite)", fotosynthese: "Photosynthesis", propan: "Propane burns", pentan: "Pentane burns",
  ethanol: "Alcohol burns", zellatmung: "Cellular respiration", h2s: "Hydrogen sulfide burns", hochofen: "Blast furnace", thermit: "Thermite reaction",
  "fe2o3-h2": "Iron oxide and hydrogen",
  ethan: "Ethane burns", butan: "Butane burns (lighter)", ethin: "Ethyne burns (welding torch)", "al-hcl": "Aluminium in hydrochloric acid",
  "nh3-o2": "Ammonia burns", "fe2o3-c": "Iron oxide and carbon",
  baso4: "Test for sulfate", agcl: "Test for chloride", kalkwasser: "Test for CO₂ (limewater)", "fe-cuso4": "Iron nail in copper sulfate",
  "so3-h2o": "Making sulfuric acid", kontakt: "Contact process", "caco3-hcl": "Limestone in hydrochloric acid",
  "h2so4-naoh": "Sulfuric acid and sodium hydroxide", "caoh2-hcl": "Milk of lime and hydrochloric acid", "soda-hcl": "Soda in hydrochloric acid",
  "agno3-cacl2": "Silver nitrate and calcium chloride",
  kclo3: "Potassium chlorate decomposes", natron: "Baking soda in baking", gaerung: "Alcoholic fermentation", pbi2: "Golden rain (lead iodide)",
  "h3po4-naoh": "Phosphoric acid and sodium hydroxide", "ca-hno3": "Milk of lime and nitric acid", no2: "Nitrogen monoxide in air",
  chlorbleiche: "Chlorine bleach",
  "al-cuso4": "Aluminium in copper sulfate", ca3po4: "Calcium phosphate precipitates", superphosphat: "Phosphoric acid from phosphate",
  "fe2o3-hcl": "Rust in hydrochloric acid", ostwald: "Ostwald process", "no2-h2o": "Making nitric acid", methanol: "Methanol burns",
  braunstein: "Chlorine from manganese dioxide", "cu-hno3-konz": "Copper in conc. nitric acid",
  "cu-hno3": "Copper in dilute nitric acid", "ag-hno3": "Silver in nitric acid", pyrit: "Roasting pyrite", octan: "Petrol burns (octane)",
  chlorat: "Chlorine in hot potassium hydroxide", permanganat: "Chlorine from permanganate", dichromat: "Chlorine from dichromate",
  hf: "Hydrogen and fluorine", hbr: "Hydrogen and bromine", hi: "Hydrogen and iodine", "ch4-syn": "Methane from the elements",
  "no-syn": "Nitrogen monoxide in a thunderstorm", cs2: "Making carbon disulfide", boudouard: "Carbon dioxide and glowing carbon",
  "n2h4-zerfall": "Hydrazine decomposes", "methanol-syn": "Methanol synthesis", "co-o2": "Carbon monoxide burns", ozon: "Ozone decomposes",
  "no-h2": "Nitrogen monoxide and hydrogen", "nh3-zerfall": "Ammonia decomposes", pcl3: "Phosphorus in chlorine",
  "co-syn": "Carbon burns in little air", "cs2-o2": "Carbon disulfide burns", ethen: "Ethene burns",
  ch2cl2: "Making dichloromethane", chcl3: "Making chloroform", "ccl4-ch4": "Tetrachloromethane from methane", "ethin-h2": "Hydrogenating ethyne",
  essigsaeure: "Ethanal turns into acetic acid", "hi-zerfall": "Hydrogen iodide decomposes", "h2s-s": "Hydrogen sulfide burns in little air",
  formaldehyd: "Methanol turns into methanal", h3po4: "Phosphoric acid from P₄O₁₀", "harnstoff-syn": "Urea synthesis",
  harnstoff: "Urea is broken down", "essig-o2": "Acetic acid burns", "ameisen-o2": "Formic acid burns", "zucker-gaerung": "Sugar ferments",
  aceton: "Acetone burns", ethanal: "Ethanol turns into ethanal", benzol: "Benzene burns", dodecan: "Diesel burns (dodecane)",
  "zucker-o2": "Sugar burns", "nh3-no2": "Ammonia to nitrogen dioxide", glycin: "Glycine burns", hcn: "Hydrogen cyanide burns",
  "n2h4-o2": "Hydrazine burns (rocket fuel)", "methan-co": "Methane burns in little air", "harnstoff-o2": "Urea burns", "ph3-o2": "Phosphine burns", "ph3-zerfall": "Phosphine decomposes", claus: "Claus process", "h2s-cl2": "Hydrogen sulfide in chlorine water",
};

const R = (stufe: "us" | "os", niveau: Niveau) => (id: string, title: string, kind: ReactionKind, left: string[], right: string[]): Reaction => {
  const coeffs = balance({ left, right });
  if (!coeffs) throw new Error(`Gleichung nicht ausgleichbar: ${id}`);
  return { id, title: tr(title, TITLE_EN[id] ?? title), kind, stufe, niveau, left, right, coeffs };
};
const U1 = R("us", 1), U2 = R("us", 2), U3 = R("us", 3), U4 = R("us", 4);
const O1 = R("os", 1), O2 = R("os", 2), O3 = R("os", 3), O4 = R("os", 4);

/** Reaktionen der Unter- und Oberstufe nach Niveau – alle mit eindeutiger Lösung */
export const REACTIONS: Reaction[] = [
  // Unterstufe · Niveau 1: eine Zahl (oder gar keine) setzen
  U1("co2", "Kohle verbrennt", "synthese", ["C", "O2"], ["CO2"]),
  U1("so2", "Schwefel verbrennt", "synthese", ["S", "O2"], ["SO2"]),
  U1("fes", "Eisen und Schwefel", "synthese", ["Fe", "S"], ["FeS"]),
  U1("hcl", "Chlorknallgas", "synthese", ["H2", "Cl2"], ["HCl"]),
  U1("zns", "Zink und Schwefel", "synthese", ["Zn", "S"], ["ZnS"]),
  U1("caco3", "Kalk brennen", "analyse", ["CaCO3"], ["CaO", "CO2"]),
  U1("zn-hcl", "Zink in Salzsäure", "umsetzung", ["Zn", "HCl"], ["ZnCl2", "H2"]),
  U1("mg-hcl", "Magnesium in Salzsäure", "umsetzung", ["Mg", "HCl"], ["MgCl2", "H2"]),
  U1("cuo-h2", "Kupferoxid und Wasserstoff", "umsetzung", ["CuO", "H2"], ["Cu", "H2O"]),
  U1("neutral", "Neutralisation", "umsetzung", ["NaOH", "HCl"], ["NaCl", "H2O"]),
  U1("ca-h2o", "Calcium in Wasser", "umsetzung", ["Ca", "H2O"], ["Ca(OH)2", "H2"]),
  // Phosphorpentoxid besteht aus P₄O₁₀-Molekülen (P₂O₅ ist nur die Verhältnisformel). Neue Kennungen p4o10/ph3-o2:
  // ein alter Übungsstand zur P₂O₅-Gleichung (gespeichert unter p2o5/ph3) erscheint so nicht als gelöst
  U1("p4o10", "Phosphor verbrennt", "synthese", ["P4", "O2"], ["P4O10"]),
  // Unterstufe · Niveau 2: zwei bis drei Zahlen (2 H₂ + O₂ → 2 H₂O)
  U2("knallgas", "Knallgasreaktion", "synthese", ["H2", "O2"], ["H2O"]),
  U2("mgo", "Magnesium verbrennt", "synthese", ["Mg", "O2"], ["MgO"]),
  U2("nacl", "Natrium und Chlor", "synthese", ["Na", "Cl2"], ["NaCl"]),
  U2("cuo", "Kupfer wird schwarz", "synthese", ["Cu", "O2"], ["CuO"]),
  U2("hgo", "Quecksilberoxid zerlegen", "analyse", ["HgO"], ["Hg", "O2"]),
  U2("wasser", "Wasser zerlegen (Elektrolyse)", "analyse", ["H2O"], ["H2", "O2"]),
  U2("fe2o3", "Eisen rostet", "synthese", ["Fe", "O2"], ["Fe2O3"]),
  U2("al2o3", "Aluminium verbrennt", "synthese", ["Al", "O2"], ["Al2O3"]),
  U2("alcl3", "Aluminium und Chlor", "synthese", ["Al", "Cl2"], ["AlCl3"]),
  U2("nh3", "Ammoniak-Synthese", "synthese", ["N2", "H2"], ["NH3"]),
  U2("na2o", "Natrium an der Luft", "synthese", ["Na", "O2"], ["Na2O"]),
  U2("h2o2", "Wasserstoffperoxid zerfällt", "analyse", ["H2O2"], ["H2O", "O2"]),
  U2("ag2o", "Silberoxid zerlegen", "analyse", ["Ag2O"], ["Ag", "O2"]),
  U2("na-h2o", "Natrium in Wasser", "umsetzung", ["Na", "H2O"], ["NaOH", "H2"]),
  U2("k-h2o", "Kalium in Wasser", "umsetzung", ["K", "H2O"], ["KOH", "H2"]),
  U2("methan", "Methan verbrennt", "umsetzung", ["CH4", "O2"], ["CO2", "H2O"]),
  U2("mg-co2", "Magnesium brennt in CO₂", "umsetzung", ["Mg", "CO2"], ["MgO", "C"]),
  // Unterstufe · Niveau 3: Verbrennungen und Metalloxide
  U3("fecl3", "Eisen in Chlor", "synthese", ["Fe", "Cl2"], ["FeCl3"]),
  U3("magnetit", "Eisen verbrennt (Magnetit)", "synthese", ["Fe", "O2"], ["Fe3O4"]),
  U3("fotosynthese", "Fotosynthese", "synthese", ["CO2", "H2O"], ["C6H12O6", "O2"]),
  U3("propan", "Propan verbrennt", "umsetzung", ["C3H8", "O2"], ["CO2", "H2O"]),
  U3("pentan", "Pentan verbrennt", "umsetzung", ["C5H12", "O2"], ["CO2", "H2O"]),
  U3("ethanol", "Alkohol verbrennt", "umsetzung", ["C2H5OH", "O2"], ["CO2", "H2O"]),
  U3("zellatmung", "Zellatmung", "umsetzung", ["C6H12O6", "O2"], ["CO2", "H2O"]),
  U3("h2s", "Schwefelwasserstoff verbrennt", "umsetzung", ["H2S", "O2"], ["SO2", "H2O"]),
  U3("hochofen", "Hochofen", "umsetzung", ["Fe2O3", "CO"], ["Fe", "CO2"]),
  U3("thermit", "Thermitreaktion", "umsetzung", ["Fe2O3", "Al"], ["Al2O3", "Fe"]),
  U3("fe2o3-h2", "Eisenoxid und Wasserstoff", "umsetzung", ["Fe2O3", "H2"], ["Fe", "H2O"]),
  // Unterstufe · Niveau 4: knifflig – ungerade Zahlen verdoppeln
  U4("ethan", "Ethan verbrennt", "umsetzung", ["C2H6", "O2"], ["CO2", "H2O"]),
  U4("butan", "Butan verbrennt (Feuerzeug)", "umsetzung", ["C4H10", "O2"], ["CO2", "H2O"]),
  U4("ethin", "Ethin verbrennt (Schweißbrenner)", "umsetzung", ["C2H2", "O2"], ["CO2", "H2O"]),
  U4("al-hcl", "Aluminium in Salzsäure", "umsetzung", ["Al", "HCl"], ["AlCl3", "H2"]),
  U4("nh3-o2", "Ammoniak verbrennt", "umsetzung", ["NH3", "O2"], ["N2", "H2O"]),
  U4("fe2o3-c", "Eisenoxid und Kohle", "umsetzung", ["Fe2O3", "C"], ["Fe", "CO2"]),

  // Oberstufe · Niveau 1: Salze und Säuren, Ionen als Ganzes
  O1("baso4", "Sulfat-Nachweis", "umsetzung", ["BaCl2", "Na2SO4"], ["BaSO4", "NaCl"]),
  O1("agcl", "Chlorid-Nachweis", "umsetzung", ["AgNO3", "NaCl"], ["AgCl", "NaNO3"]),
  O1("kalkwasser", "CO₂-Nachweis (Kalkwasser)", "umsetzung", ["Ca(OH)2", "CO2"], ["CaCO3", "H2O"]),
  O1("fe-cuso4", "Eisennagel in Kupfersulfat", "umsetzung", ["Fe", "CuSO4"], ["FeSO4", "Cu"]),
  O1("so3-h2o", "Schwefelsäure entsteht", "synthese", ["SO3", "H2O"], ["H2SO4"]),
  O1("kontakt", "Kontaktverfahren", "synthese", ["SO2", "O2"], ["SO3"]),
  O1("caco3-hcl", "Kalk in Salzsäure", "umsetzung", ["CaCO3", "HCl"], ["CaCl2", "H2O", "CO2"]),
  O1("h2so4-naoh", "Schwefelsäure und Natronlauge", "umsetzung", ["H2SO4", "NaOH"], ["Na2SO4", "H2O"]),
  O1("caoh2-hcl", "Kalkmilch und Salzsäure", "umsetzung", ["Ca(OH)2", "HCl"], ["CaCl2", "H2O"]),
  O1("soda-hcl", "Soda in Salzsäure", "umsetzung", ["Na2CO3", "HCl"], ["NaCl", "H2O", "CO2"]),
  O1("agno3-cacl2", "Silbernitrat und Calciumchlorid", "umsetzung", ["AgNO3", "CaCl2"], ["AgCl", "Ca(NO3)2"]),
  // Oberstufe · Niveau 2
  O2("kclo3", "Kaliumchlorat zerfällt", "analyse", ["KClO3"], ["KCl", "O2"]),
  O2("natron", "Natron beim Backen", "analyse", ["NaHCO3"], ["Na2CO3", "H2O", "CO2"]),
  O2("gaerung", "Alkoholische Gärung", "analyse", ["C6H12O6"], ["C2H5OH", "CO2"]),
  O2("pbi2", "Goldregen (Bleiiodid)", "umsetzung", ["Pb(NO3)2", "KI"], ["PbI2", "KNO3"]),
  O2("h3po4-naoh", "Phosphorsäure und Natronlauge", "umsetzung", ["H3PO4", "NaOH"], ["Na3PO4", "H2O"]),
  O2("ca-hno3", "Kalkmilch und Salpetersäure", "umsetzung", ["Ca(OH)2", "HNO3"], ["Ca(NO3)2", "H2O"]),
  O2("no2", "Stickstoffmonoxid an der Luft", "synthese", ["NO", "O2"], ["NO2"]),
  O2("chlorbleiche", "Chlorbleiche", "umsetzung", ["Cl2", "NaOH"], ["NaCl", "NaClO", "H2O"]),
  // Oberstufe · Niveau 3
  O3("al-cuso4", "Aluminium in Kupfersulfat", "umsetzung", ["Al", "CuSO4"], ["Al2(SO4)3", "Cu"]),
  O3("ca3po4", "Calciumphosphat fällt", "umsetzung", ["Ca(OH)2", "H3PO4"], ["Ca3(PO4)2", "H2O"]),
  O3("superphosphat", "Phosphorsäure aus Phosphat", "umsetzung", ["Ca3(PO4)2", "H2SO4"], ["CaSO4", "H3PO4"]),
  O3("fe2o3-hcl", "Rost in Salzsäure", "umsetzung", ["Fe2O3", "HCl"], ["FeCl3", "H2O"]),
  O3("ostwald", "Ostwald-Verfahren", "umsetzung", ["NH3", "O2"], ["NO", "H2O"]),
  O3("no2-h2o", "Salpetersäure entsteht", "umsetzung", ["NO2", "H2O"], ["HNO3", "NO"]),
  O3("methanol", "Methanol verbrennt", "umsetzung", ["CH3OH", "O2"], ["CO2", "H2O"]),
  O3("braunstein", "Chlor aus Braunstein", "umsetzung", ["MnO2", "HCl"], ["MnCl2", "Cl2", "H2O"]),
  O3("cu-hno3-konz", "Kupfer in konz. Salpetersäure", "umsetzung", ["Cu", "HNO3"], ["Cu(NO3)2", "NO2", "H2O"]),
  // Oberstufe · Niveau 4: Redox und große Zahlen
  O4("cu-hno3", "Kupfer in verd. Salpetersäure", "umsetzung", ["Cu", "HNO3"], ["Cu(NO3)2", "NO", "H2O"]),
  O4("ag-hno3", "Silber in Salpetersäure", "umsetzung", ["Ag", "HNO3"], ["AgNO3", "NO", "H2O"]),
  O4("pyrit", "Pyrit rösten", "umsetzung", ["FeS2", "O2"], ["Fe2O3", "SO2"]),
  O4("octan", "Benzin verbrennt (Oktan)", "umsetzung", ["C8H18", "O2"], ["CO2", "H2O"]),
  O4("chlorat", "Chlor in heißer Kalilauge", "umsetzung", ["Cl2", "KOH"], ["KCl", "KClO3", "H2O"]),
  O4("permanganat", "Chlor aus Permanganat", "umsetzung", ["KMnO4", "HCl"], ["KCl", "MnCl2", "Cl2", "H2O"]),
  O4("dichromat", "Chlor aus Dichromat", "umsetzung", ["K2Cr2O7", "HCl"], ["KCl", "CrCl3", "Cl2", "H2O"]),

  // Übungen (nur Moleküle, damit der Ablauf als Animation gezeigt werden kann)
  U1("hf", "Wasserstoff und Fluor", "synthese", ["H2", "F2"], ["HF"]),
  U1("hbr", "Wasserstoff und Brom", "synthese", ["H2", "Br2"], ["HBr"]),
  U1("hi", "Wasserstoff und Iod", "synthese", ["H2", "I2"], ["HI"]),
  U1("ch4-syn", "Methan aus den Elementen", "synthese", ["C", "H2"], ["CH4"]),
  U1("no-syn", "Stickstoffmonoxid im Gewitter", "synthese", ["N2", "O2"], ["NO"]),
  U1("cs2", "Schwefelkohlenstoff entsteht", "synthese", ["C", "S"], ["CS2"]),
  U1("boudouard", "Kohlendioxid und glühende Kohle", "synthese", ["CO2", "C"], ["CO"]),
  U1("n2h4-zerfall", "Hydrazin zerfällt", "analyse", ["N2H4"], ["N2", "H2"]),
  U1("methanol-syn", "Methanol-Synthese", "synthese", ["CO", "H2"], ["CH3OH"]),
  U1("n2h4-o2", "Hydrazin verbrennt (Raketentreibstoff)", "umsetzung", ["N2H4", "O2"], ["N2", "H2O"]),
  U2("co-o2", "Kohlenmonoxid verbrennt", "synthese", ["CO", "O2"], ["CO2"]),
  U2("ozon", "Ozon zerfällt", "analyse", ["O3"], ["O2"]),
  U2("no-h2", "Stickstoffmonoxid und Wasserstoff", "umsetzung", ["NO", "H2"], ["N2", "H2O"]),
  U2("nh3-zerfall", "Ammoniak zerfällt", "analyse", ["NH3"], ["N2", "H2"]),
  U2("pcl3", "Phosphor in Chlor", "synthese", ["P4", "Cl2"], ["PCl3"]),
  U2("co-syn", "Kohle verbrennt mit wenig Luft", "synthese", ["C", "O2"], ["CO"]),
  U2("cs2-o2", "Schwefelkohlenstoff verbrennt", "umsetzung", ["CS2", "O2"], ["CO2", "SO2"]),
  U3("ethen", "Ethen verbrennt", "umsetzung", ["C2H4", "O2"], ["CO2", "H2O"]),
  U4("methan-co", "Methan verbrennt mit wenig Luft", "umsetzung", ["CH4", "O2"], ["CO", "H2O"]),
  O1("ch2cl2", "Dichlormethan entsteht", "umsetzung", ["CH4", "Cl2"], ["CH2Cl2", "HCl"]),
  O1("chcl3", "Chloroform entsteht", "umsetzung", ["CH4", "Cl2"], ["CHCl3", "HCl"]),
  O1("ccl4-ch4", "Tetrachlormethan aus Methan", "umsetzung", ["CH4", "Cl2"], ["CCl4", "HCl"]),
  O1("ethin-h2", "Ethin wird hydriert", "synthese", ["C2H2", "H2"], ["C2H6"]),
  O1("essigsaeure", "Ethanal wird zu Essigsäure", "synthese", ["CH3CHO", "O2"], ["CH3COOH"]),
  O1("hi-zerfall", "Iodwasserstoff zerfällt", "analyse", ["HI"], ["H2", "I2"]),
  O1("h2s-s", "Schwefelwasserstoff verbrennt mit wenig Luft", "umsetzung", ["H2S", "O2"], ["S", "H2O"]),
  O1("formaldehyd", "Methanol wird zu Methanal", "umsetzung", ["CH3OH", "O2"], ["CH2O", "H2O"]),
  O2("ph3-zerfall", "Phosphan zerfällt", "analyse", ["PH3"], ["P4", "H2"]),
  O2("h3po4", "Phosphorsäure aus P₄O₁₀", "synthese", ["P4O10", "H2O"], ["H3PO4"]),
  O2("harnstoff-syn", "Harnstoff-Synthese", "umsetzung", ["CO2", "NH3"], ["CO(NH2)2", "H2O"]),
  O2("harnstoff", "Harnstoff wird gespalten", "umsetzung", ["CO(NH2)2", "H2O"], ["CO2", "NH3"]),
  O2("essig-o2", "Essigsäure verbrennt", "umsetzung", ["CH3COOH", "O2"], ["CO2", "H2O"]),
  O2("ameisen-o2", "Ameisensäure verbrennt", "umsetzung", ["HCOOH", "O2"], ["CO2", "H2O"]),
  O2("zucker-gaerung", "Zucker gärt", "umsetzung", ["C12H22O11", "H2O"], ["C2H5OH", "CO2"]),
  O2("aceton", "Aceton verbrennt", "umsetzung", ["CH3COCH3", "O2"], ["CO2", "H2O"]),
  O2("ethanal", "Ethanol wird zu Ethanal", "umsetzung", ["C2H5OH", "O2"], ["CH3CHO", "H2O"]),
  O3("zucker-o2", "Zucker verbrennt", "umsetzung", ["C12H22O11", "O2"], ["CO2", "H2O"]),
  O3("nh3-no2", "Ammoniak zu Stickstoffdioxid", "umsetzung", ["NH3", "O2"], ["NO2", "H2O"]),
  O3("harnstoff-o2", "Harnstoff verbrennt", "umsetzung", ["CO(NH2)2", "O2"], ["CO2", "H2O", "N2"]),
  O3("ph3-o2", "Phosphan verbrennt", "umsetzung", ["PH3", "O2"], ["P4O10", "H2O"]),
  O3("claus", "Claus-Verfahren", "umsetzung", ["H2S", "SO2"], ["S", "H2O"]),
  O4("benzol", "Benzol verbrennt", "umsetzung", ["C6H6", "O2"], ["CO2", "H2O"]),
  O4("dodecan", "Dieselöl verbrennt (Dodecan)", "umsetzung", ["C12H26", "O2"], ["CO2", "H2O"]),
  O4("glycin", "Glycin verbrennt", "umsetzung", ["NH2CH2COOH", "O2"], ["CO2", "H2O", "N2"]),
  O4("hcn", "Blausäure verbrennt", "umsetzung", ["HCN", "O2"], ["CO2", "H2O", "N2"]),
  O4("h2s-cl2", "Schwefelwasserstoff in Chlorwasser", "umsetzung", ["H2S", "Cl2", "H2O"], ["H2SO4", "HCl"]),
];

export const REACTION_BY_ID: Record<string, Reaction> = Object.fromEntries(REACTIONS.map(r => [r.id, r]));

/** Reaktionen einer Stufe, wahlweise nur bestimmter Niveaus */
export const reactionsFor = (stufe: "us" | "os", ...niveaus: Niveau[]) =>
  REACTIONS.filter(r => r.stufe === stufe && (!niveaus.length || niveaus.includes(r.niveau)));
