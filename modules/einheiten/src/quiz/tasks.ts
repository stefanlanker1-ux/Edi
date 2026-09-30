// Quiz-Aufgaben zum Umrechnen (reine Daten, damit Runden gespeichert werden können).
// Eingabe-Aufgaben speichern nur Zahl und Einheiten – Lösung und Rechenweg entstehen beim Anzeigen mit solve().

import {
  QUANTITY, LADDERS, solve, parseQ, parseAnswer, fmt, fmtSci, isTerminating, eq, mul, div, q, pow10, toNumber, unitSi, unitName, prefixStep, supExp, type Q, type Solution,
} from "@lern/units";
import { buildRound, mc, pick, shuffle, rnd, weakTypes, type BaseTask, type LevelKey, type McTask, type QuizLevel, type TypeStats } from "@lern/quiz";
import type { Stufe } from "../store.ts";
import { topicsFor } from "../topics.ts";

export interface Conv { value: string; from: string; to: string }
export type Task =
  | (McTask & { conv?: Conv })
  | (BaseTask & { kind: "input"; value: string; from: string; to: string; round?: number; table?: string[] });

const T = (v: Q) => fmt(v).text;
const nf = (n: number) => fmt(q(n)).text;
const ratio = (a: string, b: string) => div(unitSi(a), unitSi(b));
/** Zahl mit höchstens `maxDec` Nachkommastellen und kurzer Ziffernfolge? */
function tidy(v: Q, maxDec = 6, maxDigits = 9) {
  if (!isTerminating(v)) return false;
  const s = fmt(v, { group: false }).text.replace("−", "");
  const [i, f = ""] = s.split(",");
  return f.length <= maxDec && (i.replace(/^0+/, "") + f).replace(/^0+/, "").length <= maxDigits;
}

/** Werte, wie sie in Schulbüchern vorkommen */
const VALUES = ["1", "2", "3", "4", "5", "7", "8", "12", "15", "25", "36", "40", "75", "120", "250", "300", "450", "600", "0,5", "0,8", "0,25", "0,06", "1,2", "1,5", "2,5", "3,45", "4,8", "6,05", "12,5", "0,3", "0,75", "0,04", "8,3", "15,6", "0,125"];

/** Eingabe-Aufgabe erzeugen, deren Ergebnis „schön“ ist (endet, nicht zu lang) */
function inputTask(from: string, to: string, opts: { round?: number; values?: string[]; maxDec?: number; table?: string[] } = {}): Task {
  for (let tries = 0; tries < 60; tries++) {
    const value = pick(opts.values ?? VALUES);
    const s = solve(value, from, to);
    if (!opts.round && !tidy(s.result, opts.maxDec ?? 6)) continue;
    return makeInput(value, from, to, s, opts.round, opts.table);
  }
  const s = solve("1", from, to);
  return makeInput("1", from, to, s, isTerminating(s.result) ? undefined : 2, opts.table);
}

const qText = (v: Q) => {
  if (isTerminating(v)) return T(v);
  const inv = div(q(1), v);
  return isTerminating(inv) ? `1/${T(inv)}` : `≈ ${T(v)}`;
};
const supP = (p?: number) => ((p ?? 1) === 2 ? "²" : (p ?? 1) === 3 ? "³" : "");
/** Herleitung als Text: „1 m/s = 1 m / 1 s = 0,001 km / 1/3600 h = 3,6 km/h“ */
export function rowsText(s: Solution): string {
  return s.rel.rows.map(r => {
    if (r.unit) return `${qText(r.coef)} ${r.unit}`;
    const t = (x: { v?: Q; sym: string; pow?: number }) => (x.v ? ((x.pow ?? 1) > 1 ? `(${qText(x.v)} ${x.sym})${supP(x.pow)}` : `${qText(x.v)} ${x.sym}`) : x.sym);
    const num = (r.num ?? []).map(t).join(" · "), den = (r.den ?? []).map(t).join(" · ");
    return (eq(r.coef, q(1)) ? "" : `${qText(r.coef)} · `) + (num || "1") + (den ? ` / ${den}` : "");
  }).join(" = ");
}
const compoundUnit = (u: string) => /[/·]/.test(u) || ["Pa", "hPa", "kPa", "bar", "mbar", "J", "kJ", "MJ", "Wh", "kWh", "kcal", "C", "Ah", "mAh", "Ω", "kΩ", "MΩ", "W", "kW", "MW", "PS"].includes(u);

function makeInput(value: string, from: string, to: string, s: Solution, round?: number, table?: string[]): Task {
  if (round !== undefined && tidy(s.result, round)) round = undefined; // exaktes Ergebnis: nicht runden
  const res = round !== undefined ? `≈ ${fmt(s.result, { digits: round }).text}` : T(s.result);
  const how = s.divisor ? `${value} : ${T(s.divisor)}` : `${value} · ${T(s.rel.F)}`;
  const rel = `1 ${from} = ${isTerminating(s.rel.F) ? T(s.rel.F) : s.divisor ? `1 : ${T(s.divisor)}` : `≈ ${T(s.rel.F)}`} ${to}`;
  return {
    kind: "input", value, from, to, ...(round !== undefined ? { round } : {}), ...(table ? { table } : {}),
    prompt: `Rechne um: **${value} ${from}** = ? **${to}**${round !== undefined ? ` (auf ${round} Dezimalstellen runden)` : ""}`,
    hint: compoundUnit(from) || compoundUnit(to)
      ? `Ersetze jede Einheit durch ihren Wert in der neuen Einheit: 1 ${from} = ? ${to}`
      : s.bigger ? `Große → kleine Einheit: Die Zahl wird größer. Wie viele ${to} sind 1 ${from}?` : `Kleine → große Einheit: Die Zahl wird kleiner. Wie viele ${from} sind 1 ${to}?`,
    explain: `${compoundUnit(from) || compoundUnit(to) ? rowsText(s) : rel} → ${how} = **${res} ${to}**.${s.shift ? ` Komma um ${Math.abs(s.shift)} ${Math.abs(s.shift) === 1 ? "Stelle" : "Stellen"} nach ${s.shift > 0 ? "rechts" : "links"}.` : ""}`,
  };
}

/** zwei Einheiten einer Treppe mit höchstens maxSteps Stufen Abstand */
function pair(units: string[], maxSteps: number, minSteps = 1): [string, string] {
  for (;;) {
    const i = rnd(0, units.length - 1), j = rnd(0, units.length - 1);
    const d = Math.abs(i - j);
    if (d >= minSteps && d <= maxSteps) return [units[i], units[j]];
  }
}
const US_LEN = LADDERS.len.slice(0, 5), US_MASS = LADDERS.mass.slice(0, 5), AREA = LADDERS.area, VOL = ["m³", "dm³", "cm³", "mm³"], LIT = LADDERS.liter.slice(0, 5);

// ── Unterstufe ───────────────────────────────────────────────────────────────
const convLen = () => { const [a, b] = pair(US_LEN, 3); return inputTask(a, b); };
const convMass = () => { const [a, b] = pair(US_MASS, 2); return inputTask(a, b); };
const convArea = () => { const [a, b] = pair(AREA, 2); return inputTask(a, b, { maxDec: 6 }); };
function convVol(): Task {
  const r = Math.random();
  if (r < 0.4) { const [a, b] = pair(VOL, 1); return inputTask(a, b); }
  if (r < 0.75) { const [a, b] = pair(LIT, 2); return inputTask(a, b); }
  const [a, b] = pick([["l", "cm³"], ["ml", "cm³"], ["dm³", "l"], ["m³", "l"], ["l", "dm³"], ["cm³", "ml"], ["hl", "dm³"]] as [string, string][]);
  return Math.random() < 0.5 ? inputTask(a, b) : inputTask(b, a);
}
function convTime(): Task {
  const [a, b] = pick([["h", "min"], ["min", "s"], ["d", "h"], ["min", "h"], ["s", "min"], ["h", "d"], ["h", "s"]] as [string, string][]);
  const big = toNumber(ratio(a, b)) > 1;
  const values = big ? ["1,5", "2", "3", "0,5", "0,25", "2,5", "4", "0,75", "1,2"] : ["90", "30", "150", "45", "180", "210", "6", "12", "36", "72", "120"];
  return inputTask(a, b, { values });
}

/** Mal oder geteilt – und durch wie viel? */
function ruleTask(os: boolean): Task {
  const units = pick([US_LEN, US_MASS, AREA, VOL]);
  const [a, b] = pair(units, os ? 3 : 2);
  const s = solve("1", a, b);
  const k = s.bigger ? s.rel.F : div(q(1), s.rel.F);
  const right = `${s.bigger ? "·" : ":"} ${T(k)}`;
  const kk = [div(k, q(10)), mul(k, q(10))].filter(x => toNumber(x) >= 10);
  const wrongs = [`${s.bigger ? ":" : "·"} ${T(k)}`, ...kk.map(x => `${s.bigger ? "·" : ":"} ${T(x)}`), ...kk.map(x => `${s.bigger ? ":" : "·"} ${T(x)}`)];
  const value = pick(["3,4", "250", "0,6", "12", "7,5"]);
  return {
    ...mc(right, wrongs),
    conv: { value, from: a, to: b },
    prompt: `Du rechnest **${value} ${a}** in **${b}** um. Wie rechnest du?`,
    hint: "Große → kleine Einheit: mal. Kleine → große Einheit: geteilt. Zähle die Stufen auf der Einheitentreppe.",
    explain: `1 ${s.bigger ? a : b} = ${T(k)} ${s.bigger ? b : a} → von ${a} nach ${b} **${right}**.`,
  };
}

/** Umrechnungszahl: 1 m² = ? cm² */
function factorTask(kinds: string[][]): Task {
  const units = pick(kinds);
  const [a0, b0] = pair(units, 2);
  const [a, b] = toNumber(ratio(a0, b0)) >= 1 ? [a0, b0] : [b0, a0];
  const F = ratio(a, b);
  const opts = [-2, -1, 1, 2].map(k => T(mul(F, pow10(k)))).filter(x => !x.startsWith("0"));
  return {
    ...mc(T(F), opts),
    conv: { value: "1", from: a, to: b },
    prompt: `Setze die **Umrechnungszahl** ein: 1 ${a} = ? ${b}`,
    hint: units === AREA ? "Flächen: jede Stufe · 100 (10 · 10)." : units === VOL ? "Volumen: jede Stufe · 1000 (10 · 10 · 10)." : "Zähle die Stufen auf der Einheitentreppe.",
    explain: `${solve("1", a, b).rel.rows.map(r => r.unit ? `${T(r.coef)} ${r.unit}` : "").filter(Boolean).join(" = ")} → **1 ${a} = ${T(F)} ${b}**.`,
  };
}

/** Was ist mehr? */
function compareTask(): Task {
  const units = pick([US_LEN, US_MASS, AREA, LIT]);
  const [a, b] = pair(units, 1);
  const va = parseQ(pick(["0,5", "1,2", "3", "0,25", "2,5", "0,8"]))!;
  const inB = mul(va, ratio(a, b));
  const mode = rnd(0, 2); // 0 gleich, 1 A größer, 2 B größer
  const vb = mode === 0 ? inB : mode === 1 ? mul(inB, q(9, 10)) : mul(inB, q(11, 10));
  if (!tidy(vb, 3)) return compareTask();
  const A = `${T(va)} ${a}`, B = `${T(vb)} ${b}`;
  const right = mode === 0 ? "gleich viel" : mode === 1 ? A : B;
  return {
    ...mc(right, [A, B, "gleich viel"]),
    conv: { value: T(va), from: a, to: b },
    prompt: `Was ist mehr: **${A}** oder **${B}**?`,
    hint: "Rechne zuerst beides in dieselbe Einheit um.",
    explain: `${A} = ${T(inB)} ${b}. Verglichen mit ${B} → **${right}**.`,
  };
}

/** Größenvorstellung: Welche Einheit passt? */
const ESTIMATES: [string, string, string[], boolean?][] = [
  ["Ein Bleistift ist etwa 18 __ lang.", "cm", ["mm", "m", "km"]],
  ["Eine Tür ist etwa 2 __ hoch.", "m", ["cm", "dm", "km"]],
  ["Eine Ameise ist etwa 5 __ lang.", "mm", ["cm", "dm", "m"]],
  ["Die Donau ist etwa 2850 __ lang.", "km", ["m", "cm", "dm"]],
  ["Ein Klassenzimmer hat etwa 60 __ Bodenfläche.", "m²", ["cm²", "km²", "dm²"]],
  ["Ein Handy-Bildschirm hat etwa 90 __.", "cm²", ["m²", "mm²", "a"]],
  ["Ein Fußballfeld hat etwa 70 __.", "a", ["m²", "km²", "cm²"]],
  ["Österreich hat eine Fläche von etwa 84 000 __.", "km²", ["ha", "m²", "a"]],
  ["Ein Glas Wasser fasst etwa 250 __.", "ml", ["l", "hl", "cl"]],
  ["Eine volle Badewanne fasst etwa 150 __.", "l", ["ml", "hl", "cl"]],
  ["Ein Zuckerwürfel hat etwa 2 __ Volumen.", "cm³", ["dm³", "m³", "mm³"]],
  ["Ein Schwimmbecken fasst etwa 400 __ Wasser.", "m³", ["dm³", "l", "cm³"]],
  ["Ein Apfel wiegt etwa 150 __.", "g", ["kg", "mg", "t"]],
  ["Eine Tafel Schokolade wiegt 10 __.", "dag", ["kg", "mg", "t"]],
  ["Ein Auto wiegt etwa 1,5 __.", "t", ["kg", "g", "dag"]],
  ["Ein Schulkind wiegt etwa 40 __.", "kg", ["g", "t", "dag"]],
  ["Eine Schulstunde dauert 50 __.", "min", ["s", "h", "d"]],
  ["Ein Tag hat 24 __.", "h", ["min", "s", "d"]],
];
function estimateTask(filter?: string[]): Task {
  const list = ESTIMATES.filter(e => !filter || filter.includes(e[1]));
  const [text, right, wrongs] = pick(list);
  return {
    ...mc(right, wrongs),
    prompt: `Welche Einheit passt? ${text.replace("__", "▢")}`,
    hint: "Stell dir den Gegenstand vor. Vergleiche mit etwas Bekanntem: 1 cm ≈ Fingerbreite, 1 m ≈ großer Schritt.",
    explain: `${text.replace("__", `**${right}**`)} (${unitName(right)})`,
  };
}

/** Stellenwerttafel ablesen (auch für die Übung im Tab „Stellenwerttafel“) */
export function pvTask(): Task {
  const table = pick([US_LEN, AREA, VOL, US_MASS].map(x => x === US_LEN ? ["km", "m", "dm", "cm", "mm"] : x));
  const [a, b] = pair(table, 2);
  const t = inputTask(a, b, { table, maxDec: 6 }) as Extract<Task, { kind: "input" }>;
  return { ...t, prompt: `Lies in der **Stellenwerttafel** ab: ${t.value} ${a} = ? **${b}**`, hint: "Das Komma steht immer rechts von der E-Spalte der Einheit. Fehlende Stellen mit 0 auffüllen." };
}

// ── Oberstufe ────────────────────────────────────────────────────────────────
function convBig(): Task {
  const r = Math.random();
  if (r < 0.35) { const [a, b] = pair(LADDERS.len, 6, 3); return inputTask(a, b, { values: ["1", "2", "5", "0,5", "3,5", "250", "0,02", "7"], maxDec: 12 }); }
  if (r < 0.7) { const [a, b] = pair(AREA, 6, 3); return inputTask(a, b, { values: ["1", "2", "5", "0,5", "3,5", "0,02", "25"], maxDec: 12 }); }
  const [a, b] = pair(VOL, 3, 2); return inputTask(a, b, { values: ["1", "2", "5", "0,5", "3,5", "0,02", "25"], maxDec: 12 });
}
function sciTask(): Task {
  const u = pick(["m", "g", "l", "s", "m²"]);
  const k = pick([-7, -6, -5, -4, 4, 5, 6, 7, 8]);
  const m = pick(["2", "5", "1,5", "3,2", "7", "4,25"]);
  const v = mul(parseQ(m)!, pow10(k));
  const right = `${m} · 10${sup(k)} ${u}`;
  const wrongs = [`${m} · 10${sup(-k)} ${u}`, `${m} · 10${sup(k + 1)} ${u}`, `${m} · 10${sup(k - 1)} ${u}`];
  return {
    ...mc(right, wrongs),
    prompt: `Schreibe als Zehnerpotenz: **${T(v)} ${u}**`,
    hint: "Verschiebe das Komma, bis eine Zahl zwischen 1 und 10 dasteht. Zähle die Stellen.",
    explain: `${T(v)} = ${fmtSci(v)} → Komma um ${Math.abs(k)} Stellen, ${k < 0 ? "negative Hochzahl (Zahl kleiner als 1)" : "positive Hochzahl"} → **${right}**.`,
  };
}
const sup = (k: number) => String(k).split("").map(c => ({ "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" } as Record<string, string>)[c]).join("");

/** zusammengesetzte Größen: Wert so wählen, dass das Ergebnis „schön“ ist, sonst auf 2 Stellen runden */
function compound(qtyId: string, pairs?: [string, string][]): Task {
  const units = QUANTITY[qtyId].units.map(u => u.sym);
  const [a, b] = pairs ? pick(pairs) : (() => { let x: [string, string]; do { x = [pick(units), pick(units)]; } while (x[0] === x[1]); return x; })();
  // zuerst ein schönes Ergebnis wählen, daraus den Ausgangswert
  for (let tries = 0; tries < 40; tries++) {
    const res = parseQ(pick(["10", "20", "25", "5", "15", "2", "4", "1,5", "30", "50", "100", "0,5", "36", "72", "12"]))!;
    const v = div(res, ratio(a, b));
    if (tidy(v, 4, 7)) return makeInput(T(v).replace(/ /g, " "), a, b, solve(v, a, b));
  }
  return inputTask(a, b, { round: 2 });
}
const convSpeed = () => compound("speed", [["km/h", "m/s"], ["m/s", "km/h"], ["m/min", "km/h"], ["cm/s", "m/s"], ["km/s", "km/h"]]);
const convDensity = () => compound("density", [["g/cm³", "kg/m³"], ["kg/m³", "g/cm³"], ["kg/dm³", "g/cm³"], ["g/l", "kg/m³"], ["g/ml", "kg/l"], ["kg/m³", "kg/dm³"]]);
const convFlow = () => compound("flow", [["l/min", "l/s"], ["m³/h", "l/min"], ["l/s", "m³/h"], ["l/h", "l/min"]]);
const convPressure = () => compound("pressure", [["hPa", "bar"], ["bar", "Pa"], ["N/cm²", "Pa"], ["kPa", "hPa"], ["bar", "N/cm²"], ["mbar", "hPa"], ["N/mm²", "bar"]]);
const convEnergy = () => Math.random() < 0.6
  ? compound("energy", [["kWh", "kJ"], ["kJ", "J"], ["Wh", "J"], ["MJ", "kWh"], ["kJ", "kWh"], ["W·s", "J"]])
  : compound("power", [["kW", "W"], ["MW", "kW"], ["W", "kW"], ["PS", "kW"], ["J/s", "W"]]);
const convElec = () => pick([
  () => compound("voltage", [["kV", "V"], ["mV", "V"], ["V", "mV"]]),
  () => compound("current", [["mA", "A"], ["A", "mA"], ["µA", "mA"]]),
  () => compound("resistance", [["kΩ", "Ω"], ["MΩ", "kΩ"], ["V/mA", "kΩ"], ["V/A", "Ω"]]),
  () => compound("charge", [["mAh", "C"], ["Ah", "C"], ["C", "mAh"], ["A·s", "C"]]),
])();
const convConc = () => compound("conc", [["mmol/l", "mol/l"], ["mol/l", "mmol/l"], ["mol/m³", "mol/l"], ["mmol/ml", "mol/l"], ["µmol/l", "mmol/l"]]);
function factorComp(): Task {
  const [a, b, right, wrongs] = pick([
    ["m/s", "km/h", "3,6", ["36", "0,36", "1000"]],
    ["g/cm³", "kg/m³", "1000", ["1", "100", "0,001"]],
    ["kWh", "kJ", "3600", ["1000", "60", "360"]],
    ["bar", "hPa", "1000", ["100", "10", "100 000"]],
    ["Ah", "C", "3600", ["60", "1000", "3,6"]],
    ["m³/h", "l/min", fmt(div(q(1000), q(60)), { digits: 2 }).text.replace(",", ",") , ["1000", "60", "16"]],
  ] as [string, string, string, string[]][]);
  const exact = solve("1", a, b);
  const r = isTerminating(exact.rel.F) ? T(exact.rel.F) : `≈ ${right}`;
  return {
    ...mc(r, wrongs),
    conv: { value: "1", from: a, to: b },
    prompt: `Umrechnungszahl: 1 ${a} = ? ${b}`,
    hint: "Ersetze jede Einheit durch ihren Wert in der neuen Einheit.",
    explain: `Einsetzen: ${rowsText(exact)} → **1 ${a} = ${r} ${b}**.`,
  };
}

/** Vorsilben-Skala: Welche Zehnerpotenz ist die Umrechnungszahl? */
function powerTask(): Task {
  for (;;) {
    const g = pick(pick(topicsFor(true)).groups);
    const a = pick(g), b = pick(g);
    const st = a !== b ? prefixStep(a, b) : null;
    if (!st || st.exp === 0) continue;
    const P = (k: number) => `· 10${supExp(k)}`;
    const wrongs = [-st.exp, st.exp + 3, st.exp - 3, st.diff !== st.exp ? st.diff : st.exp * 2].filter(k => k !== st.exp && k !== 0).map(P);
    const pa = st.from.prefix, pb = st.to.prefix;
    const par = (k: number) => (k < 0 ? `(−${-k})` : String(k));
    return {
      ...mc(P(st.exp), [...new Set(wrongs)]),
      conv: { value: "1", from: a, to: b },
      prompt: `Mit welcher Zehnerpotenz rechnest du **${a}** in **${b}** um?`,
      hint: "Umrechnungszahl = 10^(Hochzahl vorher − Hochzahl nachher). Bei m² und m³ die Hochzahl verdoppeln bzw. verdreifachen.",
      explain: `${st.alias.length ? st.alias.join(", ") + "; " : ""}${pa.name || "Grundeinheit"} = 10${supExp(pa.exp)}, ${pb.name || "Grundeinheit"} = 10${supExp(pb.exp)} → 10^(${pa.exp} − ${par(pb.exp)}) = 10${supExp(st.diff)}${st.from.power > 1 ? ` → hoch ${st.from.power}: 10${supExp(st.exp)}` : ""} → **${P(st.exp)}**.`,
    };
  }
}

// ── Level ────────────────────────────────────────────────────────────────────
const GENS = (os: boolean): Record<string, () => Task> => ({
  len: convLen, mass: convMass, area: convArea, vol: convVol, time: convTime,
  rule: () => ruleTask(os), factor: () => factorTask([AREA, VOL, US_LEN, US_MASS]), compare: compareTask,
  estimateLM: () => estimateTask(["cm", "m", "mm", "km", "g", "dag", "t", "kg"]),
  estimateAV: () => estimateTask(["m²", "cm²", "a", "km²", "ml", "l", "cm³", "m³"]),
  estimateT: () => estimateTask(["min", "h"]),
  pv: pvTask, big: convBig, sci: sciTask, power: powerTask, factorAV: () => factorTask([AREA, VOL]),
  speed: convSpeed, density: convDensity, flow: convFlow, pressure: convPressure, energy: convEnergy, elec: convElec, conc: convConc, factorC: factorComp,
});

export const TYPE_NAMES: Record<string, string> = {
  len: "Längen umrechnen", mass: "Massen umrechnen", area: "Flächen umrechnen", vol: "Volumen umrechnen", time: "Zeit umrechnen",
  rule: "Mal oder geteilt?", factor: "Umrechnungszahlen", compare: "Vergleichen", estimateLM: "Größenvorstellung (Länge, Masse)",
  estimateAV: "Größenvorstellung (Fläche, Volumen)", estimateT: "Größenvorstellung (Zeit)", pv: "Stellenwerttafel",
  big: "Große Sprünge", sci: "Zehnerpotenzen", power: "Vorsilben-Skala", factorAV: "Umrechnungszahlen (Fläche, Volumen)",
  speed: "Geschwindigkeit", density: "Dichte", flow: "Durchfluss", pressure: "Druck", energy: "Energie und Leistung",
  elec: "Elektrische Größen", conc: "Konzentration", factorC: "Umrechnungszahlen (zusammengesetzt)",
};

interface Level extends QuizLevel { types: string[] }
export const LEVELS: Record<Stufe, Level[]> = {
  us: [
    { id: "us-1", name: "Längen & Massen", desc: "km, m, dm, cm, mm · t, kg, dag, g, mg", types: ["len", "mass", "rule", "estimateLM", "pv"] },
    { id: "us-2", name: "Flächen & Volumen", desc: "m² · 100 = dm², m³ · 1000 = dm³, Liter", types: ["area", "vol", "factor", "estimateAV", "pv"] },
    { id: "us-3", name: "Zeit & Vergleichen", desc: "h, min, s – und was ist mehr?", types: ["time", "compare", "estimateT", "rule"] },
  ],
  os: [
    { id: "os-1", name: "Vorsilben & Zehnerpotenzen", desc: "n µ m c d – da h k M G: km → mm = · 10⁶", types: ["power", "big", "sci", "factorAV"] },
    { id: "os-2", name: "Geschwindigkeit & Dichte", desc: "km/h ↔ m/s, g/cm³ ↔ kg/m³, l/min", types: ["speed", "density", "flow", "factorC"] },
    { id: "os-3", name: "Physik & Chemie", desc: "Druck, Energie, Leistung, Elektrik, Konzentration", types: ["pressure", "energy", "elec", "conc"] },
  ],
};

export const levelId = (stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[stufe as Stufe][level].id : `${stufe}-${level}`);
export const levelName = (stufe: string, level: LevelKey) =>
  level === "mix" ? "Alles gemischt" : level === "weak" ? "Schwächen üben" : level === "due" ? "Heute fällig" : LEVELS[stufe as Stufe][level].name;

export function makeRound(stufe: string, level: LevelKey, stats?: TypeStats, due: string[] = []): Task[] {
  const levels = LEVELS[stufe as Stufe];
  let ids = level === "mix" ? [...new Set(levels.flatMap(l => l.types))]
    : level === "weak" ? weakTypes(stats, id => levels.some(l => l.types.includes(id)))
    : level === "due" ? due.filter(id => levels.some(l => l.types.includes(id)))
    : levels[level].types;
  if (!ids.length) ids = levels[0].types;
  return buildRound(ids, GENS(stufe === "os"), 10);
}

/** Lösung einer Eingabe-Aufgabe */
export const solutionOf = (t: Extract<Task, { kind: "input" }>) => solve(t.value, t.from, t.to);
/** Antwort prüfen (exakt bzw. mit Rundung) */
export function checkInput(t: Extract<Task, { kind: "input" }>, input: string): boolean | null {
  // Einheit dahinter erlaubt, „48.000“ zählt auch als 48 000 (Tausenderpunkt)
  const vs = parseAnswer(input, t.to);
  if (!vs.length) return null;
  const r = solutionOf(t).result;
  if (t.round === undefined) return vs.some(v => eq(v, r));
  const tol = toNumber(pow10(-t.round)) / 2 + 1e-12;
  return vs.some(v => Math.abs(toNumber(v) - toNumber(r)) <= tol);
}
export { shuffle, nf };
