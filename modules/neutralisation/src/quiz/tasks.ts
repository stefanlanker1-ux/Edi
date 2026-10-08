// Quiz-Aufgaben zur Neutralisation (reine Daten, damit Runden gespeichert werden können).
// Jede falsche Antwort steht für eine Fehlvorstellung (misconceptions.ts): d(text, schlüssel, rückmeldung).

import {
  PROTIC_ACIDS, PROTIC_BY_ID, HYDROXIDE_BY_ID, hydroxidesFor, restOf, restName, isKnownSalt, neutralEquation, protolysis, proticWord,
  equationText, isBalanced, parseFormula, toSubscript, ionText, chargeFull, formula as saltFormula, ratio,
  type Equation, type Hydroxide, type Ion, type ProticAcid,
} from "@lern/chem";
import { buildRound, mc, d, pick, shuffle, weakTypes, type BaseTask, type LevelKey, type McTask, type QuizLevel, type Trap, type TypeStats } from "@lern/quiz";
import type { Stufe } from "../store.ts";
import { tr } from "@lern/i18n";

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
/** Säurename mitten im Satz: „schweflige Säure“ (Adjektiv klein, nur in der Tabelle groß); englisch klein */
const mid = (name: string) => tr(name.replace(/^Schweflige /, "schweflige "), lower(name));
/** Name mitten im Satz: deutsch unverändert, englisch klein („is called chloride“, „(potassium phosphate)“) */
const low = (name: string) => tr(name, lower(name));
/** „alle 2 H⁺“ / „both H⁺“, „all 3 H⁺“ – Zahl und H⁺ nie getrennt */
const allH = (k: number) => tr(`alle ${k}\u00a0H⁺`, k === 2 ? "both H⁺" : `all ${k}\u00a0H⁺`);
/** Salzname aus Metall und Säurerest: „Natriumsulfat“ / „Sodium sulfate“ */
const sname = (cat: string, rest: string) => tr(cat + rest, `${cat} ${lower(rest)}`);

/**
 * Lauge bzw. Säure in Wortgleichungen immer mit Name und Formel. Level I nur „Natronlauge“ (in der Erklärung eingeführt), sonst der Name des
 * Hydroxids; Level II auch Kalilauge, Kalkwasser, Barytwasser (Erklärkarte „Salze & Gleichungen“).
 */
const baseLabel = (b: Hydroxide, os: boolean) => `${(os || b.id === "naoh") && b.lauge ? b.lauge : b.name} ${F(b.formula)}`;
const acidLabel = (a: ProticAcid) => `${mid(a.aq ?? a.name)} ${F(a.formula)}`;

/** Säuren der Stufe: Perchlorsäure (Perchlorat) führt erst Level II ein */
const acidsFor = (os: boolean) => (os ? PROTIC_ACIDS : PROTIC_ACIDS.filter(a => a.id !== "hclo4"));

/** Zufällige Lauge + Säure (+ abgegebene H⁺), nur Salze, die es in Wasser gibt. Oberstufe: manchmal nur teilweise neutralisiert. */
function pair(os: boolean, partialChance = 0): { b: Hydroxide; a: ProticAcid; k: number } {
  for (;;) {
    const b = pick(hydroxidesFor(os)), a = pick(acidsFor(os));
    const k = os && a.protons > 1 && Math.random() < partialChance ? 1 + Math.floor(Math.random() * (a.protons - 1)) : a.protons;
    if (isKnownSalt(b, restOf(a, k))) return { b, a, k };
  }
}
const partialText = (a: ProticAcid, k: number) => (k < a.protons ? tr(` – jedes ${F(a.formula)} gibt nur **${k} H⁺** ab`, ` – each ${F(a.formula)} gives off only **${k} H⁺**`) : "");
/**
 * Wie viele H⁺ jede Säure abgibt – als eigener Satz vor der Frage, bei mehrprotonigen Säuren immer (auch „alle“):
 * Level II lehrt die teilweise Neutralisation, sonst wären Hydrogensalze als Antwort ebenso richtig.
 */
const stepSentence = (a: ProticAcid, k: number) => (a.protons === 1 ? "" : k < a.protons
  ? tr(`Jedes ${F(a.formula)} gibt nur **${k}\u00a0H⁺** ab. `, `Each ${F(a.formula)} gives off only **${k}\u00a0H⁺**. `)
  : tr(`Jedes ${F(a.formula)} gibt **${allH(k)}** ab. `, `Each ${F(a.formula)} gives off **${allH(k)}**. `));

// Namensfamilien für die Endungen -id / -it / -at (nur Ionen, die es gibt)
const FAMILY: [string, string][][] = tr([
  [["Sulfid", "S²⁻"], ["Sulfit", "SO₃²⁻"], ["Sulfat", "SO₄²⁻"]],
  [["Nitrid", "N³⁻"], ["Nitrit", "NO₂⁻"], ["Nitrat", "NO₃⁻"]],
  [["Chlorid", "Cl⁻"], ["Chlorat", "ClO₃⁻"], ["Perchlorat", "ClO₄⁻"]],
  [["Bromid", "Br⁻"], ["Bromat", "BrO₃⁻"]],
  [["Phosphid", "P³⁻"], ["Phosphat", "PO₄³⁻"]],
], [
  [["Sulfide", "S²⁻"], ["Sulfite", "SO₃²⁻"], ["Sulfate", "SO₄²⁻"]],
  [["Nitride", "N³⁻"], ["Nitrite", "NO₂⁻"], ["Nitrate", "NO₃⁻"]],
  [["Chloride", "Cl⁻"], ["Chlorate", "ClO₃⁻"], ["Perchlorate", "ClO₄⁻"]],
  [["Bromide", "Br⁻"], ["Bromate", "BrO₃⁻"]],
  [["Phosphide", "P³⁻"], ["Phosphate", "PO₄³⁻"]],
]);
/** Hydrogen-Ionen derselben Familie, die es gibt (mit Formel) */
const HYDROGEN_FAMILY: [string, string][] = tr([["Hydrogensulfid", "HS⁻"], ["Hydrogensulfit", "HSO₃⁻"], ["Hydrogensulfat", "HSO₄⁻"]],
  [["Hydrogen sulfide", "HS⁻"], ["Hydrogen sulfite", "HSO₃⁻"], ["Hydrogen sulfate", "HSO₄⁻"]]);
/** Säurereste ähnlicher Säuren, die leicht verwechselt werden */
const LOOKALIKE: Record<string, [string, string]> = tr<Record<string, [string, string]>>({ Formiat: ["Acetat", "CH₃COO⁻"], Acetat: ["Formiat", "HCOO⁻"] },
  { Formate: ["Acetate", "CH₃COO⁻"], Acetate: ["Formate", "HCOO⁻"] });
const LOOKALIKE_ACID: Record<string, string> = { hcooh: "ch3cooh", ch3cooh: "hcooh" };
/**
 * Säurerest-Namen der gleichen Familie, z. B. Sulfat → Sulfid, Sulfit; Hydrogensulfat → Hydrogensulfid, Hydrogensulfit.
 * Hydrogencarbonat und (Di)hydrogenphosphat haben keine Familie (Schwefel-Namen wären eine andere Säure, keine andere Endung).
 * Level I ohne Perchlorat (dort nicht eingeführt).
 */
function family(name: string, os = true): [string, string][] {
  const same = ([n]: [string, string]) => n.toLowerCase() === name.toLowerCase();
  const fam = [...FAMILY, HYDROGEN_FAMILY].find(f => f.some(same));
  return fam ? fam.filter(x => !same(x) && (os || !/perchlor/i.test(x[0]))) : [];
}
/** falsche Säurerest-Namen, die man aus dem Säurenamen bilden würde */
const NAME_FROM_ACID: Record<string, string> = tr({ hcooh: "Ameisenat", ch3cooh: "Essigat", hclo4: "Perchlorid", hno3: "Salpeterat", h2co3: "Kohlenat" },
  { hcooh: "Formicate", ch3cooh: "Aceticate", hclo4: "Perchloride", hno3: "Nitricate", h2co3: "Carbonicate" });

// ── Säuren ───────────────────────────────────────────────────────────────────

/** In welche Ionen zerfällt die Säure? */
function protolyse(): Task {
  const a = pick(acidsFor(false)), k = a.protons, r = restOf(a), hs = hAtoms(a);
  const o = parseFormula(r.formula).O ?? 0;
  const right = `${cf(k)}H⁺ + ${ionText(r)}`;
  return {
    ...mc(right, [
      k > 1 ? d(`${ion("H" + k, 1)} + ${ionText(r)}`, "index-als-ladung", tr(`Die ${k} in ${F(a.formula)} ist eine Anzahl: Es entstehen **${k} einzelne H⁺-Ionen**, kein ${ion("H" + k, 1)}.`, `The ${k} in ${F(a.formula)} is a number: **${k} separate H⁺ ions** form, not ${ion("H" + k, 1)}.`)) : null,
      k > 1 ? d(`${k} H⁺ + ${ion(r.formula, -1)}`, "rest-ladung-eins", tr(`${k} H⁺ tragen zusammen ${k}+. Die Säure war neutral – also hat der Rest **${k}−**: ${ionText(r)}.`, `${k} H⁺ carry ${k}+ together. The acid was neutral – so the anion has **${k}−**: ${ionText(r)}.`)) : null,
      d(`${cf(k)}H⁺ + ${ion(r.formula, k)}`, "rest-ladung-vorzeichen", tr(`Positive H⁺ gehen weg – zurück bleibt ein **negativer** Rest: ${ionText(r)}.`, `Positive H⁺ leave – a **negative** anion remains: ${ionText(r)}.`)),
      o > 0 && o !== k ? d(`${cf(k)}H⁺ + ${ion(r.formula, -o)}`, "rest-ladung-sauerstoff", tr(`Die Ladung zählt die abgegebenen H⁺ (${k}), nicht die O-Atome (${o}): ${ionText(r)}.`, `The charge counts the H⁺ given off (${k}), not the O atoms (${o}): ${ionText(r)}.`)) : null,
      hs > k ? d(`${hs} H⁺ + ${ion(withoutH(a.formula), -hs)}`, "alle-h-sauer", tr(`Nur das H der **COOH-Gruppe** wird abgegeben: ${protolysis(a)}.`, `Only the H of the **COOH group** is given off: ${protolysis(a)}.`)) : null,
      d(`${cf(k)}H + ${F(r.formula)}`, "ohne-ladung", tr(`In Wasser entstehen **Ionen**, keine neutralen Atome: Das H geht ohne sein Elektron weg (H⁺), der Rest behält es (${ionText(r)}).`, `In water **ions** form, not neutral atoms: the H leaves without its electron (H⁺), the anion keeps it (${ionText(r)}).`)),
      `${cf(k)}H⁺ + ${ion(r.formula, -(k + 1))}`, `${cf(k + 1)}H⁺ + ${ionText(r)}`,
    ]),
    prompt: tr(`Welche Ionen entstehen, wenn **${F(a.formula)}** (${mid(a.name)}) in Wasser H⁺ abgibt?`, `Which ions form when **${F(a.formula)}** (${mid(a.name)}) gives off H⁺ in water?`),
    hint: tr("Zähle die H, die als H⁺ weggehen: die H vorne in der Formel. Bei COOH-Säuren nur das H der COOH-Gruppe. Der Rest trägt genauso viele Minus, wie H⁺ weggegangen sind.",
      "Count the H that leave as H⁺: the H at the front of the formula. For COOH acids, only the H of the COOH group. The anion carries as many minus charges as H⁺ have left."),
    explain: tr(`${protolysis(a)} – ${k === 1 ? "ein Plus und ein Minus" : `${k} Plus und ${k} Minus`}, zusammen neutral. Säurerest: **${restName(r)}**.`, `${protolysis(a)} – ${k === 1 ? "one plus and one minus" : `${k} plus and ${k} minus`}, neutral together. Acid anion: **${low(restName(r))}**.`),
    f: [a.formula],
  };
}

/** Wie viele H⁺ kann die Säure abgeben? (Oberstufe) */
function protonen(): Task {
  // organische Säuren öfter: dort steckt die Falle „alle H zählen“
  const a = Math.random() < 0.35 ? PROTIC_BY_ID[pick(["hcooh", "ch3cooh"])] : pick(PROTIC_ACIDS);
  const k = a.protons, hs = hAtoms(a), atoms = Object.values(parseFormula(a.formula)).reduce((x, y) => x + y, 0);
  const o = parseFormula(a.formula).O ?? 0;
  // „abgegeben wird nur das H …“ bzw. „werden nur die 2 H …“
  const given = /COOH/.test(a.formula) ? tr("wird nur das H der COOH-Gruppe", "the H of the COOH group")
    : k === 1 ? tr("wird nur das H vorne in der Formel", "the front H") : tr(`werden nur die ${k} H vorne in der Formel`, `the ${k} front H`);
  return {
    ...mc(String(k), [
      hs > k ? d(String(hs), "alle-h-sauer", tr(`${F(a.formula)} hat ${hs} H-Atome, aber nur das H der **COOH-Gruppe** ist sauer – die H am C bleiben gebunden.`, `${F(a.formula)} has ${hs} H atoms, but only the H of the **COOH group** is acidic – the H on C stay bonded.`)) : null,
      k > 1 ? d("1", "ein-proton", tr(`${F(a.formula)} ist ${proticWord(k)}: alle ${k} H vorne in der Formel können als H⁺ abgegeben werden (schrittweise).`, `${F(a.formula)} is ${proticWord(k)}: all ${k} front H can be given off as H⁺, step by step.`)) : null,
      o > 0 && o !== k && o !== hs && o <= 4 ? d(String(o), "rest-ladung-sauerstoff", tr(`Die ${o} O-Atome geben nichts ab. Abgegeben ${given}: **${k}**.`, `The ${o} O atoms give off nothing. Only ${given} can be given off: **${k}**.`)) : null,
      atoms <= 4 && atoms !== k && atoms !== hs && atoms !== o ? d(String(atoms), "atome-statt-h", tr(`${F(a.formula)} hat ${atoms} Atome – abgegeben ${given}: **${k}**.`, `${F(a.formula)} has ${atoms} atoms – only ${given} can be given off: **${k}**.`)) : null,
      "1", "2", "3", "4",
    ]),
    prompt: tr(`Wie viele **H⁺** kann ein Molekül **${F(a.formula)}** (${mid(a.name)}) höchstens abgeben?`, `How many **H⁺** can a molecule of **${F(a.formula)}** (${mid(a.name)}) give off at most?`),
    hint: tr("Zähle die H vorne in der Formel – jedes kann als H⁺ weggehen. Bei COOH-Säuren nur das H der COOH-Gruppe.", "Count the H at the front of the formula – each can leave as H⁺. For COOH acids only the H of the COOH group."),
    explain: tr(`${a.name} ist **${proticWord(k)}**: ${protolysis(a)}.${hs - k === 1 ? " Das andere H bleibt am Kohlenstoff." : hs > k ? ` Die übrigen ${hs - k} H bleiben am Kohlenstoff.` : ""}`,
      `${a.name} is **${proticWord(k)}**: ${protolysis(a)}.${hs - k === 1 ? " The other H stays on the carbon." : hs > k ? ` The other ${hs - k} H stay on the carbon.` : ""}`),
    f: [a.formula],
  };
}

/** Wie heißt der Säurerest? */
function restNameQ(os: boolean): Task {
  const a = pick(acidsFor(os));
  const k = os && a.protons > 1 && Math.random() < 0.5 ? 1 + Math.floor(Math.random() * (a.protons - 1)) : a.protons;
  const r = restOf(a, k), right = restName(r);
  const byIon = Math.random() < 0.5;
  const others = acidsFor(os).flatMap(x => (os ? x.rests : [restOf(x)])).map(restName).filter(n => n !== right);
  return {
    ...mc(right, [
      ...family(right, os).map(([n, f]) => d(n, "endung-id-at-it", tr(`**${n}** wäre ${f}. Aus ${F(a.formula)} bleibt ${ionText(r)} übrig – das ist **${right}**.`, `**${n}** would be ${f}. From ${F(a.formula)}, ${ionText(r)} remains – that is **${low(right)}**.`))),
      LOOKALIKE[right] ? d(LOOKALIKE[right][0], "rest-verwechselt", tr(`**${LOOKALIKE[right][0]}** ist ${LOOKALIKE[right][1]} aus einer anderen Säure. Aus ${F(a.formula)} bleibt ${ionText(r)} übrig – das ist **${right}**.`, `**${LOOKALIKE[right][0]}** is ${LOOKALIKE[right][1]} from another acid. From ${F(a.formula)}, ${ionText(r)} remains – that is **${low(right)}**.`)) : null,
      d(a.name, "saeurename-statt-rest", tr(`${a.name} ist die Säure selbst. Was nach Abgabe der H⁺ übrig bleibt, heißt **${right}**.`, `${a.name} is the acid itself. What remains after the H⁺ are given off is called **${low(right)}**.`)),
      NAME_FROM_ACID[a.id] && k === a.protons ? d(NAME_FROM_ACID[a.id], "rest-aus-saeurename", tr(`Der Säurerest bekommt einen eigenen Namen: ${ionText(r)} heißt **${right}**.`, `The acid anion has its own name: ${ionText(r)} is called **${low(right)}**.`)) : null,
      ...(os ? a.rests.filter(x => x !== r).map(x => d(restName(x), "hydrogen-verzaehlt",
        tr(`${restName(x)} ist ${ionText(x)}. ${ionText(r)} ${r.formula.startsWith("H") ? `hat noch ${parseFormula(r.formula).H} H` : "hat kein H mehr"} → **${right}**.`, `${restName(x)} is ${ionText(x)}. ${ionText(r)} ${r.formula.startsWith("H") ? `still has ${parseFormula(r.formula).H} H` : "has no H left"} → **${low(right)}**.`))) : []),
      ...shuffle(others).slice(0, 3),
    ]),
    prompt: byIon
      ? tr(`Wie heißt das Ion **${ionText(r)}**?`, `What is the ion **${ionText(r)}** called?`)
      : tr(`Wie heißt der Säurerest, wenn **${F(a.formula)}** ${k === a.protons ? (k === 1 ? "sein H⁺" : allH(k)) : `nur ${k}\u00a0H⁺`} abgibt?`, `What is the acid anion called when **${F(a.formula)}** gives off ${k === a.protons ? (k === 1 ? "its H⁺" : allH(k)) : `only ${k}\u00a0H⁺`}?`),
    // nur die Regel – kein Beispielname, der die Antwort sein könnte
    hint: os ? tr("Endungen: -id (kein O), -it (ein O weniger als -at), -at. Wie viele H stecken noch im Ion? Das steht vorn im Namen.", "Endings: -ide (no O), -ite (one O fewer than -ate), -ate. How many H are still in the ion? That goes at the front of the name.")
      : tr("Endungen: -id ohne Sauerstoff, -at mit Sauerstoff, -it mit einem O weniger als -at. Schau, ob O im Ion steckt.", "Endings: -ide without oxygen, -ate with oxygen, -ite with one O fewer than -ate. Check whether the ion contains O."),
    explain: tr(`${protolysis(a, k)} → ${ionText(r)} heißt **${right}**.`, `${protolysis(a, k)} → ${ionText(r)} is called **${low(right)}**.`),
    f: [a.formula],
  };
}

/** Welche Ladung hat der Säurerest? */
function restLadung(os: boolean): Task {
  const a = pick(acidsFor(os));
  const k = os && a.protons > 1 && Math.random() < 0.5 ? 1 + Math.floor(Math.random() * (a.protons - 1)) : a.protons;
  const r = restOf(a, k), hs = hAtoms(a), o = parseFormula(r.formula).O ?? 0;
  return {
    ...mc(chargeFull(-k), [
      k > 1 ? d("1−", "rest-ladung-eins", tr(`Es gehen ${k} H⁺ weg, also ${k} Plus – zurück bleiben **${k} Minus**: ${ionText(r)}.`, `${k} H⁺ leave, so ${k} plus – **${k} minus** remain: ${ionText(r)}.`)) : null,
      d(chargeFull(k), "rest-ladung-vorzeichen", tr(`Die H⁺ nehmen die positiven Ladungen mit – der Rest ist **negativ**: ${ionText(r)}.`, `The H⁺ take the positive charges with them – the anion is **negative**: ${ionText(r)}.`)),
      o > 0 && o !== k && o <= 4 ? d(chargeFull(-o), "rest-ladung-sauerstoff", tr(`Die Ladung zählt die abgegebenen H⁺ (${k}), nicht die O-Atome (${o}).`, `The charge counts the H⁺ given off (${k}), not the O atoms (${o}).`)) : null,
      hs > a.protons && k === a.protons ? d(chargeFull(-hs), "alle-h-sauer", tr(`Nur das H der COOH-Gruppe geht weg – ${F(a.formula)} gibt **1 H⁺** ab, der Rest ist 1−.`, `Only the H of the COOH group leaves – ${F(a.formula)} gives off **1 H⁺**, the anion is 1−.`)) : null,
      k < a.protons ? d(chargeFull(-a.protons), "stufe-ignoriert", tr(`Es gehen nur **${k} H⁺** weg, nicht alle ${a.protons} – also nur ${k} Minus: ${ionText(r)}.`, `Only **${k} H⁺** leave, not all ${a.protons} – so only ${k} minus: ${ionText(r)}.`)) : null,
      "1−", "2−", "3−", "2+",
    ]),
    prompt: tr(`**${F(a.formula)}** gibt ${k === a.protons ? (k === 1 ? "sein H⁺" : allH(k)) : `nur ${k}\u00a0H⁺`} ab. Welche Ladung hat der Säurerest ${F(r.formula)}?`, `**${F(a.formula)}** gives off ${k === a.protons ? (k === 1 ? "its H⁺" : allH(k)) : `only ${k}\u00a0H⁺`}. What is the charge of the acid anion ${F(r.formula)}?`),
    hint: tr("So viele H⁺ (Plus) weggehen, so viele Minus bleiben am Rest.", "As many H⁺ (plus) as leave, that many minus remain on the anion."),
    explain: tr(`${protolysis(a, k)}: ${k} H⁺ weg → Rest **${chargeFull(-k)}** (${restName(r)}).`, `${protolysis(a, k)}: ${k} H⁺ gone → anion **${chargeFull(-k)}** (${low(restName(r))}).`),
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
      q > 1 ? d(`${ionText(c)} + ${ion("OH" + q, -q)}`, "oh-zusammengefasst", tr(`Die ${q} hinter der Klammer heißt: **${q} einzelne OH⁻-Ionen**. Ein OH${F(String(q))} gibt es nicht.`, `The ${q} after the bracket means: **${q} separate OH⁻ ions**. There is no OH${F(String(q))}.`)) : null,
      d(`${ionText(c)} + ${cf(q)}O²⁻ + ${cf(q)}H⁺`, "oh-zerlegt", tr("OH⁻ bleibt als Ganzes zusammen: Metallhydroxide bestehen aus Metall-Ionen und **Hydroxid-Ionen OH⁻**.", "OH⁻ stays together as a whole: metal hydroxides consist of metal ions and **hydroxide ions OH⁻**.")),
      q === 1 ? d(`${ion(c.formula + "O", -1)} + H⁺`, "lauge-gibt-h", tr("Hydroxide geben kein H⁺ ab, sondern **OH⁻** – daran erkennt man Laugen.", "Hydroxides do not give off H⁺ but **OH⁻** – that is how you recognise alkalis.")) : null,
      d(q > 1 ? `${ion(c.formula, 1)} + ${q} OH⁻` : `${ion(c.formula, 2)} + 2 OH⁻`, "kation-ladung",
        tr(`${c.name.replace(/-Ion$/, "")} bildet ${ionText(c)} – dazu gehören genau **${q} OH⁻**, dann ist ${F(b.formula)} neutral.`, `${c.part} forms ${ionText(c)} – exactly **${q} OH⁻** belong to it, then ${F(b.formula)} is neutral.`)),
    ]),
    prompt: tr(`Aus welchen Ionen besteht **${F(b.formula)}** (${b.name})?`, `Which ions does **${F(b.formula)}** (${lower(b.name)}) consist of?`),
    hint: tr("Das Metall wird zum Kation. Die Zahl hinter (OH) sagt, wie viele OH⁻-Ionen dazugehören.", "The metal becomes the cation. The number after (OH) tells you how many OH⁻ ions belong to it."),
    explain: tr(`${F(b.formula)} → **${right}**: ${cf(q)}OH⁻ gleichen die Ladung ${ionText(c)} aus.`, `${F(b.formula)} → **${right}**: ${cf(q)}OH⁻ balance the charge of ${ionText(c)}.`),
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
      w !== 1 ? d("1", "ein-wasser", tr(`Jedes H⁺ bildet mit einem OH⁻ **ein** H₂O. Hier sind es ${w} H⁺ und ${w} OH⁻ → **${w} H₂O**.`, `Each H⁺ forms **one** H₂O with one OH⁻. Here there are ${w} H⁺ and ${w} OH⁻ → **${w} H₂O**.`)) : null,
      n.nBase + n.nAcid !== w ? d(String(n.nBase + n.nAcid), "wasser-summe", tr(`Nicht ${n.nBase} + ${n.nAcid} zusammenzählen, sondern die OH⁻: ${n.nBase} · ${q} OH⁻ = **${w}**.`, `Do not add ${n.nBase} + ${n.nAcid}, count the OH⁻: ${n.nBase} · ${q} OH⁻ = **${w}**.`)) : null,
      d(String(2 * w), "wasser-atome", tr(`Aus **einem** H⁺ und **einem** OH⁻ wird **ein** H₂O – nicht zwei.`, `**One** H⁺ and **one** OH⁻ make **one** H₂O – not two.`)),
      n.nAcid > 1 && k !== w ? d(String(k), "eine-formeleinheit", tr(`${k} H⁺ bringt **ein** ${F(a.formula)} – es sind aber ${n.nAcid}: ${n.nAcid} · ${k} = **${w}**.`, `**One** ${F(a.formula)} brings ${k} H⁺ – but there are ${n.nAcid}: ${n.nAcid} · ${k} = **${w}**.`)) : null,
      n.nBase > 1 && q !== w && q !== k ? d(String(q), "eine-formeleinheit", tr(`${q} OH⁻ bringt **ein** ${F(b.formula)} – es sind aber ${n.nBase}: ${n.nBase} · ${q} = **${w}**.`, `**One** ${F(b.formula)} brings ${q} OH⁻ – but there are ${n.nBase}: ${n.nBase} · ${q} = **${w}**.`)) : null,
      String(w + 1), String(Math.max(1, w - 1)), String(w + 2),
    ]),
    prompt: `**${cf(n.nBase)}${F(b.formula)} + ${cf(n.nAcid)}${F(a.formula)}** → ${F(n.salt)} + **?** H₂O${partialText(a, k)}. ${tr("Wie viele Wassermoleküle entstehen?", "How many water molecules form?")}`,
    hint: tr("Zähle die OH⁻ der Lauge (oder die H⁺ der Säure): Jedes Paar H⁺ + OH⁻ ergibt ein H₂O.", "Count the OH⁻ of the alkali (or the H⁺ of the acid): each pair H⁺ + OH⁻ gives one H₂O."),
    explain: `${n.nBase} · ${q} OH⁻ = ${w} OH⁻ ${tr("und", "and")} ${n.nAcid} · ${k} H⁺ = ${w} H⁺ → **${w} H₂O**.`,
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
    n.nBase !== 1 || n.nAcid !== 1 ? { values: { nB: 1, nA: 1 }, miss: "koeff-1zu1", why: tr(`1 ${F(b.formula)} bringt ${q} OH⁻, 1 ${F(a.formula)} bringt ${k} H⁺ – nicht gleich viele. Die Reihen müssen gleich lang sein.`, `1 ${F(b.formula)} brings ${q} OH⁻, 1 ${F(a.formula)} brings ${k} H⁺ – not the same number. The rows must be the same length.`) } : null,
    n.nBase !== n.nAcid ? { values: { nB: n.nAcid, nA: n.nBase }, miss: "koeff-vertauscht", why: tr(`Genau verkehrt: jetzt sind es ${n.nAcid * q} OH⁻ und ${n.nBase * k} H⁺. Über Kreuz: ${F(b.formula)} bringt ${q} OH⁻, ${F(a.formula)} ${k} H⁺ → ${n.nBase} : ${n.nAcid}.`, `Exactly the wrong way round: now there are ${n.nAcid * q} OH⁻ and ${n.nBase * k} H⁺. Crosswise: ${F(b.formula)} brings ${q} OH⁻, ${F(a.formula)} ${k} H⁺ → ${n.nBase} : ${n.nAcid}.`) } : null,
    gcd(q, k) > 1 ? { values: { nB: k, nA: q }, miss: "nicht-gekuerzt", why: tr(`Neutral, aber nicht die kleinsten Zahlen: ${k} : ${q} lässt sich kürzen auf ${n.nBase} : ${n.nAcid}.`, `Neutral, but not the smallest numbers: ${k} : ${q} simplifies to ${n.nBase} : ${n.nAcid}.`) } : null,
  ] as (Trap | null)[]).filter((t): t is Trap => t !== null);
  return {
    kind: "build", base: b.id, acid: a.id, step: k, traps,
    prompt: tr(`${stepSentence(a, k)}Neutralisiere **${F(b.formula)}** mit **${F(a.formula)}**. Wie viele von jedem?`, `${stepSentence(a, k)}Neutralise **${F(b.formula)}** with **${F(a.formula)}**. How many of each?`),
    hint: tr("Nimm so viele von jedem, bis die OH⁻-Reihe und die H⁺-Reihe gleich lang sind – mit möglichst wenigen.", "Use as few as possible until the OH⁻ and H⁺ rows are equally long."),
    explain: `${n.nBase} · ${q} OH⁻ = ${n.water} OH⁻ ${tr("und", "and")} ${n.nAcid} · ${k} H⁺ = ${n.water} H⁺ → ${n.water} H₂O ${tr("und", "and")} **${F(n.salt)}**.`,
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
      right !== 1 ? d("1", "koeff-1zu1", tr(`Mit 1 wären es ${askBase ? `${q} OH⁻ gegen ${n.water} H⁺` : `${n.water} OH⁻ gegen ${k} H⁺`} – nicht ausgeglichen.`, `With 1 it would be ${askBase ? `${q} OH⁻ against ${n.water} H⁺` : `${n.water} OH⁻ against ${k} H⁺`} – not balanced.`)) : null,
      other !== right ? d(String(other), "koeff-vertauscht", tr(`${other} gehört vor ${F(askBase ? a.formula : b.formula)}. Zähle: ${n.water} H₂O brauchen ${n.water} ${askBase ? "OH⁻" : "H⁺"}, also ${n.water} : ${askBase ? q : k} = **${right}**.`, `${other} belongs in front of ${F(askBase ? a.formula : b.formula)}. Count: ${n.water} H₂O need ${n.water} ${askBase ? "OH⁻" : "H⁺"}, so ${n.water} ÷ ${askBase ? q : k} = **${right}**.`)) : null,
      n.water !== right ? d(String(n.water), "wasser-als-koeffizient", tr(`${n.water} ist die Zahl der H₂O. Davor steht, wie viele Formeleinheiten nötig sind: ${n.water} : ${askBase ? q : k} = **${right}**.`, `${n.water} is the number of H₂O. In front goes how many formula units are needed: ${n.water} ÷ ${askBase ? q : k} = **${right}**.`)) : null,
      (askBase ? k : q) !== right && (askBase ? k : q) !== other && (askBase ? k : q) !== n.water
        ? d(String(askBase ? k : q), "ladung-statt-anzahl", tr(`${askBase ? `${k} H⁺ gibt ein ${F(a.formula)} ab` : `${q} OH⁻ bringt ein ${F(b.formula)}`} – gefragt ist, wie viele ${F(askBase ? b.formula : a.formula)} man braucht: ${n.water} : ${askBase ? q : k} = **${right}**.`, `${askBase ? `One ${F(a.formula)} gives off ${k} H⁺` : `One ${F(b.formula)} brings ${q} OH⁻`} – the question is how many ${F(askBase ? b.formula : a.formula)} you need: ${n.water} ÷ ${askBase ? q : k} = **${right}**.`)) : null,
      "1", "2", "3", "4", "6",
    ]),
    prompt: `${shown} → ${F(n.salt)} + ${cf(n.water)}H₂O${partialText(a, k)}. ${tr("Welche Zahl gehört an die Stelle von **?**", "Which number goes in place of **?**")}`,
    hint: tr("Zahl der H₂O = Zahl der OH⁻ = Zahl der H⁺. Teile durch die OH⁻ bzw. H⁺ je Formeleinheit.", "Number of H₂O = number of OH⁻ = number of H⁺. Divide by the OH⁻ or H⁺ per formula unit."),
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
      rr.nC !== 1 || rr.nA !== 1 ? d(F(saltFormula(c, r, 1, 1)), "salz-1zu1", tr(`${ionText(c)} und ${ionText(r)}: die Ladungen müssen sich ausgleichen → **${F(n.salt)}**.`, `${ionText(c)} and ${ionText(r)}: the charges must balance → **${F(n.salt)}**.`)) : null,
      rr.nC !== rr.nA ? d(F(saltFormula(c, r, rr.nA, rr.nC)), "indizes-vertauscht", tr(`Genau verkehrt: Die Ladung von ${ionText(r)} sagt, wie viele ${ionText(c)} man braucht – und umgekehrt → **${F(n.salt)}**.`, `Exactly the wrong way round: the charge of ${ionText(r)} tells you how many ${ionText(c)} you need – and vice versa → **${F(n.salt)}**.`)) : null,
      poly ? d(F(c.formula + (rr.nC > 1 ? rr.nC : "") + r.formula + rr.nA), "klammer-vergessen", tr(`Braucht man ein mehratomiges Ion mehrmals, kommt es in **Klammern**: ${F(n.salt)}.`, `If a polyatomic ion is needed more than once, it goes in **brackets**: ${F(n.salt)}.`)) : null,
      k === a.protons && a.protons > 1 && known(a.rests[0]) ? d(F(saltFormula(c, a.rests[0])), "h-im-salz", tr(`Bei der vollständigen Neutralisation gibt die Säure **alle** H⁺ ab – im Salz bleibt kein H: ${F(n.salt)}.`, `In complete neutralisation the acid gives off **all** H⁺ – no H stays in the salt: ${F(n.salt)}.`)) : null,
      k < a.protons && known(full) ? d(F(saltFormula(c, full)), "stufe-ignoriert", tr(`Das wäre die vollständige Neutralisation. Gibt jede Säure nur ${k} H⁺ ab, bleibt ${ionText(r)} übrig → **${F(n.salt)}**.`, `That would be complete neutralisation. If each acid gives off only ${k} H⁺, ${ionText(r)} remains → **${F(n.salt)}**.`)) : null,
      q > 1 && saltFormula(c, r, 1, q) !== n.salt ? d(F(saltFormula(c, r, 1, q)), "index-aus-formel", tr(`Die ${q} in ${F(b.formula)} zählt die OH⁻. Im Salz zählen die Ladungen: ${ionText(c)} und ${ionText(r)} → **${F(n.salt)}**.`, `The ${q} in ${F(b.formula)} counts the OH⁻. In the salt the charges count: ${ionText(c)} and ${ionText(r)} → **${F(n.salt)}**.`)) : null,
      k > 1 && saltFormula(c, r, k, 1) !== n.salt ? d(F(saltFormula(c, r, k, 1)), "index-aus-formel", tr(`Die ${k} in ${F(a.formula)} zählt die H⁺. Im Salz zählen die Ladungen: ${ionText(c)} und ${ionText(r)} → **${F(n.salt)}**.`, `The ${k} in ${F(a.formula)} counts the H⁺. In the salt the charges count: ${ionText(c)} and ${ionText(r)} → **${F(n.salt)}**.`)) : null,
      LOOKALIKE_ACID[a.id] && known(restOf(PROTIC_BY_ID[LOOKALIKE_ACID[a.id]])) ? d(F(saltFormula(c, restOf(PROTIC_BY_ID[LOOKALIKE_ACID[a.id]]))), "rest-verwechselt",
        tr(`Das wäre der Säurerest von ${acidLabel(PROTIC_BY_ID[LOOKALIKE_ACID[a.id]])}. Aus ${F(a.formula)} entsteht ${ionText(r)} → **${F(n.salt)}**.`, `That would be the acid anion of ${acidLabel(PROTIC_BY_ID[LOOKALIKE_ACID[a.id]])}. ${F(a.formula)} gives ${ionText(r)} → **${F(n.salt)}**.`)) : null,
      d(F(b.formula), "edukt-statt-salz", tr(`${F(b.formula)} ist das Hydroxid, mit dem es anfängt. Im Salz steckt statt OH⁻ der Säurerest: **${F(n.salt)}**.`, `${F(b.formula)} is the hydroxide you start with. In the salt the acid anion replaces OH⁻: **${F(n.salt)}**.`)),
      rr.nC === 1 && rr.nA === 1 ? d(F(c.formula + a.formula), "h-im-salz", tr(`Das H⁺ der Säure wird mit OH⁻ zu Wasser – im Salz bleibt nur der Säurerest: **${F(n.salt)}**.`, `The H⁺ of the acid becomes water with OH⁻ – only the acid anion stays in the salt: **${F(n.salt)}**.`)) : null,
      // erst filtern, dann 3 nehmen: mit Al³⁺ gibt es manche Salze nicht (sonst blieben zu wenige Optionen)
      ...shuffle(acidsFor(os).filter(x => x !== a)).map(x => restOf(x)).filter(known).slice(0, 3).map(x => F(saltFormula(c, x))),
    ]),
    prompt: tr(`${stepSentence(a, k)}Welches Salz entsteht aus **${F(b.formula)}** und **${F(a.formula)}**?`, `${stepSentence(a, k)}Which salt forms from **${F(b.formula)}** and **${F(a.formula)}**?`),
    hint: tr("Das Kation der Lauge und der Säurerest bleiben übrig. Gleiche ihre Ladungen aus wie in der Ionenbindung.", "The cation of the alkali and the acid anion remain. Balance their charges as in ionic bonding."),
    explain: `${ionText(c)} ${tr("und", "and")} ${ionText(r)} (${low(restName(r))}) → ${rr.nC} : ${rr.nA} → **${F(n.salt)}** (${low(n.saltName)}).`,
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
      ...family(restName(r), os).map(([nm, f]) => d(sname(cat, lower(nm)), "endung-id-at-it", tr(`-${lower(nm)} wäre ${f}. Im Salz steckt ${ionText(r)} – das ist **${restName(r)}** → ${right}.`, `${nm} would be ${f}. The salt contains ${ionText(r)} – that is **${low(restName(r))}** → ${low(right)}.`))),
      LOOKALIKE[restName(r)] ? d(sname(cat, lower(LOOKALIKE[restName(r)][0])), "rest-verwechselt", tr(`-${lower(LOOKALIKE[restName(r)][0])} wäre ${LOOKALIKE[restName(r)][1]}. Im Salz steckt ${ionText(r)} – das ist **${restName(r)}** → ${right}.`, `${LOOKALIKE[restName(r)][0]} would be ${LOOKALIKE[restName(r)][1]}. The salt contains ${ionText(r)} – that is **${low(restName(r))}** → ${low(right)}.`)) : null,
      NAME_FROM_ACID[a.id] && k === a.protons ? d(sname(cat, lower(NAME_FROM_ACID[a.id])), "rest-aus-saeurename", tr(`Der Säurerest hat einen eigenen Namen: ${ionText(r)} heißt **${restName(r)}** → ${right}.`, `The acid anion has its own name: ${ionText(r)} is called **${low(restName(r))}** → ${low(right)}.`)) : null,
      d(sname(cat, lower(a.name.replace("Schweflige Säure", "Schwefligsäure"))), "saeurename-statt-rest", tr(`Im Salznamen steht der **Säurerest**, nicht die Säure: ${restName(r)} statt ${mid(a.name)} → ${right}.`, `The salt name contains the **acid anion**, not the acid: ${low(restName(r))} instead of ${mid(a.name)} → ${low(right)}.`)),
      ...(os ? a.rests.filter(x => x !== r && isKnownSalt(b, x)).map(x => d(sname(cat, x.part), x.formula.startsWith("H") || r.formula.startsWith("H") ? "hydrogen-verzaehlt" : "stufe-ignoriert",
        tr(`${cat + x.part} wäre ${F(saltFormula(c, x))} mit ${ionText(x)}. Hier: ${ionText(r)} → **${right}**.`, `${sname(cat, x.part)} would be ${F(saltFormula(c, x))} with ${ionText(x)}. Here: ${ionText(r)} → **${low(right)}**.`))) : []),
      // Level I ohne Hydrogen-Namen als Falle (erst in Level II eingeführt)
      ...shuffle(acidsFor(os).filter(x => x !== a)).slice(0, 3).map(x => sname(cat, restOf(x).part)),
    ]),
    prompt: words
      ? tr(`${baseLabel(b, os)} + ${acidLabel(a)} → **?** + Wasser H₂O. ${stepSentence(a, k)}Wie heißt das Salz?`, `${baseLabel(b, os)} + ${acidLabel(a)} → **?** + water H₂O. ${stepSentence(a, k)}What is the salt called?`)
      : tr(`Wie heißt das Salz **${F(n.salt)}**?`, `What is the salt **${F(n.salt)}** called?`),
    // nur die Regel – kein Beispielname, der die Antwort sein könnte
    hint: os ? tr("Zuerst das Metall, dann der Name des Säurerests. Achte auf die Endung und darauf, wie viele H noch im Säurerest stecken.", "First the metal, then the name of the acid anion. Watch the ending and how many H are still in the anion.")
      : tr("Zuerst das Metall, dann der Name des Säurerests. Achte auf die Endung: -id, -it oder -at.", "First the metal, then the name of the acid anion. Watch the ending: -ide, -ite or -ate."),
    explain: tr(`${F(n.salt)} besteht aus ${ionText(c)} und ${ionText(r)} (${restName(r)}) → **${right}**.`, `${F(n.salt)} consists of ${ionText(c)} and ${ionText(r)} (${low(restName(r))}) → **${low(right)}**.`),
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
      w !== 1 ? wrong(n.eq, [n.nBase, n.nAcid, 1, 1], "ein-wasser", tr(`Es entstehen so viele H₂O, wie H⁺ und OH⁻ sich treffen: **${w} H₂O**.`, `As many H₂O form as H⁺ and OH⁻ meet: **${w} H₂O**.`)) : null,
      wrong({ left: n.eq.left, right: [n.salt] }, [n.nBase, n.nAcid, 1], "wasser-vergessen", tr("H⁺ und OH⁻ werden zu Wasser – **H₂O** gehört auf die rechte Seite.", "H⁺ and OH⁻ become water – **H₂O** belongs on the right-hand side.")),
      n.nBase !== 1 || n.nAcid !== 1 ? wrong(n.eq, [1, 1, 1, w], "koeff-1zu1", tr(`Links müssen ${n.nBase} ${F(b.formula)} und ${n.nAcid} ${F(a.formula)} stehen, sonst stimmen die Atome nicht.`, `The left side needs ${n.nBase} ${F(b.formula)} and ${n.nAcid} ${F(a.formula)}. Otherwise the atoms do not match.`)) : null,
      n.nBase !== n.nAcid ? wrong(n.eq, [n.nAcid, n.nBase, 1, w], "koeff-vertauscht", tr(`Über Kreuz: ${F(b.formula)} bringt ${c.charge} OH⁻, ${F(a.formula)} ${k} H⁺ → ${n.nBase} : ${n.nAcid}.`, `Crosswise: ${F(b.formula)} brings ${c.charge} OH⁻, ${F(a.formula)} ${k} H⁺ → ${n.nBase} : ${n.nAcid}.`)) : null,
      s11 !== n.salt ? wrong({ left: n.eq.left, right: [s11, "H2O"] }, [1, 1, 1, 1], "salz-1zu1", tr(`${F(s11)} ist nicht neutral: ${ionText(c)} und ${ionText(r)} → ${F(n.salt)}.`, `${F(s11)} is not neutral: ${ionText(c)} and ${ionText(r)} → ${F(n.salt)}.`)) : null,
      wrong(n.eq, [n.nBase, n.nAcid, 1, 2 * w], "wasser-atome", tr(`Aus einem H⁺ und einem OH⁻ wird **ein** H₂O – also ${w}, nicht ${2 * w}.`, `One H⁺ and one OH⁻ make **one** H₂O – so ${w}, not ${2 * w}.`)),
    ]),
    prompt: tr(`${stepSentence(a, k)}Welche Gleichung für ${baseLabel(b, os)} + ${acidLabel(a)} ist richtig ausgeglichen?`, `${stepSentence(a, k)}Which equation for ${lower(baseLabel(b, os))} + ${acidLabel(a)} is correctly balanced?`),
    hint: tr("Prüfe: gleich viele OH⁻ wie H⁺, Salz neutral, so viele H₂O wie H⁺.", "Check: as many OH⁻ as H⁺, salt neutral, as many H₂O as H⁺."),
    explain: tr(`**${right}** – ${w} OH⁻ + ${w} H⁺ → ${w} H₂O, das Salz ${F(n.salt)} ist neutral.`, `**${right}** – ${w} OH⁻ + ${w} H⁺ → ${w} H₂O, the salt ${F(n.salt)} is neutral.`),
    f: [b.formula, a.formula, n.salt],
  };
}

// ── Level und Runden ─────────────────────────────────────────────────────────

const GENS = (os: boolean): Record<string, () => Task> => ({
  protolyse, protonen, restName: () => restNameQ(os), restLadung: () => restLadung(os), hydroxid: () => hydroxid(os),
  wasser: () => wasser(os), bauen: () => bauen(os), koeffizient: () => koeffizient(os), salz: () => salz(os), salzName: () => salzName(os), gleichung: () => gleichung(os),
});

export const TYPE_NAMES: Record<string, string> = tr({
  protolyse: "Säuren in Wasser", protonen: "Abgebbare H⁺", restName: "Namen der Säurereste", restLadung: "Ladung des Säurerests",
  hydroxid: "Laugen in Wasser", wasser: "Wasser zählen", bauen: "Neutralisation bauen", koeffizient: "Koeffizienten",
  salz: "Salzformeln", salzName: "Salznamen", gleichung: "Gleichungen",
}, {
  protolyse: "Acids in water", protonen: "H⁺ that can be given off", restName: "Names of acid anions", restLadung: "Charge of the acid anion",
  hydroxid: "Alkalis in water", wasser: "Counting water", bauen: "Building neutralisation", koeffizient: "Coefficients",
  salz: "Salt formulas", salzName: "Salt names", gleichung: "Equations",
});

interface Level extends QuizLevel { types: string[] }
export const LEVELS: Record<Stufe, Level[]> = {
  us: [
    { id: "us-1", name: tr("Säuren in Wasser", "Acids in water"), desc: tr("H⁺ und Säurerest: HCl, H₂SO₄, H₃PO₄ …", "H⁺ and acid anion: HCl, H₂SO₄, H₃PO₄ …"), types: ["protolyse", "restName", "restLadung"] },
    { id: "us-2", name: tr("Neutralisieren", "Neutralising"), desc: tr("H⁺ + OH⁻ → H₂O, Lauge und Säure ausgleichen", "H⁺ + OH⁻ → H₂O, balancing alkali and acid"), types: ["hydroxid", "bauen", "wasser"] },
    { id: "us-3", name: tr("Salze & Gleichungen", "Salts & equations"), desc: tr("Welches Salz entsteht? Wie heißt es?", "Which salt forms? What is it called?"), types: ["salz", "salzName", "gleichung"] },
  ],
  os: [
    { id: "os-1", name: tr("Protonen abgeben", "Giving off protons"), desc: tr("ein-, zwei-, dreiprotonig; Hydrogen-Ionen", "mono-, di-, triprotic; hydrogen ions"), types: ["protonen", "restName", "restLadung"] },
    { id: "os-2", name: tr("Neutralisieren", "Neutralising"), desc: tr("Auch teilweise: NaOH + H₃PO₄ → NaH₂PO₄", "Also partial: NaOH + H₃PO₄ → NaH₂PO₄"), types: ["bauen", "wasser", "koeffizient"] },
    { id: "os-3", name: tr("Salze & Gleichungen", "Salts & equations"), desc: tr("Sulfid, Sulfit, Sulfat – Hydrogensalze", "Sulfide, sulfite, sulfate – hydrogen salts"), types: ["salz", "salzName", "gleichung"] },
  ],
};

export const levelId = (stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[stufe as Stufe][level].id : `${stufe}-${level}`);
export const levelName = (stufe: string, level: LevelKey) =>
  level === "mix" ? tr("Alles gemischt", "Everything mixed") : level === "weak" ? tr("Schwächen üben", "Practise weak spots") : level === "due" ? tr("Heute fällig", "Due today") : LEVELS[stufe as Stufe][level].name;

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
