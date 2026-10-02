// Systematische Namen organischer Verbindungen (IUPAC-Regeln, deutsche Schreibweise).
//
// Ablauf: funktionelle Gruppen erkennen → Hauptgruppe (höchste Priorität) → Stammsystem wählen (Kette oder Ring) →
// nummerieren → Vorsilben (Substituenten) benennen, alphabetisch ordnen → Name zusammensetzen.
//
// Stammsystem (in dieser Reihenfolge): meiste Hauptgruppen · Ring vor Kette · längste Kette · meiste Mehrfachbindungen ·
// meiste Doppelbindungen · meiste Substituenten. Nummerierung: kleinste Nummern für Hauptgruppe, dann Mehrfachbindungen,
// dann Doppelbindungen, dann alle Vorsilben, dann die alphabetisch erste Vorsilbe.
// Mehr als zwei Carbonsäuregruppen an einer Kette: „-carbonsäure“ (Kohlenstoff der Gruppe gehört nicht zur Kette).
// Substituenten werden rekursiv benannt (Methyl, (1-Methylethyl), Acetyloxy, Phenyl …). Ester: „Butansäureethylester“.

import { formula, graph, hCount, components, HALOGENS, type El, type Graph, type Mol } from "./mol.ts";
import { findRings, STEM, type Ring, type RingInfo } from "./rings.ts";

export type Kind = "saeure" | "ester" | "amid" | "nitril" | "al" | "on" | "ol" | "thiol" | "amin";
/** Priorität der Hauptgruppen (höchste zuerst) */
export const RANK: Kind[] = ["saeure", "ester", "amid", "nitril", "al", "on", "ol", "thiol", "amin"];
const C_TYPE = new Set<Kind>(["saeure", "ester", "amid", "nitril", "al"]);

export const KIND_INFO: Record<Kind, { label: string; group: string; suffix: string; prefix: string }> = {
  saeure: { label: "Carbonsäure", group: "–COOH", suffix: "-säure", prefix: "Carboxy-" },
  ester: { label: "Ester", group: "–COO–", suffix: "-säure…ester", prefix: "…oxycarbonyl-" },
  amid: { label: "Amid", group: "–CONH₂", suffix: "-amid", prefix: "Carbamoyl-" },
  nitril: { label: "Nitril", group: "–C≡N", suffix: "-nitril", prefix: "Cyano-" },
  al: { label: "Aldehyd", group: "–CHO", suffix: "-al", prefix: "Oxo-" },
  on: { label: "Keton", group: "C=O", suffix: "-on", prefix: "Oxo-" },
  ol: { label: "Alkohol", group: "–OH", suffix: "-ol", prefix: "Hydroxy-" },
  thiol: { label: "Thiol", group: "–SH", suffix: "-thiol", prefix: "Sulfanyl-" },
  amin: { label: "Amin", group: "–NH₂", suffix: "-amin", prefix: "Amino-" },
};

export interface Group {
  kind: Kind;
  /** Kohlenstoff der Gruppe (Säure, Ester, Amid, Nitril, Aldehyd, Keton) bzw. das C mit OH/SH; bei Aminen −1 */
  c: number;
  /** Atome der Endung (O, N, S der Gruppe) */
  atoms: number[];
  /** Amin/Amid: Stickstoff */
  n?: number;
  /** Ester: O der Einfachbindung und erstes Atom des Alkylteils */
  s?: number; r?: number;
}

const MULT = ["", "", "di", "tri", "tetra", "penta", "hexa", "hepta", "octa", "nona", "deca"];
const MULT_X = ["", "", "bis", "tris", "tetrakis", "pentakis", "hexakis"];
const HALO_NAME: Partial<Record<El, string>> = { F: "fluor", Cl: "chlor", Br: "brom", I: "iod" };
const SUF: Record<Kind, string> = { saeure: "säure", ester: "säure", amid: "amid", nitril: "nitril", al: "al", on: "on", ol: "ol", thiol: "thiol", amin: "amin" };
const ATT: Partial<Record<Kind, string>> = { saeure: "carbonsäure", ester: "carbonsäure", amid: "carboxamid", nitril: "carbonitril", al: "carbaldehyd" };
const BENZ_RETAINED: Partial<Record<Kind, string>> = { ol: "phenol", amin: "anilin", saeure: "benzoesäure", ester: "benzoesäure", al: "benzaldehyd", nitril: "benzonitril", amid: "benzamid" };

// ── Erkennen ────────────────────────────────────────────────────────────────

interface Ctx {
  g: Graph;
  ri: RingInfo;
  groups: Group[];
  /** Kohlenstoff einer Nitrilgruppe (nur als Hauptgruppe Teil der Kette, sonst „Cyano“) */
  nitrileC: Set<number>;
  memo: Map<string, Sub>;
}

const dblO = (g: Graph, c: number) => g.nb.get(c)!.find(n => n.order === 2 && g.el.get(n.to) === "O")?.to;

/** Gruppen erkennen; `bad` = Struktur, die die App nicht benennt (Text der Meldung) */
export function detect(g: Graph, ri: RingInfo): { groups: Group[]; nitrileC: Set<number>; bad?: string } {
  const groups: Group[] = [], nitrileC = new Set<number>();
  const used = new Set<number>();
  let bad: string | undefined;
  const fail = (t: string) => { bad ??= t; };
  // Bindungen zwischen Heteroatomen kennt die Schulchemie hier nicht (Peroxide, Hydrazine …)
  for (const a of g.ids) {
    const ea = g.el.get(a)!;
    if (ea === "C") continue;
    for (const n of g.nb.get(a)!) if (g.el.get(n.to) !== "C") fail("Bindung zwischen zwei Nicht-Kohlenstoff-Atomen");
    if ((HALOGENS.includes(ea) || ea === "NO2") && g.nb.get(a)!.some(n => n.order > 1)) fail("Mehrfachbindung am Halogen");
  }
  for (const c of g.ids) {
    if (g.el.get(c) !== "C") continue;
    const o = dblO(g, c);
    const nbs = g.nb.get(c)!;
    if (nbs.filter(n => n.order === 2 && g.el.get(n.to) !== "C").length > 1) { fail("Zwei Doppelbindungen zu O am selben C"); continue; }
    const n3 = nbs.find(n => n.order === 3 && g.el.get(n.to) === "N");
    if (n3) {
      if (ri.ringOf.has(c)) fail("Nitril im Ring");
      groups.push({ kind: "nitril", c, atoms: [n3.to] }); nitrileC.add(c); used.add(n3.to); continue;
    }
    if (nbs.some(n => n.order === 2 && (g.el.get(n.to) === "N" || g.el.get(n.to) === "S") && !ri.ringOf.get(n.to)?.aromatic)) { fail("C=N- oder C=S-Doppelbindung"); continue; }
    if (o === undefined) continue;
    used.add(o);
    if (ri.ringOf.has(c)) { groups.push({ kind: "on", c, atoms: [o] }); continue; }
    const others = nbs.filter(n => n.to !== o);
    const cs = others.filter(n => g.el.get(n.to) === "C");
    const het = others.filter(n => g.el.get(n.to) !== "C");
    if (het.length === 0) {
      groups.push({ kind: cs.length >= 2 ? "on" : "al", c, atoms: [o] });
      continue;
    }
    if (het.length > 1) { fail("Kohlensäure-Abkömmling (zwei Heteroatome am C=O)"); continue; }
    const h = het[0].to, eh = g.el.get(h)!;
    if (eh === "O") {
      const rest = g.nb.get(h)!.filter(n => n.to !== c);
      if (!rest.length) { groups.push({ kind: "saeure", c, atoms: [o, h] }); used.add(h); continue; }
      const r = rest[0].to;
      if (ri.ringOf.has(h)) continue;
      if (dblO(g, r) !== undefined) { fail("Säureanhydrid"); continue; }
      groups.push({ kind: "ester", c, atoms: [o, h], s: h, r }); used.add(h); continue;
    }
    if (eh === "N" && !ri.ringOf.has(h)) { groups.push({ kind: "amid", c, atoms: [o, h], n: h }); used.add(h); continue; }
    fail(eh === "N" ? "Amid im Ring" : "Säurehalogenid oder Thioester");
  }
  for (const a of g.ids) {
    if (used.has(a)) continue;
    const e = g.el.get(a)!, nbs = g.nb.get(a)!;
    if (e === "O" && nbs.length === 1 && nbs[0].order === 1) groups.push({ kind: "ol", c: nbs[0].to, atoms: [a] });
    else if (e === "S" && nbs.length === 1 && nbs[0].order === 1) groups.push({ kind: "thiol", c: nbs[0].to, atoms: [a] });
    else if (e === "N" && !ri.ringOf.has(a)) {
      if (nbs.some(n => n.order > 1)) { fail("C=N-Doppelbindung"); continue; }
      if (nbs.some(n => dblO(g, n.to) !== undefined)) { fail("Stickstoff an zwei C=O"); continue; }
      groups.push({ kind: "amin", c: -1, atoms: [a], n: a });
    }
  }
  // Amide mit zwei C=O am N (Imide) – das N gehört schon zu einem Amid
  const amideN = groups.filter(x => x.kind === "amid").map(x => x.n);
  if (new Set(amideN).size !== amideN.length) fail("Imid (N an zwei C=O)");
  return { groups, nitrileC, bad };
}

// ── Substituenten ────────────────────────────────────────────────────────────

export interface Sub { name: string; complex: boolean }
interface Prefix { name: string; complex: boolean; loc: string; key: string }

const sortKey = (name: string) => name.replace(/[\d,'′\-()[\]{}\s]/g, "").toLowerCase();
const mkPrefix = (s: Sub, loc: string): Prefix => ({ ...s, loc, key: sortKey(s.name) });

/** Substituent am Stammsystem: Atom x, gebunden an `from` mit Bindungsordnung `order` */
function sub(ctx: Ctx, x: number, from: number, order: number): Sub {
  const k = `${x}>${from}>${order}`;
  const m = ctx.memo.get(k);
  if (m) return m;
  const s = subRaw(ctx, x, from, order);
  ctx.memo.set(k, s);
  return s;
}

const SIMPLE_OXY: Record<string, string> = { methyl: "methoxy", ethyl: "ethoxy", propyl: "propoxy", butyl: "butoxy", phenyl: "phenoxy" };
/** Alkyl → Alkoxy (Methoxy, (1-Methylethoxy), (Pentyloxy)) */
function oxy(r: Sub): Sub {
  if (SIMPLE_OXY[r.name]) return { name: SIMPLE_OXY[r.name], complex: false };
  if (/(meth|eth|prop|but)yl$/.test(r.name) && r.complex) return { name: r.name.replace(/yl$/, "oxy"), complex: true };
  return { name: wrap(r) + "oxy", complex: true };
}
/** Klammern um zusammengesetzte Namen: (Methylamino), bei Klammern im Inneren eckig: [(Brommethyl)sulfanyl] */
const paren = (n: string) => (/\[/.test(n) ? `{${n}}` : /\(/.test(n) ? `[${n}]` : `(${n})`);
const wrap = (s: Sub) => (s.complex ? paren(s.name) : s.name);

function subRaw(ctx: Ctx, x: number, from: number, order: number): Sub {
  const { g, ri } = ctx;
  const e = g.el.get(x)!;
  const rest = g.nb.get(x)!.filter(n => n.to !== from);
  if (order === 2 && e === "O") return { name: "oxo", complex: false };
  if (e === "NO2") return { name: "nitro", complex: false };
  if (HALO_NAME[e]) return { name: HALO_NAME[e]!, complex: false };
  if (e === "O") {
    if (!rest.length) return { name: "hydroxy", complex: false };
    const y = rest[0].to;
    if (dblO(g, y) !== undefined && !ri.ringOf.has(y)) return { name: acyl(ctx, y, x).name + "oxy", complex: true };
    return oxy(sub(ctx, y, x, 1));
  }
  if (e === "S") {
    if (!rest.length) return { name: "sulfanyl", complex: false };
    const r = sub(ctx, rest[0].to, x, 1);
    return { name: wrap(r) + "sulfanyl", complex: true };
  }
  if (e === "N") {
    if (!rest.length) return { name: "amino", complex: false };
    const parts = rest.map(n => (dblO(g, n.to) !== undefined && !ri.ringOf.has(n.to) ? acyl(ctx, n.to, x) : sub(ctx, n.to, x, 1)));
    return { name: multiplied(parts) + "amino", complex: true };
  }
  // Kohlenstoff
  if (ri.ringOf.has(x)) return ringSub(ctx, x, from, order);
  if (rest.some(n => n.order === 3 && g.el.get(n.to) === "N")) return { name: "cyano", complex: false };
  if (order === 1 && dblO(g, x) !== undefined) return acyl(ctx, x, from);
  return chainSub(ctx, x, from, order, "yl");
}

/** gleiche Teile zusammenfassen und alphabetisch: Methyl + Methyl → dimethyl, Ethyl + Methyl → ethylmethyl */
function multiplied(parts: Sub[]): string {
  const by = new Map<string, Sub[]>();
  for (const p of parts) by.set(p.name, [...(by.get(p.name) ?? []), p]);
  return [...by.values()].sort((a, b) => sortKey(a[0].name).localeCompare(sortKey(b[0].name)))
    .map(ps => (ps.length > 1 ? (ps[0].complex ? MULT_X[ps.length] : MULT[ps.length]) : "") + wrap(ps[0])).join("");
}

/** Acylrest am C=O (y), gebunden an `from`: Formyl, Acetyl, Propanoyl, Benzoyl, Carboxy, Methoxycarbonyl, Carbamoyl */
function acyl(ctx: Ctx, y: number, from: number): Sub {
  const { g, ri } = ctx;
  const o = dblO(g, y)!;
  const rest = g.nb.get(y)!.filter(n => n.to !== from && n.to !== o);
  if (!rest.length) return { name: "formyl", complex: false };
  const z = rest[0].to, ez = g.el.get(z)!;
  if (ez === "O") {
    const r = g.nb.get(z)!.filter(n => n.to !== y);
    if (!r.length) return { name: "carboxy", complex: false };
    return { name: oxy(sub(ctx, r[0].to, z, 1)).name + "carbonyl", complex: true };
  }
  if (ez === "N") {
    const r = g.nb.get(z)!.filter(n => n.to !== y);
    if (!r.length) return { name: "carbamoyl", complex: false };
    return { name: multiplied(r.map(n => sub(ctx, n.to, z, 1))) + "carbamoyl", complex: true };
  }
  if (ri.ringOf.has(z)) {
    const rs = ringSub(ctx, z, y, 1);
    if (ri.ringOf.get(z)!.kind === "benzen") return { name: rs.name.replace(/phenyl$/, "benzoyl"), complex: rs.complex };
    return { name: wrap(rs) + "carbonyl", complex: true };
  }
  return chainSub(ctx, y, from, 1, "oyl");
}

/** Kohlenstoff, der Teil einer Kette sein darf (nicht im Ring, kein Nitril-C außer als Hauptgruppe) */
const chainC = (ctx: Ctx, a: number, nitrileOk = false) => ctx.g.el.get(a) === "C" && !ctx.ri.ringOf.has(a) && (nitrileOk || !ctx.nitrileC.has(a));

/** Vergleich von Schlüsseln: Zahlen, Texte oder Zahlenlisten (lexikographisch) */
type KeyPart = number | string | number[];
function cmpKey(a: KeyPart[], b: KeyPart[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const x = a[i], y = b[i];
    if (Array.isArray(x) && Array.isArray(y)) {
      for (let j = 0; j < Math.min(x.length, y.length); j++) if (x[j] !== y[j]) return x[j] - y[j];
      if (x.length !== y.length) return x.length - y.length;
    } else if (typeof x === "number" && typeof y === "number") { if (x !== y) return x - y; }
    else if (x !== y) return String(x).localeCompare(String(y));
  }
  return 0;
}
const locNum = (l: string) => (/^\d+$/.test(l) ? Number(l) : 0);
const prefixLocs = (ps: Prefix[]) => ps.filter(p => /^\d/.test(p.loc)).map(p => locNum(p.loc)).sort((a, b) => a - b);
const alphaLocs = (ps: Prefix[]) => [...ps].filter(p => /^\d/.test(p.loc)).sort((a, b) => a.key.localeCompare(b.key) || locNum(a.loc) - locNum(b.loc)).map(p => locNum(p.loc));

/** Kette als Substituent: beginnt bei x (Nummer 1), Endung yl / yliden / oyl */
function chainSub(ctx: Ctx, x: number, from: number, order: number, end: "yl" | "oyl"): Sub {
  const { g } = ctx;
  const skip = new Set<number>([from]);
  const o = end === "oyl" ? dblO(g, x) : undefined;
  if (o !== undefined) skip.add(o);
  // alle Wege ab x durch Ketten-C
  const paths: number[][] = [];
  const walk = (p: number[]) => {
    paths.push(p);
    const last = p[p.length - 1];
    for (const n of g.nb.get(last)!) if (!p.includes(n.to) && !skip.has(n.to) && chainC(ctx, n.to)) walk([...p, n.to]);
  };
  walk([x]);
  let best: { key: KeyPart[]; name: string; complex: boolean } | undefined;
  for (const p of paths) {
    const en: number[] = [], yn: number[] = [];
    for (let i = 0; i + 1 < p.length; i++) {
      const ord = g.nb.get(p[i])!.find(n => n.to === p[i + 1])!.order;
      if (ord === 2) en.push(i + 1); else if (ord === 3) yn.push(i + 1);
    }
    const prefixes: Prefix[] = [];
    p.forEach((a, i) => {
      for (const n of g.nb.get(a)!) {
        if (p.includes(n.to) || skip.has(n.to)) continue;
        prefixes.push(mkPrefix(sub(ctx, n.to, a, n.order), String(i + 1)));
      }
    });
    const omit = p.length === 1;
    const pre = assemblePrefixes(prefixes, omit, {});
    const stem = STEM[p.length];
    let core: string;
    if (end === "oyl") core = p.length === 2 && !en.length && !yn.length && !prefixes.length ? "acetyl" : unsat(stem, en, yn, p.length <= 2) + "oyl";
    else if (!en.length && !yn.length) core = stem + (order === 2 ? "yliden" : order === 3 ? "ylidin" : "yl");
    else core = unsat(stem, en, yn, p.length <= 2) + (order === 2 ? "yliden" : "yl");
    const name = pre + core;
    const key: KeyPart[] = [-p.length, -(en.length + yn.length), -en.length, -prefixes.length, [...en, ...yn].sort((a, b) => a - b), en, prefixLocs(prefixes), alphaLocs(prefixes), name];
    if (!best || cmpKey(key, best.key) < 0) best = { key, name, complex: prefixes.length > 0 || /\d/.test(name) };
  }
  return { name: best!.name, complex: best!.complex };
}

/** Ring als Substituent: Phenyl, Cyclohexyl, (4-Methylphenyl), Pyridin-3-yl */
function ringSub(ctx: Ctx, x: number, from: number, order: number): Sub {
  const { g, ri } = ctx;
  const ring = ri.ringOf.get(x)!;
  const n = ring.atoms.length;
  let best: { key: KeyPart[]; name: string; complex: boolean } | undefined;
  for (const seq of numberings(ring)) {
    if (ring.kind !== "hetero" && seq[0] !== x) continue;
    const at = seq.indexOf(x) + 1;
    const { en, yn } = ringUnsat(g, ring, seq);
    const prefixes: Prefix[] = [];
    seq.forEach((a, i) => {
      for (const nb of g.nb.get(a)!) {
        if (ring.atoms.includes(nb.to) || (a === x && nb.to === from)) continue;
        prefixes.push(mkPrefix(sub(ctx, nb.to, a, nb.order), String(i + 1)));
      }
    });
    const pre = assemblePrefixes(prefixes, false, {});
    const yl = order === 2 ? "yliden" : "yl";
    let core: string;
    if (ring.kind === "benzen") core = "phenyl";
    else if (ring.kind === "carbo") core = (en.length || yn.length ? unsat(ring.base, en, yn, false) : ring.base) + yl;
    else core = `${ring.base}-${at}-${yl}`;
    const name = pre + core;
    const key: KeyPart[] = [at, [...en, ...yn].sort((a, b) => a - b), en, prefixLocs(prefixes), alphaLocs(prefixes), name];
    if (!best || cmpKey(key, best.key) < 0) best = { key, name, complex: prefixes.length > 0 || /\d/.test(name) };
  }
  void n;
  return { name: best!.name, complex: best!.complex };
}

/** alle Nummerierungen eines Rings (Heterocyclus: Heteroatom = 1) */
function numberings(ring: Ring): number[][] {
  const n = ring.atoms.length, out: number[][] = [];
  for (let s = 0; s < n; s++) for (const d of [1, -1]) {
    const seq = Array.from({ length: n }, (_, j) => ring.atoms[(s + d * j + n * 2) % n]);
    if (ring.kind === "hetero" && seq[0] !== ring.hetero) continue;
    out.push(seq);
  }
  return out;
}

/** Doppel-/Dreifachbindungen im Ring (nicht bei Aromaten) */
function ringUnsat(g: Graph, ring: Ring, seq: number[]): { en: number[]; yn: number[] } {
  const en: number[] = [], yn: number[] = [];
  if (ring.aromatic) return { en, yn };
  const n = seq.length;
  for (let j = 0; j < n; j++) {
    const o = g.nb.get(seq[j])!.find(x => x.to === seq[(j + 1) % n])!.order;
    if (o === 2) en.push(j + 1); else if (o === 3) yn.push(j + 1);
  }
  return { en, yn };
}

/** Stamm mit Mehrfachbindungen: but-2-en, buta-1,3-dien, pent-1-en-4-in; ohne: butan */
function unsat(stem: string, en: number[], yn: number[], omit: boolean): string {
  if (!en.length && !yn.length) return stem + "an";
  const first = en.length ? en : yn;
  let s = stem + (first.length > 1 ? "a" : "");
  if (en.length) s += (omit ? "" : `-${en.join(",")}-`) + MULT[en.length] + "en";
  if (yn.length) s += (omit ? "" : `-${yn.join(",")}-`) + MULT[yn.length] + "in";
  return s;
}

/** Vorsilben zusammensetzen: gleiche zusammenfassen (di, tri; bis bei zusammengesetzten), alphabetisch ordnen */
function assemblePrefixes(ps: Prefix[], omit: boolean, f: Flags): string {
  const by = new Map<string, Prefix[]>();
  for (const p of ps) by.set(p.name, [...(by.get(p.name) ?? []), p]);
  const locOrder = (a: string, b: string) => (/^\d/.test(a) ? 1 : 0) - (/^\d/.test(b) ? 1 : 0) || locNum(a) - locNum(b) || a.localeCompare(b);
  let groups = [...by.values()].map(g => g.sort((a, b) => locOrder(a.loc, b.loc)));
  if (f.noMult) groups = ps.map(p => [p]);
  groups.sort((a, b) => (f.noAlpha ? locOrder(a[0].loc, b[0].loc) || a[0].key.localeCompare(b[0].key) : a[0].key.localeCompare(b[0].key) || locOrder(a[0].loc, b[0].loc)));
  const parts = groups.map(g => {
    const n = g.length, s = g[0];
    const mult = n > 1 ? (s.complex ? MULT_X[n] : MULT[n]) : "";
    const locs = g.map(p => p.loc);
    const keep = !omit || locs.some(l => !/^\d/.test(l));
    const shown = keep ? locs.filter(l => !omit || !/^\d/.test(l)) : [];
    return (shown.length ? shown.join(",") + "-" : "") + mult + (s.complex ? paren(s.name) : s.name);
  });
  let out = "";
  for (const p of parts) out += (out && /^[\dN]/.test(p) ? "-" : "") + p;
  return out;
}

// ── Stammsystem wählen ──────────────────────────────────────────────────────

interface Flags {
  /** Vorsilben nicht zusammengefasst (2-Methyl-3-methyl…) – nur für falsche Antworten im Quiz */
  noMult?: boolean;
  /** Vorsilben nach Nummer statt alphabetisch – nur für falsche Antworten im Quiz */
  noAlpha?: boolean;
}

interface Option {
  id: string;
  kind: "chain" | "ring";
  ring?: Ring;
  /** Atome in Nummerierungsreihenfolge (Nummer = Index + 1) */
  seq: number[];
  mode: "incl" | "att";
  counted: Group[];
  pLocs: number[];
  en: number[]; yn: number[];
  prefixes: Prefix[];
  /** Atome der Endung (gehören nicht zu Vorsilben) */
  suffixAtoms: Set<number>;
  key: KeyPart[];
}

/** Atom, an dem die Hauptgruppe sitzt (für Zählen und Nummer) */
function anchorIn(ctx: Ctx, gr: Group, set: Set<number>, mode: "incl" | "att"): number | undefined {
  const { g } = ctx;
  if (gr.kind === "amin") return g.nb.get(gr.n!)!.map(n => n.to).find(a => set.has(a));
  if (C_TYPE.has(gr.kind)) {
    if (mode === "incl") return set.has(gr.c) ? gr.c : undefined;
    if (set.has(gr.c)) return undefined;
    return g.nb.get(gr.c)!.map(n => n.to).find(a => set.has(a) && !gr.atoms.includes(a));
  }
  return set.has(gr.c) ? gr.c : undefined;
}

function makeOption(ctx: Ctx, id: string, kind: "chain" | "ring", seq: number[], mode: "incl" | "att", KG: Group[], ring: Ring | undefined, structural: KeyPart[]): Option {
  const { g } = ctx;
  const set = new Set(seq);
  const counted: Group[] = [], pLocs: number[] = [], at = new Map<Group, number>();
  const suffixAtoms = new Set<number>();
  const nPrefixes: Prefix[] = [];
  let nIdx = 0;
  for (const gr of KG) {
    const a = anchorIn(ctx, gr, set, mode);
    if (a === undefined) continue;
    counted.push(gr); pLocs.push(seq.indexOf(a) + 1); at.set(gr, seq.indexOf(a));
    gr.atoms.forEach(x => suffixAtoms.add(x));
    if (C_TYPE.has(gr.kind) && mode === "att") suffixAtoms.add(gr.c);
  }
  pLocs.sort((a, b) => a - b);
  // Substituenten am Stickstoff von Amin/Amid: Nummer N (N′ am zweiten Stickstoff, nach der Nummer des C)
  const nSubs = (gr: Group) => (gr.n === undefined ? 0 : g.nb.get(gr.n)!.length);
  counted.sort((a, b) => at.get(a)! - at.get(b)! || nSubs(b) - nSubs(a));
  for (const gr of counted) {
    if (gr.n === undefined) continue;
    const loc = nIdx++ ? "N′" : "N";
    for (const nb of g.nb.get(gr.n)!) {
      if (set.has(nb.to) || nb.to === gr.c) continue;
      const z = nb.to;
      const s = dblO(g, z) !== undefined && !ctx.ri.ringOf.has(z) ? acyl(ctx, z, gr.n) : sub(ctx, z, gr.n, 1);
      nPrefixes.push(mkPrefix(s, loc));
    }
  }
  let en: number[] = [], yn: number[] = [];
  if (kind === "chain") {
    for (let i = 0; i + 1 < seq.length; i++) {
      const o = g.nb.get(seq[i])!.find(n => n.to === seq[i + 1])!.order;
      if (o === 2) en.push(i + 1); else if (o === 3) yn.push(i + 1);
    }
  } else ({ en, yn } = ringUnsat(g, ring!, seq));
  const prefixes: Prefix[] = [...nPrefixes];
  seq.forEach((a, i) => {
    for (const nb of g.nb.get(a)!) {
      if (set.has(nb.to) || suffixAtoms.has(nb.to)) continue;
      prefixes.push(mkPrefix(sub(ctx, nb.to, a, nb.order), String(i + 1)));
    }
  });
  const mult = [...en, ...yn].sort((a, b) => a - b);
  const key: KeyPart[] = [-counted.length, ...structural, -prefixes.length, pLocs, mult, en, prefixLocs(prefixes), alphaLocs(prefixes)];
  return { id, kind, ring, seq, mode, counted, pLocs, en, yn, prefixes, suffixAtoms, key };
}

/** alle Möglichkeiten (Stammsystem × Nummerierung), beste zuerst */
function options(ctx: Ctx, allowed: Set<number>, K: Kind | undefined, KG: Group[]): Option[] {
  const { g, ri } = ctx;
  const out: Option[] = [];
  // Ringe
  for (const ring of ri.rings) {
    if (!ring.atoms.every(a => allowed.has(a))) continue;
    const doubles = ring.aromatic ? 3 : 0;
    for (const seq of numberings(ring)) {
      const { en, yn } = ringUnsat(g, ring, seq);
      const structural: KeyPart[] = [0, ring.kind === "hetero" ? 0 : 1, -ring.atoms.length, -(en.length + yn.length + doubles)];
      out.push(makeOption(ctx, "r" + ring.atoms.join(","), "ring", seq, "att", KG, ring, structural));
    }
  }
  // Ketten: alle Wege im Wald der Ketten-C
  const nitrileOk = K === "nitril";
  const cs = g.ids.filter(a => allowed.has(a) && chainC(ctx, a, nitrileOk));
  const csSet = new Set(cs);
  const att = K !== undefined && C_TYPE.has(K);
  const groupC = new Set(KG.filter(x => C_TYPE.has(x.kind)).map(x => x.c));
  for (const s of cs) {
    // Wege ab s, nur zu Endpunkten mit id ≥ s (jeder Weg einmal), dann beide Richtungen
    const walk = (p: number[]) => {
      const last = p[p.length - 1];
      if (last >= s) {
        const dirs = p.length === 1 ? [p] : [p, [...p].reverse()];
        const id = "c" + [...p].sort((a, b) => a - b).join(",");
        for (const seq of dirs) {
          const { en, yn } = chainUnsat(g, seq);
          out.push(makeOption(ctx, id + "i", "chain", seq, "incl", KG, undefined, [1, 0, -seq.length, -(en + yn), -en]));
          if (att && !seq.some(a => groupC.has(a))) {
            const o = makeOption(ctx, id + "a", "chain", seq, "att", KG, undefined, [1, 1, -seq.length, -(en + yn), -en]);
            if (o.counted.length) out.push(o);
          }
        }
      }
      for (const n of g.nb.get(last)!) if (csSet.has(n.to) && !p.includes(n.to)) walk([...p, n.to]);
    };
    walk([s]);
  }
  // Schlüssel: [−Anzahl Hauptgruppen, Ring 0 | Kette 1, …] – Ring vor Kette nur bei gleicher Zahl Hauptgruppen
  const named = out.map(o => ({ o, name: optionName(ctx, o, K, {}) }));
  named.sort((a, b) => cmpKey(a.o.key, b.o.key) || a.name.localeCompare(b.name));
  return named.map(x => x.o);
}

function chainUnsat(g: Graph, seq: number[]): { en: number; yn: number } {
  let en = 0, yn = 0;
  for (let i = 0; i + 1 < seq.length; i++) {
    const o = g.nb.get(seq[i])!.find(n => n.to === seq[i + 1])!.order;
    if (o === 2) en++; else if (o === 3) yn++;
  }
  return { en, yn };
}

// ── Name zusammensetzen ─────────────────────────────────────────────────────

/** Name des Stammsystems mit Endung, ohne Vorsilben; `omit` = Nummern weglassen (eindeutig ohne) */
function optionName(_ctx: Ctx, o: Option, K: Kind | undefined, f: Flags): string {
  const omit = omitLocants(o);
  const n = o.counted.length;
  const kind = n ? K : undefined;
  const plocs = o.pLocs.join(",");
  let base: string;
  if (o.kind === "ring" && o.ring!.kind === "benzen" && kind && n === 1 && BENZ_RETAINED[kind]) base = BENZ_RETAINED[kind]!;
  else {
    let stem: string;
    // zwei C: die Mehrfachbindung kann nur zwischen C1 und C2 liegen (1,2-Dichlorethen)
    if (o.kind === "chain") stem = unsat(STEM[o.seq.length], o.en, o.yn, omit || o.seq.length === 2);
    else if (o.ring!.kind === "carbo") stem = unsat(o.ring!.base, o.en, o.yn, omit);
    else stem = o.ring!.base;
    let suffix = "";
    if (kind) {
      const mult = n > 1 ? MULT[n] : "";
      if (o.mode === "att" && C_TYPE.has(kind)) suffix = (omit ? "" : `-${plocs}-`) + mult + ATT[kind];
      else if (C_TYPE.has(kind)) suffix = mult + SUF[kind];
      else suffix = (omit ? "" : `-${plocs}-`) + mult + SUF[kind];
    }
    base = stem + suffix;
  }
  return assemblePrefixes(o.prefixes, omit, f) + base;
}

/** Nummern weglassen, wenn der Name auch ohne eindeutig ist (Ethanol, Propen, Methylcyclohexan, Phenol) */
function omitLocants(o: Option): boolean {
  const pre = o.prefixes.filter(p => /^\d/.test(p.loc)).length;
  const princ = o.counted.length;
  const multiple = o.en.length + o.yn.length;
  if (o.kind === "ring") return o.ring!.kind !== "hetero" && pre + princ + multiple <= 1;
  const len = o.seq.length;
  if (len === 1) return true;
  if (len === 2) return pre + princ <= 1;
  if (len === 3) return pre === 0 && princ === 0 && multiple === 1;
  return false;
}

const cap = (s: string) => s.replace(/[a-zäöü]/, c => c.toUpperCase());
export { cap };

// ── Ergebnis ────────────────────────────────────────────────────────────────

export interface NameOk {
  ok: true;
  name: string;
  /** weitere gebräuchliche Namen (Trivialname, Benzol-Schreibweise, ältere Schreibweise) */
  alt: string[];
  formula: string;
  classes: string[];
  /** Hauptgruppe (fehlt bei Kohlenwasserstoffen, Ethern, Halogenalkanen …) */
  principal?: Kind;
  /** Stammsystem: Atome mit Nummer */
  parent: { atoms: number[]; kind: "chain" | "ring"; ring?: string; size: number };
  /** Atome der Hauptgruppe(n) */
  principalAtoms: number[];
  /** Vorsilben je Name mit Nummern (Reihenfolge wie im Namen) */
  prefixes: { name: string; locs: string[] }[];
  /** Ester: Name des Alkylteils und seine Atome */
  ester?: { acid: string; alkyl: string; alkylAtoms: number[] };
  /** Lösungsweg in kurzen Schritten (**fett**) */
  steps: string[];
}
export interface NameFail { ok: false; reason: string; formula: string }
export type NameResult = NameOk | NameFail;

/** Vorbereitung: Graph, Ringe, Gruppen; Meldung, wenn die App die Struktur nicht benennen kann */
function prepare(mol: Mol): { ctx: Ctx; bad?: string } {
  const g = graph(mol);
  const ri = findRings(g);
  const d = detect(g, ri);
  const ctx: Ctx = { g, ri, groups: d.groups, nitrileC: d.nitrileC, memo: new Map() };
  let bad = d.bad ?? ri.unsupported;
  if (!mol.atoms.length) bad = "Noch nichts gezeichnet";
  else if (components(mol).length > 1) bad = "Mehrere getrennte Teile – verbinde sie";
  else if (!mol.atoms.some(a => a.el === "C")) bad = "Kein Kohlenstoff – keine organische Verbindung";
  return { ctx, bad };
}

/** Hauptgruppe = Gruppe mit der höchsten Priorität */
const principalOf = (groups: Group[], override?: Kind): Kind | undefined => override ?? RANK.find(k => groups.some(x => x.kind === k));

export interface NameOptions extends Flags {
  /** andere Hauptgruppe erzwingen (falsche Priorität – nur für das Quiz) */
  principal?: Kind;
  /** n-te Möglichkeit statt der besten (andere Kette oder Nummerierung – nur für das Quiz) */
  pick?: "reverse" | "otherChain";
}

export function name(mol: Mol, opt: NameOptions = {}): NameResult {
  const { ctx, bad } = prepare(mol);
  const f = formula(mol);
  if (bad) return { ok: false, reason: bad, formula: f };
  const K = principalOf(ctx.groups, opt.principal);
  if (K === "ester") return esterName(ctx, mol, opt);
  const all = new Set(ctx.g.ids);
  const KG = K ? ctx.groups.filter(x => x.kind === K) : [];
  const opts = options(ctx, all, K, KG);
  const o = choose(opts, opt.pick);
  if (!o) return { ok: false, reason: "Keine andere Möglichkeit", formula: f };
  const raw = optionName(ctx, o, K, opt);
  const nm = cap(raw);
  const res: NameOk = {
    ok: true, name: nm, alt: altNames(nm, ctx, o, K), formula: f, classes: classes(ctx), principal: o.counted.length ? K : undefined,
    parent: { atoms: o.seq, kind: o.kind, ring: o.ring?.kind, size: o.seq.length },
    principalAtoms: o.counted.flatMap(x => (C_TYPE.has(x.kind) ? [x.c, ...x.atoms] : x.kind === "on" ? [x.c, ...x.atoms] : x.atoms)),
    prefixes: groupedPrefixes(o.prefixes, omitLocants(o)),
    steps: [],
  };
  res.steps = steps(ctx, o, K, res);
  return res;
}

function choose(opts: Option[], pick?: "reverse" | "otherChain"): Option | undefined {
  const best = opts[0];
  if (!pick || !best) return best;
  if (pick === "reverse") return opts.find(o => o.id === best.id && o.seq.join() !== best.seq.join() && o.kind === best.kind);
  return opts.find(o => o.id !== best.id && o.kind === best.kind && o.seq.length < best.seq.length);
}

function groupedPrefixes(ps: Prefix[], omit: boolean): { name: string; locs: string[] }[] {
  const by = new Map<string, string[]>();
  for (const p of [...ps].sort((a, b) => a.key.localeCompare(b.key))) by.set(p.name, [...(by.get(p.name) ?? []), omit && /^\d/.test(p.loc) ? "" : p.loc]);
  return [...by].map(([name, locs]) => ({ name, locs: locs.filter(Boolean) }));
}

// ── Ester ───────────────────────────────────────────────────────────────────

function esterName(ctx: Ctx, mol: Mol, opt: NameOptions): NameResult {
  const { g } = ctx;
  const f = formula(mol);
  const esters = ctx.groups.filter(x => x.kind === "ester");
  // Säureteil: Bindungen O–R aller Ester trennen, Teil mit den meisten Ester-C wählen
  const cut = new Set(esters.map(e => `${e.s}-${e.r}`));
  const compOf = (start: number, cuts: Set<string>) => {
    const seen = new Set([start]), stack = [start];
    while (stack.length) {
      const v = stack.pop()!;
      for (const n of g.nb.get(v)!) if (!seen.has(n.to) && !cuts.has(`${v}-${n.to}`) && !cuts.has(`${n.to}-${v}`)) { seen.add(n.to); stack.push(n.to); }
    }
    return seen;
  };
  let acid: Set<number> | undefined, chosen: Group[] = [];
  for (const e of esters) {
    const comp = compOf(e.c, cut);
    const cs = esters.filter(x => comp.has(x.c));
    const nC = [...comp].filter(a => g.el.get(a) === "C").length;
    if (!acid || cs.length > chosen.length || (cs.length === chosen.length && nC > [...acid].filter(a => g.el.get(a) === "C").length)) { acid = comp; chosen = cs; }
  }
  // nur die gewählten Ester trennen – die anderen bleiben Vorsilben (Acetyloxy …)
  const cuts = new Set(chosen.map(e => `${e.s}-${e.r}`));
  acid = compOf(chosen[0].c, cuts);
  const KG: Group[] = chosen.map(e => ({ ...e, kind: "saeure" }));
  // im Säureteil zählen Ester-O als OH; Ketten nur innerhalb des Säureteils
  const opts = options(ctx, acid, "saeure", KG);
  const o = choose(opts, opt.pick);
  if (!o) return { ok: false, reason: "Keine andere Möglichkeit", formula: f };
  const acidName = optionName(ctx, o, "saeure", opt);
  const alkyls = chosen.map(e => sub(ctx, e.r!, e.s!, 1));
  const alkylPart = multiplied(alkyls);
  const nm = cap(acidName) + alkylPart + "ester";
  const anion = acidName.endsWith("benzoesäure") ? acidName.replace(/benzoesäure$/, "benzoat")
    : acidName.endsWith("carbonsäure") ? acidName.replace(/carbonsäure$/, "carboxylat") : acidName.replace(/säure$/, "oat");
  const alt = [cap(alkylPart + anion)];
  const triv = TRIVIAL_ACID[cap(acidName)];
  if (triv) { alt.push(triv.acid + alkylPart + "ester"); alt.push(cap(alkylPart + triv.anion)); }
  const alkylAtoms = chosen.flatMap(e => [...compOf(e.r!, new Set([`${e.s}-${e.r}`]))].filter(a => !acid!.has(a)));
  const res: NameOk = {
    ok: true, name: nm, alt: [...new Set(alt.filter(a => a !== nm))], formula: f, classes: classes(ctx), principal: "ester",
    parent: { atoms: o.seq, kind: o.kind, ring: o.ring?.kind, size: o.seq.length },
    principalAtoms: chosen.flatMap(e => [e.c, ...e.atoms]),
    prefixes: groupedPrefixes(o.prefixes, omitLocants(o)),
    ester: { acid: cap(acidName), alkyl: cap(alkylPart), alkylAtoms },
    steps: [],
  };
  res.steps = steps(ctx, o, "ester", res);
  return res;
}

// ── Weitere Namen, Stoffklassen, Lösungsweg ──────────────────────────────────

const TRIVIAL_ACID: Record<string, { acid: string; anion: string }> = {
  Methansäure: { acid: "Ameisensäure", anion: "formiat" },
  Ethansäure: { acid: "Essigsäure", anion: "acetat" },
  Propansäure: { acid: "Propionsäure", anion: "propionat" },
  Butansäure: { acid: "Buttersäure", anion: "butyrat" },
};

/** Trivialnamen zum systematischen Namen (Schreibweise wie im Ergebnis) */
export const TRIVIAL: Record<string, string[]> = {
  Methan: ["Sumpfgas"],
  Ethen: ["Ethylen"], Ethin: ["Acetylen"], Propen: ["Propylen"],
  Methanol: ["Methylalkohol"], Ethanol: ["Ethylalkohol", "Alkohol"],
  "Propan-2-ol": ["Isopropanol"], "Ethan-1,2-diol": ["Glykol", "Ethylenglykol"], "Propan-1,2,3-triol": ["Glycerin"],
  Methanal: ["Formaldehyd"], Ethanal: ["Acetaldehyd"], "Propan-2-on": ["Aceton"], "Butan-2-on": ["Methylethylketon"],
  Methansäure: ["Ameisensäure"], Ethansäure: ["Essigsäure"], Propansäure: ["Propionsäure"], Butansäure: ["Buttersäure"],
  Hexadecansäure: ["Palmitinsäure"], Octadecansäure: ["Stearinsäure"], Ethandisäure: ["Oxalsäure"], Propandisäure: ["Malonsäure"],
  Butandisäure: ["Bernsteinsäure"], "2-Hydroxypropansäure": ["Milchsäure"], "2-Hydroxybutandisäure": ["Äpfelsäure"],
  "2,3-Dihydroxybutandisäure": ["Weinsäure"], "2-Hydroxypropan-1,2,3-tricarbonsäure": ["Citronensäure"],
  Propensäure: ["Acrylsäure"], "Prop-2-ensäure": ["Acrylsäure"], "2-Oxopropansäure": ["Brenztraubensäure"],
  Methylbenzen: ["Toluol"], "1,2-Dimethylbenzen": ["o-Xylol"], "1,4-Dimethylbenzen": ["p-Xylol"], Ethenylbenzen: ["Styrol"],
  "2-Hydroxybenzoesäure": ["Salicylsäure"], "2-(Acetyloxy)benzoesäure": ["Acetylsalicylsäure", "Aspirin"],
  "2-Methyl-1,3,5-trinitrobenzen": ["2,4,6-Trinitrotoluol", "TNT"], "2,4,6-Trinitrophenol": ["Pikrinsäure"],
  "3,7-Dimethyloct-6-enal": ["Citronellal"], "2,3,4,5,6-Pentahydroxyhexanal": ["Aldohexose, z. B. Glucose"], "3,7-Dimethylocta-2,6-dienal": ["Citral"],
  "2-Methoxy-2-methylpropan": ["Methyl-tert-butylether", "MTBE"], Ethoxyethan: ["Diethylether", "Ether"], Methoxymethan: ["Dimethylether"],
  Trichlormethan: ["Chloroform"], Tetrachlormethan: ["Tetrachlorkohlenstoff"], Dichlormethan: ["Methylenchlorid"],
  Methanamin: ["Methylamin"], Ethanamin: ["Ethylamin"], "N-Methylmethanamin": ["Dimethylamin"], "N-Ethylethanamin": ["Diethylamin"],
  "N,N-Dimethylmethanamin": ["Trimethylamin"],
  "2-Aminoethansäure": ["Glycin"], "2-Aminopropansäure": ["Alanin"], "2-Amino-3-methylbutansäure": ["Valin"],
  "2-Amino-4-methylpentansäure": ["Leucin"], "2-Amino-3-methylpentansäure": ["Isoleucin"], "2-Amino-3-hydroxypropansäure": ["Serin"],
  "2-Amino-3-sulfanylpropansäure": ["Cystein"], "2-Amino-3-phenylpropansäure": ["Phenylalanin"], "2-Aminobutandisäure": ["Asparaginsäure"],
  "2-Aminopentandisäure": ["Glutaminsäure"], "2,6-Diaminohexansäure": ["Lysin"], "2-Amino-3-hydroxybutansäure": ["Threonin"],
  "2-Amino-4-(methylsulfanyl)butansäure": ["Methionin"], "2-Amino-3-(4-hydroxyphenyl)propansäure": ["Tyrosin"],
  Ethannitril: ["Acetonitril"], Methannitril: ["Blausäure"], Ethanamid: ["Acetamid"], Benzencarbonsäure: ["Benzoesäure"],
  Oxolan: ["Tetrahydrofuran"], Oxan: ["Tetrahydropyran"], Benzenamin: ["Anilin"],
};

function altNames(nm: string, ctx: Ctx, o: Option, K: Kind | undefined): string[] {
  const alt: string[] = [...(TRIVIAL[nm] ?? [])];
  if (/benzen/.test(nm)) alt.push(nm.replace(/benzen/g, "benzol"));
  // ältere Schreibweise: Propan-2-ol → 2-Propanol, But-2-en → 2-Buten
  const ring = /benzen|cyclo|^Phenol|^Anilin/i.test(nm);
  const m = ring ? null : /^([A-Z][a-zäöü]*?)(an|en|in)-([\d,]+)-(di|tri|tetra)?(ol|on|amin|thiol)$/.exec(nm);
  if (m) alt.push(`${m[3]}-${m[1]}${m[2]}${m[4] ?? ""}${m[5]}`);
  const e = ring ? null : /^([A-Z][a-z]*?)-([\d,]+)-(di|tri)?(en|in)$/.exec(nm);
  if (e) alt.push(`${e[2]}-${e[1]}${e[3] ? "a" + e[3] : ""}${e[4]}`);
  // Schulnamen: Ether (Diethylether), Amine (Ethylamin)
  const sch = schoolName(ctx, o, K);
  if (sch) alt.push(sch);
  return [...new Set(alt.filter(a => a !== nm))];
}

/** Ether R–O–R′ und Amine R–NH₂ / R₂NH ohne weitere Gruppen: Namen aus den Alkylresten */
function schoolName(ctx: Ctx, o: Option, K: Kind | undefined): string | undefined {
  const { g } = ctx;
  const plain = (s: Sub) => !s.complex && /yl$/.test(s.name);
  if (!K) {
    const os = g.ids.filter(a => g.el.get(a) === "O");
    if (os.length !== 1 || g.ids.some(a => !["C", "O"].includes(g.el.get(a)!))) return;
    const ox = os[0], nb = g.nb.get(ox)!;
    if (nb.length !== 2 || ctx.ri.ringOf.has(ox)) return;
    const parts = nb.map(n => sub(ctx, n.to, ox, 1));
    if (!parts.every(plain)) return;
    return cap(multiplied(parts) + "ether");
  }
  if (K === "amin" && o.counted.length === 1 && ctx.groups.length === 1 && g.ids.every(a => ["C", "N"].includes(g.el.get(a)!))) {
    const nn = o.counted[0].n!;
    const parts = g.nb.get(nn)!.map(n => sub(ctx, n.to, nn, 1));
    if (!parts.every(plain)) return;
    return cap(multiplied(parts) + "amin");
  }
}

/** Stoffklassen (Kategorien) des Moleküls */
function classes(ctx: Ctx): string[] {
  const { g, ri, groups } = ctx;
  const out: string[] = [];
  const has = (k: Kind) => groups.some(x => x.kind === k);
  const bonds = g.mol.bonds;
  const ccDouble = bonds.some(b => b.order === 2 && g.el.get(b.a) === "C" && g.el.get(b.b) === "C" && !(ri.ringOf.get(b.a)?.aromatic));
  const ccTriple = bonds.some(b => b.order === 3 && g.el.get(b.a) === "C" && g.el.get(b.b) === "C");
  const onlyCH = g.ids.every(a => g.el.get(a) === "C");
  if (onlyCH) {
    if (ri.rings.some(r => r.kind === "benzen")) out.push("Aromat");
    if (ccTriple) out.push("Alkin");
    if (ccDouble) out.push(ri.rings.some(r => r.kind === "carbo" && !r.aromatic) && !bonds.some(b => b.order === 2 && !ri.ringOf.has(b.a)) ? "Cycloalken" : "Alken");
    if (!ccDouble && !ccTriple && !out.length) out.push(ri.rings.length ? "Cycloalkan" : "Alkan");
    return out;
  }
  if (has("saeure") && has("amin")) out.push("Aminosäure");
  else if (has("saeure")) out.push("Carbonsäure");
  if (has("ester")) out.push("Ester");
  if (has("amid")) out.push("Amid");
  if (has("nitril")) out.push("Nitril");
  if (has("al")) out.push("Aldehyd");
  if (has("on")) out.push("Keton");
  if (has("ol")) out.push(groups.some(x => x.kind === "ol" && ri.ringOf.get(x.c)?.kind === "benzen") ? "Phenol" : "Alkohol");
  if (has("thiol")) out.push("Thiol");
  if (has("amin") && !has("saeure")) out.push("Amin");
  const ether = g.ids.some(a => g.el.get(a) === "O" && !ri.ringOf.has(a) && g.nb.get(a)!.length === 2 && g.nb.get(a)!.every(n => dblO(g, n.to) === undefined));
  if (ether) out.push("Ether");
  if (g.ids.some(a => HALOGENS.includes(g.el.get(a)!))) out.push("Halogenverbindung");
  if (g.ids.some(a => g.el.get(a) === "NO2")) out.push("Nitroverbindung");
  if (ri.rings.some(r => r.kind === "hetero")) out.push("Heterocyclus");
  if (ri.rings.some(r => r.kind === "benzen") && !out.includes("Phenol")) out.push("Aromat");
  if (!out.length) out.push("Thioether");
  return out;
}

const nums = (xs: number[]) => xs.join(", ");
const PARENT_WORD = (o: Option) => (o.kind === "chain" ? "Hauptkette" : "Ring");

function steps(ctx: Ctx, o: Option, K: Kind | undefined, r: NameOk): string[] {
  const out: string[] = [];
  const n = o.counted.length;
  const info = K ? KIND_INFO[K] : undefined;
  if (K === "ester") out.push(`Hauptgruppe: **Ester** ${info!.group}. Name = Säure-Teil + Alkyl-Teil + **ester**.`);
  else if (info && n) out.push(`Hauptgruppe: **${info.label}** ${info.group} → Endung **${info.suffix}**${n > 1 ? ` (${n}× → ${MULT[n]}…)` : ""}.`);
  else out.push("Keine Gruppe mit Endung: Name endet auf **-an**, **-en** oder **-in**.");
  const others = RANK.filter(k => k !== K && ctx.groups.some(x => x.kind === k));
  if (others.length) out.push(`Weitere Gruppen als Vorsilbe: ${others.map(k => `**${KIND_INFO[k].prefix}**`).join(", ")}.`);
  if (o.kind === "chain") {
    const why = n ? `längste Kette mit ${n > 1 ? "den Hauptgruppen" : "der Hauptgruppe"}` : "längste Kette";
    out.push(`${PARENT_WORD(o)}: ${why} → **${o.seq.length} C** = **${cap(STEM[o.seq.length])}an**.`);
  } else {
    const rk = o.ring!;
    const rn = rk.kind === "benzen" ? "Benzen (Benzolring)" : rk.kind === "carbo" ? cap(rk.base) + "an" : cap(rk.base);
    out.push(`Stammsystem: **Ring** geht vor Kette → **${rn}**.`);
  }
  const what = [n ? "Hauptgruppe" : "", o.en.length || o.yn.length ? "Mehrfachbindung" : "", o.prefixes.length ? "Seitenketten" : ""].filter(Boolean);
  if (o.seq.length > 1 && what.length) out.push(`Nummerieren: so, dass ${what[0] === "Hauptgruppe" ? "die **Hauptgruppe**" : what[0] === "Mehrfachbindung" ? "die **Mehrfachbindung**" : "die **Seitenketten**"} die kleinste Nummer bekommt.`);
  if (n && o.kind === "chain" && o.mode === "incl" && K && C_TYPE.has(K)) out.push(`Das C der ${info!.label}gruppe ist **C1** – die Nummer steht nicht im Namen.`);
  if (o.en.length) out.push(`Doppelbindung bei C${nums(o.en)} → **-en**.`);
  if (o.yn.length) out.push(`Dreifachbindung bei C${nums(o.yn)} → **-in**.`);
  if (r.prefixes.length) {
    const list = r.prefixes.map(p => `**${cap(`${p.locs.length ? p.locs.join(",") + "-" : ""}${p.locs.length > 1 ? MULT[p.locs.length] : ""}${p.name}`)}**`);
    out.push(`Vorsilben: ${list.join(", ")}.`);
    if (r.prefixes.length > 1) out.push(`Alphabetisch ordnen (di, tri zählen nicht): ${r.prefixes.map(p => cap(p.name.replace(/[()]/g, ""))).join(" · ")}.`);
  }
  if (r.ester) out.push(`Säure-Teil **${r.ester.acid}**, Alkyl-Teil **${r.ester.alkyl}** → **${r.name}**.`);
  else out.push(`Name: **${r.name}**`);
  return out;
}

/** nur für Tests und Beispiele: Name direkt aus der Kurzschreibweise */
export const hasH = (mol: Mol, id: number) => hCount(graph(mol), id) > 0;
