// Vorsilben-Skala (Oberstufe): n µ m c d – da h k M G mit 10⁻⁹ … 10⁹.
// Ein Bogenpfeil führt live von der Ausgangs- zur Zieleinheit: „· 10⁶“ = 10^(Hochzahl vorher − Hochzahl nachher).

import { useRef, type CSSProperties } from "react";
import { useWidth } from "@lern/ui";
import { ATOM, PREFIXES, prefixStep, unitAt, supExp, mul, pow10, fmt, fmtSci, toNumber, type Q } from "@lern/units";

const Pow = ({ k }: { k: number }) => <>10<sup>{k < 0 ? `−${-k}` : k}</sup></>;
const paren = (k: number) => (k < 0 ? `(−${-k})` : String(k));

export function PowerScale({ from, to, value, showResult = true, showFactor = true }: {
  from: string; to: string; value?: Q | null; showResult?: boolean; showFactor?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box);
  const st = prefixStep(from, to);
  if (!st) return null;
  const { base, power } = st.from;
  const n = PREFIXES.length;
  const cw = width / n;
  const iF = PREFIXES.indexOf(st.from.prefix), iT = PREFIXES.indexOf(st.to.prefix);
  const cx = (i: number) => (i + 0.5) * cw;
  const span = Math.abs(iT - iF);
  const depth = 22 + Math.min(40, span * 6);
  const H = depth + 30;
  const x1 = cx(iF), x2 = cx(iT);
  const mid = (x1 + x2) / 2;
  const d = `M${x1} 2 C${x1} ${depth + 8} ${x2} ${depth + 8} ${x2} 6`;
  const res = value ? mul(value, pow10(st.exp)) : null;
  const big = res ? Math.abs(toNumber(res)) : 0;
  const names = cw >= 54;

  return (
    <figure className="viz ps" ref={box}>
      <div className={`ps-grid${names ? "" : " tight"}`} style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} role="table" aria-label="Vorsilben und Zehnerpotenzen">
        {PREFIXES.map((p, i) => {
          const u = unitAt(p, base, power);
          const known = !!ATOM[u.replace(/[²³]$/, "")] || !!ATOM[u];
          const role = i === iF ? " from" : i === iT ? " to" : "";
          return (
            <div key={p.exp} className={`ps-col${role}${p.exp === 0 ? " base" : ""}`} role="cell">
              {names && <span className="ps-name">{p.name || "–"}</span>}
              <span className="ps-pow" style={{ "--plen": 1.3 + 0.5 * String(p.exp).length } as CSSProperties}><Pow k={p.exp} /></span>
              <span className={`ps-sym${known ? "" : " rare"}`} style={{ "--len": [...u].reduce((s, c) => s + (/[MWmw]/.test(c) ? 1.3 : /[il]/.test(c) ? .5 : 1), 0) } as CSSProperties}>{u}</span>
            </div>
          );
        })}
      </div>
      {st.diff !== 0 && (
        <svg className="ps-arc" viewBox={`0 0 ${width} ${H}`} width={width} height={H} aria-hidden="true">
          <path key={`${from}>${to}`} d={d} pathLength={1} className="ps-path" />
          <polygon points={`${x2},2 ${x2 - 6},13 ${x2 + 6},13`} className="ps-head" />
          {showFactor && (
            <g className="ps-lab">
              <rect x={mid - (22 + String(st.exp).length * 5)} y={depth - 6} width={44 + String(st.exp).length * 10} height={24} rx={3} />
              <text x={mid} y={depth + 6} dy=".35em">· 10{supExp(st.exp)}</text>
            </g>
          )}
        </svg>
      )}
      <figcaption className="ps-cap">
        {st.alias.length > 0 && <div><b>{st.alias.join(", ")}</b></div>}
        {st.diff === 0 ? <div>· 1</div> : showFactor ? (
          <>
            <div>
              <b>{unitAt(st.from.prefix, base, 1)}</b> → <b>{unitAt(st.to.prefix, base, 1)}</b>: <Pow k={st.from.prefix.exp} /> : <Pow k={st.to.prefix.exp} /> = 10<sup>{st.from.prefix.exp} − {paren(st.to.prefix.exp)}</sup> = <b className="fx"><Pow k={st.diff} /></b>
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
