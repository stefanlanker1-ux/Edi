// „Lernen“ der Polymere auf Basis von @lern/quiz: sechs Kapitel, je Kapitel zuerst die Lektion (lessons.tsx), dann zehn Aufgaben.
// Aufgaben mit Bildern: Strukturformel, Kettenausschnitt, Mechanismus-Schritt mit Pfeilen, Kügelchen, Kettenbild;
// manche Antworten sind selbst Bilder (Monomer, Baustein).

import { useMemo, useState } from "react";
import { createQuizStore, QuizScreen, type Answered, type Submit } from "@lern/quiz";
import { Button, buzz } from "@lern/ui";
import { tr } from "@lern/i18n";
import { LEVELS, TYPE_NAMES, isTap, levelId, levelName, makeRound, type TapTask, type Task } from "./tasks.ts";
import { tapFrame } from "./tap.ts";
import { MechSvg } from "../components/MechSvg.tsx";
import { fitBox, snapBox, still } from "../chem/scene.ts";
import { MISS } from "./misconceptions.ts";
import { explainFor } from "./explain.tsx";
import { LESSONS } from "../lessons.tsx";
import { VisView, beadsOf } from "./visual.tsx";
import { BeadStrip } from "../components/Beads.tsx";

export const useQuiz = createQuizStore<Task>({ storageKey: "polymere-quiz", levelId, makeRound, fixedOrder: true });

/** richtige Auswahl? einzeln: das Teil; mehrere: genau diese Menge; Paar: zwei benachbarte Teile */
function tapResult(t: TapTask, sel: string[]) {
  const idx = sel.map(p => t.parts.indexOf(p)).sort((a, b) => a - b);
  const adj = idx.length === 2 && idx[1] - idx[0] === 1 ? 1 : 0;
  const wrong = t.mode === "pair" ? -1 : idx.find(i => !t.answer.includes(t.parts[i])) ?? -1;
  const ok = t.mode === "pair" ? idx.length === 2 && adj === 1 : t.mode === "any" ? sel.length === 1 && t.answer.includes(sel[0]) : sel.length === t.answer.length && t.answer.every(a => sel.includes(a));
  const values: Record<string, number> = t.mode && t.mode !== "any" ? { n: sel.length, wrong, adj } : { pick: idx[0] };
  return { ok, values };
}

/** Bild der Antipp-Aufgabe; nach der Antwort bzw. im gelösten Beispiel ist die Lösung gestrichelt grün markiert */
function TapPic({ t, sel, solved, onPick }: { t: TapTask; sel: string[]; solved: boolean; onPick?: (id: string) => void }) {
  const frame = useMemo(() => tapFrame(t.scene), [t.scene]);
  const box = useMemo(() => {
    const at = frame.snap.atoms.filter(a => t.parts.includes(a.id));
    const b = snapBox(frame.snap) ?? { x0: -3, y0: -2, x1: 3, y1: 2 };
    const p = at.length ? { x0: Math.min(b.x0, ...at.map(a => a.x - 0.5)), x1: Math.max(b.x1, ...at.map(a => a.x + 0.5)), y0: Math.min(b.y0, ...at.map(a => a.y - 0.5)), y1: Math.max(b.y1, ...at.map(a => a.y + 0.5)) } : b;
    return fitBox(p, (p.x1 - p.x0 + 0.9) / (p.y1 - p.y0 + 0.9), 0, 0, 0.45);
  }, [frame, t.parts]);
  const pose = { ...still(frame.snap), arrows: frame.arrows.map(arrow => ({ arrow, op: 1 })) };
  // Lösung: einzeln/mehrere = `answer`; Paar: ein Beispiel (der erste Baustein) – oder die gewählten, wenn sie stimmen
  const right = t.mode === "pair" ? (tapResult(t, sel).ok ? sel : t.parts.slice(0, 2)) : t.mode === "any" ? (sel.length && t.answer.includes(sel[0]) ? sel : t.answer.slice(0, 1)) : t.answer;
  const marks = solved
    ? [...right.map(id => ({ id, kind: "ok" as const })), ...sel.filter(id => !right.includes(id)).map(id => ({ id, kind: "no" as const }))]
    : sel.map(id => ({ id, kind: "sel" as const }));
  return (
    <div className="pm-tap-pic">
      <MechSvg pose={pose} box={box} label={t.prompt.replace(/\*\*/g, "")} halos={t.halos !== false} className="pm-tap-svg"
        onPick={onPick} pickable={t.parts} marks={marks} />
    </div>
  );
}

function TapAnswer({ t, answered, submit }: { t: TapTask; answered: Answered | null; submit: Submit }) {
  const [sel, setSel] = useState<string[]>([]);
  const multi = t.mode === "multi" || t.mode === "pair";
  const pickPart = (id: string) => {
    if (answered || !t.parts.includes(id)) return;
    buzz();
    if (!multi) { setSel([id]); submit(tapResult(t, [id])); return; }
    setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  };
  return (
    <div className="pm-tap">
      <TapPic t={t} sel={sel} solved={!!answered} onPick={pickPart} />
      {multi && !answered && (
        <div className="pm-tap-bar">
          <Button variant="primary" disabled={!sel.length} onClick={() => { buzz(); submit(tapResult(t, sel)); }}>{tr("Prüfen", "Check")}</Button>
        </div>
      )}
      {/* Tastatur und Vorlesen: dieselben Teile als Knöpfe */}
      <div className="sr-only">
        {t.parts.map((p, i) => <button key={p} type="button" aria-pressed={sel.includes(p)} onClick={() => pickPart(p)}>{t.labels[i]}</button>)}
      </div>
    </div>
  );
}

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
      renderVisual={t => (isTap(t) ? (t.stage === "worked" ? <div className="q-pm q-pm-tap"><TapPic t={t} sel={[]} solved /></div> : null)
        : t.vis ? <div className={`q-pm q-pm-${t.vis.k}`}><VisView v={t.vis} /></div> : null)}
      renderOption={(t, o) => (!isTap(t) && t.pics?.[o] ? <span className="pm-opt-pic"><VisView v={t.pics[o]} opt /><span className="sr-only">{o}</span></span> : o)}
      renderAnswer={(t, a, submit) => (isTap(t) ? <TapAnswer key={t.prompt + JSON.stringify(t.scene)} t={t} answered={a} submit={submit} /> : null)}
      solution={t => (isTap(t) ? (t.mode === "pair" ? tr("zwei benachbarte C‑Atome", "two neighbouring C atoms") : t.answer.map(a => t.labels[t.parts.indexOf(a)]).join(", ")) : null)}
      explain={(level, task) => explainFor(level, task)}
    />
  );
}
