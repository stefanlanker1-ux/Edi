// Lektionen der Polymere (Lernen, je Kapitel eine): mit den Animationen der Atom-Ansicht (Mechanismus mit Elektronenpfeilen),
// Strukturformeln, Kettenausschnitten, Kügelchen und Kettenbildern. Je Gedanke vorgemacht → halb gelöst → selbst.
// Keine Zahlen eintippen: Auswahl oder im Bild antippen.

import { useMemo, useState } from "react";
import { IconButton, type GuideCtx, type GuideDef, type GuideStep } from "@lern/ui";
import { tr } from "@lern/i18n";
import { replay } from "./chem/mech/index.ts";
import type { Recipe } from "./chem/mech/types.ts";
import { fitBox, snapBox, still } from "./chem/scene.ts";
import { MechStage } from "./components/MechStage.tsx";
import { MechSvg } from "./components/MechSvg.tsx";
import { BeadStrip } from "./components/Beads.tsx";
import { VisView, beadsOf, type Vis } from "./quiz/visual.tsx";
import { STRENGTH } from "./quiz/tasks.ts";

const T = (de: string, en: string) => tr(de, en);

/** Ablauf der letzten Aktion abspielen (einmal, dann Endbild); „Nochmal“ spielt erneut */
function MechPlay({ r, acts, note }: { r: Recipe; acts: string[]; note?: string }) {
  const data = useMemo(() => {
    const m = replay(r, acts.slice(0, -1));
    const clip = m.run(acts[acts.length - 1]);
    return { clip, snap: m.snap() };
  }, [r, acts]);
  const [run, setRun] = useState({ key: 1, on: true });
  return (
    <div className="pm-lesson-mech">
      <MechStage snap={data.snap} snapKey={0} clip={run.on ? data.clip : null} clipKey={run.key} onEnd={() => setRun(x => ({ ...x, on: false }))}
        halos lp label={T("Ablauf in Atomen", "Process in atoms")} />
      <IconButton icon="reset" label={T("Nochmal abspielen", "Play again")} className="pm-lesson-again" onClick={() => setRun(x => ({ key: x.key + 1, on: true }))} />
      {note && <p className="pm-lesson-note">{note}</p>}
    </div>
  );
}

/** Endbild nach den Aktionen; Antippen eines Atoms → c.pick: das Radikal-Atom heißt „rad“ */
function MechTap({ r, acts, c }: { r: Recipe; acts: string[]; c: GuideCtx }) {
  const { snap, rad } = useMemo(() => {
    const s = replay(r, acts).snap();
    const dot = s.dots[0];
    let best = "", bd = Infinity;
    if (dot) for (const a of s.atoms) { const d = Math.hypot(a.x - dot.x, a.y - dot.y); if (a.el === "C" && d < bd) { bd = d; best = a.id; } }
    return { snap: s, rad: best };
  }, [r, acts]);
  const pose = still({ ...snap, atoms: snap.atoms.map(a => (c.show && a.id === rad ? { ...a, hl: true } : a)) });
  // Ausschnitt im eigenen Seitenverhältnis (Kettenende + letzte Bausteine füllen das Bild, Atome groß genug zum Antippen)
  const b = snapBox(snap) ?? { x0: -3, y0: -2, x1: 3, y1: 2 };
  const box = fitBox(b, (b.x1 - b.x0 + 0.9) / (b.y1 - b.y0 + 0.9), 0, 0, 0.45);
  return <div className="pm-lesson-vis"><MechSvg pose={pose} box={box} label={T("Kette mit Radikal: tippe auf ein Atom", "Chain with radical: tap an atom")} onPick={id => c.pick(id === rad ? "rad" : id)} className="pm-tap-svg" /></div>;
}

const Pic = ({ v }: { v: Vis }) => <div className="pm-lesson-vis"><VisView v={v} /></div>;
/** zwei Bilder: vorher → nachher mit Pfeil; als Vergleich (`vs`) ohne Pfeil, mit Trennlinie und Überschrift über jedem Bild
 *  (ein Pfeil läse sich als „wird zu“) */
const Two = ({ a, b, la, lb, vs }: { a: Vis; b: Vis; la?: string; lb?: string; vs?: boolean }) => (
  <div className={`pm-lesson-two${vs ? " vs" : ""}`}>
    <figure>{vs && la && <figcaption>{la}</figcaption>}<VisView v={a} />{!vs && la && <figcaption>{la}</figcaption>}</figure>
    {vs ? <span className="pm-lesson-div" aria-hidden="true" /> : <span className="pm-lesson-arrow" aria-hidden="true">→</span>}
    <figure>{vs && lb && <figcaption>{lb}</figcaption>}<VisView v={b} />{!vs && lb && <figcaption>{lb}</figcaption>}</figure>
  </div>
);
/** mehrere Bilder zum Vergleichen, Name über jedem Bild (Handy: untereinander) */
const Row = ({ items }: { items: [Vis, string][] }) => (
  <div className="pm-lesson-row">
    {items.map(([v, l]) => <figure key={l}><figcaption>{l}</figcaption><VisView v={v} /></figure>)}
  </div>
);
const Strips = ({ rows }: { rows: [string, string[]][] }) => (
  <div className="pm-lesson-strips">
    {rows.map(([l, seq]) => <figure key={l}><BeadStrip beads={beadsOf(seq)} active={null} max={20} /><figcaption>{l}</figcaption></figure>)}
  </div>
);

/** Kettenwachstum (wenige lange Ketten, viel Monomer) und Stufenwachstum (viele kurze Ketten) als Kügelchen */
function Growth() {
  const S = "styrol", A = "terephthalsaeure", B = "ethandiol";
  return (
    <div className="pm-lesson-growth">
      <figure>
        <BeadStrip beads={beadsOf(Array(9).fill(S))} active={null} />
        <BeadStrip beads={beadsOf(Array(7).fill(S))} active={null} />
        <div className="pm-lesson-free">{Array.from({ length: 8 }, (_, i) => <BeadStrip key={i} beads={beadsOf([S])} active={null} />)}</div>
        <figcaption>{T("Kettenwachstum: sehr lange Ketten und viel Monomer", "Chain growth: very long chains and lots of monomer")}</figcaption>
      </figure>
      <figure>
        <div className="pm-lesson-free">{[[A, B], [A, B, A], [B, A], [A, B, A, B], [B, A, B], [A, B], [A, B, A]].map((s, i) => <BeadStrip key={i} beads={beadsOf(s)} active={null} />)}</div>
        <figcaption>{T("Stufenwachstum: kurze Ketten, kaum Monomer", "Step growth: short chains, hardly any monomer")}</figcaption>
      </figure>
    </div>
  );
}

const PS: Recipe = { art: "poly", a: "styrol", method: "dbpo" };
const ZN_PP: Recipe = { art: "poly", a: "propen", method: "zn" };
const ZN_MMA: Recipe = { art: "poly", a: "mma", method: "zn" };
const BULI: Recipe = { art: "poly", a: "styrol", method: "buli" };
const IB_BF3: Recipe = { art: "poly", a: "isobuten", method: "bf3" };
const PET: Recipe = { art: "kond", a: "terephthalsaeure", b: "ethandiol" };
const PA: Recipe = { art: "kond", a: "adipinsaeure", b: "hexandiamin" };
const PUR: Recipe = { art: "add", a: "hdi", b: "butandiol" };
const EP: Recipe = { art: "add", a: "badge", b: "hexandiamin" };

// ── 1 Monomere und Polymere ──
const K1: GuideStep[] = [
  {
    mode: "worked",
    say: T("Ein **Polymer** ist ein Riesenmolekül aus vielen kleinen Bausteinen, den **Monomeren**.", "A **polymer** is a giant molecule made of many small building blocks, the **monomers**."),
    ask: T("Wie wird aus Ethen eine Kette?", "How does ethene become a chain?"),
    visual: () => <Two a={{ k: "mono", id: "ethen" }} b={{ k: "chain", id: "ethen", n: 3 }} la={T("Ethen", "Ethene")} lb={T("Polyethen", "Polyethene")} />,
    lines: [
      T("Ethen hat eine **C=C-Zweifachbindung**.", "Ethene has a **C=C double bond**."),
      T("Sie öffnet sich: Jedes C‑Atom bindet an ein Nachbarmolekül.", "It opens: each C atom bonds to a neighbouring molecule."),
      T("So entsteht **Polyethen** – eine lange Kette.", "This forms **polyethene** – a long chain."),
    ],
    ok: T("Poly heißt viele: viele Ethen-Bausteine.", "Poly means many: many ethene units."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Welches Polymer entsteht aus Propen?", "Complete: which polymer forms from propene?"),
    answer: T("Polypropen", "Polypropene"), options: [T("Polypropen", "Polypropene"), T("Polyethen", "Polyethene"), T("Propan", "Propane")],
    visual: () => <Pic v={{ k: "mono", id: "propen" }} />,
    lines: [T("Monomer: Propen", "Monomer: propene"), T("Polymer: Poly + Name des Monomers = {?}", "{?} = poly + name of the monomer")],
    why: { [T("Polyethen", "Polyethene")]: T("Polyethen entsteht aus Ethen – ohne CH₃-Gruppe.", "Polyethene forms from ethene – without a CH₃ group."), [T("Propan", "Propane")]: T("Propan ist das gesättigte Gegenstück zu Propen. Ohne C=C entsteht keine Kette.", "Propane is the saturated counterpart of propene. Without C=C no chain forms.") },
    ok: T("Propen → Polypropen (PP).", "Propene → polypropene (PP)."),
  },
  {
    mode: "free",
    ask: T("Jetzt du: Welches Molekül kann **keine** Kette bilden?", "Your turn: which molecule **cannot** form a chain?"),
    answer: T("Ethan", "Ethane"), options: [T("Ethan", "Ethane"), T("Styrol", "Styrene"), T("Vinylchlorid", "Vinyl chloride")],
    // alle drei Moleküle mit Namen und Strukturformel: gefragt ist nur, wo die C=C fehlt (Namen müssen nicht bekannt sein)
    visual: () => <Row items={[[{ k: "mono", id: "styrol" }, T("Styrol", "Styrene")], [{ k: "sat", id: "ethen" }, T("Ethan", "Ethane")], [{ k: "mono", id: "vinylchlorid" }, T("Vinylchlorid", "Vinyl chloride")]]} />,
    why: { [T("Styrol", "Styrene")]: T("Styrol hat eine C=C-Bindung – daraus wird Polystyrol.", "Styrene has a C=C bond – it becomes polystyrene."), [T("Vinylchlorid", "Vinyl chloride")]: T("Vinylchlorid hat eine C=C-Bindung – daraus wird Polyvinylchlorid (PVC).", "Vinyl chloride has a C=C bond – it becomes poly(vinyl chloride) (PVC).") },
    lines: [T("Ethan hat nur Einfachbindungen: Es ist **gesättigt**.", "Ethane has only single bonds: it is **saturated**."),
      T("Gesättigte Gegenstücke: Ethen – Ethan, Propen – Propan, Vinylchlorid – Chlorethan.", "Saturated counterparts: ethene – ethane, propene – propane, vinyl chloride – chloroethane.")],
    ok: T("Ohne Zweifachbindung keine Polymerisation.", "No double bond, no polymerisation."),
  },
  {
    mode: "worked",
    say: T("In der Kette heißt jede Wiederholung **Baustein**.", "In the chain each repeat is called a **repeat unit**."),
    ask: T("Wie schreibt man Polyethen kurz?", "How is polyethene written in short?"),
    visual: () => <Pic v={{ k: "unit", id: "ethen" }} />,
    lines: [
      T("Ein Baustein steht in **eckigen Klammern**.", "One repeat unit stands in **square brackets**."),
      T("Aus C=C ist C–C geworden; zwei Bindungen zeigen nach außen.", "C=C has become C–C; two bonds point outwards."),
      T("Die C‑Atome der langen Kette bilden die **Hauptkette**.", "The C atoms of the long chain form the **main chain**."),
      T("Das **n** sagt: Der Baustein wiederholt sich sehr oft.", "The **n** says: the repeat unit occurs very often."),
    ],
    ok: T("[–CH₂–CH₂–]ₙ steht für tausende Bausteine.", "[–CH₂–CH₂–]ₙ stands for thousands of repeat units."),
  },
  {
    mode: "faded",
    ask: T("Ergänze den Baustein von Polyvinylchlorid.", "Complete the repeat unit of poly(vinyl chloride)."),
    answer: "–CH₂–CHCl–", options: ["–CH₂–CHCl–", "CH₂=CHCl", "–CH₂–CH₂–"],
    visual: () => <Pic v={{ k: "mono", id: "vinylchlorid" }} />,
    lines: [T("Monomer: CH₂=CHCl", "Monomer: CH₂=CHCl"), T("Zweifachbindung → Einfachbindung, das Cl bleibt als **Seitengruppe**", "Double bond → single bond, the Cl stays as the **side group**"), T("Baustein: [{?}]ₙ", "Unit: [{?}]ₙ")],
    why: { "CH₂=CHCl": T("Das ist das Monomer – im Baustein ist C=C geöffnet.", "That is the monomer – in the repeat unit C=C is opened."), "–CH₂–CH₂–": T("Das Cl‑Atom bleibt im Baustein.", "The Cl atom stays in the repeat unit.") },
    ok: T("PVC: [–CH₂–CHCl–]ₙ.", "PVC: [–CH₂–CHCl–]ₙ."),
  },
  {
    mode: "free",
    ask: T("Jetzt du: Welcher Baustein gehört zu Polystyrol?", "Your turn: which repeat unit belongs to polystyrene?"),
    answer: "–CH₂–CH(C₆H₅)–", options: ["–CH₂–CH(C₆H₅)–", "CH₂=CH–C₆H₅", "–CH₂–CH(CH₃)–"],
    visual: () => <Pic v={{ k: "mono", id: "styrol" }} />,
    why: { "CH₂=CH–C₆H₅": T("Das ist das Monomer: C=C ist noch da.", "That is the monomer: C=C is still there."), "–CH₂–CH(CH₃)–": T("Die CH₃-Gruppe gehört zu Polypropen.", "The CH₃ group belongs to polypropene.") },
    lines: [T("C=C öffnet sich, der **Benzolring** C₆H₅ bleibt.", "C=C opens, the **benzene ring** C₆H₅ stays.")],
    ok: T("Polystyrol: [–CH₂–CH(C₆H₅)–]ₙ.", "Polystyrene: [–CH₂–CH(C₆H₅)–]ₙ."),
  },
  {
    mode: "worked",
    say: T("Im **Kügelchenmodell** ist jeder Baustein eine Kugel.", "In the **bead model** each repeat unit is one bead."),
    ask: T("Wie sieht eine Kette als Kügelchen aus?", "What does a chain look like as beads?"),
    visual: () => <Strips rows={[[T("Polystyrol", "Polystyrene"), Array(8).fill("styrol")], [T("Styrol und Butadien", "Styrene and butadiene"), ["styrol", "butadien", "styrol", "styrol", "butadien", "butadien", "styrol", "butadien"]]]} />,
    lines: [
      T("Eine Farbe je Monomer: Styrol violett, Butadien orange.", "One colour per monomer: styrene violet, butadiene orange."),
      T("Ein Strich ist eine Bindung zwischen zwei Bausteinen.", "A line is a bond between two repeat units."),
      T("So erkennt man auch Ketten aus zwei Monomeren.", "This also shows chains made of two monomers."),
    ],
    ok: T("Kügelchen zeigen den Aufbau auf einen Blick.", "Beads show the structure at a glance."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Wie viele Bausteine hat diese Kette?", "Complete: how many repeat units does this chain have?"),
    answer: "7", options: ["6", "7", "14"],
    visual: () => <Strips rows={[["", Array(7).fill("propen")]]} />,
    lines: [T("Jedes Kügelchen ist ein Baustein", "Each bead is one repeat unit"), T("Kügelchen zählen: {?}", "Count the beads: {?}")],
    why: { "6": T("6 sind die Striche zwischen den Kügelchen.", "6 is the number of lines between the beads."), "14": T("Gezählt werden Bausteine, nicht C‑Atome.", "Count repeat units, not C atoms.") },
    ok: T("7 Kügelchen = 7 eingebaute Monomere.", "7 beads = 7 monomers built in."),
  },
  {
    mode: "worked",
    say: T("**Kunststoffe** sind Polymere. Jeder hat seine Stärke.", "**Plastics** are polymers. Each has its strength."),
    ask: T("Wofür nimmt man PE, PP, PS und PVC?", "What are PE, PP, PS and PVC used for?"),
    lines: [STRENGTH().ethen, STRENGTH().propen, STRENGTH().styrol, STRENGTH().vinylchlorid],
    ok: T("Die Eigenschaft entscheidet, wofür man einen Kunststoff nimmt.", "The property decides what a plastic is used for."),
  },
];

// ── 2 Radikalische Polymerisation ──
const K2: GuideStep[] = [
  {
    mode: "worked",
    say: T("Ein **Radikal** hat ein **ungepaartes Elektron** (Punkt). Es ist sehr reaktiv.", "A **radical** has an **unpaired electron** (dot). It is very reactive."),
    ask: T("Wie entsteht das erste Radikal?", "How does the first radical form?"),
    visual: () => <MechPlay r={PS} acts={["heat"]} />,
    lines: [
      T("Der **Starter** Dibenzoylperoxid (**DBPO**) hat eine schwache O–O-Bindung.", "The **initiator** dibenzoyl peroxide (**DBPO**) has a weak O–O bond."),
      T("Beim Erwärmen bricht sie: Jedes O‑Atom behält ein Elektron.", "On heating it breaks: each O atom keeps one electron."),
      T("Dann geht CO₂ ab. Übrig bleibt das Radikal C₆H₅•.", "Then CO₂ leaves. The radical C₆H₅• is left."),
    ],
    ok: T("**Start**: Der Starter zerfällt in Radikale.", "**Initiation**: the initiator splits into radicals."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Wie viele Elektronen bewegt ein Pfeil mit halber Spitze?", "Complete: how many electrons does a half-headed (fishhook) arrow move?"),
    answer: "1", options: ["1", "2"],
    visual: () => <MechPlay r={PS} acts={["heat"]} />,
    lines: [T("Die O–O-Bindung hat 2 Elektronen – es gibt 2 halbe Pfeile", "The O–O bond has 2 electrons – there are 2 half-headed arrows"), T("Ein halber Pfeil bewegt {?} Elektron", "One half-headed arrow moves {?} electron")],
    why: { "2": T("Ein Elektronenpaar zeigt der volle Pfeil.", "An electron pair is shown by a full arrow.") },
    ok: T("Halber Pfeil: ein Elektron. Voller Pfeil: ein **Elektronenpaar**.", "Half-headed arrow: one electron. Full arrow: an **electron pair**."),
  },
  {
    mode: "worked",
    say: T("**Kettenwachstum**: Das Radikal greift die C=C-Bindung eines Monomers an.", "**Propagation**: the radical attacks the C=C bond of a monomer."),
    ask: T("Was passiert mit den Elektronen?", "What happens to the electrons?"),
    visual: () => <MechPlay r={PS} acts={["heat", "add:styrol"]} />,
    lines: [
      T("Ein Elektron der Zweifachbindung bildet mit dem Radikal eine neue Bindung.", "One electron of the double bond forms a new bond with the radical."),
      T("Das andere Elektron bleibt am zweiten C‑Atom: ein neues Radikal.", "The other electron stays on the second C atom: a new radical."),
      T("So wächst die Kette am Ende weiter – Baustein für Baustein.", "So the chain keeps growing at its end – unit by unit."),
    ],
    ok: T("Das Radikal wandert immer an das neue Kettenende.", "The radical always moves to the new chain end."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Wo sitzt nach dem Anlagern das Radikal?", "Complete: where is the radical after adding?"),
    answer: T("am neuen Kettenende", "at the new chain end"), options: [T("am neuen Kettenende", "at the new chain end"), T("am Starter", "on the initiator"), T("nirgends", "nowhere")],
    visual: () => <MechPlay r={PS} acts={["heat", "add:styrol", "add:styrol"]} />,
    lines: [T("Ein Elektron der Zweifachbindung bleibt übrig", "One electron of the double bond is left over"), T("Das Radikal sitzt jetzt {?}", "The radical now sits {?}")],
    why: { [T("am Starter", "on the initiator")]: T("Das Starter-Elektron steckt jetzt in der neuen Bindung.", "The initiator electron is now in the new bond."), [T("nirgends", "nowhere")]: T("Es bleibt ein ungepaartes Elektron übrig – die Kette wächst weiter.", "An unpaired electron is left – the chain keeps growing.") },
    ok: T("Am neuen Ende geht es weiter.", "It carries on at the new end."),
  },
  {
    mode: "free",
    ask: T("Jetzt du: Tippe auf das C‑Atom mit dem Radikal.", "Your turn: tap the C atom with the radical."),
    answer: "rad",
    visual: c => <MechTap r={PS} acts={["heat", "add:styrol", "add:styrol"]} c={c} />,
    tip: T("Das Radikal ist ein einzelner Punkt an einem C‑Atom.", "The radical is a single dot on a C atom."),
    show: T("So geht's: das C‑Atom ganz am Ende mit dem Punkt.", "Here's how: the C atom right at the end with the dot."),
    lines: [T("Das ungepaarte Elektron sitzt am letzten C‑Atom der Kette.", "The unpaired electron sits on the last C atom of the chain.")],
    ok: T("Dort lagert sich das nächste Monomer an.", "The next monomer adds there."),
  },
  {
    mode: "worked",
    say: T("**Abbruch**: Zwei Radikale treffen sich.", "**Termination**: two radicals meet."),
    ask: T("Was passiert bei der **Rekombination**?", "What happens in **combination**?"),
    visual: () => <MechPlay r={PS} acts={["heat", "add:styrol", "add:styrol", "comb"]} />,
    lines: [
      T("Die zwei ungepaarten Elektronen bilden eine Bindung.", "The two unpaired electrons form a bond."),
      T("Zwei Ketten werden zu einer langen Kette.", "Two chains become one long chain."),
      T("Kein Radikal mehr – die Kette wächst nicht weiter.", "No radical left – the chain stops growing."),
    ],
    ok: T("Rekombination: Die Enden verbinden sich.", "Combination: the ends join."),
  },
  {
    mode: "worked",
    say: T("Oder ein H‑Atom wandert: **Disproportionierung**.", "Or an H atom moves: **disproportionation**."),
    ask: T("Wie enden die Ketten diesmal?", "How do the chains end this time?"),
    visual: () => <MechPlay r={PS} acts={["heat", "add:styrol", "add:styrol", "disp"]} />,
    lines: [
      T("Ein Radikal holt sich ein H‑Atom von der anderen Kette.", "One radical takes an H atom from the other chain."),
      T("Eine Kette endet gesättigt, die andere mit C=C.", "One chain ends saturated, the other with C=C."),
      T("Zwei fertige Ketten – kein Radikal mehr.", "Two finished chains – no radical left."),
    ],
    ok: T("Disproportionierung: ein H‑Atom wandert.", "Disproportionation: an H atom moves."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Welcher Abbruch verbindet zwei Ketten zu einer?", "Complete: which termination joins two chains into one?"),
    answer: T("Rekombination", "Combination"), options: [T("Rekombination", "Combination"), T("Disproportionierung", "Disproportionation")],
    lines: [T("Die beiden Radikal-Elektronen bilden eine Bindung", "The two radical electrons form a bond"), T("Abbruch durch {?}", "{?} ends the chain")],
    why: { [T("Disproportionierung", "Disproportionation")]: T("Dabei wandert ein H‑Atom – es bleiben zwei Ketten.", "Here an H atom moves – two chains remain.") },
    ok: T("Rekombination: eine lange Kette.", "Combination: one long chain."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Mehr Starter bei gleich viel Monomer – was passiert?", "Complete: more initiator, same amount of monomer – what happens?"),
    answer: T("mehr, aber kürzere Ketten", "more but shorter chains"), options: [T("mehr, aber kürzere Ketten", "more but shorter chains"), T("längere Ketten", "longer chains")],
    lines: [T("Jedes Radikal startet eine Kette", "Each radical starts a chain"), T("Mehr Radikale teilen sich das Monomer: {?}", "More radicals share the monomer: {?}")],
    why: { [T("längere Ketten", "longer chains")]: T("Das Monomer verteilt sich auf mehr Ketten – jede bekommt weniger.", "The monomer is shared among more chains – each gets less.") },
    ok: T("Mehr Starter: mehr Ketten, jede kürzer.", "More initiator: more chains, each shorter."),
  },
  {
    mode: "free",
    ask: T("Jetzt du: Was sitzt am Anfang jeder fertigen Kette?", "Your turn: what sits at the start of every finished chain?"),
    answer: T("ein Bruchstück des Starters", "a fragment of the initiator"), options: [T("ein Bruchstück des Starters", "a fragment of the initiator"), T("ein Radikal", "a radical"), T("nichts", "nothing")],
    why: { [T("ein Radikal", "a radical")]: T("Das Radikal saß am wachsenden Ende – nach dem Abbruch ist es weg.", "The radical sat at the growing end – after termination it is gone."), [T("nichts", "nothing")]: T("Der Starter wird verbraucht und bleibt am Kettenanfang.", "The initiator is used up and stays at the start of the chain.") },
    lines: [T("C₆H₅ aus dem Starter bleibt als **Endgruppe** am Kettenanfang.", "C₆H₅ from the initiator stays at the start of the chain as the **end group**.")],
    ok: T("Der Starter wird verbraucht – er ist kein **Katalysator** (beschleunigt, ohne verbraucht zu werden).", "The initiator is used up – it is not a **catalyst** (speeds up without being used up)."),
  },
];

// ── 3 Katalysatoren und Verfahren ──
const K3: GuideStep[] = [
  {
    mode: "worked",
    say: T("Ein **Katalysator** wird nicht verbraucht.", "A **catalyst** is not used up."),
    ask: T("Wie arbeitet der Ziegler-Natta-Katalysator?", "How does the Ziegler–Natta catalyst work?"),
    visual: () => <MechPlay r={ZN_PP} acts={["act", "add:propen"]} />,
    lines: [
      T("Am Titan sitzt die Kette, daneben eine **freie Stelle** (gestrichelt).", "The chain sits on the titanium, next to it a **vacant site** (dashed)."),
      T("Propen lagert sich dort mit seiner C=C-Bindung an.", "Propene attaches there with its C=C bond."),
      T("Dann rückt es zwischen Titan und Kette: eingebaut.", "Then it moves between titanium and chain: inserted."),
    ],
    ok: T("Die Stelle ist wieder frei – das nächste Monomer kann kommen.", "The site is free again – the next monomer can come."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Wo lagert sich das nächste Monomer an?", "Complete: where does the next monomer attach?"),
    answer: T("an der freien Stelle", "at the vacant site"), options: [T("an der freien Stelle", "at the vacant site"), T("an einem Radikal", "at a radical"), T("am Cl‑Atom", "at the Cl atom")],
    visual: () => <MechPlay r={ZN_PP} acts={["act", "add:propen", "add:propen"]} />,
    lines: [T("Eine **Aluminiumverbindung** gibt eine **Ethylgruppe** ans Titan – dort beginnt die Kette", "An **aluminium compound** gives an **ethyl group** to the titanium – the chain starts there"), T("Nach dem Einbau ist die Stelle am Titan wieder frei", "After insertion the site on the titanium is free again"), T("Das nächste Monomer kommt {?}", "The next monomer goes {?}")],
    why: { [T("an einem Radikal", "at a radical")]: T("Hier gibt es kein Radikal – die Kette hängt am Titan.", "There is no radical here – the chain hangs on the titanium."), [T("am Cl‑Atom", "at the Cl atom")]: T("Die Cl‑Atome halten das Titan, sie reagieren nicht.", "The Cl atoms hold the titanium, they do not react.") },
    ok: T("Jedes Monomer wird am Titan eingebaut.", "Every monomer is inserted at the titanium."),
  },
  {
    mode: "worked",
    say: T("Auch Ethen wird am Titan eingebaut.", "Ethene is inserted at the titanium too."),
    ask: T("Wie unterscheiden sich die zwei Sorten Polyethen?", "How do the two kinds of polyethene differ?"),
    visual: () => <MechPlay r={{ art: "poly", a: "ethen", method: "zn" }} acts={["act", "add:ethen"]} />,
    lines: [
      T("Am Titan wächst PE **unverzweigt**: **PE-HD**, dicht und fest.", "At the titanium PE grows **unbranched**: **PE-HD** (HDPE), dense and firm."),
      T("Radikalisch unter **Hochdruck** bekommt PE **Äste**: **verzweigtes** **PE-LD**, weniger dicht.", "With radicals under **high pressure** PE gets **branches**: **branched** **PE-LD** (LDPE), less dense."),
    ],
    ok: T("Gleiches Monomer, anderes Verfahren – andere Kette.", "Same monomer, different method – different chain."),
  },
  {
    mode: "worked",
    say: T("Polare Monomere **vergiften** den Katalysator.", "Polar monomers **poison** the catalyst."),
    ask: T("Was passiert mit **Methylmethacrylat** (MMA)?", "What happens with **methyl methacrylate** (MMA)?"),
    visual: () => <MechPlay r={ZN_MMA} acts={["act", "add:mma"]} />,
    lines: [
      T("MMA hat O‑Atome mit **freien Elektronenpaaren**.", "MMA has O atoms with **lone pairs**."),
      T("Ein O‑Atom bindet an das Titan und besetzt die freie Stelle.", "An O atom binds to the titanium and blocks the vacant site."),
      T("Kein Monomer kommt mehr heran: Der Katalysator ist **vergiftet**.", "No monomer can reach it any more: the catalyst is **poisoned**."),
    ],
    ok: T("PMMA (**Acrylglas**) und PVC macht man darum radikalisch, nicht mit Ziegler-Natta.", "That is why PMMA (**acrylic glass**) and PVC are made with radicals, not Ziegler–Natta."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Warum vergiftet Vinylchlorid das Titan?", "Complete: why does vinyl chloride poison the titanium?"),
    answer: T("Das Cl‑Atom bindet an die freie Stelle.", "The Cl atom binds to the vacant site."),
    options: [T("Das Cl‑Atom bindet an die freie Stelle.", "The Cl atom binds to the vacant site."), T("Es hat keine Zweifachbindung.", "It has no double bond."), T("Es ist zu groß.", "It is too big.")],
    visual: () => <Pic v={{ k: "mono", id: "vinylchlorid" }} />,
    lines: [T("Vinylchlorid: CH₂=CH–Cl, Cl hat freie Elektronenpaare", "Vinyl chloride: CH₂=CH–Cl, Cl has lone pairs"), T("Grund: {?}", "Reason: {?}")],
    why: { [T("Es hat keine Zweifachbindung.", "It has no double bond.")]: T("Vinylchlorid hat eine C=C-Bindung.", "Vinyl chloride has a C=C bond."), [T("Es ist zu groß.", "It is too big.")]: T("Vinylchlorid ist klein – das Problem ist das Cl‑Atom.", "Vinyl chloride is small – the problem is the Cl atom.") },
    ok: T("Cl, O, N und F vergiften das Titan.", "Cl, O, N and F poison the titanium."),
  },
  {
    mode: "free",
    ask: T("Jetzt du: Welches Monomer kann man mit Ziegler-Natta polymerisieren?", "Your turn: which monomer can be polymerised with Ziegler–Natta?"),
    answer: T("Propen", "Propene"), options: [T("Propen", "Propene"), T("Acrylnitril", "Acrylonitrile"), T("Vinylacetat", "Vinyl acetate")],
    why: { [T("Acrylnitril", "Acrylonitrile")]: T("Das N‑Atom der C≡N-Gruppe vergiftet das Titan.", "The N atom of the C≡N group poisons the titanium."), [T("Vinylacetat", "Vinyl acetate")]: T("Die O‑Atome der Acetatgruppe vergiften das Titan.", "The O atoms of the acetate group poison the titanium.") },
    lines: [T("Propen hat nur C- und H‑Atome.", "Propene has only C and H atoms."), T("**Acrylnitril** (C≡N-Gruppe) und **Vinylacetat** (**Acetatgruppe**) vergiften wie MMA.", "**Acrylonitrile** (C≡N group) and **vinyl acetate** (**acetate group**) poison like MMA.")],
    ok: T("Propen, Ethen, Styrol, Butadien: ohne O, N, Cl, F.", "Propene, ethene, styrene, butadiene: without O, N, Cl, F."),
  },
  {
    mode: "worked",
    say: T("**Isotaktisch**: Alle Seitengruppen zeigen zur selben Seite.", "**Isotactic**: all side groups point to the same side."),
    ask: T("Wie unterscheiden sich die Ketten?", "How do the chains differ?"),
    visual: () => <Two a={{ k: "chain", id: "propen", n: 4, tact: "iso" }} b={{ k: "chain", id: "propen", n: 4, tact: "atakt", seed: 7 }} la={T("isotaktisch (Ziegler-Natta)", "isotactic (Ziegler–Natta)")} lb={T("ataktisch (zufällig)", "atactic (random)")} vs />,
    lines: [
      T("Am Titan wird jedes Propen gleich herum eingebaut: isotaktisch.", "At the titanium every propene is inserted the same way: isotactic."),
      T("Zufällige Lage der Seitengruppen heißt **ataktisch**.", "A random position of the side groups is called **atactic**."),
      T("Regelmäßig abwechselnd oben und unten heißt **syndiotaktisch**.", "Regularly alternating up and down is called **syndiotactic**."),
      T("Geordnete Ketten packen sich dicht – der Kunststoff wird fest.", "Ordered chains pack closely – the plastic becomes stiff."),
    ],
    ok: T("Isotaktisches PP: Verschlüsse, Autoteile.", "Isotactic PP: caps, car parts."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Wie ist diese Kette gebaut?", "Complete: how is this chain built?"),
    answer: T("isotaktisch", "isotactic"), options: [T("isotaktisch", "isotactic"), T("ataktisch", "atactic")],
    visual: () => <Pic v={{ k: "chain", id: "styrol", n: 4, tact: "iso" }} />,
    lines: [T("Alle Benzolringe zeigen nach oben", "All benzene rings point upwards"), T("Also: {?}", "So: {?}")],
    why: { [T("ataktisch", "atactic")]: T("Ataktisch wären die Ringe zufällig oben und unten.", "Atactic would have the rings randomly above and below.") },
    ok: T("Gleiche Seite: isotaktisch.", "Same side: isotactic."),
  },
  {
    mode: "worked",
    say: T("**Kationisch** mit BF₃ und Wasser: Ein H⁺ startet die Kette.", "**Cationic** with BF₃ and water: an H⁺ starts the chain."),
    ask: T("Warum klappt das mit Isobuten (CH₃)₂C=CH₂?", "Why does this work with isobutene (CH₃)₂C=CH₂?"),
    visual: () => <MechPlay r={IB_BF3} acts={["acid", "add:isobuten"]} />,
    lines: [
      T("BF₃ und Wasser bilden eine Säure: H⁺ wird frei.", "BF₃ and water form an acid: H⁺ is set free."),
      T("H⁺ bindet an das CH₂ der C=C: Am Kettenende sitzt eine **positive Ladung**.", "H⁺ binds to the CH₂ of the C=C: a **positive charge** sits at the chain end."),
      T("Die zwei CH₃-Gruppen schieben Elektronen zum positiven C und machen es beständiger.", "The two CH₃ groups push electrons towards the positive C and make it more stable."),
    ],
    ok: T("Kationisch: Monomere, deren Gruppen die positive Ladung stützen (Isobuten: CH₃-Gruppen; Styrol: Benzolring).", "Cationic: monomers whose groups support the positive charge (isobutene: CH₃ groups; styrene: benzene ring)."),
  },
  {
    mode: "worked",
    say: T("**Anionisch** mit Butyllithium: Die Ketten **leben** weiter.", "**Anionic** with butyllithium: the chains **stay alive**."),
    ask: T("Wie startet die Kette?", "How does the chain start?"),
    visual: () => <MechPlay r={BULI} acts={["add:styrol"]} />,
    lines: [
      T("Das Butyl-Anion greift die C=C-Bindung an: negative Ladung am Kettenende.", "The butyl anion attacks the C=C bond: negative charge at the chain end."),
      T("Ohne Wasser bricht die Kette nicht von selbst ab.", "Without water the chain does not stop by itself."),
      T("Mit einem zweiten Monomer wächst ein **Block** weiter: ein **Blockcopolymer**.", "With a second monomer a **block** keeps growing: a **block copolymer**."),
    ],
    ok: T("Erst Methanol beendet die lebenden Ketten.", "Only methanol stops the living chains."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Lebende Styrol-Ketten + Butadien ergeben …", "Complete: living styrene chains + butadiene give …"),
    answer: T("ein Blockcopolymer", "a block copolymer"), options: [T("ein Blockcopolymer", "a block copolymer"), T("zwei getrennte Polymere", "two separate polymers")],
    visual: () => <Strips rows={[["", ["styrol", "styrol", "styrol", "styrol", "styrol", "butadien", "butadien", "butadien", "butadien"]]]} />,
    lines: [T("Die Ketten leben noch – Butadien wächst an jede Kette", "The chains are still alive – butadiene grows onto each chain"), T("Ergebnis: {?}", "Result: {?}")],
    why: { [T("zwei getrennte Polymere", "two separate polymers")]: T("Getrennt wird es nur, wenn die Ketten schon abgebrochen sind.", "It only becomes separate when the chains have already stopped.") },
    ok: T("Styrol-Block + Butadien-Block: SB.", "Styrene block + butadiene block: SB."),
  },
];

// ── 4 Polykondensation ──
const K4: GuideStep[] = [
  {
    mode: "worked",
    say: T("Bei der **Polykondensation** reagieren **funktionelle Gruppen** miteinander.", "In **polycondensation** **functional groups** react with each other."),
    ask: T("Wie verknüpfen sich Terephthalsäure und Ethandiol?", "How do terephthalic acid and ethane-1,2-diol link up?"),
    visual: () => <MechPlay r={PET} acts={["join"]} />,
    lines: [
      T("Terephthalsäure hat zwei –COOH-Gruppen (**Disäure**), Ethandiol zwei –OH-Gruppen (**Diol**).", "Terephthalic acid has two –COOH groups (**diacid**), ethane-1,2-diol two –OH groups (**diol**)."),
      T("–COOH und –OH verknüpfen sich zur **Esterbindung**.", "–COOH and –OH link into an **ester bond**."),
      T("Dabei wird **Wasser** abgespalten.", "**Water** is split off."),
      T("Viele Esterbindungen in einer Kette: ein **Polyester**, z. B. PET. Mit Butan-1,4-diol entsteht **PBT**.", "Many ester bonds in one chain: a **polyester**, e.g. PET. With butane-1,4-diol **PBT** forms."),
    ],
    ok: T("Viele Esterbindungen: der Polyester PET.", "Many ester bonds: the polyester PET."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Was wird bei –COOH + –OH abgespalten?", "Complete: what is split off from –COOH + –OH?"),
    answer: "H₂O", options: ["H₂O", "H₂", "CO₂"],
    visual: () => <MechPlay r={PET} acts={["join", "add:terephthalsaeure"]} />,
    lines: [T("Von –COOH geht OH weg, von –OH ein H", "OH leaves –COOH, H leaves –OH"), T("OH + H = {?}", "OH + H = {?}")],
    why: { "H₂": T("Das O‑Atom aus der Säuregruppe geht mit ab.", "The O atom from the acid group leaves as well."), "CO₂": T("Das C‑Atom bleibt in der Kette.", "The C atom stays in the chain.") },
    ok: T("Je Verknüpfung ein Wassermolekül. Rückwärts – Wasser spaltet die Esterbindung – heißt **Hydrolyse**.", "One water molecule per link. Backwards – water splits the ester bond – is called **hydrolysis**."),
  },
  {
    mode: "worked",
    say: T("Mit **Aminogruppen** (–NH₂) entsteht eine **Amidbindung**.", "With **amino groups** (–NH₂) an **amide bond** forms."),
    ask: T("Wie entsteht Nylon?", "How does nylon form?"),
    visual: () => <MechPlay r={PA} acts={["join"]} />,
    lines: [
      T("Adipinsäure + Hexan-1,6-diamin (ein **Diamin**): –CO–⁠NH–⁠.", "Adipic acid + hexane-1,6-diamine (a **diamine**): –CO–⁠NH–⁠."),
      T("Auch hier wird Wasser abgespalten – das Polymer heißt **Polyamid**.", "Water is split off here too – the polymer is called **polyamide**."),
      T("Mit **Säurechloriden** (–COCl) geht statt Wasser **HCl** ab.", "With **acyl chlorides** (acid chlorides, –COCl), **HCl** leaves instead of water."),
    ],
    ok: T("Nylon ist ein Polyamid (PA 6.6).", "Nylon is a polyamide (PA 6.6)."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Welche Bindung entsteht aus –COOH und –NH₂?", "Complete: which bond forms from –COOH and –NH₂?"),
    answer: T("Amidbindung", "Amide bond"), options: [T("Amidbindung", "Amide bond"), T("Esterbindung", "Ester bond")],
    lines: [T("–COOH + H₂N– → –CO–⁠NH–⁠ + H₂O", "–COOH + H₂N– → –CO–⁠NH–⁠ + H₂O"), T("–CO–⁠NH–⁠ heißt {?}", "–CO–⁠NH–⁠ is called {?}")],
    why: { [T("Esterbindung", "Ester bond")]: T("Ester entstehen mit –OH. Hier ist es –NH₂.", "Esters form with –OH. Here it is –NH₂.") },
    ok: T("Säure + Amin → Amid.", "Acid + amine → amide."),
  },
  {
    mode: "free",
    ask: T("Jetzt du: Adipinsäuredichlorid + Hexan-1,6-diamin – was wird abgespalten?", "Your turn: adipoyl chloride + hexane-1,6-diamine – what is split off?"),
    answer: "HCl", options: ["HCl", "H₂O", "Cl₂"],
    visual: () => <Pic v={{ k: "pair", a: "adipoylchlorid", b: "hexandiamin" }} />,
    why: { "H₂O": T("Das Säurechlorid hat Cl statt OH.", "The acyl chloride has Cl instead of OH."), "Cl₂": T("Das Cl verbindet sich mit dem H der Aminogruppe.", "The Cl joins with the H of the amino group.") },
    lines: [T("–COCl + H₂N– → –CO–⁠NH–⁠ + HCl", "–COCl + H₂N– → –CO–⁠NH–⁠ + HCl")],
    ok: T("Säurechlorid: HCl wird abgespalten.", "Acyl chloride: HCl is split off."),
  },
  {
    mode: "worked",
    say: T("Für lange Ketten braucht jedes Monomer **zwei** Gruppen.", "For long chains each monomer needs **two** groups."),
    ask: T("Was passiert mit einer oder drei Gruppen?", "What happens with one or three groups?"),
    visual: () => <Two a={{ k: "pair", a: "terephthalsaeure", b: "ethanol" }} b={{ k: "struct", s: "duro" }} la={T("eine Gruppe", "one group")} lb={T("drei Gruppen", "three groups")} vs />,
    lines: [
      T("Ethanol hat nur eine –OH-Gruppe: Danach ist das Ende blockiert.", "Ethanol has only one –OH group: then the end is blocked."),
      T("So ein Monomer ist ein **Kettenstopper**.", "Such a monomer is a **chain stopper**."),
      T("Glycerin hat drei –OH-Gruppen: Die Ketten verknüpfen sich zu einem **Netz**.", "Glycerol has three –OH groups: the chains link into a **network**."),
    ],
    ok: T("Zwei Gruppen: Kette. Drei Gruppen: Netz.", "Two groups: chain. Three groups: network."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Was entsteht aus Adipinsäure und Glycerin?", "Complete: what forms from adipic acid and glycerol?"),
    answer: T("ein Netz", "a network"), options: [T("ein Netz", "a network"), T("lange Ketten", "long chains"), T("kleine Moleküle", "small molecules")],
    lines: [T("Glycerin hat 3 reaktive Gruppen", "Glycerol has 3 reactive groups"), T("3 Gruppen verknüpfen die Ketten. Es entsteht {?}", "3 groups link the chains. The result is {?}")],
    why: { [T("lange Ketten", "long chains")]: T("Die dritte Gruppe verknüpft die Ketten untereinander.", "The third group links the chains to each other."), [T("kleine Moleküle", "small molecules")]: T("Beide Monomere haben mehrere Gruppen – es wird groß.", "Both monomers have several groups – it gets big.") },
    ok: T("Polyesterharz: ein Netz.", "Polyester resin: a network."),
  },
  {
    mode: "free",
    ask: T("Jetzt du: Welches Paar bildet lange Ketten?", "Your turn: which pair forms long chains?"),
    answer: T("Terephthalsäure + Ethandiol", "terephthalic acid + ethane-1,2-diol"),
    options: [T("Terephthalsäure + Ethandiol", "terephthalic acid + ethane-1,2-diol"), T("Terephthalsäure + Ethanol", "terephthalic acid + ethanol"), T("Ethandiol + Butan-1,4-diol", "ethane-1,2-diol + butane-1,4-diol")],
    why: { [T("Terephthalsäure + Ethanol", "terephthalic acid + ethanol")]: T("Ethanol hat nur eine Gruppe – Kettenstopper.", "Ethanol has only one group – chain stopper."), [T("Ethandiol + Butan-1,4-diol", "ethane-1,2-diol + butane-1,4-diol")]: T("Nur –OH-Gruppen: Gleiche Gruppen reagieren nicht.", "Only –OH groups: identical groups do not react.") },
    lines: [T("Je zwei passende Gruppen: –COOH und –OH.", "Two matching groups each: –COOH and –OH.")],
    ok: T("Das ergibt PET.", "That gives PET."),
  },
  {
    mode: "worked",
    say: T("Ein Monomer mit **zwei verschiedenen** Gruppen reagiert mit sich selbst.", "A monomer with **two different** groups reacts with itself."),
    ask: T("Wie entsteht PLA aus Milchsäure?", "How does PLA form from lactic acid?"),
    visual: () => <MechPlay r={{ art: "kond", a: "milchsaeure" }} acts={["join"]} />,
    lines: [
      T("**Milchsäure** HO–CH(CH₃)–COOH trägt –OH und –COOH.", "**Lactic acid** HO–CH(CH₃)–COOH carries –OH and –COOH."),
      T("Das –OH des einen Moleküls reagiert mit dem –COOH des nächsten: **PLA**.", "The –OH of one molecule reacts with the –COOH of the next: **PLA**."),
      T("**6-Aminohexansäure** trägt –NH₂ und –COOH: Daraus wird **PA 6**.", "**6-Aminohexanoic acid** carries –NH₂ and –COOH: it becomes **PA 6**."),
    ],
    ok: T("Zwei verschiedene Gruppen in einem Molekül: Es braucht keinen Partner.", "Two different groups in one molecule: no partner is needed."),
  },
];

// ── 5 Polyaddition ──
const K5: GuideStep[] = [
  {
    mode: "worked",
    say: T("Bei der **Polyaddition** wird **nichts** abgespalten.", "In **polyaddition** **nothing** is split off. (Not the same as the addition polymerisation of alkenes in chapter 2.)"),
    ask: T("Wie entsteht ein Polyurethan?", "How does a polyurethane form?"),
    visual: () => <MechPlay r={PUR} acts={["join"]} />,
    lines: [
      T("HDI (Hexamethylendiisocyanat) hat zwei **Isocyanatgruppen** –⁠N=C=O.", "HDI (hexamethylene diisocyanate) has two **isocyanate groups** –⁠N=C=O."),
      T("Das H‑Atom der –OH-Gruppe wandert zum N‑Atom.", "The H atom of the –OH group moves to the N atom."),
      T("Das O bindet an das C: **Urethangruppe** –NH–⁠CO–⁠O–⁠.", "The O binds to the C: **urethane group** –NH–⁠CO–⁠O–⁠."),
    ],
    ok: T("Polyurethan (PUR): Lacke, Schaum, Schuhsohlen.", "Polyurethane (PUR): paints, foam, shoe soles."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Welches Atom wandert?", "Complete: which atom moves?"),
    answer: "H", options: ["H", "O", "N"],
    visual: () => <MechPlay r={PUR} acts={["join", "add:hdi"]} />,
    lines: [T("–OH gibt sein H ab und behält das O", "–OH gives off its H and keeps the O"), T("Es wandert: {?}", "It moves: {?}")],
    why: { "O": T("Das O bleibt und bindet an das C‑Atom.", "The O stays and binds to the C atom."), "N": T("Das N nimmt das H auf – es wandert nicht.", "The N takes up the H – it does not move.") },
    ok: T("Nur ein H‑Atom wandert.", "Only an H atom moves."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Isocyanat + **Amin** (–NH₂) – welche Gruppe entsteht?", "Complete: isocyanate + **amine** (–NH₂) – which group forms?"),
    answer: T("Harnstoffgruppe", "urea group"), options: [T("Harnstoffgruppe", "urea group"), T("Urethangruppe", "urethane group"), T("Amidbindung", "amide bond")],
    lines: [T("Das H wandert vom N des Amins zum N des Isocyanats", "The H moves from the N of the amine to the N of the isocyanate"), T("Es entsteht –NH–⁠CO–⁠NH–⁠: die {?}", "–NH–⁠CO–⁠NH–⁠ forms: the {?}")],
    why: {
      [T("Urethangruppe", "urethane group")]: T("Urethan entsteht mit –OH. Mit –NH₂ entsteht Harnstoff: –NH–⁠CO–⁠NH–⁠.", "Urethane forms with –OH. With –NH₂ urea forms: –NH–⁠CO–⁠NH–⁠."),
      [T("Amidbindung", "amide bond")]: T("Eine Amidbindung entsteht aus –COOH und –NH₂, ohne Isocyanat.", "An amide bond forms from –COOH and –NH₂, without isocyanate."),
    },
    ok: T("Isocyanat + Amin → **Harnstoffgruppe**: Polyharnstoff.", "Isocyanate + amine → **urea group**: polyurea."),
  },
  {
    mode: "free",
    ask: T("Jetzt du: Was wird bei der Polyaddition abgespalten?", "Your turn: what is split off in polyaddition?"),
    answer: T("nichts", "nothing"), options: [T("nichts", "nothing"), T("Wasser", "water"), "HCl"],
    why: { [T("Wasser", "water")]: T("Wasser geht bei der Polykondensation ab, nicht hier.", "Water leaves in polycondensation, not here."), HCl: T("HCl geht nur bei Säurechloriden ab.", "HCl only leaves with acyl chlorides.") },
    lines: [T("Alle Atome bleiben im Polymer.", "All atoms stay in the polymer.")],
    ok: T("Addition: nur zusammenfügen.", "Addition: only joining."),
  },
  {
    mode: "worked",
    say: T("**Epoxidharz**: Die **Epoxidgruppe** ist ein Dreierring aus C, C und O. Der Ring ist **gespannt** – seine Winkel sind nur etwa 60° statt etwa 109,5°.", "**Epoxy resin**: the **epoxide group** is a three-membered ring of C, C and O. The ring is **strained** – its angles are only about 60° instead of about 109.5°."),
    ask: T("Wie härtet ein **Zweikomponentenkleber** (Harz + Härter aus zwei Tuben)?", "How does a **two-part adhesive** (resin + hardener from two tubes) set?"),
    visual: () => <MechPlay r={EP} acts={["join"]} />,
    lines: [
      T("Das N der Aminogruppe greift ein C‑Atom des Rings an.", "The N of the amino group attacks a C atom of the ring."),
      T("Der Ring öffnet sich, ein H‑Atom wandert zum O.", "The ring opens, an H atom moves to the O."),
      T("Ein **Diepoxid** trägt zwei Epoxidgruppen, ein Diamin zwei –NH₂.", "A **diepoxide** carries two epoxide groups, a diamine two –NH₂."),
      T("Jede –NH₂-Gruppe reagiert **zweimal**: ein festes **Netz**.", "Each –NH₂ group reacts **twice**: a solid **network**."),
    ],
    ok: T("Auch hier wird nichts abgespalten.", "Again nothing is split off."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Wie oft reagiert eine –NH₂-Gruppe mit Epoxidgruppen?", "Complete: how often does an –NH₂ group react with epoxide groups?"),
    answer: T("zweimal", "twice"), options: [T("zweimal", "twice"), T("einmal", "once")],
    lines: [T("–NH₂ hat zwei H‑Atome", "–NH₂ has two H atoms"), T("Jedes H kann wandern → {?}", "Each H can move → {?}")],
    why: { [T("einmal", "once")]: T("Nach der ersten Reaktion bleibt noch ein H am N.", "After the first reaction one H is still left on the N.") },
    ok: T("Darum entsteht ein Netz.", "That is why a network forms."),
  },
  {
    mode: "worked",
    say: T("Drei Reaktionsarten im Vergleich.", "Three types of reaction compared."),
    ask: T("Woran erkennt man die Reaktionsart?", "How do you recognise the type of reaction?"),
    visual: () => <Two a={{ k: "pair", a: "terephthalsaeure", b: "ethandiol" }} b={{ k: "pair", a: "hdi", b: "butandiol" }} la={T("Polykondensation", "Polycondensation")} lb={T("Polyaddition", "Polyaddition")} vs />,
    lines: [
      T("**Polymerisation**: C=C öffnet sich, nichts geht ab.", "**Polymerisation**: C=C opens, nothing leaves."),
      T("**Polykondensation**: Gruppen reagieren, ein kleines Molekül geht ab.", "**Polycondensation**: groups react, a small molecule leaves."),
      T("**Polyaddition**: Gruppen reagieren, ein H wandert, nichts geht ab.", "**Polyaddition**: groups react, an H moves, nothing leaves."),
    ],
    ok: T("Nebenprodukt oder nicht – das entscheidet.", "By-product or not – that decides it."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: MDI (Diphenylmethandiisocyanat) + Butan-1,4-diol – welche Reaktionsart?", "Complete: MDI (methylene diphenyl diisocyanate) + butane-1,4-diol – which type of reaction?"),
    answer: T("Polyaddition", "Polyaddition"), options: [T("Polyaddition", "Polyaddition"), T("Polykondensation", "Polycondensation"), T("Polymerisation", "Polymerisation")],
    lines: [T("MDI hat –⁠N=C=O, Butandiol –OH: es entsteht Urethan", "MDI has –⁠N=C=O, butanediol –OH: urethane forms"), T("Kein Nebenprodukt → {?}", "No by-product → {?}")],
    why: { [T("Polykondensation", "Polycondensation")]: T("Dabei ginge ein kleines Molekül ab – hier nicht.", "That would split off a small molecule – not here."), [T("Polymerisation", "Polymerisation")]: T("Polymerisation braucht C=C im Monomer.", "Polymerisation needs C=C in the monomer.") },
    ok: T("Isocyanat + Alkohol: Polyaddition.", "Isocyanate + alcohol: polyaddition."),
  },
];

// ── 6 Struktur und Eigenschaften ──
const K6: GuideStep[] = [
  {
    mode: "worked",
    say: T("Wie die Ketten verbunden sind, bestimmt die Eigenschaften.", "How the chains are connected decides the properties."),
    ask: T("Was ist ein **Thermoplast**?", "What is a **thermoplastic**?"),
    visual: () => <Pic v={{ k: "struct", s: "thermo" }} />,
    lines: [
      T("Einzelne Ketten, nur locker aneinander.", "Separate chains, only loosely together."),
      T("Beim Erwärmen gleiten sie aneinander vorbei: weich und formbar.", "On heating they slide past each other: soft and shapeable."),
      T("PE, PP und PET sind Thermoplaste – man kann sie einschmelzen und neu formen.", "PE, PP and PET are thermoplastics – they can be melted down and reshaped."),
    ],
    ok: T("Thermoplaste schmelzen.", "Thermoplastics melt."),
  },
  {
    mode: "worked",
    say: T("Brücken zwischen den Ketten ändern alles.", "Cross-links (bridges) between the chains change everything."),
    ask: T("Was sind **Elastomere** und **Duroplaste**?", "What are **elastomers** and **thermosets**?"),
    visual: () => <Two a={{ k: "struct", s: "elast" }} b={{ k: "struct", s: "duro" }} la={T("Elastomer", "Elastomer")} lb={T("Duroplast", "Thermoset")} vs />,
    lines: [
      T("Elastomer: wenige Brücken – dehnbar, springt zurück (Gummi).", "Elastomer: a few cross-links – stretchy, springs back (rubber)."),
      T("Duroplast: dichtes Netz – hart, schmilzt nicht.", "Thermoset: dense network – hard, does not melt."),
      T("Beim Erhitzen zersetzt sich ein Duroplast.", "On heating a thermoset decomposes."),
    ],
    ok: T("Brücken entscheiden: keine, wenige, viele.", "Cross-links decide: none, a few, many."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Welche Kunststoffart zeigt das Bild?", "Complete: which type of plastic does the picture show?"),
    answer: T("Duroplast", "Thermoset"), options: [T("Duroplast", "Thermoset"), T("Thermoplast", "Thermoplastic"), T("Elastomer", "Elastomer")],
    visual: () => <Pic v={{ k: "struct", s: "duro" }} />,
    lines: [T("Sehr viele Brücken: ein dichtes Netz", "Very many cross-links: a dense network"), T("Dichtes Netz → {?}", "Dense network → {?}")],
    why: { [T("Thermoplast", "Thermoplastic")]: T("Ein Thermoplast hat keine Brücken.", "A thermoplastic has no cross-links."), [T("Elastomer", "Elastomer")]: T("Ein Elastomer hat nur wenige Brücken.", "An elastomer has only a few cross-links.") },
    ok: T("Dichtes Netz: Duroplast.", "Dense network: thermoset."),
  },
  {
    mode: "free",
    ask: T("Jetzt du: Ein Topfgriff darf am heißen Topf nicht weich werden. Welche Kunststoffart?", "Your turn: a pan handle must not soften on a hot pan. Which type of plastic?"),
    answer: T("Duroplast", "Thermoset"), options: [T("Duroplast", "Thermoset"), T("Thermoplast", "Thermoplastic"), T("Elastomer", "Elastomer")],
    why: { [T("Thermoplast", "Thermoplastic")]: T("Ein Thermoplast würde am heißen Topf weich.", "A thermoplastic would soften on the hot pan."), [T("Elastomer", "Elastomer")]: T("Ein Elastomer ist weich und dehnbar – kein fester Griff.", "An elastomer is soft and stretchy – not a firm handle.") },
    lines: [T("Hitzefest und hart: dichtes Netz.", "Heat-resistant and hard: dense network.")],
    ok: T("Topfgriffe sind oft aus Duroplast (Phenoplast).", "Pan handles are often made of thermoset (phenolic resin)."),
  },
  {
    mode: "worked",
    say: T("**Copolymere** enthalten zwei Monomere.", "**Copolymers** contain two monomers."),
    ask: T("Wie können die Bausteine angeordnet sein?", "How can the repeat units be arranged?"),
    visual: () => <Strips rows={[
      [T("statistisch", "random"), ["styrol", "butadien", "butadien", "styrol", "butadien", "styrol", "styrol", "butadien"]],
      [T("Block", "block"), ["styrol", "styrol", "styrol", "styrol", "butadien", "butadien", "butadien", "butadien"]],
      [T("alternierend", "alternating"), ["styrol", "butadien", "styrol", "butadien", "styrol", "butadien", "styrol", "butadien"]],
    ]} />,
    lines: [
      T("**Statistisch**: zufällige Reihenfolge (Styrol-Butadien-Kautschuk).", "**Random (statistical)**: mixed order (styrene–butadiene rubber)."),
      T("**Block**: erst viele gleiche, dann viele andere (lebende Ketten).", "**Block**: first many of one, then many of the other (living chains)."),
      T("**Alternierend**: immer abwechselnd.", "**Alternating**: always taking turns."),
    ],
    ok: T("Die Reihenfolge ändert die Eigenschaften.", "The order changes the properties."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Welches Copolymer ist das?", "Complete: which copolymer is this?"),
    answer: T("Blockcopolymer", "Block copolymer"), options: [T("Blockcopolymer", "Block copolymer"), T("statistisches Copolymer", "random copolymer")],
    visual: () => <Strips rows={[["", ["ethen", "ethen", "ethen", "ethen", "ethen", "propen", "propen", "propen", "propen", "propen"]]]} />,
    lines: [T("Erst 5 graue, dann 5 blaue Kügelchen", "First 5 grey, then 5 blue beads"), T("→ {?}", "→ {?}")],
    why: { [T("statistisches Copolymer", "random copolymer")]: T("Statistisch wären die Farben gemischt.", "Random would have the colours mixed.") },
    ok: T("Zwei Blöcke: Blockcopolymer.", "Two blocks: block copolymer."),
  },
  {
    mode: "worked",
    say: T("Ketten- und Stufenwachstum verlaufen ganz verschieden.", "Chain growth and step growth run quite differently."),
    ask: T("Was ist nach einiger Zeit im Gefäß?", "What is in the vessel after a while?"),
    visual: () => <Growth />,
    lines: [
      T("**Kettenwachstum** (Polymerisation): Wenige Ketten werden schnell lang, viel Monomer bleibt übrig.", "**Chain growth** (polymerisation): a few chains quickly get long, lots of monomer is left."),
      T("**Stufenwachstum** (Polykondensation, Polyaddition): Alle Moleküle reagieren.", "**Step growth** (polycondensation, polyaddition): all molecules react."),
      T("Dort gibt es lange Ketten erst ganz am Ende.", "There, long chains only appear at the very end."),
      T("**Umsatz** = Anteil der Gruppen, die schon reagiert haben: 90 % heißt 9 von 10.", "**Conversion** = share of the groups that have already reacted: 90 % means 9 out of 10."),
    ],
    ok: T("Im Experimentieren zeigt der Reaktor beides.", "In Experiment the reactor shows both."),
  },
  {
    mode: "faded",
    ask: T("Ergänze: Polykondensation bei 90 % Umsatz – was ist im Gefäß?", "Complete: polycondensation at 90 % conversion – what is in the vessel?"),
    // beide Möglichkeiten als Bild (gleiche Monomere), Beschriftung = Antworttext – verrät nicht, welche stimmt
    visual: () => <Two a={{ k: "pot", s: "short", seq: ["terephthalsaeure", "ethandiol"] }} b={{ k: "pot", s: "long", seq: ["terephthalsaeure", "ethandiol"] }}
      la={T("kurze Ketten (im Mittel 10 Bausteine), kaum Monomer", "short chains (about 10 repeat units), hardly any monomer")} lb={T("sehr lange Ketten und viel Monomer", "very long chains and lots of monomer")} vs />,
    answer: T("kurze Ketten, kaum Monomer", "short chains, hardly any monomer"), options: [T("kurze Ketten, kaum Monomer", "short chains, hardly any monomer"), T("sehr lange Ketten und viel Monomer", "very long chains and lots of monomer")],
    lines: [T("Stufenwachstum: alle Gruppen reagieren miteinander", "Step growth: all groups react with each other"), T("Bei 90 % Umsatz: {?}", "At 90 % conversion: {?}")],
    why: { [T("sehr lange Ketten und viel Monomer", "very long chains and lots of monomer")]: T("So sieht Kettenwachstum aus.", "That is what chain growth looks like.") },
    ok: T("Lange Ketten erst ganz am Ende.", "Long chains only at the very end."),
  },
];

/** Lektionen der sechs Kapitel (Index = Level) */
export const LESSONS: GuideDef[] = [
  { title: T("Monomere und Polymere", "Monomers and polymers"), steps: K1, known: [T("Ethan", "Ethane"), T("Polypropen", "Polypropene")],
    outro: [T("Monomer mit C=C → Polymer: Poly + Name des Monomers.", "Monomer with C=C → polymer: poly + name of the monomer."), T("Baustein in [ ]ₙ, im Kügelchenmodell eine Kugel.", "Unit in [ ]ₙ, one bead in the bead model.")] },
  { title: T("Radikalische Polymerisation", "Radical polymerisation"), steps: K2,
    outro: [T("Start: Starter zerfällt. Wachstum: Radikal + C=C. Abbruch: Radikal + Radikal.", "Initiation: initiator splits. Propagation: radical + C=C. Termination: radical + radical."), T("Halber Pfeil = ein Elektron.", "Half-headed arrow = one electron.")] },
  { title: T("Katalysatoren und Verfahren", "Catalysts and methods"), steps: K3, known: [T("Propen", "Propene")],
    outro: [T("Ziegler-Natta: Einbau am Titan, Propen isotaktisch; O, N, Cl, F vergiften.", "Ziegler–Natta: insertion at titanium, propene isotactic; O, N, Cl, F poison it."), T("Kationisch: H⁺ startet; Gruppen stützen die Ladung (Isobuten: zwei CH₃).", "Cationic: H⁺ starts; groups support the charge (isobutene: two CH₃)."), T("Anionisch: lebende Ketten, Blockcopolymere.", "Anionic: living chains, block copolymers.")] },
  { title: T("Polykondensation", "Polycondensation"), steps: K4,
    outro: [T("Gruppen reagieren, H₂O oder HCl geht ab: Ester, Amid.", "Groups react, H₂O or HCl leaves: ester, amide."), T("Eine Gruppe stoppt, drei Gruppen vernetzen.", "One group stops, three groups cross-link.")] },
  { title: T("Polyaddition", "Polyaddition"), steps: K5, known: ["H"],
    outro: [T("Ohne Nebenprodukt: Ein H‑Atom wandert.", "No by-product: an H atom moves."), T("Isocyanat + Alkohol → Urethan, Epoxid + Amin → Netz.", "Isocyanate + alcohol → urethane, epoxide + amine → network.")] },
  { title: T("Struktur und Eigenschaften", "Structure and properties"), steps: K6, known: [T("Elastomer", "Elastomer")],
    outro: [T("Thermoplast, Elastomer, Duroplast: keine, wenige, viele Brücken.", "Thermoplastic, elastomer, thermoset: no, a few, many cross-links."), T("Kettenwachstum: lange Ketten sofort. Stufenwachstum: erst am Ende.", "Chain growth: long chains at once. Step growth: only at the end.")] },
];
