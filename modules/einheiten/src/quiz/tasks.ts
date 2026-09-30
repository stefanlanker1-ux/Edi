// Quiz-Aufgaben zum Umrechnen (reine Daten, damit Runden gespeichert werden können).
// Eingabe-Aufgaben speichern nur Zahl und Einheiten – Lösung und Rechenweg entstehen beim Anzeigen mit solve().
// Fünf Niveaus, aufeinander aufbauend:
//   1 Zehnerschritte (nur 1, 10, 100 … 0,1, 0,01 …) · 2 dieselben Einheiten mit beliebigen Zahlen (1,5 g = 0,0015 kg)
//   3 Flächen (jede Stufe · 10 · 10) · 4 Volumen (jede Stufe · 10 · 10 · 10, 1 l = 1 dm³)
//   5 zusammengesetzte Einheiten in Stufen: Zeit → nur Zähler ändert sich → nur Nenner → beide → Einheiten mit eigenem Namen

import { solve, parseQ, parseAnswer, fmt, isTerminating, eq, mul, div, q, pow10, toNumber, unitSi, unitName, type Q, type Solution } from "@lern/units";
import { buildRound, dis, mc, pick, rnd, weakTypes, type BaseTask, type LevelKey, type McTask, type QuizLevel, type TypeStats } from "@lern/quiz";

export interface Conv { value: string; from: string; to: string }
export type Task =
  | (McTask & { conv?: Conv })
  | (BaseTask & { kind: "input"; value: string; from: string; to: string; round?: number; table?: string[] });

const T = (v: Q) => fmt(v).text;
/** Zahl mit höchstens `maxDec` Nachkommastellen und kurzer Ziffernfolge? */
function tidy(v: Q, maxDec = 6, maxDigits = 9) {
  if (!isTerminating(v)) return false;
  const s = fmt(v, { group: false }).text.replace("−", "");
  const [i, f = ""] = s.split(",");
  return f.length <= maxDec && (i.replace(/^0+/, "") + f).replace(/^0+/, "").length <= maxDigits;
}

/** Zehnerpotenzen (Niveau 1) */
const P10 = ["1", "1", "10", "100", "1000", "0,1", "0,01", "0,001", "0,0001"];
/** beliebige Zahlen (ab Niveau 2) */
const NUMS = ["1,5", "2,5", "3", "4", "7", "12", "15", "25", "36", "75", "120", "250", "450", "0,5", "0,8", "0,25", "0,06", "1,2", "3,45", "4,8", "6,05", "12,5", "0,3", "0,75", "0,04", "8,3", "15,6", "0,125", "2,04", "0,9"];

/** Eingabe-Aufgabe erzeugen, deren Ergebnis „schön“ ist (endet, nicht zu lang) */
function inputTask(from: string, to: string, opts: { values?: string[]; maxDec?: number; table?: string[] } = {}): Task {
  for (let tries = 0; tries < 60; tries++) {
    const value = pick(opts.values ?? NUMS);
    const s = solve(value, from, to);
    if (!tidy(s.result, opts.maxDec ?? 6)) continue;
    return makeInput(value, from, to, s, undefined, opts.table);
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
/** Einheiten mit eigenem Namen: Umrechnung durch Einsetzen */
const NAMED = ["Pa", "hPa", "kPa", "MPa", "bar", "mbar", "J", "kJ", "MJ", "GJ", "Wh", "kWh", "kcal", "C", "Ah", "mAh", "W", "kW", "MW", "PS"];
const compoundUnit = (u: string) => /[/·]/.test(u) || NAMED.includes(u);

function makeInput(value: string, from: string, to: string, s: Solution, round?: number, table?: string[]): Task {
  if (round !== undefined && tidy(s.result, round)) round = undefined; // exaktes Ergebnis: nicht runden
  const res = round !== undefined ? `≈ ${fmt(s.result, { digits: round }).text}` : T(s.result);
  const how = s.divisor ? `${value} : ${T(s.divisor)}` : `${value} · ${T(s.rel.F)}`;
  const rel = `1 ${from} = ${isTerminating(s.rel.F) ? T(s.rel.F) : s.divisor ? `1 : ${T(s.divisor)}` : `≈ ${T(s.rel.F)}`} ${to}`;
  const comp = compoundUnit(from) || compoundUnit(to);
  return {
    kind: "input", value, from, to, ...(round !== undefined ? { round } : {}), ...(table ? { table } : {}),
    prompt: `Rechne um: **${value} ${from}** = ? **${to}**${round !== undefined ? ` (auf ${round} Dezimalstellen runden)` : ""}`,
    hint: comp
      ? `Ersetze jede Einheit durch ihren Wert in der neuen Einheit: 1 ${from} = ? ${to}`
      : s.bigger ? `Große → kleine Einheit: Die Zahl wird größer. Wie viele ${to} sind 1 ${from}?` : `Kleine → große Einheit: Die Zahl wird kleiner. Wie viele ${from} sind 1 ${to}?`,
    explain: `${comp ? rowsText(s) : rel} → ${how} = **${res} ${to}**.${s.shift ? ` Komma um ${Math.abs(s.shift)} ${Math.abs(s.shift) === 1 ? "Stelle" : "Stellen"} nach ${s.shift > 0 ? "rechts" : "links"}.` : ""}`,
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
const LEN = ["km", "m", "dm", "cm", "mm"], MASS = ["t", "kg", "dag", "g", "mg"], LIT = ["hl", "l", "dl", "cl", "ml"];
const AREA = ["km²", "ha", "a", "m²", "dm²", "cm²", "mm²"], VOL = ["m³", "dm³", "cm³", "mm³"];
/** Stellenwerttafeln (Einheiten von groß nach klein) */
const TABLES = [LEN, MASS, AREA, VOL];
/** Einheiten mit Vorsilben außerhalb der Treppen (Vorsilben-Skala) */
const PRE: [string, string][] = [["mm", "µm"], ["m", "µm"], ["km", "mm"], ["g", "µg"], ["mg", "µg"], ["kg", "mg"], ["s", "ms"], ["ms", "µs"], ["kW", "W"], ["MW", "kW"],
  ["kJ", "J"], ["MJ", "kJ"], ["kV", "V"], ["V", "mV"], ["A", "mA"], ["mA", "µA"], ["MHz", "kHz"], ["GHz", "MHz"], ["kHz", "Hz"], ["kΩ", "Ω"], ["MΩ", "kΩ"], ["kN", "N"], ["l", "µl"], ["ml", "µl"]];
const swap = ([a, b]: [string, string]): [string, string] => (Math.random() < 0.5 ? [a, b] : [b, a]);

// ── Niveau 1 und 2: Längen, Massen, Hohlmaße, Vorsilben ────────────────────────
const ladder = (units: string[], steps: number, values: string[], table?: string[]) => () => { const [a, b] = pair(units, steps); return inputTask(a, b, { values, table, maxDec: 7 }); };
const preTask = (values: string[]) => () => { const [a, b] = swap(pick(PRE)); return inputTask(a, b, { values, maxDec: 9 }); };

/** Umrechnungszahl: 1 km = ? m – falsche Antworten: Richtung vertauscht, wie bei Längen/Flächen, eine Stufe zu viel oder zu wenig */
function factorTask(units: string[], steps = 3, dim?: 2 | 3): Task {
  const [a0, b0] = pair(units, steps);
  const [a, b] = toNumber(div(unitSi(a0), unitSi(b0))) >= 1 ? [a0, b0] : [b0, a0];
  const F = div(unitSi(a), unitSi(b));
  const k = Math.round(Math.log10(toNumber(F)));
  const st = dim ?? 1;
  const wrong = [
    dis(T(pow10(-k)), `Das ist die Gegenrichtung: 1 ${b} = ${T(pow10(-k))} ${a}. Von der großen zur kleinen Einheit wird die Zahl größer.`),
    ...(dim ? [dis(T(pow10(k / dim)), `So viel wäre es bei Längen. ${dim === 2 ? "Fläche = Länge · Länge" : "Volumen = Länge · Länge · Länge"}: jede Stufe ${dim === 2 ? "zweimal" : "dreimal"} · 10.`)] : []),
    ...(dim === 3 ? [dis(T(pow10((k * 2) / 3)), "So viel wäre es bei Flächen (· 10 · 10). Volumen: jede Stufe dreimal · 10.")] : []),
    dis(T(pow10(k + st)), `Eine Stufe zu viel: Zähle die Stufen von ${a} nach ${b} auf der Pfeilkette.`),
    ...(k - st > 0 ? [dis(T(pow10(k - st)), `Eine Stufe zu wenig: Zähle die Stufen von ${a} nach ${b} auf der Pfeilkette.`)] : []),
  ];
  return {
    ...mc(T(F), wrong),
    conv: { value: "1", from: a, to: b },
    prompt: `Setze die **Umrechnungszahl** ein: 1 ${a} = ? ${b}`,
    hint: dim === 2 ? "Flächen: jede Stufe · 10 · 10 = · 100." : dim === 3 ? "Volumen: jede Stufe · 10 · 10 · 10 = · 1000." : "Zähle die Stufen auf der Pfeilkette.",
    explain: `${solve("1", a, b).rel.rows.map(r => (r.unit ? `${T(r.coef)} ${r.unit}` : "")).filter(Boolean).join(" = ")} → **1 ${a} = ${T(F)} ${b}**.`,
  };
}

/** Mal oder geteilt – und durch wie viel? */
function ruleTask(units: string[]): Task {
  const [a, b] = pair(units, 2);
  const s = solve("1", a, b);
  const k = s.bigger ? s.rel.F : div(q(1), s.rel.F);
  const op = s.bigger ? "·" : ":", other = s.bigger ? ":" : "·";
  const right = `${op} ${T(k)}`;
  const kk = [div(k, q(10)), mul(k, q(10))].filter(x => toNumber(x) >= 10);
  const value = pick(["3,4", "250", "0,6", "12", "7,5"]);
  return {
    ...mc(right, [
      dis(`${other} ${T(k)}`, s.bigger ? `${a} ist die größere Einheit – in ${b} braucht man mehr davon: Die Zahl wird größer, also mal.` : `${a} ist die kleinere Einheit – in ${b} braucht man weniger davon: Die Zahl wird kleiner, also geteilt.`),
      ...kk.map(x => dis(`${op} ${T(x)}`, `Die Richtung stimmt – zähle die Stufen von ${a} nach ${b} noch einmal.`)),
      ...kk.map(x => `${other} ${T(x)}`),
    ]),
    conv: { value, from: a, to: b },
    prompt: `Du rechnest **${value} ${a}** in **${b}** um. Wie rechnest du?`,
    hint: "Große → kleine Einheit: mal. Kleine → große Einheit: geteilt. Zähle die Stufen auf der Pfeilkette.",
    explain: `1 ${s.bigger ? a : b} = ${T(k)} ${s.bigger ? b : a} → von ${a} nach ${b} **${right}**.`,
  };
}

/** Was ist mehr? */
function compareTask(units: string[], maxDec = 3): Task {
  for (;;) {
    const [a, b] = pair(units, 1);
    const va = parseQ(pick(["0,5", "1,2", "3", "0,25", "2,5", "0,8"]))!;
    const inB = mul(va, div(unitSi(a), unitSi(b)));
    const mode = rnd(0, 2); // 0 gleich, 1 A größer, 2 B größer
    const vb = mode === 0 ? inB : mode === 1 ? mul(inB, q(9, 10)) : mul(inB, q(11, 10));
    if (!tidy(vb, maxDec)) continue;
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
}

/** Größenvorstellung: Welche Einheit passt? */
const ESTIMATES: [string, string, string[]][] = [
  ["Ein Klassenzimmer hat etwa 60 __ Bodenfläche.", "m²", ["cm²", "km²", "dm²"]],
  ["Ein Handy-Bildschirm hat etwa 90 __.", "cm²", ["m²", "mm²", "a"]],
  ["Ein Fußballfeld hat etwa 70 __.", "a", ["m²", "km²", "cm²"]],
  ["Österreich hat eine Fläche von etwa 84 000 __.", "km²", ["ha", "m²", "a"]],
  ["Eine Briefmarke hat etwa 6 __.", "cm²", ["mm²", "dm²", "m²"]],
  ["Ein Bauernhof hat etwa 20 __ Felder.", "ha", ["m²", "km²", "cm²"]],
  ["Ein Glas Wasser fasst etwa 250 __.", "ml", ["l", "hl", "m³"]],
  ["Eine volle Badewanne fasst etwa 150 __.", "l", ["ml", "hl", "cm³"]],
  ["Ein Zuckerwürfel hat etwa 2 __ Volumen.", "cm³", ["dm³", "m³", "mm³"]],
  ["Ein Schwimmbecken fasst etwa 400 __ Wasser.", "m³", ["dm³", "l", "cm³"]],
  ["Ein Milchpackerl hat 1 __ Volumen.", "dm³", ["cm³", "m³", "mm³"]],
  ["Ein Sandkorn hat etwa 1 __ Volumen.", "mm³", ["cm³", "dm³", "m³"]],
];
function estimateTask(filter: string[]): Task {
  const [text, right, wrongs] = pick(ESTIMATES.filter(e => filter.includes(e[1])));
  return {
    ...mc(right, wrongs),
    prompt: `Welche Einheit passt? ${text.replace("__", "▢")}`,
    hint: "Stell dir den Gegenstand vor. 1 cm² ≈ Fingernagel, 1 m² ≈ Tischplatte, 1 cm³ ≈ Würfelzucker, 1 dm³ = 1 Liter.",
    explain: `${text.replace("__", `**${right}**`)} (${unitName(right)})`,
  };
}

// ── Niveau 3 und 4: Flächen und Volumen ──────────────────────────────────────
const areaTask = (values: string[]) => () => { const [a, b] = pair(AREA, 2); return inputTask(a, b, { values, maxDec: 8, table: AREA }); };
const volTask = (values: string[]) => () => { const [a, b] = pair(VOL, 2); return inputTask(a, b, { values, maxDec: 9, table: VOL }); };
const HA: [string, string][] = [["ha", "m²"], ["a", "m²"], ["km²", "ha"], ["ha", "a"], ["km²", "a"]];
const LITER: [string, string][] = [["l", "dm³"], ["ml", "cm³"], ["l", "cm³"], ["ml", "dm³"], ["m³", "l"], ["hl", "dm³"], ["cl", "cm³"], ["dl", "cm³"], ["mm³", "ml"]];

// ── Niveau 5: zusammengesetzte Einheiten, stufenweise ──────────────────────
function timeTask(): Task {
  const [a, b] = pick([["h", "min"], ["min", "s"], ["d", "h"], ["min", "h"], ["s", "min"], ["h", "d"], ["h", "s"], ["s", "h"]] as [string, string][]);
  const big = toNumber(div(unitSi(a), unitSi(b))) > 1;
  const values = big ? ["1,5", "2", "3", "0,5", "0,25", "2,5", "4", "0,75", "1,2", "0,1"] : ["90", "30", "150", "45", "180", "210", "6", "12", "36", "72", "120", "7200", "900"];
  return inputTask(a, b, { values });
}
/** Wert so wählen, dass das Ergebnis „schön“ ist, sonst auf 2 Stellen runden */
function compound(pairs: [string, string][]): Task {
  const [a, b] = swap(pick(pairs));
  for (let tries = 0; tries < 40; tries++) {
    const res = parseQ(pick(["10", "20", "25", "5", "15", "2", "4", "1,5", "30", "50", "100", "0,5", "36", "72", "12", "3", "7,2", "0,8", "250"]))!;
    const v = div(res, div(unitSi(a), unitSi(b)));
    if (tidy(v, 4, 7)) return makeInput(T(v), a, b, solve(v, a, b));
  }
  return inputTask(a, b, { values: ["1", "2", "5", "10", "100"] });
}
/** nur der Zähler ändert sich (m/s → cm/s) */
const NUMER: [string, string][] = [["m/s", "cm/s"], ["km/s", "m/s"], ["km/h", "m/h"], ["g/l", "kg/l"], ["g/l", "mg/l"], ["mmol/l", "mol/l"], ["l/min", "ml/min"], ["m³/h", "l/h"],
  ["kg/m³", "g/m³"], ["N/m²", "kN/m²"], ["km/min", "m/min"], ["mg/ml", "g/ml"], ["kW/m²", "W/m²"], ["g/cm³", "mg/cm³"]];
/** nur der Nenner ändert sich (km/h → km/min) */
const DENOM: [string, string][] = [["km/h", "km/min"], ["l/min", "l/s"], ["l/h", "l/min"], ["m/s", "m/min"], ["g/cm³", "g/dm³"], ["g/ml", "g/l"], ["mol/l", "mol/ml"],
  ["N/cm²", "N/m²"], ["N/mm²", "N/cm²"], ["m/min", "m/h"], ["kg/dm³", "kg/m³"], ["km/h", "km/s"], ["m³/h", "m³/min"], ["mg/l", "mg/ml"]];
/** Zähler und Nenner ändern sich */
const BOTH: [string, string][] = [["km/h", "m/s"], ["m/min", "km/h"], ["cm/s", "m/min"], ["g/cm³", "kg/m³"], ["kg/dm³", "g/cm³"], ["g/l", "kg/m³"], ["m³/h", "l/min"],
  ["l/s", "m³/h"], ["mmol/ml", "mol/l"], ["mol/m³", "mmol/l"], ["cm/s", "km/h"], ["g/ml", "kg/m³"]];
/** Einheiten mit eigenem Namen (Pa, J, W, C …) */
const NAMED_PAIRS: [string, string][] = [["hPa", "bar"], ["bar", "Pa"], ["N/cm²", "Pa"], ["kPa", "hPa"], ["bar", "N/cm²"], ["mbar", "hPa"], ["N/mm²", "bar"], ["MPa", "bar"],
  ["kWh", "kJ"], ["Wh", "J"], ["MJ", "kWh"], ["W·s", "J"], ["kWh", "MJ"], ["J/s", "W"], ["PS", "kW"], ["mAh", "C"], ["Ah", "C"], ["A·s", "C"], ["V/mA", "kΩ"], ["V/A", "Ω"]];

function factorComp(): Task {
  const [a, b, right, wrongs] = pick([
    ["km/h", "m/s", "1/3,6", [dis("3,6", "Das ist 1 m/s in km/h – die Gegenrichtung."), dis("1000", "1 km = 1000 m, aber 1 h hat auch 3600 s: 1000 m / 3600 s."), "0,36"]],
    ["m/s", "km/h", "3,6", [dis("1/3,6", "Das ist 1 km/h in m/s – die Gegenrichtung."), dis("1000", "1 m = 0,001 km und 1 s = 1/3600 h: 0,001 km / (1/3600 h)."), "36"]],
    ["g/cm³", "kg/m³", "1000", [dis("1", "1 g/cm³ = 1 kg/dm³ – gefragt ist aber kg/m³."), dis("0,001", "Gegenrichtung: 1 kg/m³ = 0,001 g/cm³."), "100"]],
    ["kWh", "kJ", "3600", [dis("1000", "kW bleibt kW – nur h wird zu s: 1 h = 3600 s."), dis("60", "1 h = 60 min, gefragt sind aber Sekunden: 3600 s."), "360"]],
    ["bar", "hPa", "1000", [dis("100", "1 bar = 100 000 Pa und 1 hPa = 100 Pa."), dis("100 000", "Das wären Pa: 1 bar = 100 000 Pa."), "10"]],
    ["Ah", "C", "3600", [dis("60", "1 C = 1 A · s und 1 h = 3600 s."), dis("1000", "Hier gibt es keine Vorsilbe – 1 h = 3600 s."), "3,6"]],
    ["l/min", "l/h", "60", [dis("1/60", "Gegenrichtung: 1 l/h = 1/60 l/min."), dis("3600", "1 h = 60 min (nicht Sekunden)."), "100"]],
    ["m³/h", "l/h", "1000", [dis("100", "1 m³ = 1000 dm³ = 1000 l."), dis("0,001", "Gegenrichtung: 1 l = 0,001 m³."), "10"]],
  ] as [string, string, string, (string | ReturnType<typeof dis>)[]][]);
  return {
    ...mc(right, wrongs),
    conv: { value: "1", from: a, to: b },
    prompt: `Umrechnungszahl: 1 ${a} = ? ${b}`,
    hint: "Ersetze jede Einheit durch ihren Wert in der neuen Einheit.",
    explain: `Einsetzen: ${rowsText(solve("1", a, b))} → **1 ${a} = ${right} ${b}**.`,
  };
}

// ── Level ────────────────────────────────────────────────────────────────────
const GENS: Record<string, () => Task> = {
  // Niveau 1
  z_len: ladder(LEN, 3, P10, LEN), z_mass: ladder(MASS, 3, P10, MASS), z_lit: ladder(LIT, 3, P10), z_pre: preTask(P10),
  z_factor: () => factorTask(pick([LEN, MASS, LIT])),
  // Niveau 2
  k_len: ladder(LEN, 3, NUMS, LEN), k_mass: ladder(MASS, 3, NUMS, MASS), k_lit: ladder(LIT, 3, NUMS), k_pre: preTask(NUMS),
  k_rule: () => ruleTask(pick([LEN, MASS, LIT])), k_compare: () => compareTask(pick([LEN, MASS, LIT])),
  // Niveau 3
  f_p10: areaTask(P10), f_num: areaTask(NUMS), f_factor: () => factorTask(AREA, 3, 2), f_ha: () => { const [a, b] = swap(pick(HA)); return inputTask(a, b, { maxDec: 6, table: AREA }); },
  f_compare: () => compareTask(AREA, 4), f_est: () => estimateTask(["m²", "cm²", "a", "km²", "ha"]),
  // Niveau 4
  v_p10: volTask(P10), v_num: volTask(NUMS), v_factor: () => factorTask(VOL, 2, 3), v_liter: () => { const [a, b] = swap(pick(LITER)); return inputTask(a, b, { maxDec: 7 }); },
  v_compare: () => compareTask(VOL, 4), v_est: () => estimateTask(["ml", "l", "cm³", "m³", "dm³", "mm³"]),
  // Niveau 5
  c_time: timeTask, c_num: () => compound(NUMER), c_den: () => compound(DENOM), c_both: () => compound(BOTH), c_named: () => compound(NAMED_PAIRS), c_factor: factorComp,
};
/** Reihenfolge in Niveau 5: vom Leichten zum Schweren */
const STAGE: Record<string, number> = { c_time: 0, c_num: 1, c_den: 2, c_factor: 3, c_both: 3, c_named: 4 };

export const TYPE_NAMES: Record<string, string> = {
  z_len: "Längen · Zehnerschritte", z_mass: "Massen · Zehnerschritte", z_lit: "Liter · Zehnerschritte", z_pre: "Vorsilben · Zehnerschritte", z_factor: "Umrechnungszahlen",
  k_len: "Längen umrechnen", k_mass: "Massen umrechnen", k_lit: "Liter umrechnen", k_pre: "Vorsilben umrechnen", k_rule: "Mal oder geteilt?", k_compare: "Vergleichen",
  f_p10: "Flächen · Zehnerschritte", f_num: "Flächen umrechnen", f_factor: "Umrechnungszahlen (Fläche)", f_ha: "Hektar und Ar", f_compare: "Flächen vergleichen", f_est: "Größenvorstellung (Fläche)",
  v_p10: "Volumen · Zehnerschritte", v_num: "Volumen umrechnen", v_factor: "Umrechnungszahlen (Volumen)", v_liter: "Liter und dm³", v_compare: "Volumen vergleichen", v_est: "Größenvorstellung (Volumen)",
  c_time: "Zeit umrechnen", c_num: "Zähler umrechnen", c_den: "Nenner umrechnen", c_both: "Zähler und Nenner", c_named: "Druck, Energie, Ladung", c_factor: "Umrechnungszahlen (zusammengesetzt)",
};

interface Level extends QuizLevel { types: string[] }
export const LEVELS: Level[] = [
  { id: "n1", name: "Zehnerschritte", desc: "1 m = 100 cm · 0,01 kg = 10 g", types: ["z_len", "z_mass", "z_lit", "z_pre", "z_factor"] },
  { id: "n2", name: "Beliebige Zahlen", desc: "1,5 g = 0,0015 kg · 3,45 m = 345 cm", types: ["k_len", "k_mass", "k_lit", "k_pre", "k_rule", "k_compare"] },
  { id: "n3", name: "Flächen", desc: "m² → dm²: · 10 · 10 = · 100", types: ["f_p10", "f_num", "f_factor", "f_ha", "f_compare", "f_est"] },
  { id: "n4", name: "Volumen", desc: "m³ → dm³: · 10 · 10 · 10 · 1 l = 1 dm³", types: ["v_p10", "v_num", "v_factor", "v_liter", "v_compare", "v_est"] },
  { id: "n5", name: "Zusammengesetzt", desc: "h → s · km/h → m/s · g/cm³ → kg/m³ · bar", types: ["c_time", "c_num", "c_den", "c_both", "c_named", "c_factor"] },
];

/** Das Quiz hat keine Stufen – ein Schlüssel für Spielstand und Fortschritt */
export const STUFE = "us";
export const levelId = (_stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[level].id : `${STUFE}-${level}`);
export const levelName = (level: LevelKey) =>
  level === "mix" ? "Alles gemischt" : level === "weak" ? "Schwächen üben" : level === "due" ? "Heute fällig" : LEVELS[level].name;

export function makeRound(_stufe: string, level: LevelKey, stats?: TypeStats, due: string[] = []): Task[] {
  let ids = level === "mix" ? [...new Set(LEVELS.flatMap(l => l.types))]
    : level === "weak" ? weakTypes(stats, id => id in GENS)
    : level === "due" ? due.filter(id => id in GENS)
    : LEVELS[level].types;
  if (!ids.length) ids = LEVELS[0].types;
  const round = buildRound(ids, GENS, 10);
  // Niveau 5 stufenweise: erst Zeit, dann nur Zähler, nur Nenner, beide, zuletzt Einheiten mit eigenem Namen
  if (level !== 4) return round;
  return round.map((t, i) => ({ t, i })).sort((x, y) => STAGE[x.t.type!] - STAGE[y.t.type!] || x.i - y.i).map(x => x.t);
}

/** Stellenwerttafel, in der beide Einheiten stehen */
export const tableFor = (from: string, to: string) => TABLES.find(t => t.includes(from) && t.includes(to));

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
