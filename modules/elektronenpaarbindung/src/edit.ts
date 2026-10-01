// Bearbeiten eines Moleküls auf dem Raster (reine Funktionen, getestet in edit.test.ts).

import { adjacent, bondKey, canBond, KNOWN_BY_ID, toMolecule, moleculeSize, type Molecule } from "@lern/chem";

export const COLS = 6, ROWS = 5;
export const empty = (): Molecule => ({ atoms: [], bonds: [] });
const nextId = (m: Molecule) => Math.max(0, ...m.atoms.map(a => a.id)) + 1;
export const atomAt = (m: Molecule, x: number, y: number) => m.atoms.find(a => a.x === x && a.y === y);
export const inGrid = (x: number, y: number) => x >= 0 && y >= 0 && x < COLS && y < ROWS;

/** Neue Einfachbindungen zu Nachbarn, wo beide Atome noch ungepaarte Elektronen haben */
function autoBond(m: Molecule, id: number): Molecule {
  let cur = m;
  const a = cur.atoms.find(x => x.id === id)!;
  for (const nb of cur.atoms.filter(o => adjacent(a, o))) {
    if (cur.bonds.some(b => bondKey(b.a, b.b) === bondKey(id, nb.id))) continue;
    if (canBond(cur, id, nb.id)) cur = { ...cur, bonds: [...cur.bonds, { a: id, b: nb.id, order: 1 }] };
  }
  return cur;
}

export function place(m: Molecule, el: string, x: number, y: number): Molecule {
  if (!inGrid(x, y) || atomAt(m, x, y)) return m;
  const id = nextId(m);
  return autoBond({ ...m, atoms: [...m.atoms, { id, el, x, y }] }, id);
}

export function move(m: Molecule, id: number, x: number, y: number): Molecule {
  if (!inGrid(x, y)) return remove(m, id);
  const other = atomAt(m, x, y);
  if (other && other.id !== id) return m;
  const atoms = m.atoms.map(a => (a.id === id ? { ...a, x, y } : a));
  const bonds = m.bonds.filter(b => {
    const p = atoms.find(a => a.id === b.a)!, q = atoms.find(a => a.id === b.b)!;
    return adjacent(p, q);
  });
  return autoBond({ atoms, bonds }, id);
}

export const remove = (m: Molecule, id: number): Molecule =>
  ({ atoms: m.atoms.filter(a => a.id !== id), bonds: m.bonds.filter(b => b.a !== id && b.b !== id) });

/** Tipp auf eine Bindung: Einfach → Zweifach → Dreifach (wenn möglich), sonst lösen */
export function cycleBond(m: Molecule, a: number, b: number): { mol: Molecule; action: "up" | "removed" } {
  const k = bondKey(a, b);
  if (canBond(m, a, b)) return { mol: { ...m, bonds: m.bonds.map(x => (bondKey(x.a, x.b) === k ? { ...x, order: x.order + 1 } : x)) }, action: "up" };
  return { mol: { ...m, bonds: m.bonds.filter(x => bondKey(x.a, x.b) !== k) }, action: "removed" };
}

/** Neue Bindung zwischen zwei Nachbarn */
export const addBond = (m: Molecule, a: number, b: number): Molecule =>
  (canBond(m, a, b) ? { ...m, bonds: [...m.bonds, { a, b, order: 1 }] } : m);

/** Mögliche neue Bindungen (für die „+“-Knöpfe) */
export function bondOptions(m: Molecule): [number, number][] {
  const out: [number, number][] = [];
  for (const p of m.atoms) for (const q of m.atoms) {
    if (p.id >= q.id || !adjacent(p, q)) continue;
    if (m.bonds.some(b => bondKey(b.a, b.b) === bondKey(p.id, q.id))) continue;
    if (canBond(m, p.id, q.id)) out.push([p.id, q.id]);
  }
  return out;
}

/** Bekanntes Molekül mittig auf das Raster legen */
export function loadKnown(id: string): Molecule {
  const k = KNOWN_BY_ID[id];
  const { w, h } = moleculeSize(k);
  return toMolecule(k, Math.floor((COLS - w) / 2), Math.floor((ROWS - h) / 2));
}
