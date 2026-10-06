// App-State der Reaktionsgleichungen-App. Nicht gespeichert: Stufe (Start immer Unterstufe). Farbschema/Beamer: @lern/ui LernApp.
// Gespeichert: Stand der Start-Beispiele je Stufe (`reaktionsgleichungen-v2`) und der Übungen (`reaktionsgleichungen-ueben`).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { REACTION_BY_ID } from "@lern/chem";
import type { Lvl } from "./ueben/exercises.ts";

export type Tab = "start" | "ueben";
export type Stufe = "us" | "os";

/** Start-Beispiele – nur Moleküle (mit Teilchenbild). Unterstufe von einer Zahl bis zur Verbrennung,
 *  Oberstufe größere Moleküle und Zahlen: Gärung, Fotosynthese, Ethanol, Ostwald-Verfahren, Oktan */
export const STARTS: Record<Stufe, string[]> = {
  us: ["knallgas", "hcl", "nh3", "methan", "propan"],
  os: ["gaerung", "fotosynthese", "ethanol", "ostwald", "octan"],
};
export const START = STARTS.us;

const ones = (id: string) => REACTION_BY_ID[id].left.concat(REACTION_BY_ID[id].right).map(() => 1);

interface StartState {
  /** gewähltes Beispiel, Zahlen je Beispiel, gelöst */
  si: number;
  coeffs: number[][];
  done: boolean[];
  /** gespeicherte Beispielliste (ändert sie sich, beginnt der Start neu) */
  ids: string[];
}
const fresh = (ids: string[]): StartState => ({ si: 0, coeffs: ids.map(ones), done: ids.map(() => false), ids });
const valid = (s: StartState | undefined, ids: string[]) =>
  !!s && s.ids?.join() === ids.join() && Array.isArray(s.coeffs) && Array.isArray(s.done) && s.si >= 0 && s.si < ids.length
  && ids.every((id, i) => s.coeffs[i]?.length === ones(id).length);

interface State {
  tab: Tab;
  stufe: Stufe;
  start: Record<Stufe, StartState>;
  setTab: (t: Tab) => void;
  setStufe: (s: Stufe) => void;
  pickStart: (i: number) => void;
  setStart: (k: number, v: number) => void;
  solvedStart: () => void;
}

export const useApp = create<State>()(persist((set, get) => {
  const edit = (f: (s: StartState) => StartState) => { const { stufe, start } = get(); set({ start: { ...start, [stufe]: f(start[stufe]) } }); };
  return {
    tab: "start",
    stufe: "us",
    start: { us: fresh(STARTS.us), os: fresh(STARTS.os) },
    setTab: tab => set({ tab }),
    setStufe: stufe => set({ stufe }),
    pickStart: si => edit(s => ({ ...s, si })),
    setStart: (k, v) => edit(s => ({ ...s, coeffs: s.coeffs.map((c, i) => (i === s.si ? c.map((x, j) => (j === k ? v : x)) : c)) })),
    solvedStart: () => edit(s => ({ ...s, done: s.done.map((d, i) => d || i === s.si) })),
  };
}, {
  name: "reaktionsgleichungen-v2",
  version: 3,
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ start: s.start }),
  // Version 2 speicherte nur die Unterstufe (sIds, si, sCoeffs, sDone)
  migrate: (old, version) => {
    const o = (old ?? {}) as { sIds?: string[]; si?: number; sCoeffs?: number[][]; sDone?: boolean[] };
    if (version < 3 && o.sIds) return { start: { us: { ids: o.sIds, si: o.si ?? 0, coeffs: o.sCoeffs ?? [], done: o.sDone ?? [] } } };
    return old as object;
  },
  merge: (saved, current) => {
    const s = (saved as Partial<State> | undefined)?.start;
    return { ...current, start: {
      us: valid(s?.us, STARTS.us) ? s!.us : fresh(STARTS.us),
      os: valid(s?.os, STARTS.os) ? s!.os : fresh(STARTS.os),
    } };
  },
}));

// ── Üben: je Stufe Schwierigkeit und Aufgabe, Zahlen und ✓ je Gleichung ─────────────


interface UebenState {
  lvl: Record<Stufe, Lvl>;
  /** gewählte Aufgabe je `${stufe}-${lvl}` */
  at: Record<string, number>;
  /** gesetzte Zahlen je Gleichung (Kennung) */
  coeffs: Record<string, number[]>;
  /** gelöste Gleichungen */
  done: Record<string, true>;
  setLvl: (s: Stufe, l: Lvl) => void;
  setAt: (s: Stufe, l: Lvl, i: number) => void;
  setCoeff: (id: string, k: number, v: number) => void;
  setCoeffs: (id: string, c: number[]) => void;
  solved: (id: string) => void;
}

export const coeffsOf = (u: Pick<UebenState, "coeffs">, id: string) => {
  const c = u.coeffs[id], n = ones(id).length;
  return Array.isArray(c) && c.length === n && c.every(x => Number.isInteger(x) && x >= 1) ? c : ones(id);
};

export const useUeben = create<UebenState>()(persist((set, get) => ({
  lvl: { us: "einfach", os: "einfach" },
  at: {},
  coeffs: {},
  done: {},
  setLvl: (s, l) => set({ lvl: { ...get().lvl, [s]: l } }),
  setAt: (s, l, i) => set({ at: { ...get().at, [`${s}-${l}`]: i } }),
  setCoeff: (id, k, v) => set({ coeffs: { ...get().coeffs, [id]: coeffsOf(get(), id).map((x, j) => (j === k ? v : x)) } }),
  setCoeffs: (id, c) => set({ coeffs: { ...get().coeffs, [id]: c } }),
  solved: id => set({ done: { ...get().done, [id]: true } }),
}), {
  name: "reaktionsgleichungen-ueben",
  version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ lvl: s.lvl, at: s.at, coeffs: s.coeffs, done: s.done }),
}));
