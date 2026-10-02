// Quiz auf Basis von @lern/quiz; eigener Aufgabentyp „Molekül bauen“ mit dem Baufeld.

import { useState } from "react";
import { Button, Tag } from "@lern/ui";
import { Formula, PseHelp } from "@lern/chem-ui";
import { createQuizStore, QuizScreen, type Answered, type Submit } from "@lern/quiz";
import { isComplete, identify, elementsIn, elementName, BY_SYMBOL, BY_Z, type Molecule } from "@lern/chem";
import { useApp } from "../store.ts";
import { Builder, AtomChip } from "../components/Builder.tsx";
import { LewisSvg } from "../components/LewisSvg.tsx";
import { empty, COLS, ROWS, loadKnown } from "../edit.ts";
import { LEVELS, TYPE_NAMES, KNOWN_BY_ID, levelId, levelName, makeRound, type Task } from "./tasks.ts";
import { explainFor } from "./explain.tsx";
import { MISS } from "./misconceptions.ts";

export const useQuiz = createQuizStore<Task>({ storageKey: "elektronenpaar-quiz", levelId, makeRound });

function BuildAnswer({ task, answered, submit }: { task: Extract<Task, { kind: "build" }>; answered: Answered | null; submit: Submit }) {
  const [mol, setMol] = useState<Molecule>(empty);
  const done = isComplete(mol);
  if (answered) return null;
  return (
    <div className="answer-mol">
      <Builder mol={mol} onChange={setMol} elements={task.elements} />
      {mol.atoms.length > 1 && !done && <div className="ui-tags"><Tag tone="signal">noch nicht fertig</Tag></div>}
      <Button variant="primary" icon="check" className="check-btn" disabled={mol.atoms.length < 2}
        onClick={() => submit({
          ok: done && identify(mol)?.id === task.molecule,
          // für die Fallen (traps) der Aufgabe: Atomzahl falsch? Mehrfachbindungen gesetzt? alle Oktette voll?
          values: { atomsOff: mol.atoms.length === KNOWN_BY_ID[task.molecule].atoms.length ? 0 : 1, multi: mol.bonds.filter(b => b.order > 1).length, complete: done ? 1 : 0 },
        })}>Prüfen</Button>
    </div>
  );
}

export function QuizView() {
  const stufe = useApp(s => s.stufe);
  return (
    <QuizScreen<Task>
      stufe={stufe}
      title={`Quiz · ${stufe === "us" ? "Level I" : "Level II"}`}
      useQuiz={useQuiz}
      levels={LEVELS[stufe]}
      levelName={l => levelName(stufe, l)}
      levelId={l => levelId(stufe, l)}
      typeName={id => (LEVELS[stufe].some(l => l.types.includes(id)) ? TYPE_NAMES[id] : undefined)}
      missName={id => MISS[id]}
      heroArt={<LewisSvg mol={loadKnown("H2O")} cols={COLS} rows={ROWS} crop />}
      renderAnswer={(t, a, submit) => (t.kind === "build" ? <BuildAnswer task={t} answered={a} submit={submit} /> : null)}
      solution={t => (t.kind === "build"
        ? <div className="sol-mol"><Formula f={KNOWN_BY_ID[t.molecule].formula} /><div className="sol-lewis"><LewisSvg mol={loadKnown(t.molecule)} cols={COLS} rows={ROWS} crop /></div></div>
        : null)}
      explain={(level, task) => explainFor(stufe, level, task)}
      tools={t => {
        const mark = atomsOf(t);
        return [{ id: "atome", label: "Atome", icon: "atom", wide: stufe === "os", content: (
          <div className="atoms-help">
            {mark.length > 0 && (
              <ul className="ah-list">
                {mark.map(Z => <li key={Z}><span className="ah-svg"><AtomChip el={BY_Z[Z].symbol} /></span><span>{elementName(BY_Z[Z].symbol)}</span></li>)}
              </ul>
            )}
            <PseHelp stufe={stufe} mark={mark} />
          </div>
        ) }];
      }}
    />
  );
}

/** Elemente einer Aufgabe: aus Namen im Text und aus der Summenformel in Klammern (H₂O, CH₄ …) */
function atomsOf(t: Task): number[] {
  const out = new Set(elementsIn(t.prompt));
  const formula = t.kind === "build" ? KNOWN_BY_ID[t.molecule].formula : [...t.prompt.matchAll(/\(([A-Za-z₀-₉]+)\)|\*\*([A-Za-z₀-₉]+)\*\*/g)].map(m => m[1] ?? m[2]).filter(f => /^([A-Z][a-z]?[₀-₉]*)+$/.test(f)).join(" ");
  for (const m of formula.matchAll(/[A-Z][a-z]?/g)) if (BY_SYMBOL[m[0]]) out.add(BY_SYMBOL[m[0]].Z);
  return [...out].sort((a, b) => a - b);
}
