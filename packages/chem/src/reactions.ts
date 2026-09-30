// Reaktionsgleichungen: Formeln zerlegen, Atome zählen, Koeffizienten ausgleichen (kleinste ganze Zahlen).
// Reine Logik ohne UI; Formeln in ASCII (H2O, Ca(OH)2), Anzeige über toSubscript.

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

export const SPECIES_NAMES: Record<string, string> = {
  H2: "Wasserstoff", O2: "Sauerstoff", N2: "Stickstoff", Cl2: "Chlor", H2O: "Wasser", H2O2: "Wasserstoffperoxid",
  Mg: "Magnesium", MgO: "Magnesiumoxid", Fe: "Eisen", Fe2O3: "Eisen(III)-oxid", FeS: "Eisensulfid", S: "Schwefel",
  Na: "Natrium", NaCl: "Natriumchlorid", C: "Kohlenstoff", CO2: "Kohlenstoffdioxid", CO: "Kohlenstoffmonoxid", CH4: "Methan",
  NH3: "Ammoniak", Al: "Aluminium", Al2O3: "Aluminiumoxid", AlCl3: "Aluminiumchlorid", Cu: "Kupfer", CuO: "Kupferoxid",
  CaCO3: "Calciumcarbonat (Kalk)", CaO: "Calciumoxid", Zn: "Zink", HCl: "Chlorwasserstoff (Salzsäure)", ZnCl2: "Zinkchlorid",
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
  NO2: "Stickstoffdioxid", NaClO: "Natriumhypochlorit", P4: "Phosphor (weiß)", P4O10: "Tetraphosphordecaoxid",
  "Al2(SO4)3": "Aluminiumsulfat", "Ca3(PO4)2": "Calciumphosphat", CaSO4: "Calciumsulfat (Gips)", CH3OH: "Methanol", MnO2: "Mangan(IV)-oxid (Braunstein)",
  MnCl2: "Mangan(II)-chlorid", "Cu(NO3)2": "Kupfer(II)-nitrat", KMnO4: "Kaliumpermanganat", FeS2: "Eisen(II)-disulfid (Pyrit)", C8H18: "Octan (Benzin)",
  K2Cr2O7: "Kaliumdichromat", CrCl3: "Chrom(III)-chlorid",
  // Gemische
  O3: "Ozon", He: "Helium", Ne: "Neon", Ar: "Argon", C12H26: "Dodecan (Öl)", C12H22O11: "Saccharose (Zucker)",
};

export const speciesName = (f: string) => SPECIES_NAMES[f] ?? toSubscript(f);

export type ReactionKind = "synthese" | "analyse" | "umsetzung";
export const KIND_NAMES: Record<ReactionKind, string> = { synthese: "Synthese (Verbinden)", analyse: "Analyse (Zerlegen)", umsetzung: "Umsetzung (Austausch)" };

export type Niveau = 1 | 2 | 3 | 4;
export const NIVEAUS: Niveau[] = [1, 2, 3, 4];

export interface Reaction extends Equation {
  id: string;
  /** typisches Beispiel, kurz */
  title: string;
  kind: ReactionKind;
  stufe: "us" | "os";
  /** Schwierigkeit 1–4: 1 = eine Zahl setzen, 2 = zwei bis drei Zahlen, 3 = Verbrennungen/Wortgleichungen, 4 = knifflig (verdoppeln, Redox) */
  niveau: Niveau;
  /** Koeffizienten links … rechts (kleinste ganze Zahlen) */
  coeffs: number[];
}

const R = (stufe: "us" | "os", niveau: Niveau) => (id: string, title: string, kind: ReactionKind, left: string[], right: string[]): Reaction => {
  const coeffs = balance({ left, right });
  if (!coeffs) throw new Error(`Gleichung nicht ausgleichbar: ${id}`);
  return { id, title, kind, stufe, niveau, left, right, coeffs };
};
const U1 = R("us", 1), U2 = R("us", 2), U3 = R("us", 3), U4 = R("us", 4);
const O1 = R("os", 1), O2 = R("os", 2), O3 = R("os", 3), O4 = R("os", 4);

/** Reaktionen der Unter- und Oberstufe (Österreich) nach Niveau – alle mit eindeutiger Lösung */
export const REACTIONS: Reaction[] = [
  // Unterstufe · Niveau 1: eine Zahl (oder gar keine) setzen
  U1("knallgas", "Knallgasreaktion", "synthese", ["H2", "O2"], ["H2O"]),
  U1("mgo", "Magnesium verbrennt", "synthese", ["Mg", "O2"], ["MgO"]),
  U1("nacl", "Natrium und Chlor", "synthese", ["Na", "Cl2"], ["NaCl"]),
  U1("co2", "Kohle verbrennt", "synthese", ["C", "O2"], ["CO2"]),
  U1("so2", "Schwefel verbrennt", "synthese", ["S", "O2"], ["SO2"]),
  U1("fes", "Eisen und Schwefel", "synthese", ["Fe", "S"], ["FeS"]),
  U1("cuo", "Kupfer wird schwarz", "synthese", ["Cu", "O2"], ["CuO"]),
  U1("hcl", "Chlorknallgas", "synthese", ["H2", "Cl2"], ["HCl"]),
  U1("zns", "Zink und Schwefel", "synthese", ["Zn", "S"], ["ZnS"]),
  U1("caco3", "Kalk brennen", "analyse", ["CaCO3"], ["CaO", "CO2"]),
  U1("hgo", "Quecksilberoxid zerlegen", "analyse", ["HgO"], ["Hg", "O2"]),
  U1("wasser", "Wasser zerlegen (Elektrolyse)", "analyse", ["H2O"], ["H2", "O2"]),
  U1("zn-hcl", "Zink in Salzsäure", "umsetzung", ["Zn", "HCl"], ["ZnCl2", "H2"]),
  U1("mg-hcl", "Magnesium in Salzsäure", "umsetzung", ["Mg", "HCl"], ["MgCl2", "H2"]),
  U1("cuo-h2", "Kupferoxid und Wasserstoff", "umsetzung", ["CuO", "H2"], ["Cu", "H2O"]),
  U1("neutral", "Neutralisation", "umsetzung", ["NaOH", "HCl"], ["NaCl", "H2O"]),
  // Unterstufe · Niveau 2: zwei bis drei Zahlen
  U2("fe2o3", "Eisen rostet", "synthese", ["Fe", "O2"], ["Fe2O3"]),
  U2("al2o3", "Aluminium verbrennt", "synthese", ["Al", "O2"], ["Al2O3"]),
  U2("alcl3", "Aluminium und Chlor", "synthese", ["Al", "Cl2"], ["AlCl3"]),
  U2("nh3", "Ammoniak-Synthese", "synthese", ["N2", "H2"], ["NH3"]),
  U2("p2o5", "Phosphor verbrennt", "synthese", ["P", "O2"], ["P2O5"]),
  U2("na2o", "Natrium an der Luft", "synthese", ["Na", "O2"], ["Na2O"]),
  U2("h2o2", "Wasserstoffperoxid zerfällt", "analyse", ["H2O2"], ["H2O", "O2"]),
  U2("ag2o", "Silberoxid zerlegen", "analyse", ["Ag2O"], ["Ag", "O2"]),
  U2("na-h2o", "Natrium in Wasser", "umsetzung", ["Na", "H2O"], ["NaOH", "H2"]),
  U2("k-h2o", "Kalium in Wasser", "umsetzung", ["K", "H2O"], ["KOH", "H2"]),
  U2("ca-h2o", "Calcium in Wasser", "umsetzung", ["Ca", "H2O"], ["Ca(OH)2", "H2"]),
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
  O2("p4", "Weißer Phosphor verbrennt", "synthese", ["P4", "O2"], ["P4O10"]),
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
  O4("octan", "Benzin verbrennt (Octan)", "umsetzung", ["C8H18", "O2"], ["CO2", "H2O"]),
  O4("chlorat", "Chlor in heißer Kalilauge", "umsetzung", ["Cl2", "KOH"], ["KCl", "KClO3", "H2O"]),
  O4("permanganat", "Chlor aus Permanganat", "umsetzung", ["KMnO4", "HCl"], ["KCl", "MnCl2", "Cl2", "H2O"]),
  O4("dichromat", "Chlor aus Dichromat", "umsetzung", ["K2Cr2O7", "HCl"], ["KCl", "CrCl3", "Cl2", "H2O"]),
];

export const REACTION_BY_ID: Record<string, Reaction> = Object.fromEntries(REACTIONS.map(r => [r.id, r]));

/** Reaktionen einer Stufe, wahlweise nur bestimmter Niveaus */
export const reactionsFor = (stufe: "us" | "os", ...niveaus: Niveau[]) =>
  REACTIONS.filter(r => r.stufe === stufe && (!niveaus.length || niveaus.includes(r.niveau)));
