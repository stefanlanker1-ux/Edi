// Quiz „Reinstoffe und Gemische“ auf Basis von @lern/quiz.
// Eigene Antwortformen: in der Einteilung antippen ("map") und Phasen / Elemente / Verbindungen zählen ("count").

import { useId, useState } from "react";
import { Button, Stepper } from "@lern/ui";
import { createQuizStore, QuizScreen, type Answered, type Submit } from "@lern/quiz";
import { ConceptMap, NODE_NAMES } from "../components/ConceptMap.tsx";
import { BeakerPair, ParticleBeaker, W, H } from "../components/Beaker.tsx";
import { LEVELS, NODES, TYPE_NAMES, levelId, levelName, makeRound, type CountTask, type MapTask, type Task } from "./tasks.ts";
import { explainFor } from "./explain.tsx";
import { MISS } from "./misconceptions.ts";

export const useQuiz = createQuizStore<Task>({ storageKey: "reinstoffe-quiz", levelId, makeRound });

function MapAnswer({ task, answered, submit }: { task: MapTask; answered: Answered | null; submit: Submit }) {
  const chosen = answered?.values ? NODES[answered.values.n] : undefined;
  const pickable = task.part === "top" ? NODES.slice(0, 4) : NODES.slice(4);
  return (
    <div className="map-answer">
      <ConceptMap part={task.part} pickable={pickable} onPick={n => submit({ ok: n === task.answer, values: { n: NODES.indexOf(n) } })}
        result={answered ? { right: task.answer, chosen } : undefined} />
    </div>
  );
}

function CountAnswer({ task, answered, submit }: { task: CountTask; answered: Answered | null; submit: Submit }) {
  const [v, setV] = useState({ p: 1, e: 0, c: 0 });
  const shown = answered?.values ? { p: answered.values.p, e: answered.values.e, c: answered.values.c } : v;
  const row = (k: "p" | "e" | "c", label: string) => (
    <Stepper compact label={label} value={shown[k]} min={0} max={6} editable={false} onChange={x => !answered && setV({ ...v, [k]: x })} />
  );
  return (
    <div className="count-answer">
      <div className="rows">{row("p", "A. Phasen")}{row("e", "B. Elemente")}{row("c", "C. Verbindungen")}</div>
      {!answered && (
        <Button variant="primary" icon="check" className="check-btn"
          onClick={() => submit({ ok: v.p === task.answer.p && v.e === task.answer.e && v.c === task.answer.c, values: v })}>Prüfen</Button>
      )}
    </div>
  );
}

const pl = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const countText = (a: CountTask["answer"]) => `${pl(a.p, "Phase", "Phasen")} · ${pl(a.e, "Element", "Elemente")} · ${pl(a.c, "Verbindung", "Verbindungen")}`;

function Visual({ t }: { t: Task }) {
  const id = useId().replace(/:/g, "");
  return (
    <>
      {t.item && !t.beaker && !t.prompt.includes(t.item) && <p className="q-item">{t.item}</p>}
      {t.beaker && (
        <div className="q-beaker">
          {t.beaker.view === "particle"
            ? <svg className="bk" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Teilchenbild"><ParticleBeaker items={t.beaker.items} shaken={!!t.beaker.shaken} id={id} /></svg>
            : <BeakerPair items={t.beaker.items} shaken={!!t.beaker.shaken} id={id} />}
        </div>
      )}
    </>
  );
}

export function QuizView() {
  return (
    <QuizScreen<Task>
      stufe="rg"
      title="Quiz · Reinstoffe und Gemische"
      useQuiz={useQuiz}
      levels={LEVELS}
      levelName={l => levelName("rg", l)}
      levelId={l => levelId("rg", l)}
      typeName={id => TYPE_NAMES[id]}
      missName={id => MISS[id]}
      heroArt={<span className="hero-beaker" aria-hidden="true"><i className="a" /><i className="b" /></span>}
      renderVisual={t => ((t.item && !t.prompt.includes(t.item)) || t.beaker ? <Visual t={t} /> : null)}
      renderAnswer={(t, a, submit) =>
        t.kind === "map" ? <MapAnswer key={t.prompt + t.answer} task={t} answered={a} submit={submit} />
          : t.kind === "count" ? <CountAnswer key={JSON.stringify(t.beaker)} task={t} answered={a} submit={submit} />
            : null}
      solution={t => (t.kind === "map" ? NODE_NAMES[t.answer] : t.kind === "count" ? countText(t.answer) : null)}
      explain={(level, task) => explainFor(level, task)}
      tools={t => (t.type === "zustand" || t.kind === "map" ? [] : [
        { id: "map", label: "Übersicht", icon: "layers", wide: true, content: <ConceptMap hideStates={t.type === "typ"} /> },
      ])}
    />
  );
}
