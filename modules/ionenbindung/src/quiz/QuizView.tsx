// Quiz der Ionenbindung-App auf Basis von @lern/quiz. Eigener Aufgabentyp: Formel mit Bausteinen bauen.

import { useState } from "react";
import { Button, Stepper, uebenLabel } from "@lern/ui";
import { createQuizStore, QuizScreen, type Answered, type Submit } from "@lern/quiz";
import { ratio, formula, toSubscript, elementsIn } from "@lern/chem";
import { pseTool } from "@lern/chem-ui";
import { IonTable } from "../components/IonTable.tsx";
import { useApp } from "../store.ts";
import { IonWall } from "../components/IonWall.tsx";
import { IonLabel } from "../components/IonTile.tsx";
import { LEVELS, TYPE_NAMES, levelId, levelName, makeRound, ionsOf, type Task } from "./tasks.ts";
import { explainFor } from "./explain.tsx";
import { MISS } from "./misconceptions.ts";
import { tr } from "@lern/i18n";

export const useQuiz = createQuizStore<Task>({ storageKey: "ionenbindung-quiz", levelId, makeRound });

function BuildAnswer({ task, answered, submit }: { task: Extract<Task, { kind: "build" }>; answered: Answered | null; submit: Submit }) {
  const { cation, anion } = ionsOf(task);
  const [n, setN] = useState({ nC: 1, nA: 1 });
  const shown = answered?.values ? { nC: answered.values.nC, nA: answered.values.nA } : n;
  const r = ratio(cation, anion);
  return (
    <div className="answer-ions">
      <IonWall cation={cation} anion={anion} nC={shown.nC} nA={shown.nA} showFormula={!!answered} showName={false} />
      {!answered && (
        <div className="wall-controls">
          <Stepper compact tone="cation" label={<>{tr("Anzahl", "Number")} <IonLabel ion={cation} /></>} value={n.nC} min={1} max={6} onChange={v => setN({ ...n, nC: v })} />
          <Stepper compact tone="anion" label={<>{tr("Anzahl", "Number")} <IonLabel ion={anion} /></>} value={n.nA} min={1} max={6} onChange={v => setN({ ...n, nA: v })} />
          <Button variant="primary" icon="check" className="check-btn" onClick={() => submit({ ok: n.nC === r.nC && n.nA === r.nA, values: n })}>{tr("Prüfen", "Check")}</Button>
        </div>
      )}
    </div>
  );
}

export function QuizView() {
  const stufe = useApp(s => s.stufe);
  return (
    <QuizScreen<Task>
      stufe={stufe}
      title={`${uebenLabel()} · ${stufe === "us" ? "Level I" : "Level II"}`}
      useQuiz={useQuiz}
      levels={LEVELS[stufe]}
      levelName={l => levelName(stufe, l)}
      levelId={l => levelId(stufe, l)}
      typeName={id => (LEVELS[stufe].some(l => l.types.includes(id)) ? TYPE_NAMES[id] : undefined)}
      missName={id => MISS[id]}
      heroArt={<span className="hero-tiles" aria-hidden="true"><i className="t c w2" /><i className="t a" /><i className="t a" /></span>}
      renderAnswer={(t, a, submit) => (t.kind === "build" ? <BuildAnswer task={t} answered={a} submit={submit} /> : null)}
      solution={t => (t.kind === "build" ? (() => { const { cation, anion } = ionsOf(t); const r = ratio(cation, anion); return `${r.nC} : ${r.nA} → ${toSubscript(formula(cation, anion))}`; })() : null)}
      explain={(level, task) => explainFor(stufe, level, task)}
      tools={t => [
        pseTool({ stufe, mark: elementsIn(t.prompt) }),
        // Ionentabelle wie in der Formelsammlung – nur Oberstufe (in der Unterstufe leitet man die Ladung aus dem PSE ab)
        ...(stufe === "os" ? [{ id: "ions", label: tr("Ionen", "Ions"), icon: "table" as const, content: <IonTable text={t.prompt} os /> }] : []),
      ]}
    />
  );
}
