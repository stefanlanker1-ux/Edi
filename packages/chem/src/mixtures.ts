// Reinstoffe und Gemische: Stoffregal, Mischen (Phasen, homogen/heterogen, Gemischtyp), Zählen (Phasen / Elemente / Verbindungen)
// (Phasen / Elemente / Verbindungen), Trennverfahren und Erhitzen (Eisen + Schwefel → Eisensulfid, Metalle → Legierung,
// Zucker verkohlt). Reine Logik ohne UI; Formeln ASCII (H2O), Anzeige über toSubscript.

import { parseFormula } from "./reactions.ts";

export type Aggregat = "s" | "l" | "g";
export const AGG_NAMES: Record<Aggregat, string> = { s: "fest", l: "flüssig", g: "gasförmig" };

export interface Stoff {
  id: string;
  name: string;
  /** Formel ASCII (Öl: Hauptbestandteil Triolein) */
  formula: string;
  state: Aggregat;
  /** Verhalten mit Wasser: fest/gasförmig „loest“ bzw. „unloeslich“, flüssig „mischbar“ bzw. „unmischbar“ */
  water: "loest" | "unloeslich" | "mischbar" | "unmischbar";
  /** Flüssigkeit leichter als Wasser (schwimmt oben) */
  light?: boolean;
  metal?: boolean;
  magnetic?: boolean;
  /** Siedetemperatur in °C (Flüssigkeiten, für Destillieren) */
  boil?: number;
  /** Aussehen im Becher (kurz) und Farbtoken-Name (app.css: --st-<look>) */
  look: string;
  color: string;
  /** Teilchen: Ionen (zerfallen beim Lösen) oder Molekül/Atom */
  ions?: [string, string, number];
  /** vereinfacht als ein Stoff behandelt (Öl) */
  note?: string;
  /** nur als Ergebnis (nicht im Regal) */
  product?: boolean;
}

const S = (id: string, name: string, formula: string, state: Aggregat, water: Stoff["water"], look: string, color: string, more: Partial<Stoff> = {}): Stoff =>
  ({ id, name, formula, state, water, look, color, ...more });

/** Stoffregal: 10 Elemente und 10 Verbindungen (Reinstoffe) */
export const STOFFE: Stoff[] = [
  // Elemente
  S("fe", "Eisen", "Fe", "s", "unloeslich", "graues Pulver", "fe", { metal: true, magnetic: true }),
  S("cu", "Kupfer", "Cu", "s", "unloeslich", "rotbraunes Pulver", "cu", { metal: true }),
  S("zn", "Zink", "Zn", "s", "unloeslich", "graues Pulver", "zn", { metal: true }),
  S("sn", "Zinn", "Sn", "s", "unloeslich", "silbriges Pulver", "sn", { metal: true }),
  S("s", "Schwefel", "S", "s", "unloeslich", "gelbes Pulver", "s"),
  S("c", "Kohlenstoff", "C", "s", "unloeslich", "schwarzes Pulver (Holzkohle)", "c"),
  S("o2", "Sauerstoff", "O2", "g", "unloeslich", "farbloses Gas", "gas"),
  S("n2", "Stickstoff", "N2", "g", "unloeslich", "farbloses Gas", "gas"),
  S("h2", "Wasserstoff", "H2", "g", "unloeslich", "farbloses Gas", "gas"),
  S("he", "Helium", "He", "g", "unloeslich", "farbloses Gas", "gas"),
  // Verbindungen
  S("h2o", "Wasser", "H2O", "l", "mischbar", "farblos, klar", "water", { boil: 100 }),
  S("ethanol", "Alkohol (Ethanol)", "C2H5OH", "l", "mischbar", "farblos, klar", "ethanol", { boil: 78 }),
  S("oel", "Öl", "C57H104O6", "l", "unmischbar", "gelb, klar", "oel", { light: true, boil: 300, note: "Speiseöl besteht vor allem aus Fetten wie Triolein – hier vereinfacht als ein Stoff." }),
  S("nacl", "Kochsalz", "NaCl", "s", "loest", "weiße Kristalle", "salt", { ions: ["Na", "Cl", 1] }),
  S("zucker", "Zucker", "C12H22O11", "s", "loest", "weiße Kristalle", "sugar"),
  S("cuso4", "Kupfersulfat", "CuSO4", "s", "loest", "blaue Kristalle", "cuso4", { ions: ["Cu", "SO4", 1] }),
  S("sand", "Sand (Quarz)", "SiO2", "s", "unloeslich", "beiges Pulver", "sand"),
  S("kalk", "Kalk", "CaCO3", "s", "unloeslich", "weißes Pulver", "kalk"),
  S("co2", "Kohlenstoffdioxid", "CO2", "g", "loest", "farbloses Gas", "gas"),
  S("fes", "Eisensulfid", "FeS", "s", "unloeslich", "schwarzgraue Brocken", "fes"),
];
export const STOFF: Record<string, Stoff> = Object.fromEntries(STOFFE.map(s => [s.id, s]));

/** Element = besteht aus nur einer Atomsorte (auch O₂, H₂: Moleküle aus gleichen Atomen) */
export const isElement = (s: Stoff) => Object.keys(parseFormula(s.formula)).length === 1;

// ── Inhalt des Bechers ───────────────────────────────────────────────────────

/** Legierung: zusammengeschmolzene Metalle (fest, homogen) */
export interface Alloy { alloy: string[] }
export type Item = string | Alloy;
export const isAlloy = (x: Item): x is Alloy => typeof x !== "string";

const ALLOY_NAMES: [string[], string][] = [[["cu", "zn"], "Messing"], [["cu", "sn"], "Bronze"], [["c", "fe"], "Stahl"]];
export function alloyName(parts: string[]) {
  const key = [...parts].sort().join("+");
  return ALLOY_NAMES.find(([p]) => [...p].sort().join("+") === key)?.[1] ?? "Legierung";
}

export type MixType = "loesung" | "legierung" | "gasgemisch" | "emulsion" | "suspension" | "gemenge" | "schaum" | "rauch" | "nebel";
export const MIX_TYPES: Record<MixType, { name: string; homogen: boolean; states: string; example: string }> = {
  loesung: { name: "Lösung", homogen: true, states: "s/l, l/l, g/l", example: "Salzwasser" },
  legierung: { name: "Legierung", homogen: true, states: "s/s", example: "Messing" },
  gasgemisch: { name: "Gasgemisch", homogen: true, states: "g/g", example: "Luft" },
  emulsion: { name: "Emulsion", homogen: false, states: "l/l", example: "Milch" },
  suspension: { name: "Suspension", homogen: false, states: "s/l", example: "Schlamm" },
  gemenge: { name: "Gemenge", homogen: false, states: "s/s", example: "Granit" },
  schaum: { name: "Schaum", homogen: false, states: "g/l", example: "Schlagobers" },
  rauch: { name: "Rauch", homogen: false, states: "s/g", example: "Rauch" },
  nebel: { name: "Nebel", homogen: false, states: "l/g", example: "Nebel" },
};
export const HOMOGEN_TYPES: MixType[] = ["loesung", "legierung", "gasgemisch"];
export const HETEROGEN_TYPES: MixType[] = ["emulsion", "suspension", "gemenge", "schaum", "rauch", "nebel"];

export interface Phase {
  state: Aggregat;
  /** Stoffe in dieser Phase (Legierung: ihre Metalle) */
  parts: string[];
  /** gelöste Stoffe (Teil von parts) */
  dissolved: string[];
  alloy?: boolean;
  /** Bodensatz/Schicht: Reihenfolge von unten nach oben */
  role: "gas" | "wasser" | "oel" | "alkohol" | "fest" | "legierung";
}

export interface MixInfo {
  items: Item[];
  pure: boolean;
  /** Reinstoff: Element oder Verbindung */
  pureKind?: "element" | "verbindung";
  phases: Phase[];
  homogen: boolean;
  types: { type: MixType; states: string }[];
  counts: { phases: number; elements: number; compounds: number };
  /** Alltagsname der Mischung (Salzwasser, Messing …) */
  label?: string;
}

const flat = (items: Item[]) => items.flatMap(x => (isAlloy(x) ? x.alloy : [x]));

const LABELS: [string[], string][] = [
  [["h2o", "nacl"], "Salzwasser"], [["h2o", "zucker"], "Zuckerwasser"], [["h2o", "co2"], "Sprudelwasser"], [["h2o", "cuso4"], "Kupfersulfatlösung"],
  [["ethanol", "h2o"], "Alkohol-Wasser-Gemisch"], [["h2o", "oel"], "Öl und Wasser"], [["h2o", "sand"], "Sand in Wasser"], [["h2o", "kalk"], "Kalk in Wasser"],
  [["n2", "o2"], "wie Luft"], [["fe", "s"], "Eisen-Schwefel-Gemenge"], [["nacl", "sand"], "Salz-Sand-Gemenge"],
];

/** Mischen: welche Phasen entstehen, homogen oder heterogen, welcher Gemischtyp, und die Zählung Phasen / Elemente / Verbindungen */
export function mix(items: Item[]): MixInfo {
  const ids = items.filter((x): x is string => !isAlloy(x));
  const alloys = items.filter(isAlloy);
  const st = (id: string) => STOFF[id];
  const water = ids.includes("h2o");
  const phases: Phase[] = [];

  // flüssige Phasen: Wasser und mit Wasser Mischbares (Alkohol) bilden eine Phase; Öl eine eigene
  const miscible = ids.filter(id => st(id).state === "l" && st(id).water === "mischbar");
  const polar: Phase | null = miscible.length ? { state: "l", parts: [...miscible], dissolved: [], role: water ? "wasser" : "alkohol" } : null;
  for (const id of ids.filter(id => st(id).state === "l" && st(id).water === "unmischbar")) phases.push({ state: "l", parts: [id], dissolved: [], role: "oel" });

  // Feststoffe: in Wasser Lösliches löst sich (nur mit Wasser); alles andere bildet je eine eigene Phase
  const solids: Phase[] = [];
  for (const id of ids.filter(id => st(id).state === "s")) {
    if (water && st(id).water === "loest") { polar!.parts.push(id); polar!.dissolved.push(id); }
    else solids.push({ state: "s", parts: [id], dissolved: [], role: "fest" });
  }
  for (const a of alloys) solids.push({ state: "s", parts: [...a.alloy], dissolved: [], alloy: true, role: "legierung" });

  // Gase: Kohlenstoffdioxid löst sich in Wasser; alle übrigen bilden zusammen eine Gasphase (geschlossenes Gefäß)
  const gases = ids.filter(id => st(id).state === "g");
  const free: string[] = [];
  for (const id of gases) {
    if (water && st(id).water === "loest") { polar!.parts.push(id); polar!.dissolved.push(id); }
    else free.push(id);
  }
  if (polar) phases.push(polar);
  phases.push(...solids);
  if (free.length) phases.push({ state: "g", parts: free, dissolved: [], role: "gas" });

  const all = flat(items);
  const pure = items.length === 1 && !alloys.length;
  const elements = all.filter(id => isElement(st(id))).length;
  const types: MixInfo["types"] = [];
  if (!pure) {
    if (alloys.length) types.push({ type: "legierung", states: "s/s" });
    if (polar) {
      const d = polar.dissolved.map(st);
      if (d.some(s => s.state === "s")) types.push({ type: "loesung", states: "s/l" });
      if (polar.parts.filter(id => st(id).state === "l").length > 1) types.push({ type: "loesung", states: "l/l" });
      if (d.some(s => s.state === "g")) types.push({ type: "loesung", states: "g/l" });
    }
    if (free.length > 1) types.push({ type: "gasgemisch", states: "g/g" });
    const liquids = phases.filter(p => p.state === "l").length;
    const loose = solids.filter(p => !p.alloy).length;
    if (liquids > 1) types.push({ type: "emulsion", states: "l/l" });
    if (liquids && loose) types.push({ type: "suspension", states: "s/l" });
    if (!liquids && solids.length > 1) types.push({ type: "gemenge", states: "s/s" });
  }
  const key = [...ids].sort().join("+");
  const label = alloys.length === 1 && !ids.length ? alloyName(alloys[0].alloy) : LABELS.find(([p]) => [...p].sort().join("+") === key)?.[1];
  return {
    items, pure, pureKind: pure ? (isElement(st(ids[0])) ? "element" : "verbindung") : undefined,
    phases, homogen: !pure && phases.length === 1, types,
    counts: { phases: phases.length, elements, compounds: all.length - elements },
    label,
  };
}

/** Einteilung in Worten: „Element“, „Verbindung“, „homogenes Gemisch“, „heterogenes Gemisch“ */
export const classText = (m: MixInfo) => (m.pure ? (m.pureKind === "element" ? "Element" : "Verbindung") : m.homogen ? "homogenes Gemisch" : "heterogenes Gemisch");

// ── Trennen ──────────────────────────────────────────────────────────────────

export type Method = "magnet" | "filtrieren" | "dekantieren" | "scheidetrichter" | "eindampfen" | "destillieren";
export const METHODS: Record<Method, { name: string; idea: string }> = {
  magnet: { name: "Magnet", idea: "Eisen ist magnetisch" },
  filtrieren: { name: "Filtrieren", idea: "Ungelöstes bleibt im Filter" },
  dekantieren: { name: "Dekantieren", idea: "Flüssigkeit vom Bodensatz abgießen" },
  scheidetrichter: { name: "Scheidetrichter", idea: "nicht mischbare Flüssigkeiten" },
  eindampfen: { name: "Eindampfen", idea: "Flüssigkeit verdampft, Gelöstes bleibt" },
  destillieren: { name: "Destillieren", idea: "unterschiedliche Siedetemperaturen" },
};

export interface Fraction { label: string; items: Item[] }
export type SepResult = { ok: true; fractions: Fraction[]; gone?: string } | { ok: false; why: string };

const names = (ids: string[]) => ids.map(id => STOFF[id].name).join(", ");

/** Trennverfahren anwenden: Bruchteile (weiter verwendbar) oder Begründung, warum es nicht passt */
export function separate(items: Item[], method: Method, settled = true): SepResult {
  if (items.length < 2 && !(items.length === 1 && isAlloy(items[0]))) return { ok: false, why: "Ein Reinstoff lässt sich so nicht trennen." };
  const m = mix(items);
  const ids = items.filter((x): x is string => !isAlloy(x));
  const liquid = m.phases.filter(p => p.state === "l");
  const loose = m.phases.filter(p => p.role === "fest").flatMap(p => p.parts);
  const polar = m.phases.find(p => p.role === "wasser" || p.role === "alkohol");
  const gas = m.phases.find(p => p.role === "gas");
  const rest = (drop: string[]) => items.filter(x => isAlloy(x) || !drop.includes(x));
  switch (method) {
    case "magnet": {
      if (!ids.includes("fe")) {
        if (items.some(x => isAlloy(x) && x.alloy.includes("fe"))) return { ok: false, why: "Das Eisen steckt im Stahl (Legierung) – der Magnet zieht alles mit." };
        if (ids.includes("fes")) return { ok: false, why: "Im Eisensulfid ist das Eisen gebunden – nicht mehr magnetisch." };
        return { ok: false, why: "Kein Eisen dabei – nur Eisen (Nickel, Cobalt) ist magnetisch." };
      }
      return { ok: true, fractions: [{ label: "am Magnet", items: ["fe"] }, { label: "Rest", items: rest(["fe"]) }].filter(f => f.items.length) };
    }
    case "filtrieren":
    case "dekantieren": {
      if (!liquid.length) return { ok: false, why: "Keine Flüssigkeit – zum Filtrieren und Dekantieren braucht es eine." };
      if (!loose.length && !m.phases.some(p => p.alloy)) {
        return { ok: false, why: polar?.dissolved.length ? `Gelöstes (${names(polar.dissolved)}) geht mit der Flüssigkeit mit.` : "Nichts Festes darin." };
      }
      if (method === "dekantieren" && !settled) return { ok: false, why: "Erst absetzen lassen – dann die Flüssigkeit abgießen." };
      const solidItems = items.filter(x => isAlloy(x) || loose.includes(x));
      const fluid = items.filter(x => !isAlloy(x) && !loose.includes(x) && !gas?.parts.includes(x));
      return { ok: true, fractions: [{ label: method === "filtrieren" ? "im Filter" : "Bodensatz", items: solidItems }, { label: method === "filtrieren" ? "Filtrat" : "abgegossen", items: fluid }],
        gone: gas ? `${names(gas.parts)} entweicht` : undefined };
    }
    case "scheidetrichter": {
      if (liquid.length < 2) return { ok: false, why: liquid.length ? "Nur eine flüssige Phase – alles ist mischbar." : "Keine Flüssigkeit." };
      const oil = m.phases.filter(p => p.role === "oel").flatMap(p => p.parts);
      return { ok: true, fractions: [{ label: "unten", items: items.filter(x => isAlloy(x) || !oil.includes(x)).filter(x => isAlloy(x) || !gas?.parts.includes(x)) }, { label: "oben", items: oil }] };
    }
    case "eindampfen": {
      if (!polar) return { ok: false, why: "Keine Flüssigkeit zum Verdampfen." };
      const solidsLeft = items.filter(x => isAlloy(x) || STOFF[x].state === "s");
      const gone = [...polar.parts.filter(id => STOFF[id].state !== "s"), ...m.phases.filter(p => p.role === "oel").flatMap(p => p.parts), ...(gas?.parts ?? [])];
      if (!solidsLeft.length) return { ok: false, why: "Nichts Festes gelöst – alles verdampft, es bleibt nichts zurück." };
      return { ok: true, fractions: [{ label: "bleibt zurück", items: solidsLeft }], gone: `${names(gone)} verdampft` };
    }
    case "destillieren": {
      if (!polar) return { ok: false, why: "Keine Lösung zum Destillieren." };
      const liq = polar.parts.filter(id => STOFF[id].state === "l").sort((a, b) => STOFF[a].boil! - STOFF[b].boil!);
      if (polar.parts.length < 2) return { ok: false, why: `${names(polar.parts)} ist allein – es gibt nichts abzutrennen.` };
      const first = liq[0];
      const back = items.filter(x => x !== first && (isAlloy(x) || STOFF[x].state !== "g"));
      const gone = [...polar.dissolved.filter(id => STOFF[id].state === "g"), ...(gas?.parts ?? [])];
      return { ok: true, fractions: [{ label: `Destillat (siedet bei ${STOFF[first].boil} °C)`, items: [first] }, { label: "Rückstand", items: back }].filter(f => f.items.length),
        gone: gone.length ? `${names(gone)} entweicht` : undefined };
    }
  }
}

// ── Erhitzen ─────────────────────────────────────────────────────────────────

export type HeatResult = { ok: true; items: Item[]; what: string; kind: "reaktion" | "legierung" | "zersetzung" } | { ok: false; why: string };

/** Erhitzen: Eisen + Schwefel reagieren, Metalle schmelzen zur Legierung zusammen, Zucker verkohlt */
export function heat(items: Item[]): HeatResult {
  const ids = items.filter((x): x is string => !isAlloy(x));
  if (ids.some(id => STOFF[id].state === "l")) return { ok: false, why: "Die Flüssigkeit verdampft nur – zum Trennen: Eindampfen oder Destillieren." };
  if (ids.includes("fe") && ids.includes("s")) {
    return { ok: true, items: [...items.filter(x => x !== "fe" && x !== "s"), "fes"], what: "Eisen + Schwefel → Eisensulfid (neuer Stoff, glüht auf)", kind: "reaktion" };
  }
  if (ids.includes("zucker")) {
    return { ok: true, items: [...items.filter(x => x !== "zucker"), ...(ids.includes("c") ? [] : ["c"])], what: "Zucker zersetzt sich: Kohlenstoff bleibt, Wasser entweicht als Dampf", kind: "zersetzung" };
  }
  const metals = ids.filter(id => STOFF[id].metal || (id === "c" && ids.includes("fe")));
  const others = ids.filter(id => !metals.includes(id) && STOFF[id].state !== "g");
  if (metals.length + items.filter(isAlloy).length >= 2 && !others.length) {
    const parts = [...new Set([...metals, ...items.filter(isAlloy).flatMap(a => a.alloy)])].sort();
    const gases = ids.filter(id => STOFF[id].state === "g");
    return { ok: true, items: [{ alloy: parts }, ...gases], what: `Metalle schmelzen zusammen: ${alloyName(parts)} (Legierung)`, kind: "legierung" };
  }
  return { ok: false, why: "Nichts passiert – die Stoffe werden nur heiß." };
}

// ── Alltagsbeispiele (Quiz) ──────────────────────────────────────────────────

export interface Everyday {
  name: string;
  /** Reinstoff: Element oder Verbindung; sonst Gemischtyp */
  kind: "element" | "verbindung" | MixType;
  formula?: string;
  /** Bestandteile / kurze Begründung */
  why: string;
  /** Fehlvorstellung, die hier typisch ist (Schlüssel aus misconceptions.ts der App) */
  trap?: string;
}

export const EVERYDAY: Everyday[] = [
  { name: "destilliertes Wasser", kind: "verbindung", formula: "H2O", why: "nur Wassermoleküle H₂O" },
  { name: "Sauerstoff", kind: "element", formula: "O2", why: "nur O₂-Moleküle aus gleichen Atomen" },
  { name: "Stickstoff", kind: "element", formula: "N2", why: "nur N₂-Moleküle aus gleichen Atomen" },
  { name: "Gold (24 Karat)", kind: "element", formula: "Au", why: "nur Goldatome" },
  { name: "Kupferdraht", kind: "element", formula: "Cu", why: "nur Kupferatome" },
  { name: "Diamant", kind: "element", formula: "C", why: "nur Kohlenstoffatome" },
  { name: "Helium im Ballon", kind: "element", formula: "He", why: "nur Heliumatome" },
  { name: "Kochsalz", kind: "verbindung", formula: "NaCl", why: "Na⁺ und Cl⁻ fest verbunden" },
  { name: "Zucker", kind: "verbindung", formula: "C12H22O11", why: "nur Zuckermoleküle C₁₂H₂₂O₁₁" },
  { name: "Kohlenstoffdioxid", kind: "verbindung", formula: "CO2", why: "nur CO₂-Moleküle" },
  { name: "reiner Alkohol (Ethanol)", kind: "verbindung", formula: "C2H5OH", why: "nur Ethanolmoleküle" },
  { name: "Leitungswasser", kind: "loesung", why: "Wasser mit gelösten Mineralstoffen", trap: "klar-rein" },
  { name: "Mineralwasser mit Kohlensäure", kind: "loesung", why: "CO₂ und Mineralstoffe in Wasser gelöst", trap: "klar-rein" },
  { name: "Meerwasser", kind: "loesung", why: "Salze in Wasser gelöst", trap: "natuerlich-rein" },
  { name: "Himbeersaft (klar)", kind: "loesung", why: "Zucker, Farb- und Aromastoffe in Wasser gelöst", trap: "farbe-heterogen" },
  { name: "Tee", kind: "loesung", why: "Farb- und Aromastoffe in Wasser gelöst", trap: "farbe-heterogen" },
  { name: "Essig", kind: "loesung", why: "Essigsäure in Wasser (l/l)", trap: "klar-rein" },
  { name: "Wein", kind: "loesung", why: "Alkohol, Zucker und mehr in Wasser", trap: "klar-rein" },
  { name: "Luft", kind: "gasgemisch", why: "Stickstoff, Sauerstoff, Argon, CO₂ …", trap: "natuerlich-rein" },
  { name: "Erdgas", kind: "gasgemisch", why: "vor allem Methan, dazu Ethan und andere Gase", trap: "ein-name-ein-stoff" },
  { name: "Messing", kind: "legierung", why: "Kupfer und Zink zusammengeschmolzen", trap: "ein-name-ein-stoff" },
  { name: "Bronze", kind: "legierung", why: "Kupfer und Zinn zusammengeschmolzen", trap: "ein-name-ein-stoff" },
  { name: "Stahl", kind: "legierung", why: "Eisen mit wenig Kohlenstoff", trap: "ein-name-ein-stoff" },
  { name: "Schmuckgold (18 Karat)", kind: "legierung", why: "Gold mit Silber und Kupfer", trap: "ein-name-ein-stoff" },
  { name: "Milch", kind: "emulsion", why: "Fetttröpfchen in Wasser", trap: "einheitlich-aussehend" },
  { name: "Mayonnaise", kind: "emulsion", why: "Öltröpfchen in Wasser (mit Eigelb)", trap: "einheitlich-aussehend" },
  { name: "Salatdressing", kind: "emulsion", why: "Öl und Essig, geschüttelt" },
  { name: "Handcreme", kind: "emulsion", why: "Öl- und Wassertröpfchen", trap: "einheitlich-aussehend" },
  { name: "Orangensaft mit Fruchtfleisch", kind: "suspension", why: "feste Fruchtstückchen in Saft" },
  { name: "Schlamm", kind: "suspension", why: "Erde in Wasser" },
  { name: "Kakao", kind: "suspension", why: "Kakaopulver in Milch – setzt sich ab" },
  { name: "Wandfarbe", kind: "suspension", why: "Farbpigmente in Flüssigkeit" },
  { name: "Granit", kind: "gemenge", why: "Feldspat, Quarz und Glimmer (Körner sichtbar)" },
  { name: "Müsli", kind: "gemenge", why: "Flocken, Nüsse, Rosinen" },
  { name: "Sand-Salz-Gemisch", kind: "gemenge", why: "zwei Feststoffe nebeneinander" },
  { name: "Eisen-Schwefel-Pulver", kind: "gemenge", why: "Eisen- und Schwefelkörner nebeneinander" },
  { name: "Schlagobers", kind: "schaum", why: "Luftbläschen in Obers" },
  { name: "Seifenschaum", kind: "schaum", why: "Luftbläschen in Seifenwasser" },
  { name: "Bierschaum", kind: "schaum", why: "CO₂-Bläschen in Bier" },
  { name: "Rauch", kind: "rauch", why: "feste Rußteilchen in Luft" },
  { name: "Staub in der Luft", kind: "rauch", why: "feste Teilchen in Luft" },
  { name: "Nebel", kind: "nebel", why: "Wassertröpfchen in Luft" },
  { name: "Wolken", kind: "nebel", why: "Wassertröpfchen in Luft" },
];
