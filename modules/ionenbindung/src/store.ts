// App-State der Ionenbindung-App. Nicht gespeichert: Stufe (Start immer Unterstufe). Farbschema/Beamer: @lern/ui LernApp.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ION_BY_ID } from "@lern/chem";

export type Tab = "build" | "quiz";
export type Stufe = "us" | "os";

interface State {
  tab: Tab;
  stufe: Stufe;
  cation: string;
  anion: string;
  nC: number;
  nA: number;
  setTab: (t: Tab) => void;
  setStufe: (s: Stufe) => void;
  choose: (p: { cation?: string; anion?: string }) => void;
  setCounts: (p: { nC?: number; nA?: number }) => void;
}

const usOk = (id: string) => !ION_BY_ID[id]?.os;

export const useApp = create<State>()(persist((set, get) => ({
  tab: "build",
  stufe: "us",
  cation: "Ca2+",
  anion: "Cl-",
  nC: 1,
  nA: 1,
  setTab: tab => set({ tab }),
  setStufe: stufe => {
    const s = get();
    // In der Unterstufe nur einfache Ionen
    if (stufe === "us" && (!usOk(s.cation) || !usOk(s.anion))) set({ stufe, cation: "Ca2+", anion: "Cl-", nC: 1, nA: 1 });
    else set({ stufe });
  },
  // Neue Ionen → wieder mit je einem Baustein beginnen, damit die Schüler selbst ausgleichen
  choose: p => set({ ...p, nC: 1, nA: 1 }),
  setCounts: p => set(p),
}), {
  name: "ionenbindung-v1",
  version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ cation: s.cation, anion: s.anion, nC: s.nC, nA: s.nA }),
  merge: (saved, current) => {
    const m = { ...current, ...(saved as Partial<State>) };
    if (!ION_BY_ID[m.cation] || !usOk(m.cation) || !ION_BY_ID[m.anion] || !usOk(m.anion)) Object.assign(m, { cation: "Ca2+", anion: "Cl-", nC: 1, nA: 1 });
    return m;
  },
}));
