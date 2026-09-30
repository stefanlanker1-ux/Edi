// App-State der Einheiten-App. Nicht gespeichert: Stufe (Start immer Unterstufe). Farbschema/Beamer: @lern/ui LernApp.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { QUANTITY, unitsFor } from "@lern/units";
import type { Help } from "./practice.ts";

export type Tab = "convert" | "practice" | "quiz";
export type Stufe = "us" | "os";

export interface Conv { qty: string; value: string; from: string; to: string }
export interface PracticeSettings { topic: string; help: Help }

interface State {
  tab: Tab;
  stufe: Stufe;
  conv: Conv;
  board: boolean;
  practice: Record<Stufe, PracticeSettings>;
  setTab: (t: Tab) => void;
  setStufe: (s: Stufe) => void;
  setConv: (p: Partial<Conv>) => void;
  setBoard: (b: boolean) => void;
  setPractice: (s: Stufe, p: Partial<PracticeSettings>) => void;
}

export const START: Conv = { qty: "len", value: "0,1", from: "m", to: "cm" };
export const PRACTICE_START: Record<Stufe, PracticeSettings> = { us: { topic: "len", help: "table" }, os: { topic: "olen", help: "scale" } };

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
  practice: PRACTICE_START,
  setTab: tab => set({ tab }),
  setStufe: stufe => {
    const s = get(), os = stufe === "os";
    set({ stufe, conv: valid(s.conv, os) ? s.conv : START });
  },
  setConv: p => set({ conv: { ...get().conv, ...p } }),
  setBoard: board => set({ board }),
  setPractice: (st, p) => set({ practice: { ...get().practice, [st]: { ...get().practice[st], ...p } } }),
}), {
  name: "einheiten-v1",
  version: 2,
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ conv: s.conv, board: s.board, practice: s.practice }),
  // v1: Tab „Stellenwerttafel“ gibt es nicht mehr (die Tafel ist jetzt live beim Umrechnen und Üben)
  migrate: old => { const { table: _, ...rest } = (old ?? {}) as Record<string, unknown>; return rest as Partial<State>; },
  // Start immer Unterstufe: gespeicherte Oberstufen-Umrechnungen zurücksetzen
  merge: (saved, current) => {
    const m = { ...current, ...(saved as Partial<State>) };
    if (!valid(m.conv, false)) m.conv = START;
    m.practice = { ...PRACTICE_START, ...(m.practice ?? {}) };
    return m;
  },
}));
