// MMFF94-Parameter nachschlagen. Tabellen werden beim ersten Zugriff aus data.ts gelesen.
// Schlüssel sind Zahlenfolgen; fehlt ein Eintrag, greifen die Ersatztypen (Def) bzw. die empirischen Regeln (rules.ts).

import * as D from "./data.ts";

export interface Prop { atno: number; crd: number; val: number; pilp: number; mltb: number; arom: number; linh: number; sbmb: number }
export interface Bond { kb: number; r0: number }
export interface Angle { ka: number; theta0: number }
export interface Stbn { kbaIJK: number; kbaKJI: number }
export interface Tor { V1: number; V2: number; V3: number }
export interface VdW { alpha: number; N: number; A: number; G: number; DA: string; Rstar: number }

const rows = (s: string) => s.split("\n").map(l => l.split(" "));
const key = (...n: number[]) => n.join(",");

/** bei doppelten Schlüsseln gilt der erste Eintrag der Tabelle */
function table<T>(s: string, nKey: number, make: (r: string[]) => T) {
  const m = new Map<string, T>();
  for (const r of rows(s)) {
    const k = r.slice(0, nKey).join(",");
    if (!m.has(k)) m.set(k, make(r));
  }
  return m;
}

interface Tables {
  def: Map<number, number[]>; prop: Map<number, Prop>; pbci: Map<number, { pbci: number; fcadj: number }>;
  chg: Map<string, number>; bond: Map<string, Bond>; bndk: Map<string, { r0: number; kb: number }>;
  hl: Map<string, { a: number; d: number; dp: number }>; covRad: Map<number, { r0: number; chi: number }>;
  angle: Map<string, Angle>; stbn: Map<string, Stbn>; dfsb: Map<string, Stbn>; oop: Map<string, number>;
  tor: Map<string, Tor>; vdw: Map<number, VdW>; vdwPower: number; vdwB: number; vdwBeta: number; DARAD: number; DAEPS: number;
}

let T: Tables | null = null;

function load(): Tables {
  const num = Number;
  const def = new Map<number, number[]>();
  for (const r of rows(D.DEF)) if (!def.has(num(r[0]))) def.set(num(r[0]), r.slice(1, 5).map(num));
  const prop = new Map<number, Prop>();
  for (const r of rows(D.PROP)) {
    const [t, atno, crd, val, pilp, mltb, arom, linh, sbmb] = r.map(num);
    prop.set(t, { atno, crd, val, pilp, mltb, arom, linh, sbmb });
  }
  const pbci = new Map<number, { pbci: number; fcadj: number }>();
  for (const r of rows(D.PBCI)) pbci.set(num(r[0]), { pbci: num(r[1]), fcadj: num(r[2]) });
  const vdwRows = rows(D.VDW);
  const [vdwPower, vdwB, vdwBeta, DARAD, DAEPS] = vdwRows[0].map(num);
  const vdw = new Map<number, VdW>();
  for (const r of vdwRows.slice(1)) {
    const alpha = num(r[1]), A = num(r[3]);
    vdw.set(num(r[0]), { alpha, N: num(r[2]), A, G: num(r[4]), DA: r[5], Rstar: A * Math.pow(alpha, vdwPower) });
  }
  const covRad = new Map<number, { r0: number; chi: number }>();
  for (const r of rows(D.COVRAD)) covRad.set(num(r[0]), { r0: num(r[1]), chi: num(r[2]) });
  return {
    def, prop, pbci, vdw, covRad, vdwPower, vdwB, vdwBeta, DARAD, DAEPS,
    // Bindungs-Ladungsinkremente: Schlüssel Bindungstyp, Typ i, Typ j
    chg: table(D.CHG, 3, r => num(r[3])),
    bond: table(D.BOND, 3, r => ({ kb: num(r[3]), r0: num(r[4]) })),
    bndk: table(D.BNDK, 2, r => ({ r0: num(r[2]), kb: num(r[3]) })),
    hl: table(D.HL, 2, r => ({ a: num(r[2]), d: num(r[3]), dp: num(r[4]) })),
    angle: table(D.ANGLE, 4, r => ({ ka: num(r[4]), theta0: num(r[5]) })),
    stbn: table(D.STBN, 4, r => ({ kbaIJK: num(r[4]), kbaKJI: num(r[5]) })),
    dfsb: table(D.DFSB, 3, r => ({ kbaIJK: num(r[3]), kbaKJI: num(r[4]) })),
    oop: table(D.OOP, 4, r => num(r[4])),
    tor: table(D.TOR, 5, r => ({ V1: num(r[5]), V2: num(r[6]), V3: num(r[7]) })),
  };
}

export const P = (): Tables => (T ??= load());

export const isAromaticType = (t: number) => [37, 38, 39, 44, 58, 59, 63, 64, 65, 66, 69, 76, 78, 79, 80, 81, 82].includes(t);
const eq = (t: number, level: number) => P().def.get(t)?.[level] ?? 0;

/** Bindungs-Ladungsinkrement: [Vorzeichen, bci] oder null */
export function chgParams(bondType: number, i: number, j: number): [number, number] | null {
  let sign = -1, a = i, b = j;
  if (i > j) { a = j; b = i; sign = 1; }
  const v = P().chg.get(key(bondType, a, b));
  return v === undefined ? null : [sign, v];
}

export function bondParams(bondType: number, i: number, j: number): Bond | null {
  return P().bond.get(i <= j ? key(bondType, i, j) : key(bondType, j, i)) ?? null;
}

export function bndkParams(z1: number, z2: number) {
  return P().bndk.get(z1 <= z2 ? key(z1, z2) : key(z2, z1)) ?? null;
}

export function hlParams(r1: number, r2: number) {
  return P().hl.get(r1 <= r2 ? key(r1, r2) : key(r2, r1)) ?? null;
}

/** Winkel: Ersatztypen der äußeren Atome Stufe für Stufe */
export function angleParams(angleType: number, i: number, j: number, k: number): Angle | null {
  for (let it = 0; it < 4; it++) {
    let a = eq(i, it), c = eq(k, it);
    if (a > c) [a, c] = [c, a];
    const v = P().angle.get(key(angleType, a, j, c));
    if (v) return v;
  }
  return null;
}

/** Streck-Biege-Kopplung: [vertauscht, Parameter] */
export function stbnParams(sbType: number, bt1: number, bt2: number, i: number, j: number, k: number): [boolean, Stbn | null] {
  let swap = false, a = i, c = k;
  if (i > k) { a = k; c = i; swap = true; }
  else if (i === k) swap = bt1 < bt2;
  return [swap, P().stbn.get(key(sbType, a, j, c)) ?? null];
}

export function dfsbParams(r1: number, r2: number, r3: number): [boolean, Stbn | null] {
  let swap = false, a = r1, c = r3;
  if (r1 > r3) { a = r3; c = r1; swap = true; }
  return [swap, P().dfsb.get(key(a, r2, c)) ?? null];
}

export function oopParams(i: number, j: number, k: number, l: number): number | null {
  for (let it = 0; it < 4; it++) {
    const s = [eq(i, it), eq(k, it), eq(l, it)].sort((x, y) => x - y);
    const v = P().oop.get(key(s[0], j, s[1], s[2]));
    if (v !== undefined) return v;
  }
  return null;
}

/** Torsion: Suche mit Platzhaltern für die Endatome; bei Typ 5 (Fünfring) zweiter Durchgang mit dem gewöhnlichen Typ */
export function torParams(torType: [number, number], i: number, j: number, k: number, l: number): [number, Tor | null] {
  let res: Tor | null = null;
  let iter = 0, maxIter = 5, canTorType = torType[0];
  while ((iter < maxIter && (!res || maxIter === 4)) || (iter === 4 && torType[0] === 5 && torType[1])) {
    if (maxIter === 5 && iter === 4) { maxIter = 4; iter = 0; canTorType = torType[1]; }
    let iW = iter, lW = iter;
    if (iter === 1) { iW = 1; lW = 3; } else if (iter === 2) { iW = 3; lW = 1; }
    let ci = eq(i, iW), cj = j, ck = k, cl = eq(l, lW);
    if (cj > ck) { [cj, ck] = [ck, cj]; [ci, cl] = [cl, ci]; }
    else if (cj === ck && ci > cl) [ci, cl] = [cl, ci];
    const v = P().tor.get(key(canTorType, ci, cj, ck, cl));
    if (v) { res = v; if (maxIter === 4) break; }
    iter++;
  }
  return [canTorType, res];
}
