// Kapitel 3: Ionengitter und Eigenschaften (Level I) – Anziehung und Abstoßung geladener Ionen, das Ionengitter (Ionenbindung,
// Gegen-Ionen, 4 Nachbarn in der Schicht, 6 im Raum, Formel = Verhältnis), Schmelztemperatur, Härte und Sprödigkeit, Leitfähigkeit.
// Modelle in ./k3/: Ionen im Verhältnis der Ionenradien, Anziehung als Linie, Abstoßung rot gestrichelt; jede Eingabe ändert das Bild sofort.

import { tr } from "@lern/i18n";
import type { GuideStep } from "@lern/ui";
import type { Kapitel } from "./types.ts";
import { model } from "./model.tsx";
import { BR, CA, CL, K, MG, NA, O } from "./k3/draw.tsx";
import {
  ChargePair, FormulaModel, IonRow, Lattice3D, LatticeFill, NeighborTap, PairStatic,
  allCounter, both, diag, far, gapRes, likeNb, notNeutral, onlyAtt, onlyRep, unreduced,
} from "./k3/forces.tsx";
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
      say: tr("Ionen sind geladen. **Entgegengesetzte Ladungen** ziehen sich an: **Anziehung**. **Gleiche Ladungen** stoßen sich ab: **Abstoßung**.",
        "Ions are charged. **Opposite charges** pull on each other: **attraction**. **Like charges** push each other away: **repulsion**."),
      ask: tr("Sieh dir an, was ein Na⁺ und ein Cl⁻ tun.", "See what an Na⁺ and a Cl⁻ do."),
      lines: [
        tr("Na⁺ ist positiv (+), Cl⁻ ist negativ (−).", "Na⁺ is positive (+), Cl⁻ is negative (−)."),
        tr("Plus und Minus: Anziehung – die Ionen rücken zusammen.", "Plus and minus: attraction – the ions move together."),
        tr("Läge rechts ein Na⁺: gleiche Ladung, also Abstoßung.", "If an Na⁺ were on the right: like charge, so repulsion."),
      ],
      ok: tr("Entgegengesetzte Ladungen ziehen sich an, gleiche Ladungen stoßen sich ab.", "Opposite charges attract each other, like charges repel each other."),
      visual: c => <ChargePair c={c} left={NA} choices={[CL, NA, MG, O]} start={0} sol={0} demo />,
    }),
    model({
      mode: "faded",
      ask: tr("Links liegt ein Cl⁻. Wähle rechts ein Ion, das vom Cl⁻ abgestoßen wird. Dann prüfe.", "There is a Cl⁻ on the left. Choose an ion on the right that is repelled by the Cl⁻. Then check."),
      lines: [tr("Cl⁻ ist negativ.", "Cl⁻ is negative."), tr("Ein anderes negatives Ion daneben → {?}", "Another negative ion next to it → {?}")],
      answer: R,
      why: { [A]: tr("Dieses Ion ist positiv – Plus und Minus ziehen sich an. Suche ein negatives Ion.", "This ion is positive – plus and minus attract. Look for a negative ion.") },
      tip: tr("Achte auf das Ladungszeichen in der Kugel: + oder −.", "Look at the charge sign in the ball: + or −."),
      ok: tr("Cl⁻ und O²⁻ (oder Cl⁻ und Cl⁻) sind beide negativ: gleiche Ladung → Abstoßung.", "Cl⁻ and O²⁻ (or Cl⁻ and Cl⁻) are both negative: like charge → repulsion."),
      visual: c => <ChargePair c={c} left={CL} choices={[NA, MG, CL, O]} start={0} sol={3} />,
    }),
    {
      mode: "free",
      ask: tr("Ein Calcium-Ion Ca²⁺ und ein Oxid-Ion O²⁻ liegen nebeneinander. Was wirkt zwischen ihnen?", "A calcium ion Ca²⁺ and an oxide ion O²⁻ lie side by side. What acts between them?"),
      options: [R, A, tr("nichts – beide haben volle Außenschalen", "nothing – both have full outer shells")],
      answer: A,
      why: {
        [R]: tr("Ca²⁺ ist positiv, O²⁻ negativ. Entgegengesetzte Ladungen stoßen sich nicht ab.", "Ca²⁺ is positive, O²⁻ negative. Opposite charges do not repel."),
        [tr("nichts – beide haben volle Außenschalen", "nothing – both have full outer shells")]: tr("Volle Außenschale heißt nicht ungeladen: Ca²⁺ hat 2 Protonen mehr als Elektronen. Geladene Teilchen ziehen sich an oder stoßen sich ab.", "A full outer shell does not mean uncharged: Ca²⁺ has 2 more protons than electrons. Charged particles attract or repel."),
      },
      ok: tr("Ca²⁺ (+) und O²⁻ (−): entgegengesetzte Ladungen → Anziehung.", "Ca²⁺ (+) and O²⁻ (−): opposite charges → attraction."),
      visual: () => <PairStatic a={CA} b={O} />,
    },
    model({
      mode: "worked",
      say: tr("In einer Reihe aus Ionen spürt ein Ion beide Nachbarn.", "In a row of ions, an ion feels both neighbours."),
      ask: tr("Sieh dir an, welche Kräfte das Na⁺ auf diesem Platz spürt.", "See which forces the Na⁺ feels in this place."),
      lines: [
        tr("Der Na⁺-Nachbar: gleiche Ladung → Abstoßung (rot gestrichelt).", "The Na⁺ neighbour: like charge → repulsion (red dashed)."),
        tr("Der Cl⁻-Nachbar: entgegengesetzte Ladung → Anziehung (Linie).", "The Cl⁻ neighbour: opposite charge → attraction (line)."),
        tr("Auf diesem Platz wirkt beides.", "In this place, both act."),
      ],
      ok: tr("Ein Ion spürt jeden Nachbarn: entgegengesetzte Ladung zieht an, gleiche Ladung stößt ab.", "An ion feels every neighbour: opposite charge attracts, like charge repels."),
      visual: c => <IonRow c={c} mover={NA} fixed={[NA, NA, CL, CL]} start={1} sol={1} demo />,
    }),
    model({
      mode: "faded",
      ask: tr("Schiebe das Na⁺ auf den Platz, an dem es nur angezogen wird. Dann prüfe.", "Move the Na⁺ to the place where it is only attracted. Then check."),
      lines: [tr("Zwischen zwei Cl⁻ ziehen beide Nachbarn.", "Between two Cl⁻, both neighbours pull."), tr("Dort wirkt {?}.", "There, {?} acts.")],
      answer: onlyAtt(),
      why: {
        [onlyRep()]: tr("Zwischen zwei Na⁺ stoßen beide Nachbarn ab – gleiche Ladung.", "Between two Na⁺, both neighbours repel – like charge."),
        [both()]: tr("Ein Nachbar ist ein Na⁺ und stößt ab. Schiebe weiter.", "One neighbour is an Na⁺ and repels. Move on."),
      },
      tip: tr("Ein positives Ion wird nur von negativen Nachbarn angezogen.", "A positive ion is only attracted by negative neighbours."),
      ok: tr("Na⁺ zwischen zwei Cl⁻: beide entgegengesetzt geladen → nur Anziehung.", "Na⁺ between two Cl⁻: both oppositely charged → only attraction."),
      visual: c => <IonRow c={c} mover={NA} fixed={[NA, NA, CL, CL]} start={0} sol={2} />,
    }),
    model({
      mode: "free",
      ask: tr("Jetzt bewegst du ein Cl⁻. Schiebe es auf den Platz, an dem es nur angezogen wird.", "Now you move a Cl⁻. Move it to the place where it is only attracted."),
      answer: onlyAtt(),
      why: {
        [onlyRep()]: tr("Zwischen zwei Cl⁻ stoßen beide Nachbarn ab – gleiche Ladung.", "Between two Cl⁻, both neighbours repel – like charge."),
        [both()]: tr("Ein Nachbar ist ein Cl⁻ und stößt ab. Schiebe weiter.", "One neighbour is a Cl⁻ and repels. Move on."),
      },
      tip: tr("Ein negatives Ion wird von positiven Nachbarn angezogen.", "A negative ion is attracted by positive neighbours."),
      ok: tr("Cl⁻ zwischen zwei Na⁺: nur Anziehung. So liegen die Ionen auch im Kochsalz – immer abwechselnd.", "Cl⁻ between two Na⁺: only attraction. This is how ions lie in table salt too – always alternating."),
      visual: c => <IonRow c={c} mover={CL} fixed={[CL, CL, NA, NA]} start={0} sol={2} />,
    }),

    // ── Teil 2: Das Ionengitter ─────────────────────────────────────────────
    model({
      mode: "worked", part: tr("Das Ionengitter", "The ionic lattice"),
      say: tr("Ionenverbindungen heißen auch **Salze**, z. B. Kochsalz NaCl oder Kaliumbromid KBr. Im festen Salz liegen sehr viele Ionen abwechselnd im **Ionengitter**.",
        "Ionic compounds are also called **salts**, e.g. table salt NaCl or potassium bromide KBr. In a solid salt, a huge number of ions alternate in an **ionic lattice**."),
      ask: tr("Sieh dir eine Schicht aus dem Gitter von Natriumchlorid NaCl an.", "Look at one layer of the lattice of sodium chloride NaCl."),
      lines: [
        tr("Jedes Na⁺ hat links, rechts, oben und unten ein Cl⁻ – und jedes Cl⁻ dort ein Na⁺.", "Every Na⁺ has a Cl⁻ on the left, right, above and below – and every Cl⁻ an Na⁺."),
        tr("Die Nachbarn sind immer **Gegen-Ionen**: Ionen mit entgegengesetzter Ladung.", "The neighbours are always **counter-ions**: ions with the opposite charge."),
        tr("Die Anziehung zwischen Kationen und Anionen im Gitter heißt **Ionenbindung**.", "The attraction between cations and anions in the lattice is called an **ionic bond**."),
      ],
      ok: tr("Im Ionengitter ist jedes Ion nur von Gegen-Ionen umgeben – überall Anziehung.", "In the ionic lattice, every ion is surrounded only by counter-ions – attraction everywhere."),
      visual: c => <LatticeFill c={c} cat={NA} an={CL} cols={5} rows={3} open={[]}
        caption={tr("Natriumchlorid NaCl · Linien: Anziehung", "Sodium chloride NaCl · lines: attraction")} />,
    }),
    model({
      mode: "faded",
      ask: tr("Fülle die Lücken im Gitter von Natriumchlorid NaCl. Tippe einen Platz an, bis das passende Ion dort sitzt.", "Fill the gaps in the lattice of sodium chloride NaCl. Tap a place until the right ion sits there."),
      lines: [tr("Neben jedem Cl⁻ sitzt ein Na⁺, neben jedem Na⁺ ein Cl⁻.", "Next to every Cl⁻ sits an Na⁺, next to every Na⁺ a Cl⁻."), tr("Nachbarn jedes Ions: {?}.", "Neighbours of every ion: {?}.")],
      answer: allCounter(),
      why: {
        [likeNb()]: tr("Zwei gleiche Ionen liegen nebeneinander – die rot gestrichelte Linie zeigt die Abstoßung. Tausche dort.", "Two like ions lie next to each other – the red dashed line shows the repulsion. Swap there."),
        [gapRes()]: tr("Noch ist ein Platz leer. Fülle jede Lücke.", "A place is still empty. Fill every gap."),
      },
      tip: tr("Folge dem Muster: In jeder Reihe wechseln sich Na⁺ und Cl⁻ ab.", "Follow the pattern: Na⁺ and Cl⁻ alternate in every row."),
      ok: tr("Abwechselnd Na⁺ und Cl⁻: Jedes Ion hat nur Gegen-Ionen als Nachbarn.", "Na⁺ and Cl⁻ alternating: every ion has only counter-ions as neighbours."),
      visual: c => <LatticeFill c={c} cat={NA} an={CL} cols={5} rows={4} open={[6, 8, 12]} />,
    }),
    model({
      mode: "free",
      ask: tr("Baue eine Schicht aus dem Gitter von Kaliumbromid KBr. Fülle alle Lücken.", "Build a layer of the lattice of potassium bromide KBr. Fill all the gaps."),
      answer: allCounter(),
      why: {
        [likeNb()]: tr("Zwei gleiche Ionen liegen nebeneinander und stoßen sich ab (rot gestrichelt). Tausche dort.", "Two like ions lie next to each other and repel (red dashed). Swap there."),
        [gapRes()]: tr("Noch ist ein Platz leer. Fülle jede Lücke.", "A place is still empty. Fill every gap."),
      },
      tip: tr("Schau dir die Nachbarn jeder Lücke an: Welches Ion ist ihr Gegen-Ion?", "Look at the neighbours of each gap: which ion is their counter-ion?"),
      ok: tr("Kaliumbromid KBr: K⁺ und Br⁻ im Wechsel – wie bei Natriumchlorid.", "Potassium bromide KBr: K⁺ and Br⁻ alternating – as in sodium chloride."),
      visual: c => <LatticeFill c={c} cat={K} an={BR} cols={5} rows={4} open={[1, 5, 7, 11, 13, 18]} />,
    }),
    model({
      mode: "free",
      ask: tr("Tippe alle direkten Nachbarn des markierten Cl⁻ in der Mitte an. Dann prüfe.", "Tap all direct neighbours of the marked Cl⁻ in the middle. Then check."),
      answer: "4",
      why: {
        [diag()]: tr("Schräg liegen Cl⁻ – gleich geladen und weiter weg. Direkte Nachbarn liegen auf den Linien.", "Diagonally there are Cl⁻ – like charge and further away. Direct neighbours lie on the lines."),
        [far()]: tr("Dieses Ion liegt weiter weg. Nur die nächsten Ionen sind direkte Nachbarn.", "This ion is further away. Only the nearest ions are direct neighbours."),
        "0": tr("Noch ist nichts markiert. Tippe die Nachbarn an.", "Nothing is marked yet. Tap the neighbours."),
        "1": tr("Es fehlen noch Nachbarn. Schau links, rechts, oben und unten.", "Some neighbours are missing. Look left, right, above and below."),
        "2": tr("Es fehlen noch Nachbarn. Schau links, rechts, oben und unten.", "Some neighbours are missing. Look left, right, above and below."),
        "3": tr("Es fehlt noch ein Nachbar. Schau links, rechts, oben und unten.", "One neighbour is missing. Look left, right, above and below."),
      },
      tip: tr("Direkte Nachbarn liegen auf den Linien, die vom markierten Ion ausgehen – ganz nah.", "Direct neighbours lie on the lines starting at the marked ion – very close."),
      ok: tr("In einer Schicht hat jedes Cl⁻ 4 Na⁺ als direkte Nachbarn – alles Gegen-Ionen.", "In a layer, every Cl⁻ has 4 Na⁺ as direct neighbours – all counter-ions."),
      visual: c => <NeighborTap c={c} cat={NA} an={CL} />,
    }),
    model({
      mode: "worked",
      say: tr("Das Gitter besteht aus vielen Schichten: davor und dahinter liegen weitere.", "The lattice consists of many layers: more lie in front and behind."),
      ask: tr("Zähle mit: Wie viele Cl⁻ umgeben ein Na⁺ im Raum?", "Count with us: how many Cl⁻ surround an Na⁺ in space?"),
      lines: [
        tr("In seiner Schicht: 4 Cl⁻ (links, rechts, oben, unten).", "In its layer: 4 Cl⁻ (left, right, above, below)."),
        tr("Dazu davor und dahinter je 1 Cl⁻.", "Plus 1 Cl⁻ in front and 1 behind."),
        tr("Zusammen 6 Cl⁻ um jedes Na⁺ – und 6 Na⁺ um jedes Cl⁻.", "Together 6 Cl⁻ around every Na⁺ – and 6 Na⁺ around every Cl⁻."),
      ],
      ok: tr("Jedes Ion zieht alle 6 Nachbarn gleich stark an. Darum gibt es im Gitter keine Paare.", "Every ion attracts all 6 neighbours equally strongly. So there are no pairs in the lattice."),
      visual: () => <Lattice3D />,
    }),
    model({
      mode: "faded",
      say: tr("Die Verhältnisformel nennt das kleinste Zahlenverhältnis der Ionen im Gitter.", "The empirical formula gives the smallest number ratio of the ions in the lattice."),
      ask: tr("Im Ausschnitt aus dem Gitter von Magnesiumoxid sind 4 Mg²⁺ und 4 O²⁻ markiert. Stelle die Verhältnisformel ein.", "In the section of the magnesium oxide lattice, 4 Mg²⁺ and 4 O²⁻ are marked. Set the empirical formula."),
      lines: [tr("Mg²⁺ : O²⁻ = 4 : 4, gekürzt 1 : 1.", "Mg²⁺ : O²⁻ = 4 : 4, reduced 1 : 1."), tr("Verhältnisformel: {?}", "Empirical formula: {?}")],
      answer: "MgO",
      why: {
        [unreduced()]: tr("So viele Ionen sind nur in diesem Ausschnitt. Das Gitter geht weiter – die Formel nennt das kleinste Verhältnis.", "That many ions are only in this section. The lattice goes on – the formula gives the smallest ratio."),
        [notNeutral()]: tr("Die Ladungen gleichen sich nicht aus. Bei 2+ und 2− braucht man gleich viele Ionen.", "The charges do not balance. With 2+ and 2− you need equal numbers of ions."),
      },
      tip: tr("Kürze das Verhältnis 4 : 4 so weit wie möglich.", "Reduce the ratio 4 : 4 as far as possible."),
      ok: tr("Magnesiumoxid MgO: Mg²⁺ und O²⁻ im Verhältnis 1 : 1, denn 1 · (2+) + 1 · (2−) = 0.", "Magnesium oxide MgO: Mg²⁺ and O²⁻ in the ratio 1 : 1, because 1 · (2+) + 1 · (2−) = 0."),
      visual: c => <FormulaModel c={c} />,
    }),
    {
      mode: "free",
      ask: tr("Woraus besteht ein Kristall von Natriumchlorid NaCl (Kochsalz)?", "What does a crystal of sodium chloride NaCl (table salt) consist of?"),
      options: [
        tr("aus NaCl-Molekülen", "of NaCl molecules"),
        tr("aus Na⁺-Cl⁻-Paaren", "of Na⁺-Cl⁻ pairs"),
        tr("aus Na⁺ und Cl⁻ im Ionengitter", "of Na⁺ and Cl⁻ in an ionic lattice"),
      ],
      answer: tr("aus Na⁺ und Cl⁻ im Ionengitter", "of Na⁺ and Cl⁻ in an ionic lattice"),
      why: {
        [tr("aus NaCl-Molekülen", "of NaCl molecules")]: tr("Moleküle gibt es im Salz nicht. NaCl nennt nur das Verhältnis 1 : 1.", "There are no molecules in a salt. NaCl only gives the ratio 1 : 1."),
        [tr("aus Na⁺-Cl⁻-Paaren", "of Na⁺-Cl⁻ pairs")]: tr("Jedes Na⁺ zieht 6 Cl⁻ gleich stark an. Kein Cl⁻ gehört zu einem bestimmten Na⁺.", "Every Na⁺ attracts 6 Cl⁻ equally strongly. No Cl⁻ belongs to one particular Na⁺."),
      },
      ok: tr("Natriumchlorid: sehr viele Na⁺ und Cl⁻ im Ionengitter, im Verhältnis 1 : 1 – keine Moleküle, keine Paare.", "Sodium chloride: a huge number of Na⁺ and Cl⁻ in an ionic lattice, in the ratio 1 : 1 – no molecules, no pairs."),
    },

    // ── Teil 3: Hart, spröde, hohe Schmelztemperatur ───────────────────────
    model({
      mode: "worked", part: tr("Hart und spröde", "Hard and brittle"),
      say: tr("Die Ionen im Gitter schwingen ständig ein wenig um ihren Platz. Je höher die Temperatur, desto stärker schwingen sie.",
        "The ions in the lattice constantly vibrate a little around their places. The higher the temperature, the more strongly they vibrate."),
      ask: tr("Sieh dir Natriumchlorid NaCl bei 400 °C an.", "Look at sodium chloride NaCl at 400 °C."),
      lines: [
        tr("Die Ionen schwingen stark.", "The ions vibrate strongly."),
        tr("Die Anziehung hält jedes Ion an seinem Platz – das Salz bleibt fest.", "The attraction holds every ion in its place – the salt stays solid."),
        tr("Erst bei der **Schmelztemperatur** verlassen die Ionen ihre Plätze.", "Only at the **melting point** do the ions leave their places."),
      ],
      ok: tr("Je höher die Temperatur, desto stärker schwingen die Ionen. Bis zur Schmelztemperatur hält das Gitter.", "The higher the temperature, the more the ions vibrate. Up to the melting point, the lattice holds."),
      visual: c => <ThermoLattice c={c} cat={NA} an={CL} tm={801} max={1000} step={1} start={400} sol={400} demo />,
    }),
    model({
      mode: "faded",
      say: tr("Eis schmilzt schon bei 0 °C. Salz wird erst sehr heiß flüssig – flüssiges Salz heißt **Schmelze**.", "Ice melts at just 0 °C. Salt only becomes liquid when very hot – liquid salt is called a **melt**."),
      ask: tr("Erhitze Natriumchlorid NaCl, bis das Gitter zerfällt. Dann prüfe.", "Heat sodium chloride NaCl until the lattice falls apart. Then check."),
      lines: [tr("Natriumchlorid schmilzt bei 801 °C.", "Sodium chloride melts at 801 °C."), tr("Die Ionen verlassen ihre Plätze → das Salz ist {?}.", "The ions leave their places → the salt is {?}.")],
      answer: molten(),
      why: { [solid()]: tr("Noch fest: Die Ionen schwingen nur um ihre Plätze. Schiebe die Temperatur höher.", "Still solid: the ions only vibrate around their places. Push the temperature higher.") },
      tip: tr("Was passiert mit den Ionen bei der Schmelztemperatur?", "What happens to the ions at the melting point?"),
      ok: tr("Ab 801 °C ist Natriumchlorid geschmolzen: Die Ionen verlassen ihre Plätze und gleiten ständig aneinander vorbei. Sie ziehen sich aber weiter an.",
        "From 801 °C, sodium chloride is molten: the ions leave their places and keep sliding past each other. But they still attract each other."),
      visual: c => <ThermoLattice c={c} cat={NA} an={CL} tm={801} max={1000} step={1} start={20} sol={850} />,
    }),
    model({
      mode: "free",
      say: tr("Magnesiumoxid MgO besteht aus Mg²⁺ und O²⁻ – die Ladungen sind doppelt so groß wie bei Na⁺ und Cl⁻.", "Magnesium oxide MgO consists of Mg²⁺ and O²⁻ – the charges are twice as large as for Na⁺ and Cl⁻."),
      ask: tr("Stelle eine Temperatur ein, bei der Natriumchlorid schon flüssig, Magnesiumoxid aber noch fest ist.", "Set a temperature at which sodium chloride is already liquid but magnesium oxide is still solid."),
      answer: naclOnly(),
      why: {
        [bothSolid()]: tr("Noch ist auch Natriumchlorid fest. Heize, bis sein Gitter zerfällt.", "Sodium chloride is still solid too. Heat until its lattice falls apart."),
        [bothLiquid()]: tr("Jetzt ist auch Magnesiumoxid geschmolzen – das war zu heiß. Gehe mit der Temperatur zurück.", "Now magnesium oxide has melted too – that was too hot. Turn the temperature down."),
      },
      tip: tr("Doppelte Ladungen ziehen sich stärker an. Welcher Stoff braucht also mehr Wärme zum Schmelzen?", "Double charges attract more strongly. So which substance needs more heat to melt?"),
      ok: tr("Natriumchlorid schmilzt bei 801 °C, Magnesiumoxid erst bei 2852 °C: höhere Ladungen, stärkere Anziehung, höhere Schmelztemperatur.", "Sodium chloride melts at 801 °C, magnesium oxide only at 2852 °C: higher charges, stronger attraction, higher melting point."),
      visual: c => <ThermoPair c={c} start={20} sol={1500} />,
    }),
    model({
      mode: "worked",
      say: tr("Salzkristalle sind **hart**: Die Anziehung hält die Schichten fest. Sie sind aber auch **spröde**: Bei einem Schlag zerspringen sie.",
        "Salt crystals are **hard**: the attraction holds the layers firmly. But they are also **brittle**: a blow shatters them."),
      ask: tr("Sieh dir an, was ein Hammerschlag im Kristall bewirkt.", "See what a hammer blow does inside the crystal."),
      lines: [
        tr("Halb verschoben: Die Gegen-Ionen halten die Schichten schwächer.", "Shifted halfway: the counter-ions hold the layers more weakly."),
        tr("Um einen Platz verschoben: Gleiche Ladungen stehen gegenüber und stoßen sich ab.", "Shifted by one place: like charges face each other and repel."),
        tr("Der Kristall bricht in glatte Stücke.", "The crystal breaks into smooth-faced pieces."),
      ],
      ok: tr("Hart wegen der starken Anziehung, spröde wegen der Abstoßung nach dem Verschieben.", "Hard because of the strong attraction, brittle because of the repulsion after shifting."),
      visual: c => <Brittle c={c} cat={NA} an={CL} start={4} sol={4} demo />,
    }),
    model({
      mode: "faded",
      ask: tr("Verschiebe die oberen Schichten von Kaliumbromid KBr, bis gleiche Ladungen genau gegenüberstehen. Dann prüfe.", "Shift the upper layers of potassium bromide KBr until like charges face each other exactly. Then check."),
      lines: [tr("K⁺ über K⁺ und Br⁻ über Br⁻ → {?} → der Kristall bricht.", "K⁺ above K⁺ and Br⁻ above Br⁻ → {?} → the crystal breaks.")],
      answer: repels(),
      why: {
        [holds()]: tr("Noch stehen Gegen-Ionen gegenüber und ziehen sich an. Verschiebe die oberen Schichten.", "Counter-ions still face each other and attract. Shift the upper layers."),
        [halfway()]: tr("Erst teilweise verschoben: Die Gegen-Ionen halten die Schichten noch. Schiebe weiter, bis gleiche Ladungen genau übereinander stehen.",
          "Only partly shifted: the counter-ions still hold the layers. Keep going until like charges stand exactly above each other."),
      },
      tip: tr("Beobachte in der Lupe die Ionen an der Trennlinie: Wann steht gleiche Ladung über gleicher Ladung?", "In the magnifier, watch the ions at the boundary: when is like charge above like charge?"),
      ok: tr("Um einen Platz verschoben: K⁺ über K⁺, Br⁻ über Br⁻ → Abstoßung, der Kristall bricht in Stücke.", "Shifted by one place: K⁺ above K⁺, Br⁻ above Br⁻ → repulsion, the crystal breaks into pieces."),
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
        [tr("Er wird flüssig.", "It becomes liquid.")]: tr("Schmelzen braucht 801 °C. Ein Schlag verschiebt Schichten, er macht das Salz nicht so heiß.", "Melting needs 801 °C. A blow shifts layers, it does not make the salt that hot."),
        [tr("Er verbiegt sich, ohne zu brechen.", "It bends without breaking.")]: tr("Verbiegen verschiebt Schichten. Dann stehen gleiche Ladungen gegenüber und stoßen sich ab – das Salz bricht.", "Bending shifts layers. Then like charges face each other and repel – the salt breaks."),
      },
      ok: tr("Salz ist spröde: Der Schlag verschiebt Schichten, gleiche Ladungen stoßen sich ab, der Kristall zerspringt.", "Salt is brittle: the blow shifts layers, like charges repel, the crystal shatters."),
      visual: () => <CrystalHammer />,
    },

    // ── Teil 4: Wann leiten Salze Strom? ────────────────────────────────────
    model({
      mode: "worked", part: tr("Strom leiten", "Conducting"),
      say: tr("**Elektrischer Strom** ist eine gerichtete Bewegung geladener Teilchen. Ein Stoff **leitet** Strom, wenn sich darin geladene Teilchen frei bewegen können.",
        "An **electric current** is a directed movement of charged particles. A substance **conducts** electricity if charged particles can move freely in it."),
      ask: tr("Sieh dir festes Natriumchlorid NaCl zwischen zwei Metallstäben an.", "Look at solid sodium chloride NaCl between two metal rods."),
      lines: [
        tr("Die Metallstäbe heißen **Elektroden**: einer ist der **Minuspol** (−), einer der **Pluspol** (+).", "The metal rods are called **electrodes**: one is the **negative pole** (−), one the **positive pole** (+)."),
        tr("Die Lupe zeigt einen vergrößerten Ausschnitt: Die Ionen schwingen nur um ihre Plätze im Gitter.", "The magnifier shows an enlarged close-up: the ions only vibrate around their places in the lattice."),
        tr("Sie können nicht wandern: kein Strom, die Lampe bleibt aus.", "They cannot move along: no current, the lamp stays off."),
      ],
      ok: tr("Festes Salz leitet nicht: Die Ionen sind geladen, aber nicht beweglich.", "Solid salt does not conduct: the ions are charged but cannot move about."),
      visual: c => <Conduct c={c} start={L("fest")} sol={L("fest")} result={lamp} demo />,
    }),
    model({
      mode: "faded",
      say: tr("Beim Schmelzen verlassen die Ionen das Gitter. Beim Lösen in Wasser H₂O lagern sich Wasserteilchen an und lösen die Ionen heraus – warum, lernst du bei der Elektronenpaarbindung.",
        "On melting, the ions leave the lattice. On dissolving in water H₂O, water particles attach and pull the ions out – why, you will learn with covalent bonds."),
      ask: tr("Stelle einen Zustand ein, in dem die Lampe leuchtet. Dann prüfe.", "Set a state in which the lamp lights up. Then check."),
      lines: [
        tr("Ionen beweglich: Sie bewegen sich ungeordnet und wandern dabei langsam – Kationen zum Minuspol, Anionen zum Pluspol.",
          "Ions mobile: they move about randomly and slowly drift along – cations to the negative pole, anions to the positive pole."),
        tr("Geladene Teilchen wandern in eine Richtung → {?}", "Charged particles move in one direction → {?}"),
      ],
      answer: lampOn(),
      why: { [lampOff()]: tr("Im festen Salz sitzen die Ionen fest – sie können nicht wandern. Kein Strom.", "In the solid salt the ions are fixed – they cannot move along. No current.") },
      tip: tr("Strom braucht geladene Teilchen, die sich bewegen können.", "A current needs charged particles that can move."),
      ok: tr("Schmelze oder Lösung: Na⁺ wandert zum Minuspol, Cl⁻ zum Pluspol – Strom fließt, die Lampe leuchtet. Was an den Elektroden passiert, lernst du später.",
        "Melt or solution: Na⁺ moves to the negative pole, Cl⁻ to the positive pole – current flows, the lamp lights up. What happens at the electrodes, you will learn later."),
      visual: c => <Conduct c={c} start={L("fest")} sol={L("schmelze")} result={lamp} />,
    }),
    model({
      mode: "free",
      ask: tr("Natriumchlorid soll Strom leiten, ohne dass du es auf 801 °C erhitzt. Stelle das Modell ein und schließe den Schalter.", "Sodium chloride should conduct without heating it to 801 °C. Set up the model and close the switch."),
      answer: sol(),
      why: {
        [circuitOpen()]: tr("Der Schalter ist offen, der Stromkreis ist unterbrochen. Schließe ihn.", "The switch is open, the circuit is broken. Close it."),
        [lampOff()]: tr("Festes Salz leitet nicht: Die Ionen sitzen fest.", "Solid salt does not conduct: the ions are fixed."),
        [melt()]: tr("Die Schmelze leitet – aber dafür brauchst du 801 °C. Es geht auch ohne Erhitzen.", "The melt conducts – but that needs 801 °C. It also works without heating."),
      },
      tip: tr("Denk an den zweiten Weg, die Ionen aus dem Gitter zu holen.", "Think of the second way to get the ions out of the lattice."),
      ok: tr("In Wasser H₂O gelöst sind die Ionen beweglich: Die Lösung leitet, die Lampe leuchtet.", "Dissolved in water H₂O, the ions can move: the solution conducts, the lamp lights up."),
      visual: c => <Conduct c={c} start={{ z: "fest", on: false, minusLeft: true }} sol={L("loesung")} switchable
        result={s => (!s.on ? circuitOpen() : s.z === "fest" ? lampOff() : s.z === "schmelze" ? melt() : sol())} />,
    }),
    model({
      mode: "free",
      ask: tr("In der Schmelze sollen die Cl⁻-Ionen zur linken Elektrode wandern. Stelle die Pole passend ein.", "In the melt, the Cl⁻ ions should move to the left electrode. Set the poles to match."),
      answer: leftPlus(),
      why: { [leftMinus()]: tr("Links ist der Minuspol. Cl⁻ ist negativ und wandert zum Pluspol – tausche die Pole.", "The negative pole is on the left. Cl⁻ is negative and moves to the positive pole – swap the poles.") },
      tip: tr("Ein Anion wird vom entgegengesetzt geladenen Pol angezogen.", "An anion is attracted by the oppositely charged pole."),
      ok: tr("Cl⁻ wandert zum Pluspol. Ist links der Pluspol, wandern die Cl⁻ nach links und die Na⁺ nach rechts.", "Cl⁻ moves to the positive pole. With the positive pole on the left, Cl⁻ moves left and Na⁺ moves right."),
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
        [tr("Im festen Salz gibt es noch keine Ionen.", "There are no ions yet in the solid salt.")]: tr("Die Ionen sind immer da, auch im Kristall. Sie können dort nur nicht wandern.", "The ions are always there, also in the crystal. They just cannot move along there."),
        [tr("Erst beim Schmelzen werden sie geladen.", "They only become charged when melting.")]: tr("Na⁺ und Cl⁻ sind schon im Kristall geladen. Beim Schmelzen werden sie nur beweglich.", "Na⁺ and Cl⁻ are already charged in the crystal. Melting only makes them mobile."),
      },
      ok: tr("Strom braucht bewegliche geladene Teilchen. Im festen Salz sind die Ionen geladen, aber fest im Gitter.", "A current needs mobile charged particles. In the solid salt the ions are charged but fixed in the lattice."),
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
        [tr("KBr fest", "solid KBr")]: tr("Im festen KBr sitzen K⁺ und Br⁻ im Gitter fest – kein Strom.", "In solid KBr, K⁺ and Br⁻ are fixed in the lattice – no current."),
        [tr("reines Wasser H₂O", "pure water H₂O")]: tr("Reines Wasser enthält fast keine Ionen – kaum geladene Teilchen, die wandern.", "Pure water contains almost no ions – hardly any charged particles that move."),
      },
      ok: tr("Gelöst sind K⁺ und Br⁻ beweglich: K⁺ wandert zum Minuspol, Br⁻ zum Pluspol – die Lampe leuchtet.", "Dissolved, K⁺ and Br⁻ can move: K⁺ moves to the negative pole, Br⁻ to the positive pole – the lamp lights up."),
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
      tr("Anziehung und Abstoßung geladener Ionen vorhersagen.", "Predict attraction and repulsion of charged ions."),
      tr("Ein Ionengitter bauen und erklären: Ionenbindung, Gegen-Ionen, keine Moleküle, Formel = Verhältnis.", "Build and explain an ionic lattice: ionic bond, counter-ions, no molecules, formula = ratio."),
      tr("Hohe Schmelztemperatur, Härte und Sprödigkeit mit dem Gitter begründen.", "Explain the high melting point, hardness and brittleness with the lattice."),
      tr("Erklären, wann Salze Strom leiten: als Schmelze und Lösung ja, fest nicht.", "Explain when salts conduct: as a melt and a solution yes, as a solid no."),
    ],
  },
  explain: [
    [
      tr("**Anziehung**: Entgegengesetzte Ladungen ziehen sich an, z. B. Na⁺ und Cl⁻.", "**Attraction**: opposite charges attract each other, e.g. Na⁺ and Cl⁻."),
      tr("**Abstoßung**: Gleiche Ladungen stoßen sich ab, z. B. Cl⁻ und Cl⁻.", "**Repulsion**: like charges repel each other, e.g. Cl⁻ and Cl⁻."),
      tr("Ein Ion spürt jeden Nachbarn: Ein K⁺ zwischen K⁺ und Br⁻ wird abgestoßen und angezogen.", "An ion feels every neighbour: a K⁺ between K⁺ and Br⁻ is repelled and attracted."),
    ],
    [
      tr("**Ionengitter**: Kationen und Anionen liegen abwechselnd, jedes Ion ist nur von **Gegen-Ionen** umgeben.", "**Ionic lattice**: cations and anions alternate, every ion is surrounded only by **counter-ions**."),
      tr("**Ionenbindung**: die Anziehung zwischen Kationen und Anionen im Ionengitter.", "**Ionic bond**: the attraction between cations and anions in the ionic lattice."),
      tr("Im Raum hat bei Natriumchlorid jedes Ion 6 Gegen-Ionen als Nachbarn – keine Paare, keine Moleküle.", "In space, every ion in sodium chloride has 6 counter-ions as neighbours – no pairs, no molecules."),
      tr("Die **Verhältnisformel** nennt das kleinste Verhältnis, z. B. Calciumchlorid CaCl₂: Ca²⁺ : Cl⁻ = 1 : 2.", "The **empirical formula** gives the smallest ratio, e.g. calcium chloride CaCl₂: Ca²⁺ : Cl⁻ = 1 : 2."),
    ],
    [
      tr("Die Ionen schwingen um ihre Plätze – je heißer, desto stärker.", "The ions vibrate around their places – the hotter, the more strongly."),
      tr("Bei der **Schmelztemperatur** verlassen sie ihre Plätze: Kaliumbromid schmilzt bei 734 °C, Eis bei 0 °C.", "At the **melting point** they leave their places: potassium bromide melts at 734 °C, ice at 0 °C."),
      tr("In der **Schmelze** gleiten die Ionen ständig aneinander vorbei und ziehen sich weiter an. Kühlt sie ab, ordnen sie sich wieder zum Gitter.",
        "In the **melt** the ions keep sliding past each other and still attract each other. When it cools, they arrange themselves into a lattice again."),
      tr("**Hart**: Die starke Anziehung hält die Schichten fest. **Spröde**: Verschobene Schichten stoßen sich ab, der Kristall bricht.", "**Hard**: the strong attraction holds the layers firmly. **Brittle**: shifted layers repel each other, the crystal breaks."),
    ],
    [
      tr("**Elektrischer Strom**: gerichtete Bewegung geladener Teilchen.", "**Electric current**: directed movement of charged particles."),
      tr("Fest sitzen die Ionen fest: kein Strom. Als **Schmelze** oder Lösung sind sie beweglich: Strom fließt.", "In a solid the ions are fixed: no current. In a **melt** or solution they can move: current flows."),
      tr("Kationen wandern langsam zum **Minuspol**, Anionen zum **Pluspol** – die Ionen bleiben dabei gemischt.", "Cations slowly move to the **negative pole**, anions to the **positive pole** – the ions stay mixed."),
    ],
  ],
});
