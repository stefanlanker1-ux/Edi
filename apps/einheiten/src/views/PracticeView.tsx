// Üben – modular mit abnehmender Hilfe:
//   Unterstufe: ① mit Stellenwerttafel (die eingetippte Zahl erscheint live in der Tafel) → ② mit Pfeilen → ③ ohne Hilfe
//   Oberstufe:  ① mit Vorsilben-Skala → ② ohne Hilfe
// Pro Aufgabe zwei Versuche: nach dem ersten Fehler ein gezielter Tipp (und die Hilfe), nach dem zweiten die Lösung.

import { useEffect, useRef, useState } from "react";
import { Button, Card, Fit, Note, Segmented, buzz } from "@lern/ui";
import { parseQ, fmt } from "@lern/units";
import { useApp, type Stufe } from "../store.ts";
import { HELPS, TOPICS, topicsFor, makeRound, check, tipFor, resultOf, type Help, type PTask, type Topic } from "../practice.ts";
import { PracticeTable, PvLegend } from "../components/PlaceValueTable.tsx";
import { ArrowChain } from "../components/ArrowChain.tsx";
import { PowerScale } from "../components/PowerScale.tsx";

type Mark = "ok" | "retry" | "fail";
const MARK: Record<Mark, { sym: string; label: string }> = {
  ok: { sym: "✓", label: "richtig" }, retry: { sym: "↻", label: "im zweiten Versuch richtig" }, fail: { sym: "✗", label: "falsch" },
};

export function PracticeView() {
  const { stufe, practice, setPractice } = useApp();
  const os = stufe === "os";
  const set = practice[stufe];
  const topic = TOPICS.find(t => t.id === set.topic && t.os === os) ?? topicsFor(os)[0];
  const helps = HELPS[stufe];
  const help = helps.some(h => h.id === set.help) ? set.help : helps[0].id;
  return (
    <div className="pr-layout ui-screen">
      <div className="pr-settings">
        <label className="sel sel-qty">
          <select value={topic.id} aria-label="Thema" onChange={e => { buzz(); setPractice(stufe, { topic: e.target.value }); }}>
            {topicsFor(os).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <Segmented<Help> label="Hilfe" value={help} onChange={h => setPractice(stufe, { help: h })}
          options={helps.map((h, i) => ({ value: h.id, label: `${i + 1} · ${h.label}`, short: `${i + 1} ${h.short}` }))} />
      </div>
      <Session key={`${stufe}-${topic.id}-${help}`} stufe={stufe} topic={topic} help={help}
        onNext={() => { const i = helps.findIndex(h => h.id === help); if (i < helps.length - 1) setPractice(stufe, { help: helps[i + 1].id }); }} />
    </div>
  );
}

function Session({ stufe, topic, help, onNext }: { stufe: Stufe; topic: Topic; help: Help; onNext: () => void }) {
  const os = stufe === "os";
  const [round, setRound] = useState<PTask[]>(() => makeRound(topic));
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [tries, setTries] = useState(0);
  const [status, setStatus] = useState<"open" | Mark>("open");
  const [tip, setTip] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [marks, setMarks] = useState<Mark[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const t = round[idx];
  const done = marks.length === round.length;

  useEffect(() => { if (status === "open") input.current?.focus({ preventScroll: true }); else nextBtn.current?.focus({ preventScroll: true }); }, [status, idx]);

  const submit = () => {
    if (status !== "open") return;
    const ok = check(t, answer);
    if (ok === null) { setTip("Zahl mit Komma eingeben, z. B. 3,45."); return; }
    if (ok) { buzz(20); const m: Mark = tries ? "retry" : "ok"; setStatus(m); setMarks([...marks, m]); setTip(null); return; }
    buzz([40, 60, 40]);
    if (tries === 0) { setTries(1); setTip(tipFor(t, answer)); setShown(true); return; }
    setStatus("fail"); setMarks([...marks, "fail"]); setTip(null); setShown(true);
  };
  const next = () => {
    setIdx(idx + 1); setAnswer(""); setTries(0); setStatus("open"); setTip(null); setShown(false);
  };
  const restart = () => { setRound(makeRound(topic)); setIdx(0); setMarks([]); setAnswer(""); setTries(0); setStatus("open"); setTip(null); setShown(false); };

  if (done) {
    const first = marks.filter(m => m === "ok").length;
    const helps = HELPS[stufe];
    const nextHelp = helps[helps.findIndex(h => h.id === help) + 1];
    return (
      <Card className="pr-done" title="Geschafft!">
        <p className="pr-score"><b>{first}</b> / {round.length} ✓ im ersten Versuch</p>
        <Marks marks={marks} total={round.length} />
        {first >= round.length - 1 && nextHelp ? <Note tone="ok" icon="star">Stark! Weiter: <b>{nextHelp.label}</b></Note>
          : first <= round.length / 2 && help !== helps[0].id ? <Note tone="info">Noch einmal: <b>{helps[0].label}</b></Note>
          : null}
        <div className="btn-row">
          <Button variant="primary" icon="reset" onClick={restart}>Neue Runde</Button>
          {nextHelp && <Button icon="arrow" onClick={onNext}>{nextHelp.label}</Button>}
        </div>
      </Card>
    );
  }

  const res = resultOf(t);
  const v = parseQ(t.value)!;
  const reveal = status !== "open";
  const showHelp = help !== "none" || shown;
  const helpKind: Help = help === "none" ? (os ? "scale" : "table") : help;
  return (
    <Card className="pr-card">
      <div className="pr-top">
        <span className="pr-count">{idx + 1} / {round.length}</span>
        <Marks marks={marks} total={round.length} />
      </div>
      <form className={`pr-task-form${status === "open" ? "" : status === "fail" ? " bad" : " ok"}${tries && status === "open" ? " retry" : ""}`}
        onSubmit={e => { e.preventDefault(); if (status === "open") submit(); else next(); }}>
        <label className="pr-eq">
          <span className="pr-lhs">{t.value} {t.from} =</span>
          <input ref={input} value={answer} inputMode="decimal" autoComplete="off" spellCheck={false} placeholder="?" disabled={status !== "open"}
            aria-label={`Ergebnis in ${t.to}`} onChange={e => { setAnswer(e.target.value); }} />
          <span className="pr-unit">{t.to}</span>
          {status !== "open" && <b className="pr-mark" aria-label={MARK[status].label}>{status === "fail" ? "✗" : "✓"}</b>}
        </label>
        {status === "open"
          ? <Button type="submit" variant="primary" icon="check" className="pr-check">{tries ? "Nochmal prüfen" : "Prüfen"}</Button>
          : <Button type="submit" variant="primary" icon="arrow" className="pr-check" ref={nextBtn}>{idx + 1 < round.length ? "Weiter" : "Auswertung"}</Button>}
      </form>

      {tip && status === "open" && <Note tone="warn" icon="x">{tip}</Note>}
      {status === "ok" && <Note tone="ok" icon="check">{t.value} {t.from} = <b>{fmt(res).text} {t.to}</b></Note>}
      {status === "retry" && <Note tone="ok" icon="check">{t.value} {t.from} = <b>{fmt(res).text} {t.to}</b></Note>}
      {status === "fail" && <Note tone="bad" icon="x">Richtig: {t.value} {t.from} = <b>{fmt(res).text} {t.to}</b></Note>}

      {showHelp ? (
        <div className="pr-help"><Fit>
          {helpKind === "table" && topic.table && (
            <>
              <PracticeTable value={v} from={t.from} to={t.to} units={topic.table} answer={answer} reveal={status === "fail"} />
              <PvLegend />
            </>
          )}
          {helpKind === "arrows" && <ArrowChain from={t.from} to={t.to} value={v} showValues={reveal} />}
          {helpKind === "scale" && <PowerScale from={t.from} to={t.to} value={v} showResult={reveal} />}
          {reveal && helpKind === "table" && <ArrowChain from={t.from} to={t.to} value={v} />}
        </Fit></div>
      ) : (
        <Button variant="quiet" icon="bulb" onClick={() => setShown(true)} className="pr-show-help">Hilfe zeigen</Button>
      )}
    </Card>
  );
}

function Marks({ marks, total }: { marks: Mark[]; total: number }) {
  return (
    <ol className="pr-marks" aria-label={`${marks.length} von ${total} Aufgaben erledigt`}>
      {Array.from({ length: total }, (_, i) => {
        const m = marks[i];
        return <li key={i} className={m ?? "todo"} aria-label={m ? MARK[m].label : "offen"}>{m ? MARK[m].sym : ""}</li>;
      })}
    </ol>
  );
}
