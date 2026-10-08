// Systematische Namen organischer Verbindungen (IUPAC-Regeln, deutsche Schreibweise).
//
// Ablauf: funktionelle Gruppen erkennen → Hauptgruppe (höchste Priorität) → Stammsystem wählen (Kette oder Ring) →
// nummerieren → Vorsilben (Substituenten) benennen, alphabetisch ordnen → Name zusammensetzen.
//
// Stammsystem und Nummern (IUPAC 2013, in dieser Reihenfolge): meiste Hauptgruppen · Ring vor Kette · Ring mit N vor O vor S vor
// Carbocyclus, größerer Ring · längste Kette · meiste Mehrfachbindungen · meiste Doppelbindungen · kleinste Nummern für Hauptgruppen,
// dann Mehrfachbindungen, dann Doppelbindungen · meiste Vorsilben · kleinste Nummern aller Vorsilben · der alphabetisch ersten · Z vor E.
// Mehr als zwei Carbonsäuregruppen an einer Kette: „-carbonsäure“ (Kohlenstoff der Gruppe gehört nicht zur Kette).
// Substituenten werden rekursiv benannt (Methyl, (1-Methylethyl), Acetyloxy, Phenyl …). Ester: „Butansäureethylester“.

import { formula, graph, hCount, components, usedValence, HALOGENS, VALENCE, type El, type Graph, type Mol } from "./mol.ts";
import { findRings, MAX_STEM, MULT, MULT_X, STEM, type Ring, type RingInfo } from "./rings.ts";
import { stereoBonds, type Stereo } from "./stereo.ts";
import { localizeEn, parentEn, prefixEn, toEnglish } from "./english.ts";
import { tr, getLang } from "@lern/i18n";

export type Kind = "saeure" | "ester" | "amid" | "nitril" | "al" | "on" | "ol" | "thiol" | "amin";
/** Priorität der Hauptgruppen (höchste zuerst) */
export const RANK: Kind[] = ["saeure", "ester", "amid", "nitril", "al", "on", "ol", "thiol", "amin"];
const C_TYPE = new Set<Kind>(["saeure", "ester", "amid", "nitril", "al"]);

export const KIND_INFO: Record<Kind, { label: string; group: string; suffix: string; prefix: string }> = tr({
  saeure: { label: "Carbonsäure", group: "–COOH", suffix: "-säure", prefix: "Carboxy-" },
  ester: { label: "Ester", group: "–COO–", suffix: "-säure…ester", prefix: "…oxycarbonyl-" },
  amid: { label: "Amid", group: "–CONH₂", suffix: "-amid", prefix: "Carbamoyl-" },
  nitril: { label: "Nitril", group: "–C≡N", suffix: "-nitril", prefix: "Cyano-" },
  al: { label: "Aldehyd", group: "–CHO", suffix: "-al", prefix: "Oxo-" },
  on: { label: "Keton", group: "C=O", suffix: "-on", prefix: "Oxo-" },
  ol: { label: "Alkohol", group: "–OH", suffix: "-ol", prefix: "Hydroxy-" },
  thiol: { label: "Thiol", group: "–SH", suffix: "-thiol", prefix: "Sulfanyl-" },
  amin: { label: "Amin", group: "–NH₂", suffix: "-amin", prefix: "Amino-" },
}, {
  saeure: { label: "Carboxylic acid", group: "–COOH", suffix: "-oic acid", prefix: "carboxy-" },
  ester: { label: "Ester", group: "–COO–", suffix: "alkyl …-oate", prefix: "…oxycarbonyl-" },
  amid: { label: "Amide", group: "–CONH₂", suffix: "-amide", prefix: "carbamoyl-" },
  nitril: { label: "Nitrile", group: "–C≡N", suffix: "-nitrile", prefix: "cyano-" },
  al: { label: "Aldehyde", group: "–CHO", suffix: "-al", prefix: "oxo-" },
  on: { label: "Ketone", group: "C=O", suffix: "-one", prefix: "oxo-" },
  ol: { label: "Alcohol", group: "–OH", suffix: "-ol", prefix: "hydroxy-" },
  thiol: { label: "Thiol", group: "–SH", suffix: "-thiol", prefix: "sulfanyl-" },
  amin: { label: "Amine", group: "–NH₂", suffix: "-amine", prefix: "amino-" },
});

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
  /** Doppelbindungen mit E/Z-Isomerie (aus der Zeichnung) */
  stereo: Stereo[];
}

// ── E/Z ─────────────────────────────────────────────────────────────────────

interface EZ { loc: number; desc: "E" | "Z"; s: Stereo }

/** E/Z-Angaben der Doppelbindungen, die zu diesen Atomen (Kette/Ring in Nummernfolge) gehören; `skip` = Bindung zum Stammsystem */
function ezOf(ctx: Ctx, seq: number[], skip?: [number, number]): EZ[] {
  const at = new Map(seq.map((a, i) => [a, i + 1]));
  const out: EZ[] = [];
  for (const s of ctx.stereo) {
    if (!s.desc) continue;
    if (skip && ((s.a === skip[0] && s.b === skip[1]) || (s.a === skip[1] && s.b === skip[0]))) continue;
    const la = at.get(s.a), lb = at.get(s.b);
    if (la === undefined && lb === undefined) continue;
    out.push({ loc: la !== undefined && lb !== undefined ? (Math.abs(la - lb) > 1 ? Math.max(la, lb) : Math.min(la, lb)) : (la ?? lb)!, desc: s.desc, s });
  }
  return out.sort((x, y) => x.loc - y.loc);
}
/** (E)- bei einer Doppelbindung, (2E,4Z)- bei mehreren */
const ezText = (list: EZ[]) => (!list.length ? "" : list.length === 1 ? `(${list[0].desc})-` : `(${list.map(x => `${x.loc}${x.desc}`).join(",")})-`);

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
    if (nbs.some(n => n.order >= 2 && n.to !== o)) { fail("Keten (C=C=O)"); continue; }
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
interface Prefix { name: string; complex: boolean; loc: string; key: string; atoms?: number[]; at?: number }
/** Teil des Namens mit Kennung für die Farbe: Vorsilbe (Name der Vorsilbe), parent (Stamm), principal (Endung), alkyl (Ester) */
export interface NamePart { text: string; key?: string }

/** Atome eines Substituenten: alles hinter x, ohne über `from` zurückzugehen */
function subtree(g: Graph, x: number, from: number): number[] {
  const seen = new Set([x, from]), out = [x], stack = [x];
  while (stack.length) {
    const v = stack.pop()!;
    for (const n of g.nb.get(v)!) if (!seen.has(n.to)) { seen.add(n.to); out.push(n.to); stack.push(n.to); }
  }
  return out;
}

/** Alphabet der Vorsilben: deutsch (Ethinyl vor Ethyl) oder – nur während `nameEnOrder` – englisch (ethyl vor ethynyl) */
let alphaEn = false;
/** Schlüssel für die alphabetische Ordnung: ohne Nummern, Klammern, Bindestriche und ohne E/Z-Angaben (gemerkt – wird beim Sortieren oft gebraucht) */
const keys = new Map<string, string>();
function sortKey(name: string): string {
  const id = (alphaEn ? "en " : "de ") + name;
  let k = keys.get(id);
  if (k === undefined) {
    if (keys.size > 5000) keys.clear();
    k = (alphaEn ? prefixEn(name) : name).replace(/\((?:\d*[EZ],?)+\)-/g, "").replace(/[\d,'′″\-()[\]{}\s]/g, "").toLowerCase();
    keys.set(id, k);
  }
  return k;
}
/** alphabetisch; bei gleichen Buchstaben entscheiden die Nummern im Namen (1-Methylbutyl vor 2-Methylbutyl), dann Z vor E */
function alphaCmp(a: string, b: string): number {
  const c = sortKey(a).localeCompare(sortKey(b));
  if (c) return c;
  const plain = (n: string) => n.replace(/\((?:\d*[EZ],?)+\)-/g, "");
  const nums = (n: string) => (plain(n).match(/\d+/g) ?? []).map(Number);
  const na = nums(a), nb = nums(b);
  for (let i = 0; i < Math.min(na.length, nb.length); i++) if (na[i] !== nb[i]) return na[i] - nb[i];
  if (na.length !== nb.length) return na.length - nb.length;
  const ez = (n: string) => (n.match(/\((?:\d*[EZ],?)+\)/g) ?? []).join("").replace(/[^EZ]/g, "").replace(/Z/g, "0").replace(/E/g, "1");
  return ez(a).localeCompare(ez(b));
}
const mkPrefix = (s: Sub, loc: string): Prefix => ({ ...s, loc, key: sortKey(s.name) });
/** Vorsilben, die selbst Substituenten tragen können (Methoxy, Ethyl, Amino …) – ohne Nummern dahinter in Klammern: Chlor(methoxy)methyl */
const TERMINAL = new Set(["fluor", "chlor", "brom", "iod", "nitro", "oxo", "hydroxy", "cyano", "carboxy", "formyl"]);
const substitutable = (name: string) => !TERMINAL.has(name);

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
/** Klammern um zusammengesetzte Namen: (Methylamino), außen jeweils die nächste Art: ( ) → [ ] → { } → ( ) … */
function paren(n: string): string {
  const next: Record<string, [string, string]> = { "": ["(", ")"], "(": ["[", "]"], "[": ["{", "}"], "{": ["(", ")"] };
  const rank = (c: string) => "([{".indexOf(c) + 1;
  let depth = 0, top = "";
  for (const c of n) {
    if ("([{".includes(c)) { if (depth === 0 && rank(c) > rank(top || " ")) top = c; depth++; }
    else if (")]}".includes(c)) depth--;
  }
  const [o, cl] = next[top];
  return o + n + cl;
}
const wrap = (s: Sub) => (s.complex ? paren(s.name) : s.name);

function subRaw(ctx: Ctx, x: number, from: number, order: number): Sub {
  const { g, ri } = ctx;
  const e = g.el.get(x)!;
  const rest = g.nb.get(x)!.filter(n => n.to !== from);
  if (order === 2 && e === "O") return { name: "oxo", complex: false };
  if (e === "NO2") return { name: "nitro", complex: false };
  if (HALO_NAME[e]) return { name: HALO_NAME[e]!, complex: false };
  // Ringatom (auch das N von Piperidin, Pyrrolidin …): Ring als Substituent (Piperidin-1-yl)
  if (ri.ringOf.has(x)) return ringSub(ctx, x, from, order);
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
    return { name: multiplied(parts, true) + "amino", complex: true };
  }
  // Kohlenstoff
  if (rest.some(n => n.order === 3 && g.el.get(n.to) === "N")) return { name: "cyano", complex: false };
  if (order === 1 && dblO(g, x) !== undefined) return acyl(ctx, x, from);
  return chainSub(ctx, x, from, order, "yl");
}

/** gleiche Teile zusammenfassen und alphabetisch: Methyl + Methyl → dimethyl, Ethyl + Methyl → ethylmethyl;
 *  `sep`: ab der zweiten Gruppe Vorsilben, die selbst Substituenten tragen können, in Klammern (ethyl(methyl)amino) */
function multiplied(parts: Sub[], sep = false): string {
  const by = new Map<string, Sub[]>();
  for (const p of parts) by.set(p.name, [...(by.get(p.name) ?? []), p]);
  return [...by.values()].sort((a, b) => alphaCmp(a[0].name, b[0].name))
    .map((ps, i) => {
      const body = (ps.length > 1 ? (ps[0].complex ? MULT_X[ps.length] : MULT[ps.length]) : "") + wrap(ps[0]);
      return sep && i > 0 && !ps[0].complex && substitutable(ps[0].name) ? `(${body})` : body;
    }).join("");
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
    return { name: multiplied(r.map(n => sub(ctx, n.to, z, 1)), true) + "carbamoyl", complex: true };
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
/** Vorsilben mit Nummer in alphabetischer Reihenfolge (gleiche Vorsilbe: kleinere Nummer zuerst) */
const alphaSorted = (ps: Prefix[]) => [...ps].filter(p => /^\d/.test(p.loc)).sort((a, b) => alphaCmp(a.name, b.name) || locNum(a.loc) - locNum(b.loc));
const alphaLocs = (ps: Prefix[]) => alphaSorted(ps).map(p => locNum(p.loc));

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
    const name = ezText(ezOf(ctx, p, [x, from])) + pre + core;
    const key: KeyPart[] = [-p.length, -(en.length + yn.length), -en.length, [...en, ...yn].sort((a, b) => a - b), en, -prefixes.length, prefixLocs(prefixes), alphaLocs(prefixes), name];
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
    const name = ezText(ezOf(ctx, seq, [x, from])) + pre + core;
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
  return prefixParts(ps, omit, f).map(p => p.text).join("");
}

/** Vorsilben als Teile mit Kennung (für die Farben); Bindestriche zwischen den Vorsilben ohne Kennung */
function prefixParts(ps: Prefix[], omit: boolean, f: Flags): NamePart[] {
  const by = new Map<string, Prefix[]>();
  for (const p of ps) by.set(p.name, [...(by.get(p.name) ?? []), p]);
  const locOrder = (a: string, b: string) => (/^\d/.test(a) ? 1 : 0) - (/^\d/.test(b) ? 1 : 0) || locNum(a) - locNum(b) || a.localeCompare(b);
  let groups = [...by.values()].map(g => g.sort((a, b) => locOrder(a.loc, b.loc)));
  if (f.noMult) groups = ps.map(p => [p]);
  groups.sort((a, b) => (f.noAlpha ? locOrder(a[0].loc, b[0].loc) || alphaCmp(a[0].name, b[0].name) : alphaCmp(a[0].name, b[0].name) || locOrder(a[0].loc, b[0].loc)));
  const out: NamePart[] = [];
  for (const g of groups) {
    const n = g.length, s = g[0];
    const mult = n > 1 ? (s.complex ? MULT_X[n] : MULT[n]) : "";
    const locs = g.map(p => p.loc);
    const keep = !omit || locs.some(l => !/^\d/.test(l));
    const shown = keep ? locs.filter(l => !omit || !/^\d/.test(l)) : [];
    let body = mult + (s.complex ? paren(s.name) : s.name);
    // ohne Nummer hinter einer anderen Vorsilbe: eindeutig nur mit Klammern (Chlor(methoxy)methan, nicht Chlormethoxymethan)
    if (!shown.length && out.length && !s.complex && substitutable(s.name)) body = `(${body})`;
    const text = (shown.length ? shown.join(",") + "-" : "") + body;
    if (out.length && /^[\dN]/.test(text)) out.push({ text: "-" });
    out.push({ text, key: s.name });
  }
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
  /** Teil des Schlüssels für die Nummern (Regeln wie in NUM_RULES) */
  num: KeyPart[];
}

/** Regeln der Nummerierung in der Reihenfolge des Schlüssels (nach dem Stammsystem) */
const NUM_RULES = ["principal", "multiple", "double", "count", "prefixes", "alpha", "z"] as const;
export type NumRule = (typeof NUM_RULES)[number];

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
  const nNames = (gr: Group) => (gr.n === undefined ? [] : g.nb.get(gr.n)!.filter(nb => !set.has(nb.to) && nb.to !== gr.c).map(nb => sub(ctx, nb.to, gr.n!, 1).name).sort(alphaCmp));
  const firstName = (gr: Group) => nNames(gr)[0] ?? "~";
  counted.sort((a, b) => at.get(a)! - at.get(b)! || nSubs(b) - nSubs(a) || alphaCmp(firstName(a), firstName(b)));
  for (const gr of counted) {
    if (gr.n === undefined) continue;
    const loc = ["N", "N′", "N″", "N‴"][nIdx++] ?? "N‴";
    for (const nb of g.nb.get(gr.n)!) {
      if (set.has(nb.to) || nb.to === gr.c) continue;
      const z = nb.to;
      const s = dblO(g, z) !== undefined && !ctx.ri.ringOf.has(z) ? acyl(ctx, z, gr.n) : sub(ctx, z, gr.n, 1);
      nPrefixes.push({ ...mkPrefix(s, loc), atoms: subtree(g, z, gr.n), at: gr.n });
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
      prefixes.push({ ...mkPrefix(sub(ctx, nb.to, a, nb.order), String(i + 1)), atoms: subtree(g, nb.to, a), at: a });
    }
  });
  const mult = [...en, ...yn].sort((a, b) => a - b);
  // zuletzt: bei Wahl bekommt Z die kleinere Nummer (vor E)
  const zLocs = ezOf(ctx, seq).filter(x => x.desc === "Z").map(x => x.loc);
  const num: KeyPart[] = [pLocs, mult, en, -prefixes.length, prefixLocs(prefixes), alphaLocs(prefixes), zLocs];
  const key: KeyPart[] = [-counted.length, ...structural, ...num];
  return { id, kind, ring, seq, mode, counted, pLocs, en, yn, prefixes, suffixAtoms, key, num };
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
      // Heterocyclus mit N vor O vor S vor Carbocyclus, dann der größere Ring, dann mehr Mehrfachbindungen
      const het = ring.hetero === undefined ? undefined : g.el.get(ring.hetero);
      const cls = het === "N" ? 0 : het === "O" ? 1 : het === "S" ? 2 : 3;
      const structural: KeyPart[] = [0, cls, -ring.atoms.length, -(en.length + yn.length + doubles)];
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
function optionName(ctx: Ctx, o: Option, K: Kind | undefined, f: Flags): string {
  return optionParts(ctx, o, K, f).map(p => p.text).join("");
}

/** Name in Teilen: Vorsilben (je Name), Stamm (parent), Endung mit Nummern (principal) */
function optionParts(ctx: Ctx, o: Option, K: Kind | undefined, f: Flags): NamePart[] {
  const omit = omitLocants(o);
  const n = o.counted.length;
  const kind = n ? K : undefined;
  const plocs = o.pLocs.join(",");
  const ez = ezText(ezOf(ctx, o.seq));
  const pre: NamePart[] = [...(ez ? [{ text: ez, key: "stereo" }] : []), ...prefixParts(o.prefixes, omit, f)];
  if (o.kind === "ring" && o.ring!.kind === "benzen" && kind && n === 1 && BENZ_RETAINED[kind]) return [...pre, { text: BENZ_RETAINED[kind]!, key: "principal" }];
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
  return [...pre, { text: stem, key: "parent" }, ...(suffix ? [{ text: suffix, key: "principal" }] : [])];
}

/** ersten Kleinbuchstaben des Namens groß schreiben – über Teile hinweg */
function capParts(parts: NamePart[]): NamePart[] {
  let done = false;
  return parts.map(p => {
    if (done || !/[a-zäöü]/.test(p.text)) return p;
    done = true;
    return { ...p, text: cap(p.text) };
  });
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
/** Endungen und Gruppen in Sätzen nicht umbrechen („→ -⏎in“, „–⏎COO–“): Bindestrich vor einer Endung als geschützter Bindestrich (U+2011),
 *  nach dem Bindungsstrich einer Gruppe ein Wortverbinder (U+2060); Namen bleiben unverändert */
export const keepEnding = (s: string) => s.replace(/(^|[\s(„/*])-(?=\p{L})/gu, "$1\u2011").replace(/–(?=[A-Z(])/g, "–\u2060");

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
  /** Ester: Name des Alkylteils (zusammengefasst und einzeln) und seine Atome */
  ester?: { acid: string; alkyl: string; alkyls: Sub[]; alkylLocs: number[]; alkylAtoms: number[] };
  /** Lösungsweg in kurzen Schritten (**fett**) */
  steps: string[];
  /** Name in Teilen mit Kennung (für gleiche Farben in Name und Formel) */
  parts: NamePart[];
  /** Atome je Kennung: parent, principal, alkyl, je Vorsilbe */
  groupsByKey: Record<string, number[]>;
  /** Doppelbindungen mit E/Z im Stammsystem (desc null: aus der Zeichnung nicht erkennbar) */
  stereo: StereoAt[];
  /** Vorsilben mit Atom am Stammsystem (at) und erstem Atom des Substituenten (first) – für Prüfungen */
  subs: { at: number; first: number; name: string; loc: string }[];
  /** nur bei `pick: "reverse"`: Regel, nach der die andere Richtung gewinnt, mit ihren Nummern (right) und denen dieser Richtung (wrong);
   *  bond = Art der Mehrfachbindungen, prefix = Vorsilbe, bei der das Alphabet entscheidet */
  reverse?: { rule: NumRule; right: number[]; wrong: number[]; bond?: "double" | "triple" | "multiple"; prefix?: string };
}
/** Doppelbindung mit E/Z und ihren Nummern im Stammsystem (la/lb fehlt, wenn das Atom außerhalb liegt) */
export type StereoAt = Stereo & { loc: number; la?: number; lb?: number };
export interface NameFail { ok: false; reason: string; formula: string }
export type NameResult = NameOk | NameFail;

/** Vorbereitung: Graph, Ringe, Gruppen; Meldung, wenn die App die Struktur nicht benennen kann */
function prepare(mol: Mol): { ctx: Ctx; bad?: string } {
  const g = graph(mol);
  const ri = findRings(g);
  const d = detect(g, ri);
  const ctx: Ctx = { g, ri, groups: d.groups, nitrileC: d.nitrileC, memo: new Map(), stereo: [] };
  let bad = d.bad ?? ri.unsupported;
  // mehr Bindungen als die Wertigkeit erlaubt (der Editor verhindert das; Schutz für erzeugte Moleküle)
  if (g.ids.some(a => usedValence(g, a) > VALENCE[g.el.get(a)!])) bad = "Zu viele Bindungen an einem Atom";
  // Stämme gibt es bis 30 C (Triacontan)
  else if (!bad && longestChain(g, ri) > MAX_STEM) bad = `Kette mit mehr als ${MAX_STEM} C – zu lang für diese App`;
  if (!bad) ctx.stereo = stereoBonds(mol, g);
  if (!mol.atoms.length) bad = "Noch nichts gezeichnet";
  else if (components(mol).length > 1) bad = "Mehrere getrennte Teile – verbinde sie";
  else if (!mol.atoms.some(a => a.el === "C")) bad = "Kein Kohlenstoff – keine organische Verbindung";
  return { ctx, bad };
}

/** längste Kette aus C außerhalb von Ringen (Zahl der Atome): jede Kette des Namens (Stamm oder Vorsilbe) liegt darin –
 *  die C außerhalb der Ringe bilden einen Wald, sein Durchmesser folgt aus zweimal „fernstes Atom suchen“ */
function longestChain(g: Graph, ri: RingInfo): number {
  const cs = new Set(g.ids.filter(a => g.el.get(a) === "C" && !ri.ringOf.has(a)));
  const far = (s: number) => {
    const dist = new Map([[s, 1]]), queue = [s];
    for (const v of queue) for (const n of g.nb.get(v)!) if (cs.has(n.to) && !dist.has(n.to)) { dist.set(n.to, dist.get(v)! + 1); queue.push(n.to); }
    return { end: queue[queue.length - 1], len: dist.get(queue[queue.length - 1])!, seen: dist };
  };
  let best = 0;
  const done = new Set<number>();
  for (const s of cs) {
    if (done.has(s)) continue;
    const a = far(s);
    a.seen.forEach((_, k) => done.add(k));
    best = Math.max(best, far(a.end).len);
  }
  return best;
}

/** Hauptgruppe = Gruppe mit der höchsten Priorität */
const principalOf = (groups: Group[], override?: Kind): Kind | undefined => override ?? RANK.find(k => groups.some(x => x.kind === k));

export interface NameOptions extends Flags {
  /** andere Hauptgruppe erzwingen (falsche Priorität – nur für das Quiz) */
  principal?: Kind;
  /** n-te Möglichkeit statt der besten (andere Kette oder Nummerierung – nur für das Quiz) */
  pick?: "reverse" | "otherChain";
}

/** Name des Moleküls; auf Englisch Name, Teile, weitere Namen und Meldungen übersetzt */
export function name(mol: Mol, opt: NameOptions = {}): NameResult {
  if (getLang() !== "en") return nameDe(mol, opt);
  const r = nameEnOrder(mol, opt);
  return r.ok ? localizeEn(r) : { ...r, reason: REASON_EN[r.reason] ?? r.reason };
}

/** Name in deutschen Teilen, aber mit englischer Reihenfolge und Nummerierung der Vorsilben (ethyl vor ethynyl, deutsch
 *  Ethinyl vor Ethyl) – Grundlage für `toEnglish` */
export function nameEnOrder(mol: Mol, opt: NameOptions = {}): NameResult {
  alphaEn = true;
  try { return nameDe(mol, opt); } finally { alphaEn = false; }
}

const REASON_EN: Record<string, string> = {
  "Noch nichts gezeichnet": "Nothing drawn yet", "Mehrere getrennte Teile – verbinde sie": "Several separate parts – connect them",
  "Kein Kohlenstoff – keine organische Verbindung": "No carbon – not an organic compound", "Keine andere Möglichkeit": "No other option",
  "Bindung zwischen zwei Nicht-Kohlenstoff-Atomen": "Bond between two non-carbon atoms", "Mehrfachbindung am Halogen": "Multiple bond at the halogen",
  "Zwei Doppelbindungen zu O am selben C": "Two double bonds to O on the same C", "Nitril im Ring": "Nitrile in a ring",
  "C=N- oder C=S-Doppelbindung": "C=N or C=S double bond", "Keten (C=C=O)": "Ketene (C=C=O)",
  "Kohlensäure-Abkömmling (zwei Heteroatome am C=O)": "Carbonic acid derivative (two heteroatoms on C=O)", "Säureanhydrid": "Acid anhydride",
  "Amid im Ring": "Amide in a ring", "Säurehalogenid oder Thioester": "Acid halide or thioester", "C=N-Doppelbindung": "C=N double bond",
  "Stickstoff an zwei C=O": "Nitrogen on two C=O", "Imid (N an zwei C=O)": "Imide (N on two C=O)",
  "Mehrere Ringe teilen sich Atome": "Several rings share atoms", "Ring mit mehreren Heteroatomen": "Ring with several heteroatoms",
  "Heterocyclus mit mehr als 6 Atomen": "Heterocycle with more than 6 atoms", "Teilweise ungesättigter Heterocyclus": "Partially unsaturated heterocycle",
  "Dreifachbindung im Ring": "Triple bond in a ring", "Zu viele Bindungen an einem Atom": "Too many bonds on one atom",
  [`Kette mit mehr als ${MAX_STEM} C – zu lang für diese App`]: `Chain with more than ${MAX_STEM} C – too long for this app`,
  [`Ring mit mehr als ${MAX_STEM} Atomen – zu groß für diese App`]: `Ring with more than ${MAX_STEM} atoms – too large for this app`,
};

function nameDe(mol: Mol, opt: NameOptions): NameResult {
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
  const parts = capParts(optionParts(ctx, o, K, opt));
  const nm = parts.map(p => p.text).join("");
  const res: NameOk = {
    ok: true, name: nm, alt: altNames(nm, ctx, o, K), formula: f, classes: classes(ctx), principal: o.counted.length ? K : undefined,
    parent: { atoms: o.seq, kind: o.kind, ring: o.ring?.kind, size: o.seq.length },
    principalAtoms: o.counted.flatMap(x => (C_TYPE.has(x.kind) ? [x.c, ...x.atoms] : x.kind === "on" ? [x.c, ...x.atoms] : x.atoms)),
    prefixes: groupedPrefixes(o.prefixes, omitLocants(o)),
    steps: [], parts, groupsByKey: {}, stereo: parentStereo(ctx, o.seq), subs: subsOf(o),
  };
  res.groupsByKey = keyAtoms(o, res.principalAtoms);
  res.alt = withCisTrans(res, ctx);
  res.steps = steps(ctx, o, K, res, rivalOf(opts, o));
  if (opt.pick === "reverse") res.reverse = reverseRule(opts[0], o);
  return res;
}

/** Warum die beste Nummerierung gewinnt: erste Regel, in der sich die beiden Richtungen unterscheiden (undefined = gleichwertig) */
function reverseRule(best: Option, o: Option): NameOk["reverse"] {
  const i = best.num.findIndex((x, j) => cmpKey([x], [o.num[j]]) !== 0);
  if (i < 0) return;
  const rule = NUM_RULES[i];
  const list = (x: KeyPart) => (Array.isArray(x) ? x : []);
  const bond = !best.yn.length ? "double" : !best.en.length ? "triple" : "multiple";
  if (rule !== "alpha") return { rule, right: list(best.num[i]), wrong: list(o.num[i]), bond };
  const right = list(best.num[i]), wrong = list(o.num[i]);
  const k = right.findIndex((x, j) => x !== wrong[j]);
  return { rule, right: [right[k]], wrong: [wrong[k]], prefix: alphaSorted(best.prefixes)[k].name };
}

/** Vorsilben mit Anknüpfung (Atom am Stammsystem, erstes Atom des Substituenten) */
const subsOf = (o: Option) => o.prefixes.map(p => ({ at: p.at ?? -1, first: p.atoms?.[0] ?? -1, name: p.name, loc: p.loc }));

/** Atome je Teil des Namens */
function keyAtoms(o: Option, principal: number[]): Record<string, number[]> {
  const out: Record<string, number[]> = { parent: [...o.seq], principal: [...principal] };
  for (const p of o.prefixes) out[p.name] = [...(out[p.name] ?? []), ...(p.atoms ?? [])];
  return out;
}

/** Doppelbindungen mit E/Z am Stammsystem – auch die nicht erkennbaren (für Hinweis und Bild) */
function parentStereo(ctx: Ctx, seq: number[]): StereoAt[] {
  const at = new Map(seq.map((a, i) => [a, i + 1]));
  return ctx.stereo.filter(s => at.has(s.a) || at.has(s.b))
    .map(s => {
      const la = at.get(s.a), lb = at.get(s.b);
      const loc = la !== undefined && lb !== undefined ? (Math.abs(la - lb) > 1 ? Math.max(la, lb) : Math.min(la, lb)) : (la ?? lb)!;
      return { ...s, la, lb, loc };
    })
    .sort((x, y) => x.loc - y.loc);
}

/** cis/trans zusätzlich, wenn eine Doppelbindung je ein H an beiden C hat (dann ist Z = cis, E = trans) */
function withCisTrans(r: NameOk, ctx: Ctx): string[] {
  const one = /^\(([EZ])\)-(.*)$/.exec(r.name);
  const all = ctx.stereo.filter(s => s.desc);
  if (!one || all.length !== 1 || r.stereo.length !== 1) return r.alt;
  const s = r.stereo[0];
  if (s.qa !== -1 || s.qb !== -1) return r.alt;
  return [...r.alt, `${one[1] === "Z" ? "cis" : "trans"}-${one[2]}`];
}

function choose(opts: Option[], pick?: "reverse" | "otherChain"): Option | undefined {
  const best = opts[0];
  if (!pick || !best) return best;
  if (pick === "reverse") return opts.find(o => o.id === best.id && o.seq.join() !== best.seq.join() && o.kind === best.kind);
  return opts.find(o => o.id !== best.id && o.kind === best.kind && o.seq.length < best.seq.length);
}

function groupedPrefixes(ps: Prefix[], omit: boolean): { name: string; locs: string[] }[] {
  const by = new Map<string, string[]>();
  for (const p of [...ps].sort((a, b) => alphaCmp(a.name, b.name))) by.set(p.name, [...(by.get(p.name) ?? []), omit && /^\d/.test(p.loc) ? "" : p.loc]);
  return [...by].map(([name, locs]) => ({ name, locs: locs.filter(Boolean) }));
}

// ── Ester ───────────────────────────────────────────────────────────────────

function esterName(ctx: Ctx, mol: Mol, opt: NameOptions): NameResult {
  const { g } = ctx;
  const f = formula(mol);
  const esters = ctx.groups.filter(x => x.kind === "ester");
  const compOf = (start: number, cuts: Set<string>) => {
    const seen = new Set([start]), stack = [start];
    while (stack.length) {
      const v = stack.pop()!;
      for (const n of g.nb.get(v)!) if (!seen.has(n.to) && !cuts.has(`${v}-${n.to}`) && !cuts.has(`${n.to}-${v}`)) { seen.add(n.to); stack.push(n.to); }
    }
    return seen;
  };
  // Säureteil: Bindungen O–R aller Ester trennen, Teil mit den meisten Ester-C, dann mit den meisten C.
  // Gleichstand (z. B. zwei Acetate an einem Diol): bestes Stammsystem, dann der alphabetisch erste Name – unabhängig von der Reihenfolge der Atome.
  const cut = new Set(esters.map(e => `${e.s}-${e.r}`));
  const cands = new Map<string, { chosen: Group[]; nC: number }>();
  for (const e of esters) {
    const comp = compOf(e.c, cut);
    const chosen = esters.filter(x => comp.has(x.c));
    const k = chosen.map(x => x.c).sort((a, b) => a - b).join();
    if (!cands.has(k)) cands.set(k, { chosen, nC: [...comp].filter(a => g.el.get(a) === "C").length });
  }
  const all = [...cands.values()];
  const most = Math.max(...all.map(c => c.chosen.length));
  const mostC = Math.max(...all.filter(c => c.chosen.length === most).map(c => c.nC));
  const tied = all.filter(c => c.chosen.length === most && c.nC === mostC).map(c => build(ctx, f, c.chosen, compOf, {}));
  const nameOf = (r: NameResult) => (r.ok ? r.name : "~");
  tied.sort((a, b) => cmpKey(a.key, b.key) || nameOf(a.res).localeCompare(nameOf(b.res)));
  if (!opt.pick && !opt.noAlpha && !opt.noMult) return tied[0].res;
  return build(ctx, f, tied[0].chosen, compOf, opt).res;
}

/** Ester aus den gewählten Gruppen benennen; key = Schlüssel des Stammsystems (für die Wahl zwischen gleichwertigen Säureteilen) */
function build(ctx: Ctx, f: string, chosen: Group[], compOf: (s: number, c: Set<string>) => Set<number>, opt: NameOptions): { res: NameResult; key: KeyPart[]; chosen: Group[] } {
  // nur die gewählten Ester trennen – die anderen bleiben Vorsilben (Acetyloxy …)
  const cuts = new Set(chosen.map(e => `${e.s}-${e.r}`));
  const acid = compOf(chosen[0].c, cuts);
  let KG: Group[] = chosen.map(e => ({ ...e, kind: "saeure" }));
  // im Säureteil zählen Ester-O als OH; Ketten nur innerhalb des Säureteils
  const opts = options(ctx, acid, "saeure", KG);
  // nur die Estergruppen am Stammsystem – andere stehen als Vorsilbe im Namen (4-Methoxy-4-oxobutyl)
  const onParent = opts.length ? KG.map((k, i) => (opts[0].counted.includes(k) ? i : -1)).filter(i => i >= 0) : KG.map((_, i) => i);
  chosen = onParent.map(i => chosen[i]);
  KG = onParent.map(i => KG[i]);
  const alkyls = chosen.map(e => sub(ctx, e.r!, e.s!, 1));
  const mixed = new Set(alkyls.map(a => a.name)).size > 1;
  const locOf = (o: Option, i: number) => { const a = anchorIn(ctx, KG[i], new Set(o.seq), o.mode); return a === undefined ? 0 : o.seq.indexOf(a) + 1; };
  // verschiedene Alkylreste: Nummer der Säuregruppe davor; bei Wahl die kleinere Nummer für den alphabetisch ersten Rest
  const alkylLocs = (o: Option) => alkyls.map((a, i) => ({ a, l: locOf(o, i) })).sort((x, y) => alphaCmp(x.a.name, y.a.name) || x.l - y.l).map(x => x.l);
  let o = choose(opts, opt.pick);
  if (o && mixed && !opt.pick) o = opts.filter(x => cmpKey(x.key, opts[0].key) === 0).sort((x, y) => cmpKey([alkylLocs(x)], [alkylLocs(y)]))[0];
  if (!o) return { res: { ok: false, reason: "Keine andere Möglichkeit", formula: f }, key: [], chosen };
  const acidParts = optionParts(ctx, o, "saeure", opt);
  const acidName = acidParts.map(p => p.text).join("");
  let alkylPart: string, alkylText: string;
  const locs = alkyls.map((_, i) => locOf(o!, i));
  if (mixed) {
    const by = new Map<string, { s: Sub; locs: number[] }>();
    alkyls.forEach((a, i) => { const e = by.get(a.name) ?? { s: a, locs: [] }; e.locs.push(locs[i]); by.set(a.name, e); });
    alkylPart = [...by.values()].sort((x, y) => alphaCmp(x.s.name, y.s.name))
      .map(x => `${x.locs.sort((a, b) => a - b).join(",")}-${x.locs.length > 1 ? (x.s.complex ? MULT_X : MULT)[x.locs.length] : ""}${wrap(x.s)}`).join("-");
    alkylText = "-" + alkylPart;
  } else alkylText = alkylPart = multiplied(alkyls);
  const nm = cap(acidName) + alkylText + "ester";
  const anion = acidName.endsWith("benzoesäure") ? acidName.replace(/benzoesäure$/, "benzoat")
    : acidName.endsWith("carbonsäure") ? acidName.replace(/carbonsäure$/, "carboxylat") : acidName.replace(/säure$/, "oat");
  // Alkyl…oat: ein einzelner Rest ohne Klammern (2-Methylpropylacetat), vor einer Nummer oder Klammer des Säureteils ein Bindestrich
  // (Methyl-2-methylpropanoat); verschiedene Reste mit Nummern vor einem Säureteil mit Vorsilben wären missverständlich
  // („4-Ethyl-1-methyl-2-methylbutandioat“) – dann nur der Name mit „…ester“
  const alkylOat = alkyls.length === 1 ? alkyls[0].name : alkylPart, sep = /^[\d([]/.test(anion) ? "-" : "";
  const alt = mixed && sep ? [] : [cap(alkylOat + sep + anion)];
  const triv = TRIVIAL_ACID[cap(acidName)];
  if (triv && !mixed) { alt.push(triv.acid + alkylPart + "ester"); alt.push(cap(alkylOat + triv.anion)); }
  const alkylAtoms = chosen.flatMap(e => [...compOf(e.r!, new Set([`${e.s}-${e.r}`]))].filter(a => !acid.has(a)));
  const res: NameOk = {
    ok: true, name: nm, alt: [...new Set(alt.filter(a => a !== nm))], formula: f, classes: classes(ctx), principal: "ester",
    parent: { atoms: o.seq, kind: o.kind, ring: o.ring?.kind, size: o.seq.length },
    principalAtoms: chosen.flatMap(e => [e.c, ...e.atoms]),
    prefixes: groupedPrefixes(o.prefixes, omitLocants(o)),
    ester: { acid: cap(acidName), alkyl: cap(alkylPart), alkyls, alkylLocs: mixed ? locs : [], alkylAtoms },
    steps: [],
    parts: capParts([...acidParts, { text: alkylText, key: "alkyl" }, { text: "ester", key: "principal" }]),
    groupsByKey: {}, stereo: parentStereo(ctx, o.seq), subs: subsOf(o),
  };
  res.groupsByKey = { ...keyAtoms(o, res.principalAtoms), alkyl: alkylAtoms };
  res.steps = steps(ctx, o, "ester", res, rivalOf(opts, o));
  return { res, key: o.key, chosen };
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
  "(Z)-But-2-endisäure": ["Maleinsäure"], "(E)-But-2-endisäure": ["Fumarsäure"], "(E)-But-2-ensäure": ["Crotonsäure"],
  "(Z)-But-2-ensäure": ["Isocrotonsäure"], "(Z)-Octadec-9-ensäure": ["Ölsäure"], "(E)-Octadec-9-ensäure": ["Elaidinsäure"],
  "(E)-3-Phenylprop-2-ensäure": ["Zimtsäure"], "(2E,4E)-Hexa-2,4-diensäure": ["Sorbinsäure"],
  "(E)-3,7-Dimethylocta-2,6-dienal": ["Geranial (Citral A)"], "(Z)-3,7-Dimethylocta-2,6-dienal": ["Neral (Citral B)"],
  "(E)-3,7-Dimethylocta-2,6-dien-1-ol": ["Geraniol"], "(Z)-3,7-Dimethylocta-2,6-dien-1-ol": ["Nerol"],
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
  if (/benzen/i.test(nm)) alt.push(nm.replace(/([Bb])enzen/g, "$1enzol"));
  // ältere Schreibweise: Propan-2-ol → 2-Propanol, But-2-en → 2-Buten
  const ring = /benzen|cyclo|^Phenol|^Anilin/i.test(nm);
  const m = ring ? null : /^([A-Z][a-zäöü]*?)(an|en|in)-([\d,]+)-(di|tri|tetra)?(ol|on|amin|thiol)$/.exec(nm);
  if (m) alt.push(`${m[3]}-${m[1]}${m[2]}${m[4] ?? ""}${m[5]}`);
  const e = ring ? null : /^([A-Z][a-z]*?)-([\d,]+)-(di|tri)?(en|in)$/.exec(nm);
  if (e) alt.push(`${e[2]}-${e[1]}${e[3] ? (e[1].endsWith("a") ? "" : "a") + e[3] : ""}${e[4]}`);
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
    // verschiedene Reste mit Ring wären mehrdeutig (Cyclohexylmethylamin = auch Cyclohexylmethyl-amin)
    if (new Set(parts.map(x => x.name)).size > 1 && g.nb.get(nn)!.some(n => ctx.ri.ringOf.has(n.to))) return;
    return cap(multiplied(parts) + "amin");
  }
}

/** C=O im Ring neben dem Heteroatom des Rings – benannt wie ein Keton (-on): Lacton (O), Lactam (N), Thiolacton (S);
 *  C=O an beiden Seiten des Heteroatoms: Säureanhydrid, Imid, Thioanhydrid. Ergebnis: Stoffklasse und Heteroatom */
function lactone(ctx: Ctx, gr: Group): { cls: string; el: El } | undefined {
  const ring = gr.kind === "on" ? ctx.ri.ringOf.get(gr.c) : undefined;
  const h = ring?.hetero;
  if (h === undefined || !ctx.g.nb.get(gr.c)!.some(n => n.to === h)) return;
  const el = ctx.g.el.get(h)!;
  const both = ctx.g.nb.get(h)!.filter(n => ring!.atoms.includes(n.to) && dblO(ctx.g, n.to) !== undefined).length > 1;
  return { cls: (both ? ANHYDRIDE : LACTONE)[el]!, el };
}
const LACTONE: Partial<Record<El, string>> = { O: "Lacton", N: "Lactam", S: "Thiolacton" };
const ANHYDRIDE: Partial<Record<El, string>> = { O: "Säureanhydrid", N: "Imid", S: "Thioanhydrid" };
const LACTONE_OF: Record<string, string> = tr(
  { Lacton: "ringförmiger Ester", Lactam: "ringförmiges Amid", Thiolacton: "ringförmiger Thioester", Säureanhydrid: "ringförmig", Imid: "ringförmig", Thioanhydrid: "ringförmig" },
  { Lacton: "lactone (cyclic ester)", Lactam: "lactam (cyclic amide)", Thiolacton: "thiolactone (cyclic thioester)", Säureanhydrid: "acid anhydride (cyclic)", Imid: "imide (cyclic)", Thioanhydrid: "thioanhydride (cyclic)" });

/** Lösungsweg: Hauptgruppe als Lacton/Lactam bzw. OH am aromatischen Ring oder an einer C=C (sonst leer) */
function groupSite(ctx: Ctx, o: Option): { lactone?: { cls: string; el: El }; ol?: "aromat" | "enol" } {
  const lac = o.counted.map(x => lactone(ctx, x)).find(Boolean);
  if (lac) return { lactone: lac };
  const ol = o.counted.map(x => olSite(ctx, x));
  return ol.length && ol.every(Boolean) ? { ol: ol[0] } : {};
}

/** OH nicht an einem C mit nur Einfachbindungen: am aromatischen Ring (Phenol) bzw. an einer C=C (Enol) – dann kein Alkohol */
function olSite(ctx: Ctx, gr: Group): "aromat" | "enol" | undefined {
  if (gr.kind !== "ol") return;
  if (ctx.ri.ringOf.get(gr.c)?.aromatic) return "aromat";
  if (ctx.g.nb.get(gr.c)!.some(n => n.order === 2 && ctx.g.el.get(n.to) === "C")) return "enol";
}

/** Stoffklassen (Kategorien) des Moleküls */
function classes(ctx: Ctx): string[] {
  const { g, ri, groups } = ctx;
  const out: string[] = [];
  const has = (k: Kind) => groups.some(x => x.kind === k);
  const bonds = g.mol.bonds;
  // Bindung im Ring: beide Atome im selben Ring (eine C=C vom Ring nach außen ist keine Ringbindung)
  const inRing = (a: number, b: number) => { const r = ri.ringOf.get(a); return !!r && r === ri.ringOf.get(b); };
  const cc = (o: number) => bonds.filter(b => b.order === o && g.el.get(b.a) === "C" && g.el.get(b.b) === "C" && !(inRing(b.a, b.b) && ri.ringOf.get(b.a)!.aromatic));
  const ccDouble = cc(2), ccTriple = cc(3);
  const onlyCH = g.ids.every(a => g.el.get(a) === "C");
  if (onlyCH) {
    if (ri.rings.some(r => r.kind === "benzen")) out.push("Aromat");
    if (ccTriple.length) out.push("Alkin");
    if (ccDouble.length) out.push(ccDouble.every(b => inRing(b.a, b.b)) ? "Cycloalken" : "Alken");
    if (!ccDouble.length && !ccTriple.length && !out.length) out.push(ri.rings.length ? "Cycloalkan" : "Alkan");
    return out;
  }
  if (has("saeure") && has("amin")) out.push("Aminosäure");
  else if (has("saeure")) out.push("Carbonsäure");
  if (has("ester")) out.push("Ester");
  if (has("amid")) out.push("Amid");
  if (has("nitril")) out.push("Nitril");
  if (has("al")) out.push("Aldehyd");
  const ons = groups.filter(x => x.kind === "on");
  for (const c of new Set(ons.map(x => lactone(ctx, x)?.cls ?? "Keton"))) out.push(c);
  const ols = groups.filter(x => x.kind === "ol").map(x => olSite(ctx, x));
  if (ols.some(s => !s)) out.push("Alkohol");
  if (groups.some(x => olSite(ctx, x) === "aromat" && ri.ringOf.get(x.c)!.kind === "benzen")) out.push("Phenol");
  if (ols.includes("enol")) out.push("Enol");
  if (has("thiol")) out.push("Thiol");
  if (has("amin") && !has("saeure")) out.push("Amin");
  const ether = g.ids.some(a => g.el.get(a) === "O" && !ri.ringOf.has(a) && g.nb.get(a)!.length === 2 && g.nb.get(a)!.every(n => dblO(g, n.to) === undefined));
  if (ether) out.push("Ether");
  if (g.ids.some(a => g.el.get(a) === "S" && !ri.ringOf.has(a) && g.nb.get(a)!.length === 2)) out.push("Thioether");
  if (g.ids.some(a => HALOGENS.includes(g.el.get(a)!))) out.push("Halogenverbindung");
  if (g.ids.some(a => g.el.get(a) === "NO2")) out.push("Nitroverbindung");
  if (ri.rings.some(r => r.kind === "hetero")) out.push("Heterocyclus");
  if (ri.rings.some(r => r.aromatic) && !out.includes("Phenol")) out.push("Aromat");
  return out;
}

const nums = (xs: number[]) => xs.join(", ");
const PARENT_WORD = (o: Option) => (o.kind === "chain" ? tr("Hauptkette", "Main chain") : tr("Ring", "Ring"));

/** Benzolring mit einer Gruppe: eingeführter Name statt des systematischen (Benzenol → Phenol) */
const RETAINED_FROM: Partial<Record<Kind, [string, string, string]>> = {
  ol: ["Benzenol", "benzenol", "phenol"], amin: ["Benzenamin", "benzenamine", "aniline"], saeure: ["Benzencarbonsäure", "benzenecarboxylic acid", "benzoic acid"],
  ester: ["Benzencarbonsäure", "benzenecarboxylic acid", "benzoic acid"], al: ["Benzencarbaldehyd", "benzenecarbaldehyde", "benzaldehyde"],
  nitril: ["Benzencarbonitril", "benzenecarbonitrile", "benzonitrile"], amid: ["Benzencarboxamid", "benzenecarboxamide", "benzamide"],
};
function retained(o: Option, K: Kind | undefined): { sys: string; sysEn: string; en: string } | undefined {
  const r = K && o.kind === "ring" && o.ring!.kind === "benzen" && o.counted.length === 1 ? RETAINED_FROM[K] : undefined;
  return r && { sys: r[0], sysEn: r[1], en: r[2] };
}

/** nächstbeste Nummerierung desselben Stammsystems (anderer Schlüssel) – für die Begründung im Lösungsweg */
const rivalOf = (opts: Option[], o: Option) => opts.find(x => x.id === o.id && cmpKey(x.key, o.key) > 0);

/** Lösungsweg „Nummerieren“: die Regel, die zwischen der besten und der nächstbesten Nummerierung entscheidet, mit beiden Nummern;
 *  was davor von beiden Seiten gleich ist, wird genannt (2-Methylpentan-3-on: „Die ranghöchste Gruppe hat von beiden Seiten C3.
 *  Dann entscheidet der Ast: 2 statt 4.“). Heterocyclus: zuerst „Heteroatom = 1“, im selben Schritt. */
function numberingSteps(o: Option, rival: Option | undefined): string[] {
  const ring = o.kind === "ring", hetero = ring && o.ring!.kind === "hetero";
  const mult = [...o.en, ...o.yn].sort((a, b) => a - b), pre = prefixLocs(o.prefixes);
  // Regeln wie NUM_RULES: vorhanden = im Molekül gibt es etwas, das diese Regel nummeriert
  const present = [o.pLocs.length > 0, mult.length > 0, o.en.length > 0 && o.yn.length > 0, false, pre.length > 0, false, false];
  if (o.seq.length < 2 || !present.some(Boolean)) return [];
  // ein Schritt: „Das Heteroatom im Ring hat immer die Nummer 1. Weiter so zählen, dass …“
  const head = hetero ? tr("Das Heteroatom im Ring hat immer die Nummer 1. ", "The heteroatom in the ring always gets number 1. ") : "";
  const bond = !o.yn.length ? tr("Doppelbindung", "double bond") : !o.en.length ? tr("Dreifachbindung", "triple bond") : tr("Mehrfachbindung", "multiple bond");
  const alkyl = o.prefixes.every(p => /yl$/.test(p.name));
  /** Bezeichnung je Regel: mit Artikel, ohne Artikel, Mehrzahl */
  const word = (rule: NumRule): { the: string; bare: string; pl: boolean } => {
    if (rule === "principal") {
      const pl = o.pLocs.length > 1;
      return { the: pl ? tr("die **ranghöchsten Gruppen**", "the **principal groups**") : tr("die **ranghöchste Gruppe**", "the **principal group**"), bare: pl ? tr("ranghöchste Gruppen", "principal groups") : tr("ranghöchste Gruppe", "principal group"), pl };
    }
    if (rule === "multiple" || rule === "double") {
      const b = rule === "double" ? tr("Doppelbindung", "double bond") : bond, pl = rule === "multiple" && mult.length > 1;
      return { the: pl ? tr(`die **${b}en**`, `the **${b}s**`) : tr(`die **${b}**`, `the **${b}**`), bare: pl ? tr(`${b}en`, `${b}s`) : b, pl };
    }
    const pl = o.prefixes.length > 1;
    const [sg, plw] = alkyl ? [tr("Ast", "branch"), tr("Äste", "branches")] : [tr("Vorsilbe", "prefix"), tr("Vorsilben", "prefixes")];
    return { the: pl ? tr(`die **${plw}**`, `the **${plw}**`) : tr(`${alkyl ? "der" : "die"} **${sg}**`, `the **${sg}**`), bare: pl ? plw : sg, pl };
  };
  const cl = (xs: number[]) => { const c = xs.map(x => "C" + x); return c.length < 2 ? c.join("") : `${c.slice(0, -1).join(", ")} ${tr("und", "and")} ${c[c.length - 1]}`; };
  const lowest = (w: { the: string; pl: boolean }) => (w.pl ? tr(`${w.the} die kleinsten Nummern bekommen`, `${w.the} get the lowest numbers`) : tr(`${w.the} die kleinste Nummer bekommt`, `${w.the} gets the lowest number`));
  const lead = hetero ? tr("Weiter so zählen, dass", "Then count so that") : tr("Nummerieren: so, dass", "Numbering: so that");
  const generic = `${lead} ${lowest(word(NUM_RULES[present.findIndex(Boolean)]))}.`;
  // Name ohne Nummern (Ethanol, Propen, Phenol): kein „1 statt 2“, stattdessen der Grund; beim C1 einer Säure/eines Aldehyds folgt ein eigener Satz
  if (omitLocants(o)) {
    if (o.mode === "incl" && o.counted.some(x => C_TYPE.has(x.kind))) return [head + generic];
    const many = o.pLocs.length + mult.length + pre.length > 1;
    return [`${head}${generic} ${many ? tr("Die Nummern stehen nicht im Namen: Er ist auch ohne eindeutig.", "The numbers are not written in the name: it is clear without them.")
      : tr("Die Nummer steht nicht im Namen: Er ist auch ohne eindeutig.", "The number is not written in the name: it is clear without it.")}`];
  }
  const rv = rival && reverseRule(o, rival);
  if (!rv) return [head + generic];
  const i = NUM_RULES.indexOf(rv.rule), R = rv.right.join(","), W = rv.wrong.join(",");
  const first = (rv.rule === "prefixes" || rv.rule === "multiple") && rv.right.length > 1 && rv.right.reduce((s, v) => s + v, 0) >= rv.wrong.reduce((s, v) => s + v, 0)
    ? tr(" Es zählt der erste Unterschied.", " The first difference counts.") : "";
  const ties = ([[0, o.pLocs], [1, mult], [4, pre]] as [number, number[]][]).filter(([j]) => j < i && present[j]).map(([j, l]) => ({ w: word(NUM_RULES[j]), l }));
  if (!ties.length) return [`${head}${lead} ${lowest(word(rv.rule))}: ${R} ${tr("statt", "instead of")} ${W}.${first}`];
  const side = ring ? tr("in beiden Zählrichtungen", "in both directions") : tr("von beiden Seiten", "from both ends");
  const upper = (t: string) => t.charAt(0).toUpperCase() + t.slice(1); // Satzanfang (`cap` nimmt den ersten Kleinbuchstaben: „DOppelbindung“)
  const tie = ties.length === 1
    ? tr(`${upper(ties[0].w.the)} ${ties[0].w.pl ? "haben" : "hat"} ${side} ${cl(ties[0].l)}.`, `${upper(ties[0].w.the)} ${ties[0].w.pl ? "are" : "is"} at ${cl(ties[0].l)} ${side}.`)
    : tr(`${upper(ties.map(t => `${t.w.bare} (${cl(t.l)})`).join(" und "))} liegen ${side} gleich.`, `${upper(ties.map(t => `${t.w.bare} (${cl(t.l)})`).join(" and "))} are the same ${side}.`);
  const w = word(rv.rule);
  const decide = rv.rule === "alpha" ? tr(`Dann entscheidet das Alphabet: **${cap(rv.prefix!)}** bekommt die ${R}.`, `Then the alphabet decides: **${prefixEn(rv.prefix!)}** gets ${R}.`)
    : rv.rule === "z" ? tr(`Dann bekommt **Z** die kleinere Nummer: ${R} statt ${W}.`, `Then **Z** gets the lower number: ${R} instead of ${W}.`)
    : rv.rule === "double" ? tr(`Dann bekommt die **Doppelbindung** die kleinere Nummer: ${R} statt ${W}.`, `Then the **double bond** gets the lower number: ${R} instead of ${W}.`)
    : tr(`Dann ${w.pl ? "entscheiden" : "entscheidet"} ${w.the}: ${R} statt ${W}.${first}`, `Then ${w.the} ${w.pl ? "decide" : "decides"}: ${R} instead of ${W}.${first}`);
  return [`${head || tr("Nummerieren: ", "Numbering: ")}${tie} ${decide}`];
}

function steps(ctx: Ctx, o: Option, K: Kind | undefined, r: NameOk, rival?: Option): string[] {
  if (getLang() === "en") return stepsEn(ctx, o, K, r, rival);
  const out: string[] = [];
  const n = o.counted.length;
  const info = K ? KIND_INFO[K] : undefined;
  const site = groupSite(ctx, o);
  const mult = n > 1 ? ` (${n}× → ${MULT[n]}…)` : "";
  if (K === "ester") out.push(`Ranghöchste Gruppe: **Ester** ${info!.group}. Name = Säureteil + Alkylteil + **ester**.`);
  else if (site.lactone) out.push(`Ranghöchste Gruppe: C=O im Ring neben ${site.lactone.el} – ein **${site.lactone.cls}** (${LACTONE_OF[site.lactone.cls]}). Endung wie beim Keton: **-on**${mult}.`);
  else if (site.ol) out.push(`Ranghöchste Gruppe: **Hydroxygruppe** –OH ${site.ol === "aromat" ? "am aromatischen Ring" : "an einer C=C (Enol)"} → Endung **-ol**${mult}.`);
  else if (info && n) out.push(`Ranghöchste Gruppe: **${info.label}** ${info.group} → Endung **${info.suffix}**${mult}.`);
  else if (o.kind === "ring" && o.ring!.kind === "hetero") out.push("Keine Gruppe mit Endung: Der Ring mit Heteroatom hat einen eigenen Namen.");
  else out.push("Keine Gruppe mit Endung: Name endet auf **-an**, **-en** oder **-in**.");
  const others = RANK.filter(k => k !== K && ctx.groups.some(x => x.kind === k));
  if (others.length) out.push(`Weitere Gruppen als Vorsilbe: ${others.map(k => `**${KIND_INFO[k].prefix}**`).join(", ")}.`);
  if (o.kind === "chain") {
    const why = n ? `längste Kette mit ${n > 1 ? "den ranghöchsten Gruppen" : "der ranghöchsten Gruppe"}` : "längste Kette";
    out.push(`${PARENT_WORD(o)}: ${why} → **${o.seq.length} C** = **${cap(STEM[o.seq.length])}an**.`);
  } else {
    const rk = o.ring!;
    const rn = rk.kind === "benzen" ? "Benzen (Benzolring)" : rk.kind === "carbo" ? cap(rk.base) + "an" : cap(rk.base);
    out.push(`Stammsystem: **Ring** geht vor Kette → **${rn}**.`);
  }
  const kept = retained(o, K);
  if (kept) out.push(`Statt ${kept.sys} heißt es **${cap(BENZ_RETAINED[K!]!)}** (eingeführter Name).`);
  out.push(...numberingSteps(o, rival));
  if (n && o.kind === "chain" && o.mode === "incl" && K && C_TYPE.has(K)) out.push(`Das C der ${info!.label}gruppe ist **C1** – die Nummer steht nicht im Namen.`);
  if (o.en.length) out.push(`Doppelbindung bei C${nums(o.en)} → **-en**.`);
  for (const st of r.stereo) out.push(ezStep(ctx, st));
  if (o.yn.length) out.push(`Dreifachbindung bei C${nums(o.yn)} → **-in**.`);
  if (r.prefixes.length) {
    const list = r.prefixes.map(p => `**${cap(`${p.locs.length ? p.locs.join(",") + "-" : ""}${p.locs.length > 1 ? MULT[p.locs.length] : ""}${p.name}`)}**`);
    out.push(`Vorsilben: ${list.join(", ")}.`);
    if (r.prefixes.length > 1) out.push(`Alphabetisch ordnen (di, tri zählen nicht): ${r.prefixes.map(p => cap(p.name.replace(/[()]/g, ""))).join(" · ")}.`);
  }
  if (r.ester) out.push(`Säureteil **${r.ester.acid}**, Alkylteil **${r.ester.alkyl}** → **${r.name}**.`);
  else out.push(`Name: **${r.name}**`);
  return out.map(keepEnding);
}

/** Lösungsweg auf Englisch (gleiche Schritte, englische Namen und Endungen) */
function stepsEn(ctx: Ctx, o: Option, K: Kind | undefined, r: NameOk, rival?: Option): string[] {
  const out: string[] = [];
  const n = o.counted.length;
  const info = K ? KIND_INFO[K] : undefined;
  let nm = r.name;
  try { nm = toEnglish(r); } catch { /* deutscher Name bleibt */ }
  const site = groupSite(ctx, o);
  const mult = n > 1 ? ` (${n}× → ${MULT[n]}…)` : "";
  if (K === "ester") out.push(`Principal group: **ester** ${info!.group}. Name = alkyl part + acid part ending in **-oate**.`);
  else if (site.lactone) out.push(`Principal group: C=O in the ring next to ${site.lactone.el} – ${/^[aeiou]/.test(LACTONE_OF[site.lactone.cls]) ? "an" : "a"} **${LACTONE_OF[site.lactone.cls]}**. Ending as for a ketone: **-one**${mult}.`);
  else if (site.ol) out.push(`Principal group: **hydroxy group** –OH ${site.ol === "aromat" ? "on the aromatic ring" : "on a C=C (enol)"} → ending **-ol**${mult}.`);
  else if (info && n) out.push(`Principal group: **${info.label.toLowerCase()}** ${info.group} → ending **${info.suffix}**${mult}.`);
  else if (o.kind === "ring" && o.ring!.kind === "hetero") out.push("No group with an ending: the ring with a heteroatom has its own name.");
  else out.push("No group with an ending: the name ends in **-ane**, **-ene** or **-yne**.");
  const others = RANK.filter(k => k !== K && ctx.groups.some(x => x.kind === k));
  if (others.length) out.push(`Other groups as prefixes: ${others.map(k => `**${KIND_INFO[k].prefix}**`).join(", ")}.`);
  if (o.kind === "chain") {
    const why = n ? `longest chain with the principal group${n > 1 ? "s" : ""}` : "longest chain";
    out.push(`Main chain: ${why} → **${o.seq.length} C** = **${STEM[o.seq.length]}ane**.`);
  } else {
    const rk = o.ring!;
    const rn = rk.kind === "benzen" ? "benzene (benzene ring)" : parentEn(rk.kind === "carbo" ? rk.base + "an" : rk.base);
    out.push(`Parent: a **ring** comes before a chain → **${rn}**.`);
  }
  const kept = retained(o, K);
  if (kept) out.push(`Instead of ${kept.sysEn} the name is **${kept.en}** (retained name).`);
  out.push(...numberingSteps(o, rival));
  if (n && o.kind === "chain" && o.mode === "incl" && K && C_TYPE.has(K)) out.push(`The C of the ${info!.label.toLowerCase()} group is **C1** – the number is not written in the name.`);
  if (o.en.length) out.push(`Double bond at C${nums(o.en)} → **-ene**.`);
  for (const st of r.stereo) out.push(ezStep(ctx, st));
  if (o.yn.length) out.push(`Triple bond at C${nums(o.yn)} → **-yne**.`);
  if (r.prefixes.length) {
    const list = r.prefixes.map(p => `**${prefixEn(`${p.locs.length ? p.locs.join(",") + "-" : ""}${p.locs.length > 1 ? MULT[p.locs.length] : ""}${p.name}`)}**`);
    out.push(`Prefixes: ${list.join(", ")}.`);
    if (r.prefixes.length > 1) out.push(`Sort alphabetically (di, tri do not count): ${r.prefixes.map(p => prefixEn(p.name.replace(/[()]/g, ""))).join(" · ")}.`);
  }
  if (r.ester) out.push(`Alkyl part **${nm.slice(0, nm.lastIndexOf(" "))}**, acid part **${nm.slice(nm.lastIndexOf(" ") + 1)}** → **${nm}**.`);
  else out.push(`Name: **${nm}**`);
  return out.map(keepEnding);
}

const SUBN = "₀₁₂₃₄₅₆₇₈₉";
/** Kurzform einer Gruppe für den Lösungsweg: CH₃, Cl, OH, NO₂ … (−1 = H) */
function groupLabel(g: Graph, a: number): string {
  if (a < 0) return "H";
  const e = g.el.get(a)!, h = hCount(g, a);
  if (e === "NO2") return "NO₂";
  return e + (h ? "H" + (h > 1 ? SUBN[h] : "") : "");
}

/** Sätze zu E/Z einer Doppelbindung: welche Gruppe Vorrang hat und wo sie liegt (kurze Sätze) */
function ezStep(ctx: Ctx, st: StereoAt): string {
  const { g } = ctx;
  const z = (a: number) => (a < 0 ? 1 : g.el.get(a) === "NO2" ? 7 : ({ C: 6, N: 7, O: 8, F: 9, S: 16, Cl: 17, Br: 35, I: 53 } as Record<string, number>)[g.el.get(a)!]);
  const rank = (p: number, q: number) => tr(`${groupLabel(g, p)} vor ${groupLabel(g, q)}${z(p) === z(q) ? " – gleiches Atom, die Nachbarn entscheiden" : ""}`,
    `${groupLabel(g, p)} before ${groupLabel(g, q)}${z(p) === z(q) ? " – same atom, the neighbours decide" : ""}`);
  const at = st.loc;
  // in Nummernfolge: erst das C mit der kleineren Nummer
  const sides = [{ l: st.la, p: st.pa, q: st.qa }, { l: st.lb, p: st.pb, q: st.qb }].sort((x, y) => (x.l ?? 99) - (y.l ?? 99));
  const one = (x: { l?: number; p: number; q: number }) => `${x.l ? tr(`An C${x.l}`, `At C${x.l}`) : tr("Am anderen C", "At the other C")}: ${rank(x.p, x.q)}.`;
  const head = `${tr(`Doppelbindung C${at}: Vorrang hat die größere Ordnungszahl.`, `Double bond C${at}: the higher atomic number has priority.`)} ${one(sides[0])} ${one(sides[1])}`;
  if (!st.desc) return `${head} ${tr("E/Z ist aus der Zeichnung nicht ablesbar – Gruppen schräg zeichnen.", "E/Z cannot be read from the drawing – draw the groups at an angle.")}`;
  return `${head} ${st.desc === "Z" ? tr("Beide auf **derselben** Seite → **Z** (zusammen).", "Both on the **same** side → **Z** (together).") : tr("Auf **verschiedenen** Seiten → **E** (entgegen).", "On **opposite** sides → **E** (opposite).")}`;
}

/** nur für Prüfungen: Name jedes möglichen Substituenten (Atom am Stammsystem `at`, erstes Atom `first`), alle Bindungen außerhalb von Ringen */
export function substituentNames(mol: Mol): { at: number; first: number; name: string }[] {
  const { ctx, bad } = prepare(mol);
  if (bad) return [];
  const out: { at: number; first: number; name: string }[] = [];
  for (const b of mol.bonds) {
    const ra = ctx.ri.ringOf.get(b.a);
    if (ra && ra === ctx.ri.ringOf.get(b.b)) continue;
    for (const [at, first] of [[b.a, b.b], [b.b, b.a]]) out.push({ at, first, name: sub(ctx, first, at, b.order).name });
  }
  return out;
}

/** nur für Tests und Beispiele: Name direkt aus der Kurzschreibweise */
export const hasH = (mol: Mol, id: number) => hCount(graph(mol), id) > 0;
