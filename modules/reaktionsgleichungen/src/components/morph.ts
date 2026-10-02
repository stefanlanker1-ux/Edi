// Fließender Übergang Edukte → Produkte im Kalottenmodell: jedes Atom eines Edukt-Moleküls wandert an seinen Platz
// in einem Produkt-Molekül (gleiches Element, kürzester Weg). Kein Atom verschwindet, keines kommt dazu.
// Ablauf in drei Abschnitten: Moleküle lockern sich (Atome rücken auseinander – Bindungen brechen) → Atome wandern →
// Atome rücken zusammen (neue Bindungen). Beide Anordnungen liegen im selben Bildfeld.

import { atomRadius, isBalanced, type Equation } from "@lern/chem";
import { kalotteBox, shapeOf } from "@lern/chem-ui";

type P3 = [number, number, number];
export interface MorphAtom {
  el: string;
  /** Lage im Edukt und im Produkt (x, y, Tiefe z) */
  from: P3; to: P3;
  /** Mitte des Moleküls, zu dem das Atom vorher bzw. nachher gehört */
  fromMol: [number, number]; toMol: [number, number];
}
export interface MorphScene { atoms: MorphAtom[]; w: number; h: number }

const GAP = .9, PAD = .6;

/** Moleküle eines Seite im Raster, Mitte des Rasters bei (0, 0); je Atom Lage und Molekülmitte */
function arrange(fs: string[], counts: number[], aspect: number) {
  const mols = fs.flatMap((f, k) => Array.from({ length: counts[k] }, () => f));
  const boxes = mols.map(kalotteBox);
  const cell = Math.max(...boxes.map(b => Math.max(b.w, b.h))) + GAP;
  const cols = Math.max(1, Math.min(mols.length, Math.round(Math.sqrt(mols.length * aspect))));
  const rows = Math.ceil(mols.length / cols);
  const atoms: { el: string; p: P3; mol: [number, number] }[] = [];
  mols.forEach((f, i) => {
    // letzte Reihe mittig, wenn sie nicht voll ist
    const r = Math.floor(i / cols), inRow = r === rows - 1 ? mols.length - r * cols : cols;
    const cx = ((i % cols) - (inRow - 1) / 2) * cell, cy = (r - (rows - 1) / 2) * cell;
    const b = boxes[i], ox = -(b.x0 + b.x1) / 2, oy = -(b.y0 + b.y1) / 2;
    for (const [el, x, y, z] of shapeOf(f)) atoms.push({ el, p: [cx + ox + x, cy + oy + y, z], mol: [cx, cy] });
  });
  return { atoms, w: cols * cell, h: rows * cell };
}

/** Zuordnung Edukt-Atom → Produkt-Atom je Element: immer das nächstgelegene freie Paar zuerst;
 *  `aspect` = Breite : Höhe des Bildes (hochkant → mehrere Reihen, die Teilchen werden größer) */
export function morphScene(eq: Equation, coeffs: number[], aspect = 1.6): MorphScene {
  if (!isBalanced(eq, coeffs)) throw new Error("Gleichung nicht ausgeglichen");
  const n = eq.left.length;
  const L = arrange(eq.left, coeffs.slice(0, n), aspect), R = arrange(eq.right, coeffs.slice(n), aspect);
  const atoms: MorphAtom[] = [];
  for (const el of new Set(L.atoms.map(a => a.el))) {
    const a = L.atoms.filter(x => x.el === el), b = R.atoms.filter(x => x.el === el);
    const pairs: [number, number, number][] = [];
    a.forEach((x, i) => b.forEach((y, j) => pairs.push([Math.hypot(x.p[0] - y.p[0], x.p[1] - y.p[1]), i, j])));
    pairs.sort((p, q) => p[0] - q[0]);
    const usedA = new Set<number>(), usedB = new Set<number>();
    for (const [, i, j] of pairs) {
      if (usedA.has(i) || usedB.has(j)) continue;
      usedA.add(i); usedB.add(j);
      atoms.push({ el, from: a[i].p, to: b[j].p, fromMol: a[i].mol, toMol: b[j].mol });
    }
  }
  const r = Math.max(...atoms.map(x => atomRadius(x.el)));
  return { atoms, w: Math.max(L.w, R.w) + 2 * (PAD + r), h: Math.max(L.h, R.h) + 2 * (PAD + r) };
}

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Abschnitte: Lockern bis 0,3 · Wandern bis 0,7 · Zusammenrücken bis 1 */
const LOOSEN = .3, MOVE = .7, SPREAD = .85;

/** Lage eines Atoms zum Zeitpunkt t (0 = Edukte, 1 = Produkte) */
export function atomAt(a: MorphAtom, t: number): P3 {
  const out = ease(clamp01(t / LOOSEN)), go = ease(clamp01((t - LOOSEN) / (MOVE - LOOSEN))), back = ease(clamp01((t - MOVE) / (1 - MOVE)));
  const spread = (p: P3, m: [number, number], k: number): P3 => [m[0] + (p[0] - m[0]) * (1 + SPREAD * k), m[1] + (p[1] - m[1]) * (1 + SPREAD * k), p[2]];
  const A = spread(a.from, a.fromMol, out), B = spread(a.to, a.toMol, 1 - back);
  return [A[0] + (B[0] - A[0]) * go, A[1] + (B[1] - A[1]) * go, A[2] + (B[2] - A[2]) * go];
}

/** Abschnitt zum Zeitpunkt t – für die Beschriftung unter dem Bild */
export const morphPhase = (t: number): "edukte" | "lockern" | "wandern" | "binden" | "produkte" =>
  t <= 0 ? "edukte" : t >= 1 ? "produkte" : t < LOOSEN ? "lockern" : t < MOVE ? "wandern" : "binden";
