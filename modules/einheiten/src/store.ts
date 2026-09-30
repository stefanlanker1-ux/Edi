// App-State der Einheiten-App (keine Stufen: alle Größen und Einheiten). Farbschema/Beamer: @lern/ui LernApp.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { QUANTITY } from "@lern/units";

export type Tab = "convert" | "quiz";

export interface Conv { qty: string; value: string; from: string; to: string }

interface State {
  tab: Tab;
  conv: Conv;
  board: boolean;
  setTab: (t: Tab) => void;
  setConv: (p: Partial<Conv>) => void;
  setBoard: (b: boolean) => void;
}

export const START: Conv = { qty: "len", value: "0,1", from: "m", to: "cm" };

/** Gibt es Größe und Einheiten noch? Sonst auf den Start zurücksetzen */
export function valid(c: Conv): boolean {
  const qt = QUANTITY[c.qty];
  return !!qt && qt.units.some(u => u.sym === c.from) && qt.units.some(u => u.sym === c.to);
}

export const useApp = create<State>()(persist((set, get) => ({
  tab: "convert",
  conv: START,
  board: false,
  setTab: tab => set({ tab }),
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
    if (!valid(m.conv)) m.conv = START;
    return m;
  },
}));
