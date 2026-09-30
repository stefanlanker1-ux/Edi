// Einfache Sprache: Sätze in Aufgaben- und Rückmeldungstexten kurz halten (Richtwert höchstens 15 Wörter).
// Für die Tests der Apps: longSentences(task) listet zu lange Sätze auf.

import type { BaseTask } from "./types.ts";

/** Wörter eines Satzes (Formeln, Zahlen und Gleichungen zählen je als ein Wort; Markdown-Sterne und Code-Striche ignoriert) */
export function wordCount(sentence: string): number {
  return sentence.replace(/[*`]/g, "").split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Sätze eines Textes: Schluss an . ! ? oder Doppelpunkt/Gedankenstrich (dort beginnt meist ein neuer Gedanke) */
export function sentences(text: string): string[] {
  return text
    .replace(/`[^`]*`/g, "Formel") // Gleichungen in Code sind ein Baustein, kein Satz
    .split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ„0-9*])|\s[–—]\s|:\s|;\s|\n/)
    .map(s => s.trim()).filter(Boolean);
}

/** Alle Texte, die Schüler zu einer Aufgabe lesen: Frage, Tipp, Erklärung, Lob und die Rückmeldungen der Distraktoren */
export function taskTexts(t: BaseTask): string[] {
  const why = (t as BaseTask & { why?: Record<number, string> }).why ?? {};
  return [t.prompt, t.hint, t.explain, t.praise ?? "", ...Object.values(why), ...(t.traps ?? []).map(x => x.why)].filter(Boolean);
}

/** Sätze mit mehr als `max` Wörtern (Rechenzeilen mit = oder → sind Rechenwege, keine Sätze) */
export function longSentences(t: BaseTask, max = 15): string[] {
  return taskTexts(t).flatMap(sentences).filter(s => !/[=→]/.test(s) && wordCount(s) > max);
}
