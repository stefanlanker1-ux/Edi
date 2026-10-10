// Kapitel 4 (Level II): Ionen aus mehreren Atomen – mehratomiges Ion als Atomgruppe mit einer Ladung, Namen (-at, -it, Hydrogen-, Hydroxid, Ammonium),
// Formeln mit Klammern, Name ↔ Formel. Wie die Atome im Ion zusammenhalten, kommt erst bei der Elektronenpaarbindung (ehrlich vertagt).
// Texte nennen Ladungen in Worten („zwei positive Ladungen“) – keine Rechnung mit Klammern und keine Breiten der Bausteine.

import { Fit } from "@lern/ui";
import { ION_BY_ID } from "@lern/chem";
import { tr } from "@lern/i18n";
import { IonWall } from "../components/IonWall.tsx";
import { model } from "./model.tsx";
import { BigIon, IonBlock, IonModel, NameKit, NotMixture, PickModel, WallModel, WriteModel, nameJoin, wallWhy } from "./k4/Models.tsx";
import type { Kapitel } from "./types.ts";
import "./k4/k4.css";


/** Ionen-Bausteine mit Formel (ohne Namen) als Bild im Namensbaukasten */
const wallFig = (cat: string, an: string, nC: number, nA: number) => (
  <Fit className="k4-wall" min={0.3}><IonWall cation={ION_BY_ID[cat]} anion={ION_BY_ID[an]} nC={nC} nA={nA} showName={false} /></Fit>
);

export const kapitel4 = (): Kapitel => ({
  id: "mehratomig", nr: 4, stufe: "os",
  title: tr("Ionen aus mehreren Atomen", "Ions made of several atoms"),
  desc: tr("Mehratomige Ionen erkennen und benennen und Formeln mit Klammern aufstellen.", "Recognise and name polyatomic ions and write formulas with brackets."),
  def: {
    title: tr("Ionen aus mehreren Atomen", "Ions made of several atoms"),
    known: [
      tr("Atom", "atom"), tr("Elektron", "electron"), tr("Ion", "ion"), tr("Kation", "cation"), "Anion", tr("Ladung", "charge"),
      tr("Verhältnisformel", "ratio formula"), tr("Index", "subscript"), tr("Ionengitter", "ionic lattice"), tr("Salz", "salt"),
      tr("Oxid-Ion", "oxide ion"), tr("Chlorid-Ion", "chloride ion"), tr("Gruppe", "group"),
    ],
    steps: [
      // ── Atomgruppen mit Ladung ──
      model({
        mode: "worked", part: tr("Atomgruppen mit Ladung", "Groups of atoms with a charge"),
        say: tr("Manche Ionen bestehen aus mehreren Atomen, die fest miteinander verbunden sind. Ein solches **mehratomiges Ion** ist eine **Atomgruppe** mit **einer** gemeinsamen Ladung.",
          "Some ions are made of several atoms that are firmly joined. Such a **polyatomic ion** is a **group of atoms** with **one** shared charge."),
        ask: tr("Wie ist das **Sulfat-Ion** SO₄²⁻ aufgebaut?", "How is the **sulfate ion** SO₄²⁻ built?"),
        lines: [
          tr("Die tiefgestellte Zahl gibt die Anzahl der Atome an: Das Sulfat-Ion hat ein S-Atom und vier O-Atome.", "The subscript gives the number of atoms: the sulfate ion has one S atom and four O atoms."),
          tr("Die hochgestellte 2− ist die Ladung der ganzen Atomgruppe. Im Modell steht sie außen an der eckigen Klammer.", "The superscript 2− is the charge of the whole group. In the model it stands outside the square bracket."),
          tr("Das Modell zeigt die Atome als Kugeln in einer Ebene. Das echte Ion ist räumlich gebaut.", "The model shows the atoms as spheres in one plane. The real ion is three-dimensional."),
        ],
        visual: c => <IonModel c={c} center="S" lig="O" init={{ n: 4, h: 0, q: -2 }} sol={{ n: 4, h: 0, q: -2 }} steps={["n", "q"]} showName />,
        labels: [
          { at: ".k4-at.S", text: tr("S-Atom", "S atom"), side: "left", point: "left" },
          { at: ".k4-at.O", text: tr("O-Atom", "O atom"), side: "right", point: "right" },
        ],
        ok: tr("Das Sulfat-Ion SO₄²⁻ besteht aus fünf Atomen. Zusammen bilden sie **ein** Ion mit der Ladung 2−.", "The sulfate ion SO₄²⁻ is made of five atoms. Together they form **one** ion with the charge 2−."),
      }),
      model({
        mode: "faded",
        say: tr("Das **Nitrat-Ion** besteht aus einem N-Atom und drei O-Atomen. Die ganze Atomgruppe trägt die Ladung 1−.",
          "The **nitrate ion** is made of one N atom and three O atoms. The whole group carries the charge 1−."),
        ask: tr("Baue das Nitrat-Ion im Modell nach.", "Build the nitrate ion in the model."),
        lines: [
          tr("Ein N-Atom und drei O-Atome ergeben die Atomgruppe NO₃.", "One N atom and three O atoms give the group NO₃."),
          tr("Mit der Ladung oben rechts lautet die Formel {?}.", "With the charge at the top right, the formula is {?}."),
        ],
        answer: "NO₃⁻",
        why: {
          "NO₃": tr("Die Atome stimmen schon. Es fehlt noch die Ladung der Atomgruppe.", "The atoms are already right. The charge of the group is still missing."),
          "NO₃⁺": tr("Das Nitrat-Ion ist negativ geladen. Seine Ladung ist 1− und nicht 1+.", "The nitrate ion is negatively charged. Its charge is 1−, not 1+."),
          "NO₃²⁻": tr("Das ist eine negative Ladung zu viel. Die ganze Atomgruppe trägt nur 1−.", "That is one negative charge too many. The whole group only carries 1−."),
          "NO₂⁻": tr("Hier fehlt ein O-Atom. Das Nitrat-Ion hat drei O-Atome.", "One O atom is missing here. The nitrate ion has three O atoms."),
          "NO₄⁻": tr("Das ist ein O-Atom zu viel. Das Nitrat-Ion hat drei O-Atome.", "That is one O atom too many. The nitrate ion has three O atoms."),
        },
        tip: tr("Stelle zuerst die O-Atome ein und dann die Ladung der ganzen Atomgruppe.", "First set the O atoms, then the charge of the whole group."),
        visual: c => <IonModel c={c} center="N" lig="O" init={{ n: 1, h: 0, q: 0 }} sol={{ n: 3, h: 0, q: -1 }} steps={["n", "q"]} />,
        ok: tr("Das Nitrat-Ion **NO₃⁻** besteht aus einem N-Atom und drei O-Atomen und trägt die Ladung 1−.", "The nitrate ion **NO₃⁻** is made of one N atom and three O atoms and carries the charge 1−."),
      }),
      model({
        mode: "free",
        ask: tr("Baue das **Phosphat-Ion** PO₄³⁻ im Modell nach. Atome und Ladung kannst du an der Formel ablesen.", "Build the **phosphate ion** PO₄³⁻ in the model. You can read the atoms and the charge from the formula."),
        answer: "PO₄³⁻",
        why: {
          "PO₃⁴⁻": tr("Hier sind die Zahlen vertauscht. Die tiefgestellte 4 zählt die O-Atome, die hochgestellte 3 gehört zur Ladung.", "The numbers are swapped here. The subscript 4 counts the O atoms, the superscript 3 belongs to the charge."),
          "PO₄": tr("Die Atome stimmen schon. Es fehlt noch die Ladung, die oben rechts in der Formel steht.", "The atoms are already right. The charge at the top right of the formula is still missing."),
          "PO₄³⁺": tr("Das Minuszeichen in der Formel zeigt, dass die Atomgruppe negativ geladen ist.", "The minus sign in the formula shows that the group is negatively charged."),
          "PO₃³⁻": tr("Hier fehlt ein O-Atom. Die tiefgestellte 4 bedeutet vier O-Atome.", "One O atom is missing here. The subscript 4 means four O atoms."),
        },
        tip: tr("Die kleine Zahl unten zählt die Atome, die kleine Angabe oben ist die Ladung.", "The small number at the bottom counts the atoms, the small sign at the top is the charge."),
        visual: c => <IonModel c={c} center="P" lig="O" init={{ n: 1, h: 0, q: 0 }} sol={{ n: 4, h: 0, q: -3 }} steps={["n", "q"]} showFormula={false} />,
        ok: tr("Das Phosphat-Ion **PO₄³⁻** hat ein P-Atom und vier O-Atome. Es trägt die Ladung 3−.", "The phosphate ion **PO₄³⁻** has one P atom and four O atoms. It carries the charge 3−."),
      }),
      {
        mode: "worked",
        say: tr("Ein mehratomiges Ion setzt sich **nicht** aus einzelnen Ionen zusammen.", "A polyatomic ion is **not** put together from single ions."),
        ask: tr("Warum besteht das Sulfat-Ion nicht aus einem S²⁻ und vier O²⁻?", "Why is the sulfate ion not made of one S²⁻ and four O²⁻?"),
        lines: [
          tr("Ein S²⁻ und vier O²⁻ hätten zusammen zehn negative Ladungen.", "One S²⁻ and four O²⁻ would have ten negative charges in total."),
          tr("Das Sulfat-Ion trägt aber nur die Ladung 2−.", "But the sulfate ion only carries the charge 2−."),
          tr("Die Atome im Sulfat-Ion sind fest miteinander verbunden. Wie das geht, lernst du bei der Elektronenpaarbindung.", "The atoms in the sulfate ion are firmly joined. You will learn how in covalent bonding."),
          tr("Die Ladung gehört also der ganzen Atomgruppe und nicht einzelnen Atomen.", "So the charge belongs to the whole group and not to single atoms."),
        ],
        visual: () => <NotMixture />,
        ok: tr("Das Sulfat-Ion ist **ein** einziges Teilchen mit der Ladung 2−.", "The sulfate ion is **one** single particle with the charge 2−."),
      },
      {
        mode: "faded",
        ask: tr("Wem gehört die Ladung 2− im **Carbonat-Ion** CO₃²⁻?", "Who does the charge 2− belong to in the **carbonate ion** CO₃²⁻?"),
        lines: [
          tr("Das Carbonat-Ion besteht aus einem C-Atom und drei O-Atomen und trägt die Ladung 2−.", "The carbonate ion is made of one C atom and three O atoms and carries the charge 2−."),
          tr("Diese Ladung gehört {?}.", "This charge belongs to {?}."),
        ],
        options: [tr("nur dem C-Atom", "only the C atom"), tr("jedem O-Atom", "each O atom"), tr("der ganzen Atomgruppe", "the whole group"), tr("dem letzten O-Atom", "the last O atom")],
        answer: tr("der ganzen Atomgruppe", "the whole group"),
        why: {
          [tr("nur dem C-Atom", "only the C atom")]: tr("Die Ladung steht hinter der ganzen Formel und nicht direkt hinter dem C. Sie gilt für alle Atome zusammen.", "The charge stands after the whole formula, not directly after the C. It applies to all the atoms together."),
          [tr("jedem O-Atom", "each O atom")]: tr("Dann hätte das Ion sechs negative Ladungen. Die ganze Atomgruppe trägt aber nur zwei.", "Then the ion would have six negative charges. But the whole group only carries two."),
          [tr("dem letzten O-Atom", "the last O atom")]: tr("Die Ladung steht zwar am Ende der Formel, sie gilt aber für alle Atome zusammen.", "The charge does stand at the end of the formula, but it applies to all the atoms together."),
        },
        visual: () => <div className="k4-ion-pic"><IonBlock center="C" lig="O" n={3} q={-2} /></div>,
        ok: tr("Die Ladung gehört der **ganzen Atomgruppe**. Das Carbonat-Ion ist ein einziges Teilchen.", "The charge belongs to the **whole group**. The carbonate ion is one single particle."),
      },
      model({
        mode: "free",
        say: tr("Die meisten mehratomigen Ionen in diesem Kapitel sind Anionen. Das **Ammonium-Ion** NH₄⁺ ist dagegen ein Kation.",
          "Most polyatomic ions in this chapter are anions. The **ammonium ion** NH₄⁺, however, is a cation."),
        ask: tr("Baue das Ammonium-Ion NH₄⁺ im Modell nach.", "Build the ammonium ion NH₄⁺ in the model."),
        answer: "NH₄⁺",
        why: {
          "NH₄⁻": tr("Das Ammonium-Ion ist positiv geladen, also ein Kation. Seine Ladung ist 1+.", "The ammonium ion is positively charged, so it is a cation. Its charge is 1+."),
          "NH₄": tr("Die Atome stimmen schon. Es fehlt noch die Ladung 1+.", "The atoms are already right. The charge 1+ is still missing."),
          "NH₃⁺": tr("Hier fehlt ein H-Atom. Das Ammonium-Ion hat vier H-Atome.", "One H atom is missing here. The ammonium ion has four H atoms."),
          "NH₄²⁺": tr("Das ist eine positive Ladung zu viel. Das Ammonium-Ion trägt nur 1+.", "That is one positive charge too many. The ammonium ion only carries 1+."),
        },
        tip: tr("Die tiefgestellte Zahl zählt die H-Atome. Das Zeichen oben rechts ist die Ladung.", "The subscript counts the H atoms. The sign at the top right is the charge."),
        visual: c => <IonModel c={c} center="N" lig="H" init={{ n: 0, h: 0, q: 0 }} sol={{ n: 4, h: 0, q: 1 }} steps={["n", "q"]} showFormula={false} />,
        ok: tr("Das Ammonium-Ion **NH₄⁺** besteht aus einem N-Atom und vier H-Atomen. Mit der Ladung 1+ ist es ein Kation.", "The ammonium ion **NH₄⁺** is made of one N atom and four H atoms. With the charge 1+ it is a cation."),
      }),
      {
        mode: "free",
        ask: tr("Wie viele **Atome** stecken in einem Carbonat-Ion CO₃²⁻?", "How many **atoms** are there in one carbonate ion CO₃²⁻?"),
        num: {}, answer: 4,
        why: {
          "3": tr("Das C-Atom zählt auch mit. Zu den drei O-Atomen kommt noch ein C-Atom.", "The C atom counts too. Besides the three O atoms there is one C atom."),
          "2": tr("Die hochgestellte 2 gehört zur Ladung. Sie gibt keine Anzahl von Atomen an.", "The raised 2 belongs to the charge. It does not give a number of atoms."),
          "6": tr("Die Ladung zählt nicht als Atom. Zähle nur die C- und O-Atome.", "The charge does not count as atoms. Count only the C and O atoms."),
        },
        tip: tr("Ein Symbol ohne Zahl steht für ein Atom. Eine tiefgestellte Zahl gibt an, wie oft das Atom davor vorkommt.", "A symbol without a number stands for one atom. A subscript tells you how often the atom before it occurs."),
        visual: c => <BigIon c={c} center="C" lig="O" n={3} q={-2} />,
        ok: tr("Ein C-Atom und drei O-Atome ergeben vier Atome. Die 2− ist die Ladung des Ions.", "One C atom and three O atoms make four atoms. The 2− is the charge of the ion."),
      },

      // ── Namen ──
      model({
        mode: "worked", part: tr("Namen: -at, -it, Hydrogen-", "Names: -ate, -ite, hydrogen"),
        say: tr("Die Namen mehratomiger Ionen mit Sauerstoff enden meist auf **-at**. Hat ein Ion ein O-Atom weniger als das -at-Ion desselben Elements, endet sein Name auf **-it**.",
          "The names of polyatomic ions containing oxygen mostly end in **-ate**. If an ion has one O atom fewer than the -ate ion of the same element, its name ends in **-ite**."),
        ask: tr("Wie heißt das Ion SO₃²⁻?", "What is the ion SO₃²⁻ called?"),
        lines: [
          tr("Das Ion SO₄²⁻ kennst du schon: Es heißt **Sulfat**.", "You already know the ion SO₄²⁻: it is called **sulfate**."),
          tr("SO₃²⁻ hat ein O-Atom weniger und heißt deshalb **Sulfit**. Die Ladung bleibt gleich: 2−.", "SO₃²⁻ has one O atom fewer, so it is called **sulfite**. The charge stays the same: 2−."),
          tr("Genauso gehören **Nitrat** NO₃⁻ und **Nitrit** NO₂⁻ zusammen.", "**Nitrate** NO₃⁻ and **nitrite** NO₂⁻ go together in the same way."),
        ],
        visual: c => <IonModel c={c} center="S" lig="O" init={{ n: 3, h: 0, q: 0 }} sol={{ n: 3, h: 0, q: 0 }} steps={["n"]} showName />,
        ok: tr("Das -it-Ion hat ein O-Atom weniger als das -at-Ion, zum Beispiel Sulfit SO₃²⁻ und Sulfat SO₄²⁻.", "The -ite ion has one O atom fewer than the -ate ion, for example sulfite SO₃²⁻ and sulfate SO₄²⁻."),
      }),
      model({
        mode: "faded",
        ask: tr("Mach im Modell aus dem Nitrat-Ion das **Nitrit-Ion**.", "In the model, turn the nitrate ion into the **nitrite ion**."),
        lines: [
          tr("Das Nitrat-Ion hat die Formel NO₃⁻.", "The nitrate ion has the formula NO₃⁻."),
          tr("Das Nitrit-Ion hat ein O-Atom weniger und die Formel {?}.", "The nitrite ion has one O atom fewer and the formula {?}."),
        ],
        answer: "NO₂⁻",
        why: {
          "NO₃⁻": tr("Das ist noch das Nitrat-Ion. Die Endung -it bedeutet ein O-Atom weniger.", "That is still the nitrate ion. The ending -ite means one O atom fewer."),
          "NO₄": tr("Die Endung -it bedeutet ein O-Atom weniger, nicht eines mehr.", "The ending -ite means one O atom fewer, not one more."),
          "NO": tr("Hier fehlen zu viele O-Atome. Das Nitrit-Ion hat nur **ein** O-Atom weniger als das Nitrat-Ion.", "Too many O atoms are missing here. The nitrite ion has only **one** O atom fewer than the nitrate ion."),
        },
        tip: tr("Vergleiche mit Sulfat und Sulfit: Was ändert sich von -at zu -it?", "Compare with sulfate and sulfite: what changes from -ate to -ite?"),
        visual: c => <IonModel c={c} center="N" lig="O" init={{ n: 3, h: 0, q: 0 }} sol={{ n: 2, h: 0, q: 0 }} steps={["n"]} />,
        ok: tr("Das Nitrit-Ion **NO₂⁻** hat ein O-Atom weniger als das Nitrat-Ion. Die Ladung 1− bleibt gleich.", "The nitrite ion **NO₂⁻** has one O atom fewer than the nitrate ion. The charge 1− stays the same."),
      }),
      model({
        mode: "free",
        ask: tr("Wie heißt dieses Ion? Setze den Namen aus Wortstamm und Endung zusammen.", "What is this ion called? Put the name together from a stem and an ending."),
        answer: tr("Sulfit", "Sulfite"),
        why: {
          [tr("Sulfat", "Sulfate")]: tr("Sulfat hat vier O-Atome. Hier sind es nur drei, also eines weniger.", "Sulfate has four O atoms. Here there are only three, so one fewer."),
          [tr("Sulfid", "Sulfide")]: tr("Die Endung -id passt zum Sulfid-Ion S²⁻, das keine O-Atome hat. Dieses Ion enthält aber O-Atome.", "The ending -ide fits the sulfide ion S²⁻, which has no O atoms. But this ion contains O atoms."),
          [tr("Nitrit", "Nitrite")]: tr("Der Wortstamm Nitr steht für Stickstoff. Das Atom in der Mitte ist aber ein S-Atom.", "The stem nitr stands for nitrogen. But the atom in the middle is an S atom."),
          [tr("Nitrat", "Nitrate")]: tr("Nitrat ist NO₃⁻ mit einem N-Atom in der Mitte. Hier steht ein S-Atom in der Mitte.", "Nitrate is NO₃⁻ with an N atom in the middle. Here there is an S atom in the middle."),
          [tr("Nitrid", "Nitride")]: tr("Nitrid ist das Ion N³⁻ aus einem einzigen N-Atom. Hier sitzt ein S-Atom in der Mitte, umgeben von O-Atomen.", "Nitride is the ion N³⁻, made of a single N atom. Here an S atom sits in the middle, surrounded by O atoms."),
          [tr("Phosphit", "Phosphite")]: tr("Der Wortstamm Phosph steht für Phosphor. Das Atom in der Mitte ist aber ein S-Atom.", "The stem phosph stands for phosphorus. But the atom in the middle is an S atom."),
          [tr("Phosphat", "Phosphate")]: tr("Phosphat ist PO₄³⁻ mit einem P-Atom in der Mitte. Hier steht ein S-Atom in der Mitte.", "Phosphate is PO₄³⁻ with a P atom in the middle. Here there is an S atom in the middle."),
          [tr("Phosphid", "Phosphide")]: tr("Der Wortstamm Phosph steht für Phosphor. Das Atom in der Mitte ist aber ein S-Atom.", "The stem phosph stands for phosphorus. But the atom in the middle is an S atom."),
          "–": tr("Der Name besteht aus zwei Teilen. Wähle einen Wortstamm und eine Endung.", "The name has two parts. Choose a stem and an ending."),
        },
        tip: tr("Zähle die O-Atome und vergleiche mit dem Sulfat-Ion SO₄²⁻.", "Count the O atoms and compare with the sulfate ion SO₄²⁻."),
        visual: c => <NameKit c={c} figure={<div className="k4-ion-pic"><IonBlock center="S" lig="O" n={3} q={-2} /></div>}
          slots={[{ id: "s", items: ["Sulf", "Nitr", "Phosph"] }, { id: "e", items: [tr("at", "ate"), tr("it", "ite"), tr("id", "ide")] }]}
          sol={["Sulf", tr("it", "ite")]} />,
        ok: tr("SO₃²⁻ heißt **Sulfit**, denn es hat ein O-Atom weniger als Sulfat.", "SO₃²⁻ is called **sulfite**, because it has one O atom fewer than sulfate."),
      }),
      model({
        mode: "worked",
        say: tr("Ein **Wasserstoff-Ion** H⁺ ist ein H-Atom, das sein Elektron abgegeben hat.", "A **hydrogen ion** H⁺ is an H atom that has lost its electron."),
        ask: tr("Was passiert, wenn ein H⁺ zum Carbonat-Ion dazukommt?", "What happens when an H⁺ joins the carbonate ion?"),
        lines: [
          tr("Kommt ein H⁺ zum Carbonat-Ion CO₃²⁻ dazu, entsteht HCO₃⁻ mit einem H-Atom mehr.", "When an H⁺ joins the carbonate ion CO₃²⁻, HCO₃⁻ forms, with one more H atom."),
          tr("Das H⁺ bringt eine positive Ladung mit. Deshalb ist die Ladung nur noch 1− statt 2−.", "The H⁺ brings one positive charge. So the charge is only 1− instead of 2−."),
          tr("Der Name bekommt die Vorsilbe **Hydrogen-**. So entsteht das **Hydrogencarbonat-Ion**.", "The name gets the prefix **hydrogen-**. This gives the **hydrogen carbonate ion**."),
          tr("Eine Ausnahme ist das **Hydroxid-Ion** OH⁻: Es besteht aus zwei Atomen und endet trotzdem auf -id.", "An exception is the **hydroxide ion** OH⁻: it is made of two atoms and still ends in -ide."),
        ],
        visual: c => <IonModel c={c} center="C" lig="O" init={{ n: 3, h: 1, q: 0 }} sol={{ n: 3, h: 1, q: 0 }} steps={["n", "h"]} showName />,
        labels: [{ at: ".k4-at.H", text: tr("H vom H⁺", "H from H⁺"), side: "left", point: "left" }],
        ok: tr("Die Vorsilbe Hydrogen- bedeutet: Ein H⁺ ist dazugekommen, und das Ion hat eine negative Ladung weniger.", "The prefix hydrogen- means: an H⁺ has joined, and the ion has one negative charge fewer."),
      }),
      model({
        mode: "faded",
        ask: tr("Mach im Modell aus dem Carbonat-Ion das Hydrogencarbonat-Ion.", "In the model, turn the carbonate ion into the hydrogen carbonate ion."),
        lines: [
          tr("Mit dem H⁺ kommen ein H-Atom und eine positive Ladung zum Carbonat-Ion CO₃²⁻ dazu.", "The H⁺ adds one H atom and one positive charge to the carbonate ion CO₃²⁻."),
          tr("So entsteht das Hydrogencarbonat-Ion {?}.", "This gives the hydrogen carbonate ion {?}."),
        ],
        answer: "HCO₃⁻",
        why: {
          "HCO₃²⁻": tr("Das H-Atom ist richtig. Das H⁺ bringt aber auch eine positive Ladung mit, deshalb bleibt die Ladung nicht 2−.", "The H atom is right. But the H⁺ also brings a positive charge, so the charge does not stay 2−."),
          "HCO₃³⁻": tr("Das H⁺ ist positiv geladen. Es macht die Ladung weniger negativ, nicht stärker negativ.", "The H⁺ is positively charged. It makes the charge less negative, not more negative."),
          "HCO₃": tr("Das H⁺ hebt nur eine der beiden negativen Ladungen auf. Eine negative Ladung bleibt übrig.", "The H⁺ cancels only one of the two negative charges. One negative charge is left over."),
          "CO₃²⁻": tr("Das ist noch das Carbonat-Ion. Es fehlt das H-Atom.", "That is still the carbonate ion. The H atom is missing."),
          "H₂CO₃⁻": tr("Die Vorsilbe Hydrogen- bedeutet genau ein H-Atom mehr, nicht zwei.", "The prefix hydrogen- means exactly one more H atom, not two."),
        },
        tip: tr("Das Carbonat-Ion hat zwei negative Ladungen, das H⁺ eine positive. Wie viele negative Ladungen bleiben übrig?", "The carbonate ion has two negative charges, the H⁺ one positive charge. How many negative charges are left?"),
        visual: c => <IonModel c={c} center="C" lig="O" init={{ n: 3, h: 0, q: -2 }} sol={{ n: 3, h: 1, q: -1 }} steps={["h", "q"]} />,
        ok: tr("Das H⁺ gleicht eine der beiden negativen Ladungen aus. Das Hydrogencarbonat-Ion **HCO₃⁻** ist deshalb nur einfach negativ geladen.", "The H⁺ balances one of the two negative charges. So the hydrogen carbonate ion **HCO₃⁻** has only a single negative charge."),
      }),
      {
        mode: "free",
        ask: tr("Wie heißt das Ion **OH⁻**?", "What is the ion **OH⁻** called?"),
        options: [tr("Oxid-Ion", "Oxide ion"), tr("Hydroxid-Ion", "Hydroxide ion"), tr("Ammonium-Ion", "Ammonium ion"), tr("Hydrogencarbonat-Ion", "Hydrogen carbonate ion")],
        answer: tr("Hydroxid-Ion", "Hydroxide ion"),
        why: {
          [tr("Oxid-Ion", "Oxide ion")]: tr("Das Oxid-Ion O²⁻ besteht nur aus einem O-Atom. Zum OH⁻ gehört außerdem ein H-Atom.", "The oxide ion O²⁻ is made of just one O atom. OH⁻ also contains an H atom."),
          [tr("Ammonium-Ion", "Ammonium ion")]: tr("Das Ammonium-Ion ist NH₄⁺. Es ist positiv geladen und enthält ein N-Atom.", "The ammonium ion is NH₄⁺. It is positively charged and contains an N atom."),
          [tr("Hydrogencarbonat-Ion", "Hydrogen carbonate ion")]: tr("Das Hydrogencarbonat-Ion HCO₃⁻ enthält ein C-Atom und drei O-Atome. OH⁻ hat kein C-Atom.", "The hydrogen carbonate ion HCO₃⁻ contains one C atom and three O atoms. OH⁻ has no C atom."),
        },
        visual: () => <div className="k4-ion-pic"><IonBlock center="O" lig="H" n={1} q={-1} /></div>,
        ok: tr("OH⁻ ist das **Hydroxid-Ion**. Sein Name endet auf -id, obwohl es aus zwei Atomen besteht.", "OH⁻ is the **hydroxide ion**. Its name ends in -ide, even though it is made of two atoms."),
      },

      // ── Formeln mit Klammern ──
      model({
        mode: "worked", part: tr("Formeln mit Klammern", "Formulas with brackets"),
        say: tr("Braucht man ein mehratomiges Ion mehrmals, setzt man es in der Formel in **Klammern**. Die Anzahl steht als Index hinter der Klammer.",
          "If a polyatomic ion is needed more than once, it is put in **brackets** in the formula. The number goes after the bracket as a subscript."),
        ask: tr("Wie schreibt man die Formel von **Calciumhydroxid**?", "How do you write the formula of **calcium hydroxide**?"),
        lines: [
          tr("Ein Ca²⁺ hat zwei positive Ladungen. Zwei OH⁻ mit je einer negativen Ladung gleichen sie aus.", "One Ca²⁺ has two positive charges. Two OH⁻ with one negative charge each balance them."),
          tr("Man setzt OH in Klammern und schreibt die 2 dahinter: **Ca(OH)₂**. Die 2 gilt für alles in der Klammer.", "OH goes in brackets with the 2 after it: **Ca(OH)₂**. The 2 applies to everything in the brackets."),
          tr("Ohne Klammer gilt die 2 nur für das H davor. CaOH₂ hätte also ein O-Atom, aber zwei H-Atome.", "Without brackets the 2 only applies to the H before it. So CaOH₂ would have one O atom but two H atoms."),
        ],
        visual: c => <WriteModel c={c} cat="Ca2+" an="OH-" nC={1} nA={2} which="A" init={{ br: true, k: 2 }} sol={{ br: true, k: 2 }} />,
        ok: tr("Die Klammer umschließt das ganze OH⁻, die Anzahl steht dahinter: **Ca(OH)₂**.", "The brackets enclose the whole OH⁻, and the number follows them: **Ca(OH)₂**."),
      }),
      model({
        mode: "faded",
        ask: tr("**Magnesiumnitrat** besteht aus Mg²⁺ und NO₃⁻. Gleiche die Ladungen aus – mit möglichst wenigen Ionen.", "**Magnesium nitrate** is made of Mg²⁺ and NO₃⁻. Balance the charges – with as few ions as possible."),
        lines: [
          tr("Ein Mg²⁺ hat zwei positive Ladungen, ein NO₃⁻ nur eine negative. Man braucht also zwei NO₃⁻.", "One Mg²⁺ has two positive charges, one NO₃⁻ only one negative charge. So you need two NO₃⁻."),
          tr("Die Formel lautet {?}.", "The formula is {?}."),
        ],
        answer: "Mg(NO₃)₂",
        why: wallWhy("Mg2+", "NO3-"),
        tip: tr("Ergänze Ionen auf der Seite mit weniger Ladung, bis sich die Ladungen ausgleichen.", "Add ions on the side with less charge until the charges balance."),
        visual: c => <WallModel c={c} cat="Mg2+" an="NO3-" init={[1, 1]} sol={[1, 2]} />,
        ok: tr("Zwei NO₃⁻ gleichen die zwei positiven Ladungen des Mg²⁺ aus. Die Formel ist **Mg(NO₃)₂**, mit Nitrat in Klammern.", "Two NO₃⁻ balance the two positive charges of the Mg²⁺. The formula is **Mg(NO₃)₂**, with nitrate in brackets."),
      }),
      model({
        mode: "free",
        ask: tr("**Aluminiumsulfat** besteht aus Al³⁺ und SO₄²⁻. Gleiche die Ladungen aus – mit möglichst wenigen Ionen.", "**Aluminium sulfate** is made of Al³⁺ and SO₄²⁻. Balance the charges – with as few ions as possible."),
        answer: "Al₂(SO₄)₃",
        why: wallWhy("Al3+", "SO42-"),
        tip: tr("Ergänze immer auf der Seite mit weniger Ladung ein Ion, bis beide Seiten gleich viel Ladung haben.", "Always add an ion on the side with less charge until both sides have the same amount of charge."),
        visual: c => <WallModel c={c} cat="Al3+" an="SO42-" init={[1, 1]} sol={[2, 3]} />,
        lines: [tr("Das Sulfat-Ion kommt dreimal vor und steht deshalb in Klammern: (SO₄)₃. Ein einzelnes Atom wie Al bekommt keine Klammer: Al₂.", "The sulfate ion occurs three times, so it goes in brackets: (SO₄)₃. A single atom like Al gets no brackets: Al₂.")],
        ok: tr("Zwei Al³⁺ bringen sechs positive Ladungen, drei SO₄²⁻ sechs negative. Die Formel ist **Al₂(SO₄)₃**.", "Two Al³⁺ bring six positive charges, three SO₄²⁻ six negative ones. The formula is **Al₂(SO₄)₃**."),
      }),
      model({
        mode: "worked",
        say: tr("Kommt ein mehratomiges Ion nur **einmal** vor, schreibt man es ohne Klammer.", "If a polyatomic ion occurs only **once**, it is written without brackets."),
        ask: tr("Welche Formel hat **Calciumcarbonat** (Kalk)?", "What is the formula of **calcium carbonate** (limestone)?"),
        lines: [
          tr("Ca²⁺ und CO₃²⁻ haben gleich viele Ladungen. Sie gleichen sich im Verhältnis 1 : 1 aus.", "Ca²⁺ and CO₃²⁻ carry the same number of charges. They balance in a 1 : 1 ratio."),
          tr("Da nur ein Carbonat-Ion vorkommt, braucht man keine Klammer: **CaCO₃**.", "As there is only one carbonate ion, no brackets are needed: **CaCO₃**."),
          tr("Genauso schreibt man NaHCO₃ und KNO₃. Bei zwei Nitrat-Ionen steht dagegen eine Klammer: Mg(NO₃)₂.", "NaHCO₃ and KNO₃ are written the same way. With two nitrate ions, however, there are brackets: Mg(NO₃)₂."),
        ],
        visual: c => <WallModel c={c} cat="Ca2+" an="CO32-" init={[1, 1]} sol={[1, 1]} name />,
        ok: tr("Eine Klammer setzt man nur, wenn ein mehratomiges Ion mehrmals vorkommt.", "Brackets are only used when a polyatomic ion occurs more than once."),
      }),
      model({
        mode: "faded",
        ask: tr("Schreibe die Formel von **Ammoniumsulfat**.", "Write the formula of **ammonium sulfate**."),
        lines: [
          tr("Zwei NH₄⁺ bringen zusammen zwei positive Ladungen, ein SO₄²⁻ bringt zwei negative.", "Two NH₄⁺ together bring two positive charges, one SO₄²⁻ brings two negative ones."),
          tr("Die Formel lautet {?}.", "The formula is {?}."),
        ],
        answer: "(NH₄)₂SO₄",
        why: {
          "NH₄₂SO₄": tr("Ohne Klammer verschmilzt die 2 mit der 4. Das würde 42 H-Atome bedeuten.", "Without brackets the 2 merges with the 4. That would mean 42 H atoms."),
          "NH₄SO₄": tr("Ein NH₄⁺ hat nur eine positive Ladung und gleicht das SO₄²⁻ nicht aus. Es sind zwei Ammonium-Ionen.", "One NH₄⁺ has only one positive charge and does not balance the SO₄²⁻. There are two ammonium ions."),
          "(NH₄)SO₄": tr("Die Klammer allein reicht nicht. Die Anzahl 2 gehört als Index dahinter.", "The brackets alone are not enough. The number 2 goes after them as a subscript."),
          "(NH₄)₃SO₄": tr("Zähle die Kationen im Bild: Es sind zwei.", "Count the cations in the picture: there are two."),
        },
        tip: tr("Vergleiche die Atome in deiner Formel mit den Ionen im Bild.", "Compare the atoms in your formula with the ions in the picture."),
        visual: c => <WriteModel c={c} cat="NH4+" an="SO42-" nC={2} nA={1} which="C" init={{ br: false, k: 1 }} sol={{ br: true, k: 2 }} />,
        ok: tr("In **(NH₄)₂SO₄** gilt die 2 für die ganze Klammer: zwei N-Atome und acht H-Atome, dazu ein S-Atom und vier O-Atome.", "In **(NH₄)₂SO₄** the 2 applies to the whole bracket: two N atoms, eight H atoms, one S atom and four O atoms."),
      }),
      model({
        mode: "free",
        ask: tr("Schreibe die Formel von **Natriumhydroxid**.", "Write the formula of **sodium hydroxide**."),
        answer: "NaOH",
        why: {
          "Na(OH)": tr("Ein einzelnes OH⁻ schreibt man ohne Klammer.", "A single OH⁻ is written without brackets."),
          "Na(OH)₂": tr("Na⁺ und OH⁻ haben je eine Ladung und gleichen sich 1 : 1 aus. Es gibt also nur ein OH⁻.", "Na⁺ and OH⁻ each have one charge and balance 1 : 1. So there is only one OH⁻."),
          "NaOH₂": tr("Das würde ein O-Atom, aber zwei H-Atome bedeuten. Außerdem gibt es nur ein OH⁻.", "That would mean one O atom but two H atoms. And there is only one OH⁻."),
        },
        tip: tr("Wie oft kommt OH⁻ im Bild vor?", "How many times does OH⁻ appear in the picture?"),
        visual: c => <WriteModel c={c} cat="Na+" an="OH-" nC={1} nA={1} which="A" init={{ br: true, k: 2 }} sol={{ br: false, k: 1 }} />,
        ok: tr("Auf ein Na⁺ kommt nur ein OH⁻. Deshalb schreibt man **NaOH** ohne Klammer.", "There is only one OH⁻ for each Na⁺. So **NaOH** is written without brackets."),
      }),

      // ── Name ↔ Formel ──
      model({
        mode: "worked", part: tr("Name ↔ Formel", "Name ↔ formula"),
        say: tr("Der Name verrät die Ionen: Vorn steht das Kation, hinten das Anion. Aus ihren Ladungen ergibt sich die Formel.",
          "The name tells you the ions: the cation comes first, the anion second. The formula follows from their charges."),
        ask: tr("Welche Formel hat **Natriumhydrogencarbonat** (Natron)?", "What is the formula of **sodium hydrogen carbonate** (baking soda)?"),
        lines: [
          tr("Natrium steht für das Natrium-Ion Na⁺, Hydrogencarbonat für das Ion HCO₃⁻.", "Sodium stands for the sodium ion Na⁺, hydrogen carbonate for the ion HCO₃⁻."),
          tr("Na⁺ hat eine positive, HCO₃⁻ eine negative Ladung. Sie gleichen sich im Verhältnis 1 : 1 aus.", "Na⁺ has one positive charge, HCO₃⁻ one negative charge. They balance in a 1 : 1 ratio."),
          tr("Die Formel ist **NaHCO₃**, ohne Klammer, denn das Hydrogencarbonat-Ion kommt nur einmal vor.", "The formula is **NaHCO₃**, without brackets, because the hydrogen carbonate ion occurs only once."),
        ],
        visual: c => <PickModel c={c} cats={["Na+", "Ca2+", "NH4+"]} ans={["CO32-", "HCO3-", "NO3-"]} sol={["Na+", "HCO3-"]} />,
        ok: tr("So geht es immer: Ionen aus dem Namen bestimmen, Ladungen ausgleichen, Formel schreiben.", "It always works like this: find the ions from the name, balance the charges, write the formula."),
      }),
      model({
        mode: "faded",
        ask: tr("Wähle die Ionen für **Ammoniumchlorid**.", "Choose the ions for **ammonium chloride**."),
        lines: [
          tr("Ammonium ist das Ion NH₄⁺, Chlorid das Ion Cl⁻.", "Ammonium is the ion NH₄⁺, chloride the ion Cl⁻."),
          tr("Die Formel lautet {?}.", "The formula is {?}."),
        ],
        answer: "NH₄Cl",
        why: {
          "KCl": tr("K⁺ ist das Kalium-Ion. Das Ammonium-Ion ist NH₄⁺.", "K⁺ is the potassium ion. The ammonium ion is NH₄⁺."),
          "MgCl₂": tr("Mg²⁺ ist das Magnesium-Ion. Das Ammonium-Ion ist NH₄⁺.", "Mg²⁺ is the magnesium ion. The ammonium ion is NH₄⁺."),
          "NH₄NO₃": tr("NO₃⁻ ist das Nitrat-Ion. Das Chlorid-Ion ist Cl⁻.", "NO₃⁻ is the nitrate ion. The chloride ion is Cl⁻."),
          "(NH₄)₂SO₄": tr("SO₄²⁻ ist das Sulfat-Ion. Das Chlorid-Ion ist Cl⁻.", "SO₄²⁻ is the sulfate ion. The chloride ion is Cl⁻."),
          "–": tr("Wähle ein Kation und ein Anion.", "Choose a cation and an anion."),
        },
        tip: tr("Lies den Namen in zwei Teilen: Vorn steht das Kation, hinten das Anion.", "Read the name in two parts: the cation comes first, the anion second."),
        visual: c => <PickModel c={c} cats={["K+", "NH4+", "Mg2+"]} ans={["SO42-", "NO3-", "Cl-"]} sol={["NH4+", "Cl-"]} />,
        ok: tr("Auf ein NH₄⁺ kommt ein Cl⁻. Die Formel ist **NH₄Cl**.", "There is one Cl⁻ for every NH₄⁺. The formula is **NH₄Cl**."),
      }),
      model({
        mode: "free",
        ask: tr("Wähle die Ionen für **Calciumnitrat**.", "Choose the ions for **calcium nitrate**."),
        answer: "Ca(NO₃)₂",
        why: {
          "Ca(NO₂)₂": tr("NO₂⁻ ist das Nitrit-Ion. Das Nitrat-Ion hat ein O-Atom mehr.", "NO₂⁻ is the nitrite ion. The nitrate ion has one O atom more."),
          "CaSO₃": tr("SO₃²⁻ ist das Sulfit-Ion. Gesucht ist aber Nitrat.", "SO₃²⁻ is the sulfite ion. But you are looking for nitrate."),
          "KNO₃": tr("K⁺ ist das Kalium-Ion. Das Calcium-Ion ist Ca²⁺.", "K⁺ is the potassium ion. The calcium ion is Ca²⁺."),
          "NaNO₃": tr("Na⁺ ist das Natrium-Ion. Das Calcium-Ion ist Ca²⁺.", "Na⁺ is the sodium ion. The calcium ion is Ca²⁺."),
          "–": tr("Wähle ein Kation und ein Anion.", "Choose a cation and an anion."),
        },
        tip: tr("Bestimme zuerst das Kation aus dem Namen. Achte beim Anion auf die Endung: -at oder -it?", "First find the cation from the name. For the anion, look at the ending: -ate or -ite?"),
        visual: c => <PickModel c={c} cats={["K+", "Ca2+", "Na+"]} ans={["NO2-", "SO32-", "NO3-"]} sol={["Ca2+", "NO3-"]} />,
        ok: tr("Zu einem Ca²⁺ gehören zwei NO₃⁻. Deshalb steht Nitrat in Klammern: **Ca(NO₃)₂**.", "One Ca²⁺ goes with two NO₃⁻. That is why nitrate is in brackets: **Ca(NO₃)₂**."),
      }),
      model({
        mode: "free",
        ask: tr("Gleiche die Ladungen von **Natriumphosphat** aus – mit möglichst wenigen Ionen.", "Balance the charges of **sodium phosphate** – with as few ions as possible."),
        answer: "Na₃PO₄",
        why: wallWhy("Na+", "PO43-"),
        tip: tr("Wie viele Na⁺ gleichen die Ladung eines Phosphat-Ions aus?", "How many Na⁺ balance the charge of one phosphate ion?"),
        visual: c => <WallModel c={c} cat="Na+" an="PO43-" init={[1, 2]} sol={[3, 1]} />,
        ok: tr("Drei Na⁺ gleichen die drei negativen Ladungen eines PO₄³⁻ aus. Die Formel ist **Na₃PO₄**, ohne Klammer.", "Three Na⁺ balance the three negative charges of one PO₄³⁻. The formula is **Na₃PO₄**, without brackets."),
      }),
      model({
        mode: "free",
        ask: tr("Wie heißt **Mg(OH)₂**? Setze den Namen zusammen.", "What is **Mg(OH)₂** called? Put the name together."),
        answer: tr("Magnesiumhydroxid", "Magnesium hydroxide"),
        why: {
          [tr("Magnesiumoxid", "Magnesium oxide")]: tr("Das Oxid-Ion ist O²⁻ und hat kein H-Atom. In Mg(OH)₂ steckt aber das OH⁻.", "The oxide ion is O²⁻ and has no H atom. But Mg(OH)₂ contains OH⁻."),
          [tr("Magnesiumdihydroxid", "Magnesium dihydroxide")]: tr("Bei Ionenverbindungen steht die Anzahl nicht im Namen. Die Ladungen legen fest, wie viele OH⁻ es sind.", "Names of ionic compounds have no numbers. The charges fix how many OH⁻ there are."),
          [tr("Manganhydroxid", "Manganese hydroxide")]: tr("Mg ist das Symbol für Magnesium. Mangan hat das Symbol Mn.", "Mg is the symbol for magnesium. Manganese has the symbol Mn."),
          "–": tr("Im Namen stehen beide Ionen: vorn das Kation, hinten das Anion.", "The name contains both ions: the cation first, then the anion."),
        },
        tip: tr("Benenne erst das Kation und dann das Ion in der Klammer.", "Name the cation first, then the ion in the brackets."),
        visual: c => <NameKit c={c} figure={wallFig("Mg2+", "OH-", 1, 2)} join={nameJoin()}
          slots={[{ id: "c", items: [tr("Mangan", "Manganese"), "Magnesium"] }, { id: "a", items: [tr("oxid", "oxide"), tr("dihydroxid", "dihydroxide"), tr("hydroxid", "hydroxide")] }]}
          sol={["Magnesium", tr("hydroxid", "hydroxide")]} />,
        ok: tr("Mg(OH)₂ heißt **Magnesiumhydroxid**. Die 2 steht nur in der Formel, nicht im Namen.", "Mg(OH)₂ is called **magnesium hydroxide**. The 2 appears only in the formula, not in the name."),
      }),
      model({
        mode: "free",
        ask: tr("Wie heißt **(NH₄)₂SO₄**? Setze den Namen zusammen.", "What is **(NH₄)₂SO₄** called? Put the name together."),
        answer: tr("Ammoniumsulfat", "Ammonium sulfate"),
        why: {
          [tr("Diammoniumsulfat", "Diammonium sulfate")]: tr("Bei Ionenverbindungen steht die Anzahl nicht im Namen – auch nicht bei zwei Ammonium-Ionen.", "Names of ionic compounds have no numbers – not even with two ammonium ions."),
          [tr("Ammoniumsulfit", "Ammonium sulfite")]: tr("SO₄²⁻ hat vier O-Atome und heißt Sulfat. Sulfit wäre SO₃²⁻ mit einem O-Atom weniger.", "SO₄²⁻ has four O atoms and is called sulfate. Sulfite would be SO₃²⁻, with one O atom fewer."),
          [tr("Ammoniumsulfid", "Ammonium sulfide")]: tr("Sulfid ist das Ion S²⁻ ohne O-Atome. Hier steht aber SO₄²⁻.", "Sulfide is the ion S²⁻ without O atoms. But here it is SO₄²⁻."),
          "–": tr("Im Namen stehen beide Ionen: vorn das Kation, hinten das Anion.", "The name contains both ions: the cation first, then the anion."),
        },
        tip: tr("Benenne beide Ionen. Achte beim Anion auf die Zahl der O-Atome.", "Name both ions. For the anion, look at the number of O atoms."),
        visual: c => <NameKit c={c} figure={wallFig("NH4+", "SO42-", 2, 1)} join={nameJoin()}
          slots={[{ id: "c", items: [tr("Diammonium", "Diammonium"), "Ammonium"] }, { id: "a", items: [tr("sulfid", "sulfide"), tr("sulfat", "sulfate"), tr("sulfit", "sulfite")] }]}
          sol={["Ammonium", tr("sulfat", "sulfate")]} />,
        ok: tr("(NH₄)₂SO₄ heißt **Ammoniumsulfat**: Das Kation ist Ammonium, das Anion Sulfat.", "(NH₄)₂SO₄ is called **ammonium sulfate**: the cation is ammonium, the anion is sulfate."),
      }),
    ],
    outro: [
      tr("Mehratomige Ionen wie SO₄²⁻ und NH₄⁺ als **eine** Atomgruppe mit einer gemeinsamen Ladung erkennen.", "Recognise polyatomic ions such as SO₄²⁻ and NH₄⁺ as **one** group of atoms with one shared charge."),
      tr("Mehratomige Ionen benennen, zum Beispiel Sulfat, Sulfit, Hydrogencarbonat, Hydroxid und Ammonium.", "Name polyatomic ions, for example sulfate, sulfite, hydrogen carbonate, hydroxide and ammonium."),
      tr("Formeln wie Ca(OH)₂ mit Klammern schreiben und wissen, wann keine Klammer nötig ist, wie bei CaCO₃.", "Write formulas such as Ca(OH)₂ with brackets and know when no brackets are needed, as in CaCO₃."),
      tr("Vom Namen zur Formel und von der Formel zum Namen kommen.", "Go from the name to the formula and from the formula to the name."),
    ],
  },
  explain: [
    [
      tr("Ein **mehratomiges Ion** ist eine feste Gruppe aus mehreren Atomen mit **einer** gemeinsamen Ladung, zum Beispiel das Sulfat-Ion SO₄²⁻.", "A **polyatomic ion** is a fixed group of several atoms with **one** shared charge, for example the sulfate ion SO₄²⁻."),
      tr("Die tiefgestellte Zahl gibt die Anzahl der Atome an, die hochgestellte Angabe die Ladung der ganzen Atomgruppe. SO₄²⁻ hat ein S-Atom und vier O-Atome und trägt die Ladung 2−.", "The subscript gives the number of atoms, the superscript the charge of the whole group. SO₄²⁻ has one S atom and four O atoms and carries the charge 2−."),
      tr("Ein mehratomiges Ion setzt sich nicht aus einzelnen Ionen zusammen. Seine Atome sind fest verbunden, und die Ladung gehört der ganzen Atomgruppe.", "A polyatomic ion is not put together from single ions. Its atoms are firmly joined, and the charge belongs to the whole group."),
      tr("Die meisten mehratomigen Ionen in diesem Kapitel sind Anionen. Das Ammonium-Ion ist dagegen ein Kation.", "Most polyatomic ions in this chapter are anions. The ammonium ion, however, is a cation."),
    ],
    [
      tr("Die Namen vieler mehratomiger Ionen mit Sauerstoff enden auf **-at**, zum Beispiel Sulfat SO₄²⁻ und Carbonat CO₃²⁻.", "The names of many polyatomic ions containing oxygen end in **-ate**, for example sulfate SO₄²⁻ and carbonate CO₃²⁻."),
      tr("Die Endung **-it** bedeutet ein O-Atom weniger als beim -at-Ion desselben Elements. Die Ladung bleibt gleich.", "The ending **-ite** means one O atom fewer than in the -ate ion of the same element. The charge stays the same."),
      tr("Die Vorsilbe **Hydrogen-** bedeutet: Ein H⁺ ist dazugekommen, und das Ion hat eine negative Ladung weniger.", "The prefix **hydrogen-** means: an H⁺ has joined, and the ion has one negative charge fewer."),
      tr("Die Endung **-id** steht meist für ein Ion aus einem einzigen Atom, zum Beispiel Chlorid Cl⁻. Es gibt aber auch mehratomige Ionen auf -id – eines lernst du in diesem Teil kennen.", "The ending **-ide** usually stands for an ion made of a single atom, for example chloride Cl⁻. But there are also polyatomic ions ending in -ide – you meet one in this part."),
    ],
    [
      tr("Kommt ein mehratomiges Ion **mehrmals** vor, steht es in **Klammern**, und die Anzahl folgt als Index dahinter: Ca(OH)₂.", "If a polyatomic ion occurs **more than once**, it goes in **brackets**, and the number follows as a subscript: Ca(OH)₂."),
      tr("Ohne Klammer gilt ein Index nur für das Atom direkt davor. CaOH₂ hätte also ein O-Atom, aber zwei H-Atome.", "Without brackets a subscript only applies to the atom directly before it. So CaOH₂ would have one O atom but two H atoms."),
      tr("Kommt es nur **einmal** vor, schreibt man es ohne Klammer: CaCO₃.", "If it occurs only **once**, it is written without brackets: CaCO₃."),
    ],
    [
      tr("Der Name nennt die beiden Ionen: vorn das Kation, hinten das Anion. Natriumhydrogencarbonat besteht aus Na⁺ und HCO₃⁻.", "The name gives the two ions: the cation first, then the anion. Sodium hydrogen carbonate is made of Na⁺ and HCO₃⁻."),
      tr("Danach gleicht man die Ladungen aus und schreibt die Formel: NaHCO₃.", "Then you balance the charges and write the formula: NaHCO₃."),
      tr("Von der Formel zum Namen: Benenne beide Ionen. Die Anzahl steht nicht im Namen, denn die Ladungen legen sie fest.", "From formula to name: name both ions. The number is not part of the name, because the charges fix it."),
    ],
  ],
});
