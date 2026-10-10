// Periodische Eigenschaften für die Trend-Ansicht im PSE.
// Kovalenzradien (pm, Cordero et al. 2008; Mn, Fe, Co: low-spin; Tabelle endet bei Curium) und erste Ionisierungsenergien
// (eV, NIST Atomic Spectra Database; gemessen bis Lawrencium). Ohne Messwert: null – die PSE-Ansicht zeigt „–“ auf grauer Fläche.

import { tr } from "@lern/i18n";
import { BY_Z } from "./elements.ts";

// Index = Z − 1
const RADIUS = [
  31, 28, 128, 96, 84, 76, 71, 66, 57, 58, 166, 141, 121, 111, 107, 105, 102, 106, 203, 176,
  170, 160, 153, 139, 139, 132, 126, 124, 132, 122, 122, 120, 119, 120, 120, 116, 220, 195, 190, 175,
  164, 154, 147, 146, 142, 139, 145, 144, 142, 139, 139, 138, 139, 140, 244, 215, 207, 204, 203, 201,
  199, 198, 198, 196, 194, 192, 192, 189, 190, 187, 187, 175, 170, 162, 151, 144, 141, 136, 136, 132,
  145, 146, 148, 140, 150, 150,
  260, 221, 215, 206, 200, 196, 190, 187, 180, 169,
];
const IONIZATION = [
  13.60, 24.59, 5.39, 9.32, 8.30, 11.26, 14.53, 13.62, 17.42, 21.56, 5.14, 7.65, 5.99, 8.15, 10.49, 10.36, 12.97, 15.76, 4.34, 6.11,
  6.56, 6.83, 6.75, 6.77, 7.43, 7.90, 7.88, 7.64, 7.73, 9.39, 6.00, 7.90, 9.79, 9.75, 11.81, 14.00, 4.18, 5.69, 6.22, 6.63,
  6.76, 7.09, 7.28, 7.36, 7.46, 8.34, 7.58, 8.99, 5.79, 7.34, 8.61, 9.01, 10.45, 12.13, 3.89, 5.21, 5.58, 5.54, 5.47, 5.53,
  5.58, 5.64, 5.67, 6.15, 5.86, 5.94, 6.02, 6.11, 6.18, 6.25, 5.43, 6.83, 7.55, 7.86, 7.83, 8.44, 8.97, 8.96, 9.23, 10.44,
  6.11, 7.42, 7.29, 8.41, 9.32, 10.75,
  4.07, 5.28, 5.38, 6.31, 5.89, 6.19, 6.27, 6.03, 5.97, 5.99, 6.20, 6.28, 6.37, 6.50, 6.58, 6.63, 4.96,
];

export type TrendKey = "en" | "radius" | "ie";

/** `scale`: Skala der Werte (Legende), z. B. Elektronegativität nach Allred-Rochow */
export const TRENDS: Record<TrendKey, { label: string; short: string; unit: string; rule: string; value: (Z: number) => number | null; digits: number; scale?: string }> = {
  en: { label: tr("Elektronegativität", "Electronegativity"), short: "EN", unit: "", digits: 2, value: Z => BY_Z[Z]?.en ?? null, scale: tr("nach Allred-Rochow", "Allred–Rochow scale"),
    rule: tr("nimmt im PSE nach **rechts oben** zu – Fluor zieht Elektronen am stärksten an.", "increases towards the **top right** – fluorine attracts electrons most strongly.") },
  radius: { label: tr("Atomradius", "Atomic radius"), short: tr("Radius", "Radius"), unit: "pm", digits: 0, value: Z => RADIUS[Z - 1] ?? null,
    rule: tr("nimmt nach **links unten** zu – mehr Schalen machen das Atom größer, mehr Protonen ziehen die Hülle zusammen.", "increases towards the **bottom left** – more shells make the atom larger, more protons pull the shells inwards.") },
  ie: { label: tr("Ionisierungsenergie", "Ionisation energy"), short: "IE", unit: "eV", digits: 1, value: Z => IONIZATION[Z - 1] ?? null,
    rule: tr("nimmt nach **rechts oben** zu – Edelgase geben ihre Elektronen am schwersten ab.", "increases towards the **top right** – noble gases give up electrons least easily.") },
};

/** Wert als Anteil 0…1 zwischen Minimum und Maximum der gegebenen Elemente (für die Farbskala) */
export function trendScale(key: TrendKey, Zs: number[]): (Z: number) => number | null {
  const vals = Zs.map(TRENDS[key].value).filter((v): v is number => v !== null);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  if (!vals.length || hi === lo) return Z => (TRENDS[key].value(Z) === null ? null : 0.5);
  return Z => { const v = TRENDS[key].value(Z); return v === null ? null : (v - lo) / (hi - lo); };
}
