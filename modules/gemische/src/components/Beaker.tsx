// Teilchenbild: jedes Teilchen als Kalottenmodell (echte Lage aus den 3D-Daten, klein gezeichnet), in Zellen verteilt (mixing.ts).
// Zwischen den Teilchen ist nichts – keine Füllfarbe. Flüssigkeit: offenes Gefäß; Gas: geschlossen; fest: Gitter mit Umriss;
// Kristall mit gestricheltem Umriss; Grenze zwischen Öl und Wasser gestrichelt, sobald sie sich getrennt haben.
// Teilchen antippen → onPick (Stoff-Info; mit Tastatur und für Vorlesen dieselbe Info über das Werkzeug „Stoffe“ –
// die Teilchen sind dafür zu klein und zu viele). Bewegungen gleiten (CSS), dazu schwingt jedes Teilchen ständig ein wenig.

import { useId } from "react";
import { Kalotte, KalotteShades, kalotteBox, kalotteElements } from "@lern/chem-ui";
import { separated, type Sim } from "../mixing.ts";

export const S = 20, P = 5; // Zellgröße und Wandabstand (SVG-Einheiten)
const GAP = 8; // Abstand zwischen getrennten Metallblöcken

/**
 * Maßstab je Stoff: das größte Teilchen füllt fast die Zelle, lange Ketten (Öl) dürfen in die Nachbarzellen ragen
 * (sonst wären sie nur ein Strich); kleine werden etwas vergrößert (sonst kaum zu sehen)
 */
function scales(fs: string[]) {
  const box = (f: string) => { const b = kalotteBox(f); return { ext: Math.max(b.w, b.h), long: Math.max(b.w, b.h) / Math.max(.1, Math.min(b.w, b.h)) > 2.5 }; };
  const room = (f: string) => (box(f).long ? 1.6 : .86) * S;
  const base = Math.min(...fs.map(f => room(f) / box(f).ext));
  return Object.fromEntries(fs.map(f => [f, Math.min(room(f) / box(f).ext, Math.max(base, .44 * S / box(f).ext))]));
}

/** Größe des Teilchenbilds in SVG-Einheiten */
export function frameSize(sim: Sim) {
  const g = sim.grid;
  return { w: g.cols * S + 2 * P + (sim.state === "fest" ? GAP : 0), h: g.rows * S + 2 * P };
}

/** Mittelpunkt einer Zelle (fest: Blöcke vorher mit Abstand, danach mittig) */
function center(sim: Sim, cell: number) {
  const g = sim.grid, row = Math.floor(cell / g.cols), col = cell % g.cols;
  const shift = sim.state === "fest" ? (sim.walls.length ? sim.walls.filter(w => col >= w).length * GAP : GAP / 2) : 0;
  return [P + col * S + S / 2 + shift, P + row * S + S / 2];
}

/** Umriss einer Gruppe von Zellen (Kanten zu Zellen außerhalb der Gruppe) */
function outline(sim: Sim, cellsIn: Set<number>, key: (cell: number) => number) {
  const g = sim.grid, d: string[] = [];
  for (const cell of cellsIn) {
    const [x, y] = center(sim, cell), h = S / 2, row = Math.floor(cell / g.cols), col = cell % g.cols;
    const same = (r2: number, c2: number) => r2 >= 0 && r2 < g.rows && c2 >= 0 && c2 < g.cols && cellsIn.has(r2 * g.cols + c2) && key(r2 * g.cols + c2) === key(cell);
    if (!same(row - 1, col)) d.push(`M${x - h} ${y - h}H${x + h}`);
    if (!same(row + 1, col)) d.push(`M${x - h} ${y + h}H${x + h}`);
    if (!same(row, col - 1)) d.push(`M${x - h} ${y - h}V${y + h}`);
    if (!same(row, col + 1)) d.push(`M${x + h} ${y - h}V${y + h}`);
  }
  return d.join("");
}

/** Grenze zwischen Öl oben und Wasser darunter, je Spalte (Stufen, wo die Grenzreihe gemischt ist) */
function boundary(sim: Sim) {
  const g = sim.grid;
  const oil = new Set(sim.ps.filter(p => sim.floats.includes(p.f)).map(p => p.cell));
  const water = new Set(sim.ps.filter(p => !sim.floats.includes(p.f)).map(p => p.cell));
  let d = "";
  for (let c = 0; c < g.cols; c++) {
    let top = -1;
    for (let row = 0; row < g.rows; row++) if (water.has(row * g.cols + c)) { top = row; break; }
    if (top < 1 || !oil.has((top - 1) * g.cols + c)) continue;
    d += `M${P + c * S} ${P + top * S}H${P + (c + 1) * S}`;
  }
  return d;
}

/** Teilchenbild als SVG-Gruppe (für die Szene mit Glas und Lupe und für das Quiz) */
export function ParticleView({ sim, onPick, gid }: { sim: Sim; onPick?: (f: string) => void; gid: string }) {
  const { w: W, h: H } = frameSize(sim);
  const fs = [...new Set(sim.ps.map(p => p.f))];
  const k = scales(fs);
  const g = sim.grid;
  const fest = sim.state === "fest";
  const crystal = new Set(sim.ps.filter(p => p.bound).map(p => p.cell));
  const band = (cell: number) => sim.walls.filter(w => cell % g.cols >= w).length;
  const oilLine = sim.floats.length && separated(sim.ps, g, sim.floats) ? boundary(sim) : "";
  return (
    <g className={`gm-frame is-${sim.state}${sim.melt > 0 ? " melting" : ""}`}>
      {sim.state === "fluessig" && <path className="gm-wall" d={`M0 -3V${H - 3}q0 3 3 3h${W - 6}q3 0 3 -3V-3`} />}
      {sim.state === "fluessig" && <path className={sim.closed ? "gm-lid" : "gm-wall"} d={sim.closed ? `M-2 -3h${W + 4}` : `M-2.5 -3.5h3M${W - .5} -3.5h3`} />}
      {sim.state === "gas" && <rect className="gm-wall" x={0} y={0} width={W} height={H} rx={4} />}
      {sim.state === "modell" && <rect className="gm-wall dashed" x={0} y={0} width={W} height={H} rx={4} />}
      {/* Trennwände zwischen den Gasen */}
      {!fest && sim.walls.map(w => <line key={w} className="gm-divider" x1={P + w * S} x2={P + w * S} y1={1} y2={H - 1} />)}
      {/* Kristall bzw. Metallstück */}
      {crystal.size > 0 && <path className={`gm-outline${fest ? " solid" : ""}`} d={outline(sim, crystal, fest ? band : () => 0)} />}
      {oilLine && <path className="gm-phase" d={oilLine} />}
      {sim.ps.map(p => {
        const [cx, cy] = center(sim, p.cell);
        const x = cx + p.jx * S * .12, y = cy + p.jy * S * .12;
        return (
          <g key={p.id} className={`gm-p${onPick ? " pick" : ""}`} style={{ transform: `translate(${x}px, ${y}px)` }} onClick={onPick && (() => onPick(p.f))}>
            {onPick && <rect className="gm-hit" x={-S / 2} y={-S / 2} width={S} height={S} rx={3} />}
            <g className="gm-jig" style={{ animationDelay: `${-((p.id * 373) % 1000) / 400}s`, animationDuration: `${1.8 + ((p.id * 7) % 5) * .25}s` }}>
              <Kalotte f={p.f} cx={0} cy={0} gid={gid} scale={k[p.f]} />
            </g>
          </g>
        );
      })}
    </g>
  );
}

/** nur das Teilchenbild (Quiz, Erklärkarten) */
export function Beaker({ sim, label, onPick, className }: { sim: Sim; label: string; onPick?: (f: string) => void; className?: string }) {
  const gid = useId().replace(/:/g, "");
  const { w, h } = frameSize(sim);
  return (
    <svg className={`gm-beaker${className ? " " + className : ""}`} viewBox={`-4 -6 ${w + 8} ${h + 10}`} role="img" aria-label={label}>
      <KalotteShades gid={gid} els={kalotteElements([...new Set(sim.ps.map(p => p.f))])} />
      <ParticleView sim={sim} gid={gid} onPick={onPick} />
    </svg>
  );
}
