// 3D-Startgeometrie allein aus der Strukturformel, danach Optimierung mit MMFF94.
// Ablauf: zufällige Lage in 4 Dimensionen (dort entwirren sich Ringe und Stereozentren leichter) → Abstandsfunktion
// (Bindungen, Winkel als 1-3-Abstände, E/Z als 1-4-Abstände, Chiralität als Spatprodukt, ebene sp2-Zentren, Abstoßung)
// minimieren → vierte Koordinate gegen 0 drücken → in 3D nachbessern → MMFF94. Mehrere Versuche, der beste gilt.

import type { FF } from "./ff.ts";
import type { Typed } from "./typer.ts";
import { bfgs, minimize } from "./minimize.ts";
import { energy } from "./energy.ts";

/** Stereo: Zentren [Atom, Nachbar 1, 2, 3, Vorzeichen des Spatprodukts ±1], Doppelbindungen [a, b, c, d, cis 1|0] */
export interface Stereo { c: number[][]; d: number[][] }

export interface Embedded { x: Float64Array; energy: number; stereoOk: boolean; tries: number }

interface Restraints {
  pair: { i: number; j: number; d: number; k: number }[];
  lower: { i: number; j: number; d: number }[];
  chiral: { c: number; a: number; b: number; e: number; v: number }[];
  planar: { c: number; a: number; b: number; e: number }[];
  /** E/Z als 1-4-Abstände (auch in pair enthalten) */
  ez: { i: number; j: number; d: number; k: number }[];
}

/** Abstand 1–4 bei gegebenem Diederwinkel (0 = cis, 180 = trans): b im Ursprung, c auf der x-Achse */
function dist14(r1: number, r2: number, r3: number, t1: number, t2: number, phiDeg: number) {
  const a1 = t1 * Math.PI / 180, a2 = t2 * Math.PI / 180, side = phiDeg === 0 ? 1 : -1;
  const ax = r1 * Math.cos(a1), ay = r1 * Math.sin(a1);
  const dx = r2 - r3 * Math.cos(a2), dy = side * r3 * Math.sin(a2);
  return Math.hypot(ax - dx, ay - dy);
}

function restraints(T: Typed, ff: FF, st: Stereo): Restraints {
  const m = T.mol;
  const r0 = new Map<number, number>(), th0 = new Map<string, number>();
  for (const b of ff.bonds) r0.set(m.k(b.i, b.j), b.r0);
  for (const a of ff.angles) { th0.set(`${a.i},${a.j},${a.k}`, a.theta0); th0.set(`${a.k},${a.j},${a.i}`, a.theta0); }
  const R: Restraints = { pair: [], lower: [], chiral: [], planar: [], ez: [] };
  const done = new Set<number>();
  const pairKey = (i: number, j: number) => (i < j ? i * 4096 + j : j * 4096 + i);
  for (const b of ff.bonds) { R.pair.push({ i: b.i, j: b.j, d: b.r0, k: 100 }); done.add(pairKey(b.i, b.j)); }
  for (const a of ff.angles) {
    const r1 = r0.get(m.k(a.i, a.j))!, r2 = r0.get(m.k(a.j, a.k))!, t = a.theta0 * Math.PI / 180;
    const key = pairKey(a.i, a.k);
    if (done.has(key)) continue;
    done.add(key);
    R.pair.push({ i: a.i, j: a.k, d: Math.sqrt(r1 * r1 + r2 * r2 - 2 * r1 * r2 * Math.cos(t)), k: 50 });
  }
  for (const [a, b, c, d, cis] of st.d) {
    const r1 = r0.get(m.k(a, b))!, r2 = r0.get(m.k(b, c))!, r3 = r0.get(m.k(c, d))!;
    const t1 = th0.get(`${a},${b},${c}`) ?? 120, t2 = th0.get(`${b},${c},${d}`) ?? 120;
    const ez = { i: a, j: d, d: dist14(r1, r2, r3, t1, t2, cis ? 0 : 180), k: 30 };
    R.pair.push(ez);
    R.ez.push(ez);
    done.add(pairKey(a, d));
  }
  for (const [c, a, b, e, sign] of st.c) {
    const v = 0.77 * r0.get(m.k(c, a))! * r0.get(m.k(c, b))! * r0.get(m.k(c, e))!;
    R.chiral.push({ c, a, b, e, v: sign * v });
  }
  for (let c = 0; c < m.n; c++) {
    if (m.deg(c) === 3 && m.hyb[c] === 3) { const [a, b, e] = m.nbrs[c]; R.planar.push({ c, a, b, e }); }
  }
  // Abstoßung zwischen Atomen, die nicht über 1 oder 2 Bindungen verbunden sind
  for (let i = 0; i < m.n; i++) for (let j = i + 1; j < m.n; j++) {
    if (done.has(pairKey(i, j))) continue;
    const h = (m.z[i] === 1 ? 1 : 0) + (m.z[j] === 1 ? 1 : 0);
    R.lower.push({ i, j, d: h === 2 ? 1.8 : h === 1 ? 2.2 : 2.6 });
  }
  return R;
}

/** Fehlerfunktion in D Dimensionen (3 oder 4); w4 = Gewicht, mit dem die vierte Koordinate gegen 0 gezogen wird */
function errorFn(R: Restraints, D: number, w4: number) {
  const P = Int32Array.from(R.pair.flatMap(p => [p.i, p.j])), Pd = Float64Array.from(R.pair.map(p => p.d)), Pk = Float64Array.from(R.pair.map(p => p.k));
  const L = Int32Array.from(R.lower.flatMap(p => [p.i, p.j])), Ld = Float64Array.from(R.lower.map(p => p.d));
  const V = Int32Array.from([...R.chiral.flatMap(c => [c.c, c.a, c.b, c.e]), ...R.planar.flatMap(p => [p.c, p.a, p.b, p.e])]);
  const Vt = Float64Array.from([...R.chiral.map(c => c.v), ...R.planar.map(() => 0)]);
  return (x: Float64Array, g?: Float64Array) => {
    let E = 0;
    const dist = (i: number, j: number) => {
      let s = 0;
      for (let q = 0; q < D; q++) { const v = x[i + q] - x[j + q]; s += v * v; }
      return Math.sqrt(s);
    };
    const pull = (i: number, j: number, f: number) => {
      for (let q = 0; q < D; q++) { const v = f * (x[i + q] - x[j + q]); g![i + q] += v; g![j + q] -= v; }
    };
    for (let n = 0; n < Pd.length; n++) {
      const i = D * P[2 * n], j = D * P[2 * n + 1], r = dist(i, j), e = r - Pd[n];
      E += Pk[n] * e * e;
      if (g && r > 1e-9) pull(i, j, 2 * Pk[n] * e / r);
    }
    for (let n = 0; n < Ld.length; n++) {
      const i = D * L[2 * n], j = D * L[2 * n + 1];
      let s = 0;
      for (let q = 0; q < D; q++) { const v = x[i + q] - x[j + q]; s += v * v; }
      const d = Ld[n];
      if (s >= d * d) continue;
      const r = Math.sqrt(s), e = r - d;
      E += 10 * e * e;
      if (g && r > 1e-9) pull(i, j, 20 * e / r);
    }
    // Spatprodukt der drei Nachbar-Vektoren (nur x, y, z): Chiralität (Sollwert) bzw. eben (0)
    for (let n = 0; n < Vt.length; n++) {
      const c = D * V[4 * n], a = D * V[4 * n + 1], b = D * V[4 * n + 2], e = D * V[4 * n + 3];
      const Ax = x[a] - x[c], Ay = x[a + 1] - x[c + 1], Az = x[a + 2] - x[c + 2];
      const Bx = x[b] - x[c], By = x[b + 1] - x[c + 1], Bz = x[b + 2] - x[c + 2];
      const Cx = x[e] - x[c], Cy = x[e + 1] - x[c + 1], Cz = x[e + 2] - x[c + 2];
      const dAx = By * Cz - Bz * Cy, dAy = Bz * Cx - Bx * Cz, dAz = Bx * Cy - By * Cx;
      const diff = Ax * dAx + Ay * dAy + Az * dAz - Vt[n];
      E += 5 * diff * diff;
      if (!g) continue;
      const f = 10 * diff;
      const dBx = Cy * Az - Cz * Ay, dBy = Cz * Ax - Cx * Az, dBz = Cx * Ay - Cy * Ax;
      const dCx = Ay * Bz - Az * By, dCy = Az * Bx - Ax * Bz, dCz = Ax * By - Ay * Bx;
      g[a] += f * dAx; g[a + 1] += f * dAy; g[a + 2] += f * dAz;
      g[b] += f * dBx; g[b + 1] += f * dBy; g[b + 2] += f * dBz;
      g[e] += f * dCx; g[e + 1] += f * dCy; g[e + 2] += f * dCz;
      g[c] -= f * (dAx + dBx + dCx); g[c + 1] -= f * (dAy + dBy + dCy); g[c + 2] -= f * (dAz + dBz + dCz);
    }
    if (D === 4 && w4 > 0) {
      for (let i = 3; i < x.length; i += 4) { E += w4 * x[i] * x[i]; if (g) g[i] += 2 * w4 * x[i]; }
    }
    return E;
  };
}

/** einfacher Zufallsgenerator mit Startwert (gleiche Ergebnisse bei gleichem Startwert) */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/** prüft Chiralität und E/Z in 3D-Koordinaten */
export function stereoMatches(x: ArrayLike<number>, st: Stereo) {
  for (const [c, a, b, e, sign] of st.c) {
    const v = (n: number) => [x[3 * n] - x[3 * c], x[3 * n + 1] - x[3 * c + 1], x[3 * n + 2] - x[3 * c + 2]];
    const A = v(a), B = v(b), C = v(e);
    const V = A[0] * (B[1] * C[2] - B[2] * C[1]) - A[1] * (B[0] * C[2] - B[2] * C[0]) + A[2] * (B[0] * C[1] - B[1] * C[0]);
    if (Math.sign(V) !== sign) return false;
  }
  for (const [a, b, c, d, cis] of st.d) {
    const P = (n: number) => [x[3 * n], x[3 * n + 1], x[3 * n + 2]];
    const pb = P(b), pc = P(c), ax = [pc[0] - pb[0], pc[1] - pb[1], pc[2] - pb[2]];
    const al = ax[0] ** 2 + ax[1] ** 2 + ax[2] ** 2;
    const proj = (p: number[], o: number[]) => {
      const v = [p[0] - o[0], p[1] - o[1], p[2] - o[2]], t = (v[0] * ax[0] + v[1] * ax[1] + v[2] * ax[2]) / al;
      return [v[0] - t * ax[0], v[1] - t * ax[1], v[2] - t * ax[2]];
    };
    const u = proj(P(a), pb), w = proj(P(d), pc);
    if ((u[0] * w[0] + u[1] * w[1] + u[2] * w[2] > 0 ? 1 : 0) !== cis) return false;
  }
  return true;
}

/** 3D-Koordinaten (Å) mit MMFF94 optimiert; `tries` zufällige Starts, der energieärmste mit richtigem Stereo gewinnt */
/** eine Bindung mehr als 0,25 Å von ihrer Soll-Länge entfernt */
function tangled(ff: FF, x: Float64Array) {
  return ff.bonds.some(({ i, j, r0 }) => Math.abs(Math.hypot(x[3 * i] - x[3 * j], x[3 * i + 1] - x[3 * j + 1], x[3 * i + 2] - x[3 * j + 2]) - r0) > 0.25);
}

export function embed(T: Typed, ff: FF, st: Stereo = { c: [], d: [] }, tries = 3, seed = 1): Embedded {
  const n = T.mol.n;
  const R = restraints(T, ff, st);
  let best: Embedded | null = null, spare: Embedded | null = null;
  const rand = rng(seed);
  // erst mit festgehaltenem Stereo minimieren (sonst kippt z. B. eine N=N-Bindung über die Drehbarriere), dann frei
  const hold = st.c.length || st.d.length ? errorFn({ pair: R.ez, lower: [], chiral: R.chiral, planar: [], ez: [] }, 3, 0) : null;
  const relax = (x: Float64Array) => {
    const x0 = hold ? bfgs(3 * n, x, (y, g) => energy(ff, y, g).total + hold(y, g), 500, 1e-3).x : x;
    return minimize(ff, x0, 2000);
  };
  // Versuche mit falschem Stereo oder verhakter Lage zählen nicht: weiter, bis mindestens einer brauchbar ist (höchstens 30)
  const maxTries = tries * 4, hardMax = Math.max(maxTries, 30);
  let ok = 0, t = 0;
  for (; ok < tries && (t < maxTries || (ok === 0 && t < hardMax)); t++) {
    const box = 2 + 1.5 * Math.cbrt(n);
    const x4 = new Float64Array(4 * n);
    for (let i = 0; i < x4.length; i++) x4[i] = (rand() - 0.5) * 2 * box;
    let r = bfgs(4 * n, x4, errorFn(R, 4, 0), 200, 1e-2);
    r = bfgs(4 * n, r.x, errorFn(R, 4, 5), 100, 1e-2);
    const x3 = new Float64Array(3 * n);
    for (let i = 0; i < n; i++) for (let q = 0; q < 3; q++) x3[3 * i + q] = r.x[4 * i + q];
    const r3 = bfgs(3 * n, x3, errorFn(R, 3, 0), 150, 1e-2);
    if (!stereoMatches(r3.x, st)) continue;
    const mm = relax(r3.x);
    const okStereo = stereoMatches(mm.x, st);
    if (!okStereo) continue;
    const e = energy(ff, mm.x).total;
    // verhakt (z. B. Ring durch Ring gefädelt): Bindungen bleiben weit gedehnt – nur als Notlösung behalten
    if (tangled(ff, mm.x)) {
      if (!spare || e < spare.energy) spare = { x: mm.x, energy: e, stereoOk: true, tries: t + 1 };
      continue;
    }
    ok++;
    if (!best || e < best.energy) best = { x: mm.x, energy: e, stereoOk: true, tries: t + 1 };
  }
  best ??= spare;
  if (best) { best.tries = t; return best; }
  // kein Versuch mit richtigem Stereo: trotzdem eine Geometrie liefern (ohne Stereo-Garantie)
  const x4 = new Float64Array(4 * n);
  for (let i = 0; i < x4.length; i++) x4[i] = (rand() - 0.5) * 6;
  let r = bfgs(4 * n, x4, errorFn(R, 4, 0), 400, 1e-3);
  r = bfgs(4 * n, r.x, errorFn(R, 4, 5), 400, 1e-3);
  const x3 = new Float64Array(3 * n);
  for (let i = 0; i < n; i++) for (let q = 0; q < 3; q++) x3[3 * i + q] = r.x[4 * i + q];
  const mm = minimize(ff, x3, 2000);
  return { x: mm.x, energy: energy(ff, mm.x).total, stereoOk: stereoMatches(mm.x, st), tries: t };
}
