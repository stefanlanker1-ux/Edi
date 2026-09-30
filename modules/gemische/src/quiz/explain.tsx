// Kurze Erklärkarten je Level mit Teilchenbildern als Beispiel (Level 4: vorher → nachher).

import { RichText } from "@lern/ui";
import type { LevelKey } from "@lern/quiz";
import { Beaker } from "../components/Beaker.tsx";
import { initial, seedOf, type Arrange } from "../mixing.ts";
import { EXAMPLES } from "../mixtures.ts";
import { LEVELS, type Task } from "./tasks.ts";

const TEXT: Record<string, { points: string[]; ex: string; arr: Arrange[] }> = {
  "gm-1": { ex: "modell", arr: ["nachher"], points: [
    "Ein **Teilchen** ist ein Molekül oder ein einzelnes Atom. Ein Molekül zählt als ein Teilchen.",
    "Gleiche Teilchen bilden einen **Stoff**. Verschiedene Teilchen sind verschiedene Stoffe.",
    "**Reinstoff:** nur eine Teilchensorte. **Gemisch:** mehrere Teilchensorten.",
  ] },
  "gm-2": { ex: "modell", arr: ["nachher"], points: [
    "**Element:** Reinstoff aus nur **einer** Atomsorte – einzelne Atome (He, Ar) oder ein Metallgitter (Cu).",
    "**Verbindung:** Reinstoff aus **mehreren** Atomsorten, fest im Teilchen verbunden (H₂O, CO₂).",
    "Verschiedene Atome in einem Bild heißen noch nicht Gemisch. Entscheidend: Sind die Teilchen gleich?",
  ] },
  "gm-3": { ex: "oel", arr: ["nachher"], points: [
    "**Homogen:** überall gleich, keine Grenze zu sehen – Lösung, Legierung, Gasgemisch.",
    "**Heterogen:** Teile, Tröpfchen oder Schichten sind zu erkennen – Emulsion, Suspension, Gemenge.",
    "„Rein“ auf einer Packung heißt: nichts dazugegeben. Ein **Reinstoff** ist nur **ein** Stoff.",
  ] },
  "gm-4": { ex: "zucker", arr: ["vorher", "nachher"], points: [
    "Beim Lösen verteilen sich die Teilchen. Sie verschwinden nicht, die **Masse bleibt gleich**.",
    "Teilchen bewegen sich **ständig**. Darum mischen sich Gase und Lösungen von selbst.",
    "Zwischen den Teilchen ist **nichts**. Farben im Modell dienen nur zur Unterscheidung.",
  ] },
};

export function explainFor(level: LevelKey, task?: Task) {
  const id = typeof level === "number" ? LEVELS[level].id : (LEVELS.find(l => task?.type && l.types.includes(task.type)) ?? LEVELS[0]).id;
  const e = TEXT[id];
  const ex = EXAMPLES.find(x => x.id === e.ex)!;
  return (
    <div className="explain">
      <ul className="ex-points">{e.points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      <figure className="ex-example gm-ex-fig">
        {e.arr.map((a, i) => (
          <span key={a} className="gm-ex-step">
            {i > 0 && <span className="gm-ex-arrow" aria-hidden="true">→</span>}
            <Beaker sim={initial(ex, seedOf(ex.id), a)} label={`${ex.title}${e.arr.length > 1 ? ` ${a}` : ""}`} />
          </span>
        ))}
      </figure>
    </div>
  );
}
