// Kapitel 2: Ergebnis-Texte der Modelle („Prüfen“) passen zu Antworten und Rückmeldungen; Namen deutsch und englisch richtig zusammengesetzt.
import { test, expect } from "vitest";
import { setLang } from "@lern/i18n";
import { builtKey, formulaKey, nameOf, wallKey, type Piece } from "./models.tsx";
import { kapitel2 } from "../k2.tsx";
import { isModel } from "../model.tsx";

test("Ergebnis-Texte der Modelle", () => {
  expect(wallKey("Na+", "O2-", 2, 1)).toBe("2 Na⁺ + 1 O²⁻");
  expect(builtKey("Al3+", "O2-", 2, 3)).toBe("Al₂O₃");
  expect(builtKey("Mg2+", "O2-", 2, 2)).toBe("Mg₂O₂"); // neutral, aber ungekürzt
  expect(builtKey("Al3+", "O2-", 2, 2)).toBe("Al₂O₂ (6+ / 4−)");
  expect(formulaKey("Al3+", "Cl-", 1, 3)).toBe("AlCl₃");
  expect(formulaKey("Al3+", "Cl-", 1, 3, true)).toBe("Cl₃Al");
});

test("Namen aus Wortteilen (deutsch zusammen, englisch Metall als eigenes Wort)", () => {
  const p: Piece[] = [{ t: "Calcium", k: "m" }, { t: "di", k: "n" }, { t: "Chlor", k: "s" }, { t: "-id", k: "e" }];
  expect(nameOf(p, [0, 2, 3])).toBe("Calciumchlorid");
  expect(nameOf(p, [0, 1, 2, 3])).toBe("Calciumdichlorid");
  setLang("en", false);
  const e: Piece[] = [{ t: "Sodium", k: "m" }, { t: "Chlor", k: "s" }, { t: "-ide", k: "e" }];
  expect(nameOf(e, [0, 1, 2])).toBe("Sodium chloride");
  setLang("de", false);
});

test("Kapitel 2: prüfbare Modell-Folien – Rückmeldungen nie zur richtigen Antwort, Lösung erreichbar", () => {
  const steps = kapitel2().def.steps;
  const checkable = steps.filter(s => isModel(s) && s.mode !== "worked");
  expect(checkable.length).toBeGreaterThanOrEqual(10);
  for (const s of steps) if (s.why && s.answer !== undefined) expect(Object.keys(s.why)).not.toContain(String(s.answer));
  for (const s of checkable) expect(typeof s.answer === "string" && s.answer.length > 1).toBe(true);
});
