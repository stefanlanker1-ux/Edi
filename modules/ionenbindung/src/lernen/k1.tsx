// Kapitel 1: Vom Atom zum Ion (Level I) – Außenelektronen und Edelgase, Metall-Atome werden Kationen, Nichtmetall-Atome werden Anionen,
// Elektronenübergang als Modell der Ionenbildung. Hauptmodell: Bohrmodell der Unterstufe (Elektronen antippen, abgeben, aufnehmen, übertragen).

import { tr } from "@lern/i18n";
import type { GuideStep } from "@lern/ui";
import type { Kapitel } from "./types.ts";
import { model as asModel } from "./model.tsx";
import { ChargeCalc, IonBuilder, MarkOuter, PseIons, Row, Transfer } from "./k1/models.tsx";
import "./k1/k1.css";

/** Modell-Folie; nach vier Fehlversuchen steht die Lösung im Modell – selbst prüfen */
const model = (s: GuideStep): GuideStep => asModel(s.mode === "worked" ? s : {
  show: tr("Die Lösung steht jetzt im Modell. Sieh sie dir an und tippe auf „Prüfen“.", "The solution is now in the model. Look at it and tap “Check”."), ...s,
});

const steps = (): GuideStep[] => [
  // ── 1 Außenelektronen und Edelgase ──
  model({
    mode: "worked", part: tr("Außenelektronen und Edelgase", "Outer electrons and noble gases"),
    say: tr("**Edelgase** wie Helium, Neon und Argon stehen in der VIII. Hauptgruppe. Sie reagieren fast nie.", "**Noble gases** such as helium, neon and argon are in main group VIII. They hardly ever react."),
    ask: tr("Wie viele Elektronen sitzen auf ihrer äußersten Schale?", "How many electrons sit on their outermost shell?"),
    visual: () => <Row items={[{ Z: 2, E: 2, title: tr("Helium", "Helium") }, { Z: 10, E: 10, title: tr("Neon", "Neon") }, { Z: 18, E: 18, title: tr("Argon", "Argon") }]} />,
    lines: [
      tr("Helium He: 2 Elektronen – die K-Schale ist damit voll.", "Helium He: 2 electrons – the K shell is full."),
      tr("Neon Ne: 2 · 8 – außen 8.", "Neon Ne: 2 · 8 – 8 on the outside."),
      tr("Argon Ar: 2 · 8 · 8 – außen 8.", "Argon Ar: 2 · 8 · 8 – 8 on the outside."),
    ],
    ok: tr("Edelgase haben eine volle Außenschale: Helium 2, die anderen 8. Das ist die **Edelgaskonfiguration**.", "Noble gases have a full outer shell: helium 2, the others 8. This is the **noble gas configuration**."),
  }),
  model({
    mode: "faded",
    say: tr("**Außenelektronen** sitzen auf der äußersten Schale. Ihre Zahl ist die Nummer der Hauptgruppe.", "**Outer electrons** sit on the outermost shell. Their number is the number of the main group."),
    ask: tr("Tippe alle Außenelektronen von Sauerstoff O an. Dann prüfe.", "Tap all outer electrons of oxygen O. Then check."),
    answer: "6",
    lines: [tr("Sauerstoff O: 8 Elektronen, Schalen 2 · 6.", "Oxygen O: 8 electrons, shells 2 · 6."), tr("Außenelektronen: {?}", "Outer electrons: {?}")],
    why: {
      innen: tr("Ein markiertes Elektron sitzt auf der inneren K-Schale. Markiere nur den äußersten Ring.", "A marked electron is on the inner K shell. Mark only the outermost ring."),
      "0": tr("Du hast noch nichts markiert. Tippe die Elektronen auf dem äußersten Ring an.", "You have not marked anything yet. Tap the electrons on the outermost ring."),
    },
    tip: tr("Außenelektronen liegen nur auf dem äußersten Ring. Zähle beim Antippen mit.", "Outer electrons lie only on the outermost ring. Count while you tap."),
    ok: tr("Sauerstoff hat 6 Außenelektronen – er steht in der VI. Hauptgruppe.", "Oxygen has 6 outer electrons – it is in main group VI."),
    visual: c => <MarkOuter c={c} Z={8} />,
  }),
  model({
    mode: "free",
    ask: tr("Jetzt du: Markiere die Außenelektronen von Aluminium Al.", "Your turn: mark the outer electrons of aluminium Al."),
    answer: "3",
    why: {
      innen: tr("Ein markiertes Elektron sitzt auf einer inneren Schale. Aluminium hat 3 Schalen – nur die äußerste zählt.", "A marked electron is on an inner shell. Aluminium has 3 shells – only the outermost counts."),
      "0": tr("Du hast noch nichts markiert.", "You have not marked anything yet."),
    },
    tip: tr("Suche den äußersten Ring und tippe jedes Elektron darauf einmal an.", "Find the outermost ring and tap each electron on it once."),
    lines: [tr("Aluminium Al: 2 · 8 · 3 → 3 Außenelektronen, III. Hauptgruppe.", "Aluminium Al: 2 · 8 · 3 → 3 outer electrons, main group III.")],
    ok: tr("Genau: 3 Außenelektronen auf der M-Schale.", "Exactly: 3 outer electrons on the M shell."),
    visual: c => <MarkOuter c={c} Z={13} />,
  }),
  model({
    mode: "worked",
    say: tr("Zur Edelgaskonfiguration führen zwei Wege: Elektronen **abgeben** oder Elektronen **aufnehmen**.", "Two ways lead to the noble gas configuration: **losing** electrons or **gaining** electrons."),
    ask: tr("Welcher Weg ist bei Natrium Na (2 · 8 · 1) kürzer?", "Which way is shorter for sodium Na (2 · 8 · 1)?"),
    visual: () => <Row items={[{ Z: 10, E: 10, title: tr("Neon", "Neon") }, { Z: 11, E: 11, title: tr("Natrium", "Sodium") }, { Z: 18, E: 18, title: tr("Argon", "Argon") }]}
      arrows={["← −1 e⁻", "+7 e⁻ →"]} />,
    lines: [
      tr("1 Elektron abgeben → 2 · 8 wie Neon.", "Lose 1 electron → 2 · 8 like neon."),
      tr("7 Elektronen aufnehmen → 2 · 8 · 8 wie Argon.", "Gain 7 electrons → 2 · 8 · 8 like argon."),
      tr("Im Modell gilt der kürzere Weg: Natrium gibt 1 Elektron ab.", "In the model the shorter way applies: sodium loses 1 electron."),
    ],
    ok: tr("Atome mit 1 bis 3 Außenelektronen geben sie ab. Atome mit 5 bis 7 nehmen Elektronen auf, bis außen 8 sind.", "Atoms with 1 to 3 outer electrons lose them. Atoms with 5 to 7 gain electrons until there are 8 on the outside."),
  }),
  {
    mode: "faded",
    ask: tr("Chlor Cl hat 7 Außenelektronen (2 · 8 · 7). Ergänze den kürzeren Weg.", "Chlorine Cl has 7 outer electrons (2 · 8 · 7). Complete the shorter way."),
    visual: () => <Row items={[{ Z: 17, E: 17, title: tr("Chlor", "Chlorine"), slots: true }]} />,
    lines: [tr("Abgeben: 7 Elektronen → 2 · 8 wie Neon.", "Lose: 7 electrons → 2 · 8 like neon."), tr("Aufnehmen: {?} → 2 · 8 · 8 wie Argon.", "Gain: {?} → 2 · 8 · 8 like argon.")],
    answer: tr("1 Elektron", "1 electron"),
    options: [tr("7 Elektronen", "7 electrons"), tr("1 Elektron", "1 electron"), tr("8 Elektronen", "8 electrons")],
    why: {
      [tr("7 Elektronen", "7 electrons")]: tr("7 Elektronen hat Chlor schon außen. Bis 8 fehlt nur eines.", "Chlorine already has 7 on the outside. Only one is missing to make 8."),
      [tr("8 Elektronen", "8 electrons")]: tr("Es kommen nur so viele dazu, bis außen 8 sind: 8 − 7.", "Only as many are added as needed for 8 on the outside: 8 − 7."),
    },
    ok: tr("Chlor nimmt 1 Elektron auf: 7 + 1 = 8 außen wie Argon.", "Chlorine gains 1 electron: 7 + 1 = 8 on the outside like argon."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Was beschreibt das Modell für Magnesium Mg (2 · 8 · 2)?", "Your turn: what does the model describe for magnesium Mg (2 · 8 · 2)?"),
    visual: () => <Row items={[{ Z: 12, E: 12, title: tr("Magnesium", "Magnesium") }]} />,
    answer: tr("2 Elektronen abgeben", "lose 2 electrons"),
    options: [tr("6 Elektronen aufnehmen", "gain 6 electrons"), tr("2 Elektronen aufnehmen", "gain 2 electrons"), tr("2 Elektronen abgeben", "lose 2 electrons")],
    why: {
      [tr("6 Elektronen aufnehmen", "gain 6 electrons")]: tr("Das wären 6 Elektronen. Abgeben sind nur 2 – der kürzere Weg.", "That would be 6 electrons. Losing is only 2 – the shorter way."),
      [tr("2 Elektronen aufnehmen", "gain 2 electrons")]: tr("Dann hätte Magnesium außen 4 – keine volle Schale.", "Then magnesium would have 4 on the outside – not a full shell."),
    },
    ok: tr("Magnesium gibt 2 Elektronen ab → 2 · 8 wie Neon.", "Magnesium loses 2 electrons → 2 · 8 like neon."),
  },

  // ── 2 Metall-Atome werden Kationen ──
  model({
    mode: "worked", part: tr("Metall-Atome werden Kationen", "Metal atoms become cations"),
    say: tr("Natrium, Magnesium und Aluminium sind **Metalle**. Ihre Atome geben die Außenelektronen ab.", "Sodium, magnesium and aluminium are **metals**. Their atoms lose their outer electrons."),
    ask: tr("Was passiert, wenn Natrium sein Außenelektron abgibt?", "What happens when sodium loses its outer electron?"),
    visual: c => <IonBuilder c={c} Z={11} solution={10} />,
    lines: [
      tr("Natrium-Atom: 11 p⁺ · 11 e⁻ → neutral.", "Sodium atom: 11 p⁺ · 11 e⁻ → neutral."),
      tr("1 Elektron weg: 11 p⁺ · 10 e⁻ → Ladung 1+, das Ion **Na⁺**.", "1 electron gone: 11 p⁺ · 10 e⁻ → charge 1+, the ion **Na⁺**."),
      tr("Na⁺ hat 2 · 8 wie Neon. Die M-Schale ist leer – Na⁺ ist kleiner als das Atom.", "Na⁺ has 2 · 8 like neon. The M shell is empty – Na⁺ is smaller than the atom."),
    ],
    ok: tr("**Ladung = Protonen − Elektronen** = 11 − 10 = 1+. Positive Ionen heißen **Kationen**.", "**Charge = protons − electrons** = 11 − 10 = 1+. Positive ions are called **cations**."),
  }),
  model({
    mode: "faded",
    ask: tr("Tippe Außenelektronen von Magnesium an, bis es Edelgaskonfiguration hat. Dann prüfe.", "Tap outer electrons of magnesium until it has a noble gas configuration. Then check."),
    answer: "Mg²⁺",
    lines: [tr("Magnesium: 2 · 8 · 2, II. Hauptgruppe.", "Magnesium: 2 · 8 · 2, main group II."), tr("12 p⁺ · 10 e⁻ → {?}", "12 p⁺ · 10 e⁻ → {?}")],
    why: {
      Mg: tr("Magnesium ist noch neutral. Gib seine Außenelektronen ab.", "Magnesium is still neutral. Make it lose its outer electrons."),
      "Mg⁺": tr("Ein Außenelektron ist noch da. Außen sind so keine 8.", "One outer electron is still there. So there are not 8 on the outside."),
      "Mg³⁺": tr("Jetzt fehlt auch ein Elektron der vollen L-Schale. Gib nur die 2 Außenelektronen ab.", "Now an electron of the full L shell is missing too. Lose only the 2 outer electrons."),
      "Mg⁻": tr("Aufnehmen führt hier nicht zum Ziel: 6 fehlen bis 8. Abgeben sind nur 2.", "Gaining does not work here: 6 are missing to 8. Losing is only 2."),
      "Mg²⁻": tr("Du hast 2 Elektronen aufgenommen: 2 · 8 · 4 ist keine volle Schale.", "You gained 2 electrons: 2 · 8 · 4 is not a full shell."),
    },
    tip: tr("Zähle die Elektronen auf dem äußersten Ring – so viele gibt Magnesium ab.", "Count the electrons on the outermost ring – that is how many magnesium loses."),
    ok: tr("Mg gibt 2 Außenelektronen ab: 12 − 10 = 2+ → **Mg²⁺**, 2 · 8 wie Neon.", "Mg loses 2 outer electrons: 12 − 10 = 2+ → **Mg²⁺**, 2 · 8 like neon."),
    visual: c => <IonBuilder c={c} Z={12} solution={10} />,
  }),
  model({
    mode: "free",
    ask: tr("Jetzt du: Mache aus Aluminium Al ein Ion mit Edelgaskonfiguration. Dann prüfe.", "Your turn: turn aluminium Al into an ion with a noble gas configuration. Then check."),
    answer: "Al³⁺",
    why: {
      Al: tr("Aluminium ist noch neutral: 13 p⁺ · 13 e⁻.", "Aluminium is still neutral: 13 p⁺ · 13 e⁻."),
      "Al⁺": tr("Noch 2 Außenelektronen übrig – außen sind keine 8.", "2 outer electrons are left – there are not 8 on the outside."),
      "Al²⁺": tr("Noch 1 Außenelektron übrig – außen sind keine 8.", "1 outer electron is left – there are not 8 on the outside."),
      "Al⁴⁺": tr("Eins zu viel: Jetzt fehlt ein Elektron der vollen L-Schale.", "One too many: now an electron of the full L shell is missing."),
      "Al⁻": tr("Aluminium ist ein Metall. Seine Atome geben die Außenelektronen ab.", "Aluminium is a metal. Its atoms lose their outer electrons."),
    },
    tip: tr("Gib genau so viele Elektronen ab, wie auf dem äußersten Ring sitzen.", "Lose exactly as many electrons as sit on the outermost ring."),
    lines: [tr("13 p⁺ · 10 e⁻ → 13 − 10 = 3+.", "13 p⁺ · 10 e⁻ → 13 − 10 = 3+.")],
    ok: tr("Aluminium gibt 3 Außenelektronen ab → **Al³⁺** mit 2 · 8 wie Neon.", "Aluminium loses 3 outer electrons → **Al³⁺** with 2 · 8 like neon."),
    visual: c => <IonBuilder c={c} Z={13} solution={10} />,
  }),
  model({
    mode: "free",
    say: tr("Die Protonen bestimmen das Element, die Elektronen die Ladung.", "The protons decide the element, the electrons decide the charge."),
    ask: tr("Baue das Kalium-Ion K⁺: Stelle Protonen und Elektronen ein. Dann prüfe.", "Build the potassium ion K⁺: set protons and electrons. Then check."),
    answer: "K⁺",
    why: {
      K: tr("Das ist das neutrale Kalium-Atom. K⁺ hat 1 Elektron weniger als Protonen.", "That is the neutral potassium atom. K⁺ has 1 electron fewer than protons."),
      "K⁻": tr("1 Elektron mehr ergibt 1−. K⁺ hat 1 Elektron weniger.", "1 extra electron gives 1−. K⁺ has 1 electron fewer."),
      "Na⁺": tr("11 Protonen sind Natrium. Kalium hat die Ordnungszahl 19.", "11 protons are sodium. Potassium has atomic number 19."),
      Ar: tr("18 Elektronen stimmen, aber 18 Protonen sind Argon. Kalium hat 19.", "18 electrons are right, but 18 protons are argon. Potassium has 19."),
      "K²⁺": tr("2+ wären 2 Elektronen weniger. Kalium (I. Hauptgruppe) gibt nur 1 ab.", "2+ would be 2 electrons fewer. Potassium (main group I) loses only 1."),
    },
    tip: tr("Suche Kalium im PSE: Ordnungszahl = Protonen. Ladung = Protonen − Elektronen.", "Find potassium in the periodic table: atomic number = protons. Charge = protons − electrons."),
    lines: [tr("19 p⁺ · 18 e⁻ → 19 − 18 = 1+, Schalen 2 · 8 · 8 wie Argon.", "19 p⁺ · 18 e⁻ → 19 − 18 = 1+, shells 2 · 8 · 8 like argon.")],
    ok: tr("K⁺: 19 Protonen, 18 Elektronen. Kalium gibt 1 Außenelektron ab.", "K⁺: 19 protons, 18 electrons. Potassium loses 1 outer electron."),
    visual: c => <ChargeCalc c={c} start={[11, 11]} solution={[19, 18]} />,
  }),
  {
    mode: "free",
    ask: tr("Vergleiche im gleichen Maßstab: Welches Teilchen ist kleiner?", "Compare at the same scale: which particle is smaller?"),
    visual: () => <Row items={[{ Z: 11, E: 11, title: tr("Natrium-Atom", "Sodium atom") }, { Z: 11, E: 10, title: tr("Natrium-Ion", "Sodium ion") }]} />,
    answer: "Na⁺",
    options: ["Na", tr("beide gleich", "both the same"), "Na⁺"],
    why: {
      Na: tr("Das Atom hat 3 Schalen. Na⁺ hat nur noch 2 – die M-Schale ist leer.", "The atom has 3 shells. Na⁺ has only 2 left – the M shell is empty."),
      [tr("beide gleich", "both the same")]: tr("Beim Abgeben wird die äußerste Schale leer. Vergleiche die Ringe.", "When losing, the outermost shell becomes empty. Compare the rings."),
    },
    ok: tr("Ein Kation ist kleiner als sein Atom: Na⁺ hat eine Schale weniger.", "A cation is smaller than its atom: Na⁺ has one shell fewer."),
  },
  model({
    mode: "free",
    ask: tr("Jetzt du: Calcium Ca steht in der II. Hauptgruppe. Bilde sein Ion. Dann prüfe.", "Your turn: calcium Ca is in main group II. Form its ion. Then check."),
    answer: "Ca²⁺",
    why: {
      Ca: tr("Calcium ist noch neutral: 20 p⁺ · 20 e⁻.", "Calcium is still neutral: 20 p⁺ · 20 e⁻."),
      "Ca⁺": tr("Ein Außenelektron ist noch auf der N-Schale.", "One outer electron is still on the N shell."),
      "Ca³⁺": tr("Eins zu viel: Jetzt fehlt ein Elektron der vollen M-Schale.", "One too many: now an electron of the full M shell is missing."),
      "Ca⁻": tr("Calcium ist ein Metall. Seine Atome geben Elektronen ab.", "Calcium is a metal. Its atoms lose electrons."),
      "Ca²⁻": tr("Aufnehmen gibt 2 · 8 · 8 · 4 – keine volle Schale.", "Gaining gives 2 · 8 · 8 · 4 – not a full shell."),
    },
    tip: tr("II. Hauptgruppe: Wie viele Elektronen sitzen auf dem äußersten Ring?", "Main group II: how many electrons sit on the outermost ring?"),
    lines: [tr("20 p⁺ · 18 e⁻ → 20 − 18 = 2+.", "20 p⁺ · 18 e⁻ → 20 − 18 = 2+.")],
    ok: tr("Calcium gibt 2 Elektronen ab → **Ca²⁺** mit 2 · 8 · 8 wie Argon. Ladung = Hauptgruppe.", "Calcium loses 2 electrons → **Ca²⁺** with 2 · 8 · 8 like argon. Charge = main group."),
    visual: c => <IonBuilder c={c} Z={20} solution={18} />,
  }),

  // ── 3 Nichtmetall-Atome werden Anionen ──
  model({
    mode: "worked", part: tr("Nichtmetall-Atome werden Anionen", "Non-metal atoms become anions"),
    say: tr("Chlor, Sauerstoff und Stickstoff sind **Nichtmetalle**. Ihre Atome nehmen Elektronen auf, bis außen 8 sind.", "Chlorine, oxygen and nitrogen are **non-metals**. Their atoms gain electrons until there are 8 on the outside."),
    ask: tr("Was passiert, wenn Chlor ein Elektron aufnimmt?", "What happens when chlorine gains an electron?"),
    visual: c => <IonBuilder c={c} Z={17} solution={18} />,
    lines: [
      tr("Chlor-Atom: 2 · 8 · 7 – ein Platz außen ist frei.", "Chlorine atom: 2 · 8 · 7 – one place on the outside is free."),
      tr("1 Elektron dazu: 17 p⁺ · 18 e⁻ → 17 − 18 = 1−.", "1 electron added: 17 p⁺ · 18 e⁻ → 17 − 18 = 1−."),
      tr("**Cl⁻** hat 2 · 8 · 8 wie Argon.", "**Cl⁻** has 2 · 8 · 8 like argon."),
      tr("Modell: Mehr Elektronen stoßen sich ab. Die Außenschale von Cl⁻ liegt weiter außen als beim Atom (gestrichelt).", "Model: more electrons repel each other. The outer shell of Cl⁻ lies further out than in the atom (dashed)."),
    ],
    ok: tr("Negative Ionen heißen **Anionen**. Das aufgenommene Elektron hat im Bild einen Ring.", "Negative ions are called **anions**. The gained electron has a ring in the picture."),
  }),
  model({
    mode: "faded",
    ask: tr("Tippe freie Plätze von Sauerstoff an, bis außen 8 sind. Dann prüfe.", "Tap free places of oxygen until there are 8 on the outside. Then check."),
    answer: "O²⁻",
    lines: [tr("Sauerstoff: 2 · 6, VI. Hauptgruppe.", "Oxygen: 2 · 6, main group VI."), tr("8 p⁺ · 10 e⁻ → {?}", "8 p⁺ · 10 e⁻ → {?}")],
    why: {
      O: tr("Sauerstoff ist noch neutral. Fülle die freien Plätze außen.", "Oxygen is still neutral. Fill the free places on the outside."),
      "O⁻": tr("Ein Platz außen ist noch frei: 7 sind keine 8.", "One place on the outside is still free: 7 is not 8."),
      "O²⁺": tr("Du hast abgegeben statt aufgenommen. Nichtmetall-Atome nehmen Elektronen auf.", "You lost electrons instead of gaining them. Non-metal atoms gain electrons."),
      "O⁶⁺": tr("6 abgeben wäre der lange Weg. Aufnehmen sind nur 2.", "Losing 6 would be the long way. Gaining is only 2."),
    },
    tip: tr("Zähle die gestrichelten freien Plätze auf dem äußersten Ring.", "Count the dashed free places on the outermost ring."),
    ok: tr("Sauerstoff nimmt 2 Elektronen auf: 8 − 10 = 2− → **O²⁻**, 2 · 8 wie Neon.", "Oxygen gains 2 electrons: 8 − 10 = 2− → **O²⁻**, 2 · 8 like neon."),
    visual: c => <IonBuilder c={c} Z={8} solution={10} />,
  }),
  model({
    mode: "free",
    ask: tr("Jetzt du: Bilde das Ion von Stickstoff N (V. Hauptgruppe). Dann prüfe.", "Your turn: form the ion of nitrogen N (main group V). Then check."),
    answer: "N³⁻",
    why: {
      N: tr("Stickstoff ist noch neutral: 7 p⁺ · 7 e⁻.", "Nitrogen is still neutral: 7 p⁺ · 7 e⁻."),
      "N⁻": tr("Noch 2 Plätze außen frei.", "2 places on the outside are still free."),
      "N²⁻": tr("Noch 1 Platz außen frei.", "1 place on the outside is still free."),
      "N⁵⁺": tr("5 abgeben ist der lange Weg. Aufnehmen sind nur 3.", "Losing 5 is the long way. Gaining is only 3."),
      "N⁺": tr("Nichtmetall-Atome nehmen Elektronen auf und werden negativ.", "Non-metal atoms gain electrons and become negative."),
    },
    tip: tr("Bis 8 außen: Wie viele Plätze sind auf dem äußersten Ring frei?", "Up to 8 on the outside: how many places on the outermost ring are free?"),
    lines: [tr("5 + 3 = 8 außen; 7 p⁺ · 10 e⁻ → 7 − 10 = 3−.", "5 + 3 = 8 on the outside; 7 p⁺ · 10 e⁻ → 7 − 10 = 3−.")],
    ok: tr("Stickstoff nimmt 3 Elektronen auf → **N³⁻** mit 2 · 8 wie Neon.", "Nitrogen gains 3 electrons → **N³⁻** with 2 · 8 like neon."),
    visual: c => <IonBuilder c={c} Z={7} solution={10} />,
  }),
  model({
    mode: "free",
    say: tr("Ladung eines Anions = 8 − Hauptgruppe, negativ.", "Charge of an anion = 8 − main group, negative."),
    ask: tr("Tippe im PSE alle Elemente an, die Ionen mit der Ladung 2− bilden. Dann prüfe.", "Tap all elements in the periodic table that form ions with charge 2−. Then check."),
    answer: "O S",
    why: {
      O: tr("Sauerstoff stimmt. Ein zweites Element steht in derselben Hauptgruppe.", "Oxygen is right. A second element is in the same main group."),
      S: tr("Schwefel stimmt. Ein zweites Element steht in derselben Hauptgruppe.", "Sulfur is right. A second element is in the same main group."),
      "Mg Ca": tr("Magnesium und Calcium bilden 2+-Ionen – sie geben 2 Elektronen ab.", "Magnesium and calcium form 2+ ions – they lose 2 electrons."),
      "Be Mg Ca": tr("Die II. Hauptgruppe gibt 2 Elektronen ab: 2+, nicht 2−.", "Main group II loses 2 electrons: 2+, not 2−."),
      "–": tr("Du hast noch nichts angetippt.", "You have not tapped anything yet."),
    },
    tip: tr("2− heißt: 2 Elektronen aufgenommen. Wie viele Außenelektronen hatte das Atom dann?", "2− means: 2 electrons gained. How many outer electrons did the atom have then?"),
    lines: [tr("VI. Hauptgruppe: 6 + 2 = 8 → O²⁻ und S²⁻.", "Main group VI: 6 + 2 = 8 → O²⁻ and S²⁻.")],
    ok: tr("Sauerstoff und Schwefel (VI. Hauptgruppe) bilden O²⁻ und S²⁻.", "Oxygen and sulfur (main group VI) form O²⁻ and S²⁻."),
    visual: c => <PseIons c={c} answer={[8, 16]} />,
  }),
  {
    mode: "free",
    ask: tr("Welches Atom bildet hier kein Ion?", "Which atom forms no ion here?"),
    visual: () => <Row items={[{ Z: 16, E: 16 }, { Z: 9, E: 9 }, { Z: 18, E: 18 }, { Z: 13, E: 13 }]} />,
    answer: "Ar (VIII)",
    options: ["S (VI)", "F (VII)", "Ar (VIII)", "Al (III)"],
    why: {
      "S (VI)": tr("Schwefel nimmt 2 Elektronen auf → S²⁻.", "Sulfur gains 2 electrons → S²⁻."),
      "F (VII)": tr("Fluor nimmt 1 Elektron auf → F⁻.", "Fluorine gains 1 electron → F⁻."),
      "Al (III)": tr("Aluminium gibt 3 Elektronen ab → Al³⁺.", "Aluminium loses 3 electrons → Al³⁺."),
    },
    ok: tr("Argon hat schon 8 außen. Edelgase und die IV. Hauptgruppe (4 Außenelektronen) bilden hier keine Ionen.", "Argon already has 8 on the outside. Noble gases and main group IV (4 outer electrons) form no ions here."),
  },
  model({
    mode: "free",
    ask: tr("Baue das Ion S²⁻ von Schwefel: Stelle Protonen und Elektronen ein. Dann prüfe.", "Build the sulfur ion S²⁻: set protons and electrons. Then check."),
    answer: "S²⁻",
    why: {
      S: tr("Das ist das neutrale Schwefel-Atom: 16 p⁺ · 16 e⁻.", "That is the neutral sulfur atom: 16 p⁺ · 16 e⁻."),
      "S²⁺": tr("2+ wären 2 Elektronen weniger. S²⁻ hat 2 mehr als Protonen.", "2+ would be 2 electrons fewer. S²⁻ has 2 more than protons."),
      "S⁻": tr("1− ist erst 1 Elektron mehr. S²⁻ hat 2 mehr.", "1− is only 1 extra electron. S²⁻ has 2 more."),
      Ar: tr("18 Elektronen stimmen, aber 18 Protonen sind Argon. Schwefel hat 16.", "18 electrons are right, but 18 protons are argon. Sulfur has 16."),
      "Cl⁻": tr("17 Protonen sind Chlor. Schwefel hat die Ordnungszahl 16.", "17 protons are chlorine. Sulfur has atomic number 16."),
    },
    tip: tr("Protonen = Ordnungszahl von Schwefel. Für 2− braucht man 2 Elektronen mehr als Protonen.", "Protons = atomic number of sulfur. For 2− you need 2 more electrons than protons."),
    lines: [tr("16 p⁺ · 18 e⁻ → 16 − 18 = 2−, Schalen 2 · 8 · 8 wie Argon.", "16 p⁺ · 18 e⁻ → 16 − 18 = 2−, shells 2 · 8 · 8 like argon.")],
    ok: tr("S²⁻: 16 Protonen, 18 Elektronen. Schwefel nimmt 2 Elektronen auf.", "S²⁻: 16 protons, 18 electrons. Sulfur gains 2 electrons."),
    visual: c => <ChargeCalc c={c} start={[8, 8]} solution={[16, 18]} />,
  }),

  // ── 4 Elektronenübergang – Modell der Ionenbildung ──
  model({
    mode: "worked", part: tr("Elektronenübergang", "Electron transfer"),
    say: tr("**Modell der Ionenbildung**: Bei der Reaktion gehen Elektronen vom Metall-Atom zum Nichtmetall-Atom über.", "**Model of ion formation**: in the reaction electrons pass from the metal atom to the non-metal atom."),
    ask: tr("Wie entstehen Na⁺ und Cl⁻ aus Natrium und Chlor?", "How do Na⁺ and Cl⁻ form from sodium and chlorine?"),
    visual: c => <Transfer c={c} M={11} N={17} start={[1, 1]} solution={[1, 1]} />,
    lines: [
      tr("**Elektronenübergang**: Das Außenelektron des Na-Atoms geht zum Cl-Atom.", "**Electron transfer**: the outer electron of the Na atom passes to the Cl atom."),
      tr("Na⁺ (2 · 8) und Cl⁻ (2 · 8 · 8) haben Edelgaskonfiguration.", "Na⁺ (2 · 8) and Cl⁻ (2 · 8 · 8) have a noble gas configuration."),
      tr("**Gesamtladung**: (1+) + (1−) = 0.", "**Total charge**: (1+) + (1−) = 0."),
    ],
    ok: tr("Kein Elektron geht verloren: Kation und Anion entstehen gemeinsam.", "No electron is lost: cation and anion form together."),
  }),
  model({
    mode: "faded",
    ask: tr("Tippe Außenelektronen von Magnesium an: Sie gehen zum Sauerstoff-Atom über. Dann prüfe.", "Tap outer electrons of magnesium: they pass to the oxygen atom. Then check."),
    answer: "Mg²⁺ + O²⁻",
    lines: [tr("Mg hat 2 Außenelektronen, O hat 6.", "Mg has 2 outer electrons, O has 6."), tr("Nach dem Übergang: {?}", "After the transfer: {?}")],
    why: {
      "Mg + O": tr("Noch ist kein Elektron übergegangen.", "No electron has passed over yet."),
      "Mg⁺ + O⁻": tr("Erst 1 Elektron ist übergegangen. Mg hat noch 1 außen, O erst 7.", "Only 1 electron has passed over. Mg still has 1 on the outside, O only 7."),
    },
    tip: tr("Übertrage, bis beide Teilchen außen eine volle Schale haben.", "Transfer until both particles have a full outer shell."),
    ok: tr("Mg gibt 2 Elektronen an O: **Mg²⁺** und **O²⁻**. Gesamtladung (2+) + (2−) = 0.", "Mg gives 2 electrons to O: **Mg²⁺** and **O²⁻**. Total charge (2+) + (2−) = 0."),
    visual: c => <Transfer c={c} M={12} N={8} start={[1, 1]} solution={[1, 1]} />,
  }),
  {
    mode: "free",
    ask: tr("Natrium gibt 1 Elektron ab. Wo ist dieses Elektron danach?", "Sodium loses 1 electron. Where is this electron afterwards?"),
    visual: () => <Row items={[{ Z: 11, E: 10, title: tr("Natrium-Ion", "Sodium ion") }, { Z: 17, E: 18, got: 1, title: tr("Chlorid-Ion", "Chloride ion") }]} arrows={["e⁻ →"]} />,
    answer: tr("beim Chlor-Atom – es wird Cl⁻", "with the chlorine atom – it becomes Cl⁻"),
    options: [tr("Es ist verschwunden.", "It has disappeared."), tr("im Kern von Natrium", "in the sodium nucleus"), tr("beim Chlor-Atom – es wird Cl⁻", "with the chlorine atom – it becomes Cl⁻")],
    why: {
      [tr("Es ist verschwunden.", "It has disappeared.")]: tr("Elektronen verschwinden nicht. Das Nichtmetall-Atom nimmt sie auf – die Gesamtladung bleibt 0.", "Electrons do not disappear. The non-metal atom gains them – the total charge stays 0."),
      [tr("im Kern von Natrium", "in the sodium nucleus")]: tr("Im Kern sind nur Protonen und Neutronen. Das Elektron geht zum Chlor-Atom über.", "The nucleus holds only protons and neutrons. The electron passes to the chlorine atom."),
    },
    ok: tr("Das abgegebene Elektron sitzt jetzt beim Chlor: Na⁺ und Cl⁻ entstehen zusammen.", "The lost electron now sits with chlorine: Na⁺ and Cl⁻ form together."),
  },
  model({
    mode: "free",
    say: tr("Manchmal braucht man mehrere Nichtmetall-Atome für ein Metall-Atom.", "Sometimes you need several non-metal atoms for one metal atom."),
    ask: tr("Magnesium und Chlor: Stelle die Zahl der Chlor-Atome ein und übertrage die Elektronen. Dann prüfe.", "Magnesium and chlorine: set the number of chlorine atoms and transfer the electrons. Then check."),
    answer: "Mg²⁺ + 2 Cl⁻",
    why: {
      "Mg + Cl": tr("Noch ist kein Elektron übergegangen.", "No electron has passed over yet."),
      "Mg⁺ + Cl⁻": tr("Ein Chlor-Atom nimmt nur 1 Elektron auf. Mg hat noch 1 außen – nimm ein Chlor-Atom dazu.", "One chlorine atom gains only 1 electron. Mg still has 1 on the outside – add a chlorine atom."),
      "Mg + 2 Cl": tr("Noch ist kein Elektron übergegangen.", "No electron has passed over yet."),
      "Mg⁺ + Cl⁻ + Cl": tr("Mg hat noch 1 Außenelektron. Übertrage es zum zweiten Chlor-Atom.", "Mg still has 1 outer electron. Transfer it to the second chlorine atom."),
      "Mg²⁺ + 2 Cl⁻ + Cl": tr("Ein Chlor-Atom bleibt übrig. Magnesium gibt nur 2 Elektronen ab.", "One chlorine atom is left over. Magnesium loses only 2 electrons."),
    },
    tip: tr("Magnesium gibt 2 Elektronen ab. Wie viele nimmt ein Chlor-Atom auf?", "Magnesium loses 2 electrons. How many does one chlorine atom gain?"),
    lines: [tr("2 Elektronen von Mg → je 1 an 2 Chlor-Atome.", "2 electrons from Mg → 1 each to 2 chlorine atoms.")],
    ok: tr("Mg²⁺ + 2 Cl⁻: Gesamtladung (2+) + 2 · (1−) = 0.", "Mg²⁺ + 2 Cl⁻: total charge (2+) + 2 · (1−) = 0."),
    visual: c => <Transfer c={c} M={12} N={17} start={[1, 1]} solution={[1, 2]} adjust="n" />,
  }),
  model({
    mode: "free",
    ask: tr("Lithium und Sauerstoff: Stelle die Zahl der Lithium-Atome ein und übertrage. Dann prüfe.", "Lithium and oxygen: set the number of lithium atoms and transfer. Then check."),
    answer: "2 Li⁺ + O²⁻",
    why: {
      "Li + O": tr("Noch ist kein Elektron übergegangen.", "No electron has passed over yet."),
      "Li⁺ + O⁻": tr("Ein Lithium-Atom hat nur 1 Außenelektron. Sauerstoff fehlt noch 1 Elektron – nimm ein Lithium-Atom dazu.", "One lithium atom has only 1 outer electron. Oxygen still lacks 1 – add a lithium atom."),
      "Li⁺ + Li + O⁻": tr("Das zweite Lithium-Atom hat sein Elektron noch. Übertrage es.", "The second lithium atom still has its electron. Transfer it."),
      "2 Li⁺ + Li + O²⁻": tr("Ein Lithium-Atom bleibt übrig. Sauerstoff nimmt nur 2 Elektronen auf.", "One lithium atom is left over. Oxygen gains only 2 electrons."),
    },
    tip: tr("Sauerstoff nimmt 2 Elektronen auf. Wie viele gibt ein Lithium-Atom ab?", "Oxygen gains 2 electrons. How many does one lithium atom lose?"),
    lines: [tr("Je 1 Elektron von 2 Lithium-Atomen → O²⁻.", "1 electron each from 2 lithium atoms → O²⁻.")],
    ok: tr("2 Li⁺ + O²⁻: Gesamtladung 2 · (1+) + (2−) = 0.", "2 Li⁺ + O²⁻: total charge 2 · (1+) + (2−) = 0."),
    visual: c => <Transfer c={c} M={3} N={8} start={[1, 1]} solution={[2, 1]} adjust="m" />,
  }),
  model({
    mode: "free",
    ask: tr("Jetzt du: Calcium und Fluor. Stelle die Zahl der Fluor-Atome ein und übertrage. Dann prüfe.", "Your turn: calcium and fluorine. Set the number of fluorine atoms and transfer. Then check."),
    answer: "Ca²⁺ + 2 F⁻",
    why: {
      "Ca + F": tr("Noch ist kein Elektron übergegangen.", "No electron has passed over yet."),
      "Ca⁺ + F⁻": tr("Calcium hat noch 1 Außenelektron, das Fluor-Atom ist voll. Nimm ein Fluor-Atom dazu.", "Calcium still has 1 outer electron, the fluorine atom is full. Add a fluorine atom."),
      "Ca + 2 F": tr("Noch ist kein Elektron übergegangen.", "No electron has passed over yet."),
      "Ca⁺ + F⁻ + F": tr("Calcium hat noch 1 Außenelektron. Übertrage es zum zweiten Fluor-Atom.", "Calcium still has 1 outer electron. Transfer it to the second fluorine atom."),
      "Ca²⁺ + 2 F⁻ + F": tr("Ein Fluor-Atom bleibt übrig. Calcium gibt nur 2 Elektronen ab.", "One fluorine atom is left over. Calcium loses only 2 electrons."),
    },
    tip: tr("Zähle: Wie viele Elektronen gibt Calcium ab, wie viele nimmt ein Fluor-Atom auf?", "Count: how many electrons does calcium lose, how many does one fluorine atom gain?"),
    lines: [tr("Ca (II.) gibt 2 ab, F (VII.) nimmt je 1 auf → 2 Fluor-Atome.", "Ca (II) loses 2, F (VII) gains 1 each → 2 fluorine atoms.")],
    ok: tr("Ca²⁺ + 2 F⁻: alle Teilchen mit Edelgaskonfiguration, Gesamtladung 0.", "Ca²⁺ + 2 F⁻: all particles with a noble gas configuration, total charge 0."),
    visual: c => <Transfer c={c} M={20} N={9} start={[1, 1]} solution={[1, 2]} adjust="n" />,
  }),
  {
    mode: "free",
    ask: tr("Welcher Satz passt zum Modell der Ionenbildung?", "Which sentence fits the model of ion formation?"),
    visual: () => <Row items={[{ Z: 12, E: 10, title: "Mg²⁺" }, { Z: 8, E: 10, got: 2, title: "O²⁻" }]} arrows={["2 e⁻ →"]} />,
    answer: tr("Kationen und Anionen entstehen gemeinsam.", "Cations and anions form together."),
    options: [
      tr("Ein Kation entsteht allein, seine Elektronen verschwinden.", "A cation forms on its own, its electrons disappear."),
      tr("Kationen und Anionen entstehen gemeinsam.", "Cations and anions form together."),
      tr("Das Metall-Atom nimmt Elektronen auf.", "The metal atom gains electrons."),
    ],
    why: {
      [tr("Ein Kation entsteht allein, seine Elektronen verschwinden.", "A cation forms on its own, its electrons disappear.")]: tr("Elektronen verschwinden nicht: Das Nichtmetall-Atom nimmt sie auf und wird zum Anion.", "Electrons do not disappear: the non-metal atom gains them and becomes an anion."),
      [tr("Das Metall-Atom nimmt Elektronen auf.", "The metal atom gains electrons.")]: tr("Umgekehrt: Das Metall-Atom gibt Elektronen ab und wird positiv.", "The other way round: the metal atom loses electrons and becomes positive."),
    },
    ok: tr("Was das Metall-Atom abgibt, nimmt das Nichtmetall-Atom auf. Die Gesamtladung bleibt 0.", "What the metal atom loses, the non-metal atom gains. The total charge stays 0."),
  },
];

export const kapitel1 = (): Kapitel => ({
  id: "atom-ion", nr: 1, stufe: "us",
  title: tr("Vom Atom zum Ion", "From atom to ion"),
  desc: tr("Wie aus Atomen Ionen werden: Elektronen abgeben und aufnehmen, Ladung aus dem PSE.", "How atoms become ions: losing and gaining electrons, charge from the periodic table."),
  def: {
    title: tr("Vom Atom zum Ion", "From atom to ion"),
    known: [
      tr("Kern", "nucleus"), tr("Hülle", "shell"), tr("Protonen", "protons"), tr("Neutronen", "neutrons"), tr("Elektronen", "electrons"),
      tr("Ordnungszahl", "atomic number"), tr("Schalen", "shells"), tr("Außenelektronen", "outer electrons"), tr("Periode", "period"),
      tr("Hauptgruppe", "main group"), tr("Edelgaskonfiguration", "noble gas configuration"), tr("Ionen", "ions"), tr("Kationen", "cations"),
      tr("Anionen", "anions"), tr("Ladung", "charge"), tr("neutral", "neutral"), tr("Periodensystem", "periodic table"),
    ],
    steps: steps(),
    outro: [
      tr("Außenelektronen im Bohrmodell zählen und die Edelgaskonfiguration erkennen.", "Count outer electrons in the Bohr model and recognise the noble gas configuration."),
      tr("Aus Metall-Atomen Kationen bilden (Na⁺, Mg²⁺, Al³⁺): Ladung = Protonen − Elektronen.", "Form cations from metal atoms (Na⁺, Mg²⁺, Al³⁺): charge = protons − electrons."),
      tr("Aus Nichtmetall-Atomen Anionen bilden (Cl⁻, O²⁻, N³⁻) und die Ladung aus der Hauptgruppe ablesen.", "Form anions from non-metal atoms (Cl⁻, O²⁻, N³⁻) and read the charge from the main group."),
      tr("Den Elektronenübergang vom Metall- zum Nichtmetall-Atom im Modell zeigen – die Gesamtladung bleibt 0.", "Show the electron transfer from the metal atom to the non-metal atom in the model – the total charge stays 0."),
    ],
  },
  explain: [
    [
      tr("**Außenelektronen** sitzen auf der äußersten Schale. Ihre Zahl ist die Nummer der Hauptgruppe, z. B. Phosphor P: 2 · 8 · 5 → V. Hauptgruppe.", "**Outer electrons** sit on the outermost shell. Their number is the number of the main group, e.g. phosphorus P: 2 · 8 · 5 → main group V."),
      tr("**Edelgase** (VIII. Hauptgruppe) haben eine volle Außenschale: Helium 2, alle anderen 8. Das ist die **Edelgaskonfiguration**.", "**Noble gases** (main group VIII) have a full outer shell: helium 2, all others 8. This is the **noble gas configuration**."),
      tr("Im Modell gilt der kürzere Weg: 1 bis 3 Außenelektronen werden abgegeben, bei 5 bis 7 werden Elektronen aufgenommen, z. B. Fluor F: 7 + 1 = 8.", "In the model the shorter way applies: 1 to 3 outer electrons are lost, with 5 to 7 electrons are gained, e.g. fluorine F: 7 + 1 = 8."),
    ],
    [
      tr("**Metall**-Atome (I. bis III. Hauptgruppe) geben ihre Außenelektronen ab und werden **Kationen**.", "**Metal** atoms (main groups I to III) lose their outer electrons and become **cations**."),
      tr("**Ladung = Protonen − Elektronen**, z. B. Lithium: 3 p⁺ · 2 e⁻ → 1+, also Li⁺.", "**Charge = protons − electrons**, e.g. lithium: 3 p⁺ · 2 e⁻ → 1+, so Li⁺."),
      tr("Ladung des Kations = Nummer der Hauptgruppe. Das Kation hat eine Schale weniger und ist kleiner als sein Atom.", "Charge of the cation = number of the main group. The cation has one shell fewer and is smaller than its atom."),
    ],
    [
      tr("**Nichtmetall**-Atome (V. bis VII. Hauptgruppe) nehmen Elektronen auf, bis außen 8 sind, und werden **Anionen**.", "**Non-metal** atoms (main groups V to VII) gain electrons until there are 8 on the outside and become **anions**."),
      tr("Ladung des Anions = 8 − Hauptgruppe, negativ, z. B. Fluor F (VII.) → F⁻.", "Charge of the anion = 8 − main group, negative, e.g. fluorine F (VII) → F⁻."),
      tr("Modell: Mehr Elektronen stoßen sich ab – das Anion ist größer als sein Atom.", "Model: more electrons repel each other – the anion is larger than its atom."),
      tr("Edelgase und die IV. Hauptgruppe bilden hier keine Ionen.", "Noble gases and main group IV form no ions here."),
    ],
    [
      tr("**Modell der Ionenbildung**: Bei der Reaktion gehen Elektronen vom Metall-Atom zum Nichtmetall-Atom über (**Elektronenübergang**).", "**Model of ion formation**: in the reaction electrons pass from the metal atom to the non-metal atom (**electron transfer**)."),
      tr("Kein Elektron geht verloren: Die **Gesamtladung** bleibt 0, z. B. Na⁺ + Cl⁻: (1+) + (1−) = 0.", "No electron is lost: the **total charge** stays 0, e.g. Na⁺ + Cl⁻: (1+) + (1−) = 0."),
      tr("Gibt das Metall-Atom mehr Elektronen ab, als ein Nichtmetall-Atom aufnimmt, braucht man mehrere, z. B. Ca²⁺ + 2 Cl⁻.", "If the metal atom loses more electrons than one non-metal atom gains, you need several, e.g. Ca²⁺ + 2 Cl⁻."),
    ],
  ],
});

