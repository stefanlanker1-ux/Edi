// Quiz der Gemische auf Basis von @lern/quiz: Bild = Becher mit Teilchen (Fit), Antworten Auswahl oder Zahl.
// Hilfsmittel „Farben“: alle Atomfarben der App (verrät nicht, welche im Becher vorkommen).

import { createQuizStore, NumberAnswer, QuizScreen } from "@lern/quiz";
import { Beaker } from "../components/Beaker.tsx";
import { MiniParticle } from "../views/MixView.tsx";
import { initial, seedOf } from "../mixing.ts";
import { elementName, nameOf } from "../mixtures.ts";
import { LEVELS, TYPE_NAMES, levelId, levelName, makeRound, type Task } from "./tasks.ts";
import { explainFor } from "./explain.tsx";
import { MISS } from "./misconceptions.ts";

export const useQuiz = createQuizStore<Task>({ storageKey: "gemische-quiz", levelId, makeRound });

const COLORS = ["H", "C", "N", "O", "He", "Ar"];
function Colors() {
  return (
    <ul className="gm-legend">
      {COLORS.map(el => <li key={el}><MiniParticle f={el} size={30} /><span>{elementName(el)} <b>({el})</b></span></li>)}
    </ul>
  );
}

/** Becher der Aufgabe – gleiche Mischung, gleiche Anordnung (auch nach dem Neuladen); das SVG füllt den Platz (Seitenverhältnis bleibt) */
function TaskBeaker({ t }: { t: Task }) {
  if (!t.mix) return null;
  const { grid, ps } = initial(t.mix, t.state ?? "modell", t.floats, seedOf(JSON.stringify(t.mix)));
  return (
    <div className="q-gm">
      <Beaker grid={grid} ps={ps} state={t.state ?? "modell"} label={`Gefäß mit ${t.mix.map(([f, n]) => `${n} × ${nameOf(f)}`).join(", ")}`} />
    </div>
  );
}

export function QuizView() {
  return (
    <QuizScreen<Task>
      stufe="us"
      title="Quiz · Gemische"
      useQuiz={useQuiz}
      levels={LEVELS}
      levelName={levelName}
      levelId={l => levelId("us", l)}
      typeName={id => TYPE_NAMES[id]}
      missName={id => MISS[id]}
      heroArt={<span className="hero-gm" aria-hidden="true"><MiniParticle f="H2O" size={46} /><MiniParticle f="O3" size={46} /><MiniParticle f="He" size={30} /></span>}
      renderVisual={t => <TaskBeaker t={t} />}
      renderAnswer={(t, a, submit) => (t.kind === "num" ? <NumberAnswer key={t.prompt + JSON.stringify(t.mix)} answer={t.answer} answered={a} submit={submit} max={99} /> : null)}
      solution={t => (t.kind === "num" ? String(t.answer) : null)}
      explain={(level, task) => explainFor(level, task)}
      tools={t => (t.mix ? [{ id: "farben", label: "Farben", icon: "atom" as const, content: <Colors /> }] : [])}
    />
  );
}
