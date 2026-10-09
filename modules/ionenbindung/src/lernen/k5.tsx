// Kapitel 5: Nebengruppenmetalle (Level II) – ohne Elektronenkonfiguration und ohne Auswendiglernen:
// gleiche Elemente, verschiedene Stoffe (FeO/Fe₂O₃, Cu₂O/CuO) → die Ladung des Metall-Ions muss in den Namen; im PSE liest man sie nur bei
// Gruppe 1, 2 und 13 ab, bei allen anderen Metallen steht sie als römische Zahl im Namen. Dann Name → Formel, Formel → Name, mit mehratomigen Ionen.
// Nur Eisen, Kupfer und Blei(II) aus `ions.ts`, nur beständige Stoffe.

import { tr } from "@lern/i18n";
import type { GuideStep } from "@lern/ui";
import type { Kapitel } from "./types.ts";
import { model } from "./model.tsx";
import { OxidePair, PseMetals, WallModel, pseWhy, wallWhy } from "./k5/models.tsx";
import "./k5/k5.css";

const NE = (de: string, en: string) => tr(de, en);

// Metalle für das PSE (Ordnungszahlen)
const LI = 3, MG = 12, AL = 13, K = 19, CA = 20, FE = 26, CU = 29, BA = 56, PB = 82;
const PSE_SHOW = [11, MG, AL, FE, CU], PSE_A = [LI, AL, CA, FE, CU], PSE_B = [AL, K, FE, CU, BA, PB];

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
      "3+": NE("Cu³⁺ gibt es nicht. Und 3+ ist mehr als 2−.", "Cu³⁺ does not exist. And 3+ is more than 2−."),
    },
    tip: NE("Wie viel negative Ladung bringt das O²⁻?", "How much negative charge does the O²⁻ bring?"),
    ok: NE("CuO: Cu²⁺ und O²⁻ → Kupfer(II)-oxid.", "CuO: Cu²⁺ and O²⁻ → copper(II) oxide."),
    visual: c => <WallModel c={c} Z={CU} anion="O2-" charges={[1, 2, 3]} report="charge" given="CuO" sample="CuO" sampleAlways init={{ q: 1, nC: 1, nA: 1 }} sol={{ q: 2, nC: 1, nA: 1 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Jetzt du: Welche Ladung hat jedes Kupfer-Ion im roten Cu₂O?", "Your turn: what is the charge of each copper ion in red Cu₂O?"),
    answer: "1+",
    why: {
      "2+": NE("Die 2 in Cu₂ ist die Anzahl. 2 · (2+) = 4+, aber O²⁻ bringt nur 2−.", "The 2 in Cu₂ is the number. 2 · (2+) = 4+, but O²⁻ brings only 2−."),
      "3+": NE("Cu³⁺ gibt es nicht. 2 · (3+) = 6+ ist viel mehr als 2−.", "Cu³⁺ does not exist. 2 · (3+) = 6+ is much more than 2−."),
    },
    tip: NE("Ein O²⁻ bringt 2−. Wie verteilt sich das auf die Kupfer-Ionen?", "One O²⁻ brings 2−. How is that shared among the copper ions?"),
    lines: [NE("1 · (2−) = 2− auf 2 Cu → je 1+.", "1 · (2−) = 2− shared by 2 Cu → 1+ each.")],
    ok: NE("Cu₂O: 2− auf 2 Cu → je 1+ → Kupfer(I)-oxid.", "Cu₂O: 2− shared by 2 Cu → 1+ each → copper(I) oxide."),
    visual: c => <WallModel c={c} Z={CU} anion="O2-" charges={[1, 2, 3]} report="charge" given="Cu2O" sample="Cu2O" sampleAlways init={{ q: 2, nC: 2, nA: 1 }} sol={{ q: 1, nC: 2, nA: 1 }} />,
  }),
  model({
    mode: "worked",
    say: NE("Gruppe 1, 2, 13: Ladung aus der Gruppe (Na⁺, Mg²⁺, Al³⁺). Die Metalle der Gruppen 3–12 heißen **Nebengruppenmetalle** oder **Übergangsmetalle**.",
      "Groups 1, 2, 13: charge from the group (Na⁺, Mg²⁺, Al³⁺). The metals in groups 3–12 are the **transition metals**."),
    ask: NE("Woher kennst du die Ladung von Eisen?", "Where do you get the charge of iron from?"),
    lines: [
      NE("Natrium, Gruppe 1 → Na⁺: Natriumchlorid, ohne Zahl.", "Sodium, group 1 → Na⁺: sodium chloride, no numeral."),
      NE("Eisen, Gruppe 8: Die Gruppe verrät die Ladung nicht → Eisen(III)-chlorid.", "Iron, group 8: the group does not give the charge → iron(III) chloride."),
    ],
    ok: NE("Alle Metalle außer Gruppe 1, 2 und 13: Ladung als römische Zahl im Namen.", "All metals except groups 1, 2 and 13: charge as a Roman numeral in the name."),
    visual: c => <PseMetals c={c} cands={PSE_SHOW} answer={[FE, CU]} />,
  }),
  model({
    mode: "faded",
    ask: NE("Ergänze: Tippe die Metalle an, deren Ladung im Namen stehen muss. Dann prüfe.", "Complete: tap the metals whose charge must be in the name. Then check."),
    lines: [NE("Gruppe 1, 2 und 13: Ladung aus der Gruppe.", "Groups 1, 2 and 13: charge from the group."), NE("Gruppen 3–12: Ladung im Namen.", "Groups 3–12: charge in the name."), NE("Antippen: {?}", "Tap: {?}")],
    answer: "Fe Cu",
    why: pseWhy(PSE_A, [FE, CU]),
    tip: NE("Schau auf die Gruppennummer über der Spalte.", "Look at the group number above the column."),
    ok: NE("Eisen (Gruppe 8) und Kupfer (Gruppe 11) stehen in der Mitte: Ladung im Namen.", "Iron (group 8) and copper (group 11) are in the middle: charge in the name."),
    visual: c => <PseMetals c={c} cands={PSE_A} answer={[FE, CU]} />,
  }),
  model({
    mode: "free",
    say: NE("Auch **Blei** (Pb, Gruppe 14) gehört nicht zu Gruppe 1, 2 oder 13.", "**Lead** (Pb, group 14) is not in group 1, 2 or 13 either."),
    ask: NE("Jetzt umgekehrt: Tippe die Metalle an, deren Ladung du aus der Gruppe ablesen kannst.", "Now the other way round: tap the metals whose charge you can read from the group."),
    answer: "Al K Ba",
    why: pseWhy(PSE_B, [AL, K, BA]),
    tip: NE("Nur drei Gruppen verraten die Ladung. Welche sind es?", "Only three groups give the charge. Which are they?"),
    lines: [NE("K (Gruppe 1) → K⁺, Ba (Gruppe 2) → Ba²⁺, Al (Gruppe 13) → Al³⁺.", "K (group 1) → K⁺, Ba (group 2) → Ba²⁺, Al (group 13) → Al³⁺.")],
    ok: NE("K⁺, Ba²⁺, Al³⁺ aus der Gruppe. Fe, Cu und Pb: Ladung im Namen, z. B. Blei(II)-oxid.", "K⁺, Ba²⁺, Al³⁺ from the group. Fe, Cu and Pb: charge in the name, e.g. lead(II) oxide."),
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
    ok: NE("Na⁺ folgt aus Gruppe 1. Eisen bildet Fe²⁺ und Fe³⁺ – die römische Zahl sagt, welches Ion.", "Na⁺ follows from group 1. Iron forms Fe²⁺ and Fe³⁺ – the Roman numeral says which ion."),
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
      init={{ q: 3, nC: 1, nA: 1 }} sol={{ q: 3, nC: 2, nA: 3 }} />,
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
      init={{ q: 2, nC: 1, nA: 1 }} sol={{ q: 2, nC: 1, nA: 2 }} />,
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
      "3+": NE("Cu³⁺ gibt es nicht. Und 3+ ist mehr als 2−.", "Cu³⁺ does not exist. And 3+ is more than 2−."),
    },
    tip: NE("Rechne zuerst die Ladung der beiden Br⁻ aus.", "First work out the charge of the two Br⁻."),
    ok: NE("CuBr₂: 2 · (1−) = 2− → Cu²⁺ → Kupfer(II)-bromid.", "CuBr₂: 2 · (1−) = 2− → Cu²⁺ → copper(II) bromide."),
    visual: c => <WallModel c={c} Z={CU} anion="Br-" charges={[1, 2, 3]} report="charge" given="CuBr2" init={{ q: 1, nC: 1, nA: 2 }} sol={{ q: 2, nC: 1, nA: 2 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Jetzt du: Welche Ladung hat jedes Kupfer-Ion in Cu₂S?", "Your turn: what is the charge of each copper ion in Cu₂S?"),
    answer: "1+",
    why: {
      "2+": NE("Die 2 in Cu₂ ist die Anzahl, nicht die Ladung. 2 · (2+) = 4+, aber S²⁻ bringt nur 2−.", "The 2 in Cu₂ is the number, not the charge. 2 · (2+) = 4+, but S²⁻ brings only 2−."),
      "3+": NE("Cu³⁺ gibt es nicht. 2 · (3+) = 6+ ist viel mehr als 2−.", "Cu³⁺ does not exist. 2 · (3+) = 6+ is much more than 2−."),
    },
    tip: NE("Ein S²⁻ bringt 2−. Wie verteilt sich das auf die Kupfer-Ionen?", "One S²⁻ brings 2−. How is that shared among the copper ions?"),
    lines: [NE("1 · (2−) = 2− auf 2 Cu → je 1+ → Kupfer(I)-sulfid.", "1 · (2−) = 2− shared by 2 Cu → 1+ each → copper(I) sulfide.")],
    ok: NE("Cu₂S: 2− auf 2 Cu → je 1+ → Kupfer(I)-sulfid.", "Cu₂S: 2− shared by 2 Cu → 1+ each → copper(I) sulfide."),
    visual: c => <WallModel c={c} Z={CU} anion="S2-" charges={[1, 2, 3]} report="charge" given="Cu2S" init={{ q: 2, nC: 2, nA: 1 }} sol={{ q: 1, nC: 2, nA: 1 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Welche Ladung hat Eisen in FeS?", "What is the charge of iron in FeS?"),
    answer: "2+",
    why: {
      "3+": NE("1 · (3+) = 3+, aber 1 · (2−) = 2−. Die obere Reihe ist zu lang.", "1 · (3+) = 3+, but 1 · (2−) = 2−. The top row is too long."),
      "1+": NE("Fe⁺ gibt es nicht. Und 1+ gleicht die 2− von S²⁻ nicht aus.", "Fe⁺ does not exist. And 1+ does not balance the 2− of S²⁻."),
    },
    tip: NE("Ein Fe, ein S²⁻: Welche Ladung gleicht 2− genau aus?", "One Fe, one S²⁻: which charge balances 2− exactly?"),
    lines: [NE("1 · (2−) = 2− → Fe²⁺ → Eisen(II)-sulfid.", "1 · (2−) = 2− → Fe²⁺ → iron(II) sulfide.")],
    ok: NE("FeS: Fe²⁺ und S²⁻ → Eisen(II)-sulfid.", "FeS: Fe²⁺ and S²⁻ → iron(II) sulfide."),
    visual: c => <WallModel c={c} Z={FE} anion="S2-" charges={[1, 2, 3]} report="charge" given="FeS" init={{ q: 3, nC: 1, nA: 1 }} sol={{ q: 2, nC: 1, nA: 1 }} />,
  }),
  model({
    mode: "free",
    ask: NE("Wie heißt CuCl₂? Wähle die römische Zahl und prüfe.", "What is CuCl₂ called? Choose the Roman numeral and check."),
    answer: NE("Kupfer(II)-chlorid", "Copper(II) chloride"),
    why: {
      [NE("Kupfer(I)-chlorid", "Copper(I) chloride")]: NE("Cu⁺ bringt 1+, aber 2 · (1−) = 2−. Die Wand ist nicht ausgeglichen.", "Cu⁺ brings 1+, but 2 · (1−) = 2−. The wall is not balanced."),
      "Cu³⁺": NE("Cu³⁺ gibt es nicht. Und 3+ ist mehr als 2 · (1−) = 2−.", "Cu³⁺ does not exist. And 3+ is more than 2 · (1−) = 2−."),
    },
    tip: NE("Zähle die Cl⁻ und rechne ihre Ladung aus.", "Count the Cl⁻ and work out their charge."),
    lines: [NE("2 · (1−) = 2− → Cu²⁺ → Kupfer(II)-chlorid.", "2 · (1−) = 2− → Cu²⁺ → copper(II) chloride.")],
    ok: NE("CuCl₂: 2 · (1−) = 2− → Cu²⁺ → Kupfer(II)-chlorid.", "CuCl₂: 2 · (1−) = 2− → Cu²⁺ → copper(II) chloride."),
    visual: c => <WallModel c={c} Z={CU} anion="Cl-" charges={[1, 2, 3]} numerals report="name" given="CuCl2" init={{ q: 1, nC: 1, nA: 2 }} sol={{ q: 2, nC: 1, nA: 2 }} />,
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
    why: {
      ...wallWhy(CU, "NO3-", { q: 2, nC: 1, nA: 2 }, [1, 2]),
      "CuNO₃": NE("Das wäre Kupfer(I)-nitrat – diesen Stoff gibt es nicht. (II) heißt Cu²⁺.", "That would be copper(I) nitrate – this substance does not exist. (II) means Cu²⁺."),
    },
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
    ask: NE("Wie heißt FePO₄? Wähle die römische Zahl und prüfe.", "What is FePO₄ called? Choose the Roman numeral and check."),
    answer: NE("Eisen(III)-phosphat", "Iron(III) phosphate"),
    why: {
      [NE("Eisen(II)-phosphat", "Iron(II) phosphate")]: NE("Phosphat ist PO₄³⁻ und bringt 3−. Fe²⁺ gleicht das nicht aus.", "Phosphate is PO₄³⁻ and brings 3−. Fe²⁺ does not balance that."),
      "Fe⁺": NE("Fe⁺ gibt es nicht. Und 1+ ist viel weniger als 3−.", "Fe⁺ does not exist. And 1+ is much less than 3−."),
    },
    tip: NE("Welche Ladung hat das Phosphat-Ion?", "What is the charge of the phosphate ion?"),
    lines: [NE("PO₄³⁻ bringt 3− → Fe³⁺ → Eisen(III)-phosphat.", "PO₄³⁻ brings 3− → Fe³⁺ → iron(III) phosphate.")],
    ok: NE("FePO₄: 1 · (3−) = 3− → Fe³⁺ → Eisen(III)-phosphat.", "FePO₄: 1 · (3−) = 3− → Fe³⁺ → iron(III) phosphate."),
    visual: c => <WallModel c={c} Z={FE} anion="PO43-" charges={[1, 2, 3]} numerals report="name" given="FePO4" init={{ q: 2, nC: 1, nA: 1 }} sol={{ q: 3, nC: 1, nA: 1 }} />,
  }),
  {
    mode: "free",
    ask: NE("Welche Formel hat Kupfer(II)-sulfat?", "What is the formula of copper(II) sulfate?"),
    options: ["CuSO₄", "Cu₂SO₄", "Cu(SO₄)₂", "CuS"], answer: "CuSO₄",
    why: {
      "Cu₂SO₄": NE("Die II ist die Ladung, keine Anzahl. Cu²⁺ und SO₄²⁻ gleichen sich 1 : 1 aus.", "The II is the charge, not a number. Cu²⁺ and SO₄²⁻ balance 1 : 1."),
      "Cu(SO₄)₂": NE("2 · (2−) = 4− ist zu viel für ein Cu²⁺.", "2 · (2−) = 4− is too much for one Cu²⁺."),
      "CuS": NE("CuS ist Kupfer(II)-sulfid. Sulfat ist SO₄²⁻.", "CuS is copper(II) sulfide. Sulfate is SO₄²⁻."),
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
  "chloride", "bromide", "oxide", "sulfide", "hydroxide", "nitrate", "sulfate", "phosphate", "Iron", "Copper", "Lead", "sodium", "magnesium", "aluminium", "calcium", "rust"];

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
      tr("Gruppe 1, 2, 13: Ladung aus der Gruppe. Alle anderen Metalle: **römische Zahl** im Namen.", "Groups 1, 2, 13: charge from the group. All other metals: **Roman numeral** in the name."),
      tr("Vom Namen zur Formel: Eisen(III)-chlorid = FeCl₃.", "From name to formula: iron(III) chloride = FeCl₃."),
      tr("Von der Formel zum Namen: Fe₂O₃ → 6− auf 2 Fe → Eisen(III)-oxid.", "From formula to name: Fe₂O₃ → 6− shared by 2 Fe → iron(III) oxide."),
      tr("Mit mehratomigen Ionen und Klammern: Fe₂(SO₄)₃, Cu(NO₃)₂.", "With polyatomic ions and brackets: Fe₂(SO₄)₃, Cu(NO₃)₂."),
    ],
  },
  explain: [
    [
      tr("Gleiche Elemente können verschiedene Stoffe bilden, wenn das Metall-Ion verschiedene Ladungen hat.", "The same elements can form different substances if the metal ion has different charges."),
      tr("Bei Metallen der Gruppen 1, 2 und 13 liest du die Ladung aus der Gruppe ab: Na⁺, Mg²⁺, Al³⁺.", "For metals in groups 1, 2 and 13 you read the charge from the group: Na⁺, Mg²⁺, Al³⁺."),
      tr("Bei allen anderen Metallen – **Nebengruppenmetalle** (Gruppen 3–12) und Blei – steht die Ladung als **römische Zahl** im Namen.", "For all other metals – **transition metals** (groups 3–12) and lead – the charge is a **Roman numeral** in the name."),
    ],
    [
      tr("Römische Zahl = Ladung des Metall-Ions: Kupfer(II) = Cu²⁺.", "Roman numeral = charge of the metal ion: copper(II) = Cu²⁺."),
      tr("Dann gleichst du aus wie in der Ionenwand: Kupfer(II)-sulfid = CuS.", "Then you balance as in the ion wall: copper(II) sulfide = CuS."),
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
