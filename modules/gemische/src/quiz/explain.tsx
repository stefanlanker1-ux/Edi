// Kurze Erklärkarten je Thema mit Teilchenbildern als Beispiel (Lösen: vorher → nachher); Level mit Tipp nennen den Tipp-Knopf.

import { RichText } from "@lern/ui";
import type { LevelKey } from "@lern/quiz";
import { Beaker } from "../components/Beaker.tsx";
import { initial, seedOf, type Arrange } from "../mixing.ts";
import { EXAMPLES, small } from "../mixtures.ts";
import { LEVELS, type Task } from "./tasks.ts";

const TEXT: Record<string, { points: string[]; ex: string; arr: Arrange[] }> = {
  basics: { ex: "modell", arr: ["nachher"], points: [
    "Ein **Teilchen** ist ein Molekül oder ein einzelnes Atom. Gleiche Teilchen bilden einen **Stoff**.",
    "**Reinstoff:** nur eine Teilchensorte. **Gemisch:** mehrere Teilchensorten.",
    "**Element:** nur **eine** Atomsorte (He, Cu, O₂). **Verbindung:** mehrere Atomsorten fest im Teilchen (H₂O, CO₂).",
  ] },
  everyday: { ex: "oel", arr: ["nachher"], points: [
    "**Homogen:** überall gleich, keine Grenze zu sehen – Lösung (s/l), Legierung (s/s), Gasgemisch (g/g).",
    "**Heterogen:** Teile, Tröpfchen oder Schichten sind zu erkennen – Emulsion (l/l), Suspension (s/l), Gemenge (s/s).",
    "„Rein“ auf einer Packung heißt: nichts dazugegeben. Ein **Reinstoff** ist nur **ein** Stoff.",
  ] },
  solving: { ex: "zucker", arr: ["vorher", "nachher"], points: [
    "Beim Lösen verteilen sich die Teilchen. Sie verschwinden nicht, die **Masse bleibt gleich**.",
    "Teilchen bewegen sich **ständig**. Darum mischen sich Gase und Lösungen von selbst.",
    "Zwischen den Teilchen ist **nichts**. Farben im Modell dienen nur zur Unterscheidung.",
  ] },
};
const TOPIC: Record<string, string> = { "gm-n1": "basics", "gm-n2": "basics", "gm-n3": "everyday", "gm-n4": "everyday", "gm-n5": "solving", "gm-n6": "solving" };
const CUE = "In diesem Niveau hilft der **Tipp** genau bei der Aufgabe. Tipp antippen kostet keine Punkte.";

export function explainFor(level: LevelKey, task?: Task) {
  const id = typeof level === "number" ? LEVELS[level].id : (LEVELS.find(l => task?.type && l.types.includes(task.type)) ?? LEVELS[0]).id;
  const e = TEXT[TOPIC[id]];
  const points = LEVELS.find(l => l.id === id)?.cue ? [CUE, ...e.points] : e.points;
  const ex = EXAMPLES.find(x => x.id === e.ex)!;
  return (
    <div className="explain">
      <ul className="ex-points">{points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      <figure className="ex-example gm-ex-fig">
        {e.arr.map((a, i) => (
          <span key={a} className="gm-ex-step">
            {i > 0 && <span className="gm-ex-arrow" aria-hidden="true">→</span>}
            <Beaker sim={initial({ ...ex, items: small(ex.items) }, seedOf(ex.id), a)} label={`${ex.title}${e.arr.length > 1 ? ` ${a}` : ""}`} />
          </span>
        ))}
      </figure>
    </div>
  );
}
