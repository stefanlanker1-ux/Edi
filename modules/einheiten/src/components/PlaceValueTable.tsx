// Stellenwerttafel wie im Heft: je Spalte eine Stelle („100 m | 10 m | m | dm | cm | mm“), eine Ziffer pro Kästchen.
// Orange = Komma der Ausgangseinheit, Blaugrün = Komma der Zieleinheit, blaugrüne Ziffern = ergänzte Nullen.

import { useLayoutEffect, useRef } from "react";
import { useNarrow } from "@lern/ui";
import { placeValue, fmt, type PvColumn, type Q } from "@lern/units";
import { tr } from "@lern/i18n";

/** Passt die Tafel trotz enger Spalten nicht (km² → mm²: 14 Spalten), wird sie als Ganzes verkleinert – nie quer scrollen, keine Stelle verstecken */
function useFitWidth() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current, table = el?.firstElementChild as HTMLElement | null;
    if (!el || !table) return;
    const fit = () => {
      table.style.zoom = "";
      if (el.scrollWidth <= el.clientWidth + 1) return;
      let k = (el.clientWidth - 8) / table.scrollWidth;
      table.style.zoom = String(Math.max(0.6, k));
      // Komma-Punkt ragt über die letzte Spalte: nachmessen
      if (el.scrollWidth > el.clientWidth + 1) { k *= el.clientWidth / el.scrollWidth; table.style.zoom = String(Math.max(0.6, k - 0.01)); }
    };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  });
  return ref;
}

/** Kopf einer Spalte: E = Einheit, Z/H = „10 m“ / „100 m“ (Zahl klein darüber) */
function ColHead({ c, first, alt, from, to }: { c: PvColumn; first: boolean; alt: boolean; from: boolean; to: boolean }) {
  return (
    <th className={`pv-h${first ? " g0" : ""}${alt ? " alt" : ""}${from ? " from" : ""}${to ? " to" : ""}`} scope="col">
      {c.place !== "E" && <small>{c.place === "H" ? "100" : "10"}</small>}
      <span>{c.unit}</span>
    </th>
  );
}

/** Spaltenbereich: auf schmalen Bildschirmen nur die benutzten Einheiten (ganze Gruppen) */
function range(cols: PvColumn[], used: number[], narrow: boolean): [number, number] {
  if (!narrow || !used.length) return [0, cols.length - 1];
  let lo = Math.min(...used), hi = Math.max(...used);
  while (lo > 0 && cols[lo - 1].unit === cols[lo].unit) lo--;
  while (hi < cols.length - 1 && cols[hi + 1].unit === cols[hi].unit) hi++;
  return [lo, hi];
}

function Head({ cols, from, to }: { cols: PvColumn[]; from: string; to: string }) {
  const groups = [...new Set(cols.map(c => c.unit))];
  const hasSub = cols.some(c => c.sub);
  const isUnit = (c: PvColumn, u: string) => c.unit === u || c.sub === u;
  return (
    <thead>
      <tr>{cols.map((c, i) => <ColHead key={i} c={c} first={i === 0 || cols[i - 1].unit !== c.unit} alt={groups.indexOf(c.unit) % 2 === 1}
        from={isUnit(c, from) && (c.place === "E" || c.sub === from)} to={isUnit(c, to) && (c.place === "E" || c.sub === to)} />)}</tr>
      {hasSub && <tr className="pv-subrow">{cols.map((c, i) => <th key={i} className={`pv-sub${groups.indexOf(c.unit) % 2 ? " alt" : ""}${i === 0 || cols[i - 1].unit !== c.unit ? " g0" : ""}`}>{c.sub ?? ""}</th>)}</tr>}
    </thead>
  );
}
const cellClass = (cols: PvColumn[], i: number) => {
  const groups = [...new Set(cols.map(c => c.unit))];
  return `${groups.indexOf(cols[i].unit) % 2 ? " alt" : ""}${i === 0 || cols[i - 1].unit !== cols[i].unit ? " g0" : ""}`;
};

/** Eine Umrechnung: Ziffern, ergänzte Nullen, beide Kommas */
export function PlaceValueTable({ value, from, to, units, showResult = true, label }: {
  value: Q; from: string; to: string; units: string[]; showResult?: boolean; label?: string;
}) {
  const full = placeValue(value, from, to, units);
  const narrow = useNarrow();
  const fitRef = useFitWidth();
  const used = full.cells.map((c, i) => (c.kind !== "empty" || i === full.fromE || i === full.toE ? i : -1)).filter(i => i >= 0);
  const [lo, hi] = full.fits ? range(full.cols, used, narrow) : [0, full.cols.length - 1];
  const cols = full.cols.slice(lo, hi + 1), cells = full.cells.slice(lo, hi + 1);
  const fromE = full.fromE - lo, toE = full.toE - lo;
  return (
    <div className="pv-wrap scroll-x" ref={fitRef}>
      <table className="pv" aria-label={`${tr("Stellenwerttafel", "Place value chart")}: ${label ?? `${fmt(value).text} ${from} ${tr("in", "to")} ${to}`}`}>
        <Head cols={cols} from={from} to={to} />
        <tbody>
          <tr>
            {cells.map((cell, i) => {
              const show = showResult || cell.kind !== "added";
              return (
                <td key={i} className={`pv-c${cellClass(cols, i)}${show ? ` ${cell.kind}` : ""}`}>
                  {show ? cell.digit : ""}
                  {i === fromE && <span className="pv-dot from" role="img" aria-label={tr("Komma vorher", "Decimal point before")} />}
                  {showResult && i === toE && <span className={`pv-dot to${toE === fromE ? " both" : ""}`} role="img" aria-label={tr("Komma nachher", "Decimal point after")} />}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      {showResult && full.fits && <p className="pv-res-line">{fmt(value).text} {from} = <b>{fmt(full.result).text} {to}</b></p>}
      {!full.fits && <p className="muted small">{tr("Passt nicht in die Tafel.", "Does not fit in the chart.")}</p>}
    </div>
  );
}

/** Legende zur Tafel */
export function PvLegend() {
  return (
    <p className="pv-legend">
      <span><i className="pv-dot from" /> {tr("Komma vorher", "Decimal point before")}</span>
      <span><i className="pv-dot to" /> {tr("Komma nachher", "Decimal point after")}</span>
      <span><b className="added-sample">0</b> {tr("ergänzte Null", "added zero")}</span>
    </p>
  );
}
