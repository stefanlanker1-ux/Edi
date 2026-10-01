// Quiz-Aufgaben zur Elektronenpaarbindung (reine Daten).

import {
  KNOWN, KNOWN_BY_ID, toMolecule, electronsOf, shapeAt, isPolar, polarBonds, bondName, elementName, VALENCE, en, composition, type KnownMolecule,
} from "@lern/chem";
import { buildRound, mc, d, pick, shuffle, weakTypes, type BaseTask, type LevelKey, type McTask, type QuizLevel, type Trap, type TypeStats } from "@lern/quiz";
import type { Stufe } from "../store.ts";

export type Task = McTask | (BaseTask & { kind: "build"; molecule: string; elements: string[] });

const sub = (f: string) => f.replace(/\d/g, x => "₀₁₂₃₄₅₆₇₈₉"[Number(x)]);
const num = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
/** ungepaarte Elektronen im Lewis-Symbol (H: 1; sonst bis 4 einzeln, darüber 8 − V) */
const unpaired = (el: string) => (el === "H" ? 1 : VALENCE[el] <= 4 ? VALENCE[el] : 8 - VALENCE[el]);
const goal = (el: string) => (el === "H" ? "Duett (2)" : "Oktett (8)");
const pool = (os: boolean) => KNOWN.filter(k => os || !k.os);
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
    V !== n ? d(String(V), "bindungen-valenz", `${V} ist die Zahl der Außenelektronen. Bindungen gehen nur die **ungepaarten** ein: bis zum ${goal(el)} ${n === 1 ? "fehlt 1" : `fehlen ${n}`}.`) : null,
    el !== "H" && n < 4 ? d(String(n + 1), "bindungen-fehlend-verzaehlt", `${elementName(el)} hat ${V} Außenelektronen: ${V - n} davon sind schon gepaart, nur ${n === 1 ? "1 ist" : `${n} sind`} ungepaart.`) : null,
    el === "H" ? d("4", "h-oktett", "Wasserstoff hat nur 1 Elektron und Platz für 2 (Duett, wie Helium) – es fehlt genau 1 → **1** Bindung.") : null,
    el === "C" ? d("2", "bindungen-fehlend-verzaehlt", "Kohlenstoff hat 4 Außenelektronen, und alle 4 sind ungepaart – bis zum Oktett fehlen **4**, also 4 Bindungen.") : null,
    "1", "2", "3", "4",
  ];
  return {
    ...mc(String(n), wrongs),
    prompt: `Wie viele Elektronenpaarbindungen geht ein **${elementName(el)}**-Atom (${el}) normalerweise ein?`,
    hint: "Zähle die ungepaarten Elektronen im Lewis-Symbol – jedes kann eine Bindung eingehen.",
    explain: `${elementName(el)} hat ${VALENCE[el] === 1 ? "1 Außenelektron" : `${VALENCE[el]} Außenelektronen`}. ${el === "H" ? "Bis zum Duett (2 Elektronen) fehlt 1" : n === 1 ? "Bis zum Oktett fehlt 1" : `Bis zum Oktett fehlen ${n}`} → **${n}** Bindung${n > 1 ? "en" : ""}.`,
  };
}

function around(os: boolean): Task {
  const k = pick(pool(os).filter(x => x.atoms.length > 2));
  const m = mols(k);
  const a = pick(m.atoms);
  const t = a.el === "H" ? 2 : 8;
  const e = electronsOf(m, a.id), V = VALENCE[a.el];
  const wrongs = a.el === "H"
    ? [d("8", "h-oktett", "Wasserstoff hat nur die erste Schale – die ist mit **2** Elektronen voll (wie bei Helium).")]
    : [
      V !== 8 ? d(String(V), "nur-valenz-gezaehlt", `${V} sind nur die eigenen Außenelektronen. Jede Bindung bringt ein Elektron des Partners dazu: ${e.lone} freie + ${2 * e.bonds} in ${num(e.bonds, "Bindung", "Bindungen")} = 8.`) : null,
      2 * e.bonds !== 8 ? d(String(2 * e.bonds), "nur-bindungen-gezaehlt", `${2 * e.bonds} sind nur die Elektronen in den Bindungen. Dazu kommen ${e.lone} freie → 8.`) : null,
    ];
  return {
    ...mc(String(t), [...wrongs, "2", "4", "6", "8"]),
    prompt: `Wie viele Elektronen umgeben ein **${elementName(a.el)}**-Atom im Molekül **${k.name}** (${sub(k.formula)})?`,
    hint: "Zähle die freien Elektronen und die Elektronen der Bindungen zusammen.",
    explain: `Im fertigen Molekül hat jedes Atom Edelgaskonfiguration: ${a.el === "H" ? "Wasserstoff 2 Elektronen (Duett, wie Helium)" : "8 Elektronen (Oktett)"} → **${t}**.`,
  };
}

function lonePairs(os: boolean): Task {
  const k = pickFor(os, pool(os).filter(x => mols(x).atoms.some(a => a.el !== "H" && a.el !== "C")));
  const m = mols(k);
  const a = pick(m.atoms.filter(x => x.el !== "H" && x.el !== "C"));
  const e = electronsOf(m, a.id), p = e.pairs, V = VALENCE[a.el];
  const wrongs = [
    Math.floor(V / 2) !== p ? d(String(Math.floor(V / 2)), "valenz-als-paare", `Nicht alle ${V} Außenelektronen sind frei: ${e.bonds} stecken in Bindungen. Frei bleiben ${e.lone} → ${num(p, "Paar", "Paare")}.`) : null,
    e.bonds !== p ? d(String(e.bonds), "bindungen-statt-paare", `${e.bonds} ist die Zahl der Bindungen. Gefragt sind die **freien** Paare: ${V} − ${e.bonds} = ${e.lone} Elektronen = ${num(p, "Paar", "Paare")}.`) : null,
    p > 0 ? d(String(e.lone), "elektronen-statt-paare", `${e.lone} freie Elektronen, aber je zwei bilden ein Paar → ${num(p, "Paar", "Paare")}.`) : null,
    "0", "1", "2", "3",
  ];
  return {
    ...mc(String(p), wrongs),
    prompt: `Wie viele **freie Elektronenpaare** hat ein ${elementName(a.el)}-Atom im Molekül **${k.name}** (${sub(k.formula)})?`,
    hint: "Außenelektronen minus Elektronen, die in Bindungen stecken – der Rest bildet Paare.",
    explain: `${elementName(a.el)} hat ${VALENCE[a.el]} Außenelektronen, davon ${electronsOf(m, a.id).bonds} in Bindungen. Übrig: ${electronsOf(m, a.id).lone} → **${p}** freie${p === 1 ? "s" : ""} Paar${p === 1 ? "" : "e"}.`,
  };
}

/** „1 Doppelbindung und 2 Einfachbindungen“ */
function bondList(k: KnownMolecule) {
  const by = [3, 2, 1].map(o => [o, mols(k).bonds.filter(b => b.order === o).length] as const).filter(([, c]) => c > 0);
  const parts = by.map(([o, c]) => `${c} ${bondName(o)}${c > 1 ? "en" : ""}`);
  return parts.length > 1 ? parts.slice(0, -1).join(", ") + " und " + parts[parts.length - 1] : parts[0];
}

function build(os: boolean): Task {
  const k = pick(pool(os).filter(x => x.atoms.length <= (os ? 9 : 5)));
  const elements = [...new Set(k.atoms.map(a => a[0]))];
  const multi = k.bonds.filter(b => b[2] > 1).length;
  // Fallen: QuizView meldet atomsOff (Atomzahl stimmt nicht), multi (Mehrfachbindungen gesetzt), complete (alle Oktette voll)
  const traps: Trap[] = [
    { field: "atomsOff", value: 1, miss: "atomzahl-falsch", why: `${k.name} ist ${sub(k.formula)}: ${num(k.atoms.length, "Atom", "Atome")}. Zähle die Atome in der Formel.` },
    ...(multi ? [{ field: "multi", value: 0, miss: "mehrfachbindung-uebersehen", why: `${k.name} braucht ${bondList(k)}. Tipp aufs Bindungs-Oval macht aus einer Einfach- eine Doppelbindung.` }] : []),
    { field: "complete", value: 0, miss: "oktett-offen", why: "Ein Atom hat noch nicht 8 Elektronen (H: 2) – der rote Kreis zeigt es. Fertig ist ein Molekül erst, wenn alle Kreise ✓ sind." },
  ];
  return {
    kind: "build", molecule: k.id, elements, traps,
    prompt: `Baue das Molekül **${k.name}** (${sub(k.formula)}).`,
    hint: "Im fertigen Molekül hat jedes Atom 8 Elektronen um sich (H: 2). Mehrfachbindung: Bindungs-Oval antippen.",
    explain: `${k.name}: ${bondList(k)} – alle Atome haben Edelgaskonfiguration.`,
  };
}

function bondType(os: boolean): Task {
  const k = pick(pool(os).filter(x => ["O2", "N2", "CO2", "Cl2", "H2", "C2H4", "C2H2", "HCN", "CH2O", "F2"].includes(x.id)));
  const m = mols(k);
  const b = [...m.bonds].sort((p, q) => q.order - p.order)[0];
  const A = m.atoms.find(a => a.id === b.a)!, B = m.atoms.find(a => a.id === b.b)!;
  const pair = A.el === B.el ? `den beiden ${elementName(A.el)}-Atomen` : `dem ${A.el}- und dem ${B.el}-Atom`;
  const X = A.el === "H" ? B : A, around = electronsOf(m, X.id).around, g = goal(X.el);
  const less = (o: number) => d(bondName(o), "mehrfachbindung-uebersehen",
    `Mit ${o === 1 ? "nur einem gemeinsamen Paar" : "zwei gemeinsamen Paaren"} hätte ${X.el} erst ${around - 2 * (b.order - o)} Elektronen. Erst ${b.order} gemeinsame Paare bringen beide aufs ${g}.`);
  const more = (o: number) => d(bondName(o), "oktett-ueberschritten",
    `${X.el} hat ${num(VALENCE[X.el], "Außenelektron", "Außenelektronen")}, davon ${num(unpaired(X.el), "ungepaartes", "ungepaarte")}. Mit ${o} Paaren hätte es ${around + 2 * (o - b.order)} Elektronen – mehr als ein ${g.split(" ")[0]}.`);
  const wrongs = [1, 2, 3].filter(o => o !== b.order).map(o => (o < b.order ? less(o) : more(o)));
  return {
    ...mc(bondName(b.order), wrongs),
    prompt: `Welche Bindung liegt im Molekül **${k.name}** (${sub(k.formula)}) zwischen ${pair} vor?`,
    hint: "Wie viele ungepaarte Elektronen hat jedes Atom? So viele Paare teilen die beiden.",
    explain: `Mit **${b.order}** gemeinsamen Elektronenpaar${b.order > 1 ? "en" : ""} hat jedes Atom ${A.el === "H" || B.el === "H" ? "Edelgaskonfiguration (H: Duett, sonst Oktett)" : "ein Oktett"} → ${bondName(b.order)}.`,
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
      `${elementName(v.X)} hat ${num(unpaired(v.X), "ungepaartes Elektron", "ungepaarte Elektronen")} → ${num(v.right, "Bindung", "Bindungen")} zu H: **${sub(k.formula)}**.`)),
    element ? d(element, "atom-statt-molekuel", `${k.name} besteht aus Molekülen mit **2** Atomen: ${sub(k.formula)}.`) : null,
    ...shuffle(pool(os).filter(x => x.id !== k.id)).slice(0, 5).map(x => sub(x.formula)),
  ];
  return {
    ...mc(sub(k.formula), wrong),
    prompt: `Welche Formel hat **${k.name}**?`,
    hint: "Überlege, wie viele Bindungen jedes Atom eingeht.",
    explain: `${k.name} = **${sub(k.formula)}**${gathered(k.formula) !== k.formula ? ` (Summenformel ${sub(gathered(k.formula))})` : ""}.`,
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
  const alike = shuffle(pool(true).filter(x => x.id !== k.id && x.name !== k.name && els(x.formula) === els(k.formula)));
  return {
    ...mc(k.name, [
      ...alike.slice(0, 3).map(x => d(x.name, "name-verwechselt", `${x.name} ist ${sub(x.formula)} – dieselben Elemente, aber andere Anzahl. ${sub(k.formula)} ist **${k.name}**.`)),
      ...(composition(k.formula).length > 1 ? composition(k.formula).map(([el]) => elementName(el)).filter(n => n !== k.name).map(n =>
        d(n, "element-statt-molekuel", `${n} ist nur ein Bestandteil. Das Molekül ${sub(k.formula)} heißt **${k.name}**.`)) : []),
      ...shuffle(pool(os).filter(x => x.id !== k.id)).slice(0, 5).map(x => x.name),
    ]),
    prompt: `Wie heißt das Molekül **${sub(k.formula)}**?`,
    hint: "Zähle die Atome genau: CH₄ und C₂H₆ haben dieselben Elemente, aber andere Namen.",
    explain: `${sub(k.formula)} heißt **${k.name}**.`,
  };
}

const GEOMS = ["linear", "gewinkelt", "trigonal-planar", "trigonal-pyramidal", "tetraedrisch"];
function geometry(): Task {
  const k = pick(KNOWN.filter(x => ["H2O", "NH3", "CH4", "CO2", "CCl4", "H2S", "PH3", "HCN", "CH2O", "CH3Cl"].includes(x.id)));
  const m = mols(k), c = centerOf(k), s = shapeAt(m, c.id)!;
  const noPairs = s.neighbors === 2 ? "linear" : s.neighbors === 3 ? "trigonal-planar" : "tetraedrisch";
  const hasMulti = m.bonds.some(b => (b.a === c.id || b.b === c.id) && b.order > 1);
  const wrongs = [
    s.pairs > 0 && noPairs !== s.geometry ? d(noPairs, "freie-paare-ignoriert", `${c.el} hat ${num(s.pairs, "freies Elektronenpaar", "freie Elektronenpaare")}. Auch sie brauchen Platz und drücken die Bindungen weg → ${s.geometry}.`) : null,
    s.pairs > 0 && s.neighbors + s.pairs === 4 ? d("tetraedrisch", "elektronen-statt-atome", `Die 4 Elektronenpaare zeigen zwar in die Ecken eines Tetraeders – die Form beschreibt aber nur die **Atome**: ${s.neighbors} Partner + ${num(s.pairs, "freies Paar", "freie Paare")} → ${s.geometry}.`) : null,
    s.pairs === 0 && s.neighbors === 2 ? d("gewinkelt", "aussen-paare-gezaehlt", `Nur das Zentralatom ${c.el} zählt – und es hat kein freies Paar. Die freien Paare der Außenatome ändern die Form nicht → linear.`) : null,
    hasMulti && s.geometry !== "tetraedrisch" ? d("tetraedrisch", "mehrfachbindung-doppelt-gezaehlt", `Eine Mehrfachbindung zählt wie **ein** Partner. ${c.el} hat ${s.neighbors} Partner${s.pairs ? ` + ${num(s.pairs, "freies Paar", "freie Paare")}` : ""} → ${s.geometry}.`) : null,
    ...GEOMS,
  ];
  return {
    ...mc(s.geometry, wrongs),
    prompt: `Welche **Molekülgeometrie** hat **${k.name}** (${sub(k.formula)})?`,
    hint: "EPA-Modell: Bindungspartner und freie Elektronenpaare am Zentralatom stoßen sich ab. Mehrfachbindungen zählen wie eine.",
    explain: `Zentralatom ${centerOf(k).el}: ${s.neighbors} Bindungspartner + ${s.pairs === 1 ? "1 freies Paar" : `${s.pairs} freie Paare`} → **${s.geometry}** (Winkel ${s.angle}).`,
  };
}

function angle(): Task {
  const k = pick(KNOWN.filter(x => ["H2O", "NH3", "CH4", "CO2", "CH2O", "HCN"].includes(x.id)));
  const m = mols(k), c = centerOf(k), s = shapeAt(m, c.id)!;
  const opts = ["180°", "120°", "109,5°", "107°", "104,5°"];
  const noPairs = s.neighbors === 2 ? "180°" : s.neighbors === 3 ? "120°" : "109,5°";
  const hasMulti = m.bonds.some(b => (b.a === c.id || b.b === c.id) && b.order > 1);
  const wrongs = [
    s.pairs > 0 ? d("109,5°", "stauchung-ignoriert", `109,5° gilt für 4 Bindungen ohne freie Paare. ${s.pairs === 1 ? "Das freie Paar drückt" : `Die ${s.pairs} freien Paare drücken`} stärker → etwas kleiner: ${s.angle}.`) : null,
    s.pairs > 0 ? d(noPairs, "freie-paare-ignoriert", `${c.el} hat ${num(s.pairs, "freies Elektronenpaar", "freie Elektronenpaare")}, das mitzählt: ${s.neighbors + s.pairs} Richtungen → Tetraeder-Winkel, durch die freien Paare leicht gedrückt: ${s.angle}.`) : null,
    s.geometry === "tetraedrisch" ? d("90°", "wuerfel-statt-tetraeder", "90° wäre die Zeichnung auf dem Papier. Im Raum weichen die 4 Bindungen so weit wie möglich aus → Tetraeder, 109,5°.") : null,
    hasMulti ? d("109,5°", "mehrfachbindung-doppelt-gezaehlt", `Eine Mehrfachbindung zählt wie **ein** Partner: ${c.el} hat ${s.neighbors} Richtungen → ${s.angle}.`) : null,
    s.pairs === 0 && s.neighbors === 2 ? d("104,5°", "aussen-paare-gezaehlt", `Die freien Paare sitzen an den Außenatomen, nicht am Zentralatom ${c.el} → gestreckt, 180°.`) : null,
    ...opts,
  ];
  return {
    ...mc(s.angle, wrongs),
    prompt: `Welchen **Bindungswinkel** hat **${k.name}** (${sub(k.formula)})?`,
    hint: "Tetraeder 109,5°. Freie Elektronenpaare brauchen mehr Platz und drücken die Bindungen etwas zusammen.",
    explain: `${k.name} ist ${s.geometry} → **${s.angle}**.${s.pairs ? " Die freien Elektronenpaare stoßen stärker ab als bindende Paare." : ""}`,
  };
}

function polar(): Task {
  const k = pick(KNOWN.filter(x => ["H2O", "NH3", "CH4", "CO2", "CCl4", "HCl", "Cl2", "CH3Cl", "HF", "O2"].includes(x.id)));
  const p = isPolar(mols(k));
  const hasPolarBonds = polarBonds(mols(k)).length > 0;
  const right = p ? "polar" : "unpolar";
  const m = mols(k), delta = Math.max(0, ...polarBonds(m).map(b => b.delta));
  const wrongs = [
    p
      ? (m.atoms.length > 2
        ? d("unpolar", "form-uebersehen", `${k.name} ist ${shapeAt(m, centerOf(k).id)!.geometry}, nicht symmetrisch: Die Teilladungen heben sich nicht auf → Dipol.`)
        : d("unpolar", "en-uebersehen", `ΔEN = ${delta.toFixed(2).replace(".", ",")} ≥ 0,4: Das elektronegativere Atom zieht die Elektronen zu sich → polare Bindung = polares Molekül (nur 2 Atome).`))
      : (hasPolarBonds
        ? d("polar", "polare-bindung-polares-molekuel", `Die Bindungen sind polar, aber ${k.name} ist symmetrisch gebaut: Die Teilladungen heben sich gegenseitig auf → kein Dipol.`)
        : k.id === "CH4"
          ? d("polar", "polare-bindung-polares-molekuel", "C–H ist mit ΔEN 0,35 kaum polar, und Methan ist symmetrisch (Tetraeder) → unpolar.")
          : d("polar", "gleiche-en-polar", `Beide Atome sind gleich elektronegativ (ΔEN = 0): Keines zieht stärker → keine Teilladungen.`)),
    d("ionisch", "ionisch-statt-polar", `${k.name} besteht aus Nichtmetall-Atomen, die Elektronenpaare **teilen**. Ionen entstehen erst, wenn ein Metall Elektronen ganz abgibt.`),
    "polar", "unpolar",
  ];
  return {
    ...mc(right, wrongs),
    prompt: `Ist das Molekül **${k.name}** (${sub(k.formula)}) polar oder unpolar?`,
    hint: "1. Gibt es polare Bindungen (ΔEN ≥ 0,4)? 2. Heben sich die Teilladungen durch den symmetrischen Bau auf?",
    explain: p
      ? `${k.name} hat polare Bindungen, und die Teilladungen heben sich nicht auf → **polar** (Dipol).`
      : `${k.name}: ${hasPolarBonds ? "Die Bindungen sind zwar polar, aber der symmetrische Bau hebt die Teilladungen auf"
        : k.id === "CH4" ? "Die C–H-Bindungen sind kaum polar (ΔEN 0,35), und der Bau ist symmetrisch"
        : "Keine polaren Bindungen (gleiche oder fast gleiche Elektronegativität)"} → **unpolar**.`,
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
    top !== best ? d(lbl(top), "en-statt-differenz", `${lbl(top)} hat zwar das elektronegativste Atom, aber es kommt auf den **Unterschied** an: ΔEN ${dEN(top).toFixed(2).replace(".", ",")} < ${dEN(best).toFixed(2).replace(".", ",")} bei ${lbl(best)}.`) : null,
    ...set.map(lbl),
  ];
  return {
    ...mc(lbl(best), wrongs),
    prompt: "Welche dieser Bindungen ist **am stärksten polar**?",
    hint: "Vergleiche die Elektronegativitäts-Differenz ΔEN der beiden Atome.",
    explain: set.map(b => `${lbl(b)}: ΔEN ${dEN(b).toFixed(2).replace(".", ",")}`).join(" · ") + ` → **${lbl(best)}**.`,
  };
}

// ── Level ────────────────────────────────────────────────────────────────────

const GENS = (os: boolean): Record<string, () => Task> => ({
  bindigkeit, around: () => around(os), lonePairs: () => lonePairs(os), build: () => build(os), bondType: () => bondType(os),
  formula: () => formulaQ(os), name: () => nameQ(os), geometry, angle, polar, strongest,
});

export const TYPE_NAMES: Record<string, string> = {
  bindigkeit: "Anzahl der Bindungen", around: "Oktett und Duett", lonePairs: "Freie Elektronenpaare", build: "Moleküle bauen",
  bondType: "Mehrfachbindungen", formula: "Formeln", name: "Namen", geometry: "Molekülgeometrie", angle: "Bindungswinkel",
  polar: "Polarität", strongest: "Polare Bindungen",
};

interface Level extends QuizLevel { types: string[] }
export const LEVELS: Record<Stufe, Level[]> = {
  us: [
    { id: "us-1", name: "Elektronenpaare & Oktett", desc: "Wie viele Bindungen? Wie viele freie Paare?", types: ["bindigkeit", "around", "lonePairs"] },
    { id: "us-2", name: "Moleküle bauen", desc: "Einfach-, Doppel- und Dreifachbindungen", types: ["build", "bondType", "bindigkeit"] },
    { id: "us-3", name: "Namen & Formeln", desc: "Wasser, Ammoniak, Methan & Co.", types: ["name", "formula", "build"] },
  ],
  os: [
    { id: "os-1", name: "Moleküle bauen", desc: "Auch Ethen, Ethin, Methanol, Blausäure …", types: ["build", "bondType", "lonePairs"] },
    { id: "os-2", name: "Molekülgeometrie", desc: "EPA-Modell: Form und Bindungswinkel", types: ["geometry", "angle", "lonePairs"] },
    { id: "os-3", name: "Polarität", desc: "Elektronegativität, Teilladungen, Dipole", types: ["polar", "strongest", "geometry"] },
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

export { KNOWN_BY_ID };
