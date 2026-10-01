// Quiz-Aufgaben zu Reinstoffen und Gemischen (reine Daten, damit Runden gespeichert werden können). Aufgabentyp = Fertigkeit.
// Jede falsche Antwort steht für eine Fehlvorstellung (misconceptions.ts): d(text, schlüssel, rückmeldung), bei Zahlen Fallen.
// Bilder: Teilchenbild der Aufgabe (`pic`) oder Teilchenbilder als Antworten (`pics`, Schlüssel = Antworttext).
// Elemente kommen nur als einzelne Atome vor (Edelgase, Metallgitter).

import { toSubscript } from "@lern/chem";
import { buildRound, d, dis, mc, pick, shuffle, validTraps, weakTypes, type BaseTask, type Distractor, type LevelKey, type McTask, type QuizLevel, type Trap, type TypeStats } from "@lern/quiz";
import { EXAMPLES, PICTURE_LABEL, analyse, elementName, isElement, shortName, small, type Before, type PictureKind, type State } from "../mixtures.ts";
import type { Arrange } from "../mixing.ts";

/** Teilchenbild: Stoffe mit Teilchenzahl, Zustand, Anordnung */
export interface Pic { mix: [string, number][]; state: State; floats?: string[]; before?: Before; solute?: string; arrange?: Arrange }
/** `tip`: auf die Aufgabe zugeschnittener Tipp (Level mit Tipp), sonst gilt der allgemeine `hint` */
type Extra = { pic?: Pic; pics?: Record<string, Pic>; tip?: string };
export type Task = (McTask & Extra) | (BaseTask & Extra & { kind: "num"; answer: number });

const F = toSubscript;
const int = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const cnt = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} und ${xs[xs.length - 1]}`);
const names = (fs: string[]) => list(fs.map(f => `${shortName(f)} (${F(f)})`));
const nearNums = (x: number, min = 0) => [x + 1, x - 1, x + 2, x - 2, x + 3].filter(v => v >= min).map(String);
const sum = (m: [string, number][]) => m.reduce((s, [, n]) => s + n, 0);
const ARRANGE_TEXT: Partial<Record<Arrange, string>> = { vorher: "vorher", gemischt: "gemischt", unten: "unten", oben: "oben", getrennt: "getrennt", abwechselnd: "abwechselnd" };
/** kurze Beschreibung eines Teilchenbilds (Vorlesen, Schlüssel der Bild-Antworten) */
export const describe = (p: Pic) => p.mix.map(([f, n]) => `${n} × ${F(f)}`).join(", ") + (p.arrange && ARRANGE_TEXT[p.arrange] ? ` – ${ARRANGE_TEXT[p.arrange]}` : "");

// ── Teilchenbilder ─────────────────────────────────────────────────────────────
const NOBLE = ["He", "Ne", "Ar"];
const METALS = ["Cu", "Zn", "Fe", "Al"];
const COMPOUNDS = ["H2O", "CO2", "CH4", "NH3", "CO", "H2S", "H2O2", "C2H6"];
/** Metallgitter füllen ihr Raster ganz (6 = 3 × 2, 8 = 4 × 2, 12 = 4 × 3) */
const LATTICE = [6, 8, 12];

/** je Stoff 1–4 Teilchen, zusammen zwischen lo und hi */
function amounts(fs: string[], lo: number, hi: number): [string, number][] {
  for (;;) {
    const mix = fs.map(f => [f, int(1, 4)] as [string, number]);
    if (sum(mix) >= lo && sum(mix) <= hi) return mix;
  }
}
/** Legierung aus zwei Metallen, füllt ein Gitter ganz */
function alloy(hi: number): [string, number][] {
  const n = pick(LATTICE.filter(x => x <= hi)), [a, b] = shuffle(METALS);
  const k = int(2, n - 2);
  return [[a, k], [b, n - k]];
}

/** zufälliges Teilchenbild einer Art (Element, Verbindung, Gemisch aus Elementen/Verbindungen/beidem) */
function mixOf(kind: PictureKind, lo = 4, hi = 12): Pic {
  switch (kind) {
    case "E": return Math.random() < .35
      ? { mix: [[pick(METALS), pick(LATTICE.filter(n => n <= Math.max(hi, 6)))]], state: "fest" }
      : { mix: [[pick(NOBLE), int(Math.max(lo, 4), Math.min(hi, 8))]], state: "modell" };
    case "V": return { mix: [[pick(COMPOUNDS), int(Math.max(lo, 3), Math.min(hi, 7))]], state: "modell" };
    case "GE": return Math.random() < .35 && hi >= 8
      ? { mix: alloy(hi), state: "fest" }
      : { mix: amounts(shuffle(NOBLE).slice(0, pick([2, 2, 3])), lo, hi), state: "modell" };
    case "GV": return { mix: amounts(shuffle(COMPOUNDS).slice(0, pick([2, 2, 3])), lo, hi), state: "modell" };
    case "GEV": {
      const e = shuffle(NOBLE).slice(0, pick([1, 1, 2])), v = shuffle(COMPOUNDS).slice(0, pick([1, 1, 2]));
      return { mix: amounts(shuffle([...e, ...v]), lo, hi), state: "modell" };
    }
  }
}
/** Farbfamilien der Atome im Modell – ähnliche Farben kommen nie zusammen in eine Aufgabe (sonst kaum zu unterscheiden) */
const COLOR: Record<string, string> = { H: "weiß", C: "schwarz", N: "blau", O: "rot", S: "gelb", He: "türkis", Ne: "türkis", Ar: "violett", Cu: "braun", Fe: "braun", Zn: "grau", Al: "grau" };
/** alle Atomsorten einer Aufgabe haben verschiedene Farbfamilien */
export function distinctColors(t: Task): boolean {
  const els = new Set([...(t.pic ? [t.pic] : []), ...Object.values(t.pics ?? {})].flatMap(p => p.mix.flatMap(([f]) => analyse([[f, 1]]).atomsorten)));
  const fams = [...els].map(e => COLOR[e] ?? e);
  return new Set(fams).size === fams.length;
}

const someMix = () => mixOf(pick<PictureKind>(["GV", "GV", "GEV", "GEV", "GEV", "GE", "V", "E"]));
const exOf = (id: string) => EXAMPLES.find(e => e.id === id)!;
/** Bild eines Beispiels aus „Probieren“ – mit einem Zehntel der Teilchen (zum Ansehen und Zählen) */
function exPic(id: string, arrange: Arrange = "nachher", mix?: [string, number][], solute?: string): Pic {
  const e = exOf(id);
  const s = solute ?? e.solute;
  return { mix: mix ?? small(e.items), state: e.state, ...(e.floats ? { floats: e.floats } : {}), ...(e.before ? { before: e.before } : {}), ...(s ? { solute: s } : {}), arrange };
}
const metalPic = (p: Pic) => p.state === "fest";

// ── Level 1: Teilchen und Stoffe ───────────────────────────────────────────────

function teilchen(): Task {
  const m = someMix();
  const a = analyse(m.mix);
  const traps = validTraps([
    { field: "n", value: a.atome, miss: "atome-gezaehlt", why: `**${a.atome}** sind alle Atome. Ein Molekül zählt als **ein** Teilchen, egal aus wie vielen Atomen.` },
    { field: "n", value: a.stoffe.length, miss: "stoffe-statt-teilchen", why: `**${a.stoffe.length}** ist die Zahl der Stoffe. Gefragt sind alle Teilchen – auch gleiche einzeln zählen.` },
  ] as Trap[], { n: a.teilchen });
  return {
    kind: "num", answer: a.teilchen, pic: m, traps,
    prompt: "Wie viele **Teilchen** sind im Bild?",
    hint: "Ein Teilchen ist ein Molekül oder ein einzelnes Atom. Zähle jedes Teilchen einmal.",
    tip: `Zähle jede Sorte einzeln: ${list(m.mix.map(([f]) => F(f)))}. Dann zusammenzählen. Ein Molekül zählt als 1.`,
    explain: `${m.mix.map(([f, n]) => `${n} × ${F(f)}`).join(" + ")} = **${a.teilchen} Teilchen**.`,
    praise: "Jedes Molekül als ein Teilchen gezählt – genau so geht's.",
  };
}

function stoffe(): Task {
  const m = someMix();
  const a = analyse(m.mix), s = a.stoffe.length;
  const why = {
    teilchen: `**${a.teilchen}** sind alle Teilchen. Gleiche Teilchen gehören zum selben Stoff.`,
    sorten: `**${a.atomsorten.length}** sind die Atomsorten (${list(a.atomsorten)}). Gezählt werden verschiedene Teilchen.`,
  };
  const base = {
    pic: m,
    prompt: "Wie viele **verschiedene Stoffe** sind im Bild?",
    hint: "Gleiche Teilchen sind derselbe Stoff. Zähle die verschiedenen Teilchensorten.",
    tip: `Im Bild sind ${a.teilchen} Teilchen. Wie viele davon sehen verschieden aus? Gleiche zählen nur einmal.`,
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
    ]),
    ...base,
  };
}

const REIN_E = "Reinstoff – Element", REIN_V = "Reinstoff – Verbindung", GEMISCH = "Gemisch";

/** Level 1: Reinstoff oder Gemisch? – nur nach Teilchen, ohne Element/Verbindung (kommt erst in Level 2) */
const R_OK = "Reinstoff – alle Teilchen gleich", G_OK = "Gemisch – verschiedene Teilchen";
function reinOderGemisch(): Task {
  const kind = pick<PictureKind>(["E", "V", "GE", "GV", "GEV"]);
  const m = mixOf(kind);
  const a = analyse(m.mix);
  const base = { pic: m, prompt: "Reinstoff oder Gemisch?", hint: "Sind alle Teilchen gleich? Gleiche Teilchen = ein Stoff.",
    tip: "Vergleiche die Teilchen: Sehen alle genau gleich aus? Ein Teilchen darf mehrere Farben haben." };
  if (kind === "E" || kind === "V") {
    const f = a.stoffe[0];
    return {
      ...mc(R_OK, [
        kind === "V" ? d("Gemisch – verschiedene Atome", "verbindung-gemisch", `Alle Teilchen sind gleich (${F(f)}). Mehrere Atome **in einem Teilchen** sind trotzdem ein Stoff.`)
          : dis("Gemisch – verschiedene Atome", `Alle Teilchen sind gleich: nur ${F(f)}.`),
        dis(G_OK, `Alle Teilchen sind gleich: nur ${F(f)}. Ein Gemisch hätte verschiedene Teilchen.`),
      ], 3),
      ...base,
      explain: `Nur ${shortName(f)}-Teilchen (${F(f)}) → **Reinstoff**.`,
    };
  }
  return {
    ...mc(G_OK, [
      d(R_OK, "sorten-uebersehen", `Es gibt ${cnt(a.stoffe.length, "Teilchensorte", "verschiedene Teilchensorten")}: ${names(a.stoffe)}. Das sind mehrere Stoffe.`),
      kind === "GE" ? d("Reinstoff – nur einzelne Atome", "nur-elemente-rein", `Einzelne Atome verschiedener Sorten sind verschiedene Stoffe: ${names(a.stoffe)}.`)
        : d("Reinstoff – lauter Moleküle", "sorten-uebersehen", `Die Moleküle sind nicht alle gleich: ${names(a.stoffe)} – mehrere Stoffe.`),
    ], 3),
    ...base,
    explain: `Verschiedene Teilchen: ${names(a.stoffe)} → **Gemisch**.`,
  };
}

/** Level 2: Reinstoff (Element oder Verbindung) oder Gemisch? */
function reinGemisch(): Task {
  const kind = pick<PictureKind>(["E", "V", "GE", "GV", "GEV"]);
  const m = mixOf(kind);
  const a = analyse(m.mix);
  const f = a.stoffe[0];
  const q = { prompt: "Reinstoff oder Gemisch? Und was für ein Stoff?", hint: "Sind alle Teilchen gleich? Wie viele Atomsorten hat ein Teilchen?",
    tip: "Schritt 1: Sind alle Teilchen gleich? Schritt 2: Hat ein Teilchen eine Farbe oder mehrere?" };
  if (kind === "E") {
    return {
      ...mc(REIN_E, [
        d(REIN_V, "element-verbindung", metalPic(m)
          ? `Die ${f}-Atome sind im Gitter verbunden – aber alle gleich. Eine Atomsorte: Element.`
          : `Nur ${f}-Atome – eine Atomsorte. Eine Verbindung braucht mehrere.`),
        dis(GEMISCH, "Alle Teilchen sind gleich – also nur ein Stoff. Ein Gemisch hat mehrere Stoffe."),
      ], 3),
      pic: m, ...q,
      explain: `Nur ${elementName(f)}-Atome (${f}) → **Reinstoff**. Eine Atomsorte → **Element**.`,
    };
  }
  if (kind === "V") {
    return {
      ...mc(REIN_V, [
        d(GEMISCH, "verbindung-gemisch", `Alle Teilchen sind gleich (${F(f)}). Mehrere Atomsorten **in einem Teilchen** machen eine Verbindung.`),
        d(REIN_E, "verbindung-element", `Ein ${F(f)}-Teilchen enthält ${list(a.atomsorten)} – mehrere Atomsorten, also eine Verbindung.`),
      ], 3),
      pic: m, ...q,
      explain: `Nur ${shortName(f)}-Teilchen (${F(f)}) → **Reinstoff**. Atomsorten ${list(a.atomsorten)} fest verbunden → **Verbindung**.`,
    };
  }
  const onlyAtoms = kind === "GE";
  return {
    ...mc(GEMISCH, [
      onlyAtoms
        ? d(REIN_E, "nur-elemente-rein", `${names(a.stoffe)} sind verschiedene Elemente. Mehrere Stoffe ergeben ein Gemisch.`)
        : d(REIN_V, "sorten-uebersehen", `Es gibt ${cnt(a.stoffe.length, "Teilchensorte", "verschiedene Teilchensorten")}. Mehrere Stoffe ergeben ein Gemisch.`),
      onlyAtoms ? d(REIN_V, "gemisch-verbindung", "Die Atome sind nicht miteinander verbunden. Jede Atomsorte ist ein eigener Stoff.") : REIN_E,
    ], 3),
    pic: m, ...q,
    hint: "Sind alle Teilchen gleich? Verschiedene Teilchen bedeuten verschiedene Stoffe.",
    explain: `Verschiedene Teilchen: ${names(a.stoffe)} → **Gemisch**.`,
  };
}

// ── Level 2: Elemente und Verbindungen ─────────────────────────────────────────

/** Antwort `text` mit Rückmeldung, wenn ein Bild der Art `actual` für `said` gehalten wird */
function confuse(actual: PictureKind, said: PictureKind, p: Pic, text: string): Distractor {
  const a = analyse(p.mix);
  const el = a.elemente[0], v = a.verbindungen[0];
  switch (actual) {
    case "E": return said === "V"
      ? d(text, "element-verbindung", metalPic(p) ? `Die ${el}-Atome sind im Gitter verbunden – aber alle gleich. Das ist ein Element.` : `Nur ${el}-Atome – eine Atomsorte. Das ist ein Element.`)
      : dis(text, "Alle Teilchen sind gleich – also nur ein Stoff.");
    case "V": return said === "E"
      ? d(text, "verbindung-element", `Ein ${F(v)}-Teilchen enthält ${list(a.atomsorten)} – mehrere Atomsorten: eine Verbindung.`)
      : d(text, "verbindung-gemisch", `Die Atome sind im Teilchen fest verbunden. Alle Teilchen sind gleich (${F(v)}).`);
    case "GE": return said === "E"
      ? d(text, "nur-elemente-rein", `${names(a.elemente)}: verschiedene Elemente. Mehrere Stoffe ergeben ein Gemisch.`)
      : said === "V" ? d(text, "gemisch-verbindung", "Die Atome sind nicht verbunden. Jede Atomsorte ist ein eigener Stoff.")
      : d(text, "element-verbindung", "Hier sind nur einzelne Atome – das sind Elemente, keine Verbindungen.");
    case "GV": return said === "V"
      ? d(text, "sorten-uebersehen", `Es gibt verschiedene Moleküle: ${names(a.verbindungen)}. Mehrere Stoffe.`)
      : said === "E" ? dis(text, "Jedes Molekül hat mehrere Atomsorten – das sind Verbindungen.")
      : d(text, "verbindung-element", `${names(a.verbindungen)} haben je mehrere Atomsorten – alles Verbindungen.`);
    case "GEV": return said === "GE"
      ? d(text, "verbindung-element", `${shortName(v)} (${F(v)}) hat mehrere Atomsorten – das ist eine Verbindung.`)
      : said === "GV" ? d(text, "element-verbindung", `Die einzelnen ${el}-Atome sind ein Element, keine Verbindung.`)
      : d(text, "sorten-uebersehen", "Es gibt verschiedene Teilchen – also mehrere Stoffe.");
  }
}

const KINDS: PictureKind[] = ["E", "V", "GE", "GV", "GEV"];

/** Was zeigt das Bild? – fünf Arten */
function bildArt(): Task {
  const kind = pick(KINDS);
  const m = mixOf(kind, 4, 10);
  const a = analyse(m.mix);
  return {
    ...mc(PICTURE_LABEL[kind], KINDS.filter(k => k !== kind).map(k => confuse(kind, k, m, PICTURE_LABEL[k])), 3),
    pic: m,
    prompt: "Was zeigt das Teilchenbild?",
    hint: "Wie viele Teilchensorten gibt es? Hat ein Teilchen eine oder mehrere Atomsorten?",
    tip: `Schritt 1: Wie viele Teilchensorten? Hier sind es ${a.stoffe.length}. Schritt 2: Teilchen einfarbig oder mehrfarbig?`,
    explain: `${names(a.stoffe)} → **${PICTURE_LABEL[kind]}**.`,
  };
}

/** Woran man das gesuchte Bild erkennt (Level mit Tipp) */
const WAHL_TIP: Record<PictureKind, string> = {
  E: "Gesucht: alle Teilchen gleich, jedes nur in einer Farbe.",
  V: "Gesucht: alle Teilchen gleich, jedes mit mehreren Farben.",
  GE: "Gesucht: verschiedene Teilchen, jedes nur in einer Farbe.",
  GV: "Gesucht: verschiedene Teilchen, jedes mit mehreren Farben.",
  GEV: "Gesucht: verschiedene Teilchen – einige einfarbig, einige mehrfarbig.",
};

/** Welches Bild zeigt …? – Teilchenbilder als Antworten */
function bildWahl(): Task {
  const kind = pick(KINDS);
  for (;;) {
    const right = mixOf(kind, 5, 8);
    const others = shuffle(KINDS.filter(k => k !== kind)).slice(0, 3).map(k => ({ k, p: mixOf(k, 5, 8) }));
    const all = [right, ...others.map(o => o.p)];
    const keys = all.map(describe);
    if (new Set(keys).size < keys.length) continue;
    return {
      ...mc(keys[0], others.map((o, i) => confuse(o.k, kind, o.p, keys[i + 1]))),
      pics: Object.fromEntries(keys.map((k, i) => [k, all[i]])),
      prompt: `Welches Bild zeigt **${kind === "E" ? "ein Element" : kind === "V" ? "eine Verbindung" : `ein ${PICTURE_LABEL[kind]}`}**?`,
      hint: "Gleiche Teilchen = ein Stoff. Eine Atomsorte = Element, mehrere im Teilchen = Verbindung.",
      tip: WAHL_TIP[kind],
      explain: `${PICTURE_LABEL[kind]}: ${names(analyse(right.mix).stoffe)}.`,
    };
  }
}

function atomsorten(): Task {
  const m = someMix();
  const a = analyse(m.mix), n = a.atomsorten.length;
  return {
    kind: "num", answer: n, pic: m,
    traps: validTraps([
      { field: "n", value: a.stoffe.length, miss: "stoffe-statt-atomsorten", why: `**${a.stoffe.length}** sind die Stoffe. Gefragt sind die Atomsorten – die Farben der Kugeln.` },
      { field: "n", value: a.atome, miss: "atome-gezaehlt", why: `**${a.atome}** sind alle Atome. Jede Atomsorte zählt nur einmal.` },
    ] as Trap[], { n }),
    prompt: "Wie viele **Atomsorten** kommen im Bild vor?",
    hint: "Jede Atomsorte hat eine eigene Farbe. Zähle die verschiedenen Farben.",
    tip: "Achte nur auf die Kugelfarben, nicht auf die Teilchen. Jede Farbe zählt einmal. **Farben** zeigt die Namen.",
    explain: `Atomsorten: ${list(a.atomsorten.map(el => `${elementName(el)} (${el})`))} → **${n}**.`,
  };
}

/** Gemisch mit Elementen und Verbindungen – dort liegen die typischen Zählfehler */
const l2Mix = () => mixOf(pick<PictureKind>(["GEV", "GEV", "GEV", "GV", "GE"]));

function verbindungen(): Task {
  const m = l2Mix();
  const a = analyse(m.mix), v = a.verbindungen.length;
  const particles = m.mix.filter(([f]) => !isElement(f)).reduce((s, [, n]) => s + n, 0);
  return {
    kind: "num", answer: v, pic: m,
    traps: validTraps([
      { field: "n", value: a.stoffe.length, miss: "element-verbindung", why: `Nicht jeder Stoff ist eine Verbindung: ${names(a.elemente)} ${a.elemente.length === 1 ? "hat" : "haben"} nur eine Atomsorte.` },
      { field: "n", value: particles, miss: "teilchen-statt-stoffe", why: `**${particles}** sind die Teilchen von Verbindungen. Gefragt ist, wie viele **Stoffe** Verbindungen sind.` },
    ] as Trap[], { n: v }),
    prompt: "Wie viele der Stoffe im Bild sind **Verbindungen**?",
    hint: "Eine Verbindung hat mindestens zwei verschiedene Atomsorten in einem Teilchen.",
    tip: "Suche Teilchen mit mehreren Farben. Jede solche Teilchensorte ist eine Verbindung. Gleiche zählen einmal.",
    explain: a.verbindungen.length ? `Verbindungen: ${names(a.verbindungen)} → **${v}**.` : "Kein Teilchen hat zwei Atomsorten → **0** Verbindungen.",
  };
}

function elemente(): Task {
  const m = l2Mix();
  const a = analyse(m.mix), e = a.elemente.length;
  const particles = m.mix.filter(([f]) => isElement(f)).reduce((s, [, n]) => s + n, 0);
  return {
    kind: "num", answer: e, pic: m,
    traps: validTraps([
      { field: "n", value: a.atomsorten.length, miss: "atomsorten-statt-stoffe", why: `**${a.atomsorten.length}** sind die Atomsorten. Die Atome in Verbindungen sind keine eigenen Stoffe.` },
      { field: "n", value: particles, miss: "teilchen-statt-stoffe", why: `**${particles}** sind die einzelnen Atome. Gefragt ist, wie viele **Stoffe** Elemente sind.` },
    ] as Trap[], { n: e }),
    prompt: "Wie viele der Stoffe im Bild sind **Elemente**?",
    hint: "Ein Element hat nur eine Atomsorte – einzelne Atome, ein Gitter oder Moleküle wie O₂.",
    tip: "Suche Teilchen mit nur einer Farbe. Jede solche Teilchensorte ist ein Element. Gleiche zählen einmal.",
    explain: a.elemente.length ? `Elemente: ${names(a.elemente)} → **${e}**.` : "Jedes Teilchen hat mehrere Atomsorten → **0** Elemente.",
  };
}

const EINORDNEN = ["H2O", "He", "Ne", "Ar", "CO2", "CH4", "C2H5OH", "NH3", "H2O2", "CO", "H2S", "C12H26", "C12H22O11", "Cu", "Zn", "Fe", "Al"];

function einordnen(): Task {
  const f = pick(EINORDNEN);
  const els = analyse([[f, 1]]).atomsorten;
  const metal = METALS.includes(f);
  const pic: Pic = metal ? { mix: [[f, pick(LATTICE)]], state: "fest" } : { mix: [[f, isElement(f) ? int(5, 8) : f.length > 6 ? 3 : int(4, 6)]], state: "modell" };
  const name = shortName(f);
  const opts = isElement(f)
    ? mc("Element", [
      d("Verbindung", "element-verbindung", metal
        ? `Die ${f}-Atome sind im Gitter verbunden – aber alle gleich. Eine Atomsorte: Element.`
        : `${F(f)} besteht nur aus ${f}-Atomen. Eine Verbindung braucht mehrere Atomsorten.`),
      dis("Gemisch", "Alle Teilchen sind gleich – ein Reinstoff, kein Gemisch."),
    ], 3)
    : mc("Verbindung", [
      d("Element", "verbindung-element", `Ein ${F(f)}-Teilchen enthält ${list(els)} – mehrere Atomsorten: eine Verbindung.`),
      d("Gemisch", "verbindung-gemisch", "Die Atome sind im Teilchen fest verbunden, alle Teilchen sind gleich – kein Gemisch."),
    ], 3);
  return {
    ...opts, pic,
    prompt: `**${name}** (${F(f)}): Element, Verbindung oder Gemisch?`,
    hint: "Wie viele Atomsorten stecken in einem Teilchen?",
    tip: `Lies die Formel ${F(f)}: Jeder Großbuchstabe ist eine Atomsorte. Eine Sorte = Element, mehrere = Verbindung.`,
    explain: isElement(f)
      ? `${name}: nur ${elementName(els[0])}-Atome (${els[0]}) → **Element**${metal ? ", auch im Metallgitter" : ""}.`
      : `${name}: ${list(els)} in einem Teilchen → **Verbindung**.`,
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
  { name: "Messing", ans: HOMOGEN, ex: "messing", why: "Kupfer und Zink sind im Metall gleichmäßig verteilt.", trap: [REIN, "klar-reinstoff", "Messing ist eine Legierung aus Kupfer und Zink – zwei Stoffe."] },
  { name: "Erdgas", ans: HOMOGEN, ex: "erdgas", why: "Methan, Ethan und Kohlenstoffdioxid sind gleichmäßig gemischt.", trap: [REIN, "klar-reinstoff", "Erdgas enthält mehrere Stoffe, man sieht sie nur nicht."] },
  { name: "Schutzgas zum Schweißen", ans: HOMOGEN, ex: "schutzgas", why: "Argon und Kohlenstoffdioxid sind gleichmäßig gemischt.", trap: [REIN, "klar-reinstoff", "Argon und Kohlenstoffdioxid sind zwei Stoffe, auch wenn man nichts sieht."] },
  { name: "Luft", ans: HOMOGEN, why: "Gase mischen sich immer vollständig.", trap: [REIN, "klar-reinstoff", "Luft besteht aus Stickstoff, Sauerstoff, Argon und mehr."] },
  { name: "Wasser", ans: REIN, ex: "wasser", why: "Alle Teilchen sind gleich: H₂O.", trap: [HOMOGEN, "verbindung-gemisch", "Wasser ist eine Verbindung aus H und O – aber nur ein Stoff."] },
  { name: "Helium im Luftballon", ans: REIN, ex: "helium", why: "Nur Helium-Atome – ein Stoff." },
  { name: "Milch", ans: HETEROGEN, why: "Unter dem Mikroskop sieht man Fetttröpfchen im Wasser.", trap: [HOMOGEN, "sieht-einheitlich", "Milch sieht einheitlich aus, enthält aber winzige Fetttröpfchen."] },
  { name: "Granit", ans: HETEROGEN, why: "Man sieht verschiedene Körner (Quarz, Feldspat, Glimmer).", trap: [HOMOGEN, "sieht-einheitlich", "Die verschiedenen Körner sind mit freiem Auge zu sehen."] },
  { name: "Nebel", ans: HETEROGEN, why: "Winzige Wassertröpfchen schweben in der Luft.", trap: [HOMOGEN, "sieht-einheitlich", "Nebel besteht aus Tröpfchen in Luft – zwei Phasen."] },
  { name: "Sand in Wasser", ans: HETEROGEN, why: "Der Sand löst sich nicht und sinkt ab." },
  { name: "Meerwasser (gefiltert)", ans: HOMOGEN, why: "Das Salz ist im Wasser gelöst.", trap: [REIN, "klar-reinstoff", "Im Meerwasser sind Salze gelöst – kein Reinstoff."] },
  { name: "Orangensaft mit Fruchtfleisch", ans: HETEROGEN, why: "Die Fruchtfleisch-Stücke sind zu sehen." },
  { name: "Rauch", ans: HETEROGEN, why: "Feste Rußteilchen schweben in der Luft.", trap: [HOMOGEN, "sieht-einheitlich", "Rauch enthält feste Teilchen in Luft – zwei Phasen."] },
  { name: "Tee mit Zucker", ans: HOMOGEN, why: "Zucker und Teestoffe sind gelöst.", trap: [HETEROGEN, "geloest-heterogen", "Der Zucker ist gelöst – man sieht keine Teile mehr."] },
  { name: "Essig", ans: HOMOGEN, why: "Essigsäure ist in Wasser gelöst.", trap: [REIN, "klar-reinstoff", "Essig ist klar, enthält aber Essigsäure und Wasser."] },
  { name: "Cola ohne Blasen", ans: HOMOGEN, why: "Zucker, Farbstoffe und Gas sind gelöst.", trap: [HETEROGEN, "geloest-heterogen", "Man sieht keine Teile – alles ist gelöst."] },
  { name: "Weißwein", ans: HOMOGEN, why: "Alkohol, Zucker und Säuren sind im Wasser gelöst.", trap: [REIN, "klar-reinstoff", "Wein ist klar – aber ein Gemisch aus vielen Stoffen."] },
  { name: "Edelstahl", ans: HOMOGEN, why: "Eisen, Chrom und Nickel sind gleichmäßig gemischt.", trap: [REIN, "klar-reinstoff", "Edelstahl ist eine Legierung aus mehreren Metallen."] },
  { name: "Salatdressing aus Öl und Essig", ans: HETEROGEN, why: "Öltröpfchen schwimmen im Essig und trennen sich wieder.", trap: [HOMOGEN, "entmischt-homogen", "Öl und Essig mischen sich nicht – nach einer Weile bilden sich Schichten."] },
  { name: "Kakao mit Pulver am Boden", ans: HETEROGEN, why: "Ungelöstes Pulver sinkt ab.", trap: [HOMOGEN, "sieht-einheitlich", "Am Boden sieht man Pulver – also zwei Phasen."] },
  { name: "Schlamm", ans: HETEROGEN, why: "Erde schwebt im Wasser und setzt sich ab." },
  { name: "Sahne", ans: HETEROGEN, why: "Viele Fetttröpfchen in Wasser.", trap: [HOMOGEN, "sieht-einheitlich", "Sahne sieht einheitlich aus – unter dem Mikroskop sieht man Fetttröpfchen."] },
  { name: "Schaumbad", ans: HETEROGEN, why: "Luftblasen im Wasser." },
  { name: "Müsli", ans: HETEROGEN, why: "Man sieht Flocken, Nüsse und Rosinen." },
];

/** Tipp nach der typischen Fehlvorstellung des Beispiels */
const HOMOGEN_TIP: Record<string, string> = {
  "klar-reinstoff": "Klar heißt nicht rein. Zähle auf, was alles darin steckt.",
  "sieht-einheitlich": "Denk ans Mikroskop: Wären dort Tröpfchen, Körner oder Blasen zu sehen?",
  "geloest-heterogen": "Gelöstes sieht man nicht mehr. Gibt es irgendwo eine Grenze?",
  "entmischt-homogen": "Lass es eine Weile stehen. Bilden sich Schichten?",
  "verbindung-gemisch": "Wie viele verschiedene Teilchen gibt es? Eine Verbindung ist ein Stoff.",
};

function homogen(): Task {
  const e = pick(EVERYDAY);
  const others = [HOMOGEN, HETEROGEN, REIN].filter(o => o !== e.ans && o !== e.trap?.[0]);
  return {
    ...mc(e.ans, [...(e.trap ? [d(e.trap[0], e.trap[1], e.trap[2])] : []), ...others], 3, e.why),
    ...(e.ex ? { pic: exPic(e.ex) } : {}),
    prompt: `Was ist **${e.name}**?`,
    hint: "Homogen: überall gleich, keine Grenze. Heterogen: Teile oder Schichten sind zu erkennen.",
    tip: HOMOGEN_TIP[e.trap?.[1] ?? ""] ?? `Stell dir ${e.name} im Glas vor. Siehst du Teile, Tröpfchen oder Schichten?`,
    explain: `${e.name}: **${e.ans}**. ${e.why}`,
  };
}

const ARTEN = ["Lösung", "Legierung", "Gasgemisch", "Emulsion", "Suspension", "Gemenge", "Nebel", "Rauch", "Schaum"];
interface Art { name: string; ans: string; why: string; traps: [string, string, string][] }
const ZUSTAND = "zustand-verwechselt";
const GEMISCHARTEN: Art[] = [
  { name: "Zuckerwasser", ans: "Lösung", why: "Fester Zucker, gelöst in Wasser.", traps: [["Suspension", "geloest-heterogen", "Der Zucker ist gelöst, nicht als Körner verteilt – eine Lösung."]] },
  { name: "Salzwasser", ans: "Lösung", why: "Salz ist in Wasser gelöst.", traps: [["Suspension", "geloest-heterogen", "Das Salz ist gelöst – man sieht keine Körner."]] },
  { name: "Sprudelwasser ohne Blasen", ans: "Lösung", why: "Das Gas ist im Wasser gelöst.", traps: [["Schaum", "geloest-heterogen", "Ohne Blasen ist das Gas gelöst – kein Schaum."]] },
  { name: "Alkohol und Wasser", ans: "Lösung", why: "Zwei Flüssigkeiten, vollständig gemischt.", traps: [["Emulsion", "geloest-heterogen", "Alkohol und Wasser mischen sich ganz – keine Tröpfchen."]] },
  { name: "Messing", ans: "Legierung", why: "Zwei Metalle, gleichmäßig gemischt.", traps: [["Gemenge", "sieht-einheitlich", "Kupfer und Zink sind bis zu den Atomen gemischt – eine Legierung."]] },
  { name: "Bronze", ans: "Legierung", why: "Kupfer und Zinn, gleichmäßig gemischt.", traps: [["Gemenge", "sieht-einheitlich", "Die Metalle sind bis zu den Atomen gemischt – eine Legierung."]] },
  { name: "Luft", ans: "Gasgemisch", why: "Mehrere Gase, vollständig gemischt.", traps: [["Nebel", ZUSTAND, "Nebel hat Wassertröpfchen. Klare Luft ist nur Gas."]] },
  { name: "Erdgas", ans: "Gasgemisch", why: "Methan, Ethan und andere Gase, gemischt.", traps: [["Rauch", ZUSTAND, "Rauch enthält feste Teilchen. Erdgas ist nur Gas."]] },
  { name: "Milch", ans: "Emulsion", why: "Fetttröpfchen in Wasser.", traps: [["Lösung", "sieht-einheitlich", "Milch sieht einheitlich aus, hat aber Fetttröpfchen."], ["Suspension", ZUSTAND, "Das Fett in Milch ist flüssig – also Tröpfchen, keine Körner."]] },
  { name: "Mayonnaise", ans: "Emulsion", why: "Öltröpfchen in Wasser (mit Ei).", traps: [["Suspension", ZUSTAND, "Öl ist flüssig – also Tröpfchen, keine festen Körner."]] },
  { name: "geschütteltes Öl und Wasser", ans: "Emulsion", why: "Öltröpfchen im Wasser – bis sie wieder aufsteigen.", traps: [["Lösung", "entmischt-homogen", "Öl löst sich nicht in Wasser – es bildet Tröpfchen."], ["Suspension", ZUSTAND, "Öl ist flüssig – Tröpfchen, keine Körner."]] },
  { name: "Sand in Wasser", ans: "Suspension", why: "Feste Körner in einer Flüssigkeit.", traps: [["Emulsion", ZUSTAND, "Sand ist fest – das sind Körner, keine Tröpfchen."], ["Lösung", "klar-reinstoff", "Sand löst sich nicht – man sieht die Körner."]] },
  { name: "Orangensaft mit Fruchtfleisch", ans: "Suspension", why: "Feste Stückchen im Saft.", traps: [["Emulsion", ZUSTAND, "Fruchtfleisch ist fest – das sind Stückchen, keine Tröpfchen."]] },
  { name: "Granit", ans: "Gemenge", why: "Verschiedene feste Körner nebeneinander.", traps: [["Legierung", "sieht-einheitlich", "Die Körner im Granit sieht man – nicht bis zu den Atomen gemischt."]] },
  { name: "Müsli", ans: "Gemenge", why: "Feste Teile nebeneinander.", traps: [["Suspension", ZUSTAND, "Im Müsli ist keine Flüssigkeit – nur feste Teile."]] },
  { name: "Nebel", ans: "Nebel", why: "Flüssige Tröpfchen in Luft.", traps: [["Rauch", ZUSTAND, "Rauch hat feste Teilchen, Nebel flüssige Tröpfchen."]] },
  { name: "Rauch", ans: "Rauch", why: "Feste Teilchen in Luft.", traps: [["Nebel", ZUSTAND, "Nebel hat flüssige Tröpfchen, Rauch feste Teilchen."]] },
  { name: "Schlagsahne", ans: "Schaum", why: "Luftblasen in einer Flüssigkeit.", traps: [["Emulsion", ZUSTAND, "In Schlagsahne stecken Luftblasen – ein Gas in Flüssigkeit."]] },
  { name: "Seifenschaum", ans: "Schaum", why: "Luftblasen in Seifenwasser.", traps: [["Nebel", ZUSTAND, "Beim Nebel ist die Flüssigkeit im Gas – hier ist es umgekehrt."]] },
  { name: "Essig", ans: "Lösung", why: "Essigsäure ist in Wasser gelöst.", traps: [["Emulsion", "geloest-heterogen", "Essigsäure mischt sich ganz mit Wasser – keine Tröpfchen."]] },
  { name: "Tinte", ans: "Lösung", why: "Farbstoff ist in Wasser gelöst.", traps: [["Suspension", "geloest-heterogen", "Der Farbstoff ist gelöst – es setzt sich nichts ab."]] },
  { name: "Weißgold", ans: "Legierung", why: "Gold mit anderen Metallen, gleichmäßig gemischt.", traps: [["Gemenge", "sieht-einheitlich", "Die Metalle sind bis zu den Atomen gemischt – eine Legierung."]] },
  { name: "Lötzinn", ans: "Legierung", why: "Zinn mit anderen Metallen, gleichmäßig gemischt.", traps: [["Gemenge", "sieht-einheitlich", "Die Metalle sind bis zu den Atomen gemischt – eine Legierung."]] },
  { name: "Autoabgas ohne Ruß", ans: "Gasgemisch", why: "Mehrere Gase, vollständig gemischt.", traps: [["Rauch", ZUSTAND, "Ohne Ruß sind keine festen Teilchen darin – nur Gase."]] },
  { name: "Salatdressing aus Öl und Essig", ans: "Emulsion", why: "Öltröpfchen im Essig.", traps: [["Lösung", "entmischt-homogen", "Öl löst sich nicht in Essig – es bildet Tröpfchen."]] },
  { name: "Handcreme", ans: "Emulsion", why: "Fetttröpfchen und Wasser, fein verteilt.", traps: [["Lösung", "sieht-einheitlich", "Creme sieht einheitlich aus, besteht aber aus Tröpfchen."]] },
  { name: "Kakao mit Pulver am Boden", ans: "Suspension", why: "Feste Pulverkörner in Milch.", traps: [["Emulsion", ZUSTAND, "Kakaopulver ist fest – Körner, keine Tröpfchen."]] },
  { name: "Schlamm", ans: "Suspension", why: "Feste Erdteilchen im Wasser.", traps: [["Emulsion", ZUSTAND, "Erde ist fest – Körner, keine Tröpfchen."]] },
  { name: "Sand und Kies", ans: "Gemenge", why: "Feste Körner verschiedener Größe.", traps: [["Legierung", "sieht-einheitlich", "Legierungen sind Metalle, bis zu den Atomen gemischt. Hier sieht man Körner."]] },
  { name: "Wolke", ans: "Nebel", why: "Wassertröpfchen in Luft.", traps: [["Rauch", ZUSTAND, "Wolken bestehen aus flüssigen Tröpfchen – nicht aus festen Teilchen."]] },
  { name: "Staub in der Luft", ans: "Rauch", why: "Feste Teilchen schweben in Luft.", traps: [["Nebel", ZUSTAND, "Staub ist fest – Nebel hat flüssige Tröpfchen."]] },
  { name: "Bierschaum", ans: "Schaum", why: "Gasblasen in einer Flüssigkeit.", traps: [["Emulsion", ZUSTAND, "Im Schaum stecken Gasblasen, keine Tröpfchen."]] },
];

/** Tipp: Entscheidung nach dem Stoff, in dem verteilt wird */
const IN_FLUESSIG = "In einer Flüssigkeit: gelöst = Lösung, Tröpfchen = Emulsion, Körner = Suspension, Blasen = Schaum.";
const IN_GAS = "In einem Gas: nur Gase = Gasgemisch, Tröpfchen = Nebel, feste Teilchen = Rauch.";
const NUR_FEST = "Nur Feststoffe: Metalle bis zu den Atomen gemischt = Legierung, sichtbare Körner = Gemenge.";
const ART_TIP: Record<string, string> = {
  "Lösung": IN_FLUESSIG, Emulsion: IN_FLUESSIG, Suspension: IN_FLUESSIG, Schaum: IN_FLUESSIG,
  Gasgemisch: IN_GAS, Nebel: IN_GAS, Rauch: IN_GAS, Legierung: NUR_FEST, Gemenge: NUR_FEST,
};

function gemischart(): Task {
  const g = pick(GEMISCHARTEN);
  return {
    ...mc(g.ans, [...g.traps.map(([t, k, w]) => d(t, k, w)), ...shuffle(ARTEN.filter(a => a !== g.ans))], 4, g.why),
    prompt: `Welche Art von Gemisch ist **${g.name}**?`,
    hint: "Welche Zustände sind gemischt – fest, flüssig, gasförmig? Sieht man Teile?",
    tip: ART_TIP[g.ans],
    explain: `${g.name}: **${g.ans}**. ${g.why}`,
  };
}

interface Stoff { name: string; ans: "Element" | "Verbindung" | "Gemisch"; why: string; trap?: [string, string, string]; tip?: string }
const ALLTAG: Stoff[] = [
  { name: "Gold", ans: "Element", why: "Nur Gold-Atome." },
  { name: "Kupfer", ans: "Element", why: "Nur Kupfer-Atome im Gitter.", trap: ["Verbindung", "element-verbindung", "Die Kupfer-Atome sind verbunden – aber alle gleich. Eine Atomsorte: Element."] },
  { name: "Eisen", ans: "Element", why: "Nur Eisen-Atome im Gitter.", trap: ["Verbindung", "element-verbindung", "Die Eisen-Atome sind verbunden – aber alle gleich. Eine Atomsorte: Element."] },
  { name: "Helium", ans: "Element", why: "Nur Helium-Atome." },
  { name: "Neon in der Leuchtreklame", ans: "Element", why: "Nur Neon-Atome." },
  { name: "Diamant", ans: "Element", tip: "Diamant ist aus Kohlenstoff (C). Wie viele Atomsorten sind das?", why: "Nur Kohlenstoff-Atome, fest verbunden.", trap: ["Verbindung", "element-verbindung", "Im Diamant sind nur C-Atome verbunden – eine Atomsorte: Element."] },
  { name: "Wasser (H₂O)", ans: "Verbindung", why: "H und O fest verbunden, alle Teilchen gleich.", trap: ["Gemisch", "verbindung-gemisch", "Wasser enthält H und O – aber in jedem Teilchen fest verbunden. Ein Stoff."] },
  { name: "Kohlenstoffdioxid (CO₂)", ans: "Verbindung", why: "C und O fest verbunden.", trap: ["Element", "verbindung-element", "CO₂ hat zwei Atomsorten (C und O) – eine Verbindung."] },
  { name: "Haushaltszucker", ans: "Verbindung", tip: "Alle Zuckerteilchen sind gleich. Ein Teilchen enthält C, H und O.", why: "C, H und O fest verbunden, alle Teilchen gleich.", trap: ["Gemisch", "verbindung-gemisch", "Zucker besteht aus gleichen Teilchen – ein Reinstoff, und zwar eine Verbindung."] },
  { name: "Kochsalz (NaCl)", ans: "Verbindung", why: "Natrium und Chlor fest verbunden (Ionen).", trap: ["Gemisch", "verbindung-gemisch", "Kochsalz ist ein Reinstoff aus Na⁺ und Cl⁻ – eine Verbindung."] },
  { name: "Methan (CH₄)", ans: "Verbindung", why: "C und H fest verbunden.", trap: ["Element", "verbindung-element", "CH₄ hat zwei Atomsorten (C und H) – eine Verbindung."] },
  { name: "Luft", ans: "Gemisch", why: "Stickstoff, Sauerstoff, Argon und mehr.", trap: ["Verbindung", "klar-reinstoff", "Luft enthält mehrere Stoffe, die nicht verbunden sind."] },
  { name: "Leitungswasser", ans: "Gemisch", why: "Im Wasser sind Salze und Gase gelöst.", trap: ["Verbindung", "klar-reinstoff", "Leitungswasser ist klar, enthält aber gelöste Stoffe."] },
  { name: "Messing", ans: "Gemisch", why: "Kupfer und Zink gemischt (Legierung).", trap: ["Verbindung", "legierung-verbindung", "Kupfer und Zink sind nur gemischt, nicht zu einem neuen Stoff verbunden."] },
  { name: "Bronze", ans: "Gemisch", why: "Kupfer und Zinn gemischt (Legierung).", trap: ["Element", "nur-elemente-rein", "Bronze enthält zwei Elemente – Kupfer und Zinn. Zwei Stoffe: ein Gemisch."] },
  { name: "Stahl", ans: "Gemisch", why: "Eisen mit etwas Kohlenstoff (Legierung).", trap: ["Element", "nur-elemente-rein", "Stahl enthält Eisen und Kohlenstoff – zwei Stoffe: ein Gemisch."] },
  { name: "Zuckerwasser", ans: "Gemisch", why: "Zucker in Wasser gelöst.", trap: ["Verbindung", "klar-reinstoff", "Zuckerwasser ist klar – aber zwei Stoffe: Zucker und Wasser."] },
  { name: "Schutzgas aus Argon und CO₂", ans: "Gemisch", why: "Zwei Gase gemischt.", trap: ["Verbindung", "gemisch-verbindung", "Argon und CO₂ sind nicht verbunden – nur gemischt."] },
  { name: "Silber", ans: "Element", why: "Nur Silber-Atome im Gitter.", trap: ["Verbindung", "element-verbindung", "Die Silber-Atome sind verbunden – aber alle gleich. Eine Atomsorte: Element."] },
  { name: "Aluminium", ans: "Element", why: "Nur Aluminium-Atome im Gitter." },
  { name: "Argon in der Glühlampe", ans: "Element", why: "Nur Argon-Atome." },
  { name: "Ammoniak (NH₃)", ans: "Verbindung", why: "N und H fest verbunden.", trap: ["Gemisch", "verbindung-gemisch", "NH₃-Teilchen sind alle gleich – N und H sind im Teilchen verbunden."] },
  { name: "reiner Alkohol (Ethanol)", ans: "Verbindung", tip: "Alle Ethanol-Teilchen sind gleich. Ein Teilchen enthält C, H und O.", why: "C, H und O fest verbunden, alle Teilchen gleich.", trap: ["Gemisch", "verbindung-gemisch", "Ethanol besteht aus gleichen Teilchen – ein Stoff mit drei Atomsorten."] },
  { name: "Kalk (CaCO₃)", ans: "Verbindung", why: "Ca, C und O fest verbunden.", trap: ["Element", "verbindung-element", "CaCO₃ hat drei Atomsorten – eine Verbindung."] },
  { name: "Rost (Fe₂O₃)", ans: "Verbindung", why: "Eisen und Sauerstoff fest verbunden.", trap: ["Gemisch", "verbindung-gemisch", "Im Rost sind Fe und O verbunden – ein neuer Stoff, kein Gemisch."] },
  { name: "Meerwasser", ans: "Gemisch", why: "Salze sind im Wasser gelöst.", trap: ["Verbindung", "klar-reinstoff", "Meerwasser enthält Wasser und viele Salze – mehrere Stoffe."] },
  { name: "Mineralwasser", ans: "Gemisch", why: "Mineralstoffe und Gas sind gelöst.", trap: ["Verbindung", "klar-reinstoff", "Mineralwasser ist klar, enthält aber gelöste Stoffe."] },
  { name: "Weißgold", ans: "Gemisch", why: "Gold mit anderen Metallen (Legierung).", trap: ["Element", "nur-elemente-rein", "Weißgold enthält mehrere Metalle – mehrere Stoffe: ein Gemisch."] },
];

function alltag(): Task {
  const s = pick(ALLTAG);
  const label = (x: string) => (x === "Gemisch" ? GEMISCH : x === "Element" ? REIN_E : REIN_V);
  const others = ["Element", "Verbindung", "Gemisch"].filter(o => o !== s.ans && o !== s.trap?.[0]).map(label);
  return {
    ...mc(label(s.ans), [...(s.trap ? [d(label(s.trap[0]), s.trap[1], s.trap[2])] : []), ...others], 3, s.why),
    prompt: `**${s.name}**: Reinstoff oder Gemisch? Element oder Verbindung?`,
    hint: "Ein Stoff oder mehrere? Wenn einer: eine Atomsorte oder mehrere?",
    tip: s.tip ?? (/\(.*[A-Z].*\)/.test(s.name) ? "Lies die Formel: Jeder Großbuchstabe ist eine Atomsorte."
      : s.ans === "Gemisch" ? `Zähle auf, was alles in ${s.name} steckt. Mehr als ein Stoff?`
      : `Steht ${s.name.split(" ")[0]} im Periodensystem? Dann ist es eine Atomsorte.`),
    explain: `${s.name}: **${label(s.ans)}**. ${s.why}`,
  };
}

/** „rein“ im Alltag heißt „nichts dazugegeben“ – in der Chemie heißt Reinstoff „nur ein Stoff“ */
const REIN_ALLTAG: { label: string; ans: "Gemisch" | "Reinstoff"; why: string; other?: [string, string] }[] = [
  { label: "„100 % reiner Orangensaft“", ans: "Gemisch", why: "Saft enthält Wasser, Zucker, Säuren und Farbstoffe." },
  { label: "„reines Mineralwasser“", ans: "Gemisch", why: "Im Wasser sind Mineralstoffe gelöst." },
  { label: "„reines Olivenöl“", ans: "Gemisch", why: "Öl ist ein Gemisch aus vielen Fetten." },
  { label: "„reiner Bienenhonig“", ans: "Gemisch", why: "Honig enthält Zucker, Wasser und viele andere Stoffe." },
  { label: "„reine Bergluft“", ans: "Gemisch", why: "Luft besteht aus Stickstoff, Sauerstoff, Argon und mehr." },
  { label: "„reine Butter“", ans: "Gemisch", why: "Butter enthält Fett, Wasser und Eiweiß." },
  { label: "„destilliertes Wasser“", ans: "Reinstoff", why: "Beim Destillieren bleiben die gelösten Stoffe zurück. Übrig ist nur H₂O.", other: ["Lösung", "In destilliertem Wasser ist nichts gelöst."] },
  { label: "„reiner Apfelsaft“", ans: "Gemisch", why: "Saft enthält Wasser, Zucker, Säuren und Aromastoffe." },
  { label: "„reines Quellwasser“", ans: "Gemisch", why: "Auch Quellwasser enthält gelöste Mineralstoffe." },
  { label: "„Sterlingsilber 925“", ans: "Gemisch", why: "Silber mit Kupfer – eine Legierung." },
  { label: "„reines Kokosfett“", ans: "Gemisch", why: "Fett ist ein Gemisch aus vielen verschiedenen Fetten." },
  { label: "„Feingold 999,9“", ans: "Reinstoff", why: "Fast nur Gold-Atome – so gut wie ein Reinstoff.", other: ["Legierung", "Eine Legierung wäre Gold mit anderen Metallen. Feingold ist fast reines Gold."] },
];

function reinAlltag(): Task {
  const s = pick(REIN_ALLTAG);
  const opts = s.ans === "Gemisch"
    ? mc("Gemisch", [
      d("Reinstoff", "alltag-rein", "„Rein“ heißt im Alltag: nichts dazugegeben. Chemisch sind es trotzdem mehrere Stoffe."),
      d("Verbindung", "alltag-rein", "Die Stoffe sind nur gemischt, nicht verbunden. „Rein“ meint hier: nichts dazugegeben."),
    ], 3, s.why)
    : mc("Reinstoff", [dis("Gemisch", s.why), dis(s.other![0], s.other![1])], 3, s.why);
  return {
    ...opts,
    prompt: `Auf der Packung steht ${s.label}. Was ist das chemisch?`,
    hint: "Reinstoff heißt in der Chemie: nur **ein** Stoff, nur eine Teilchensorte.",
    tip: "„Rein“ auf der Packung heißt: nichts dazugegeben. Chemisch zählt nur: Wie viele Stoffe stecken darin?",
    explain: `${s.label}: **${s.ans}**. ${s.why}`,
  };
}

// ── Level 4: Lösen und Mischen im Teilchenmodell ────────────────────────────────

const LOESEN = [
  { id: "zucker", what: "Zucker löst sich in Wasser.", f: "C12H22O11", who: "Zuckerteilchen" },
  { id: "alkohol", what: "Alkohol mischt sich mit Wasser.", f: "C2H5OH", who: "Alkoholteilchen" },
];
// Sprudel nicht: dort reagiert ein kleiner Teil des CO₂ mit Wasser zu Kohlensäure (Probieren zeigt das)

/** Was passiert mit den Teilchen beim Lösen? */
function wohin(): Task {
  const s = pick(LOESEN);
  return {
    ...mc("Sie verteilen sich zwischen den Wasserteilchen.", [
      d("Sie verschwinden.", "verschwindet", `Die ${s.who} sind noch da – verteilt und zu klein zum Sehen.`),
      s.id === "zucker" ? d("Sie schmelzen.", "loesen-schmelzen", "Schmelzen braucht Hitze. Beim Lösen lösen sich die Teilchen nur voneinander.") : null,
      d("Sie werden kleiner.", "teilchen-veraendert", `Die ${s.who} bleiben gleich groß. Sie verteilen sich nur.`),
      d("Sie sinken alle nach unten.", "geloest-unten", "Die Teilchen bewegen sich ständig und verteilen sich überall – auch oben."),
    ], 3, "Genau: gleich viele Teilchen, nur überall verteilt."),
    pic: exPic(s.id, "vorher"),
    prompt: `${s.what} Was passiert mit den **${s.who}**?`,
    hint: "Teilchen verschwinden nicht und ändern sich beim Mischen nicht.",
    tip: `Die ${s.who} bleiben, wie sie sind. Sie bewegen sich ständig. Wohin können sie im Wasser?`,
    explain: `Die ${s.who} lösen sich voneinander und verteilen sich **zwischen den Wasserteilchen**. Es sind gleich viele wie vorher.`,
  };
}

/** Wie viele gelöste Teilchen sind nachher im Wasser? (Teilchen bleiben erhalten) */
function erhalten(): Task {
  const s = pick(LOESEN);
  const water = int(10, 14), k = int(3, 6);
  const mix: [string, number][] = [["H2O", water], [s.f, k]];
  const traps = validTraps([
    { field: "n", value: 0, miss: "verschwindet", why: `Die ${s.who} verschwinden nicht. Sie verteilen sich nur im Wasser.` },
    { field: "n", value: water, miss: "sorten-uebersehen", why: `**${water}** sind die Wasserteilchen. Gefragt sind die ${s.who}.` },
    { field: "n", value: water + k, miss: "teilchen-statt-stoffe", why: `**${water + k}** sind alle Teilchen. Gefragt sind nur die ${s.who}.` },
  ] as Trap[], { n: k });
  return {
    kind: "num", answer: k, traps,
    pic: exPic(s.id, "vorher", mix),
    prompt: `So sieht es **vorher** aus. Wie viele **${s.who}** sind im Wasser, wenn alles gemischt ist?`,
    hint: "Beim Mischen geht kein Teilchen verloren.",
    tip: `Zähle nur die ${s.who} im Bild. Beim Mischen geht keines verloren und keines kommt dazu.`,
    explain: `Vorher ${k}, nachher **${k}** ${s.who}. Sie verteilen sich nur.`,
    praise: "Gleich viele Teilchen wie vorher – genau so ist es.",
  };
}

/** Masse beim Lösen bleibt erhalten */
function masse(): Task {
  const [stoff, what, solvent] = pick([["Zucker", "das Zuckerwasser", "Wasser"], ["Salz", "das Salzwasser", "Wasser"], ["Zucker", "der Tee", "Tee"]]);
  const w = pick([100, 150, 200, 250, 300, 400, 500]), z = pick([10, 20, 30, 40, 50]);
  const g = (x: number) => `${x} g`;
  return {
    ...mc(g(w + z), [
      d(g(w), "verschwindet", `Der ${stoff} ist noch da – nur verteilt. Seine ${z} g zählen mit.`),
      d(g(w + z / 2), "masse-aendert", "Die Teilchen werden beim Lösen nicht leichter. Die Masse bleibt gleich."),
      d(g(w + 2 * z), "masse-aendert", `Beim Lösen kommt nichts dazu. ${solvent} und ${stoff} zusammen wiegen genauso viel.`),
    ], 4, `${w} g + ${z} g = ${w + z} g.`),
    prompt: `In **${w} g** ${solvent} lösen sich **${z} g** ${stoff}. Wie schwer ist ${what} jetzt?`,
    hint: "Beim Lösen verschwinden keine Teilchen. Was bedeutet das für die Masse?",
    tip: `Der ${stoff} ist noch da, nur verteilt. Zähle beide Massen zusammen.`,
    explain: `Alle Teilchen sind noch da: ${w} g + ${z} g = **${w + z} g**.`,
  };
}

/** Was ist zwischen den Teilchen? – leerer Raum */
function zwischen(): Task {
  const s = pick([
    { of: "den Wasserteilchen", stuff: "Wasser", ex: "wasser" },
    { of: "den Heliumteilchen im Ballon", stuff: "Helium", ex: "helium" },
    { of: "den Kupfer- und Zinkatomen im Messing", stuff: "Messing", ex: "messing" },
    { of: "den Teilchen im Zuckerwasser", stuff: "Zuckerwasser", ex: "zucker" },
    { of: "den Argon- und CO₂-Teilchen im Schutzgas", stuff: "Schutzgas", ex: "schutzgas" },
  ]);
  return {
    ...mc("Nichts – leerer Raum", [
      d("Luft", "luft-dazwischen", "Luft besteht selbst aus Teilchen. Zwischen den Teilchen ist gar nichts."),
      d(s.stuff, "luft-dazwischen", `${s.stuff} **besteht** aus diesen Teilchen. Dazwischen ist nichts.`),
      d("Wasserdampf", "luft-dazwischen", "Auch Wasserdampf besteht aus Teilchen. Zwischen den Teilchen ist leerer Raum."),
    ], 4, "Genau: Zwischen den Teilchen ist leerer Raum."),
    pic: exPic(s.ex),
    prompt: `Was ist zwischen ${s.of}?`,
    hint: "Ein Stoff besteht nur aus seinen Teilchen. Was bleibt dann für die Lücken?",
    tip: "Auch Luft und Wasserdampf bestehen aus Teilchen. Die passen nicht in die Lücken. Was bleibt übrig?",
    explain: "Zwischen den Teilchen ist **nichts** – leerer Raum. Auch Luft besteht aus Teilchen.",
  };
}

/** Teilchen bewegen sich ständig */
function bewegung(): Task {
  const s = pick([
    { q: "Warum mischen sich Alkohol und Wasser auch **ohne Rühren**?", ok: "Die Teilchen bewegen sich ständig.", pic: exPic("alkohol", "vorher"),
      w: [d("Tun sie nicht – ohne Rühren bleibt alles getrennt.", "teilchen-ruhen", "Die Teilchen bewegen sich ständig. Darum mischt es sich von selbst."),
        d("Die Teilchen werden größer und füllen alles aus.", "teilchen-veraendert", "Teilchen werden nicht größer. Sie bewegen sich und verteilen sich.")] },
    { q: "Die Trennwand zwischen Argon und CO₂ wird entfernt. Was passiert?", ok: "Die Gase mischen sich von selbst.", pic: exPic("schutzgas", "vorher"),
      w: [d("Nichts – man müsste schütteln.", "teilchen-ruhen", "Gasteilchen fliegen ständig umher. Sie mischen sich von selbst."),
        d("CO₂ sammelt sich unten, Argon oben.", "geloest-unten", "Die Teilchen bewegen sich ständig. Sie verteilen sich überall.")] },
    { q: "Bewegen sich die Atome in einem Stück **Messing**?", ok: "Ja, sie schwingen an ihrem Platz.", pic: exPic("messing"),
      w: [d("Nein, in festen Stoffen ruhen sie.", "teilchen-ruhen", "Auch im Festen bewegen sich die Teilchen – sie schwingen am Platz."),
        d("Nur wenn man das Messing erhitzt.", "teilchen-ruhen", "Die Teilchen schwingen immer. Beim Erhitzen schwingen sie nur stärker.")] },
    { q: "Warum fallen die Heliumteilchen im Ballon nicht einfach zu Boden?", ok: "Sie bewegen sich ständig und stoßen zusammen.", pic: exPic("helium"),
      w: [d("Luft zwischen den Teilchen hält sie fest.", "luft-dazwischen", "Zwischen den Teilchen ist nichts. Die Teilchen fliegen ständig umher."),
        d("Sie ruhen, bis man den Ballon schüttelt.", "teilchen-ruhen", "Gasteilchen bewegen sich immer – auch ohne Schütteln.")] },
    { q: "Ein Tropfen Tinte fällt in Wasser. Nach einer Stunde ist alles gefärbt. Warum?", ok: "Die Teilchen bewegen sich ständig und verteilen sich.",
      w: [d("Die Tinte wird immer mehr.", "teilchen-veraendert", "Es kommen keine Teilchen dazu. Die wenigen verteilen sich nur."),
        d("Die Tintenteilchen werden größer.", "teilchen-veraendert", "Teilchen werden nicht größer. Sie verteilen sich zwischen den Wasserteilchen.")] },
  ]);
  return {
    ...mc(s.ok, s.w, 3, "Genau: Teilchen sind ständig in Bewegung."),
    ...(s.pic ? { pic: s.pic } : {}),
    prompt: s.q,
    hint: "Stehen Teilchen je still?",
    tip: "Teilchen stehen nie still – im Gas fliegen sie, im Festen schwingen sie am Platz.",
    explain: "Teilchen bewegen sich **ständig** – im Gas frei, in Flüssigkeiten aneinander vorbei, im Festen am Platz.",
  };
}

/** Teilchen haben nicht die Eigenschaften des Stoffs (Farbe, flüssig, hart) */
function farbe(): Task {
  const s = pick([
    { q: "Kupfer ist rotbraun. Welche Farbe hat ein **einzelnes Kupferatom**?", ok: "Keine – Farbe hat erst der Stoff.",
      w: [d("Rotbraun wie Kupfer", "teilchen-wie-stoff", "Ein einzelnes Atom hat keine Farbe. Die Farbe entsteht erst durch sehr viele Atome."),
        d("Orange wie im Modell", "modell-echt", "Die Farben im Modell sind nur zur Unterscheidung. Atome selbst haben keine Farbe.")] },
    { q: "Zucker ist weiß. Welche Farbe hat ein **Zuckerteilchen**?", ok: "Keine – Farbe hat erst der Stoff.",
      w: [d("Weiß wie Zucker", "teilchen-wie-stoff", "Ein einzelnes Teilchen hat keine Farbe. Weiß ist der Stoff als Ganzes."),
        d("Schwarz, rot und weiß wie im Modell", "modell-echt", "Die Modellfarben zeigen nur die Atomsorten. Echte Teilchen haben keine Farbe.")] },
    { q: "Messing ist goldgelb. Welche Farbe haben die **Atome** darin?", ok: "Keine – Farbe hat erst der Stoff.",
      w: [d("Goldgelb", "teilchen-wie-stoff", "Atome haben keine Farbe. Goldgelb ist das Messing als Ganzes."),
        d("Orange und blaugrau wie im Modell", "modell-echt", "Die Modellfarben unterscheiden nur Kupfer und Zink. Atome haben keine Farbe.")] },
    { q: "Wasser ist flüssig. Sind die **Wasserteilchen** selbst flüssig?", ok: "Nein – nur der Stoff ist flüssig.",
      w: [d("Ja, sonst wäre Wasser nicht flüssig.", "teilchen-wie-stoff", "Flüssig heißt: Die Teilchen gleiten aneinander vorbei. Ein einzelnes Teilchen ist nicht flüssig."),
        d("Ja, sie sind kleine Tröpfchen.", "teilchen-wie-stoff", "Ein Tröpfchen besteht aus unzähligen Teilchen. Ein Teilchen ist kein Tröpfchen.")] },
    { q: "Eis ist fest, Wasser flüssig. Wie unterscheiden sich die Teilchen?", ok: "Gar nicht – nur Anordnung und Bewegung.",
      w: [d("Die Teilchen im Eis sind hart.", "teilchen-wie-stoff", "Es sind dieselben H₂O-Teilchen. Im Eis sitzen sie nur fest im Gitter."),
        d("Die Teilchen im Eis sind kleiner.", "teilchen-veraendert", "Die Teilchen bleiben gleich groß. Nur ihre Anordnung ändert sich.")] },
  ]);
  return {
    ...mc(s.ok, s.w, 3, "Genau: Teilchen haben nicht die Eigenschaften des Stoffs."),
    prompt: s.q,
    hint: "Hat ein einzelnes Teilchen dieselben Eigenschaften wie der ganze Stoff?",
    tip: /flüssig|fest/.test(s.q) ? "Fest und flüssig beschreiben, wie viele Teilchen zusammen liegen – nicht ein Teilchen."
      : "Die Farben im Modell sind nur ausgedacht. Farbe sieht man erst bei sehr vielen Teilchen.",
    explain: "Farbe, fest oder flüssig sind Eigenschaften des **Stoffs**. Ein einzelnes Teilchen hat sie nicht.",
  };
}

const NACHHER_TIP: Record<string, string> = {
  zucker: "Gelöste Teilchen verteilen sich überall – auch oben. Und es fehlt keines.",
  alkohol: "Alkohol mischt sich ganz mit Wasser. Es fehlt kein Teilchen.",
  oel: "Öl ist leichter als Wasser und mischt sich nicht mit ihm.",
  messing: "Die Atome sind beim Schmelzen wild durcheinander. So erstarren sie auch.",
  schutzgas: "Gasteilchen fliegen ständig umher. Sie bleiben nirgends unter sich.",
};

/** Welches Teilchenbild passt nachher? */
function nachher(): Task {
  const s = pick(["zucker", "alkohol", "oel", "messing", "schutzgas"]);
  const small: Record<string, [string, number][]> = {
    zucker: [["H2O", 12], ["C12H22O11", 3]], alkohol: [["H2O", 10], ["C2H5OH", 5]],
    oel: [["H2O", 10], ["C12H26", 5]], messing: [["Cu", 6], ["Zn", 2]], schutzgas: [["Ar", 5], ["CO2", 3]],
  };
  const p = (arrange: Arrange, m = small[s]): Pic => exPic(s, arrange, m, s === "schutzgas" ? "CO2" : undefined);
  const water: [string, number][] = [["H2O", sum(small[s])]];
  const cases: Record<string, { q: string; ok: string; wrong: [Pic, string, string][] }> = {
    zucker: { q: "Zucker hat sich in Wasser gelöst. Welches Bild zeigt das Zuckerwasser?", ok: "Genau: Die Zuckerteilchen sind überall verteilt.", wrong: [
      [p("unten"), "geloest-unten", "Gelöster Zucker verteilt sich überall – nicht nur unten."],
      [p("nachher", water), "verschwindet", "Hier fehlt der Zucker. Er ist noch da – nur gelöst."],
      [p("vorher"), "verschwindet", "Das ist vorher: Der Zucker ist noch ein Kristall."]] },
    alkohol: { q: "Alkohol und Wasser sind gemischt. Welches Bild passt?", ok: "Genau: Die Alkoholteilchen sind überall verteilt.", wrong: [
      [p("oben"), "geloest-heterogen", "Alkohol bleibt nicht als Schicht oben. Er mischt sich ganz mit Wasser."],
      [p("unten"), "geloest-unten", "Alkohol sammelt sich nicht unten. Er verteilt sich überall."],
      [p("nachher", water), "verschwindet", "Hier fehlt der Alkohol. Er ist noch da – nur verteilt."]] },
    oel: { q: "Öl und Wasser wurden geschüttelt. Wie sieht es nach einer Weile aus?", ok: "Genau: Öl und Wasser trennen sich wieder, Öl oben.", wrong: [
      [p("gemischt"), "oel-mischt", "Öl und Wasser mischen sich nicht. Das Öl steigt wieder auf."],
      [p("unten"), "oel-unten", "Öl ist leichter als Wasser. Es schwimmt oben."]] },
    messing: { q: "Kupfer und Zink wurden zusammen geschmolzen. Welches Bild zeigt das erstarrte Messing?", ok: "Genau: Die Atome sind zufällig gemischt.", wrong: [
      [p("getrennt"), "sieht-einheitlich", "Im Messing sind Kupfer und Zink bis zu den Atomen gemischt – nicht in Stücken."],
      [p("abwechselnd", [["Cu", 4], ["Zn", 4]]), "legierung-verbindung", "So ordentlich ist es nur in einer Verbindung. Im Messing sind die Atome zufällig gemischt."]] },
    schutzgas: { q: "Argon und CO₂ wurden gemischt. Welches Bild zeigt das Schutzgas nach einer Weile?", ok: "Genau: Die Gase sind gleichmäßig gemischt.", wrong: [
      [p("getrennt"), "teilchen-ruhen", "Die Gasteilchen bewegen sich ständig. Sie bleiben nicht getrennt."],
      [p("unten"), "geloest-unten", "Gase mischen sich vollständig – das CO₂ bleibt nicht unten."]] },
  };
  const c = cases[s];
  const all = [p("nachher"), ...c.wrong.map(w => w[0])];
  const keys = all.map(describe);
  return {
    ...mc(keys[0], c.wrong.map(([, miss, why], i) => d(keys[i + 1], miss, why)), 4, c.ok),
    pics: Object.fromEntries(keys.map((k, i) => [k, all[i]])),
    prompt: c.q,
    hint: s === "oel" ? "Mischen sich Öl und Wasser? Was schwimmt oben?" : "Teilchen verschwinden nicht und bewegen sich ständig.",
    tip: NACHHER_TIP[s],
    explain: s === "oel" ? "Öl und Wasser trennen sich wieder: **Öl oben**, Wasser unten." : "Die Teilchen sind **gleichmäßig verteilt** – und alle noch da.",
  };
}

// ── Level und Runden ─────────────────────────────────────────────────────────

const RAW: Record<string, () => Task> = {
  teilchen, stoffe, reinOderGemisch, reinGemisch, einordnen, bildArt, bildWahl, verbindungen, elemente, atomsorten,
  homogen, gemischart, alltag, reinAlltag, wohin, erhalten, masse, zwischen, bewegung, farbe, nachher,
};
/** neu würfeln, bis keine zwei Atomsorten ähnliche Farben haben */
const GENS: Record<string, () => Task> = Object.fromEntries(Object.entries(RAW).map(([id, gen]) => [id, () => {
  let t = gen();
  for (let k = 0; k < 60 && !distinctColors(t); k++) t = gen();
  return t;
}]));

export const TYPE_NAMES: Record<string, string> = {
  teilchen: "Teilchen zählen", stoffe: "Stoffe zählen", reinOderGemisch: "Reinstoff oder Gemisch", reinGemisch: "Reinstoff, Element oder Verbindung",
  einordnen: "Element oder Verbindung", bildArt: "Teilchenbild einordnen", bildWahl: "Teilchenbild auswählen",
  verbindungen: "Verbindungen zählen", elemente: "Elemente zählen", atomsorten: "Atomsorten zählen",
  homogen: "Homogen oder heterogen", gemischart: "Art des Gemischs", alltag: "Stoffe im Alltag", reinAlltag: "„Rein“ im Alltag",
  wohin: "Lösen im Teilchenmodell", erhalten: "Teilchen bleiben erhalten", masse: "Masse beim Lösen", zwischen: "Zwischen den Teilchen",
  bewegung: "Teilchen bewegen sich", farbe: "Teilchen und Stoff", nachher: "Nach dem Mischen",
};

/** `seq`: feste Reihenfolge der zehn Aufgaben (leicht → schwer), `cue`: Tipp auf die Aufgabe zugeschnitten und hervorgehoben */
interface Level extends QuizLevel { types: string[]; seq: string[]; cue: boolean }
const BASICS = ["teilchen", "stoffe", "atomsorten", "reinOderGemisch", "einordnen", "reinGemisch", "elemente", "verbindungen", "bildArt", "bildWahl"];
const EVERYDAY_SEQ = ["alltag", "alltag", "homogen", "homogen", "homogen", "gemischart", "gemischart", "gemischart", "reinAlltag", "reinAlltag"];
const SOLVING = ["wohin", "erhalten", "masse", "zwischen", "bewegung", "farbe", "nachher", "bewegung", "farbe", "nachher"];
const level = (n: number, name: string, desc: string, seq: string[], cue: boolean): Level =>
  ({ id: `gm-n${n}`, name, desc: cue ? `mit Tipp: ${desc}` : desc, seq, cue, tip: cue, types: [...new Set(seq)] });
export const LEVELS: Level[] = [
  level(1, "Teilchen und Stoffe", "Teilchen, Stoffe, Atomsorten, Element, Verbindung", BASICS, true),
  level(2, "Teilchen und Stoffe", "wie Niveau 1, Tipp nur allgemein", BASICS, false),
  level(3, "Gemische im Alltag", "Homogen oder heterogen, Arten von Gemischen, „rein“", EVERYDAY_SEQ, true),
  level(4, "Gemische im Alltag", "wie Niveau 3, Tipp nur allgemein", EVERYDAY_SEQ, false),
  level(5, "Lösen und Mischen", "Teilchen bleiben erhalten, bewegen sich, haben keine Farbe", SOLVING, true),
  level(6, "Lösen und Mischen", "wie Niveau 5, Tipp nur allgemein", SOLVING, false),
];

export const levelId = (_stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[level].id : `gm-${level}`);
export const levelName = (level: LevelKey) =>
  level === "mix" ? "Alles gemischt" : level === "weak" ? "Schwächen üben" : level === "due" ? "Heute fällig"
    : LEVELS[level].cue ? `${LEVELS[level].name} · mit Tipp` : LEVELS[level].name;

/** Tipp festlegen: zugeschnitten und hervorgehoben (cue) oder allgemein */
function withHint(t: Task, cue: boolean): Task {
  const { tip, ...rest } = t;
  return cue && tip ? { ...rest, hint: tip, hintCue: true } : rest;
}

/** Aufgaben in fester Reihenfolge, keine Frage doppelt (gleicher Typ → anderes Beispiel) */
function ordered(seq: string[], cue: boolean): Task[] {
  const seen = new Set<string>();
  const sig = (t: Task) => t.prompt + JSON.stringify(t.pic ?? t.pics ?? null);
  return seq.map(id => {
    let t = GENS[id]();
    for (let k = 0; k < 40 && seen.has(sig(t)); k++) t = GENS[id]();
    seen.add(sig(t));
    return { ...withHint(t, cue), type: id };
  });
}

export function makeRound(_stufe: string, level: LevelKey, stats?: TypeStats, due: string[] = []): Task[] {
  if (typeof level === "number") return ordered(LEVELS[level].seq, LEVELS[level].cue);
  let ids = level === "mix" ? [...new Set(LEVELS.flatMap(l => l.types))]
    : level === "weak" ? weakTypes(stats, id => LEVELS.some(l => l.types.includes(id)))
    : level === "due" ? due.filter(id => GENS[id])
    : LEVELS[0].types;
  if (!ids.length) ids = LEVELS[0].types;
  return buildRound(ids, GENS, 10).map(t => withHint(t, false));
}
