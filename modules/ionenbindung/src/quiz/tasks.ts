// Quiz-Aufgaben zur Ionenbindung (reine Daten, damit Runden gespeichert werden können).

import {
  CATIONS, ANIONS, ION_BY_ID, ionsFor, ratio, formula, toSubscript, compoundName, ionText, chargeFull, isKnownCompound, BY_Z, type Ion, groupLabel,
} from "@lern/chem";
import { buildRound, mc, d, pick, shuffle, type BaseTask, type LevelKey, type McTask, type QuizLevel, type Trap, type TypeStats } from "@lern/quiz";
import { weakTypes } from "@lern/quiz";
import type { Stufe } from "../store.ts";
import { tr } from "@lern/i18n";

export type Task = McTask | (BaseTask & { kind: "build"; cation: string; anion: string });

const F = (c: Ion, a: Ion, nC?: number, nA?: number) => toSubscript(formula(c, a, nC, nA));
const mono = (list: Ion[]) => list.filter(i => i.Z !== undefined);
const pool = (os: boolean) => ({ cat: ionsFor(CATIONS, os), an: ionsFor(ANIONS, os) });
/** Zufälliges Ionenpaar – nur Verbindungen, die es wirklich gibt */
const pair = (os: boolean) => {
  const p = pool(os);
  for (;;) { const c = pick(p.cat), a = pick(p.an); if (isKnownCompound(c, a)) return { c, a }; }
};
const plural = (ion: Ion) => tr(ion.name.replace(/-Ion$/, "-Ionen"), `${nm(ion)}s`);
/** Name im Satz (englisch klein: „sodium ion“) */
const nm = (ion: Ion) => tr(ion.name, ion.name[0].toLowerCase() + ion.name.slice(1));
const abs = Math.abs;
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
/** Ladungsausgleich als Rechnung: „2 · (3+) = 6+ und 3 · (2−) = 6−“ */
const balance = (c: Ion, a: Ion, nC: number, nA: number) =>
  `${nC} · (${chargeFull(c.charge)}) = ${nC * c.charge}+ ${tr("und", "and")} ${nA} · (${chargeFull(a.charge)}) = ${nA * -a.charge}−`;

// ── Aufgabentypen ───────────────────────────────────────────────────────────

/** Welches Ion bildet ein Element? (Hauptgruppen) */
function charge(os: boolean): Task {
  const ion = pick(mono([...ionsFor(CATIONS, false), ...ionsFor(ANIONS, false)]));
  const el = BY_Z[ion.Z!], q = ion.charge, n = abs(q);
  const opt = (c: number) => el.symbol + ionText({ ...ion, charge: c }).slice(el.symbol.length);
  const wrongs = q > 0
    ? [
      d(opt(-q), "ion-gegenteil", tr(`${el.name} ist ein Metall. Metalle geben Elektronen ab – das Ion wird **positiv**.`, `${el.name} is a metal. Metals lose electrons – the ion becomes **positive**.`)),
      d(opt(q - 8), "auffuellen-statt-abgeben", tr(`Metalle bilden positive Ionen: ${el.name} gibt ${n === 1 ? "sein 1 Außenelektron" : `seine ${n} Außenelektronen`} ab → ${ionText(ion)}.`, `Metals form positive ions: ${el.name} loses ${n === 1 ? "its 1 outer electron" : `its ${n} outer electrons`} → ${ionText(ion)}.`)),
      d(opt(q + 1), "ladung-verzaehlt", tr(`${el.name} steht in der ${groupLabel(el.Z, os)}: es hat ${n === 1 ? "1 Außenelektron" : `${n} Außenelektronen`} und gibt genau ${n === 1 ? "dieses" : "diese"} ab.`, `${el.name} is in ${groupLabel(el.Z, os)}: it has ${n === 1 ? "1 outer electron" : `${n} outer electrons`} and loses exactly ${n === 1 ? "this one" : "these"}.`)),
    ]
    : [
      d(opt(-q), "ion-gegenteil", tr(`${el.name} ist ein Nichtmetall. Nichtmetalle nehmen Elektronen auf – das Ion wird **negativ**.`, `${el.name} is a non-metal. Non-metals gain electrons – the ion becomes **negative**.`)),
      d(opt(8 + q), "abgeben-statt-aufnehmen", tr(`${el.name} hat ${8 - n} Außenelektronen. Es gibt sie nicht ab, sondern füllt bis zur 8 auf: ${n === 1 ? "1 Elektron" : `${n} Elektronen`} dazu.`, `${el.name} has ${8 - n} outer electrons. It does not lose them but fills up to 8: ${n === 1 ? "1 more electron" : `${n} more electrons`}.`)),
      d(opt(q - 1), "ladung-verzaehlt", tr(`${el.name} hat ${8 - n} Außenelektronen. Bis zur 8 ${n === 1 ? "fehlt genau 1" : `fehlen genau ${n}`}.`, `${el.name} has ${8 - n} outer electrons. Exactly ${n} ${n === 1 ? "is" : "are"} missing to make 8.`)),
    ];
  return {
    ...mc(opt(q), wrongs),
    prompt: tr(`Welches Ion bildet **${el.name}**?`, `Which ion does **${el.name}** form?`),
    hint: os ? tr("Gruppe 1, 2, 13: 1, 2, 3 Elektronen abgeben. Gruppe 15–17: bis 8 auffüllen.", "Groups 1, 2, 13: lose 1, 2, 3 electrons. Groups 15–17: fill up to 8.")
      : tr("Hauptgruppe I–III: so viele Elektronen abgeben. Hauptgruppe V–VII: bis zur 8 auffüllen.", "Main groups I–III: lose that many electrons. Main groups V–VII: fill up to 8."),
    explain: tr(`${el.name} ${q > 0 ? `gibt ${q} Elektron${q > 1 ? "en" : ""} ab` : `nimmt ${-q} Elektron${q < -1 ? "en" : ""} auf`}. Das Ion hat dann eine volle Außenschale wie ein Edelgas → **${ionText(ion)}**.`,
      `${el.name} ${q > 0 ? `loses ${q} electron${q > 1 ? "s" : ""}` : `gains ${-q} electron${q < -1 ? "s" : ""}`}. The ion then has a full outer shell like a noble gas → **${ionText(ion)}**.`),
  };
}

/** Wie viele Elektronen werden abgegeben/aufgenommen? */
function electrons(): Task {
  const ion = pick(mono([...ionsFor(CATIONS, false), ...ionsFor(ANIONS, false)]));
  const el = BY_Z[ion.Z!], n = Math.abs(ion.charge);
  const other = ion.charge > 0
    ? d(String(8 - n), "auffuellen-statt-abgeben", tr(`Metalle nehmen keine Elektronen auf. ${el.name} gibt ${n === 1 ? "sein 1 Außenelektron" : `seine ${n} Außenelektronen`} ab → ${ionText(ion)}.`, `Metals do not gain electrons. ${el.name} loses ${n === 1 ? "its 1 outer electron" : `its ${n} outer electrons`} → ${ionText(ion)}.`))
    : d(String(8 - n), "abgeben-statt-aufnehmen", tr(`${8 - n} ist die Zahl der Außenelektronen. ${el.name} gibt sie nicht ab, sondern nimmt ${n === 1 ? "1 Elektron" : `${n} Elektronen`} auf – dann sind es 8.`, `${8 - n} is the number of outer electrons. ${el.name} does not lose them but gains ${n === 1 ? "1 electron" : `${n} electrons`} – then there are 8.`));
  return {
    ...mc(String(n), [other, ...["1", "2", "3", "4", "5", "6", "7"].filter(x => x !== String(n) && x !== String(8 - n))]),
    prompt: tr(`Ein **${el.name}**-Atom wird zum Ion. Wie viele Elektronen ${ion.charge > 0 ? "gibt es ab" : "nimmt es auf"}?`, `A **${el.name}** atom becomes an ion. How many electrons does it ${ion.charge > 0 ? "lose" : "gain"}?`),
    hint: tr("Schau auf die Hauptgruppe: Sie sagt, wie viele Außenelektronen das Atom hat.", "Look at the main group: it tells you how many outer electrons the atom has."),
    explain: tr(`${el.name} hat ${ion.charge > 0 ? n : 8 - n} Außenelektron${(ion.charge > 0 ? n : 8 - n) === 1 ? "" : "en"}. ${ion.charge > 0
      ? (n === 1 ? "Es gibt dieses **1** Elektron ab" : `Es gibt diese **${n}** ab`)
      : `Es nimmt **${n}** auf, dann sind es 8`} → ${ionText(ion)}, volle Außenschale wie ein Edelgas.`,
      `${el.name} has ${ion.charge > 0 ? n : 8 - n} outer electron${(ion.charge > 0 ? n : 8 - n) === 1 ? "" : "s"}. ${ion.charge > 0
      ? (n === 1 ? "It loses this **1** electron" : `It loses these **${n}**`)
      : `It gains **${n}**, then there are 8`} → ${ionText(ion)}, a full outer shell like a noble gas.`),
  };
}

/** Wie viele Anionen braucht man pro Kation (oder umgekehrt)? */
function count(os: boolean): Task {
  let c: Ion, a: Ion, r: { nC: number; nA: number };
  do { ({ c, a } = pair(os)); r = ratio(c, a); } while (r.nC === 1 && r.nA === 1 && Math.random() < 0.7);
  const askAnion = r.nC === 1 || (r.nA !== 1 && Math.random() < 0.5);
  const right = askAnion ? `${r.nA} ${r.nA === 1 ? nm(a) : plural(a)}` : `${r.nC} ${r.nC === 1 ? nm(c) : plural(c)}`;
  const other = (n: number, ion: Ion) => `${n} ${n === 1 ? nm(ion) : plural(ion)}`;
  const target = askAnion ? a : c, partner = askAnion ? c : a, base = askAnion ? r.nA : r.nC;
  const wrongs = [
    base !== 1 ? d(other(1, target), "ionen-1zu1", tr(`Ein ${c.name} (${chargeFull(c.charge)}) und ein ${a.name} (${chargeFull(a.charge)}) sind zusammen nicht neutral. Ionenverbindungen sind keine Paare, sondern ein Gitter im passenden Verhältnis.`,
        `One ${nm(c)} (${chargeFull(c.charge)}) and one ${nm(a)} (${chargeFull(a.charge)}) together are not neutral. Ionic compounds are not pairs but a lattice in the right ratio.`))
      : d(other(2, target), "ladungen-ungleich", tr(`${ionText(c)} und ${ionText(a)} sind gleich stark geladen – eines gleicht genau eines aus. Mit zwei wären die Reihen ungleich lang, die Verbindung geladen.`,
        `${ionText(c)} and ${ionText(a)} have equal charges – one balances exactly one. With two the rows would differ in length and the compound would be charged.`)),
    abs(target.charge) !== base ? d(other(abs(target.charge), target), "anzahl-eigene-ladung", tr(`Die Ladung des ${target.name}s (${chargeFull(target.charge)}) sagt nicht, wie viele man braucht. Entscheidend ist, wie viel Ladung vom ${partner.name} (${chargeFull(partner.charge)}) auszugleichen ist.`,
      `The charge of the ${nm(target)} (${chargeFull(target.charge)}) does not tell you how many you need. What matters is how much charge of the ${nm(partner)} (${chargeFull(partner.charge)}) has to be balanced.`)) : null,
    abs(partner.charge) !== base ? d(other(abs(partner.charge), target), "nicht-gekuerzt", tr(`${abs(partner.charge)} : ${abs(target.charge)} lässt sich kürzen: ${balance(c, a, r.nC, r.nA)}.`, `${abs(partner.charge)} : ${abs(target.charge)} can be simplified: ${balance(c, a, r.nC, r.nA)}.`)) : null,
    ...[1, 2, 3, 4, 6].filter(n => n !== base).map(n => other(n, target)),
  ];
  return {
    ...mc(right, wrongs),
    prompt: askAnion
      ? tr(`Aus **${ionText(c)}** und **${ionText(a)}** soll eine neutrale Verbindung werden. Wie viele ${plural(a)} braucht man, wenn man ${r.nC === 1 ? "ein" : r.nC} ${r.nC === 1 ? c.name : plural(c)} nimmt?`,
        `**${ionText(c)}** and **${ionText(a)}** should form a neutral compound. How many ${plural(a)} do you need for ${r.nC === 1 ? "one" : r.nC} ${r.nC === 1 ? nm(c) : plural(c)}?`)
      : tr(`Aus **${ionText(c)}** und **${ionText(a)}** soll eine neutrale Verbindung werden. Wie viele ${plural(c)} braucht man für ${r.nA === 1 ? "ein" : r.nA} ${r.nA === 1 ? a.name : plural(a)}?`,
        `**${ionText(c)}** and **${ionText(a)}** should form a neutral compound. How many ${plural(c)} do you need for ${r.nA === 1 ? "one" : r.nA} ${r.nA === 1 ? nm(a) : plural(a)}?`),
    hint: tr("Positive und negative Ladungen müssen gleich groß sein – beide Bausteinreihen gleich lang.", "Positive and negative charges must be equal – both rows of tiles the same length."),
    explain: `${balance(c, a, r.nC, r.nA)} → **${F(c, a)}**.`,
  };
}

/** Formel mit Bausteinen bauen */
function build(os: boolean): Task {
  let c: Ion, a: Ion;
  do { ({ c, a } = pair(os)); } while (ratio(c, a).nC === 1 && ratio(c, a).nA === 1 && Math.random() < 0.6);
  const r = ratio(c, a);
  const g = gcd(abs(c.charge), abs(a.charge));
  const traps = ([
    r.nC !== 1 || r.nA !== 1 ? { values: { nC: 1, nA: 1 }, miss: "ionen-1zu1", why: tr(`Ein ${c.name} (${chargeFull(c.charge)}) und ein ${a.name} (${chargeFull(a.charge)}) sind zusammen nicht neutral – die Reihen müssen gleich lang werden.`, `One ${nm(c)} (${chargeFull(c.charge)}) and one ${nm(a)} (${chargeFull(a.charge)}) together are not neutral – the rows must be the same length.`) } : null,
    r.nC !== r.nA ? { values: { nC: r.nA, nA: r.nC }, miss: "indizes-vertauscht", why: tr(`Genau verkehrt: ${r.nC * a.charge + r.nA * c.charge > 0 ? "zu viel Plus" : "zu viel Minus"}. Die Ladungszahl von ${ionText(c)} sagt, wie viele ${plural(a)} man braucht – und umgekehrt.`, `Exactly the wrong way round: ${r.nC * a.charge + r.nA * c.charge > 0 ? "too much plus" : "too much minus"}. The charge of ${ionText(c)} tells you how many ${plural(a)} you need – and vice versa.`) } : null,
    g > 1 ? { values: { nC: abs(a.charge), nA: abs(c.charge) }, miss: "nicht-gekuerzt", why: tr(`Neutral, aber nicht die kleinste Zahl: ${abs(a.charge)} : ${abs(c.charge)} lässt sich kürzen auf ${r.nC} : ${r.nA}.`, `Neutral, but not the smallest numbers: ${abs(a.charge)} : ${abs(c.charge)} simplifies to ${r.nC} : ${r.nA}.`) } : null,
  ] as (Trap | null)[]).filter((t): t is Trap => t !== null);
  return {
    kind: "build", cation: c.id, anion: a.id, traps,
    prompt: tr(`Baue die Formel für **${compoundName(c, a)}** aus ${ionText(c)} und ${ionText(a)}.`, `Build the formula for **${compoundName(c, a)}** from ${ionText(c)} and ${ionText(a)}.`),
    hint: tr("Füge Bausteine hinzu, bis die goldene und die grüne Reihe gleich lang sind – mit möglichst wenigen Bausteinen.", "Add tiles until the gold and the green row are the same length – with as few tiles as possible."),
    explain: `${balance(c, a, r.nC, r.nA)} → **${F(c, a)}**.`,
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
    noParen ? d(noParen, "klammer-vergessen", tr(`Ohne Klammer gilt die ${r.nA} nur für das letzte Atom. ${r.nA} ganze ${plural(a)} → **(${toSubscript(a.formula)})${toSubscript(String(r.nA))}**.`, `Without brackets the ${r.nA} only applies to the last atom. ${r.nA} whole ${plural(a)} → **(${toSubscript(a.formula)})${toSubscript(String(r.nA))}**.`)) : null,
    r.nC !== r.nA ? d(F(c, a, r.nA, r.nC), "indizes-vertauscht", tr(`Der Index ist die Anzahl, nicht die eigene Ladung: ${balance(c, a, r.nC, r.nA)}.`, `The subscript is the number, not the ion's own charge: ${balance(c, a, r.nC, r.nA)}.`)) : null,
    r.nC !== 1 || r.nA !== 1 ? d(F(c, a, 1, 1), "ionen-1zu1", tr(`Ein ${c.name} (${chargeFull(c.charge)}) und ein ${a.name} (${chargeFull(a.charge)}) sind zusammen nicht neutral.`, `One ${nm(c)} (${chargeFull(c.charge)}) and one ${nm(a)} (${chargeFull(a.charge)}) together are not neutral.`)) : null,
    g > 1 ? d(F(c, a, abs(a.charge), abs(c.charge)), "nicht-gekuerzt", tr(`Neutral, aber nicht gekürzt: ${abs(a.charge)} : ${abs(c.charge)} = ${r.nC} : ${r.nA}.`, `Neutral, but not simplified: ${abs(a.charge)} : ${abs(c.charge)} = ${r.nC} : ${r.nA}.`)) : null,
    F(c, a, r.nC, r.nA + 1), F(c, a, r.nC + 1, r.nA),
  ];
  return {
    ...mc(F(c, a), wrongs),
    prompt: tr(`Welche Formel hat **${compoundName(c, a)}**?`, `What is the formula of **${compoundName(c, a)}**?`),
    hint: tr(`Ladungen: ${ionText(c)} und ${ionText(a)}. Nimm von jedem Ion so viele, bis Plus und Minus gleich groß sind.`, `Charges: ${ionText(c)} and ${ionText(a)}. Take as many of each ion as needed until plus and minus are equal.`),
    explain: `${balance(c, a, r.nC, r.nA)} → **${F(c, a)}**.`
      + (a.Z === undefined && r.nA > 1 ? tr(" Mehratomige Ionen kommen in Klammern, wenn man mehrere braucht.", " Polyatomic ions go in brackets when you need more than one.") : ""),
  };
}

/** Wie heißt die Verbindung? */
function name(os: boolean): Task {
  const { c, a } = pair(os);
  const p = pool(os);
  const r = ratio(c, a);
  const wrongs = [
    // sulfid ↔ sulfat ↔ sulfit
    ...p.an.filter(x => x.id !== a.id && x.part.slice(0, 3) === a.part.slice(0, 3) && !/^hydr/.test(x.part) && !/^hydr/.test(a.part)).map(x =>
      d(compoundName(c, x), "endung-id-at", tr(`${ionText(a)} heißt ${a.name}${a.Z !== undefined ? " – einatomige Anionen enden auf **-id**" : ` – ${x.name} wäre ${ionText(x)}`}.`, `${ionText(a)} is called ${nm(a)}${a.Z !== undefined ? " – monatomic anions end in **-ide**" : ` – ${nm(x)} would be ${ionText(x)}`}.`))),
    // Eisen(II) ↔ Eisen(III)
    ...p.cat.filter(x => x.id !== c.id && x.Z === c.Z).map(x =>
      d(compoundName(x, a), "roemisch-falsch", tr(`Die römische Zahl ist die Ladung des Metall-Ions, nicht seine Anzahl: ${balance(c, a, r.nC, r.nA)} → ${c.name}.`, `The Roman numeral is the charge of the metal ion, not the number of ions: ${balance(c, a, r.nC, r.nA)} → ${nm(c)}.`))),
    ...shuffle(p.an.filter(x => x.id !== a.id)).slice(0, 3).map(x => compoundName(c, x)),
  ];
  return {
    ...mc(compoundName(c, a), wrongs),
    prompt: tr(`Wie heißt die Verbindung **${F(c, a)}**?`, `What is the name of the compound **${F(c, a)}**?`),
    hint: tr("Zuerst das Kation (meist ein Metall), dann das Anion: einatomig mit der Endung -id, mehratomige Ionen haben eigene Namen (Sulfat, Nitrat, Hydroxid …).", "First the cation (usually a metal), then the anion: monatomic with the ending -ide, polyatomic ions have their own names (sulfate, nitrate, hydroxide …)."),
    explain: tr(`${F(c, a)} besteht aus ${c.name}en (${ionText(c)}) und ${plural(a)} (${ionText(a)}) → **${compoundName(c, a)}**.`, `${F(c, a)} consists of ${plural(c)} (${ionText(c)}) and ${plural(a)} (${ionText(a)}) → **${compoundName(c, a)}**.`),
  };
}

/** Ladung eines mehratomigen Ions */
function polyCharge(): Task {
  const ion = pick([...CATIONS, ...ANIONS].filter(i => i.Z === undefined));
  const idx = Number(ion.formula.match(/\d+$/)?.[0]);
  const signOf = (q: number) => (q > 0 ? tr("positiv", "positive") : tr("negativ", "negative"));
  const wrongs = [
    d(chargeFull(-ion.charge), "ladung-vorzeichen", tr(`${ion.name}en sind ${signOf(ion.charge)}: ${ion.charge > 0 ? "es ist das einzige mehratomige Kation im Baukasten" : "alle anderen mehratomigen Ionen hier sind Anionen"}.`, `${plural(ion)[0].toUpperCase() + plural(ion).slice(1)} are ${signOf(ion.charge)}: ${ion.charge > 0 ? "it is the only polyatomic cation in the kit" : "all other polyatomic ions here are anions"}.`)),
    idx && idx !== abs(ion.charge) ? d(chargeFull(Math.sign(ion.charge) * idx), "ladung-aus-index", tr(`Die ${idx} in ${toSubscript(ion.formula)} ist die Anzahl der Atome, nicht die Ladung. Die Ladung muss man lernen: **${ionText(ion)}**.`, `The ${idx} in ${toSubscript(ion.formula)} is the number of atoms, not the charge. The charge has to be learned: **${ionText(ion)}**.`)) : null,
    ...[1, 2, 3, -1, -2, -3].map(chargeFull),
  ];
  return {
    ...mc(chargeFull(ion.charge), wrongs),
    prompt: tr(`Welche Ladung hat das **${ion.name}** (${toSubscript(ion.formula)})?`, `What is the charge of the **${nm(ion)}** (${toSubscript(ion.formula)})?`),
    hint: tr("Diese Ladungen muss man auswendig kennen – schau im Baukasten nach.", "These charges have to be learned – look them up in the kit."),
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
    r.nC > 1 ? d(`${total}+`, "gesamtladung-nicht-geteilt", tr(`${total}+ ist die Gesamtladung aller ${r.nC} Metall-Ionen zusammen. Geteilt durch ${r.nC} → **${c.charge}+** je Ion.`, `${total}+ is the total charge of all ${r.nC} metal ions together. Divided by ${r.nC} → **${c.charge}+** per ion.`)) : null,
    r.nC > 1 && r.nC !== c.charge ? d(`${r.nC}+`, "roemisch-falsch", tr(`Die ${r.nC} ist der Index (Anzahl der Metall-Ionen), nicht ihre Ladung. Erst die Gesamtladung ${total}− ausgleichen, dann auf ${r.nC} Ionen aufteilen.`, `The ${r.nC} is the subscript (number of metal ions), not their charge. First balance the total charge ${total}−, then share it among ${r.nC} ions.`)) : null,
    abs(a.charge) !== c.charge ? d(`${abs(a.charge)}+`, "anion-ladung", tr(`${abs(a.charge)} ist die Ladung des ${a.name}s. Gefragt ist das Metall-Ion: ${balance(c, a, r.nC, r.nA)}.`, `${abs(a.charge)} is the charge of the ${nm(a)}. The question asks for the metal ion: ${balance(c, a, r.nC, r.nA)}.`)) : null,
    "1+", "2+", "3+", "4+",
  ];
  return {
    ...mc(`${c.charge}+`, wrongs),
    prompt: tr(`Welche Ladung hat das Metall-Ion in **${F(c, a)}**?`, `What is the charge of the metal ion in **${F(c, a)}**?`),
    hint: tr(`Rechne die negative Gesamtladung aus und teile sie auf ${r.nC === 1 ? `das ${BY_Z[c.Z!].name}-Ion` : `die ${r.nC} ${BY_Z[c.Z!].name}-Ionen`} auf.`, `Work out the total negative charge and share it among ${r.nC === 1 ? `the ${BY_Z[c.Z!].name.toLowerCase()} ion` : `the ${r.nC} ${BY_Z[c.Z!].name.toLowerCase()} ions`}.`),
    explain: tr(`${r.nA} · (${chargeFull(a.charge)}) = ${r.nA * -a.charge}−. ${r.nC > 1 ? `Aufgeteilt auf ${r.nC} Metall-Ionen → je **${c.charge}+**` : `Das eine Metall-Ion trägt also **${c.charge}+**`}. Name: ${compoundName(c, a)}.`,
      `${r.nA} · (${chargeFull(a.charge)}) = ${r.nA * -a.charge}−. ${r.nC > 1 ? `Shared among ${r.nC} metal ions → **${c.charge}+** each` : `So the one metal ion carries **${c.charge}+**`}. Name: ${compoundName(c, a)}.`),
  };
}

// ── Level und Runden ────────────────────────────────────────────────────────

const GENS = (os: boolean): Record<string, () => Task> => ({
  charge: () => charge(os), electrons, count: () => count(os), build: () => build(os),
  formula: () => formulaMc(os), name: () => name(os), polyCharge, romanCharge,
});

export const TYPE_NAMES: Record<string, string> = tr({
  charge: "Ionenladungen", electrons: "Elektronen abgeben/aufnehmen", count: "Verhältnis der Ionen",
  build: "Formeln bauen", formula: "Formeln erkennen", name: "Namen von Verbindungen",
  polyCharge: "Mehratomige Ionen", romanCharge: "Römische Zahlen",
}, {
  charge: "Ion charges", electrons: "Losing/gaining electrons", count: "Ratio of ions",
  build: "Building formulas", formula: "Recognising formulas", name: "Names of compounds",
  polyCharge: "Polyatomic ions", romanCharge: "Roman numerals",
});

interface Level extends QuizLevel { types: string[] }
export const LEVELS: Record<Stufe, Level[]> = {
  us: [
    { id: "us-1", name: tr("Ionenladungen", "Ion charges"), desc: tr("Welches Ion bildet ein Element – und warum?", "Which ion does an element form – and why?"), types: ["charge", "electrons"] },
    { id: "us-2", name: tr("Formeln aufstellen", "Writing formulas"), desc: tr("Ladungen ausgleichen mit Bausteinen", "Balancing charges with tiles"), types: ["build", "formula", "count"] },
    { id: "us-3", name: tr("Namen & Formeln", "Names & formulas"), desc: tr("Von der Formel zum Namen und zurück", "From formula to name and back"), types: ["name", "formula", "build"] },
  ],
  os: [
    { id: "os-1", name: tr("Ionen & Ladungen", "Ions & charges"), desc: tr("Hauptgruppen, mehratomige Ionen, römische Zahlen", "Main groups, polyatomic ions, Roman numerals"), types: ["charge", "polyCharge", "romanCharge"] },
    { id: "os-2", name: tr("Formeln aufstellen", "Writing formulas"), desc: tr("Auch mit Klammern: Ca(OH)₂, Al₂(SO₄)₃", "With brackets too: Ca(OH)₂, Al₂(SO₄)₃"), types: ["build", "formula", "count"] },
    { id: "os-3", name: tr("Namen & Formeln", "Names & formulas"), desc: tr("Sulfid oder Sulfat? Eisen(II) oder Eisen(III)?", "Sulfide or sulfate? Iron(II) or iron(III)?"), types: ["name", "formula", "romanCharge"] },
  ],
};

export const levelId = (stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[stufe as Stufe][level].id : `${stufe}-${level}`);
export const levelName = (stufe: string, level: LevelKey) =>
  level === "mix" ? tr("Alles gemischt", "Everything mixed") : level === "weak" ? tr("Schwächen üben", "Practise weak spots") : level === "due" ? tr("Heute fällig", "Due today") : LEVELS[stufe as Stufe][level].name;

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
