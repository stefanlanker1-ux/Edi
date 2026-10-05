// Kapitel Stofftrennung: Aufgaben mit Bildern statt Texteingabe – Verfahren wählen (Bild des Gemischs, Verfahren als Bildkarten),
// genutzte Eigenschaft (Animation des Verfahrens), Teil im Bild antippen (Rückstand, Filtrat, Destillat …), Reihenfolge bei Salz und Sand.

import { d, dis, mc, pick, shuffle } from "@lern/quiz";
import { tr } from "@lern/i18n";
import { METHOD_NAME, type Method } from "../components/Separation.tsx";
import type { Task } from "./tasks.ts";

/** Gemisch, wie es vor dem Trennen aussieht (Bild `MixPic`) */
export type MixKind = "eisen" | "kies" | "bohnen" | "absetzen" | "trueb" | "salz" | "alkohol" | "tinte" | "salzsand";

interface Case { mix: () => string; goal?: () => string; pic: MixKind; m: Method; wrong: [Method, () => string, string?][]; tip: () => string }

const CASES: Case[] = [
  { mix: () => tr("Eisenpulver und Schwefelpulver", "iron powder and sulfur powder"), pic: "eisen", m: "magnet",
    tip: () => tr("Welcher der beiden Stoffe wird von einem Magneten angezogen?", "Which of the two substances is attracted by a magnet?"),
    wrong: [["sieben", () => tr("Beide Pulver sind gleich fein. Sie fallen zusammen durchs Sieb.", "Both powders are equally fine. They fall through the sieve together.")],
      ["filtrieren", () => tr("Ein Filter hält beide Feststoffe zurück.", "A filter holds back both solids.")],
      ["destillieren", () => tr("Hier ist keine Flüssigkeit, die verdampfen könnte.", "There is no liquid here that could evaporate.")]] },
  { mix: () => tr("Sand und Kies", "sand and gravel"), pic: "kies", m: "sieben",
    tip: () => tr("Die Körner sind verschieden groß. Was lässt nur die kleinen durch?", "The grains have different sizes. What lets only the small ones through?"),
    wrong: [["magnet", () => tr("Sand und Kies sind nicht magnetisch.", "Sand and gravel are not magnetic.")],
      ["eindampfen", () => tr("Eindampfen trennt Gelöstes von Wasser. Hier ist kein Wasser.", "Evaporating separates dissolved things from water. There is no water here.")],
      ["chromatografie", () => tr("Chromatografie trennt Farbstoffe, keine Steine.", "Chromatography separates dyes, not stones.")]] },
  { mix: () => tr("rote und weiße Bohnen", "red and white beans"), pic: "bohnen", m: "auslesen",
    tip: () => tr("Schau dir die Teile genau an: Worin unterscheiden sie sich?", "Look at the pieces closely: how do they differ?"),
    wrong: [["sieben", () => tr("Die Bohnen sind gleich groß – sie bleiben alle zusammen im Sieb.", "The beans are the same size – they all stay in the sieve together.")],
      ["magnet", () => tr("Bohnen sind nicht magnetisch.", "Beans are not magnetic.")],
      ["filtrieren", () => tr("Filtrieren trennt Feststoff von Flüssigkeit. Hier ist keine Flüssigkeit.", "Filtering separates a solid from a liquid. There is no liquid here.")]] },
  { mix: () => tr("Wasser, in dem sich Sand abgesetzt hat", "water in which sand has settled"), pic: "absetzen", m: "dekantieren",
    tip: () => tr("Der Sand liegt schon unten. Wie bekommst du das Wasser darüber weg?", "The sand is already at the bottom. How do you get the water above it off?"),
    wrong: [["eindampfen", () => tr("Dann wäre das Wasser weg. Man will es aber abtrennen und behalten.", "Then the water would be gone. But we want to separate and keep it.")],
      ["magnet", () => tr("Sand ist nicht magnetisch.", "Sand is not magnetic.")],
      ["chromatografie", () => tr("Chromatografie trennt Farbstoffe.", "Chromatography separates dyes.")]] },
  { mix: () => tr("trübes Wasser mit feinem Sand", "cloudy water with fine sand"), goal: () => tr("klares Wasser gewinnen", "get clear water"), pic: "trueb", m: "filtrieren",
    tip: () => tr("Die Sandkörner sind fest. Was hält feste Körner zurück und lässt Wasser durch?", "The sand grains are solid. What holds back solid grains and lets water through?"),
    wrong: [["dekantieren", () => tr("Feiner Sand schwebt noch im Wasser. Er fließt beim Abgießen mit.", "Fine sand is still floating in the water. It flows out when pouring.")],
      ["magnet", () => tr("Sand ist nicht magnetisch.", "Sand is not magnetic.")],
      ["chromatografie", () => tr("Chromatografie trennt Farbstoffe.", "Chromatography separates dyes.")]] },
  { mix: () => tr("Salzwasser", "salt water"), goal: () => tr("das Salz gewinnen", "get the salt"), pic: "salz", m: "eindampfen",
    tip: () => tr("Was passiert mit Salzwasser, wenn du es lange erhitzt?", "What happens to salt water if you heat it for a long time?"),
    wrong: [["filtrieren", () => tr("Gelöstes Salz geht mit dem Wasser durch den Filter.", "Dissolved salt passes through the filter with the water."), "filter-geloest"],
      ["dekantieren", () => tr("Gelöstes Salz setzt sich nicht ab.", "Dissolved salt does not settle.")],
      ["sieben", () => tr("Gelöstes Salz geht durch jedes Sieb.", "Dissolved salt passes through any sieve.")]] },
  { mix: () => tr("Salzwasser", "salt water"), goal: () => tr("sauberes Wasser gewinnen", "get clean water"), pic: "salz", m: "destillieren",
    tip: () => tr("Wohin geht das Wasser beim Erhitzen – und wie bekommst du es zurück?", "Where does the water go when heated – and how do you get it back?"),
    wrong: [["eindampfen", () => tr("Beim Eindampfen geht das Wasser als Dampf verloren.", "When evaporating, the water is lost as vapour.")],
      ["filtrieren", () => tr("Gelöstes Salz geht mit dem Wasser durch den Filter.", "Dissolved salt passes through the filter with the water."), "filter-geloest"],
      ["dekantieren", () => tr("Gelöstes Salz setzt sich nicht ab.", "Dissolved salt does not settle.")]] },
  { mix: () => tr("Alkohol und Wasser", "alcohol and water"), pic: "alkohol", m: "destillieren",
    tip: () => tr("Wird beim Erhitzen beides gleichzeitig zu Dampf?", "Do both turn into vapour at the same time when heated?"),
    wrong: [["filtrieren", () => tr("Beide sind Flüssigkeiten. Beide laufen durch den Filter.", "Both are liquids. Both run through the filter.")],
      ["dekantieren", () => tr("Alkohol und Wasser sind gemischt. Nichts setzt sich ab.", "Alcohol and water are mixed. Nothing settles.")],
      ["magnet", () => tr("Alkohol und Wasser sind nicht magnetisch.", "Alcohol and water are not magnetic.")]] },
  { mix: () => tr("Farbstoffe einer schwarzen Filzstift-Farbe", "dyes of a black felt-tip ink"), pic: "tinte", m: "chromatografie",
    tip: () => tr("Wie bekommst du die Farbstoffe auseinander, die alle gelöst sind?", "How do you get the dyes apart when they are all dissolved?"),
    wrong: [["filtrieren", () => tr("Gelöste Farbstoffe gehen alle zusammen durch den Filter.", "Dissolved dyes all pass through the filter together."), "filter-geloest"],
      ["eindampfen", () => tr("Dann bleiben alle Farbstoffe zusammen zurück.", "Then all the dyes stay behind together.")],
      ["sieben", () => tr("Gelöste Farbstoffe gehen durch jedes Sieb.", "Dissolved dyes pass through any sieve.")]] },
];

const METHOD_TEXT = (m: Method) => METHOD_NAME(m);

/** Welches Verfahren trennt dieses Gemisch? Antworten als Bildkarten der Verfahren */
/** Kapitel 5: Trennen nach Größe, Magnet, Dichte – Kapitel 6: Lösungen trennen (Siedetemperatur, Chromatografie) */
export const K5_METHODS: Method[] = ["auslesen", "sieben", "magnet", "dekantieren", "filtrieren"];
export const K6_METHODS: Method[] = ["eindampfen", "destillieren", "chromatografie"];

export function trennWahl(methods: Method[] = K5_METHODS): Task {
  const c = pick(CASES.filter(x => methods.includes(x.m)));
  const name = c.mix();
  const goal = c.goal ? tr(` Ziel: ${c.goal()}.`, ` Goal: ${c.goal()}.`) : "";
  return {
    ...mc(METHOD_TEXT(c.m), c.wrong.map(([m, why, miss]) => (miss ? d(METHOD_TEXT(m), miss, why()) : dis(METHOD_TEXT(m), why())))),
    mixPic: c.pic,
    methods: true,
    prompt: tr(`Wie trennt man **${name}**?${goal}`, `How do you separate **${name}**?${goal}`),
    hint: tr("Welche Eigenschaft unterscheidet die Stoffe? Daraus folgt das Verfahren.", "Which property tells the substances apart? That gives the method."),
    tip: c.tip(),
    lead: c.goal ? tr("Was willst du am Ende behalten?", "What do you want to keep in the end?") : tr("Worin unterscheiden sich die Stoffe?", "How do the substances differ?"),
    explain: tr(`**${METHOD_TEXT(c.m)}**: ${PROP_WHY[c.m]()}`, `**${METHOD_TEXT(c.m)}**: ${PROP_WHY[c.m]()}`),
  };
}

/** Eigenschaft, die ein Verfahren nutzt (Sieben und Filtrieren nutzen beide die Größe, Eindampfen und Destillieren die Siedetemperatur) */
const PROP: Record<Method, () => string> = {
  auslesen: () => tr("Aussehen", "Appearance"), sieben: () => tr("Korngröße", "Grain size"),
  magnet: () => tr("Magnetismus", "Magnetism"), dekantieren: () => tr("Dichte", "Density"),
  filtrieren: () => tr("Korngröße", "Grain size"), eindampfen: () => tr("Siedetemperatur", "Boiling point"),
  destillieren: () => tr("Siedetemperatur", "Boiling point"), chromatografie: () => tr("Löslichkeit und Haften", "Solubility and sticking"),
};
const PROP_WHY: Record<Method, () => string> = {
  auslesen: () => tr("Die Teile sehen verschieden aus und sind groß genug zum Greifen.", "The pieces look different and are big enough to pick up by hand."),
  sieben: () => tr("Kleine Körner fallen durch die Maschen, große bleiben liegen.", "Small grains fall through the mesh, large ones stay."),
  magnet: () => tr("Eisen wird vom Magneten angezogen, Schwefel nicht.", "Iron is attracted by the magnet, sulfur is not."),
  dekantieren: () => tr("Sand hat eine größere Dichte als Wasser und sinkt ab. Das Wasser darüber gießt man vorsichtig ab.", "Sand has a greater density than water and sinks. You carefully pour off the water above it."),
  filtrieren: () => tr("Feste Körner bleiben im Filter hängen, die Flüssigkeit läuft durch.", "Solid grains get stuck in the filter, the liquid runs through."),
  eindampfen: () => tr("Wasser verdampft, das gelöste Salz bleibt zurück.", "Water evaporates, the dissolved salt stays behind."),
  destillieren: () => tr("Was zuerst siedet, verdampft und wird im Kühler wieder flüssig.", "What boils first evaporates and turns liquid again in the condenser."),
  chromatografie: () => tr("Die Farbstoffe lösen sich verschieden gut im Laufmittel und haften verschieden stark – sie wandern verschieden weit.", "The dyes dissolve differently well in the solvent and stick differently strongly – they move different distances."),
};

/** Denkschritt zum Bild (nennt weder die Eigenschaft noch ihre Wirkung) */
const PROP_LOOK: Record<Method, () => string> = {
  auslesen: () => tr("Woran erkennst du die Teile, die du herausnimmst?", "How do you recognise the pieces you take out?"),
  sieben: () => tr("Vergleiche die Körner, die liegen bleiben, mit denen, die durchfallen.", "Compare the grains that stay with those that fall through."),
  magnet: () => tr("Was passiert, wenn der Magnet über das Gemisch fährt?", "What happens when the magnet moves over the mixture?"),
  dekantieren: () => tr("Warum liegt der Sand unten und das Wasser oben?", "Why is the sand at the bottom and the water on top?"),
  filtrieren: () => tr("Was bleibt im Papier hängen – und warum passt es nicht durch?", "What gets stuck in the paper – and why does it not fit through?"),
  eindampfen: () => tr("Was passiert mit jedem Stoff beim Erhitzen?", "What happens to each substance when heated?"),
  destillieren: () => tr("Was passiert mit jedem Stoff beim Erhitzen?", "What happens to each substance when heated?"),
  chromatografie: () => tr("Warum bleiben manche Farbstoffe weiter unten?", "Why do some dyes stay further down?"),
};

/** Präposition mit Artikel vor dem Verfahren („beim Sieben“, „bei der Magnettrennung“) */
const BEI: Record<Method, string> = { auslesen: "beim", sieben: "beim", magnet: "bei der", dekantieren: "beim", filtrieren: "beim", eindampfen: "beim", destillieren: "beim", chromatografie: "bei der" };

/** Welche Eigenschaft nutzt dieses Verfahren? Bild = Animation des Verfahrens */
export function trennEigenschaft(methods: Method[] = K5_METHODS): Task {
  const m = pick(methods);
  const right = PROP[m]();
  // falsche Eigenschaften nur aus diesem und früheren Kapiteln (Siedetemperatur kommt erst in Kapitel 6)
  const pool = methods.some(x => K6_METHODS.includes(x)) ? (Object.keys(PROP) as Method[]) : K5_METHODS;
  const others = shuffle(pool.filter(x => PROP[x]() !== right));
  const seen = new Set<string>();
  const wrong = others.filter(x => { const p = PROP[x](); if (seen.has(p)) return false; seen.add(p); return true; }).slice(0, 3)
    .map(x => dis(PROP[x](), tr(`Das nutzt man ${BEI[x]} ${METHOD_TEXT(x)}.`, `That is used in ${METHOD_TEXT(x).toLowerCase()}.`)));
  return {
    ...mc(right, wrong, 3),
    sep: { m, t: -1 },
    prompt: tr(`**${METHOD_TEXT(m)}**: Welche Eigenschaft der Stoffe wird genutzt?`, `**${METHOD_TEXT(m)}**: which property of the substances is used?`),
    hint: tr("Schau, was im Bild passiert: Was bleibt, was geht weg – und warum?", "Watch what happens in the picture: what stays, what goes – and why?"),
    tip: PROP_LOOK[m](),
    explain: tr(`**${right}**: ${PROP_WHY[m]()}`, `**${right}**: ${PROP_WHY[m]()}`),
  };
}

/** Teile im Bild nach dem Trennen (Namen für Aufgaben und Rückmeldung) */
export const PART_NAME: Record<string, () => string> = {
  rueckstand: () => tr("Rückstand", "residue"), filtrat: () => tr("Filtrat", "filtrate"), filter: () => tr("Filterpapier", "filter paper"),
  destillat: () => tr("Destillat", "distillate"), kuehler: () => tr("Kühler", "condenser"), kolben: () => tr("Rückstand im Kolben", "residue in the flask"),
  salz: () => tr("Salz", "salt"), schale: () => tr("Schale", "dish"), eisen: () => tr("Eisen", "iron"), schwefel: () => tr("Schwefel", "sulfur"),
  magnet: () => tr("Magnet", "magnet"), blau: () => tr("blauer Farbstoff", "blue dye"), rot: () => tr("roter Farbstoff", "red dye"), gelb: () => tr("gelber Farbstoff", "yellow dye"),
  sand: () => tr("Bodensatz (Sand)", "sediment (sand)"), wasser2: () => tr("abgegossenes Wasser", "poured-off water"),
};

interface TapCase { m: Method; ask: () => string; answer: string; parts: string[]; why: Record<string, () => string>; tip: () => string; explain: () => string }
const TAPS: TapCase[] = [
  { m: "filtrieren", answer: "rueckstand", parts: ["rueckstand", "filtrat", "filter"], ask: () => tr("Tippe auf den **Rückstand**.", "Tap the **residue**."),
    why: { filtrat: () => tr("Das Filtrat ist die Flüssigkeit, die durch den Filter läuft.", "The filtrate is the liquid that runs through the filter."), filter: () => tr("Das ist das Filterpapier. Gesucht ist, was darin hängen bleibt.", "That is the filter paper. Wanted: what gets stuck in it.") },
    tip: () => tr("Was konnte nicht durch das Papier?", "What could not get through the paper?"), explain: () => tr("Der **Rückstand** (Sand) bleibt im Filter, das **Filtrat** läuft durch.", "The **residue** (sand) stays in the filter, the **filtrate** runs through.") },
  { m: "filtrieren", answer: "filtrat", parts: ["filtrat", "rueckstand", "filter"], ask: () => tr("Tippe auf das **Filtrat**.", "Tap the **filtrate**."),
    why: { rueckstand: () => tr("Das ist der Rückstand: Er bleibt im Filter.", "That is the residue: it stays in the filter."), filter: () => tr("Das ist das Filterpapier.", "That is the filter paper.") },
    tip: () => tr("Was ist durch das Papier gelaufen?", "What ran through the paper?"), explain: () => tr("Das **Filtrat** ist die klare Flüssigkeit unten im Glas.", "The **filtrate** is the clear liquid at the bottom of the glass.") },
  { m: "destillieren", answer: "destillat", parts: ["destillat", "kolben", "kuehler"], ask: () => tr("Tippe auf das **Destillat**.", "Tap the **distillate**."),
    why: { kolben: () => tr("Im Kolben bleibt das Salzwasser zurück, immer salziger.", "The salt water stays in the flask, saltier and saltier."), kuehler: () => tr("Im Kühler wird der Dampf wieder flüssig. Gesucht ist, wo er sich sammelt.", "In the condenser the vapour turns liquid again. Wanted: where it collects.") },
    tip: () => tr("Wohin tropft das Wasser, wenn der Dampf abgekühlt ist?", "Where does the water drip once the vapour has cooled down?"), explain: () => tr("Das **Destillat** sammelt sich in der Vorlage rechts: sauberes Wasser.", "The **distillate** collects in the receiver on the right: clean water.") },
  { m: "destillieren", answer: "kuehler", parts: ["kuehler", "destillat", "kolben"], ask: () => tr("Tippe auf den **Kühler**.", "Tap the **condenser**."),
    why: { destillat: () => tr("Das ist das Destillat. Der Kühler liegt davor.", "That is the distillate. The condenser comes before it."), kolben: () => tr("Im Kolben wird erhitzt, nicht gekühlt.", "The flask is heated, not cooled.") },
    tip: () => tr("Wo wird der Dampf wieder flüssig?", "Where does the vapour turn liquid again?"), explain: () => tr("Im **Kühler** wird der Dampf abgekühlt und wieder flüssig.", "In the **condenser** the vapour cools down and turns liquid again.") },
  { m: "eindampfen", answer: "salz", parts: ["salz", "schale"], ask: () => tr("Tippe auf das, was nach dem Eindampfen **übrig bleibt**.", "Tap what is **left over** after evaporating."),
    why: { schale: () => tr("Das ist die Schale. Gesucht ist, was darin zurückbleibt.", "That is the dish. Wanted: what stays in it.") },
    tip: () => tr("Was ist beim Erhitzen nicht verdampft?", "What did not evaporate when heated?"), explain: () => tr("Das **Salz** bleibt zurück, das Wasser ist verdampft.", "The **salt** stays behind, the water has evaporated.") },
  { m: "magnet", answer: "eisen", parts: ["eisen", "schwefel", "magnet"], ask: () => tr("Tippe auf den Stoff, der **am Magneten hängt**.", "Tap the substance **hanging on the magnet**."),
    why: { schwefel: () => tr("Schwefel ist nicht magnetisch. Er bleibt liegen.", "Sulfur is not magnetic. It stays behind."), magnet: () => tr("Das ist der Magnet selbst.", "That is the magnet itself.") },
    tip: () => tr("Welcher Stoff wird vom Magneten angezogen?", "Which substance is attracted by the magnet?"), explain: () => tr("**Eisen** wird angezogen, Schwefel bleibt liegen.", "**Iron** is attracted, sulfur stays behind.") },
  { m: "chromatografie", answer: "blau", parts: ["blau", "rot", "gelb"], ask: () => tr("Tippe auf den Farbstoff, der **am weitesten** gewandert ist.", "Tap the dye that moved **the furthest**."),
    why: { rot: () => tr("Rot ist weiter als Gelb, aber nicht am weitesten.", "Red moved further than yellow, but not the furthest."), gelb: () => tr("Gelb wird am wenigsten weit mitgenommen.", "Yellow is carried the shortest distance.") },
    tip: () => tr("Der Start ist die gestrichelte Linie unten.", "The start is the dashed line at the bottom."), explain: () => tr("**Blau** wird am weitesten mitgenommen: Es löst sich gut im Laufmittel und haftet schwach am Papier.", "**Blue** is carried furthest: it dissolves well in the solvent and sticks weakly to the paper.") },
  { m: "dekantieren", answer: "sand", parts: ["sand", "wasser2"], ask: () => tr("Tippe auf den **Bodensatz**.", "Tap the **sediment**."),
    why: { wasser2: () => tr("Das ist das abgegossene Wasser.", "That is the poured-off water.") },
    tip: () => tr("Was hat sich abgesetzt?", "What has settled?"), explain: () => tr("Der **Bodensatz** (Sand) bleibt im Glas, das Wasser wird abgegossen.", "The **sediment** (sand) stays in the glass, the water is poured off.") },
];

/** Teil im Bild antippen (nach dem Trennen) */
export function trennTipp(methods: Method[] = K5_METHODS): Task {
  const c = pick(TAPS.filter(x => methods.includes(x.m)));
  return {
    kind: "tap", answer: c.answer, parts: c.parts, sep: { m: c.m, t: 1 },
    traps: c.parts.map((p, i) => (p === c.answer ? null : { values: { pick: i }, miss: "teil-verwechselt", why: c.why[p]() })).filter(x => !!x) as Task["traps"],
    prompt: tr(`${METHOD_TEXT(c.m)}: ${c.ask()}`, `${METHOD_TEXT(c.m)}: ${c.ask()}`),
    hint: tr("Verfolge im Bild, wohin jeder Stoff gegangen ist.", "Follow in the picture where each substance went."),
    tip: c.tip(),
    explain: c.explain(),
  };
}

/** Salz und Sand (und Eisen) trennen: richtige Reihenfolge */
export function trennReihe(): Task {
  const iron = Math.random() < .4;
  const S = (...m: string[]) => m.join(" → ");
  const L = () => tr("Lösen", "Dissolution"), F = () => METHOD_TEXT("filtrieren"), E = () => METHOD_TEXT("eindampfen"), M = () => tr("Magnet", "Magnet"), Si = () => METHOD_TEXT("sieben");
  const right = iron ? S(M(), L(), F(), E()) : S(L(), F(), E());
  return {
    ...mc(right, [
      d(iron ? S(L(), E(), M(), F()) : S(F(), L(), E()), "reihenfolge", iron ? tr("Nach dem Eindampfen ist das Salz wieder fest und liegt beim Sand. Ohne Wasser trennt das Filtrieren nichts mehr.", "After evaporating, the salt is solid again and lies with the sand. Without water, filtering separates nothing.") : tr("Vor dem Lösen ist das Salz noch fest. Es bleibt mit dem Sand im Filter.", "Before dissolving, the salt is still solid. It stays in the filter with the sand.")),
      d(iron ? S(M(), L(), E(), F()) : S(L(), E(), F()), "reihenfolge", tr("Nach dem Eindampfen liegen Salz und Sand wieder zusammen.", "After evaporating, salt and sand lie together again.")),
      dis(iron ? S(Si(), M(), E()) : S(Si(), E()), tr("Salz und Sand sind gleich feine Körner. Ein Sieb trennt sie nicht.", "Salt and sand are equally fine grains. A sieve does not separate them.")),
    ], 4),
    mixPic: "salzsand",
    prompt: iron ? tr("**Eisen, Sand und Salz** trennen: In welcher Reihenfolge?", "Separate **iron, sand and salt**: in which order?") : tr("**Salz und Sand** trennen: In welcher Reihenfolge?", "Separate **salt and sand**: in which order?"),
    hint: tr("Salz löst sich in Wasser, Sand nicht. Was hält der Filter zurück?", "Salt dissolves in water, sand does not. What does the filter hold back?"),
    tip: tr("Salz und Sand sind beide Körner. Was macht nur einer der beiden in Wasser?", "Salt and sand are both grains. What does only one of them do in water?"),
    explain: iron ? tr("Magnet holt das Eisen. Lösen, filtrieren: Sand bleibt im Filter. Eindampfen: Salz bleibt.", "The magnet takes the iron. Dissolve, filter: sand stays in the filter. Evaporate: salt stays.")
      : tr("Lösen, filtrieren: Sand bleibt im Filter. Eindampfen: Salz bleibt zurück.", "Dissolve, filter: sand stays in the filter. Evaporate: salt stays behind."),
  };
}
