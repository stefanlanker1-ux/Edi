// App-State (zustand). Gespeichert werden Baukasten und Einstellungen; das Quiz hat seinen eigenen Store (quiz/store.ts).
// Bewusst NICHT gespeichert: Stufe und Animation → die App startet immer in der Unterstufe, ohne kreisende Elektronen
// (Farbschema/Beamer: @lern/ui LernApp, ebenfalls nicht gespeichert).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { standardNeutrons } from "@lern/chem";
import type { Stufe } from "./quiz/tasks.ts";

export type Tab = "build" | "pse" | "quiz";

interface State {
  tab: Tab;
  stufe: Stufe;
  build: { Z: number; N: number; E: number };
  selectedZ: number;
  animate: boolean;
  orbitalColors: boolean;
  showScheme: boolean;

  setTab: (t: Tab) => void;
  setStufe: (s: Stufe) => void;
  setBuild: (b: Partial<State["build"]>) => void;
  buildElement: (Z: number, charge?: number) => void;
  select: (Z: number) => void;
  setOpt: (o: Partial<Pick<State, "animate" | "orbitalColors" | "showScheme">>) => void;
}

/** höchste Ordnungszahl im Baukasten und in der Elementsuche zum Bauen (Konfiguration und Bohrmodell bis Radon) */
export const maxZFor = (s: Stufe) => (s === "us" ? 20 : 86);
/** höchste Ordnungszahl im Periodensystem (Tab „Periodensystem“): Oberstufe mit 7. Periode bis Oganesson */
export const exploreMaxZ = (s: Stufe) => (s === "us" ? 20 : 118);

export const useApp = create<State>()(persist((set, get) => ({
  tab: "build",
  stufe: "us",
  build: { Z: 6, N: 6, E: 6 },
  selectedZ: 6,
  animate: false,
  orbitalColors: false,
  showScheme: true,

  setTab: tab => set({ tab }),
  setStufe: stufe => {
    const s = get(), max = maxZFor(stufe);
    set({
      stufe,
      build: s.build.Z > max ? { Z: 6, N: 6, E: 6 } : s.build,
      selectedZ: s.selectedZ > exploreMaxZ(stufe) ? 6 : s.selectedZ,
    });
  },
  setBuild: b => set({ build: { ...get().build, ...b } }),
  buildElement: (Z, charge = 0) => set({ build: { Z, N: standardNeutrons(Z), E: Z - charge }, tab: "build" }),
  select: selectedZ => set({ selectedZ }),
  setOpt: o => set(o),
}), {
  name: "atombau-v3",
  version: 1,
  storage: createJSONStorage(() => localStorage),
  // Beim Start ist immer die Unterstufe aktiv → gespeicherte Elemente > Z 20 zurücksetzen
  merge: (saved, current) => {
    const m = { ...current, ...(saved as Partial<State>) };
    if (m.build.Z > maxZFor(current.stufe)) m.build = { Z: 6, N: 6, E: 6 };
    if (m.selectedZ > exploreMaxZ(current.stufe)) m.selectedZ = 6;
    return m;
  },
  partialize: s => ({ build: s.build, selectedZ: s.selectedZ, orbitalColors: s.orbitalColors, showScheme: s.showScheme }),
}));
