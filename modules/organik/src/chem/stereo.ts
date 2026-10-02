// E/Z-Isomerie an C=C-Doppelbindungen: Rangfolge der beiden Gruppen an jedem C nach den CIP-Regeln
// (Cahn, Ingold, Prelog: höhere Ordnungszahl zuerst; bei Gleichstand Sphäre für Sphäre weiter; Mehrfachbindungen als
// doppelte Atome; Ringschluss als Duplikat), dann aus der Zeichnung: liegen die beiden höherrangigen Gruppen auf derselben
// Seite der Doppelbindung → Z (zusammen), auf verschiedenen Seiten → E (entgegen).
// Ohne Unterschied zwischen den beiden Gruppen eines C (z. B. =CH₂, =C(CH₃)₂) gibt es kein E/Z. Im Ring erst ab acht Atomen
// (Cycloocten): kleinere Ringe sind immer Z, das wird nicht genannt.
// Liegt eine Gruppe genau auf der Achse der Doppelbindung (gerade gezeichnet), ist E/Z aus dem Bild nicht ablesbar.

import { graph, hCount, type El, type Graph, type Mol } from "./mol.ts";
import { findRings } from "./rings.ts";

const Z_NUM: Record<El, number> = { C: 6, N: 7, O: 8, F: 9, S: 16, Cl: 17, Br: 35, I: 53, NO2: 7 };

/** Knoten des CIP-Baums: Atom (oder Duplikat/Phantom), Weg von der Wurzel (für Ringe) */
interface Node { z: number; atom: number; from: number; path: Set<number>; leaf: boolean }

const leaf = (z: number): Node => ({ z, atom: -1, from: -1, path: new Set(), leaf: true });
const PHANTOM = leaf(0);

function kids(g: Graph, n: Node): Node[] {
  if (n.leaf) return [];
  const el = g.el.get(n.atom)!;
  // NO₂ (Baustein): N mit O, =O → drei O (zweites O der Doppelbindung als Duplikat)
  if (el === "NO2") return [leaf(8), leaf(8), leaf(8)];
  const out: Node[] = [];
  for (const nb of g.nb.get(n.atom)!) {
    const z = Z_NUM[g.el.get(nb.to)!];
    if (nb.to === n.from) {
      for (let k = 1; k < nb.order; k++) out.push(leaf(z));
      continue;
    }
    if (n.path.has(nb.to)) out.push(leaf(z)); // Ringschluss: Duplikat
    else out.push({ z, atom: nb.to, from: n.atom, path: new Set([...n.path, nb.to]), leaf: false });
    for (let k = 1; k < nb.order; k++) out.push(leaf(z));
  }
  for (let h = 0; h < hCount(g, n.atom); h++) out.push(leaf(1));
  return out;
}

/** Nachfolger geordnet (höchster Rang zuerst), auf drei aufgefüllt (fehlende = Phantom, Ordnungszahl 0) */
function ordered(g: Graph, n: Node, depth: number): Node[] {
  const k = kids(g, n).sort((a, b) => -compare(g, a, b, depth + 1));
  while (k.length < 3) k.push(PHANTOM);
  return k;
}

/** Vergleich zweier Zweige Sphäre für Sphäre: > 0, wenn a höheren Rang hat */
export function compare(g: Graph, a: Node, b: Node, depth = 0): number {
  let la = [a], lb = [b];
  for (let d = depth; d < 40; d++) {
    const len = Math.max(la.length, lb.length);
    for (let i = 0; i < len; i++) {
      const za = la[i]?.z ?? 0, zb = lb[i]?.z ?? 0;
      if (za !== zb) return za - zb;
    }
    const na = la.flatMap(x => ordered(g, x, d)), nb = lb.flatMap(x => ordered(g, x, d));
    if (na.every(x => x.z === 0) && nb.every(x => x.z === 0)) return 0;
    la = na; lb = nb;
  }
  return 0;
}

/** Zweig ab Nachbar `x` des Atoms `center` */
const branch = (g: Graph, center: number, x: number): Node => ({ z: Z_NUM[g.el.get(x)!], atom: x, from: center, path: new Set([center, x]), leaf: false });

export interface Stereo {
  /** die beiden C der Doppelbindung */
  a: number; b: number;
  /** höherrangige Gruppe an a bzw. b (Atom; −1 = H) */
  pa: number; pb: number;
  /** niedrigere Gruppe (Atom; −1 = H) */
  qa: number; qb: number;
  /** E, Z oder null (aus der Zeichnung nicht erkennbar) */
  desc: "E" | "Z" | null;
}

/** Gruppen an einem C der Doppelbindung nach Rang: [höher, niedriger] oder undefined (gleich → kein E/Z) */
function ranked(g: Graph, c: number, partner: number): [number, number] | undefined {
  const subs = g.nb.get(c)!.filter(n => n.to !== partner).map(n => n.to);
  const h = hCount(g, c);
  if (subs.length + h !== 2 || subs.length === 0) return;
  if (subs.length === 1) return [subs[0], -1];
  const r = compare(g, branch(g, c, subs[0]), branch(g, c, subs[1]));
  if (r === 0) return;
  return r > 0 ? [subs[0], subs[1]] : [subs[1], subs[0]];
}

/** alle C=C-Doppelbindungen mit E/Z-Isomerie (nicht kumuliert; im Ring erst ab 8 Atomen – kleinere Ringe gibt es nur als Z) */
export function stereoBonds(mol: Mol, g: Graph = graph(mol)): Stereo[] {
  const ringOf = findRings(g).ringOf;
  const pos = new Map(mol.atoms.map(a => [a.id, a]));
  const out: Stereo[] = [];
  for (const bd of mol.bonds) {
    if (bd.order !== 2 || g.el.get(bd.a) !== "C" || g.el.get(bd.b) !== "C") continue;
    const ra = ringOf.get(bd.a), rb = ringOf.get(bd.b);
    if (ra && ra === rb && ra.atoms.length < 8) continue;
    const cumulated = (c: number) => g.nb.get(c)!.filter(n => n.order >= 2).length > 1;
    if (cumulated(bd.a) || cumulated(bd.b)) continue;
    const A = ranked(g, bd.a, bd.b), B = ranked(g, bd.b, bd.a);
    if (!A || !B) continue;
    out.push({ a: bd.a, b: bd.b, pa: A[0], qa: A[1], pb: B[0], qb: B[1], desc: geometry(pos, bd.a, bd.b, A, B) });
  }
  return out;
}

/** Seite der höherrangigen Gruppen aus den Koordinaten */
function geometry(pos: Map<number, { x: number; y: number }>, a: number, b: number, A: [number, number], B: [number, number]): "E" | "Z" | null {
  const pa = pos.get(a)!, pb = pos.get(b)!;
  const vx = pb.x - pa.x, vy = pb.y - pa.y, len = Math.hypot(vx, vy) || 1;
  const side = (at: { x: number; y: number }, p: number) => {
    const q = pos.get(p);
    if (!q) return 0;
    const dx = q.x - at.x, dy = q.y - at.y, d = Math.hypot(dx, dy) || 1;
    const s = (vx * dy - vy * dx) / (len * d);
    return Math.abs(s) < 0.08 ? 0 : Math.sign(s);
  };
  // höherrangige Gruppe; liegt sie auf der Achse, die Gegenseite der niedrigeren (falls gezeichnet).
  // Liegen beide Gruppen eines C auf derselben Seite, ist die Zeichnung nicht eindeutig.
  const sideOf = (at: { x: number; y: number }, [hi, lo]: [number, number]) => {
    const h = side(at, hi), l = lo >= 0 ? side(at, lo) : 0;
    if (h && l && h === l) return 0;
    return h || -l;
  };
  const sa = sideOf(pa, A), sb = sideOf(pb, B);
  if (!sa || !sb) return null;
  return sa === sb ? "Z" : "E";
}

/** Spiegeln an der Achse einer Doppelbindung: alles auf der Seite von b wird gespiegelt (E ↔ Z) – null im Ring */
export function flipBond(mol: Mol, a: number, b: number): Mol | null {
  const g = graph(mol);
  const side = new Set([b]), stack = [b];
  while (stack.length) {
    const v = stack.pop()!;
    for (const n of g.nb.get(v)!) {
      if (v === b && n.to === a) continue;
      if (n.to === a) return null;
      if (!side.has(n.to)) { side.add(n.to); stack.push(n.to); }
    }
  }
  const pa = mol.atoms.find(x => x.id === a)!, pb = mol.atoms.find(x => x.id === b)!;
  const vx = pb.x - pa.x, vy = pb.y - pa.y, l2 = vx * vx + vy * vy || 1;
  const r = (v: number) => Math.round(v * 1000) / 1000;
  return {
    atoms: mol.atoms.map(at => {
      if (!side.has(at.id) || at.id === b) return at;
      const dx = at.x - pa.x, dy = at.y - pa.y, t = (dx * vx + dy * vy) / l2;
      const fx = pa.x + t * vx, fy = pa.y + t * vy;
      return { ...at, x: r(2 * fx - at.x), y: r(2 * fy - at.y) };
    }),
    bonds: mol.bonds,
  };
}

/** E/Z einer Doppelbindung erzwingen (nach dem Neuzeichnen) */
export function setStereo(mol: Mol, a: number, b: number, want: "E" | "Z"): Mol {
  const s = stereoBonds(mol).find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  if (!s || !s.desc || s.desc === want) return mol;
  return flipBond(mol, a, b) ?? mol;
}

/** E/Z aller Doppelbindungen aus `from` auf `to` übertragen (gleiche Atome, neue Lage) */
export function keepStereo(from: Mol, to: Mol): Mol {
  let m = to;
  for (const s of stereoBonds(from)) if (s.desc) m = setStereo(m, s.a, s.b, s.desc);
  return m;
}
