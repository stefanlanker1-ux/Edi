// Reinstoffe und Gemische im Teilchenmodell – reine Daten und Logik (getestet in mixtures.test.ts).
// Zählen: Teilchen (Moleküle bzw. einzelne Atome), Reinstoffe (verschiedene Teilchensorten), davon Verbindungen
// (mehr als eine Atomsorte) und Elemente (nur eine Atomsorte – auch O₂, O₃), dazu die Atomsorten (Elemente im PSE).

import { BY_SYMBOL, parseFormula, speciesName } from "@lern/chem";

export type State = "fluessig" | "gas" | "modell";

export interface Example {
  id: string;
  title: string;
  /** Stoffe mit Teilchenzahl */
  items: [f: string, n: number][];
  /** flüssig: Teilchen unten im Becher · gas: geschlossenes Gefäß, Teilchen überall · modell: frei verteilt, ohne Füllung */
  state: State;
  /** Stoffe, die sich nicht mischen und oben schwimmen (Öl) */
  floats?: string[];
  /** kurze Angabe zur Vereinfachung im Modell */
  note?: string;
}

/**
 * Zehn Beispiele. Zweimal gleich viele Verbindungen wie Elemente (Modellgemisch, Aquarium),
 * achtmal verschieden viele (aus dem Alltag) – Teilchenzahlen alle verschieden.
 */
export const EXAMPLES: Example[] = [
  { id: "modell", title: "Modellgemisch", items: [["H2O", 3], ["H2O2", 3], ["O3", 2], ["C", 3]], state: "modell" },
  { id: "wasser", title: "Wasser", items: [["H2O", 9]], state: "fluessig" },
  { id: "helium", title: "Helium im Luftballon", items: [["He", 7]], state: "gas" },
  { id: "sprudel", title: "Sprudelwasser", items: [["H2O", 7], ["CO2", 3]], state: "fluessig" },
  { id: "zucker", title: "Zuckerwasser", items: [["H2O", 10], ["C12H22O11", 2]], state: "fluessig" },
  { id: "alkohol", title: "Alkohol und Wasser", items: [["H2O", 9], ["C2H5OH", 4]], state: "fluessig" },
  { id: "oel", title: "Öl und Wasser", items: [["H2O", 10], ["C12H26", 4]], state: "fluessig", floats: ["C12H26"], note: "Öl vereinfacht als Dodecan" },
  { id: "luft", title: "Luft", items: [["N2", 10], ["O2", 3], ["Ar", 1], ["CO2", 1]], state: "gas", note: "Anteile vereinfacht" },
  { id: "erdgas", title: "Erdgas", items: [["CH4", 6], ["C2H6", 1], ["N2", 1]], state: "gas", note: "Anteile vereinfacht" },
  { id: "aquarium", title: "Wasser im Aquarium", items: [["H2O", 4], ["O2", 2]], state: "fluessig", note: "mit gelöstem Sauerstoff" },
];

/** Element: Reinstoff aus nur einer Atomsorte (auch Moleküle wie O₂, O₃) */
export const isElement = (f: string) => Object.keys(parseFormula(f)).length === 1;
export const atomCount = (f: string) => Object.values(parseFormula(f)).reduce((a, b) => a + b, 0);
export const elementName = (el: string) => BY_SYMBOL[el]?.name ?? el;
export const nameOf = (f: string) => speciesName(f);

export interface Analysis {
  teilchen: number;
  /** alle Atome zusammen (typischer Zählfehler) */
  atome: number;
  stoffe: string[];
  verbindungen: string[];
  elemente: string[];
  /** Atomsorten in Reihenfolge des ersten Auftretens */
  atomsorten: string[];
  reinstoff: boolean;
}

export function analyse(items: [string, number][]): Analysis {
  const stoffe = items.map(([f]) => f);
  const atomsorten: string[] = [];
  for (const f of stoffe) for (const el of Object.keys(parseFormula(f))) if (!atomsorten.includes(el)) atomsorten.push(el);
  return {
    teilchen: items.reduce((s, [, n]) => s + n, 0),
    atome: items.reduce((s, [f, n]) => s + n * atomCount(f), 0),
    stoffe,
    verbindungen: stoffe.filter(f => !isElement(f)),
    elemente: stoffe.filter(isElement),
    atomsorten,
    reinstoff: stoffe.length === 1,
  };
}

export type MixKind = "element" | "verbindung" | "homogen" | "heterogen" | "gemisch";
/** Einteilung: Reinstoff (Element/Verbindung) oder Gemisch (homogen/heterogen; Modellgemisch ohne Angabe) */
export function mixKind(ex: Pick<Example, "items" | "state" | "floats">): MixKind {
  const a = analyse(ex.items);
  if (a.reinstoff) return isElement(a.stoffe[0]) ? "element" : "verbindung";
  if (ex.state === "modell") return "gemisch";
  return ex.floats?.length ? "heterogen" : "homogen";
}
export const MIX_LABEL: Record<MixKind, string[]> = {
  element: ["Reinstoff", "Element"], verbindung: ["Reinstoff", "Verbindung"],
  homogen: ["Gemisch", "homogen"], heterogen: ["Gemisch", "heterogen"], gemisch: ["Gemisch"],
};
