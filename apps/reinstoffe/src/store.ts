// App-State „Reinstoffe und Gemische“. Farbschema/Beamer: @lern/ui LernApp (nicht gespeichert).
// Gespeichert: Inhalt des Bechers und ob geschüttelt wurde. Trennergebnis und Meldungen gelten nur für den Moment.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { STOFF, heat, isAlloy, separate, type Fraction, type Item, type Method } from "@lern/chem";

export type Tab = "mix" | "quiz";

export interface Note { text: string; tone: "ok" | "signal" | "neutral" }

interface State {
  tab: Tab;
  items: Item[];
  /** geschüttelt: Feststoffe bzw. Tröpfchen verteilt; sonst abgesetzt */
  shaken: boolean;
  /** Ergebnis eines Trennverfahrens (Bruchteile zur Auswahl) */
  fractions: { method: Method; list: Fraction[]; gone?: string; before: Item[] } | null;
  note: Note | null;
  setTab: (t: Tab) => void;
  toggle: (id: string) => void;
  remove: (i: number) => void;
  clear: () => void;
  setShaken: (v: boolean) => void;
  trennen: (m: Method) => void;
  pick: (f: Fraction) => void;
  back: () => void;
  erhitzen: () => void;
}

const valid = (items: unknown): items is Item[] =>
  Array.isArray(items) && items.every(x => (typeof x === "string" ? !!STOFF[x] : Array.isArray((x as { alloy?: unknown }).alloy) && (x as { alloy: string[] }).alloy.every(id => !!STOFF[id])));

export const useApp = create<State>()(persist((set, get) => ({
  tab: "mix",
  items: ["h2o", "sand"],
  shaken: false,
  fractions: null,
  note: null,
  setTab: tab => set({ tab }),
  // Stoff dazu oder wieder heraus (jeder Stoff höchstens einmal)
  toggle: id => {
    const { items } = get();
    set({ items: items.includes(id) ? items.filter(x => x !== id) : [...items, id], fractions: null, note: null });
  },
  remove: i => set({ items: get().items.filter((_, k) => k !== i), fractions: null, note: null }),
  clear: () => set({ items: [], shaken: false, fractions: null, note: null }),
  setShaken: shaken => set({ shaken, note: null }),
  trennen: method => {
    const { items, shaken } = get();
    const r = separate(items, method, !shaken);
    if (!r.ok) return set({ note: { text: r.why, tone: "signal" }, fractions: null });
    set({ fractions: { method, list: r.fractions, gone: r.gone, before: items }, note: null });
  },
  pick: f => set({ items: f.items, fractions: null, shaken: false, note: null }),
  back: () => set({ fractions: null, note: null }),
  erhitzen: () => {
    const r = heat(get().items);
    if (!r.ok) return set({ note: { text: r.why, tone: "neutral" } });
    set({ items: r.items, shaken: false, fractions: null, note: { text: r.what, tone: "ok" } });
  },
}), {
  name: "reinstoffe-v1",
  version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: s => ({ items: s.items, shaken: s.shaken }),
  merge: (saved, current) => {
    const m = { ...current, ...(saved as Partial<State>) };
    if (!valid(m.items)) m.items = current.items;
    m.items = m.items.filter((x, i, a) => isAlloy(x) || a.indexOf(x) === i);
    return m;
  },
}));
