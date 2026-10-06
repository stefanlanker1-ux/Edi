// Aufgaben zu Polymeren (reine Daten, damit Runden gespeichert werden können). Aufgabentyp = Fertigkeit.
// Alle Aufgaben sind Auswahl-Aufgaben, meist mit Bild (Strukturformel, Kettenausschnitt, Mechanismus-Schritt mit Pfeilen,
// Kügelchen-Kette, Kettenbild); manche Antworten sind selbst Bilder (`pics`, Schlüssel = Antworttext).
// Jede falsche Antwort steht für eine Fehlvorstellung (misconceptions.ts): d(text, schlüssel, rückmeldung).

import { tr } from "@lern/i18n";
import { buildRound, d, mc, pick, shuffle, type BaseTask, type Distractor, type LevelKey, type McTask, type QuizLevel, type Trap, type TypeStats } from "@lern/quiz";
import { METHODS, method, monoName, stepMono, vinyl, type Hue, type MethodId, type StepId, type VinylId } from "../chem/data.ts";
import { compat, methodsFor, stepReact } from "../chem/rules.ts";
import { replay } from "../chem/mech/index.ts";
import type { Recipe } from "../chem/mech/types.ts";
import { visText, type StructKind, type Tact, type Vis } from "./visual.tsx";
import { tapAfter, tapFrame, visibleAtoms, type TapScene } from "./tap.ts";

/** `vis`: Bild der Aufgabe; `pics`: Bilder als Antworten; `tip`: auf die Aufgabe zugeschnittener Tipp */
type Extra = { vis?: Vis; pics?: Record<string, Vis>; tip?: string };
/** Antippen im Bild: `parts` = antippbare Atome (Kennungen), `answer` = richtige Atome; `mode` multi = genau diese Menge, pair = zwei benachbarte
 *  Teile (Reihenfolge von `parts`). Gemeldet: einzeln `pick` (Index), mehrere `n`, `wrong` (erstes falsches Teil, sonst −1), `adj` (benachbart). */
export type TapTask = BaseTask & Extra & { kind: "tap"; scene: TapScene; parts: string[]; labels: string[]; answer: string[]; mode?: "multi" | "pair" | "any"; halos?: boolean;
  /** Ausschnitt nur um die antippbaren Teile (große Atome) und `zoomWith`, Rest am Rand ausgeblendet */
  zoom?: boolean; zoomWith?: string[];
  /** Ausschnitt nur um diese Atome (statt um alle antippbaren Teile) */
  zoomTo?: string[];
  /** Lösung in Worten (statt Nummern, die im Bild nicht stehen) */
  sol: string;
  /** gleichwertige Teile: Teil → Teil der Lösung, das es ersetzen darf (z. B. die zwei H am selben N) */
  same?: Record<string, string> };
/** Ordnen: `cards` = Bilder in der gezeigten Reihenfolge, `correct` = Kartenindizes in der richtigen Reihenfolge, `names` = Name je Karte (nach der Antwort).
 *  Gemeldet: `startFirst`, `termLast`, `addsOk` (je 1 = stimmt). */
export type OrderTask = BaseTask & Extra & { kind: "order"; cards: Vis[]; names: string[]; correct: number[]; sol: string };
/** Kette bauen: `pool` = Vorrat (Kügelchen mit Name und Formel, `ok` = einbaubar), `n` Plätze, `goal` = gesuchter Aufbau; `example` = eine richtige Kette.
 *  Gemeldet: `pat` (Muster, siehe `PAT`). */
export type BuildItem = { id: string; name: string; struct: string; hue: Hue; letter: string; ok: boolean };
export type BuildTask = BaseTask & Extra & { kind: "build"; pool: BuildItem[]; n: number; goal: "homo" | "block" | "alt" | "stat"; example: string[]; sol: string };
export type Task = (McTask & Extra) | TapTask | OrderTask | BuildTask;
export const isTap = (t: Task): t is TapTask => t.kind === "tap";
export const isOrder = (t: Task): t is OrderTask => t.kind === "order";
export const isBuild = (t: Task): t is BuildTask => t.kind === "build";

/** Muster einer gebauten Kette: 0 richtig (nur bei homo), 1 Block, 2 abwechselnd, 3 zufällig, 4 nur ein Monomer, 5 nicht einbaubares Molekül dabei,
 *  6 fast nur ein Monomer (das andere weniger als 3 von 8) */
export const PAT = { ok: 0, block: 1, alt: 2, stat: 3, one: 4, sat: 5, few: 6 } as const;
export function buildPattern(t: BuildTask, seq: string[]): number {
  const bad = new Set(t.pool.filter(p => !p.ok).map(p => p.id));
  if (seq.some(x => bad.has(x))) return PAT.sat;
  if (t.goal === "homo") return PAT.ok;
  if (new Set(seq).size < 2) return PAT.one;
  const runs: number[] = [];
  seq.forEach((x, i) => (i && x === seq[i - 1] ? runs[runs.length - 1]++ : runs.push(1)));
  if (runs.every(r => r === 1)) return PAT.alt;
  // Blöcke: höchstens drei Abschnitte (Zwei- oder Dreiblock wie SBS), jeder aus mindestens zwei Bausteinen
  if (runs.length <= 3 && runs.every(r => r >= 2)) return PAT.block;
  // zufällig gemischt nur mit genug von beiden
  const ids = [...new Set(seq)];
  if (Math.min(...ids.map(x => seq.filter(y => y === x).length)) < 3) return PAT.few;
  return PAT.stat;
}
/** erster Platz, der nicht passt (oder −1) */
export function buildWrongAt(t: BuildTask, seq: string[]): number {
  const bad = new Set(t.pool.filter(p => !p.ok).map(p => p.id));
  const i = seq.findIndex(x => bad.has(x));
  if (i >= 0 || t.goal !== "alt") return i;
  return seq.findIndex((x, k) => k > 0 && x === seq[k - 1]);
}
export function buildResult(t: BuildTask, seq: string[]): { ok: boolean; values: Record<string, number> } {
  const pat = buildPattern(t, seq);
  // häufigeres Monomer (Index im Vorrat) – für die Rückmeldung „Fast nur …“
  const maj = t.pool.length > 1 && seq.filter(x => x === t.pool[1].id).length > seq.length / 2 ? 1 : 0;
  return { ok: pat === PAT[t.goal === "homo" ? "ok" : t.goal], values: { pat, maj } };
}

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
/** Zeile unter dem Monomer-Bild: Name und Merkmal an der Zweifachbindung */
const monoNote = (v: VinylId) => T(`**${vinyl(v).name}** – die C=C trägt ${SIDE[v]}`, `**${cap(nm(v))}** – the C=C carries ${SIDE[v]}`);

/** gesättigtes Gegenstück (keine Zweifachbindung – kann keine Kette bilden) */
const SAT: Partial<Record<VinylId, [string, string]>> = tr(
  { ethen: ["Ethan", "CH₃–CH₃"], propen: ["Propan", "CH₃–CH₂–CH₃"], vinylchlorid: ["Chlorethan", "CH₃–CH₂–Cl"], styrol: ["Ethylbenzol", "CH₃–CH₂–C₆H₅"],
    acrylnitril: ["Propannitril", "CH₃–CH₂–C≡N"], tfe: ["Tetrafluorethan", "CHF₂–CHF₂"] },
  { ethen: ["Ethane", "CH₃–CH₃"], propen: ["Propane", "CH₃–CH₂–CH₃"], vinylchlorid: ["Chloroethane", "CH₃–CH₂–Cl"], styrol: ["Ethylbenzene", "CH₃–CH₂–C₆H₅"],
    acrylnitril: ["Propanenitrile", "CH₃–CH₂–C≡N"], tfe: ["Tetrafluoroethane", "CHF₂–CHF₂"] },
);
/** nur die in der Lektion eingeführten Monomere (Ethen, Propen, Styrol, Vinylchlorid) */
const SAT_IDS: VinylId[] = ["ethen", "propen", "styrol", "vinylchlorid"];
/** einfache Monomere für die ersten Aufgaben (gut erkennbare Gruppe) */
const EASY: VinylId[] = ["ethen", "propen", "styrol", "vinylchlorid"];
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

/** Beschriftung eines antippbaren Teils (Vorlesen, Tastatur) */
const partLabel = (el: string, i: number, vac?: boolean) => (vac ? T("freie Stelle", "vacant site") : T(`${el}‑Atom ${i + 1}`, `${el} atom ${i + 1}`));
const bondLabel = (els: string[], i: number) => T(`Bindung ${i + 1}: ${els.join("–")}`, `Bond ${i + 1}: ${els.join("–")}`);
/** Teile (Atome oder Bindungen „a|b“) nahe bei den Zielen – für einen großen Ausschnitt um die reagierende Stelle */
function nearParts(snap: { atoms: { id: string; x: number; y: number }[] }, parts: string[], around: string[], d: number): string[] {
  const at = new Map(snap.atoms.map(a => [a.id, a]));
  const pt = (p: string) => { const xs = p.split("|").map(x => at.get(x)!).filter(Boolean); return { x: xs.reduce((s, a) => s + a.x, 0) / xs.length, y: xs.reduce((s, a) => s + a.y, 0) / xs.length }; };
  const cs = around.map(pt);
  return parts.filter(p => { const q = pt(p); return cs.some(c => Math.hypot(c.x - q.x, c.y - q.y) <= d); });
}
/** Antipp-Aufgabe zusammensetzen; `why(id)` liefert für jedes falsche Teil Schlüssel und Rückmeldung */
function tapTask(o: { scene: TapScene; parts: string[]; answer: string[]; same?: Record<string, string>; mode?: "multi" | "pair" | "any"; halos?: boolean; zoom?: boolean; zoomWith?: string[]; zoomTo?: string[]; sol: string; prompt: string; hint: string; tip?: string; explain: string;
  why?: (id: string) => [string, string]; extra?: Trap[] }): TapTask {
  const frame = tapFrame(o.scene), at = new Map(frame.snap.atoms.map(a => [a.id, a]));
  const labels = o.parts.map((id, i) => (id.includes("|") ? bondLabel(id.split("|").map(x => at.get(x)?.text || at.get(x)?.el || "?"), i) : partLabel(at.get(id)?.el ?? "", i, at.get(id)?.vac)));
  const traps: Trap[] = [...(o.extra ?? [])];
  if (o.why) o.parts.forEach((id, i) => {
    if (o.answer.includes(id) || o.same?.[id]) return;
    const [miss, why] = o.why!(id);
    traps.push({ values: o.mode && o.mode !== "any" ? { wrong: i } : { pick: i }, miss, why });
  });
  return { kind: "tap", scene: o.scene, parts: o.parts, labels, answer: o.answer, ...(o.mode ? { mode: o.mode } : {}), ...(o.halos === false ? { halos: false } : {}), ...(o.zoom ? { zoom: true } : {}), ...(o.zoomWith ? { zoomWith: o.zoomWith } : {}), ...(o.zoomTo ? { zoomTo: o.zoomTo } : {}), ...(o.same ? { same: o.same } : {}),
    sol: o.sol, prompt: o.prompt, hint: o.hint, explain: o.explain, traps, ...(o.tip ? { tip: o.tip } : {}) };
}

/** Aufgabe zusammensetzen */
function task(prompt: string, correct: string, wrongs: Distractor[], o: { vis?: Vis; pics?: Record<string, Vis>; hint: string; tip?: string; explain: string; praise?: string; right?: string }): Task {
  const m = mc(correct, wrongs, 4, o.right);
  return { ...m, prompt, hint: o.hint, explain: o.explain, ...(o.tip ? { tip: o.tip } : {}), ...(o.praise ? { praise: o.praise } : {}), ...(o.vis ? { vis: o.vis } : {}), ...(o.pics ? { pics: o.pics } : {}) } as Task;
}

// ── Kapitel 1: Monomere und Polymere ───────────────────────────────────────────

function polyName(): Task {
  const v = pick(EASY);
  return task(T("Welches Polymer entsteht aus diesem Monomer?", "Which polymer forms from this monomer?"), poly(v),
    // drei Antworten: das Monomer-Bild bleibt auch auf kleinen Handys groß genug
    others(v, EASY, 2).map(w => d(poly(w), "gruppe-verwechselt",
      T(`${vinyl(w).polymer} entsteht aus ${vinyl(w).name}. Dort trägt die Zweifachbindung ${SIDE[w]}.`, `${cap(vinyl(w).polymer.toLowerCase())} forms from ${vinyl(w).name.toLowerCase()}. Its double bond carries ${SIDE[w]}.`))),
    {
      vis: { k: "mono", id: v, note: monoNote(v) },
      hint: T("Poly heißt viele. Der Name des Polymers enthält den Namen des Monomers.", "Poly means many. The polymer name contains the monomer name."),
      tip: T("Lies den Namen unter dem Bild. Was kommt beim Polymer davor?", "Read the name under the picture. What goes in front of it for the polymer?"),
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
    d(unit[0], "name-verwechselt", T("Das ist schon der Baustein in der Kette. Das Monomer hat noch die Zweifachbindung.", "That is already the repeat unit in the chain. The monomer still has the double bond.")),
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
    // Styrol mit großen Ringen: zwei Bausteine, sonst wird die Kette zu klein
    vis: { k: "chain", id: v, n: v === "styrol" ? 2 : 3, tact: "atakt", seed: 3 },
    hint: T("Ein Baustein umfasst zwei C‑Atome der Hauptkette. Er wiederholt sich.", "One repeat unit covers two C atoms of the main chain. It repeats."),
    tip: T("Schneide die Kette nach je zwei C‑Atomen. Mache aus der Einfachbindung wieder C=C.", "Cut the chain after every two C atoms. Turn the single bond back into C=C."),
    explain: T(`Baustein –CH₂–CH(…)–, Seitengruppe: ${SIDE[v].replace(/^einen /, "ein ")} → Monomer **${vinyl(v).name}** (${plain(vinyl(v).struct)}).`, `Unit –CH₂–CH(…)–, side group: ${SIDE[v]} → monomer **${vinyl(v).name}** (${plain(vinyl(v).struct)}).`),
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
    hint: T("Was braucht ein Molekül, damit es sich an zwei Nachbarn binden kann? Vergleiche die Bindungen zwischen den C‑Atomen.", "What does a molecule need to bond to two neighbours? Compare the bonds between the C atoms."),
    tip: T("Was braucht ein Molekül, damit es sich an zwei Nachbarn binden kann? Vergleiche die Bindungen zwischen den C‑Atomen.", "What does a molecule need to bond to two neighbours? Compare the bonds between the C atoms."),
    explain: T(`**${plain(vinyl(v).struct)}** hat eine C=C-Bindung. Sie öffnet sich und verbindet die Moleküle zur Kette.`, `**${plain(vinyl(v).struct)}** has a C=C bond. It opens and links the molecules into a chain.`),
  });
}

function nBedeutung(): Task {
  const v = pick(EASY);
  return task(T("Was bedeutet das **n** an der eckigen Klammer?", "What does the **n** at the square bracket mean?"), T("Baustein n-mal wiederholt", "Unit repeated n times"), [
    d(T("n steht für Stickstoff", "n stands for nitrogen"), "n-stickstoff", T("Stickstoff ist ein großes N. Das kleine n ist eine Anzahl.", "Nitrogen is a capital N. The small n is a number.")),
    d(T("Polymer hat n Atome", "Polymer has n atoms"), "atome-statt-bausteine", T("n zählt Bausteine, nicht Atome. Jeder Baustein hat mehrere Atome.", "n counts repeat units, not atoms. Each repeat unit has several atoms.")),
    d(T("n verschiedene Monomere", "n different monomers"), "name-verwechselt", T("Hier ist es immer derselbe Baustein – nur sehr oft.", "Here it is always the same repeat unit – just very often.")),
  ], {
    vis: { k: "unit", id: v },
    hint: T("Was steht in der Klammer – und was könnte eine Zahl daneben zählen?", "What is inside the bracket – and what might a number next to it count?"),
    tip: T("Schau in die Klammer: Was steht darin – ein Atom oder ein größeres Stück?", "Look inside the bracket: what is in it – one atom or a bigger piece?"),
    explain: T("In [ … ]ₙ steht **ein Baustein**. n ist groß: oft tausende Bausteine in einer Kette.", "[ … ]ₙ contains **one repeat unit**. n is large: often thousands of repeat units in one chain."),
  });
}

function kugelZaehlen(): Task {
  const v = pick(EASY);
  const n = pick([5, 6, 7, 8, 9]);
  const atoms = { ethen: 6, propen: 9, styrol: 16, vinylchlorid: 6, acrylnitril: 7, tfe: 6 }[v as "ethen"] ?? 6;
  return task(T("Wie viele **Monomere** wurden in diese Kette eingebaut?", "How many **monomers** were built into this chain?"), String(n), [
    d(String(n - 1), "bindungen-gezaehlt", T(`${n - 1} sind die Striche zwischen den Kügelchen. Gezählt werden die Kügelchen.`, `${n - 1} is the number of lines between the beads. Count the beads.`)),
    d(String(n * atoms), "atome-statt-bausteine", T(`Jedes Kügelchen ist ein ganzer Baustein mit ${atoms} Atomen. Gefragt sind die Bausteine.`, `Each bead is a whole repeat unit with ${atoms} atoms. The question asks for repeat units.`)),
    d(String(2 * n), "atome-statt-bausteine", T(`${2 * n} sind die C‑Atome der Hauptkette – je Baustein zwei. Gezählt werden Bausteine.`, `${2 * n} is the number of main-chain C atoms – two per repeat unit. Count repeat units.`)),
  ], {
    vis: { k: "beads", seq: Array.from({ length: n }, () => v) },
    hint: T("Im Kügelchenmodell ist jedes Kügelchen ein eingebautes Monomer.", "In the bead model each bead is one built-in monomer."),
    tip: T("Zähle die Kügelchen, nicht die Striche.", "Count the beads, not the lines."),
    explain: T(`${n} Kügelchen = **${n} Bausteine** = ${n} eingebaute Monomere.`, `${n} beads = **${n} repeat units** = ${n} built-in monomers.`),
  });
}

function bausteinWahl(): Task {
  const v = pick(EASY.filter(x => x !== "ethen" && x !== "tfe"));
  const w = others(v, EASY.filter(x => x !== "ethen" && x !== "tfe"), 1)[0];
  const right: [string, Vis] = [visText({ k: "unit", id: v }), { k: "unit", id: v }];
  const dbl: [string, Vis] = [visText({ k: "unit", id: v, dbl: true }), { k: "unit", id: v, dbl: true }];
  const other: [string, Vis] = [visText({ k: "unit", id: w }), { k: "unit", id: w }];
  return task(T("Welcher **Baustein** steckt im Polymer aus diesem Monomer?", "Which **repeat unit** is in the polymer made from this monomer?"), right[0], [
    d(dbl[0], "doppelbindung-bleibt", T("Zähl die Striche am C: fünf – das geht nicht, C bildet vier Bindungen. Die C=C muss sich öffnen, damit die Bindungen nach außen entstehen.", "Count the lines at the C: five – impossible, C forms four bonds. The C=C has to open so that the outward bonds can form.")),
    d(other[0], "gruppe-verwechselt", T(`Dieser Baustein trägt ${SIDE[w]} – er gehört zu ${vinyl(w).name}.`, `This repeat unit carries ${SIDE[w]} – it belongs to ${nm(w)}.`)),
  ], {
    vis: { k: "mono", id: v, note: monoNote(v) }, pics: Object.fromEntries([right, dbl, other]),
    hint: T("Aus C=C wird C–C. Die Seitengruppe bleibt, wo sie ist.", "C=C becomes C–C. The side group stays where it is."),
    tip: T(`Das Monomer trägt ${SIDE[v]}. Zähle die Bindungen an jedem C‑Atom: immer genau vier.`, `The monomer carries ${SIDE[v]}. Count the bonds at each C atom: always exactly four.`),
    explain: T(`Monomer ${plain(vinyl(v).struct)} → Baustein mit Einfachbindung. Die Seitengruppe bleibt – ${SIDE[v].replace(/^einen /, "ein ")}.`, `Monomer ${plain(vinyl(v).struct)} → repeat unit with a single bond. The side group stays – ${SIDE[v]}.`),
  });
}

/** Alltagsgegenstand, der unter den vier Kunststoffen eindeutig zu einem gehört (Rohre z. B. gibt es aus PE und PVC) */
const EVERYDAY: Record<"ethen" | "propen" | "styrol" | "vinylchlorid", string> = tr(
  { ethen: "Aus welchem Kunststoff sind die meisten **Plastiktüten**?", propen: "Aus welchem Kunststoff sind oft **Autoteile**, die fest sein und Wärme aushalten müssen?",
    styrol: "Aus welchem Kunststoff sind weiße **Dämmplatten aus Schaum**?", vinylchlorid: "Aus welchem Kunststoff sind oft **Fensterrahmen**?" },
  { ethen: "Which plastic are most **plastic bags** made of?", propen: "Which plastic are **car parts** often made of that must be firm and withstand heat?",
    styrol: "Which plastic are white **foam insulation boards** made of?", vinylchlorid: "Which plastic are **window frames** often made of?" },
);
/** Stärke jedes Kunststoffs – Grund für die Verwendung (auch in der Lektion K1) */
export const STRENGTH = (): Record<keyof typeof EVERYDAY, string> => tr(
  { ethen: "PE ist weich und dehnbar – gut für Folien und Tüten.", propen: "PP ist fester als PE und hält Wärme bis etwa 100 °C aus.",
    styrol: "PS lässt sich mit Gas zu leichtem Schaum aufblähen – gut zum Dämmen.", vinylchlorid: "PVC ist hart und wetterfest – gut für Fensterrahmen." },
  { ethen: "PE is soft and stretchy – good for films and bags.", propen: "PP is firmer than PE and takes heat up to about 100 °C.",
    styrol: "PS can be blown up with gas into light foam – good for insulation.", vinylchlorid: "PVC is hard and weatherproof – good for window frames." },
);

function kunststoffAlltag(): Task {
  const ids = Object.keys(EVERYDAY) as (keyof typeof EVERYDAY)[];
  const v = pick(ids), S = STRENGTH();
  return task(EVERYDAY[v], poly(v),
    others(v, ids, 3).map(w => d(poly(w), "verwendung-verwechselt", S[w as keyof typeof EVERYDAY])), {
      hint: T("Kunststoffe sind Polymere mit Kurzzeichen: PE, PP, PS, PVC.", "Plastics are polymers with short codes: PE, PP, PS, PVC."),
      tip: T("Überlege: Muss der Gegenstand weich, fest, leicht oder wetterfest sein?", "Think: does the object need to be soft, firm, light or weatherproof?"),
      explain: S[v].replace(/^(\w+)/, "**$1**"),
    });
}

// ── Kapitel 2: radikalische Polymerisation ─────────────────────────────────────

const STEP_TEXT = () => tr({ start: "Start: Der Starter zerfällt", wachstum: "Kettenwachstum", abbruch: "Kettenabbruch" }, { start: "Initiation: the initiator splits", wachstum: "Propagation", abbruch: "Termination" });

function schritt(): Task {
  const which = pick(["start", "wachstum", "abbruch"] as const);
  const acts = which === "start" ? ["heat"] : which === "wachstum" ? ["heat", "add:styrol", "add:styrol"] : ["heat", "add:styrol", "add:styrol", "comb"];
  const S = STEP_TEXT();
  const WHY: Record<string, string> = tr(
    { start: "Beim Start bricht die O–O-Bindung des Starters. Noch ist kein Monomer dabei.", wachstum: "Beim Wachstum greift das Radikal am Kettenende eine C=C-Bindung an.", abbruch: "Beim Abbruch treffen sich zwei Radikale und bilden eine Bindung." },
    { start: "In initiation the O–O bond of the initiator breaks. No monomer is involved yet.", wachstum: "In propagation the radical at the chain end attacks a C=C bond.", abbruch: "In termination two radicals meet and form a bond." },
  );
  return task(T("Welcher Schritt der radikalischen Polymerisation ist das?", "Which step of radical polymerisation is this?"), S[which],
    (["start", "wachstum", "abbruch"] as const).filter(x => x !== which).map(x => d(S[x], "schritt-verwechselt", WHY[x])), {
      vis: mech(PS, acts, arrowKey(PS, acts)),
      hint: T("Was verbinden die Pfeile: Starter, Monomer oder zwei Kettenenden?", "What do the arrows connect: initiator, monomer or two chain ends?"),
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
    hint: T("Schau, was am Atom ganz rechts sitzt – und zähl die Elektronen dort.", "Look at what sits on the atom on the far right – and count the electrons there."),
    tip: T("Ladungen zeigt eine Formel mit + oder −. Siehst du so ein Zeichen?", "A formula shows charges with + or −. Do you see such a sign?"),
    explain: T("Radikal = Teilchen mit **ungepaartem Elektron** (Punkt). Es reagiert sehr leicht.", "Radical = particle with an **unpaired electron** (dot). It reacts very easily."),
  });
}

function pfeil(): Task {
  return task(T("Wie viele Elektronen bewegt ein Pfeil mit **halber** Spitze?", "How many electrons does a **half-headed** arrow move?"), "1", [
    d("2", "pfeil-paar", T("Zwei Elektronen (ein Paar) zeigt der volle Pfeil. Der halbe Pfeil zeigt eins.", "Two electrons (a pair) are shown by a full arrow. A half-headed arrow shows one.")),
    d("0", "pfeil-paar", T("Jeder Pfeil zeigt bewegte Elektronen – der halbe genau eins.", "Every arrow shows moving electrons – the half-headed one exactly one.")),
    d("3", "pfeil-paar", T("Elektronen bewegen sich einzeln oder als Paar – nie zu dritt.", "Electrons move singly or as a pair – never three at once.")),
  ], {
    vis: mech(PS, ["heat"], arrowKey(PS, ["heat"])),
    hint: T("Schau genau auf die Spitze: ganz oder halb? Erinnere dich an die Lektion.", "Look closely at the head: full or half? Remember the lesson."),
    tip: T("Zähle die Elektronen der O–O-Bindung: Wie viele bekommt jedes O‑Atom?", "Count the electrons of the O–O bond: how many does each O atom get?"),
    explain: T("Halber Pfeil: **ein** Elektron. Beim Bruch der O–O-Bindung behält jedes O ein Elektron – zwei Radikale.", "Half-headed arrow: **one** electron. When the O–O bond breaks each O keeps one electron – two radicals."),
  });
}

function startBruch(): Task {
  return task(T("Was passiert beim Erwärmen mit der O–O-Bindung des Starters?", "What happens to the O–O bond of the initiator on heating?"), T("Bricht – jedes O behält 1 Elektron", "Breaks – each O keeps 1 electron"), [
    d(T("Bricht – ein O bekommt beide", "Breaks – one O gets both"), "homolyse-heterolyse", T("Dann entstünden Ionen. Beim Start entstehen zwei gleiche Radikale.", "That would form ions. Initiation forms two identical radicals.")),
    d(T("Wird zur Zweifachbindung", "Becomes a double bond"), "schritt-verwechselt", T("Beim Erwärmen bricht die schwache O–O-Bindung.", "On heating the weak O–O bond breaks.")),
    d(T("Bleibt – das Monomer zerfällt", "Stays – the monomer splits"), "schritt-verwechselt", T("Das Monomer zerfällt nicht. Die schwache O–O-Bindung des Starters bricht.", "The monomer does not split. The weak O–O bond of the initiator breaks.")),
  ], {
    vis: mech(PS, ["heat"], arrowKey(PS, ["heat"])),
    hint: T("Zwei halbe Pfeile gehen in entgegengesetzte Richtungen.", "Two half-headed arrows go in opposite directions."),
    tip: T("Folge beiden halben Pfeilen: Wohin zeigen sie, zu einem O oder zu zwei?", "Follow both half-headed arrows: do they point to one O or to two?"),
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
    tip: T("Folge den Pfeilen: Welches C‑Atom behält am Ende ein einzelnes Elektron?", "Follow the arrows: which C atom keeps a single electron at the end?"),
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
    d(T("Kettenwachstum", "Propagation"), "schritt-verwechselt", T("Beim Wachstum kommt ein Monomer dazu. Hier treffen sich zwei Radikale.", "In propagation a monomer adds. Here two radicals meet.")),
  ], {
    vis: mech(PS, acts, arrowKey(PS, acts)),
    hint: T("Verbinden die Pfeile die beiden Radikale – oder holen sie ein H‑Atom?", "Do the arrows join the two radicals – or fetch an H atom?"),
    tip: T("Verbinden die Pfeile die beiden Radikale – oder holen sie ein H‑Atom?", "Do the arrows join the two radicals – or fetch an H atom?"),
    explain: comb ? T("**Rekombination** erkennst du an den verbundenen Enden: Die zwei Radikal-Elektronen bilden eine Bindung – eine lange Kette.", "You recognise **combination** by the joined ends: the two radical electrons form a bond – one long chain.")
      : T("**Disproportionierung** erkennst du am wandernden H: Eine Kette endet danach mit C=C, die andere gesättigt.", "You recognise **disproportionation** by the moving H: afterwards one chain ends with C=C, the other is saturated."),
  });
}

function starterRest(): Task {
  return task(T("Was sitzt am Anfang jeder Kette?", "What sits at the start of every chain?"), T("Ein Bruchstück des Starters", "A fragment of the initiator"), [
    d(T("Nichts (Starter = Katalysator)", "Nothing (initiator = catalyst)"), "starter-katalysator", T("Der Starter wird verbraucht. Sein Bruchstück wird Teil der Kette.", "The initiator is used up. Its fragment becomes part of the chain.")),
    d(T("Ein Radikal", "A radical"), "radikal-bleibt", T("Das Radikal sitzt am wachsenden Ende, nicht am Anfang.", "The radical sits at the growing end, not at the start.")),
    d(T("Ein Wassermolekül", "A water molecule"), "byp-falsch", T("Bei der Polymerisation entsteht kein Wasser. Am Anfang sitzt das Bruchstück des Starters, das die Kette begonnen hat.", "Polymerisation forms no water. The start holds the initiator fragment that began the chain.")),
  ], {
    vis: lastFrame(PS, ["heat", "add:styrol", "add:styrol"]),
    hint: T("Vergleiche den Anfang der Kette mit dem Starter-Radikal.", "Compare the start of the chain with the initiator radical."),
    tip: T("Suche in der Kette die Atomgruppe, die schon im Starter war.", "Find the group of atoms in the chain that was already in the initiator."),
    explain: T("Der Starter wird **verbraucht**: Das Bruchstück C₆H₅– bleibt als Endgruppe am Kettenanfang.", "The initiator is **used up**: the fragment C₆H₅– stays as the end group at the chain start."),
  });
}

function mehrStarter(): Task {
  return task(T("Was passiert mit mehr Starter (bei gleich viel Monomer)?", "What happens with more initiator (same amount of monomer)?"), T("Mehr, aber kürzere Ketten", "More but shorter chains"), [
    d(T("Längere Ketten", "Longer chains"), "mehr-starter-laenger", T("Mehr Radikale teilen sich das Monomer. Jede Kette bekommt weniger.", "More radicals share the monomer. Each chain gets less.")),
    d(T("Weniger Ketten", "Fewer chains"), "mehr-starter-laenger", T("Jedes Radikal startet eine Kette – mehr Starter, mehr Ketten.", "Each radical starts a chain – more initiator, more chains.")),
    d(T("Nichts ändert sich", "Nothing changes"), "mehr-starter-laenger", T("Mehr Starter, mehr Ketten – jede bekommt weniger Monomer.", "More initiator, more chains – each gets less monomer.")),
  ], {
    vis: { k: "starters" },
    hint: T("Was startet jedes Radikal – und wie weit reicht das Monomer dann?", "What does each radical start – and how far does the monomer go then?"),
    tip: T("Stell dir vor: 100 Monomere, einmal mit 2 und einmal mit 10 Radikalen.", "Imagine 100 monomers, once with 2 and once with 10 radicals."),
    explain: T("Mehr Radikale → **mehr Ketten** → jede **kürzer**.", "More radicals → **more chains** → each **shorter**."),
  });
}

// ── Kapitel 3: Katalysatoren und Verfahren ─────────────────────────────────────

const ZN_PP: Recipe = { art: "poly", a: "propen", method: "zn" };
const POLAR: VinylId[] = ["mma", "vinylchlorid"];
const NONPOLAR: VinylId[] = ["ethen", "propen", "styrol", "butadien"];
const methName = (id: MethodId) => tr(method(id).name, method(id).name);

function katalysator(): Task {
  return task(T("Was unterscheidet den Ziegler-Natta-Katalysator vom Starter DBPO?", "What makes the Ziegler–Natta catalyst different from the initiator DBPO?"), T("Er wird nicht verbraucht", "It is not used up"), [
    d(T("Er zerfällt in Radikale", "It splits into radicals"), "starter-katalysator", T("Das macht der Starter DBPO. Der Katalysator bleibt erhalten.", "That is what the initiator DBPO does. The catalyst stays intact.")),
    d(T("Er bildet das Kettenende", "It forms the chain end"), "starter-katalysator", T("Am Ende bleibt der Starter. Der Katalysator gibt die Kette ab und macht weiter.", "The initiator stays at the end. The catalyst releases the chain and carries on.")),
    d(T("Er enthält C=C", "It contains C=C"), "starter-katalysator", T("C=C hat das Monomer. Der Katalysator ist eine Titanverbindung.", "The monomer has the C=C. The catalyst is a titanium compound.")),
  ], {
    hint: T("Denk daran, was nach der Reaktion vom Starter bzw. vom Titan noch übrig ist.", "Think about what is left of the initiator or the titanium after the reaction."),
    tip: T("Vergleiche: Was bleibt vom DBPO übrig – und was vom Titan nach vielen Ketten?", "Compare: what is left of the DBPO – and of the titanium after many chains?"),
    explain: T("**Katalysator**: Am Titan wachsen nacheinander viele Ketten. **Starter**: wird verbraucht.", "**Catalyst**: many chains grow one after another at the titanium. **Initiator**: is used up."),
  });
}

function freieStelle(): Task {
  const acts = ["act", "add:propen"];
  return task(T("Wo lagert sich das Propen an?", "Where does the propene attach?"), T("An der freien Stelle am Ti", "At the vacant site on Ti"), [
    d(T("An einem Radikal", "At a radical"), "zn-radikal", T("Hier gibt es kein Radikal. Die Kette sitzt am Titan.", "There is no radical here. The chain sits on the titanium.")),
    d(T("Am Cl‑Atom", "At the Cl atom"), "zn-radikal", T("Die Cl‑Atome halten das Titan. Angelagert wird an der freien Stelle.", "The Cl atoms hold the titanium. Attachment is at the vacant site.")),
    d(T("Am Aluminium", "At the aluminium"), "zn-radikal", T("Das Al hat nur die Ethylgruppe übergeben. Angelagert wird am Titan.", "The Al only handed over the ethyl group. Attachment happens at the titanium.")),
  ], {
    vis: mech(ZN_PP, acts, arrowKey(ZN_PP, acts)),
    hint: T("Suche am Titan den Platz, an dem noch nichts gebunden ist.", "Find the place on the titanium where nothing is bonded yet."),
    tip: T("Die Cl‑Atome und die Kette sind fest am Ti gebunden. Wo ist noch Platz?", "The Cl atoms and the chain are firmly bonded to Ti. Where is there still room?"),
    explain: T("Das Monomer lagert sich mit seiner C=C-Bindung an die **freie Stelle** an. Dann wird es zwischen Titan und Kette eingebaut.", "The monomer attaches its C=C bond to the **vacant site**. Then it is inserted between titanium and chain."),
  });
}

function zieglerGift(): Task {
  const v = pick(POLAR);
  return task(T("Welches Monomer **vergiftet** den Ziegler-Natta-Katalysator?", "Which monomer **poisons** the Ziegler–Natta catalyst?"), vinyl(v).name,
    shuffle(NONPOLAR).slice(0, 3).map(w => d(vinyl(w).name, "zn-unpolar-gift", T(`${vinyl(w).name} hat kein O-, N-, Cl- oder F‑Atom. Es wird am Titan eingebaut.`, `${vinyl(w).name} has no O, N, Cl or F atom. It is inserted at the titanium.`))), {
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
      vis: { k: "chain", id, n: 4, tact: t, seed: t === "atakt" ? 3 : 1 },
      hint: T("Schau, ob die Seitengruppen oben, unten oder abwechselnd sitzen.", "Check whether the side groups sit above, below or alternately."),
      tip: T("Geh die Kette von links nach rechts: Seitengruppe oben oder unten?", "Go along the chain from left to right: side group above or below?"),
      explain: boldLead(WHY[t]),
    });
}

function taktischVerfahren(): Task {
  return task(T("Mit welchem Verfahren entsteht **isotaktisches** Polypropen?", "Which method gives **isotactic** polypropene?"), methName("zn"), [
    d(methName("dbpo"), "radikal-taktisch", T("Radikalisch gibt Propen nur kurze Ketten. Und ein Radikal-Ende lagert jedes Monomer zufällig herum an: ataktisch.", "With radicals propene gives only short chains. And a radical end adds each monomer randomly: atactic.")),
    d(methName("bf3"), "verfahren-passt-nicht", compat("propen", "bf3").why),
    d(methName("buli"), "verfahren-passt-nicht", compat("propen", "buli").why),
  ], {
    hint: T("Geordnete Ketten entstehen, wenn jedes Monomer gleich herum eingebaut wird.", "Ordered chains form when each monomer is inserted the same way round."),
    tip: T("Bei Radikalen und Ionen ist das Kettenende frei beweglich. Wo wird es festgehalten?", "With radicals and ions the chain end moves freely. Where is it held in place?"),
    explain: compat("propen", "zn").why,
  });
}

function hdpe(): Task {
  return task(T("Welches Polyethen hat **unverzweigte** Ketten und ist dichter?", "Which polyethene has **unbranched** chains and is denser?"), T("PE-HD (Ziegler-Natta)", "PE-HD (Ziegler–Natta)"), [
    d(T("PE-LD (radikalisch)", "PE-LD (radical)"), "verzweigt-dichte", T("Äste halten die Ketten auf Abstand: weniger dicht.", "Branches keep the chains apart: less dense.")),
    d(T("Beide gleich", "Both the same"), "verzweigt-dichte", T("Die Verfahren geben verzweigte oder unverzweigte Ketten.", "The methods give branched or unbranched chains.")),
  ], {
    vis: { k: "struct", s: "verzweigt" },
    hint: T("Unverzweigte Ketten können sich eng aneinanderlegen.", "Unbranched chains can lie close together."),
    tip: T("Stell dir Äste an den Ketten vor: Können die Ketten dann eng liegen?", "Imagine branches on the chains: can the chains still lie close together?"),
    explain: T("**PE-HD**: unverzweigt, dicht (Flaschen). **PE-LD**: verzweigt, weich (Folien).", "**PE-HD**: unbranched, dense (bottles). **PE-LD**: branched, soft (films)."),
  });
}

function lebend(): Task {
  return task(T("Lebende Polystyrol-Ketten (anionisch) – dann kommt Butadien dazu. Was entsteht?", "Living polystyrene chains (anionic) – then butadiene is added. What forms?"), T("Ein Blockcopolymer", "A block copolymer"), [
    d(T("Zwei getrennte Polymere", "Two separate polymers"), "block-getrennt", T("So wäre es mit abgebrochenen Ketten, etwa radikalisch.", "That would happen with stopped chains, e.g. radical ones.")),
    d(T("Nur Polybutadien", "Only polybutadiene"), "block-getrennt", T("Die Styrol-Ketten bleiben. Butadien wächst an ihre Enden.", "The styrene chains stay. Butadiene grows onto their ends.")),
    d(T("Nur Polystyrol", "Only polystyrene"), "block-getrennt", T("Die Ketten leben noch. Butadien wird an ihren Enden eingebaut.", "The chains are still alive. Butadiene is built in at their ends.")),
  ], {
    vis: { k: "beads", seq: ["styrol", "styrol", "styrol", "styrol", "butadien", "butadien", "butadien", "butadien"] },
    hint: T("Lebende Ketten brechen nicht von selbst ab. Sie wachsen mit jedem neuen Monomer weiter.", "Living chains do not stop by themselves. They keep growing with each new monomer."),
    tip: T("Die Styrol-Ketten haben noch aktive Enden. Was macht ein aktives Ende mit Butadien?", "The styrene chains still have active ends. What does an active end do with butadiene?"),
    explain: T("Die Ketten wachsen mit Butadien weiter: **Block** Styrol, dann Block Butadien.", "The chains keep growing with butadiene: a **block** of styrene, then of butadiene."),
  });
}

function kationisch(): Task {
  const ws: VinylId[] = shuffle(["mma", "vinylchlorid"]);
  return task(T("Welches Monomer bildet **kationisch** (BF₃ mit Wasser) lange Ketten?", "Which monomer forms long chains **cationically** (BF₃ with water)?"), vinyl("isobuten").name, [
    ...ws.map(w => d(vinyl(w).name, "kation-polar", compat(w, "bf3").why)),
    d(vinyl("ethen").name, "verfahren-passt-nicht", compat("ethen", "bf3").why),
  ], {
    hint: T("Die positive Ladung am Kettenende braucht Gruppen, die Elektronen schieben.", "The positive charge at the chain end needs groups that push electrons."),
    tip: T("O- und Cl‑Atome stören die positive Ladung. Welche Gruppen schieben Elektronen?", "O and Cl atoms disturb the positive charge. Which groups push electrons?"),
    explain: compat("isobuten", "bf3").why,
  });
}

function verfahrenWahl(): Task {
  const m = pick(["ethen", "propen", "mma", "vinylchlorid", "isobuten"] as VinylId[]);
  // AIBN ist in der Lektion nicht eingeführt: nur DBPO als Starter
  // MMA und Vinylchlorid: in der Lektion nur radikalisch (DBPO); anionisch bei tiefer Temperatur kommt dort nicht vor
  const ok = m === "mma" || m === "vinylchlorid" ? (["dbpo"] as MethodId[]) : methodsFor(m).filter(x => x !== "aibn");
  const right = pick(ok);
  const bad = shuffle(METHODS.map(x => x.id).filter(x => x !== "aibn" && compat(m, x).fit !== "ok")).slice(0, 3);
  return task(T(`Mit welchem Verfahren bildet **${vinyl(m).name}** lange Ketten?`, `Which method makes **${nm(m)}** form long chains?`), methName(right),
    bad.map(b => d(methName(b), compat(m, b).fail === "poison" ? "zn-polar" : "verfahren-passt-nicht", compat(m, b).why)), {
      hint: T("O, N, Cl: Ziegler-Natta wird vergiftet. Zwei CH₃ an einem C: zu sperrig für Titan, aber gut kationisch.", "O, N, Cl: Ziegler–Natta is poisoned. Two CH₃ on one C: too bulky for titanium, but fine cationically."),
      tip: T(`${vinyl(m).name} trägt ${SIDE[m]}. Prüfe jedes Verfahren: vergiftet, zu sperrig oder passt?`, `${cap(nm(m))} carries ${SIDE[m]}. Check each method: poisoned, too bulky or fine?`),
      explain: compat(m, right).why,
    });
}

// ── Kapitel 4: Polykondensation ────────────────────────────────────────────────

const G = () => tr({ COOH: "–COOH", OH: "–OH", NH2: "–NH₂", COCl: "–COCl", NCO: "–⁠N=C=O" }, { COOH: "–COOH", OH: "–OH", NH2: "–NH₂", COCl: "–COCl", NCO: "–⁠N=C=O" });
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
    hint: T("Welche Gruppe trägt jedes Monomer? Können gleiche Gruppen miteinander reagieren?", "Which group does each monomer carry? Can identical groups react with each other?"),
    tip: T(`Schau an die Enden beider Moleküle. Welche Gruppe trägt ${stepName(a)}, welche ${stepName(b)}?`, `Look at the ends of both molecules. Which group does ${stepName(a)} carry, which ${stepName(b)}?`),
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
    tip: T("Suche im Bild das kleine Molekül, das nicht mehr zur Kette gehört.", "Find the small molecule in the picture that no longer belongs to the chain."),
    explain: T("–COOH gibt OH ab, –OH gibt H ab: zusammen **H₂O**. Das macht die Reaktion zur Polykondensation.", "–COOH gives off OH, –OH gives off H: together **H₂O**. That makes it a polycondensation."),
  });
}

function bindungArt(): Task {
  const amid = Math.random() < 0.5;
  const g = G();
  const E = T("Esterbindung", "Ester bond"), A = T("Amidbindung", "Amide bond");
  return task(T(`Welche Bindung entsteht aus ${g.COOH} und ${amid ? g.NH2 : g.OH}?`, `Which bond forms from ${g.COOH} and ${amid ? g.NH2 : g.OH}?`), amid ? A : E, [
    d(amid ? E : A, "ester-amid", amid ? T("Ester entstehen mit –OH. Mit –NH₂ entsteht ein Amid.", "Esters form with –OH. With –NH₂ an amide forms.") : T("Amide entstehen mit –NH₂. Mit –OH entsteht ein Ester.", "Amides form with –NH₂. With –OH an ester forms.")),
    d(T("Zweifachbindung", "Double bond"), "kond-doppelbindung", T("Es entsteht eine Einfachbindung zu O bzw. N. Die C=O gab es schon in der Säuregruppe.", "A single bond to O or N forms. The C=O was already in the acid group.")),
  ], {
    hint: T("Welches Atom bringt der Partner mit: O oder N? Davon hängt der Name ab.", "Which atom does the partner bring: O or N? The name depends on it."),
    tip: T(`Der Partner ${amid ? "–NH₂" : "–OH"} bringt ein ${amid ? "N" : "O"}‑Atom in die neue Bindung.`, `The partner ${amid ? "–NH₂" : "–OH"} brings an ${amid ? "N" : "O"} atom into the new bond.`),
    explain: amid ? T("–CO–**NH**–: **Amidbindung** (Polyamid, z. B. Nylon).", "–CO–**NH**–: **amide bond** (polyamide, e.g. nylon).") : T("–CO–**O**–: **Esterbindung** (Polyester, z. B. PET).", "–CO–**O**–: **ester bond** (polyester, e.g. PET)."),
  });
}

function chlorid(): Task {
  return task(T("Adipinsäuredichlorid + Hexan-1,6-diamin: Was wird abgespalten?", "Adipoyl chloride + hexane-1,6-diamine: what is split off?"), "HCl", [
    d("H₂O", "byp-chlorid", T("Das Säurechlorid hat statt OH ein Cl‑Atom. Darum geht HCl ab.", "The acyl chloride has a Cl atom instead of OH. So HCl leaves.")),
    d("Cl₂", "byp-falsch", T("Das Cl verbindet sich mit dem H aus der Aminogruppe.", "The Cl joins with the H from the amino group.")),
    d("NH₃", "byp-falsch", T("Das N bleibt in der Amidbindung. Nur ein H geht ab – zusammen mit dem Cl.", "The N stays in the amide bond. Only one H leaves – together with the Cl.")),
  ], {
    vis: { k: "pair", a: "adipoylchlorid", b: "hexandiamin" },
    hint: T("Das Cl der Säuregruppe und ein H der Aminogruppe gehen weg.", "The Cl of the acid group and an H of the amino group leave."),
    tip: T("Mit Säure + Amin geht H₂O weg. Was sitzt hier statt –OH an der Säuregruppe?", "With acid + amine H₂O leaves. What sits on the acid group here instead of –OH?"),
    explain: T("–COCl + H₂N– → –CO–⁠NH–⁠ + **HCl**. So entsteht Nylon schon bei Raumtemperatur.", "–COCl + H₂N– → –CO–⁠NH–⁠ + **HCl**. This makes nylon even at room temperature."),
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
    tip: T(`Gesucht: zweimal –COOH im einen Monomer, zweimal ${amid ? "–NH₂" : "–OH"} im anderen.`, `Wanted: –COOH twice in one monomer, ${amid ? "–NH₂" : "–OH"} twice in the other.`),
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
    tip: T("Zähle die –OH-Gruppen am Ethanol. Wie oft kann es binden?", "Count the –OH groups on ethanol. How often can it bond?"),
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
    hint: T("Zähle die reaktiven Gruppen am Glycerin: Wie viele Partner kann es binden?", "Count the reactive groups on glycerol: how many partners can it bind?"),
    tip: T("Glycerin hat an jedem C‑Atom eine –OH-Gruppe. Wie viele Partner bindet es?", "Glycerol has an –OH group on each C atom. How many partners does it bind?"),
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
      tip: T("Welche Gruppen tragen die Monomere? Ester: PET, PBT, PLA. Amid: PA.", "Which groups do the monomers carry? Ester: PET, PBT, PLA. Amide: PA."),
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
    tip: T("Lies die Enden jedes Moleküls: gleiche Gruppen oder zwei verschiedene?", "Read the ends of each molecule: the same groups or two different ones?"),
    explain: stepReact(right).why,
  });
}

function wasserZahl(): Task {
  const n = pick([3, 4, 5, 6]);
  return task(T(`${n} Monomere verknüpfen sich zu einer Kette. Wie viele Wassermoleküle werden abgespalten?`, `${n} monomers link into one chain. How many water molecules are split off?`), String(n - 1), [
    d(String(n), "verknuepfungen-gezaehlt", T(`Zwischen ${n} Monomeren liegen nur ${n - 1} Verknüpfungen.`, `Between ${n} monomers there are only ${n - 1} links.`)),
    d(String(2 * n), "byp-falsch", T("Jede Verknüpfung spaltet genau ein Wasser ab.", "Each link splits off exactly one water.")),
    d(String(n + 1), "verknuepfungen-gezaehlt", T(`Zwischen ${n} Bausteinen liegen ${n - 1} Striche, nicht ${n + 1}.`, `Between ${n} repeat units there are ${n - 1} lines, not ${n + 1}.`)),
  ], {
    vis: { k: "beads", seq: Array.from({ length: n }, (_, i) => (i % 2 ? "ethandiol" : "terephthalsaeure")) },
    hint: T("Ein Wassermolekül je Verknüpfung (je Strich).", "One water molecule per link (per line)."),
    tip: T(`Zeichne 3 Kügelchen mit Strichen: Wie viele Striche? Und bei ${n}?`, `Draw 3 beads with lines: how many lines? And with ${n}?`),
    explain: T(`${n} Bausteine → ${n - 1} Verknüpfungen → **${n - 1} H₂O**.`, `${n} repeat units → ${n - 1} links → **${n - 1} H₂O**.`),
  });
}

// ── Kapitel 5: Polyaddition ────────────────────────────────────────────────────

const PUR: Recipe = { art: "add", a: "hdi", b: "butandiol" };

function keinNebenprodukt(): Task {
  // drei Ansätze: HDI + Butandiol, MDI + Butandiol (Urethan), HDI + Hexandiamin (Harnstoff)
  const r = pick<Recipe>([PUR, { art: "add", a: "mdi", b: "butandiol" }, { art: "add", a: "hdi", b: "hexandiamin" }]);
  const urea = r.b === "hexandiamin";
  // die Frage nennt das Paar: zwei Aufgaben einer Runde lesen sich nicht gleich
  const pair = `${r.a === "hdi" ? "HDI" : r.a === "mdi" ? "MDI" : monoName(r.a)} + ${monoName(r.b!)}`;
  return task(T(`${pair}: Was wird bei dieser Polyaddition abgespalten?`, `${pair}: what is split off in this polyaddition?`), T("Nichts", "Nothing"), [
    d("H₂O", "add-wasser", T("Bei der Polyaddition bleiben alle Atome im Polymer. Nur ein H‑Atom wandert.", "In polyaddition all atoms stay in the polymer. Only an H atom moves.")),
    d("CO₂", "add-wasser", T("CO₂ entsteht nur, wenn Isocyanat mit Wasser reagiert (Schaum).", "CO₂ only forms when isocyanate reacts with water (foam).")),
    d("N₂", "add-wasser", urea ? T("Die N‑Atome bleiben in der Harnstoffgruppe –NH–⁠CO–⁠NH–⁠. Es entweicht nichts.", "The N atoms stay in the urea group –NH–⁠CO–⁠NH–⁠. Nothing escapes.")
      : T("Das N bleibt in der Urethangruppe –NH–⁠CO–⁠O–⁠. Es entweicht nichts.", "The N stays in the urethane group –NH–⁠CO–⁠O–⁠. Nothing escapes.")),
  ], {
    vis: mech(r, ["join"], arrowKey(r, ["join"])),
    hint: T("Zähl die Atome vorher und nachher: Fehlt am Ende etwas?", "Count the atoms before and after: is anything missing at the end?"),
    tip: T("Vergleiche die Atome: Steckt jedes Atom der beiden Monomere im Produkt?", "Compare the atoms: is every atom of both monomers in the product?"),
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
    tip: T("Das O–H verliert etwas, das N gewinnt etwas. Was ist es?", "The O–H loses something, the N gains something. What is it?"),
    explain: T("–⁠N=C=O + HO– → –**NH**–CO–⁠O–⁠: das **H‑Atom** wandert, die Urethangruppe entsteht.", "–⁠N=C=O + HO– → –**NH**–CO–⁠O–⁠: the **H atom** moves, the urethane group forms."),
  });
}

function urethan(): Task {
  const amin = Math.random() < 0.4;
  const U = T("Urethangruppe", "Urethane group"), H = T("Harnstoffgruppe", "Urea group"), E = T("Esterbindung", "Ester bond"), A = T("Amidbindung", "Amide bond");
  return task(T(`Welche Gruppe entsteht aus –⁠N=C=O und ${amin ? "–NH₂" : "–OH"}?`, `Which group forms from –⁠N=C=O and ${amin ? "–NH₂" : "–OH"}?`), amin ? H : U, [
    d(amin ? U : H, "ester-urethan", amin ? T("Urethan entsteht mit –OH. Mit –NH₂ entsteht Harnstoff.", "Urethane forms with –OH. With –NH₂ urea forms.") : T("Harnstoff entsteht mit –NH₂. Mit –OH entsteht Urethan.", "Urea forms with –NH₂. With –OH urethane forms.")),
    d(E, "ester-urethan", T("Esterbindungen entstehen aus –COOH und –OH.", "Ester bonds form from –COOH and –OH.")),
    d(A, "ester-amid", T("Amidbindungen entstehen aus –COOH und –NH₂.", "Amide bonds form from –COOH and –NH₂.")),
  ], {
    hint: T("Welches Atom bringt der Partner des Isocyanats mit: O oder N?", "Which atom does the isocyanate's partner bring: O or N?"),
    tip: T(`Der Partner bringt ein ${amin ? "N" : "O"}‑Atom mit. Ester und Amid gibt es nur mit –COOH.`, `The partner brings an ${amin ? "N" : "O"} atom. Esters and amides need –COOH.`),
    explain: amin ? T("–NH–⁠CO–⁠NH–⁠: **Harnstoffgruppe** (Polyharnstoff).", "–NH–⁠CO–⁠NH–⁠: **urea group** (polyurea).") : T("–NH–⁠CO–⁠O–⁠: **Urethangruppe** (Polyurethan, PUR).", "–NH–⁠CO–⁠O–⁠: **urethane group** (polyurethane, PUR)."),
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
  const one = c.vis.k === "mono";
  // Namen in der Frage: mehrere Aufgaben dieser Art in einer Runde lesen sich verschieden
  const short = (id: string) => (id === "badge" ? T("Diepoxid", "diepoxide") : id === "hdi" ? "HDI" : id === "mdi" ? "MDI" : monoName(id));
  const names = c.vis.k === "mono" ? short(c.vis.id) : c.vis.k === "pair" ? `${short(c.vis.a)} + ${short(c.vis.b!)}` : "";
  return task(one ? T(`Welche Reaktionsart passt zu diesem Monomer (${names})?`, `Which type of reaction suits this monomer (${names})?`) : T(`Welche Reaktionsart passt zu ${names}?`, `Which type of reaction suits ${names}?`), A[c.art],
    (["poly", "kond", "add"] as const).filter(x => x !== c.art).map(x => d(A[x], x === "poly" ? "kond-doppelbindung" : "art-verwechselt", WHY[x])), {
      vis: c.vis,
      hint: T("Schau auf die Gruppen: C=C, Säure + Alkohol/Amin oder N=C=O/Epoxid? Wird dabei ein kleines Molekül frei?", "Look at the groups: C=C, acid + alcohol/amine, or N=C=O/epoxide? Is a small molecule released?"),
      tip: (one ? T("Hat das Monomer eine C=C-Zweifachbindung?", "Does the monomer have a C=C double bond?") : T("Geht bei der Verknüpfung ein kleines Molekül weg – oder wandert nur ein H?", "Does a small molecule leave when they link – or does just an H move?")),
      explain: boldLead(WHY[c.art]),
    });
}

function epoxid(): Task {
  return task(T("Diepoxid + Härter (Amin): Was passiert mit dem Epoxidring?", "Diepoxide + hardener (amine): what happens to the epoxide ring?"), T("Öffnet sich, bindet an N", "Opens, binds to N"), [
    d(T("Spaltet Wasser ab", "Splits off water"), "add-wasser", T("Beim Öffnen des Rings wird nichts abgespalten. Ein H wandert zum O.", "Nothing is split off when the ring opens. An H moves to the O.")),
    d(T("Bleibt unverändert", "Stays unchanged"), "art-verwechselt", T("Der gespannte Dreierring ist die reaktive Stelle.", "The strained three-membered ring is the reactive site.")),
    d(T("Wird zur Zweifachbindung", "Becomes a double bond"), "kond-doppelbindung", T("Der Ring öffnet sich zu Einfachbindungen. Das O wird zur –OH-Gruppe.", "The ring opens into single bonds. The O becomes an –OH group.")),
  ], {
    vis: { k: "mono", id: "badge" },
    hint: T("Der Dreierring aus C, C und O steht unter Spannung.", "The three-membered ring of C, C and O is strained."),
    tip: T("Ein Dreierring ist stark gespannt. Was geschieht, wenn das N angreift?", "A three-membered ring is strongly strained. What happens when the N attacks?"),
    explain: T("Das N greift ein C‑Atom des Rings an. Der Ring **öffnet** sich, das H wandert zum O: –CH(OH)–CH₂–NH–.", "The N attacks a C atom of the ring. The ring **opens** and the H moves to the O: –CH(OH)–CH₂–NH–."),
  });
}

function epoxidNetz(): Task {
  return task(T("Warum wird Epoxidharz hart und schmilzt nicht mehr?", "Why does epoxy resin become hard and no longer melt?"), T("Ketten bilden ein Netz", "Chains form a network"), [
    d(T("Wasser verdunstet", "Water evaporates"), "add-wasser", T("Es entsteht kein Wasser – alle Atome bleiben im Harz.", "No water forms – all atoms stay in the resin.")),
    d(T("Ketten sind nur sehr lang", "Chains are just very long"), "netz-funktionalitaet", T("Lange einzelne Ketten würden beim Erwärmen weich. Erst das Netz macht hart.", "Long separate chains would soften on heating. Only the network makes it hard.")),
    d(T("Es kühlt stark ab", "It cools down a lot"), "netz-schmilzt", T("Abkühlen macht nur einzelne Ketten fest. Epoxidharz härtet durch die Reaktion – auch warm.", "Cooling only sets separate chains. Epoxy resin hardens through the reaction – even when warm.")),
  ], {
    vis: { k: "struct", s: "duro" },
    hint: T("Jede –NH₂-Gruppe hat zwei H‑Atome und reagiert zweimal.", "Each –NH₂ group has two H atoms and reacts twice."),
    tip: T("Zähle die N–H-Bindungen am Härter: Wie viele Partner kann ein Molekül binden?", "Count the N–H bonds on the hardener: how many partners can one molecule bind?"),
    explain: T("Diamin mit 4 N–H + Diepoxid → **Netz**: hart, schmilzt nicht (Zweikomponentenkleber).", "Diamine with 4 N–H + diepoxide → **network**: hard, does not melt (two-part adhesive)."),
  });
}

// ── Kapitel 6: Struktur und Eigenschaften ──────────────────────────────────────

const KL = () => tr({ thermo: "Thermoplast", elast: "Elastomer", duro: "Duroplast" }, { thermo: "Thermoplastic", elast: "Elastomer", duro: "Thermoset" });
type Kl = "thermo" | "elast" | "duro";
/** Stolperstein nach dem Paar (richtig, gewählt) */
export const klMiss = (right: Kl, chosen: Kl): string =>
  (right === "elast" && chosen === "duro") || (right === "duro" && chosen === "elast") ? "elast-duro"
    : right === "duro" && chosen === "thermo" ? "netz-schmilzt"
    : right === "thermo" && chosen === "duro" ? "thermo-duro"
    : "elast-thermo";
const KL_WHY = () => tr(
  { thermo: "Thermoplast: einzelne Ketten – beim Erwärmen weich und formbar.", elast: "Elastomer: wenige Brücken – dehnbar und springt zurück.", duro: "Duroplast: dichtes Netz – hart, schmilzt nicht." },
  { thermo: "Thermoplastic: separate chains – soft and shapeable when heated.", elast: "Elastomer: a few cross-links – stretchy and springs back.", duro: "Thermoset: dense network – hard, does not melt." },
);

/** Brücken in den Kettenbildern (StructPic): keine, 4, über 20 */
const N_BR = { de: { thermo: "keine Brücken", elast: "4 Brücken", duro: "über 20 Brücken" }, en: { thermo: "no cross-links", elast: "4 cross-links", duro: "over 20 cross-links" } } as const;
function klasse(): Task {
  const k = pick(["thermo", "elast", "duro"] as const);
  const K = KL(), W = KL_WHY();
  return task(T("Welche Kunststoffart zeigt das Bild?", "Which type of plastic does the picture show?"), K[k],
    (["thermo", "elast", "duro"] as const).filter(x => x !== k).map(x => d(K[x], klMiss(k, x),
      T(`Zähl die Brücken im Bild: hier ${N_BR.de[k]} → ${K[k]}. ${K[x]}: ${N_BR.de[x]}.`, `Count the cross-links in the picture: here ${N_BR.en[k]} → ${K[k].toLowerCase()}. ${K[x]}: ${N_BR.en[x]}.`))), {
      vis: { k: "struct", s: k as StructKind },
      hint: T("Achte auf die Brücken zwischen den Ketten: keine, wenige oder sehr viele.", "Look at the cross-links between the chains: none, a few or very many."),
      tip: T("Zähle die Brücken zwischen den Ketten im Bild.", "Count the cross-links between the chains in the picture."),
      explain: boldLead(W[k]),
    });
}

function schmelzen(): Task {
  const K = KL();
  return task(T("Welche Kunststoffe kann man einschmelzen und neu formen?", "Which plastics can be melted down and reshaped?"), K.thermo, [
    d(K.duro, klMiss("thermo", "duro"), T("Das Netz hält fest zusammen. Beim Erhitzen zersetzt sich ein Duroplast.", "The network holds together. On heating a thermoset decomposes.")),
    d(K.elast, klMiss("thermo", "elast"), T("Die Brücken verhindern das Schmelzen – Gummi lässt sich nicht einschmelzen.", "The cross-links prevent melting – rubber cannot be melted down.")),
  ], {
    hint: T("Was hält die Ketten zusammen – und kann Wärme das lösen?", "What holds the chains together – and can heat undo it?"),
    tip: T("Brücken zwischen Ketten sind feste Bindungen. Welche Kunststoffe haben keine?", "Cross-links between chains are strong bonds. Which plastics have none?"),
    explain: T("**Thermoplaste** (PE, PP, PET …) werden beim Erwärmen weich – man kann sie neu formen.", "**Thermoplastics** (PE, PP, PET …) soften on heating – they can be reshaped."),
  });
}

const COPO_WHY = (): Record<"stat" | "block" | "alt", string> => tr(
  { stat: "Statistisch: die Monomere folgen zufällig aufeinander.", block: "Block: erst viele gleiche, dann viele andere.", alt: "Alternierend: immer abwechselnd." },
  { stat: "Random: the monomers follow in no fixed order.", block: "Block: first many of one, then many of the other.", alt: "Alternating: always taking turns." },
);
const COPO = () => tr({ stat: "Statistisches Copolymer", block: "Blockcopolymer", alt: "Alternierendes Copolymer" }, { stat: "Random copolymer", block: "Block copolymer", alt: "Alternating copolymer" });

function copolymer(): Task {
  const kind = pick(["stat", "block", "alt"] as const);
  const [a, b] = pick([["styrol", "butadien"], ["ethen", "propen"], ["styrol", "acrylnitril"]] as [VinylId, VinylId][]);
  const n = 10;
  const seq = kind === "block" ? [...Array(5).fill(a), ...Array(5).fill(b)]
    : kind === "alt" ? Array.from({ length: n }, (_, i) => (i % 2 ? b : a))
    : [a, a, b, a, b, b, b, a, b, a];
  const C = COPO();
  const WHY = COPO_WHY();
  return task(T("Welches Copolymer zeigt die Kügelchen-Kette?", "Which copolymer does the bead chain show?"), C[kind],
    (["stat", "block", "alt"] as const).filter(x => x !== kind).map(x => d(C[x], "copo-verwechselt", WHY[x])), {
      vis: { k: "beads", seq },
      hint: T("Sieh dir die Reihenfolge der Farben an.", "Look at the order of the colours."),
      tip: T("Lies die Farben der Reihe nach: Wechseln sie immer, selten oder zufällig?", "Read the colours in order: do they change every time, rarely or at random?"),
      explain: boldLead(WHY[kind]),
    });
}

/** Antworten sind Bilder: Gefäß mit Kügelchen (nur Monomer, wenige lange Ketten + Monomer, viele kurze Ketten, ein Riesenmolekül) */
function wachstum(): Task {
  const kette = Math.random() < 0.5;
  const seq = kette ? ["styrol"] : ["terephthalsaeure", "ethandiol"];
  const LONG = T("Sehr lange Ketten und viel Monomer", "Very long chains and lots of monomer"), SHORT = T("Kurze Ketten (im Mittel 10 Bausteine), kaum Monomer", "Short chains (about 10 repeat units), hardly any monomer");
  const MONO = T("Nur Monomer, keine Ketten", "Only monomer, no chains"), GIANT = T("Ein Riesenmolekül", "One giant molecule");
  const pics: Record<string, Vis> = { [LONG]: { k: "pot", s: "long", seq }, [SHORT]: { k: "pot", s: "short", seq }, [MONO]: { k: "pot", s: "mono", seq }, [GIANT]: { k: "pot", s: "giant", seq } };
  return task(kette ? T("Radikalische Polymerisation, kurz nach dem Start: Was ist im Gefäß?", "Radical polymerisation, shortly after the start: what is in the vessel?")
    : T("Polykondensation bei 90 % Umsatz: Was ist im Gefäß?", "Polycondensation at 90 % conversion: what is in the vessel?"), kette ? LONG : SHORT, [
    kette ? d(SHORT, "kette-spaet", T("So sieht Stufenwachstum aus. Hier wachsen wenige Ketten sehr schnell.", "That is what step growth looks like. Here a few chains grow very fast."))
      : d(LONG, "kette-sofort", T("Beim Stufenwachstum reagieren alle Moleküle. Bei 90 % Umsatz ist kaum noch Monomer übrig.", "In step growth all molecules react. At 90 % conversion hardly any monomer is left.")),
    d(MONO, kette ? "kette-spaet" : "kette-sofort", T("Die Reaktion läuft schon – es sind bereits Ketten entstanden.", "The reaction is already running – chains have already formed.")),
    d(GIANT, kette ? "kette-spaet" : "kette-sofort", kette ? T("Beim Kettenwachstum wachsen viele getrennte Ketten – ein einziges Riesenmolekül entsteht nie.", "In chain growth many separate chains grow – a single giant molecule never forms.")
      : T("So weit ist es noch nicht – lange Ketten entstehen erst bei fast 100 % Umsatz.", "Not that far yet – long chains only form at almost 100 % conversion.")),
  ], {
    pics,
    hint: T("Kettenwachstum: nur aktive Enden wachsen. Stufenwachstum: jede Gruppe reagiert.", "Chain growth: only active ends grow. Step growth: every group reacts."),
    tip: (kette ? T("Nur wenige Radikale sind aktiv. Was passiert inzwischen mit dem übrigen Monomer?", "Only a few radicals are active. What happens to the rest of the monomer meanwhile?") : T("Jedes Molekül reagiert mit Nachbarn. Riesige Moleküle brauchen fast 100 % Umsatz.", "Every molecule reacts with neighbours. Giant molecules need almost 100 % conversion.")),
    explain: kette ? T("**Kettenwachstum**: Wenige aktive Ketten wachsen schnell. Freies Monomer bleibt lange übrig.", "**Chain growth**: few active chains grow fast. Free monomer is left for a long time.")
      : T("**Stufenwachstum**: Bei 90 % Umsatz sind die Ketten im Mittel erst 10 Bausteine lang. Lange Ketten erst ganz am Ende.", "**Step growth**: at 90 % conversion chains are only 10 repeat units long on average. Long chains only at the very end."),
  });
}

/** Gegenstände mit ihrer Eigenschaft (kein Fachname in der Frage); Satz zum Ding vor der Definition */
const ALLTAG = () => tr([
  { item: "ein Topfgriff, der am heißen Topf hart bleibt", k: "duro" as const, fact: "Der Griff bleibt auch sehr heiß hart.", s: "Der Griff wird auch sehr heiß nie weich und schmilzt nicht – ein **Duroplast**." },
  { item: "eine Arbeitsplatte, die heiße Töpfe aushält", k: "duro" as const, fact: "Die Oberfläche bleibt unter heißen Töpfen hart.", s: "Ihre Oberfläche hält heiße Töpfe aus, ohne weich zu werden – ein **Duroplast**." },
  { item: "ein Autoreifen", k: "elast" as const, fact: "Der Reifen federt und schmilzt nicht.", s: "Ein Reifen federt und schmilzt auf heißer Straße nicht – ein **Elastomer**." },
  { item: "ein Gummiband", k: "elast" as const, fact: "Das Gummiband dehnt sich und springt zurück.", s: "Ein Gummiband lässt sich dehnen und springt zurück – typisch für ein **Elastomer**." },
  { item: "eine PET-Flasche, aus der man Fasern für Fleecepullis macht", k: "thermo" as const, fact: "Die Flasche lässt sich einschmelzen.", s: "Man kann sie einschmelzen und neu formen – ein **Thermoplast**." },
  { item: "eine Plastiktüte", k: "thermo" as const, fact: "Die Tüte wird warm weich.", s: "Sie wird warm weich und lässt sich verformen – ein **Thermoplast**." },
], [
  { item: "a pan handle that stays hard on a hot pan", k: "duro" as const, fact: "The handle stays hard even when very hot.", s: "The handle never softens or melts, even when very hot – a **thermoset**." },
  { item: "a worktop that can take hot pans", k: "duro" as const, fact: "The surface stays hard under hot pans.", s: "Its surface takes hot pans without softening – a **thermoset**." },
  { item: "a car tyre", k: "elast" as const, fact: "The tyre is springy and does not melt.", s: "A tyre is springy and does not melt on a hot road – an **elastomer**." },
  { item: "a rubber band", k: "elast" as const, fact: "The rubber band stretches and springs back.", s: "A rubber band stretches and springs back – typical of an **elastomer**." },
  { item: "a PET bottle made into fleece fibres", k: "thermo" as const, fact: "The bottle can be melted down.", s: "It can be melted down and reshaped – a **thermoplastic**." },
  { item: "a plastic bag", k: "thermo" as const, fact: "The bag softens when warm.", s: "It softens when warm and can be shaped – a **thermoplastic**." },
]);
/** was die gewählte (falsche) Art täte – mit dem Ding zusammen die Rückmeldung */
const KL_WOULD = () => tr({ thermo: "Ein Thermoplast würde heiß weich werden.", elast: "Ein Elastomer ist dehnbar, schmilzt aber nicht.", duro: "Ein Duroplast ist hart und schmilzt nie." },
  { thermo: "A thermoplastic would soften when hot.", elast: "An elastomer is stretchy but does not melt.", duro: "A thermoset is hard and never melts." });
function klasseAlltag(): Task {
  const K = KL(), W = KL_WHY(), WOULD = KL_WOULD();
  const c = pick(ALLTAG());
  return task(T(`Zu welcher Kunststoffart gehört ${c.item}?`, `Which type of plastic is ${c.item}?`), K[c.k],
    (["thermo", "elast", "duro"] as const).filter(x => x !== c.k).map(x => d(K[x], klMiss(c.k, x), `${WOULD[x]} ${c.fact}`)), {
      hint: T("Wird es heiß, muss es formstabil sein? Soll es sich dehnen? Oder schmelzbar sein?", "Must it keep its shape when hot? Should it stretch? Or should it melt?"),
      tip: T("Stell dir den Gegenstand heiß vor: weich, hart oder federnd?", "Imagine the object hot: soft, hard or springy?"),
      explain: `${c.s} ${cap(W[c.k].replace(/^[^:]+: /, ""))}`,
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

// ── Ordnen ─────────────────────────────────────────────────────────────────────

/** K2: vier Standbilder mit Pfeilen (Start, erstes Anlagern, Anlagern an die Kette, Abbruch) in die richtige Reihenfolge bringen */
function ordnen(): Task {
  // immer Styrol: wenige Atome je Bild, die Pfeile bleiben lesbar
  const m: VinylId = "styrol";
  const r: Recipe = { art: "poly", a: m, method: "dbpo" };
  const stop = Math.random() < 0.3 ? "disp" : "comb";
  const seqs = [["heat"], ["heat", `add:${m}`], ["heat", `add:${m}`, `add:${m}`, `add:${m}`], ["heat", `add:${m}`, `add:${m}`, stop]];
  const cards0 = seqs.map(acts => mech(r, acts, arrowKey(r, acts)));
  const N = tr(["Starter zerfällt", "erstes Anlagern", "Anlagern an die Kette", stop === "comb" ? "Abbruch: Rekombination" : "Abbruch: Disproportionierung"],
    ["Initiator splits", "first addition", "addition to the chain", stop === "comb" ? "Termination: combination" : "Termination: disproportionation"]);
  // gemischt, aber nie schon in der richtigen Reihenfolge
  // gemischt, kein Bild auf seinem richtigen Platz
  let perm = shuffle([0, 1, 2, 3]);
  while (perm.some((x, i) => x === i)) perm = shuffle([0, 1, 2, 3]);
  const cards = perm.map(i => cards0[i]), names = perm.map(i => N[i]);
  const correct = [0, 1, 2, 3].map(k => perm.indexOf(k));
  return {
    kind: "order", cards, names, correct, sol: tr("Start → Wachstum → Wachstum → Abbruch", "Initiation → propagation → propagation → termination"),
    prompt: T("Bringe die Schritte in die richtige Reihenfolge.", "Put the steps in the right order."),
    hint: T("Suche zuerst das Bild ohne Monomer.", "First find the picture without a monomer."),
    tip: T("Ohne Radikal geht nichts: Wo entsteht das erste Radikal? Wo verschwindet das letzte?", "Nothing happens without a radical: where does the first radical form? Where does the last one disappear?"),
    explain: T("Jeder Schritt braucht das Radikal aus dem Schritt davor.", "Each step needs the radical from the step before."),
    traps: [
      { values: { startFirst: 0 }, miss: "schritt-verwechselt", why: T("Ohne Starter gibt es kein Radikal. Das erste Radikal entsteht beim Zerfall des Starters.", "Without the initiator there is no radical. The first radical forms when the initiator splits.") },
      { values: { termLast: 0 }, miss: "schritt-verwechselt", why: T("Nach dem Abbruch gibt es kein Radikal mehr. Danach kann nichts mehr wachsen.", "After termination there is no radical left. Nothing can grow after it.") },
      { values: { addsOk: 0 }, miss: "radikal-bleibt", why: T("Erst ein Baustein, dann der nächste: Die Kette wird bei jedem Schritt um einen Baustein länger.", "One repeat unit, then the next: the chain gets one repeat unit longer at each step.") },
    ],
  };
}

// ── Kette bauen ────────────────────────────────────────────────────────────────

const plainStruct = (x: string) => x.replace(/[{}]/g, "");
const vinylItem = (v: VinylId): BuildItem => ({ id: v, name: vinyl(v).name, struct: plainStruct(vinyl(v).struct), hue: vinyl(v).hue, letter: vinyl(v).letter, ok: true });
// Kürzel in Großbuchstaben: nie mit einem Elementsymbol verwechselbar (Pa, Ce)
const SAT_LETTER: Partial<Record<VinylId, string>> = { ethen: "EA", propen: "PA", vinylchlorid: "CE", styrol: "EB" };

/** K1: Polymer aus 8 Bausteinen bauen – im Vorrat liegt auch das gesättigte Gegenstück (keine C=C, nicht einbaubar) */
function bauenHomo(): Task {
  const v = pick(["propen", "ethen", "vinylchlorid", "styrol"] as VinylId[]);
  const [satName, satStruct] = SAT[v]!;
  const pool = shuffle([vinylItem(v), { id: "sat", name: satName, struct: satStruct, hue: (v === "ethen" ? "yellow" : "light") as Hue, letter: SAT_LETTER[v]!, ok: false }]);
  return {
    kind: "build", pool, n: 8, goal: "homo", example: Array(8).fill(v),
    sol: T(`8 × ${vinyl(v).name}`, `8 × ${nm(v)}`),
    prompt: T(`Baue ${vinyl(v).polymer} aus 8 Bausteinen.`, `Build ${vinyl(v).polymer.toLowerCase()} from 8 repeat units.`),
    hint: T("Nur Moleküle mit C=C können eingebaut werden.", "Only molecules with a C=C can be built in."),
    tip: T("Vergleiche die Formeln im Vorrat: Wo steht eine Zweifachbindung?", "Compare the formulas in the store: where is a double bond?"),
    explain: T(`Jedes Kügelchen ist ein Baustein aus ${vinyl(v).name}. Seine C=C wird zur Einfachbindung in der Kette.`, `Each bead is a repeat unit from ${nm(v)}. Its C=C becomes a single bond in the chain.`),
    traps: [{ values: { pat: PAT.sat }, miss: "doppelbindung-fehlt", why: T(`${satName} hat keine C=C – es kann nicht eingebaut werden.`, `${satName} has no C=C – it cannot be built in.`) }],
  };
}

/** K6: Copolymer bauen – Block, abwechselnd oder zufällig */
function bauenCopo(): Task {
  const goal = pick(["block", "alt", "stat"] as const);
  const [a, b] = pick([["styrol", "butadien"], ["ethen", "propen"], ["styrol", "acrylnitril"]] as [VinylId, VinylId][]);
  const C = COPO(), WHY = COPO_WHY();
  const example = goal === "block" ? [a, a, a, a, b, b, b, b] : goal === "alt" ? Array.from({ length: 8 }, (_, i) => (i % 2 ? b : a)) : [a, b, b, a, b, a, a, b];
  const WHAT = tr({ block: "ein Blockcopolymer", alt: "ein alternierendes Copolymer", stat: "ein statistisches Copolymer" }, { block: "a block copolymer", alt: "an alternating copolymer", stat: "a random copolymer" });
  const what = WHAT[goal];
  const pats = { block: PAT.block, alt: PAT.alt, stat: PAT.stat } as const;
  return {
    kind: "build", pool: [vinylItem(a), vinylItem(b)], n: 8, goal, example,
    sol: T(`z. B. ${example.map(x => vinyl(x).letter).join("–")} (Platz 1 bis 8)`, `e.g. ${example.map(x => vinyl(x).letter).join("–")} (places 1 to 8)`),
    prompt: T(`Baue ${what} aus ${vinyl(a).name} und ${vinyl(b).name}.`, `Build ${what} from ${nm(a)} and ${nm(b)}.`),
    hint: T("Die Farben zeigen die Reihenfolge der Monomere.", "The colours show the order of the monomers."),
    tip: T(`${C[goal]}: Wie folgen die beiden Monomere aufeinander?`, `${C[goal]}: how do the two monomers follow each other?`),
    explain: boldLead(WHY[goal]),
    traps: [
      ...(["block", "alt", "stat"] as const).filter(x => x !== goal).map(x => ({ values: { pat: pats[x] }, miss: "copo-verwechselt", why: tr(`Das ist ${WHAT[x]}. ${WHY[x]}`, `That is ${WHAT[x]}. ${WHY[x]}`) })),
      { values: { pat: PAT.one }, miss: "copo-verwechselt", why: T("Nur ein Monomer – das ist kein Copolymer. Ein Copolymer enthält beide.", "Only one monomer – that is not a copolymer. A copolymer contains both.") },
      // „fast nur ein Monomer“: Rückmeldung zur verlangten Art
      ...[a, b].map((x, maj) => ({ values: { pat: PAT.few, maj }, miss: "copo-verwechselt", why: {
        stat: T(`Fast nur ${vinyl(x).name}: Das ist kaum ein Copolymer. Statistisch heißt: beide Monomere oft und zufällig gemischt.`, `Almost only ${nm(x)}: that is hardly a copolymer. Random means: both monomers often and randomly mixed.`),
        block: T(`Fast nur ${vinyl(x).name}: Ein Blockcopolymer hat zwei lange Abschnitte – erst viele von einem, dann viele vom anderen.`, `Almost only ${nm(x)}: a block copolymer has two long sections – first many of one, then many of the other.`),
        alt: T(`Fast nur ${vinyl(x).name}: Alternierend heißt immer abwechselnd – beide Monomere gleich oft.`, `Almost only ${nm(x)}: alternating means always taking turns – both monomers equally often.`),
      }[goal] })),
    ],
  };
}

// ── Antippen im Bild ───────────────────────────────────────────────────────────

/** K4: im Polyester bzw. Polyamid die Bindung antippen, die bei der Polykondensation neu entstanden ist */
/** K5: Epoxidharz – die neue Bindung zwischen Harz und Härter antippen (zweite Frageform neben „Nebenprodukt?“) */
function epoxidBindungTap(): Task {
  const r: Recipe = { art: "add", a: "badge", b: "hexandiamin" };
  const acts = ["join"];
  const scene: TapScene = { k: "mech", r, acts, key: -1 };
  const snap = tapFrame(scene).snap;
  const vis = new Set(visibleAtoms(snap).map(a => a.id));
  const at = new Map(snap.atoms.map(a => [a.id, a]));
  const key = (a: string, b: string) => [a, b].sort().join("|");
  const heavy = (id: string) => at.get(id) && at.get(id)!.el !== "H" && at.get(id)!.el !== "" && !at.get(id)!.text;
  const bonds = snap.bonds.filter(b => vis.has(b.a) && vis.has(b.b) && heavy(b.a) && heavy(b.b) && (b.op ?? 1) > 0.5);
  const isNew = (b: { a: string; b: string }) => at.get(b.a)!.unit !== at.get(b.b)!.unit;
  const all = bonds.sort((p, q) => (at.get(p.a)!.x + at.get(p.b)!.x) - (at.get(q.a)!.x + at.get(q.b)!.x)).map(b => key(b.a, b.b));
  const news = bonds.filter(isNew).map(b => key(b.a, b.b));
  const parts = nearParts(snap, all, [news[0]], 1.9);
  const answer = news.filter(b => parts.includes(b));
  return tapTask({ zoom: true,
    scene, parts, answer, mode: "any", sol: T("die Bindung vom C des geöffneten Rings zum N", "the bond from the C of the opened ring to the N"),
    prompt: T("Tippe auf die Bindung, die zwischen Harz und Härter neu entstanden ist.", "Tap the bond that has newly formed between resin and hardener."),
    hint: T("Die farbigen Flächen zeigen Harz und Härter. Neu ist eine Bindung zwischen beiden.", "The coloured areas show resin and hardener. A new bond lies between the two."),
    tip: T("Welche Bindung gab es weder im Diepoxid noch im Diamin?", "Which bond existed neither in the diepoxide nor in the diamine?"),
    explain: T("Der Ring öffnet sich: Neu ist die Bindung vom C des Rings zum **N** des Amins. Das O bleibt als –OH zurück – nichts wird abgespalten.", "The ring opens: new is the bond from the ring's C to the **N** of the amine. The O stays behind as –OH – nothing is split off."),
    why: id => {
      const [a, b] = id.split("|").map(x => at.get(x)!);
      if (a.el === "O" || b.el === "O") return ["schnitt-falsch", T("Diese Bindung zum O gab es schon im Diepoxid. Neu ist die Bindung vom C zum N.", "This bond to the O was already in the diepoxide. New is the bond from the C to the N.")];
      if (a.el === "N" || b.el === "N") return ["schnitt-falsch", T("Diese Bindung gehörte schon zum Diamin. Neu ist die Bindung vom N zum C des geöffneten Rings.", "This bond already belonged to the diamine. New is the bond from the N to the C of the opened ring.")];
      return ["schnitt-falsch", T("Im Monomer war diese Bindung schon da.", "This bond was already there in the monomer.")];
    },
  });
}

function schnitt(): Task {
  const amide = Math.random() < 0.4;
  const r: Recipe = amide ? { art: "kond", a: "adipinsaeure", b: "hexandiamin" } : { art: "kond", a: "terephthalsaeure", b: "ethandiol" };
  const acts = ["join", `add:${r.a}`];
  const scene: TapScene = { k: "mech", r, acts, key: -1 };
  const snap = tapFrame(scene).snap;
  const vis = new Set(visibleAtoms(snap).map(a => a.id));
  const at = new Map(snap.atoms.map(a => [a.id, a]));
  const rings = new Set(Object.values(snap.rings).flat());
  const key = (a: string, b: string) => [a, b].sort().join("|");
  const heavy = (id: string) => at.get(id) && at.get(id)!.el !== "H" && at.get(id)!.el !== "";
  const bonds = snap.bonds.filter(b => vis.has(b.a) && vis.has(b.b) && heavy(b.a) && heavy(b.b) && !(rings.has(b.a) && rings.has(b.b)) && (b.op ?? 1) > 0.5);
  // neu = zwischen zwei Bausteinen (verschiedene unit) – C–O der Esterbindung bzw. C–N der Amidbindung
  const isNew = (b: { a: string; b: string }) => at.get(b.a)!.unit !== at.get(b.b)!.unit;
  const all = bonds.sort((p, q) => (at.get(p.a)!.x + at.get(p.b)!.x) - (at.get(q.a)!.x + at.get(q.b)!.x)).map(b => key(b.a, b.b));
  // Ausschnitt um eine neue Bindung (die mittlere): Bild groß, Nachbarbindungen als Fallen
  const news = bonds.filter(isNew).map(b => key(b.a, b.b));
  const parts = nearParts(snap, all, [news[Math.floor((news.length - 1) / 2)]], 1.9);
  const answer = news.filter(b => parts.includes(b));
  const X = amide ? "N" : "O", link = amide ? T("Amidbindung", "amide bond") : T("Esterbindung", "ester bond");
  return tapTask({ zoom: true,
    scene, parts, answer, mode: "any", sol: T(`die Bindung vom C der C=O zum ${X}`, `the bond from the C of the C=O to the ${X}`),
    prompt: T("Tippe auf eine Bindung, die bei der Polykondensation neu entstanden ist.", "Tap a bond that formed in the polycondensation."),
    hint: T(`Die farbigen Flächen zeigen die Bausteine. Neu ist eine Bindung zwischen zwei Bausteinen.`, `The coloured areas show the repeat units. A new bond lies between two repeat units.`),
    tip: T("Welche Bindung gab es in keinem der beiden Monomere?", "Which bond existed in neither of the two monomers?"),
    explain: T(`Neu ist die Bindung vom C der Säuregruppe zum ${X}: die **${link}**. Rückwärts spaltet Wasser sie wieder – das heißt **Hydrolyse**.`, `New is the bond from the C of the acid group to the ${X}: the **${link}**. Backwards, water splits it again – that is **hydrolysis**.`),
    why: id => {
      const [a, b] = id.split("|").map(x => at.get(x)!);
      const bond = snap.bonds.find(x => key(x.a, x.b) === id);
      if (bond && bond.o === 2) return ["ester-amid", T(`Die C=O gab es schon in der Säuregruppe. Neu ist die Bindung vom C zum ${X}.`, `The C=O was already in the acid group. New is the bond from the C to the ${X}.`)];
      if (a.el === X || b.el === X) return ["schnitt-falsch", T(`Diese Bindung gehörte schon zum ${amide ? "Diamin" : "Ethandiol"}. Neu ist die Bindung zwischen C=O und ${X}.`, `This bond already belonged to the ${amide ? "diamine" : "ethane-1,2-diol"}. New is the bond between C=O and ${X}.`)];
      return ["schnitt-falsch", T("Im Monomer war diese Bindung schon da.", "This bond was already there in the monomer.")];
    },
  });
}

/** K2: Folge den Pfeilen – welches C trägt nach dem Anlagern das Radikal? */
function radikalTap(): Task {
  const m = pick(["styrol", "vinylchlorid"] as VinylId[]);
  const r: Recipe = { art: "poly", a: m, method: "dbpo" }, acts = ["heat", `add:${m}`, `add:${m}`];
  const scene: TapScene = { k: "mech", r, acts, key: arrowKey(r, acts) };
  const parts = visibleAtoms(tapFrame(scene).snap).filter(a => a.el === "C").sort((p, q) => p.x - q.x || p.y - q.y).map(a => a.id);
  const rings = Object.values(tapFrame(scene).snap.rings).flat();
  return tapTask({
    scene, parts, answer: ["u1cb"], sol: T("das C mit der Seitengruppe des neuen Monomers", "the C with the side group of the new monomer"),
    prompt: T(`Folge den Pfeilen. Tippe auf das C‑Atom, das danach das Radikal trägt.`, `Follow the arrows. Tap the C atom that carries the radical afterwards.`),
    hint: T("Ein Elektron der C=C bildet mit dem Radikal die neue Bindung. Das andere bleibt übrig.", "One electron of the C=C forms the new bond with the radical. The other is left over."),
    tip: T("Das CH₂ bindet an die Kette. Wo bleibt das zweite Elektron der C=C?", "The CH₂ bonds to the chain. Where does the second electron of the C=C stay?"),
    explain: T(`Das Radikal bindet an das CH₂. Das ungepaarte Elektron sitzt danach am C mit der Seitengruppe von ${nm(m)}.`, `The radical binds to the CH₂. The unpaired electron then sits on the C with the side group of ${nm(m)}.`),
    why: id => id === "u1ca" ? ["radikal-bleibt", T("Das CH₂ bindet an die Kette. Das ungepaarte Elektron bleibt am anderen C der Zweifachbindung.", "The CH₂ bonds to the chain. The unpaired electron stays on the other C of the double bond.")]
      : id === "u0cb" ? ["radikal-bleibt", T("Das Elektron des alten Kettenendes steckt jetzt in der neuen Bindung.", "The electron of the old chain end is now in the new bond.")]
      : rings.includes(id) ? ["gruppe-verwechselt", T("Der Benzolring bleibt unverändert. Es reagiert nur die C=C.", "The benzene ring stays unchanged. Only the C=C reacts.")]
      : ["radikal-bleibt", T("Dieses C ist schon fest in der Kette. Das Radikal sitzt immer am wachsenden Ende.", "This C is already fixed in the chain. The radical always sits at the growing end.")],
  });
}

/** K3: Ziegler-Natta – wo lagert sich das nächste Propen an? */
function freieStelleTap(): Task {
  const r: Recipe = { art: "poly", a: "propen", method: "zn" };
  const scene: TapScene = { k: "mech", r, acts: ["act"], key: -1 };
  const parts = visibleAtoms(tapFrame(scene).snap).filter(a => a.vac || ["Ti", "Cl", "Al"].includes(a.el) || a.id === "ale0").sort((p, q) => p.x - q.x || p.y - q.y).map(a => a.id);
  return tapTask({
    scene, parts, answer: ["tvac"], sol: T("die freie Stelle am Titan (grauer Kreis)", "the vacant site at the titanium (grey circle)"),
    prompt: T("Tippe auf die Stelle, an der sich das nächste Propen anlagert.", "Tap the place where the next propene attaches."),
    hint: T("Suche am Titan den Platz, an dem noch nichts gebunden ist.", "Find the place on the titanium where nothing is bonded yet."),
    tip: T("Suche am Titan den Platz, an dem noch nichts gebunden ist.", "Find the place on the titanium where nothing is bonded yet."),
    explain: T("Das Propen lagert sich an der **freien Stelle** am Titan an. Dann schiebt es sich zwischen Titan und Kette.", "The propene attaches at the **vacant site** on the titanium. Then it slides in between titanium and chain."),
    why: id => id === "tti" ? ["zn-radikal", T("Richtig am Titan – aber genau an seiner freien Stelle, dem grauen Kreis.", "Right at the titanium – but exactly at its vacant site, the grey circle.")]
      : id === "ale0" ? ["zn-radikal", T("Am Kettenende sitzt hier kein Radikal. Die Kette hängt am Titan.", "There is no radical at the chain end here. The chain hangs on the titanium.")]
      : id.includes("cl") ? ["zn-radikal", T("Die Cl‑Atome halten das Titan. Angelagert wird an der freien Stelle.", "The Cl atoms hold the titanium. Attachment is at the vacant site.")]
      : ["zn-radikal", T("Das Al hat nur die Ethylgruppe übergeben. Angelagert wird am Titan.", "The Al only handed over the ethyl group. Attachment happens at the titanium.")],
  });
}

/** K3: welches Atom des polaren Monomers vergiftet das Titan? */
function giftTap(): Task {
  const m = pick(["vinylchlorid", "mma"] as VinylId[]);
  const r: Recipe = { art: "poly", a: m, method: "zn" }, acts = ["act", `add:${m}`];
  // Standardlage: das Monomer steht neben dem Titan, noch nicht zur freien Stelle gedreht (verrät nichts)
  const scene: TapScene = { k: "mech", r, acts, key: 1, noArrows: true };
  const snap = tapFrame(scene).snap, after = tapAfter(scene);
  const het = after.bonds.find(b => b.k === "coord" && (b.a === "tti" || b.b === "tti"));
  const ans = het ? (het.a === "tti" ? het.b : het.a) : "";
  const parts = visibleAtoms(snap).filter(a => a.id.startsWith("n")).sort((p, q) => p.x - q.x || p.y - q.y).map(a => a.id);
  const el = snap.atoms.find(a => a.id === ans)?.el ?? "Cl";
  // bei MMA haben beide O freie Paare – gemeint ist das O der C=O-Gruppe (stärker gebunden)
  const who = el === "O" ? T("das O der C=O-Gruppe", "the O of the C=O group") : el === "N" ? T("das N der C≡N-Gruppe", "the N of the C≡N group") : T(`das ${el}‑Atom`, `the ${el} atom`);
  const Who = cap(who);
  // das ganze Titan mit seinen Cl im Ausschnitt (sonst wirkt der Rand wie abgeschnitten)
  const tiCl = snap.bonds.flatMap(b => (b.a === "tti" ? [b.b] : b.b === "tti" ? [b.a] : [])).filter(id => snap.atoms.find(a => a.id === id)?.el === "Cl");
  return tapTask({ zoom: true, zoomTo: [...snap.atoms.filter(a => parts.includes(a.id) && a.el !== "H").map(a => a.id), "tvac", "tti", ...tiCl],
    scene, parts, answer: [ans], sol: T(`${who} – bindet mit einem freien Elektronenpaar`, `${who} – binds with a lone pair`),
    prompt: T(`${cap(nm(m))} kommt an das Titan. Tippe auf das Atom, das an das Titan bindet und es vergiftet.`, `${cap(nm(m))} reaches the titanium. Tap the atom that binds to the titanium and poisons it.`),
    hint: T("Gesucht ist ein Atom mit freiem Elektronenpaar: Cl, O, N oder F.", "Look for an atom with a lone pair: Cl, O, N or F."),
    tip: T("Welches Atom hat freie Elektronenpaare (Striche am Symbol)?", "Which atom has lone pairs (lines at the symbol)?"),
    explain: T(`Es besetzt die freie Stelle: Das Titan ist **vergiftet**.`, `It blocks the vacant site: the titanium is **poisoned**.`),
    why: id => {
      const a = snap.atoms.find(x => x.id === id);
      return a?.el === "C" ? ["zn-polar", T(`Die C=C würde eingebaut. ${Who} bindet aber fester.`, `The C=C would be inserted. But ${who} binds more firmly.`)]
        : a?.el === "H" ? ["zn-polar", T("H hat kein freies Elektronenpaar. Suche Cl, O, N oder F.", "H has no lone pair. Look for Cl, O, N or F.")]
        : ["zn-polar", T(`Am Titan bindet hier ${who}.`, `Here ${who} binds to the titanium.`)];
    },
  });
}

/** K5: welches H wandert zum N des Isocyanats? */
function hTap(): Task {
  const r: Recipe = pick<Recipe>([{ art: "add", a: "hdi", b: "butandiol" }, { art: "add", a: "hdi", b: "ethandiol" }, { art: "add", a: "mdi", b: "butandiol" }]);
  const acts = ["join"];
  const scene: TapScene = { k: "mech", r, acts, key: arrowKey(r, acts), noArrows: true };
  const snap = tapFrame(scene).snap, after = tapAfter(scene);
  const nb = (s: typeof snap, id: string) => s.bonds.filter(b => b.a === id || b.b === id).map(b => (b.a === id ? b.b : b.a));
  const el = (id: string) => snap.atoms.find(a => a.id === id)?.el;
  const vis = visibleAtoms(snap).filter(a => a.el === "H" || a.el === "O");
  const ans = vis.find(a => a.el === "H" && nb(snap, a.id).some(x => el(x) === "O") && nb(after, a.id).some(x => after.atoms.find(y => y.id === x)?.el === "N"))?.id ?? "";
  const parts = nearParts(snap, vis.sort((p, q) => p.x - q.x || p.y - q.y).map(a => a.id), [ans], 3.4);
  // das N, zu dem das H wandert, gehört ins Bild (die Frage nennt es)
  const nTo = after.bonds.flatMap(b => (b.a === ans ? [b.b] : b.b === ans ? [b.a] : [])).find(x => after.atoms.find(y => y.id === x)?.el === "N");
  return tapTask({ zoom: true, ...(nTo ? { zoomWith: [nTo] } : {}),
    scene, parts, answer: [ans], sol: T("das H der –OH-Gruppe, die zur N=C=O-Gruppe zeigt", "the H of the –OH group facing the N=C=O group"),
    prompt: T("Tippe auf das H‑Atom, das gleich zum N wandert.", "Tap the H atom that is about to move to the N."),
    hint: T("Das O der –OH-Gruppe bindet an das C der N=C=O-Gruppe. Sein H geht zum N.", "The O of the –OH group binds to the C of the N=C=O group. Its H goes to the N."),
    tip: T("Suche die –OH-Gruppe, die zur N=C=O-Gruppe zeigt.", "Look for the –OH group facing the N=C=O group."),
    explain: T("Das H der –OH-Gruppe wandert zum N: –NH–⁠CO–⁠O–⁠, die **Urethangruppe**. Nichts wird abgespalten.", "The H of the –OH group moves to the N: –NH–⁠CO–⁠O–⁠, the **urethane group**. Nothing is split off."),
    why: id => el(id) === "O" ? ["h-wandert-falsch", T("Das O bleibt und bindet an das C. Gesucht ist das H daran.", "The O stays and binds to the C. The H on it is wanted.")]
      : nb(snap, id).some(x => el(x) === "O") ? ["h-wandert-falsch", T("Diese –OH sitzt am anderen Ende. Es reagiert die –OH, die zur N=C=O-Gruppe zeigt.", "This –OH is at the other end. The –OH facing the N=C=O group reacts.")]
      : ["h-wandert-falsch", T("C–H-Bindungen bleiben. Es wandert das H der –OH-Gruppe.", "C–H bonds stay. The H of the –OH group moves.")],
  });
}

/** K4: die drei Atome antippen, die als Wasser abgehen */
function wasserTap(): Task {
  const r: Recipe = pick<Recipe>([{ art: "kond", a: "terephthalsaeure", b: "ethandiol" }, { art: "kond", a: "adipinsaeure", b: "butandiol" }, { art: "kond", a: "adipinsaeure", b: "hexandiamin" }]);
  const scene: TapScene = { k: "mech", r, acts: ["join"], key: 1, noArrows: true };
  const snap = tapFrame(scene).snap, after = tapAfter(scene);
  const gone = new Set(snap.atoms.filter(a => !after.atoms.some(b => b.id === a.id)).map(a => a.id));
  const vis = visibleAtoms(snap).filter(a => a.el === "H" || a.el === "O").sort((p, q) => p.x - q.x || p.y - q.y);
  const ids = vis.map(a => a.id), answer = ids.filter(id => gone.has(id));
  const parts = nearParts(snap, ids, answer, 1.9);
  const dbl = (id: string) => snap.bonds.some(b => (b.a === id || b.b === id) && b.o === 2);
  const amine = r.b === "hexandiamin";
  // am N sitzen zwei H – beide sind gleichwertig, jedes darf als H des Wassers gewählt werden
  const same: Record<string, string> = {};
  for (const h of answer) {
    if (snap.atoms.find(a => a.id === h)?.el !== "H") continue;
    const nb = snap.bonds.flatMap(b => (b.a === h ? [b.b] : b.b === h ? [b.a] : []))[0];
    if (snap.atoms.find(a => a.id === nb)?.el !== "N") continue;
    for (const b of snap.bonds) { const o = b.a === nb ? b.b : b.b === nb ? b.a : ""; if (o && o !== h && parts.includes(o) && snap.atoms.find(a => a.id === o)?.el === "H") same[o] = h; }
  }
  return tapTask({ zoom: true, ...(Object.keys(same).length ? { same } : {}),
    scene, parts, answer, mode: "multi", sol: T(`das –OH der Säure und das H ${amine ? "des Amins" : "des Alkohols"}`, `the –OH of the acid and the H of the ${amine ? "amine" : "alcohol"}`),
    prompt: T("Tippe die drei Atome an, die zusammen als Wasser abgehen.", "Tap the three atoms that leave together as water."),
    hint: T(`Die Säure gibt OH ab, ${amine ? "das Amin" : "der Alkohol"} ein H.`, `The acid gives off OH, the ${amine ? "amine" : "alcohol"} an H.`),
    tip: T("Sieh dir die zwei Enden an, die sich gegenüberstehen.", "Look at the two ends that face each other."),
    explain: T(`–OH der Säure + H ${amine ? "des Amins" : "des Alkohols"} → **Wasser H₂O**. ${amine ? "Das N" : "Das O des Alkohols"} bleibt in der neuen Bindung.`, `–OH of the acid + H of the ${amine ? "amine" : "alcohol"} → **water H₂O**. The ${amine ? "N" : "alcohol's O"} stays in the new bond.`),
    extra: [{ values: { wrong: -1 }, miss: "byp-falsch", why: T("Noch nicht vollständig: Wasser H₂O hat drei Atome – zwei H und ein O.", "Not complete yet: water H₂O has three atoms – two H and one O.") }],
    why: id => dbl(id) ? ["byp-falsch", T("Das =O bleibt am C – es gehört zur neuen Bindung.", "The =O stays on the C – it belongs to the new bond.")]
      : snap.atoms.find(a => a.id === id)?.el === "O" ? ["byp-falsch", T("Das O des Alkohols bleibt in der Esterbindung. Das O im Wasser stammt aus der –COOH.", "The O of the alcohol stays in the ester bond. The O in the water comes from the –COOH.")]
      : ["byp-falsch", T("Dieses H bleibt. Es geht das H ab, das an der reagierenden Gruppe gegenüber sitzt.", "This H stays. The H at the reacting group opposite leaves.")],
  });
}

/** K1: die C‑Atome eines Bausteins in der Kette antippen */
function bausteinTap(): Task {
  const id = pick(["propen", "vinylchlorid", "styrol"] as VinylId[]);
  const scene: TapScene = { k: "chain", id, n: 3 };
  const parts = [0, 1, 2].flatMap(i => [`k${i}ca`, `k${i}cb`]);
  return tapTask({ zoom: true,
    scene, parts, answer: [], mode: "pair", halos: false, sol: T("zwei benachbarte C‑Atome der Hauptkette", "two neighbouring C atoms of the main chain"),
    prompt: T("Tippe die **zwei** C‑Atome der Hauptkette an, die zusammen **einen** Baustein bilden.", "Tap the **two** C atoms of the main chain that together form **one** repeat unit."),
    hint: T(`Ein Baustein entsteht aus einem Monomer ${nm(id)}: so viele C‑Atome wie in seiner C=C.`, `One repeat unit comes from one monomer ${nm(id)}: as many C atoms as in its C=C.`),
    tip: T("Das Muster wiederholt sich: Suche zwei C nebeneinander, eines mit Seitengruppe.", "The pattern repeats: look for two neighbouring C, one with a side group."),
    explain: T("Ein Baustein = zwei benachbarte C‑Atome der Hauptkette: –CH₂–CH(Seitengruppe)–. Danach wiederholt sich das Muster.", "One repeat unit = two neighbouring C atoms of the main chain: –CH₂–CH(side group)–. Then the pattern repeats."),
    extra: [
      { field: "n", value: 1, miss: "atome-statt-bausteine", why: T("Ein Baustein hat zwei C‑Atome der Hauptkette – so viele wie die C=C im Monomer.", "A repeat unit has two C atoms of the main chain – as many as the C=C in the monomer.") },
      { field: "n", min: 3, miss: "bindungen-gezaehlt", why: T("Zu viel: Nach zwei C‑Atomen wiederholt sich das Muster.", "Too many: the pattern repeats after two C atoms.") },
      { values: { adj: 0 }, miss: "atome-statt-bausteine", why: T("Ein Baustein hängt zusammen: zwei C nebeneinander.", "A repeat unit hangs together: two C next to each other.") },
    ],
  });
}

const GENS: Record<string, () => Task> = {
  polyName, monomerVon, baustein, doppelbindung, nBedeutung, kugelZaehlen, bausteinWahl, kunststoffAlltag,
  schritt, radikal, pfeil, startBruch, wohinRadikal, abbruchArt, starterRest, mehrStarter,
  katalysator, freieStelle, zieglerGift, taktisch, taktischVerfahren, hdpe, lebend, kationisch, verfahrenWahl,
  gruppen, nebenprodukt, bindungArt, chlorid, paarWahl, stopper, netz, produkt, abMonomer, wasserZahl,
  keinNebenprodukt, hWandert, urethan, artWahl, epoxid, epoxidNetz,
  klasse, schmelzen, copolymer, wachstum, klasseAlltag, recycling,
  radikalTap, freieStelleTap, giftTap, hTap, wasserTap, bausteinTap, schnitt, epoxidBindungTap, ordnen, bauenHomo, bauenCopo,
};

export const TYPE_NAMES: Record<string, string> = tr({
  polyName: "Monomer → Polymer", monomerVon: "Polymer → Monomer", baustein: "Monomer in der Kette", doppelbindung: "Zweifachbindung erkennen",
  nBedeutung: "Klammer und n", kugelZaehlen: "Bausteine zählen", bausteinWahl: "Baustein wählen", kunststoffAlltag: "Kunststoffe im Alltag",
  schritt: "Start, Wachstum, Abbruch", radikal: "Radikal", pfeil: "Halber Pfeil", startBruch: "Zerfall des Starters", wohinRadikal: "Radikal am Kettenende",
  abbruchArt: "Art des Abbruchs", starterRest: "Starter in der Kette", mehrStarter: "Starter und Kettenlänge",
  katalysator: "Katalysator oder Starter", freieStelle: "Freie Stelle am Titan", zieglerGift: "Vergiftung am Titan", taktisch: "Taktizität",
  taktischVerfahren: "Geordnete Ketten", hdpe: "PE-HD und PE-LD", lebend: "Lebende Ketten", kationisch: "Kationische Polymerisation", verfahrenWahl: "Verfahren wählen",
  gruppen: "Reagierende Gruppen", nebenprodukt: "Abgespaltenes Molekül", bindungArt: "Ester oder Amid", chlorid: "Säurechlorid", paarWahl: "Monomer-Paar wählen",
  stopper: "Kettenstopper", netz: "Netz durch drei Gruppen", produkt: "Kunststoff zum Monomer-Paar", abMonomer: "Monomer mit zwei Gruppen", wasserZahl: "Wasser zählen",
  keinNebenprodukt: "Ohne Nebenprodukt", hWandert: "Wanderndes H‑Atom", urethan: "Urethan und Harnstoff", artWahl: "Reaktionsart erkennen",
  epoxid: "Epoxidring", epoxidNetz: "Epoxidharz härtet",
  bauenHomo: "Kette bauen", bauenCopo: "Copolymer bauen", ordnen: "Schritte ordnen", schnitt: "Neue Bindung antippen", radikalTap: "Radikal antippen", freieStelleTap: "Freie Stelle antippen", giftTap: "Atom, das das Titan vergiftet", hTap: "Wanderndes H antippen", wasserTap: "Wasser abziehen", bausteinTap: "Baustein markieren", epoxidBindungTap: "Neue Bindung im Epoxidharz",
  klasse: "Thermoplast, Elastomer, Duroplast", schmelzen: "Einschmelzen", copolymer: "Copolymere", wachstum: "Ketten- und Stufenwachstum",
  klasseAlltag: "Kunststoffart im Alltag", recycling: "Recycling-Code",
}, {
  polyName: "Monomer → polymer", monomerVon: "Polymer → monomer", baustein: "Monomer in the chain", doppelbindung: "Spotting the double bond",
  nBedeutung: "Bracket and n", kugelZaehlen: "Counting repeat units", bausteinWahl: "Choosing the repeat unit", kunststoffAlltag: "Plastics in everyday life",
  schritt: "Initiation, propagation, termination", radikal: "Radical", pfeil: "Half-headed arrow", startBruch: "Initiator splitting", wohinRadikal: "Radical at the chain end",
  abbruchArt: "Type of termination", starterRest: "Initiator in the chain", mehrStarter: "Initiator and chain length",
  katalysator: "Catalyst or initiator", freieStelle: "Vacant site on titanium", zieglerGift: "Poisoning at titanium", taktisch: "Tacticity",
  taktischVerfahren: "Ordered chains", hdpe: "PE-HD and PE-LD", lebend: "Living chains", kationisch: "Cationic polymerisation", verfahrenWahl: "Choosing a method",
  gruppen: "Reacting groups", nebenprodukt: "Molecule split off", bindungArt: "Ester or amide", chlorid: "Acyl chloride", paarWahl: "Choosing a monomer pair",
  stopper: "Chain stopper", netz: "Network from three groups", produkt: "Plastic from a monomer pair", abMonomer: "Monomer with two groups", wasserZahl: "Counting water",
  keinNebenprodukt: "No by-product", hWandert: "Moving H atom", urethan: "Urethane and urea", artWahl: "Recognising the reaction type",
  epoxid: "Epoxide ring", epoxidNetz: "Epoxy resin hardens",
  bauenHomo: "Build a chain", bauenCopo: "Build a copolymer", ordnen: "Order the steps", schnitt: "Tap the new bond", radikalTap: "Tap the radical", freieStelleTap: "Tap the vacant site", giftTap: "Atom that poisons the titanium", hTap: "Tap the moving H", wasserTap: "Pull out the water", bausteinTap: "Mark a repeat unit", epoxidBindungTap: "New bond in epoxy resin",
  klasse: "Thermoplastic, elastomer, thermoset", schmelzen: "Melting down", copolymer: "Copolymers", wachstum: "Chain and step growth",
  klasseAlltag: "Type of plastic in everyday life", recycling: "Recycling code",
});

/** `seq`: feste Reihenfolge der zehn Aufgaben, `leads`: Merksatz je Aufgabe */
interface Level extends QuizLevel { types: string[]; seq: string[]; leads: string[] }
/** Kapitel-Schritt: Aufgabentyp, Merksatz davor (Kontext oder Blickrichtung, nie die Regel), Merksatz danach (die Regel, bei richtiger Antwort) */
type Step = [type: string, lead: string, rule?: string];

const K1: Step[] = tr([
  ["polyName", "Ein **Polymer** ist ein Riesenmolekül aus vielen kleinen Bausteinen, den **Monomeren**."],
  ["doppelbindung", "Nicht jedes Molekül kann zur Kette werden – vergleiche die Bindungen.", "Monomere der Polymerisation haben eine **C=C-Zweifachbindung**."],
  ["bausteinWahl", "Vergleiche Monomer und Kette: Was ändert sich, was bleibt?", "In der Kette ist aus C=C eine Einfachbindung geworden. Die Seitengruppe bleibt."],
  ["nBedeutung", "Formeln von Polymeren zeigen nur einen kleinen Ausschnitt der riesigen Kette.", "Die Formel zeigt **einen Baustein** in eckigen Klammern. Das n heißt: sehr oft."],
  ["kugelZaehlen", "Zähle sorgfältig – was genau stellt ein Kügelchen dar?", "Im **Kügelchenmodell** ist jeder Baustein ein Kügelchen."],
  ["baustein", "Aus der Kette zurück zum Monomer: Baustein abschneiden, C=C wieder einsetzen."],
  ["bauenHomo", "Jetzt baust du selbst eine Kette aus Kügelchen."],
  ["monomerVon", "Lies den Namen des Polymers genau.", "Der Name verrät das Monomer: **Poly** + Name des Monomers."],
  ["kunststoffAlltag", "Kunststoffe sind Polymere – oft mit Kurzzeichen wie PE, PP, PS, PVC."],
  ["bausteinTap", "Zum Schluss: Kette lesen, Baustein finden, Monomer nennen."],
], [
  ["polyName", "A **polymer** is a giant molecule made of many small building blocks, the **monomers**."],
  ["doppelbindung", "Not every molecule can become a chain – compare the bonds.", "Monomers for polymerisation have a **C=C double bond**."],
  ["bausteinWahl", "Compare monomer and chain: what changes, what stays?", "In the chain C=C has become a single bond. The side group stays."],
  ["nBedeutung", "Polymer formulas show only a small part of the huge chain.", "The formula shows **one repeat unit** in square brackets. The n means: very often."],
  ["kugelZaehlen", "Count carefully – what exactly does one bead stand for?", "In the **bead model** each repeat unit is one bead."],
  ["baustein", "From the chain back to the monomer: cut out a repeat unit, put the C=C back."],
  ["bauenHomo", "Now you build a chain from beads yourself."],
  ["monomerVon", "Read the polymer's name carefully.", "The name gives away the monomer: **poly** + name of the monomer."],
  ["kunststoffAlltag", "Plastics are polymers – often with short codes such as PE, PP, PS, PVC."],
  ["bausteinTap", "Finally: read the chain, find the repeat unit, name the monomer."],
]);
const K2: Step[] = tr([
  ["radikal", "Ohne Radikale startet keine Kette – was macht sie so besonders?", "Ein **Radikal** hat ein **ungepaartes Elektron** (Punkt). Es ist sehr reaktiv."],
  ["startBruch", "Erwärmen setzt alles in Gang – schau auf die O–O-Bindung.", "**Start**: Beim Erwärmen bricht die O–O-Bindung des Starters gleichmäßig."],
  ["pfeil", "Pfeile zeigen, wie Elektronen wandern – achte auf die Spitze.", "Ein **halber Pfeil** zeigt, wohin **ein** Elektron wandert."],
  ["schritt", "Die Pfeile zeigen, welcher Schritt es ist.", "Start, Wachstum, Abbruch: Die Pfeile zeigen, welcher Schritt es ist."],
  ["radikalTap", "Folge den Pfeilen: Wohin wandern die Elektronen der C=C?", "**Kettenwachstum**: Das Radikal greift C=C an – am neuen Ende sitzt wieder ein Radikal."],
  ["abbruchArt", "Am Ende treffen sich zwei Radikale – folge den Pfeilen.", "**Abbruch**: Zwei Radikale treffen sich – Rekombination oder Disproportionierung."],
  ["starterRest", "Jede Kette hat einen Anfang – schau dir genau an, was dort sitzt.", "Der Starter wird verbraucht: Sein Bruchstück sitzt am Kettenanfang."],
  ["mehrStarter", "Jedes Radikal startet eine Kette – Starter und Monomer bestimmen die Kettenlänge."],
  ["abbruchArt", "Noch einmal: Verbinden die Pfeile die Enden – oder holen sie ein Atom?", "Rekombination verbindet die Enden. Bei der Disproportionierung wandert ein H‑Atom."],
  ["ordnen", "Zum Schluss: die ganze Kette von Start bis Abbruch."],
], [
  ["radikal", "Without radicals no chain starts – what makes them special?", "A **radical** has an **unpaired electron** (dot). It is very reactive."],
  ["startBruch", "Heating gets everything going – look at the O–O bond.", "**Initiation**: on heating, the O–O bond of the initiator breaks evenly."],
  ["pfeil", "Arrows show how electrons move – look at the arrowhead.", "A **half-headed (fishhook) arrow** shows where **one** electron moves."],
  ["schritt", "The arrows show which step it is.", "Initiation, propagation, termination: the arrows show which step it is."],
  ["radikalTap", "Follow the arrows: where do the electrons of the C=C go?", "**Propagation**: the radical attacks C=C – the new end is a radical again."],
  ["abbruchArt", "At the end two radicals meet – follow the arrows.", "**Termination**: two radicals meet – combination or disproportionation."],
  ["starterRest", "Every chain has a start – look closely at what sits there.", "The initiator is used up: its fragment sits at the start of the chain."],
  ["mehrStarter", "Each radical starts a chain – initiator and monomer decide the chain length."],
  ["abbruchArt", "Once more: do the arrows join the ends – or fetch an atom?", "Combination joins the ends. In disproportionation an H atom moves."],
  ["ordnen", "Finally: the whole chain from initiation to termination."],
]);
const K3: Step[] = tr([
  ["katalysator", "Starter und Katalysator setzen beide eine Polymerisation in Gang – worin unterscheiden sie sich?", "Ein **Katalysator** wird nicht verbraucht. Am Titan wachsen nacheinander viele Ketten."],
  ["freieStelleTap", "Das Titan hält die Kette – wo hat das nächste Monomer Platz?", "Am Titan gibt es eine **freie Stelle**. Dort lagert sich das Monomer an."],
  ["zieglerGift", "Das Titan verträgt nicht jedes Monomer – sieh dir die Atome genau an.", "Polare Monomere binden mit O, N, Cl oder F an das Titan: Der Katalysator ist **vergiftet**."],
  ["taktisch", "Schau, auf welcher Seite der Kette die Seitengruppen sitzen.", "**Isotaktisch**: alle Seitengruppen auf einer Seite. **Ataktisch**: zufällig."],
  ["taktischVerfahren", "Drei Verfahren, drei Arten von Ketten – welches passt hier?", "Am Titan wird jedes Monomer gleich herum eingebaut – die Kette wird geordnet."],
  ["hdpe", "Polyethen kommt aus zwei Verfahren – mit ganz verschiedenen Ketten.", "Ziegler-Natta: **unverzweigtes** PE-HD. Radikalisch unter hohem Druck: **verzweigtes** PE-LD."],
  ["lebend", "Butyllithium startet die Ketten – was ist an ihren Enden besonders?", "**Anionisch** (Butyllithium): Die Ketten **leben** weiter, bis Methanol sie beendet."],
  ["kationisch", "Kationisch heißt: positive Ladung am Kettenende – welche Seitengruppe hilft ihr?", "**Kationisch** (BF₃ und Wasser): CH₃-Gruppen stabilisieren die positive Ladung."],
  ["verfahrenWahl", "Jedes Monomer braucht das passende Verfahren."],
  ["giftTap", "Zum Schluss: Wer vergiftet das Titan – und warum?"],
], [
  ["katalysator", "Initiator and catalyst both get a polymerisation going – how do they differ?", "A **catalyst** is not used up. Many chains grow one after another at the titanium."],
  ["freieStelleTap", "The titanium holds the chain – where is there room for the next monomer?", "The titanium has a **vacant site**. The monomer attaches there."],
  ["zieglerGift", "The titanium does not tolerate every monomer – look closely at the atoms.", "Polar monomers bind to the titanium with O, N, Cl or F: the catalyst is **poisoned**."],
  ["taktisch", "Look at which side of the chain the side groups sit on.", "**Isotactic**: all side groups on one side. **Atactic**: random."],
  ["taktischVerfahren", "Three methods, three kinds of chain – which fits here?", "At the titanium each monomer is inserted the same way round – the chain becomes ordered."],
  ["hdpe", "Polyethene comes from two methods – with very different chains.", "Ziegler–Natta: **unbranched** PE-HD. Radical at high pressure: **branched** PE-LD."],
  ["lebend", "Butyllithium starts the chains – what is special about their ends?", "**Anionic** (butyllithium): the chains **stay alive** until methanol stops them."],
  ["kationisch", "Cationic means a positive charge at the chain end – which side group helps it?", "**Cationic** (BF₃ and water): CH₃ groups stabilise the positive charge."],
  ["verfahrenWahl", "Each monomer needs the right method."],
  ["giftTap", "Finally: what poisons the titanium – and why?"],
]);
const K4: Step[] = tr([
  ["gruppen", "Bei der **Polykondensation** reagieren **funktionelle Gruppen** – schau, welche jedes Monomer trägt.", "Bei der **Polykondensation** reagieren **funktionelle Gruppen**, z. B. –COOH mit –OH."],
  ["wasserTap", "Dabei wird ein kleines Molekül **abgespalten** – meist Wasser."],
  ["bindungArt", "Wie die neue Bindung heißt, hängt vom Partner der Säure ab.", "Säure + Alkohol → **Esterbindung**. Säure + Amin → **Amidbindung**."],
  ["wasserZahl", "Jede Verknüpfung spaltet genau ein Molekül ab."],
  ["chlorid", "Schau, was statt –OH an der Säuregruppe sitzt.", "Mit **Säurechloriden** (–COCl) wird statt Wasser HCl abgespalten."],
  ["paarWahl", "Prüfe bei jedem Paar beide Partner.", "Für lange Ketten braucht **jedes** Monomer **zwei** passende Gruppen."],
  ["stopper", "Ethanol ist kein Diol – zähl seine Gruppen.", "Ein Monomer mit **nur einer** Gruppe beendet die Kette."],
  ["netz", "Glycerin ist kein gewöhnlicher Partner – zähl seine –OH-Gruppen.", "**Drei** reaktive Gruppen (Glycerin) verknüpfen die Ketten zu einem **Netz**."],
  ["abMonomer", "Manche Monomere brauchen keinen Partner – woran erkennt man sie?", "Zwei **verschiedene** Gruppen in einem Monomer: Es reagiert mit sich selbst."],
  ["schnitt", "Zum Schluss: Wo genau sind die Monomere verknüpft?"],
], [
  ["gruppen", "In **polycondensation** **functional groups** react – look at which ones each monomer carries.", "In **polycondensation** **functional groups** react, e.g. –COOH with –OH."],
  ["wasserTap", "A small molecule is **split off** – usually water."],
  ["bindungArt", "The name of the new bond depends on the acid's partner.", "Acid + alcohol → **ester bond**. Acid + amine → **amide bond**."],
  ["wasserZahl", "Each link splits off exactly one molecule."],
  ["chlorid", "Look at what sits on the acid group instead of –OH.", "With **acyl chlorides** (–COCl), HCl is split off instead of water."],
  ["paarWahl", "Check both partners in each pair.", "For long chains **each** monomer needs **two** matching groups."],
  ["stopper", "Ethanol is not a diol – count its groups.", "A monomer with **only one** group ends the chain."],
  ["netz", "Glycerol is no ordinary partner – count its –OH groups.", "**Three** reactive groups (glycerol) link the chains into a **network**."],
  ["abMonomer", "Some monomers need no partner – how can you tell?", "Two **different** groups in one monomer: it reacts with itself."],
  ["schnitt", "Finally: where exactly are the monomers linked?"],
]);
const K5: Step[] = tr([
  ["keinNebenprodukt", "**Polyaddition** heißt die dritte Reaktionsart – vergleiche sie mit der Polykondensation.", "Bei der **Polyaddition** wird **nichts** abgespalten."],
  ["hTap", "Bei der Polyaddition entsteht eine neue Gruppe – folge den Pfeilen.", "Ein **H‑Atom wandert** von der –OH-Gruppe zum N‑Atom des Isocyanats."],
  ["urethan", "Welche zwei Gruppen treffen hier aufeinander?", "Isocyanat + Alkohol → **Urethangruppe**: Polyurethan (PUR)."],
  ["artWahl", "Sieh dir die Gruppen der Monomere genau an.", "Polymerisation (C=C), Polykondensation (+ kleines Molekül), Polyaddition (ohne)."],
  ["epoxid", "Zweikomponentenkleber: Harz und Härter werden gemischt.", "**Epoxidharz**: Der gespannte Ring öffnet sich und bindet an die Aminogruppe."],
  ["urethan", "Der Partner des Isocyanats entscheidet, wie die neue Gruppe heißt.", "Isocyanat + Amin → **Harnstoffgruppe**: Polyharnstoff."],
  ["epoxidNetz", "Zähl die N–H-Bindungen am Härter: Wie oft kann jede –NH₂-Gruppe reagieren?", "Jede –NH₂-Gruppe reagiert zweimal – das Harz wird zum **Netz**."],
  ["hWandert", "Noch einmal genau hinsehen: Was passiert mit den Atomen?"],
  ["epoxidBindungTap", "Vergleiche das Bild mit den beiden Monomeren.", "Ohne Nebenprodukt bleiben alle Atome im Polymer."],
  ["artWahl", "Zum Schluss: drei Reaktionsarten unterscheiden."],
], [
  ["keinNebenprodukt", "**Polyaddition** is the third type of reaction – compare it with polycondensation.", "In **polyaddition** **nothing** is split off."],
  ["hTap", "In polyaddition a new group forms – follow the arrows.", "An **H atom moves** from the –OH group to the N atom of the isocyanate."],
  ["urethan", "Which two groups meet here?", "Isocyanate + alcohol → **urethane group**: polyurethane (PUR)."],
  ["artWahl", "Look closely at the monomers' groups.", "Polymerisation (C=C), polycondensation (+ small molecule), polyaddition (without)."],
  ["epoxid", "Two-part adhesive: resin and hardener are mixed.", "**Epoxy resin**: the strained ring opens and binds to the amino group."],
  ["urethan", "The isocyanate's partner decides what the new group is called.", "Isocyanate + amine → **urea group**: polyurea."],
  ["epoxidNetz", "Count the N–H bonds on the hardener: how often can each –NH₂ group react?", "Each –NH₂ group reacts twice – the resin becomes a **network**."],
  ["hWandert", "Look closely once more: what happens to the atoms?"],
  ["epoxidBindungTap", "Compare the picture with the two monomers.", "Without a by-product all atoms stay in the polymer."],
  ["artWahl", "Finally: tell the three reaction types apart."],
]);
const K6: Step[] = tr([
  ["klasse", "Kunststoffe unterscheiden sich darin, wie ihre Ketten verbunden sind.", "**Thermoplaste**: einzelne Ketten – beim Erwärmen weich und formbar."],
  ["copolymer", "Zwei Monomere in einer Kette – die Reihenfolge der Farben zählt.", "Block: lange gleiche Abschnitte. Alternierend: immer abwechselnd. Statistisch: zufällig gemischt."],
  ["schmelzen", "Altes Plastik soll neu geformt werden – denk an die Brücken zwischen den Ketten.", "Nur Thermoplaste lassen sich einschmelzen und neu formen."],
  ["wachstum", "Zwei Arten zu wachsen – vergleiche, was im Gefäß ist.", "**Kettenwachstum**: lange Ketten sofort. **Stufenwachstum**: lange Ketten erst am Ende."],
  ["klasse", "Achte auf die Brücken: keine, wenige oder viele?", "**Elastomere**: wenige Brücken – dehnbar, springen zurück. **Duroplaste**: dichtes Netz – hart."],
  ["bauenCopo", "Jetzt baust du: Die Farben zeigen die Reihenfolge."],
  ["klasseAlltag", "Im Alltag: Was muss der Kunststoff aushalten?"],
  ["wachstum", "Noch einmal: Kettenwachstum oder Stufenwachstum?"],
  ["copolymer", "Noch einmal: Wie sind die Farben in der Kette verteilt?"],
  ["klasseAlltag", "Zum Schluss: Kunststoffart und Aufbau verbinden."],
], [
  ["klasse", "Plastics differ in how their chains are connected.", "**Thermoplastics**: separate chains – soft and shapeable when heated."],
  ["copolymer", "Two monomers in one chain – the order of the colours matters.", "Block: long identical sections. Alternating: always taking turns. Random: mixed by chance."],
  ["schmelzen", "Old plastic is to be reshaped – think of the bridges between the chains.", "Only thermoplastics can be melted down and reshaped."],
  ["wachstum", "Two ways of growing – compare what is in the vessel.", "**Chain growth**: long chains at once. **Step growth**: long chains only at the end."],
  ["klasse", "Look at the bridges: none, a few or many?", "**Elastomers**: a few cross-links – stretchy, spring back. **Thermosets**: dense network – hard."],
  ["bauenCopo", "Now you build: the colours show the order."],
  ["klasseAlltag", "In everyday life: what does the plastic have to withstand?"],
  ["wachstum", "Once more: chain growth or step growth?"],
  ["copolymer", "Once more: how are the colours spread along the chain?"],
  ["klasseAlltag", "Finally: connect type of plastic and structure."],
]);

/** `more`: Aufgabentypen, die nicht im festen Ablauf stehen, aber zum Kapitel gehören (Auswahl-Fassung von Antipp-Aufgaben – „Alles gemischt“, Wiederholung) */
/** Schritte, deren Regel für jede Variante gilt (sonst erscheint nach der richtigen Antwort die Erklärung der Aufgabe) */
export const GENERAL_RULE = ["schritt", "artWahl", "copolymer", "wachstum", "bindungArt", "monomerVon", "nBedeutung", "radikal", "startBruch", "pfeil", "starterRest", "katalysator", "hdpe", "chlorid", "stopper", "netz", "keinNebenprodukt", "epoxid", "epoxidNetz", "schmelzen"];
/** Merksatz mit der Regel je Kapitel-Schritt – erscheint nach der richtigen Antwort */
export const RULES: Record<string, string[]> = {};
const level = (n: number, name: string, desc: string, steps: Step[], more: string[] = []): Level => {
  const seq = steps.map(([t]) => t);
  RULES[`pm-k${n}`] = steps.map(([, , r]) => r ?? "");
  return { id: `pm-k${n}`, name, desc, seq, leads: steps.map(([, l]) => l), tip: true, types: [...new Set([...seq, ...more])] };
};
export const LEVELS: Level[] = [
  level(1, tr("Monomere und Polymere", "Monomers and polymers"), tr("Zweifachbindung, Baustein, Name, Kügelchenmodell", "Double bond, repeat unit, name, bead model"), K1, ["baustein"]),
  level(2, tr("Radikalische Polymerisation", "Radical polymerisation"), tr("Radikal, Start, Kettenwachstum, Abbruch", "Radical, initiation, propagation, termination"), K2, ["wohinRadikal"]),
  level(3, tr("Katalysatoren und Verfahren", "Catalysts and methods"), tr("Ziegler-Natta, anionisch, kationisch, Taktizität", "Ziegler–Natta, anionic, cationic, tacticity"), K3, ["freieStelle"]),
  level(4, tr("Polykondensation", "Polycondensation"), tr("Funktionelle Gruppen, Wasser abspalten, Ester, Amid, Netz", "Functional groups, splitting off water, ester, amide, network"), K4, ["nebenprodukt", "produkt"]),
  level(5, tr("Polyaddition", "Polyaddition"), tr("Urethan, Harnstoff, Epoxidharz – ohne Nebenprodukt", "Urethane, urea, epoxy resin – without a by-product"), K5, ["hWandert"]),
  level(6, tr("Struktur und Eigenschaften", "Structure and properties"), tr("Thermoplast, Elastomer, Duroplast, Copolymere", "Thermoplastic, elastomer, thermoset, copolymers"), K6),
];

export const levelId = (_stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[level].id : `pm-${level}`);
export const levelName = (level: LevelKey) =>
  level === "mix" ? tr("Alles gemischt", "Everything mixed") : level === "weak" ? tr("Schwächen üben", "Practise weak spots") : level === "due" ? tr("Heute fällig", "Due today")
    : SHORT_NAME()[level];
/** kurzer Kapitelname für den Quiz-Kopf (schmale Handys, „Lesbar“): ganz lesbar statt „Pol…“ */
const SHORT_NAME = () => tr(["Monomere", "Radikalisch", "Katalysatoren", "Poly\u00ADkondensation", "Poly\u00ADaddition", "Eigenschaften"], ["Monomers", "Radical", "Catalysts", "Poly\u00ADcondensation", "Poly\u00ADaddition", "Properties"]);

/** kurze Regel nach ✓ bei Antippen, Ordnen und Bauen (eine Zeile; das Bild bleibt groß) */
const SHORT_RULE = (): Record<string, string> => ({
  radikalTap: T("Am neuen Kettenende sitzt wieder ein Radikal.", "The new chain end is a radical again."),
  freieStelleTap: T("Das Monomer lagert sich an der freien Stelle am Titan an.", "The monomer attaches at the vacant site on the titanium."),
  giftTap: T("O, N, Cl oder F binden an das Titan – der Katalysator ist vergiftet.", "O, N, Cl or F bind to the titanium – the catalyst is poisoned."),
  hTap: T("Das H der –OH-Gruppe wandert zum N.", "The H of the –OH group moves to the N."),
  wasserTap: T("–OH der Säure + H des Partners → H₂O.", "–OH of the acid + H of the partner → H₂O."),
  bausteinTap: T("Ein Baustein = zwei C‑Atome der Hauptkette.", "One repeat unit = two C atoms of the main chain."),
  schnitt: T("Die neue Bindung verknüpft die Monomere – Wasser kann sie wieder spalten.", "The new bond links the monomers – water can split it again."),
  epoxidBindungTap: T("Ring auf, C–N neu, O bleibt als –OH: nichts wird abgespalten.", "Ring opens, C–N is new, O stays as –OH: nothing is split off."),
  ordnen: T("Start → Wachstum → Wachstum → Abbruch.", "Initiation → propagation → propagation → termination."),
  bauenHomo: T("Ein Monomer: Jedes Kügelchen ist derselbe Baustein.", "One monomer: every bead is the same repeat unit."),
  bauenCopo: T("Copolymer: zufällig, abwechselnd oder in Blöcken.", "Copolymer: random, alternating or in blocks."),
});

/** Regel nach der richtigen Antwort – hängt an der Aufgabe (Fertigkeit und Variante), nicht am Platz in der Runde.
 *  Schritte mit allgemeiner Regel: diese Regel; Typen mit Varianten (Urethan/Harnstoff, Kunststoffart …): die Erklärung der konkreten Aufgabe. */
export function withRule(t: Task, id: string): Task {
  if (isTap(t) || isOrder(t) || isBuild(t)) return { ...t, rule: SHORT_RULE()[id] ?? t.explain };
  if (t.why?.[t.answer]) return t;
  const step = LEVELS.flatMap(l => l.seq.flatMap((x, i) => (x === id && RULES[l.id][i] ? [RULES[l.id][i]] : [])))[0];
  // jede Aufgabe bekommt eine Regelzeile: allgemeine Regel des Schritts oder die Erklärung genau dieser Aufgabe
  return { ...t, why: { ...t.why, [t.answer]: step && GENERAL_RULE.includes(id) ? step : t.explain } };
}
const GEN_RULED: Record<string, () => Task> = Object.fromEntries(Object.keys(GENS).map(id => [id, () => withRule(GENS[id](), id)]));

/** Tipp: zugeschnitten und hervorgehoben */
function withHint(t: Task, cue: boolean): Task {
  const { tip, ...rest } = t;
  return cue && tip ? { ...rest, hint: tip, hintCue: true } : rest;
}

/** Aufgaben in fester Reihenfolge, keine Frage doppelt (gleicher Typ → anderes Beispiel) */
function ordered(seq: string[], leads: string[]): Task[] {
  const seen = new Set<string>();
  // gleiche Frage auch bei anderer Reihenfolge der Antworten
  const sig = (t: Task) => t.prompt + (isBuild(t) ? JSON.stringify(t.pool) + t.goal : isOrder(t) ? JSON.stringify(t.cards) : isTap(t) ? JSON.stringify(t.scene) : [...t.options].sort().join("|") + JSON.stringify(t.vis ?? null));
  return seq.map((id, i) => {
    let t = GEN_RULED[id]();
    for (let k = 0; k < 30 && seen.has(sig(t)); k++) t = GEN_RULED[id]();
    seen.add(sig(t));
    return { ...withHint(t, true), type: id, ...(leads[i] ? { lead: leads[i] } : {}) };
  });
}

export function makeRound(_stufe: string, level: LevelKey, stats?: TypeStats, due: string[] = []): Task[] {
  if (typeof level === "number") return ordered(LEVELS[level].seq, LEVELS[level].leads);
  let ids = level === "mix" ? [...new Set(LEVELS.flatMap(l => l.types))]
    // Schwächen: alle schwachen Fertigkeiten (nicht nur drei), je Fertigkeit höchstens zweimal – siehe unten
    : level === "weak" ? weakAll(stats)
    // fällig: die am längsten überfälligen zuerst (eine Runde fasst höchstens 10 Fertigkeiten; der Rest bleibt fällig)
    : level === "due" ? due.filter(id => GENS[id] && !LATER.includes(id)).slice(0, 10)
    : LEVELS[0].types;
  if (!ids.length) ids = LEVELS[0].types;
  // höchstens zwei Aufgaben je Fertigkeit, wenn wenige schwach sind (lieber eine kürzere Runde als dieselbe Frage fünfmal)
  const count = level === "weak" ? Math.min(10, 2 * ids.length) : 10;
  return buildRound(ids, GEN_RULED, count).map(t => withHint(t, false));
}

/** Aufgabentypen, deren Kapitel (mit Lektion) noch fehlt – bis dahin in keinem Kapitel und nicht in „Alles gemischt“ */
export const LATER = ["recycling"];

/** gleiche Aufgabe für das gelöste Beispiel: gleiche Frage mit gleichem Bild und gleicher Lösung (andere Antwortauswahl reicht nicht) */
export function sameTask(a: Task, b: Task): boolean {
  if (a.prompt !== b.prompt) return false;
  if (isBuild(a) || isBuild(b) || isOrder(a) || isOrder(b) || isTap(a) || isTap(b)) return JSON.stringify(a) === JSON.stringify(b);
  return JSON.stringify(a.vis ?? null) === JSON.stringify(b.vis ?? null) && a.options[a.answer] === b.options[b.answer];
}

/** alle schwachen Fertigkeiten (Fehler, seitdem nicht wieder sicher), schwächste zuerst */
export function weakAll(stats?: TypeStats): string[] {
  return Object.entries(stats ?? {})
    .filter(([id, s]) => s.wrong > 0 && !LATER.includes(id) && LEVELS.some(l => l.types.includes(id)))
    .map(([id, s]) => ({ id, rate: (s.wrong + 1) / (s.right + s.wrong + 2) }))
    .sort((a, b) => b.rate - a.rate)
    .map(x => x.id);
}

/** für Tests: alle Generatoren */
export const GENERATORS = GENS;
