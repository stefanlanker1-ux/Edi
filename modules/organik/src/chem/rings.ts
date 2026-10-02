// Ringe im Molekül: Ringbindungen (keine Brücken im Graphen), Ringsysteme, Reihenfolge der Atome im Ring
// und die Art des Rings (Cycloalkan, Benzen, Heterocyclus mit Namen). Nur Einzelringe – kondensierte Ringe meldet `fused`.

import { bondOrder, type El, type Graph } from "./mol.ts";

export interface Ring {
  /** Atome in Ringreihenfolge */
  atoms: number[];
  kind: "carbo" | "benzen" | "hetero";
  /** Name des Grundgerüsts ohne Endung (cyclohex, benzen, pyridin …) – bei carbo der Stamm „cyclohex“ */
  base: string;
  /** aromatisch: Doppelbindungen im Ring werden nicht genannt */
  aromatic: boolean;
  /** Heteroatom (bekommt die Nummer 1) */
  hetero?: number;
}

export interface RingInfo {
  rings: Ring[];
  ringOf: Map<number, Ring>;
  /** kondensierte oder verbrückte Ringe (mehr als ein Ring in einem System) */
  fused: boolean;
  /** Ringe, die die App nicht benennen kann (Text für die Meldung) */
  unsupported?: string;
}

const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

/** Brücken nach Tarjan – alle anderen Bindungen liegen in einem Ring */
function ringBonds(g: Graph): Set<string> {
  const disc = new Map<number, number>(), low = new Map<number, number>(), bridges = new Set<string>();
  let t = 0;
  const dfs = (v: number, parent: number) => {
    disc.set(v, t); low.set(v, t); t++;
    for (const { to } of g.nb.get(v)!) {
      if (to === parent) continue;
      if (disc.has(to)) low.set(v, Math.min(low.get(v)!, disc.get(to)!));
      else {
        dfs(to, v);
        low.set(v, Math.min(low.get(v)!, low.get(to)!));
        if (low.get(to)! > disc.get(v)!) bridges.add(key(v, to));
      }
    }
  };
  for (const id of g.ids) if (!disc.has(id)) dfs(id, -1);
  const out = new Set<string>();
  for (const id of g.ids) for (const { to } of g.nb.get(id)!) if (!bridges.has(key(id, to))) out.add(key(id, to));
  return out;
}

const HETERO_NAMES: Record<string, Record<number, string>> = {
  // gesättigt: Ringgröße → Name
  O: { 3: "oxiran", 4: "oxetan", 5: "oxolan", 6: "oxan" },
  S: { 3: "thiiran", 4: "thietan", 5: "thiolan", 6: "thian" },
  N: { 3: "aziridin", 4: "azetidin", 5: "pyrrolidin", 6: "piperidin" },
};
const HETERO_AROMATIC: Record<string, Record<number, string>> = {
  O: { 5: "furan" }, S: { 5: "thiophen" }, N: { 5: "pyrrol", 6: "pyridin" },
};

export function findRings(g: Graph): RingInfo {
  const rb = ringBonds(g);
  const ringNb = (v: number) => g.nb.get(v)!.filter(n => rb.has(key(v, n.to))).map(n => n.to);
  const seen = new Set<number>(), rings: Ring[] = [], ringOf = new Map<number, Ring>();
  let fused = false, unsupported: string | undefined;
  for (const s of g.ids) {
    if (seen.has(s) || ringNb(s).length === 0) continue;
    // Ringsystem sammeln
    const sys: number[] = [], stack = [s];
    seen.add(s);
    while (stack.length) {
      const v = stack.pop()!;
      sys.push(v);
      for (const w of ringNb(v)) if (!seen.has(w)) { seen.add(w); stack.push(w); }
    }
    const edges = sys.reduce((n, v) => n + ringNb(v).length, 0) / 2;
    if (edges !== sys.length || sys.some(v => ringNb(v).length !== 2)) { fused = true; continue; }
    // Reihenfolge im Ring
    const order = [sys[0]];
    let prev = -1, cur = sys[0];
    for (;;) {
      const next = ringNb(cur).find(w => w !== prev)!;
      if (next === sys[0]) break;
      order.push(next); prev = cur; cur = next;
    }
    const ring = classify(g, order);
    if (!ring) unsupported ??= ringText(g, order);
    else { rings.push(ring); for (const a of order) ringOf.set(a, ring); }
  }
  if (fused) unsupported ??= "Mehrere Ringe teilen sich Atome";
  return { rings, ringOf, fused, unsupported };
}

function ringText(g: Graph, atoms: number[]): string {
  const het = atoms.filter(a => g.el.get(a) !== "C");
  if (het.length > 1) return "Ring mit mehreren Heteroatomen";
  if (atoms.length > 6 && het.length) return "Heterocyclus mit mehr als 6 Atomen";
  return "Teilweise ungesättigter Heterocyclus";
}

/** Ring einordnen; undefined = nicht benennbar */
function classify(g: Graph, atoms: number[]): Ring | undefined {
  const n = atoms.length;
  const els = atoms.map(a => g.el.get(a)!) as El[];
  const het = atoms.filter((_, i) => els[i] !== "C");
  const dbl = atoms.map((a, i) => bondOrder(g, a, atoms[(i + 1) % n]));
  if (dbl.some(o => o === 3)) return undefined;
  const doubles = dbl.filter(o => o === 2).length;
  if (het.length === 0) {
    if (n === 6 && doubles === 3 && dbl.every((o, i) => o !== dbl[(i + 1) % n])) return { atoms, kind: "benzen", base: "benzen", aromatic: true };
    return { atoms, kind: "carbo", base: "cyclo" + STEM[n], aromatic: false };
  }
  if (het.length > 1) return undefined;
  const h = het[0], e = g.el.get(h)!;
  if (!HETERO_NAMES[e]) return undefined;
  if (doubles === 0 && HETERO_NAMES[e][n]) return { atoms, kind: "hetero", base: HETERO_NAMES[e][n], aromatic: false, hetero: h };
  const name = HETERO_AROMATIC[e]?.[n];
  if (!name) return undefined;
  // Heteroatom an Stelle 0 drehen, dann Muster der Doppelbindungen prüfen
  const k = atoms.indexOf(h), rot = [...atoms.slice(k), ...atoms.slice(0, k)];
  const d = rot.map((a, i) => bondOrder(g, a, rot[(i + 1) % n]));
  if (n === 5 && d.join("") === "12121") return { atoms, kind: "hetero", base: name, aromatic: true, hetero: h };
  if (n === 6 && (d.join("") === "212121" || d.join("") === "121212")) return { atoms, kind: "hetero", base: name, aromatic: true, hetero: h };
  return undefined;
}

export const STEM: Record<number, string> = {
  1: "meth", 2: "eth", 3: "prop", 4: "but", 5: "pent", 6: "hex", 7: "hept", 8: "oct", 9: "non", 10: "dec",
  11: "undec", 12: "dodec", 13: "tridec", 14: "tetradec", 15: "pentadec", 16: "hexadec", 17: "heptadec", 18: "octadec", 19: "nonadec", 20: "icos",
  21: "henicos", 22: "docos", 23: "tricos", 24: "tetracos", 25: "pentacos", 26: "hexacos", 27: "heptacos", 28: "octacos", 29: "nonacos", 30: "triacont",
};
