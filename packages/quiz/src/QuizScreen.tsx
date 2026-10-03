// Quiz-Oberfläche: Levelauswahl → Erklärung (beim ersten Mal) → Aufgaben → Auswertung.
// Multiple Choice ist eingebaut; weitere Aufgabentypen stellt die App über renderAnswer bereit.

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import { Button, Card, Fit, Icon, IconButton, Note, ResultBar, RichText, Sheet, Stars, Tag, buzz, ding, getLang, tr, type IconName } from "@lern/ui";
import { diagnose, starsFor, weakTypes, type Answered, type BaseTask, type Game, type LevelKey, type McTask, type QuizLevel, type Submit } from "./types.ts";
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
}

/** Hilfsmittel während einer Aufgabe: Inhalt passt sich der Aufgabe an */
export interface QuizTool { id: string; label: string; icon: IconName; content: ReactNode; wide?: boolean }

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

/** Vorlesen mit der Sprachausgabe des Geräts (Deutsch); vorhandene Ausgabe wird abgebrochen */
export function speak(text: string) {
  try {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(speakable(text));
    const l = getLang();
    u.lang = l === "en" ? "en-GB" : "de-AT";
    u.rate = 0.95;
    const v = speechSynthesis.getVoices().find(x => x.lang.startsWith(l));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch { /* keine Sprachausgabe */ }
}

const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

export function QuizHelp({ tools = [], hint, hintCue, onHint, hintUsed, answered, explain, read }: {
  tools?: QuizTool[]; hint?: boolean; hintCue?: boolean; onHint?: () => void; hintUsed?: boolean; answered: boolean; explain?: ReactNode;
  /** Text zum Vorlesen (Aufgabe) – Knopf erscheint nur, wenn das Gerät vorlesen kann */
  read?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const tool = tools.find(t => t.id === open);
  return (
    <>
      <span className="q-help">
        {read && canSpeak && <Button variant="quiet" icon="sound" aria-label={tr("Aufgabe vorlesen", "Read task aloud")} onClick={() => speak(read)}>{tr("Vorlesen", "Read aloud")}</Button>}
        {hint && !answered && <Button variant="quiet" icon="bulb" className={hintCue && !hintUsed ? "q-hint-cue" : undefined} onClick={onHint} disabled={hintUsed}
          aria-label={hintCue ? tr("Tipp zu dieser Aufgabe", "Tip for this task") : undefined}>{tr("Tipp", "Tip")}</Button>}
        {tools.map(t => <Button key={t.id} variant="quiet" icon={t.icon} onClick={() => setOpen(t.id)}>{t.label}</Button>)}
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
  const due = dueSkills(sk, allTypes, Date.now(), exam);
  const weak = p.typeName ? weakTypes(typeStats[p.stufe], id => !!p.typeName!(id)) : [];
  const done = weeklyDone(rounds[p.stufe]);
  // Rückkehr nach einer Pause von mindestens 7 Tagen: begrüßen statt Wochenziel zeigen (keine Schuld)
  const lastRound = Math.max(0, ...(rounds[p.stufe] ?? []));
  const back = done === 0 && lastRound > 0 && Date.now() - lastRound >= 7 * 86_400_000;
  const name = (id: string) => p.typeName?.(id) ?? id;
  const go = (level: LevelKey) => { start(p.stufe, level, level === "due" ? due : undefined); onStart(); window.scrollTo({ top: 0 }); };
  const examOn = !!exam && examIn !== null && examIn >= 0;
  const examIds = exam?.types?.length ? exam.types : allTypes;
  const examCount = stageCounts(sk, examIds);
  const card = (level: LevelKey, n: ReactNode, title: string, desc: string, ids?: string[], tip?: boolean) => {
    const pr = progress[p.levelId(level)];
    const c = ids ? stageCounts(sk, ids) : null;
    return (
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

/** Nie scrollen: setzt data-fit = 0, 1, … max, bis weder die Seite noch ein scrollbarer Vorfahr (Blatt) überläuft; misst bei Größenänderung neu */
function useFitSteps(ref: RefObject<HTMLElement | null>, max: number, deps: unknown[]) {
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
  useFitSteps(mapRef, 2, [levels.length, stones.length, !!exam]);
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
          <div className="q-prog-lbl"><span>{p.levelName(game.level)}</span><span>{tr("Aufgabe", "Task")} {game.i + 1} / {game.tasks.length}</span></div>
          <ResultBar results={game.answers.map(a => (a ? a.ok : null))} />
        </div>
        <div className="q-score" aria-label={tr(`${game.score} Punkte`, `${game.score} points`)}>{game.score}<small>{tr("Pkt", "pts")}</small></div>
        <div className={`q-streak${game.streak >= 2 ? " hot" : ""}`} aria-label={tr(`Serie ${game.streak}`, `Streak ${game.streak}`)}><Icon name="fire" />{game.streak}</div>
      </div>
      {game.intro && game.i === 0 && !game.answers[0] && p.explain
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
  const isMc = t.kind === "mc";
  const visual = p.renderVisual?.(t);
  const extra = a ? p.feedbackExtra?.(t, a) : null;
  const diag = a ? diagnose(t, a) : null;
  return (
    <Card className={`task-card kind-${t.kind}${a ? " answered" : ""}`}>
      {t.lead && <p className="q-lead"><RichText text={t.lead} /></p>}
      <p className="q-prompt" ref={promptRef} tabIndex={-1}><RichText text={t.prompt} /></p>
      <div className="q-body">
        {visual && <div className="q-visual"><Fit>{visual}</Fit></div>}
        {isMc ? <McAnswer task={t as unknown as McTask} answered={a} submit={submit} renderOption={p.renderOption && (o => p.renderOption!(t, o))} /> : p.renderAnswer?.(t, a, submit)}
        {game.hintUsed && !a && <div className="q-hint"><Icon name="bulb" /><span><RichText text={t.hint} /></span></div>}
        {a && (
          <div className={`q-feedback ${a.ok ? "ok" : "bad"}`} role="status">
            <div className="fb-head"><Icon name={a.ok ? "check" : "x"} /><b>{a.ok ? praiseFor(t, game.hintUsed, game.streak, game.i) : t.explain ? tr("Noch nicht – hier der Grund", "Not yet – here is why") : tr("Noch nicht", "Not yet")}</b>{a.ok && <span className="fb-pts">+{a.gained}</span>}</div>
            {diag?.why && <p className={`fb-why${a.ok ? " ok" : ""}`}><Icon name={a.ok ? "check" : "bulb"} size={18} /><span><RichText text={diag.why} /></span></p>}
            {!a.ok && !isMc && p.solution && <div className="fb-sol"><span>{tr("Richtig: ", "Correct: ")}</span>{p.solution(t)}</div>}
            {!a.ok && <p className="fb-exp"><RichText text={t.explain} /></p>}
          </div>
        )}
      </div>
      <div className="q-actions" ref={nextRef}>
        <QuizHelp tools={[...(p.tools?.(t) ?? []), ...(extra ? [{ id: "weg", label: tr("Lösung", "Solution"), icon: "board" as const, wide: true, content: extra }] : [])]}
          hint hintCue={t.hintCue} onHint={() => takeHint(p.stufe)} hintUsed={game.hintUsed} answered={!!a} explain={p.explain?.(game.level, t)}
          read={[("eq" in t && typeof (t as { eq?: unknown }).eq === "string") ? (t as { eq: string }).eq : "", t.lead ?? "", t.prompt, ...(isMc ? (t as unknown as McTask).options.map((o, i) => `${"ABCD"[i]}: ${o}`) : [])].filter(Boolean).join(". ")} />
        {a && <Button variant="primary" size="lg" iconRight="arrow" className="q-next" onClick={go}>{last ? tr("Auswertung", "Results") : tr("Weiter", "Next")}</Button>}
      </div>
    </Card>
  );
}

export function McAnswer({ task, answered, submit, renderOption }: { task: McTask; answered: Answered | null; submit: Submit; renderOption?: (option: string) => ReactNode }) {
  const long = task.options.some(o => o.length > 22);
  // zweispaltig nur, wenn jede Antwort in ihre Spalte passt (schmale Handys: „Kohlensäure“ ragte hinaus) – sonst einspaltig
  const ref = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  const one = long || narrow || task.options.some(o => o.length > 12);
  useLayoutEffect(() => setNarrow(false), [task]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || one) return;
    const check = () => { if ([...el.querySelectorAll<HTMLElement>(".mc-btn")].some(b => b.scrollWidth > b.clientWidth + 1)) setNarrow(true); };
    check();
    addEventListener("resize", check);
    return () => removeEventListener("resize", check);
  });
  return (
    <div ref={ref} className={`mc-grid${long ? " long" : ""}${one ? " one" : ""}`}>
      {task.options.map((o, i) => {
        const cls = answered ? (i === task.answer ? " right" : i === answered.choice ? " wrong" : " faded") : "";
        return (
          <button key={i} type="button" className={`mc-btn${cls}`} disabled={!!answered} onClick={() => submit({ ok: i === task.answer, choice: i })}>
            <span className="mc-key" aria-hidden="true">{answered && i === task.answer ? "✓" : answered && i === answered.choice ? "✗" : "ABCD"[i]}</span>
            {renderOption ? <span className="mc-own">{renderOption(o)}</span> : <span className={long ? "mono" : undefined}>{o}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Result<T extends BaseTask>({ p, game }: { p: QuizScreenProps<T>; game: Game<T> }) {
  const { start, quit } = p.useQuiz();
  const [review, setReview] = useState(false);
  const total = game.tasks.length;
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
  return (
    <div className="quiz-wrap">
      <Card className="result-card">
        <div className="big-stars"><Stars value={s} size={46} /></div>
        <h2>{msg}</h2>
        <p className="res-line"><b>{game.correct}</b> {tr("von", "of")} {total} {tr("richtig", "correct")} · <b>{Math.round((game.correct / total) * 100)} %</b> · {time}</p>
        {ups.length > 0 && (
          <p className="res-ups">
            {ups.map(u => <span key={u.type} className={`res-up st-${u.stage}`}><i className={`sk sk-${u.stage}`} /> {name(u.type)}: {stageName(u.stage)}</span>)}
          </p>
        )}
        {stone && <p className="res-stone"><Icon name="x" size={16} /> {tr("Stolperstein", "Stumbling block")}: {stone}</p>}
        {game.newBest && <p className="new-best"><Icon name="trophy" size={18} /> {tr("Neuer Rekord", "New record")}: {game.score} {tr("Punkte", "points")}</p>}
        <p className="res-sub">{game.score} {tr("Punkte", "points")} · {tr("längste Serie", "longest streak")} {game.bestStreak}</p>
        <div className="btn-row center">
          <Button variant="primary" icon="reset" onClick={() => { start(p.stufe, game.level); window.scrollTo({ top: 0 }); }}>{tr("Nochmal", "Again")}</Button>
          <Button onClick={() => quit(p.stufe)}>{tr("Zur Levelauswahl", "Back to levels")}</Button>
        </div>
        {wrong.length > 0 && <Button variant="quiet" icon="book" onClick={() => setReview(true)}>{tr("Zum Wiederholen", "To review")} ({wrong.length})</Button>}
      </Card>
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
