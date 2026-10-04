// App-State der Reaktionsgleichungen-App. Nicht gespeichert: Stufe (Start immer Unterstufe). Farbschema/Beamer: @lern/ui LernApp.
// Gespeichert: Stand der Start-Beispiele je Stufe.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { REACTION_BY_ID } from "@lern/chem";

export type Tab = "start" | "quiz";
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
