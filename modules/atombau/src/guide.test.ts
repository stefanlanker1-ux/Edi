// Erklärung: 10–15 Schritte je Stufe, jede Antwort lösbar, Rückmeldungen passend, kurze Sätze.
import { test, expect } from "vitest";
import { checkGuide, feedback } from "@lern/ui";
import { guideFor } from "./guide.tsx";

test("Erklärung Unterstufe und Oberstufe", () => {
  expect([...checkGuide(guideFor("us")), ...checkGuide(guideFor("os"))]).toEqual([]);
});

test("Rückmeldung: erst Begründung, ab dem zweiten Versuch mit Tipp; ohne Begründung gleich der Tipp", () => {
  const step = guideFor("us").steps.find(s => s.tip && s.why)!;
  const why = Object.values(step.why!)[0];
  expect(feedback(step, why, 1)).toBe(`${why} Versuch 1 von 4.`);
  expect(feedback(step, why, 2)).toBe(`${why} Tipp: ${step.tip} Versuch 2 von 4.`);
  expect(feedback(step, undefined, 1)).toBe(`${step.tip} Versuch 1 von 4.`);
});
