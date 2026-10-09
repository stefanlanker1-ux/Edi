// Kapitel 4 (Level II): Ionen aus mehreren Atomen – mehratomiges Ion als Gruppe mit einer Ladung, Namen (-at, -it, Hydrogen-, Hydroxid, Ammonium),
// Formeln mit Klammern, Name ↔ Formel. Wie die Atome im Ion zusammenhalten, kommt erst bei der Elektronenpaarbindung (ehrlich vertagt).

import { Fit } from "@lern/ui";
import { ION_BY_ID } from "@lern/chem";
import { tr } from "@lern/i18n";
import { IonWall } from "../components/IonWall.tsx";
import { model } from "./model.tsx";
import { BigIon, IonBlock, IonModel, NameKit, NotMixture, PickModel, WallModel, WriteModel, nameJoin, wallWhy } from "./k4/Models.tsx";
import type { Kapitel } from "./types.ts";
import "./k4/k4.css";

/** nach vier Fehlversuchen steht die Lösung im Modell */
const SHOW = () => tr("So geht's: Die Lösung steht jetzt im Modell. Tippe auf „Prüfen“.", "Here's how: the solution is now in the model. Tap “Check”.");

/** Ionenwand mit Formel (ohne Namen) als Bild im Namensbaukasten */
const wallFig = (cat: string, an: string, nC: number, nA: number) => (
  <Fit className="k4-wall" min={0.3}><IonWall cation={ION_BY_ID[cat]} anion={ION_BY_ID[an]} nC={nC} nA={nA} showName={false} /></Fit>
);

export const kapitel4 = (): Kapitel => ({
  id: "mehratomig", nr: 4, stufe: "os",
  title: tr("Ionen aus mehreren Atomen", "Ions made of several atoms"),
  desc: tr("Mehratomige Ionen erkennen, benennen und in Formeln mit Klammern einsetzen.", "Recognise and name polyatomic ions and use them in formulas with brackets."),
  def: {
    title: tr("Ionen aus mehreren Atomen", "Ions made of several atoms"),
    known: [
      tr("Gemisch", "mixture"), tr("Atom", "atom"), tr("Elektron", "electron"), tr("Ion", "ion"), tr("Kation", "cation"), "Anion", tr("Ladung", "charge"),
      tr("Ionenwand", "ion wall"), tr("Verhältnisformel", "ratio formula"), tr("Index", "subscript"), tr("Ionengitter", "ionic lattice"), tr("Salz", "salt"),
      tr("Oxid-Ion", "oxide ion"), tr("Chlorid-Ion", "chloride ion"), tr("Gruppe", "group"),
    ],
    steps: [
      // ── Atomgruppen mit Ladung ──
      model({
        mode: "worked", part: tr("Atomgruppen mit Ladung", "Groups of atoms with a charge"),
        say: tr("Manche Ionen bestehen aus mehreren Atomen. Ein **mehratomiges Ion** ist eine feste Gruppe von Atomen mit **einer** gemeinsamen Ladung.",
          "Some ions are made of several atoms. A **polyatomic ion** is a fixed group of atoms with **one** shared charge."),
        ask: tr("Wie ist das **Sulfat-Ion** SO₄²⁻ aufgebaut?", "How is the **sulfate ion** SO₄²⁻ built?"),
        lines: [
          tr("Tiefgestellte Zahl = Anzahl der Atome: 1 S-Atom, 4 O-Atome.", "Subscript = number of atoms: 1 S atom, 4 O atoms."),
          tr("Hochgestellt = Ladung der ganzen Gruppe: 2−.", "Superscript = charge of the whole group: 2−."),
          tr("Hier zählt: Die Gruppe verhält sich wie **ein** Ion mit einer Ladung.", "What matters here: the group behaves like **one** ion with one charge."),
        ],
        visual: c => <IonModel c={c} center="S" lig="O" init={{ n: 4, h: 0, q: -2 }} sol={{ n: 4, h: 0, q: -2 }} steps={["n", "q"]} showName />,
        labels: [
          { at: ".k4-at.S", text: tr("S-Atom", "S atom"), side: "left", point: "left" },
          { at: ".k4-at.O", text: tr("O-Atom", "O atom"), side: "right", point: "right" },
        ],
        ok: tr("SO₄²⁻: 5 Atome, zusammen **ein** Ion mit der Ladung 2−.", "SO₄²⁻: 5 atoms, together **one** ion with the charge 2−."),
      }),
      model({
        mode: "faded", show: SHOW(),
        say: tr("Das **Nitrat-Ion** besteht aus 1 N-Atom und 3 O-Atomen. Die ganze Gruppe trägt die Ladung 1−.",
          "The **nitrate ion** is made of 1 N atom and 3 O atoms. The whole group carries the charge 1−."),
        ask: tr("Ergänze im Modell: Stelle O-Atome und Ladung ein. Dann prüfe.", "Complete it in the model: set the O atoms and the charge. Then check."),
        lines: [tr("1 N-Atom und 3 O-Atome → NO₃", "1 N atom and 3 O atoms → NO₃"), tr("Ladung 1− oben rechts dazu → {?}", "Add the charge 1− at the top right → {?}")],
        answer: "NO₃⁻",
        why: {
          "NO₃": tr("Die Atome stimmen. Es fehlt noch die Ladung der Gruppe.", "The atoms are right. The charge of the group is still missing."),
          "NO₃⁺": tr("Das Nitrat-Ion ist negativ: Ladung 1−, nicht 1+.", "The nitrate ion is negative: charge 1−, not 1+."),
          "NO₃²⁻": tr("Eine Ladung zu viel: Die ganze Gruppe trägt 1−.", "One charge too many: the whole group carries 1−."),
          "NO₂⁻": tr("Zähle die O-Atome: Nitrat hat 3.", "Count the O atoms: nitrate has 3."),
          "NO₄⁻": tr("Ein O-Atom zu viel: Nitrat hat 3.", "One O atom too many: nitrate has 3."),
        },
        tip: tr("Erst die O-Atome einstellen, dann die Ladung der ganzen Gruppe.", "First set the O atoms, then the charge of the whole group."),
        visual: c => <IonModel c={c} center="N" lig="O" init={{ n: 1, h: 0, q: 0 }} sol={{ n: 3, h: 0, q: -1 }} steps={["n", "q"]} />,
        ok: tr("Nitrat-Ion **NO₃⁻**: 1 N, 3 O, zusammen 1−.", "Nitrate ion **NO₃⁻**: 1 N, 3 O, together 1−."),
      }),
      model({
        mode: "free", show: SHOW(),
        ask: tr("Jetzt du: Baue das **Phosphat-Ion** PO₄³⁻ nach. Lies Atome und Ladung aus der Formel.", "Your turn: build the **phosphate ion** PO₄³⁻. Read the atoms and the charge from the formula."),
        answer: "PO₄³⁻",
        why: {
          "PO₃⁴⁻": tr("Vertauscht: Die tiefgestellte 4 zählt die O-Atome, die hochgestellte 3 ist die Ladung.", "Swapped: the subscript 4 counts the O atoms, the superscript 3 is the charge."),
          "PO₄": tr("Die Atome stimmen. Es fehlt die Ladung: oben steht 3−.", "The atoms are right. The charge is missing: the top shows 3−."),
          "PO₄³⁺": tr("Das Minus zeigt: Die Gruppe ist negativ.", "The minus shows: the group is negative."),
          "PO₃³⁻": tr("Unten steht 4: Es sind 4 O-Atome.", "The subscript is 4: there are 4 O atoms."),
        },
        tip: tr("Unten klein: Anzahl der Atome. Oben klein: Ladung.", "Small at the bottom: number of atoms. Small at the top: charge."),
        visual: c => <IonModel c={c} center="P" lig="O" init={{ n: 1, h: 0, q: 0 }} sol={{ n: 4, h: 0, q: -3 }} steps={["n", "q"]} showFormula={false} />,
        ok: tr("**PO₄³⁻**: 1 P, 4 O, Ladung 3−.", "**PO₄³⁻**: 1 P, 4 O, charge 3−."),
      }),
      {
        mode: "worked",
        say: tr("Ein mehratomiges Ion ist **kein Gemisch** aus einzelnen Ionen.", "A polyatomic ion is **not a mixture** of single ions."),
        ask: tr("Warum ist SO₄²⁻ nicht aus S²⁻ und O²⁻ gemischt?", "Why is SO₄²⁻ not a mix of S²⁻ and O²⁻?"),
        lines: [
          tr("Aus S²⁻ und 4 O²⁻ käme: 2− + 4 · (2−) = 10−.", "From S²⁻ and 4 O²⁻ you would get: 2− + 4 · (2−) = 10−."),
          tr("Das Sulfat-Ion trägt aber nur 2−.", "But the sulfate ion only carries 2−."),
          tr("Die Atome halten fest zusammen – wie, lernst du bei der Elektronenpaarbindung.", "The atoms hold together tightly – you will learn how in covalent bonding."),
          tr("Die Ladung gehört der ganzen Gruppe.", "The charge belongs to the whole group."),
        ],
        visual: () => <NotMixture />,
        ok: tr("SO₄²⁻ ist **ein** Teilchen mit der Ladung 2−.", "SO₄²⁻ is **one** particle with the charge 2−."),
      },
      {
        mode: "faded",
        ask: tr("Ergänze: Wem gehört die Ladung 2− im **Carbonat-Ion** CO₃²⁻?", "Complete: who does the charge 2− belong to in the **carbonate ion** CO₃²⁻?"),
        lines: [tr("CO₃²⁻: 1 C-Atom, 3 O-Atome, Ladung 2−.", "CO₃²⁻: 1 C atom, 3 O atoms, charge 2−."), tr("Die 2− gehört {?}", "The 2− belongs to {?}")],
        options: [tr("nur dem C-Atom", "only the C atom"), tr("jedem O-Atom", "each O atom"), tr("der ganzen Gruppe", "the whole group"), tr("dem letzten O-Atom", "the last O atom")],
        answer: tr("der ganzen Gruppe", "the whole group"),
        why: {
          [tr("nur dem C-Atom", "only the C atom")]: tr("Die Ladung steht hinter der ganzen Formel, nicht hinter dem C.", "The charge stands after the whole formula, not after the C."),
          [tr("jedem O-Atom", "each O atom")]: tr("Dann wären es 3 · (2−) = 6−. Die Gruppe trägt nur 2−.", "Then it would be 3 · (2−) = 6−. The group only carries 2−."),
          [tr("dem letzten O-Atom", "the last O atom")]: tr("Die Ladung steht am Ende, gilt aber für die ganze Gruppe.", "The charge stands at the end, but it applies to the whole group."),
        },
        visual: () => <div className="k4-ion-pic"><IonBlock center="C" lig="O" n={3} q={-2} /></div>,
        ok: tr("Die Ladung gehört der **ganzen Gruppe**: CO₃²⁻ ist ein Ion.", "The charge belongs to the **whole group**: CO₃²⁻ is one ion."),
      },
      model({
        mode: "free", show: SHOW(),
        say: tr("Fast alle mehratomigen Ionen sind negativ. Das **Ammonium-Ion** ist positiv: 1 N-Atom, 4 H-Atome, Ladung 1+.",
          "Almost all polyatomic ions are negative. The **ammonium ion** is positive: 1 N atom, 4 H atoms, charge 1+."),
        ask: tr("Jetzt du: Stelle das Ammonium-Ion ein und prüfe.", "Your turn: set up the ammonium ion and check."),
        answer: "NH₄⁺",
        why: {
          "NH₄⁻": tr("Ammonium ist das positive mehratomige Ion: Ladung 1+.", "Ammonium is the positive polyatomic ion: charge 1+."),
          "NH₄": tr("Die Atome stimmen. Es fehlt noch die Ladung 1+.", "The atoms are right. The charge 1+ is still missing."),
          "NH₃⁺": tr("Zähle die H-Atome: Ammonium hat 4.", "Count the H atoms: ammonium has 4."),
          "NH₄²⁺": tr("Eine Ladung zu viel: Ammonium trägt 1+.", "One charge too many: ammonium carries 1+."),
        },
        tip: tr("Lies im Text nach: wie viele H-Atome, welche Ladung?", "Look it up in the text: how many H atoms, which charge?"),
        visual: c => <IonModel c={c} center="N" lig="H" init={{ n: 0, h: 0, q: 0 }} sol={{ n: 4, h: 0, q: 1 }} steps={["n", "q"]} />,
        ok: tr("Ammonium-Ion **NH₄⁺**: 1 N, 4 H, Ladung 1+ – ein Kation.", "Ammonium ion **NH₄⁺**: 1 N, 4 H, charge 1+ – a cation."),
      }),
      {
        mode: "free",
        ask: tr("Wie viele **Atome** stecken in einem Carbonat-Ion CO₃²⁻?", "How many **atoms** are there in one carbonate ion CO₃²⁻?"),
        num: {}, answer: 4,
        why: {
          "3": tr("Das C-Atom zählt mit: 1 C und 3 O.", "The C atom counts too: 1 C and 3 O."),
          "2": tr("Die 2 oben ist die Ladung, keine Anzahl.", "The 2 at the top is the charge, not a number of atoms."),
          "6": tr("Die Ladung zählt keine Atome. Zähle nur C und O.", "The charge does not count atoms. Count only C and O."),
        },
        tip: tr("Ein Zeichen ohne Zahl zählt einmal, eins mit tiefgestellter Zahl so oft.", "A symbol without a number counts once, one with a subscript that many times."),
        visual: c => <BigIon c={c} center="C" lig="O" n={3} q={-2} />,
        ok: tr("CO₃²⁻: 1 C + 3 O = 4 Atome. Die 2− ist die Ladung.", "CO₃²⁻: 1 C + 3 O = 4 atoms. The 2− is the charge."),
      },

      // ── Namen ──
      model({
        mode: "worked", part: tr("Namen: -at, -it, Hydrogen-", "Names: -ate, -ite, hydrogen"),
        say: tr("Ionen mit Sauerstoff enden auf **-at**. Hat ein Ion ein O-Atom weniger, endet es auf **-it**.",
          "Ions with oxygen end in **-ate**. If an ion has one O atom fewer, it ends in **-ite**."),
        ask: tr("Wie heißt SO₃²⁻?", "What is SO₃²⁻ called?"),
        lines: [
          tr("SO₄²⁻ heißt **Sulfat**.", "SO₄²⁻ is called **sulfate**."),
          tr("SO₃²⁻ hat ein O-Atom weniger → **Sulfit**. Die Ladung bleibt 2−.", "SO₃²⁻ has one O atom fewer → **sulfite**. The charge stays 2−."),
          tr("Genauso: **Nitrat** NO₃⁻ und **Nitrit** NO₂⁻.", "Likewise: **nitrate** NO₃⁻ and **nitrite** NO₂⁻."),
        ],
        visual: c => <IonModel c={c} center="S" lig="O" init={{ n: 3, h: 0, q: 0 }} sol={{ n: 3, h: 0, q: 0 }} steps={["n"]} showName />,
        ok: tr("-at = mit Sauerstoff, -it = ein O weniger: Sulfat SO₄²⁻, Sulfit SO₃²⁻.", "-ate = with oxygen, -ite = one O fewer: sulfate SO₄²⁻, sulfite SO₃²⁻."),
      }),
      model({
        mode: "faded", show: SHOW(),
        ask: tr("Ergänze im Modell: Mach aus dem Nitrat-Ion das **Nitrit-Ion**.", "Complete it in the model: turn the nitrate ion into the **nitrite ion**."),
        lines: [tr("Nitrat: NO₃⁻", "Nitrate: NO₃⁻"), tr("Nitrit: ein O-Atom weniger → {?}", "Nitrite: one O atom fewer → {?}")],
        answer: "NO₂⁻",
        why: {
          "NO₃⁻": tr("Das ist noch Nitrat. -it heißt: ein O-Atom weniger.", "That is still nitrate. -ite means: one O atom fewer."),
          "NO₄": tr("Mehr O ergibt kein Ion der Liste. -it heißt: ein O weniger.", "More O gives no ion on the list. -ite means: one O fewer."),
          "NO": tr("Zu viele weggenommen: Nur **ein** O-Atom weniger als Nitrat.", "Too many removed: only **one** O atom fewer than nitrate."),
        },
        tip: tr("Vergleiche mit Sulfat und Sulfit: Was ändert sich?", "Compare with sulfate and sulfite: what changes?"),
        visual: c => <IonModel c={c} center="N" lig="O" init={{ n: 3, h: 0, q: 0 }} sol={{ n: 2, h: 0, q: 0 }} steps={["n"]} />,
        ok: tr("Nitrit **NO₂⁻**: ein O weniger als Nitrat, gleiche Ladung 1−.", "Nitrite **NO₂⁻**: one O fewer than nitrate, same charge 1−."),
      }),
      model({
        mode: "free", show: SHOW(),
        ask: tr("Jetzt du: Wie heißt dieses Ion? Setze den Namen aus zwei Bausteinen zusammen.", "Your turn: what is this ion called? Build the name from two parts."),
        answer: tr("Sulfit", "Sulfite"),
        why: {
          [tr("Sulfat", "Sulfate")]: tr("Sulfat hat 4 O-Atome. Hier sind es 3 – eins weniger.", "Sulfate has 4 O atoms. Here there are 3 – one fewer."),
          [tr("Sulfid", "Sulfide")]: tr("-id passt zum S²⁻ ohne O-Atome. Hier sind O-Atome dabei.", "-ide fits S²⁻ without O atoms. Here O atoms are included."),
          [tr("Nitrit", "Nitrite")]: tr("Nitr- steht für Stickstoff N. Das Atom in der Mitte ist S.", "Nitr- stands for nitrogen N. The atom in the middle is S."),
          [tr("Carbonit", "Carbonite")]: tr("Carbon- steht für Kohlenstoff C. Das Atom in der Mitte ist S.", "Carbon- stands for carbon C. The atom in the middle is S."),
        },
        tip: tr("Zähle die O-Atome und vergleiche mit Sulfat SO₄²⁻.", "Count the O atoms and compare with sulfate SO₄²⁻."),
        visual: c => <NameKit c={c} figure={<div className="k4-ion-pic"><IonBlock center="S" lig="O" n={3} q={-2} /></div>}
          slots={[{ id: "s", items: ["Sulf", "Nitr", "Carbon"] }, { id: "e", items: [tr("at", "ate"), tr("it", "ite"), tr("id", "ide")] }]}
          sol={["Sulf", tr("it", "ite")]} />,
        ok: tr("SO₃²⁻ = **Sulfit**: ein O weniger als Sulfat.", "SO₃²⁻ = **sulfite**: one O fewer than sulfate."),
      }),
      model({
        mode: "worked",
        say: tr("Ein **Wasserstoff-Ion** H⁺ ist ein H-Atom ohne sein Elektron. Kommt es an Carbonat, entsteht **Hydrogencarbonat**.",
          "A **hydrogen ion** H⁺ is an H atom without its electron. When it joins carbonate, **hydrogen carbonate** forms."),
        ask: tr("Was ändert H⁺ am Carbonat-Ion?", "What does H⁺ change in the carbonate ion?"),
        lines: [
          tr("CO₃²⁻ + H⁺ → HCO₃⁻: ein H-Atom mehr.", "CO₃²⁻ + H⁺ → HCO₃⁻: one H atom more."),
          tr("Ladung: 2− + 1+ = 1−.", "Charge: 2− + 1+ = 1−."),
          tr("Name: Vorsilbe **Hydrogen-** → **Hydrogencarbonat-Ion**.", "Name: prefix **hydrogen** → **hydrogen carbonate ion**."),
          tr("Ausnahme: Das **Hydroxid-Ion** OH⁻ hat 2 Atome und endet trotzdem auf -id.", "Exception: the **hydroxide ion** OH⁻ has 2 atoms and still ends in -ide."),
        ],
        visual: c => <IonModel c={c} center="C" lig="O" init={{ n: 3, h: 1, q: 0 }} sol={{ n: 3, h: 1, q: 0 }} steps={["n", "h"]} showName />,
        labels: [{ at: ".k4-at.H", text: tr("H⁺ dazu", "H⁺ added"), side: "left", point: "left" }],
        ok: tr("Hydrogen- heißt: ein H⁺ mehr, die Ladung wird um 1 weniger negativ.", "Hydrogen means: one more H⁺, the charge becomes 1 less negative."),
      }),
      model({
        mode: "faded", show: SHOW(),
        ask: tr("Ergänze im Modell: Setze ein H an das Carbonat-Ion und stelle die neue Ladung ein.", "Complete it in the model: add an H to the carbonate ion and set the new charge."),
        lines: [tr("CO₃²⁻ + H⁺: ein H-Atom mehr, eine positive Ladung mehr.", "CO₃²⁻ + H⁺: one H atom more, one positive charge more."), tr("Hydrogencarbonat-Ion: {?}", "Hydrogen carbonate ion: {?}")],
        answer: "HCO₃⁻",
        why: {
          "HCO₃²⁻": tr("H⁺ bringt 1+ mit: 2− + 1+ = 1−. Stelle die Ladung um.", "H⁺ brings 1+: 2− + 1+ = 1−. Change the charge."),
          "HCO₃³⁻": tr("H⁺ ist positiv. Die Ladung wird weniger negativ, nicht mehr.", "H⁺ is positive. The charge becomes less negative, not more."),
          "HCO₃": tr("2− + 1+ ergibt nicht 0. Rechne nochmal.", "2− + 1+ does not give 0. Work it out again."),
          "CO₃²⁻": tr("Noch kein H dabei: Setze ein H-Atom dazu.", "No H yet: add one H atom."),
          "H₂CO₃⁻": tr("Hydrogen- heißt: genau ein H mehr.", "Hydrogen means: exactly one H more."),
        },
        tip: tr("Rechne: Ladung des Carbonat-Ions plus Ladung von H⁺.", "Work it out: charge of the carbonate ion plus charge of H⁺."),
        visual: c => <IonModel c={c} center="C" lig="O" init={{ n: 3, h: 0, q: -2 }} sol={{ n: 3, h: 1, q: -1 }} steps={["h", "q"]} />,
        ok: tr("**HCO₃⁻**: 2− + 1+ = 1−.", "**HCO₃⁻**: 2− + 1+ = 1−."),
      }),
      {
        mode: "free",
        ask: tr("Jetzt du: Wie heißt das Ion **OH⁻**?", "Your turn: what is the ion **OH⁻** called?"),
        options: [tr("Oxid-Ion", "Oxide ion"), tr("Hydroxid-Ion", "Hydroxide ion"), tr("Ammonium-Ion", "Ammonium ion"), tr("Hydrogencarbonat-Ion", "Hydrogen carbonate ion")],
        answer: tr("Hydroxid-Ion", "Hydroxide ion"),
        why: {
          [tr("Oxid-Ion", "Oxide ion")]: tr("Das Oxid-Ion O²⁻ ist nur ein O-Atom. OH⁻ hat noch ein H.", "The oxide ion O²⁻ is just one O atom. OH⁻ also has an H."),
          [tr("Ammonium-Ion", "Ammonium ion")]: tr("Ammonium ist NH₄⁺: positiv und mit N.", "Ammonium is NH₄⁺: positive and with N."),
          [tr("Hydrogencarbonat-Ion", "Hydrogen carbonate ion")]: tr("Hydrogencarbonat HCO₃⁻ enthält C und 3 O.", "Hydrogen carbonate HCO₃⁻ contains C and 3 O."),
        },
        visual: () => <div className="k4-ion-pic"><IonBlock center="O" lig="H" n={1} q={-1} /></div>,
        ok: tr("OH⁻ = **Hydroxid-Ion**: endet auf -id, ist aber mehratomig.", "OH⁻ = **hydroxide ion**: ends in -ide, but it is polyatomic."),
      },

      // ── Formeln mit Klammern ──
      model({
        mode: "worked", part: tr("Formeln mit Klammern", "Formulas with brackets"),
        say: tr("Braucht man ein mehratomiges Ion mehrmals, kommt es in **Klammern**. Die Anzahl steht als Index hinter der Klammer.",
          "If a polyatomic ion is needed more than once, it goes in **brackets**. The number stands as a subscript after the bracket."),
        ask: tr("Wie schreibt man die Formel von **Calciumhydroxid**?", "How do you write the formula of **calcium hydroxide**?"),
        lines: [
          tr("Die Wand braucht 2 OH⁻ → (OH)₂, also **Ca(OH)₂**: 1 Ca, 2 O, 2 H.", "The wall needs 2 OH⁻ → (OH)₂, so **Ca(OH)₂**: 1 Ca, 2 O, 2 H."),
          tr("Ohne Klammer hieße CaOH₂: nur 1 O, aber 2 H.", "Without brackets CaOH₂ would mean: only 1 O, but 2 H."),
        ],
        visual: c => <WriteModel c={c} cat="Ca2+" an="OH-" nC={1} nA={2} which="A" init={{ br: true, k: 2 }} sol={{ br: true, k: 2 }} />,
        ok: tr("Klammer um das ganze Ion, die Zahl dahinter: **Ca(OH)₂**.", "Brackets round the whole ion, the number after them: **Ca(OH)₂**."),
      }),
      model({
        mode: "faded", show: SHOW(),
        ask: tr("Ergänze im Modell: Gleiche **Magnesiumnitrat** mit den Zählern aus.", "Complete it in the model: balance **magnesium nitrate** with the counters."),
        lines: [tr("Mg²⁺ bringt 2+, jedes NO₃⁻ bringt 1−.", "Mg²⁺ brings 2+, each NO₃⁻ brings 1−."), tr("Formel: {?}", "Formula: {?}")],
        answer: "Mg(NO₃)₂",
        why: wallWhy("Mg2+", "NO3-"),
        tip: tr("Stelle die Zähler so ein, dass beide Reihen gleich lang sind.", "Set the counters so that both rows are the same length."),
        visual: c => <WallModel c={c} cat="Mg2+" an="NO3-" init={[1, 1]} sol={[1, 2]} />,
        ok: tr("1 · (2+) = 2+ und 2 · (1−) = 2− → **Mg(NO₃)₂**.", "1 · (2+) = 2+ and 2 · (1−) = 2− → **Mg(NO₃)₂**."),
      }),
      model({
        mode: "free", show: SHOW(),
        ask: tr("Jetzt du: Baue **Aluminiumsulfat** mit möglichst wenigen Ionen.", "Your turn: build **aluminium sulfate** with as few ions as possible."),
        answer: "Al₂(SO₄)₃",
        why: wallWhy("Al3+", "SO42-"),
        tip: tr("Erhöhe abwechselnd, bis Plus und Minus gleich groß sind.", "Increase them in turn until plus and minus are the same size."),
        visual: c => <WallModel c={c} cat="Al3+" an="SO42-" init={[1, 1]} sol={[2, 3]} />,
        lines: [tr("SO₄ dreimal → (SO₄)₃. Al zweimal → Al₂, ein Atom braucht keine Klammer.", "SO₄ three times → (SO₄)₃. Al twice → Al₂, a single atom needs no brackets.")],
        ok: tr("2 · (3+) = 6+ und 3 · (2−) = 6− → **Al₂(SO₄)₃**.", "2 · (3+) = 6+ and 3 · (2−) = 6− → **Al₂(SO₄)₃**."),
      }),
      model({
        mode: "worked",
        say: tr("Kommt das mehratomige Ion nur **einmal** vor, braucht es keine Klammer.", "If the polyatomic ion appears only **once**, it needs no brackets."),
        ask: tr("Welche Formel hat **Calciumcarbonat** (Kalk)?", "What is the formula of **calcium carbonate** (limestone)?"),
        lines: [
          tr("1 · (2+) = 2+ und 1 · (2−) = 2−.", "1 · (2+) = 2+ and 1 · (2−) = 2−."),
          tr("Ein Carbonat-Ion → keine Klammer: **CaCO₃**.", "One carbonate ion → no brackets: **CaCO₃**."),
          tr("Genauso: NaHCO₃, KNO₃. Aber zwei Ammonium-Ionen: (NH₄)₂…", "Likewise: NaHCO₃, KNO₃. But two ammonium ions: (NH₄)₂…"),
        ],
        visual: c => <WallModel c={c} cat="Ca2+" an="CO32-" init={[1, 1]} sol={[1, 1]} name />,
        ok: tr("Klammer nur, wenn ein mehratomiges Ion mehrmals vorkommt.", "Brackets only when a polyatomic ion appears more than once."),
      }),
      model({
        mode: "faded", show: SHOW(),
        ask: tr("Ergänze im Modell: Schreibe die Formel von **Ammoniumsulfat**.", "Complete it in the model: write the formula of **ammonium sulfate**."),
        lines: [tr("2 NH₄⁺ (2+) und 1 SO₄²⁻ (2−).", "2 NH₄⁺ (2+) and 1 SO₄²⁻ (2−)."), tr("Formel: {?}", "Formula: {?}")],
        answer: "(NH₄)₂SO₄",
        why: {
          "NH₄₂SO₄": tr("Ohne Klammer verschmilzt die 2 mit der 4: Das hieße 42 H-Atome.", "Without brackets the 2 merges with the 4: that would mean 42 H atoms."),
          "NH₄SO₄": tr("Ein NH₄⁺ gleicht 2− nicht aus. Es sind 2 Ammonium-Ionen.", "One NH₄⁺ does not balance 2−. There are 2 ammonium ions."),
          "(NH₄)SO₄": tr("Die Klammer allein reicht nicht: Die 2 gehört dahinter.", "The bracket alone is not enough: the 2 goes after it."),
          "(NH₄)₃SO₄": tr("Zähle die Kationen in der Wand: Es sind 2.", "Count the cations in the wall: there are 2."),
        },
        tip: tr("Vergleiche die Atome laut Formel mit der Ionenwand.", "Compare the atoms in the formula with the ion wall."),
        visual: c => <WriteModel c={c} cat="NH4+" an="SO42-" nC={2} nA={1} which="C" init={{ br: false, k: 1 }} sol={{ br: true, k: 2 }} />,
        ok: tr("**(NH₄)₂SO₄**: 2 N, 8 H, 1 S, 4 O.", "**(NH₄)₂SO₄**: 2 N, 8 H, 1 S, 4 O."),
      }),
      model({
        mode: "free", show: SHOW(),
        ask: tr("Jetzt du: Schreibe die Formel von **Natriumhydroxid**.", "Your turn: write the formula of **sodium hydroxide**."),
        answer: "NaOH",
        why: {
          "Na(OH)": tr("Ein einzelnes OH⁻ braucht keine Klammer.", "A single OH⁻ needs no brackets."),
          "Na(OH)₂": tr("1+ und 1− gleichen sich 1 : 1 aus. Es ist nur ein OH⁻.", "1+ and 1− balance 1 : 1. There is only one OH⁻."),
          "NaOH₂": tr("Das hieße 1 O, aber 2 H. Und es ist nur ein OH⁻.", "That would mean 1 O but 2 H. And there is only one OH⁻."),
        },
        tip: tr("Wie oft kommt OH⁻ in der Ionenwand vor?", "How many times does OH⁻ appear in the ion wall?"),
        visual: c => <WriteModel c={c} cat="Na+" an="OH-" nC={1} nA={1} which="A" init={{ br: true, k: 2 }} sol={{ br: false, k: 1 }} />,
        ok: tr("**NaOH**: ein OH⁻, also keine Klammer.", "**NaOH**: one OH⁻, so no brackets."),
      }),

      // ── Name ↔ Formel ──
      model({
        mode: "worked", part: tr("Name ↔ Formel", "Name ↔ formula"),
        say: tr("Der Name nennt die Ionen: vorn das Kation, hinten das Anion. Aus den Ladungen folgt die Formel.",
          "The name tells you the ions: the cation first, then the anion. The formula follows from the charges."),
        ask: tr("Welche Formel hat **Natriumhydrogencarbonat** (Natron)?", "What is the formula of **sodium hydrogen carbonate** (baking soda)?"),
        lines: [
          tr("Natrium → Na⁺, Hydrogencarbonat → HCO₃⁻.", "Sodium → Na⁺, hydrogen carbonate → HCO₃⁻."),
          tr("1 · (1+) = 1+ und 1 · (1−) = 1− → 1 : 1.", "1 · (1+) = 1+ and 1 · (1−) = 1− → 1 : 1."),
          tr("→ **NaHCO₃**, ohne Klammer.", "→ **NaHCO₃**, without brackets."),
        ],
        visual: c => <PickModel c={c} cats={["Na+", "Ca2+", "NH4+"]} ans={["CO32-", "HCO3-", "NO3-"]} sol={["Na+", "HCO3-"]} />,
        ok: tr("Name → Ionen → Ladungen ausgleichen → Formel.", "Name → ions → balance the charges → formula."),
      }),
      model({
        mode: "faded", show: SHOW(),
        ask: tr("Ergänze im Modell: Wähle die Ionen für **Ammoniumchlorid**.", "Complete it in the model: choose the ions for **ammonium chloride**."),
        lines: [tr("Ammonium → NH₄⁺, Chlorid → Cl⁻.", "Ammonium → NH₄⁺, chloride → Cl⁻."), tr("Formel: {?}", "Formula: {?}")],
        answer: "NH₄Cl",
        why: {
          "KCl": tr("K⁺ ist das Kalium-Ion. Ammonium ist NH₄⁺.", "K⁺ is the potassium ion. Ammonium is NH₄⁺."),
          "MgCl₂": tr("Mg²⁺ ist das Magnesium-Ion. Ammonium ist NH₄⁺.", "Mg²⁺ is the magnesium ion. Ammonium is NH₄⁺."),
          "NH₄NO₃": tr("NO₃⁻ ist Nitrat. Chlorid ist Cl⁻.", "NO₃⁻ is nitrate. Chloride is Cl⁻."),
          "(NH₄)₂SO₄": tr("SO₄²⁻ ist Sulfat. Chlorid ist Cl⁻.", "SO₄²⁻ is sulfate. Chloride is Cl⁻."),
          "–": tr("Wähle ein Kation und ein Anion.", "Choose a cation and an anion."),
        },
        tip: tr("Lies den Namen in zwei Teilen: Kation vorn, Anion hinten.", "Read the name in two parts: cation first, anion second."),
        visual: c => <PickModel c={c} cats={["K+", "NH4+", "Mg2+"]} ans={["SO42-", "NO3-", "Cl-"]} sol={["NH4+", "Cl-"]} />,
        ok: tr("**NH₄Cl**: 1 NH₄⁺, 1 Cl⁻.", "**NH₄Cl**: 1 NH₄⁺, 1 Cl⁻."),
      }),
      model({
        mode: "free", show: SHOW(),
        ask: tr("Jetzt du: Wähle die Ionen für **Calciumnitrat**.", "Your turn: choose the ions for **calcium nitrate**."),
        answer: "Ca(NO₃)₂",
        why: {
          "Ca(NO₂)₂": tr("NO₂⁻ ist Nitrit. Nitrat hat ein O mehr: NO₃⁻.", "NO₂⁻ is nitrite. Nitrate has one O more: NO₃⁻."),
          "CaSO₃": tr("SO₃²⁻ ist Sulfit. Gesucht ist Nitrat.", "SO₃²⁻ is sulfite. You are looking for nitrate."),
          "KNO₃": tr("K⁺ ist Kalium. Calcium ist Ca²⁺.", "K⁺ is potassium. Calcium is Ca²⁺."),
          "NaNO₃": tr("Na⁺ ist Natrium. Calcium ist Ca²⁺.", "Na⁺ is sodium. Calcium is Ca²⁺."),
          "–": tr("Wähle ein Kation und ein Anion.", "Choose a cation and an anion."),
        },
        tip: tr("Erst das Kation aus dem Namen, dann das Anion: -at oder -it?", "First the cation from the name, then the anion: -ate or -ite?"),
        visual: c => <PickModel c={c} cats={["K+", "Ca2+", "Na+"]} ans={["NO2-", "SO32-", "NO3-"]} sol={["Ca2+", "NO3-"]} />,
        ok: tr("**Ca(NO₃)₂**: 1 Ca²⁺, 2 NO₃⁻ – Nitrat in Klammern.", "**Ca(NO₃)₂**: 1 Ca²⁺, 2 NO₃⁻ – nitrate in brackets."),
      }),
      model({
        mode: "free", show: SHOW(),
        ask: tr("Jetzt du: Gleiche **Natriumphosphat** mit möglichst wenigen Ionen aus.", "Your turn: balance **sodium phosphate** with as few ions as possible."),
        answer: "Na₃PO₄",
        why: wallWhy("Na+", "PO43-"),
        tip: tr("Wie viele Na⁺ gleichen die Ladung eines Phosphat-Ions aus?", "How many Na⁺ balance the charge of one phosphate ion?"),
        visual: c => <WallModel c={c} cat="Na+" an="PO43-" init={[1, 2]} sol={[3, 1]} />,
        ok: tr("3 · (1+) = 3+ und 1 · (3−) = 3− → **Na₃PO₄**, ohne Klammer.", "3 · (1+) = 3+ and 1 · (3−) = 3− → **Na₃PO₄**, without brackets."),
      }),
      model({
        mode: "free", show: SHOW(),
        ask: tr("Jetzt du: Wie heißt **Mg(OH)₂**? Setze den Namen zusammen.", "Your turn: what is **Mg(OH)₂** called? Build the name."),
        answer: tr("Magnesiumhydroxid", "Magnesium hydroxide"),
        why: {
          [tr("Magnesiumoxid", "Magnesium oxide")]: tr("Oxid ist O²⁻ ohne H. In Mg(OH)₂ steckt OH⁻.", "Oxide is O²⁻ without H. Mg(OH)₂ contains OH⁻."),
          [tr("Magnesiumdihydroxid", "Magnesium dihydroxide")]: tr("Die Anzahl steht nicht im Namen. Die Ladungen legen sie fest.", "The number is not part of the name. The charges fix it."),
          [tr("Manganhydroxid", "Manganese hydroxide")]: tr("Mg ist Magnesium. Mangan hat das Zeichen Mn.", "Mg is magnesium. Manganese has the symbol Mn."),
        },
        tip: tr("Benenne erst das Kation, dann das Ion in der Klammer.", "Name the cation first, then the ion in the brackets."),
        visual: c => <NameKit c={c} figure={wallFig("Mg2+", "OH-", 1, 2)} join={nameJoin()}
          slots={[{ id: "c", items: [tr("Mangan", "Manganese"), "Magnesium"] }, { id: "a", items: [tr("oxid", "oxide"), tr("dihydroxid", "dihydroxide"), tr("hydroxid", "hydroxide")] }]}
          sol={["Magnesium", tr("hydroxid", "hydroxide")]} />,
        ok: tr("**Magnesiumhydroxid**: Zahlen stehen nur in der Formel, nicht im Namen.", "**Magnesium hydroxide**: numbers appear only in the formula, not in the name."),
      }),
      model({
        mode: "free", show: SHOW(),
        ask: tr("Jetzt du: Wie heißt **(NH₄)₂SO₄**? Setze den Namen zusammen.", "Your turn: what is **(NH₄)₂SO₄** called? Build the name."),
        answer: tr("Ammoniumsulfat", "Ammonium sulfate"),
        why: {
          [tr("Diammoniumsulfat", "Diammonium sulfate")]: tr("Die 2 steht nur in der Formel. Der Name nennt nur die Ionen.", "The 2 appears only in the formula. The name only gives the ions."),
          [tr("Ammoniumsulfit", "Ammonium sulfite")]: tr("SO₄²⁻ hat 4 O-Atome: Sulfat. Sulfit wäre SO₃²⁻.", "SO₄²⁻ has 4 O atoms: sulfate. Sulfite would be SO₃²⁻."),
          [tr("Ammoniumsulfid", "Ammonium sulfide")]: tr("Sulfid ist S²⁻ ohne O. Hier steht SO₄²⁻.", "Sulfide is S²⁻ without O. Here it is SO₄²⁻."),
        },
        tip: tr("Benenne beide Ionen. Achte beim Anion auf die Zahl der O-Atome.", "Name both ions. For the anion, look at the number of O atoms."),
        visual: c => <NameKit c={c} figure={wallFig("NH4+", "SO42-", 2, 1)} join={nameJoin()}
          slots={[{ id: "c", items: [tr("Diammonium", "Diammonium"), "Ammonium"] }, { id: "a", items: [tr("sulfid", "sulfide"), tr("sulfat", "sulfate"), tr("sulfit", "sulfite")] }]}
          sol={["Ammonium", tr("sulfat", "sulfate")]} />,
        ok: tr("**Ammoniumsulfat** (NH₄)₂SO₄: Kation Ammonium, Anion Sulfat.", "**Ammonium sulfate** (NH₄)₂SO₄: cation ammonium, anion sulfate."),
      }),
    ],
    outro: [
      tr("Mehratomige Ionen als **eine** Gruppe mit einer Ladung erkennen: SO₄²⁻, NH₄⁺.", "Recognise polyatomic ions as **one** group with one charge: SO₄²⁻, NH₄⁺."),
      tr("Namen bilden: -at, -it, Hydrogen-, Hydroxid, Ammonium.", "Form names: -ate, -ite, hydrogen, hydroxide, ammonium."),
      tr("Formeln mit Klammern schreiben: Ca(OH)₂, Al₂(SO₄)₃ – und ohne Klammer bei einem Ion.", "Write formulas with brackets: Ca(OH)₂, Al₂(SO₄)₃ – and without brackets for a single ion."),
      tr("Vom Namen zur Formel und von der Formel zum Namen.", "Go from the name to the formula and from the formula to the name."),
    ],
  },
  explain: [
    [
      tr("Ein **mehratomiges Ion** ist eine feste Gruppe aus mehreren Atomen mit **einer** gemeinsamen Ladung, z. B. Sulfat SO₄²⁻.", "A **polyatomic ion** is a fixed group of several atoms with **one** shared charge, e.g. sulfate SO₄²⁻."),
      tr("Tiefgestellte Zahl = Anzahl der Atome, hochgestellt = Ladung der ganzen Gruppe: SO₄²⁻ hat 1 S, 4 O, Ladung 2−.", "Subscript = number of atoms, superscript = charge of the whole group: SO₄²⁻ has 1 S, 4 O, charge 2−."),
      tr("Es ist **kein Gemisch** einzelner Ionen: Die Ladung gehört der ganzen Gruppe.", "It is **not a mixture** of single ions: the charge belongs to the whole group."),
      tr("Fast alle mehratomigen Ionen sind Anionen. Das Ammonium-Ion ist ein Kation.", "Almost all polyatomic ions are anions. The ammonium ion is a cation."),
    ],
    [
      tr("Endung **-at**: Ion mit Sauerstoff, z. B. Sulfat SO₄²⁻, Carbonat CO₃²⁻.", "Ending **-ate**: ion with oxygen, e.g. sulfate SO₄²⁻, carbonate CO₃²⁻."),
      tr("Endung **-it**: ein O-Atom weniger als bei -at, gleiche Ladung.", "Ending **-ite**: one O atom fewer than -ate, same charge."),
      tr("Vorsilbe **Hydrogen-**: ein H⁺ mehr, die Ladung wird um 1 weniger negativ.", "Prefix **hydrogen**: one more H⁺, the charge becomes 1 less negative."),
      tr("Endung **-id**: meist ein einzelnes Atom, z. B. Chlorid Cl⁻ – mit einer mehratomigen Ausnahme.", "Ending **-ide**: usually a single atom, e.g. chloride Cl⁻ – with one polyatomic exception."),
    ],
    [
      tr("Kommt ein mehratomiges Ion **mehrmals** vor, steht es in **Klammern**, die Anzahl dahinter: Ca(OH)₂.", "If a polyatomic ion appears **more than once**, it goes in **brackets** with the number after them: Ca(OH)₂."),
      tr("Ohne Klammer gilt die Zahl nur für das Atom davor: CaOH₂ hieße 1 O und 2 H.", "Without brackets the number only applies to the atom before it: CaOH₂ would mean 1 O and 2 H."),
      tr("Kommt es nur **einmal** vor, gibt es keine Klammer: CaCO₃.", "If it appears only **once**, there are no brackets: CaCO₃."),
    ],
    [
      tr("Name → Ionen: vorn das Kation, hinten das Anion – Natriumhydrogencarbonat: Na⁺ und HCO₃⁻.", "Name → ions: the cation first, then the anion – sodium hydrogen carbonate: Na⁺ and HCO₃⁻."),
      tr("Dann die Ladungen ausgleichen und die Formel schreiben: NaHCO₃.", "Then balance the charges and write the formula: NaHCO₃."),
      tr("Formel → Name: beide Ionen benennen. Zahlen kommen nicht in den Namen.", "Formula → name: name both ions. Numbers do not go into the name."),
    ],
  ],
});
