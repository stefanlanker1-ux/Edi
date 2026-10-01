// App-State der Gemische. Gespeichert (gemische-v1): gewähltes Beispiel. Farbschema/Beamer: @lern/ui LernApp.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { EXAMPLE_COUNT } from "./mixtures.ts";

export type Tab = "probieren" | "quiz";

interface State {
  tab: Tab;
  /** Index in EXAMPLES (EXAMPLES.length = Müsli) */
  ex: number;
  setTab: (t: Tab) => void;
  setEx: (i: number) => void;
}

export const useApp = create<State>()(persist(set => ({
  tab: "probieren",
  ex: 0,
  setTab: tab => set({ tab }),
  setEx: i => set({ ex: (i + EXAMPLE_COUNT) % EXAMPLE_COUNT }),
}), {
  name: "gemische-v1",
  version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ ex: s.ex }),
  merge: (saved, current) => {
    const m = { ...current, ...(saved as Partial<State>) };
    if (!(m.ex >= 0 && m.ex < EXAMPLE_COUNT)) m.ex = 0;
    return m;
  },
}));
