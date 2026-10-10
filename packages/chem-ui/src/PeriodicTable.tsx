// Periodensystem (gemeinsam für alle Chemie-Apps). Unterstufe: Hauptgruppen I–VIII bis Calcium. Oberstufe: Langperiodensystem bis Radon,
// mit `period7` (nur das große PSE im Atombau) die 7. Periode bis Oganesson samt Actinoiden. Lage der Zellen: `pseLayout.ts`.
// `sub` zeigt statt des Namens eine Zusatzangabe je Element (z. B. Ionenladung oder Außenelektronen).
// `blocks` färbt nach s-, p-, d- und f-Block (Elektronenkonfiguration) statt nach Kategorien.

import { BY_Z, CATEGORIES, TRENDS, blockOf, ROMAN, type Category, type TrendKey } from "@lern/chem";
import { Fragment, type ReactNode } from "react";
import { tr } from "@lern/i18n";
import { cellPosition, placeholders, psePeriods, pseElements } from "./pseLayout.ts";

type Stufe = "us" | "os";

export type CellState = "sel" | "dim" | "hit" | "right" | "wrong" | undefined;

/** Trend-Ansicht: Zellen nach einem Wert einfärben (0 = niedrig, 1 = hoch, null = kein Wert) */
export interface TrendView { key: TrendKey; scale: (Z: number) => number | null }

export function PeriodicTable({ stufe, onPick, cellState, names = true, disabled = false, trend, sub, fit = false, blocks = false, period7 = false }: {
  stufe: Stufe; onPick?: (Z: number) => void; cellState?: (Z: number) => CellState; names?: boolean; disabled?: boolean; trend?: TrendView;
  blocks?: boolean;
  sub?: (Z: number) => ReactNode;
  /** in den verfügbaren Platz einpassen (Eltern-Element mit `container-type: size`, z. B. `.pse-fit`) – nie seitlich scrollen */
  fit?: boolean;
  /** Oberstufe: auch die 7. Periode (Fr–Og) mit der Zeile der Actinoide (Ac–Lr) – nur im großen PSE des Atombaus */
  period7?: boolean;
}) {
  const us = stufe === "us";
  const opts = { us, period7: period7 && !us };
  const p7 = opts.period7;
  const list = pseElements(opts).map(Z => BY_Z[Z]);
  const cols = us ? 8 : 18, periods = psePeriods(opts);
  const series = placeholders(opts);
  return (
    <div className={`pse ${us ? "pse-us" : "pse-os"}${p7 ? " pse-p7" : ""}${fit ? " fit" : ""}`} role="group" aria-label={tr("Periodensystem", "Periodic table")}>
      {Array.from({ length: cols }, (_, i) => (
        <div key={`h${i}`} className="pse-head" style={{ gridColumn: i + 2, gridRow: 1 }}>{us ? ROMAN[i + 1] : i + 1}</div>
      ))}
      {Array.from({ length: periods }, (_, p) => (
        <div key={`p${p}`} className="pse-head pse-per" style={{ gridColumn: 1, gridRow: p + 2 }}>{p + 1}</div>
      ))}
      {list.map(e => {
        const { col, row } = cellPosition(e.Z, opts);
        const st = cellState?.(e.Z);
        const t = trend ? trend.scale(e.Z) : undefined;
        const val = trend ? TRENDS[trend.key].value(e.Z) : null;
        // ohne Messwert: keine Fläche, gestrichelter Rand (`.no-data`) – nie wie ein niedriger Wert
        const bg = t === undefined || t === null ? undefined : `color-mix(in srgb, var(--trend-hi) ${Math.round(t * 100)}%, var(--trend-lo))`;
        return (
          <button key={e.Z} type="button" className={`pse-cell ${trend ? `trend${t === null ? " no-data" : ""}` : blocks ? `blk-${blockOf(e.Z)}` : `cat-${e.category}`}${t !== undefined && t !== null && t > 0.55 ? " on-dark" : ""}${st ? ` ${st}` : ""}`}
            style={{ gridColumn: col, gridRow: row, background: bg }} disabled={disabled} aria-pressed={st === "sel" || undefined}
            aria-label={`${e.name}, ${tr("Ordnungszahl", "atomic number")} ${e.Z}${trend ? `, ${TRENDS[trend.key].label} ${val ?? tr("keine Daten", "no data")}` : ""}`} onClick={() => onPick?.(e.Z)}>
            {/* Ordnungszahl unten links – wie im Atomsymbol (₆C); oben links stünde die Massenzahl */}
            <span className="pc-z">{e.Z}</span>
            <span className="pc-sym">{e.symbol}</span>
            {trend
              ? <span className="pc-val">{val === null ? "–" : val.toLocaleString(tr("de-AT", "en-GB"), { maximumFractionDigits: TRENDS[trend.key].digits })}</span>
              : sub ? <span className="pc-sub">{sub(e.Z)}</span> : names && <span className="pc-name">{e.name}</span>}
          </button>
        );
      })}
      {series.map((s, i) => {
        // Platzhalter abgeblendet, wenn die ganze Reihe abgeblendet ist (Suche, Kategorie) – nur im großen PSE, sonst unverändert
        const dim = p7 && !!cellState && Array.from({ length: s.last - s.first + 1 }, (_, k) => cellState(s.first + k)).every(x => x === "dim");
        const cat = s.first === 57 ? "cat-lanthanoid" : "cat-actinoid";
        return (
          <Fragment key={s.range}>
            <div className={`pse-cell pse-ph ${trend ? "trend" : blocks ? "blk-f" : cat}${dim ? " dim" : ""}`} style={{ gridColumn: s.col, gridRow: s.row }} aria-hidden="true"><span className="pc-sym">{s.range}</span></div>
            {i === 0 && <div className="pse-gap" style={{ gridRow: s.labelRow - 1 }} />}
            {p7
              ? <div className="pse-head pse-per pse-series" style={{ gridColumn: "1 / span 3", gridRow: s.labelRow }}>
                  <span className="ps-long">{s.first === 57 ? tr("Lanthanoide", "Lanthanoids") : tr("Actinoide", "Actinoids")}</span><span className="ps-short">{s.label}</span>
                </div>
              : <div className="pse-head pse-per" style={{ gridColumn: "2 / span 2", gridRow: s.labelRow }}>{s.label}</div>}
          </Fragment>
        );
      })}
    </div>
  );
}

export function Legend({ stufe, active, onToggle, period7 = false }: { stufe: Stufe; active: Category | null; onToggle: (c: Category) => void; period7?: boolean }) {
  const used = new Set(pseElements({ us: stufe === "us", period7 }).map(Z => BY_Z[Z].category));
  return (
    <div className="legend" role="group" aria-label={tr("Kategorien hervorheben", "Highlight categories")}>
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
    <div className="legend blk-legend" role="list" aria-label={tr("Blöcke", "Blocks")}>
      {(["s", "p", "d", "f"] as const).map(b => <span key={b} className="lg-item" role="listitem"><i className={`blk-${b}`} />{b}{tr("-Block", " block")}</span>)}
    </div>
  );
}
