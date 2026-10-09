// Fortschritt in den Kapiteln: zuletzt gezeigte Folie, weiteste Folie, fertig. Fortschritt (bleibt bei „Neu starten“).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { progressKey } from "@lern/ui";

export const LERNEN_KEY = progressKey("ionenbindung-lernen");

interface State {
  pos: Record<string, number>;
  best: Record<string, number>;
  done: Record<string, boolean>;
  step: (id: string, i: number, n: number) => void;
}

export const useLernen = create<State>()(persist(set => ({
  pos: {}, best: {}, done: {},
  step: (id, i, n) => set(s => ({
    pos: { ...s.pos, [id]: i >= n ? 0 : i },
    best: { ...s.best, [id]: Math.max(s.best[id] ?? 0, Math.min(i, n)) },
    done: i >= n ? { ...s.done, [id]: true } : s.done,
  })),
}), { name: LERNEN_KEY, version: 1, storage: createJSONStorage(() => localStorage), partialize: s => ({ pos: s.pos, best: s.best, done: s.done }) }));
