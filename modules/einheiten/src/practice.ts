// Üben (modular): Aufgaben je Thema und passende Tipps. Reine Logik, getestet in practice.test.ts.
//   Unterstufe: Hilfe über Stellenwerttafel → Pfeilkette → ohne Hilfe
//   Oberstufe:  Hilfe über die Vorsilben-Skala → ohne Hilfe

import { QUANTITY, LADDERS, solve, parseQ, parseAnswer, fmt, isTerminating, eq, div, placeValue, pvPlace, prefixStep, type Q } from "@lern/units";

export type Help = "table" | "arrows" | "scale" | "none";
export interface PTask { value: string; from: string; to: string }
export interface Topic {
  id: string;
  name: string;
  os: boolean;
  /** Einheitengruppen – Aufgaben nur innerhalb einer Gruppe */
  groups: string[][];
  /** Stellenwerttafel (Unterstufe) */
  table?: string[];
  maxSteps: number;
}

export const HELPS: Record<"us" | "os", { id: Help; label: string; short: string }[]> = {
  us: [
    { id: "table", label: "Mit Stellenwerttafel", short: "Tafel" },
    { id: "arrows", label: "Mit Pfeilen", short: "Pfeile" },
    { id: "none", label: "Ohne Hilfe", short: "Allein" },
  ],
  os: [
    { id: "scale", label: "Mit Vorsilben-Skala", short: "Skala" },
    { id: "none", label: "Ohne Hilfe", short: "Allein" },
  ],
};

const VOL_US = ["m³", "hl", "dm³", "l", "dl", "cl", "cm³", "ml", "mm³"];
export const TOPICS: Topic[] = [
  { id: "len", name: "Länge", os: false, groups: [LADDERS.len.slice(0, 5)], table: QUANTITY.len.table, maxSteps: 3 },
  { id: "mass", name: "Masse", os: false, groups: [LADDERS.mass.slice(0, 5)], table: QUANTITY.mass.table, maxSteps: 2 },
  { id: "area", name: "Fläche", os: false, groups: [LADDERS.area], table: QUANTITY.area.table, maxSteps: 2 },
  { id: "vol", name: "Volumen", os: false, groups: [VOL_US], table: QUANTITY.vol.table, maxSteps: 2 },
  { id: "olen", name: "Länge", os: true, groups: [["km", "m", "dm", "cm", "mm", "µm", "nm"]], maxSteps: 9 },
  { id: "oarea", name: "Fläche & Volumen", os: true, groups: [["km²", "m²", "dm²", "cm²", "mm²"], ["m³", "dm³", "l", "cm³", "ml", "mm³", "µl"]], maxSteps: 9 },
  { id: "omass", name: "Masse", os: true, groups: [["kg", "g", "mg", "µg"]], maxSteps: 9 },
  { id: "oelec", name: "Elektrik", os: true, groups: [["kV", "V", "mV"], ["A", "mA", "µA"], ["MΩ", "kΩ", "Ω"]], maxSteps: 9 },
  { id: "oenergy", name: "Energie & Leistung", os: true, groups: [["GJ", "MJ", "kJ", "J"], ["GW", "MW", "kW", "W", "mW"], ["kWh", "Wh"]], maxSteps: 9 },
  { id: "otime", name: "Zeit & Frequenz", os: true, groups: [["s", "ms", "µs", "ns"], ["GHz", "MHz", "kHz", "Hz"]], maxSteps: 9 },
];
export const topicsFor = (os: boolean) => TOPICS.filter(t => t.os === os);

const US_VALUES = ["3,45", "13,7", "16,7", "7,11", "6,731", "0,5", "2,5", "1,2", "12", "7", "250", "0,75", "45", "3,5", "0,08", "4,2", "120", "0,6", "5", "18", "2,05"];
const OS_VALUES = ["2,5", "3", "0,5", "12", "450", "0,02", "7,5", "1,2", "80", "0,003", "4", "650", "0,25", "15"];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
/** kurze, endende Zahl? */
function tidy(v: Q, maxDigits: number, maxDec: number) {
  if (!isTerminating(v)) return false;
  const [i, f = ""] = fmt(v, { group: false }).text.split(",");
  return f.length <= maxDec && (i + f).replace(/^0+/, "").length <= maxDigits;
}

/** Ist die Aufgabe für das Thema geeignet? (Ergebnis kurz, passt in die Tafel bzw. auf die Skala) */
export function suitable(t: PTask, topic: Topic): boolean {
  const v = parseQ(t.value);
  if (!v || t.from === t.to) return false;
  const r = solve(v, t.from, t.to).result;
  if (topic.os) return !!prefixStep(t.from, t.to) && tidy(r, 9, 10);
  if (!tidy(r, 7, 4)) return false;
  const pv = placeValue(v, t.from, t.to, topic.table!);
  return pv.fits && pvPlace(v, t.from, topic.table!).fits && pvPlace(r, t.to, topic.table!).fits;
}

/** Eine Aufgabe zum Thema (nicht dieselbe wie `avoid`) */
export function makeTask(topic: Topic, avoid: PTask[] = []): PTask {
  const values = topic.os ? OS_VALUES : US_VALUES;
  for (let tries = 0; tries < 400; tries++) {
    const g = pick(topic.groups);
    const i = Math.floor(Math.random() * g.length), j = Math.floor(Math.random() * g.length);
    if (i === j || Math.abs(i - j) > topic.maxSteps) continue;
    const t = { value: pick(values), from: g[i], to: g[j] };
    if (avoid.some(a => a.value === t.value && a.from === t.from && a.to === t.to)) continue;
    if (suitable(t, topic)) return t;
  }
  return { value: "1", from: topic.groups[0][0], to: topic.groups[0][1] };
}

export const makeRound = (topic: Topic, n = 8): PTask[] => {
  const list: PTask[] = [];
  while (list.length < n) list.push(makeTask(topic, list));
  return list;
};

export const resultOf = (t: PTask) => solve(t.value, t.from, t.to).result;
/** true/false, null = keine Zahl */
export function check(t: PTask, input: string): boolean | null {
  const vs = parseAnswer(input, t.to);
  return vs.length ? vs.some(v => eq(v, resultOf(t))) : null;
}

/** Ziffernfolge ohne führende/abschließende Nullen und ohne Komma: 0,0345 → „345“ */
const sig = (v: Q) => fmt(v, { group: false }).text.replace(/[−,]/g, "").replace(/^0+/, "").replace(/0+$/, "");

/** Gezielter Tipp nach einer falschen Antwort – kurz, ohne Erklärsätze */
export function tipFor(t: PTask, input: string): string {
  const a = parseAnswer(input, t.to)[0] ?? null;
  const s = solve(t.value, t.from, t.to);
  const op = s.bigger ? "mal" : "geteilt";
  if (!a) return "Zahl mit Komma eingeben, z. B. 3,45.";
  if (eq(a, div(parseQ(t.value)!, s.rel.F)) && !s.equal) return `Falsche Richtung: ${t.from} → ${t.to} heißt ${op}.`;
  if (eq(a, parseQ(t.value)!)) return `Die Zahl ändert sich: ${t.from} → ${t.to} heißt ${op}.`;
  if (sig(a) === sig(s.result)) return "Ziffern stimmen – Komma prüfen.";
  return `${t.from} → ${t.to}: ${op}. 1 ${s.bigger ? t.from : t.to} = ? ${s.bigger ? t.to : t.from}`;
}
