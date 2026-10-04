// Geführte Erklärung Reaktionsgleichungen: Teilchenbild der App (Kalotten) und die einzeilige Gleichung.
// Atome zählen, Koeffizient an die richtige Stelle setzen (Stoff antippen), ausgleichen, Wortgleichung, Klammern, kürzen.
// Level I in Kapiteln: erst vorhersagen, dann den Übergang Edukte → Produkte als Animation ansehen bzw. selbst mit dem Regler steuern.

import type { GuideCtx, GuideDef, GuideStep } from "@lern/ui";
import { toSubscript, type Equation } from "@lern/chem";
import { FitLine } from "./components/Equation.tsx";
import { MoleculeScene } from "./components/Molecules.tsx";
import { ReactionMorph } from "./components/Morph.tsx";
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

/** eine Formel groß, mit Koeffizient davor */
const Formula = ({ f, k }: { f: string; k: number }) => <div className="rg-g rg-g-only"><FitLine text={`${k > 1 ? `${k} ` : ""}${toSubscript(f)}`} base={30} /></div>;

const eqOf = (l: string[], r: string[]): Equation => ({ left: l, right: r });

/** Animation Edukte → Produkte; vor der Vorhersage nur das Bild der Edukte (ohne Regler), danach spielt sie ab */
const Watch = ({ c, eq, k, predict }: { c: GuideCtx; eq: Equation; k: number[]; predict?: boolean }) => (
  <div className="rg-g">
    <div className="rg-g-scene"><ReactionMorph key={c.solved ? 1 : 0} eq={eq} coeffs={k} controls={!predict || c.solved} autoplay={c.solved} /></div>
    <FitLine text={text(eq, k)} />
  </div>
);

/** selbst abspielen oder den Regler zu den Produkten ziehen (Ziel „end“) */
const Drive = ({ c, eq, k }: { c: GuideCtx; eq: Equation; k: number[] }) => (
  <div className="rg-g">
    <div className="rg-g-scene"><ReactionMorph eq={eq} coeffs={k} onEnd={() => c.pick("end")} /></div>
    <FitLine text={text(eq, k)} />
  </div>
);

const KNALLGAS_OK = [2, 1, 2];
const AMMONIAK: Equation = { left: ["N2", "H2"], right: ["NH3"] }, AMMONIAK_OK = [1, 3, 2];
const METHAN: Equation = { left: ["CH4", "O2"], right: ["CO2", "H2O"] }, METHAN_OK = [1, 2, 1, 2];
const BOXES = () => [{ at: ".ms-box", text: tr("Edukte", "Reactants"), nth: 0, point: "top" as const, side: "above" as const }, { at: ".ms-box", text: tr("Produkte", "Products"), nth: -1, point: "top" as const, side: "above" as const }];


const US = (): GuideStep[] => [
  {
    mode: "worked",
    part: tr("Was passiert?", "What happens?"),
    say: tr("Wasserstoff und Sauerstoff reagieren zu Wasser.", "Hydrogen and oxygen react to form water."),
    ask: tr("Was passiert mit den Atomen bei der Reaktion?", "What happens to the atoms in the reaction?"),
    visual: c => <Watch c={c} eq={KNALLGAS} k={KNALLGAS_OK} />,
    labels: BOXES(),
    lines: [tr("Links die Stoffe vorher: **Edukte** (H₂, O₂). Rechts nachher: **Produkte** (H₂O).", "Left, the substances before: **reactants** (H₂, O₂). Right, after: **products** (H₂O)."), tr("Die Moleküle werden getrennt, die Atome **neu verbunden**.", "The molecules are split, the atoms are **joined in a new way**."), tr("Kein Atom verschwindet, keines kommt dazu.", "No atom disappears, none is added.")],
    ok: tr("Reaktion = Atome neu verbinden.", "Reaction = joining atoms in a new way."),
  },
  {
    mode: "faded",
    say: tr("Die Stoffe vorher heißen **Edukte**, die Stoffe nachher **Produkte**.", "The substances before are called **reactants**, the substances after **products**."),
    ask: tr("Ergänze: Wie viele **H-Atome** sind bei den Edukten?", "Complete: how many **H atoms** are in the reactants?"), answer: 4, num: {},
    visual: () => <Scene eq={KNALLGAS} k={KNALLGAS_OK} />,
    why: { "2": tr("Ein H₂ hat 2 H-Atome – es sind aber zwei H₂-Moleküle.", "One H₂ has 2 H atoms – but there are two H₂ molecules."), "6": tr("Zähle nur bei den Edukten, links.", "Count only in the reactants, on the left.") },
    tip: tr("Zähle die kleinen weißen Kugeln im linken Kasten.", "Count the small white balls in the left box."),
    labels: BOXES(),
    ok: tr("Edukte: 4 H-Atome.", "Reactants: 4 H atoms."),
    lines: [tr("2 H₂-Moleküle mit je 2 H: 2 · 2 = {?}", "2 H₂ molecules with 2 H each: 2 · 2 = {?}")],
  },
  {
    mode: "free",
    ask: tr("Und wie viele H-Atome sind bei den **Produkten**?", "And how many H atoms are in the **products**?"), answer: 4, num: {},
    visual: () => <Scene eq={KNALLGAS} k={KNALLGAS_OK} />,
    why: { "2": tr("Jedes Wasser-Molekül hat 2 H – und es sind zwei Moleküle.", "Each water molecule has 2 H – and there are two molecules.") },
    tip: tr("Zähle die weißen Kugeln im rechten Kasten.", "Count the white balls in the right box."),
    labels: BOXES(),
    ok: tr("Vorher 4 H, nachher 4 H – gleich viele.", "4 H before, 4 H after – the same number."),
  },
  {
    mode: "free",
    say: tr("Jetzt bist du dran.", "Now it's your turn."),
    ask: tr("Ziehe den Regler langsam von den **Edukten** zu den **Produkten**.", "Slowly drag the slider from the **reactants** to the **products**."), answer: "end",
    visual: c => <Drive c={c} eq={KNALLGAS} k={KNALLGAS_OK} />,
    tip: tr("Ziehe den Regler unter dem Bild ganz nach rechts – oder tippe auf Abspielen.", "Drag the slider below the picture all the way right – or tap Play."),
    ok: tr("Bindungen brechen, Atome ordnen sich neu, neue Bindungen entstehen.", "Bonds break, atoms regroup, new bonds form."),
    lines: [tr("Im Bild trennen sich die Moleküle und verbinden sich neu.", "In the picture the molecules split and join again.")],
  },
  {
    mode: "free",
    say: tr("Das gilt immer: **Gesetz der Erhaltung der Masse**. Atome werden nur neu verbunden.", "This always holds: **conservation of mass**. Atoms are only joined in a new way."),
    ask: tr("Welche Aussage stimmt für **jede** Reaktion?", "Which statement is true for **every** reaction?"),
    answer: tr("Gleich viele Atome je Sorte", "Same number of each atom"),
    options: [tr("Gleich viele Atome je Sorte", "Same number of each atom"), tr("Gleich viele Moleküle", "Same number of molecules"), tr("Rechts mehr Atome", "More atoms on the right")],
    why: { [tr("Gleich viele Moleküle", "Same number of molecules")]: tr("Vorher 3 Moleküle, nachher 2 – die Atome zählen.", "3 molecules before, 2 after – the atoms are what count."), [tr("Rechts mehr Atome", "More atoms on the right")]: tr("Es entstehen keine neuen Atome.", "No new atoms form.") },
    ok: tr("Atome bleiben erhalten – Moleküle nicht.", "Atoms are conserved – molecules are not."),
    lines: [tr("Gleich viele Atome jeder Sorte → gleiche Masse.", "Same number of atoms of each kind → same mass.")],
  },
  {
    mode: "worked",
    part: tr("Formeln lesen", "Reading formulas"),
    say: tr("Die **kleine** Zahl (**Index**) gilt für das Atom davor. Die **große** Zahl davor heißt **Koeffizient**.", "The **small** number (**subscript**) belongs to the atom before it. The **big** number in front is the **coefficient**."),
    ask: tr("Wie viele Atome stecken in **3 H₂O**?", "How many atoms are in **3 H₂O**?"),
    visual: () => <Formula f="H2O" k={3} />,
    lines: [tr("H₂O: 2 H und 1 O (die 1 schreibt man nicht).", "H₂O: 2 H and 1 O (the 1 is not written)."), tr("Die 3 davor: 3 Moleküle.", "The 3 in front: 3 molecules."), tr("H: 3 · 2 = **6**, O: 3 · 1 = **3**.", "H: 3 · 2 = **6**, O: 3 · 1 = **3**.")],
    ok: tr("Koeffizient mal Index.", "Coefficient times subscript."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie viele **H-Atome** stecken in **2 NH₃**?", "Complete: how many **H atoms** are in **2 NH₃**?"), answer: 6, num: {},
    visual: () => <Formula f="NH3" k={2} />,
    lines: [tr("Ein NH₃-Molekül: 3 H.", "One NH₃ molecule: 3 H."), tr("2 Moleküle: 2 · 3 = {?}", "2 molecules: 2 · 3 = {?}")],
    why: { "3": tr("3 hat ein Molekül. Es sind 2 Moleküle.", "One molecule has 3. There are 2 molecules."), "5": tr("Malnehmen, nicht addieren: 2 · 3.", "Multiply, do not add: 2 · 3.") },
    tip: tr("Rechne die letzte Zeile aus.", "Work out the last line."),
    ok: tr("2 NH₃: 6 H-Atome.", "2 NH₃: 6 H atoms."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Wie viele H-Atome stecken in **3 C₃H₈**?", "Your turn: how many H atoms are in **3 C₃H₈**?"), answer: 24, num: {},
    visual: () => <Formula f="C3H8" k={3} />,
    why: { "8": tr("Die 3 davor gilt für jedes Atom: 3 · 8.", "The 3 in front applies to every atom: 3 · 8."), "11": tr("Nicht addieren: 3 Moleküle mit je 8 H.", "Don't add: 3 molecules with 8 H each."), "9": tr("9 sind die C-Atome (3 · 3).", "9 are the C atoms (3 · 3).") },
    tip: tr("Zahl davor mal kleine Zahl hinter dem H.", "Number in front times the small number after H."),
    ok: tr("Koeffizient · Index: 3 · 8 = 24 H-Atome.", "Coefficient · subscript: 3 · 8 = 24 H atoms."),
    lines: [tr("C₃H₈ hat 8 H; 3 · 8 = 24.", "C₃H₈ has 8 H; 3 · 8 = 24.")],
  },
  {
    mode: "worked",
    part: tr("Ausgleichen", "Balancing"),
    say: tr("Links und rechts müssen gleich viele Atome jeder Sorte stehen.", "Left and right must have the same number of atoms of each kind."),
    ask: tr("Wie gleicht man H₂ + O₂ → H₂O aus?", "How do you balance H₂ + O₂ → H₂O?"),
    visual: () => <Scene eq={KNALLGAS} k={KNALLGAS_OK} />,
    lines: [tr("O zählen: links 2, rechts 1 → stimmt nicht.", "Count O: left 2, right 1 → does not match."), tr("Nie den Index ändern (sonst ein anderer Stoff) – nur Koeffizienten setzen.", "Never change a subscript (that makes another substance) – only set coefficients."), tr("2 vor H₂O → rechts 2 O, aber jetzt 4 H.", "2 in front of H₂O → 2 O on the right, but now 4 H."), tr("2 vor H₂ → links 4 H: **2 H₂ + O₂ → 2 H₂O** ✓", "2 in front of H₂ → 4 H on the left: **2 H₂ + O₂ → 2 H₂O** ✓")],
    ok: tr("Zählen, Koeffizient setzen, neu zählen – bis alles stimmt.", "Count, set a coefficient, count again – until everything matches."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Welche Zahl gehört vor **H₂**?", "Complete: which number goes in front of **H₂**?"), answer: 3, num: {},
    visual: c => (c.solved ? <Watch c={c} eq={AMMONIAK} k={AMMONIAK_OK} /> : <Line eq={AMMONIAK} k={[1, null, 2]} />),
    why: { "6": tr("6 H₂ wären 12 H-Atome. Jedes H₂ hat zwei.", "6 H₂ would be 12 H atoms. Each H₂ has two."), "2": tr("2 H₂ sind nur 4 H.", "2 H₂ are only 4 H.") },
    tip: tr("Du brauchst links 6 H. Wie viele H₂ sind das?", "You need 6 H on the left. How many H₂ is that?"),
    ok: tr("**N₂ + 3 H₂ → 2 NH₃** – schau zu, ob alles aufgeht.", "**N₂ + 3 H₂ → 2 NH₃** – watch whether everything works out."),
    lines: [tr("N₂ + ? H₂ → 2 NH₃: N links 2, rechts 2 ✓.", "N₂ + ? H₂ → 2 NH₃: N left 2, right 2 ✓."), tr("H rechts: 2 · 3 = 6.", "H right: 2 · 3 = 6."), tr("Links in H₂: 6 : 2 = {?}", "Left in H₂: 6 : 2 = {?}")],
  },
  {
    mode: "free",
    ask: tr("Darf man H₂O einfach in **H₂O₂** ändern?", "May you simply change H₂O to **H₂O₂**?"),
    answer: tr("Nein – das wäre ein anderer Stoff", "No – that would be a different substance"),
    options: [tr("Nein – das wäre ein anderer Stoff", "No – that would be a different substance"), tr("Ja – dann stimmt O", "Yes – then O matches")],
    visual: () => <Line eq={KNALLGAS} k={[1, 1, 1]} />,
    why: { [tr("Ja – dann stimmt O", "Yes – then O matches")]: tr("H₂O₂ ist Wasserstoffperoxid, nicht Wasser. Formeln bleiben, wie sie sind.", "H₂O₂ is hydrogen peroxide, not water. Formulas stay as they are.") },
    ok: tr("Formeln nie ändern – nur **Koeffizienten** davor setzen.", "Never change formulas – only put **coefficients** in front."),
    lines: [tr("H₂O₂ ist Wasserstoffperoxid – ein anderer Stoff. Nur Koeffizienten ändern.", "H₂O₂ is hydrogen peroxide – a different substance. Only change coefficients.")],
  },
  {
    mode: "free",
    ask: tr("Ist **Fe + 2 S → FeS** ausgeglichen?", "Is **Fe + 2 S → FeS** balanced?"), answer: tr("Nein – S stimmt nicht", "No – S does not match"), options: [tr("Ja", "Yes"), tr("Nein – S stimmt nicht", "No – S does not match"), tr("Nein – Fe stimmt nicht", "No – Fe does not match")],
    visual: () => <Line eq={eqOf(["Fe", "S"], ["FeS"])} k={[1, 2, 1]} />,
    why: { [tr("Ja", "Yes")]: tr("Links 2 S, rechts nur 1 S.", "2 S on the left, only 1 S on the right."), [tr("Nein – Fe stimmt nicht", "No – Fe does not match")]: tr("Fe: links 1, rechts 1 – stimmt.", "Fe: 1 on the left, 1 on the right – correct.") },
    ok: tr("Richtig wäre Fe + S → FeS.", "Correct would be Fe + S → FeS."),
    lines: [tr("S: links 2, rechts 1 → nicht ausgeglichen. Richtig: Fe + S → FeS.", "S: left 2, right 1 → not balanced. Correct: Fe + S → FeS.")],
  },
  {
    mode: "free",
    ask: tr("Welche Zahl gehört vor **Mg**?", "Which number goes in front of **Mg**?"), answer: 2, num: {},
    visual: () => <Line eq={eqOf(["Mg", "CO2"], ["MgO", "C"])} k={[null, 1, 2, 1]} />,
    why: { "1": tr("Rechts sind 2 Mg (in 2 MgO).", "There are 2 Mg on the right (in 2 MgO).") },
    tip: tr("Zähle die Mg-Atome rechts – die Zahl vor MgO gilt mit.", "Count the Mg atoms on the right – the number in front of MgO counts too."),
    ok: tr("**2 Mg** + CO₂ → 2 MgO + C.", "**2 Mg** + CO₂ → 2 MgO + C."),
  },
  {
    mode: "worked",
    part: tr("Verbrennung", "Combustion"),
    say: tr("Verbrennungen: erst C, dann H, **zuletzt O** ausgleichen.", "Combustions: balance C first, then H, **O last**."),
    ask: tr("Wie gleicht man die Verbrennung von Methan aus?", "How do you balance the combustion of methane?"),
    visual: () => <Scene eq={METHAN} k={METHAN_OK} />,
    lines: [tr("C: links 1 → 1 CO₂.", "C: 1 on the left → 1 CO₂."), tr("H: links 4 → 2 H₂O.", "H: 4 on the left → 2 H₂O."), tr("O rechts: 2 + 2 = 4 → 2 O₂.", "O right: 2 + 2 = 4 → 2 O₂."), tr("**CH₄ + 2 O₂ → CO₂ + 2 H₂O**", "**CH₄ + 2 O₂ → CO₂ + 2 H₂O**")],
    ok: tr("O zuletzt, weil es in mehreren Produkten steckt.", "O last, because it is in several products."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Ethen verbrennt. Welche Zahl gehört vor **O₂**?", "Complete: ethene burns. Which number goes in front of **O₂**?"), answer: 3, num: {},
    visual: () => <Line eq={eqOf(["C2H4", "O2"], ["CO2", "H2O"])} k={[1, null, 2, 2]} />,
    lines: [tr("C: 2 → 2 CO₂. H: 4 → 2 H₂O.", "C: 2 → 2 CO₂. H: 4 → 2 H₂O."), tr("O rechts: 2 · 2 + 2 = 6.", "O right: 2 · 2 + 2 = 6."), tr("O₂ davor: 6 : 2 = {?}", "O₂ in front: 6 : 2 = {?}")],
    why: { "6": tr("6 sind O-Atome. Jedes O₂ bringt 2.", "6 is the number of O atoms. Each O₂ brings 2.") },
    tip: tr("Rechne die letzte Zeile aus.", "Work out the last line."),
    ok: tr("C₂H₄ + 3 O₂ → 2 CO₂ + 2 H₂O.", "C₂H₄ + 3 O₂ → 2 CO₂ + 2 H₂O."),
  },
  {
    mode: "free",
    say: tr("Aus der **Wortgleichung** wird die Formelgleichung. Edukte links, Produkte rechts.", "The **word equation** becomes the formula equation. Reactants left, products right."),
    ask: tr("Welche Gleichung passt zu: **Stickstoff + Wasserstoff → Ammoniak**?", "Which equation matches: **nitrogen + hydrogen → ammonia**?"), answer: "N₂ + 3 H₂ → 2 NH₃",
    options: ["N₂ + 3 H₂ → 2 NH₃", "N + 3 H → NH₃", "N₂ + H₂ → NH₃", "2 NH₃ → N₂ + 3 H₂"],
    why: { "N + 3 H → NH₃": tr("Stickstoff und Wasserstoff kommen als Moleküle N₂ und H₂ vor.", "Nitrogen and hydrogen occur as the molecules N₂ and H₂."), "N₂ + H₂ → NH₃": tr("Nicht ausgeglichen: links 2 N, rechts 1 N.", "Not balanced: 2 N on the left, 1 N on the right."), "2 NH₃ → N₂ + 3 H₂": tr("Ammoniak ist das Produkt – es steht rechts.", "Ammonia is the product – it goes on the right.") },
    ok: tr("Edukte N₂ und H₂, Produkt NH₃.", "Reactants N₂ and H₂, product NH₃."),
    lines: [tr("Wortgleichung → Formeln einsetzen → ausgleichen.", "Word equation → put in formulas → balance.")],
  },
  {
    mode: "worked",
    say: tr("Manchmal ergibt sich eine **halbe** Zahl.", "Sometimes a **half** number comes out."),
    ask: tr("Wie gleicht man Al + HCl → AlCl₃ + H₂ aus?", "How do you balance Al + HCl → AlCl₃ + H₂?"),
    visual: () => <Line eq={eqOf(["Al", "HCl"], ["AlCl3", "H2"])} k={[2, 6, 2, 3]} />,
    lines: [tr("Al + 3 HCl → AlCl₃ + 1½ H₂ – Cl und H stimmen.", "Al + 3 HCl → AlCl₃ + 1½ H₂ – Cl and H match."), tr("Halbe Moleküle gibt es nicht → alle Zahlen **verdoppeln**.", "There are no half molecules → **double** all numbers."), tr("**2 Al + 6 HCl → 2 AlCl₃ + 3 H₂**", "**2 Al + 6 HCl → 2 AlCl₃ + 3 H₂**")],
    ok: tr("Halbe Zahl → alles mal 2.", "Half number → everything times 2."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Eisen verbrennt zu Fe₂O₃.", "Complete: iron burns to Fe₂O₃."), answer: 3, num: {},
    visual: () => <Line eq={eqOf(["Fe", "O2"], ["Fe2O3"])} k={[4, null, 2]} />,
    lines: [tr("2 Fe + 1½ O₂ → Fe₂O₃", "2 Fe + 1½ O₂ → Fe₂O₃"), tr("Verdoppeln: 4 Fe + {?} O₂ → 2 Fe₂O₃", "Double: 4 Fe + {?} O₂ → 2 Fe₂O₃")],
    why: { "1.5": tr("Halbe Zahlen gibt es nicht – verdoppeln.", "There are no half numbers – double."), "2": tr("Rechts 2 Fe₂O₃ = 6 O → 3 O₂.", "On the right 2 Fe₂O₃ = 6 O → 3 O₂.") },
    tip: tr("1½ verdoppeln.", "Double 1½."),
    ok: tr("4 Fe + 3 O₂ → 2 Fe₂O₃.", "4 Fe + 3 O₂ → 2 Fe₂O₃."),
  },
];

const PROPAN: Equation = { left: ["C3H8", "O2"], right: ["CO2", "H2O"] }, PROPAN_OK = [1, 5, 3, 4];
const ETHAN: Equation = { left: ["C2H6", "O2"], right: ["CO2", "H2O"] }, ETHAN_OK = [2, 7, 4, 6];

const OS = (): GuideStep[] => [
  {
    mode: "worked",
    part: tr("Warum ausgleichen?", "Why balance?"),
    say: tr("Propan verbrennt: C₃H₈ + ? O₂ → 3 CO₂ + 4 H₂O.", "Propane burns: C₃H₈ + ? O₂ → 3 CO₂ + 4 H₂O."),
    ask: tr("Wie viele O₂ braucht ein Propan-Molekül?", "How many O₂ does one propane molecule need?"),
    visual: c => <Watch c={c} eq={PROPAN} k={PROPAN_OK} />,
    lines: [tr("O rechts: 3 · 2 + 4 · 1 = 10 Atome.", "O right: 3 · 2 + 4 · 1 = 10 atoms."), tr("Jedes O₂ bringt 2 → **5 O₂**.", "Each O₂ brings 2 → **5 O₂**."), tr("Erst ausgeglichen stimmen Atome und Masse – und die Mengen beim Rechnen.", "Only balanced do atoms and mass match – and the amounts in calculations.")],
    ok: tr("Eine Gleichung ist erst mit Koeffizienten vollständig.", "An equation is only complete with coefficients."),
  },
  {
    mode: "worked",
    part: tr("Teilchen zählen", "Counting particles"),
    say: tr("Die Zahl davor gilt für das ganze Teilchen.", "The number in front applies to the whole particle."),
    ask: tr("Wie viele O-Atome stecken in **2 Fe₂O₃**?", "How many O atoms are in **2 Fe₂O₃**?"),
    visual: () => <Formula f="Fe2O3" k={2} />,
    lines: [tr("Fe₂O₃: 3 O-Atome.", "Fe₂O₃: 3 O atoms."), tr("2 Teilchen: 2 · 3 = **6** O.", "2 particles: 2 · 3 = **6** O.")],
    ok: tr("Koeffizient mal Index.", "Coefficient times subscript."),
  },
  {
    mode: "faded",
    say: tr("Eine Zahl hinter der **Klammer** gilt für alles in der Klammer.", "A number after a **bracket** applies to everything in the bracket."),
    ask: tr("Ergänze: Wie viele O-Atome stecken in **Ca(NO₃)₂**?", "Complete: how many O atoms are in **Ca(NO₃)₂**?"), answer: 6, num: {},
    why: { "3": tr("Die 2 hinter der Klammer verdoppelt NO₃: 2 · 3.", "The 2 after the bracket doubles NO₃: 2 · 3."), "5": tr("Nicht addieren: 3 · 2.", "Don't add: 3 · 2.") },
    tip: tr("Zahl hinter der Klammer mal O-Atome in einem NO₃.", "Number after the bracket times O atoms in one NO₃."),
    ok: tr("(NO₃)₂: 2 · 3 = 6 O.", "(NO₃)₂: 2 · 3 = 6 O."),
    lines: [tr("In (NO₃)₂ gilt die 2 für alles in der Klammer.", "In (NO₃)₂ the 2 applies to everything in the bracket."), tr("O: 2 · 3 = {?}", "O: 2 · 3 = {?}")],
  },
  {
    mode: "free",
    ask: tr("Wie viele **Ca**-Atome stecken in **3 Ca₃(PO₄)₂**?", "How many **Ca** atoms are there in **3 Ca₃(PO₄)₂**?"), answer: 9, num: {},
    why: { "3": tr("Ca₃ hat schon 3 – davor steht noch eine 3.", "Ca₃ already has 3 – and there is a 3 in front."), "6": tr("Die 2 gehört zur Klammer (PO₄), nicht zu Ca.", "The 2 belongs to the bracket (PO₄), not to Ca.") },
    tip: tr("Zahl davor mal Index von Ca. Die Zahl hinter der Klammer gilt nur für PO₄.", "Number in front times the subscript of Ca. The number after the bracket only applies to PO₄."),
    ok: tr("3 · 3 = 9 Ca.", "3 · 3 = 9 Ca."),
    lines: [tr("3 · 3 = 9 Ca (die Klammer betrifft nur PO₄).", "3 · 3 = 9 Ca (the bracket only concerns PO₄).")],
  },
  {
    mode: "worked",
    part: tr("Ionen als Block", "Ions as a block"),
    say: tr("Mehratomige Ionen, die erhalten bleiben (SO₄, NO₃, PO₄), zählt man als **Block**.", "Polyatomic ions that stay intact (SO₄, NO₃, PO₄) are counted as a **block**."),
    ask: tr("Wie gleicht man Ca(OH)₂ + HNO₃ → Ca(NO₃)₂ + H₂O aus?", "How do you balance Ca(OH)₂ + HNO₃ → Ca(NO₃)₂ + H₂O?"),
    visual: () => <Line eq={eqOf(["Ca(OH)2", "HNO3"], ["Ca(NO3)2", "H2O"])} k={[1, 2, 1, 2]} />,
    lines: [tr("NO₃ als Block: rechts 2 → 2 HNO₃.", "NO₃ as a block: 2 on the right → 2 HNO₃."), tr("H links: 2 + 2 = 4 → 2 H₂O.", "H left: 2 + 2 = 4 → 2 H₂O."), tr("**Ca(OH)₂ + 2 HNO₃ → Ca(NO₃)₂ + 2 H₂O** – O stimmt von selbst.", "**Ca(OH)₂ + 2 HNO₃ → Ca(NO₃)₂ + 2 H₂O** – O matches by itself.")],
    ok: tr("Blöcke sparen das Zählen einzelner O-Atome.", "Blocks save counting single O atoms."),
  },
  {
    mode: "faded",
    say: tr("Mehratomige Ionen, die erhalten bleiben (SO₄, NO₃, PO₄), zählt man als **Block** – das spart Arbeit.", "Polyatomic ions that stay intact (SO₄, NO₃, PO₄) are counted as a **block** – that saves work."),
    ask: tr("Ergänze: Welche Zahl gehört vor **NaOH**?", "Complete: which number goes in front of **NaOH**?"), answer: 2, num: {},
    visual: () => <Line eq={eqOf(["NaOH", "H2SO4"], ["Na2SO4", "H2O"])} k={[null, 1, 1, 2]} />,
    why: { "1": tr("Rechts sind 2 Na (in Na₂SO₄).", "There are 2 Na on the right (in Na₂SO₄).") },
    tip: tr("Zähle die Na-Atome rechts in Na₂SO₄.", "Count the Na atoms on the right in Na₂SO₄."),
    ok: tr("2 NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O.", "2 NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O."),
    lines: [tr("SO₄ als Block: links 1, rechts 1 ✓.", "SO₄ as a block: 1 left, 1 right ✓."), tr("Na: rechts in Na₂SO₄ zwei → vor NaOH: {?}", "Na: two on the right in Na₂SO₄ → in front of NaOH: {?}")],
  },
  {
    mode: "free",
    ask: tr("**Fällung**: Welche Zahl gehört vor **KI**?", "**Precipitation**: which number goes in front of **KI**?"), answer: 2, num: {},
    visual: () => <Line eq={eqOf(["Pb(NO3)2", "KI"], ["PbI2", "KNO3"])} k={[1, null, 1, 2]} />,
    why: { "1": tr("Rechts 2 I (in PbI₂) und 2 K (in 2 KNO₃).", "2 I on the right (in PbI₂) and 2 K (in 2 KNO₃).") },
    tip: tr("Zähle die I-Atome rechts in PbI₂.", "Count the I atoms on the right in PbI₂."),
    ok: tr("Pb(NO₃)₂ + 2 KI → PbI₂ + 2 KNO₃ (NO₃ als Block).", "Pb(NO₃)₂ + 2 KI → PbI₂ + 2 KNO₃ (NO₃ as a block)."),
  },
  {
    mode: "free",
    ask: tr("Ist **CaCO₃ + HCl → CaCl₂ + H₂O + CO₂** ausgeglichen?", "Is **CaCO₃ + HCl → CaCl₂ + H₂O + CO₂** balanced?"), answer: tr("Nein – H und Cl stimmen nicht", "No – H and Cl do not match"),
    options: [tr("Ja", "Yes"), tr("Nein – H und Cl stimmen nicht", "No – H and Cl do not match"), tr("Nein – O stimmt nicht", "No – O does not match")],
    visual: () => <Line eq={eqOf(["CaCO3", "HCl"], ["CaCl2", "H2O", "CO2"])} k={[1, 1, 1, 1, 1]} />,
    why: { [tr("Ja", "Yes")]: tr("Links 1 Cl, rechts 2 Cl.", "1 Cl on the left, 2 Cl on the right."), [tr("Nein – O stimmt nicht", "No – O does not match")]: tr("O: links 3, rechts 1 + 2 = 3 – stimmt.", "O: 3 on the left, 1 + 2 = 3 on the right – correct.") },
    ok: tr("H und Cl: links je 1, rechts je 2.", "H and Cl: 1 each on the left, 2 each on the right."),
  },
  {
    mode: "free",
    ask: tr("Welche Zahl gehört vor **HCl**?", "Which number goes in front of **HCl**?"), answer: 2, num: {},
    visual: () => <Line eq={eqOf(["CaCO3", "HCl"], ["CaCl2", "H2O", "CO2"])} k={[1, null, 1, 1, 1]} />,
    why: { "1": tr("Rechts stehen 2 Cl in CaCl₂ – links braucht es genauso viele.", "There are 2 Cl in CaCl₂ on the right – the left needs just as many.") },
    tip: tr("Zähle die Cl-Atome rechts in CaCl₂.", "Count the Cl atoms on the right in CaCl₂."),
    ok: tr("CaCO₃ + 2 HCl → CaCl₂ + H₂O + CO₂ – mit H gegenprüfen: links 2, rechts 2.", "CaCO₃ + 2 HCl → CaCl₂ + H₂O + CO₂ – check with H: 2 on the left, 2 on the right."),
  },
  {
    mode: "free",
    ask: tr("Welcher Stoff ist ein **Edukt**?", "Which substance is a **reactant**?"), answer: "NO₂", options: ["NO₂", "HNO₃", "NO"],
    visual: () => <Line eq={eqOf(["NO2", "H2O"], ["HNO3", "NO"])} k={[3, 1, 2, 1]} />,
    why: { "HNO₃": tr("HNO₃ steht rechts – es ist ein Produkt.", "HNO₃ is on the right – it is a product."), NO: tr("NO steht rechts – es ist ein Produkt.", "NO is on the right – it is a product.") },
    ok: tr("Edukte links: NO₂ und H₂O.", "Reactants on the left: NO₂ and H₂O."),
  },
  {
    mode: "worked",
    part: tr("Große Gleichungen", "Large equations"),
    say: tr("Verbrennung: erst C, dann H, zuletzt O. Ergibt sich eine halbe Zahl, **alles verdoppeln**.", "Combustion: first C, then H, O last. If a half number results, **double everything**."),
    ask: tr("Wie gleicht man die Verbrennung von Ethan aus?", "How do you balance the combustion of ethane?"),
    visual: c => <Watch c={c} eq={ETHAN} k={ETHAN_OK} />,
    lines: [tr("C₂H₆: C → 2 CO₂, H → 3 H₂O.", "C₂H₆: C → 2 CO₂, H → 3 H₂O."), tr("O rechts: 4 + 3 = 7 → 3½ O₂.", "O right: 4 + 3 = 7 → 3½ O₂."), tr("Verdoppeln: **2 C₂H₆ + 7 O₂ → 4 CO₂ + 6 H₂O**.", "Double: **2 C₂H₆ + 7 O₂ → 4 CO₂ + 6 H₂O**.")],
    ok: tr("Halbe Zahl → alle Koeffizienten verdoppeln.", "Half number → double all coefficients."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Butan verbrennt. Welche Zahl gehört vor **O₂**?", "Complete: butane burns. Which number goes in front of **O₂**?"), answer: 13, num: {},
    visual: () => <Line eq={eqOf(["C4H10", "O2"], ["CO2", "H2O"])} k={[2, null, 8, 10]} />,
    lines: [tr("2 C₄H₁₀: 8 C → 8 CO₂; 20 H → 10 H₂O.", "2 C₄H₁₀: 8 C → 8 CO₂; 20 H → 10 H₂O."), tr("O rechts: 16 + 10 = 26.", "O right: 16 + 10 = 26."), tr("O₂ davor: 26 : 2 = {?}", "O₂ in front: 26 : 2 = {?}")],
    why: { "26": tr("26 sind O-Atome. Jedes O₂ bringt 2.", "26 is the number of O atoms. Each O₂ brings 2."), "6.5": tr("Mit 2 C₄H₁₀ ist es schon verdoppelt – ganze Zahl.", "With 2 C₄H₁₀ it is already doubled – a whole number.") },
    tip: tr("Rechne die letzte Zeile aus.", "Work out the last line."),
    ok: tr("2 C₄H₁₀ + 13 O₂ → 8 CO₂ + 10 H₂O.", "2 C₄H₁₀ + 13 O₂ → 8 CO₂ + 10 H₂O."),
  },
  {
    mode: "free",
    say: tr("Große Gleichungen: Element für Element, **H und O zuletzt**, mit H gegenprüfen.", "Large equations: element by element, **H and O last**, check with H."),
    ask: tr("Welche Zahl gehört vor **H₂O**?", "Which number goes in front of **H₂O**?"), answer: 4, num: {},
    visual: () => <Line eq={eqOf(["Cu", "HNO3"], ["Cu(NO3)2", "NO", "H2O"])} k={[3, 8, 3, 2, null]} />,
    why: { "8": tr("8 sind die H-Atome links – das sind 4 H₂O.", "8 are the H atoms on the left – that is 4 H₂O."), "2": tr("Links 8 H → rechts 8 H = 4 H₂O.", "8 H on the left → 8 H on the right = 4 H₂O.") },
    tip: tr("Zähle die H-Atome links in 8 HNO₃. Jedes H₂O trägt zwei.", "Count the H atoms on the left in 8 HNO₃. Each H₂O carries two."),
    ok: tr("3 Cu + 8 HNO₃ → 3 Cu(NO₃)₂ + 2 NO + 4 H₂O.", "3 Cu + 8 HNO₃ → 3 Cu(NO₃)₂ + 2 NO + 4 H₂O."),
  },
  {
    mode: "free",
    say: tr("Zum Schluss **kürzen**, wenn alle Zahlen durch dieselbe Zahl teilbar sind.", "Finally **simplify** if all numbers are divisible by the same number."),
    ask: tr("**4 H₂ + 2 O₂ → 4 H₂O** – was ist noch zu tun?", "**4 H₂ + 2 O₂ → 4 H₂O** – what is left to do?"), answer: tr("durch 2 kürzen", "simplify by 2"), options: [tr("durch 2 kürzen", "simplify by 2"), tr("nichts – stimmt so", "nothing – it is correct"), tr("verdoppeln", "double")],
    why: { [tr("nichts – stimmt so", "nothing – it is correct")]: tr("Ausgeglichen ja – aber 4, 2, 4 sind alle durch 2 teilbar.", "Balanced, yes – but 4, 2, 4 are all divisible by 2."), [tr("verdoppeln", "double")]: tr("Verdoppeln nur bei halben Zahlen.", "Only double for half numbers.") },
    ok: tr("2 H₂ + O₂ → 2 H₂O.", "2 H₂ + O₂ → 2 H₂O."),
  },
  {
    mode: "free",
    ask: tr("Welche Gleichung passt zu: **Calciumcarbonat → Calciumoxid + Kohlendioxid**?", "Which equation matches: **calcium carbonate → calcium oxide + carbon dioxide**?"), answer: "CaCO₃ → CaO + CO₂",
    options: ["CaCO₃ → CaO + CO₂", "CaCO₃ → Ca + C + O₃", "CaCO₃ → CaO₂ + C", "CaO + CO₂ → CaCO₃"],
    why: { "CaCO₃ → Ca + C + O₃": tr("Es entstehen Calciumoxid und Kohlendioxid, nicht die Elemente.", "Calcium oxide and carbon dioxide form, not the elements."), "CaCO₃ → CaO₂ + C": tr("Calciumoxid ist CaO, Kohlendioxid CO₂.", "Calcium oxide is CaO, carbon dioxide CO₂."), "CaO + CO₂ → CaCO₃": tr("Calciumcarbonat ist das Edukt – es steht links.", "Calcium carbonate is the reactant – it goes on the left.") },
    ok: tr("Zerlegung: CaCO₃ → CaO + CO₂.", "Decomposition: CaCO₃ → CaO + CO₂."),
  },
];

export function guideFor(stufe: "us" | "os"): GuideDef {
  return stufe === "us"
    ? { title: tr("Reaktionsgleichungen", "Chemical Equations"), steps: US(), outro: [
      tr("Massenerhaltung: links und rechts gleich viele Atome von jeder Sorte.", "Conservation of mass: the same number of atoms of each kind on the left and right."),
      tr("Formeln nie ändern – nur **Zahlen davor** setzen.", "Never change formulas – only put **numbers in front**."),
      tr("Zahl davor × kleine Zahl = Atome (3 C₃H₈ → 24 H).", "Number in front × small number = atoms (3 C₃H₈ → 24 H)."),
      tr("Verbrennung: C, H, zuletzt O. Halbe Zahl → alles verdoppeln.", "Combustion: C, H, O last. Half number → double everything."),
      tr("Edukte links, Produkte rechts; Wortgleichung → Formelgleichung.", "Reactants left, products right; word equation → formula equation."),
    ] }
    : { title: tr("Reaktionsgleichungen", "Chemical Equations"), steps: OS(), outro: [
      tr("Klammern: Zahl dahinter gilt für die ganze Gruppe (Ca(NO₃)₂ → 6 O).", "Brackets: the number after applies to the whole group (Ca(NO₃)₂ → 6 O)."),
      tr("Mehratomige Ionen als Block ausgleichen (Salze, Säuren, Fällung).", "Balance polyatomic ions as a block (salts, acids, precipitation)."),
      tr("Verbrennung und große Gleichungen: H und O zuletzt, mit H prüfen.", "Combustion and large equations: H and O last, check with H."),
      tr("Halbe Zahlen verdoppeln, am Ende kürzen.", "Double half numbers, simplify at the end."),
    ] };
}
