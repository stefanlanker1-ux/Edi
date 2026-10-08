// Orbitale für die 3D-Darstellung: wasserstoffähnliche Wellenfunktionen ψ(n, l, m) = R(n, l; Z_eff) · Y(l, m)
// mit effektiver Kernladung nach den Slater-Regeln (Abschirmung durch die übrigen Elektronen).
// Einzelnes Orbital: Grenzfläche, die 90 % der Aufenthaltswahrscheinlichkeit einschließt. Ganzes Atom: alle Orbitale bei
// derselben Elektronendichte |ψ|² (Grenzwert = 90-%-Fläche des äußersten Orbitals) – nur so sind die Größen vergleichbar.
// ψ ist normiert (∫|ψ|² dV = 1). Farbe = Vorzeichen von ψ.
// Längen in Å (Bohr'scher Radius a₀ = 0,529 Å). Reelle Kugelflächenfunktionen (px, py, pz, dxy …).

import { configuration, L_NAMES, type Occupied } from "./config.ts";

export const BOHR_RADIUS = 0.529177;

export interface OrbitalId { n: number; l: number; /** Name der reellen Funktion, z. B. "pz", "dxy", "s" */ m: string }

/** reelle Orbitale je Nebenquantenzahl (Reihenfolge wie in Lehrbüchern üblich) */
export const REAL_M: string[][] = [
  ["s"],
  ["px", "py", "pz"],
  ["dxy", "dxz", "dyz", "dx2-y2", "dz2"],
  ["fz3", "fxz2", "fyz2", "fxyz", "fz(x2-y2)", "fx(x2-3y2)", "fy(3x2-y2)"],
];

/** Anzeigename mit Tiefstellung: 2pz → 2p_z, 3dx2-y2 → 3d_{x²−y²} */
export function orbitalLabel(o: OrbitalId) {
  const sub = o.m === "s" ? "" : o.m.slice(1).replace("x2-y2", "x²−y²").replace("z2", "z²").replace("z3", "z³").replace("x2-3y2", "x²−3y²").replace("3x2-y2", "3x²−y²").replace("xz2", "xz²").replace("yz2", "yz²").replace("(x2-y2)", "(x²−y²)");
  return { main: `${o.n}${L_NAMES[o.l]}`, sub };
}

/** Slater-Gruppen: (1s)(2s,2p)(3s,3p)(3d)(4s,4p)(4d)(4f)(5s,5p)(5d)(5f)(6s,6p)(6d)(7s,7p) */
const groupOf = (n: number, l: number) => (l <= 1 ? `${n}sp` : `${n}${L_NAMES[l]}`);
const GROUP_ORDER = ["1sp", "2sp", "3sp", "3d", "4sp", "4d", "4f", "5sp", "5d", "5f", "6sp", "6d", "7sp"];

/** effektive Kernladung für ein Elektron in (n, l) nach den Slater-Regeln */
export function slaterZeff(Z: number, n: number, l: number, cfg: Occupied[] = configuration(Z)): number {
  const g = groupOf(n, l), gi = GROUP_ORDER.indexOf(g);
  let S = 0;
  for (const o of cfg) {
    const og = groupOf(o.n, o.l), oi = GROUP_ORDER.indexOf(og);
    const count = o.count - (o.n === n && o.l === l ? 1 : 0);
    if (count <= 0) continue;
    if (og === g) S += count * (g === "1sp" ? 0.30 : 0.35);
    else if (oi > gi) continue;
    else if (l >= 2) S += count; // d, f: alles weiter innen schirmt voll ab
    else S += count * (o.n === n - 1 ? 0.85 : o.n < n - 1 ? 1.0 : 1.0);
  }
  return Math.max(1, Z - S);
}

/** verallgemeinertes Laguerre-Polynom L_k^α(x) über die Rekursion */
function laguerre(k: number, a: number, x: number) {
  if (k === 0) return 1;
  let l0 = 1, l1 = 1 + a - x;
  for (let i = 1; i < k; i++) {
    const l2 = ((2 * i + 1 + a - x) * l1 - (i + a) * l0) / (i + 1);
    l0 = l1; l1 = l2;
  }
  return l1;
}

const fact = (k: number) => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f; };

/** normierter Radialteil R(r) (r in Å, Einheit Å^−3/2) */
export function radial(n: number, l: number, Zeff: number, r: number) {
  const k = (2 * Zeff) / (n * BOHR_RADIUS), rho = k * r;
  const norm = Math.sqrt(k * k * k * fact(n - l - 1) / (2 * n * fact(n + l)));
  return norm * Math.pow(rho, l) * Math.exp(-rho / 2) * laguerre(n - l - 1, 2 * l + 1, rho);
}

const PI4 = 4 * Math.PI;
/** normierter Winkelteil: reelle Kugelflächenfunktion als Funktion der Richtung */
export function angular(m: string, x: number, y: number, z: number) {
  const r = Math.hypot(x, y, z) || 1e-12, X = x / r, Y = y / r, Zc = z / r;
  switch (m) {
    case "s": return Math.sqrt(1 / PI4);
    case "px": return Math.sqrt(3 / PI4) * X; case "py": return Math.sqrt(3 / PI4) * Y; case "pz": return Math.sqrt(3 / PI4) * Zc;
    case "dxy": return Math.sqrt(15 / PI4) * X * Y; case "dxz": return Math.sqrt(15 / PI4) * X * Zc; case "dyz": return Math.sqrt(15 / PI4) * Y * Zc;
    case "dx2-y2": return Math.sqrt(15 / (4 * PI4)) * (X * X - Y * Y); case "dz2": return Math.sqrt(5 / (4 * PI4)) * (3 * Zc * Zc - 1);
    case "fz3": return Math.sqrt(7 / (4 * PI4)) * Zc * (5 * Zc * Zc - 3);
    case "fxz2": return Math.sqrt(21 / (8 * PI4)) * X * (5 * Zc * Zc - 1); case "fyz2": return Math.sqrt(21 / (8 * PI4)) * Y * (5 * Zc * Zc - 1);
    case "fxyz": return Math.sqrt(105 / PI4) * X * Y * Zc; case "fz(x2-y2)": return Math.sqrt(105 / (4 * PI4)) * Zc * (X * X - Y * Y);
    case "fx(x2-3y2)": return Math.sqrt(35 / (8 * PI4)) * X * (X * X - 3 * Y * Y); case "fy(3x2-y2)": return Math.sqrt(35 / (8 * PI4)) * Y * (3 * X * X - Y * Y);
  }
  return 0;
}

/** ψ(x, y, z) eines Orbitals (normiert, Å^−3/2) */
export const psi = (o: OrbitalId, Zeff: number, x: number, y: number, z: number) => radial(o.n, o.l, Zeff, Math.hypot(x, y, z)) * angular(o.m, x, y, z);

/** Abstand, innerhalb dessen 99,5 % der radialen Aufenthaltswahrscheinlichkeit liegen (Å) – Größe des Rechenwürfels */
export function extent(n: number, l: number, Zeff: number) {
  const step = 0.01, pts: number[] = [];
  let total = 0;
  for (let r = step / 2; r < 60; r += step) { const R = radial(n, l, Zeff, r); const p = r * r * R * R; pts.push(p); total += p; if (r > 4 * n * n * BOHR_RADIUS / Zeff && p < total * 1e-9) break; }
  let acc = 0;
  for (let i = 0; i < pts.length; i++) { acc += pts[i]; if (acc >= 0.995 * total) return (i + 1) * step; }
  return pts.length * step;
}

export interface OrbitalGrid {
  /** Werte von ψ auf einem Würfelgitter res³ (Index z·res² + y·res + x), Würfel von −half bis +half (Å) */
  psi: Float32Array; res: number; half: number;
  /** |ψ| an der Fläche, die `share` der Aufenthaltswahrscheinlichkeit einschließt */
  iso: number;
}

/** ψ auf einem Gitter und der Grenzwert für die 90-%-Fläche (oder ein vorgegebener Grenzwert `iso`, dann reicht der Würfel bis dorthin) */
export function orbitalGrid(o: OrbitalId, Zeff: number, res = 48, share = 0.9, iso?: number): OrbitalGrid {
  let half = extent(o.n, o.l, Zeff) * 1.05;
  if (iso !== undefined) half = Math.max(0.3, reachOf(o, Zeff, iso) * 1.12);
  const psi = new Float32Array(res * res * res);
  const d = (2 * half) / (res - 1);
  const dens: number[] = new Array(psi.length);
  let total = 0;
  for (let k = 0; k < res; k++) {
    const z = -half + k * d;
    for (let j = 0; j < res; j++) {
      const y = -half + j * d;
      for (let i = 0; i < res; i++) {
        const x = -half + i * d;
        const r = Math.hypot(x, y, z);
        const v = radial(o.n, o.l, Zeff, r) * angular(o.m, x, y, z);
        const idx = k * res * res + j * res + i;
        psi[idx] = v;
        dens[idx] = v * v;
        total += v * v;
      }
    }
  }
  if (iso !== undefined) return { psi, res, half, iso };
  const sorted = Float64Array.from(dens).sort().reverse();
  let acc = 0, own = 0;
  for (const p of sorted) { acc += p; if (acc >= share * total) { own = Math.sqrt(p); break; } }
  return { psi, res, half, iso: own };
}

/** größter Abstand vom Kern, an dem |ψ| den Wert `iso` erreicht (Suche entlang vieler Richtungen) */
export function reachOf(o: OrbitalId, Zeff: number, iso: number) {
  let best = 0;
  const dirs: [number, number, number][] = [];
  for (let i = 0; i < 200; i++) { const t = Math.acos(1 - (2 * (i + 0.5)) / 200), f = i * 2.39996; dirs.push([Math.sin(t) * Math.cos(f), Math.sin(t) * Math.sin(f), Math.cos(t)]); }
  dirs.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [Math.SQRT1_2, Math.SQRT1_2, 0], [Math.SQRT1_2, 0, Math.SQRT1_2], [0, Math.SQRT1_2, Math.SQRT1_2]);
  const far = extent(o.n, o.l, Zeff) * 2;
  for (const [x, y, z] of dirs) for (let r = far; r > 0; r -= far / 400) if (Math.abs(psi(o, Zeff, x * r, y * r, z * r)) >= iso) { best = Math.max(best, r); break; }
  return best;
}

/** gemeinsamer Grenzwert |ψ| für ein ganzes Atom: 90-%-Fläche des äußersten besetzten Orbitals */
export function atomIso(orbs: AtomOrbital[], res = 40) {
  const outer = [...orbs].sort((a, b) => b.n - a.n || a.l - b.l)[0];
  return orbitalGrid(outer, outer.Zeff, res).iso;
}

export interface AtomOrbital extends OrbitalId { electrons: number; Zeff: number }

/** besetzte Orbitale eines Atoms/Ions (reelle Orbitale, Elektronen nach Hund verteilt) */
export function occupiedOrbitals(Z: number, E = Z): AtomOrbital[] {
  const cfg = configuration(Z, E);
  const out: AtomOrbital[] = [];
  for (const o of cfg) {
    if (!o.count) continue;
    const ms = REAL_M[o.l], k = ms.length;
    const per = ms.map((_, i) => (o.count >= k + i + 1 ? 2 : o.count > i ? 1 : 0));
    const Zeff = slaterZeff(Z, o.n, o.l, cfg);
    ms.forEach((m, i) => { if (per[i]) out.push({ n: o.n, l: o.l, m, electrons: per[i], Zeff }); });
  }
  return out;
}
