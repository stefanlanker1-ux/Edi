// Periodensystem (gemeinsam für alle Chemie-Apps). Unterstufe: Hauptgruppen I–VIII bis Calcium. Oberstufe: Langperiodensystem bis Radon.
// `sub` zeigt statt des Namens eine Zusatzangabe je Element (z. B. Ionenladung oder Außenelektronen).
// `blocks` färbt nach s-, p-, d- und f-Block (Elektronenkonfiguration) statt nach Kategorien.

import { ELEMENTS, CATEGORIES, TRENDS, blockOf, mainGroupNumber, ROMAN, type Category, type TrendKey } from "@lern/chem";
import type { ReactNode } from "react";

type Stufe = "us" | "os";

export type CellState = "sel" | "dim" | "hit" | "right" | "wrong" | undefined;

/** Trend-Ansicht: Zellen nach einem Wert einfärben (0 = niedrig, 1 = hoch, null = kein Wert) */
export interface TrendView { key: TrendKey; scale: (Z: number) => number | null }

export function PeriodicTable({ stufe, onPick, cellState, names = true, disabled = false, trend, sub, fit = false, blocks = false }: {
  stufe: Stufe; onPick?: (Z: number) => void; cellState?: (Z: number) => CellState; names?: boolean; disabled?: boolean; trend?: TrendView;
  blocks?: boolean;
  sub?: (Z: number) => ReactNode;
  /** in den verfügbaren Platz einpassen (Eltern-Element mit `container-type: size`, z. B. `.pse-fit`) – nie seitlich scrollen */
  fit?: boolean;
}) {
  const us = stufe === "us";
  const list = us ? ELEMENTS.filter(e => e.Z <= 20) : ELEMENTS;
  const cols = us ? 8 : 18, periods = us ? 4 : 6;
  return (
    <div className={`pse ${us ? "pse-us" : "pse-os"}${fit ? " fit" : ""}`} role="group" aria-label="Periodensystem">
      {Array.from({ length: cols }, (_, i) => (
        <div key={`h${i}`} className="pse-head" style={{ gridColumn: i + 2, gridRow: 1 }}>{us ? ROMAN[i + 1] : i + 1}</div>
      ))}
      {Array.from({ length: periods }, (_, p) => (
        <div key={`p${p}`} className="pse-head pse-per" style={{ gridColumn: 1, gridRow: p + 2 }}>{p + 1}</div>
      ))}
      {list.map(e => {
        const col = e.group === null ? e.Z - 57 + 4 : (us ? mainGroupNumber(e.Z)! : e.group) + 1;
        const row = e.group === null ? 9 : e.period + 1;
        const st = cellState?.(e.Z);
        const t = trend ? trend.scale(e.Z) : undefined;
        const val = trend ? TRENDS[trend.key].value(e.Z) : null;
        const bg = t === undefined ? undefined : t === null ? "var(--surface-2)" : `color-mix(in srgb, var(--trend-hi) ${Math.round(t * 100)}%, var(--trend-lo))`;
        return (
          <button key={e.Z} type="button" className={`pse-cell ${trend ? "trend" : blocks ? `blk-${blockOf(e.Z)}` : `cat-${e.category}`}${t !== undefined && t !== null && t > 0.55 ? " on-dark" : ""}${st ? ` ${st}` : ""}`}
            style={{ gridColumn: col, gridRow: row, background: bg }} disabled={disabled} aria-pressed={st === "sel" || undefined}
            aria-label={`${e.name}, Ordnungszahl ${e.Z}${trend ? `, ${TRENDS[trend.key].label} ${val ?? "unbekannt"}` : ""}`} onClick={() => onPick?.(e.Z)}>
            {/* Ordnungszahl unten links – wie im Atomsymbol (₆C); oben links stünde die Massenzahl */}
            <span className="pc-z">{e.Z}</span>
            <span className="pc-sym">{e.symbol}</span>
            {trend
              ? <span className="pc-val">{val === null ? "–" : val.toLocaleString("de-AT", { maximumFractionDigits: TRENDS[trend.key].digits })}</span>
              : sub ? <span className="pc-sub">{sub(e.Z)}</span> : names && <span className="pc-name">{e.name}</span>}
          </button>
        );
      })}
      {!us && (
        <>
          <div className={`pse-cell pse-ph ${trend ? "trend" : blocks ? "blk-f" : "cat-lanthanoid"}`} style={{ gridColumn: 4, gridRow: 7 }} aria-hidden="true"><span className="pc-sym">57–71</span></div>
          <div className="pse-gap" style={{ gridRow: 8 }} />
          <div className="pse-head pse-per" style={{ gridColumn: "2 / span 2", gridRow: 9 }}>La–Lu</div>
        </>
      )}
    </div>
  );
}

export function Legend({ stufe, active, onToggle }: { stufe: Stufe; active: Category | null; onToggle: (c: Category) => void }) {
  const used = new Set((stufe === "us" ? ELEMENTS.filter(e => e.Z <= 20) : ELEMENTS).map(e => e.category));
  return (
    <div className="legend" role="group" aria-label="Kategorien hervorheben">
      {(Object.keys(CATEGORIES) as Category[]).filter(k => used.has(k)).map(k => (
        <button key={k} type="button" className="lg-item" aria-pressed={active === k} onClick={() => onToggle(k)}>
          <i className={`cat-${k}`} />{CATEGORIES[k].label}
        </button>
      ))}
    </div>
  );
}

/** Farben der Blöcke (s, p, d, f) */
export function BlockLegend() {
  return (
    <div className="legend blk-legend" role="list" aria-label="Blöcke">
      {(["s", "p", "d", "f"] as const).map(b => <span key={b} className="lg-item" role="listitem"><i className={`blk-${b}`} />{b}-Block</span>)}
    </div>
  );
}
