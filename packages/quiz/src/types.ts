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
 * Sind es mehr als Plätze, kommen zuerst Distraktoren mit Stolperstein (`d`, `miss`) dran, dann solche mit Rückmeldung (`dis`), dann der Rest –
 * je Gruppe zufällig; so fällt keine Falle mit Stolperstein weg, solange Platz ist. `rightWhy` ist der Bestätigungssatz zur richtigen Antwort.
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
  const keyed = shuffle(list.filter(x => x.miss)), told = shuffle(list.filter(x => !x.miss && x.why)), plain = shuffle(list.filter(x => !x.miss && !x.why));
  const chosen = [...keyed, ...told, ...plain].slice(0, n - 1);
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

/**
 * Kennung einer Frage (kurze Prüfsumme, FNV-1a) – gleiche Frage, gleiche Kennung, auch wenn die Antwortmöglichkeiten anders gemischt sind.
 * Die richtige Antwort zählt mit (bei Auswahl als Text, unabhängig von der Mischung): gleicher Fragetext mit anderer Lösung ist eine andere Frage.
 * Ohne alles, was am Antwort-Index hängt (`why`, `miss`) oder von der Runde bzw. dem Level kommt (`stage`, `lead`, `hintCue`, Tipp, Erklärung).
 */
export function taskKey(t: BaseTask): string {
  const { options, answer, why: _w, miss: _m, type: _t, hint: _h, hintCue: _hc, explain: _e, praise: _p, traps: _tr, rule: _r, stage: _s, lead: _l, ...rest } = t as BaseTask & Record<string, unknown>;
  const right = Array.isArray(options) && typeof answer === "number" ? options[answer] : answer;
  const s = JSON.stringify({ ...rest, right });
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}

/** Wie viele zuletzt gestellte Fragen je Stufe gemerkt werden (gegen Wiederholungen über Runden hinweg) */
export const RECENT_MAX = 400;

/** Wie `freshRound` Plätze ersetzen darf */
export interface FreshOptions {
  /** jeder Platz behält seinen Typ – ist der Vorrat erschöpft, kommt die am längsten zurückliegende Frage dieses Typs
   *  (feste Reihenfolge, „Heute fällig“, „Schwächen üben“: dort darf keine Fertigkeit wegfallen) */
  keepType?: boolean;
  /** feste Reihenfolge: am Platz hängt mehr als der Typ (Merksatz `lead`) – nur Fragen, die für diesen Platz erzeugt wurden
   *  oder denselben Typ und denselben Merksatz haben */
  samePlace?: boolean;
}

/** höchstens so lange sucht `freshRound` weitere Kandidaten (Rundenstart bleibt flüssig, auch auf langsamen Handys) */
const SEARCH_MS = 250;

/**
 * Runde ohne Wiederholungen: erzeugt mehrere Kandidaten-Runden und nimmt für jeden Platz eine Frage desselben Typs,
 * die zuletzt nicht gestellt wurde – gibt es keine mehr, die am längsten zurückliegende. `recent`: Kennungen, neueste zuletzt.
 * Ist ein Typ erschöpft, darf ohne `keepType` höchstens ein Platz je Runde eine neue Frage eines anderen Typs bekommen
 * (sonst verschwänden Fertigkeiten mit kleinem Vorrat ganz aus ihrem Level). `true` = feste Reihenfolge (`keepType` und `samePlace`).
 * Die Suche ist begrenzt: sie endet, wenn einige erzeugte Runden nacheinander nichts Neues bringen oder nach `SEARCH_MS`.
 */
export function freshRound<T extends BaseTask>(make: () => T[], recent: readonly string[], extra = 10, opts: boolean | FreshOptions = false): T[] {
  const { keepType = false, samePlace = false } = typeof opts === "boolean" ? { keepType: opts, samePlace: opts } : opts;
  // so viele erzeugte Runden in Folge ohne neue Frage: der Vorrat ist wohl erschöpft, weitersuchen lohnt nicht
  const STALE = Math.max(3, Math.ceil(extra / 2));
  const t0 = typeof performance === "undefined" ? Date.now() : performance.now();
  const late = () => (typeof performance === "undefined" ? Date.now() : performance.now()) - t0 > SEARCH_MS;
  const first = make();
  const age = new Map<string, number>();
  recent.forEach((k, i) => age.set(k, i));
  const keys = new Map<T, string>();
  const key = (t: T) => { let k = keys.get(t); if (k === undefined) { k = taskKey(t); keys.set(t, k); } return k; };
  // Kandidaten mit ihrem Platz in der erzeugten Runde
  const cands: { t: T; at: number }[] = [];
  const known = new Set<string>();
  /** neue Kandidaten aufnehmen; Ergebnis: die mit einer neuen Kennung, die zuletzt nicht gestellt wurde */
  const add = (round: T[]) => {
    const fresh: { t: T; at: number }[] = [];
    round.forEach((t, at) => { const c = { t, at }; cands.push(c); const k = key(t); if (!known.has(k)) { known.add(k); if (!age.has(k)) fresh.push(c); } });
    return fresh;
  };
  add(first);
  const fits = (c: { t: T; at: number }, at: number) => c.t.type === first[at].type && (!samePlace || c.at === at || c.t.lead === first[at].lead);
  const freshFor = (at: number) => new Set(cands.filter(c => fits(c, at)).map(c => key(c.t)).filter(k => !age.has(k)));
  // genug, wenn jeder Platz eine neue Frage hat (Plätze desselben Typs brauchen verschiedene)
  const enough = () => first.every((_, at) => freshFor(at).size >= first.filter((_, j) => fits({ t: first[j], at: j }, at)).length);
  // weitere Kandidaten nur, solange nicht für jeden Platz eine neue Frage da ist – und solange noch Neues kommt
  for (let i = 0, stale = 0; i < extra && stale < STALE && !late() && !enough(); i++) stale = add(make()).length ? 0 : stale + 1;
  const used = new Set<string>();
  const count = new Map<string | undefined, number>();
  /** beste Frage für Platz `at` (`any`: jeder Typ des Levels); Alter −1 = zuletzt nicht gestellt */
  const pick = (at: number, any = false): [T | null, number] => {
    let best: T | null = null, bestAge = Infinity;
    for (const c of cands) {
      if (!any && !fits(c, at)) continue;
      const k = key(c.t);
      if (used.has(k)) continue;
      const a = age.get(k) ?? -1;
      // bei gleichem Alter den im Moment seltensten Typ nehmen (Mischung bleibt ausgewogen)
      if (a < bestAge || (a === bestAge && best && (count.get(c.t.type) ?? 0) < (count.get(best.type) ?? 0))) { best = c.t; bestAge = a; }
    }
    return [best, bestAge];
  };
  let searched = false, swaps = 0;
  const swapped = new Set<T>();
  const picked = first.map((slot, at) => {
    let [best, a] = pick(at);
    // nur schon gestellte Fragen dieses Typs gezogen: einmal je Runde gezielt weitersuchen – der Zufall kann neue übersehen haben
    // (doppelt so geduldig wie die erste Suche: bei kleinem Vorrat bringen auch mehrere Runden in Folge zufällig nichts Neues)
    if (a >= 0 && !searched) {
      searched = true;
      for (let i = 0, stale = 0; i < extra * 3 && a >= 0 && stale < 2 * STALE && !late(); i++) {
        stale = add(make()).some(c => fits(c, at)) ? 0 : stale + 1;
        [best, a] = pick(at);
      }
    }
    // Typ wirklich erschöpft → neue Frage eines anderen Typs dieses Levels, höchstens einmal je Runde (nie bei keepType)
    if (a >= 0 && !keepType && swaps < 1) { const [other, b] = pick(at, true); if (other && b < 0) { best = other; swaps++; swapped.add(other); } }
    // keine Frage mehr, die in dieser Runde noch nicht dran war: Platz weglassen statt dieselbe Frage zweimal (z. B. „Schwächen üben“ mit kleinem
    // Vorrat) – nur bei fester Reihenfolge bleibt der Platz (dort hängt der Merksatz am Platz)
    if (!best) { if (!samePlace && at > 0) return null; best = slot; }
    used.add(key(best));
    count.set(best.type, (count.get(best.type) ?? 0) + 1);
    return best;
  }).filter((t): t is T => t !== null);
  // eine getauschte Frage steht hinter den anderen Fragen ihres Typs statt am Platz des fremden Typs – Levels, die der Generator ordnet (z. B. nach
  // Schwierigkeit), bleiben geordnet; in gemischten Runden stehen dann zwei Fragen eines Typs nebeneinander
  for (const t of swapped) {
    const from = picked.indexOf(t), last = picked.map((x, i) => (x !== t && x.type === t.type ? i : -1)).reduce((m, i) => Math.max(m, i), -1);
    if (from < 0 || last < 0) continue;
    picked.splice(from, 1);
    picked.splice(last < from ? last + 1 : last, 0, t);
  }
  return picked;
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
      // gleiche Frage = gleiche Kennung (Mischung der Antworten und ihre Rückmeldungen je Index zählen nicht)
      const sig = taskKey(t);
      if (!seen.has(sig)) { seen.add(sig); break; }
      t = gens[id]();
    }
    return { ...t, type: id };
  });
}
