// Antwortbereiche je Aufgabentyp. Eingaben sind lokal; das Ergebnis wird im Store gespeichert.

import { useState } from "react";
import { Button, Fit, Stepper, buzz } from "@lern/ui";
import { BY_Z, MADELUNG, SHELL_NAMES, shellSentence, hundBoxes, configuration, configString, standardNeutrons, signed } from "@lern/chem";
import { useApp } from "../store.ts";
import type { Answered, Submit } from "@lern/quiz";
import type { Task } from "./tasks.ts";
import { PeriodicTable } from "@lern/chem-ui";
import { EnergyDiagram, Bohr, Nuclide } from "@lern/chem-ui";
import { tr } from "@lern/i18n";

export function solutionText(t: Task): string {
  switch (t.kind) {
    case "mc": return t.options[t.answer];
    case "pse": return `${BY_Z[t.answer].name} (${BY_Z[t.answer].symbol})`;
    case "numbers": return t.fields.map(f => `${f.label}: ${f.select ? signed(f.answer) : f.answer}`).join(" · ");
    case "shells": return shellSentence(t.target);
    case "build": return tr(`${t.target.Z} ${t.target.Z === 1 ? "Proton" : "Protonen"}, ${t.target.N} ${t.target.N === 1 ? "Neutron" : "Neutronen"}, ${t.target.E} ${t.target.E === 1 ? "Elektron" : "Elektronen"}`,
      `${t.target.Z} ${t.target.Z === 1 ? "proton" : "protons"}, ${t.target.N} ${t.target.N === 1 ? "neutron" : "neutrons"}, ${t.target.E} ${t.target.E === 1 ? "electron" : "electrons"}`);
    case "boxes": return configString(configuration(t.Z));
  }
}

/** eigene Antwortformen; Multiple Choice stellt QuizScreen selbst dar (inkl. Vibration und Klang beim Antworten) */
export function AnswerArea({ task, answered, onAnswer: submit }: { task: Task; answered: Answered | null; onAnswer: Submit }) {
  switch (task.kind) {
    case "mc": return null;
    case "pse": return <PseAnswer task={task} answered={answered} submit={submit} />;
    case "numbers": return <NumbersAnswer task={task} answered={answered} submit={submit} />;
    case "shells": return <ShellsAnswer task={task} answered={answered} submit={submit} />;
    case "build": return <BuildAnswer task={task} answered={answered} submit={submit} />;
    case "boxes": return <BoxesAnswer task={task} answered={answered} submit={submit} />;
  }
}

type P<K extends Task["kind"]> = { task: Extract<Task, { kind: K }>; answered: Answered | null; submit: Submit };

function PseAnswer({ task, answered, submit }: P<"pse">) {
  const stufe = useApp(s => s.stufe);
  return (
    <div className="answer-fill pse-fit pse-z">
      <PeriodicTable fit stufe={stufe} names={false} disabled={!!answered} onPick={z => submit({ ok: z === task.answer, choice: z })}
        cellState={z => answered ? (z === task.answer ? "right" : z === answered.choice ? "wrong" : undefined) : undefined} />
    </div>
  );
}

function NumbersAnswer({ task, answered, submit }: P<"numbers">) {
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(task.fields.map(f => [f.id, f.select ? "0" : ""])));
  const shown = answered?.values ? Object.fromEntries(Object.entries(answered.values).map(([k, v]) => [k, String(v)])) : vals;
  const check = () => {
    const values = Object.fromEntries(task.fields.map(f => [f.id, Number(vals[f.id])]));
    submit({ ok: task.fields.every(f => vals[f.id] !== "" && values[f.id] === f.answer), values });
  };
  return (
    <form className="answer-form" onSubmit={e => { e.preventDefault(); if (!answered) check(); }}>
      <div className="num-grid">
        {task.fields.map(f => {
          const st = answered ? (Number(shown[f.id]) === f.answer && shown[f.id] !== "" ? " right" : " wrong") : "";
          return (
            <label key={f.id} className="num-field">
              <span>{f.label}{st && <b className={`mark${st}`} aria-label={st === " right" ? tr("richtig", "correct") : tr("falsch", "wrong")}>{st === " right" ? " ✓" : " ✗"}</b>}</span>
              {f.select
                ? <select className={st} value={shown[f.id]} disabled={!!answered} onChange={e => setVals({ ...vals, [f.id]: e.target.value })}>
                    {f.select.map(v => <option key={v} value={v}>{v === 0 ? "0 (neutral)" : signed(v)}</option>)}
                  </select>
                : <input className={st} type="number" inputMode="numeric" placeholder="?" value={shown[f.id]} disabled={!!answered}
                    onChange={e => setVals({ ...vals, [f.id]: e.target.value })} />}
            </label>
          );
        })}
      </div>
      {!answered && <Button variant="primary" icon="check" type="submit" className="check-btn">{tr("Prüfen", "Check")}</Button>}
    </form>
  );
}

function ShellsAnswer({ task, answered, submit }: P<"shells">) {
  const [counts, setCounts] = useState<number[]>(() => new Array(task.shellCount).fill(0));
  // nach dem Prüfen die eigene Eingabe auf allen Schalen zeigen (auch ein Elektron auf einer Schale zu viel)
  const shown = answered?.values ? Array.from({ length: task.shellCount }, (_, i) => answered.values![`s${i}`] ?? 0) : counts;
  const Z = task.target.reduce((a, b) => a + b, 0);
  const check = () => submit({
    ok: counts.every((c, i) => c === (task.target[i] ?? 0)),
    values: Object.fromEntries(counts.map((c, i) => [`s${i}`, c])),
  });
  return (
    <div className="answer-build">
      {/* Rahmen für alle Schalen der Aufgabe (alle Ringe stehen von Anfang an da): der Maßstab bleibt beim Füllen gleich */}
      <div className="ab-atom-box"><div className="ab-atom"><Bohr Z={Z} N={standardNeutrons(Z)} E={0} shellCounts={shown} slots={task.shellCount} labels /></div></div>
      <div className="ab-controls">
        {shown.map((c, i) => (
          <Stepper key={i} stack label={tr(`${SHELL_NAMES[i]}-Schale`, `${SHELL_NAMES[i]} shell`)} value={c} min={0} max={32}
            onChange={v => { if (!answered) { buzz(); setCounts(counts.map((x, k) => (k === i ? v : x))); } }} />
        ))}
        {!answered && <Button variant="primary" icon="check" onClick={check} className="check-btn">{tr("Prüfen", "Check")}</Button>}
      </div>
    </div>
  );
}

function BuildAnswer({ task, answered, submit }: P<"build">) {
  const [b, setB] = useState({ Z: 0, N: 0, E: 0 });
  const shown = answered?.values ? { Z: answered.values.Z, N: answered.values.N, E: answered.values.E } : b;
  const set = (k: "Z" | "N" | "E", v: number) => { if (!answered) { buzz(); setB({ ...b, [k]: v }); } };
  const check = () => submit({ ok: b.Z === task.target.Z && b.N === task.target.N && b.E === task.target.E, values: b });
  return (
    <div className="answer-build">
      <div className="ab-atom-box"><div className="ab-atom">
        <Bohr Z={shown.Z} N={shown.N} E={shown.E} slots={4} labels={false} />
        {/* erst nach dem Prüfen zeigen, was gebaut wurde – vorher verriete die Anzeige die Lösung */}
        {answered && BY_Z[shown.Z] && <div className="ab-nuc"><Nuclide Z={shown.Z} N={shown.N} E={shown.E} size="sm" /></div>}
      </div></div>
      <div className="ab-controls">
        <Stepper stack tone="proton" label={tr("Protonen", "Protons")} value={shown.Z} max={30} onChange={v => set("Z", v)} />
        <Stepper stack tone="neutron" label={tr("Neutronen", "Neutrons")} value={shown.N} max={40} onChange={v => set("N", v)} />
        {/* höchstens 36 Elektronen (bis 4p): nie mehr als 4 Schalen – der Rahmen mit 4 Schalenplätzen behält seinen Maßstab */}
        <Stepper stack tone="electron" label={tr("Elektronen", "Electrons")} value={shown.E} max={36} onChange={v => set("E", v)} />
        {!answered && <Button variant="primary" icon="check" onClick={check} className="check-btn">{tr("Prüfen", "Check")}</Button>}
      </div>
    </div>
  );
}

function BoxesAnswer({ task, answered, submit }: P<"boxes">) {
  const empty = () => Object.fromEntries(MADELUNG.slice(0, task.lastIndex + 1).map(o => [o.key, new Array<number>(2 * o.l + 1).fill(0)]));
  const [boxes, setBoxes] = useState<Record<string, number[]>>(empty);
  const shown = answered?.values ? unflatten(answered.values, empty()) : boxes;
  const n = Object.values(shown).flat().reduce((a, c) => a + c, 0);
  const onBox = answered ? undefined : (key: string, i: number) => {
    buzz();
    setBoxes({ ...boxes, [key]: boxes[key].map((v, k) => (k === i ? (v + 1) % 3 : v)) });
  };
  const check = () => {
    // Richtig: jede Unterschale hat die richtige Elektronenzahl und ist nach Hund besetzt (Reihenfolge egal)
    const counts = Object.fromEntries(configuration(task.Z).map(o => [o.key, o.count]));
    const ok = Object.entries(boxes).every(([key, arr]) => {
      const l = MADELUNG.find(o => o.key === key)!.l;
      return arr.slice().sort().join() === hundBoxes(l, counts[key] ?? 0).slice().sort().join();
    });
    submit({ ok, values: flatten(boxes) });
  };
  return (
    <div className="answer-boxes">
      <div className="answer-fill"><Fit><EnergyDiagram cfg={[]} boxes={shown} lastIndex={task.lastIndex} onBox={onBox} /></Fit></div>
      <div className="box-foot">
        <span>{tr("Eingetragen", "Entered")}: <b>{n}</b> {tr("von", "of")} {task.Z} {tr("Elektronen", "electrons")}</span>
        {!answered && <Button variant="primary" icon="check" onClick={check}>{tr("Prüfen", "Check")}</Button>}
      </div>
    </div>
  );
}

const flatten = (b: Record<string, number[]>) => Object.fromEntries(Object.entries(b).flatMap(([k, arr]) => arr.map((v, i) => [`${k}:${i}`, v])));
function unflatten(values: Record<string, number>, base: Record<string, number[]>) {
  for (const [k, v] of Object.entries(values)) { const [key, i] = k.split(":"); if (base[key]) base[key][Number(i)] = v; }
  return base;
}
