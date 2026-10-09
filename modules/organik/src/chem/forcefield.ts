// Gezeichnetes Molekül als Eingabe für das Kraftfeld (3D-Ansicht): alle H einzeln, NO₂ als Nitrogruppe mit Ladungen,
// E/Z jeder Doppelbindung außerhalb von Ringen so, wie sie gezeichnet ist.

import type { FFInput } from "@lern/chem-ui";
import { graph, hCount, type Mol } from "./mol.ts";
import { findRings } from "./rings.ts";

export function ffInput(mol: Mol): FFInput {
  const g = graph(mol);
  const el: string[] = [], q: number[] = [], b: [number, number, number][] = [];
  const idx = new Map<number, number>();
  const add = (e: string, charge = 0) => { el.push(e); q.push(charge); return el.length - 1; };
  for (const a of mol.atoms) {
    if (a.el === "NO2") {
      const n = add("N", 1), o1 = add("O"), o2 = add("O", -1);
      b.push([n, o1, 2], [n, o2, 1]);
      idx.set(a.id, n);
    } else idx.set(a.id, add(a.el));
  }
  for (const bd of mol.bonds) b.push([idx.get(bd.a)!, idx.get(bd.b)!, bd.order]);
  for (const a of mol.atoms) {
    if (a.el === "NO2") continue;
    for (let k = hCount(g, a.id); k > 0; k--) b.push([idx.get(a.id)!, add("H"), 1]);
  }
  // E/Z aus der Zeichnung: Nachbarn auf derselben Seite der Doppelbindung = cis
  const ringAtoms = new Set(findRings(g).rings.flatMap(r => r.atoms));
  const pos = new Map(mol.atoms.map(a => [a.id, a]));
  const d: number[][] = [];
  for (const bd of mol.bonds) {
    if (bd.order !== 2 || (ringAtoms.has(bd.a) && ringAtoms.has(bd.b))) continue;
    const n1 = g.nb.get(bd.a)!.find(n => n.to !== bd.b)?.to, n2 = g.nb.get(bd.b)!.find(n => n.to !== bd.a)?.to;
    if (n1 === undefined || n2 === undefined) continue;
    const A = pos.get(bd.a)!, B = pos.get(bd.b)!, P1 = pos.get(n1)!, P2 = pos.get(n2)!;
    const side = (p: { x: number; y: number }) => Math.sign((B.x - A.x) * (p.y - A.y) - (B.y - A.y) * (p.x - A.x));
    d.push([idx.get(n1)!, idx.get(bd.a)!, idx.get(bd.b)!, idx.get(n2)!, side(P1) === side(P2) ? 1 : 0]);
  }
  return { el, q, b, stereo: { c: [], d } };
}
