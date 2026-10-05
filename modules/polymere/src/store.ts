// App-State der Polymere. Gespeichert (polymere-v1): gewählte Art, Ansatz je Art, Ansicht (Atome | Kügelchen), Anzeige-Schalter, Vorhersagen.
// Der Ablauf selbst (Aktionen) wird nicht gespeichert – beim Öffnen beginnt der Ansatz von vorn.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { isStep, isVinyl, METHODS, type Art } from "./chem/data.ts";
import type { Recipe } from "./chem/mech/types.ts";

export type Tab = "quiz" | "bauen";
export type View = "atome" | "kugeln";

export const DEFAULT_RECIPES: Record<Art, Recipe> = {
  poly: { art: "poly", a: "styrol", method: "dbpo" },
  kond: { art: "kond", a: "terephthalsaeure", b: "ethandiol" },
  add: { art: "add", a: "hdi", b: "butandiol" },
};

interface State {
  tab: Tab;
  /** gewählte Art; null = Auswahl am Anfang */
  art: Art | null;
  recipes: Record<Art, Recipe>;
  view: View;
  /** Bausteine farbig hinterlegen, freie Elektronenpaare zeigen */
  halos: boolean;
  lp: boolean;
  /** Atom-Ansicht: vor einem Schritt vorhersagen, was passiert */
  setTab: (t: Tab) => void;
  setArt: (a: Art | null) => void;
  setRecipe: (r: Recipe) => void;
  setView: (v: View) => void;
  setHalos: (b: boolean) => void;
  setLp: (b: boolean) => void;
}

const validRecipe = (r: Recipe | undefined, art: Art): Recipe => {
  const d = DEFAULT_RECIPES[art];
  if (!r || r.art !== art) return d;
  if (art === "poly") {
    if (!isVinyl(r.a) || (r.b && !isVinyl(r.b)) || !METHODS.some(m => m.id === r.method)) return d;
  } else if (!isStep(r.a) || (r.b && !isStep(r.b))) return d;
  return r;
};

export const useApp = create<State>()(persist(set => ({
  tab: "bauen",
  art: null,
  recipes: DEFAULT_RECIPES,
  view: "atome",
  halos: true,
  lp: true,
  setTab: tab => set({ tab }),
  setArt: art => set({ art }),
  setRecipe: r => set(s => ({ recipes: { ...s.recipes, [r.art]: r } })),
  setView: view => set({ view }),
  setHalos: halos => set({ halos }),
  setLp: lp => set({ lp }),
}), {
  name: "polymere-v1",
  version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ art: s.art, recipes: s.recipes, view: s.view, halos: s.halos, lp: s.lp }),
  merge: (saved, current) => {
    const m = { ...current, ...(saved as Partial<State>) };
    if (m.art !== null && m.art !== "poly" && m.art !== "kond" && m.art !== "add") m.art = null;
    m.recipes = { poly: validRecipe(m.recipes?.poly, "poly"), kond: validRecipe(m.recipes?.kond, "kond"), add: validRecipe(m.recipes?.add, "add") };
    if (m.view !== "atome" && m.view !== "kugeln") m.view = "atome";
    return m;
  },
}));
