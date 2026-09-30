// Kurze Erklärkarten je Level mit einem Becher als Beispiel.

import { RichText } from "@lern/ui";
import type { LevelKey } from "@lern/quiz";
import { Beaker } from "../components/Beaker.tsx";
import { initial, seedOf } from "../mixing.ts";
import { EXAMPLES } from "../mixtures.ts";
import { LEVELS, type Task } from "./tasks.ts";

const TEXT: Record<string, { points: string[]; ex: string }> = {
  "gm-1": { ex: "modell", points: [
    "Ein **Teilchen** ist ein Molekül oder ein einzelnes Atom. Ein Molekül zählt als ein Teilchen.",
    "Gleiche Teilchen bilden einen **Stoff**. Verschiedene Teilchen sind verschiedene Stoffe.",
    "**Reinstoff:** nur eine Teilchensorte. **Gemisch:** mehrere Teilchensorten.",
  ] },
  "gm-2": { ex: "modell", points: [
    "**Element:** Reinstoff aus nur **einer** Atomsorte – als Atom (He, C) oder Molekül (O₂, O₃).",
    "**Verbindung:** Reinstoff aus **mehreren** Atomsorten, fest im Teilchen verbunden (H₂O, CO₂).",
    "**Atomsorten** zählen die Farben der Kugeln – nicht die Stoffe.",
  ] },
  "gm-3": { ex: "oel", points: [
    "**Homogen:** überall gleich, keine Grenze zu sehen – Lösungen, Gasgemische, Legierungen.",
    "**Heterogen:** Teile oder Schichten sind zu erkennen – Öl und Wasser, Granit, Nebel, Milch.",
    "Öl und Wasser: nach dem Schütteln trennen sie sich wieder. Öl steigt nach oben.",
  ] },
};

export function explainFor(level: LevelKey, task?: Task) {
  const id = typeof level === "number" ? LEVELS[level].id : (LEVELS.find(l => task?.type && l.types.includes(task.type)) ?? LEVELS[0]).id;
  const e = TEXT[id];
  const ex = EXAMPLES.find(x => x.id === e.ex)!;
  const { grid, ps } = initial(ex.items, ex.state, ex.floats, seedOf(ex.id));
  return (
    <div className="explain">
      <ul className="ex-points">{e.points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      <figure className="ex-example gm-ex-fig"><Beaker grid={grid} ps={ps} state={ex.state} label={ex.title} /></figure>
    </div>
  );
}
