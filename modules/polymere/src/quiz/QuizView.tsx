// „Lernen“ der Polymere auf Basis von @lern/quiz: sechs Kapitel, je Kapitel zuerst die Lektion (lessons.tsx), dann zehn Aufgaben.
// Aufgaben mit Bildern: Strukturformel, Kettenausschnitt, Mechanismus-Schritt mit Pfeilen, Kügelchen, Kettenbild;
// manche Antworten sind selbst Bilder (Monomer, Baustein).

import { createQuizStore, QuizScreen } from "@lern/quiz";
import { tr } from "@lern/i18n";
import { LEVELS, TYPE_NAMES, levelId, levelName, makeRound, type Task } from "./tasks.ts";
import { MISS } from "./misconceptions.ts";
import { explainFor } from "./explain.tsx";
import { LESSONS } from "../lessons.tsx";
import { VisView, beadsOf } from "./visual.tsx";
import { BeadStrip } from "../components/Beads.tsx";

export const useQuiz = createQuizStore<Task>({ storageKey: "polymere-quiz", levelId, makeRound, fixedOrder: true });

export function QuizView() {
  return (
    <QuizScreen<Task>
      stufe="us"
      title={tr("Lernen · Polymere", "Learn · Polymers")}
      useQuiz={useQuiz}
      levels={LEVELS}
      levelName={levelName}
      levelId={l => levelId("us", l)}
      typeName={id => TYPE_NAMES[id]}
      missName={id => MISS[id]}
      lesson={l => LESSONS[l]}
      heroArt={<span className="hero-pm" aria-hidden="true"><BeadStrip beads={beadsOf(["styrol", "styrol", "styrol", "butadien", "butadien", "butadien"])} active={null} /></span>}
      renderVisual={t => (t.vis ? <div className={`q-pm q-pm-${t.vis.k}`}><VisView v={t.vis} /></div> : null)}
      renderOption={(t, o) => (t.pics?.[o] ? <span className="pm-opt-pic"><VisView v={t.pics[o]} /><span className="sr-only">{o}</span></span> : o)}
      explain={(level, task) => explainFor(level, task)}
    />
  );
}
