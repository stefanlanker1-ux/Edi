// App-State der Reaktionsgleichungen-App. Nicht gespeichert: Stufe (Start immer Unterstufe). Farbschema/Beamer: @lern/ui LernApp.
// Gespeichert: Stand der 5 Start-Beispiele.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { REACTION_BY_ID } from "@lern/chem";

export type Tab = "start" | "quiz";
export type Stufe = "us" | "os";

/** Die 5 Beispiele im Start – nur Moleküle (mit Teilchenbild), von leicht (eine Zahl) bis Verbrennung */
export const START = ["knallgas", "hcl", "nh3", "methan", "propan"];

const ones = (id: string) => REACTION_BY_ID[id].left.concat(REACTION_BY_ID[id].right).map(() => 1);

interface State {
  tab: Tab;
  stufe: Stufe;
  /** Start: gewähltes Beispiel, Zahlen je Beispiel, gelöst */
  si: number;
  sCoeffs: number[][];
  sDone: boolean[];
  /** gespeicherte Beispielliste (ändert sie sich, beginnt der Start neu) */
  sIds: string[];
  setTab: (t: Tab) => void;
  setStufe: (s: Stufe) => void;
  pickStart: (i: number) => void;
  setStart: (k: number, v: number) => void;
  solvedStart: () => void;
}

export const useApp = create<State>()(persist((set, get) => ({
  tab: "start",
  stufe: "us",
  si: 0,
  sCoeffs: START.map(ones),
  sDone: START.map(() => false),
  sIds: START,
  setTab: tab => set({ tab }),
  setStufe: stufe => set({ stufe }),
  pickStart: si => set({ si }),
  setStart: (k, v) => {
    const { si, sCoeffs } = get();
    set({ sCoeffs: sCoeffs.map((c, i) => (i === si ? c.map((x, j) => (j === k ? v : x)) : c)) });
  },
  solvedStart: () => set({ sDone: get().sDone.map((d, i) => d || i === get().si) }),
}), {
  name: "reaktionsgleichungen-v2",
  version: 2,
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ sIds: s.sIds, si: s.si, sCoeffs: s.sCoeffs, sDone: s.sDone }),
  merge: (saved, current) => {
    const m = { ...current, ...(saved as Partial<State>) };
    const okStart = m.sIds?.join() === START.join() && Array.isArray(m.sCoeffs) && m.sCoeffs.length === START.length && START.every((id, i) => m.sCoeffs[i]?.length === ones(id).length);
    if (!okStart) Object.assign(m, { sIds: START, si: 0, sCoeffs: START.map(ones), sDone: START.map(() => false) });
    if (!(m.si >= 0 && m.si < START.length)) m.si = 0;
    return m;
  },
}));
