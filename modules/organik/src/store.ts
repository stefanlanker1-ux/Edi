// App-State der Nomenklatur. Gespeichert (organik-v1): Zeichnung, Stift, Ansicht, ob der Name gezeigt wird, Farbe.
// Start: Gerüstformel mit Farbe und einem Beispiel (2-Methyl-3-oxohexansäure), Name sichtbar.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { El, Mol } from "./chem/mol.ts";
import type { RingKind } from "./chem/edit.ts";
import type { View } from "./components/MolSvg.tsx";
import { exampleMol } from "./chem/examples.ts";

/** Startbeispiel: 2-Methyl-3-oxohexansäure */
export const START = "OC(=O)C(C)C(=O)CCC";

export type Tab = "zeichnen" | "quiz";
export type Pen = El | RingKind;
export type Mode = "add" | "swap" | "erase";

interface State {
  tab: Tab;
  mol: Mol;
  past: Mol[];
  pen: Pen;
  /** fünfter Stift in der Leiste (zuletzt aus „Mehr“ gewählt) */
  extra: Pen;
  mode: Mode;
  view: View;
  /** Name sichtbar (nach „Benennen“, bis „Neu“) */
  shown: boolean;
  /** „Farbe“: Teile des Namens und der Formel gleich gefärbt */
  color: boolean;
  setColor: (v: boolean) => void;
  setTab: (t: Tab) => void;
  setMol: (m: Mol) => void;
  undo: () => void;
  clear: () => void;
  load: (m: Mol) => void;
  setPen: (p: Pen) => void;
  setMode: (m: Mode) => void;
  setView: (v: View) => void;
  show: (v: boolean) => void;
}

const MAX_PAST = 60;

export const useApp = create<State>()(persist(set => ({
  tab: "zeichnen",
  mol: exampleMol(START),
  past: [],
  pen: "C",
  extra: "Cl",
  mode: "add",
  view: "skelett",
  shown: true,
  color: true,
  setColor: color => set({ color }),
  setTab: tab => set({ tab }),
  setMol: mol => set(s => ({ mol, past: [...s.past, s.mol].slice(-MAX_PAST) })),
  undo: () => set(s => (s.past.length ? { mol: s.past[s.past.length - 1], past: s.past.slice(0, -1) } : {})),
  clear: () => set(s => ({ mol: { atoms: [], bonds: [] }, past: s.mol.atoms.length ? [...s.past, s.mol].slice(-MAX_PAST) : s.past, shown: false, mode: "add" })),
  load: mol => set(s => ({ mol, past: [...s.past, s.mol].slice(-MAX_PAST), shown: false, mode: "add" })),
  setPen: pen => set(s => ({ pen, extra: ["C", "O", "N", "S"].includes(pen) ? s.extra : pen, mode: s.mode === "erase" ? "add" : s.mode })),
  setMode: mode => set({ mode }),
  setView: view => set({ view }),
  show: shown => set({ shown }),
}), {
  name: "organik-v1",
  version: 2,
  // ältere Stände: einmal auf den neuen Start (Gerüst, Farbe); leere Zeichnung → Beispiel
  migrate: (saved, v) => {
    const st = (saved ?? {}) as Partial<State>;
    if (v < 2) {
      const empty = !st.mol?.atoms?.length;
      return { ...st, view: "skelett", color: true, ...(empty ? { mol: exampleMol(START), shown: true } : {}) };
    }
    return st;
  },
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ mol: s.mol, pen: s.pen, extra: s.extra, view: s.view, shown: s.shown, color: s.color }),
  merge: (saved, current) => {
    const m = { ...current, ...(saved as Partial<State>) };
    if (!m.mol || !Array.isArray(m.mol.atoms) || !Array.isArray(m.mol.bonds)) m.mol = { atoms: [], bonds: [] };
    if (m.view !== "lewis" && m.view !== "skelett") m.view = "skelett";
    return m;
  },
}));
