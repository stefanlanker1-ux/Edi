// Lage der Valenzstrichformel: Ausgangspunkt ist das Raster des Baufelds. Gewinkelte Zentralatome (H₂O, H₂S, OF₂, SO₂,
// O in CH₃OH und H₂O₂) werden auf ihren Bindungswinkel gebogen (4 Elektronenpaare ≈ 105°, 3 Elektronenpaare ≈ 120°),
// auch wenn die Atome im Raster in einer Reihe liegen. Gedreht wird der kleinere Teil des Moleküls, bei gleich großen Teilen
// beide je zur Hälfte. Freie Elektronenpaare des gebogenen Atoms liegen gleichmäßig in der großen Lücke gegenüber.

import { bondsOf, electronsOf, isComplete, loneLayout, shapeAt, type Molecule } from "@lern/chem";

export interface StrichLayout {
  /** Lage in Rastereinheiten (1 = eine Bindung) */
  pos: Map<number, [number, number]>;
  /** freie Elektronen je Atom: Richtung in Grad (SVG: 0 = rechts, 90 = unten) */
  lone: Map<number, { angle: number; n: 1 | 2 }[]>;
}

const wrap = (a: number) => ((a % 360) + 360) % 360;
const deg = (r: number) => (r * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;
/** kleinster Winkelabstand (vorzeichenbehaftet, −180 … 180) von a nach b */
const diff = (a: number, b: number) => wrap(b - a + 180) - 180;

/** Atome, die man von start aus erreicht, ohne über block zu gehen */
function side(m: Molecule, start: number, block: number): Set<number> {
  const seen = new Set([start]), stack = [start];
  while (stack.length) {
    const id = stack.pop()!;
    for (const b of bondsOf(m, id)) {
      const o = b.a === id ? b.b : b.a;
      if (o !== block && !seen.has(o)) { seen.add(o); stack.push(o); }
    }
  }
  return seen;
}

export function strichLayout(m: Molecule): StrichLayout {
  const pos = new Map(m.atoms.map(a => [a.id, [a.x, a.y] as [number, number]]));
  const lone = new Map(m.atoms.map(a => [a.id, loneLayout(m, a.id)]));
  if (!isComplete(m)) return { pos, lone };

  const dir = (c: number, o: number) => { const [x0, y0] = pos.get(c)!, [x1, y1] = pos.get(o)!; return wrap(deg(Math.atan2(y1 - y0, x1 - x0))); };
  const rotate = (ids: Set<number>, c: number, by: number, P: Map<number, [number, number]>) => {
    const [cx, cy] = P.get(c)!, co = Math.cos(rad(by)), si = Math.sin(rad(by));
    for (const id of ids) { const [x, y] = P.get(id)!, dx = x - cx, dy = y - cy; P.set(id, [cx + dx * co - dy * si, cy + dx * si + dy * co]); }
  };
  const bonded = new Set(m.bonds.flatMap(b => [`${b.a},${b.b}`, `${b.b},${b.a}`]));
  /** kleinster Abstand zweier Atome und „Gedränge“ (Summe 1/d² über nicht gebundene Paare) */
  const crowd = (P: Map<number, [number, number]>) => {
    const ps = [...P.entries()];
    let min = Infinity, e = 0;
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      const d = Math.hypot(ps[i][1][0] - ps[j][1][0], ps[i][1][1] - ps[j][1][1]);
      min = Math.min(min, d);
      if (!bonded.has(`${ps[i][0]},${ps[j][0]}`)) e += 1 / (d * d);
    }
    return { min, e };
  };

  for (const a of m.atoms) {
    const sh = shapeAt(m, a.id);
    if (!sh || sh.geometry !== "gewinkelt") continue;
    const target = sh.pairs + sh.neighbors === 4 ? 105 : 120;
    const [n1, n2] = bondsOf(m, a.id).map(b => (b.a === a.id ? b.b : b.a));
    const s1 = side(m, n1, a.id), s2 = side(m, n2, a.id);
    if (s1.has(n2)) continue; // Ring: bleibt wie gebaut
    const a1 = dir(a.id, n1), a2 = dir(a.id, n2);
    const open = Math.abs(diff(a1, a2));
    // Winkelhalbierende: bei gestreckter Lage beide Seiten prüfen
    const bisectors = open > 179 ? [wrap(a1 + 90), wrap(a1 - 90)] : [wrap(a1 + diff(a1, a2) / 2)];
    let best: { P: Map<number, [number, number]>; turns: [Set<number>, number][]; score: number } | null = null;
    for (const bis of bisectors) {
      const P = new Map(pos);
      const turns: [Set<number>, number][] = [];
      const to1 = diff(bis, a1) < 0 ? wrap(bis - target / 2) : wrap(bis + target / 2);
      const to2 = wrap(2 * bis - to1);
      if (s1.size === s2.size) { turns.push([s1, diff(a1, to1)], [s2, diff(a2, to2)]); }
      else {
        // kleinerer Teil dreht sich, der größere bleibt liegen
        const [small, aS, aB] = s1.size < s2.size ? [s1, a1, a2] : [s2, a2, a1];
        const toS = wrap(aB + (diff(aB, bis) >= 0 ? target : -target));
        turns.push([small, diff(aS, toS)]);
      }
      for (const [ids, by] of turns) rotate(ids, a.id, by, P);
      // Atome sollen sich nicht nahe kommen; bei Gleichstand nach unten bzw. rechts (übliche Zeichnung von H₂O)
      const { min, e } = crowd(P), [bx, by] = [Math.cos(rad(bis)), Math.sin(rad(bis))];
      const score = -Math.round(e * 1000) / 1000 + by * 1e-4 + bx * 1e-5;
      if (min > .75 && (!best || score > best.score)) best = { P, turns, score };
    }
    if (!best) continue;
    for (const [id, p] of best.P) pos.set(id, p);
    for (const [ids, by] of best.turns) for (const id of ids) lone.set(id, lone.get(id)!.map(g => ({ ...g, angle: wrap(g.angle + by) })));
    // freie Paare des gebogenen Atoms gleichmäßig in der großen Lücke
    const b1 = dir(a.id, n1), b2 = dir(a.id, n2);
    const [from, gap] = wrap(b2 - b1) > 180 ? [b2, wrap(b1 - b2)] : [b1, wrap(b2 - b1)];
    const [start, width] = gap >= 180 ? [from, gap] : [b2 === from ? b1 : b2, 360 - gap];
    const e = electronsOf(m, a.id);
    const k = e.pairs + e.singles;
    lone.set(a.id, Array.from({ length: k }, (_, i) => ({ angle: wrap(start + (width * (i + 1)) / (k + 1)), n: (i < e.pairs ? 2 : 1) as 1 | 2 })));
  }
  return { pos, lone };
}
