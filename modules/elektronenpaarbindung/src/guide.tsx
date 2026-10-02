// Geführte Erklärung Elektronenpaarbindung: mit der Lewis-Darstellung der App (Punkte = Außenelektronen, graues Oval =
// bindendes Paar, roter Kreis = Oktett). Einmal wird die Bindung selbst angetippt (wie im Baukasten: einfach → doppelt).

import type { GuideCtx, GuideDef, GuideStep } from "@lern/ui";
import { KNOWN_BY_ID, toMolecule, type Molecule } from "@lern/chem";
import { LewisSvg } from "./components/LewisSvg.tsx";

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
const FLAT = "Lewis-Formel flach gezeichnet – die Winkel im Bild sind nicht die echten.";

const US: GuideStep[] = [
  {
    say: "Die Punkte zeigen die **Außenelektronen**. Zwei Punkte nebeneinander sind ein **Paar**, ein Punkt mit Ring ist ein **einzelnes** Elektron.",
    ask: "Wie viele **einzelne** Elektronen hat ein Sauerstoff-Atom?", answer: 2, num: {},
    visual: () => <Lewis m={mol([["O", 0, 0]])} />,
    why: { "6": "6 sind alle Außenelektronen. Zähle nur die einzelnen (mit Ring).", "4": "4 sind in den zwei Paaren. Gesucht sind die einzelnen." },
    tip: "Einzelne Elektronen haben einen Ring; Paare stehen zu zweit nebeneinander.",
    labels: [{"at": ".lone.pair", "text": "Elektronenpaar"}, {"at": ".lone.one", "text": "einzelnes Elektron"}],
    ok: "Sauerstoff: 2 Paare, 2 einzelne Elektronen.",
  },
  {
    say: "Jedes **einzelne** Elektron kann eine Bindung eingehen.",
    ask: "Wie viele Elektronenpaarbindungen geht ein **Stickstoff**-Atom ein?", answer: 3, num: {},
    visual: () => <Lewis m={mol([["N", 0, 0]])} />,
    why: { "5": "5 sind alle Außenelektronen. Binden können nur die einzelnen.", "1": "Zähle die Elektronen mit Ring." },
    tip: "Jedes einzelne Elektron (mit Ring) ergibt eine Bindung.",
    labels: [{"at": ".lone.one", "text": "einzelnes Elektron"}],
    ok: "Stickstoff hat 3 einzelne Elektronen → 3 Bindungen.",
  },
  {
    say: "Zwei einzelne Elektronen bilden ein **gemeinsames Paar** – die Bindung (graues Oval). Es gehört **beiden** Atomen.",
    ask: "Wie viele Elektronen hat jedes H-Atom im H₂-Molekül um sich?", answer: 2, num: {},
    visual: () => <Lewis m={known("H2")} />,
    why: { "1": "Das gemeinsame Paar zählt für beide Atome: 2 Elektronen." },
    tip: "Das Paar im grauen Oval gehört beiden Atomen gleichzeitig.",
    labels: [{"at": ".bond", "text": "bindendes Paar", "side": "top"}],
    ok: "Wasserstoff hat im Molekül **2** Elektronen um sich (Duett) – ✓.",
  },
  {
    say: "Andere Atome haben im Molekül meist **8** Elektronen um sich (**Oktett**, roter Kreis). Bindende Paare zählen dabei für **beide** Atome.",
    ask: "Wie viele Elektronen umgeben das O-Atom in **Wasser**?", answer: 8, num: {},
    visual: () => <Lewis m={known("H2O")} />,
    why: { "4": "Zähle auch die zwei bindenden Paare mit: 4 + 4.", "6": "6 hatte das O-Atom allein. Durch die Bindungen kommen 2 dazu." },
    tip: "Zähle alle Elektronen im roten Kreis – auch die im grauen Oval.",
    labels: [{"at": ".octet:not(.duet)", "text": "Oktett", "point": "ne", "side": "top"}, {"at": ".bond", "text": "bindendes Paar"}],
    ok: "2 freie Paare + 2 bindende Paare = 8 Elektronen.",
  },
  {
    say: "Paare, die nicht binden, heißen **freie** (nichtbindende) **Elektronenpaare**.",
    ask: "Wie viele **freie** Elektronenpaare hat das O-Atom in Wasser?", answer: 2, num: {},
    visual: () => <Lewis m={known("H2O")} />,
    why: { "4": "4 sind alle Paare. Ohne die 2 bindenden bleiben …", "8": "8 sind die Elektronen. Gefragt sind freie **Paare**." },
    tip: "Freie Paare liegen außen, nicht im grauen Oval.",
    labels: [{"at": ".lone.pair", "text": "freies Paar"}, {"at": ".bond", "text": "bindendes Paar"}],
    ok: "Wasser: O hat 2 freie und 2 bindende Paare.",
  },
  {
    say: "Haben nach einer Bindung **beide** Atome noch einzelne Elektronen, binden sie noch einmal: **Zweifachbindung**.",
    ask: "Tippe auf das graue **Bindungs-Oval**, um die Bindung zu verstärken.", answer: "bond",
    visual: c => <Lewis m={mol([["O", 0, 0], ["O", 1, 0]], [[0, 1, 1]])} c={c} tap />,
    show: "So geht's: tippe auf das graue Oval zwischen den beiden O-Atomen.",
    tip: "Die Bindung ist das graue Oval zwischen den beiden Atomen.",
    labels: [{"at": ".bond", "text": "Zweifachbindung", "side": "top", "afterSolved": true}],
    ok: "O=O: zwei gemeinsame Paare – jetzt haben beide O-Atome ein Oktett.",
  },
  {
    ask: "Stickstoff hat 3 einzelne Elektronen. Welche Bindung liegt in **N₂** vor?", answer: "Dreifachbindung",
    options: ["Einfachbindung", "Zweifachbindung", "Dreifachbindung"],
    visual: () => <Lewis m={mol([["N", 0, 0], ["N", 2, 0]])} octet={false} />,
    why: { Einfachbindung: "Dann hätte jedes N noch 2 einzelne Elektronen.", Zweifachbindung: "Dann hätte jedes N noch 1 einzelnes Elektron." },
    labels: [{"at": ".lone.one", "text": "einzelnes Elektron"}],
    ok: "N≡N: drei gemeinsame Paare.",
  },
  {
    ask: "Wie viele **freie** Elektronenpaare hat jedes N-Atom in N₂?", answer: 1, num: {},
    visual: () => <Lewis m={known("N2")} />,
    why: { "3": "3 Paare sind bindend. Frei ist das Paar außen.", "2": "Zähle nur die Paare außerhalb der Bindung." },
    tip: "Zähle nur die Paare außerhalb der grauen Ovale.",
    labels: [{"at": ".bond", "text": "Dreifachbindung", "side": "top"}],
    ok: "Jedes N: 3 bindende + 1 freies Paar = 8 Elektronen.",
  },
  {
    say: "Kohlenstoff hat 4 einzelne Elektronen – er geht **4** Bindungen ein.",
    ask: "Welche Formel hat **Methan** (C mit H)?", answer: "CH₄", options: ["CH₄", "CH₂", "CH₃", "C₄H"],
    visual: () => <Lewis m={mol([["C", 0, 0]])} />,
    why: { "CH₂": "Dann blieben 2 einzelne Elektronen übrig.", "CH₃": "Dann bliebe 1 einzelnes Elektron übrig.", "C₄H": "Ein C bindet 4 H, nicht umgekehrt." },
    labels: [{"at": ".lone.one", "text": "einzelnes Elektron"}],
    ok: "C hat 4 einzelne Elektronen → 4 Bindungen zu H: **CH₄** (Methan).",
  },
  {
    ask: "Wie viele Elektronen umgeben ein **Cl**-Atom in **CCl₄**?", answer: 8, num: {},
    visual: () => <Lewis m={known("CCl4")} />,
    why: { "6": "Das bindende Paar zählt auch für Cl: 6 + 2.", "7": "Cl hat 7 eigene, mit dem gemeinsamen Partner-Elektron sind es 8." },
    tip: "Zähle alle Elektronen im roten Kreis um ein Cl – das Paar im Oval mitzählen.",
    labels: [{"at": ".bond", "text": "bindendes Paar"}, {"at": ".lone.pair", "text": "freies Paar", "nth": -1}],
    ok: "Oktett: 3 freie Paare + 1 bindendes Paar.",
  },
  {
    say: "Elemente als Moleküle aus 2 Atomen heißen wie das Element: H₂, N₂, O₂, F₂, Cl₂.",
    ask: "Welche Formel hat **Chlor**?", answer: "Cl₂", options: ["Cl₂", "Cl", "2 Cl", "Cl₃"],
    why: { Cl: "Ein einzelnes Cl-Atom hätte kein Oktett.", "2 Cl": "2 Cl sind zwei getrennte Atome. Verbunden schreibt man Cl₂.", "Cl₃": "Jedes Cl bindet nur einmal – zwei Atome reichen." },
    ok: "**Cl₂**: Cl–Cl mit je 3 freien Paaren.",
  },
  {
    ask: "Wie heißt **NH₃**?", answer: "Ammoniak", options: ["Ammoniak", "Methan", "Wasser", "Chlorwasserstoff"],
    visual: () => <Lewis m={known("NH3")} />,
    why: { Methan: "Methan ist CH₄.", Wasser: "Wasser ist H₂O.", Chlorwasserstoff: "Chlorwasserstoff ist HCl." },
    ok: "NH₃ = Ammoniak.",
  },
];

const OS: GuideStep[] = [
  {
    say: "Punkte = Außenelektronen. Jedes **einzelne** Elektron (mit Ring) kann eine Bindung eingehen.",
    ask: "Wie viele Bindungen geht ein **Kohlenstoff**-Atom ein?", answer: 4, num: {},
    visual: () => <Lewis m={mol([["C", 0, 0]])} />,
    tip: "Zähle die einzelnen Elektronen (mit Ring) – jedes ergibt eine Bindung.",
    labels: [{"at": ".lone.one", "text": "einzelnes Elektron"}],
    ok: "C: 4 Bindungen, O: 2, N: 3, H und Halogene: 1.",
  },
  {
    say: "Haben zwei verbundene Atome noch einzelne Elektronen, entsteht eine **Mehrfachbindung** – so lange, bis jedes Atom ein Oktett hat.",
    ask: "Ethen (C₂H₄): Tippe auf die C–C-Bindung, um sie zu verstärken.", answer: "bond",
    visual: c => <Lewis m={mol([["C", 1, 0], ["C", 2, 0], ["H", 0, 0], ["H", 1, 1], ["H", 3, 0], ["H", 2, 1]], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]])} c={c} tap />,
    show: "So geht's: tippe auf das graue Oval zwischen den beiden C-Atomen.",
    tip: "Die Bindung zwischen zwei Atomen ist das graue Oval.",
    labels: [{"at": ".bond", "text": "Zweifachbindung", "side": "top", "afterSolved": true}],
    ok: "C=C: Zweifachbindung – beide C haben ein Oktett.",
  },
  {
    ask: "Welche Bindung liegt in **HCN** zwischen C und N vor?", answer: "Dreifachbindung", options: ["Einfachbindung", "Zweifachbindung", "Dreifachbindung"],
    visual: () => <Lewis m={mol([["H", 0, 0], ["C", 1, 0], ["N", 3, 0]], [[0, 1, 1]])} octet={false} />,
    why: { Einfachbindung: "C hat nach H noch 3 einzelne Elektronen, N hat 3.", Zweifachbindung: "Dann hätten C und N noch je 1 einzelnes Elektron." },
    ok: "H–C≡N: C hat 4 Bindungen, N hat 3 – beide haben ein Oktett.",
  },
  {
    say: "**EPA-Modell**: Elektronenpaare um ein Zentralatom stoßen sich ab und gehen möglichst weit auseinander. **Freie Paare zählen mit**, eine Mehrfachbindung zählt wie **ein** Paar.",
    ask: "Wie viele Elektronenpaare hat das N-Atom in **NH₃** (bindend + frei)?", answer: 4, num: {},
    visual: () => <Lewis m={known("NH3")} />,
    why: { "3": "Das freie Paar zählt mit.", "1": "Zähle auch die drei bindenden Paare." },
    tip: "Zähle bindende Paare (graue Ovale) und freie Paare zusammen.",
    labels: [{"at": ".lone.pair", "text": "freies Paar"}, {"at": ".bond", "text": "bindendes Paar"}],
    ok: "4 Paare → wie ein Tetraeder angeordnet.",
  },
  {
    say: "4 Paare zeigen in die Ecken eines Tetraeders. Ist eine Ecke ein freies Paar, bilden die Atome eine Pyramide.",
    ask: "Welche **Molekülgeometrie** hat NH₃?", answer: "trigonal-pyramidal", options: ["trigonal-pyramidal", "trigonal-planar", "tetraedrisch", "gewinkelt"],
    why: { "trigonal-planar": "Das freie Paar drückt die H-Atome nach unten – nicht flach.", tetraedrisch: "Tetraedrisch ist die Anordnung der Paare; die Form der Atome ist eine Pyramide.", gewinkelt: "Gewinkelt sind Moleküle mit 2 Bindungen und 2 freien Paaren (H₂O)." },
    ok: "NH₃: trigonal-pyramidal, ca. 107°.",
  },
  {
    say: "Freie Paare brauchen mehr Platz und drücken die Bindungen zusammen: unter 109,5°.",
    ask: "Welchen **Bindungswinkel** hat Wasser (2 bindende, 2 freie Paare)?", answer: "104,5°", options: ["104,5°", "109,5°", "120°", "180°"],
    visual: () => <Lewis m={known("H2O")} note={FLAT} />,
    why: { "109,5°": "109,5° ist der Tetraederwinkel. Die zwei freien Paare drücken stärker.", "120°": "120° gilt für 3 Paare (trigonal-planar).", "180°": "Wasser ist gewinkelt, nie linear." },
    labels: [{"at": ".lone.pair", "text": "freies Paar"}, {"at": ".bond", "text": "bindendes Paar"}],
    ok: "H₂O: gewinkelt, 104,5°.",
  },
  {
    ask: "Welchen Bindungswinkel hat **CO₂** (O=C=O)?", answer: "180°", options: ["180°", "120°", "109,5°", "104,5°"],
    visual: () => <Lewis m={known("CO2")} />,
    why: { "120°": "C hat keine freien Paare – nur 2 Bereiche (zwei Zweifachbindungen).", "109,5°": "Eine Zweifachbindung zählt wie ein Paar: nur 2 Bereiche.", "104,5°": "Das gilt für Wasser mit 2 freien Paaren." },
    labels: [{"at": ".bond", "text": "Zweifachbindung", "side": "top"}],
    ok: "2 Bereiche → linear, 180°.",
  },
  {
    ask: "Welchen Bindungswinkel ergibt das EPA-Modell für **Methanal** (H₂C=O)?", answer: "120°", options: ["120°", "109,5°", "180°", "90°"],
    visual: () => <Lewis m={known("CH2O")} note={FLAT} />,
    why: { "109,5°": "C hat nur 3 Bereiche (2 × C–H, 1 × C=O).", "180°": "Das wären nur 2 Bereiche.", "90°": "Die Bereiche gehen so weit wie möglich auseinander." },
    ok: "3 Bereiche → trigonal-planar, ca. 120°.",
  },
  {
    say: "Die **Elektronegativität** (EN) gibt an, wie stark ein Atom die Bindungselektronen anzieht. ΔEN ≥ 0,4: **polare** Bindung.",
    ask: "Welche Bindung ist **am stärksten polar**?", answer: "H–F", options: ["H–F", "H–Cl", "C–H", "Cl–Cl"],
    why: { "H–Cl": "Polar, aber F hat die größere EN (4,0) als Cl (3,2).", "C–H": "ΔEN = 2,55 − 2,20 ≈ 0,35 – unter 0,4, also unpolar.", "Cl–Cl": "Gleiche Atome: ΔEN = 0, unpolar." },
    ok: "ΔEN(H–F) = 3,98 − 2,20 ≈ 1,8.",
  },
  {
    ask: "In H–Cl: Welches Atom trägt die negative **Teilladung** δ−?", answer: "Cl", options: ["Cl", "H"],
    visual: () => <Lewis m={known("HCl")} />,
    why: { H: "Cl hat die größere EN – es zieht das Paar zu sich und wird δ−." },
    ok: "H δ+ – Cl δ−.",
  },
  {
    say: "Ein **Molekül** ist polar, wenn sich die Teilladungen nicht aufheben. Bei symmetrischen Molekülen heben sie sich auf.",
    ask: "Ist **CO₂** polar oder unpolar?", answer: "unpolar", options: ["polar", "unpolar"],
    visual: () => <Lewis m={known("CO2")} />,
    why: { polar: "Die C=O-Bindungen sind polar, aber CO₂ ist linear – die Dipole heben sich auf." },
    ok: "CO₂: polare Bindungen, unpolares Molekül.",
  },
  {
    ask: "Ist **Wasser** polar oder unpolar?", answer: "polar", options: ["polar", "unpolar"],
    visual: () => <Lewis m={known("H2O")} />,
    why: { unpolar: "Wasser ist gewinkelt – die Teilladungen heben sich nicht auf." },
    ok: "H₂O: gewinkelt, O δ−, beide H δ+ → Dipol.",
  },
  {
    ask: "Ist **Tetrachlormethan** (CCl₄) polar oder unpolar?", answer: "unpolar", options: ["polar", "unpolar"],
    visual: () => <Lewis m={known("CCl4")} note="Lewis-Formel flach gezeichnet – räumlich ist CCl₄ ein Tetraeder." />,
    why: { polar: "Jede C–Cl-Bindung ist polar, aber der Tetraeder ist symmetrisch – sie heben sich auf." },
    ok: "CCl₄: symmetrischer Tetraeder → unpolar.",
  },
];

export function guideFor(stufe: "us" | "os"): GuideDef {
  return stufe === "us"
    ? { title: "Elektronenpaarbindung", steps: US, outro: [
      "Einzelne Außenelektronen = mögliche Bindungen: H 1, O 2, N 3, C 4.",
      "Ein gemeinsames Paar = eine Bindung; es zählt für **beide** Atome.",
      "Im Molekül **Oktett** (8), bei H **Duett** (2). Freie Paare zählen mit.",
      "Zweifach- und Dreifachbindung, wenn noch einzelne Elektronen übrig sind (O₂, N₂).",
      "Formeln und Namen: H₂O, NH₃, CH₄, CCl₄, Cl₂ …",
    ] }
    : { title: "Elektronenpaarbindung", steps: OS, outro: [
      "Mehrfachbindungen bauen: Ethen C=C, Blausäure C≡N.",
      "**EPA-Modell**: Paare (auch freie) gehen auseinander; Mehrfachbindung = ein Bereich.",
      "Formen und Winkel: tetraedrisch 109,5°, pyramidal 107°, gewinkelt 104,5°, planar 120°, linear 180°.",
      "ΔEN ≥ 0,4: polare Bindung (δ+/δ−); Molekül polar, wenn sich die Dipole nicht aufheben.",
    ] };
}
