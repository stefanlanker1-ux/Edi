// Elektronenpaarbindung: Moleküle als Atome auf einem Raster mit Bindungen zwischen Nachbarn.
// Berechnet Lewis-Darstellung (freie Elektronen, Paare), Oktett, Formel, Name, Geometrie (EPA-Modell) und Polarität.

import { ELEMENTS } from "./elements.ts";

export const VALENCE: Record<string, number> = { H: 1, C: 4, N: 5, O: 6, F: 7, Cl: 7, Br: 7, I: 7, S: 6, P: 5 };
export const BONDING_ELEMENTS = Object.keys(VALENCE);

export interface MolAtom { id: number; el: string; x: number; y: number }
export interface MolBond { a: number; b: number; order: number }
export interface Molecule { atoms: MolAtom[]; bonds: MolBond[] }

export const SIDES = ["up", "right", "down", "left"] as const;
export type Side = (typeof SIDES)[number];
const DIR: Record<Side, [number, number]> = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };

const bySymbol = Object.fromEntries(ELEMENTS.map(e => [e.symbol, e]));
export const en = (el: string) => bySymbol[el]?.en ?? 0;
export const elementName = (el: string) => bySymbol[el]?.name ?? el;
/** Edelgaskonfiguration: 2 Elektronen für H (Duett), sonst 8 (Oktett) */
export const target = (el: string) => (el === "H" ? 2 : 8);

export const adjacent = (p: MolAtom, q: MolAtom) => Math.abs(p.x - q.x) + Math.abs(p.y - q.y) === 1;
export const bondKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

export function sideOf(from: MolAtom, to: MolAtom): Side {
  const dx = to.x - from.x, dy = to.y - from.y;
  return dx === 1 ? "right" : dx === -1 ? "left" : dy === 1 ? "down" : "up";
}

export const bondsOf = (m: Molecule, id: number) => m.bonds.filter(b => b.a === id || b.b === id);
export const bondSum = (m: Molecule, id: number) => bondsOf(m, id).reduce((s, b) => s + b.order, 0);
const atom = (m: Molecule, id: number) => m.atoms.find(a => a.id === id)!;

/**
 * Elektronen eines Atoms: nicht bindende Elektronen als Paare und einzelne (ungepaarte) Elektronen.
 * Einzelne Elektronen = so viele, wie bis zum Oktett noch Bindungen fehlen („noch frei für Bindungen“).
 */
export function electronsOf(m: Molecule, id: number) {
  const a = atom(m, id);
  const V = VALENCE[a.el], B = bondSum(m, id);
  const lone = V - B;
  const singles = Math.max(0, Math.min(lone, target(a.el) - lone - 2 * B));
  const pairs = (lone - singles) / 2;
  const around = lone + 2 * B;
  return { valence: V, bonds: B, lone, singles, pairs, around, complete: around === target(a.el) };
}

/** Kann zwischen zwei Nachbarn eine (weitere) Bindung entstehen? Beide brauchen ein ungepaartes Elektron. */
export function canBond(m: Molecule, a: number, b: number) {
  return adjacent(atom(m, a), atom(m, b)) && electronsOf(m, a).singles > 0 && electronsOf(m, b).singles > 0;
}

/**
 * Lewis-Belegung der vier Seiten eines Atoms: gebundene Seiten, Paare (2), einzelne Elektronen (1), leer (0).
 * Einzelne Elektronen zeigen bevorzugt zu Nachbarn, mit denen noch keine Bindung besteht.
 */
export function sideLayout(m: Molecule, id: number): Record<Side, { bond: number } | { lone: number }> {
  const a = atom(m, id);
  const e = electronsOf(m, id);
  const out = {} as Record<Side, { bond: number } | { lone: number }>;
  const free: Side[] = [];
  for (const s of SIDES) {
    const [dx, dy] = DIR[s];
    const nb = m.atoms.find(o => o.x === a.x + dx && o.y === a.y + dy);
    const bond = nb && m.bonds.find(b => bondKey(b.a, b.b) === bondKey(id, nb.id));
    if (bond) out[s] = { bond: bond.order }; else free.push(s);
  }
  const facing = (s: Side) => { const [dx, dy] = DIR[s]; return m.atoms.some(o => o.x === a.x + dx && o.y === a.y + dy); };
  // Reihenfolge: Seiten zu Nachbarn zuerst (für einzelne Elektronen), dann rechts, links, oben, unten
  const pref: Side[] = ["right", "left", "up", "down"];
  free.sort((p, q) => Number(facing(q)) - Number(facing(p)) || pref.indexOf(p) - pref.indexOf(q));
  let singles = e.singles, pairs = e.pairs;
  for (const s of free) {
    if (singles > 0) { out[s] = { lone: 1 }; singles--; }
    else if (pairs > 0) { out[s] = { lone: 2 }; pairs--; }
    else out[s] = { lone: 0 };
  }
  // Mehr Elektronen als freie Seiten (kommt bei gültigen Molekülen nicht vor): auf freie Seiten aufstocken
  for (const s of free) {
    const v = out[s] as { lone: number };
    while (v.lone < 2 && (singles > 0 || pairs > 0)) { v.lone++; if (singles > 0) singles--; else pairs--; }
  }
  return out;
}

/** Sind alle Atome miteinander verbunden? */
export function connected(m: Molecule) {
  if (!m.atoms.length) return false;
  const seen = new Set([m.atoms[0].id]);
  const stack = [m.atoms[0].id];
  while (stack.length) {
    const id = stack.pop()!;
    for (const b of bondsOf(m, id)) {
      const o = b.a === id ? b.b : b.a;
      if (!seen.has(o)) { seen.add(o); stack.push(o); }
    }
  }
  return seen.size === m.atoms.length;
}

/** Fertiges Molekül: mindestens 2 Atome, zusammenhängend, alle mit Edelgaskonfiguration */
export const isComplete = (m: Molecule) => m.atoms.length >= 2 && connected(m) && m.atoms.every(a => electronsOf(m, a.id).complete);

// Reihenfolge der Elemente in Summenformeln (IUPAC): elektropositiv zuerst
const ORDER = ["B", "Si", "C", "Sb", "As", "P", "N", "H", "Te", "Se", "S", "At", "I", "Br", "Cl", "O", "F"];

/**
 * Summenformel mit Ziffern, z. B. "NH3" (Anzeige mit toSubscript / <Formula>).
 * Kohlenstoffverbindungen nach Hill: C, H, dann alphabetisch (CH₄O, C₂H₆O); sonst nach Elektronegativität (NH₃, H₂O, HCl).
 */
export function sumFormula(m: Molecule): string {
  const count: Record<string, number> = {};
  for (const a of m.atoms) count[a.el] = (count[a.el] ?? 0) + 1;
  const hill = (el: string) => (el === "C" ? "0" : el === "H" ? "1" : "2" + el);
  const order = count.C ? (p: string, q: string) => hill(p).localeCompare(hill(q)) : (p: string, q: string) => ORDER.indexOf(p) - ORDER.indexOf(q);
  return Object.keys(count).sort(order).map(el => el + (count[el] > 1 ? count[el] : "")).join("");
}

/** Schlüssel, der gleiche Moleküle unabhängig von der Lage auf dem Raster erkennt */
export function canonicalKey(m: Molecule): string {
  return m.atoms.map(a => {
    const nb = bondsOf(m, a.id).map(b => atom(m, b.a === a.id ? b.b : b.a).el + b.order).sort().join(",");
    return `${a.el}[${nb}]`;
  }).sort().join(";");
}

/**
 * Gemessene Bindungswinkel, Schlüssel: Zentralatom + Bindungspartner (sortiert).
 * Bei trigonal-planaren Zentren ist es der Winkel zwischen den beiden gleichen Partnern (H–C–H).
 */
export const REAL_ANGLES: Record<string, number> = {
  "O:H,H": 104.5, "S:H,H": 92.1, "Se:H,H": 90.6, "O:F,F": 103.1, "O:Cl,Cl": 110.9, "S:Cl,Cl": 102.7,
  "O:C,H": 108.9, "O:H,O": 94.8,
  "N:H,H,H": 107, "P:H,H,H": 93.5, "As:H,H,H": 92.1, "N:F,F,F": 102.2, "N:Cl,Cl,Cl": 107.1, "P:Cl,Cl,Cl": 100.3,
  "C:C,H,H": 117.4, "C:H,H,O": 116.5,
};
/** Winkel mit Komma, z. B. „104,5°“; der Tetraederwinkel wird als 109,5° geschrieben */
export const formatAngle = (deg: number) =>
  `${(Math.round(deg * 10) / 10).toLocaleString("de-AT", { maximumFractionDigits: 1 })}°`;

export type Geometry = "linear" | "gewinkelt" | "trigonal-planar" | "trigonal-pyramidal" | "tetraedrisch";
export interface Shape { center: number; geometry: Geometry; angle: string; pairs: number; neighbors: number }

/** Geometrie um ein Zentralatom nach dem Elektronenpaarabstoßungs-Modell (EPA/VSEPR) */
export function shapeAt(m: Molecule, id: number): Shape | null {
  const n = bondsOf(m, id).length;
  if (n < 2) return null;
  const p = electronsOf(m, id).pairs;
  const steric = n + p;
  const a = atom(m, id).el;
  // gemessener Winkel, falls bekannt (H₂O 104,5°, NH₃ 107°, H₂S 92,1°, PH₃ 93,5° …)
  const nbEls = bondsOf(m, id).map(b => atom(m, b.a === id ? b.b : b.a).el).sort();
  const real = REAL_ANGLES[`${a}:${nbEls.join(",")}`];
  let geometry: Geometry, angle: string;
  if (steric === 4) {
    if (n === 4) { geometry = "tetraedrisch"; angle = "109,5°"; }
    else if (n === 3) { geometry = "trigonal-pyramidal"; angle = real ? formatAngle(real) : a === "N" ? "ca. 107°" : "kleiner als 109,5°"; }
    else { geometry = "gewinkelt"; angle = real ? formatAngle(real) : a === "O" ? "ca. 104,5°" : "kleiner als 109,5°"; }
  } else if (steric === 3) {
    if (n === 3) { geometry = "trigonal-planar"; angle = "120°"; }
    else { geometry = "gewinkelt"; angle = "etwas kleiner als 120°"; }
  } else { geometry = "linear"; angle = "180°"; }
  return { center: id, geometry, angle, pairs: p, neighbors: n };
}

export interface PolarBond { a: number; b: number; delta: number; plus: number; minus: number }

/** Polare Bindungen (ΔEN ≥ 0,4) mit δ+ und δ− */
export function polarBonds(m: Molecule): PolarBond[] {
  return m.bonds.map(b => {
    const ea = en(atom(m, b.a).el), eb = en(atom(m, b.b).el);
    const delta = Math.round(Math.abs(ea - eb) * 100) / 100;
    return { a: b.a, b: b.b, delta, plus: ea < eb ? b.a : b.b, minus: ea < eb ? b.b : b.a };
  }).filter(p => p.delta >= 0.4);
}

/**
 * Schwach polar: keine Bindung mit ΔEN ≥ 0,4, aber gewinkelter/pyramidaler Bau mit fast polaren Bindungen (ΔEN ≥ 0,3),
 * z. B. H₂S (ΔEN 0,38) – gemessen hat H₂S ein kleines Dipolmoment.
 */
export function isWeaklyPolar(m: Molecule): boolean {
  if (polarBonds(m).length) return false;
  const centers = m.atoms.filter(a => bondsOf(m, a.id).length >= 2);
  if (centers.length !== 1) return false;
  const s = shapeAt(m, centers[0].id)!;
  const maxDelta = Math.max(...m.bonds.map(b => Math.abs(en(atom(m, b.a).el) - en(atom(m, b.b).el))));
  return s.pairs > 0 && maxDelta >= 0.3;
}

/**
 * Polarität des Moleküls (vereinfacht für die Schule): ohne polare Bindungen unpolar;
 * mit einem Zentralatom, gleichen Nachbarn und symmetrischer Geometrie ohne freie Paare ebenfalls unpolar; sonst polar.
 */
export function isPolar(m: Molecule): boolean {
  if (!polarBonds(m).length) return false;
  const centers = m.atoms.filter(a => bondsOf(m, a.id).length >= 2);
  if (centers.length === 1) {
    const c = centers[0], s = shapeAt(m, c.id)!;
    const nbEls = new Set(bondsOf(m, c.id).map(b => atom(m, b.a === c.id ? b.b : b.a).el));
    if (nbEls.size === 1 && s.pairs === 0 && ["linear", "trigonal-planar", "tetraedrisch"].includes(s.geometry)) return false;
  }
  return true;
}

// ── Bekannte Moleküle ───────────────────────────────────────────────────────

export interface KnownMolecule {
  id: string;
  name: string;
  /** Schreibweise im Unterricht, z. B. "H2O", "CH3OH" */
  formula: string;
  /** Aufbau auf dem Raster: [Element, x, y]; Bindungen: [Index, Index, Ordnung] */
  atoms: [string, number, number][];
  bonds: [number, number, number][];
  os?: boolean;
}

export const KNOWN: KnownMolecule[] = [
  { id: "H2", name: "Wasserstoff", formula: "H2", atoms: [["H", 0, 0], ["H", 1, 0]], bonds: [[0, 1, 1]] },
  { id: "Cl2", name: "Chlor", formula: "Cl2", atoms: [["Cl", 0, 0], ["Cl", 1, 0]], bonds: [[0, 1, 1]] },
  { id: "F2", name: "Fluor", formula: "F2", atoms: [["F", 0, 0], ["F", 1, 0]], bonds: [[0, 1, 1]] },
  { id: "O2", name: "Sauerstoff", formula: "O2", atoms: [["O", 0, 0], ["O", 1, 0]], bonds: [[0, 1, 2]] },
  { id: "N2", name: "Stickstoff", formula: "N2", atoms: [["N", 0, 0], ["N", 1, 0]], bonds: [[0, 1, 3]] },
  { id: "HCl", name: "Chlorwasserstoff", formula: "HCl", atoms: [["H", 0, 0], ["Cl", 1, 0]], bonds: [[0, 1, 1]] },
  { id: "HF", name: "Fluorwasserstoff", formula: "HF", atoms: [["H", 0, 0], ["F", 1, 0]], bonds: [[0, 1, 1]] },
  { id: "H2O", name: "Wasser", formula: "H2O", atoms: [["O", 1, 0], ["H", 0, 0], ["H", 1, 1]], bonds: [[0, 1, 1], [0, 2, 1]] },
  { id: "NH3", name: "Ammoniak", formula: "NH3", atoms: [["N", 1, 1], ["H", 0, 1], ["H", 2, 1], ["H", 1, 2]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
  { id: "CH4", name: "Methan", formula: "CH4", atoms: [["C", 1, 1], ["H", 1, 0], ["H", 0, 1], ["H", 2, 1], ["H", 1, 2]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
  { id: "CO2", name: "Kohlenstoffdioxid", formula: "CO2", atoms: [["O", 0, 0], ["C", 1, 0], ["O", 2, 0]], bonds: [[0, 1, 2], [1, 2, 2]] },
  { id: "CCl4", name: "Tetrachlormethan", formula: "CCl4", atoms: [["C", 1, 1], ["Cl", 1, 0], ["Cl", 0, 1], ["Cl", 2, 1], ["Cl", 1, 2]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
  { id: "H2S", name: "Schwefelwasserstoff", formula: "H2S", atoms: [["S", 1, 0], ["H", 0, 0], ["H", 1, 1]], bonds: [[0, 1, 1], [0, 2, 1]], os: true },
  { id: "PH3", name: "Phosphan", formula: "PH3", atoms: [["P", 1, 1], ["H", 0, 1], ["H", 2, 1], ["H", 1, 2]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]], os: true },
  { id: "C2H6", name: "Ethan", formula: "C2H6", atoms: [["C", 1, 1], ["C", 2, 1], ["H", 0, 1], ["H", 1, 0], ["H", 1, 2], ["H", 3, 1], ["H", 2, 0], ["H", 2, 2]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1], [1, 6, 1], [1, 7, 1]], os: true },
  { id: "C2H4", name: "Ethen", formula: "C2H4", atoms: [["C", 1, 0], ["C", 2, 0], ["H", 0, 0], ["H", 1, 1], ["H", 3, 0], ["H", 2, 1]], bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]], os: true },
  { id: "C2H2", name: "Ethin", formula: "C2H2", atoms: [["H", 0, 0], ["C", 1, 0], ["C", 2, 0], ["H", 3, 0]], bonds: [[0, 1, 1], [1, 2, 3], [2, 3, 1]], os: true },
  { id: "HCN", name: "Cyanwasserstoff (Blausäure)", formula: "HCN", atoms: [["H", 0, 0], ["C", 1, 0], ["N", 2, 0]], bonds: [[0, 1, 1], [1, 2, 3]], os: true },
  { id: "CH2O", name: "Methanal (Formaldehyd)", formula: "CH2O", atoms: [["O", 1, 0], ["C", 1, 1], ["H", 0, 1], ["H", 2, 1]], bonds: [[0, 1, 2], [1, 2, 1], [1, 3, 1]], os: true },
  { id: "CH3OH", name: "Methanol", formula: "CH3OH", atoms: [["C", 1, 1], ["H", 1, 0], ["H", 0, 1], ["H", 1, 2], ["O", 2, 1], ["H", 3, 1]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [4, 5, 1]], os: true },
  { id: "CH3Cl", name: "Chlormethan", formula: "CH3Cl", atoms: [["C", 1, 1], ["H", 1, 0], ["H", 0, 1], ["H", 1, 2], ["Cl", 2, 1]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]], os: true },
  { id: "H2O2", name: "Wasserstoffperoxid", formula: "H2O2", atoms: [["H", 0, 0], ["O", 1, 0], ["O", 2, 0], ["H", 3, 0]], bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1]], os: true },
  { id: "C2H5OH", name: "Ethanol", formula: "C2H5OH", atoms: [["C", 1, 1], ["C", 2, 1], ["O", 3, 1], ["H", 4, 1], ["H", 0, 1], ["H", 1, 0], ["H", 1, 2], ["H", 2, 0], ["H", 2, 2]], bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1], [1, 7, 1], [1, 8, 1]], os: true },
];

/** Bekanntes Molekül als Rastermolekül (optional verschoben) */
export function toMolecule(k: KnownMolecule, dx = 0, dy = 0): Molecule {
  return {
    atoms: k.atoms.map(([el, x, y], i) => ({ id: i + 1, el, x: x + dx, y: y + dy })),
    bonds: k.bonds.map(([a, b, order]) => ({ a: a + 1, b: b + 1, order })),
  };
}
export const moleculeSize = (k: KnownMolecule) => ({ w: Math.max(...k.atoms.map(a => a[1])) + 1, h: Math.max(...k.atoms.map(a => a[2])) + 1 });

const KNOWN_KEYS = new Map(KNOWN.map(k => [canonicalKey(toMolecule(k)), k]));
/** Erkennt ein gebautes Molekül (unabhängig von der Lage) */
export const identify = (m: Molecule) => KNOWN_KEYS.get(canonicalKey(m)) ?? null;
export const KNOWN_BY_ID: Record<string, KnownMolecule> = Object.fromEntries(KNOWN.map(k => [k.id, k]));

export const bondName = (order: number) => (order === 1 ? "Einfachbindung" : order === 2 ? "Doppelbindung" : "Dreifachbindung");

const SIDE_ANGLE: Record<Side, number> = { right: 0, down: 90, left: 180, up: 270 };

/**
 * Nicht bindende Elektronen als Winkel (Grad, SVG: 0 = rechts, 90 = unten) – symmetrisch zu den Bindungen:
 * Ein Endatom mit genau zwei Elektronen-„Gruppen“ (z. B. O in O=C=O) bekommt sie schräg (± 45°) gegenüber der Bindung,
 * sonst liegen sie auf den freien Seiten.
 */
export function loneLayout(m: Molecule, id: number): { angle: number; n: 1 | 2 }[] {
  const L = sideLayout(m, id);
  const bonded = SIDES.filter(s => "bond" in L[s]);
  const groups = SIDES.filter(s => "lone" in L[s] && (L[s] as { lone: number }).lone > 0)
    .map(s => ({ angle: SIDE_ANGLE[s], n: (L[s] as { lone: number }).lone as 1 | 2 }));
  if (bonded.length === 1 && groups.length === 2) {
    const opp = (SIDE_ANGLE[bonded[0]] + 180) % 360;
    // Paare zuerst, dann einzelne Elektronen – beide symmetrisch um die Gegenrichtung
    const sorted = [...groups].sort((a, b) => b.n - a.n);
    return [{ angle: (opp + 315) % 360, n: sorted[0].n }, { angle: (opp + 45) % 360, n: sorted[1].n }];
  }
  return groups;
}
