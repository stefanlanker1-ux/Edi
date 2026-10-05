// Teilchen im Gefäß: Raster, Anordnung vor und nach dem Mischen, Zeitschritte (einfaches Modell, getestet in mixtures.test.ts).
// Jedes Teilchen sitzt in einer Zelle und bewegt sich ständig:
//   Flüssigkeit – Nachbarn tauschen die Plätze (Diffusion), Flüssigkeit bleibt unten ohne Lücken; ein Kristall löst sich von
//   außen auf (Teilchen am Rand lösen sich, wenn Wasser daneben ist); ein Gas über der Flüssigkeit löst sich, sobald ein Teilchen
//   die Oberfläche erreicht; Öl unter Wasser tauscht mit dem Wasser darüber (steigt auf), Öl und Wasser tauschen nie senkrecht.
//   Gas – Teilchen springen in freie Nachbarzellen, Trennwände halten sie zurück, bis sie entfernt werden.
//   Fest – Gitter, Teilchen schwingen nur am Platz; geschmolzen tauschen Nachbarn, danach erstarrt das Gitter wieder.

import type { Before, State } from "./mixtures.ts";

export interface Particle {
  id: number;
  f: string;
  cell: number;
  /** Versatz in der Zelle (−1 … 1), damit es nicht nach Raster aussieht */
  jx: number;
  jy: number;
  /** im Kristall bzw. Metallgitter – bewegt sich nicht frei */
  bound?: boolean;
  /** Gasteilchen über der Flüssigkeit (noch nicht gelöst) */
  gas?: boolean;
}
export interface Grid {
  cols: number;
  rows: number;
  /** Flüssigkeit: erste Zeile der fertigen Flüssigkeit (darüber Luft bzw. Gasraum); sonst 0 */
  top: number;
}
export interface Sim {
  grid: Grid;
  ps: Particle[];
  state: State;
  floats: string[];
  /** Trennwände: Spalte, mit der rechts davon der nächste Bereich beginnt */
  walls: number[];
  /** fest: so viele Schritte ist das Metall noch geschmolzen */
  melt: number;
  /** geschlossenes Gefäß (Flasche mit Gas über der Flüssigkeit) */
  closed?: boolean;
}
/** was im Gefäß ist und wie es angeordnet sein soll */
export interface Spec { items: [string, number][]; state: State; floats?: string[]; before?: Before; solute?: string }
/**
 * nachher – fertiges Gemisch (Öl oben) · vorher – vor dem Mischen (`before`) · gemischt – alles zufällig verteilt (auch Öl) ·
 * unten / oben – der gelöste Stoff (bzw. Öl) liegt unten / oben · getrennt – jeder Stoff für sich, ohne Trennwand ·
 * abwechselnd – Gitter, Atomsorten regelmäßig abwechselnd (wie in einer Verbindung). Alles außer nachher/vorher sind
 * Bilder für Quiz-Antworten, die eine Fehlvorstellung zeigen.
 */
export type Arrange = "nachher" | "vorher" | "gemischt" | "unten" | "oben" | "getrennt" | "abwechselnd";

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

export function gridFor(n: number, state: State, before?: Before): Grid {
  if (state === "fluessig") {
    // fünf Spalten; darüber eine Zeile Luft, beim Gas über der Flüssigkeit zwei
    const cols = n > 12 ? 5 : 4, air = before === "gasraum" ? 2 : 1;
    return { cols, rows: Math.ceil(n / cols) + air, top: air };
  }
  if (state === "fest") {
    const cols = Math.ceil(Math.sqrt(n * 1.25));
    return { cols, rows: Math.ceil(n / cols), top: 0 };
  }
  // Gas und Modell: fast doppelt so viele Zellen wie Teilchen, überall verteilt
  const cols = n > 15 ? 6 : n > 8 ? 5 : 4;
  return { cols, rows: Math.max(3, Math.ceil((n * 1.9) / cols)), top: 0 };
}

const shuffle = <T,>(a: T[], r: () => number) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
};
const jit = (r: () => number) => (r() * 2 - 1) * .6;
/** Gas/Teilchenbild: Nachbarn, die sich durch die Verschiebung zu nahe kommen, zurück Richtung Zellmitte ziehen –
 *  Mindestabstand eine Zelle, sonst sehen zwei Moleküle (z. B. Ethan) wie eines aus */
function spread<P extends { cell: number; jx: number; jy: number }>(ps: P[], g: Grid, min = 1): P[] {
  const out = ps.map(p => ({ ...p }));
  for (let round = 0; round < 6; round++) {
    let moved = false;
    for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) {
      const a = out[i], b = out[j];
      const dx = (b.cell % g.cols) + b.jx - (a.cell % g.cols) - a.jx, dy = rowOf(g, b.cell) + b.jy - rowOf(g, a.cell) - a.jy;
      if (Math.hypot(dx, dy) >= min) continue;
      a.jx *= .5; a.jy *= .5; b.jx *= .5; b.jy *= .5;
      moved = true;
    }
    if (!moved) break;
  }
  return out;
}
const rowOf = (g: Grid, cell: number) => Math.floor(cell / g.cols);

/** alle Zellen, von unten nach oben */
function cells(g: Grid): number[] {
  const out: number[] = [];
  for (let row = g.rows - 1; row >= 0; row--) for (let c = 0; c < g.cols; c++) out.push(row * g.cols + c);
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

/** Spaltenbereiche für getrennte Stoffe (je Stoff genug Zellen, sonst null) */
export function bands(items: [string, number][], g: Grid, dense: boolean): [number, number][] | null {
  const width = (per: number) => items.map(([, n]) => Math.max(1, Math.ceil(n / per)));
  let w = width(dense ? g.rows : Math.floor(g.rows * .7));
  if (w.reduce((a, b) => a + b, 0) > g.cols) w = width(g.rows);
  if (w.reduce((a, b) => a + b, 0) > g.cols) return null;
  // übrige Spalten dorthin, wo es am engsten ist
  while (w.reduce((a, b) => a + b, 0) < g.cols) {
    let best = 0;
    items.forEach(([, n], i) => { if (n / w[i] > items[best][1] / w[best]) best = i; });
    w[best]++;
  }
  let x = 0;
  return w.map(k => { const b: [number, number] = [x, x + k]; x += k; return b; });
}

/** Anfangslage */
export function initial(spec: Spec, seed = 1, arrange: Arrange = "nachher"): Sim {
  const r = rng(seed);
  const { items, state } = spec;
  const floats = spec.floats ?? [];
  const n = items.reduce((s, [, k]) => s + k, 0);
  const before = arrange === "vorher" ? spec.before : undefined;
  const grid = gridFor(n, state, spec.before);
  const list = items.flatMap(([f, k]) => Array.from({ length: k }, () => f));
  const mk = (f: string, cell: number, extra: Partial<Particle> = {}): Omit<Particle, "id"> =>
    ({ f, cell, jx: state === "fest" ? 0 : jit(r), jy: state === "fest" ? 0 : jit(r), ...extra });
  const done = (ps: Omit<Particle, "id">[], walls: number[] = []): Sim =>
    ({ grid, state, floats, walls, melt: 0, ...(spec.before === "gasraum" ? { closed: true } : {}), ps: ps.map((p, id) => ({ id, ...p })) });
  // wer oben liegt: Öl (nachher), der geschichtete Stoff (vorher); „unten“ kehrt das um
  const up = (f: string) => (before === "schicht" || arrange === "oben" ? (spec.solute ? f === spec.solute : floats.includes(f)) : floats.includes(f));

  if (state === "fluessig") {
    if (before === "kristall" && spec.solute) {
      // Kristall als Block unten in der Mitte, Wasser rundherum
      const slots = liquidSlots(n, grid, r);
      const k = list.filter(f => f === spec.solute).length;
      const w = Math.min(grid.cols, Math.ceil(Math.sqrt(k * 1.5))), c0 = Math.floor((grid.cols - w) / 2);
      const key = (cell: number) => (cell % grid.cols >= c0 && cell % grid.cols < c0 + w ? 0 : 1000) + (grid.rows - 1 - rowOf(grid, cell)) * 100 + Math.abs(cell % grid.cols - (grid.cols - 1) / 2);
      const block = [...slots].sort((a, b) => key(a) - key(b)).slice(0, k);
      const rest = shuffle(slots.filter(c => !block.includes(c)), r);
      const others = shuffle(list.filter(f => f !== spec.solute), r);
      return done([...block.map(c => mk(spec.solute!, c, { bound: true, jx: 0, jy: 0 })), ...others.map((f, i) => mk(f, rest[i]))]);
    }
    if (before === "gasraum" && spec.solute) {
      // Gas im Raum über der Flüssigkeit, die Flüssigkeit darunter
      const others = shuffle(list.filter(f => f !== spec.solute), r);
      const slots = liquidSlots(others.length, grid, r);
      const air = shuffle(Array.from({ length: grid.top * grid.cols }, (_, c) => c), r);
      const gas = list.filter(f => f === spec.solute);
      return done([...others.map((f, i) => mk(f, slots[i])), ...gas.map((f, i) => mk(f, air[i], { gas: true }))]);
    }
    const low = arrange === "unten"
      ? (f: string) => (floats.length ? floats.includes(f) : f === spec.solute)
      : (f: string) => !up(f);
    const order = arrange === "gemischt" ? shuffle(list, r)
      : [...shuffle(list.filter(low), r), ...shuffle(list.filter(f => !low(f)), r)];
    const slots = liquidSlots(n, grid, r);
    return done(order.map((f, i) => mk(f, slots[i])));
  }

  if (before === "getrennt" || arrange === "getrennt") {
    const bs = bands(items, grid, state === "fest");
    if (bs) {
      const ps: Omit<Particle, "id">[] = [];
      items.forEach(([f, k], i) => {
        const [a, b] = bs[i];
        const own = cells(grid).filter(c => c % grid.cols >= a && c % grid.cols < b);
        // fest: Block von unten gefüllt; Gas: zufällig im eigenen Bereich
        const pick = state === "fest" ? own.slice(0, k) : shuffle(own, r).slice(0, k);
        pick.forEach(c => ps.push(mk(f, c, state === "fest" ? { bound: true } : {})));
      });
      return done(ps, before ? bs.slice(1).map(([a]) => a) : []);
    }
  }
  const bond = state === "fest" ? { bound: true } : {};
  if (arrange === "unten" && spec.solute) {
    // der Stoff sammelt sich unten, die anderen darüber verteilt
    const all = cells(grid), mine = list.filter(f => f === spec.solute), rest = shuffle(list.filter(f => f !== spec.solute), r);
    const low = shuffle(all.slice(0, Math.ceil(mine.length / grid.cols) * grid.cols), r).slice(0, mine.length);
    const high = shuffle(all.filter(c => !low.includes(c)), r).slice(0, rest.length);
    return done([...mine.map((f, i) => mk(f, low[i], bond)), ...rest.map((f, i) => mk(f, high[i], bond))]);
  }
  if (arrange === "abwechselnd" && state === "fest") {
    // regelmäßig geordnet: bei gleich vielen Atomen wie ein Schachbrett, sonst die selteneren Atome in gleichen Abständen (festes Muster)
    const [[a, na], [b, nb]] = items[0][1] >= items[1][1] ? [items[0], items[1]] : [items[1], items[0]];
    if (na === nb) return done(cells(grid).slice(0, n).map(c => mk((Math.floor(c / grid.cols) + c % grid.cols) % 2 ? b : a, c, bond)));
    const step = n / nb;
    const rare = new Set(Array.from({ length: nb }, (_, i) => Math.floor(i * step)));
    return done(cells(grid).slice(0, n).map((c, i) => mk(rare.has(i) ? b : a, c, bond)));
  }
  // fest: Gitter von unten gefüllt; Gas und Modell: zufällig verteilt
  const where = state === "fest" ? cells(grid).slice(0, n) : shuffle(cells(grid), r).slice(0, n);
  const order = shuffle(list, r);
  const ps = order.map((f, i) => mk(f, where[i], bond));
  return done(state === "fest" ? ps : spread(ps, grid));
}

/** Schütteln: alle Teilchen zufällig verteilen (Flüssigkeit bleibt unten, Trennwände fallen weg) */
export function shake(sim: Sim, r: () => number): Sim {
  const g = sim.grid;
  if (sim.state === "fest") return sim;
  const slots = sim.state === "fluessig" ? shuffle(liquidSlots(sim.ps.length, g, r), r) : shuffle(cells(g), r).slice(0, sim.ps.length);
  const ps = sim.ps.map((p, i) => ({ ...p, cell: slots[i], jx: jit(r), jy: jit(r), bound: false, gas: false }));
  return { ...sim, walls: [], ps: sim.state === "fluessig" ? ps : spread(ps, g) };
}

/** Mischen beginnt: Trennwände weg, Metall schmilzt */
export function startMixing(sim: Sim, r: () => number): Sim {
  if (sim.state === "fest") return { ...sim, walls: [], melt: 14, ps: sim.ps.map(p => ({ ...p, bound: false, jx: jit(r), jy: jit(r) })) };
  return { ...sim, walls: [] };
}

/** Ist die Flüssigkeit entmischt? Kein nicht schwimmendes Teilchen liegt höher als ein schwimmendes */
export function separated(ps: Particle[], g: Grid, floats: string[]): boolean {
  const lowestFloat = Math.max(-1, ...ps.filter(p => floats.includes(p.f)).map(p => rowOf(g, p.cell)));
  return ps.every(p => floats.includes(p.f) || rowOf(g, p.cell) >= lowestFloat);
}

/** Vorgang abgeschlossen: nichts mehr im Kristall oder Gasraum, Metall erstarrt, Öl oben */
export function settled(sim: Sim): boolean {
  if (sim.state === "fest") return sim.melt <= 0 && !sim.walls.length;
  if (sim.walls.length) return false;
  if (sim.ps.some(p => p.gas || p.bound)) return false;
  return !sim.floats.length || separated(sim.ps, sim.grid, sim.floats);
}

const DIRS4 = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const DIRS8 = [...DIRS4, [1, 1], [1, -1], [-1, 1], [-1, -1]];

/**
 * Ein Zeitschritt. `mix` = Wahrscheinlichkeit, dass ein Teilchen der Flüssigkeit mit einem Nachbarn tauscht;
 * `up` = Wahrscheinlichkeit, dass ein Öl-Teilchen unter Wasser aufsteigt.
 */
export function step(sim: Sim, r: () => number, mix = .45, up = .55): Sim {
  const g = sim.grid;
  const ps = sim.ps.map(p => ({ ...p }));
  const at = new Map(ps.map(p => [p.cell, p]));
  const pos = (cell: number) => [rowOf(g, cell), cell % g.cols];
  const inside = (row: number, col: number) => row >= 0 && row < g.rows && col >= 0 && col < g.cols;
  const crosses = (a: number, b: number) => sim.walls.some(w => (a % g.cols < w) !== (b % g.cols < w));
  const move = (p: Particle, cell: number) => { at.delete(p.cell); p.cell = cell; at.set(cell, p); p.jx = jit(r); p.jy = jit(r); };
  const swap = (a: Particle, b: Particle) => { const c = a.cell; a.cell = b.cell; b.cell = c; at.set(a.cell, a); at.set(b.cell, b); a.jx = jit(r); a.jy = jit(r); b.jx = jit(r); b.jy = jit(r); };
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];

  if (sim.state === "fest") {
    if (sim.melt <= 0) return sim; // Gitter: Teilchen schwingen nur am Platz
    // geschmolzen: Nachbarn tauschen die Plätze
    for (const p of shuffle(ps, r)) {
      if (r() > .7) continue;
      const [row, col] = pos(p.cell);
      const nb = DIRS8.map(([dr, dc]) => [row + dr, col + dc]).filter(([a, b]) => inside(a, b)).map(([a, b]) => at.get(a * g.cols + b)).filter((q): q is Particle => !!q);
      if (nb.length) swap(p, pick(nb));
    }
    const melt = sim.melt - 1;
    // erstarrt: wieder ein Gitter
    if (!melt) for (const p of ps) { p.jx = 0; p.jy = 0; p.bound = true; }
    return { ...sim, ps, melt };
  }

  if (sim.state !== "fluessig") {
    // Gas und Modell: in freie Nachbarzellen springen (auch schräg), in dichten Bereichen gelegentlich tauschen
    for (const p of shuffle(ps, r)) {
      if (r() > .6) continue;
      const [row, col] = pos(p.cell);
      const nb = DIRS8.map(([dr, dc]) => [row + dr, col + dc]).filter(([a, b]) => inside(a, b)).map(([a, b]) => a * g.cols + b).filter(c => !crosses(p.cell, c));
      const free = nb.filter(c => !at.has(c));
      if (free.length) move(p, pick(free));
      else if (nb.length && r() < .3) swap(p, at.get(pick(nb))!);
    }
    return { ...sim, ps };
  }

  // ── Flüssigkeit ──
  const isLiquid = (q?: Particle) => !!q && !q.gas;
  const supported = (cell: number) => rowOf(g, cell) === g.rows - 1 || isLiquid(at.get(cell + g.cols));
  const isFloat = (q: Particle) => sim.floats.includes(q.f);
  // Gas über der Flüssigkeit: springt umher; erreicht es die Oberfläche, löst es sich
  for (const p of shuffle(ps.filter(q => q.gas), r)) {
    if (r() > .7) continue;
    const [row, col] = pos(p.cell);
    const free = DIRS8.map(([dr, dc]) => [row + dr, col + dc]).filter(([a, b]) => inside(a, b)).map(([a, b]) => a * g.cols + b).filter(c => !at.has(c));
    if (!free.length) continue;
    const c = pick(free);
    move(p, c);
    if (supported(c)) p.gas = false;
  }
  // Kristall: Teilchen am Rand lösen sich, wenn Flüssigkeit daneben ist
  for (const p of ps.filter(q => q.bound)) {
    const [row, col] = pos(p.cell);
    const wet = DIRS4.some(([dr, dc]) => { const q = inside(row + dr, col + dc) ? at.get((row + dr) * g.cols + col + dc) : undefined; return isLiquid(q) && !q!.bound; });
    if (wet && r() < .2) { p.bound = false; p.jx = jit(r); p.jy = jit(r); }
  }
  // Öl steigt auf: tauscht mit Wasser darüber (gerade oder schräg)
  for (const p of shuffle(ps, r)) {
    if (!isFloat(p) || p.bound || p.gas || r() > up) continue;
    const col = p.cell % g.cols;
    const cand = [0, -1, 1].filter(dc => col + dc >= 0 && col + dc < g.cols)
      .map(dc => at.get(p.cell - g.cols + dc)).filter((q): q is Particle => isLiquid(q) && !q!.bound && !isFloat(q!));
    if (cand.length) swap(p, cand[0]);
  }
  // Diffusion: Nachbarn tauschen; in der obersten Reihe auch in freie Plätze (nur wenn darunter etwas ist)
  for (const p of shuffle(ps, r)) {
    if (p.bound || p.gas || r() > mix) continue;
    const [row, col] = pos(p.cell);
    const [dr, dc] = pick(DIRS4);
    if (!inside(row + dr, col + dc)) continue;
    const t = (row + dr) * g.cols + col + dc, q = at.get(t);
    if (q) {
      if (q.bound || q.gas) continue;
      if (dr && isFloat(p) !== isFloat(q)) continue; // Öl und Wasser tauschen nie senkrecht
      swap(p, q);
    } else if (!dr && supported(t) && !isLiquid(at.get(p.cell - g.cols))) move(p, t);
  }
  return { ...sim, ps };
}
