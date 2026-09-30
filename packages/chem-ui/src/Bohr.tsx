// Bohrsches Atommodell als SVG (viewBox zentriert um 0,0) mit plastischen Teilchen.

import { useId } from "react";
import { configuration, SHELL_NAMES, L_NAMES } from "@lern/chem";

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
  onParticleDown?: (type: Particle, e: React.PointerEvent) => void;
}

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

export function Bohr({ Z, N, E, colorByOrbital, animate, ghost, labels = true, counts = true, shellCounts, onParticleDown }: Props) {
  const uid = useId().replace(/:/g, "");
  const g = (name: string) => `url(#${uid}-${name})`;
  const n = Z + N;
  const big = n > 60;
  const nuc = n === 0 ? null : big ? null : nucleusLayout(Z, N);
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
  const S = Math.max(1, perShell.length + (ghost && perShell.length < 7 ? 1 : 0));
  const r0 = rNuc + 6, gap = (93 - r0) / S;
  const down = (t: Particle) => onParticleDown ? (e: React.PointerEvent) => onParticleDown(t, e) : undefined;

  return (
    <svg className={`bohr${animate ? " spin" : ""}`} viewBox="-100 -100 200 200" role="img"
      aria-label={`Bohrsches Atommodell: ${Z} Protonen, ${N} Neutronen, ${E} Elektronen`}>
      <defs>
        <radialGradient id={`${uid}-p`} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="var(--proton-hi)" /><stop offset="1" stopColor="var(--proton)" /></radialGradient>
        <radialGradient id={`${uid}-n`} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="var(--neutron-hi)" /><stop offset="1" stopColor="var(--neutron)" /></radialGradient>
        <radialGradient id={`${uid}-e`} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="var(--electron-hi)" /><stop offset="1" stopColor="var(--electron)" /></radialGradient>
        <radialGradient id={`${uid}-halo`}><stop offset=".5" stopColor="var(--halo)" /><stop offset="1" stopColor="var(--halo)" stopOpacity="0" /></radialGradient>
      </defs>
      <g className="rings">
        {Array.from({ length: S }, (_, i) => {
          const r = r0 + gap * (i + 1) - gap * 0.15;
          return <circle key={i} r={r} className={`ring${i >= perShell.length ? " ghost" : ""}`} />;
        })}
      </g>
      {labels && Array.from({ length: S }, (_, i) => {
        const r = r0 + gap * (i + 1) - gap * 0.15;
        return <text key={i} x={r * 0.7071 + 3} y={r * 0.7071 + 3} className="ring-lbl">{SHELL_NAMES[i]}</text>;
      })}
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
        const r = r0 + gap * (i + 1) - gap * 0.15;
        const er = Math.min(4.8, ((2 * Math.PI * r) / list.length) * 0.36);
        return (
          <g key={i} className="shell-rot" style={{ animationDuration: `${16 + i * 8}s` }}>
            {list.map((l, k) => {
              const a = -Math.PI / 2 + (2 * Math.PI * k) / list.length;
              const orb = colorByOrbital && l !== null ? ` orb-${L_NAMES[l]}` : "";
              return <circle key={k} cx={r * Math.cos(a)} cy={r * Math.sin(a)} r={er} className={`el grab${orb}`}
                fill={orb ? undefined : g("e")} onPointerDown={down("electron")} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}
