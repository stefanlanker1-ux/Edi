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

const PAIR = () => tr("Sie bilden ein gemeinsames Elektronenpaar.", "They form a shared electron pair."), GIVE = () => tr("Ein H gibt sein Elektron ab.", "One H gives away its electron."), PUSH = () => tr("Sie stoßen sich ab.", "They repel each other.");

const US = (): GuideStep[] => [
  {
    part: tr("Außenelektronen", "Outer electrons"),
    say: tr("Die Punkte zeigen die **Außenelektronen**. Zwei Punkte nebeneinander sind ein **Paar**, ein Punkt mit Ring ist ein **einzelnes** Elektron.", "The dots show the **outer electrons**. Two dots side by side are a **pair**, a dot with a ring is a **single** electron."),
    ask: tr("Wie viele **einzelne** Elektronen hat ein Sauerstoff-Atom?", "How many **single** electrons does an oxygen atom have?"), answer: 2, num: {},
    visual: () => <Lewis m={mol([["O", 0, 0]])} />,
    why: { "6": tr("6 sind alle Außenelektronen. Zähle nur die einzelnen (mit Ring).", "6 are all the outer electrons. Count only the single ones (with a ring)."), "4": tr("4 sind in den zwei Paaren. Gesucht sind die einzelnen.", "4 are in the two pairs. You need the single ones.") },
    tip: tr("Einzelne Elektronen haben einen Ring; Paare stehen zu zweit nebeneinander.", "Single electrons have a ring; pairs sit side by side."),
    labels: [{"at": ".lone.pair", "text": tr("Elektronenpaar", "Electron pair")}, {"at": ".lone.one", "text": tr("einzelnes Elektron", "single electron")}],
    ok: tr("Sauerstoff: 2 Paare, 2 einzelne Elektronen.", "Oxygen: 2 pairs, 2 single electrons."),
  },
  {
    say: tr("Jedes **einzelne** Elektron kann eine Bindung eingehen.", "Every **single** electron can form a bond."),
    ask: tr("Wie viele Elektronenpaarbindungen geht ein **Stickstoff**-Atom ein?", "How many covalent bonds does a **nitrogen** atom form?"), answer: 3, num: {},
    visual: () => <Lewis m={mol([["N", 0, 0]])} />,
    why: { "5": tr("5 sind alle Außenelektronen. Binden können nur die einzelnen.", "5 are all the outer electrons. Only the single ones can bond."), "1": tr("Zähle die Elektronen mit Ring.", "Count the electrons with a ring.") },
    tip: tr("Jedes einzelne Elektron (mit Ring) ergibt eine Bindung.", "Each single electron (with a ring) gives one bond."),
    labels: [{"at": ".lone.one", "text": tr("einzelnes Elektron", "single electron")}],
    ok: tr("Stickstoff hat 3 einzelne Elektronen → 3 Bindungen.", "Nitrogen has 3 single electrons → 3 bonds."),
  },
  {
    part: tr("Bindungen", "Bonds"),
    say: tr("Zwei H-Atome mit je **einem** einzelnen Elektron kommen sich nahe.", "Two H atoms, each with **one** single electron, come close."),
    ask: tr("Was passiert? Sag es vorher!", "What happens? Predict it!"), answer: PAIR(), options: [PAIR(), GIVE(), PUSH()],
    visual: c => <Lewis m={c.solved ? known("H2") : mol([["H", 0, 0], ["H", 2, 0]])} />,
    why: { [GIVE()]: tr("Beide ziehen gleich stark – keiner gibt ab. Sie teilen.", "Both pull equally hard – neither gives away. They share."), [PUSH()]: tr("Die einzelnen Elektronen können sich zu einem Paar verbinden.", "The single electrons can join into a pair.") },
    ok: tr("Aus zwei einzelnen Elektronen wird ein **gemeinsames Paar**: H–H.", "Two single electrons become a **shared pair**: H–H."),
  },
  {
    say: tr("Zwei einzelne Elektronen bilden ein **gemeinsames Paar** – die Bindung (graues Oval). Es gehört **beiden** Atomen.", "Two single electrons form a **shared pair** – the bond (grey oval). It belongs to **both** atoms."),
    ask: tr("Wie viele Elektronen hat jedes H-Atom im H₂-Molekül um sich?", "How many electrons does each H atom in the H₂ molecule have around it?"), answer: 2, num: {},
    visual: () => <Lewis m={known("H2")} />,
    why: { "1": tr("Das gemeinsame Paar zählt für beide Atome: 2 Elektronen.", "The shared pair counts for both atoms: 2 electrons.") },
    tip: tr("Das Paar im grauen Oval gehört beiden Atomen gleichzeitig.", "The pair in the grey oval belongs to both atoms at once."),
    labels: [{"at": ".bond", "text": tr("bindendes Paar", "bonding pair"), "side": "top"}],
    ok: tr("Wasserstoff hat im Molekül **2** Elektronen um sich (Duett) – ✓.", "In the molecule hydrogen has **2** electrons around it (duet) – ✓."),
  },
  {
    say: tr("Andere Atome haben im Molekül meist **8** Elektronen um sich (**Oktett**, roter Kreis). Bindende Paare zählen dabei für **beide** Atome.", "Other atoms usually have **8** electrons around them in a molecule (**octet**, red circle). Bonding pairs count for **both** atoms."),
    ask: tr("Wie viele Elektronen umgeben das O-Atom in **Wasser**?", "How many electrons surround the O atom in **water**?"), answer: 8, num: {},
    visual: () => <Lewis m={known("H2O")} />,
    why: { "4": tr("Zähle auch die zwei bindenden Paare mit: 4 + 4.", "Count the two bonding pairs too: 4 + 4."), "6": tr("6 hatte das O-Atom allein. Durch die Bindungen kommen 2 dazu.", "The O atom had 6 on its own. The bonds add 2.") },
    tip: tr("Zähle alle Elektronen im roten Kreis – auch die im grauen Oval.", "Count all electrons in the red circle – including those in the grey oval."),
    labels: [{"at": ".octet:not(.duet)", "text": tr("Oktett", "Octet"), "point": "ne", "side": "top"}, {"at": ".bond", "text": tr("bindendes Paar", "bonding pair")}],
    ok: tr("2 freie Paare + 2 bindende Paare = 8 Elektronen.", "2 lone pairs + 2 bonding pairs = 8 electrons."),
  },
  {
    say: tr("Paare, die nicht binden, heißen **freie** (nichtbindende) **Elektronenpaare**.", "Pairs that do not bond are called **lone pairs** (non-bonding pairs)."),
    ask: tr("Wie viele **freie** Elektronenpaare hat das O-Atom in Wasser?", "How many **lone pairs** does the O atom in water have?"), answer: 2, num: {},
    visual: () => <Lewis m={known("H2O")} />,
    why: { "4": tr("4 sind alle Paare. Ohne die 2 bindenden bleiben …", "4 are all the pairs. Without the 2 bonding ones there are …"), "8": tr("8 sind die Elektronen. Gefragt sind freie **Paare**.", "8 are the electrons. The question asks for lone **pairs**.") },
    tip: tr("Freie Paare liegen außen, nicht im grauen Oval.", "Lone pairs are outside, not in the grey oval."),
    labels: [{"at": ".lone.pair", "text": tr("freies Paar", "lone pair")}, {"at": ".bond", "text": tr("bindendes Paar", "bonding pair")}],
    ok: tr("Wasser: O hat 2 freie und 2 bindende Paare.", "Water: O has 2 lone and 2 bonding pairs."),
  },
  {
    part: tr("Mehrfachbindungen", "Multiple bonds"),
    say: tr("Haben nach einer Bindung **beide** Atome noch einzelne Elektronen, binden sie noch einmal: **Zweifachbindung**.", "If **both** atoms still have single electrons after one bond, they bond again: **double bond**."),
    ask: tr("Tippe auf das graue **Bindungs-Oval**, um die Bindung zu verstärken.", "Tap the grey **bond oval** to strengthen the bond."), answer: "bond",
    visual: c => <Lewis m={mol([["O", 0, 0], ["O", 1, 0]], [[0, 1, 1]])} c={c} tap />,
    show: tr("So geht's: tippe auf das graue Oval zwischen den beiden O-Atomen.", "How to: tap the grey oval between the two O atoms."),
    tip: tr("Die Bindung ist das graue Oval zwischen den beiden Atomen.", "The bond is the grey oval between the two atoms."),
    labels: [{"at": ".bond", "text": tr("Zweifachbindung", "double bond"), "side": "top", "afterSolved": true}],
    ok: tr("O=O: zwei gemeinsame Paare – jetzt haben beide O-Atome ein Oktett.", "O=O: two shared pairs – now both O atoms have an octet."),
  },
  {
    ask: tr("Stickstoff hat 3 einzelne Elektronen. Welche Bindung liegt in **N₂** vor?", "Nitrogen has 3 single electrons. Which bond is there in **N₂**?"), answer: tr("Dreifachbindung", "triple bond"),
    options: [tr("Einfachbindung", "single bond"), tr("Zweifachbindung", "double bond"), tr("Dreifachbindung", "triple bond")],
    visual: () => <Lewis m={mol([["N", 0, 0], ["N", 2, 0]])} octet={false} />,
    why: { [tr("Einfachbindung", "single bond")]: tr("Dann hätte jedes N noch 2 einzelne Elektronen.", "Then each N would still have 2 single electrons."), [tr("Zweifachbindung", "double bond")]: tr("Dann hätte jedes N noch 1 einzelnes Elektron.", "Then each N would still have 1 single electron.") },
    labels: [{"at": ".lone.one", "text": tr("einzelnes Elektron", "single electron")}],
    ok: tr("N≡N: drei gemeinsame Paare.", "N≡N: three shared pairs."),
  },
  {
    ask: tr("Wie viele **freie** Elektronenpaare hat jedes N-Atom in N₂?", "How many **lone pairs** does each N atom in N₂ have?"), answer: 1, num: {},
    visual: () => <Lewis m={known("N2")} />,
    why: { "3": tr("3 Paare sind bindend. Frei ist das Paar außen.", "3 pairs are bonding. The lone pair is on the outside."), "2": tr("Zähle nur die Paare außerhalb der Bindung.", "Count only the pairs outside the bond.") },
    tip: tr("Zähle nur die Paare außerhalb der grauen Ovale.", "Count only the pairs outside the grey ovals."),
    labels: [{"at": ".bond", "text": tr("Dreifachbindung", "triple bond"), "side": "top"}],
    ok: tr("Jedes N: 3 bindende + 1 freies Paar = 8 Elektronen.", "Each N: 3 bonding + 1 lone pair = 8 electrons."),
  },
  {
    part: tr("Moleküle und Namen", "Molecules and names"),
    say: tr("Kohlenstoff hat 4 einzelne Elektronen – er geht **4** Bindungen ein.", "Carbon has 4 single electrons – it forms **4** bonds."),
    ask: tr("Welche Formel hat **Methan** (C mit H)?", "What is the formula of **methane** (C with H)?"), answer: "CH₄", options: ["CH₄", "CH₂", "CH₃", "C₄H"],
    visual: () => <Lewis m={mol([["C", 0, 0]])} />,
    why: { "CH₂": tr("Dann blieben 2 einzelne Elektronen übrig.", "Then 2 single electrons would be left over."), "CH₃": tr("Dann bliebe 1 einzelnes Elektron übrig.", "Then 1 single electron would be left over."), "C₄H": tr("Ein C bindet 4 H, nicht umgekehrt.", "One C binds 4 H, not the other way round.") },
    labels: [{"at": ".lone.one", "text": tr("einzelnes Elektron", "single electron")}],
    ok: tr("C hat 4 einzelne Elektronen → 4 Bindungen zu H: **CH₄** (Methan).", "C has 4 single electrons → 4 bonds to H: **CH₄** (methane)."),
  },
  {
    ask: tr("Wie viele Elektronen umgeben ein **Cl**-Atom in **CCl₄**?", "How many electrons surround a **Cl** atom in **CCl₄**?"), answer: 8, num: {},
    visual: () => <Lewis m={known("CCl4")} />,
    why: { "6": tr("Das bindende Paar zählt auch für Cl: 6 + 2.", "The bonding pair counts for Cl too: 6 + 2."), "7": tr("Cl hat 7 eigene, mit dem gemeinsamen Partner-Elektron sind es 8.", "Cl has 7 of its own; with the shared partner electron there are 8.") },
    tip: tr("Zähle alle Elektronen im roten Kreis um ein Cl – das Paar im Oval mitzählen.", "Count all electrons in the red circle around one Cl – include the pair in the oval."),
    labels: [{"at": ".bond", "text": tr("bindendes Paar", "bonding pair")}, {"at": ".lone.pair", "text": tr("freies Paar", "lone pair"), "nth": -1}],
    ok: tr("Oktett: 3 freie Paare + 1 bindendes Paar.", "Octet: 3 lone pairs + 1 bonding pair."),
  },
  {
    say: tr("Elemente als Moleküle aus 2 Atomen heißen wie das Element: H₂, N₂, O₂, F₂, Cl₂.", "Elements made of 2-atom molecules have the element's name: H₂, N₂, O₂, F₂, Cl₂."),
    ask: tr("Welche Formel hat **Chlor**?", "What is the formula of **chlorine**?"), answer: "Cl₂", options: ["Cl₂", "Cl", tr("2 Cl", "2 Cl"), "Cl₃"],
    why: { Cl: tr("Ein einzelnes Cl-Atom hätte kein Oktett.", "A single Cl atom would not have an octet."), [tr("2 Cl", "2 Cl")]: tr("2 Cl sind zwei getrennte Atome. Verbunden schreibt man Cl₂.", "2 Cl are two separate atoms. Bonded, you write Cl₂."), "Cl₃": tr("Jedes Cl bindet nur einmal – zwei Atome reichen.", "Each Cl bonds only once – two atoms are enough.") },
    ok: tr("**Cl₂**: Cl–Cl mit je 3 freien Paaren.", "**Cl₂**: Cl–Cl with 3 lone pairs each."),
  },
  {
    ask: tr("Wie heißt **NH₃**?", "What is **NH₃** called?"), answer: tr("Ammoniak", "ammonia"), options: [tr("Ammoniak", "ammonia"), tr("Methan", "methane"), tr("Wasser", "water"), tr("Chlorwasserstoff", "hydrogen chloride")],
    visual: () => <Lewis m={known("NH3")} />,
    why: { [tr("Methan", "methane")]: tr("Methan ist CH₄.", "Methane is CH₄."), [tr("Wasser", "water")]: tr("Wasser ist H₂O.", "Water is H₂O."), [tr("Chlorwasserstoff", "hydrogen chloride")]: tr("Chlorwasserstoff ist HCl.", "Hydrogen chloride is HCl.") },
    ok: tr("NH₃ = Ammoniak.", "NH₃ = ammonia."),
  },
];

const OS: GuideStep[] = [
  {
    part: tr("Bindungen", "Bonds"),
    say: tr("Punkte = Außenelektronen. Jedes **einzelne** Elektron (mit Ring) kann eine Bindung eingehen.", "Dots = outer electrons. Every **single** electron (with a ring) can form a bond."),
    ask: tr("Wie viele Bindungen geht ein **Kohlenstoff**-Atom ein?", "How many bonds does a **carbon** atom form?"), answer: 4, num: {},
    visual: () => <Lewis m={mol([["C", 0, 0]])} />,
    tip: tr("Zähle die einzelnen Elektronen (mit Ring) – jedes ergibt eine Bindung.", "Count the single electrons (with a ring) – each gives one bond."),
    labels: [{"at": ".lone.one", "text": tr("einzelnes Elektron", "single electron")}],
    ok: tr("C: 4 Bindungen, O: 2, N: 3, H und Halogene: 1.", "C: 4 bonds, O: 2, N: 3, H and halogens: 1."),
  },
  {
    say: tr("Haben zwei verbundene Atome noch einzelne Elektronen, entsteht eine **Mehrfachbindung** – so lange, bis jedes Atom ein Oktett hat.", "If two bonded atoms still have single electrons, a **multiple bond** forms – until every atom has an octet."),
    ask: tr("Ethen (C₂H₄): Tippe auf die C–C-Bindung, um sie zu verstärken.", "Ethene (C₂H₄): tap the C–C bond to strengthen it."), answer: "bond",
    visual: c => <Lewis m={mol([["C", 1, 0], ["C", 2, 0], ["H", 0, 0], ["H", 1, 1], ["H", 3, 0], ["H", 2, 1]], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]])} c={c} tap />,
    show: tr("So geht's: tippe auf das graue Oval zwischen den beiden C-Atomen.", "How to: tap the grey oval between the two C atoms."),
    tip: tr("Die Bindung zwischen zwei Atomen ist das graue Oval.", "The bond between two atoms is the grey oval."),
    labels: [{"at": ".bond", "text": tr("Zweifachbindung", "double bond"), "side": "top", "afterSolved": true}],
    ok: tr("C=C: Zweifachbindung – beide C haben ein Oktett.", "C=C: double bond – both C have an octet."),
  },
  {
    ask: tr("Welche Bindung liegt in **HCN** zwischen C und N vor?", "Which bond is there in **HCN** between C and N?"), answer: tr("Dreifachbindung", "triple bond"), options: [tr("Einfachbindung", "single bond"), tr("Zweifachbindung", "double bond"), tr("Dreifachbindung", "triple bond")],
    visual: () => <Lewis m={mol([["H", 0, 0], ["C", 1, 0], ["N", 3, 0]], [[0, 1, 1]])} octet={false} />,
    why: { [tr("Einfachbindung", "single bond")]: tr("C hat nach H noch 3 einzelne Elektronen, N hat 3.", "After H, C still has 3 single electrons, N has 3."), [tr("Zweifachbindung", "double bond")]: tr("Dann hätten C und N noch je 1 einzelnes Elektron.", "Then C and N would each still have 1 single electron.") },
    ok: tr("H–C≡N: C hat 4 Bindungen, N hat 3 – beide haben ein Oktett.", "H–C≡N: C has 4 bonds, N has 3 – both have an octet."),
  },
  {
    part: tr("Molekülform", "Molecular shape"),
    say: tr("**EPA-Modell**: Elektronenpaare um ein Zentralatom stoßen sich ab und gehen möglichst weit auseinander. **Freie Paare zählen mit**, eine Mehrfachbindung zählt wie **ein** Paar.", "**VSEPR model**: electron pairs around a central atom repel each other and spread as far apart as possible. **Lone pairs count too**, a multiple bond counts as **one** pair."),
    ask: tr("Wie viele Elektronenpaare hat das N-Atom in **NH₃** (bindend + frei)?", "How many electron pairs does the N atom in **NH₃** have (bonding + lone)?"), answer: 4, num: {},
    visual: () => <Lewis m={known("NH3")} />,
    why: { "3": tr("Das freie Paar zählt mit.", "The lone pair counts too."), "1": tr("Zähle auch die drei bindenden Paare.", "Count the three bonding pairs too.") },
    tip: tr("Zähle bindende Paare (graue Ovale) und freie Paare zusammen.", "Add bonding pairs (grey ovals) and lone pairs."),
    labels: [{"at": ".lone.pair", "text": tr("freies Paar", "lone pair")}, {"at": ".bond", "text": tr("bindendes Paar", "bonding pair")}],
    ok: tr("4 Paare → wie ein Tetraeder angeordnet.", "4 pairs → arranged like a tetrahedron."),
  },
  {
    say: tr("4 Paare zeigen in die Ecken eines Tetraeders. Ist eine Ecke ein freies Paar, bilden die Atome eine Pyramide.", "4 pairs point to the corners of a tetrahedron. If one corner is a lone pair, the atoms form a pyramid."),
    ask: tr("Welche **Molekülgeometrie** hat NH₃?", "What is the **molecular shape** of NH₃?"), answer: tr("trigonal-pyramidal", "trigonal pyramidal"), options: [tr("trigonal-pyramidal", "trigonal pyramidal"), tr("trigonal-planar", "trigonal planar"), tr("tetraedrisch", "tetrahedral"), tr("gewinkelt", "bent")],
    why: { [tr("trigonal-planar", "trigonal planar")]: tr("Das freie Paar drückt die H-Atome nach unten – nicht flach.", "The lone pair pushes the H atoms down – not flat."), [tr("tetraedrisch", "tetrahedral")]: tr("Tetraedrisch ist die Anordnung der Paare; die Form der Atome ist eine Pyramide.", "Tetrahedral is the arrangement of the pairs; the shape of the atoms is a pyramid."), [tr("gewinkelt", "bent")]: tr("Gewinkelt sind Moleküle mit 2 Bindungen und 2 freien Paaren (H₂O).", "Bent molecules have 2 bonds and 2 lone pairs (H₂O).") },
    ok: tr("NH₃: trigonal-pyramidal, ca. 107°.", "NH₃: trigonal pyramidal, approx. 107°."),
  },
  {
    say: tr("Freie Paare brauchen mehr Platz und drücken die Bindungen zusammen: unter 109,5°.", "Lone pairs need more space and push the bonds together: below 109.5°."),
    ask: tr("Welchen **Bindungswinkel** hat Wasser (2 bindende, 2 freie Paare)?", "What is the **bond angle** in water (2 bonding, 2 lone pairs)?"), answer: tr("104,5°", "104.5°"), options: [tr("104,5°", "104.5°"), tr("109,5°", "109.5°"), "120°", "180°"],
    visual: () => <Lewis m={known("H2O")} note={FLAT} />,
    why: { [tr("109,5°", "109.5°")]: tr("109,5° ist der Tetraederwinkel. Die zwei freien Paare drücken stärker.", "109.5° is the tetrahedral angle. The two lone pairs push harder."), "120°": tr("120° gilt für 3 Paare (trigonal-planar).", "120° applies to 3 pairs (trigonal planar)."), "180°": tr("Wasser ist gewinkelt, nie linear.", "Water is bent, never linear.") },
    labels: [{"at": ".lone.pair", "text": tr("freies Paar", "lone pair")}, {"at": ".bond", "text": tr("bindendes Paar", "bonding pair")}],
    ok: tr("H₂O: gewinkelt, 104,5°.", "H₂O: bent, 104.5°."),
  },
  {
    ask: tr("Welchen Bindungswinkel hat **CO₂** (O=C=O)?", "What is the bond angle in **CO₂** (O=C=O)?"), answer: "180°", options: ["180°", "120°", tr("109,5°", "109.5°"), tr("104,5°", "104.5°")],
    visual: () => <Lewis m={known("CO2")} />,
    why: { "120°": tr("C hat keine freien Paare – nur 2 Bereiche (zwei Zweifachbindungen).", "C has no lone pairs – only 2 regions (two double bonds)."), [tr("109,5°", "109.5°")]: tr("Eine Zweifachbindung zählt wie ein Paar: nur 2 Bereiche.", "A double bond counts as one pair: only 2 regions."), [tr("104,5°", "104.5°")]: tr("Das gilt für Wasser mit 2 freien Paaren.", "That applies to water with 2 lone pairs.") },
    labels: [{"at": ".bond", "text": tr("Zweifachbindung", "double bond"), "side": "top"}],
    ok: tr("2 Bereiche → linear, 180°.", "2 regions → linear, 180°."),
  },
  {
    ask: tr("Welchen Bindungswinkel ergibt das EPA-Modell für **Methanal** (H₂C=O)?", "What bond angle does the VSEPR model give for **methanal** (H₂C=O)?"), answer: "120°", options: ["120°", tr("109,5°", "109.5°"), "180°", "90°"],
    visual: () => <Lewis m={known("CH2O")} note={FLAT} />,
    why: { [tr("109,5°", "109.5°")]: tr("C hat nur 3 Bereiche (2 × C–H, 1 × C=O).", "C has only 3 regions (2 × C–H, 1 × C=O)."), "180°": tr("Das wären nur 2 Bereiche.", "That would be only 2 regions."), "90°": tr("Die Bereiche gehen so weit wie möglich auseinander.", "The regions spread as far apart as possible.") },
    ok: tr("3 Bereiche → trigonal-planar, ca. 120°.", "3 regions → trigonal planar, approx. 120°."),
  },
  {
    part: tr("Polarität", "Polarity"),
    say: tr("Die **Elektronegativität** (EN) gibt an, wie stark ein Atom die Bindungselektronen anzieht. ΔEN ≥ 0,4: **polare** Bindung.", "**Electronegativity** (EN) tells you how strongly an atom attracts the bonding electrons. ΔEN ≥ 0.4: **polar** bond."),
    ask: tr("Welche Bindung ist **am stärksten polar**?", "Which bond is **the most polar**?"), answer: "H–F", options: ["H–F", "H–Cl", "C–H", "Cl–Cl"],
    why: { "H–Cl": tr("Polar, aber F hat die größere EN (4,0) als Cl (3,2).", "Polar, but F has a higher EN (4.0) than Cl (3.2)."), "C–H": tr("ΔEN = 2,55 − 2,20 ≈ 0,35 – unter 0,4, also unpolar.", "ΔEN = 2.55 − 2.20 ≈ 0.35 – below 0.4, so non-polar."), "Cl–Cl": tr("Gleiche Atome: ΔEN = 0, unpolar.", "Identical atoms: ΔEN = 0, non-polar.") },
    ok: tr("ΔEN(H–F) = 3,98 − 2,20 ≈ 1,8.", "ΔEN(H–F) = 3.98 − 2.20 ≈ 1.8."),
  },
  {
    ask: tr("In H–Cl: Welches Atom trägt die negative **Teilladung** δ−?", "In H–Cl: which atom carries the negative **partial charge** δ−?"), answer: "Cl", options: ["Cl", "H"],
    visual: () => <Lewis m={known("HCl")} />,
    why: { H: tr("Cl hat die größere EN – es zieht das Paar zu sich und wird δ−.", "Cl has the higher EN – it pulls the pair towards itself and becomes δ−.") },
    ok: tr("H δ+ – Cl δ−.", "H δ+ – Cl δ−."),
  },
  {
    say: tr("Ein **Molekül** ist polar, wenn sich die Teilladungen nicht aufheben. Bei symmetrischen Molekülen heben sie sich auf.", "A **molecule** is polar if the partial charges do not cancel. In symmetrical molecules they cancel."),
    ask: tr("Ist **CO₂** polar oder unpolar?", "Is **CO₂** polar or non-polar?"), answer: tr("unpolar", "non-polar"), options: ["polar", tr("unpolar", "non-polar")],
    visual: () => <Lewis m={known("CO2")} />,
    why: { polar: tr("Die C=O-Bindungen sind polar, aber CO₂ ist linear – die Dipole heben sich auf.", "The C=O bonds are polar, but CO₂ is linear – the dipoles cancel.") },
    ok: tr("CO₂: polare Bindungen, unpolares Molekül.", "CO₂: polar bonds, non-polar molecule."),
  },
  {
    ask: tr("Ist **Wasser** polar oder unpolar?", "Is **water** polar or non-polar?"), answer: "polar", options: ["polar", tr("unpolar", "non-polar")],
    visual: () => <Lewis m={known("H2O")} />,
    why: { [tr("unpolar", "non-polar")]: tr("Wasser ist gewinkelt – die Teilladungen heben sich nicht auf.", "Water is bent – the partial charges do not cancel.") },
    ok: tr("H₂O: gewinkelt, O δ−, beide H δ+ → Dipol.", "H₂O: bent, O δ−, both H δ+ → dipole."),
  },
  {
    ask: tr("Ist **Tetrachlormethan** (CCl₄) polar oder unpolar?", "Is **tetrachloromethane** (CCl₄) polar or non-polar?"), answer: tr("unpolar", "non-polar"), options: ["polar", tr("unpolar", "non-polar")],
    visual: () => <Lewis m={known("CCl4")} note={tr("Lewis-Formel flach gezeichnet – räumlich ist CCl₄ ein Tetraeder.", "Lewis formula drawn flat – in space CCl₄ is a tetrahedron.")} />,
    why: { polar: tr("Jede C–Cl-Bindung ist polar, aber der Tetraeder ist symmetrisch – sie heben sich auf.", "Each C–Cl bond is polar, but the tetrahedron is symmetrical – they cancel.") },
    ok: tr("CCl₄: symmetrischer Tetraeder → unpolar.", "CCl₄: symmetrical tetrahedron → non-polar."),
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
