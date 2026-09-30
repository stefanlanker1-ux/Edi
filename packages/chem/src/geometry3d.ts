// Räumliche Anordnung eines Moleküls nach dem Elektronenpaarabstoßungs-Modell (EPA/VSEPR) – für die 3D-Ansicht.
// Jedes Atom richtet seine Bindungen und freien Elektronenpaare nach seiner „Elektronengruppen“-Zahl aus
// (2 linear, 3 trigonal-planar, 4 tetraedrisch). Zwei Varianten:
//  „ideal“ – Idealwinkel des Modells (109,5° / 120° / 180°),
//  „real“  – gemessene Winkel, soweit bekannt (H₂O 104,5°, NH₃ 107°, H₂S 92° …); sonst Schätzung nach EPA.

import { ELEMENTS } from "./elements.ts";
import { TRENDS } from "./trends.ts";
import { electronsOf, bondsOf, identify, REAL_ANGLES, formatAngle, type Molecule } from "./molecules.ts";
import { MOL3D, type Mol3D } from "./mol3d.ts";

export type Vec = [number, number, number];
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec, s: number): Vec => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: Vec) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: Vec): Vec => mul(a, 1 / (len(a) || 1));
export const angleDeg = (a: Vec, b: Vec) => (Math.acos(Math.max(-1, Math.min(1, dot(norm(a), norm(b))))) * 180) / Math.PI;

/** Rodrigues-Drehung von v um die Achse k (Einheitsvektor) um den Winkel t */
function rotate(v: Vec, k: Vec, t: number): Vec {
  const c = Math.cos(t), s = Math.sin(t);
  return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
}
/** Drehung, die a auf b abbildet (als Funktion) */
function aligner(a: Vec, b: Vec): (v: Vec) => Vec {
  a = norm(a); b = norm(b);
  const ax = cross(a, b), s = len(ax), c = dot(a, b);
  if (s < 1e-9) {
    if (c > 0) return v => v;
    const perp = norm(Math.abs(a[0]) < 0.9 ? cross(a, [1, 0, 0]) : cross(a, [0, 1, 0]));
    return v => rotate(v, perp, Math.PI);
  }
  const k = mul(ax, 1 / s), t = Math.atan2(s, c);
  return v => rotate(v, k, t);
}

const rad = (d: number) => (d * Math.PI) / 180;

/**
 * Richtungen für n Bindungen und p freie Paare (Bindungen zuerst); die erste Bindung zeigt entlang +x.
 * Trigonal-planar mit Winkel ≠ 120°: pair = die beiden Bindungen, die den Winkel bondAngle einschließen.
 */
function template(n: number, p: number, bondAngle: number, lpAngle: number, pair?: [number, number]): Vec[] {
  const steric = n + p;
  if (steric <= 1) return [[1, 0, 0]];
  if (steric === 2) return [[1, 0, 0], [-1, 0, 0]];
  if (steric === 3) {
    if (n === 3 && pair && Math.abs(bondAngle - 120) > 0.01) {
      const other = [0, 1, 2].find(i => !pair.includes(i))!;
      const dirs: Vec[] = [];
      dirs[other] = [1, 0, 0];
      dirs[pair[0]] = [Math.cos(rad(180 - bondAngle / 2)), Math.sin(rad(180 - bondAngle / 2)), 0];
      dirs[pair[1]] = [Math.cos(rad(180 + bondAngle / 2)), Math.sin(rad(180 + bondAngle / 2)), 0];
      return dirs.map(aligner(dirs[0], [1, 0, 0]));
    }
    return [0, 120, 240].map(d => [Math.cos(rad(d)), Math.sin(rad(d)), 0] as Vec);
  }
  // steric 4
  let dirs: Vec[];
  if (n === 4 || n === 1 || n === 0) {
    const t = Math.acos(-1 / 3);
    dirs = [[1, 0, 0], ...[0, 120, 240].map(d => [Math.cos(t), Math.sin(t) * Math.cos(rad(d)), Math.sin(t) * Math.sin(rad(d))] as Vec)];
  } else if (n === 3) {
    // drei Bindungen um die Achse −z mit Winkel θ zueinander; freies Paar entlang +z
    const cosA = Math.sqrt((2 * Math.cos(rad(bondAngle)) + 1) / 3);
    const sinA = Math.sqrt(1 - cosA * cosA);
    const bonds = [0, 120, 240].map(d => [sinA * Math.cos(rad(d)), sinA * Math.sin(rad(d)), -cosA] as Vec);
    const r = aligner(bonds[0], [1, 0, 0]);
    dirs = [...bonds.map(r), r([0, 0, 1])];
  } else {
    // zwei Bindungen im Winkel θ in der xy-Ebene, zwei freie Paare in der dazu senkrechten Ebene
    const h = rad(bondAngle / 2), g = rad(lpAngle / 2);
    const bonds: Vec[] = [[Math.sin(h), -Math.cos(h), 0], [-Math.sin(h), -Math.cos(h), 0]];
    const lps: Vec[] = [[0, Math.cos(g), Math.sin(g)], [0, Math.cos(g), -Math.sin(g)]];
    const r = aligner(bonds[0], [1, 0, 0]);
    dirs = [...bonds, ...lps].map(r);
  }
  return dirs;
}

const bySymbol = Object.fromEntries(ELEMENTS.map(e => [e.symbol, e]));
/** Bindungslänge in Å aus Kovalenzradien (Mehrfachbindungen kürzer) */
export function bondLength(a: string, b: string, order: number) {
  const r = (el: string) => (TRENDS.radius.value(bySymbol[el].Z) ?? 75) / 100;
  return (r(a) + r(b)) * (order === 3 ? 0.78 : order === 2 ? 0.87 : 1);
}

export interface Embedded3D {
  atoms: { id: number; el: string; pos: Vec }[];
  bonds: { a: number; b: number; order: number }[];
  lonePairs: { atom: number; dir: Vec }[];
  /** ein typischer Bindungswinkel je Zentralatom */
  angles: { center: number; a: number; b: number; deg: number; label: string; ring: boolean; kind?: string }[];
}

export type AngleMode = "real" | "ideal";

const IDEAL: Record<number, number> = { 2: 180, 3: 120, 4: 109.47 };

/** Bindungswinkel eines Zentralatoms: gemessen (falls bekannt), sonst EPA-Schätzung bzw. Idealwinkel */
function angleInfo(center: string, nbEls: string[], p: number, mode: AngleMode): { deg: number; estimate: boolean; pair?: [number, number] } {
  const steric = nbEls.length + p;
  const ideal = IDEAL[steric] ?? 0;
  if (mode === "ideal" || nbEls.length < 2 || steric === 2) return { deg: ideal, estimate: false };
  // Paar gleicher Partner (für trigonal-planare Zentren)
  let pair: [number, number] | undefined;
  for (let i = 0; i < nbEls.length && !pair; i++) for (let j = i + 1; j < nbEls.length; j++) if (nbEls[i] === nbEls[j]) { pair = [i, j]; break; }
  const real = REAL_ANGLES[`${center}:${[...nbEls].sort().join(",")}`];
  if (steric === 4 && nbEls.length === 4) return { deg: ideal, estimate: false };
  if (real !== undefined) return { deg: real, estimate: false, pair };
  if (steric === 4) return { deg: p === 1 ? 107 : 104.5, estimate: true };
  return { deg: ideal, estimate: p > 0 };
}

const bondKeyOf = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

/** Liegt die Bindung in einem Ring? (a und b bleiben ohne diese Bindung verbunden) */
function inRing(m: Molecule, bond: { a: number; b: number }) {
  const seen = new Set([bond.a]), stack = [bond.a];
  while (stack.length) {
    const id = stack.pop()!;
    for (const b of bondsOf(m, id)) {
      if (b === bond || (b.a === bond.a && b.b === bond.b)) continue;
      const nb = b.a === id ? b.b : b.a;
      if (nb === bond.b) return true;
      if (!seen.has(nb)) { seen.add(nb); stack.push(nb); }
    }
  }
  return false;
}

/**
 * Ausgleich nach dem Prinzip „Positionen schrittweise korrigieren“: Bindungen (stark), Winkel als Abstand
 * der beiden Nachbarn (mittel), nicht verbundene Atome halten Abstand. Wie im echten Ring (Ringspannung)
 * werden die Winkel dabei so gut wie möglich eingehalten.
 */
function relax(m: Molecule, pos: Map<number, Vec>, mode: AngleMode) {
  const el = (id: number) => m.atoms.find(a => a.id === id)!.el;
  const cons: { i: number; j: number; d: number; k: number; push?: boolean }[] = [];
  const near = new Set<string>();
  for (const b of m.bonds) { cons.push({ i: b.a, j: b.b, d: bondLength(el(b.a), el(b.b), b.order), k: 1 }); near.add(bondKeyOf(b.a, b.b)); }
  for (const a of m.atoms) {
    const list = bondsOf(m, a.id).map(b => ({ id: b.a === a.id ? b.b : b.a, order: b.order }));
    if (list.length < 2) continue;
    const p = electronsOf(m, a.id).pairs;
    const info = angleInfo(a.el, list.map(x => el(x.id)), p, mode);
    const dirs = template(list.length, p, info.deg, mode === "ideal" ? 109.47 : 115, info.pair);
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const la = bondLength(a.el, el(list[i].id), list[i].order), lb = bondLength(a.el, el(list[j].id), list[j].order);
      const t = rad(angleDeg(dirs[i], dirs[j]));
      cons.push({ i: list[i].id, j: list[j].id, d: Math.sqrt(la * la + lb * lb - 2 * la * lb * Math.cos(t)), k: 0.4 });
      near.add(bondKeyOf(list[i].id, list[j].id));
    }
  }
  for (let i = 0; i < m.atoms.length; i++) for (let j = i + 1; j < m.atoms.length; j++) {
    const A = m.atoms[i].id, B = m.atoms[j].id;
    if (!near.has(bondKeyOf(A, B))) cons.push({ i: A, j: B, d: 2.2, k: 0.2, push: true });
  }
  const nBonds = m.bonds.length;
  const step = (list: typeof cons) => {
    for (const c of list) {
      const P = pos.get(c.i)!, Q = pos.get(c.j)!;
      const diff = sub(Q, P), L = len(diff) || 1e-6;
      if (c.push && L >= c.d) continue;
      const f = (c.k * (L - c.d)) / L / 2;
      pos.set(c.i, add(P, mul(diff, f)));
      pos.set(c.j, sub(Q, mul(diff, f)));
    }
  };
  // Bindungen sind viel steifer als Winkel (echte Ringspannung staucht Winkel, nicht Bindungen): nach jedem Durchgang Bindungen nachziehen
  for (let it = 0; it < 600; it++) {
    step(cons);
    for (let k = 0; k < 4; k++) step(cons.slice(0, nBonds));
  }
}

/**
 * Nach dem Ringausgleich: Was außen am Ring hängt (H, =O, Seitenketten) und die freien Paare der Ringatome
 * genau nach EPA setzen – der Ausgleich hält nur Abstände ein und kann dabei z. B. ein =O aus der Ebene kippen
 * oder ein H nach innen drehen. Richtungen aus den beiden Ringnachbarn a, b:
 * eine Gruppe (sp²) auf der Winkelhalbierenden nach außen, zwei (sp³) symmetrisch darüber und darunter.
 */
function placeRingSubstituents(m: Molecule, pos: Map<number, Vec>, lonePairs: Embedded3D["lonePairs"], ring: Set<string>) {
  const nbs = (id: number) => bondsOf(m, id).map(b => (b.a === id ? b.b : b.a));
  const inRingAtom = (id: number) => nbs(id).some(nb => ring.has(bondKeyOf(id, nb)));
  for (const a of m.atoms) {
    const A = a.id;
    if (!inRingAtom(A)) continue;
    const R = nbs(A).filter(nb => ring.has(bondKeyOf(A, nb)));
    const S = nbs(A).filter(nb => !ring.has(bondKeyOf(A, nb)));
    const lps = lonePairs.filter(lp => lp.atom === A);
    const k = S.length + lps.length;
    if (!k) continue;
    const P = pos.get(A)!;
    const dir = (id: number) => norm(sub(pos.get(id)!, P));
    let dirs: Vec[];
    if (R.length === 2) {
      const [u, v] = [dir(R[0]), dir(R[1])];
      const w = norm(mul(add(u, v), -1)), n = norm(cross(u, v));
      if (k === 1) dirs = [w];
      else if (k === 2) { const h = rad(109.47 / 2); dirs = [add(mul(w, Math.cos(h)), mul(n, Math.sin(h))), add(mul(w, Math.cos(h)), mul(n, -Math.sin(h)))]; }
      else continue;
    } else if (R.length === 3 && k === 1) dirs = [norm(mul(add(add(dir(R[0]), dir(R[1])), dir(R[2])), -1))];
    else continue;
    // zwei Gruppen: die Zuordnung wählen, die am wenigsten dreht
    const targets = S.map(dir);
    if (targets.length === 2 && dot(targets[0], dirs[0]) + dot(targets[1], dirs[1]) < dot(targets[0], dirs[1]) + dot(targets[1], dirs[0])) dirs = [dirs[1], dirs[0]];
    S.forEach((s, i) => {
      // die ganze Seitengruppe starr mitdrehen (nur, wenn in ihr kein weiterer Ring steckt)
      const side = new Set([s]), stack = [s];
      while (stack.length) for (const nb of nbs(stack.pop()!)) if (nb !== A && !side.has(nb)) { side.add(nb); stack.push(nb); }
      if ([...side].some(inRingAtom)) return;
      const turn = aligner(targets[i], dirs[i]);
      for (const id of side) pos.set(id, add(P, turn(sub(pos.get(id)!, P))));
      for (const lp of lonePairs) if (side.has(lp.atom)) lp.dir = turn(lp.dir);
    });
    lps.forEach((lp, i) => { lp.dir = dirs[S.length + i]; });
  }
}

function embedEPA(m: Molecule, mode: AngleMode): Embedded3D {
  const nbs = (id: number) => bondsOf(m, id).map(b => ({ id: b.a === id ? b.b : b.a, order: b.order }));
  const el = (id: number) => m.atoms.find(a => a.id === id)!.el;
  const root = [...m.atoms].sort((a, b) => nbs(b.id).length - nbs(a.id).length || Number(a.el === "H") - Number(b.el === "H") || a.id - b.id)[0];
  const pos = new Map<number, Vec>();
  const lonePairs: Embedded3D["lonePairs"] = [];
  const dirsOf = new Map<number, Map<number, Vec>>();
  pos.set(root.id, [0, 0, 0]);
  const queue: { id: number; parent: number | null }[] = [{ id: root.id, parent: null }];
  const REF: Vec = [0, 1, 0];

  while (queue.length) {
    const { id, parent } = queue.shift()!;
    const list = nbs(id);
    const ordered = parent === null ? list : [list.find(x => x.id === parent)!, ...list.filter(x => x.id !== parent)];
    const p = electronsOf(m, id).pairs;
    const info = angleInfo(el(id), ordered.map(x => el(x.id)), p, mode);
    let dirs = template(ordered.length, p, info.deg, mode === "ideal" ? 109.47 : 115, info.pair);
    if (parent !== null) {
      const u = norm(sub(pos.get(parent)!, pos.get(id)!));
      const r = aligner(dirs[0], u);
      dirs = dirs.map(r);
      // Drehung um u: zweite Richtung möglichst zur Referenz (hält z. B. Ethen eben)
      if (dirs.length > 1) {
        const perp = (v: Vec) => sub(v, mul(u, dot(v, u)));
        let ref: Vec = perp(REF);
        if (len(ref) < 1e-6) ref = perp([0, 0, 1]);
        // Einfachbindung zwischen zwei tetraedrischen Atomen (C–C in Ethan, C–O in Methanol): gestaffelt –
        // die erste weitere Richtung liegt gegenüber (anti) einer Bindung des Vorgängers
        const parentDirs = [...(dirsOf.get(parent)?.entries() ?? [])].filter(([nb]) => nb !== id).map(([, d]) => d);
        const tetra = (x: number, n: number) => n + electronsOf(m, x).pairs === 4;
        const single = bondsOf(m, id).find(b => b.a === parent || b.b === parent)?.order === 1;
        if (single && parentDirs.length && tetra(id, list.length) && tetra(parent, nbs(parent).length)) {
          const r = perp(mul(parentDirs[0], -1));
          if (len(r) > 1e-6) ref = r;
        }
        const v = perp(dirs[1]);
        const t = Math.atan2(dot(cross(v, ref), u), dot(v, ref));
        dirs = dirs.map(d => rotate(d, u, t));
      }
    } else if (ordered.length === 2 && p === 2) {
      // gewinkelte Moleküle (H₂O) mit dem Winkel nach unten öffnen
      dirs = dirs.map(aligner(add(dirs[0], dirs[1]), [0, -1, 0]));
    }
    const map = new Map<number, Vec>();
    ordered.forEach((nb, i) => {
      map.set(nb.id, dirs[i]);
      if (!pos.has(nb.id)) {
        pos.set(nb.id, add(pos.get(id)!, mul(dirs[i], bondLength(el(id), el(nb.id), nb.order))));
        queue.push({ id: nb.id, parent: id });
      }
    });
    dirsOf.set(id, map);
    for (let i = ordered.length; i < dirs.length; i++) lonePairs.push({ atom: id, dir: dirs[i] });
  }

  // Ringe: der Baum schließt einen Ring nicht sauber (die letzte Bindung wäre verzerrt).
  // Deshalb Bindungslängen und Winkel (als 1-3-Abstände) gemeinsam ausgleichen und freie Paare mitdrehen.
  const ring = new Set(m.bonds.filter(b => inRing(m, b)).map(b => bondKeyOf(b.a, b.b)));
  if (ring.size) {
    relax(m, pos, mode);
    for (const lp of lonePairs) {
      const old = dirsOf.get(lp.atom)!;
      const ids = [...old.keys()];
      const now = (nb: number) => norm(sub(pos.get(nb)!, pos.get(lp.atom)!));
      let d = aligner(old.get(ids[0])!, now(ids[0]))(lp.dir);
      if (ids.length > 1) {
        const u = now(ids[0]);
        const perp = (v: Vec) => sub(v, mul(u, dot(v, u)));
        const v = perp(aligner(old.get(ids[0])!, u)(old.get(ids[1])!)), w = perp(now(ids[1]));
        d = rotate(d, u, Math.atan2(dot(cross(v, w), u), dot(v, w)));
      }
      lp.dir = d;
    }
    placeRingSubstituents(m, pos, lonePairs, ring);
  }

  // Peroxid-artige Ketten X–A–B–Y (A, B mit je 2 Bindungen und 2 freien Paaren, z. B. H–O–O–H) sind verdrillt:
  // Diederwinkel ca. 111° – nicht eben, sonst höben sich die Bindungsdipole von H₂O₂ auf.
  for (const bd of m.bonds) {
    const A = bd.a, B = bd.b;
    const bent = (id: number) => nbs(id).length === 2 && electronsOf(m, id).pairs === 2;
    if (bd.order !== 1 || !bent(A) || !bent(B) || inRing(m, bd)) continue;
    const X = nbs(A).find(x => x.id !== B)!.id, Y = nbs(B).find(x => x.id !== A)!.id;
    const pa = pos.get(A)!, u = norm(sub(pos.get(B)!, pa));
    const perp = (v: Vec) => sub(v, mul(u, dot(v, u)));
    const vx = perp(sub(pos.get(X)!, pa)), vy = perp(sub(pos.get(Y)!, pa));
    const now = Math.atan2(dot(cross(vx, vy), u), dot(vx, vy));
    const t = rad(111.5) - now;
    // alles auf der B-Seite um die Achse A→B drehen
    const side = new Set([B]), stack = [B];
    while (stack.length) for (const nb of nbs(stack.pop()!)) if (nb.id !== A && !side.has(nb.id)) { side.add(nb.id); stack.push(nb.id); }
    for (const id of side) if (id !== B) pos.set(id, add(pa, rotate(sub(pos.get(id)!, pa), u, t)));
    for (const lp of lonePairs) if (side.has(lp.atom)) lp.dir = rotate(lp.dir, u, t);
  }

  return finish(m, pos, lonePairs, ring, mode, false);
}

/** Schwerpunkt in den Ursprung, Bindungswinkel je Zentralatom (exact: Lage aus gemessenen/berechneten Daten, ohne „ca.“) */
function finish(m: Molecule, pos: Map<number, Vec>, lonePairs: Embedded3D["lonePairs"], ring: Set<string>, mode: AngleMode, exact: boolean): Embedded3D {
  const nbs = (id: number) => bondsOf(m, id).map(b => ({ id: b.a === id ? b.b : b.a, order: b.order }));
  const el = (id: number) => m.atoms.find(a => a.id === id)!.el;
  const c = mul([...pos.values()].reduce(add, [0, 0, 0] as Vec), 1 / pos.size);
  const atoms = m.atoms.map(a => ({ id: a.id, el: a.el, pos: sub(pos.get(a.id) ?? [0, 0, 0], c) }));
  const angles: Embedded3D["angles"] = [];
  for (const a of m.atoms) {
    const list = nbs(a.id);
    if (list.length < 2) continue;
    const P = atoms.find(x => x.id === a.id)!.pos;
    // gezeigt wird im Ring der Ringwinkel, sonst bevorzugt der Winkel zwischen zwei gleichen Partnern (H–C–H statt H–C=C)
    const inR = list.filter(q => ring.has(bondKeyOf(a.id, q.id)));
    const same = list.flatMap((x, i) => list.slice(i + 1).filter(y => el(y.id) === el(x.id)).map(y => [x, y] as const))[0];
    const [x, y] = inR.length >= 2 ? inR : same ?? list;
    const deg = angleDeg(sub(atoms.find(q => q.id === x.id)!.pos, P), sub(atoms.find(q => q.id === y.id)!.pos, P));
    const info = angleInfo(a.el, list.map(q => el(q.id)), electronsOf(m, a.id).pairs, mode);
    // Daten: Winkel mit gemessenem Tabellenwert genau so beschriften (106,95° im Modell = 107° gemessen)
    const measured = exact ? REAL_ANGLES[`${a.el}:${list.map(q => el(q.id)).sort().join(",")}`] : undefined;
    let label = measured !== undefined ? formatAngle(measured)
      : inR.length >= 2 && !exact ? `≈ ${Math.round(deg)}°` : (info.estimate && !exact ? "ca. " : "") + formatAngle(deg);
    // gleiche Winkel (z. B. alle Ecken eines Rings) nur einmal beschriften, sonst überlagern sich die Zahlen
    const kind = `${a.el}:${[el(x.id), el(y.id)].sort()}`;
    if (angles.some(q => q.kind === kind && Math.abs(q.deg - deg) < 1.5)) label = "";
    angles.push({ center: a.id, a: x.id, b: y.id, deg, label, ring: inR.length >= 2, kind });
  }
  for (const q of angles) delete q.kind;
  return { atoms, bonds: m.bonds.map(b => ({ ...b })), lonePairs, angles };
}

/** Atome des gebauten Moleküls den Atomen der Datei zuordnen (gleiches Element, gleiche Bindungen) */
function matchAtoms(m: Molecule, d: Mol3D): Map<number, number> | null {
  if (d.atoms.length !== m.atoms.length || d.bonds.length !== m.bonds.length) return null;
  const dn = d.atoms.map((_, i) => d.bonds.filter(b => b[0] === i || b[1] === i).map(b => ({ j: b[0] === i ? b[1] : b[0], o: b[2] })));
  const order = [...m.atoms].sort((a, b) => bondsOf(m, b.id).length - bondsOf(m, a.id).length);
  // Reihenfolge: jedes weitere Atom hängt möglichst an einem schon zugeordneten
  const seq: number[] = [], seen = new Set<number>();
  for (const start of order) {
    if (seen.has(start.id)) continue;
    const q = [start.id]; seen.add(start.id);
    while (q.length) { const id = q.shift()!; seq.push(id); for (const b of bondsOf(m, id)) { const nb = b.a === id ? b.b : b.a; if (!seen.has(nb)) { seen.add(nb); q.push(nb); } } }
  }
  const map = new Map<number, number>(), used = new Set<number>();
  const fits = (id: number, i: number) => {
    const a = m.atoms.find(x => x.id === id)!, mine = bondsOf(m, id);
    if (d.atoms[i][0] !== a.el || dn[i].length !== mine.length) return false;
    return mine.every(b => { const nb = b.a === id ? b.b : b.a; const j = map.get(nb); return j === undefined || dn[i].some(x => x.j === j && x.o === b.order); });
  };
  const go = (k: number): boolean => {
    if (k === seq.length) return true;
    const id = seq[k];
    for (let i = 0; i < d.atoms.length; i++) {
      if (used.has(i) || !fits(id, i)) continue;
      map.set(id, i); used.add(i);
      if (go(k + 1)) return true;
      map.delete(id); used.delete(i);
    }
    return false;
  };
  return go(0) ? map : null;
}

/**
 * Bekanntes Molekül mit der Lage aus mol3d.ts (Kraftfeld MMFF94, gemessene Winkel wie H₂O 104,5° festgehalten).
 * Freie Paare: Richtungen aus dem EPA-Modell, je Atom so gedreht, dass seine Bindungen auf die echten fallen.
 */
function embedData(m: Molecule, d: Mol3D, mode: AngleMode): Embedded3D | null {
  const map = matchAtoms(m, d);
  if (!map) return null;
  const epa = embedEPA(m, mode);
  const P = (e: Embedded3D, id: number) => e.atoms.find(a => a.id === id)!.pos;
  const pos = new Map(m.atoms.map(a => { const [, x, y, z] = d.atoms[map.get(a.id)!]; return [a.id, [x, y, z] as Vec]; }));
  const nbs = (id: number) => bondsOf(m, id).map(b => (b.a === id ? b.b : b.a));
  const lonePairs = epa.lonePairs.map(lp => {
    // Bezugsrichtungen: eigene Bindungen, bei nur einer Bindung zusätzlich die des Nachbarn
    const refs = nbs(lp.atom).map(nb => [lp.atom, nb] as const);
    if (refs.length < 2) for (const nb of nbs(lp.atom)) for (const nn of nbs(nb)) if (nn !== lp.atom) refs.push([lp.atom, nn]);
    if (!refs.length) return lp;
    const from = (e: Embedded3D | null, [a, b]: readonly [number, number]) => norm(e ? sub(P(e, b), P(e, a)) : sub(pos.get(b)!, pos.get(a)!));
    const u0 = from(epa, refs[0]), u1 = from(null, refs[0]);
    let dir = aligner(u0, u1)(lp.dir);
    if (refs.length > 1) {
      const perp = (v: Vec) => sub(v, mul(u1, dot(v, u1)));
      const v = perp(aligner(u0, u1)(from(epa, refs[1]))), w = perp(from(null, refs[1]));
      if (len(v) > 1e-6 && len(w) > 1e-6) dir = rotate(dir, u1, Math.atan2(dot(cross(v, w), u1), dot(v, w)));
    }
    return { atom: lp.atom, dir };
  });
  const ring = new Set(m.bonds.filter(b => inRing(m, b)).map(b => bondKeyOf(b.a, b.b)));
  return finish(m, pos, lonePairs, ring, mode, true);
}

/**
 * Räumliche Lage: bekannte Moleküle („real“) aus den Daten (MMFF94, mol3d.ts), sonst und „idealisiert“ nach EPA.
 */
export function embed3D(m: Molecule, mode: AngleMode = "real"): Embedded3D {
  if (mode === "real") {
    const k = identify(m), d = k && MOL3D[k.formula];
    const e = d && embedData(m, d, mode);
    if (e) return e;
  }
  return embedEPA(m, mode);
}

/** Summe der Bindungsdipole (ΔEN · Richtung von δ+ nach δ−) – Richtung des Dipolmoments */
export function dipoleVector(e: Embedded3D, enOf: (el: string) => number): Vec {
  let d: Vec = [0, 0, 0];
  for (const b of e.bonds) {
    const A = e.atoms.find(a => a.id === b.a)!, B = e.atoms.find(a => a.id === b.b)!;
    const diff = enOf(B.el) - enOf(A.el);
    if (Math.abs(diff) < 0.4) continue;
    d = add(d, mul(norm(sub(B.pos, A.pos)), diff));
  }
  return d;
}
