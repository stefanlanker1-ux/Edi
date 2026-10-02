// App-State der Einheiten-App. Unterstufe: Länge, Fläche, Volumen, Masse, Zeit ohne seltene Vorsilben;
// Oberstufe: alle Größen und Einheiten. Nicht gespeichert: Stufe (Start immer Unterstufe). Farbschema/Beamer: @lern/ui LernApp.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { QUANTITY, unitsFor } from "@lern/units";
import { num } from "@lern/i18n";

export type Tab = "convert" | "quiz";
export type Stufe = "us" | "os";

export interface Conv { qty: string; value: string; from: string; to: string }

interface State {
  tab: Tab;
  stufe: Stufe;
  conv: Conv;
  board: boolean;
  setTab: (t: Tab) => void;
  setStufe: (s: Stufe) => void;
  setConv: (p: Partial<Conv>) => void;
  setBoard: (b: boolean) => void;
}

export const START: Conv = { qty: "len", value: num("0,1"), from: "m", to: "cm" };

/** Gibt es Größe und Einheiten (in der Stufe) noch? Sonst auf den Start zurücksetzen */
export function valid(c: Conv, stufe: Stufe = "os"): boolean {
  const qt = QUANTITY[c.qty];
  if (!qt || (stufe === "us" && qt.os)) return false;
  const us = unitsFor(qt, stufe === "os");
  return us.includes(c.from) && us.includes(c.to);
}

export const useApp = create<State>()(persist((set, get) => ({
  tab: "convert",
  stufe: "us",
  conv: START,
  board: false,
  setTab: tab => set({ tab }),
  // In der Unterstufe nur Grundgrößen ohne seltene Vorsilben
  setStufe: stufe => set(valid(get().conv, stufe) ? { stufe } : { stufe, conv: START }),
  setConv: p => set({ conv: { ...get().conv, ...p } }),
  setBoard: board => set({ board }),
}), {
  name: "einheiten-v1",
  version: 3,
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ conv: s.conv, board: s.board }),
  // frühere Felder (Tab „Stellenwerttafel“, Einstellungen von „Üben“) gibt es nicht mehr
  migrate: old => { const { table: _t, practice: _p, ...rest } = (old ?? {}) as Record<string, unknown>; return rest as Partial<State>; },
  merge: (saved, current) => {
    const m = { ...current, ...(saved as Partial<State>) };
    if (!valid(m.conv, m.stufe)) m.conv = START;
    return m;
  },
}));
