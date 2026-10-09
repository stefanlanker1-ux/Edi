// Kapitel 5: Nebengruppenmetalle (Level II) – mehrere mögliche Ladungen (Kästchenschema: zuerst 4s, dann 3d abgeben),
// römische Zahl im Namen, Ladung aus der Formel, alles zusammen mit mehratomigen Ionen. Ionen nur aus `ions.ts`, nur beständige Stoffe.

import { tr } from "@lern/i18n";
import type { GuideStep } from "@lern/ui";
import type { Kapitel } from "./types.ts";
import { model } from "./model.tsx";
import { ConfigModel, WallModel } from "./k5/models.tsx";
import "./k5/k5.css";

const NE = (de: string, en: string) => tr(de, en);
const notNeutral = () => NE("Noch nicht neutral: Die goldene und die grüne Reihe sind verschieden lang.", "Not neutral yet: the gold and the green row have different lengths.");
const notSmallest = () => NE("Neutral, aber nicht das kleinste Verhältnis – halbiere beide Anzahlen.", "Neutral, but not the smallest ratio – halve both numbers.");

const steps = (): GuideStep[] => [
  // ── 1. Mehrere mögliche Ladungen ──
  model({
    mode: "worked", part: NE("Mehrere mögliche Ladungen", "Several possible charges"),
    say: NE("Hauptgruppenmetalle wie Na, Mg und Al bilden nur ein Ion: Na⁺, Mg²⁺, Al³⁺. Viele **Übergangsmetalle** bilden mehrere Ionen, Eisen zum Beispiel **Fe²⁺** und **Fe³⁺**.",
      "Main group metals such as Na, Mg and Al form only one ion: Na⁺, Mg²⁺, Al³⁺. Many **transition metals** form several ions, iron for example **Fe²⁺** and **Fe³⁺**."),
    ask: NE("Wie wird aus einem Eisen-Atom das Ion Fe²⁺?", "How does an iron atom become the ion Fe²⁺?"),
    lines: [
      NE("Eisen: [Ar] 4s² 3d⁶ – im Kästchenschema 4s und 3d.", "Iron: [Ar] 4s² 3d⁶ – in the box diagram 4s and 3d."),
      NE("Zuerst gehen die Elektronen der äußersten Schale (n = 4): beide 4s-Elektronen.", "First the electrons of the outermost shell (n = 4) go: both 4s electrons."),
      NE("26 Protonen, 24 Elektronen → **Fe²⁺** = [Ar] 3d⁶.", "26 protons, 24 electrons → **Fe²⁺** = [Ar] 3d⁶."),
    ],
    ok: NE("Gefüllt wird 4s vor 3d – abgegeben wird aber auch 4s zuerst.", "4s is filled before 3d – but 4s is also lost first."),
    visual: c => <ConfigModel c={c} Z={26} give={2} />,
  }),
  model({
    mode: "faded",
    say: NE("Tippe ein Kästchen an: Das Teilchen gibt ein Elektron dieser Unterschale ab. Ladung und Kurzschreibweise ändern sich sofort.",
      "Tap a box: the particle loses one electron of that subshell. Charge and short notation change at once."),
    ask: NE("Ergänze: Gib 2 Elektronen ab, sodass Fe²⁺ entsteht. Dann prüfe.", "Complete: remove 2 electrons so that Fe²⁺ forms. Then check."),
    lines: [NE("Eisen: [Ar] 4s² 3d⁶.", "Iron: [Ar] 4s² 3d⁶."), NE("Abgegeben werden zuerst die Elektronen der äußersten Schale.", "The electrons of the outermost shell are lost first."), "Fe²⁺ = {?}"],
    answer: "[Ar] 3d⁶",
    why: {
      "[Ar] 4s² 3d⁶": NE("Noch das Atom – tippe Kästchen an, um Elektronen abzugeben.", "Still the atom – tap boxes to remove electrons."),
      "[Ar] 4s¹ 3d⁶": NE("Das ist erst Fe⁺ – es fehlt noch ein Elektron.", "That is only Fe⁺ – one more electron must go."),
      "[Ar] 4s² 3d⁴": NE("Du hast 3d zuerst abgegeben. Die 4s-Elektronen sind außen und gehen zuerst.", "You removed 3d first. The 4s electrons are outside and go first."),
      "[Ar] 4s¹ 3d⁵": NE("Ein Elektron kam aus 3d. Zuerst gehen beide 4s-Elektronen.", "One electron came from 3d. Both 4s electrons go first."),
      "[Ar] 3d⁵": NE("Das sind 3 Elektronen, also Fe³⁺. Für Fe²⁺ gibst du nur 2 ab.", "Those are 3 electrons, so Fe³⁺. For Fe²⁺ you remove only 2."),
    },
    tip: NE("Welche Unterschale gehört zur äußersten Schale mit n = 4?", "Which subshell belongs to the outermost shell with n = 4?"),
    ok: NE("Fe²⁺ = [Ar] 3d⁶: Beide 4s-Elektronen sind weg, 3d⁶ bleibt wie im Atom.", "Fe²⁺ = [Ar] 3d⁶: both 4s electrons are gone, 3d⁶ stays as in the atom."),
    visual: c => <ConfigModel c={c} Z={26} give={2} />,
  }),
  model({
    mode: "free",
    ask: NE("Jetzt du: Mache aus Eisen das Ion Fe³⁺. Dann prüfe.", "Your turn: turn iron into the ion Fe³⁺. Then check."),
    answer: "[Ar] 3d⁵",
    why: {
      "[Ar] 4s² 3d³": NE("Du hast nur 3d-Elektronen abgegeben. Zuerst gehen beide 4s-Elektronen, dann eins aus 3d.", "You removed only 3d electrons. Both 4s electrons go first, then one from 3d."),
      "[Ar] 4s¹ 3d⁴": NE("Ein 4s-Elektron ist noch da. Beide 4s-Elektronen gehen vor den 3d-Elektronen.", "One 4s electron is still there. Both 4s electrons go before the 3d electrons."),
      "[Ar] 3d⁶": NE("Das ist Fe²⁺. Für Fe³⁺ fehlt noch ein Elektron aus 3d.", "That is Fe²⁺. For Fe³⁺ one more electron from 3d must go."),
      "[Ar] 4s² 3d⁶": NE("Noch das Atom – tippe Kästchen an, um Elektronen abzugeben.", "Still the atom – tap boxes to remove electrons."),
    },
    tip: NE("Fe³⁺ hat 3 Elektronen weniger als das Atom. Welche gehen zuerst?", "Fe³⁺ has 3 electrons fewer than the atom. Which go first?"),
    lines: [NE("4s² ab, dann 1 Elektron aus 3d: [Ar] 3d⁵ = Fe³⁺.", "Remove 4s², then 1 electron from 3d: [Ar] 3d⁵ = Fe³⁺.")],
    ok: NE("Fe³⁺ = [Ar] 3d⁵: In jedem 3d-Kästchen steht ein Elektron – eine **halb besetzte** d-Unterschale.", "Fe³⁺ = [Ar] 3d⁵: each 3d box holds one electron – a **half-filled** d subshell."),
    visual: c => <ConfigModel c={c} Z={26} give={3} />,
  }),
  model({
    mode: "free",
    say: NE("Kupfer ist eine Ausnahme: [Ar] 4s¹ 3d¹⁰. Kupfer bildet **Cu⁺** und **Cu²⁺**.", "Copper is an exception: [Ar] 4s¹ 3d¹⁰. Copper forms **Cu⁺** and **Cu²⁺**."),
    ask: NE("Mache aus Kupfer das Ion Cu²⁺. Dann prüfe.", "Turn copper into the ion Cu²⁺. Then check."),
    answer: "[Ar] 3d⁹",
    why: {
      "[Ar] 4s¹ 3d⁸": NE("Du hast 3d zuerst abgegeben. Das 4s-Elektron ist außen und geht zuerst.", "You removed 3d first. The 4s electron is outside and goes first."),
      "[Ar] 3d¹⁰": NE("Das ist Cu⁺. Für Cu²⁺ fehlt noch ein Elektron aus 3d.", "That is Cu⁺. For Cu²⁺ one more electron from 3d must go."),
      "[Ar] 4s¹ 3d¹⁰": NE("Noch das Atom – gib 2 Elektronen ab.", "Still the atom – remove 2 electrons."),
      "[Ar] 3d⁸": NE("Das sind 3 Elektronen – eins zu viel für Cu²⁺.", "Those are 3 electrons – one too many for Cu²⁺."),
    },
    tip: NE("Kupfer hat nur ein 4s-Elektron. Woher kommt das zweite?", "Copper has only one 4s electron. Where does the second come from?"),
    lines: [NE("Cu⁺ = [Ar] 3d¹⁰, Cu²⁺ = [Ar] 3d⁹.", "Cu⁺ = [Ar] 3d¹⁰, Cu²⁺ = [Ar] 3d⁹.")],
    ok: NE("Cu²⁺ = [Ar] 3d⁹: erst das 4s-Elektron, dann eins aus 3d.", "Cu²⁺ = [Ar] 3d⁹: first the 4s electron, then one from 3d."),
    visual: c => <ConfigModel c={c} Z={29} give={2} />,
  }),
  model({
    mode: "free",
    say: NE("Manche Übergangsmetalle bilden nur ein Ion: Zink nur **Zn²⁺**, Silber nur **Ag⁺**.", "Some transition metals form only one ion: zinc only **Zn²⁺**, silver only **Ag⁺**."),
    ask: NE("Mache aus Zink das Ion Zn²⁺. Dann prüfe.", "Turn zinc into the ion Zn²⁺. Then check."),
    answer: "[Ar] 3d¹⁰",
    why: {
      "[Ar] 4s² 3d⁸": NE("Du hast 3d zuerst abgegeben. Die 4s-Elektronen sind außen und gehen zuerst.", "You removed 3d first. The 4s electrons are outside and go first."),
      "[Ar] 4s¹ 3d⁹": NE("Ein Elektron kam aus 3d. Zuerst gehen beide 4s-Elektronen.", "One electron came from 3d. Both 4s electrons go first."),
      "[Ar] 4s¹ 3d¹⁰": NE("Das ist erst ein Elektron. Zn²⁺ hat 2 Elektronen weniger als das Atom.", "That is only one electron. Zn²⁺ has 2 electrons fewer than the atom."),
      "[Ar] 4s² 3d¹⁰": NE("Noch das Atom – tippe Kästchen an, um Elektronen abzugeben.", "Still the atom – tap boxes to remove electrons."),
    },
    tip: NE("Zink: [Ar] 4s² 3d¹⁰. Welche 2 Elektronen sind ganz außen?", "Zinc: [Ar] 4s² 3d¹⁰. Which 2 electrons are furthest out?"),
    lines: [NE("Zink gibt beide 4s-Elektronen ab: Zn²⁺ = [Ar] 3d¹⁰.", "Zinc loses both 4s electrons: Zn²⁺ = [Ar] 3d¹⁰.")],
    ok: NE("Zn²⁺ = [Ar] 3d¹⁰: eine **voll besetzte** d-Unterschale. Zink bildet nur dieses Ion.", "Zn²⁺ = [Ar] 3d¹⁰: a **full** d subshell. Zinc forms only this ion."),
    visual: c => <ConfigModel c={c} Z={30} give={2} />,
  }),
  {
    mode: "free",
    ask: NE("Welches Metall bildet nur **ein** Ion?", "Which metal forms only **one** ion?"),
    options: [NE("Kupfer", "Copper"), NE("Silber", "Silver"), NE("Eisen", "Iron")], answer: NE("Silber", "Silver"),
    why: { [NE("Kupfer", "Copper")]: NE("Kupfer bildet zwei Ionen: Cu⁺ und Cu²⁺.", "Copper forms two ions: Cu⁺ and Cu²⁺."), [NE("Eisen", "Iron")]: NE("Eisen bildet zwei Ionen: Fe²⁺ und Fe³⁺.", "Iron forms two ions: Fe²⁺ and Fe³⁺.") },
    ok: NE("Silber bildet nur Ag⁺ – so wie Zink nur Zn²⁺.", "Silver forms only Ag⁺ – just as zinc forms only Zn²⁺."),
  },
  {
    mode: "free",
    ask: NE("Was beschreibt Fe³⁺ = [Ar] 3d⁵ richtig?", "What describes Fe³⁺ = [Ar] 3d⁵ correctly?"),
    options: [
      NE("Eisen will 3 Elektronen abgeben.", "Iron wants to lose 3 electrons."),
      NE("3d halb besetzt: besonders beständig.", "3d half-filled: especially stable."),
      NE("Fe³⁺ hat Edelgaskonfiguration.", "Fe³⁺ has a noble gas configuration."),
      NE("Fe³⁺ hat 3 Elektronen mehr als Fe.", "Fe³⁺ has 3 electrons more than Fe."),
    ],
    answer: NE("3d halb besetzt: besonders beständig.", "3d half-filled: especially stable."),
    why: {
      [NE("Eisen will 3 Elektronen abgeben.", "Iron wants to lose 3 electrons.")]: NE("Atome wollen nichts. Beschreibe, was vorliegt: 3d⁵ ist halb besetzt.", "Atoms do not want anything. Describe what is there: 3d⁵ is half-filled."),
      [NE("Fe³⁺ hat Edelgaskonfiguration.", "Fe³⁺ has a noble gas configuration.")]: NE("Argon ist nur [Ar]. Fe³⁺ hat noch 5 Elektronen in 3d.", "Argon is only [Ar]. Fe³⁺ still has 5 electrons in 3d."),
      [NE("Fe³⁺ hat 3 Elektronen mehr als Fe.", "Fe³⁺ has 3 electrons more than Fe.")]: NE("Kationen haben weniger Elektronen: 26 − 3 = 23.", "Cations have fewer electrons: 26 − 3 = 23."),
    },
    ok: NE("Halb besetzt (d⁵) und voll besetzt (d¹⁰) sind besonders beständig.", "Half-filled (d⁵) and full (d¹⁰) are especially stable."),
  },

  // ── 2. Römische Zahl im Namen ──
  model({
    mode: "worked", part: NE("Römische Zahl im Namen", "Roman numeral in the name"),
    say: NE("Bildet ein Metall mehrere Ionen, steht seine Ladung als **römische Zahl** in Klammern im Namen. Eisen(II) = Fe²⁺, Eisen(III) = Fe³⁺.",
      "If a metal forms several ions, its charge is a **Roman numeral** in the name. Iron(II) = Fe²⁺, iron(III) = Fe³⁺."),
    ask: NE("Welche Formel hat Eisen(III)-chlorid?", "What is the formula of iron(III) chloride?"),
    lines: [
      NE("Eisen(III) = Fe³⁺, Chlorid = Cl⁻.", "Iron(III) = Fe³⁺, chloride = Cl⁻."),
      NE("Ausgleich: 1 · (3+) = 3+ und 3 · (1−) = 3−.", "Balance: 1 · (3+) = 3+ and 3 · (1−) = 3−."),
      NE("→ **FeCl₃**. Die III ist die Ladung, keine Anzahl.", "→ **FeCl₃**. The III is the charge, not a number of particles."),
    ],
    ok: NE("Römische Zahl = Ladung des Metall-Ions.", "Roman numeral = charge of the metal ion."),
    visual: c => <WallModel c={c} Z={26} anion="Cl-" charges={[2, 3]} numerals stepA report="formula" given={NE("Eisen(III)-chlorid", "Iron(III) chloride")}
      init={{ q: 3, nC: 1, nA: 3 }} sol={{ q: 3, nC: 1, nA: 3 }} />,
  }),
  model({
    mode: "faded",
    say: NE("Wähle die römische Zahl: Die Ladung im goldenen Baustein ändert sich sofort.", "Choose the Roman numeral: the charge in the gold block changes at once."),
    ask: NE("Ergänze: Baue Eisen(II)-chlorid. Dann prüfe.", "Complete: build iron(II) chloride. Then check."),
    lines: [NE("Eisen(II) = Fe²⁺.", "Iron(II) = Fe²⁺."), NE("2 · (1−) = 2− gleicht 2+ aus.", "2 · (1−) = 2− balances 2+."), NE("Formel: {?}", "Formula: {?}")],
    answer: "FeCl₂",
    why: { "FeCl₃": NE("Das ist Eisen(III)-chlorid. Eisen(II) heißt Fe²⁺.", "That is iron(III) chloride. Iron(II) means Fe²⁺."), "≠": notNeutral() },
    tip: NE("Welche Ladung steckt in (II)? Wie viele Cl⁻ gleichen sie aus?", "Which charge is in (II)? How many Cl⁻ balance it?"),
    ok: NE("Eisen(II)-chlorid = FeCl₂: ein Fe²⁺, zwei Cl⁻.", "Iron(II) chloride = FeCl₂: one Fe²⁺, two Cl⁻."),
    visual: c => <WallModel c={c} Z={26} anion="Cl-" charges={[2, 3]} numerals stepA report="formula" given={NE("Eisen(II)-chlorid", "Iron(II) chloride")}
      init={{ q: 3, nC: 1, nA: 1 }} sol={{ q: 2, nC: 1, nA: 2 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Jetzt du: Baue Kupfer(I)-oxid. Dann prüfe.", "Your turn: build copper(I) oxide. Then check."),
    answer: "Cu₂O",
    why: {
      "CuO": NE("Das ist Kupfer(II)-oxid mit Cu²⁺. (I) heißt Cu⁺.", "That is copper(II) oxide with Cu²⁺. (I) means Cu⁺."),
      "Cu₂O₂": NE("Das ist Kupfer(II)-oxid, doppelt gezählt. (I) heißt Cu⁺.", "That is copper(II) oxide, counted twice. (I) means Cu⁺."),
      "Cu₄O₂": notSmallest(), "≠": notNeutral(),
    },
    tip: NE("(I) heißt 1+. Wie viele Cu⁺ gleichen ein O²⁻ aus?", "(I) means 1+. How many Cu⁺ balance one O²⁻?"),
    lines: [NE("2 · (1+) = 2+ und 1 · (2−) = 2− → Cu₂O.", "2 · (1+) = 2+ and 1 · (2−) = 2− → Cu₂O.")],
    ok: NE("Kupfer(I)-oxid = Cu₂O: zwei Cu⁺ gleichen ein O²⁻ aus.", "Copper(I) oxide = Cu₂O: two Cu⁺ balance one O²⁻."),
    visual: c => <WallModel c={c} Z={29} anion="O2-" charges={[1, 2]} numerals stepC stepA report="formula" given={NE("Kupfer(I)-oxid", "Copper(I) oxide")}
      init={{ q: 2, nC: 1, nA: 2 }} sol={{ q: 1, nC: 2, nA: 1 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Baue Eisen(III)-oxid. Dann prüfe.", "Build iron(III) oxide. Then check."),
    answer: "Fe₂O₃",
    why: { "FeO": NE("Das ist Eisen(II)-oxid mit Fe²⁺. (III) heißt Fe³⁺.", "That is iron(II) oxide with Fe²⁺. (III) means Fe³⁺."), "Fe₄O₆": notSmallest(), "≠": notNeutral() },
    tip: NE("3+ und 2−: Bei welcher Anzahl sind beide Reihen gleich lang?", "3+ and 2−: at which numbers are both rows the same length?"),
    lines: [NE("2 · (3+) = 6+ und 3 · (2−) = 6− → Fe₂O₃.", "2 · (3+) = 6+ and 3 · (2−) = 6− → Fe₂O₃.")],
    ok: NE("Eisen(III)-oxid = Fe₂O₃: 2 · (3+) = 6+ und 3 · (2−) = 6−.", "Iron(III) oxide = Fe₂O₃: 2 · (3+) = 6+ and 3 · (2−) = 6−."),
    visual: c => <WallModel c={c} Z={26} anion="O2-" charges={[2, 3]} numerals stepC stepA report="formula" given={NE("Eisen(III)-oxid", "Iron(III) oxide")}
      init={{ q: 3, nC: 1, nA: 1 }} sol={{ q: 3, nC: 2, nA: 3 }} />,
  }),
  model({
    mode: "worked",
    say: NE("Bildet ein Metall nur ein Ion, steht **keine** römische Zahl im Namen.", "If a metal forms only one ion, there is **no** Roman numeral in the name."),
    ask: NE("Welche Formel hat Zinkchlorid?", "What is the formula of zinc chloride?"),
    lines: [
      NE("Zink bildet nur Zn²⁺ – die Ladung ist klar, also keine Zahl.", "Zinc forms only Zn²⁺ – the charge is clear, so no numeral."),
      NE("1 · (2+) = 2+ und 2 · (1−) = 2−.", "1 · (2+) = 2+ and 2 · (1−) = 2−."),
      NE("→ **ZnCl₂**, Name: Zinkchlorid.", "→ **ZnCl₂**, name: zinc chloride."),
    ],
    ok: NE("Keine Zahl bei Zink und Silber – wie bei Natrium oder Calcium.", "No numeral for zinc and silver – as for sodium or calcium."),
    visual: c => <WallModel c={c} Z={30} anion="Cl-" report="formula" given={NE("Zinkchlorid", "Zinc chloride")} init={{ q: 2, nC: 1, nA: 2 }} sol={{ q: 2, nC: 1, nA: 2 }} />,
  }),
  {
    mode: "faded",
    ask: NE("Ergänze: Wie heißt AgCl?", "Complete: what is AgCl called?"),
    lines: [NE("Silber bildet nur Ag⁺ – keine römische Zahl.", "Silver forms only Ag⁺ – no Roman numeral."), NE("Name: {?}", "Name: {?}")],
    options: [NE("Silber(I)-chlorid", "Silver(I) chloride"), NE("Silber(II)-chlorid", "Silver(II) chloride"), NE("Silberchlorid", "Silver chloride")],
    answer: NE("Silberchlorid", "Silver chloride"),
    why: {
      [NE("Silber(I)-chlorid", "Silver(I) chloride")]: NE("Silber bildet nur Ag⁺ – die Zahl lässt man weg.", "Silver forms only Ag⁺ – the numeral is left out."),
      [NE("Silber(II)-chlorid", "Silver(II) chloride")]: NE("Ein Cl⁻ bringt nur 1−. Und Silber bildet nur Ag⁺ – ohne Zahl.", "One Cl⁻ brings only 1−. And silver forms only Ag⁺ – no numeral."),
    },
    ok: NE("AgCl = Silberchlorid: Ag⁺ und Cl⁻, ohne Zahl.", "AgCl = silver chloride: Ag⁺ and Cl⁻, without a numeral."),
  },

  // ── 3. Ladung aus der Formel ──
  model({
    mode: "worked", part: NE("Ladung aus der Formel", "Charge from the formula"),
    say: NE("Aus der Formel rechnest du die Ladung des Metall-Ions zurück. Die Anionen geben die negative Ladung vor.", "From the formula you work back to the charge of the metal ion. The anions give the negative charge."),
    ask: NE("Welche Ladung hat Eisen in FeCl₃?", "What is the charge of iron in FeCl₃?"),
    lines: [
      NE("3 Cl⁻: 3 · (1−) = 3−.", "3 Cl⁻: 3 · (1−) = 3−."),
      NE("Ein Fe gleicht 3− aus → Fe³⁺.", "One Fe balances 3− → Fe³⁺."),
      NE("→ Name: Eisen(III)-chlorid.", "→ Name: iron(III) chloride."),
    ],
    ok: NE("Erst die Anionen-Ladung ausrechnen, dann auf die Metall-Ionen verteilen.", "First work out the anion charge, then share it among the metal ions."),
    visual: c => <WallModel c={c} Z={26} anion="Cl-" charges={[1, 2, 3]} report="charge" given="FeCl3" init={{ q: 3, nC: 1, nA: 3 }} sol={{ q: 3, nC: 1, nA: 3 }} />,
  }),
  model({
    mode: "faded",
    ask: NE("Ergänze: Welche Ladung hat jedes Eisen-Ion in Fe₂O₃? Wähle und prüfe.", "Complete: what is the charge of each iron ion in Fe₂O₃? Choose and check."),
    lines: [NE("3 O²⁻: 3 · (2−) = 6−.", "3 O²⁻: 3 · (2−) = 6−."), NE("2 Fe-Ionen tragen zusammen 6+.", "2 Fe ions carry 6+ together."), NE("Jedes Fe-Ion: {?}", "Each Fe ion: {?}")],
    answer: "3+",
    why: {
      "2+": NE("2 · (2+) = 4+, aber 3 · (2−) = 6−. Die goldene Reihe ist zu kurz.", "2 · (2+) = 4+, but 3 · (2−) = 6−. The gold row is too short."),
      "1+": NE("2 · (1+) = 2+ – viel zu wenig für 6−.", "2 · (1+) = 2+ – far too little for 6−."),
    },
    tip: NE("Rechne die negative Ladung aus und verteile sie auf die Fe-Ionen.", "Work out the negative charge and share it among the Fe ions."),
    ok: NE("Fe₂O₃: 6− auf 2 Fe → je 3+ → Eisen(III)-oxid.", "Fe₂O₃: 6− shared by 2 Fe → 3+ each → iron(III) oxide."),
    visual: c => <WallModel c={c} Z={26} anion="O2-" charges={[1, 2, 3]} report="charge" given="Fe2O3" init={{ q: 2, nC: 2, nA: 3 }} sol={{ q: 3, nC: 2, nA: 3 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Jetzt du: Welche Ladung hat jedes Kupfer-Ion in Cu₂O?", "Your turn: what is the charge of each copper ion in Cu₂O?"),
    answer: "1+",
    why: {
      "2+": NE("Die 2 in Cu₂ ist die Anzahl, nicht die Ladung. 2 · (2+) = 4+, aber O²⁻ bringt nur 2−.", "The 2 in Cu₂ is the number, not the charge. 2 · (2+) = 4+, but O²⁻ brings only 2−."),
      "3+": NE("2 · (3+) = 6+ – viel mehr als 2−.", "2 · (3+) = 6+ – much more than 2−."),
    },
    tip: NE("Ein O²⁻ bringt 2−. Wie verteilt sich das auf die Cu-Ionen?", "One O²⁻ brings 2−. How is that shared among the Cu ions?"),
    lines: [NE("1 · (2−) = 2− auf 2 Cu → je 1+.", "1 · (2−) = 2− shared by 2 Cu → 1+ each.")],
    ok: NE("Cu₂O: 2− auf 2 Cu → je 1+ → Kupfer(I)-oxid.", "Cu₂O: 2− shared by 2 Cu → 1+ each → copper(I) oxide."),
    visual: c => <WallModel c={c} Z={29} anion="O2-" charges={[1, 2, 3]} report="charge" given="Cu2O" init={{ q: 2, nC: 2, nA: 1 }} sol={{ q: 1, nC: 2, nA: 1 }} />,
  }),
  model({
    mode: "free",
    say: NE("Auch **Blei** (Pb, Gruppe 14) bildet mehr als ein Ion. Darum steht bei Blei eine römische Zahl.", "**Lead** (Pb, group 14) also forms more than one ion. So lead gets a Roman numeral."),
    ask: NE("Welche Ladung hat Blei in PbO?", "What is the charge of lead in PbO?"),
    answer: "2+",
    why: {
      "4+": NE("1 · (4+) = 4+, aber 1 · (2−) = 2−.", "1 · (4+) = 4+, but 1 · (2−) = 2−."),
      "3+": NE("3+ ist mehr als die 2− von O²⁻.", "3+ is more than the 2− of O²⁻."),
      "1+": NE("1+ gleicht die 2− von O²⁻ nicht aus.", "1+ does not balance the 2− of O²⁻."),
    },
    tip: NE("Ein Pb, ein O²⁻: Welche Ladung gleicht O²⁻ genau aus?", "One Pb, one O²⁻: which charge balances O²⁻ exactly?"),
    lines: [NE("1 · (2−) = 2− → Pb²⁺ → Blei(II)-oxid.", "1 · (2−) = 2− → Pb²⁺ → lead(II) oxide.")],
    ok: NE("PbO: Pb²⁺ und O²⁻ → Blei(II)-oxid.", "PbO: Pb²⁺ and O²⁻ → lead(II) oxide."),
    visual: c => <WallModel c={c} Z={82} anion="O2-" charges={[1, 2, 3, 4]} report="charge" given="PbO" init={{ q: 4, nC: 1, nA: 1 }} sol={{ q: 2, nC: 1, nA: 1 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Wie heißt CuCl₂? Wähle die römische Zahl und prüfe.", "What is CuCl₂ called? Choose the Roman numeral and check."),
    answer: NE("Kupfer(II)-chlorid", "Copper(II) chloride"),
    why: {
      [NE("Kupfer(I)-chlorid", "Copper(I) chloride")]: NE("Cu⁺ bringt 1+, aber 2 · (1−) = 2−. Die Wand ist nicht ausgeglichen.", "Cu⁺ brings 1+, but 2 · (1−) = 2−. The wall is not balanced."),
      [NE("Kupfer(III)-chlorid", "Copper(III) chloride")]: NE("3+ ist mehr als 2 · (1−) = 2−.", "3+ is more than 2 · (1−) = 2−."),
    },
    tip: NE("Zähle die Cl⁻ und rechne ihre Ladung aus.", "Count the Cl⁻ and work out their charge."),
    lines: [NE("2 · (1−) = 2− → Cu²⁺ → Kupfer(II)-chlorid.", "2 · (1−) = 2− → Cu²⁺ → copper(II) chloride.")],
    ok: NE("CuCl₂: 2 · (1−) = 2− → Cu²⁺ → Kupfer(II)-chlorid.", "CuCl₂: 2 · (1−) = 2− → Cu²⁺ → copper(II) chloride."),
    visual: c => <WallModel c={c} Z={29} anion="Cl-" charges={[1, 2, 3]} numerals report="name" given="CuCl2" init={{ q: 1, nC: 1, nA: 2 }} sol={{ q: 2, nC: 1, nA: 2 }} />,
  }),
  {
    mode: "free",
    ask: NE("Wie heißt Cu₂S? (S²⁻ = Sulfid-Ion)", "What is Cu₂S called? (S²⁻ = sulfide ion)"),
    options: [NE("Kupfer(II)-sulfid", "Copper(II) sulfide"), NE("Kupfer(I)-sulfid", "Copper(I) sulfide"), NE("Kupfersulfid", "Copper sulfide"), NE("Kupfer(I)-sulfat", "Copper(I) sulfate")],
    answer: NE("Kupfer(I)-sulfid", "Copper(I) sulfide"),
    why: {
      [NE("Kupfer(II)-sulfid", "Copper(II) sulfide")]: NE("Die 2 in Cu₂ ist die Anzahl. 2− auf 2 Cu → je 1+.", "The 2 in Cu₂ is the number. 2− shared by 2 Cu → 1+ each."),
      [NE("Kupfersulfid", "Copper sulfide")]: NE("Kupfer bildet Cu⁺ und Cu²⁺ – die römische Zahl ist nötig.", "Copper forms Cu⁺ and Cu²⁺ – the Roman numeral is needed."),
      [NE("Kupfer(I)-sulfat", "Copper(I) sulfate")]: NE("Sulfat ist SO₄²⁻. Hier steht nur S²⁻: Sulfid.", "Sulfate is SO₄²⁻. Here there is only S²⁻: sulfide."),
    },
    ok: NE("Cu₂S: S²⁻ bringt 2−, auf 2 Cu → je 1+ → Kupfer(I)-sulfid.", "Cu₂S: S²⁻ brings 2−, shared by 2 Cu → 1+ each → copper(I) sulfide."),
  },

  // ── 4. Alles zusammen ──
  model({
    mode: "worked", part: NE("Alles zusammen", "Putting it together"),
    say: NE("Mit **mehratomigen Ionen** geht es genauso. Mehr als ein mehratomiges Ion steht in **Klammern**.", "It works the same with **polyatomic ions**. More than one polyatomic ion goes in **brackets**."),
    ask: NE("Welche Formel hat Eisen(III)-sulfat?", "What is the formula of iron(III) sulfate?"),
    lines: [
      NE("Eisen(III) = Fe³⁺, Sulfat = SO₄²⁻.", "Iron(III) = Fe³⁺, sulfate = SO₄²⁻."),
      NE("2 · (3+) = 6+ und 3 · (2−) = 6−.", "2 · (3+) = 6+ and 3 · (2−) = 6−."),
      NE("→ **Fe₂(SO₄)₃** – die 3 gilt für das ganze Sulfat-Ion.", "→ **Fe₂(SO₄)₃** – the 3 applies to the whole sulfate ion."),
    ],
    ok: NE("Name → Ladung → ausgleichen → Klammern, wo nötig.", "Name → charge → balance → brackets where needed."),
    visual: c => <WallModel c={c} Z={26} anion="SO42-" charges={[2, 3]} numerals stepC stepA report="formula" given={NE("Eisen(III)-sulfat", "Iron(III) sulfate")}
      init={{ q: 3, nC: 2, nA: 3 }} sol={{ q: 3, nC: 2, nA: 3 }} />,
  }),
  model({
    mode: "faded",
    ask: NE("Ergänze: Baue Kupfer(II)-nitrat. Dann prüfe.", "Complete: build copper(II) nitrate. Then check."),
    lines: [NE("Kupfer(II) = Cu²⁺, Nitrat = NO₃⁻.", "Copper(II) = Cu²⁺, nitrate = NO₃⁻."), NE("1 · (2+) = 2+ und 2 · (1−) = 2−.", "1 · (2+) = 2+ and 2 · (1−) = 2−."), NE("Formel: {?}", "Formula: {?}")],
    answer: "Cu(NO₃)₂",
    why: {
      "CuNO₃": NE("Das wäre Kupfer(I)-nitrat – das gibt es nicht beständig. (II) heißt Cu²⁺.", "That would be copper(I) nitrate – it is not stable. (II) means Cu²⁺."),
      "Cu₂(NO₃)₄": notSmallest(), "≠": notNeutral(),
    },
    tip: NE("(II) heißt 2+. Wie viele NO₃⁻ gleichen das aus?", "(II) means 2+. How many NO₃⁻ balance that?"),
    ok: NE("Cu(NO₃)₂: zwei Nitrat-Ionen, darum Klammern.", "Cu(NO₃)₂: two nitrate ions, so brackets."),
    visual: c => <WallModel c={c} Z={29} anion="NO3-" charges={[1, 2]} numerals stepC stepA report="formula" given={NE("Kupfer(II)-nitrat", "Copper(II) nitrate")}
      init={{ q: 2, nC: 1, nA: 1 }} sol={{ q: 2, nC: 1, nA: 2 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Jetzt du: Baue Eisen(II)-hydroxid. Dann prüfe.", "Your turn: build iron(II) hydroxide. Then check."),
    answer: "Fe(OH)₂",
    why: { "Fe(OH)₃": NE("Das ist Eisen(III)-hydroxid. (II) heißt Fe²⁺.", "That is iron(III) hydroxide. (II) means Fe²⁺."), "Fe₂(OH)₄": notSmallest(), "≠": notNeutral() },
    tip: NE("Hydroxid ist OH⁻. Wie viele davon gleichen Fe²⁺ aus?", "Hydroxide is OH⁻. How many of them balance Fe²⁺?"),
    lines: [NE("1 · (2+) = 2+ und 2 · (1−) = 2− → Fe(OH)₂.", "1 · (2+) = 2+ and 2 · (1−) = 2− → Fe(OH)₂.")],
    ok: NE("Fe(OH)₂: Die Klammer zeigt zwei ganze OH⁻-Ionen.", "Fe(OH)₂: the brackets show two whole OH⁻ ions."),
    visual: c => <WallModel c={c} Z={26} anion="OH-" charges={[2, 3]} numerals stepC stepA report="formula" given={NE("Eisen(II)-hydroxid", "Iron(II) hydroxide")}
      init={{ q: 3, nC: 1, nA: 1 }} sol={{ q: 2, nC: 1, nA: 2 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Wie heißt FePO₄? Wähle die römische Zahl und prüfe.", "What is FePO₄ called? Choose the Roman numeral and check."),
    answer: NE("Eisen(III)-phosphat", "Iron(III) phosphate"),
    why: {
      [NE("Eisen(II)-phosphat", "Iron(II) phosphate")]: NE("Phosphat ist PO₄³⁻ und bringt 3−. Fe²⁺ gleicht das nicht aus.", "Phosphate is PO₄³⁻ and brings 3−. Fe²⁺ does not balance that."),
      [NE("Eisen(I)-phosphat", "Iron(I) phosphate")]: NE("1+ ist viel weniger als 3−.", "1+ is much less than 3−."),
    },
    tip: NE("Welche Ladung hat das Phosphat-Ion?", "What is the charge of the phosphate ion?"),
    lines: [NE("PO₄³⁻ bringt 3− → Fe³⁺ → Eisen(III)-phosphat.", "PO₄³⁻ brings 3− → Fe³⁺ → iron(III) phosphate.")],
    ok: NE("FePO₄: 1 · (3−) = 3− → Fe³⁺ → Eisen(III)-phosphat.", "FePO₄: 1 · (3−) = 3− → Fe³⁺ → iron(III) phosphate."),
    visual: c => <WallModel c={c} Z={26} anion="PO43-" charges={[1, 2, 3]} numerals report="name" given="FePO4" init={{ q: 2, nC: 1, nA: 1 }} sol={{ q: 3, nC: 1, nA: 1 }} />,
  }),
  {
    mode: "free",
    ask: NE("Welche Formel hat Silbernitrat?", "What is the formula of silver nitrate?"),
    options: ["Ag(NO₃)₂", "AgNO₂", "AgNO₃", "Ag₃N"], answer: "AgNO₃",
    why: {
      "Ag(NO₃)₂": NE("Silber bildet nur Ag⁺ – ein NO₃⁻ gleicht es aus.", "Silver forms only Ag⁺ – one NO₃⁻ balances it."),
      "AgNO₂": NE("NO₂⁻ ist Nitrit. Nitrat ist NO₃⁻.", "NO₂⁻ is nitrite. Nitrate is NO₃⁻."),
      "Ag₃N": NE("Das wäre ein Nitrid mit N³⁻. Nitrat ist NO₃⁻.", "That would be a nitride with N³⁻. Nitrate is NO₃⁻."),
    },
    ok: NE("Silbernitrat = AgNO₃: 1 · (1+) = 1+ und 1 · (1−) = 1−.", "Silver nitrate = AgNO₃: 1 · (1+) = 1+ and 1 · (1−) = 1−."),
  },
  {
    mode: "free",
    ask: NE("Wie heißt Fe(OH)₃?", "What is Fe(OH)₃ called?"),
    options: [NE("Eisen(I)-hydroxid", "Iron(I) hydroxide"), NE("Eisenhydroxid", "Iron hydroxide"), NE("Eisen(III)-oxid", "Iron(III) oxide"), NE("Eisen(III)-hydroxid", "Iron(III) hydroxide")],
    answer: NE("Eisen(III)-hydroxid", "Iron(III) hydroxide"),
    why: {
      [NE("Eisen(I)-hydroxid", "Iron(I) hydroxide")]: NE("Ein Fe, aber 3 OH⁻: 3 · (1−) = 3− → Fe³⁺.", "One Fe, but 3 OH⁻: 3 · (1−) = 3− → Fe³⁺."),
      [NE("Eisenhydroxid", "Iron hydroxide")]: NE("Eisen bildet Fe²⁺ und Fe³⁺ – die römische Zahl ist nötig.", "Iron forms Fe²⁺ and Fe³⁺ – the Roman numeral is needed."),
      [NE("Eisen(III)-oxid", "Iron(III) oxide")]: NE("OH⁻ heißt Hydroxid. Oxid ist O²⁻.", "OH⁻ is called hydroxide. Oxide is O²⁻."),
    },
    ok: NE("Fe(OH)₃: 3 · (1−) = 3− → Fe³⁺ → Eisen(III)-hydroxid.", "Fe(OH)₃: 3 · (1−) = 3− → Fe³⁺ → iron(III) hydroxide."),
  },
];

const KNOWN = () => [
  ...["Ion", "Kation", "Anion", "Elektron", "Proton", "Ladung", "neutral", "Übergangsmetalle", "Hauptgruppe", "Gruppe", "Schale", "Unterschale", "d-Unterschale",
    "Kästchenschema", "Kurzschreibweise", "Edelgaskonfiguration", "Edelgaskern", "Orbital", "Ionenwand", "Formel", "Ionengitter", "mehratomige Ionen", "Klammern",
    "Chlorid", "Oxid", "Sulfid", "Nitrid", "Hydroxid", "Nitrat", "Nitrit", "Sulfat", "Sulfit", "Phosphat", "Carbonat",
    "Eisen", "Kupfer", "Zink", "Silber", "Blei", "Natrium", "Magnesium", "Aluminium", "Calcium"].map((de, i) => tr(de, KNOWN_EN[i])),
];
const KNOWN_EN = ["ion", "cation", "anion", "electron", "proton", "charge", "neutral", "transition metals", "main group", "group", "shell", "subshell", "d subshell",
  "box diagram", "short notation", "noble gas configuration", "noble gas core", "orbital", "ion wall", "formula", "ionic lattice", "polyatomic ions", "brackets",
  "chloride", "oxide", "sulfide", "nitride", "hydroxide", "nitrate", "nitrite", "sulfate", "sulfite", "phosphate", "carbonate",
  "Iron", "Copper", "Zinc", "Silver", "Lead", "sodium", "magnesium", "aluminium", "calcium"];

export const kapitel5 = (): Kapitel => ({
  id: "nebengruppen", nr: 5, stufe: "os",
  title: tr("Nebengruppenmetalle", "Transition metals"),
  desc: tr("Metalle mit mehreren möglichen Ladungen: römische Zahlen im Namen, Ladung aus der Formel.", "Metals with several possible charges: Roman numerals in the name, charge from the formula."),
  def: {
    title: tr("Nebengruppenmetalle", "Transition metals"),
    known: KNOWN(),
    steps: steps(),
    outro: [
      tr("Viele Übergangsmetalle bilden mehrere Ionen: Fe²⁺ und Fe³⁺, Cu⁺ und Cu²⁺; Zink nur Zn²⁺, Silber nur Ag⁺.", "Many transition metals form several ions: Fe²⁺ and Fe³⁺, Cu⁺ and Cu²⁺; zinc only Zn²⁺, silver only Ag⁺."),
      tr("Kationen geben zuerst 4s ab, dann 3d: Fe³⁺ = [Ar] 3d⁵, halb besetzt.", "Cations lose 4s first, then 3d: Fe³⁺ = [Ar] 3d⁵, half-filled."),
      tr("**Römische Zahl** = Ladung des Metall-Ions: Eisen(III)-chlorid FeCl₃; bei nur einem Ion keine Zahl: Zinkchlorid.", "**Roman numeral** = charge of the metal ion: iron(III) chloride FeCl₃; with only one ion no numeral: zinc chloride."),
      tr("Ladung aus der Formel: Fe₂O₃ → 3 · (2−) = 6− auf 2 Fe → Eisen(III)-oxid.", "Charge from the formula: Fe₂O₃ → 3 · (2−) = 6− shared by 2 Fe → iron(III) oxide."),
      tr("Mit mehratomigen Ionen und Klammern: Fe₂(SO₄)₃, Cu(NO₃)₂.", "With polyatomic ions and brackets: Fe₂(SO₄)₃, Cu(NO₃)₂."),
    ],
  },
  explain: [
    [
      tr("Hauptgruppenmetalle wie Na, Mg, Al bilden ein Ion – die Ladung folgt aus der Gruppe.", "Main group metals such as Na, Mg, Al form one ion – the charge follows from the group."),
      tr("Viele **Übergangsmetalle** bilden mehrere Ionen, z. B. Eisen Fe²⁺ und Fe³⁺, Kupfer Cu⁺ und Cu²⁺.", "Many **transition metals** form several ions, e.g. iron Fe²⁺ and Fe³⁺, copper Cu⁺ and Cu²⁺."),
      tr("Kationen geben zuerst die Elektronen der **äußersten Schale** ab (4s), erst dann 3d-Elektronen.", "Cations first lose the electrons of the **outermost shell** (4s), only then 3d electrons."),
      tr("Ihre Ionen haben meist **keine** Edelgaskonfiguration: In der d-Unterschale bleiben Elektronen, z. B. Cu⁺ = [Ar] 3d¹⁰.", "Their ions usually have **no** noble gas configuration: electrons stay in the d subshell, e.g. Cu⁺ = [Ar] 3d¹⁰."),
    ],
    [
      tr("Die **römische Zahl** in Klammern nennt die Ladung des Metall-Ions: Kupfer(II)-sulfat = CuSO₄ mit Cu²⁺.", "The **Roman numeral** in brackets gives the charge of the metal ion: copper(II) sulfate = CuSO₄ with Cu²⁺."),
      tr("Sie ist eine **Ladung**, keine Anzahl.", "It is a **charge**, not a number of particles."),
      tr("Bildet ein Metall nur ein Ion, steht keine Zahl: Zinkoxid ZnO.", "If a metal forms only one ion, there is no numeral: zinc oxide ZnO."),
    ],
    [
      tr("Rückwärts: Erst die negative Ladung der Anionen ausrechnen, z. B. FeS: 1 · (2−) = 2−.", "Backwards: first work out the negative charge of the anions, e.g. FeS: 1 · (2−) = 2−."),
      tr("Dann auf die Metall-Ionen verteilen: 2− auf 1 Fe → Fe²⁺ → Eisen(II)-sulfid.", "Then share it among the metal ions: 2− on 1 Fe → Fe²⁺ → iron(II) sulfide."),
      tr("Die tiefgestellte Zahl am Metall ist die **Anzahl**, nicht die Ladung.", "The subscript at the metal is the **number**, not the charge."),
    ],
    [
      tr("Mehratomige Ionen bleiben ein Block: Mehr als eins steht in **Klammern**, z. B. Cu(OH)₂.", "Polyatomic ions stay one block: more than one goes in **brackets**, e.g. Cu(OH)₂."),
      tr("Name → Formel: römische Zahl = Ladung, dann ausgleichen: Eisen(II)-sulfat = FeSO₄.", "Name → formula: Roman numeral = charge, then balance: iron(II) sulfate = FeSO₄."),
      tr("Formel → Name: Anionen-Ladung ausrechnen, auf die Metall-Ionen verteilen, römische Zahl einsetzen.", "Formula → name: work out the anion charge, share it among the metal ions, insert the Roman numeral."),
    ],
  ],
});
