// App-State der Stoffmengen-App. Farbschema/Beamer: @lern/ui LernApp (nicht gespeichert).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MOLE_BY_FORMULA } from "@lern/chem";

export type Tab = "rechnen" | "quiz";
/** gegeben ist die Masse (→ n) oder die Stoffmenge (→ m) */
export type Mode = "m" | "n";

interface State {
  tab: Tab;
  formula: string;
  mode: Mode;
  /** eingegebener Wert: Masse in g bzw. Stoffmenge in mol */
  value: number;
  setTab: (t: Tab) => void;
  choose: (formula: string) => void;
  setMode: (m: Mode) => void;
  setValue: (v: number) => void;
}

export const useApp = create<State>()(persist(set => ({
  tab: "rechnen",
  formula: "H2O",
  mode: "m",
  value: 36,
  setTab: tab => set({ tab }),
  choose: formula => set({ formula }),
  setMode: mode => set({ mode, value: mode === "m" ? 36 : 2 }),
  setValue: v => set({ value: Math.max(0, Math.min(9999, v)) }),
}), {
  name: "stoffmenge-v1",
  version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ formula: s.formula, mode: s.mode, value: s.value }),
  merge: (saved, current) => {
    const m = { ...current, ...(saved as Partial<State>) };
    if (!MOLE_BY_FORMULA[m.formula]) m.formula = "H2O";
    if (!Number.isFinite(m.value) || m.value < 0) m.value = 36;
    return m;
  },
}));
