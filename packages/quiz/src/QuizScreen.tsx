// Quiz-Oberfläche: Levelauswahl → Erklärung (beim ersten Mal) → Aufgaben → Auswertung.
// Multiple Choice ist eingebaut; weitere Aufgabentypen stellt die App über renderAnswer bereit.

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import { Button, Card, Fit, Guide, Icon, IconButton, NoTerms, Note, ResultBar, RichText, Sheet, Stars, Tag, TermScope, buzz, ding, getLang, progressKey, tr, type GuideDef, type IconName, type TermDef } from "@lern/ui";
import { counted, diagnose, starsFor, weakTypes, type Answered, type BaseTask, type Game, type LevelKey, type McTask, type QuizLevel, type Submit } from "./types.ts";
import type { QuizState } from "./store.ts";
import { STAGES, dayStart, daysUntilDue, dueSkills, examDays, inExam, stageCounts, stageOf, weeklyDone, type Exam, type Skills, type Stage } from "./skills.ts";

export interface QuizScreenProps<T extends BaseTask> {
  stufe: string;
  title: string;
  lead?: ReactNode;
  heroArt?: ReactNode;
  useQuiz: UseBoundStore<StoreApi<QuizState<T>>>;
  levels: QuizLevel[];
  levelName: (level: LevelKey) => string;
  levelId: (level: LevelKey) => string;
  /** Name eines Aufgabentyps – aktiviert „Schwächen üben“ */
  typeName?: (id: string) => string | undefined;
  renderVisual?: (task: T) => ReactNode;
  /** eigene Darstellung einer MC-Antwort (z. B. Gleichung einzeilig mit Fit-Text); ohne = Text */
  renderOption?: (task: T, option: string) => ReactNode;
  /**
   * Antwort als Bild: was Vorlesen und Screenreader statt des Antworttexts sagen – der Antworttext (Schlüssel des Bilds) nennt dort oft die Lösung.
   * Eine Beschreibung, die nicht mehr verrät als das Bild (z. B. die Formel), oder "" = nur „Antwort A“. undefined = Antworttext (keine Bild-Antwort).
   */
  optionLabel?: (task: T, option: string) => string | undefined;
  /** Antwortbereich für Aufgaben, die nicht "mc" sind */
  renderAnswer?: (task: T, answered: Answered | null, submit: Submit) => ReactNode;
  /** Lösung für die Rückmeldung bei Nicht-mc-Aufgaben */
  solution?: (task: T) => ReactNode;
  /** Lösungsweg zur Rückmeldung (z. B. Rechenweg an der Tafel) – öffnet sich als Blatt über den Knopf „Lösungsweg“ */
  feedbackExtra?: (task: T, answered: Answered) => ReactNode;
  /** Erklärkarte für ein Level bzw. für den Level der aktuellen Aufgabe */
  explain?: (level: LevelKey, task?: T) => ReactNode;
  /** Hilfsmittel zur aktuellen Aufgabe (z. B. Periodensystem mit markiertem Element) – öffnen sich als Blatt */
  tools?: (task: T) => QuizTool[];
  /** Name einer Fehlvorstellung (Stolperstein) für Landkarte und Auswertung */
  missName?: (key: string) => string | undefined;
  /**
   * Lernen in Kapiteln: Lektion (geführte Erklärung) eines Levels. Beim ersten Antippen des Kapitels läuft zuerst die Lektion
   * (vorgemacht → halb gelöst → selbst), danach direkt die Aufgaben – ein Fluss. Später startet das Kapitel gleich mit den Aufgaben,
   * die Lektion lässt sich über das Buch-Zeichen neben der Karte wiederholen. Erledigt-Stand in localStorage `LESSON_KEY`.
   */
  lesson?: (level: number) => GuideDef | undefined;
  /**
   * Begriffe der Aufgabe (z. B. Stoffnamen): im Text antippbar (Blatt mit kurzer Erklärung). Mit `termsTool` zusätzlich ein Hilfsmittel,
   * das genau diese Begriffe zeigt – vor der Antwort (`answered` false) also nur Begriffe aus sichtbarem Text. Erklärungen dürfen die Lösung nicht verraten.
   */
  terms?: (task: T, answered: boolean) => TermDef[];
  termsTool?: { label: string; icon: IconName };
}

/** Begriffe der Aufgabe als Karten untereinander */
function termTool<T extends BaseTask>(p: QuizScreenProps<T>, terms: TermDef[]): QuizTool[] {
  if (!p.termsTool || !terms.length) return [];
  return [{ id: "begriffe", label: p.termsTool.label, icon: p.termsTool.icon,
    content: <div className="q-terms">{terms.map(d => <section key={d.term} className="q-term"><h3>{d.title}</h3>{d.body}</section>)}</div> }];
}

/** localStorage-Schlüssel: welche Lektionen schon durchlaufen sind (gehört in `storage` des Moduls). Fortschritt, den mehrere Module teilen –
 *  „Neu starten“ nach einem Absturz behält ihn (sonst verlöre z. B. Polymere die Lektionen, wenn Gemische zurückgesetzt wird). */
export const LESSON_KEY = progressKey("lern-lektionen", true);
const lessonsDone = (): Record<string, boolean> => {
  try { const d: unknown = JSON.parse(localStorage.getItem(LESSON_KEY) ?? "{}"); return d && typeof d === "object" && !Array.isArray(d) ? d as Record<string, boolean> : {}; } catch { return {}; }
};
const markLesson = (id: string) => { try { localStorage.setItem(LESSON_KEY, JSON.stringify({ ...lessonsDone(), [id]: true })); } catch { /* egal */ } };

/** Hilfsmittel während einer Aufgabe: Inhalt passt sich der Aufgabe an */
export interface QuizTool { id: string; label: string; icon: IconName; content: ReactNode; wide?: boolean;
  /** unsichtbarer Platzhalter: der Knopf erscheint erst später (z. B. „Lösung“ nach der Antwort) – sein Platz ist schon frei, nichts rückt */
  off?: boolean }

/** Knöpfe für Tipp, Hilfsmittel und Erklärung – gemeinsam für alle Quiz-Oberflächen */
/** Aufgabentext zum Vorlesen aufbereiten: Formatierung weg, Formeln lesbar (H₂O → H 2 O, → „reagiert zu“) */
const SUP: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+" };
const sup = (t: string) => [...t].map(c => SUP[c] ?? c).join("");
const PREFIX_DE: Record<string, string> = { "": "", k: "Kilo", h: "Hekto", d: "Dezi", c: "Zenti", m: "Milli", "µ": "Mikro", n: "Nano" };
const PREFIX_EN: Record<string, string> = { "": "", k: "kilo", h: "hecto", d: "deci", c: "centi", m: "milli", "µ": "micro", n: "nano" };
/** Wörter für die Sprachausgabe je Sprache */
const W = { de: { pair: "Paar", arrow: "Pfeil", eqq: "gleich wie viel", q: "wie viel", sq: "Quadrat", cu: "Kubik", m: "meter", pow: "hoch", minus: "minus", plus: "plus", react: "reagiert zu", then: "dann", div: "geteilt durch", times: "mal", approx: "ungefähr", deg: "Grad", micro: "mikro" },
  en: { pair: "pair", arrow: "arrow", eqq: "equals how much", q: "how much", sq: "square ", cu: "cubic ", m: "metre", pow: "to the power of", minus: "minus", plus: "plus", react: "reacts to", then: "then", div: "divided by", times: "times", approx: "about", deg: "degrees", micro: "micro" } };
/** Einheiten nicht wie Formeln zerlegen (GHz, MWh, kΩ …) */
const UNIT = /^[GMkmµnhdc]?(Hz|Wh|W|J|V|A|Ω|Pa|m|g|l|s)(\/[a-zA-Zµ]+)?$/;

// ¹ ² ³ liegen nicht im Block ⁰–⁹, daher die Zeichen einzeln
/** Text für die Sprachausgabe: Formeln Atom für Atom, Ladungen, Hochzahlen, Einheiten und Zeichen als Wörter */
export function speakable(text: string): string {
  const reaction = !/[↑↓]/.test(text) && (/[₀-₉]/.test(text) || /[A-Z][a-z]?\d* \+ /.test(text));
  const w = W[getLang()], PREFIX = getLang() === "en" ? PREFIX_EN : PREFIX_DE;
  return text
    .replace(/\*\*|`/g, "")
    .replace(/[[\]]/g, "")
    .replace(/↑↓/g, ` ${w.pair} `).replace(/↑/g, ` ${w.arrow} `).replace(/↓/g, ` ${w.arrow} `)
    .replace(/▢/g, " … ")
    .replace(/=\s*\?/g, ` ${w.eqq} `)
    .replace(/(^|\s)\?(?=\s)/g, `$1 ${w.q} `)
    // Flächen und Rauminhalte: km² → Quadratkilometer
    .replace(/(^|[\s(\d/])([kdcmµ]?)m([²³])(?![\w⁰¹²³⁴⁵⁶⁷⁸⁹])/g, (_, a, p, e) => `${a}${e === "²" ? w.sq : w.cu}${PREFIX[p].toLowerCase()}${w.m}`)
    // Zehnerpotenzen: 10⁻³ → 10 hoch minus 3
    .replace(/10([⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, e) => ` 10 ${w.pow} ${sup(e).replace("-", `${w.minus} `)} `)
    // Ladungen: O²⁻ → O 2 minus, Na⁺ → Na plus
    .replace(/([A-Za-z)\]₀-₉])([⁰¹²³⁴⁵⁶⁷⁸⁹]*)([⁺⁻])/g, (_, a, d, c) => `${a} ${sup(d)} ${c === "⁺" ? w.plus : w.minus} `)
    // Elektronenkonfiguration: 2p⁶ → 2 p 6
    .replace(/([spdf])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, a, d) => `${a} ${sup(d)}`)
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, d => ` ${sup(d)}`)
    .replace(/[₀-₉]/g, d => " " + String(d.charCodeAt(0) - 0x2080) + " ")
    .split(/(\s+)/).map(w => (UNIT.test(w) ? w : w.replace(/([A-Z][a-z]?)(?=[A-Z(])/g, "$1 "))).join("")
    .replace(/→/g, reaction ? ` ${w.react} ` : ` ${w.then} `)
    .replace(/\+/g, ` ${w.plus} `)
    .replace(/(\d)\s?[−-](?=[\s.,]|$)/g, `$1 ${w.minus}`)
    .replace(/−/g, ` ${w.minus} `)
    .replace(/(^|[\s(]):\s?(?=\d)/g, `$1${w.div} `)
    .replace(/·/g, ` ${w.times} `)
    .replace(/≈/g, ` ${w.approx} `)
    .replace(/°/g, ` ${w.deg}`)
    .replace(/µ/g, w.micro)
    .replace(/Ω/g, "Ohm")
    .replace(/\s+([.,;:?!)])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Stimme zum Vorlesen: nur eine Stimme des Geräts (`localService`) – eine Netzwerkstimme schickte den Text an einen fremden Dienst.
 * Bevorzugt die übliche Variante (de-AT bzw. en-GB), sonst irgendeine lokale Stimme der Sprache.
 */
export function localVoice(voices: readonly SpeechSynthesisVoice[], l = getLang()): SpeechSynthesisVoice | undefined {
  const want = l === "en" ? "en-gb" : "de-at";
  const own = voices.filter(v => v.localService && v.lang.toLowerCase().replace("_", "-").startsWith(l));
  return own.find(v => v.lang.toLowerCase().replace("_", "-") === want) ?? own[0];
}
const voices = () => { try { return typeof speechSynthesis === "undefined" ? [] : speechSynthesis.getVoices(); } catch { return []; } };

/** Vorlesen mit einer lokalen Stimme des Geräts; vorhandene Ausgabe wird abgebrochen. Ohne lokale Stimme kein Vorlesen. */
export function speak(text: string) {
  try {
    const v = localVoice(voices());
    if (!v) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(speakable(text));
    u.voice = v;
    u.lang = v.lang.replace("_", "-");
    u.rate = 0.95;
    speechSynthesis.speak(u);
  } catch { /* keine Sprachausgabe */ }
}

/** gibt es eine lokale Stimme? Die Liste kommt oft erst nach dem Laden (`voiceschanged`) */
function useCanSpeak(): boolean {
  return useSyncExternalStore(cb => {
    if (typeof speechSynthesis === "undefined" || !speechSynthesis.addEventListener) return () => {};
    speechSynthesis.addEventListener("voiceschanged", cb);
    return () => speechSynthesis.removeEventListener("voiceschanged", cb);
  }, () => !!localVoice(voices()), () => false);
}

export function QuizHelp({ tools = [], hint, hintCue, onHint, hintUsed, hintAgain, firstStep, answered, explain, read }: {
  tools?: QuizTool[]; hint?: boolean; hintCue?: boolean; onHint?: () => void; hintUsed?: boolean; answered: boolean; explain?: ReactNode;
  /** der Tipp steht in einem Blatt (passte nicht in die Karte): „Tipp“ bleibt nach dem ersten Mal aktiv und öffnet das Blatt wieder (kostet nichts mehr) */
  hintAgain?: boolean;
  /** der erste Schritt steht in einem Blatt (passte nicht über die Frage): Knopf „Schritt 1“ öffnet es */
  firstStep?: () => void;
  /** Text zum Vorlesen (Aufgabe) – Knopf erscheint nur, wenn das Gerät vorlesen kann */
  read?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const canSpeak = useCanSpeak();
  const tool = tools.find(t => t.id === open);
  return (
    <>
      <span className="q-help">
        {read && canSpeak && <Button variant="quiet" icon="sound" aria-label={tr("Aufgabe vorlesen", "Read task aloud")} onClick={() => speak(read)}>{tr("Vorlesen", "Read aloud")}</Button>}
        {/* nach der Antwort bleiben „Tipp“ und „Schritt 1“ unsichtbar an ihrem Platz – die Knöpfe daneben rücken nicht */}
        {hint && (answered
          ? <Button variant="quiet" icon="bulb" className={`q-off${hintCue && !hintUsed ? " q-hint-cue" : ""}`} aria-hidden="true" tabIndex={-1}>{tr("Tipp", "Tip")}</Button>
          : <Button variant="quiet" icon="bulb" className={hintCue && !hintUsed ? "q-hint-cue" : undefined} onClick={hintUsed && !hintAgain ? undefined : onHint} aria-disabled={hintUsed && !hintAgain ? true : undefined}
              aria-label={hintCue ? tr("Tipp zu dieser Aufgabe", "Tip for this task") : undefined}>{tr("Tipp", "Tip")}</Button>)}
        {firstStep && (answered
          ? <Button variant="quiet" icon="bulb" className="q-off" aria-hidden="true" tabIndex={-1}>{tr("Schritt 1", "Step 1")}</Button>
          : <Button variant="quiet" icon="bulb" className="q-hint-cue" onClick={firstStep} aria-label={tr("Erster Schritt", "First step")}>{tr("Schritt 1", "Step 1")}</Button>)}
        {tools.map(t => t.off
          ? <Button key={t.id} variant="quiet" icon={t.icon} className="q-off" aria-hidden="true" tabIndex={-1}>{t.label}</Button>
          : <Button key={t.id} variant="quiet" icon={t.icon} onClick={() => setOpen(t.id)}>{t.label}</Button>)}
        {explain && <Button variant="quiet" icon="book" onClick={() => setOpen("explain")}>{tr("Erklärung", "Explanation")}</Button>}
      </span>
      <Sheet open={!!tool} wide={tool?.wide} title={tool?.label ?? ""} onClose={() => setOpen(null)}>{tool?.content}</Sheet>
      {explain && <Sheet open={open === "explain"} title={tr("Erklärung", "Explanation")} onClose={() => setOpen(null)}>{explain}</Sheet>}
    </>
  );
}

// Wachstums-Sprache: Lob für den Weg, nicht für die Person; Fehler heißen „noch nicht“
const PRAISE_DE = ["Richtig!", "Genau!", "Stimmt!", "Richtig – weiter so.", "Genau so geht's.", "Richtig gedacht."];
const PRAISE_EN = ["Correct!", "Exactly!", "Right!", "Correct – keep it up.", "That's how it works.", "Well reasoned."];
const praiseFor = (t: BaseTask, hintUsed: boolean, streak: number, i: number) =>
  t.praise ?? (hintUsed ? tr("Richtig – mit Tipp gelöst.", "Correct – solved with a tip.") : streak >= 3 ? tr(`Richtig – ${streak} in Folge.`, `Correct – ${streak} in a row.`) : tr(PRAISE_DE, PRAISE_EN)[i % PRAISE_DE.length]);

export function QuizScreen<T extends BaseTask>(p: QuizScreenProps<T>) {
  const game = p.useQuiz(s => s.games[p.stufe]);
  const [paused, setPaused] = useState(false);
  useEffect(() => setPaused(false), [p.stufe]);
  if (game?.finished) return <Result p={p} game={game} />;
  if (game && !paused) return <Play p={p} game={game} onPause={() => setPaused(true)} />;
  return <Menu p={p} onStart={() => setPaused(false)} />;
}

const WEEK_GOAL = 3;
const STAGE_DE: Record<Stage, string> = { neu: "neu", geübt: "geübt", sicher: "sicher", gemeistert: "gemeistert" };
const STAGE_EN: Record<Stage, string> = { neu: "new", geübt: "practised", sicher: "secure", gemeistert: "mastered" };
const stageName = (st: Stage) => tr(STAGE_DE, STAGE_EN)[st];

/** Was gerade „Heute fällig“ und „Schwächen üben“ füllt – für das Menü und für „Nochmal“ nach einer solchen Runde */
export function pending<T extends BaseTask>(p: Pick<QuizScreenProps<T>, "stufe" | "levels" | "typeName">, s: Pick<QuizState<T>, "skills" | "typeStats" | "exams">, now = Date.now()) {
  const allTypes = [...new Set(p.levels.flatMap(l => l.types ?? []))];
  return {
    due: dueSkills(s.skills[p.stufe] ?? {}, allTypes, now, s.exams[p.stufe]),
    weak: p.typeName ? weakTypes(s.typeStats[p.stufe], id => !!p.typeName!(id)) : [],
  };
}

/** „Schularbeit in 5 Tagen“, „morgen“, „heute“ */
const examWhen = (days: number) => (days === 0 ? tr("heute", "today") : days === 1 ? tr("morgen", "tomorrow") : tr(`in ${days} Tagen`, `in ${days} days`));
const skillsWord = (n: number) => (n === 1 ? tr("Fertigkeit", "skill") : tr("Fertigkeiten", "skills"));

function Menu<T extends BaseTask>({ p, onStart }: { p: QuizScreenProps<T>; onStart: () => void }) {
  const { progress, games, typeStats, skills, rounds, misses, exams, start, setExam } = p.useQuiz();
  const [map, setMap] = useState(false);
  const [examOpen, setExamOpen] = useState(false);
  const running = games[p.stufe];
  const sk = skills[p.stufe] ?? {};
  const allTypes = [...new Set(p.levels.flatMap(l => l.types ?? []))];
  const exam = exams[p.stufe];
  const examIn = exam ? examDays(exam) : null;
  // Termin vorbei → still löschen, es gelten wieder die normalen Abstände
  useEffect(() => { if (exam && examIn !== null && examIn < 0) setExam(p.stufe, null); }, [exam, examIn, p.stufe, setExam]);
  const { due, weak } = pending(p, { skills, typeStats, exams });
  const done = weeklyDone(rounds[p.stufe]);
  // Rückkehr nach einer Pause von mindestens 7 Tagen: begrüßen statt Wochenziel zeigen (keine Schuld)
  const lastRound = Math.max(0, ...(rounds[p.stufe] ?? []));
  const back = done === 0 && lastRound > 0 && Date.now() - lastRound >= 7 * 86_400_000;
  const name = (id: string) => p.typeName?.(id) ?? id;
  const begin = (level: LevelKey) => { start(p.stufe, level, level === "due" ? due : undefined); onStart(); window.scrollTo({ top: 0 }); };
  // Kapitel mit Lektion: beim ersten Mal (oder über das Buch-Zeichen) zuerst die Lektion, danach die Aufgaben
  const [lesson, setLesson] = useState<number | null>(null);
  const [doneLessons, setDoneLessons] = useState(lessonsDone);
  const go = (level: LevelKey) => (typeof level === "number" && p.lesson?.(level) && !doneLessons[p.levelId(level)] ? setLesson(level) : begin(level));
  const lessonDef = lesson !== null ? p.lesson?.(lesson) : undefined;
  const examOn = !!exam && examIn !== null && examIn >= 0;
  const examIds = exam?.types?.length ? exam.types : allTypes;
  const examCount = stageCounts(sk, examIds);
  const card = (level: LevelKey, n: ReactNode, title: string, desc: string, ids?: string[], tip?: boolean) => {
    const pr = progress[p.levelId(level)];
    const c = ids ? stageCounts(sk, ids) : null;
    const again = typeof level === "number" && !!p.lesson?.(level) && doneLessons[p.levelId(level)];
    const btn = (
      <button key={String(level)} type="button" className={`level-card${level === "due" ? " due" : ""}`} onClick={() => go(level)}>
        <span className="lv-num">{n}</span>
        <span className="lv-body">
          <span className="lv-name">{title}</span>
          <span className="lv-desc">{desc}</span>
          {ids && c && (
            <span className="lv-skills" aria-label={tr(`${c.sicher + c.gemeistert} von ${ids.length} Fertigkeiten sicher`, `${c.sicher + c.gemeistert} of ${ids.length} skills secure`)}>
              {ids.map(id => <i key={id} className={`sk sk-${stageOf(sk[id])}`} />)}
              <span>{c.sicher + c.gemeistert} / {ids.length} {tr("sicher", "secure")}</span>
            </span>
          )}
        </span>
        <span className="lv-meta"><Stars value={pr?.stars ?? 0} />
          <span className="lv-go">{tip && <span className="lv-tip" role="img" aria-label={tr("mit Tipp", "with tip")}><Icon name="bulb" /></span>}<Icon name="play" className="lv-play" /></span></span>
      </button>
    );
    return again ? (
      <div key={String(level)} className="lv-row">
        {btn}
        <IconButton icon="book" className="lv-lesson" label={tr(`Erklärung: ${title}`, `Explanation: ${title}`)} onClick={() => setLesson(level as number)} />
      </div>
    ) : btn;
  };
  // Nie scrollen: passt das Menü nicht (kleines Handy, viele Level, „Weiterspielen“), stufenweise kompakter –
  // 1 ohne Beschreibungen, 2 engere Karten, 3 ohne Fertigkeiten-Kästchen, 4 ohne Titelkarte
  const menuRef = useRef<HTMLDivElement>(null);
  useFitSteps(menuRef, 5, [p.stufe, !!running, due.length, weak.length, examOn, back, p.levels.length]);
  return (
    <div className="quiz-wrap quiz-menu" ref={menuRef}>
      <Card className="quiz-hero">
        <div><h2>{p.title}</h2>{p.lead && <p>{p.lead}</p>}</div>
        {p.heroArt && <div className="hero-atom" aria-hidden="true">{p.heroArt}</div>}
      </Card>
      {/* eine Zeile: Wochenziel – oder, solange ein Termin läuft, der Countdown zur Schularbeit */}
      <div className={`q-week${examOn ? " has-exam" : ""}${back && !examOn ? " greet" : ""}`}>
        {examOn ? (
          <button type="button" className="q-exam" onClick={() => setExamOpen(true)}>
            <Icon name="calendar" size={18} />
            <span>{examIn === 0 ? <>{tr("Heute Schularbeit", "Test today")}<span className="q-long">{tr(" – alles Gute", " – good luck")}</span>!</> : `${tr("Schularbeit", "Test")} ${examWhen(examIn!)}`}</span>
            <b>{examCount.sicher + examCount.gemeistert} / {examIds.length} {tr("sicher", "secure")}</b>
          </button>
        ) : back ? (
          <b className="q-greet">{tr("Schön, dass du wieder da bist", "Good to see you again")}<span className="q-long">{tr(" – hier geht's weiter", " – carry on here")}</span></b>
        ) : (
          <>
            <span>{tr("Woche", "Week")}</span>
            <span className="q-week-boxes" role="img" aria-label={tr(`Wochenziel: ${Math.min(done, WEEK_GOAL)} von ${WEEK_GOAL} Runden`, `Weekly goal: ${Math.min(done, WEEK_GOAL)} of ${WEEK_GOAL} rounds`)}>
              {Array.from({ length: WEEK_GOAL }, (_, i) => <i key={i} className={i < done ? "on" : undefined} />)}
            </span>
            <b>{Math.min(done, WEEK_GOAL)} / {WEEK_GOAL}<span className="q-long">{tr(" Runden", " rounds")}</span>{done >= WEEK_GOAL && " ✓"}</b>
          </>
        )}
        <button type="button" className="q-map-btn" onClick={() => setMap(true)} aria-label={tr("Landkarte", "Skill map")} title={tr("Landkarte", "Skill map")}><Icon name="table" size={18} /><span>{tr("Landkarte", "Map")}</span></button>
        {!exam && <button type="button" className="q-map-btn q-exam-btn" onClick={() => setExamOpen(true)} aria-label={tr("Schularbeit eintragen", "Add a test date")} title={tr("Schularbeit eintragen", "Add a test date")}><Icon name="calendar" size={18} /></button>}
      </div>
      {running && !running.finished && (
        <button type="button" className="resume" onClick={onStart}>
          <Icon name="play" size={22} />
          <span><b>{tr("Weiterspielen", "Continue")}</b> · {p.levelName(running.level)} · {running.i + 1}/{running.tasks.length}</span>
          <Icon name="arrow" />
        </button>
      )}
      <div className="level-list">
        {due.length > 0 && card("due", <Icon name="target" />, tr("Heute fällig", "Due today"), tr(`${due.length} ${skillsWord(due.length)} wiederholen${examOn ? " · vor der Schularbeit" : " · ca. 4 Minuten"}`, `Review ${due.length} ${skillsWord(due.length)}${examOn ? " · before the test" : " · about 4 minutes"}`))}
        {p.levels.map((l, i) => card(i, String(i + 1), l.name, l.desc, l.types, l.tip))}
        {card("mix", "★", tr("Alles gemischt", "All mixed"), tr("Aufgaben aus allen Levels", "Tasks from all levels"))}
        {weak.length > 0 && card("weak", <Icon name="reset" />, tr("Schwächen üben", "Practise weak spots"), weak.map(name).join(", "))}
      </div>
      {lessonDef && <Guide key={`${lesson}-${lessonDef.title}`} def={lessonDef} open onClose={() => setLesson(null)} finishLabel={tr("Zu den Aufgaben", "To the tasks")}
        onFinish={() => { const l = lesson!; markLesson(p.levelId(l)); setDoneLessons(lessonsDone()); setLesson(null); begin(l); }} />}
      <Sheet open={map} title={tr("Landkarte", "Skill map")} onClose={() => setMap(false)}>
        <SkillMap levels={p.levels} skills={sk} name={name} misses={misses[p.stufe] ?? {}} missName={p.missName} exam={exam} />
      </Sheet>
      <Sheet open={examOpen} title={tr("Schularbeit", "Test")} onClose={() => setExamOpen(false)}>
        <ExamForm key={`${examOpen}-${exam?.date ?? 0}`} levels={p.levels} exam={exam} onSave={e => { setExam(p.stufe, e); setExamOpen(false); }} />
      </Sheet>
    </div>
  );
}

const toDateInput = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/** „Schularbeit am …“: Datum und betroffene Level – bleibt nur auf dem Gerät */
function ExamForm({ levels, exam, onSave }: { levels: QuizLevel[]; exam?: Exam; onSave: (e: Exam | null) => void }) {
  const [date, setDate] = useState(exam ? toDateInput(exam.date) : "");
  const [picked, setPicked] = useState<string[]>(() =>
    levels.filter(l => !exam?.types?.length || l.types?.some(t => exam.types!.includes(t))).map(l => l.id));
  const parsed = date ? new Date(`${date}T00:00:00`).getTime() : NaN;
  const valid = !Number.isNaN(parsed) && parsed >= dayStart() && picked.length > 0;
  const types = [...new Set(levels.filter(l => picked.includes(l.id)).flatMap(l => l.types ?? []))];
  const save = () => onSave({ date: parsed, types: picked.length === levels.length ? undefined : types });
  return (
    <div className="q-exam-form">
      <label className="q-exam-date"><span>{tr("Termin", "Date")}</span>
        <input type="date" value={date} min={toDateInput(dayStart())} onChange={e => setDate(e.target.value)} />
      </label>
      <div className="q-exam-levels" role="group" aria-label={tr("Welche Level kommen dran?", "Which levels are tested?")}>
        {levels.map((l, i) => (
          <label key={l.id} className={`q-exam-lv${picked.includes(l.id) ? " on" : ""}`}>
            <input type="checkbox" checked={picked.includes(l.id)} onChange={e => setPicked(e.target.checked ? [...picked, l.id] : picked.filter(x => x !== l.id))} />
            <span className="q-map-num">{i + 1}</span><span>{l.name}</span>
          </label>
        ))}
      </div>
      {valid && (
        <div className="ui-tags">
          <Tag tone="signal">{examWhen(examDays({ date: parsed }))}</Tag>
          <Tag>{types.length} {skillsWord(types.length)}</Tag>
        </div>
      )}
      <div className="btn-row">
        <Button variant="primary" icon="check" disabled={!valid} onClick={save}>{tr("Speichern", "Save")}</Button>
        {exam && <Button variant="quiet" icon="x" onClick={() => onSave(null)}>{tr("Termin löschen", "Delete date")}</Button>}
      </div>
    </div>
  );
}

/** Nie scrollen: setzt data-fit = 0, 1, … max, bis weder die Seite noch ein scrollbarer Vorfahr (Blatt) überläuft; misst bei Größenänderung neu.
 *  `orScroll`: hilft auch die letzte Stufe nicht, bleibt es bei Lesegröße (0) und der Rahmen scrollt – kleiner und trotzdem scrollen hilft niemandem */
function useFitSteps(ref: RefObject<HTMLElement | null>, max: number, deps: unknown[], orScroll = false) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const over = () => {
      const d = document.documentElement;
      if (d.scrollHeight > innerHeight + 1) return true;
      for (let a = el.parentElement; a; a = a.parentElement)
        if (a.scrollHeight > a.clientHeight + 1 && getComputedStyle(a).overflowY !== "visible") return true;
      return false;
    };
    const fit = () => {
      el.dataset.fit = "0";
      for (let k = 1; k <= max && over(); k++) el.dataset.fit = String(k);
      if (orScroll && over()) el.dataset.fit = "0";
    };
    fit();
    addEventListener("resize", fit);
    // z. B. Blatt geht erst nach dem Einhängen auf: neu messen, sobald das Element eine Größe bekommt
    let seen = el.offsetHeight > 0, raf = 0;
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
      if (seen || !el.offsetHeight) return;
      seen = true; cancelAnimationFrame(raf); raf = requestAnimationFrame(fit);
    });
    ro?.observe(el);
    return () => { removeEventListener("resize", fit); ro?.disconnect(); cancelAnimationFrame(raf); };
  }, deps);
}

/** Landkarte: je Level die Fertigkeiten mit Stufe und nächster Wiederholung */
function SkillMap({ levels, skills, name, misses, missName, exam }: {
  levels: QuizLevel[]; skills: Skills; name: (id: string) => string; misses: Record<string, number>; missName?: (key: string) => string | undefined; exam?: Exam;
}) {
  const now = Date.now();
  const when = (id: string) => {
    const d = daysUntilDue(skills[id], now, exam, id);
    if (d === null) return inExam(exam, id, now) ? tr("fällig", "due") : "";
    return d <= 0 ? tr("fällig", "due") : d === 1 ? tr("morgen", "tomorrow") : tr(`in ${d} Tagen`, `in ${d} days`);
  };
  const examIn = exam ? examDays(exam, now) : null;
  const stones = Object.entries(misses).filter(([k, n]) => n >= 2 && missName?.(k)).sort((a, b) => b[1] - a[1]).slice(0, 5);
  // passt die Karte nicht ins Blatt (kleines Handy, Lesbar): 1 engere Zeilen, 2 noch enger
  const mapRef = useRef<HTMLDivElement>(null);
  useFitSteps(mapRef, 2, [levels.length, stones.length, !!exam], true);
  return (
    <div className="q-map" ref={mapRef}>
      {exam && examIn !== null && examIn >= 0 && <p className="q-map-exam"><Icon name="calendar" size={16} /> {tr("Schularbeit", "Test")} {examWhen(examIn)}</p>}
      {stones.length > 0 && (
        <section className="q-stones">
          <h3><Icon name="x" /> {tr("Stolpersteine", "Stumbling blocks")}</h3>
          <ul>{stones.map(([k, n]) => <li key={k}><span className="q-map-name">{missName!(k)}</span><span className="q-map-due">{n}×</span></li>)}</ul>
        </section>
      )}
      <p className="q-map-legend">{STAGES.map(st => <span key={st}><i className={`sk sk-${st}`} /> {stageName(st)}</span>)}</p>
      {levels.map((l, i) => (
        <section key={l.id}>
          <h3><span className="q-map-num">{i + 1}</span> {l.name}</h3>
          <ul>
            {(l.types ?? []).map(id => {
              const st = stageOf(skills[id]);
              return (
                <li key={id}>
                  <i className={`sk sk-${st}`} aria-hidden="true" />
                  <span className="q-map-name">{name(id)}</span>
                  <span className={`q-map-stage st-${st}`}>{stageName(st)}</span>
                  <span className="q-map-due">{when(id)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Play<T extends BaseTask>({ p, game, onPause }: { p: QuizScreenProps<T>; game: Game<T>; onPause: () => void }) {
  const dismissIntro = p.useQuiz(s => s.dismissIntro);
  return (
    <div className="quiz-wrap quiz-play ui-screen">
      <div className="quiz-top">
        <IconButton icon="back" label={tr("Pause – zur Levelauswahl", "Pause – back to levels")} onClick={onPause} />
        <div className="q-prog">
          <div className="q-prog-lbl"><span>{p.levelName(game.level)}</span><span>{game.tasks[game.i]?.stage === "worked" ? tr("Beispiel", "Example") : <>{tr("Aufgabe", "Task")} {counted(game.tasks.slice(0, game.i + 1)).length} / {counted(game.tasks).length}</>}</span></div>
          <ResultBar results={game.answers.filter((_, k) => game.tasks[k].stage !== "worked").map(a => (a ? a.ok : null))} />
        </div>
        <div className="q-score" role="img" aria-label={tr(`${game.score} Punkte`, `${game.score} points`)}>{game.score}<small>{tr("Pkt", "pts")}</small></div>
        <div className={`q-streak${game.streak >= 2 ? " hot" : ""}`} role="img" aria-label={tr(`Serie ${game.streak}`, `Streak ${game.streak}`)}><Icon name="fire" />{game.streak}</div>
      </div>
      {game.intro && game.i === 0 && !game.answers[0] && p.explain && !(typeof game.level === "number" && p.lesson?.(game.level))
        ? (
          <Card className="intro-card">
            <h2><Icon name="book" /> {tr("So geht's", "How it works")}: {p.levelName(game.level)}</h2>
            <div className="intro-body"><Fit min={0.55}>{p.explain(game.level)}</Fit></div>
            <div className="q-actions"><Button variant="primary" size="lg" iconRight="arrow" onClick={() => dismissIntro(p.stufe)}>{tr("Los geht's", "Let's go")}</Button></div>
          </Card>
        )
        : <TaskCard key={`${game.startedAt}-${game.i}`} p={p} game={game} />}
    </div>
  );
}

function TaskCard<T extends BaseTask>({ p, game }: { p: QuizScreenProps<T>; game: Game<T> }) {
  const { takeHint, answer, next } = p.useQuiz();
  const t = game.tasks[game.i];
  const a = game.answers[game.i];
  const last = game.i + 1 >= game.tasks.length;
  const go = () => { next(p.stufe); window.scrollTo({ top: 0 }); };
  const submit: Submit = r => { buzz(r.ok ? 20 : [40, 60, 40]); ding(r.ok); answer(p.stufe, { ...r, miss: diagnose(t, r)?.miss }); };
  useEffect(() => {
    if (!a) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) go(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  // Tastatur: nach der Antwort steht der Fokus auf „Weiter“, bei der nächsten Aufgabe auf der Frage (sonst fiele er an den Seitenanfang)
  const promptRef = useRef<HTMLParagraphElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);
  const lost = () => !document.activeElement || document.activeElement === document.body || (document.activeElement as HTMLButtonElement).disabled;
  useEffect(() => { if (game.i > 0 && lost()) promptRef.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => { if (a && lost()) nextRef.current?.querySelector<HTMLButtonElement>(".q-next")?.focus({ preventScroll: true }); }, [!!a]);
  // erster Schritt sichtbar: der Tipp steht schon da – kein Tipp-Knopf (er kostete sonst Punkte für etwas, das schon zu sehen ist)
  const faded = t.stage === "faded";
  // Tipp und erster Schritt ganz lesbar, ohne das Bild zu zerdrücken: passen sie nicht in die Karte (Inhalt liefe über, Bild abgeschnitten
  // oder niedriger als MIN_PIC), stehen sie in einem Blatt – „Tipp“ bzw. „Schritt 1“ öffnet es (wieder). Gemessen beim Erscheinen,
  // nicht bei jeder Größenänderung (sonst spränge der Tipp beim Tippen, wenn die Tastatur die Ansicht verkleinert).
  const bodyRef = useRef<HTMLDivElement>(null);
  const [aside, setAside] = useState({ hint: false, first: false });
  const [sheet, setSheet] = useState<"hint" | "first" | null>(null);
  const hintInline = game.hintUsed && !faded && !a && !aside.hint;
  const firstInline = faded && !a && !aside.first;
  // eben „Tipp“ gedrückt: passt er nicht, geht sein Blatt gleich auf (nach dem Neuladen nicht – dann erst auf „Tipp“)
  const tookHint = useRef(false);
  const hintRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const took = tookHint.current;
    tookHint.current = false;
    if (!(hintInline || firstInline) || !bodyRef.current) return;
    if (!crowded(bodyRef.current)) {
      // Tastatur und Screenreader: der Fokus geht auf den eben gezeigten Tipp (der Knopf bleibt fokussierbar, aria-disabled)
      if (took && hintInline) hintRef.current?.focus({ preventScroll: true });
      return;
    }
    setAside(s => ({ hint: s.hint || hintInline, first: s.first || firstInline }));
    if (took && hintInline) setSheet("hint");
  });
  const isMc = t.kind === "mc";
  const worked = t.stage === "worked";
  const visual = p.renderVisual?.(t);
  if (worked) return <WorkedCard p={p} t={t} onNext={go} last={last} />;
  const extra = a ? p.feedbackExtra?.(t, a) : null;
  const diag = a ? diagnose(t, a) : null;
  const terms = p.terms?.(t, !!a) ?? [];
  // „Begriffe“, die erst nach der Antwort dazukommen: Platz schon vorher (unsichtbar) – kein Knopf rückt
  const termSlot = termTool(p, terms).length || a ? termTool(p, terms) : termTool(p, p.terms?.(t, true) ?? []).map(x => ({ ...x, off: true }));
  return (
    <TermScope terms={terms}>
    <Card className={`task-card kind-${t.kind}${a ? " answered" : ""}${faded && !a ? " faded" : ""}`}>
      {t.lead && <p className="q-lead"><RichText text={t.lead} /></p>}
      <p className="q-prompt" ref={promptRef} tabIndex={-1}><RichText text={t.prompt} /></p>
      {/* neue Fertigkeit, zweite Begegnung: erster Schritt steht unter der Frage (verdeckt keine Antwortfläche) */}
      {firstInline && <p className="q-first"><Icon name="bulb" size={16} /><span><b>{tr("Erster Schritt: ", "First step: ")}</b><RichText text={t.hint} /></span></p>}
      <div className="q-body" ref={bodyRef}>
        {/* nach der Antwort darf das Bild kleiner werden; wäre es dann noch abgeschnitten oder winzig, fällt es weg (styles.css) */}
        {visual && <div className="q-visual"><Fit min={a ? 0.25 : undefined} minHeight={a ? MIN_PIC : undefined}>{visual}</Fit></div>}
        {isMc ? <McAnswer task={t as unknown as McTask} answered={a} submit={submit} renderOption={p.renderOption && (o => p.renderOption!(t, o))} optionLabel={p.optionLabel && (o => p.optionLabel!(t, o))} /> : p.renderAnswer?.(t, a, submit)}
        {hintInline && <div className="q-hint" ref={hintRef} tabIndex={-1}><Icon name="bulb" /><span><RichText text={t.hint} /></span></div>}
        {a && (
          <div className={`q-feedback ${a.ok ? "ok" : "bad"}`} role="status">
            <div className="fb-head"><Icon name={a.ok ? "check" : "x"} /><b>{a.ok ? praiseFor(t, game.hintUsed && !faded, game.streak, game.i) : t.explain ? tr("Noch nicht – hier der Grund", "Not yet – here is why") : tr("Noch nicht", "Not yet")}</b>{a.ok && <span className="fb-pts">+{a.gained}</span>}</div>
            {(diag?.why || (a.ok && t.rule)) && <p className={`fb-why${a.ok ? " ok" : ""}`}><Icon name={a.ok ? "check" : "bulb"} size={18} /><span><RichText text={diag?.why || t.rule!} /></span></p>}
            {!a.ok && !isMc && p.solution && <div className="fb-sol"><span>{tr("Richtig: ", "Correct: ")}</span>{p.solution(t)}</div>}
            {!a.ok && <p className="fb-exp"><RichText text={t.explain} /></p>}
          </div>
        )}
      </div>
      <div className="q-actions" ref={nextRef}>
        <QuizHelp tools={[...(p.tools?.(t) ?? []), ...termSlot, ...(p.feedbackExtra ? [{ id: "weg", label: tr("Lösung", "Solution"), icon: "board" as const, wide: true, content: extra, off: !extra }] : [])]}
          hint={!faded} hintCue={t.hintCue} onHint={() => { if (game.hintUsed) setSheet("hint"); else { tookHint.current = true; takeHint(p.stufe); } }} hintUsed={game.hintUsed} hintAgain={aside.hint}
          firstStep={faded && aside.first ? () => setSheet("first") : undefined} answered={!!a} explain={p.explain?.(game.level, t)}
          read={[("eq" in t && typeof (t as { eq?: unknown }).eq === "string") ? (t as { eq: string }).eq : "", t.lead ?? "", t.prompt, ...(isMc ? (t as unknown as McTask).options.map((o, i) => spokenOption(o, i, p.optionLabel?.(t, o))) : [])].filter(Boolean).join(". ")} />
        {/* „Weiter“ rechts in der Zeile – passt er nicht daneben, steht er in einer Zeile darüber (styles.css): die Hilfsmittel bleiben an ihrem Platz */}
        {a && <Button variant="primary" size="lg" iconRight="arrow" className="q-next" onClick={go}>{last ? tr("Auswertung", "Results") : tr("Weiter", "Next")}</Button>}
      </div>
      <Sheet open={!a && (sheet === "hint" ? aside.hint : sheet === "first" && aside.first)} title={sheet === "first" ? tr("Erster Schritt", "First step") : tr("Tipp", "Tip")}
        onClose={() => setSheet(null)}>
        <p className="q-hint-sheet"><Icon name="bulb" /><span><RichText text={t.hint} /></span></p>
      </Sheet>
    </Card>
    </TermScope>
  );
}

/** Mindesthöhe eines Aufgabenbilds in px: niedriger gestaucht ist es nicht mehr zu erkennen */
const MIN_PIC = 56;
/** Reicht der Platz der Karte nicht? Inhalt läuft über, ein Element mit `data-min-h` (Mindesthöhe des Moduls, z. B. eine Antwortfläche) ist niedriger,
 *  der Bildrahmen schrumpft durch Tipp bzw. ersten Schritt unter max(MIN_PIC, 60 % seiner Höhe ohne sie) – auch bei Bildern, die sich selbst einpassen
 *  (Container-Einheiten, Fit verkleinert dann nichts) –, oder das Bild ist in der Höhe so gestaucht, dass es abgeschnitten (Fit-Minimum 0,4) oder
 *  niedriger als MIN_PIC wäre. Gerechnet wird mit den Maßen selbst, nicht mit Fits Ergebnis (das steht im selben Durchlauf noch aus). */
function crowded(body: HTMLElement): boolean {
  if (body.scrollHeight > body.clientHeight + 1) return true;
  for (const e of body.querySelectorAll<HTMLElement>("[data-min-h]")) if (e.getBoundingClientRect().height < Number(e.dataset.minH) - 0.5) return true;
  const vis = body.querySelector<HTMLElement>(":scope > .q-visual");
  const extra = [...(body.closest(".task-card")?.querySelectorAll<HTMLElement>(".q-hint, .q-first") ?? [])];
  if (vis && extra.length) {
    // Höhe des Bildrahmens mit und (kurz ausgeblendet, im selben Durchlauf – nichts flackert) ohne Tipp bzw. ersten Schritt
    const now = vis.getBoundingClientRect().height;
    extra.forEach(e => { e.style.display = "none"; });
    const before = vis.getBoundingClientRect().height;
    extra.forEach(e => { e.style.display = ""; });
    if (now < before - 1 && now < Math.max(MIN_PIC, 0.6 * before)) return true;
  }
  const o = body.querySelector<HTMLElement>(":scope > .q-visual > .ui-fit"), i = o?.firstElementChild as HTMLElement | null;
  if (!o || !i || !o.clientWidth) return false;
  const h = Math.max(1, i.scrollHeight), sv = o.clientHeight / h;
  if (sv >= 1) return false;
  return sv < 0.4 || h * Math.min(sv, o.clientWidth / Math.max(1, i.scrollWidth)) < MIN_PIC;
}

/** Vorgemachtes Beispiel einer neuen Fertigkeit: Frage, Lösung markiert, Lösungsweg – zählt nicht, weiter mit „Jetzt du“ */
function WorkedCard<T extends BaseTask>({ p, t, onNext, last }: { p: QuizScreenProps<T>; t: T; onNext: () => void; last: boolean }) {
  const visual = p.renderVisual?.(t);
  const mc = t.kind === "mc" ? (t as unknown as McTask) : null;
  const shown: Answered = { ok: true, gained: 0, choice: mc?.answer };
  return (
    <TermScope terms={p.terms?.(t, true) ?? []}>
    <Card className={`task-card kind-${t.kind} answered worked`}>
      <p className="q-worked-tag"><Icon name="book" size={16} /> {tr("Vorgemacht – so löst man das", "Worked example – this is how")}</p>
      {t.lead && <p className="q-lead"><RichText text={t.lead} /></p>}
      <p className="q-prompt"><RichText text={t.prompt} /></p>
      <div className="q-body">
        {visual && <div className="q-visual"><Fit min={0.25} minHeight={MIN_PIC}>{visual}</Fit></div>}
        {mc ? <McAnswer task={mc} answered={shown} submit={() => {}} renderOption={p.renderOption && (o => p.renderOption!(t, o))} optionLabel={p.optionLabel && (o => p.optionLabel!(t, o))} />
          : p.solution && <div className="fb-sol"><span>{tr("Lösung: ", "Solution: ")}</span>{p.solution(t)}</div>}
        <div className="q-feedback ok q-worked-way">
          <p className="fb-exp"><b>1.</b><span><RichText text={t.hint} /></span></p>
          <p className="fb-exp"><b>2.</b><span><RichText text={t.explain} /></span></p>
        </div>
      </div>
      <div className="q-actions">
        <Button variant="primary" size="lg" iconRight="arrow" className="q-next" onClick={onNext}>{last ? tr("Auswertung", "Results") : tr("Verstanden – jetzt du", "Got it – your turn")}</Button>
      </div>
    </Card>
    </TermScope>
  );
}

/** Läuft ein Wort in `el` über mehrere Zeilen (Umbruch mitten im Wort)? Wörter = Zeichenfolgen ohne Leerzeichen, Bindestrich, Gedankenstrich, „/“,
 *  weichen Trennstrich und Nullbreite-Leerzeichen (dort umzubrechen ist erlaubt); Text in Zeichnungen (SVG), unsichtbarer Text für Screenreader
 *  und `skip` zählen nicht. */
export function wordBroken(el: Element, skip?: Element | null): boolean {
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const r = document.createRange();
  // Zeile eines Zeichens: das letzte Rechteck seines Bereichs (nach einem Umbruch am weichen Trennstrich zählt Chromium den Strich zum nächsten Zeichen)
  const line = (n: Node, i: number, len: number) => {
    r.setStart(n, i); r.setEnd(n, i + len);
    const rs = [...r.getClientRects()].filter(x => x.width > 0);
    return rs.length ? Math.round(rs[rs.length - 1].top) : null;
  };
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (n.parentElement?.closest("svg, .sr-only") || skip?.contains(n)) continue;
    for (const m of (n.textContent ?? "").matchAll(/[^\s\-‐–—/\u00AD\u200B]+/g)) {
      const first = [...m[0]][0], last = [...m[0]].pop()!;
      if (line(n, m.index!, first.length) !== line(n, m.index! + m[0].length - last.length, last.length)) return true;
    }
  }
  return false;
}

/** Antwort zum Vorlesen: „A: Text“, bei Bild-Antworten die neutrale Beschriftung bzw. nur „A: Bild“ */
export const spokenOption = (o: string, i: number, label?: string) => `${"ABCD"[i]}: ${label === undefined ? o : label || tr("Bild", "picture")}`;

export function McAnswer({ task, answered, submit, renderOption, optionLabel }: {
  task: McTask; answered: Answered | null; submit: Submit; renderOption?: (option: string) => ReactNode;
  /** Bild-Antwort: neutrale Beschriftung für Screenreader statt des Antworttexts (siehe `QuizScreenProps.optionLabel`) */
  optionLabel?: (option: string) => string | undefined;
}) {
  const long = task.options.some(o => o.length > 22);
  // zweispaltig nur, wenn jede Antwort in ihre Spalte passt (schmale Handys: „Kohlensäure“ ragte hinaus) – sonst einspaltig
  const ref = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  // einspaltig und trotzdem ein Wort zu breit (Formel, Elektronenkonfiguration, langer Name in „Lesbar“): Schrift in zwei Stufen etwas kleiner (bis 14 px)
  const [tight, setTight] = useState(0);
  const one = long || narrow || task.options.some(o => o.length > 12);
  useLayoutEffect(() => { setNarrow(false); setTight(0); }, [task]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // ein Wort, das nicht in seine Spalte passt, bräche mitten im Wort um („Thermoplas|t“, „3d|⁷“) – dann einspaltig, danach kleiner.
    // Gemessen wird jedes Wort jedes Textstücks im Knopf (auch bei eigener Darstellung, fett gesetzten Teilen, Formeln); umbrochen wird nur
    // an Leerzeichen und erlaubten Trennstellen (styles.css: overflow-wrap: break-word, nicht anywhere)
    const split = (b: HTMLElement) => wordBroken(b, b.querySelector(".mc-key"));
    const check = () => {
      if (![...el.querySelectorAll<HTMLElement>(".mc-btn")].some(b => b.scrollWidth > b.clientWidth + 1 || split(b))) return;
      if (!one) setNarrow(true); else setTight(t => Math.min(2, t + 1));
    };
    if (one && tight >= 2) return;
    check();
    addEventListener("resize", check);
    return () => removeEventListener("resize", check);
  });
  return (
    <NoTerms>
    <div ref={ref} className={`mc-grid${long ? " long" : ""}${one ? " one" : ""}${tight ? ` tight${tight}` : ""}`}>
      {task.options.map((o, i) => {
        const cls = answered ? (i === task.answer ? " right" : i === answered.choice ? " wrong" : " faded") : "";
        return (
          <button key={i} type="button" className={`mc-btn${cls}`} disabled={!!answered} onClick={() => submit({ ok: i === task.answer, choice: i })}>
            <span className="mc-key" aria-hidden="true">{answered && i === task.answer ? "✓" : answered && i === answered.choice ? "✗" : "ABCD"[i]}</span>
            {renderOption ? <OwnOption label={optionLabel?.(o)} i={i}>{renderOption(o)}</OwnOption> : <span className={long ? "mono" : undefined}>{o}</span>}
          </button>
        );
      })}
    </div>
    </NoTerms>
  );
}

/** eigene Darstellung einer Antwort; mit Beschriftung (Bild-Antwort) liest der Screenreader nur „Antwort A: …“, nicht die Beschriftungen im Bild */
function OwnOption({ label, i, children }: { label?: string; i: number; children: ReactNode }) {
  if (label === undefined) return <span className="mc-own">{children}</span>;
  return (
    <>
      <span className="mc-own" aria-hidden="true">{children}</span>
      <span className="sr-only">{tr("Antwort", "Answer")} {"ABCD"[i]}{label ? `: ${label}` : ""}</span>
    </>
  );
}

function Result<T extends BaseTask>({ p, game }: { p: QuizScreenProps<T>; game: Game<T> }) {
  const { start, quit, skills, typeStats, exams } = p.useQuiz();
  // „Heute fällig“ und „Schwächen üben“: nochmal nur, solange noch etwas fällig bzw. schwach ist (sonst wäre es eine Runde aus Level 1 unter falschem Namen)
  const open = pending(p, { skills, typeStats, exams });
  const again = game.level === "due" ? open.due.length > 0 : game.level === "weak" ? open.weak.length > 0 : true;
  const [review, setReview] = useState(false);
  const total = counted(game.tasks).length;
  const s = starsFor(game.correct, total);
  const msg = s === 3 ? tr("Ausgezeichnet!", "Excellent!") : s === 2 ? tr("Gut gemacht!", "Well done!") : s === 1 ? tr("Das wird – dranbleiben.", "Getting there – keep going.") : tr("Noch nicht – morgen sind diese Fertigkeiten wieder dran.", "Not yet – these skills come back tomorrow.");
  const wrong = game.tasks.map((t, i) => ({ t, a: game.answers[i] })).filter(x => x.a && !x.a.ok);
  const secs = Math.max(0, Math.round(((game.finishedAt ?? Date.now()) - game.startedAt) / 1000));
  const time = secs < 60 ? `${secs} s` : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")} min`;
  const ups = (game.upgrades ?? []).filter(u => u.stage === "sicher" || u.stage === "gemeistert");
  const name = (id: string) => p.typeName?.(id) ?? id;
  const missCount: Record<string, number> = {};
  for (const a of game.answers) if (a?.miss) missCount[a.miss] = (missCount[a.miss] ?? 0) + 1;
  const stone = Object.entries(missCount).sort((a, b) => b[1] - a[1]).map(([k]) => p.missName?.(k)).find(Boolean);
  // nie scrollen, auch mit vielen langen Fertigkeitsnamen (360 × 740, „Lesbar“): stufenweise kompakter (styles.css, data-fit) – zuletzt stehen
  // die neuen Stufen nur noch als Knopf „Neue Stufen (n)“ mit Blatt da
  const wrapRef = useRef<HTMLDivElement>(null);
  const [upsOpen, setUpsOpen] = useState(false);
  useFitSteps(wrapRef, 4, [ups.length, wrong.length, !!stone, !!game.newBest, getLang()]);
  const upItem = (u: { type: string; stage: Stage }) => <><i className={`sk sk-${u.stage}`} /> <span className="res-up-n">{name(u.type)}: {stageName(u.stage)}</span></>;
  return (
    <div className="quiz-wrap res-wrap" ref={wrapRef}>
      <Card className="result-card">
        <div className="big-stars"><Stars value={s} size={46} /></div>
        <h2>{msg}</h2>
        <p className="res-line"><b>{game.correct}</b> {tr("von", "of")} {total} {tr("richtig", "correct")} · <b>{Math.round((game.correct / total) * 100)} %</b> · {time}</p>
        {ups.length > 0 && (
          <>
            <p className="res-ups">
              {ups.map(u => <span key={u.type} className={`res-up st-${u.stage}`}>{upItem(u)}</span>)}
            </p>
            <Button variant="quiet" icon="star" className="res-ups-sum" onClick={() => setUpsOpen(true)}>{tr("Neue Stufen", "New stages")} ({ups.length})</Button>
          </>
        )}
        {stone && <p className="res-stone"><Icon name="x" size={16} /> {tr("Stolperstein", "Stumbling block")}: {stone}</p>}
        {game.newBest && <p className="new-best"><Icon name="trophy" size={18} /> {tr("Neuer Rekord", "New record")}: {game.score} {tr("Punkte", "points")}</p>}
        <p className="res-sub">{game.score} {tr("Punkte", "points")} · {tr("längste Serie", "longest streak")} {game.bestStreak}</p>
        <div className="btn-row center">
          {again && <Button variant="primary" icon="reset" onClick={() => { start(p.stufe, game.level, game.level === "due" ? open.due : undefined); window.scrollTo({ top: 0 }); }}>{tr("Nochmal", "Again")}</Button>}
          <Button variant={again ? undefined : "primary"} onClick={() => quit(p.stufe)}>{tr("Zur Levelauswahl", "Back to levels")}</Button>
        </div>
        {wrong.length > 0 && <Button variant="quiet" icon="book" onClick={() => setReview(true)}>{tr("Zum Wiederholen", "To review")} ({wrong.length})</Button>}
      </Card>
      {ups.length > 0 && (
        <Sheet open={upsOpen} title={tr("Neue Stufen", "New stages")} onClose={() => setUpsOpen(false)}>
          <ul className="res-ups-list">{ups.map(u => <li key={u.type} className={`res-up st-${u.stage}`}>{upItem(u)}</li>)}</ul>
        </Sheet>
      )}
      <Sheet open={review} title={tr("Zum Wiederholen", "To review")} onClose={() => setReview(false)}>
        <ol className="review">
          {wrong.map(({ t }, i) => (
            <li key={i}>
              <p className="rv-q"><RichText text={t.prompt} /></p>
              <p className="rv-a"><b>{tr("Lösung", "Solution")}:</b> {t.kind === "mc" ? (t as unknown as McTask).options[(t as unknown as McTask).answer] : p.solution?.(t)}</p>
              <p className="rv-e"><RichText text={t.explain} /></p>
            </li>
          ))}
        </ol>
      </Sheet>
      {wrong.length === 0 && <Note tone="ok" icon="star">{tr("Alles richtig – perfekte Runde!", "All correct – perfect round!")}</Note>}
    </div>
  );
}
