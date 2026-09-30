// App-State der Reaktionsgleichungen-App. Nicht gespeichert: Stufe (Start immer Unterstufe). Farbschema/Beamer: @lern/ui LernApp.
// Gespeichert: Stand der 5 Start-Beispiele und die aktuelle Übungsgleichung (Niveau, Reaktion, Zahlen).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { REACTION_BY_ID, reactionsFor, type Niveau } from "@lern/chem";

export type Tab = "start" | "ueben" | "quiz";
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
  /** Üben: Niveau, Reaktion, Zahlen */
  niveau: Niveau;
  pid: string;
  pCoeffs: number[];
  setTab: (t: Tab) => void;
  setStufe: (s: Stufe) => void;
  pickStart: (i: number) => void;
  setStart: (k: number, v: number) => void;
  solvedStart: () => void;
  setNiveau: (n: Niveau) => void;
  setPractice: (k: number, v: number) => void;
  solvePractice: () => void;
  nextPractice: () => void;
}

/** zufällige Übungsgleichung (Stufe, Niveau), nicht dieselbe wie eben, mindestens eine Zahl > 1 */
function draw(stufe: Stufe, niveau: Niveau, not?: string) {
  const pool = reactionsFor(stufe, niveau).filter(r => r.id !== not && r.coeffs.some(c => c > 1));
  return pool[Math.floor(Math.random() * pool.length)].id;
}

export const useApp = create<State>()(persist((set, get) => ({
  tab: "start",
  stufe: "us",
  si: 0,
  sCoeffs: START.map(ones),
  sDone: START.map(() => false),
  sIds: START,
  niveau: 1,
  pid: "mgo",
  pCoeffs: ones("mgo"),
  setTab: tab => set({ tab }),
  setStufe: stufe => {
    const id = draw(stufe, get().niveau);
    set({ stufe, pid: id, pCoeffs: ones(id) });
  },
  pickStart: si => set({ si }),
  setStart: (k, v) => {
    const { si, sCoeffs } = get();
    set({ sCoeffs: sCoeffs.map((c, i) => (i === si ? c.map((x, j) => (j === k ? v : x)) : c)) });
  },
  solvedStart: () => set({ sDone: get().sDone.map((d, i) => d || i === get().si) }),
  setNiveau: niveau => {
    const id = draw(get().stufe, niveau);
    set({ niveau, pid: id, pCoeffs: ones(id) });
  },
  setPractice: (k, v) => set({ pCoeffs: get().pCoeffs.map((x, j) => (j === k ? v : x)) }),
  solvePractice: () => set({ pCoeffs: [...REACTION_BY_ID[get().pid].coeffs] }),
  nextPractice: () => {
    const id = draw(get().stufe, get().niveau, get().pid);
    set({ pid: id, pCoeffs: ones(id) });
  },
}), {
  name: "reaktionsgleichungen-v2",
  version: 2,
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ sIds: s.sIds, si: s.si, sCoeffs: s.sCoeffs, sDone: s.sDone, niveau: s.niveau, pid: s.pid, pCoeffs: s.pCoeffs }),
  // Start immer in der Unterstufe → gespeicherte Oberstufen-Gleichung ersetzen
  merge: (saved, current) => {
    const m = { ...current, ...(saved as Partial<State>) };
    const okStart = m.sIds?.join() === START.join() && Array.isArray(m.sCoeffs) && m.sCoeffs.length === START.length && START.every((id, i) => m.sCoeffs[i]?.length === ones(id).length);
    if (!okStart) Object.assign(m, { sIds: START, si: 0, sCoeffs: START.map(ones), sDone: START.map(() => false) });
    if (!(m.si >= 0 && m.si < START.length)) m.si = 0;
    const r = REACTION_BY_ID[m.pid];
    if (![1, 2, 3, 4].includes(m.niveau)) m.niveau = 1;
    if (!r || r.stufe !== "us" || m.pCoeffs?.length !== ones(m.pid).length) Object.assign(m, { pid: current.pid, pCoeffs: current.pCoeffs, niveau: 1 });
    return m;
  },
}));
