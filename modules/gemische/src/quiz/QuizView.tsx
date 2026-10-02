// Quiz der Gemische auf Basis von @lern/quiz: Bild = Teilchenbild (Container-Einheiten statt Fit), Antworten Auswahl, Zahl
// oder Teilchenbilder (renderOption). Hilfsmittel „Farben“: alle Atomfarben des Quiz (verrät nicht, welche vorkommen).

import { createQuizStore, NumberAnswer, QuizScreen } from "@lern/quiz";
import { Beaker } from "../components/Beaker.tsx";
import { MiniParticle, Legend } from "../views/MixView.tsx";
import { initial, seedOf } from "../mixing.ts";
import { nameOf } from "../mixtures.ts";
import { LEVELS, TYPE_NAMES, describe, levelId, levelName, makeRound, type Pic, type Task } from "./tasks.ts";
import { explainFor } from "./explain.tsx";
import { MISS } from "./misconceptions.ts";
import { tr } from "@lern/i18n";

export const useQuiz = createQuizStore<Task>({ storageKey: "gemische-quiz", levelId, makeRound, fixedOrder: true });

/** alle Atomsorten, die im Quiz vorkommen */
export const QUIZ_ATOMS = ["H", "C", "N", "O", "S", "He", "Ne", "Ar", "Cu", "Zn", "Fe", "Al"];

/** Teilchenbild einer Aufgabe – gleiche Anordnung auch nach dem Neuladen */
export function PicBeaker({ p, className }: { p: Pic; className?: string }) {
  const sim = initial({ items: p.mix, state: p.state, floats: p.floats, before: p.before, solute: p.solute }, seedOf(JSON.stringify(p)), p.arrange ?? "nachher");
  return <Beaker sim={sim} className={className} label={`${tr("Teilchenbild", "Particle picture")}: ${p.mix.map(([f, n]) => `${n} × ${nameOf(f)}`).join(", ")}`} />;
}

export function QuizView() {
  return (
    <QuizScreen<Task>
      stufe="us"
      title={tr("Quiz · Gemische", "Quiz · Mixtures")}
      useQuiz={useQuiz}
      levels={LEVELS}
      levelName={levelName}
      levelId={l => levelId("us", l)}
      typeName={id => TYPE_NAMES[id]}
      missName={id => MISS[id]}
      heroArt={<span className="hero-gm" aria-hidden="true"><MiniParticle f="H2O" size={46} /><MiniParticle f="CO2" size={46} /><MiniParticle f="He" size={30} /></span>}
      renderVisual={t => (t.pic ? <div className="q-gm"><PicBeaker p={t.pic} /></div> : null)}
      renderOption={(t, o) => (t.pics?.[o] ? <span className="gm-pic"><PicBeaker p={t.pics[o]} /><span className="sr-only">{describe(t.pics[o])}</span></span>
        : t.type === "gemischart" ? <span className="gm-one">{o}</span> : o)}
      renderAnswer={(t, a, submit) => (t.kind === "num" ? <NumberAnswer key={t.prompt + JSON.stringify(t.pic)} answer={t.answer} answered={a} submit={submit} max={99} /> : null)}
      solution={t => (t.kind === "num" ? String(t.answer) : null)}
      explain={(level, task) => explainFor(level, task)}
      tools={t => (t.pic || t.pics ? [{ id: "farben", label: tr("Farben", "Colours"), icon: "atom" as const, content: <Legend els={QUIZ_ATOMS} /> }] : [])}
    />
  );
}
