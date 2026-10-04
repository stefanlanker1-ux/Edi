// Geführte Erklärung Benennung: Stamm, längste Kette, Nummerierung, di/tri, Mehrfachbindung, Endungen, Rangfolge –
// mit Lewis-Formeln der App (Atome antippbar).

import { Fit, type GuideCtx, type GuideDef, type GuideStep } from "@lern/ui";
import { exampleMol } from "./chem/examples.ts";
import { smilesMol } from "./chem/smiles.ts";
import { MolSvg, U } from "./components/MolSvg.tsx";
import type { Mol } from "./chem/mol.ts";
import { tr } from "@lern/i18n";

/** 3-Methylhexan so gezeichnet, dass die längste Kette um die Ecke geht: 5 C in einer Reihe, Ethyl-Ast nach oben */
const BENT: Mol = (() => {
  const h = Math.sqrt(3) / 2;
  const pts: [number, number][] = [[0, 0], [h, -0.5], [2 * h, 0], [3 * h, -0.5], [4 * h, 0], [h, -1.5], [2 * h, -2]];
  const bonds: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6]];
  return { atoms: pts.map(([x, y], id) => ({ id, el: "C" as const, x, y })), bonds: bonds.map(([a, b]) => ({ a, b, order: 1 as const })) };
})();

/** Hauptkette von BENT ab C1 (Nummerierung vom Ende, das dem Methyl-Ast näher ist) */
const CHAIN = [6, 5, 1, 2, 3, 4];

/** Lewis-Formel; mit `target` sind die Atome antippbar (Ziel = Atomnummer in der Kurzschreibweise);
 *  `chain` hinterlegt die Hauptkette, `numbers` schreibt die Nummern dazu */
function Pic({ s, c, target, chain, numbers }: { s: string; c?: GuideCtx; target?: number; chain?: number[]; numbers?: boolean }) {
  // mit / oder \ in der Kurzschreibweise: E/Z wie angegeben gezeichnet
  const m = s === "bent" ? BENT : /[/\\]/.test(s) ? smilesMol(s) : exampleMol(s);
  return (
    <Fit className="og-g" min={0.3}>
      <MolSvg mol={m} view="lewis" parent={chain} numbers={numbers} label={tr("Strukturformel", "Structural formula")} minW={4} minH={2.6} className="og-g-svg">
        {target !== undefined && c && m.atoms.map(a => (
          <circle key={a.id} className={`og-g-hit${c.show && a.id === target ? " g-sol" : ""}`} cx={a.x * U} cy={a.y * U} r={0.38 * U}
            role="button" tabIndex={0} aria-label={`Atom ${a.el}`} onClick={() => c.pick(String(a.id))}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); c.pick(String(a.id)); } }} />
        ))}
      </MolSvg>
    </Fit>
  );
}

const STEPS: GuideStep[] = [
  {
    mode: "worked",
    part: tr("Alkane", "Alkanes"),
    say: tr("Der Name beginnt mit dem **Stamm**: Meth 1, Eth 2, Prop 3, But 4, Pent 5, Hex 6 C-Atome.", "The name starts with the **stem**: meth 1, eth 2, prop 3, but 4, pent 5, hex 6 C atoms."),
    ask: tr("Wie heißt dieses Molekül?", "What is this molecule called?"),
    visual: () => <Pic s="CCCC" />,
    lines: [tr("Nur die C zählen (nicht die H): 4.", "Count only the C (not the H): 4."), tr("4 C → Stamm **But**.", "4 C → stem **but**."), tr("Nur Einfachbindungen → Endung **-an** → **Butan**, ein **Alkan**.", "Only single bonds → ending **-ane** → **butane**, an **alkane**.")],
    ok: tr("So heißen sie: **Methan**, **Ethan**, **Propan**, **Butan**, **Pentan**, **Hexan**.", "Their names: **methane**, **ethane**, **propane**, **butane**, **pentane**, **hexane**."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie heißt dieses Alkan?", "Complete: what is this alkane called?"), answer: tr("Propan", "propane"), options: [tr("Propan", "propane"), tr("Butan", "butane"), tr("Propen", "propene")],
    visual: () => <Pic s="CCC" />,
    lines: [tr("3 C → Stamm Prop.", "3 C → stem prop."), tr("Endung -an → {?}", "Ending -ane → {?}")],
    why: { [tr("Butan", "butane")]: tr("Butan hat 4 C. Hier sind es 3.", "Butane has 4 C. Here there are 3."), [tr("Propen", "propene")]: tr("-en steht für eine Doppelbindung. Hier sind nur Einfachbindungen.", "-ene means a double bond. Here there are only single bonds.") },
    ok: tr("3 C, Einfachbindungen → **Propan**.", "3 C, single bonds → **propane**."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Wie heißt dieses Alkan?", "Your turn: what is this alkane called?"), answer: tr("Hexan", "hexane"), options: [tr("Hexan", "hexane"), tr("Pentan", "pentane"), tr("Heptan", "heptane"), tr("Sexan", "sexane")],
    visual: () => <Pic s="CCCCCC" />,
    lines: [tr("6 C → Hex + an = Hexan.", "6 C → hex + ane = hexane.")],
    why: { [tr("Pentan", "pentane")]: tr("Pentan hat 5 C. Zähle noch einmal.", "Pentane has 5 C. Count again."), [tr("Heptan", "heptane")]: tr("Heptan hätte 7 C.", "Heptane would have 7 C."), [tr("Sexan", "sexane")]: tr("Der Stamm für 6 heißt Hex.", "The stem for 6 is hex.") },
    ok: tr("Genau: **Hexan**.", "Exactly: **hexane**."),
  },
  {
    mode: "worked",
    part: tr("Äste und Nummern", "Branches and numbers"),
    say: tr("Die **Hauptkette** ist die längste Kette. Sie darf um die Ecke gehen.", "The **main chain** is the longest chain. It may go round a corner."),
    ask: tr("Welche Kette ist die Hauptkette?", "Which chain is the main chain?"),
    visual: () => <Pic s="bent" chain={CHAIN} />,
    lines: [tr("In einer Reihe liegen 5 C – über den Knick sind es **6 C** → Hexan.", "5 C lie in a row – round the corner there are **6 C** → hexane."), tr("Was nicht zur Hauptkette gehört, ist ein **Ast**.", "Whatever is not part of the main chain is a **branch**."), tr("Ein C als Ast heißt **Methyl**.", "One C as a branch is called **methyl**.")],
    ok: tr("Immer von jedem Kettenende aus zählen.", "Always count from every chain end."),
  },
  {
    mode: "worked",
    say: tr("Nummeriert wird vom Ende, das dem Ast **näher** ist.", "Number from the end that is **closer** to the branch."),
    ask: tr("Wie heißt das Molekül?", "What is the molecule called?"),
    visual: () => <Pic s="bent" chain={CHAIN} numbers />,
    lines: [tr("Vom näheren Ende: C1, C2, C3 – der Ast sitzt an **C3**.", "From the nearer end: C1, C2, C3 – the branch is on **C3**."), tr("Zusammensetzen: **Nummer – Ast – Stamm**.", "Put together: **number – branch – stem**."), tr("→ **3-Methylhexan**.", "→ **3-methylhexane**.")],
    ok: tr("Die Nummern sollen so klein wie möglich sein.", "The numbers should be as low as possible."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie heißt das Molekül?", "Complete: what is the molecule called?"), answer: tr("2-Methylpentan", "2-methylpentane"), options: [tr("2-Methylpentan", "2-methylpentane"), tr("4-Methylpentan", "4-methylpentane"), tr("2-Methylbutan", "2-methylbutane"), tr("2-Methylhexan", "2-methylhexane")],
    visual: () => <Pic s="CC(C)CCC" />,
    lines: [tr("Hauptkette: 5 C → Pentan.", "Main chain: 5 C → pentane."), tr("Methyl-Ast vom näheren Ende aus an C2.", "Methyl branch on C2 from the nearer end."), tr("Name: {?}", "Name: {?}")],
    why: { [tr("4-Methylpentan", "4-methylpentane")]: tr("Von der falschen Seite gezählt. Die Nummer soll klein sein.", "Counted from the wrong end. The number should be low."), [tr("2-Methylbutan", "2-methylbutane")]: tr("Die Hauptkette hat 5 C, nicht 4.", "The main chain has 5 C, not 4."), [tr("2-Methylhexan", "2-methylhexane")]: tr("Der Ast gehört nicht zur Hauptkette: 5 C.", "The branch is not part of the main chain: 5 C.") },
    ok: tr("**2-Methylpentan**.", "**2-methylpentane**."),
  },
  {
    mode: "free",
    say: tr("Was nicht zur Hauptkette gehört, ist ein **Ast**. Ein C als Ast heißt **Methyl**.", "Whatever is not part of the main chain is a **branch**. One C as a branch is called **methyl**."),
    ask: tr("Tippe auf das C der Hauptkette, an dem der **Methyl-Ast** hängt.", "Tap the C of the main chain where the **methyl branch** is attached."), answer: "1",
    visual: c => <Pic s="bent" c={c} target={1} chain={CHAIN} />,
    why: { "0": tr("Das ist der Ast selbst. Gesucht ist das C, an dem er hängt.", "That is the branch itself. Look for the C it is attached to.") },
    tip: tr("Suche das C mit drei C-Nachbarn.", "Look for the C with three C neighbours."),
    show: tr("Markiert: das C mit drei C-Nachbarn.", "Marked: the C with three C neighbours."),
    ok: tr("Genau: Dort hängt der Methyl-Ast.", "Exactly: the methyl branch is attached there."),
  },
  {
    mode: "free",
    say: tr("Nummeriert wird vom Ende, das dem Ast **näher** ist. Die Nummer soll klein sein.", "Number from the end that is **closer** to the branch. The number should be low."),
    ask: tr("Tippe auf das C, an dem du mit **1** beginnst.", "Tap the C where you start with **1**."), answer: "6",
    visual: c => <Pic s="bent" c={c} target={6} chain={CHAIN} />,
    why: { "4": tr("Von diesem Ende ist der Ast weiter weg.", "From this end the branch is further away.") },
    tip: tr("Zähle von beiden Enden der Hauptkette bis zum Ast. Nimm das kürzere.", "Count from both ends of the main chain to the branch. Take the shorter one."),
    show: tr("Markiert: das Ende nahe am Ast.", "Marked: the end close to the branch."),
    ok: tr("Hier beginnt die Nummerierung: C1.", "Numbering starts here: C1."),
  },
  {
    mode: "free",
    say: tr("Gleiche Äste fasst man zusammen: **di** = 2, **tri** = 3. Jeder Ast bekommt seine Nummer.", "Identical branches are combined: **di** = 2, **tri** = 3. Each branch gets its number."),
    ask: tr("Wie heißt das Molekül?", "What is the name of the molecule?"), answer: tr("2,3-Dimethylbutan", "2,3-dimethylbutane"), options: [tr("2,3-Dimethylbutan", "2,3-dimethylbutane"), tr("2-Methyl-3-methylbutan", "2-methyl-3-methylbutane"), tr("2,3-Methylbutan", "2,3-methylbutane"), tr("2,3-Dimethylpentan", "2,3-dimethylpentane")],
    visual: () => <Pic s="CC(C)C(C)C" />,
    why: {
      [tr("2-Methyl-3-methylbutan", "2-methyl-3-methylbutane")]: tr("Gleiche Äste fasst man zusammen: Dimethyl.", "Identical branches are combined: dimethyl."),
      [tr("2,3-Methylbutan", "2,3-methylbutane")]: tr("Bei zwei gleichen Ästen fehlt das di: Dimethyl.", "With two identical branches the di is missing: dimethyl."),
      [tr("2,3-Dimethylpentan", "2,3-dimethylpentane")]: tr("Pentan hätte 5 C. Die Hauptkette hat 4 C.", "Pentane would have 5 C. The main chain has 4 C."),
    },
    ok: tr("Zwei Methyl-Äste an C2 und C3 → **2,3-Dimethylbutan**.", "Two methyl branches on C2 and C3 → **2,3-dimethylbutane**."),
    lines: [tr("Zwei Methyl-Äste an C2 und C3 → 2,3-Dimethylbutan.", "Two methyl branches on C2 and C3 → 2,3-dimethylbutane.")],
  },
  {
    mode: "worked",
    part: tr("Mehrfachbindungen", "Multiple bonds"),
    say: tr("Doppelbindung → Endung **-en**, Dreifachbindung → **-in**.", "Double bond → ending **-ene**, triple bond → **-yne**."),
    ask: tr("Wie heißt das Molekül?", "What is the molecule called?"),
    visual: () => <Pic s="C=CCC" />,
    lines: [tr("4 C → But; Doppelbindung → -en.", "4 C → but; double bond → -ene."), tr("Die Doppelbindung bekommt die kleinste Nummer: zwischen C1 und C2 → 1.", "The double bond gets the lowest number: between C1 and C2 → 1."), tr("Die Nummer steht vor der Endung: **But-1-en**.", "The number goes before the ending: **but-1-ene**.")],
    ok: tr("Nummer der Mehrfachbindung = kleinere der beiden C-Nummern.", "Number of the multiple bond = the lower of the two C numbers."),
  },
  {
    mode: "faded",
    say: tr("Doppelbindung → **-en**, Dreifachbindung → **-in**. Sie bekommt die kleinste Nummer.", "Double bond → **-ene**, triple bond → **-yne**. It gets the lowest number."),
    ask: tr("Ergänze: Wie heißt das Molekül?", "Complete: what is the molecule called?"), answer: tr("Pent-2-en", "pent-2-ene"), options: [tr("Pent-2-en", "pent-2-ene"), tr("Pent-3-en", "pent-3-ene"), tr("Pent-2-in", "pent-2-yne"), tr("Pentan", "pentane")],
    visual: () => <Pic s="CC=CCC" />,
    why: {
      [tr("Pent-3-en", "pent-3-ene")]: tr("Von der falschen Seite gezählt. Die Doppelbindung soll eine kleine Nummer haben.", "Counted from the wrong end. The double bond should have a low number."),
      [tr("Pent-2-in", "pent-2-yne")]: tr("-in steht für eine Dreifachbindung. Hier ist eine Doppelbindung.", "-yne stands for a triple bond. Here there is a double bond."),
      [tr("Pentan", "pentane")]: tr("-an heißt: nur Einfachbindungen. Hier ist eine Doppelbindung.", "-ane means: only single bonds. Here there is a double bond."),
    },
    ok: tr("Doppelbindung ab C2 → **Pent-2-en**.", "Double bond from C2 → **pent-2-ene**."),
    lines: [tr("5 C, Doppelbindung → Pent…en.", "5 C, double bond → pent…ene."), tr("Vom näheren Ende: zwischen C2 und C3 → {?}", "From the nearer end: between C2 and C3 → {?}")],
  },
  {
    mode: "worked",
    say: tr("An einer Doppelbindung gibt es zwei Formen: **E** und **Z**.", "At a double bond there are two forms: **E** and **Z**."),
    ask: tr("Ist diese Doppelbindung E oder Z?", "Is this double bond E or Z?"),
    visual: () => <Pic s={"C/C=C/C"} />,
    lines: [tr("Je C der Doppelbindung: die Gruppe mit höherem Vorrang suchen – hier CH₃.", "At each C of the double bond: find the group with higher priority – here CH₃."), tr("Auf **derselben** Seite → **Z** (zusammen).", "On the **same** side → **Z** (together)."), tr("Gegenüber → **E** (entgegen). Hier: gegenüber → **E**.", "Opposite → **E** (opposite). Here: opposite → **E**.")],
    ok: tr("Z = zusammen, E = entgegen.", "Z = same side, E = opposite."),
  },
  {
    mode: "faded",
    say: tr("An C=C gibt es zwei Formen. Die vorrangigen Gruppen liegen auf **derselben** Seite (**Z**) oder **gegenüber** (**E**).", "At C=C there are two forms. The higher-priority groups are on the **same** side (**Z**) or **opposite** (**E**)."),
    ask: tr("Ist diese Doppelbindung **E** oder **Z**?", "Is this double bond **E** or **Z**?"), answer: "Z", options: ["Z", "E"],
    visual: () => <Pic s={"C/C=C\\C"} />,
    why: { "E": tr("Beide CH₃ liegen auf derselben Seite der Doppelbindung. Das ist Z (zusammen).", "Both CH₃ are on the same side of the double bond. That is Z (together).") },
    ok: tr("Beide CH₃ auf einer Seite → **(Z)-But-2-en** (cis).", "Both CH₃ on one side → **(Z)-but-2-ene** (cis)."),
    lines: [tr("Vorrangige Gruppen: die beiden CH₃.", "Higher-priority groups: the two CH₃."), tr("Sie liegen auf derselben Seite → {?}", "They are on the same side → {?}")],
  },
  {
    mode: "worked",
    part: tr("Alkohole", "Alcohols"),
    say: tr("**Funktionelle Gruppen** geben die Endung.", "**Functional groups** give the ending."),
    ask: tr("Wie heißt dieses Molekül?", "What is this molecule called?"),
    visual: () => <Pic s="CCO" />,
    lines: [tr("Die **Hydroxygruppe** –OH macht einen **Alkohol**: Endung **-ol**.", "The **hydroxy group** –OH makes an **alcohol**: ending **-ol**."), tr("2 C → Ethan; OH an C1.", "2 C → ethane; OH on C1."), tr("→ Ethan-1-ol, kurz **Ethanol**.", "→ ethan-1-ol, short **ethanol**.")],
    ok: tr("Die Nummer der Gruppe steht vor der Endung.", "The number of the group goes before the ending."),
  },
  {
    mode: "faded",
    say: tr("Die Nummer der Gruppe steht vor der Endung: Propan-**2**-ol.", "The number of the group stands before the ending: propan-**2**-ol."),
    ask: tr("Ergänze: Wie heißt dieser Alkohol?", "Complete: what is this alcohol called?"), answer: tr("Propan-2-ol", "propan-2-ol"), options: [tr("Propan-2-ol", "propan-2-ol"), tr("Propan-1-ol", "propan-1-ol"), tr("Propan-2-al", "propan-2-al"), tr("Propan-2-on", "propan-2-one")],
    visual: () => <Pic s="CC(O)C" />,
    why: {
      [tr("Propan-1-ol", "propan-1-ol")]: tr("Die OH-Gruppe sitzt am mittleren C, also C2.", "The OH group is on the middle C, so C2."),
      [tr("Propan-2-al", "propan-2-al")]: tr("-al steht für Aldehyd –CHO. Hier ist eine OH-Gruppe.", "-al stands for aldehyde –CHO. Here there is an OH group."),
      [tr("Propan-2-on", "propan-2-one")]: tr("-on steht für Keton C=O. Hier ist eine OH-Gruppe.", "-one stands for ketone C=O. Here there is an OH group."),
    },
    ok: tr("**Propan-2-ol**.", "**propan-2-ol**."),
    lines: [tr("3 C → Propan.", "3 C → propane."), tr("OH am mittleren C → Nummer 2.", "OH on the middle C → number 2."), tr("Name: {?}", "Name: {?}")],
  },
  {
    mode: "free",
    say: tr("**Funktionelle Gruppen** geben die Endung. Die Hydroxygruppe –OH macht einen **Alkohol**: Endung -ol.", "**Functional groups** give the ending. The hydroxy group –OH makes an **alcohol**: ending -ol."),
    ask: tr("Jetzt du: Tippe auf das **O-Atom** der OH-Gruppe.", "Your turn: tap the **O atom** of the OH group."), answer: "2",
    visual: c => <Pic s="CC(O)C" c={c} target={2} />,
    tip: tr("Suche das Atom, das nicht C oder H ist.", "Look for the atom that is not C or H."),
    show: tr("Markiert: das O-Atom.", "Marked: the O atom."),
    labels: [{ at: "[data-a=\"2\"]", text: tr("Hydroxygruppe", "Hydroxy group"), side: "right", afterSolved: true }],
    ok: tr("Die OH-Gruppe sitzt am mittleren C.", "The OH group is on the middle C."),
  },
  {
    mode: "worked",
    part: tr("Säuren und Rangfolge", "Acids and priority"),
    say: tr("Carbonsäuren tragen die Gruppe –COOH.", "Carboxylic acids carry the group –COOH."),
    ask: tr("Wie heißt diese Säure?", "What is this acid called?"),
    visual: () => <Pic s="CC(=O)O" />,
    lines: [tr("Das C der –COOH-Gruppe gehört **zur Kette** und ist immer C1.", "The C of the –COOH group belongs **to the chain** and is always C1."), tr("2 C → Ethan; Endung **-säure**.", "2 C → ethane; ending **-oic acid**."), tr("→ **Ethansäure** (Essigsäure). Die 1 schreibt man nicht.", "→ **ethanoic acid** (acetic acid). The 1 is not written.")],
    ok: tr("Säure: Kette mit dem COOH-C zählen.", "Acid: count the chain including the COOH carbon."),
  },
  {
    mode: "faded",
    say: tr("Carbonsäuren enden auf **-säure**. Die Nummer 1 schreibt man nicht.", "Carboxylic acids end in **-oic acid**. The number 1 is not written."),
    ask: tr("Ergänze: Wie heißt die Säure?", "Complete: what is the acid called?"), answer: tr("Butansäure", "butanoic acid"), options: [tr("Butansäure", "butanoic acid"), tr("Propansäure", "propanoic acid"), tr("Butan-1-säure", "butan-1-oic acid"), tr("Butanol", "butanol")],
    visual: () => <Pic s="CCCC(=O)O" />,
    why: {
      [tr("Propansäure", "propanoic acid")]: tr("Das C der COOH-Gruppe gehört zur Kette. Es sind 4 C.", "The C of the COOH group belongs to the chain. There are 4 C."),
      [tr("Butan-1-säure", "butan-1-oic acid")]: tr("Die Säuregruppe ist immer C1. Die 1 lässt man weg.", "The acid group is always C1. The 1 is left out."),
      [tr("Butanol", "butanol")]: tr("-ol steht für einen Alkohol. Hier ist eine COOH-Gruppe.", "-ol stands for an alcohol. Here there is a COOH group."),
    },
    ok: tr("**Butansäure** (Buttersäure).", "**butanoic acid** (butyric acid)."),
    lines: [tr("Kette mit dem C der COOH: 4 C → Butan.", "Chain including the COOH carbon: 4 C → butane."), tr("Säure: {?}", "Acid: {?}")],
  },
  {
    mode: "free",
    say: tr("Bei der Säuregruppe –COOH gehört das C **zur Kette**. Es ist immer C1.", "In the acid group –COOH the C **belongs to the chain**. It is always C1."),
    ask: tr("Jetzt du: Wie viele C hat die Kette dieser Säure?", "Your turn: how many C does this acid's chain have?"), answer: 4, num: {},
    visual: () => <Pic s="CCCC(=O)O" />,
    why: { "3": tr("Das C der COOH-Gruppe zählt mit.", "The C of the COOH group counts too.") },
    tip: tr("Zähle auch das C, an dem die beiden O hängen.", "Also count the C that the two O are attached to."),
    ok: tr("4 C mit der Säuregruppe.", "4 C including the acid group."),
    lines: [tr("3 C in der Reihe + das C der COOH = 4.", "3 C in a row + the C of COOH = 4.")],
  },
  {
    mode: "worked",
    say: tr("Mehrere Gruppen: die mit dem **höchsten Rang** gibt die Endung.", "Several groups: the one with the **highest priority** gives the ending."),
    ask: tr("Welche Gruppe gibt die Endung?", "Which group gives the ending?"),
    lines: [tr("Rang: Säure > **Aldehyd** (–CHO, -al) > **Keton** (C=O in der Kette, -on) > Alkohol (-ol).", "Priority: acid > **aldehyde** (–CHO, -al) > **ketone** (C=O in the chain, -one) > alcohol (-ol)."), tr("Die anderen Gruppen stehen als Vorsilbe vorn: –OH → **Hydroxy**-.", "The other groups go in front as a prefix: –OH → **hydroxy**-.")],
    ok: tr("Endung = ranghöchste Gruppe, sie bekommt die kleinste Nummer.", "Ending = highest-priority group, it gets the lowest number."),
  },
  {
    mode: "faded",
    say: tr("Mehrere Gruppen: Die mit dem **höchsten Rang** gibt die Endung. Säure > Aldehyd > Keton > Alkohol > Amin.", "Several groups: the one with the **highest rank** gives the ending. Acid > aldehyde > ketone > alcohol > amine."),
    ask: tr("Welche Gruppe gibt hier die Endung?", "Which group gives the ending here?"), answer: tr("Keton C=O", "Ketone C=O"), options: [tr("Keton C=O", "Ketone C=O"), tr("Alkohol –OH", "Alcohol –OH")],
    visual: () => <Pic s="CC(=O)CC(O)C" />,
    why: { [tr("Alkohol –OH", "Alcohol –OH")]: tr("Keton steht in der Rangfolge vor Alkohol. Die OH-Gruppe wird Vorsilbe.", "Ketone ranks before alcohol. The OH group becomes a prefix.") },
    ok: tr("Keton → Endung **-on**. OH wird **Hydroxy-**.", "Ketone → ending **-one**. OH becomes **hydroxy-**."),
    lines: [tr("Gruppen: –OH (Alkohol) und C=O in der Kette (Keton).", "Groups: –OH (alcohol) and C=O in the chain (ketone)."), tr("Höherer Rang: {?}", "Higher priority: {?}")],
  },
  {
    mode: "free",
    say: tr("Die Hauptgruppe bekommt die kleinste Nummer. Die anderen Gruppen stehen als Vorsilbe vorn.", "The principal group gets the lowest number. The other groups come first as prefixes."),
    ask: tr("Wie heißt die Verbindung?", "What is the name of the compound?"), answer: tr("4-Hydroxypentan-2-on", "4-hydroxypentan-2-one"), options: [tr("4-Hydroxypentan-2-on", "4-hydroxypentan-2-one"), tr("4-Oxopentan-2-ol", "4-oxopentan-2-ol"), tr("2-Hydroxypentan-4-on", "2-hydroxypentan-4-one"), tr("Pentan-2-on-4-ol", "pentan-2-one-4-ol")],
    visual: () => <Pic s="CC(=O)CC(O)C" />,
    why: {
      [tr("4-Oxopentan-2-ol", "4-oxopentan-2-ol")]: tr("Keton geht vor Alkohol. Darum Endung -on, nicht -ol.", "Ketone ranks before alcohol. So the ending is -one, not -ol."),
      [tr("2-Hydroxypentan-4-on", "2-hydroxypentan-4-one")]: tr("Die Hauptgruppe C=O soll die kleinste Nummer haben.", "The principal group C=O should have the lowest number."),
      [tr("Pentan-2-on-4-ol", "pentan-2-one-4-ol")]: tr("Nur eine Endung. Die zweite Gruppe wird Vorsilbe: Hydroxy.", "Only one ending. The second group becomes a prefix: hydroxy."),
    },
    ok: tr("**4-Hydroxypentan-2-on**.", "**4-hydroxypentan-2-one**."),
    lines: [tr("Keton an C2 → -2-on; OH an C4 → 4-Hydroxy-.", "Ketone on C2 → -2-one; OH on C4 → 4-hydroxy-.")],
  },
];

export const GUIDE: GuideDef = {
  title: tr("Nomenklatur", "Nomenclature"),
  steps: STEPS,
  outro: [
    tr("Stamm nach der Zahl der C in der **längsten Kette**.", "Stem from the number of C in the **longest chain**."),
    tr("Nummerieren: kleinste Nummern für Hauptgruppe, Mehrfachbindung, Äste.", "Numbering: lowest numbers for the principal group, multiple bond, branches."),
    tr("Gleiche Äste mit **di, tri**, Vorsilben **alphabetisch**.", "Identical branches with **di, tri**, prefixes **alphabetical**."),
    tr("Endung von der Gruppe mit dem **höchsten Rang**: -säure, -al, -on, -ol, -amin.", "Ending from the group with the **highest rank**: -oic acid, -al, -one, -ol, -amine."),
  ],
};
