// Quiz-Aufgaben zur Elektronenpaarbindung (reine Daten).

import {
  KNOWN, KNOWN_BY_ID, toMolecule, electronsOf, shapeAt, isPolar, polarBonds, bondName, elementName, geometryName, VALENCE, en, composition, type KnownMolecule,
} from "@lern/chem";
import { buildRound, mc, d, pick, shuffle, weakTypes, type BaseTask, type LevelKey, type McTask, type QuizLevel, type Trap, type TypeStats } from "@lern/quiz";
import type { Stufe } from "../store.ts";
import { article, num as dec, tr } from "@lern/i18n";

export type Task = McTask | (BaseTask & { kind: "build"; molecule: string; elements: string[] });

const sub = (f: string) => f.replace(/\d/g, x => "₀₁₂₃₄₅₆₇₈₉"[Number(x)]);
const num = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
/** ungepaarte Elektronen im Lewis-Symbol (H: 1; sonst bis 4 einzeln, darüber 8 − V) */
const unpaired = (el: string) => (el === "H" ? 1 : VALENCE[el] <= 4 ? VALENCE[el] : 8 - VALENCE[el]);
const goal = (el: string) => (el === "H" ? tr("Duett (2)", "duet (2)") : tr("Oktett (8)", "octet (8)"));
/** „Wasserstoff-Atom“ / „hydrogen atom“ */
const atomOf = (el: string) => tr(`${elementName(el)}-Atom`, `${elementName(el).toLowerCase()} atom`);
const bn = (o: number) => tr(bondName(o), bondName(o).toLowerCase());
const geo = geometryName;
const pool = (os: boolean) => KNOWN.filter(k => os || !k.os);
/** Name mitten im englischen Satz klein (carbon dioxide), im Deutschen unverändert */
const mid = (k: KnownMolecule) => tr(k.name, k.name.charAt(0).toLowerCase() + k.name.slice(1));
/** Oberstufe: meist Moleküle, die es erst dort gibt – sonst wiederholen sich O₂, H₂O … aus der Unterstufe */
const pickFor = (os: boolean, cands: KnownMolecule[]) => {
  const fresh = cands.filter(k => k.os);
  return os && fresh.length && Math.random() < 0.6 ? pick(fresh) : pick(cands);
};
const mols = (k: KnownMolecule) => toMolecule(k);
/** Zentralatom: Atom mit den meisten Bindungspartnern (bei 2-atomigen das erste Nicht-H-Atom) */
function centerOf(k: KnownMolecule) {
  const m = mols(k);
  const deg = (id: number) => m.bonds.filter(b => b.a === id || b.b === id).length;
  return [...m.atoms].sort((a, b) => deg(b.id) - deg(a.id) || Number(a.el === "H") - Number(b.el === "H"))[0];
}

function bindigkeit(): Task {
  const el = pick(["H", "C", "N", "O", "F", "Cl"]);
  const n = el === "H" ? 1 : 8 - VALENCE[el], V = VALENCE[el];
  const wrongs = [
    V !== n ? d(String(V), "bindungen-valenz", tr(`${V} ist die Zahl der Außenelektronen. Bindungen gehen nur die **ungepaarten** ein: bis zum ${goal(el)} ${n === 1 ? "fehlt 1" : `fehlen ${n}`}.`, `${V} is the number of outer electrons. Only the **unpaired** ones form bonds: ${n} ${n === 1 ? "is" : "are"} missing for the ${goal(el)}.`)) : null,
    el !== "H" && n < 4 ? d(String(n + 1), "bindungen-fehlend-verzaehlt", tr(`${elementName(el)} hat ${V} Außenelektronen: ${V - n} davon sind schon gepaart, nur ${n === 1 ? "1 ist" : `${n} sind`} ungepaart.`, `${elementName(el)} has ${V} outer electrons: ${V - n} of them are already paired, only ${n} ${n === 1 ? "is" : "are"} unpaired.`)) : null,
    el === "H" ? d("4", "h-oktett", tr("Wasserstoff hat nur 1 Elektron und Platz für 2 (Duett, wie Helium) – es fehlt genau 1 → **1** Bindung.", "Hydrogen has only 1 electron and room for 2 (duet, like helium) – exactly 1 is missing → **1** bond.")) : null,
    el === "C" ? d("2", "bindungen-fehlend-verzaehlt", tr("Kohlenstoff hat 4 Außenelektronen, und alle 4 sind ungepaart – bis zum Oktett fehlen **4**, also 4 Bindungen.", "Carbon has 4 outer electrons, and all 4 are unpaired – **4** are missing for the octet, so 4 bonds.")) : null,
    "1", "2", "3", "4",
  ];
  return {
    ...mc(String(n), wrongs),
    prompt: tr(`Wie viele Elektronenpaarbindungen geht ein **${elementName(el)}**-Atom (${el}) normalerweise ein?`, `How many covalent bonds does ${article(elementName(el))} **${elementName(el)}** atom (${el}) normally form?`),
    hint: tr("Zähle die ungepaarten Elektronen im Lewis-Symbol – jedes kann eine Bindung eingehen.", "Count the unpaired electrons in the Lewis symbol – each can form one bond."),
    explain: tr(`${elementName(el)} hat ${VALENCE[el] === 1 ? "1 Außenelektron" : `${VALENCE[el]} Außenelektronen`}. ${el === "H" ? "Bis zum Duett (2 Elektronen) fehlt 1" : n === 1 ? "Bis zum Oktett fehlt 1" : `Bis zum Oktett fehlen ${n}`} → **${n}** Bindung${n > 1 ? "en" : ""}.`,
      `${elementName(el)} has ${VALENCE[el] === 1 ? "1 outer electron" : `${VALENCE[el]} outer electrons`}. ${el === "H" ? "1 is missing for the duet (2 electrons)" : `${n} ${n === 1 ? "is" : "are"} missing for the octet`} → **${n}** bond${n > 1 ? "s" : ""}.`),
  };
}

function around(os: boolean): Task {
  const k = pick(pool(os).filter(x => x.atoms.length > 2));
  const m = mols(k);
  const a = pick(m.atoms);
  const t = a.el === "H" ? 2 : 8;
  const e = electronsOf(m, a.id), V = VALENCE[a.el];
  const wrongs = a.el === "H"
    ? [d("8", "h-oktett", tr("Wasserstoff hat nur die erste Schale – die ist mit **2** Elektronen voll (wie bei Helium).", "Hydrogen only has the first shell – it is full with **2** electrons (like helium)."))]
    : [
      V !== 8 ? d(String(V), "nur-valenz-gezaehlt", tr(`${V} sind nur die eigenen Außenelektronen. Jede Bindung bringt ein Elektron des Partners dazu: ${e.lone} freie + ${2 * e.bonds} in ${num(e.bonds, "Bindung", "Bindungen")} = 8.`, `${V} are only its own outer electrons. Each bond adds one electron from the partner: ${e.lone} non-bonding + ${2 * e.bonds} in ${num(e.bonds, "bond", "bonds")} = 8.`)) : null,
      2 * e.bonds !== 8 ? d(String(2 * e.bonds), "nur-bindungen-gezaehlt", tr(`${2 * e.bonds} sind nur die Elektronen in den Bindungen. Dazu kommen ${e.lone} freie → 8.`, `${2 * e.bonds} are only the electrons in the bonds. Add ${e.lone} non-bonding → 8.`)) : null,
    ];
  return {
    ...mc(String(t), [...wrongs, "2", "4", "6", "8"]),
    prompt: tr(`Wie viele Elektronen umgeben ein **${elementName(a.el)}**-Atom im Molekül **${k.name}** (${sub(k.formula)})?`, `How many electrons surround ${article(elementName(a.el))} **${elementName(a.el)}** atom in the molecule **${mid(k)}** (${sub(k.formula)})?`),
    hint: tr("Zähle die freien Elektronen und die Elektronen der Bindungen zusammen.", "Add the non-bonding electrons and the electrons in the bonds."),
    explain: tr(`Im fertigen Molekül hat jedes Atom Edelgaskonfiguration: ${a.el === "H" ? "Wasserstoff 2 Elektronen (Duett, wie Helium)" : "8 Elektronen (Oktett)"} → **${t}**.`, `In the finished molecule every atom has a noble gas configuration: ${a.el === "H" ? "hydrogen 2 electrons (duet, like helium)" : "8 electrons (octet)"} → **${t}**.`),
  };
}

function lonePairs(os: boolean): Task {
  const k = pickFor(os, pool(os).filter(x => mols(x).atoms.some(a => a.el !== "H" && a.el !== "C")));
  const m = mols(k);
  const a = pick(m.atoms.filter(x => x.el !== "H" && x.el !== "C"));
  const e = electronsOf(m, a.id), p = e.pairs, V = VALENCE[a.el];
  const wrongs = [
    Math.floor(V / 2) !== p ? d(String(Math.floor(V / 2)), "valenz-als-paare", tr(`Nicht alle ${V} Außenelektronen sind frei: ${e.bonds} stecken in Bindungen. Frei bleiben ${e.lone} → ${num(p, "Paar", "Paare")}.`, `Not all ${V} outer electrons are non-bonding: ${e.bonds} are in bonds. ${e.lone} remain → ${num(p, "pair", "pairs")}.`)) : null,
    e.bonds !== p ? d(String(e.bonds), "bindungen-statt-paare", tr(`${e.bonds} ist die Zahl der Bindungen. Gefragt sind die **freien** Paare: ${V} − ${e.bonds} = ${e.lone} Elektronen = ${num(p, "Paar", "Paare")}.`, `${e.bonds} is the number of bonds. The question asks for **lone** pairs: ${V} − ${e.bonds} = ${e.lone} electrons = ${num(p, "pair", "pairs")}.`)) : null,
    p > 0 ? d(String(e.lone), "elektronen-statt-paare", tr(`${e.lone} freie Elektronen, aber je zwei bilden ein Paar → ${num(p, "Paar", "Paare")}.`, `${e.lone} non-bonding electrons, but every two form a pair → ${num(p, "pair", "pairs")}.`)) : null,
    "0", "1", "2", "3",
  ];
  return {
    ...mc(String(p), wrongs),
    prompt: tr(`Wie viele **freie Elektronenpaare** hat ein ${elementName(a.el)}-Atom im Molekül **${k.name}** (${sub(k.formula)})?`, `How many **lone pairs** does ${article(atomOf(a.el))} ${atomOf(a.el)} have in the molecule **${mid(k)}** (${sub(k.formula)})?`),
    hint: tr("Außenelektronen minus Elektronen, die in Bindungen stecken – der Rest bildet Paare.", "Outer electrons minus electrons in bonds – the rest form pairs."),
    explain: tr(`${elementName(a.el)} hat ${VALENCE[a.el]} Außenelektronen, davon ${electronsOf(m, a.id).bonds} in Bindungen. Übrig: ${electronsOf(m, a.id).lone} → **${p}** freie${p === 1 ? "s" : ""} Paar${p === 1 ? "" : "e"}.`,
      `${elementName(a.el)} has ${VALENCE[a.el]} outer electrons, ${electronsOf(m, a.id).bonds} of them in bonds. Left: ${electronsOf(m, a.id).lone} → **${p}** lone pair${p === 1 ? "" : "s"}.`),
  };
}

/** „1 Zweifachbindung und 2 Einfachbindungen“ */
function bondList(k: KnownMolecule) {
  const by = [3, 2, 1].map(o => [o, mols(k).bonds.filter(b => b.order === o).length] as const).filter(([, c]) => c > 0);
  const parts = by.map(([o, c]) => tr(`${c} ${bondName(o)}${c > 1 ? "en" : ""}`, `${c} ${bn(o)}${c > 1 ? "s" : ""}`));
  return parts.length > 1 ? parts.slice(0, -1).join(", ") + tr(" und ", " and ") + parts[parts.length - 1] : parts[0];
}

function build(os: boolean): Task {
  const k = pick(pool(os).filter(x => x.atoms.length <= (os ? 9 : 5)));
  const elements = [...new Set(k.atoms.map(a => a[0]))];
  const multi = k.bonds.filter(b => b[2] > 1).length;
  // Fallen: QuizView meldet atomsOff (Atomzahl stimmt nicht), multi (Mehrfachbindungen gesetzt), complete (alle Oktette voll)
  const traps: Trap[] = [
    { field: "atomsOff", value: 1, miss: "atomzahl-falsch", why: tr(`${k.name} ist ${sub(k.formula)}: ${num(k.atoms.length, "Atom", "Atome")}. Zähle die Atome in der Formel.`, `${k.name} is ${sub(k.formula)}: ${num(k.atoms.length, "atom", "atoms")}. Count the atoms in the formula.`) },
    ...(multi ? [{ field: "multi", value: 0, miss: "mehrfachbindung-uebersehen", why: tr(`${k.name} hat ${bondList(k)}. Tipp aufs Bindungs-Oval macht aus einer Einfach- eine Zweifachbindung.`, `${k.name} has ${bondList(k)}. Tapping the bond oval turns a single bond into a double bond.`) }] : []),
    { field: "complete", value: 0, miss: "oktett-offen", why: tr("Ein Atom hat noch nicht 8 Elektronen (H: 2) – der rote Kreis zeigt es. Fertig ist ein Molekül erst, wenn alle Kreise ✓ sind.", "An atom does not yet have 8 electrons (H: 2) – the red circle shows it. A molecule is only finished when all circles show ✓.") },
  ];
  return {
    kind: "build", molecule: k.id, elements, traps,
    prompt: tr(`Baue das Molekül **${k.name}** (${sub(k.formula)}).`, `Build the molecule **${mid(k)}** (${sub(k.formula)}).`),
    hint: tr("Im fertigen Molekül hat jedes Atom 8 Elektronen um sich (H: 2). Mehrfachbindung: Bindungs-Oval antippen.", "In the finished molecule every atom has 8 electrons around it (H: 2). Multiple bond: tap the bond oval."),
    explain: tr(`${k.name}: ${bondList(k)} – alle Atome haben Edelgaskonfiguration.`, `${k.name}: ${bondList(k)} – all atoms have a noble gas configuration.`),
  };
}

function bondType(os: boolean): Task {
  const k = pick(pool(os).filter(x => ["O2", "N2", "CO2", "Cl2", "H2", "C2H4", "C2H2", "HCN", "CH2O", "F2"].includes(x.id)));
  const m = mols(k);
  const b = [...m.bonds].sort((p, q) => q.order - p.order)[0];
  const A = m.atoms.find(a => a.id === b.a)!, B = m.atoms.find(a => a.id === b.b)!;
  const pair = A.el === B.el ? tr(`den beiden ${elementName(A.el)}-Atomen`, `the two ${elementName(A.el).toLowerCase()} atoms`) : tr(`dem ${A.el}- und dem ${B.el}-Atom`, `the ${A.el} and the ${B.el} atom`);
  const X = A.el === "H" ? B : A, around = electronsOf(m, X.id).around, g = goal(X.el);
  const less = (o: number) => d(bondName(o), "mehrfachbindung-uebersehen",
    tr(`Mit ${o === 1 ? "nur einem gemeinsamen Paar" : "zwei gemeinsamen Paaren"} hätte ${X.el} erst ${around - 2 * (b.order - o)} Elektronen. Erst ${b.order} gemeinsame Paare bringen beide aufs ${g}.`,
      `With ${o === 1 ? "only one shared pair" : "two shared pairs"} ${X.el} would only have ${around - 2 * (b.order - o)} electrons. Only ${b.order} shared pairs give both a full ${g}.`));
  const more = (o: number) => d(bondName(o), "oktett-ueberschritten",
    tr(`${X.el} hat ${num(VALENCE[X.el], "Außenelektron", "Außenelektronen")}, davon ${num(unpaired(X.el), "ungepaartes", "ungepaarte")}. Mit ${o} Paaren hätte es ${around + 2 * (o - b.order)} Elektronen – mehr als ein ${g.split(" ")[0]}.`,
      `${X.el} has ${num(VALENCE[X.el], "outer electron", "outer electrons")}, ${num(unpaired(X.el), "unpaired one", "unpaired ones")}. With ${o} pairs it would have ${around + 2 * (o - b.order)} electrons – more than ${article(g)} ${g.split(" ")[0]}.`));
  const wrongs = [1, 2, 3].filter(o => o !== b.order).map(o => (o < b.order ? less(o) : more(o)));
  return {
    ...mc(bondName(b.order), wrongs),
    prompt: tr(`Welche Bindung liegt im Molekül **${k.name}** (${sub(k.formula)}) zwischen ${pair} vor?`, `Which bond joins ${pair} in **${mid(k)}** (${sub(k.formula)})?`),
    hint: tr("Wie viele ungepaarte Elektronen hat jedes Atom? So viele Paare teilen die beiden.", "How many unpaired electrons does each atom have? That many pairs are shared."),
    explain: tr(`Mit **${b.order}** gemeinsamen Elektronenpaar${b.order > 1 ? "en" : ""} hat jedes Atom ${A.el === "H" || B.el === "H" ? "Edelgaskonfiguration (H: Duett, sonst Oktett)" : "ein Oktett"} → ${bondName(b.order)}.`,
      `With **${b.order}** shared electron pair${b.order > 1 ? "s" : ""} each atom has ${A.el === "H" || B.el === "H" ? "a noble gas configuration (H: duet, otherwise octet)" : "an octet"} → ${bn(b.order)}.`),
  };
}

/** Formel mit anderer Zahl an H am Zentralatom: NH₃ → NH₂ / NH₄ (Bindigkeit verzählt) */
function hydrideVariants(k: KnownMolecule): { f: string; n: number; X: string; right: number }[] {
  const c = composition(k.formula);
  const heavy = c.filter(([el]) => el !== "H");
  const h = c.find(([el]) => el === "H")?.[1] ?? 0;
  if (heavy.length !== 1 || heavy[0][1] !== 1 || !h) return [];
  const X = heavy[0][0];
  const make = (n: number) => (k.formula.startsWith("H") ? `H${n > 1 ? n : ""}${X}` : `${X}H${n > 1 ? n : ""}`);
  return [h - 1, h + 1, VALENCE[X]].filter((n, i, a) => n >= 1 && n !== h && a.indexOf(n) === i).map(n => ({ f: make(n), n, X, right: h }));
}

function formulaQ(os: boolean): Task {
  const k = pickFor(os, pool(os));
  const c = composition(k.formula);
  const element = c.length === 1 && c[0][1] === 2 ? c[0][0] : null;
  const wrong = [
    ...hydrideVariants(k).map(v => d(sub(v.f), v.n === VALENCE[v.X] ? "bindungen-valenz" : "bindungen-fehlend-verzaehlt",
      tr(`${elementName(v.X)} hat ${num(unpaired(v.X), "ungepaartes Elektron", "ungepaarte Elektronen")} → ${num(v.right, "Bindung", "Bindungen")} zu H: **${sub(k.formula)}**.`, `${elementName(v.X)} has ${num(unpaired(v.X), "unpaired electron", "unpaired electrons")} → ${num(v.right, "bond", "bonds")} to H: **${sub(k.formula)}**.`))),
    element ? d(element, "atom-statt-molekuel", tr(`${k.name} besteht aus Molekülen mit **2** Atomen: ${sub(k.formula)}.`, `${k.name} consists of molecules with **2** atoms: ${sub(k.formula)}.`)) : null,
    ...shuffle(pool(os).filter(x => x.id !== k.id)).slice(0, 5).map(x => sub(x.formula)),
  ];
  return {
    ...mc(sub(k.formula), wrong),
    prompt: tr(`Welche Formel hat **${k.name}**?`, `What is the formula of **${mid(k)}**?`),
    hint: tr("Überlege, wie viele Bindungen jedes Atom eingeht.", "Think about how many bonds each atom forms."),
    explain: `${k.name} = **${sub(k.formula)}**${gathered(k.formula) !== k.formula ? ` (${tr("Summenformel", "molecular formula")} ${sub(gathered(k.formula))})` : ""}.`,
  };
}

/** Gleiche Elemente zusammengefasst, Reihenfolge wie geschrieben: CH3OH → CH4O, C2H5OH → C2H6O, HCN bleibt HCN */
function gathered(f: string) {
  const count = new Map<string, number>();
  for (const [el, n] of composition(f)) count.set(el, (count.get(el) ?? 0) + n);
  return [...count].map(([el, n]) => el + (n > 1 ? n : "")).join("");
}

function nameQ(os: boolean): Task {
  const k = pickFor(os, pool(os));
  const els = (f: string) => composition(f).map(([el]) => el).sort().join();
  // Moleküle aus denselben Elementen zuerst (CH₄ ↔ C₂H₆, H₂O ↔ H₂O₂): genau zählen
  const alike = shuffle(pool(os).filter(x => x.id !== k.id && x.name !== k.name && els(x.formula) === els(k.formula)));
  return {
    ...mc(k.name, [
      ...alike.slice(0, 3).map(x => d(x.name, "name-verwechselt", tr(`${x.name} ist ${sub(x.formula)} – dieselben Elemente, aber andere Anzahl. ${sub(k.formula)} ist **${k.name}**.`, `${x.name} is ${sub(x.formula)} – the same elements but different numbers. ${sub(k.formula)} is **${mid(k)}**.`))),
      ...(composition(k.formula).length > 1 ? composition(k.formula).map(([el]) => elementName(el)).filter(n => n !== k.name).map(n =>
        d(n, "element-statt-molekuel", tr(`${n} ist nur ein Bestandteil. Das Molekül ${sub(k.formula)} heißt **${k.name}**.`, `${n} is only one component. The molecule ${sub(k.formula)} is called **${mid(k)}**.`))) : []),
      ...shuffle(pool(os).filter(x => x.id !== k.id)).slice(0, 5).map(x => x.name),
    ]),
    prompt: tr(`Wie heißt das Molekül **${sub(k.formula)}**?`, `What is the molecule **${sub(k.formula)}** called?`),
    hint: tr("Zähle die Atome genau: CH₄ und C₂H₆ haben dieselben Elemente, aber andere Namen.", "Count the atoms carefully: CH₄ and C₂H₆ have the same elements but different names."),
    explain: tr(`${sub(k.formula)} heißt **${k.name}**.`, `${sub(k.formula)} is called **${mid(k)}**.`),
  };
}

const GEOMS = (["linear", "gewinkelt", "trigonal-planar", "trigonal-pyramidal", "tetraedrisch"] as const).map(g => geo(g));
function geometry(): Task {
  const k = pick(KNOWN.filter(x => ["H2O", "NH3", "CH4", "CO2", "CCl4", "H2S", "PH3", "HCN", "CH2O", "CH3Cl"].includes(x.id)));
  const m = mols(k), c = centerOf(k), s = shapeAt(m, c.id)!;
  const noPairs = s.neighbors === 2 ? "linear" : s.neighbors === 3 ? "trigonal-planar" : "tetraedrisch";
  const hasMulti = m.bonds.some(b => (b.a === c.id || b.b === c.id) && b.order > 1);
  const G = geo(s.geometry);
  const pairsDe = (n: number) => num(n, "freies Paar", "freie Paare"), pairsEn = (n: number) => num(n, "lone pair", "lone pairs");
  const wrongs = [
    s.pairs > 0 && noPairs !== s.geometry ? d(geo(noPairs), "freie-paare-ignoriert", tr(`${c.el} hat ${num(s.pairs, "freies Elektronenpaar", "freie Elektronenpaare")}. ${s.pairs === 1 ? "Auch es nimmt Raum ein und drückt" : "Auch sie nehmen Raum ein und drücken"} die Bindungen weg → ${G}.`, `${c.el} has ${pairsEn(s.pairs)}. ${s.pairs === 1 ? "It takes up space too and pushes" : "They take up space too and push"} the bonds away → ${G}.`)) : null,
    s.pairs > 0 && s.neighbors + s.pairs === 4 ? d(geo("tetraedrisch"), "elektronen-statt-atome", tr(`Die 4 Bereiche zeigen zwar in die Ecken eines Tetraeders – die Form beschreibt aber nur die **Atome**: ${s.neighbors} Bindungspartner + ${pairsDe(s.pairs)} → ${G}.`, `The 4 regions do point to the corners of a tetrahedron – but the shape only describes the **atoms**: ${s.neighbors} bonding partners + ${pairsEn(s.pairs)} → ${G}.`)) : null,
    s.pairs === 0 && s.neighbors === 2 ? d(geo("gewinkelt"), "aussen-paare-gezaehlt", tr(`Nur das Zentralatom ${c.el} zählt – und es hat kein freies Paar. Die freien Paare der Außenatome ändern die Form nicht → linear.`, `Only the central atom ${c.el} counts – and it has no lone pair. The lone pairs of the outer atoms do not change the shape → linear.`)) : null,
    hasMulti && s.geometry !== "tetraedrisch" ? d(geo("tetraedrisch"), "mehrfachbindung-doppelt-gezaehlt", tr(`Eine Mehrfachbindung zählt wie **ein** Bereich. ${c.el} hat ${s.neighbors + s.pairs} Bereiche → ${G}.`, `A multiple bond counts as **one** region. ${c.el} has ${s.neighbors + s.pairs} regions → ${G}.`)) : null,
    ...GEOMS,
  ];
  return {
    ...mc(G, wrongs),
    prompt: tr(`Welche **Molekülform** hat **${k.name}** (${sub(k.formula)})?`, `What is the **molecular shape** of **${mid(k)}** (${sub(k.formula)})?`),
    hint: tr("EPA-Modell: Zähle die Bereiche am Zentralatom – jede Bindung (auch eine Mehrfachbindung) und jedes freie Paar ist einer.", "VSEPR model: count the regions on the central atom – each bond (a multiple bond too) and each lone pair is one."),
    explain: tr(`Zentralatom ${centerOf(k).el}: ${s.neighbors} Bindungspartner + ${s.pairs === 1 ? "1 freies Paar" : `${s.pairs} freie Paare`} = ${s.neighbors + s.pairs} Bereiche → **${G}** (Winkel ${s.angle}).`, `Central atom ${centerOf(k).el}: ${s.neighbors} bonding partners + ${pairsEn(s.pairs)} = ${s.neighbors + s.pairs} regions → **${G}** (angle ${s.angle}).`),
  };
}

function angle(): Task {
  const k = pick(KNOWN.filter(x => ["H2O", "NH3", "CH4", "CO2", "CH2O", "HCN"].includes(x.id)));
  const m = mols(k), c = centerOf(k), s = shapeAt(m, c.id)!;
  // trigonal-planar mit verschiedenen Partnern (Methanal): „ca. 120°“ statt genau 120°
  const opts = ["180°", "120°", "109,5°", "107°", "104,5°"].map(dec).map(o => (o === "120°" && s.geometry === "trigonal-planar" ? s.angle : o));
  const noPairs = s.neighbors === 2 ? "180°" : s.neighbors === 3 ? "120°" : dec("109,5°");
  const hasMulti = m.bonds.some(b => (b.a === c.id || b.b === c.id) && b.order > 1);
  const wrongs = [
    s.pairs > 0 ? d(dec("109,5°"), "stauchung-ignoriert", tr(`109,5° gilt für 4 Bindungen ohne freie Paare. ${s.pairs === 1 ? "Das freie Paar drückt" : `Die ${s.pairs} freien Paare drücken`} stärker → etwas kleiner: ${s.angle}.`, `109.5° applies to 4 bonds without lone pairs. ${s.pairs === 1 ? "The lone pair pushes" : `The ${s.pairs} lone pairs push`} harder → slightly smaller: ${s.angle}.`)) : null,
    s.pairs > 0 ? d(noPairs, "freie-paare-ignoriert", tr(`${c.el} hat ${num(s.pairs, "freies Elektronenpaar, das", "freie Elektronenpaare, die")} ${s.pairs === 1 ? "mitzählt" : "mitzählen"}: ${s.neighbors + s.pairs} Bereiche → Tetraederwinkel, durch die freien Paare leicht gedrückt: ${s.angle}.`, `${c.el} has ${num(s.pairs, "lone pair, which counts", "lone pairs, which count")} too: ${s.neighbors + s.pairs} regions → tetrahedral angle, slightly squeezed by the lone pairs: ${s.angle}.`)) : null,
    s.geometry === "tetraedrisch" ? d("90°", "wuerfel-statt-tetraeder", tr("90° wäre die Zeichnung auf dem Papier. Im Raum weichen die 4 Bindungen so weit wie möglich aus → Tetraeder, 109,5°.", "90° would be the drawing on paper. In space the 4 bonds spread as far apart as possible → tetrahedron, 109.5°.")) : null,
    hasMulti ? d(dec("109,5°"), "mehrfachbindung-doppelt-gezaehlt", tr(`Eine Mehrfachbindung zählt wie **ein** Bereich: ${c.el} hat ${s.neighbors + s.pairs} Bereiche → ${s.angle}.`, `A multiple bond counts as **one** region: ${c.el} has ${s.neighbors + s.pairs} regions → ${s.angle}.`)) : null,
    s.pairs === 0 && s.neighbors === 2 ? d(dec("104,5°"), "aussen-paare-gezaehlt", tr(`Die freien Paare sitzen an den Außenatomen, nicht am Zentralatom ${c.el} → gestreckt, 180°.`, `The lone pairs sit on the outer atoms, not on the central atom ${c.el} → straight, 180°.`)) : null,
    ...opts,
  ];
  return {
    ...mc(s.angle, wrongs),
    prompt: tr(`Welchen **Bindungswinkel** hat **${k.name}** (${sub(k.formula)})?`, `What is the **bond angle** in **${mid(k)}** (${sub(k.formula)})?`),
    hint: tr("Tetraeder 109,5°. Freie Elektronenpaare nehmen mehr Raum ein und drücken die Bindungen etwas zusammen.", "Tetrahedron 109.5°. Lone pairs take up more space and push the bonds a little closer together."),
    explain: tr(`${k.name} ist ${geo(s.geometry)} → **${s.angle}**.${s.pairs ? " Freie Elektronenpaare stoßen stärker ab als bindende Paare." : ""}`, `${k.name} is ${geo(s.geometry)} → **${s.angle}**.${s.pairs ? " Lone pairs repel more strongly than bonding pairs." : ""}`),
  };
}

function polar(): Task {
  const k = pick(KNOWN.filter(x => ["H2O", "NH3", "CH4", "CO2", "CCl4", "HCl", "Cl2", "CH3Cl", "HF", "O2"].includes(x.id)));
  const p = isPolar(mols(k));
  const hasPolarBonds = polarBonds(mols(k)).length > 0;
  const POL = "polar", UNP = tr("unpolar", "non-polar"), ION = tr("ionisch", "ionic");
  const right = p ? POL : UNP;
  const m = mols(k), delta = Math.max(0, ...polarBonds(m).map(b => b.delta));
  const wrongs = [
    p
      ? (m.atoms.length > 2
        ? (new Set(m.atoms.filter(a => a.id !== centerOf(k).id).map(a => a.el)).size > 1
          // gleiche Form wie ein symmetrisches Molekül (Tetraeder), aber verschiedene Bindungspartner
          ? d(UNP, "partner-ungleich", tr(`${k.name} ist zwar ${geo(shapeAt(m, centerOf(k).id)!.geometry)}, aber die Partner sind verschieden: Nur ${polarBonds(m).map(b => `${m.atoms.find(a => a.id === b.plus)!.el}–${m.atoms.find(a => a.id === b.minus)!.el}`).filter((x, i, a) => a.indexOf(x) === i).join(", ")} ist polar. Die Teilladungen heben sich nicht auf → Dipol.`, `${k.name} is ${geo(shapeAt(m, centerOf(k).id)!.geometry)}, but the partners differ: only ${polarBonds(m).map(b => `${m.atoms.find(a => a.id === b.plus)!.el}–${m.atoms.find(a => a.id === b.minus)!.el}`).filter((x, i, a) => a.indexOf(x) === i).join(", ")} is polar. The partial charges do not cancel → dipole.`))
          : d(UNP, "form-uebersehen", tr(`${k.name} ist ${geo(shapeAt(m, centerOf(k).id)!.geometry)}, nicht symmetrisch: Die Teilladungen heben sich nicht auf → Dipol.`, `${k.name} is ${geo(shapeAt(m, centerOf(k).id)!.geometry)}, not symmetrical: the partial charges do not cancel → dipole.`)))
        : d(UNP, "en-uebersehen", tr(`ΔEN = ${delta.toFixed(2).replace(".", ",")} ≥ 0,4: Das elektronegativere Atom zieht die Elektronen zu sich → polare Bindung = polares Molekül (nur 2 Atome).`, `ΔEN = ${delta.toFixed(2)} ≥ 0.4: the more electronegative atom pulls the electrons towards itself → polar bond = polar molecule (only 2 atoms).`)))
      : (hasPolarBonds
        ? d(POL, "polare-bindung-polares-molekuel", tr(`Die Bindungen sind polar, aber ${k.name} ist symmetrisch gebaut: Die Teilladungen heben sich gegenseitig auf → kein Dipol.`, `The bonds are polar, but ${mid(k)} is symmetrical: the partial charges cancel each other → no dipole.`))
        : k.id === "CH4"
          ? d(POL, "polare-bindung-polares-molekuel", tr("C–H ist mit ΔEN 0,35 kaum polar, und Methan ist symmetrisch (Tetraeder) → unpolar.", "C–H is hardly polar with ΔEN 0.35, and methane is symmetrical (tetrahedron) → non-polar."))
          : d(POL, "gleiche-en-polar", tr(`Beide Atome sind gleich elektronegativ (ΔEN = 0): Keines zieht stärker → keine Teilladungen.`, `Both atoms are equally electronegative (ΔEN = 0): neither pulls harder → no partial charges.`))),
    d(ION, "ionisch-statt-polar", tr(`${k.name} besteht aus Nichtmetall-Atomen, die Elektronenpaare **teilen**. Ionen entstehen erst, wenn ein Metall Elektronen ganz abgibt.`, `${k.name} consists of non-metal atoms that **share** electron pairs. Ions only form when a metal gives up electrons completely.`)),
    POL, UNP,
  ];
  return {
    ...mc(right, wrongs),
    prompt: tr(`Ist das Molekül **${k.name}** (${sub(k.formula)}) polar oder unpolar?`, `Is the molecule **${mid(k)}** (${sub(k.formula)}) polar or non-polar?`),
    hint: tr("1. Gibt es polare Bindungen (ΔEN ≥ 0,4)? 2. Heben sich die Teilladungen durch den symmetrischen Bau auf?", "1. Are there polar bonds (ΔEN ≥ 0.4)? 2. Do the partial charges cancel because of a symmetrical shape?"),
    explain: p
      ? (m.bonds.length === 1
        ? tr(`${k.name} hat eine polare Bindung (ΔEN ${dec(delta.toFixed(2))}) → **polar** (Dipol).`, `${k.name} has a polar bond (ΔEN ${delta.toFixed(2)}) → **polar** (dipole).`)
        : tr(`${k.name} hat polare Bindungen, und die Teilladungen heben sich nicht auf → **polar** (Dipol).`, `${k.name} has polar bonds, and the partial charges do not cancel → **polar** (dipole).`))
      : tr(`${k.name}: ${hasPolarBonds ? "Die Bindungen sind zwar polar, aber der symmetrische Bau hebt die Teilladungen auf"
        : k.id === "CH4" ? "Die C–H-Bindungen sind kaum polar (ΔEN 0,35), und der Bau ist symmetrisch"
        : "Keine polaren Bindungen (gleiche oder fast gleiche Elektronegativität)"} → **unpolar**.`,
        `${k.name}: ${hasPolarBonds ? "the bonds are polar, but the symmetrical shape cancels the partial charges"
        : k.id === "CH4" ? "the C–H bonds are hardly polar (ΔEN 0.35), and the shape is symmetrical"
        : "no polar bonds (equal or almost equal electronegativity)"} → **non-polar**.`),
  };
}

const POLAR_BONDS: [string, string][] = [["H", "F"], ["H", "Cl"], ["C", "H"], ["O", "H"], ["N", "H"], ["C", "O"], ["C", "Cl"], ["H", "Br"], ["H", "I"]];
function strongest(): Task {
  const set = shuffle(POLAR_BONDS).slice(0, 4);
  const dEN = (b: [string, string]) => Math.abs(en(b[0]) - en(b[1]));
  const best = [...set].sort((p, q) => dEN(q) - dEN(p))[0];
  const lbl = (b: [string, string]) => `${b[0]}–${b[1]}`;
  const top = [...set].sort((p, q) => Math.max(en(q[0]), en(q[1])) - Math.max(en(p[0]), en(p[1])))[0];
  const wrongs = [
    top !== best ? d(lbl(top), "en-statt-differenz", tr(`${lbl(top)} hat zwar das elektronegativste Atom, aber es kommt auf den **Unterschied** an: ΔEN ${dec(dEN(top).toFixed(2))} < ${dec(dEN(best).toFixed(2))} bei ${lbl(best)}.`, `${lbl(top)} does have the most electronegative atom, but the **difference** is what matters: ΔEN ${dec(dEN(top).toFixed(2))} < ${dec(dEN(best).toFixed(2))} for ${lbl(best)}.`)) : null,
    ...set.map(lbl),
  ];
  return {
    ...mc(lbl(best), wrongs),
    prompt: tr("Welche dieser Bindungen ist **am stärksten polar**?", "Which of these bonds is **the most polar**?"),
    hint: tr("Vergleiche die Elektronegativitäts-Differenz ΔEN der beiden Atome.", "Compare the electronegativity difference ΔEN of the two atoms."),
    explain: set.map(b => `${lbl(b)}: ΔEN ${dec(dEN(b).toFixed(2))}`).join(" · ") + ` → **${lbl(best)}**.`,
  };
}

// ── Level ────────────────────────────────────────────────────────────────────

const GENS = (os: boolean): Record<string, () => Task> => ({
  bindigkeit, around: () => around(os), lonePairs: () => lonePairs(os), build: () => build(os), bondType: () => bondType(os),
  formula: () => formulaQ(os), name: () => nameQ(os), geometry, angle, polar, strongest,
});

export const TYPE_NAMES: Record<string, string> = tr({
  bindigkeit: "Anzahl der Bindungen", around: "Oktett und Duett", lonePairs: "Freie Elektronenpaare", build: "Moleküle bauen",
  bondType: "Mehrfachbindungen", formula: "Formeln", name: "Namen", geometry: "Molekülform", angle: "Bindungswinkel",
  polar: "Polarität", strongest: "Polare Bindungen",
}, {
  bindigkeit: "Number of bonds", around: "Octet and duet", lonePairs: "Lone pairs", build: "Building molecules",
  bondType: "Multiple bonds", formula: "Formulas", name: "Names", geometry: "Molecular shape", angle: "Bond angles",
  polar: "Polarity", strongest: "Polar bonds",
});

interface Level extends QuizLevel { types: string[] }
export const LEVELS: Record<Stufe, Level[]> = {
  us: [
    { id: "us-1", name: tr("Elektronenpaare & Oktett", "Electron pairs & octet"), desc: tr("Wie viele Bindungen? Wie viele freie Paare?", "How many bonds? How many lone pairs?"), types: ["bindigkeit", "around", "lonePairs"] },
    { id: "us-2", name: tr("Moleküle bauen", "Building molecules"), desc: tr("Einfach-, Zweifach- und Dreifachbindungen", "Single, double and triple bonds"), types: ["build", "bondType", "bindigkeit"] },
    { id: "us-3", name: tr("Namen & Formeln", "Names & formulas"), desc: tr("Wasser, Ammoniak, Methan & Co.", "Water, ammonia, methane & co."), types: ["name", "formula", "build"] },
  ],
  os: [
    { id: "os-1", name: tr("Moleküle bauen", "Building molecules"), desc: tr("Auch Ethen, Ethin, Methanol, Blausäure …", "Also ethene, ethyne, methanol, hydrogen cyanide …"), types: ["build", "bondType", "lonePairs"] },
    { id: "os-2", name: tr("Molekülform", "Molecular shape"), desc: tr("EPA-Modell: Form und Bindungswinkel", "VSEPR model: shape and bond angles"), types: ["geometry", "angle", "lonePairs"] },
    { id: "os-3", name: tr("Polarität", "Polarity"), desc: tr("Elektronegativität, Teilladungen, Dipole", "Electronegativity, partial charges, dipoles"), types: ["polar", "strongest", "geometry"] },
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

export { KNOWN_BY_ID };
