// Quiz-State je App (zustand + localStorage): laufende Runden je Stufe, Fortschritt je Level, Statistik je Aufgabentyp,
// Fertigkeiten mit Wiederholungsterminen und beendete Runden (Wochenziel).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { RECENT_MAX, counted, freshRound, recordStat, starsFor, taskKey, type Answered, type BaseTask, type Game, type LevelKey, type LevelProgress, type TypeStats } from "./types.ts";
import { STAGES, clearMisses, dueSkills, recordAnswer, stageOf, type Exam, type Skills } from "./skills.ts";

export interface QuizState<T extends BaseTask> {
  games: Record<string, Game<T> | undefined>;
  progress: Record<string, LevelProgress>;
  typeStats: Record<string, TypeStats | undefined>;
  /** Fertigkeit (Aufgabentyp) → Stufe und Wiederholungstermin, je Stufe */
  skills: Record<string, Skills | undefined>;
  /** Zeitstempel beendeter Runden je Stufe (für das Wochenziel) */
  rounds: Record<string, number[] | undefined>;
  /** Fehlvorstellung → wie oft getroffen, je Stufe (Stolpersteine) */
  misses: Record<string, Record<string, number> | undefined>;
  /** Fehlvorstellung → Fertigkeiten, in denen sie auftrat, je Stufe (Stolperstein verschwindet, sobald alle wieder sicher sind) */
  missBy: Record<string, Record<string, string[]> | undefined>;
  /** Prüfungstermin je Stufe („Schularbeit am …“), vom Schüler eingetragen */
  exams: Record<string, Exam | undefined>;
  /** zuletzt gestellte Fragen je Stufe (Kennungen, neueste zuletzt) – neue Runden meiden sie */
  recent: Record<string, string[] | undefined>;
  /** Runde starten; `due` = fällige Fertigkeiten für Level "due" (sonst aus den Fertigkeiten berechnet) */
  start: (stufe: string, level: LevelKey, due?: string[]) => void;
  setExam: (stufe: string, exam: Exam | null) => void;
  takeHint: (stufe: string) => void;
  dismissIntro: (stufe: string) => void;
  answer: (stufe: string, a: Omit<Answered, "gained">) => void;
  next: (stufe: string) => void;
  quit: (stufe: string) => void;
}

export interface QuizConfig<T extends BaseTask> {
  /** Schlüssel im localStorage, z. B. "ionenbindung-quiz" */
  storageKey: string;
  /** eindeutige Level-id, z. B. "us-1" */
  levelId: (stufe: string, level: LevelKey) => string;
  /** 10 Aufgaben für eine Runde erzeugen; `due` = fällige Fertigkeiten (für Level "due") */
  makeRound: (stufe: string, level: LevelKey, stats?: TypeStats, due?: string[]) => T[];
  /** Anfangswerte, z. B. aus einer älteren Speicherung übernommen */
  seed?: () => Partial<Pick<QuizState<T>, "progress" | "typeStats">>;
  /** Level (Zahl) mit fester Reihenfolge der Aufgabentypen – Wiederholungen werden nur innerhalb des Typs ersetzt */
  fixedOrder?: boolean;
  /** freiwillig: Stolperstein verschwindet, sobald die Fertigkeiten, in denen er auftrat, wieder sicher sind (merkt dazu `missBy`) */
  missRecovery?: boolean;
  /** freiwillig: zwei Aufgaben gelten als gleich (gelöstes Beispiel muss sich davon unterscheiden) */
  sameTask?: (a: T, b: T) => boolean;
}

/** höchstens so viele vorgemachte Beispiele je Runde */
const MAX_EXAMPLES = 3;

/**
 * Lernen an Beispielen: für jede Fertigkeit der Runde, die noch nie geübt wurde, vor der ersten Aufgabe ein gelöstes
 * Beispiel derselben Art (aus einer zweiten Runde, andere Frage); die erste echte Aufgabe zeigt den ersten Schritt (Tipp).
 */
export function withExamples<T extends BaseTask>(tasks: T[], skills: Skills, more: () => T[], same?: (a: T, b: T) => boolean): T[] {
  const fresh = [...new Set(tasks.map(t => t.type).filter((x): x is string => !!x && !skills[x]))].slice(0, MAX_EXAMPLES);
  if (!fresh.length) return tasks;
  // Beispiele aus weiteren Runden: so lange ziehen, bis jede neue Fertigkeit eine andere Frage derselben Art hat
  const pool: T[] = [];
  for (let k = 0; k < 8 && !fresh.every(f => pool.filter(o => o.type === f).length > tasks.filter(t => t.type === f).length); k++) pool.push(...more());
  // gleiche Frage = gleiche Daten (gleicher Text reicht nicht: „Wie viele Teilchen?“ mit anderem Bild ist eine andere Aufgabe)
  // Reihenfolge der Antworten zählt nicht (gemischt ist es dieselbe Frage); Rückmeldungen hängen am Index und fallen deshalb heraus
  const key = (t: T) => {
    const o = t as T & { options?: unknown[]; answer?: number };
    const opts = Array.isArray(o.options) ? o.options.map(x => JSON.stringify(x)) : undefined;
    return JSON.stringify({ ...t, stage: undefined, lead: undefined, why: undefined, miss: undefined,
      ...(opts ? { options: [...opts].sort(), answer: typeof o.answer === "number" ? opts[o.answer] : o.answer } : {}) });
  };
  const out: T[] = [], used = new Set(tasks.map(key));
  const done = new Set<string>();
  for (const t of tasks) {
    if (t.type && fresh.includes(t.type) && !done.has(t.type)) {
      done.add(t.type);
      // `same` (freiwillig, je Modul): strengerer Vergleich, z. B. gleiche Frage mit gleichem Bild trotz anderer Antwortauswahl
      const ex = pool.find(o => o.type === t.type && !used.has(key(o)) && !(same && tasks.some(x => same(o, x))));
      if (ex) { used.add(key(ex)); out.push({ ...ex, lead: undefined, stage: "worked" }); }
      out.push({ ...t, stage: "faded" });
    } else out.push(t);
  }
  return out;
}

export function createQuizStore<T extends BaseTask>(cfg: QuizConfig<T>) {
  return create<QuizState<T>>()(persist((set, get) => {
    const update = (stufe: string, fn: (g: Game<T>) => Game<T>) => {
      const g = get().games[stufe];
      if (!g || g.finished) return;
      set({ games: { ...get().games, [stufe]: fn(g) } });
    };
    return {
      games: {},
      progress: {},
      typeStats: {},
      skills: {},
      rounds: {},
      misses: {},
      missBy: {},
      exams: {},
      recent: {},
      ...cfg.seed?.(),

      start: (stufe, level, dueIds) => {
        const sk = get().skills[stufe] ?? {};
        const due = level === "due" ? (dueIds ?? dueSkills(sk, Object.keys(sk), Date.now(), get().exams[stufe])) : undefined;
        const round = freshRound(() => cfg.makeRound(stufe, level, get().typeStats[stufe], due), get().recent[stufe] ?? [], 10, !!cfg.fixedOrder && typeof level === "number");
        // neue Fertigkeiten: erst ein gelöstes Beispiel derselben Art, dann die Aufgabe mit sichtbarem ersten Schritt, danach frei
        const tasks = level === "due" || level === "weak" ? round : withExamples(round, sk, () => cfg.makeRound(stufe, level, get().typeStats[stufe], due), cfg.sameTask);
        const game: Game<T> = {
          stufe, level, tasks, i: 0, score: 0, streak: 0, bestStreak: 0, correct: 0, hintUsed: false,
          answers: tasks.map(() => null), startedAt: Date.now(), finished: false,
          intro: typeof level === "number" && !get().progress[cfg.levelId(stufe, level)],
        };
        set({ games: { ...get().games, [stufe]: game } });
      },
      setExam: (stufe, exam) => set({ exams: { ...get().exams, [stufe]: exam ?? undefined } }),
      takeHint: stufe => update(stufe, g => ({ ...g, hintUsed: true })),
      dismissIntro: stufe => update(stufe, g => ({ ...g, intro: false })),
      answer: (stufe, a) => update(stufe, g => {
        if (g.answers[g.i] || g.tasks[g.i]?.stage === "worked") return g;
        const type = g.tasks[g.i].type;
        const key = taskKey(g.tasks[g.i]), rec = get().recent;
        set({ recent: { ...rec, [stufe]: [...(rec[stufe] ?? []).filter(k => k !== key), key].slice(-RECENT_MAX) } });
        let upgrades = g.upgrades;
        if (type) {
          const all = get().typeStats, st = { ...all[stufe] };
          // Fertigkeit fortschreiben; erreichte Stufen für die Auswertung merken
          const allSk = get().skills, sk = { ...allSk[stufe] };
          const before = stageOf(sk[type]);
          sk[type] = recordAnswer(sk[type], a.ok);
          st[type] = recordStat(st[type], a.ok, sk[type].s >= 2);
          const after = stageOf(sk[type]);
          if (STAGES.indexOf(after) > STAGES.indexOf(before)) upgrades = [...(upgrades ?? []).filter(u => u.type !== type), { type, stage: after }];
          set({ typeStats: { ...all, [stufe]: st }, skills: { ...allSk, [stufe]: sk } });
        }
        if (a.miss) {
          const all = get().misses, m = { ...all[stufe] };
          m[a.miss] = (m[a.miss] ?? 0) + 1;
          if (cfg.missRecovery) {
            const allBy = get().missBy ?? {}, by = { ...allBy[stufe] };
            if (type) by[a.miss] = [...new Set([...(by[a.miss] ?? []), type])];
            set({ misses: { ...all, [stufe]: m }, missBy: { ...allBy, [stufe]: by } });
          } else set({ misses: { ...all, [stufe]: m } });
        } else if (cfg.missRecovery && a.ok && type) {
          const r = clearMisses(get().misses[stufe] ?? {}, (get().missBy ?? {})[stufe] ?? {}, get().skills[stufe] ?? {});
          set({ misses: { ...get().misses, [stufe]: r.misses }, missBy: { ...(get().missBy ?? {}), [stufe]: r.missBy } });
        }
        const streak = a.ok ? g.streak + 1 : 0;
        // in Leveln mit Tipp (hintCue) kostet der Tipp keine Punkte – er gehört dort zum Lernweg
        const gained = a.ok ? (g.hintUsed && !g.tasks[g.i]?.hintCue ? 5 : 10) + (streak >= 3 ? Math.min(10, (streak - 2) * 2) : 0) : 0;
        const answers = g.answers.slice();
        answers[g.i] = { ...a, gained };
        return { ...g, answers, streak, upgrades, bestStreak: Math.max(g.bestStreak, streak), correct: g.correct + (a.ok ? 1 : 0), score: g.score + gained };
      }),
      next: stufe => {
        const s = get(), g = s.games[stufe];
        if (!g || (!g.answers[g.i] && g.tasks[g.i]?.stage !== "worked")) return;
        if (g.i + 1 < g.tasks.length) {
          set({ games: { ...s.games, [stufe]: { ...g, i: g.i + 1, hintUsed: false } } });
          return;
        }
        const id = cfg.levelId(stufe, g.level);
        const prev = s.progress[id] ?? { stars: 0, best: 0, rounds: 0, correct: 0, total: 0 };
        set({
          progress: {
            ...s.progress,
            [id]: {
              stars: Math.max(prev.stars, starsFor(g.correct, counted(g.tasks).length)), best: Math.max(prev.best, g.score),
              rounds: prev.rounds + 1, correct: prev.correct + g.correct, total: prev.total + counted(g.tasks).length, last: g.score,
            },
          },
          games: { ...s.games, [stufe]: { ...g, finished: true, finishedAt: Date.now(), newBest: prev.rounds > 0 && g.score > prev.best } },
          rounds: { ...s.rounds, [stufe]: [...(s.rounds[stufe] ?? []).slice(-29), Date.now()] },
        });
      },
      quit: stufe => set({ games: { ...get().games, [stufe]: undefined } }),
    };
  }, {
    name: cfg.storageKey,
    version: 1,
    storage: createJSONStorage(() => localStorage),
    partialize: s => ({ games: s.games, progress: s.progress, typeStats: s.typeStats, skills: s.skills, rounds: s.rounds, misses: s.misses, ...(cfg.missRecovery ? { missBy: s.missBy } : {}), exams: s.exams, recent: s.recent }),
  }));
}
