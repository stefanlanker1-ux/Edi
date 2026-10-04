// Antippen im Bild (Lernen): Atome in einem Standbild der Atom-Ansicht oder in einem Kettenausschnitt antippen.
// Die Aufgaben bleiben reine Daten: Szene (Ansatz + Aktionen + Bild bzw. Kette), antippbare Atome (Kennungen), richtige Atome, Fallen.
// Die Kennungen sind stabil, weil die Abläufe beim Nachspielen immer gleich entstehen (fester Zufall).

import { replay } from "../chem/mech/index.ts";
import type { Recipe } from "../chem/mech/types.ts";
import type { Arrow, Snap } from "../chem/scene.ts";
import { chainSnap } from "./visual.tsx";

/** Szene: Bild `key` des Ablaufs der letzten Aktion (ohne Pfeile, wenn `noArrows`), Endbild (`key` = −1) bzw. Kettenausschnitt */
export type TapScene =
  | { k: "mech"; r: Recipe; acts: string[]; key: number; noArrows?: boolean }
  | { k: "chain"; id: string; n: number };

export interface TapFrame { snap: Snap; arrows: Arrow[] }

export function tapFrame(s: TapScene): TapFrame {
  if (s.k === "chain") return { snap: chainSnap(s.id, s.n), arrows: [] };
  const m = replay(s.r, s.acts.slice(0, -1));
  const clip = m.run(s.acts[s.acts.length - 1]);
  const k = clip[Math.max(0, Math.min(clip.length - 1, s.key < 0 ? clip.length + s.key : s.key))];
  return { snap: k.snap, arrows: s.noArrows ? [] : k.arrows ?? [] };
}

/** Endbild nach der letzten Aktion (zum Vergleich: welche Bindungen sind neu, welche Atome sind weg) */
export function tapAfter(s: Extract<TapScene, { k: "mech" }>): Snap {
  return replay(s.r, s.acts).snap();
}

/** sichtbare Atome mit Beschriftung (antippbar) */
export const visibleAtoms = (snap: Snap) => {
  const f = snap.focus ? new Set(snap.focus) : null;
  return snap.atoms.filter(a => (a.op ?? 1) > 0.5 && (a.vac || (a.text ?? a.el)) && (!f || f.has(a.id)));
};
