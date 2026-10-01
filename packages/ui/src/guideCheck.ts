// Prüfungen für geführte Erklärungen (in den Tests der Module): 10–15 Schritte, jede Antwort lösbar,
// Rückmeldungen passen zu möglichen Antworten, kurze Sätze.

import type { GuideDef } from "./Guide.tsx";

/** Sätze mit mehr als `max` Wörtern (Aufzählungen mit Doppelpunkt/Gleichheitszeichen zählen als ein Satz je Teil) */
export function longGuideSentences(text: string, max = 22): string[] {
  const plain = text.replace(/\*\*|`/g, "");
  return plain.split(/(?<=[.!?])\s+/).filter(s => s.split(/\s+/).filter(w => /[A-Za-zÄÖÜäöüß]/.test(w)).length > max);
}

export function checkGuide(def: GuideDef): string[] {
  const out: string[] = [];
  const n = def.steps.length;
  if (n < 10 || n > 15) out.push(`${def.title}: ${n} Schritte (erlaubt 10–15)`);
  if (!def.outro.length) out.push(`${def.title}: keine Zusammenfassung`);
  def.steps.forEach((s, i) => {
    const at = `${def.title} Schritt ${i + 1}`;
    const kinds = [!!s.options, !!s.num, !s.options && !s.num].filter(Boolean).length;
    if (kinds !== 1) out.push(`${at}: genau eine Antwortform nötig`);
    if (s.options) {
      if (typeof s.answer !== "string" || !s.options.includes(s.answer)) out.push(`${at}: Antwort nicht unter den Auswahlen`);
      if (new Set(s.options).size !== s.options.length) out.push(`${at}: Auswahl doppelt`);
      for (const k of Object.keys(s.why ?? {})) if (!s.options.includes(k)) out.push(`${at}: Rückmeldung zu „${k}“ passt zu keiner Auswahl`);
      if (s.why?.[s.answer as string]) out.push(`${at}: Rückmeldung bei der richtigen Antwort`);
    }
    if (s.num) {
      if (typeof s.answer !== "number" || !Number.isFinite(s.answer)) out.push(`${at}: Zahl-Antwort fehlt`);
      for (const k of Object.keys(s.why ?? {})) if (!Number.isFinite(Number(k)) || Number(k) === s.answer) out.push(`${at}: Rückmeldung „${k}“ ist keine falsche Zahl`);
    }
    if (!s.options && !s.num && !s.visual) out.push(`${at}: Antippen ohne Bild`);
    if (!s.ok) out.push(`${at}: Bestätigung fehlt`);
    for (const t of [s.say ?? "", s.ask, s.ok, s.show ?? "", ...Object.values(s.why ?? {})]) for (const l of longGuideSentences(t)) out.push(`${at}: langer Satz „${l}“`);
  });
  return out;
}
