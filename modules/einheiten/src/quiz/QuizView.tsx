// Quiz der Einheiten-App: Multiple Choice (eingebaut) und Eingabe-Aufgaben mit Rechenweg an der Tafel.
// Hilfen auf Wunsch passend zur Aufgabe (ohne Ergebnis): Pfeile (Längen/Massen/Liter bzw. Flächen/Volumen mit Längen darüber),
// Vorsilben-Skala, Stellenwerttafel, bei zusammengesetzten Einheiten die Einsetz-Kette.

import { useState } from "react";
import { Button } from "@lern/ui";
import { QuizScreen, createQuizStore, type Answered, type QuizTool, type Submit } from "@lern/quiz";
import { fmt, parseQ, solve, chainFor, prefixStep, unitName } from "@lern/units";
import { LEVELS, TYPE_NAMES, levelId, levelName, makeRound, solutionOf, checkInput, tableFor, type Task } from "./tasks.ts";
import { useApp } from "../store.ts";
import { explainFor } from "./explain.tsx";
import { ChalkBoard } from "../components/ChalkBoard.tsx";
import { PlaceValueTable } from "../components/PlaceValueTable.tsx";
import { LiveHelp } from "../components/LiveHelp.tsx";
import { ArrowChain } from "../components/ArrowChain.tsx";
import { PowerScale } from "../components/PowerScale.tsx";
import { DimChain, dimOf } from "../components/DimChain.tsx";
import { SubstFlow } from "../components/Visuals.tsx";
import { rare } from "../help.ts";

export const useQuiz = createQuizStore<Task>({ storageKey: "einheiten-quiz", levelId, makeRound });
type InputTask = Extract<Task, { kind: "input" }>;

function InputAnswer({ task, answered, submit }: { task: InputTask; answered: Answered | null; submit: Submit }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);
  const shown = answered?.values?.v !== undefined ? fmt(parseQ(String(answered.values.v).replace(".", ","))!).text : val;
  const check = () => {
    const ok = checkInput(task, val);
    if (ok === null) { setErr(true); return; }
    submit({ ok, values: { v: Number(val.replace(/[\s ]/g, "").replace(",", ".").replace(/·10\^?/, "e")) || 0 } });
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

/** Bild der Aufgabe: von welcher Einheit in welche (mit Namen) – füllt die Karte, ohne etwas zu verraten */
function TaskBanner({ from, to, value }: { from: string; to: string; value: string }) {
  const dim = dimOf(from, to);
  return (
    <div className="tb" aria-hidden="true">
      {dim && (
        <svg className="tb-glyph" viewBox="0 0 40 40">
          {dim === 2 ? <rect x="6" y="6" width="28" height="28" rx="1" />
            : <><path d="M6 14h20v20H6z" /><path d="M6 14l8-8h20l-8 8M26 34l8-8V6" /></>}
        </svg>
      )}
      <div className="tb-u"><b>{value} {from}</b><span>{unitName(from)}</span></div>
      <span className="tb-arrow">→</span>
      <div className="tb-u"><b>? {to}</b><span>{unitName(to)}</span></div>
    </div>
  );
}

/** Lösungsweg (Blatt „Lösung“ nach dem Antworten): Pfeilkette bzw. Skala und Rechenweg an der Tafel */
function FeedbackExtra({ task }: { task: Task }) {
  const conv = task.kind === "input" ? { value: task.value, from: task.from, to: task.to } : task.conv;
  if (!conv) return null;
  const s = solve(conv.value, conv.from, conv.to);
  const os = rare(conv.from, conv.to);
  return (
    <>
      {dimOf(conv.from, conv.to) ? <DimChain from={conv.from} to={conv.to} /> : <LiveHelp s={s} os={os} table={tableFor(conv.from, conv.to)} part="calc" />}
      <ChalkBoard s={s} os={os} />
    </>
  );
}

/** Hilfsmittel passend zur Aufgabe – ohne Ergebnis (nicht bei Fragen nach der Umrechnungszahl selbst, dort wäre es die Lösung) */
function toolsFor(t: Task): QuizTool[] {
  const c = t.kind === "input" ? t : t.type?.endsWith("compare") ? t.conv : undefined;
  if (!c || c.from === c.to) return [];
  const out: QuizTool[] = [];
  if (dimOf(c.from, c.to)) out.push({ id: "arrows", label: "Pfeile", icon: "ruler", wide: true, content: <DimChain from={c.from} to={c.to} /> });
  else if (chainFor(c.from, c.to)) out.push({ id: "arrows", label: "Pfeile", icon: "ruler", wide: true, content: <ArrowChain from={c.from} to={c.to} showValues={false} caption={false} /> });
  if (prefixStep(c.from, c.to)) out.push({ id: "scale", label: "Skala", icon: "layers", wide: true, content: <PowerScale from={c.from} to={c.to} showFactor={false} showResult={false} /> });
  const table = t.kind === "input" ? tableFor(c.from, c.to) : undefined;
  if (table) out.push({ id: "table", label: "Stellen", icon: "table", wide: true, content: <PlaceValueTable value={parseQ(c.value)!} from={c.from} to={c.to} units={table} showResult={false} label={`${c.value} ${c.from} → ${c.to}`} /> });
  if (!out.length) out.push({ id: "subst", label: "Einsetzen", icon: "board", wide: true, content: <SubstFlow s={solve("1", c.from, c.to)} /> });
  return out;
}

export function QuizView() {
  const stufe = useApp(s => s.stufe);
  return (
    <QuizScreen<Task>
      stufe={stufe}
      title="Quiz"
      useQuiz={useQuiz}
      levels={LEVELS[stufe]}
      levelName={l => levelName(stufe, l)}
      levelId={l => levelId(stufe, l)}
      typeName={id => TYPE_NAMES[id]}
      heroArt={<span className="hero-ruler" aria-hidden="true">{Array.from({ length: 11 }, (_, i) => <i key={i} className={i % 5 === 0 ? "l" : ""} />)}</span>}
      renderVisual={t => (t.kind === "input" ? <TaskBanner from={t.from} to={t.to} value={t.value} /> : null)}
      renderAnswer={(t, a, submit) => (t.kind === "input" ? <InputAnswer key={t.prompt} task={t} answered={a} submit={submit} /> : null)}
      solution={t => (t.kind === "input" ? (() => { const s = solutionOf(t); return `${t.round !== undefined ? "≈ " + fmt(s.result, { digits: t.round }).text : fmt(s.result).text} ${t.to}`; })() : null)}
      feedbackExtra={t => (t.kind === "input" || t.conv ? <FeedbackExtra task={t} /> : null)}
      tools={toolsFor}
      explain={(level, task) => explainFor(stufe, level, task)}
    />
  );
}
