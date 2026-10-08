// Erklärung: 10–15 Schritte je Stufe, jede Antwort lösbar, Rückmeldungen passend, kurze Sätze.
import { test, expect } from "vitest";
import { checkGuide } from "@lern/ui";
import { guideFor } from "./guide.tsx";

test("Erklärung Unterstufe und Oberstufe", () => {
  expect([...checkGuide(guideFor("us")), ...checkGuide(guideFor("os"))]).toEqual([]);
});

test("Erklärung: die richtige Auswahl steht an wechselnden Plätzen (je Stufe höchstens 40 % an Platz 1)", () => {
  for (const st of ["us", "os"] as const) {
    const steps = guideFor(st).steps.filter(s => s.mode !== "worked" && s.options?.length && s.answer !== undefined);
    const first = steps.filter(s => s.options![0] === String(s.answer)).length;
    expect(steps.length, st).toBeGreaterThanOrEqual(3);
    expect(first / steps.length, `${st}: ${first} von ${steps.length} an Platz 1`).toBeLessThanOrEqual(.4);
  }
});
