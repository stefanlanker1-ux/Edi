// Kurze Erklärkarten je Level mit einem Beispiel als Neutralisationswand.

import { RichText } from "@lern/ui";
import { HYDROXIDE_BY_ID, PROTIC_BY_ID, neutralEquation } from "@lern/chem";
import type { LevelKey } from "@lern/quiz";
import { NeutralWall } from "../components/NeutralWall.tsx";
import { LEVELS, type Task } from "./tasks.ts";
import type { Stufe } from "../store.ts";

interface Ex { points: string[]; b: string; a: string; step?: number; products?: boolean }

const TEXT: Record<string, Ex> = {
  "us-1": { b: "naoh", a: "h2so4", points: [
    "Säuren geben in Wasser **H⁺-Ionen** ab. Übrig bleibt der **Säurerest** – ein negatives Ion.",
    "So viele H⁺ weggehen, so viele Minus trägt der Rest: H₂SO₄ → 2 H⁺ + SO₄²⁻.",
    "Namen: Chlorid, Bromid, Sulfid (ohne O) · Nitrat, Sulfat, Carbonat, Phosphat · Sulfit (ein O weniger) · Acetat, Formiat.",
  ] },
  "us-2": { b: "caoh2", a: "hcl", points: [
    "Laugen enthalten **OH⁻-Ionen**: Ca(OH)₂ → Ca²⁺ + 2 OH⁻.",
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
    "Zahl der H₂O = Zahl der OH⁻ = Zahl der H⁺ = kgV aus Ladung des Metall-Ions und abgegebenen H⁺.",
    "3 Ca(OH)₂ + 2 H₃PO₄ → Ca₃(PO₄)₂ + 6 H₂O.",
    "Gibt die Säure nur einen Teil der H⁺ ab, entsteht ein **Hydrogensalz**: NaOH + H₃PO₄ → NaH₂PO₄ + H₂O.",
  ] },
  "os-3": { b: "caoh2", a: "h2co3", step: 1, products: true, points: [
    "Das Salz aus Metall-Ion und Säurerest – Ladungen ausgleichen, Klammern bei mehratomigen Ionen.",
    "Achtung: Sulfid S²⁻ ≠ Sulfit SO₃²⁻ ≠ Sulfat SO₄²⁻; Carbonat ≠ Hydrogencarbonat.",
    "Ca(OH)₂ + 2 H₂CO₃ → Ca(HCO₃)₂ + 2 H₂O (Calciumhydrogencarbonat).",
  ] },
};

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
