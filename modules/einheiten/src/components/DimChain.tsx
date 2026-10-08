// Pfeilkette für Flächen und Volumen: oben die Längen (je · 10), darunter die Flächen- bzw. Volumeneinheiten.
// Jede Stufe der Fläche ist eine Längen-Stufe in beide Richtungen (· 10 · 10 = · 100), beim Volumen in drei (· 10 · 10 · 10 = · 1000).
// Der Weg der Aufgabe leuchtet; die Umrechnungszahl insgesamt und das Ergebnis stehen nicht da.

import { useRef } from "react";
import { useWidth } from "@lern/ui";
import { DIV } from "../format.tsx";
import { tr } from "@lern/i18n";

const AREA = ["km²", "ha", "a", "m²", "dm²", "cm²", "mm²"];
const AREA_LEN = ["km", "100 m", "10 m", "m", "dm", "cm", "mm"];
const VOL = ["m³", "dm³", "cm³", "mm³"];
const VOL_LEN = ["m", "dm", "cm", "mm"];
const LITER: Record<string, string> = { l: "dm³", ml: "cm³", "µl": "mm³" };
const LITER_OF: Record<string, string> = { "dm³": "l", "cm³": "ml", "mm³": "µl" };

/** Hochzahl der Einheit (2 = Fläche, 3 = Volumen), sonst null. Volumen nur, wenn eine Einheit ein Längen³-Maß ist –
 *  l ↔ ml bleibt auf der Hohlmaß-Kette hl → l → dl → cl → ml (Volumen kommt erst in Niveau 4). */
export function dimOf(from: string, to: string): 2 | 3 | null {
  if (AREA.includes(from) && AREA.includes(to)) return 2;
  if (!VOL.includes(from) && !VOL.includes(to)) return null;
  const f = LITER[from] ?? from, t = LITER[to] ?? to;
  if (VOL.includes(f) && VOL.includes(t) && f !== t) return 3;
  return null;
}

export function DimChain({ from, to }: { from: string; to: string }) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box);
  const p = dimOf(from, to);
  if (!p) return null;
  const units = p === 2 ? AREA : VOL, lens = p === 2 ? AREA_LEN : VOL_LEN;
  const f = LITER[from] ?? from, t = LITER[to] ?? to;
  const i0 = units.indexOf(f), i1 = units.indexOf(t);
  let lo = Math.min(i0, i1), hi = Math.max(i0, i1);
  // Platz: je Spalte mind. 70 px – sonst nur den Weg und je einen Nachbarn
  let first = 0, last = units.length - 1;
  if (units.length * 70 > width) {
    first = Math.max(0, lo - 1); last = Math.min(units.length - 1, hi + 1);
    while (last - first + 1 > 2 && (last - first + 1) * 70 > width) { if (first < lo) first++; else if (last > hi) last--; else break; }
  }
  const cols = units.slice(first, last + 1), lcols = lens.slice(first, last + 1);
  lo -= first; hi -= first;
  const down = i1 > i0;
  const n = cols.length;
  const W = Math.min(110, Math.max(64, width / n));
  const x = (i: number) => W / 2 + i * W;
  const yL = 16, yU = 74, H = 152; // H: Platz für „10 · 10“ unter dem Bogen (14 px)
  const step = p === 2 ? "100" : "1000";
  const parts = p === 2 ? "10 · 10" : "10 · 10 · 10";
  const on = (i: number) => i >= lo && i < hi;
  return (
    <figure className="viz ac dc" ref={box}>
      <svg viewBox={`0 0 ${W * n} ${H}`} width={W * n} height={H} role="img"
        aria-label={tr(`${p === 2 ? "Flächen" : "Volumen"}: jede Stufe ${down ? "mal" : "geteilt durch"} ${parts}`, `${p === 2 ? "Area" : "Volume"}: each step ${down ? "times" : "divided by"} ${parts}`)}>
        {lcols.map((u, i) => (
          <g key={`l${i}`} className={`dc-len${i >= lo && i <= hi ? " path" : ""}`}>
            <text x={x(i)} y={yL} dy=".35em">{u}</text>
            {i < n - 1 && <text x={x(i) + W / 2} y={yL + 16} dy=".35em" className="dc-lf">{down ? "·" : DIV} 10</text>}
          </g>
        ))}
        {lcols.map((_, i) => <line key={`v${i}`} x1={x(i)} x2={x(i)} y1={yL + 10} y2={yU - 18} className="dc-tie" />)}
        {cols.slice(0, -1).map((_, i) => {
          const x1 = x(i) + 22, x2 = x(i + 1) - 22;
          const [sx, ex] = down ? [x1, x2] : [x2, x1];
          const y0 = yU + 16, yc = yU + 38;
          return (
            <g key={`a${i}`} className={`ac-arrow${on(i) ? " on" : ""}`}>
              <path d={`M${sx} ${y0} Q${(sx + ex) / 2} ${yc} ${ex} ${y0}`} pathLength={1} />
              <polygon points={down ? `${ex},${y0} ${ex - 8},${y0 + 1} ${ex - 3},${y0 + 7}` : `${ex},${y0} ${ex + 8},${y0 + 1} ${ex + 3},${y0 + 7}`} />
              <text x={x(i) + W / 2} y={yc + 4} dy=".9em" className="ac-fac">{down ? "·" : DIV} {step}</text>
              {on(i) && <text x={x(i) + W / 2} y={yc + 22} dy=".9em" className="dc-parts">{parts}</text>}
            </g>
          );
        })}
        {cols.map((u, i) => {
          const role = i === i0 - first ? " from" : i === i1 - first ? " to" : i > lo && i < hi ? " path" : "";
          const lab = p === 3 && LITER_OF[u] && (from === LITER_OF[u] || to === LITER_OF[u]) ? `${u} = ${LITER_OF[u]}` : u;
          const w = Math.min(W - 6, 18 + lab.length * 9);
          return (
            <g key={u} className={`ac-unit${role}`}>
              <rect x={x(i) - w / 2} y={yU - 15} width={w} height={30} rx={3} />
              <text x={x(i)} y={yU} dy=".35em">{lab}</text>
            </g>
          );
        })}
      </svg>
      <figcaption>{p === 2 ? tr("Fläche = Länge · Länge: jede Stufe zweimal · 10", "Area = length · length: each step · 10 twice") : tr("Volumen = Länge · Länge · Länge: jede Stufe dreimal · 10", "Volume = length · length · length: each step · 10 three times")}</figcaption>
    </figure>
  );
}
