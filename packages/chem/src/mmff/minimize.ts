// Energieminimierung: BFGS mit Liniensuche (Rückverfolgung mit kubischer Interpolation), Gradient für die Schrittweite
// gedämpft (× 0,1, bei großen Kräften weiter halbiert). Abbruch, wenn sich die Lage kaum mehr ändert oder die Kräfte klein sind.

import type { FF } from "./ff.ts";
import { energy } from "./energy.ts";

const FUNCTOL = 1e-4, MOVETOL = 1e-7, EPS = 3e-8, TOLX = 4 * EPS, MAXSTEP = 100;

function lineSearch(dim: number, old: Float64Array, oldVal: number, grad: Float64Array, dir: Float64Array, out: Float64Array,
  f: (x: Float64Array) => number, maxStep: number): number {
  let sum = 0;
  for (let i = 0; i < dim; i++) sum += dir[i] * dir[i];
  sum = Math.sqrt(sum);
  if (sum > maxStep) for (let i = 0; i < dim; i++) dir[i] *= maxStep / sum;
  let slope = 0;
  for (let i = 0; i < dim; i++) slope += dir[i] * grad[i];
  if (slope >= 0) { out.set(old); return oldVal; }
  let test = 0;
  for (let i = 0; i < dim; i++) test = Math.max(test, Math.abs(dir[i]) / Math.max(Math.abs(old[i]), 1));
  const lambdaMin = MOVETOL / test;
  let lambda = 1, lambda2 = 0, val2 = 0, newVal = oldVal;
  for (let it = 0; it < 1000; it++) {
    if (lambda < lambdaMin) break;
    for (let i = 0; i < dim; i++) out[i] = old[i] + lambda * dir[i];
    newVal = f(out);
    if (newVal - oldVal <= FUNCTOL * lambda * slope) return newVal;
    let tmp: number;
    if (it === 0) tmp = -slope / (2 * (newVal - oldVal - slope));
    else {
      const rhs1 = newVal - oldVal - lambda * slope, rhs2 = val2 - oldVal - lambda2 * slope;
      const a = (rhs1 / (lambda * lambda) - rhs2 / (lambda2 * lambda2)) / (lambda - lambda2);
      const b = (-lambda2 * rhs1 / (lambda * lambda) + lambda * rhs2 / (lambda2 * lambda2)) / (lambda - lambda2);
      if (a === 0) tmp = -slope / (2 * b);
      else {
        const disc = b * b - 3 * a * slope;
        tmp = disc < 0 ? 0.5 * lambda : b <= 0 ? (-b + Math.sqrt(disc)) / (3 * a) : -slope / (b + Math.sqrt(disc));
      }
      if (tmp > 0.5 * lambda) tmp = 0.5 * lambda;
    }
    lambda2 = lambda;
    val2 = newVal;
    lambda = Math.max(tmp, 0.1 * lambda);
  }
  // Schritt zu klein: an der alten Lage bleiben (praktisch am Ziel)
  out.set(old);
  return oldVal;
}

export interface MinResult { x: Float64Array; energy: number; iterations: number; converged: boolean }

/** minimiert die Kraftfeld-Energie ab `x0` (Ångström, Länge 3n) */
export function minimize(ff: FF, x0: ArrayLike<number>, maxIts = 2000, forceTol = 1e-4): MinResult {
  return bfgs(3 * ff.n, x0, (x, g) => energy(ff, x, g).total, maxIts, forceTol);
}

/** BFGS für eine beliebige Funktion f(x, g?) – g wird (falls übergeben) mit dem Gradienten aufaddiert */
export function bfgs(dim: number, x0: ArrayLike<number>, fn: (x: Float64Array, g?: Float64Array) => number, maxIts = 2000, forceTol = 1e-4): MinResult {
  const pos = Float64Array.from(x0);
  if (dim === 0) return { x: pos, energy: 0, iterations: 0, converged: true };
  const f = (x: Float64Array) => fn(x);
  const gradF = (x: Float64Array, g: Float64Array) => {
    g.fill(0);
    fn(x, g);
    let scale = 0.1, maxG = -1e8;
    for (let i = 0; i < dim; i++) { g[i] *= scale; maxG = Math.max(maxG, Math.abs(g[i])); }
    if (maxG > 10) {
      while (maxG * scale > 10) scale *= 0.5;
      for (let i = 0; i < dim; i++) g[i] *= scale;
    }
    return scale;
  };
  const grad = new Float64Array(dim), dGrad = new Float64Array(dim), hdg = new Float64Array(dim), xi = new Float64Array(dim);
  const H = new Float64Array(dim * dim);
  const next = new Float64Array(dim);
  let fp = f(pos);
  gradF(pos, grad);
  let sum = 0;
  for (let i = 0; i < dim; i++) { H[i * dim + i] = 1; xi[i] = -grad[i]; sum += pos[i] * pos[i]; }
  const maxStep = MAXSTEP * Math.max(Math.sqrt(sum), dim);
  for (let iter = 1; iter <= maxIts; iter++) {
    const val = lineSearch(dim, pos, fp, grad, xi, next, f, maxStep);
    fp = val;
    let test = 0;
    for (let i = 0; i < dim; i++) {
      xi[i] = next[i] - pos[i];
      pos[i] = next[i];
      test = Math.max(test, Math.abs(xi[i]) / Math.max(Math.abs(pos[i]), 1));
      dGrad[i] = grad[i];
    }
    if (test < TOLX) return { x: pos, energy: fp, iterations: iter, converged: true };
    const gs = gradF(pos, grad);
    test = 0;
    const term = Math.max(Math.abs(fp) * gs, 1);
    for (let i = 0; i < dim; i++) {
      test = Math.max(test, Math.abs(grad[i]) * Math.max(Math.abs(pos[i]), 1));
      dGrad[i] = grad[i] - dGrad[i];
    }
    if (test / term < forceTol) return { x: pos, energy: fp, iterations: iter, converged: true };
    let fac = 0, fae = 0, sumDG = 0, sumXi = 0;
    for (let i = 0; i < dim; i++) {
      let h = 0;
      const row = i * dim;
      for (let j = 0; j < dim; j++) h += H[row + j] * dGrad[j];
      hdg[i] = h;
      fac += dGrad[i] * xi[i];
      fae += dGrad[i] * h;
      sumDG += dGrad[i] * dGrad[i];
      sumXi += xi[i] * xi[i];
    }
    if (fac > Math.sqrt(EPS * sumDG * sumXi)) {
      fac = 1 / fac;
      const fad = 1 / fae;
      for (let i = 0; i < dim; i++) dGrad[i] = fac * xi[i] - fad * hdg[i];
      for (let i = 0; i < dim; i++) {
        const pxi = fac * xi[i], hdgi = fad * hdg[i], dgi = fae * dGrad[i];
        for (let j = i; j < dim; j++) {
          const v = H[i * dim + j] + pxi * xi[j] - hdgi * hdg[j] + dgi * dGrad[j];
          H[i * dim + j] = v;
          H[j * dim + i] = v;
        }
      }
    }
    for (let i = 0; i < dim; i++) {
      let s = 0;
      const row = i * dim;
      for (let j = 0; j < dim; j++) s -= H[row + j] * grad[j];
      xi[i] = s;
    }
  }
  return { x: pos, energy: fp, iterations: maxIts, converged: false };
}
