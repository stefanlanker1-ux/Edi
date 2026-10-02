// Englische Oberfläche: alle Texte erzeugter Aufgaben ohne deutsche Buchstaben (ä, ö, ü, ß) und ohne deutsche Anführungszeichen;
// einfache Sprache wie im Deutschen (Sätze höchstens 15 Wörter).
import { test, expect } from "vitest";
import { setLang } from "@lern/i18n";
import { longSentences } from "@lern/quiz";

test("Quiz auf Englisch ohne deutsche Reste", async () => {
  setLang("en", false);
  const tasks = await import("./tasks.ts");
  const miss = await import("./misconceptions.ts").catch(() => ({}));
  const texts = new Set<string>(), long = new Set<string>();
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
    for (let i = 0; i < lv.length; i++) for (let k = 0; k < 15; k++) { const r = make(stufe, i); walk(r); for (const x of r) longSentences(x as Parameters<typeof longSentences>[0]).forEach(l => long.add(l)); }
    for (let k = 0; k < 10; k++) walk(make(stufe, "mix"));
  }
  setLang("de", false);
  expect(texts.size).toBeGreaterThan(200);
  expect([...texts].filter(s => /[äöüÄÖÜß„]/.test(s))).toEqual([]);
  expect([...long]).toEqual([]);
}, 120_000);
