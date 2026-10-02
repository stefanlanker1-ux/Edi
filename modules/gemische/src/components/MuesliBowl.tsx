// Müsli in der Schale: sichtbare Stücke (Haferflocken, Rosinen, Haselnüsse) statt Teilchen. Vorher liegt jede Sorte
// als eigener Haufen, gemischt liegen die Stücke durcheinander (Gemenge). Die Stücke gleiten beim Mischen und Auslesen
// an ihre neuen Plätze (CSS-Übergang, ohne Bewegung sofort). Farben aus der Palette (--hue-*).

import { MUESLI, type Part } from "../mixtures.ts";
import { tr } from "@lern/i18n";

/** Schale: Halbellipse unter dem Rand (Mitte 100 | 34, Halbachsen 90 und 82) */
const CX = 100, TOP = 34, RX = 90, RY = 82, STEP = 13;

/** Plätze für die Stücke: von unten nach oben in Reihen, so breit, wie die Schale dort ist */
function slots(n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let row = 0; out.length < n; row++) {
    const y = TOP + RY - 9 - row * STEP * .8;
    const half = RX * Math.sqrt(Math.max(0, 1 - ((y - TOP) / RY) ** 2)) - 9;
    const k = Math.max(1, Math.floor((2 * half) / STEP) + 1);
    for (let i = 0; i < k; i++) out.push([CX - half + (k > 1 ? (2 * half * i) / (k - 1) : half), y + (i % 2 ? 1.5 : -1.5)]);
  }
  return out.slice(0, n);
}

/** einfacher Zufall mit Startwert (gleiches Bild nach jedem Zeichnen) */
function rand(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

const PIECES: Part["id"][] = MUESLI.parts.flatMap(p => Array<Part["id"]>(p.n).fill(p.id));
const SLOTS = slots(PIECES.length);
/** vorher: Plätze von links nach rechts – jede Sorte ein eigener Haufen nebeneinander */
const SORTED = SLOTS.map((_, i) => i).sort((a, b) => SLOTS[a][0] - SLOTS[b][0]);

/** Platz je Stück: getrennt (Haufen) oder gemischt (zufällige Reihenfolge, je Mischen neu) */
export function placeOf(mixed: number): number[] {
  if (!mixed) return SORTED;
  const r = rand(mixed * 7919), order = SLOTS.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return order;
}

function Piece({ id }: { id: Part["id"] }) {
  if (id === "flocke") return <ellipse rx={8} ry={5} fill="var(--hue-yellow-soft)" stroke="var(--hue-yellow-deep)" strokeWidth={.8} />;
  if (id === "rosine") return <><ellipse rx={4.6} ry={3.6} fill="var(--hue-violet-deep)" /><path d="M-2.4 -1 q2 1.6 4.4 0" fill="none" stroke="var(--hue-violet-soft)" strokeWidth={.7} /></>;
  return <><circle r={5.6} fill="var(--hue-orange-soft)" stroke="var(--hue-orange-deep)" strokeWidth={.8} /><path d="M-3.6 -3.4 q3.6 -2.6 7.2 0" fill="none" stroke="var(--hue-orange-deep)" strokeWidth={1.2} /></>;
}

export function MuesliBowl({ mixed, shaking }: { mixed: number; shaking: boolean }) {
  const place = placeOf(mixed);
  const turn = rand(11);
  return (
    <div className="gm-muesli">
      <svg viewBox="0 0 200 124" role="img" preserveAspectRatio="xMidYMid meet"
        aria-label={`${tr("Müsli in der Schale", "Muesli in the bowl")}: ${MUESLI.parts.map(p => `${p.n} ${p.name}`).join(", ")}, ${mixed ? tr("gemischt", "mixed") : tr("jede Sorte für sich", "each kind separate")}`}>
        <g className={shaking ? "gm-bowl shake" : "gm-bowl"}>
          {PIECES.map((id, i) => {
            const [x, y] = SLOTS[place[i]];
            return <g key={i} className="gm-piece" style={{ transform: `translate(${x}px, ${y}px) rotate(${Math.round(turn() * 360)}deg)` }}><Piece id={id} /></g>;
          })}
          <path d={`M${CX - RX - 4} ${TOP} h${2 * RX + 8} M${CX - RX} ${TOP} a${RX} ${RY} 0 0 0 ${2 * RX} 0`} fill="none" stroke="var(--text)" strokeWidth={1.6} strokeLinecap="round" />
        </g>
      </svg>
      <ul className="gm-muesli-key">
        {MUESLI.parts.map(p => (
          <li key={p.id}><svg viewBox="-8 -8 16 16" width={18} height={18} aria-hidden="true"><Piece id={p.id} /></svg>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}
