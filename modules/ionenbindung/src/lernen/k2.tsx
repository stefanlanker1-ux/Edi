// Kapitel 2: Formel und Name (Level I) – Ladungen in der Ionenwand ausgleichen, Verhältnisformel mit Index, Name mit -id, beide Richtungen.
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
      say: tr("Kochsalz besteht aus Na⁺ und Cl⁻. Ein Stoff aus Kationen und Anionen heißt **Ionenverbindung**.", "Table salt is made of Na⁺ and Cl⁻. A substance made of cations and anions is called an **ionic compound**."),
      ask: tr("Warum ist Kochsalz nach außen nicht geladen?", "Why is table salt not charged overall?"),
      visual: c => <WallModel c={c} cat="Na+" an="Cl-" start={[1, 1]} sol={[1, 1]} />,
      labels: tileLabels(),
      lines: [
        tr("Im Modell **Ionenwand** ist jeder Baustein so breit wie seine Ladung – nicht so groß wie das Ion.", "In the **ion wall** model each tile is as wide as its charge – not as big as the ion."),
        tr("Na⁺ ist 1 breit (1+), Cl⁻ ist 1 breit (1−).", "Na⁺ is 1 wide (1+), Cl⁻ is 1 wide (1−)."),
        tr("1 · (1+) = 1+ und 1 · (1−) = 1−: Beide Reihen sind gleich lang.", "1 · (1+) = 1+ and 1 · (1−) = 1−: both rows are the same length."),
      ],
      ok: tr("Gleich viel Plus wie Minus: Die Ionenverbindung ist **neutral**.", "As much plus as minus: the ionic compound is **neutral**."),
    }),
    model({
      mode: "worked",
      say: tr("Sind die Ladungen verschieden groß, braucht man vom schwächer geladenen Ion mehrere.", "If the charges differ in size, you need several of the ion with the smaller charge."),
      ask: tr("Wie viele Cl⁻ gleichen ein Ca²⁺ aus?", "How many Cl⁻ balance one Ca²⁺?"),
      visual: c => <WallModel c={c} cat="Ca2+" an="Cl-" start={[1, 2]} sol={[1, 2]} />,
      lines: [
        tr("Ca²⁺ ist 2 breit, Cl⁻ ist nur 1 breit.", "Ca²⁺ is 2 wide, Cl⁻ is only 1 wide."),
        tr("Mit 1 Cl⁻ bliebe unten eine Lücke: 2+, aber nur 1−.", "With 1 Cl⁻ there would be a gap below: 2+, but only 1−."),
        tr("2 Cl⁻: 2 · (1−) = 2− gleicht 1 · (2+) = 2+ aus.", "2 Cl⁻: 2 · (1−) = 2− balances 1 · (2+) = 2+."),
      ],
      ok: tr("1 Ca²⁺ und 2 Cl⁻: gleich lange Reihen, also neutral.", "1 Ca²⁺ and 2 Cl⁻: rows of equal length, so neutral."),
    }),
    model({
      mode: "faded",
      ask: tr("Ergänze: Baue mit den Knöpfen eine neutrale Wand aus Na⁺ und O²⁻ – mit möglichst wenigen Bausteinen. Dann prüfe.", "Complete: use the buttons to build a neutral wall of Na⁺ and O²⁻ – with as few tiles as possible. Then check."),
      visual: c => <WallModel c={c} cat="Na+" an="O2-" start={[1, 1]} sol={[2, 1]} />,
      lines: [
        tr("O²⁻ ist 2 breit, Na⁺ nur 1 breit.", "O²⁻ is 2 wide, Na⁺ only 1 wide."),
        tr("Neutral mit möglichst wenigen Bausteinen: {?}", "Neutral with as few tiles as possible: {?}"),
      ],
      answer: wallKey("Na+", "O2-", 2, 1),
      why: {
        [wallKey("Na+", "O2-", 1, 1)]: tr("1 · (1+) = 1+, aber 1 · (2−) = 2−. Die obere Reihe ist noch zu kurz.", "1 · (1+) = 1+, but 1 · (2−) = 2−. The top row is still too short."),
        [wallKey("Na+", "O2-", 1, 2)]: tr("2 · (2−) = 4−, aber nur 1+. Füge Na⁺ hinzu, nicht O²⁻.", "2 · (2−) = 4−, but only 1+. Add Na⁺, not O²⁻."),
        [wallKey("Na+", "O2-", 3, 1)]: tr("3 · (1+) = 3+ ist mehr als 2−. Jetzt ist oben zu viel.", "3 · (1+) = 3+ is more than 2−. Now there is too much on top."),
        [wallKey("Na+", "O2-", 4, 2)]: tr("Neutral – aber es geht mit der Hälfte der Bausteine.", "Neutral – but it works with half the tiles."),
      },
      tip: tr("Füge der kürzeren Reihe Bausteine hinzu, bis beide gleich lang sind.", "Add tiles to the shorter row until both are the same length."),
      ok: tr("2 · (1+) = 2+ und 1 · (2−) = 2−: neutral.", "2 · (1+) = 2+ and 1 · (2−) = 2−: neutral."),
    }),
    model({
      mode: "free",
      ask: tr("Jetzt du: Baue eine neutrale Wand aus Mg²⁺ und O²⁻ – mit möglichst wenigen Bausteinen.", "Your turn: build a neutral wall of Mg²⁺ and O²⁻ – with as few tiles as possible."),
      visual: c => <WallModel c={c} cat="Mg2+" an="O2-" start={[1, 2]} sol={[1, 1]} />,
      answer: wallKey("Mg2+", "O2-", 1, 1),
      why: {
        [wallKey("Mg2+", "O2-", 1, 2)]: tr("1 · (2+) = 2+, aber 2 · (2−) = 4−. Unten ist zu viel Minus.", "1 · (2+) = 2+, but 2 · (2−) = 4−. There is too much minus below."),
        [wallKey("Mg2+", "O2-", 2, 1)]: tr("2 · (2+) = 4+, aber 1 · (2−) = 2−. Oben ist zu viel Plus.", "2 · (2+) = 4+, but 1 · (2−) = 2−. There is too much plus on top."),
        [wallKey("Mg2+", "O2-", 2, 2)]: tr("Neutral – aber es geht mit der Hälfte der Bausteine.", "Neutral – but it works with half the tiles."),
      },
      tip: tr("Vergleiche, wie breit ein Mg²⁺ und ein O²⁻ sind.", "Compare how wide one Mg²⁺ and one O²⁻ are."),
      ok: tr("1 · (2+) = 2+ und 1 · (2−) = 2−: Gleich große Ladungen gleichen sich 1 : 1 aus.", "1 · (2+) = 2+ and 1 · (2−) = 2−: equal charges balance 1 : 1."),
    }),
    model({
      mode: "free",
      ask: tr("Baue eine neutrale Wand aus Al³⁺ und F⁻ – mit möglichst wenigen Bausteinen.", "Build a neutral wall of Al³⁺ and F⁻ – with as few tiles as possible."),
      visual: c => <WallModel c={c} cat="Al3+" an="F-" start={[1, 1]} sol={[1, 3]} />,
      answer: wallKey("Al3+", "F-", 1, 3),
      why: {
        [wallKey("Al3+", "F-", 1, 1)]: tr("1 · (3+) = 3+, aber 1 · (1−) = 1−. Unten fehlen noch Bausteine.", "1 · (3+) = 3+, but 1 · (1−) = 1−. Tiles are still missing below."),
        [wallKey("Al3+", "F-", 1, 2)]: tr("2 · (1−) = 2− ist weniger als 3+. Unten fehlt noch ein Baustein.", "2 · (1−) = 2− is less than 3+. One tile is still missing below."),
        [wallKey("Al3+", "F-", 1, 4)]: tr("4 · (1−) = 4− ist mehr als 3+.", "4 · (1−) = 4− is more than 3+."),
      },
      tip: tr("Wie breit ist ein Al³⁺? So lang muss die untere Reihe werden.", "How wide is one Al³⁺? The bottom row must become that long."),
      ok: tr("1 · (3+) = 3+ und 3 · (1−) = 3−: neutral.", "1 · (3+) = 3+ and 3 · (1−) = 3−: neutral."),
    }),
    model({
      mode: "free",
      say: tr("Manchmal braucht man von beiden Ionen mehrere.", "Sometimes you need several of both ions."),
      ask: tr("Baue eine neutrale Wand aus Al³⁺ und O²⁻ – mit möglichst wenigen Bausteinen.", "Build a neutral wall of Al³⁺ and O²⁻ – with as few tiles as possible."),
      visual: c => <WallModel c={c} cat="Al3+" an="O2-" start={[1, 1]} sol={[2, 3]} />,
      answer: wallKey("Al3+", "O2-", 2, 3),
      why: {
        [wallKey("Al3+", "O2-", 1, 1)]: tr("1 · (3+) = 3+, aber 1 · (2−) = 2−. Füge der kürzeren Reihe Bausteine hinzu.", "1 · (3+) = 3+, but 1 · (2−) = 2−. Add tiles to the shorter row."),
        [wallKey("Al3+", "O2-", 1, 2)]: tr("1 · (3+) = 3+, aber 2 · (2−) = 4−. Jetzt ist oben die Reihe kürzer.", "1 · (3+) = 3+, but 2 · (2−) = 4−. Now the top row is shorter."),
        [wallKey("Al3+", "O2-", 2, 2)]: tr("2 · (3+) = 6+, aber 2 · (2−) = 4−. Unten fehlt noch ein Baustein.", "2 · (3+) = 6+, but 2 · (2−) = 4−. One tile is still missing below."),
        [wallKey("Al3+", "O2-", 3, 2)]: tr("3 · (3+) = 9+, aber 2 · (2−) = 4−. Vertauscht? Al³⁺ ist der breitere Baustein.", "3 · (3+) = 9+, but 2 · (2−) = 4−. Swapped? Al³⁺ is the wider tile."),
      },
      tip: tr("Füge immer der kürzeren Reihe einen Baustein hinzu, bis beide gleich lang sind.", "Always add a tile to the shorter row until both are the same length."),
      ok: tr("2 · (3+) = 6+ und 3 · (2−) = 6−: neutral.", "2 · (3+) = 6+ and 3 · (2−) = 6−: neutral."),
    }),
    {
      mode: "free",
      ask: tr("Jemand sagt: „1 Ca²⁺ und 1 Cl⁻ sind neutral – ein Kation, ein Anion.“ Stimmt das?", "Someone says: “1 Ca²⁺ and 1 Cl⁻ are neutral – one cation, one anion.” Is that right?"),
      visual: () => <StaticWall cat="Ca2+" an="Cl-" nC={1} nA={1} calc={false} />,
      options: [
        tr("Ja: gleich viele Kationen wie Anionen", "Yes: as many cations as anions"),
        tr("Nein: 2+ und 1− – es bleibt 1+ übrig", "No: 2+ and 1− – 1+ is left over"),
        tr("Ja: Plus und Minus ziehen sich an", "Yes: plus and minus attract each other"),
        tr("Nein: Es fehlt noch ein Ca²⁺", "No: one more Ca²⁺ is missing"),
      ],
      answer: tr("Nein: 2+ und 1− – es bleibt 1+ übrig", "No: 2+ and 1− – 1+ is left over"),
      why: {
        [tr("Ja: gleich viele Kationen wie Anionen", "Yes: as many cations as anions")]: tr("Es zählt die Ladung, nicht die Zahl der Ionen: 1 · (2+) = 2+, aber 1 · (1−) = 1−.", "What counts is the charge, not the number of ions: 1 · (2+) = 2+, but 1 · (1−) = 1−."),
        [tr("Ja: Plus und Minus ziehen sich an", "Yes: plus and minus attract each other")]: tr("Anziehen tun sich alle Kationen und Anionen. Neutral ist es erst bei 2+ und 2−.", "All cations and anions attract each other. It is only neutral with 2+ and 2−."),
        [tr("Nein: Es fehlt noch ein Ca²⁺", "No: one more Ca²⁺ is missing")]: tr("Ein zweites Ca²⁺ gäbe 4+ – noch mehr Plus. Es fehlt ein Cl⁻.", "A second Ca²⁺ would give 4+ – even more plus. One Cl⁻ is missing."),
      },
      ok: tr("Neutral heißt gleich viel Ladung, nicht gleich viele Ionen: 2 Cl⁻ gleichen 1 Ca²⁺ aus.", "Neutral means equal charge, not equal numbers of ions: 2 Cl⁻ balance 1 Ca²⁺."),
    },

    // ── 2 Die Formel ──
    model({
      mode: "worked", part: tr("Die Formel", "The formula"),
      say: tr("Die **Verhältnisformel** sagt kurz, welche Ionen in welchem Anzahlverhältnis vorkommen.", "The **formula** of an ionic compound gives the ions in their simplest number ratio."),
      ask: tr("Wie schreibt man die Formel für 1 Ca²⁺ und 2 Cl⁻?", "How do you write the formula for 1 Ca²⁺ and 2 Cl⁻?"),
      visual: c => <FormulaModel c={c} cat="Ca2+" an="Cl-" start={[1, 2]} sol={[1, 2]} />,
      labels: [{ at: ".k2-idx", text: tr("Index", "Subscript"), side: "right", point: "right" }],
      lines: [
        tr("Das Kation steht zuerst, dann das Anion: Ca, dann Cl. Ladungen schreibt man nicht.", "The cation comes first, then the anion: Ca, then Cl. Charges are not written."),
        tr("Die Anzahl steht klein und tief hinter dem Symbol: der **Index**.", "The number is written small and low after the symbol: the **subscript**."),
        tr("Eine 1 schreibt man nicht → **CaCl₂**.", "A 1 is not written → **CaCl₂**."),
      ],
      ok: tr("CaCl₂ heißt: auf 1 Ca²⁺ kommen 2 Cl⁻.", "CaCl₂ means: 2 Cl⁻ for every Ca²⁺."),
    }),
    model({
      mode: "faded",
      ask: tr("Ergänze: Stelle die Indizes für die Verbindung aus K⁺ und S²⁻ ein. Die Wand zeigt, was deine Formel bedeutet.", "Complete: set the subscripts for the compound of K⁺ and S²⁻. The wall shows what your formula means."),
      visual: c => <FormulaModel c={c} cat="K+" an="S2-" start={[1, 1]} sol={[2, 1]} />,
      lines: [
        tr("S²⁻ ist 2 breit, K⁺ ist 1 breit: 2 K⁺ gleichen 1 S²⁻ aus.", "S²⁻ is 2 wide, K⁺ is 1 wide: 2 K⁺ balance 1 S²⁻."),
        tr("Formel mit Index: {?}", "Formula with subscript: {?}"),
      ],
      answer: formulaKey("K+", "S2-", 2, 1),
      why: {
        [formulaKey("K+", "S2-", 1, 1)]: tr("KS bedeutet 1 K⁺ und 1 S²⁻: 1+, aber 2−.", "KS means 1 K⁺ and 1 S²⁻: 1+, but 2−."),
        [formulaKey("K+", "S2-", 1, 2)]: tr("Die 2 gehört zum K: 2 K⁺ für 1 S²⁻.", "The 2 belongs to K: 2 K⁺ for 1 S²⁻."),
        [formulaKey("K+", "S2-", 3, 1)]: tr("3 · (1+) = 3+ ist mehr als 2−.", "3 · (1+) = 3+ is more than 2−."),
        [formulaKey("K+", "S2-", 2, 1, true)]: tr("Die Anzahl stimmt, aber das Kation steht zuerst: erst K, dann S.", "The numbers are right, but the cation comes first: K, then S."),
      },
      tip: tr("Der Index steht hinter dem Symbol, von dem man mehrere braucht.", "The subscript goes after the symbol you need several of."),
      ok: tr("2 · (1+) = 2+ und 1 · (2−) = 2− → K₂S: Index 2 beim K.", "2 · (1+) = 2+ and 1 · (2−) = 2− → K₂S: subscript 2 on K."),
    }),
    model({
      mode: "free",
      say: tr("Jetzt baust du die Formel selbst: Stelle die Indizes ein.", "Now you build the formula yourself: set the subscripts."),
      ask: tr("Baue die Formel der Verbindung aus Al³⁺ und F⁻. Die Wand darunter zeigt, was deine Formel bedeutet.", "Build the formula of the compound of Al³⁺ and F⁻. The wall below shows what your formula means."),
      visual: c => <FormulaModel c={c} cat="Al3+" an="F-" start={[1, 1]} sol={[1, 3]} />,
      answer: formulaKey("Al3+", "F-", 1, 3),
      why: {
        [formulaKey("Al3+", "F-", 1, 1)]: tr("AlF bedeutet 1 Al³⁺ und 1 F⁻: 3+, aber nur 1−.", "AlF means 1 Al³⁺ and 1 F⁻: 3+, but only 1−."),
        [formulaKey("Al3+", "F-", 1, 2)]: tr("2 · (1−) = 2− reicht nicht für 3+.", "2 · (1−) = 2− is not enough for 3+."),
        [formulaKey("Al3+", "F-", 3, 1)]: tr("Die 3 steht beim falschen Symbol: 3 · (3+) = 9+, aber 1 · (1−) = 1−.", "The 3 is on the wrong symbol: 3 · (3+) = 9+, but 1 · (1−) = 1−."),
        [formulaKey("Al3+", "F-", 1, 3, true)]: tr("Die Anzahl stimmt, aber das Kation steht zuerst: erst Al, dann F.", "The numbers are right, but the cation comes first: Al, then F."),
      },
      tip: tr("Der Index sagt, wie viele Ionen man braucht. Schau, ob die Wand gleich lange Reihen hat.", "The subscript says how many ions you need. Check whether the wall has rows of equal length."),
      ok: tr("1 · (3+) = 3+ und 3 · (1−) = 3− → AlF₃: Index 3 beim F.", "1 · (3+) = 3+ and 3 · (1−) = 3− → AlF₃: subscript 3 on F."),
    }),
    {
      mode: "free",
      ask: tr("Welche Formel passt zu dieser Wand aus Mg²⁺ und Cl⁻?", "Which formula fits this wall of Mg²⁺ and Cl⁻?"),
      visual: () => <StaticWall cat="Mg2+" an="Cl-" nC={1} nA={2} />,
      options: ["Mg₂Cl", "MgCl²", "MgCl₂", "Mg²⁺Cl₂⁻"],
      answer: "MgCl₂",
      why: {
        "Mg₂Cl": tr("Die 2 gehört zum Cl: Es sind 2 Cl⁻, aber nur 1 Mg²⁺.", "The 2 belongs to Cl: there are 2 Cl⁻ but only 1 Mg²⁺."),
        "MgCl²": tr("Hochgestellt steht die Ladung. Die Anzahl steht tief: als Index.", "A raised number is a charge. The number of ions is written low: as a subscript."),
        "Mg²⁺Cl₂⁻": tr("In der Verhältnisformel stehen keine Ladungen. Sie gleichen sich ja aus.", "There are no charges in the formula. They balance each other anyway."),
      },
      ok: tr("1 Mg²⁺ und 2 Cl⁻ → MgCl₂: Index 2 tief beim Cl, die 1 fällt weg.", "1 Mg²⁺ and 2 Cl⁻ → MgCl₂: subscript 2 low on Cl, the 1 is left out."),
    },
    model({
      mode: "free",
      say: tr("Die Formel nennt immer das **kleinste** Verhältnis.", "The formula always gives the **smallest** ratio."),
      ask: tr("Jemand schreibt Mg₂O₂ für die Verbindung aus Mg²⁺ und O²⁻. Verbessere die Formel und prüfe.", "Someone writes Mg₂O₂ for the compound of Mg²⁺ and O²⁻. Correct the formula and check."),
      visual: c => <FormulaModel c={c} cat="Mg2+" an="O2-" start={[2, 2]} sol={[1, 1]} />,
      answer: formulaKey("Mg2+", "O2-", 1, 1),
      why: {
        [formulaKey("Mg2+", "O2-", 2, 2)]: tr("Neutral, aber nicht das kleinste Verhältnis: 2 : 2 ist dasselbe wie 1 : 1.", "Neutral, but not the smallest ratio: 2 : 2 is the same as 1 : 1."),
        [formulaKey("Mg2+", "O2-", 1, 2)]: tr("1 · (2+) = 2+, aber 2 · (2−) = 4−.", "1 · (2+) = 2+, but 2 · (2−) = 4−."),
        [formulaKey("Mg2+", "O2-", 2, 1)]: tr("2 · (2+) = 4+, aber 1 · (2−) = 2−.", "2 · (2+) = 4+, but 1 · (2−) = 2−."),
        [formulaKey("Mg2+", "O2-", 1, 1, true)]: tr("Das Kation steht zuerst: erst Mg, dann O.", "The cation comes first: Mg, then O."),
      },
      tip: tr("Teile beide Indizes durch dieselbe Zahl, solange es geht.", "Divide both subscripts by the same number as long as you can."),
      ok: tr("Mg²⁺ und O²⁻ gleichen sich 1 : 1 aus → MgO, nicht Mg₂O₂.", "Mg²⁺ and O²⁻ balance 1 : 1 → MgO, not Mg₂O₂."),
    }),
    {
      mode: "free",
      say: tr("Ein Kochsalzkorn besteht aus sehr vielen Na⁺ und Cl⁻, abwechselnd nebeneinander.", "A grain of salt consists of very many Na⁺ and Cl⁻, side by side in turn."),
      ask: tr("Was sagt die Formel NaCl über Kochsalz?", "What does the formula NaCl tell you about table salt?"),
      visual: () => <Crystal />,
      options: [
        tr("Es besteht aus NaCl-Molekülen", "It is made of NaCl molecules"),
        tr("Natrium und Chlor sind gemischt", "Sodium and chlorine are mixed"),
        tr("Auf 1 Na⁺ kommt 1 Cl⁻", "There is 1 Cl⁻ for every Na⁺"),
      ],
      answer: tr("Auf 1 Na⁺ kommt 1 Cl⁻", "There is 1 Cl⁻ for every Na⁺"),
      why: {
        [tr("Es besteht aus NaCl-Molekülen", "It is made of NaCl molecules")]: tr("Es gibt keine einzelnen NaCl-Teilchen. Jedes Ion hat ringsum mehrere Nachbarn mit anderer Ladung.", "There are no single NaCl particles. Each ion has several neighbours of opposite charge all around."),
        [tr("Natrium und Chlor sind gemischt", "Sodium and chlorine are mixed")]: tr("Ein Gemisch enthielte die Stoffe Natrium und Chlor. Kochsalz besteht aus Ionen – ein neuer Stoff.", "A mixture would contain the substances sodium and chlorine. Table salt is made of ions – a new substance."),
      },
      ok: tr("Die Formel nennt nur das Verhältnis: NaCl = 1 Na⁺ auf 1 Cl⁻, bei unzählig vielen Ionen.", "The formula only gives the ratio: NaCl = 1 Cl⁻ for every Na⁺, among countless ions."),
    },

    // ── 3 Der Name ──
    model({
      mode: "worked", part: tr("Der Name", "The name"),
      say: tr("Der Name hat zwei Teile: zuerst das Metall, dann das Nichtmetall mit der Endung **-id**.", "The name has two parts: first the metal, then the non-metal with the ending **-ide**."),
      ask: tr("Wie heißt NaCl?", "What is NaCl called?"),
      visual: c => <NameModel c={c} f="NaCl" pieces={pNaCl} sol={at(pNaCl, na, cl, id1)} />,
      lines: [
        tr("Metall zuerst: Natrium.", "Metal first: sodium."),
        tr("Nichtmetall Chlor + Endung -id → chlorid.", "Non-metal chlor + ending -ide → chloride."),
        tr("→ **Natriumchlorid**. Genauso: Fluorid, **Bromid**, Iodid.", "→ **sodium chloride**. In the same way: fluoride, **bromide**, iodide."),
      ],
      ok: tr("Natrium + chlor + id = Natriumchlorid.", "Sodium + chlor + ide = sodium chloride."),
    }),
    model({
      mode: "worked",
      say: tr("Bei Sauerstoff, Schwefel und Stickstoff nimmt man einen anderen Wortstamm.", "For oxygen, sulfur and nitrogen you use a different word stem."),
      ask: tr("Wie heißt MgO?", "What is MgO called?"),
      visual: c => <NameModel c={c} f="MgO" pieces={pMgO} sol={at(pMgO, mg, ox, id2)} />,
      lines: [
        tr("Sauerstoff O → **Oxid**, Schwefel S → **Sulfid**, Stickstoff N → **Nitrid**.", "Oxygen O → **oxide**, sulfur S → **sulfide**, nitrogen N → **nitride**."),
        tr("MgO: Magnesium, dann Ox + id → **Magnesiumoxid**.", "MgO: magnesium, then ox + ide → **magnesium oxide**."),
        tr("Bei Ionenverbindungen lässt man die Anzahl im Namen weg – die Ladungen legen das Verhältnis fest. CaCl₂ heißt Calciumchlorid.", "For ionic compounds the numbers are left out of the name – the charges fix the ratio. CaCl₂ is calcium chloride."),
      ],
      ok: tr("Name = Metall + Wortstamm + -id, ohne Anzahl.", "Name = metal + word stem + -ide, without numbers."),
    }),
    model({
      mode: "faded",
      ask: tr("Ergänze: Tippe die Teile für den Namen von K₂S der Reihe nach an. Dann prüfe.", "Complete: tap the parts for the name of K₂S in order. Then check."),
      visual: c => <NameModel c={c} f="K2S" pieces={pK2S} sol={at(pK2S, ka, sulf, id3)} />,
      lines: [
        tr("Metall: Kalium. S = Schwefel → Stamm Sulf.", "Metal: potassium. S = sulfur → stem sulf."),
        tr("Name: {?}", "Name: {?}"),
      ],
      answer: nm(pK2S, ka, sulf, id3),
      why: {
        ...noName(),
        [nm(pK2S, di3, ka, sulf, id3)]: tr("Bei Ionenverbindungen steht keine Anzahl im Namen – auch wenn die Formel K₂ zeigt.", "Names of ionic compounds have no numbers – even though the formula shows K₂."),
        [nm(pK2S, ka, schw, id3)]: tr("Bei Schwefel nimmt man den Stamm Sulf: Sulfid.", "For sulfur you use the stem sulf: sulfide."),
        [nm(pK2S, ka, schw)]: tr("Bei Schwefel nimmt man den Stamm Sulf und die Endung -id.", "For sulfur you use the stem sulf and the ending -ide."),
        [nm(pK2S, ka, sulf)]: tr("Es fehlt die Endung -id.", "The ending -ide is missing."),
        [nm(pK2S, sulf, id3, ka)]: tr("Das Metall steht zuerst: erst Kalium, dann Sulfid.", "The metal comes first: potassium, then sulfide."),
      },
      tip: tr("Erst das Metall, dann der Stamm des Nichtmetalls, dann die Endung.", "First the metal, then the stem of the non-metal, then the ending."),
      ok: tr("K₂S heißt Kaliumsulfid: Kalium + Sulf + id.", "K₂S is called potassium sulfide: potassium + sulf + ide."),
    }),
    model({
      mode: "free",
      ask: tr("Jetzt du: Setze den Namen von CaF₂ zusammen.", "Your turn: put together the name of CaF₂."),
      visual: c => <NameModel c={c} f="CaF2" pieces={pCaF2} sol={at(pCaF2, ca, fl, id4)} />,
      answer: nm(pCaF2, ca, fl, id4),
      why: {
        ...noName(),
        [nm(pCaF2, ca, di4, fl, id4)]: tr("Bei Ionenverbindungen steht keine Anzahl im Namen – die 2 steht nur in der Formel.", "Names of ionic compounds have no numbers – the 2 is only in the formula."),
        [nm(pCaF2, di4, ca, fl, id4)]: tr("Bei Ionenverbindungen steht keine Anzahl im Namen – die 2 steht nur in der Formel.", "Names of ionic compounds have no numbers – the 2 is only in the formula."),
        [nm(pCaF2, ca, fl)]: tr("Es fehlt die Endung -id.", "The ending -ide is missing."),
        [nm(pCaF2, fl, id4, ca)]: tr("Das Metall steht zuerst: erst Calcium, dann Fluorid.", "The metal comes first: calcium, then fluoride."),
        [nm(pCaF2, fl, ca)]: tr("Das Metall steht zuerst, und das Nichtmetall bekommt -id.", "The metal comes first, and the non-metal gets -ide."),
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
        [tr("Magnesiumbrom", "Magnesium bromine")]: tr("Es fehlt die Endung: Das Nichtmetall-Ion endet auf -id.", "The ending is missing: the non-metal ion ends in -ide."),
        [tr("Magnesiumdibromid", "Magnesium dibromide")]: tr("Bei Ionenverbindungen steht keine Anzahl im Namen – die 2 steht nur in der Formel.", "Names of ionic compounds have no numbers – the 2 is only in the formula."),
        [tr("Brommagnesium", "Bromine magnesium")]: tr("Das Metall steht zuerst, das Nichtmetall bekommt -id.", "The metal comes first, the non-metal gets -ide."),
      },
      ok: tr("MgBr₂ heißt Magnesiumbromid: Metall + Brom + id.", "MgBr₂ is called magnesium bromide: metal + brom + ide."),
    },
    model({
      mode: "free",
      ask: tr("Setze den Namen von Na₂O zusammen.", "Put together the name of Na₂O."),
      visual: c => <NameModel c={c} f="Na2O" pieces={pNa2O} sol={at(pNa2O, na5, ox5, id5)} />,
      answer: nm(pNa2O, na5, ox5, id5),
      why: {
        ...noName(),
        [nm(pNa2O, na5, sauer5, id5)]: tr("Bei Sauerstoff nimmt man den Stamm Ox: Oxid.", "For oxygen you use the stem ox: oxide."),
        [nm(pNa2O, na5, sauer5)]: tr("Bei Sauerstoff nimmt man den Stamm Ox und die Endung -id.", "For oxygen you use the stem ox and the ending -ide."),
        [nm(pNa2O, di5, na5, ox5, id5)]: tr("Bei Ionenverbindungen steht keine Anzahl im Namen – die 2 steht nur in der Formel.", "Names of ionic compounds have no numbers – the 2 is only in the formula."),
        [nm(pNa2O, na5, ox5)]: tr("Es fehlt die Endung -id.", "The ending -ide is missing."),
        [nm(pNa2O, ox5, id5, na5)]: tr("Das Metall steht zuerst: erst Natrium, dann Oxid.", "The metal comes first: sodium, then oxide."),
      },
      tip: tr("O ist Sauerstoff. Denk an den besonderen Wortstamm.", "O is oxygen. Think of the special word stem."),
      ok: tr("Na₂O heißt Natriumoxid: Natrium + Ox + id, ohne Anzahl.", "Na₂O is called sodium oxide: sodium + ox + ide, without numbers."),
    }),

    // ── 4 Von der Formel zum Namen und zurück ──
    model({
      mode: "worked", part: tr("Formel und Name", "Formula and name"),
      say: tr("Vom Namen zur Formel: Bestimme zuerst die Ionen mit dem PSE. Dann gleiche aus.", "From name to formula: first find the ions with the periodic table. Then balance."),
      ask: tr("Welche Formel hat Aluminiumoxid?", "What is the formula of aluminium oxide?"),
      visual: c => <PickModel c={c} cat="Al" an="O" sol={[[3, -2], [2, 3]]} />,
      lines: [
        tr("Aluminium: III. Hauptgruppe → gibt 3 Elektronen ab → Al³⁺.", "Aluminium: main group III → loses 3 electrons → Al³⁺."),
        tr("Oxid kommt von Sauerstoff: VI. Hauptgruppe → nimmt 2 auf → O²⁻.", "Oxide comes from oxygen: main group VI → gains 2 → O²⁻."),
        tr("Ausgleichen: 2 · (3+) = 6+ und 3 · (2−) = 6− → **Al₂O₃**.", "Balance: 2 · (3+) = 6+ and 3 · (2−) = 6− → **Al₂O₃**."),
      ],
      ok: tr("Name → Ionen → ausgleichen → Formel.", "Name → ions → balance → formula."),
    }),
    model({
      mode: "faded",
      ask: tr("Ergänze für Calciumbromid: Stelle die Ladungen ein und gleiche aus. Dann prüfe.", "Complete for calcium bromide: set the charges and balance. Then check."),
      visual: c => <PickModel c={c} cat="Ca" an="Br" sol={[[2, -1], [1, 2]]} />,
      lines: [
        tr("Calcium: II. Hauptgruppe → Ca²⁺. Brom: VII. Hauptgruppe → Br⁻.", "Calcium: main group II → Ca²⁺. Bromine: main group VII → Br⁻."),
        tr("Formel von Calciumbromid: {?}", "Formula of calcium bromide: {?}"),
      ],
      answer: builtKey("Ca2+", "Br-", 1, 2),
      why: {
        ...noCharge(),
        "Ca⁺": tr("Calcium steht in der II. Hauptgruppe: 2 Außenelektronen abgeben → Ca²⁺.", "Calcium is in main group II: lose 2 outer electrons → Ca²⁺."),
        "Ca³⁺": tr("Calcium hat nur 2 Außenelektronen (II. Hauptgruppe) → Ca²⁺.", "Calcium has only 2 outer electrons (main group II) → Ca²⁺."),
        "Br²⁻": tr("Brom steht in der VII. Hauptgruppe: 8 − 7 = 1 aufnehmen → Br⁻.", "Bromine is in main group VII: 8 − 7 = 1 gained → Br⁻."),
        "Br³⁻": tr("Brom steht in der VII. Hauptgruppe: 8 − 7 = 1 aufnehmen → Br⁻.", "Bromine is in main group VII: 8 − 7 = 1 gained → Br⁻."),
        [builtKey("Ca2+", "Br-", 1, 1)]: tr("1 · (2+) = 2+, aber 1 · (1−) = 1−: noch nicht neutral.", "1 · (2+) = 2+, but 1 · (1−) = 1−: not neutral yet."),
        [builtKey("Ca2+", "Br-", 2, 4)]: tr("Neutral – aber die Formel nennt das kleinste Verhältnis.", "Neutral – but the formula gives the smallest ratio."),
      },
      tip: tr("Erst die Ladungen wie in der ersten Zeile wählen, dann der kürzeren Reihe Bausteine hinzufügen.", "First choose the charges as in the first line, then add tiles to the shorter row."),
      ok: tr("1 · (2+) = 2+ und 2 · (1−) = 2− → CaBr₂.", "1 · (2+) = 2+ and 2 · (1−) = 2− → CaBr₂."),
    }),
    model({
      mode: "free",
      ask: tr("Jetzt du: Baue Lithiumnitrid. Stelle Ladungen und Anzahlen ein.", "Your turn: build lithium nitride. Set the charges and numbers."),
      visual: c => <PickModel c={c} cat="Li" an="N" sol={[[1, -3], [3, 1]]} />,
      answer: builtKey("Li+", "N3-", 3, 1),
      why: {
        ...noCharge(),
        "Li²⁺": tr("Lithium steht in der I. Hauptgruppe: nur 1 Außenelektron → Li⁺.", "Lithium is in main group I: only 1 outer electron → Li⁺."),
        "Li³⁺": tr("Lithium steht in der I. Hauptgruppe: nur 1 Außenelektron → Li⁺.", "Lithium is in main group I: only 1 outer electron → Li⁺."),
        "N⁻": tr("Nitrid kommt von Stickstoff, V. Hauptgruppe: 8 − 5 = 3 aufnehmen → N³⁻.", "Nitride comes from nitrogen, main group V: 8 − 5 = 3 gained → N³⁻."),
        "N²⁻": tr("Nitrid kommt von Stickstoff, V. Hauptgruppe: 8 − 5 = 3 aufnehmen → N³⁻.", "Nitride comes from nitrogen, main group V: 8 − 5 = 3 gained → N³⁻."),
        [builtKey("Li+", "N3-", 1, 1)]: tr("1 · (1+) = 1+, aber 1 · (3−) = 3−: noch nicht neutral.", "1 · (1+) = 1+, but 1 · (3−) = 3−: not neutral yet."),
        [builtKey("Li+", "N3-", 2, 1)]: tr("2 · (1+) = 2+, aber 1 · (3−) = 3−: oben fehlt noch ein Baustein.", "2 · (1+) = 2+, but 1 · (3−) = 3−: one tile is still missing on top."),
        [builtKey("Li+", "N3-", 1, 3)]: tr("Vertauscht: 3 · (3−) = 9−. Nimm mehr Li⁺, nicht mehr N³⁻.", "Swapped: 3 · (3−) = 9−. Take more Li⁺, not more N³⁻."),
      },
      tip: tr("Nitrid kommt von Stickstoff. Lies im PSE die Hauptgruppen ab.", "Nitride comes from nitrogen. Read the main groups in the periodic table."),
      ok: tr("Li⁺ und N³⁻: 3 · (1+) = 3+ und 1 · (3−) = 3− → Li₃N.", "Li⁺ and N³⁻: 3 · (1+) = 3+ and 1 · (3−) = 3− → Li₃N."),
    }),
    model({
      mode: "free",
      say: tr("Von der Formel zum Namen: Bestimme die Elemente, dann setze den Namen zusammen.", "From formula to name: identify the elements, then put the name together."),
      ask: tr("Wie heißt Mg₃N₂? Tippe die Teile an.", "What is Mg₃N₂ called? Tap the parts."),
      visual: c => <NameModel c={c} f="Mg3N2" pieces={pMg3N2} sol={at(pMg3N2, mg6, nitr, id6)} />,
      answer: nm(pMg3N2, mg6, nitr, id6),
      why: {
        ...noName(),
        [nm(pMg3N2, mg6, stick, id6)]: tr("Bei Stickstoff nimmt man den Stamm Nitr: Nitrid.", "For nitrogen you use the stem nitr: nitride."),
        [nm(pMg3N2, tri6, mg6, nitr, id6)]: tr("Bei Ionenverbindungen steht keine Anzahl im Namen – auch nicht bei Index 3.", "Names of ionic compounds have no numbers – not even for subscript 3."),
        [nm(pMg3N2, mg6, di6, nitr, id6)]: tr("Bei Ionenverbindungen steht keine Anzahl im Namen – auch nicht bei Index 2.", "Names of ionic compounds have no numbers – not even for subscript 2."),
        [nm(pMg3N2, mg6, nitr)]: tr("Es fehlt die Endung -id.", "The ending -ide is missing."),
        [nm(pMg3N2, mg6, stick)]: tr("Bei Stickstoff nimmt man den Stamm Nitr und die Endung -id.", "For nitrogen you use the stem nitr and the ending -ide."),
        [nm(pMg3N2, nitr, id6, mg6)]: tr("Das Metall steht zuerst: erst Magnesium, dann Nitrid.", "The metal comes first: magnesium, then nitride."),
      },
      tip: tr("N ist Stickstoff. Denk an den besonderen Wortstamm und die Endung.", "N is nitrogen. Think of the special word stem and the ending."),
      ok: tr("Mg₃N₂ heißt Magnesiumnitrid: Magnesium + Nitr + id, ohne Anzahl.", "Mg₃N₂ is called magnesium nitride: magnesium + nitr + ide, without numbers."),
    }),
    model({
      mode: "free",
      ask: tr("Baue Aluminiumsulfid: Stelle Ladungen und Anzahlen ein.", "Build aluminium sulfide: set the charges and numbers."),
      visual: c => <PickModel c={c} cat="Al" an="S" sol={[[3, -2], [2, 3]]} />,
      answer: builtKey("Al3+", "S2-", 2, 3),
      why: {
        ...noCharge(),
        "Al⁺": tr("Aluminium steht in der III. Hauptgruppe: 3 Außenelektronen abgeben → Al³⁺.", "Aluminium is in main group III: lose 3 outer electrons → Al³⁺."),
        "Al²⁺": tr("Aluminium steht in der III. Hauptgruppe: 3 Außenelektronen abgeben → Al³⁺.", "Aluminium is in main group III: lose 3 outer electrons → Al³⁺."),
        "S⁻": tr("Sulfid kommt von Schwefel, VI. Hauptgruppe: 8 − 6 = 2 aufnehmen → S²⁻.", "Sulfide comes from sulfur, main group VI: 8 − 6 = 2 gained → S²⁻."),
        "S³⁻": tr("Sulfid kommt von Schwefel, VI. Hauptgruppe: 8 − 6 = 2 aufnehmen → S²⁻.", "Sulfide comes from sulfur, main group VI: 8 − 6 = 2 gained → S²⁻."),
        [builtKey("Al3+", "S2-", 1, 1)]: tr("1 · (3+) = 3+, aber 1 · (2−) = 2−: noch nicht neutral.", "1 · (3+) = 3+, but 1 · (2−) = 2−: not neutral yet."),
        [builtKey("Al3+", "S2-", 1, 2)]: tr("1 · (3+) = 3+, aber 2 · (2−) = 4−: Oben ist die Reihe kürzer.", "1 · (3+) = 3+, but 2 · (2−) = 4−: the top row is shorter."),
        [builtKey("Al3+", "S2-", 2, 2)]: tr("2 · (3+) = 6+, aber 2 · (2−) = 4−: Unten fehlt noch ein Baustein.", "2 · (3+) = 6+, but 2 · (2−) = 4−: one tile is still missing below."),
        [builtKey("Al3+", "S2-", 3, 2)]: tr("3 · (3+) = 9+, aber 2 · (2−) = 4−. Vertauscht? Al³⁺ ist der breitere Baustein.", "3 · (3+) = 9+, but 2 · (2−) = 4−. Swapped? Al³⁺ is the wider tile."),
      },
      tip: tr("Sulfid kommt von Schwefel. Lies im PSE die Hauptgruppen ab, dann gleiche aus.", "Sulfide comes from sulfur. Read the main groups in the periodic table, then balance."),
      ok: tr("Al³⁺ und S²⁻: 2 · (3+) = 6+ und 3 · (2−) = 6− → Al₂S₃.", "Al³⁺ and S²⁻: 2 · (3+) = 6+ and 3 · (2−) = 6− → Al₂S₃."),
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
        [tr("Ca₂N₃ – Calciumnitrid", "Ca₂N₃ – calcium nitride")]: tr("Die Indizes sind vertauscht: 2 · (2+) = 4+, aber 3 · (3−) = 9−.", "The subscripts are swapped: 2 · (2+) = 4+, but 3 · (3−) = 9−."),
        [tr("Ca₃N₂ – Calciumdinitrid", "Ca₃N₂ – calcium dinitride")]: tr("Die Formel stimmt, aber im Namen steht keine Anzahl.", "The formula is right, but the name has no numbers."),
        [tr("CaN – Calciumnitrid", "CaN – calcium nitride")]: tr("1 · (2+) = 2+, aber 1 · (3−) = 3−: nicht neutral.", "1 · (2+) = 2+, but 1 · (3−) = 3−: not neutral."),
      },
      ok: tr("Ca²⁺ und N³⁻: 3 · (2+) = 6+ und 2 · (3−) = 6− → Ca₃N₂, Calciumnitrid.", "Ca²⁺ and N³⁻: 3 · (2+) = 6+ and 2 · (3−) = 6− → Ca₃N₂, calcium nitride."),
    },
  ];
  return list;
}

export const kapitel2 = (): Kapitel => ({
  id: "formel-name", nr: 2, stufe: "us",
  title: tr("Formel und Name", "Formula and name"),
  desc: tr("Ladungen ausgleichen, die Formel aufstellen und das Salz benennen.", "Balance charges, write the formula and name the salt."),
  def: {
    title: tr("Formel und Name", "Formula and name"),
    known: [
      tr("Ion", "ion"), tr("Kation", "cation"), "Anion", tr("Ladung", "charge"), tr("Außenelektronen", "outer electrons"),
      tr("Edelgaskonfiguration", "noble gas configuration"), tr("Metall", "metal"), tr("Nichtmetall", "non-metal"), tr("Hauptgruppe", "main group"),
      "Atom", tr("Elektron", "electron"), tr("Molekül", "molecule"), tr("Gemisch", "mixture"), "PSE",
    ],
    steps: steps(),
    outro: [
      tr("Ladungen in der Ionenwand ausgleichen, bis die Ionenverbindung neutral ist.", "Balance charges in the ion wall until the ionic compound is neutral."),
      tr("Die Verhältnisformel aufstellen: Kation zuerst, Anzahl als Index, kleinstes Verhältnis.", "Write the formula (simplest ratio): cation first, number as subscript."),
      tr("Ionenverbindungen benennen: Metall + Wortstamm + -id, ohne Anzahl.", "Name ionic compounds: metal + word stem + -ide, without numbers."),
      tr("Vom Namen zur Formel und von der Formel zum Namen.", "Go from name to formula and from formula to name."),
    ],
  },
  explain: [
    [
      tr("Eine **Ionenverbindung** besteht aus Kationen und Anionen. Nach außen ist sie **neutral**.", "An **ionic compound** is made of cations and anions. Overall it is **neutral**."),
      tr("In der **Ionenwand** ist jeder Baustein so breit wie seine Ladung. Gleich lange Reihen = neutral.", "In the **ion wall** each tile is as wide as its charge. Rows of equal length = neutral."),
      tr("Beispiel: 1 Ba²⁺ und 2 F⁻: 1 · (2+) = 2+ und 2 · (1−) = 2−.", "Example: 1 Ba²⁺ and 2 F⁻: 1 · (2+) = 2+ and 2 · (1−) = 2−."),
    ],
    [
      tr("**Verhältnisformel**: erst das Kation, dann das Anion, ohne Ladungen.", "**Formula** (simplest ratio): first the cation, then the anion, without charges."),
      tr("Die Anzahl steht als **Index** tief hinter dem Symbol, eine 1 schreibt man nicht: 1 Ba²⁺ und 2 F⁻ → BaF₂.", "The number is a **subscript** after the symbol, a 1 is not written: 1 Ba²⁺ and 2 F⁻ → BaF₂."),
      tr("Die Formel nennt das kleinste Verhältnis (BaO, nicht Ba₂O₂). Sie beschreibt kein Molekül.", "The formula gives the smallest ratio (BaO, not Ba₂O₂). It does not describe a molecule."),
    ],
    [
      tr("Name: erst das Metall, dann der Wortstamm des Nichtmetalls mit **-id**: KI heißt Kaliumiodid.", "Name: first the metal, then the word stem of the non-metal with **-ide**: KI is potassium iodide."),
      tr("Besondere Wortstämme: Sauerstoff → Oxid, Schwefel → Sulfid, Stickstoff → Nitrid.", "Special word stems: oxygen → oxide, sulfur → sulfide, nitrogen → nitride."),
      tr("Bei Ionenverbindungen steht keine Anzahl im Namen: BaI₂ heißt Bariumiodid, nicht Bariumdiiodid.", "Names of ionic compounds have no numbers: BaI₂ is barium iodide, not barium diiodide."),
    ],
    [
      tr("Name → Formel: Ionen mit dem PSE bestimmen (Hauptgruppe → Ladung), ausgleichen, Formel schreiben.", "Name → formula: find the ions with the periodic table (main group → charge), balance, write the formula."),
      tr("Formel → Name: Metall, dann Wortstamm + -id, ohne Anzahl.", "Formula → name: metal, then word stem + -ide, without numbers."),
      tr("Beispiel: Bariumoxid: Ba²⁺ und O²⁻ gleichen sich 1 : 1 aus → BaO.", "Example: barium oxide: Ba²⁺ and O²⁻ balance 1 : 1 → BaO."),
    ],
  ],
});
