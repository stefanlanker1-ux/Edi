// Atomsymbol in Nuklidschreibweise: Massenzahl oben links, Ordnungszahl unten links, Ladung oben rechts.
import { BY_Z, chargeText } from "@lern/chem";

export function Nuclide({ Z, N, E, size = "md", blank = false }: { Z: number; N: number; E: number; size?: "sm" | "md" | "lg" | "xl"; blank?: boolean }) {
  const el = BY_Z[Z];
  const q = Z - E;
  if (!el) return <span className={`nuclide ${size} empty`}><span className="nu-sym">?</span></span>;
  return (
    <span className={`nuclide ${size}`} role="img"
      aria-label={blank ? `Atomsymbol ${el.symbol} mit Lücken` : `Atomsymbol ${el.symbol}, Massenzahl ${Z + N}, Ordnungszahl ${Z}${q ? `, Ladung ${chargeText(q)}` : ""}`}>
      <span className="nu-a">{blank ? "A" : Z + N}</span>
      <span className="nu-z">{blank ? "Z" : Z}</span>
      <span className="nu-sym">{el.symbol}</span>
      <span className="nu-q">{blank ? "?" : q ? chargeText(q) : ""}</span>
    </span>
  );
}
