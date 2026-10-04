// Aufgaben zu Polymeren (reine Daten, damit Runden gespeichert werden können). Aufgabentyp = Fertigkeit.
// Alle Aufgaben sind Auswahl-Aufgaben, meist mit Bild (Strukturformel, Kettenausschnitt, Mechanismus-Schritt mit Pfeilen,
// Kügelchen-Kette, Kettenbild); manche Antworten sind selbst Bilder (`pics`, Schlüssel = Antworttext).
// Jede falsche Antwort steht für eine Fehlvorstellung (misconceptions.ts): d(text, schlüssel, rückmeldung).

import { tr } from "@lern/i18n";
import { buildRound, d, mc, pick, shuffle, weakTypes, type Distractor, type LevelKey, type McTask, type QuizLevel, type TypeStats } from "@lern/quiz";
import { METHODS, method, monoName, stepMono, vinyl, type MethodId, type StepId, type VinylId } from "../chem/data.ts";
import { compat, methodsFor, stepReact } from "../chem/rules.ts";
import { replay } from "../chem/mech/index.ts";
import type { Recipe } from "../chem/mech/types.ts";
import { visText, type StructKind, type Tact, type Vis } from "./visual.tsx";

/** `vis`: Bild der Aufgabe; `pics`: Bilder als Antworten; `tip`: auf die Aufgabe zugeschnittener Tipp */
type Extra = { vis?: Vis; pics?: Record<string, Vis>; tip?: string };
export type Task = McTask & Extra;

/** Begründung, die mit dem Begriff beginnt („Isotaktisch: …“): Begriff fett, nicht noch einmal davor schreiben */
const boldLead = (s: string) => {
  const i = s.indexOf(":");
  return i > 0 ? `**${s.slice(0, i)}**${s.slice(i)}` : s.replace(/^(\S+)/, "**$1**");
};

const T = (de: string, en: string) => tr(de, en);
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
/** englische Namen stehen klein in den Daten: im Satz klein, am Satzanfang groß */
const nm = (id: string) => tr(monoName(id), monoName(id).toLowerCase());
const poly = (id: VinylId) => `${tr(vinyl(id).polymer, vinyl(id).polymer)} (${vinyl(id).abbr})`;
/** Formel ohne Markierung des reagierenden Teils */
const plain = (s: string) => s.replace(/[{}]/g, "");

/** Seitengruppen an der Zweifachbindung (Erkennungsmerkmal des Monomers) */
const SIDE: Record<VinylId, string> = tr(
  { ethen: "nur H‑Atome", propen: "eine CH₃-Gruppe", styrol: "einen Benzolring", vinylchlorid: "ein Cl‑Atom", mma: "eine CH₃- und eine COOCH₃-Gruppe",
    acrylnitril: "eine C≡N-Gruppe", tfe: "vier F‑Atome", isobuten: "zwei CH₃-Gruppen", butadien: "zwei Zweifachbindungen", vinylacetat: "eine Acetatgruppe" },
  { ethen: "only H atoms", propen: "a CH₃ group", styrol: "a benzene ring", vinylchlorid: "a Cl atom", mma: "a CH₃ and a COOCH₃ group",
    acrylnitril: "a C≡N group", tfe: "four F atoms", isobuten: "two CH₃ groups", butadien: "two double bonds", vinylacetat: "an acetate group" },
);
/** gesättigtes Gegenstück (keine Zweifachbindung – kann keine Kette bilden) */
const SAT: Partial<Record<VinylId, [string, string]>> = tr(
  { ethen: ["Ethan", "CH₃–CH₃"], propen: ["Propan", "CH₃–CH₂–CH₃"], vinylchlorid: ["Chlorethan", "CH₃–CH₂–Cl"], styrol: ["Ethylbenzol", "CH₃–CH₂–C₆H₅"],
    acrylnitril: ["Propannitril", "CH₃–CH₂–C≡N"], tfe: ["Tetrafluorethan", "CHF₂–CHF₂"] },
  { ethen: ["Ethane", "CH₃–CH₃"], propen: ["Propane", "CH₃–CH₂–CH₃"], vinylchlorid: ["Chloroethane", "CH₃–CH₂–Cl"], styrol: ["Ethylbenzene", "CH₃–CH₂–C₆H₅"],
    acrylnitril: ["Propanenitrile", "CH₃–CH₂–C≡N"], tfe: ["Tetrafluoroethane", "CHF₂–CHF₂"] },
);
const SAT_IDS = Object.keys(SAT) as VinylId[];
/** einfache Monomere für die ersten Aufgaben (gut erkennbare Gruppe) */
const EASY: VinylId[] = ["ethen", "propen", "styrol", "vinylchlorid", "acrylnitril", "tfe"];
const others = (id: string, pool: VinylId[], n: number) => shuffle(pool.filter(x => x !== id)).slice(0, n);

/** erstes Bild mit Elektronenpfeilen im Ablauf der letzten Aktion (bzw. das n-te) */
function arrowKey(r: Recipe, acts: string[], nth = 0): number {
  const m = replay(r, acts.slice(0, -1));
  const clip = m.run(acts[acts.length - 1]);
  const ks = clip.map((k, i) => (k.arrows?.length ? i : -1)).filter(i => i >= 0);
  return ks[Math.min(nth, ks.length - 1)] ?? clip.length - 1;
}
const mech = (r: Recipe, acts: string[], key: number): Vis => ({ k: "mech", r, acts, key });
const lastFrame = (r: Recipe, acts: string[]): Vis => mech(r, acts, -1);
const PS: Recipe = { art: "poly", a: "styrol", method: "dbpo" };

/** Aufgabe zusammensetzen */
function task(prompt: string, correct: string, wrongs: Distractor[], o: { vis?: Vis; pics?: Record<string, Vis>; hint: string; tip?: string; explain: string; praise?: string; right?: string }): Task {
  const m = mc(correct, wrongs, 4, o.right);
  return { ...m, prompt, hint: o.hint, explain: o.explain, ...(o.tip ? { tip: o.tip } : {}), ...(o.praise ? { praise: o.praise } : {}), ...(o.vis ? { vis: o.vis } : {}), ...(o.pics ? { pics: o.pics } : {}) } as Task;
}

// ── Kapitel 1: Monomere und Polymere ───────────────────────────────────────────

function polyName(): Task {
  const v = pick(EASY.concat(["mma", "vinylacetat"]));
  return task(T("Welches Polymer entsteht aus diesem Monomer?", "Which polymer forms from this monomer?"), poly(v),
    // drei Antworten: das Monomer-Bild bleibt auch auf kleinen Handys groß genug
    others(v, EASY.concat(["mma", "vinylacetat"]), 2).map(w => d(poly(w), "gruppe-verwechselt",
      T(`${vinyl(w).polymer} entsteht aus ${vinyl(w).name}. Dort trägt die Zweifachbindung ${SIDE[w]}.`, `${cap(vinyl(w).polymer.toLowerCase())} forms from ${vinyl(w).name.toLowerCase()}. Its double bond carries ${SIDE[w]}.`))),
    {
      vis: { k: "mono", id: v },
      hint: T("Poly heißt viele. Der Name des Polymers enthält den Namen des Monomers.", "Poly means many. The polymer name contains the monomer name."),
      tip: T(`Achte auf die Gruppe an der Zweifachbindung: ${SIDE[v]}.`, `Look at the group on the double bond: ${SIDE[v]}.`),
      explain: T(`${vinyl(v).name} → **${poly(v)}**: Poly + Name des Monomers.`, `${vinyl(v).name} → **${poly(v)}**: poly + name of the monomer.`),
    });
}

/** gesättigtes Gegenstück als Bild-Antwort */
function monomerVon(): Task {
  const v = pick(SAT_IDS);
  const w = others(v, EASY, 1)[0];
  const opts: [string, Vis][] = [
    [T(`Monomer ${vinyl(v).name}`, `Monomer ${nm(v)}`), { k: "mono", id: v }],
    [T(`gesättigt: ${SAT[v]![0]}`, `saturated: ${SAT[v]![0].toLowerCase()}`), { k: "sat", id: v }],
    [T(`Baustein von ${vinyl(v).polymer}`, `Unit of ${vinyl(v).polymer.toLowerCase()}`), { k: "unit", id: v }],
    [T(`Monomer ${vinyl(w).name}`, `Monomer ${nm(w)}`), { k: "mono", id: w }],
  ];
  const [right, sat, unit, other] = opts;
  return task(T(`Aus welchem Monomer entsteht **${vinyl(v).polymer}**?`, `Which monomer does **${vinyl(v).polymer.toLowerCase()}** form from?`), right[0], [
    d(sat[0], "doppelbindung-fehlt", T(`${SAT[v]![0]} hat keine Zweifachbindung. Es kann keine Kette bilden.`, `${SAT[v]![0]} has no double bond. It cannot form a chain.`)),
    d(unit[0], "name-verwechselt", T("Das ist schon der Baustein in der Kette. Das Monomer hat noch die Zweifachbindung.", "That is already the unit in the chain. The monomer still has the double bond.")),
    d(other[0], "gruppe-verwechselt", T(`Daraus entsteht ${vinyl(w).polymer}.`, `That forms ${vinyl(w).polymer.toLowerCase()}.`)),
  ], {
    pics: Object.fromEntries(opts),
    hint: T("Ein Monomer hat eine C=C-Zweifachbindung. Im Polymer ist sie zur Einfachbindung geworden.", "A monomer has a C=C double bond. In the polymer it has become a single bond."),
    tip: T(`Suche das Monomer mit C=C. Seine Seitengruppe: ${SIDE[v]}.`, `Find the monomer with C=C. Its side group: ${SIDE[v]}.`),
    explain: T(`**${vinyl(v).name}** (${plain(vinyl(v).struct)}) hat die Zweifachbindung – daraus wird ${vinyl(v).polymer}.`, `**${vinyl(v).name}** (${plain(vinyl(v).struct)}) has the double bond – it becomes ${vinyl(v).polymer.toLowerCase()}.`),
  });
}

function baustein(): Task {
  const v = pick(SAT_IDS);
  const w = others(v, EASY, 2);
  return task(T("Aus welchem Monomer ist diese Kette entstanden?", "Which monomer did this chain form from?"), vinyl(v).name, [
    d(SAT[v]![0], "doppelbindung-fehlt", T(`${SAT[v]![0]} hat keine Zweifachbindung – es bildet keine Kette.`, `${SAT[v]![0]} has no double bond – it forms no chain.`)),
    ...w.map(x => d(vinyl(x).name, "gruppe-verwechselt", T(`${vinyl(x).name} trägt ${SIDE[x]}. Merkmal dieser Kette: ${SIDE[v]}.`, `${vinyl(x).name} carries ${SIDE[x]}. This chain's feature: ${SIDE[v]}.`))),
  ], {
    vis: { k: "chain", id: v, n: 3, tact: "atakt", seed: 3 },
    hint: T("Ein Baustein umfasst zwei C‑Atome der Hauptkette. Er wiederholt sich.", "One unit covers two C atoms of the main chain. It repeats."),
    tip: T("Schneide die Kette nach je zwei C‑Atomen. Mache aus der Einfachbindung wieder C=C.", "Cut the chain after every two C atoms. Turn the single bond back into C=C."),
    explain: T(`Baustein –CH₂–CH(…)–, Seitengruppe: ${SIDE[v]} → Monomer **${vinyl(v).name}** (${plain(vinyl(v).struct)}).`, `Unit –CH₂–CH(…)–, side group: ${SIDE[v]} → monomer **${vinyl(v).name}** (${plain(vinyl(v).struct)}).`),
  });
}

function doppelbindung(): Task {
  const v = pick(SAT_IDS);
  const sats = shuffle(SAT_IDS.filter(x => x !== v)).slice(0, 2);
  return task(T("Welches Molekül kann eine Kette bilden (polymerisieren)?", "Which molecule can form a chain (polymerise)?"), plain(vinyl(v).struct), [
    d(SAT[v]![1], "doppelbindung-fehlt", T("Hier fehlt die C=C-Zweifachbindung. Ohne sie kann sich nichts anlagern.", "The C=C double bond is missing here. Without it nothing can add on.")),
    ...sats.map(x => d(SAT[x]![1], "doppelbindung-fehlt", T(`${SAT[x]![0]} hat nur Einfachbindungen.`, `${SAT[x]![0]} has only single bonds.`))),
    d("CH₃–OH", "doppelbindung-fehlt", T("Methanol hat keine C=C-Bindung.", "Methanol has no C=C bond.")),
  ], {
    hint: T("Polymerisieren können nur Moleküle mit einer C=C-Zweifachbindung.", "Only molecules with a C=C double bond can polymerise."),
    tip: T("Suche das Gleichheitszeichen zwischen zwei C‑Atomen.", "Look for the equals sign between two C atoms."),
    explain: T(`**${plain(vinyl(v).struct)}** hat eine C=C-Bindung. Sie öffnet sich und verbindet die Moleküle zur Kette.`, `**${plain(vinyl(v).struct)}** has a C=C bond. It opens and links the molecules into a chain.`),
  });
}

function nBedeutung(): Task {
  const v = pick(EASY);
  return task(T("Was bedeutet das **n** an der eckigen Klammer?", "What does the **n** at the square bracket mean?"), T("Baustein n-mal wiederholt", "Unit repeated n times"), [
    d(T("n steht für Stickstoff", "n stands for nitrogen"), "n-stickstoff", T("Stickstoff ist ein großes N. Das kleine n ist eine Anzahl.", "Nitrogen is a capital N. The small n is a number.")),
    d(T("Polymer hat n Atome", "Polymer has n atoms"), "atome-statt-bausteine", T("n zählt Bausteine, nicht Atome. Jeder Baustein hat mehrere Atome.", "n counts units, not atoms. Each unit has several atoms.")),
    d(T("n verschiedene Monomere", "n different monomers"), "name-verwechselt", T("Hier ist es immer derselbe Baustein – nur sehr oft.", "Here it is always the same unit – just very often.")),
  ], {
    vis: { k: "unit", id: v },
    hint: T("Die Klammer umschließt einen Baustein. Das n zählt, wie oft er vorkommt.", "The bracket encloses one unit. The n counts how often it occurs."),
    explain: T("In [ … ]ₙ steht **ein Baustein**. n ist groß: oft tausende Bausteine in einer Kette.", "[ … ]ₙ contains **one unit**. n is large: often thousands of units in one chain."),
  });
}

function kugelZaehlen(): Task {
  const v = pick(EASY);
  const n = pick([5, 6, 7, 8, 9]);
  const atoms = { ethen: 6, propen: 9, styrol: 16, vinylchlorid: 6, acrylnitril: 7, tfe: 6 }[v as "ethen"] ?? 6;
  return task(T("Wie viele **Monomere** wurden in diese Kette eingebaut?", "How many **monomers** were built into this chain?"), String(n), [
    d(String(n - 1), "bindungen-gezaehlt", T(`${n - 1} sind die Striche zwischen den Kügelchen. Gezählt werden die Kügelchen.`, `${n - 1} is the number of lines between the beads. Count the beads.`)),
    d(String(n * atoms), "atome-statt-bausteine", T(`Jedes Kügelchen ist ein ganzer Baustein mit ${atoms} Atomen. Gefragt sind die Bausteine.`, `Each bead is a whole unit with ${atoms} atoms. The question asks for units.`)),
    d(String(2 * n), "atome-statt-bausteine", T(`${2 * n} sind die C‑Atome der Hauptkette – je Baustein zwei. Gezählt werden Bausteine.`, `${2 * n} is the number of main-chain C atoms – two per unit. Count units.`)),
  ], {
    vis: { k: "beads", seq: Array.from({ length: n }, () => v) },
    hint: T("Im Kügelchenmodell ist jedes Kügelchen ein eingebautes Monomer.", "In the bead model each bead is one built-in monomer."),
    tip: T("Zähle die Kügelchen, nicht die Striche.", "Count the beads, not the lines."),
    explain: T(`${n} Kügelchen = **${n} Bausteine** = ${n} eingebaute Monomere.`, `${n} beads = **${n} units** = ${n} built-in monomers.`),
  });
}

function bausteinWahl(): Task {
  const v = pick(EASY.filter(x => x !== "ethen" && x !== "tfe"));
  const w = others(v, EASY.filter(x => x !== "ethen" && x !== "tfe"), 1)[0];
  const right: [string, Vis] = [visText({ k: "unit", id: v }), { k: "unit", id: v }];
  const dbl: [string, Vis] = [visText({ k: "unit", id: v, dbl: true }), { k: "unit", id: v, dbl: true }];
  const other: [string, Vis] = [visText({ k: "unit", id: w }), { k: "unit", id: w }];
  return task(T("Welcher **Baustein** steckt im Polymer aus diesem Monomer?", "Which **unit** is in the polymer made from this monomer?"), right[0], [
    d(dbl[0], "doppelbindung-bleibt", T("Im Baustein ist die Zweifachbindung weg. Ihre Elektronen bilden die Bindungen zu den Nachbarn.", "In the unit the double bond is gone. Its electrons form the bonds to the neighbours.")),
    d(other[0], "gruppe-verwechselt", T(`Dieser Baustein trägt ${SIDE[w]} – er gehört zu ${vinyl(w).name}.`, `This unit carries ${SIDE[w]} – it belongs to ${nm(w)}.`)),
  ], {
    vis: { k: "mono", id: v }, pics: Object.fromEntries([right, dbl, other]),
    hint: T("Aus C=C wird C–C. Die Seitengruppe bleibt, wo sie ist.", "C=C becomes C–C. The side group stays where it is."),
    explain: T(`Monomer ${plain(vinyl(v).struct)} → Baustein mit Einfachbindung. Die Seitengruppe bleibt: ${SIDE[v]}.`, `Monomer ${plain(vinyl(v).struct)} → unit with a single bond. The side group stays: ${SIDE[v]}.`),
  });
}

/** Alltagsgegenstand, der unter den sechs Kunststoffen eindeutig zu einem gehört (Rohre z. B. gibt es aus PE und PVC) */
const EVERYDAY: Record<"ethen" | "propen" | "styrol" | "vinylchlorid" | "tfe" | "mma", string> = tr(
  { ethen: "Aus welchem Kunststoff sind die meisten **Plastiktüten**?", propen: "Aus welchem Kunststoff sind oft **Stoßstangen** von Autos?",
    styrol: "Aus welchem Kunststoff sind weiße **Dämmplatten aus Schaum**?", vinylchlorid: "Aus welchem Kunststoff sind oft **Fensterrahmen**?",
    tfe: "Aus welchem Kunststoff ist die **Antihaftschicht** in Pfannen?", mma: "Aus welchem Kunststoff ist **Acrylglas**?" },
  { ethen: "Which plastic are most **plastic bags** made of?", propen: "Which plastic are car **bumpers** often made of?",
    styrol: "Which plastic are white **foam insulation boards** made of?", vinylchlorid: "Which plastic are **window frames** often made of?",
    tfe: "Which plastic is the **non-stick coating** in pans?", mma: "Which plastic is **acrylic glass**?" },
);

function kunststoffAlltag(): Task {
  const ids = Object.keys(EVERYDAY) as (keyof typeof EVERYDAY)[];
  const v = pick(ids);
  return task(EVERYDAY[v], poly(v),
    others(v, ids, 3).map(w => d(poly(w), "verwendung-verwechselt", T(`${vinyl(w).abbr}: ${vinyl(w).uses}.`, `${vinyl(w).abbr}: ${vinyl(w).uses}.`))), {
      hint: T("Kunststoffe sind Polymere mit Kurzzeichen: PE, PP, PS, PVC …", "Plastics are polymers with short codes: PE, PP, PS, PVC …"),
      explain: T(`**${vinyl(v).abbr}**: ${vinyl(v).uses}.`, `**${vinyl(v).abbr}**: ${vinyl(v).uses}.`),
    });
}

// ── Kapitel 2: radikalische Polymerisation ─────────────────────────────────────

const STEP_TEXT = () => tr({ start: "Start: Der Starter zerfällt", wachstum: "Kettenwachstum", abbruch: "Kettenabbruch" }, { start: "Initiation: the initiator splits", wachstum: "Chain growth", abbruch: "Termination" });

function schritt(): Task {
  const which = pick(["start", "wachstum", "abbruch"] as const);
  const acts = which === "start" ? ["heat"] : which === "wachstum" ? ["heat", "add:styrol", "add:styrol"] : ["heat", "add:styrol", "add:styrol", "comb"];
  const S = STEP_TEXT();
  const WHY: Record<string, string> = tr(
    { start: "Beim Start bricht die O–O-Bindung des Starters. Noch ist kein Monomer dabei.", wachstum: "Beim Wachstum greift das Radikal am Kettenende eine C=C-Bindung an.", abbruch: "Beim Abbruch treffen sich zwei Radikale und bilden eine Bindung." },
    { start: "In initiation the O–O bond of the initiator breaks. No monomer is involved yet.", wachstum: "In growth the radical at the chain end attacks a C=C bond.", abbruch: "In termination two radicals meet and form a bond." },
  );
  return task(T("Welcher Schritt der radikalischen Polymerisation ist das?", "Which step of radical polymerisation is this?"), S[which],
    (["start", "wachstum", "abbruch"] as const).filter(x => x !== which).map(x => d(S[x], "schritt-verwechselt", WHY[x])), {
      vis: mech(PS, acts, arrowKey(PS, acts)),
      hint: T("Start: Starter zerfällt. Wachstum: Radikal + C=C. Abbruch: Radikal + Radikal.", "Initiation: initiator splits. Growth: radical + C=C. Termination: radical + radical."),
      tip: T("Sieh nach, was die Pfeile verbinden: Starter, Monomer oder zwei Kettenenden?", "Check what the arrows connect: initiator, monomer or two chain ends?"),
      explain: `**${S[which]}**. ${WHY[which]}`,
    });
}

function radikal(): Task {
  return task(T("Was ist ein **Radikal**?", "What is a **radical**?"), T("Teilchen mit ungepaartem Elektron", "Particle with an unpaired electron"), [
    d(T("Teilchen mit Ladung (Ion)", "Particle with a charge (ion)"), "radikal-ion", T("Ein Radikal ist ungeladen. Es hat ein einzelnes Elektron statt eines Paares.", "A radical has no charge. It has a single electron instead of a pair.")),
    d(T("Molekül mit Zweifachbindung", "Molecule with a double bond"), "doppelbindung-fehlt", T("Das ist das Monomer. Das Radikal greift die Zweifachbindung an.", "That is the monomer. The radical attacks the double bond.")),
  ], {
    vis: lastFrame(PS, ["heat"]),
    hint: T("Der Punkt am Atom zeigt ein einzelnes Elektron.", "The dot at the atom shows a single electron."),
    explain: T("Radikal = Teilchen mit **ungepaartem Elektron** (Punkt). Es reagiert sehr leicht.", "Radical = particle with an **unpaired electron** (dot). It reacts very easily."),
  });
}

function pfeil(): Task {
  return task(T("Wie viele Elektronen bewegt ein Pfeil mit **halber** Spitze?", "How many electrons does an arrow with a **half** head move?"), "1", [
    d("2", "pfeil-paar", T("Zwei Elektronen (ein Paar) zeigt der volle Pfeil. Der halbe Pfeil zeigt eins.", "Two electrons (a pair) are shown by a full arrow. A half arrow shows one.")),
    d("0", "pfeil-paar", T("Jeder Pfeil zeigt bewegte Elektronen – der halbe genau eins.", "Every arrow shows moving electrons – the half one exactly one.")),
    d("3", "pfeil-paar", T("Elektronen bewegen sich einzeln oder als Paar – nie zu dritt.", "Electrons move singly or as a pair – never three at once.")),
  ], {
    vis: mech(PS, ["heat"], arrowKey(PS, ["heat"])),
    hint: T("Halbe Spitze = ein Elektron, volle Spitze = Elektronenpaar.", "Half head = one electron, full head = electron pair."),
    explain: T("Halber Pfeil: **ein** Elektron. Beim Bruch der O–O-Bindung behält jedes O ein Elektron – zwei Radikale.", "Half arrow: **one** electron. When the O–O bond breaks each O keeps one electron – two radicals."),
  });
}

function startBruch(): Task {
  return task(T("Was passiert beim Erwärmen mit der O–O-Bindung des Starters?", "What happens to the O–O bond of the initiator on heating?"), T("Bricht – jedes O behält 1 Elektron", "Breaks – each O keeps 1 electron"), [
    d(T("Bricht – ein O bekommt beide", "Breaks – one O gets both"), "homolyse-heterolyse", T("Dann entstünden Ionen. Beim Start entstehen zwei gleiche Radikale.", "That would form ions. Initiation forms two identical radicals.")),
    d(T("Wird zur Zweifachbindung", "Becomes a double bond"), "schritt-verwechselt", T("Beim Erwärmen bricht die schwache O–O-Bindung.", "On heating the weak O–O bond breaks.")),
    d(T("Bleibt – das Monomer zerfällt", "Stays – the monomer splits"), "schritt-verwechselt", T("Das Monomer zerfällt nicht. Die schwache O–O-Bindung des Starters bricht.", "The monomer does not split. The weak O–O bond of the initiator breaks.")),
  ], {
    vis: mech(PS, ["heat"], arrowKey(PS, ["heat"])),
    hint: T("Zwei halbe Pfeile gehen in entgegengesetzte Richtungen.", "Two half arrows go in opposite directions."),
    explain: T("Die O–O-Bindung bricht **gleichmäßig**: jedes O behält ein Elektron → zwei Radikale. Danach geht CO₂ ab.", "The O–O bond breaks **evenly**: each O keeps one electron → two radicals. Then CO₂ leaves."),
  });
}

function wohinRadikal(): Task {
  const acts = ["heat", "add:styrol"];
  return task(T("Wo sitzt das Radikal, nachdem sich das Monomer angelagert hat?", "Where is the radical after the monomer has added?"), T("Am neuen Kettenende", "At the new chain end"), [
    d(T("Am Bruchstück des Starters", "On the initiator fragment"), "radikal-bleibt", T("Das Starter-Radikal hat sein Elektron für die neue Bindung genutzt.", "The initiator radical used its electron for the new bond.")),
    d(T("Nirgends mehr", "Nowhere any more"), "schritt-verwechselt", T("Ein Elektron der Zweifachbindung bleibt übrig: Das neue Ende ist wieder ein Radikal.", "One electron of the double bond is left over: the new end is a radical again.")),
    d(T("Am Benzolring", "On the benzene ring"), "gruppe-verwechselt", T("Der Benzolring bleibt unverändert. Es reagiert nur die C=C.", "The benzene ring stays unchanged. Only the C=C reacts.")),
  ], {
    vis: mech(PS, acts, arrowKey(PS, acts)),
    hint: T("Von der Zweifachbindung geht ein Elektron in die neue Bindung, eins bleibt übrig.", "One electron of the double bond goes into the new bond, one is left over."),
    explain: T("Das Radikal lagert sich an. Am **anderen C‑Atom** entsteht ein neues Radikal – die Kette wächst dort weiter.", "The radical adds on. At the **other C atom** a new radical forms – the chain keeps growing there."),
  });
}

function abbruchArt(): Task {
  const comb = Math.random() < 0.5;
  const acts = ["heat", "add:styrol", "add:styrol", comb ? "comb" : "disp"];
  const R = T("Rekombination", "Combination"), D = T("Disproportionierung", "Disproportionation");
  return task(T("Welcher Kettenabbruch ist das?", "Which termination is this?"), comb ? R : D, [
    d(comb ? D : R, "abbruch-verwechselt", comb
      ? T("Bei der Disproportionierung wandert ein H‑Atom. Hier verbinden sich die Kettenenden.", "In disproportionation an H atom moves. Here the chain ends join.")
      : T("Bei der Rekombination verbinden sich die Enden. Hier wandert ein H‑Atom.", "In combination the ends join. Here an H atom moves.")),
    d(T("Kettenwachstum", "Chain growth"), "schritt-verwechselt", T("Beim Wachstum kommt ein Monomer dazu. Hier treffen sich zwei Radikale.", "In growth a monomer adds. Here two radicals meet.")),
  ], {
    vis: mech(PS, acts, arrowKey(PS, acts)),
    hint: T("Rekombination: zwei Enden verbinden sich. Disproportionierung: ein H‑Atom wandert.", "Combination: two ends join. Disproportionation: an H atom moves."),
    tip: T("Verbinden die Pfeile die beiden Radikale – oder holen sie ein H‑Atom?", "Do the arrows join the two radicals – or fetch an H atom?"),
    explain: comb ? T("**Rekombination**: Die zwei Radikal-Elektronen bilden eine Bindung – eine lange Kette.", "**Combination**: the two radical electrons form a bond – one long chain.")
      : T("**Disproportionierung**: Ein H‑Atom wandert. Eine Kette endet mit C=C, die andere gesättigt.", "**Disproportionation**: an H atom moves. One chain ends with C=C, the other saturated."),
  });
}

function starterRest(): Task {
  return task(T("Was sitzt am Anfang jeder Kette?", "What sits at the start of every chain?"), T("Ein Bruchstück des Starters", "A fragment of the initiator"), [
    d(T("Nichts (Starter = Katalysator)", "Nothing (initiator = catalyst)"), "starter-katalysator", T("Der Starter wird verbraucht. Sein Bruchstück wird Teil der Kette.", "The initiator is used up. Its fragment becomes part of the chain.")),
    d(T("Ein Radikal", "A radical"), "radikal-bleibt", T("Das Radikal sitzt am wachsenden Ende, nicht am Anfang.", "The radical sits at the growing end, not at the start.")),
    d(T("Ein Wassermolekül", "A water molecule"), "byp-falsch", T("Bei der Polymerisation entsteht kein Wasser. Am Anfang sitzt das Starter-Radikal, das die Kette begonnen hat.", "Polymerisation forms no water. The start holds the initiator radical that began the chain.")),
  ], {
    vis: lastFrame(PS, ["heat", "add:styrol", "add:styrol"]),
    hint: T("Vergleiche den Anfang der Kette mit dem Starter-Radikal.", "Compare the start of the chain with the initiator radical."),
    explain: T("Der Starter wird **verbraucht**: Das Bruchstück C₆H₅– bleibt als Endgruppe am Kettenanfang.", "The initiator is **used up**: the fragment C₆H₅– stays as the end group at the chain start."),
  });
}

function mehrStarter(): Task {
  return task(T("Was passiert mit mehr Starter (bei gleich viel Monomer)?", "What happens with more initiator (same amount of monomer)?"), T("Mehr, aber kürzere Ketten", "More but shorter chains"), [
    d(T("Längere Ketten", "Longer chains"), "mehr-starter-laenger", T("Mehr Radikale teilen sich das Monomer. Jede Kette bekommt weniger.", "More radicals share the monomer. Each chain gets less.")),
    d(T("Weniger Ketten", "Fewer chains"), "mehr-starter-laenger", T("Jedes Radikal startet eine Kette – mehr Starter, mehr Ketten.", "Each radical starts a chain – more initiator, more chains.")),
    d(T("Nichts ändert sich", "Nothing changes"), "mehr-starter-laenger", T("Jedes Starter-Radikal beginnt eine Kette. Mehr Starter heißt mehr Ketten – jede bekommt weniger Monomer.", "Each initiator radical starts a chain. More initiator means more chains – each gets less monomer.")),
  ], {
    vis: { k: "starters" },
    hint: T("Jedes Radikal startet eine Kette. Das Monomer verteilt sich auf alle Ketten.", "Each radical starts a chain. The monomer is shared among all chains."),
    explain: T("Mehr Radikale → **mehr Ketten** → jede Kette **kürzer**. Wenig Starter → wenige, lange Ketten.", "More radicals → **more chains** → each chain **shorter**. Little initiator → few, long chains."),
  });
}

// ── Kapitel 3: Katalysatoren und Verfahren ─────────────────────────────────────

const ZN_PP: Recipe = { art: "poly", a: "propen", method: "zn" };
const POLAR: VinylId[] = ["mma", "vinylchlorid", "acrylnitril", "vinylacetat"];
const NONPOLAR: VinylId[] = ["ethen", "propen", "styrol", "butadien"];
const methName = (id: MethodId) => tr(method(id).name, method(id).name);

function katalysator(): Task {
  return task(T("Was unterscheidet den Ziegler-Natta-Katalysator vom Starter DBPO?", "What makes the Ziegler–Natta catalyst different from the initiator DBPO?"), T("Er wird nicht verbraucht", "It is not used up"), [
    d(T("Er zerfällt in Radikale", "It splits into radicals"), "starter-katalysator", T("Das macht der Starter DBPO. Der Katalysator bleibt erhalten.", "That is what the initiator DBPO does. The catalyst stays intact.")),
    d(T("Er bildet das Kettenende", "It forms the chain end"), "starter-katalysator", T("Am Ende bleibt der Starter. Der Katalysator gibt die Kette ab und macht weiter.", "The initiator stays at the end. The catalyst releases the chain and carries on.")),
    d(T("Er enthält C=C", "It contains C=C"), "starter-katalysator", T("C=C hat das Monomer. Der Katalysator ist eine Titanverbindung.", "The monomer has the C=C. The catalyst is a titanium compound.")),
  ], {
    hint: T("Ein Katalysator beschleunigt eine Reaktion und liegt danach unverändert vor.", "A catalyst speeds up a reaction and is unchanged afterwards."),
    explain: T("**Katalysator**: Am Titan wachsen nacheinander viele Ketten. **Starter**: wird verbraucht.", "**Catalyst**: many chains grow one after another at the titanium. **Initiator**: is used up."),
  });
}

function freieStelle(): Task {
  const acts = ["act", "add:propen"];
  return task(T("Wo lagert sich das Propen an?", "Where does the propene attach?"), T("An der freien Stelle am Ti", "At the free site on Ti"), [
    d(T("An einem Radikal", "At a radical"), "zn-radikal", T("Hier gibt es kein Radikal. Die Kette sitzt am Titan.", "There is no radical here. The chain sits on the titanium.")),
    d(T("Am Cl‑Atom", "At the Cl atom"), "zn-radikal", T("Die Cl‑Atome halten das Titan. Angelagert wird an der freien Stelle.", "The Cl atoms hold the titanium. Attachment is at the free site.")),
    d(T("Am Aluminium", "At the aluminium"), "zn-radikal", T("Das Al hat nur die Ethylgruppe übergeben. Angelagert wird am Titan.", "The Al only handed over the ethyl group. Attachment happens at the titanium.")),
  ], {
    vis: mech(ZN_PP, acts, arrowKey(ZN_PP, acts)),
    hint: T("Der gestrichelte Kreis am Titan ist die freie Stelle.", "The dashed circle on the titanium is the free site."),
    explain: T("Das Monomer lagert sich mit seiner C=C-Bindung an die **freie Stelle** an. Dann wird es zwischen Titan und Kette eingebaut.", "The monomer attaches its C=C bond to the **free site**. Then it is inserted between titanium and chain."),
  });
}

function zieglerGift(): Task {
  const v = pick(POLAR);
  return task(T("Welches Monomer **vergiftet** den Ziegler-Natta-Katalysator?", "Which monomer **poisons** the Ziegler–Natta catalyst?"), vinyl(v).name,
    shuffle(NONPOLAR).slice(0, 3).map(w => d(vinyl(w).name, "zn-polar", T(`${vinyl(w).name} hat kein O-, N-, Cl- oder F‑Atom. Es wird am Titan eingebaut.`, `${vinyl(w).name} has no O, N, Cl or F atom. It is inserted at the titanium.`))), {
      hint: T("Atome mit freien Elektronenpaaren (O, N, Cl, F) binden an das Titan.", "Atoms with lone pairs (O, N, Cl, F) bind to the titanium."),
      tip: T("Suche das Monomer mit O, N oder Cl.", "Look for the monomer with O, N or Cl."),
      explain: compat(v, "zn").why,
    });
}

const TACT_NAME = () => tr({ iso: "isotaktisch", syndio: "syndiotaktisch", atakt: "ataktisch" }, { iso: "isotactic", syndio: "syndiotactic", atakt: "atactic" });

function taktisch(): Task {
  const t = pick(["iso", "syndio", "atakt"] as Tact[]);
  const id = pick(["propen", "styrol"] as VinylId[]);
  const N = TACT_NAME();
  const WHY: Record<Tact, string> = tr(
    { iso: "Isotaktisch: alle Seitengruppen auf derselben Seite.", syndio: "Syndiotaktisch: die Seitengruppen wechseln regelmäßig die Seite.", atakt: "Ataktisch: die Seitengruppen sitzen zufällig oben oder unten." },
    { iso: "Isotactic: all side groups on the same side.", syndio: "Syndiotactic: the side groups alternate regularly.", atakt: "Atactic: the side groups sit randomly above or below." },
  );
  return task(T("Wie sind die Seitengruppen in dieser Kette angeordnet?", "How are the side groups arranged in this chain?"), N[t],
    (["iso", "syndio", "atakt"] as Tact[]).filter(x => x !== t).map(x => d(N[x], "taktisch-verwechselt", WHY[x])), {
      vis: { k: "chain", id, n: 5, tact: t, seed: t === "atakt" ? 7 : 1 },
      hint: T("Schau, ob die Seitengruppen oben, unten oder abwechselnd sitzen.", "Check whether the side groups sit above, below or alternately."),
      explain: boldLead(WHY[t]),
    });
}

function taktischVerfahren(): Task {
  return task(T("Mit welchem Verfahren entsteht **isotaktisches** Polypropen?", "Which method gives **isotactic** polypropene?"), methName("zn"), [
    d(methName("dbpo"), "radikal-taktisch", compat("propen", "dbpo").why),
    d(methName("bf3"), "verfahren-passt-nicht", compat("propen", "bf3").why),
    d(methName("buli"), "verfahren-passt-nicht", compat("propen", "buli").why),
  ], {
    hint: T("Geordnete Ketten entstehen, wenn jedes Monomer gleich herum eingebaut wird.", "Ordered chains form when each monomer is inserted the same way round."),
    explain: compat("propen", "zn").why,
  });
}

function hdpe(): Task {
  return task(T("Welches Polyethen hat **unverzweigte** Ketten und ist dichter?", "Which polyethene has **unbranched** chains and is denser?"), T("PE-HD (Ziegler-Natta)", "PE-HD (Ziegler–Natta)"), [
    d(T("PE-LD (radikalisch)", "PE-LD (radical)"), "verzweigt-dichte", T("Die Äste halten die Ketten auf Abstand – PE-LD ist weniger dicht.", "The branches keep the chains apart – PE-LD is less dense.")),
    d(T("Beide gleich", "Both the same"), "verzweigt-dichte", T("Die Verfahren ergeben verschiedene Ketten: verzweigt oder unverzweigt.", "The methods give different chains: branched or unbranched.")),
  ], {
    vis: { k: "struct", s: "verzweigt" },
    hint: T("Unverzweigte Ketten können sich eng aneinanderlegen.", "Unbranched chains can lie close together."),
    explain: T("**PE-HD**: unverzweigt, dicht, fest (Flaschen, Rohre). **PE-LD**: verzweigt, weich (Folien).", "**PE-HD**: unbranched, dense, stiff (bottles, pipes). **PE-LD**: branched, soft (films)."),
  });
}

function lebend(): Task {
  return task(T("Lebende Polystyrol-Ketten (anionisch) – dann kommt Butadien dazu. Was entsteht?", "Living polystyrene chains (anionic) – then butadiene is added. What forms?"), T("Ein Blockcopolymer", "A block copolymer"), [
    d(T("Zwei getrennte Polymere", "Two separate polymers"), "block-getrennt", T("Das passiert, wenn die Ketten schon abgebrochen sind – etwa radikalisch.", "That happens when the chains have already stopped – for example by radicals.")),
    d(T("Ein statistisches Copolymer", "A statistical copolymer"), "copo-verwechselt", T("Statistisch wird es, wenn beide Monomere gleichzeitig da sind.", "It becomes statistical when both monomers are there at the same time.")),
    d(T("Nur Polystyrol", "Only polystyrene"), "block-getrennt", T("Die Ketten leben noch. Butadien lagert sich an ihre Enden an und wird eingebaut.", "The chains are still alive. Butadiene adds to their ends and is built in.")),
  ], {
    vis: { k: "beads", seq: ["styrol", "styrol", "styrol", "styrol", "butadien", "butadien", "butadien", "butadien"] },
    hint: T("Lebende Ketten brechen nicht von selbst ab. Sie wachsen mit jedem neuen Monomer weiter.", "Living chains do not stop by themselves. They keep growing with each new monomer."),
    explain: T("Jede lebende Kette wächst mit Butadien weiter: erst ein **Block** Styrol, dann ein Block Butadien (SB).", "Each living chain keeps growing with butadiene: first a **block** of styrene, then a block of butadiene (SB)."),
  });
}

function kationisch(): Task {
  const ws = shuffle(["mma", "acrylnitril", "vinylchlorid"] as VinylId[]).slice(0, 2);
  return task(T("Welches Monomer bildet **kationisch** (BF₃ mit Wasser) lange Ketten?", "Which monomer forms long chains **cationically** (BF₃ with water)?"), vinyl("isobuten").name, [
    ...ws.map(w => d(vinyl(w).name, "kation-polar", compat(w, "bf3").why)),
    d(vinyl("ethen").name, "verfahren-passt-nicht", compat("ethen", "bf3").why),
  ], {
    hint: T("Die positive Ladung am Kettenende braucht Gruppen, die Elektronen schieben.", "The positive charge at the chain end needs groups that push electrons."),
    explain: compat("isobuten", "bf3").why,
  });
}

function verfahrenWahl(): Task {
  const m = pick(["ethen", "propen", "mma", "vinylchlorid", "isobuten", "acrylnitril"] as VinylId[]);
  const ok = methodsFor(m);
  const right = pick(ok);
  const bad = shuffle(METHODS.map(x => x.id).filter(x => compat(m, x).fit !== "ok")).slice(0, 3);
  return task(T(`Mit welchem Verfahren bildet **${vinyl(m).name}** lange Ketten?`, `Which method makes **${nm(m)}** form long chains?`), methName(right),
    bad.map(b => d(methName(b), compat(m, b).fail === "poison" ? "zn-polar" : "verfahren-passt-nicht", compat(m, b).why)), {
      hint: T("O, N, Cl: Ziegler-Natta wird vergiftet. Zwei CH₃ an einem C: zu sperrig für Titan, aber gut kationisch.", "O, N, Cl: Ziegler–Natta is poisoned. Two CH₃ on one C: too bulky for titanium, but fine cationically."),
      explain: compat(m, right).why,
    });
}

// ── Kapitel 4: Polykondensation ────────────────────────────────────────────────

const G = () => tr({ COOH: "–COOH", OH: "–OH", NH2: "–NH₂", COCl: "–COCl", NCO: "–N=C=O" }, { COOH: "–COOH", OH: "–OH", NH2: "–NH₂", COCl: "–COCl", NCO: "–N=C=O" });
const and = (a: string, b: string) => tr(`${a} und ${b}`, `${a} and ${b}`);

function gruppen(): Task {
  const [a, b, ga, gb] = pick([["terephthalsaeure", "ethandiol", "COOH", "OH"], ["adipinsaeure", "hexandiamin", "COOH", "NH2"], ["adipinsaeure", "butandiol", "COOH", "OH"]] as const);
  const g = G();
  return task(T("Welche Gruppen reagieren miteinander?", "Which groups react with each other?"), and(g[ga], g[gb]), [
    d(and(g[gb], g[gb]), "gleiche-gruppen", T("Gleiche Gruppen reagieren nicht miteinander.", "Identical groups do not react with each other.")),
    d(and(g[ga], g[ga]), "gleiche-gruppen", T("Zwei Säuregruppen verbinden sich nicht.", "Two acid groups do not join.")),
    d(and("C=C", g[gb]), "kond-doppelbindung", T("Diese Monomere haben keine C=C-Bindung. Sie reagieren über ihre Gruppen.", "These monomers have no C=C bond. They react through their groups.")),
  ], {
    vis: { k: "pair", a, b },
    hint: T("Eine Säuregruppe reagiert mit einer Alkohol- oder Aminogruppe.", "An acid group reacts with an alcohol or amino group."),
    explain: T(`${g[ga]} + ${g[gb]} → Verknüpfung, dabei wird Wasser abgespalten.`, `${g[ga]} + ${g[gb]} → link, water is split off.`),
  });
}

const PET: Recipe = { art: "kond", a: "terephthalsaeure", b: "ethandiol" };
function nebenprodukt(): Task {
  return task(T("Welches Molekül wird bei dieser Verknüpfung abgespalten?", "Which molecule is split off in this link?"), "H₂O", [
    d("H₂", "byp-falsch", T("Abgespalten werden OH (von der Säure) und H (vom Alkohol): zusammen H₂O.", "OH (from the acid) and H (from the alcohol) are split off: together H₂O.")),
    d("CO₂", "byp-falsch", T("Das C‑Atom der Säuregruppe bleibt in der Kette.", "The C atom of the acid group stays in the chain.")),
    d("O₂", "byp-falsch", T("Ein O‑Atom bleibt in der Esterbindung, eins geht ins Wasser.", "One O atom stays in the ester bond, one goes into the water.")),
  ], {
    vis: lastFrame(PET, ["join"]),
    hint: T("Zähle, welche Atome die beiden Gruppen abgeben.", "Count which atoms the two groups give off."),
    explain: T("–COOH gibt OH ab, –OH gibt H ab: zusammen **H₂O**. Das macht die Reaktion zur Polykondensation.", "–COOH gives off OH, –OH gives off H: together **H₂O**. That makes it a polycondensation."),
  });
}

function bindungArt(): Task {
  const amid = Math.random() < 0.5;
  const g = G();
  const E = T("Esterbindung", "Ester bond"), A = T("Amidbindung", "Amide bond"), U = T("Urethangruppe", "Urethane group");
  return task(T(`Welche Bindung entsteht aus ${g.COOH} und ${amid ? g.NH2 : g.OH}?`, `Which bond forms from ${g.COOH} and ${amid ? g.NH2 : g.OH}?`), amid ? A : E, [
    d(amid ? E : A, "ester-amid", amid ? T("Ester entstehen mit –OH. Mit –NH₂ entsteht ein Amid.", "Esters form with –OH. With –NH₂ an amide forms.") : T("Amide entstehen mit –NH₂. Mit –OH entsteht ein Ester.", "Amides form with –NH₂. With –OH an ester forms.")),
    d(U, "ester-urethan", T("Urethane entstehen aus Isocyanat (–N=C=O) und Alkohol.", "Urethanes form from isocyanate (–N=C=O) and alcohol.")),
    d(T("Zweifachbindung", "Double bond"), "kond-doppelbindung", T("Es entsteht eine Einfachbindung zu O bzw. N. Die C=O gab es schon in der Säuregruppe.", "A single bond to O or N forms. The C=O was already in the acid group.")),
  ], {
    hint: T("Säure + Alkohol → Ester. Säure + Amin → Amid.", "Acid + alcohol → ester. Acid + amine → amide."),
    explain: amid ? T("–CO–**NH**–: **Amidbindung** (Polyamid, z. B. Nylon).", "–CO–**NH**–: **amide bond** (polyamide, e.g. nylon).") : T("–CO–**O**–: **Esterbindung** (Polyester, z. B. PET).", "–CO–**O**–: **ester bond** (polyester, e.g. PET)."),
  });
}

function chlorid(): Task {
  return task(T("Adipinsäuredichlorid + Hexan-1,6-diamin: Was wird abgespalten?", "Adipoyl chloride + hexane-1,6-diamine: what is split off?"), "HCl", [
    d("H₂O", "byp-chlorid", T("Das Säurechlorid hat statt OH ein Cl‑Atom. Darum geht HCl ab.", "The acid chloride has a Cl atom instead of OH. So HCl leaves.")),
    d("Cl₂", "byp-falsch", T("Das Cl verbindet sich mit dem H aus der Aminogruppe.", "The Cl joins with the H from the amino group.")),
    d("NH₃", "byp-falsch", T("Das N bleibt in der Amidbindung. Nur ein H geht ab – zusammen mit dem Cl.", "The N stays in the amide bond. Only one H leaves – together with the Cl.")),
  ], {
    vis: { k: "pair", a: "adipoylchlorid", b: "hexandiamin" },
    hint: T("Das Cl der Säuregruppe und ein H der Aminogruppe gehen weg.", "The Cl of the acid group and an H of the amino group leave."),
    explain: T("–COCl + H₂N– → –CO–NH– + **HCl**. So entsteht Nylon schon bei Raumtemperatur.", "–COCl + H₂N– → –CO–NH– + **HCl**. This makes nylon even at room temperature."),
  });
}

const pair = (a: StepId, b: StepId) => `${stepName(a)} + ${stepName(b)}`;
const stepName = (id: StepId) => tr(stepMono(id).name, stepMono(id).name.toLowerCase());

function paarWahl(): Task {
  const amid = Math.random() < 0.5;
  const right = amid ? pair("adipinsaeure", "hexandiamin") : pair("terephthalsaeure", "ethandiol");
  return task(amid ? T("Welches Paar bildet ein **Polyamid**?", "Which pair forms a **polyamide**?") : T("Welches Paar bildet einen **Polyester**?", "Which pair forms a **polyester**?"), right, [
    d(pair("ethandiol", "butandiol"), "gleiche-gruppen", T("Zwei Alkohole haben nur –OH-Gruppen. Die reagieren nicht miteinander.", "Two alcohols only have –OH groups. They do not react with each other.")),
    d(pair("terephthalsaeure", "ethanol"), "funktionalitaet-eins", T("Ethanol hat nur eine –OH-Gruppe. Nach einer Verknüpfung ist Schluss.", "Ethanol has only one –OH group. After one link it stops.")),
    amid ? d(pair("terephthalsaeure", "ethandiol"), "ester-amid", T("Säure + Alkohol ergibt einen Polyester (PET).", "Acid + alcohol gives a polyester (PET)."))
      : d(pair("adipinsaeure", "hexandiamin"), "ester-amid", T("Säure + Amin ergibt ein Polyamid (Nylon).", "Acid + amine gives a polyamide (nylon).")),
  ], {
    hint: T("Jedes Monomer braucht zwei Gruppen, die zu den Gruppen des Partners passen.", "Each monomer needs two groups that fit the partner's groups."),
    explain: amid ? T("Disäure + Diamin → **Polyamid**: Adipinsäure + Hexan-1,6-diamin = PA 6.6 (Nylon).", "Diacid + diamine → **polyamide**: adipic acid + hexane-1,6-diamine = PA 6.6 (nylon).")
      : T("Disäure + Diol → **Polyester**: Terephthalsäure + Ethandiol = PET.", "Diacid + diol → **polyester**: terephthalic acid + ethane-1,2-diol = PET."),
  });
}

const STRUKTUR = () => tr({ klein: "Nur kleine Moleküle", linear: "Lange, unverzweigte Ketten", vernetzt: "Ein Netz aus Ketten", none: "Keine Reaktion" },
  { klein: "Only small molecules", linear: "Long, unbranched chains", vernetzt: "A network of chains", none: "No reaction" });

function stopper(): Task {
  const S = STRUKTUR();
  return task(T("Was entsteht aus Terephthalsäure und **Ethanol**?", "What forms from terephthalic acid and **ethanol**?"), S.klein, [
    d(S.linear, "funktionalitaet-eins", T("Ethanol hat nur eine –OH-Gruppe. Es blockiert das Kettenende.", "Ethanol has only one –OH group. It blocks the chain end.")),
    d(S.vernetzt, "netz-funktionalitaet", T("Für ein Netz braucht ein Monomer drei Gruppen.", "A network needs a monomer with three groups.")),
    d(S.none, "gleiche-gruppen", T("–COOH und –OH reagieren – aber nur einmal je Ethanol.", "–COOH and –OH do react – but only once per ethanol.")),
  ], {
    vis: { k: "pair", a: "terephthalsaeure", b: "ethanol" },
    hint: T("Zähle die reaktiven Gruppen jedes Monomers.", "Count the reactive groups of each monomer."),
    explain: stepReact("terephthalsaeure", "ethanol").why,
  });
}

function netz(): Task {
  const S = STRUKTUR();
  // Kapitel 4 (Polykondensation): nur Disäuren – Isocyanate kommen erst in Kapitel 5
  const [a, b] = pick([["adipinsaeure", "glycerin"], ["terephthalsaeure", "glycerin"]] as const);
  return task(T(`Was entsteht aus ${stepName(a)} und **Glycerin**?`, `What forms from ${stepName(a)} and **glycerol**?`), S.vernetzt, [
    d(S.linear, "netz-funktionalitaet", T("Glycerin hat drei –OH-Gruppen. Jede kann eine Kette anknüpfen.", "Glycerol has three –OH groups. Each can attach a chain.")),
    d(S.klein, "funktionalitaet-eins", T("Beide Monomere haben mindestens zwei Gruppen – es entstehen große Moleküle.", "Both monomers have at least two groups – large molecules form.")),
    d(S.none, "gleiche-gruppen", T(`${stepName(a)} und Glycerin haben passende Gruppen.`, `${cap(stepName(a))} and glycerol have matching groups.`)),
  ], {
    vis: { k: "pair", a, b },
    hint: T("Drei reaktive Gruppen an einem Monomer verzweigen die Ketten.", "Three reactive groups on one monomer branch the chains."),
    explain: stepReact(a, b).why,
  });
}

function produkt(): Task {
  const cases: [StepId, StepId | undefined][] = [["terephthalsaeure", "ethandiol"], ["adipinsaeure", "hexandiamin"], ["milchsaeure", undefined], ["terephthalsaeure", "butandiol"], ["aminohexansaeure", undefined]];
  const [a, b] = pick(cases);
  const out = stepReact(a, b), name = out.product!.abbr;
  const all = ["PET", "PA 6.6", "PLA", "PBT", "PA 6"];
  return task(b ? T(`Welcher Kunststoff entsteht aus ${stepName(a)} und ${stepName(b)}?`, `Which plastic forms from ${stepName(a)} and ${stepName(b)}?`) : T(`Welcher Kunststoff entsteht aus ${stepName(a)} allein?`, `Which plastic forms from ${stepName(a)} alone?`), name,
    all.filter(x => x !== name).map(x => d(x, "ester-amid", PRODUCT_OF()[x])), {
      vis: b ? { k: "pair", a, b } : { k: "pair", a },
      hint: T("Säure + Alkohol → Polyester. Säure + Amin → Polyamid.", "Acid + alcohol → polyester. Acid + amine → polyamide."),
      explain: `**${out.product!.name}**: ${out.product!.uses}.`,
    });
}
const PRODUCT_OF = () => tr<Record<string, string>>(
  { PET: "PET: aus Terephthalsäure und Ethandiol.", "PA 6.6": "PA 6.6: aus Adipinsäure und Hexan-1,6-diamin.", PLA: "PLA: aus Milchsäure.", PBT: "PBT: aus Terephthalsäure und Butan-1,4-diol.", "PA 6": "PA 6: aus 6-Aminohexansäure." },
  { PET: "PET: from terephthalic acid and ethane-1,2-diol.", "PA 6.6": "PA 6.6: from adipic acid and hexane-1,6-diamine.", PLA: "PLA: from lactic acid.", PBT: "PBT: from terephthalic acid and butane-1,4-diol.", "PA 6": "PA 6: from 6-aminohexanoic acid." },
);

function abMonomer(): Task {
  const right = pick(["milchsaeure", "aminohexansaeure"] as StepId[]);
  return task(T("Welches Monomer bildet **allein** eine Kette?", "Which monomer forms a chain **on its own**?"), stepMono(right).name, [
    d(stepMono("ethandiol").name, "gleiche-gruppen", T("Ethandiol hat zweimal –OH. Gleiche Gruppen reagieren nicht.", "Ethane-1,2-diol has –OH twice. Identical groups do not react.")),
    d(stepMono("terephthalsaeure").name, "gleiche-gruppen", T("Zweimal –COOH: Es fehlt der Partner.", "Twice –COOH: the partner is missing.")),
    d(stepMono("ethanol").name, "funktionalitaet-eins", T("Ethanol hat nur eine Gruppe.", "Ethanol has only one group.")),
  ], {
    hint: T("Gesucht ist ein Monomer mit zwei **verschiedenen** Gruppen.", "Look for a monomer with two **different** groups."),
    explain: stepReact(right).why,
  });
}

function wasserZahl(): Task {
  const n = pick([3, 4, 5, 6]);
  return task(T(`${n} Monomere verknüpfen sich zu einer Kette. Wie viele Wassermoleküle werden abgespalten?`, `${n} monomers link into one chain. How many water molecules are split off?`), String(n - 1), [
    d(String(n), "verknuepfungen-gezaehlt", T(`Zwischen ${n} Monomeren liegen nur ${n - 1} Verknüpfungen.`, `Between ${n} monomers there are only ${n - 1} links.`)),
    d(String(2 * n), "byp-falsch", T("Jede Verknüpfung spaltet genau ein Wasser ab.", "Each link splits off exactly one water.")),
    d(String(n + 1), "verknuepfungen-gezaehlt", T(`Zwischen ${n} Bausteinen liegen ${n - 1} Striche, nicht ${n + 1}.`, `Between ${n} units there are ${n - 1} lines, not ${n + 1}.`)),
  ], {
    vis: { k: "beads", seq: Array.from({ length: n }, (_, i) => (i % 2 ? "ethandiol" : "terephthalsaeure")) },
    hint: T("Ein Wassermolekül je Verknüpfung (je Strich).", "One water molecule per link (per line)."),
    explain: T(`${n} Bausteine → ${n - 1} Verknüpfungen → **${n - 1} H₂O**.`, `${n} units → ${n - 1} links → **${n - 1} H₂O**.`),
  });
}

// ── Kapitel 5: Polyaddition ────────────────────────────────────────────────────

const PUR: Recipe = { art: "add", a: "hdi", b: "butandiol" };

function keinNebenprodukt(): Task {
  // drei Ansätze: HDI + Butandiol, MDI + Butandiol (Urethan), HDI + Hexandiamin (Harnstoff)
  const r = pick<Recipe>([PUR, { art: "add", a: "mdi", b: "butandiol" }, { art: "add", a: "hdi", b: "hexandiamin" }]);
  const urea = r.b === "hexandiamin";
  return task(T("Was wird bei dieser Polyaddition abgespalten?", "What is split off in this polyaddition?"), T("Nichts", "Nothing"), [
    d("H₂O", "add-wasser", T("Bei der Polyaddition bleiben alle Atome im Polymer. Nur ein H‑Atom wandert.", "In polyaddition all atoms stay in the polymer. Only an H atom moves.")),
    d("CO₂", "add-wasser", T("CO₂ entsteht nur, wenn Isocyanat mit Wasser reagiert (Schaum).", "CO₂ only forms when isocyanate reacts with water (foam).")),
    d("N₂", "add-wasser", urea ? T("Die N‑Atome bleiben in der Harnstoffgruppe –NH–CO–NH–. Es entweicht nichts.", "The N atoms stay in the urea group –NH–CO–NH–. Nothing escapes.")
      : T("Das N bleibt in der Urethangruppe –NH–CO–O–. Es entweicht nichts.", "The N stays in the urethane group –NH–CO–O–. Nothing escapes.")),
  ], {
    vis: mech(r, ["join"], arrowKey(r, ["join"])),
    hint: T("Addition heißt: zusammenfügen, ohne etwas abzugeben.", "Addition means: joining without giving anything off."),
    explain: urea ? T("**Polyaddition**: Das H der –NH₂-Gruppe wandert zum N des Isocyanats. Kein Nebenprodukt.", "**Polyaddition**: the H of the –NH₂ group moves to the N of the isocyanate. No by-product.")
      : T("**Polyaddition**: Das H der –OH-Gruppe wandert zum N. Kein Nebenprodukt.", "**Polyaddition**: the H of the –OH group moves to the N. No by-product."),
  });
}

function hWandert(): Task {
  return task(T("Welches Atom wandert vom Alkohol zum Isocyanat?", "Which atom moves from the alcohol to the isocyanate?"), T("Ein H‑Atom", "An H atom"), [
    d(T("Ein O‑Atom", "An O atom"), "h-wandert-falsch", T("Das O bleibt und bindet an das C‑Atom der N=C=O-Gruppe.", "The O stays and binds to the C atom of the N=C=O group.")),
    d(T("Ein N‑Atom", "An N atom"), "h-wandert-falsch", T("Das N gehört zum Isocyanat. Es nimmt das H auf.", "The N belongs to the isocyanate. It takes up the H.")),
    d(T("Ein C‑Atom", "A C atom"), "h-wandert-falsch", T("C‑Atome bleiben im Gerüst. Nur das H der –OH-Gruppe wechselt zum N.", "C atoms stay in the framework. Only the H of the –OH group moves to the N.")),
  ], {
    vis: mech(PUR, ["join"], arrowKey(PUR, ["join"])),
    hint: T("Folge den Pfeilen vom O–H zum N.", "Follow the arrows from O–H to N."),
    explain: T("–N=C=O + HO– → –**NH**–CO–O–: das **H‑Atom** wandert, die Urethangruppe entsteht.", "–N=C=O + HO– → –**NH**–CO–O–: the **H atom** moves, the urethane group forms."),
  });
}

function urethan(): Task {
  const amin = Math.random() < 0.4;
  const U = T("Urethangruppe", "Urethane group"), H = T("Harnstoffgruppe", "Urea group"), E = T("Esterbindung", "Ester bond"), A = T("Amidbindung", "Amide bond");
  return task(T(`Welche Gruppe entsteht aus –N=C=O und ${amin ? "–NH₂" : "–OH"}?`, `Which group forms from –N=C=O and ${amin ? "–NH₂" : "–OH"}?`), amin ? H : U, [
    d(amin ? U : H, "ester-urethan", amin ? T("Urethan entsteht mit –OH. Mit –NH₂ entsteht Harnstoff.", "Urethane forms with –OH. With –NH₂ urea forms.") : T("Harnstoff entsteht mit –NH₂. Mit –OH entsteht Urethan.", "Urea forms with –NH₂. With –OH urethane forms.")),
    d(E, "ester-urethan", T("Esterbindungen entstehen aus –COOH und –OH.", "Ester bonds form from –COOH and –OH.")),
    d(A, "ester-amid", T("Amidbindungen entstehen aus –COOH und –NH₂.", "Amide bonds form from –COOH and –NH₂.")),
  ], {
    hint: T("Isocyanat + Alkohol → Urethan. Isocyanat + Amin → Harnstoff.", "Isocyanate + alcohol → urethane. Isocyanate + amine → urea."),
    explain: amin ? T("–NH–CO–NH–: **Harnstoffgruppe** (Polyharnstoff).", "–NH–CO–NH–: **urea group** (polyurea).") : T("–NH–CO–O–: **Urethangruppe** (Polyurethan, PUR).", "–NH–CO–O–: **urethane group** (polyurethane, PUR)."),
  });
}

const ART = () => tr({ poly: "Polymerisation", kond: "Polykondensation", add: "Polyaddition" }, { poly: "Polymerisation", kond: "Polycondensation", add: "Polyaddition" });

function artWahl(): Task {
  const A = ART();
  const c = pick([
    { vis: { k: "pair", a: "hdi", b: "butandiol" } as Vis, art: "add" as const },
    { vis: { k: "pair", a: "badge", b: "hexandiamin" } as Vis, art: "add" as const },
    { vis: { k: "pair", a: "terephthalsaeure", b: "ethandiol" } as Vis, art: "kond" as const },
    { vis: { k: "pair", a: "adipinsaeure", b: "hexandiamin" } as Vis, art: "kond" as const },
    { vis: { k: "mono", id: pick(EASY) } as Vis, art: "poly" as const },
  ]);
  const WHY: Record<"poly" | "kond" | "add", string> = tr(
    { poly: "Polymerisation braucht eine C=C-Zweifachbindung im Monomer.", kond: "Polykondensation spaltet ein kleines Molekül ab (H₂O, HCl).", add: "Polyaddition verknüpft ohne Nebenprodukt – ein H‑Atom wandert." },
    { poly: "Polymerisation needs a C=C double bond in the monomer.", kond: "Polycondensation splits off a small molecule (H₂O, HCl).", add: "Polyaddition links without a by-product – an H atom moves." },
  );
  return task(T("Welche Reaktionsart passt zu diesen Monomeren?", "Which type of reaction suits these monomers?"), A[c.art],
    (["poly", "kond", "add"] as const).filter(x => x !== c.art).map(x => d(A[x], x === "poly" ? "kond-doppelbindung" : "art-verwechselt", WHY[x])), {
      vis: c.vis,
      hint: T("C=C → Polymerisation. Säure + Alkohol/Amin → Polykondensation. Isocyanat oder Epoxid → Polyaddition.", "C=C → polymerisation. Acid + alcohol/amine → polycondensation. Isocyanate or epoxide → polyaddition."),
      explain: boldLead(WHY[c.art]),
    });
}

function epoxid(): Task {
  return task(T("Epoxidharz: Was passiert mit dem Epoxidring?", "Epoxy resin: what happens to the epoxide ring?"), T("Öffnet sich, bindet an N", "Opens, binds to N"), [
    d(T("Spaltet Wasser ab", "Splits off water"), "add-wasser", T("Beim Öffnen des Rings wird nichts abgespalten. Ein H wandert zum O.", "Nothing is split off when the ring opens. An H moves to the O.")),
    d(T("Bleibt unverändert", "Stays unchanged"), "art-verwechselt", T("Der gespannte Dreierring ist die reaktive Stelle.", "The strained three-membered ring is the reactive site.")),
    d(T("Wird zur Zweifachbindung", "Becomes a double bond"), "kond-doppelbindung", T("Der Ring öffnet sich zu Einfachbindungen. Das O wird zur –OH-Gruppe.", "The ring opens into single bonds. The O becomes an –OH group.")),
  ], {
    vis: { k: "pair", a: "badge", b: "hexandiamin" },
    hint: T("Der Dreierring aus C, C und O steht unter Spannung.", "The three-membered ring of C, C and O is strained."),
    explain: T("Das N greift ein C‑Atom des Rings an. Der Ring **öffnet** sich, das H wandert zum O: –CH(OH)–CH₂–NH–.", "The N attacks a C atom of the ring. The ring **opens** and the H moves to the O: –CH(OH)–CH₂–NH–."),
  });
}

function epoxidNetz(): Task {
  return task(T("Warum wird Epoxidharz hart und schmilzt nicht mehr?", "Why does epoxy resin become hard and no longer melt?"), T("Ketten bilden ein Netz", "Chains form a network"), [
    d(T("Wasser verdunstet", "Water evaporates"), "add-wasser", T("Es entsteht kein Wasser – alle Atome bleiben im Harz.", "No water forms – all atoms stay in the resin.")),
    d(T("Ketten sind nur sehr lang", "Chains are just very long"), "netz-funktionalitaet", T("Lange einzelne Ketten würden beim Erwärmen weich. Erst das Netz macht hart.", "Long separate chains would soften on heating. Only the network makes it hard.")),
    d(T("Es kühlt stark ab", "It cools down a lot"), "netz-schmilzt", T("Abkühlen macht nur Thermoplaste fest. Epoxidharz härtet durch die Reaktion – auch warm.", "Cooling only sets thermoplastics. Epoxy resin hardens through the reaction – even when warm.")),
  ], {
    vis: { k: "struct", s: "duro" },
    hint: T("Jede –NH₂-Gruppe hat zwei H‑Atome und reagiert zweimal.", "Each –NH₂ group has two H atoms and reacts twice."),
    explain: T("Diamin mit 4 N–H + Diepoxid → **Netz**: ein Duroplast, z. B. Zweikomponentenkleber.", "Diamine with 4 N–H + diepoxide → **network**: a thermoset, e.g. two-component adhesive."),
  });
}

// ── Kapitel 6: Struktur und Eigenschaften ──────────────────────────────────────

const KL = () => tr({ thermo: "Thermoplast", elast: "Elastomer", duro: "Duroplast" }, { thermo: "Thermoplastic", elast: "Elastomer", duro: "Thermoset" });
const KL_WHY = () => tr(
  { thermo: "Thermoplast: einzelne Ketten – beim Erwärmen weich und formbar.", elast: "Elastomer: wenige Brücken – dehnbar und springt zurück.", duro: "Duroplast: dichtes Netz – hart, schmilzt nicht." },
  { thermo: "Thermoplastic: separate chains – soft and shapeable when heated.", elast: "Elastomer: a few bridges – stretchy and springs back.", duro: "Thermoset: dense network – hard, does not melt." },
);

function klasse(): Task {
  const k = pick(["thermo", "elast", "duro"] as const);
  const K = KL(), W = KL_WHY();
  return task(T("Welche Kunststoffart zeigt das Bild?", "Which type of plastic does the picture show?"), K[k],
    (["thermo", "elast", "duro"] as const).filter(x => x !== k).map(x => d(K[x], x === "duro" ? "netz-schmilzt" : "elast-thermo", W[x])), {
      vis: { k: "struct", s: k as StructKind },
      hint: T("Achte auf die Brücken zwischen den Ketten: keine, wenige oder sehr viele.", "Look at the bridges between the chains: none, a few or very many."),
      explain: boldLead(W[k]),
    });
}

function schmelzen(): Task {
  const K = KL();
  return task(T("Welche Kunststoffe kann man einschmelzen und neu formen?", "Which plastics can be melted down and reshaped?"), K.thermo, [
    d(K.duro, "netz-schmilzt", T("Das Netz hält fest zusammen. Beim Erhitzen zersetzt sich ein Duroplast.", "The network holds together. On heating a thermoset decomposes.")),
    d(K.elast, "elast-thermo", T("Die Brücken verhindern das Schmelzen – Gummi lässt sich nicht einschmelzen.", "The bridges prevent melting – rubber cannot be melted down.")),
  ], {
    hint: T("Nur einzelne Ketten können aneinander vorbeigleiten.", "Only separate chains can slide past each other."),
    explain: T("**Thermoplaste** (PE, PP, PET …) werden beim Erwärmen weich – gut für Recycling.", "**Thermoplastics** (PE, PP, PET …) soften on heating – good for recycling."),
  });
}

const COPO = () => tr({ stat: "Statistisches Copolymer", block: "Blockcopolymer", alt: "Alternierendes Copolymer" }, { stat: "Statistical copolymer", block: "Block copolymer", alt: "Alternating copolymer" });

function copolymer(): Task {
  const kind = pick(["stat", "block", "alt"] as const);
  const [a, b] = pick([["styrol", "butadien"], ["ethen", "propen"], ["styrol", "acrylnitril"]] as [VinylId, VinylId][]);
  const n = 10;
  const seq = kind === "block" ? [...Array(5).fill(a), ...Array(5).fill(b)]
    : kind === "alt" ? Array.from({ length: n }, (_, i) => (i % 2 ? b : a))
    : [a, a, b, a, b, b, b, a, b, a];
  const C = COPO();
  const WHY: Record<string, string> = tr(
    { stat: "Statistisch: die Monomere folgen zufällig aufeinander.", block: "Block: erst viele gleiche, dann viele andere.", alt: "Alternierend: immer abwechselnd." },
    { stat: "Statistical: the monomers follow in random order.", block: "Block: first many of one, then many of the other.", alt: "Alternating: always taking turns." },
  );
  return task(T("Welches Copolymer zeigt die Kügelchen-Kette?", "Which copolymer does the bead chain show?"), C[kind],
    (["stat", "block", "alt"] as const).filter(x => x !== kind).map(x => d(C[x], "copo-verwechselt", WHY[x])), {
      vis: { k: "beads", seq },
      hint: T("Sieh dir die Reihenfolge der Farben an.", "Look at the order of the colours."),
      explain: boldLead(WHY[kind]),
    });
}

/** Antworten sind Bilder: Gefäß mit Kügelchen (nur Monomer, wenige lange Ketten + Monomer, viele kurze Ketten, ein Riesenmolekül) */
function wachstum(): Task {
  const kette = Math.random() < 0.5;
  const seq = kette ? ["styrol"] : ["terephthalsaeure", "ethandiol"];
  const LONG = T("Wenige lange Ketten + viel Monomer", "Few long chains + lots of monomer"), SHORT = T("Viele kurze Ketten, kaum Monomer", "Many short chains, little monomer");
  const MONO = T("Nur Monomer, keine Ketten", "Only monomer, no chains"), GIANT = T("Ein Riesenmolekül", "One giant molecule");
  const pics: Record<string, Vis> = { [LONG]: { k: "pot", s: "long", seq }, [SHORT]: { k: "pot", s: "short", seq }, [MONO]: { k: "pot", s: "mono", seq }, [GIANT]: { k: "pot", s: "giant", seq } };
  return task(kette ? T("Radikalische Polymerisation, kurz nach dem Start: Was ist im Gefäß?", "Radical polymerisation, shortly after the start: what is in the vessel?")
    : T("Polykondensation bei 90 % Umsatz: Was ist im Gefäß?", "Polycondensation at 90 % conversion: what is in the vessel?"), kette ? LONG : SHORT, [
    kette ? d(SHORT, "kette-spaet", T("So sieht Stufenwachstum aus. Hier wachsen wenige Ketten sehr schnell.", "That is what step growth looks like. Here a few chains grow very fast."))
      : d(LONG, "kette-sofort", T("Beim Stufenwachstum reagieren alle Moleküle. Bei 90 % Umsatz ist kaum noch Monomer übrig.", "In step growth all molecules react. At 90 % conversion hardly any monomer is left.")),
    d(MONO, kette ? "kette-spaet" : "kette-sofort", T("Die Reaktion läuft schon – es sind bereits Ketten entstanden.", "The reaction is already running – chains have already formed.")),
    d(GIANT, kette ? "kette-spaet" : "kette-sofort", kette ? T("So weit ist es noch nicht – es gibt noch viele einzelne Moleküle.", "It is not that far yet – there are still many separate molecules.")
      : T("So weit ist es noch nicht – lange Ketten entstehen erst bei fast 100 % Umsatz.", "Not that far yet – long chains only form at almost 100 % conversion.")),
  ], {
    pics,
    hint: T("Kettenwachstum: nur aktive Enden wachsen. Stufenwachstum: jede Gruppe reagiert.", "Chain growth: only active ends grow. Step growth: every group reacts."),
    explain: kette ? T("**Kettenwachstum**: Wenige aktive Ketten wachsen schnell. Freies Monomer bleibt lange übrig.", "**Chain growth**: few active chains grow fast. Free monomer is left for a long time.")
      : T("**Stufenwachstum**: Bei 90 % Umsatz sind die Ketten im Mittel erst 10 Bausteine lang. Lange Ketten erst ganz am Ende.", "**Step growth**: at 90 % conversion chains are only 10 units long on average. Long chains only at the very end."),
  });
}

function klasseAlltag(): Task {
  const K = KL(), W = KL_WHY();
  const c = pick([
    { item: T("ein Topfgriff aus Phenoplast", "a pan handle made of phenolic resin"), k: "duro" as const },
    { item: T("ein Autoreifen", "a car tyre"), k: "elast" as const },
    { item: T("eine PET-Flasche", "a PET bottle"), k: "thermo" as const },
    { item: T("ein Gummiband", "a rubber band"), k: "elast" as const },
    { item: T("eine Arbeitsplatte aus Melaminharz", "a worktop made of melamine resin"), k: "duro" as const },
    { item: T("eine Plastiktüte aus PE", "a plastic bag made of PE"), k: "thermo" as const },
  ]);
  return task(T(`Zu welcher Kunststoffart gehört ${c.item}?`, `Which type of plastic is ${c.item}?`), K[c.k],
    (["thermo", "elast", "duro"] as const).filter(x => x !== c.k).map(x => d(K[x], x === "thermo" && c.k === "duro" ? "netz-schmilzt" : "elast-thermo", W[x])), {
      hint: T("Wird es heiß, muss es formstabil sein? Soll es sich dehnen? Oder schmelzbar sein?", "Must it keep its shape when hot? Should it stretch? Or should it melt?"),
      explain: boldLead(W[c.k]),
    });
}

function recycling(): Task {
  const c = pick([["PET", "1"], ["PE-HD", "2"], ["PVC", "3"], ["PE-LD", "4"], ["PP", "5"], ["PS", "6"]] as [string, string][]);
  const codes = ["1", "2", "3", "4", "5", "6"];
  const NAME: Record<string, string> = { "1": "PET", "2": "PE-HD", "3": "PVC", "4": "PE-LD", "5": "PP", "6": "PS" };
  return task(T(`Welcher Recycling-Code steht auf **${c[0]}**?`, `Which recycling code is printed on **${c[0]}**?`), c[1],
    shuffle(codes.filter(x => x !== c[1])).slice(0, 3).map(x => d(x, "name-verwechselt", T(`Code ${x} steht für ${NAME[x]}.`, `Code ${x} stands for ${NAME[x]}.`))), {
      hint: T("1 PET, 2 PE-HD, 3 PVC, 4 PE-LD, 5 PP, 6 PS.", "1 PET, 2 PE-HD, 3 PVC, 4 PE-LD, 5 PP, 6 PS."),
      explain: T(`Im Dreieck steht **${c[1]}** für ${c[0]}. So lassen sich Kunststoffe sortieren.`, `In the triangle **${c[1]}** stands for ${c[0]}. This lets plastics be sorted.`),
    });
}

// ── Level und Runden ─────────────────────────────────────────────────────────

const GENS: Record<string, () => Task> = {
  polyName, monomerVon, baustein, doppelbindung, nBedeutung, kugelZaehlen, bausteinWahl, kunststoffAlltag,
  schritt, radikal, pfeil, startBruch, wohinRadikal, abbruchArt, starterRest, mehrStarter,
  katalysator, freieStelle, zieglerGift, taktisch, taktischVerfahren, hdpe, lebend, kationisch, verfahrenWahl,
  gruppen, nebenprodukt, bindungArt, chlorid, paarWahl, stopper, netz, produkt, abMonomer, wasserZahl,
  keinNebenprodukt, hWandert, urethan, artWahl, epoxid, epoxidNetz,
  klasse, schmelzen, copolymer, wachstum, klasseAlltag, recycling,
};

export const TYPE_NAMES: Record<string, string> = tr({
  polyName: "Polymer zum Monomer", monomerVon: "Monomer zum Polymer", baustein: "Monomer in der Kette", doppelbindung: "Zweifachbindung erkennen",
  nBedeutung: "Klammer und n", kugelZaehlen: "Bausteine zählen", bausteinWahl: "Baustein wählen", kunststoffAlltag: "Kunststoffe im Alltag",
  schritt: "Start, Wachstum, Abbruch", radikal: "Radikal", pfeil: "Halber Pfeil", startBruch: "Zerfall des Starters", wohinRadikal: "Radikal am Kettenende",
  abbruchArt: "Art des Abbruchs", starterRest: "Starter in der Kette", mehrStarter: "Starter und Kettenlänge",
  katalysator: "Katalysator oder Starter", freieStelle: "Freie Stelle am Titan", zieglerGift: "Vergiftung am Titan", taktisch: "Taktizität",
  taktischVerfahren: "Geordnete Ketten", hdpe: "PE-HD und PE-LD", lebend: "Lebende Ketten", kationisch: "Kationische Polymerisation", verfahrenWahl: "Verfahren wählen",
  gruppen: "Reagierende Gruppen", nebenprodukt: "Abgespaltenes Molekül", bindungArt: "Ester oder Amid", chlorid: "Säurechlorid", paarWahl: "Monomer-Paar wählen",
  stopper: "Kettenstopper", netz: "Netz durch drei Gruppen", produkt: "Kunststoff zum Monomer-Paar", abMonomer: "Monomer mit zwei Gruppen", wasserZahl: "Wasser zählen",
  keinNebenprodukt: "Ohne Nebenprodukt", hWandert: "Wanderndes H‑Atom", urethan: "Urethan und Harnstoff", artWahl: "Reaktionsart erkennen",
  epoxid: "Epoxidring", epoxidNetz: "Epoxidharz härtet",
  klasse: "Thermoplast, Elastomer, Duroplast", schmelzen: "Einschmelzen", copolymer: "Copolymere", wachstum: "Ketten- und Stufenwachstum",
  klasseAlltag: "Kunststoffart im Alltag", recycling: "Recycling-Code",
}, {
  polyName: "Polymer from monomer", monomerVon: "Monomer from polymer", baustein: "Monomer in the chain", doppelbindung: "Spotting the double bond",
  nBedeutung: "Bracket and n", kugelZaehlen: "Counting units", bausteinWahl: "Choosing the unit", kunststoffAlltag: "Plastics in everyday life",
  schritt: "Initiation, growth, termination", radikal: "Radical", pfeil: "Half arrow", startBruch: "Initiator splitting", wohinRadikal: "Radical at the chain end",
  abbruchArt: "Type of termination", starterRest: "Initiator in the chain", mehrStarter: "Initiator and chain length",
  katalysator: "Catalyst or initiator", freieStelle: "Free site on titanium", zieglerGift: "Poisoning at titanium", taktisch: "Tacticity",
  taktischVerfahren: "Ordered chains", hdpe: "PE-HD and PE-LD", lebend: "Living chains", kationisch: "Cationic polymerisation", verfahrenWahl: "Choosing a method",
  gruppen: "Reacting groups", nebenprodukt: "Molecule split off", bindungArt: "Ester or amide", chlorid: "Acid chloride", paarWahl: "Choosing a monomer pair",
  stopper: "Chain stopper", netz: "Network from three groups", produkt: "Plastic from a monomer pair", abMonomer: "Monomer with two groups", wasserZahl: "Counting water",
  keinNebenprodukt: "No by-product", hWandert: "Moving H atom", urethan: "Urethane and urea", artWahl: "Recognising the reaction type",
  epoxid: "Epoxide ring", epoxidNetz: "Epoxy resin hardens",
  klasse: "Thermoplastic, elastomer, thermoset", schmelzen: "Melting down", copolymer: "Copolymers", wachstum: "Chain and step growth",
  klasseAlltag: "Type of plastic in everyday life", recycling: "Recycling code",
});

/** `seq`: feste Reihenfolge der zehn Aufgaben, `leads`: Merksatz je Aufgabe */
interface Level extends QuizLevel { types: string[]; seq: string[]; leads: string[] }
type Step = [type: string, lead: string];

const K1: Step[] = tr([
  ["polyName", "Ein **Polymer** ist ein Riesenmolekül aus vielen kleinen Bausteinen, den **Monomeren**."],
  ["doppelbindung", "Monomere der Polymerisation haben eine **C=C-Zweifachbindung**."],
  ["bausteinWahl", "In der Kette ist aus C=C eine Einfachbindung geworden. Die Seitengruppe bleibt."],
  ["nBedeutung", "Die Formel zeigt **einen Baustein** in eckigen Klammern. Das n heißt: sehr oft."],
  ["kugelZaehlen", "Im **Kügelchenmodell** ist jeder Baustein ein Kügelchen."],
  ["baustein", "Aus der Kette zurück zum Monomer: Baustein abschneiden, C=C wieder einsetzen."],
  ["monomerVon", "Der Name verrät das Monomer: **Poly** + Name des Monomers."],
  ["polyName", "Die Seitengruppe an der Zweifachbindung unterscheidet die Monomere."],
  ["kunststoffAlltag", "Kunststoffe sind Polymere – oft mit Kurzzeichen wie PE, PP, PS, PVC."],
  ["baustein", "Zum Schluss: Kette lesen, Baustein finden, Monomer nennen."],
], [
  ["polyName", "A **polymer** is a giant molecule made of many small building blocks, the **monomers**."],
  ["doppelbindung", "Monomers for polymerisation have a **C=C double bond**."],
  ["bausteinWahl", "In the chain C=C has become a single bond. The side group stays."],
  ["nBedeutung", "The formula shows **one unit** in square brackets. The n means: very often."],
  ["kugelZaehlen", "In the **bead model** each unit is one bead."],
  ["baustein", "From the chain back to the monomer: cut out a unit, put the C=C back."],
  ["monomerVon", "The name gives away the monomer: **poly** + name of the monomer."],
  ["polyName", "The side group on the double bond tells the monomers apart."],
  ["kunststoffAlltag", "Plastics are polymers – often with short codes such as PE, PP, PS, PVC."],
  ["baustein", "Finally: read the chain, find the unit, name the monomer."],
]);
const K2: Step[] = tr([
  ["radikal", "Ein **Radikal** hat ein **ungepaartes Elektron** (Punkt). Es ist sehr reaktiv."],
  ["startBruch", "**Start**: Beim Erwärmen bricht die O–O-Bindung des Starters gleichmäßig."],
  ["pfeil", "Ein **halber Pfeil** zeigt, wohin **ein** Elektron wandert."],
  ["wohinRadikal", "**Kettenwachstum**: Das Radikal greift C=C an – am neuen Ende sitzt wieder ein Radikal."],
  ["schritt", "Start, Wachstum, Abbruch: Die Pfeile zeigen, welcher Schritt es ist."],
  ["abbruchArt", "**Abbruch**: Zwei Radikale treffen sich – Rekombination oder Disproportionierung."],
  ["starterRest", "Der Starter wird verbraucht: Sein Bruchstück sitzt am Kettenanfang."],
  ["abbruchArt", "Rekombination verbindet die Enden. Bei der Disproportionierung wandert ein H‑Atom."],
  ["mehrStarter", "Jedes Radikal startet eine Kette – Starter und Monomer bestimmen die Kettenlänge."],
  ["schritt", "Zum Schluss alle drei Schritte noch einmal."],
], [
  ["radikal", "A **radical** has an **unpaired electron** (dot). It is very reactive."],
  ["startBruch", "**Initiation**: on heating, the O–O bond of the initiator breaks evenly."],
  ["pfeil", "A **half arrow** shows where **one** electron moves."],
  ["wohinRadikal", "**Chain growth**: the radical attacks C=C – the new end is a radical again."],
  ["schritt", "Initiation, growth, termination: the arrows show which step it is."],
  ["abbruchArt", "**Termination**: two radicals meet – combination or disproportionation."],
  ["starterRest", "The initiator is used up: its fragment sits at the start of the chain."],
  ["abbruchArt", "Combination joins the ends. In disproportionation an H atom moves."],
  ["mehrStarter", "Each radical starts a chain – initiator and monomer decide the chain length."],
  ["schritt", "Finally all three steps once more."],
]);
const K3: Step[] = tr([
  ["katalysator", "Ein **Katalysator** wird nicht verbraucht. Am Titan wachsen nacheinander viele Ketten."],
  ["freieStelle", "Am Titan gibt es eine **freie Stelle**. Dort lagert sich das Monomer an."],
  ["zieglerGift", "Polare Monomere binden mit O, N, Cl oder F an das Titan: Der Katalysator ist **vergiftet**."],
  ["taktisch", "**Isotaktisch**: alle Seitengruppen auf einer Seite. **Ataktisch**: zufällig."],
  ["taktischVerfahren", "Am Titan wird jedes Monomer gleich herum eingebaut – die Kette wird geordnet."],
  ["hdpe", "Ziegler-Natta: **unverzweigtes** PE-HD. Radikalisch unter hohem Druck: **verzweigtes** PE-LD."],
  ["lebend", "**Anionisch** (Butyllithium): Die Ketten **leben** weiter, bis Methanol sie beendet."],
  ["kationisch", "**Kationisch** (BF₃ und Wasser): CH₃-Gruppen stabilisieren die positive Ladung."],
  ["verfahrenWahl", "Jedes Monomer braucht das passende Verfahren."],
  ["zieglerGift", "Zum Schluss: Wer vergiftet das Titan – und warum?"],
], [
  ["katalysator", "A **catalyst** is not used up. Many chains grow one after another at the titanium."],
  ["freieStelle", "The titanium has a **free site**. The monomer attaches there."],
  ["zieglerGift", "Polar monomers bind to the titanium with O, N, Cl or F: the catalyst is **poisoned**."],
  ["taktisch", "**Isotactic**: all side groups on one side. **Atactic**: random."],
  ["taktischVerfahren", "At the titanium each monomer is inserted the same way round – the chain becomes ordered."],
  ["hdpe", "Ziegler–Natta: **unbranched** PE-HD. Radical at high pressure: **branched** PE-LD."],
  ["lebend", "**Anionic** (butyllithium): the chains **stay alive** until methanol stops them."],
  ["kationisch", "**Cationic** (BF₃ and water): CH₃ groups stabilise the positive charge."],
  ["verfahrenWahl", "Each monomer needs the right method."],
  ["zieglerGift", "Finally: what poisons the titanium – and why?"],
]);
const K4: Step[] = tr([
  ["gruppen", "Bei der **Polykondensation** reagieren **funktionelle Gruppen**, z. B. –COOH mit –OH."],
  ["nebenprodukt", "Dabei wird ein kleines Molekül **abgespalten** – meist Wasser."],
  ["bindungArt", "Säure + Alkohol → **Esterbindung**. Säure + Amin → **Amidbindung**."],
  ["wasserZahl", "Jede Verknüpfung spaltet genau ein Molekül ab."],
  ["chlorid", "Mit **Säurechloriden** (–COCl) wird statt Wasser HCl abgespalten."],
  ["paarWahl", "Für lange Ketten braucht **jedes** Monomer **zwei** passende Gruppen."],
  ["stopper", "Ein Monomer mit **nur einer** Gruppe beendet die Kette."],
  ["netz", "**Drei** reaktive Gruppen (Glycerin) verknüpfen die Ketten zu einem **Netz**."],
  ["abMonomer", "Zwei **verschiedene** Gruppen in einem Monomer: Es reagiert mit sich selbst."],
  ["produkt", "PET ist ein Polyester, Nylon ein Polyamid."],
], [
  ["gruppen", "In **polycondensation** **functional groups** react, e.g. –COOH with –OH."],
  ["nebenprodukt", "A small molecule is **split off** – usually water."],
  ["bindungArt", "Acid + alcohol → **ester bond**. Acid + amine → **amide bond**."],
  ["wasserZahl", "Each link splits off exactly one molecule."],
  ["chlorid", "With **acid chlorides** (–COCl), HCl is split off instead of water."],
  ["paarWahl", "For long chains **each** monomer needs **two** matching groups."],
  ["stopper", "A monomer with **only one** group ends the chain."],
  ["netz", "**Three** reactive groups (glycerol) link the chains into a **network**."],
  ["abMonomer", "Two **different** groups in one monomer: it reacts with itself."],
  ["produkt", "PET is a polyester, nylon a polyamide."],
]);
const K5: Step[] = tr([
  ["keinNebenprodukt", "Bei der **Polyaddition** wird **nichts** abgespalten."],
  ["hWandert", "Ein **H‑Atom wandert** von der –OH-Gruppe zum N‑Atom des Isocyanats."],
  ["urethan", "Isocyanat + Alkohol → **Urethangruppe**: Polyurethan (PUR)."],
  ["urethan", "Isocyanat + Amin → **Harnstoffgruppe**: Polyharnstoff."],
  ["artWahl", "Polymerisation (C=C), Polykondensation (+ kleines Molekül), Polyaddition (ohne)."],
  ["epoxid", "**Epoxidharz**: Der gespannte Ring öffnet sich und bindet an die Aminogruppe."],
  ["epoxidNetz", "Jede –NH₂-Gruppe reagiert zweimal – das Harz wird zum **Netz**."],
  ["artWahl", "Noch einmal: Welche Reaktionsart passt?"],
  ["keinNebenprodukt", "Ohne Nebenprodukt bleiben alle Atome im Polymer."],
  ["artWahl", "Zum Schluss: drei Reaktionsarten unterscheiden."],
], [
  ["keinNebenprodukt", "In **polyaddition** **nothing** is split off."],
  ["hWandert", "An **H atom moves** from the –OH group to the N atom of the isocyanate."],
  ["urethan", "Isocyanate + alcohol → **urethane group**: polyurethane (PUR)."],
  ["urethan", "Isocyanate + amine → **urea group**: polyurea."],
  ["artWahl", "Polymerisation (C=C), polycondensation (+ small molecule), polyaddition (without)."],
  ["epoxid", "**Epoxy resin**: the strained ring opens and binds to the amino group."],
  ["epoxidNetz", "Each –NH₂ group reacts twice – the resin becomes a **network**."],
  ["artWahl", "Once more: which type of reaction fits?"],
  ["keinNebenprodukt", "Without a by-product all atoms stay in the polymer."],
  ["artWahl", "Finally: tell the three reaction types apart."],
]);
const K6: Step[] = tr([
  ["klasse", "**Thermoplaste**: einzelne Ketten – beim Erwärmen weich und formbar."],
  ["klasse", "**Elastomere**: wenige Brücken – dehnbar, springen zurück. **Duroplaste**: dichtes Netz – hart."],
  ["schmelzen", "Nur Thermoplaste lassen sich einschmelzen und neu formen."],
  ["klasseAlltag", "Im Alltag: Was muss der Kunststoff aushalten?"],
  ["copolymer", "**Copolymere** enthalten zwei Monomere: zufällig, abwechselnd oder in Blöcken."],
  ["copolymer", "Die Kügelchen-Farben zeigen die Reihenfolge."],
  ["wachstum", "**Kettenwachstum**: lange Ketten sofort. **Stufenwachstum**: lange Ketten erst am Ende."],
  ["wachstum", "Noch einmal: Kettenwachstum oder Stufenwachstum?"],
  ["recycling", "Recycling-Codes im Dreieck: Die Zahl steht für den Kunststoff."],
  ["klasseAlltag", "Zum Schluss: Kunststoffart und Aufbau verbinden."],
], [
  ["klasse", "**Thermoplastics**: separate chains – soft and shapeable when heated."],
  ["klasse", "**Elastomers**: a few bridges – stretchy, spring back. **Thermosets**: dense network – hard."],
  ["schmelzen", "Only thermoplastics can be melted down and reshaped."],
  ["klasseAlltag", "In everyday life: what does the plastic have to withstand?"],
  ["copolymer", "**Copolymers** contain two monomers: random, alternating or in blocks."],
  ["copolymer", "The bead colours show the order."],
  ["wachstum", "**Chain growth**: long chains at once. **Step growth**: long chains only at the end."],
  ["wachstum", "Once more: chain growth or step growth?"],
  ["recycling", "Recycling codes in the triangle: the number stands for the plastic."],
  ["klasseAlltag", "Finally: connect type of plastic and structure."],
]);

const level = (n: number, name: string, desc: string, steps: Step[]): Level => {
  const seq = steps.map(([t]) => t);
  return { id: `pm-k${n}`, name, desc, seq, leads: steps.map(([, l]) => l), tip: true, types: [...new Set(seq)] };
};
export const LEVELS: Level[] = [
  level(1, tr("Monomere und Polymere", "Monomers and polymers"), tr("Zweifachbindung, Baustein, Name, Kügelchenmodell", "Double bond, unit, name, bead model"), K1),
  level(2, tr("Radikalische Polymerisation", "Radical polymerisation"), tr("Radikal, Start, Kettenwachstum, Abbruch", "Radical, initiation, chain growth, termination"), K2),
  level(3, tr("Katalysatoren und Verfahren", "Catalysts and methods"), tr("Ziegler-Natta, anionisch, kationisch, Taktizität", "Ziegler–Natta, anionic, cationic, tacticity"), K3),
  level(4, tr("Polykondensation", "Polycondensation"), tr("Funktionelle Gruppen, Wasser abspalten, Ester, Amid, Netz", "Functional groups, splitting off water, ester, amide, network"), K4),
  level(5, tr("Polyaddition", "Polyaddition"), tr("Urethan, Harnstoff, Epoxidharz – ohne Nebenprodukt", "Urethane, urea, epoxy resin – without a by-product"), K5),
  level(6, tr("Struktur und Eigenschaften", "Structure and properties"), tr("Thermoplast, Elastomer, Duroplast, Copolymere", "Thermoplastic, elastomer, thermoset, copolymers"), K6),
];

export const levelId = (_stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[level].id : `pm-${level}`);
export const levelName = (level: LevelKey) =>
  level === "mix" ? tr("Alles gemischt", "Everything mixed") : level === "weak" ? tr("Schwächen üben", "Practise weak spots") : level === "due" ? tr("Heute fällig", "Due today")
    : LEVELS[level].name;

/** Tipp: zugeschnitten und hervorgehoben */
function withHint(t: Task, cue: boolean): Task {
  const { tip, ...rest } = t;
  return cue && tip ? { ...rest, hint: tip, hintCue: true } : rest;
}

/** Aufgaben in fester Reihenfolge, keine Frage doppelt (gleicher Typ → anderes Beispiel) */
function ordered(seq: string[], leads: string[]): Task[] {
  const seen = new Set<string>();
  // gleiche Frage auch bei anderer Reihenfolge der Antworten
  const sig = (t: Task) => t.prompt + [...t.options].sort().join("|") + JSON.stringify(t.vis ?? null);
  return seq.map((id, i) => {
    let t = GENS[id]();
    for (let k = 0; k < 30 && seen.has(sig(t)); k++) t = GENS[id]();
    seen.add(sig(t));
    return { ...withHint(t, true), type: id, ...(leads[i] ? { lead: leads[i] } : {}) };
  });
}

export function makeRound(_stufe: string, level: LevelKey, stats?: TypeStats, due: string[] = []): Task[] {
  if (typeof level === "number") return ordered(LEVELS[level].seq, LEVELS[level].leads);
  let ids = level === "mix" ? [...new Set(LEVELS.flatMap(l => l.types))]
    : level === "weak" ? weakTypes(stats, id => LEVELS.some(l => l.types.includes(id)))
    : level === "due" ? due.filter(id => GENS[id])
    : LEVELS[0].types;
  if (!ids.length) ids = LEVELS[0].types;
  return buildRound(ids, GENS, 10).map(t => withHint(t, false));
}

/** für Tests: alle Generatoren */
export const GENERATORS = GENS;
