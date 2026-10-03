// Geführte Erklärung Neutralisation: mit der Neutralisationswand der App (Metall-Ionen, OH⁻, H⁺, Säurereste;
// Verbindungsstriche = H₂O). Säuren und Laugen in Wasser, ausgleichen, Wasser zählen, Salz und Name, Gleichung.

import { Fit, type GuideCtx, type GuideDef, type GuideStep } from "@lern/ui";
import { HYDROXIDE_BY_ID, PROTIC_BY_ID, toSubscript } from "@lern/chem";
import { NeutralWall } from "./components/NeutralWall.tsx";
import { tr } from "@lern/i18n";

/** Neutralisationswand; mit `target` darunter zwei Knöpfe „+ Lauge“ (Ziel "B") und „+ Säure“ (Ziel "A") */
function Wall({ c, base, acid, step, nB, nA, target, react }: { c: GuideCtx; base: string; acid: string; step?: number; nB: number; nA: number; target?: "A" | "B"; react?: boolean }) {
  const b = HYDROXIDE_BY_ID[base], a = PROTIC_BY_ID[acid];
  return (
    <div className="nt-g">
      <Fit className="nt-g-wall" min={0.3}><NeutralWall base={b} acid={a} step={step ?? a.protons} nB={nB} nA={nA} showResult={false} products={react} /></Fit>
      {target && (
        <div className="nt-g-add">
          {([["B", b.formula, "base"], ["A", a.formula, "acid"]] as const).map(([id, f, cls]) => (
            <button key={id} type="button" className={`nt-g-btn ${cls}${c.show && target === id ? " g-sol" : ""}`} onClick={() => c.pick(id)}>
              + {toSubscript(f)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const missing = (base: string, acid: string, nB: number, nA: number, answer: "A" | "B", say: string, ok: string, step?: number): GuideStep => ({
  say, ask: tr("Was fehlt, damit die **OH⁻-Reihe** und die **H⁺-Reihe** gleich lang sind? Tippe es an.", "What is missing so that the **OH⁻ row** and the **H⁺ row** are the same length? Tap it."), answer,
  visual: c => <Wall c={c} base={base} acid={acid} step={step} nB={nB} nA={nA} target={answer} />,
  why: { [answer === "A" ? "B" : "A"]: tr("Dann wird die längere Reihe noch länger. Vergleiche OH⁻ und H⁺.", "Then the longer row gets even longer. Compare OH⁻ and H⁺.") },
  tip: tr("Vergleiche die OH⁻-Reihe mit der H⁺-Reihe: Bei der kürzeren fehlt ein Baustein.", "Compare the OH⁻ row with the H⁺ row: the shorter one is missing a tile."),
  labels: [{ at: ".nt-oh", text: tr("OH⁻ der Lauge", "OH⁻ of the alkali"), side: "left", point: "left" }, { at: ".nt-h", text: tr("H⁺ der Säure", "H⁺ of the acid"), side: "left", point: "left" }],
  ok,
});

const US: GuideStep[] = [
  {
    part: tr("Säuren", "Acids"),
    say: tr("**Säuren** geben in Wasser **H⁺-Ionen** ab. Übrig bleibt der **Säurerest** – er ist negativ geladen.", "In water, **acids** give off **H⁺ ions**. What remains is the **acid anion** – it is negatively charged."),
    ask: tr("Welche Ionen entstehen aus **HCl** in Wasser?", "Which ions form from **HCl** in water?"), answer: "H⁺ + Cl⁻", options: ["H⁺ + Cl⁻", "H⁻ + Cl⁺", "H₂ + Cl₂", tr("HCl bleibt ganz", "HCl stays whole")],
    why: { "H⁻ + Cl⁺": tr("Die Säure gibt ein **positives** H⁺ ab – der Rest wird negativ.", "The acid gives off a **positive** H⁺ – the anion becomes negative."), "H₂ + Cl₂": tr("Es entstehen Ionen, keine Gase.", "Ions form, not gases."), [tr("HCl bleibt ganz", "HCl stays whole")]: tr("In Wasser gibt HCl sein H⁺ ab.", "In water HCl gives off its H⁺.") },
    ok: tr("HCl → H⁺ + Cl⁻ (Chlorid).", "HCl → H⁺ + Cl⁻ (chloride)."),
  },
  {
    say: tr("Für jedes abgegebene H⁺ bleibt eine **negative Ladung** am Säurerest.", "For every H⁺ given off, one **negative charge** stays on the acid anion."),
    ask: tr("**H₂SO₄** gibt beide H⁺ ab. Welche Ladung hat der Säurerest SO₄?", "**H₂SO₄** gives off both H⁺. What is the charge of the acid anion SO₄?"), answer: "2−", options: ["2−", "1−", "2+", "4−"],
    why: { "1−": tr("Zwei H⁺ gehen weg – also zwei negative Ladungen.", "Two H⁺ leave – so two negative charges."), "2+": tr("Der Rest wird negativ, nicht positiv.", "The anion becomes negative, not positive."), "4−": tr("Die 4 gehört zu den O-Atomen.", "The 4 belongs to the O atoms.") },
    ok: tr("H₂SO₄ → 2 H⁺ + SO₄²⁻ (Sulfat).", "H₂SO₄ → 2 H⁺ + SO₄²⁻ (sulfate)."),
  },
  {
    say: tr("Säurereste **ohne** Sauerstoff enden auf **-id**, **mit** Sauerstoff meist auf **-at**.", "Acid anions **without** oxygen end in **-ide**, **with** oxygen mostly in **-ate**."),
    ask: tr("Wie heißt **Cl⁻**, der Säurerest der Salzsäure?", "What is **Cl⁻**, the acid anion of hydrochloric acid, called?"), answer: tr("Chlorid", "chloride"),
    options: [tr("Chlorid", "chloride"), tr("Chlorat", "chlorate"), tr("Chlor", "chlorine")],
    why: { [tr("Chlorat", "chlorate")]: tr("-at nur mit Sauerstoff. Cl⁻ hat keinen.", "-ate only with oxygen. Cl⁻ has none."), [tr("Chlor", "chlorine")]: tr("Chlor ist das Element Cl₂. Das Ion heißt anders.", "Chlorine is the element Cl₂. The ion has a different name.") },
    ok: tr("Cl⁻ = Chlorid (ohne O → -id).", "Cl⁻ = chloride (no O → -ide)."),
  },
  {
    say: tr("Weitere Namen: NO₃⁻ **Nitrat**, SO₄²⁻ **Sulfat**, SO₃²⁻ **Sulfit**, CO₃²⁻ **Carbonat**, PO₄³⁻ **Phosphat**, CH₃COO⁻ **Acetat**.", "Names of acid anions: Cl⁻ **chloride**, NO₃⁻ **nitrate**, SO₄²⁻ **sulfate**, SO₃²⁻ **sulfite**, CO₃²⁻ **carbonate**, PO₄³⁻ **phosphate**, CH₃COO⁻ **acetate**."),
    ask: tr("Wie heißt der Säurerest von **H₃PO₄**, wenn alle 3 H⁺ abgegeben sind?", "What is the acid anion of **H₃PO₄** called when all 3 H⁺ have been given off?"), answer: tr("Phosphat", "phosphate"), options: [tr("Phosphat", "phosphate"), tr("Phosphid", "phosphide"), tr("Phosphit", "phosphite"), tr("Sulfat", "sulfate")],
    why: { [tr("Phosphid", "phosphide")]: tr("-id hat nur ein einzelnes P³⁻ ohne Sauerstoff.", "-ide is only a single P³⁻ without oxygen."), [tr("Phosphit", "phosphite")]: tr("PO₄ heißt Phosphat.", "PO₄ is called phosphate."), [tr("Sulfat", "sulfate")]: tr("Sulfat ist SO₄ (Schwefel).", "Sulfate is SO₄ (sulfur).") },
    ok: tr("PO₄³⁻ = Phosphat.", "PO₄³⁻ = phosphate."),
  },
  {
    part: tr("Laugen und Wasser", "Alkalis and water"),
    say: tr("**Laugen** enthalten **Hydroxid-Ionen OH⁻**.", "**Alkalis** contain **hydroxide ions OH⁻**."),
    ask: tr("Aus welchen Ionen besteht **Ca(OH)₂**?", "Which ions does **Ca(OH)₂** consist of?"), answer: "Ca²⁺ + 2 OH⁻", options: ["Ca²⁺ + 2 OH⁻", "Ca⁺ + OH⁻", "Ca²⁺ + O²⁻ + H₂", tr("CaO + H₂O", "CaO + H₂O")],
    why: { "Ca⁺ + OH⁻": tr("Calcium bildet Ca²⁺ – dazu passen zwei OH⁻.", "Calcium forms Ca²⁺ – two OH⁻ go with it."), "Ca²⁺ + O²⁻ + H₂": tr("OH⁻ bleibt als Hydroxid-Ion zusammen.", "OH⁻ stays together as a hydroxide ion."), [tr("CaO + H₂O", "CaO + H₂O")]: tr("Gefragt sind die Ionen.", "The question asks for the ions.") },
    ok: tr("Ca(OH)₂ → Ca²⁺ + 2 OH⁻.", "Ca(OH)₂ → Ca²⁺ + 2 OH⁻."),
  },
  {
    say: tr("Natronlauge NaOH trifft auf Salzsäure HCl.", "Sodium hydroxide NaOH meets hydrochloric acid HCl."),
    ask: tr("Was entsteht, wenn ein **H⁺** auf ein **OH⁻** trifft? Sag es vorher!", "What forms when an **H⁺** meets an **OH⁻**? Predict it!"), answer: tr("Wasser H₂O", "water H₂O"),
    options: [tr("Wasser H₂O", "water H₂O"), tr("Wasserstoff H₂", "hydrogen H₂"), tr("Sauerstoff O₂", "oxygen O₂")],
    visual: c => <Wall c={c} base="naoh" acid="hcl" nB={1} nA={1} react={c.solved} />,
    why: { [tr("Wasserstoff H₂", "hydrogen H₂")]: tr("H₂ braucht zwei H. Hier treffen ein H⁺ und ein OH⁻ zusammen.", "H₂ needs two H. Here one H⁺ and one OH⁻ meet."), [tr("Sauerstoff O₂", "oxygen O₂")]: tr("O₂ braucht zwei O. Zähle die Atome in H⁺ + OH⁻.", "O₂ needs two O. Count the atoms in H⁺ + OH⁻.") },
    ok: tr("Schau: H⁺ + OH⁻ → H₂O. Na⁺ und Cl⁻ bilden das Salz NaCl.", "Look: H⁺ + OH⁻ → H₂O. Na⁺ and Cl⁻ form the salt NaCl."),
  },
  {
    say: tr("**Neutralisation**: H⁺ + OH⁻ → H₂O. In der Wand verbinden die Striche je ein OH⁻ mit einem H⁺ zu Wasser.", "**Neutralisation**: H⁺ + OH⁻ → H₂O. In the wall each line joins one OH⁻ with one H⁺ to make water."),
    ask: tr("Wie viele **Wasser-Moleküle** entstehen aus NaOH + HCl?", "How many **water molecules** form from NaOH + HCl?"), answer: 1, num: {},
    visual: c => <Wall c={c} base="naoh" acid="hcl" nB={1} nA={1} />,
    why: { "2": tr("Ein OH⁻ und ein H⁺ ergeben ein H₂O.", "One OH⁻ and one H⁺ make one H₂O.") },
    tip: tr("Jeder Verbindungsstrich zwischen OH⁻ und H⁺ ist ein H₂O.", "Each line between OH⁻ and H⁺ is one H₂O."),
    labels: [{"at": ".nt-oh", "text": tr("OH⁻ der Lauge", "OH⁻ of the alkali"), "point": "left", "side": "left"}, {"at": ".nt-h", "text": tr("H⁺ der Säure", "H⁺ of the acid"), "point": "left", "side": "left"}, {"at": ".nw-link.on", "text": "H₂O", "side": "right"}],
    ok: tr("NaOH + HCl → NaCl + H₂O.", "NaOH + HCl → NaCl + H₂O."),
  },
  missing("caoh2", "hcl", 1, 1, "A",
    tr("Ca(OH)₂ bringt **2** OH⁻ mit. Neutral ist es erst, wenn gleich viele H⁺ dazukommen.", "Ca(OH)₂ brings **2** OH⁻. It is only neutral when the same number of H⁺ is added."),
    tr("Ca(OH)₂ + 2 HCl: 2 OH⁻ und 2 H⁺.", "Ca(OH)₂ + 2 HCl: 2 OH⁻ and 2 H⁺.")),
  {
    ask: tr("Wie viele Wasser-Moleküle entstehen bei **Ca(OH)₂ + 2 HCl**?", "How many water molecules form in **Ca(OH)₂ + 2 HCl**?"), answer: 2, num: {},
    visual: c => <Wall c={c} base="caoh2" acid="hcl" nB={1} nA={2} />,
    why: { "1": tr("Es gibt 2 Paare aus OH⁻ und H⁺.", "There are 2 pairs of OH⁻ and H⁺."), "3": tr("Zähle die Verbindungsstriche: OH⁻ + H⁺.", "Count the connecting lines: OH⁻ + H⁺.") },
    tip: tr("Zähle die Verbindungsstriche: jeder ist ein H₂O.", "Count the connecting lines: each is one H₂O."),
    labels: [{"at": ".nw-link.on", "text": "H₂O", "side": "right"}],
    ok: tr("2 OH⁻ + 2 H⁺ → 2 H₂O.", "2 OH⁻ + 2 H⁺ → 2 H₂O."),
  },
  {
    part: tr("Salz und Gleichung", "Salt and equation"),
    say: tr("Übrig bleiben Metall-Ion und Säurerest. Zusammen bilden sie das **Salz**.", "Metal ion and acid anion remain. Together they form the **salt**."),
    ask: tr("Welches Salz entsteht aus Ca(OH)₂ und HCl?", "Which salt forms from Ca(OH)₂ and HCl?"), answer: "CaCl₂", options: ["CaCl₂", "CaCl", "CaH₂", "Ca(OH)Cl"],
    visual: c => <Wall c={c} base="caoh2" acid="hcl" nB={1} nA={2} />,
    why: { CaCl: tr("Ca²⁺ braucht zwei Cl⁻.", "Ca²⁺ needs two Cl⁻."), "CaH₂": tr("Die H⁺ werden zu Wasser – im Salz ist der Säurerest.", "The H⁺ become water – the salt contains the acid anion."), "Ca(OH)Cl": tr("Alle OH⁻ wurden zu Wasser.", "All OH⁻ have become water.") },
    labels: [{"at": ".nt-cat", "text": tr("Metall-Ion", "Metal ion"), "point": "left", "side": "left"}, {"at": ".nt-an", "text": tr("Säurerest", "Acid anion"), "point": "left", "side": "left"}],
    ok: tr("Calciumchlorid **CaCl₂**.", "Calcium chloride **CaCl₂**."),
  },
  missing("naoh", "h2so4", 1, 1, "B",
    tr("H₂SO₄ gibt **2** H⁺ ab – NaOH bringt nur **1** OH⁻ mit.", "H₂SO₄ gives off **2** H⁺ – NaOH brings only **1** OH⁻."),
    tr("2 NaOH + H₂SO₄: 2 OH⁻ und 2 H⁺.", "2 NaOH + H₂SO₄: 2 OH⁻ and 2 H⁺.")),
  {
    ask: tr("Welches Salz entsteht aus **2 NaOH + H₂SO₄**?", "Which salt forms from **2 NaOH + H₂SO₄**?"), answer: "Na₂SO₄", options: ["Na₂SO₄", "NaSO₄", "Na(SO₄)₂", "NaH₂SO₄"],
    visual: c => <Wall c={c} base="naoh" acid="h2so4" nB={2} nA={1} />,
    why: { "NaSO₄": tr("SO₄²⁻ braucht zwei Na⁺.", "SO₄²⁻ needs two Na⁺."), "Na(SO₄)₂": tr("Na⁺ ist nur 1+ – es braucht mehr Na, nicht mehr SO₄.", "Na⁺ is only 1+ – it needs more Na, not more SO₄."), "NaH₂SO₄": tr("Beide H⁺ wurden zu Wasser.", "Both H⁺ have become water.") },
    labels: [{"at": ".nt-cat", "text": tr("Metall-Ion", "Metal ion"), "point": "left", "side": "left"}, {"at": ".nt-an", "text": tr("Säurerest", "Acid anion"), "point": "left", "side": "left"}],
    ok: tr("SO₄²⁻ braucht zwei Na⁺: **Na₂SO₄**.", "SO₄²⁻ needs two Na⁺: **Na₂SO₄**."),
  },
  {
    ask: tr("Wie heißt **Na₂SO₄**?", "What is **Na₂SO₄** called?"), answer: tr("Natriumsulfat", "Sodium sulfate"), options: [tr("Natriumsulfat", "Sodium sulfate"), tr("Natriumsulfit", "Sodium sulfite"), tr("Natriumsulfid", "Sodium sulfide"), tr("Natriumschwefelsäure", "Sodium sulfuric acid")],
    why: { [tr("Natriumsulfit", "Sodium sulfite")]: tr("Sulfit ist SO₃.", "Sulfite is SO₃."), [tr("Natriumsulfid", "Sodium sulfide")]: tr("Sulfid ist S²⁻ ohne Sauerstoff.", "Sulfide is S²⁻ without oxygen."), [tr("Natriumschwefelsäure", "Sodium sulfuric acid")]: tr("Im Salz steht der Säurerest: Sulfat.", "The salt contains the acid anion: sulfate.") },
    ok: tr("Natronlauge + Schwefelsäure → Natriumsulfat + Wasser.", "Sodium hydroxide solution + sulfuric acid → sodium sulfate + water."),
  },
  {
    ask: tr("Welche Gleichung ist richtig ausgeglichen?", "Which equation is correctly balanced?"), answer: "2 NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O",
    options: ["2 NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O", "NaOH + H₂SO₄ → NaSO₄ + H₂O", "2 NaOH + H₂SO₄ → Na₂SO₄ + H₂O", "NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O"],
    why: {
      "NaOH + H₂SO₄ → NaSO₄ + H₂O": tr("NaSO₄ gibt es nicht – SO₄²⁻ braucht zwei Na⁺.", "NaSO₄ does not exist – SO₄²⁻ needs two Na⁺."),
      "2 NaOH + H₂SO₄ → Na₂SO₄ + H₂O": tr("2 OH⁻ und 2 H⁺ ergeben 2 H₂O.", "2 OH⁻ and 2 H⁺ make 2 H₂O."),
      "NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O": tr("Links nur 1 Na, rechts 2 Na.", "Only 1 Na on the left, 2 Na on the right."),
    },
    ok: tr("Zahl der H₂O = Zahl der OH⁻ = Zahl der H⁺.", "Number of H₂O = number of OH⁻ = number of H⁺."),
  },
];

const OS: GuideStep[] = [
  {
    part: tr("Mehrprotonige Säuren", "Polyprotic acids"),
    say: tr("**einprotonig**: HCl, HNO₃, CH₃COOH · **zweiprotonig**: H₂SO₄, H₂CO₃, H₂S · **dreiprotonig**: H₃PO₄. Bei der Essigsäure ist nur das H der COOH-Gruppe abgebbar.", "**monoprotic**: HCl, HNO₃, CH₃COOH · **diprotic**: H₂SO₄, H₂CO₃, H₂S · **triprotic**: H₃PO₄. In acetic acid only the H of the COOH group can be given off."),
    ask: tr("Wie viele H⁺ kann **CH₃COOH** höchstens abgeben?", "How many H⁺ can **CH₃COOH** give off at most?"), answer: 1, num: {},
    why: { "4": tr("Die H-Atome am C werden nicht abgegeben – nur das H der COOH-Gruppe.", "The H atoms on C are not given off – only the H of the COOH group.") },
    tip: tr("Nur das H, das an ein O-Atom gebunden ist, wird abgegeben.", "Only the H bonded to an O atom is given off."),
    ok: tr("Essigsäure ist einprotonig: CH₃COOH → H⁺ + CH₃COO⁻.", "Acetic acid is monoprotic: CH₃COOH → H⁺ + CH₃COO⁻."),
  },
  {
    say: tr("Mehrprotonige Säuren geben H⁺ **schrittweise** ab: H₃PO₄ → H₂PO₄⁻ → HPO₄²⁻ → PO₄³⁻.", "Polyprotic acids give off H⁺ **step by step**: H₃PO₄ → H₂PO₄⁻ → HPO₄²⁻ → PO₄³⁻."),
    ask: tr("Welche Ladung hat der Rest, wenn H₃PO₄ **2 H⁺** abgibt?", "What is the charge of the anion when H₃PO₄ gives off **2 H⁺**?"), answer: "2−", options: ["2−", "1−", "3−"],
    why: { "1−": tr("Zwei H⁺ weg – zwei negative Ladungen.", "Two H⁺ gone – two negative charges."), "3−": tr("3− erst, wenn alle drei H⁺ abgegeben sind.", "3− only when all three H⁺ have been given off.") },
    ok: tr("Je abgegebenem H⁺ eine negative Ladung: **HPO₄²⁻**.", "One negative charge per H⁺ given off: **HPO₄²⁻**."),
  },
  {
    say: tr("Noch H im Rest: **Hydrogen-** (ein H) bzw. **Dihydrogen-** (zwei H).", "H still in the anion: **hydrogen** (one H) or **dihydrogen** (two H)."),
    ask: tr("Wie heißt **HPO₄²⁻**?", "What is **HPO₄²⁻** called?"), answer: tr("Hydrogenphosphat", "hydrogen phosphate"), options: [tr("Hydrogenphosphat", "hydrogen phosphate"), tr("Dihydrogenphosphat", "dihydrogen phosphate"), tr("Phosphat", "phosphate"), tr("Hydrogenphosphit", "hydrogen phosphite")],
    why: { [tr("Dihydrogenphosphat", "dihydrogen phosphate")]: tr("Dihydrogen- hätte 2 H (H₂PO₄⁻).", "Dihydrogen would have 2 H (H₂PO₄⁻)."), [tr("Phosphat", "phosphate")]: tr("Phosphat ist PO₄³⁻ ohne H.", "Phosphate is PO₄³⁻ without H."), [tr("Hydrogenphosphit", "hydrogen phosphite")]: tr("PO₄ heißt Phosphat.", "PO₄ is called phosphate.") },
    ok: tr("HPO₄²⁻ = Hydrogenphosphat.", "HPO₄²⁻ = hydrogen phosphate."),
  },
  {
    ask: tr("Wie heißt der Rest, wenn **H₂CO₃** nur **1 H⁺** abgibt?", "What is the anion called when **H₂CO₃** gives off only **1 H⁺**?"), answer: tr("Hydrogencarbonat", "hydrogen carbonate"), options: [tr("Hydrogencarbonat", "hydrogen carbonate"), tr("Carbonat", "carbonate"), tr("Dihydrogencarbonat", "dihydrogen carbonate")],
    why: { [tr("Carbonat", "carbonate")]: tr("Carbonat (CO₃²⁻) erst nach 2 H⁺.", "Carbonate (CO₃²⁻) only after 2 H⁺."), [tr("Dihydrogencarbonat", "dihydrogen carbonate")]: tr("Ein H ist schon weg – es bleibt eines.", "One H has already gone – one remains.") },
    ok: tr("HCO₃⁻ = Hydrogencarbonat.", "HCO₃⁻ = hydrogen carbonate."),
  },
  {
    part: tr("Ausgleichen", "Balancing"),
    say: tr("Neutralisation: H⁺ + OH⁻ → H₂O. Die OH⁻-Reihe und die H⁺-Reihe müssen gleich lang sein.", "Neutralisation: H⁺ + OH⁻ → H₂O. The OH⁻ row and the H⁺ row must be the same length."),
    ask: tr("**2 Al(OH)₃** bringen 6 OH⁻. Wie viele **H₂SO₄** braucht man?", "**2 Al(OH)₃** bring 6 OH⁻. How many **H₂SO₄** do you need?"), answer: 3, num: {},
    visual: c => <Wall c={c} base="aloh3" acid="h2so4" nB={2} nA={1} />,
    why: { "6": tr("Jedes H₂SO₄ bringt 2 H⁺: 6 : 2.", "Each H₂SO₄ brings 2 H⁺: 6 ÷ 2."), "2": tr("2 H₂SO₄ sind nur 4 H⁺.", "2 H₂SO₄ are only 4 H⁺.") },
    tip: tr("Wie viele H⁺ bringt ein H₂SO₄? Teile die OH⁻ durch diese Zahl.", "How many H⁺ does one H₂SO₄ bring? Divide the OH⁻ by this number."),
    labels: [{"at": ".nt-oh", "text": tr("OH⁻ der Lauge", "OH⁻ of the alkali"), "point": "left", "side": "left"}, {"at": ".nt-h", "text": tr("H⁺ der Säure", "H⁺ of the acid"), "point": "right", "side": "right"}],
    ok: tr("2 Al(OH)₃ + 3 H₂SO₄ → Al₂(SO₄)₃ + 6 H₂O.", "2 Al(OH)₃ + 3 H₂SO₄ → Al₂(SO₄)₃ + 6 H₂O."),
  },
  {
    ask: tr("Wie viele **H₂O** entstehen bei 2 Al(OH)₃ + 3 H₂SO₄?", "How many **H₂O** form in 2 Al(OH)₃ + 3 H₂SO₄?"), answer: 6, num: {},
    visual: c => <Wall c={c} base="aloh3" acid="h2so4" nB={2} nA={3} />,
    why: { "3": tr("Jedes Paar aus OH⁻ und H⁺ gibt ein H₂O: 6.", "Each pair of OH⁻ and H⁺ gives one H₂O: 6."), "5": tr("6 OH⁻ treffen auf 6 H⁺.", "6 OH⁻ meet 6 H⁺.") },
    tip: tr("Jedes OH⁻ trifft ein H⁺ und bildet ein H₂O. Zähle die OH⁻.", "Each OH⁻ meets one H⁺ and forms one H₂O. Count the OH⁻."),
    ok: tr("Zahl der H₂O = Zahl der OH⁻ = Zahl der H⁺.", "Number of H₂O = number of OH⁻ = number of H⁺."),
  },
  missing("caoh2", "h2co3", 1, 1, "A",
    tr("Gibt die Säure **nicht alle** H⁺ ab, entsteht ein **Hydrogensalz**. Hier gibt jedes H₂CO₃ nur **1 H⁺** ab.", "If the acid does **not** give off **all** H⁺, a **hydrogen salt** forms. Here each H₂CO₃ gives off only **1 H⁺**."),
    "Ca(OH)₂ + 2 H₂CO₃ → Ca(HCO₃)₂ + 2 H₂O.", 1),
  {
    part: tr("Salze benennen", "Naming salts"),
    ask: tr("Wie heißt **Ca(HCO₃)₂**?", "What is **Ca(HCO₃)₂** called?"), answer: tr("Calciumhydrogencarbonat", "Calcium hydrogen carbonate"), options: [tr("Calciumhydrogencarbonat", "Calcium hydrogen carbonate"), tr("Calciumcarbonat", "Calcium carbonate"), tr("Calciumdihydrogencarbonat", "Calcium dihydrogen carbonate")],
    visual: c => <Wall c={c} base="caoh2" acid="h2co3" step={1} nB={1} nA={2} />,
    why: { [tr("Calciumcarbonat", "Calcium carbonate")]: tr("Im Rest steckt noch ein H: HCO₃⁻.", "The anion still contains one H: HCO₃⁻."), [tr("Calciumdihydrogencarbonat", "Calcium dihydrogen carbonate")]: tr("HCO₃⁻ hat nur 1 H.", "HCO₃⁻ has only 1 H.") },
    labels: [{"at": ".nt-an", "text": tr("Säurerest mit H", "Acid anion with H"), "point": "left", "side": "left"}],
    ok: tr("Hydrogencarbonat – kommt im Leitungswasser vor.", "Hydrogen carbonate – found in tap water."),
  },
  {
    ask: tr("Welches Salz entsteht aus **NaOH + H₃PO₄**, wenn nur **1 H⁺** abgegeben wird?", "Which salt forms from **NaOH + H₃PO₄** when only **1 H⁺** is given off?"), answer: "NaH₂PO₄", options: ["NaH₂PO₄", "Na₂HPO₄", "Na₃PO₄", "NaPO₄"],
    visual: c => <Wall c={c} base="naoh" acid="h3po4" step={1} nB={1} nA={1} />,
    why: { "Na₂HPO₄": tr("Das wäre nach 2 H⁺ (HPO₄²⁻).", "That would be after 2 H⁺ (HPO₄²⁻)."), "Na₃PO₄": tr("Das wäre nach allen 3 H⁺.", "That would be after all 3 H⁺."), "NaPO₄": tr("PO₄³⁻ bräuchte drei Na⁺.", "PO₄³⁻ would need three Na⁺.") },
    ok: tr("Natriumdihydrogenphosphat **NaH₂PO₄**.", "Sodium dihydrogen phosphate **NaH₂PO₄**."),
  },
  {
    ask: tr("Welches Salz entsteht aus **KOH** und **H₂SO₄**, wenn **alle** H⁺ abgegeben werden?", "Which salt forms from **KOH** and **H₂SO₄** when **all** H⁺ are given off?"), answer: "K₂SO₄", options: ["K₂SO₄", "KHSO₄", "KSO₄", "K(SO₄)₂"],
    why: { "KHSO₄": tr("KHSO₄ entsteht, wenn nur 1 H⁺ abgegeben wird.", "KHSO₄ forms when only 1 H⁺ is given off."), "KSO₄": tr("SO₄²⁻ braucht zwei K⁺.", "SO₄²⁻ needs two K⁺."), "K(SO₄)₂": tr("K⁺ ist 1+ – es braucht mehr K, nicht mehr SO₄.", "K⁺ is 1+ – it needs more K, not more SO₄.") },
    ok: tr("Kaliumsulfat **K₂SO₄**.", "Potassium sulfate **K₂SO₄**."),
  },
  {
    ask: tr("Welche Gleichung ist richtig ausgeglichen?", "Which equation is correctly balanced?"), answer: "3 Ba(OH)₂ + 2 H₃PO₄ → Ba₃(PO₄)₂ + 6 H₂O",
    options: ["3 Ba(OH)₂ + 2 H₃PO₄ → Ba₃(PO₄)₂ + 6 H₂O", "Ba(OH)₂ + H₃PO₄ → BaPO₄ + H₂O", "3 Ba(OH)₂ + 2 H₃PO₄ → Ba₃(PO₄)₂ + 3 H₂O", "2 Ba(OH)₂ + 3 H₃PO₄ → Ba₂(PO₄)₃ + 6 H₂O"],
    why: {
      "Ba(OH)₂ + H₃PO₄ → BaPO₄ + H₂O": tr("Ba²⁺ und PO₄³⁻ gleichen sich so nicht aus.", "Ba²⁺ and PO₄³⁻ do not balance like this."),
      "3 Ba(OH)₂ + 2 H₃PO₄ → Ba₃(PO₄)₂ + 3 H₂O": tr("6 OH⁻ und 6 H⁺ ergeben 6 H₂O.", "6 OH⁻ and 6 H⁺ make 6 H₂O."),
      "2 Ba(OH)₂ + 3 H₃PO₄ → Ba₂(PO₄)₃ + 6 H₂O": tr("2 · 2+ = 4+, aber 3 · 3− = 9−.", "2 · 2+ = 4+, but 3 · 3− = 9−."),
    },
    ok: tr("3 Ba²⁺ (6+) und 2 PO₄³⁻ (6−).", "3 Ba²⁺ (6+) and 2 PO₄³⁻ (6−)."),
  },
  {
    ask: tr("Kalkwasser Ca(OH)₂ + Salpetersäure HNO₃ → **?** + Wasser. Wie heißt das Salz?", "Limewater Ca(OH)₂ + nitric acid HNO₃ → **?** + water. What is the salt called?"), answer: tr("Calciumnitrat", "Calcium nitrate"), options: [tr("Calciumnitrat", "Calcium nitrate"), tr("Calciumnitrit", "Calcium nitrite"), tr("Calciumnitrid", "Calcium nitride")],
    why: { [tr("Calciumnitrit", "Calcium nitrite")]: tr("Nitrit ist NO₂⁻. HNO₃ gibt Nitrat NO₃⁻.", "Nitrite is NO₂⁻. HNO₃ gives nitrate NO₃⁻."), [tr("Calciumnitrid", "Calcium nitride")]: tr("Nitrid ist N³⁻ ohne Sauerstoff.", "Nitride is N³⁻ without oxygen.") },
    ok: tr("Ca(OH)₂ + 2 HNO₃ → Ca(NO₃)₂ + 2 H₂O.", "Ca(OH)₂ + 2 HNO₃ → Ca(NO₃)₂ + 2 H₂O."),
  },
];

export function guideFor(stufe: "us" | "os"): GuideDef {
  return stufe === "us"
    ? { title: tr("Neutralisation", "Neutralisation"), steps: US, outro: [
      tr("Säuren geben H⁺ ab, der Säurerest wird negativ (Chlorid, Sulfat, Phosphat …).", "Acids give off H⁺, the acid anion becomes negative (chloride, sulfate, phosphate …)."),
      tr("Laugen enthalten OH⁻. **H⁺ + OH⁻ → H₂O**.", "Alkalis contain OH⁻. **H⁺ + OH⁻ → H₂O**."),
      tr("Ausgleichen: gleich viele OH⁻ wie H⁺ – so viele H₂O entstehen.", "Balancing: as many OH⁻ as H⁺ – that many H₂O form."),
      tr("Salz = Metall-Ion + Säurerest: Lauge + Säure → Salz + Wasser.", "Salt = metal ion + acid anion: alkali + acid → salt + water."),
    ] }
    : { title: tr("Neutralisation", "Neutralisation"), steps: OS, outro: [
      tr("ein-, zwei-, dreiprotonig; Essigsäure gibt nur 1 H⁺ ab.", "mono-, di-, triprotic; acetic acid gives off only 1 H⁺."),
      tr("Schrittweise Abgabe: Dihydrogen-, Hydrogen-, ganz abgegeben (H₂PO₄⁻, HPO₄²⁻, PO₄³⁻).", "Step by step: dihydrogen, hydrogen, fully given off (H₂PO₄⁻, HPO₄²⁻, PO₄³⁻)."),
      tr("Koeffizienten und Wasser aus gleich vielen OH⁻ und H⁺.", "Coefficients and water from equal numbers of OH⁻ and H⁺."),
      tr("Hydrogensalze bei teilweiser Abgabe: NaH₂PO₄, Ca(HCO₃)₂.", "Hydrogen salts on partial release: NaH₂PO₄, Ca(HCO₃)₂."),
    ] };
}
