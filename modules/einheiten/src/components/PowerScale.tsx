// Vorsilben-Skala: n µ m c d – da h k M G mit 10⁻⁹ … 10⁹.
// Ein Bogenpfeil führt live von der Ausgangs- zur Zieleinheit: „· 10⁶“ = 10^(Hochzahl vorher − Hochzahl nachher).
// Schrift immer ≥ 14 px: Passen nicht alle elf Spalten nebeneinander (Handy), zeigt die Skala nur den Weg mit je einem Nachbarn;
// passt auch der nicht (oder soll die ganze Skala zu sehen sein, `full`), steht sie senkrecht (oben Giga, unten Nano).

import { useRef, type CSSProperties } from "react";
import { useWidth } from "@lern/ui";
import { DIV } from "../format.tsx";
import { ATOM, PREFIXES, prefixStep, unitAt, supExp, mul, pow10, fmt, fmtSci, toNumber, type Q } from "@lern/units";
import { tr } from "@lern/i18n";

const Pow = ({ k }: { k: number }) => <>10<sup>{k < 0 ? `−${-k}` : k}</sup></>;
const paren = (k: number) => (k < 0 ? `(−${-k})` : String(k));
/** kleinste Spaltenbreite, in der „10⁻³“ und „dam“ in 14 px Platz haben */
const MIN_COL = 40;
/** Zeilenhöhe der senkrechten Skala */
const ROW = 32;

export function PowerScale({ from, to, value, showResult = true, showFactor = true, full = false }: {
  from: string; to: string; value?: Q | null; showResult?: boolean; showFactor?: boolean;
  /** immer alle Vorsilben zeigen (Erklärung: Überblick n … G) – am Handy dann senkrecht */
  full?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box);
  const st = prefixStep(from, to);
  if (!st) return null;
  const { base, power } = st.from;
  const n = PREFIXES.length;
  const iF = PREFIXES.indexOf(st.from.prefix), iT = PREFIXES.indexOf(st.to.prefix);
  // sichtbare Vorsilben: alle, wenn sie nebeneinander passen, sonst der Weg mit je einem Nachbarn
  let first = 0, last = n - 1;
  if (!full && width > 0 && width / n < MIN_COL) { first = Math.max(0, Math.min(iF, iT) - 1); last = Math.min(n - 1, Math.max(iF, iT) + 1); }
  const shown = PREFIXES.slice(first, last + 1);
  const vertical = width > 0 && width / shown.length < MIN_COL;
  const res = value ? mul(value, pow10(st.exp)) : null;
  const big = res ? Math.abs(toNumber(res)) : 0;
  const cell = (p: (typeof PREFIXES)[number]) => {
    const u = unitAt(p, base, power), i = PREFIXES.indexOf(p);
    return { u, known: !!ATOM[u.replace(/[²³]$/, "")] || !!ATOM[u], role: i === iF ? " from" : i === iT ? " to" : "" };
  };

  let scale;
  if (vertical) {
    // senkrecht: große Vorsilben oben; Bogen rechts daneben
    const rows = [...shown].reverse();
    const y = (i: number) => (rows.indexOf(PREFIXES[i]) + 0.5) * ROW;
    const y1 = y(iF), y2 = y(iT), H = rows.length * ROW;
    const reach = 18 + Math.min(34, Math.abs(y2 - y1) / 6);
    scale = (
      <div className="ps-v">
        <div className="ps-vgrid" style={{ gridTemplateRows: `repeat(${rows.length}, ${ROW}px)` }} role="table" aria-label={tr("Vorsilben und Zehnerpotenzen", "Prefixes and powers of ten")}>
          {rows.map(p => {
            const c = cell(p);
            return (
              <div key={p.exp} className={`ps-row${c.role}${p.exp === 0 ? " base" : ""}`} role="row">
                <span className="ps-pow" role="cell"><Pow k={p.exp} /></span>
                <span className={`ps-sym${c.known ? "" : " rare"}`} role="cell">{c.u}</span>
                <span className="ps-name" role="cell">{p.name || "–"}</span>
              </div>
            );
          })}
        </div>
        <svg className="ps-varc" viewBox={`0 0 84 ${H}`} width={84} height={H} aria-hidden="true">
          {st.diff !== 0 && <>
            <path key={`${from}>${to}`} d={`M2 ${y1} C${reach + 10} ${y1} ${reach + 10} ${y2} 8 ${y2}`} pathLength={1} className="ps-path" />
            <polygon points={`2,${y2} 13,${y2 - 6} 13,${y2 + 6}`} className="ps-head" />
            {showFactor && <text x={reach + 14} y={(y1 + y2) / 2} dy=".35em" className="ps-vlab">· 10{supExp(st.exp)}</text>}
          </>}
        </svg>
      </div>
    );
  } else {
    const cw = width / shown.length;
    const names = cw >= 54;
    const cx = (i: number) => (i - first + 0.5) * cw;
    const span = Math.abs(iT - iF);
    const depth = 22 + Math.min(40, span * 6);
    const H = depth + 30;
    const x1 = cx(iF), x2 = cx(iT), mid = (x1 + x2) / 2;
    scale = (
      <>
        <div className="ps-grid" style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }} role="table" aria-label={tr("Vorsilben und Zehnerpotenzen", "Prefixes and powers of ten")}>
          {shown.map(p => {
            const c = cell(p);
            return (
              <div key={p.exp} className={`ps-col${c.role}${p.exp === 0 ? " base" : ""}`} role="cell">
                {names && <span className="ps-name">{p.name || "–"}</span>}
                <span className="ps-pow"><Pow k={p.exp} /></span>
                <span className={`ps-sym${c.known ? "" : " rare"}`} style={{ "--len": [...c.u].length } as CSSProperties}>{c.u}</span>
              </div>
            );
          })}
        </div>
        {st.diff !== 0 && width > 0 && (
          <svg className="ps-arc" viewBox={`0 0 ${width} ${H}`} width={width} height={H} aria-hidden="true">
            <path key={`${from}>${to}`} d={`M${x1} 2 C${x1} ${depth + 8} ${x2} ${depth + 8} ${x2} 6`} pathLength={1} className="ps-path" />
            <polygon points={`${x2},2 ${x2 - 6},13 ${x2 + 6},13`} className="ps-head" />
            {showFactor && (
              <g className="ps-lab">
                <rect x={mid - (22 + String(st.exp).length * 5)} y={depth - 6} width={44 + String(st.exp).length * 10} height={24} rx={3} />
                <text x={mid} y={depth + 6} dy=".35em">· 10{supExp(st.exp)}</text>
              </g>
            )}
          </svg>
        )}
      </>
    );
  }

  return (
    <figure className={`viz ps${vertical ? " vertical" : ""}`} ref={box}>
      {scale}
      <figcaption className="ps-cap">
        {st.alias.length > 0 && <div><b>{st.alias.join(", ")}</b></div>}
        {st.diff === 0 ? <div>· 1</div> : showFactor ? (
          <>
            <div>
              <b>{unitAt(st.from.prefix, base, 1)}</b> → <b>{unitAt(st.to.prefix, base, 1)}</b>: <Pow k={st.from.prefix.exp} /> {DIV} <Pow k={st.to.prefix.exp} /> = 10<sup>{st.from.prefix.exp} − {paren(st.to.prefix.exp)}</sup> = <b className="fx"><Pow k={st.diff} /></b>
            </div>
            {power > 1 && <div>{base}{power === 2 ? "²" : "³"}: (<Pow k={st.diff} />)<sup>{power}</sup> = <b className="fx"><Pow k={st.exp} /></b></div>}
            {showResult && value && res && (
              <div className="ps-res">
                {fmt(value).text} {from} = {fmt(value).text} · <Pow k={st.exp} /> {to} = <b>{big >= 1e6 || (big < 1e-3 && big > 0) ? fmtSci(res) : fmt(res).text} {to}</b>
                {(big >= 1e6 || (big < 1e-3 && big > 0)) && <span className="muted"> = {fmt(res).text} {to}</span>}
              </div>
            )}
          </>
        ) : null}
      </figcaption>
    </figure>
  );
}
