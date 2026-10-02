// Geführte Erklärung Reaktionsgleichungen: Teilchenbild der App (Kalotten) und die einzeilige Gleichung.
// Atome zählen, Koeffizient an die richtige Stelle setzen (Stoff antippen), ausgleichen, Wortgleichung, Klammern, kürzen.

import type { GuideCtx, GuideDef, GuideStep } from "@lern/ui";
import { toSubscript, type Equation } from "@lern/chem";
import { FitLine } from "./components/Equation.tsx";
import { MoleculeScene } from "./components/Molecules.tsx";
import { tr } from "@lern/i18n";

const KNALLGAS: Equation = { left: ["H2", "O2"], right: ["H2O"] };

/** Gleichungstext: Koeffizient 1 weglassen, `null` = „?“ */
function text(eq: Equation, k: (number | null)[]) {
  const part = (fs: string[], off: number) => fs.map((f, i) => { const c = k[off + i]; return `${c === null ? "? " : c === 1 ? "" : `${c} `}${toSubscript(f)}`; }).join(" + ");
  return `${part(eq.left, 0)} → ${part(eq.right, eq.left.length)}`;
}

/** Teilchenbild und Gleichung darunter */
const Scene = ({ eq, k }: { eq: Equation; k: number[] }) => (
  <div className="rg-g">
    <div className="rg-g-scene"><MoleculeScene eq={eq} coeffs={k} /></div>
    <FitLine text={text(eq, k)} />
  </div>
);

/** nur die Gleichung (groß) */
const Line = ({ eq, k }: { eq: Equation; k: (number | null)[] }) => <div className="rg-g rg-g-only"><FitLine text={text(eq, k)} base={30} /></div>;

/** Gleichung mit antippbaren Stoffen (Ziel = Index des Stoffs als Text) */
function Pick({ c, eq, k, answer }: { c: GuideCtx; eq: Equation; k: number[]; answer: number }) {
  const all = [...eq.left, ...eq.right];
  return (
    <div className="rg-g">
      <div className="rg-g-scene"><MoleculeScene eq={eq} coeffs={k} /></div>
      <div className="rg-g-pick">
        {all.map((f, i) => (
          <span key={i} className="rg-g-term">
            {i === eq.left.length ? <span className="rg-g-op">→</span> : i > 0 ? <span className="rg-g-op">+</span> : null}
            <button type="button" className={`rg-g-sp${c.show && i === answer ? " g-sol" : ""}${c.solved && i === answer ? " right" : ""}`} onClick={() => c.pick(String(i))}>
              {k[i] > 1 && <b>{k[i]} </b>}{toSubscript(f)}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

const eqOf = (l: string[], r: string[]): Equation => ({ left: l, right: r });

const US: GuideStep[] = [
  {
    say: tr("**Gesetz der Massenerhaltung:** Bei einer Reaktion werden Atome nur **neu verbunden**. Keines geht verloren, keines kommt dazu. Die Stoffe vorher heißen **Edukte**, nachher **Produkte**.", "**Conservation of mass:** in a reaction atoms are only **rearranged**. None is lost, none is added. The substances before are called **reactants**, after **products**."),
    ask: tr("Zähle die **roten** O-Atome bei den **Edukten**. Wie viele sind es?", "Count the **red** O atoms in the **reactants**. How many are there?"), answer: 2, num: {},
    visual: () => <Scene eq={KNALLGAS} k={[1, 1, 1]} />,
    why: { "1": tr("Ein O₂-Molekül hat 2 O-Atome.", "An O₂ molecule has 2 O atoms."), "3": tr("Zähle nur bei den Edukten.", "Count only in the reactants.") },
    tip: tr("Ein O₂-Molekül besteht aus zwei roten Kugeln. Zähle nur bei den Edukten.", "An O₂ molecule consists of two red balls. Count only in the reactants."),
    labels: [{"at": ".ms-box", "text": tr("Edukte", "Reactants"), "nth": 0, "point": "top", "side": "above"}, {"at": ".ms-box", "text": tr("Produkte", "Products"), "nth": -1, "point": "top", "side": "above"}, {"at": ".ms-edukte [data-el=\"O\"]", "text": tr("O-Atom", "O atom"), "side": "left"}],
    ok: tr("Edukte: 2 O-Atome.", "Reactants: 2 O atoms."),
  },
  {
    ask: tr("Und bei den **Produkten**?", "And in the **products**?"), answer: 1, num: {},
    visual: () => <Scene eq={KNALLGAS} k={[1, 1, 1]} />,
    why: { "2": tr("Bei den Produkten ist nur ein H₂O mit einem O-Atom.", "The products have only one H₂O with one O atom.") },
    tip: tr("Zähle die roten Kugeln bei den Produkten.", "Count the red balls in the products."),
    labels: [{"at": ".ms-box", "text": tr("Edukte", "Reactants"), "nth": 0, "point": "top", "side": "above"}, {"at": ".ms-box", "text": tr("Produkte", "Products"), "nth": -1, "point": "top", "side": "above"}],
    ok: tr("Edukte 2 O, Produkte 1 O: Die Gleichung ist **nicht ausgeglichen**.", "Reactants 2 O, products 1 O: the equation is **not balanced**."),
  },
  {
    say: tr("Die Formeln darf man **nie** ändern – H₂O bleibt H₂O. Man setzt **Zahlen davor** (Koeffizienten): 2 H₂O sind zwei Wasser-Moleküle.", "You may **never** change the formulas – H₂O stays H₂O. You put **numbers in front** (coefficients): 2 H₂O are two water molecules."),
    ask: tr("Vor welchen Stoff muss eine **2**, damit auch die Produkte 2 O-Atome haben? Tippe ihn an.", "Which substance needs a **2** in front so that the products also have 2 O atoms? Tap it."), answer: "2",
    visual: c => <Pick c={c} eq={KNALLGAS} k={[1, 1, 1]} answer={2} />,
    why: { "0": tr("Vor H₂ ändert sich die Zahl der O-Atome nicht.", "In front of H₂ the number of O atoms does not change."), "1": tr("Bei den Edukten stimmt O schon. Bei den Produkten fehlt ein O.", "O is already right in the reactants. One O is missing in the products.") },
    tip: tr("Suche bei den Produkten den Stoff, der O-Atome enthält.", "Find the substance among the products that contains O atoms."),
    labels: [{"at": ".ms-box", "text": tr("Edukte", "Reactants"), "nth": 0, "point": "top", "side": "above"}, {"at": ".ms-box", "text": tr("Produkte", "Products"), "nth": -1, "point": "top", "side": "above"}],
    ok: tr("2 H₂O: Produkte jetzt mit 2 O – aber auch 4 H.", "2 H₂O: products now with 2 O – but also 4 H."),
  },
  {
    ask: tr("Die Produkte haben jetzt **4 H**. Welche Zahl gehört vor **H₂**?", "The products now have **4 H**. Which number goes in front of **H₂**?"), answer: 2, num: {},
    visual: () => <Scene eq={KNALLGAS} k={[1, 1, 2]} />,
    why: { "4": tr("Ein H₂ hat schon 2 H-Atome: 2 · 2 = 4.", "One H₂ already has 2 H atoms: 2 · 2 = 4."), "1": tr("Die Edukte hätten dann nur 2 H.", "Then the reactants would only have 2 H.") },
    tip: tr("Die Edukte brauchen so viele H-Atome wie die Produkte. Jedes H₂ hat zwei.", "The reactants need as many H atoms as the products. Each H₂ has two."),
    labels: [{"at": ".ms-box", "text": tr("Edukte", "Reactants"), "nth": 0, "point": "top", "side": "above"}, {"at": ".ms-box", "text": tr("Produkte", "Products"), "nth": -1, "point": "top", "side": "above"}, {"at": ".ms-edukte [data-el=\"H\"]", "text": tr("H-Atom", "H atom"), "side": "left"}],
    ok: tr("2 H₂: Edukte 4 H, Produkte 4 H.", "2 H₂: reactants 4 H, products 4 H."),
  },
  {
    ask: tr("Ist die Gleichung jetzt ausgeglichen?", "Is the equation balanced now?"), answer: tr("Ja – H und O stimmen", "Yes – H and O match"), options: [tr("Ja – H und O stimmen", "Yes – H and O match"), tr("Nein – H stimmt nicht", "No – H does not match"), tr("Nein – O stimmt nicht", "No – O does not match")],
    visual: () => <Scene eq={KNALLGAS} k={[2, 1, 2]} />,
    why: { [tr("Nein – H stimmt nicht", "No – H does not match")]: tr("Edukte 2 · 2 = 4 H, Produkte 2 · 2 = 4 H.", "Reactants 2 · 2 = 4 H, products 2 · 2 = 4 H."), [tr("Nein – O stimmt nicht", "No – O does not match")]: tr("Edukte 2 O, Produkte 2 · 1 = 2 O.", "Reactants 2 O, products 2 · 1 = 2 O.") },
    labels: [{"at": ".ms-box", "text": tr("Edukte", "Reactants"), "nth": 0, "point": "top", "side": "above"}, {"at": ".ms-box", "text": tr("Produkte", "Products"), "nth": -1, "point": "top", "side": "above"}],
    ok: tr("**2 H₂ + O₂ → 2 H₂O** – Edukte und Produkte haben gleich viele Atome jeder Sorte.", "**2 H₂ + O₂ → 2 H₂O** – reactants and products have the same number of atoms of each kind."),
  },
  {
    say: tr("Die Zahl **davor** gilt für das ganze Molekül, die **kleine** Zahl nur für das Atom davor.", "The number **in front** applies to the whole molecule, the **small** number only to the atom before it."),
    ask: tr("Wie viele H-Atome stecken in **3 C₃H₈**?", "How many H atoms are there in **3 C₃H₈**?"), answer: 24, num: {},
    why: { "8": tr("Die 3 davor gilt für jedes Atom: 3 · 8.", "The 3 in front applies to every atom: 3 · 8."), "11": tr("Nicht addieren: 3 Moleküle mit je 8 H.", "Don't add: 3 molecules with 8 H each."), "9": tr("9 sind die C-Atome (3 · 3).", "9 are the C atoms (3 · 3).") },
    tip: tr("Zahl davor mal kleine Zahl hinter dem H.", "Number in front times the small number after H."),
    ok: tr("Koeffizient · Index: 3 · 8 = 24 H-Atome.", "Coefficient · subscript: 3 · 8 = 24 H atoms."),
  },
  {
    ask: tr("Ist **Fe + 2 S → FeS** ausgeglichen?", "Is **Fe + 2 S → FeS** balanced?"), answer: tr("Nein – S stimmt nicht", "No – S does not match"), options: [tr("Ja", "Yes"), tr("Nein – S stimmt nicht", "No – S does not match"), tr("Nein – Fe stimmt nicht", "No – Fe does not match")],
    visual: () => <Line eq={eqOf(["Fe", "S"], ["FeS"])} k={[1, 2, 1]} />,
    why: { [tr("Ja", "Yes")]: tr("Links 2 S, rechts nur 1 S.", "2 S on the left, only 1 S on the right."), [tr("Nein – Fe stimmt nicht", "No – Fe does not match")]: tr("Fe: links 1, rechts 1 – stimmt.", "Fe: 1 on the left, 1 on the right – correct.") },
    ok: tr("Richtig wäre Fe + S → FeS.", "Correct would be Fe + S → FeS."),
  },
  {
    ask: tr("Welche Zahl gehört vor **Mg**?", "Which number goes in front of **Mg**?"), answer: 2, num: {},
    visual: () => <Line eq={eqOf(["Mg", "CO2"], ["MgO", "C"])} k={[null, 1, 2, 1]} />,
    why: { "1": tr("Rechts sind 2 Mg (in 2 MgO).", "There are 2 Mg on the right (in 2 MgO).") },
    tip: tr("Zähle die Mg-Atome rechts – die Zahl vor MgO gilt mit.", "Count the Mg atoms on the right – the number in front of MgO counts too."),
    ok: tr("**2 Mg** + CO₂ → 2 MgO + C.", "**2 Mg** + CO₂ → 2 MgO + C."),
  },
  {
    say: tr("Verbrennungen: erst C, dann H, **zuletzt O** ausgleichen.", "Combustion: balance C first, then H, **O last**."),
    ask: tr("Welche Zahl gehört vor **O₂**?", "Which number goes in front of **O₂**?"), answer: 2, num: {},
    visual: () => <Line eq={eqOf(["CH4", "O2"], ["CO2", "H2O"])} k={[1, null, 1, 2]} />,
    why: { "4": tr("Rechts 4 O-Atome – das sind 2 O₂-Moleküle.", "4 O atoms on the right – that is 2 O₂ molecules."), "3": tr("Rechts: 2 O in CO₂ + 2 O in 2 H₂O = 4 O.", "Right: 2 O in CO₂ + 2 O in 2 H₂O = 4 O.") },
    tip: tr("Zähle alle O-Atome rechts. Jedes O₂ bringt zwei davon.", "Count all O atoms on the right. Each O₂ brings two."),
    ok: tr("CH₄ + 2 O₂ → CO₂ + 2 H₂O.", "CH₄ + 2 O₂ → CO₂ + 2 H₂O."),
  },
  {
    say: tr("Links vom Pfeil stehen die **Edukte** (Ausgangsstoffe), rechts die **Produkte**.", "The **reactants** (starting substances) are on the left of the arrow, the **products** on the right."),
    ask: tr("Welche Gleichung passt zu: **Stickstoff + Wasserstoff → Ammoniak**?", "Which equation matches: **nitrogen + hydrogen → ammonia**?"), answer: "N₂ + 3 H₂ → 2 NH₃",
    options: ["N₂ + 3 H₂ → 2 NH₃", "N + 3 H → NH₃", "N₂ + H₂ → NH₃", "2 NH₃ → N₂ + 3 H₂"],
    why: { "N + 3 H → NH₃": tr("Stickstoff und Wasserstoff kommen als Moleküle N₂ und H₂ vor.", "Nitrogen and hydrogen occur as the molecules N₂ and H₂."), "N₂ + H₂ → NH₃": tr("Nicht ausgeglichen: links 2 N, rechts 1 N.", "Not balanced: 2 N on the left, 1 N on the right."), "2 NH₃ → N₂ + 3 H₂": tr("Ammoniak ist das Produkt – es steht rechts.", "Ammonia is the product – it goes on the right.") },
    ok: tr("Edukte N₂ und H₂, Produkt NH₃.", "Reactants N₂ and H₂, product NH₃."),
  },
  {
    say: tr("Manchmal geht es nur mit einer **halben** Zahl: Für 3 H-Atome bräuchte man 1½ H₂.", "Sometimes it only works with a **half** number: for 3 H atoms you would need 1½ H₂."),
    ask: tr("Wie viele H₂ wären hier rechts nötig?", "How many H₂ would be needed on the right here?"), answer: "1½", options: ["1½", "3", "1", "2"],
    visual: () => <Line eq={eqOf(["Al", "HCl"], ["AlCl3", "H2"])} k={[1, 3, 1, null]} />,
    why: { "3": tr("3 H₂ wären 6 H-Atome – links sind nur 3.", "3 H₂ would be 6 H atoms – there are only 3 on the left."), "1": tr("1 H₂ hat nur 2 H-Atome.", "1 H₂ has only 2 H atoms."), "2": tr("2 H₂ wären 4 H-Atome.", "2 H₂ would be 4 H atoms.") },
    ok: tr("1½ H₂ – halbe Moleküle gibt es aber nicht.", "1½ H₂ – but there are no half molecules."),
  },
  {
    say: tr("Dann **verdoppelt** man alle Zahlen: 2 Al + 6 HCl → 2 AlCl₃ + ? H₂.", "Then you **double** all numbers: 2 Al + 6 HCl → 2 AlCl₃ + ? H₂."),
    ask: tr("Welche Zahl gehört jetzt vor **H₂**?", "Which number goes in front of **H₂** now?"), answer: 3, num: {},
    visual: () => <Line eq={eqOf(["Al", "HCl"], ["AlCl3", "H2"])} k={[2, 6, 2, null]} />,
    why: { "6": tr("6 H₂ wären 12 H-Atome – links sind 6.", "6 H₂ would be 12 H atoms – there are 6 on the left."), "1.5": tr("Verdoppelt: 2 · 1½ = 3.", "Doubled: 2 · 1½ = 3.") },
    tip: tr("Zähle die H-Atome links. Jedes H₂ trägt zwei davon.", "Count the H atoms on the left. Each H₂ carries two."),
    ok: tr("**2 Al + 6 HCl → 2 AlCl₃ + 3 H₂**.", "**2 Al + 6 HCl → 2 AlCl₃ + 3 H₂**."),
  },
];

const OS: GuideStep[] = [
  {
    say: tr("Atome bleiben bei der Reaktion erhalten. Die Zahl davor gilt für das ganze Teilchen.", "Atoms are conserved in the reaction. The number in front applies to the whole particle."),
    ask: tr("Wie viele O-Atome stecken in **2 Fe₂O₃**?", "How many O atoms are there in **2 Fe₂O₃**?"), answer: 6, num: {},
    why: { "3": tr("Die 2 davor verdoppelt alles: 2 · 3.", "The 2 in front doubles everything: 2 · 3."), "5": tr("Nicht addieren: 2 Teilchen mit je 3 O.", "Don't add: 2 particles with 3 O each.") },
    tip: tr("Zahl davor mal Zahl der O-Atome in einem Fe₂O₃.", "Number in front times the number of O atoms in one Fe₂O₃."),
    ok: tr("Koeffizient · Index: 2 · 3 = 6 O-Atome.", "Coefficient · subscript: 2 · 3 = 6 O atoms."),
  },
  {
    say: tr("Eine Zahl hinter der **Klammer** gilt für alles in der Klammer.", "A number after a **bracket** applies to everything in the bracket."),
    ask: tr("Wie viele O-Atome stecken in **Ca(NO₃)₂**?", "How many O atoms are there in **Ca(NO₃)₂**?"), answer: 6, num: {},
    why: { "3": tr("Die 2 hinter der Klammer verdoppelt NO₃: 2 · 3.", "The 2 after the bracket doubles NO₃: 2 · 3."), "5": tr("Nicht addieren: 3 · 2.", "Don't add: 3 · 2.") },
    tip: tr("Zahl hinter der Klammer mal O-Atome in einem NO₃.", "Number after the bracket times O atoms in one NO₃."),
    ok: tr("(NO₃)₂: 2 · 3 = 6 O.", "(NO₃)₂: 2 · 3 = 6 O."),
  },
  {
    ask: tr("Wie viele **Ca**-Atome stecken in **3 Ca₃(PO₄)₂**?", "How many **Ca** atoms are there in **3 Ca₃(PO₄)₂**?"), answer: 9, num: {},
    why: { "3": tr("Ca₃ hat schon 3 – davor steht noch eine 3.", "Ca₃ already has 3 – and there is a 3 in front."), "6": tr("Die 2 gehört zur Klammer (PO₄), nicht zu Ca.", "The 2 belongs to the bracket (PO₄), not to Ca.") },
    tip: tr("Zahl davor mal Index von Ca. Die Zahl hinter der Klammer gilt nur für PO₄.", "Number in front times the subscript of Ca. The number after the bracket only applies to PO₄."),
    ok: tr("3 · 3 = 9 Ca.", "3 · 3 = 9 Ca."),
  },
  {
    say: tr("Mehratomige Ionen, die erhalten bleiben (SO₄, NO₃, PO₄), zählt man als **Block** – das spart Arbeit.", "Polyatomic ions that stay intact (SO₄, NO₃, PO₄) are counted as a **block** – that saves work."),
    ask: tr("Welche Zahl gehört vor **NaOH**?", "Which number goes in front of **NaOH**?"), answer: 2, num: {},
    visual: () => <Line eq={eqOf(["NaOH", "H2SO4"], ["Na2SO4", "H2O"])} k={[null, 1, 1, 2]} />,
    why: { "1": tr("Rechts sind 2 Na (in Na₂SO₄).", "There are 2 Na on the right (in Na₂SO₄).") },
    tip: tr("Zähle die Na-Atome rechts in Na₂SO₄.", "Count the Na atoms on the right in Na₂SO₄."),
    ok: tr("2 NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O.", "2 NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O."),
  },
  {
    ask: tr("**Fällung**: Welche Zahl gehört vor **KI**?", "**Precipitation**: which number goes in front of **KI**?"), answer: 2, num: {},
    visual: () => <Line eq={eqOf(["Pb(NO3)2", "KI"], ["PbI2", "KNO3"])} k={[1, null, 1, 2]} />,
    why: { "1": tr("Rechts 2 I (in PbI₂) und 2 K (in 2 KNO₃).", "2 I on the right (in PbI₂) and 2 K (in 2 KNO₃).") },
    tip: tr("Zähle die I-Atome rechts in PbI₂.", "Count the I atoms on the right in PbI₂."),
    ok: tr("Pb(NO₃)₂ + 2 KI → PbI₂ + 2 KNO₃ (NO₃ als Block).", "Pb(NO₃)₂ + 2 KI → PbI₂ + 2 KNO₃ (NO₃ as a block)."),
  },
  {
    ask: tr("Ist **CaCO₃ + HCl → CaCl₂ + H₂O + CO₂** ausgeglichen?", "Is **CaCO₃ + HCl → CaCl₂ + H₂O + CO₂** balanced?"), answer: tr("Nein – H und Cl stimmen nicht", "No – H and Cl do not match"),
    options: [tr("Ja", "Yes"), tr("Nein – H und Cl stimmen nicht", "No – H and Cl do not match"), tr("Nein – O stimmt nicht", "No – O does not match")],
    visual: () => <Line eq={eqOf(["CaCO3", "HCl"], ["CaCl2", "H2O", "CO2"])} k={[1, 1, 1, 1, 1]} />,
    why: { [tr("Ja", "Yes")]: tr("Links 1 Cl, rechts 2 Cl.", "1 Cl on the left, 2 Cl on the right."), [tr("Nein – O stimmt nicht", "No – O does not match")]: tr("O: links 3, rechts 1 + 2 = 3 – stimmt.", "O: 3 on the left, 1 + 2 = 3 on the right – correct.") },
    ok: tr("H und Cl: links je 1, rechts je 2.", "H and Cl: 1 each on the left, 2 each on the right."),
  },
  {
    ask: tr("Welche Zahl gehört vor **HCl**?", "Which number goes in front of **HCl**?"), answer: 2, num: {},
    visual: () => <Line eq={eqOf(["CaCO3", "HCl"], ["CaCl2", "H2O", "CO2"])} k={[1, null, 1, 1, 1]} />,
    why: { "1": tr("Rechts stehen 2 Cl in CaCl₂ – links braucht es genauso viele.", "There are 2 Cl in CaCl₂ on the right – the left needs just as many.") },
    tip: tr("Zähle die Cl-Atome rechts in CaCl₂.", "Count the Cl atoms on the right in CaCl₂."),
    ok: tr("CaCO₃ + 2 HCl → CaCl₂ + H₂O + CO₂ – mit H gegenprüfen: links 2, rechts 2.", "CaCO₃ + 2 HCl → CaCl₂ + H₂O + CO₂ – check with H: 2 on the left, 2 on the right."),
  },
  {
    ask: tr("Welcher Stoff ist ein **Edukt**?", "Which substance is a **reactant**?"), answer: "NO₂", options: ["NO₂", "HNO₃", "NO"],
    visual: () => <Line eq={eqOf(["NO2", "H2O"], ["HNO3", "NO"])} k={[3, 1, 2, 1]} />,
    why: { "HNO₃": tr("HNO₃ steht rechts – es ist ein Produkt.", "HNO₃ is on the right – it is a product."), NO: tr("NO steht rechts – es ist ein Produkt.", "NO is on the right – it is a product.") },
    ok: tr("Edukte links: NO₂ und H₂O.", "Reactants on the left: NO₂ and H₂O."),
  },
  {
    say: tr("Verbrennung: erst C, dann H, zuletzt O. Ergibt sich eine halbe Zahl, **alles verdoppeln**.", "Combustion: first C, then H, O last. If a half number results, **double everything**."),
    ask: tr("Welche Zahl gehört vor **O₂**?", "Which number goes in front of **O₂**?"), answer: 7, num: {},
    visual: () => <Line eq={eqOf(["C2H6", "O2"], ["CO2", "H2O"])} k={[2, null, 4, 6]} />,
    why: { "14": tr("14 sind die O-Atome rechts – das sind 7 O₂.", "14 are the O atoms on the right – that is 7 O₂."), "3.5": tr("Mit 2 C₂H₆ wird es ganzzahlig: 14 O-Atome = 7 O₂.", "With 2 C₂H₆ it becomes whole numbers: 14 O atoms = 7 O₂.") },
    tip: tr("Zähle die O-Atome rechts in 4 CO₂ und 6 H₂O, dann durch 2 teilen.", "Count the O atoms on the right in 4 CO₂ and 6 H₂O, then divide by 2."),
    ok: tr("2 C₂H₆ + 7 O₂ → 4 CO₂ + 6 H₂O.", "2 C₂H₆ + 7 O₂ → 4 CO₂ + 6 H₂O."),
  },
  {
    say: tr("Große Gleichungen: Element für Element, **H und O zuletzt**, mit H gegenprüfen.", "Large equations: element by element, **H and O last**, check with H."),
    ask: tr("Welche Zahl gehört vor **H₂O**?", "Which number goes in front of **H₂O**?"), answer: 4, num: {},
    visual: () => <Line eq={eqOf(["Cu", "HNO3"], ["Cu(NO3)2", "NO", "H2O"])} k={[3, 8, 3, 2, null]} />,
    why: { "8": tr("8 sind die H-Atome links – das sind 4 H₂O.", "8 are the H atoms on the left – that is 4 H₂O."), "2": tr("Links 8 H → rechts 8 H = 4 H₂O.", "8 H on the left → 8 H on the right = 4 H₂O.") },
    tip: tr("Zähle die H-Atome links in 8 HNO₃. Jedes H₂O trägt zwei.", "Count the H atoms on the left in 8 HNO₃. Each H₂O carries two."),
    ok: tr("3 Cu + 8 HNO₃ → 3 Cu(NO₃)₂ + 2 NO + 4 H₂O.", "3 Cu + 8 HNO₃ → 3 Cu(NO₃)₂ + 2 NO + 4 H₂O."),
  },
  {
    say: tr("Zum Schluss **kürzen**, wenn alle Zahlen durch dieselbe Zahl teilbar sind.", "Finally **simplify** if all numbers are divisible by the same number."),
    ask: tr("**4 H₂ + 2 O₂ → 4 H₂O** – was ist noch zu tun?", "**4 H₂ + 2 O₂ → 4 H₂O** – what is left to do?"), answer: tr("durch 2 kürzen", "simplify by 2"), options: [tr("durch 2 kürzen", "simplify by 2"), tr("nichts – stimmt so", "nothing – it is correct"), tr("verdoppeln", "double")],
    why: { [tr("nichts – stimmt so", "nothing – it is correct")]: tr("Ausgeglichen ja – aber 4, 2, 4 sind alle durch 2 teilbar.", "Balanced, yes – but 4, 2, 4 are all divisible by 2."), [tr("verdoppeln", "double")]: tr("Verdoppeln nur bei halben Zahlen.", "Only double for half numbers.") },
    ok: tr("2 H₂ + O₂ → 2 H₂O.", "2 H₂ + O₂ → 2 H₂O."),
  },
  {
    ask: tr("Welche Gleichung passt zu: **Calciumcarbonat → Calciumoxid + Kohlendioxid**?", "Which equation matches: **calcium carbonate → calcium oxide + carbon dioxide**?"), answer: "CaCO₃ → CaO + CO₂",
    options: ["CaCO₃ → CaO + CO₂", "CaCO₃ → Ca + C + O₃", "CaCO₃ → CaO₂ + C", "CaO + CO₂ → CaCO₃"],
    why: { "CaCO₃ → Ca + C + O₃": tr("Es entstehen Calciumoxid und Kohlendioxid, nicht die Elemente.", "Calcium oxide and carbon dioxide form, not the elements."), "CaCO₃ → CaO₂ + C": tr("Calciumoxid ist CaO, Kohlendioxid CO₂.", "Calcium oxide is CaO, carbon dioxide CO₂."), "CaO + CO₂ → CaCO₃": tr("Calciumcarbonat ist das Edukt – es steht links.", "Calcium carbonate is the reactant – it goes on the left.") },
    ok: tr("Zerlegung: CaCO₃ → CaO + CO₂.", "Decomposition: CaCO₃ → CaO + CO₂."),
  },
];

export function guideFor(stufe: "us" | "os"): GuideDef {
  return stufe === "us"
    ? { title: tr("Reaktionsgleichungen", "Chemical Equations"), steps: US, outro: [
      tr("Massenerhaltung: links und rechts gleich viele Atome von jeder Sorte.", "Conservation of mass: the same number of atoms of each kind on the left and right."),
      tr("Formeln nie ändern – nur **Zahlen davor** setzen.", "Never change formulas – only put **numbers in front**."),
      tr("Zahl davor × kleine Zahl = Atome (3 C₃H₈ → 24 H).", "Number in front × small number = atoms (3 C₃H₈ → 24 H)."),
      tr("Verbrennung: C, H, zuletzt O. Halbe Zahl → alles verdoppeln.", "Combustion: C, H, O last. Half number → double everything."),
      tr("Edukte links, Produkte rechts; Wortgleichung → Formelgleichung.", "Reactants left, products right; word equation → formula equation."),
    ] }
    : { title: tr("Reaktionsgleichungen", "Chemical Equations"), steps: OS, outro: [
      tr("Klammern: Zahl dahinter gilt für die ganze Gruppe (Ca(NO₃)₂ → 6 O).", "Brackets: the number after applies to the whole group (Ca(NO₃)₂ → 6 O)."),
      tr("Mehratomige Ionen als Block ausgleichen (Salze, Säuren, Fällung).", "Balance polyatomic ions as a block (salts, acids, precipitation)."),
      tr("Verbrennung und große Gleichungen: H und O zuletzt, mit H prüfen.", "Combustion and large equations: H and O last, check with H."),
      tr("Halbe Zahlen verdoppeln, am Ende kürzen.", "Double half numbers, simplify at the end."),
    ] };
}
