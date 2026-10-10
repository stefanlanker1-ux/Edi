// Kapitel 2: Formel und Name (Level I) – Ladungen von Kationen und Anionen ausgleichen, Verhältnisformel mit Index, Name mit -id, beide Richtungen.
// Texte nennen Ladungen in Worten („zwei positive Ladungen“) – keine Rechnung mit Klammern und keine Breiten der Bausteine.
// Modelle (k2/models.tsx): Ionenwand mit Steppern, Formel-Baukasten (Index, Reihenfolge), Namens-Baukasten (Wortteile), Ionenwahl (Ladung + Anzahl).

import type { GuideStep } from "@lern/ui";
import { tr } from "@lern/i18n";
import type { Kapitel } from "./types.ts";
import { model } from "./model.tsx";
import { Crystal, FormulaModel, NameModel, PICK_NONE, PickModel, StaticWall, WallModel, builtKey, formulaKey, nameOf, wallKey, type Piece } from "./k2/models.tsx";
import "./k2/k2.css";

const tileLabels = () => [
  { at: ".ion-tile.cation", text: tr("Kation", "Cation"), side: "left" as const, point: "left" as const },
  { at: ".ion-tile.anion", text: "Anion", side: "left" as const, point: "left" as const },
];

/* Wortteile für den Namens-Baukasten (deutsch zusammengeschrieben, englisch Metall + Wort) */
const M = (de: string, en: string): Piece => ({ t: tr(de, en), k: "m" });
const S = (de: string, en: string): Piece => ({ t: tr(de, en), k: "s" });
const ID = (): Piece => ({ t: tr("-id", "-ide"), k: "e" });
const N = (t: string): Piece => ({ t, k: "n" });
/** Stellen der Teile in der Tastenreihe bzw. der Name daraus */
const at = (p: Piece[], ...parts: Piece[]) => parts.map(x => p.indexOf(x));
const nm = (p: Piece[], ...parts: Piece[]) => nameOf(p, at(p, ...parts));
/** Prüfen ohne Wortteil */
const noName = () => ({ "—": tr("Tippe die Wortteile der Reihe nach an.", "Tap the word parts in order.") });
/** Prüfen, bevor beide Ladungen gewählt sind */
const noCharge = () => ({ [PICK_NONE]: tr("Wähle zuerst die Ladung beider Ionen. Die Hauptgruppe im PSE zeigt sie.", "First choose the charge of both ions. The main group in the periodic table shows it.") });

function steps(): GuideStep[] {
  // Namens-Baukasten: Tasten in fester, gemischter Reihenfolge (nie in der Reihenfolge der Lösung), alle gleich gefärbt
  const na = M("Natrium", "Sodium"), cl = S("Chlor", "Chlor"), id1 = ID(), di1 = N("di");
  const pNaCl = [cl, di1, id1, na];
  const mg = M("Magnesium", "Magnesium"), sauer = S("Sauerstoff", "Oxygen"), ox = S("Ox", "Ox"), id2 = ID(), di2 = N("di");
  const pMgO = [ox, sauer, id2, mg, di2];
  const ka = M("Kalium", "Potassium"), schw = S("Schwefel", "Sulfur"), sulf = S("Sulf", "Sulf"), id3 = ID(), di3 = N("di");
  const pK2S = [sulf, id3, schw, di3, ka];
  const ca = M("Calcium", "Calcium"), fl = S("Fluor", "Fluor"), id4 = ID(), di4 = N("di");
  const pCaF2 = [id4, fl, di4, ca];
  const na5 = M("Natrium", "Sodium"), sauer5 = S("Sauerstoff", "Oxygen"), ox5 = S("Ox", "Ox"), id5 = ID(), di5 = N("di");
  const pNa2O = [di5, ox5, na5, sauer5, id5];
  const mg6 = M("Magnesium", "Magnesium"), stick = S("Stickstoff", "Nitrogen"), nitr = S("Nitr", "Nitr"), id6 = ID(), di6 = N("di"), tri6 = N("tri");
  const pMg3N2 = [nitr, tri6, id6, stick, di6, mg6];

  const list: GuideStep[] = [
    // ── 1 Ladungen ausgleichen ──
    model({
      mode: "worked", part: tr("Ladungen ausgleichen", "Balancing charges"),
      say: tr("Kochsalz besteht aus Natrium-Ionen Na⁺ und Chlorid-Ionen Cl⁻. Einen Stoff aus Kationen und Anionen nennt man **Ionenverbindung**.", "Table salt is made of sodium ions Na⁺ and chloride ions Cl⁻. A substance made of cations and anions is called an **ionic compound**."),
      ask: tr("Warum ist Kochsalz insgesamt nicht geladen?", "Why is table salt not charged overall?"),
      visual: c => <WallModel c={c} cat="Na+" an="Cl-" start={[1, 1]} sol={[1, 1]} />,
      labels: tileLabels(),
      lines: [
        tr("Ein Natrium-Ion hat eine positive Ladung, ein Chlorid-Ion eine negative.", "A sodium ion has one positive charge, a chloride ion one negative charge."),
        tr("Auf jedes Natrium-Ion kommt ein Chlorid-Ion.", "There is one chloride ion for every sodium ion."),
        tr("So gibt es genau gleich viele positive wie negative Ladungen.", "So there are exactly as many positive as negative charges."),
      ],
      ok: tr("Die Ladungen gleichen sich aus: Die Ionenverbindung ist **neutral**.", "The charges balance each other: the ionic compound is **neutral**."),
    }),
    model({
      mode: "worked",
      say: tr("Haben Kation und Anion verschieden viele Ladungen, braucht man von einem der beiden Ionen mehrere.", "If cation and anion carry different numbers of charges, you need several of one of the two ions."),
      ask: tr("Wie viele Chlorid-Ionen gleichen ein Calcium-Ion aus?", "How many chloride ions balance one calcium ion?"),
      visual: c => <WallModel c={c} cat="Ca2+" an="Cl-" start={[1, 2]} sol={[1, 2]} />,
      lines: [
        tr("Ein Calcium-Ion Ca²⁺ hat zwei positive Ladungen.", "A calcium ion Ca²⁺ has two positive charges."),
        tr("Ein Chlorid-Ion Cl⁻ hat nur eine negative Ladung.", "A chloride ion Cl⁻ has only one negative charge."),
        tr("Erst zwei Chlorid-Ionen bringen zusammen zwei negative Ladungen.", "Only two chloride ions together bring two negative charges."),
      ],
      ok: tr("Da Calcium zwei positive Ladungen hat, kommen auf ein Calcium-Ion zwei Chlorid-Ionen. Dann ist die Verbindung neutral.", "Because calcium has two positive charges, there are two chloride ions for every calcium ion. Then the compound is neutral."),
    }),
    model({
      mode: "faded",
      ask: tr("Gleiche die Ladungen von Na⁺ und O²⁻ aus – mit möglichst wenigen Ionen.", "Balance the charges of Na⁺ and O²⁻ – with as few ions as possible."),
      visual: c => <WallModel c={c} cat="Na+" an="O2-" start={[1, 1]} sol={[2, 1]} />,
      lines: [
        tr("Ein Oxid-Ion O²⁻ hat zwei negative Ladungen, ein Natrium-Ion Na⁺ nur eine positive.", "An oxide ion O²⁻ has two negative charges, a sodium ion Na⁺ only one positive charge."),
        tr("Neutral mit möglichst wenigen Ionen: {?}", "Neutral with as few ions as possible: {?}"),
      ],
      answer: wallKey("Na+", "O2-", 2, 1),
      why: {
        [wallKey("Na+", "O2-", 1, 1)]: tr("Ein Na⁺ bringt nur eine positive Ladung, das O²⁻ aber zwei negative. Es fehlt noch positive Ladung.", "One Na⁺ brings only one positive charge, but the O²⁻ has two negative ones. Positive charge is still missing."),
        [wallKey("Na+", "O2-", 1, 2)]: tr("Jetzt sind es vier negative Ladungen und nur eine positive. Nimm mehr Na⁺, nicht mehr O²⁻.", "Now there are four negative charges and only one positive. Take more Na⁺, not more O²⁻."),
        [wallKey("Na+", "O2-", 3, 1)]: tr("Drei Na⁺ bringen drei positive Ladungen – eine zu viel für das O²⁻.", "Three Na⁺ bring three positive charges – one too many for the O²⁻."),
        [wallKey("Na+", "O2-", 4, 2)]: tr("Das ist neutral, aber es geht mit der Hälfte der Ionen.", "That is neutral, but it works with half the ions."),
      },
      tip: tr("Ergänze Ionen auf der Seite mit weniger Ladung, bis sich die Ladungen ausgleichen.", "Add ions on the side with less charge until the charges balance."),
      ok: tr("Zwei Na⁺ bringen zwei positive Ladungen und gleichen so ein O²⁻ aus.", "Two Na⁺ bring two positive charges and so balance one O²⁻."),
    }),
    model({
      mode: "free",
      ask: tr("Magnesiumoxid besteht aus Mg²⁺ und O²⁻. Gleiche die Ladungen der Kationen und Anionen aus – mit möglichst wenigen Ionen.", "Magnesium oxide is made of Mg²⁺ and O²⁻. Balance the charges of the cations and anions – with as few ions as possible."),
      visual: c => <WallModel c={c} cat="Mg2+" an="O2-" start={[1, 2]} sol={[1, 1]} />,
      answer: wallKey("Mg2+", "O2-", 1, 1),
      why: {
        [wallKey("Mg2+", "O2-", 1, 2)]: tr("Zwei O²⁻ bringen vier negative Ladungen, das Mg²⁺ nur zwei positive. Hier ist zu viel negative Ladung.", "Two O²⁻ bring four negative charges, the Mg²⁺ only two positive ones. There is too much negative charge."),
        [wallKey("Mg2+", "O2-", 2, 1)]: tr("Zwei Mg²⁺ bringen vier positive Ladungen, das O²⁻ nur zwei negative. Hier ist zu viel positive Ladung.", "Two Mg²⁺ bring four positive charges, the O²⁻ only two negative ones. There is too much positive charge."),
        [wallKey("Mg2+", "O2-", 2, 2)]: tr("Das ist neutral, aber es geht mit der Hälfte der Ionen.", "That is neutral, but it works with half the ions."),
      },
      tip: tr("Vergleiche: Wie viele positive Ladungen hat ein Mg²⁺, wie viele negative ein O²⁻?", "Compare: how many positive charges does one Mg²⁺ have, how many negative charges does one O²⁻ have?"),
      ok: tr("Mg²⁺ und O²⁻ haben gleich viele Ladungen. Darum gleichen sie sich im Verhältnis 1 : 1 aus.", "Mg²⁺ and O²⁻ carry the same number of charges. So they balance in a 1 : 1 ratio."),
    }),
    model({
      mode: "free",
      ask: tr("Gleiche die Ladungen von Al³⁺ und F⁻ aus – mit möglichst wenigen Ionen.", "Balance the charges of Al³⁺ and F⁻ – with as few ions as possible."),
      visual: c => <WallModel c={c} cat="Al3+" an="F-" start={[1, 1]} sol={[1, 3]} />,
      answer: wallKey("Al3+", "F-", 1, 3),
      why: {
        [wallKey("Al3+", "F-", 1, 1)]: tr("Ein F⁻ gleicht nur eine der drei positiven Ladungen aus. Es fehlen noch F⁻.", "One F⁻ balances only one of the three positive charges. More F⁻ are missing."),
        [wallKey("Al3+", "F-", 1, 2)]: tr("Zwei F⁻ gleichen erst zwei der drei positiven Ladungen aus.", "Two F⁻ balance only two of the three positive charges."),
        [wallKey("Al3+", "F-", 1, 4)]: tr("Vier F⁻ bringen vier negative Ladungen – eine mehr, als das Al³⁺ positive hat.", "Four F⁻ bring four negative charges – one more than the Al³⁺ has positive ones."),
      },
      tip: tr("Wie viele positive Ladungen hat ein Al³⁺? So viele negative Ladungen brauchst du.", "How many positive charges does one Al³⁺ have? You need that many negative charges."),
      ok: tr("Ein Al³⁺ hat drei positive Ladungen. Drei F⁻ gleichen sie aus.", "One Al³⁺ has three positive charges. Three F⁻ balance them."),
    }),
    model({
      mode: "free",
      say: tr("Manchmal braucht man von beiden Ionen mehrere.", "Sometimes you need several of both ions."),
      ask: tr("Gleiche die Ladungen von Al³⁺ und O²⁻ aus – mit möglichst wenigen Ionen.", "Balance the charges of Al³⁺ and O²⁻ – with as few ions as possible."),
      visual: c => <WallModel c={c} cat="Al3+" an="O2-" start={[1, 1]} sol={[2, 3]} />,
      answer: wallKey("Al3+", "O2-", 2, 3),
      why: {
        [wallKey("Al3+", "O2-", 1, 1)]: tr("Ein Al³⁺ hat drei positive Ladungen, ein O²⁻ nur zwei negative. Ergänze Ionen auf der Seite mit weniger Ladung.", "One Al³⁺ has three positive charges, one O²⁻ only two negative ones. Add ions on the side with less charge."),
        [wallKey("Al3+", "O2-", 1, 2)]: tr("Jetzt stehen drei positive Ladungen vier negativen gegenüber. Nun fehlt positive Ladung.", "Now three positive charges face four negative ones. Now positive charge is missing."),
        [wallKey("Al3+", "O2-", 2, 2)]: tr("Sechs positive, aber nur vier negative Ladungen. Es fehlt noch negative Ladung.", "Six positive but only four negative charges. Negative charge is still missing."),
        [wallKey("Al3+", "O2-", 3, 2)]: tr("Neun positive, aber nur vier negative Ladungen. Vertauscht? Das Al³⁺ hat die größere Ladung.", "Nine positive but only four negative charges. Swapped? The Al³⁺ has the larger charge."),
      },
      tip: tr("Ergänze immer auf der Seite mit weniger Ladung ein Ion, bis beide Seiten gleich viel Ladung haben.", "Always add an ion on the side with less charge until both sides have the same amount of charge."),
      ok: tr("Zwei Al³⁺ haben zusammen sechs positive Ladungen, drei O²⁻ sechs negative. So gleichen sie sich aus.", "Two Al³⁺ together have six positive charges, three O²⁻ six negative ones. So they balance."),
    }),
    {
      mode: "free",
      ask: tr("Jemand sagt: „1 Ca²⁺ und 1 Cl⁻ sind neutral – ein Kation, ein Anion.“ Stimmt das?", "Someone says: “1 Ca²⁺ and 1 Cl⁻ are neutral – one cation, one anion.” Is that right?"),
      visual: () => <StaticWall cat="Ca2+" an="Cl-" nC={1} nA={1} calc={false} />,
      options: [
        tr("Ja: gleich viele Kationen wie Anionen", "Yes: as many cations as anions"),
        tr("Nein: Eine positive Ladung bleibt übrig", "No: one positive charge is left over"),
        tr("Ja: Plus und Minus ziehen sich an", "Yes: plus and minus attract each other"),
        tr("Nein: Es fehlt noch ein Ca²⁺", "No: one more Ca²⁺ is missing"),
      ],
      answer: tr("Nein: Eine positive Ladung bleibt übrig", "No: one positive charge is left over"),
      why: {
        [tr("Ja: gleich viele Kationen wie Anionen", "Yes: as many cations as anions")]: tr("Es kommt auf die Ladungen an, nicht auf die Zahl der Ionen. Das Ca²⁺ hat zwei positive Ladungen, das Cl⁻ nur eine negative.", "What counts is the charges, not the number of ions. The Ca²⁺ has two positive charges, the Cl⁻ only one negative charge."),
        [tr("Ja: Plus und Minus ziehen sich an", "Yes: plus and minus attract each other")]: tr("Kationen und Anionen ziehen sich immer an. Neutral ist es aber erst, wenn sich die Ladungen ausgleichen.", "Cations and anions always attract each other. But it is only neutral when the charges balance."),
        [tr("Nein: Es fehlt noch ein Ca²⁺", "No: one more Ca²⁺ is missing")]: tr("Ein zweites Ca²⁺ brächte noch mehr positive Ladung. Es fehlt ein Cl⁻.", "A second Ca²⁺ would bring even more positive charge. One Cl⁻ is missing."),
      },
      ok: tr("Neutral heißt: gleich viel positive wie negative Ladung – nicht gleich viele Ionen. Zu einem Ca²⁺ gehören zwei Cl⁻.", "Neutral means as much positive as negative charge – not the same number of ions. One Ca²⁺ goes with two Cl⁻."),
    },

    // ── 2 Die Formel ──
    model({
      mode: "worked", part: tr("Die Formel", "The formula"),
      say: tr("Die **Verhältnisformel** gibt an, in welchem Zahlenverhältnis die Ionen in der Verbindung vorkommen.", "The **empirical formula** states the number ratio in which the ions occur in the compound."),
      ask: tr("Wie schreibt man die Formel für ein Ca²⁺ und zwei Cl⁻?", "How do you write the formula for one Ca²⁺ and two Cl⁻?"),
      visual: c => <FormulaModel c={c} cat="Ca2+" an="Cl-" start={[1, 2]} sol={[1, 2]} />,
      labels: [{ at: ".k2-idx", text: tr("Index", "Subscript"), side: "right", point: "right" }],
      lines: [
        tr("Zuerst steht das Kation, dann das Anion: erst Ca, dann Cl. Die Ladungen schreibt man nicht dazu.", "The cation comes first, then the anion: first Ca, then Cl. The charges are not written."),
        tr("Die Anzahl steht klein und tiefgestellt hinter dem Symbol. Das ist der **Index**.", "The number is written small and lowered after the symbol. This is the **subscript**."),
        tr("Eine 1 schreibt man nicht. So entsteht **CaCl₂**.", "A 1 is not written. This gives **CaCl₂**."),
      ],
      ok: tr("CaCl₂ bedeutet: Auf ein Calcium-Ion kommen zwei Chlorid-Ionen.", "CaCl₂ means: there are two chloride ions for every calcium ion."),
    }),
    model({
      mode: "faded",
      ask: tr("Stelle die Indizes für die Verbindung aus K⁺ und S²⁻ ein.", "Set the subscripts for the compound of K⁺ and S²⁻."),
      visual: c => <FormulaModel c={c} cat="K+" an="S2-" start={[1, 1]} sol={[2, 1]} />,
      lines: [
        tr("S²⁻ hat zwei negative Ladungen, K⁺ nur eine positive. Man braucht also zwei K⁺.", "S²⁻ has two negative charges, K⁺ only one positive charge. So you need two K⁺."),
        tr("Formel: {?}", "Formula: {?}"),
      ],
      answer: formulaKey("K+", "S2-", 2, 1),
      why: {
        [formulaKey("K+", "S2-", 1, 1)]: tr("KS bedeutet ein K⁺ und ein S²⁻. Dann fehlt eine positive Ladung.", "KS means one K⁺ and one S²⁻. Then one positive charge is missing."),
        [formulaKey("K+", "S2-", 1, 2)]: tr("Die 2 gehört zum K: Man braucht zwei K⁺ für ein S²⁻.", "The 2 belongs to K: you need two K⁺ for one S²⁻."),
        [formulaKey("K+", "S2-", 3, 1)]: tr("Drei K⁺ bringen drei positive Ladungen – eine zu viel.", "Three K⁺ bring three positive charges – one too many."),
        [formulaKey("K+", "S2-", 2, 1, true)]: tr("Die Anzahl stimmt, aber das Kation steht zuerst: erst K, dann S.", "The numbers are right, but the cation comes first: K, then S."),
      },
      tip: tr("Der Index steht hinter dem Symbol, von dem man mehrere braucht.", "The subscript goes after the symbol you need several of."),
      ok: tr("Zwei K⁺ gleichen ein S²⁻ aus. Die Formel ist K₂S, mit dem Index 2 beim K.", "Two K⁺ balance one S²⁻. The formula is K₂S, with the subscript 2 on K."),
    }),
    model({
      mode: "free",
      say: tr("Jetzt stellst du die Formel selbst auf.", "Now you write the formula yourself."),
      ask: tr("Stelle die Formel der Verbindung aus Al³⁺ und F⁻ auf.", "Write the formula of the compound of Al³⁺ and F⁻."),
      visual: c => <FormulaModel c={c} cat="Al3+" an="F-" start={[1, 1]} sol={[1, 3]} />,
      answer: formulaKey("Al3+", "F-", 1, 3),
      why: {
        [formulaKey("Al3+", "F-", 1, 1)]: tr("AlF bedeutet ein Al³⁺ und ein F⁻. Das sind drei positive, aber nur eine negative Ladung.", "AlF means one Al³⁺ and one F⁻. That is three positive charges but only one negative charge."),
        [formulaKey("Al3+", "F-", 1, 2)]: tr("Zwei F⁻ reichen nicht für die drei positiven Ladungen des Al³⁺.", "Two F⁻ are not enough for the three positive charges of the Al³⁺."),
        [formulaKey("Al3+", "F-", 3, 1)]: tr("Die 3 steht beim falschen Symbol: Das wären drei Al³⁺ mit neun positiven Ladungen.", "The 3 is on the wrong symbol: that would be three Al³⁺ with nine positive charges."),
        [formulaKey("Al3+", "F-", 1, 3, true)]: tr("Die Anzahl stimmt, aber das Kation steht zuerst: erst Al, dann F.", "The numbers are right, but the cation comes first: Al, then F."),
      },
      tip: tr("Der Index sagt, wie viele Ionen man braucht. Im Bild siehst du, ob sich die Ladungen ausgleichen.", "The subscript says how many ions you need. The picture shows whether the charges balance."),
      ok: tr("Ein Al³⁺ und drei F⁻ gleichen sich aus. Die Formel ist AlF₃.", "One Al³⁺ and three F⁻ balance each other. The formula is AlF₃."),
    }),
    {
      mode: "free",
      ask: tr("Welche Formel gehört zu diesen Ionen?", "Which formula belongs to these ions?"),
      visual: () => <StaticWall cat="Mg2+" an="Cl-" nC={1} nA={2} />,
      options: ["Mg₂Cl", "MgCl²", "MgCl₂", "Mg²⁺Cl₂⁻"],
      answer: "MgCl₂",
      why: {
        "Mg₂Cl": tr("Die 2 gehört zum Cl: Es sind zwei Cl⁻, aber nur ein Mg²⁺.", "The 2 belongs to Cl: there are two Cl⁻ but only one Mg²⁺."),
        "MgCl²": tr("Eine hochgestellte Zahl ist eine Ladung. Die Anzahl steht tiefgestellt, als Index.", "A raised number is a charge. The number of ions is lowered, as a subscript."),
        "Mg²⁺Cl₂⁻": tr("In der Verhältnisformel stehen keine Ladungen, denn sie gleichen sich ja aus.", "There are no charges in the empirical formula, because they balance anyway."),
      },
      ok: tr("Ein Mg²⁺ und zwei Cl⁻ ergeben MgCl₂. Der Index 2 steht tiefgestellt beim Cl, die 1 lässt man weg.", "One Mg²⁺ and two Cl⁻ give MgCl₂. The subscript 2 is lowered on Cl, the 1 is left out."),
    },
    model({
      mode: "free",
      say: tr("Die Formel gibt immer das **kleinste** Zahlenverhältnis an.", "The formula always gives the **smallest** number ratio."),
      ask: tr("Jemand schreibt Mg₂O₂ für die Verbindung aus Mg²⁺ und O²⁻. Verbessere die Formel.", "Someone writes Mg₂O₂ for the compound of Mg²⁺ and O²⁻. Correct the formula."),
      visual: c => <FormulaModel c={c} cat="Mg2+" an="O2-" start={[2, 2]} sol={[1, 1]} />,
      answer: formulaKey("Mg2+", "O2-", 1, 1),
      why: {
        [formulaKey("Mg2+", "O2-", 2, 2)]: tr("Das ist neutral, aber nicht das kleinste Verhältnis: 2 : 2 ist dasselbe wie 1 : 1.", "That is neutral, but not the smallest ratio: 2 : 2 is the same as 1 : 1."),
        [formulaKey("Mg2+", "O2-", 1, 2)]: tr("Ein Mg²⁺ und zwei O²⁻: Das sind zwei positive, aber vier negative Ladungen.", "One Mg²⁺ and two O²⁻: that is two positive but four negative charges."),
        [formulaKey("Mg2+", "O2-", 2, 1)]: tr("Zwei Mg²⁺ und ein O²⁻: Das sind vier positive, aber nur zwei negative Ladungen.", "Two Mg²⁺ and one O²⁻: that is four positive but only two negative charges."),
        [formulaKey("Mg2+", "O2-", 1, 1, true)]: tr("Das Kation steht zuerst: erst Mg, dann O.", "The cation comes first: Mg, then O."),
      },
      tip: tr("Teile beide Indizes durch dieselbe Zahl, solange es geht.", "Divide both subscripts by the same number as long as you can."),
      ok: tr("Mg²⁺ und O²⁻ gleichen sich im Verhältnis 1 : 1 aus. Die Formel ist MgO, nicht Mg₂O₂.", "Mg²⁺ and O²⁻ balance in a 1 : 1 ratio. The formula is MgO, not Mg₂O₂."),
    }),
    {
      mode: "free",
      say: tr("Ein Kochsalzkorn besteht aus sehr vielen Na⁺ und Cl⁻, die sich abwechseln.", "A grain of salt consists of very many Na⁺ and Cl⁻ that alternate."),
      ask: tr("Was sagt die Formel NaCl über Kochsalz aus?", "What does the formula NaCl tell you about table salt?"),
      visual: () => <Crystal />,
      options: [
        tr("Es besteht aus NaCl-Molekülen", "It is made of NaCl molecules"),
        tr("Natrium und Chlor sind gemischt", "Sodium and chlorine are mixed"),
        tr("Auf ein Na⁺ kommt ein Cl⁻", "There is one Cl⁻ for every Na⁺"),
      ],
      answer: tr("Auf ein Na⁺ kommt ein Cl⁻", "There is one Cl⁻ for every Na⁺"),
      why: {
        [tr("Es besteht aus NaCl-Molekülen", "It is made of NaCl molecules")]: tr("Es gibt keine einzelnen NaCl-Teilchen. Jedes Ion ist ringsum von mehreren Ionen mit entgegengesetzter Ladung umgeben.", "There are no single NaCl particles. Each ion is surrounded by several ions of opposite charge."),
        [tr("Natrium und Chlor sind gemischt", "Sodium and chlorine are mixed")]: tr("In einem Gemisch lägen die Stoffe Natrium und Chlor nebeneinander vor. Kochsalz besteht aber aus Ionen – es ist ein neuer Stoff.", "A mixture would contain the substances sodium and chlorine side by side. But table salt is made of ions – it is a new substance."),
      },
      ok: tr("Die Formel nennt nur das Verhältnis: Auf ein Na⁺ kommt ein Cl⁻, auch bei unzählig vielen Ionen.", "The formula only gives the ratio: one Cl⁻ for every Na⁺, even among countless ions."),
    },

    // ── 3 Der Name ──
    model({
      mode: "worked", part: tr("Der Name", "The name"),
      say: tr("Der Name hat zwei Teile: Zuerst kommt das Metall, dann das Nichtmetall mit der Endung **-id**.", "The name has two parts: first the metal, then the non-metal with the ending **-ide**."),
      ask: tr("Wie heißt NaCl?", "What is NaCl called?"),
      visual: c => <NameModel c={c} f="NaCl" pieces={pNaCl} sol={at(pNaCl, na, cl, id1)} />,
      lines: [
        tr("Zuerst das Metall: Natrium.", "First the metal: sodium."),
        tr("Dann das Nichtmetall Chlor mit der Endung -id: Chlorid.", "Then the non-metal chlorine with the ending -ide: chloride."),
        tr("Zusammen ergibt das **Natriumchlorid**. Genauso entstehen Fluorid, **Bromid** und Iodid.", "Together this gives **sodium chloride**. Fluoride, **bromide** and iodide are formed the same way."),
      ],
      ok: tr("Natrium + Chlor + id ergibt Natriumchlorid.", "Sodium + chlor + ide gives sodium chloride."),
    }),
    model({
      mode: "worked",
      say: tr("Bei Sauerstoff, Schwefel und Stickstoff verwendet man einen besonderen Wortstamm.", "For oxygen, sulfur and nitrogen a special word stem is used."),
      ask: tr("Wie heißt MgO?", "What is MgO called?"),
      visual: c => <NameModel c={c} f="MgO" pieces={pMgO} sol={at(pMgO, mg, ox, id2)} />,
      lines: [
        tr("Aus Sauerstoff wird **Oxid**, aus Schwefel **Sulfid** und aus Stickstoff **Nitrid**.", "Oxygen becomes **oxide**, sulfur **sulfide** and nitrogen **nitride**."),
        tr("MgO heißt also Magnesium + Ox + id: **Magnesiumoxid**.", "So MgO is magnesium + ox + ide: **magnesium oxide**."),
        tr("Die Anzahl der Ionen steht nicht im Namen, denn die Ladungen legen das Verhältnis fest. CaCl₂ heißt einfach Calciumchlorid.", "The number of ions is not part of the name, because the charges fix the ratio. CaCl₂ is simply calcium chloride."),
      ],
      ok: tr("Der Name besteht aus Metall, Wortstamm und der Endung -id – ohne Anzahl.", "The name consists of metal, word stem and the ending -ide – without numbers."),
    }),
    model({
      mode: "faded",
      ask: tr("Tippe die Teile für den Namen von K₂S der Reihe nach an.", "Tap the parts for the name of K₂S in order."),
      visual: c => <NameModel c={c} f="K2S" pieces={pK2S} sol={at(pK2S, ka, sulf, id3)} />,
      lines: [
        tr("Das Metall ist Kalium. Aus Schwefel wird der Stamm Sulf.", "The metal is potassium. Sulfur gives the stem sulf."),
        tr("Name: {?}", "Name: {?}"),
      ],
      answer: nm(pK2S, ka, sulf, id3),
      why: {
        ...noName(),
        [nm(pK2S, di3, ka, sulf, id3)]: tr("Bei Ionenverbindungen steht die Anzahl nicht im Namen – auch wenn die Formel K₂ zeigt.", "Names of ionic compounds have no numbers – even though the formula shows K₂."),
        [nm(pK2S, ka, schw, id3)]: tr("Bei Schwefel verwendet man den Stamm Sulf: Sulfid.", "For sulfur you use the stem sulf: sulfide."),
        [nm(pK2S, ka, schw)]: tr("Bei Schwefel verwendet man den Stamm Sulf und die Endung -id.", "For sulfur you use the stem sulf and the ending -ide."),
        [nm(pK2S, ka, sulf)]: tr("Es fehlt noch die Endung -id.", "The ending -ide is still missing."),
        [nm(pK2S, sulf, id3, ka)]: tr("Das Metall steht zuerst: erst Kalium, dann Sulfid.", "The metal comes first: potassium, then sulfide."),
      },
      tip: tr("Erst das Metall, dann der Wortstamm des Nichtmetalls, dann die Endung.", "First the metal, then the word stem of the non-metal, then the ending."),
      ok: tr("K₂S heißt Kaliumsulfid: Kalium + Sulf + id.", "K₂S is called potassium sulfide: potassium + sulf + ide."),
    }),
    model({
      mode: "free",
      ask: tr("Setze den Namen von CaF₂ zusammen.", "Put together the name of CaF₂."),
      visual: c => <NameModel c={c} f="CaF2" pieces={pCaF2} sol={at(pCaF2, ca, fl, id4)} />,
      answer: nm(pCaF2, ca, fl, id4),
      why: {
        ...noName(),
        [nm(pCaF2, ca, di4, fl, id4)]: tr("Bei Ionenverbindungen steht die Anzahl nicht im Namen – die 2 gibt es nur in der Formel.", "Names of ionic compounds have no numbers – the 2 only appears in the formula."),
        [nm(pCaF2, di4, ca, fl, id4)]: tr("Bei Ionenverbindungen steht die Anzahl nicht im Namen – die 2 gibt es nur in der Formel.", "Names of ionic compounds have no numbers – the 2 only appears in the formula."),
        [nm(pCaF2, ca, fl)]: tr("Es fehlt noch die Endung -id.", "The ending -ide is still missing."),
        [nm(pCaF2, fl, id4, ca)]: tr("Das Metall steht zuerst: erst Calcium, dann Fluorid.", "The metal comes first: calcium, then fluoride."),
        [nm(pCaF2, fl, ca)]: tr("Das Metall steht zuerst, und das Nichtmetall bekommt die Endung -id.", "The metal comes first, and the non-metal gets the ending -ide."),
      },
      tip: tr("Welches Element ist das Metall? Mit ihm beginnt der Name.", "Which element is the metal? The name starts with it."),
      ok: tr("CaF₂ heißt Calciumfluorid – ohne „di“.", "CaF₂ is called calcium fluoride – without “di”."),
    }),
    {
      mode: "free",
      ask: tr("Wie heißt MgBr₂?", "What is MgBr₂ called?"),
      visual: () => <StaticWall cat="Mg2+" an="Br-" nC={1} nA={2} />,
      options: [tr("Magnesiumbrom", "Magnesium bromine"), tr("Magnesiumdibromid", "Magnesium dibromide"), tr("Brommagnesium", "Bromine magnesium"), tr("Magnesiumbromid", "Magnesium bromide")],
      answer: tr("Magnesiumbromid", "Magnesium bromide"),
      why: {
        [tr("Magnesiumbrom", "Magnesium bromine")]: tr("Es fehlt die Endung: Das Nichtmetall bekommt die Endung -id.", "The ending is missing: the non-metal gets the ending -ide."),
        [tr("Magnesiumdibromid", "Magnesium dibromide")]: tr("Bei Ionenverbindungen steht die Anzahl nicht im Namen – die 2 gibt es nur in der Formel.", "Names of ionic compounds have no numbers – the 2 only appears in the formula."),
        [tr("Brommagnesium", "Bromine magnesium")]: tr("Das Metall steht zuerst, und das Nichtmetall bekommt die Endung -id.", "The metal comes first, and the non-metal gets the ending -ide."),
      },
      ok: tr("MgBr₂ heißt Magnesiumbromid: Magnesium + Brom + id.", "MgBr₂ is called magnesium bromide: magnesium + brom + ide."),
    },
    model({
      mode: "free",
      ask: tr("Setze den Namen von Na₂O zusammen.", "Put together the name of Na₂O."),
      visual: c => <NameModel c={c} f="Na2O" pieces={pNa2O} sol={at(pNa2O, na5, ox5, id5)} />,
      answer: nm(pNa2O, na5, ox5, id5),
      why: {
        ...noName(),
        [nm(pNa2O, na5, sauer5, id5)]: tr("Bei Sauerstoff verwendet man den Stamm Ox: Oxid.", "For oxygen you use the stem ox: oxide."),
        [nm(pNa2O, na5, sauer5)]: tr("Bei Sauerstoff verwendet man den Stamm Ox und die Endung -id.", "For oxygen you use the stem ox and the ending -ide."),
        [nm(pNa2O, di5, na5, ox5, id5)]: tr("Bei Ionenverbindungen steht die Anzahl nicht im Namen – die 2 gibt es nur in der Formel.", "Names of ionic compounds have no numbers – the 2 only appears in the formula."),
        [nm(pNa2O, na5, ox5)]: tr("Es fehlt noch die Endung -id.", "The ending -ide is still missing."),
        [nm(pNa2O, ox5, id5, na5)]: tr("Das Metall steht zuerst: erst Natrium, dann Oxid.", "The metal comes first: sodium, then oxide."),
      },
      tip: tr("O steht für Sauerstoff. Denk an den besonderen Wortstamm.", "O stands for oxygen. Think of the special word stem."),
      ok: tr("Na₂O heißt Natriumoxid: Natrium + Ox + id, ohne Anzahl.", "Na₂O is called sodium oxide: sodium + ox + ide, without numbers."),
    }),

    // ── 4 Von der Formel zum Namen und zurück ──
    model({
      mode: "worked", part: tr("Formel und Name", "Formula and name"),
      say: tr("Vom Namen zur Formel: Bestimme zuerst mit dem PSE die Ionen. Dann gleiche die Ladungen aus.", "From name to formula: first find the ions with the periodic table. Then balance the charges."),
      ask: tr("Welche Formel hat Aluminiumoxid?", "What is the formula of aluminium oxide?"),
      visual: c => <PickModel c={c} cat="Al" an="O" sol={[[3, -2], [2, 3]]} />,
      lines: [
        tr("Aluminium steht in der III. Hauptgruppe und bildet Al³⁺.", "Aluminium is in main group III and forms Al³⁺."),
        tr("Oxid kommt von Sauerstoff. Sauerstoff steht in der VI. Hauptgruppe und bildet O²⁻.", "Oxide comes from oxygen. Oxygen is in main group VI and forms O²⁻."),
        tr("Zwei Al³⁺ haben sechs positive Ladungen, drei O²⁻ sechs negative. Die Formel ist **Al₂O₃**.", "Two Al³⁺ have six positive charges, three O²⁻ six negative ones. The formula is **Al₂O₃**."),
      ],
      ok: tr("So geht es immer: Ionen bestimmen, Ladungen ausgleichen, Formel schreiben.", "It always works like this: find the ions, balance the charges, write the formula."),
    }),
    model({
      mode: "faded",
      ask: tr("Stelle für Calciumbromid die Ladungen ein und gleiche sie aus.", "Set the charges for calcium bromide and balance them."),
      visual: c => <PickModel c={c} cat="Ca" an="Br" sol={[[2, -1], [1, 2]]} />,
      lines: [
        tr("Calcium (II. Hauptgruppe) bildet Ca²⁺, Brom (VII. Hauptgruppe) bildet Br⁻.", "Calcium (main group II) forms Ca²⁺, bromine (main group VII) forms Br⁻."),
        tr("Formel von Calciumbromid: {?}", "Formula of calcium bromide: {?}"),
      ],
      answer: builtKey("Ca2+", "Br-", 1, 2),
      why: {
        ...noCharge(),
        "Ca⁺": tr("Calcium steht in der II. Hauptgruppe und gibt 2 Außenelektronen ab. Es bildet Ca²⁺.", "Calcium is in main group II and loses 2 outer electrons. It forms Ca²⁺."),
        "Ca³⁺": tr("Calcium hat nur 2 Außenelektronen (II. Hauptgruppe). Es bildet Ca²⁺.", "Calcium has only 2 outer electrons (main group II). It forms Ca²⁺."),
        "Br²⁻": tr("Brom steht in der VII. Hauptgruppe. Bis 8 fehlt nur ein Elektron, also bildet es Br⁻.", "Bromine is in main group VII. Only one electron is missing to make 8, so it forms Br⁻."),
        "Br³⁻": tr("Brom steht in der VII. Hauptgruppe. Bis 8 fehlt nur ein Elektron, also bildet es Br⁻.", "Bromine is in main group VII. Only one electron is missing to make 8, so it forms Br⁻."),
        [builtKey("Ca2+", "Br-", 1, 1)]: tr("Ein Ca²⁺ und ein Br⁻: Es fehlt noch eine negative Ladung.", "One Ca²⁺ and one Br⁻: one negative charge is still missing."),
        [builtKey("Ca2+", "Br-", 2, 4)]: tr("Das ist neutral, aber die Formel nennt das kleinste Verhältnis.", "That is neutral, but the formula gives the smallest ratio."),
      },
      tip: tr("Wähle zuerst die Ladungen wie in der ersten Zeile. Ergänze dann Ionen, bis sich die Ladungen ausgleichen.", "First choose the charges as in the first line. Then add ions until the charges balance."),
      ok: tr("Ein Ca²⁺ und zwei Br⁻ gleichen sich aus. Die Formel ist CaBr₂.", "One Ca²⁺ and two Br⁻ balance each other. The formula is CaBr₂."),
    }),
    model({
      mode: "free",
      ask: tr("Stelle Lithiumnitrid ein: erst die Ladungen, dann die Anzahlen.", "Set up lithium nitride: first the charges, then the numbers."),
      visual: c => <PickModel c={c} cat="Li" an="N" sol={[[1, -3], [3, 1]]} />,
      answer: builtKey("Li+", "N3-", 3, 1),
      why: {
        ...noCharge(),
        "Li²⁺": tr("Lithium steht in der I. Hauptgruppe und hat nur 1 Außenelektron. Es bildet Li⁺.", "Lithium is in main group I and has only 1 outer electron. It forms Li⁺."),
        "Li³⁺": tr("Lithium steht in der I. Hauptgruppe und hat nur 1 Außenelektron. Es bildet Li⁺.", "Lithium is in main group I and has only 1 outer electron. It forms Li⁺."),
        "N⁻": tr("Nitrid kommt von Stickstoff (V. Hauptgruppe). Bis 8 fehlen 3 Elektronen, also bildet es N³⁻.", "Nitride comes from nitrogen (main group V). 3 electrons are missing to make 8, so it forms N³⁻."),
        "N²⁻": tr("Nitrid kommt von Stickstoff (V. Hauptgruppe). Bis 8 fehlen 3 Elektronen, also bildet es N³⁻.", "Nitride comes from nitrogen (main group V). 3 electrons are missing to make 8, so it forms N³⁻."),
        [builtKey("Li+", "N3-", 1, 1)]: tr("Ein Li⁺ und ein N³⁻: Es fehlt noch positive Ladung.", "One Li⁺ and one N³⁻: positive charge is still missing."),
        [builtKey("Li+", "N3-", 2, 1)]: tr("Zwei Li⁺ gleichen erst zwei der drei negativen Ladungen aus.", "Two Li⁺ balance only two of the three negative charges."),
        [builtKey("Li+", "N3-", 1, 3)]: tr("Vertauscht: Drei N³⁻ hätten neun negative Ladungen. Nimm mehr Li⁺, nicht mehr N³⁻.", "Swapped: three N³⁻ would have nine negative charges. Take more Li⁺, not more N³⁻."),
      },
      tip: tr("Nitrid kommt von Stickstoff. Lies im PSE die Hauptgruppen ab.", "Nitride comes from nitrogen. Read the main groups in the periodic table."),
      ok: tr("Drei Li⁺ gleichen ein N³⁻ aus. Die Formel ist Li₃N.", "Three Li⁺ balance one N³⁻. The formula is Li₃N."),
    }),
    model({
      mode: "free",
      say: tr("Von der Formel zum Namen: Bestimme die Elemente und setze dann den Namen zusammen.", "From formula to name: identify the elements, then put the name together."),
      ask: tr("Wie heißt Mg₃N₂? Tippe die Teile an.", "What is Mg₃N₂ called? Tap the parts."),
      visual: c => <NameModel c={c} f="Mg3N2" pieces={pMg3N2} sol={at(pMg3N2, mg6, nitr, id6)} />,
      answer: nm(pMg3N2, mg6, nitr, id6),
      why: {
        ...noName(),
        [nm(pMg3N2, mg6, stick, id6)]: tr("Bei Stickstoff verwendet man den Stamm Nitr: Nitrid.", "For nitrogen you use the stem nitr: nitride."),
        [nm(pMg3N2, tri6, mg6, nitr, id6)]: tr("Bei Ionenverbindungen steht die Anzahl nicht im Namen – auch nicht bei Index 3.", "Names of ionic compounds have no numbers – not even for subscript 3."),
        [nm(pMg3N2, mg6, di6, nitr, id6)]: tr("Bei Ionenverbindungen steht die Anzahl nicht im Namen – auch nicht bei Index 2.", "Names of ionic compounds have no numbers – not even for subscript 2."),
        [nm(pMg3N2, mg6, nitr)]: tr("Es fehlt noch die Endung -id.", "The ending -ide is still missing."),
        [nm(pMg3N2, mg6, stick)]: tr("Bei Stickstoff verwendet man den Stamm Nitr und die Endung -id.", "For nitrogen you use the stem nitr and the ending -ide."),
        [nm(pMg3N2, nitr, id6, mg6)]: tr("Das Metall steht zuerst: erst Magnesium, dann Nitrid.", "The metal comes first: magnesium, then nitride."),
      },
      tip: tr("N steht für Stickstoff. Denk an den besonderen Wortstamm und die Endung.", "N stands for nitrogen. Think of the special word stem and the ending."),
      ok: tr("Mg₃N₂ heißt Magnesiumnitrid: Magnesium + Nitr + id, ohne Anzahl.", "Mg₃N₂ is called magnesium nitride: magnesium + nitr + ide, without numbers."),
    }),
    model({
      mode: "free",
      ask: tr("Stelle Aluminiumsulfid ein: erst die Ladungen, dann die Anzahlen.", "Set up aluminium sulfide: first the charges, then the numbers."),
      visual: c => <PickModel c={c} cat="Al" an="S" sol={[[3, -2], [2, 3]]} />,
      answer: builtKey("Al3+", "S2-", 2, 3),
      why: {
        ...noCharge(),
        "Al⁺": tr("Aluminium steht in der III. Hauptgruppe und gibt 3 Außenelektronen ab. Es bildet Al³⁺.", "Aluminium is in main group III and loses 3 outer electrons. It forms Al³⁺."),
        "Al²⁺": tr("Aluminium steht in der III. Hauptgruppe und gibt 3 Außenelektronen ab. Es bildet Al³⁺.", "Aluminium is in main group III and loses 3 outer electrons. It forms Al³⁺."),
        "S⁻": tr("Sulfid kommt von Schwefel (VI. Hauptgruppe). Bis 8 fehlen 2 Elektronen, also bildet es S²⁻.", "Sulfide comes from sulfur (main group VI). 2 electrons are missing to make 8, so it forms S²⁻."),
        "S³⁻": tr("Sulfid kommt von Schwefel (VI. Hauptgruppe). Bis 8 fehlen 2 Elektronen, also bildet es S²⁻.", "Sulfide comes from sulfur (main group VI). 2 electrons are missing to make 8, so it forms S²⁻."),
        [builtKey("Al3+", "S2-", 1, 1)]: tr("Ein Al³⁺ und ein S²⁻: drei positive, aber nur zwei negative Ladungen.", "One Al³⁺ and one S²⁻: three positive but only two negative charges."),
        [builtKey("Al3+", "S2-", 1, 2)]: tr("Ein Al³⁺ und zwei S²⁻: drei positive, aber vier negative Ladungen.", "One Al³⁺ and two S²⁻: three positive but four negative charges."),
        [builtKey("Al3+", "S2-", 2, 2)]: tr("Zwei Al³⁺ und zwei S²⁻: sechs positive, aber nur vier negative Ladungen.", "Two Al³⁺ and two S²⁻: six positive but only four negative charges."),
        [builtKey("Al3+", "S2-", 3, 2)]: tr("Drei Al³⁺ hätten neun positive Ladungen. Vertauscht? Das Al³⁺ hat die größere Ladung.", "Three Al³⁺ would have nine positive charges. Swapped? The Al³⁺ has the larger charge."),
      },
      tip: tr("Sulfid kommt von Schwefel. Lies im PSE die Hauptgruppen ab und gleiche dann aus.", "Sulfide comes from sulfur. Read the main groups in the periodic table, then balance."),
      ok: tr("Zwei Al³⁺ bringen sechs positive Ladungen, drei S²⁻ sechs negative. Die Formel ist Al₂S₃.", "Two Al³⁺ bring six positive charges, three S²⁻ six negative ones. The formula is Al₂S₃."),
    }),
    {
      mode: "free",
      ask: tr("Welche Zeile ist ganz richtig – Formel und Name?", "Which line is completely right – formula and name?"),
      options: [
        tr("Ca₂N₃ – Calciumnitrid", "Ca₂N₃ – calcium nitride"),
        tr("Ca₃N₂ – Calciumdinitrid", "Ca₃N₂ – calcium dinitride"),
        tr("Ca₃N₂ – Calciumnitrid", "Ca₃N₂ – calcium nitride"),
        tr("CaN – Calciumnitrid", "CaN – calcium nitride"),
      ],
      answer: tr("Ca₃N₂ – Calciumnitrid", "Ca₃N₂ – calcium nitride"),
      why: {
        [tr("Ca₂N₃ – Calciumnitrid", "Ca₂N₃ – calcium nitride")]: tr("Die Indizes sind vertauscht: Zwei Ca²⁺ und drei N³⁻ hätten vier positive, aber neun negative Ladungen.", "The subscripts are swapped: two Ca²⁺ and three N³⁻ would have four positive but nine negative charges."),
        [tr("Ca₃N₂ – Calciumdinitrid", "Ca₃N₂ – calcium dinitride")]: tr("Die Formel stimmt, aber im Namen steht keine Anzahl.", "The formula is right, but the name has no numbers."),
        [tr("CaN – Calciumnitrid", "CaN – calcium nitride")]: tr("Ein Ca²⁺ und ein N³⁻ haben zwei positive, aber drei negative Ladungen – das ist nicht neutral.", "One Ca²⁺ and one N³⁻ have two positive but three negative charges – that is not neutral."),
      },
      ok: tr("Drei Ca²⁺ bringen sechs positive Ladungen, zwei N³⁻ sechs negative. Ca₃N₂ heißt Calciumnitrid.", "Three Ca²⁺ bring six positive charges, two N³⁻ six negative ones. Ca₃N₂ is called calcium nitride."),
    },
  ];
  return list;
}

export const kapitel2 = (): Kapitel => ({
  id: "formel-name", nr: 2, stufe: "us",
  title: tr("Formel und Name", "Formula and name"),
  desc: tr("Ladungen ausgleichen, die Formel aufstellen und die Verbindung benennen.", "Balance charges, write the formula and name the compound."),
  def: {
    title: tr("Formel und Name", "Formula and name"),
    known: [
      tr("Ion", "ion"), tr("Kation", "cation"), "Anion", tr("Ladung", "charge"), tr("Außenelektronen", "outer electrons"),
      tr("Edelgaskonfiguration", "noble gas configuration"), tr("Metall", "metal"), tr("Nichtmetall", "non-metal"), tr("Hauptgruppe", "main group"),
      "Atom", tr("Elektron", "electron"), tr("Molekül", "molecule"), tr("Gemisch", "mixture"), "PSE",
    ],
    steps: steps(),
    outro: [
      tr("Die Ladungen von Kationen und Anionen ausgleichen, bis die Ionenverbindung neutral ist.", "Balance the charges of cations and anions until the ionic compound is neutral."),
      tr("Die Verhältnisformel aufstellen: Kation zuerst, Anzahl als Index, kleinstes Verhältnis.", "Write the empirical formula: cation first, number as subscript, smallest ratio."),
      tr("Ionenverbindungen benennen: Metall, Wortstamm und Endung -id, ohne Anzahl.", "Name ionic compounds: metal, word stem and ending -ide, without numbers."),
      tr("Vom Namen zur Formel und von der Formel zum Namen kommen.", "Go from name to formula and from formula to name."),
    ],
  },
  explain: [
    [
      tr("Eine **Ionenverbindung** besteht aus Kationen und Anionen. Insgesamt ist sie **neutral**.", "An **ionic compound** is made of cations and anions. Overall it is **neutral**."),
      tr("Die positiven und negativen Ladungen gleichen sich aus. Ein Barium-Ion Ba²⁺ hat zwei positive Ladungen – dazu gehören zwei F⁻ mit je einer negativen Ladung.", "The positive and negative charges balance each other. A barium ion Ba²⁺ has two positive charges – it goes with two F⁻, each with one negative charge."),
      tr("Es zählt die Ladung, nicht die Zahl der Ionen.", "What counts is the charge, not the number of ions."),
    ],
    [
      tr("**Verhältnisformel**: erst das Kation, dann das Anion, ohne Ladungen.", "**Empirical formula**: first the cation, then the anion, without charges."),
      tr("Die Anzahl steht als **Index** tiefgestellt hinter dem Symbol, eine 1 schreibt man nicht. Ein Ba²⁺ und zwei F⁻ ergeben BaF₂.", "The number is a lowered **subscript** after the symbol, a 1 is not written. One Ba²⁺ and two F⁻ give BaF₂."),
      tr("Die Formel nennt das kleinste Verhältnis (BaO, nicht Ba₂O₂). Sie beschreibt kein Molekül.", "The formula gives the smallest ratio (BaO, not Ba₂O₂). It does not describe a molecule."),
    ],
    [
      tr("Name: erst das Metall, dann der Wortstamm des Nichtmetalls mit der Endung **-id**. KI heißt Kaliumiodid.", "Name: first the metal, then the word stem of the non-metal with the ending **-ide**. KI is potassium iodide."),
      tr("Besondere Wortstämme: Sauerstoff wird zu Oxid, Schwefel zu Sulfid, Stickstoff zu Nitrid.", "Special word stems: oxygen becomes oxide, sulfur sulfide, nitrogen nitride."),
      tr("Bei Ionenverbindungen steht die Anzahl nicht im Namen: BaI₂ heißt Bariumiodid, nicht Bariumdiiodid.", "Names of ionic compounds have no numbers: BaI₂ is barium iodide, not barium diiodide."),
    ],
    [
      tr("Vom Namen zur Formel: die Ionen mit dem PSE bestimmen (die Hauptgruppe verrät die Ladung), die Ladungen ausgleichen, die Formel schreiben.", "From name to formula: find the ions with the periodic table (the main group gives the charge), balance the charges, write the formula."),
      tr("Von der Formel zum Namen: erst das Metall, dann der Wortstamm mit -id, ohne Anzahl.", "From formula to name: first the metal, then the word stem with -ide, without numbers."),
      tr("Beispiel Bariumoxid: Ba²⁺ und O²⁻ haben gleich viele Ladungen und gleichen sich 1 : 1 aus. Die Formel ist BaO.", "Example barium oxide: Ba²⁺ and O²⁻ carry the same number of charges and balance 1 : 1. The formula is BaO."),
    ],
  ],
});
