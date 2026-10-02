// Lage der Atome in der Ebene (Bindungslänge 1): Ketten im Zickzack (120°), Ringe als regelmäßige Vielecke,
// Dreifachbindungen gerade. Für Beispiele und Quizbilder; beim Zeichnen bestimmt `nextDirection` die Richtung neuer Atome.

import { graph, type Graph, type Mol } from "./mol.ts";
import { findRings } from "./rings.ts";

const RAD = Math.PI / 180;
const dir = (deg: number) => ({ x: Math.cos(deg * RAD), y: Math.sin(deg * RAD) });

/** längster Weg im Molekül (zwei BFS), Startpunkt fürs Layout */
function farthest(g: Graph, s: number): number {
  const dist = new Map([[s, 0]]), q = [s];
  let last = s;
  // Endpunkt: das fernste C (Kette waagrecht, Gruppen hängen daran)
  const isC = (v: number) => g.el.get(v) === "C" || !g.ids.some(x => g.el.get(x) === "C");
  while (q.length) {
    const v = q.shift()!;
    if (isC(v)) last = v;
    for (const n of g.nb.get(v)!) if (!dist.has(n.to)) { dist.set(n.to, dist.get(v)! + 1); q.push(n.to); }
  }
  return last;
}

export function layout(mol: Mol): Mol {
  const g = graph(mol);
  if (!g.ids.length) return mol;
  const ri = findRings(g);
  const pos = new Map<number, { x: number; y: number }>();
  const placedRing = new Set<object>();
  /** Größe des Teilbaums hinter v (vom Elternatom aus) – längere Äste setzen die Zickzack-Linie fort */
  const depth = (v: number, from: number, seen = new Set<number>([from])): number => {
    seen.add(v);
    let d = 0;
    for (const n of g.nb.get(v)!) if (!seen.has(n.to)) d = Math.max(d, 1 + depth(n.to, v, seen));
    return d;
  };
  const crowd = (p: { x: number; y: number }, except: number[]) => {
    let pen = 0;
    for (const [id, q] of pos) if (!except.includes(id)) pen += Math.max(0, 1.2 - Math.hypot(p.x - q.x, p.y - q.y));
    return pen;
  };

  const placeRing = (v: number, angleIn: number | null) => {
    const ring = ri.ringOf.get(v)!;
    placedRing.add(ring);
    const n = ring.atoms.length, R = 1 / (2 * Math.sin(Math.PI / n));
    const p = pos.get(v)!;
    const c = angleIn === null ? { x: p.x + R, y: p.y } : { x: p.x + R * Math.cos(angleIn * RAD), y: p.y + R * Math.sin(angleIn * RAD) };
    const k = ring.atoms.indexOf(v);
    const a0 = Math.atan2(p.y - c.y, p.x - c.x);
    // Richtung so wählen, dass wenig verdeckt wird
    let best: Map<number, { x: number; y: number }> | undefined, bestPen = Infinity;
    for (const s of [1, -1]) {
      const m = new Map<number, { x: number; y: number }>();
      ring.atoms.forEach((a, i) => {
        const t = a0 + s * ((i - k) * 2 * Math.PI) / n;
        m.set(a, { x: c.x + R * Math.cos(t), y: c.y + R * Math.sin(t) });
      });
      const pen = [...m].reduce((sum, [a, q]) => sum + (a === v ? 0 : crowd(q, [v])), 0);
      if (pen < bestPen) { bestPen = pen; best = m; }
    }
    for (const [a, q] of best!) pos.set(a, q);
    // Substituenten der Ringatome: nach außen
    for (const a of ring.atoms) {
      const q = pos.get(a)!;
      const out = Math.atan2(q.y - c.y, q.x - c.x) / RAD;
      const subs = g.nb.get(a)!.filter(x => !pos.has(x.to));
      const angs = subs.length === 1 ? [out] : subs.length === 2 ? [out - 35, out + 35] : [out];
      subs.forEach((x, i) => place(x.to, a, angs[i] ?? out));
    }
  };

  const place = (v: number, from: number, angle: number, turn = 1) => {
    if (pos.has(v)) return;
    const pf = pos.get(from)!;
    // Ausweichen, falls die Stelle besetzt ist
    let a = angle, best = Infinity;
    for (const d of [0, 30, -30, 60, -60, 90, -90]) {
      const t = angle + d, q = { x: pf.x + Math.cos(t * RAD), y: pf.y + Math.sin(t * RAD) };
      const pen = crowd(q, [from]) + Math.abs(d) / 400;
      if (pen < best - 1e-9) { best = pen; a = t; }
    }
    pos.set(v, { x: pf.x + Math.cos(a * RAD), y: pf.y + Math.sin(a * RAD) });
    if (ri.ringOf.has(v) && !placedRing.has(ri.ringOf.get(v)!)) { placeRing(v, a); return; }
    grow(v, from, a, turn);
  };

  const grow = (v: number, _from: number, angleIn: number, turn: number) => {
    const kids = g.nb.get(v)!.filter(n => !pos.has(n.to)).sort((x, y) => depth(y.to, v) - depth(x.to, v));
    if (!kids.length) return;
    const linear = g.nb.get(v)!.some(n => n.order === 3) || g.nb.get(v)!.filter(n => n.order === 2).length === 2;
    if (linear && kids.length === 1) { place(kids[0].to, v, angleIn, turn); return; }
    const t = -turn;
    // Hauptast im Zickzack, die übrigen gleichmäßig in der Lücke auf der anderen Seite (zwischen Hauptast und Rückweg)
    place(kids[0].to, v, angleIn + 60 * t, t);
    const rest = kids.slice(1);
    rest.forEach((k, i) => place(k.to, v, angleIn + 60 * t - (240 * (i + 1) / (rest.length + 1)) * t, -t));
  };

  // Start: Ende des längsten Wegs; ein Ring als Start, wenn es keine Kette gibt
  const start = farthest(g, farthest(g, g.ids.find(x => g.el.get(x) === "C") ?? g.ids[0]));
  pos.set(start, { x: 0, y: 0 });
  if (ri.ringOf.has(start)) placeRing(start, null);
  else grow(start, -1, -30, -1);
  // senkrecht ausrichten: nichts; Mittelpunkt auf 0
  const xs = [...pos.values()];
  const cx = (Math.min(...xs.map(p => p.x)) + Math.max(...xs.map(p => p.x))) / 2;
  const cy = (Math.min(...xs.map(p => p.y)) + Math.max(...xs.map(p => p.y))) / 2;
  return {
    atoms: mol.atoms.map(a => ({ ...a, x: round(pos.get(a.id)!.x - cx), y: round(pos.get(a.id)!.y - cy) })),
    bonds: mol.bonds.map(b => ({ ...b })),
  };
}

const round = (v: number) => Math.round(v * 1000) / 1000;

/** Richtung (Grad) für ein neues Atom an `id`: größte Lücke zwischen den Bindungen, Zickzack, gerade bei Dreifachbindung */
export function nextDirection(mol: Mol, id: number): number {
  const g = graph(mol);
  const a = mol.atoms.find(x => x.id === id)!;
  const nbs = g.nb.get(id)!;
  const angs = nbs.map(n => {
    const b = mol.atoms.find(x => x.id === n.to)!;
    return (Math.atan2(b.y - a.y, b.x - a.x) / RAD + 360) % 360;
  });
  const free = (deg: number) => {
    const p = { x: a.x + Math.cos(deg * RAD), y: a.y + Math.sin(deg * RAD) };
    return Math.min(9, ...mol.atoms.filter(x => x.id !== id).map(x => Math.hypot(x.x - p.x, x.y - p.y)));
  };
  let cands: number[];
  if (!angs.length) cands = [-30, 30, 0];
  else if (angs.length === 1) {
    const back = angs[0];
    if (nbs[0].order === 3) cands = [back + 180];
    else {
      // Zickzack: Knick in die Gegenrichtung zum vorigen Knick (ohne vorigen: Gegenseite in y)
      const nb = mol.atoms.find(x => x.id === nbs[0].to)!;
      const p = { x: a.x - nb.x, y: a.y - nb.y };
      const up = back + 120, down = back - 120;
      const prev = g.nb.get(nb.id)!.filter(n => n.to !== id).map(n => mol.atoms.find(x => x.id === n.to)!);
      const cross = (u: { x: number; y: number }, v: { x: number; y: number }) => u.x * v.y - u.y * v.x;
      const cu = dir(up);
      let first: number;
      if (prev.length === 1) {
        const q = { x: nb.x - prev[0].x, y: nb.y - prev[0].y };
        first = Math.sign(cross(p, cu)) === -Math.sign(cross(q, p)) ? up : down;
      } else first = Math.abs(p.y) > 1e-6 ? (Math.sign(cu.y) === -Math.sign(p.y) ? up : down) : (cu.y < 0 ? up : down);
      cands = [first, first === up ? down : up, back + 180];
    }
  } else {
    const s = [...angs].sort((x, y) => x - y);
    const gaps = s.map((v, i) => ({ from: v, size: ((s[(i + 1) % s.length] - v + 360) % 360) || 360 }));
    gaps.sort((x, y) => y.size - x.size);
    cands = gaps.map(gp => gp.from + gp.size / 2);
  }
  // auf 30° einrasten, die freieste Richtung nehmen (bei Gleichstand die erste)
  const snapped = cands.map(c => Math.round(c / 30) * 30);
  let best = snapped[0], bestFree = free(best);
  for (const c of snapped.slice(1)) if (free(c) > bestFree + 0.3) { best = c; bestFree = free(c); }
  if (bestFree < 0.6) {
    for (let d = 0; d < 360; d += 30) if (free(d) > bestFree + 0.3) { best = d; bestFree = free(d); }
  }
  return ((best % 360) + 360) % 360;
}
