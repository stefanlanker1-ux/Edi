// Antippen im Bild (Lernen): Atome in einem Standbild der Atom-Ansicht oder in einem Kettenausschnitt antippen.
// Die Aufgaben bleiben reine Daten: Szene (Ansatz + Aktionen + Bild bzw. Kette), antippbare Atome (Kennungen), richtige Atome, Fallen.
// Die Kennungen sind stabil, weil die Abläufe beim Nachspielen immer gleich entstehen (fester Zufall).

import { replay } from "../chem/mech/index.ts";
import type { Recipe } from "../chem/mech/types.ts";
import type { Arrow, Snap } from "../chem/scene.ts";
import { chainSnap } from "./visual.tsx";
import type { TapTask } from "./tasks.ts";

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

/** richtige Auswahl? einzeln: das Teil; mehrere: genau diese Menge; Paar: zwei benachbarte Teile.
 *  Gemeldet: einzeln `pick`; mehrere `n`, `wrong` (erstes falsches Teil, sonst −1), `adj` (benachbart), `dup` (gleichwertige Teile doppelt) */
export function tapResult(t: TapTask, sel: string[]) {
  const idx = sel.map(p => t.parts.indexOf(p)).sort((a, b) => a - b);
  const adj = idx.length === 2 && idx[1] - idx[0] === 1 ? 1 : 0;
  // gleichwertige Teile zählen wie das Teil der Lösung (die zwei H am selben N)
  const canon = (p: string) => t.same?.[p] ?? p, got = sel.map(canon);
  const wrong = t.mode === "pair" ? -1 : idx.find(i => !t.answer.includes(canon(t.parts[i]))) ?? -1;
  const ok = t.mode === "pair" ? idx.length === 2 && adj === 1 : t.mode === "any" ? sel.length === 1 && t.answer.includes(sel[0]) : sel.length === t.answer.length && new Set(got).size === got.length && t.answer.every(a => got.includes(a));
  // dup: zwei gleichwertige Teile gewählt (beide H am selben N) – zählen nur einmal
  const dup = got.length - new Set(got).size > 0 ? 1 : 0;
  const values: Record<string, number> = t.mode && t.mode !== "any" ? { n: sel.length, wrong, adj, dup } : { pick: idx[0] };
  return { ok, values };
}
