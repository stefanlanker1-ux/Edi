// Kügelchen: ein Kügelchen je Baustein (Monomer-Einheit), Farbe und Buchstabe je Monomer – so sind Blöcke,
// abwechselnde und zufällige Folgen auf einen Blick zu erkennen. Die Leiste zeigt die Kette der Atom-Ansicht;
// Antippen eines Kügelchens zeigt das Monomer.

import { tr } from "@lern/i18n";
import type { Hue } from "../chem/data.ts";
import type { Bead } from "../chem/mech/types.ts";

/** ein Kügelchen als SVG-Kreis (Mittelpunkt, Radius) */
export function BeadDot({ cx, cy, r, hue, letter, active }: { cx: number; cy: number; r: number; hue: Hue | "init"; letter?: string; active?: string | null }) {
  return (
    <g className={`pm-bead hue-${hue}`}>
      {active && <circle className={`pm-bead-act act-${active}`} cx={cx} cy={cy} r={r + 3.5} />}
      <circle className="pm-bead-c" cx={cx} cy={cy} r={r} />
      {letter && r >= 8 && <text x={cx} y={cy} dominantBaseline="central" textAnchor="middle" style={{ fontSize: Math.min(r * 1.05, 15) }}>{letter}</text>}
    </g>
  );
}

/** Kette als Reihe von Kügelchen; zu lang → die letzten zeigen und vorn „…“ */
export function BeadStrip({ beads, active, onPick, max = 24 }: {
  beads: Bead[]; active: string | null; onPick?: (b: Bead) => void; max?: number;
}) {
  const shown = beads.length > max ? beads.slice(beads.length - max) : beads;
  const cut = beads.length > max;
  const r = 13, gap = 2 * r + 4, w = Math.max(1, shown.length) * gap + (cut ? gap : 0) + 10, h = 2 * r + 12;
  return (
    <svg className="pm-strip" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={tr(`Kette als Kügelchen: ${beads.length} Teile`, `Chain as beads: ${beads.length} parts`)}>
      {cut && <text className="pm-strip-more" x={gap / 2 + 4} y={h / 2} dominantBaseline="central" textAnchor="middle">…</text>}
      {shown.map((b, i) => {
        const cx = (cut ? gap : 0) + gap / 2 + 5 + i * gap, cy = h / 2;
        const last = i === shown.length - 1;
        return (
          <g key={i} onClick={onPick && b.kind === "unit" ? () => onPick(b) : undefined} className={onPick && b.kind === "unit" ? "pm-strip-tap" : undefined}>
            {i > 0 && <line className="pm-strip-bond" x1={cx - gap + r} y1={cy} x2={cx - r} y2={cy} />}
            <BeadDot cx={cx} cy={cy} r={b.kind === "unit" ? r : r * 0.72} hue={b.hue} letter={b.letter} active={last ? active : null} />
            {onPick && b.kind === "unit" && <rect className="pm-hit" x={cx - gap / 2} y={0} width={gap} height={h} />}
          </g>
        );
      })}
    </svg>
  );
}
