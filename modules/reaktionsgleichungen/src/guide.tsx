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

const YES = () => tr("Sie werden neu verbunden.", "They are joined in a new way."), GONE = () => tr("Einige verschwinden.", "Some disappear."), NEW = () => tr("Neue Atome entstehen.", "New atoms form.");

const US = (): GuideStep[] => [
  // ── Kapitel 1: Was passiert bei einer Reaktion? ──
  {
    part: tr("Was passiert?", "What happens?"),
    say: tr("Wasserstoff und Sauerstoff reagieren zu Wasser. Links siehst du die Teilchen **vorher**.", "Hydrogen and oxygen react to form water. On the left you see the particles **before**."),
    ask: tr("Was passiert mit den Atomen bei der Reaktion? Sag es vorher!", "What happens to the atoms in the reaction? Predict it!"), answer: YES(), options: [YES(), GONE(), NEW()],
    visual: c => <Watch c={c} eq={KNALLGAS} k={KNALLGAS_OK} predict />,
    why: { [GONE()]: tr("Atome können nicht verschwinden. Schau gleich genau hin.", "Atoms cannot disappear. Watch closely in a moment."), [NEW()]: tr("Bei einer Reaktion entstehen keine neuen Atome.", "No new atoms form in a reaction.") },
    ok: tr("Schau zu: Die Atome lösen sich und finden **neue Partner**.", "Watch: the atoms separate and find **new partners**."),
  },
  {
    say: tr("Jetzt bist du dran.", "Now it's your turn."),
    ask: tr("Ziehe den Regler langsam von den **Edukten** zu den **Produkten**.", "Slowly drag the slider from the **reactants** to the **products**."), answer: "end",
    visual: c => <Drive c={c} eq={KNALLGAS} k={KNALLGAS_OK} />,
    tip: tr("Ziehe den Regler unter dem Bild ganz nach rechts – oder tippe auf Abspielen.", "Drag the slider below the picture all the way right – or tap Play."),
    ok: tr("Bindungen brechen, Atome ordnen sich neu, neue Bindungen entstehen.", "Bonds break, atoms regroup, new bonds form."),
  },
  {
    say: tr("Die Stoffe vorher heißen **Edukte**, die Stoffe nachher **Produkte**.", "The substances before are called **reactants**, the substances after **products**."),
    ask: tr("Zähle die weißen **H-Atome** bei den **Edukten**.", "Count the white **H atoms** in the **reactants**."), answer: 4, num: {},
    visual: () => <Scene eq={KNALLGAS} k={KNALLGAS_OK} />,
    why: { "2": tr("Ein H₂ hat 2 H-Atome – es sind aber zwei H₂-Moleküle.", "One H₂ has 2 H atoms – but there are two H₂ molecules."), "6": tr("Zähle nur bei den Edukten, links.", "Count only in the reactants, on the left.") },
    tip: tr("Zähle die kleinen weißen Kugeln im linken Kasten.", "Count the small white balls in the left box."),
    labels: BOXES(),
    ok: tr("Edukte: 4 H-Atome.", "Reactants: 4 H atoms."),
  },
  {
    ask: tr("Und wie viele H-Atome sind bei den **Produkten**?", "And how many H atoms are in the **products**?"), answer: 4, num: {},
    visual: () => <Scene eq={KNALLGAS} k={KNALLGAS_OK} />,
    why: { "2": tr("Jedes Wasser-Molekül hat 2 H – und es sind zwei Moleküle.", "Each water molecule has 2 H – and there are two molecules.") },
    tip: tr("Zähle die weißen Kugeln im rechten Kasten.", "Count the white balls in the right box."),
    labels: BOXES(),
    ok: tr("Vorher 4 H, nachher 4 H – gleich viele.", "4 H before, 4 H after – the same number."),
  },
  {
    say: tr("Das gilt immer: **Gesetz der Erhaltung der Masse**. Atome werden nur neu verbunden.", "This always holds: **conservation of mass**. Atoms are only joined in a new way."),
    ask: tr("Welche Aussage stimmt für **jede** Reaktion?", "Which statement is true for **every** reaction?"),
    answer: tr("Gleich viele Atome je Sorte", "Same number of each atom"),
    options: [tr("Gleich viele Atome je Sorte", "Same number of each atom"), tr("Gleich viele Moleküle", "Same number of molecules"), tr("Rechts mehr Atome", "More atoms on the right")],
    why: { [tr("Gleich viele Moleküle", "Same number of molecules")]: tr("Vorher 3 Moleküle, nachher 2 – die Atome zählen.", "3 molecules before, 2 after – the atoms are what count."), [tr("Rechts mehr Atome", "More atoms on the right")]: tr("Es entstehen keine neuen Atome.", "No new atoms form.") },
    ok: tr("Atome bleiben erhalten – Moleküle nicht.", "Atoms are conserved – molecules are not."),
  },
  // ── Kapitel 2: Zahlen in Formeln lesen ──
  {
    part: tr("Formeln lesen", "Reading formulas"),
    say: tr("Die **kleine** Zahl hinter einem Atom sagt, wie oft es im Molekül vorkommt.", "The **small** number after an atom tells how often it occurs in the molecule."),
    ask: tr("Wie viele H-Atome hat **ein** Molekül **H₂O**?", "How many H atoms does **one** **H₂O** molecule have?"), answer: 2, num: {},
    visual: () => <Formula f="H2O" k={1} />,
    why: { "1": tr("Die kleine 2 gehört zum H: H₂.", "The small 2 belongs to H: H₂."), "3": tr("3 sind alle Atome (2 H + 1 O).", "3 is all atoms (2 H + 1 O).") },
    tip: tr("Schau auf die kleine Zahl direkt hinter dem H.", "Look at the small number right after the H."),
    ok: tr("H₂O: 2 H und 1 O (die 1 schreibt man nicht).", "H₂O: 2 H and 1 O (the 1 is not written)."),
  },
  {
    say: tr("Die **große** Zahl davor heißt **Koeffizient**. Sie sagt, wie viele Moleküle es sind.", "The **large** number in front is the **coefficient**. It tells how many molecules there are."),
    ask: tr("Wie viele Wasser-**Moleküle** sind **3 H₂O**?", "How many water **molecules** are **3 H₂O**?"), answer: 3, num: {},
    visual: () => <Formula f="H2O" k={3} />,
    why: { "2": tr("Die kleine 2 gehört zum H. Die große Zahl zählt Moleküle.", "The small 2 belongs to H. The large number counts molecules."), "9": tr("Gefragt sind Moleküle, nicht Atome.", "The question asks for molecules, not atoms.") },
    tip: tr("Schau auf die große Zahl vor der Formel.", "Look at the large number in front of the formula."),
    ok: tr("3 H₂O = drei Wasser-Moleküle.", "3 H₂O = three water molecules."),
  },
  {
    ask: tr("Wie viele **H-Atome** stecken in **3 H₂O**?", "How many **H atoms** are in **3 H₂O**?"), answer: 6, num: {},
    visual: () => <Formula f="H2O" k={3} />,
    why: { "5": tr("Nicht addieren: 3 Moleküle mit je 2 H.", "Don't add: 3 molecules with 2 H each."), "2": tr("2 H hat **ein** Molekül – es sind drei.", "**One** molecule has 2 H – there are three."), "3": tr("3 ist die Zahl der Moleküle.", "3 is the number of molecules.") },
    tip: tr("Koeffizient mal kleine Zahl.", "Coefficient times small number."),
    ok: tr("3 · 2 = 6 H-Atome.", "3 · 2 = 6 H atoms."),
  },
  {
    ask: tr("Wie viele H-Atome stecken in **3 C₃H₈**?", "How many H atoms are in **3 C₃H₈**?"), answer: 24, num: {},
    visual: () => <Formula f="C3H8" k={3} />,
    why: { "8": tr("Die 3 davor gilt für jedes Atom: 3 · 8.", "The 3 in front applies to every atom: 3 · 8."), "11": tr("Nicht addieren: 3 Moleküle mit je 8 H.", "Don't add: 3 molecules with 8 H each."), "9": tr("9 sind die C-Atome (3 · 3).", "9 are the C atoms (3 · 3).") },
    tip: tr("Zahl davor mal kleine Zahl hinter dem H.", "Number in front times the small number after H."),
    ok: tr("Koeffizient · Index: 3 · 8 = 24 H-Atome.", "Coefficient · subscript: 3 · 8 = 24 H atoms."),
  },
  // ── Kapitel 3: Ausgleichen – vorgemacht ──
  {
    part: tr("Ausgleichen", "Balancing"),
    say: tr("Jetzt fehlen die Zahlen. Wir gleichen gemeinsam aus.", "Now the numbers are missing. Let's balance together."),
    ask: tr("Zähle die **roten** O-Atome bei den **Edukten**.", "Count the **red** O atoms in the **reactants**."), answer: 2, num: {},
    visual: () => <Scene eq={KNALLGAS} k={[1, 1, 1]} />,
    why: { "1": tr("Ein O₂-Molekül hat 2 O-Atome.", "An O₂ molecule has 2 O atoms."), "3": tr("Zähle nur bei den Edukten.", "Count only in the reactants.") },
    tip: tr("Ein O₂-Molekül besteht aus zwei roten Kugeln.", "An O₂ molecule consists of two red balls."),
    labels: BOXES(),
    ok: tr("Edukte: 2 O-Atome.", "Reactants: 2 O atoms."),
  },
  {
    ask: tr("Und bei den **Produkten**?", "And in the **products**?"), answer: 1, num: {},
    visual: () => <Scene eq={KNALLGAS} k={[1, 1, 1]} />,
    why: { "2": tr("Bei den Produkten ist nur ein H₂O mit einem O-Atom.", "The products have only one H₂O with one O atom.") },
    tip: tr("Zähle die roten Kugeln im rechten Kasten.", "Count the red balls in the right box."),
    labels: BOXES(),
    ok: tr("2 O gegen 1 O: noch **nicht ausgeglichen**.", "2 O against 1 O: **not balanced** yet."),
  },
  {
    ask: tr("Darf man H₂O einfach in **H₂O₂** ändern?", "May you simply change H₂O to **H₂O₂**?"),
    answer: tr("Nein – das wäre ein anderer Stoff", "No – that would be a different substance"),
    options: [tr("Nein – das wäre ein anderer Stoff", "No – that would be a different substance"), tr("Ja – dann stimmt O", "Yes – then O matches")],
    visual: () => <Line eq={KNALLGAS} k={[1, 1, 1]} />,
    why: { [tr("Ja – dann stimmt O", "Yes – then O matches")]: tr("H₂O₂ ist Wasserstoffperoxid, nicht Wasser. Formeln bleiben, wie sie sind.", "H₂O₂ is hydrogen peroxide, not water. Formulas stay as they are.") },
    ok: tr("Formeln nie ändern – nur **Koeffizienten** davor setzen.", "Never change formulas – only put **coefficients** in front."),
  },
  {
    ask: tr("Vor welchen Stoff muss eine **2**, damit rechts 2 O-Atome stehen? Tippe ihn an.", "Which substance needs a **2** so that there are 2 O atoms on the right? Tap it."), answer: "2",
    visual: c => <Pick c={c} eq={KNALLGAS} k={[1, 1, 1]} answer={2} />,
    why: { "0": tr("Vor H₂ ändert sich die Zahl der O-Atome nicht.", "In front of H₂ the number of O atoms does not change."), "1": tr("Links stimmt O schon. Rechts fehlt ein O.", "O is already right on the left. One O is missing on the right.") },
    tip: tr("Suche rechts den Stoff, der O-Atome enthält.", "Find the substance on the right that contains O atoms."),
    labels: BOXES(),
    ok: tr("2 H₂O: rechts jetzt 2 O – aber auch 4 H.", "2 H₂O: now 2 O on the right – but also 4 H."),
  },
  {
    ask: tr("Rechts sind jetzt **4 H**. Welche Zahl gehört vor **H₂**?", "There are now **4 H** on the right. Which number goes in front of **H₂**?"), answer: 2, num: {},
    visual: () => <Scene eq={KNALLGAS} k={[1, 1, 2]} />,
    why: { "4": tr("Ein H₂ hat schon 2 H-Atome: 2 · 2 = 4.", "One H₂ already has 2 H atoms: 2 · 2 = 4."), "1": tr("Links wären dann nur 2 H.", "Then there would only be 2 H on the left.") },
    tip: tr("Links brauchst du so viele H wie rechts. Jedes H₂ bringt zwei.", "You need as many H on the left as on the right. Each H₂ brings two."),
    labels: BOXES(),
    ok: tr("2 H₂: links 4 H, rechts 4 H.", "2 H₂: 4 H on the left, 4 H on the right."),
  },
  {
    ask: tr("Ist **2 H₂ + O₂ → 2 H₂O** jetzt ausgeglichen?", "Is **2 H₂ + O₂ → 2 H₂O** balanced now?"), answer: tr("Ja – H und O stimmen", "Yes – H and O match"),
    options: [tr("Ja – H und O stimmen", "Yes – H and O match"), tr("Nein – H stimmt nicht", "No – H does not match"), tr("Nein – O stimmt nicht", "No – O does not match")],
    visual: c => <Watch c={c} eq={KNALLGAS} k={KNALLGAS_OK} predict />,
    why: { [tr("Nein – H stimmt nicht", "No – H does not match")]: tr("Links 2 · 2 = 4 H, rechts 2 · 2 = 4 H.", "Left 2 · 2 = 4 H, right 2 · 2 = 4 H."), [tr("Nein – O stimmt nicht", "No – O does not match")]: tr("Links 2 O, rechts 2 · 1 = 2 O.", "Left 2 O, right 2 · 1 = 2 O.") },
    ok: tr("Schau zu: Jedes Atom findet seinen Platz – keines bleibt übrig.", "Watch: every atom finds its place – none is left over."),
  },
  // ── Kapitel 4: Jetzt du ──
  {
    part: tr("Jetzt du", "Your turn"),
    say: tr("Stickstoff und Wasserstoff reagieren zu Ammoniak: N₂ + ? H₂ → 2 NH₃.", "Nitrogen and hydrogen react to form ammonia: N₂ + ? H₂ → 2 NH₃."),
    ask: tr("Wie viele **H-Atome** stehen rechts in **2 NH₃**?", "How many **H atoms** are on the right in **2 NH₃**?"), answer: 6, num: {},
    visual: () => <Line eq={AMMONIAK} k={[1, null, 2]} />,
    why: { "3": tr("3 H hat **ein** NH₃ – es sind zwei.", "**One** NH₃ has 3 H – there are two."), "5": tr("Nicht addieren: 2 · 3.", "Don't add: 2 · 3.") },
    tip: tr("Koeffizient mal kleine Zahl hinter dem H.", "Coefficient times the small number after H."),
    ok: tr("Rechts: 2 · 3 = 6 H.", "Right: 2 · 3 = 6 H."),
  },
  {
    ask: tr("Welche Zahl gehört vor **H₂**?", "Which number goes in front of **H₂**?"), answer: 3, num: {},
    visual: c => (c.solved ? <Watch c={c} eq={AMMONIAK} k={AMMONIAK_OK} /> : <Line eq={AMMONIAK} k={[1, null, 2]} />),
    why: { "6": tr("6 H₂ wären 12 H-Atome. Jedes H₂ hat zwei.", "6 H₂ would be 12 H atoms. Each H₂ has two."), "2": tr("2 H₂ sind nur 4 H.", "2 H₂ are only 4 H.") },
    tip: tr("Du brauchst links 6 H. Wie viele H₂ sind das?", "You need 6 H on the left. How many H₂ is that?"),
    ok: tr("**N₂ + 3 H₂ → 2 NH₃** – schau zu, ob alles aufgeht.", "**N₂ + 3 H₂ → 2 NH₃** – watch whether everything works out."),
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
  // ── Kapitel 5: Verbrennung und halbe Zahlen ──
  {
    part: tr("Verbrennung", "Combustion"),
    say: tr("Verbrennungen: erst C, dann H, **zuletzt O** ausgleichen. Hier stimmen C und H schon.", "Combustion: balance C first, then H, **O last**. Here C and H already match."),
    ask: tr("Wie viele **O-Atome** stehen rechts?", "How many **O atoms** are on the right?"), answer: 4, num: {},
    visual: () => <Line eq={METHAN} k={[1, null, 1, 2]} />,
    why: { "3": tr("CO₂ hat 2 O, und 2 H₂O haben 2 O.", "CO₂ has 2 O, and 2 H₂O have 2 O."), "2": tr("Zähle auch die O in 2 H₂O.", "Also count the O in 2 H₂O.") },
    tip: tr("Zähle die O in CO₂ und in 2 H₂O, dann zusammenzählen.", "Count the O in CO₂ and in 2 H₂O, then add up."),
    ok: tr("Rechts: 2 + 2 = 4 O-Atome.", "Right: 2 + 2 = 4 O atoms."),
  },
  {
    ask: tr("Welche Zahl gehört vor **O₂**?", "Which number goes in front of **O₂**?"), answer: 2, num: {},
    visual: c => (c.solved ? <Watch c={c} eq={METHAN} k={METHAN_OK} /> : <Line eq={METHAN} k={[1, null, 1, 2]} />),
    why: { "4": tr("4 O-Atome sind 2 O₂-Moleküle.", "4 O atoms are 2 O₂ molecules."), "1": tr("1 O₂ hat nur 2 O-Atome.", "1 O₂ has only 2 O atoms.") },
    tip: tr("Jedes O₂ bringt zwei O-Atome.", "Each O₂ brings two O atoms."),
    ok: tr("**CH₄ + 2 O₂ → CO₂ + 2 H₂O** – Methan verbrennt.", "**CH₄ + 2 O₂ → CO₂ + 2 H₂O** – methane burns."),
  },
  {
    say: tr("Aus der **Wortgleichung** wird die Formelgleichung. Edukte links, Produkte rechts.", "The **word equation** becomes the formula equation. Reactants left, products right."),
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

const PROPAN: Equation = { left: ["C3H8", "O2"], right: ["CO2", "H2O"] }, PROPAN_OK = [1, 5, 3, 4];
const ETHAN: Equation = { left: ["C2H6", "O2"], right: ["CO2", "H2O"] }, ETHAN_OK = [2, 7, 4, 6];
const O5 = "5", O3 = "3", O10 = "10";

const OS = (): GuideStep[] => [
  {
    part: tr("Warum ausgleichen?", "Why balance?"),
    say: tr("Propan verbrennt: C₃H₈ + ? O₂ → 3 CO₂ + 4 H₂O.", "Propane burns: C₃H₈ + ? O₂ → 3 CO₂ + 4 H₂O."),
    ask: tr("Wie viele O₂ braucht ein Propan-Molekül? Schätze!", "How many O₂ does one propane molecule need? Estimate!"), answer: O5, options: [O3, O5, O10],
    visual: c => <Watch c={c} eq={PROPAN} k={PROPAN_OK} predict />,
    why: { [O3]: tr("Rechts sind 6 + 4 = 10 O-Atome. 3 O₂ haben nur 6.", "On the right there are 6 + 4 = 10 O atoms. 3 O₂ have only 6."), [O10]: tr("10 O-**Atome** – jedes O₂ bringt aber zwei.", "10 O **atoms** – but each O₂ brings two.") },
    ok: tr("Schau zu: Alle 10 O-Atome finden einen Platz – genau 5 O₂.", "Watch: all 10 O atoms find a place – exactly 5 O₂."),
  },
  {
    part: tr("Teilchen zählen", "Counting particles"),
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
    part: tr("Ionen als Block", "Ions as a block"),
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
    part: tr("Große Gleichungen", "Large equations"),
    say: tr("Verbrennung: erst C, dann H, zuletzt O. Ergibt sich eine halbe Zahl, **alles verdoppeln**.", "Combustion: first C, then H, O last. If a half number results, **double everything**."),
    ask: tr("Welche Zahl gehört vor **O₂**?", "Which number goes in front of **O₂**?"), answer: 7, num: {},
    visual: c => (c.solved ? <Watch c={c} eq={ETHAN} k={ETHAN_OK} /> : <Line eq={ETHAN} k={[2, null, 4, 6]} />),
    why: { "14": tr("14 sind die O-Atome rechts – das sind 7 O₂.", "14 are the O atoms on the right – that is 7 O₂."), "3.5": tr("Mit 2 C₂H₆ wird es ganzzahlig: 14 O-Atome = 7 O₂.", "With 2 C₂H₆ it becomes whole numbers: 14 O atoms = 7 O₂.") },
    tip: tr("Zähle die O-Atome rechts in 4 CO₂ und 6 H₂O, dann durch 2 teilen.", "Count the O atoms on the right in 4 CO₂ and 6 H₂O, then divide by 2."),
    ok: tr("**2 C₂H₆ + 7 O₂ → 4 CO₂ + 6 H₂O** – schau zu, wie alles aufgeht.", "**2 C₂H₆ + 7 O₂ → 4 CO₂ + 6 H₂O** – watch everything work out."),
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
