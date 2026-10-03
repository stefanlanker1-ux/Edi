// MMFF94-Atomtypen (schwere Atome, dann H) und Partialladungen (Formalladungen verteilt, Bindungs-Ladungsinkremente).

import { AROMATIC, type Mol } from "./mol.ts";
import { chgParams, P } from "./params.ts";

const SINGLE = 1, DOUBLE = 2, TRIPLE = 3;

export class Rings {
  constructor(private m: Mol) {}
  aromRing(r: number[]) {
    for (let i = 0; i < r.length - 1; i++) if (this.m.bond(r[i], r[i + 1]) !== AROMATIC) return false;
    return true;
  }
  inAromOfSize(a: number, size: number) { return this.m.rings.some(r => r.length === size && r.includes(a) && this.aromRing(r)); }
  sameRingOfSize(size: number, ...atoms: number[]) { return this.m.rings.some(r => r.length === size && atoms.every(a => r.includes(a))); }
  sameAromRing(a: number, b: number) { return this.m.rings.some(r => r.includes(a) && r.includes(b) && this.aromRing(r)); }
}

function isNOxide(m: Mol, a: number) {
  return m.z[a] === 7 && m.deg(a) >= 3 && m.nbrs[a].some(n => m.z[n] === 8 && m.deg(n) === 1);
}

function heavyType(m: Mol, R: Rings, atom: number): number {
  let t = 0;
  const nbrs = m.nbrs[atom], Z = m.z[atom];
  const alphaHet: number[] = [], betaHet: number[] = [];
  let isAlphaOS = false, isBetaOS = false, alphaOrBetaInSameRing = false;
  const het5 = (x: number) => m.z[x] === 8 || m.z[x] === 16 || (m.z[x] === 7 && m.deg(x) === 3 && !isNOxide(m, x));

  if (m.arom[atom]) {
    if (R.inAromOfSize(atom, 5)) {
      if (Z === 6 || Z === 7) {
        for (const nb of nbrs) {
          if (!R.inAromOfSize(nb, 5)) continue;
          if (R.sameRingOfSize(5, atom, nb) && het5(nb)) alphaHet.push(nb);
          for (const nb2 of m.nbrs[nb]) {
            if (nb2 === atom || !R.inAromOfSize(nb2, 5)) continue;
            if (R.sameRingOfSize(5, atom, nb2) && het5(nb2)) betaHet.push(nb2);
          }
        }
        isAlphaOS = alphaHet.some(x => m.z[x] === 8 || m.z[x] === 16);
        isBetaOS = betaHet.some(x => m.z[x] === 8 || m.z[x] === 16);
        if (alphaHet.length && betaHet.length)
          alphaOrBetaInSameRing = alphaHet.some(a => betaHet.some(b => R.sameRingOfSize(5, a, b)));
      }
      switch (Z) {
        case 6: {
          if (!betaHet.length) {
            let nN = 0, nFC = 0, n5 = 0, n6 = 0;
            for (const nb of nbrs) {
              if (m.z[nb] === 7 && m.deg(nb) === 3) {
                nN++;
                if (m.q[nb] > 0 && !isNOxide(m, nb)) nFC++;
                if (R.inAromOfSize(nb, 5)) n5++;
                if (R.inAromOfSize(nb, 6)) n6++;
              }
            }
            if ((((nN === 2) && n5) || ((nN === 3) && n5 === 2)) && nFC && !n6) { t = 80; break; }
          }
          if (alphaHet.length === betaHet.length) {
            let byBenzeneC = true, byArom = true;
            for (const nb of nbrs) {
              if (m.z[nb] !== 6 || !m.inRingOfSize(nb, 6)) byBenzeneC = false;
              if (R.sameRingOfSize(5, atom, nb) && !m.arom[nb]) byArom = false;
            }
            if ((!alphaHet.length && !betaHet.length && !byBenzeneC && byArom) ||
              (alphaHet.length && betaHet.length && (!alphaOrBetaInSameRing || (!isAlphaOS && !isBetaOS)))) { t = 78; break; }
          }
          if (alphaHet.length && (!betaHet.length || isAlphaOS)) { t = 63; break; }
          if (betaHet.length && (!alphaHet.length || isBetaOS)) { t = 64; break; }
          break;
        }
        case 7:
          if (isNOxide(m, atom)) { t = 82; break; }
          if (!alphaHet.length && !betaHet.length) { t = m.deg(atom) === 3 ? 39 : 76; break; }
          if (m.deg(atom) === 3 && alphaHet.length !== betaHet.length) { t = 81; break; }
          if (alphaHet.length && (!betaHet.length || isAlphaOS)) { t = 65; break; }
          if (betaHet.length && (!alphaHet.length || isBetaOS)) { t = 66; break; }
          if (alphaHet.length && betaHet.length) { t = 79; break; }
          break;
        case 8: t = 59; break;
        case 16: t = 44; break;
      }
    }
    if (!t && R.inAromOfSize(atom, 6)) {
      if (Z === 6) t = 37;
      else if (Z === 7) t = isNOxide(m, atom) ? 69 : m.deg(atom) === 3 ? 58 : 38;
    }
  }
  if (t) return t;

  const deg = m.deg(atom), val = m.valence(atom);
  switch (Z) {
    case 3: return deg === 0 ? 92 : 0;
    case 6: {
      if (deg === 4) return m.inRingOfSize(atom, 3) ? 22 : m.inRingOfSize(atom, 4) ? 20 : 1;
      if (deg === 3) {
        let nN2 = 0, nN3 = 0, nO = 0, nS = 0, dbl = 0;
        for (const nb of nbrs) {
          if (m.bond(nb, atom) === DOUBLE) dbl = m.z[nb];
          if (m.deg(nb) === 1) { if (m.z[nb] === 8) nO++; else if (m.z[nb] === 16) nS++; }
          else if (m.z[nb] === 7) {
            if (m.deg(nb) === 3) nN3++;
            else if (m.deg(nb) === 2 && m.bond(nb, atom) === DOUBLE) nN2++;
          }
        }
        if (nN3 >= 2 && !nN2 && dbl === 7) return 57;
        if (nO === 2 || nS === 2) return 41;
        if (m.inRingOfSize(atom, 4) && dbl === 6) return 30;
        if (dbl === 7 || dbl === 8 || dbl === 15 || dbl === 16) return 3;
        return 2;
      }
      if (deg === 2) return 4;
      if (deg === 1) return 60;
      return 0;
    }
    case 7: return nitrogenType(m, R, atom);
    case 8: {
      if (deg === 3) return 49;
      if (deg === 2) {
        if (val === 3) return 51;
        const nH = nbrs.filter(nb => m.z[nb] === 1).length;
        return nH === 2 ? 70 : 6;
      }
      if (deg <= 1) {
        let nN = 0, nO = 0, nS = 0;
        let toH = false, carboxylate = false, carbonyl = false, oxideC = false, nitroso = false, oxideN = false, nOxide = false,
          nitro = false, thioSulfinate = false, sulfate = false, sulfoxide = false, phosphate = false;
        for (const nb of nbrs) {
          if (oxideC || oxideN || toH || carboxylate || nitro || nOxide || thioSulfinate || sulfate || phosphate || carbonyl || nitroso || sulfoxide) break;
          const bo = m.bond(atom, nb), zn = m.z[nb];
          if (zn === 6 || zn === 7 || zn === 16) {
            for (const nb2 of m.nbrs[nb]) {
              if (m.z[nb2] === 7 && m.deg(nb2) === 2) nN++;
              if (m.z[nb2] === 8 && m.deg(nb2) === 1) nO++;
              if (m.z[nb2] === 16 && m.deg(nb2) === 1) nS++;
            }
          }
          toH = zn === 1;
          if (zn === 6) { carboxylate = nO === 2; carbonyl = bo === DOUBLE; oxideC = bo === SINGLE && nO === 1; }
          if (zn === 7) {
            nitroso = bo === DOUBLE;
            if (bo === SINGLE && nO === 1) { oxideN = m.deg(nb) === 2 || m.valence(nb) === 3; nOxide = m.valence(nb) === 4; }
            nitro = nO >= 2;
          }
          if (zn === 16) {
            thioSulfinate = nS === 1;
            sulfate = bo === SINGLE || (bo === DOUBLE && nO + nN > 1);
            sulfoxide = bo === DOUBLE && nO + nN === 1;
          }
          phosphate = zn === 15 || zn === 17;
        }
        if (oxideC || oxideN || toH) return 35;
        if (carboxylate || nitro || nOxide || thioSulfinate || sulfate || phosphate) return 32;
        if (carbonyl || nitroso || sulfoxide) return 7;
      }
      return 0;
    }
    case 9: return deg === 1 ? 11 : deg === 0 ? 89 : 0;
    case 11: return deg === 0 ? 93 : 0;
    case 12: return deg === 0 ? 99 : 0;
    case 14: return 19;
    case 15: return deg === 4 ? 25 : deg === 3 ? 26 : deg === 2 ? 75 : 0;
    case 16: {
      if (deg === 3 || deg === 4) {
        let nOorN = 0, nS = 0, cDbl = false;
        for (const nb of nbrs) {
          if (m.z[nb] === 6 && m.bond(atom, nb) === DOUBLE) cDbl = true;
          if ((m.deg(nb) === 1 && m.z[nb] === 8) || (m.deg(nb) === 2 && m.z[nb] === 7)) nOorN++;
          if (m.deg(nb) === 1 && m.z[nb] === 16) nS++;
        }
        if ((deg === 3 && nOorN === 2 && cDbl) || deg === 4) return 18;
        if ((nOorN && nS) || (nOorN === 2 && !cDbl)) return 73;
        return 17;
      }
      if (deg === 2) return nbrs.some(nb => m.z[nb] === 8 && m.bond(atom, nb) === DOUBLE) ? 74 : 15;
      if (deg === 1) {
        let nTermS = 0, cDbl = false;
        for (const nb of nbrs) {
          for (const nb2 of m.nbrs[nb]) if (m.z[nb2] === 16 && m.deg(nb2) === 1) nTermS++;
          if (m.z[nb] === 6 && m.bond(atom, nb) === DOUBLE) cDbl = true;
        }
        return cDbl && nTermS !== 2 ? 16 : 72;
      }
      return 0;
    }
    case 17: {
      if (deg === 4 && nbrs.filter(nb => m.z[nb] === 8).length === 4) return 77;
      return deg === 1 ? 12 : deg === 0 ? 90 : 0;
    }
    case 19: return deg === 0 ? 94 : 0;
    case 20: return deg === 0 ? 96 : 0;
    case 26: return deg === 0 ? (m.q[atom] === 2 ? 87 : m.q[atom] === 3 ? 88 : 0) : 0;
    case 29: return deg === 0 ? (m.q[atom] === 1 ? 97 : m.q[atom] === 2 ? 98 : 0) : 0;
    case 30: return deg === 0 ? 95 : 0;
    case 35: return deg === 1 ? 13 : deg === 0 ? 91 : 0;
    case 53: return deg === 1 ? 14 : 0;
  }
  return 0;
}

function nitrogenType(m: Mol, R: Rings, atom: number): number {
  const nbrs = m.nbrs[atom], deg = m.deg(atom), val = m.valence(atom);
  let nTermO = 0, nso2 = false;
  for (const nb of nbrs) {
    if (m.z[nb] === 8 && m.deg(nb) === 1) nTermO++;
    if (val >= 3 && (m.z[nb] === 15 || m.z[nb] === 16)) {
      const nO = m.nbrs[nb].filter(x => m.z[x] === 8 && m.deg(x) === 1).length;
      if (!nso2) nso2 = nO >= 2;
    }
  }
  if (deg === 4) return isNOxide(m, atom) ? 68 : 34;
  if (deg === 3) {
    if (val >= 4) {
      let dblCN = false;
      for (const nb of nbrs) {
        if (m.bond(nb, atom) === DOUBLE) {
          dblCN = m.z[nb] === 7 || m.z[nb] === 6;
          if (m.z[nb] === 6) {
            for (const nb2 of m.nbrs[nb]) {
              if (!dblCN) break;
              if (nb2 === atom) continue;
              dblCN = !(m.z[nb2] === 7 && m.deg(nb2) === 3);
            }
          }
        }
      }
      if (nTermO === 1) return 67;
      if (nTermO >= 2) return 45;
      if (dblCN) return 54;
    }
    if (val >= 3) {
      let NCO = false, NCNplus = false, NGDplus = false, NNN = false, nbrC = false, nbrBenzC = false;
      let dblToC = 0, triToC = 0, nObC = 0, nSbC = 0;
      for (const nb of nbrs) {
        if (m.z[nb] === 6) {
          nbrC = true;
          if (m.arom[nb] && m.inRingOfSize(nb, 6)) nbrBenzC = true;
          let nN2 = 0, nN3 = 0, nFC = 0, n6 = 0;
          nObC = 0; nSbC = 0;
          for (const nb2 of m.nbrs[nb]) {
            const bo = m.bond(nb, nb2);
            if (bo === DOUBLE && (m.z[nb2] === 8 || m.z[nb2] === 16)) NCO = true;
            if (bo === DOUBLE || (bo === AROMATIC && (m.z[nb2] === 6 || (m.z[nb2] === 7 && m.numRings(nb2) === 1)))) dblToC = m.z[nb2];
            if (bo === TRIPLE) triToC = m.z[nb2];
            if (m.z[nb2] === 7 && m.deg(nb2) === 3) {
              if (m.q[nb2] === 1) nFC++;
              if (R.inAromOfSize(nb, 6)) n6++;
              const nO3 = m.nbrs[nb2].filter(x => m.z[x] === 8).length;
              if (nO3 < 2) nN3++;
            }
            if (m.z[nb2] === 7 && m.deg(nb2) === 2 && (bo === DOUBLE || bo === AROMATIC)) nN2++;
            if (m.arom[nb2]) { if (m.z[nb2] === 8) nObC++; if (m.z[nb2] === 16) nSbC++; }
          }
          if (dblToC === 7) {
            if (nN3 === 2 && !nN2 && nFC && !n6 && m.deg(nb) < 4) NCNplus = true;
            if (nN3 === 3) NGDplus = true;
          }
        }
        if (m.z[nb] === 7) {
          let nN = 0, nO = 0, nS = 0;
          for (const nb2 of m.nbrs[nb]) {
            if (m.bond(nb, nb2) !== DOUBLE) continue;
            if (m.z[nb2] === 6) {
              for (const nb3 of m.nbrs[nb2]) {
                if (nb3 === nb) continue;
                if (m.z[nb3] === 7) nN++; else if (m.z[nb3] === 8) nO++; else if (m.z[nb3] === 16) nS++;
              }
              if (!nO && !nS && !nN && !nbrBenzC) NNN = true;
            }
            if (m.z[nb2] === 7 && !nbrBenzC) NNN = true;
          }
        }
      }
      if (nbrC) {
        if (triToC === 7) nso2 = true;
        if (NCNplus) return 55;
        if (NGDplus) return 56;
        if (!NCO && !nso2 && ((!nObC && !nSbC && nbrBenzC) || dblToC === 6 || dblToC === 7 || dblToC === 15 || triToC === 6)) return 40;
      }
      if (!nso2 && (NCO || NNN)) return 10;
    }
  }
  if (deg === 2) {
    if (val === 4) return nbrs.some(nb => m.bond(atom, nb) === TRIPLE) ? 61 : 53;
    if (val === 3) {
      let nitroso = false, imine = false;
      for (const nb of nbrs) {
        if (m.bond(atom, nb) === DOUBLE) {
          nitroso = m.z[nb] === 8 && nTermO === 1;
          imine = m.z[nb] === 6 || m.z[nb] === 7;
        }
      }
      if (nitroso && !imine) return 46;
      if (imine) return 9;
    }
    if (val >= 2) {
      let nso = false;
      for (const nb of nbrs) {
        if (nso) break;
        if (m.z[nb] === 16) nso = m.nbrs[nb].filter(x => m.z[x] === 8 && m.deg(x) === 1).length === 1;
      }
      if (nso) return 48;
      if (!nso2) return 62;
    }
  }
  if (nso2) return 43;
  if (deg === 1) {
    let nsp = false, nazt = false;
    for (const nb of nbrs) {
      if (nsp || nazt) break;
      nsp = m.bond(atom, nb) === TRIPLE;
      if (m.z[nb] === 7 && m.deg(nb) === 2) {
        for (const nb2 of m.nbrs[nb]) {
          if (nazt) break;
          nazt = (m.z[nb2] === 7 && m.deg(nb2) === 2) || (m.z[nb2] === 6 && m.deg(nb2) === 3);
        }
      }
    }
    if (nsp) return 42;
    if (nazt) return 47;
  }
  return 8;
}

function hydrogenType(m: Mol, atom: number, types: number[]): number {
  let t = 0;
  for (const nb of m.nbrs[atom]) {
    switch (m.z[nb]) {
      case 6: case 14: t = 5; break;
      case 7: {
        const nt = types[nb];
        t = [8, 39, 62, 67, 68].includes(nt) ? 23 : [34, 54, 55, 56, 58, 81].includes(nt) ? 36 : nt === 9 ? 27 : 28;
        break;
      }
      case 8: {
        const ot = types[nb];
        if (ot === 49) { t = 50; break; }
        if (ot === 51) { t = 52; break; }
        if (ot === 70) { t = 31; break; }
        if (ot === 6) {
          let HOCC = false, HOCO = false, HOP = false, HOS = false;
          for (const nb2 of m.nbrs[nb]) {
            if (m.z[nb2] === 6) {
              for (const nb3 of m.nbrs[nb2]) {
                if (nb3 === nb) continue;
                const bo = m.bond(nb2, nb3);
                if ((m.z[nb3] === 6 || m.z[nb3] === 7) && (bo === DOUBLE || bo === AROMATIC)) HOCC = true;
                if (m.z[nb3] === 8 && bo === DOUBLE) HOCO = true;
              }
            }
            if (m.z[nb2] === 15) HOP = true;
            if (m.z[nb2] === 16) HOS = true;
          }
          if (HOCO || HOP) { t = 24; break; }
          if (HOCC) { t = 29; break; }
          if (HOS) { t = 33; break; }
        }
        t = 21;
        break;
      }
      case 15: case 16: t = 71; break;
    }
  }
  return t;
}

/** MMFF-Bindungstyp: 1 = Einfachbindung zwischen zwei Atomen mit Mehrfachbindungs- bzw. Aromatenkennung */
export function bondType(m: Mol, types: number[], a: number, b: number) {
  const pa = P().prop.get(types[a])!, pb = P().prop.get(types[b])!;
  return m.bond(a, b) === SINGLE && ((pa.sbmb && pb.sbmb) || (pa.arom && pb.arom)) ? 1 : 0;
}

export interface Typed { mol: Mol; rings: Rings; types: number[]; fcharge: number[]; charge: number[] }

/** Atomtypen und Ladungen; null, wenn ein Atom keinen MMFF-Typ hat */
export function typeMolecule(m: Mol): Typed | null {
  const R = new Rings(m);
  const types = new Array(m.n).fill(0);
  for (let a = 0; a < m.n; a++) if (m.z[a] !== 1) types[a] = heavyType(m, R, a);
  for (let a = 0; a < m.n; a++) if (m.z[a] === 1) types[a] = hydrogenType(m, a, types);
  if (types.some(t => !t)) return null;
  const fcharge = formalCharges(m, types);
  const charge = partialCharges(m, types, fcharge);
  return { mol: m, rings: R, types, fcharge, charge };
}

function formalCharges(m: Mol, types: number[]) {
  const f = new Array(m.n).fill(0);
  for (let a = 0; a < m.n; a++) {
    const t = types[a];
    let fc = 0;
    switch (t) {
      case 32: case 72:
        for (const nb of m.nbrs[a]) {
          const nt = types[nb];
          let nSecN = 0, nTerm = 0;
          for (const nb2 of m.nbrs[nb]) {
            if (m.z[nb2] === 7 && m.deg(nb2) === 2 && !m.arom[nb2]) nSecN++;
            if ((m.z[nb2] === 8 || m.z[nb2] === 16) && m.deg(nb2) === 1) nTerm++;
          }
          if (m.z[nb] === 16 && nTerm === 2 && nSecN === 1) nSecN = 0;
          if (m.z[nb] === 6 && nTerm) { fc = nTerm === 1 ? -1 : -(nTerm - 1) / nTerm; break; }
          if (nt === 45 && nTerm === 3) { fc = -1 / 3; break; }
          if (nt === 25 && nTerm) { fc = nTerm === 1 ? 0 : -(nTerm - 1) / nTerm; break; }
          if (nt === 18 && nTerm) { fc = nSecN + nTerm === 2 ? 0 : -(nSecN + nTerm - 2) / nTerm; break; }
          if (nt === 73 && nTerm) { fc = nTerm === 1 ? 0 : -(nTerm - 1) / nTerm; break; }
          if (nt === 77 && nTerm) { fc = -1 / nTerm; break; }
        }
        break;
      case 76: {
        const ring = m.rings.find(r => r.includes(a));
        if (ring) {
          const n76 = ring.filter(x => types[x] === 76).length;
          if (n76) fc = -1 / n76;
        }
        break;
      }
      case 55: case 56: case 81: {
        fc = m.q[a];
        let nConj = 1, old = 0;
        const conj = new Array(m.n).fill(false);
        conj[a] = true;
        while (nConj > old) {
          old = nConj;
          for (let i = 0; i < m.n; i++) {
            if (!conj[i]) continue;
            for (const nb of m.nbrs[i]) {
              if (types[nb] !== 57 && types[nb] !== 80) continue;
              for (const nb2 of m.nbrs[nb]) {
                const t2 = types[nb2];
                if (t2 !== 55 && t2 !== 56 && t2 !== 81) continue;
                if (!conj[nb2]) { conj[nb2] = true; fc += m.q[nb2]; nConj++; }
              }
            }
          }
        }
        fc /= nConj;
        break;
      }
      case 61:
        if (m.nbrs[a].some(nb => types[nb] === 42)) fc = 1;
        break;
      case 34: case 49: case 51: case 54: case 58: case 92: case 93: case 94: case 97: fc = 1; break;
      case 87: case 95: case 96: case 98: case 99: fc = 2; break;
      case 88: fc = 3; break;
      case 35: case 62: case 89: case 90: case 91: fc = -1; break;
    }
    f[a] = fc;
  }
  return f;
}

const isZero = (x: number) => Math.abs(x) < 1e-10;

function partialCharges(m: Mol, types: number[], f: number[]) {
  const out = new Array(m.n).fill(0);
  const T = P();
  for (let a = 0; a < m.n; a++) {
    const t = types[a];
    let q0 = f[a];
    const M = T.prop.get(t)!.crd, v = T.pbci.get(t)!.fcadj;
    let sumF = 0, sumP = 0;
    if (isZero(v)) for (const nb of m.nbrs[a]) if (f[nb] < 0) q0 += f[nb] / (2 * m.deg(nb));
    if (t === 62) for (const nb of m.nbrs[a]) if (f[nb] > 0) q0 -= f[nb] / 2;
    for (const nb of m.nbrs[a]) {
      const nt = types[nb];
      const c = chgParams(bondType(m, types, a, nb), t, nt);
      sumP += c ? c[0] * c[1] : T.pbci.get(t)!.pbci - T.pbci.get(nt)!.pbci;
      sumF += f[nb];
    }
    out[a] = (1 - M * v) * q0 + v * sumF + sumP;
  }
  return out;
}
