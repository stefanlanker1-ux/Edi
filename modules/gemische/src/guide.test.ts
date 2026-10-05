// Lektionen der fünf Kapitel: vorgemacht → halb gelöst → selbst, jede Antwort lösbar, Begriffe eingeführt, kurze Sätze.
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
