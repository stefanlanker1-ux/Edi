// App-State der Einheiten-App. Nicht gespeichert: Stufe (Start immer Unterstufe). Farbschema/Beamer: @lern/ui LernApp.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { QUANTITY, unitsFor } from "@lern/units";

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

export const START: Conv = { qty: "len", value: "0,1", from: "m", to: "cm" };

/** Ist die Umrechnung in dieser Stufe erlaubt? Sonst auf den Start zurücksetzen */
export function valid(c: Conv, os: boolean): boolean {
  const qt = QUANTITY[c.qty];
  if (!qt || (qt.os && !os)) return false;
  const units = unitsFor(qt, os);
  return units.includes(c.from) && units.includes(c.to);
}

export const useApp = create<State>()(persist((set, get) => ({
  tab: "convert",
  stufe: "us",
  conv: START,
  board: false,
  setTab: tab => set({ tab }),
  setStufe: stufe => {
    const s = get(), os = stufe === "os";
    set({ stufe, conv: valid(s.conv, os) ? s.conv : START });
  },
  setConv: p => set({ conv: { ...get().conv, ...p } }),
  setBoard: board => set({ board }),
}), {
  name: "einheiten-v1",
  version: 3,
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ conv: s.conv, board: s.board }),
  // frühere Felder (Tab „Stellenwerttafel“, Einstellungen von „Üben“) gibt es nicht mehr
  migrate: old => { const { table: _t, practice: _p, ...rest } = (old ?? {}) as Record<string, unknown>; return rest as Partial<State>; },
  // Start immer Unterstufe: gespeicherte Oberstufen-Umrechnungen zurücksetzen
  merge: (saved, current) => {
    const m = { ...current, ...(saved as Partial<State>) };
    if (!valid(m.conv, false)) m.conv = START;
    return m;
  },
}));
