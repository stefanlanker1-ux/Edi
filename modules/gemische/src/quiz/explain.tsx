// Kurze Erklärkarten je Thema mit Teilchenbildern als Beispiel (Lösen: vorher → nachher); Level mit Tipp nennen den Tipp-Knopf.

import { RichText } from "@lern/ui";
import type { LevelKey } from "@lern/quiz";
import { Beaker } from "../components/Beaker.tsx";
import { initial, seedOf, type Arrange } from "../mixing.ts";
import { EXAMPLES, small } from "../mixtures.ts";
import { LEVELS, type Task } from "./tasks.ts";
import { tr } from "@lern/i18n";

const TEXT: Record<string, { points: string[]; ex: string; arr: Arrange[] }> = tr({
  basics: { ex: "modell", arr: ["nachher"], points: [
    "Ein **Teilchen** ist ein Molekül oder ein einzelnes Atom. Gleiche Teilchen bilden einen **Stoff**.",
    "**Reinstoff:** nur eine Teilchensorte. **Gemisch:** mehrere Teilchensorten.",
    "**Element:** nur **eine** Atomsorte (He, Cu, O₂). **Verbindung:** mehrere Atomsorten fest im Teilchen (H₂O, CO₂).",
  ] },
  homogen: { ex: "oel", arr: ["nachher"], points: [
    "**Homogen:** überall gleich, keine Grenze zu sehen – auch nicht unter dem Mikroskop.",
    "**Heterogen:** Teile, Tröpfchen oder Schichten sind zu erkennen.",
    "**Klar** heißt nicht **rein**: Gelöstes sieht man nicht, es ist trotzdem ein Gemisch.",
  ] },
  everyday: { ex: "messing", arr: ["nachher"], points: [
    "Homogen: **Lösung** (s/l), **Legierung** (s/s), **Gasgemisch** (g/g).",
    "Heterogen: **Emulsion** (l/l), **Suspension** (s/l), **Gemenge** (s/s), **Rauch** (s/g), **Nebel** (l/g), **Schaum** (g/l).",
    "„Rein“ auf einer Packung heißt: nichts dazugegeben. Ein **Reinstoff** ist nur **ein** Stoff.",
  ] },
  solving: { ex: "zucker", arr: ["vorher", "nachher"], points: [
    "Beim Lösen verteilen sich die Teilchen. Sie verschwinden nicht, die **Masse bleibt gleich**.",
    "Teilchen bewegen sich **ständig**. Darum mischen sich Gase und Lösungen von selbst.",
    "Zwischen den Teilchen ist **nichts**. Farben im Modell dienen nur zur Unterscheidung.",
  ] },
}, {
  basics: { ex: "modell", arr: ["nachher"], points: [
    "A **particle** is a molecule or a single atom. Identical particles form a **substance**.",
    "**Pure substance:** only one kind of particle. **Mixture:** several kinds of particles.",
    "**Element:** only **one** kind of atom (He, Cu, O₂). **Compound:** several kinds of atoms bonded in the particle (H₂O, CO₂).",
  ] },
  homogen: { ex: "oel", arr: ["nachher"], points: [
    "**Homogeneous:** the same everywhere, no boundary visible – not even under the microscope.",
    "**Heterogeneous:** pieces, droplets or layers can be seen.",
    "**Clear** does not mean **pure**: you cannot see what is dissolved, it is still a mixture.",
  ] },
  everyday: { ex: "messing", arr: ["nachher"], points: [
    "Homogeneous: **solution** (s/l), **alloy** (s/s), **gas mixture** (g/g).",
    "Heterogeneous: **emulsion** (l/l), **suspension** (s/l), **coarse mixture** (s/s), **smoke** (s/g), **fog** (l/g), **foam** (g/l).",
    "“Pure” on a package means: nothing added. A **pure substance** is only **one** substance.",
  ] },
  solving: { ex: "zucker", arr: ["vorher", "nachher"], points: [
    "When dissolving, the particles spread out. They do not disappear, the **mass stays the same**.",
    "Particles move **all the time**. That is why gases and solutions mix by themselves.",
    "Between the particles there is **nothing**. Colours in the model only tell them apart.",
  ] },
});
const TOPIC: Record<string, string> = { "gm-t1": "basics", "gm-t2": "homogen", "gm-t3": "everyday", "gm-t4": "solving" };
const CUE = tr("In diesem Niveau hilft der **Tipp** genau bei der Aufgabe. Tipp antippen kostet keine Punkte.", "At this stage the **hint** helps with exactly this task. Tapping the hint costs no points.");

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
            <Beaker sim={initial({ ...ex, items: small(ex.items) }, seedOf(ex.id), a)} label={`${ex.title}${e.arr.length > 1 ? ` ${a === "vorher" ? tr("vorher", "before") : tr("nachher", "after")}` : ""}`} />
          </span>
        ))}
      </figure>
    </div>
  );
}
