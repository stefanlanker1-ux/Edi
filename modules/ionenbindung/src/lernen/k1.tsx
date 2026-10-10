// Kapitel 1: Vom Atom zum Ion (Level I) – Außenelektronen und Edelgase, Metall-Atome werden Kationen, Nichtmetall-Atome werden Anionen,
// Elektronenübergang als Modell der Ionenbildung. Hauptmodell: Bohrmodell der Unterstufe (Elektronen antippen, abgeben, aufnehmen, übertragen).

import { tr } from "@lern/i18n";
import type { GuideStep } from "@lern/ui";
import type { Kapitel } from "./types.ts";
import { model as asModel } from "./model.tsx";
import { ChargeCalc, MarkOuter, IonBuilder, PseIons, Row, Transfer, calcWhy, ionWhy, markWhy, trWhy } from "./k1/models.tsx";
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
    ask: tr("Wie viele Elektronen haben sie auf der äußersten Schale?", "How many electrons do they have on their outermost shell?"),
    visual: () => <Row items={[{ Z: 2, E: 2, title: tr("Helium", "Helium") }, { Z: 10, E: 10, title: tr("Neon", "Neon") }, { Z: 18, E: 18, title: tr("Argon", "Argon") }]} />,
    lines: [
      tr("Helium hat nur eine Schale. Mit 2 Elektronen ist sie voll besetzt.", "Helium has only one shell. With 2 electrons it is full."),
      tr("Neon hat 2 Elektronen auf der 1. Schale und 8 auf der 2. Schale.", "Neon has 2 electrons on the 1st shell and 8 on the 2nd shell."),
      tr("Argon hat 2, dann 8 und auf der 3. Schale wieder 8 Elektronen.", "Argon has 2, then 8 and on the 3rd shell again 8 electrons."),
    ],
    ok: tr("Edelgase haben eine voll besetzte Außenschale: Helium mit 2, die anderen mit 8 Elektronen. Das nennt man **Edelgaskonfiguration**.", "Noble gases have a full outer shell: helium with 2, the others with 8 electrons. This is called the **noble gas configuration**."),
  }),
  model({
    mode: "faded",
    say: tr("Die Elektronen auf der äußersten Schale heißen **Außenelektronen**. Ihre Anzahl ist die Nummer der Hauptgruppe (außer bei Helium).", "The electrons on the outermost shell are called **outer electrons**. Their number is the number of the main group (except for helium)."),
    ask: tr("Tippe alle Außenelektronen des Sauerstoff-Atoms an.", "Tap all outer electrons of the oxygen atom."),
    answer: "6",
    lines: [tr("Sauerstoff hat 8 Elektronen: 2 auf der 1. Schale, der Rest auf der 2. Schale.", "Oxygen has 8 electrons: 2 on the 1st shell, the rest on the 2nd shell."), tr("Außenelektronen: {?}", "Outer electrons: {?}")],
    why: markWhy(8),
    tip: tr("Außenelektronen liegen nur auf dem äußersten Ring. Zähle beim Antippen mit.", "Outer electrons lie only on the outermost ring. Count while you tap."),
    ok: tr("Sauerstoff hat 6 Außenelektronen – es steht in der VI. Hauptgruppe.", "Oxygen has 6 outer electrons – it is in main group VI."),
    visual: c => <MarkOuter c={c} Z={8} />,
  }),
  model({
    mode: "free",
    ask: tr("Markiere die Außenelektronen des Aluminium-Atoms.", "Mark the outer electrons of the aluminium atom."),
    answer: "3",
    why: markWhy(13),
    tip: tr("Suche den äußersten Ring und tippe jedes Elektron darauf einmal an.", "Find the outermost ring and tap each electron on it once."),
    lines: [tr("Aluminium hat 2 Elektronen auf der 1. Schale, 8 auf der 2. und 3 auf der 3. Schale.", "Aluminium has 2 electrons on the 1st shell, 8 on the 2nd and 3 on the 3rd shell.")],
    ok: tr("Aluminium hat 3 Außenelektronen. Es steht in der III. Hauptgruppe.", "Aluminium has 3 outer electrons. It is in main group III."),
    visual: c => <MarkOuter c={c} Z={13} />,
  }),
  model({
    mode: "worked",
    say: tr("Zu einer vollen Außenschale führen zwei Wege: Das Atom kann Elektronen **abgeben** oder Elektronen **aufnehmen**.", "Two ways lead to a full outer shell: the atom can **lose** electrons or **gain** electrons."),
    ask: tr("Natrium hat 1 Außenelektron. Welcher Weg ist kürzer?", "Sodium has 1 outer electron. Which way is shorter?"),
    visual: () => <Row items={[{ Z: 10, E: 10, title: tr("Neon", "Neon") }, { Z: 11, E: 11, title: tr("Natrium", "Sodium") }, { Z: 18, E: 18, title: tr("Argon", "Argon") }]}
      arrows={["← −1 e⁻", "+7 e⁻ →"]} />,
    lines: [
      tr("Gibt Natrium sein Außenelektron ab, liegt außen die 2. Schale mit 8 Elektronen – wie bei Neon.", "If sodium loses its outer electron, the 2nd shell with 8 electrons is on the outside – as in neon."),
      tr("Um die 3. Schale zu füllen, müsste Natrium 7 Elektronen aufnehmen.", "To fill the 3rd shell, sodium would have to gain 7 electrons."),
      tr("Im Modell gilt der kürzere Weg: Natrium gibt 1 Elektron ab.", "In the model the shorter way applies: sodium loses 1 electron."),
    ],
    ok: tr("Atome mit 1 bis 3 Außenelektronen geben diese ab (außer Wasserstoff und Bor). Atome mit 5 bis 7 nehmen Elektronen auf, bis es 8 sind.", "Atoms with 1 to 3 outer electrons lose them (except hydrogen and boron). Atoms with 5 to 7 gain electrons until there are 8."),
  }),
  {
    mode: "faded",
    ask: tr("Chlor hat 7 Außenelektronen. Welcher Weg ist hier kürzer?", "Chlorine has 7 outer electrons. Which way is shorter here?"),
    visual: () => <Row items={[{ Z: 17, E: 17, title: tr("Chlor", "Chlorine"), slots: true }]} />,
    lines: [tr("Abgeben: Chlor müsste alle 7 Außenelektronen abgeben.", "Losing: chlorine would have to lose all 7 outer electrons."), tr("Aufnehmen: Mit {?} ist die äußerste Schale voll.", "Gaining: with {?} the outermost shell is full.")],
    answer: tr("1 Elektron", "1 electron"),
    options: [tr("7 Elektronen", "7 electrons"), tr("1 Elektron", "1 electron"), tr("8 Elektronen", "8 electrons")],
    why: {
      [tr("7 Elektronen", "7 electrons")]: tr("7 Elektronen hat Chlor schon auf der äußersten Schale. Bis 8 fehlt nur eines.", "Chlorine already has 7 electrons on the outermost shell. Only one is missing to make 8."),
      [tr("8 Elektronen", "8 electrons")]: tr("Es kommen nur so viele Elektronen dazu, bis außen 8 sind – also nur eines.", "Only as many electrons are added as needed for 8 on the outside – so just one."),
    },
    ok: tr("Chlor nimmt 1 Elektron auf. Dann hat es 8 Außenelektronen, wie Argon.", "Chlorine gains 1 electron. Then it has 8 outer electrons, like argon."),
  },
  {
    mode: "free",
    ask: tr("Magnesium hat 2 Außenelektronen. Was passiert im Modell?", "Magnesium has 2 outer electrons. What happens in the model?"),
    visual: () => <Row items={[{ Z: 12, E: 12, title: tr("Magnesium", "Magnesium") }]} />,
    answer: tr("2 Elektronen abgeben", "lose 2 electrons"),
    options: [tr("6 Elektronen aufnehmen", "gain 6 electrons"), tr("2 Elektronen aufnehmen", "gain 2 electrons"), tr("2 Elektronen abgeben", "lose 2 electrons")],
    why: {
      [tr("6 Elektronen aufnehmen", "gain 6 electrons")]: tr("Das wäre der lange Weg. Mit der Abgabe von nur 2 Elektronen geht es kürzer.", "That would be the long way. Losing just 2 electrons is shorter."),
      [tr("2 Elektronen aufnehmen", "gain 2 electrons")]: tr("Dann hätte Magnesium 4 Außenelektronen – die Schale wäre nicht voll.", "Then magnesium would have 4 outer electrons – the shell would not be full."),
    },
    ok: tr("Magnesium gibt seine 2 Außenelektronen ab. Dann liegt außen eine volle Schale mit 8 Elektronen, wie bei Neon.", "Magnesium loses its 2 outer electrons. Then a full shell with 8 electrons is on the outside, as in neon."),
  },

  // ── 2 Metall-Atome werden Kationen ──
  model({
    mode: "worked", part: tr("Metall-Atome werden Kationen", "Metal atoms become cations"),
    say: tr("**Metalle** stehen im PSE links, in der I. bis III. Hauptgruppe (außer Wasserstoff und Bor). Ihre Atome geben die Außenelektronen ab.", "**Metals** are on the left of the periodic table, in main groups I to III (except hydrogen and boron). Their atoms lose their outer electrons."),
    ask: tr("Was passiert, wenn das Natrium-Atom sein Außenelektron abgibt?", "What happens when the sodium atom loses its outer electron?"),
    visual: () => <Row items={[{ Z: 11, E: 11, title: tr("Atom", "Atom") }, { Z: 11, E: 10, title: tr("Ion", "Ion"), ghost: false }]} arrows={["−1 e⁻ →"]} />,
    lines: [
      tr("Das Natrium-Atom hat 11 Protonen und 11 Elektronen. Es ist neutral.", "The sodium atom has 11 protons and 11 electrons. It is neutral."),
      tr("Nach der Abgabe bleiben 10 Elektronen. Eine positive Ladung ist übrig: Es entsteht das Natrium-Ion **Na⁺**.", "After losing one, 10 electrons remain. One positive charge is left over: the sodium ion **Na⁺** forms."),
      tr("Die 3. Schale ist jetzt leer und fällt weg. Na⁺ ist deshalb kleiner als das Atom.", "The 3rd shell is now empty and drops away. So Na⁺ is smaller than the atom."),
    ],
    ok: tr("Die **Ladung** ist Protonen minus Elektronen: 11 − 10 = 1+. Positiv geladene Ionen heißen **Kationen**.", "The **charge** is protons minus electrons: 11 − 10 = 1+. Positively charged ions are called **cations**."),
  }),
  model({
    mode: "faded",
    ask: tr("Lass das Magnesium-Atom Elektronen abgeben, bis außen eine volle Schale liegt.", "Let the magnesium atom lose electrons until a full shell is on the outside."),
    answer: "Mg²⁺",
    lines: [tr("Magnesium steht in der II. Hauptgruppe und hat 2 Außenelektronen.", "Magnesium is in main group II and has 2 outer electrons."), tr("Danach hat es 12 Protonen und 10 Elektronen: das Ion {?}", "Then it has 12 protons and 10 electrons: the ion {?}")],
    why: ionWhy(12),
    tip: tr("Zähle die Elektronen auf dem äußersten Ring – so viele gibt Magnesium ab.", "Count the electrons on the outermost ring – that is how many magnesium loses."),
    ok: tr("Magnesium gibt 2 Elektronen ab und wird zum zweifach positiv geladenen Ion **Mg²⁺**. Außen hat es 8 Elektronen, wie Neon.", "Magnesium loses 2 electrons and becomes the doubly positively charged ion **Mg²⁺**. It has 8 electrons on the outside, like neon."),
    visual: c => <IonBuilder c={c} Z={12} solution={10} />,
  }),
  model({
    mode: "free",
    ask: tr("Bilde aus dem Aluminium-Atom ein Ion mit voller Außenschale.", "Turn the aluminium atom into an ion with a full outer shell."),
    answer: "Al³⁺",
    why: ionWhy(13),
    tip: tr("Gib genau so viele Elektronen ab, wie auf dem äußersten Ring sitzen.", "Lose exactly as many electrons as sit on the outermost ring."),
    lines: [tr("Aluminium hat 13 Protonen. Nach der Abgabe von 3 Elektronen bleiben 10 Elektronen: Ladung 3+.", "Aluminium has 13 protons. After losing 3 electrons, 10 electrons remain: charge 3+.")],
    ok: tr("Aluminium gibt seine 3 Außenelektronen ab. Es entsteht **Al³⁺** mit 8 Außenelektronen, wie Neon.", "Aluminium loses its 3 outer electrons. **Al³⁺** forms, with 8 outer electrons like neon."),
    visual: c => <IonBuilder c={c} Z={13} solution={10} />,
  }),
  model({
    mode: "free",
    say: tr("Die Zahl der Protonen bestimmt das Element. Die Zahl der Elektronen bestimmt die Ladung.", "The number of protons decides the element. The number of electrons decides the charge."),
    ask: tr("Stelle das Kalium-Ion K⁺ ein: Wie viele Protonen und Elektronen hat es?", "Set up the potassium ion K⁺: how many protons and electrons does it have?"),
    answer: "K⁺",
    why: calcWhy(19, 18),
    tip: tr("Die Ordnungszahl im PSE nennt die Protonen. Die Ladung ist Protonen minus Elektronen.", "The atomic number in the periodic table gives the protons. The charge is protons minus electrons."),
    lines: [tr("Kalium hat 19 Protonen. Mit 18 Elektronen ist das Ion einfach positiv geladen und hat außen 8 Elektronen, wie Argon.", "Potassium has 19 protons. With 18 electrons the ion has a single positive charge and 8 electrons on the outside, like argon.")],
    ok: tr("K⁺ hat 19 Protonen und 18 Elektronen. Das Kalium-Atom hat sein Außenelektron abgegeben.", "K⁺ has 19 protons and 18 electrons. The potassium atom has lost its outer electron."),
    visual: c => <ChargeCalc c={c} start={[11, 11]} solution={[19, 18]} />,
  }),
  {
    mode: "free",
    ask: tr("Vergleiche die beiden Bilder: Welches Teilchen ist kleiner?", "Compare the two pictures: which particle is smaller?"),
    visual: () => <Row items={[{ Z: 11, E: 11, title: tr("Natrium-Atom", "Sodium atom") }, { Z: 11, E: 10, title: tr("Natrium-Ion", "Sodium ion"), ghost: false }]} />,
    answer: "Na⁺",
    options: ["Na", tr("beide gleich", "both the same"), "Na⁺"],
    why: {
      Na: tr("Das Natrium-Atom hat 3 Schalen, das Natrium-Ion nur 2. Seine 3. Schale ist leer.", "The sodium atom has 3 shells, the sodium ion only 2. Its 3rd shell is empty."),
      [tr("beide gleich", "both the same")]: tr("Die Schalen sind gleich groß geblieben. Aber Na⁺ hat eine Schale weniger, weil die 3. Schale leer ist.", "The shells have kept their size. But Na⁺ has one shell fewer, because the 3rd shell is empty."),
    },
    ok: tr("Ein Kation ist kleiner als sein Atom, weil die äußerste Schale wegfällt. Die übrigen Schalen bleiben gleich groß.", "A cation is smaller than its atom, because the outermost shell drops away. The other shells keep their size."),
  },
  model({
    mode: "free",
    ask: tr("Ca steht in der II. Hauptgruppe. Bilde sein Ion.", "Ca is in main group II. Form its ion."),
    answer: "Ca²⁺",
    why: ionWhy(20),
    tip: tr("Wie viele Elektronen sitzen auf dem äußersten Ring?", "How many electrons sit on the outermost ring?"),
    lines: [tr("Calcium hat 20 Protonen. Nach der Abgabe von 2 Elektronen hat es 18 Elektronen: Ladung 2+.", "Calcium has 20 protons. After losing 2 electrons it has 18 electrons: charge 2+.")],
    ok: tr("Calcium gibt 2 Elektronen ab und wird zu **Ca²⁺**. Die Ladung eines Metall-Ions ist die Nummer seiner Hauptgruppe.", "Calcium loses 2 electrons and becomes **Ca²⁺**. The charge of a metal ion is the number of its main group."),
    visual: c => <IonBuilder c={c} Z={20} solution={18} />,
  }),

  // ── 3 Nichtmetall-Atome werden Anionen ──
  model({
    mode: "worked", part: tr("Nichtmetall-Atome werden Anionen", "Non-metal atoms become anions"),
    say: tr("**Nichtmetalle** stehen im PSE rechts, zum Beispiel in der V. bis VII. Hauptgruppe. Ihre Atome nehmen Elektronen auf, bis außen 8 sind.", "**Non-metals** are on the right of the periodic table, for example in main groups V to VII. Their atoms gain electrons until there are 8 on the outside."),
    ask: tr("Was passiert, wenn das Chlor-Atom ein Elektron aufnimmt?", "What happens when the chlorine atom gains an electron?"),
    visual: () => <Row items={[{ Z: 17, E: 17, title: tr("Atom", "Atom"), slots: true }, { Z: 17, E: 18, got: 1, title: tr("Ion", "Ion") }]} arrows={["+1 e⁻ →"]} />,
    lines: [
      tr("Das Chlor-Atom hat 17 Protonen und 17 Elektronen. Auf seiner äußersten Schale ist ein Platz frei.", "The chlorine atom has 17 protons and 17 electrons. One space on its outermost shell is empty."),
      tr("Das aufgenommene Elektron besetzt diesen Platz. Jetzt sind es 18 Elektronen, aber nur 17 Protonen.", "The gained electron takes this space. Now there are 18 electrons, but only 17 protons."),
      tr("Eine negative Ladung ist übrig: Es entsteht das **Chlorid-Ion** Cl⁻ mit 8 Außenelektronen, wie Argon.", "One negative charge is left over: the **chloride ion** Cl⁻ forms, with 8 outer electrons like argon."),
    ],
    ok: tr("Negativ geladene Ionen heißen **Anionen**. Beim Aufnehmen bleibt die Schale gleich groß.", "Negatively charged ions are called **anions**. When electrons are gained, the shell keeps its size."),
  }),
  model({
    mode: "faded",
    ask: tr("Füge dem Sauerstoff-Atom 2 Elektronen hinzu – dann hat es 8 Außenelektronen.", "Add 2 electrons to the oxygen atom – then it has 8 outer electrons."),
    answer: "O²⁻",
    lines: [tr("Sauerstoff steht in der VI. Hauptgruppe und hat 6 Außenelektronen.", "Oxygen is in main group VI and has 6 outer electrons."), tr("Danach hat es 8 Protonen und 10 Elektronen: das Ion {?}", "Then it has 8 protons and 10 electrons: the ion {?}")],
    why: ionWhy(8),
    tip: tr("Zähle die gestrichelten freien Plätze auf dem äußersten Ring.", "Count the dashed empty spaces on the outermost ring."),
    ok: tr("Sauerstoff nimmt 2 Elektronen auf und wird zum zweifach negativ geladenen **Oxid-Ion** O²⁻. Außen hat es 8 Elektronen, wie Neon.", "Oxygen gains 2 electrons and becomes the doubly negatively charged **oxide ion** O²⁻. It has 8 electrons on the outside, like neon."),
    visual: c => <IonBuilder c={c} Z={8} solution={10} />,
  }),
  model({
    mode: "free",
    ask: tr("Stickstoff steht in der V. Hauptgruppe. Bilde sein Ion.", "Nitrogen is in main group V. Form its ion."),
    answer: "N³⁻",
    why: ionWhy(7),
    tip: tr("Wie viele Plätze sind auf dem äußersten Ring noch frei?", "How many spaces on the outermost ring are still empty?"),
    lines: [tr("Stickstoff hat 5 Außenelektronen. Mit 3 weiteren sind es 8: 7 Protonen und 10 Elektronen ergeben die Ladung 3−.", "Nitrogen has 5 outer electrons. With 3 more there are 8: 7 protons and 10 electrons give the charge 3−.")],
    ok: tr("Stickstoff nimmt 3 Elektronen auf und wird zu **N³⁻**, mit 8 Außenelektronen wie Neon.", "Nitrogen gains 3 electrons and becomes **N³⁻**, with 8 outer electrons like neon."),
    visual: c => <IonBuilder c={c} Z={7} solution={10} />,
  }),
  model({
    mode: "free",
    say: tr("Ein Nichtmetall-Atom nimmt so viele Elektronen auf, wie ihm bis 8 fehlen. Genauso viele negative Ladungen hat dann sein Ion.", "A non-metal atom gains as many electrons as it lacks to reach 8. Its ion then has just as many negative charges."),
    ask: tr("Tippe im PSE alle Elemente an, deren Ionen die Ladung 2− haben.", "Tap all elements in the periodic table whose ions have the charge 2−."),
    answer: "O S",
    why: {
      O: tr("Sauerstoff stimmt. Ein weiteres Element steht in derselben Hauptgruppe.", "Oxygen is right. Another element is in the same main group."),
      S: tr("Schwefel stimmt. Ein weiteres Element steht in derselben Hauptgruppe.", "Sulfur is right. Another element is in the same main group."),
      "Mg Ca": tr("Magnesium und Calcium geben 2 Elektronen ab. Ihre Ionen sind zweifach positiv geladen.", "Magnesium and calcium lose 2 electrons. Their ions carry two positive charges."),
      "Be Mg Ca": tr("Die II. Hauptgruppe gibt 2 Elektronen ab – das ergibt 2+, nicht 2−.", "Main group II loses 2 electrons – that gives 2+, not 2−."),
      "–": tr("Du hast noch nichts angetippt.", "You have not tapped anything yet."),
    },
    tip: tr("2− heißt: Das Atom hat 2 Elektronen aufgenommen. Wie viele Außenelektronen hatte es vorher?", "2− means: the atom has gained 2 electrons. How many outer electrons did it have before?"),
    lines: [tr("In der VI. Hauptgruppe fehlen bis 8 genau 2 Elektronen. So entstehen O²⁻ und S²⁻.", "In main group VI exactly 2 electrons are missing to make 8. This gives O²⁻ and S²⁻.")],
    ok: tr("Sauerstoff und Schwefel stehen in der VI. Hauptgruppe. Sie bilden O²⁻ und S²⁻.", "Oxygen and sulfur are in main group VI. They form O²⁻ and S²⁻."),
    visual: c => <PseIons c={c} answer={[8, 16]} />,
  }),
  {
    mode: "free",
    ask: tr("Welches dieser Atome bildet kein einfaches Ion?", "Which of these atoms forms no simple ion?"),
    visual: () => <Row items={[{ Z: 16, E: 16 }, { Z: 9, E: 9 }, { Z: 18, E: 18 }, { Z: 13, E: 13 }]} />,
    answer: "Ar (VIII)",
    options: ["S (VI)", "F (VII)", "Ar (VIII)", "Al (III)"],
    why: {
      "S (VI)": tr("Schwefel nimmt 2 Elektronen auf und wird zu S²⁻.", "Sulfur gains 2 electrons and becomes S²⁻."),
      "F (VII)": tr("Fluor nimmt 1 Elektron auf und wird zu F⁻.", "Fluorine gains 1 electron and becomes F⁻."),
      "Al (III)": tr("Aluminium gibt 3 Elektronen ab und wird zu Al³⁺.", "Aluminium loses 3 electrons and becomes Al³⁺."),
    },
    ok: tr("Argon hat schon 8 Außenelektronen. Edelgase, Wasserstoff, Bor und die IV. Hauptgruppe bilden in diesem Modell keine einfachen Ionen.", "Argon already has 8 outer electrons. Noble gases, hydrogen, boron and main group IV form no simple ions in this model."),
  },
  model({
    mode: "free",
    ask: tr("Stelle das Ion S²⁻ ein, das aus Schwefel entsteht: Wie viele Protonen und Elektronen hat es?", "Set up the ion S²⁻ that forms from sulfur: how many protons and electrons does it have?"),
    answer: "S²⁻",
    why: calcWhy(16, 18),
    tip: tr("Die Ordnungszahl von Schwefel nennt die Protonen. Für die Ladung 2− hat das Ion 2 Elektronen mehr.", "The atomic number of sulfur gives the protons. For the charge 2− the ion has 2 more electrons."),
    lines: [tr("Schwefel hat 16 Protonen. Mit 18 Elektronen ist das Ion zweifach negativ geladen und hat außen 8 Elektronen, wie Argon.", "Sulfur has 16 protons. With 18 electrons the ion carries two negative charges and has 8 electrons on the outside, like argon.")],
    ok: tr("S²⁻ hat 16 Protonen und 18 Elektronen. Das Schwefel-Atom hat 2 Elektronen aufgenommen.", "S²⁻ has 16 protons and 18 electrons. The sulfur atom has gained 2 electrons."),
    visual: c => <ChargeCalc c={c} start={[8, 8]} solution={[16, 18]} />,
  }),

  // ── 4 Elektronenübergang – Modell der Ionenbildung ──
  model({
    mode: "worked", part: tr("Elektronenübergang", "Electron transfer"),
    say: tr("Reagiert Natrium mit Chlor, gibt das Natrium-Atom sein Außenelektron an das Chlor-Atom ab. Das nennt man **Elektronenübergang**.", "When sodium reacts with chlorine, the sodium atom gives its outer electron to the chlorine atom. This is called **electron transfer**."),
    ask: tr("Wie entstehen dabei das Natrium-Ion und das Chlorid-Ion?", "How do the sodium ion and the chloride ion form?"),
    visual: c => <Transfer c={c} M={11} N={17} start={[1, 1]} solution={[1, 1]} play />,
    lines: [
      tr("Das Natrium-Atom gibt sein Außenelektron ab und wird zum Natrium-Ion Na⁺.", "The sodium atom loses its outer electron and becomes the sodium ion Na⁺."),
      tr("Das Chlor-Atom nimmt dieses Elektron auf und wird zum Chlorid-Ion Cl⁻.", "The chlorine atom gains this electron and becomes the chloride ion Cl⁻."),
      tr("Beide Ionen haben jetzt 8 Außenelektronen – wie die Edelgase Neon und Argon.", "Both ions now have 8 outer electrons – like the noble gases neon and argon."),
    ],
    ok: tr("Die positive Ladung von Na⁺ und die negative Ladung von Cl⁻ gleichen sich aus. Zusammen sind die beiden Ionen neutral.", "The positive charge of Na⁺ and the negative charge of Cl⁻ balance each other. Together the two ions are neutral."),
  }),
  model({
    mode: "faded",
    ask: tr("Übertrage Elektronen vom Magnesium-Atom auf das Sauerstoff-Atom.", "Transfer electrons from the magnesium atom to the oxygen atom."),
    answer: "Mg²⁺ + O²⁻",
    lines: [tr("Magnesium hat 2 Außenelektronen. Dem Sauerstoff fehlen 2 bis zur vollen Schale.", "Magnesium has 2 outer electrons. Oxygen is 2 short of a full shell."), tr("Nach dem Übergang liegen vor: {?}", "After the transfer there are: {?}")],
    why: trWhy(12, 8, [1, 1], [1, 1]),
    tip: tr("Übertrage so lange, bis beide Teilchen eine volle Außenschale haben.", "Keep transferring until both particles have a full outer shell."),
    ok: tr("Magnesium gibt 2 Elektronen an Sauerstoff ab. Es entstehen **Mg²⁺** und **O²⁻**, deren Ladungen sich ausgleichen.", "Magnesium gives 2 electrons to oxygen. **Mg²⁺** and **O²⁻** form, and their charges balance each other."),
    visual: c => <Transfer c={c} M={12} N={8} start={[1, 1]} solution={[1, 1]} />,
  }),
  {
    mode: "free",
    ask: tr("Natrium hat 1 Elektron abgegeben. Wo ist dieses Elektron jetzt?", "Sodium has lost 1 electron. Where is this electron now?"),
    visual: () => <Row items={[{ Z: 11, E: 10, ghost: false }, { Z: 17, E: 18, got: 1 }]} arrows={["e⁻ →"]} />,
    answer: tr("beim Chlor-Atom, das dadurch zu Cl⁻ wird", "with the chlorine atom, which becomes Cl⁻"),
    options: [tr("Es ist verschwunden.", "It has disappeared."), tr("im Kern von Natrium", "in the sodium nucleus"), tr("beim Chlor-Atom, das dadurch zu Cl⁻ wird", "with the chlorine atom, which becomes Cl⁻")],
    why: {
      [tr("Es ist verschwunden.", "It has disappeared.")]: tr("Elektronen verschwinden nicht. Das Chlor-Atom hat das Elektron aufgenommen.", "Electrons do not disappear. The chlorine atom has gained the electron."),
      [tr("im Kern von Natrium", "in the sodium nucleus")]: tr("Im Kern sind nur Protonen und Neutronen. Das Elektron ist zum Chlor-Atom übergegangen.", "The nucleus holds only protons and neutrons. The electron has passed to the chlorine atom."),
    },
    ok: tr("Das Elektron sitzt jetzt beim Chlor. Deshalb entstehen Na⁺ und Cl⁻ immer gemeinsam.", "The electron now sits with chlorine. That is why Na⁺ and Cl⁻ always form together."),
  },
  model({
    mode: "free",
    say: tr("Manchmal braucht man für ein Metall-Atom mehrere Nichtmetall-Atome.", "Sometimes you need several non-metal atoms for one metal atom."),
    ask: tr("Wie viele Chlor-Atome braucht man für ein Magnesium-Atom? Stelle die Zahl ein und übertrage die Elektronen.", "How many chlorine atoms do you need for one magnesium atom? Set the number and transfer the electrons."),
    answer: "Mg²⁺ + 2 Cl⁻",
    why: trWhy(12, 17, [1, 1], [1, 2], "n"),
    tip: tr("Magnesium gibt 2 Elektronen ab. Wie viele kann ein Chlor-Atom aufnehmen?", "Magnesium loses 2 electrons. How many can one chlorine atom gain?"),
    lines: [tr("Magnesium gibt 2 Elektronen ab, jedes Chlor-Atom nimmt eines auf. Man braucht also 2 Chlor-Atome.", "Magnesium loses 2 electrons, and each chlorine atom gains one. So you need 2 chlorine atoms.")],
    ok: tr("Es entstehen ein Mg²⁺ und zwei Cl⁻. Die zwei negativen Ladungen gleichen die zweifach positive Ladung aus.", "One Mg²⁺ and two Cl⁻ form. The two negative charges balance the double positive charge."),
    visual: c => <Transfer c={c} M={12} N={17} start={[1, 1]} solution={[1, 2]} adjust="n" />,
  }),
  model({
    mode: "free",
    ask: tr("Wie viele Lithium-Atome braucht man für ein Sauerstoff-Atom? Stelle die Zahl ein und übertrage die Elektronen.", "How many lithium atoms do you need for one oxygen atom? Set the number and transfer the electrons."),
    answer: "2 Li⁺ + O²⁻",
    why: trWhy(3, 8, [1, 1], [2, 1], "m"),
    tip: tr("Sauerstoff nimmt 2 Elektronen auf. Wie viele gibt ein Lithium-Atom ab?", "Oxygen gains 2 electrons. How many does one lithium atom lose?"),
    lines: [tr("Jedes Lithium-Atom gibt 1 Elektron ab. Für die 2 Elektronen des Sauerstoffs braucht man also 2 Lithium-Atome.", "Each lithium atom loses 1 electron. So for the 2 electrons oxygen gains, you need 2 lithium atoms.")],
    ok: tr("Es entstehen zwei Li⁺ und ein O²⁻. Zusammen sind diese Ionen neutral.", "Two Li⁺ and one O²⁻ form. Together these ions are neutral."),
    visual: c => <Transfer c={c} M={3} N={8} start={[1, 1]} solution={[2, 1]} adjust="m" />,
  }),
  model({
    mode: "free",
    say: tr("Im Schalenmodell hat jede Schale eine feste Größe. Die echte Größe der Ionen zeigt es nicht: Ca²⁺ ist in Wirklichkeit kleiner als F⁻.", "In the shell model every shell has a fixed size. It does not show the real size of the ions: Ca²⁺ is actually smaller than F⁻."),
    ask: tr("Calcium reagiert mit Fluor. Stelle die Zahl der Fluor-Atome ein und übertrage die Elektronen.", "Calcium reacts with fluorine. Set the number of fluorine atoms and transfer the electrons."),
    answer: "Ca²⁺ + 2 F⁻",
    why: trWhy(20, 9, [1, 1], [1, 2], "n"),
    tip: tr("Wie viele Elektronen gibt Calcium ab, und wie viele nimmt ein Fluor-Atom auf?", "How many electrons does calcium lose, and how many does one fluorine atom gain?"),
    lines: [tr("Calcium gibt 2 Elektronen ab, jedes Fluor-Atom nimmt eines auf. Man braucht also 2 Fluor-Atome.", "Calcium loses 2 electrons, and each fluorine atom gains one. So you need 2 fluorine atoms.")],
    ok: tr("Es entstehen ein Ca²⁺ und zwei F⁻. Alle Ionen haben eine volle Außenschale, und ihre Ladungen gleichen sich aus.", "One Ca²⁺ and two F⁻ form. All ions have a full outer shell, and their charges balance each other."),
    visual: c => <Transfer c={c} M={20} N={9} start={[1, 1]} solution={[1, 2]} adjust="n" />,
  }),
  {
    mode: "free",
    ask: tr("Welcher Satz beschreibt die Bildung der Ionen richtig?", "Which sentence describes how the ions form?"),
    visual: () => <Row items={[{ Z: 12, E: 10, title: tr("Magnesium-Ion", "Magnesium ion"), ghost: false }, { Z: 8, E: 10, got: 2, title: tr("Oxid-Ion", "Oxide ion") }]} arrows={["2 e⁻ →"]} />,
    answer: tr("Mg²⁺ und O²⁻ entstehen gleichzeitig.", "Mg²⁺ and O²⁻ form at the same time."),
    options: [
      tr("Mg²⁺ entsteht allein.", "Mg²⁺ forms on its own."),
      tr("Mg²⁺ und O²⁻ entstehen gleichzeitig.", "Mg²⁺ and O²⁻ form at the same time."),
      tr("Das Mg-Atom nimmt Elektronen auf.", "The Mg atom gains electrons."),
    ],
    why: {
      [tr("Mg²⁺ entsteht allein.", "Mg²⁺ forms on its own.")]: tr("Die 2 Elektronen verschwinden nicht. Das Sauerstoff-Atom nimmt sie auf und wird zu O²⁻.", "The 2 electrons do not disappear. The oxygen atom gains them and becomes O²⁻."),
      [tr("Das Mg-Atom nimmt Elektronen auf.", "The Mg atom gains electrons.")]: tr("Umgekehrt: Das Magnesium-Atom gibt 2 Elektronen ab und wird dadurch positiv.", "The other way round: the magnesium atom loses 2 electrons and so becomes positive."),
    },
    ok: tr("Was das Metall-Atom abgibt, nimmt das Nichtmetall-Atom auf. Kation und Anion entstehen deshalb immer gleichzeitig.", "What the metal atom loses, the non-metal atom gains. So cation and anion always form at the same time."),
  },
];

export const kapitel1 = (): Kapitel => ({
  id: "atom-ion", nr: 1, stufe: "us",
  title: tr("Vom Atom zum Ion", "From atom to ion"),
  desc: tr("Wie aus Atomen Ionen werden: Elektronen abgeben und aufnehmen, die Ladung aus dem PSE ablesen.", "How atoms become ions: losing and gaining electrons, reading the charge from the periodic table."),
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
      tr("Außenelektronen im Schalenmodell zählen und die Edelgaskonfiguration erkennen.", "Count outer electrons in the shell model and recognise the noble gas configuration."),
      tr("Erklären, wie aus Metall-Atomen Kationen werden, zum Beispiel Na⁺, Mg²⁺ und Al³⁺.", "Explain how metal atoms become cations, for example Na⁺, Mg²⁺ and Al³⁺."),
      tr("Erklären, wie aus Nichtmetall-Atomen Anionen werden, und ihre Ladung aus der Hauptgruppe ablesen.", "Explain how non-metal atoms become anions, and read their charge from the main group."),
      tr("Den Elektronenübergang vom Metall-Atom zum Nichtmetall-Atom beschreiben.", "Describe the electron transfer from the metal atom to the non-metal atom."),
    ],
  },
  explain: [
    [
      tr("**Außenelektronen** sitzen auf der äußersten Schale. Ihre Anzahl ist die Nummer der Hauptgruppe (außer bei Helium). Phosphor steht zum Beispiel in der V. Hauptgruppe und hat 5 Außenelektronen.", "**Outer electrons** sit on the outermost shell. Their number is the number of the main group (except for helium). Phosphorus, for example, is in main group V and has 5 outer electrons."),
      tr("**Edelgase** (VIII. Hauptgruppe) haben eine voll besetzte Außenschale: Helium mit 2, alle anderen mit 8 Elektronen. Das nennt man **Edelgaskonfiguration**.", "**Noble gases** (main group VIII) have a full outer shell: helium with 2, all others with 8 electrons. This is called the **noble gas configuration**."),
      tr("Im Modell gilt der kürzere Weg: Atome mit 1 bis 3 Außenelektronen geben diese ab (außer Wasserstoff und Bor). Atome mit 5 bis 7 nehmen Elektronen auf, bis es 8 sind – Fluor zum Beispiel eines.", "In the model the shorter way applies: atoms with 1 to 3 outer electrons lose them (except hydrogen and boron). Atoms with 5 to 7 gain electrons until there are 8 – fluorine, for example, gains one."),
    ],
    [
      tr("**Metall**-Atome (I. bis III. Hauptgruppe, außer Wasserstoff und Bor) geben ihre Außenelektronen ab. So entstehen positiv geladene Ionen, die **Kationen**.", "**Metal** atoms (main groups I to III, except hydrogen and boron) lose their outer electrons. This forms positively charged ions, the **cations**."),
      tr("Die Ladung ist Protonen minus Elektronen. Ein Lithium-Ion hat 3 Protonen und 2 Elektronen, also die Ladung 1+: Li⁺.", "The charge is protons minus electrons. A lithium ion has 3 protons and 2 electrons, so the charge 1+: Li⁺."),
      tr("Die Ladung eines Metall-Ions ist die Nummer seiner Hauptgruppe. Seine äußerste Schale ist leer – deshalb ist das Kation kleiner als sein Atom.", "The charge of a metal ion is the number of its main group. Its outermost shell is empty – so the cation is smaller than its atom."),
    ],
    [
      tr("**Nichtmetall**-Atome (V. bis VII. Hauptgruppe) nehmen Elektronen auf, bis sie 8 Außenelektronen haben. So entstehen negativ geladene Ionen, die **Anionen**.", "**Non-metal** atoms (main groups V to VII) gain electrons until they have 8 outer electrons. This forms negatively charged ions, the **anions**."),
      tr("Ein Nichtmetall-Atom nimmt so viele Elektronen auf, wie ihm bis 8 fehlen. Fluor (VII. Hauptgruppe) nimmt 1 Elektron auf und wird zu F⁻.", "A non-metal atom gains as many electrons as it lacks to reach 8. Fluorine (main group VII) gains 1 electron and becomes F⁻."),
      tr("Die aufgenommenen Elektronen füllen die äußerste Schale. Das Anion hat so viele Schalen wie sein Atom.", "The gained electrons fill the outermost shell. The anion has as many shells as its atom."),
      tr("Edelgase, Wasserstoff, Bor und die IV. Hauptgruppe bilden in diesem Modell keine einfachen Ionen.", "Noble gases, hydrogen, boron and main group IV form no simple ions in this model."),
    ],
    [
      tr("Reagiert ein Metall mit einem Nichtmetall, gehen Elektronen vom Metall-Atom zum Nichtmetall-Atom über. Dieser **Elektronenübergang** ist unser **Modell der Ionenbildung**.", "When a metal reacts with a non-metal, electrons pass from the metal atom to the non-metal atom. This **electron transfer** is our **model of ion formation**."),
      tr("Kein Elektron geht verloren. Deshalb gleichen sich die Ladungen der entstandenen Ionen aus, zum Beispiel bei Na⁺ und Cl⁻.", "No electron is lost. That is why the charges of the ions formed balance each other, for example in Na⁺ and Cl⁻."),
      tr("Gibt ein Metall-Atom mehr Elektronen ab, als ein Nichtmetall-Atom aufnimmt, braucht man mehrere Nichtmetall-Atome. Ein Calcium-Atom gibt zum Beispiel je ein Elektron an zwei Chlor-Atome ab.", "If a metal atom loses more electrons than one non-metal atom gains, you need several non-metal atoms. A calcium atom, for example, gives one electron each to two chlorine atoms."),
      tr("Im Schalenmodell hat jede Schale eine feste Größe. Die echte Größe der Ionen zeigt es nicht: Ca²⁺ ist kleiner als F⁻.", "In the shell model every shell has a fixed size. It does not show the real size of the ions: Ca²⁺ is smaller than F⁻."),
    ],
  ],
});

