// „Üben“ der Polymere auf Basis von @lern/quiz: sechs Kapitel, je Kapitel zuerst die Lektion (lessons.tsx), dann zehn Aufgaben.
// Aufgaben mit Bildern: Strukturformel, Kettenausschnitt, Mechanismus-Schritt mit Pfeilen, Kügelchen, Kettenbild;
// manche Antworten sind selbst Bilder (Monomer, Baustein).

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createQuizStore, diagnose, QuizScreen, type Answered, type Submit } from "@lern/quiz";
import { Button, RichText, buzz, uebenLabel } from "@lern/ui";
import { tr } from "@lern/i18n";
import { LEVELS, TYPE_NAMES, sameTask, buildResult, buildWrongAt, isBuild, isOrder, isTap, levelId, levelName, makeRound, type BuildItem, type BuildTask, type OrderTask, type TapTask, type Task } from "./tasks.ts";
import { tapFrame, tapResult } from "./tap.ts";
import { MechSvg } from "../components/MechSvg.tsx";
import { anchorPt, fitBox, noteBox, snapBox, still } from "../chem/scene.ts";
import type { Vis } from "./visual.tsx";
import { MISS } from "./misconceptions.ts";
import { explainFor } from "./explain.tsx";
import { LESSONS } from "../lessons.tsx";
import { VisView, beadsOf, visFormula } from "./visual.tsx";
import { BeadDot, BeadStrip } from "../components/Beads.tsx";

export const useQuiz = createQuizStore<Task>({ storageKey: "polymere-quiz", levelId, makeRound, fixedOrder: true, sameTask, missRecovery: true });


/** Bild der Antipp-Aufgabe; nach der Antwort bzw. im gelösten Beispiel ist die Lösung gestrichelt grün markiert */
function TapPic({ t, sel, solved, onPick }: { t: TapTask; sel: string[]; solved: boolean; onPick?: (id: string) => void }) {
  const frame = useMemo(() => tapFrame(t.scene), [t.scene]);
  // Seitenverhältnis des Bildplatzes (gemessen): der Ausschnitt füllt ihn ganz
  const [aspect, setAspect] = useState(0);
  const box = useMemo(() => {
    const ids = new Set(t.zoomTo ?? [...t.parts.flatMap(p => p.split("|")), ...(t.zoomWith ?? [])]);
    const at = frame.snap.atoms.filter(a => ids.has(a.id));
    const b = snapBox(frame.snap) ?? { x0: -3, y0: -2, x1: 3, y1: 2 };
    const m = 1.3;
    const p = !at.length ? b
      : t.zoom ? { x0: Math.min(...at.map(a => a.x)) - m, x1: Math.max(...at.map(a => a.x)) + m, y0: Math.min(...at.map(a => a.y)) - m, y1: Math.max(...at.map(a => a.y)) + m }
      : { x0: Math.min(b.x0, ...at.map(a => a.x - 0.5)), x1: Math.max(b.x1, ...at.map(a => a.x + 0.5)), y0: Math.min(b.y0, ...at.map(a => a.y - 0.5)), y1: Math.max(b.y1, ...at.map(a => a.y + 0.5)) };
    return fitBox(p, aspect || (p.x1 - p.x0 + 0.9) / (p.y1 - p.y0 + 0.9), 0, 0, 0.45);
  }, [frame, t.parts, t.zoom, t.zoomWith, t.zoomTo, aspect]);
  // Beschriftungen nur, wenn sie ganz im Ausschnitt liegen (sonst abgeschnitten, z. B. „iCl₃“)
  const base = still(frame.snap);
  const inBox = (q: { x0: number; x1: number; y0: number; y1: number }) => q.x0 >= box.x0 && q.x1 <= box.x1 && q.y0 >= box.y0 && q.y1 <= box.y1;
  const pose = { ...base, notes: base.notes.filter(n => inBox(noteBox(n))), arrows: frame.arrows.map(arrow => ({ arrow, op: 1 })) };
  // Lösung: einzeln/mehrere = `answer`; Paar: ein Beispiel (der erste Baustein) – oder die gewählten, wenn sie stimmen
  const right = t.mode === "pair" ? (tapResult(t, sel).ok ? sel : t.parts.slice(0, 2)) : t.mode === "any" ? (sel.length && t.answer.includes(sel[0]) ? sel : t.answer.slice(0, 1)) : t.answer.map(a => sel.find(p => p !== a && t.same?.[p] === a && !sel.includes(a)) ?? a);
  // vor der Antwort: alle antippbaren Teile dünn gepunktet umrandet (sichtbar, was tippbar ist), gewählte schwarz
  const marks = solved
    ? [...right.map(id => ({ id, kind: "ok" as const })), ...sel.filter(id => !right.includes(id)).map(id => ({ id, kind: "no" as const }))]
    // die freie Stelle hat ihre eigene Zeichnung (grau gefüllter Kreis) – kein gepunkteter Rahmen, sonst sähe sie aus wie die tippbaren Atome
    : [...(onPick ? t.parts.filter(id => !sel.includes(id) && !frame.snap.atoms.find(a => a.id === id)?.vac).map(id => ({ id, kind: "can" as const })) : []), ...sel.map(id => ({ id, kind: "sel" as const }))];
  // Trefferkreise mindestens 44 px Durchmesser (Bildmaßstab messen)
  const ref = useRef<HTMLDivElement>(null);
  const [hitR, setHitR] = useState(0.46);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const upd = () => { if (t.zoom && el.clientWidth && el.clientHeight) { const r = el.clientWidth / el.clientHeight; setAspect(x => (Math.abs(x - r) > 0.05 ? r : x)); } const svg = el.querySelector("svg"); if (!svg) return; const r = svg.getBoundingClientRect(); const ppu = Math.min(r.width / (box.x1 - box.x0), r.height / (box.y1 - box.y0)); if (ppu > 0) setHitR(Math.max(0.46, 22 / ppu)); };
    upd();
    const ro = new ResizeObserver(upd); ro.observe(el);
    return () => ro.disconnect();
  }, [box]);
  return (
    <div className="pm-tap-pic" ref={ref} data-min-h="90">
      <MechSvg pose={pose} box={box} label={t.prompt.replace(/\*\*/g, "")} halos={t.halos !== false} className="pm-tap-svg"
        onPick={onPick} pickable={t.parts} marks={marks} hitR={hitR} />
    </div>
  );
}

function TapAnswer({ t, answered, submit }: { t: TapTask; answered: Answered | null; submit: Submit }) {
  const [sel, setSel] = useState<string[]>([]);
  const [miss, setMiss] = useState(false);
  const multi = t.mode === "multi" || t.mode === "pair";
  const need = t.mode === "pair" ? 2 : t.mode === "multi" ? t.answer.length : 1;
  const pickPart = (id: string) => {
    if (answered) return;
    // daneben getippt: kurz sagen, was tippbar ist
    if (!t.parts.includes(id)) { setMiss(true); return; }
    setMiss(false);
    buzz();
    if (!multi) { setSel([id]); submit(tapResult(t, [id])); return; }
    setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  };
  return (
    <div className={`pm-tap${multi ? "" : " single"}${answered ? " done" : ""}`}>
      <TapPic t={t} sel={sel} solved={!!answered} onPick={pickPart} />
      {!answered && (multi || miss) && (
        <div className="pm-tap-bar" aria-live="polite">
          {miss ? <span className="pm-tap-note">{tr("Tippbar sind die gepunktet umrandeten Teile.", "Only the parts with a dotted outline can be tapped.")}</span>
            : <span className="pm-tap-note">{tr(`${sel.length} von ${need} gewählt`, `${sel.length} of ${need} chosen`)}</span>}
          {multi && <Button variant="primary" data-auto="last" disabled={!sel.length} onClick={() => { buzz(); submit(tapResult(t, sel)); }}>{tr("Prüfen", "Check")}</Button>}
        </div>
      )}
      {/* Tastatur und Vorlesen: dieselben Teile als Knöpfe */}
      <div className="sr-only">
        {t.parts.map((p, i) => <button key={p} type="button" {...(i < need ? { "data-auto": "" } : {})} aria-pressed={sel.includes(p)} onClick={() => pickPart(p)}>{t.labels[i]}</button>)}
      </div>
    </div>
  );
}


const BeadIcon = ({ it }: { it: BuildItem }) => (
  <svg className="pm-build-bead" viewBox="0 0 30 30" aria-hidden="true"><BeadDot cx={15} cy={15} r={13} hue={it.hue} letter={it.letter} /></svg>
);
/** Kette bauen: Kügelchen im Vorrat wählen (oder auf einen Platz ziehen), Platz antippen = setzen, gesetztes antippen = entfernen; „Prüfen“, wenn alle Plätze voll sind */
function BuildAnswer({ t, answered, submit, solved }: { t: BuildTask; answered: Answered | null; submit?: Submit; solved?: boolean }) {
  const [seq, setSeq] = useState<(string | null)[]>(() => Array(t.n).fill(null));
  // ein Kügelchen ist schon gewählt: Tippen auf einen Platz setzt es sofort
  const [cur, setCur] = useState<string>((t.pool.find(p => p.ok) ?? t.pool[0]).id);
  const [hint, setHint] = useState(false);
  const hinted = useRef(false);
  const done = !!answered || !!solved;
  const shown = solved && !answered ? t.example : seq;
  const item = (id: string | null) => t.pool.find(p => p.id === id);
  const full = seq.every(Boolean), count = seq.filter(Boolean).length;
  const wrongAt = answered && !answered.ok ? buildWrongAt(t, seq as string[]) : -1;
  useEffect(() => { if (!hint) return; const h = setTimeout(() => setHint(false), 3000); return () => clearTimeout(h); }, [hint]);
  const put = (i: number, id: string | null) => {
    if (done) return;
    buzz();
    if (!seq[i] && id && !hinted.current) { hinted.current = true; setHint(true); }
    setSeq(s => s.map((x, k) => (k !== i ? x : x && !id ? null : id)));
  };
  // Ziehen aus dem Vorrat auf einen Platz (Abkürzung); lange drücken füllt alle leeren Plätze
  const press = (id: string) => (e: React.PointerEvent) => {
    if (done || (e.pointerType === "mouse" && e.button !== 0)) return;
    setCur(id);
    let long = false;
    const timer = setTimeout(() => { long = true; buzz(); setSeq(s => s.map(x => x ?? id)); }, 650);
    const up = (ev: PointerEvent) => {
      clearTimeout(timer);
      window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      if (long) return;
      const el = (document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null)?.closest<HTMLElement>("[data-slot]");
      if (el && el.dataset.slot !== undefined && !seq[+el.dataset.slot]) put(+el.dataset.slot, id);
    };
    window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  };
  return (
    <div className={`pm-build${done ? " done" : ""}`}>
      <div className="pm-build-pool" role="group" aria-label={tr("Vorrat", "Store")}>
        {t.pool.map(it => (
          <button key={it.id} type="button" className={`pm-build-item${cur === it.id && !done ? " sel" : ""}`} aria-pressed={cur === it.id} disabled={done}
            onClick={() => { buzz(); setCur(it.id); }} onPointerDown={press(it.id)}>
            <BeadIcon it={it} />
            <span className="pm-build-txt"><b>{it.name}</b><span className="fx" style={{ "--n": it.struct.length } as CSSProperties}>{it.struct}</span></span>
          </button>
        ))}
      </div>
      {/* eine Kette: am Handy als Schlange (Plätze 5–8 laufen in der zweiten Zeile zurück, Strich von 4 nach 5) */}
      <div className="pm-build-chain" role="group" aria-label={tr(`Kette mit ${t.n} Plätzen`, `Chain with ${t.n} places`)}>
        {shown.map((id, i) => {
          const it = item(id);
          return (
            <button key={i} type="button" data-slot={i} data-auto="" className={`pm-build-slot${it ? " full" : ""}${i === wrongAt ? " wrong" : ""}`} disabled={done}
              onClick={() => put(i, seq[i] ? null : cur)}
              aria-label={`${tr("Platz", "Place")} ${i + 1}: ${it ? it.name : tr("leer", "empty")}`}>
              {it ? <BeadIcon it={it} /> : <span className="pm-build-empty" aria-hidden="true" />}
              {i === wrongAt && <span className="pm-build-x" aria-hidden="true">✗</span>}
            </button>
          );
        })}
      </div>
      {!done && (
        <div className="pm-tap-bar" aria-live="polite">
          <span className="pm-tap-note">{hint ? tr("Nochmal antippen = entfernen", "Tap again to remove") : <>{tr("Kügelchen wählen, dann Platz antippen (lange drücken = alle füllen)", "Pick a bead, then tap a place (long press = fill all)")} · <span className="nw">{count}&nbsp;/&nbsp;{t.n}</span></>}</span>
          <Button variant="primary" data-auto="last" disabled={!full} onClick={() => { buzz(); submit?.(buildResult(t, seq as string[])); }}>{tr("Prüfen", "Check")}</Button>
        </div>
      )}
    </div>
  );
}

const NUM = "①②③④";
/** Ordnen-Bild: Ausschnitt um die Elektronenpfeile (dort passiert der Schritt), ohne Lichthöfe – klein noch lesbar */
function OrderPic({ v }: { v: Vis }) {
  const pic = useMemo(() => {
    if (v.k !== "mech") return null;
    const f = tapFrame({ k: "mech", r: v.r, acts: v.acts, key: v.key });
    const pts = f.arrows.flatMap(a => [anchorPt(f.snap, a.from), anchorPt(f.snap, a.to)]).filter(p => !!p);
    const all = snapBox(f.snap) ?? { x0: -3, y0: -2, x1: 3, y1: 2 };
    // eng um die Pfeile (höchstens etwa zehn Atome): klein noch lesbar
    const b = pts.length ? { x0: Math.max(all.x0, Math.min(...pts.map(p => p.x)) - 1.15), x1: Math.min(all.x1, Math.max(...pts.map(p => p.x)) + 1.15),
      y0: Math.max(all.y0, Math.min(...pts.map(p => p.y)) - 1.15), y1: Math.min(all.y1, Math.max(...pts.map(p => p.y)) + 1.15) } : all;
    return { pose: { ...still(f.snap), arrows: f.arrows.map(arrow => ({ arrow, op: 1 })) }, box: fitBox(b, 1.15, 3.4, 3.0, 0.3) };
  }, [v]);
  if (!pic) return <VisView v={v} />;
  return <MechSvg pose={pic.pose} box={pic.box} label="" halos={false} className="pm-order-svg" />;
}
/** Ordnen: Bilder nacheinander antippen (Nummer erscheint), nochmal antippen nimmt die Nummer weg; ab vier Nummern „Prüfen“ */
function OrderAnswer({ t, answered, submit, solved }: { t: OrderTask; answered: Answered | null; submit?: Submit; solved?: boolean }) {
  const [seq, setSeq] = useState<number[]>([]);
  const done = !!answered || !!solved;
  const shown = solved && !answered ? t.correct : seq;
  const tap = (i: number) => {
    if (done) return;
    buzz();
    setSeq(s => (s.includes(i) ? s.slice(0, s.indexOf(i)) : [...s, i]));
  };
  const check = () => {
    const pos = (k: number) => seq.indexOf(t.correct[k]);
    const ok = t.correct.every((c, k) => seq[k] === c);
    submit?.({ ok, values: { startFirst: pos(0) === 0 ? 1 : 0, termLast: pos(3) === 3 ? 1 : 0, addsOk: pos(1) < pos(2) ? 1 : 0 } });
  };
  return (
    <div className={`pm-order${done ? " done" : ""}`}>
      {/* Mindesthöhe für die Prüfung im Browser (check-ui): die vier Bilder bleiben auch nach dem Prüfen lesbar */}
      <div className="pm-order-grid" data-min-h="230">
        {t.cards.map((v, i) => {
          const n = shown.indexOf(i), right = t.correct.indexOf(i);
          const st = done ? (n === right ? "ok" : "no") : n >= 0 ? "sel" : "";
          return (
            <button key={i} type="button" data-auto="" className={`pm-order-card ${st}`} onClick={() => tap(i)} disabled={done && !!answered}
              aria-label={done ? `${tr("Bild", "Picture")} ${"ABCD"[i]}: ${t.names[i]}` : `${tr("Bild", "Picture")} ${"ABCD"[i]}${n >= 0 ? `, ${tr("Platz", "position")} ${n + 1}` : ""}`}>
              <span className="pm-order-pic"><OrderPic v={v} /></span>
              {n >= 0 && <span className="pm-order-num" aria-hidden="true">{NUM[n]}</span>}
              {/* nach dem Prüfen: Marke und Name in einer Zeile unter der Zeichnung (verdeckt keine Atome) */}
              {done && <span className="pm-order-foot"><span className="pm-order-mark" aria-hidden="true">{st === "ok" ? "✓" : `${tr("richtig", "correct")}: ${NUM[right]}`}</span><span className="pm-order-name">{t.names[i]}</span></span>}
            </button>
          );
        })}
      </div>
      {done && answered && <p className="pm-order-legend">{tr("rote Zahl = deine Reihenfolge · richtig: ② = richtiger Platz", "red number = your order · correct: ② = right place")}</p>}
      {!done && (
        <div className="pm-tap-bar">
          <span className="pm-tap-note">{tr("Bilder der Reihe nach antippen", "Tap the pictures in order")}</span>
          <span className="pm-count">{seq.length}&nbsp;/&nbsp;4</span>
          <Button variant="primary" data-auto="last" disabled={seq.length < 4} onClick={() => { buzz(); check(); }}>{tr("Prüfen", "Check")}</Button>
        </div>
      )}
    </div>
  );
}

export function QuizView() {
  return (
    <QuizScreen<Task>
      stufe="us"
      title={`${uebenLabel()} · ${tr("Polymere", "Polymers")}`}
      useQuiz={useQuiz}
      levels={LEVELS}
      levelName={levelName}
      levelId={l => levelId("us", l)}
      typeName={id => TYPE_NAMES[id]}
      missName={id => MISS[id]}
      lesson={l => LESSONS[l]}
      heroArt={<span className="hero-pm" aria-hidden="true"><BeadStrip beads={beadsOf(["styrol", "styrol", "styrol", "butadien", "butadien", "butadien"])} active={null} /></span>}
      renderVisual={t => (isBuild(t) ? (t.stage === "worked" ? <BuildAnswer t={t} answered={null} solved /> : null) : isOrder(t) ? (t.stage === "worked" ? <OrderAnswer t={t} answered={null} solved /> : null) : isTap(t) ? (t.stage === "worked" ? <div className="q-pm q-pm-tap"><TapPic t={t} sel={[]} solved /></div> : null)
        : t.vis ? <div className={`q-pm q-pm-${t.vis.k}`}><VisView v={t.vis} /></div> : null)}
      renderOption={(t, o) => (!isTap(t) && !isOrder(t) && !isBuild(t) && t.pics?.[o] ? <span className={`pm-opt-pic${visFormula(t.pics[o]) ? " has-txt" : ""}`}><VisView v={t.pics[o]} opt />{visFormula(t.pics[o]) && <span className="pm-opt-txt" aria-hidden="true">{visFormula(t.pics[o])!.replace(/–(?=.)/g, "–\u200B")}</span>}<span className="sr-only">{o}</span></span> : o)}
      renderAnswer={(t, a, submit) => (isBuild(t) ? <BuildAnswer key={t.prompt + JSON.stringify(t.pool)} t={t} answered={a} submit={submit} /> : isOrder(t) ? <OrderAnswer key={JSON.stringify(t.cards)} t={t} answered={a} submit={submit} /> : isTap(t) ? <TapAnswer key={t.prompt + JSON.stringify(t.scene)} t={t} answered={a} submit={submit} /> : null)}
      // Ordnen: die richtigen Plätze stehen an den Bildern – keine eigene Lösungszeile
      solution={t => (isTap(t) || isBuild(t) ? t.sol : null)}
      feedbackExtra={(t, a) => (isTap(t) || isOrder(t) || isBuild(t) ? <>
        {!a.ok && diagnose(t, a)?.why && <p className="pm-sol-why"><RichText text={diagnose(t, a)!.why!} /></p>}
        {isOrder(t) && <ol className="pm-sol-order">{t.correct.map(i => <li key={i}>{t.names[i]}</li>)}</ol>}
        <p className="pm-sol-exp"><RichText text={t.explain} /></p>
      </> : null)}
      explain={(level, task) => explainFor(level, task)}
    />
  );
}
