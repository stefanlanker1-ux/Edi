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

const missing = (base: string, acid: string, nB: number, nA: number, answer: "A" | "B", say: string, ok: string, step?: number): Omit<GuideStep, "mode"> => ({
  say, ask: tr("Was fehlt, damit die **OH⁻-Reihe** und die **H⁺-Reihe** gleich lang sind? Tippe es an.", "What is missing so that the **OH⁻ row** and the **H⁺ row** are the same length? Tap it."), answer,
  visual: c => <Wall c={c} base={base} acid={acid} step={step} nB={nB} nA={nA} target={answer} />,
  why: { [answer === "A" ? "B" : "A"]: tr("Dann wird die längere Reihe noch länger. Vergleiche OH⁻ und H⁺.", "Then the longer row gets even longer. Compare OH⁻ and H⁺.") },
  tip: tr("Vergleiche die OH⁻-Reihe mit der H⁺-Reihe: Bei der kürzeren fehlt ein Baustein.", "Compare the OH⁻ row with the H⁺ row: the shorter one is missing a tile."),
  labels: [{ at: ".nt-oh", text: tr("OH⁻ der Lauge", "OH⁻ of the alkali"), side: "left", point: "left" }, { at: ".nt-h", text: tr("H⁺ der Säure", "H⁺ of the acid"), side: "left", point: "left" }],
  ok,
});

const US: GuideStep[] = [
  {
    mode: "worked",
    part: tr("Säuren", "Acids"),
    say: tr("**Säuren** geben in Wasser **H⁺-Ionen** ab.", "In water, **acids** give off **H⁺ ions**."),
    ask: tr("Was passiert mit **HCl** in Wasser?", "What happens to **HCl** in water?"),
    lines: [tr("HCl gibt sein H als H⁺ ab (positiv).", "HCl gives off its H as H⁺ (positive)."), tr("Übrig bleibt Cl⁻ – der **Säurerest**, negativ geladen.", "What remains is Cl⁻ – the **acid anion**, negatively charged."), tr("**HCl → H⁺ + Cl⁻**", "**HCl → H⁺ + Cl⁻**")],
    ok: tr("Jede Säure: H⁺ + Säurerest.", "Every acid: H⁺ + acid anion."),
  },
  {
    mode: "faded",
    say: tr("Für jedes abgegebene H⁺ bleibt eine **negative Ladung** am Säurerest.", "For every H⁺ given off, one **negative charge** stays on the acid anion."),
    ask: tr("Ergänze: Welche Ladung hat der Säurerest von **H₂SO₄**?", "Complete: what is the charge of the acid anion of **H₂SO₄**?"), answer: "2−", options: ["1−", "2−", "2+", "4−"],
    why: { "1−": tr("Zwei H⁺ gehen weg – also zwei negative Ladungen.", "Two H⁺ leave – so two negative charges."), "2+": tr("Der Rest wird negativ, nicht positiv.", "The anion becomes negative, not positive."), "4−": tr("Die 4 gehört zu den O-Atomen.", "The 4 belongs to the O atoms.") },
    ok: tr("H₂SO₄ → 2 H⁺ + SO₄²⁻ (Sulfat).", "H₂SO₄ → 2 H⁺ + SO₄²⁻ (sulfate)."),
    lines: [tr("H₂SO₄ gibt 2 H⁺ ab.", "H₂SO₄ gives off 2 H⁺."), tr("Je H⁺ bleibt eine negative Ladung → SO₄: {?}", "One negative charge stays per H⁺ → SO₄: {?}")],
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Welche Ionen entstehen aus **HNO₃** in Wasser?", "Your turn: which ions form from **HNO₃** in water?"), answer: "H⁺ + NO₃⁻", options: [tr("HNO₃ bleibt ganz", "HNO₃ stays whole"), "H₂ + NO₃", "H⁺ + NO₃⁻", "H⁻ + NO₃⁺"],
    lines: [tr("HNO₃ → H⁺ + NO₃⁻ (ein H, eine negative Ladung).", "HNO₃ → H⁺ + NO₃⁻ (one H, one negative charge).")],
    why: { "H⁻ + NO₃⁺": tr("Die Säure gibt ein **positives** H⁺ ab – der Rest wird negativ.", "The acid gives off a **positive** H⁺ – the anion becomes negative."), "H₂ + NO₃": tr("Es entstehen Ionen, kein Gas.", "Ions form, not a gas."), [tr("HNO₃ bleibt ganz", "HNO₃ stays whole")]: tr("In Wasser gibt die Säure ihr H⁺ ab.", "In water the acid gives off its H⁺.") },
    ok: tr("Genau: H⁺ + NO₃⁻.", "Exactly: H⁺ + NO₃⁻."),
  },
  {
    mode: "worked",
    say: tr("Säurereste haben eigene Namen.", "Acid anions have their own names."),
    ask: tr("Wie heißen die Säurereste?", "What are the acid anions called?"),
    lines: [tr("Ohne Sauerstoff → **-id**: Cl⁻ **Chlorid**.", "Without oxygen → **-ide**: Cl⁻ **chloride**."), tr("Mit Sauerstoff → **-at**: NO₃⁻ **Nitrat**, SO₄²⁻ **Sulfat**, CO₃²⁻ **Carbonat**, PO₄³⁻ **Phosphat**.", "With oxygen → **-ate**: NO₃⁻ **nitrate**, SO₄²⁻ **sulfate**, CO₃²⁻ **carbonate**, PO₄³⁻ **phosphate**."), tr("Ein O weniger → **-it**: SO₃²⁻ **Sulfit**. CH₃COO⁻ **Acetat**, HCOO⁻ **Formiat**.", "One O fewer → **-ite**: SO₃²⁻ **sulfite**. CH₃COO⁻ **acetate**, HCOO⁻ **formate**.")],
    ok: tr("Die Endung verrät den Sauerstoff.", "The ending tells you about the oxygen."),
  },
  {
    mode: "faded",
    say: tr("Säurereste **ohne** Sauerstoff enden auf **-id**, **mit** Sauerstoff meist auf **-at**.", "Acid anions **without** oxygen end in **-ide**, **with** oxygen mostly in **-ate**."),
    ask: tr("Ergänze: Wie heißt **Cl⁻**?", "Complete: what is **Cl⁻** called?"), answer: tr("Chlorid", "chloride"),
    options: [tr("Chlor", "chlorine"), tr("Chlorat", "chlorate"), tr("Chlorid", "chloride")],
    why: { [tr("Chlorat", "chlorate")]: tr("-at nur mit Sauerstoff. Cl⁻ hat keinen.", "-ate only with oxygen. Cl⁻ has none."), [tr("Chlor", "chlorine")]: tr("Chlor ist das Element Cl₂. Das Ion heißt anders.", "Chlorine is the element Cl₂. The ion has a different name.") },
    ok: tr("Cl⁻ = Chlorid (ohne O → -id).", "Cl⁻ = chloride (no O → -ide)."),
    lines: [tr("Cl⁻: kein Sauerstoff → Endung -id.", "Cl⁻: no oxygen → ending -ide."), tr("Name: {?}", "Name: {?}")],
  },
  {
    mode: "free",
    say: tr("Weitere Namen: NO₃⁻ **Nitrat**, SO₄²⁻ **Sulfat**, SO₃²⁻ **Sulfit**, CO₃²⁻ **Carbonat**, PO₄³⁻ **Phosphat**, CH₃COO⁻ **Acetat**.", "Names of acid anions: Cl⁻ **chloride**, NO₃⁻ **nitrate**, SO₄²⁻ **sulfate**, SO₃²⁻ **sulfite**, CO₃²⁻ **carbonate**, PO₄³⁻ **phosphate**, CH₃COO⁻ **acetate**."),
    ask: tr("Wie heißt der Säurerest von **H₃PO₄**, wenn alle 3 H⁺ abgegeben sind?", "What is the acid anion of **H₃PO₄** called when all 3 H⁺ have been given off?"), answer: tr("Phosphat", "phosphate"), options: [tr("Phosphid", "phosphide"), tr("Phosphit", "phosphite"), tr("Phosphat", "phosphate"), tr("Sulfat", "sulfate")],
    why: { [tr("Phosphid", "phosphide")]: tr("-id hat nur ein einzelnes P³⁻ ohne Sauerstoff.", "-ide is only a single P³⁻ without oxygen."), [tr("Phosphit", "phosphite")]: tr("PO₄ heißt Phosphat.", "PO₄ is called phosphate."), [tr("Sulfat", "sulfate")]: tr("Sulfat ist SO₄ (Schwefel).", "Sulfate is SO₄ (sulfur).") },
    ok: tr("PO₄³⁻ = Phosphat.", "PO₄³⁻ = phosphate."),
    lines: [tr("PO₄³⁻ mit Sauerstoff → Phosphat.", "PO₄³⁻ with oxygen → phosphate.")],
  },
  {
    mode: "worked",
    part: tr("Laugen und Wasser", "Alkalis and water"),
    say: tr("**Laugen** enthalten **Hydroxid-Ionen OH⁻**.", "**Alkalis** contain **hydroxide ions OH⁻**."),
    ask: tr("Was passiert bei Natronlauge + Salzsäure?", "What happens with sodium hydroxide solution + hydrochloric acid?"),
    visual: () => <Wall c={{ pick: () => {}, show: false, solved: true }} base="naoh" acid="hcl" nB={1} nA={1} />,
    lines: [tr("NaOH → Na⁺ + OH⁻; HCl → H⁺ + Cl⁻.", "NaOH → Na⁺ + OH⁻; HCl → H⁺ + Cl⁻."), tr("H⁺ + OH⁻ → **H₂O**: das ist die **Neutralisation**.", "H⁺ + OH⁻ → **H₂O**: this is **neutralisation**."), tr("1 OH⁻ + 1 H⁺ → 1 Wasser-Molekül; übrig: Na⁺ und Cl⁻.", "1 OH⁻ + 1 H⁺ → 1 water molecule; left over: Na⁺ and Cl⁻.")],
    ok: tr("Jeder Strich in der Wand ist ein Wasser-Molekül.", "Each line in the wall is a water molecule."),
  },
  {
    mode: "faded",
    say: tr("**Laugen** enthalten **Hydroxid-Ionen OH⁻**.", "**Alkalis** contain **hydroxide ions OH⁻**."),
    ask: tr("Ergänze: Aus welchen Ionen besteht **Ca(OH)₂**?", "Complete: which ions make up **Ca(OH)₂**?"), answer: "Ca²⁺ + 2 OH⁻", options: ["Ca⁺ + OH⁻", "Ca²⁺ + 2 OH⁻", tr("CaO + H₂O", "CaO + H₂O"), "Ca²⁺ + O²⁻ + H₂"],
    why: { "Ca⁺ + OH⁻": tr("Calcium bildet Ca²⁺ – dazu passen zwei OH⁻.", "Calcium forms Ca²⁺ – two OH⁻ go with it."), "Ca²⁺ + O²⁻ + H₂": tr("OH⁻ bleibt als Hydroxid-Ion zusammen.", "OH⁻ stays together as a hydroxide ion."), [tr("CaO + H₂O", "CaO + H₂O")]: tr("Gefragt sind die Ionen.", "The question asks for the ions.") },
    ok: tr("Ca(OH)₂ → Ca²⁺ + 2 OH⁻.", "Ca(OH)₂ → Ca²⁺ + 2 OH⁻."),
    lines: [tr("Ca²⁺ hat Ladung 2+.", "Ca²⁺ has charge 2+."), tr("Neutral mit zwei OH⁻ → {?}", "Neutral with two OH⁻ → {?}")],
  },
  { mode: "free", ...missing("caoh2", "hcl", 1, 1, "A",
    tr("Ca(OH)₂ bringt **2** OH⁻ mit. Neutral ist es erst, wenn gleich viele H⁺ dazukommen.", "Ca(OH)₂ brings **2** OH⁻. It is only neutral when the same number of H⁺ is added."),
    tr("Ca(OH)₂ + 2 HCl: 2 OH⁻ und 2 H⁺.", "Ca(OH)₂ + 2 HCl: 2 OH⁻ and 2 H⁺.")) },
  {
    mode: "free",
    ask: tr("Wie viele Wasser-Moleküle entstehen bei **Ca(OH)₂ + 2 HCl**?", "How many water molecules form in **Ca(OH)₂ + 2 HCl**?"), answer: 2, num: {},
    visual: c => <Wall c={c} base="caoh2" acid="hcl" nB={1} nA={2} />,
    why: { "1": tr("Es gibt 2 Paare aus OH⁻ und H⁺.", "There are 2 pairs of OH⁻ and H⁺."), "3": tr("Zähle die Verbindungsstriche: OH⁻ + H⁺.", "Count the connecting lines: OH⁻ + H⁺.") },
    tip: tr("Zähle die Verbindungsstriche: jeder ist ein H₂O.", "Count the connecting lines: each is one H₂O."),
    labels: [{"at": ".nw-link.on", "text": "H₂O", "side": "right"}],
    ok: tr("2 OH⁻ + 2 H⁺ → 2 H₂O.", "2 OH⁻ + 2 H⁺ → 2 H₂O."),
    lines: [tr("2 OH⁻ + 2 H⁺ → 2 H₂O.", "2 OH⁻ + 2 H⁺ → 2 H₂O.")],
  },
  {
    mode: "worked",
    part: tr("Salz und Gleichung", "Salt and equation"),
    say: tr("Übrig bleiben Metall-Ion und Säurerest. Zusammen bilden sie das **Salz**.", "What is left is the metal ion and the acid anion. Together they form the **salt**."),
    ask: tr("Welches Salz entsteht aus Ca(OH)₂ + 2 HCl?", "Which salt forms from Ca(OH)₂ + 2 HCl?"),
    visual: () => <Wall c={{ pick: () => {}, show: false, solved: true }} base="caoh2" acid="hcl" nB={1} nA={2} react />,
    lines: [tr("Übrig: 1 Ca²⁺ und 2 Cl⁻.", "Left over: 1 Ca²⁺ and 2 Cl⁻."), tr("Salz: **CaCl₂**, Name: Metall + Säurerest = **Calciumchlorid**.", "Salt: **CaCl₂**, name: metal + acid anion = **calcium chloride**."), tr("**Ca(OH)₂ + 2 HCl → CaCl₂ + 2 H₂O**", "**Ca(OH)₂ + 2 HCl → CaCl₂ + 2 H₂O**")],
    ok: tr("Lauge + Säure → Salz + Wasser.", "Alkali + acid → salt + water."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Welches Salz entsteht aus **2 NaOH + H₂SO₄**?", "Complete: which salt forms from **2 NaOH + H₂SO₄**?"), answer: "Na₂SO₄", options: ["NaSO₄", "Na(SO₄)₂", "NaH₂SO₄", "Na₂SO₄"],
    visual: c => <Wall c={c} base="naoh" acid="h2so4" nB={2} nA={1} />,
    why: { "NaSO₄": tr("SO₄²⁻ braucht zwei Na⁺.", "SO₄²⁻ needs two Na⁺."), "Na(SO₄)₂": tr("Na⁺ ist nur 1+ – es braucht mehr Na, nicht mehr SO₄.", "Na⁺ is only 1+ – it needs more Na, not more SO₄."), "NaH₂SO₄": tr("Beide H⁺ wurden zu Wasser.", "Both H⁺ have become water.") },
    labels: [{"at": ".nt-cat", "text": tr("Metall-Ion", "Metal ion"), "point": "left", "side": "left"}, {"at": ".nt-an", "text": tr("Säurerest", "Acid anion"), "point": "left", "side": "left"}],
    ok: tr("SO₄²⁻ braucht zwei Na⁺: **Na₂SO₄**.", "SO₄²⁻ needs two Na⁺: **Na₂SO₄**."),
    lines: [tr("Übrig: 2 Na⁺ und 1 SO₄²⁻.", "Left over: 2 Na⁺ and 1 SO₄²⁻."), tr("Salz: {?}", "Salt: {?}")],
  },
  {
    mode: "free",
    ask: tr("Wie heißt **Na₂SO₄**?", "What is **Na₂SO₄** called?"), answer: tr("Natriumsulfat", "Sodium sulfate"), options: [tr("Natriumsulfit", "Sodium sulfite"), tr("Natriumsulfat", "Sodium sulfate"), tr("Natriumschwefelsäure", "Sodium sulfuric acid"), tr("Natriumsulfid", "Sodium sulfide")],
    why: { [tr("Natriumsulfit", "Sodium sulfite")]: tr("Sulfit ist SO₃.", "Sulfite is SO₃."), [tr("Natriumsulfid", "Sodium sulfide")]: tr("Sulfid ist S²⁻ ohne Sauerstoff.", "Sulfide is S²⁻ without oxygen."), [tr("Natriumschwefelsäure", "Sodium sulfuric acid")]: tr("Im Salz steht der Säurerest: Sulfat.", "The salt contains the acid anion: sulfate.") },
    ok: tr("Natronlauge + Schwefelsäure → Natriumsulfat + Wasser.", "Sodium hydroxide solution + sulfuric acid → sodium sulfate + water."),
    lines: [tr("Natrium + Sulfat → Natriumsulfat.", "Sodium + sulfate → sodium sulfate.")],
  },
  { mode: "free", ...missing("naoh", "h2so4", 1, 1, "B",
    tr("H₂SO₄ gibt **2** H⁺ ab – NaOH bringt nur **1** OH⁻ mit.", "H₂SO₄ gives off **2** H⁺ – NaOH brings only **1** OH⁻."),
    tr("2 NaOH + H₂SO₄: 2 OH⁻ und 2 H⁺.", "2 NaOH + H₂SO₄: 2 OH⁻ and 2 H⁺.")) },
  {
    mode: "free",
    ask: tr("Welche Gleichung ist richtig ausgeglichen?", "Which equation is correctly balanced?"), answer: "2 NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O",
    options: ["NaOH + H₂SO₄ → NaSO₄ + H₂O", "NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O", "2 NaOH + H₂SO₄ → Na₂SO₄ + H₂O", "2 NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O"],
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
    mode: "worked",
    part: tr("Mehrprotonige Säuren", "Polyprotic acids"),
    say: tr("Säuren unterscheiden sich darin, wie viele H⁺ sie abgeben können.", "Acids differ in how many H⁺ they can give off."),
    ask: tr("Wie viele H⁺ geben Säuren ab?", "How many H⁺ do acids give off?"),
    lines: [tr("**einprotonig**: HCl, HNO₃, HClO₄ (Rest **Perchlorat**), CH₃COOH.", "**monoprotic**: HCl, HNO₃, HClO₄ (anion **perchlorate**), CH₃COOH."), tr("**zweiprotonig**: H₂SO₄, H₂CO₃, H₂S. **dreiprotonig**: H₃PO₄.", "**diprotic**: H₂SO₄, H₂CO₃, H₂S. **triprotic**: H₃PO₄."), tr("Sie geben H⁺ **schrittweise** ab: H₃PO₄ → H₂PO₄⁻ → HPO₄²⁻ → PO₄³⁻.", "They give off H⁺ **step by step**: H₃PO₄ → H₂PO₄⁻ → HPO₄²⁻ → PO₄³⁻.")],
    ok: tr("Je abgegebenes H⁺ eine negative Ladung mehr.", "One more negative charge per H⁺ given off."),
  },
  {
    mode: "faded",
    say: tr("Mehrprotonige Säuren geben H⁺ **schrittweise** ab: H₃PO₄ → H₂PO₄⁻ → HPO₄²⁻ → PO₄³⁻.", "Polyprotic acids give off H⁺ **step by step**: H₃PO₄ → H₂PO₄⁻ → HPO₄²⁻ → PO₄³⁻."),
    ask: tr("Ergänze: Welche Ladung hat der Rest, wenn H₃PO₄ **2 H⁺** abgibt?", "Complete: what is the charge of the anion when H₃PO₄ gives off **2 H⁺**?"), answer: "2−", options: ["1−", "2−", "3−"],
    why: { "1−": tr("Zwei H⁺ weg – zwei negative Ladungen.", "Two H⁺ gone – two negative charges."), "3−": tr("3− erst, wenn alle drei H⁺ abgegeben sind.", "3− only when all three H⁺ have been given off.") },
    ok: tr("Je abgegebenem H⁺ eine negative Ladung: **HPO₄²⁻**.", "One negative charge per H⁺ given off: **HPO₄²⁻**."),
    lines: [tr("H₃PO₄ gibt 2 H⁺ ab → HPO₄.", "H₃PO₄ gives off 2 H⁺ → HPO₄."), tr("Ladung: {?}", "Charge: {?}")],
  },
  {
    mode: "free",
    // ohne CH₃COOH in der Liste – sonst stünde die Antwort schon da
    say: tr("**einprotonig**: HCl, HNO₃ · **zweiprotonig**: H₂SO₄, H₂CO₃, H₂S · **dreiprotonig**: H₃PO₄. Bei COOH-Säuren wird nur das H der **COOH-Gruppe** als H⁺ abgegeben.", "**monoprotic**: HCl, HNO₃ · **diprotic**: H₂SO₄, H₂CO₃, H₂S · **triprotic**: H₃PO₄. In COOH acids only the H of the **COOH group** is given off as H⁺."),
    ask: tr("Jetzt du: Wie viele H⁺ kann **CH₃COOH** höchstens abgeben?", "Your turn: how many H⁺ can **CH₃COOH** give off at most?"), answer: 1, num: {},
    why: { "4": tr("Die H-Atome am C werden nicht abgegeben – nur das H der COOH-Gruppe.", "The H atoms on C are not given off – only the H of the COOH group.") },
    tip: tr("Zähle in CH₃COOH nur die H, die an einem O-Atom sitzen – die H am C bleiben.", "In CH₃COOH count only the H that sit on an O atom – the H on C stay."),
    ok: tr("Essigsäure ist einprotonig: CH₃COOH → H⁺ + CH₃COO⁻.", "Acetic acid is monoprotic: CH₃COOH → H⁺ + CH₃COO⁻."),
    lines: [tr("Nur das H der COOH-Gruppe wird abgegeben → 1.", "Only the H of the COOH group is given off → 1.")],
  },
  {
    mode: "worked",
    say: tr("Bleibt noch H im Säurerest, sagt der Name es.", "If H remains in the acid anion, the name says so."),
    ask: tr("Wie heißen die Reste der Phosphorsäure?", "What are the anions of phosphoric acid called?"),
    lines: [tr("Zwei H übrig: H₂PO₄⁻ **Dihydrogenphosphat**.", "Two H left: H₂PO₄⁻ **dihydrogen phosphate**."), tr("Ein H übrig: HPO₄²⁻ **Hydrogenphosphat**.", "One H left: HPO₄²⁻ **hydrogen phosphate**."), tr("Kein H mehr: PO₄³⁻ **Phosphat**.", "No H left: PO₄³⁻ **phosphate**.")],
    ok: tr("Hydrogen- = ein H, Dihydrogen- = zwei H.", "Hydrogen- = one H, dihydrogen- = two H."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie heißt der Rest, wenn **H₂CO₃** nur **1 H⁺** abgibt?", "Complete: what is the anion called when **H₂CO₃** gives off only **1 H⁺**?"), answer: tr("Hydrogencarbonat", "hydrogen carbonate"), options: [tr("Carbonat", "carbonate"), tr("Dihydrogencarbonat", "dihydrogen carbonate"), tr("Hydrogencarbonat", "hydrogen carbonate")],
    why: { [tr("Carbonat", "carbonate")]: tr("Carbonat (CO₃²⁻) erst nach 2 H⁺.", "Carbonate (CO₃²⁻) only after 2 H⁺."), [tr("Dihydrogencarbonat", "dihydrogen carbonate")]: tr("Ein H ist schon weg – es bleibt eines.", "One H has already gone – one remains.") },
    ok: tr("HCO₃⁻ = Hydrogencarbonat.", "HCO₃⁻ = hydrogen carbonate."),
    lines: [tr("H₂CO₃ gibt 1 H⁺ ab → HCO₃⁻.", "H₂CO₃ gives off 1 H⁺ → HCO₃⁻."), tr("Noch ein H im Rest → {?}", "One H still in the anion → {?}")],
  },
  {
    mode: "worked",
    part: tr("Ausgleichen", "Balancing"),
    say: tr("Neutralisation: H⁺ + OH⁻ → H₂O. OH⁻-Reihe und H⁺-Reihe müssen gleich lang sein.", "Neutralisation: H⁺ + OH⁻ → H₂O. The OH⁻ row and the H⁺ row must be the same length."),
    ask: tr("Wie gleicht man Al(OH)₃ + H₂SO₄ aus?", "How do you balance Al(OH)₃ + H₂SO₄?"),
    visual: () => <Wall c={{ pick: () => {}, show: false, solved: true }} base="aloh3" acid="h2so4" nB={2} nA={3} />,
    lines: [tr("2 Al(OH)₃ bringen 6 OH⁻.", "2 Al(OH)₃ bring 6 OH⁻."), tr("Jedes H₂SO₄ bringt 2 H⁺ → 3 H₂SO₄ für 6 H⁺.", "Each H₂SO₄ brings 2 H⁺ → 3 H₂SO₄ for 6 H⁺."), tr("6 H⁺ + 6 OH⁻ → **6 H₂O**; Salz Al₂(SO₄)₃.", "6 H⁺ + 6 OH⁻ → **6 H₂O**; salt Al₂(SO₄)₃.")],
    ok: tr("Zahl der H₂O = Zahl der OH⁻ = Zahl der H⁺.", "Number of H₂O = number of OH⁻ = number of H⁺."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie viele **H₃PO₄** braucht man für **3 Ca(OH)₂**?", "Complete: how many **H₃PO₄** are needed for **3 Ca(OH)₂**?"), answer: 2, num: {},
    lines: [tr("3 Ca(OH)₂ bringen 6 OH⁻.", "3 Ca(OH)₂ bring 6 OH⁻."), tr("Jedes H₃PO₄ bringt 3 H⁺ → 6 : 3 = {?}", "Each H₃PO₄ brings 3 H⁺ → 6 : 3 = {?}")],
    why: { "3": tr("3 H⁺ bringt ein H₃PO₄ – gesucht ist die Zahl der Säure-Teilchen.", "One H₃PO₄ brings 3 H⁺ – the question asks for the number of acid particles."), "6": tr("6 sind die OH⁻. Teile durch 3.", "6 is the number of OH⁻. Divide by 3.") },
    tip: tr("Rechne die letzte Zeile aus.", "Work out the last line."),
    ok: tr("3 Ca(OH)₂ + 2 H₃PO₄ → Ca₃(PO₄)₂ + 6 H₂O.", "3 Ca(OH)₂ + 2 H₃PO₄ → Ca₃(PO₄)₂ + 6 H₂O."),
  },
  { mode: "free", ...missing("caoh2", "h2co3", 1, 1, "A",
    tr("Gibt die Säure **nicht alle** H⁺ ab, entsteht ein **Hydrogensalz**. Hier gibt jedes H₂CO₃ nur **1 H⁺** ab.", "If the acid does **not** give off **all** H⁺, a **hydrogen salt** forms. Here each H₂CO₃ gives off only **1 H⁺**."),
    "Ca(OH)₂ + 2 H₂CO₃ → Ca(HCO₃)₂ + 2 H₂O.", 1) },
  {
    mode: "worked",
    part: tr("Salze benennen", "Naming salts"),
    say: tr("Name des Salzes: Metall + Säurerest.", "Name of the salt: metal + acid anion."),
    ask: tr("Wie heißen diese Salze?", "What are these salts called?"),
    lines: [tr("Mg²⁺ + 2 NO₃⁻ → Mg(NO₃)₂ **Magnesiumnitrat**.", "Mg²⁺ + 2 NO₃⁻ → Mg(NO₃)₂ **magnesium nitrate**."), tr("Mit H im Rest (**Hydrogensalz**): Mg(HCO₃)₂ **Magnesiumhydrogencarbonat**.", "With H in the anion (**hydrogen salt**): Mg(HCO₃)₂ **magnesium hydrogen carbonate**."), tr("Ein mehratomiger Rest mehrfach → Klammern.", "A polyatomic anion more than once → brackets.")],
    ok: tr("Kation zuerst, dann der Säurerest.", "Cation first, then the acid anion."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Welches Salz entsteht aus **KOH** und **H₂SO₄**?", "Complete: which salt forms from **KOH** and **H₂SO₄**?"), answer: "K₂SO₄", options: ["KSO₄", "K₂SO₄", "KHSO₄", "K(SO₄)₂"],
    why: { "KHSO₄": tr("KHSO₄ entsteht, wenn nur 1 H⁺ abgegeben wird.", "KHSO₄ forms when only 1 H⁺ is given off."), "KSO₄": tr("SO₄²⁻ braucht zwei K⁺.", "SO₄²⁻ needs two K⁺."), "K(SO₄)₂": tr("K⁺ ist 1+ – es braucht mehr K, nicht mehr SO₄.", "K⁺ is 1+ – it needs more K, not more SO₄.") },
    ok: tr("Kaliumsulfat **K₂SO₄**.", "Potassium sulfate **K₂SO₄**."),
    lines: [tr("2 K⁺ und 1 SO₄²⁻ (alle H⁺ abgegeben).", "2 K⁺ and 1 SO₄²⁻ (all H⁺ given off)."), tr("Salz: {?}", "Salt: {?}")],
  },
  {
    mode: "free",
    ask: tr("Welches Salz entsteht aus **NaOH + H₃PO₄**, wenn nur **1 H⁺** abgegeben wird?", "Which salt forms from **NaOH + H₃PO₄** when only **1 H⁺** is given off?"), answer: "NaH₂PO₄", options: ["Na₃PO₄", "Na₂HPO₄", "NaH₂PO₄", "NaPO₄"],
    visual: c => <Wall c={c} base="naoh" acid="h3po4" step={1} nB={1} nA={1} />,
    why: { "Na₂HPO₄": tr("Das wäre nach 2 H⁺ (HPO₄²⁻).", "That would be after 2 H⁺ (HPO₄²⁻)."), "Na₃PO₄": tr("Das wäre nach allen 3 H⁺.", "That would be after all 3 H⁺."), "NaPO₄": tr("PO₄³⁻ bräuchte drei Na⁺.", "PO₄³⁻ would need three Na⁺.") },
    ok: tr("Natriumdihydrogenphosphat **NaH₂PO₄**.", "Sodium dihydrogen phosphate **NaH₂PO₄**."),
    lines: [tr("1 H⁺ abgegeben → H₂PO₄⁻ → NaH₂PO₄.", "1 H⁺ given off → H₂PO₄⁻ → NaH₂PO₄.")],
  },
  {
    mode: "free",
    ask: tr("Wie heißt **Ca(HCO₃)₂**?", "What is **Ca(HCO₃)₂** called?"), answer: tr("Calciumhydrogencarbonat", "Calcium hydrogen carbonate"), options: [tr("Calciumcarbonat", "Calcium carbonate"), tr("Calciumhydrogencarbonat", "Calcium hydrogen carbonate"), tr("Calciumdihydrogencarbonat", "Calcium dihydrogen carbonate")],
    visual: c => <Wall c={c} base="caoh2" acid="h2co3" step={1} nB={1} nA={2} />,
    why: { [tr("Calciumcarbonat", "Calcium carbonate")]: tr("Im Rest steckt noch ein H: HCO₃⁻.", "The anion still contains one H: HCO₃⁻."), [tr("Calciumdihydrogencarbonat", "Calcium dihydrogen carbonate")]: tr("HCO₃⁻ hat nur 1 H.", "HCO₃⁻ has only 1 H.") },
    labels: [{"at": ".nt-an", "text": tr("Säurerest mit H", "Acid anion with H"), "point": "left", "side": "left"}],
    ok: tr("Hydrogencarbonat – kommt im Leitungswasser vor.", "Hydrogen carbonate – found in tap water."),
  },
  {
    mode: "free",
    ask: tr("Welche Gleichung ist richtig ausgeglichen?", "Which equation is correctly balanced?"), answer: "3 Ba(OH)₂ + 2 H₃PO₄ → Ba₃(PO₄)₂ + 6 H₂O",
    options: ["Ba(OH)₂ + H₃PO₄ → BaPO₄ + H₂O", "3 Ba(OH)₂ + 2 H₃PO₄ → Ba₃(PO₄)₂ + 3 H₂O", "2 Ba(OH)₂ + 3 H₃PO₄ → Ba₂(PO₄)₃ + 6 H₂O", "3 Ba(OH)₂ + 2 H₃PO₄ → Ba₃(PO₄)₂ + 6 H₂O"],
    why: {
      "Ba(OH)₂ + H₃PO₄ → BaPO₄ + H₂O": tr("Ba²⁺ und PO₄³⁻ gleichen sich so nicht aus.", "Ba²⁺ and PO₄³⁻ do not balance like this."),
      "3 Ba(OH)₂ + 2 H₃PO₄ → Ba₃(PO₄)₂ + 3 H₂O": tr("6 OH⁻ und 6 H⁺ ergeben 6 H₂O.", "6 OH⁻ and 6 H⁺ make 6 H₂O."),
      "2 Ba(OH)₂ + 3 H₃PO₄ → Ba₂(PO₄)₃ + 6 H₂O": tr("2 · 2+ = 4+, aber 3 · 3− = 9−.", "2 · 2+ = 4+, but 3 · 3− = 9−."),
    },
    ok: tr("3 Ba²⁺ (6+) und 2 PO₄³⁻ (6−).", "3 Ba²⁺ (6+) and 2 PO₄³⁻ (6−)."),
  },
  {
    mode: "free",
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
    : { title: tr("Neutralisation", "Neutralisation"), steps: OS,
      // aus Ionenbindung (Level II) bekannt
      known: [tr("Nitrat", "nitrate"), tr("Sulfat", "sulfate"), tr("Carbonat", "carbonate"), tr("Hydrogencarbonat", "hydrogen carbonate"), tr("Phosphat", "phosphate")],
      outro: [
      tr("ein-, zwei-, dreiprotonig; Essigsäure gibt nur 1 H⁺ ab.", "mono-, di-, triprotic; acetic acid gives off only 1 H⁺."),
      tr("Schrittweise Abgabe: Dihydrogen-, Hydrogen-, ganz abgegeben (H₂PO₄⁻, HPO₄²⁻, PO₄³⁻).", "Step by step: dihydrogen, hydrogen, fully given off (H₂PO₄⁻, HPO₄²⁻, PO₄³⁻)."),
      tr("Koeffizienten und Wasser aus gleich vielen OH⁻ und H⁺.", "Coefficients and water from equal numbers of OH⁻ and H⁺."),
      tr("Hydrogensalze bei teilweiser Abgabe: NaH₂PO₄, Ca(HCO₃)₂.", "Hydrogen salts on partial release: NaH₂PO₄, Ca(HCO₃)₂."),
    ] };
}
