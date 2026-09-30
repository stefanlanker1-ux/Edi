// Kurze Erklärkarten je Level (≤ 5 Zeilen) mit einem Rechenbeispiel.

import { RichText } from "@lern/ui";
import type { LevelKey } from "@lern/quiz";
import { MolarMassLine } from "../components/Calc.tsx";
import { LEVELS, type Task } from "./tasks.ts";

const TEXT: Record<string, { points: string[]; formula: string; line?: string }> = {
  "us-1": { formula: "H2O", points: [
    "Die **Atommasse** steht im PSE (H 1, C 12, O 16, Na 23, Cl 35,5) – in u, für 1 mol in **g/mol**.",
    "**Molare Masse M** einer Verbindung: jede Atommasse so oft wie der Index, dann addieren.",
    "**1 mol** = 6,022 · 10²³ Teilchen – eine Packungseinheit wie „ein Dutzend“.",
  ] },
  "us-2": { formula: "NaCl", line: "n = m / M = 117 g / 58,5 g/mol = 2 mol", points: [
    "**n = m / M**: Masse (g) durch molare Masse (g/mol) = Stoffmenge (mol).",
    "Umgekehrt **m = n · M**. Erst M aus dem PSE, dann einsetzen – Einheiten mitschreiben.",
    "Kontrolle: g / (g/mol) = mol. Ergebnis sinnvoll? 117 g Salz sind 2 mol.",
  ] },
  "us-3": { formula: "CO2", line: "2 mol CO₂: N = 2 · 6,022 · 10²³ = 1,2 · 10²⁴ · V = 2 · 22,4 l = 44,8 l", points: [
    "**Teilchenzahl N = n · 6,022 · 10²³** (Avogadro-Zahl).",
    "**Gase:** 1 mol = **22,4 l** bei Normbedingungen – egal welches Gas (V = n · 22,4 l).",
    "Erst n ausrechnen (n = m / M), dann N oder V.",
  ] },
};

export function explainFor(level: LevelKey, task?: Task) {
  const id = typeof level === "number" ? LEVELS[level].id : (LEVELS.find(l => task?.type && l.types.includes(task.type)) ?? LEVELS[0]).id;
  const e = TEXT[id];
  return (
    <div className="explain">
      <ul className="ex-points">{e.points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      <figure className="ex-example calc">
        <MolarMassLine formula={e.formula} />
        {e.line && <p className="calc-line"><b className="calc-res">{e.line}</b></p>}
      </figure>
    </div>
  );
}
