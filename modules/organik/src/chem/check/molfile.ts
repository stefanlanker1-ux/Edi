// Molekül als Molfile (V2000, 2D) für die Prüfung mit RDKit: Atome in derselben Reihenfolge wie im Molekül (Index = Position),
// NO₂ als N⁺(=O)–O⁻ (die beiden O hinten angehängt), Wasserstoff implizit, y nach oben. E/Z ergibt sich aus den Koordinaten.

import type { Mol } from "../mol.ts";

const f = (v: number) => v.toFixed(4).padStart(10);
const n3 = (v: number) => String(v).padStart(3);

export function toMolblock(mol: Mol, title = ""): string {
  const idx = new Map(mol.atoms.map((a, i) => [a.id, i + 1]));
  const atoms = mol.atoms.map(a => ({ el: a.el === "NO2" ? "N" : a.el, x: a.x, y: -a.y, q: a.el === "NO2" ? 1 : 0 }));
  const bonds = mol.bonds.map(b => [idx.get(b.a)!, idx.get(b.b)!, b.order]);
  for (const a of mol.atoms) {
    if (a.el !== "NO2") continue;
    const bd = mol.bonds.find(b => b.a === a.id || b.b === a.id);
    const nb = bd && mol.atoms.find(x => x.id === (bd.a === a.id ? bd.b : bd.a));
    const base = nb ? Math.atan2(-(a.y - nb.y), a.x - nb.x) : 0;
    for (const [order, turn, q] of [[2, 1, 0], [1, -1, -1]] as const) {
      const t = base + (turn * Math.PI) / 3;
      atoms.push({ el: "O", x: a.x + Math.cos(t), y: -a.y + Math.sin(t), q });
      bonds.push([idx.get(a.id)!, atoms.length, order]);
    }
  }
  const lines = [title, "  organik          2D", "", `${n3(atoms.length)}${n3(bonds.length)}  0  0  0  0  0  0  0  0999 V2000`];
  for (const a of atoms) lines.push(`${f(a.x)}${f(a.y)}${f(0)} ${a.el.padEnd(3)} 0  0  0  0  0  0  0  0  0  0  0  0`);
  for (const [a, b, o] of bonds) lines.push(`${n3(a)}${n3(b)}${n3(o)}  0  0  0  0`);
  const charged = atoms.map((a, i) => [i + 1, a.q]).filter(([, q]) => q);
  for (let i = 0; i < charged.length; i += 8) {
    const part = charged.slice(i, i + 8);
    lines.push(`M  CHG${n3(part.length)}${part.map(([k, q]) => ` ${n3(k)} ${n3(q)}`).join("")}`);
  }
  lines.push("M  END");
  return lines.join("\n");
}
