// Quiz der Einheiten-App: Multiple Choice (eingebaut) und Eingabe-Aufgaben mit Rechenweg an der Tafel.

import { useState } from "react";
import { Button } from "@lern/ui";
import { QuizScreen, createQuizStore, type Answered, type QuizTool, type Submit } from "@lern/quiz";
import { fmt, parseQ, solve, chainFor, prefixStep, QUANTITIES } from "@lern/units";
import { useApp } from "../store.ts";
import { LEVELS, TYPE_NAMES, levelId, levelName, makeRound, solutionOf, checkInput, type Task } from "./tasks.ts";
import { explainFor } from "./explain.tsx";
import { ChalkBoard } from "../components/ChalkBoard.tsx";
import { PlaceValueTable } from "../components/PlaceValueTable.tsx";
import { LiveHelp } from "../components/LiveHelp.tsx";
import { ArrowChain } from "../components/ArrowChain.tsx";
import { PowerScale } from "../components/PowerScale.tsx";

export const useQuiz = createQuizStore<Task>({ storageKey: "einheiten-quiz", levelId, makeRound });
type InputTask = Extract<Task, { kind: "input" }>;

function InputAnswer({ task, answered, submit }: { task: InputTask; answered: Answered | null; submit: Submit }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);
  const shown = answered?.values?.v !== undefined ? fmt(parseQ(String(answered.values.v).replace(".", ","))!).text : val;
  const check = () => {
    const ok = checkInput(task, val);
    if (ok === null) { setErr(true); return; }
    submit({ ok, values: { v: Number(val.replace(/[\s ]/g, "").replace(",", ".").replace(/·10\^?/, "e")) || 0 } });
  };
  return (
    <form className={`answer-input${answered ? (answered.ok ? " ok" : " bad") : ""}`} onSubmit={e => { e.preventDefault(); if (!answered) check(); }}>
      <label className="ai-row">
        <span className="ai-lhs">{task.value} {task.from} =</span>
        <input value={shown} disabled={!!answered} inputMode="decimal" autoComplete="off" placeholder="?" aria-label={`Ergebnis in ${task.to}`}
          onChange={e => { setVal(e.target.value); setErr(false); }} />
        <span className="ai-unit">{task.to}</span>
        {answered && <b className="ai-mark" aria-label={answered.ok ? "richtig" : "falsch"}>{answered.ok ? "✓" : "✗"}</b>}
      </label>
      {err && <p className="ai-err">Bitte eine Zahl eingeben – mit Komma, z. B. 0,25 (oder 2,5·10^-4).</p>}
      {!answered && <Button variant="primary" icon="check" type="submit" className="check-btn">Prüfen</Button>}
    </form>
  );
}

/** Lösungsweg (Blatt „Lösungsweg“ nach dem Antworten): Pfeilkette/Stellenwerttafel bzw. Vorsilben-Skala und Rechenweg an der Tafel */
function FeedbackExtra({ task, os }: { task: Task; os: boolean }) {
  const conv = task.kind === "input" ? { value: task.value, from: task.from, to: task.to } : task.conv;
  if (!conv) return null;
  const s = solve(conv.value, conv.from, conv.to);
  const table = task.kind === "input" && task.table ? task.table : QUANTITIES.find(x => x.table && x.units.some(u => u.sym === conv.from) && x.units.some(u => u.sym === conv.to))?.table;
  return (
    <>
      <LiveHelp s={s} os={os} table={table} part="calc" />
      <ChalkBoard s={s} os={os} />
    </>
  );
}

/** Hilfsmittel beim Umrechnen und Vergleichen: Pfeilkette bzw. Vorsilben-Skala – ohne Ergebnis
 *  (nicht bei Fragen nach der Umrechnungszahl selbst, dort wäre es die Lösung) */
function toolsFor(t: Task, os: boolean): QuizTool[] {
  const c = t.kind === "input" ? t : t.type === "compare" ? t.conv : undefined;
  if (!c || c.from === c.to) return [];
  if (os && prefixStep(c.from, c.to)) {
    return [{ id: "scale", label: "Skala", icon: "ruler", wide: true, content: <PowerScale from={c.from} to={c.to} showFactor={false} showResult={false} /> }];
  }
  if (chainFor(c.from, c.to)) {
    return [{ id: "arrows", label: "Pfeile", icon: "ruler", wide: true, content: <ArrowChain from={c.from} to={c.to} os={os} showValues={false} caption={false} /> }];
  }
  return [];
}

export function QuizView() {
  const stufe = useApp(s => s.stufe);
  const os = stufe === "os";
  return (
    <QuizScreen<Task>
      stufe={stufe}
      title={`Quiz · ${os ? "Oberstufe" : "Unterstufe"}`}
      useQuiz={useQuiz}
      levels={LEVELS[stufe]}
      levelName={l => levelName(stufe, l)}
      levelId={l => levelId(stufe, l)}
      typeName={id => (LEVELS[stufe].some(l => l.types.includes(id)) ? TYPE_NAMES[id] : undefined)}
      heroArt={<span className="hero-ruler" aria-hidden="true">{Array.from({ length: 11 }, (_, i) => <i key={i} className={i % 5 === 0 ? "l" : ""} />)}</span>}
      renderVisual={t => (t.kind === "input" && t.table ? <PlaceValueTable value={parseQ(t.value)!} from={t.from} to={t.to} units={t.table} showResult={false} label={`${t.value} ${t.from} → ${t.to}`} /> : null)}
      renderAnswer={(t, a, submit) => (t.kind === "input" ? <InputAnswer key={t.prompt} task={t} answered={a} submit={submit} /> : null)}
      solution={t => (t.kind === "input" ? (() => { const s = solutionOf(t); return `${t.round !== undefined ? "≈ " + fmt(s.result, { digits: t.round }).text : fmt(s.result).text} ${t.to}`; })() : null)}
      feedbackExtra={t => (t.kind === "input" || t.conv ? <FeedbackExtra task={t} os={os} /> : null)}
      tools={t => toolsFor(t, os)}
      explain={(level, task) => explainFor(stufe, level, task)}
    />
  );
}
