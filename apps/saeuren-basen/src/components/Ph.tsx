// pH-Skala (Bühne) und Reagenzglas mit Indikatorfarbe. Farben nur über Tokens (--c-rot … --c-farblos in app.css).

import { indicatorColor, phLabel } from "@lern/chem";

/** Farbname des Indikators → CSS-Variable */
export const colorVar = (name: string) => `var(--c-${name.replace(/ü/g, "ue")})`;

/** Skala 0–14 mit Universalindikator-Farben; marker = eingestellter pH, labels = Zahlen darunter */
export function PhScale({ ph, labels = true, compact = false }: { ph?: number; labels?: boolean; compact?: boolean }) {
  const W = 15 * 20, H = compact ? 44 : 70;
  return (
    <svg className={`ph-scale${compact ? " compact" : ""}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ph === undefined ? "pH-Skala 0 bis 14" : `pH ${ph}: ${phLabel(ph)}`}>
      {Array.from({ length: 15 }, (_, i) => (
        <rect key={i} x={i * 20 + 0.5} y={compact ? 4 : 22} width={19} height={compact ? 22 : 26} rx={2} fill={colorVar(indicatorColor("universal", i))}
          stroke={ph === i ? "var(--text)" : "none"} strokeWidth={ph === i ? 2.5 : 0} />
      ))}
      {labels && Array.from({ length: 15 }, (_, i) => (
        <text key={i} x={i * 20 + 10} y={compact ? 40 : 63} fontSize={compact ? 10 : 11} fontWeight={ph === i ? 800 : 500} textAnchor="middle" fill={ph === i ? "var(--text)" : "var(--muted)"}>{i}</text>
      ))}
      {!compact && <>
        <text x={2} y={12} fontSize={11} fontWeight={700} fill="var(--text)">sauer</text>
        <text x={150} y={12} fontSize={11} fontWeight={700} textAnchor="middle" fill="var(--text)">neutral</text>
        <text x={298} y={12} fontSize={11} fontWeight={700} textAnchor="end" fill="var(--text)">basisch</text>
      </>}
      {ph !== undefined && !compact && <path d={`M${ph * 20 + 10} 15 l-5 6 h10 z`} fill="var(--text)" />}
    </svg>
  );
}

/** Reagenzglas mit der Farbe eines Indikators bei einem pH-Wert */
export function Tube({ indicator, ph, label }: { indicator: string; ph: number; label?: string }) {
  const c = indicatorColor(indicator, ph);
  return (
    <figure className="tube" aria-label={`${label ?? "Indikator"}: ${c}`}>
      <svg viewBox="0 0 60 120" aria-hidden="true">
        <path d="M18 8 v76 a12 12 0 0 0 24 0 V8" fill="none" stroke="var(--text)" strokeWidth="3" strokeLinejoin="round" />
        <path d="M20 44 h20 v40 a10 10 0 0 1 -20 0 z" fill={colorVar(c)} stroke={c === "farblos" ? "var(--border)" : "none"} />
        <line x1="14" y1="8" x2="46" y2="8" stroke="var(--text)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <figcaption>{c}</figcaption>
    </figure>
  );
}

/** Farbfeld mit Namen (Antwortform „Farbe wählen“ und Indikator-Tabelle) */
export function Swatch({ color }: { color: string }) {
  return <span className="swatch"><i style={{ background: colorVar(color) }} className={color === "farblos" ? "empty" : undefined} />{color}</span>;
}
