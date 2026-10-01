// Quiz-State je App (zustand + localStorage): laufende Runden je Stufe, Fortschritt je Level, Statistik je Aufgabentyp,
// Fertigkeiten mit Wiederholungsterminen und beendete Runden (Wochenziel).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { RECENT_MAX, freshRound, recordStat, starsFor, taskKey, type Answered, type BaseTask, type Game, type LevelKey, type LevelProgress, type TypeStats } from "./types.ts";
import { STAGES, dueSkills, recordAnswer, stageOf, type Exam, type Skills } from "./skills.ts";

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
      exams: {},
      recent: {},
      ...cfg.seed?.(),

      start: (stufe, level, dueIds) => {
        const sk = get().skills[stufe] ?? {};
        const due = level === "due" ? (dueIds ?? dueSkills(sk, Object.keys(sk), Date.now(), get().exams[stufe])) : undefined;
        const tasks = freshRound(() => cfg.makeRound(stufe, level, get().typeStats[stufe], due), get().recent[stufe] ?? [], 10, !!cfg.fixedOrder && typeof level === "number");
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
        if (g.answers[g.i]) return g;
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
          set({ misses: { ...all, [stufe]: m } });
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
        if (!g || !g.answers[g.i]) return;
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
              stars: Math.max(prev.stars, starsFor(g.correct, g.tasks.length)), best: Math.max(prev.best, g.score),
              rounds: prev.rounds + 1, correct: prev.correct + g.correct, total: prev.total + g.tasks.length, last: g.score,
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
    partialize: s => ({ games: s.games, progress: s.progress, typeStats: s.typeStats, skills: s.skills, rounds: s.rounds, misses: s.misses, exams: s.exams, recent: s.recent }),
  }));
}
