// Atomsymbol in Nuklidschreibweise: Massenzahl oben links, Ordnungszahl unten links, Ladung oben rechts.
import { BY_Z, chargeText } from "@lern/chem";
import { tr } from "@lern/i18n";

export function Nuclide({ Z, N, E, size = "md", blank = false }: { Z: number; N: number; E: number; size?: "sm" | "md" | "lg" | "xl"; blank?: boolean }) {
  const el = BY_Z[Z];
  const q = Z - E;
  if (!el) return <span className={`nuclide ${size} empty`}><span className="nu-sym">?</span></span>;
  return (
    <span className={`nuclide ${size}`} role="img"
      aria-label={blank ? tr(`Atomsymbol ${el.symbol} mit Lücken`, `Nuclide symbol ${el.symbol} with gaps`) : tr(`Atomsymbol ${el.symbol}, Massenzahl ${Z + N}, Ordnungszahl ${Z}${q ? `, Ladung ${chargeText(q)}` : ""}`, `Nuclide symbol ${el.symbol}, mass number ${Z + N}, atomic number ${Z}${q ? `, charge ${chargeText(q)}` : ""}`)}>
      <span className="nu-a">{blank ? "A" : Z + N}</span>
      <span className="nu-z">{blank ? "Z" : Z}</span>
      <span className="nu-sym">{el.symbol}</span>
      <span className="nu-q">{blank ? "?" : q ? chargeText(q) : ""}</span>
    </span>
  );
}
