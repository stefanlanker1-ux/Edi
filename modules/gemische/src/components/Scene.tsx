// Szene für „Probieren“: links (bzw. oben) das Gefäß, wie man es sieht, rechts (bzw. unten) die Lupe mit dem Teilchenbild.
// Beide zeigen denselben Zustand: Zuckerwürfel wird kleiner, während sich Zuckerteilchen lösen; jedes Öltröpfchen im Glas
// ist ein Öl-Teilchen der Lupe; Trennwände stehen in beiden Bildern. Anordnung nebeneinander oder übereinander –
// je nachdem, wo die Teilchen größer werden.

import { useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { KalotteShades, kalotteElements } from "@lern/chem-ui";
import { separated, type Sim } from "../mixing.ts";
import type { Example } from "../mixtures.ts";
import { ParticleView, frameSize } from "./Beaker.tsx";

type Box = { w: number; h: number };
type Lens = { x: number; y: number; r: number };

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Gefäß, wie man es sieht (Koordinaten 0 … w, 0 … h); liefert die Lage der Lupe */
function Macro({ sim, ex, w, h }: { sim: Sim; ex: Example; w: number; h: number }): { art: ReactNode; lens: Lens } {
  const g = sim.grid;
  const row = (cell: number) => Math.floor(cell / g.cols), col = (cell: number) => cell % g.cols;

  if (sim.state === "fest") {
    const y0 = h * .5, y1 = h * .78, table = <line className="gm-m-table" x1={w * .04} x2={w * .96} y1={y1} y2={y1} />;
    if (sim.melt > 0) {
      // geschmolzen im Tiegel
      return {
        art: <>{table}<path className="gm-m-crucible" d={`M${w * .2} ${h * .44}L${w * .28} ${y1}H${w * .72}L${w * .8} ${h * .44}`} />
          <path className="gm-m-melt" d={`M${w * .235} ${h * .56}L${w * .285} ${y1 - 2}H${w * .715}L${w * .765} ${h * .56}Z`} /></>,
        lens: { x: w * .5, y: h * .66, r: w * .17 },
      };
    }
    if (sim.walls.length) {
      // vorher: die Metalle als eigene Stücke
      const [[f1, n1], [f2, n2]] = ex.items, a = w * .08, b = w * .92, gap = w * .06, split = a + (b - a - gap) * n1 / (n1 + n2);
      return {
        art: <>{table}<rect className={`gm-m-metal m-${f1}`} x={a} y={y0} width={split - a} height={y1 - y0} rx={2} />
          <rect className={`gm-m-metal m-${f2}`} x={split + gap} y={y0} width={b - split - gap} height={y1 - y0} rx={2} /></>,
        lens: { x: split + gap / 2, y: (y0 + y1) / 2, r: w * .17 },
      };
    }
    return {
      art: <>{table}<rect className="gm-m-metal m-alloy" x={w * .1} y={y0} width={w * .8} height={y1 - y0} rx={2} /></>,
      lens: { x: w * .5, y: (y0 + y1) / 2, r: w * .17 },
    };
  }

  if (sim.state === "gas") {
    const dividers = (x0: number, x1: number, y0: number, y1: number) =>
      sim.walls.map(wl => { const x = x0 + (x1 - x0) * wl / g.cols; return <line key={wl} className="gm-m-divider" x1={x} x2={x} y1={y0} y2={y1} />; });
    if (ex.id === "helium") {
      // Luftballon
      const cx = w * .5, cy = h * .36, rx = w * .36, ry = h * .27;
      return {
        art: <>
          <ellipse className="gm-m-balloon" cx={cx} cy={cy} rx={rx} ry={ry} />
          <path className="gm-m-balloon" d={`M${cx - 3} ${cy + ry + 3}l3 -4l3 4z`} />
          <path className="gm-m-string" d={`M${cx} ${cy + ry + 3}q-6 ${h * .12} 0 ${h * .2}t0 ${h * .16}`} />
        </>,
        lens: { x: cx, y: cy, r: w * .2 },
      };
    }
    if (ex.id === "schutzgas") {
      // Gasflasche
      const x0 = w * .26, x1 = w * .74, y0 = h * .2, y1 = h * .95;
      return {
        art: <>
          <path className="gm-m-bottle" d={`M${x0} ${y1}V${y0 + 12}q0 -10 ${(x1 - x0) / 2} -10q${(x1 - x0) / 2} 0 ${(x1 - x0) / 2} 10V${y1}z`} />
          <rect className="gm-m-valve" x={w * .44} y={y0 - 9} width={w * .12} height={8} rx={1} />
          <line className="gm-m-valve" x1={w * .36} x2={w * .64} y1={y0 - 11} y2={y0 - 11} />
          {dividers(x0, x1, y0 + 6, y1)}
        </>,
        lens: { x: w * .5, y: h * .58, r: w * .19 },
      };
    }
    // geschlossener Glaszylinder mit Stopfen
    const x0 = w * .2, x1 = w * .8, y0 = h * .16, y1 = h * .95;
    return {
      art: <>
        <path className="gm-m-glass" d={`M${x0} ${y0}V${y1 - 3}q0 3 3 3H${x1 - 3}q3 0 3 -3V${y0}`} />
        <rect className="gm-m-stopper" x={w * .26} y={y0 - 8} width={w * .48} height={10} rx={2} />
        {dividers(x0, x1, y0 + 2, y1)}
      </>,
      lens: { x: w * .5, y: h * .56, r: w * .2 },
    };
  }

  // ── Flüssigkeit: Becherglas oder geschlossene Flasche (Sprudel) ──
  const bottle = ex.before === "gasraum";
  const x0 = w * (bottle ? .24 : .16), x1 = w * (bottle ? .76 : .84), yb = h * .95;
  const level = h * (bottle ? .42 : .34);
  const vessel = bottle
    ? <path className="gm-m-glass" d={`M${w * .42} ${h * .12}V${h * .22}Q${x0} ${h * .26} ${x0} ${h * .36}V${yb - 3}q0 3 3 3H${x1 - 3}q3 0 3 -3V${h * .36}Q${x1} ${h * .26} ${w * .58} ${h * .22}V${h * .12}`} />
    : <path className="gm-m-glass" d={`M${x0 - 3} ${h * .1}L${x0} ${h * .13}V${yb - 3}q0 3 3 3H${x1 - 3}q3 0 3 -3V${h * .13}L${x1 + 3} ${h * .1}`} />;
  const cap = bottle ? <rect className="gm-m-stopper" x={w * .39} y={h * .06} width={w * .22} height={h * .06} rx={1.5} /> : null;
  const marks = bottle ? null : [.45, .6, .75].map(f => <line key={f} className="gm-m-mark" x1={x0} x2={x0 + 5} y1={h * f} y2={h * f} />);
  const liquid = <rect className="gm-m-liquid" x={x0 + .6} y={level} width={x1 - x0 - 1.2} height={yb - level - .6} rx={2} />;
  const surface = <line className="gm-m-surface" x1={x0 + .6} x2={x1 - .6} y1={level} y2={level} />;
  const lens: Lens = { x: (x0 + x1) / 2, y: level + (yb - level) * .12, r: w * .19 };
  const extra: ReactNode[] = [];
  const liq = sim.ps.filter(p => !p.gas);
  const liquidRows = Math.max(1, g.rows - g.top);
  const toX = (c: number) => x0 + 4 + (x1 - x0 - 8) * (c + .5) / g.cols;
  const toY = (r: number, from = level) => from + 3 + (yb - from - 6) * Math.max(0, r - g.top + .5) / liquidRows;

  if (sim.floats.length) {
    // Öl: Schicht oben (so viel, wie schon oben ist), der Rest als Tröpfchen – eines je Öl-Teilchen
    const oil = liq.filter(p => sim.floats.includes(p.f)), water = liq.filter(p => !sim.floats.includes(p.f));
    const minWater = Math.min(...water.map(p => row(p.cell)));
    const sep = separated(sim.ps, g, sim.floats);
    const layer = sep ? oil : oil.filter(p => row(p.cell) < minWater);
    const layerH = (yb - level) * layer.length / liq.length;
    if (layer.length) extra.push(<rect key="oil" className="gm-m-oil" x={x0 + .6} y={level} width={x1 - x0 - 1.2} height={layerH} />);
    if (layer.length) extra.push(<line key="oil-line" className="gm-m-phase" x1={x0 + .6} x2={x1 - .6} y1={level + layerH} y2={level + layerH} />);
    const drops = sep ? [] : oil.filter(p => !layer.includes(p));
    if (drops.length) extra.push(<rect key="trueb" className="gm-m-cloudy" x={x0 + .6} y={level + layerH} width={x1 - x0 - 1.2} height={yb - level - layerH - .6} />);
    drops.forEach(p => extra.push(<circle key={p.id} className="gm-m-drop" cx={toX(col(p.cell)) + p.jx * 2} cy={toY(row(p.cell), level + layerH)} r={2.4} />));
  }
  if (ex.before === "kristall") {
    // Zuckerwürfel: wird kleiner, je mehr Teilchen sich gelöst haben
    const k = sim.ps.filter(p => p.bound).length, all = sim.ps.filter(p => p.f === ex.solute).length;
    if (k) {
      const side = (x1 - x0) * .36 * Math.sqrt(k / all);
      extra.push(<rect key="cube" className="gm-m-cube" x={(x0 + x1) / 2 - side / 2} y={yb - side - .6} width={side} height={side} rx={.8} />);
    }
  }
  if (ex.before === "schicht" && ex.solute) {
    // Schlieren an der Grenze, solange die Schicht noch nicht durchmischt ist
    const ys = mean(liq.filter(p => p.f === ex.solute).map(p => row(p.cell))), yo = mean(liq.filter(p => p.f !== ex.solute).map(p => row(p.cell)));
    const seg = Math.max(0, Math.min(1, (yo - ys) / (liquidRows / 2.2)));
    if (seg > .15) {
      const share = liq.filter(p => p.f === ex.solute).length / liq.length, y = level + (yb - level) * share;
      extra.push(<path key="schliere" className="gm-m-schliere" style={{ opacity: seg }}
        d={`M${x0 + 1} ${y}q${(x1 - x0) / 8} -3 ${(x1 - x0) / 4} 0t${(x1 - x0) / 4} 0t${(x1 - x0) / 4} 0t${(x1 - x0) / 4 - 2} 0`} />);
    }
  }
  return {
    art: <>{liquid}{extra}{surface}{vessel}{cap}{marks}</>,
    lens,
  };
}

function useBox(ref: RefObject<HTMLDivElement | null>): Box {
  const [box, setBox] = useState<Box>({ w: 360, h: 360 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setBox({ w: el.clientWidth || 360, h: el.clientHeight || 360 });
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return box;
}

export function Scene({ sim, ex, onPick, shaking, label }: { sim: Sim; ex: Example; onPick?: (f: string) => void; shaking?: boolean; label: string }) {
  const gid = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const box = useBox(ref);
  const { w: fw, h: fh } = frameSize(sim);
  const M = 6; // Rand
  const withMacro = sim.state !== "modell";
  // nebeneinander: Gefäß so hoch wie das Teilchenbild; übereinander: Gefäß kleiner darüber
  const side = { mw: fh * .56, mh: fh, gap: fh * .2 };
  const stack = { mw: fh * .44, mh: fh * .5, gap: fh * .14 };
  const sideSize = { w: side.mw + side.gap + fw + 2 * M, h: fh + 2 * M + 4 };
  const stackSize = { w: fw + 2 * M, h: stack.mh + stack.gap + fh + 2 * M + 4 };
  const fit = (s: { w: number; h: number }) => Math.min(box.w / s.w, box.h / s.h);
  const horizontal = !withMacro || fit(sideSize) >= fit(stackSize);
  const L = horizontal ? side : stack;
  // Lage von Gefäß (m) und Teilchenbild (f)
  const mx = horizontal ? M : M + (fw - L.mw) / 2, my = horizontal ? M + 4 + (fh - L.mh) / 2 : M;
  const fx = withMacro && horizontal ? M + L.mw + L.gap : M, fy = withMacro && !horizontal ? M + L.mh + L.gap : M + 4;
  const size = withMacro ? (horizontal ? sideSize : stackSize) : { w: fw + 2 * M, h: fh + 2 * M + 4 };
  const macro = withMacro ? Macro({ sim, ex, w: L.mw, h: L.mh }) : null;
  const lens = macro && { x: mx + macro.lens.x, y: my + macro.lens.y, r: macro.lens.r };
  // Linien von der Lupe zu den Ecken des Teilchenbilds
  const rays = lens && (horizontal
    ? [[lens.x + lens.r * .5, lens.y - lens.r * .87, fx - 2, fy - 3], [lens.x + lens.r * .5, lens.y + lens.r * .87, fx - 2, fy + fh + 1]]
    : [[lens.x - lens.r * .87, lens.y + lens.r * .5, fx - 1, fy - 3], [lens.x + lens.r * .87, lens.y + lens.r * .5, fx + fw + 1, fy - 3]]);
  return (
    <div className="gm-scene" ref={ref}>
      <svg className={`gm-svg${shaking ? " shaking" : ""}`} viewBox={`0 0 ${size.w} ${size.h}`} role="img" aria-label={label}>
        <KalotteShades gid={gid} els={kalotteElements([...new Set(sim.ps.map(p => p.f))])} />
        {macro && lens && rays && <>
          <g transform={`translate(${mx} ${my})`} aria-hidden="true"><g className="gm-macro">{macro.art}</g></g>
          <g className="gm-zoom" aria-hidden="true">
            {rays.map(([a, b, c, d], i) => <line key={i} x1={a} y1={b} x2={c} y2={d} />)}
            <circle cx={lens.x} cy={lens.y} r={lens.r} />
          </g>
        </>}
        <g transform={`translate(${fx} ${fy})`}>
          <g className="gm-all"><ParticleView sim={sim} gid={gid} onPick={onPick} /></g>
        </g>
      </svg>
    </div>
  );
}
