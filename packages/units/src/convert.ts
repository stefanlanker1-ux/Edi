// Umrechnen mit einem einzigen, immer gleichen Verfahren:
//   ① Umrechnungszahl bestimmen:  1 [Ausgangseinheit] = F [Zieleinheit]
//      – gleiche Einheitenfamilie: Kette über die Nachbareinheiten (1 km = 1000 m = 10 000 dm = 100 000 cm)
//      – Flächen/Volumen: Einheit als Produkt (1 m² = 1 m · 1 m = 100 cm · 100 cm = 10 000 cm²)
//      – zusammengesetzte Einheiten: jede Einheit ersetzen (1 km/h = 1000 m / 3600 s)
//      – Definitionen (1 l = 1 dm³, 1 J = 1 W·s, 1 Pa = 1 N/m² …) werden als eigene Zeile eingesetzt
//   ② Einsetzen:   a [Ausgangseinheit] = a · F [Zieleinheit]
//      und ausrechnen (in derselben Zeile): = Ergebnis
// Alle Rechnungen sind exakte Brüche; die Herleitung wird zusätzlich über SI-Faktoren geprüft.

import { q, ONE, mul, div, pow, eq, inv, cmp, isTerminating, log10Exact, parseQ, fmtText, type Q } from "./rational.ts";
import { ATOMS, parseUnit, unitSi, unitDim, type Atom, type Factor } from "./units.ts";

/** Ein Faktor in einer Rechenzeile: „100 cm“, „(0,01 m)³“ oder nur „m“ */
export interface Term { v?: Q; sym: string; pow?: number }
/**
 * Eine Zeile der Herleitung, gelesen als „= …“:
 *  – mit unit: coef + Einheit („10 000 cm²“, „3 600 000 J“)
 *  – sonst: coef · (num-Terme) / (den-Terme)
 */
export interface Row { coef: Q; unit?: string; num?: Term[]; den?: Term[] }

export interface Relation {
  /** Umrechnungszahl: 1 from = F to */
  F: Q;
  rows: Row[];
  /** benutzte Definitionen („1 l = 1 dm³“) */
  notes: string[];
  method: "same" | "chain" | "power" | "subst";
}

const supE = (e: number) => (e === 2 ? "²" : e === 3 ? "³" : "");
const symOf = (f: Factor) => f.a.sym + supE(Math.abs(f.e));
/** Einheitentext aus Faktoren: kg/m³, W·s, N/m² */
export function unitText(fs: Factor[]): string {
  const num = fs.filter(f => f.e > 0).map(symOf).join("·"), den = fs.filter(f => f.e < 0).map(symOf).join("·");
  return (num || "1") + (den ? "/" + den : "");
}
const sig = (fs: Factor[]) => {
  const m = new Map<string, number>();
  for (const f of fs) m.set(f.a.fam, (m.get(f.a.fam) ?? 0) + f.e);
  return [...m].filter(([, e]) => e !== 0).sort(([a], [b]) => a.localeCompare(b)).map(([k, e]) => `${k}${e}`).join(",");
};
const fams = (fs: Factor[]) => new Set(fs.map(f => f.a.fam));
/** gleiche Atome zusammenfassen, Exponent 0 streichen */
function merge(fs: Factor[]): Factor[] {
  const out: Factor[] = [];
  for (const f of fs) {
    const o = out.find(x => x.a.sym === f.a.sym);
    if (o) o.e += f.e; else out.push({ ...f });
  }
  return out.filter(f => f.e !== 0);
}
const oneTerms = (fs: Factor[]) => ({
  num: fs.filter(f => f.e > 0).map(f => ({ v: ONE, sym: symOf(f) })),
  den: fs.filter(f => f.e < 0).map(f => ({ v: ONE, sym: symOf(f) })),
});

/** Glied einer Familie mit Definition (hPa → Pa → N/m²) */
const defMember = (a: Atom) => (a.def ? a : ATOMS.find(x => x.fam === a.fam && x.def && !/^\d/.test(x.def)) ?? ATOMS.find(x => x.fam === a.fam && x.def));

/** Kette innerhalb einer Familie von a nach b über die Nachbareinheiten */
function chain(a: Atom, b: Atom): Atom[] {
  const lo = cmp(a.f, b.f) < 0 ? a.f : b.f, hi = cmp(a.f, b.f) < 0 ? b.f : a.f;
  const mid = ATOMS.filter(x => x.fam === a.fam && x.ladder && x !== a && x !== b && cmp(x.f, lo) > 0 && cmp(x.f, hi) < 0);
  const list = [a, ...mid, b].sort((x, y) => cmp(y.f, x.f));
  // gleiche Faktoren (hPa/mbar) nur einmal
  const uniq = list.filter((x, i) => i === 0 || !eq(x.f, list[i - 1].f) || x === a || x === b);
  return cmp(a.f, b.f) >= 0 ? uniq : uniq.reverse();
}

export function relation(from: string, to: string): Relation {
  if (unitDim(from).join() !== unitDim(to).join()) throw new Error(`${from} und ${to} passen nicht zusammen`);
  const F = div(unitSi(from), unitSi(to));
  const rows: Row[] = [{ coef: ONE, unit: from }];
  const notes: string[] = [];
  if (from === to) return { F, rows, notes, method: "same" };
  const S = parseUnit(from), T = parseUnit(to);

  // Kette in derselben Familie: 1 km = 1000 m = 10 000 dm = 100 000 cm
  if (S.factors.length === 1 && T.factors.length === 1 && S.factors[0].e === 1 && T.factors[0].e === 1 && S.factors[0].a.fam === T.factors[0].a.fam) {
    const a = S.factors[0].a;
    for (const x of chain(a, T.factors[0].a).slice(1)) rows.push({ coef: div(a.f, x.f), unit: x.sym });
    return { F, rows, notes, method: "chain" };
  }

  const cur = { coef: S.coef, fs: merge(S.factors) };
  const tgt = { coef: T.coef, fs: merge(T.factors) };
  /** Erweiterungen der Zieleinheit (J → W·s): 1 [to] = c · [unit] */
  const tExp: { unit: string; c: Q }[] = [];
  if (cur.fs.length > 1 || cur.fs.some(f => f.e < 0)) rows.push({ coef: cur.coef, ...oneTerms(cur.fs) });

  const expand = (side: { coef: Q; fs: Factor[] }, i: number, onSource: boolean): boolean => {
    const f = side.fs[i];
    const m = defMember(f.a);
    if (!m) return false;
    if (m !== f.a) {
      // erst innerhalb der Familie zum Glied mit Definition (hPa → Pa)
      side.coef = mul(side.coef, pow(div(f.a.f, m.f), f.e));
      side.fs = merge(side.fs.map((x, k) => (k === i ? { a: m, e: x.e } : x)));
    } else {
      const d = parseUnit(m.def!);
      notes.push(`1 ${m.sym} = ${eq(d.coef, ONE) ? "1 " : fmtText(d.coef) + " "}${unitText(d.factors)}`);
      side.coef = mul(side.coef, pow(d.coef, f.e));
      side.fs = merge(side.fs.flatMap((x, k) => (k === i ? d.factors.map(y => ({ a: y.a, e: y.e * x.e })) : [x])));
    }
    if (onSource) rows.push({ coef: side.coef, unit: unitText(side.fs) });
    else tExp.push({ unit: unitText(side.fs), c: side.coef });
    return true;
  };

  for (let guard = 0; guard < 8 && sig(cur.fs) !== sig(tgt.fs); guard++) {
    const tf = fams(tgt.fs), cf = fams(cur.fs);
    const i = cur.fs.findIndex(f => !tf.has(f.a.fam) && defMember(f.a));
    if (i >= 0 && expand(cur, i, true)) continue;
    const j = tgt.fs.findIndex(f => !cf.has(f.a.fam) && defMember(f.a));
    if (j >= 0 && expand(tgt, j, false)) continue;
    break;
  }
  if (sig(cur.fs) !== sig(tgt.fs)) throw new Error(`Keine Herleitung für ${from} → ${to}`);

  // Ersetzen: jede Einheit durch ihren Wert in der Ziel-Einheit derselben Familie
  const target = (f: Factor) => tgt.fs.find(t => t.a.fam === f.a.fam)!;
  const pure = cur.fs.length === 1 && tgt.fs.length === 1 && cur.fs[0].e > 1;
  let value = cur.coef;
  if (!cur.fs.every(f => target(f).a === f.a)) {
    if (pure) {
      // 1 m² = 1 m · 1 m = 100 cm · 100 cm (Schulschreibweise als Produkt)
      const f = cur.fs[0], t = target(f), v = div(f.a.f, t.a.f);
      if (eq(cur.coef, ONE)) rows.push({ coef: ONE, num: Array.from({ length: f.e }, () => ({ v: ONE, sym: f.a.sym })) });
      rows.push({ coef: cur.coef, num: Array.from({ length: f.e }, () => ({ v, sym: t.a.sym })) });
      value = mul(value, pow(v, f.e));
    } else {
      const num: Term[] = [], den: Term[] = [];
      let anyPow = false;
      for (const f of cur.fs) {
        const t = target(f), v = div(f.a.f, t.a.f);
        if (Math.abs(f.e) > 1) anyPow = true;
        (f.e > 0 ? num : den).push({ v, sym: t.a.sym, pow: Math.abs(f.e) });
        value = mul(value, pow(v, f.e));
      }
      rows.push({ coef: cur.coef, num, den });
      // Potenzen ausrechnen: (0,01 m)³ = 0,000 001 m³
      const ev = (x: Term): Term => ({ v: pow(x.v!, x.pow ?? 1), sym: x.sym + supE(x.pow ?? 1) });
      if (anyPow) rows.push({ coef: cur.coef, num: num.map(ev), den: den.map(ev) });
    }
  }
  const last = rows[rows.length - 1];
  const tgtUnit = unitText(tgt.fs);
  if (last.unit !== tgtUnit || !eq(last.coef, value)) rows.push({ coef: value, unit: tgtUnit });

  // zurück zur eigentlichen Zieleinheit (W·s → J → kJ, N/m² → Pa → hPa)
  if (tExp.length) {
    const cF = tExp[tExp.length - 1].c;
    for (let j = tExp.length - 2; j >= 0; j--) rows.push({ coef: mul(value, div(tExp[j].c, cF)), unit: tExp[j].unit });
    value = div(value, cF);
    rows.push({ coef: value, unit: to });
  }
  rows[rows.length - 1].unit = to;
  if (!eq(value, F)) throw new Error(`Herleitung ${from} → ${to} ergibt ${value.n}/${value.d}, erwartet ${F.n}/${F.d}`);
  return { F, rows, notes, method: pure ? "power" : "subst" };
}

export interface Solution {
  value: Q; from: string; to: string;
  rel: Relation;
  result: Q;
  /** F = 10^k → Komma um |k| Stellen verschieben (k > 0 nach rechts) */
  shift: number | null;
  /** Wenn F < 1 oder F nicht endet: gleichwertige Division a : (1/F), falls 1/F „schön“ ist (100 000, 3,6, 60, 0,036) –
   *  so bleibt der Rechenweg exakt (0,072 km/h = 0,072 : 0,036 cm/s statt mit gerundetem 27,7778) */
  divisor: Q | null;
  /** große → kleine Einheit (Zahl wird größer) */
  bigger: boolean;
  /** beide Einheiten gleich groß (1 g/ml = 1 kg/l) */
  equal: boolean;
}

export function solve(value: Q | string, from: string, to: string): Solution {
  const v = typeof value === "string" ? parseQ(value)! : value;
  const rel = relation(from, to);
  const F = rel.F;
  const d = inv(F);
  const divisor = (cmp(F, ONE) < 0 || !isTerminating(F)) && isTerminating(d) && d.n < 10n ** 13n ? d : null;
  return { value: v, from, to, rel, result: mul(v, F), shift: log10Exact(F), divisor, bigger: cmp(F, ONE) > 0, equal: eq(F, ONE) };
}

/** Gleicher Wert? (für Quiz-Antworten; bei gerundeten Ergebnissen mit Toleranz ± halbe letzte Stelle) */
export function sameValue(a: Q, b: Q, decimals?: number): boolean {
  if (decimals === undefined) return eq(a, b);
  const diff = q(a.n * b.d - b.n * a.d, a.d * b.d);
  const absDiff = q(diff.n < 0n ? -diff.n : diff.n, diff.d);
  return cmp(absDiff, q(1n, 2n * 10n ** BigInt(decimals))) <= 0;
}
