// Quiz-Aufgaben zur Ionenbindung (reine Daten, damit Runden gespeichert werden können).

import {
  CATIONS, ANIONS, ION_BY_ID, ionsFor, ratio, formula, toSubscript, compoundName, ionText, chargeFull, isKnownCompound, BY_Z, type Ion, groupLabel,
} from "@lern/chem";
import { buildRound, mc, d, pick, shuffle, type BaseTask, type LevelKey, type McTask, type QuizLevel, type Trap, type TypeStats } from "@lern/quiz";
import { weakTypes } from "@lern/quiz";
import type { Stufe } from "../store.ts";

export type Task = McTask | (BaseTask & { kind: "build"; cation: string; anion: string });

const F = (c: Ion, a: Ion, nC?: number, nA?: number) => toSubscript(formula(c, a, nC, nA));
const mono = (list: Ion[]) => list.filter(i => i.Z !== undefined);
const pool = (os: boolean) => ({ cat: ionsFor(CATIONS, os), an: ionsFor(ANIONS, os) });
/** Zufälliges Ionenpaar – nur Verbindungen, die es wirklich gibt */
const pair = (os: boolean) => {
  const p = pool(os);
  for (;;) { const c = pick(p.cat), a = pick(p.an); if (isKnownCompound(c, a)) return { c, a }; }
};
const plural = (ion: Ion) => ion.name.replace(/-Ion$/, "-Ionen");
const abs = Math.abs;
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
/** Ladungsausgleich als Rechnung: „2 · (3+) = 6+ und 3 · (2−) = 6−“ */
const balance = (c: Ion, a: Ion, nC: number, nA: number) =>
  `${nC} · (${chargeFull(c.charge)}) = ${nC * c.charge}+ und ${nA} · (${chargeFull(a.charge)}) = ${nA * -a.charge}−`;

// ── Aufgabentypen ───────────────────────────────────────────────────────────

/** Welches Ion bildet ein Element? (Hauptgruppen) */
function charge(os: boolean): Task {
  const ion = pick(mono([...ionsFor(CATIONS, false), ...ionsFor(ANIONS, false)]));
  const el = BY_Z[ion.Z!], q = ion.charge, n = abs(q);
  const opt = (c: number) => el.symbol + ionText({ ...ion, charge: c }).slice(el.symbol.length);
  const wrongs = q > 0
    ? [
      d(opt(-q), "ion-gegenteil", `${el.name} ist ein Metall. Metalle geben Elektronen ab – das Ion wird **positiv**.`),
      d(opt(q - 8), "auffuellen-statt-abgeben", `Metalle bilden positive Ionen: ${el.name} gibt ${n === 1 ? "sein 1 Außenelektron" : `seine ${n} Außenelektronen`} ab → ${ionText(ion)}.`),
      d(opt(q + 1), "ladung-verzaehlt", `${el.name} steht in der ${groupLabel(el.Z, os)}: es hat ${n === 1 ? "1 Außenelektron" : `${n} Außenelektronen`} und gibt genau ${n === 1 ? "dieses" : "diese"} ab.`),
    ]
    : [
      d(opt(-q), "ion-gegenteil", `${el.name} ist ein Nichtmetall. Nichtmetalle nehmen Elektronen auf – das Ion wird **negativ**.`),
      d(opt(8 + q), "abgeben-statt-aufnehmen", `${el.name} hat ${8 - n} Außenelektronen. Es gibt sie nicht ab, sondern füllt bis zur 8 auf: ${n === 1 ? "1 Elektron" : `${n} Elektronen`} dazu.`),
      d(opt(q - 1), "ladung-verzaehlt", `${el.name} hat ${8 - n} Außenelektronen. Bis zur 8 ${n === 1 ? "fehlt genau 1" : `fehlen genau ${n}`}.`),
    ];
  return {
    ...mc(opt(q), wrongs),
    prompt: `Welches Ion bildet **${el.name}**?`,
    hint: os ? "Gruppe 1, 2, 13: 1, 2, 3 Elektronen abgeben. Gruppe 15–17: bis 8 auffüllen."
      : "Hauptgruppe I–III: so viele Elektronen abgeben. Hauptgruppe V–VII: bis zur 8 auffüllen.",
    explain: `${el.name} ${q > 0 ? `gibt ${q} Elektron${q > 1 ? "en" : ""} ab` : `nimmt ${-q} Elektron${q < -1 ? "en" : ""} auf`}. Das Ion hat dann eine volle Außenschale wie ein Edelgas → **${ionText(ion)}**.${os ? "" : ""}`,
  };
}

/** Wie viele Elektronen werden abgegeben/aufgenommen? */
function electrons(): Task {
  const ion = pick(mono([...ionsFor(CATIONS, false), ...ionsFor(ANIONS, false)]));
  const el = BY_Z[ion.Z!], n = Math.abs(ion.charge);
  const other = ion.charge > 0
    ? d(String(8 - n), "auffuellen-statt-abgeben", `Metalle nehmen keine Elektronen auf. ${el.name} gibt ${n === 1 ? "sein 1 Außenelektron" : `seine ${n} Außenelektronen`} ab → ${ionText(ion)}.`)
    : d(String(8 - n), "abgeben-statt-aufnehmen", `${8 - n} ist die Zahl der Außenelektronen. ${el.name} gibt sie nicht ab, sondern nimmt ${n === 1 ? "1 Elektron" : `${n} Elektronen`} auf – dann sind es 8.`);
  return {
    ...mc(String(n), [other, ...["1", "2", "3", "4", "5", "6", "7"].filter(x => x !== String(n) && x !== String(8 - n))]),
    prompt: `Ein **${el.name}**-Atom wird zum Ion. Wie viele Elektronen ${ion.charge > 0 ? "gibt es ab" : "nimmt es auf"}?`,
    hint: "Schau auf die Hauptgruppe: Sie sagt, wie viele Außenelektronen das Atom hat.",
    explain: `${el.name} hat ${ion.charge > 0 ? n : 8 - n} Außenelektron${(ion.charge > 0 ? n : 8 - n) === 1 ? "" : "en"}. ${ion.charge > 0
      ? (n === 1 ? "Es gibt dieses **1** Elektron ab" : `Es gibt diese **${n}** ab`)
      : `Es nimmt **${n}** auf, dann sind es 8`} → ${ionText(ion)}, volle Außenschale wie ein Edelgas.`,
  };
}

/** Wie viele Anionen braucht man pro Kation (oder umgekehrt)? */
function count(os: boolean): Task {
  let c: Ion, a: Ion, r: { nC: number; nA: number };
  do { ({ c, a } = pair(os)); r = ratio(c, a); } while (r.nC === 1 && r.nA === 1 && Math.random() < 0.7);
  const askAnion = r.nC === 1 || (r.nA !== 1 && Math.random() < 0.5);
  const right = askAnion ? `${r.nA} ${r.nA === 1 ? a.name : plural(a)}` : `${r.nC} ${r.nC === 1 ? c.name : plural(c)}`;
  const other = (n: number, ion: Ion) => `${n} ${n === 1 ? ion.name : plural(ion)}`;
  const target = askAnion ? a : c, partner = askAnion ? c : a, base = askAnion ? r.nA : r.nC;
  const wrongs = [
    base !== 1 ? d(other(1, target), "ionen-1zu1", `Ein ${c.name} (${chargeFull(c.charge)}) und ein ${a.name} (${chargeFull(a.charge)}) sind zusammen nicht neutral. Ionenverbindungen sind keine Paare, sondern ein Gitter im passenden Verhältnis.`)
      : d(other(2, target), "ladungen-ungleich", `${ionText(c)} und ${ionText(a)} sind gleich stark geladen – eines gleicht genau eines aus. Mit zwei wären die Reihen ungleich lang, die Verbindung geladen.`),
    abs(target.charge) !== base ? d(other(abs(target.charge), target), "anzahl-eigene-ladung", `Die Ladung des ${target.name}s (${chargeFull(target.charge)}) sagt nicht, wie viele man braucht. Entscheidend ist, wie viel Ladung vom ${partner.name} (${chargeFull(partner.charge)}) auszugleichen ist.`) : null,
    abs(partner.charge) !== base ? d(other(abs(partner.charge), target), "nicht-gekuerzt", `${abs(partner.charge)} : ${abs(target.charge)} lässt sich kürzen: ${balance(c, a, r.nC, r.nA)}.`) : null,
    ...[1, 2, 3, 4, 6].filter(n => n !== base).map(n => other(n, target)),
  ];
  return {
    ...mc(right, wrongs),
    prompt: askAnion
      ? `Aus **${ionText(c)}** und **${ionText(a)}** soll eine neutrale Verbindung werden. Wie viele ${plural(a)} braucht man, wenn man ${r.nC === 1 ? "ein" : r.nC} ${r.nC === 1 ? c.name : plural(c)} nimmt?`
      : `Aus **${ionText(c)}** und **${ionText(a)}** soll eine neutrale Verbindung werden. Wie viele ${plural(c)} braucht man für ${r.nA === 1 ? "ein" : r.nA} ${r.nA === 1 ? a.name : plural(a)}?`,
    hint: "Positive und negative Ladungen müssen gleich groß sein – beide Bausteinreihen gleich lang.",
    explain: `${r.nC} · (${chargeFull(c.charge)}) = ${r.nC * c.charge}+ und ${r.nA} · (${chargeFull(a.charge)}) = ${r.nA * -a.charge}− → **${F(c, a)}**.`,
  };
}

/** Formel mit Bausteinen bauen */
function build(os: boolean): Task {
  let c: Ion, a: Ion;
  do { ({ c, a } = pair(os)); } while (ratio(c, a).nC === 1 && ratio(c, a).nA === 1 && Math.random() < 0.6);
  const r = ratio(c, a);
  const g = gcd(abs(c.charge), abs(a.charge));
  const traps = ([
    r.nC !== 1 || r.nA !== 1 ? { values: { nC: 1, nA: 1 }, miss: "ionen-1zu1", why: `Ein ${c.name} (${chargeFull(c.charge)}) und ein ${a.name} (${chargeFull(a.charge)}) sind zusammen nicht neutral – die Reihen müssen gleich lang werden.` } : null,
    r.nC !== r.nA ? { values: { nC: r.nA, nA: r.nC }, miss: "indizes-vertauscht", why: `Genau verkehrt: ${r.nC * a.charge + r.nA * c.charge > 0 ? "zu viel Plus" : "zu viel Minus"}. Die Ladungszahl von ${ionText(c)} sagt, wie viele ${plural(a)} man braucht – und umgekehrt.` } : null,
    g > 1 ? { values: { nC: abs(a.charge), nA: abs(c.charge) }, miss: "nicht-gekuerzt", why: `Neutral, aber nicht die kleinste Zahl: ${abs(a.charge)} : ${abs(c.charge)} lässt sich kürzen auf ${r.nC} : ${r.nA}.` } : null,
  ] as (Trap | null)[]).filter((t): t is Trap => t !== null);
  return {
    kind: "build", cation: c.id, anion: a.id, traps,
    prompt: `Baue die Formel für **${compoundName(c, a)}** aus ${ionText(c)} und ${ionText(a)}.`,
    hint: "Füge Bausteine hinzu, bis die goldene und die grüne Reihe gleich lang sind – mit möglichst wenigen Bausteinen.",
    explain: `${r.nC} · (${chargeFull(c.charge)}) = ${r.nC * c.charge}+ und ${r.nA} · (${chargeFull(a.charge)}) = ${r.nA * -a.charge}− → **${F(c, a)}**.`,
  };
}

/** Welche Formel hat …? */
function formulaMc(os: boolean): Task {
  let c: Ion, a: Ion;
  do { ({ c, a } = pair(os)); } while (ratio(c, a).nC === 1 && ratio(c, a).nA === 1 && Math.random() < 0.6);
  const r = ratio(c, a);
  const noParen = a.Z === undefined && r.nA > 1 ? toSubscript(c.formula + (r.nC > 1 ? r.nC : "") + a.formula + r.nA) : null;
  const g = gcd(abs(c.charge), abs(a.charge));
  const wrongs = [
    noParen ? d(noParen, "klammer-vergessen", `Ohne Klammer gilt die ${r.nA} nur für das letzte Atom. ${r.nA} ganze ${plural(a)} → **(${toSubscript(a.formula)})${toSubscript(String(r.nA))}**.`) : null,
    r.nC !== r.nA ? d(F(c, a, r.nA, r.nC), "indizes-vertauscht", `Der Index ist die Anzahl, nicht die eigene Ladung: ${balance(c, a, r.nC, r.nA)}.`) : null,
    r.nC !== 1 || r.nA !== 1 ? d(F(c, a, 1, 1), "ionen-1zu1", `Ein ${c.name} (${chargeFull(c.charge)}) und ein ${a.name} (${chargeFull(a.charge)}) sind zusammen nicht neutral.`) : null,
    g > 1 ? d(F(c, a, abs(a.charge), abs(c.charge)), "nicht-gekuerzt", `Neutral, aber nicht gekürzt: ${abs(a.charge)} : ${abs(c.charge)} = ${r.nC} : ${r.nA}.`) : null,
    F(c, a, r.nC, r.nA + 1), F(c, a, r.nC + 1, r.nA),
  ];
  return {
    ...mc(F(c, a), wrongs),
    prompt: `Welche Formel hat **${compoundName(c, a)}**?`,
    hint: `Ladungen: ${ionText(c)} und ${ionText(a)}. Suche das kleinste gemeinsame Vielfache.`,
    explain: `${r.nC} · (${chargeFull(c.charge)}) = ${r.nC * c.charge}+ und ${r.nA} · (${chargeFull(a.charge)}) = ${r.nA * -a.charge}− → **${F(c, a)}**.`
      + (a.Z === undefined && r.nA > 1 ? " Mehratomige Ionen kommen in Klammern, wenn man mehrere braucht." : ""),
  };
}

/** Wie heißt die Verbindung? */
function name(os: boolean): Task {
  const { c, a } = pair(os);
  const p = pool(os);
  const r = ratio(c, a);
  const wrongs = [
    // sulfid ↔ sulfat ↔ sulfit
    ...p.an.filter(x => x.id !== a.id && x.part.slice(0, 3) === a.part.slice(0, 3)).map(x =>
      d(compoundName(c, x), "endung-id-at", `${ionText(a)} heißt ${a.name}${a.Z !== undefined ? " – einatomige Anionen enden auf **-id**" : ` – ${x.name} wäre ${ionText(x)}`}.`)),
    // Eisen(II) ↔ Eisen(III)
    ...p.cat.filter(x => x.id !== c.id && x.Z === c.Z).map(x =>
      d(compoundName(x, a), "roemisch-falsch", `Die römische Zahl ist die Ladung des Metall-Ions, nicht seine Anzahl: ${balance(c, a, r.nC, r.nA)} → ${c.name}.`)),
    ...shuffle(p.an.filter(x => x.id !== a.id)).slice(0, 3).map(x => compoundName(c, x)),
  ];
  return {
    ...mc(compoundName(c, a), wrongs),
    prompt: `Wie heißt die Verbindung **${F(c, a)}**?`,
    hint: "Zuerst das Kation (meist ein Metall), dann das Anion: einatomig mit der Endung -id, mehratomige Ionen haben eigene Namen (Sulfat, Nitrat, Hydroxid …).",
    explain: `${F(c, a)} besteht aus ${c.name}en (${ionText(c)}) und ${plural(a)} (${ionText(a)}) → **${compoundName(c, a)}**.`,
  };
}

/** Ladung eines mehratomigen Ions */
function polyCharge(): Task {
  const ion = pick([...CATIONS, ...ANIONS].filter(i => i.Z === undefined));
  const idx = Number(ion.formula.match(/\d+$/)?.[0]);
  const signOf = (q: number) => (q > 0 ? "positiv" : "negativ");
  const wrongs = [
    d(chargeFull(-ion.charge), "ladung-vorzeichen", `${ion.name}en sind ${signOf(ion.charge)}: ${ion.charge > 0 ? "es ist das einzige mehratomige Kation im Baukasten" : "alle anderen mehratomigen Ionen hier sind Anionen"}.`),
    idx && idx !== abs(ion.charge) ? d(chargeFull(Math.sign(ion.charge) * idx), "ladung-aus-index", `Die ${idx} in ${toSubscript(ion.formula)} ist die Anzahl der Atome, nicht die Ladung. Die Ladung muss man lernen: **${ionText(ion)}**.`) : null,
    ...[1, 2, 3, -1, -2, -3].map(chargeFull),
  ];
  return {
    ...mc(chargeFull(ion.charge), wrongs),
    prompt: `Welche Ladung hat das **${ion.name}** (${toSubscript(ion.formula)})?`,
    hint: "Diese Ladungen muss man auswendig kennen – schau im Baukasten nach.",
    explain: `${ion.name}: **${ionText(ion)}**.`,
  };
}

/** Römische Zahl: Ladung des Metall-Ions aus der Formel */
function romanCharge(): Task {
  let c: Ion, a: Ion;
  do {
    c = pick(CATIONS.filter(i => i.part.endsWith(")")));
    a = pick(ANIONS.filter(x => !x.os || x.Z === undefined));
  } while (!isKnownCompound(c, a));
  const r = ratio(c, a);
  const total = r.nA * -a.charge;
  const wrongs = [
    r.nC > 1 ? d(`${total}+`, "gesamtladung-nicht-geteilt", `${total}+ ist die Gesamtladung aller ${r.nC} Metall-Ionen zusammen. Geteilt durch ${r.nC} → **${c.charge}+** je Ion.`) : null,
    r.nC > 1 && r.nC !== c.charge ? d(`${r.nC}+`, "roemisch-falsch", `Die ${r.nC} ist der Index (Anzahl der Metall-Ionen), nicht ihre Ladung. Erst die Gesamtladung ${total}− ausgleichen, dann auf ${r.nC} Ionen aufteilen.`) : null,
    abs(a.charge) !== c.charge ? d(`${abs(a.charge)}+`, "anion-ladung", `${abs(a.charge)} ist die Ladung des ${a.name}s. Gefragt ist das Metall-Ion: ${balance(c, a, r.nC, r.nA)}.`) : null,
    "1+", "2+", "3+", "4+",
  ];
  return {
    ...mc(`${c.charge}+`, wrongs),
    prompt: `Welche Ladung hat das Metall-Ion in **${F(c, a)}**?`,
    hint: `Rechne die negative Gesamtladung aus und teile sie auf ${r.nC === 1 ? `das ${BY_Z[c.Z!].name}-Ion` : `die ${r.nC} ${BY_Z[c.Z!].name}-Ionen`} auf.`,
    explain: `${r.nA} · (${chargeFull(a.charge)}) = ${r.nA * -a.charge}−. ${r.nC > 1 ? `Aufgeteilt auf ${r.nC} Metall-Ionen → je **${c.charge}+**` : `Das eine Metall-Ion trägt also **${c.charge}+**`}. Name: ${compoundName(c, a)}.`,
  };
}

// ── Level und Runden ────────────────────────────────────────────────────────

const GENS = (os: boolean): Record<string, () => Task> => ({
  charge: () => charge(os), electrons, count: () => count(os), build: () => build(os),
  formula: () => formulaMc(os), name: () => name(os), polyCharge, romanCharge,
});

export const TYPE_NAMES: Record<string, string> = {
  charge: "Ionenladungen", electrons: "Elektronen abgeben/aufnehmen", count: "Verhältnis der Ionen",
  build: "Formeln bauen", formula: "Formeln erkennen", name: "Namen von Verbindungen",
  polyCharge: "Mehratomige Ionen", romanCharge: "Römische Zahlen",
};

interface Level extends QuizLevel { types: string[] }
export const LEVELS: Record<Stufe, Level[]> = {
  us: [
    { id: "us-1", name: "Ionenladungen", desc: "Welches Ion bildet ein Element – und warum?", types: ["charge", "electrons"] },
    { id: "us-2", name: "Formeln aufstellen", desc: "Ladungen ausgleichen mit Bausteinen", types: ["build", "formula", "count"] },
    { id: "us-3", name: "Namen & Formeln", desc: "Von der Formel zum Namen und zurück", types: ["name", "formula", "build"] },
  ],
  os: [
    { id: "os-1", name: "Ionen & Ladungen", desc: "Hauptgruppen, mehratomige Ionen, römische Zahlen", types: ["charge", "polyCharge", "romanCharge"] },
    { id: "os-2", name: "Formeln aufstellen", desc: "Auch mit Klammern: Ca(OH)₂, Al₂(SO₄)₃", types: ["build", "formula", "count"] },
    { id: "os-3", name: "Namen & Formeln", desc: "Sulfid oder Sulfat? Eisen(II) oder Eisen(III)?", types: ["name", "formula", "romanCharge"] },
  ],
};

export const levelId = (stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[stufe as Stufe][level].id : `${stufe}-${level}`);
export const levelName = (stufe: string, level: LevelKey) =>
  level === "mix" ? "Alles gemischt" : level === "weak" ? "Schwächen üben" : level === "due" ? "Heute fällig" : LEVELS[stufe as Stufe][level].name;

export function makeRound(stufe: string, level: LevelKey, stats?: TypeStats, due: string[] = []): Task[] {
  const s = stufe as Stufe;
  const levels = LEVELS[s];
  let ids = level === "mix" ? [...new Set(levels.flatMap(l => l.types))]
    : level === "weak" ? weakTypes(stats, id => levels.some(l => l.types.includes(id)))
    : level === "due" ? due.filter(id => levels.some(l => l.types.includes(id)))
    : levels[level].types;
  if (!ids.length) ids = levels[0].types;
  return buildRound(ids, GENS(s === "os"), 10);
}

export const ionsOf = (t: Extract<Task, { kind: "build" }>) => ({ cation: ION_BY_ID[t.cation], anion: ION_BY_ID[t.anion] });
