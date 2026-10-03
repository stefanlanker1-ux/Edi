// Atom im Orbitalmodell (Wellenmechanik): besetzte Orbitale in 3D bei gleicher Elektronendichte, je Unterschale zuschaltbar.
// Anfangs sichtbar: die äußerste Schale (s und p) und nicht volle d-/f-Unterschalen. Die 3D-Ansicht lädt erst bei Bedarf.

import { lazy, Suspense, useMemo, useState } from "react";
import { L_NAMES, atomIso, occupiedOrbitals, orbitalLabel } from "@lern/chem";
import { tr } from "@lern/i18n";

const Orbital3D = lazy(() => import("./Orbital3D.tsx"));

export function OrbitalAtom({ Z, E = Z, initial, only, spins = true }: {
  Z: number; E?: number; initial?: string[];
  /** nur diese Unterschalen anbieten, z. B. ["4s", "3d"] */
  only?: string[];
  /** Besetzung (↑, ↑↓) an den Schaltern zeigen */
  spins?: boolean;
}) {
  const all = useMemo(() => occupiedOrbitals(Z, E), [Z, E]);
  const onlyKey = only?.join(" ");
  const orbs = useMemo(() => (onlyKey ? all.filter(o => onlyKey.split(" ").includes(`${o.n}${L_NAMES[o.l]}`)) : all), [all, onlyKey]);
  // Grenzwert immer vom ganzen Atom, damit die Größen gleich bleiben
  const iso = useMemo(() => (all.length ? atomIso(all) : 0), [all]);
  const keyOf = (o: { n: number; m: string }) => `${o.n}${o.m}`;
  const nMax = Math.max(0, ...orbs.map(o => o.n));
  // anfangs: äußerste Schale und nicht volle d-/f-Unterschalen
  const def = initial ?? orbs.filter(o => o.n === nMax || (o.l >= 2 && orbs.filter(x => x.n === o.n && x.l === o.l).some(x => x.electrons < 2))).map(keyOf);
  const [on, setOn] = useState<string[]>(def);
  const shown = orbs.filter(o => on.includes(keyOf(o)));
  if (!orbs.length) return null;
  return (
    <div className="orb-atom">
      <div className="orb-chips" role="group" aria-label={tr("Orbitale zeigen", "Show orbitals")}>
        {orbs.map(o => {
          const k = keyOf(o), act = on.includes(k), lab = orbitalLabel(o);
          return (
            <button key={k} type="button" className={`orb-chip t-${L_NAMES[o.l]}${act ? " on" : ""}`} aria-pressed={act}
              title={spins ? tr(`${o.electrons} Elektron${o.electrons > 1 ? "en" : ""}`, `${o.electrons} electron${o.electrons > 1 ? "s" : ""}`) : undefined}
              onClick={() => setOn(act ? on.filter(x => x !== k) : [...on, k])}>
              {lab.main}{lab.sub && <sub>{lab.sub}</sub>}{spins && <span className="orb-e" aria-hidden="true">{o.electrons === 2 ? "↑↓" : "↑"}</span>}
            </button>
          );
        })}
      </div>
      <div className="orb-view">
        <Suspense fallback={<div className="m3d m3d-loading">{tr("3D-Ansicht wird geladen …", "Loading 3D view …")}</div>}>
          <Orbital3D items={shown.map(o => ({ o, Zeff: o.Zeff }))} iso={iso} />
        </Suspense>
      </div>
      <p className="orb-legend">{tr("Fläche gleicher Elektronendichte · dunkel ψ > 0, hell ψ < 0", "Surface of equal electron density · dark ψ > 0, light ψ < 0")}</p>
    </div>
  );
}
