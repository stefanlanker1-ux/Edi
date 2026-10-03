// Kraftfeld aufbauen (Terme mit Parametern) und Energie/Gradient berechnen.
// Terme: Bindungen, Winkel, Streck-Biege-Kopplung, Aus-der-Ebene-Biegung, Torsionen, Van der Waals (gepuffert 14-7),
// Coulomb (Abstand + 0,05 Å, 1-4-Paare × 0,75). Fehlende Parameter über die empirischen Regeln von MMFF94.

import type { Mol } from "./mol.ts";
import {
  P, angleParams, bndkParams, bondParams, dfsbParams, hlParams, isAromaticType, oopParams, stbnParams, torParams,
  type Angle, type Bond, type Prop, type Stbn, type Tor,
} from "./params.ts";
import { bondType, type Typed } from "./typer.ts";

const DEG = Math.PI / 180;
const isZero = (x: number) => Math.abs(x) < 1e-10;

function row(z: number) { return z >= 3 && z <= 10 ? 1 : z >= 11 && z <= 18 ? 2 : z >= 19 && z <= 36 ? 3 : z >= 37 && z <= 54 ? 4 : 0; }
function rowHL(z: number) {
  let r = z === 2 ? 1 : z >= 3 && z <= 10 ? 2 : z >= 11 && z <= 18 ? 3 : z >= 19 && z <= 36 ? 4 : z >= 37 && z <= 54 ? 5 : 0;
  if ((z >= 21 && z <= 30) || (z >= 39 && z <= 48)) r *= 10;
  return r;
}

export interface FF {
  n: number;
  bonds: { i: number; j: number; r0: number; kb: number }[];
  angles: { i: number; j: number; k: number; theta0: number; ka: number; lin: boolean }[];
  stbn: { i: number; j: number; k: number; r1: number; r2: number; theta0: number; f1: number; f2: number }[];
  oop: { i: number; j: number; k: number; l: number; koop: number }[];
  tors: { i: number; j: number; k: number; l: number; V1: number; V2: number; V3: number }[];
  vdw: { i: number; j: number; R: number; eps: number }[];
  ele: { i: number; j: number; qq: number; s14: boolean }[];
}

class Builder {
  m: Mol;
  t: number[];
  constructor(T: Typed) { this.m = T.mol; this.t = T.types; }
  prop(a: number): Prop { return P().prop.get(this.t[a])!; }
  bt(a: number, b: number) { return bondType(this.m, this.t, a, b); }

  angleRing(i: number, j: number, k: number) {
    const m = this.m;
    if (!m.hasBond(i, j) || !m.hasBond(j, k)) return 0;
    if (m.hasBond(k, i)) return 3;
    const s1 = new Set(m.nbrs[i].filter(x => x !== j));
    return m.nbrs[k].some(x => x !== j && s1.has(x)) ? 4 : 0;
  }
  torRing(i: number, j: number, k: number, l: number) {
    const m = this.m;
    if (m.hasBond(l, i)) return 4;
    const s1 = new Set(m.nbrs[i].filter(x => x !== j));
    return m.nbrs[l].some(x => x !== k && s1.has(x)) ? 5 : 0;
  }
  angleType(i: number, j: number, k: number) {
    const sum = this.bt(i, j) + this.bt(j, k);
    const size = this.angleRing(i, j, k);
    if (!size) return sum;
    return sum ? size + sum + size - 2 : size;
  }

  bondEmpirical(a: number, b: number): Bond {
    const z1 = this.m.z[a], z2 = this.m.z[b];
    const cr = P().covRad;
    const p1 = cr.get(z1)!, p2 = cr.get(z2)!;
    const c = z1 === 1 || z2 === 1 ? 0.05 : 0.085;
    const r0 = p1.r0 + p2.r0 - c * Math.pow(Math.abs(p1.chi - p2.chi), 1.4);
    const k = bndkParams(z1, z2);
    if (k) { const x = k.r0 / r0; return { r0, kb: k.kb * Math.pow(x, 6) }; }
    const hl = hlParams(rowHL(z1), rowHL(z2))!;
    return { r0, kb: Math.pow(10, -(r0 - hl.a) / hl.d) };
  }
  bond(a: number, b: number): Bond {
    return bondParams(this.bt(a, b), this.t[a], this.t[b]) ?? this.bondEmpirical(a, b);
  }

  angleEmpirical(old: Angle | null, i: number, j: number, k: number, b1: Bond, b2: Bond): Angle {
    const m = this.m, pc = this.prop(j);
    const z = [m.z[i], m.z[j], m.z[k]];
    const ring = this.angleRing(i, j, k);
    let theta0: number;
    if (!old) {
      theta0 = 120;
      if (pc.crd === 4) theta0 = 109.45;
      else if (pc.crd === 2) { if (z[1] === 8) theta0 = 105; else if (pc.linh === 1) theta0 = 180; }
      else if (pc.crd === 3 && pc.val === 3 && pc.mltb === 0) theta0 = z[1] === 7 ? 107 : 92;
      if (ring === 3) theta0 = 60; else if (ring === 4) theta0 = 90;
    } else theta0 = old.theta0;
    const ZC: Record<number, [number, number]> = {
      1: [1.395, 0], 6: [2.494, 1.016], 7: [2.711, 1.113], 8: [3.045, 1.337], 9: [2.847, 0], 14: [2.35, 0.811],
      15: [2.35, 1.068], 16: [2.98, 1.249], 17: [2.909, 1.078], 35: [3.017, 0], 53: [3.086, 0],
    };
    const Zv = z.map(x => ZC[x]?.[0] ?? 0), Cv = z.map(x => ZC[x]?.[1] ?? 0);
    const D = (b1.r0 - b2.r0) ** 2 / (b1.r0 + b2.r0) ** 2;
    const th = DEG * theta0;
    let beta = 1.75;
    if (ring === 4) beta *= 0.85; else if (ring === 3) beta *= 0.05;
    return { theta0, ka: beta * Zv[0] * Cv[1] * Zv[2] / ((b1.r0 + b2.r0) * th * th * Math.exp(2 * D)) };
  }
  angle(i: number, j: number, k: number): Angle {
    const at = this.angleType(i, j, k);
    const p = angleParams(at, this.t[i], this.t[j], this.t[k]);
    if (p && !isZero(p.ka)) return p;
    return this.angleEmpirical(p, i, j, k, this.bond(i, j), this.bond(j, k));
  }

  stretchBend(i: number, j: number, k: number): Stbn | null {
    const pc = this.prop(j);
    if (pc.linh) return null;
    const t = this.t, bt = [this.bt(i, j), this.bt(j, k)];
    const at = this.angleType(i, j, k);
    const sbType = sbTypeOf(at, t[i] <= t[k] ? bt[0] : bt[1], t[i] < t[k] ? bt[1] : bt[0]);
    let [swap, p] = stbnParams(sbType, bt[0], bt[1], t[i], t[j], t[k]);
    if (!p) [swap, p] = dfsbParams(row(this.m.z[i]), row(this.m.z[j]), row(this.m.z[k]));
    if (!p || (isZero(p.kbaIJK) && isZero(p.kbaKJI))) return null;
    return swap ? { kbaIJK: p.kbaKJI, kbaKJI: p.kbaIJK } : p;
  }

  torType(i: number, j: number, k: number, l: number): [number, number] {
    const m = this.m;
    const bIJ = this.bt(i, j), bJK = this.bt(j, k), bKL = this.bt(k, l);
    let tt = bJK, second = 0;
    if (bJK === 0 && m.bond(j, k) === 1 && (bIJ === 1 || bKL === 1)) tt = 2;
    const size = this.torRing(i, j, k, l);
    if (size === 4 && !(m.hasBond(i, k) || m.hasBond(j, l))) { second = tt; tt = 4; }
    else if (size === 5 && [i, j, k, l].some(x => this.t[x] === 1)) { second = tt; tt = 5; }
    return [tt, second];
  }
  torEmpirical(j: number, k: number): Tor {
    const m = this.m, pj = this.prop(j), pk = this.prop(k);
    const tor = { V1: 0, V2: 0, V3: 0 };
    const zz = [m.z[j], m.z[k]];
    const U = [0, 0], V = [0, 0], W = [0, 0];
    zz.forEach((z, i) => {
      if (z === 6) { U[i] = 2; V[i] = 2.12; }
      else if (z === 7) { U[i] = 2; V[i] = 1.5; }
      else if (z === 8) { U[i] = 2; V[i] = 0.2; W[i] = 2; }
      else if (z === 14) { U[i] = 1.25; V[i] = 1.22; }
      else if (z === 15) { U[i] = 1.25; V[i] = 2.4; }
      else if (z === 16) { U[i] = 1.25; V[i] = 0.49; W[i] = 8; }
    });
    const N = (pj.crd - 1) * (pk.crd - 1);
    const sqU = Math.sqrt(U[0] * U[1]);
    const bo = m.bond(j, k);
    if (pj.linh || pk.linh) return tor;
    if (isAromaticType(this.t[j]) && isAromaticType(this.t[k]) && m.bondArom.has(m.k(j, k))) {
      const beta = (pj.val === 3 && pk.val === 4) || (pj.val === 4 && pk.val === 3) ? 3 : 6;
      const pi = pj.pilp === 0 && pk.pilp === 0 ? 0.5 : 0.3;
      tor.V2 = beta * pi * sqU;
      return tor;
    }
    if (bo === 2) { tor.V2 = 6 * (pj.mltb === 2 && pk.mltb === 2 ? 1 : 0.4) * sqU; return tor; }
    const v3 = () => { tor.V3 = Math.sqrt(V[0] * V[1]) / N; };
    const conj = (p: Prop) => (p.crd === 3 && (p.val === 4 || p.val === 34 || p.mltb)) || (p.crd === 2 && (p.val === 3 || p.mltb));
    if (pj.crd === 4 && pk.crd === 4) { v3(); return tor; }
    if (pj.crd === 4 && pk.crd !== 4) { if (!conj(pk)) v3(); return tor; }
    if (pk.crd === 4 && pj.crd !== 4) { if (!conj(pj)) v3(); return tor; }
    if ((bo === 1 && pj.mltb && pk.mltb) || (pj.mltb && pk.pilp) || (pj.pilp && pk.mltb)) {
      if (pj.pilp && pk.pilp) return tor;
      const r2 = row(zz[0]) === 2 && row(zz[1]) === 2;
      if (pj.pilp && pk.mltb) {
        const pi = pj.mltb === 1 ? 0.5 : r2 ? 0.3 : 0.15;
        tor.V2 = 6 * pi * sqU;
      } else if (pk.pilp && pj.mltb) {
        const pi = pk.mltb === 1 ? 0.5 : r2 ? 0.3 : 0.15;
        tor.V2 = 6 * pi * sqU;
      } else if ((pj.mltb === 1 || pk.mltb === 1) && (zz[0] !== 6 || zz[1] !== 6)) tor.V2 = 6 * 0.4 * sqU;
      else tor.V2 = 6 * 0.15 * sqU;
      return tor;
    }
    if ((zz[0] === 8 || zz[0] === 16) && (zz[1] === 8 || zz[1] === 16)) tor.V2 = -Math.sqrt(W[0] * W[1]);
    else v3();
    return tor;
  }
  torsion(i: number, j: number, k: number, l: number): Tor | null {
    const tt = this.torType(i, j, k, l);
    const [, p] = torParams(tt, this.t[i], this.t[j], this.t[k], this.t[l]);
    const v = p ?? this.torEmpirical(j, k);
    return isZero(v.V1) && isZero(v.V2) && isZero(v.V3) ? null : v;
  }
}

function sbTypeOf(at: number, b1: number, b2: number) {
  switch (at) {
    case 1: return b1 || b1 === b2 ? 1 : 2;
    case 2: return 3;
    case 4: return 4;
    case 3: return 5;
    case 5: return b1 || b1 === b2 ? 6 : 7;
    case 6: return 8;
    case 7: return b1 || b1 === b2 ? 9 : 10;
    case 8: return 11;
  }
  return 0;
}

/** Abstand in Bindungen (Breitensuche); -1 = nicht verbunden */
function topoDist(m: Mol) {
  const d: number[][] = [];
  for (let s = 0; s < m.n; s++) {
    const row = new Array(m.n).fill(-1);
    row[s] = 0;
    const q = [s];
    for (let i = 0; i < q.length; i++) for (const y of m.nbrs[q[i]]) if (row[y] < 0) { row[y] = row[q[i]] + 1; q.push(y); }
    d.push(row);
  }
  return d;
}

/** Torsionsachse: keine Endatome, keine Atome an Dreifachbindungen, beide sp2 oder sp3 */
function torsionAxis(m: Mol, a: number, b: number) {
  const ok = (x: number) => m.deg(x) > 1 && !m.nbrs[x].some(y => m.bond(x, y) === 3) && (m.hyb[x] === 3 || m.hyb[x] === 4);
  return ok(a) && ok(b);
}

export function buildFF(T: Typed): FF {
  const m = T.mol, B = new Builder(T), V = P();
  const ff: FF = { n: m.n, bonds: [], angles: [], stbn: [], oop: [], tors: [], vdw: [], ele: [] };
  for (const [a, b] of m.bonds) { const p = B.bond(a, b); ff.bonds.push({ i: a, j: b, r0: p.r0, kb: p.kb }); }
  for (let j = 0; j < m.n; j++) {
    const nb = m.nbrs[j];
    if (nb.length === 1) continue;
    const pc = B.prop(j);
    for (let x = 0; x < nb.length; x++) for (let y = x + 1; y < nb.length; y++) {
      const i = nb[x], k = nb[y];
      const a = B.angle(i, j, k);
      ff.angles.push({ i, j, k, theta0: a.theta0, ka: a.ka, lin: pc.linh > 0 });
      const s = B.stretchBend(i, j, k);
      if (s) ff.stbn.push({ i, j, k, r1: B.bond(i, j).r0, r2: B.bond(j, k).r0, theta0: a.theta0, f1: s.kbaIJK, f2: s.kbaKJI });
    }
  }
  for (let j = 0; j < m.n; j++) {
    if (m.deg(j) !== 3) continue;
    const [n0, n2, n3] = m.nbrs[j];
    const koop = oopParams(T.types[n0], T.types[j], T.types[n2], T.types[n3]);
    if (koop === null) continue;
    ff.oop.push({ i: n0, j, k: n2, l: n3, koop }, { i: n0, j, k: n3, l: n2, koop }, { i: n2, j, k: n3, l: n0, koop });
  }
  for (const [j, k] of m.bonds) {
    if (!torsionAxis(m, j, k)) continue;
    for (const i of m.nbrs[j]) {
      if (i === k) continue;
      for (const l of m.nbrs[k]) {
        if (l === j || l === i) continue;
        const p = B.torsion(i, j, k, l);
        if (p) ff.tors.push({ i, j, k, l, ...p });
      }
    }
  }
  const d = topoDist(m);
  for (let i = 0; i < m.n; i++) for (let j = i + 1; j < m.n; j++) {
    if (d[i][j] < 3) continue;
    const s14 = d[i][j] === 3;
    const pi = V.vdw.get(T.types[i]), pj = V.vdw.get(T.types[j]);
    if (pi && pj) {
      const g = (pi.Rstar - pj.Rstar) / (pi.Rstar + pj.Rstar);
      let R = 0.5 * (pi.Rstar + pj.Rstar) * (1 + (pi.DA === "D" || pj.DA === "D" ? 0 : V.vdwB * (1 - Math.exp(-V.vdwBeta * g * g))));
      let eps = 181.16 * pi.G * pj.G * pi.alpha * pj.alpha /
        ((Math.sqrt(pi.alpha / pi.N) + Math.sqrt(pj.alpha / pj.N)) * R ** 6);
      if ((pi.DA === "D" && pj.DA === "A") || (pi.DA === "A" && pj.DA === "D")) { R *= V.DARAD; eps *= V.DAEPS; }
      ff.vdw.push({ i, j, R, eps });
    }
    if (!isZero(T.charge[i]) && !isZero(T.charge[j])) ff.ele.push({ i, j, qq: T.charge[i] * T.charge[j], s14 });
  }
  return ff;
}
