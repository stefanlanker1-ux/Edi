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

export function StructureFormula({ f }: { f: string }) {
  const l = layout2D(f);
  if (!l) return null;
  const xs = l.atoms.map(a => a[1]), ys = l.atoms.map(a => a[2]);
  const pad = .45, x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
  const w = Math.max(...xs) - x0 + pad, h = Math.max(...ys) - y0 + pad;
  const R = .24; // Abstand der Striche vom Atomsymbol
  return (
    <svg className="sub-struct" viewBox={`${x0} ${y0} ${w} ${h}`} role="img" aria-label={tr(`Strukturformel von ${speciesName(f)}`, `Structural formula of ${speciesName(f)}`)}
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

