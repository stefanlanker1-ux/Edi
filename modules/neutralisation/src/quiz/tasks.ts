// Quiz-Aufgaben zur Neutralisation (reine Daten, damit Runden gespeichert werden können).
// Jede falsche Antwort steht für eine Fehlvorstellung (misconceptions.ts): d(text, schlüssel, rückmeldung).

import {
  PROTIC_ACIDS, PROTIC_BY_ID, HYDROXIDE_BY_ID, hydroxidesFor, restOf, restName, isKnownSalt, neutralEquation, protolysis, proticWord,
  equationText, isBalanced, parseFormula, toSubscript, ionText, chargeFull, formula as saltFormula, ratio,
  type Equation, type Hydroxide, type Ion, type ProticAcid,
} from "@lern/chem";
import { buildRound, mc, d, pick, shuffle, weakTypes, type BaseTask, type LevelKey, type McTask, type QuizLevel, type Trap, type TypeStats } from "@lern/quiz";
import type { Stufe } from "../store.ts";

/** `f`: Formeln der Aufgabe (für die Markierung im PSE) */
type Extra = { f?: string[] };
export type Task = (McTask & Extra) | (BaseTask & Extra & { kind: "build"; base: string; acid: string; step: number });

const F = toSubscript;
const ion = (formula: string, charge: number) => ionText({ id: "", formula, charge, part: "", name: "" });
const cf = (n: number) => (n === 1 ? "" : `${n} `);
const hAtoms = (a: ProticAcid) => parseFormula(a.formula).H ?? 0;
/** Formel ohne H-Atome, z. B. CH3COOH → C2O2 (für die Fehlvorstellung „alle H sind sauer“) */
const withoutH = (f: string) => Object.entries(parseFormula(f)).filter(([el]) => el !== "H").map(([el, n]) => el + (n > 1 ? n : "")).join("");
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Zufällige Lauge + Säure (+ abgegebene H⁺), nur Salze, die es in Wasser gibt. Oberstufe: manchmal nur teilweise neutralisiert. */
function pair(os: boolean, partialChance = 0): { b: Hydroxide; a: ProticAcid; k: number } {
  for (;;) {
    const b = pick(hydroxidesFor(os)), a = pick(PROTIC_ACIDS);
    const k = os && a.protons > 1 && Math.random() < partialChance ? 1 + Math.floor(Math.random() * (a.protons - 1)) : a.protons;
    if (isKnownSalt(b, restOf(a, k))) return { b, a, k };
  }
}
const partialText = (a: ProticAcid, k: number) => (k < a.protons ? ` – jedes ${F(a.formula)} gibt nur **${k} H⁺** ab` : "");

// Namensfamilien für die Endungen -id / -it / -at (nur Ionen, die es gibt)
const FAMILY: [string, string][][] = [
  [["Sulfid", "S²⁻"], ["Sulfit", "SO₃²⁻"], ["Sulfat", "SO₄²⁻"]],
  [["Nitrid", "N³⁻"], ["Nitrit", "NO₂⁻"], ["Nitrat", "NO₃⁻"]],
  [["Chlorid", "Cl⁻"], ["Chlorat", "ClO₃⁻"], ["Perchlorat", "ClO₄⁻"]],
  [["Bromid", "Br⁻"], ["Bromat", "BrO₃⁻"]],
  [["Phosphid", "P³⁻"], ["Phosphat", "PO₄³⁻"]],
];
/** Hydrogen-Ionen derselben Familie, die es gibt (mit Formel) */
const HYDROGEN_FAMILY: [string, string][] = [["Hydrogensulfid", "HS⁻"], ["Hydrogensulfit", "HSO₃⁻"], ["Hydrogensulfat", "HSO₄⁻"]];
/** Säurereste ähnlicher Säuren, die leicht verwechselt werden */
const LOOKALIKE: Record<string, [string, string]> = { Formiat: ["Acetat", "CH₃COO⁻"], Acetat: ["Formiat", "HCOO⁻"] };
const LOOKALIKE_ACID: Record<string, string> = { hcooh: "ch3cooh", ch3cooh: "hcooh" };
/** Säurerest-Namen der gleichen Familie, z. B. Sulfat → Sulfid, Sulfit; Hydrogensulfat → Hydrogensulfid, Hydrogensulfit */
function family(name: string): [string, string][] {
  if (/^hydrogen/i.test(name)) return HYDROGEN_FAMILY.filter(([n]) => n.toLowerCase() !== name.toLowerCase());
  if (/^dihydrogen/i.test(name)) return [];
  const fam = FAMILY.find(f => f.some(([n]) => n.toLowerCase() === name.toLowerCase()));
  return fam ? fam.filter(([n]) => n.toLowerCase() !== name.toLowerCase()) : [];
}
/** falsche Säurerest-Namen, die man aus dem Säurenamen bilden würde */
const NAME_FROM_ACID: Record<string, string> = { hcooh: "Ameisenat", ch3cooh: "Essigat", hclo4: "Perchlorid", hno3: "Salpeterat", h2co3: "Kohlenat" };

// ── Säuren ───────────────────────────────────────────────────────────────────

/** In welche Ionen zerfällt die Säure? */
function protolyse(): Task {
  const a = pick(PROTIC_ACIDS), k = a.protons, r = restOf(a), hs = hAtoms(a);
  const o = parseFormula(r.formula).O ?? 0;
  const right = `${cf(k)}H⁺ + ${ionText(r)}`;
  return {
    ...mc(right, [
      k > 1 ? d(`${ion("H" + k, 1)} + ${ionText(r)}`, "index-als-ladung", `Die ${k} in ${F(a.formula)} ist eine Anzahl: Es entstehen **${k} einzelne H⁺-Ionen**, kein ${ion("H" + k, 1)}.`) : null,
      k > 1 ? d(`${k} H⁺ + ${ion(r.formula, -1)}`, "rest-ladung-eins", `${k} H⁺ tragen zusammen ${k}+. Die Säure war neutral – also hat der Rest **${k}−**: ${ionText(r)}.`) : null,
      d(`${cf(k)}H⁺ + ${ion(r.formula, k)}`, "rest-ladung-vorzeichen", `Positive H⁺ gehen weg – zurück bleibt ein **negativer** Rest: ${ionText(r)}.`),
      o > 0 && o !== k ? d(`${cf(k)}H⁺ + ${ion(r.formula, -o)}`, "rest-ladung-sauerstoff", `Die Ladung zählt die abgegebenen H⁺ (${k}), nicht die O-Atome (${o}): ${ionText(r)}.`) : null,
      hs > k ? d(`${hs} H⁺ + ${ion(withoutH(a.formula), -hs)}`, "alle-h-sauer", `Nur das H der **COOH-Gruppe** wird abgegeben – ${a.name} ist ${proticWord(k)}: ${protolysis(a)}.`) : null,
      d(`${cf(k)}H + ${F(r.formula)}`, "ohne-ladung", `In Wasser entstehen **Ionen**, keine neutralen Atome: Das H geht ohne sein Elektron weg (H⁺), der Rest behält es (${ionText(r)}).`),
      `${cf(k)}H⁺ + ${ion(r.formula, -(k + 1))}`, `${cf(k + 1)}H⁺ + ${ionText(r)}`,
    ]),
    prompt: `Welche Ionen entstehen, wenn **${F(a.formula)}** (${a.name}) in Wasser H⁺ abgibt?`,
    hint: "Die H vorne in der Formel werden zu H⁺. Der Rest trägt genauso viele Minus, wie H⁺ weggegangen sind.",
    explain: `${protolysis(a)} – ${k === 1 ? "ein Plus und ein Minus" : `${k} Plus und ${k} Minus`}, zusammen neutral. Säurerest: **${restName(r)}**.`,
    f: [a.formula],
  };
}

/** Wie viele H⁺ kann die Säure abgeben? (Oberstufe) */
function protonen(): Task {
  // organische Säuren öfter: dort steckt die Falle „alle H zählen“
  const a = Math.random() < 0.35 ? PROTIC_BY_ID[pick(["hcooh", "ch3cooh"])] : pick(PROTIC_ACIDS);
  const k = a.protons, hs = hAtoms(a), atoms = Object.values(parseFormula(a.formula)).reduce((x, y) => x + y, 0);
  const o = parseFormula(a.formula).O ?? 0;
  return {
    ...mc(String(k), [
      hs > k ? d(String(hs), "alle-h-sauer", `${F(a.formula)} hat ${hs} H-Atome, aber nur das H der **COOH-Gruppe** ist sauer – die H am C bleiben gebunden.`) : null,
      k > 1 ? d("1", "ein-proton", `${F(a.formula)} ist ${proticWord(k)}: alle ${k} H vorne in der Formel können als H⁺ abgegeben werden (schrittweise).`) : null,
      o > 0 && o !== k && o !== hs && o <= 4 ? d(String(o), "rest-ladung-sauerstoff", `Die ${o} O-Atome geben nichts ab. Abgegeben werden die H vorne in der Formel: **${k}**.`) : null,
      atoms <= 4 && atoms !== k && atoms !== hs && atoms !== o ? d(String(atoms), "atome-statt-h", `${F(a.formula)} hat ${atoms} Atome – abgegeben werden nur die H vorne in der Formel: **${k}**.`) : null,
      "1", "2", "3", "4",
    ]),
    prompt: `Wie viele **H⁺** kann ein Molekül **${F(a.formula)}** (${a.name}) höchstens abgeben?`,
    hint: "Zähle die H vorne in der Formel – jedes kann als H⁺ weggehen. Bei COOH-Säuren nur das H der COOH-Gruppe.",
    explain: `${a.name} ist **${proticWord(k)}**: ${protolysis(a)}.${hs - k === 1 ? " Das andere H bleibt am Kohlenstoff." : hs > k ? ` Die übrigen ${hs - k} H bleiben am Kohlenstoff.` : ""}`,
    f: [a.formula],
  };
}

/** Wie heißt der Säurerest? */
function restNameQ(os: boolean): Task {
  const a = pick(PROTIC_ACIDS);
  const k = os && a.protons > 1 && Math.random() < 0.5 ? 1 + Math.floor(Math.random() * (a.protons - 1)) : a.protons;
  const r = restOf(a, k), right = restName(r);
  const byIon = Math.random() < 0.5;
  const others = PROTIC_ACIDS.flatMap(x => (os ? x.rests : [restOf(x)])).map(restName).filter(n => n !== right);
  return {
    ...mc(right, [
      ...family(right).map(([n, f]) => d(n, "endung-id-at-it", `**${n}** wäre ${f}. Aus ${F(a.formula)} bleibt ${ionText(r)} übrig – das ist **${right}**.`)),
      LOOKALIKE[right] ? d(LOOKALIKE[right][0], "rest-verwechselt", `**${LOOKALIKE[right][0]}** ist ${LOOKALIKE[right][1]} aus einer anderen Säure. Aus ${F(a.formula)} bleibt ${ionText(r)} übrig – das ist **${right}**.`) : null,
      d(a.name, "saeurename-statt-rest", `${a.name} ist die Säure selbst. Was nach Abgabe der H⁺ übrig bleibt, heißt **${right}**.`),
      NAME_FROM_ACID[a.id] && k === a.protons ? d(NAME_FROM_ACID[a.id], "rest-aus-saeurename", `Der Säurerest bekommt einen eigenen Namen: ${ionText(r)} heißt **${right}**.`) : null,
      ...(os ? a.rests.filter(x => x !== r).map(x => d(restName(x), "hydrogen-verzaehlt",
        `${restName(x)} ist ${ionText(x)}. ${ionText(r)} ${r.formula.startsWith("H") ? `hat noch ${parseFormula(r.formula).H} H` : "hat kein H mehr"} → **${right}**.`)) : []),
      ...shuffle(others).slice(0, 3),
    ]),
    prompt: byIon
      ? `Wie heißt das Ion **${ionText(r)}**?`
      : `Wie heißt der Säurerest, wenn **${F(a.formula)}** ${k === a.protons ? (k === 1 ? "sein H⁺" : `alle ${k} H⁺`) : `nur ${k} H⁺`} abgibt?`,
    hint: os ? "Endungen: -id (kein O), -it (ein O weniger), -at. Bleibt H im Ion: Hydrogen-, bei zwei H Dihydrogen-." : "Endungen: -id ohne Sauerstoff (Chlorid, Sulfid), -at mit Sauerstoff (Sulfat, Nitrat); -it hat ein O weniger als -at.",
    explain: `${protolysis(a, k)} → ${ionText(r)} heißt **${right}**.`,
    f: [a.formula],
  };
}

/** Welche Ladung hat der Säurerest? */
function restLadung(os: boolean): Task {
  const a = pick(PROTIC_ACIDS);
  const k = os && a.protons > 1 && Math.random() < 0.5 ? 1 + Math.floor(Math.random() * (a.protons - 1)) : a.protons;
  const r = restOf(a, k), hs = hAtoms(a), o = parseFormula(r.formula).O ?? 0;
  return {
    ...mc(chargeFull(-k), [
      k > 1 ? d("1−", "rest-ladung-eins", `Es gehen ${k} H⁺ weg, also ${k} Plus – zurück bleiben **${k} Minus**: ${ionText(r)}.`) : null,
      d(chargeFull(k), "rest-ladung-vorzeichen", `Die H⁺ nehmen die positiven Ladungen mit – der Rest ist **negativ**: ${ionText(r)}.`),
      o > 0 && o !== k && o <= 4 ? d(chargeFull(-o), "rest-ladung-sauerstoff", `Die Ladung zählt die abgegebenen H⁺ (${k}), nicht die O-Atome (${o}).`) : null,
      hs > a.protons && k === a.protons ? d(chargeFull(-hs), "alle-h-sauer", `Nur das H der COOH-Gruppe geht weg – ${F(a.formula)} gibt **1 H⁺** ab, der Rest ist 1−.`) : null,
      k < a.protons ? d(chargeFull(-a.protons), "stufe-ignoriert", `Es gehen nur **${k} H⁺** weg, nicht alle ${a.protons} – also nur ${k} Minus: ${ionText(r)}.`) : null,
      "1−", "2−", "3−", "2+",
    ]),
    prompt: `**${F(a.formula)}** gibt ${k === a.protons ? (k === 1 ? "sein H⁺" : `alle ${k} H⁺`) : `nur ${k} H⁺`} ab. Welche Ladung hat der Säurerest ${F(r.formula)}?`,
    hint: "So viele H⁺ (Plus) weggehen, so viele Minus bleiben am Rest.",
    explain: `${protolysis(a, k)}: ${k} H⁺ weg → Rest **${chargeFull(-k)}** (${restName(r)}).`,
    f: [a.formula],
  };
}

// ── Laugen und Neutralisation ────────────────────────────────────────────────

/** In welche Ionen zerfällt das Metallhydroxid? */
function hydroxid(os: boolean): Task {
  const b = pick(hydroxidesFor(os)), c = b.cation, q = c.charge;
  const right = `${ionText(c)} + ${cf(q)}OH⁻`;
  return {
    ...mc(right, [
      q > 1 ? d(`${ionText(c)} + ${ion("OH" + q, -q)}`, "oh-zusammengefasst", `Die ${q} hinter der Klammer heißt: **${q} einzelne OH⁻-Ionen**. Ein OH${F(String(q))} gibt es nicht.`) : null,
      d(`${ionText(c)} + ${cf(q)}O²⁻ + ${cf(q)}H⁺`, "oh-zerlegt", "OH⁻ bleibt als Ganzes zusammen: Metallhydroxide bestehen aus Metall-Ionen und **Hydroxid-Ionen OH⁻**."),
      q === 1 ? d(`${ion(c.formula + "O", -1)} + H⁺`, "lauge-gibt-h", "Hydroxide geben kein H⁺ ab, sondern **OH⁻** – daran erkennt man Laugen.") : null,
      d(q > 1 ? `${ion(c.formula, 1)} + ${q} OH⁻` : `${ion(c.formula, 2)} + 2 OH⁻`, "kation-ladung",
        `${c.name.replace(/-Ion$/, "")} bildet ${ionText(c)} – dazu gehören genau **${q} OH⁻**, dann ist ${F(b.formula)} neutral.`),
    ]),
    prompt: `Aus welchen Ionen besteht **${F(b.formula)}** (${b.name})?`,
    hint: "Das Metall wird zum Kation. Die Zahl hinter (OH) sagt, wie viele OH⁻-Ionen dazugehören.",
    explain: `${F(b.formula)} → **${right}**: ${cf(q)}OH⁻ gleichen die Ladung ${ionText(c)} aus.`,
    f: [b.formula],
  };
}

/** Wie viele Wassermoleküle entstehen? */
function wasser(os: boolean): Task {
  let p = pair(os, 0.35), n = neutralEquation(p.b, p.a, p.k);
  for (let i = 0; i < 4 && n.water === 1 && Math.random() < 0.75; i++) { p = pair(os, 0.35); n = neutralEquation(p.b, p.a, p.k); }
  const { b, a, k } = p, q = b.cation.charge, w = n.water;
  return {
    ...mc(String(w), [
      w !== 1 ? d("1", "ein-wasser", `Jedes H⁺ bildet mit einem OH⁻ **ein** H₂O. Hier sind es ${w} H⁺ und ${w} OH⁻ → **${w} H₂O**.`) : null,
      n.nBase + n.nAcid !== w ? d(String(n.nBase + n.nAcid), "wasser-summe", `Nicht die Formeleinheiten zählen, sondern die OH⁻: ${n.nBase} · ${q} OH⁻ = **${w}**.`) : null,
      d(String(2 * w), "wasser-atome", `Aus **einem** H⁺ und **einem** OH⁻ wird **ein** H₂O – nicht zwei.`),
      n.nAcid > 1 && k !== w ? d(String(k), "eine-formeleinheit", `${k} H⁺ bringt **ein** ${F(a.formula)} – es sind aber ${n.nAcid}: ${n.nAcid} · ${k} = **${w}**.`) : null,
      n.nBase > 1 && q !== w && q !== k ? d(String(q), "eine-formeleinheit", `${q} OH⁻ bringt **ein** ${F(b.formula)} – es sind aber ${n.nBase}: ${n.nBase} · ${q} = **${w}**.`) : null,
      String(w + 1), String(Math.max(1, w - 1)), String(w + 2),
    ]),
    prompt: `**${cf(n.nBase)}${F(b.formula)} + ${cf(n.nAcid)}${F(a.formula)}** → ${F(n.salt)} + **?** H₂O${partialText(a, k)}. Wie viele Wassermoleküle entstehen?`,
    hint: "Zähle die OH⁻ der Lauge (oder die H⁺ der Säure): Jedes Paar H⁺ + OH⁻ ergibt ein H₂O.",
    explain: `${n.nBase} · ${q} OH⁻ = ${w} OH⁻ und ${n.nAcid} · ${k} H⁺ = ${w} H⁺ → **${w} H₂O**.`,
    f: [b.formula, a.formula, n.salt],
  };
}

const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : x);

/** Neutralisation mit Bausteinen bauen */
function bauen(os: boolean): Task {
  let p = pair(os, 0.35), n = neutralEquation(p.b, p.a, p.k);
  for (let i = 0; i < 4 && n.nBase === 1 && n.nAcid === 1 && Math.random() < 0.7; i++) { p = pair(os, 0.35); n = neutralEquation(p.b, p.a, p.k); }
  const { b, a, k } = p, q = b.cation.charge;
  const traps = ([
    n.nBase !== 1 || n.nAcid !== 1 ? { values: { nB: 1, nA: 1 }, miss: "koeff-1zu1", why: `1 ${F(b.formula)} bringt ${q} OH⁻, 1 ${F(a.formula)} bringt ${k} H⁺ – nicht gleich viele. Die Reihen müssen gleich lang sein.` } : null,
    n.nBase !== n.nAcid ? { values: { nB: n.nAcid, nA: n.nBase }, miss: "koeff-vertauscht", why: `Genau verkehrt: jetzt sind es ${n.nAcid * q} OH⁻ und ${n.nBase * k} H⁺. Über Kreuz: ${F(b.formula)} bringt ${q} OH⁻, ${F(a.formula)} ${k} H⁺ → ${n.nBase} : ${n.nAcid}.` } : null,
    gcd(q, k) > 1 ? { values: { nB: k, nA: q }, miss: "nicht-gekuerzt", why: `Neutral, aber nicht die kleinsten Zahlen: ${k} : ${q} lässt sich kürzen auf ${n.nBase} : ${n.nAcid}.` } : null,
  ] as (Trap | null)[]).filter((t): t is Trap => t !== null);
  return {
    kind: "build", base: b.id, acid: a.id, step: k, traps,
    prompt: `Neutralisiere **${F(b.formula)}** mit **${F(a.formula)}**${partialText(a, k)}. Wie viele von jedem?`,
    hint: "Nimm so viele von jedem, bis die OH⁻-Reihe und die H⁺-Reihe gleich lang sind – mit möglichst wenigen.",
    explain: `${n.nBase} · ${q} OH⁻ = ${n.water} OH⁻ und ${n.nAcid} · ${k} H⁺ = ${n.water} H⁺ → ${n.water} H₂O und **${F(n.salt)}**.`,
    f: [b.formula, a.formula],
  };
}

/** Fehlender Koeffizient in der Gleichung (Oberstufe) */
function koeffizient(os: boolean): Task {
  let p = pair(os, 0.35), n = neutralEquation(p.b, p.a, p.k);
  for (let i = 0; i < 6 && n.nBase === 1 && n.nAcid === 1; i++) { p = pair(os, 0.35); n = neutralEquation(p.b, p.a, p.k); }
  const { b, a, k } = p, q = b.cation.charge;
  const askBase = n.nBase > 1 && (n.nAcid === 1 || Math.random() < 0.5);
  const right = askBase ? n.nBase : n.nAcid, other = askBase ? n.nAcid : n.nBase;
  const shown = askBase ? `**?** ${F(b.formula)} + ${cf(n.nAcid)}${F(a.formula)}` : `${cf(n.nBase)}${F(b.formula)} + **?** ${F(a.formula)}`;
  return {
    ...mc(String(right), [
      right !== 1 ? d("1", "koeff-1zu1", `Mit 1 wären es ${askBase ? `${q} OH⁻ gegen ${n.water} H⁺` : `${n.water} OH⁻ gegen ${k} H⁺`} – nicht ausgeglichen.`) : null,
      other !== right ? d(String(other), "koeff-vertauscht", `${other} gehört vor ${F(askBase ? a.formula : b.formula)}. Zähle: ${n.water} H₂O brauchen ${n.water} ${askBase ? "OH⁻" : "H⁺"}, also ${n.water} : ${askBase ? q : k} = **${right}**.`) : null,
      n.water !== right ? d(String(n.water), "wasser-summe", `${n.water} ist die Zahl der H₂O. Davor steht, wie viele Formeleinheiten nötig sind: ${n.water} : ${askBase ? q : k} = **${right}**.`) : null,
      (askBase ? k : q) !== right && (askBase ? k : q) !== other && (askBase ? k : q) !== n.water
        ? d(String(askBase ? k : q), "ladung-statt-anzahl", `${askBase ? `${k} H⁺ gibt ein ${F(a.formula)} ab` : `${q} OH⁻ bringt ein ${F(b.formula)}`} – gefragt ist, wie viele ${F(askBase ? b.formula : a.formula)} man braucht: ${n.water} : ${askBase ? q : k} = **${right}**.`) : null,
      "1", "2", "3", "4", "6",
    ]),
    prompt: `${shown} → ${F(n.salt)} + ${cf(n.water)}H₂O${partialText(a, k)}. Welche Zahl gehört an die Stelle von **?**`,
    hint: "Zahl der H₂O = Zahl der OH⁻ = Zahl der H⁺. Teile durch die OH⁻ bzw. H⁺ je Formeleinheit.",
    explain: `${n.water} H₂O ← ${n.water} ${askBase ? `OH⁻ = ${right} · ${q}` : `H⁺ = ${right} · ${k}`} → **${equationText(n.eq, n.coeffs)}**.`,
    f: [b.formula, a.formula, n.salt],
  };
}

// ── Salze und Gleichungen ────────────────────────────────────────────────────

/** Welches Salz entsteht? */
function salz(os: boolean): Task {
  const { b, a, k } = pair(os, 0.35);
  const c = b.cation, q = c.charge, r = restOf(a, k), n = neutralEquation(b, a, k), rr = ratio(c, r);
  const poly = r.Z === undefined && rr.nA > 1;
  const full = restOf(a);
  const known = (x: Ion) => isKnownSalt(b, x);
  return {
    ...mc(F(n.salt), [
      rr.nC !== 1 || rr.nA !== 1 ? d(F(saltFormula(c, r, 1, 1)), "salz-1zu1", `${ionText(c)} und ${ionText(r)}: die Ladungen müssen sich ausgleichen → **${F(n.salt)}**.`) : null,
      rr.nC !== rr.nA ? d(F(saltFormula(c, r, rr.nA, rr.nC)), "indizes-vertauscht", `Genau verkehrt: Die Ladung von ${ionText(r)} sagt, wie viele ${ionText(c)} man braucht – und umgekehrt → **${F(n.salt)}**.`) : null,
      poly ? d(F(c.formula + (rr.nC > 1 ? rr.nC : "") + r.formula + rr.nA), "klammer-vergessen", `Braucht man ein mehratomiges Ion mehrmals, kommt es in **Klammern**: ${F(n.salt)}.`) : null,
      k === a.protons && a.protons > 1 && known(a.rests[0]) ? d(F(saltFormula(c, a.rests[0])), "h-im-salz", `Bei der vollständigen Neutralisation gibt die Säure **alle** H⁺ ab – im Salz bleibt kein H: ${F(n.salt)}.`) : null,
      k < a.protons && known(full) ? d(F(saltFormula(c, full)), "stufe-ignoriert", `Das wäre die vollständige Neutralisation. Gibt jede Säure nur ${k} H⁺ ab, bleibt ${ionText(r)} übrig → **${F(n.salt)}**.`) : null,
      q > 1 && saltFormula(c, r, 1, q) !== n.salt ? d(F(saltFormula(c, r, 1, q)), "index-aus-formel", `Die ${q} in ${F(b.formula)} zählt die OH⁻. Im Salz zählen die Ladungen: ${ionText(c)} und ${ionText(r)} → **${F(n.salt)}**.`) : null,
      k > 1 && saltFormula(c, r, k, 1) !== n.salt ? d(F(saltFormula(c, r, k, 1)), "index-aus-formel", `Die ${k} in ${F(a.formula)} zählt die H⁺. Im Salz zählen die Ladungen: ${ionText(c)} und ${ionText(r)} → **${F(n.salt)}**.`) : null,
      LOOKALIKE_ACID[a.id] && known(restOf(PROTIC_BY_ID[LOOKALIKE_ACID[a.id]])) ? d(F(saltFormula(c, restOf(PROTIC_BY_ID[LOOKALIKE_ACID[a.id]]))), "rest-verwechselt",
        `Das wäre der Säurerest von ${PROTIC_BY_ID[LOOKALIKE_ACID[a.id]].name}. Aus ${F(a.formula)} entsteht ${ionText(r)} → **${F(n.salt)}**.`) : null,
      d(F(b.formula), "edukt-statt-salz", `${F(b.formula)} ist das Hydroxid, mit dem es anfängt. Im Salz steckt statt OH⁻ der Säurerest: **${F(n.salt)}**.`),
      rr.nC === 1 && rr.nA === 1 ? d(F(c.formula + a.formula), "h-im-salz", `Das H⁺ der Säure wird mit OH⁻ zu Wasser – im Salz bleibt nur der Säurerest: **${F(n.salt)}**.`) : null,
      // erst filtern, dann 3 nehmen: mit Al³⁺ gibt es manche Salze nicht (sonst blieben zu wenige Optionen)
      ...shuffle(PROTIC_ACIDS.filter(x => x !== a)).map(x => restOf(x)).filter(known).slice(0, 3).map(x => F(saltFormula(c, x))),
    ]),
    prompt: `Welches Salz entsteht aus **${F(b.formula)}** und **${F(a.formula)}**${partialText(a, k)}?`,
    hint: "Das Kation der Lauge und der Säurerest bleiben übrig. Gleiche ihre Ladungen aus wie in der Ionenbindung.",
    explain: `${ionText(c)} und ${ionText(r)} (${restName(r)}) → ${rr.nC} : ${rr.nA} → **${F(n.salt)}** (${n.saltName}).`,
    f: [b.formula, a.formula],
  };
}

/** Wie heißt das Salz? */
function salzName(os: boolean): Task {
  const { b, a, k } = pair(os, 0.35);
  const c = b.cation, r = restOf(a, k), n = neutralEquation(b, a, k);
  const cat = c.part, right = n.saltName;
  const words = Math.random() < 0.4;
  return {
    ...mc(right, [
      ...family(restName(r)).map(([nm, f]) => d(cat + lower(nm), "endung-id-at-it", `-${lower(nm)} wäre ${f}. Im Salz steckt ${ionText(r)} – das ist **${restName(r)}** → ${right}.`)),
      LOOKALIKE[restName(r)] ? d(cat + lower(LOOKALIKE[restName(r)][0]), "rest-verwechselt", `-${lower(LOOKALIKE[restName(r)][0])} wäre ${LOOKALIKE[restName(r)][1]}. Im Salz steckt ${ionText(r)} – das ist **${restName(r)}** → ${right}.`) : null,
      NAME_FROM_ACID[a.id] && k === a.protons ? d(cat + lower(NAME_FROM_ACID[a.id]), "rest-aus-saeurename", `Der Säurerest hat einen eigenen Namen: ${ionText(r)} heißt **${restName(r)}** → ${right}.`) : null,
      d(cat + lower(a.name.replace("Schweflige Säure", "Schwefligsäure")), "saeurename-statt-rest", `Im Salznamen steht der **Säurerest**, nicht die Säure: ${restName(r)} statt ${a.name} → ${right}.`),
      ...(os ? a.rests.filter(x => x !== r && isKnownSalt(b, x)).map(x => d(cat + x.part, x.formula.startsWith("H") || r.formula.startsWith("H") ? "hydrogen-verzaehlt" : "stufe-ignoriert",
        `${cat + x.part} wäre ${F(saltFormula(c, x))} mit ${ionText(x)}. Hier: ${ionText(r)} → **${right}**.`)) : []),
      !os && a.protons > 1 && isKnownSalt(b, a.rests[0]) ? d(cat + a.rests[0].part, "h-im-salz", `Bei der vollständigen Neutralisation bleibt kein H im Salz: ${ionText(r)} ist **${restName(r)}** → ${right}.`) : null,
      ...shuffle(PROTIC_ACIDS.filter(x => x !== a)).slice(0, 3).map(x => cat + restOf(x).part),
    ]),
    prompt: words
      ? `${b.lauge ?? b.name} + ${a.aq ?? a.name}${partialText(a, k)} → **?** + Wasser. Wie heißt das Salz?`
      : `Wie heißt das Salz **${F(n.salt)}**?`,
    hint: "Zuerst das Metall, dann der Name des Säurerests (Chlorid, Sulfat, Hydrogencarbonat …).",
    explain: `${F(n.salt)} besteht aus ${ionText(c)} und ${ionText(r)} (${restName(r)}) → **${right}**.`,
    f: [b.formula, a.formula, n.salt],
  };
}

/** Welche Gleichung ist richtig ausgeglichen? */
function gleichung(os: boolean): Task {
  const { b, a, k } = pair(os, 0.3);
  const n = neutralEquation(b, a, k), c = b.cation, r = restOf(a, k);
  const right = equationText(n.eq, n.coeffs);
  const w = n.water;
  /** nur wirklich falsche Gleichungen als Distraktor */
  const wrong = (eq: Equation, co: number[], miss: string, why: string) => (isBalanced(eq, co) ? null : d(equationText(eq, co), miss, why));
  const s11 = saltFormula(c, r, 1, 1);
  return {
    ...mc(right, [
      w !== 1 ? wrong(n.eq, [n.nBase, n.nAcid, 1, 1], "ein-wasser", `Es entstehen so viele H₂O, wie H⁺ und OH⁻ sich treffen: **${w} H₂O**.`) : null,
      wrong({ left: n.eq.left, right: [n.salt] }, [n.nBase, n.nAcid, 1], "wasser-vergessen", "H⁺ und OH⁻ werden zu Wasser – **H₂O** gehört auf die rechte Seite."),
      n.nBase !== 1 || n.nAcid !== 1 ? wrong(n.eq, [1, 1, 1, w], "koeff-1zu1", `Links müssen ${n.nBase} ${F(b.formula)} und ${n.nAcid} ${F(a.formula)} stehen, sonst stimmen die Atome nicht.`) : null,
      n.nBase !== n.nAcid ? wrong(n.eq, [n.nAcid, n.nBase, 1, w], "koeff-vertauscht", `Über Kreuz: ${F(b.formula)} bringt ${c.charge} OH⁻, ${F(a.formula)} ${k} H⁺ → ${n.nBase} : ${n.nAcid}.`) : null,
      s11 !== n.salt ? wrong({ left: n.eq.left, right: [s11, "H2O"] }, [1, 1, 1, 1], "salz-1zu1", `${F(s11)} ist nicht neutral: ${ionText(c)} und ${ionText(r)} → ${F(n.salt)}.`) : null,
      wrong(n.eq, [n.nBase, n.nAcid, 1, 2 * w], "wasser-atome", `Aus einem H⁺ und einem OH⁻ wird **ein** H₂O – also ${w}, nicht ${2 * w}.`),
    ]),
    prompt: `Welche Gleichung für ${b.lauge ?? b.name} + ${a.aq ?? a.name}${partialText(a, k)} ist richtig ausgeglichen?`,
    hint: "Prüfe: gleich viele OH⁻ wie H⁺, Salz neutral, so viele H₂O wie H⁺.",
    explain: `**${right}** – ${w} OH⁻ + ${w} H⁺ → ${w} H₂O, das Salz ${F(n.salt)} ist neutral.`,
    f: [b.formula, a.formula, n.salt],
  };
}

// ── Level und Runden ─────────────────────────────────────────────────────────

const GENS = (os: boolean): Record<string, () => Task> => ({
  protolyse, protonen, restName: () => restNameQ(os), restLadung: () => restLadung(os), hydroxid: () => hydroxid(os),
  wasser: () => wasser(os), bauen: () => bauen(os), koeffizient: () => koeffizient(os), salz: () => salz(os), salzName: () => salzName(os), gleichung: () => gleichung(os),
});

export const TYPE_NAMES: Record<string, string> = {
  protolyse: "Säuren in Wasser", protonen: "Abgebbare H⁺", restName: "Namen der Säurereste", restLadung: "Ladung des Säurerests",
  hydroxid: "Laugen in Wasser", wasser: "Wasser zählen", bauen: "Neutralisation bauen", koeffizient: "Koeffizienten",
  salz: "Salzformeln", salzName: "Salznamen", gleichung: "Gleichungen",
};

interface Level extends QuizLevel { types: string[] }
export const LEVELS: Record<Stufe, Level[]> = {
  us: [
    { id: "us-1", name: "Säuren in Wasser", desc: "H⁺ und Säurerest: HCl, H₂SO₄, H₃PO₄ …", types: ["protolyse", "restName", "restLadung"] },
    { id: "us-2", name: "Neutralisieren", desc: "H⁺ + OH⁻ → H₂O, Lauge und Säure ausgleichen", types: ["hydroxid", "bauen", "wasser"] },
    { id: "us-3", name: "Salze & Gleichungen", desc: "Welches Salz entsteht? Wie heißt es?", types: ["salz", "salzName", "gleichung"] },
  ],
  os: [
    { id: "os-1", name: "Protonen abgeben", desc: "ein-, zwei-, dreiprotonig; Hydrogen-Ionen", types: ["protonen", "restName", "restLadung"] },
    { id: "os-2", name: "Neutralisieren", desc: "Auch teilweise: NaOH + H₃PO₄ → NaH₂PO₄", types: ["bauen", "wasser", "koeffizient"] },
    { id: "os-3", name: "Salze & Gleichungen", desc: "Sulfid, Sulfit, Sulfat – Hydrogensalze", types: ["salz", "salzName", "gleichung"] },
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

export const unitsOf = (t: Extract<Task, { kind: "build" }>) => ({ base: HYDROXIDE_BY_ID[t.base], acid: PROTIC_BY_ID[t.acid] });
