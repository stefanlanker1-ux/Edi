// Keilstrichformel: räumlicher Bau (aus embed3D) als Zeichnung auf dem Papier.
//   Strich = Bindung in der Papierebene, Keil = Bindung zum Betrachter, gestrichelter Keil = Bindung nach hinten.
// Vorgehen: Die Papierebene geht durch ein Atom und zwei seiner Bindungen (übliche Zeichnung: bei CH₄ zwei H in der Ebene,
// eines davor, eines dahinter). Liegen dabei zwei Atome übereinander, wird die Blickrichtung etwas gekippt.
// Von allen Kandidaten gewinnt die Ansicht mit den meisten Bindungen in der Ebene und ohne Überlappungen.

import { embed3D, type AngleMode, type Vec } from "./geometry3d.ts";
import { electronsOf, type Molecule } from "./molecules.ts";

const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec, s: number): Vec => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: Vec) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: Vec): Vec => mul(a, 1 / (len(a) || 1));
const rotate = (v: Vec, k: Vec, t: number): Vec => {
  const c = Math.cos(t), s = Math.sin(t);
  return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
};
const deg = (r: number) => (r * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;
/** Winkel auf [0, 360) */
const wrap = (a: number) => ((a % 360) + 360) % 360;

export type WedgeKind = "plain" | "wedge" | "dash";

export interface WedgeLayout {
  /** 2D-Lage in Å, SVG-Richtung (x nach rechts, y nach unten) */
  atoms: { id: number; el: string; x: number; y: number }[];
  /** from = schmales Ende des Keils (Atom in der Ebene) */
  bonds: { a: number; b: number; order: number; kind: WedgeKind; from: number; to: number }[];
  /** freie Elektronenpaare als Winkel (Grad, SVG: 0 = rechts, 90 = unten) */
  lone: Map<number, number[]>;
  /** freie Richtung je Atom (für δ+/δ−) */
  free: Map<number, number>;
  /** mittlere Bindungslänge (Å) – zum Skalieren */
  unit: number;
}

interface View { n: Vec; e1: Vec; e2: Vec; origin: Vec; axis: Vec | null; tilt: number }

/** Zwei Einheitsvektoren in der Ebene senkrecht zu n */
function basis(n: Vec): [Vec, Vec] {
  const t: Vec = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const e1 = norm(sub(t, mul(n, dot(t, n))));
  return [e1, cross(n, e1)];
}

/** Schneiden sich die Strecken pq und rs (ohne gemeinsame Endpunkte)? */
function crosses(p: number[], q: number[], r: number[], s: number[]) {
  const o = (a: number[], b: number[], c: number[]) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  return o(p, q, r) * o(p, q, s) < 0 && o(r, s, p) * o(r, s, q) < 0;
}

export function wedgeLayout(m: Molecule, mode: AngleMode = "real"): WedgeLayout {
  const e = embed3D(m, mode);
  const P = new Map(e.atoms.map(a => [a.id, a.pos]));
  const el = (id: number) => e.atoms.find(a => a.id === id)!.el;
  const nbs = (id: number) => e.bonds.filter(b => b.a === id || b.b === id).map(b => (b.a === id ? b.b : b.a));
  const blen = e.bonds.map(b => len(sub(P.get(b.a)!, P.get(b.b)!)));
  const meanLen = blen.length ? blen.reduce((s, x) => s + x, 0) / blen.length : 1;

  // Kandidaten für die Papierebene: je Atom zwei seiner Richtungen (Bindungen, zur Not ein freies Paar)
  const normals: { n: Vec; origin: Vec }[] = [];
  const addNormal = (n: Vec, origin: Vec) => {
    if (len(n) < 0.15) return;
    n = norm(n);
    if (!normals.some(c => Math.abs(dot(c.n, n)) > 0.995 && Math.abs(dot(sub(c.origin, origin), n)) < 0.05)) normals.push({ n, origin });
  };
  for (const a of e.atoms) {
    const dirs = nbs(a.id).map(id => norm(sub(P.get(id)!, a.pos)));
    const lp = e.lonePairs.filter(l => l.atom === a.id).map(l => l.dir);
    for (let i = 0; i < dirs.length; i++) {
      for (let j = i + 1; j < dirs.length; j++) addNormal(cross(dirs[i], dirs[j]), a.pos);
      for (const d of lp) addNormal(cross(dirs[i], d), a.pos);
    }
  }
  // lineare Moleküle (HCl, CO₂, C₂H₂): irgendeine Ebene durch die Achse
  if (!normals.length) {
    const axis = e.atoms.length > 1 ? norm(sub(e.atoms[1].pos, e.atoms[0].pos)) : ([1, 0, 0] as Vec);
    addNormal(basis(axis)[0], e.atoms[0]?.pos ?? [0, 0, 0]);
  }

  const project = (v: View, p: Vec) => {
    let q = sub(p, v.origin);
    if (v.axis) q = rotate(q, v.axis, v.tilt);
    return [dot(q, v.e1), dot(q, v.e2)];
  };
  const zOf = (v: View, p: Vec) => dot(sub(p, v.origin), v.n);

  // Summe der freien Paare je Atom mit mindestens zwei Bindungen (Richtung des „Hütchens“ bei NH₃, H₂O)
  const lpSum = new Map<number, Vec>();
  for (const a of e.atoms) {
    const l = e.lonePairs.filter(x => x.atom === a.id);
    if (!l.length || nbs(a.id).length < 2) continue;
    const sum = l.reduce((s, x) => add(s, x.dir), [0, 0, 0] as Vec);
    if (len(sum) > 0.3) lpSum.set(a.id, norm(sum));
  }

  const terminal = (id: number) => nbs(id).length === 1;
  /**
   * Projektion wie üblich gezeichnet: Endatome an Keilen etwas länger (sonst wirken sie gestaucht)
   * und zwei fast gleich liegende Endatome am selben Atom (Keil und gestrichelter Keil bei CH₄) auseinandergefächert.
   */
  function draw(v: View) {
    const xy = new Map(e.atoms.map(a => [a.id, project(v, a.pos)]));
    for (const c of e.atoms) {
      const list = nbs(c.id);
      if (list.length < 2) continue;
      const pc = xy.get(c.id)!;
      for (const t of list.filter(terminal)) {
        const q = xy.get(t)!, L3 = len(sub(P.get(t)!, c.pos));
        const dx = q[0] - pc[0], dy = q[1] - pc[1], L2 = Math.hypot(dx, dy);
        if (L2 > 0.05 && L2 < 0.85 * L3) xy.set(t, [pc[0] + (dx / L2) * 0.85 * L3, pc[1] + (dy / L2) * 0.85 * L3]);
      }
      for (let round = 0; round < 3; round++) {
        const ang = list.map(id => { const q = xy.get(id)!; return { id, a: Math.atan2(q[1] - pc[1], q[0] - pc[0]), r: Math.hypot(q[0] - pc[0], q[1] - pc[1]) }; });
        for (let i = 0; i < ang.length; i++) for (let j = i + 1; j < ang.length; j++) {
          const A = ang[i], B = ang[j];
          let d = B.a - A.a;
          while (d > Math.PI) d -= 2 * Math.PI;
          while (d < -Math.PI) d += 2 * Math.PI;
          if (Math.abs(d) >= rad(40) || !terminal(A.id) || !terminal(B.id)) continue;
          const mid = A.a + d / 2, half = rad(24) * (d < 0 ? -1 : 1) || rad(24);
          const put = (x: { id: number; r: number }, t: number) => xy.set(x.id, [pc[0] + Math.cos(t) * x.r, pc[1] + Math.sin(t) * x.r]);
          put(A, mid - half); put(B, mid + half);
        }
      }
    }
    return xy;
  }

  function score(v: View) {
    const xy = draw(v);
    let s = 0;
    // Bindungen in der Ebene sind gut (weniger Keile = übersichtlicher)
    // (Gerüst aus Nicht-H-Atomen zählt mehr: C–Cl, C–C–O in der Ebene)
    for (const b of e.bonds) if (Math.abs(zOf(v, P.get(b.a)!)) < 0.2 && Math.abs(zOf(v, P.get(b.b)!)) < 0.2) s -= el(b.a) !== "H" && el(b.b) !== "H" ? 9 : 6;
    // Atome dürfen sich nicht überdecken
    for (let i = 0; i < e.atoms.length; i++) for (let j = i + 1; j < e.atoms.length; j++) {
      const p = xy.get(e.atoms[i].id)!, q = xy.get(e.atoms[j].id)!;
      const d = Math.hypot(p[0] - q[0], p[1] - q[1]) / Math.min(meanLen, 1.1);
      if (d < 0.62) s += 80 * ((0.62 - d) / 0.62) ** 2 + (d < 0.35 ? 30 : 0);
    }
    // Bindungen an einem Atom brauchen genug Winkelabstand, keine zu kurzen (auf den Betrachter zeigenden) Bindungen
    for (const a of e.atoms) {
      const p = xy.get(a.id)!;
      const ang = nbs(a.id).map(id => { const q = xy.get(id)!; return deg(Math.atan2(q[1] - p[1], q[0] - p[0])); }).sort((x, y) => x - y);
      for (let i = 0; i < ang.length && ang.length > 1; i++) {
        const gap = i + 1 < ang.length ? ang[i + 1] - ang[i] : ang[0] + 360 - ang[i];
        if (gap < 42) s += 40 * (1 - gap / 42) ** 2 + 4;
      }
    }
    e.bonds.forEach((b, i) => {
      const p = xy.get(b.a)!, q = xy.get(b.b)!;
      const r = Math.hypot(p[0] - q[0], p[1] - q[1]) / blen[i];
      if (r < 0.6) s += 30 * (0.6 - r) / 0.6 + 5;
    });
    for (let i = 0; i < e.bonds.length; i++) for (let j = i + 1; j < e.bonds.length; j++) {
      const A = e.bonds[i], B = e.bonds[j];
      if ([A.a, A.b].some(x => x === B.a || x === B.b)) continue;
      if (crosses(xy.get(A.a)!, xy.get(A.b)!, xy.get(B.a)!, xy.get(B.b)!)) s += 50;
    }
    // Mehrfachbindungen sollen in der Ebene liegen (Doppelstrich als Keil gibt es nicht)
    for (const b of e.bonds) if (b.order > 1 && Math.abs(zOf(v, P.get(b.b)!) - zOf(v, P.get(b.a)!)) > 0.3) s += 8;
    // freie Elektronenpaare eines Zentralatoms sollen sichtbar zur Seite zeigen (NH₃: Paar oben, nicht auf den Betrachter zu)
    for (const [id, d] of lpSum) {
      const [px, py] = project({ ...v, origin: [0, 0, 0] }, d);
      const r = Math.hypot(px, py);
      s -= 20 * Math.min(1, r / 0.5);
      // … und nicht dorthin, wo schon eine Bindung gezeichnet ist
      const c = xy.get(id)!;
      for (const nb of nbs(id)) {
        const q = xy.get(nb)!, bx = q[0] - c[0], by = q[1] - c[1];
        const cos = (bx * px + by * py) / ((Math.hypot(bx, by) || 1) * (r || 1));
        if (r > 0.2 && cos > Math.cos(rad(60))) s += 25 * (cos - Math.cos(rad(60))) / (1 - Math.cos(rad(60)));
      }
    }
    // lieber wenig kippen
    s += 0.02 * deg(v.tilt) ** 2;
    return s;
  }

  let best: { v: View; s: number } | null = null;
  for (const { n, origin } of normals) {
    const [e1, e2] = basis(n);
    const views: View[] = [{ n, e1, e2, origin, axis: null, tilt: 0 }];
    for (let k = 0; k < 12; k++) {
      const axis = add(mul(e1, Math.cos(rad(k * 15))), mul(e2, Math.sin(rad(k * 15))));
      for (const t of [10, 18, 26, 34]) views.push({ n, e1, e2, origin, axis, tilt: rad(t) });
    }
    for (const v of views) {
      const s = score(v);
      if (!best || s < best.s - 1e-9) best = { v, s };
    }
  }
  const v = best!.v;

  // Keil oder Strich: nach dem Abstand zur Papierebene (vor dem Kippen)
  const bonds = e.bonds.map((b, i) => {
    const za = zOf(v, P.get(b.a)!), zb = zOf(v, P.get(b.b)!);
    const da = nbs(b.a).length, db = nbs(b.b).length;
    // schmales Ende am Atom näher an der Ebene (bei Gleichstand am Atom mit mehr Bindungen)
    const aFirst = Math.abs(Math.abs(za) - Math.abs(zb)) > 0.1 ? Math.abs(za) < Math.abs(zb) : da >= db;
    const [from, to, dz] = aFirst ? [b.a, b.b, zb - za] : [b.b, b.a, za - zb];
    const kind: WedgeKind = b.order > 1 || Math.abs(dz) < 0.3 * blen[i] ? "plain" : dz > 0 ? "wedge" : "dash";
    return { a: b.a, b: b.b, order: b.order, kind, from, to };
  });

  // 2D-Lage; dann in der Ebene drehen: ein Zentralatom → Bindungen nach unten (freie Paare oben, H₂O als „V“),
  // sonst längste Ausdehnung waagrecht
  const xy = draw(v);
  let pts = e.atoms.map(a => { const [x, y] = xy.get(a.id)!; return { id: a.id, el: a.el, x, y }; });
  const cx = pts.reduce((s, p) => s + p.x, 0) / (pts.length || 1), cy = pts.reduce((s, p) => s + p.y, 0) / (pts.length || 1);
  pts = pts.map(p => ({ ...p, x: p.x - cx, y: p.y - cy }));
  const hub = e.atoms.find(a => nbs(a.id).length === e.atoms.length - 1 && e.atoms.length > 2);
  let turn = 0; // Drehwinkel (mathematisch, y nach oben)
  let flip = false; // danach spiegeln (Keile nach rechts)
  const linear = pts.every(p => Math.abs((p.x - pts[0].x) * (pts[pts.length - 1].y - pts[0].y) - (p.y - pts[0].y) * (pts[pts.length - 1].x - pts[0].x)) < 0.05);
  if (hub && !linear) {
    const h = pts.find(p => p.id === hub.id)!;
    const others = pts.filter(p => p.id !== hub.id);
    // freie Paare nach oben (NH₃, H₂O: Zentralatom oben, Bindungen nach unten)
    const lp = e.lonePairs.filter(l => l.atom === hub.id).map(l => project({ ...v, origin: [0, 0, 0] }, l.dir));
    const lx = lp.reduce((s, p) => s + p[0], 0), ly = lp.reduce((s, p) => s + p[1], 0);
    const rx = others.reduce((s, p) => s + p.x - h.x, 0), ry = others.reduce((s, p) => s + p.y - h.y, 0);
    if (lp.length && Math.hypot(lx, ly) > 0.2) turn = 90 - deg(Math.atan2(ly, lx));
    else if (lp.length && Math.hypot(rx, ry) > 0.35 * meanLen) turn = -90 - deg(Math.atan2(ry, rx));
    else {
      // z. B. CH₄: eine Bindung in der Ebene nach oben (Keil und gestrichelter Keil unten rechts)
      // (bevorzugt der schwerere Partner, z. B. Cl in CH₃Cl, O in CH₂O)
      const plain = bonds.filter(b => b.kind === "plain").map(b => pts.find(p => p.id === (b.a === hub.id ? b.b : b.a))!)
        .sort((x, y) => Number(x.el === "H") - Number(y.el === "H"));
      const pick = plain[0] ?? others[0];
      turn = 90 - deg(Math.atan2(pick.y - h.y, pick.x - h.x));
      // Keile rechts
      const rot = (p: { x: number; y: number }) => { const t = rad(turn); return p.x * Math.cos(t) - p.y * Math.sin(t); };
      const out = bonds.filter(b => b.kind !== "plain").map(b => pts.find(p => p.id === (b.a === hub.id ? b.b : b.a))!);
      if (out.length && out.reduce((s, p) => s + rot({ x: p.x - h.x, y: p.y - h.y }), 0) < 0) flip = true;
    }
  } else if (pts.length > 1) {
    // Hauptachse (Hauptkomponente) waagrecht
    let sxx = 0, syy = 0, sxy = 0;
    for (const p of pts) { sxx += p.x * p.x; syy += p.y * p.y; sxy += p.x * p.y; }
    turn = -deg(0.5 * Math.atan2(2 * sxy, sxx - syy));
  }
  const t = rad(turn);
  // mathematisch (y oben) → SVG (y unten)
  const atoms = pts.map(p => ({ id: p.id, el: p.el, x: (flip ? -1 : 1) * (p.x * Math.cos(t) - p.y * Math.sin(t)), y: -(p.x * Math.sin(t) + p.y * Math.cos(t)) }));
  // Ein Zentralatom mit Tetraeder (CH₄, CCl₄, CH₃Cl, NH₃, PH₃): feste Standard-Zeichnung statt Projektion.
  // Winkel in SVG-Grad (0 = rechts, 90 = unten, 270 = oben); Nicht-H-Partner bevorzugt in der Ebene.
  const hubLp = hub ? e.lonePairs.filter(l => l.atom === hub.id).length : 0;
  const hubN = hub ? nbs(hub.id).length : 0;
  const TEMPLATE: Record<string, [number, WedgeKind][]> = {
    "4/0": [[270, "plain"], [155, "plain"], [65, "wedge"], [10, "dash"]],
    "3/1": [[145, "plain"], [35, "plain"], [90, "dash"]],
  };
  const tpl = hub && e.bonds.every(b => b.order === 1) ? TEMPLATE[`${hubN}/${hubLp}`] : undefined;
  const fixedLone = new Map<number, number[]>();
  if (hub && tpl) {
    const h = atoms.find(a => a.id === hub.id)!;
    h.x = 0; h.y = 0;
    const order = nbs(hub.id).sort((x, y) => Number(el(x) === "H") - Number(el(y) === "H"));
    order.forEach((id, i) => {
      const [ang, kind] = tpl[i];
      // Bindungen gleich lang wie in der üblichen Zeichnung (echte Längen ließen C–H neben C–Cl gestaucht wirken);
      // Partner mit freien Elektronenpaaren (Cl) etwas weiter außen, damit sich deren Paare nicht berühren
      const L = meanLen * (kind === "plain" ? 1 : 0.95) * (electronsOf(m, id).pairs ? 1.2 : 1);
      const a = atoms.find(x => x.id === id)!;
      a.x = Math.cos(rad(ang)) * L; a.y = Math.sin(rad(ang)) * L;
      const b = bonds.find(x => (x.a === id && x.b === hub.id) || (x.b === id && x.a === hub.id))!;
      b.kind = kind; b.from = hub.id; b.to = id;
    });
    if (hubLp) fixedLone.set(hub.id, [270]);
  }
  const at = new Map(atoms.map(a => [a.id, a]));

  // Freie Paare in die größten Lücken zwischen den Bindungen verteilen
  const lone = new Map<number, number[]>();
  const free = new Map<number, number>();
  for (const a of atoms) {
    const ang = nbs(a.id).map(id => { const q = at.get(id)!; return wrap(deg(Math.atan2(q.y - a.y, q.x - a.x))); }).sort((x, y) => x - y);
    const n = electronsOf(m, a.id).pairs;
    const put = fixedLone.get(a.id) ?? spread(ang, n, hub?.id === a.id || ang.length !== 1 ? 270 : wrap(ang[0] + 180));
    if (n) lone.set(a.id, put);
    free.set(a.id, spread([...ang, ...put].sort((x, y) => x - y), 1, 315)[0]);
  }
  return { atoms, bonds, lone, free, unit: meanLen };
}

/**
 * n Richtungen möglichst gleichmäßig in die Lücken zwischen den besetzten Winkeln legen
 * (ohne besetzte Winkel: symmetrisch um die bevorzugte Richtung).
 */
function spread(taken: number[], n: number, prefer: number): number[] {
  if (!n) return [];
  if (!taken.length) return Array.from({ length: n }, (_, i) => wrap(prefer + (i - (n - 1) / 2) * (360 / Math.max(n, 1)) * (n === 1 ? 0 : 1)));
  const gaps = taken.map((a, i) => ({ start: a, size: (i + 1 < taken.length ? taken[i + 1] : taken[0] + 360) - a, k: 0 }));
  for (let i = 0; i < n; i++) {
    const g = gaps.reduce((b, x) => (x.size / (x.k + 1) > b.size / (b.k + 1) + 1e-6 ? x : b), gaps[0]);
    g.k++;
  }
  return gaps.flatMap(g => Array.from({ length: g.k }, (_, j) => wrap(g.start + (g.size * (j + 1)) / (g.k + 1))));
}
