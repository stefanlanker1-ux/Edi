// Quiz der Neutralisation auf Basis von @lern/quiz. Eigener Aufgabentyp: Neutralisation mit Bausteinen bauen.

import { useState } from "react";
import { Button, Stepper } from "@lern/ui";
import { Formula, pseTool } from "@lern/chem-ui";
import { createQuizStore, QuizScreen, type Answered, type Submit } from "@lern/quiz";
import { PROTIC_ACIDS, formulaElements, neutralEquation } from "@lern/chem";
import { useApp } from "../store.ts";
import { NeutralWall } from "../components/NeutralWall.tsx";
import { AcidTable } from "../components/Pickers.tsx";
import { LEVELS, TYPE_NAMES, levelId, levelName, makeRound, unitsOf, type Task } from "./tasks.ts";
import { explainFor } from "./explain.tsx";
import { MISS } from "./misconceptions.ts";

export const useQuiz = createQuizStore<Task>({ storageKey: "neutralisation-quiz", levelId, makeRound });

function BuildAnswer({ task, answered, submit }: { task: Extract<Task, { kind: "build" }>; answered: Answered | null; submit: Submit }) {
  const { base, acid } = unitsOf(task);
  const [c, setC] = useState({ nB: 1, nA: 1 });
  const shown = answered?.values ? { nB: answered.values.nB, nA: answered.values.nA } : c;
  const n = neutralEquation(base, acid, task.step);
  return (
    <div className="answer-nw">
      <NeutralWall base={base} acid={acid} step={task.step} nB={shown.nB} nA={shown.nA} showResult={!!answered} />
      {!answered && (
        <div className="nw-controls">
          <Stepper compact tone="base" label={<Formula f={base.formula} />} value={c.nB} min={1} max={6} onChange={v => setC({ ...c, nB: v })} />
          <Stepper compact tone="acid" label={<Formula f={acid.formula} />} value={c.nA} min={1} max={6} onChange={v => setC({ ...c, nA: v })} />
          <Button variant="primary" icon="check" className="check-btn" onClick={() => submit({ ok: c.nB === n.nBase && c.nA === n.nAcid, values: c })}>Prüfen</Button>
        </div>
      )}
    </div>
  );
}

/** Elemente der Formeln einer Aufgabe (für die Markierung im PSE) */
const marksOf = (t: Task) => formulaElements(...(t.f ?? []));
/** Die Säuretabelle verrät Namen und Ladungen der Säurereste – nur bei Aufgaben, die danach nicht fragen (und nur Oberstufe, wie eine Formelsammlung) */
const TABLE_OK = new Set(["bauen", "wasser", "koeffizient", "gleichung", "salz"]);

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
      missName={id => MISS[id]}
      heroArt={<span className="hero-tiles" aria-hidden="true"><i className="c" /><i className="w" /><i className="w" /><i className="w" /><i className="w" /><i className="a" /></span>}
      renderAnswer={(t, a, submit) => (t.kind === "build" ? <BuildAnswer task={t} answered={a} submit={submit} /> : null)}
      solution={t => (t.kind === "build" ? (() => { const { base, acid } = unitsOf(t); const n = neutralEquation(base, acid, t.step); return `${n.nBase} ${base.formula.replace(/\d/g, d => "₀₁₂₃₄₅₆₇₈₉"[+d])} : ${n.nAcid} ${acid.formula.replace(/\d/g, d => "₀₁₂₃₄₅₆₇₈₉"[+d])}`; })() : null)}
      explain={(level, task) => explainFor(stufe, level, task)}
      tools={t => [
        pseTool({ stufe, mark: marksOf(t) }),
        ...(os && TABLE_OK.has(t.type ?? "") ? [{ id: "tab", label: "Säuren", icon: "table" as const, wide: true,
          content: <AcidTable os mark={PROTIC_ACIDS.filter(a => t.f?.includes(a.formula)).map(a => a.id)} /> }] : []),
      ]}
    />
  );
}
