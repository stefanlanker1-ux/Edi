// Quiz-Aufgaben zu Reinstoffen und Gemischen (reine Daten, damit Runden gespeichert werden können). Aufgabentyp = Fertigkeit.
// Jede falsche Antwort steht für eine Fehlvorstellung (misconceptions.ts): d(text, schlüssel, rückmeldung), bei Zahlen Fallen.
// Bilder: Teilchenbild der Aufgabe (`pic`) oder Teilchenbilder als Antworten (`pics`, Schlüssel = Antworttext).
// Elemente kommen nur als einzelne Atome vor (Edelgase, Metallgitter).

import { toSubscript } from "@lern/chem";
import { buildRound, d, dis, mc, pick, shuffle, validTraps, weakTypes, type BaseTask, type Distractor, type LevelKey, type McTask, type QuizLevel, type Trap, type TypeStats } from "@lern/quiz";
import { EXAMPLES, PICTURE_LABEL, analyse, elementName, isElement, nameOf, shortName, small, type Before, type PictureKind, type State } from "../mixtures.ts";
import type { Method } from "../components/Separation.tsx";
import { K5_METHODS, K6_METHODS, trennEigenschaft, trennReihe, trennTipp, trennWahl, type MixKind } from "./trennen.ts";
import type { Arrange } from "../mixing.ts";
import { tr } from "@lern/i18n";

/** Teilchenbild: Stoffe mit Teilchenzahl, Zustand, Anordnung */
export interface Pic { mix: [string, number][]; state: State; floats?: string[]; before?: Before; solute?: string; arrange?: Arrange }
/** `tip`: auf die Aufgabe zugeschnittener Tipp (Level mit Tipp), sonst gilt der allgemeine `hint`;
 *  `sep`: Bild eines Trennverfahrens (t = −1 abspielen, sonst Standbild bei t); `mixPic`: Gemisch vor dem Trennen; `methods`: Antworten als Bildkarten der Verfahren */
type Extra = { pic?: Pic; pics?: Record<string, Pic>; tip?: string; sep?: { m: Method; t: number }; mixPic?: MixKind; methods?: boolean };
/** `tap`: Teil im Bild antippen – `parts` = antippbare Teile (Formeln im Teilchenbild bzw. Teile des Verfahrens), gemeldet als `values.pick` = Index */
export type Task = (McTask & Extra) | (BaseTask & Extra & { kind: "num"; answer: number }) | (BaseTask & Extra & { kind: "tap"; answer: string; parts: string[] });

const F = toSubscript;
const int = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const cnt = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")}${tr(" und ", " and ")}${xs[xs.length - 1]}`);
const names = (fs: string[]) => list(fs.map(f => `${tr(shortName(f), shortName(f).toLowerCase())} (${F(f)})`));
const nearNums = (x: number, min = 0) => [x + 1, x - 1, x + 2, x - 2, x + 3].filter(v => v >= min).map(String);
const sum = (m: [string, number][]) => m.reduce((s, [, n]) => s + n, 0);
/** Satzanfang groß (Namen stehen auch klein in den Daten: „eine Wolke“, englische Namen) */
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
/** englischer Artikel am Satzanfang vor einer Formel, die man buchstabiert: „An H₂O particle“, „A CO₂ particle“ */
const AN = (f: string) => (/^[AEFHILMNORSX]/.test(f) ? "An" : "A");
/** Antworttexte Element / Verbindung / Gemisch / Reinstoff */
const W = tr({ el: "Element", comp: "Verbindung", mix: "Gemisch", pure: "Reinstoff" }, { el: "Element", comp: "Compound", mix: "Mixture", pure: "Pure substance" });
const MIX_ATOMS = () => tr("Gemisch – verschiedene Atome", "Mixture – different atoms");
const LATTICE_SAME = (f: string) => tr(`Die ${f}-Atome sind im Gitter verbunden – aber alle gleich. Eine Atomsorte: Element.`, `The ${f} atoms are bonded in a lattice – but all the same. One kind of atom: element.`);
/** Legierung im Bild für Verbindung gehalten: Die Metallatome sind im Gitter verbunden, aber zufällig verteilt – zwei Elemente, gemischt */
const ALLOY_MIX = (els: string[]) => tr(`Die Atome sind im Gitter verbunden – aber ${list(els)} sitzen zufällig verteilt, ohne festes Verhältnis. Zwei Elemente, gemischt – keine Verbindung.`,
  `The atoms are bonded in the lattice – but ${list(els)} sit randomly, with no fixed ratio. Two elements, mixed – not a compound.`);
const ARRANGE_TEXT: Partial<Record<Arrange, string>> = tr({ vorher: "vorher", gemischt: "gemischt", unten: "unten", oben: "oben", getrennt: "getrennt", abwechselnd: "abwechselnd" },
  { vorher: "before", gemischt: "mixed", unten: "at the bottom", oben: "at the top", getrennt: "separate", abwechselnd: "alternating" });
/** kurze Beschreibung eines Teilchenbilds (Vorlesen, Schlüssel der Bild-Antworten) */
/** Begründung vor dem Ergebnis (Lösungsweg): „Feste Teilchen in Luft → Rauch“ */
const because = (why: string) => why.trim().replace(/[.!]$/, "");

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
/** Legierung, füllt ein Gitter ganz: Kupfer mit höchstens einem Drittel Zink (Messing, einphasig – Zink zufällig auf Plätzen des
 *  Kupfergitters). Andere Paare in beliebigem Verhältnis gibt es so nicht (Fe–Zn, Fe–Al, Cu–Al bilden intermetallische Phasen). */
function alloy(hi: number): [string, number][] {
  const n = pick(LATTICE.filter(x => x <= hi)), zn = int(2, Math.floor(n / 3));
  return shuffle<[string, number]>([["Cu", n - zn], ["Zn", zn]]);
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
    { field: "n", value: a.atome, miss: "atome-gezaehlt", why: tr(`**${a.atome}** sind alle Atome. Ein Molekül zählt als **ein** Teilchen, egal aus wie vielen Atomen.`, `**${a.atome}** is the number of all atoms. A molecule counts as **one** particle, however many atoms it has.`) },
    { field: "n", value: a.stoffe.length, miss: "stoffe-statt-teilchen", why: tr(`**${a.stoffe.length}** ist die Zahl der Stoffe. Gefragt sind alle Teilchen – auch gleiche einzeln zählen.`, `**${a.stoffe.length}** is the number of substances. The question asks for all particles – count identical ones individually too.`) },
  ] as Trap[], { n: a.teilchen });
  return {
    kind: "num", answer: a.teilchen, pic: m, traps,
    prompt: tr("Wie viele **Teilchen** sind im Bild?", "How many **particles** are in the picture?"),
    hint: tr("Ein Teilchen ist ein Molekül oder ein einzelnes Atom. Zähle jedes Teilchen einmal.", "A particle is a molecule or a single atom. Count each particle once."),
    tip: tr(`Zähle jede Sorte einzeln: ${list(m.mix.map(([f]) => F(f)))}. Dann zusammenzählen.${a.atome > a.teilchen ? " Ein Molekül zählt als 1." : ""}`, `Count each kind separately: ${list(m.mix.map(([f]) => F(f)))}. Then add them up.${a.atome > a.teilchen ? " A molecule counts as 1." : ""}`),
    explain: `${m.mix.map(([f, n]) => `${n} × ${F(f)}`).join(" + ")} = **${a.teilchen} ${tr("Teilchen", a.teilchen === 1 ? "particle" : "particles")}**.`,
    praise: praiseFor(m.mix),
  };
}

/** Lob passend zum Bild: einzelne Atome (Edelgase, Metalle) heißen nicht Molekül */
function praiseFor(mix: [string, number][]) {
  const single = mix.map(([f]) => analyse([[f, 1]]).atome === 1);
  if (single.every(Boolean)) return tr("Jedes Atom als ein Teilchen gezählt – genau so geht's.", "Each atom counted as one particle – exactly right.");
  if (single.some(Boolean)) return tr("Jedes Molekül und jedes einzelne Atom als ein Teilchen gezählt – genau so geht's.", "Each molecule and each single atom counted as one particle – exactly right.");
  return tr("Jedes Molekül als ein Teilchen gezählt – genau so geht's.", "Each molecule counted as one particle – exactly right.");
}

function stoffe(): Task {
  const m = someMix();
  const a = analyse(m.mix), s = a.stoffe.length;
  const why = {
    teilchen: tr(`**${a.teilchen}** sind alle Teilchen. Gleiche Teilchen gehören zum selben Stoff.`, `**${a.teilchen}** is the number of all particles. Identical particles belong to the same substance.`),
    sorten: tr(`**${a.atomsorten.length}** sind die Atomsorten (${list(a.atomsorten)}). Gezählt werden verschiedene Teilchen.`, `**${a.atomsorten.length}** is the number of kinds of atoms (${list(a.atomsorten)}). Count different particles.`),
  };
  const base = {
    pic: m,
    prompt: tr("Wie viele **verschiedene Stoffe** sind im Bild?", "How many **different substances** are in the picture?"),
    hint: tr("Gleiche Teilchen sind derselbe Stoff. Zähle die verschiedenen Teilchensorten.", "Identical particles are the same substance. Count the different kinds of particles."),
    tip: tr(`Im Bild sind ${a.teilchen} Teilchen. Wie viele davon sehen verschieden aus? Gleiche zählen nur einmal.`, `There are ${a.teilchen} particles in the picture. How many of them look different? Identical ones count only once.`),
    explain: tr(`Verschiedene Teilchen: ${names(a.stoffe)} → **${cnt(s, "Stoff", "Stoffe")}**.`, `Different particles: ${names(a.stoffe)} → **${cnt(s, "substance", "substances")}**.`),
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

const REIN_E = tr("Reinstoff – Element", "Pure substance – element"), REIN_V = tr("Reinstoff – Verbindung", "Pure substance – compound"), GEMISCH = tr("Gemisch", "Mixture");

/** Level 1: Reinstoff oder Gemisch? – nur nach Teilchen, ohne Element/Verbindung (kommt erst in Level 2) */
const R_OK = tr("Reinstoff – alle Teilchen gleich", "Pure substance – all particles the same"), G_OK = tr("Gemisch – verschiedene Teilchen", "Mixture – different particles");
function reinOderGemisch(): Task {
  const kind = pick<PictureKind>(["E", "V", "GE", "GV", "GEV"]);
  const m = mixOf(kind);
  const a = analyse(m.mix);
  const base = { pic: m, prompt: tr("Reinstoff oder Gemisch?", "Pure substance or mixture?"), hint: tr("Wie viele Teilchensorten siehst du – eine oder mehr?", "How many kinds of particles do you see – one or more?"),
    tip: tr("Gibt es Teilchen, die anders aussehen als die übrigen? Ein Teilchen darf mehrere Farben haben.", "Are there particles that look different from the rest? A particle may have several colours.") };
  if (kind === "E" || kind === "V") {
    const f = a.stoffe[0];
    return {
      ...mc(R_OK, [
        kind === "V" ? d(MIX_ATOMS(), "verbindung-gemisch", tr(`Alle Teilchen sind gleich (${F(f)}). Im Bild: mehrere Atome **in einem Teilchen** sind trotzdem ein Stoff.`, `All particles are the same (${F(f)}). In the picture: several atoms **in one particle** are still one substance.`))
          : dis(MIX_ATOMS(), tr(`Alle Teilchen sind gleich: nur ${F(f)}.`, `All particles are the same: only ${F(f)}.`)),
        dis(G_OK, tr(`Alle Teilchen sind gleich: nur ${F(f)}. Ein Gemisch hätte verschiedene Teilchen.`, `All particles are the same: only ${F(f)}. A mixture would have different particles.`)),
      ], 3),
      ...base,
      explain: tr(`Nur ${shortName(f)}-Teilchen (${F(f)}) → **Reinstoff**.`, `Only ${shortName(f).toLowerCase()} particles (${F(f)}) → **pure substance**.`),
    };
  }
  return {
    ...mc(G_OK, [
      d(R_OK, "sorten-uebersehen", tr(`Es gibt ${cnt(a.stoffe.length, "Teilchensorte", "verschiedene Teilchensorten")}: ${names(a.stoffe)}. Das sind mehrere Stoffe.`, `There are ${cnt(a.stoffe.length, "kind of particle", "different kinds of particles")}: ${names(a.stoffe)}. These are several substances.`)),
      kind === "GE" && metalPic(m) ? d(tr("Reinstoff – alles ein Gitter", "Pure substance – all one lattice"), "nur-elemente-rein", tr(`Im Gitter sitzen verschiedene Atome zufällig verteilt: ${names(a.stoffe)}. Das sind mehrere Stoffe.`, `Different atoms sit randomly in the lattice: ${names(a.stoffe)}. These are several substances.`))
        : kind === "GE" ? d(tr("Reinstoff – nur einzelne Atome", "Pure substance – only single atoms"), "nur-elemente-rein", tr(`Einzelne Atome verschiedener Sorten sind verschiedene Stoffe: ${names(a.stoffe)}.`, `Single atoms of different kinds are different substances: ${names(a.stoffe)}.`))
        : kind === "GV" ? d(tr("Reinstoff – lauter Moleküle", "Pure substance – all molecules"), "sorten-uebersehen", tr(`Die Moleküle sind nicht alle gleich: ${names(a.stoffe)} – mehrere Stoffe.`, `The molecules are not all the same: ${names(a.stoffe)} – several substances.`))
        // Atome und Moleküle: gleichmäßig verteilt heißt nicht „ein Stoff“
        : d(tr("Reinstoff – gleichmäßig verteilt", "Pure substance – evenly spread"), "sorten-uebersehen", tr(`Gleichmäßig verteilt heißt nicht gleich. Es gibt verschiedene Teilchen: ${names(a.stoffe)}.`, `Evenly spread does not mean all the same. There are different particles: ${names(a.stoffe)}.`)),
    ], 3),
    ...base,
    explain: tr(`Verschiedene Teilchen: ${names(a.stoffe)} → **Gemisch**.`, `Different particles: ${names(a.stoffe)} → **mixture**.`),
  };
}

/** Level 2: Reinstoff (Element oder Verbindung) oder Gemisch? */
function reinGemisch(): Task {
  const kind = pick<PictureKind>(["E", "V", "GE", "GV", "GEV"]);
  const m = mixOf(kind);
  const a = analyse(m.mix);
  const f = a.stoffe[0];
  const q = { prompt: tr("Reinstoff oder Gemisch? Und was für ein Stoff?", "Pure substance or mixture? And what kind of substance?"), hint: tr("Sind alle Teilchen gleich? Wie viele Atomsorten hat ein Teilchen?", "Are all particles the same? How many kinds of atoms does a particle have?"),
    tip: tr("Zuerst: Sind alle Teilchen gleich? Dann: Hat ein Teilchen eine Farbe oder mehrere?", "First: are all particles the same? Then: does a particle have one colour or several?") };
  if (kind === "E") {
    return {
      ...mc(REIN_E, [
        d(REIN_V, "element-verbindung", metalPic(m)
          ? LATTICE_SAME(f)
          : tr(`Nur ${f}-Atome – eine Atomsorte. Eine Verbindung braucht mehrere.`, `Only ${f} atoms – one kind of atom. A compound needs several.`)),
        dis(GEMISCH, tr("Alle Teilchen sind gleich – also nur ein Stoff. Ein Gemisch hat mehrere Stoffe.", "All particles are the same – so only one substance. A mixture has several substances.")),
      ], 3),
      pic: m, ...q,
      explain: tr(`Nur ${elementName(f)}-Atome (${f}) → **Reinstoff**. Eine Atomsorte → **Element**.`, `Only ${elementName(f).toLowerCase()} atoms (${f}) → **pure substance**. One kind of atom → **element**.`),
    };
  }
  if (kind === "V") {
    return {
      ...mc(REIN_V, [
        d(GEMISCH, "verbindung-gemisch", tr(`Alle Teilchen sind gleich (${F(f)}). Im Bild: ein Teilchen mit **mehreren Farben** gehört zu einer Verbindung.`, `All particles are the same (${F(f)}). In the picture: a particle with **several colours** belongs to a compound.`)),
        d(REIN_E, "verbindung-element", tr(`Ein ${F(f)}-Teilchen enthält ${list(a.atomsorten)} – mehrere Atomsorten, also eine Verbindung.`, `${AN(f)} ${F(f)} particle contains ${list(a.atomsorten)} – several kinds of atoms, so a compound.`)),
      ], 3),
      pic: m, ...q,
      explain: tr(`Nur ${shortName(f)}-Teilchen (${F(f)}) → **Reinstoff**. Atomsorten ${list(a.atomsorten)} fest verbunden → **Verbindung**.`, `Only ${shortName(f).toLowerCase()} particles (${F(f)}) → **pure substance**. Kinds of atoms ${list(a.atomsorten)} firmly bonded → **compound**.`),
    };
  }
  const onlyAtoms = kind === "GE";
  return {
    ...mc(GEMISCH, [
      onlyAtoms
        ? d(REIN_E, "nur-elemente-rein", tr(`${names(a.stoffe)} sind verschiedene Elemente. Mehrere Stoffe ergeben ein Gemisch.`, `${cap(names(a.stoffe))} are different elements. Several substances make a mixture.`))
        : d(REIN_V, "sorten-uebersehen", tr(`Es gibt ${cnt(a.stoffe.length, "Teilchensorte", "verschiedene Teilchensorten")}. Mehrere Stoffe ergeben ein Gemisch.`, `There are ${cnt(a.stoffe.length, "kind of particle", "different kinds of particles")}. Several substances make a mixture.`)),
      onlyAtoms ? d(REIN_V, "gemisch-verbindung", metalPic(m) ? ALLOY_MIX(a.elemente)
        : tr("Die Atome sind nicht miteinander verbunden. Jede Atomsorte ist ein eigener Stoff.", "The atoms are not bonded to each other. Each kind of atom is a substance of its own.")) : REIN_E,
    ], 3),
    pic: m, ...q,
    hint: tr("Sind alle Teilchen gleich? Verschiedene Teilchen bedeuten verschiedene Stoffe.", "Are all particles the same? Different particles mean different substances."),
    explain: tr(`Verschiedene Teilchen: ${names(a.stoffe)} → **Gemisch**.`, `Different particles: ${names(a.stoffe)} → **mixture**.`),
  };
}

// ── Level 2: Elemente und Verbindungen ─────────────────────────────────────────

/** Antwort `text` mit Rückmeldung, wenn ein Bild der Art `actual` für `said` gehalten wird */
function confuse(actual: PictureKind, said: PictureKind, p: Pic, text: string): Distractor {
  const a = analyse(p.mix);
  const el = a.elemente[0], v = a.verbindungen[0];
  switch (actual) {
    case "E": return said === "V"
      ? d(text, "element-verbindung", metalPic(p) ? tr(`Die ${el}-Atome sind im Gitter verbunden – aber alle gleich. Das ist ein Element.`, `The ${el} atoms are bonded in a lattice – but all the same. That is an element.`) : tr(`Nur ${el}-Atome – eine Atomsorte. Das ist ein Element.`, `Only ${el} atoms – one kind of atom. That is an element.`))
      : dis(text, tr("Alle Teilchen sind gleich – also nur ein Stoff.", "All particles are the same – so only one substance."));
    case "V": return said === "E"
      ? d(text, "verbindung-element", tr(`Ein ${F(v)}-Teilchen enthält ${list(a.atomsorten)} – mehrere Atomsorten: eine Verbindung.`, `${AN(v)} ${F(v)} particle contains ${list(a.atomsorten)} – several kinds of atoms: a compound.`))
      : d(text, "verbindung-gemisch", tr(`Die Atome sind im Teilchen fest verbunden. Alle Teilchen sind gleich (${F(v)}).`, `The atoms are firmly bonded in the particle. All particles are the same (${F(v)}).`));
    case "GE": return said === "E"
      ? d(text, "nur-elemente-rein", tr(`${names(a.elemente)}: verschiedene Elemente. Mehrere Stoffe ergeben ein Gemisch.`, `${cap(names(a.elemente))}: different elements. Several substances make a mixture.`))
      : said === "V" ? d(text, "gemisch-verbindung", metalPic(p) ? ALLOY_MIX(a.elemente) : tr("Die Atome sind nicht verbunden. Jede Atomsorte ist ein eigener Stoff.", "The atoms are not bonded. Each kind of atom is a substance of its own."))
      : d(text, "element-verbindung", metalPic(p)
        ? tr(`Im Gitter sitzen ${list(a.elemente)} zufällig verteilt – zwei Elemente, keine Verbindung.`, `${list(a.elemente)} sit randomly in the lattice – two elements, not a compound.`)
        : tr("Hier sind nur einzelne Atome – das sind Elemente, keine Verbindungen.", "Here there are only single atoms – these are elements, not compounds."));
    case "GV": return said === "V"
      ? d(text, "sorten-uebersehen", tr(`Es gibt verschiedene Moleküle: ${names(a.verbindungen)}. Mehrere Stoffe.`, `There are different molecules: ${names(a.verbindungen)}. Several substances.`))
      : said === "E" ? dis(text, tr("Jedes Molekül hat mehrere Atomsorten – das sind Verbindungen.", "Each molecule has several kinds of atoms – these are compounds."))
      : d(text, "verbindung-element", tr(`${names(a.verbindungen)} haben je mehrere Atomsorten – alles Verbindungen.`, `${list(a.verbindungen.map(F))} each have several kinds of atoms – all compounds.`));
    case "GEV": return said === "GE"
      ? d(text, "verbindung-element", tr(`${shortName(v)} (${F(v)}) hat mehrere Atomsorten – das ist eine Verbindung.`, `${shortName(v)} (${F(v)}) has several kinds of atoms – that is a compound.`))
      : said === "GV" ? d(text, "element-verbindung", tr(`Die einzelnen ${el}-Atome sind ein Element, keine Verbindung.`, `The single ${el} atoms are an element, not a compound.`))
      : d(text, "sorten-uebersehen", tr("Es gibt verschiedene Teilchen – also mehrere Stoffe.", "There are different particles – so several substances."));
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
    prompt: tr("Was zeigt das Teilchenbild?", "What does the particle picture show?"),
    hint: tr("Wie viele Teilchensorten gibt es? Hat ein Teilchen eine oder mehrere Atomsorten?", "How many kinds of particles are there? Does a particle have one or several kinds of atoms?"),
    tip: tr("Zuerst: Wie viele Teilchensorten? Dann: Teilchen einfarbig oder mehrfarbig?", "First: how many kinds of particles? Then: particles one colour or several colours?"),
    explain: `${cap(names(a.stoffe))} → **${PICTURE_LABEL[kind]}**.`,
  };
}

/** Woran man das gesuchte Bild erkennt (Level mit Tipp) */
const WAHL_TIP: Record<PictureKind, string> = tr({
  E: "Gesucht: alle Teilchen gleich, jedes nur in einer Farbe.",
  V: "Gesucht: alle Teilchen gleich, jedes mit mehreren Farben.",
  GE: "Gesucht: verschiedene Teilchen, jedes nur in einer Farbe.",
  GV: "Gesucht: verschiedene Teilchen, jedes mit mehreren Farben.",
  GEV: "Gesucht: verschiedene Teilchen – einige einfarbig, einige mehrfarbig.",
}, {
  E: "Wanted: all particles the same, each in only one colour.",
  V: "Wanted: all particles the same, each with several colours.",
  GE: "Wanted: different particles, each in only one colour.",
  GV: "Wanted: different particles, each with several colours.",
  GEV: "Wanted: different particles – some one colour, some several colours.",
});

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
      prompt: tr(`Welches Bild zeigt **${kind === "E" ? "ein Element" : kind === "V" ? "eine Verbindung" : `ein ${PICTURE_LABEL[kind]}`}**?`,
        `Which picture shows **${kind === "E" ? "an element" : kind === "V" ? "a compound" : `a ${PICTURE_LABEL[kind].toLowerCase()}`}**?`),
      hint: tr("Gleiche Teilchen = ein Stoff. Eine Atomsorte = Element, mehrere im Teilchen = Verbindung.", "Identical particles = one substance. One kind of atom = element, several in a particle = compound."),
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
      { field: "n", value: a.stoffe.length, miss: "stoffe-statt-atomsorten", why: tr(`**${a.stoffe.length}** sind die Stoffe. Gefragt sind die Atomsorten – die Farben der Kugeln.`, `**${a.stoffe.length}** is the number of substances. The question asks for the kinds of atoms – the colours of the spheres.`) },
      { field: "n", value: a.atome, miss: "atome-gezaehlt", why: tr(`**${a.atome}** sind alle Atome. Jede Atomsorte zählt nur einmal.`, `**${a.atome}** is the number of all atoms. Each kind of atom counts only once.`) },
    ] as Trap[], { n }),
    prompt: tr("Wie viele **Atomsorten** kommen im Bild vor?", "How many **kinds of atoms** appear in the picture?"),
    hint: tr("Jede Atomsorte hat eine eigene Farbe. Zähle die verschiedenen Farben.", "Each kind of atom has its own colour. Count the different colours."),
    tip: tr("Achte nur auf die Kugelfarben, nicht auf die Teilchen. Jede Farbe zählt einmal. **Farben** zeigt die Namen.", "Look only at the sphere colours, not at the particles. Each colour counts once. **Colours** shows the names."),
    explain: `${tr("Atomsorten", "Kinds of atoms")}: ${list(a.atomsorten.map(el => `${tr(elementName(el), elementName(el).toLowerCase())} (${el})`))} → **${n}**.`,
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
      { field: "n", value: a.stoffe.length, miss: "element-verbindung", why: tr(`Nicht jeder Stoff ist eine Verbindung: ${names(a.elemente)} ${a.elemente.length === 1 ? "hat" : "haben"} nur eine Atomsorte.`, `Not every substance is a compound: ${names(a.elemente)} ${a.elemente.length === 1 ? "has" : "have"} only one kind of atom.`) },
      { field: "n", value: particles, miss: "teilchen-statt-stoffe", why: tr(`**${particles}** sind die Teilchen von Verbindungen. Gefragt ist, wie viele **Stoffe** Verbindungen sind.`, `**${particles}** is the number of particles of compounds. The question asks how many **substances** are compounds.`) },
    ] as Trap[], { n: v }),
    prompt: tr("Wie viele der Stoffe im Bild sind **Verbindungen**?", "How many of the substances in the picture are **compounds**?"),
    hint: tr("Im Bild: Ein Teilchen mit **mehreren Farben** gehört zu einer Verbindung.", "In the picture: a particle with **several colours** belongs to a compound."),
    tip: tr("Suche Teilchen mit mehreren Farben. Jede solche Teilchensorte ist eine Verbindung. Gleiche zählen einmal.", "Look for particles with several colours. Each such kind of particle is a compound. Identical ones count once."),
    explain: a.verbindungen.length ? `${tr("Verbindungen", "Compounds")}: ${names(a.verbindungen)} → **${v}**.` : tr("Kein Teilchen hat zwei Atomsorten → **0** Verbindungen.", "No particle has two kinds of atoms → **0** compounds."),
  };
}

function elemente(): Task {
  const m = l2Mix();
  const a = analyse(m.mix), e = a.elemente.length;
  const particles = m.mix.filter(([f]) => isElement(f)).reduce((s, [, n]) => s + n, 0);
  return {
    kind: "num", answer: e, pic: m,
    traps: validTraps([
      { field: "n", value: a.atomsorten.length, miss: "atomsorten-statt-stoffe", why: tr(`**${a.atomsorten.length}** sind die Atomsorten. Die Atome in Verbindungen sind keine eigenen Stoffe.`, `**${a.atomsorten.length}** is the number of kinds of atoms. The atoms in compounds are not substances of their own.`) },
      { field: "n", value: particles, miss: "teilchen-statt-stoffe", why: tr(`**${particles}** sind die einzelnen Atome. Gefragt ist, wie viele **Stoffe** Elemente sind.`, `**${particles}** is the number of single atoms. The question asks how many **substances** are elements.`) },
    ] as Trap[], { n: e }),
    prompt: tr("Wie viele der Stoffe im Bild sind **Elemente**?", "How many of the substances in the picture are **elements**?"),
    hint: tr("Ein Element hat nur eine Atomsorte – einzelne Atome, ein Gitter oder Moleküle wie O₂.", "An element has only one kind of atom – single atoms, a lattice or molecules such as O₂."),
    tip: tr("Suche Teilchen mit nur einer Farbe. Jede solche Teilchensorte ist ein Element. Gleiche zählen einmal.", "Look for particles with only one colour. Each such kind of particle is an element. Identical ones count once."),
    explain: a.elemente.length ? `${tr("Elemente", "Elements")}: ${names(a.elemente)} → **${e}**.` : tr("Jedes Teilchen hat mehrere Atomsorten → **0** Elemente.", "Every particle has several kinds of atoms → **0** elements."),
  };
}

const EINORDNEN = ["H2O", "He", "Ne", "Ar", "CO2", "CH4", "C2H5OH", "NH3", "H2O2", "CO", "H2S", "C12H26", "C12H22O11", "Cu", "Zn", "Fe", "Al"];

/** Elemente aus Molekülen (zwei gleiche Atome): nur hier im Quiz – Kontrast zu Verbindungen wie CO */
const ELEMENT_MOLECULES = ["O2", "N2"];

function einordnen(): Task {
  // jede vierte Aufgabe ein Element aus Molekülen (O₂, N₂): zwei Atome, aber eine Atomsorte
  const f = Math.random() < .25 ? pick(ELEMENT_MOLECULES) : pick(EINORDNEN);
  const molecule = ELEMENT_MOLECULES.includes(f);
  const els = analyse([[f, 1]]).atomsorten;
  const metal = METALS.includes(f);
  const pic: Pic = metal ? { mix: [[f, pick(LATTICE)]], state: "fest" } : { mix: [[f, isElement(f) ? int(5, 8) : f.length > 6 ? 3 : int(4, 6)]], state: "modell" };
  const name = shortName(f);
  const opts = isElement(f)
    ? mc(W.el, [
      molecule
        ? d(W.comp, "element-molekuel", tr(`${F(f)} hat zwei Atome, aber nur eine Atomsorte – ein Element.`, `${F(f)} has two atoms but only one kind of atom – an element.`))
        : d(W.comp, "element-verbindung", metal
          ? LATTICE_SAME(f)
          : tr(`${F(f)} besteht nur aus ${f}-Atomen. Eine Verbindung braucht mehrere Atomsorten.`, `${F(f)} consists only of ${f} atoms. A compound needs several kinds of atoms.`)),
      dis(W.mix, tr("Alle Teilchen sind gleich – nur ein Stoff, kein Gemisch.", "All particles are the same – only one substance, not a mixture.")),
    ], 3)
    : mc(W.comp, [
      d(W.el, "verbindung-element", tr(`Ein ${F(f)}-Teilchen enthält ${list(els)} – mehrere Atomsorten: eine Verbindung.`, `${AN(f)} ${F(f)} particle contains ${list(els)} – several kinds of atoms: a compound.`)),
      d(W.mix, "verbindung-gemisch", tr("Die Atome sind im Teilchen fest verbunden, alle Teilchen sind gleich – kein Gemisch.", "The atoms are firmly bonded in the particle, all particles are the same – not a mixture.")),
    ], 3);
  return {
    ...opts, pic,
    prompt: tr(`**${name}** (${F(f)}): Element, Verbindung oder Gemisch?`, `**${name}** (${F(f)}): element, compound or mixture?`),
    hint: tr("Wie viele Atomsorten stecken in einem Teilchen?", "How many kinds of atoms are in one particle?"),
    tip: tr(`Lies die Formel ${F(f)}: Jede Atomsorte beginnt mit einem Großbuchstaben. Wie viele verschiedene Atomsorten findest du?`, `Read the formula ${F(f)}: each kind of atom starts with a capital letter. How many different kinds of atoms do you find?`),
    explain: molecule
      ? tr(`${name} ${F(f)}: zwei gleiche Atome (${els[0]}) → eine Atomsorte → **Element**.`, `${name} ${F(f)}: two identical atoms (${els[0]}) → one kind of atom → **element**.`)
      : isElement(f)
      ? tr(`${name}: nur ${elementName(els[0])}-Atome (${els[0]}) → **Element**${metal ? ", auch im Metallgitter" : ""}.`, `${name}: only ${elementName(els[0]).toLowerCase()} atoms (${els[0]}) → **element**${metal ? ", also in a metal lattice" : ""}.`)
      : tr(`${name}: ${list(els)} fest verbunden → **Verbindung**.`, `${name}: ${list(els)} firmly bonded → **compound**.`),
  };
}

// ── Level 3: Gemische im Alltag ─────────────────────────────────────────────────

const HOMOGEN = tr("homogenes Gemisch", "homogeneous mixture"), HETEROGEN = tr("heterogenes Gemisch", "heterogeneous mixture"), REIN = tr("Reinstoff", "pure substance");
interface Everyday { name: string; ans: string; ex?: string; why: string; trap?: [string, string, string] }
const EVERYDAY: Everyday[] = tr([
  { name: "Öl und Wasser", ans: HETEROGEN, ex: "oel", why: "Öl schwimmt oben, man sieht zwei Schichten.", trap: [HOMOGEN, "entmischt-homogen", "Öl und Wasser mischen sich nicht – sie trennen sich in zwei Schichten."] },
  { name: "Zuckerwasser", ans: HOMOGEN, ex: "zucker", why: "Der Zucker ist gelöst und überall gleich verteilt.", trap: [REIN, "klar-reinstoff", "Klar heißt nicht rein: Zucker und Wasser sind zwei Stoffe."] },
  { name: "Alkohol und Wasser", ans: HOMOGEN, ex: "alkohol", why: "Alkohol und Wasser mischen sich vollständig.", trap: [HETEROGEN, "geloest-heterogen", "Man sieht keine Grenze – die Teilchen sind gleichmäßig gemischt."] },
  { name: "Messing", ans: HOMOGEN, ex: "messing", why: "Kupfer und Zink sind im Metall gleichmäßig verteilt.", trap: [REIN, "nur-elemente-rein", "Messing besteht aus Kupfer und Zink – zwei Stoffe."] },
  { name: "Erdgas", ans: HOMOGEN, ex: "erdgas", why: "Methan, Ethan und Kohlendioxid sind gleichmäßig gemischt.", trap: [REIN, "klar-reinstoff", "Erdgas enthält mehrere Stoffe, man sieht sie nur nicht."] },
  { name: "Schutzgas zum Schweißen", ans: HOMOGEN, ex: "schutzgas", why: "Argon und Kohlendioxid sind gleichmäßig gemischt.", trap: [REIN, "klar-reinstoff", "Argon und Kohlendioxid sind zwei Stoffe, auch wenn man nichts sieht."] },
  { name: "Luft", ans: HOMOGEN, why: "Gase mischen sich immer vollständig.", trap: [REIN, "klar-reinstoff", "Luft besteht aus Stickstoff, Sauerstoff, Argon und mehr."] },
  { name: "Wasser", ans: REIN, ex: "wasser", why: "Alle Teilchen sind gleich: H₂O.", trap: [HOMOGEN, "verbindung-gemisch", "Wasser ist eine Verbindung aus H und O – aber nur ein Stoff."] },
  { name: "Helium im Luftballon", ans: REIN, ex: "helium", why: "Nur Helium-Atome – ein Stoff." },
  { name: "Milch", ans: HETEROGEN, why: "Unter dem Mikroskop sieht man Fetttröpfchen im Wasser.", trap: [HOMOGEN, "sieht-einheitlich", "Milch sieht einheitlich aus, enthält aber winzige Fetttröpfchen."] },
  { name: "Granit", ans: HETEROGEN, why: "Man sieht verschiedene Körner (Quarz, Feldspat, Glimmer)." },
  { name: "Nebel", ans: HETEROGEN, why: "Winzige Wassertröpfchen schweben in der Luft.", trap: [HOMOGEN, "sieht-einheitlich", "Nebel besteht aus Tröpfchen in Luft – nicht überall gleich."] },
  { name: "Sand in Wasser", ans: HETEROGEN, why: "Der Sand löst sich nicht und sinkt ab." },
  { name: "Meerwasser (gefiltert)", ans: HOMOGEN, why: "Das Salz ist im Wasser gelöst.", trap: [REIN, "klar-reinstoff", "Im Meerwasser sind Salze gelöst – kein Reinstoff."] },
  { name: "Orangensaft mit Fruchtfleisch", ans: HETEROGEN, why: "Die Fruchtfleisch-Stücke sind zu sehen." },
  { name: "Rauch", ans: HETEROGEN, why: "Feste Rußteilchen schweben in der Luft.", trap: [HOMOGEN, "sieht-einheitlich", "Rauch enthält feste Rußstückchen in Luft – nicht überall gleich."] },
  { name: "Tee mit Zucker", ans: HOMOGEN, why: "Zucker und Teestoffe sind gelöst.", trap: [HETEROGEN, "geloest-heterogen", "Der Zucker ist gelöst – man sieht keine Teile mehr."] },
  { name: "Essig", ans: HOMOGEN, why: "Essigsäure ist in Wasser gelöst.", trap: [REIN, "klar-reinstoff", "Essig ist klar, enthält aber Essigsäure und Wasser."] },
  { name: "Cola ohne Blasen", ans: HOMOGEN, why: "Zucker, Farbstoffe und Gas sind gelöst.", trap: [HETEROGEN, "geloest-heterogen", "Man sieht keine Teile – alles ist gelöst."] },
  { name: "Weißwein", ans: HOMOGEN, why: "Alkohol, Zucker und Säuren sind im Wasser gelöst.", trap: [REIN, "klar-reinstoff", "Wein ist klar – aber ein Gemisch aus vielen Stoffen."] },
  { name: "Edelstahl", ans: HOMOGEN, why: "Eisen, Chrom und Nickel sind gleichmäßig gemischt.", trap: [REIN, "nur-elemente-rein", "Edelstahl enthält Eisen, Chrom und Nickel – mehrere Stoffe."] },
  { name: "Salatdressing aus Öl und Essig", ans: HETEROGEN, why: "Öltröpfchen schwimmen im Essig und trennen sich wieder.", trap: [HOMOGEN, "entmischt-homogen", "Öl und Essig mischen sich nicht – nach einer Weile bilden sich Schichten."] },
  { name: "Kakao mit Pulver am Boden", ans: HETEROGEN, why: "Ungelöstes Pulver sinkt ab.", trap: [HOMOGEN, "sieht-einheitlich", "Am Boden sieht man Pulver – also nicht überall gleich."] },
  { name: "Schlamm", ans: HETEROGEN, why: "Erde schwebt im Wasser und setzt sich ab." },
  { name: "Sahne", ans: HETEROGEN, why: "Viele Fetttröpfchen in Wasser.", trap: [HOMOGEN, "sieht-einheitlich", "Sahne sieht einheitlich aus – unter dem Mikroskop sieht man Fetttröpfchen."] },
  { name: "Schaumbad", ans: HETEROGEN, why: "Luftblasen im Wasser." },
  { name: "Müsli", ans: HETEROGEN, why: "Man sieht Flocken, Nüsse und Rosinen." },
], [
  { name: "oil and water", ans: HETEROGEN, ex: "oel", why: "Oil floats on top, you can see two layers.", trap: [HOMOGEN, "entmischt-homogen", "Oil and water do not mix – they separate into two layers."] },
  { name: "sugar water", ans: HOMOGEN, ex: "zucker", why: "The sugar is dissolved and spread evenly everywhere.", trap: [REIN, "klar-reinstoff", "Clear does not mean pure: sugar and water are two substances."] },
  { name: "alcohol and water", ans: HOMOGEN, ex: "alkohol", why: "Alcohol and water mix completely.", trap: [HETEROGEN, "geloest-heterogen", "You cannot see a boundary – the particles are evenly mixed."] },
  { name: "brass", ans: HOMOGEN, ex: "messing", why: "Copper and zinc are spread evenly in the metal.", trap: [REIN, "nur-elemente-rein", "Brass consists of copper and zinc – two substances."] },
  { name: "natural gas", ans: HOMOGEN, ex: "erdgas", why: "Methane, ethane and carbon dioxide are evenly mixed.", trap: [REIN, "klar-reinstoff", "Natural gas contains several substances, you just cannot see them."] },
  { name: "shielding gas for welding", ans: HOMOGEN, ex: "schutzgas", why: "Argon and carbon dioxide are evenly mixed.", trap: [REIN, "klar-reinstoff", "Argon and carbon dioxide are two substances, even if you see nothing."] },
  { name: "air", ans: HOMOGEN, why: "Gases always mix completely.", trap: [REIN, "klar-reinstoff", "Air consists of nitrogen, oxygen, argon and more."] },
  { name: "water", ans: REIN, ex: "wasser", why: "All particles are the same: H₂O.", trap: [HOMOGEN, "verbindung-gemisch", "Water is a compound of H and O – but only one substance."] },
  { name: "helium in a balloon", ans: REIN, ex: "helium", why: "Only helium atoms – one substance." },
  { name: "milk", ans: HETEROGEN, why: "Under the microscope you can see fat droplets in water.", trap: [HOMOGEN, "sieht-einheitlich", "Milk looks uniform but contains tiny fat droplets."] },
  { name: "granite", ans: HETEROGEN, why: "You can see different grains (quartz, feldspar, mica)." },
  { name: "fog", ans: HETEROGEN, why: "Tiny water droplets float in the air.", trap: [HOMOGEN, "sieht-einheitlich", "Fog consists of droplets in air – not the same everywhere."] },
  { name: "sand in water", ans: HETEROGEN, why: "The sand does not dissolve and sinks." },
  { name: "seawater (filtered)", ans: HOMOGEN, why: "The salt is dissolved in the water.", trap: [REIN, "klar-reinstoff", "Salts are dissolved in seawater – not a pure substance."] },
  { name: "orange juice with pulp", ans: HETEROGEN, why: "The pieces of pulp can be seen." },
  { name: "smoke", ans: HETEROGEN, why: "Solid soot particles float in the air.", trap: [HOMOGEN, "sieht-einheitlich", "Smoke contains solid bits of soot in air – not the same everywhere."] },
  { name: "tea with sugar", ans: HOMOGEN, why: "Sugar and tea substances are dissolved.", trap: [HETEROGEN, "geloest-heterogen", "The sugar is dissolved – you cannot see any pieces."] },
  { name: "vinegar", ans: HOMOGEN, why: "Acetic acid is dissolved in water.", trap: [REIN, "klar-reinstoff", "Vinegar is clear but contains acetic acid and water."] },
  { name: "cola without bubbles", ans: HOMOGEN, why: "Sugar, dyes and gas are dissolved.", trap: [HETEROGEN, "geloest-heterogen", "You cannot see any pieces – everything is dissolved."] },
  { name: "white wine", ans: HOMOGEN, why: "Alcohol, sugar and acids are dissolved in water.", trap: [REIN, "klar-reinstoff", "Wine is clear – but a mixture of many substances."] },
  { name: "stainless steel", ans: HOMOGEN, why: "Iron, chromium and nickel are evenly mixed.", trap: [REIN, "nur-elemente-rein", "Stainless steel contains iron, chromium and nickel – several substances."] },
  { name: "salad dressing of oil and vinegar", ans: HETEROGEN, why: "Oil droplets float in the vinegar and separate again.", trap: [HOMOGEN, "entmischt-homogen", "Oil and vinegar do not mix – after a while layers form."] },
  { name: "cocoa with powder at the bottom", ans: HETEROGEN, why: "Undissolved powder sinks.", trap: [HOMOGEN, "sieht-einheitlich", "You can see powder at the bottom – so not the same everywhere."] },
  { name: "mud", ans: HETEROGEN, why: "Soil floats in the water and settles." },
  { name: "cream", ans: HETEROGEN, why: "Many fat droplets in water.", trap: [HOMOGEN, "sieht-einheitlich", "Cream looks uniform – under the microscope you can see fat droplets."] },
  { name: "bubble bath", ans: HETEROGEN, why: "Air bubbles in water." },
  { name: "muesli", ans: HETEROGEN, why: "You can see flakes, nuts and raisins." },
]);

/** Tipp nach der typischen Fehlvorstellung des Beispiels */
const HOMOGEN_TIP: Record<string, string> = tr({
  "klar-reinstoff": "Auch wenn man nichts sieht: Zähle auf, was alles darin steckt.",
  "sieht-einheitlich": "Denk ans Mikroskop: Wären dort Tröpfchen, Körner oder Blasen zu sehen?",
  "geloest-heterogen": "Gelöstes sieht man nicht mehr. Gibt es irgendwo eine Grenze?",
  "entmischt-homogen": "Lass es eine Weile stehen. Bilden sich Schichten?",
  "verbindung-gemisch": "Wie viele verschiedene Teilchen gibt es? Eine Verbindung ist ein Stoff.",
  "nur-elemente-rein": "Aus wie vielen Elementen besteht es? Und sieht man darin Teile?",
}, {
  "klar-reinstoff": "Even if you see nothing: list everything that is in it.",
  "sieht-einheitlich": "Think of the microscope: would you see droplets, grains or bubbles there?",
  "geloest-heterogen": "You can no longer see what is dissolved. Is there a boundary anywhere?",
  "entmischt-homogen": "Let it stand for a while. Do layers form?",
  "verbindung-gemisch": "How many different particles are there? A compound is one substance.",
  "nur-elemente-rein": "How many elements is it made of? And can you see any pieces in it?",
});

/** Homogen oder heterogen – optional nur Beispiele einer Gruppe (mit Teilchenbild, „klar“, „sieht einheitlich aus“) */
const homogenOf = (only?: (e: Everyday) => boolean) => () => homogen(only);
function homogen(only?: (e: Everyday) => boolean): Task {
  const pool = only ? EVERYDAY.filter(only) : EVERYDAY;
  const e = pick(pool.length ? pool : EVERYDAY);
  const others = [HOMOGEN, HETEROGEN, REIN].filter(o => o !== e.ans && o !== e.trap?.[0]);
  return {
    ...mc(e.ans, [...(e.trap ? [d(e.trap[0], e.trap[1], e.trap[2])] : []), ...others], 3, e.why),
    ...(e.ex ? { pic: exPic(e.ex) } : {}),
    prompt: tr(`Was ist **${e.name}**?`, `What is **${e.name}**?`),
    hint: tr("Homogen: Die Bestandteile sind auch unter dem Mikroskop nicht zu erkennen. Heterogen: Mit Auge, Lupe oder Mikroskop sieht man Teile, Tröpfchen oder Schichten.", "Homogeneous: the components cannot be seen even under a microscope. Heterogeneous: with the eye, a magnifier or a microscope you see pieces, droplets or layers."),
    tip: HOMOGEN_TIP[e.trap?.[1] ?? ""] ?? (e.ans === REIN
      ? tr("Wie viele verschiedene Teilchen stecken darin? Und gibt es Teile oder Schichten?", "How many different particles are in it? And are there pieces or layers?")
      : tr(`Stell dir ${e.name} im Glas vor. Siehst du Teile, Tröpfchen oder Schichten?`, `Imagine ${e.name} in a glass. Do you see pieces, droplets or layers?`)),
    explain: `${cap(e.name)}: ${because(e.why)} → **${e.ans}**.`,
  };
}

const ARTEN = tr(["Lösung", "Legierung", "Gasgemisch", "Emulsion", "Suspension", "Gemenge", "Nebel", "Rauch", "Schaum"], ["Solution", "Alloy", "Gas mixture", "Emulsion", "Suspension", "Coarse mixture", "Fog", "Smoke", "Foam"]);
interface Art { name: string; ans: string; why: string; traps: [string, string, string][] }
const ZUSTAND = "zustand-verwechselt";
const GEMISCHARTEN: Art[] = tr([
  { name: "Zuckerwasser", ans: "Lösung", why: "Fester Zucker, gelöst in Wasser.", traps: [["Suspension", "geloest-heterogen", "Der Zucker ist gelöst, nicht als Körner verteilt – eine Lösung."]] },
  { name: "Salzwasser", ans: "Lösung", why: "Salz ist in Wasser gelöst.", traps: [["Suspension", "geloest-heterogen", "Das Salz ist gelöst – man sieht keine Körner."]] },
  { name: "Alkohol und Wasser", ans: "Lösung", why: "Zwei Flüssigkeiten, vollständig gemischt.", traps: [["Emulsion", "geloest-heterogen", "Alkohol und Wasser mischen sich ganz – keine Tröpfchen."]] },
  { name: "Messing", ans: "Legierung", why: "Zwei Metalle, gleichmäßig gemischt.", traps: [["Gemenge", "legierung-gemenge", "Kupfer und Zink sind bis zu den Atomen gemischt – eine Legierung."]] },
  { name: "Bronze", ans: "Legierung", why: "Kupfer und Zinn, zusammen geschmolzen und gleichmäßig gemischt.", traps: [["Gemenge", "legierung-gemenge", "Kupfer und Zinn sind zusammen geschmolzen und gleichmäßig gemischt – man sieht keine Stücke: eine Legierung."]] },
  { name: "Luft", ans: "Gasgemisch", why: "Mehrere Gase, vollständig gemischt.", traps: [["Nebel", ZUSTAND, "Nebel hat Wassertröpfchen. Klare Luft ist nur Gas."]] },
  { name: "Erdgas", ans: "Gasgemisch", why: "Methan, Ethan und andere Gase, gemischt.", traps: [["Rauch", ZUSTAND, "Rauch enthält feste Teilchen. Erdgas ist nur Gas."]] },
  { name: "Milch", ans: "Emulsion", why: "Fetttröpfchen in Wasser.", traps: [["Lösung", "sieht-einheitlich", "Milch sieht einheitlich aus, hat aber Fetttröpfchen."], ["Suspension", ZUSTAND, "Das Fett in Milch ist flüssig – also Tröpfchen, keine Körner."]] },
  { name: "Mayonnaise", ans: "Emulsion", why: "Öltröpfchen in Wasser (mit Ei).", traps: [["Suspension", ZUSTAND, "Öl ist flüssig – also Tröpfchen, keine festen Körner."]] },
  { name: "geschütteltes Öl und Wasser", ans: "Emulsion", why: "Öltröpfchen im Wasser – bis sie wieder aufsteigen.", traps: [["Lösung", "entmischt-homogen", "Öl löst sich nicht in Wasser – es bildet Tröpfchen."], ["Suspension", ZUSTAND, "Öl ist flüssig – Tröpfchen, keine Körner."]] },
  { name: "Sand in Wasser", ans: "Suspension", why: "Feste Körner in einer Flüssigkeit.", traps: [["Emulsion", ZUSTAND, "Sand ist fest – das sind Körner, keine Tröpfchen."], ["Lösung", "entmischt-homogen", "Sand löst sich nicht – man sieht die Körner."]] },
  { name: "Orangensaft mit Fruchtfleisch", ans: "Suspension", why: "Feste Stückchen im Saft.", traps: [["Emulsion", ZUSTAND, "Fruchtfleisch ist fest – das sind Stückchen, keine Tröpfchen."]] },
  { name: "Granit", ans: "Gemenge", why: "Verschiedene feste Körner nebeneinander.", traps: [["Legierung", "legierung-gemenge", "Die Körner im Granit sieht man – nicht bis zu den Atomen gemischt."]] },
  { name: "Müsli", ans: "Gemenge", why: "Feste Teile nebeneinander.", traps: [["Suspension", ZUSTAND, "Im Müsli ist keine Flüssigkeit – nur feste Teile."]] },
  { name: "Dunst über dem Teich am Morgen", ans: "Nebel", why: "Flüssige Tröpfchen in Luft.", traps: [["Rauch", ZUSTAND, "Rauch hat feste Teilchen, Nebel flüssige Tröpfchen."]] },
  { name: "Ruß über einer rußenden Kerze", ans: "Rauch", why: "Feste Rußstückchen in Luft.", traps: [["Nebel", ZUSTAND, "Nebel hat flüssige Tröpfchen, Rauch feste Teilchen."]] },
  { name: "Eischnee", ans: "Schaum", why: "Luftblasen in geschlagenem Eiweiß.", traps: [["Emulsion", ZUSTAND, "Im Eischnee stecken Luftblasen – ein Gas in Flüssigkeit, keine Tröpfchen."]] },
  { name: "Seifenschaum", ans: "Schaum", why: "Luftblasen in Seifenwasser.", traps: [["Nebel", ZUSTAND, "Beim Nebel ist die Flüssigkeit im Gas – hier ist es umgekehrt."]] },
  { name: "Essig", ans: "Lösung", why: "Essigsäure ist in Wasser gelöst.", traps: [["Emulsion", "geloest-heterogen", "Essigsäure mischt sich ganz mit Wasser – keine Tröpfchen."]] },
  { name: "Füllertinte", ans: "Lösung", why: "Farbstoff ist in Wasser gelöst.", traps: [["Suspension", "geloest-heterogen", "Der Farbstoff ist gelöst – es setzt sich nichts ab."]] },
  { name: "Weißgold (Gold mit Palladium)", ans: "Legierung", why: "Gold und Palladium, gleichmäßig gemischt.", traps: [["Gemenge", "legierung-gemenge", "Gold und Palladium sind bis zu den Atomen gemischt – eine Legierung."]] },
  { name: "Konstantan (Kupfer und Nickel)", ans: "Legierung", why: "Kupfer und Nickel, gleichmäßig gemischt.", traps: [["Gemenge", "legierung-gemenge", "Kupfer und Nickel sind bis zu den Atomen gemischt – eine Legierung."]] },
  { name: "Autoabgas ohne Ruß", ans: "Gasgemisch", why: "Mehrere Gase, vollständig gemischt.", traps: [["Rauch", ZUSTAND, "Ohne Ruß sind keine festen Teilchen darin – nur Gase."]] },
  { name: "Salatdressing aus Öl und Essig", ans: "Emulsion", why: "Öltröpfchen im Essig.", traps: [["Lösung", "entmischt-homogen", "Öl löst sich nicht in Essig – es bildet Tröpfchen."]] },
  { name: "Handcreme", ans: "Emulsion", why: "Fetttröpfchen und Wasser, fein verteilt.", traps: [["Lösung", "sieht-einheitlich", "Creme sieht einheitlich aus, besteht aber aus Tröpfchen."]] },
  { name: "Mehl in kaltem Wasser", ans: "Suspension", why: "Feste Mehlkörnchen in Wasser.", traps: [["Emulsion", ZUSTAND, "Mehl ist fest – Körnchen, keine Tröpfchen."]] },
  { name: "Schlamm", ans: "Suspension", why: "Feste Erdteilchen im Wasser.", traps: [["Emulsion", ZUSTAND, "Erde ist fest – Körner, keine Tröpfchen."]] },
  { name: "Sand und Kies", ans: "Gemenge", why: "Feste Körner verschiedener Größe.", traps: [["Legierung", "legierung-gemenge", "Eine Legierung ist ein Metall, mit anderen Elementen zusammen geschmolzen. Hier sieht man Körner."]] },
  { name: "Sprühstoß aus einer Blumenspritze", ans: "Nebel", why: "Wassertröpfchen schweben in Luft.", traps: [["Rauch", ZUSTAND, "Die Tröpfchen sind flüssig – keine festen Teilchen."]] },
  { name: "Staub in der Luft", ans: "Rauch", why: "Feste Teilchen schweben in Luft.", traps: [["Nebel", ZUSTAND, "Staub ist fest – Nebel hat flüssige Tröpfchen."]] },
  { name: "Bierschaum", ans: "Schaum", why: "Gasblasen in einer Flüssigkeit.", traps: [["Emulsion", ZUSTAND, "Im Schaum stecken Gasblasen, keine Tröpfchen."]] },
], [
  { name: "sugar water", ans: "Solution", why: "Solid sugar, dissolved in water.", traps: [["Suspension", "geloest-heterogen", "The sugar is dissolved, not spread as grains – a solution."]] },
  { name: "salt water", ans: "Solution", why: "Salt is dissolved in water.", traps: [["Suspension", "geloest-heterogen", "The salt is dissolved – you cannot see any grains."]] },
  { name: "alcohol and water", ans: "Solution", why: "Two liquids, completely mixed.", traps: [["Emulsion", "geloest-heterogen", "Alcohol and water mix completely – no droplets."]] },
  { name: "brass", ans: "Alloy", why: "Two metals, evenly mixed.", traps: [["Coarse mixture", "legierung-gemenge", "Copper and zinc are mixed down to the atoms – an alloy."]] },
  { name: "bronze", ans: "Alloy", why: "Copper and tin, melted together and evenly mixed.", traps: [["Coarse mixture", "legierung-gemenge", "Copper and tin are melted together and evenly mixed – you see no pieces: an alloy."]] },
  { name: "air", ans: "Gas mixture", why: "Several gases, completely mixed.", traps: [["Fog", ZUSTAND, "Fog has water droplets. Clear air is only gas."]] },
  { name: "natural gas", ans: "Gas mixture", why: "Methane, ethane and other gases, mixed.", traps: [["Smoke", ZUSTAND, "Smoke contains solid particles. Natural gas is only gas."]] },
  { name: "milk", ans: "Emulsion", why: "Fat droplets in water.", traps: [["Solution", "sieht-einheitlich", "Milk looks uniform but has fat droplets."], ["Suspension", ZUSTAND, "The fat in milk is liquid – so droplets, not grains."]] },
  { name: "mayonnaise", ans: "Emulsion", why: "Oil droplets in water (with egg).", traps: [["Suspension", ZUSTAND, "Oil is liquid – so droplets, not solid grains."]] },
  { name: "shaken oil and water", ans: "Emulsion", why: "Oil droplets in water – until they rise again.", traps: [["Solution", "entmischt-homogen", "Oil does not dissolve in water – it forms droplets."], ["Suspension", ZUSTAND, "Oil is liquid – droplets, not grains."]] },
  { name: "sand in water", ans: "Suspension", why: "Solid grains in a liquid.", traps: [["Emulsion", ZUSTAND, "Sand is solid – these are grains, not droplets."], ["Solution", "entmischt-homogen", "Sand does not dissolve – you can see the grains."]] },
  { name: "orange juice with pulp", ans: "Suspension", why: "Solid bits in the juice.", traps: [["Emulsion", ZUSTAND, "Pulp is solid – these are bits, not droplets."]] },
  { name: "granite", ans: "Coarse mixture", why: "Different solid grains side by side.", traps: [["Alloy", "legierung-gemenge", "You can see the grains in granite – not mixed down to the atoms."]] },
  { name: "muesli", ans: "Coarse mixture", why: "Solid pieces side by side.", traps: [["Suspension", ZUSTAND, "There is no liquid in muesli – only solid pieces."]] },
  { name: "mist over a pond in the morning", ans: "Fog", why: "Liquid droplets in air.", traps: [["Smoke", ZUSTAND, "Smoke has solid particles, fog has liquid droplets."]] },
  { name: "soot above a sooty candle", ans: "Smoke", why: "Solid bits of soot in air.", traps: [["Fog", ZUSTAND, "Fog has liquid droplets, smoke has solid particles."]] },
  { name: "whisked egg white", ans: "Foam", why: "Air bubbles in egg white.", traps: [["Emulsion", ZUSTAND, "Whisked egg white contains air bubbles – a gas in a liquid, not droplets."]] },
  { name: "soap foam", ans: "Foam", why: "Air bubbles in soapy water.", traps: [["Fog", ZUSTAND, "In fog the liquid is in the gas – here it is the other way round."]] },
  { name: "vinegar", ans: "Solution", why: "Acetic acid is dissolved in water.", traps: [["Emulsion", "geloest-heterogen", "Acetic acid mixes completely with water – no droplets."]] },
  { name: "fountain pen ink", ans: "Solution", why: "Dye is dissolved in water.", traps: [["Suspension", "geloest-heterogen", "The dye is dissolved – nothing settles."]] },
  { name: "white gold (gold with palladium)", ans: "Alloy", why: "Gold and palladium, evenly mixed.", traps: [["Coarse mixture", "legierung-gemenge", "Gold and palladium are mixed down to the atoms – an alloy."]] },
  { name: "constantan (copper and nickel)", ans: "Alloy", why: "Copper and nickel, evenly mixed.", traps: [["Coarse mixture", "legierung-gemenge", "Copper and nickel are mixed down to the atoms – an alloy."]] },
  { name: "car exhaust without soot", ans: "Gas mixture", why: "Several gases, completely mixed.", traps: [["Smoke", ZUSTAND, "Without soot there are no solid particles in it – only gases."]] },
  { name: "salad dressing of oil and vinegar", ans: "Emulsion", why: "Oil droplets in the vinegar.", traps: [["Solution", "entmischt-homogen", "Oil does not dissolve in vinegar – it forms droplets."]] },
  { name: "hand cream", ans: "Emulsion", why: "Fat droplets and water, finely spread.", traps: [["Solution", "sieht-einheitlich", "Cream looks uniform but consists of droplets."]] },
  { name: "flour in cold water", ans: "Suspension", why: "Solid grains of flour in water.", traps: [["Emulsion", ZUSTAND, "Flour is solid – grains, not droplets."]] },
  { name: "mud", ans: "Suspension", why: "Solid soil particles in water.", traps: [["Emulsion", ZUSTAND, "Soil is solid – grains, not droplets."]] },
  { name: "sand and gravel", ans: "Coarse mixture", why: "Solid grains of different sizes.", traps: [["Alloy", "legierung-gemenge", "An alloy is a metal melted together with other elements. Here you can see grains."]] },
  { name: "a fine spray from a plant mister", ans: "Fog", why: "Water droplets float in air.", traps: [["Smoke", ZUSTAND, "The droplets are liquid – not solid particles."]] },
  { name: "dust in the air", ans: "Smoke", why: "Solid particles float in air.", traps: [["Fog", ZUSTAND, "Dust is solid – fog has liquid droplets."]] },
  { name: "beer foam", ans: "Foam", why: "Gas bubbles in a liquid.", traps: [["Emulsion", ZUSTAND, "Foam contains gas bubbles, not droplets."]] },
]);

/** Tipp: Entscheidung nach dem Stoff, in dem verteilt wird */
const IN_FLUESSIG = tr("Der Hauptstoff ist flüssig. Wie steckt der andere Stoff darin: unsichtbar verteilt, als Tröpfchen, als Körner oder als Blasen?", "The main substance is liquid. How is the other substance in it: spread invisibly, as droplets, as grains or as bubbles?");
const IN_GAS = tr("Der Hauptstoff ist ein Gas. Was schwebt darin: nur andere Gase, flüssige Tröpfchen oder feste Stückchen?", "The main substance is a gas. What floats in it: only other gases, liquid droplets or solid bits?");
const NUR_FEST = tr("Alles ist fest. Sieht man einzelne Stücke – oder ist es durch und durch einheitlich?", "Everything is solid. Can you see separate pieces – or is it uniform all the way through?");
const ART_TIP: Record<string, string> = tr<Record<string, string>>({
  "Lösung": IN_FLUESSIG, Emulsion: IN_FLUESSIG, Suspension: IN_FLUESSIG, Schaum: IN_FLUESSIG,
  Gasgemisch: IN_GAS, Nebel: IN_GAS, Rauch: IN_GAS, Legierung: NUR_FEST, Gemenge: NUR_FEST,
}, {
  Solution: IN_FLUESSIG, Emulsion: IN_FLUESSIG, Suspension: IN_FLUESSIG, Foam: IN_FLUESSIG,
  "Gas mixture": IN_GAS, Fog: IN_GAS, Smoke: IN_GAS, Alloy: NUR_FEST, "Coarse mixture": NUR_FEST,
});

/** Art des Gemischs – optional nur bestimmte Arten (in Flüssigkeit, Metalle/Gase/Feststoffe, in Gas) */
const gemischartOf = (arts: string[]) => () => gemischart(arts);
function gemischart(arts?: string[]): Task {
  const pool = arts ? GEMISCHARTEN.filter(g => arts.includes(g.ans)) : GEMISCHARTEN;
  const g = pick(pool.length ? pool : GEMISCHARTEN);
  return {
    ...mc(g.ans, [...g.traps.map(([t, k, w]) => d(t, k, w)), ...shuffle(ARTEN.filter(a => a !== g.ans))], 4, g.why),
    prompt: tr(`Welche Art von Gemisch ist **${g.name}**?`, `What type of mixture is **${g.name}**?`),
    hint: tr("Welche Zustände sind gemischt – fest, flüssig, gasförmig? Sieht man Teile?", "Which states are mixed – solid, liquid, gas? Can you see pieces?"),
    tip: ART_TIP[g.ans],
    explain: `${cap(g.name)}: ${because(g.why)} → **${g.ans}**.`,
  };
}

interface Stoff { name: string; ans: "Element" | "Verbindung" | "Gemisch"; why: string; trap?: [string, string, string]; tip?: string }
const ALLTAG: Stoff[] = tr([
  { name: "Gold", ans: "Element", why: "Nur Gold-Atome." },
  { name: "Kupfer", ans: "Element", why: "Nur Kupfer-Atome im Gitter.", trap: ["Verbindung", "element-verbindung", "Die Kupfer-Atome sind verbunden – aber alle gleich. Eine Atomsorte: Element."] },
  { name: "Eisen", ans: "Element", why: "Nur Eisen-Atome im Gitter.", trap: ["Verbindung", "element-verbindung", "Die Eisen-Atome sind verbunden – aber alle gleich. Eine Atomsorte: Element."] },
  { name: "Helium", ans: "Element", why: "Nur Helium-Atome." },
  { name: "Neon in der Leuchtreklame", ans: "Element", why: "Nur Neon-Atome." },
  { name: "Diamant", ans: "Element", tip: "Diamant ist aus Kohlenstoff (C). Wie viele Atomsorten sind das?", why: "Nur Kohlenstoff-Atome, fest verbunden.", trap: ["Verbindung", "element-verbindung", "Im Diamant sind nur C-Atome verbunden – eine Atomsorte: Element."] },
  { name: "Wasser (H₂O)", ans: "Verbindung", why: "H und O fest verbunden, alle Teilchen gleich.", trap: ["Gemisch", "verbindung-gemisch", "Wasser enthält H und O – aber in jedem Teilchen fest verbunden. Ein Stoff."] },
  { name: "Kohlendioxid (CO₂)", ans: "Verbindung", why: "C und O fest verbunden.", trap: ["Element", "verbindung-element", "CO₂ hat zwei Atomsorten (C und O) – eine Verbindung."] },
  { name: "Haushaltszucker", ans: "Verbindung", tip: "Sind alle Teilchen gleich? Wie viele Atomsorten hat eines?", why: "C, H und O fest verbunden, alle Teilchen gleich.", trap: ["Gemisch", "verbindung-gemisch", "Zucker besteht aus gleichen Teilchen – ein Reinstoff, und zwar eine Verbindung."] },
  { name: "Kochsalz (NaCl)", ans: "Verbindung", why: "Natrium und Chlor fest verbunden – im Gitter.", trap: ["Gemisch", "verbindung-gemisch", "Kochsalz ist ein Reinstoff: Natrium und Chlor sind im Gitter fest verbunden – eine Verbindung."] },
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
  { name: "Argon aus der Gasflasche (Ar)", ans: "Element", why: "Nur Argon-Atome." },
  { name: "Ammoniak (NH₃)", ans: "Verbindung", why: "N und H fest verbunden.", trap: ["Gemisch", "verbindung-gemisch", "NH₃-Teilchen sind alle gleich – N und H sind im Teilchen verbunden."] },
  { name: "reiner Alkohol (Ethanol)", ans: "Verbindung", tip: "Sind alle Teilchen gleich? Wie viele Atomsorten hat eines?", why: "C, H und O fest verbunden, alle Teilchen gleich.", trap: ["Gemisch", "verbindung-gemisch", "Ethanol besteht aus gleichen Teilchen – ein Stoff mit drei Atomsorten."] },
  { name: "Calciumcarbonat (CaCO₃)", ans: "Verbindung", why: "Ca, C und O fest verbunden.", trap: ["Element", "verbindung-element", "CaCO₃ hat drei Atomsorten – eine Verbindung."] },
  { name: "Eisenoxid (Fe₂O₃)", ans: "Verbindung", why: "Eisen und Sauerstoff fest verbunden.", trap: ["Gemisch", "verbindung-gemisch", "Im Eisenoxid sind Fe und O verbunden – ein neuer Stoff, kein Gemisch."] },
  { name: "Meerwasser", ans: "Gemisch", why: "Salze sind im Wasser gelöst.", trap: ["Verbindung", "klar-reinstoff", "Meerwasser enthält Wasser und viele Salze – mehrere Stoffe."] },
  { name: "Mineralwasser", ans: "Gemisch", why: "Mineralstoffe und Gas sind gelöst.", trap: ["Verbindung", "klar-reinstoff", "Mineralwasser ist klar, enthält aber gelöste Stoffe."] },
  { name: "Weißgold", ans: "Gemisch", why: "Gold mit anderen Metallen (Legierung).", trap: ["Element", "nur-elemente-rein", "Weißgold enthält mehrere Metalle – mehrere Stoffe: ein Gemisch."] },
], [
  { name: "gold", ans: "Element", why: "Only gold atoms." },
  { name: "copper", ans: "Element", why: "Only copper atoms in a lattice.", trap: ["Verbindung", "element-verbindung", "The copper atoms are bonded – but all the same. One kind of atom: element."] },
  { name: "iron", ans: "Element", why: "Only iron atoms in a lattice.", trap: ["Verbindung", "element-verbindung", "The iron atoms are bonded – but all the same. One kind of atom: element."] },
  { name: "helium", ans: "Element", why: "Only helium atoms." },
  { name: "neon in a neon sign", ans: "Element", why: "Only neon atoms." },
  { name: "diamond", ans: "Element", tip: "Diamond is made of carbon (C). How many kinds of atoms is that?", why: "Only carbon atoms, firmly bonded.", trap: ["Verbindung", "element-verbindung", "In diamond only C atoms are bonded – one kind of atom: element."] },
  { name: "water (H₂O)", ans: "Verbindung", why: "H and O firmly bonded, all particles the same.", trap: ["Gemisch", "verbindung-gemisch", "Water contains H and O – but firmly bonded in every particle. One substance."] },
  { name: "carbon dioxide (CO₂)", ans: "Verbindung", why: "C and O firmly bonded.", trap: ["Element", "verbindung-element", "CO₂ has two kinds of atoms (C and O) – a compound."] },
  { name: "table sugar", ans: "Verbindung", tip: "Are all particles the same? How many kinds of atoms does one have?", why: "C, H and O firmly bonded, all particles the same.", trap: ["Gemisch", "verbindung-gemisch", "Sugar consists of identical particles – a pure substance, namely a compound."] },
  { name: "table salt (NaCl)", ans: "Verbindung", why: "Sodium and chlorine firmly bonded – in a lattice.", trap: ["Gemisch", "verbindung-gemisch", "Table salt is a pure substance: sodium and chlorine are firmly bonded in a lattice – a compound."] },
  { name: "methane (CH₄)", ans: "Verbindung", why: "C and H firmly bonded.", trap: ["Element", "verbindung-element", "CH₄ has two kinds of atoms (C and H) – a compound."] },
  { name: "air", ans: "Gemisch", why: "Nitrogen, oxygen, argon and more.", trap: ["Verbindung", "klar-reinstoff", "Air contains several substances that are not bonded."] },
  { name: "tap water", ans: "Gemisch", why: "Salts and gases are dissolved in the water.", trap: ["Verbindung", "klar-reinstoff", "Tap water is clear but contains dissolved substances."] },
  { name: "brass", ans: "Gemisch", why: "Copper and zinc mixed (alloy).", trap: ["Verbindung", "legierung-verbindung", "Copper and zinc are only mixed, not bonded into a new substance."] },
  { name: "bronze", ans: "Gemisch", why: "Copper and tin mixed (alloy).", trap: ["Element", "nur-elemente-rein", "Bronze contains two elements – copper and tin. Two substances: a mixture."] },
  { name: "steel", ans: "Gemisch", why: "Iron with some carbon (alloy).", trap: ["Element", "nur-elemente-rein", "Steel contains iron and carbon – two substances: a mixture."] },
  { name: "sugar water", ans: "Gemisch", why: "Sugar dissolved in water.", trap: ["Verbindung", "klar-reinstoff", "Sugar water is clear – but two substances: sugar and water."] },
  { name: "shielding gas of argon and CO₂", ans: "Gemisch", why: "Two gases mixed.", trap: ["Verbindung", "gemisch-verbindung", "Argon and CO₂ are not bonded – only mixed."] },
  { name: "silver", ans: "Element", why: "Only silver atoms in a lattice.", trap: ["Verbindung", "element-verbindung", "The silver atoms are bonded – but all the same. One kind of atom: element."] },
  { name: "aluminium", ans: "Element", why: "Only aluminium atoms in a lattice." },
  { name: "argon from a gas cylinder (Ar)", ans: "Element", why: "Only argon atoms." },
  { name: "ammonia (NH₃)", ans: "Verbindung", why: "N and H firmly bonded.", trap: ["Gemisch", "verbindung-gemisch", "NH₃ particles are all the same – N and H are bonded in the particle."] },
  { name: "pure alcohol (ethanol)", ans: "Verbindung", tip: "Are all particles the same? How many kinds of atoms does one have?", why: "C, H and O firmly bonded, all particles the same.", trap: ["Gemisch", "verbindung-gemisch", "Ethanol consists of identical particles – one substance with three kinds of atoms."] },
  { name: "calcium carbonate (CaCO₃)", ans: "Verbindung", why: "Ca, C and O firmly bonded.", trap: ["Element", "verbindung-element", "CaCO₃ has three kinds of atoms – a compound."] },
  { name: "iron oxide (Fe₂O₃)", ans: "Verbindung", why: "Iron and oxygen firmly bonded.", trap: ["Gemisch", "verbindung-gemisch", "In iron oxide Fe and O are bonded – a new substance, not a mixture."] },
  { name: "seawater", ans: "Gemisch", why: "Salts are dissolved in the water.", trap: ["Verbindung", "klar-reinstoff", "Seawater contains water and many salts – several substances."] },
  { name: "mineral water", ans: "Gemisch", why: "Minerals and gas are dissolved.", trap: ["Verbindung", "klar-reinstoff", "Mineral water is clear but contains dissolved substances."] },
  { name: "white gold", ans: "Gemisch", why: "Gold with other metals (alloy).", trap: ["Element", "nur-elemente-rein", "White gold contains several metals – several substances: a mixture."] },
]);

function alltag(): Task {
  const s = pick(ALLTAG);
  const label = (x: string) => (x === "Gemisch" ? GEMISCH : x === "Element" ? REIN_E : REIN_V);
  const others = ["Element", "Verbindung", "Gemisch"].filter(o => o !== s.ans && o !== s.trap?.[0]).map(label);
  return {
    ...mc(label(s.ans), [...(s.trap ? [d(label(s.trap[0]), s.trap[1], s.trap[2])] : []), ...others], 3, s.why),
    prompt: tr(`**${cap(s.name)}**: Reinstoff oder Gemisch? Element oder Verbindung?`, `**${cap(s.name)}**: pure substance or mixture? Element or compound?`),
    hint: tr("Ein Stoff oder mehrere? Wenn einer: eine Atomsorte oder mehrere?", "One substance or several? If one: one kind of atom or several?"),
    tip: s.tip ?? (/\(.*[A-Z].*\)/.test(s.name) ? tr("Lies die Formel: Jede Atomsorte beginnt mit einem Großbuchstaben. Gleiche zählen einmal.", "Read the formula: each kind of atom starts with a capital letter. Identical ones count once.")
      : s.ans === "Gemisch" ? tr(`Zähle auf, was alles in ${s.name} steckt. Mehr als ein Stoff?`, `List everything that is in ${s.name}. More than one substance?`)
      : tr(`Stell dir die Teilchen von ${s.name} vor: Wie viele Atomsorten stecken darin?`, `Imagine the particles of ${s.name}: how many kinds of atoms are in them?`)),
    explain: `${cap(s.name)}: ${because(s.why)} → **${label(s.ans)}**.`,
  };
}

/** „rein“ im Alltag heißt „nichts dazugegeben“ – in der Chemie heißt Reinstoff „nur ein Stoff“ */
const REIN_ALLTAG: { label: string; ans: "Gemisch" | "Reinstoff"; why: string; other?: [string, string] }[] = tr([
  { label: "„100 % reiner Orangensaft“", ans: "Gemisch", why: "Saft enthält Wasser, Zucker, Säuren und Farbstoffe." },
  { label: "„reines Mineralwasser“", ans: "Gemisch", why: "Im Wasser sind Mineralstoffe gelöst." },
  { label: "„reines Olivenöl“", ans: "Gemisch", why: "Öl ist ein Gemisch aus vielen Fetten." },
  { label: "„reiner Bienenhonig“", ans: "Gemisch", why: "Honig enthält Zucker, Wasser und viele andere Stoffe." },
  { label: "„reine Bergluft“", ans: "Gemisch", why: "Luft besteht aus Stickstoff, Sauerstoff, Argon und mehr." },
  { label: "„reine Butter“", ans: "Gemisch", why: "Butter enthält Fett, Wasser und Eiweiß." },
  { label: "„destilliertes Wasser“", ans: "Reinstoff", why: "Das Wasser wurde verdampft und wieder flüssig gemacht. Die gelösten Stoffe blieben zurück – übrig ist nur H₂O.", other: ["Lösung", "In destilliertem Wasser ist nichts gelöst."] },
  { label: "„reiner Apfelsaft“", ans: "Gemisch", why: "Saft enthält Wasser, Zucker, Säuren und Aromastoffe." },
  { label: "„reines Quellwasser“", ans: "Gemisch", why: "Auch Quellwasser enthält gelöste Mineralstoffe." },
  { label: "„Sterlingsilber 925“", ans: "Gemisch", why: "Silber mit Kupfer – eine Legierung." },
  { label: "„reines Kokosfett“", ans: "Gemisch", why: "Fett ist ein Gemisch aus vielen verschiedenen Fetten." },
], [
  { label: "“100 % pure orange juice”", ans: "Gemisch", why: "Juice contains water, sugar, acids and dyes." },
  { label: "“pure mineral water”", ans: "Gemisch", why: "Minerals are dissolved in the water." },
  { label: "“pure olive oil”", ans: "Gemisch", why: "Oil is a mixture of many fats." },
  { label: "“pure honey”", ans: "Gemisch", why: "Honey contains sugar, water and many other substances." },
  { label: "“pure mountain air”", ans: "Gemisch", why: "Air consists of nitrogen, oxygen, argon and more." },
  { label: "“pure butter”", ans: "Gemisch", why: "Butter contains fat, water and protein." },
  { label: "“distilled water”", ans: "Reinstoff", why: "The water was evaporated and turned liquid again. The dissolved substances stayed behind – only H₂O is left.", other: ["Solution", "Nothing is dissolved in distilled water."] },
  { label: "“pure apple juice”", ans: "Gemisch", why: "Juice contains water, sugar, acids and flavourings." },
  { label: "“pure spring water”", ans: "Gemisch", why: "Spring water also contains dissolved minerals." },
  { label: "“sterling silver 925”", ans: "Gemisch", why: "Silver with copper – an alloy." },
  { label: "“pure coconut oil”", ans: "Gemisch", why: "Fat is a mixture of many different fats." },
]);

function reinAlltag(): Task {
  const s = pick(REIN_ALLTAG);
  const opts = s.ans === "Gemisch"
    ? mc(W.mix, [
      d(W.pure, "alltag-rein", tr("„Rein“ heißt im Alltag: nichts dazugegeben. Chemisch sind es trotzdem mehrere Stoffe.", "In everyday life “pure” means: nothing added. Chemically it is still several substances.")),
      d(W.comp, "alltag-rein", tr("Die Stoffe sind nur gemischt, nicht verbunden. „Rein“ meint hier: nichts dazugegeben.", "The substances are only mixed, not bonded. “Pure” here means: nothing added.")),
    ], 3, s.why)
    : mc(W.pure, [dis(W.mix, s.why), dis(s.other![0], s.other![1])], 3, s.why);
  return {
    ...opts,
    prompt: tr(`Auf der Packung steht ${s.label}. Was ist das chemisch?`, `The package says ${s.label}. What is it chemically?`),
    hint: tr("Denk an die Teilchen: Wie viele verschiedene Sorten stecken darin?", "Think of the particles: how many different kinds are in it?"),
    tip: tr("„Rein“ auf der Packung heißt: nichts dazugegeben. Chemisch zählt nur: Wie viele Stoffe stecken darin?", "“Pure” on the package means: nothing added. Chemically only one thing counts: how many substances are in it?"),
    explain: `${s.label}: **${s.ans === "Gemisch" ? W.mix : W.pure}**. ${s.why}`,
  };
}

// ── Level 4: Lösen und Mischen im Teilchenmodell ────────────────────────────────

const LOESEN = tr([
  { id: "zucker", what: "Zucker löst sich in Wasser.", f: "C12H22O11", who: "Zuckerteilchen" },
  { id: "alkohol", what: "Alkohol mischt sich mit Wasser.", f: "C2H5OH", who: "Alkoholteilchen" },
], [
  { id: "zucker", what: "Sugar dissolves in water.", f: "C12H22O11", who: "sugar particles" },
  { id: "alkohol", what: "Alcohol mixes with water.", f: "C2H5OH", who: "alcohol particles" },
]);
// Sprudel nicht: dort reagiert ein kleiner Teil des CO₂ mit Wasser zu Kohlensäure (Probieren zeigt das)

/** Was passiert mit den Teilchen beim Lösen? */
function wohin(): Task {
  const s = pick(LOESEN);
  return {
    ...mc(tr("Sie verteilen sich zwischen den Wasserteilchen.", "They spread out between the water particles."), [
      d(tr("Sie verschwinden.", "They disappear."), "verschwindet", tr(`Die ${s.who} sind noch da – verteilt und zu klein zum Sehen.`, `The ${s.who} are still there – spread out and too small to see.`)),
      s.id === "zucker" ? d(tr("Sie schmelzen.", "They melt."), "loesen-schmelzen", tr("Schmelzen braucht Hitze. Beim Lösen lösen sich die Teilchen nur voneinander.", "Melting needs heat. When dissolving, the particles just separate from each other.")) : null,
      d(tr("Sie werden kleiner.", "They get smaller."), "teilchen-veraendert", tr(`Die ${s.who} bleiben gleich groß. Sie verteilen sich nur.`, `The ${s.who} stay the same size. They just spread out.`)),
      d(tr("Sie sinken alle nach unten.", "They all sink to the bottom."), "geloest-unten", tr("Die Teilchen bewegen sich ständig und verteilen sich überall – auch oben.", "The particles move all the time and spread out everywhere – also at the top.")),
    ], 3, tr("Genau: gleich viele Teilchen, nur überall verteilt.", "Exactly: the same number of particles, just spread everywhere.")),
    pic: exPic(s.id, "vorher"),
    prompt: tr(`${s.what} Was passiert mit den **${s.who}**?`, `${s.what} What happens to the **${s.who}**?`),
    hint: tr("Teilchen verschwinden nicht und ändern sich beim Mischen nicht.", "Particles do not disappear and do not change when mixing."),
    tip: tr(`Die ${s.who} bleiben, wie sie sind. Sie bewegen sich ständig. Wohin können sie im Wasser?`, `The ${s.who} stay as they are. They move all the time. Where can they go in the water?`),
    explain: tr(`Die ${s.who} lösen sich voneinander und verteilen sich **zwischen den Wasserteilchen**. Es sind gleich viele wie vorher.`, `The ${s.who} separate from each other and spread out **between the water particles**. There are as many as before.`),
  };
}

/** Wie viele gelöste Teilchen sind nachher im Wasser? (Teilchen bleiben erhalten) */
function erhalten(): Task {
  const s = pick(LOESEN);
  const water = int(10, 14), k = int(3, 6);
  const mix: [string, number][] = [["H2O", water], [s.f, k]];
  const traps = validTraps([
    { field: "n", value: 0, miss: "verschwindet", why: tr(`Die ${s.who} verschwinden nicht. Sie verteilen sich nur im Wasser.`, `The ${s.who} do not disappear. They just spread out in the water.`) },
    { field: "n", value: water, miss: "sorten-uebersehen", why: tr(`**${water}** sind die Wasserteilchen. Gefragt sind die ${s.who}.`, `**${water}** is the number of water particles. The question asks for the ${s.who}.`) },
    { field: "n", value: water + k, miss: "teilchen-statt-stoffe", why: tr(`**${water + k}** sind alle Teilchen. Gefragt sind nur die ${s.who}.`, `**${water + k}** is the number of all particles. The question asks only for the ${s.who}.`) },
  ] as Trap[], { n: k });
  return {
    kind: "num", answer: k, traps,
    pic: exPic(s.id, "vorher", mix),
    prompt: tr(`So sieht es **vorher** aus. Wie viele **${s.who}** sind im Wasser, wenn alles gemischt ist?`, `This is what it looks like **before**. How many **${s.who}** are in the water when everything is mixed?`),
    hint: tr("Beim Mischen geht kein Teilchen verloren.", "No particle is lost when mixing."),
    tip: tr(`Zähle nur die ${s.who} im Bild. Beim Mischen geht keines verloren und keines kommt dazu.`, `Count only the ${s.who} in the picture. When mixing none is lost and none is added.`),
    explain: tr(`Vorher ${k}, nachher **${k}** ${s.who}. Sie verteilen sich nur.`, `Before ${k}, after **${k}** ${s.who}. They just spread out.`),
    praise: tr("Gleich viele Teilchen wie vorher – genau so ist es.", "As many particles as before – exactly right."),
  };
}

/** Masse beim Lösen bleibt erhalten */
function masse(): Task {
  const [stoff, what, solvent, art] = pick(tr([["Zucker", "das Zuckerwasser", "Wasser", "Der"], ["Salz", "das Salzwasser", "Wasser", "Das"], ["Zucker", "der Tee", "Tee", "Der"]], [["sugar", "the sugar water", "water", "The"], ["salt", "the salt water", "water", "The"], ["sugar", "the tea", "tea", "The"]]));
  const w = pick([100, 150, 200, 250, 300, 400, 500]), z = pick([10, 20, 30, 40, 50]);
  const g = (x: number) => `${x} g`;
  return {
    ...mc(g(w + z), [
      d(g(w), "verschwindet", tr(`${art} ${stoff} ist noch da – nur verteilt. Seine ${z} g zählen mit.`, `${art} ${stoff} is still there – just spread out. Its ${z} g count too.`)),
      d(g(w + z / 2), "masse-aendert", tr("Die Teilchen werden beim Lösen nicht leichter. Die Masse bleibt gleich.", "The particles do not get lighter when dissolving. The mass stays the same.")),
      d(g(w + 2 * z), "masse-aendert", tr(`Beim Lösen kommt nichts dazu. ${solvent} und ${stoff} zusammen wiegen genauso viel.`, `Nothing is added when dissolving. The ${solvent} and ${stoff} together weigh just as much.`)),
    ], 4, `${w} g + ${z} g = ${w + z} g.`),
    prompt: tr(`In **${w} g** ${solvent} lösen sich **${z} g** ${stoff}. Wie schwer ist ${what} jetzt?`, `**${z} g** of ${stoff} dissolves in **${w} g** of ${solvent}. How heavy is ${what} now?`),
    hint: tr("Beim Lösen verschwinden keine Teilchen. Was bedeutet das für die Masse?", "No particles disappear when dissolving. What does that mean for the mass?"),
    tip: tr("Ist nach dem Lösen weniger, gleich viel oder mehr Stoff im Glas?", "After dissolving, is there less, the same or more substance in the glass?"),
    explain: tr(`Alle Teilchen sind noch da: ${w} g + ${z} g = **${w + z} g**.`, `All particles are still there: ${w} g + ${z} g = **${w + z} g**.`),
  };
}

/** Was ist zwischen den Teilchen? – leerer Raum */
function zwischen(): Task {
  const s = pick(tr([
    { of: "den Wasserteilchen", stuff: "Wasser", ex: "wasser" },
    { of: "den Heliumteilchen im Ballon", stuff: "Helium", ex: "helium" },
    { of: "den Kupfer- und Zinkatomen im Messing", stuff: "Messing", ex: "messing" },
    { of: "den Teilchen im Zuckerwasser", stuff: "Zuckerwasser", ex: "zucker" },
    { of: "den Argon- und CO₂-Teilchen im Schutzgas", stuff: "Schutzgas", ex: "schutzgas" },
  ], [
    { of: "the water particles", stuff: "Water", ex: "wasser" },
    { of: "the helium particles in the balloon", stuff: "Helium", ex: "helium" },
    { of: "the copper and zinc atoms in brass", stuff: "Brass", ex: "messing" },
    { of: "the particles in sugar water", stuff: "Sugar water", ex: "zucker" },
    { of: "the argon and CO₂ particles in the shielding gas", stuff: "Shielding gas", ex: "schutzgas" },
  ]));
  return {
    ...mc(tr("Nichts – leerer Raum", "Nothing – empty space"), [
      d(tr("Luft", "Air"), "luft-dazwischen", tr("Luft besteht selbst aus Teilchen. Zwischen den Teilchen ist gar nichts.", "Air itself consists of particles. Between the particles there is nothing at all.")),
      d(s.stuff, "luft-dazwischen", tr(`${s.stuff} **besteht** aus diesen Teilchen. Dazwischen ist nichts.`, `${s.stuff} **consists** of these particles. There is nothing in between.`)),
      d(tr("Wasserdampf", "Water vapour"), "luft-dazwischen", tr("Auch Wasserdampf besteht aus Teilchen. Zwischen den Teilchen ist leerer Raum.", "Water vapour also consists of particles. Between the particles there is empty space.")),
    ], 4, tr("Genau: Zwischen den Teilchen ist leerer Raum.", "Exactly: between the particles there is empty space.")),
    pic: exPic(s.ex),
    prompt: tr(`Was ist zwischen ${s.of}?`, `What is between ${s.of}?`),
    hint: tr("Ein Stoff besteht nur aus seinen Teilchen. Was bleibt dann für die Lücken?", "A substance consists only of its particles. What is left for the gaps?"),
    tip: tr("Woraus bestehen Luft und Wasserdampf selbst? Was liegt dann zwischen den Teilchen im Bild?", "What are air and water vapour themselves made of? So what lies between the particles in the picture?"),
    explain: tr("Zwischen den Teilchen ist **nichts** – leerer Raum. Auch Luft besteht aus Teilchen.", "Between the particles there is **nothing** – empty space. Air also consists of particles."),
  };
}

/** Teilchen bewegen sich ständig */
function bewegung(): Task {
  const s = pick(tr([
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
  ], [
    { q: "Why do alcohol and water mix even **without stirring**?", ok: "The particles move all the time.", pic: exPic("alkohol", "vorher"),
      w: [d("They don't – without stirring everything stays separate.", "teilchen-ruhen", "The particles move all the time. That is why it mixes by itself."),
        d("The particles get bigger and fill everything.", "teilchen-veraendert", "Particles do not get bigger. They move and spread out.")] },
    { q: "The divider between argon and CO₂ is removed. What happens?", ok: "The gases mix by themselves.", pic: exPic("schutzgas", "vorher"),
      w: [d("Nothing – you would have to shake it.", "teilchen-ruhen", "Gas particles fly around all the time. They mix by themselves."),
        d("CO₂ collects at the bottom, argon at the top.", "geloest-unten", "The particles move all the time. They spread out everywhere.")] },
    { q: "Do the atoms in a piece of **brass** move?", ok: "Yes, they vibrate in place.", pic: exPic("messing"),
      w: [d("No, in solids they are at rest.", "teilchen-ruhen", "Particles move in solids too – they vibrate in place."),
        d("Only if you heat the brass.", "teilchen-ruhen", "The particles always vibrate. When heated they only vibrate more strongly.")] },
    { q: "Why don't the helium particles in the balloon simply fall to the bottom?", ok: "They move all the time and collide.", pic: exPic("helium"),
      w: [d("Air between the particles holds them.", "luft-dazwischen", "There is nothing between the particles. The particles fly around all the time."),
        d("They are at rest until you shake the balloon.", "teilchen-ruhen", "Gas particles always move – even without shaking.")] },
    { q: "A drop of ink falls into water. After an hour everything is coloured. Why?", ok: "The particles move all the time and spread out.",
      w: [d("The ink keeps increasing.", "teilchen-veraendert", "No particles are added. The few just spread out."),
        d("The ink particles get bigger.", "teilchen-veraendert", "Particles do not get bigger. They spread out between the water particles.")] },
  ]));
  return {
    ...mc(s.ok, s.w, 3, tr("Genau: Teilchen sind ständig in Bewegung.", "Exactly: particles are always moving.")),
    ...(s.pic ? { pic: s.pic } : {}),
    prompt: s.q,
    hint: tr("Stehen Teilchen je still?", "Do particles ever stand still?"),
    tip: tr("Gibt es einen Augenblick, in dem die Teilchen ganz still stehen – im Gas, in der Flüssigkeit, im Festen?", "Is there a moment when the particles stand completely still – in a gas, a liquid, a solid?"),
    explain: tr("Teilchen bewegen sich **ständig** – im Gas frei, in Flüssigkeiten aneinander vorbei, im Festen am Platz.", "Particles move **all the time** – freely in a gas, past each other in liquids, in place in solids."),
  };
}

/** Teilchen haben nicht die Eigenschaften des Stoffs (Farbe, flüssig, hart) */
function farbe(): Task {
  const s = pick(tr([
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
      w: [d("Die Teilchen im Eis sind hart.", "teilchen-wie-stoff", "Es sind dieselben H₂O-Teilchen. Im Eis sitzen sie nur fest an ihren Plätzen."),
        d("Die Teilchen im Eis sind kleiner.", "teilchen-veraendert", "Die Teilchen bleiben gleich groß. Nur ihre Anordnung ändert sich.")] },
  ], [
    { q: "Copper is reddish brown. What colour is a **single copper atom**?", ok: "None – only the substance has a colour.",
      w: [d("Reddish brown like copper", "teilchen-wie-stoff", "A single atom has no colour. The colour only comes from very many atoms."),
        d("Orange like in the model", "modell-echt", "The colours in the model only tell things apart. Atoms themselves have no colour.")] },
    { q: "Sugar is white. What colour is a **sugar particle**?", ok: "None – only the substance has a colour.",
      w: [d("White like sugar", "teilchen-wie-stoff", "A single particle has no colour. White is the substance as a whole."),
        d("Black, red and white like in the model", "modell-echt", "The model colours only show the kinds of atoms. Real particles have no colour.")] },
    { q: "Brass is golden yellow. What colour are the **atoms** in it?", ok: "None – only the substance has a colour.",
      w: [d("Golden yellow", "teilchen-wie-stoff", "Atoms have no colour. Golden yellow is the brass as a whole."),
        d("Orange and bluish grey like in the model", "modell-echt", "The model colours only tell copper and zinc apart. Atoms have no colour.")] },
    { q: "Water is liquid. Are the **water particles** themselves liquid?", ok: "No – only the substance is liquid.",
      w: [d("Yes, otherwise water would not be liquid.", "teilchen-wie-stoff", "Liquid means: the particles slide past each other. A single particle is not liquid."),
        d("Yes, they are tiny droplets.", "teilchen-wie-stoff", "A droplet consists of countless particles. A particle is not a droplet.")] },
    { q: "Ice is solid, water is liquid. How do the particles differ?", ok: "Not at all – only arrangement and movement.",
      w: [d("The particles in ice are hard.", "teilchen-wie-stoff", "They are the same H₂O particles. In ice they just sit firmly in their places."),
        d("The particles in ice are smaller.", "teilchen-veraendert", "The particles stay the same size. Only their arrangement changes.")] },
  ]));
  return {
    ...mc(s.ok, s.w, 3, tr("Genau: Teilchen haben nicht die Eigenschaften des Stoffs.", "Exactly: particles do not have the properties of the substance.")),
    prompt: s.q,
    hint: tr("Vergleiche: ein einzelnes Teilchen – und ein ganzes Stück, das man sehen und anfassen kann.", "Compare: a single particle – and a whole piece you can see and touch."),
    tip: /flüssig|fest|liquid|solid/.test(s.q) ? tr("Denk an viele Teilchen zusammen: Was ändert sich, wenn Wasser gefriert – die Teilchen oder wie sie liegen?", "Think of many particles together: what changes when water freezes – the particles or how they lie?")
      : tr("Die Modellfarben hat sich jemand ausgedacht. Was sieht man, wenn man ein Stück davon anschaut?", "Someone made up the model colours. What do you see when you look at a piece of it?"),
    explain: tr("Farbe, fest oder flüssig sind Eigenschaften des **Stoffs**. Ein einzelnes Teilchen hat sie nicht.", "Colour, solid or liquid are properties of the **substance**. A single particle does not have them."),
  };
}

/** Merksatz je Variante (Blickpunkt) */
const NACHHER_LEAD: Record<string, string> = tr({
  zucker: "Vergleiche: vorher und nach einer Weile.", alkohol: "Vergleiche: vorher und nach einer Weile.",
  oel: "Denk an Salatdressing, das eine Weile steht.", messing: "Wie liegen die Atome nach dem Erstarren?", schutzgas: "Wie bewegen sich Gasteilchen?",
}, {
  zucker: "Compare: before and after a while.", alkohol: "Compare: before and after a while.",
  oel: "Think of salad dressing left to stand for a while.", messing: "How do the atoms lie after solidifying?", schutzgas: "How do gas particles move?",
});
const NACHHER_TIP: Record<string, string> = tr({
  zucker: "Bewegen sich die Zuckerteilchen nach dem Lösen weiter? Und wie viele sind es in jedem Bild?",
  alkohol: "Bewegen sich die Alkoholteilchen auch ohne Rühren? Und wie viele sind es in jedem Bild?",
  oel: "Öl schwimmt auf Wasser. Mischt es sich mit ihm?",
  messing: "Bleiben die Atome beim Erstarren dort, wo sie in der Schmelze waren?",
  schutzgas: "Stehen Gasteilchen je still? Wohin kommen sie nach einer Weile?",
}, {
  zucker: "Do the sugar particles keep moving after dissolving? And how many are there in each picture?",
  alkohol: "Do the alcohol particles move even without stirring? And how many are there in each picture?",
  oel: "Oil floats on water. Does it mix with it?",
  messing: "Do the atoms stay where they were in the melt when it solidifies?",
  schutzgas: "Do gas particles ever stand still? Where do they get to after a while?",
});

/** Welches Teilchenbild passt nachher? */
function nachher(): Task {
  const s = pick(["zucker", "alkohol", "oel", "messing", "schutzgas"]);
  const small: Record<string, [string, number][]> = {
    zucker: [["H2O", 12], ["C12H22O11", 3]], alkohol: [["H2O", 10], ["C2H5OH", 5]],
    oel: [["H2O", 10], ["C12H26", 5]], messing: [["Cu", 6], ["Zn", 2]], schutzgas: [["Ar", 5], ["CO2", 3]],
  };
  const p = (arrange: Arrange, m = small[s]): Pic => exPic(s, arrange, m, s === "schutzgas" ? "CO2" : undefined);
  const water: [string, number][] = [["H2O", sum(small[s])]];
  const cases: Record<string, { q: string; ok: string; wrong: [Pic, string, string][] }> = tr({
    zucker: { q: "Zucker hat sich in Wasser gelöst. Welches Bild zeigt das Zuckerwasser?", ok: "Genau: Die Zuckerteilchen sind überall verteilt.", wrong: [
      [p("unten"), "geloest-unten", "Gelöster Zucker verteilt sich überall – nicht nur unten."],
      [p("nachher", water), "verschwindet", "Hier fehlt der Zucker. Er ist noch da – nur gelöst."],
      [p("vorher"), "kristall-bleibt", "Das ist vorher: Der Zucker ist noch ein Kristall. Beim Lösen trennen sich seine Teilchen voneinander."]] },
    alkohol: { q: "Alkohol und Wasser sind gemischt. Welches Bild passt?", ok: "Genau: Die Alkoholteilchen sind überall verteilt.", wrong: [
      [p("oben"), "geloest-heterogen", "Alkohol bleibt nicht als Schicht oben. Er mischt sich ganz mit Wasser."],
      [p("unten"), "geloest-unten", "Alkohol sammelt sich nicht unten. Er verteilt sich überall."],
      [p("nachher", water), "verschwindet", "Hier fehlt der Alkohol. Er ist noch da – nur verteilt."]] },
    oel: { q: "Öl und Wasser wurden geschüttelt. Wie sieht es nach einer Weile aus?", ok: "Genau: Öl und Wasser trennen sich wieder, Öl oben.", wrong: [
      [p("gemischt"), "oel-mischt", "Öl und Wasser mischen sich nicht. Das Öl steigt wieder auf."],
      [p("unten"), "oel-unten", "Öl schwimmt auf Wasser – es sammelt sich oben, nicht unten."]] },
    messing: { q: "Kupfer und Zink wurden zusammen geschmolzen. Welches Bild zeigt das erstarrte Messing?", ok: "Genau: Die Atome sind zufällig gemischt.", wrong: [
      [p("getrennt"), "teilchen-ruhen", "In der Schmelze bewegen sich die Atome und mischen sich. So erstarren sie auch – nicht in Stücken."],
      [p("abwechselnd"), "legierung-verbindung", "Im Messing sitzen die Zinkatome zufällig auf Plätzen des Kupfergitters – ohne festes Muster und ohne festes Verhältnis."]] },
    schutzgas: { q: "Argon und CO₂ wurden gemischt. Welches Bild zeigt das Schutzgas nach einer Weile?", ok: "Genau: Die Gase sind gleichmäßig gemischt.", wrong: [
      [p("getrennt"), "teilchen-ruhen", "Die Gasteilchen bewegen sich ständig. Sie bleiben nicht getrennt."],
      [p("unten"), "geloest-unten", "Gase mischen sich vollständig – das CO₂ bleibt nicht unten."]] },
  }, {
    zucker: { q: "Sugar has dissolved in water. Which picture shows the sugar water?", ok: "Exactly: the sugar particles are spread everywhere.", wrong: [
      [p("unten"), "geloest-unten", "Dissolved sugar spreads everywhere – not just at the bottom."],
      [p("nachher", water), "verschwindet", "The sugar is missing here. It is still there – only dissolved."],
      [p("vorher"), "kristall-bleibt", "That is before: the sugar is still a crystal. When it dissolves, its particles separate from each other."]] },
    alkohol: { q: "Alcohol and water are mixed. Which picture fits?", ok: "Exactly: the alcohol particles are spread everywhere.", wrong: [
      [p("oben"), "geloest-heterogen", "Alcohol does not stay as a layer on top. It mixes completely with water."],
      [p("unten"), "geloest-unten", "Alcohol does not collect at the bottom. It spreads everywhere."],
      [p("nachher", water), "verschwindet", "The alcohol is missing here. It is still there – only spread out."]] },
    oel: { q: "Oil and water were shaken. What does it look like after a while?", ok: "Exactly: oil and water separate again, oil on top.", wrong: [
      [p("gemischt"), "oel-mischt", "Oil and water do not mix. The oil rises again."],
      [p("unten"), "oel-unten", "Oil floats on water – it collects at the top, not at the bottom."]] },
    messing: { q: "Copper and zinc were melted together. Which picture shows the solidified brass?", ok: "Exactly: the atoms are randomly mixed.", wrong: [
      [p("getrennt"), "teilchen-ruhen", "In the melt the atoms move and mix. They solidify like that too – not in chunks."],
      [p("abwechselnd"), "legierung-verbindung", "In brass the zinc atoms sit randomly on places of the copper lattice – with no fixed pattern and no fixed ratio."]] },
    schutzgas: { q: "Argon and CO₂ were mixed. Which picture shows the shielding gas after a while?", ok: "Exactly: the gases are evenly mixed.", wrong: [
      [p("getrennt"), "teilchen-ruhen", "The gas particles move all the time. They do not stay separate."],
      [p("unten"), "geloest-unten", "Gases mix completely – the CO₂ does not stay at the bottom."]] },
  });
  const c = cases[s];
  const all = [p("nachher"), ...c.wrong.map(w => w[0])];
  const keys = all.map(describe);
  return {
    ...mc(keys[0], c.wrong.map(([, miss, why], i) => d(keys[i + 1], miss, why)), 4, c.ok),
    pics: Object.fromEntries(keys.map((k, i) => [k, all[i]])),
    prompt: c.q,
    hint: s === "oel" ? tr("Mischen sich Öl und Wasser? Was schwimmt oben?", "Do oil and water mix? What floats on top?") : tr("Teilchen verschwinden nicht und bewegen sich ständig.", "Particles do not disappear and move all the time."),
    tip: NACHHER_TIP[s],
    lead: NACHHER_LEAD[s],
    explain: s === "oel" ? tr("Öl und Wasser trennen sich wieder: **Öl oben**, Wasser unten.", "Oil and water separate again: **oil on top**, water at the bottom.") : tr("Die Teilchen sind **gleichmäßig verteilt** – und alle noch da.", "The particles are **evenly spread** – and all still there."),
  };
}

// ── Antippen im Teilchenbild ─────────────────────────────────────────────────

const atomsOf = (f: string) => analyse([[f, 1]]).atome;
const ATOM_WORD = (n: number) => tr(n === 1 ? "einem Atom" : `${n} Atomen`, n === 1 ? "one atom" : `${n} atoms`);

/** Tippe auf ein Teilchen aus n Atomen (Teilchenbild mit verschieden großen Teilchen) */
function tippAtome(): Task {
  for (;;) {
    const fs = shuffle([...COMPOUNDS, ...NOBLE]).slice(0, 3);
    const ns = fs.map(atomsOf);
    if (new Set(ns).size < 3) continue;
    const k = int(0, 2), f = fs[k], n = ns[k];
    const pic: Pic = { mix: fs.map(x => [x, int(2, 4)] as [string, number]), state: "modell" };
    return {
      kind: "tap", answer: f, parts: fs, pic,
      traps: fs.map((x, i) => (i === k ? null : { values: { pick: i }, miss: "atome-gezaehlt", why: tr(`${F(x)} besteht aus ${ATOM_WORD(ns[i])}. Zähle die Kugeln in einem Teilchen.`, `${F(x)} is made of ${ATOM_WORD(ns[i])}. Count the spheres in one particle.`) })).filter(x => !!x) as Trap[],
      prompt: tr(`Tippe auf ein Teilchen aus **${ATOM_WORD(n)}**.`, `Tap a particle made of **${ATOM_WORD(n)}**.`),
      hint: tr("Jede Kugel ist ein Atom. Zähle die Kugeln eines Teilchens.", "Each sphere is an atom. Count the spheres of one particle."),
      tip: tr(`Suche ein Teilchen mit ${n} ${n === 1 ? "Kugel" : "Kugeln"}.`, `Look for a particle with ${n} ${n === 1 ? "sphere" : "spheres"}.`),
      explain: tr(`${F(f)} hat **${ATOM_WORD(n)}**.`, `${F(f)} has **${ATOM_WORD(n)}**.`),
    };
  }
}

/** Tippe auf ein Teilchen eines Elements bzw. einer Verbindung */
function tippArt(element: boolean): Task {
  const one = element ? pick(NOBLE) : pick(COMPOUNDS);
  const rest = shuffle(element ? COMPOUNDS : NOBLE).slice(0, 2);
  const fs = shuffle([one, ...rest]);
  const pic: Pic = { mix: fs.map(x => [x, int(2, 4)] as [string, number]), state: "modell" };
  const word = element ? tr("eines **Elements**", "of an **element**") : tr("einer **Verbindung**", "of a **compound**");
  return {
    kind: "tap", answer: one, parts: fs, pic,
    traps: fs.map((x, i) => (x === one ? null : {
      values: { pick: i }, miss: element ? "verbindung-element" : "element-verbindung",
      why: element ? tr(`${F(x)} hat mehrere Atomsorten. Das ist eine Verbindung.`, `${F(x)} has several kinds of atoms. That is a compound.`)
        : tr(`${F(x)} hat nur eine Atomsorte. Das ist ein Element.`, `${F(x)} has only one kind of atom. That is an element.`),
    })).filter(x => !!x) as Trap[],
    prompt: tr(`Tippe auf ein Teilchen ${word}.`, `Tap a particle ${word}.`),
    hint: tr("Im Bild: Teilchen in einer Farbe gehören zu einem Element, Teilchen mit mehreren Farben zu einer Verbindung.", "In the picture: particles of one colour belong to an element, particles with several colours to a compound."),
    tip: element ? tr("Suche ein Teilchen mit nur einer Farbe.", "Look for a particle with only one colour.") : tr("Suche ein Teilchen mit mehreren Farben.", "Look for a particle with several colours."),
    explain: element ? tr(`${nameOf(one)} (${F(one)}): eine Atomsorte → **Element**.`, `${nameOf(one)} (${F(one)}): one kind of atom → **element**.`)
      : tr(`${nameOf(one)} (${F(one)}): mehrere Atomsorten → **Verbindung**.`, `${nameOf(one)} (${F(one)}): several kinds of atoms → **compound**.`),
  };
}

/** Zahlen nicht eintippen: Zählaufgaben als Auswahl – die Fallen werden diagnostische Distraktoren, Zahlen aufsteigend (auch mit Einheit: Masse) */
function asChoice(t: Task): Task {
  if (t.kind === "mc") return t.options.every(o => /^\d+( g)?$/.test(o)) ? sortNum(t) : t;
  if (t.kind !== "num") return t;
  const { traps, answer, ...rest } = t;
  return sortNum({ ...rest, ...mc(String(answer), [...(traps ?? []).map(x => (x.value !== undefined ? d(String(x.value), x.miss, x.why) : null)), ...nearNums(answer, 0)]) } as Task & McTask);
}
/** Zahlen-Auswahl aufsteigend (Rückmeldungen wandern mit) */
function sortNum(m: Task & McTask): Task {
  const order = m.options.map((_, i) => i).sort((a, b) => parseFloat(m.options[a]) - parseFloat(m.options[b]));
  const remap = <V>(r?: Record<number, V>) => (r ? Object.fromEntries(Object.entries(r).map(([i, v]) => [order.indexOf(Number(i)), v])) as Record<number, V> : undefined);
  const why = remap(m.why), miss = remap(m.miss);
  const { why: _w, miss: _m, ...rest } = m;
  return { ...rest, options: order.map(i => m.options[i]), answer: order.indexOf(m.answer), ...(why ? { why } : {}), ...(miss ? { miss } : {}) } as Task;
}

// ── Level und Runden ─────────────────────────────────────────────────────────

const RAW: Record<string, () => Task> = {
  teilchen, stoffe, reinOderGemisch, reinGemisch, einordnen, bildArt, bildWahl, verbindungen, elemente, atomsorten,
  homogen: () => homogen(), gemischart: () => gemischart(), alltag, reinAlltag, wohin, erhalten, masse, zwischen, bewegung, farbe, nachher,
  homogenBild: homogenOf(e => !!e.ex), homogenKlar: homogenOf(e => e.trap?.[1] === "klar-reinstoff"), homogenSieht: homogenOf(e => e.trap?.[1] === "sieht-einheitlich"),
  artFluessig: gemischartOf(ARTEN.slice(0, 1).concat(ARTEN.slice(3, 5))), artFestGas: gemischartOf([ARTEN[1], ARTEN[2], ARTEN[5]]), artInGas: gemischartOf(ARTEN.slice(6, 9)),
  tippAtome, tippElement: () => tippArt(true), tippVerbindung: () => tippArt(false),
  trennWahl: () => trennWahl(K5_METHODS), trennEigenschaft: () => trennEigenschaft(K5_METHODS), trennTipp: () => trennTipp(K5_METHODS),
  loesWahl: () => trennWahl(K6_METHODS), loesEigenschaft: () => trennEigenschaft(K6_METHODS), loesTipp: () => trennTipp(K6_METHODS), trennReihe,
};
/** neu würfeln, bis keine zwei Atomsorten ähnliche Farben haben */
export const GENS: Record<string, () => Task> = Object.fromEntries(Object.entries(RAW).map(([id, gen]) => [id, () => {
  let t = gen();
  for (let k = 0; k < 60 && !distinctColors(t); k++) t = gen();
  return asChoice(t);
}]));

export const TYPE_NAMES: Record<string, string> = tr({
  teilchen: "Teilchen zählen", stoffe: "Stoffe zählen", reinOderGemisch: "Reinstoff oder Gemisch", reinGemisch: "Reinstoff, Element oder Verbindung",
  einordnen: "Element oder Verbindung", bildArt: "Teilchenbild einordnen", bildWahl: "Teilchenbild auswählen",
  verbindungen: "Verbindungen zählen", elemente: "Elemente zählen", atomsorten: "Atomsorten zählen",
  homogen: "Homogen oder heterogen", gemischart: "Art des Gemischs", alltag: "Stoffe im Alltag", reinAlltag: "„Rein“ im Alltag",
  wohin: "Lösen im Teilchenmodell", erhalten: "Teilchen bleiben erhalten", masse: "Masse beim Lösen", zwischen: "Zwischen den Teilchen",
  bewegung: "Teilchen bewegen sich", farbe: "Teilchen und Stoff", nachher: "Nach dem Mischen",
  homogenBild: "Homogen oder heterogen im Teilchenbild", homogenKlar: "Klar heißt nicht rein", homogenSieht: "Sieht einheitlich aus",
  artFluessig: "Lösung, Emulsion, Suspension", artFestGas: "Legierung, Gasgemisch, Gemenge", artInGas: "Rauch, Nebel, Schaum",
  tippAtome: "Atome im Teilchen", tippElement: "Element im Bild finden", tippVerbindung: "Verbindung im Bild finden",
  trennWahl: "Trennverfahren wählen", trennEigenschaft: "Genutzte Eigenschaft", trennTipp: "Teile nach dem Trennen", trennReihe: "Reihenfolge der Trennschritte",
  loesWahl: "Lösungen trennen: Verfahren", loesEigenschaft: "Lösungen trennen: Eigenschaft", loesTipp: "Lösungen trennen: Teile",
}, {
  teilchen: "Counting particles", stoffe: "Counting substances", reinOderGemisch: "Pure substance or mixture", reinGemisch: "Pure substance, element or compound",
  einordnen: "Element or compound", bildArt: "Classifying a particle picture", bildWahl: "Choosing a particle picture",
  verbindungen: "Counting compounds", elemente: "Counting elements", atomsorten: "Counting kinds of atoms",
  homogen: "Homogeneous or heterogeneous", gemischart: "Type of mixture", alltag: "Substances in everyday life", reinAlltag: "“Pure” in everyday life",
  wohin: "Dissolving in the particle model", erhalten: "Particles are conserved", masse: "Mass when dissolving", zwischen: "Between the particles",
  bewegung: "Particles move", farbe: "Particle and substance", nachher: "After mixing",
  homogenBild: "Homogeneous or heterogeneous in the particle picture", homogenKlar: "Clear does not mean pure", homogenSieht: "Looks uniform",
  artFluessig: "Solution, emulsion, suspension", artFestGas: "Alloy, gas mixture, coarse mixture", artInGas: "Smoke, fog, foam",
  tippAtome: "Atoms in a particle", tippElement: "Finding an element", tippVerbindung: "Finding a compound",
  trennWahl: "Choosing a separation method", trennEigenschaft: "Property used", trennTipp: "Parts after separating", trennReihe: "Order of separation steps",
  loesWahl: "Separating solutions: method", loesEigenschaft: "Separating solutions: property", loesTipp: "Separating solutions: parts",
});

/** `seq`: feste Reihenfolge der zehn Aufgaben (leicht → schwer, jede baut auf der vorigen auf), `leads`: Merksatz je Schritt */
interface Level extends QuizLevel { types: string[]; seq: string[]; leads: string[]; cue: boolean }
type Step = [type: string, lead: string];

// Lernen in sechs Kapiteln (je Kapitel zuerst die Lektion in lessons.tsx, dann diese zehn Aufgaben): Merksatz je Aufgabe
// Merksatz = Blickpunkt, nie die gefragte Aussage (Test: kein Inhaltswort der richtigen Antwort). Hängt die Aufgabe von einer zufälligen
// Variante ab (Trennverfahren, Bild nach dem Mischen), setzt der Generator den Merksatz selbst (`lead` der Aufgabe hat Vorrang).
const K1: Step[] = tr([
  ["teilchen", "Ein **Teilchen** ist ein **Molekül** oder ein einzelnes Atom."],
  ["teilchen", "Schau, welche Kugeln fest zusammenhängen."],
  ["tippAtome", "Jede Kugel im Bild ist **ein Atom**."],
  ["atomsorten", "Die Farbe einer Kugel zeigt ihre **Atomsorte**."],
  ["tippAtome", "Zähle nur innerhalb **eines** Teilchens."],
  ["atomsorten", "Achte auf die Farben, nicht auf die Zahl der Kugeln."],
  ["stoffe", "Lege in Gedanken gleiche Teilchen auf einen Haufen."],
  ["stoffe", "Teilchen, Atomsorten, Stoffe – lies genau, was gefragt ist."],
  ["zwischen", "Denk daran, woraus Luft und Wasser selbst bestehen."],
  ["farbe", "Was du siehst, sind sehr viele Teilchen zusammen."],
], [
  ["teilchen", "A **particle** is a **molecule** or a single atom."],
  ["teilchen", "Look at which spheres are firmly joined."],
  ["tippAtome", "Each sphere in the picture is **one atom**."],
  ["atomsorten", "The colour of a sphere shows its **kind of atom**."],
  ["tippAtome", "Count only inside **one** particle."],
  ["atomsorten", "Look at the colours, not at the number of spheres."],
  ["stoffe", "In your mind, put identical particles on one pile."],
  ["stoffe", "Particles, kinds of atoms, substances – read exactly what is asked."],
  ["zwischen", "Think about what air and water themselves are made of."],
  ["farbe", "What you see is a huge number of particles together."],
]);
const K2: Step[] = tr([
  ["einordnen", "Wie viele **Atomsorten** stecken in einem Teilchen?"],
  ["einordnen", "In der Formel beginnt jede Atomsorte mit einem **Großbuchstaben**."],
  ["tippElement", "Vergleiche die Farben innerhalb jedes Teilchens."],
  ["tippVerbindung", "Schau in jedes Teilchen: eine Farbe oder mehrere?"],
  ["elemente", "Gefragt sind **Stoffe**, nicht Teilchen."],
  ["verbindungen", "Prüfe jeden Stoff einzeln."],
  ["tippElement", "Nicht die Zahl der Kugeln zählt, sondern die Zahl der Farben."],
  ["tippVerbindung", "Fest verbundene Atome bilden **ein** Teilchen."],
  ["elemente", "Eine Atomsorte oder mehrere? Für jeden Stoff einzeln."],
  ["verbindungen", "Erst Stoffe finden, dann jeden prüfen."],
], [
  ["einordnen", "How many **kinds of atoms** are in one particle?"],
  ["einordnen", "In a formula each kind of atom starts with a **capital letter**."],
  ["tippElement", "Compare the colours inside each particle."],
  ["tippVerbindung", "Look into each particle: one colour or several?"],
  ["elemente", "The question is about **substances**, not particles."],
  ["verbindungen", "Check each substance on its own."],
  ["tippElement", "What counts is the number of colours, not the number of spheres."],
  ["tippVerbindung", "Firmly joined atoms form **one** particle."],
  ["elemente", "One kind of atom or several? For each substance on its own."],
  ["verbindungen", "First find the substances, then check each one."],
]);
const K3: Step[] = tr([
  ["reinOderGemisch", "Vergleiche die Teilchen miteinander."],
  ["reinGemisch", "Zwei Fragen: Wie viele Stoffe? Wie viele Atomsorten im Teilchen?"],
  ["bildArt", "Erst Teilchensorten zählen, dann in jedes Teilchen schauen."],
  ["bildWahl", "Prüfe jedes Bild mit denselben zwei Fragen."],
  ["homogenBild", "Stell dir das Mikroskop vor."],
  ["homogenKlar", "Zähle auf, was alles darin steckt – auch wenn man es nicht sieht."],
  ["wohin", "Verfolge in Gedanken ein einzelnes Teilchen eine Weile."],
  ["nachher", "Vergleiche: vorher und nach einer Weile."],
  ["masse", "Zähle: Welche Teilchen sind vorher da, welche nachher?"],
  ["bewegung", "Stell dir die Teilchen unter einer sehr starken Lupe vor."],
], [
  ["reinOderGemisch", "Compare the particles with each other."],
  ["reinGemisch", "Two questions: how many substances? How many kinds of atoms in a particle?"],
  ["bildArt", "First count the kinds of particles, then look into each particle."],
  ["bildWahl", "Check every picture with the same two questions."],
  ["homogenBild", "Imagine looking through a microscope."],
  ["homogenKlar", "List everything in it – even what you cannot see."],
  ["wohin", "In your mind, follow a single particle for a while."],
  ["nachher", "Compare: before and after a while."],
  ["masse", "Count: which particles are there before, which after?"],
  ["bewegung", "Imagine the particles under a very strong magnifier."],
]);
const K4: Step[] = tr([
  ["alltag", "Im Alltag fehlt das Teilchenbild. Frage: ein Stoff oder mehrere?"],
  ["alltag", "Ein Stoff? Dann: eine Atomsorte oder mehrere?"],
  ["reinAlltag", "Auf Packungen bedeutet „rein“ etwas anderes als in der Chemie."],
  ["reinAlltag", "Frage nur: Wie viele Stoffe stecken darin?"],
  ["homogenSieht", "Mit dem Auge allein lässt sich das nicht immer sagen."],
  ["artFluessig", "Was ist verteilt – und ist es fest, flüssig oder gasförmig?"],
  ["artFluessig", "Erst: Was ist worin? Dann den Namen wählen."],
  ["artFestGas", "Bestimme beide Zustände: Was ist verteilt, worin?"],
  ["artInGas", "Was ist verteilt, was ist der Hauptstoff?"],
  ["gemischart", "Alles zusammen: Zustände bestimmen, dann den Namen."],
], [
  ["alltag", "In everyday life there is no particle picture. Ask: one substance or several?"],
  ["alltag", "One substance? Then: one kind of atom or several?"],
  ["reinAlltag", "On packages “pure” means something different from chemistry."],
  ["reinAlltag", "Ask only: how many substances are in it?"],
  ["homogenSieht", "You cannot always tell with your eyes alone."],
  ["artFluessig", "What is spread out – and is it solid, liquid or gas?"],
  ["artFluessig", "First: what is in what? Then choose the name."],
  ["artFestGas", "Decide both states: what is spread out, and in what?"],
  ["artInGas", "What is spread out, what is the main substance?"],
  ["gemischart", "All together: decide the states, then the name."],
]);
// Kapitel 5 und 6: Merksätze setzen die Generatoren je Variante (trennen.ts); hier nur der Ersatz, falls keiner gesetzt ist
const K5: Step[] = tr([
  ["trennWahl", "Worin unterscheiden sich die Stoffe?"],
  ["trennEigenschaft", "Schau, was bleibt und was weggeht."],
  ["trennTipp", "Verfolge jeden Stoff von vorher bis nachher."],
  ["trennWahl", "Welche Eigenschaft unterscheidet die Stoffe?"],
  ["trennTipp", "Verfolge jeden Stoff durch das Gerät."],
  ["trennEigenschaft", "Beobachte das Bild bis zum Ende: Was bleibt, was geht?"],
  ["trennWahl", "Vergleiche die Stoffe: Was ist anders?"],
  ["trennTipp", "Wo ist jeder Stoff am Ende?"],
  ["trennEigenschaft", "Was bleibt liegen – und warum gerade das?"],
  ["trennWahl", "Zum Schluss: Worin unterscheiden sich die Stoffe?"],
], [
  ["trennWahl", "How do the substances differ?"],
  ["trennEigenschaft", "Watch what stays and what goes."],
  ["trennTipp", "Follow each substance from before to after."],
  ["trennWahl", "Which property tells the substances apart?"],
  ["trennTipp", "Follow each substance through the apparatus."],
  ["trennEigenschaft", "Watch the picture to the end: what stays, what goes?"],
  ["trennWahl", "Compare the substances: what is different?"],
  ["trennTipp", "Where is each substance at the end?"],
  ["trennEigenschaft", "What stays behind – and why that one?"],
  ["trennWahl", "Finally: how do the substances differ?"],
]);
const K6: Step[] = tr([
  ["loesWahl", "Worin unterscheiden sich die Stoffe?"],
  ["loesEigenschaft", "Schau, was beim Erhitzen bzw. Laufen passiert."],
  ["loesTipp", "Verfolge jeden Stoff von vorher bis nachher."],
  ["loesWahl", "Welche Eigenschaft unterscheidet die Stoffe?"],
  ["trennReihe", "Manche Gemische brauchen mehrere Schritte. Was muss zuerst passieren?"],
  ["loesTipp", "Verfolge jeden Stoff durch das Gerät."],
  ["loesEigenschaft", "Beobachte das Bild bis zum Ende: Was bleibt, was geht?"],
  ["loesWahl", "Vergleiche die Stoffe: Was ist anders?"],
  ["trennReihe", "Welcher Schritt braucht einen anderen vorher?"],
  ["loesTipp", "Wo ist jeder Stoff am Ende?"],
], [
  ["loesWahl", "How do the substances differ?"],
  ["loesEigenschaft", "Watch what happens when heating or running."],
  ["loesTipp", "Follow each substance from before to after."],
  ["loesWahl", "Which property tells the substances apart?"],
  ["trennReihe", "Some mixtures need several steps. What has to happen first?"],
  ["loesTipp", "Follow each substance through the apparatus."],
  ["loesEigenschaft", "Watch the picture to the end: what stays, what goes?"],
  ["loesWahl", "Compare the substances: what is different?"],
  ["trennReihe", "Which step needs another one first?"],
  ["loesTipp", "Where is each substance at the end?"],
]);
const level = (n: number, name: string, desc: string, steps: Step[]): Level => {
  const seq = steps.map(([t]) => t);
  return { id: `gm-k${n}`, name, desc, seq, leads: steps.map(([, l]) => l), cue: true, tip: true, types: [...new Set(seq)] };
};
export const LEVELS: Level[] = [
  level(1, tr("Teilchen und Atomsorten", "Particles and kinds of atoms"), tr("Teilchen, Moleküle, Atomsorten und Stoffe zählen", "Counting particles, molecules, kinds of atoms and substances"), K1),
  level(2, tr("Elemente und Verbindungen", "Elements and compounds"), tr("Eine Atomsorte oder mehrere, fest verbunden", "One kind of atom or several, firmly bonded"), K2),
  level(3, tr("Reinstoffe und Gemische", "Pure substances and mixtures"), tr("Ein Stoff oder mehrere, homogen oder heterogen, Lösen", "One substance or several, homogeneous or heterogeneous, dissolving"), K3),
  level(4, tr("Gemische im Alltag", "Mixtures in everyday life"), tr("„Rein“ auf Packungen, Lösung, Emulsion, Suspension …", "“Pure” on packages, solution, emulsion, suspension …"), K4),
  level(5, tr("Trennen nach Größe, Magnet, Dichte", "Separating by size, magnet, density"), tr("Auslesen, Sieben, Magnettrennung, Dekantieren, Filtrieren", "Hand-picking, sieving, magnetic separation, decanting, filtration"), K5),
  level(6, tr("Lösungen trennen", "Separating solutions"), tr("Eindampfen, Destillieren, Chromatografie, mehrere Schritte", "Evaporation, distillation, chromatography, several steps"), K6),
];

export const levelId = (_stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[level].id : `gm-${level}`);
export const levelName = (level: LevelKey) =>
  level === "mix" ? tr("Alles gemischt", "Everything mixed") : level === "weak" ? tr("Schwächen üben", "Practise weak spots") : level === "due" ? tr("Heute fällig", "Due today")
    : LEVELS[level].name;

/** Tipp festlegen: zugeschnitten und hervorgehoben (cue) oder allgemein */
function withHint(t: Task, cue: boolean): Task {
  const { tip, ...rest } = t;
  return cue && tip ? { ...rest, hint: tip, hintCue: true } : rest;
}

/** Aufgaben in fester Reihenfolge, keine Frage doppelt (gleicher Typ → anderes Beispiel) */
function ordered(seq: string[], cue: boolean, leads: string[] = []): Task[] {
  const seen = new Set<string>();
  const sig = (t: Task) => t.prompt + JSON.stringify(t.pic ?? t.pics ?? null);
  return seq.map((id, i) => {
    let t = GENS[id]();
    for (let k = 0; k < 40 && seen.has(sig(t)); k++) t = GENS[id]();
    seen.add(sig(t));
    // Merksatz der Variante (vom Generator) vor dem des Platzes
    const lead = t.lead ?? leads[i];
    return { ...withHint(t, cue), type: id, ...(lead ? { lead } : {}) };
  });
}

export function makeRound(_stufe: string, level: LevelKey, stats?: TypeStats, due: string[] = []): Task[] {
  if (typeof level === "number") return ordered(LEVELS[level].seq, LEVELS[level].cue, LEVELS[level].leads);
  let ids = level === "mix" ? [...new Set(LEVELS.flatMap(l => l.types))]
    : level === "weak" ? weakTypes(stats, id => LEVELS.some(l => l.types.includes(id)))
    : level === "due" ? due.filter(id => GENS[id])
    : LEVELS[0].types;
  if (!ids.length) ids = LEVELS[0].types;
  // Merksätze nur in den Kapiteln (feste Reihenfolge)
  return buildRound(ids, GENS, 10).map(t => { const { lead: _lead, ...rest } = withHint(t, false); return rest; });
}
