// Kapitel 3: Ionengitter und Eigenschaften (Level I) – Anziehung und Abstoßung geladener Ionen, das Ionengitter (Ionenbindung,
// Gegen-Ionen, 4 Nachbarn in der Schicht, 6 im Raum, Formel = Verhältnis), Schmelztemperatur, Härte und Sprödigkeit, Leitfähigkeit.
// Modelle in ./k3/: Ionen im Verhältnis der Ionenradien, Anziehung als Linie, Abstoßung rot gestrichelt; jede Eingabe ändert das Bild sofort.

import { tr } from "@lern/i18n";
import type { GuideStep } from "@lern/ui";
import type { Kapitel } from "./types.ts";
import { model } from "./model.tsx";
import { BR, CA, CL, K, MG, NA, O } from "./k3/draw.tsx";
import {
  ChargePair, FormulaModel, IonRow, LatticeFill, NeighborTap, PairStatic,
  allCounter, both, diag, far, gapRes, likeNb, notNeutral, onlyAtt, onlyRep, unreduced,
} from "./k3/forces.tsx";
import { Lattice3D } from "./k3/lattice3d.tsx";
import { Conduct, ThermoLattice, ThermoPair, bothLiquid, bothSolid, naclOnly, circuitOpen, lampOff, lampOn, leftMinus, leftPlus, molten, solid, type Leit } from "./k3/props.tsx";
import { Brittle, CrystalHammer, halfway, holds, repels } from "./k3/brittle.tsx";
import "./k3/k3.css";

const att = () => tr("Anziehung", "attraction");
const rep = () => tr("Abstoßung", "repulsion");
const melt = () => tr("Schmelze", "melt");
const sol = () => tr("Lösung", "solution");

function steps(): GuideStep[] {
  const A = att(), R = rep();
  return [
    // ── Teil 1: Anziehung und Abstoßung ─────────────────────────────────────
    model({
      mode: "worked", part: tr("Anziehen, abstoßen", "Attract, repel"),
      say: tr("Ionen sind geladen. **Entgegengesetzte Ladungen** ziehen sich an – das ist **Anziehung**. **Gleiche Ladungen** stoßen sich ab – das ist **Abstoßung**.",
        "Ions are charged. **Opposite charges** pull on each other – this is **attraction**. **Like charges** push each other away – this is **repulsion**."),
      ask: tr("Was passiert zwischen einem Na⁺ und einem Cl⁻?", "What happens between an Na⁺ and a Cl⁻?"),
      lines: [
        tr("Na⁺ ist positiv geladen, Cl⁻ negativ.", "Na⁺ is positively charged, Cl⁻ negatively."),
        tr("Plus und Minus ziehen sich an: Die beiden Ionen rücken zusammen.", "Plus and minus attract each other: the two ions move together."),
        tr("Läge rechts ein zweites Na⁺, würden sich die beiden abstoßen.", "If a second Na⁺ were on the right, the two would repel each other."),
      ],
      ok: tr("Entgegengesetzte Ladungen ziehen sich an, gleiche Ladungen stoßen sich ab.", "Opposite charges attract each other, like charges repel each other."),
      visual: c => <ChargePair c={c} left={NA} choices={[CL, NA, MG, O]} start={0} sol={0} demo />,
    }),
    model({
      mode: "faded",
      ask: tr("Links liegt ein Cl⁻. Wähle rechts ein Ion, das vom Cl⁻ abgestoßen wird.", "There is a Cl⁻ on the left. Choose an ion on the right that is repelled by the Cl⁻."),
      lines: [tr("Cl⁻ ist negativ geladen.", "Cl⁻ is negatively charged."), tr("Liegt ein anderes negatives Ion daneben, wirkt {?}.", "If another negative ion lies next to it, {?} acts.")],
      answer: R,
      why: { [A]: tr("Dieses Ion ist positiv geladen – Plus und Minus ziehen sich an. Wähle ein negatives Ion.", "This ion is positively charged – plus and minus attract. Choose a negative ion.") },
      tip: tr("Achte auf das Zeichen in der Kugel: + oder −.", "Look at the sign in the ball: + or −."),
      ok: tr("Zwei negative Ionen, zum Beispiel Cl⁻ und O²⁻, stoßen sich ab.", "Two negative ions, for example Cl⁻ and O²⁻, repel each other."),
      visual: c => <ChargePair c={c} left={CL} choices={[NA, MG, CL, O]} start={0} sol={3} />,
    }),
    {
      mode: "free",
      ask: tr("Ein Calcium-Ion Ca²⁺ liegt neben einem Oxid-Ion O²⁻. Was wirkt zwischen ihnen?", "A calcium ion Ca²⁺ lies next to an oxide ion O²⁻. What acts between them?"),
      options: [R, A, tr("nichts – beide haben volle Außenschalen", "nothing – both have full outer shells")],
      answer: A,
      why: {
        [R]: tr("Ca²⁺ ist positiv, O²⁻ negativ geladen. Entgegengesetzte Ladungen stoßen sich nicht ab.", "Ca²⁺ is positively, O²⁻ negatively charged. Opposite charges do not repel."),
        [tr("nichts – beide haben volle Außenschalen", "nothing – both have full outer shells")]: tr("Eine volle Außenschale heißt nicht, dass das Ion ungeladen ist. Ca²⁺ hat 2 Protonen mehr als Elektronen – geladene Teilchen ziehen sich an oder stoßen sich ab.", "A full outer shell does not mean the ion is uncharged. Ca²⁺ has 2 more protons than electrons – charged particles attract or repel."),
      },
      ok: tr("Ca²⁺ ist positiv und O²⁻ negativ geladen. Deshalb ziehen sie sich an.", "Ca²⁺ is positively and O²⁻ negatively charged. That is why they attract each other."),
      visual: () => <PairStatic a={CA} b={O} />,
    },
    model({
      mode: "worked",
      say: tr("In einer Reihe aus Ionen wirken auf ein Ion beide Nachbarn.", "In a row of ions, both neighbours act on an ion."),
      ask: tr("Welche Kräfte wirken auf das Na⁺ an dieser Stelle?", "Which forces act on the Na⁺ in this place?"),
      lines: [
        tr("Der Na⁺-Nachbar hat die gleiche Ladung und stößt ab (rot gestrichelt).", "The Na⁺ neighbour has the same charge and repels (red dashed)."),
        tr("Der Cl⁻-Nachbar ist entgegengesetzt geladen und zieht an (durchgezogene Linie).", "The Cl⁻ neighbour has the opposite charge and attracts (solid line)."),
        tr("An dieser Stelle wirken also Anziehung und Abstoßung.", "So in this place both attraction and repulsion act."),
      ],
      ok: tr("Jeder Nachbar wirkt auf das Ion: Entgegengesetzte Ladung zieht an, gleiche Ladung stößt ab.", "Every neighbour acts on the ion: opposite charge attracts, like charge repels."),
      visual: c => <IonRow c={c} mover={NA} fixed={[NA, NA, CL, CL]} start={1} sol={1} demo />,
    }),
    model({
      mode: "faded",
      ask: tr("Schiebe das Na⁺ an die Stelle, an der es nur angezogen wird.", "Move the Na⁺ to the place where it is only attracted."),
      lines: [tr("Zwischen zwei Cl⁻ ziehen beide Nachbarn am Na⁺.", "Between two Cl⁻, both neighbours pull on the Na⁺."), tr("Dort wirkt {?}.", "There, {?} acts.")],
      answer: onlyAtt(),
      why: {
        [onlyRep()]: tr("Zwischen zwei Na⁺ stoßen beide Nachbarn ab, denn sie haben die gleiche Ladung.", "Between two Na⁺, both neighbours repel, because they have the same charge."),
        [both()]: tr("Ein Nachbar ist ein Na⁺ und stößt ab. Schiebe weiter.", "One neighbour is an Na⁺ and repels. Move on."),
      },
      tip: tr("Ein positives Ion wird nur von negativen Nachbarn angezogen.", "A positive ion is only attracted by negative neighbours."),
      ok: tr("Zwischen zwei Cl⁻ sind beide Nachbarn entgegengesetzt geladen. Das Na⁺ wird nur angezogen.", "Between two Cl⁻ both neighbours have the opposite charge. The Na⁺ is only attracted."),
      visual: c => <IonRow c={c} mover={NA} fixed={[NA, NA, CL, CL]} start={0} sol={2} />,
    }),
    model({
      mode: "free",
      ask: tr("Jetzt bewegst du ein Cl⁻. Schiebe es an die Stelle, an der es nur angezogen wird.", "Now you move a Cl⁻. Move it to the place where it is only attracted."),
      answer: onlyAtt(),
      why: {
        [onlyRep()]: tr("Zwischen zwei Cl⁻ stoßen beide Nachbarn ab, denn sie haben die gleiche Ladung.", "Between two Cl⁻, both neighbours repel, because they have the same charge."),
        [both()]: tr("Ein Nachbar ist ein Cl⁻ und stößt ab. Schiebe weiter.", "One neighbour is a Cl⁻ and repels. Move on."),
      },
      tip: tr("Ein negatives Ion wird von positiven Nachbarn angezogen.", "A negative ion is attracted by positive neighbours."),
      ok: tr("Zwischen zwei Na⁺ wird das Cl⁻ nur angezogen. So liegen die Ionen auch im Kochsalz: immer abwechselnd.", "Between two Na⁺ the Cl⁻ is only attracted. This is how the ions lie in table salt too: always alternating."),
      visual: c => <IonRow c={c} mover={CL} fixed={[CL, CL, NA, NA]} start={0} sol={2} />,
    }),

    // ── Teil 2: Das Ionengitter ─────────────────────────────────────────────
    model({
      mode: "worked", part: tr("Das Ionengitter", "The ionic lattice"),
      say: tr("Ionenverbindungen nennt man auch **Salze**, zum Beispiel Kochsalz NaCl oder Kaliumbromid KBr. Im festen Salz liegen sehr viele Ionen abwechselnd im **Ionengitter**.",
        "Ionic compounds are also called **salts**, for example table salt NaCl or potassium bromide KBr. In a solid salt, a huge number of ions alternate in an **ionic lattice**."),
      ask: tr("Sieh dir eine Schicht aus dem Gitter von Natriumchlorid NaCl an.", "Look at one layer of the lattice of sodium chloride NaCl."),
      lines: [
        tr("Jedes Na⁺ hat links, rechts, oben und unten ein Cl⁻ als Nachbarn – und jedes Cl⁻ ein Na⁺.", "Every Na⁺ has a Cl⁻ as a neighbour on the left, right, above and below – and every Cl⁻ an Na⁺."),
        tr("Die Nachbarn sind immer entgegengesetzt geladen. Man nennt sie **Gegen-Ionen**.", "The neighbours always have the opposite charge. They are called **counter-ions**."),
        tr("Die Anziehung zwischen den Kationen und Anionen im Gitter heißt **Ionenbindung**.", "The attraction between the cations and anions in the lattice is called an **ionic bond**."),
      ],
      ok: tr("Im Ionengitter ist jedes Ion von Gegen-Ionen umgeben. Überall ziehen sich die Ionen an.", "In the ionic lattice every ion is surrounded by counter-ions. The ions attract each other everywhere."),
      visual: c => <LatticeFill c={c} cat={NA} an={CL} cols={5} rows={3} open={[]}
        caption={tr("Natriumchlorid NaCl · Linien: Anziehung", "Sodium chloride NaCl · lines: attraction")} />,
    }),
    model({
      mode: "faded",
      ask: tr("Fülle die Lücken im Gitter von Natriumchlorid NaCl. Tippe so oft auf einen Platz, bis das passende Ion dort sitzt.", "Fill the gaps in the lattice of sodium chloride NaCl. Tap a place until the right ion sits there."),
      lines: [tr("Neben jedem Cl⁻ sitzt ein Na⁺, neben jedem Na⁺ ein Cl⁻.", "Next to every Cl⁻ sits an Na⁺, next to every Na⁺ a Cl⁻."), tr("Die Nachbarn jedes Ions: {?}.", "The neighbours of every ion: {?}.")],
      answer: allCounter(),
      why: {
        [likeNb()]: tr("Hier liegen zwei gleiche Ionen nebeneinander – die rot gestrichelte Linie zeigt die Abstoßung. Tausche dort.", "Here two like ions lie next to each other – the red dashed line shows the repulsion. Swap there."),
        [gapRes()]: tr("Ein Platz ist noch leer. Fülle jede Lücke.", "A place is still empty. Fill every gap."),
      },
      tip: tr("Folge dem Muster: In jeder Reihe wechseln sich Na⁺ und Cl⁻ ab.", "Follow the pattern: Na⁺ and Cl⁻ alternate in every row."),
      ok: tr("Na⁺ und Cl⁻ wechseln sich ab. So hat jedes Ion nur Gegen-Ionen als Nachbarn.", "Na⁺ and Cl⁻ alternate. So every ion has only counter-ions as neighbours."),
      visual: c => <LatticeFill c={c} cat={NA} an={CL} cols={5} rows={4} open={[6, 8, 12]} />,
    }),
    model({
      mode: "free",
      ask: tr("Baue eine Schicht aus dem Gitter von Kaliumbromid KBr. Fülle alle Lücken.", "Build a layer of the lattice of potassium bromide KBr. Fill all the gaps."),
      answer: allCounter(),
      why: {
        [likeNb()]: tr("Hier liegen zwei gleiche Ionen nebeneinander und stoßen sich ab (rot gestrichelt). Tausche dort.", "Here two like ions lie next to each other and repel (red dashed). Swap there."),
        [gapRes()]: tr("Ein Platz ist noch leer. Fülle jede Lücke.", "A place is still empty. Fill every gap."),
      },
      tip: tr("Schau dir die Nachbarn jeder Lücke an: Welches Ion ist ihr Gegen-Ion?", "Look at the neighbours of each gap: which ion is their counter-ion?"),
      ok: tr("Im Kaliumbromid KBr wechseln sich K⁺ und Br⁻ ab – genau wie Na⁺ und Cl⁻ im Natriumchlorid.", "In potassium bromide KBr, K⁺ and Br⁻ alternate – just like Na⁺ and Cl⁻ in sodium chloride."),
      visual: c => <LatticeFill c={c} cat={K} an={BR} cols={5} rows={4} open={[1, 5, 7, 11, 13, 18]} />,
    }),
    model({
      mode: "free",
      ask: tr("Tippe alle direkten Nachbarn des markierten Cl⁻ in der Mitte an.", "Tap all direct neighbours of the marked Cl⁻ in the middle."),
      answer: "4",
      why: {
        [diag()]: tr("Schräg daneben liegen Cl⁻ – gleich geladen und weiter weg. Direkte Nachbarn liegen auf den Linien.", "Diagonally there are Cl⁻ – the same charge and further away. Direct neighbours lie on the lines."),
        [far()]: tr("Dieses Ion liegt weiter weg. Nur die nächsten Ionen sind direkte Nachbarn.", "This ion is further away. Only the nearest ions are direct neighbours."),
        "0": tr("Noch ist nichts markiert. Tippe die Nachbarn an.", "Nothing is marked yet. Tap the neighbours."),
        "1": tr("Es fehlen noch Nachbarn. Schau links, rechts, oben und unten.", "Some neighbours are missing. Look left, right, above and below."),
        "2": tr("Es fehlen noch Nachbarn. Schau links, rechts, oben und unten.", "Some neighbours are missing. Look left, right, above and below."),
        "3": tr("Ein Nachbar fehlt noch. Schau links, rechts, oben und unten.", "One neighbour is still missing. Look left, right, above and below."),
      },
      tip: tr("Direkte Nachbarn liegen ganz nah, auf den Linien, die vom markierten Ion ausgehen.", "Direct neighbours lie very close, on the lines starting at the marked ion."),
      ok: tr("In einer Schicht hat jedes Cl⁻ vier Na⁺ als direkte Nachbarn – alles Gegen-Ionen.", "In a layer, every Cl⁻ has four Na⁺ as direct neighbours – all counter-ions."),
      visual: c => <NeighborTap c={c} cat={NA} an={CL} />,
    }),
    model({
      mode: "worked",
      say: tr("Das Gitter besteht aus vielen Schichten. Davor und dahinter liegen weitere.", "The lattice consists of many layers. More lie in front and behind."),
      ask: tr("Drehe das Bild mit dem Finger. Wie viele Cl⁻ umgeben ein Na⁺ im Raum?", "Turn the picture with your finger. How many Cl⁻ surround an Na⁺ in space?"),
      lines: [
        tr("In seiner eigenen Schicht hat das Na⁺ vier Cl⁻ als Nachbarn.", "In its own layer the Na⁺ has four Cl⁻ as neighbours."),
        tr("Dazu kommt je ein Cl⁻ davor und dahinter.", "Add one Cl⁻ in front and one behind."),
        tr("Jedes Na⁺ ist also von sechs Cl⁻ umgeben – und jedes Cl⁻ von sechs Na⁺.", "So every Na⁺ is surrounded by six Cl⁻ – and every Cl⁻ by six Na⁺."),
      ],
      ok: tr("Jedes Ion zieht alle sechs Nachbarn gleich stark an. Deshalb gibt es im Gitter keine festen Paare.", "Every ion attracts all six neighbours equally strongly. That is why there are no fixed pairs in the lattice."),
      visual: () => <Lattice3D />,
    }),
    model({
      mode: "faded",
      say: tr("Die Verhältnisformel gibt das kleinste Zahlenverhältnis der Ionen im Gitter an.", "The empirical formula gives the smallest number ratio of the ions in the lattice."),
      ask: tr("Im Ausschnitt aus dem Gitter von Magnesiumoxid sind vier Mg²⁺ und vier O²⁻ markiert. Stelle die Verhältnisformel ein.", "In the section of the magnesium oxide lattice, four Mg²⁺ and four O²⁻ are marked. Set the empirical formula."),
      lines: [tr("Vier Mg²⁺ auf vier O²⁻ – gekürzt ist das 1 : 1.", "Four Mg²⁺ to four O²⁻ – reduced, that is 1 : 1."), tr("Verhältnisformel: {?}", "Empirical formula: {?}")],
      answer: "MgO",
      why: {
        [unreduced()]: tr("So viele Ionen sind nur in diesem Ausschnitt. Das Gitter geht weiter – die Formel nennt das kleinste Verhältnis.", "That many ions are only in this section. The lattice goes on – the formula gives the smallest ratio."),
        [notNeutral()]: tr("So gleichen sich die Ladungen nicht aus. Mg²⁺ und O²⁻ haben gleich viele Ladungen, also braucht man gleich viele Ionen.", "Then the charges do not balance. Mg²⁺ and O²⁻ carry the same number of charges, so you need equal numbers of ions."),
      },
      tip: tr("Kürze das Verhältnis 4 : 4 so weit wie möglich.", "Reduce the ratio 4 : 4 as far as possible."),
      ok: tr("Magnesiumoxid hat die Formel MgO. Mg²⁺ und O²⁻ kommen im Verhältnis 1 : 1 vor, weil sich ihre Ladungen genau ausgleichen.", "Magnesium oxide has the formula MgO. Mg²⁺ and O²⁻ occur in the ratio 1 : 1, because their charges balance exactly."),
      visual: c => <FormulaModel c={c} />,
    }),
    {
      mode: "free",
      ask: tr("Woraus besteht ein Kristall aus Natriumchlorid NaCl (Kochsalz)?", "What does a crystal of sodium chloride NaCl (table salt) consist of?"),
      options: [
        tr("aus NaCl-Molekülen", "of NaCl molecules"),
        tr("aus Na⁺-Cl⁻-Paaren", "of Na⁺-Cl⁻ pairs"),
        tr("aus Na⁺ und Cl⁻ im Ionengitter", "of Na⁺ and Cl⁻ in an ionic lattice"),
      ],
      answer: tr("aus Na⁺ und Cl⁻ im Ionengitter", "of Na⁺ and Cl⁻ in an ionic lattice"),
      why: {
        [tr("aus NaCl-Molekülen", "of NaCl molecules")]: tr("Im Salz gibt es keine Moleküle. NaCl nennt nur das Verhältnis 1 : 1.", "There are no molecules in a salt. NaCl only gives the ratio 1 : 1."),
        [tr("aus Na⁺-Cl⁻-Paaren", "of Na⁺-Cl⁻ pairs")]: tr("Jedes Na⁺ zieht sechs Cl⁻ gleich stark an. Kein Cl⁻ gehört zu einem bestimmten Na⁺.", "Every Na⁺ attracts six Cl⁻ equally strongly. No Cl⁻ belongs to one particular Na⁺."),
      },
      ok: tr("Ein Natriumchlorid-Kristall besteht aus sehr vielen Na⁺ und Cl⁻ im Ionengitter, im Verhältnis 1 : 1. Es gibt keine Moleküle und keine Paare.", "A sodium chloride crystal consists of a huge number of Na⁺ and Cl⁻ in an ionic lattice, in the ratio 1 : 1. There are no molecules and no pairs."),
    },

    // ── Teil 3: Hart, spröde, hohe Schmelztemperatur ───────────────────────
    model({
      mode: "worked", part: tr("Hart und spröde", "Hard and brittle"),
      say: tr("Die Ionen im Gitter schwingen ständig ein wenig um ihren Platz. Je höher die Temperatur, desto stärker schwingen sie.",
        "The ions in the lattice constantly vibrate a little around their places. The higher the temperature, the more strongly they vibrate."),
      ask: tr("Sieh dir Natriumchlorid NaCl bei 400 °C an.", "Look at sodium chloride NaCl at 400 °C."),
      lines: [
        tr("Die Ionen schwingen schon stark.", "The ions already vibrate strongly."),
        tr("Die Anziehung hält aber jedes Ion an seinem Platz – das Salz bleibt fest.", "But the attraction holds every ion in its place – the salt stays solid."),
        tr("Erst bei der **Schmelztemperatur** verlassen die Ionen ihre Plätze.", "Only at the **melting point** do the ions leave their places."),
      ],
      ok: tr("Je höher die Temperatur, desto stärker schwingen die Ionen. Bis zur Schmelztemperatur hält das Gitter.", "The higher the temperature, the more the ions vibrate. Up to the melting point, the lattice holds."),
      visual: c => <ThermoLattice c={c} cat={NA} an={CL} tm={801} max={1000} step={1} start={400} sol={400} demo />,
    }),
    model({
      mode: "faded",
      say: tr("Eis schmilzt schon bei 0 °C. Salz wird erst bei sehr hoher Temperatur flüssig. Geschmolzenes Salz nennt man **Schmelze**.", "Ice melts at just 0 °C. Salt only becomes liquid at a very high temperature. Molten salt is called a **melt**."),
      ask: tr("Erhitze Natriumchlorid NaCl, bis das Gitter zerfällt.", "Heat sodium chloride NaCl until the lattice falls apart."),
      lines: [tr("Natriumchlorid schmilzt bei 801 °C.", "Sodium chloride melts at 801 °C."), tr("Die Ionen verlassen ihre Plätze – das Salz ist {?}.", "The ions leave their places – the salt is {?}.")],
      answer: molten(),
      why: { [solid()]: tr("Noch ist es fest: Die Ionen schwingen nur um ihre Plätze. Stelle eine höhere Temperatur ein.", "It is still solid: the ions only vibrate around their places. Set a higher temperature.") },
      tip: tr("Was passiert mit den Ionen bei der Schmelztemperatur?", "What happens to the ions at the melting point?"),
      ok: tr("Ab 801 °C ist Natriumchlorid geschmolzen. Die Ionen verlassen ihre Plätze und gleiten ständig aneinander vorbei. Dabei ziehen sie sich weiterhin an.",
        "From 801 °C sodium chloride is molten. The ions leave their places and keep sliding past each other. They still attract each other."),
      visual: c => <ThermoLattice c={c} cat={NA} an={CL} tm={801} max={1000} step={1} start={20} sol={850} />,
    }),
    model({
      mode: "free",
      say: tr("Magnesiumoxid MgO besteht aus Mg²⁺ und O²⁻. Ihre Ladungen sind doppelt so groß wie bei Na⁺ und Cl⁻.", "Magnesium oxide MgO consists of Mg²⁺ and O²⁻. Their charges are twice as large as for Na⁺ and Cl⁻."),
      ask: tr("Stelle eine Temperatur ein, bei der Natriumchlorid schon flüssig, Magnesiumoxid aber noch fest ist.", "Set a temperature at which sodium chloride is already liquid but magnesium oxide is still solid."),
      answer: naclOnly(),
      why: {
        [bothSolid()]: tr("Auch Natriumchlorid ist noch fest. Erhitze weiter, bis sein Gitter zerfällt.", "Sodium chloride is still solid too. Keep heating until its lattice falls apart."),
        [bothLiquid()]: tr("Jetzt ist auch Magnesiumoxid geschmolzen – das war zu heiß. Stelle eine niedrigere Temperatur ein.", "Now magnesium oxide has melted too – that was too hot. Set a lower temperature."),
      },
      tip: tr("Doppelt geladene Ionen ziehen sich stärker an. Welcher Stoff braucht also mehr Wärme zum Schmelzen?", "Doubly charged ions attract each other more strongly. So which substance needs more heat to melt?"),
      ok: tr("Natriumchlorid schmilzt bei 801 °C, Magnesiumoxid erst bei 2852 °C. Höhere Ladungen bedeuten stärkere Anziehung und eine höhere Schmelztemperatur.", "Sodium chloride melts at 801 °C, magnesium oxide only at 2852 °C. Higher charges mean stronger attraction and a higher melting point."),
      visual: c => <ThermoPair c={c} start={20} sol={1500} />,
    }),
    model({
      mode: "worked",
      say: tr("Salzkristalle sind **hart**, weil die Anziehung die Schichten festhält. Sie sind aber auch **spröde**: Bei einem kräftigen Schlag zerspringen sie.",
        "Salt crystals are **hard**, because the attraction holds the layers firmly. But they are also **brittle**: a hard blow shatters them."),
      ask: tr("Was bewirkt ein Hammerschlag im Kristall?", "What does a hammer blow do inside the crystal?"),
      lines: [
        tr("Der Schlag verschiebt die oberen Schichten. Halb verschoben halten die Gegen-Ionen sie nur noch schwächer.", "The blow shifts the upper layers. Shifted halfway, the counter-ions hold them only weakly."),
        tr("Nach einem ganzen Platz liegen gleiche Ladungen einander gegenüber und stoßen sich ab.", "After a whole place, like charges lie opposite each other and repel."),
        tr("Der Kristall bricht entlang einer glatten Fläche.", "The crystal breaks along a smooth surface."),
      ],
      ok: tr("Salz ist hart wegen der starken Anziehung und spröde wegen der Abstoßung nach dem Verschieben.", "Salt is hard because of the strong attraction and brittle because of the repulsion after shifting."),
      visual: c => <Brittle c={c} cat={NA} an={CL} start={4} sol={4} demo />,
    }),
    model({
      mode: "faded",
      ask: tr("Verschiebe die oberen Schichten von Kaliumbromid KBr, bis gleiche Ladungen genau übereinanderliegen.", "Shift the upper layers of potassium bromide KBr until like charges lie exactly above each other."),
      lines: [tr("Liegt K⁺ über K⁺ und Br⁻ über Br⁻, wirkt {?} – der Kristall bricht.", "If K⁺ lies above K⁺ and Br⁻ above Br⁻, {?} acts – the crystal breaks.")],
      answer: repels(),
      why: {
        [holds()]: tr("Noch liegen Gegen-Ionen einander gegenüber und ziehen sich an. Verschiebe die oberen Schichten.", "Counter-ions still lie opposite each other and attract. Shift the upper layers."),
        [halfway()]: tr("Erst teilweise verschoben: Die Gegen-Ionen halten die Schichten noch. Schiebe weiter, bis gleiche Ladungen genau übereinanderliegen.",
          "Only partly shifted: the counter-ions still hold the layers. Keep going until like charges lie exactly above each other."),
      },
      tip: tr("Beobachte in der Lupe die Ionen an der Trennlinie: Wann liegt gleiche Ladung über gleicher Ladung?", "In the magnifier, watch the ions at the boundary: when does like charge lie above like charge?"),
      ok: tr("Nach einem ganzen Platz liegt K⁺ über K⁺ und Br⁻ über Br⁻. Sie stoßen sich ab, und der Kristall zerbricht.", "After a whole place, K⁺ lies above K⁺ and Br⁻ above Br⁻. They repel each other, and the crystal breaks."),
      visual: c => <Brittle c={c} cat={K} an={BR} start={0} sol={4} />,
    }),
    {
      mode: "free",
      ask: tr("Du schlägst mit einem Hammer kräftig auf einen Salzkristall. Was passiert?", "You hit a salt crystal hard with a hammer. What happens?"),
      options: [
        tr("Er wird flüssig.", "It becomes liquid."),
        tr("Er zerspringt in Stücke.", "It shatters into pieces."),
        tr("Er verbiegt sich, ohne zu brechen.", "It bends without breaking."),
      ],
      answer: tr("Er zerspringt in Stücke.", "It shatters into pieces."),
      why: {
        [tr("Er wird flüssig.", "It becomes liquid.")]: tr("Zum Schmelzen braucht man 801 °C. Ein Schlag verschiebt nur Schichten – so heiß wird das Salz dabei nicht.", "Melting needs 801 °C. A blow only shifts layers – the salt does not get that hot."),
        [tr("Er verbiegt sich, ohne zu brechen.", "It bends without breaking.")]: tr("Beim Verbiegen verschieben sich Schichten. Dann liegen gleiche Ladungen gegenüber und stoßen sich ab – das Salz bricht.", "Bending shifts layers. Then like charges lie opposite each other and repel – the salt breaks."),
      },
      ok: tr("Salz ist spröde: Der Schlag verschiebt Schichten, gleiche Ladungen stoßen sich ab, und der Kristall zerspringt.", "Salt is brittle: the blow shifts layers, like charges repel, and the crystal shatters."),
      visual: () => <CrystalHammer />,
    },

    // ── Teil 4: Wann leiten Salze Strom? ────────────────────────────────────
    model({
      mode: "worked", part: tr("Strom leiten", "Conducting"),
      say: tr("**Elektrischer Strom** ist die gerichtete Bewegung geladener Teilchen. Ein Stoff **leitet** Strom, wenn sich darin geladene Teilchen frei bewegen können.",
        "An **electric current** is a directed movement of charged particles. A substance **conducts** electricity if charged particles can move freely in it."),
      ask: tr("Sieh dir festes Natriumchlorid NaCl zwischen zwei Metallstäben an.", "Look at solid sodium chloride NaCl between two metal rods."),
      lines: [
        tr("Die Metallstäbe heißen **Elektroden**. Einer ist der **Minuspol** (−), der andere der **Pluspol** (+).", "The metal rods are called **electrodes**. One is the **negative pole** (−), the other the **positive pole** (+)."),
        tr("Die Lupe zeigt einen vergrößerten Ausschnitt: Die Ionen schwingen nur um ihre Plätze im Gitter.", "The magnifier shows an enlarged close-up: the ions only vibrate around their places in the lattice."),
        tr("Sie können nicht zu den Elektroden wandern. Es fließt kein Strom, die Lampe bleibt aus.", "They cannot move to the electrodes. No current flows, the lamp stays off."),
      ],
      ok: tr("Festes Salz leitet keinen Strom: Die Ionen sind zwar geladen, aber nicht beweglich.", "Solid salt does not conduct: the ions are charged, but they cannot move about."),
      visual: c => <Conduct c={c} start={L("fest")} sol={L("fest")} result={lamp} demo />,
    }),
    model({
      mode: "faded",
      say: tr("Beim Schmelzen verlassen die Ionen das Gitter. In Wasser H₂O lösen Wassermoleküle die Ionen aus dem Gitter heraus.",
        "On melting, the ions leave the lattice. In water H₂O, water molecules pull the ions out of the lattice."),
      ask: tr("Bringe die Lampe zum Leuchten.", "Make the lamp light up."),
      lines: [
        tr("In der Schmelze und in der Lösung sind die Ionen beweglich.", "In the melt and in the solution the ions can move."),
        tr("Sie wandern gerichtet, es fließt Strom: {?}", "They move in one direction, a current flows: {?}"),
      ],
      answer: lampOn(),
      why: { [lampOff()]: tr("Im festen Salz sitzen die Ionen fest und können nicht wandern. Es fließt kein Strom.", "In the solid salt the ions are fixed and cannot move along. No current flows.") },
      tip: tr("Für Strom braucht man geladene Teilchen, die sich bewegen können.", "A current needs charged particles that can move."),
      ok: tr("Na⁺ wandert zum Minuspol, Cl⁻ zum Pluspol – die Lampe leuchtet. Was an den Elektroden passiert, lernst du später.",
        "Na⁺ moves to the negative pole, Cl⁻ to the positive pole – the lamp lights up. What happens at the electrodes, you will learn later."),
      visual: c => <Conduct c={c} start={L("fest")} sol={L("schmelze")} result={lamp} />,
    }),
    model({
      mode: "free",
      ask: tr("Wie leitet Natriumchlorid Strom, ohne dass du es auf 801 °C erhitzt? Stelle es ein und schließe den Schalter.", "How can sodium chloride conduct without being heated to 801 °C? Set it up and close the switch."),
      answer: sol(),
      why: {
        [circuitOpen()]: tr("Der Schalter ist offen, der Stromkreis ist unterbrochen. Schließe ihn.", "The switch is open, the circuit is broken. Close it."),
        [lampOff()]: tr("Festes Salz leitet nicht, weil die Ionen festsitzen.", "Solid salt does not conduct, because the ions are fixed."),
        [melt()]: tr("Die Schmelze leitet – dafür muss das Salz aber 801 °C heiß sein. Es geht auch ohne Erhitzen.", "The melt conducts – but the salt has to be 801 °C hot for that. It also works without heating."),
      },
      tip: tr("Denk an den zweiten Weg, die Ionen aus dem Gitter zu lösen.", "Think of the second way to free the ions from the lattice."),
      ok: tr("In Wasser H₂O gelöst sind die Ionen beweglich. Die Lösung leitet, und die Lampe leuchtet.", "Dissolved in water H₂O, the ions can move. The solution conducts, and the lamp lights up."),
      visual: c => <Conduct c={c} start={{ z: "fest", on: false, minusLeft: true }} sol={L("loesung")} switchable
        result={s => (!s.on ? circuitOpen() : s.z === "fest" ? lampOff() : s.z === "schmelze" ? melt() : sol())} />,
    }),
    model({
      mode: "free",
      ask: tr("In der Schmelze sollen die Cl⁻-Ionen zur linken Elektrode wandern. Stelle die Pole passend ein.", "In the melt, the Cl⁻ ions should move to the left electrode. Set the poles to match."),
      answer: leftPlus(),
      why: { [leftMinus()]: tr("Links ist der Minuspol. Cl⁻ ist negativ geladen und wandert zum Pluspol – tausche die Pole.", "The negative pole is on the left. Cl⁻ is negatively charged and moves to the positive pole – swap the poles.") },
      tip: tr("Ein Anion wird vom entgegengesetzt geladenen Pol angezogen.", "An anion is attracted by the oppositely charged pole."),
      ok: tr("Cl⁻ wandert zum Pluspol. Liegt der Pluspol links, wandern die Cl⁻ nach links und die Na⁺ nach rechts.", "Cl⁻ moves to the positive pole. With the positive pole on the left, Cl⁻ moves left and Na⁺ moves right."),
      visual: c => <Conduct c={c} start={L("schmelze")} sol={{ ...L("schmelze"), minusLeft: false }} states={["schmelze"]} poles
        result={s => (s.minusLeft ? leftMinus() : leftPlus())} />,
    }),
    {
      mode: "free",
      ask: tr("Festes Natriumchlorid besteht aus Ionen. Warum leitet es trotzdem keinen Strom?", "Solid sodium chloride consists of ions. Why does it still not conduct?"),
      options: [
        tr("Im festen Salz gibt es noch keine Ionen.", "There are no ions yet in the solid salt."),
        tr("Erst beim Schmelzen werden sie geladen.", "They only become charged when melting."),
        tr("Die Ionen sitzen im Gitter fest.", "The ions are fixed in the lattice."),
      ],
      answer: tr("Die Ionen sitzen im Gitter fest.", "The ions are fixed in the lattice."),
      why: {
        [tr("Im festen Salz gibt es noch keine Ionen.", "There are no ions yet in the solid salt.")]: tr("Die Ionen sind immer da, auch im Kristall. Dort können sie sich nur nicht fortbewegen.", "The ions are always there, also in the crystal. They just cannot move along there."),
        [tr("Erst beim Schmelzen werden sie geladen.", "They only become charged when melting.")]: tr("Na⁺ und Cl⁻ sind schon im Kristall geladen. Beim Schmelzen werden sie nur beweglich.", "Na⁺ and Cl⁻ are already charged in the crystal. Melting only makes them mobile."),
      },
      ok: tr("Für Strom braucht man bewegliche geladene Teilchen. Im festen Salz sind die Ionen geladen, sitzen aber fest im Gitter.", "A current needs mobile charged particles. In the solid salt the ions are charged, but fixed in the lattice."),
    },
    {
      mode: "free",
      ask: tr("Kaliumbromid KBr zwischen den Elektroden: Bei welcher Probe leuchtet die Lampe?", "Potassium bromide KBr between the electrodes: with which sample does the lamp light up?"),
      options: [
        tr("KBr gelöst in Wasser", "KBr dissolved in water"),
        tr("KBr fest", "solid KBr"),
        tr("reines Wasser H₂O", "pure water H₂O"),
      ],
      answer: tr("KBr gelöst in Wasser", "KBr dissolved in water"),
      why: {
        [tr("KBr fest", "solid KBr")]: tr("Im festen KBr sitzen K⁺ und Br⁻ im Gitter fest. Es fließt kein Strom.", "In solid KBr, K⁺ and Br⁻ are fixed in the lattice. No current flows."),
        [tr("reines Wasser H₂O", "pure water H₂O")]: tr("Reines Wasser enthält fast keine Ionen. Es gibt kaum geladene Teilchen, die wandern könnten.", "Pure water contains almost no ions. There are hardly any charged particles that could move."),
      },
      ok: tr("Gelöst sind K⁺ und Br⁻ beweglich: K⁺ wandert zum Minuspol, Br⁻ zum Pluspol. Die Lampe leuchtet.", "Dissolved, K⁺ and Br⁻ can move: K⁺ moves to the negative pole, Br⁻ to the positive pole. The lamp lights up."),
    },
  ];
}

const L = (z: Leit["z"]): Leit => ({ z, on: true, minusLeft: true });
const lamp = (s: Leit) => (s.on && s.z !== "fest" ? lampOn() : lampOff());

export const kapitel3 = (): Kapitel => ({
  id: "gitter", nr: 3, stufe: "us",
  title: tr("Ionengitter und Eigenschaften", "Ionic lattice and properties"),
  desc: tr("Was die Ionen zusammenhält und warum Salze hart, spröde und schwer schmelzbar sind.", "What holds the ions together and why salts are hard, brittle and hard to melt."),
  def: {
    title: tr("Ionengitter und Eigenschaften", "Ionic lattice and properties"),
    known: [
      tr("Ion", "ion"), tr("Kation", "cation"), tr("Anion", "anion"), tr("Ladung", "charge"), tr("Ionenverbindung", "ionic compound"),
      tr("Verhältnisformel", "empirical formula"), tr("Molekül", "molecule"), tr("Teilchen", "particle"), tr("Gitter", "lattice"),
      tr("Lösung", "solution"), tr("Außenschale", "outer shell"), tr("Temperatur", "temperature"), tr("Wasser", "water"),
    ],
    steps: steps(),
    outro: [
      tr("Vorhersagen, ob sich zwei Ionen anziehen oder abstoßen.", "Predict whether two ions attract or repel each other."),
      tr("Ein Ionengitter bauen und erklären: Ionenbindung, Gegen-Ionen, keine Moleküle, die Formel als Verhältnis.", "Build and explain an ionic lattice: ionic bond, counter-ions, no molecules, the formula as a ratio."),
      tr("Die hohe Schmelztemperatur, die Härte und die Sprödigkeit von Salzen mit dem Gitter begründen.", "Explain the high melting point, the hardness and the brittleness of salts with the lattice."),
      tr("Erklären, wann Salze Strom leiten: als Schmelze und als Lösung ja, fest nicht.", "Explain when salts conduct: as a melt and as a solution yes, as a solid no."),
    ],
  },
  explain: [
    [
      tr("**Anziehung**: Entgegengesetzte Ladungen ziehen sich an, zum Beispiel Na⁺ und Cl⁻.", "**Attraction**: opposite charges attract each other, for example Na⁺ and Cl⁻."),
      tr("**Abstoßung**: Gleiche Ladungen stoßen sich ab, zum Beispiel Cl⁻ und Cl⁻.", "**Repulsion**: like charges repel each other, for example Cl⁻ and Cl⁻."),
      tr("Auf ein Ion wirkt jeder Nachbar: Ein K⁺ zwischen K⁺ und Br⁻ wird zugleich abgestoßen und angezogen.", "Every neighbour acts on an ion: a K⁺ between K⁺ and Br⁻ is repelled and attracted at the same time."),
    ],
    [
      tr("**Ionengitter**: Kationen und Anionen wechseln sich ab, jedes Ion ist nur von **Gegen-Ionen** umgeben.", "**Ionic lattice**: cations and anions alternate, every ion is surrounded only by **counter-ions**."),
      tr("**Ionenbindung**: die Anziehung zwischen Kationen und Anionen im Ionengitter.", "**Ionic bond**: the attraction between cations and anions in the ionic lattice."),
      tr("Bei Natriumchlorid hat jedes Ion im Raum sechs Gegen-Ionen als Nachbarn. Es gibt keine Paare und keine Moleküle.", "In sodium chloride every ion has six counter-ions as neighbours in space. There are no pairs and no molecules."),
      tr("Die **Verhältnisformel** nennt das kleinste Verhältnis. Calciumchlorid CaCl₂ enthält doppelt so viele Cl⁻ wie Ca²⁺.", "The **empirical formula** gives the smallest ratio. Calcium chloride CaCl₂ contains twice as many Cl⁻ as Ca²⁺."),
    ],
    [
      tr("Die Ionen schwingen um ihre Plätze – je heißer, desto stärker.", "The ions vibrate around their places – the hotter, the more strongly."),
      tr("Bei der **Schmelztemperatur** verlassen sie ihre Plätze. Kaliumbromid schmilzt bei 734 °C, Eis schon bei 0 °C.", "At the **melting point** they leave their places. Potassium bromide melts at 734 °C, ice at just 0 °C."),
      tr("In der **Schmelze** gleiten die Ionen ständig aneinander vorbei und ziehen sich weiter an. Kühlt sie ab, ordnen sie sich wieder zum Gitter.",
        "In the **melt** the ions keep sliding past each other and still attract each other. When it cools, they arrange themselves into a lattice again."),
      tr("**Hart**: Die starke Anziehung hält die Schichten fest. **Spröde**: Verschobene Schichten stoßen sich ab, und der Kristall bricht.", "**Hard**: the strong attraction holds the layers firmly. **Brittle**: shifted layers repel each other, and the crystal breaks."),
    ],
    [
      tr("**Elektrischer Strom** ist die gerichtete Bewegung geladener Teilchen.", "**Electric current** is the directed movement of charged particles."),
      tr("Im festen Salz sitzen die Ionen fest: kein Strom. In der **Schmelze** oder in der Lösung sind sie beweglich: Strom fließt.", "In the solid salt the ions are fixed: no current. In the **melt** or in a solution they can move: current flows."),
      tr("In Wasser lösen Wassermoleküle die Ionen aus dem Gitter. Warum das so ist, lernst du bei der Elektronenpaarbindung.", "In water, water molecules pull the ions out of the lattice. Why this happens, you will learn with covalent bonds."),
      tr("Kationen wandern zum **Minuspol**, Anionen zum **Pluspol**. Die Ionen bleiben dabei gemischt.", "Cations move to the **negative pole**, anions to the **positive pole**. The ions stay mixed."),
    ],
  ],
});
