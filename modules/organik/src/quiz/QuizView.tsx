// Quiz der Benennung auf Basis von @lern/quiz: Bild = Strukturformel (Lewis oder Gerüst wie beim Zeichnen),
// Antworten Auswahl, Zahl oder Formeln (renderOption). Hilfsmittel: Stammnamen und Rangfolge der Gruppen –
// nicht bei Aufgaben, deren Lösung genau darin steht.

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createQuizStore, NumberAnswer, QuizScreen } from "@lern/quiz";
import type { Mol } from "../chem/mol.ts";
import { orient } from "../chem/layout.ts";
import { MolSvg, viewBoxOf, type View } from "../components/MolSvg.tsx";
import { Segmented, tr, uebenLabel } from "@lern/ui";
import { Groups } from "../views/DrawView.tsx";
import { STEM } from "../chem/rings.ts";
import { useApp } from "../store.ts";
import { LEVELS, TYPE_NAMES, levelId, levelName, makeRound, type Task } from "./tasks.ts";
import { explainFor } from "./explain.tsx";
import { MISS } from "./misconceptions.ts";

export const useQuiz = createQuizStore<Task>({ storageKey: "organik-quiz", levelId, makeRound, fixedOrder: true });

/** Formel der Aufgabe (Lewis oder Gerüst wie beim Zeichnen); Antwort-Formeln als Gerüstformel, gedreht für die etwa quadratischen
 *  Zellen (2 × 2), damit sie klein lesbar bleiben */
function QuizMol({ mol, small }: { mol: Mol; small?: boolean }) {
  const { view } = useApp();
  const m = useMemo(() => (small ? orient(mol, 1.2) : mol), [mol, small]);
  // Atome mindestens ATOM_PX hoch: wird die Formel klein gezeichnet, wachsen Beschriftung und Striche im Verhältnis zur Bindung (höchstens 1,8-fach)
  const svg = useRef<SVGSVGElement>(null);
  const [k, setK] = useState(1);
  useLayoutEffect(() => {
    const el = svg.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // der Rand des Bilds wächst mit der Beschriftung (viewBoxOf): kleinstes k, bei dem die Schrift ATOM_PX erreicht, sonst das beste bis 1,8
      let best = 1, bestPx = 0;
      for (let k = 1; k <= 1.8 + 1e-9; k += 0.05) {
        const vb = viewBoxOf(m, small ? "skelett" : view, small ? 2.5 : 3, small ? 1.8 : 2, k);
        const px = Math.min(r.width / vb[2], r.height / vb[3]) * 22 * k;
        if (px > bestPx + 0.05) { best = k; bestPx = px; }
        if (px >= ATOM_PX) break;
      }
      setK(Math.round(best * 20) / 20);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [m, small, view]);
  return <MolSvg mol={m} view={small ? "skelett" : view} label={tr("Strukturformel", "Structural formula")} minW={small ? 2.5 : 3} minH={small ? 1.8 : 2} className={small ? "opt" : "q"} labelScale={k} svgRef={svg} />;
}
/** kleinste Höhe der Atom-Beschriftung (px) in Aufgabenbild und Antwortformeln */
const ATOM_PX = 13;

/** Hilfsmittel „Groß“: dieselbe Formel bildschirmfüllend, Lewis oder Gerüst */
function BigMol({ mol }: { mol: Mol }) {
  const { view, setView } = useApp();
  return (
    <div className="og-big">
      <Segmented<View> label={tr("Darstellung", "View")} value={view} onChange={setView} options={[{ value: "lewis", label: "Lewis" }, { value: "skelett", label: tr("Gerüst", "Skeletal") }]} />
      <MolSvg mol={mol} view={view} label={tr("Strukturformel groß", "Structural formula, large")} minW={3} minH={2} />
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
      {stems && <section><h3>{tr("Stämme", "Stems")}</h3><Stems /></section>}
      {groups && <section><h3>{tr("Gruppen nach Rang", "Groups by rank")}</h3><Groups /></section>}
    </div>
  );
}

export function QuizView() {
  return (
    <QuizScreen<Task>
      stufe="us"
      title={`${uebenLabel()} · ${tr("Nomenklatur", "Nomenclature")}`}
      useQuiz={useQuiz}
      levels={LEVELS}
      levelName={levelName}
      levelId={l => levelId("us", l)}
      typeName={id => TYPE_NAMES[id]}
      missName={id => MISS[id]}
      heroArt={<svg viewBox="0 0 120 60" width="120" height="60" aria-hidden="true"><polyline points="10,40 35,22 60,40 85,22 110,40" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" /></svg>}
      // data-min-h: wird ein Bild kleiner, stehen Tipp und erster Schritt in einem Blatt (Formel bleibt lesbar)
      renderVisual={t => (t.mol ? <div className="q-og" data-min-h="56"><QuizMol mol={t.mol} /></div> : null)}
      renderOption={(t, o) => (t.mols?.[o] ? <span className="og-opt" data-min-h="72"><QuizMol mol={t.mols[o]} small /></span> : o)}
      // Strukturformel als Antwort: der Antworttext ist der Name (= die Lösung) – vorgelesen wird nur „Antwort A“
      optionLabel={(t, o) => (t.mols?.[o] ? "" : undefined)}
      renderAnswer={(t, a, submit) => (t.kind === "num" ? <NumberAnswer key={t.prompt + JSON.stringify(t.mol?.bonds)} answer={t.answer} answered={a} submit={submit} max={30} /> : null)}
      solution={t => (t.kind === "num" ? String(t.answer) : null)}
      explain={(level, task) => explainFor(level, task)}
      tools={t => [
        ...(t.mol ? [{ id: "gross", label: tr("Groß", "Large"), icon: "search" as const, content: <BigMol mol={t.mol} /> }] : []),
        ...(rules(t) ? [{ id: "regeln", label: tr("Regeln", "Rules"), icon: "table" as const, content: rules(t) }] : []),
      ]}
    />
  );
}
