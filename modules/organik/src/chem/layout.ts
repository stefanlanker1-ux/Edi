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

  /** an einem C der Doppelbindung: keine gerade Linie und nicht beide Gruppen auf derselben Seite – sonst ist E/Z nicht ablesbar */
  const sp2Pen = (at: number, deg: number) => {
    const nb = g.nb.get(at)!, dbl = nb.filter(n => n.order === 2);
    if (dbl.length !== 1 || nb.some(n => n.order === 3)) return 0;
    const p = pos.get(at)!, dirOf = (q: { x: number; y: number }) => Math.atan2(q.y - p.y, q.x - p.x) / RAD;
    let pen = 0;
    for (const n of nb) {
      const q = pos.get(n.to);
      // Winkel zwischen der neuen und einer vorhandenen Bindung (0 … 180°): fast 180° = gerade Linie
      if (q && Math.abs(((deg - dirOf(q) + 540) % 360) - 180) > 165) pen += 5;
    }
    const w = pos.get(dbl[0].to);
    if (w) {
      const ax = dirOf(w), side = (a: number) => Math.sign(Math.round(Math.sin((a - ax) * RAD) * 1000));
      for (const n of nb) {
        const q = pos.get(n.to);
        if (q && n.to !== dbl[0].to && side(deg) !== 0 && side(dirOf(q)) === side(deg)) pen += 5;
      }
    }
    return pen;
  };

  const place = (v: number, from: number, angle: number, turn = 1) => {
    if (pos.has(v)) return;
    const pf = pos.get(from)!;
    // Ausweichen, falls die Stelle besetzt ist
    let a = angle, best = Infinity;
    for (const d of [0, 30, -30, 60, -60, 90, -90]) {
      const t = angle + d, q = { x: pf.x + Math.cos(t * RAD), y: pf.y + Math.sin(t * RAD) };
      const pen = crowd(q, [from]) + Math.abs(d) / 400 + sp2Pen(from, t);
      if (pen < best - 1e-9) { best = pen; a = t; }
    }
    pos.set(v, { x: pf.x + Math.cos(a * RAD), y: pf.y + Math.sin(a * RAD) });
    if (ri.ringOf.has(v) && !placedRing.has(ri.ringOf.get(v)!)) { placeRing(v, a); return; }
    grow(v, from, a, turn);
  };

  const grow = (v: number, from: number, angleIn: number, turn: number) => {
    const kids = g.nb.get(v)!.filter(n => !pos.has(n.to)).sort((x, y) => depth(y.to, v) - depth(x.to, v));
    if (!kids.length) return;
    // Startatom ohne Vorgänger: Nachbarn gleichmäßig rundum (drei Nachbarn im Abstand von 120°)
    if (from < 0 && kids.length > 1) {
      const step = 360 / Math.max(kids.length, 3);
      kids.forEach((k, i) => place(k.to, v, angleIn + 60 + i * step, i % 2 ? 1 : -1));
      return;
    }
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
  spreadBranches(g, ri, pos);
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

/** Äste – einzelne Endatome (Cl, OH, =O, CH₃), kleine Teilbäume und Ringe als Ast (bis 8 Atome) –, die anderen Atomen zu nahe kommen,
 *  als Ganzes um ihr Anknüpfungsatom in die freieste Richtung drehen (15°-Schritte, größter kleinster Abstand). Bei vielen Ästen an
 *  benachbarten C (Perchlorhexan, 3,3-Diethyl-4,5,5-trimethylheptan) oder zwei Ringen am selben C legt der Zickzack sonst Atome fast
 *  übereinander. Gedreht wird starr (im Ast bleibt alles, wie es war) und immer die kleinere Seite; am Ring nur nach außen.
 *  Nicht an Atomen mit Dreifachbindung oder einer C=C/C=N außerhalb kleiner Ringe (E/Z und gerade Linien bleiben; C=O darf sich drehen). */
function spreadBranches(g: Graph, ri: ReturnType<typeof findRings>, pos: Map<number, { x: number; y: number }>) {
  const n = g.ids.length;
  const ringBond = (a: number, b: number) => ri.ringOf.has(a) && ri.ringOf.get(a) === ri.ringOf.get(b);
  /** Atome hinter u (von v aus gesehen) – höchstens 8 und die kleinere Seite */
  const side = (u: number, v: number): Set<number> | undefined => {
    const seen = new Set([u]), stack = [u];
    while (stack.length) {
      const x = stack.pop()!;
      for (const m of g.nb.get(x)!) if (m.to !== v && !seen.has(m.to)) { seen.add(m.to); stack.push(m.to); }
      if (seen.size > 8) return;
    }
    return seen.size === 1 || seen.size * 2 < n ? seen : undefined;
  };
  /** kleinster Abstand zwischen den Atomen des Asts (Lage `at`) und allen übrigen */
  const gap = (S: Set<number>, at: (id: number) => { x: number; y: number }) => {
    let d = Infinity;
    for (const a of S) { const p = at(a); for (const [id, q] of pos) if (!S.has(id)) d = Math.min(d, Math.hypot(p.x - q.x, p.y - q.y)); }
    return d;
  };
  for (let pass = 0; pass < 6; pass++) {
    let moved = false;
    for (const v of g.ids) {
      const nb = g.nb.get(v)!;
      if (nb.some(m => m.order === 3 || (m.order === 2 && g.el.get(m.to) !== "O" && !(ringBond(v, m.to) && ri.ringOf.get(v)!.atoms.length < 8)))) continue;
      const c = pos.get(v)!;
      // am Ring: Richtung nach außen (weg von der Ringmitte)
      const ring = ri.ringOf.get(v);
      const out = ring && (() => { const m = ring.atoms.reduce((s, a) => ({ x: s.x + pos.get(a)!.x / ring.atoms.length, y: s.y + pos.get(a)!.y / ring.atoms.length }), { x: 0, y: 0 }); return { x: c.x - m.x, y: c.y - m.y }; })();
      for (const { to: u, order } of nb) {
        if (ringBond(u, v) || order === 3 || (order === 2 && g.nb.get(u)!.length > 1)) continue;
        const S = side(u, v);
        if (!S) continue;
        const now = gap(S, a => pos.get(a)!);
        if (now >= 0.9) continue;
        const turned = (t: number) => (a: number) => {
          const p = pos.get(a)!, cs = Math.cos(t * RAD), sn = Math.sin(t * RAD);
          return { x: c.x + (p.x - c.x) * cs - (p.y - c.y) * sn, y: c.y + (p.x - c.x) * sn + (p.y - c.y) * cs };
        };
        const outward = (q: { x: number; y: number }) => !out || (q.x - c.x) * out.x + (q.y - c.y) * out.y > 0.3 * Math.hypot(out.x, out.y);
        let best = now, bt = 0;
        for (let t = 15; t < 360; t += 15) {
          const at = turned(t);
          if (!outward(at(u))) continue;
          const d = gap(S, at);
          if (d > best + 0.05) { best = d; bt = t; }
        }
        if (bt) { const at = turned(bt), next = [...S].map(a => [a, at(a)] as const); for (const [a, q] of next) pos.set(a, q); moved = true; }
      }
    }
    if (!moved) break;
  }
}

/** Für kleine Bilder (Antwortformeln im Quiz): um ein Vielfaches von 30° drehen, sodass die Formel in eine Fläche mit dem
 *  Seitenverhältnis `aspect` (Breite : Höhe) möglichst groß passt. Die Bindungen bleiben im 30°-Raster, E/Z bleibt (keine Spiegelung). */
export function orient(mol: Mol, aspect: number, pad = 0.7): Mol {
  let best = mol, bs = -1;
  for (let k = 0; k < 12; k++) {
    const c = Math.cos(k * 30 * RAD), s = Math.sin(k * 30 * RAD);
    const atoms = mol.atoms.map(p => ({ ...p, x: round(p.x * c - p.y * s), y: round(p.x * s + p.y * c) }));
    const xs = atoms.map(p => p.x), ys = atoms.map(p => p.y);
    const w = Math.max(...xs) - Math.min(...xs) + 2 * pad, h = Math.max(...ys) - Math.min(...ys) + 2 * pad;
    const sc = Math.min(aspect / w, 1 / h);
    if (sc > bs + 1e-6) { bs = sc; best = { ...mol, atoms }; }
  }
  return best;
}

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
