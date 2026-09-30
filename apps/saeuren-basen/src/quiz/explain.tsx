// Kurze Erklärkarten je Level (≤ 5 Zeilen) mit der pH-Skala als Bild.

import { RichText } from "@lern/ui";
import type { LevelKey } from "@lern/quiz";
import { PhScale } from "../components/Ph.tsx";
import { LEVELS, type Task } from "./tasks.ts";

const TEXT: Record<string, { points: string[]; ph?: number }> = {
  "us-1": { ph: 3, points: [
    "**pH 0–6 sauer**, **7 neutral**, **8–14 basisch**. Je kleiner die Zahl, desto saurer.",
    "Zitrone, Essig, Cola sind sauer; Wasser neutral; Seife, Kalkwasser, Rohrreiniger basisch.",
    "**Indikatoren** zeigen den pH durch Farbe: Universalindikator rot → grün → violett, Lackmus rot/blau, Phenolphthalein farblos/pink.",
  ] },
  "us-2": { ph: 12, points: [
    "**Säuren** geben in Wasser **H⁺** ab: `HCl → H⁺ + Cl⁻`. Formel beginnt mit H.",
    "**Laugen** enthalten **OH⁻**: `NaOH → Na⁺ + OH⁻`. Formel endet auf OH.",
    "Sauer = mehr H⁺, basisch = mehr OH⁻. **Verdünnen** rückt den pH Richtung 7.",
  ] },
  "us-3": { points: [
    "**Säure + Lauge → Salz + Wasser** (Neutralisation): `HCl + NaOH → NaCl + H₂O`.",
    "H⁺ und OH⁻ werden zu **Wasser**; Metall-Ion (aus der Lauge) und Säurerest (aus der Säure) bilden das **Salz**.",
    "Salzname: Metall + Säurerest – Salzsäure → -chlorid, Schwefelsäure → -sulfat, Salpetersäure → -nitrat.",
  ] },
};

export function explainFor(level: LevelKey, task?: Task) {
  const id = typeof level === "number" ? LEVELS[level].id : (LEVELS.find(l => task?.type && l.types.includes(task.type)) ?? LEVELS[0]).id;
  const e = TEXT[id];
  return (
    <div className="explain">
      <ul className="ex-points">{e.points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      <figure className="ex-example"><PhScale ph={e.ph} /></figure>
    </div>
  );
}
