// Fertigkeiten (Aufgabentyp = Fertigkeit): Stufe je Fertigkeit und verteilte Wiederholung. Reine Logik, ohne React.
//   Stufen:  neu → geübt → sicher → gemeistert
//     neu         noch nie versucht
//     geübt       versucht, aber keine zwei Treffer in Folge
//     sicher      mindestens zwei Treffer in Folge
//     gemeistert  bei einer Wiederholung nach ≥ 7 Tagen Abstand wieder richtig (Wissen hat den Abstand überstanden)
//   Wiederholung: nach jedem Treffer an einem neuen Tag wächst der Abstand (1 → 3 → 7 → 14 → 30 Tage) – weitere Treffer am selben Tag
//   verlängern ihn nicht (sonst wäre nach einer Runde mit 4 gleichen Aufgaben schon „in 14 Tagen“); ein Fehler setzt die Serie zurück
//   und die Fertigkeit ist am nächsten Tag wieder fällig. Fällig = ab Tagesbeginn des Fälligkeitstags oder überfällig.
//   Prüfungstermin („Schularbeit am …“, trägt der Schüler selbst ein, bleibt auf dem Gerät): bis dahin wird der Abstand jeder
//   betroffenen Fertigkeit auf höchstens die halbe Restzeit gestaucht – so kommt jede mindestens zweimal dran, die letzte
//   Wiederholung am Vortag; neue Fertigkeiten werden zuerst eingeplant. Danach gelten wieder die normalen Abstände.

export interface SkillState {
  /** Treffer in Folge */
  s: number;
  /** Versuche gesamt */
  n: number;
  /** Treffer gesamt */
  right: number;
  /** letzter Versuch (ms) */
  last: number;
  /** nächste Wiederholung (ms, Mitternacht des Tages) */
  due: number;
  /** Stufe im Abstandsplan (1 → 1 Tag, 2 → 3 Tage …); fehlt bei altem Stand → s */
  k?: number;
  /** vorletzter Treffer (ms) – für den Abstand beim Meistern */
  prevRight?: number;
  /** bereits gemeistert (bleibt, bis zweimal hintereinander falsch) */
  mastered?: boolean;
}
export type Skills = Record<string, SkillState>;
export type Stage = "neu" | "geübt" | "sicher" | "gemeistert";
export const STAGES: Stage[] = ["neu", "geübt", "sicher", "gemeistert"];

const DAY = 86_400_000;
/** Abstand bis zur nächsten Wiederholung auf Stufe k des Abstandsplans (Tage) */
export const INTERVALS = [1, 3, 7, 14, 30];
export const intervalDays = (s: number) => INTERVALS[Math.min(Math.max(s - 1, 0), INTERVALS.length - 1)];

/** Zustand nach einer Antwort */
export function recordAnswer(sk: SkillState | undefined, ok: boolean, now = Date.now()): SkillState {
  const cur = sk ?? { s: 0, n: 0, right: 0, last: 0, due: 0 };
  if (ok) {
    const s = cur.s + 1;
    // Abstand wächst nur mit einem Treffer an einem neuen Tag
    const sameDay = cur.s > 0 && cur.last > 0 && daysBetween(cur.last, now) === 0;
    const k0 = cur.k ?? cur.s, k = sameDay ? Math.max(k0, 1) : k0 + 1;
    // gemeistert: schon sicher und der letzte Treffer liegt mindestens 7 Tage zurück
    const spaced = cur.s >= 2 && cur.last > 0 && daysBetween(cur.last, now) >= 7;
    return {
      s, k, n: cur.n + 1, right: cur.right + 1, last: now, prevRight: cur.last || undefined,
      due: addDays(now, intervalDays(k)),
      mastered: cur.mastered || spaced || undefined,
    };
  }
  return {
    s: 0, k: 0, n: cur.n + 1, right: cur.right, last: now, prevRight: cur.prevRight,
    due: addDays(now, 1),
    // zweimal hintereinander falsch: Meisterschaft verloren
    mastered: cur.s === 0 && cur.n > 0 ? undefined : cur.mastered,
  };
}

export function stageOf(sk?: SkillState): Stage {
  if (!sk || sk.n === 0) return "neu";
  if (sk.mastered && sk.s >= 1) return "gemeistert";
  if (sk.s >= 2) return "sicher";
  return "geübt";
}

/** Fällige Fertigkeiten, überfälligste zuerst. Ohne Prüfungstermin nur geübte; vor einer Prüfung auch neue (zuerst). */
export function dueSkills(skills: Skills = {}, ids: string[], now = Date.now(), exam?: Exam): string[] {
  const at = (id: string) => {
    const s = skills[id];
    if (s && s.n > 0) return dayStart(effectiveDue(s, id, now, exam));
    return inExam(exam, id, now) ? 0 : Infinity;
  };
  return ids.filter(id => at(id) <= now).sort((a, b) => at(a) - at(b));
}

/** Zusammenfassung für eine Gruppe von Fertigkeiten (z. B. ein Level) */
export function stageCounts(skills: Skills = {}, ids: string[]): Record<Stage, number> {
  const c: Record<Stage, number> = { neu: 0, geübt: 0, sicher: 0, gemeistert: 0 };
  for (const id of ids) c[stageOf(skills[id])]++;
  return c;
}

/** Tage bis zur nächsten Wiederholung (negativ = überfällig), null = nie geübt; vor einer Prüfung vorgezogen */
export function daysUntilDue(sk: SkillState | undefined, now = Date.now(), exam?: Exam, id = ""): number | null {
  if (!sk || sk.n === 0) return null;
  return daysBetween(now, effectiveDue(sk, id, now, exam));
}

// ── Prüfungstermin ──────────────────────────────────────────────────────────

/** Prüfungstermin: Mitternacht (Ortszeit) des Prüfungstags; `types` = betroffene Fertigkeiten (leer = alle) */
export interface Exam { date: number; types?: string[] }

/** Mitternacht (Ortszeit) des Tages von `t` */
export function dayStart(t = Date.now()): number { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }

/** Mitternacht n Kalendertage nach dem Tag von `t` – Wiederholungen sind ab Tagesbeginn fällig (auch über die Zeitumstellung) */
export function addDays(t: number, n: number): number { const d = new Date(dayStart(t)); d.setDate(d.getDate() + n); return d.getTime(); }

/** Kalendertage von a bis b (negativ, wenn b früher liegt) */
export const daysBetween = (a: number, b: number) => Math.round((dayStart(b) - dayStart(a)) / DAY);

/** Tage bis zur Prüfung: 0 = heute, negativ = vorbei */
export const examDays = (exam: Exam, now = Date.now()) => Math.round((exam.date - dayStart(now)) / DAY);

/** Gestauchter Abstand vor der Prüfung (Tage): halbe Restzeit, mindestens 1 */
export const examInterval = (days: number) => Math.max(1, Math.floor(days / 2));

/** Gilt der Termin (noch) für diese Fertigkeit? Am Prüfungstag selbst noch ja (gestern Geübtes kommt noch einmal). */
export const inExam = (exam: Exam | undefined, id: string, now = Date.now()): exam is Exam =>
  !!exam && examDays(exam, now) >= 0 && (!exam.types?.length || exam.types.includes(id));

/** Nächste Wiederholung – vor einer Prüfung vorgezogen */
export function effectiveDue(sk: SkillState, id: string, now = Date.now(), exam?: Exam): number {
  if (!inExam(exam, id, now)) return sk.due;
  return Math.min(sk.due, addDays(sk.last, examInterval(examDays(exam, now))));
}

// ── Wochenziel ──────────────────────────────────────────────────────────────

/** Montag 0:00 der Woche, in der `now` liegt (Ortszeit) */
export function weekStart(now = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

/** Runden dieser Woche – Zeitstempel beendeter Runden */
export function weeklyDone(rounds: number[] = [], now = Date.now()): number {
  const start = weekStart(now);
  return rounds.filter(t => t >= start && t <= now).length;
}

/**
 * Stolpersteine nach Wiedersicherwerden: Eine Fehlvorstellung verschwindet von der Landkarte, sobald jede Fertigkeit, in der sie
 * auftrat, wieder mindestens „sicher“ ist. `missBy` = Fehlvorstellung → Fertigkeiten (fehlt bei altem Stand: bleibt stehen).
 */
export function clearMisses(misses: Record<string, number>, missBy: Record<string, string[]>, skills: Skills): { misses: Record<string, number>; missBy: Record<string, string[]> } {
  const m = { ...misses }, by = { ...missBy };
  for (const [key, types] of Object.entries(by)) {
    if (types.length && types.every(t => STAGES.indexOf(stageOf(skills[t])) >= STAGES.indexOf("sicher"))) { delete m[key]; delete by[key]; }
  }
  return { misses: m, missBy: by };
}
