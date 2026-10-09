// Quiz-Aufgaben zum Umrechnen (reine Daten, damit Runden gespeichert werden können).
// Eingabe-Aufgaben speichern nur Zahl und Einheiten – Lösung und Rechenweg entstehen beim Anzeigen mit solve().
// Je Stufe fünf Niveaus, aufeinander aufbauend:
//   1 Zehnerschritte (nur 1, 10, 100 … 0,1, 0,01 …) · 2 dieselben Einheiten mit beliebigen Zahlen (1,5 g = 0,0015 kg)
//   3 Flächen (jede Stufe · 10 · 10) · 4 Volumen (jede Stufe · 10 · 10 · 10, 1 l = 1 dm³)
//   5 Unterstufe: Zeit (60er- und 24er-Schritte) · Oberstufe: zusammengesetzte Einheiten in Stufen
//     (Zeit → nur Zähler ändert sich → nur Nenner → beide → Einheiten mit eigenem Namen)
// Unterstufe ohne seltene Vorsilben (µ, n, M, G …) und ohne zusammengesetzte Größen.

import { solve, parseQ, parseAnswer, fmt, isTerminating, eq, mul, div, q, pow10, toNumber, unitSi, unitName, QUANTITIES, type Q, type Solution } from "@lern/units";
import { buildRound, dis, mc, pick, rnd, weakTypes, type BaseTask, type LevelKey, type McTask, type QuizLevel, type Trap, type TypeStats } from "@lern/quiz";
import { tr, num } from "@lern/i18n";

export interface Conv { value: string; from: string; to: string }
export type Task =
  | (McTask & { conv?: Conv })
  | (BaseTask & { kind: "input"; value: string; from: string; to: string; round?: number; table?: string[] });

const T = (v: Q) => fmt(v).text;
/** Geteilt-Zeichen: „:“ (deutsch), „÷“ (englisch) */
const DIV = tr(":", "÷");
/** Zahl mit höchstens `maxDec` Nachkommastellen und kurzer Ziffernfolge? */
function tidy(v: Q, maxDec = 6, maxDigits = 9) {
  if (!isTerminating(v)) return false;
  const s = fmt(v, { group: false }).text.replace("−", "");
  const [i, f = ""] = s.split(/[,.]/);
  return f.length <= maxDec && (i.replace(/^0+/, "") + f).replace(/^0+/, "").length <= maxDigits;
}

/** Zehnerpotenzen (Niveau 1) */
const P10 = ["1", "1", "10", "100", "1000", "0,1", "0,01", "0,001", "0,0001"];
/** beliebige Zahlen (ab Niveau 2) */
const NUMS = ["1,5", "2,5", "3", "4", "7", "12", "15", "25", "36", "75", "120", "250", "450", "0,5", "0,8", "0,25", "0,06", "1,2", "3,45", "4,8", "6,05", "12,5", "0,3", "0,75", "0,04", "8,3", "15,6", "0,125", "2,04", "0,9"];

/** Eingabe-Aufgabe erzeugen, deren Ergebnis „schön“ ist (endet, nicht zu lang) */
function inputTask(from: string, to: string, opts: { values?: string[]; maxDec?: number; table?: string[] } = {}): Task {
  for (let tries = 0; tries < 60; tries++) {
    const value = num(pick(opts.values ?? NUMS));
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

/** auf k Dezimalstellen runden (ab 5 aufrunden), auch endende Zahlen: 3,677 493 75 → 3,68 */
function roundTo(v: Q, k: number): Q {
  const s = v.n * 10n ** BigInt(k), m = s % v.d;
  let r = s / v.d;
  if ((m < 0n ? -m : m) * 2n >= v.d) r += v.n < 0n ? -1n : 1n;
  return q(r, 10n ** BigInt(k));
}
/**
 * gerundetes Ergebnis ohne „≈“ mit fester Stellenzahl: auf 2 Stellen 6,80 (nicht 6,8), 13,00.
 * Rundet die Zahl auf 0, gültige Ziffern wie fmt (0,000 12) – sonst stünde dort nur „0,00“.
 */
export function approxText(v: Q, k: number): string {
  const r = roundTo(v, k);
  if (r.n === 0n) return isTerminating(v) ? T(v) : fmt(v, { digits: k }).text;
  const sep = tr(",", ".");
  const [int, frac = ""] = T(r).split(sep);
  const digits = frac.replace(/\s/g, "").padEnd(k, "0");
  return k ? `${int}${sep}${digits.length <= 4 ? digits : digits.replace(/(\d{3})(?=\d)/g, "$1\u202f")}` : int;
}

/**
 * Typische Fehler bei Eingabe-Aufgaben als Fallen (gezielte Rückmeldung und Stolperstein): Gegenrichtung (geteilt statt mal),
 * Komma eine Stelle zu weit (Faktor 10 zu viel oder zu wenig), bei Fläche/Volumen mit der Längen-Umrechnungszahl gerechnet.
 * Nur exakte Aufgaben (gerundete vergleichen mit Toleranz); nie gleich der Lösung.
 */
function inputTraps(s: Solution, from: string, to: string): Trap[] {
  const F = s.rel.F, res = s.result;
  if (eq(F, q(1))) return [];
  const rel = `1 ${from} = ${qText(F)} ${to}`;
  const list: [Q, string, string][] = [];
  const p = /²$/.test(from) && /²$/.test(to) ? 2 : /³$/.test(from) || /³$/.test(to) ? 3 : 0;
  if (p && s.shift !== null && s.shift % p === 0) {
    list.push([mul(s.value, pow10(s.shift / p)), "laengenfaktor", tr(
      `So rechnet man bei Längen. ${p === 2 ? "Fläche: jeder Schritt · 10 · 10 = · 100" : "Volumen: jeder Schritt · 10 · 10 · 10 = · 1000"} – ${rel}.`,
      `That is how lengths work. ${p === 2 ? "Area: each step · 10 · 10 = · 100" : "Volume: each step · 10 · 10 · 10 = · 1000"} – ${rel}.`)]);
  }
  list.push([div(s.value, F), "gegenrichtung", tr(`Gegenrichtung: ${rel} – die Zahl wird ${s.bigger ? "größer, also mal" : "kleiner, also geteilt"}.`,
    `Wrong direction: ${rel} – the number gets ${s.bigger ? "bigger, so multiply" : "smaller, so divide"}.`)]);
  list.push([mul(res, q(10)), "komma-verschoben", tr(`Zehnmal zu groß – das Komma steht eine Stelle zu weit rechts. ${rel}.`, `Ten times too big – the decimal point is one place too far right. ${rel}.`)]);
  list.push([div(res, q(10)), "komma-verschoben", tr(`Zehnmal zu klein – das Komma steht eine Stelle zu weit links. ${rel}.`, `Ten times too small – the decimal point is one place too far left. ${rel}.`)]);
  const seen: Q[] = [res], out: Trap[] = [];
  for (const [v, miss, why] of list) {
    if (seen.some(x => eq(x, v))) continue;
    seen.push(v);
    const values = storedValue(v);
    if (values.n !== undefined) out.push({ values, miss, why });
  }
  return out;
}

function makeInput(value: string, from: string, to: string, s: Solution, round?: number, table?: string[]): Task {
  if (round !== undefined && tidy(s.result, round)) round = undefined; // exaktes Ergebnis: nicht runden
  const res = round !== undefined ? approxText(s.result, round) : T(s.result);
  // exakter Rechenweg: endet F nicht, durch den Kehrwert teilen (0,072 : 0,036), nie mit gerundetem F ohne „≈“
  const how = s.divisor ? `${value} ${DIV} ${T(s.divisor)}` : `${value} · ${isTerminating(s.rel.F) ? "" : "≈ "}${T(s.rel.F)}`;
  const rel = `1 ${from} = ${isTerminating(s.rel.F) ? T(s.rel.F) : s.divisor ? `1/${T(s.divisor)}` : `≈ ${T(s.rel.F)}`} ${to}`;
  const comp = compoundUnit(from) || compoundUnit(to);
  const same = eq(s.rel.F, q(1));
  return {
    kind: "input", value, from, to, ...(round !== undefined ? { round } : { traps: inputTraps(s, from, to) }), ...(table ? { table } : {}),
    prompt: tr(`Rechne um: **${value} ${from}** = ? **${to}**${round !== undefined ? ` (auf ${round} Dezimalstellen runden)` : ""}`,
      `Convert: **${value} ${from}** = ? **${to}**${round !== undefined ? ` (round to ${round} decimal places)` : ""}`),
    hint: comp
      ? tr(`Ersetze jede Einheit durch ihren Wert in der neuen Einheit: 1 ${from} = ? ${to}`, `Replace each unit by its value in the new unit: 1 ${from} = ? ${to}`)
      : same ? tr(`${from} und ${to} sind gleich groß. Wie viele ${to} sind 1 ${from}?`, `${from} and ${to} are the same size. How many ${to} are 1 ${from}?`)
      : s.bigger ? tr(`Große → kleine Einheit: Die Zahl wird größer. Wie viele ${to} sind 1 ${from}?`, `Large → small unit: the number gets bigger. How many ${to} are 1 ${from}?`)
      : tr(`Kleine → große Einheit: Die Zahl wird kleiner. Wie viele ${from} sind 1 ${to}?`, `Small → large unit: the number gets smaller. How many ${from} are 1 ${to}?`),
    // gerundet: „a · F ≈ x“ (nie „= ≈ x“)
    explain: `${comp ? rowsText(s) : rel} → ${how} ${round !== undefined ? "≈" : "="} **${res} ${to}**.${s.shift ? tr(` Komma um ${Math.abs(s.shift)} ${Math.abs(s.shift) === 1 ? "Stelle" : "Stellen"} nach ${s.shift > 0 ? "rechts" : "links"}.`,
      ` Move the decimal point ${Math.abs(s.shift)} ${Math.abs(s.shift) === 1 ? "place" : "places"} to the ${s.shift > 0 ? "right" : "left"}.`) : ""}`,
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

/**
 * Umrechnungszahl: 1 km = ? m – falsche Antworten: Richtung vertauscht, wie bei Längen/Flächen, eine Stufe zu viel oder zu wenig
 * (Flächen · 100, Volumen · 1000 je Stufe) bzw. bei Längen, Massen, Hohlmaßen eine Null zu viel oder zu wenig – dort sind die
 * Stufen verschieden groß (km → m · 1000, kg → dag · 100, hl → l · 100), „eine Stufe“ wäre dort nicht immer · 10.
 */
function factorTask(units: string[], steps = 3, dim?: 2 | 3): Task {
  const [a0, b0] = pair(units, steps);
  const [a, b] = toNumber(div(unitSi(a0), unitSi(b0))) >= 1 ? [a0, b0] : [b0, a0];
  const F = div(unitSi(a), unitSi(b));
  const k = Math.round(Math.log10(toNumber(F)));
  // Weg auf der Pfeilkette über die Nachbareinheiten: 1 kg = 100 dag = 1000 g
  const path = units.slice(units.indexOf(a), units.indexOf(b) + 1);
  const chain = `1 ${a} = ${path.slice(1).map(u => `${T(div(unitSi(a), unitSi(u)))} ${u}`).join(" = ")}`;
  const each = dim === 2 ? tr("jeder Schritt · 10 · 10 = · 100", "each step · 10 · 10 = · 100") : tr("jeder Schritt · 10 · 10 · 10 = · 1000", "each step · 10 · 10 · 10 = · 1000");
  const wrong = [
    dis(T(pow10(-k)), tr(`Das ist die Gegenrichtung: 1 ${b} = ${T(pow10(-k))} ${a}. Von der großen zur kleinen Einheit wird die Zahl größer.`,
      `That is the other direction: 1 ${b} = ${T(pow10(-k))} ${a}. From the large to the small unit the number gets bigger.`)),
    ...(dim ? [dis(T(pow10(k / dim)), tr(`So viel wäre es bei Längen. ${dim === 2 ? "Fläche = Länge · Länge" : "Volumen = Länge · Länge · Länge"}: jeder Schritt ${dim === 2 ? "zweimal" : "dreimal"} · 10.`,
      `That would be right for lengths. ${dim === 2 ? "Area = length · length" : "Volume = length · length · length"}: each step · 10 ${dim === 2 ? "twice" : "three times"}.`))] : []),
    ...(dim === 3 ? [dis(T(pow10((k * 2) / 3)), tr("So viel wäre es bei Flächen (· 10 · 10). Volumen: jeder Schritt dreimal · 10.", "That would be right for areas (· 10 · 10). Volume: each step · 10 three times."))] : []),
    ...(dim
      ? [dis(T(pow10(k + dim)), tr(`Ein Schritt zu viel: ${chain}.`, `One step too many: ${chain}.`)),
        ...(k - dim > 0 ? [dis(T(pow10(k - dim)), tr(`Ein Schritt zu wenig: ${chain}.`, `One step too few: ${chain}.`))] : [])]
      : [dis(T(pow10(k + 1)), tr(`Eine Null zu viel. Auf der Pfeilkette: ${chain}.`, `One zero too many. On the arrow chain: ${chain}.`)),
        ...(k > 1 ? [dis(T(pow10(k - 1)), tr(`Eine Null zu wenig. Auf der Pfeilkette: ${chain}.`, `One zero too few. On the arrow chain: ${chain}.`))] : [])]),
  ];
  return {
    ...mc(T(F), wrong),
    conv: { value: "1", from: a, to: b },
    prompt: tr(`Setze die **Umrechnungszahl** ein: 1 ${a} = ? ${b}`, `Fill in the **conversion factor**: 1 ${a} = ? ${b}`),
    hint: dim === 2 ? tr("Flächen: jeder Schritt · 10 · 10 = · 100.", "Areas: each step · 10 · 10 = · 100.") : dim === 3 ? tr("Volumen: jeder Schritt · 10 · 10 · 10 = · 1000.", "Volumes: each step · 10 · 10 · 10 = · 1000.") : tr("Geh auf der Pfeilkette Schritt für Schritt und nimm die Zahlen der Schritte mal.", "Go along the arrow chain step by step and multiply the numbers of the steps."),
    // Kette über die Nachbareinheiten (bei nur einer Stufe der Schritt selbst) – nie nur das Ergebnis wiederholt
    explain: dim
      ? `${each[0].toUpperCase() + each.slice(1)}: ${path.length > 2 ? `${chain} → ` : ""}**1 ${a} = ${T(F)} ${b}**.`
      : `${path.length > 2 ? `${chain} → ` : `${a} → ${b} ${tr("ist ein Schritt", "is one step")} → `}**1 ${a} = ${T(F)} ${b}**.`,
  };
}

/** Mal oder geteilt – und durch wie viel? */
function ruleTask(units: string[]): Task {
  const [a, b] = pair(units, 2);
  const s = solve("1", a, b);
  const k = s.bigger ? s.rel.F : div(q(1), s.rel.F);
  const op = s.bigger ? "·" : DIV, other = s.bigger ? DIV : "·";
  const right = `${op} ${T(k)}`;
  const kk = [div(k, q(10)), mul(k, q(10))].filter(x => toNumber(x) >= 10);
  const value = num(pick(["3,4", "250", "0,6", "12", "7,5"]));
  // Weg über die Nachbareinheiten (Stufen sind verschieden groß: kg → dag · 100, dag → g · 10)
  const chain = solve("1", s.bigger ? a : b, s.bigger ? b : a).rel.rows.map(r => `${T(r.coef)} ${r.unit}`).join(" = ");
  return {
    ...mc(right, [
      dis(`${other} ${T(k)}`, s.bigger
        ? tr(`${a} ist die größere Einheit – in ${b} braucht man mehr davon: Die Zahl wird größer, also mal.`, `${a} is the larger unit – you need more ${b}: the number gets bigger, so multiply.`)
        : tr(`${a} ist die kleinere Einheit – in ${b} braucht man weniger davon: Die Zahl wird kleiner, also geteilt.`, `${a} is the smaller unit – you need fewer ${b}: the number gets smaller, so divide.`)),
      ...kk.map(x => dis(`${op} ${T(x)}`, tr(`Die Richtung stimmt, die Zahl nicht. Auf der Pfeilkette: ${chain}.`, `The direction is right, the number is not. On the arrow chain: ${chain}.`))),
      ...kk.map(x => dis(`${other} ${T(x)}`, s.bigger
        ? tr(`Richtung und Zahl stimmen nicht. ${a} ist die größere Einheit, also mal. Auf der Pfeilkette: ${chain}.`,
          `Neither the direction nor the number is right. ${a} is the larger unit, so multiply. On the arrow chain: ${chain}.`)
        : tr(`Richtung und Zahl stimmen nicht. ${a} ist die kleinere Einheit, also geteilt. Auf der Pfeilkette: ${chain}.`,
          `Neither the direction nor the number is right. ${a} is the smaller unit, so divide. On the arrow chain: ${chain}.`))),
    ]),
    conv: { value, from: a, to: b },
    prompt: tr(`Du rechnest **${value} ${a}** in **${b}** um. Wie rechnest du?`, `You convert **${value} ${a}** to **${b}**. What do you do?`),
    hint: tr("Große → kleine Einheit: mal. Kleine → große Einheit: geteilt. Geh die Pfeilkette Schritt für Schritt.", "Large → small unit: multiply. Small → large unit: divide. Go along the arrow chain step by step."),
    explain: `1 ${s.bigger ? a : b} = ${T(k)} ${s.bigger ? b : a} → ${tr("von", "from")} ${a} ${tr("nach", "to")} ${b} **${right}**.`,
  };
}

/** Was ist mehr? Etwa jede vierte Aufgabe „gleich viel“, jede vierte eine Falle (Umrechnungszahl um eine Stufe falsch bzw. wie bei Längen) */
function compareTask(units: string[], maxDec = 3, dim: 1 | 2 | 3 = 1): Task {
  for (;;) {
    const [a0, b0] = pair(units, 1);
    const [a, b] = toNumber(div(unitSi(a0), unitSi(b0))) >= 1 ? [a0, b0] : [b0, a0]; // a ist die größere Einheit
    const va = parseQ(pick(["0,5", "1,2", "3", "0,25", "2,5", "0,8", "1,5", "4"]))!;
    const F = div(unitSi(a), unitSi(b)), inB = mul(va, F);
    const kF = toNumber(F);
    // Falle: mit der falschen Umrechnungszahl wäre es „gleich viel“
    const wrongF = dim > 1 ? q(Math.round(kF ** (1 / dim))) : mul(F, q(10));
    const mode = pick([0, 1, 1, 2, 2, 3]); // 0 gleich, 1 a mehr, 2 b mehr, 3 Falle
    const vb = mode === 0 ? inB : mode === 1 ? mul(inB, q(9, 10)) : mode === 2 ? mul(inB, q(11, 10)) : mul(va, wrongF);
    if (eq(vb, inB) && mode === 3) continue;
    if (!tidy(vb, maxDec)) continue;
    const A = `${T(va)} ${a}`, B = `${T(vb)} ${b}`;
    const cmp = toNumber(vb) - toNumber(inB);
    const same = tr("gleich viel", "the same");
    const right = cmp === 0 ? same : cmp < 0 ? A : B;
    const conv = `${A} = ${T(inB)} ${b}`;
    const trapWhy = dim > 1
      ? tr(`${T(wrongF)} wäre die Umrechnungszahl bei Längen. ${dim === 2 ? "Fläche" : "Volumen"}: 1 ${a} = ${T(F)} ${b}, also ${conv}.`,
        `${T(wrongF)} would be the factor for lengths. ${dim === 2 ? "Area" : "Volume"}: 1 ${a} = ${T(F)} ${b}, so ${conv}.`)
      : tr(`1 ${a} = ${T(F)} ${b}, nicht ${T(wrongF)} ${b}. Also ${conv}.`, `1 ${a} = ${T(F)} ${b}, not ${T(wrongF)} ${b}. So ${conv}.`);
    return {
      ...mc(right, [
        right !== same ? dis(same, mode === 3 ? trapWhy : tr(`${conv} – das ist nicht dasselbe wie ${B}.`, `${conv} – that is not the same as ${B}.`)) : null,
        right !== A ? dis(A, tr(`${conv} – das ist ${cmp === 0 ? "genau gleich viel wie" : "weniger als"} ${B}.`, `${conv} – that is ${cmp === 0 ? "exactly the same as" : "less than"} ${B}.`)) : null,
        right !== B ? dis(B, tr(`${conv} – das ist ${cmp === 0 ? "genau gleich viel wie" : "mehr als"} ${B}.`, `${conv} – that is ${cmp === 0 ? "exactly the same as" : "more than"} ${B}.`)) : null,
      ]),
      conv: { value: T(va), from: a, to: b },
      prompt: tr(`Was ist mehr: **${A}** oder **${B}**?`, `Which is more: **${A}** or **${B}**?`),
      hint: tr("Rechne zuerst beides in dieselbe Einheit um.", "First convert both to the same unit."),
      explain: tr(`${conv}. Verglichen mit ${B} → **${right}**.`, `${conv}. Compared with ${B} → **${right}**.`),
    };
  }
}

/** Zeit: Was ist länger? Falle: 1,5 h als 1 h 50 min bzw. 150 min gelesen (Zeit rechnet nicht in Zehnern) */
function timeCompare(): Task {
  const [va, a, b, F] = pick([["1,5", "h", "min", 60], ["2,5", "h", "min", 60], ["0,5", "h", "min", 60], ["1,5", "min", "s", 60], ["0,25", "h", "min", 60], ["1,5", "d", "h", 24], ["0,5", "d", "h", 24], ["2,5", "min", "s", 60]] as [string, string, string, number][]);
  const v = parseQ(va)!, inB = mul(v, q(F));
  const trap = mul(v, q(100)); // als hätte 1 h 100 min
  const mode = pick([0, 1, 2, 3]);
  const vb = mode === 0 ? inB : mode === 1 ? trap : mode === 2 ? mul(inB, q(9, 10)) : mul(inB, q(11, 10));
  if (!isTerminating(vb) || !tidy(vb, 1)) return timeCompare();
  const A = `${num(va)} ${a}`, B = `${T(vb)} ${b}`;
  const cmp = toNumber(vb) - toNumber(inB);
  const same = tr("gleich lang", "the same");
  const right = cmp === 0 ? same : cmp < 0 ? A : B;
  const conv = `${A} = ${num(va)} · ${F} ${b} = ${T(inB)} ${b}`;
  return {
    ...mc(right, [
      right !== same ? dis(same, mode === 1 ? tr(`1 ${a} hat ${F} ${b}, nicht 100. ${conv}.`, `1 ${a} has ${F} ${b}, not 100. ${conv}.`) : tr(`${conv} – nicht dasselbe wie ${B}.`, `${conv} – not the same as ${B}.`)) : null,
      right !== A ? dis(A, tr(`${conv} – ${cmp === 0 ? "genau gleich lang wie" : "kürzer als"} ${B}.`, `${conv} – ${cmp === 0 ? "exactly as long as" : "shorter than"} ${B}.`)) : null,
      right !== B ? dis(B, tr(`${conv} – ${cmp === 0 ? "genau gleich lang wie" : "länger als"} ${B}.`, `${conv} – ${cmp === 0 ? "exactly as long as" : "longer than"} ${B}.`)) : null,
    ]),
    conv: { value: va, from: a, to: b },
    prompt: tr(`Was dauert länger: **${A}** oder **${B}**?`, `Which takes longer: **${A}** or **${B}**?`),
    hint: tr(`Zeit rechnet nicht in Zehnern: 1 ${a} = ${F} ${b}.`, `Time does not work in tens: 1 ${a} = ${F} ${b}.`),
    explain: tr(`${conv}. Verglichen mit ${B} → **${right}**.`, `${conv}. Compared with ${B} → **${right}**.`),
  };
}

/** Zeit: Umrechnungszahl (1 h = ? min) – falsche Antworten: Zehnerschritte, Zwischenstufe, Gegenrichtung */
function timeFactor(): Task {
  const [a, b, right, wrongs] = pick([
    ["h", "min", "60", [dis("100", tr("Zeit rechnet nicht in Zehnern: 1 h = 60 min.", "Time does not work in tens: 1 h = 60 min.")), dis("3600", tr("Das wären Sekunden: 1 h = 3600 s.", "That would be seconds: 1 h = 3600 s.")), dis("24", tr("24 gehört zum Tag: 1 d = 24 h.", "24 belongs to the day: 1 d = 24 h."))]],
    ["min", "s", "60", [dis("100", tr("Zeit rechnet nicht in Zehnern: 1 min = 60 s.", "Time does not work in tens: 1 min = 60 s.")), dis("3600", tr("So viele Sekunden hat eine Stunde.", "That is how many seconds an hour has.")), dis("1000", tr("Hier gibt es keine Vorsilbe – 1 min = 60 s.", "There is no prefix here – 1 min = 60 s."))]],
    ["h", "s", "3600", [dis("60", tr("1 h = 60 min, und jede Minute hat 60 s: 60 · 60 = 3600.", "1 h = 60 min, and each minute has 60 s: 60 · 60 = 3600.")), dis("100", tr("Zeit rechnet nicht in Zehnern: 60 · 60 = 3600.", "Time does not work in tens: 60 · 60 = 3600.")), dis("360", tr("Eine Null zu wenig: 60 · 60 = 3600.", "One zero too few: 60 · 60 = 3600."))]],
    ["d", "h", "24", [dis("60", tr("60 gehört zu Minuten und Sekunden. Ein Tag hat 24 h.", "60 belongs to minutes and seconds. A day has 24 h.")), dis("12", tr("12 Stunden sind ein halber Tag.", "12 hours are half a day.")), dis("100", tr("Zeit rechnet nicht in Zehnern: 1 d = 24 h.", "Time does not work in tens: 1 d = 24 h."))]],
    ["d", "min", "1440", [dis("24", tr("Das sind Stunden: 1 d = 24 h = 24 · 60 min.", "Those are hours: 1 d = 24 h = 24 · 60 min.")), dis("2400", tr("1 h hat 60 min, nicht 100: 24 · 60 = 1440.", "1 h has 60 min, not 100: 24 · 60 = 1440.")), dis("1400", tr("Genau rechnen: 24 · 60 = 1440.", "Calculate carefully: 24 · 60 = 1440."))]],
  ] as [string, string, string, ReturnType<typeof dis>[]][]);
  return {
    ...mc(right, wrongs),
    conv: { value: "1", from: a, to: b },
    prompt: tr(`Setze die **Umrechnungszahl** ein: 1 ${a} = ? ${b}`, `Fill in the **conversion factor**: 1 ${a} = ? ${b}`),
    hint: tr("Denk an die Uhr: Zeit rechnet in 60er- und 24er-Schritten, nicht in Zehnern.", "Think of a clock: time works in steps of 60 and 24, not in tens."),
    explain: `${rowsText(solve("1", a, b))} → **1 ${a} = ${right} ${b}**.`,
  };
}

/** Größenvorstellung: Welche Einheit passt? */
const ESTIMATES_DE: [string, string, string[]][] = [
  ["Ein Klassenzimmer hat etwa 60 __ Bodenfläche.", "m²", ["cm²", "km²", "dm²"]],
  ["Ein Handy-Bildschirm hat etwa 90 __.", "cm²", ["m²", "mm²", "a"]],
  ["Ein Fußballfeld hat etwa 70 __.", "a", ["m²", "km²", "cm²"]],
  ["Eine große Stadt hat eine Fläche von etwa 400 __.", "km²", ["ha", "m²", "a"]],
  ["Eine Briefmarke hat etwa 6 __.", "cm²", ["mm²", "dm²", "m²"]],
  ["Ein Bauernhof hat etwa 20 __ Felder.", "ha", ["m²", "km²", "cm²"]],
  ["Ein Glas Wasser fasst etwa 250 __.", "ml", ["l", "hl", "m³"]],
  ["Eine volle Badewanne fasst etwa 150 __.", "l", ["ml", "hl", "cm³"]],
  ["Ein Zuckerwürfel hat etwa 2 __ Volumen.", "cm³", ["dm³", "m³", "mm³"]],
  ["Ein Schwimmbecken fasst etwa 400 __ Wasser.", "m³", ["dm³", "l", "cm³"]],
  ["Eine Milchpackung fasst 1 __.", "dm³", ["cm³", "m³", "mm³"]],
  ["Ein Sandkorn hat etwa 1 __ Volumen.", "mm³", ["cm³", "dm³", "m³"]],
];
const ESTIMATES_EN: [string, string, string[]][] = [
  ["A classroom has a floor area of about 60 __.", "m²", ["cm²", "km²", "dm²"]],
  ["A phone screen has about 90 __.", "cm²", ["m²", "mm²", "a"]],
  ["A football pitch has about 70 __.", "a", ["m²", "km²", "cm²"]],
  ["A large city has an area of about 400 __.", "km²", ["ha", "m²", "a"]],
  ["A postage stamp has about 6 __.", "cm²", ["mm²", "dm²", "m²"]],
  ["A farm has about 20 __ of fields.", "ha", ["m²", "km²", "cm²"]],
  ["A glass of water holds about 250 __.", "ml", ["l", "hl", "m³"]],
  ["A full bathtub holds about 150 __.", "l", ["ml", "hl", "cm³"]],
  ["A sugar cube has a volume of about 2 __.", "cm³", ["dm³", "m³", "mm³"]],
  ["A swimming pool holds about 400 __ of water.", "m³", ["dm³", "l", "cm³"]],
  ["A milk carton holds 1 __.", "dm³", ["cm³", "m³", "mm³"]],
  ["A grain of sand has a volume of about 1 __.", "mm³", ["cm³", "dm³", "m³"]],
];
const ESTIMATES = tr(ESTIMATES_DE, ESTIMATES_EN);
/**
 * Tipp zur Größenvorstellung: Vergleichsdinge, die in keiner Frage vorkommen (nicht Würfelzucker beim Zuckerwürfel,
 * nicht „1 dm³ = 1 Liter“ bei der Milchpackung, kein Klassenzimmer) – sonst verriete der Tipp die Antwort.
 */
const ESTIMATE_HINT = {
  area: tr("Stell dir die Fläche vor. 1 cm² ≈ Fingernagel, 1 m² ≈ Tischplatte, 1 a = Quadrat mit 10 m Seite.", "Picture the area. 1 cm² ≈ fingernail, 1 m² ≈ table top, 1 a = square with 10 m sides."),
  cube: tr("Stell dir Würfel vor. 1 cm³: Kante 1 cm. 1 dm³: Kante 10 cm. 1 m³: Kante 1 m.", "Picture cubes. 1 cm³: edge 1 cm. 1 dm³: edge 10 cm. 1 m³: edge 1 m."),
  liter: tr("Stell dir Würfel vor. 1 Liter füllt einen Würfel mit 10 cm Kantenlänge.", "Picture cubes. 1 litre fills a cube with 10 cm edges."),
};
/** Größe einer Einheit zum Vorstellen (Rückmeldung bei falscher Einheit) */
const PICTURE: Record<string, [string, string]> = {
  "mm²": ["ein Quadrat mit 1 mm Seite", "a square with 1 mm sides"], "cm²": ["ein Quadrat mit 1 cm Seite", "a square with 1 cm sides"],
  "dm²": ["ein Quadrat mit 10 cm Seite", "a square with 10 cm sides"], "m²": ["ein Quadrat mit 1 m Seite", "a square with 1 m sides"],
  a: ["ein Quadrat mit 10 m Seite", "a square with 10 m sides"], ha: ["ein Quadrat mit 100 m Seite", "a square with 100 m sides"],
  "km²": ["ein Quadrat mit 1 km Seite", "a square with 1 km sides"],
  "mm³": ["ein Würfel mit 1 mm Kante", "a cube with 1 mm edges"], "cm³": ["ein Würfel mit 1 cm Kante", "a cube with 1 cm edges"],
  "dm³": ["ein Würfel mit 10 cm Kante", "a cube with 10 cm edges"], "m³": ["ein Würfel mit 1 m Kante", "a cube with 1 m edges"],
  ml: ["ein Würfel mit 1 cm Kante", "a cube with 1 cm edges"], l: ["ein Würfel mit 10 cm Kante", "a cube with 10 cm edges"],
  hl: ["100 l, so viel wie 100 Würfel mit 10 cm Kante", "100 l, as much as 100 cubes with 10 cm edges"],
};
function estimateTask(filter: string[]): Task {
  const [text, right, wrongs] = pick(ESTIMATES.filter(e => filter.includes(e[1])));
  const n = text.match(/(\d[\d,.]*) __/)?.[1] ?? "1";
  const why = (u: string) => {
    const big = toNumber(unitSi(u)) > toNumber(unitSi(right)), pic = tr(PICTURE[u][0], PICTURE[u][1]);
    return tr(`${n} ${u} wäre viel zu ${big ? "groß" : "klein"}: 1 ${u} ist ${pic}.`, `${n} ${u} would be far too ${big ? "large" : "small"}: 1 ${u} is ${pic}.`);
  };
  return {
    ...mc(right, wrongs.map(u => dis(u, why(u)))),
    prompt: `${tr("Welche Einheit passt?", "Which unit fits?")} ${text.replace("__", "▢")}`,
    hint: /²|\ba\b|ha/.test(right) ? ESTIMATE_HINT.area : /l$/.test(right) ? ESTIMATE_HINT.liter : ESTIMATE_HINT.cube,
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
  const values = big ? ["1,5", "2", "3", "0,5", "0,25", "2,5", "4", "0,75", "1,2", "0,1"].map(num) : ["90", "30", "150", "45", "180", "210", "6", "12", "36", "72", "120", "7200", "900"];
  return inputTask(a, b, { values });
}
/** Werte, die es im Alltag gibt (in SI-Einheiten): keine Dichte von 250 g/cm³ */
const PLAUSIBLE: Record<string, [number, number]> = {
  speed: [1e-4, 3000], density: [0.05, 23000], conc: [1e-3, 20000], flow: [1e-8, 100], pressure: [1, 1e9],
};
const qtyOf = (u: string) => QUANTITIES.find(x => x.units.some(y => y.sym === u))?.id;
function plausible(v: Q, u: string, other: string): boolean {
  const r = PLAUSIBLE[qtyOf(u) ?? qtyOf(other) ?? ""];
  if (!r) return true;
  const si = toNumber(mul(v, unitSi(u)));
  return si >= r[0] && si <= r[1];
}

/** Wert so wählen, dass das Ergebnis „schön“ und alltagsnah ist, sonst auf 2 Stellen runden */
function compound(pairs: [string, string][]): Task {
  const [a, b] = swap(pick(pairs));
  for (let tries = 0; tries < 60; tries++) {
    const res = parseQ(pick(["10", "20", "25", "5", "15", "2", "4", "1,5", "30", "50", "100", "0,5", "36", "72", "12", "3", "7,2", "0,8", "250"]))!;
    const v = div(res, div(unitSi(a), unitSi(b)));
    if (tidy(v, 4, 7) && plausible(v, a, b)) return makeInput(T(v), a, b, solve(v, a, b));
  }
  // kein „schönes“ Ergebnis (PS ↔ kW: 1 PS = 0,735 498 75 kW): runden statt viele Nachkommastellen eintippen lassen
  const value = pick(["1", "2", "5", "10", "100"]), s = solve(value, a, b);
  return makeInput(value, a, b, s, tidy(s.result, 3) ? undefined : 2);
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
    ["km/h", "m/s", num("1/3,6"), [dis(num("3,6"), tr("Das ist 1 m/s in km/h – die Gegenrichtung.", "That is 1 m/s in km/h – the other direction.")), dis("1000", tr("1 km = 1000 m, aber 1 h hat auch 3600 s: 1000 m / 3600 s.", "1 km = 1000 m, but 1 h also has 3600 s: 1000 m / 3600 s.")),
      dis(num("0,36"), tr("1000 m / 3600 s = 1/3,6 m/s ≈ 0,28 m/s, nicht 0,36.", "1000 m / 3600 s = 1/3.6 m/s ≈ 0.28 m/s, not 0.36."))]],
    ["m/s", "km/h", num("3,6"), [dis(num("1/3,6"), tr("Das ist 1 km/h in m/s – die Gegenrichtung.", "That is 1 km/h in m/s – the other direction.")), dis("1000", tr("1 m = 0,001 km und 1 s = 1/3600 h: 0,001 km / (1/3600 h).", "1 m = 0.001 km and 1 s = 1/3600 h: 0.001 km / (1/3600 h).")),
      dis("36", tr("Eine Null zu viel: 0,001 km / (1/3600 h) = 3600 : 1000 km/h = 3,6 km/h.", "One zero too many: 0.001 km / (1/3600 h) = 3600 ÷ 1000 km/h = 3.6 km/h."))]],
    ["g/cm³", "kg/m³", "1000", [dis("1", tr("1 g/cm³ = 1 kg/dm³ – gefragt ist aber kg/m³.", "1 g/cm³ = 1 kg/dm³ – but the question asks for kg/m³.")), dis(num("0,001"), tr("Gegenrichtung: 1 kg/m³ = 0,001 g/cm³.", "Other direction: 1 kg/m³ = 0.001 g/cm³.")),
      dis("100", tr("Volumen: 1 m³ = 1 000 000 cm³ (· 100 · 100 · 100), dazu 1 kg = 1000 g: 1 000 000 : 1000 = 1000.", "Volume: 1 m³ = 1 000 000 cm³ (· 100 · 100 · 100), and 1 kg = 1000 g: 1 000 000 ÷ 1000 = 1000."))]],
    ["kWh", "kJ", "3600", [dis("1000", tr("kW bleibt kW – nur h wird zu s: 1 h = 3600 s.", "kW stays kW – only h becomes s: 1 h = 3600 s.")), dis("60", tr("1 h = 60 min, gefragt sind aber Sekunden: 3600 s.", "1 h = 60 min, but the question asks for seconds: 3600 s.")),
      dis("360", tr("Eine Null zu wenig: 1 h = 3600 s, also 1 kWh = 3600 kJ.", "One zero too few: 1 h = 3600 s, so 1 kWh = 3600 kJ."))]],
    ["bar", "hPa", "1000", [dis("100", tr("1 bar = 100 000 Pa und 1 hPa = 100 Pa.", "1 bar = 100 000 Pa and 1 hPa = 100 Pa.")), dis("100 000", tr("Das wären Pa: 1 bar = 100 000 Pa.", "That would be Pa: 1 bar = 100 000 Pa.")),
      dis("10", tr("1 bar = 100 000 Pa und 1 hPa = 100 Pa: 100 000 : 100 = 1000.", "1 bar = 100 000 Pa and 1 hPa = 100 Pa: 100 000 ÷ 100 = 1000."))]],
    ["Ah", "C", "3600", [dis("60", tr("1 C = 1 A · s und 1 h = 3600 s.", "1 C = 1 A · s and 1 h = 3600 s.")), dis("1000", tr("Hier gibt es keine Vorsilbe – 1 h = 3600 s.", "There is no prefix here – 1 h = 3600 s.")),
      dis(num("3,6"), tr("3,6 gehört zu km/h und m/s. Hier: 1 h = 3600 s, also 1 Ah = 3600 A · s = 3600 C.", "3.6 belongs to km/h and m/s. Here: 1 h = 3600 s, so 1 Ah = 3600 A · s = 3600 C."))]],
    ["l/min", "l/h", "60", [dis("1/60", tr("Gegenrichtung: 1 l/h = 1/60 l/min.", "Other direction: 1 l/h = 1/60 l/min.")), dis("3600", tr("1 h = 60 min (nicht Sekunden).", "1 h = 60 min (not seconds).")),
      dis("100", tr("Zeit rechnet nicht in Zehnern: 1 h = 60 min.", "Time does not work in tens: 1 h = 60 min."))]],
    ["m³/h", "l/h", "1000", [dis("100", tr("1 m³ = 1000 dm³ = 1000 l.", "1 m³ = 1000 dm³ = 1000 l.")), dis(num("0,001"), tr("Gegenrichtung: 1 l = 0,001 m³.", "Other direction: 1 l = 0.001 m³.")),
      dis("10", tr("Volumen: jeder Schritt · 10 · 10 · 10. 1 m³ = 1000 dm³ = 1000 l.", "Volume: each step · 10 · 10 · 10. 1 m³ = 1000 dm³ = 1000 l."))]],
  ] as [string, string, string, ReturnType<typeof dis>[]][]);
  return {
    ...mc(right, wrongs),
    conv: { value: "1", from: a, to: b },
    prompt: tr(`Umrechnungszahl: 1 ${a} = ? ${b}`, `Conversion factor: 1 ${a} = ? ${b}`),
    hint: tr("Ersetze jede Einheit durch ihren Wert in der neuen Einheit.", "Replace each unit by its value in the new unit."),
    explain: `${tr("Einsetzen", "Substitute")}: ${rowsText(solve("1", a, b))} → **1 ${a} = ${right} ${b}**.`,
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
  f_compare: () => compareTask(AREA, 4, 2), f_est: () => estimateTask(["m²", "cm²", "a", "km²", "ha"]),
  // Niveau 4
  v_p10: volTask(P10), v_num: volTask(NUMS), v_factor: () => factorTask(VOL, 2, 3), v_liter: () => { const [a, b] = swap(pick(LITER)); return inputTask(a, b, { maxDec: 7 }); },
  v_compare: () => compareTask(VOL, 4, 3), v_est: () => estimateTask(["ml", "l", "cm³", "m³", "dm³", "mm³"]),
  // Niveau 5 (Unterstufe: Zeit)
  c_time: timeTask, t_factor: timeFactor, t_compare: timeCompare,
  // Niveau 5 (Oberstufe: zusammengesetzt)
  c_num: () => compound(NUMER), c_den: () => compound(DENOM), c_both: () => compound(BOTH), c_named: () => compound(NAMED_PAIRS), c_factor: factorComp,
};
/** Reihenfolge in Niveau 5 der Oberstufe: vom Leichten zum Schweren */
const STAGE: Record<string, number> = { c_time: 0, c_num: 1, c_den: 2, c_factor: 3, c_both: 3, c_named: 4 };

export const TYPE_NAMES: Record<string, string> = tr({
  z_len: "Längen · Zehnerschritte", z_mass: "Massen · Zehnerschritte", z_lit: "Liter · Zehnerschritte", z_pre: "Vorsilben · Zehnerschritte", z_factor: "Umrechnungszahlen",
  k_len: "Längen umrechnen", k_mass: "Massen umrechnen", k_lit: "Liter umrechnen", k_pre: "Vorsilben umrechnen", k_rule: "Mal oder geteilt?", k_compare: "Vergleichen",
  f_p10: "Flächen · Zehnerschritte", f_num: "Flächen umrechnen", f_factor: "Umrechnungszahlen (Fläche)", f_ha: "Hektar und Ar", f_compare: "Flächen vergleichen", f_est: "Größenvorstellung (Fläche)",
  v_p10: "Volumen · Zehnerschritte", v_num: "Volumen umrechnen", v_factor: "Umrechnungszahlen (Volumen)", v_liter: "Liter und dm³", v_compare: "Volumen vergleichen", v_est: "Größenvorstellung (Volumen)",
  c_time: "Zeit umrechnen", t_factor: "Umrechnungszahlen (Zeit)", t_compare: "Zeiten vergleichen",
  c_num: "Zähler umrechnen", c_den: "Nenner umrechnen", c_both: "Zähler und Nenner", c_named: "Druck, Energie, Ladung", c_factor: "Umrechnungszahlen (zusammengesetzt)",
}, {
  z_len: "Lengths · steps of ten", z_mass: "Masses · steps of ten", z_lit: "Litres · steps of ten", z_pre: "Prefixes · steps of ten", z_factor: "Conversion factors",
  k_len: "Converting lengths", k_mass: "Converting masses", k_lit: "Converting litres", k_pre: "Converting prefixes", k_rule: "Multiply or divide?", k_compare: "Comparing",
  f_p10: "Areas · steps of ten", f_num: "Converting areas", f_factor: "Conversion factors (area)", f_ha: "Hectares and ares", f_compare: "Comparing areas", f_est: "Sense of size (area)",
  v_p10: "Volumes · steps of ten", v_num: "Converting volumes", v_factor: "Conversion factors (volume)", v_liter: "Litres and dm³", v_compare: "Comparing volumes", v_est: "Sense of size (volume)",
  c_time: "Converting time", t_factor: "Conversion factors (time)", t_compare: "Comparing times",
  c_num: "Converting the numerator", c_den: "Converting the denominator", c_both: "Numerator and denominator", c_named: "Pressure, energy, charge", c_factor: "Conversion factors (derived)",
});

export type Stufe = "us" | "os";
interface Level extends QuizLevel { types: string[] }
const BASE = (pre: boolean): Level[] => [
  { id: "n1", name: tr("Zehnerschritte", "Steps of ten"), desc: num("1 m = 100 cm · 0,01 kg = 10 g"), types: ["z_len", "z_mass", "z_lit", ...(pre ? ["z_pre"] : []), "z_factor"] },
  { id: "n2", name: tr("Beliebige Zahlen", "Any numbers"), desc: tr("1,5 g = 0,0015 kg · 3,45 m = 345 cm", "1.5 g = 0.0015 kg · 3.45 m = 345 cm"), types: ["k_len", "k_mass", "k_lit", ...(pre ? ["k_pre"] : []), "k_rule", "k_compare"] },
  { id: "n3", name: tr("Flächen", "Areas"), desc: "m² → dm²: · 10 · 10 = · 100", types: ["f_p10", "f_num", "f_factor", "f_ha", "f_compare", "f_est"] },
  { id: "n4", name: tr("Volumen", "Volumes"), desc: "m³ → dm³: · 10 · 10 · 10 · 1 l = 1 dm³", types: ["v_p10", "v_num", "v_factor", "v_liter", "v_compare", "v_est"] },
];
/** Unterstufe: ohne seltene Vorsilben, Niveau 5 = Zeit. Oberstufe: alles, Niveau 5 = zusammengesetzte Einheiten. */
export const LEVELS: Record<Stufe, Level[]> = {
  us: [...BASE(false), { id: "n5", name: tr("Zeit", "Time"), desc: num("1 h = 60 min · 1 d = 24 h · 1,5 h = 90 min"), types: ["c_time", "t_factor", "t_compare"] }],
  os: [...BASE(true).map(l => ({ ...l, id: `os-${l.id}` })),
    { id: "os-n5", name: tr("Zusammengesetzt", "Derived units"), desc: "h → s · km/h → m/s · g/cm³ → kg/m³ · bar", types: ["c_time", "c_num", "c_den", "c_both", "c_named", "c_factor"] }],
};

const lv = (stufe: string) => LEVELS[stufe === "os" ? "os" : "us"];
export const levelId = (stufe: string, level: LevelKey) => (typeof level === "number" ? lv(stufe)[level].id : `${stufe}-${level}`);
export const levelName = (stufe: string, level: LevelKey) =>
  level === "mix" ? tr("Alles gemischt", "Everything mixed") : level === "weak" ? tr("Schwächen üben", "Practise weak spots") : level === "due" ? tr("Heute fällig", "Due today") : lv(stufe)[level].name;

export function makeRound(stufe: string, level: LevelKey, stats?: TypeStats, due: string[] = []): Task[] {
  const levels = lv(stufe);
  const inStufe = (id: string) => levels.some(l => l.types.includes(id));
  let ids = level === "mix" ? [...new Set(levels.flatMap(l => l.types))]
    : level === "weak" ? weakTypes(stats, inStufe)
    : level === "due" ? due.filter(inStufe)
    : levels[level].types;
  if (!ids.length) ids = levels[0].types;
  const round = buildRound(ids, GENS, 10);
  // Niveau 5 der Oberstufe stufenweise: erst Zeit, dann nur Zähler, nur Nenner, beide, zuletzt Einheiten mit eigenem Namen
  if (stufe !== "os" || level !== 4) return round;
  return round.map((t, i) => ({ t, i })).sort((x, y) => STAGE[x.t.type!] - STAGE[y.t.type!] || x.i - y.i).map(x => x.t);
}

/** Stellenwerttafel, in der beide Einheiten stehen */
export const tableFor = (from: string, to: string) => TABLES.find(t => t.includes(from) && t.includes(to));

/** Lösung einer Eingabe-Aufgabe */
export const solutionOf = (t: Extract<Task, { kind: "input" }>) => solve(t.value, t.from, t.to);
/** Eingabe lesen: Einheit dahinter erlaubt; Trennzeichen nach der Sprache („1.000“ ist im Deutschen 1000, nie 1) – null, wenn keine Zahl */
export const readInput = (t: Extract<Task, { kind: "input" }>, input: string): Q | null => parseAnswer(input, t.to)[0] ?? null;
/** Gelesene Zahl speichern: exakt als Bruch (Zähler n, Nenner d) – gespeicherte Antworten sind Zahlen; zu große Zahlen als Näherung x */
export function storedValue(v: Q): Record<string, number> {
  const n = Number(v.n), d = Number(v.d);
  return Number.isSafeInteger(n) && Number.isSafeInteger(d) ? { n, d } : { x: toNumber(v) };
}
/** Gespeicherte Antwort als Text, so wie sie gelesen wurde („1.000“ → 1000, „0,06 m“ → 0,06, „2,5·10⁻⁴“ → 0,000 25) */
export function storedText(values: Record<string, number>): string {
  if (values.n !== undefined && values.d !== undefined) return fmt(q(values.n, values.d)).text;
  const x = values.x ?? values.v; // v: Speicherform früherer Versionen
  if (x === undefined) return "";
  const v = Number.isFinite(x) ? parseQ(String(x)) : null; // „10000“ → „10 000“ wie alle Zahlen
  return v ? T(v) : String(x).replace(".", tr(",", "."));
}
/** Antwort prüfen (exakt bzw. mit Rundung) */
export function checkInput(t: Extract<Task, { kind: "input" }>, input: string): boolean | null {
  const v = readInput(t, input);
  if (!v) return null;
  const r = solutionOf(t).result;
  if (t.round === undefined) return eq(v, r);
  const tol = toNumber(pow10(-t.round)) / 2 + 1e-12;
  return Math.abs(toNumber(v) - toNumber(r)) <= tol;
}
