// Molekül als Graph: Atome (ohne H – Wasserstoff ergibt sich aus der Wertigkeit) und Bindungen 1/2/3.
// NO₂ ist ein Baustein mit einer Bindung (Nitrogruppe), damit Ladungen nicht gezeichnet werden müssen.

export type El = "C" | "O" | "N" | "S" | "F" | "Cl" | "Br" | "I" | "NO2";
export type Order = 1 | 2 | 3;

export interface Atom { id: number; el: El; x: number; y: number }
export interface Bond { a: number; b: number; order: Order }
export interface Mol { atoms: Atom[]; bonds: Bond[] }

export const ELEMENTS: El[] = ["C", "O", "N", "S", "F", "Cl", "Br", "I", "NO2"];
export const VALENCE: Record<El, number> = { C: 4, O: 2, N: 3, S: 2, F: 1, Cl: 1, Br: 1, I: 1, NO2: 1 };
export const HALOGENS: El[] = ["F", "Cl", "Br", "I"];
/** Anzeige des Elements (NO₂ tiefgestellt) */
export const elLabel = (e: El) => (e === "NO2" ? "NO₂" : e);

export const empty = (): Mol => ({ atoms: [], bonds: [] });

/** schneller Zugriff: Nachbarn je Atom */
export interface Graph {
  mol: Mol;
  ids: number[];
  el: Map<number, El>;
  nb: Map<number, { to: number; order: Order }[]>;
}

export function graph(mol: Mol): Graph {
  const el = new Map<number, El>(), nb = new Map<number, { to: number; order: Order }[]>();
  for (const a of mol.atoms) { el.set(a.id, a.el); nb.set(a.id, []); }
  for (const b of mol.bonds) {
    nb.get(b.a)?.push({ to: b.b, order: b.order });
    nb.get(b.b)?.push({ to: b.a, order: b.order });
  }
  return { mol, ids: mol.atoms.map(a => a.id), el, nb };
}

export const bondOrder = (g: Graph, a: number, b: number): number => g.nb.get(a)?.find(n => n.to === b)?.order ?? 0;
export const usedValence = (g: Graph, a: number) => (g.nb.get(a) ?? []).reduce((s, n) => s + n.order, 0);
export const hCount = (g: Graph, a: number) => Math.max(0, VALENCE[g.el.get(a)!] - usedValence(g, a));
export const degree = (g: Graph, a: number) => g.nb.get(a)!.length;

/** freie Bindungen eines Atoms im Molekül */
export function freeValence(mol: Mol, id: number): number {
  const a = mol.atoms.find(x => x.id === id);
  if (!a) return 0;
  const used = mol.bonds.reduce((s, b) => s + (b.a === id || b.b === id ? b.order : 0), 0);
  return VALENCE[a.el] - used;
}

export function findBond(mol: Mol, a: number, b: number): Bond | undefined {
  return mol.bonds.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
}

export const nextId = (mol: Mol) => mol.atoms.reduce((m, a) => Math.max(m, a.id), -1) + 1;

/** zusammenhängend? (ein Molekül) */
export function components(mol: Mol): number[][] {
  const g = graph(mol), seen = new Set<number>(), out: number[][] = [];
  for (const s of g.ids) {
    if (seen.has(s)) continue;
    const comp: number[] = [], stack = [s];
    seen.add(s);
    while (stack.length) {
      const v = stack.pop()!;
      comp.push(v);
      for (const n of g.nb.get(v)!) if (!seen.has(n.to)) { seen.add(n.to); stack.push(n.to); }
    }
    out.push(comp);
  }
  return out;
}

/** Summenformel nach Hill: C, H, dann alphabetisch (NO₂ zählt als N und 2 O) */
export function formula(mol: Mol): string {
  const g = graph(mol), count: Record<string, number> = {};
  const add = (e: string, n: number) => { count[e] = (count[e] ?? 0) + n; };
  for (const id of g.ids) {
    const e = g.el.get(id)!;
    if (e === "NO2") { add("N", 1); add("O", 2); } else add(e, 1);
    add("H", hCount(g, id));
  }
  const keys = Object.keys(count).filter(k => count[k] > 0);
  const order = count.C ? ["C", "H", ...keys.filter(k => k !== "C" && k !== "H").sort()] : keys.sort();
  return order.filter(k => count[k]).map(k => k + (count[k] > 1 ? count[k] : "")).join("");
}
