// Quiz der Reaktionsgleichungen-App auf Basis von @lern/quiz.
// Eigene Antwortformen: Zahl eintippen ("num") und Koeffizienten setzen ("balance").

import { useState } from "react";
import { Button } from "@lern/ui";
import { createQuizStore, NumberAnswer, QuizScreen, type Answered, type Submit } from "@lern/quiz";
import { isBalanced, equationText, elementsIn } from "@lern/chem";
import { pseTool } from "@lern/chem-ui";
import { EquationRow, FitLine, maxCoef } from "../components/Equation.tsx";
import { useApp } from "../store.ts";
import { MoleculeScene, hasModel } from "../components/Molecules.tsx";
import { LEVELS, TYPE_NAMES, levelId, levelName, makeRound, reactionOf, speciesOf, type Task } from "./tasks.ts";
import { SubstanceList } from "../components/Substance.tsx";
import { explainFor } from "./explain.tsx";

export const useQuiz = createQuizStore<Task>({ storageKey: "reaktionsgleichungen-quiz", levelId, makeRound });

const gcdAll = (xs: number[]) => xs.reduce((g, x) => { while (x) [g, x] = [x, g % x]; return g; }, 0);

function BalanceAnswer({ task, answered, submit }: { task: Extract<Task, { kind: "balance" }>; answered: Answered | null; submit: Submit }) {
  const r = reactionOf(task);
  const [c, setC] = useState<number[]>(() => r.coeffs.map(() => 1));
  const shown = answered?.values ? r.coeffs.map((_, i) => answered.values![`c${i}`]) : c;
  return (
    <div className="bal-answer">
      {hasModel(r) && <div className="bal-scene"><MoleculeScene eq={r} coeffs={shown} state={answered ? (answered.ok ? "ok" : "bad") : undefined} /></div>}
      <EquationRow eq={r} coeffs={shown} max={maxCoef(r)} onChange={answered ? undefined : (k, v) => setC(p => p.map((x, i) => (i === k ? v : x)))} />
      {!answered && (
        <Button variant="primary" icon="check" className="check-btn"
          onClick={() => submit({ ok: isBalanced(r, c) && gcdAll(c) === 1, values: Object.fromEntries(c.map((x, i) => [`c${i}`, x])) })}>
          Prüfen
        </Button>
      )}
    </div>
  );
}

export function QuizView() {
  const stufe = useApp(s => s.stufe);
  const os = stufe === "os";
  return (
    <QuizScreen<Task>
      stufe={stufe}
      title={`Quiz · ${os ? "Level II" : "Level I"}`}
      useQuiz={useQuiz}
      levels={LEVELS[stufe]}
      levelName={l => levelName(stufe, l)}
      levelId={l => levelId(stufe, l)}
      typeName={id => (LEVELS[stufe].some(l => l.types.includes(id)) ? TYPE_NAMES[id] : undefined)}
      heroArt={
        // Atombilanz wie auf der Startseite: H 4 | 4 ✓, O 2 | 2 ✓
        <svg className="hero-scale" viewBox="0 0 262 100" aria-hidden="true">
          {([["H", 4, 36], ["O", 2, 86]] as const).map(([el, n, y]) => (
            <g key={el}>
              <text x="0" y={y} fontSize="30" fontWeight="800" style={{ fill: "var(--text)" }}>{el}</text>
              {Array.from({ length: n }, (_, i) => <rect key={i} x={136 - (n - i) * 24} y={y - 20} width="19" height="19" rx="2" style={{ fill: "var(--text)" }} />)}
              <text x="150" y={y} fontSize="26" fontWeight="800" textAnchor="middle" style={{ fill: "var(--ok)" }}>✓</text>
              {Array.from({ length: n }, (_, i) => <rect key={i} x={168 + i * 24} y={y - 20} width="19" height="19" rx="2" style={{ fill: "none", stroke: "var(--text)", strokeWidth: 2.5 }} />)}
            </g>
          ))}
        </svg>
      }
      renderVisual={t => ("eq" in t && t.eq ? (/[a-zäöüß]{3}/.test(t.eq) ? <p className="q-eq">{t.eq}</p> : <FitLine text={t.eq} className="q-eq" />) : null)}
      // Formelgleichungen als Antwort: einzeilig, Schrift passt sich an (nie umbrechen)
      renderOption={(_, o) => (o.includes("→") && !/[a-zäöüß]{3}/.test(o) ? <FitLine text={o} className="mc-eq" base={18} /> : o)}
      renderAnswer={(t, a, submit) =>
        t.kind === "num" ? <NumberAnswer key={t.prompt} answer={t.answer} answered={a} submit={submit} />
          : t.kind === "balance" ? <BalanceAnswer key={t.reaction + t.prompt} task={t} answered={a} submit={submit} />
            : null}
      solution={t => (t.kind === "num" ? String(t.answer) : t.kind === "balance" ? equationText(reactionOf(t), reactionOf(t).coeffs) : null)}
      explain={(level, task) => explainFor(stufe, level, task)}
      tools={t => {
        const fs = speciesOf(t);
        return [
          ...(fs.length ? [{ id: "stoffe", label: "Stoffe", icon: "molecule" as const, content: <SubstanceList key={fs.join()} fs={fs} /> }] : []),
          pseTool({ stufe, mark: elementsIn(t.kind === "balance" ? equationText(reactionOf(t)) : (("eq" in t && t.eq) || "") + " " + t.prompt) }),
        ];
      }}
    />
  );
}
