// Quiz-Aufgaben zur Benennung (reine Daten: Moleküle mit Lage der Atome, damit Runden gespeichert werden können).
// Moleküle entstehen zufällig aus Bausteinen (Kurzschreibweise), den richtigen Namen liefert naming.ts.
// Falsche Antworten kommen ebenfalls aus der Benennung – jede steht für einen typischen Fehler (misconceptions.ts):
// andere Seite nummeriert, kürzere Kette, nicht alphabetisch, ohne di/tri, falsche Rangfolge, falsche Endung, verzählt.

import { buildRound, d, mc, pick, rnd, shuffle, weakTypes, type BaseTask, type Distractor, type LevelKey, type McTask, type QuizLevel, type TypeStats } from "@lern/quiz";
import { layout } from "../chem/layout.ts";
import { parseSmiles } from "../chem/smiles.ts";
import { cap as capName, keepEnding, name, KIND_INFO, type Kind, type NameOk, type NameOptions } from "../chem/naming.ts";
import { prefixEn } from "../chem/english.ts";
import { MULT, STEM } from "../chem/rings.ts";
import type { Mol } from "../chem/mol.ts";
import { flipBond } from "../chem/stereo.ts";
import { tr } from "@lern/i18n";

type Extra = { mol?: Mol; mols?: Record<string, Mol> };
export type Task = (McTask & Extra) | (BaseTask & Extra & { kind: "num"; answer: number });

const mol = (s: string) => layout(parseSmiles(s));
const ok = (m: Mol, opt?: NameOptions): NameOk | undefined => { const r = name(m, opt); return r.ok ? r : undefined; };
/** Zählrichtung nach einer Regel, die Erklärung und Karten nicht einführen (Alphabet bei sonst gleichen Nummern, „erster Unterschied“
 *  bei nicht kleinerer Summe) – solche Moleküle fragt das Quiz nicht ab (etwa 1 % der Moleküle) */
function rareRule(m: Mol): boolean {
  const x = ok(m, { pick: "reverse" })?.reverse;
  if (!x) return false;
  const sum = (l: number[]) => l.reduce((a, b) => a + b, 0);
  return x.rule === "alpha" || ((x.rule === "prefixes" || x.rule === "multiple") && x.right.length > 1 && sum(x.right) >= sum(x.wrong));
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Gruppen, deren C zur Kette gehört (Säure, Aldehyd …) */
const C_GROUP: Kind[] = ["saeure", "ester", "amid", "nitril", "al"];
/** unverzweigtes Alkan mit k C: Butan / butane */
const ALKANE = (k: number) => tr(cap(STEM[k]) + "an", STEM[k] + "ane");
/** Ester aus Säure mit a C und Alkylrest mit b C: Butansäureethylester / ethyl butanoate */
const ESTER = (a: number, b: number) => tr(`${cap(STEM[a])}ansäure${STEM[b]}ylester`, `${STEM[b]}yl ${STEM[a]}anoate`);

/** Kette als Kurzschreibweise: Äste je Position (0-basiert), Bindung zwischen i und i+1 */
function chain(n: number, branches: Record<number, string[]> = {}, bonds: Record<number, string> = {}, ends: { first?: string; last?: string } = {}): string {
  let s = "";
  for (let i = 0; i < n; i++) {
    const atom = i === 0 && ends.first ? ends.first : i === n - 1 && ends.last ? ends.last : "C";
    s += (i > 0 ? bonds[i - 1] ?? "" : "") + atom + (branches[i] ?? []).map(b => `(${b})`).join("");
  }
  return s;
}
const addBranch = (br: Record<number, string[]>, i: number, b: string) => { (br[i] ??= []).push(b); };

/** Name mit verzählter Hauptkette (Stamm ± delta) */
function restem(nm: string, size: number, delta: number): string | undefined {
  const from = STEM[size], to = STEM[size + delta];
  if (!from || !to) return;
  const low = nm.toLowerCase();
  for (let i = low.length - from.length; i >= 0; i--) {
    if (low.startsWith(from, i) && /^(an|en|in|yn|a-|-\d)/.test(low.slice(i + from.length))) {
      const rep = nm[i] !== low[i] ? cap(to) : to;
      return nm.slice(0, i) + rep + nm.slice(i + from.length);
    }
  }
}

/** Vorsilbe für Rückmeldungen: Methyl / methyl, (Prop-2-inyl) → Prop-2-inyl / prop-2-ynyl */
const prefixWord = (p: string) => tr(capName(p), prefixEn(p));
/** Äste (nur Alkylreste) oder Vorsilben */
const prefixKind = (ps: { name: string }[]) => (ps.every(p => /yl$/.test(p.name)) ? tr("Äste", "branches") : tr("Vorsilben", "prefixes"));

/** Rückmeldung zur anderen Richtung: nennt die Regel, die hier entscheidet, mit den Nummern der Aufgabe */
function reverseWhy(r: NameOk, x: NonNullable<NameOk["reverse"]>): string {
  const R = x.right.join(","), W = x.wrong.join(","), many = x.right.length > 1;
  const sum = (xs: number[]) => xs.reduce((s, v) => s + v, 0);
  if (x.rule === "principal") {
    const g = KIND_INFO[r.principal!].group;
    if (C_GROUP.includes(r.principal!) && x.right[0] === 1 && r.parent.kind === "chain")
      return tr(`Das C der ${g}-Gruppe ist immer C1. Von dort aus nummerieren.`, `The C of the ${g} group is always C1. Number from there.`);
    return many ? tr(`Die Gruppen ${g} bekommen die kleinsten Nummern: ${R} statt ${W}.`, `The ${g} groups get the lowest numbers: ${R} instead of ${W}.`)
      : tr(`Die Gruppe ${g} bekommt die kleinste Nummer: ${R} statt ${W}.`, `The ${g} group gets the lowest number: ${R} instead of ${W}.`);
  }
  if (x.rule === "multiple" || x.rule === "double") {
    const bond = tr({ double: "Doppelbindung", triple: "Dreifachbindung", multiple: "Mehrfachbindung" }, { double: "double bond", triple: "triple bond", multiple: "multiple bond" })[x.rule === "double" ? "double" : x.bond ?? "multiple"];
    const first = x.rule === "double" ? tr("Gleichstand: ", "A tie: ") : "";
    return many ? tr(`${first}Die ${bond}en bekommen die kleinsten Nummern: ${R} statt ${W}.`, `${first}The ${bond}s get the lowest numbers: ${R} instead of ${W}.`)
      : tr(`${first}Die ${bond} bekommt die kleinste Nummer: ${R} statt ${W}.`, `${first}The ${bond} gets the lowest number: ${R} instead of ${W}.`);
  }
  if (x.rule === "prefixes") {
    const alkyl = r.prefixes.every(p => /yl$/.test(p.name));
    if (!many) return alkyl ? tr(`Der Ast bekommt die kleinste Nummer: ${R} statt ${W}.`, `The branch gets the lowest number: ${R} instead of ${W}.`)
      : tr(`Die Vorsilbe bekommt die kleinste Nummer: ${R} statt ${W}.`, `The prefix gets the lowest number: ${R} instead of ${W}.`);
    const firstDiff = sum(x.right) >= sum(x.wrong) ? tr(" Der erste Unterschied entscheidet.", " The first difference decides.") : "";
    return tr(`Die ${prefixKind(r.prefixes)} bekommen die kleinsten Nummern: ${R} statt ${W}.`, `The ${prefixKind(r.prefixes)} get the lowest numbers: ${R} instead of ${W}.`) + firstDiff;
  }
  if (x.rule === "alpha") return tr(`Von beiden Seiten gleiche Nummern. Dann entscheidet das Alphabet: ${prefixWord(x.prefix!)} bekommt die ${R}.`,
    `Both ends give the same numbers. Then the alphabet decides: ${prefixWord(x.prefix!)} gets ${R}.`);
  if (x.rule === "z") return tr(`Bei Wahl bekommt Z die kleinere Nummer: ${R} statt ${W}.`, `If there is a choice, Z gets the lower number: ${R} instead of ${W}.`);
  // „count“ (meiste Vorsilben) kommt bei derselben Kette in Gegenrichtung nicht vor – allgemeine Regel als Rückfall
  return tr("Von der anderen Seite gezählt sind die Nummern nicht die kleinsten.", "Counted from the other end, the numbers are not the lowest.");
}

/** Erklärung aus dem Lösungsweg (letzte drei Schritte). Nennt eine Rückmeldung schon die Zählrichtung (Ablenker „nummer“),
 *  fehlt die Zeile „Nummerieren“ – sonst stünde nach dieser Antwort derselbe Satz zweimal da */
const NUMBERING = /^(Nummerieren|Numbering|Das Heteroatom|The heteroatom)/;
function stepsExplain(r: NameOk, q: { miss?: Record<number, string> }): string {
  const skip = Object.values(q.miss ?? {}).includes("nummer");
  return r.steps.filter(x => !(skip && NUMBERING.test(x))).slice(-3).join(" ");
}

/** falsche Namen aus der Benennung selbst – je ein typischer Fehler */
export function nameDistractors(m: Mol, right: NameOk, extra: Distractor[] = []): Distractor[] {
  const out: Distractor[] = [...extra];
  const bad = new Set([right.name, ...right.alt]);
  const add = (nm: string | undefined, miss: string, why: string) => { if (nm && !bad.has(nm)) { bad.add(nm); out.push(d(nm, miss, why)); } };
  const v = (opt: NameOptions) => ok(m, opt)?.name;
  // andere Richtung: nur, wenn eine Regel sie ausschließt (sonst wäre sie gleichwertig)
  const rev = ok(m, { pick: "reverse" });
  if (rev?.reverse) add(rev.name, "nummer", reverseWhy(right, rev.reverse));
  add(v({ pick: "otherChain" }), "kette-kurz", right.principal
    ? tr(`Die Hauptkette hat ${right.parent.size} C. Sie muss nicht gerade gezeichnet sein.`, `The main chain has ${right.parent.size} C. It does not have to be drawn straight.`)
    : tr(`Die längste Kette hat ${right.parent.size} C. Sie muss nicht gerade gezeichnet sein.`, `The longest chain has ${right.parent.size} C. It does not have to be drawn straight.`));
  const multi = right.prefixes.find(p => p.locs.length > 1);
  add(v({ noAlpha: true }), "alphabet", tr(`Vorsilben alphabetisch ordnen: ${right.prefixes.map(p => prefixWord(p.name)).join(" vor ")}.`, `Sort prefixes alphabetically: ${right.prefixes.map(p => prefixWord(p.name)).join(" before ")}.`)
    + (multi ? tr(" Di und tri zählen dabei nicht.", " Di and tri do not count.") : ""));
  add(v({ noMult: true }), "multi", multi
    ? tr(`Gleiche ${prefixKind([multi])} zusammenfassen: ${capName(MULT[multi.locs.length] + multi.name)} statt ${multi.locs.length} × ${prefixWord(multi.name)}.`,
      `Combine identical ${prefixKind([multi])}: ${MULT[multi.locs.length]}${prefixEn(multi.name)} instead of ${multi.locs.length} × ${prefixWord(multi.name)}.`)
    : tr("Gleiche Vorsilben mit di, tri zusammenfassen.", "Combine identical prefixes with di, tri."));
  if (right.parent.kind === "chain") {
    add(restem(right.name, right.parent.size, 1), "zaehlen", tr(`Die Hauptkette hat ${right.parent.size} C, nicht ${right.parent.size + 1}.`, `The main chain has ${right.parent.size} C, not ${right.parent.size + 1}.`));
    // kürzer nur ohne E/Z-Angabe: an der kürzeren Kette gäbe es oft kein E/Z mehr ((Z)-Prop-2-en)
    if (!right.stereo.some(s => s.desc)) add(restem(right.name, right.parent.size, -1), "zaehlen", tr(`Die Hauptkette hat ${right.parent.size} C, nicht ${right.parent.size - 1}.`, `The main chain has ${right.parent.size} C, not ${right.parent.size - 1}.`));
  }
  return out;
}

// ── Moleküle würfeln ────────────────────────────────────────────────────────

/** verzweigtes Alkan: Kette 4–8 C, 1–3 Äste (Methyl, Ethyl) */
function branchedAlkane(): string {
  const n = rnd(4, 8), k = rnd(1, n >= 6 ? 3 : 2), br: Record<number, string[]> = {};
  for (let j = 0; j < k; j++) {
    const ethyl = n >= 6 && Math.random() < 0.3;
    const i = ethyl ? rnd(2, n - 3) : rnd(1, n - 2);
    if ((br[i]?.length ?? 0) >= 2) continue;
    addBranch(br, i, ethyl ? "CC" : "C");
  }
  return chain(n, br);
}

/** Kette 3–7 C mit einer Doppel- oder Dreifachbindung, evtl. ein Methylast */
function unsaturated(): { s: string; triple: boolean } {
  const n = rnd(3, 7), triple = Math.random() < 0.35;
  const at = rnd(0, n - 2);
  const br: Record<number, string[]> = {};
  if (n >= 5 && Math.random() < 0.5) {
    const i = rnd(1, n - 2);
    // kein Ast an einem C der Dreifachbindung
    if (!triple || (i !== at && i !== at + 1)) addBranch(br, i, "C");
  }
  return { s: chain(n, br, { [at]: triple ? "#" : "=" }), triple };
}

type G = "ol" | "al" | "on" | "saeure" | "amin";
/** Kette mit einer Gruppe an Stelle `pos` (Aldehyd und Säure am Ende: am ersten C bei pos 0, sonst am letzten) */
function withGroup(n: number, g: G, pos: number, br: Record<number, string[]> = {}): string | undefined {
  const b: Record<number, string[]> = Object.fromEntries(Object.entries(br).map(([k, v]) => [k, [...v]]));
  if (g === "al") return chain(n, b, {}, pos === 0 ? { first: "O=C" } : { last: "C=O" });
  if (g === "saeure") return chain(n, b, {}, pos === 0 ? { first: "OC(=O)" } : { last: "C(=O)O" });
  if (g === "on" && (pos === 0 || pos === n - 1)) return;
  addBranch(b, pos, g === "ol" ? "O" : g === "on" ? "=O" : "N");
  return chain(n, b);
}
const G_KIND: Record<G, Kind> = { ol: "ol", al: "al", on: "on", saeure: "saeure", amin: "amin" };

// ── Aufgaben ────────────────────────────────────────────────────────────────

/** Unverzweigtes Alkan benennen */
function stamm(): Task {
  const n = pick([1, 2, 3, 4, 5, 5, 6, 6, 7, 8, 9, 10]);
  const m = mol("C".repeat(n)), r = ok(m)!;
  const wrong = [n + 1, n - 1, n + 2, n - 2].filter(k => k >= 1 && k <= 10)
    .map(k => d(ALKANE(k), "zaehlen", tr(`${cap(STEM[k])}an hätte ${k} C. Hier ${n === 1 ? "ist es 1 C" : `sind es ${n} C`}.`, `${cap(ALKANE(k))} would have ${k} C. Here there ${n === 1 ? "is 1 C" : `are ${n} C`}.`)));
  return {
    ...mc(r.name, wrong, 4, `${tr("Genau", "Exactly")}: ${n} C → ${r.name}.`),
    mol: m,
    prompt: tr("Wie heißt dieses Alkan?", "What is the name of this alkane?"),
    hint: tr("Zähle nur die C-Atome. Welcher Stamm gehört zu dieser Zahl?", "Count only the C atoms. Which stem belongs to that number?"),
    explain: tr(`Die Kette hat **${n} C** → **${r.name}**.`, `The chain has **${n} C** → **${r.name}**.`),
  };
}

/** Wie viele C hat die Hauptkette? */
function kette(): Task {
  let m: Mol, r: NameOk;
  do { m = mol(branchedAlkane()); r = ok(m)!; } while (r.parent.size === m.atoms.length);
  const other = ok(m, { pick: "otherChain" });
  const traps = [
    { field: "n", value: m.atoms.length, miss: "alle-c", why: tr(`${m.atoms.length} sind alle C. Die Äste zählen nicht zur Hauptkette.`, `${m.atoms.length} is the number of all C. Branches do not count as part of the main chain.`) },
    ...(other ? [{ field: "n", value: other.parent.size, miss: "kette-kurz", why: tr(`Es gibt eine längere Kette mit ${r.parent.size} C.`, `There is a longer chain with ${r.parent.size} C.`) }] : []),
  ].filter(t => t.value !== r.parent.size);
  return {
    kind: "num", answer: r.parent.size, mol: m, traps,
    prompt: tr("Wie viele C-Atome hat die **längste Kette**?", "How many C atoms does the **longest chain** have?"),
    hint: tr("Fahre von einem Kettenende zum anderen. Probiere auch die Äste als Ende.", "Trace from one chain end to the other. Also try the branches as ends."),
    explain: tr(`Die längste Kette hat **${r.parent.size} C** → Stamm **${cap(STEM[r.parent.size])}an**. Name: ${r.name}.`, `The longest chain has **${r.parent.size} C** → stem **${STEM[r.parent.size]}ane**. Name: ${r.name}.`),
  };
}

/** Verzweigtes Alkan benennen */
function alkan(): Task {
  let m: Mol, r: NameOk;
  do { m = mol(branchedAlkane()); r = ok(m)!; } while (r.prefixes.length === 0 || rareRule(m));
  const q = mc(r.name, nameDistractors(m, r), 4, `${tr("Genau", "Exactly")}: ${r.name}.`);
  return {
    ...q,
    mol: m,
    prompt: tr("Wie heißt dieses Alkan?", "What is the name of this alkane?"),
    hint: tr("Längste Kette suchen. Dann so nummerieren, dass die Äste kleine Nummern haben.", "Find the longest chain. Then number it so that the branches get low numbers."),
    explain: stepsExplain(r, q),
  };
}

/** Alken oder Alkin benennen */
function alken(): Task {
  let u: ReturnType<typeof unsaturated>, m: Mol, r: NameOk;
  do { u = unsaturated(); m = maybeFlip(mol(u.s)); r = ok(m)!; } while (!r || rareRule(m));
  const extra: Distractor[] = [];
  // E/Z vertauscht (nur wenn die Doppelbindung E/Z hat)
  const st = r.stereo.find(x => x.desc);
  const flipped = st && ok(flipBond(m, st.a, st.b) ?? m);
  if (st && flipped && flipped.name !== r.name) extra.push(d(flipped.name, "ez", st.desc === "Z"
    ? tr("Die vorrangigen Gruppen liegen auf derselben Seite → **Z**.", "The higher-priority groups are on the same side → **Z**.") : tr("Die vorrangigen Gruppen liegen auf verschiedenen Seiten → **E**.", "The higher-priority groups are on opposite sides → **E**.")));
  const base = r.name.replace(/^\((?:\d*[EZ],?)+\)-/, "");
  const swap = tr(base.replace(u.triple ? /in(?=$|-)/ : /en(?=$|-)/, u.triple ? "en" : "in"), base.replace(u.triple ? /yne$/ : /ene$/, u.triple ? "ene" : "yne"));
  if (swap !== base) extra.push(d(tr(cap(swap), swap), "en-in", u.triple ? tr("Dreifachbindung → **-in**. Doppelbindung wäre -en.", "Triple bond → **-yne**. A double bond would be -ene.") : tr("Doppelbindung → **-en**. Dreifachbindung wäre -in.", "Double bond → **-ene**. A triple bond would be -yne.")));
  const sat = ok(mol(u.s.replace(/[=#]/, "")));
  if (sat) extra.push(d(sat.name, "mehrfach-vergessen", tr(`${sat.name} hätte nur Einfachbindungen. Hier ist eine ${u.triple ? "Dreifach" : "Doppel"}bindung.`, `${capName(sat.name)} would have only single bonds. Here there is a ${u.triple ? "triple" : "double"} bond.`)));
  const q = mc(r.name, nameDistractors(m, r, extra), 4, `${tr("Genau", "Exactly")}: ${r.name}.`);
  return {
    ...q,
    mol: m,
    prompt: tr(`Wie heißt dieses ${u.triple ? "Alkin" : "Alken"}?`, `What is the name of this ${u.triple ? "alkyne" : "alkene"}?`),
    hint: tr("Die Mehrfachbindung bekommt die kleinste Nummer. Die Zahl steht vor -en bzw. -in.", "The multiple bond gets the lowest number. The number stands before -ene or -yne."),
    explain: stepsExplain(r, q),
  };
}

/** zufällig an der ersten Doppelbindung spiegeln – damit E und Z vorkommen */
function maybeFlip(m: Mol): Mol {
  const b = m.bonds.find(x => x.order === 2);
  return b && Math.random() < 0.5 ? flipBond(m, b.a, b.b) ?? m : m;
}

/** Gruppen an einer Doppelbindung: links a, b – rechts c, e ("" = H) */
const EZ_LEFT = ["C", "CC", "Cl", "Br", "CO", "C(C)C"];
const EZ_SECOND = ["", "", "C", "Cl", "F"];

/** E oder Z? */
function ez(): Task {
  for (;;) {
    const [a, b] = [pick(EZ_LEFT), pick(EZ_SECOND)], [c, e] = [pick(EZ_LEFT), pick(EZ_SECOND)];
    if (a === b || c === e) continue;
    const m = maybeFlip(mol(`${a}C${b ? `(${b})` : ""}=C${e ? `(${e})` : ""}${c}`));
    const r = ok(m);
    const st = r?.stereo[0];
    if (!r || !st?.desc || r.stereo.length !== 1) continue;
    const other = st.desc === "E" ? "Z" : "E";
    return {
      ...mc(st.desc, [d(other, "ez", st.desc === "Z"
        ? tr("Die vorrangigen Gruppen liegen auf **derselben** Seite der Doppelbindung → Z.", "The higher-priority groups are on the **same** side of the double bond → Z.")
        : tr("Die vorrangigen Gruppen liegen auf **verschiedenen** Seiten der Doppelbindung → E.", "The higher-priority groups are on **opposite** sides of the double bond → E."))], 2,
        `${tr("Genau", "Exactly")}: ${r.name}.`),
      mol: m,
      prompt: tr("Ist diese Doppelbindung **E** oder **Z**?", "Is this double bond **E** or **Z**?"),
      hint: tr("An jedem C der Doppelbindung: Gruppe mit größerer Ordnungszahl. Gleiche Seite = Z.", "On each C of the double bond: the group with the higher atomic number. Same side = Z."),
      explain: r.steps.find(x => /(Doppelbindung|Double bond) C\d+:/.test(x)) ?? r.steps.slice(-1).join(" "),
    };
  }
}

/** An welchem C beginnt die Doppelbindung? */
function lage(): Task {
  let u: ReturnType<typeof unsaturated>, m: Mol, r: NameOk;
  do { u = unsaturated(); m = mol(u.s); r = ok(m)!; } while (r.parent.size < 4);
  const ref = /-(\d+)-(?:di)?(?:en|in|yn)/.exec(r.name);
  const loc = ref ? Number(ref[1]) : 1;
  const rev = r.parent.size - loc;
  return {
    kind: "num", answer: loc, mol: m,
    traps: rev !== loc ? [{ field: "n", value: rev, miss: "nummer", why: tr(`Das ist von der anderen Seite gezählt. Von hier aus ist die Nummer kleiner.`, `That is counted from the other end. From this end the number is lower.`) }] : [],
    prompt: tr(`Welche Nummer bekommt die ${u.triple ? "Dreifach" : "Doppel"}bindung?`, `Which number does the ${u.triple ? "triple" : "double"} bond get?`),
    hint: tr("Von dem Ende zählen, das näher an der Mehrfachbindung liegt.", "Count from the end that is closer to the multiple bond."),
    explain: tr(`Die Mehrfachbindung beginnt bei **C${loc}** → **${r.name}**.`, `The multiple bond starts at **C${loc}** → **${r.name}**.`),
  };
}

const CLASS_OF: Record<string, string> = tr(
  { ol: "Alkohol", al: "Aldehyd", on: "Keton", saeure: "Carbonsäure", amin: "Amin", ester: "Ester", ether: "Ether" },
  { ol: "Alcohol", al: "Aldehyde", on: "Ketone", saeure: "Carboxylic acid", amin: "Amine", ester: "Ester", ether: "Ether" });
const CLASS_WHY: Record<string, string> = tr({
  ol: "Alkohol: –OH an einem C mit nur Einfachbindungen.",
  al: "Aldehyd: C=O am Kettenende, also –CHO.",
  on: "Keton: C=O in der Kette, zwischen zwei C.",
  saeure: "Carbonsäure: C=O und –OH am selben C, also –COOH.",
  amin: "Amin: –NH₂ am C.",
  ester: "Ester: –COO– verbindet Säureteil und Alkylteil.",
  ether: "Ether: ein O zwischen zwei C, ohne C=O.",
}, {
  ol: "Alcohol: –OH on a C with only single bonds.",
  al: "Aldehyde: C=O at the end of the chain, i.e. –CHO.",
  on: "Ketone: C=O within the chain, between two C.",
  saeure: "Carboxylic acid: C=O and –OH on the same C, i.e. –COOH.",
  amin: "Amine: –NH₂ on a C.",
  ester: "Ester: –COO– links the acid part and the alkyl part.",
  ether: "Ether: an O between two C, without C=O.",
});

/** zufälliges Molekül einer Klasse */
function classMol(cls: string): string {
  const n = cls === "on" ? rnd(3, 5) : rnd(2, 5);
  if (cls === "ester") return chain(rnd(1, 4), {}, {}, { last: "C(=O)O" + "C".repeat(rnd(1, 3)) });
  if (cls === "ether") return "C".repeat(rnd(1, 3)) + "O" + "C".repeat(rnd(1, 3));
  const g = cls as G;
  return withGroup(n, g, g === "on" ? rnd(1, n - 2) : rnd(0, n - 1))!;
}

/** Zu welcher Stoffklasse gehört das Molekül? */
function klasse(): Task {
  const cls = pick(["ol", "al", "on", "saeure", "amin", "ester", "ether"]);
  const m = mol(classMol(cls)), right = CLASS_OF[cls];
  const near: Record<string, string[]> = {
    ol: ["saeure", "ether", "al"], al: ["on", "ol", "saeure"], on: ["al", "ether", "ester"],
    saeure: ["ol", "ester", "al"], amin: ["ol", "ether", "al"], ester: ["ether", "saeure", "on"], ether: ["ol", "ester", "on"],
  };
  const wrong = near[cls].map(w => d(CLASS_OF[w], "klasse", CLASS_WHY[w]));
  return {
    ...mc(right, wrong, 4, `${tr("Genau", "Exactly")}: ${CLASS_WHY[cls]}`),
    mol: m,
    prompt: tr("Zu welcher Stoffklasse gehört dieses Molekül?", "Which compound class does this molecule belong to?"),
    hint: tr("Suche die Atome außer C und H. Was hängt woran?", "Look for the atoms other than C and H. What is attached to what?"),
    explain: CLASS_WHY[cls],
  };
}

const SUFFIX: Record<G, string> = tr({ ol: "-ol", al: "-al", on: "-on", saeure: "-säure", amin: "-amin" }, { ol: "-ol", al: "-al", on: "-one", saeure: "-oic acid", amin: "-amine" });
/** Welche Endung bekommt der Name? */
function endung(): Task {
  const g = pick<G>(["ol", "al", "on", "saeure", "amin"]);
  const n = rnd(3, 6);
  const s = withGroup(n, g, g === "on" ? rnd(1, n - 2) : rnd(0, n - 2))!;
  const m = mol(s);
  const wrong = (Object.keys(SUFFIX) as G[]).filter(x => x !== g)
    .map(x => d(SUFFIX[x], "endung", tr(`${SUFFIX[x]} gehört zu ${KIND_INFO[G_KIND[x]].label} ${KIND_INFO[G_KIND[x]].group}. Hier ist ${KIND_INFO[G_KIND[g]].group}.`, `${SUFFIX[x]} belongs to ${KIND_INFO[G_KIND[x]].label.toLowerCase()} ${KIND_INFO[G_KIND[x]].group}. Here there is ${KIND_INFO[G_KIND[g]].group}.`)));
  return {
    ...mc(SUFFIX[g], wrong, 4, `${tr("Genau", "Exactly")}: ${KIND_INFO[G_KIND[g]].label} → ${SUFFIX[g]}.`),
    mol: m,
    prompt: tr("Welche Endung bekommt der Name?", "Which ending does the name get?"),
    hint: tr("Bestimme zuerst die Gruppe: Was hängt am C außer C und H?", "First identify the group: what is attached to the C besides C and H?"),
    explain: `${KIND_INFO[G_KIND[g]].label} ${KIND_INFO[G_KIND[g]].group} → ${tr("Endung", "ending")} **${SUFFIX[g]}**: ${ok(m)!.name}.`,
  };
}

/** Alkohol, Aldehyd, Keton, Säure oder Amin benennen (evtl. mit Methylast) */
function gruppen(): Task {
  for (;;) {
    const g = pick<G>(["ol", "ol", "al", "on", "saeure", "amin"]);
    const n = rnd(2, 6);
    const pos = g === "on" ? rnd(1, n - 2) : rnd(0, n - 1);
    const br: Record<number, string[]> = {};
    // kein Ast am C des Ketons (C=O und zwei Kettennachbarn: Wertigkeit voll)
    if (n >= 4 && Math.random() < 0.5) { const i = rnd(1, n - 2); if (g !== "on" || i !== pos) addBranch(br, i, "C"); }
    const s = withGroup(n, g, pos, br);
    if (!s) continue;
    const m = mol(s), r = ok(m);
    if (!r || r.principal !== G_KIND[g] || rareRule(m)) continue;
    // andere Gruppe an derselben Stelle → echte Namen anderer Stoffe (nur ein Unterschied: die Gruppe;
    // Aldehyd und Säure nur, wenn die Stelle ein Kettenende ist)
    const at = (g === "al" || g === "saeure") && pos !== 0 ? n - 1 : pos;
    const extra: Distractor[] = [];
    for (const x of ["ol", "al", "on", "saeure"] as G[]) {
      if (x === g || ((x === "al" || x === "saeure") && at !== 0 && at !== n - 1)) continue;
      const alt = withGroup(n, x, at, br);
      const ra = alt && ok(mol(alt));
      if (ra && ra.name !== r.name) extra.push(d(ra.name, "endung", tr(`${SUFFIX[x]} steht für ${KIND_INFO[G_KIND[x]].label}. Hier ist ${KIND_INFO[G_KIND[g]].group}: ${SUFFIX[g]}.`, `${SUFFIX[x]} stands for ${KIND_INFO[G_KIND[x]].label.toLowerCase()}. Here there is ${KIND_INFO[G_KIND[g]].group}: ${SUFFIX[g]}.`)));
    }
    if (g === "al" || g === "saeure") {
      const short = restem(r.name, r.parent.size, -1);
      if (short) extra.unshift(d(short, "c-gruppe", tr(`Das C der ${KIND_INFO[G_KIND[g]].group}-Gruppe zählt mit. Die Kette hat ${r.parent.size} C.`, `The C of the ${KIND_INFO[G_KIND[g]].group} group counts too. The chain has ${r.parent.size} C.`)));
    }
    const q = mc(r.name, nameDistractors(m, r, shuffle(extra).slice(0, 2)), 4, `${tr("Genau", "Exactly")}: ${r.name}.`);
    return {
      ...q,
      mol: m,
      prompt: tr("Wie heißt diese Verbindung?", "What is the name of this compound?"),
      hint: g === "al" || g === "saeure" ? tr("Das C der Gruppe gehört zur Kette und ist C1.", "The C of the group belongs to the chain and is C1.") : tr("Die Gruppe bekommt die kleinste Nummer.", "The group gets the lowest number."),
      explain: stepsExplain(r, q),
    };
  }
}

/** Ester benennen: Säureteil + Alkylteil + ester */
function ester(): Task {
  for (;;) {
    const a = rnd(1, 5), b = rnd(1, 5);
    if (a === b + 1) continue; // vertauschte Teile ergäben sonst denselben Stamm
    const m = mol(a === 1 ? "O=CO" + "C".repeat(b) : "C".repeat(a - 1) + "C(=O)O" + "C".repeat(b)), r = ok(m);
    if (!r || r.principal !== "ester") continue;
    const acidC = a, alkC = b;
    const extra: Distractor[] = [];
    const swapped = ESTER(alkC, acidC);
    if (swapped !== r.name) extra.push(d(swapped, "ester-teile", tr(`Die Säure ist der Teil mit C=O. Er hat ${acidC} C: ${cap(STEM[acidC])}ansäure.`, `The acid is the part with C=O. It has ${acidC} C: ${STEM[acidC]}anoate.`)));
    if (acidC > 1) extra.push(d(ESTER(acidC - 1, alkC), "c-gruppe", tr(`Das C der C=O-Gruppe gehört zur Säure. Sie hat ${acidC} C.`, `The C of the C=O group belongs to the acid. It has ${acidC} C.`)));
    extra.push(d(ESTER(acidC, alkC + 1), "zaehlen", tr(`Der Alkylteil hinter dem O hat ${alkC} C.`, `The alkyl part after the O has ${alkC} C.`)));
    extra.push(d(ESTER(acidC + 1, alkC), "zaehlen", tr(`Der Säureteil mit C=O hat ${acidC} C.`, `The acid part with C=O has ${acidC} C.`)));
    return {
      ...mc(r.name, extra, 4, `${tr("Genau", "Exactly")}: ${r.name}${r.alt[0] ? ` (${r.alt[0]})` : ""}.`),
      mol: m,
      prompt: tr("Wie heißt dieser Ester?", "What is the name of this ester?"),
      hint: tr("Säureteil mit C=O zuerst, dann der Rest am O, dann -ester.", "First the alkyl group on the O, then the acid part with C=O ending in -oate."),
      explain: r.steps.slice(-1).join(" "),
    };
  }
}

/** Molekül mit Hauptgruppe und 2–3 Vorsilben (Kette 5–8 C) */
function multiMol(): { m: Mol; r: NameOk; g: G } {
  for (;;) {
    const g = pick<G>(["saeure", "al", "on", "ol"]);
    const n = rnd(5, 8);
    const pos = g === "on" ? rnd(1, n - 2) : rnd(0, n - 2);
    const br: Record<number, string[]> = {};
    const subs = shuffle(["C", "C", "CC", "O", "=O", "N", "Cl"]).slice(0, rnd(2, 3));
    for (const sb of subs) {
      const i = sb === "CC" ? rnd(2, n - 3) : rnd(1, n - 2);
      // höchstens eine Vorsilbe je C; kein zweites =O, wenn schon ein Keton die Endung gibt (wäre -dion statt Oxo)
      if (i === pos && g !== "saeure" && g !== "al") continue;
      if (br[i]?.length || (sb === "=O" && g === "on")) continue;
      addBranch(br, i, sb);
    }
    const s = withGroup(n, g, pos, br);
    if (!s) continue;
    const m = mol(s), r = ok(m);
    if (r && r.principal === G_KIND[g] && r.prefixes.length >= 2 && !rareRule(m)) return { m, r, g };
  }
}

/** Welche Gruppe gibt die Endung? */
function prio(): Task {
  let { m, r } = multiMol();
  while (!r.prefixes.some(p => ["hydroxy", "oxo", "amino"].includes(p.name))) ({ m, r } = multiMol());
  const kinds = [...new Set([r.principal!, ...r.prefixes.map(p => ({ hydroxy: "ol", oxo: "on", amino: "amin" } as Record<string, Kind>)[p.name]).filter(Boolean)])] as Kind[];
  const right = KIND_INFO[r.principal!];
  const wrong = kinds.filter(k => k !== r.principal).map(k => d(`${KIND_INFO[k].label} ${KIND_INFO[k].group}`, "prio",
    tr(`${right.label} steht in der Rangfolge vor ${KIND_INFO[k].label}. Die Gruppe ${KIND_INFO[k].group} wird Vorsilbe: ${KIND_INFO[k].prefix}`, `${right.label} ranks before ${KIND_INFO[k].label.toLowerCase()}. The ${KIND_INFO[k].group} group becomes a prefix: ${KIND_INFO[k].prefix}`)));
  // Teile der Hauptgruppe sehen aus wie andere Gruppen: OH und C=O der COOH-Gruppe, C=O der CHO-Gruppe (gibt es zusätzlich ein Keton, wird es genannt)
  const keton = kinds.includes("on");
  const part = (k: Kind): string => {
    if (r.principal === "saeure" && k === "ol") return tr("Das –OH gehört zur COOH-Gruppe (am selben C wie C=O). Zusammen ist das eine Carbonsäure.", "The –OH belongs to the COOH group (on the same C as C=O). Together that is a carboxylic acid.");
    if (r.principal === "saeure" && k === "al") return tr(`Am Kettenende sitzt die COOH-Gruppe, kein –CHO.${keton ? " Das C=O in der Kette ist ein Keton." : ""}`, `The end of the chain carries the COOH group, not –CHO.${keton ? " The C=O within the chain is a ketone." : ""}`);
    if (r.principal === "saeure" && k === "on") return tr("Das einzige C=O gehört zur COOH-Gruppe. Zusammen ist das eine Carbonsäure.", "The only C=O belongs to the COOH group. Together that is a carboxylic acid.");
    if (r.principal === "al" && k === "on") return tr("Das C=O am Kettenende ist eine Aldehydgruppe –CHO.", "The C=O at the end of the chain is an aldehyde group –CHO.");
    return tr(`Hier gibt es keine ${KIND_INFO[k].group}-Gruppe.`, `There is no ${KIND_INFO[k].group} group here.`);
  };
  const fill = (["saeure", "al", "on", "ol", "amin"] as Kind[]).filter(k => k !== r.principal && !kinds.includes(k))
    .map(k => d(`${KIND_INFO[k].label} ${KIND_INFO[k].group}`, "klasse", part(k)));
  return {
    ...mc(`${right.label} ${right.group}`, [...wrong, ...fill], 4, tr(`Genau: ${right.label} hat den höchsten Rang → ${right.suffix}.`, `Exactly: ${right.label.toLowerCase()} has the highest rank → ${right.suffix}.`)),
    mol: m,
    prompt: tr("Welche Gruppe bestimmt die **Endung**?", "Which group determines the **ending**?"),
    hint: tr("Benenne zuerst jede Gruppe im Molekül. Dann vergleiche ihre Plätze in der Rangfolge.", "First name each group in the molecule. Then compare their places in the order of rank."),
    explain: tr(`Höchster Rang: **${right.label}** → Endung **${right.suffix}**. Name: ${r.name}.`, `Highest rank: **${right.label.toLowerCase()}** → ending **${right.suffix}**. Name: ${r.name}.`),
  };
}

/** Molekül mit mehreren Gruppen benennen */
function mehrere(): Task {
  const { m, r } = multiMol();
  const extra: Distractor[] = [];
  const kinds = new Set(r.prefixes.map(p => p.name));
  // falsche Rangfolge als Name – nicht bei Säuren (die COOH-Gruppe würde zu „1-Hydroxy-…-1-oxo“, so benennt sie niemand)
  const lower: Kind[] = r.principal === "saeure" ? [] : (["on", "ol", "amin"] as Kind[]).filter(k => kinds.has({ on: "oxo", ol: "hydroxy", amin: "amino" }[k as "on"]));
  for (const k of lower) {
    const w = ok(m, { principal: k });
    if (w && w.name !== r.name) extra.push(d(w.name, "prio", tr(`${KIND_INFO[r.principal!].label} geht vor ${KIND_INFO[k].label}. Diese Gruppe gibt die Endung ${KIND_INFO[r.principal!].suffix}.`, `${KIND_INFO[r.principal!].label} ranks before ${KIND_INFO[k].label.toLowerCase()}. This group gives the ending ${KIND_INFO[r.principal!].suffix}.`)));
  }
  const q = mc(r.name, nameDistractors(m, r, extra.slice(0, 1)), 4, `${tr("Genau", "Exactly")}: ${r.name}.`);
  return {
    ...q,
    mol: m,
    prompt: tr("Wie heißt diese Verbindung?", "What is the name of this compound?"),
    hint: tr("Ranghöchste Gruppe → Endung. Längste Kette mit ihr, kleinste Nummern, alphabetisch.", "Principal group → ending. Longest chain containing it, lowest numbers, alphabetical."),
    explain: stepsExplain(r, q),
  };
}

/** Name → richtige Formel wählen */
function struktur(): Task {
  for (;;) {
    const useMulti = Math.random() < 0.5;
    const base = useMulti ? multiMol() : (() => { let m: Mol, r: NameOk; do { m = mol(branchedAlkane()); r = ok(m)!; } while (!r.prefixes.length); return { m, r }; })();
    const { m, r } = base;
    // Fehlformeln: gleiche Bausteine, aber verschoben oder verzählt (echte andere Moleküle)
    const others: { m: Mol; miss: string; why: string }[] = [];
    const seen = new Set([r.name, ...r.alt]);
    for (let k = 0; k < 30 && others.length < 5; k++) {
      const mm = mutate(m), rr = mm && ok(mm);
      if (mm && rr && !seen.has(rr.name)) { seen.add(rr.name); others.push({ m: mm, ...formulaMiss(r, rr) }); }
    }
    if (others.length < 3) continue;
    const opts = shuffle(others).slice(0, 3);
    const keys = [r.name, ...opts.map(o => ok(o.m)!.name)];
    const q = mc(r.name, opts.map((o, i) => d(keys[i + 1], o.miss, o.why)), 4, tr(`Genau: das ist ${r.name}.`, `Exactly: that is ${r.name}.`));
    return {
      ...q,
      mols: Object.fromEntries(keys.map((k, i) => [k, i === 0 ? m : opts[i - 1].m])),
      prompt: tr(`Welche Formel zeigt **${r.name}**?`, `Which formula shows **${r.name}**?`),
      hint: tr("Stamm am Ende lesen, dann die Vorsilben mit ihren Nummern einzeichnen.", "Read the stem at the end, then draw in the prefixes with their numbers."),
      explain: stepsExplain(r, q),
    };
  }
}

/** Name → Formel: Stolperstein und Rückmeldung nach dem Unterschied zwischen gesuchtem Namen `r` und der gewählten Formel `rr` –
 *  andere ranghöchste Gruppe, andere Vorsilben, andere Kettenlänge, alle Nummern gespiegelt (vom falschen Ende gezählt) oder eine Gruppe an anderer Stelle */
export function formulaMiss(r: NameOk, rr: NameOk): { miss: string; why: string } {
  const N = r.parent.size, is = tr(` – diese Formel heißt ${rr.name}.`, ` – this formula is ${rr.name}.`);
  const kind = (x: NameOk) => (x.principal ? `${KIND_INFO[x.principal].label} ${KIND_INFO[x.principal].group}` : tr("keine Gruppe mit Endung", "no group with an ending"));
  const items = (x: NameOk) => x.prefixes.map(p => tr(capName(`${p.locs.length > 1 ? MULT[p.locs.length] : ""}${p.name}`), prefixEn(`${p.locs.length > 1 ? MULT[p.locs.length] : ""}${p.name}`)));
  if (rr.principal !== r.principal) return { miss: "endung", why: tr(`Ranghöchste Gruppe hier: ${kind(rr)} statt ${kind(r)}`, `Principal group here: ${kind(rr)} instead of ${kind(r)}`) + is };
  // Vorsilben anders: nur die abweichenden nennen (Dimethyl statt Methyl; fehlt Methyl; zusätzlich Chlor)
  const lack = items(r).filter(x => !items(rr).includes(x)), more = items(rr).filter(x => !items(r).includes(x));
  if (lack.length || more.length) return {
    miss: "formel-lesen",
    why: (lack.length && more.length ? tr(`Hier steht ${more.join(", ")} statt ${lack.join(", ")}`, `Here it is ${more.join(", ")} instead of ${lack.join(", ")}`)
      : lack.length ? tr(`Hier fehlt ${lack.join(", ")}`, `${capName(lack.join(", "))} is missing here`) : tr(`Hier ist zusätzlich ${more.join(", ")}`, `There is an extra ${more.join(", ")} here`)) + is,
  };
  if (rr.parent.size !== N) return { miss: Math.abs(rr.parent.size - N) === 1 ? "zaehlen" : "formel-lesen", why: tr(`Die Hauptkette hat hier ${rr.parent.size} C statt ${N}`, `The main chain here has ${rr.parent.size} C instead of ${N}`) + is };
  // gleiche Bausteine, andere Nummern
  const pl = (x: NameOk) => (x.parts.find(p => p.key === "principal")?.text.match(/\d+(?:,\d+)*/)?.[0] ?? "").split(",").filter(Boolean);
  const locsOf = (x: NameOk, n: string) => x.prefixes.find(p => p.name === n)?.locs ?? [];
  const sorted = (ls: string[]) => [...ls].sort().join();
  const mirrored = (a: string[], b: string[]) => sorted(a) === sorted(b.map(l => String(N + 1 - Number(l))));
  if (mirrored(pl(rr), pl(r)) && r.prefixes.every(p => mirrored(locsOf(rr, p.name), p.locs)))
    return { miss: "nummer", why: tr("Vom falschen Ende gezählt", "Counted from the wrong end") + is };
  const at = (ls: string[]) => ls.map(l => (/^\d/.test(l) ? "C" + l : l)).join(", ");
  const moved = r.prefixes.find(p => sorted(locsOf(rr, p.name)) !== sorted(p.locs));
  if (moved) return { miss: "stelle", why: tr(`${capName(moved.name)} sitzt hier an ${at(locsOf(rr, moved.name))} statt an ${at(moved.locs)}`, `${capName(prefixEn(moved.name))} is at ${at(locsOf(rr, moved.name))} here instead of ${at(moved.locs)}`) + is };
  if (sorted(pl(rr)) !== sorted(pl(r)) && r.principal) return { miss: "stelle", why: tr(`Die Gruppe ${KIND_INFO[r.principal].group} sitzt hier an ${at(pl(rr))} statt an ${at(pl(r))}`, `The ${KIND_INFO[r.principal].group} group is at ${at(pl(rr))} here instead of ${at(pl(r))}`) + is };
  return { miss: "formel-lesen", why: tr(`Diese Formel heißt ${rr.name}.`, `This formula is ${rr.name}.`) };
}

/** kleines Abändern: Ast an ein anderes C, Kette um 1 C länger/kürzer, Gruppe tauschen (die O der COOH-Gruppe bleiben) */
function mutate(m: Mol): Mol | undefined {
  const atoms = m.atoms.map(a => ({ ...a })), bonds = m.bonds.map(b => ({ ...b }));
  const nbOf = (id: number) => bonds.filter(b => b.a === id || b.b === id).map(b => (b.a === id ? b.b : b.a));
  const deg = (id: number) => nbOf(id).length;
  const el = (id: number) => atoms.find(a => a.id === id)!.el;
  // O der Carboxygruppe: am selben C sitzt ein zweites O
  const inCooh = (o: number) => el(o) === "O" && nbOf(nbOf(o)[0]).filter(x => el(x) === "O").length > 1;
  const kind = pick(["move", "move", "longer", "shorter", "swap"]);
  if (kind === "move") {
    // ein Endatom (Ast) an ein anderes C hängen
    const leaves = atoms.filter(a => deg(a.id) === 1 && !inCooh(a.id));
    if (!leaves.length) return;
    const leaf = pick(leaves);
    const bond = bonds.find(b => b.a === leaf.id || b.b === leaf.id)!;
    // ein O, N oder Halogen nie an ein C, das schon ein Heteroatom trägt (sonst 1,1-Diol, Aminal … – so etwas ist nicht beständig)
    const targets = atoms.filter(a => a.el === "C" && a.id !== leaf.id && a.id !== bond.a && a.id !== bond.b && (leaf.el === "C" || nbOf(a.id).every(x => el(x) === "C")));
    if (!targets.length) return;
    const t = pick(targets);
    const used = bonds.filter(b => b.a === t.id || b.b === t.id).reduce((s, b) => s + b.order, 0);
    if (used + bond.order > 4) return;
    if (bond.a === leaf.id) bond.b = t.id; else bond.a = t.id;
    return layout({ atoms, bonds });
  }
  if (kind === "longer" || kind === "shorter") {
    const ends = atoms.filter(a => a.el === "C" && deg(a.id) === 1 && bonds.find(b => (b.a === a.id || b.b === a.id))!.order === 1);
    if (!ends.length) return;
    const e = pick(ends);
    if (kind === "shorter") return layout({ atoms: atoms.filter(a => a.id !== e.id), bonds: bonds.filter(b => b.a !== e.id && b.b !== e.id) });
    const id = Math.max(...atoms.map(a => a.id)) + 1;
    return layout({ atoms: [...atoms, { id, el: "C", x: 0, y: 0 }], bonds: [...bonds, { a: e.id, b: id, order: 1 }] });
  }
  // Gruppe tauschen: =O ↔ OH (nicht in der COOH-Gruppe – daraus würde ein Diol am selben C)
  const o = atoms.find(a => a.el === "O" && deg(a.id) === 1 && !inCooh(a.id));
  if (!o) return;
  const b = bonds.find(x => x.a === o.id || x.b === o.id)!;
  b.order = b.order === 2 ? 1 : 2;
  const c = b.a === o.id ? b.b : b.a;
  if (bonds.filter(x => x.a === c || x.b === c).reduce((s, x) => s + x.order, 0) > 4) return;
  return layout({ atoms, bonds });
}

// ── Level und Runden ─────────────────────────────────────────────────────────

/** Endungen in Frage, Tipp, Erklärung und Rückmeldungen nicht umbrechen (Antworten bleiben unverändert – sie sind Namen) */
const tidy = (gen: () => Task) => (): Task => {
  const t = gen(), k = keepEnding;
  return {
    ...t, prompt: k(t.prompt), hint: k(t.hint), explain: k(t.explain),
    ...(t.kind === "mc" && t.why ? { why: Object.fromEntries(Object.entries(t.why).map(([i, w]) => [i, k(w)])) } : {}),
    ...(t.traps ? { traps: t.traps.map(x => ({ ...x, why: k(x.why) })) } : {}),
  };
};
const GENS: Record<string, () => Task> = Object.fromEntries(Object.entries({ stamm, kette, alkan, alken, lage, ez, klasse, endung, gruppen, ester, prio, mehrere, struktur }).map(([id, g]) => [id, tidy(g)]));

export const TYPE_NAMES: Record<string, string> = tr({
  stamm: "Stammnamen", kette: "Längste Kette", alkan: "Verzweigte Alkane", alken: "Alkene und Alkine", lage: "Lage der Mehrfachbindung", ez: "E/Z-Isomerie",
  klasse: "Stoffklassen", endung: "Endungen", gruppen: "Eine funktionelle Gruppe", ester: "Ester", prio: "Rangfolge der Gruppen",
  mehrere: "Mehrere Gruppen", struktur: "Name → Formel",
}, {
  stamm: "Stem names", kette: "Longest chain", alkan: "Branched alkanes", alken: "Alkenes and alkynes", lage: "Position of the multiple bond", ez: "E/Z isomerism",
  klasse: "Compound classes", endung: "Endings", gruppen: "One functional group", ester: "Esters", prio: "Order of rank of groups",
  mehrere: "Several groups", struktur: "Name → formula",
});

interface Level extends QuizLevel { types: string[]; seq: string[] }
const level = (n: number, name: string, desc: string, seq: string[]): Level => ({ id: `og-n${n}`, name, desc, seq, types: [...new Set(seq)] });
export const LEVELS: Level[] = [
  level(1, tr("Alkane", "Alkanes"), tr("Stammnamen, längste Kette, Äste mit Nummern", "Stem names, longest chain, numbered branches"), ["stamm", "stamm", "kette", "kette", "alkan", "kette", "alkan", "stamm", "alkan", "alkan"]),
  level(2, tr("Doppel- und Dreifachbindung", "Double and triple bonds"), tr("-en und -in, Nummer der Mehrfachbindung, E/Z", "-ene and -yne, number of the multiple bond, E/Z"), ["alken", "lage", "ez", "alken", "lage", "ez", "alken", "alkan", "ez", "alken"]),
  level(3, tr("Funktionelle Gruppen", "Functional groups"), tr("Stoffklassen, Endungen, Alkohole bis Ester", "Compound classes, endings, alcohols to esters"), ["klasse", "endung", "klasse", "gruppen", "endung", "gruppen", "klasse", "ester", "gruppen", "ester"]),
  level(4, tr("Mehrere Gruppen", "Several groups"), tr("Rangfolge, Vorsilben, vom Namen zur Formel", "Order of rank, prefixes, from name to formula"), ["prio", "mehrere", "prio", "struktur", "mehrere", "prio", "struktur", "mehrere", "struktur", "mehrere"]),
];

export const levelId = (_stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[level].id : `og-${level}`);
export const levelName = (level: LevelKey) =>
  level === "mix" ? tr("Alles gemischt", "Everything mixed") : level === "weak" ? tr("Schwächen üben", "Practise weak spots") : level === "due" ? tr("Heute fällig", "Due today") : LEVELS[level].name;

/** Aufgaben in fester Reihenfolge, keine Frage doppelt */
function ordered(seq: string[]): Task[] {
  const seen = new Set<string>();
  const sig = (t: Task) => t.prompt + JSON.stringify(t.mol?.bonds ?? t.mols ?? null) + ("options" in t ? t.options.join() : "");
  return seq.map(id => {
    let t = GENS[id]();
    for (let k = 0; k < 40 && seen.has(sig(t)); k++) t = GENS[id]();
    seen.add(sig(t));
    return { ...t, type: id };
  });
}

export function makeRound(_stufe: string, level: LevelKey, stats?: TypeStats, due: string[] = []): Task[] {
  if (typeof level === "number") return ordered(LEVELS[level].seq);
  let ids = level === "mix" ? [...new Set(LEVELS.flatMap(l => l.types))]
    : level === "weak" ? weakTypes(stats, id => !!GENS[id])
    : level === "due" ? due.filter(id => GENS[id])
    : LEVELS[0].types;
  if (!ids.length) ids = LEVELS[0].types;
  return buildRound(ids, GENS, 10);
}

export { GENS };
