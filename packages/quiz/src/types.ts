// Gemeinsame Typen. Aufgaben sind reine Daten (JSON-fähig), damit Runden gespeichert werden können.

import type { Stage } from "./skills.ts";

export interface BaseTask {
  kind: string;
  /** Frage, Tipp, Erklärung – **fett** und `Code` werden formatiert */
  prompt: string;
  /** Lern-Level: kurzer Merksatz vor der Frage (baut auf der vorigen Aufgabe auf), klein über der Frage */
  lead?: string;
  hint: string;
  explain: string;
  /** Aufgabentyp (für „Schwächen üben“), wird von der Runde gesetzt */
  type?: string;
  /** Lob nach einem Treffer, das die Strategie nennt („Ladung zuerst gezählt – genau so geht's.“); sonst neutrales Lob */
  praise?: string;
  /** kurze Regel nach der richtigen Antwort, wenn die Antwort selbst keine Rückmeldung (`why`) hat (z. B. Antippen, Ordnen) */
  rule?: string;
  /** Diagnose für Eingabe-Aufgaben: trifft ein eingegebener Wert eine Falle, nennt die Rückmeldung die Fehlvorstellung */
  traps?: Trap[];
  /** Level mit Tipp: der Tipp ist auf die Aufgabe zugeschnitten – Knopf hervorgehoben („Tipp antippen“) */
  hintCue?: boolean;
  /** neue Fertigkeit, von der Runde gesetzt: „worked“ = gelöstes Beispiel zum Ansehen (zählt nicht),
   *  „faded“ = die nächste Aufgabe dieser Art mit sichtbarem ersten Schritt (Tipp ohne Abzug) */
  stage?: "worked" | "faded";
}

/** Aufgaben, die zählen (ohne vorgemachte Beispiele) */
export const counted = <T extends BaseTask>(tasks: T[]) => tasks.filter(t => t.stage !== "worked");

/** Falle bei Eingabe-Aufgaben: Feld `field` hat genau `value` (oder mindestens `min`) → Fehlvorstellung `miss` */
export interface Trap {
  /** ein Feld: gleich `value` oder mindestens `min` … */
  field?: string; value?: number; min?: number;
  /** … oder mehrere Felder, die alle genau passen müssen (z. B. Indizes vertauscht) */
  values?: Record<string, number>;
  miss: string; why: string;
}

/**
 * Fallen aussortieren, die auf den richtigen Wert zeigen (z. B. H-1: Massenzahl 1 = Elektronenzahl 1) –
 * sonst würde eine richtige Eingabe in einem Feld als Fehler erklärt, wenn ein anderes Feld falsch ist.
 * Doppelte Fallen (gleiches Feld, gleicher Wert) bleiben nur einmal.
 */
export function validTraps(traps: Trap[], correct: Record<string, number>): Trap[] {
  const seen = new Set<string>();
  return traps.filter(t => {
    if (t.values) return !Object.entries(t.values).every(([k, v]) => correct[k] === v);
    if (t.field === undefined) return true;
    const c = correct[t.field];
    if (t.value !== undefined && t.value === c) return false;
    if (t.min !== undefined && c !== undefined && c >= t.min) return false;
    const key = `${t.field}:${t.value}:${t.min}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Falsche Antwortmöglichkeit: bloßer Text oder mit Diagnose – Fehlvorstellung `miss` (Schlüssel) und Rückmeldung `why` */
export interface Diag { text: string; miss?: string; why?: string }
export type Distractor = string | Diag | null | undefined;

/** Multiple Choice – wird vom Quiz selbst dargestellt. `why`/`miss` je Option (gleicher Index wie `options`). */
export interface McTask extends BaseTask {
  kind: "mc"; options: string[]; answer: number;
  /** je Options-Index: Rückmeldungssatz (bei der richtigen Antwort der Bestätigungssatz) – nur gesetzte Einträge, JSON-fähig */
  why?: Record<number, string>;
  /** je Options-Index: Schlüssel der Fehlvorstellung (Stolperstein) */
  miss?: Record<number, string>;
}

export interface Answered { ok: boolean; gained: number; choice?: number; values?: Record<string, number>; miss?: string }
export type Submit = (a: Omit<Answered, "gained">) => void;

/** Zahl = Level-Index, "mix" = alles gemischt, "weak" = Schwächen üben, "due" = heute fällige Wiederholungen */
export type LevelKey = number | "mix" | "weak" | "due";

/** Level mit seinen Fertigkeiten (Aufgabentyp-ids) – die Landkarte zeigt je Fertigkeit die Stufe */
/** `tip`: Level mit zugeschnittenem Tipp je Aufgabe (Glühbirne an der Karte) */
export interface QuizLevel { id: string; name: string; desc: string; types?: string[]; tip?: boolean }

export interface Game<T extends BaseTask = BaseTask> {
  stufe: string;
  level: LevelKey;
  tasks: T[];
  i: number;
  score: number;
  streak: number;
  bestStreak: number;
  correct: number;
  hintUsed: boolean;
  answers: (Answered | null)[];
  startedAt: number;
  finished: boolean;
  finishedAt?: number;
  newBest?: boolean;
  intro?: boolean;
  /** in dieser Runde erreichte Stufen (für die Auswertung) */
  upgrades?: { type: string; stage: Stage }[];
}

export interface LevelProgress { stars: number; best: number; rounds: number; correct: number; total: number; last?: number }
export type TypeStats = Record<string, { right: number; wrong: number }>;

export const starsFor = (correct: number, total: number) => {
  const r = correct / total;
  return r >= 0.9 ? 3 : r >= 0.7 ? 2 : r >= 0.5 ? 1 : 0;
};

/** Statistik je Aufgabentyp nach einer Antwort. Ist die Fertigkeit danach wieder sicher (2 Treffer in Folge),
 *  zählen alte Fehler nicht mehr – „Schwächen üben“ verschwindet, sobald die Schwäche behoben ist (keine Schuld). */
export function recordStat(cur: { right: number; wrong: number } | undefined, ok: boolean, secure: boolean): { right: number; wrong: number } {
  const c = cur ?? { right: 0, wrong: 0 };
  if (!ok) return { ...c, wrong: c.wrong + 1 };
  return { right: c.right + 1, wrong: secure ? 0 : c.wrong };
}

/** Die bis zu drei Aufgabentypen mit der höchsten (geglätteten) Fehlerquote – nur Typen mit Fehlern */
export function weakTypes(stats: TypeStats = {}, known?: (id: string) => boolean): string[] {
  return Object.entries(stats)
    .filter(([id, s]) => (!known || known(id)) && s.wrong > 0)
    .map(([id, s]) => ({ id, rate: (s.wrong + 1) / (s.right + s.wrong + 2) }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3)
    .map(x => x.id);
}

// ── Zufall für Aufgabengeneratoren ──────────────────────────────────────────
export const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/** Distraktor mit Diagnose: Text, Schlüssel der Fehlvorstellung (Katalog `misconceptions.ts` der App) und Rückmeldungssatz */
export const d = (text: string, miss: string, why: string): Distractor => ({ text, miss, why });
/** Kurzform ohne Katalog-Schlüssel: nur der Rückmeldungssatz (für Module ohne Stolperstein-Statistik) */
export const dis = (text: string, why: string): Distractor => ({ text, why });

/**
 * Multiple-Choice-Aufgabe aus richtiger Antwort und Distraktoren (Duplikate werden entfernt).
 * Distraktoren mit Diagnose kommen zuerst dran; `rightWhy` ist der Bestätigungssatz zur richtigen Antwort.
 * `why`/`miss` je Options-Index (nur gesetzte Einträge, JSON-fähig).
 */
export function mc(correct: string, wrongs: Distractor[], n = 4, rightWhy?: string): Pick<McTask, "kind" | "options" | "answer" | "why" | "miss"> {
  const seen = new Set([correct]);
  const list: Diag[] = [];
  for (const w of wrongs) {
    const x = typeof w === "string" ? { text: w } : w;
    if (!x || !x.text || seen.has(x.text)) continue;
    seen.add(x.text); list.push(x);
  }
  const diag = shuffle(list.filter(x => x.miss || x.why)), plain = shuffle(list.filter(x => !x.miss && !x.why));
  const chosen = [...diag, ...plain].slice(0, n - 1);
  const all = shuffle([{ text: correct, why: rightWhy } as Diag, ...chosen]);
  const why: Record<number, string> = {}, miss: Record<number, string> = {};
  all.forEach((x, i) => { if (x.why) why[i] = x.why; if (x.miss) miss[i] = x.miss; });
  return {
    kind: "mc", options: all.map(x => x.text), answer: all.findIndex(x => x.text === correct),
    ...(Object.keys(why).length ? { why } : {}), ...(Object.keys(miss).length ? { miss } : {}),
  };
}

/** Diagnose einer Antwort: passende Rückmeldung und Fehlvorstellung (Multiple Choice: je Option, Eingaben: Fallen) */
export function diagnose(t: BaseTask, a: { ok: boolean; choice?: number; values?: Record<string, number> }): { miss?: string; why?: string } | null {
  if (t.kind === "mc") {
    const m = t as McTask;
    const i = a.ok ? m.answer : a.choice;
    if (i === undefined) return null;
    const why = m.why?.[i], miss = a.ok ? undefined : m.miss?.[i];
    return why || miss ? { why, miss } : null;
  }
  if (!a.ok && t.traps && a.values) {
    for (const tr of t.traps) {
      if (tr.values) {
        if (Object.entries(tr.values).every(([k, x]) => a.values![k] === x)) return { miss: tr.miss, why: tr.why };
        continue;
      }
      const v = tr.field ? a.values[tr.field] : undefined;
      if (v === undefined || Number.isNaN(v)) continue;
      if ((tr.value !== undefined && v === tr.value) || (tr.min !== undefined && v >= tr.min)) return { miss: tr.miss, why: tr.why };
    }
  }
  return null;
}

/** Kennung einer Frage (kurze Prüfsumme, FNV-1a) – gleiche Frage, gleiche Kennung, auch wenn die Antwortmöglichkeiten anders gemischt sind */
export function taskKey(t: BaseTask): string {
  const { options: _o, answer: _a, why: _w, type: _t, hint: _h, explain: _e, praise: _p, traps: _tr, rule: _r, ...rest } = t as BaseTask & Record<string, unknown>;
  const s = JSON.stringify(rest);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}

/** Wie viele zuletzt gestellte Fragen je Stufe gemerkt werden (gegen Wiederholungen über Runden hinweg) */
export const RECENT_MAX = 400;

/**
 * Runde ohne Wiederholungen: erzeugt mehrere Kandidaten-Runden und nimmt für jeden Platz eine Frage desselben Typs,
 * die zuletzt nicht gestellt wurde – gibt es keine mehr, die am längsten zurückliegende. `recent`: Kennungen, neueste zuletzt.
 * `keepType`: jeder Platz behält seinen Typ (Level mit fester Reihenfolge der Aufgabentypen).
 */
export function freshRound<T extends BaseTask>(make: () => T[], recent: readonly string[], extra = 10, keepType = false): T[] {
  const first = make();
  const age = new Map<string, number>();
  recent.forEach((k, i) => age.set(k, i));
  const pool = [first];
  const need = new Map<string | undefined, number>();
  for (const t of first) need.set(t.type, (need.get(t.type) ?? 0) + 1);
  const enough = () => [...need].every(([type, n]) =>
    new Set(pool.flat().filter(c => c.type === type).map(taskKey).filter(k => !age.has(k))).size >= n);
  // weitere Kandidaten nur, solange nicht für jeden Platz eine neue Frage da ist
  for (let i = 0; i < extra && !enough(); i++) pool.push(make());
  const cands = pool.flat();
  const used = new Set<string>();
  const count = new Map<string | undefined, number>();
  const pick = (type: string | undefined | null): [T | null, number] => {
    let best: T | null = null, bestAge = Infinity;
    for (const c of cands) {
      if (type !== null && c.type !== type) continue;
      const k = taskKey(c);
      if (used.has(k)) continue;
      const a = age.get(k) ?? -1;
      // bei gleichem Alter den im Moment seltensten Typ nehmen (Mischung bleibt ausgewogen)
      if (a < bestAge || (a === bestAge && best && (count.get(c.type) ?? 0) < (count.get(best.type) ?? 0))) { best = c; bestAge = a; }
    }
    return [best, bestAge];
  };
  let searched = false;
  return first.map(slot => {
    let [best, a] = pick(slot.type);
    // nur schon gestellte Fragen dieses Typs gezogen: einmal je Runde gezielt weitersuchen – der Zufall kann neue übersehen haben
    if (a >= 0 && !searched) {
      searched = true;
      for (let i = 0; i < extra * 3 && a >= 0; i++) { cands.push(...make()); [best, a] = pick(slot.type); }
    }
    // Typ wirklich erschöpft → neue Frage eines anderen Typs dieses Levels (außer bei fester Reihenfolge)
    if (a >= 0 && !keepType) { const [other, b] = pick(null); if (other && b < 0) best = other; }
    best ??= slot;
    used.add(taskKey(best));
    count.set(best.type, (count.get(best.type) ?? 0) + 1);
    return best;
  });
}

/**
 * Runde zusammenstellen: jeder Aufgabentyp etwa gleich oft, keine doppelten Aufgaben.
 * gens: Generator je Typ-id; ids: welche Typen in dieser Runde vorkommen.
 */
export function buildRound<T extends BaseTask>(ids: string[], gens: Record<string, () => T>, count = 10): T[] {
  let order: string[] = [];
  while (order.length < count) order = order.concat(shuffle(ids));
  const seen = new Set<string>();
  return order.slice(0, count).map(id => {
    let t = gens[id]();
    for (let tries = 0; tries < 12; tries++) {
      const sig = JSON.stringify({ ...t, options: undefined, answer: undefined });
      if (!seen.has(sig)) { seen.add(sig); break; }
      t = gens[id]();
    }
    return { ...t, type: id };
  });
}
