// Stoff-Info (Reaktionsgleichungen, Gemische): Blatt mit Summenformel, Element oder Verbindung, Teilchenart
// (Molekül, Ionen, Metallgitter, einzelne Atome), Strukturformel und – bei Molekülen – 3D-Modell (three.js, erst beim Umschalten geladen).

import { lazy, Suspense, useState } from "react";
import { Segmented, Sheet, Tag, buzz } from "@lern/ui";
import { BY_SYMBOL, CATEGORIES, CATIONS, ANIONS, MOL3D, chainView, flatView, formula, ionText, isMolecular, parseFormula, speciesName, toSubscript, type Ion } from "@lern/chem";
import { tr } from "@lern/i18n";

const Molecule3D = lazy(() => import("./Molecule3D.tsx"));

/** Teilchenart: Moleküle, Ionen (Ionenverbindung), Metallgitter, einzelne Atome (Edelgase), sonst Element aus Atomen (C, S) */
export type SubstanceKind = "molekuel" | "ionen" | "metall" | "atome" | "element";
export interface SubstanceInfo {
  f: string;
  name: string;
  /** Reinstoff aus einer Atomsorte (Element) oder aus mehreren (Verbindung) */
  klass: "element" | "verbindung";
  kind: SubstanceKind;
  /** Elemente mit Anzahl je Teilchen (Molekül) bzw. Formeleinheit */
  parts: [string, number][];
  /** Ionenverbindung: Kation und Anion, wenn sie sich aus den bekannten Ionen ergeben */
  ions?: [Ion, Ion];
}

const isMetal = (el: string) => CATEGORIES[BY_SYMBOL[el].category].kind === "Metall";

export function substanceInfo(f: string): SubstanceInfo {
  const counts = parseFormula(f);
  const parts = Object.entries(counts) as [string, number][];
  const base = { f, name: speciesName(f), parts, klass: parts.length === 1 ? "element" as const : "verbindung" as const };
  if (parts.length === 1) {
    const [el] = parts[0];
    if (isMetal(el)) return { ...base, kind: "metall" };
    if (MOL3D[f]) return { ...base, kind: "molekuel" };
    return { ...base, kind: BY_SYMBOL[el].group === 18 ? "atome" : "element" };
  }
  if (isMolecular(f)) return { ...base, kind: "molekuel" };
  for (const c of CATIONS) for (const a of ANIONS) if (formula(c, a) === f) return { ...base, kind: "ionen", ions: [c, a] };
  return { ...base, kind: "ionen" };
}

// ── Strukturformel ──────────────────────────────────────────────────────────

type P2 = [el: string, x: number, y: number];

/** Ebene Lage für die Strukturformel: Ketten gerade (wie im Heft), sonst die 2D-Zeichnung der Daten, sonst die Moleküle, die ohnehin eben sind */
export function layout2D(f: string): { atoms: P2[]; bonds: [number, number, number][] } | null {
  const d = MOL3D[f];
  if (!d) return null;
  const chain = chainView(d);
  let pts: [number, number][] = (chain ?? (d.flat ? flatView(d) : null))?.map(a => [a[1], a[2]]) ?? d.atoms.map(a => [a[1], -a[2]]);
  // mittlere Bindungslänge = 1
  const lens = d.bonds.map(([i, j]) => Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
  const k = 1 / (lens.reduce((s, x) => s + x, 0) / Math.max(1, lens.length) || 1);
  pts = pts.map(([x, y]) => [x * k, y * k]);
  // Käfige (P₄O₁₀) lassen sich nicht eben zeichnen, ohne dass Atome aufeinander liegen → keine Strukturformel, dafür 3D
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++)
    if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) < .6) return null;
  return { atoms: d.atoms.map((a, i) => [a[0], pts[i][0], pts[i][1]]), bonds: d.bonds };
}

// ── Formalladungen und ungepaarte Elektronen ────────────────────────────────

/** Valenzelektronen eines Hauptgruppenelements */
const valence = (el: string) => { const g = BY_SYMBOL[el]?.group; return g == null || (g > 2 && g < 13) ? NaN : g <= 2 ? g : g - 10; };

/**
 * Formalladung und ungepaartes Elektron je Atom (Bindungen aus den Daten, freie Elektronen nach der Oktettregel): jedes Atom bekommt so viele
 * freie Elektronen, dass es sein Oktett hat (H: 2 Elektronen, B und Al: nur die bindenden), was übrig bleibt, geht an Atome ab der 3. Periode
 * (erweitertes Oktett, z. B. S in SO₂). Fehlt genau ein Elektron (ungerade Elektronenzahl: NO, NO₂), sitzt das ungepaarte Elektron am weniger
 * elektronegativen Atom. Formalladung = Valenzelektronen − freie Elektronen − Bindungen (bei C, N, O, F mit Oktett: V − 8 + Bindungen).
 * null, wenn sich die Elektronen so nicht verteilen lassen.
 */
export function formalCharges(f: string): { charge: number[]; radical: boolean[] } | null {
  const d = MOL3D[f];
  if (!d) return null;
  const els = d.atoms.map(a => a[0]);
  const B = els.map(() => 0);
  for (const [i, j, o] of d.bonds) { B[i] += o; B[j] += o; }
  const V = els.map(valence);
  if (V.some(v => Number.isNaN(v))) return null;
  // freie Elektronen = alle Valenzelektronen − 2 je Bindungsstrich (jede Bindung zählt bei B an beiden Atomen, daher Summe von B = 2 × Striche)
  const avail = V.reduce((s, v) => s + v, 0) - B.reduce((s, b) => s + b, 0);
  const target = (el: string, v: number) => (el === "H" ? 2 : el === "B" || el === "Al" ? 2 * v : 8);
  const free = els.map((el, i) => Math.max(0, target(el, V[i]) - 2 * B[i]));
  let rest = avail - free.reduce((s, x) => s + x, 0);
  if (rest > 0) {
    // übrige Elektronen (paarweise) an die Atome ab der 3. Periode mit den meisten Bindungen – das Zentralatom
    const big = els.map((_, i) => i).filter(i => BY_SYMBOL[els[i]].period >= 3).sort((a, b) => B[b] - B[a]);
    if (!big.length) return null;
    for (let k = 0; rest > 0; k = (k + 1) % big.length) { const n = Math.min(2, rest); free[big[k]] += n; rest -= n; }
  } else if (rest === -1) {
    const cand = els.map((_, i) => i).filter(i => els[i] !== "H" && free[i] > 0).sort((a, b) => (BY_SYMBOL[els[a]].en ?? 9) - (BY_SYMBOL[els[b]].en ?? 9));
    if (!cand.length) return null;
    free[cand[0]] -= 1;
  } else if (rest < 0) return null;
  const charge = els.map((_, i) => V[i] - free[i] - B[i]);
  if (charge.reduce((s, c) => s + c, 0) !== 0) return null;
  return { charge, radical: free.map(n => n % 2 === 1) };
}

/** Zeichen an der Strukturformel: Formalladung (Kreis mit + oder −) bzw. ungepaartes Elektron (Punkt) – je in einer freien Richtung am Atom */
export interface StructMark { atom: number; kind: "plus" | "minus" | "dot"; x: number; y: number }
export function structureMarks(l: NonNullable<ReturnType<typeof layout2D>>, fc: NonNullable<ReturnType<typeof formalCharges>>): StructMark[] {
  const marks: StructMark[] = [];
  const PREF = -Math.PI / 4; // oben rechts (SVG: y nach unten)
  const gap = (a: number, b: number) => { const d = Math.abs(a - b) % (2 * Math.PI); return Math.min(d, 2 * Math.PI - d); };
  l.atoms.forEach(([, x, y], i) => {
    const want: StructMark["kind"][] = [...(fc.charge[i] > 0 ? ["plus" as const] : fc.charge[i] < 0 ? ["minus" as const] : []), ...(fc.radical[i] ? ["dot" as const] : [])];
    if (!want.length) return;
    const taken = l.bonds.filter(([a, b]) => a === i || b === i).map(([a, b]) => { const [, bx, by] = l.atoms[a === i ? b : a]; return Math.atan2(by - y, bx - x); });
    for (const kind of want) {
      // Richtung: möglichst nah an „oben rechts“, aber mindestens 60° weg von Bindungen (auch den Strichen einer Mehrfachbindung) und schon
      // gesetzten Zeichen; sonst die freieste
      const cands = Array.from({ length: 24 }, (_, k) => PREF + (k * Math.PI) / 12);
      const room = (a: number) => Math.min(Math.PI, ...taken.map(t => gap(a, t)));
      const ok = cands.filter(a => room(a) >= Math.PI / 3 - 1e-9).sort((a, b) => gap(a, PREF) - gap(b, PREF));
      const a = ok[0] ?? cands.sort((p, q) => room(q) - room(p))[0];
      const r = kind === "dot" ? .34 : .42;
      marks.push({ atom: i, kind, x: x + r * Math.cos(a), y: y + r * Math.sin(a) });
      taken.push(a);
    }
  });
  return marks;
}

export function StructureFormula({ f }: { f: string }) {
  const l = layout2D(f);
  if (!l) return null;
  const fc = formalCharges(f);
  const marks = fc ? structureMarks(l, fc) : [];
  const xs = [...l.atoms.map(a => a[1]), ...marks.map(m => m.x)], ys = [...l.atoms.map(a => a[2]), ...marks.map(m => m.y)];
  const pad = .45, x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
  const w = Math.max(...xs) - x0 + pad, h = Math.max(...ys) - y0 + pad;
  const R = .24; // Abstand der Striche vom Atomsymbol
  // für Screenreader: Formalladungen und ungepaarte Elektronen in Worten
  const said = marks.map(m => `${l.atoms[m.atom][0]} ${m.kind === "plus" ? tr("Formalladung plus", "formal charge plus") : m.kind === "minus" ? tr("Formalladung minus", "formal charge minus") : tr("ungepaartes Elektron", "unpaired electron")}`);
  return (
    <svg className="sub-struct" viewBox={`${x0} ${y0} ${w} ${h}`} role="img"
      aria-label={tr(`Strukturformel von ${speciesName(f)}`, `Structural formula of ${speciesName(f)}`) + (said.length ? `: ${said.join(", ")}` : "")}
      style={{ width: `min(100%, ${w * 64}px)` }}>
      {l.bonds.map(([i, j, order], n) => {
        const [, ax, ay] = l.atoms[i], [, bx, by] = l.atoms[j];
        const len = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / len, uy = (by - ay) / len;
        const offs = order === 1 ? [0] : order === 2 ? [-.07, .07] : [-.11, 0, .11];
        return offs.map(o => (
          <line key={`${n}-${o}`} x1={ax + ux * R - uy * o} y1={ay + uy * R + ux * o} x2={bx - ux * R - uy * o} y2={by - uy * R + ux * o} className="sub-bond" />
        ));
      })}
      {l.atoms.map(([el, x, y], i) => (
        <text key={i} x={x} y={y} className="sub-sym" textAnchor="middle" dominantBaseline="central">{el}</text>
      ))}
      {marks.map((m, n) => m.kind === "dot"
        ? <circle key={`m${n}`} cx={m.x} cy={m.y} r={.055} className="sub-rad" />
        : (
          <g key={`m${n}`} className="sub-fc">
            <circle cx={m.x} cy={m.y} r={.12} />
            <line x1={m.x - .065} y1={m.y} x2={m.x + .065} y2={m.y} />
            {m.kind === "plus" && <line x1={m.x} y1={m.y - .065} x2={m.x} y2={m.y + .065} />}
          </g>
        ))}
    </svg>
  );
}

// ── Blatt ───────────────────────────────────────────────────────────────────

const KIND: Record<SubstanceKind, string | null> = tr(
  { molekuel: "Moleküle", ionen: "Ionen", metall: "Metallgitter", atome: "einzelne Atome", element: null },
  { molekuel: "Molecules", ionen: "Ions", metall: "Metal lattice", atome: "Single atoms", element: null });

/**
 * Elemente, die in Gleichungen nur mit dem Symbol stehen, obwohl der Stoff anders gebaut ist: woraus er wirklich besteht.
 * Kohlenstoff (Grafit, Diamant): ein Gitter aus fest verbundenen C-Atomen. Schwefel: ringförmige Moleküle S₈.
 */
export function elementParticles(f: string): string[] | undefined {
  const T: Record<string, [string, string][]> = {
    C: [["Atome im Gitter verbunden", "Atoms bonded in a lattice"], ["in Gleichungen: C", "in equations: C"]],
    S: [["Moleküle S₈", "S₈ molecules"], ["in Gleichungen vereinfacht: S", "simplified to S in equations"]],
  };
  return T[f]?.map(([de, en]) => tr(de, en));
}

function Facts({ s }: { s: SubstanceInfo }) {
  return (
    <div className="sub-facts">
      <p className="sub-formula">{toSubscript(s.f)}</p>
      <div className="ui-tags">
        <Tag>{s.klass === "element" ? tr("Element", "Element") : tr("Verbindung", "Compound")}</Tag>
        {KIND[s.kind] && <Tag>{KIND[s.kind]}</Tag>}
        {s.kind === "element" && elementParticles(s.f)?.map(t => <Tag key={t}>{t}</Tag>)}
        {s.kind === "molekuel" && s.parts.map(([el, n]) => <Tag key={el}>{n} {el}</Tag>)}
        {s.kind === "ionen" && s.ions && s.ions.map(ion => <Tag key={ion.id}>{ionText(ion)}</Tag>)}
      </div>
    </div>
  );
}

/** Info zu einem Stoff: Formel, Art, Strukturformel oder 3D-Modell */
export function SubstanceDetail({ f }: { f: string }) {
  const s = substanceInfo(f);
  const has3d = s.kind === "molekuel" && (MOL3D[f]?.atoms.length ?? 0) > 1;
  const hasStruct = s.kind === "molekuel" && !!layout2D(f);
  const [view, setView] = useState<"struct" | "3d">(hasStruct ? "struct" : "3d");
  return (
    <div className={`sub-body${view === "3d" ? " is-3d" : ""}`}>
      <Facts s={s} />
      {has3d && view === "3d"
        ? <Suspense fallback={<div className="m3d m3d-loading">{tr("3D-Modell wird geladen …", "Loading 3D model …")}</div>}><Molecule3D data={MOL3D[f]} showAngles={false} /></Suspense>
        : hasStruct && <div className="sub-struct-box"><StructureFormula f={f} /></div>}
      {has3d && hasStruct && (
        <Segmented<"struct" | "3d"> label={tr("Darstellung", "View")} value={view} onChange={v => { buzz(); setView(v); }}
          options={[{ value: "struct", label: tr("Strukturformel", "Structural formula") }, { value: "3d", label: tr("3D-Modell", "3D model") }]} />
      )}
    </div>
  );
}

export function SubstanceSheet({ f, onClose }: { f: string | null; onClose: () => void }) {
  return (
    <Sheet open={!!f} title={f ? speciesName(f) : ""} onClose={onClose}>
      {f && <SubstanceDetail key={f} f={f} />}
    </Sheet>
  );
}

