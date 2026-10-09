// Kapitel 1: Schalen, Edelgaskonfiguration, Ionen aus dem PSE und Ergebnis des Elektronenübergangs stimmen fachlich.
import { test, expect } from "vitest";
import { ANIONS, CATIONS, chargeSup } from "@lern/chem";
import { ionOf, isNoble, shellsOf, sym, trResult } from "./models.tsx";

test("Schalen der Unterstufe (2 · 8 · 8 · …) und Edelgaskonfiguration", () => {
  expect(shellsOf(2)).toEqual([2]);
  expect(shellsOf(11)).toEqual([2, 8, 1]);
  expect(shellsOf(10)).toEqual([2, 8]);
  expect(shellsOf(20)).toEqual([2, 8, 8, 2]);
  expect(shellsOf(18)).toEqual([2, 8, 8]);
  for (const E of [2, 10, 18]) expect(isNoble(E)).toBe(true);
  for (const E of [1, 3, 9, 11, 17, 19, 20]) expect(isNoble(E)).toBe(false);
});

test("Ion im PSE nach der Regel = Ionen der App (Hauptgruppen-Ionen bis Calcium)", () => {
  for (const i of [...CATIONS, ...ANIONS].filter(x => x.Z && x.Z <= 20 && !x.os)) expect(ionOf(i.Z!)).toBe(i.formula + chargeSup(i.charge));
  for (const Z of [1, 2, 5, 6, 10, 14, 18]) expect(ionOf(Z)).toBe("–");
  expect(sym(11, 10)).toBe("Na⁺");
  expect(sym(8, 10)).toBe("O²⁻");
  expect(sym(7, 10)).toBe("N³⁻");
});

test("Elektronenübergang: Ergebnis gruppiert, Ladungen richtig", () => {
  expect(trResult(11, 17, { nm: 1, nn: 1, gave: [1], got: [1] })).toBe("Na⁺ + Cl⁻");
  expect(trResult(12, 17, { nm: 1, nn: 2, gave: [2], got: [1, 1] })).toBe("Mg²⁺ + 2 Cl⁻");
  expect(trResult(12, 17, { nm: 1, nn: 2, gave: [1], got: [1, 0] })).toBe("Mg⁺ + Cl⁻ + Cl");
  expect(trResult(3, 8, { nm: 2, nn: 1, gave: [1, 1], got: [2] })).toBe("2 Li⁺ + O²⁻");
  expect(trResult(20, 9, { nm: 1, nn: 2, gave: [2], got: [1, 1] })).toBe("Ca²⁺ + 2 F⁻");
});
