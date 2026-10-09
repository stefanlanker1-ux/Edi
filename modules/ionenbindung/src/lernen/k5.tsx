// Kapitel 5: Nebengruppenmetalle (Level II) – ohne Elektronenkonfiguration und ohne Auswendiglernen:
// gleiche Elemente, verschiedene Stoffe (FeO/Fe₂O₃, Cu₂O/CuO) → die Ladung des Metall-Ions muss in den Namen; im PSE liest man sie nur bei
// den Metallen der I. bis III. Hauptgruppe (Gruppe 1, 2, 13) ab, bei allen anderen steht sie als römische Zahl im Namen. Dann Name → Formel,
// Formel → Name, mit mehratomigen Ionen. Begründet wird nur über Ladungsbilanz und Namen (nie „gibt es nicht“). Nur Fe, Cu und Pb(II) aus `ions.ts`.

import { tr } from "@lern/i18n";
import type { GuideStep } from "@lern/ui";
import type { Kapitel } from "./types.ts";
import { model } from "./model.tsx";
import { GroupStrip, OxidePair, PseMetals, WallModel, pseWhy, wallWhy } from "./k5/models.tsx";
import "./k5/k5.css";

const NE = (de: string, en: string) => tr(de, en);

// Metalle für das PSE (Ordnungszahlen)
const LI = 3, MG = 12, AL = 13, K = 19, CA = 20, FE = 26, CU = 29, BA = 56, PB = 82;
const PSE_A = [LI, AL, CA, FE, CU], PSE_B = [AL, K, FE, CU, BA, PB];

const steps = (): GuideStep[] => [
  // ── 1. Ein Metall – mehrere Ionen ──
  model({
    mode: "worked", part: NE("Ein Metall – mehrere Ionen", "One metal – several ions"),
    say: NE("Eisen und Sauerstoff bilden zwei verschiedene Stoffe: schwarzes **FeO** und rotbraunes **Fe₂O₃**, wie Rost.",
      "Iron and oxygen form two different substances: black **FeO** and red-brown **Fe₂O₃**, like rust."),
    ask: NE("Warum reicht der Name Eisenoxid nicht?", "Why is the name iron oxide not enough?"),
    lines: [
      NE("FeO: Ein O²⁻ gleicht ein Eisen-Ion aus → Fe²⁺.", "FeO: one O²⁻ balances one iron ion → Fe²⁺."),
      NE("Fe₂O₃: 3 · (2−) = 6− auf 2 Eisen-Ionen → je Fe³⁺.", "Fe₂O₃: 3 · (2−) = 6− shared by 2 iron ions → Fe³⁺ each."),
      NE("Die Ladung steht als **römische Zahl** im Namen: Eisen(II)-oxid und Eisen(III)-oxid.", "The charge is given as a **Roman numeral** in the name: iron(II) oxide and iron(III) oxide."),
    ],
    ok: NE("Gleiche Elemente, andere Ladung des Metall-Ions → anderer Stoff, anderer Name.", "Same elements, different charge of the metal ion → different substance, different name."),
    visual: c => <OxidePair c={c} items={[{ Z: FE, q: 2, nC: 1, nA: 1, sample: "FeO" }, { Z: FE, q: 3, nC: 2, nA: 3, sample: "Fe2O3" }]} />,
  }),
  model({
    mode: "faded",
    say: NE("Auch Kupfer bildet zwei Oxide: rotes **Cu₂O** und schwarzes **CuO**. Wähle die Ladung des Kupfer-Ions – die Wand zeigt sofort, ob sie passt.",
      "Copper also forms two oxides: red **Cu₂O** and black **CuO**. Choose the charge of the copper ion – the wall shows at once whether it fits."),
    ask: NE("Ergänze: Welche Ladung hat Kupfer im schwarzen CuO? Wähle und prüfe.", "Complete: what is the charge of copper in black CuO? Choose and check."),
    lines: [NE("1 O²⁻ bringt 2−.", "1 O²⁻ brings 2−."), NE("1 Kupfer-Ion gleicht 2− aus.", "1 copper ion balances 2−."), NE("Ladung: {?}", "Charge: {?}")],
    answer: "2+",
    why: {
      "1+": NE("1 · (1+) = 1+, aber 1 · (2−) = 2−. Die obere Reihe ist zu kurz.", "1 · (1+) = 1+, but 1 · (2−) = 2−. The top row is too short."),
      "3+": NE("1 · (3+) = 3+ ist mehr als 2−. Die obere Reihe ist zu lang.", "1 · (3+) = 3+ is more than 2−. The top row is too long."),
    },
    tip: NE("Wie viel negative Ladung bringt das O²⁻?", "How much negative charge does the O²⁻ bring?"),
    ok: NE("CuO: Cu²⁺ und O²⁻ → Kupfer(II)-oxid.", "CuO: Cu²⁺ and O²⁻ → copper(II) oxide."),
    visual: c => <WallModel c={c} Z={CU} anion="O2-" charges={[1, 2, 3]} report="charge" given="CuO" sample="CuO" sampleAlways init={{ q: 1, nC: 1, nA: 1 }} sol={{ q: 2, nC: 1, nA: 1 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Jetzt du: Welche Ladung hat jedes Kupfer-Ion im roten Cu₂O? Stelle die Anzahlen wie in der Formel ein, wähle die Ladung und prüfe.",
      "Your turn: what is the charge of each copper ion in red Cu₂O? Set the numbers as in the formula, choose the charge and check."),
    answer: "1+",
    why: {
      "≠ Anzahl": NE("Cu₂O hat 2 Cu und 1 O. Stelle die Anzahlen wie in der Formel ein.", "Cu₂O has 2 Cu and 1 O. Set the numbers as in the formula."),
      "2+": NE("Die 2 in Cu₂ ist die Anzahl. 2 · (2+) = 4+, aber O²⁻ bringt nur 2−.", "The 2 in Cu₂ is the number. 2 · (2+) = 4+, but O²⁻ brings only 2−."),
      "3+": NE("2 · (3+) = 6+ ist viel mehr als 2−.", "2 · (3+) = 6+ is much more than 2−."),
    },
    tip: NE("Erst die Anzahlen der Formel. Dann: Ein O²⁻ bringt 2− – wie verteilt sich das?", "Numbers of the formula first. Then: one O²⁻ brings 2− – how is that shared?"),
    lines: [NE("2 Cu und 1 O: 1 · (2−) = 2− auf 2 Cu → je 1+.", "2 Cu and 1 O: 1 · (2−) = 2− shared by 2 Cu → 1+ each.")],
    ok: NE("Cu₂O: 2− auf 2 Cu → je 1+ → Kupfer(I)-oxid.", "Cu₂O: 2− shared by 2 Cu → 1+ each → copper(I) oxide."),
    visual: c => <WallModel c={c} Z={CU} anion="O2-" charges={[1, 2, 3]} stepC stepA report="charge" given="Cu2O" sample="Cu2O" sampleAlways init={{ q: 3, nC: 1, nA: 1 }} sol={{ q: 1, nC: 2, nA: 1 }} />,
  }),
  model({
    mode: "worked",
    say: NE("Im großen PSE zählt man alle 18 Spalten: Gruppe 1, 2 = **I., II. Hauptgruppe**, Gruppe 13–18 = **III.–VIII. Hauptgruppe**. Dazwischen: die **Nebengruppen** (3–12) mit den **Nebengruppenmetallen**.",
      "The large periodic table counts all 18 columns: groups 1, 2 = **main groups I, II**, groups 13–18 = **main groups III–VIII**. In between are groups 3–12 with the **transition metals**."),
    ask: NE("Woher kennst du die Ladung eines Metall-Ions?", "Where do you get the charge of a metal ion from?"),
    lines: [
      NE("Al: Gruppe 13 = III. Hauptgruppe → Al³⁺, Ladung aus der Hauptgruppe.", "Al: group 13 = main group III → Al³⁺, charge from the main group."),
      NE("Fe: Gruppe 8 (Nebengruppe) – es gibt Eisen(II)-chlorid FeCl₂ und Eisen(III)-chlorid FeCl₃.", "Fe: group 8 (transition metal) – there is iron(II) chloride FeCl₂ and iron(III) chloride FeCl₃."),
    ],
    ok: NE("I. bis III. Hauptgruppe: Ladung aus der Hauptgruppe. Alle anderen Metalle: römische Zahl im Namen.", "Main groups I to III: charge from the main group. All other metals: Roman numeral in the name."),
    visual: c => <GroupStrip c={c} metals={[11, MG, FE, CU, AL, PB]} />,
  }),
  model({
    mode: "faded",
    ask: NE("Ergänze: Wähle die Metalle, deren Ladung im Namen stehen muss. Dann prüfe.", "Complete: choose the metals whose charge must be in the name. Then check."),
    lines: [NE("I. bis III. Hauptgruppe (Gruppe 1, 2, 13): Ladung aus der Hauptgruppe.", "Main groups I to III (groups 1, 2, 13): charge from the main group."), NE("Nebengruppen (Gruppen 3–12): Ladung im Namen.", "Groups 3–12 (transition metals): charge in the name."), NE("Wählen: {?}", "Choose: {?}")],
    answer: "Fe Cu",
    why: pseWhy(PSE_A, [FE, CU]),
    tip: NE("Schau auf die Gruppennummer über der Spalte: Hauptgruppe oder Nebengruppe?", "Look at the group number above the column: main group or transition metal?"),
    ok: NE("Eisen Fe (Gruppe 8) und Kupfer Cu (Gruppe 11) sind Nebengruppenmetalle: Ladung im Namen.", "Iron Fe (group 8) and copper Cu (group 11) are transition metals: charge in the name."),
    visual: c => <PseMetals c={c} cands={PSE_A} answer={[FE, CU]} />,
  }),
  model({
    mode: "free",
    say: NE("Weiter unten ist auch die IV. Hauptgruppe metallisch: **Blei** (Pb). Blei bildet gelbes PbO mit Pb²⁺ und dunkelbraunes PbO₂ mit Pb⁴⁺ – darum eine römische Zahl.",
      "Further down, main group IV is metallic too: **lead** (Pb). Lead forms yellow PbO with Pb²⁺ and dark brown PbO₂ with Pb⁴⁺ – so a Roman numeral."),
    ask: NE("Jetzt umgekehrt: Wähle die Metalle, deren Ladung du aus der Hauptgruppe ablesen kannst.", "Now the other way round: choose the metals whose charge you can read from the main group."),
    answer: "Al K Ba",
    why: pseWhy(PSE_B, [AL, K, BA]),
    tip: NE("Nur die I. bis III. Hauptgruppe verraten die Ladung. Welche Gruppennummern sind das?", "Only main groups I to III give the charge. Which group numbers are they?"),
    lines: [NE("K: I. Hauptgruppe → K⁺, Ba: II. Hauptgruppe → Ba²⁺, Al: Gruppe 13 = III. Hauptgruppe → Al³⁺.", "K: main group I → K⁺, Ba: main group II → Ba²⁺, Al: group 13 = main group III → Al³⁺.")],
    ok: NE("K⁺, Ba²⁺, Al³⁺ aus der Hauptgruppe. Fe, Cu und Pb (Gruppe 14 = IV. Hauptgruppe): Ladung im Namen.", "K⁺, Ba²⁺, Al³⁺ from the main group. Fe, Cu and Pb (group 14 = main group IV): charge in the name."),
    visual: c => <PseMetals c={c} cands={PSE_B} answer={[AL, K, BA]} />,
  }),
  {
    mode: "free",
    ask: NE("Warum heißt FeCl₃ Eisen(III)-chlorid, NaCl aber nur Natriumchlorid?", "Why is FeCl₃ called iron(III) chloride, but NaCl just sodium chloride?"),
    options: [
      NE("Die III zählt die Eisen-Atome.", "The III counts the iron atoms."),
      NE("Eisen ist schwerer als Natrium.", "Iron is heavier than sodium."),
      NE("Eisen bildet mehrere Ionen.", "Iron forms several ions."),
      NE("Eisen will 3 Elektronen abgeben.", "Iron wants to lose 3 electrons."),
    ],
    answer: NE("Eisen bildet mehrere Ionen.", "Iron forms several ions."),
    why: {
      [NE("Die III zählt die Eisen-Atome.", "The III counts the iron atoms.")]: NE("Die Zahl ist die Ladung, keine Anzahl: FeCl₃ hat nur ein Fe.", "The numeral is the charge, not a number: FeCl₃ has only one Fe."),
      [NE("Eisen ist schwerer als Natrium.", "Iron is heavier than sodium.")]: NE("Die Masse spielt für den Namen keine Rolle. Es geht um die Ladung.", "Mass plays no part in the name. It is about the charge."),
      [NE("Eisen will 3 Elektronen abgeben.", "Iron wants to lose 3 electrons.")]: NE("Atome wollen nichts. Eisen bildet Fe²⁺ und Fe³⁺ – der Name sagt, welches.", "Atoms do not want anything. Iron forms Fe²⁺ and Fe³⁺ – the name says which."),
    },
    ok: NE("Na⁺ folgt aus der I. Hauptgruppe. Eisen bildet Fe²⁺ und Fe³⁺ – die römische Zahl sagt, welches Ion.", "Na⁺ follows from main group I. Iron forms Fe²⁺ and Fe³⁺ – the Roman numeral says which ion."),
  },

  // ── 2. Name → Formel ──
  model({
    mode: "worked", part: NE("Vom Namen zur Formel", "From name to formula"),
    say: NE("Die römische Zahl in Klammern ist die Ladung des Metall-Ions: Eisen(II) = Fe²⁺, Eisen(III) = Fe³⁺.", "The Roman numeral in brackets is the charge of the metal ion: iron(II) = Fe²⁺, iron(III) = Fe³⁺."),
    ask: NE("Welche Formel hat Eisen(III)-chlorid?", "What is the formula of iron(III) chloride?"),
    lines: [
      NE("Eisen(III) = Fe³⁺, Chlorid = Cl⁻.", "Iron(III) = Fe³⁺, chloride = Cl⁻."),
      NE("Ausgleich: 1 · (3+) = 3+ und 3 · (1−) = 3−.", "Balance: 1 · (3+) = 3+ and 3 · (1−) = 3−."),
      NE("→ **FeCl₃**. Die III ist die Ladung, keine Anzahl.", "→ **FeCl₃**. The III is the charge, not a number of particles."),
    ],
    ok: NE("Römische Zahl = Ladung des Metall-Ions.", "Roman numeral = charge of the metal ion."),
    visual: c => <WallModel c={c} Z={FE} anion="Cl-" charges={[2, 3]} numerals stepA report="formula" given={NE("Eisen(III)-chlorid", "Iron(III) chloride")}
      init={{ q: 3, nC: 1, nA: 3 }} sol={{ q: 3, nC: 1, nA: 3 }} />,
  }),
  model({
    mode: "faded",
    say: NE("Wähle die römische Zahl: Die Ladung im oberen Baustein ändert sich sofort.", "Choose the Roman numeral: the charge in the top block changes at once."),
    ask: NE("Ergänze: Baue Eisen(II)-chlorid. Dann prüfe.", "Complete: build iron(II) chloride. Then check."),
    lines: [NE("Eisen(II) = Fe²⁺.", "Iron(II) = Fe²⁺."), NE("2 · (1−) = 2− gleicht 2+ aus.", "2 · (1−) = 2− balances 2+."), NE("Formel: {?}", "Formula: {?}")],
    answer: "FeCl₂",
    why: wallWhy(FE, "Cl-", { q: 2, nC: 1, nA: 2 }, [2, 3]),
    tip: NE("Welche Ladung steckt in (II)? Wie viele Cl⁻ gleichen sie aus?", "Which charge is in (II)? How many Cl⁻ balance it?"),
    ok: NE("Eisen(II)-chlorid = FeCl₂: ein Fe²⁺, zwei Cl⁻.", "Iron(II) chloride = FeCl₂: one Fe²⁺, two Cl⁻."),
    visual: c => <WallModel c={c} Z={FE} anion="Cl-" charges={[2, 3]} numerals stepA report="formula" given={NE("Eisen(II)-chlorid", "Iron(II) chloride")}
      init={{ q: 3, nC: 1, nA: 1 }} sol={{ q: 2, nC: 1, nA: 2 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Jetzt du: Baue Kupfer(I)-oxid. Dann prüfe.", "Your turn: build copper(I) oxide. Then check."),
    answer: "Cu₂O",
    why: wallWhy(CU, "O2-", { q: 1, nC: 2, nA: 1 }, [1, 2]),
    tip: NE("(I) heißt 1+. Wie viele Cu⁺ gleichen ein O²⁻ aus?", "(I) means 1+. How many Cu⁺ balance one O²⁻?"),
    lines: [NE("2 · (1+) = 2+ und 1 · (2−) = 2− → Cu₂O, ein rotes Pulver.", "2 · (1+) = 2+ and 1 · (2−) = 2− → Cu₂O, a red powder.")],
    ok: NE("Kupfer(I)-oxid = Cu₂O: zwei Cu⁺ gleichen ein O²⁻ aus.", "Copper(I) oxide = Cu₂O: two Cu⁺ balance one O²⁻."),
    visual: c => <WallModel c={c} Z={CU} anion="O2-" charges={[1, 2]} numerals stepC stepA report="formula" given={NE("Kupfer(I)-oxid", "Copper(I) oxide")} sample="Cu2O"
      init={{ q: 2, nC: 1, nA: 2 }} sol={{ q: 1, nC: 2, nA: 1 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Baue Eisen(III)-oxid. Dann prüfe.", "Build iron(III) oxide. Then check."),
    answer: "Fe₂O₃",
    why: wallWhy(FE, "O2-", { q: 3, nC: 2, nA: 3 }, [2, 3]),
    tip: NE("3+ und 2−: Bei welchen Anzahlen sind beide Reihen gleich lang?", "3+ and 2−: at which numbers are both rows the same length?"),
    lines: [NE("2 · (3+) = 6+ und 3 · (2−) = 6− → Fe₂O₃, rotbraun wie Rost.", "2 · (3+) = 6+ and 3 · (2−) = 6− → Fe₂O₃, red-brown like rust.")],
    ok: NE("Eisen(III)-oxid = Fe₂O₃: 2 · (3+) = 6+ und 3 · (2−) = 6−.", "Iron(III) oxide = Fe₂O₃: 2 · (3+) = 6+ and 3 · (2−) = 6−."),
    visual: c => <WallModel c={c} Z={FE} anion="O2-" charges={[2, 3]} numerals stepC stepA report="formula" given={NE("Eisen(III)-oxid", "Iron(III) oxide")} sample="Fe2O3"
      init={{ q: 2, nC: 1, nA: 1 }} sol={{ q: 3, nC: 2, nA: 3 }} />,
  }),
  model({
    mode: "free",
    say: NE("Bei Blei liest du die Ladung genauso aus dem Namen.", "With lead you read the charge from the name in the same way."),
    ask: NE("Baue Blei(II)-chlorid. Dann prüfe.", "Build lead(II) chloride. Then check."),
    answer: "PbCl₂",
    why: wallWhy(PB, "Cl-", { q: 2, nC: 1, nA: 2 }, [2]),
    tip: NE("Blei(II) heißt Pb²⁺. Wie viele Cl⁻ gleichen das aus?", "Lead(II) means Pb²⁺. How many Cl⁻ balance that?"),
    lines: [NE("1 · (2+) = 2+ und 2 · (1−) = 2− → PbCl₂.", "1 · (2+) = 2+ and 2 · (1−) = 2− → PbCl₂.")],
    ok: NE("Blei(II)-chlorid = PbCl₂: ein Pb²⁺, zwei Cl⁻.", "Lead(II) chloride = PbCl₂: one Pb²⁺, two Cl⁻."),
    visual: c => <WallModel c={c} Z={PB} anion="Cl-" stepC stepA report="formula" given={NE("Blei(II)-chlorid", "Lead(II) chloride")}
      init={{ q: 2, nC: 2, nA: 1 }} sol={{ q: 2, nC: 1, nA: 2 }} />,
  }),
  {
    mode: "free",
    ask: NE("Welche Formel hat Kupfer(II)-oxid?", "What is the formula of copper(II) oxide?"),
    options: ["Cu₂O", "CuO₂", "CuO", "Cu₂O₂"], answer: "CuO",
    why: {
      "Cu₂O": NE("Die II ist die Ladung, keine Anzahl. Cu₂O ist Kupfer(I)-oxid.", "The II is the charge, not a number. Cu₂O is copper(I) oxide."),
      "CuO₂": NE("Die II gehört zum Kupfer-Ion: Cu²⁺ und O²⁻ gleichen sich 1 : 1 aus.", "The II belongs to the copper ion: Cu²⁺ and O²⁻ balance 1 : 1."),
      "Cu₂O₂": NE("Neutral, aber nicht das kleinste Verhältnis – 2 : 2 lässt sich kürzen.", "Neutral, but not the smallest ratio – 2 : 2 can be reduced."),
    },
    ok: NE("Kupfer(II) = Cu²⁺: 1 · (2+) = 2+ und 1 · (2−) = 2− → CuO.", "Copper(II) = Cu²⁺: 1 · (2+) = 2+ and 1 · (2−) = 2− → CuO."),
  },

  // ── 3. Formel → Name ──
  model({
    mode: "worked", part: NE("Von der Formel zum Namen", "From formula to name"),
    say: NE("Aus der Formel rechnest du die Ladung des Metall-Ions zurück. Die Anionen geben die negative Ladung vor.", "From the formula you work back to the charge of the metal ion. The anions give the negative charge."),
    ask: NE("Welche Ladung hat Eisen in FeCl₃?", "What is the charge of iron in FeCl₃?"),
    lines: [
      NE("3 Cl⁻: 3 · (1−) = 3−.", "3 Cl⁻: 3 · (1−) = 3−."),
      NE("Ein Fe gleicht 3− aus → Fe³⁺.", "One Fe balances 3− → Fe³⁺."),
      NE("→ Name: Eisen(III)-chlorid.", "→ Name: iron(III) chloride."),
    ],
    ok: NE("Erst die Anionen-Ladung ausrechnen, dann auf die Metall-Ionen verteilen.", "First work out the anion charge, then share it among the metal ions."),
    visual: c => <WallModel c={c} Z={FE} anion="Cl-" charges={[1, 2, 3]} report="charge" given="FeCl3" init={{ q: 3, nC: 1, nA: 3 }} sol={{ q: 3, nC: 1, nA: 3 }} />,
  }),
  model({
    mode: "faded",
    ask: NE("Ergänze: Welche Ladung hat Kupfer in CuBr₂? Wähle und prüfe.", "Complete: what is the charge of copper in CuBr₂? Choose and check."),
    lines: [NE("2 Br⁻: 2 · (1−) = 2−.", "2 Br⁻: 2 · (1−) = 2−."), NE("1 Kupfer-Ion gleicht 2− aus.", "1 copper ion balances 2−."), NE("Ladung: {?}", "Charge: {?}")],
    answer: "2+",
    why: {
      "1+": NE("1 · (1+) = 1+, aber 2 · (1−) = 2−. Die obere Reihe ist zu kurz.", "1 · (1+) = 1+, but 2 · (1−) = 2−. The top row is too short."),
      "3+": NE("1 · (3+) = 3+ ist mehr als 2 · (1−) = 2−.", "1 · (3+) = 3+ is more than 2 · (1−) = 2−."),
    },
    tip: NE("Rechne zuerst die Ladung der beiden Br⁻ aus.", "First work out the charge of the two Br⁻."),
    ok: NE("CuBr₂: 2 · (1−) = 2− → Cu²⁺ → Kupfer(II)-bromid.", "CuBr₂: 2 · (1−) = 2− → Cu²⁺ → copper(II) bromide."),
    visual: c => <WallModel c={c} Z={CU} anion="Br-" charges={[1, 2, 3]} report="charge" given="CuBr2" init={{ q: 1, nC: 1, nA: 2 }} sol={{ q: 2, nC: 1, nA: 2 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Jetzt du: Welche Ladung hat jedes Kupfer-Ion in Cu₂S? Stelle die Anzahlen ein, wähle die Ladung und prüfe.",
      "Your turn: what is the charge of each copper ion in Cu₂S? Set the numbers, choose the charge and check."),
    answer: "1+",
    why: {
      "≠ Anzahl": NE("Cu₂S hat 2 Cu und 1 S. Stelle die Anzahlen wie in der Formel ein.", "Cu₂S has 2 Cu and 1 S. Set the numbers as in the formula."),
      "2+": NE("Die 2 in Cu₂ ist die Anzahl, nicht die Ladung. 2 · (2+) = 4+, aber S²⁻ bringt nur 2−.", "The 2 in Cu₂ is the number, not the charge. 2 · (2+) = 4+, but S²⁻ brings only 2−."),
      "3+": NE("2 · (3+) = 6+ ist viel mehr als 2−.", "2 · (3+) = 6+ is much more than 2−."),
    },
    tip: NE("Erst die Anzahlen der Formel. Dann: Ein S²⁻ bringt 2− – wie verteilt sich das?", "Numbers of the formula first. Then: one S²⁻ brings 2− – how is that shared?"),
    lines: [NE("1 · (2−) = 2− auf 2 Cu → je 1+ → Kupfer(I)-sulfid.", "1 · (2−) = 2− shared by 2 Cu → 1+ each → copper(I) sulfide.")],
    ok: NE("Cu₂S: 2− auf 2 Cu → je 1+ → Kupfer(I)-sulfid.", "Cu₂S: 2− shared by 2 Cu → 1+ each → copper(I) sulfide."),
    visual: c => <WallModel c={c} Z={CU} anion="S2-" charges={[1, 2, 3]} stepC stepA report="charge" given="Cu2S" init={{ q: 3, nC: 1, nA: 1 }} sol={{ q: 1, nC: 2, nA: 1 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Welche Ladung hat Eisen in FeBr₂? Stelle die Anzahlen ein, wähle die Ladung und prüfe.", "What is the charge of iron in FeBr₂? Set the numbers, choose the charge and check."),
    answer: "2+",
    why: {
      "≠ Anzahl": NE("FeBr₂ hat 1 Fe und 2 Br. Stelle die Anzahlen wie in der Formel ein.", "FeBr₂ has 1 Fe and 2 Br. Set the numbers as in the formula."),
      "3+": NE("1 · (3+) = 3+, aber 2 · (1−) = 2−. Die obere Reihe ist zu lang.", "1 · (3+) = 3+, but 2 · (1−) = 2−. The top row is too long."),
      "1+": NE("1 · (1+) = 1+, aber 2 · (1−) = 2−. Die obere Reihe ist zu kurz.", "1 · (1+) = 1+, but 2 · (1−) = 2−. The top row is too short."),
    },
    tip: NE("Erst die Anzahlen der Formel. Wie viel negative Ladung bringen 2 Br⁻?", "Numbers of the formula first. How much negative charge do 2 Br⁻ bring?"),
    lines: [NE("2 · (1−) = 2− → Fe²⁺ → Eisen(II)-bromid.", "2 · (1−) = 2− → Fe²⁺ → iron(II) bromide.")],
    ok: NE("FeBr₂: Fe²⁺ und 2 Br⁻ → Eisen(II)-bromid.", "FeBr₂: Fe²⁺ and 2 Br⁻ → iron(II) bromide."),
    visual: c => <WallModel c={c} Z={FE} anion="Br-" charges={[1, 2, 3]} stepC stepA report="charge" given="FeBr2" init={{ q: 3, nC: 1, nA: 1 }} sol={{ q: 2, nC: 1, nA: 2 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Wie heißt CuCl₂? Stelle die Anzahlen ein, wähle die römische Zahl und prüfe.", "What is CuCl₂ called? Set the numbers, choose the Roman numeral and check."),
    answer: NE("Kupfer(II)-chlorid", "Copper(II) chloride"),
    why: {
      "≠ Anzahl": NE("CuCl₂ hat 1 Cu und 2 Cl. Stelle die Anzahlen wie in der Formel ein.", "CuCl₂ has 1 Cu and 2 Cl. Set the numbers as in the formula."),
      [NE("Kupfer(I)-chlorid", "Copper(I) chloride")]: NE("Cu⁺ bringt 1+, aber 2 · (1−) = 2−. Die Wand ist nicht ausgeglichen.", "Cu⁺ brings 1+, but 2 · (1−) = 2−. The wall is not balanced."),
      [NE("Kupfer(III)-chlorid", "Copper(III) chloride")]: NE("3+ ist mehr als 2 · (1−) = 2−. Die Wand ist nicht ausgeglichen.", "3+ is more than 2 · (1−) = 2−. The wall is not balanced."),
    },
    tip: NE("Erst die Anzahlen der Formel. Dann die Ladung der Cl⁻ ausrechnen.", "Numbers of the formula first. Then work out the charge of the Cl⁻."),
    lines: [NE("2 · (1−) = 2− → Cu²⁺ → Kupfer(II)-chlorid.", "2 · (1−) = 2− → Cu²⁺ → copper(II) chloride.")],
    ok: NE("CuCl₂: 2 · (1−) = 2− → Cu²⁺ → Kupfer(II)-chlorid.", "CuCl₂: 2 · (1−) = 2− → Cu²⁺ → copper(II) chloride."),
    visual: c => <WallModel c={c} Z={CU} anion="Cl-" charges={[1, 2, 3]} numerals stepC stepA report="name" given="CuCl2" init={{ q: 3, nC: 1, nA: 1 }} sol={{ q: 2, nC: 1, nA: 2 }} />,
  }),
  {
    mode: "free",
    ask: NE("Wie heißt Fe₂O₃?", "What is Fe₂O₃ called?"),
    options: [NE("Eisen(II)-oxid", "Iron(II) oxide"), NE("Eisen(III)-oxid", "Iron(III) oxide"), NE("Eisenoxid", "Iron oxide"), NE("Eisen(VI)-oxid", "Iron(VI) oxide")],
    answer: NE("Eisen(III)-oxid", "Iron(III) oxide"),
    why: {
      [NE("Eisen(II)-oxid", "Iron(II) oxide")]: NE("Die 2 in Fe₂ ist die Anzahl. 3 · (2−) = 6− auf 2 Fe → je 3+.", "The 2 in Fe₂ is the number. 3 · (2−) = 6− shared by 2 Fe → 3+ each."),
      [NE("Eisenoxid", "Iron oxide")]: NE("Eisenoxid gibt es zweimal: FeO und Fe₂O₃. Ohne Zahl ist der Name mehrdeutig.", "There are two iron oxides: FeO and Fe₂O₃. Without a numeral the name is ambiguous."),
      [NE("Eisen(VI)-oxid", "Iron(VI) oxide")]: NE("6− ist die Ladung aller O²⁻. Sie verteilt sich auf 2 Fe: je 3+.", "6− is the charge of all the O²⁻. It is shared by 2 Fe: 3+ each."),
    },
    ok: NE("Fe₂O₃: 6− auf 2 Fe → je Fe³⁺ → Eisen(III)-oxid.", "Fe₂O₃: 6− shared by 2 Fe → Fe³⁺ each → iron(III) oxide."),
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
    visual: c => <WallModel c={c} Z={FE} anion="SO42-" charges={[2, 3]} numerals stepC stepA report="formula" given={NE("Eisen(III)-sulfat", "Iron(III) sulfate")}
      init={{ q: 3, nC: 2, nA: 3 }} sol={{ q: 3, nC: 2, nA: 3 }} />,
  }),
  model({
    mode: "faded",
    ask: NE("Ergänze: Baue Kupfer(II)-nitrat. Dann prüfe.", "Complete: build copper(II) nitrate. Then check."),
    lines: [NE("Kupfer(II) = Cu²⁺, Nitrat = NO₃⁻.", "Copper(II) = Cu²⁺, nitrate = NO₃⁻."), NE("1 · (2+) = 2+ und 2 · (1−) = 2−.", "1 · (2+) = 2+ and 2 · (1−) = 2−."), NE("Formel: {?}", "Formula: {?}")],
    answer: "Cu(NO₃)₂",
    why: wallWhy(CU, "NO3-", { q: 2, nC: 1, nA: 2 }, [1, 2]),
    tip: NE("(II) heißt 2+. Wie viele NO₃⁻ gleichen das aus?", "(II) means 2+. How many NO₃⁻ balance that?"),
    ok: NE("Cu(NO₃)₂: zwei Nitrat-Ionen, darum Klammern.", "Cu(NO₃)₂: two nitrate ions, so brackets."),
    visual: c => <WallModel c={c} Z={CU} anion="NO3-" charges={[1, 2]} numerals stepC stepA report="formula" given={NE("Kupfer(II)-nitrat", "Copper(II) nitrate")}
      init={{ q: 2, nC: 1, nA: 1 }} sol={{ q: 2, nC: 1, nA: 2 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Jetzt du: Baue Eisen(II)-hydroxid. Dann prüfe.", "Your turn: build iron(II) hydroxide. Then check."),
    answer: "Fe(OH)₂",
    why: wallWhy(FE, "OH-", { q: 2, nC: 1, nA: 2 }, [2, 3]),
    tip: NE("Hydroxid ist OH⁻. Wie viele davon gleichen Fe²⁺ aus?", "Hydroxide is OH⁻. How many of them balance Fe²⁺?"),
    lines: [NE("1 · (2+) = 2+ und 2 · (1−) = 2− → Fe(OH)₂.", "1 · (2+) = 2+ and 2 · (1−) = 2− → Fe(OH)₂.")],
    ok: NE("Fe(OH)₂: Die Klammer zeigt zwei ganze OH⁻-Ionen.", "Fe(OH)₂: the brackets show two whole OH⁻ ions."),
    visual: c => <WallModel c={c} Z={FE} anion="OH-" charges={[2, 3]} numerals stepC stepA report="formula" given={NE("Eisen(II)-hydroxid", "Iron(II) hydroxide")}
      init={{ q: 3, nC: 1, nA: 1 }} sol={{ q: 2, nC: 1, nA: 2 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Wie heißt Fe(NO₃)₃? Stelle die Anzahlen ein, wähle die römische Zahl und prüfe.", "What is Fe(NO₃)₃ called? Set the numbers, choose the Roman numeral and check."),
    answer: NE("Eisen(III)-nitrat", "Iron(III) nitrate"),
    why: {
      "≠ Anzahl": NE("Fe(NO₃)₃ hat 1 Fe und 3 Nitrat-Ionen. Stelle die Anzahlen wie in der Formel ein.", "Fe(NO₃)₃ has 1 Fe and 3 nitrate ions. Set the numbers as in the formula."),
      [NE("Eisen(II)-nitrat", "Iron(II) nitrate")]: NE("2+ gleicht 3 · (1−) = 3− nicht aus.", "2+ does not balance 3 · (1−) = 3−."),
      [NE("Eisen(I)-nitrat", "Iron(I) nitrate")]: NE("1+ ist viel weniger als 3 · (1−) = 3−.", "1+ is much less than 3 · (1−) = 3−."),
    },
    tip: NE("Erst die Anzahlen der Formel. Wie viel negative Ladung bringen 3 NO₃⁻?", "Numbers of the formula first. How much negative charge do 3 NO₃⁻ bring?"),
    lines: [NE("3 · (1−) = 3− → Fe³⁺ → Eisen(III)-nitrat.", "3 · (1−) = 3− → Fe³⁺ → iron(III) nitrate.")],
    ok: NE("Fe(NO₃)₃: 3 · (1−) = 3− → Fe³⁺ → Eisen(III)-nitrat.", "Fe(NO₃)₃: 3 · (1−) = 3− → Fe³⁺ → iron(III) nitrate."),
    visual: c => <WallModel c={c} Z={FE} anion="NO3-" charges={[1, 2, 3]} numerals stepC stepA report="name" given="Fe(NO3)3" init={{ q: 2, nC: 1, nA: 1 }} sol={{ q: 3, nC: 1, nA: 3 }} />,
  }),
  {
    mode: "free",
    ask: NE("Welche Formel hat Kupfer(II)-sulfat?", "What is the formula of copper(II) sulfate?"),
    options: ["CuSO₄", "Cu₂SO₄", "Cu(SO₄)₂", "CuS"], answer: "CuSO₄",
    why: {
      "Cu₂SO₄": NE("Die II ist die Ladung, keine Anzahl. Cu²⁺ und SO₄²⁻ gleichen sich 1 : 1 aus.", "The II is the charge, not a number. Cu²⁺ and SO₄²⁻ balance 1 : 1."),
      "Cu(SO₄)₂": NE("2 · (2−) = 4− ist zu viel für ein Cu²⁺.", "2 · (2−) = 4− is too much for one Cu²⁺."),
      "CuS": NE("CuS wäre ein Sulfid (S²⁻). Sulfat ist SO₄²⁻.", "CuS would be a sulfide (S²⁻). Sulfate is SO₄²⁻."),
    },
    ok: NE("Kupfer(II)-sulfat = CuSO₄: 1 · (2+) = 2+ und 1 · (2−) = 2−.", "Copper(II) sulfate = CuSO₄: 1 · (2+) = 2+ and 1 · (2−) = 2−."),
  },
  {
    mode: "free",
    ask: NE("Wie heißt Fe(OH)₃?", "What is Fe(OH)₃ called?"),
    options: [NE("Eisen(I)-hydroxid", "Iron(I) hydroxide"), NE("Eisenhydroxid", "Iron hydroxide"), NE("Eisen(III)-oxid", "Iron(III) oxide"), NE("Eisen(III)-hydroxid", "Iron(III) hydroxide")],
    answer: NE("Eisen(III)-hydroxid", "Iron(III) hydroxide"),
    why: {
      [NE("Eisen(I)-hydroxid", "Iron(I) hydroxide")]: NE("Ein Fe, aber 3 OH⁻: 3 · (1−) = 3− → Fe³⁺.", "One Fe, but 3 OH⁻: 3 · (1−) = 3− → Fe³⁺."),
      [NE("Eisenhydroxid", "Iron hydroxide")]: NE("Eisen bildet Fe²⁺ und Fe³⁺ – ohne Zahl ist der Name mehrdeutig.", "Iron forms Fe²⁺ and Fe³⁺ – without a numeral the name is ambiguous."),
      [NE("Eisen(III)-oxid", "Iron(III) oxide")]: NE("OH⁻ heißt Hydroxid. Oxid ist O²⁻.", "OH⁻ is called hydroxide. Oxide is O²⁻."),
    },
    ok: NE("Fe(OH)₃: 3 · (1−) = 3− → Fe³⁺ → Eisen(III)-hydroxid.", "Fe(OH)₃: 3 · (1−) = 3− → Fe³⁺ → iron(III) hydroxide."),
  },
];

const KNOWN_DE = ["Ion", "Kation", "Anion", "Ladung", "neutral", "Hauptgruppe", "Gruppe", "Periodensystem", "Ionenwand", "Formel", "Ionengitter", "mehratomige Ionen", "Klammern",
  "Chlorid", "Bromid", "Oxid", "Sulfid", "Hydroxid", "Nitrat", "Sulfat", "Phosphat", "Eisen", "Kupfer", "Blei", "Natrium", "Magnesium", "Aluminium", "Calcium", "Rost"];
const KNOWN_EN = ["ion", "cation", "anion", "charge", "neutral", "main group", "group", "periodic table", "ion wall", "formula", "ionic lattice", "polyatomic ions", "brackets",
  "chloride", "bromide", "oxide", "sulfide", "hydroxide", "nitrate", "sulfate", "phosphate", "iron", "copper", "lead", "sodium", "magnesium", "aluminium", "calcium", "rust"];

export const kapitel5 = (): Kapitel => ({
  id: "nebengruppen", nr: 5, stufe: "os",
  title: tr("Nebengruppenmetalle", "Transition metals"),
  desc: tr("Metalle mit mehreren möglichen Ladungen: römische Zahlen im Namen, Ladung aus der Formel.", "Metals with several possible charges: Roman numerals in the name, charge from the formula."),
  def: {
    title: tr("Nebengruppenmetalle", "Transition metals"),
    known: KNOWN_DE.map((de, i) => tr(de, KNOWN_EN[i])),
    steps: steps(),
    outro: [
      tr("Gleiche Elemente, andere Ladung des Metall-Ions → anderer Stoff: schwarzes FeO, rotbraunes Fe₂O₃.", "Same elements, different charge of the metal ion → different substance: black FeO, red-brown Fe₂O₃."),
      tr("Metalle der I. bis III. Hauptgruppe (Gruppe 1, 2, 13): Ladung aus der Hauptgruppe. Alle anderen Metalle: **römische Zahl** im Namen.", "Metals of main groups I to III (groups 1, 2, 13): charge from the main group. All other metals: **Roman numeral** in the name."),
      tr("Vom Namen zur Formel: Eisen(III)-chlorid = FeCl₃.", "From name to formula: iron(III) chloride = FeCl₃."),
      tr("Von der Formel zum Namen: Fe₂O₃ → 6− auf 2 Fe → Eisen(III)-oxid.", "From formula to name: Fe₂O₃ → 6− shared by 2 Fe → iron(III) oxide."),
      tr("Mit mehratomigen Ionen und Klammern: Fe₂(SO₄)₃, Cu(NO₃)₂.", "With polyatomic ions and brackets: Fe₂(SO₄)₃, Cu(NO₃)₂."),
    ],
  },
  explain: [
    [
      tr("Gleiche Elemente können verschiedene Stoffe bilden, wenn das Metall-Ion verschiedene Ladungen hat.", "The same elements can form different substances if the metal ion has different charges."),
      tr("Im großen PSE: Gruppe 1, 2 = I., II. Hauptgruppe; Gruppe 13–18 = III.–VIII. Hauptgruppe; dazwischen die Nebengruppen.", "In the large periodic table: groups 1, 2 = main groups I, II; groups 13–18 = main groups III–VIII; in between the transition metals."),
      tr("Metalle der I. bis III. Hauptgruppe: Ladung aus der Hauptgruppe, z. B. Mg²⁺.", "Metals of main groups I to III: charge from the main group, e.g. Mg²⁺."),
      tr("Bei allen anderen Metallen – **Nebengruppenmetalle** (Gruppen 3–12) und Blei – steht die Ladung als **römische Zahl** im Namen.", "For all other metals – **transition metals** (groups 3–12) and lead – the charge is a **Roman numeral** in the name."),
    ],
    [
      tr("Römische Zahl = Ladung des Metall-Ions: Kupfer(II) = Cu²⁺.", "Roman numeral = charge of the metal ion: copper(II) = Cu²⁺."),
      tr("Dann gleichst du aus wie in der Ionenwand: Kupfer(II)-fluorid = CuF₂.", "Then you balance as in the ion wall: copper(II) fluoride = CuF₂."),
      tr("Die Zahl ist eine **Ladung**, keine Anzahl.", "The numeral is a **charge**, not a number of particles."),
    ],
    [
      tr("Rückwärts: Erst die Ladung der Anionen ausrechnen, z. B. FeF₃: 3 · (1−) = 3−.", "Backwards: first work out the charge of the anions, e.g. FeF₃: 3 · (1−) = 3−."),
      tr("Dann auf die Metall-Ionen verteilen: 3− auf 1 Fe → Fe³⁺ → Eisen(III)-fluorid.", "Then share it among the metal ions: 3− on 1 Fe → Fe³⁺ → iron(III) fluoride."),
      tr("Die tiefgestellte Zahl am Metall ist die **Anzahl**, nicht die Ladung.", "The subscript at the metal is the **number**, not the charge."),
    ],
    [
      tr("Mehratomige Ionen bleiben ein Block: Mehr als eins steht in **Klammern**, z. B. Cu(OH)₂.", "Polyatomic ions stay one block: more than one goes in **brackets**, e.g. Cu(OH)₂."),
      tr("Vom Namen zur Formel: römische Zahl = Ladung, dann ausgleichen: Eisen(II)-sulfat = FeSO₄.", "From name to formula: Roman numeral = charge, then balance: iron(II) sulfate = FeSO₄."),
      tr("Von der Formel zum Namen: Anionen-Ladung ausrechnen, auf die Metall-Ionen verteilen, römische Zahl einsetzen.", "From formula to name: work out the anion charge, share it among the metal ions, insert the Roman numeral."),
    ],
  ],
});
