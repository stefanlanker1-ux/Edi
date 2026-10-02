// Moleküle für die Prüfung der Benennung (fester Startwert, jedes Mal dieselben): alle Alkane bis C10, Mehrfachbindungen an jeder
// Stelle, jede funktionelle Gruppe an jeder Stelle kleiner Gerüste, Kombinationen mehrerer Gruppen, Ringe und Heterocyclen mit
// Substituenten, Ring + Kette, Ester/Amide/Amine/Ether, E/Z-Fälle, Trivialnamen und frei gewachsene Zufallsmoleküle.
// E/Z: jede Doppelbindung mit E/Z wird zufällig gespiegelt (beide Isomere kommen vor).

import { freeValence, type El, type Mol, type Order } from "../mol.ts";
import { layout } from "../layout.ts";
import { flipBond, stereoBonds } from "../stereo.ts";
import { smilesMol } from "../smiles.ts";

export interface Sample { id: string; family: string; mol: Mol }

/** Zufallszahlen mit festem Startwert (mulberry32) */
export function rng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
type Rnd = () => number;
const pick = <T,>(r: Rnd, xs: T[]): T => xs[Math.floor(r() * xs.length)];

/** Molekül Schritt für Schritt aufbauen (Atome ohne Lage) */
export class Builder {
  mol: Mol = { atoms: [], bonds: [] };
  add(el: El, to?: number, order: Order = 1): number {
    const id = this.mol.atoms.length;
    this.mol.atoms.push({ id, el, x: 0, y: 0 });
    if (to !== undefined) this.mol.bonds.push({ a: to, b: id, order });
    return id;
  }
  bond(a: number, b: number, order: Order = 1) { this.mol.bonds.push({ a, b, order }); }
  free(id: number) { return freeValence(this.mol, id); }
  clone(): Builder { const b = new Builder(); b.mol = { atoms: this.mol.atoms.map(a => ({ ...a })), bonds: this.mol.bonds.map(x => ({ ...x })) }; return b; }
}

// ── Kohlenstoffgerüste ──────────────────────────────────────────────────────

/** Baum in kanonischer Form (über das Zentrum) – gleiche Gerüste ergeben denselben Text */
function canonTree(adj: number[][]): string {
  const n = adj.length;
  if (n <= 2) return String(n);
  const deg = adj.map(a => a.length), gone = new Array(n).fill(false);
  let leaves = deg.map((d, i) => (d === 1 ? i : -1)).filter(i => i >= 0), left = n;
  while (left > 2) {
    const next: number[] = [];
    for (const l of leaves) { gone[l] = true; left--; for (const u of adj[l]) if (!gone[u] && --deg[u] === 1) next.push(u); }
    leaves = next;
  }
  const centers = adj.map((_, i) => i).filter(i => !gone[i]);
  const enc = (v: number, p: number): string => `(${adj[v].filter(u => u !== p).map(u => enc(u, v)).sort().join("")})`;
  return centers.length === 1 ? enc(centers[0], -1) : [enc(centers[0], centers[1]), enc(centers[1], centers[0])].sort().join("|");
}

/** alle Alkan-Gerüste mit 1 … maxN C (Bäume mit höchstens 4 Nachbarn), je Isomer eines */
export function alkaneTrees(maxN: number): number[][][] {
  const out: number[][][] = [[[]]];
  let level: number[][][] = [[[]]];
  for (let n = 2; n <= maxN; n++) {
    const seen = new Map<string, number[][]>();
    for (const t of level) for (let v = 0; v < t.length; v++) {
      if (t[v].length >= 4) continue;
      const adj = t.map(a => [...a]);
      adj.push([v]); adj[v].push(n - 1);
      const k = canonTree(adj);
      if (!seen.has(k)) seen.set(k, adj);
    }
    level = [...seen.values()];
    out.push(...level);
  }
  return out;
}

/** Gerüst als Molekül: Atome 0 … n−1 */
function treeMol(adj: number[][]): Builder {
  const b = new Builder();
  adj.forEach(() => b.add("C"));
  adj.forEach((ns, v) => ns.forEach(u => { if (u > v) b.bond(v, u); }));
  return b;
}

// ── Gruppen ─────────────────────────────────────────────────────────────────

/** Gruppe an Kohlenstoff c anhängen; `need` = freie Bindungen, die c braucht */
interface GroupDef { need: number; add: (b: Builder, c: number) => void }
const chainOf = (b: Builder, from: number, n: number) => { let p = from; for (let i = 0; i < n; i++) p = b.add("C", p); return p; };
function ring(b: Builder, at: number | undefined, els: El[], orders: Order[], via = 0): number[] {
  const ids = els.map((e, i) => (i === via && at !== undefined ? b.add(e, at) : b.add(e)));
  ids.forEach((id, i) => b.bond(id, ids[(i + 1) % ids.length], orders[i] ?? 1));
  return ids;
}
const BENZ: Order[] = [2, 1, 2, 1, 2, 1];

export const GROUPS: Record<string, GroupDef> = {
  OH: { need: 1, add: (b, c) => { b.add("O", c); } },
  SH: { need: 1, add: (b, c) => { b.add("S", c); } },
  NH2: { need: 1, add: (b, c) => { b.add("N", c); } },
  F: { need: 1, add: (b, c) => { b.add("F", c); } },
  Cl: { need: 1, add: (b, c) => { b.add("Cl", c); } },
  Br: { need: 1, add: (b, c) => { b.add("Br", c); } },
  I: { need: 1, add: (b, c) => { b.add("I", c); } },
  NO2: { need: 1, add: (b, c) => { b.add("NO2", c); } },
  OMe: { need: 1, add: (b, c) => { b.add("C", b.add("O", c)); } },
  OEt: { need: 1, add: (b, c) => { chainOf(b, b.add("O", c), 2); } },
  OiPr: { need: 1, add: (b, c) => { const k = b.add("C", b.add("O", c)); b.add("C", k); b.add("C", k); } },
  OPh: { need: 1, add: (b, c) => { ring(b, b.add("O", c), ["C", "C", "C", "C", "C", "C"], BENZ); } },
  SMe: { need: 1, add: (b, c) => { b.add("C", b.add("S", c)); } },
  SEt: { need: 1, add: (b, c) => { chainOf(b, b.add("S", c), 2); } },
  NHMe: { need: 1, add: (b, c) => { b.add("C", b.add("N", c)); } },
  NHEt: { need: 1, add: (b, c) => { chainOf(b, b.add("N", c), 2); } },
  NMe2: { need: 1, add: (b, c) => { const n = b.add("N", c); b.add("C", n); b.add("C", n); } },
  NEtMe: { need: 1, add: (b, c) => { const n = b.add("N", c); b.add("C", n); chainOf(b, n, 2); } },
  NHAc: { need: 1, add: (b, c) => { const k = b.add("C", b.add("N", c)); b.add("O", k, 2); b.add("C", k); } },
  oxo: { need: 2, add: (b, c) => { b.add("O", c, 2); } },
  methyliden: { need: 2, add: (b, c) => { b.add("C", c, 2); } },
  ethyliden: { need: 2, add: (b, c) => { b.add("C", b.add("C", c, 2)); } },
  COOH: { need: 1, add: (b, c) => { const k = b.add("C", c); b.add("O", k, 2); b.add("O", k); } },
  CHO: { need: 1, add: (b, c) => { b.add("O", b.add("C", c), 2); } },
  CN: { need: 1, add: (b, c) => { b.add("N", b.add("C", c), 3); } },
  CONH2: { need: 1, add: (b, c) => { const k = b.add("C", c); b.add("O", k, 2); b.add("N", k); } },
  CONHMe: { need: 1, add: (b, c) => { const k = b.add("C", c); b.add("O", k, 2); b.add("C", b.add("N", k)); } },
  CONMe2: { need: 1, add: (b, c) => { const k = b.add("C", c); b.add("O", k, 2); const n = b.add("N", k); b.add("C", n); b.add("C", n); } },
  COOMe: { need: 1, add: (b, c) => { const k = b.add("C", c); b.add("O", k, 2); b.add("C", b.add("O", k)); } },
  COOEt: { need: 1, add: (b, c) => { const k = b.add("C", c); b.add("O", k, 2); chainOf(b, b.add("O", k), 2); } },
  COOiPr: { need: 1, add: (b, c) => { const k = b.add("C", c); b.add("O", k, 2); const m = b.add("C", b.add("O", k)); b.add("C", m); b.add("C", m); } },
  OAc: { need: 1, add: (b, c) => { const k = b.add("C", b.add("O", c)); b.add("O", k, 2); b.add("C", k); } },
  OCHO: { need: 1, add: (b, c) => { b.add("O", b.add("C", b.add("O", c)), 2); } },
  Ac: { need: 1, add: (b, c) => { const k = b.add("C", c); b.add("O", k, 2); b.add("C", k); } },
  vinyl: { need: 1, add: (b, c) => { b.add("C", b.add("C", c), 2); } },
  ethinyl: { need: 1, add: (b, c) => { b.add("C", b.add("C", c), 3); } },
  allyl: { need: 1, add: (b, c) => { b.add("C", b.add("C", b.add("C", c)), 2); } },
  propenyl: { need: 1, add: (b, c) => { b.add("C", b.add("C", b.add("C", c), 2)); } },
  isopropenyl: { need: 1, add: (b, c) => { const k = b.add("C", c); b.add("C", k, 2); b.add("C", k); } },
  Me: { need: 1, add: (b, c) => { b.add("C", c); } },
  Et: { need: 1, add: (b, c) => { chainOf(b, c, 2); } },
  iPr: { need: 1, add: (b, c) => { const k = b.add("C", c); b.add("C", k); b.add("C", k); } },
  tBu: { need: 1, add: (b, c) => { const k = b.add("C", c); b.add("C", k); b.add("C", k); b.add("C", k); } },
  CH2OH: { need: 1, add: (b, c) => { b.add("O", b.add("C", c)); } },
  CH2Cl: { need: 1, add: (b, c) => { b.add("Cl", b.add("C", c)); } },
  CF3: { need: 1, add: (b, c) => { const k = b.add("C", c); b.add("F", k); b.add("F", k); b.add("F", k); } },
  Ph: { need: 1, add: (b, c) => { ring(b, c, ["C", "C", "C", "C", "C", "C"], BENZ); } },
  Bn: { need: 1, add: (b, c) => { ring(b, b.add("C", c), ["C", "C", "C", "C", "C", "C"], BENZ); } },
  cHex: { need: 1, add: (b, c) => { ring(b, c, ["C", "C", "C", "C", "C", "C"], []); } },
  cProp: { need: 1, add: (b, c) => { ring(b, c, ["C", "C", "C"], []); } },
  cPent: { need: 1, add: (b, c) => { ring(b, c, ["C", "C", "C", "C", "C"], []); } },
  "pyridin-2-yl": { need: 1, add: (b, c) => { ring(b, c, ["C", "N", "C", "C", "C", "C"], BENZ); } },
  "pyridin-3-yl": { need: 1, add: (b, c) => { ring(b, c, ["C", "C", "N", "C", "C", "C"], BENZ); } },
  "pyridin-4-yl": { need: 1, add: (b, c) => { ring(b, c, ["C", "C", "C", "N", "C", "C"], BENZ); } },
  "furan-2-yl": { need: 1, add: (b, c) => { ring(b, c, ["C", "O", "C", "C", "C"], [1, 1, 2, 1, 2]); } },
  "thiophen-3-yl": { need: 1, add: (b, c) => { ring(b, c, ["C", "C", "S", "C", "C"], [2, 1, 1, 2, 1]); } },
  "oxolan-2-yl": { need: 1, add: (b, c) => { ring(b, c, ["C", "O", "C", "C", "C"], []); } },
  "piperidin-1-yl": { need: 1, add: (b, c) => { ring(b, c, ["N", "C", "C", "C", "C", "C"], []); } },
  "pyrrolidin-2-yl": { need: 1, add: (b, c) => { ring(b, c, ["C", "N", "C", "C", "C"], []); } },
  "oxan-4-yl": { need: 1, add: (b, c) => { ring(b, c, ["C", "C", "C", "O", "C", "C"], []); } },
};
const GROUP_NAMES = Object.keys(GROUPS);
const FUNCTIONAL = ["OH", "SH", "NH2", "Cl", "Br", "F", "I", "NO2", "OMe", "OEt", "NHMe", "NMe2", "oxo", "COOH", "CHO", "CN", "CONH2", "CONHMe",
  "COOMe", "COOEt", "OAc", "Ac", "vinyl", "ethinyl", "Me", "Et", "iPr", "Ph", "cHex", "CH2OH", "SMe", "NHAc", "allyl", "propenyl", "methyliden"];

/** Gruppe an c anhängen, wenn genug freie Bindungen da sind */
function attach(b: Builder, c: number, g: string): boolean {
  const def = GROUPS[g];
  if (b.free(c) < def.need) return false;
  def.add(b, c);
  return true;
}

// ── Ringe als Grundgerüst ───────────────────────────────────────────────────

interface RingDef { els: El[]; orders: Order[] }
export const RINGS: Record<string, RingDef> = {
  cyclopropan: { els: ["C", "C", "C"], orders: [] },
  cyclobutan: { els: ["C", "C", "C", "C"], orders: [] },
  cyclopentan: { els: ["C", "C", "C", "C", "C"], orders: [] },
  cyclohexan: { els: ["C", "C", "C", "C", "C", "C"], orders: [] },
  cycloheptan: { els: ["C", "C", "C", "C", "C", "C", "C"], orders: [] },
  cyclooctan: { els: ["C", "C", "C", "C", "C", "C", "C", "C"], orders: [] },
  cyclopenten: { els: ["C", "C", "C", "C", "C"], orders: [2] },
  cyclohexen: { els: ["C", "C", "C", "C", "C", "C"], orders: [2] },
  "cyclohexa-1,3-dien": { els: ["C", "C", "C", "C", "C", "C"], orders: [2, 1, 2] },
  "cyclohexa-1,4-dien": { els: ["C", "C", "C", "C", "C", "C"], orders: [2, 1, 1, 2] },
  cycloocten: { els: ["C", "C", "C", "C", "C", "C", "C", "C"], orders: [2] },
  benzen: { els: ["C", "C", "C", "C", "C", "C"], orders: BENZ },
  oxiran: { els: ["O", "C", "C"], orders: [] },
  aziridin: { els: ["N", "C", "C"], orders: [] },
  thiiran: { els: ["S", "C", "C"], orders: [] },
  oxetan: { els: ["O", "C", "C", "C"], orders: [] },
  azetidin: { els: ["N", "C", "C", "C"], orders: [] },
  thietan: { els: ["S", "C", "C", "C"], orders: [] },
  oxolan: { els: ["O", "C", "C", "C", "C"], orders: [] },
  pyrrolidin: { els: ["N", "C", "C", "C", "C"], orders: [] },
  thiolan: { els: ["S", "C", "C", "C", "C"], orders: [] },
  oxan: { els: ["O", "C", "C", "C", "C", "C"], orders: [] },
  piperidin: { els: ["N", "C", "C", "C", "C", "C"], orders: [] },
  thian: { els: ["S", "C", "C", "C", "C", "C"], orders: [] },
  furan: { els: ["O", "C", "C", "C", "C"], orders: [1, 2, 1, 2, 1] },
  pyrrol: { els: ["N", "C", "C", "C", "C"], orders: [1, 2, 1, 2, 1] },
  thiophen: { els: ["S", "C", "C", "C", "C"], orders: [1, 2, 1, 2, 1] },
  pyridin: { els: ["N", "C", "C", "C", "C", "C"], orders: BENZ },
};

// ── Fertigstellen ───────────────────────────────────────────────────────────

/** Lage berechnen, dann jede Doppelbindung mit E/Z zufällig spiegeln */
export function finish(mol: Mol, r: Rnd): Mol {
  let m = layout(mol);
  for (const s of stereoBonds(m)) if (r() < 0.5) m = flipBond(m, s.a, s.b) ?? m;
  return m;
}

const valid = (m: Mol) => m.atoms.every(a => freeValence(m, a.id) >= 0);

// ── Familien ────────────────────────────────────────────────────────────────

export function* samples(seed = 1): Generator<Sample> {
  const r = rng(seed);
  const trees = alkaneTrees(10);
  const small = trees.filter(t => t.length <= 6), mid = trees.filter(t => t.length >= 3 && t.length <= 8);
  let k = 0;
  const S = (family: string, mol: Mol): Sample => ({ id: `${family}-${k++}`, family, mol: finish(mol, r) });

  // alle Alkane bis C10
  for (const t of trees) yield S("alkan", treeMol(t).mol);

  // eine Doppel- oder Dreifachbindung an jeder Stelle (Gerüste bis C7), zwei an zufälligen Stellen
  for (const t of trees.filter(x => x.length >= 2 && x.length <= 7)) {
    const base = treeMol(t);
    for (let i = 0; i < base.mol.bonds.length; i++) for (const o of [2, 3] as Order[]) {
      const b = base.clone();
      b.mol.bonds[i].order = o;
      if (valid(b.mol)) yield S("mehrfach", b.mol);
    }
  }
  for (let i = 0; i < 400; i++) {
    const b = treeMol(pick(r, mid));
    for (let j = 0; j < 1 + Math.floor(r() * 3); j++) {
      const bd = pick(r, b.mol.bonds);
      const o = (r() < 0.75 ? 2 : 3) as Order;
      const old = bd.order;
      bd.order = o;
      if (!valid(b.mol)) bd.order = old;
    }
    if (b.mol.bonds.some(x => x.order > 1)) yield S("mehrfach", b.mol);
  }

  // jede Gruppe an jeder Stelle kleiner Gerüste (bis C6)
  for (const t of small) for (let c = 0; c < t.length; c++) for (const g of GROUP_NAMES) {
    const b = treeMol(t);
    if (attach(b, c, g)) yield S(`gruppe-${g}`, b.mol);
  }

  // mehrere Gruppen auf Gerüsten C3–C8, teils mit Mehrfachbindung
  for (let i = 0; i < 3000; i++) {
    const t = pick(r, mid), b = treeMol(t);
    const n = 2 + Math.floor(r() * 3);
    for (let j = 0; j < n; j++) attach(b, Math.floor(r() * t.length), pick(r, FUNCTIONAL));
    if (r() < 0.35) {
      const cc = b.mol.bonds.filter(x => x.a < t.length && x.b < t.length);
      if (cc.length) { const bd = pick(r, cc); bd.order = 2; if (!valid(b.mol)) bd.order = 1; }
    }
    yield S("mehrere", b.mol);
  }

  // größere verzweigte Gerüste (C9–C14) mit Mehrfachbindungen und Gruppen: viele gleich lange Ketten zur Wahl
  for (let i = 0; i < 2000; i++) {
    const b = new Builder();
    b.add("C");
    const size = 9 + Math.floor(r() * 6);
    while (b.mol.atoms.length < size) {
      const free = b.mol.atoms.filter(a => b.mol.bonds.filter(x => x.a === a.id || x.b === a.id).length < 4);
      b.add("C", pick(r, free).id);
    }
    for (let j = Math.floor(r() * 3); j > 0; j--) {
      const bd = pick(r, b.mol.bonds), old = bd.order;
      bd.order = (r() < 0.75 ? 2 : 3) as Order;
      if (!valid(b.mol)) bd.order = old;
    }
    for (let j = Math.floor(r() * 4); j > 0; j--) attach(b, Math.floor(r() * size), pick(r, FUNCTIONAL));
    yield S("verzweigt", b.mol);
  }

  // Ringe: 0–3 Substituenten am Ring, Ring an Kette, zwei Ringe
  const ringNames = Object.keys(RINGS);
  for (const rn of ringNames) {
    const b = new Builder();
    ring(b, undefined, RINGS[rn].els, RINGS[rn].orders);
    yield S("ring", b.mol);
  }
  for (let i = 0; i < 2500; i++) {
    const rn = pick(r, ringNames), def = RINGS[rn];
    const b = new Builder();
    const ids = ring(b, undefined, def.els, def.orders);
    const n = 1 + Math.floor(r() * 3);
    for (let j = 0; j < n; j++) {
      const at = pick(r, ids);
      if (b.mol.atoms[at].el !== "C") { if (b.mol.atoms[at].el === "N" && b.free(at) > 0) attach(b, at, pick(r, ["Me", "Et", "Ac", "Ph"])); continue; }
      attach(b, at, pick(r, FUNCTIONAL));
    }
    yield S("ring-sub", b.mol);
  }
  for (let i = 0; i < 1200; i++) {
    const t = pick(r, mid), b = treeMol(t);
    const rn = pick(r, ringNames), def = RINGS[rn];
    const c = Math.floor(r() * t.length);
    if (b.free(c) < 1) continue;
    const via = def.els.findIndex(e => e === "C");
    ring(b, c, def.els, def.orders, via);
    if (r() < 0.7) attach(b, Math.floor(r() * b.mol.atoms.length), pick(r, FUNCTIONAL));
    if (r() < 0.3) attach(b, Math.floor(r() * t.length), pick(r, FUNCTIONAL));
    yield S("ring-kette", b.mol);
  }
  for (let i = 0; i < 300; i++) {
    const b = new Builder();
    const d1 = RINGS[pick(r, ringNames)], d2 = RINGS[pick(r, ringNames)];
    const a = ring(b, undefined, d1.els, d1.orders);
    const ca = a.find(x => b.mol.atoms[x].el === "C" && b.free(x) > 0);
    if (ca === undefined) continue;
    const link = pick(r, ["", "C", "O", "CC", "C=O", "N"]);
    let from = ca;
    if (link === "C=O") { from = b.add("C", ca); b.add("O", from, 2); }
    else for (const e of link) from = b.add(e as El, from);
    ring(b, from, d2.els, d2.orders, d2.els.findIndex(e => e === "C"));
    if (r() < 0.5) attach(b, Math.floor(r() * b.mol.atoms.length), pick(r, FUNCTIONAL));
    if (valid(b.mol)) yield S("zwei-ringe", b.mol);
  }

  // Ester, Amide, Amine, Ether, Thioether aus zwei Gerüsten
  const tiny = trees.filter(t => t.length <= 5);
  const join = (left: number[][], right: number[][], mid: (b: Builder, c: number) => number): Builder => {
    const b = treeMol(left);
    const c = Math.floor(r() * left.length);
    const x = mid(b, c);
    const off = b.mol.atoms.length;
    right.forEach(() => b.add("C"));
    right.forEach((ns, v) => ns.forEach(u => { if (u > v) b.bond(off + v, off + u); }));
    b.bond(x, off + Math.floor(r() * right.length));
    return b;
  };
  for (let i = 0; i < 1500; i++) {
    const kind = pick(r, ["ester", "ester", "amid", "amin", "amin2", "ether", "thioether", "diester", "esterF"]);
    let b: Builder;
    if (kind === "ester") b = join(pick(r, tiny), pick(r, tiny), (bb, c) => { const k = bb.add("C", c); bb.add("O", k, 2); return bb.add("O", k); });
    else if (kind === "esterF") { b = new Builder(); const k = b.add("C"); b.add("O", k, 2); const o = b.add("O", k); const t = pick(r, tiny); const off = b.mol.atoms.length; t.forEach(() => b.add("C")); t.forEach((ns, v) => ns.forEach(u => { if (u > v) b.bond(off + v, off + u); })); b.bond(o, off + Math.floor(r() * t.length)); }
    else if (kind === "amid") { b = join(pick(r, tiny), pick(r, tiny), (bb, c) => { const k = bb.add("C", c); bb.add("O", k, 2); return bb.add("N", k); }); if (r() < 0.4) b.add("C", b.mol.atoms.find(a => a.el === "N")!.id); }
    else if (kind === "amin") b = join(pick(r, tiny), pick(r, tiny), (bb, c) => bb.add("N", c));
    else if (kind === "amin2") { b = join(pick(r, tiny), pick(r, tiny), (bb, c) => bb.add("N", c)); attach(b, b.mol.atoms.find(a => a.el === "N")!.id, pick(r, ["Me", "Et", "iPr"])); }
    else if (kind === "ether") b = join(pick(r, tiny), pick(r, tiny), (bb, c) => bb.add("O", c));
    else if (kind === "thioether") b = join(pick(r, tiny), pick(r, tiny), (bb, c) => bb.add("S", c));
    else {
      b = treeMol(pick(r, mid));
      const cs = b.mol.atoms.map(a => a.id);
      attach(b, pick(r, cs), pick(r, ["COOMe", "COOEt", "COOiPr"]));
      attach(b, pick(r, cs), pick(r, ["COOMe", "COOEt", "COOH", "OAc"]));
    }
    if (r() < 0.3) attach(b, Math.floor(r() * b.mol.atoms.length), pick(r, FUNCTIONAL));
    if (valid(b.mol)) yield S(kind.replace(/\d$/, ""), b.mol);
  }

  // E/Z: besondere Fälle (Vorrang erst in tieferen Sphären, Heteroatome, Ringe, mehrere Doppelbindungen)
  for (const s of EZ_SMILES) yield { id: `ez-${k++}`, family: "ez", mol: smilesMol(s) };
  for (let i = 0; i < 600; i++) {
    const b = treeMol(pick(r, mid));
    const cc = b.mol.bonds.filter(x => b.free(x.a) > 0 && b.free(x.b) > 0);
    if (!cc.length) continue;
    pick(r, cc).order = 2;
    for (let j = 0; j < 1 + Math.floor(r() * 2); j++) attach(b, Math.floor(r() * b.mol.atoms.length), pick(r, ["Cl", "Br", "OH", "CH2OH", "Me", "Et", "iPr", "COOH", "CHO", "F", "OMe", "NH2", "Ph", "CN", "vinyl"]));
    if (valid(b.mol)) yield S("ez-zufall", b.mol);
  }

  // Trivialnamen
  for (const s of Object.values(TRIVIAL_SMILES)) yield { id: `trivial-${k++}`, family: "trivial", mol: smilesMol(s) };

  // frei gewachsen wie beim Zeichnen
  for (let i = 0; i < 2500; i++) {
    const els: El[] = ["C", "C", "C", "C", "C", "C", "C", "O", "N", "Cl", "S", "NO2", "Br", "F"];
    const b = new Builder();
    b.add("C");
    const size = 3 + Math.floor(r() * 16);
    for (let j = 1; j < size; j++) {
      const free = b.mol.atoms.filter(a => b.free(a.id) > 0);
      if (!free.length) break;
      const a = pick(r, free);
      const id = b.add(pick(r, els), a.id);
      if (b.free(id) < 0) { b.mol.atoms.pop(); b.mol.bonds.pop(); continue; }
      if (r() < 0.1) {
        const opts = b.mol.atoms.filter(x => x.id !== id && b.free(x.id) > 0 && b.free(id) > 0 && !b.mol.bonds.some(y => (y.a === x.id && y.b === id) || (y.b === x.id && y.a === id)));
        if (opts.length) b.bond(id, pick(r, opts).id);
      }
      if (r() < 0.12) {
        const bd = pick(r, b.mol.bonds);
        if (b.free(bd.a) > 0 && b.free(bd.b) > 0) bd.order = (bd.order + 1) as Order;
      }
    }
    if (valid(b.mol)) yield S("zufall", b.mol);
  }
}

/** E/Z-Sonderfälle: Vorrang durch Nachbarn, Duplikate bei Mehrfachbindungen, Heteroatome, Ringsubstituenten, Diene */
export const EZ_SMILES = [
  "C/C=C/C", "C/C=C\\C", "Cl/C=C/Cl", "Cl/C=C\\Cl", "F/C(Cl)=C(Br)/I", "F/C(Cl)=C(Br)\\I", "OC/C(C(C)C)=C\\C", "OC/C(C(C)C)=C/C",
  "C/C(CO)=C(/C)C(C)C", "CC/C(C)=C/C", "CC/C(C)=C\\C", "C=C/C(C)=C/C", "C#C/C(C)=C/C", "C#C/C(C=C)=C/C", "OC(=O)/C(C)=C/C",
  "O=C/C(C)=C/C", "N#C/C=C/C", "C/C=C/C1=CC=CC=C1", "C/C(C1CCCCC1)=C/C", "C/C(C1=CC=CC=C1)=C/C", "ClC/C=C/CBr", "OC/C=C/CS",
  "C/C=C/C=C/C", "C/C=C\\C=C/C", "C/C=C\\C=C\\C", "C/C=C/C=C\\C", "CC(C)/C=C/C(C)C", "BrC/C(Cl)=C(/C)CO", "C/C=C/CC/C=C/C",
  "C/C=C/C(=O)OC", "C/C=C/C(=O)OC/C=C/C", "CN/C=C/C", "CO/C=C/C", "[NO2]/C=C/C", "OC(=O)/C=C/C(=O)OC",
  "C1CC/C=C\\CCC1", "C1CCC/C=C\\CCC1", "CC1=CC=C(C=C1)/C=C/C(=O)O", "C/C(=C\\Cl)/C(=O)O",
];

/** Moleküle zu den Trivialnamen (Schlüssel = systematischer Name der App) */
export const TRIVIAL_SMILES: Record<string, string> = {
  Methan: "C", Ethen: "C=C", Ethin: "C#C", Propen: "C=CC", Methanol: "CO", Ethanol: "CCO", "Propan-2-ol": "CC(O)C", "Ethan-1,2-diol": "OCCO",
  "Propan-1,2,3-triol": "OCC(O)CO", Methanal: "C=O", Ethanal: "CC=O", "Propan-2-on": "CC(C)=O", "Butan-2-on": "CCC(C)=O", Methansäure: "OC=O",
  Ethansäure: "CC(=O)O", Propansäure: "CCC(=O)O", Butansäure: "CCCC(=O)O", Hexadecansäure: "CCCCCCCCCCCCCCCC(=O)O",
  Octadecansäure: "CCCCCCCCCCCCCCCCCC(=O)O", Ethandisäure: "OC(=O)C(=O)O", Propandisäure: "OC(=O)CC(=O)O", Butandisäure: "OC(=O)CCC(=O)O",
  "2-Hydroxypropansäure": "CC(O)C(=O)O", "2-Hydroxybutandisäure": "OC(=O)CC(O)C(=O)O", "2,3-Dihydroxybutandisäure": "OC(=O)C(O)C(O)C(=O)O",
  "2-Hydroxypropan-1,2,3-tricarbonsäure": "OC(=O)CC(O)(CC(=O)O)C(=O)O", "Prop-2-ensäure": "C=CC(=O)O", "2-Oxopropansäure": "CC(=O)C(=O)O",
  "(Z)-But-2-endisäure": "OC(=O)/C=C\\C(=O)O", "(E)-But-2-endisäure": "OC(=O)/C=C/C(=O)O", "(E)-But-2-ensäure": "C/C=C/C(=O)O",
  "(Z)-But-2-ensäure": "C/C=C\\C(=O)O", "(Z)-Octadec-9-ensäure": "CCCCCCCC/C=C\\CCCCCCCC(=O)O", "(E)-Octadec-9-ensäure": "CCCCCCCC/C=C/CCCCCCCC(=O)O",
  "(E)-3-Phenylprop-2-ensäure": "OC(=O)/C=C/C1=CC=CC=C1", "(2E,4E)-Hexa-2,4-diensäure": "C/C=C/C=C/C(=O)O",
  "(E)-3,7-Dimethylocta-2,6-dienal": "CC(C)=CCC/C(C)=C/C=O", "(Z)-3,7-Dimethylocta-2,6-dienal": "CC(C)=CCC/C(C)=C\\C=O",
  "(E)-3,7-Dimethylocta-2,6-dien-1-ol": "CC(C)=CCC/C(C)=C/CO", "(Z)-3,7-Dimethylocta-2,6-dien-1-ol": "CC(C)=CCC/C(C)=C\\CO",
  Methylbenzen: "CC1=CC=CC=C1", "1,2-Dimethylbenzen": "CC1=CC=CC=C1C", "1,4-Dimethylbenzen": "CC1=CC=C(C)C=C1", Ethenylbenzen: "C=CC1=CC=CC=C1",
  "2-Hydroxybenzoesäure": "OC(=O)C1=CC=CC=C1O", "2-(Acetyloxy)benzoesäure": "CC(=O)OC1=CC=CC=C1C(=O)O",
  "2-Methyl-1,3,5-trinitrobenzen": "CC1=C(C=C(C=C1[NO2])[NO2])[NO2]", "2,4,6-Trinitrophenol": "OC1=C(C=C(C=C1[NO2])[NO2])[NO2]",
  "3,7-Dimethyloct-6-enal": "CC(C)=CCCC(C)CC=O", "2,3,4,5,6-Pentahydroxyhexanal": "OCC(O)C(O)C(O)C(O)C=O",
  "2-Methoxy-2-methylpropan": "COC(C)(C)C", Ethoxyethan: "CCOCC", Methoxymethan: "COC", Trichlormethan: "ClC(Cl)Cl", Tetrachlormethan: "ClC(Cl)(Cl)Cl",
  Dichlormethan: "ClCCl", Methanamin: "CN", Ethanamin: "CCN", "N-Methylmethanamin": "CNC", "N-Ethylethanamin": "CCNCC", "N,N-Dimethylmethanamin": "CN(C)C",
  "2-Aminoethansäure": "NCC(=O)O", "2-Aminopropansäure": "CC(N)C(=O)O", "2-Amino-3-methylbutansäure": "CC(C)C(N)C(=O)O",
  "2-Amino-4-methylpentansäure": "CC(C)CC(N)C(=O)O", "2-Amino-3-methylpentansäure": "CCC(C)C(N)C(=O)O", "2-Amino-3-hydroxypropansäure": "OCC(N)C(=O)O",
  "2-Amino-3-sulfanylpropansäure": "SCC(N)C(=O)O", "2-Amino-3-phenylpropansäure": "OC(=O)C(N)CC1=CC=CC=C1", "2-Aminobutandisäure": "OC(=O)CC(N)C(=O)O",
  "2-Aminopentandisäure": "OC(=O)CCC(N)C(=O)O", "2,6-Diaminohexansäure": "NCCCCC(N)C(=O)O", "2-Amino-3-hydroxybutansäure": "CC(O)C(N)C(=O)O",
  "2-Amino-4-(methylsulfanyl)butansäure": "CSCCC(N)C(=O)O", "2-Amino-3-(4-hydroxyphenyl)propansäure": "OC(=O)C(N)CC1=CC=C(O)C=C1",
  Ethannitril: "CC#N", Methannitril: "C#N", Ethanamid: "CC(N)=O", Oxolan: "C1CCOC1", Oxan: "C1CCOCC1",
  Phenol: "OC1=CC=CC=C1", Anilin: "NC1=CC=CC=C1", Benzoesäure: "OC(=O)C1=CC=CC=C1",
};
