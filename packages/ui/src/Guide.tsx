// Geführte Erklärung je App („Erklärung“ links in der Kopfzeile): 10–15 Schritte, jeder verlangt eine Handlung –
// eine Auswahl antippen, eine Zahl eintippen oder etwas im Bild antippen (mit den Bausteinen der App).
// Vier Fehlversuche → die Lösung wird markiert, der Schüler tippt sie selbst an. Richtig → kurze Bestätigung,
// die als grüne Zeile über dem nächsten Schritt stehen bleibt (kein Extra-Klick auf „Weiter“).
// Ganzer Bildschirm, nie scrollen: Bild füllt den Platz (container-type: size, Zeichnungen mit cqw/cqh oder Fit).

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, IconButton } from "./components.tsx";
import { Icon } from "./icons.tsx";
import { RichText } from "./RichText.tsx";
import { ding } from "./feedback.ts";
import { buzz } from "./hooks.ts";

/** Was ein Bild bekommt: `pick` meldet ein angetipptes Ziel, `show` = Lösung markieren, `solved` = schon richtig */
export interface GuideCtx { pick: (id: string) => void; show: boolean; solved: boolean }

export interface GuideStep {
  /** neue Idee in ein, zwei kurzen Sätzen (`**fett**`) */
  say?: string;
  /** Auftrag: was jetzt anzutippen oder einzutippen ist */
  ask: string;
  /** richtige Antwort: Text einer Auswahl, Zahl oder Kennung eines Ziels im Bild */
  answer: string | number;
  /** Auswahl-Knöpfe unter dem Auftrag */
  options?: string[];
  /** Zahl eintippen (mit Einheit hinter dem Feld) */
  num?: { unit?: string };
  /** Bild des Schritts – ruft `pick(id)` beim Antippen eines Ziels (dann ohne `options`/`num`) */
  visual?: (c: GuideCtx) => ReactNode;
  /** Rückmeldung zu bestimmten falschen Antworten (Schlüssel = Auswahltext, Zahl oder Ziel) */
  why?: Record<string, string>;
  /** Bestätigung nach der richtigen Antwort – steht über dem nächsten Schritt */
  ok: string;
  /** Hinweis, wenn nach vier Versuchen die Lösung markiert wird */
  show?: string;
}

export interface GuideDef {
  title: string;
  steps: GuideStep[];
  /** Zusammenfassung am Ende: das kannst du jetzt */
  outro: string[];
}

export const GUIDE_TRIES = 4;

/** Zahl aus der Eingabe (Komma oder Punkt) */
export const parseNum = (s: string) => Number(s.trim().replace(/\s/g, "").replace(",", "."));

/** Prüft eine Antwort gegen den Schritt (Zahlen tolerant gegenüber Komma/Punkt) */
export function isRight(step: GuideStep, a: string | number): boolean {
  if (typeof step.answer === "number") return Math.abs((typeof a === "number" ? a : parseNum(a)) - step.answer) < 1e-9;
  return String(a) === step.answer;
}

export function Guide({ def, open, onClose, onFinish, finishLabel = "Zum Quiz" }: {
  def: GuideDef; open: boolean; onClose: () => void;
  /** letzter Knopf: z. B. zum Quiz wechseln */
  onFinish: () => void; finishLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(0);
  const [tries, setTries] = useState(0);
  const [solved, setSolved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [okLine, setOkLine] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const [shake, setShake] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const n = def.steps.length, done = i >= n, step = def.steps[Math.min(i, n - 1)];
  const show = tries >= GUIDE_TRIES && !solved;

  // öffnen/schließen als modaler Dialog; Zurück-Taste schließt
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    history.pushState({ uiGuide: true }, "");
    let popped = false;
    const onPop = () => { popped = true; close.current(); };
    addEventListener("popstate", onPop);
    return () => { removeEventListener("popstate", onPop); if (!popped && history.state?.uiGuide) history.back(); };
  }, [open]);
  // jedes Öffnen beginnt vorn
  // jedes Öffnen beginnt vorn; ein noch laufender Wechsel zum nächsten Schritt wird beim Schließen verworfen
  useEffect(() => { clearTimeout(timer.current); if (open) { setI(0); reset(); setOkLine(null); } }, [open]);
  // Tastatur und Vorlesen: nach jedem Schritt steht der Fokus am neuen Text
  const textRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open && i > 0) textRef.current?.focus({ preventScroll: true }); }, [i, open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function reset() { setTries(0); setSolved(false); setMsg(null); setVal(""); }

  const answer = (a: string | number) => {
    if (solved || done) return;
    if (isRight(step, a)) {
      setSolved(true); setMsg(null); ding(true); buzz();
      timer.current = window.setTimeout(() => { setOkLine(step.ok); setI(k => k + 1); reset(); }, 750);
      return;
    }
    ding(false); buzz(); setShake(s => s + 1);
    const t = tries + 1;
    setTries(t);
    // Lösung zeigen: die falsche Zahl weg, damit die vorgegebene Zahl im Feld zu sehen ist
    if (t >= GUIDE_TRIES) setVal("");
    const why = step.why?.[typeof step.answer === "number" ? String(parseNum(String(a))) : String(a)];
    setMsg(t >= GUIDE_TRIES
      ? step.show ?? `So geht's: ${typeof step.answer === "number" ? `tippe **${String(step.answer).replace(".", ",")}** ein` : "tippe auf das Markierte"}.`
      : `${why ?? "Noch nicht."} Versuch ${t} von ${GUIDE_TRIES}.`);
  };
  const ctx: GuideCtx = { pick: id => answer(id), show, solved };
  const solText = typeof step.answer === "number" ? String(step.answer).replace(".", ",") : step.answer;

  return (
    <dialog ref={ref} className="ui-guide" onClose={onClose} aria-label={`Erklärung: ${def.title}`}>
      {open && (
        <div className="ui-guide-in">
          <header className="ui-guide-head">
            <span className="ui-guide-badge"><Icon name="play" size={16} /><span>Erklärung</span></span>
            <h2>{def.title}</h2>
            <span className="ui-guide-count" aria-label={`Schritt ${Math.min(i + 1, n)} von ${n}`}>{done ? "fertig" : `${i + 1} / ${n}`}</span>
            <IconButton icon="close" label="Erklärung schließen" onClick={onClose} />
            <span className="ui-guide-bar" aria-hidden="true"><i style={{ width: `${(Math.min(i, n) / n) * 100}%` }} /></span>
          </header>
          {done ? (
            <div className="ui-guide-end">
              {okLine && <p className="ui-guide-ok"><Icon name="check" size={18} /><span><RichText text={okLine} /></span></p>}
              <h3>Das kannst du jetzt</h3>
              <ul>{def.outro.map((o, k) => <li key={k}><RichText text={o} /></li>)}</ul>
              <div className="ui-guide-end-btns">
                <Button variant="quiet" icon="reset" onClick={() => { setI(0); reset(); setOkLine(null); }}>Noch einmal</Button>
                <Button variant="primary" size="lg" iconRight="arrow" onClick={onFinish}>{finishLabel}</Button>
              </div>
            </div>
          ) : (
            <div className={`ui-guide-body${step.visual ? "" : " no-visual"}`}>
              {step.visual && <div className={`ui-guide-visual${solved ? " solved" : ""}${show ? " show" : ""}`}>{step.visual(ctx)}</div>}
              <div className="ui-guide-text" ref={textRef} tabIndex={-1}>
                {okLine && <p className="ui-guide-ok" key={`ok${i}`}><Icon name="check" size={18} /><span><RichText text={okLine} /></span></p>}
                {step.say && <p className="ui-guide-say"><RichText text={step.say} /></p>}
                <p className="ui-guide-ask"><RichText text={step.ask} /></p>
                {step.options && (
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
                )}
                {step.num && (
                  <form className="ui-guide-num" key={`n${i}`} onSubmit={e => { e.preventDefault(); if (val.trim()) answer(val); }}>
                    <input inputMode="decimal" autoComplete="off" aria-label="Zahl" value={val} placeholder={show ? solText : "?"}
                      className={show ? "sol" : solved ? "right" : undefined} onChange={e => setVal(e.target.value)} />
                    {step.num.unit && <span className="ui-guide-unit">{step.num.unit}</span>}
                    <Button variant="primary" icon="check" type="submit" disabled={!val.trim() || solved}>Prüfen</Button>
                  </form>
                )}
                <p className={`ui-guide-msg${solved ? " right" : show ? " sol" : msg ? " wrong" : ""}`} aria-live="polite">
                  {solved ? <><Icon name="check" size={18} />Richtig!</> : msg ? <><Icon name={show ? "arrow" : "x"} size={18} /><span><RichText text={msg} /></span></> : null}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}

/** Knopf „Erklärung“ in der Kopfzeile: hervorgehoben, bis die Erklärung einmal ganz durchlaufen ist */
export function GuideButton({ onClick, fresh }: { onClick: () => void; fresh: boolean }) {
  return (
    <button type="button" className={`ui-guide-btn${fresh ? " fresh" : ""}`} onClick={onClick} title="Schritt für Schritt erklärt – zum Mitmachen">
      <span className="ui-guide-btn-ic" aria-hidden="true"><Icon name="play" size={14} /></span>
      <span>Erklärung</span>
    </button>
  );
}
