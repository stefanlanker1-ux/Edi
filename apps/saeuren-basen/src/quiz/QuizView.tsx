// Quiz der Säuren/Basen-App auf Basis von @lern/quiz.
// Eigene Antwortformen: Zahl eintippen ("num") und Farbe wählen ("swatch").

import { createQuizStore, NumberAnswer, QuizScreen, type Answered, type Submit } from "@lern/quiz";
import { elementsIn } from "@lern/chem";
import { pseTool } from "@lern/chem-ui";
import { LEVELS, TYPE_NAMES, levelId, levelName, makeRound, type Task } from "./tasks.ts";
import { explainFor } from "./explain.tsx";
import { PhScale, Swatch } from "../components/Ph.tsx";

export const useQuiz = createQuizStore<Task>({ storageKey: "saeuren-basen-quiz", levelId, makeRound });

/** Farbe wählen: Farbfelder mit Namen (Richtig/falsch zusätzlich mit ✓/✗ und Rahmen, nie nur über Farbe) */
function SwatchAnswer({ task, answered, submit }: { task: Extract<Task, { kind: "swatch" }>; answered: Answered | null; submit: Submit }) {
  return (
    <div className="swatch-grid" role="group" aria-label="Farbe wählen">
      {task.options.map((o, i) => {
        const cls = answered ? (i === task.answer ? " right" : i === answered.choice ? " wrong" : " faded") : "";
        return (
          <button key={i} type="button" className={`swatch-btn${cls}`} disabled={!!answered} onClick={() => submit({ ok: i === task.answer, choice: i })}>
            <span className="mc-key" aria-hidden="true">{answered && i === task.answer ? "✓" : answered && i === answered.choice ? "✗" : "ABCD"[i]}</span>
            <Swatch color={o} />
          </button>
        );
      })}
    </div>
  );
}

export function QuizView() {
  return (
    <QuizScreen<Task>
      stufe="us"
      title="Quiz · Säuren und Basen"
      useQuiz={useQuiz}
      levels={LEVELS}
      levelName={l => levelName("us", l)}
      levelId={l => levelId("us", l)}
      typeName={id => TYPE_NAMES[id]}
      heroArt={<span className="hero-ph" aria-hidden="true"><PhScale compact labels={false} /></span>}
      renderVisual={t => ("eq" in t && t.eq ? <p className="q-eq">{t.eq}</p> : "ph" in t && t.ph !== undefined ? <div className="q-ph"><PhScale ph={t.ph} /></div> : null)}
      renderAnswer={(t, a, submit) =>
        t.kind === "num" ? <NumberAnswer key={t.prompt} answer={t.answer} max={99} answered={a} submit={submit} />
          : t.kind === "swatch" ? <SwatchAnswer key={t.prompt} task={t} answered={a} submit={submit} />
            : null}
      solution={t => (t.kind === "num" ? String(t.answer) : t.kind === "swatch" ? t.options[t.answer] : null)}
      explain={(level, task) => explainFor(level, task)}
      tools={t => (t.type === "indikator" || t.type === "klasse" || t.type === "stoff" ? [] : [
        { id: "skala", label: "Skala", icon: "ruler", content: <div className="q-tool-scale"><PhScale /><p>0–6 sauer · 7 neutral · 8–14 basisch</p></div> },
        pseTool({ stufe: "us", mark: elementsIn(t.prompt) }),
      ])}
    />
  );
}
