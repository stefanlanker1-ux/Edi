// Stoff-Info: Name antippen → Blatt mit Summenformel, Art des Stoffs (Molekül, Ionenverbindung, Metall, Element),
// Strukturformel und – bei Molekülen – 3D-Modell (three.js, erst beim Umschalten geladen).

import { Fragment, lazy, Suspense, useState } from "react";
import { Button, Segmented, Sheet, Tag, buzz } from "@lern/ui";
import { BY_SYMBOL, CATEGORIES, CATIONS, ANIONS, MOL3D, formula, ionText, parseFormula, speciesName, toSubscript, type Equation, type Ion } from "@lern/chem";
import { chainView, flatView } from "./geometry.ts";
import { isMolecular } from "./Molecules.tsx";

const Molecule3D = lazy(() => import("@lern/chem-ui/3d"));

export type SubstanceKind = "molekuel" | "ionen" | "metall" | "element";
export interface SubstanceInfo {
  f: string;
  name: string;
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
  const base = { f, name: speciesName(f), parts };
  if (parts.length === 1) {
    const [el] = parts[0];
    if (isMetal(el)) return { ...base, kind: "metall" };
    return { ...base, kind: MOL3D[f] ? "molekuel" : "element" };
  }
  if (isMolecular(f)) return { ...base, kind: "molekuel" };
  for (const c of CATIONS) for (const a of ANIONS) if (formula(c, a) === f) return { ...base, kind: "ionen", ions: [c, a] };
  return { ...base, kind: "ionen" };
}

/** Alle Stoffe einer Gleichung, jeder einmal */
export const substancesOf = (eq: Equation) => [...new Set([...eq.left, ...eq.right])];

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
    <svg className="sub-struct" viewBox={`${x0} ${y0} ${w} ${h}`} role="img" aria-label={`Strukturformel von ${speciesName(f)}`}
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

const KIND: Record<SubstanceKind, string> = { molekuel: "Molekül", ionen: "Ionenverbindung", metall: "Metall", element: "Element" };

function Facts({ s }: { s: SubstanceInfo }) {
  return (
    <div className="sub-facts">
      <p className="sub-formula">{toSubscript(s.f)}</p>
      <div className="ui-tags">
        <Tag>{KIND[s.kind]}</Tag>
        {s.kind === "molekuel" && s.parts.map(([el, n]) => <Tag key={el}>{n} {el}</Tag>)}
        {s.kind === "ionen" && s.ions && s.ions.map(ion => <Tag key={ion.id}>{ionText(ion)}</Tag>)}
        {s.kind === "metall" && <Tag>Metallgitter aus {s.f}-Atomen</Tag>}
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
        ? <Suspense fallback={<div className="m3d m3d-loading">3D-Modell wird geladen …</div>}><Molecule3D data={MOL3D[f]} showAngles={false} /></Suspense>
        : hasStruct && <div className="sub-struct-box"><StructureFormula f={f} /></div>}
      {has3d && hasStruct && (
        <Segmented<"struct" | "3d"> label="Darstellung" value={view} onChange={v => { buzz(); setView(v); }}
          options={[{ value: "struct", label: "Strukturformel" }, { value: "3d", label: "3D-Modell" }]} />
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

/** Wortgleichung, jeder Stoffname ist ein Knopf zur Stoff-Info */
export function NameLine({ eq, className = "rg-names" }: { eq: Equation; className?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const side = (fs: string[]) => fs.map((f, i) => (
    <Fragment key={f + i}>
      {i > 0 && <span className="rg-plus" aria-hidden="true">+</span>}
      <button type="button" className="sub-name" onClick={() => { buzz(); setOpen(f); }} aria-label={`${speciesName(f)} – Info`}>{speciesName(f)}</button>
    </Fragment>
  ));
  return (
    <>
      <p className={className}>{side(eq.left)}<span className="rg-arrow" aria-hidden="true">→</span>{side(eq.right)}</p>
      <SubstanceSheet f={open} onClose={() => setOpen(null)} />
    </>
  );
}

/** Stoffe einer Aufgabe als Knöpfe; Antippen zeigt die Info im selben Blatt (Quiz-Hilfsmittel „Stoffe“) */
export function SubstanceList({ fs }: { fs: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (open) return (
    <div className="sub-detail">
      <div className="sub-detail-head">
        <Button variant="quiet" icon="back" onClick={() => { buzz(); setOpen(null); }}>Alle Stoffe</Button>
        <h3>{speciesName(open)}</h3>
      </div>
      <SubstanceDetail key={open} f={open} />
    </div>
  );
  return (
    <div className="sub-list">
      {fs.map(f => (
        <button key={f} type="button" className="sub-item" onClick={() => { buzz(); setOpen(f); }}>
          <b>{speciesName(f)}</b><span>{toSubscript(f)}</span>
        </button>
      ))}
    </div>
  );
}
