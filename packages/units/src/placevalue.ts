// Stellenwerttafel für dezimale Einheiten (Länge, Fläche, Volumen, Masse).
// Jede Einheit bekommt so viele Spalten, wie Stellen bis zur nächstgrößeren Einheit fehlen:
// Länge km | m (H Z E) | dm | cm | mm, Fläche je 2 Spalten (Z E), Volumen je 3 (H Z E).

import { q, mul, div, cmp, isInt, log10Exact, ZERO, type Q } from "./rational.ts";
import { unitSi } from "./units.ts";

export interface PvColumn {
  unit: string;
  /** H, Z oder E innerhalb der Einheit */
  place: "H" | "Z" | "E";
  /** Stellenwert als Zehnerpotenz der kleinsten Einheit */
  exp: number;
  /** Zusatzbeschriftung (Hohlmaße: hl, l, dl, cl, ml) */
  sub?: string;
}

const PLACES = { 1: ["E"], 2: ["Z", "E"], 3: ["H", "Z", "E"] } as const;
const SUB: Record<string, string[]> = { "dm³": ["hl", "", "l"], "cm³": ["dl", "cl", "ml"] };

/** Spalten von groß nach klein */
export function pvColumns(units: string[]): PvColumn[] {
  const smallest = units[units.length - 1];
  // Spaltenzahl = Stellen bis zur nächstgrößeren Einheit (m: 1 km = 1000 m → 3); die größte Einheit wie die nächste
  const sizes = units.map((u, i) => (i === 0 ? 0 : Math.min(3, log10Exact(div(unitSi(units[i - 1]), unitSi(u))) ?? 1)));
  sizes[0] = sizes[1] ?? 1;
  const cols: PvColumn[] = [];
  units.forEach((u, i) => {
    const size = sizes[i] as 1 | 2 | 3;
    const eExp = log10Exact(div(unitSi(u), unitSi(smallest)))!;
    PLACES[size].forEach((place, k) => {
      cols.push({ unit: u, place, exp: eExp + (size - 1 - k), sub: SUB[u]?.[3 - size + k] || undefined });
    });
  });
  return cols;
}

/** Spalte, hinter der das Komma einer Einheit steht (E-Spalte; Hohlmaße über die Zusatzbeschriftung: l, dl, cl, ml, hl) */
export function pvIndex(cols: PvColumn[], unit: string): number {
  const i = cols.findIndex(c => c.unit === unit && c.place === "E");
  return i >= 0 ? i : cols.findIndex(c => c.sub === unit);
}

export interface PvCell { digit: string | null; kind: "given" | "added" | "empty" }
export interface PvResult {
  cols: PvColumn[];
  cells: PvCell[];
  /** Spalte, hinter der das Komma der Ausgangs- bzw. Zieleinheit steht */
  fromE: number; toE: number;
  fits: boolean;
  result: Q;
}

/** Ziffern von value (in from) in die Tafel setzen; zum Ablesen in to werden Nullen ergänzt */
export function placeValue(value: Q, from: string, to: string, units: string[]): PvResult {
  const cols = pvColumns(units);
  const smallest = units[units.length - 1];
  const inSmall = mul(value, div(unitSi(from), unitSi(smallest)));
  const result = mul(value, div(unitSi(from), unitSi(to)));
  const idxE = (u: string) => pvIndex(cols, u);
  const fromE = idxE(from), toE = idxE(to);
  const empty = (): PvResult => ({ cols, cells: cols.map(() => ({ digit: null, kind: "empty" })), fromE, toE, fits: false, result });
  if (fromE < 0 || toE < 0 || !isInt(inSmall) || cmp(inSmall, ZERO) < 0) return empty();
  const digits = inSmall.n.toString();
  const maxExp = cols[0].exp;
  if (digits.length - 1 > maxExp && inSmall.n !== 0n) return empty();
  const col = (exp: number) => cols.findIndex(c => c.exp === exp);
  const digitAt = (exp: number) => (exp < digits.length ? digits[digits.length - 1 - exp] : "0");
  const msd = inSmall.n === 0n ? fromE : col(digits.length - 1);
  let lsdExp = 0; while (lsdExp < digits.length - 1 && digits[digits.length - 1 - lsdExp] === "0") lsdExp++;
  const lsd = inSmall.n === 0n ? fromE : col(lsdExp);
  const g0 = Math.min(msd, fromE), g1 = Math.max(lsd, fromE);
  const d0 = Math.min(g0, toE), d1 = Math.max(g1, toE);
  const cells: PvCell[] = cols.map((c, i) => {
    if (i < d0 || i > d1) return { digit: null, kind: "empty" };
    return { digit: digitAt(c.exp), kind: i >= g0 && i <= g1 ? "given" : "added" };
  });
  return { cols, cells, fromE, toE, fits: true, result };
}

export const pvValue = (s: string) => q(BigInt(s));

export interface PvPlaced {
  /** Ziffer je Spalte (null = leer) */
  digits: (string | null)[];
  /** Spalte, hinter der das Komma steht */
  comma: number;
  fits: boolean;
}
/**
 * Eine Zahl so in die Tafel setzen, wie man sie abschreibt: vom ersten bis zum letzten Nicht-Null-Zeichen,
 * mindestens bis zur E-Spalte der Einheit (3 m → „3“ in m-E, 0,5 m → „0 | 5“). Keine ergänzten Nullen.
 */
export function pvPlace(value: Q, unit: string, units: string[]): PvPlaced {
  const cols = pvColumns(units);
  const smallest = units[units.length - 1];
  const comma = pvIndex(cols, unit);
  const none: PvPlaced = { digits: cols.map(() => null), comma, fits: false };
  if (comma < 0 || cmp(value, ZERO) < 0) return none;
  const inSmall = mul(value, div(unitSi(unit), unitSi(smallest)));
  if (!isInt(inSmall)) return none;
  const ds = inSmall.n.toString();
  const expOf = (i: number) => cols[i].exp;
  const cExp = expOf(comma);
  // höchste Stelle: erste Ziffer ≠ 0, aber mindestens die E-Spalte; niedrigste: letzte Ziffer ≠ 0 bzw. E-Spalte
  let hi = ds.length - 1; if (inSmall.n === 0n || hi < cExp) hi = cExp;
  let lo = 0; while (lo < ds.length - 1 && ds[ds.length - 1 - lo] === "0") lo++;
  if (inSmall.n === 0n || lo > cExp) lo = cExp;
  if (hi > cols[0].exp) return none;
  const digits = cols.map(c => (c.exp > hi || c.exp < lo ? null : c.exp < ds.length ? ds[ds.length - 1 - c.exp] : "0"));
  return { digits, comma, fits: true };
}
