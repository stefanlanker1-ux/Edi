// Quiz des Atombaus auf dem gemeinsamen Grundgerüst: Levelauswahl → Aufgaben → Auswertung.
// Eigene Aufgabenformen (PSE tippen, Zahlen, Schalen, Kästchen, Atom bauen) kommen aus answers.tsx.

import { QuizScreen, type QuizTool } from "@lern/quiz";
import { elementsIn } from "@lern/chem";
import { Bohr, Nuclide, pseTool } from "@lern/chem-ui";
import { useApp } from "../store.ts";
import { useQuiz } from "./store.ts";
import { LEVELS, TYPES, levelId, levelName, type Stufe, type Task } from "./tasks.ts";
import { AnswerArea, solutionText } from "./answers.tsx";
import { ExplainCard, explainLevelId } from "./explain.tsx";
import { MISS } from "./misconceptions.ts";

/** Aufgaben zu Elektronen in s-, p-, d-, f-Orbitalen: PSE nach Blöcken gefärbt (nicht bei „In welchem Block?“ – dort wäre es die Lösung) */
const BLOCK_TYPES = ["config", "short", "boxes", "unpaired", "ionConfig", "isoelectronic", "fromConfig", "periodGroup"];

/** Hilfsmittel: Periodensystem (Angaben wie auf einem gedruckten PSE), Elemente aus der Aufgabe markiert (nicht bei „Finde im PSE“) */
function toolsFor(t: Task, stufe: Stufe): QuizTool[] {
  if (t.kind === "pse") return [];
  const mark = elementsIn(t.prompt);
  if (t.kind === "build") mark.push(t.target.Z);
  // sichtbares Atomsymbol (nicht bei Lückentext und nicht beim Bohrmodell „Welches Element ist das?“)
  if (t.visual?.kind === "nuclide" && !t.visual.blank) mark.push(t.visual.Z);
  return [pseTool({ stufe, mark, blocks: stufe === "os" && BLOCK_TYPES.includes(t.type ?? "") })];
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
      typeName={id => TYPES[stufe][id]?.name}
      missName={id => MISS[id]}
      heroArt={<Bohr Z={stufe === "us" ? 8 : 26} N={8} E={stufe === "us" ? 8 : 26} labels={false} />}
      renderVisual={t => t.visual
        ? (t.visual.kind === "nuclide"
          ? <Nuclide Z={t.visual.Z} N={t.visual.N} E={t.visual.E} size="xl" blank={t.visual.blank} />
          : <div className="q-bohr"><Bohr Z={t.visual.Z} N={t.visual.N} E={t.visual.E} labels={t.visual.labels} counts={false} /></div>)
        : null}
      renderAnswer={(t, a, submit) => <AnswerArea key={t.prompt} task={t} answered={a} onAnswer={submit} />}
      solution={t => (t.kind === "mc" ? null : solutionText(t))}
      tools={t => toolsFor(t, stufe)}
      explain={(level, task) => <ExplainCard id={explainLevelId(stufe, level, task?.type)} />}
    />
  );
}
