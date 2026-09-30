// Quiz der Stoffmengen-App auf Basis von @lern/quiz.
// Eigene Antwortformen: Zahl mit Einheit ("num") und Rechenweg in zwei Schritten ("steps").

import { useState } from "react";
import { Button } from "@lern/ui";
import { createQuizStore, NumberAnswer, QuizScreen, type Answered, type Submit } from "@lern/quiz";
import { formulaElements, fmt, round } from "@lern/chem";
import { pseTool } from "@lern/chem-ui";
import { LEVELS, TYPE_NAMES, levelId, levelName, makeRound, type Task } from "./tasks.ts";
import { explainFor } from "./explain.tsx";

export const useQuiz = createQuizStore<Task>({ storageKey: "stoffmenge-quiz", levelId, makeRound });

/** Eingabe mit Komma oder Punkt */
const parse = (v: string) => Number(v.replace(",", "."));
const same = (a: number, b: number) => Math.abs(round(a) - round(b)) < 0.006;

/** Rechenweg ausfüllen: erst M, dann n – jedes Feld wird einzeln als ✓/✗ markiert */
function StepsAnswer({ task, answered, submit }: { task: Extract<Task, { kind: "steps" }>; answered: Answered | null; submit: Submit }) {
  const [v, setV] = useState<Record<string, string>>({});
  const val = (id: string) => (answered?.values ? fmt(answered.values[id]) : v[id] ?? "");
  const complete = task.fields.every(f => (v[f.id] ?? "").trim() !== "");
  return (
    <form className="steps-answer" onSubmit={e => {
      e.preventDefault();
      if (!complete) return;
      const values = Object.fromEntries(task.fields.map(f => [f.id, parse(v[f.id])]));
      submit({ ok: task.fields.every(f => same(values[f.id], f.answer)), values });
    }}>
      {task.fields.map((f, i) => {
        const ok = answered ? same(answered.values?.[f.id] ?? NaN, f.answer) : null;
        return (
          <label key={f.id} className={`step-row${ok === null ? "" : ok ? " ok" : " bad"}`}>
            <span className="step-num">{"①②③"[i]}</span>
            <span className="step-label">{f.label} =</span>
            <input type="text" inputMode="decimal" value={val(f.id)} disabled={!!answered} aria-label={f.label} onChange={e => setV({ ...v, [f.id]: e.target.value })} autoFocus={i === 0} />
            <span className="step-unit">{f.unit}</span>
            {ok !== null && <span className="step-mark" aria-label={ok ? "richtig" : "falsch"}>{ok ? "✓" : "✗"}</span>}
          </label>
        );
      })}
      {!answered && <Button variant="primary" icon="check" type="submit" disabled={!complete}>Prüfen</Button>}
    </form>
  );
}

export function QuizView() {
  return (
    <QuizScreen<Task>
      stufe="us"
      title="Quiz · Stoffmenge"
      useQuiz={useQuiz}
      levels={LEVELS}
      levelName={l => levelName("us", l)}
      levelId={l => levelId("us", l)}
      typeName={id => TYPE_NAMES[id]}
      heroArt={<span className="hero-mol" aria-hidden="true">mol</span>}
      renderAnswer={(t, a, submit) =>
        t.kind === "num" ? <NumberAnswer key={t.prompt} answer={t.answer} unit={t.unit} decimal equal={same} format={fmt} answered={a} submit={submit} />
          : t.kind === "steps" ? <StepsAnswer key={t.prompt} task={t} answered={a} submit={submit} />
            : null}
      solution={t => (t.kind === "num" ? `${fmt(t.answer)} ${t.unit}` : t.kind === "steps" ? t.fields.map(f => `${f.label.split(" =")[0]} = ${fmt(f.answer)} ${f.unit}`).join(", ") : null)}
      explain={(level, task) => explainFor(level, task)}
      // PSE nur, wo es die Lösung nicht direkt verrät (nicht beim Ablesen der Atommasse)
      tools={t => (t.type === "atommasse" || t.type === "formel" ? [] : [
        pseTool({ stufe: "us", mark: "mark" in t && t.mark ? formulaElements(t.mark) : [], wide: true }),
      ])}
    />
  );
}
