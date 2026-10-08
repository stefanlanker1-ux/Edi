// „Üben“ der Gemische auf Basis von @lern/quiz: sechs Kapitel, je Kapitel zuerst die Lektion (lessons.tsx), dann zehn Aufgaben.
// Aufgaben mit Bildern statt Texteingabe: Teilchenbild, Teilchenbilder als Antworten, Teilchen oder Teile eines Verfahrens antippen,
// Verfahren als Bildkarten, Animation des Verfahrens. Hilfsmittel „Farben“: alle Atomfarben (verrät nicht, welche vorkommen).

import { useId } from "react";
import { createQuizStore, QuizScreen, type Answered, type Submit } from "@lern/quiz";
import { buzz, uebenLabel } from "@lern/ui";
import { Beaker } from "../components/Beaker.tsx";
import { MixPic, SepAnim, SepScene, METHODS, METHOD_NAME } from "../components/Separation.tsx";
import { MiniParticle, Legend } from "../views/MixView.tsx";
import { initial, seedOf } from "../mixing.ts";
import { nameOf } from "../mixtures.ts";
import { LEVELS, TYPE_NAMES, describe, levelId, levelName, makeRound, type Pic, type Task } from "./tasks.ts";
import { PART_NAME } from "./trennen.ts";
import { explainFor } from "./explain.tsx";
import { LESSONS } from "../lessons.tsx";
import { MISS } from "./misconceptions.ts";
import { tr } from "@lern/i18n";
import { toSubscript } from "@lern/chem";

export const useQuiz = createQuizStore<Task>({ storageKey: "gemische-quiz", levelId, makeRound, fixedOrder: true });

/** alle Atomsorten, die im Quiz vorkommen */
export const QUIZ_ATOMS = ["H", "C", "N", "O", "S", "He", "Ne", "Ar", "Cu", "Zn", "Fe", "Al"];

const picLabel = (p: Pic) => `${tr("Teilchenbild", "Particle picture")}: ${p.mix.map(([f, n]) => `${n} × ${nameOf(f)}`).join(", ")}`;

/** Teilchenbild einer Aufgabe – gleiche Anordnung auch nach dem Neuladen; mit `onPick` sind die Teilchen antippbar */
export function PicBeaker({ p, className, onPick }: { p: Pic; className?: string; onPick?: (f: string) => void }) {
  const sim = initial({ items: p.mix, state: p.state, floats: p.floats, before: p.before, solute: p.solute }, seedOf(JSON.stringify(p)), p.arrange ?? "nachher");
  return <Beaker sim={sim} className={className} label={picLabel(p)} onPick={onPick} />;
}

const MIX_LABEL = () => tr("Gemisch vor dem Trennen", "Mixture before separating");
const methodOf = (name: string) => METHODS.find(m => METHOD_NAME(m) === name);
const partName = (t: Task, part: string) => (t.sep ? PART_NAME[part]?.() ?? part : `${nameOf(part)} (${toSubscript(part)})`);

/** Teil im Bild antippen: Teilchen im Teilchenbild bzw. Teil eines Trennverfahrens; danach ist die Lösung markiert */
function TapAnswer({ t, answered, submit }: { t: Extract<Task, { kind: "tap" }>; answered: Answered | null; submit: Submit }) {
  const id = "tap" + useId().replace(/:/g, "");
  const choose = (part: string) => {
    if (answered) return;
    const i = t.parts.indexOf(part);
    if (i < 0) return;
    buzz();
    submit({ ok: part === t.answer, values: { pick: i } });
  };
  return (
    <div className={`gm-tap${answered ? " done" : ""}`} id={id}>
      {answered && !t.sep && <style>{`#${id} [data-f="${t.answer}"] { outline: 2px dashed var(--ok); outline-offset: 2px; } #${id} [data-f="${t.answer}"] * { stroke: var(--ok); }`}</style>}
      <div className="gm-tap-pic">
        {t.sep ? <SepScene m={t.sep.m} t={t.sep.t} onPick={choose} parts={t.parts} mark={answered ? t.answer : undefined} /> : t.pic ? <PicBeaker p={t.pic} onPick={choose} /> : null}
      </div>
      <div className="sr-only">
        {t.parts.map(p => <button key={p} type="button" onClick={() => choose(p)}>{partName(t, p)}</button>)}
      </div>
    </div>
  );
}

export function QuizView() {
  return (
    <QuizScreen<Task>
      stufe="us"
      title={`${uebenLabel()} · ${tr("Gemische", "Mixtures")}`}
      useQuiz={useQuiz}
      levels={LEVELS}
      levelName={levelName}
      levelId={l => levelId("us", l)}
      typeName={id => TYPE_NAMES[id]}
      missName={id => MISS[id]}
      lesson={l => LESSONS[l]}
      heroArt={<span className="hero-gm" aria-hidden="true"><MiniParticle f="H2O" size={46} /><MiniParticle f="CO2" size={46} /><MiniParticle f="He" size={30} /></span>}
      renderVisual={t => (t.kind === "tap" ? null
        : t.sep ? <div className="q-gm q-sep">{t.sep.t < 0 ? <SepAnim m={t.sep.m} /> : <SepScene m={t.sep.m} t={t.sep.t} />}</div>
        : t.mixPic ? <div className={`q-gm q-sep${t.type === "trennReihe" ? " q-reihe" : ""}`}><MixPic k={t.mixPic} label={MIX_LABEL()} /></div>
        : t.pic ? <div className="q-gm"><PicBeaker p={t.pic} /></div> : null)}
      renderOption={(t, o) => {
        // höchstens drei Bilder (Nach dem Mischen): untereinander und größer – Gitterbilder sind breit und flach
        if (t.pics?.[o]) return <span className={`gm-pic${Object.keys(t.pics).length <= 3 ? " few" : ""}`}><PicBeaker p={t.pics[o]} /><span className="sr-only">{describe(t.pics[o])}</span></span>;
        const m = t.methods ? methodOf(o) : undefined;
        if (m) return <span className="gm-pic gm-method"><SepScene m={m} t={.55} label={o} /><span>{o}</span></span>;
        // reiner Text: McAnswer misst daran, ob ein Wort in seine Spalte passt (sonst einspaltig statt „Gasgemisc|h“)
        return o;
      }}
      renderAnswer={(t, a, submit) => (t.kind === "tap" ? <TapAnswer key={t.prompt + t.parts.join()} t={t} answered={a} submit={submit} /> : null)}
      solution={t => (t.kind === "tap" ? partName(t, t.answer) : t.kind === "num" ? String(t.answer) : null)}
      explain={(level, task) => explainFor(level, task)}
      tools={t => (t.pic || t.pics ? [{ id: "farben", label: tr("Farben", "Colours"), icon: "atom" as const, content: <Legend els={QUIZ_ATOMS} /> }] : [])}
    />
  );
}
