// Kapitel Stofftrennung: Aufgaben mit Bildern statt Texteingabe – Verfahren wählen (Bild des Gemischs, Verfahren als Bildkarten),
// genutzte Eigenschaft (Animation des Verfahrens), Teil im Bild antippen (Rückstand, Filtrat, Destillat …), Reihenfolge bei Salz und Sand.

import { d, dis, mc, pick, shuffle } from "@lern/quiz";
import { tr } from "@lern/i18n";
import { METHOD_NAME, type Method } from "../components/Separation.tsx";
import type { Task } from "./tasks.ts";

/** Gemisch, wie es vor dem Trennen aussieht (Bild `MixPic`) */
export type MixKind = "eisen" | "kies" | "bohnen" | "absetzen" | "trueb" | "salz" | "alkohol" | "tinte" | "salzsand" | "eisensalzsand";

interface Case { mix: () => string; goal?: () => string; pic: MixKind; m: Method; wrong: [Method, () => string, string?][]; tip: () => string }

const CASES: Case[] = [
  { mix: () => tr("Eisenpulver und Schwefelpulver", "iron powder and sulfur powder"), pic: "eisen", m: "magnet",
    tip: () => tr("Welche Eigenschaft hat nur das Eisen?", "Which property does only the iron have?"),
    wrong: [["sieben", () => tr("Beide Pulver sind gleich fein. Sie fallen zusammen durchs Sieb.", "Both powders are equally fine. They fall through the sieve together.")],
      ["filtrieren", () => tr("Ein Filter hält beide Feststoffe zurück.", "A filter holds back both solids.")],
      ["auslesen", () => tr("Die Körnchen sind viel zu fein, um sie einzeln herauszunehmen.", "The grains are far too fine to pick out one by one.")]] },
  { mix: () => tr("Sand und Kies", "sand and gravel"), pic: "kies", m: "sieben",
    tip: () => tr("Die Körner sind verschieden groß. Was lässt nur die kleinen durch?", "The grains have different sizes. What lets only the small ones through?"),
    wrong: [["magnet", () => tr("Sand und Kies sind nicht magnetisch.", "Sand and gravel are not magnetic.")],
      ["dekantieren", () => tr("Hier ist keine Flüssigkeit, die man abgießen könnte.", "There is no liquid here to pour off.")],
      ["filtrieren", () => tr("Filtrieren trennt Feststoff von Flüssigkeit. Hier ist keine Flüssigkeit.", "Filtering separates a solid from a liquid. There is no liquid here.")]] },
  { mix: () => tr("rote und weiße Bohnen", "red and white beans"), pic: "bohnen", m: "auslesen",
    tip: () => tr("Schau dir die Teile genau an: Worin unterscheiden sie sich?", "Look at the pieces closely: how do they differ?"),
    wrong: [["sieben", () => tr("Die Bohnen sind gleich groß – sie bleiben alle zusammen im Sieb.", "The beans are the same size – they all stay in the sieve together.")],
      ["magnet", () => tr("Bohnen sind nicht magnetisch.", "Beans are not magnetic.")],
      ["filtrieren", () => tr("Filtrieren trennt Feststoff von Flüssigkeit. Hier ist keine Flüssigkeit.", "Filtering separates a solid from a liquid. There is no liquid here.")]] },
  { mix: () => tr("Wasser, in dem sich Sand abgesetzt hat", "water in which sand has settled"), goal: () => tr("klares Wasser gewinnen", "get clear water"), pic: "absetzen", m: "dekantieren",
    tip: () => tr("Wie bekommst du das Wasser über dem Sand weg?", "How do you get the water above the sand off?"),
    wrong: [["sieben", () => tr("Das Wasser liefe mit dem feinen Sand durchs Sieb.", "The water would run through the sieve with the fine sand.")],
      ["magnet", () => tr("Sand ist nicht magnetisch.", "Sand is not magnetic.")],
      ["auslesen", () => tr("Die feinen Sandkörner kann man nicht einzeln herausnehmen.", "You cannot pick out the fine grains of sand one by one.")]] },
  { mix: () => tr("trübes Wasser mit feinem Sand", "cloudy water with fine sand"), goal: () => tr("klares Wasser gewinnen", "get clear water"), pic: "trueb", m: "filtrieren",
    tip: () => tr("Was hält feste Körner zurück, lässt aber Wasser durch?", "What holds back solid grains but lets water through?"),
    wrong: [["dekantieren", () => tr("Feiner Sand schwebt noch im Wasser. Er fließt beim Abgießen mit.", "Fine sand is still floating in the water. It flows out when pouring.")],
      ["magnet", () => tr("Sand ist nicht magnetisch.", "Sand is not magnetic.")],
      ["sieben", () => tr("Die feinen Körner gehen mit dem Wasser durch die Maschen.", "The fine grains pass through the mesh with the water.")]] },
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
    tip: () => tr("Was verdampft beim Erhitzen leichter – Alkohol oder Wasser?", "Which evaporates more easily when heated – alcohol or water?"),
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
  // falsche Verfahren nur aus diesem und früheren Kapiteln (Eindampfen, Destillieren, Chromatografie erst in Kapitel 6)
  const known = methods.some(x => K6_METHODS.includes(x)) ? [...K5_METHODS, ...K6_METHODS] : K5_METHODS;
  return {
    ...mc(METHOD_TEXT(c.m), c.wrong.filter(([m]) => known.includes(m)).map(([m, why, miss]) => (miss ? d(METHOD_TEXT(m), miss, why()) : dis(METHOD_TEXT(m), why())))),
    mixPic: c.pic,
    methods: true,
    prompt: tr(`Wie trennt man **${name}**?${goal}`, `How do you separate **${name}**?${goal}`),
    hint: tr("Welche Eigenschaft unterscheidet die Stoffe? Daraus folgt das Verfahren.", "Which property tells the substances apart? That gives the method."),
    tip: c.tip(),
    // nur mit Ziel ein eigener Merksatz, sonst gilt der des Platzes
    ...(c.goal ? { lead: tr("Was willst du am Ende behalten?", "What do you want to keep in the end?") } : {}),
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
  destillieren: () => tr("Was leichter verdampft, sammelt sich im Dampf und wird im Kühler wieder flüssig.", "What evaporates more easily collects in the vapour and turns liquid again in the condenser."),
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
  kies: () => tr("Kies", "gravel"), feinsand: () => tr("Sand", "sand"), thermometer: () => tr("Thermometer", "thermometer"),
  start: () => tr("Startlinie", "start line"), dampf: () => tr("Wasserdampf", "water vapour"), loesung: () => tr("Salzwasser", "salt water"),
};

/** `t`: Zeitpunkt des Bilds (Standard 1 = getrennt) */
interface TapCase { m: Method; ask: () => string; answer: string; parts: string[]; why: Record<string, () => string>; tip: () => string; explain: () => string; t?: number }
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
  { m: "dekantieren", answer: "wasser2", parts: ["wasser2", "sand"], ask: () => tr("Tippe auf das Wasser, das **abgegossen** wurde.", "Tap the water that was **poured off**."),
    why: { sand: () => tr("Das ist der Bodensatz. Er bleibt im ersten Glas.", "That is the sediment. It stays in the first glass.") },
    tip: () => tr("Was floss beim Kippen über den Ausguss?", "What flowed over the spout when tilting?"), explain: () => tr("Das klare Wasser fließt ins **zweite Glas**, der Sand bleibt zurück.", "The clear water flows into the **second glass**, the sand stays behind.") },
  { m: "filtrieren", answer: "filter", parts: ["filter", "rueckstand", "filtrat"], ask: () => tr("Tippe auf das **Filterpapier**.", "Tap the **filter paper**."),
    why: { rueckstand: () => tr("Das ist der Rückstand: Er liegt im Filterpapier.", "That is the residue: it lies in the filter paper."), filtrat: () => tr("Das ist das Filtrat unter dem Trichter.", "That is the filtrate below the funnel.") },
    tip: () => tr("Was liegt im Trichter und hält die Körner zurück?", "What lies in the funnel and holds back the grains?"), explain: () => tr("Das **Filterpapier** im Trichter hält den Sand zurück.", "The **filter paper** in the funnel holds back the sand.") },
  { m: "magnet", answer: "schwefel", parts: ["schwefel", "eisen", "magnet"], ask: () => tr("Tippe auf den Stoff, der **liegen bleibt**.", "Tap the substance that **stays behind**."),
    why: { eisen: () => tr("Eisen hängt am Magneten.", "Iron hangs on the magnet."), magnet: () => tr("Das ist der Magnet selbst.", "That is the magnet itself.") },
    tip: () => tr("Welcher Stoff wird vom Magneten nicht angezogen?", "Which substance is not attracted by the magnet?"), explain: () => tr("**Schwefel** ist nicht magnetisch und bleibt liegen.", "**Sulfur** is not magnetic and stays behind.") },
  { m: "sieben", answer: "kies", parts: ["kies", "feinsand"], ask: () => tr("Tippe auf das, was **im Sieb** liegen bleibt.", "Tap what stays **in the sieve**."),
    why: { feinsand: () => tr("Der Sand ist durch die Maschen gefallen. Er liegt in der Schale.", "The sand fell through the mesh. It lies in the bowl.") },
    tip: () => tr("Was war zu groß für die Lücken?", "What was too big for the gaps?"), explain: () => tr("Der **Kies** bleibt im Sieb, der feine Sand fällt durch.", "The **gravel** stays in the sieve, the fine sand falls through.") },
  { m: "sieben", answer: "feinsand", parts: ["feinsand", "kies"], ask: () => tr("Tippe auf das, was **durch das Sieb** gefallen ist.", "Tap what fell **through the sieve**."),
    why: { kies: () => tr("Der Kies war zu groß. Er bleibt im Sieb.", "The gravel was too big. It stays in the sieve.") },
    tip: () => tr("Was passte durch die Lücken?", "What fitted through the gaps?"), explain: () => tr("Der feine **Sand** fällt durch die Maschen in die Schale.", "The fine **sand** falls through the mesh into the bowl.") },
  { m: "destillieren", answer: "kolben", parts: ["kolben", "destillat", "kuehler"], ask: () => tr("Tippe auf das, was im Kolben **zurückbleibt**.", "Tap what **stays behind** in the flask."),
    why: { destillat: () => tr("Das ist das Destillat. Es hat den Kolben als Dampf verlassen.", "That is the distillate. It left the flask as vapour."), kuehler: () => tr("Das ist der Kühler. Gesucht ist, was im Kolben bleibt.", "That is the condenser. Wanted: what stays in the flask.") },
    tip: () => tr("Was verdampft beim Erhitzen nicht?", "What does not evaporate when heated?"), explain: () => tr("Im Kolben bleibt das Salzwasser zurück, immer salziger: der **Rückstand**.", "The salt water stays in the flask, saltier and saltier: the **residue**.") },
  { m: "destillieren", answer: "thermometer", parts: ["thermometer", "kolben", "kuehler"], t: .6, ask: () => tr("Wo liest man die **Siedetemperatur** ab? Tippe darauf.", "Where do you read the **boiling point**? Tap it."),
    why: { kolben: () => tr("Im Kolben siedet das Salzwasser. Die Temperatur zeigt ein anderes Gerät.", "The salt water boils in the flask. Another device shows the temperature."), kuehler: () => tr("Im Kühler wird der Dampf gekühlt.", "In the condenser the vapour is cooled.") },
    tip: () => tr("Welches Gerät zeigt Grad Celsius an?", "Which device shows degrees Celsius?"), explain: () => tr("Das **Thermometer** oben am Kolben zeigt die Temperatur des Dampfs: 100 °C.", "The **thermometer** at the top of the flask shows the temperature of the vapour: 100 °C.") },
  { m: "eindampfen", answer: "dampf", parts: ["dampf", "loesung", "schale"], t: .5, ask: () => tr("Tippe auf das, was beim Erhitzen die Schale **verlässt**.", "Tap what **leaves** the dish when heated."),
    why: { loesung: () => tr("Das ist das Salzwasser. Es wird weniger, weil Wasser verdampft.", "That is the salt water. It gets less because water evaporates."), schale: () => tr("Das ist die Schale.", "That is the dish.") },
    tip: () => tr("Was steigt beim Erhitzen nach oben?", "What rises when heated?"), explain: () => tr("Das Wasser verdampft und steigt als **Wasserdampf** auf, das Salz bleibt.", "The water evaporates and rises as **water vapour**, the salt stays.") },
  { m: "chromatografie", answer: "gelb", parts: ["gelb", "rot", "blau"], ask: () => tr("Tippe auf den Farbstoff, der **am wenigsten weit** gewandert ist.", "Tap the dye that moved **the shortest distance**."),
    why: { rot: () => tr("Rot ist weiter gewandert als Gelb.", "Red moved further than yellow."), blau: () => tr("Blau ist am weitesten gewandert.", "Blue moved the furthest.") },
    tip: () => tr("Der Start ist die gestrichelte Linie unten.", "The start is the dashed line at the bottom."), explain: () => tr("**Gelb** wird am wenigsten weit mitgenommen: Es haftet stark am Papier oder löst sich schlecht.", "**Yellow** is carried the shortest distance: it sticks strongly to the paper or dissolves poorly.") },
  { m: "chromatografie", answer: "start", parts: ["start", "gelb", "blau"], ask: () => tr("Tippe auf die **Startlinie**.", "Tap the **start line**."),
    why: { gelb: () => tr("Das ist der gelbe Farbstoff. Er ist schon ein Stück gewandert.", "That is the yellow dye. It has already moved a little."), blau: () => tr("Das ist der blaue Farbstoff, ganz oben.", "That is the blue dye, right at the top.") },
    tip: () => tr("Wo saß der schwarze Punkt am Anfang?", "Where was the black spot at the beginning?"), explain: () => tr("Auf der **Startlinie** saß am Anfang der schwarze Punkt.", "The black spot sat on the **start line** at the beginning.") },
];

/** Teil im Bild antippen (nach dem Trennen) */
export function trennTipp(methods: Method[] = K5_METHODS): Task {
  const c = pick(TAPS.filter(x => methods.includes(x.m)));
  return {
    kind: "tap", answer: c.answer, parts: c.parts, sep: { m: c.m, t: c.t ?? 1 },
    traps: c.parts.map((p, i) => (p === c.answer ? null : { values: { pick: i }, miss: "teil-verwechselt", why: c.why[p]() })).filter(x => !!x) as Task["traps"],
    prompt: tr(`${METHOD_TEXT(c.m)}: ${c.ask()}`, `${METHOD_TEXT(c.m)}: ${c.ask()}`),
    // gesucht sind Stoffe (Rückstand, Destillat …) und Geräteteile (Kühler, Thermometer, Startlinie …)
    hint: tr("Verfolge im Bild, wohin jeder Stoff geht und wozu jedes Teil dient.", "Follow in the picture where each substance goes and what each part is for."),
    tip: c.tip(),
    explain: c.explain(),
  };
}

/**
 * Namen der Trennschritte in einer Reihenfolge (Lektion 6 und Aufgabe „Reihenfolge“): deutsch die Verfahren, englisch kurze Verben
 * (Magnet, Dissolve, Filter, Evaporate) – „Magnetic separation → Dissolving → Filtration → Evaporation“ wäre am Handy abgeschnitten
 */
export const STEP = {
  magnet: () => tr("Magnettrennung", "Magnet"), loesen: () => tr("Lösen", "Dissolve"), filtrieren: () => tr("Filtrieren", "Filter"),
  eindampfen: () => tr("Eindampfen", "Evaporate"), sieben: () => tr("Sieben", "Sieve"),
};

/** Salz und Sand (und Eisen) trennen: richtige Reihenfolge */
export function trennReihe(): Task {
  const iron = Math.random() < .4;
  const S = (...m: string[]) => m.join(" → ");
  const L = STEP.loesen, F = STEP.filtrieren, E = STEP.eindampfen, M = STEP.magnet, Si = STEP.sieben;
  const right = iron ? S(M(), L(), F(), E()) : S(L(), F(), E());
  return {
    ...mc(right, [
      d(iron ? S(L(), E(), M(), F()) : S(F(), L(), E()), "reihenfolge", iron ? tr("Nach dem Eindampfen ist das Salz wieder fest und liegt beim Sand. Ohne Wasser trennt das Filtrieren nichts mehr.", "After evaporating, the salt is solid again and lies with the sand. Without water, filtering separates nothing.") : tr("Vor dem Lösen ist das Salz noch fest. Es bleibt mit dem Sand im Filter.", "Before dissolving, the salt is still solid. It stays in the filter with the sand.")),
      d(iron ? S(M(), L(), E(), F()) : S(L(), E(), F()), "reihenfolge", tr("Nach dem Eindampfen liegen Salz und Sand wieder zusammen.", "After evaporating, salt and sand lie together again.")),
      dis(iron ? S(Si(), M(), E()) : S(Si(), E()), tr("Salz und Sand sind gleich feine Körner. Ein Sieb trennt sie nicht.", "Salt and sand are equally fine grains. A sieve does not separate them.")),
    ], 4),
    mixPic: iron ? "eisensalzsand" : "salzsand",
    prompt: iron ? tr("**Eisen, Sand und Salz** trennen: In welcher Reihenfolge?", "Separate **iron, sand and salt**: in which order?") : tr("**Salz und Sand** trennen: In welcher Reihenfolge?", "Separate **salt and sand**: in which order?"),
    hint: tr("Salz löst sich in Wasser, Sand nicht. Was hält der Filter zurück?", "Salt dissolves in water, sand does not. What does the filter hold back?"),
    tip: tr("Was macht nur das Salz in Wasser?", "What does only the salt do in water?"),
    explain: iron ? tr("Der Magnet holt das Eisen. Lösen, filtrieren: Sand bleibt im Filter. Eindampfen: Salz bleibt.", "The magnet takes the iron. Dissolve, filter: sand stays in the filter. Evaporate: salt stays.")
      : tr("Lösen, filtrieren: Sand bleibt im Filter. Eindampfen: Salz bleibt zurück.", "Dissolve, filter: sand stays in the filter. Evaporate: salt stays behind."),
  };
}
