// Geführte Erklärung Ionenbindung: Ionen aus dem PSE ableiten, mit der Ionenwand (Breite = Ladung) ausgleichen,
// Formel und Name ablesen. Jeder Schritt verlangt eine Handlung; deckt die Quiz-Aufgaben der Stufe ab.

import { Fit, type GuideCtx, type GuideDef, type GuideStep } from "@lern/ui";
import { ION_BY_ID } from "@lern/chem";
import { Bohr, PeriodicTable } from "@lern/chem-ui";
import { IonWall } from "./components/IonWall.tsx";
import { IonLabel } from "./components/IonTile.tsx";
import { tr } from "@lern/i18n";

const ion = (id: string) => ION_BY_ID[id];

/** Ionenwand mit zwei Bausteinen darunter: „noch ein Kation“ / „noch ein Anion“ (Ziele "C" und "A") */
function Wall({ c, cat, an, nC, nA, target, formula = false }: { c: GuideCtx; cat: string; an: string; nC: number; nA: number; target?: "C" | "A"; formula?: boolean }) {
  const ci = ion(cat), ai = ion(an);
  return (
    <div className="ib-g">
      <Fit className="ib-g-wall" min={0.3}><IonWall cation={ci} anion={ai} nC={nC} nA={nA} showFormula={formula} showName={false} /></Fit>
      {target && (
        <div className="ib-g-add">
          {([["C", ci], ["A", ai]] as const).map(([id, i]) => (
            <button key={id} type="button" className={`ib-g-btn ${id === "C" ? "cation" : "anion"}${c.show && target === id ? " g-sol" : ""}`} onClick={() => c.pick(id)}>
              + <IonLabel ion={i} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const Pse = ({ mark }: { mark: number }) => (
  <div className="pse-fit"><PeriodicTable stufe="us" fit disabled cellState={Z => (Z === mark ? "sel" : undefined)} /></div>
);

/** Ionenwand-Schritt: welcher Baustein fehlt noch? */
const missing = (cat: string, an: string, nC: number, nA: number, answer: "C" | "A", say: string, ok: string, lines?: string[]): GuideStep => ({
  mode: "free", lines, say, ask: tr("Welcher Baustein fehlt, damit beide Reihen **gleich lang** sind? Tippe ihn an.", "Which tile is missing so that both rows are **the same length**? Tap it."), answer,
  visual: c => <Wall c={c} cat={cat} an={an} nC={nC} nA={nA} target={answer} />,
  why: { [answer === "C" ? "A" : "C"]: tr("Dann wird die andere Reihe noch länger. Vergleiche die Breiten.", "Then the other row gets even longer. Compare the widths.") },
  tip: tr("Vergleiche die Breiten: Bei der kürzeren Reihe fehlt ein Baustein.", "Compare the widths: the shorter row is missing a tile."),
  // Begriffe nur bei schmaler Wand – bei breiter Wand lägen sie auf den Bausteinen
  labels: nC + nA <= 2 ? [{ at: ".ion-tile.cation", text: tr("Kation", "Cation"), side: "left", point: "left" }, { at: ".ion-tile.anion", text: "Anion", side: "left", point: "left" }] : undefined,
  ok,
});

/** Natrium und Chlor im Schalenmodell; nach der richtigen Vorhersage wandert ein Elektron von Na zu Cl (Na⁺, Cl⁻) */
function Transfer({ c }: { c: GuideCtx }) {
  const done = c.solved;
  return (
    <div className="ib-g-tr">
      <figure><Fit min={0.3}><Bohr Z={11} N={12} E={done ? 10 : 11} labels={false} /></Fit><figcaption>{done ? "Na⁺" : "Na"}</figcaption></figure>
      <span className={`ib-g-e${done ? " go" : ""}`} aria-hidden="true">e⁻ →</span>
      <figure><Fit min={0.3}><Bohr Z={17} N={18} E={done ? 18 : 17} labels={false} /></Fit><figcaption>{done ? "Cl⁻" : "Cl"}</figcaption></figure>
    </div>
  );
}

const US = (): GuideStep[] => [
  // ── Metall-Ionen ──
  {
    mode: "worked", part: tr("Vom Atom zum Ion", "From atom to ion"),
    say: tr("Natrium hat **1** Außenelektron, Chlor hat **7**. Beide möchten **8** außen haben.", "Sodium has **1** outer electron, chlorine has **7**. Both would like **8** on the outside."),
    ask: tr("Was passiert, wenn Natrium und Chlor reagieren?", "What happens when sodium and chlorine react?"),
    visual: c => <Transfer c={c} />,
    lines: [tr("1 Elektron abgeben ist leichter als 7 abgeben.", "Losing 1 electron is easier than losing 7."), tr("Natrium gibt sein Außenelektron an Chlor ab.", "Sodium gives its outer electron to chlorine."), tr("Beide haben jetzt 8 außen: **Na⁺** und **Cl⁻** – geladene Teilchen, **Ionen**.", "Both now have 8 on the outside: **Na⁺** and **Cl⁻** – charged particles, **ions**.")],
    ok: tr("Ein Elektron wandert vom Metall zum Nichtmetall.", "One electron moves from the metal to the non-metal."),
  },
  {
    mode: "worked",
    say: tr("**Metalle** geben ihre Außenelektronen ab und werden positiv: **Kationen**.", "**Metals** lose their outer electrons and become positive: **cations**."),
    ask: tr("Welches Ion bildet **Magnesium**?", "Which ion does **magnesium** form?"),
    visual: () => <Pse mark={12} />,
    lines: [tr("Magnesium steht in der II. Hauptgruppe → 2 Außenelektronen.", "Magnesium is in main group II → 2 outer electrons."), tr("Beide abgeben → 2 Plus übrig.", "Lose both → 2 plus left over."), tr("→ **Mg²⁺**. Ladung = Hauptgruppe.", "→ **Mg²⁺**. Charge = main group.")],
    ok: tr("Metall-Ionen: Ladung = Nummer der Hauptgruppe.", "Metal ions: charge = number of the main group."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze für **Aluminium**.", "Complete for **aluminium**."), answer: "Al³⁺", options: ["Al³⁺", "Al³⁻", "Al⁺", "Al⁵⁻"],
    visual: () => <Pse mark={13} />,
    lines: [tr("Aluminium: III. Hauptgruppe → 3 Außenelektronen.", "Aluminium: main group III → 3 outer electrons."), tr("Alle 3 abgeben → Ion: {?}", "Lose all 3 → ion: {?}")],
    why: { "Al³⁻": tr("Metalle geben Elektronen ab – sie werden positiv.", "Metals lose electrons – they become positive."), "Al⁺": tr("Alle 3 Außenelektronen gehen weg.", "All 3 outer electrons go."), "Al⁵⁻": tr("5 aufnehmen ist viel mehr als 3 abgeben.", "Gaining 5 is much more than losing 3.") },
    ok: tr("**Al³⁺**.", "**Al³⁺**."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Welches Ion bildet **Kalium**?", "Your turn: which ion does **potassium** form?"), answer: "K⁺", options: ["K⁺", "K⁻", "K⁷⁻", "K²⁺"],
    visual: () => <Pse mark={19} />,
    why: { "K⁻": tr("Kalium ist ein Metall – es gibt ab und wird positiv.", "Potassium is a metal – it loses and becomes positive."), "K⁷⁻": tr("7 aufnehmen ist viel schwerer als 1 abgeben.", "Gaining 7 is much harder than losing 1."), "K²⁺": tr("Kalium steht in der I. Hauptgruppe: nur 1 Außenelektron.", "Potassium is in main group I: only 1 outer electron.") },
    lines: [tr("I. Hauptgruppe → 1 Elektron abgeben → K⁺.", "Main group I → lose 1 electron → K⁺.")],
    ok: tr("Genau: **K⁺**.", "Exactly: **K⁺**."),
  },
  // ── Nichtmetall-Ionen ──
  {
    mode: "worked", part: tr("Nichtmetall-Ionen", "Non-metal ions"),
    say: tr("**Nichtmetalle** nehmen Elektronen auf, bis 8 außen sind, und werden negativ: **Anionen**.", "**Non-metals** gain electrons until there are 8 outside and become negative: **anions**."),
    ask: tr("Welches Ion bildet **Sauerstoff**?", "Which ion does **oxygen** form?"),
    visual: () => <Pse mark={8} />,
    lines: [tr("Sauerstoff: VI. Hauptgruppe → 6 Außenelektronen.", "Oxygen: main group VI → 6 outer electrons."), tr("Bis 8 fehlen: 8 − 6 = 2.", "Missing to make 8: 8 − 6 = 2."), tr("2 aufnehmen → **O²⁻**, das **Oxid**-Ion.", "Gain 2 → **O²⁻**, the **oxide** ion.")],
    ok: tr("Nichtmetall-Ionen: Ladung = 8 − Hauptgruppe, negativ.", "Non-metal ions: charge = 8 − main group, negative."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze für **Chlor**.", "Complete for **chlorine**."), answer: 1, num: {},
    visual: () => <Pse mark={17} />,
    lines: [tr("Chlor: VII. Hauptgruppe → 7 Außenelektronen.", "Chlorine: main group VII → 7 outer electrons."), tr("Aufgenommene Elektronen: 8 − 7 = {?}", "Electrons gained: 8 − 7 = {?}")],
    why: { "7": tr("7 hat Chlor schon. Bis 8 fehlen 8 − 7.", "Chlorine already has 7. 8 − 7 are missing to make 8."), "8": tr("Es fehlen nur so viele, bis 8 außen sind.", "Only as many as needed to make 8 outside.") },
    tip: tr("Rechne die letzte Zeile aus.", "Work out the last line."),
    ok: tr("1 aufgenommen → **Cl⁻**, das Chlorid-Ion.", "1 gained → **Cl⁻**, the chloride ion."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Welches Ion bildet **Stickstoff** (V. Hauptgruppe)?", "Your turn: which ion does **nitrogen** (main group V) form?"), answer: "N³⁻", options: ["N³⁻", "N⁵⁺", "N³⁺", "N⁵⁻"],
    visual: () => <Pse mark={7} />,
    why: { "N⁵⁺": tr("Nichtmetalle nehmen auf – 3 aufnehmen ist leichter als 5 abgeben.", "Non-metals gain – gaining 3 is easier than losing 5."), "N³⁺": tr("Aufnehmen macht negativ.", "Gaining makes it negative."), "N⁵⁻": tr("Es fehlen 8 − 5 = 3 Elektronen.", "8 − 5 = 3 electrons are missing.") },
    lines: [tr("8 − 5 = 3 aufnehmen → N³⁻ (Nitrid-Ion).", "8 − 5 = 3 gained → N³⁻ (nitride ion).")],
    ok: tr("Genau: **N³⁻**.", "Exactly: **N³⁻**."),
  },
  // ── Formeln ──
  {
    mode: "worked", part: tr("Formeln", "Formulas"),
    say: tr("Eine Ionenverbindung ist **neutral**: Plus und Minus gleichen sich aus. In der Ionenwand ist **Breite = Ladung**.", "An ionic compound is **neutral**: plus and minus balance. In the ion wall **width = charge**."),
    ask: tr("Wie kommt man zur Formel von Calciumchlorid?", "How do you get the formula of calcium chloride?"),
    visual: c => <Wall c={c} cat="Ca2+" an="Cl-" nC={1} nA={2} />,
    labels: [{ at: ".ion-tile.cation", text: tr("Kation", "Cation"), point: "left", side: "left" }, { at: ".ion-tile.anion", text: tr("Anion", "Anion"), point: "left", side: "left" }],
    lines: [tr("Ca²⁺ ist 2 breit, Cl⁻ ist 1 breit.", "Ca²⁺ is 2 wide, Cl⁻ is 1 wide."), tr("Gleich lange Reihen: 1 Ca²⁺ und 2 Cl⁻ → 2+ und 2−.", "Rows of equal length: 1 Ca²⁺ and 2 Cl⁻ → 2+ and 2−."), tr("Anzahlen **tiefgestellt**, eine 1 weglassen → **CaCl₂**.", "Numbers as **subscripts**, leave out a 1 → **CaCl₂**.")],
    ok: tr("Erst ausgleichen, dann die Anzahlen tiefstellen.", "Balance first, then write the numbers as subscripts."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie viele **Cl⁻** braucht ein **Mg²⁺**?", "Complete: how many **Cl⁻** does one **Mg²⁺** need?"), answer: 2, num: {},
    visual: c => <Wall c={c} cat="Mg2+" an="Cl-" nC={1} nA={1} />,
    lines: [tr("Mg²⁺ bringt 2+.", "Mg²⁺ brings 2+."), tr("Jedes Cl⁻ bringt 1−.", "Each Cl⁻ brings 1−."), tr("Anzahl Cl⁻: {?} → MgCl₂", "Number of Cl⁻: {?} → MgCl₂")],
    why: { "1": tr("Dann bleibt 1+ übrig – nicht neutral.", "Then 1+ is left over – not neutral.") },
    tip: tr("So viele Cl⁻, bis die Minus-Reihe so lang ist wie die Plus-Reihe.", "As many Cl⁻ as needed until the minus row is as long as the plus row."),
    ok: tr("2 Cl⁻ → **MgCl₂**.", "2 Cl⁻ → **MgCl₂**."),
  },
  missing("Al3+", "O2-", 2, 2, "A",
    tr("Jetzt du: Manchmal braucht man von beiden Ionen mehrere.", "Your turn: sometimes you need several of both ions."),
    tr("2 · 3+ = 6+ und 3 · 2− = 6−: ausgeglichen.", "2 · 3+ = 6+ and 3 · 2− = 6−: balanced."),
    [tr("Plus-Reihe 6 breit, Minus-Reihe erst 4 → noch ein O²⁻.", "Plus row 6 wide, minus row only 4 → one more O²⁻.")]),
  {
    mode: "free",
    ask: tr("Welche Formel hat diese Verbindung?", "What is the formula of this compound?"), answer: "Al₂O₃", options: ["Al₂O₃", "AlO", "Al₃O₂", "Al₂O₂"],
    visual: c => <Wall c={c} cat="Al3+" an="O2-" nC={2} nA={3} />,
    why: { AlO: tr("3+ und 2− gleichen sich nicht aus.", "3+ and 2− do not balance."), "Al₃O₂": tr("Zähle: 2 Aluminium-Ionen, 3 Oxid-Ionen.", "Count: 2 aluminium ions, 3 oxide ions."), "Al₂O₂": tr("2 · 3+ = 6+, aber 2 · 2− = 4−.", "2 · 3+ = 6+, but 2 · 2− = 4−.") },
    lines: [tr("2 Al³⁺, 3 O²⁻ → Al₂O₃ (Aluminiumoxid).", "2 Al³⁺, 3 O²⁻ → Al₂O₃ (aluminium oxide).")],
    ok: tr("**Al₂O₃**.", "**Al₂O₃**."),
  },
  {
    mode: "free",
    ask: tr("Aus **K⁺** und **S²⁻**: Wie viele Kalium-Ionen braucht man für ein Sulfid-Ion?", "From **K⁺** and **S²⁻**: how many potassium ions do you need for one sulfide ion?"), answer: 2, num: {},
    visual: c => <Wall c={c} cat="K+" an="S2-" nC={1} nA={1} />,
    why: { "1": tr("1 · 1+ gleicht 2− nicht aus.", "1 · 1+ does not balance 2−.") },
    tip: tr("Teile die Ladung des Sulfid-Ions durch die Ladung eines Kalium-Ions.", "Divide the charge of the sulfide ion by the charge of one potassium ion."),
    lines: [tr("2 · 1+ = 2+ gleicht 2− aus → K₂S.", "2 · 1+ = 2+ balances 2− → K₂S.")],
    ok: tr("2 K⁺ für 1 S²⁻ → **K₂S**.", "2 K⁺ for 1 S²⁻ → **K₂S**."),
  },
  // ── Namen und Gitter ──
  {
    mode: "worked", part: tr("Namen", "Names"),
    say: tr("Name: Metall + Wortstamm des Nichtmetalls + **-id**: Chlor**id**, **Oxid**, **Sulfid** (Schwefel), **Nitrid** (Stickstoff).", "Name: metal + stem of the non-metal + **-ide**: chlor**ide**, **oxide**, **sulfide** (sulfur), **nitride** (nitrogen)."),
    ask: tr("Wie heißt **MgO**?", "What is **MgO** called?"),
    lines: [tr("Metall zuerst: Magnesium.", "Metal first: magnesium."), tr("O = Sauerstoff → **Oxid**.", "O = oxygen → **oxide**."), tr("→ **Magnesiumoxid**.", "→ **magnesium oxide**.")],
    ok: tr("Der Name nennt keine Anzahlen.", "The name gives no numbers."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie heißt **Na₂S**?", "Complete: what is **Na₂S** called?"), answer: tr("Natriumsulfid", "Sodium sulfide"), options: [tr("Natriumsulfid", "Sodium sulfide"), tr("Dinatriumsulfid", "Disodium sulfide"), tr("Natriumschwefel", "Sodium sulfur")],
    lines: [tr("Metall: Natrium.", "Metal: sodium."), tr("S = Schwefel → Sulfid. Keine Anzahl im Namen.", "S = sulfur → sulfide. No number in the name."), tr("→ {?}", "→ {?}")],
    why: { [tr("Dinatriumsulfid", "Disodium sulfide")]: tr("Bei Ionenverbindungen nennt man keine Anzahl – sie folgt aus den Ladungen.", "Ionic compound names give no numbers – they follow from the charges."), [tr("Natriumschwefel", "Sodium sulfur")]: tr("Das Anion bekommt -id: Sulfid.", "The anion gets -ide: sulfide.") },
    ok: tr("**Natriumsulfid**.", "**Sodium sulfide**."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Welche Formel hat **Calciumbromid**? Brom steht wie Chlor in der VII. Hauptgruppe.", "Your turn: what is the formula of **calcium bromide**? Bromine is in main group VII like chlorine."), answer: "CaBr₂", options: ["CaBr₂", "CaBr", "Ca₂Br", "CaBr₃"],
    visual: () => <Pse mark={20} />,
    why: { CaBr: tr("Ca²⁺ braucht zwei Br⁻.", "Ca²⁺ needs two Br⁻."), "Ca₂Br": tr("Es braucht mehr Bromid-Ionen, nicht mehr Calcium-Ionen.", "It needs more bromide ions, not more calcium ions."), "CaBr₃": tr("Ca²⁺ hat nur 2+ – zwei Br⁻ reichen.", "Ca²⁺ has only 2+ – two Br⁻ are enough.") },
    lines: [tr("Ca²⁺ und Br⁻ → 2 Br⁻ je Ca²⁺ → CaBr₂.", "Ca²⁺ and Br⁻ → 2 Br⁻ per Ca²⁺ → CaBr₂.")],
    ok: tr("Genau: **CaBr₂**.", "Exactly: **CaBr₂**."),
  },
  {
    mode: "worked",
    say: tr("Im Feststoff liegen sehr viele Ionen abwechselnd im **Ionengitter**.", "In the solid, very many ions alternate in an **ionic lattice**."),
    ask: tr("Was bedeutet die Formel **CaCl₂**?", "What does the formula **CaCl₂** mean?"),
    lines: [tr("Es gibt kein einzelnes „CaCl₂-Teilchen“ – kein Molekül.", "There is no single “CaCl₂ particle” – no molecule."), tr("Die Formel nennt nur das **Verhältnis** im Gitter.", "The formula only gives the **ratio** in the lattice."), tr("CaCl₂: auf 1 Ca²⁺ kommen 2 Cl⁻.", "CaCl₂: 2 Cl⁻ for every Ca²⁺.")],
    ok: tr("Formel = Verhältnis der Ionen.", "Formula = ratio of the ions."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Was bedeutet **Al₂O₃**?", "Complete: what does **Al₂O₃** mean?"), answer: tr("2 Al³⁺ auf 3 O²⁻", "2 Al³⁺ for 3 O²⁻"),
    options: [tr("2 Al³⁺ auf 3 O²⁻", "2 Al³⁺ for 3 O²⁻"), tr("ein Molekül aus 5 Atomen", "a molecule of 5 atoms"), tr("Aluminium und Sauerstoff gemischt", "aluminium and oxygen mixed")],
    lines: [tr("Ionengitter – kein Molekül.", "Ionic lattice – no molecule."), tr("Die Formel nennt das Verhältnis: {?}", "The formula gives the ratio: {?}")],
    why: { [tr("ein Molekül aus 5 Atomen", "a molecule of 5 atoms")]: tr("Ionenverbindungen bilden keine Moleküle, sondern ein Gitter.", "Ionic compounds do not form molecules but a lattice."), [tr("Aluminium und Sauerstoff gemischt", "aluminium and oxygen mixed")]: tr("Es sind Ionen, fest im Gitter gebunden – kein Gemisch.", "They are ions, held firmly in the lattice – not a mixture.") },
    ok: tr("Im Gitter: immer 2 Al³⁺ auf 3 O²⁻.", "In the lattice: always 2 Al³⁺ for 3 O²⁻."),
  },
];

const OS: GuideStep[] = [
  // ── Ionen ──
  {
    mode: "worked", part: tr("Ionen", "Ions"),
    say: tr("Hauptgruppen-Ionen erreichen **Edelgaskonfiguration**.", "Main group ions reach a **noble gas configuration**."),
    ask: tr("Welches Ion bildet **Barium** (Gruppe 2)?", "Which ion does **barium** (group 2) form?"),
    lines: [tr("Gruppe 1, 2, 13 geben ab → 1+, 2+, 3+.", "Groups 1, 2, 13 lose → 1+, 2+, 3+."), tr("Gruppe 15, 16, 17 nehmen auf → 3−, 2−, 1−.", "Groups 15, 16, 17 gain → 3−, 2−, 1−."), tr("Barium: Gruppe 2 → **Ba²⁺**.", "Barium: group 2 → **Ba²⁺**.")],
    ok: tr("Die Gruppe verrät die Ladung.", "The group tells you the charge."),
  },
  {
    mode: "worked",
    say: tr("**Mehratomige Ionen** sind feste Blöcke aus mehreren Atomen mit gemeinsamer Ladung.", "**Polyatomic ions** are fixed blocks of several atoms with a shared charge."),
    ask: tr("Welche mehratomigen Ionen muss man kennen?", "Which polyatomic ions do you need to know?"),
    lines: [tr("OH⁻ **Hydroxid**, NO₃⁻ **Nitrat**, NH₄⁺ **Ammonium**.", "OH⁻ **hydroxide**, NO₃⁻ **nitrate**, NH₄⁺ **ammonium**."), tr("CO₃²⁻ **Carbonat**, HCO₃⁻ **Hydrogencarbonat**, SO₄²⁻ **Sulfat**, PO₄³⁻ **Phosphat**.", "CO₃²⁻ **carbonate**, HCO₃⁻ **hydrogen carbonate**, SO₄²⁻ **sulfate**, PO₄³⁻ **phosphate**."), tr("Tiefgestellt: Zahl der Atome. Hochgestellt: Ladung des ganzen Blocks.", "Subscript: number of atoms. Superscript: charge of the whole block.")],
    ok: tr("Diese Ladungen lernt man auswendig.", "These charges are learnt by heart."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Welche Ladung hat das **Sulfat-Ion**?", "Complete: what is the charge of the **sulfate ion**?"), answer: "2−", options: ["2−", "1−", "3−", "4−"],
    lines: [tr("SO₄²⁻: unten die 4 = Zahl der O-Atome.", "SO₄²⁻: the 4 at the bottom = number of O atoms."), tr("Oben rechts = Ladung: {?}", "Top right = charge: {?}")],
    why: { "1−": tr("1− hat Nitrat (NO₃⁻).", "Nitrate (NO₃⁻) has 1−."), "3−": tr("3− hat Phosphat (PO₄³⁻).", "Phosphate (PO₄³⁻) has 3−."), "4−": tr("Die 4 gehört zu den O-Atomen, nicht zur Ladung.", "The 4 belongs to the O atoms, not to the charge.") },
    ok: tr("**SO₄²⁻**: Ladung 2−.", "**SO₄²⁻**: charge 2−."),
  },
  missing("Ca2+", "OH-", 1, 1, "A",
    tr("Jetzt du: Mit mehratomigen Ionen gleicht man genauso aus – der Block zählt als ein Baustein.", "Your turn: polyatomic ions are balanced the same way – the block counts as one tile."),
    tr("1 · 2+ = 2+ und 2 · 1− = 2−.", "1 · 2+ = 2+ and 2 · 1− = 2−."),
    [tr("Ca²⁺ ist 2 breit, OH⁻ 1 breit → zwei OH⁻.", "Ca²⁺ is 2 wide, OH⁻ 1 wide → two OH⁻.")]),
  // ── Klammern ──
  {
    mode: "worked", part: tr("Klammern", "Brackets"),
    say: tr("Braucht man einen Block mehrmals, kommt er in **Klammern**, die Anzahl dahinter.", "If a block is needed more than once, it goes in **brackets** with the number after it."),
    ask: tr("Welche Formel hat **Calciumhydroxid**?", "What is the formula of **calcium hydroxide**?"),
    visual: c => <Wall c={c} cat="Ca2+" an="OH-" nC={1} nA={2} />,
    labels: [{ at: ".ion-tile.anion", text: tr("Hydroxid-Ion: ein Block", "Hydroxide ion: one block"), point: "left", side: "left" }],
    lines: [tr("Ca²⁺ braucht 2 OH⁻.", "Ca²⁺ needs 2 OH⁻."), tr("OH⁻ ist ein Block → (OH), dahinter die 2.", "OH⁻ is a block → (OH), the 2 after it."), tr("→ **Ca(OH)₂** = 1 Ca, 2 O, 2 H. Ohne Klammer hieße OH₂: 1 O, 2 H.", "→ **Ca(OH)₂** = 1 Ca, 2 O, 2 H. Without brackets OH₂ would mean 1 O, 2 H.")],
    ok: tr("Klammern nur, wenn ein Block mehrmals vorkommt.", "Brackets only when a block appears more than once."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie viele **Sulfat-Ionen** gleichen **2 Al³⁺** aus?", "Complete: how many **sulfate ions** balance **2 Al³⁺**?"), answer: 3, num: {},
    visual: c => <Wall c={c} cat="Al3+" an="SO42-" nC={2} nA={1} />,
    lines: [tr("2 Al³⁺ = 6+.", "2 Al³⁺ = 6+."), tr("Ein SO₄²⁻ = 2−.", "One SO₄²⁻ = 2−."), tr("6 : 2 = {?} Sulfat-Ionen", "6 : 2 = {?} sulfate ions")],
    why: { "2": tr("2 · 2− = 4−, aber 2 · 3+ = 6+.", "2 · 2− = 4−, but 2 · 3+ = 6+."), "6": tr("6 ist die Ladung. Jedes Sulfat bringt 2−.", "6 is the charge. Each sulfate brings 2−.") },
    tip: tr("Rechne die letzte Zeile aus.", "Work out the last line."),
    ok: tr("3 SO₄²⁻ → 6−.", "3 SO₄²⁻ → 6−."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Welche Formel hat **Aluminiumsulfat**?", "Your turn: what is the formula of **aluminium sulfate**?"), answer: "Al₂(SO₄)₃", options: ["Al₂(SO₄)₃", "Al₂SO₄₃", "Al₃(SO₄)₂", "AlSO₄"],
    visual: c => <Wall c={c} cat="Al3+" an="SO42-" nC={2} nA={3} />,
    why: { "Al₂SO₄₃": tr("Ohne Klammer stünde da „43 O-Atome“. Der Block SO₄ kommt in Klammern.", "Without brackets it would say “43 O atoms”. The SO₄ block goes in brackets."), "Al₃(SO₄)₂": tr("Zähle: 2 Aluminium-Ionen, 3 Sulfat-Ionen.", "Count: 2 aluminium ions, 3 sulfate ions."), "AlSO₄": tr("3+ und 2− gleichen sich nicht aus.", "3+ and 2− do not balance.") },
    lines: [tr("2 Al³⁺, 3 SO₄²⁻ → Al₂(SO₄)₃.", "2 Al³⁺, 3 SO₄²⁻ → Al₂(SO₄)₃.")],
    ok: tr("Genau: **Al₂(SO₄)₃**.", "Exactly: **Al₂(SO₄)₃**."),
  },
  {
    mode: "free",
    ask: tr("Aus **Zn²⁺** und **PO₄³⁻**: Wie viele Zink-Ionen braucht man für **2** Phosphat-Ionen?", "From **Zn²⁺** and **PO₄³⁻**: how many zinc ions do you need for **2** phosphate ions?"), answer: 3, num: {},
    visual: c => <Wall c={c} cat="Zn2+" an="PO43-" nC={1} nA={2} />,
    why: { "2": tr("2 · 2+ = 4+, aber 2 · 3− = 6−.", "2 · 2+ = 4+, but 2 · 3− = 6−."), "6": tr("6 ist die Ladung. Jedes Zink-Ion bringt 2+.", "6 is the charge. Each zinc ion brings 2+.") },
    tip: tr("Rechne die Minus-Ladungen zusammen und teile durch die Ladung eines Zink-Ions.", "Add up the minus charges and divide by the charge of one zinc ion."),
    lines: [tr("2 · 3− = 6−; 6 : 2 = 3 Zn²⁺ → Zn₃(PO₄)₂.", "2 · 3− = 6−; 6 : 2 = 3 Zn²⁺ → Zn₃(PO₄)₂.")],
    ok: tr("Genau: 3 Zink-Ionen.", "Exactly: 3 zinc ions."),
  },
  // ── Nebengruppen und Namen ──
  {
    mode: "worked", part: tr("Nebengruppen und Namen", "Transition metals and names"),
    say: tr("Nebengruppen-Metalle bilden verschiedene Ionen. Die Ladung steht als **römische Zahl** im Namen.", "Transition metals form different ions. The charge is given as a **Roman numeral** in the name."),
    ask: tr("Welche Formel hat **Eisen(III)-chlorid**?", "What is the formula of **iron(III) chloride**?"),
    lines: [tr("Eisen(III) = Fe³⁺.", "Iron(III) = Fe³⁺."), tr("Fe³⁺ braucht 3 Cl⁻.", "Fe³⁺ needs 3 Cl⁻."), tr("→ **FeCl₃**. Die III ist die Ladung, keine Anzahl.", "→ **FeCl₃**. The III is the charge, not a number of atoms.")],
    ok: tr("Römische Zahl = Ladung des Metall-Ions.", "Roman numeral = charge of the metal ion."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Welche Ladung hat das Kupfer-Ion in **CuO**?", "Complete: what is the charge of the copper ion in **CuO**?"), answer: "2+", options: ["2+", "1+", "2−", "3+"],
    lines: [tr("O²⁻ bringt 2−.", "O²⁻ brings 2−."), tr("Ein Cu muss ausgleichen → Ladung {?}", "One Cu must balance → charge {?}")],
    why: { "1+": tr("O²⁻ braucht 2+ – ein Cu muss 2+ tragen.", "O²⁻ needs 2+ – one Cu must carry 2+."), "2−": tr("Metall-Ionen sind positiv.", "Metal ions are positive."), "3+": tr("Dann wäre CuO nicht neutral.", "Then CuO would not be neutral.") },
    ok: tr("CuO = Kupfer(II)-oxid.", "CuO = copper(II) oxide."),
  },
  {
    mode: "worked",
    say: tr("Die Endung des Anions verrät, ob Sauerstoff drin ist.", "The ending of the anion tells you whether oxygen is in it."),
    ask: tr("Sulfid, Sulfat oder Sulfit?", "Sulfide, sulfate or sulfite?"),
    lines: [tr("**-id**: nur ein Atom – **Sulfid** S²⁻.", "**-ide**: just one atom – **sulfide** S²⁻."), tr("**-at**: mit Sauerstoff – **Sulfat** SO₄²⁻.", "**-ate**: with oxygen – **sulfate** SO₄²⁻."), tr("**-it**: ein O weniger – **Sulfit** SO₃²⁻.", "**-ite**: one O fewer – **sulfite** SO₃²⁻.")],
    ok: tr("Genauso: Nitrat NO₃⁻, Nitrit NO₂⁻.", "Likewise: nitrate NO₃⁻, nitrite NO₂⁻."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie heißt **Na₂SO₃**?", "Complete: what is **Na₂SO₃** called?"), answer: tr("Natriumsulfit", "Sodium sulfite"), options: [tr("Natriumsulfit", "Sodium sulfite"), tr("Natriumsulfat", "Sodium sulfate"), tr("Natriumsulfid", "Sodium sulfide")],
    lines: [tr("SO₃: 3 O – eins weniger als Sulfat.", "SO₃: 3 O – one fewer than sulfate."), tr("→ {?}", "→ {?}")],
    why: { [tr("Natriumsulfat", "Sodium sulfate")]: tr("Sulfat ist SO₄ – hier sind nur 3 O.", "Sulfate is SO₄ – here there are only 3 O."), [tr("Natriumsulfid", "Sodium sulfide")]: tr("Sulfid ist S²⁻ ohne Sauerstoff.", "Sulfide is S²⁻ without oxygen.") },
    ok: tr("SO₃²⁻ = Sulfit.", "SO₃²⁻ = sulfite."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Wie heißt **FeSO₄**?", "Your turn: what is **FeSO₄** called?"), answer: tr("Eisen(II)-sulfat", "Iron(II) sulfate"), options: [tr("Eisen(II)-sulfat", "Iron(II) sulfate"), tr("Eisen(III)-sulfat", "Iron(III) sulfate"), tr("Eisen(II)-sulfid", "Iron(II) sulfide"), tr("Eisen(IV)-sulfat", "Iron(IV) sulfate")],
    why: { [tr("Eisen(III)-sulfat", "Iron(III) sulfate")]: tr("SO₄²⁻ ist 2− – ein Fe muss 2+ tragen.", "SO₄²⁻ is 2− – one Fe must carry 2+."), [tr("Eisen(II)-sulfid", "Iron(II) sulfide")]: tr("SO₄ enthält Sauerstoff: Sulfat.", "SO₄ contains oxygen: sulfate."), [tr("Eisen(IV)-sulfat", "Iron(IV) sulfate")]: tr("Die 4 gehört zum Sauerstoff, nicht zum Eisen.", "The 4 belongs to the oxygen, not to the iron.") },
    lines: [tr("SO₄²⁻ = 2− → Fe²⁺ → Eisen(II)-sulfat.", "SO₄²⁻ = 2− → Fe²⁺ → iron(II) sulfate.")],
    ok: tr("Genau: Eisen(II)-sulfat.", "Exactly: iron(II) sulfate."),
  },
];

export function guideFor(stufe: "us" | "os"): GuideDef {
  return stufe === "us"
    ? { title: tr("Ionenbindung", "Ionic Bonds"), steps: US(), outro: [
      tr("Metalle geben Elektronen ab (Kationen, + Hauptgruppe), Nichtmetalle nehmen auf (Anionen, 8 − Hauptgruppe).", "Metals lose electrons (cations, + main group), non-metals gain them (anions, 8 − main group)."),
      tr("Plus und Minus gleichen sich aus: beide Reihen der Ionenwand **gleich lang**.", "Plus and minus balance: both rows of the ion wall **the same length**."),
      tr("Formel: Anzahlen tiefgestellt, kleinstes Verhältnis, 1 weglassen.", "Formula: numbers as subscripts, smallest ratio, leave out 1."),
      tr("Name: Metall + Nichtmetall-Stamm + **-id** (Chlorid, Oxid, Sulfid, Nitrid).", "Name: metal + non-metal stem + **-ide** (chloride, oxide, sulfide, nitride)."),
    ] }
    : { title: tr("Ionenbindung", "Ionic Bonds"), steps: OS, outro: [
      tr("Ladungen der Hauptgruppen-Ionen und der mehratomigen Ionen (Nitrat, Sulfat, Phosphat …).", "Charges of main group ions and polyatomic ions (nitrate, sulfate, phosphate …)."),
      tr("Mehratomige Ionen als Block, mehrfach in **Klammern**: Ca(OH)₂, Al₂(SO₄)₃.", "Polyatomic ions as a block, in **brackets** when more than one: Ca(OH)₂, Al₂(SO₄)₃."),
      tr("**Römische Zahl** = Ladung des Metall-Ions: Eisen(III)-chlorid FeCl₃.", "**Roman numeral** = charge of the metal ion: iron(III) chloride FeCl₃."),
      tr("-id, -at, -it unterscheiden: Sulfid, Sulfat, Sulfit.", "Tell -ide, -ate, -ite apart: sulfide, sulfate, sulfite."),
    ] };
}
