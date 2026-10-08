// Zahlschritte der Erklärung (Guide in @lern/ui): „1.000“ ist auf Deutsch tausend – die richtige Eingabe darf nicht abgelehnt werden.
import { test, expect } from "vitest";
import { isRight, typedForms, type GuideStep } from "@lern/ui";

const step = (answer: number): GuideStep => ({ mode: "free", ask: "1 l = ? ml", answer, num: { unit: "ml" }, tip: "Denk an die Vorsilbe.", ok: "Genau." });

test("Tausenderpunkt und Leerzeichen-Gruppen werden als richtige Zahl gelesen (Deutsch)", () => {
  expect(isRight(step(1000), "1.000")).toBe(true);
  expect(isRight(step(1000), "1 000")).toBe(true);
  expect(isRight(step(3600), "3.600")).toBe(true);
  expect(isRight(step(0.25), "0,25")).toBe(true);
  expect(isRight(step(1000), "1,000")).toBe(false); // Deutsch: eins Komma null null null
  expect(isRight(step(1), "1.000")).toBe(false);
});

test("übliche Schreibweisen je Sprache (für checkGuide)", () => {
  expect(typedForms(3600)).toEqual([["de", "3600"], ["de", "3.600"], ["de", "3 600"], ["en", "3600"], ["en", "3,600"], ["en", "3 600"]]);
  expect(typedForms(2.5)).toEqual([["de", "2,5"], ["de", "2,5"], ["de", "2,5"], ["en", "2.5"], ["en", "2.5"], ["en", "2.5"]]);
});
