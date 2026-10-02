// Quiz der Benennung auf Basis von @lern/quiz: Bild = Strukturformel (Lewis oder Gerüst wie beim Zeichnen),
// Antworten Auswahl, Zahl oder Formeln (renderOption). Hilfsmittel: Stammnamen und Rangfolge der Gruppen –
// nicht bei Aufgaben, deren Lösung genau darin steht.

import { createQuizStore, NumberAnswer, QuizScreen } from "@lern/quiz";
import type { Mol } from "../chem/mol.ts";
import { MolSvg, type View } from "../components/MolSvg.tsx";
import { Segmented } from "@lern/ui";
import { Groups } from "../views/DrawView.tsx";
import { STEM } from "../chem/rings.ts";
import { useApp } from "../store.ts";
import { LEVELS, TYPE_NAMES, levelId, levelName, makeRound, type Task } from "./tasks.ts";
import { explainFor } from "./explain.tsx";
import { MISS } from "./misconceptions.ts";

export const useQuiz = createQuizStore<Task>({ storageKey: "organik-quiz", levelId, makeRound, fixedOrder: true });

/** Formel der Aufgabe (Lewis oder Gerüst wie beim Zeichnen); Antwort-Formeln als Gerüstformel, damit sie klein lesbar bleiben */
function QuizMol({ mol, small }: { mol: Mol; small?: boolean }) {
  const { view } = useApp();
  return <MolSvg mol={mol} view={small ? "skelett" : view} label="Strukturformel" minW={small ? 2.5 : 3} minH={small ? 1.8 : 2} className={small ? "opt" : "q"} />;
}

/** Hilfsmittel „Groß“: dieselbe Formel bildschirmfüllend, Lewis oder Gerüst */
function BigMol({ mol }: { mol: Mol }) {
  const { view, setView } = useApp();
  return (
    <div className="og-big">
      <Segmented<View> label="Darstellung" value={view} onChange={setView} options={[{ value: "lewis", label: "Lewis" }, { value: "skelett", label: "Gerüst" }]} />
      <MolSvg mol={mol} view={view} label="Strukturformel groß" minW={3} minH={2} />
    </div>
  );
}

function Stems() {
  return (
    <ul className="og-stems">
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => <li key={n}><b>{n}</b> {STEM[n].charAt(0).toUpperCase() + STEM[n].slice(1)}</li>)}
    </ul>
  );
}

/** Hilfsmittel „Regeln“: Stammnamen (nicht bei Fragen nach dem Stamm), Rangfolge der Gruppen (nicht bei Fragen nach Klasse, Endung, Rang) */
function rules(t: Task) {
  const stems = t.type !== "stamm", groups = !["klasse", "endung", "prio"].includes(t.type ?? "");
  if (!stems && !groups) return null;
  return (
    <div className="og-rules">
      {stems && <section><h3>Stämme</h3><Stems /></section>}
      {groups && <section><h3>Gruppen nach Rang</h3><Groups /></section>}
    </div>
  );
}

export function QuizView() {
  return (
    <QuizScreen<Task>
      stufe="us"
      title="Quiz · Nomenklatur"
      useQuiz={useQuiz}
      levels={LEVELS}
      levelName={levelName}
      levelId={l => levelId("us", l)}
      typeName={id => TYPE_NAMES[id]}
      missName={id => MISS[id]}
      heroArt={<svg viewBox="0 0 120 60" width="120" height="60" aria-hidden="true"><polyline points="10,40 35,22 60,40 85,22 110,40" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" /></svg>}
      renderVisual={t => (t.mol ? <div className="q-og"><QuizMol mol={t.mol} /></div> : null)}
      renderOption={(t, o) => (t.mols?.[o] ? <span className="og-opt"><QuizMol mol={t.mols[o]} small /><span className="sr-only">{o}</span></span> : o)}
      renderAnswer={(t, a, submit) => (t.kind === "num" ? <NumberAnswer key={t.prompt + JSON.stringify(t.mol?.bonds)} answer={t.answer} answered={a} submit={submit} max={30} /> : null)}
      solution={t => (t.kind === "num" ? String(t.answer) : null)}
      explain={(level, task) => explainFor(level, task)}
      tools={t => [
        ...(t.mol ? [{ id: "gross", label: "Groß", icon: "search" as const, content: <BigMol mol={t.mol} /> }] : []),
        ...(rules(t) ? [{ id: "regeln", label: "Regeln", icon: "table" as const, content: rules(t) }] : []),
      ]}
    />
  );
}
