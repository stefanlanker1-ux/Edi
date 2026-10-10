// Erklärung: 10–15 Schritte je Stufe, jede Antwort lösbar, Rückmeldungen passend, kurze Sätze.
import { test, expect } from "vitest";
import { checkGuide } from "@lern/ui";
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

test("Polarität in der Erklärung nach Allred-Rochow: Grenze ΔEN 0,5, Werte der Tabelle", () => {
  const os = JSON.stringify(guideFor("os"));
  expect(os).toContain("ΔEN ≥ 0,5");
  expect(os).toContain("Cl 2,83");
  expect(os).not.toMatch(/Pauling|0,4\b|3,16|3,98/);
});
