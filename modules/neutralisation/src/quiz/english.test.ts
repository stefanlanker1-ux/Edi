// Englische Oberfläche: alle Texte erzeugter Aufgaben ohne deutsche Buchstaben (ä, ö, ü, ß) und ohne deutsche Anführungszeichen;
// einfache Sprache wie im Deutschen (Sätze höchstens 15 Wörter).
import { test, expect } from "vitest";
import { setLang } from "@lern/i18n";
import { longSentences } from "@lern/quiz";

test("Quiz auf Englisch ohne deutsche Reste", async () => {
  setLang("en", false);
  const tasks = await import("./tasks.ts");
  const miss = await import("./misconceptions.ts").catch(() => ({}));
  const texts = new Set<string>(), long = new Set<string>(), low = new Set<string>(), caps = new Set<string>(), leak = new Set<string>();
  // Sätze beginnen groß („Nitrite would be NO₂⁻.“), Namen mitten im Satz klein („is called chloride“, „(potassium phosphate)“),
  // der Tipp nennt kein Wort der richtigen Antwort
  const lowStart = (t: { prompt: string; hint: string; explain: string; why?: Record<number, string>; options?: string[]; answer?: number }) => {
    for (const s of [t.prompt, t.hint, t.explain, ...Object.values(t.why ?? {})]) {
      if (/(?:^|[.!?] )[a-z]/.test(s)) low.add(s);
      for (const sentence of s.replace(/\*\*/g, "").split(/[.!?]\s+/))
        if (sentence.split(/\s+/).slice(1).some(w => /^[(\[]?[A-Z][a-z]{2,}/.test(w))) caps.add(sentence);
    }
    if (t.options && t.answer !== undefined)
      for (const w of t.options[t.answer].match(/\p{L}{4,}/gu) ?? []) if (t.hint.toLowerCase().includes(w.toLowerCase())) leak.add(`${w} | ${t.hint}`);
  };
  const walk = (x: unknown): void => {
    if (typeof x === "string") texts.add(x);
    else if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object") Object.values(x).forEach(walk);
  };
  const t = tasks as Record<string, unknown>;
  walk(t.TYPE_NAMES); walk((miss as Record<string, unknown>).MISS);
  const levels = t.LEVELS as unknown[] | Record<string, unknown[]>;
  const sets = Array.isArray(levels) ? [["us", levels] as const] : Object.entries(levels);
  const make = t.makeRound as (s: string, l: number | string) => unknown[];
  for (const [stufe, lv] of sets) {
    walk(lv);
    for (let i = 0; i < lv.length; i++) for (let k = 0; k < 15; k++) { const r = make(stufe, i); walk(r); for (const x of r) longSentences(x as Parameters<typeof longSentences>[0]).forEach(l => long.add(l)); for (const x of r) lowStart(x as Parameters<typeof longSentences>[0]); }
    for (let k = 0; k < 10; k++) walk(make(stufe, "mix"));
  }
  setLang("de", false);
  expect(texts.size).toBeGreaterThan(200);
  expect([...texts].filter(s => /[äöüÄÖÜß„]/.test(s))).toEqual([]);
  expect([...long]).toEqual([]);
  expect([...low]).toEqual([]);
  expect([...caps]).toEqual([]);
  expect([...leak]).toEqual([]);
}, 120_000);
