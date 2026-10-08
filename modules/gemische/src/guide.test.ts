// Lektionen der sechs Kapitel: vorgemacht → halb gelöst → selbst, jede Antwort lösbar, Begriffe eingeführt, kurze Sätze.
import { test, expect } from "vitest";
import { checkGuide } from "@lern/ui";
import { LESSONS } from "./lessons.tsx";

test("Lektionen", () => {
  expect(LESSONS.length).toBe(6);
  for (const l of LESSONS) expect(checkGuide(l, { lesson: true })).toEqual([]);
});

test("Lektionen: die richtige Antwort steht an wechselnden Plätzen (höchstens 40 % an Platz 1)", () => {
  const steps = LESSONS.flatMap(l => l.steps).filter(s => s.options?.length && s.answer !== undefined);
  const first = steps.filter(s => s.options![0] === String(s.answer)).length;
  expect(steps.length).toBeGreaterThan(10);
  expect(first / steps.length).toBeLessThanOrEqual(.4);
});

test("Lektionen: Geräte und Teile stehen beim ersten Vorkommen fett (Vorlage, Kühler, Destillat, Rückstand …)", () => {
  const TERMS = ["Vorlage", "Kühler", "Destillat", "Laufmittel", "Rückstand", "Filtrat", "Bodensatz", "Filterpapier"];
  const seen = new Set<string>(), bad: string[] = [];
  for (const l of LESSONS) for (const s of l.steps) {
    for (const x of [s.say, s.ask, ...(s.lines ?? []), ...(s.options ?? []), ...Object.values(s.why ?? {}), s.tip, s.show, s.ok]) {
      if (!x) continue;
      for (const w of TERMS) {
        if (x.includes(`**${w}**`)) seen.add(w);
        else if (new RegExp(`\\b${w}\\b`).test(x) && !seen.has(w)) bad.push(`${w}: ${x}`);
      }
    }
  }
  expect(bad).toEqual([]);
});
