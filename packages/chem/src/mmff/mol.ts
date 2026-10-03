// Molekülgraph für das Kraftfeld: Atome (alle H einzeln), Bindungen mit Ordnung 1/2/3 (Kekulé-Form),
// kleinster Ringsatz (relevante Ringe), Hybridisierung und die MMFF-eigene Aromatizität (4n+2, Ringe nacheinander).

export interface MolInput {
  /** Elementsymbole */
  el: string[];
  /** Formalladungen (fehlt = 0) */
  q?: number[];
  /** Bindungen [Atom a, Atom b, Ordnung 1|2|3] */
  b: [number, number, number][];
}

const Z: Record<string, number> = {
  H: 1, Li: 3, B: 5, C: 6, N: 7, O: 8, F: 9, Na: 11, Mg: 12, Si: 14, P: 15, S: 16, Cl: 17, K: 19, Ca: 20,
  Fe: 26, Cu: 29, Zn: 30, Br: 35, I: 53,
};
/** Außenelektronen und übliche Bindigkeit (erste erlaubte Wertigkeit) */
const OUTER: Record<number, number> = { 1: 1, 3: 1, 5: 3, 6: 4, 7: 5, 8: 6, 9: 7, 11: 1, 12: 2, 14: 4, 15: 5, 16: 6, 17: 7, 19: 1, 20: 2, 26: 8, 29: 11, 30: 2, 35: 7, 53: 7 };
const DEFVAL: Record<number, number> = { 1: 1, 3: 1, 5: 3, 6: 4, 7: 3, 8: 2, 9: 1, 11: 1, 12: 2, 14: 4, 15: 3, 16: 2, 17: 1, 19: 1, 20: 2, 26: -1, 29: -1, 30: -1, 35: 1, 53: 1 };

export const AROMATIC = 4;

export class Mol {
  n: number;
  z: number[];
  q: number[];
  /** Nachbarn in der Reihenfolge der Bindungen */
  nbrs: number[][];
  /** Bindungsordnung je Paar (1, 2, 3; nach der Aromatizität 4 = aromatisch) */
  order: Map<number, number>;
  /** Bindungsordnung vor der Aromatizität (Kekulé) */
  kekule: Map<number, number>;
  bonds: [number, number][];
  rings: number[][] = [];
  arom: boolean[];
  bondArom = new Set<number>();
  hyb: number[] = [];

  constructor(m: MolInput) {
    this.n = m.el.length;
    this.z = m.el.map(e => {
      const z = Z[e];
      if (!z) throw new Error(`Element ${e} unbekannt`);
      return z;
    });
    this.q = m.el.map((_, i) => m.q?.[i] ?? 0);
    this.nbrs = m.el.map(() => []);
    this.order = new Map();
    this.bonds = [];
    for (const [a, b, o] of m.b) {
      this.nbrs[a].push(b);
      this.nbrs[b].push(a);
      this.order.set(this.k(a, b), o);
      this.bonds.push([a, b]);
    }
    this.kekule = new Map(this.order);
    this.arom = new Array(this.n).fill(false);
    this.rings = findRings(this);
    this.hyb = hybridization(this);
    setMMFFAromaticity(this);
  }

  k(a: number, b: number) { return a < b ? a * 4096 + b : b * 4096 + a; }
  bond(a: number, b: number) { return this.order.get(this.k(a, b)) ?? 0; }
  hasBond(a: number, b: number) { return this.order.has(this.k(a, b)); }
  deg(a: number) { return this.nbrs[a].length; }
  /** Summe der Bindungsordnungen (Kekulé) */
  valence(a: number) { let s = 0; for (const b of this.nbrs[a]) s += this.kekule.get(this.k(a, b))!; return s; }
  inRing(a: number) { return this.rings.some(r => r.includes(a)); }
  inRingOfSize(a: number, size: number) { return this.rings.some(r => r.length === size && r.includes(a)); }
  numRings(a: number) { return this.rings.filter(r => r.includes(a)).length; }
}

// ── Ringe ───────────────────────────────────────────────────────────────────
// Kandidaten: je Atom kürzeste Wege (Breitensuche) und jede Kante, die zwei Äste schließt; daraus die relevanten
// Ringe = alle, die sich nicht aus kürzeren Ringen zusammensetzen lassen (Gauß über GF(2) mit Bindungsvektoren).

function findRings(m: Mol): number[][] {
  const n = m.n;
  const nRing = m.bonds.length - n + components(m);
  if (nRing <= 0) return [];
  const bondIdx = new Map<number, number>();
  m.bonds.forEach(([a, b], i) => bondIdx.set(m.k(a, b), i));
  const cands = new Map<string, number[]>();
  for (let v = 0; v < n; v++) {
    if (m.deg(v) < 2) continue;
    const dist = new Array(n).fill(-1), par = new Array(n).fill(-1);
    dist[v] = 0;
    const queue = [v];
    for (let qi = 0; qi < queue.length; qi++) {
      const x = queue[qi];
      for (const y of m.nbrs[x]) if (dist[y] < 0) { dist[y] = dist[x] + 1; par[y] = x; queue.push(y); }
    }
    const path = (x: number) => { const p = [x]; while (x !== v) { x = par[x]; p.push(x); } return p; };
    for (const [x, y] of m.bonds) {
      if (dist[x] < 0 || dist[y] < 0 || par[x] === y || par[y] === x) continue;
      const px = path(x), py = path(y);
      // Wege dürfen sich nur in v treffen
      const sx = new Set(px);
      if (py.some(a => a !== v && sx.has(a))) continue;
      const ring = [...px.reverse(), ...py.slice(0, -1)];
      if (ring.length < 3) continue;
      const key = [...ring].sort((a, b) => a - b).join(",");
      if (!cands.has(key)) cands.set(key, ring);
    }
    // ungerade Ringe: Kante x–y mit gleichem Abstand ist oben enthalten; gerade Ringe: zwei Wege zu einem Atom w
    for (let w = 0; w < n; w++) {
      if (dist[w] <= 0) continue;
      const ps = m.nbrs[w].filter(u => dist[u] === dist[w] - 1);
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const pa = path(ps[i]), pb = path(ps[j]);
        const sa = new Set(pa);
        if (pb.some(a => a !== v && sa.has(a))) continue;
        const ring = [w, ...pa.slice(0, -1), v, ...pb.slice(0, -1).reverse()];
        const key = [...ring].sort((a, b) => a - b).join(",");
        if (!cands.has(key)) cands.set(key, ring);
      }
    }
  }
  const list = [...cands.values()].sort((a, b) => a.length - b.length);
  const vec = (r: number[]) => {
    const v = new Uint8Array(m.bonds.length);
    for (let i = 0; i < r.length; i++) v[bondIdx.get(m.k(r[i], r[(i + 1) % r.length]))!] = 1;
    return v;
  };
  // Basis aller strikt kürzeren Ringe; ein Ring ist relevant, wenn er davon unabhängig ist
  const basis: Uint8Array[] = [];
  const pivots: number[] = [];
  const reduce = (v0: Uint8Array) => {
    const v = v0.slice();
    for (let i = 0; i < basis.length; i++) if (v[pivots[i]]) for (let j = 0; j < v.length; j++) v[j] ^= basis[i][j];
    return v;
  };
  const out: number[][] = [];
  let i = 0;
  while (i < list.length) {
    const size = list[i].length;
    const group: number[][] = [];
    while (i < list.length && list[i].length === size) group.push(list[i++]);
    const added: Uint8Array[] = [];
    for (const r of group) {
      const red = reduce(vec(r));
      if (red.some(x => x)) { out.push(r); added.push(red); }
    }
    // Basis um diese Größe erweitern (unabhängige Vektoren)
    for (const a of added) {
      const red = reduce(a);
      const p = red.indexOf(1);
      if (p >= 0) {
        for (let k = 0; k < basis.length; k++) if (basis[k][p]) for (let j = 0; j < red.length; j++) basis[k][j] ^= red[j];
        basis.push(red); pivots.push(p);
      }
    }
    if (basis.length >= nRing && out.length >= nRing) {
      // alle weiteren Ringe sind abhängig von kürzeren – fertig
      break;
    }
  }
  return out;
}

function components(m: Mol) {
  const seen = new Array(m.n).fill(false);
  let c = 0;
  for (let s = 0; s < m.n; s++) {
    if (seen[s]) continue;
    c++;
    const st = [s];
    seen[s] = true;
    while (st.length) { const x = st.pop()!; for (const y of m.nbrs[x]) if (!seen[y]) { seen[y] = true; st.push(y); } }
  }
  return c;
}

// ── Hybridisierung (1 = s, 2 = sp, 3 = sp2, 4 = sp3, 5 = sp3d, 6 = sp3d2) ──────

function atomElec(m: Mol, a: number) {
  const z = m.z[a], dv = DEFVAL[z] ?? -1;
  if (dv <= 1) return -1;
  const degree = m.deg(a);
  if (degree > 3) return -1;
  const nlp = Math.max((OUTER[z] ?? 0) - dv - m.q[a], 0);
  let res = dv - degree + nlp;
  if (res > 1 && m.valence(a) - degree > 1) res = 1;
  return res;
}

function conjCandidate(m: Mol, a: number) {
  const z = m.z[a], dv = DEFVAL[z] ?? -1, nouter = OUTER[z] ?? 0;
  if (!m.q[a] && dv >= 0 && m.valence(a) > dv) return false;
  return (z <= 10 || (nouter !== 5 && nouter !== 6) || (nouter === 6 && m.deg(a) < 2)) && atomElec(m, a) > 0;
}

/** konjugierte Bindungen: an einem Atom mit Mehrfachbindung zu einem Kandidaten alle Bindungen zu Kandidaten */
function conjugated(m: Mol) {
  const cand = Array.from({ length: m.n }, (_, a) => conjCandidate(m, a));
  const subs = cand.map((c, a) => (c ? m.deg(a) : 0));
  const conj = new Set<number>();
  for (let a = 0; a < m.n; a++) {
    if (!cand[a] || subs[a] < 2 || subs[a] > 3) continue;
    for (const b1 of m.nbrs[a]) {
      if (m.bond(a, b1) < 2 || !cand[b1]) continue;
      for (const b2 of m.nbrs[a]) {
        if (b2 === b1 || subs[b2] > 3 || !cand[b2]) continue;
        conj.add(m.k(a, b1));
        conj.add(m.k(a, b2));
      }
    }
  }
  return conj;
}

function hybridization(m: Mol): number[] {
  const conj = conjugated(m);
  return Array.from({ length: m.n }, (_, a) => {
    const z = m.z[a], deg = m.deg(a);
    let norbs = deg;
    if (z > 1) {
      const nouter = OUTER[z] ?? 0, tv = m.valence(a), chg = m.q[a];
      const free = nouter - (tv + chg);
      norbs = deg + Math.trunc(free / 2);
    }
    if (norbs <= 1) return 1;
    if (norbs === 2) return 2;
    if (norbs === 3) return 3;
    if (norbs === 4) return deg > 3 || !m.nbrs[a].some(b => conj.has(m.k(a, b))) ? 4 : 3;
    return norbs === 5 ? 5 : norbs === 6 ? 6 : 0;
  });
}

// ── MMFF-Aromatizität ───────────────────────────────────────────────────────

function setMMFFAromaticity(m: Mol) {
  const R = m.rings;
  if (!R.length) return;
  const aromBit = new Array(m.n).fill(false);
  const ringArom = new Array(R.length).fill(false);
  let nSet = 0, oldN = -1, allSet = false;
  while (!allSet && nSet > oldN) {
    for (let i = 0; i < R.length; i++) {
      const ring = R[i];
      let pi = 0, moveOn = false, nos = false, exo = false;
      for (let j = 0; !moveOn && j < ring.length; j++) {
        const a = ring[j], z = m.z[a];
        if (z === 7 || z === 8 || (z === 16 && m.deg(a) === 2)) nos = true;
        const next = ring[(j + 1) % ring.length];
        if (m.bond(a, next) === 2) { pi += 2; continue; }
        if (z !== 6 && !(z === 7 && m.valence(a) === 4)) continue;
        for (const nb of m.nbrs[a]) {
          if (ring.includes(nb)) continue;
          const o = m.bond(a, nb);
          if (o === 1) continue;
          if (m.inRing(nb) && !aromBit[nb]) { moveOn = true; break; }
          if (o === 2) { if (m.arom[nb]) pi++; else exo = true; }
        }
      }
      if (moveOn) continue;
      let can = true;
      for (const a of ring) {
        aromBit[a] = true;
        if ((m.z[a] === 6 || m.z[a] === 7) && m.hyb[a] !== 3) can = false;
      }
      if (!can) continue;
      if (nos && !exo && ring.length % 2) pi += 2;
      if (pi > 2 && (pi - 2) % 4 === 0) {
        ringArom[i] = true;
        for (const a of ring) m.arom[a] = true;
      }
    }
    oldN = nSet;
    nSet = 0;
    allSet = true;
    for (const ring of R) for (const a of ring) { if (aromBit[a]) nSet++; else allSet = false; }
  }
  R.forEach((ring, i) => {
    if (!ringArom[i]) return;
    for (let j = 0; j < ring.length; j++) {
      const key = m.k(ring[j], ring[(j + 1) % ring.length]);
      m.order.set(key, AROMATIC);
      m.bondArom.add(key);
    }
  });
}
