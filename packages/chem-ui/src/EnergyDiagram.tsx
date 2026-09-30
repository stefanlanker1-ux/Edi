// Energieniveau-Schema (Kästchenschreibweise). Zeilen nach Energie (oben = höchste), nach n eingerückt.

import { MADELUNG, L_NAMES, hundBoxes, type Occupied } from "@lern/chem";

const ARROW = ["", "↑", "↑↓"];

export function EnergyDiagram({ cfg, color = true, boxes, lastIndex, onBox }: {
  cfg: Occupied[];
  color?: boolean;
  /** interaktiv: eigene Kästchen-Werte je Unterschale */
  boxes?: Record<string, number[]>;
  lastIndex?: number;
  onBox?: (key: string, i: number) => void;
}) {
  const counts = Object.fromEntries(cfg.map(o => [o.key, o.count]));
  let last = lastIndex ?? -1;
  if (lastIndex === undefined) MADELUNG.forEach((o, i) => { if (counts[o.key]) last = i; });
  const rows = MADELUNG.slice(0, last + 1).reverse();
  return (
    <div className="energy">
      <div className="en-axis" aria-hidden="true"><span>Energie</span></div>
      <div className="en-grid">
        {rows.map(o => {
          const vals = boxes ? boxes[o.key] : hundBoxes(o.l, counts[o.key] ?? 0);
          return (
            <div key={o.key} className="en-row" style={{ "--n": o.n - 1 } as React.CSSProperties}>
              <span className="en-lbl">{o.key}</span>
              <span className={`en-boxes${color ? ` orb-${L_NAMES[o.l]}` : ""}`}>
                {vals.map((b, k) => onBox
                  ? <button key={k} type="button" className="en-box" onClick={() => onBox(o.key, k)} aria-label={`${o.key} Kästchen ${k + 1}: ${b} Elektronen`}>{ARROW[b]}</button>
                  : <span key={k} className="en-box">{ARROW[b]}</span>)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
