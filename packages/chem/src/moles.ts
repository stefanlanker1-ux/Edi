// Stoffmenge (Unterstufe, 4. Klasse): molare Masse aus dem PSE, n = m / M, m = n · M,
// Teilchenzahl N = n · N_A, Gasvolumen V = n · 22,4 l (Normbedingungen). Reine Logik ohne UI.

import { ELEMENTS } from "./elements.ts";
import { parseFormula } from "./reactions.ts";
import { toSubscript } from "./ions.ts";

/** Avogadro-Konstante in 1/mol (Schulwert) */
export const AVOGADRO = 6.022e23;
/** molares Volumen eines Gases bei Normbedingungen in l/mol (Schulwert) */
export const MOLAR_VOLUME = 22.4;

const BY_SYMBOL: Record<string, number> = Object.fromEntries(ELEMENTS.map(e => [e.symbol, e.mass]));

/** Atommasse für Rechnungen: auf 1 Dezimale gerundet (H 1, C 12, O 16, Cl 35,5, Fe 55,8) */
export const schoolMass = (symbol: string): number => {
  const m = BY_SYMBOL[symbol];
  if (m === undefined) throw new Error(`Element unbekannt: ${symbol}`);
  return Math.round(m * 10) / 10;
};

/** Molare Masse in g/mol aus der Formel: M(H₂O) = 2 · 1 + 16 = 18 */
export function molarMass(formula: string): number {
  let sum = 0;
  for (const [el, n] of Object.entries(parseFormula(formula))) sum += n * schoolMass(el);
  return Math.round(sum * 10) / 10;
}

/** Rechenweg zur molaren Masse: [["H", 2, 1], ["O", 1, 16]] → "2 · 1 + 1 · 16 = 18 g/mol" */
export function molarMassSteps(formula: string): { el: string; n: number; mass: number }[] {
  return Object.entries(parseFormula(formula)).map(([el, n]) => ({ el, n, mass: schoolMass(el) }));
}
export const molarMassText = (formula: string) =>
  `M(${toSubscript(formula)}) = ${molarMassSteps(formula).map(s => (s.n === 1 ? fmt(s.mass) : `${s.n} · ${fmt(s.mass)}`)).join(" + ")} = ${fmt(molarMass(formula))} g/mol`;

/** n = m / M (mol) */
export const moles = (m: number, M: number) => m / M;
/** m = n · M (g) */
export const massOf = (n: number, M: number) => n * M;
/** N = n · N_A */
export const particles = (n: number) => n * AVOGADRO;
/** V = n · 22,4 l (nur Gase, Normbedingungen) */
export const gasVolume = (n: number) => n * MOLAR_VOLUME;

/** Runden auf höchstens `d` Dezimalen (Standard 2), ohne Gleitkomma-Müll */
export const round = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

/** Zahl deutsch: Komma, Tausender mit schmalem Leerzeichen, höchstens 2 Dezimalen (7 000; 0,25; 35,5) */
export function fmt(x: number, d = 2): string {
  const r = round(x, d);
  const [int, frac] = Math.abs(r).toFixed(d).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const f = (frac ?? "").replace(/0+$/, "");
  return (r < 0 ? "−" : "") + grouped + (f ? "," + f : "");
}

/** Teilchenzahl als Zehnerpotenz: 1,2 · 10²³ */
export function fmtParticles(N: number): string {
  if (N === 0) return "0";
  const e = Math.floor(Math.log10(N));
  const mant = round(N / 10 ** e, 2);
  return `${fmt(mant)} · 10${sup(e)}`;
}
const SUP: Record<string, string> = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹", "-": "⁻" };
const sup = (n: number) => String(n).split("").map(c => SUP[c]).join("");

export interface MoleSubstance {
  formula: string;
  name: string;
  /** Gas bei Normbedingungen (Volumen-Aufgaben) */
  gas?: boolean;
  /** Alltagsbezug für Aufgabentexte („ein Glas Wasser“) */
  everyday?: string;
}

/** Stoffe der Unterstufe für Stoffmengen-Aufgaben */
export const MOLE_SUBSTANCES: MoleSubstance[] = [
  { formula: "H2O", name: "Wasser", everyday: "ein Glas Wasser" },
  { formula: "NaCl", name: "Kochsalz", everyday: "Salz aus dem Streuer" },
  { formula: "CO2", name: "Kohlenstoffdioxid", gas: true, everyday: "Gas in der Limonade" },
  { formula: "O2", name: "Sauerstoff", gas: true, everyday: "Gas in der Atemluft" },
  { formula: "H2", name: "Wasserstoff", gas: true },
  { formula: "N2", name: "Stickstoff", gas: true },
  { formula: "CH4", name: "Methan", gas: true, everyday: "Erdgas" },
  { formula: "NH3", name: "Ammoniak", gas: true },
  { formula: "C", name: "Kohlenstoff", everyday: "Grafit im Bleistift" },
  { formula: "Fe", name: "Eisen", everyday: "ein Nagel" },
  { formula: "Cu", name: "Kupfer", everyday: "ein Draht" },
  { formula: "Al", name: "Aluminium", everyday: "Alufolie" },
  { formula: "Mg", name: "Magnesium" },
  { formula: "S", name: "Schwefel" },
  { formula: "MgO", name: "Magnesiumoxid" },
  { formula: "CaCO3", name: "Calciumcarbonat", everyday: "Kreide, Kalkstein" },
  { formula: "CaO", name: "Calciumoxid", everyday: "gebrannter Kalk" },
  { formula: "NaOH", name: "Natriumhydroxid" },
  { formula: "H2SO4", name: "Schwefelsäure" },
  { formula: "HCl", name: "Chlorwasserstoff", gas: true },
  { formula: "C6H12O6", name: "Traubenzucker", everyday: "Glucose" },
  { formula: "C12H22O11", name: "Haushaltszucker", everyday: "ein Stück Würfelzucker" },
  { formula: "Fe2O3", name: "Eisen(III)-oxid", everyday: "Rost" },
  { formula: "SiO2", name: "Siliciumdioxid", everyday: "Sand, Quarz" },
];
export const MOLE_BY_FORMULA: Record<string, MoleSubstance> = Object.fromEntries(MOLE_SUBSTANCES.map(s => [s.formula, s]));
