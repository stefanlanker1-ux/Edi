// Erklärung: 10–15 Schritte, jede Antwort lösbar, Rückmeldungen passend, kurze Sätze.
import { test, expect } from "vitest";
import { checkGuide } from "@lern/ui";
import { GUIDE } from "./guide.tsx";

test("Erklärung", () => { expect(checkGuide(GUIDE)).toEqual([]); });

test("Erklärung: die richtige Antwort steht an wechselnden Plätzen (höchstens 40 % an Platz 1)", () => {
  const steps = GUIDE.steps.filter(s => s.options?.length && s.answer !== undefined);
  const first = steps.filter(s => s.options![0] === String(s.answer)).length;
  expect(steps.length).toBeGreaterThan(5);
  expect(first / steps.length).toBeLessThanOrEqual(.4);
});

test("Erklärung: „ranghöchste Gruppe“ über die Rangfolge erklärt, nicht mit „höchstem Rang“", () => {
  const def = GUIDE.steps.find(s => s.say?.includes("**ranghöchste Gruppe**"))!;
  expect(def.say).toMatch(/\*\*Rangfolge\*\*.*\*\*ranghöchste Gruppe\*\*/);
  expect(def.say).not.toMatch(/höchsten Rang/);
});
