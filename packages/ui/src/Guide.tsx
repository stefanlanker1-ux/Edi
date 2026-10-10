// Geführte Erklärung je App („Erklärung“ links in der Kopfzeile): kleine Schritte, jeder verlangt eine Handlung –
// eine Auswahl antippen, eine Zahl eintippen oder etwas im Bild antippen (mit den Bausteinen der App).
// Vier Fehlversuche → die Lösung wird markiert, der Schüler tippt sie selbst an. Richtig → der Schritt bleibt mit
// der Bestätigung (und Beschriftungen nach der Lösung) stehen, weiter mit „Weiter“ – Zeit zum Lesen und Anschauen.
// Ganzer Bildschirm, nie scrollen: Bild füllt den Platz (container-type: size, Zeichnungen mit cqw/cqh oder Fit).
// Längere Erklärungen in Kapiteln (`part`): Kapitelname im Kopf, Fortschrittsbalken in Abschnitten.
// Lernen an Beispielen mit Ausblenden der Hilfe: jedes Kapitel beginnt mit einem vorgemachten Fall (Lösungsweg Zeile für Zeile),
// dann ein halb gelöster (eine Lücke im Lösungsweg) und dann selbst lösen – und wieder von vorn mit dem nächsten Gedanken.

import { num, readNumber, tr } from "./i18n.ts";
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Button, IconButton } from "./components.tsx";
import { Icon } from "./icons.tsx";
import { RichText } from "./RichText.tsx";
import { NoTerms, TermScope, type TermDef } from "./Terms.tsx";
import { Sheet } from "./Sheet.tsx";
import type { IconName } from "./icons.tsx";
import { ding } from "./feedback.ts";
import { buzz, useBackClose } from "./hooks.ts";
import { Callouts, type Callout } from "./Callouts.tsx";

/** Was ein Bild bekommt: `pick` meldet ein angetipptes Ziel, `show` = Lösung markieren, `solved` = schon richtig */
export interface GuideCtx { pick: (id: string) => void; show: boolean; solved: boolean }

/** vorgemacht = Lösungsweg wird gezeigt; halb gelöst = eine Lücke im Lösungsweg; frei = selbst lösen */
export type GuideMode = "worked" | "faded" | "free";

export interface GuideStep {
  /** Art des Schritts: Kapitel beginnen vorgemacht, dann halb gelöst, dann frei */
  mode: GuideMode;
  /** Lösungsweg Zeile für Zeile: vorgemacht = wird gezeigt; halb gelöst = genau eine Zeile mit der Lücke `{?}`;
   *  frei = erscheint nach der richtigen Antwort */
  lines?: string[];
  /** neue Idee in ein, zwei kurzen Sätzen (`**fett**`) */
  say?: string;
  /** Auftrag: was jetzt anzutippen oder einzutippen ist */
  ask: string;
  /** richtige Antwort: Text einer Auswahl, Zahl oder Kennung eines Ziels im Bild (nicht bei vorgemachten Schritten) */
  answer?: string | number;
  /** Auswahl-Knöpfe unter dem Auftrag */
  options?: string[];
  /** Zahl eintippen (mit Einheit hinter dem Feld) */
  num?: { unit?: string };
  /** Bild des Schritts – ruft `pick(id)` beim Antippen eines Ziels (dann ohne `options`/`num`) */
  visual?: (c: GuideCtx) => ReactNode;
  /** Begriffe mit Pfeil auf Teile des Bildes (Kern, Elektron, bindendes Paar …) – nie die gesuchte Antwort,
   *  außer mit `afterSolved` */
  labels?: Callout[];
  /** Rückmeldung zu bestimmten falschen Antworten (Schlüssel = Auswahltext, Zahl oder Ziel) */
  why?: Record<string, string>;
  /** Denkanstoß zum Vorgehen, ohne die Lösung zu nennen: bei falschen Antworten ohne eigene Rückmeldung,
   *  ab dem zweiten Fehlversuch zusätzlich zur Rückmeldung */
  tip?: string;
  /** Bestätigung nach der richtigen Antwort */
  ok: string;
  /** Hinweis, wenn nach vier Versuchen die Lösung markiert wird */
  show?: string;
  /** Kapitel beginnt mit diesem Schritt (Name im Kopf der Erklärung) */
  part?: string;
}

export interface GuideDef {
  title: string;
  /** Begriffe, die schon bekannt sind (Alltag oder frühere Apps) – alle anderen Fachwörter müssen fett eingeführt werden */
  known?: string[];
  steps: GuideStep[];
  /** Zusammenfassung am Ende: das kannst du jetzt */
  outro: string[];
  /** Begriffe (z. B. Stoffnamen), im Text antippbar – Blatt „Was ist das?“ (Terms.tsx); Antwortknöpfe bleiben ohne */
  terms?: TermDef[];
}

/** Hilfsmittel unter dem Text (z. B. PSE, Tipp, Erklärung) – öffnet ein Blatt über der Erklärung */
export interface GuideTool { id: string; label: string; icon: IconName; title?: ReactNode; content: ReactNode; wide?: boolean; disabled?: boolean }

export const GUIDE_TRIES = 4;

/** Zahl aus der Eingabe – Tausender- und Dezimaltrennzeichen wie in der Sprache („1.000“ bzw. „1,000“ = 1000), siehe `readNumber` */
export const parseNum = (s: string) => readNumber(s);

/** Prüft eine Antwort gegen den Schritt (Zahlen tolerant gegenüber Komma/Punkt) */
export function isRight(step: GuideStep, a: string | number): boolean {
  if (step.answer === undefined) return false;
  if (typeof step.answer === "number") return Math.abs((typeof a === "number" ? a : parseNum(a)) - step.answer) < 1e-9;
  return String(a) === step.answer;
}

/** Rückmeldung nach einem Fehlversuch: erst die passende Begründung (sonst der Tipp), ab dem zweiten Versuch der Tipp dazu */
export function feedback(step: GuideStep, why: string | undefined, tries: number): string {
  const parts = [why ?? step.tip ?? tr("Noch nicht.", "Not yet.")];
  if (why && step.tip && tries >= 2) parts.push(`${tr("Tipp", "Tip")}: ${step.tip}`);
  return `${parts.join(" ")} ${tr(`Versuch ${tries} von ${GUIDE_TRIES}.`, `Try ${tries} of ${GUIDE_TRIES}.`)}`;
}

const MODE_NAME: Record<GuideMode, () => string> = {
  worked: () => tr("Vorgemacht", "Worked example"),
  faded: () => tr("Halb gelöst – ergänze", "Half solved – complete it"),
  free: () => tr("Jetzt du", "Your turn"),
};

/** Zeile des Lösungswegs; `{?}` = Lücke (nach der Lösung mit der Antwort gefüllt) */
function Line({ text, fill }: { text: string; fill?: string }) {
  const [a, b] = text.split("{?}");
  if (b === undefined) return <RichText text={text} />;
  return <><RichText text={a} /><span className={`ui-guide-gap${fill ? " filled" : ""}`}>{fill ?? "?"}</span><RichText text={b} /></>;
}

export function Guide({ def, open, onClose, onFinish, finishLabel, badge, start = 0, onStep, tools, steady }: {
  def: GuideDef; open: boolean; onClose: () => void;
  /** letzter Knopf: z. B. zum Quiz wechseln */
  onFinish: () => void; finishLabel?: string;
  /** Kennzeichnung im Kopf (sonst „Erklärung“), z. B. „Kapitel 2“ */
  badge?: string;
  /** Schritt beim Öffnen (Fortsetzen); `onStep` meldet jeden neuen Schritt (n = fertig) */
  start?: number; onStep?: (i: number) => void;
  /** Hilfsmittel je Schritt – dann stehen sie mit „Weiter“ in einer Leiste unter dem Text */
  tools?: (step: GuideStep, i: number) => GuideTool[];
  /** Bild steht still (bisher nur Ionenbindung „Lernen“): Platz für Lösungsweg, Rückmeldung und „Weiter“ ist von Anfang an frei, und untereinander
   *  (schmal) behält das Bild in jedem Schritt die Höhe vom Anfang – wird der Text doch länger, scrollt er, statt das Bild zu verkleinern. */
  steady?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(0);
  const [tries, setTries] = useState(0);
  const [solved, setSolved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const [shake, setShake] = useState(0);
  // vorgemacht: so viele Zeilen des Lösungswegs sind schon zu sehen
  const [seen, setSeen] = useState(1);
  const n = def.steps.length, done = i >= n, step = def.steps[Math.min(i, n - 1)];
  const worked = step.mode === "worked", lines = step.lines ?? [];
  const show = tries >= GUIDE_TRIES && !solved;

  // öffnen/schließen als modaler Dialog; Zurück-Taste schließt
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  // ein Blatt über der Erklärung (Begriff) geht beim Schließen einen Schritt zurück – dann steht der Verlauf wieder auf der Erklärung, sie bleibt offen
  useBackClose(open, onClose, "uiGuide");
  // jedes Öffnen beginnt vorn (bzw. beim Schritt zum Fortsetzen)
  useEffect(() => { if (open) { setI(start > 0 && start < def.steps.length ? start : 0); reset(); } }, [open]);
  useEffect(() => { if (open) onStep?.(i); }, [i, open]);
  const [tool, setTool] = useState<string | null>(null);
  // Tastatur und Vorlesen: nach jedem Schritt steht der Fokus am neuen Text
  const textRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open && i > 0) textRef.current?.focus({ preventScroll: true }); }, [i, open]);

  // nie abgeschnitten: wächst der Text (Rückmeldung nach einer falschen Antwort, Lösungsweg) über den Bildschirm, stufenweise enger (data-fit,
  // components.css) – zuletzt behält das Bild 72 px und der Text darf scrollen, statt unten abgeschnitten zu werden
  const inRef = useRef<HTMLDivElement>(null);
  // steady: Höhe des Bildes je Schritt (und Fenstergröße) – gemessen beim Erscheinen, danach fest
  const lockRef = useRef({ key: "", t: 0 });
  useLayoutEffect(() => {
    const el = inRef.current;
    if (!el) return;
    const body = el.querySelector<HTMLElement>(":scope > .ui-guide-body");
    // Maß sind die Kästen von Bild und Text (ohne Verschiebungen beim Einblenden – „Weiter“ gleitet 4 px von unten herein)
    const over = () => {
      const limit = el.getBoundingClientRect().bottom - parseFloat(getComputedStyle(el).paddingBottom) + 1;
      return [...el.querySelectorAll<HTMLElement>(":scope > .ui-guide-body > *, :scope > .ui-guide-end")].some(c => c.getBoundingClientRect().bottom > limit);
    };
    // noch nicht zu sehen (Dialog öffnet gerade): nichts messen – die Kästen haben dann keine Größe
    const fit = () => {
      if (!el.clientHeight) return;
      const key = `${i}|${innerWidth}x${innerHeight}`;
      if (steady && body) {
        // gleicher Schritt: das Bild behält seine Höhe (nur kurz nach dem Erscheinen wird noch einmal gemessen, bis alles steht)
        if (lockRef.current.key === key && performance.now() - lockRef.current.t > 600) return;
        body.style.gridTemplateRows = ""; delete body.dataset.locked;
      }
      el.dataset.fit = "0"; for (let k = 1; k <= 2 && over(); k++) el.dataset.fit = String(k);
      if (steady && body) {
        const vis = body.querySelector<HTMLElement>(":scope > .ui-guide-visual");
        // nur untereinander (schmal): nebeneinander hat das Bild ohnehin immer die volle Höhe
        if (vis && getComputedStyle(body).gridTemplateColumns.trim().split(/\s+/).length === 1) {
          body.style.gridTemplateRows = `${Math.max(72, Math.floor(vis.getBoundingClientRect().height))}px minmax(0, 1fr)`;
          body.dataset.locked = "";
        }
        if (lockRef.current.key !== key) lockRef.current = { key, t: performance.now() };
      }
    };
    fit();
    // noch einmal, wenn Bild und Einblendungen stehen (gleich nach dem Rendern kann die Höhe kurz zu groß sein)
    const raf = requestAnimationFrame(fit), late = setTimeout(fit, 450);
    addEventListener("resize", fit);
    return () => { cancelAnimationFrame(raf); clearTimeout(late); removeEventListener("resize", fit); };
  }, [open, i, msg, solved, tries, seen, done]);
  // steady: wird der Text länger als sein Platz, scrollt er – Rückmeldung und „Weiter“ bleiben zu sehen
  useEffect(() => {
    const t = textRef.current;
    if (steady && t && t.scrollHeight > t.clientHeight + 1) t.scrollTop = t.scrollHeight;
  }, [msg, solved, seen, steady]);

  function reset() { setTries(0); setSolved(false); setMsg(null); setVal(""); setSeen(1); }
  // vorgemacht: nächste Zeile zeigen; nach der letzten ist der Schritt fertig
  const reveal = () => { const k = seen + 1; setSeen(k); if (k >= lines.length) setSolved(true); };
  useEffect(() => { if (open && worked && lines.length <= 1) setSolved(true); }, [open, i, worked, lines.length]);

  const answer = (a: string | number) => {
    if (solved || done) return;
    if (isRight(step, a)) {
      setSolved(true); setMsg(null); ding(true); buzz();
      return;
    }
    ding(false); buzz(); setShake(s => s + 1);
    const t = tries + 1;
    setTries(t);
    // Lösung zeigen: die falsche Zahl weg, damit die vorgegebene Zahl im Feld zu sehen ist
    if (t >= GUIDE_TRIES) setVal("");
    const why = step.why?.[typeof step.answer === "number" ? String(parseNum(String(a))) : String(a)];
    setMsg(t >= GUIDE_TRIES
      ? step.show ?? tr(`So geht's: ${typeof step.answer === "number" ? `tippe **${num(step.answer)}** ein` : "tippe auf das Markierte"}.`, `Here's how: ${typeof step.answer === "number" ? `type **${num(step.answer)}**` : "tap the marked answer"}.`)
      : feedback(step, why, t));
  };
  // vorgemacht: das Bild zeigt den gelösten Fall von Anfang an
  const ctx: GuideCtx = worked ? { pick: () => {}, show: false, solved: true } : { pick: id => answer(id), show, solved };
  const next = () => { setI(k => k + 1); reset(); };
  // Kapitel: Anfang je Kapitel und das aktuelle
  const starts = def.steps.map((s, k) => (s.part || k === 0 ? k : -1)).filter(k => k >= 0);
  const parts = def.steps.some(s => s.part) ? starts.map((k, j) => ({ name: def.steps[k].part ?? "", from: k, to: starts[j + 1] ?? n })) : [];
  const part = parts.filter(p => p.from <= Math.min(i, n - 1)).pop();
  const solText = typeof step.answer === "number" ? num(step.answer) : step.answer;

  return (
    <dialog ref={ref} className="ui-guide" onClose={e => { if (e.target === e.currentTarget) onClose(); /* nicht das Blatt eines Begriffs */ }} aria-label={`${badge ?? tr("Erklärung", "Explanation")}: ${def.title}`}>
      {open && (
        <TermScope terms={def.terms ?? []}>
        <div className="ui-guide-in" ref={inRef} data-steady={steady ? "" : undefined}>
          <header className="ui-guide-head">
            <span className="ui-guide-badge"><Icon name={badge ? "book" : "play"} size={16} /><span>{badge ?? tr("Erklärung", "Explanation")}</span></span>
            <h2 title={def.title}>{part?.name && !done ? <><span className="ui-guide-part">{tr(`Teil ${parts.indexOf(part) + 1}`, `Part ${parts.indexOf(part) + 1}`)}</span> {part.name}</> : def.title}</h2>
            <span className="ui-guide-count" aria-label={tr(`Schritt ${Math.min(i + 1, n)} von ${n}`, `Step ${Math.min(i + 1, n)} of ${n}`)}>{done ? tr("fertig", "done") : `${i + 1} / ${n}`}</span>
            <IconButton icon="close" label={badge ? tr(`${badge} schließen`, `Close ${badge}`) : tr("Erklärung schließen", "Close explanation")} onClick={onClose} />
            {parts.length > 1
              ? <span className="ui-guide-bar parts" aria-hidden="true">{parts.map(p => (
                <span key={p.from} style={{ flex: p.to - p.from }}><i style={{ width: `${(Math.max(0, Math.min(i, p.to) - p.from) / (p.to - p.from)) * 100}%` }} /></span>
              ))}</span>
              : <span className="ui-guide-bar" aria-hidden="true"><i style={{ width: `${(Math.min(i, n) / n) * 100}%` }} /></span>}
          </header>
          {done ? (
            <div className="ui-guide-end">
              <h3>{tr("Das kannst du jetzt", "Now you can")}</h3>
              <ul>{def.outro.map((o, k) => <li key={k}><RichText text={o} /></li>)}</ul>
              <div className="ui-guide-end-btns">
                <Button variant="quiet" icon="reset" onClick={() => { setI(0); reset(); }}>{tr("Noch einmal", "Once more")}</Button>
                <Button variant="primary" size="lg" iconRight="arrow" onClick={onFinish}>{finishLabel ?? tr("Zum Üben", "To practice")}</Button>
              </div>
            </div>
          ) : (
            <div className={`ui-guide-body${step.visual ? "" : " no-visual"}`}>
              {step.visual && (
                <div className={`ui-guide-visual${solved ? " solved" : ""}${show ? " show" : ""}`}>
                  {/* je Schritt neu aufbauen: Bilder gleiten nicht aus dem vorigen Schritt herüber (Beschriftungen messen sonst mitten im Übergang) */}
                  <Fragment key={`v${i}`}>{step.visual(ctx)}</Fragment>
                  {step.labels && <Callouts key={i} items={step.labels} solved={solved || worked} />}
                </div>
              )}
              <div className="ui-guide-text" ref={textRef} tabIndex={-1}>
                {step.mode && <span className={`ui-guide-mode m-${step.mode}`}>{MODE_NAME[step.mode]()}</span>}
                {/* nach dem Lösen ist der Einleitungssatz gelesen – sein Platz gehört dem Lösungsweg */}
                {step.say && (steady || !(solved && !worked && lines.length > 0)) && <p className="ui-guide-say"><RichText text={step.say} /></p>}
                <p className="ui-guide-ask"><RichText text={step.ask} /></p>
                {lines.length > 0 && (steady || step.mode !== "free" || solved) && (
                  <ol className={`ui-guide-lines${step.mode === "free" ? " after" : ""}`}>
                    {(worked && !steady ? lines.slice(0, seen) : lines).map((l, k) => {
                      // steady: noch nicht gezeigte Zeilen halten ihren Platz frei (unsichtbar)
                      const hold = steady && (worked ? k >= seen : step.mode === "free" && !solved);
                      return <li key={`${i}-${k}`} className={hold ? "ui-guide-hold" : undefined} aria-hidden={hold || undefined}><Line text={l} fill={solved || show ? solText : undefined} /></li>;
                    })}
                  </ol>
                )}
                {worked && !solved && !tools && (
                  <Button className="ui-guide-next" variant="primary" iconRight="arrow" onClick={reveal}>{tr("Nächster Schritt", "Next step")}</Button>
                )}
                {step.options && (
                  <NoTerms>
                  <div className={`ui-guide-opts${step.options.some(o => o.length > 16) ? " long" : step.options.length > 3 ? " many" : ""}`} key={`s${shake}`}>
                    {step.options.map(o => {
                      const right = solved && o === step.answer, mark = show && o === step.answer;
                      return (
                        <button key={o} type="button" className={`ui-guide-opt${right ? " right" : ""}${mark ? " sol" : ""}`} onClick={() => answer(o)}>
                          {right && <Icon name="check" size={18} />}<RichText text={o} />
                        </button>
                      );
                    })}
                  </div>
                  </NoTerms>
                )}
                {step.num && (
                  <form className="ui-guide-num" key={`n${i}`} onSubmit={e => { e.preventDefault(); if (val.trim()) answer(val); }}>
                    <input inputMode="decimal" autoComplete="off" aria-label={tr("Zahl", "Number")} value={val} placeholder={show ? solText : "?"}
                      className={show ? "sol" : solved ? "right" : undefined} onChange={e => setVal(e.target.value)} />
                    {step.num.unit && <span className="ui-guide-unit">{step.num.unit}</span>}
                    <Button variant="primary" icon="check" type="submit" disabled={!val.trim() || solved}>{tr("Prüfen", "Check")}</Button>
                  </form>
                )}
                <p className={`ui-guide-msg${solved ? " right" : show ? " sol" : msg ? " wrong" : ""}`} aria-live="polite">
                  {solved ? <><Icon name={worked ? "arrow" : "check"} size={18} /><span><RichText text={step.ok} /></span></>
                    : msg ? <><Icon name={show ? "arrow" : "x"} size={18} /><span><RichText text={msg} /></span></> : null}
                </p>
                {solved && !tools && <Button className="ui-guide-next" variant="primary" iconRight="arrow" onClick={next}>{tr("Weiter", "Next")}</Button>}
                {steady && !solved && !worked && !tools && <Button className="ui-guide-next-hold ui-guide-hold" variant="primary" iconRight="arrow" aria-hidden tabIndex={-1}>{tr("Weiter", "Next")}</Button>}
                {tools && (
                  <div className="ui-guide-foot">
                    {tools(step, i).map(t => (
                      <Button key={t.id} variant="quiet" icon={t.icon} className="ui-guide-tool" disabled={t.disabled} onClick={() => setTool(t.id)}>{t.label}</Button>
                    ))}
                    {worked && !solved && <Button className="ui-guide-next" variant="primary" iconRight="arrow" onClick={reveal}>{tr("Nächster Schritt", "Next step")}</Button>}
                    {solved && <Button className="ui-guide-next" variant="primary" iconRight="arrow" onClick={next}>{tr("Weiter", "Next")}</Button>}
                    {/* steady: „Weiter“ kommt erst nach dem Lösen – sein Platz ist schon frei */}
                    {steady && !solved && !worked && <Button className="ui-guide-next-hold ui-guide-hold" variant="primary" iconRight="arrow" aria-hidden tabIndex={-1}>{tr("Weiter", "Next")}</Button>}
                  </div>
                )}
              </div>
            </div>
          )}
          {tools && !done && tools(step, i).map(t => (
            <Sheet key={t.id} open={tool === t.id} title={t.title ?? t.label} wide={t.wide} onClose={() => setTool(null)}>{t.content}</Sheet>
          ))}
        </div>
        </TermScope>
      )}
    </dialog>
  );
}

