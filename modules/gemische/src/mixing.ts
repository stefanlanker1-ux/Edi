// Teilchen im Becher: Raster, Anfangslage, Schütteln und Entmischen (einfaches Modell, getestet in mixtures.test.ts).
// Jedes Teilchen sitzt in einer Zelle. Entmischen: Liegt ein Öl-Teilchen unter einem Wasser-Teilchen, tauschen sie mit einer
// gewissen Wahrscheinlichkeit die Plätze – Öl steigt langsam auf, Wasser gleitet nach unten. Dazu tauschen Nachbarn gelegentlich
// seitlich (Teilchenbewegung). Gase verteilen sich im ganzen geschlossenen Gefäß.

import type { State } from "./mixtures.ts";

export interface Particle { id: number; f: string; cell: number; /** Versatz in der Zelle (−1 … 1), damit es nicht nach Raster aussieht */ jx: number; jy: number }
export interface Grid { cols: number; rows: number; /** erste Zeile, in der Teilchen sein dürfen (Flüssigkeit: nur unten) */ top: number }

/** kleiner Zufallsgenerator mit Startwert (gleiche Anordnung bei gleichem Beispiel) */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const seedOf = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;

export function gridFor(n: number, state: State): Grid {
  // Flüssigkeit immer 4 Spalten (große Zellen – lange Moleküle wie Dodecan gut zu sehen), Gas und Modell bei vielen Teilchen 5
  const cols = n > 12 && state !== "fluessig" ? 5 : 4;
  if (state === "fluessig") {
    const filled = Math.ceil(n / cols);
    return { cols, rows: filled + 1, top: 1 }; // eine Zeile Luft über der Flüssigkeit
  }
  // Gas und Modell: mehr Zellen als Teilchen, überall verteilt
  const rows = Math.max(3, Math.ceil((n * 1.6) / cols));
  return { cols, rows, top: 0 };
}

const shuffle = <T,>(a: T[], r: () => number) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
};
const jit = (r: () => number) => r() * 2 - 1;

/** erlaubte Zellen, von unten nach oben */
function cells(g: Grid): number[] {
  const out: number[] = [];
  for (let row = g.rows - 1; row >= g.top; row--) for (let c = 0; c < g.cols; c++) out.push(row * g.cols + c);
  return out;
}

/** Zellen einer Flüssigkeit mit n Teilchen: volle Reihen von unten, in der obersten Reihe zufällige Plätze */
function liquidSlots(n: number, g: Grid, r: () => number): number[] {
  const full = Math.floor(n / g.cols), last = n % g.cols;
  const out: number[] = [];
  for (let k = 0; k < full; k++) for (let c = 0; c < g.cols; c++) out.push((g.rows - 1 - k) * g.cols + c);
  const row = g.rows - 1 - full;
  out.push(...shuffle(Array.from({ length: g.cols }, (_, c) => row * g.cols + c), r).slice(0, last));
  return out;
}

/** Anfangslage: Flüssigkeit füllt von unten (schwimmende Stoffe oben, schon entmischt), Gas und Modell verteilt */
export function initial(items: [string, number][], state: State, floats: string[] = [], seed = 1): { grid: Grid; ps: Particle[] } {
  const r = rng(seed);
  const n = items.reduce((s, [, k]) => s + k, 0);
  const grid = gridFor(n, state);
  const list = items.flatMap(([f, k]) => Array.from({ length: k }, () => f));
  const liquid = state === "fluessig";
  // Flüssigkeit: unten die nicht schwimmenden Teilchen (gemischt), darüber die schwimmenden
  const order = liquid ? [...shuffle(list.filter(f => !floats.includes(f)), r), ...shuffle(list.filter(f => floats.includes(f)), r)] : shuffle(list, r);
  const slots = liquid ? liquidSlots(n, grid, r) : shuffle(cells(grid), r).slice(0, n);
  return { grid, ps: order.map((f, i) => ({ id: i, f, cell: slots[i], jx: jit(r) * .6, jy: jit(r) * .6 })) };
}

/** Schütteln: alle Teilchen zufällig auf die Plätze verteilen (Flüssigkeit bleibt unten) */
export function shake(ps: Particle[], g: Grid, r: () => number): Particle[] {
  const slots = g.top === 0 ? shuffle(cells(g), r).slice(0, ps.length) : shuffle(liquidSlots(ps.length, g, r), r);
  return ps.map((p, i) => ({ ...p, cell: slots[i], jx: jit(r) * .6, jy: jit(r) * .6 }));
}

/** Ist die Flüssigkeit entmischt? Kein nicht schwimmendes Teilchen liegt höher als ein schwimmendes */
export function separated(ps: Particle[], g: Grid, floats: string[]): boolean {
  const row = (p: Particle) => Math.floor(p.cell / g.cols);
  const lowestFloat = Math.max(-1, ...ps.filter(p => floats.includes(p.f)).map(row));
  return ps.every(p => floats.includes(p.f) || row(p) >= lowestFloat);
}

/**
 * Ein Zeitschritt. Mit schwimmenden Stoffen (Öl): Öl unter Wasser tauscht mit Wahrscheinlichkeit `up` den Platz (steigt auf);
 * seitlich tauschen Nachbarn mit Wahrscheinlichkeit `side`. Gas: Teilchen springen in freie Nachbarzellen.
 */
export function step(ps: Particle[], g: Grid, floats: string[], r: () => number, up = .55, side = .25): Particle[] {
  const next = ps.map(p => ({ ...p }));
  const at = new Map(next.map(p => [p.cell, p]));
  const move = (p: Particle, cell: number) => { at.delete(p.cell); p.cell = cell; at.set(cell, p); p.jx = jit(r) * .6; p.jy = jit(r) * .6; };
  const swap = (a: Particle, b: Particle) => { const c = a.cell; a.cell = b.cell; b.cell = c; at.set(a.cell, a); at.set(b.cell, b); a.jx = jit(r) * .6; b.jy = jit(r) * .6; };
  const inside = (cell: number) => cell >= g.top * g.cols && cell < g.rows * g.cols;
  if (g.top === 0) {
    // Gas: in eine freie Nachbarzelle springen
    for (const p of shuffle(next, r)) {
      const row = Math.floor(p.cell / g.cols), col = p.cell % g.cols;
      const nb = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dr, dc]) => [row + dr, col + dc])
        .filter(([rr, cc]) => rr >= 0 && rr < g.rows && cc >= 0 && cc < g.cols).map(([rr, cc]) => rr * g.cols + cc).filter(c => !at.has(c));
      if (nb.length && r() < .5) move(p, nb[Math.floor(r() * nb.length)]);
    }
    return next;
  }
  // Flüssigkeit: Öl tauscht mit Wasser darüber (gerade oder schräg) – Öl steigt auf, Wasser gleitet nach unten
  for (const p of shuffle(next, r)) {
    if (!floats.includes(p.f) || r() > up) continue;
    const col = p.cell % g.cols;
    const cand = [0, -1, 1].filter(dc => col + dc >= 0 && col + dc < g.cols)
      .map(dc => at.get(p.cell - g.cols + dc)).filter((q): q is Particle => !!q && !floats.includes(q.f));
    if (cand.length) swap(p, cand[0]);
  }
  // seitliche Bewegung: Nachbarn in derselben Reihe tauschen (in der obersten Reihe auch in freie Plätze)
  for (const p of shuffle(next, r)) {
    if (r() > side) continue;
    const col = p.cell % g.cols, dir = r() < .5 ? -1 : 1;
    if (col + dir < 0 || col + dir >= g.cols) continue;
    const to = p.cell + dir;
    const q = at.get(to);
    if (q) swap(p, q);
    else if (!inside(to + g.cols) || at.has(to + g.cols)) move(p, to); // nur, wenn darunter etwas ist (keine Lücke)
  }
  return next;
}
