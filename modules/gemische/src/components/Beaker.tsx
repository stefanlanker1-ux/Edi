// Becher im Teilchenmodell: jedes Teilchen als Kalottenmodell (echte Lage aus den 3D-Daten, klein gezeichnet),
// in Zellen verteilt (mixing.ts). Flüssigkeit unten mit Oberfläche, Gas im geschlossenen Gefäß, Modell ohne Füllung.
// Teilchen antippen → onPick (Stoff-Info). Bewegungen gleiten (CSS), beim Schütteln wackelt der Becher.

import { useId, type KeyboardEvent } from "react";
import { Kalotte, KalotteShades, kalotteBox, kalotteElements } from "@lern/chem-ui";
import type { Grid, Particle } from "../mixing.ts";
import type { State } from "../mixtures.ts";
import { nameOf } from "../mixtures.ts";

const S = 20, P = 5; // Zellgröße und Wandabstand (SVG-Einheiten)

/** Maßstab je Stoff: das größte Teilchen füllt fast die Zelle, kleine werden etwas vergrößert (sonst kaum zu sehen) */
function scales(fs: string[]) {
  const ext = (f: string) => { const b = kalotteBox(f); return Math.max(b.w, b.h); };
  const base = .86 * S / Math.max(...fs.map(ext));
  return Object.fromEntries(fs.map(f => [f, Math.min(.86 * S / ext(f), Math.max(base, .44 * S / ext(f)))]));
}

export function Beaker({ grid, ps, state, onPick, shaking, label }: {
  grid: Grid; ps: Particle[]; state: State; onPick?: (f: string) => void; shaking?: boolean; label: string;
}) {
  const gid = useId().replace(/:/g, "");
  const fs = [...new Set(ps.map(p => p.f))];
  const k = scales(fs);
  const W = grid.cols * S + 2 * P, H = grid.rows * S + 2 * P;
  const liquidRows = Math.ceil(ps.length / grid.cols);
  const surface = P + (grid.rows - liquidRows) * S - 2;
  const gas = state === "gas";
  const key = (e: KeyboardEvent, f: string) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick?.(f); } };
  return (
    <svg className={`gm-beaker${shaking ? " shaking" : ""}`} viewBox={`-3 -6 ${W + 6} ${H + 9}`} role="group" aria-label={label}>
      <KalotteShades gid={gid} els={kalotteElements(fs)} />
      <g className="gm-all">
      <g className="gm-glass">
        {state === "fluessig" && <rect className="gm-liquid" x={1} y={surface} width={W - 2} height={H - surface - 1} rx={2} />}
        {state === "fluessig" && <line className="gm-surface" x1={1} x2={W - 1} y1={surface} y2={surface} />}
        <path className="gm-wall" d={`M0 ${-3}V${H - 3}q0 3 3 3h${W - 6}q3 0 3 -3V${-3}`} />
        {/* Gas: geschlossenes Gefäß (Deckel) */}
        {gas && <path className="gm-lid" d={`M-2 -3h${W + 4}`} />}
        {!gas && <path className="gm-wall" d={`M-2.5 -3.5h3M${W - .5} -3.5h3`} />}
      </g>
      {ps.map(p => {
        const row = Math.floor(p.cell / grid.cols), col = p.cell % grid.cols;
        const x = P + col * S + S / 2 + p.jx * S * .12, y = P + row * S + S / 2 + p.jy * S * .12;
        return (
          <g key={p.id} className="gm-p" style={{ transform: `translate(${x}px, ${y}px)` }}
            {...(onPick ? { role: "button", tabIndex: 0, "aria-label": `${nameOf(p.f)} – Info`, onClick: () => onPick(p.f), onKeyDown: (e: KeyboardEvent) => key(e, p.f) } : {})}>
            {onPick && <rect className="gm-hit" x={-S / 2} y={-S / 2} width={S} height={S} rx={3} />}
            <Kalotte f={p.f} cx={0} cy={0} gid={gid} scale={k[p.f]} />
          </g>
        );
      })}
      </g>
    </svg>
  );
}
