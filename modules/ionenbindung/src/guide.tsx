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
const missing = (cat: string, an: string, nC: number, nA: number, answer: "C" | "A", say: string, ok: string): GuideStep => ({
  say, ask: tr("Welcher Baustein fehlt, damit beide Reihen **gleich lang** sind? Tippe ihn an.", "Which tile is missing so that both rows are **the same length**? Tap it."), answer,
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
const NA_GIVES = () => tr("Na gibt 1 Elektron an Cl ab.", "Na gives 1 electron to Cl."), CL_GIVES = () => tr("Cl gibt 7 Elektronen an Na ab.", "Cl gives 7 electrons to Na."), SHARE = () => tr("Beide teilen sich ein Elektronenpaar.", "Both share an electron pair.");

const US = (): GuideStep[] => [
  {
    part: tr("Vom Atom zum Ion", "From atom to ion"),
    say: tr("Natrium hat **1** Außenelektron, Chlor hat **7**. Beide möchten **8** außen haben.", "Sodium has **1** outer electron, chlorine has **7**. Both would like **8** on the outside."),
    ask: tr("Was passiert, wenn sie reagieren? Sag es vorher!", "What happens when they react? Predict it!"), answer: NA_GIVES(), options: [NA_GIVES(), CL_GIVES(), SHARE()],
    visual: c => <Transfer c={c} />,
    why: { [CL_GIVES()]: tr("7 Elektronen abzugeben ist viel schwerer als 1.", "Giving away 7 electrons is much harder than 1."), [SHARE()]: tr("Teilen tun Nichtmetalle. Ein Metall gibt Elektronen ganz ab.", "Non-metals share. A metal gives electrons away completely.") },
    ok: tr("Schau zu: Ein Elektron wandert. Na wird **Na⁺**, Cl wird **Cl⁻**.", "Watch: one electron moves. Na becomes **Na⁺**, Cl becomes **Cl⁻**."),
  },
  {
    say: tr("**Metalle** geben Außenelektronen ab → positive Ionen (**Kationen**). Die Ladung = Hauptgruppe (I, II, III).", "**Metals** lose outer electrons → positive ions (**cations**). The charge = main group (I, II, III)."),
    ask: tr("Welches Ion bildet **Magnesium** (II. Hauptgruppe)?", "Which ion does **magnesium** (main group II) form?"), answer: "Mg²⁺", options: ["Mg²⁺", "Mg²⁻", "Mg⁺", "Mg⁶⁻"],
    visual: () => <Pse mark={12} />,
    why: { "Mg²⁻": tr("Metalle geben Elektronen ab – sie werden positiv.", "Metals lose electrons – they become positive."), "Mg⁺": tr("Magnesium hat 2 Außenelektronen – beide gehen weg.", "Magnesium has 2 outer electrons – both go."), "Mg⁶⁻": tr("6 aufnehmen ist viel mehr als 2 abgeben.", "Gaining 6 is much more than losing 2.") },
    ok: tr("Mg gibt 2 Elektronen ab → **Mg²⁺**.", "Mg loses 2 electrons → **Mg²⁺**."),
  },
  {
    say: tr("**Nichtmetalle** nehmen Elektronen auf, bis 8 außen sind → negative Ionen (**Anionen**): 8 − Hauptgruppe.", "**Non-metals** gain electrons until there are 8 outside → negative ions (**anions**): 8 − main group."),
    ask: tr("Wie viele Elektronen nimmt ein **Sauerstoff**-Atom (VI. Hauptgruppe) auf?", "How many electrons does an **oxygen** atom (main group VI) gain?"), answer: 2, num: {},
    visual: () => <Pse mark={8} />,
    why: { "6": tr("6 hat es schon außen. Bis 8 fehlen 8 − 6.", "It already has 6 outside. 8 − 6 are missing to make 8."), "8": tr("Es fehlen nur so viele, bis 8 außen sind.", "Only as many are missing as needed for 8 outside.") },
    tip: tr("Bis 8 Außenelektronen fehlen: 8 − Hauptgruppe.", "Missing to make 8 outer electrons: 8 − main group."),
    ok: tr("8 − 6 = 2 → Oxid-Ion **O²⁻**.", "8 − 6 = 2 → oxide ion **O²⁻**."),
  },
  {
    ask: tr("Welches Ion bildet **Stickstoff** (V. Hauptgruppe)?", "Which ion does **nitrogen** (main group V) form?"), answer: "N³⁻", options: ["N³⁻", "N⁵⁺", "N³⁺", "N⁵⁻"],
    visual: () => <Pse mark={7} />,
    why: { "N⁵⁺": tr("Nichtmetalle nehmen auf – 3 aufnehmen ist leichter als 5 abgeben.", "Non-metals gain – gaining 3 is easier than losing 5."), "N³⁺": tr("Aufnehmen macht negativ.", "Gaining makes it negative."), "N⁵⁻": tr("Es fehlen 8 − 5 = 3 Elektronen.", "8 − 5 = 3 electrons are missing.") },
    ok: tr("8 − 5 = 3 Elektronen aufgenommen → Nitrid-Ion **N³⁻**.", "8 − 5 = 3 electrons gained → nitride ion **N³⁻**."),
  },
  missing("Ca2+", "Cl-", 1, 1, "A",
    tr("Eine Ionenverbindung ist **neutral**: Plus und Minus gleichen sich aus. In der Ionenwand ist die **Breite = Ladung**.", "An ionic compound is **neutral**: plus and minus balance. In the ion wall **width = charge**."),
    tr("1 · 2+ = 2+ und 2 · 1− = 2−: ausgeglichen.", "1 · 2+ = 2+ and 2 · 1− = 2−: balanced.")),
  {
    part: tr("Formeln", "Formulas"),
    say: tr("Die Anzahlen werden zu **tiefgestellten Zahlen** hinter dem Symbol. Eine 1 schreibt man nicht.", "The numbers become **subscripts** after the symbol. A 1 is not written."),
    ask: tr("Welche Formel hat diese Verbindung?", "What is the formula of this compound?"), answer: "CaCl₂", options: ["CaCl₂", "Ca₂Cl", "CaCl", "Ca₂Cl₂"],
    visual: c => <Wall c={c} cat="Ca2+" an="Cl-" nC={1} nA={2} />,
    why: { "Ca₂Cl": tr("1 Calcium-Ion, 2 Chlorid-Ionen – die 2 gehört zum Cl.", "1 calcium ion, 2 chloride ions – the 2 belongs to Cl."), CaCl: tr("So wäre es nicht neutral: 2+ und 1−.", "Then it would not be neutral: 2+ and 1−."), "Ca₂Cl₂": tr("Man kürzt auf das kleinste Verhältnis 1 : 2.", "Simplify to the smallest ratio 1 : 2.") },
    labels: [{"at": ".ion-tile.cation", "text": tr("Kation", "Cation"), "point": "left", "side": "left"}, {"at": ".ion-tile.anion", "text": tr("Anion", "Anion"), "point": "left", "side": "left"}],
    ok: tr("**CaCl₂**: Calciumchlorid.", "**CaCl₂**: calcium chloride."),
  },
  missing("Al3+", "O2-", 2, 2, "A",
    tr("Manchmal braucht man von beiden Ionen mehrere: hier 2 · 3+ = 6+, aber erst 2 · 2− = 4−.", "Sometimes you need several of both ions: here 2 · 3+ = 6+, but only 2 · 2− = 4−."),
    tr("2 · 3+ = 6+ und 3 · 2− = 6−: ausgeglichen.", "2 · 3+ = 6+ and 3 · 2− = 6−: balanced.")),
  {
    ask: tr("Welche Formel hat diese Verbindung?", "What is the formula of this compound?"), answer: "Al₂O₃", options: ["Al₂O₃", "AlO", "Al₃O₂", "Al₂O₂"],
    visual: c => <Wall c={c} cat="Al3+" an="O2-" nC={2} nA={3} />,
    why: { AlO: tr("3+ und 2− gleichen sich nicht aus.", "3+ and 2− do not balance."), "Al₃O₂": tr("Zähle: 2 Aluminium-Ionen, 3 Oxid-Ionen.", "Count: 2 aluminium ions, 3 oxide ions."), "Al₂O₂": tr("2 · 3+ = 6+, aber 2 · 2− = 4−.", "2 · 3+ = 6+, but 2 · 2− = 4−.") },
    ok: tr("**Al₂O₃**: Aluminiumoxid.", "**Al₂O₃**: aluminium oxide."),
  },
  {
    ask: tr("Aus **K⁺** und **S²⁻**: Wie viele Kalium-Ionen braucht man für ein Sulfid-Ion?", "From **K⁺** and **S²⁻**: how many potassium ions do you need for one sulfide ion?"), answer: 2, num: {},
    visual: c => <Wall c={c} cat="K+" an="S2-" nC={1} nA={1} />,
    why: { "1": tr("1 · 1+ gleicht 2− nicht aus.", "1 · 1+ does not balance 2−.") },
    tip: tr("Teile die Ladung des Sulfid-Ions durch die Ladung eines Kalium-Ions.", "Divide the charge of the sulfide ion by the charge of one potassium ion."),
    ok: tr("2 K⁺ gleichen 1 S²⁻ aus → **K₂S**.", "2 K⁺ balance 1 S²⁻ → **K₂S**."),
  },
  {
    part: tr("Namen", "Names"),
    say: tr("Name: Metall + Wortstamm des Nichtmetalls + **-id**: Chlor → Chlor**id**, Sauerstoff → **Oxid**, Schwefel → **Sulfid**, Stickstoff → **Nitrid**.", "Name: metal + stem of the non-metal + **-ide**: chlorine → chlor**ide**, oxygen → **oxide**, sulfur → **sulfide**, nitrogen → **nitride**."),
    ask: tr("Wie heißt **MgO**?", "What is **MgO** called?"), answer: tr("Magnesiumoxid", "Magnesium oxide"), options: [tr("Magnesiumoxid", "Magnesium oxide"), tr("Magnesiumsauerstoff", "Magnesium oxygen"), tr("Magnesiumsulfid", "Magnesium sulfide")],
    why: { [tr("Magnesiumsauerstoff", "Magnesium oxygen")]: tr("Das Anion heißt nach dem Wortstamm mit -id: Oxid.", "The anion is named from the stem with -ide: oxide."), [tr("Magnesiumsulfid", "Magnesium sulfide")]: tr("Sulfid kommt von Schwefel (S). O ist Sauerstoff.", "Sulfide comes from sulfur (S). O is oxygen.") },
    ok: tr("MgO = Magnesiumoxid.", "MgO = magnesium oxide."),
  },
  {
    ask: tr("Wie heißt **Na₂S**?", "What is **Na₂S** called?"), answer: tr("Natriumsulfid", "Sodium sulfide"), options: [tr("Natriumsulfid", "Sodium sulfide"), tr("Dinatriumsulfid", "Disodium sulfide"), tr("Natriumschwefel", "Sodium sulfur")],
    why: { [tr("Dinatriumsulfid", "Disodium sulfide")]: tr("Bei Ionenverbindungen nennt man keine Anzahl – sie folgt aus den Ladungen.", "Ionic compound names give no numbers – they follow from the charges."), [tr("Natriumschwefel", "Sodium sulfur")]: tr("Das Anion bekommt -id: Sulfid.", "The anion gets -ide: sulfide.") },
    ok: tr("Na₂S = Natriumsulfid (2 Na⁺ für 1 S²⁻).", "Na₂S = sodium sulfide (2 Na⁺ for 1 S²⁻)."),
  },
  {
    ask: tr("Welche Formel hat **Calciumbromid**? Brom steht wie Chlor in der VII. Hauptgruppe.", "What is the formula of **calcium bromide**? Bromine is in main group VII like chlorine."), answer: "CaBr₂", options: ["CaBr₂", "CaBr", "Ca₂Br", "CaBr₃"],
    visual: () => <Pse mark={20} />,
    why: { CaBr: tr("Ca²⁺ braucht zwei Br⁻.", "Ca²⁺ needs two Br⁻."), "Ca₂Br": tr("Es braucht mehr Bromid-Ionen, nicht mehr Calcium-Ionen.", "It needs more bromide ions, not more calcium ions."), "CaBr₃": tr("Ca²⁺ hat nur 2+ – zwei Br⁻ reichen.", "Ca²⁺ has only 2+ – two Br⁻ are enough.") },
    ok: tr("Ca²⁺ + 2 Br⁻ → **CaBr₂**.", "Ca²⁺ + 2 Br⁻ → **CaBr₂**."),
  },
  {
    say: tr("Im Feststoff liegen sehr viele Ionen abwechselnd im **Ionengitter**. Die Formel nennt nur das **Verhältnis**.", "In the solid, very many ions alternate in an **ionic lattice**. The formula only gives the **ratio**."),
    ask: tr("Was bedeutet **CaCl₂**?", "What does **CaCl₂** mean?"), answer: tr("Auf 1 Ca²⁺ kommen 2 Cl⁻.", "There are 2 Cl⁻ for every Ca²⁺."),
    options: [tr("Auf 1 Ca²⁺ kommen 2 Cl⁻.", "There are 2 Cl⁻ for every Ca²⁺."), tr("Ein Molekül aus 3 Atomen.", "A molecule of 3 atoms."), tr("Calcium und Chlor gemischt.", "Calcium and chlorine mixed.")],
    why: { [tr("Ein Molekül aus 3 Atomen.", "A molecule of 3 atoms.")]: tr("Ionenverbindungen bilden keine Moleküle, sondern ein Gitter.", "Ionic compounds do not form molecules but a lattice."), [tr("Calcium und Chlor gemischt.", "Calcium and chlorine mixed.")]: tr("Es sind Ionen, fest im Gitter gebunden – kein Gemisch.", "They are ions, held firmly in the lattice – not a mixture.") },
    ok: tr("Ionengitter: immer 2 Cl⁻ je Ca²⁺.", "Ionic lattice: always 2 Cl⁻ per Ca²⁺."),
  },
];

const OS: GuideStep[] = [
  {
    part: tr("Ionen", "Ions"),
    say: tr("Hauptgruppen-Ionen erreichen Edelgaskonfiguration: Gruppe 1, 2, 13 → 1+, 2+, 3+; Gruppe 15, 16, 17 → 3−, 2−, 1−.", "Main group ions reach a noble gas configuration: groups 1, 2, 13 → 1+, 2+, 3+; groups 15, 16, 17 → 3−, 2−, 1−."),
    ask: tr("Welches Ion bildet **Barium** (Gruppe 2)?", "Which ion does **barium** (group 2) form?"), answer: "Ba²⁺", options: ["Ba²⁺", "Ba⁺", "Ba²⁻", "Ba⁶⁻"],
    why: { "Ba⁺": tr("Gruppe 2: zwei Außenelektronen gehen weg.", "Group 2: two outer electrons go."), "Ba²⁻": tr("Metalle geben Elektronen ab.", "Metals lose electrons."), "Ba⁶⁻": tr("6 aufnehmen ist viel mehr als 2 abgeben.", "Gaining 6 is much more than losing 2.") },
    ok: tr("Gruppe 2: 2 Elektronen abgegeben → **Ba²⁺**.", "Group 2: 2 electrons lost → **Ba²⁺**."),
  },
  {
    say: tr("**Mehratomige Ionen** bleiben als Block zusammen: OH⁻ Hydroxid, NO₃⁻ Nitrat, CO₃²⁻ Carbonat, SO₄²⁻ Sulfat, PO₄³⁻ Phosphat, NH₄⁺ Ammonium.", "**Polyatomic ions** stay together as a block: OH⁻ hydroxide, NO₃⁻ nitrate, CO₃²⁻ carbonate, SO₄²⁻ sulfate, PO₄³⁻ phosphate, NH₄⁺ ammonium."),
    ask: tr("Welche Ladung hat das **Sulfat-Ion** (SO₄)?", "What is the charge of the **sulfate ion** (SO₄)?"), answer: "2−", options: ["2−", "1−", "3−", "4−"],
    why: { "1−": tr("1− hat Nitrat (NO₃⁻).", "Nitrate (NO₃⁻) has 1−."), "3−": tr("3− hat Phosphat (PO₄³⁻).", "Phosphate (PO₄³⁻) has 3−."), "4−": tr("Die 4 gehört zu den O-Atomen, nicht zur Ladung.", "The 4 belongs to the O atoms, not to the charge.") },
    ok: tr("**SO₄²⁻**: oben rechts die Ladung, unten die Zahl der O-Atome.", "**SO₄²⁻**: charge at the top right, number of O atoms at the bottom."),
  },
  missing("Ca2+", "OH-", 1, 1, "A",
    tr("Mit mehratomigen Ionen gleicht man genauso aus – der ganze Block zählt als ein Baustein.", "Polyatomic ions are balanced the same way – the whole block counts as one tile."),
    tr("1 · 2+ = 2+ und 2 · 1− = 2−.", "1 · 2+ = 2+ and 2 · 1− = 2−.")),
  {
    part: tr("Klammern", "Brackets"),
    say: tr("Braucht man einen mehratomigen Block mehrmals, kommt er in **Klammern**, die Anzahl dahinter.", "If a polyatomic block is needed more than once, it goes in **brackets** with the number after it."),
    ask: tr("Welche Formel hat **Calciumhydroxid**?", "What is the formula of **calcium hydroxide**?"), answer: "Ca(OH)₂", options: ["Ca(OH)₂", "CaOH₂", "CaOH", "Ca₂OH"],
    visual: c => <Wall c={c} cat="Ca2+" an="OH-" nC={1} nA={2} />,
    why: { "CaOH₂": tr("OH₂ hieße: 1 O und 2 H. Gemeint ist zweimal das ganze OH⁻.", "OH₂ would mean 1 O and 2 H. What is meant is twice the whole OH⁻."), CaOH: tr("Ca²⁺ braucht zwei OH⁻.", "Ca²⁺ needs two OH⁻."), "Ca₂OH": tr("Es braucht mehr Hydroxid-, nicht mehr Calcium-Ionen.", "It needs more hydroxide ions, not more calcium ions.") },
    labels: [{"at": ".ion-tile.anion", "text": tr("Hydroxid-Ion: ein Block", "Hydroxide ion: one block"), "point": "left", "side": "left"}],
    ok: tr("Zweimal der ganze Block OH: **Ca(OH)₂** = 1 Ca, 2 O, 2 H.", "Twice the whole OH block: **Ca(OH)₂** = 1 Ca, 2 O, 2 H."),
  },
  {
    ask: tr("Aus **Al³⁺** und **SO₄²⁻**: Wie viele Sulfat-Ionen gleichen **2** Al³⁺ aus?", "From **Al³⁺** and **SO₄²⁻**: how many sulfate ions balance **2** Al³⁺?"), answer: 3, num: {},
    visual: c => <Wall c={c} cat="Al3+" an="SO42-" nC={2} nA={1} />,
    why: { "2": tr("2 · 2− = 4−, aber 2 · 3+ = 6+.", "2 · 2− = 4−, but 2 · 3+ = 6+."), "6": tr("6 ist die Ladung. Jedes Sulfat bringt 2−.", "6 is the charge. Each sulfate brings 2−.") },
    tip: tr("Rechne die Plus-Ladungen zusammen und teile durch die Ladung eines Sulfat-Ions.", "Add up the plus charges and divide by the charge of one sulfate ion."),
    ok: tr("2 · 3+ = 6+ und 3 · 2− = 6−.", "2 · 3+ = 6+ and 3 · 2− = 6−."),
  },
  {
    ask: tr("Welche Formel hat **Aluminiumsulfat**?", "What is the formula of **aluminium sulfate**?"), answer: "Al₂(SO₄)₃", options: ["Al₂(SO₄)₃", "Al₂SO₄₃", "Al₃(SO₄)₂", "AlSO₄"],
    visual: c => <Wall c={c} cat="Al3+" an="SO42-" nC={2} nA={3} />,
    why: { "Al₂SO₄₃": tr("Ohne Klammer stünde da „43 O-Atome“. Der Block SO₄ kommt in Klammern.", "Without brackets it would say “43 O atoms”. The SO₄ block goes in brackets."), "Al₃(SO₄)₂": tr("Zähle: 2 Aluminium-Ionen, 3 Sulfat-Ionen.", "Count: 2 aluminium ions, 3 sulfate ions."), "AlSO₄": tr("3+ und 2− gleichen sich nicht aus.", "3+ and 2− do not balance.") },
    labels: [{"at": ".ion-tile.anion", "text": tr("Sulfat-Ion: ein Block", "Sulfate ion: one block"), "point": "left", "side": "left"}],
    ok: tr("Anzahlen tiefgestellt, Block in Klammern: **Al₂(SO₄)₃**.", "Numbers as subscripts, block in brackets: **Al₂(SO₄)₃**."),
  },
  {
    part: tr("Nebengruppen und Namen", "Transition metals and names"),
    say: tr("Nebengruppen-Metalle bilden verschiedene Ionen. Die Ladung steht als **römische Zahl** im Namen: Eisen(III) = Fe³⁺.", "Transition metals form different ions. The charge is given as a **Roman numeral** in the name: iron(III) = Fe³⁺."),
    ask: tr("Welche Formel hat **Eisen(III)-chlorid**?", "What is the formula of **iron(III) chloride**?"), answer: "FeCl₃", options: ["FeCl₃", "FeCl₂", "Fe₃Cl", "FeCl"],
    why: { "FeCl₂": tr("FeCl₂ wäre Eisen(II)-chlorid.", "FeCl₂ would be iron(II) chloride."), "Fe₃Cl": tr("Die III ist die Ladung von Fe, nicht die Anzahl der Fe-Ionen.", "The III is the charge of Fe, not the number of Fe ions."), FeCl: tr("Fe³⁺ braucht drei Cl⁻.", "Fe³⁺ needs three Cl⁻.") },
    ok: tr("Fe³⁺ + 3 Cl⁻ → **FeCl₃**.", "Fe³⁺ + 3 Cl⁻ → **FeCl₃**."),
  },
  {
    say: tr("Umgekehrt: aus dem Anion auf die Ladung des Metalls schließen.", "The other way round: work out the charge of the metal from the anion."),
    ask: tr("Welche Ladung hat das Kupfer-Ion in **CuO**?", "What is the charge of the copper ion in **CuO**?"), answer: "2+", options: ["2+", "1+", "2−", "3+"],
    why: { "1+": tr("O²⁻ braucht 2+ – ein Cu muss 2+ tragen.", "O²⁻ needs 2+ – one Cu must carry 2+."), "2−": tr("Metall-Ionen sind positiv.", "Metal ions are positive."), "3+": tr("Dann wäre CuO nicht neutral.", "Then CuO would not be neutral.") },
    ok: tr("CuO = Kupfer(II)-oxid.", "CuO = copper(II) oxide."),
  },
  {
    say: tr("Endungen: **-id** einatomig (Sulfid S²⁻), **-at** mit Sauerstoff (Sulfat SO₄²⁻), **-it** ein O weniger (Sulfit SO₃²⁻).", "Endings: **-ide** monatomic (sulfide S²⁻), **-ate** with oxygen (sulfate SO₄²⁻), **-ite** one O fewer (sulfite SO₃²⁻)."),
    ask: tr("Wie heißt **Na₂SO₃**?", "What is **Na₂SO₃** called?"), answer: tr("Natriumsulfit", "Sodium sulfite"), options: [tr("Natriumsulfit", "Sodium sulfite"), tr("Natriumsulfat", "Sodium sulfate"), tr("Natriumsulfid", "Sodium sulfide")],
    why: { [tr("Natriumsulfat", "Sodium sulfate")]: tr("Sulfat ist SO₄ – hier sind nur 3 O.", "Sulfate is SO₄ – here there are only 3 O."), [tr("Natriumsulfid", "Sodium sulfide")]: tr("Sulfid ist S²⁻ ohne Sauerstoff.", "Sulfide is S²⁻ without oxygen.") },
    ok: tr("SO₃²⁻ = Sulfit.", "SO₃²⁻ = sulfite."),
  },
  {
    ask: tr("Wie heißt **FeSO₄**?", "What is **FeSO₄** called?"), answer: tr("Eisen(II)-sulfat", "Iron(II) sulfate"), options: [tr("Eisen(II)-sulfat", "Iron(II) sulfate"), tr("Eisen(III)-sulfat", "Iron(III) sulfate"), tr("Eisen(II)-sulfid", "Iron(II) sulfide"), tr("Eisen(IV)-sulfat", "Iron(IV) sulfate")],
    why: { [tr("Eisen(III)-sulfat", "Iron(III) sulfate")]: tr("SO₄²⁻ ist 2− – ein Fe muss 2+ tragen.", "SO₄²⁻ is 2− – one Fe must carry 2+."), [tr("Eisen(II)-sulfid", "Iron(II) sulfide")]: tr("SO₄ enthält Sauerstoff: Sulfat.", "SO₄ contains oxygen: sulfate."), [tr("Eisen(IV)-sulfat", "Iron(IV) sulfate")]: tr("Die 4 gehört zum Sauerstoff, nicht zum Eisen.", "The 4 belongs to the oxygen, not to the iron.") },
    ok: tr("Fe²⁺ + SO₄²⁻ → Eisen(II)-sulfat.", "Fe²⁺ + SO₄²⁻ → iron(II) sulfate."),
  },
  {
    ask: tr("Aus **Zn²⁺** und **PO₄³⁻**: Wie viele Zink-Ionen braucht man für **2** Phosphat-Ionen?", "From **Zn²⁺** and **PO₄³⁻**: how many zinc ions do you need for **2** phosphate ions?"), answer: 3, num: {},
    visual: c => <Wall c={c} cat="Zn2+" an="PO43-" nC={1} nA={2} />,
    why: { "2": tr("2 · 2+ = 4+, aber 2 · 3− = 6−.", "2 · 2+ = 4+, but 2 · 3− = 6−."), "6": tr("6 ist die Ladung. Jedes Zink-Ion bringt 2+.", "6 is the charge. Each zinc ion brings 2+.") },
    tip: tr("Rechne die Minus-Ladungen zusammen und teile durch die Ladung eines Zink-Ions.", "Add up the minus charges and divide by the charge of one zinc ion."),
    ok: tr("3 · 2+ = 6+ = 2 · 3− → **Zn₃(PO₄)₂**.", "3 · 2+ = 6+ = 2 · 3− → **Zn₃(PO₄)₂**."),
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
