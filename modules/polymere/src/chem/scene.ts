// Szene der Atom-Ansicht: Atome (mit Lage in Bindungslängen), Bindungen, Elektronen als Punkte, Pfeile.
// Ein Mechanismus ist eine Folge von Schnappschüssen (Keys); zwischen zwei Schnappschüssen wird weich übergeblendet:
// Atome gleiten (gleiche Kennung), Bindungen und Punkte blenden ein bzw. aus, Zweifach- wird zu Einfachbindung.
// Winkel in Grad wie im SVG: 0 = rechts, 90 = unten, −90 = oben.

import type { Hue } from "./data.ts";

export interface Pt { x: number; y: number }

export interface Atom {
  id: string;
  el: string;
  x: number;
  y: number;
  /** Beschriftung (Standard: Elementsymbol); "" = nicht beschriftet (Ecke eines Benzolrings) */
  text?: string;
  /** freie Elektronenpaare als Striche (Richtungen in Grad) */
  lp?: number[];
  /** Ladung ±1 und Richtung des Ladungszeichens */
  q?: number;
  qa?: number;
  /** Baustein (Monomer-Einheit) und seine Farbe – für die Hinterlegung „Kügelchen“ */
  unit?: number;
  hue?: Hue;
  /** Deckkraft 0…1 */
  op?: number;
  /** freie Koordinationsstelle (Ziegler-Natta): gestrichelter Kreis statt Atom */
  vac?: boolean;
  /** hervorgehoben (z. B. reagierende Gruppe) */
  hl?: boolean;
}

export type BondKind = "coord" | "ts" | "wedge" | "hash";
export interface Bond { a: string; b: string; o: number; k?: BondKind; ring?: string; op?: number; hl?: boolean }
/** Elektron (Punkt) – bewegt sich zwischen Schnappschüssen */
export interface Dot { id: string; x: number; y: number; op?: number }

/** Ort für Pfeile: Atom (mit Versatz), Punkt auf einer Bindung, Elektron oder fester Punkt */
export type Anchor =
  | { a: string; ang?: number; r?: number }
  | { b: [string, string]; f?: number; off?: number }
  | { d: string }
  | { p: Pt };
/** gebogener Pfeil: halb = ein Elektron (Angelhaken), voll = Elektronenpaar */
export interface Arrow { from: Anchor; to: Anchor; half?: boolean; bend?: number }

/** Beschriftung frei in der Szene (z. B. „H₂O“ bei abgespaltenem Wasser, „+“ zwischen Molekülen) */
export interface Note { id: string; x: number; y: number; text: string; op?: number; tone?: "plain" | "gas" | "bad" | "ok"; bracket?: number }

export interface Snap {
  atoms: Atom[];
  bonds: Bond[];
  dots: Dot[];
  notes: Note[];
  /** Ringe für die Doppelbindungen innen (Kennung → Atome) */
  rings: Record<string, string[]>;
  /** Ausschnitt: diese Atome sollen sichtbar sein (sonst alle) */
  focus?: string[];
  /** Ausschnitt mindestens über diese x-Spanne (Platz für das nächste Molekül) */
  span?: [number, number];
}

export const bkey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
export const deg = (r: number) => (r * 180) / Math.PI;
export const rad = (d: number) => (d * Math.PI) / 180;
export const dirOf = (ang: number): Pt => ({ x: Math.cos(rad(ang)), y: Math.sin(rad(ang)) });

/** Arbeitsstand einer Szene – Schnappschüsse sind tiefe Kopien */
export class Scene {
  atoms = new Map<string, Atom>();
  bonds = new Map<string, Bond>();
  dots = new Map<string, Dot>();
  notes = new Map<string, Note>();
  rings: Record<string, string[]> = {};
  focus?: string[];
  span?: [number, number];

  add(a: Atom): string { this.atoms.set(a.id, { ...a }); return a.id; }
  has(id: string) { return this.atoms.has(id); }
  at(id: string): Atom {
    const a = this.atoms.get(id);
    if (!a) throw new Error(`Atom ${id} fehlt`);
    return a;
  }
  set(id: string, p: Partial<Atom>) { Object.assign(this.at(id), p); }
  bond(a: string, b: string, o = 1, k?: BondKind, ring?: string) { this.bonds.set(bkey(a, b), { a, b, o, ...(k ? { k } : {}), ...(ring ? { ring } : {}) }); }
  bondOf(a: string, b: string) { return this.bonds.get(bkey(a, b)); }
  unbond(a: string, b: string) { this.bonds.delete(bkey(a, b)); }
  order(a: string, b: string, o: number) { const x = this.bondOf(a, b); if (x) x.o = o; else this.bond(a, b, o); }
  remove(id: string) {
    this.atoms.delete(id);
    for (const [k, b] of this.bonds) if (b.a === id || b.b === id) this.bonds.delete(k);
  }
  /** Nachbarn eines Atoms */
  nb(id: string): string[] {
    const out: string[] = [];
    for (const b of this.bonds.values()) if (b.k !== "coord" && b.k !== "ts") { if (b.a === id) out.push(b.b); else if (b.b === id) out.push(b.a); }
    return out;
  }
  /** alle Atome, die (über Bindungen) mit id verbunden sind */
  component(id: string): string[] {
    const seen = new Set([id]), stack = [id];
    while (stack.length) for (const n of this.nb(stack.pop()!)) if (!seen.has(n)) { seen.add(n); stack.push(n); }
    return [...seen];
  }
  move(ids: string[], dx: number, dy: number) {
    for (const id of ids) { const a = this.atoms.get(id); if (a) { a.x += dx; a.y += dy; } }
  }
  /** um den Punkt c drehen (Grad) */
  rotate(ids: string[], c: Pt, ang: number) {
    const co = Math.cos(rad(ang)), si = Math.sin(rad(ang));
    for (const id of ids) {
      const a = this.atoms.get(id);
      if (!a) continue;
      const x = a.x - c.x, y = a.y - c.y;
      a.x = c.x + x * co - y * si; a.y = c.y + x * si + y * co;
      if (a.lp) a.lp = a.lp.map(l => l + ang);
      if (a.qa !== undefined) a.qa += ang;
    }
  }
  dot(id: string, x: number, y: number) { this.dots.set(id, { id, x, y }); }
  /** Elektron in Richtung ang neben einem Atom (Radikal-Elektron) */
  dotAt(id: string, atom: string, ang: number, r = 0.36) { const a = this.at(atom), d = dirOf(ang); this.dot(id, a.x + d.x * r, a.y + d.y * r); }
  undot(id: string) { this.dots.delete(id); }
  note(n: Note) { this.notes.set(n.id, { ...n }); }
  unnote(id: string) { this.notes.delete(id); }
  ring(id: string, atoms: string[]) { this.rings[id] = atoms; }

  /** Richtungen der Bindungen eines Atoms (Grad) */
  bondAngles(id: string): number[] {
    const a = this.at(id);
    const out: number[] = [];
    for (const b of this.bonds.values()) {
      if (b.k === "ts") continue;
      const o = b.a === id ? b.b : b.b === id ? b.a : null;
      if (!o) continue;
      const p = this.atoms.get(o);
      if (p) out.push(deg(Math.atan2(p.y - a.y, p.x - a.x)));
    }
    return out;
  }
  /** n freie Elektronenpaare in die größten Lücken zwischen den Bindungen legen */
  autoLp(id: string, n: number, start = -90) {
    this.at(id).lp = spread(this.bondAngles(id), n, start);
  }

  snap(): Snap {
    return {
      atoms: [...this.atoms.values()].map(a => ({ ...a, ...(a.lp ? { lp: [...a.lp] } : {}) })),
      bonds: [...this.bonds.values()].map(b => ({ ...b })),
      dots: [...this.dots.values()].map(d => ({ ...d })),
      notes: [...this.notes.values()].map(n => ({ ...n })),
      rings: Object.fromEntries(Object.entries(this.rings).map(([k, v]) => [k, [...v]])),
      ...(this.focus ? { focus: [...this.focus] } : {}),
      ...(this.span ? { span: [...this.span] as [number, number] } : {}),
    };
  }
  static from(s: Snap): Scene {
    const sc = new Scene();
    for (const a of s.atoms) sc.atoms.set(a.id, { ...a, ...(a.lp ? { lp: [...a.lp] } : {}) });
    for (const b of s.bonds) sc.bonds.set(bkey(b.a, b.b), { ...b });
    for (const d of s.dots) sc.dots.set(d.id, { ...d });
    for (const n of s.notes) sc.notes.set(n.id, { ...n });
    sc.rings = Object.fromEntries(Object.entries(s.rings).map(([k, v]) => [k, [...v]]));
    if (s.focus) sc.focus = [...s.focus];
    if (s.span) sc.span = [...s.span];
    return sc;
  }
}

/** k Richtungen in die Lücken zwischen belegten Winkeln verteilen (größte Lücke zuerst) */
export function spread(taken: number[], k: number, start = 0): number[] {
  if (!k) return [];
  if (!taken.length) return Array.from({ length: k }, (_, i) => start + (360 * i) / k);
  const s = taken.map(t => ((t % 360) + 360) % 360).sort((a, b) => a - b);
  const gaps = s.map((v, i) => ({ from: v, size: i + 1 < s.length ? s[i + 1] - v : s[0] + 360 - v, n: 0 }));
  for (let i = 0; i < k; i++) {
    let best = gaps[0];
    for (const g of gaps) if (g.size / (g.n + 1) > best.size / (best.n + 1) + 1e-6) best = g;
    best.n++;
  }
  return gaps.flatMap(g => Array.from({ length: g.n }, (_, i) => g.from + (g.size * (i + 1)) / (g.n + 1)));
}

// ── Ablauf: Schnappschüsse mit Haltezeit, Übergang und Pfeilen ─────────────────

export interface Key {
  snap: Snap;
  /** so lange stehen bleiben (ms), dann zum nächsten Schlüssel übergehen */
  hold: number;
  /** Dauer des Übergangs zum nächsten Schlüssel (ms) */
  move: number;
  /** Pfeile (Elektronenfluss), sichtbar während hold, blenden im Übergang aus */
  arrows?: Arrow[];
}
export type Clip = Key[];

export const clipLength = (c: Clip) => c.reduce((s, k, i) => s + k.hold + (i < c.length - 1 ? k.move : 0), 0);

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpAng = (a: number, b: number, t: number) => { const d = ((((b - a) % 360) + 540) % 360) - 180; return a + d * t; };

/** gezeichnete Bindung: o volle Linien, bis o2 Linien mit Deckkraft ex (Ordnung ändert sich), op für alle */
export type PBond = Bond & { op: number; o2: number; ex: number };

/** gezeichneter Zustand (alles mit Deckkraft) */
export interface Pose {
  atoms: Atom[];
  bonds: PBond[];
  dots: Dot[];
  notes: Note[];
  rings: Record<string, string[]>;
  arrows: { arrow: Arrow; op: number }[];
  focus?: string[];
  /** zweiter Ausschnitt (Übergang) */
  focus2?: string[];
  ft: number;
}

/** Zustand eines Ablaufs zur Zeit ms */
export function poseAt(clip: Clip, ms: number): Pose {
  let t = Math.max(0, ms);
  for (let i = 0; i < clip.length; i++) {
    const k = clip[i], last = i === clip.length - 1;
    if (t <= k.hold || last) {
      const fade = Math.min(1, t / 250);
      return { ...still(k.snap), arrows: (k.arrows ?? []).map(arrow => ({ arrow, op: fade })) };
    }
    t -= k.hold;
    if (t <= k.move) {
      const u = k.move ? t / k.move : 1;
      const p = blend(k.snap, clip[i + 1].snap, ease(Math.min(1, Math.max(0, (u - 0.08) / 0.92))));
      p.arrows = (k.arrows ?? []).map(arrow => ({ arrow, op: Math.max(0, 1 - u / 0.45) }));
      return p;
    }
    t -= k.move;
  }
  return still(clip[clip.length - 1].snap);
}

export function still(s: Snap): Pose {
  return {
    atoms: s.atoms.map(a => ({ ...a, op: a.op ?? 1 })), bonds: s.bonds.map(b => ({ ...b, op: b.op ?? 1, o2: b.o, ex: 1 })),
    dots: s.dots.map(d => ({ ...d, op: d.op ?? 1 })), notes: s.notes.map(n => ({ ...n, op: n.op ?? 1 })), rings: s.rings, arrows: [], focus: s.focus, ft: 0,
  };
}

/** Überblendung zweier Schnappschüsse (t = 0 … 1, schon geglättet) */
export function blend(a: Snap, b: Snap, t: number): Pose {
  const bm = new Map(b.atoms.map(x => [x.id, x]));
  const am = new Map(a.atoms.map(x => [x.id, x]));
  const atoms: Atom[] = [];
  for (const x of a.atoms) {
    const y = bm.get(x.id), xo = x.op ?? 1;
    if (!y) { atoms.push({ ...x, op: xo * (1 - t) }); continue; }
    const yo = y.op ?? 1;
    atoms.push({
      ...(t < 0.5 ? x : y),
      x: lerp(x.x, y.x, t), y: lerp(x.y, y.y, t), op: lerp(xo, yo, t),
      // freie Paare und Ladung: gleiche Anzahl → drehen, sonst umschalten
      lp: x.lp && y.lp && x.lp.length === y.lp.length ? x.lp.map((l, i) => lerpAng(l, y.lp![i], t)) : (t < 0.5 ? x.lp : y.lp),
      qa: x.qa !== undefined && y.qa !== undefined ? lerpAng(x.qa, y.qa, t) : (t < 0.5 ? x.qa : y.qa),
      q: t < 0.5 ? x.q : y.q,
    });
  }
  for (const y of b.atoms) if (!am.has(y.id)) atoms.push({ ...y, op: (y.op ?? 1) * t });

  // Bindungen: gleiche Ordnung bleibt, Änderungen blenden (o2 = Ordnung der zweiten Linie usw.)
  const bb = new Map(b.bonds.map(x => [bkey(x.a, x.b), x]));
  const ab = new Map(a.bonds.map(x => [bkey(x.a, x.b), x]));
  const bonds: PBond[] = [];
  for (const x of a.bonds) {
    const y = bb.get(bkey(x.a, x.b));
    if (!y) { bonds.push({ ...x, op: (x.op ?? 1) * (1 - t), o2: x.o, ex: 1 }); continue; }
    if (x.k !== y.k) {
      bonds.push({ ...x, op: (x.op ?? 1) * (1 - t), o2: x.o, ex: 1 });
      bonds.push({ ...y, op: (y.op ?? 1) * t, o2: y.o, ex: 1 });
      continue;
    }
    // Ordnung ändert sich: volle Linien = kleinere Ordnung, die übrigen blenden ein bzw. aus
    bonds.push({ ...y, o: Math.min(x.o, y.o), o2: Math.max(x.o, y.o), op: lerp(x.op ?? 1, y.op ?? 1, t), ex: x.o > y.o ? 1 - t : x.o < y.o ? t : 1 });
  }
  for (const y of b.bonds) if (!ab.has(bkey(y.a, y.b))) bonds.push({ ...y, op: (y.op ?? 1) * t, o2: y.o, ex: 1 });

  const bd = new Map(b.dots.map(x => [x.id, x]));
  const ad = new Map(a.dots.map(x => [x.id, x]));
  const dots: Dot[] = [];
  for (const x of a.dots) {
    const y = bd.get(x.id);
    dots.push(y ? { id: x.id, x: lerp(x.x, y.x, t), y: lerp(x.y, y.y, t), op: lerp(x.op ?? 1, y.op ?? 1, t) } : { ...x, op: (x.op ?? 1) * (1 - t) });
  }
  for (const y of b.dots) if (!ad.has(y.id)) dots.push({ ...y, op: (y.op ?? 1) * t });

  const bn = new Map(b.notes.map(x => [x.id, x]));
  const an = new Map(a.notes.map(x => [x.id, x]));
  const notes: Note[] = [];
  for (const x of a.notes) {
    const y = bn.get(x.id);
    notes.push(y ? { ...y, x: lerp(x.x, y.x, t), y: lerp(x.y, y.y, t), op: lerp(x.op ?? 1, y.op ?? 1, t) } : { ...x, op: (x.op ?? 1) * (1 - t) });
  }
  for (const y of b.notes) if (!an.has(y.id)) notes.push({ ...y, op: (y.op ?? 1) * t });

  return { atoms, bonds, dots, notes, rings: { ...a.rings, ...b.rings }, arrows: [], focus: a.focus, focus2: b.focus, ft: t };
}

// ── Ausschnitt ─────────────────────────────────────────────────────────────────

export interface Box { x0: number; y0: number; x1: number; y1: number }

/** Umriss der (fokussierten, sichtbaren) Atome samt Beschriftung */
export function boxOf(atoms: Atom[], focus?: string[]): Box | null {
  const f = focus ? new Set(focus) : null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const a of atoms) {
    if ((a.op ?? 1) < 0.05 || (f && !f.has(a.id))) continue;
    const w = labelHalf(a);
    x0 = Math.min(x0, a.x - w - 0.15); x1 = Math.max(x1, a.x + w + 0.15);
    y0 = Math.min(y0, a.y - 0.45); y1 = Math.max(y1, a.y + 0.45);
  }
  return Number.isFinite(x0) ? { x0, y0, x1, y1 } : null;
}

/** Fokus um kleine Anhängsel erweitern: Hängt an einem Fokus-Atom außerhalb nur eine kleine Gruppe (–OH, –Cl, Benzolring, höchstens
 *  `max` Atome), gehört sie ganz ins Bild – so wird nie eine reagierende Gruppe mitten im Atom abgeschnitten. Längere Ketten bleiben draußen
 *  (die Zeichnung endet dort an einer Wellenlinie). */
export function expandFocus(s: Snap, max = 7): string[] | undefined {
  if (!s.focus) return undefined;
  const vis = new Set(s.atoms.filter(a => (a.op ?? 1) >= 0.05).map(a => a.id));
  const nb = new Map<string, string[]>();
  for (const b of s.bonds) {
    if ((b.op ?? 1) < 0.05 || !vis.has(b.a) || !vis.has(b.b)) continue;
    nb.set(b.a, [...(nb.get(b.a) ?? []), b.b]); nb.set(b.b, [...(nb.get(b.b) ?? []), b.a]);
  }
  const f = new Set(s.focus);
  // nur Gruppen nahe am Ausschnitt (nicht das ferne Ende eines langen Moleküls)
  const fa = s.atoms.filter(a => f.has(a.id));
  if (!fa.length) return s.focus;
  const bx0 = Math.min(...fa.map(a => a.x)) - 2.2, bx1 = Math.max(...fa.map(a => a.x)) + 2.2;
  const pos = new Map(s.atoms.map(a => [a.id, a]));
  for (const a of s.focus) for (const x of nb.get(a) ?? []) {
    if (f.has(x)) continue;
    // Gruppe hinter x (ohne über a zurückzugehen)
    const seen = new Set([a, x]), stack = [x], group = [x];
    while (stack.length && group.length <= max) {
      // nur Atome außerhalb des Fokus sammeln (ein halb sichtbarer Ring wird so ganz aufgenommen)
      for (const y of nb.get(stack.pop()!) ?? []) if (!seen.has(y) && !f.has(y)) { seen.add(y); stack.push(y); group.push(y); }
    }
    if (group.length <= max && group.every(y => { const p = pos.get(y)!; return p.x >= bx0 && p.x <= bx1; })) group.forEach(y => f.add(y));
  }
  return [...f];
}

/** Umriss einer Beschriftung (Zeilen mit „\n“; Zeichenbreite ≈ 0,26 Bindungslängen, Zeilenhöhe ≈ 0,5) */
export function noteBox(n: Note): Box {
  const lines = n.text.split("\n"), w = Math.max(...lines.map(l => l.length)) * 0.13 + 0.1, h = lines.length * 0.26 + 0.1;
  return { x0: n.x - w, x1: n.x + w, y0: n.y - h, y1: n.y + h };
}

/** Ausschnitt eines Schnappschusses: Fokus-Atome (samt kleiner Anhängsel), mindestens über die x-Spanne; längere Beschriftungen ganz im Bild */
export function snapBox(s: Snap): Box | null {
  let b = boxOf(s.atoms, expandFocus(s));
  if (b) for (const n of s.notes) if ((n.op ?? 1) > 0.05 && !n.bracket && n.text.length > 4) {
    const q = noteBox(n);
    b = { x0: Math.min(b.x0, q.x0), y0: Math.min(b.y0, q.y0), x1: Math.max(b.x1, q.x1), y1: Math.max(b.y1, q.y1) };
  }
  if (!b || !s.span) return b;
  return { ...b, x0: Math.min(b.x0, s.span[0]), x1: Math.max(b.x1, s.span[1]) };
}

/** ruhiger Ausschnitt für einen ganzen Ablauf: Umriss aller Schnappschüsse (mit Beschriftungen) */
export function clipBox(c: Clip): Box | null {
  let out: Box | null = null;
  const grow = (b: Box | null) => { if (b) out = out ? { x0: Math.min(out.x0, b.x0), y0: Math.min(out.y0, b.y0), x1: Math.max(out.x1, b.x1), y1: Math.max(out.y1, b.y1) } : b; };
  for (const k of c) {
    grow(snapBox(k.snap));
    for (const n of k.snap.notes) if ((n.op ?? 1) > 0.05) grow(n.text.length > 4 && !n.bracket ? noteBox(n) : { x0: n.x - 0.5, x1: n.x + 0.5, y0: n.y - 0.35, y1: n.y + 0.35 });
  }
  return out;
}

/** halbe Breite der Beschriftung in Bindungslängen */
export function labelHalf(a: Atom): number {
  const t = a.text ?? a.el;
  if (!t) return 0.05;
  let w = 0;
  for (const ch of t) w += /[₀-₉⁺⁻]/.test(ch) ? 0.17 : /[A-Z]/.test(ch) ? 0.3 : /[a-z]/.test(ch) ? 0.23 : 0.2;
  return (a.el === "H" && !a.text ? 0.8 : 1) * w / 2;
}

/** Ausschnitt mit Rand, auf das Seitenverhältnis der Bühne gebracht (Mindestgröße, damit kleine Szenen nicht riesig werden) */
export function fitBox(b: Box, aspect: number, minW = 6.5, minH = 4.2, pad = 0.55): Box {
  let x0 = b.x0 - pad, x1 = b.x1 + pad, y0 = b.y0 - pad, y1 = b.y1 + pad;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let w = Math.max(x1 - x0, minW), h = Math.max(y1 - y0, minH);
  if (w / h < aspect) w = h * aspect; else h = w / aspect;
  x0 = cx - w / 2; x1 = cx + w / 2; y0 = cy - h / 2; y1 = cy + h / 2;
  return { x0, y0, x1, y1 };
}

export const lerpBox = (a: Box, b: Box, t: number): Box => ({ x0: lerp(a.x0, b.x0, t), y0: lerp(a.y0, b.y0, t), x1: lerp(a.x1, b.x1, t), y1: lerp(a.y1, b.y1, t) });

/** Ort eines Ankers im gezeichneten Zustand */
export function anchorPt(p: { atoms: Atom[]; dots: Dot[] }, an: Anchor): Pt | null {
  if ("p" in an) return an.p;
  if ("d" in an) { const d = p.dots.find(x => x.id === an.d); return d ? { x: d.x, y: d.y } : null; }
  if ("a" in an) {
    const a = p.atoms.find(x => x.id === an.a);
    if (!a) return null;
    if (an.ang === undefined) return { x: a.x, y: a.y };
    const d = dirOf(an.ang), r = an.r ?? 0.42;
    return { x: a.x + d.x * r, y: a.y + d.y * r };
  }
  const [i, j] = an.b, A = p.atoms.find(x => x.id === i), B = p.atoms.find(x => x.id === j);
  if (!A || !B) return null;
  const f = an.f ?? 0.5, x = lerp(A.x, B.x, f), y = lerp(A.y, B.y, f);
  if (!an.off) return { x, y };
  const dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy) || 1;
  return { x: x - (dy / l) * an.off, y: y + (dx / l) * an.off };
}
