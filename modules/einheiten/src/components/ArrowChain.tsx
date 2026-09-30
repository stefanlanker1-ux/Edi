// Pfeilkette (Unterstufe) wie im Heft:  km ⇄ m ⇄ dm ⇄ cm ⇄ mm
//   unten Pfeile nach rechts „· 1000 · 10 …“ (große → kleine Einheit), oben nach links „: 1000 : 10 …“.
// Der Weg der aktuellen Umrechnung leuchtet live mit; unter jeder Einheit steht die Zahl in dieser Einheit.

import { Fragment, useRef } from "react";
import { useWidth } from "@lern/ui";
import { ATOM, chainFor, div, mul, unitSi, fmt, q, type Q } from "@lern/units";
import { numText } from "../format.tsx";

const nf = (v: Q) => fmt(v).text;
/** „dm³ = l“: Hohlmaß als zweiter Name */
const LITER_OF: Record<string, string> = { "dm³": "l", "cm³": "ml", "mm³": "µl" };

export function ArrowChain({ from, to, value, os = false, showValues = true, caption = true }: {
  from: string; to: string; value?: Q | null; os?: boolean; showValues?: boolean; caption?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box);
  const ch = chainFor(from, to);
  if (!ch) return null;
  // Oberstufen-Einheiten (µm, ms …) nur zeigen, wenn gebraucht
  let units = ch.units.filter(u => os || !ATOM[u]?.os || u === ch.from || u === ch.to);
  const i0 = units.indexOf(ch.from), i1 = units.indexOf(ch.to);
  let lo = Math.min(i0, i1), hi = Math.max(i0, i1);
  // Platz: pro Einheit mind. 66 px – sonst nur den Weg (± 1 Nachbar) zeigen
  const need = (n: number) => n * 66;
  let first = 0, last = units.length - 1;
  if (need(units.length) > width) {
    first = Math.max(0, lo - 1); last = Math.min(units.length - 1, hi + 1);
    while (last - first + 1 > 3 && need(last - first + 1) > width) {
      if (first < lo) first++; else if (last > hi) last--; else break;
    }
  }
  units = units.slice(first, last + 1);
  lo -= first; hi -= first;
  const a = i0 - first, b = i1 - first;
  const down = b > a; // große → kleine Einheit: mal
  const n = units.length;
  const W = Math.min(110, Math.max(62, width / n));
  const Wt = W * n;
  const x = (i: number) => W / 2 + i * W;
  const fac = (i: number) => div(unitSi(units[i]), unitSi(units[i + 1]));
  const vb = !!(showValues && value);
  const valueIn = (u: string) => (value ? mul(value, div(unitSi(ch.from), unitSi(u))) : null);
  // Zahlen unter den Einheiten dürfen sich nie überlappen: zu lange versetzt in zwei Zeilen, passt es auch so nicht, weglassen (Ergebnis steht ohnehin darüber)
  const vals = units.map((u, i) => (vb && i >= lo && i <= hi ? valueIn(u) : null));
  const textW = (v: Q) => [...fmt(v).text].reduce((s, c) => s + (/[\d]/.test(c) ? 8 : /[ ,.]/.test(c) ? 3.7 : 8.5), 0);
  const stag = vals.some(v => v && textW(v) > W - 6);
  const showVal = (v: Q) => textW(v) <= (stag ? 2 * W - 8 : W - 6);
  const H = vb ? (stag ? 166 : 150) : 118;
  const yU = 60; // Mitte der Einheiten
  const path = [...Array(Math.max(0, hi - lo)).keys()].map(k => fac(lo + k));
  const total = path.reduce((s, f) => mul(s, f), q(1));

  const arrow = (i: number, lower: boolean) => {
    const on = lower ? down && i >= lo && i < hi : !down && i >= lo && i < hi;
    const x1 = x(i) + 20, x2 = x(i + 1) - 20;
    const y0 = lower ? yU + 12 : yU - 14, yc = lower ? yU + 36 : yU - 40;
    const [sx, ex] = lower ? [x1, x2] : [x2, x1];
    // Pfeilspitze in Richtung der Tangente am Ende
    const tx = ex - (sx + ex) / 2, ty = y0 - yc, tl = Math.hypot(tx, ty);
    const ux = tx / tl, uy = ty / tl, s = on ? 8 : 6;
    const head = `${ex},${y0} ${ex - ux * s - uy * s * 0.6},${y0 - uy * s + ux * s * 0.6} ${ex - ux * s + uy * s * 0.6},${y0 - uy * s - ux * s * 0.6}`;
    return (
      <g key={`${lower ? "d" : "u"}${i}`} className={`ac-arrow${on ? " on" : ""}`}>
        <path d={`M${sx} ${y0} Q${(sx + ex) / 2} ${yc} ${ex} ${y0}`} pathLength={1} />
        <polygon points={head} />
        <text x={x(i) + W / 2} y={lower ? yU + 44 : yU - 44} dy={lower ? ".9em" : "-.2em"} className="ac-fac">{lower ? "·" : ":"} {nf(fac(i))}</text>
      </g>
    );
  };

  return (
    <figure className="viz ac" ref={box}>
      <svg viewBox={`0 0 ${Wt} ${H}`} width={Wt} height={H} role="img"
        aria-label={`Pfeilkette ${units.join(", ")}: ${ch.from} nach ${ch.to} ${down ? "mal" : "geteilt durch"} ${nf(total)}`}>
        {units.slice(0, -1).map((_, i) => <Fragment key={i}>{arrow(i, false)}{arrow(i, true)}</Fragment>)}
        {units.map((u, i) => {
          const role = i === a ? " from" : i === b ? " to" : i > lo && i < hi ? " path" : "";
          const lab = LITER_OF[u] && (ch.id === "vol") ? `${u} = ${LITER_OF[u]}` : u;
          const w = Math.min(W - 8, 16 + lab.length * 9);
          const v = vals[i] && showVal(vals[i]) ? vals[i] : null;
          const wide = !!v && textW(v) > W - 6;
          const vx = wide && i === 0 ? 2 : wide && i === n - 1 ? Wt - 2 : x(i);
          return (
            <g key={u} className={`ac-unit${role}`}>
              <rect x={x(i) - w / 2} y={yU - 15} width={w} height={30} rx={3} />
              <text x={x(i)} y={yU} dy=".35em">{lab}</text>
              {v && <text x={vx} y={stag && i % 2 === 0 ? H - 26 : H - 10} style={{ textAnchor: vx === 2 ? "start" : vx === Wt - 2 ? "end" : "middle" }} className="ac-val">{numText(v)}</text>}
            </g>
          );
        })}
      </svg>
      {caption && lo !== hi && (
        <figcaption>
          <b>{from} → {to}</b>
          {path.length > 1 && <> {down ? "· " : ": "}{path.map(nf).join(down ? " · " : " : ")} =</>}
          {" "}<b className="fx">{down ? "·" : ":"} {nf(total)}</b>
          {ch.notes.length > 0 && <> <span className="muted">({ch.notes.join(", ")})</span></>}
        </figcaption>
      )}
    </figure>
  );
}
