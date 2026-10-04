// Prüfungen für geführte Erklärungen (in den Tests der Module): 10–40 Schritte (ab 16 in Kapiteln zu höchstens 8), jede Antwort lösbar,
// Rückmeldungen passen zu möglichen Antworten, kurze Sätze. Ausblenden der Hilfe: jedes Kapitel beginnt vorgemacht,
// danach halb gelöst, dann frei (vorgemacht → halb → frei → vorgemacht …; mehrere halbe oder freie hintereinander erlaubt).

import type { GuideDef } from "./Guide.tsx";

/** Sätze mit mehr als `max` Wörtern (Aufzählungen mit Doppelpunkt/Gleichheitszeichen zählen als ein Satz je Teil) */
export function longGuideSentences(text: string, max = 22): string[] {
  const plain = text.replace(/\*\*|`/g, "");
  return plain.replace(/([.!?])\s+/g, "$1\n").split("\n").filter(s => s.split(/\s+/).filter(w => /[A-Za-zÄÖÜäöüß]/.test(w)).length > max);
}

export function checkGuide(def: GuideDef): string[] {
  const out: string[] = [];
  const n = def.steps.length;
  if (n < 10 || n > 40) out.push(`${def.title}: ${n} Schritte (erlaubt 10–40)`);
  // längere Erklärungen in Kapiteln, jedes überschaubar (höchstens 8 Schritte)
  const starts = def.steps.map((s, i) => (s.part || i === 0 ? i : -1)).filter(i => i >= 0);
  if (n > 15 && !def.steps[0].part) out.push(`${def.title}: über 15 Schritte – Kapitel (part) nötig, ab dem ersten Schritt`);
  if (def.steps[0].part || n > 15) starts.forEach((s, j) => { const len = (starts[j + 1] ?? n) - s; if (len > 8) out.push(`${def.title}: Kapitel „${def.steps[s].part}“ hat ${len} Schritte (höchstens 8)`); });
  if (!def.outro.length) out.push(`${def.title}: keine Zusammenfassung`);
  // Reihenfolge der Arten: halb gelöst nur nach vorgemacht/halb, frei nur nach halb/frei, Kapitelanfang vorgemacht
  const allowed: Record<string, string[]> = { worked: ["worked", "faded", "free"], faded: ["worked", "faded"], free: ["faded", "free"] };
  const staged = def.steps.some(s => s.mode);
  def.steps.forEach((s, i) => {
    const at = `${def.title} Schritt ${i + 1}`;
    if (staged && !s.mode) { out.push(`${at}: Art (mode) fehlt`); return; }
    if (s.mode) {
      const first = i === 0 || !!s.part;
      if (first && s.mode !== "worked") out.push(`${at}: Kapitel beginnt nicht vorgemacht`);
      if (!first && !allowed[s.mode].includes(def.steps[i - 1].mode!)) out.push(`${at}: „${s.mode}“ nach „${def.steps[i - 1].mode}“ – erst vorgemacht, dann halb, dann frei`);
      if (s.mode === "worked") {
        if (!s.lines?.length) out.push(`${at}: vorgemacht ohne Lösungsweg`);
        if (s.options || s.num || s.answer !== undefined || s.why || s.tip) out.push(`${at}: vorgemacht braucht keine Antwort`);
        if (s.lines?.some(l => l.includes("{?}"))) out.push(`${at}: Lücke in vorgemachtem Schritt`);
        if (!s.ok) out.push(`${at}: Bestätigung fehlt`);
        for (const t of [s.say ?? "", s.ask, s.ok, ...(s.lines ?? [])]) for (const l of longGuideSentences(t)) out.push(`${at}: langer Satz „${l}“`);
        return;
      }
    }
    if (s.mode === "faded" && (s.lines ?? []).filter(l => l.includes("{?}")).length !== 1) out.push(`${at}: halb gelöst braucht genau eine Lücke {?}`);
    if (s.mode === "faded" && typeof s.answer === "number" && (s.lines ?? []).some(l => new RegExp(`(^|[^0-9,\\p{L}])${String(s.answer).replace(".", ",")}([^0-9,\\p{L}]|$)`, "u").test(l.replace("{?}", "")))) out.push(`${at}: Lösungsweg verrät die Lücke`);
    if (s.mode === "free" && s.lines?.some(l => l.includes("{?}"))) out.push(`${at}: Lücke in freiem Schritt`);
    if (s.answer === undefined) { out.push(`${at}: Antwort fehlt`); return; }
    const kinds = [!!s.options, !!s.num, !s.options && !s.num].filter(Boolean).length;
    if (kinds !== 1) out.push(`${at}: genau eine Antwortform nötig`);
    if (s.options) {
      if (typeof s.answer !== "string" || !s.options.includes(s.answer)) out.push(`${at}: Antwort nicht unter den Auswahlen`);
      if (new Set(s.options).size !== s.options.length) out.push(`${at}: Auswahl doppelt`);
      for (const k of Object.keys(s.why ?? {})) if (!s.options.includes(k)) out.push(`${at}: Rückmeldung zu „${k}“ passt zu keiner Auswahl`);
      if (s.why?.[s.answer as string]) out.push(`${at}: Rückmeldung bei der richtigen Antwort`);
      // jede falsche Auswahl steht für einen Denkfehler und bekommt eine eigene Rückmeldung
      for (const o of s.options) if (o !== s.answer && !s.why?.[o]) out.push(`${at}: keine Rückmeldung zu „${o}“`);
    }
    // Zahl eintippen oder im Bild antippen: beliebige falsche Antworten → Denkanstoß nötig
    if (!s.options && !s.tip) out.push(`${at}: Tipp fehlt`);
    if (s.tip && typeof s.answer === "number" && new RegExp(`(^|[^0-9,\\p{L}])${String(s.answer).replace(".", ",")}([^0-9,\\p{L}]|$)`, "u").test(s.tip)) out.push(`${at}: Tipp verrät die Lösung`);
    if (s.num) {
      if (typeof s.answer !== "number" || !Number.isFinite(s.answer)) out.push(`${at}: Zahl-Antwort fehlt`);
      for (const k of Object.keys(s.why ?? {})) if (!Number.isFinite(Number(k)) || Number(k) === s.answer) out.push(`${at}: Rückmeldung „${k}“ ist keine falsche Zahl`);
    }
    if (!s.options && !s.num && !s.visual) out.push(`${at}: Antippen ohne Bild`);
    // Beschriftungen nur mit Bild und nie mit der gesuchten Antwort (außer erst nach der richtigen Antwort)
    if (s.labels?.length && !s.visual) out.push(`${at}: Beschriftung ohne Bild`);
    const sol = String(s.answer).replace(".", ",");
    for (const l of s.labels ?? []) if (!l.afterSolved && (l.text === sol || (typeof s.answer === "number"
      ? new RegExp(`(^|[^0-9,\\p{L}])${sol}([^0-9,\\p{L}]|$)`, "u").test(l.text) : sol.length > 2 && l.text.includes(sol)))) out.push(`${at}: Beschriftung „${l.text}“ verrät die Lösung`);
    if (!s.ok) out.push(`${at}: Bestätigung fehlt`);
    for (const t of [s.say ?? "", s.ask, s.ok, s.show ?? "", s.tip ?? "", ...(s.lines ?? []), ...Object.values(s.why ?? {}), ...(s.labels ?? []).map(l => l.text)]) for (const l of longGuideSentences(t)) out.push(`${at}: langer Satz „${l}“`);
  });
  return out;
}
