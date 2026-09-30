// Teilchenbild: links Kasten mit den Ausgangsstoffen, Pfeil, rechts Kasten mit den Produkten
// (bei hohem, schmalem Platz – Handy hochkant – übereinander mit Pfeil nach unten).
// Jeder Stoff steht als eigener Stapel – so viele Moleküle, wie der Koeffizient sagt. Kalottenmodell aus echter 3D-Geometrie
// (@lern/chem-ui Kalotte): Kugeln nach Tiefe sortiert und dezent schattiert, Farben aus der gemeinsamen Palette.

import { useId, useLayoutEffect, useRef, useState } from "react";
import { isMolecular, type Equation } from "@lern/chem";
import { Kalotte, KalotteShades, kalotteBox, kalotteElements } from "@lern/chem-ui";

/** Teilchenbild nur, wenn alle Stoffe der Gleichung Moleküle sind */
export const hasModel = (eq: Equation) => [...eq.left, ...eq.right].every(isMolecular);

const PAD = .8, GAP = .45;

/**
 * Beide Kästen mit Pfeil. Jeder Stoff steht als Stapel, bei vielen Molekülen in mehreren Spalten.
 * Die Kästen passen sich dem Inhalt an (wenige Moleküle → groß dargestellt).
 */
export function MoleculeScene({ eq, coeffs, rows = 2, state }: {
  eq: Equation; coeffs: number[]; rows?: number;
  /** nach „Prüfen“: Rahmen grün (✓) bzw. gestrichelt rot */
  state?: "ok" | "bad";
}) {
  const n = eq.left.length, gid = useId().replace(/:/g, "");
  const all = [...eq.left, ...eq.right], boxes = all.map(kalotteBox);
  const R = Math.max(rows, Math.ceil(Math.sqrt(1.5 * Math.max(...coeffs))));
  const cols = all.map((_, k) => Math.max(1, Math.ceil(coeffs[k] / R)));
  const colW = all.map((_, k) => boxes[k].w + GAP);
  const sideW = (from: number, to: number) => colW.slice(from, to).reduce((a, w, i) => a + w * cols[from + i], 0);
  const W = Math.max(sideW(0, n), sideW(n, all.length)) + 2 * PAD;
  const rowH = Math.max(...boxes.map(b => b.h)) + GAP;
  const H = R * rowH + 2 * PAD;
  const AR = 3.2; // Platz für den Pfeil
  // Hoch- oder Querformat: je nachdem, was im verfügbaren Platz größer wird (Handy hochkant → Kästen übereinander)
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<[number, number] | null>(null);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize([el.clientWidth, el.clientHeight]));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const across = !size || Math.min(size[0] / (2 * W + AR), size[1] / H) >= Math.min(size[0] / W, size[1] / (2 * H + AR)) * .92;
  const [ox, oy] = across ? [W + AR, 0] : [0, H + AR];
  const side = (from: number, to: number, x0: number, y0: number) => {
    let x = x0 + (W - sideW(from, to)) / 2;
    return all.slice(from, to).map((f, i) => {
      const k = from + i, p = Math.max(1, Math.ceil(coeffs[k] / R)), left = x + colW[k] * (cols[k] - p) / 2;
      x += colW[k] * cols[k];
      return Array.from({ length: coeffs[k] }, (_, j) => (
        <Kalotte key={`${k}-${j}`} f={f} gid={gid} cx={left + colW[k] * (j % p + .5)} cy={y0 + H - PAD - rowH * (Math.floor(j / p) + .5)} />
      ));
    });
  };
  const frame = (x: number, y: number) => <rect className={`ms-box${state ? ` ${state}` : ""}`} x={x + .1} y={y + .1} width={W - .2} height={H - .2} rx={.25} />;
  const arrow = across
    ? `M${W + .5} ${H / 2 - .35}h${AR - 1.9}v-.55l1.1 .9-1.1 .9v-.55h-${AR - 1.9}z`
    : `M${W / 2 - .35} ${H + .5}v${AR - 1.9}h-.55l.9 1.1 .9-1.1h-.55v-${AR - 1.9}z`;
  return (
    <div className="ms-wrap" ref={wrap}>
      <svg className="ms" viewBox={across ? `0 0 ${2 * W + AR} ${H}` : `0 0 ${W} ${2 * H + AR}`} role="img" preserveAspectRatio="xMidYMid meet"
        aria-label={`Links ${eq.left.map((f, k) => `${coeffs[k]} × ${f}`).join(", ")}; rechts ${eq.right.map((f, k) => `${coeffs[n + k]} × ${f}`).join(", ")}`}>
        <KalotteShades gid={gid} els={kalotteElements(all)} />
        {frame(0, 0)}
        {frame(ox, oy)}
        {side(0, n, 0, 0)}
        {side(n, all.length, ox, oy)}
        <path className="ms-arrow" d={arrow} />
      </svg>
    </div>
  );
}
