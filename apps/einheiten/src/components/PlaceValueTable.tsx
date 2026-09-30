// Stellenwerttafel wie im Heft: je Spalte eine Stelle („100 m | 10 m | m | dm | cm | mm“), eine Ziffer pro Kästchen.
// Orange = Komma der Ausgangseinheit, Blaugrün = Komma der Zieleinheit, blaugrüne Ziffern = ergänzte Nullen.
// PracticeTable: zweite Zeile zeigt live die eingetippte Antwort – passen die Ziffern untereinander?

import { useLayoutEffect, useRef } from "react";
import { useNarrow } from "@lern/ui";
import { placeValue, pvColumns, pvPlace, parseQ, fmt, type PvColumn, type Q } from "@lern/units";

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

function Head({ cols, from, to, corner }: { cols: PvColumn[]; from: string; to: string; corner?: boolean }) {
  const groups = [...new Set(cols.map(c => c.unit))];
  const hasSub = cols.some(c => c.sub);
  const isUnit = (c: PvColumn, u: string) => c.unit === u || c.sub === u;
  return (
    <thead>
      <tr>{corner && <td className="pv-corner" rowSpan={hasSub ? 2 : 1} />}{cols.map((c, i) => <ColHead key={i} c={c} first={i === 0 || cols[i - 1].unit !== c.unit} alt={groups.indexOf(c.unit) % 2 === 1}
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
      <table className="pv" aria-label={`Stellenwerttafel: ${label ?? `${fmt(value).text} ${from} in ${to}`}`}>
        <Head cols={cols} from={from} to={to} />
        <tbody>
          <tr>
            {cells.map((cell, i) => {
              const show = showResult || cell.kind !== "added";
              return (
                <td key={i} className={`pv-c${cellClass(cols, i)}${show ? ` ${cell.kind}` : ""}`}>
                  {show ? cell.digit : ""}
                  {i === fromE && <span className="pv-dot from" role="img" aria-label="Komma vorher" />}
                  {showResult && i === toE && <span className={`pv-dot to${toE === fromE ? " both" : ""}`} role="img" aria-label="Komma nachher" />}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      {showResult && full.fits && <p className="pv-res-line">{fmt(value).text} {from} = <b>{fmt(full.result).text} {to}</b></p>}
      {!full.fits && <p className="muted small">Passt nicht in die Tafel.</p>}
    </div>
  );
}

/**
 * Übungstafel: oben die Aufgabe (Komma orange), darunter live die eingetippte Antwort (Komma blaugrün).
 * Stimmt die Antwort, stehen alle Ziffern genau unter den Ziffern der Aufgabe.
 */
export function PracticeTable({ value, from, to, units, answer, reveal }: {
  value: Q; from: string; to: string; units: string[]; answer: string; reveal?: boolean;
}) {
  const cols = pvColumns(units);
  const narrow = useNarrow();
  const fitRef = useFitWidth();
  const given = pvPlace(value, from, units);
  const sol = placeValue(value, from, to, units);
  const a = parseQ(answer);
  const mine = a ? pvPlace(a, to, units) : null;
  const used = [
    ...given.digits.map((d, i) => (d !== null ? i : -1)), ...sol.cells.map((c, i) => (c.kind !== "empty" ? i : -1)),
    ...(mine?.fits ? mine.digits.map((d, i) => (d !== null ? i : -1)) : []), given.comma, sol.toE,
  ].filter(i => i >= 0);
  const [lo, hi] = range(cols, used, narrow);
  const cs = cols.slice(lo, hi + 1);
  const row = (digits: (string | null)[], comma: number, kind: "from" | "to", cls: (i: number) => string = () => "") => (
    <>
      {digits.slice(lo, hi + 1).map((d, k) => {
        const i = k + lo;
        return (
          <td key={i} className={`pv-c${cellClass(cs, k)}${cls(i)}`}>
            {d ?? ""}
            {i === comma && <span className={`pv-dot ${kind}`} role="img" aria-label={kind === "from" ? "Komma Aufgabe" : "Komma Antwort"} />}
          </td>
        );
      })}
    </>
  );
  const mineRow = mine?.fits ? mine.digits : cols.map(() => null);
  const solRow = sol.cells.map(c => c.digit);
  return (
    <div className="pv-wrap scroll-x" ref={fitRef}>
      <table className="pv pv-practice" aria-label="Stellenwerttafel zum Üben">
        <Head cols={cs} from={from} to={to} corner />
        <tbody>
          <tr><th scope="row" className="pv-rowh">{fmt(value).text} {from}</th>{row(given.digits, given.comma, "from", i => (given.digits[i] !== null ? " given" : ""))}</tr>
          <tr className="pv-mine">
            <th scope="row" className="pv-rowh">{a ? `${fmt(a).text} ${to}` : `? ${to}`}</th>
            {row(mineRow, sol.toE, "to", i => (mineRow[i] !== null && given.digits[i] !== null && mineRow[i] !== given.digits[i] ? " clash" : ""))}
          </tr>
          {reveal && sol.fits && (
            <tr className="pv-sol">
              <th scope="row" className="pv-rowh">Lösung</th>
              {row(solRow, sol.toE, "to", i => (sol.cells[i].kind === "added" ? " added" : ""))}
            </tr>
          )}
        </tbody>
      </table>
      {a && mine && !mine.fits && <p className="muted small">Passt nicht in die Tafel.</p>}
    </div>
  );
}

/** Legende zur Tafel */
export function PvLegend() {
  return (
    <p className="pv-legend">
      <span><i className="pv-dot from" /> Komma vorher</span>
      <span><i className="pv-dot to" /> Komma nachher</span>
      <span><b className="added-sample">0</b> ergänzte Null</span>
    </p>
  );
}
