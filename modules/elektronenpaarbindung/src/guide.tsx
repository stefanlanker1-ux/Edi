// Geführte Erklärung Elektronenpaarbindung: mit der Lewis-Darstellung der App (Punkte = Außenelektronen, graues Oval =
// bindendes Paar, roter Kreis = Oktett). Einmal wird die Bindung selbst angetippt (wie im Baukasten: einfach → doppelt).

import type { GuideCtx, GuideDef, GuideStep } from "@lern/ui";
import { KNOWN_BY_ID, toMolecule, type Molecule } from "@lern/chem";
import { LewisSvg } from "./components/LewisSvg.tsx";
import { tr } from "@lern/i18n";

/** Rastermolekül aus Atomen [Element, x, y] und Bindungen [a, b, Ordnung] (Indizes ab 0) */
const mol = (atoms: [string, number, number][], bonds: [number, number, number][] = []): Molecule =>
  ({ atoms: atoms.map(([el, x, y], i) => ({ id: i + 1, el, x, y })), bonds: bonds.map(([a, b, order]) => ({ a: a + 1, b: b + 1, order })) });
const known = (id: string) => toMolecule(KNOWN_BY_ID[id]);

/** Lewis-Formel, eingepasst; mit `tap` ist die (einzige) Bindung antippbar (Ziel "bond");
 *  `note` steht unter der Zeichnung (z. B. dass die Lewis-Formel flach ist, das Molekül aber räumlich) */
function Lewis({ m, c, tap, octet = true, note }: { m: Molecule; c?: GuideCtx; tap?: boolean; octet?: boolean; note?: string }) {
  const w = Math.max(...m.atoms.map(a => a.x)) + 1, h = Math.max(...m.atoms.map(a => a.y)) + 1;
  return (
    <div className={`epb-g${tap && c?.show ? " show" : ""}${note ? " noted" : ""}`}>
      <LewisSvg mol={m} cols={w} rows={h} crop showOctet={octet} onBond={tap && c ? () => c.pick("bond") : undefined} />
      {note && <p className="epb-g-note">{note}</p>}
    </div>
  );
}

/** Die Lewis-Formel zeigt Bindungen und Paare in der Ebene – Winkel und Form sind räumlich anders */
const FLAT = tr("Lewis-Formel flach gezeichnet – die Winkel im Bild sind nicht die echten.", "Lewis formula drawn flat – the angles in the picture are not the real ones.");

const ETHEN = mol([["C", 1, 0], ["C", 2, 0], ["H", 0, 0], ["H", 1, 1], ["H", 3, 0], ["H", 2, 1]], [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]]);
const EB = () => tr("Einfachbindung", "single bond"), ZB = () => tr("Zweifachbindung", "double bond"), DB = () => tr("Dreifachbindung", "triple bond");
const POL = () => "polar", UNP = () => tr("unpolar", "non-polar");

const US = (): GuideStep[] => [
  // ── Außenelektronen ──
  {
    mode: "worked", part: tr("Außenelektronen", "Outer electrons"),
    say: tr("In der **Lewis-Schreibweise** zeigen Punkte die **Außenelektronen**.", "In **Lewis notation** dots show the **outer electrons**."),
    ask: tr("Wie sind die 6 Außenelektronen von Sauerstoff verteilt?", "How are oxygen's 6 outer electrons arranged?"),
    visual: () => <Lewis m={mol([["O", 0, 0]])} />,
    labels: [{ at: ".lone.pair", text: tr("Elektronenpaar", "Electron pair") }, { at: ".lone.one", text: tr("einzelnes Elektron", "single electron") }],
    lines: [tr("Die 4 Seiten werden erst einzeln besetzt, dann gepaart.", "The 4 sides are filled singly first, then paired."), tr("Sauerstoff: 2 **Paare** und 2 **einzelne** (**ungepaarte**) Elektronen mit Ring.", "Oxygen: 2 **pairs** and 2 **single** (**unpaired**) electrons with a ring."), tr("Jedes einzelne Elektron kann **eine Bindung** eingehen.", "Each single electron can form **one bond**.")],
    ok: tr("Einzelne Elektronen = mögliche Bindungen.", "Single electrons = possible bonds."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze für **Stickstoff** (5 Außenelektronen).", "Complete for **nitrogen** (5 outer electrons)."), answer: 3, num: {},
    visual: () => <Lewis m={mol([["N", 0, 0]])} />,
    lines: [tr("5 Elektronen auf 4 Seiten: 1 Paar, der Rest einzeln.", "5 electrons on 4 sides: 1 pair, the rest single."), tr("Einzelne Elektronen = Bindungen: {?}", "Single electrons = bonds: {?}")],
    why: { "5": tr("5 sind alle Außenelektronen. Binden können nur die einzelnen.", "5 are all the outer electrons. Only the single ones can bond."), "1": tr("Zähle die Elektronen mit Ring.", "Count the electrons with a ring.") },
    tip: tr("Zähle die Elektronen mit Ring.", "Count the electrons with a ring."),
    ok: tr("Stickstoff: 3 Bindungen.", "Nitrogen: 3 bonds."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Wie viele Bindungen geht ein **Kohlenstoff**-Atom ein?", "Your turn: how many bonds does a **carbon** atom form?"), answer: 4, num: {},
    visual: () => <Lewis m={mol([["C", 0, 0]])} />,
    why: { "2": tr("Kohlenstoff hat kein Paar – alle 4 Elektronen sind einzeln.", "Carbon has no pair – all 4 electrons are single."), "6": tr("Kohlenstoff hat nur 4 Außenelektronen.", "Carbon only has 4 outer electrons.") },
    tip: tr("Jedes einzelne Elektron (mit Ring) ergibt eine Bindung.", "Each single electron (with a ring) gives one bond."),
    lines: [tr("C: 4 einzelne → 4 Bindungen. Merke: H 1, O 2, N 3, C 4.", "C: 4 single → 4 bonds. Remember: H 1, O 2, N 3, C 4.")],
    ok: tr("Genau: 4 Bindungen.", "Exactly: 4 bonds."),
  },
  // ── Bindungen ──
  {
    mode: "worked", part: tr("Bindungen", "Bonds"),
    say: tr("Zwei H-Atome mit je **einem** einzelnen Elektron kommen sich nahe.", "Two H atoms, each with **one** single electron, come close."),
    ask: tr("Wie entsteht das H₂-Molekül?", "How does the H₂ molecule form?"),
    visual: () => <Lewis m={known("H2")} />,
    labels: [{ at: ".bond", text: tr("bindendes Paar", "bonding pair"), side: "top" }],
    lines: [tr("Die beiden einzelnen Elektronen bilden ein **gemeinsames Elektronenpaar** (graues Oval).", "The two single electrons form a **shared electron pair** (grey oval)."), tr("Das ist die **Elektronenpaarbindung**: H–H.", "This is the **covalent bond**: H–H."), tr("Das Paar gehört **beiden**: jedes H hat 2 Elektronen um sich (**Duett**).", "The pair belongs to **both**: each H has 2 electrons around it (**duet**).")],
    ok: tr("Teilen statt abgeben – beide ziehen gleich stark.", "Sharing instead of giving – both pull equally hard."),
  },
  {
    mode: "worked",
    say: tr("Andere Atome haben im Molekül meist **8** Elektronen um sich: **Oktett** (roter Kreis).", "Other atoms usually have **8** electrons around them in a molecule: **octet** (red circle)."),
    ask: tr("Wie viele Elektronen hat das O-Atom in **Wasser** um sich?", "How many electrons does the O atom in **water** have around it?"),
    visual: () => <Lewis m={known("H2O")} />,
    labels: [{ at: ".octet:not(.duet)", text: tr("Oktett", "Octet"), point: "ne", side: "top" }, { at: ".lone.pair", text: tr("freies Paar", "lone pair") }],
    lines: [tr("O hat 2 einzelne Elektronen → bindet 2 H.", "O has 2 single electrons → bonds 2 H."), tr("Um O: 2 **freie Paare** (binden nicht) = 4 Elektronen.", "Around O: 2 **lone pairs** (not bonding) = 4 electrons."), tr("Dazu 2 bindende Paare = 4 → zusammen **8**: Oktett.", "Plus 2 bonding pairs = 4 → **8** in total: octet.")],
    ok: tr("8 außen wie bei einem Edelgas: **Edelgaskonfiguration**. Bindende Paare zählen für beide Atome.", "8 outside like a noble gas: **noble gas configuration**. Bonding pairs count for both atoms."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie viele Elektronen umgeben ein **Cl**-Atom in **CCl₄**?", "Complete: how many electrons surround a **Cl** atom in **CCl₄**?"), answer: 8, num: {},
    visual: () => <Lewis m={known("CCl4")} />,
    lines: [tr("Cl hat 3 freie Paare = 6 Elektronen.", "Cl has 3 lone pairs = 6 electrons."), tr("Dazu das bindende Paar zu C = 2.", "Plus the bonding pair to C = 2."), tr("6 + 2 = {?}", "6 + 2 = {?}")],
    why: { "6": tr("Das bindende Paar zählt auch für Cl: 6 + 2.", "The bonding pair counts for Cl too: 6 + 2."), "7": tr("Rechne mit Paaren: 6 + 2.", "Count in pairs: 6 + 2.") },
    tip: tr("Rechne die letzte Zeile aus.", "Work out the last line."),
    ok: tr("Oktett: 8 Elektronen.", "Octet: 8 electrons."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Wie viele **freie** Elektronenpaare hat das N-Atom in **NH₃**?", "Your turn: how many **lone pairs** does the N atom in **NH₃** have?"), answer: 1, num: {},
    visual: () => <Lewis m={known("NH3")} />,
    why: { "3": tr("3 Paare sind bindend (graue Ovale). Frei ist das Paar außen.", "3 pairs are bonding (grey ovals). The lone pair is on the outside."), "4": tr("4 sind alle Paare. Ohne die bindenden bleibt …", "4 are all the pairs. Without the bonding ones there is …") },
    tip: tr("Freie Paare liegen außen, nicht im grauen Oval.", "Lone pairs are outside, not in the grey oval."),
    lines: [tr("3 bindende + 1 freies Paar = 8 Elektronen um N.", "3 bonding + 1 lone pair = 8 electrons around N.")],
    ok: tr("Genau: 1 freies Paar.", "Exactly: 1 lone pair."),
  },
  // ── Mehrfachbindungen ──
  {
    mode: "worked", part: tr("Mehrfachbindungen", "Multiple bonds"),
    say: tr("Ein gemeinsames Paar ist eine **Einfachbindung**.", "One shared pair is a **single bond**."),
    ask: tr("Wie binden zwei Sauerstoff-Atome?", "How do two oxygen atoms bond?"),
    visual: () => <Lewis m={known("O2")} />,
    labels: [{ at: ".bond", text: tr("Zweifachbindung", "double bond"), side: "top" }],
    lines: [tr("Nach einer Einfachbindung hat jedes O noch 1 einzelnes Elektron.", "After one single bond each O still has 1 single electron."), tr("Die beiden bilden ein zweites Paar: **Zweifachbindung** O=O.", "These two form a second pair: **double bond** O=O."), tr("Drei Paare heißen **Dreifachbindung** – so lange, bis jedes Atom ein Oktett hat.", "Three pairs are called a **triple bond** – until every atom has an octet.")],
    ok: tr("O=O: beide O haben ein Oktett.", "O=O: both O have an octet."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Welche Bindung liegt in **N₂** vor?", "Complete: which bond is there in **N₂**?"), answer: DB(), options: [EB(), ZB(), DB()],
    visual: () => <Lewis m={mol([["N", 0, 0], ["N", 2, 0]])} octet={false} />,
    lines: [tr("Jedes N hat 3 einzelne Elektronen.", "Each N has 3 single electrons."), tr("Alle drei bilden Paare mit dem anderen N.", "All three form pairs with the other N."), tr("→ {?}", "→ {?}")],
    why: { [EB()]: tr("Dann hätte jedes N noch 2 einzelne Elektronen.", "Then each N would still have 2 single electrons."), [ZB()]: tr("Dann hätte jedes N noch 1 einzelnes Elektron.", "Then each N would still have 1 single electron.") },
    ok: tr("N≡N: drei gemeinsame Paare.", "N≡N: three shared pairs."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Tippe auf das graue **Bindungs-Oval**, um O–O zu O=O zu machen.", "Your turn: tap the grey **bond oval** to turn O–O into O=O."), answer: "bond",
    visual: c => <Lewis m={mol([["O", 0, 0], ["O", 1, 0]], [[0, 1, 1]])} c={c} tap />,
    show: tr("So geht's: tippe auf das graue Oval zwischen den beiden O-Atomen.", "How to: tap the grey oval between the two O atoms."),
    tip: tr("Die Bindung ist das graue Oval zwischen den beiden Atomen.", "The bond is the grey oval between the two atoms."),
    lines: [tr("Ein Tipp aufs Oval: Einfach → Zweifach → Dreifach.", "One tap on the oval: single → double → triple.")],
    ok: tr("O=O – so geht es auch im Baukasten.", "O=O – it works the same in the build kit."),
  },
  {
    mode: "free",
    ask: tr("Wie viele **freie** Elektronenpaare hat jedes N-Atom in N₂?", "How many **lone pairs** does each N atom in N₂ have?"), answer: 1, num: {},
    visual: () => <Lewis m={known("N2")} />,
    why: { "3": tr("3 Paare sind bindend. Frei ist das Paar außen.", "3 pairs are bonding. The lone pair is on the outside."), "2": tr("Zähle nur die Paare außerhalb der Bindung.", "Count only the pairs outside the bond.") },
    tip: tr("Zähle nur die Paare außerhalb der grauen Ovale.", "Count only the pairs outside the grey ovals."),
    lines: [tr("3 bindende + 1 freies Paar = 8 Elektronen.", "3 bonding + 1 lone pair = 8 electrons.")],
    ok: tr("Genau: 1 freies Paar.", "Exactly: 1 lone pair."),
  },
  // ── Moleküle und Namen ──
  {
    mode: "worked", part: tr("Moleküle und Namen", "Molecules and names"),
    say: tr("Wichtige Namen: **Wasser** H₂O, **Ammoniak** NH₃, **Methan** CH₄, **Chlorwasserstoff** HCl.", "Important names: **water** H₂O, **ammonia** NH₃, **methane** CH₄, **hydrogen chloride** HCl."),
    ask: tr("Welche Formel hat die Verbindung aus C und H?", "What is the formula of the compound of C and H?"),
    visual: () => <Lewis m={known("CH4")} />,
    lines: [tr("C hat 4 einzelne Elektronen, H je 1.", "C has 4 single electrons, H 1 each."), tr("Also binden 4 H an ein C.", "So 4 H bond to one C."), tr("→ **CH₄**, Methan.", "→ **CH₄**, methane.")],
    ok: tr("Die Formel folgt aus den einzelnen Elektronen.", "The formula follows from the single electrons."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Welche Formel hat die Verbindung aus N und H?", "Complete: what is the formula of the compound of N and H?"), answer: "NH₃", options: ["NH₂", "NH₃", "NH₄", "N₃H"],
    visual: () => <Lewis m={mol([["N", 0, 0]])} />,
    lines: [tr("N hat 3 einzelne Elektronen.", "N has 3 single electrons."), tr("Also binden 3 H → {?}", "So 3 H bond → {?}")],
    why: { "NH₂": tr("Dann bliebe 1 einzelnes Elektron übrig.", "Then 1 single electron would be left over."), "NH₄": tr("N hat nur 3 einzelne Elektronen.", "N has only 3 single electrons."), "N₃H": tr("Ein N bindet 3 H, nicht umgekehrt.", "One N binds 3 H, not the other way round.") },
    ok: tr("**NH₃**.", "**NH₃**."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Wie heißt **NH₃**?", "Your turn: what is **NH₃** called?"), answer: tr("Ammoniak", "ammonia"), options: [tr("Methan", "methane"), tr("Wasser", "water"), tr("Ammoniak", "ammonia"), tr("Chlorwasserstoff", "hydrogen chloride")],
    visual: () => <Lewis m={known("NH3")} />,
    why: { [tr("Methan", "methane")]: tr("Methan ist CH₄.", "Methane is CH₄."), [tr("Wasser", "water")]: tr("Wasser ist H₂O.", "Water is H₂O."), [tr("Chlorwasserstoff", "hydrogen chloride")]: tr("Chlorwasserstoff ist HCl.", "Hydrogen chloride is HCl.") },
    lines: [tr("NH₃ = Ammoniak.", "NH₃ = ammonia.")],
    ok: tr("Genau: Ammoniak.", "Exactly: ammonia."),
  },
  {
    mode: "worked",
    say: tr("Manche Elemente bestehen aus Molekülen mit 2 Atomen: H₂, N₂, O₂, F₂, Cl₂.", "Some elements consist of molecules with 2 atoms: H₂, N₂, O₂, F₂, Cl₂."),
    ask: tr("Welche Formel hat **Chlor**?", "What is the formula of **chlorine**?"),
    visual: () => <Lewis m={known("Cl2")} />,
    lines: [tr("Cl hat 7 Außenelektronen: 3 Paare, 1 einzelnes.", "Cl has 7 outer electrons: 3 pairs, 1 single."), tr("Zwei Cl-Atome teilen ihr einzelnes Elektron: Cl–Cl.", "Two Cl atoms share their single electron: Cl–Cl."), tr("Formel **Cl₂**, Name wie das Element: Chlor.", "Formula **Cl₂**, named like the element: chlorine.")],
    ok: tr("Ein einzelnes Cl-Atom hätte kein Oktett.", "A single Cl atom would not have an octet."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Welche Formel hat **Fluor**?", "Complete: what is the formula of **fluorine**?"), answer: "F₂", options: ["F", tr("2 F", "2 F"), "F₂", "F₃"],
    why: { F: tr("Ein einzelnes F-Atom hätte kein Oktett.", "A single F atom would not have an octet."), [tr("2 F", "2 F")]: tr("2 F sind zwei getrennte Atome. Verbunden schreibt man F₂.", "2 F are two separate atoms. Bonded, you write F₂."), "F₃": tr("Jedes F bindet nur einmal – zwei Atome reichen.", "Each F bonds only once – two atoms are enough.") },
    lines: [tr("F hat wie Cl 7 Außenelektronen: 1 einzelnes.", "Like Cl, F has 7 outer electrons: 1 single."), tr("Zwei F-Atome teilen es: F–F → {?}", "Two F atoms share it: F–F → {?}")],
    ok: tr("**F₂** – wie H₂, N₂, O₂ und Cl₂.", "**F₂** – like H₂, N₂, O₂ and Cl₂."),
  },
];

const OS: GuideStep[] = [
  // ── Bindungen ──
  {
    mode: "worked", part: tr("Bindungen", "Bonds"),
    say: tr("Punkte = Außenelektronen. Jedes **einzelne** Elektron (mit Ring) kann eine Bindung eingehen.", "Dots = outer electrons. Every **single** electron (with a ring) can form a bond."),
    ask: tr("Wie viele Bindungen gehen C, N, O und H ein?", "How many bonds do C, N, O and H form?"),
    visual: () => <Lewis m={mol([["C", 0, 0]])} />,
    labels: [{ at: ".lone.one", text: tr("einzelnes Elektron", "single electron") }],
    lines: [tr("C: 4 einzelne → 4 Bindungen.", "C: 4 single → 4 bonds."), tr("N: 3, O: 2, H und Halogene: 1.", "N: 3, O: 2, H and halogens: 1."), tr("Ein gemeinsames Paar = **Einfachbindung**.", "One shared pair = **single bond**.")],
    ok: tr("Diese Zahlen tragen jede Strukturformel.", "These numbers underlie every structural formula."),
  },
  {
    mode: "worked",
    say: tr("Haben zwei verbundene Atome noch einzelne Elektronen, entsteht eine **Mehrfachbindung**.", "If two bonded atoms still have single electrons, a **multiple bond** forms."),
    ask: tr("Wie sieht **Ethen** (C₂H₄) aus?", "What does **ethene** (C₂H₄) look like?"),
    visual: () => <Lewis m={ETHEN} />,
    lines: [tr("Nach den C–H-Bindungen hat jedes C noch 1 einzelnes Elektron.", "After the C–H bonds each C still has 1 single electron."), tr("Die beiden bilden ein zweites Paar: **Zweifachbindung** C=C.", "The two form a second pair: **double bond** C=C."), tr("Mit drei Paaren: **Dreifachbindung**. Ziel: jedes Atom hat ein Oktett.", "With three pairs: **triple bond**. Goal: every atom has an octet.")],
    ok: tr("Mehrfachbindungen, bis keine einzelnen Elektronen übrig sind.", "Multiple bonds until no single electrons are left."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Welche Bindung liegt in **HCN** zwischen C und N vor?", "Complete: which bond is there in **HCN** between C and N?"), answer: DB(), options: [EB(), ZB(), DB()],
    visual: () => <Lewis m={mol([["H", 0, 0], ["C", 1, 0], ["N", 3, 0]], [[0, 1, 1]])} octet={false} />,
    lines: [tr("C hat nach der Bindung zu H noch 3 einzelne Elektronen.", "After the bond to H, C still has 3 single electrons."), tr("N hat 3 einzelne Elektronen.", "N has 3 single electrons."), tr("→ {?}", "→ {?}")],
    why: { [EB()]: tr("C hat nach H noch 3 einzelne Elektronen, N hat 3.", "After H, C still has 3 single electrons, N has 3."), [ZB()]: tr("Dann hätten C und N noch je 1 einzelnes Elektron.", "Then C and N would each still have 1 single electron.") },
    ok: tr("H–C≡N: C hat 4 Bindungen, N hat 3.", "H–C≡N: C has 4 bonds, N has 3."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Tippe auf die C–C-Bindung, um aus Ethan-Bausteinen Ethen zu machen.", "Your turn: tap the C–C bond to turn it into ethene."), answer: "bond",
    visual: c => <Lewis m={mol([["C", 1, 0], ["C", 2, 0], ["H", 0, 0], ["H", 1, 1], ["H", 3, 0], ["H", 2, 1]], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]])} c={c} tap />,
    show: tr("So geht's: tippe auf das graue Oval zwischen den beiden C-Atomen.", "How to: tap the grey oval between the two C atoms."),
    tip: tr("Die Bindung zwischen zwei Atomen ist das graue Oval.", "The bond between two atoms is the grey oval."),
    lines: [tr("C=C: jetzt hat jedes C ein Oktett.", "C=C: now each C has an octet.")],
    ok: tr("Genau: Ethen mit C=C.", "Exactly: ethene with C=C."),
  },
  // ── Molekülform ──
  {
    mode: "worked", part: tr("Molekülform", "Molecular shape"),
    say: tr("**EPA-Modell**: Elektronenpaare um ein Zentralatom stoßen sich ab und gehen möglichst weit auseinander. Freie Paare zählen mit.", "**VSEPR model**: electron pairs around a central atom repel each other and spread as far apart as possible. Lone pairs count too."),
    ask: tr("Welche Form hat **NH₃**?", "What shape does **NH₃** have?"),
    visual: () => <Lewis m={known("NH3")} note={FLAT} />,
    lines: [tr("N: 3 bindende + 1 freies Paar = 4 Paare.", "N: 3 bonding + 1 lone pair = 4 pairs."), tr("4 Paare zeigen in die Ecken eines Tetraeders.", "4 pairs point to the corners of a tetrahedron."), tr("Die Atome bilden eine Pyramide: **trigonal-pyramidal**, ca. 107°.", "The atoms form a pyramid: **trigonal pyramidal**, approx. 107°.")],
    ok: tr("Form = Lage der Atome, nicht der freien Paare.", "Shape = position of the atoms, not of the lone pairs."),
  },
  {
    mode: "worked",
    say: tr("Jede Bindung und jedes freie Paar am Zentralatom ist ein **Bereich**. Eine Mehrfachbindung zählt wie **ein** Bereich.", "Each bond and each lone pair on the central atom is a **region**. A multiple bond counts as **one** region."),
    ask: tr("Welche Formen gibt es?", "Which shapes are there?"),
    lines: [tr("4 Bereiche, kein freies Paar → **tetraedrisch**, 109,5° (CH₄).", "4 regions, no lone pair → **tetrahedral**, 109.5° (CH₄)."), tr("4 Bereiche, 2 freie Paare → **gewinkelt**, 104,5° (H₂O).", "4 regions, 2 lone pairs → **bent**, 104.5° (H₂O)."), tr("3 Bereiche → **trigonal-planar**, ca. 120° (H₂C=O).", "3 regions → **trigonal planar**, approx. 120° (H₂C=O)."), tr("2 Bereiche → **linear**, 180° (O=C=O).", "2 regions → **linear**, 180° (O=C=O).")],
    ok: tr("Erst Bereiche zählen, dann die Form ablesen.", "Count the regions first, then read off the shape."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Welchen **Bindungswinkel** hat Wasser?", "Complete: what is the **bond angle** in water?"), answer: tr("104,5°", "104.5°"), options: [tr("109,5°", "109.5°"), tr("104,5°", "104.5°"), "120°", "180°"],
    visual: () => <Lewis m={known("H2O")} note={FLAT} />,
    lines: [tr("O: 2 bindende + 2 freie Paare = 4 Bereiche.", "O: 2 bonding + 2 lone pairs = 4 regions."), tr("Freie Paare drücken stärker → unter 109,5°: {?}", "Lone pairs push harder → below 109.5°: {?}")],
    why: { [tr("109,5°", "109.5°")]: tr("109,5° ist der Tetraederwinkel. Die zwei freien Paare drücken stärker.", "109.5° is the tetrahedral angle. The two lone pairs push harder."), "120°": tr("120° gilt für 3 Bereiche (trigonal-planar).", "120° applies to 3 regions (trigonal planar)."), "180°": tr("Wasser ist gewinkelt, nie linear.", "Water is bent, never linear.") },
    ok: tr("H₂O: gewinkelt, 104,5°.", "H₂O: bent, 104.5°."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Welchen Bindungswinkel hat **CO₂** (O=C=O)?", "Your turn: what is the bond angle in **CO₂** (O=C=O)?"), answer: "180°", options: [tr("109,5°", "109.5°"), "120°", tr("104,5°", "104.5°"), "180°"],
    visual: () => <Lewis m={known("CO2")} />,
    why: { "120°": tr("C hat keine freien Paare – nur 2 Bereiche (zwei Zweifachbindungen).", "C has no lone pairs – only 2 regions (two double bonds)."), [tr("109,5°", "109.5°")]: tr("Eine Zweifachbindung zählt wie ein Bereich: nur 2 Bereiche.", "A double bond counts as one region: only 2 regions."), [tr("104,5°", "104.5°")]: tr("Das gilt für Wasser mit 2 freien Paaren.", "That applies to water with 2 lone pairs.") },
    lines: [tr("2 Bereiche → linear, 180°.", "2 regions → linear, 180°.")],
    ok: tr("Genau: 180°.", "Exactly: 180°."),
  },
  {
    mode: "free",
    ask: tr("Welchen Bindungswinkel ergibt das EPA-Modell für **Methanal** (H₂C=O)?", "What bond angle does the VSEPR model give for **methanal** (H₂C=O)?"), answer: "120°", options: [tr("109,5°", "109.5°"), "90°", "120°", "180°"],
    visual: () => <Lewis m={known("CH2O")} note={FLAT} />,
    why: { [tr("109,5°", "109.5°")]: tr("C hat nur 3 Bereiche (2 × C–H, 1 × C=O).", "C has only 3 regions (2 × C–H, 1 × C=O)."), "180°": tr("Das wären nur 2 Bereiche.", "That would be only 2 regions."), "90°": tr("Die Bereiche gehen so weit wie möglich auseinander.", "The regions spread as far apart as possible.") },
    lines: [tr("3 Bereiche → trigonal-planar, ca. 120°.", "3 regions → trigonal planar, approx. 120°.")],
    ok: tr("Genau: 120°.", "Exactly: 120°."),
  },
  // ── Polarität ──
  {
    mode: "worked", part: tr("Polarität", "Polarity"),
    say: tr("Die **Elektronegativität** (EN) gibt an, wie stark ein Atom das Bindungspaar anzieht.", "**Electronegativity** (EN) tells you how strongly an atom attracts the bonding pair."),
    ask: tr("Ist die Bindung in **H–Cl** polar?", "Is the bond in **H–Cl** polar?"),
    visual: () => <Lewis m={known("HCl")} />,
    lines: [tr("ΔEN = 3,16 − 2,20 ≈ 1,0.", "ΔEN = 3.16 − 2.20 ≈ 1.0."), tr("ΔEN ≥ 0,4 → **polar**: Cl zieht das Paar zu sich.", "ΔEN ≥ 0.4 → **polar**: Cl pulls the pair towards itself."), tr("Teilladungen: Cl **δ−**, H **δ+**. Unter 0,4: **unpolar**.", "Partial charges: Cl **δ−**, H **δ+**. Below 0.4: **non-polar**.")],
    ok: tr("Größere EN → δ−.", "Higher EN → δ−."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Welche Bindung ist **am stärksten polar**?", "Complete: which bond is **the most polar**?"), answer: "H–F", options: ["C–H", "H–Cl", "H–F", "Cl–Cl"],
    lines: [tr("ΔEN: H–F 1,8 · H–Cl 1,0 · C–H 0,35 · Cl–Cl 0.", "ΔEN: H–F 1.8 · H–Cl 1.0 · C–H 0.35 · Cl–Cl 0."), tr("Größtes ΔEN: {?}", "Largest ΔEN: {?}")],
    why: { "H–Cl": tr("Polar, aber H–F hat das größere ΔEN.", "Polar, but H–F has the larger ΔEN."), "C–H": tr("ΔEN ≈ 0,35 – unter 0,4, also unpolar.", "ΔEN ≈ 0.35 – below 0.4, so non-polar."), "Cl–Cl": tr("Gleiche Atome: ΔEN = 0, unpolar.", "Identical atoms: ΔEN = 0, non-polar.") },
    ok: tr("H–F ist am stärksten polar.", "H–F is the most polar."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: In **H–F**: Welches Atom trägt δ−?", "Your turn: in **H–F**, which atom carries δ−?"), answer: "F", options: ["H", "F"],
    why: { H: tr("F hat die größere EN – es zieht das Paar zu sich und wird δ−.", "F has the higher EN – it pulls the pair towards itself and becomes δ−.") },
    lines: [tr("EN(F) 3,98 > EN(H) 2,20 → F δ−, H δ+.", "EN(F) 3.98 > EN(H) 2.20 → F δ−, H δ+.")],
    ok: tr("Genau: F δ−.", "Exactly: F δ−."),
  },
  {
    mode: "worked",
    say: tr("Ein **Molekül** ist polar, wenn sich die Teilladungen nicht aufheben.", "A **molecule** is polar if the partial charges do not cancel."),
    ask: tr("Ist **CO₂** ein polares Molekül?", "Is **CO₂** a polar molecule?"),
    visual: () => <Lewis m={known("CO2")} />,
    lines: [tr("Jede C=O-Bindung ist polar.", "Each C=O bond is polar."), tr("CO₂ ist linear: die beiden Dipole zeigen genau entgegengesetzt.", "CO₂ is linear: the two dipoles point exactly opposite."), tr("Sie heben sich auf → Molekül unpolar.", "They cancel → molecule non-polar.")],
    ok: tr("Polare Bindungen machen nicht immer ein polares Molekül – die Form entscheidet.", "Polar bonds do not always make a polar molecule – the shape decides."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Ist **Wasser** polar?", "Complete: is **water** polar?"), answer: POL(), options: [POL(), UNP()],
    visual: () => <Lewis m={known("H2O")} />,
    lines: [tr("O–H-Bindungen sind polar.", "O–H bonds are polar."), tr("Wasser ist gewinkelt – nicht symmetrisch.", "Water is bent – not symmetrical."), tr("Die Dipole heben sich nicht auf → {?}", "The dipoles do not cancel → {?}")],
    why: { [UNP()]: tr("Wasser ist gewinkelt – die Teilladungen heben sich nicht auf.", "Water is bent – the partial charges do not cancel.") },
    ok: tr("H₂O: O δ−, beide H δ+ → Dipol.", "H₂O: O δ−, both H δ+ → dipole."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Ist **Tetrachlormethan** (CCl₄) polar oder unpolar?", "Your turn: is **tetrachloromethane** (CCl₄) polar or non-polar?"), answer: UNP(), options: [POL(), UNP()],
    visual: () => <Lewis m={known("CCl4")} note={tr("Lewis-Formel flach gezeichnet – räumlich ist CCl₄ ein Tetraeder.", "Lewis formula drawn flat – in space CCl₄ is a tetrahedron.")} />,
    why: { [POL()]: tr("Jede C–Cl-Bindung ist polar, aber der Tetraeder ist symmetrisch – sie heben sich auf.", "Each C–Cl bond is polar, but the tetrahedron is symmetrical – they cancel.") },
    lines: [tr("Symmetrischer Tetraeder → Dipole heben sich auf → unpolar.", "Symmetrical tetrahedron → dipoles cancel → non-polar.")],
    ok: tr("Genau: unpolar.", "Exactly: non-polar."),
  },
];

export function guideFor(stufe: "us" | "os"): GuideDef {
  return stufe === "us"
    ? { title: tr("Elektronenpaarbindung", "Covalent Bonds"), steps: US(), outro: [
      tr("Einzelne Außenelektronen = mögliche Bindungen: H 1, O 2, N 3, C 4.", "Single outer electrons = possible bonds: H 1, O 2, N 3, C 4."),
      tr("Ein gemeinsames Paar = eine Bindung; es zählt für **beide** Atome.", "One shared pair = one bond; it counts for **both** atoms."),
      tr("Im Molekül **Oktett** (8), bei H **Duett** (2). Freie Paare zählen mit.", "In a molecule an **octet** (8), for H a **duet** (2). Lone pairs count too."),
      tr("Zweifach- und Dreifachbindung, wenn noch einzelne Elektronen übrig sind (O₂, N₂).", "Double and triple bonds when single electrons are left over (O₂, N₂)."),
      tr("Formeln und Namen: H₂O, NH₃, CH₄, CCl₄, Cl₂ …", "Formulas and names: H₂O, NH₃, CH₄, CCl₄, Cl₂ …"),
    ] }
    : { title: tr("Elektronenpaarbindung", "Covalent Bonds"), steps: OS, outro: [
      tr("Mehrfachbindungen bauen: Ethen C=C, Blausäure C≡N.", "Building multiple bonds: ethene C=C, hydrogen cyanide C≡N."),
      tr("**EPA-Modell**: Paare (auch freie) gehen auseinander; Mehrfachbindung = ein Bereich.", "**VSEPR model**: pairs (lone pairs too) spread apart; multiple bond = one region."),
      tr("Formen und Winkel: tetraedrisch 109,5°, pyramidal 107°, gewinkelt 104,5°, planar 120°, linear 180°.", "Shapes and angles: tetrahedral 109.5°, pyramidal 107°, bent 104.5°, planar 120°, linear 180°."),
      tr("ΔEN ≥ 0,4: polare Bindung (δ+/δ−); Molekül polar, wenn sich die Dipole nicht aufheben.", "ΔEN ≥ 0.4: polar bond (δ+/δ−); molecule polar if the dipoles do not cancel."),
    ] };
}
