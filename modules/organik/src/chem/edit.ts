// Zeichnen: reine Funktionen auf dem Molekül (neues Molekül zurück, null = geht nicht – Wertigkeit voll).

import { findBond, freeValence, graph, nextId, usedValence, VALENCE, type El, type Mol, type Order } from "./mol.ts";
import { nextDirection } from "./layout.ts";

const RAD = Math.PI / 180;
const round = (v: number) => Math.round(v * 1000) / 1000;

export type RingKind = "benzol" | "ring6" | "ring5";
export const RING_SIZE: Record<RingKind, number> = { benzol: 6, ring6: 6, ring5: 5 };

/** erstes Atom in die Mitte */
export function start(el: El): Mol {
  return { atoms: [{ id: 0, el, x: 0, y: 0 }], bonds: [] };
}

/** neues Atom an `id` anhängen (Richtung: größte Lücke, Zickzack) */
export function append(mol: Mol, id: number, el: El, deg?: number): Mol | null {
  if (freeValence(mol, id) < 1) return null;
  const a = mol.atoms.find(x => x.id === id)!;
  const d = deg ?? nextDirection(mol, id);
  const n = nextId(mol);
  return {
    atoms: [...mol.atoms, { id: n, el, x: round(a.x + Math.cos(d * RAD)), y: round(a.y + Math.sin(d * RAD)) }],
    bonds: [...mol.bonds, { a: id, b: n, order: 1 }],
  };
}

/** Atom an einer freien Stelle (Ziehen ins Leere): neues Atom mit Bindung */
export function appendAt(mol: Mol, id: number, el: El, x: number, y: number): Mol | null {
  if (freeValence(mol, id) < 1) return null;
  const n = nextId(mol);
  return { atoms: [...mol.atoms, { id: n, el, x: round(x), y: round(y) }], bonds: [...mol.bonds, { a: id, b: n, order: 1 }] };
}

/** zwei Atome verbinden; besteht die Bindung schon, wird sie erhöht */
export function connect(mol: Mol, a: number, b: number): Mol | null {
  if (a === b) return null;
  const ex = findBond(mol, a, b);
  if (ex) return raise(mol, a, b);
  if (freeValence(mol, a) < 1 || freeValence(mol, b) < 1) return null;
  return { atoms: mol.atoms, bonds: [...mol.bonds, { a, b, order: 1 }] };
}

function raise(mol: Mol, a: number, b: number): Mol | null {
  const bond = findBond(mol, a, b)!;
  if (bond.order >= 3 || freeValence(mol, a) < 1 || freeValence(mol, b) < 1) return null;
  return { atoms: mol.atoms, bonds: mol.bonds.map(x => (x === bond ? { ...x, order: (x.order + 1) as Order } : x)) };
}

/** Bindung antippen: Einfach → Doppel → Dreifach → Einfach (übersprungen, was die Wertigkeit nicht erlaubt) */
export function cycleBond(mol: Mol, a: number, b: number): Mol | null {
  const bond = findBond(mol, a, b);
  if (!bond) return null;
  for (let step = 1; step <= 2; step++) {
    const order = (((bond.order - 1 + step) % 3) + 1) as Order;
    const delta = order - bond.order;
    if (delta <= 0 || (freeValence(mol, a) >= delta && freeValence(mol, b) >= delta))
      return { atoms: mol.atoms, bonds: mol.bonds.map(x => (x === bond ? { ...x, order } : x)) };
  }
  return null;
}

/** Element tauschen (C → O …), wenn die Bindungen passen */
export function replace(mol: Mol, id: number, el: El): Mol | null {
  const g = graph(mol);
  const a = mol.atoms.find(x => x.id === id);
  if (!a || a.el === el || usedValence(g, id) > VALENCE[el]) return null;
  return { atoms: mol.atoms.map(x => (x.id === id ? { ...x, el } : x)), bonds: mol.bonds };
}

export function removeAtom(mol: Mol, id: number): Mol {
  return { atoms: mol.atoms.filter(a => a.id !== id), bonds: mol.bonds.filter(b => b.a !== id && b.b !== id) };
}

export function removeBond(mol: Mol, a: number, b: number): Mol {
  const bond = findBond(mol, a, b);
  return { atoms: mol.atoms, bonds: mol.bonds.filter(x => x !== bond) };
}

export function move(mol: Mol, id: number, x: number, y: number): Mol {
  return { atoms: mol.atoms.map(a => (a.id === id ? { ...a, x: round(x), y: round(y) } : a)), bonds: mol.bonds };
}

/** Ring anhängen (an Atom `id`) oder allein in die Mitte setzen (id = null) */
export function addRing(mol: Mol, id: number | null, kind: RingKind): Mol | null {
  const n = RING_SIZE[kind], R = 1 / (2 * Math.sin(Math.PI / n));
  const base = nextId(mol);
  let cx = 0, cy = 0, a0: number;
  if (id === null || !mol.atoms.length) {
    if (mol.atoms.length) {
      cx = Math.max(...mol.atoms.map(a => a.x)) + R + 1.5;
      cy = 0;
    }
    a0 = -90 * RAD;
  } else {
    if (freeValence(mol, id) < 1) return null;
    const a = mol.atoms.find(x => x.id === id)!;
    const d = nextDirection(mol, id) * RAD;
    cx = a.x + Math.cos(d) * (1 + R); cy = a.y + Math.sin(d) * (1 + R);
    a0 = d + Math.PI;
  }
  const atoms = Array.from({ length: n }, (_, i) => ({
    id: base + i, el: "C" as El,
    x: round(cx + R * Math.cos(a0 + (i * 2 * Math.PI) / n)), y: round(cy + R * Math.sin(a0 + (i * 2 * Math.PI) / n)),
  }));
  const bonds = atoms.map((a, i) => ({ a: a.id, b: atoms[(i + 1) % n].id, order: (kind === "benzol" && i % 2 === 0 ? 2 : 1) as Order }));
  if (id !== null && mol.atoms.length) bonds.push({ a: id, b: base, order: 1 });
  return { atoms: [...mol.atoms, ...atoms], bonds: [...mol.bonds, ...bonds] };
}

/** Atom an einer Stelle (Abstand < r) */
export function atomAt(mol: Mol, x: number, y: number, r = 0.4): number | undefined {
  let best: number | undefined, bd = r;
  for (const a of mol.atoms) {
    const d = Math.hypot(a.x - x, a.y - y);
    if (d < bd) { bd = d; best = a.id; }
  }
  return best;
}
