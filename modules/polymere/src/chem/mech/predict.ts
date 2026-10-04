// Vorhersage in der Atom-Ansicht: Bevor ein Schritt abläuft, wählt man, was passieren wird (erst vermuten, dann ansehen).
// Die richtige Antwort ergibt sich aus dem Ablauf selbst (Ansatz nachspielen, Zustand vorher und nachher vergleichen),
// jede falsche Antwort hat eine Rückmeldung, die den richtigen Vorgang nennt. Je Aktion höchstens zwei Fragen:
// beim ersten Mal das Ergebnis (wird eingebaut / keine Reaktion / Kette endet), beim zweiten Mal der Vorgang
// (wo sitzt danach das Radikal bzw. die Ladung, wo wird eingebaut, was wird abgespalten). Danach läuft die Aktion direkt.

import { tr } from "@lern/i18n";
import { method, monoName } from "../data.ts";
import { replay } from "./index.ts";
import type { Recipe, Status } from "./types.ts";

export interface PredOpt {
  text: string;
  ok: boolean;
  /** Rückmeldung zu einer falschen Wahl (nennt den richtigen Vorgang) */
  why?: string;
}

export interface Prediction {
  ask: string;
  options: PredOpt[];
  /** Bestätigung mit Begründung nach der richtigen Wahl */
  ok: string;
}

type Opt = [text: string, why?: string];

/** Frage bauen: richtige Antwort = Index `right`; falsche ohne eigene Rückmeldung bekommen die Erklärung des richtigen Vorgangs.
 *  Die Antworten werden gemischt (fester Zufall aus dem Fragetext, gleiche Reihenfolge bei jedem Aufruf) – außer `fixed`
 *  (Ergebnis-Skala „wird eingebaut / keine Reaktion / Kette endet“, bei der je nach Monomer jede richtig sein kann). */
function q(ask: string, opts: Opt[], right: number, ok: string, fixed = false): Prediction {
  const options = opts.map(([text, why], i): PredOpt => (i === right ? { text, ok: true } : { text, ok: false, why: why ?? ok }));
  if (!fixed) {
    let h = 7;
    for (const c of ask) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
    for (let i = options.length - 1; i > 0; i--) {
      h = (Math.imul(h, 1103515245) + 12345) >>> 0;
      const j = (h >>> 8) % (i + 1);
      [options[i], options[j]] = [options[j], options[i]];
    }
  }
  return { ask, ok, options };
}

/** Ergebnis eines Anlagerns: eingebaut, keine Reaktion, Kette endet (bzw. Kettenende blockiert) */
type Outcome = "grow" | "none" | "ends";
function outcome(before: Status, after: Status, step: boolean): Outcome {
  if (after.n > before.n) return after.phase === "aus" || after.phase === "ende" ? "ends" : "grow";
  // nichts eingebaut: Kettenpolymerisation – aktives Ende verloren (Nebenreaktion, H abgerissen, Titan vergiftet) oder keine Reaktion
  return !step && after.phase === "aus" && before.phase !== "aus" ? "ends" : "none";
}

/** Vorhersage-Frage zu einer Aktion – null, wenn nichts gefragt wird (schon zweimal gefragt bzw. ohne passende Frage) */
export function predict(r: Recipe, acts: string[], id: string): Prediction | null {
  const asked = acts.filter(a => a === id).length;
  if (asked >= 2) return null;
  const before = replay(r, acts).status();
  const after = replay(r, [...acts, id]).status();
  if (r.art !== "poly") return stepQuestion(r, id, asked, before, after);
  const kind = method(r.method ?? "dbpo").kind;
  if (asked > 0 && !id.startsWith("add:")) return null;

  // ── Start ──
  if (id === "heat") {
    const ab = r.method === "aibn";
    return q(
      ab ? tr("Erwärmen: Die zwei C–N-Bindungen brechen. Wohin gehen ihre Elektronen?", "Heating: the two C–N bonds break. Where do their electrons go?")
        : tr("Erwärmen: Die O–O-Bindung bricht. Wohin gehen ihre zwei Elektronen?", "Heating: the O–O bond breaks. Where do its two electrons go?"),
      [
        [ab ? tr("je eins zu C und N", "one each to C and N") : tr("je eins zu jedem O", "one to each O")],
        [ab ? tr("beide zum N", "both to the N") : tr("beide zu einem O", "both to one O"),
          ab ? tr("Dann entstünden Ionen. Die Bindung bricht gleichmäßig: Das C behält ein Elektron – ein Radikal.", "That would give ions. The bond breaks evenly: the C keeps one electron – a radical.")
            : tr("Dann entstünden Ionen. Die Bindung bricht gleichmäßig: Jedes O behält ein Elektron – zwei Radikale.", "That would give ions. The bond breaks evenly: each O keeps one electron – two radicals.")],
        [tr("sie verschwinden", "they disappear"), tr("Elektronen verschwinden nie. Jedes Atom der Bindung behält eins – es entstehen Radikale.", "Electrons never disappear. Each atom of the bond keeps one – radicals form.")],
      ], 0,
      ab ? tr("Jedes C behält ein Elektron: zwei Radikale. Die N-Atome bilden N₂, das entweicht.", "Each C keeps one electron: two radicals. The N atoms form N₂, which escapes.")
        : tr("Jedes O behält ein Elektron: zwei Radikale. Danach geht CO₂ ab.", "Each O keeps one electron: two radicals. Then CO₂ splits off."),
    );
  }
  if (id === "acid") {
    return q(tr("BF₃ trifft auf Wasser H₂O. Was entsteht?", "BF₃ meets water H₂O. What forms?"),
      [
        [tr("eine Säure: H⁺ wird frei", "an acid: H⁺ is set free")],
        [tr("zwei Radikale", "two radicals"), tr("Hier bricht keine Bindung gleichmäßig. Das O bindet mit einem Elektronenpaar an das B, dann löst sich H⁺.", "No bond breaks evenly here. The O binds to the B with an electron pair, then H⁺ comes off.")],
        [tr("keine Reaktion", "no reaction"), tr("Das B in BF₃ hat nur sechs Außenelektronen. Es nimmt ein Elektronenpaar des O auf – dann löst sich H⁺.", "The B in BF₃ has only six outer electrons. It takes an electron pair from the O – then H⁺ comes off.")],
      ], 0,
      tr("Das O gibt ein Elektronenpaar an das B. Dann löst sich ein H⁺ – es startet die Kette.", "The O gives an electron pair to the B. Then an H⁺ comes off – it starts the chain."));
  }
  if (id === "act") {
    return q(tr("Al(C₂H₅)₃ trifft auf das Titan. Was passiert?", "Al(C₂H₅)₃ meets the titanium. What happens?"),
      [
        [tr("C₂H₅ tauscht mit Cl", "C₂H₅ swaps with Cl")],
        [tr("Al bindet an Ti", "Al binds to Ti"), tr("Das Al bleibt nicht am Titan. Es gibt eine Ethylgruppe C₂H₅ ab und nimmt dafür das Cl.", "The Al does not stay at the titanium. It hands over an ethyl group C₂H₅ and takes the Cl instead.")],
        [tr("Ti löst sich ab", "Ti comes off"), tr("Das Titan bleibt im TiCl₃-Kristall. Nur das Cl tauscht mit einer Ethylgruppe C₂H₅.", "The titanium stays in the TiCl₃ crystal. Only the Cl swaps with an ethyl group C₂H₅.")],
      ], 0,
      tr("Eine Ethylgruppe C₂H₅ ersetzt das Cl am Titan. An ihr wächst gleich die Kette.", "An ethyl group C₂H₅ replaces the Cl at the titanium. The chain will grow on it."));
  }

  // ── Abbruch ──
  if (id === "comb") {
    return q(tr("Zwei Radikal-Enden treffen sich. Was passiert?", "Two radical ends meet. What happens?"),
      [
        [tr("sie verbinden sich", "they join")],
        [tr("ein Radikal bleibt", "one radical remains"), tr("Beide Elektronen werden zum bindenden Paar. Danach gibt es kein Radikal mehr.", "Both electrons become the bonding pair. After that there is no radical left.")],
        [tr("sie stoßen sich ab", "they repel"), tr("Zwei Radikale reagieren sofort: Ihre zwei Elektronen bilden eine Bindung.", "Two radicals react at once: their two electrons form a bond.")],
      ], 0,
      tr("Die zwei ungepaarten Elektronen bilden eine Bindung. Aus zwei Ketten wird eine – sie wächst nicht weiter.", "The two unpaired electrons form a bond. Two chains become one – it grows no further."));
  }
  if (id === "disp") {
    return q(tr("Ein H-Atom wandert zur anderen Kette. Was hat die Kette, die es abgibt, danach am Ende?", "An H atom moves to the other chain. What does the giving chain have at its end afterwards?"),
      [
        [tr("eine C=C", "a C=C")],
        [tr("ein Radikal", "a radical"), tr("Das H nimmt nur ein Elektron mit. Das übrige bildet mit dem Radikal-Elektron eine Zweifachbindung C=C.", "The H takes only one electron. The other one forms a double bond C=C with the radical electron.")],
        [tr("eine Ladung", "a charge"), tr("Es wandert ein H-Atom mit einem Elektron, kein Ion. Zurück bleibt eine Zweifachbindung C=C.", "An H atom moves with one electron, not an ion. A double bond C=C is left behind.")],
      ], 0,
      tr("Eine Kette bekommt das H und ist gesättigt. Die andere hat am Ende eine C=C – beide wachsen nicht weiter.", "One chain gets the H and is saturated. The other has a C=C at its end – neither grows on."));
  }
  if (id === "meoh") {
    return q(tr("Methanol CH₃OH trifft das negative Kettenende. Was passiert?", "Methanol CH₃OH meets the negative chain end. What happens?"),
      [
        [tr("Ende nimmt H⁺ auf", "end takes up H⁺")],
        [tr("Methanol wird eingebaut", "methanol is built in"), tr("Methanol hat keine C=C. Es gibt nur ein H⁺ an das negative Ende ab.", "Methanol has no C=C. It only gives an H⁺ to the negative end.")],
        [tr("Kette wächst weiter", "chain keeps growing"), tr("Das negative Ende bindet das H⁺. Ohne Ladung kann die Kette nicht weiterwachsen.", "The negative end binds the H⁺. Without a charge the chain cannot grow on.")],
      ], 0,
      tr("Das Elektronenpaar am Kettenende bindet das H⁺ des Methanols. Die Ladung ist weg – die Kette endet.", "The electron pair at the chain end binds the H⁺ of the methanol. The charge is gone – the chain ends."));
  }
  if (id === "hplus") {
    return q(tr("Das positive Kettenende spaltet H⁺ ab. Was entsteht am Ende?", "The positive chain end splits off H⁺. What forms at the end?"),
      [
        [tr("eine C=C", "a C=C")],
        [tr("ein Radikal", "a radical"), tr("Das H geht ohne Elektron als H⁺. Das Elektronenpaar bleibt und bildet die C=C.", "The H leaves as H⁺ without an electron. The electron pair stays and forms the C=C.")],
        [tr("eine negative Ladung", "a negative charge"), tr("Das Elektronenpaar füllt die Lücke am positiven C. Es entsteht eine C=C, keine Ladung.", "The electron pair fills the gap at the positive C. A C=C forms, no charge.")],
      ], 0,
      tr("Das Elektronenpaar der C–H-Bindung wird zur zweiten Bindung: C=C. Das H⁺ kann eine neue Kette starten.", "The electron pair of the C–H bond becomes the second bond: C=C. The H⁺ can start a new chain."));
  }
  if (id === "h2") {
    return q(tr("H₂ kommt an das Titan. Was passiert?", "H₂ reaches the titanium. What happens?"),
      [
        [tr("Kette löst sich ab", "chain comes off")],
        [tr("H₂ wird eingebaut", "H₂ is built in"), tr("H₂ hat keine C=C. Ein H geht an das Titan, eins an die Kette – sie löst sich.", "H₂ has no C=C. One H goes to the titanium, one to the chain – it comes off.")],
        [tr("Titan ist verbraucht", "titanium is used up"), tr("Ein Katalysator wird nicht verbraucht. Nach dem Ablösen startet das Titan die nächste Kette.", "A catalyst is not used up. After the release the titanium starts the next chain.")],
      ], 0,
      tr("Ein H bindet an das Titan, das andere an die Kette. Die fertige Kette löst sich, das Titan arbeitet weiter.", "One H binds to the titanium, the other to the chain. The finished chain comes off, the titanium keeps working."));
  }

  // ── Anlagern ──
  if (!id.startsWith("add:")) return null;
  const m = id.slice(4), name = monoName(m), res = outcome(before, after, false);
  const zn = kind === "koord";
  const growOk = zn ? tr(`${name} lagert sich an der freien Stelle am Titan an und wird eingebaut.`, `${name} attaches at the free site on the titanium and is inserted.`)
    : kind === "radikal" ? tr(`Das Radikal lagert sich an die C=C von ${name} an. Die Kette wächst um einen Baustein.`, `The radical adds to the C=C of ${name.toLowerCase()}. The chain grows by one unit.`)
    : kind === "anion" ? tr(`Das negative Ende greift die C=C von ${name} an. Die Kette wächst um einen Baustein.`, `The negative end attacks the C=C of ${name.toLowerCase()}. The chain grows by one unit.`)
    : tr(`Die C=C von ${name} greift das positive Ende an. Die Kette wächst um einen Baustein.`, `The C=C of ${name.toLowerCase()} attacks the positive end. The chain grows by one unit.`);
  if (asked === 0 || res !== "grow") {
    const right = res === "grow" ? 0 : res === "none" ? 1 : 2;
    const okText = res === "grow" ? growOk : after.fail ?? growOk;
    return q(tr(`${name} kommt dazu. Was passiert?`, `${name} is added. What happens?`),
      [
        [tr("wird eingebaut", "is built in")],
        [tr("keine Reaktion", "no reaction")],
        [zn ? tr("Titan wird vergiftet", "titanium is poisoned") : tr("Kette endet", "chain ends")],
      ], right, okText, true);
  }
  // zweites Mal: Vorgang beim Einbau
  if (zn) {
    return q(tr(`Wo wird ${name} eingebaut?`, `Where is ${name.toLowerCase()} inserted?`),
      [
        [tr("zwischen Titan und Kette", "between titanium and chain")],
        [tr("am freien Kettenende", "at the free chain end"), tr("Am freien Ende sitzt kein aktives Teilchen. Das Monomer lagert sich am Titan an und schiebt sich zwischen Titan und Kette.", "There is no active particle at the free end. The monomer attaches at the titanium and slides in between titanium and chain.")],
        [tr("am Aluminium", "at the aluminium"), tr("Das Al hat nur die Ethylgruppe übertragen. Eingebaut wird am Titan.", "The Al only handed over the ethyl group. Insertion happens at the titanium.")],
      ], 0,
      tr("Die Kette wächst am Titan, nicht am freien Ende: Jedes Monomer schiebt sich zwischen Titan und Kette.", "The chain grows at the titanium, not at the free end: each monomer slides in between titanium and chain."));
  }
  const what = kind === "radikal" ? tr("das ungepaarte Elektron", "the unpaired electron") : kind === "anion" ? tr("die negative Ladung", "the negative charge") : tr("die positive Ladung", "the positive charge");
  const okWhere = kind === "radikal"
    ? tr("Das Radikal-Elektron und ein Elektron der C=C bilden die neue Bindung. Das zweite sitzt am neuen Kettenende.", "The radical electron and one electron of the C=C form the new bond. The second one sits at the new chain end.")
    : kind === "anion"
      ? tr("Das Elektronenpaar am Ende bildet die neue Bindung. Das Paar der C=C rückt an das neue Ende – dort ist die Ladung.", "The electron pair at the end forms the new bond. The pair of the C=C moves to the new end – the charge is there.")
      : tr("Die Elektronen der C=C binden an das alte positive Ende. Dem anderen C fehlt jetzt ein Paar – es ist positiv.", "The electrons of the C=C bind to the old positive end. The other C now lacks a pair – it is positive.");
  return q(tr(`Nach dem Einbau von ${name}: Wo sitzt dann ${what}?`, `After ${name.toLowerCase()} is built in: where is ${what} then?`),
    [
      [tr("am neuen Kettenende", "at the new chain end")],
      [tr("am Kettenanfang", "at the chain start"), kind === "radikal"
        ? tr("Am Anfang sitzt das Bruchstück des Starters. Sein Elektron steckt schon in der ersten Bindung.", "The start holds the initiator fragment. Its electron is already in the first bond.")
        : kind === "anion"
          ? tr("Am Anfang sitzt die Butylgruppe. Die Ladung wandert immer mit dem wachsenden Ende.", "The start holds the butyl group. The charge always moves with the growing end.")
          : tr("Am Anfang sitzt das H aus der Säure. Die Ladung wandert immer mit dem wachsenden Ende.", "The start holds the H from the acid. The charge always moves with the growing end.")],
      [tr("nirgends mehr", "nowhere any more"), kind === "radikal"
        ? tr("Von den zwei Elektronen der C=C bleibt eins übrig. Die Kette bleibt ein Radikal und wächst weiter.", "Of the two electrons of the C=C one is left over. The chain stays a radical and grows on.")
        : tr("Die Ladung bleibt erhalten. Sie wandert an das neue Kettenende, die Kette wächst weiter.", "The charge is kept. It moves to the new chain end, the chain grows on.")],
    ], 0, okWhere);
}

/** Polykondensation und Polyaddition */
function stepQuestion(r: Recipe, id: string, asked: number, before: Status, after: Status): Prediction | null {
  const res = outcome(before, after, true);
  const byp = after.byp && after.byp !== before.byp ? (after.byp.includes("HCl") ? "HCl" : "H₂O") : null;
  const bypOk = byp === "H₂O"
    ? ([r.a, r.b].includes("methanal")
      ? tr("Das O des Methanals und zwei H der Phenolringe bilden Wasser H₂O.", "The O of the methanal and two H of the phenol rings form water H₂O.")
      : tr("Das OH der Säuregruppe und ein H der anderen Gruppe bilden Wasser H₂O.", "The OH of the acid group and one H of the other group form water H₂O."))
    : byp === "HCl"
      ? tr("Das Cl der Säurechlorid-Gruppe und ein H der anderen Gruppe bilden Chlorwasserstoff HCl.", "The Cl of the acid chloride group and one H of the other group form hydrogen chloride HCl.")
      : res === "none"
        ? after.fail ?? tr("Diese Gruppen reagieren nicht miteinander.", "These groups do not react with each other.")
        : tr("Hier wandert nur ein H-Atom zur anderen Gruppe. Es wird nichts abgespalten.", "Here only one H atom moves to the other group. Nothing splits off.");
  const bypQ = () => q(tr("Verknüpfen: Was passiert?", "Linking: what happens?"),
    [
      [tr("Verknüpfung + H₂O", "link + H₂O")],
      [tr("Verknüpfung + HCl", "link + HCl")],
      [tr("Verknüpfung, sonst nichts", "link, nothing else")],
      [tr("keine Reaktion", "no reaction")],
    ], res === "none" ? 3 : byp === "H₂O" ? 0 : byp === "HCl" ? 1 : 2, bypOk);
  if (id === "join") return asked ? null : bypQ();
  if (!id.startsWith("add:") && id !== "dimer") return null;
  if (asked === 0 || res === "none") {
    const nm = id === "dimer" ? tr("Eine Zweierkette", "A chain of two") : id === "add:pf" ? tr("Methanal + Phenol", "Methanal + phenol") : monoName(id.slice(4));
    const okText = res === "none" ? after.fail ?? bypOk
      : res === "ends" ? after.note ?? tr("Das neue Molekül hat nur eine reaktive Gruppe – danach ist das Kettenende blockiert.", "The new molecule has only one reactive group – then the chain end is blocked.")
      : id === "dimer" ? tr("Beim Stufenwachstum reagiert jede passende Gruppe – auch die Enden von Ketten.", "In step growth every matching group reacts – chain ends too.")
      : tr("Seine Gruppe passt zur Gruppe am Kettenende. Die Kette wird um einen Baustein länger.", "Its group matches the group at the chain end. The chain gets one unit longer.");
    return q(tr(`${nm} kommt an das Kettenende. Was passiert?`, `${nm} reaches the chain end. What happens?`),
      [
        [tr("wird verknüpft", "is linked")],
        [tr("verknüpft, Ende blockiert", "linked, end blocked")],
        [tr("keine Reaktion", "no reaction")],
      ], res === "grow" ? 0 : res === "ends" ? 1 : 2, okText, true);
  }
  return bypQ();
}
