// Reinstoffe und Gemische im Teilchenmodell – reine Daten und Logik (getestet in mixtures.test.ts).
// Zählen: Teilchen (Moleküle bzw. einzelne Atome), Reinstoffe (verschiedene Teilchensorten), davon Verbindungen
// (mehr als eine Atomsorte) und Elemente (nur eine Atomsorte – hier immer als einzelne Atome: Edelgase, Metalle),
// dazu die Atomsorten (Elemente im PSE).

import { BY_SYMBOL, parseFormula, speciesName } from "@lern/chem";

/** fluessig: Teilchen dicht, unten im Gefäß · gas: weit verteilt, geschlossenes Gefäß · fest: Gitter · modell: frei verteilt */
export type State = "fluessig" | "gas" | "fest" | "modell";

/**
 * Anordnung vor dem Mischen („Mischen“ zeigt den Vorgang):
 * kristall – ein Stoff als Kristall am Boden (löst sich auf) · schicht – ein Stoff als Schicht obenauf ·
 * gasraum – ein Gas über der Flüssigkeit (löst sich darin) · getrennt – jeder Stoff für sich (Gase mit Trennwänden, Metalle als Blöcke)
 */
export type Before = "kristall" | "schicht" | "gasraum" | "getrennt";

export interface Example {
  id: string;
  title: string;
  /** Stoffe mit Teilchenzahl */
  items: [f: string, n: number][];
  state: State;
  /** Stoffe, die sich nicht mischen und oben schwimmen (Öl) */
  floats?: string[];
  before?: Before;
  /** der Stoff, der vorher als Kristall, Schicht oder Gas liegt */
  solute?: string;
  /** Art des Gemischs (Tag) */
  type?: string;
  /** kurze Angabe zur Vereinfachung im Modell */
  note?: string;
}

/**
 * Zehn Beispiele. Zweimal gleich viele Verbindungen wie Elemente (Schutzgas, Modellgemisch), achtmal verschieden viele;
 * Teilchenzahlen alle verschieden. Elemente nur als einzelne Atome (He, Ar, Cu, Zn).
 */
export const EXAMPLES: Example[] = [
  { id: "wasser", title: "Wasser", items: [["H2O", 16]], state: "fluessig" },
  { id: "helium", title: "Helium im Luftballon", items: [["He", 12]], state: "gas" },
  { id: "zucker", title: "Zuckerwasser", items: [["H2O", 17], ["C12H22O11", 6]], state: "fluessig", before: "kristall", solute: "C12H22O11", type: "Lösung", note: "im Modell viel mehr Zucker" },
  { id: "alkohol", title: "Alkohol und Wasser", items: [["H2O", 13], ["C2H5OH", 8]], state: "fluessig", before: "schicht", solute: "C2H5OH", type: "Lösung" },
  { id: "sprudel", title: "Sprudelwasser", items: [["H2O", 20], ["CO2", 5]], state: "fluessig", before: "gasraum", solute: "CO2", type: "Lösung", note: "im Modell viel mehr Kohlenstoffdioxid" },
  { id: "oel", title: "Öl und Wasser", items: [["H2O", 14], ["C12H26", 5]], state: "fluessig", floats: ["C12H26"], note: "Öl vereinfacht als Dodecan" },
  { id: "messing", title: "Messing", items: [["Cu", 12], ["Zn", 8]], state: "fest", before: "getrennt", type: "Legierung" },
  { id: "erdgas", title: "Erdgas", items: [["CH4", 11], ["C2H6", 2], ["CO2", 1]], state: "gas", before: "getrennt", type: "Gasgemisch", note: "Anteile vereinfacht" },
  { id: "schutzgas", title: "Schutzgas zum Schweißen", items: [["Ar", 9], ["CO2", 2]], state: "gas", before: "getrennt", type: "Gasgemisch" },
  { id: "modell", title: "Modellgemisch", items: [["He", 3], ["Ar", 4], ["CO2", 5], ["CH4", 6]], state: "modell", before: "getrennt", type: "Gasgemisch" },
];

/** Element: Reinstoff aus nur einer Atomsorte */
export const isElement = (f: string) => Object.keys(parseFormula(f)).length === 1;
export const atomCount = (f: string) => Object.values(parseFormula(f)).reduce((a, b) => a + b, 0);
export const elementName = (el: string) => BY_SYMBOL[el]?.name ?? el;
export const nameOf = (f: string) => speciesName(f);
/** Name ohne Zusatz in Klammern: „Saccharose (Zucker)“ → „Saccharose“ */
export const shortName = (f: string) => nameOf(f).replace(/ \(.*\)$/, "");

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

export type MixKind = "element" | "verbindung" | "homogen" | "heterogen";
/** Einteilung: Reinstoff (Element/Verbindung) oder Gemisch (homogen/heterogen) */
export function mixKind(ex: Pick<Example, "items" | "floats">): MixKind {
  const a = analyse(ex.items);
  if (a.reinstoff) return isElement(a.stoffe[0]) ? "element" : "verbindung";
  return ex.floats?.length ? "heterogen" : "homogen";
}
export const MIX_LABEL: Record<MixKind, string[]> = {
  element: ["Reinstoff", "Element"], verbindung: ["Reinstoff", "Verbindung"],
  homogen: ["Gemisch", "homogen"], heterogen: ["Gemisch", "heterogen"],
};

/**
 * Die fünf Arten von Teilchenbildern: ein Element, eine Verbindung, Gemisch aus Elementen, aus Verbindungen,
 * aus Element(en) und Verbindung(en).
 */
export type PictureKind = "E" | "V" | "GE" | "GV" | "GEV";
export function pictureKind(items: [string, number][]): PictureKind {
  const a = analyse(items);
  if (a.reinstoff) return a.elemente.length ? "E" : "V";
  if (!a.verbindungen.length) return "GE";
  if (!a.elemente.length) return "GV";
  return "GEV";
}
export const PICTURE_LABEL: Record<PictureKind, string> = {
  E: "Element", V: "Verbindung", GE: "Gemisch aus Elementen", GV: "Gemisch aus Verbindungen", GEV: "Gemisch aus Element und Verbindung",
};
