// Quiz-Aufgaben zu Reinstoffen und Gemischen (reine Daten, damit Runden gespeichert werden können). Aufgabentyp = Fertigkeit.
// Jede falsche Antwort steht für eine Fehlvorstellung (misconceptions.ts): d(text, schlüssel, rückmeldung), bei Zahlen Fallen.
// Bilder: Becher mit Teilchen (`mix`), bei Alltagsbeispielen ohne Bild nur der Text.

import { toSubscript } from "@lern/chem";
import { buildRound, d, mc, pick, shuffle, validTraps, weakTypes, type BaseTask, type LevelKey, type McTask, type QuizLevel, type Trap, type TypeStats } from "@lern/quiz";
import { EXAMPLES, analyse, atomCount, elementName, isElement, nameOf, type State } from "../mixtures.ts";

/** Bild der Aufgabe: Stoffe mit Teilchenzahl, Zustand, schwimmende Stoffe */
type Extra = { mix?: [string, number][]; state?: State; floats?: string[] };
export type Task = (McTask & Extra) | (BaseTask & Extra & { kind: "num"; answer: number });

const F = toSubscript;
const cnt = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} und ${xs[xs.length - 1]}`);
const names = (fs: string[]) => list(fs.map(f => `${nameOf(f).replace(/ \(.*\)$/, "")} (${F(f)})`));
const atomList = (els: string[]) => list(els.map(el => `${el}`));
const nearNums = (x: number, min = 0) => [x + 1, x - 1, x + 2, x - 2, x + 3].filter(v => v >= min).map(String);

// ── Gemische für das Quiz ──────────────────────────────────────────────────────
// kleine Moleküle und Atome, deren Bild man gut zählen kann
const POOL = ["H2O", "H2O2", "O2", "O3", "H2", "N2", "CO2", "CH4", "NH3", "CO", "He", "Ar", "C"];
const ELEMENT_MOLECULES = ["O2", "O3", "H2", "N2"];

type Mix = { mix: [string, number][]; state: State; floats?: string[] };

/** zufälliges Gemisch (Modell): k Stoffe, je 1–4 Teilchen, höchstens 12 Teilchen */
function randomMix(k: number, must: string[] = []): Mix {
  for (;;) {
    const fs = [...new Set([...must, ...shuffle(POOL)])].slice(0, k);
    const mix = shuffle(fs).map(f => [f, 1 + Math.floor(Math.random() * 4)] as [string, number]);
    const n = mix.reduce((s, [, x]) => s + x, 0);
    if (n >= 3 && n <= 12) return { mix, state: "modell" };
  }
}
/** Beispiel aus „Probieren“ – zum Zählen nur mit kleinen Molekülen (große wie Dodecan, Zucker sind im Bild zu klein für die Farben) */
const COUNTABLE = EXAMPLES.filter(e => e.items.every(([f]) => atomCount(f) <= 9));
const exampleMix = (): Mix => { const e = pick(COUNTABLE); return { mix: e.items, state: e.state, ...(e.floats ? { floats: e.floats } : {}) }; };
const someMix = (k = pick([2, 3, 3, 4])): Mix => (Math.random() < .3 ? exampleMix() : randomMix(k));

// ── Level 1: Teilchen und Stoffe ───────────────────────────────────────────────

function teilchen(): Task {
  const m = someMix();
  const a = analyse(m.mix);
  const traps = validTraps([
    { field: "n", value: a.atome, miss: "atome-gezaehlt", why: `**${a.atome}** sind alle Atome. Ein Molekül zählt als **ein** Teilchen, egal aus wie vielen Atomen.` },
    { field: "n", value: a.stoffe.length, miss: "stoffe-statt-teilchen", why: `**${a.stoffe.length}** ist die Zahl der Stoffe. Gefragt sind alle Teilchen – auch gleiche einzeln zählen.` },
  ] as Trap[], { n: a.teilchen });
  return {
    kind: "num", answer: a.teilchen, ...m, traps,
    prompt: "Wie viele **Teilchen** sind im Gefäß?",
    hint: "Ein Teilchen ist ein Molekül oder ein einzelnes Atom. Zähle jedes Teilchen einmal.",
    explain: `${m.mix.map(([f, n]) => `${n} × ${F(f)}`).join(" + ")} = **${a.teilchen} Teilchen**.`,
    praise: "Jedes Molekül als ein Teilchen gezählt – genau so geht's.",
  };
}

function stoffe(): Task {
  const m = someMix();
  const a = analyse(m.mix), s = a.stoffe.length;
  const why = {
    teilchen: `**${a.teilchen}** sind alle Teilchen. Gleiche Teilchen gehören zum selben Stoff.`,
    sorten: `**${a.atomsorten.length}** sind die Atomsorten (${atomList(a.atomsorten)}). Gezählt werden verschiedene Teilchen.`,
  };
  const base = {
    ...m,
    prompt: "Wie viele **verschiedene Stoffe** sind im Gefäß?",
    hint: "Gleiche Teilchen sind derselbe Stoff. Zähle die verschiedenen Teilchensorten.",
    explain: `Verschiedene Teilchen: ${names(a.stoffe)} → **${cnt(s, "Stoff", "Stoffe")}**.`,
  };
  if (Math.random() < .5) {
    return { kind: "num", answer: s, ...base, traps: validTraps([
      { field: "n", value: a.teilchen, miss: "teilchen-statt-stoffe", why: why.teilchen },
      { field: "n", value: a.atomsorten.length, miss: "atomsorten-statt-stoffe", why: why.sorten },
    ] as Trap[], { n: s }) };
  }
  return {
    ...mc(String(s), [
      a.teilchen !== s ? d(String(a.teilchen), "teilchen-statt-stoffe", why.teilchen) : null,
      a.atomsorten.length !== s ? d(String(a.atomsorten.length), "atomsorten-statt-stoffe", why.sorten) : null,
      ...nearNums(s, 1),
    ].filter(x => x !== null)),
    ...base,
  };
}

const REIN_E = "Reinstoff – Element", REIN_V = "Reinstoff – Verbindung", GEMISCH = "Gemisch";

function reinGemisch(): Task {
  // Auswahl so, dass alle Fälle vorkommen – auch Gemische aus einer Atomsorte (O₂ + O₃)
  const kind = pick(["verbindung", "element", "gemisch", "gemisch-o", "gemisch"]);
  let m: Mix;
  if (kind === "verbindung") m = { mix: [[pick(["H2O", "CO2", "CH4", "NH3", "H2O2"]), 3 + Math.floor(Math.random() * 5)]], state: "modell" };
  else if (kind === "element") m = { mix: [[pick(["O2", "O3", "N2", "H2", "He", "C", "Ar"]), 3 + Math.floor(Math.random() * 5)]], state: "modell" };
  else if (kind === "gemisch-o") m = { mix: shuffle([["O2", 2 + Math.floor(Math.random() * 3)], ["O3", 1 + Math.floor(Math.random() * 3)]] as [string, number][]), state: "modell" };
  else m = someMix(pick([2, 3]));
  const a = analyse(m.mix);
  const f = a.stoffe[0];
  if (a.reinstoff && isElement(f)) {
    const molecule = ELEMENT_MOLECULES.includes(f);
    return {
      ...mc(REIN_E, [
        d(REIN_V, molecule ? "molekuel-verbindung" : "verbindung-element", molecule
          ? `${F(f)} hat zwar mehrere Atome, aber nur **eine Atomsorte** (${a.atomsorten[0]}). Das ist ein Element.`
          : `Es gibt nur eine Atomsorte (${f}). Eine Verbindung hat mehrere.`),
        d(GEMISCH, molecule ? "molekuel-gemisch" : "sorten-uebersehen", "Alle Teilchen sind gleich – also nur ein Stoff. Ein Gemisch hat mehrere Stoffe."),
      ], 3),
      ...m,
      prompt: "Reinstoff oder Gemisch? Und was für ein Stoff?",
      hint: "Sind alle Teilchen gleich? Wie viele Atomsorten hat ein Teilchen?",
      explain: `Nur ${nameOf(f)}-Teilchen (${F(f)}) → **Reinstoff**. Eine Atomsorte → **Element**.`,
    };
  }
  if (a.reinstoff) {
    return {
      ...mc(REIN_V, [
        d(GEMISCH, "verbindung-gemisch", `Alle Teilchen sind gleich (${F(f)}). Mehrere Atomsorten **in einem Teilchen** machen eine Verbindung, kein Gemisch.`),
        d(REIN_E, "verbindung-element", `Ein ${F(f)}-Teilchen enthält ${atomList(a.atomsorten)} – mehrere Atomsorten, also eine Verbindung.`),
      ], 3),
      ...m,
      prompt: "Reinstoff oder Gemisch? Und was für ein Stoff?",
      hint: "Sind alle Teilchen gleich? Wie viele Atomsorten hat ein Teilchen?",
      explain: `Nur ${nameOf(f)}-Teilchen (${F(f)}) → **Reinstoff**. Atomsorten ${atomList(a.atomsorten)} fest verbunden → **Verbindung**.`,
    };
  }
  const oneSort = a.atomsorten.length === 1;
  return {
    ...mc(GEMISCH, [
      d(oneSort ? REIN_E : REIN_V, oneSort ? "eine-atomsorte-rein" : "sorten-uebersehen", oneSort
        ? `Nur ${a.atomsorten[0]}-Atome – aber ${names(a.stoffe)} sind verschiedene Teilchen. Also mehrere Stoffe: ein Gemisch.`
        : `Es gibt ${cnt(a.stoffe.length, "Teilchensorte", "verschiedene Teilchensorten")}. Mehrere Stoffe ergeben ein Gemisch.`),
      oneSort ? REIN_V : REIN_E,
    ], 3),
    ...m,
    prompt: "Reinstoff oder Gemisch? Und was für ein Stoff?",
    hint: "Sind alle Teilchen gleich? Verschiedene Teilchen bedeuten verschiedene Stoffe.",
    explain: `Verschiedene Teilchen: ${names(a.stoffe)} → **Gemisch**.`,
  };
}

// ── Level 2: Elemente und Verbindungen ─────────────────────────────────────────

function atomsorten(): Task {
  const m = someMix(pick([2, 3, 4]));
  const a = analyse(m.mix), n = a.atomsorten.length;
  return {
    kind: "num", answer: n, ...m,
    traps: validTraps([
      { field: "n", value: a.stoffe.length, miss: "stoffe-statt-atomsorten", why: `**${a.stoffe.length}** sind die Stoffe. Gefragt sind die Atomsorten – die Farben der Kugeln.` },
      { field: "n", value: a.atome, miss: "atome-gezaehlt", why: `**${a.atome}** sind alle Atome. Jede Atomsorte zählt nur einmal.` },
    ] as Trap[], { n }),
    prompt: "Wie viele **Atomsorten** kommen im Gefäß vor?",
    hint: "Jede Atomsorte hat eine eigene Farbe. Zähle die verschiedenen Farben.",
    explain: `Atomsorten: ${list(a.atomsorten.map(el => `${elementName(el)} (${el})`))} → **${n}**.`,
  };
}

/** Gemisch, das oft ein Element-Molekül (O₂, O₃ …) enthält – dort liegt der häufigste Fehler */
const l2Mix = () => (Math.random() < .6 ? randomMix(pick([2, 3, 4]), [pick(ELEMENT_MOLECULES)]) : someMix(pick([3, 4])));

function verbindungen(): Task {
  const m = l2Mix();
  const a = analyse(m.mix), v = a.verbindungen.length;
  // typischer Fehler: jeder Stoff aus Molekülen mit mehreren Atomen sei eine Verbindung (auch O₂, O₃)
  const molecules = a.stoffe.filter(f => atomCount(f) > 1).length;
  const particles = m.mix.filter(([f]) => !isElement(f)).reduce((s, [, n]) => s + n, 0);
  return {
    kind: "num", answer: v, ...m,
    traps: validTraps([
      { field: "n", value: molecules, miss: "molekuel-verbindung", why: `${names(a.elemente.filter(f => /\d/.test(f)))}: mehrere Atome, aber nur **eine** Atomsorte – das sind Elemente.` },
      { field: "n", value: particles, miss: "teilchen-statt-stoffe", why: `**${particles}** sind die Teilchen von Verbindungen. Gefragt ist, wie viele **Stoffe** Verbindungen sind.` },
    ] as Trap[], { n: v }),
    prompt: "Wie viele der Stoffe im Gefäß sind **Verbindungen**?",
    hint: "Eine Verbindung hat mindestens zwei verschiedene Atomsorten in einem Teilchen.",
    explain: a.verbindungen.length ? `Verbindungen: ${names(a.verbindungen)} → **${v}**.` : "Kein Teilchen hat zwei Atomsorten → **0** Verbindungen.",
  };
}

function elemente(): Task {
  const m = l2Mix();
  const a = analyse(m.mix), e = a.elemente.length;
  const singles = a.elemente.filter(f => !/\d/.test(f)).length;
  return {
    kind: "num", answer: e, ...m,
    traps: validTraps([
      { field: "n", value: singles, miss: "einzelatom-element", why: `Auch Moleküle aus einer Atomsorte sind Elemente: ${names(a.elemente.filter(f => /\d/.test(f)))}.` },
      { field: "n", value: a.atomsorten.length, miss: "atomsorten-statt-stoffe", why: `**${a.atomsorten.length}** sind die Atomsorten. Gefragt ist, wie viele **Stoffe** Elemente sind.` },
    ] as Trap[], { n: e }),
    prompt: "Wie viele der Stoffe im Gefäß sind **Elemente**?",
    hint: "Ein Element hat nur eine Atomsorte – als einzelnes Atom oder als Molekül.",
    explain: a.elemente.length ? `Elemente: ${names(a.elemente)} → **${e}**.` : "Jedes Teilchen hat mehrere Atomsorten → **0** Elemente.",
  };
}

const EINORDNEN = ["H2O", "O3", "O2", "He", "C", "CO2", "CH4", "N2", "C2H5OH", "NH3", "H2O2", "H2", "Ar", "CO", "C12H26", "C12H22O11"];

function einordnen(): Task {
  const f = pick(EINORDNEN);
  const els = analyse([[f, 1]]).atomsorten;
  const el = isElement(f), molecule = el && /\d/.test(f);
  const name = nameOf(f).replace(/ \(.*\)$/, "");
  const opts = el
    ? mc("Element", [
      d("Verbindung", molecule ? "molekuel-verbindung" : "verbindung-element", molecule
        ? `${F(f)} hat mehrere Atome, aber nur **eine** Atomsorte (${els[0]}). Das ist ein Element.`
        : `${F(f)} besteht nur aus ${els[0]}-Atomen. Eine Verbindung braucht mehrere Atomsorten.`),
      d("Gemisch", molecule ? "molekuel-gemisch" : "sorten-uebersehen", "Alle Teilchen sind gleich – ein Reinstoff, kein Gemisch."),
    ], 3)
    : mc("Verbindung", [
      d("Element", "verbindung-element", `Ein ${F(f)}-Teilchen enthält ${atomList(els)} – mehrere Atomsorten: eine Verbindung.`),
      d("Gemisch", "verbindung-gemisch", "Die Atome sind im Teilchen fest verbunden, alle Teilchen sind gleich – kein Gemisch."),
    ], 3);
  return {
    ...opts,
    mix: [[f, atomCount(f) > 12 ? 3 : 5]], state: "modell",
    prompt: `**${name}** (${F(f)}): Element, Verbindung oder Gemisch?`,
    hint: "Wie viele Atomsorten stecken in einem Teilchen?",
    explain: el
      ? `${name}: nur ${elementName(els[0])}-Atome (${els[0]}) → **Element**${molecule ? ", auch als Molekül" : ""}.`
      : `${name}: ${atomList(els)} in einem Teilchen → **Verbindung**.`,
  };
}

// ── Level 3: Gemische im Alltag ─────────────────────────────────────────────────

const HOMOGEN = "homogenes Gemisch", HETEROGEN = "heterogenes Gemisch", REIN = "Reinstoff";
interface Everyday { name: string; ans: string; ex?: string; why: string; trap?: [string, string, string] }
const EVERYDAY: Everyday[] = [
  { name: "Öl und Wasser", ans: HETEROGEN, ex: "oel", why: "Öl schwimmt oben, man sieht zwei Schichten.", trap: [HOMOGEN, "entmischt-homogen", "Öl und Wasser mischen sich nicht – sie trennen sich in zwei Schichten."] },
  { name: "Zuckerwasser", ans: HOMOGEN, ex: "zucker", why: "Der Zucker ist gelöst und überall gleich verteilt.", trap: [REIN, "klar-reinstoff", "Klar heißt nicht rein: Zucker und Wasser sind zwei Stoffe."] },
  { name: "Alkohol und Wasser", ans: HOMOGEN, ex: "alkohol", why: "Alkohol und Wasser mischen sich vollständig.", trap: [HETEROGEN, "geloest-heterogen", "Man sieht keine Grenze – die Teilchen sind gleichmäßig gemischt."] },
  { name: "Sprudelwasser ohne Blasen", ans: HOMOGEN, ex: "sprudel", why: "Das Kohlenstoffdioxid ist im Wasser gelöst.", trap: [REIN, "klar-reinstoff", "Im Wasser ist Kohlenstoffdioxid gelöst – zwei Stoffe."] },
  { name: "Luft", ans: HOMOGEN, ex: "luft", why: "Gase mischen sich immer vollständig.", trap: [REIN, "klar-reinstoff", "Luft besteht aus Stickstoff, Sauerstoff, Argon und Kohlenstoffdioxid."] },
  { name: "Erdgas", ans: HOMOGEN, ex: "erdgas", why: "Methan, Ethan und Stickstoff sind gleichmäßig gemischt." },
  { name: "reines Wasser", ans: REIN, ex: "wasser", why: "Alle Teilchen sind gleich: H₂O.", trap: [HOMOGEN, "verbindung-gemisch", "Wasser ist eine Verbindung aus H und O – aber nur ein Stoff."] },
  { name: "Helium im Luftballon", ans: REIN, ex: "helium", why: "Nur Helium-Atome – ein Stoff." },
  { name: "Milch", ans: HETEROGEN, why: "Unter dem Mikroskop sieht man Fetttröpfchen im Wasser.", trap: [HOMOGEN, "sieht-einheitlich", "Milch sieht einheitlich aus, enthält aber winzige Fetttröpfchen."] },
  { name: "Granit", ans: HETEROGEN, why: "Man sieht verschiedene Körner (Quarz, Feldspat, Glimmer).", trap: [HOMOGEN, "sieht-einheitlich", "Die verschiedenen Körner sind mit freiem Auge zu sehen."] },
  { name: "Nebel", ans: HETEROGEN, why: "Winzige Wassertröpfchen schweben in der Luft.", trap: [HOMOGEN, "sieht-einheitlich", "Nebel besteht aus Tröpfchen in Luft – zwei Phasen."] },
  { name: "Sand in Wasser", ans: HETEROGEN, why: "Der Sand löst sich nicht und sinkt ab." },
  { name: "Messing", ans: HOMOGEN, why: "Kupfer und Zink sind im Metall gleichmäßig verteilt (Legierung).", trap: [REIN, "klar-reinstoff", "Messing ist eine Legierung aus Kupfer und Zink – zwei Stoffe."] },
  { name: "Meerwasser (gefiltert)", ans: HOMOGEN, why: "Das Salz ist im Wasser gelöst.", trap: [REIN, "klar-reinstoff", "Im Meerwasser sind Salze gelöst – kein Reinstoff."] },
  { name: "Orangensaft mit Fruchtfleisch", ans: HETEROGEN, why: "Die Fruchtfleisch-Stücke sind zu sehen." },
  { name: "Rauch", ans: HETEROGEN, why: "Feste Rußteilchen schweben in der Luft.", trap: [HOMOGEN, "sieht-einheitlich", "Rauch enthält feste Teilchen in Luft – zwei Phasen."] },
];

function homogen(): Task {
  const e = pick(EVERYDAY);
  const ex = e.ex ? EXAMPLES.find(x => x.id === e.ex) : undefined;
  const others = [HOMOGEN, HETEROGEN, REIN].filter(o => o !== e.ans && o !== e.trap?.[0]);
  return {
    ...mc(e.ans, [...(e.trap ? [d(e.trap[0], e.trap[1], e.trap[2])] : []), ...others], 3, e.why),
    ...(ex ? { mix: ex.items, state: ex.state, ...(ex.floats ? { floats: ex.floats } : {}) } : {}),
    prompt: `Was ist **${e.name}**?`,
    hint: "Homogen: überall gleich, keine Grenze. Heterogen: Teile oder Schichten sind zu erkennen.",
    explain: `${e.name}: **${e.ans}**. ${e.why}`,
  };
}

interface Stoff { name: string; ans: "Element" | "Verbindung" | "Gemisch"; why: string; trap?: [string, string, string] }
const ALLTAG: Stoff[] = [
  { name: "Sauerstoff (O₂)", ans: "Element", why: "Nur O-Atome.", trap: ["Verbindung", "molekuel-verbindung", "O₂ hat zwei Atome, aber nur eine Atomsorte – ein Element."] },
  { name: "Ozon (O₃)", ans: "Element", why: "Nur O-Atome – drei davon in einem Molekül.", trap: ["Verbindung", "molekuel-verbindung", "O₃ hat drei Atome, aber nur eine Atomsorte – ein Element."] },
  { name: "Gold", ans: "Element", why: "Nur Gold-Atome." },
  { name: "Kupfer", ans: "Element", why: "Nur Kupfer-Atome." },
  { name: "Helium", ans: "Element", why: "Nur Helium-Atome." },
  { name: "Wasser (H₂O)", ans: "Verbindung", why: "H und O fest verbunden, alle Teilchen gleich.", trap: ["Gemisch", "verbindung-gemisch", "Wasser enthält H und O – aber in jedem Teilchen fest verbunden. Ein Stoff."] },
  { name: "Kohlenstoffdioxid (CO₂)", ans: "Verbindung", why: "C und O fest verbunden.", trap: ["Element", "verbindung-element", "CO₂ hat zwei Atomsorten (C und O) – eine Verbindung."] },
  { name: "Haushaltszucker", ans: "Verbindung", why: "C, H und O fest verbunden, alle Teilchen gleich.", trap: ["Gemisch", "verbindung-gemisch", "Zucker besteht aus gleichen Teilchen – ein Reinstoff, und zwar eine Verbindung."] },
  { name: "Kochsalz (NaCl)", ans: "Verbindung", why: "Natrium und Chlor fest verbunden (Ionen).", trap: ["Gemisch", "verbindung-gemisch", "Kochsalz ist ein Reinstoff aus Na⁺ und Cl⁻ – eine Verbindung."] },
  { name: "Luft", ans: "Gemisch", why: "Stickstoff, Sauerstoff, Argon und mehr.", trap: ["Element", "eine-atomsorte-rein", "Luft enthält verschiedene Stoffe: N₂, O₂, Ar, CO₂."] },
  { name: "Leitungswasser", ans: "Gemisch", why: "Im Wasser sind Salze und Gase gelöst.", trap: ["Verbindung", "klar-reinstoff", "Leitungswasser ist klar, enthält aber gelöste Stoffe."] },
  { name: "Messing", ans: "Gemisch", why: "Kupfer und Zink gemischt (Legierung).", trap: ["Element", "klar-reinstoff", "Messing sieht einheitlich aus – aber Kupfer und Zink sind zwei Stoffe."] },
  { name: "Zuckerwasser", ans: "Gemisch", why: "Zucker in Wasser gelöst.", trap: ["Verbindung", "klar-reinstoff", "Zuckerwasser ist klar – aber zwei Stoffe: Zucker und Wasser."] },
  { name: "Sauerstoff und Ozon zusammen", ans: "Gemisch", why: "Zwei Stoffe (O₂ und O₃), auch wenn nur O-Atome.", trap: ["Element", "eine-atomsorte-rein", "Nur O-Atome – aber O₂ und O₃ sind zwei verschiedene Stoffe."] },
];

function alltag(): Task {
  const s = pick(ALLTAG);
  const label = (x: string) => (x === "Gemisch" ? GEMISCH : x === "Element" ? REIN_E : REIN_V);
  const others = ["Element", "Verbindung", "Gemisch"].filter(o => o !== s.ans && o !== s.trap?.[0]).map(label);
  return {
    ...mc(label(s.ans), [...(s.trap ? [d(label(s.trap[0]), s.trap[1], s.trap[2])] : []), ...others], 3, s.why),
    prompt: `**${s.name}**: Reinstoff oder Gemisch? Element oder Verbindung?`,
    hint: "Ein Stoff oder mehrere? Wenn einer: eine Atomsorte oder mehrere?",
    explain: `${s.name}: **${label(s.ans)}**. ${s.why}`,
  };
}

// ── Level und Runden ─────────────────────────────────────────────────────────

const GENS: Record<string, () => Task> = { teilchen, stoffe, reinGemisch, atomsorten, verbindungen, elemente, einordnen, homogen, alltag };

export const TYPE_NAMES: Record<string, string> = {
  teilchen: "Teilchen zählen", stoffe: "Stoffe zählen", reinGemisch: "Reinstoff oder Gemisch", atomsorten: "Atomsorten zählen",
  verbindungen: "Verbindungen zählen", elemente: "Elemente zählen", einordnen: "Element oder Verbindung", homogen: "Homogen oder heterogen", alltag: "Stoffe im Alltag",
};

interface Level extends QuizLevel { types: string[] }
export const LEVELS: Level[] = [
  { id: "gm-1", name: "Teilchen und Stoffe", desc: "Teilchen zählen, Stoffe erkennen, Reinstoff oder Gemisch", types: ["teilchen", "stoffe", "reinGemisch"] },
  { id: "gm-2", name: "Elemente und Verbindungen", desc: "Atomsorten, Elemente (auch O₂, O₃) und Verbindungen", types: ["einordnen", "verbindungen", "elemente", "atomsorten"] },
  { id: "gm-3", name: "Gemische im Alltag", desc: "Homogen oder heterogen, Reinstoff oder Gemisch", types: ["homogen", "alltag"] },
];

export const levelId = (_stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[level].id : `gm-${level}`);
export const levelName = (level: LevelKey) =>
  level === "mix" ? "Alles gemischt" : level === "weak" ? "Schwächen üben" : level === "due" ? "Heute fällig" : LEVELS[level].name;

export function makeRound(_stufe: string, level: LevelKey, stats?: TypeStats, due: string[] = []): Task[] {
  let ids = level === "mix" ? [...new Set(LEVELS.flatMap(l => l.types))]
    : level === "weak" ? weakTypes(stats, id => LEVELS.some(l => l.types.includes(id)))
    : level === "due" ? due.filter(id => GENS[id])
    : LEVELS[level].types;
  if (!ids.length) ids = LEVELS[0].types;
  return buildRound(ids, GENS, 10);
}
