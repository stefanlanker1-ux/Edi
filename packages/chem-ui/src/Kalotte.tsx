// Teilchen als Kalottenmodell (SVG): Kugeln aus der 3D-Lage (@lern/chem atoms3D), nach Tiefe sortiert und dezent schattiert
// (radialer Verlauf – bewusste Ausnahme vom „keine Verläufe“). Farben aus den Tokens --atom-X (styles.css, CPK-Familien aus der Palette).
// Genutzt vom Teilchenbild der Reaktionsgleichungen und vom Becher der Gemische.

import { atomRadius, atoms3D, type Atom3 } from "@lern/chem";

/** Anordnung eines Stoffs von vorn gesehen (x, y) mit Tiefe z, von hinten nach vorn sortiert */
export function shapeOf(f: string): Atom3[] {
  return [...atoms3D(f)].sort((a, b) => a[3] - b[3]);
}

/** Umriss eines Stoffs in Å */
export function kalotteBox(f: string) {
  const s = shapeOf(f);
  const x0 = Math.min(...s.map(([el, x]) => x - atomRadius(el))), x1 = Math.max(...s.map(([el, x]) => x + atomRadius(el)));
  const y0 = Math.min(...s.map(([el, , y]) => y - atomRadius(el))), y1 = Math.max(...s.map(([el, , y]) => y + atomRadius(el)));
  return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0 };
}

/** Schattierung je Element (einmal je SVG): Glanzpunkt oben links, zum Rand etwas dunkler */
export function KalotteShades({ gid, els }: { gid: string; els: string[] }) {
  return (
    <defs>
      {els.map(el => (
        <radialGradient key={el} id={`${gid}-${el}`} cx="36%" cy="32%" r="70%" fx="32%" fy="26%">
          <stop offset="0%" style={{ stopColor: `color-mix(in srgb, var(--atom-${el}) 35%, #ffffff)` }} />
          <stop offset="45%" style={{ stopColor: `var(--atom-${el})` }} />
          <stop offset="100%" style={{ stopColor: `color-mix(in srgb, var(--atom-${el}) 72%, #000000)` }} />
        </radialGradient>
      ))}
    </defs>
  );
}

/** Alle Elemente, die in den Stoffen vorkommen (für KalotteShades) */
export const kalotteElements = (fs: string[]) => [...new Set(fs.flatMap(f => shapeOf(f).map(a => a[0])))];

/** Ein Teilchen, Mitte bei (cx, cy); scale = SVG-Einheiten je Å */
export function Kalotte({ f, cx, cy, gid, scale = 1 }: { f: string; cx: number; cy: number; gid: string; scale?: number }) {
  const b = kalotteBox(f), ox = -(b.x0 + b.x1) / 2, oy = -(b.y0 + b.y1) / 2;
  return (
    <g className="kal" transform={`translate(${cx} ${cy}) scale(${scale})`}>
      {shapeOf(f).map(([el, x, y], i) => (
        <circle key={i} className="kal-atom" style={{ fill: `url(#${gid}-${el})`, stroke: `color-mix(in srgb, var(--atom-${el}) 55%, var(--atom-edge))` }}
          cx={ox + x} cy={oy + y} r={atomRadius(el)} />
      ))}
    </g>
  );
}
