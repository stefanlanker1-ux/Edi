// Einfache Sprache: kein Satz in Frage, Tipp, Erklärung oder Rückmeldung länger als 15 Wörter (Rechenzeilen ausgenommen).
import { test, expect } from "vitest";
import { longSentences } from "@lern/quiz";
import { LEVELS, makeRound } from "./tasks.ts";

test("Einfache Sprache: Sätze höchstens 15 Wörter", () => {
  const long = new Set<string>();
  for (let lv = 0; lv < LEVELS.length; lv++) for (let i = 0; i < 25; i++) for (const t of makeRound("us", lv)) longSentences(t).forEach(s => long.add(s));
  expect([...long]).toEqual([]);
});
