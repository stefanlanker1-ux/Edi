// Energie und Gradient des Kraftfelds. Die Terme werden einmal in Zahlenfelder übertragen (schnelle Schleifen ohne Objekte).

import type { FF } from "./ff.ts";

const C1 = 143.9325, DEG = Math.PI / 180, RAD = 180 / Math.PI;
const CB = -0.006981317, C2 = C1 * DEG * DEG, C5 = C1 * DEG, KE = 332.0716;

export interface Energy { total: number; bond: number; angle: number; stbn: number; oop: number; tors: number; vdw: number; ele: number }

interface Compiled {
  b: Int32Array; bp: Float64Array;   // i, j | r0, kb
  a: Int32Array; ap: Float64Array;   // i, j, k | theta0, ka, linear
  s: Int32Array; sp: Float64Array;   // i, j, k | r1, r2, theta0, f1, f2
  o: Int32Array; op: Float64Array;   // i, j, k, l | koop
  t: Int32Array; tp: Float64Array;   // i, j, k, l | V1, V2, V3
  v: Int32Array; vp: Float64Array;   // i, j | R, eps, R⁷
  e: Int32Array; ep: Float64Array;   // i, j | 332 · qi · qj · (0,75 bei 1-4)
}

const cache = new WeakMap<FF, Compiled>();

function compile(ff: FF): Compiled {
  let c = cache.get(ff);
  if (c) return c;
  c = {
    b: Int32Array.from(ff.bonds.flatMap(t => [t.i, t.j])), bp: Float64Array.from(ff.bonds.flatMap(t => [t.r0, t.kb])),
    a: Int32Array.from(ff.angles.flatMap(t => [t.i, t.j, t.k])), ap: Float64Array.from(ff.angles.flatMap(t => [t.theta0, t.ka, t.lin ? 1 : 0])),
    s: Int32Array.from(ff.stbn.flatMap(t => [t.i, t.j, t.k])), sp: Float64Array.from(ff.stbn.flatMap(t => [t.r1, t.r2, t.theta0, t.f1, t.f2])),
    o: Int32Array.from(ff.oop.flatMap(t => [t.i, t.j, t.k, t.l])), op: Float64Array.from(ff.oop.map(t => t.koop)),
    t: Int32Array.from(ff.tors.flatMap(t => [t.i, t.j, t.k, t.l])), tp: Float64Array.from(ff.tors.flatMap(t => [t.V1, t.V2, t.V3])),
    v: Int32Array.from(ff.vdw.flatMap(t => [t.i, t.j])), vp: Float64Array.from(ff.vdw.flatMap(t => [t.R, t.eps, t.R ** 7])),
    e: Int32Array.from(ff.ele.flatMap(t => [t.i, t.j])), ep: Float64Array.from(ff.ele.map(t => KE * t.qq * (t.s14 ? 0.75 : 1))),
  };
  cache.set(ff, c);
  return c;
}

const clip = (x: number) => (x > 1 ? 1 : x < -1 ? -1 : x);

/** Energie (kcal/mol); mit `g` (Länge 3n) wird der Gradient aufaddiert */
export function energy(ff: FF, x: ArrayLike<number>, g?: Float64Array): Energy {
  const c = compile(ff);
  let eB = 0, eA = 0, eS = 0, eO = 0, eT = 0, eV = 0, eE = 0;

  // Bindungen
  for (let n = 0, m = c.b.length / 2; n < m; n++) {
    const i = 3 * c.b[2 * n], j = 3 * c.b[2 * n + 1];
    const dx = x[i] - x[j], dy = x[i + 1] - x[j + 1], dz = x[i + 2] - x[j + 2];
    const r = Math.sqrt(dx * dx + dy * dy + dz * dz), dr = r - c.bp[2 * n], kb = c.bp[2 * n + 1];
    eB += 0.5 * C1 * kb * dr * dr * (1 - 2 * dr + (7 / 3) * dr * dr);
    if (g && r > 0) {
      const f = C1 * kb * dr * (1 - 3 * dr + (14 / 3) * dr * dr) / r;
      g[i] += f * dx; g[i + 1] += f * dy; g[i + 2] += f * dz;
      g[j] -= f * dx; g[j + 1] -= f * dy; g[j + 2] -= f * dz;
    }
  }

  // Winkel und Streck-Biege-Kopplung (gemeinsame Geometrie)
  const angle = (ia: number, ja: number, ka: number, out: Float64Array) => {
    const ax = x[ia] - x[ja], ay = x[ia + 1] - x[ja + 1], az = x[ia + 2] - x[ja + 2];
    const bx = x[ka] - x[ja], by = x[ka + 1] - x[ja + 1], bz = x[ka + 2] - x[ja + 2];
    const d1 = Math.sqrt(ax * ax + ay * ay + az * az), d2 = Math.sqrt(bx * bx + by * by + bz * bz);
    out[0] = d1; out[1] = d2;
    out[2] = ax / d1; out[3] = ay / d1; out[4] = az / d1;
    out[5] = bx / d2; out[6] = by / d2; out[7] = bz / d2;
    out[8] = clip(out[2] * out[5] + out[3] * out[6] + out[4] * out[7]);
  };
  const A = new Float64Array(9);
  const angleGrad = (ia: number, ja: number, ka: number, dE: number) => {
    const cos = A[8], sin = Math.max(Math.sqrt(Math.max(1 - cos * cos, 0)), 1e-8), f = -dE / sin;
    for (let q = 0; q < 3; q++) {
      const gi = f * (A[5 + q] - cos * A[2 + q]) / A[0], gk = f * (A[2 + q] - cos * A[5 + q]) / A[1];
      g![ia + q] += gi; g![ka + q] += gk; g![ja + q] -= gi + gk;
    }
  };
  for (let n = 0, m = c.a.length / 3; n < m; n++) {
    const i = 3 * c.a[3 * n], j = 3 * c.a[3 * n + 1], k = 3 * c.a[3 * n + 2];
    const th0 = c.ap[3 * n], ka = c.ap[3 * n + 1], lin = c.ap[3 * n + 2];
    angle(i, j, k, A);
    const cos = A[8];
    const dth = RAD * Math.acos(cos) - th0;
    eA += lin ? C1 * ka * (1 + cos) : 0.5 * C2 * ka * dth * dth * (1 + CB * dth);
    if (g) {
      const sin = Math.max(Math.sqrt(Math.max(1 - cos * cos, 0)), 1e-8);
      angleGrad(i, j, k, lin ? -C1 * ka * sin : RAD * C2 * ka * dth * (1 + 1.5 * CB * dth));
    }
  }
  for (let n = 0, m = c.s.length / 3; n < m; n++) {
    const i = 3 * c.s[3 * n], j = 3 * c.s[3 * n + 1], k = 3 * c.s[3 * n + 2];
    const p = 5 * n, r1 = c.sp[p], r2 = c.sp[p + 1], th0 = c.sp[p + 2], f1 = c.sp[p + 3], f2 = c.sp[p + 4];
    angle(i, j, k, A);
    const dth = RAD * Math.acos(A[8]) - th0, dr1 = A[0] - r1, dr2 = A[1] - r2;
    eS += C5 * dth * (f1 * dr1 + f2 * dr2);
    if (g) {
      for (let q = 0; q < 3; q++) {
        const gi = C5 * f1 * dth * A[2 + q], gk = C5 * f2 * dth * A[5 + q];
        g[i + q] += gi; g[k + q] += gk; g[j + q] -= gi + gk;
      }
      angleGrad(i, j, k, RAD * C5 * (f1 * dr1 + f2 * dr2));
    }
  }

  // Aus-der-Ebene-Biegung: Winkel χ der Bindung j–l zur Ebene i–j–k
  for (let n = 0, m = c.o.length / 4; n < m; n++) {
    const i = 3 * c.o[4 * n], j = 3 * c.o[4 * n + 1], k = 3 * c.o[4 * n + 2], l = 3 * c.o[4 * n + 3], koop = c.op[n];
    let ix = x[i] - x[j], iy = x[i + 1] - x[j + 1], iz = x[i + 2] - x[j + 2];
    let kx = x[k] - x[j], ky = x[k + 1] - x[j + 1], kz = x[k + 2] - x[j + 2];
    let lx = x[l] - x[j], ly = x[l + 1] - x[j + 1], lz = x[l + 2] - x[j + 2];
    const dI = Math.sqrt(ix * ix + iy * iy + iz * iz), dK = Math.sqrt(kx * kx + ky * ky + kz * kz), dL = Math.sqrt(lx * lx + ly * ly + lz * lz);
    if (dI < 1e-10 || dK < 1e-10 || dL < 1e-10) continue;
    ix /= dI; iy /= dI; iz /= dI; kx /= dK; ky /= dK; kz /= dK; lx /= dL; ly /= dL; lz /= dL;
    // n = rJI × rJK (Energie); für den Gradienten (−rJI) × rJK
    let nx = iy * kz - iz * ky, ny = iz * kx - ix * kz, nz = ix * ky - iy * kx;
    const nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
    nx /= nl; ny /= nl; nz /= nl;
    const sinE = clip(nx * lx + ny * ly + nz * lz), chiE = RAD * Math.asin(sinE);
    eO += 0.5 * C2 * koop * chiE * chiE;
    if (g) {
      const sinChi = clip(-(nx * lx + ny * ly + nz * lz)), chi = RAD * Math.asin(sinChi);
      const cosChi = Math.max(Math.sqrt(Math.max(1 - sinChi * sinChi, 0)), 1e-8);
      const cosT = clip(ix * kx + iy * ky + iz * kz);
      const sinT2 = Math.max(1 - cosT * cosT, 1e-8), sinT = Math.max(Math.sqrt(sinT2), 1e-8);
      const dE = RAD * C2 * koop * chi;
      const t1 = [ly * kz - lz * ky, lz * kx - lx * kz, lx * ky - ly * kx];
      const t2 = [iy * lz - iz * ly, iz * lx - ix * lz, ix * ly - iy * lx];
      const t3 = [ky * iz - kz * iy, kz * ix - kx * iz, kx * iy - ky * ix];
      const rI = [ix, iy, iz], rK = [kx, ky, kz], rL = [lx, ly, lz];
      const term1 = cosChi * sinT, term2 = sinChi / (cosChi * sinT2);
      for (let q = 0; q < 3; q++) {
        const tg1 = (t1[q] / term1 - (rI[q] - rK[q] * cosT) * term2) / dI;
        const tg3 = (t2[q] / term1 - (rK[q] - rI[q] * cosT) * term2) / dK;
        const tg4 = (t3[q] / term1 - rL[q] * sinChi / cosChi) / dL;
        g[i + q] += dE * tg1; g[k + q] += dE * tg3; g[l + q] += dE * tg4;
        g[j + q] -= dE * (tg1 + tg3 + tg4);
      }
    }
  }

  // Torsionen
  for (let n = 0, m = c.t.length / 4; n < m; n++) {
    const i = 3 * c.t[4 * n], j = 3 * c.t[4 * n + 1], k = 3 * c.t[4 * n + 2], l = 3 * c.t[4 * n + 3];
    const V1 = c.tp[3 * n], V2 = c.tp[3 * n + 1], V3 = c.tp[3 * n + 2];
    // F = r1 − r2, G = r2 − r3, H = r4 − r3; A = F × G, B = H × G
    const Fx = x[i] - x[j], Fy = x[i + 1] - x[j + 1], Fz = x[i + 2] - x[j + 2];
    const Gx = x[j] - x[k], Gy = x[j + 1] - x[k + 1], Gz = x[j + 2] - x[k + 2];
    const Hx = x[l] - x[k], Hy = x[l + 1] - x[k + 1], Hz = x[l + 2] - x[k + 2];
    const Ax = Fy * Gz - Fz * Gy, Ay = Fz * Gx - Fx * Gz, Az = Fx * Gy - Fy * Gx;
    const Bx = Hy * Gz - Hz * Gy, By = Hz * Gx - Hx * Gz, Bz = Hx * Gy - Hy * Gx;
    const A2 = Ax * Ax + Ay * Ay + Az * Az, B2 = Bx * Bx + By * By + Bz * Bz;
    let cos = 0;
    if (Math.sqrt(A2) >= 1e-10 && Math.sqrt(B2) >= 1e-10) cos = clip((Ax * Bx + Ay * By + Az * Bz) / Math.sqrt(A2 * B2));
    const cos2 = 2 * cos * cos - 1, cos3 = cos * (2 * cos2 - 1);
    eT += 0.5 * (V1 * (1 + cos) + V2 * (1 - cos2) + V3 * (1 + cos3));
    if (g && A2 > 1e-12 && B2 > 1e-12) {
      const lG = Math.sqrt(Gx * Gx + Gy * Gy + Gz * Gz);
      const Cx = By * Az - Bz * Ay, Cy = Bz * Ax - Bx * Az, Cz = Bx * Ay - By * Ax;
      const AB = Math.sqrt(A2 * B2);
      const phi = Math.atan2((Cx * Gx + Cy * Gy + Cz * Gz) / (AB * lG), (Ax * Bx + Ay * By + Az * Bz) / AB);
      const dE = 0.5 * (-V1 * Math.sin(phi) + 2 * V2 * Math.sin(2 * phi) - 3 * V3 * Math.sin(3 * phi));
      const FG = Fx * Gx + Fy * Gy + Fz * Gz, HG = Hx * Gx + Hy * Gy + Hz * Gz;
      const a1 = -lG / A2, b4 = lG / B2, a2 = lG / A2 + FG / (A2 * lG), b2 = HG / (B2 * lG), a3 = FG / (A2 * lG), b3 = HG / (B2 * lG) - lG / B2;
      const Av = [Ax, Ay, Az], Bv = [Bx, By, Bz];
      for (let q = 0; q < 3; q++) {
        g[i + q] += dE * a1 * Av[q];
        g[j + q] += dE * (a2 * Av[q] - b2 * Bv[q]);
        g[k + q] += dE * (b3 * Bv[q] - a3 * Av[q]);
        g[l + q] += dE * b4 * Bv[q];
      }
    }
  }

  // Van der Waals (gepuffert 14-7)
  for (let n = 0, m = c.v.length / 2; n < m; n++) {
    const i = 3 * c.v[2 * n], j = 3 * c.v[2 * n + 1];
    const R = c.vp[3 * n], eps = c.vp[3 * n + 1], R7 = c.vp[3 * n + 2];
    const dx = x[i] - x[j], dy = x[i + 1] - x[j + 1], dz = x[i + 2] - x[j + 2];
    const r2 = dx * dx + dy * dy + dz * dz, r = Math.sqrt(r2), r6 = r2 * r2 * r2, r7 = r6 * r;
    const s = r + 0.07 * R, a = 1.07 * R / s, a2 = a * a, a6 = a2 * a2 * a2, a7 = a6 * a;
    const den = r7 + 0.12 * R7, b = 1.12 * R7 / den - 2;
    eV += eps * a7 * b;
    if (g && r > 0) {
      const f = eps * (-7 * a7 / s * b - a7 * 1.12 * R7 * 7 * r6 / (den * den)) / r;
      g[i] += f * dx; g[i + 1] += f * dy; g[i + 2] += f * dz;
      g[j] -= f * dx; g[j + 1] -= f * dy; g[j + 2] -= f * dz;
    }
  }

  // Coulomb (Abstand + 0,05 Å)
  for (let n = 0, m = c.e.length / 2; n < m; n++) {
    const i = 3 * c.e[2 * n], j = 3 * c.e[2 * n + 1], q = c.ep[n];
    const dx = x[i] - x[j], dy = x[i + 1] - x[j + 1], dz = x[i + 2] - x[j + 2];
    const r = Math.sqrt(dx * dx + dy * dy + dz * dz), rc = r + 0.05;
    eE += q / rc;
    if (g && r > 0) {
      const f = -q / (rc * rc) / r;
      g[i] += f * dx; g[i + 1] += f * dy; g[i + 2] += f * dz;
      g[j] -= f * dx; g[j + 1] -= f * dy; g[j + 2] -= f * dz;
    }
  }

  return { total: eB + eA + eS + eO + eT + eV + eE, bond: eB, angle: eA, stbn: eS, oop: eO, tors: eT, vdw: eV, ele: eE };
}
