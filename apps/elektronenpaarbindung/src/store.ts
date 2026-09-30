// App-State. Nicht gespeichert: Stufe, Teilladungen/Dipol, Keilstrichformel (Farbschema/Beamer: @lern/ui LernApp)
// (Start immer hell, Unterstufe, Dipol aus, normale Strichformel).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Molecule } from "@lern/chem";
import { empty } from "./edit.ts";

export type Tab = "build" | "quiz";
export type Stufe = "us" | "os";

interface State {
  tab: Tab;
  stufe: Stufe;
  mol: Molecule;
  showLonePairs: boolean;
  /** Teilladungen δ+/δ− und Dipolpfeil (Oberstufe) – am Anfang immer aus */
  showDeltas: boolean;
  /** Strichformel: normal (Raster) oder Keilstrichformel (räumlich) */
  wedge: boolean;
  setTab: (t: Tab) => void;
  setStufe: (s: Stufe) => void;
  setMol: (m: Molecule) => void;
  setShowLonePairs: (v: boolean) => void;
  setShowDeltas: (v: boolean) => void;
  setWedge: (v: boolean) => void;
}

export const useApp = create<State>()(persist(set => ({
  tab: "build",
  stufe: "us",
  mol: empty(),
  showLonePairs: true,
  showDeltas: false,
  wedge: false,
  setTab: tab => set({ tab }),
  setStufe: stufe => set({ stufe }),
  setMol: mol => set({ mol }),
  setShowLonePairs: showLonePairs => set({ showLonePairs }),
  setShowDeltas: showDeltas => set({ showDeltas }),
  setWedge: wedge => set({ wedge }),
}), {
  name: "elektronenpaar-v1",
  version: 2,
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ mol: s.mol, showLonePairs: s.showLonePairs }),
  // v1 hat showDeltas gespeichert – jetzt beginnt der Dipol immer ausgeschaltet
  migrate: old => { const { showDeltas: _, ...rest } = (old ?? {}) as Record<string, unknown>; return rest as Partial<State>; },
}));
