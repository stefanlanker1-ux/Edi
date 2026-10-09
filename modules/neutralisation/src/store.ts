// App-State der Neutralisation. Nicht gespeichert: Stufe (Start immer Unterstufe). Farbschema/Beamer: @lern/ui LernApp.
// Gespeichert: gewählte Lauge und Säure, abgegebene H⁺ (Oberstufe) und die Anzahl der Formeleinheiten.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { HYDROXIDE_BY_ID, PROTIC_ACIDS, PROTIC_BY_ID } from "@lern/chem";

export type Tab = "build" | "quiz";
export type Stufe = "us" | "os";

interface State {
  tab: Tab;
  stufe: Stufe;
  base: string;
  acid: string;
  /** abgegebene H⁺ je Säure (Unterstufe immer alle) */
  step: number;
  nB: number;
  nA: number;
  setTab: (t: Tab) => void;
  setStufe: (s: Stufe) => void;
  choose: (p: { base?: string; acid?: string; step?: number }) => void;
  setCounts: (p: { nB?: number; nA?: number }) => void;
}

/** Säuren der Stufe: Perchlorsäure (Perchlorat) führt erst Level II ein – in Werkbank und Quiz gleich */
export const acidsFor = (os: boolean) => (os ? PROTIC_ACIDS : PROTIC_ACIDS.filter(a => a.id !== "hclo4"));
const usAcid = (id: string) => acidsFor(false).some(a => a.id === id);

const DEFAULT = { base: "baoh2", acid: "h3po4", step: 3, nB: 1, nA: 1 };

export const useApp = create<State>()(persist((set, get) => ({
  tab: "build",
  stufe: "us",
  ...DEFAULT,
  setTab: tab => set({ tab }),
  setStufe: stufe => {
    const s = get();
    // Unterstufe: nur vollständige Neutralisation und Laugen ohne Oberstufen-Kennzeichen
    if (stufe === "us") {
      const acid = usAcid(s.acid) ? s.acid : "hcl";
      set({ stufe, acid, step: PROTIC_BY_ID[acid].protons, ...(HYDROXIDE_BY_ID[s.base].os || acid !== s.acid ? { base: HYDROXIDE_BY_ID[s.base].os ? "naoh" : s.base, nB: 1, nA: 1 } : {}) });
    }
    else set({ stufe });
  },
  // Neue Stoffe → wieder mit je einer Formeleinheit beginnen, damit die Schüler selbst ausgleichen
  choose: p => {
    const acid = p.acid ?? get().acid;
    const step = p.step ?? (p.acid ? PROTIC_BY_ID[acid].protons : get().step);
    set({ ...p, step, nB: 1, nA: 1 });
  },
  setCounts: p => set(p),
}), {
  name: "neutralisation-v1",
  version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ base: s.base, acid: s.acid, step: s.step, nB: s.nB, nA: s.nA }),
  // Start immer in der Unterstufe → gespeicherte Oberstufen-Wahl (Aluminiumhydroxid, Hydrogensalze) zurücksetzen
  merge: (saved, current) => {
    const m = { ...current, ...(saved as Partial<State>) };
    const b = HYDROXIDE_BY_ID[m.base], a = PROTIC_BY_ID[m.acid];
    if (!b || !a || b.os || !usAcid(a.id)) Object.assign(m, DEFAULT);
    else m.step = a.protons;
    if (!(m.nB >= 1 && m.nB <= 6 && m.nA >= 1 && m.nA <= 6)) Object.assign(m, { nB: 1, nA: 1 });
    return m;
  },
}));
