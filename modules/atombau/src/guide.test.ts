// Erklärung: 10–15 Schritte je Stufe, jede Antwort lösbar, Rückmeldungen passend, kurze Sätze.
import { test, expect } from "vitest";
import { checkGuide, feedback } from "@lern/ui";
import { guideFor } from "./guide.tsx";

test("Erklärung Unterstufe und Oberstufe", () => {
  expect([...checkGuide(guideFor("us")), ...checkGuide(guideFor("os"))]).toEqual([]);
});

test("die richtige Antwort steht an wechselnden Plätzen (höchstens 40 % an Platz 1)", () => {
  const steps = [...guideFor("us").steps, ...guideFor("os").steps].filter(s => s.options?.length && s.answer !== undefined);
  const first = steps.filter(s => s.options![0] === String(s.answer)).length;
  expect(steps.length).toBeGreaterThan(5);
  expect(first / steps.length).toBeLessThanOrEqual(.4);
});

test("Rückmeldung: erst Begründung, ab dem zweiten Versuch mit Tipp; ohne Begründung gleich der Tipp", () => {
  const step = guideFor("us").steps.find(s => s.tip && s.why)!;
  const why = Object.values(step.why!)[0];
  expect(feedback(step, why, 1)).toBe(`${why} Versuch 1 von 4.`);
  expect(feedback(step, why, 2)).toBe(`${why} Tipp: ${step.tip} Versuch 2 von 4.`);
  expect(feedback(step, undefined, 1)).toBe(`${step.tip} Versuch 1 von 4.`);
});

test("Schalen nie als Kette „2 · 8 · 1“ (sieht aus wie eine Rechnung) – ausgeschrieben je Schale", () => {
  const texts: string[] = [];
  const walk = (x: unknown): void => {
    if (typeof x === "string") texts.push(x);
    else if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object") Object.values(x).forEach(walk);
  };
  walk([guideFor("us"), guideFor("os")]);
  // Rechnungen wie „3 · 2 = 6“ oder „2 · 3² = 18“ bleiben erlaubt
  expect(texts.filter(s => /\d+ · \d+ · \d+|\b2 · \d+\b(?!\s*=|[²³+−-])/.test(s))).toEqual([]);
});
