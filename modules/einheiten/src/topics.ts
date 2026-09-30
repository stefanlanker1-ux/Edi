// Themen (Größen und Einheitengruppen) für die Quizaufgaben.

import { QUANTITY, LADDERS } from "@lern/units";

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
