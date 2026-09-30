// App-State der Säuren/Basen-App. Farbschema/Beamer: @lern/ui LernApp (nicht gespeichert).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { INDICATOR_BY_ID, dilute } from "@lern/chem";

export type Tab = "ph" | "quiz";

interface State {
  tab: Tab;
  /** eingestellter pH-Wert 0–14 */
  ph: number;
  /** gewählter Indikator (id aus INDICATORS) */
  indicator: string;
  /** Name des Alltagsstoffs, dessen pH gerade eingestellt ist (Anzeige), sonst leer */
  substance: string;
  setTab: (t: Tab) => void;
  setPh: (ph: number, substance?: string) => void;
  setIndicator: (id: string) => void;
  /** mit der 10-fachen Menge Wasser verdünnen: pH rückt um 1 Richtung 7 */
  water: () => void;
}

export const useApp = create<State>()(persist((set, get) => ({
  tab: "ph",
  ph: 7,
  indicator: "universal",
  substance: "Reines Wasser",
  setTab: tab => set({ tab }),
  setPh: (ph, substance = "") => set({ ph: Math.max(0, Math.min(14, Math.round(ph))), substance }),
  setIndicator: indicator => set({ indicator }),
  water: () => set({ ph: dilute(get().ph, 1), substance: "" }),
}), {
  name: "saeuren-basen-v1",
  version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ ph: s.ph, indicator: s.indicator, substance: s.substance }),
  merge: (saved, current) => {
    const m = { ...current, ...(saved as Partial<State>) };
    if (!INDICATOR_BY_ID[m.indicator]) m.indicator = "universal";
    if (!Number.isInteger(m.ph) || m.ph < 0 || m.ph > 14) { m.ph = 7; m.substance = "Reines Wasser"; }
    return m;
  },
}));
