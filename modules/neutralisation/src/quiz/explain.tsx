// Kurze Erklärkarten je Level mit einem Beispiel als Neutralisationswand.

import { RichText } from "@lern/ui";
import { HYDROXIDE_BY_ID, PROTIC_BY_ID, neutralEquation } from "@lern/chem";
import type { LevelKey } from "@lern/quiz";
import { NeutralWall } from "../components/NeutralWall.tsx";
import { LEVELS, type Task } from "./tasks.ts";
import type { Stufe } from "../store.ts";
import { tr } from "@lern/i18n";

interface Ex { points: string[]; b: string; a: string; step?: number; products?: boolean }

const TEXT_DE: Record<string, Ex> = {
  "us-1": { b: "naoh", a: "h2so4", points: [
    "Säuren geben in Wasser **H⁺-Ionen** ab. Übrig bleibt der **Säurerest** – ein negatives Ion.",
    "So viele H⁺ weggehen, so viele Minus trägt der Rest: H₂SO₄ → 2 H⁺ + SO₄²⁻.",
    "Essig- und Ameisensäure geben nur das H der **COOH-Gruppe** ab: CH₃COOH → H⁺ + CH₃COO⁻.",
    "Namen: Chlorid, Bromid, Sulfid (ohne O) · Nitrat, Sulfat, Carbonat, Phosphat · Sulfit (ein O weniger) · Acetat, Formiat.",
  ] },
  "us-2": { b: "caoh2", a: "hcl", points: [
    "Metallhydroxide bestehen aus Metall-Ionen und **OH⁻-Ionen**: Ca(OH)₂ → Ca²⁺ + 2 OH⁻. In Wasser gelöst heißen sie **Laugen**.",
    "Bei der Neutralisation wird aus jedem **H⁺ + OH⁻ ein H₂O**.",
    "Nimm so viele Lauge und Säure, bis die **OH⁻-Reihe und die H⁺-Reihe gleich lang** sind.",
  ] },
  "us-3": { b: "baoh2", a: "h3po4", products: true, points: [
    "Lauge + Säure → **Salz + Wasser**. Das Salz besteht aus dem Metall-Ion der Lauge und dem Säurerest.",
    "Salzformel wie in der Ionenbindung: Ladungen ausgleichen, mehratomige Ionen mehrmals in Klammern: Ba₃(PO₄)₂.",
    "Name: Metall + Säurerest – Bariumphosphat, Natriumsulfat, Calciumchlorid.",
  ] },
  "os-1": { b: "naoh", a: "h3po4", step: 1, points: [
    "Mehrprotonige Säuren geben ihre H⁺ **schrittweise** ab: H₃PO₄ → H₂PO₄⁻ → HPO₄²⁻ → PO₄³⁻.",
    "Bleibt H im Ion: **Hydrogen-** (HCO₃⁻, HPO₄²⁻), bei zwei H **Dihydrogen-** (H₂PO₄⁻).",
    "Essig- und Ameisensäure sind **einprotonig**: Nur das H der COOH-Gruppe ist sauer.",
  ] },
  "os-2": { b: "caoh2", a: "h3po4", points: [
    "Eine **Formeleinheit** ist die kleinste Gruppe, die die Formel angibt – bei Hydroxiden und Salzen aus Ionen: 1 Ca(OH)₂ = 1 Ca²⁺ + 2 OH⁻.",
    "Zahl der H₂O = Zahl der OH⁻ = Zahl der H⁺ = kgV aus Ladung des Metall-Ions und abgegebenen H⁺.",
    "3 Ca(OH)₂ + 2 H₃PO₄ → Ca₃(PO₄)₂ + 6 H₂O.",
    "Gibt die Säure nur einen Teil der H⁺ ab, entsteht ein **Hydrogensalz**: NaOH + H₃PO₄ → NaH₂PO₄ + H₂O.",
  ] },
  "os-3": { b: "caoh2", a: "h2co3", step: 1, products: true, points: [
    "Das Salz aus Metall-Ion und Säurerest – Ladungen ausgleichen, Klammern bei mehratomigen Ionen.",
    "Achtung: Sulfid S²⁻ ≠ Sulfit SO₃²⁻ ≠ Sulfat SO₄²⁻; Carbonat ≠ Hydrogencarbonat.",
    "Ca(OH)₂ + 2 H₂CO₃ → Ca(HCO₃)₂ + 2 H₂O (Calciumhydrogencarbonat).",
    "Laugen: **Natronlauge** NaOH, **Kalilauge** KOH, **Kalkwasser** Ca(OH)₂, **Barytwasser** Ba(OH)₂ – Hydroxide in Wasser gelöst.",
  ] },
};
const TEXT_EN: Record<string, Ex> = {
  "us-1": { b: "naoh", a: "h2so4", points: [
    "In water, acids give off **H⁺ ions**. What remains is the **acid anion** – a negative ion.",
    "As many H⁺ as leave, that many minus charges the anion carries: H₂SO₄ → 2 H⁺ + SO₄²⁻.",
    "Acetic and formic acid give off only the H of the **COOH group**: CH₃COOH → H⁺ + CH₃COO⁻.",
    "Names: chloride, bromide, sulfide (no O) · nitrate, sulfate, carbonate, phosphate · sulfite (one O fewer) · acetate, formate.",
  ] },
  "us-2": { b: "caoh2", a: "hcl", points: [
    "Metal hydroxides consist of metal ions and **OH⁻ ions**: Ca(OH)₂ → Ca²⁺ + 2 OH⁻. Dissolved in water they are **alkalis**.",
    "In neutralisation every **H⁺ + OH⁻ becomes H₂O**.",
    "Take alkali and acid until the **OH⁻ row and the H⁺ row are the same length**.",
  ] },
  "us-3": { b: "baoh2", a: "h3po4", products: true, points: [
    "Alkali + acid → **salt + water**. The salt consists of the metal ion of the alkali and the acid anion.",
    "Salt formula as in ionic bonding: balance charges, polyatomic ions in brackets when needed more than once: Ba₃(PO₄)₂.",
    "Name: metal + acid anion – barium phosphate, sodium sulfate, calcium chloride.",
  ] },
  "os-1": { b: "naoh", a: "h3po4", step: 1, points: [
    "Polyprotic acids give off their H⁺ **step by step**: H₃PO₄ → H₂PO₄⁻ → HPO₄²⁻ → PO₄³⁻.",
    "If H stays in the ion: **hydrogen** (HCO₃⁻, HPO₄²⁻), with two H **dihydrogen** (H₂PO₄⁻).",
    "Acetic and formic acid are **monoprotic**: only the H of the COOH group is acidic.",
  ] },
  "os-2": { b: "caoh2", a: "h3po4", points: [
    "A **formula unit** is the smallest group the formula stands for – in hydroxides and salts made of ions: 1 Ca(OH)₂ = 1 Ca²⁺ + 2 OH⁻.",
    "Number of H₂O = number of OH⁻ = number of H⁺ = LCM of the metal ion's charge and the H⁺ given off.",
    "3 Ca(OH)₂ + 2 H₃PO₄ → Ca₃(PO₄)₂ + 6 H₂O.",
    "If the acid gives off only some of its H⁺, a **hydrogen salt** forms: NaOH + H₃PO₄ → NaH₂PO₄ + H₂O.",
  ] },
  "os-3": { b: "caoh2", a: "h2co3", step: 1, products: true, points: [
    "The salt from metal ion and acid anion – balance charges, brackets for polyatomic ions.",
    "Careful: sulfide S²⁻ ≠ sulfite SO₃²⁻ ≠ sulfate SO₄²⁻; carbonate ≠ hydrogen carbonate.",
    "Ca(OH)₂ + 2 H₂CO₃ → Ca(HCO₃)₂ + 2 H₂O (calcium hydrogen carbonate).",
    "Alkalis: **sodium hydroxide solution** NaOH, **potassium hydroxide solution** KOH, **limewater** Ca(OH)₂, **baryta water** Ba(OH)₂ – hydroxides dissolved in water.",
  ] },
};
const TEXT = tr(TEXT_DE, TEXT_EN);

export function explainFor(stufe: Stufe, level: LevelKey, task?: Task) {
  const id = typeof level === "number" ? LEVELS[stufe][level].id
    : (LEVELS[stufe].find(l => task?.type && l.types.includes(task.type)) ?? LEVELS[stufe][0]).id;
  const e = TEXT[id];
  const base = HYDROXIDE_BY_ID[e.b], acid = PROTIC_BY_ID[e.a], step = e.step ?? acid.protons;
  const n = neutralEquation(base, acid, step);
  return (
    <div className="explain">
      <ul className="ex-points">{e.points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      <figure className="ex-example">
        <NeutralWall base={base} acid={acid} step={step} nB={n.nBase} nA={n.nAcid} products={e.products} />
      </figure>
    </div>
  );
}
