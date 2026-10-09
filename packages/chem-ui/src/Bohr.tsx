// Bohrsches Atommodell als SVG (viewBox zentriert um 0,0) mit plastischen Teilchen.
// Jede Schale hat immer denselben Radius (`shellRadius`) – unabhängig von Protonen, Neutronen und Elektronen. Der Rahmen bietet Platz
// für eine feste Zahl von Schalen (`slots`): Kommen Elektronen dazu, bleibt der Maßstab; das Atom wird nur größer, wenn eine Schale dazukommt.

import { useId } from "react";
import { configuration, SHELL_NAMES, L_NAMES } from "@lern/chem";
import { tr } from "@lern/i18n";

export type Particle = "proton" | "neutron" | "electron";

interface Props {
  Z: number; N: number; E: number;
  colorByOrbital?: boolean;
  animate?: boolean;
  /** nächste freie Schale gestrichelt andeuten (Baukasten) */
  ghost?: boolean;
  labels?: boolean;
  /** Anzahl p⁺/n im großen Kern anschreiben (im Quiz aus – sie verriete die Ordnungszahl) */
  counts?: boolean;
  /** eigene Schalenbesetzung statt Aufbauprinzip (Quiz „Schalen füllen“) */
  shellCounts?: number[];
  /** Platz im Rahmen für so viele Schalen (fester Maßstab der Ansicht; Standard 4 = bis Calcium). Hat ein Atom mehr Schalen, wächst der Rahmen. */
  slots?: number;
  onParticleDown?: (type: Particle, e: React.PointerEvent) => void;
}

/** Radius der K-Schale: liegt außerhalb auch des größten gezeichneten Kerns (60 Nukleonen: Radius ≈ 29, Hof bis ≈ 34) */
const SHELL_R0 = 38;
/** Abstand benachbarter Schalen */
const SHELL_GAP = 15;
/** Radius der n-ten Schale (n = 1: K, 2: L, …) in Einheiten der Zeichnung – fest, hängt nicht von Z, N oder E ab */
export const shellRadius = (n: number) => SHELL_R0 + (n - 1) * SHELL_GAP;
/** halbe Breite des Rahmens mit Platz für `slots` Schalen (Elektron und Schalenbuchstabe am äußersten Ring passen hinein) */
export const bohrExtent = (slots: number) => shellRadius(Math.max(1, slots)) + 8;
/** Radius eines Elektrons auf der Schale n mit `count` Elektronen: 4,8, nur auf sehr vollen Schalen kleiner (nie abhängig von der Zahl der Schalen) */
export const electronRadius = (n: number, count: number) => Math.min(4.8, ((2 * Math.PI * shellRadius(n)) / Math.max(1, count)) * 0.36);

function nucleusLayout(Z: number, N: number) {
  const n = Z + N;
  const pr = n <= 12 ? 5.2 : n <= 30 ? 4.2 : 3.3;
  const c = pr * 1.02;
  const parts: Particle[] = [];
  let p = 0, q = 0;
  for (let i = 0; i < n; i++) {
    const wantP = Z > 0 && (N === 0 || (p + 0.5) / Z <= (q + 0.5) / N);
    if ((wantP && p < Z) || q >= N) { parts.push("proton"); p++; } else { parts.push("neutron"); q++; }
  }
  let rmax = 0;
  const pos = parts.map((t, i) => {
    const r = c * Math.sqrt(i + (n > 1 ? 0.5 : 0));
    const a = i * 2.39996;
    rmax = Math.max(rmax, r);
    return { t, x: r * Math.cos(a), y: r * Math.sin(a) };
  }).reverse();
  return { pr, pos, r: rmax + pr };
}

/**
 * Winkel des Schalenbuchstabens auf dem Ring (Radius r, n Elektronen ab „oben“ gleichmäßig verteilt): unten rechts (45°), wenn dort Platz ist,
 * sonst die Mitte der Lücke zwischen zwei Elektronen, die 45° am nächsten liegt – der Buchstabe verdeckt nie ein Elektron (und umgekehrt).
 */
export function labelAngle(r: number, n: number): number {
  const want = Math.PI / 4;
  if (!n) return want;
  const step = (2 * Math.PI) / n;
  const er = Math.min(4.8, ((2 * Math.PI * r) / n) * 0.36);
  // Abstand der Elektronenmitte zu 45° (auf dem Ring) – Platz für Elektron und halben Buchstaben (7 px Schrift, Hof)
  const off = ((want + Math.PI / 2) % step + step) % step;
  const near = Math.min(off, step - off) * r;
  if (near >= er + 5) return want;
  const k = Math.floor((want + Math.PI / 2) / step);
  return -Math.PI / 2 + (k + 0.5) * step;
}

/**
 * Geometrie des Bohrmodells (ohne Zeichnen, für Bild und Test): Kern, Schalen mit ihren Elektronen (Unterschale l je Elektron, `null` bei eigener Besetzung),
 * Zahl der Ringe `S` (mit gestrichelter nächster Schale) und halbe Rahmenbreite `X`. Ring i liegt immer auf `shellRadius(i + 1)`.
 */
export function bohrLayout(Z: number, N: number, E: number, { ghost = false, slots = 4, shellCounts }: { ghost?: boolean; slots?: number; shellCounts?: number[] } = {}) {
  const n = Z + N;
  const big = n > 60;
  const nuc = n === 0 || big ? null : nucleusLayout(Z, N);
  const rNuc = n === 0 ? 6 : big ? 22 : nuc!.r;
  let perShell: (number | null)[][] = [];
  if (shellCounts) perShell = shellCounts.map(c => new Array<number | null>(c).fill(null));
  else {
    for (const o of configuration(Z, E)) {
      while (perShell.length < o.n) perShell.push([]);
      for (let i = 0; i < o.count; i++) perShell[o.n - 1].push(o.l);
    }
    perShell.forEach(s => s.sort((a, b) => (a ?? 0) - (b ?? 0)));
  }
  // gestrichelte nächste Schale nur, wenn der Rahmen Platz dafür hat (der Maßstab ändert sich nie)
  const S = Math.max(1, perShell.length + (ghost && perShell.length < Math.min(slots, 7) ? 1 : 0));
  return { n, big, nuc, rNuc, perShell, S, X: bohrExtent(Math.max(slots, S)), rings: Array.from({ length: S }, (_, i) => shellRadius(i + 1)) };
}

export function Bohr({ Z, N, E, colorByOrbital, animate, ghost, labels = true, counts = true, shellCounts, slots = 4, onParticleDown }: Props) {
  const uid = useId().replace(/:/g, "");
  const g = (name: string) => `url(#${uid}-${name})`;
  const { n, big, nuc, rNuc, perShell, S, X, rings } = bohrLayout(Z, N, E, { ghost, slots, shellCounts });
  const down = (t: Particle) => onParticleDown ? (e: React.PointerEvent) => onParticleDown(t, e) : undefined;

  return (
    <svg className={`bohr${animate ? " spin" : ""}`} viewBox={`${-X} ${-X} ${2 * X} ${2 * X}`} role="img"
      aria-label={tr(`Bohrsches Atommodell: ${Z} Protonen, ${N} Neutronen, ${E} Elektronen`, `Bohr model: ${Z} protons, ${N} neutrons, ${E} electrons`)}>
      <defs>
        <radialGradient id={`${uid}-p`} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="var(--proton-hi)" /><stop offset="1" stopColor="var(--proton)" /></radialGradient>
        <radialGradient id={`${uid}-n`} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="var(--neutron-hi)" /><stop offset="1" stopColor="var(--neutron)" /></radialGradient>
        <radialGradient id={`${uid}-e`} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="var(--electron-hi)" /><stop offset="1" stopColor="var(--electron)" /></radialGradient>
        <radialGradient id={`${uid}-halo`}><stop offset=".5" stopColor="var(--halo)" /><stop offset="1" stopColor="var(--halo)" stopOpacity="0" /></radialGradient>
      </defs>
      <g className="rings">
        {rings.map((r, i) => <circle key={i} r={r} className={`ring${i >= perShell.length ? " ghost" : ""}`} />)}
      </g>
      <g className="nuc">
        {n === 0 && <circle r={6} className="nuc-empty" />}
        {big && (
          <g onPointerDown={down("proton")} className="grab">
            <circle r={rNuc + 6} fill={g("halo")} />
            <circle r={rNuc} fill={g("p")} />
            {counts && <text y={-2} className="nuc-txt">{Z} p⁺</text>}
            {counts && <text y={10} className="nuc-txt">{N} n</text>}
          </g>
        )}
        {nuc && (
          <>
            <circle r={nuc.r + 5} fill={g("halo")} />
            {nuc.pos.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={nuc.pr} fill={g(p.t === "proton" ? "p" : "n")} className="pt grab" onPointerDown={down(p.t)} />
            ))}
          </>
        )}
      </g>
      {perShell.map((list, i) => {
        if (!list.length) return null;
        const r = shellRadius(i + 1), er = electronRadius(i + 1, list.length);
        return (
          <g key={i} className="shell-rot" style={{ animationDuration: `${16 + i * 8}s` }}>
            {list.map((l, k) => {
              const a = -Math.PI / 2 + (2 * Math.PI * k) / list.length;
              const orb = colorByOrbital && l !== null ? ` orb-${L_NAMES[l]}` : "";
              return <circle key={k} cx={r * Math.cos(a)} cy={r * Math.sin(a)} r={er} className={`el grab${orb}${onParticleDown ? " hit" : ""}`}
                fill={orb ? undefined : g("e")} onPointerDown={down("electron")} />;
            })}
          </g>
        );
      })}
      {/* Schalenbuchstaben nach den Elektronen (liegen obenauf, mit Hof): auf dem Ring unten rechts – sitzt dort ein Elektron, in der Lücke daneben */}
      {labels && Array.from({ length: S }, (_, i) => {
        const r = shellRadius(i + 1);
        const a = labelAngle(r, perShell[i]?.length ?? 0);
        return <text key={`l${i}`} x={r * Math.cos(a)} y={r * Math.sin(a)} className="ring-lbl">{SHELL_NAMES[i]}</text>;
      })}
    </svg>
  );
}
