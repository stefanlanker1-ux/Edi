// Vorhersage in der Atom-Ansicht: Bevor ein Schritt abläuft, wählt man, was passieren wird (erst vermuten, dann ansehen).
// Die richtige Antwort ergibt sich aus dem Ablauf selbst (Ansatz nachspielen, Zustand vorher und nachher vergleichen),
// jede falsche Antwort hat eine Rückmeldung, die den richtigen Vorgang nennt. Je Aktion höchstens zwei Fragen:
// beim ersten Mal das Ergebnis (wird eingebaut / keine Reaktion / Kette endet), beim zweiten Mal der Vorgang
// (wo sitzt danach das Radikal bzw. die Ladung, wo wird eingebaut, was wird abgespalten). Danach läuft die Aktion direkt.

import { tr } from "@lern/i18n";
import { method, monoName, stepMono, vinyl, type FG, type StepId, type VinylId } from "../data.ts";
import { reactGroups } from "../rules.ts";
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
      ab ? tr("Jedes C behält ein Elektron: zwei Radikale. Die N‑Atome bilden N₂, das entweicht.", "Each C keeps one electron: two radicals. The N atoms form N₂, which escapes.")
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
    return q(tr("Al(C₂H₅)₃ hat drei Ethylgruppen. Was bekommt das Titan?", "Al(C₂H₅)₃ has three ethyl groups. What does the titanium get?"),
      [
        [tr("eine Ethylgruppe C₂H₅", "an ethyl group C₂H₅")],
        [tr("ein Al‑Atom", "an Al atom"), tr("Das Al bleibt nicht am Titan. Es gibt nur eine Ethylgruppe ab.", "The Al does not stay at the titanium. It only hands over an ethyl group.")],
        [tr("ein Elektron", "an electron"), tr("Übertragen wird eine ganze Ethylgruppe, nicht ein einzelnes Elektron.", "A whole ethyl group is transferred, not a single electron.")],
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
    return q(tr("Ein H‑Atom wandert zur anderen Kette. Was hat die Kette, die es abgibt, danach am Ende?", "An H atom moves to the other chain. What does the giving chain have at its end afterwards?"),
      [
        [tr("eine C=C", "a C=C")],
        [tr("ein Radikal", "a radical"), tr("Das H nimmt nur ein Elektron mit. Das übrige bildet mit dem Radikal-Elektron eine Zweifachbindung C=C.", "The H takes only one electron. The other one forms a double bond C=C with the radical electron.")],
        [tr("eine Ladung", "a charge"), tr("Es wandert ein H‑Atom mit einem Elektron, kein Ion. Zurück bleibt eine Zweifachbindung C=C.", "An H atom moves with one electron, not an ion. A double bond C=C is left behind.")],
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
  const growOk = zn ? tr(`${name} lagert sich an der freien Stelle am Titan an und wird eingebaut.`, `${name} attaches at the vacant site on the titanium and is inserted.`)
    : kind === "radikal" ? tr(`Das Radikal lagert sich an die C=C von ${name} an. Die Kette wächst um einen Baustein.`, `The radical adds to the C=C of ${name.toLowerCase()}. The chain grows by one repeat unit.`)
    : kind === "anion" ? tr(`Das negative Ende greift die C=C von ${name} an. Die Kette wächst um einen Baustein.`, `The negative end attacks the C=C of ${name.toLowerCase()}. The chain grows by one repeat unit.`)
    : tr(`Die C=C von ${name} greift das positive Ende an. Die Kette wächst um einen Baustein.`, `The C=C of ${name.toLowerCase()} attacks the positive end. The chain grows by one repeat unit.`);
  // lebende Ketten aus dem anderen Monomer + neues Monomer: Block
  const living = kind === "anion" && before.n > 0 && !before.beads.some(b => b.mono === m);
  if (asked === 0 && living && res === "grow") {
    const first = monoName(before.beads.find(b => b.mono)?.mono ?? m);
    return q(tr(`Die ${first}-Ketten leben noch. Jetzt kommt ${name} dazu. Was entsteht?`, `The ${first.toLowerCase()} chains are still alive. Now ${name.toLowerCase()} is added. What forms?`),
      [
        [tr("wächst an jede Kette: Block", "grows on each chain: block")],
        [tr(`neue ${name}-Ketten`, `new ${name.toLowerCase()} chains`), tr(`Neue Ketten bräuchten neuen Starter. Die lebenden Enden nehmen das ${name} auf.`, `New chains would need new initiator. The living ends take up the ${name.toLowerCase()}.`)],
        [tr("gemischte Reihenfolge", "mixed order"), tr(`Gemischt wird es nur, wenn beide Monomere gleichzeitig da sind. Hier kommt ${name} nach dem ${first}.`, `It only gets mixed if both monomers are there at once. Here ${name.toLowerCase()} comes after the ${first.toLowerCase()}.`)],
      ], 0, tr(`Erst ein Block ${first}, dann ein Block ${name}: ein Blockcopolymer.`, `First a block of ${first.toLowerCase()}, then a block of ${name.toLowerCase()}: a block copolymer.`));
  }
  if (asked === 0 || res !== "grow") {
    const right = res === "grow" ? 0 : res === "none" ? 1 : 2;
    const okText = res === "grow" ? growOk : after.fail ?? growOk;
    // eigene Rückmeldung je falscher Wahl: Wächst die Kette, sagt sie warum; sonst nennt sie den Grund des Fehlschlags
    const endsWhy = kind === "radikal" ? tr("Das Ende bleibt ein Radikal: Ein Elektron der C=C bleibt übrig.", "The end stays a radical: one electron of the C=C is left over.")
      : zn ? tr(`${name} hat kein Atom mit freiem Elektronenpaar, das das Titan besetzt. Es wird eingebaut.`, `${name} has no atom with a lone pair that blocks the titanium. It is inserted.`)
      : tr("Das Ende bleibt geladen: Die Ladung wandert mit an das neue Ende.", "The end stays charged: the charge moves on to the new end.");
    const noneWhy = kind === "radikal" ? tr(`Das Radikal lagert sich an die C=C von ${name} an.`, `The radical adds to the C=C of ${name.toLowerCase()}.`)
      : zn ? tr(`${name} passt an die freie Stelle am Titan.`, `${name} fits the vacant site at the titanium.`)
      : kind === "anion" ? tr(`Das negative Ende greift die C=C von ${name} an.`, `The negative end attacks the C=C of ${name.toLowerCase()}.`)
      : tr(`Die C=C von ${name} greift das positive Ende an.`, `The C=C of ${name.toLowerCase()} attacks the positive end.`);
    const fail = after.fail ?? okText;
    return q(tr(`${name} kommt dazu. Was passiert?`, `${name} is added. What happens?`),
      [
        [tr("wird eingebaut", "is built in"), fail],
        [tr("keine Reaktion", "no reaction"), res === "grow" ? noneWhy : fail],
        [zn ? tr("Titan wird vergiftet", "titanium is poisoned") : tr("Kette endet", "chain ends"), res === "grow" ? endsWhy : fail],
      ], right, okText, true);
  }
  // zweites Mal: Vorgang beim Einbau
  const v = vinyl(m as VinylId), sideC = v.b.some(g => g !== "H") && v.a.every(g => g === "H") && !v.diene;
  const SIDE = tr<Record<string, string>>(
    { propen: "der CH₃-Gruppe", styrol: "dem Benzolring", vinylchlorid: "dem Cl", acrylnitril: "der C≡N-Gruppe", mma: "den zwei Gruppen", isobuten: "den zwei CH₃", vinylacetat: "der Acetatgruppe" },
    { propen: "the CH₃ group", styrol: "the benzene ring", vinylchlorid: "the Cl", acrylnitril: "the C≡N group", mma: "the two groups", isobuten: "the two CH₃", vinylacetat: "the acetate group" })[m] ?? "";
  // Satzanfang (Nominativ): „Der Benzolring stützt …“
  const SIDE_NOM = tr<Record<string, string>>(
    { propen: "Die CH₃-Gruppe", styrol: "Der Benzolring", vinylchlorid: "Das Cl", acrylnitril: "Die C≡N-Gruppe", mma: "Die zwei Gruppen", isobuten: "Die zwei CH₃-Gruppen", vinylacetat: "Die Acetatgruppe" },
    { propen: "The CH₃ group", styrol: "The benzene ring", vinylchlorid: "The Cl", acrylnitril: "The C≡N group", mma: "The two groups", isobuten: "The two CH₃ groups", vinylacetat: "The acetate group" })[m] ?? "";
  if (zn && m === "propen") {
    return q(tr("Warum zeigen alle CH₃-Gruppen zur selben Seite?", "Why do all CH₃ groups point to the same side?"),
      [
        [tr("Propen passt nur in einer Lage", "propene fits only one way round")],
        [tr("Die CH₃-Gruppen ziehen sich an", "the CH₃ groups attract each other"), tr("Die CH₃-Gruppen ziehen sich kaum an. Die Lage bestimmt der enge Platz am Titan.", "The CH₃ groups hardly attract each other. The tight space at the titanium decides the position.")],
        [tr("Zufall", "chance"), tr("Zufällig wäre ataktisch – wie radikalisch. Am Titan passt Propen nur gleich herum.", "Random would be atactic – like radical. At the titanium propene only fits one way round.")],
      ], 0,
      tr("Jedes Propen lagert sich gleich herum an: isotaktisch. Geordnete Ketten packen dicht – festes PP.", "Every propene attaches the same way round: isotactic. Ordered chains pack tightly – stiff PP."));
  }
  if (zn) {
    return q(tr(`Wo wird ${name} eingebaut?`, `Where is ${name.toLowerCase()} inserted?`),
      [
        [tr("zwischen Titan und Kette", "between titanium and chain")],
        [tr("am freien Kettenende", "at the free chain end"), tr("Am freien Ende sitzt kein aktives Teilchen. Das Monomer lagert sich am Titan an und schiebt sich zwischen Titan und Kette.", "There is no active particle at the free end. The monomer attaches at the titanium and slides in between titanium and chain.")],
        [tr("am Aluminium", "at the aluminium"), tr("Das Al hat nur die Ethylgruppe übertragen. Eingebaut wird am Titan.", "The Al only handed over the ethyl group. Insertion happens at the titanium.")],
      ], 0,
      tr("Die Kette wächst am Titan, nicht am freien Ende: Jedes Monomer schiebt sich zwischen Titan und Kette.", "The chain grows at the titanium, not at the free end: each monomer slides in between titanium and chain."));
  }
  if (sideC && SIDE && (kind === "radikal" || kind === "kation")) {
    const who = kind === "radikal" ? tr("das Radikal", "the radical") : tr("das positive Kettenende", "the positive chain end");
    return q(tr(`An welches C‑Atom von ${name} bindet ${who}?`, `Which C atom of ${name.toLowerCase()} does ${who} bind to?`),
      [
        [tr("an das CH₂-Ende", "to the CH₂ end")],
        [tr(`an das C mit ${SIDE}`, `to the C with ${SIDE}`), kind === "radikal"
          ? tr("Das Radikal greift das CH₂-Ende an. Dort ist Platz, und das neue Radikal wird beständiger.", "The radical attacks the CH₂ end. There is room there, and the new radical is more stable.")
          : tr(`Dann säße die positive Ladung am CH₂ – ohne Stütze, sehr unbeständig. ${SIDE_NOM} ${m === "mma" || m === "isobuten" ? "stützen" : "stützt"} sie am anderen C.`, `Then the positive charge would sit on the CH₂ – unsupported, very unstable. ${SIDE_NOM} ${m === "mma" || m === "isobuten" ? "support" : "supports"} it on the other C.`)],
        [kind === "radikal" ? tr("an beide gleichzeitig", "to both at once") : tr("an eine Seitengruppe", "to a side group"), kind === "radikal"
          ? tr("Das Radikal hat nur ein Elektron. Es bildet genau eine neue Bindung.", "The radical has only one electron. It forms exactly one new bond.")
          : tr("Das Kettenende braucht ein Elektronenpaar. Das gibt die C=C, nicht die Seitengruppe.", "The chain end needs an electron pair. The C=C provides it, not the side group.")],
      ], 0,
      kind === "radikal"
        ? tr("Das Radikal bindet an das CH₂. Das neue Radikal sitzt am C mit der Seitengruppe – dort ist es beständiger.", "The radical binds to the CH₂. The new radical sits on the C with the side group – it is more stable there.")
        : tr("Bindung an das CH₂. Die positive Ladung sitzt am C mit der Seitengruppe – die stützt sie.", "Bond to the CH₂. The positive charge sits on the C with the side group – it supports it."));
  }
  const what = kind === "radikal" ? tr("das ungepaarte Elektron", "the unpaired electron") : kind === "anion" ? tr("die negative Ladung", "the negative charge") : tr("die positive Ladung", "the positive charge");
  const okWhere = kind === "radikal"
    ? tr("Das Radikal-Elektron und ein Elektron der C=C bilden die neue Bindung. Das zweite sitzt am neuen Kettenende.", "The radical electron and one electron of the C=C form the new bond. The second one sits at the new chain end.")
    : kind === "anion"
      ? tr("Das Elektronenpaar am Ende bildet die neue Bindung. Das Paar der C=C rückt an das neue Ende – dort ist die Ladung.", "The electron pair at the end forms the new bond. The pair of the C=C moves to the new end – the charge is there.")
      : tr("Die Elektronen der C=C binden an das alte positive Ende. Dem anderen C fehlt jetzt ein Elektronenpaar zum Oktett – es ist positiv.", "The electrons of the C=C bind to the old positive end. The other C now lacks an electron pair for its octet – it is positive.");
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
  // reagierende Gruppen: Kettenende und passende Gruppe des neuen Moleküls
  const end = before.end as FG | undefined;
  const newIds = id === "join" ? [r.b ?? r.a] : id === "dimer" ? [r.a, r.b ?? r.a] : id === "add:pf" ? ["methanal"] : [id.slice(4)];
  const g = end ? newIds.flatMap(x => stepMono(x as StepId).groups).find(x => reactGroups(end, x)) : undefined;
  const link = end && g ? reactGroups(end, g)?.link : undefined;
  const acidCl = end === "COCl" || g === "COCl";
  const addLink = link === "urethan" || link === "harnstoff" || link === "aminoalkohol";
  const pf = [r.a, r.b].includes("methanal");
  const bypOk = byp === "H₂O"
    ? (pf
      ? tr("Das O des Methanals und zwei H der Phenolringe bilden Wasser H₂O.", "The O of the methanal and two H of the phenol rings form water H₂O.")
      : tr("Das OH der Säuregruppe und ein H der anderen Gruppe bilden Wasser H₂O.", "The OH of the acid group and one H of the other group form water H₂O."))
    : byp === "HCl"
      ? tr("Das Cl der Säurechlorid-Gruppe und ein H der anderen Gruppe bilden Chlorwasserstoff HCl.", "The Cl of the acyl chloride group and one H of the other group form hydrogen chloride HCl.")
      : res === "none"
        ? after.fail ?? tr("Diese Gruppen reagieren nicht miteinander.", "These groups do not react with each other.")
        : tr("Hier wandert nur ein H‑Atom zur anderen Gruppe. Es wird nichts abgespalten.", "Here only one H atom moves to the other group. Nothing splits off.");
  // eigene Rückmeldung je falscher Wahl
  // Begründung mit genau den Gruppen dieses Ansatzes
  const acidG = acidCl ? "–COCl" : "–COOH";
  const reacts = link === "ester" ? tr(`Die Gruppen passen zusammen: ${acidG} reagiert mit –OH zur Esterbindung.`, `The groups match: ${acidG} reacts with –OH to form an ester bond.`)
    : link === "amid" ? tr(`Die Gruppen passen zusammen: ${acidG} reagiert mit –NH₂ zur Amidbindung.`, `The groups match: ${acidG} reacts with –NH₂ to form an amide bond.`)
    : link === "urethan" ? tr("Die Gruppen passen zusammen: –⁠N=C=O reagiert mit –OH zur Urethangruppe.", "The groups match: –⁠N=C=O reacts with –OH to form a urethane group.")
    : link === "harnstoff" ? tr("Die Gruppen passen zusammen: –⁠N=C=O reagiert mit –NH₂ zur Harnstoffgruppe.", "The groups match: –⁠N=C=O reacts with –NH₂ to form a urea group.")
    : link === "aminoalkohol" ? tr("Die Gruppen passen zusammen: Die Epoxidgruppe reagiert mit –NH₂.", "The groups match: the epoxide group reacts with –NH₂.")
    : tr("Die Gruppen passen zusammen und reagieren miteinander.", "The groups match and react with each other.");
  const W = {
    h2o: addLink ? (link === "aminoalkohol" ? tr("Hier geht nichts ab: Das H wandert nur zum O.", "Nothing leaves here: the H only moves to the O.") : tr("Hier geht nichts ab: Das H wandert nur zum N.", "Nothing leaves here: the H only moves to the N."))
      : acidCl ? tr("Die Säuregruppe ist hier –COCl: Statt OH geht Cl mit einem H ab – HCl.", "The acid group here is –COCl: instead of OH, Cl leaves with an H – HCl.") : bypOk,
    hcl: addLink ? (link === "aminoalkohol" ? tr("Hier geht nichts ab: Das H wandert nur zum O.", "Nothing leaves here: the H only moves to the O.") : tr("Hier geht nichts ab: Das H wandert nur zum N.", "Nothing leaves here: the H only moves to the N."))
      : tr("HCl geht nur ab, wenn eine –COCl-Gruppe beteiligt ist. Hier ist es –COOH: Es entsteht H₂O.", "HCl only leaves if a –COCl group takes part. Here it is –COOH: H₂O forms."),
    nothing: acidCl ? tr("Bei –COCl geht immer ein kleines Molekül ab: HCl.", "With –COCl a small molecule always leaves: HCl.")
      : pf ? tr("Bei der CH₂-Brücke geht immer Wasser H₂O ab.", "A CH₂ bridge always splits off water H₂O.")
      : tr(`Bei –COOH + ${link === "amid" ? "–NH₂" : "–OH"} geht immer ein kleines Molekül ab: H₂O.`, `With –COOH + ${link === "amid" ? "–NH₂" : "–OH"} a small molecule always leaves: H₂O.`),
  };
  const none = res === "none";
  const bypQ = () => q(tr("Verknüpfen: Was passiert?", "Linking: what happens?"),
    [
      [tr("Verknüpfung + H₂O", "link + H₂O"), none ? bypOk : W.h2o],
      [tr("Verknüpfung + HCl", "link + HCl"), none ? bypOk : W.hcl],
      [tr("Verknüpfung, sonst nichts", "link, nothing else"), none ? bypOk : W.nothing],
      [tr("keine Reaktion", "no reaction"), reacts],
    ], none ? 3 : byp === "H₂O" ? 0 : byp === "HCl" ? 1 : 2, bypOk);
  if (id === "join") return asked ? null : bypQ();
  if (id.startsWith("branch:")) {
    if (asked) return null;
    const an = monoName(id.slice(7));
    // Verknüpfung genau dieses Ansatzes (Ester + H₂O, Ester + HCl, Urethan ohne Nebenprodukt …)
    const g = stepMono(id.slice(7) as StepId).groups.find(x => reactGroups("OH", x));
    const pr = g ? reactGroups("OH", g) : null;
    const LN = tr({ ester: "Esterbindung", amid: "Amidbindung", urethan: "Urethangruppe", harnstoff: "Harnstoffgruppe", aminoalkohol: "Bindung", methylen: "CH₂-Brücke" },
      { ester: "ester bond", amid: "amide bond", urethan: "urethane group", harnstoff: "urea group", aminoalkohol: "bond", methylen: "CH₂ bridge" });
    const brLink = pr ? (pr.byp ? tr(`${LN[pr.link]} und ${pr.byp === "HCl" ? "HCl" : "H₂O"}`, `${LN[pr.link]} and ${pr.byp === "HCl" ? "HCl" : "H₂O"}`) : tr(`${LN[pr.link]}, ohne Nebenprodukt`, `${LN[pr.link]}, without a by-product`)) : "";
    return q(tr(`${an} kommt an die dritte –OH des Glycerins. Was entsteht?`, `${an} reaches the third –OH of the glycerol. What forms?`),
      [
        [tr("ein Ast – Anfang eines Netzes", "a branch – start of a network")],
        [tr("keine Reaktion", "no reaction"), tr(`Die dritte –OH reagiert wie die anderen: ${brLink}.`, `The third –OH reacts like the others: ${brLink}.`)],
        [tr("die Kette wird länger", "the chain gets longer"), tr("Die dritte –OH sitzt in der Mitte – es entsteht ein Ast, keine längere Kette.", "The third –OH sits in the middle – a branch forms, not a longer chain.")],
      ], 0, tr("An der dritten –OH wächst ein Ast. Viele solche Äste verbinden die Ketten zu einem Netz.", "A branch grows at the third –OH. Many such branches link the chains into a network."));
  }
  if (!id.startsWith("add:") && id !== "dimer") return null;
  if (asked === 0 || res === "none") {
    const nm = id === "dimer" ? tr("Eine Zweierkette", "A chain of two") : id === "add:pf" ? tr("Methanal + Phenol", "Methanal + phenol") : monoName(id.slice(4));
    const okText = res === "none" ? after.fail ?? bypOk
      : res === "ends" ? after.note ?? tr("Das neue Molekül hat nur eine reaktive Gruppe – danach ist das Kettenende blockiert.", "The new molecule has only one reactive group – then the chain end is blocked.")
      : id === "dimer" ? tr("Beim Stufenwachstum reagiert jede passende Gruppe – auch die Enden von Ketten.", "In step growth every matching group reacts – chain ends too.")
      : tr("Die Gruppe des neuen Moleküls passt zur Gruppe am Kettenende. Die Kette wird um einen Baustein länger.", "The group of the new molecule matches the group at the chain end. The chain gets one repeat unit longer.");
    const blockedWhy = tr("Das neue Molekül hat zwei reaktive Gruppen: Nach der Verknüpfung ist wieder eine frei.", "The new molecule has two reactive groups: after linking one is free again.");
    return q(tr(`${nm} kommt an das rechte Kettenende (markiert). Was passiert?`, `${nm} reaches the right chain end (marked). What happens?`),
      [
        [tr("wird verknüpft", "is linked"), after.fail ?? okText],
        [tr("verknüpft, Ende blockiert", "linked, end blocked"), none ? after.fail ?? okText : blockedWhy],
        [tr("keine Reaktion", "no reaction"), reacts],
      ], res === "grow" ? 0 : res === "ends" ? 1 : 2, okText, true);
  }
  // zweites Mal: Frage zum Vorgang der Verknüpfung
  if (link === "ester" && !acidCl && byp === "H₂O") {
    return q(tr("Aus welcher Gruppe stammt das O‑Atom im abgespaltenen Wasser?", "Which group does the O atom in the water come from?"),
      [
        [tr("aus der –COOH-Gruppe", "from the –COOH group")],
        [tr("aus der –OH des Alkohols", "from the alcohol's –OH"), tr("Das O des Alkohols bindet an das C der Säure – es bleibt in der Esterbindung.", "The O of the alcohol binds to the C of the acid – it stays in the ester bond.")],
        [tr("aus der Luft", "from the air"), tr("Alle Atome des Wassers stammen aus den Monomeren: OH der Säure, H des Alkohols.", "All atoms of the water come from the monomers: OH of the acid, H of the alcohol.")],
      ], 0,
      tr("Die Säure gibt OH ab, der Alkohol ein H. Das O des Alkohols wird Teil der Esterbindung.", "The acid gives off OH, the alcohol an H. The alcohol's O becomes part of the ester bond."));
  }
  if (newIds[0] === "glycerin") {
    return q(tr("Glycerin hat drei –OH. Was macht die dritte Gruppe?", "Glycerol has three –OH. What does the third group do?"),
      [
        [tr("verbindet zwei Ketten", "links two chains")],
        [tr("bleibt immer frei", "always stays free"), tr("Jede passende Gruppe reagiert. Die dritte –OH knüpft eine zweite Kette an.", "Every matching group reacts. The third –OH links on a second chain.")],
        [tr("Kette bleibt trotzdem gerade", "chain stays straight anyway"), tr("Die dritte Gruppe reagiert auch – diese Verknüpfung führt zur Seite: ein Netz.", "The third group reacts too – this link goes sideways: a network.")],
      ], 0, tr("Drei Gruppen: Die Ketten verzweigen sich und verknüpfen sich zu einem Netz.", "Three groups: the chains branch and link up into a network."));
  }
  if (link === "aminoalkohol") {
    return q(tr("Welche Bindung des Epoxidrings öffnet sich?", "Which bond of the epoxide ring opens?"),
      [
        [tr("eine C–O-Bindung", "a C–O bond")],
        [tr("die C–C-Bindung", "the C–C bond"), tr("Das N greift ein C an. Das Elektronenpaar der C–O-Bindung geht zum O – der Ring öffnet sich dort.", "The N attacks a C. The electron pair of the C–O bond moves to the O – the ring opens there.")],
        [tr("keine – der Ring bleibt", "none – the ring stays"), tr("Der Dreierring ist gespannt. Genau darum öffnet er sich leicht.", "The three-membered ring is strained. That is exactly why it opens easily.")],
      ], 0, tr("C–O öffnet sich, das O wird zu –OH. Das N bindet an das CH₂ des Rings.", "C–O opens, the O becomes –OH. The N binds to the CH₂ of the ring."));
  }
  return bypQ();
}
