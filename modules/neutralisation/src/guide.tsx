// Geführte Erklärung Neutralisation: mit der Neutralisationswand der App (Metall-Ionen, OH⁻, H⁺, Säurereste;
// Verbindungsstriche = H₂O). Säuren und Laugen in Wasser, ausgleichen, Wasser zählen, Salz und Name, Gleichung.

import { Fit, type GuideCtx, type GuideDef, type GuideStep } from "@lern/ui";
import { HYDROXIDE_BY_ID, PROTIC_BY_ID, toSubscript } from "@lern/chem";
import { NeutralWall } from "./components/NeutralWall.tsx";

/** Neutralisationswand; mit `target` darunter zwei Knöpfe „+ Lauge“ (Ziel "B") und „+ Säure“ (Ziel "A") */
function Wall({ c, base, acid, step, nB, nA, target }: { c: GuideCtx; base: string; acid: string; step?: number; nB: number; nA: number; target?: "A" | "B" }) {
  const b = HYDROXIDE_BY_ID[base], a = PROTIC_BY_ID[acid];
  return (
    <div className="nt-g">
      <Fit className="nt-g-wall" min={0.3}><NeutralWall base={b} acid={a} step={step ?? a.protons} nB={nB} nA={nA} showResult={false} /></Fit>
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
  say, ask: "Was fehlt, damit die **OH⁻-Reihe** und die **H⁺-Reihe** gleich lang sind? Tippe es an.", answer,
  visual: c => <Wall c={c} base={base} acid={acid} step={step} nB={nB} nA={nA} target={answer} />,
  why: { [answer === "A" ? "B" : "A"]: "Dann wird die längere Reihe noch länger. Vergleiche OH⁻ und H⁺." },
  ok,
});

const US: GuideStep[] = [
  {
    say: "**Säuren** geben in Wasser **H⁺-Ionen** ab. Übrig bleibt der **Säurerest** – er ist negativ geladen.",
    ask: "Welche Ionen entstehen aus **HCl** in Wasser?", answer: "H⁺ + Cl⁻", options: ["H⁺ + Cl⁻", "H⁻ + Cl⁺", "H₂ + Cl₂", "HCl bleibt ganz"],
    why: { "H⁻ + Cl⁺": "Die Säure gibt ein **positives** H⁺ ab – der Rest wird negativ.", "H₂ + Cl₂": "Es entstehen Ionen, keine Gase.", "HCl bleibt ganz": "In Wasser gibt HCl sein H⁺ ab." },
    ok: "HCl → H⁺ + Cl⁻ (Chlorid).",
  },
  {
    say: "Für jedes abgegebene H⁺ bleibt eine **negative Ladung** am Säurerest.",
    ask: "**H₂SO₄** gibt beide H⁺ ab. Welche Ladung hat der Säurerest SO₄?", answer: "2−", options: ["2−", "1−", "2+", "4−"],
    why: { "1−": "Zwei H⁺ gehen weg – also zwei negative Ladungen.", "2+": "Der Rest wird negativ, nicht positiv.", "4−": "Die 4 gehört zu den O-Atomen." },
    ok: "H₂SO₄ → 2 H⁺ + SO₄²⁻ (Sulfat).",
  },
  {
    say: "Namen der Säurereste: Cl⁻ **Chlorid**, NO₃⁻ **Nitrat**, SO₄²⁻ **Sulfat**, SO₃²⁻ **Sulfit**, CO₃²⁻ **Carbonat**, PO₄³⁻ **Phosphat**, CH₃COO⁻ **Acetat**.",
    ask: "Wie heißt der Säurerest von **H₃PO₄**, wenn alle 3 H⁺ abgegeben sind?", answer: "Phosphat", options: ["Phosphat", "Phosphid", "Phosphit", "Sulfat"],
    why: { Phosphid: "-id hat nur ein einzelnes P³⁻ ohne Sauerstoff.", Phosphit: "PO₄ heißt Phosphat.", Sulfat: "Sulfat ist SO₄ (Schwefel)." },
    ok: "PO₄³⁻ = Phosphat.",
  },
  {
    say: "**Laugen** enthalten **Hydroxid-Ionen OH⁻**.",
    ask: "Aus welchen Ionen besteht **Ca(OH)₂**?", answer: "Ca²⁺ + 2 OH⁻", options: ["Ca²⁺ + 2 OH⁻", "Ca⁺ + OH⁻", "Ca²⁺ + O²⁻ + H₂", "CaO + H₂O"],
    why: { "Ca⁺ + OH⁻": "Calcium bildet Ca²⁺ – dazu passen zwei OH⁻.", "Ca²⁺ + O²⁻ + H₂": "OH⁻ bleibt als Hydroxid-Ion zusammen.", "CaO + H₂O": "Gefragt sind die Ionen." },
    ok: "Ca(OH)₂ → Ca²⁺ + 2 OH⁻.",
  },
  {
    say: "**Neutralisation**: H⁺ + OH⁻ → H₂O. In der Wand verbinden die Striche je ein OH⁻ mit einem H⁺ zu Wasser.",
    ask: "Wie viele **Wasser-Moleküle** entstehen aus NaOH + HCl?", answer: 1, num: {},
    visual: c => <Wall c={c} base="naoh" acid="hcl" nB={1} nA={1} />,
    why: { "2": "Ein OH⁻ und ein H⁺ ergeben ein H₂O." },
    ok: "NaOH + HCl → NaCl + H₂O.",
  },
  missing("caoh2", "hcl", 1, 1, "A",
    "Ca(OH)₂ bringt **2** OH⁻ mit. Neutral ist es erst, wenn gleich viele H⁺ dazukommen.",
    "Ca(OH)₂ + 2 HCl: 2 OH⁻ und 2 H⁺."),
  {
    ask: "Wie viele Wasser-Moleküle entstehen bei **Ca(OH)₂ + 2 HCl**?", answer: 2, num: {},
    visual: c => <Wall c={c} base="caoh2" acid="hcl" nB={1} nA={2} />,
    why: { "1": "Es gibt 2 Paare aus OH⁻ und H⁺.", "3": "Zähle die Verbindungsstriche: OH⁻ + H⁺." },
    ok: "2 OH⁻ + 2 H⁺ → 2 H₂O.",
  },
  {
    say: "Übrig bleiben Metall-Ion und Säurerest. Zusammen bilden sie das **Salz**.",
    ask: "Welches Salz entsteht aus Ca(OH)₂ und HCl?", answer: "CaCl₂", options: ["CaCl₂", "CaCl", "CaH₂", "Ca(OH)Cl"],
    visual: c => <Wall c={c} base="caoh2" acid="hcl" nB={1} nA={2} />,
    why: { CaCl: "Ca²⁺ braucht zwei Cl⁻.", "CaH₂": "Die H⁺ werden zu Wasser – im Salz ist der Säurerest.", "Ca(OH)Cl": "Alle OH⁻ wurden zu Wasser." },
    ok: "Calciumchlorid **CaCl₂**.",
  },
  missing("naoh", "h2so4", 1, 1, "B",
    "H₂SO₄ gibt **2** H⁺ ab – NaOH bringt nur **1** OH⁻ mit.",
    "2 NaOH + H₂SO₄: 2 OH⁻ und 2 H⁺."),
  {
    ask: "Welches Salz entsteht aus **2 NaOH + H₂SO₄**?", answer: "Na₂SO₄", options: ["Na₂SO₄", "NaSO₄", "Na(SO₄)₂", "NaH₂SO₄"],
    visual: c => <Wall c={c} base="naoh" acid="h2so4" nB={2} nA={1} />,
    why: { "NaSO₄": "SO₄²⁻ braucht zwei Na⁺.", "Na(SO₄)₂": "Na⁺ ist nur 1+ – es braucht mehr Na, nicht mehr SO₄.", "NaH₂SO₄": "Beide H⁺ wurden zu Wasser." },
    ok: "Na₂SO₄.",
  },
  {
    ask: "Wie heißt **Na₂SO₄**?", answer: "Natriumsulfat", options: ["Natriumsulfat", "Natriumsulfit", "Natriumsulfid", "Natriumschwefelsäure"],
    why: { Natriumsulfit: "Sulfit ist SO₃.", Natriumsulfid: "Sulfid ist S²⁻ ohne Sauerstoff.", "Natriumschwefelsäure": "Im Salz steht der Säurerest: Sulfat." },
    ok: "Natronlauge + Schwefelsäure → Natriumsulfat + Wasser.",
  },
  {
    ask: "Welche Gleichung ist richtig ausgeglichen?", answer: "2 NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O",
    options: ["2 NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O", "NaOH + H₂SO₄ → NaSO₄ + H₂O", "2 NaOH + H₂SO₄ → Na₂SO₄ + H₂O", "NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O"],
    why: {
      "NaOH + H₂SO₄ → NaSO₄ + H₂O": "NaSO₄ gibt es nicht – SO₄²⁻ braucht zwei Na⁺.",
      "2 NaOH + H₂SO₄ → Na₂SO₄ + H₂O": "2 OH⁻ und 2 H⁺ ergeben 2 H₂O.",
      "NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O": "Links nur 1 Na, rechts 2 Na.",
    },
    ok: "Zahl der H₂O = Zahl der OH⁻ = Zahl der H⁺.",
  },
];

const OS: GuideStep[] = [
  {
    say: "**einprotonig**: HCl, HNO₃, CH₃COOH · **zweiprotonig**: H₂SO₄, H₂CO₃, H₂S · **dreiprotonig**: H₃PO₄. Bei der Essigsäure ist nur das H der COOH-Gruppe abgebbar.",
    ask: "Wie viele H⁺ kann **CH₃COOH** höchstens abgeben?", answer: 1, num: {},
    why: { "4": "Die H-Atome am C werden nicht abgegeben – nur das H der COOH-Gruppe." },
    ok: "Essigsäure ist einprotonig: CH₃COOH → H⁺ + CH₃COO⁻.",
  },
  {
    say: "Mehrprotonige Säuren geben H⁺ **schrittweise** ab: H₃PO₄ → H₂PO₄⁻ → HPO₄²⁻ → PO₄³⁻.",
    ask: "Welche Ladung hat der Rest, wenn H₃PO₄ **2 H⁺** abgibt?", answer: "2−", options: ["2−", "1−", "3−"],
    why: { "1−": "Zwei H⁺ weg – zwei negative Ladungen.", "3−": "3− erst, wenn alle drei H⁺ abgegeben sind." },
    ok: "HPO₄²⁻.",
  },
  {
    say: "Noch H im Rest: **Hydrogen-** (ein H) bzw. **Dihydrogen-** (zwei H).",
    ask: "Wie heißt **HPO₄²⁻**?", answer: "Hydrogenphosphat", options: ["Hydrogenphosphat", "Dihydrogenphosphat", "Phosphat", "Hydrogenphosphit"],
    why: { Dihydrogenphosphat: "Dihydrogen- hätte 2 H (H₂PO₄⁻).", Phosphat: "Phosphat ist PO₄³⁻ ohne H.", Hydrogenphosphit: "PO₄ heißt Phosphat." },
    ok: "HPO₄²⁻ = Hydrogenphosphat.",
  },
  {
    ask: "Wie heißt der Rest, wenn **H₂CO₃** nur **1 H⁺** abgibt?", answer: "Hydrogencarbonat", options: ["Hydrogencarbonat", "Carbonat", "Dihydrogencarbonat"],
    why: { Carbonat: "Carbonat (CO₃²⁻) erst nach 2 H⁺.", Dihydrogencarbonat: "Ein H ist schon weg – es bleibt eines." },
    ok: "HCO₃⁻ = Hydrogencarbonat.",
  },
  {
    say: "Neutralisation: H⁺ + OH⁻ → H₂O. Die OH⁻-Reihe und die H⁺-Reihe müssen gleich lang sein.",
    ask: "**2 Al(OH)₃** bringen 6 OH⁻. Wie viele **H₂SO₄** braucht man?", answer: 3, num: {},
    visual: c => <Wall c={c} base="aloh3" acid="h2so4" nB={2} nA={1} />,
    why: { "6": "Jedes H₂SO₄ bringt 2 H⁺: 6 : 2.", "2": "2 H₂SO₄ sind nur 4 H⁺." },
    ok: "2 Al(OH)₃ + 3 H₂SO₄ → Al₂(SO₄)₃ + 6 H₂O.",
  },
  {
    ask: "Wie viele **H₂O** entstehen bei 2 Al(OH)₃ + 3 H₂SO₄?", answer: 6, num: {},
    visual: c => <Wall c={c} base="aloh3" acid="h2so4" nB={2} nA={3} />,
    why: { "3": "Jedes Paar aus OH⁻ und H⁺ gibt ein H₂O: 6.", "5": "6 OH⁻ treffen auf 6 H⁺." },
    ok: "Zahl der H₂O = Zahl der OH⁻ = Zahl der H⁺.",
  },
  missing("caoh2", "h2co3", 1, 1, "A",
    "Gibt die Säure **nicht alle** H⁺ ab, entsteht ein **Hydrogensalz**. Hier gibt jedes H₂CO₃ nur **1 H⁺** ab.",
    "Ca(OH)₂ + 2 H₂CO₃ → Ca(HCO₃)₂ + 2 H₂O.", 1),
  {
    ask: "Wie heißt **Ca(HCO₃)₂**?", answer: "Calciumhydrogencarbonat", options: ["Calciumhydrogencarbonat", "Calciumcarbonat", "Calciumdihydrogencarbonat"],
    visual: c => <Wall c={c} base="caoh2" acid="h2co3" step={1} nB={1} nA={2} />,
    why: { Calciumcarbonat: "Im Rest steckt noch ein H: HCO₃⁻.", Calciumdihydrogencarbonat: "HCO₃⁻ hat nur 1 H." },
    ok: "Hydrogencarbonat – kommt im Leitungswasser vor.",
  },
  {
    ask: "Welches Salz entsteht aus **NaOH + H₃PO₄**, wenn nur **1 H⁺** abgegeben wird?", answer: "NaH₂PO₄", options: ["NaH₂PO₄", "Na₂HPO₄", "Na₃PO₄", "NaPO₄"],
    visual: c => <Wall c={c} base="naoh" acid="h3po4" step={1} nB={1} nA={1} />,
    why: { "Na₂HPO₄": "Das wäre nach 2 H⁺ (HPO₄²⁻).", "Na₃PO₄": "Das wäre nach allen 3 H⁺.", "NaPO₄": "PO₄³⁻ bräuchte drei Na⁺." },
    ok: "Natriumdihydrogenphosphat **NaH₂PO₄**.",
  },
  {
    ask: "Welches Salz entsteht aus **KOH** und **H₂SO₄**, wenn **alle** H⁺ abgegeben werden?", answer: "K₂SO₄", options: ["K₂SO₄", "KHSO₄", "KSO₄", "K(SO₄)₂"],
    why: { "KHSO₄": "KHSO₄ entsteht, wenn nur 1 H⁺ abgegeben wird.", "KSO₄": "SO₄²⁻ braucht zwei K⁺.", "K(SO₄)₂": "K⁺ ist 1+ – es braucht mehr K, nicht mehr SO₄." },
    ok: "Kaliumsulfat **K₂SO₄**.",
  },
  {
    ask: "Welche Gleichung ist richtig ausgeglichen?", answer: "3 Ba(OH)₂ + 2 H₃PO₄ → Ba₃(PO₄)₂ + 6 H₂O",
    options: ["3 Ba(OH)₂ + 2 H₃PO₄ → Ba₃(PO₄)₂ + 6 H₂O", "Ba(OH)₂ + H₃PO₄ → BaPO₄ + H₂O", "3 Ba(OH)₂ + 2 H₃PO₄ → Ba₃(PO₄)₂ + 3 H₂O", "2 Ba(OH)₂ + 3 H₃PO₄ → Ba₂(PO₄)₃ + 6 H₂O"],
    why: {
      "Ba(OH)₂ + H₃PO₄ → BaPO₄ + H₂O": "Ba²⁺ und PO₄³⁻ gleichen sich so nicht aus.",
      "3 Ba(OH)₂ + 2 H₃PO₄ → Ba₃(PO₄)₂ + 3 H₂O": "6 OH⁻ und 6 H⁺ ergeben 6 H₂O.",
      "2 Ba(OH)₂ + 3 H₃PO₄ → Ba₂(PO₄)₃ + 6 H₂O": "2 · 2+ = 4+, aber 3 · 3− = 9−.",
    },
    ok: "3 Ba²⁺ (6+) und 2 PO₄³⁻ (6−).",
  },
  {
    ask: "Kalkwasser + Salpetersäure → **?** + Wasser. Wie heißt das Salz?", answer: "Calciumnitrat", options: ["Calciumnitrat", "Calciumnitrit", "Calciumnitrid"],
    why: { Calciumnitrit: "Nitrit ist NO₂⁻. HNO₃ gibt Nitrat NO₃⁻.", Calciumnitrid: "Nitrid ist N³⁻ ohne Sauerstoff." },
    ok: "Ca(OH)₂ + 2 HNO₃ → Ca(NO₃)₂ + 2 H₂O.",
  },
];

export function guideFor(stufe: "us" | "os"): GuideDef {
  return stufe === "us"
    ? { title: "Neutralisation", steps: US, outro: [
      "Säuren geben H⁺ ab, der Säurerest wird negativ (Chlorid, Sulfat, Phosphat …).",
      "Laugen enthalten OH⁻. **H⁺ + OH⁻ → H₂O**.",
      "Ausgleichen: gleich viele OH⁻ wie H⁺ – so viele H₂O entstehen.",
      "Salz = Metall-Ion + Säurerest: Lauge + Säure → Salz + Wasser.",
    ] }
    : { title: "Neutralisation", steps: OS, outro: [
      "ein-, zwei-, dreiprotonig; Essigsäure gibt nur 1 H⁺ ab.",
      "Schrittweise Abgabe: Dihydrogen-, Hydrogen-, ganz abgegeben (H₂PO₄⁻, HPO₄²⁻, PO₄³⁻).",
      "Koeffizienten und Wasser aus gleich vielen OH⁻ und H⁺.",
      "Hydrogensalze bei teilweiser Abgabe: NaH₂PO₄, Ca(HCO₃)₂.",
    ] };
}
