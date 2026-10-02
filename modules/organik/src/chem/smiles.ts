// Kurzschreibweise für Beispiele und Tests (SMILES ohne Aromaten-Kleinbuchstaben): Ringe in Kekulé-Form (C1=CC=CC=C1),
// Verzweigungen in Klammern, Ringschluss mit Ziffern, Nitrogruppe als [NO2]. Lage der Atome: layout.ts.

import type { El, Mol, Order } from "./mol.ts";

const SYMBOLS: El[] = ["Cl", "Br", "C", "O", "N", "S", "F", "I"];

export function parseSmiles(s: string): Mol {
  const mol: Mol = { atoms: [], bonds: [] };
  const stack: number[] = [];
  const rings = new Map<string, { atom: number; order: Order | 0 }>();
  let prev = -1, order: Order | 0 = 0, i = 0;
  const addAtom = (el: El) => {
    const id = mol.atoms.length;
    mol.atoms.push({ id, el, x: 0, y: 0 });
    if (prev >= 0) mol.bonds.push({ a: prev, b: id, order: order || 1 });
    prev = id; order = 0;
  };
  while (i < s.length) {
    const c = s[i];
    if (c === "(") { stack.push(prev); i++; continue; }
    if (c === ")") { prev = stack.pop()!; i++; continue; }
    if (c === "-") { order = 1; i++; continue; }
    if (c === "=") { order = 2; i++; continue; }
    if (c === "#") { order = 3; i++; continue; }
    if (c === "[") {
      const end = s.indexOf("]", i);
      const inner = s.slice(i + 1, end);
      if (inner !== "NO2") throw new Error(`unbekannt: [${inner}]`);
      addAtom("NO2"); i = end + 1; continue;
    }
    if (/\d/.test(c) || c === "%") {
      const key = c === "%" ? s.slice(i + 1, i + 3) : c;
      i += c === "%" ? 3 : 1;
      const open = rings.get(key);
      if (open) {
        mol.bonds.push({ a: open.atom, b: prev, order: (order || open.order || 1) as Order });
        rings.delete(key); order = 0;
      } else { rings.set(key, { atom: prev, order }); order = 0; }
      continue;
    }
    const sym = SYMBOLS.find(x => s.startsWith(x, i));
    if (!sym) throw new Error(`unbekanntes Zeichen „${c}“ in ${s}`);
    addAtom(sym); i += sym.length;
  }
  if (rings.size) throw new Error(`offener Ring in ${s}`);
  return mol;
}
