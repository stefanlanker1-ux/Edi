// Reinstoffe und Gemische im Teilchenmodell – reine Daten und Logik (getestet in mixtures.test.ts).
// Zählen: Teilchen (Moleküle bzw. einzelne Atome), Reinstoffe (verschiedene Teilchensorten), davon Verbindungen
// (mehr als eine Atomsorte) und Elemente (nur eine Atomsorte – hier immer als einzelne Atome: Edelgase, Metalle),
// dazu die Atomsorten (Elemente im PSE).

import { BY_SYMBOL, parseFormula, speciesName } from "@lern/chem";
import { tr } from "@lern/i18n";

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
  /** Stoffe, die dabei in kleiner Menge neu entstehen (Sprudel: Kohlensäure) */
  forms?: string[];
}

/**
 * Zehn Beispiele mit je 110–240 Teilchen (mit der Lupe betrachtet). Zweimal gleich viele Verbindungen wie Elemente
 * (Schutzgas, Modellgemisch), achtmal verschieden viele; Teilchenzahlen alle verschieden. Elemente nur als einzelne Atome.
 */
export const EXAMPLES: Example[] = [
  { id: "wasser", title: tr("Wasser", "Water"), items: [["H2O", 160]], state: "fluessig" },
  { id: "helium", title: tr("Helium im Luftballon", "Helium in a balloon"), items: [["He", 120]], state: "gas" },
  { id: "zucker", title: tr("Zuckerwasser", "Sugar water"), items: [["H2O", 170], ["C12H22O11", 30]], state: "fluessig", before: "kristall", solute: "C12H22O11", type: tr("Lösung", "Solution"), note: tr("im Modell viel mehr Zucker", "far more sugar in the model") },
  { id: "alkohol", title: tr("Alkohol und Wasser", "Alcohol and water"), items: [["H2O", 130], ["C2H5OH", 80]], state: "fluessig", before: "schicht", solute: "C2H5OH", type: tr("Lösung", "Solution") },
  { id: "sprudel", title: tr("Sprudelwasser", "Sparkling water"), items: [["H2O", 200], ["CO2", 40]], state: "fluessig", before: "gasraum", solute: "CO2", type: tr("Lösung", "Solution"), note: tr("im Modell viel mehr Kohlendioxid", "far more carbon dioxide in the model"), forms: ["H2CO3"] },
  { id: "oel", title: tr("Öl und Wasser", "Oil and water"), items: [["H2O", 140], ["C12H26", 50]], state: "fluessig", floats: ["C12H26"], note: tr("Öl vereinfacht als Dodecan", "oil simplified as dodecane") },
  { id: "messing", title: tr("Messing", "Brass"), items: [["Cu", 108], ["Zn", 72]], state: "fest", before: "getrennt", type: tr("Legierung", "Alloy") },
  { id: "erdgas", title: tr("Erdgas", "Natural gas"), items: [["CH4", 110], ["C2H6", 20], ["CO2", 10]], state: "gas", before: "getrennt", type: tr("Gasgemisch", "Gas mixture"), note: tr("Anteile vereinfacht", "proportions simplified") },
  { id: "schutzgas", title: tr("Schutzgas zum Schweißen", "Shielding gas for welding"), items: [["Ar", 90], ["CO2", 20]], state: "gas", before: "getrennt", type: tr("Gasgemisch", "Gas mixture") },
  { id: "modell", title: tr("Modellgemisch", "Model mixture"), items: [["He", 25], ["Ar", 35], ["CO2", 45], ["CH4", 65]], state: "modell", before: "getrennt", type: tr("Gasgemisch", "Gas mixture") },
];

/**
 * Müsli: ein Gemenge aus sichtbaren Stücken – ohne Teilchenbild. Das Gemisch-Konzept gilt auch für Bestandteile,
 * die selbst aus vielen Stoffen bestehen (Flocken, Rosinen, Nüsse).
 */
export interface Part { id: "flocke" | "rosine" | "nuss"; name: string; n: number }
export const MUESLI = {
  id: "muesli", title: tr("Müsli", "Muesli"), type: tr("Gemenge", "Coarse mixture"), note: tr("keine Teilchen – sichtbare Stücke", "no particles – visible pieces"),
  parts: [{ id: "flocke", name: tr("Haferflocken", "Oat flakes"), n: 16 }, { id: "rosine", name: tr("Rosinen", "Raisins"), n: 10 }, { id: "nuss", name: tr("Haselnüsse", "Hazelnuts"), n: 8 }] as Part[],
};
/** alle Beispiele in „Probieren“: die Teilchen-Beispiele, dann Müsli */
export const EXAMPLE_COUNT = EXAMPLES.length + 1;

/** kleinere Fassung eines Beispiels (ein Zehntel der Teilchen) – für Bilder im Quiz und in Erklärkarten */
export const small = (items: [string, number][]): [string, number][] => items.map(([f, n]) => [f, Math.max(1, Math.round(n / 10))]);

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
export const MIX_LABEL: Record<MixKind, string[]> = tr({
  element: ["Reinstoff", "Element"], verbindung: ["Reinstoff", "Verbindung"],
  homogen: ["Gemisch", "homogen"], heterogen: ["Gemisch", "heterogen"],
}, {
  element: ["Pure substance", "Element"], verbindung: ["Pure substance", "Compound"],
  homogen: ["Mixture", "homogeneous"], heterogen: ["Mixture", "heterogeneous"],
});

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
export const PICTURE_LABEL: Record<PictureKind, string> = tr({
  E: "Element", V: "Verbindung", GE: "Gemisch aus Elementen", GV: "Gemisch aus Verbindungen", GEV: "Gemisch aus Element und Verbindung",
}, {
  E: "Element", V: "Compound", GE: "Mixture of elements", GV: "Mixture of compounds", GEV: "Mixture of element and compound",
});
