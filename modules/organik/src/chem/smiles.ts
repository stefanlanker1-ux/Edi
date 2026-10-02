// Kurzschreibweise für Beispiele und Tests (SMILES ohne Aromaten-Kleinbuchstaben): Ringe in Kekulé-Form (C1=CC=CC=C1),
// Verzweigungen in Klammern, Ringschluss mit Ziffern (%12 ab 10), Nitrogruppe als [NO2] oder [N+](=O)[O-],
// Atome in eckigen Klammern ([NH], [CH2]: H werden aus der Wertigkeit berechnet), E/Z mit / und \ an den Nachbarbindungen
// (C/C=C/C = E, C/C=C\C = Z). `smilesMol` zeichnet das Molekül (layout.ts) und stellt E/Z aus / \ her.

import { graph, type El, type Mol, type Order } from "./mol.ts";
import { layout } from "./layout.ts";
import { flipBond } from "./stereo.ts";

const SYMBOLS: El[] = ["Cl", "Br", "C", "O", "N", "S", "F", "I"];

/** Richtungszeichen an Einfachbindungen (in Schreibrichtung a → b) */
export interface Parsed { mol: Mol; dirs: Map<string, { from: number; to: number; dir: "/" | "\\" }> }

export function parseSmilesFull(s: string): Parsed {
  const mol: Mol = { atoms: [], bonds: [] };
  const charge = new Map<number, number>();
  const dirs: Parsed["dirs"] = new Map();
  const stack: number[] = [];
  const rings = new Map<string, { atom: number; order: Order | 0; dir?: "/" | "\\" }>();
  let prev = -1, order: Order | 0 = 0, dir: "/" | "\\" | undefined, i = 0;
  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const bond = (a: number, b: number, o: Order, d?: "/" | "\\", from = a) => {
    mol.bonds.push({ a, b, order: o });
    if (d) dirs.set(key(a, b), { from, to: from === a ? b : a, dir: d });
  };
  const addAtom = (el: El, q = 0) => {
    const id = mol.atoms.length;
    mol.atoms.push({ id, el, x: 0, y: 0 });
    if (q) charge.set(id, q);
    if (prev >= 0) bond(prev, id, order || 1, dir);
    prev = id; order = 0; dir = undefined;
  };
  while (i < s.length) {
    const c = s[i];
    if (c === "(") { stack.push(prev); i++; continue; }
    if (c === ")") { prev = stack.pop()!; i++; continue; }
    if (c === "-") { order = 1; i++; continue; }
    if (c === "=") { order = 2; i++; continue; }
    if (c === "#") { order = 3; i++; continue; }
    if (c === "/" || c === "\\") { dir = c; i++; continue; }
    if (c === "[") {
      const end = s.indexOf("]", i);
      const inner = s.slice(i + 1, end);
      i = end + 1;
      if (inner === "NO2") { addAtom("NO2"); continue; }
      const m = /^(Cl|Br|C|O|N|S|F|I)(H\d*)?([+-]\d*)?$/.exec(inner);
      if (!m) throw new Error(`unbekannt: [${inner}]`);
      const q = m[3] ? (m[3][0] === "+" ? 1 : -1) * (Number(m[3].slice(1)) || 1) : 0;
      addAtom(m[1] as El, q);
      continue;
    }
    if (/\d/.test(c) || c === "%") {
      const k = c === "%" ? s.slice(i + 1, i + 3) : c;
      i += c === "%" ? 3 : 1;
      const open = rings.get(k);
      if (open) {
        // Ringschluss-Richtung: an der öffnenden Stelle vom öffnenden Atom aus, an der schließenden vom schließenden
        bond(open.atom, prev, (order || open.order || 1) as Order, dir ?? open.dir, dir ? prev : open.atom);
        rings.delete(k); order = 0; dir = undefined;
      } else { rings.set(k, { atom: prev, order, dir }); order = 0; dir = undefined; }
      continue;
    }
    const sym = SYMBOLS.find(x => s.startsWith(x, i));
    if (!sym) throw new Error(`unbekanntes Zeichen „${c}“ in ${s}`);
    addAtom(sym); i += sym.length;
  }
  if (rings.size) throw new Error(`offener Ring in ${s}`);
  const { mol: m, map } = nitro(mol, charge);
  if (!map) return { mol: m, dirs };
  // Nummern der Richtungszeichen an die neue Nummerierung anpassen
  const moved: Parsed["dirs"] = new Map();
  for (const d of dirs.values()) {
    const from = map.get(d.from), to = map.get(d.to);
    if (from !== undefined && to !== undefined) moved.set(key(from, to), { from, to, dir: d.dir });
  }
  return { mol: m, dirs: moved };
}

export function parseSmiles(s: string): Mol {
  return parseSmilesFull(s).mol;
}

/** [N+](=O)[O-] → Baustein NO₂ (die beiden O fallen weg, Nummern bleiben lückenlos; `map` = alte → neue Nummer) */
function nitro(mol: Mol, charge: Map<number, number>): { mol: Mol; map?: Map<number, number> } {
  const drop = new Set<number>();
  const change = new Map<number, El>();
  for (const a of mol.atoms) {
    if (a.el !== "N" || charge.get(a.id) !== 1) continue;
    const os = mol.bonds.filter(b => b.a === a.id || b.b === a.id).map(b => ({ o: b.a === a.id ? b.b : b.a, order: b.order }))
      .filter(x => mol.atoms[x.o].el === "O");
    if (os.length === 2 && os.some(x => x.order === 2) && os.some(x => x.order === 1 && charge.get(x.o) === -1)) {
      os.forEach(x => drop.add(x.o)); change.set(a.id, "NO2");
    }
  }
  if (!drop.size) return { mol };
  const map = new Map<number, number>();
  const atoms = mol.atoms.filter(a => !drop.has(a.id)).map((a, i) => { map.set(a.id, i); return { ...a, id: i, el: change.get(a.id) ?? a.el }; });
  const bonds = mol.bonds.filter(b => !drop.has(b.a) && !drop.has(b.b)).map(b => ({ ...b, a: map.get(b.a)!, b: map.get(b.b)! }));
  return { mol: { atoms, bonds }, map };
}

/** Molekül mit Lage der Atome; E/Z aus / und \ (wie in der Kurzschreibweise angegeben) */
export function smilesMol(s: string): Mol {
  const { mol: m0, dirs } = parseSmilesFull(s);
  let mol = layout(m0);
  if (!dirs.size) return mol;
  const g = graph(mol);
  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  for (const bd of mol.bonds) {
    if (bd.order !== 2) continue;
    // markierte Nachbarbindung an jedem Ende, Richtung von der Doppelbindung weg
    const mark = (c: number, other: number) => {
      for (const n of g.nb.get(c)!) {
        if (n.to === other) continue;
        const d = dirs.get(key(c, n.to));
        if (!d) continue;
        const out = d.from === c ? d.dir : d.dir === "/" ? "\\" : "/";
        return { atom: n.to, out };
      }
    };
    const ma = mark(bd.a, bd.b), mb = mark(bd.b, bd.a);
    if (!ma || !mb) continue;
    // von der Doppelbindung weg gelesen: gleiche Zeichen = verschiedene Seiten (trans) – siehe F/C=C/F
    mol = forceSide(mol, bd.a, bd.b, ma.atom, mb.atom, ma.out === mb.out);
  }
  return mol;
}

/** Nachbar p an a und q an b auf dieselbe (together) bzw. verschiedene Seiten bringen */
function forceSide(mol: Mol, a: number, b: number, p: number, q: number, together: boolean): Mol {
  const P = (id: number) => mol.atoms.find(x => x.id === id)!;
  const A = P(a), B = P(b), vx = B.x - A.x, vy = B.y - A.y;
  const side = (o: { x: number; y: number }, t: { x: number; y: number }) => Math.sign(vx * (t.y - o.y) - vy * (t.x - o.x));
  const same = side(A, P(p)) === side(B, P(q));
  if (same === together) return mol;
  return flipBond(mol, a, b) ?? mol;
}
