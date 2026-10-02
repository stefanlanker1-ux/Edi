// Einfache Sprache (Benennung: Aufgaben berechnen Namen, darum mehr Zeit): kein Satz in Frage, Tipp, Erklärung oder Rückmeldung länger als 15 Wörter (Rechenzeilen ausgenommen).
import { test, expect } from "vitest";
import { longSentences } from "@lern/quiz";
import { LEVELS, makeRound } from "./tasks.ts";

test("Einfache Sprache: Sätze höchstens 15 Wörter", () => {
  const sets: [string, unknown[]][] = Array.isArray(LEVELS) ? [["us", LEVELS]] : Object.entries(LEVELS);
  const long = new Set<string>();
  for (const [stufe, levels] of sets) for (let lv = 0; lv < levels.length; lv++) for (let i = 0; i < 30; i++)
    for (const t of (makeRound as (s: string, l: number) => Parameters<typeof longSentences>[0][])(stufe, lv)) longSentences(t).forEach(s => long.add(s));
  expect([...long]).toEqual([]);
}, 60000);
