import { test, assert } from "vitest";
import { schoolMass, molarMass, molarMassText, moles, massOf, particles, gasVolume, fmt, fmtParticles, MOLE_SUBSTANCES, round } from "../src/moles.ts";

test("Atommassen auf 1 Dezimale", () => {
  assert.strictEqual(schoolMass("H"), 1); assert.strictEqual(schoolMass("C"), 12); assert.strictEqual(schoolMass("O"), 16);
  assert.strictEqual(schoolMass("Na"), 23); assert.strictEqual(schoolMass("Cl"), 35.5); assert.strictEqual(schoolMass("Fe"), 55.8);
  assert.throws(() => schoolMass("Xx"));
});

test("molare Masse aus der Formel", () => {
  assert.strictEqual(molarMass("H2O"), 18);
  assert.strictEqual(molarMass("NaCl"), 58.5);
  assert.strictEqual(molarMass("CO2"), 44);
  assert.strictEqual(molarMass("CaCO3"), 100.1);
  assert.strictEqual(molarMass("C6H12O6"), 180);
  assert.strictEqual(molarMass("Ca(OH)2"), 74.1);
  assert.strictEqual(molarMassText("H2O"), "M(H₂O) = 2 · 1 + 16 = 18 g/mol");
  assert.strictEqual(molarMassText("NaCl"), "M(NaCl) = 23 + 35,5 = 58,5 g/mol");
  for (const s of MOLE_SUBSTANCES) assert.ok(molarMass(s.formula) > 0, s.formula);
});

test("n = m / M, m = n · M, N, V", () => {
  assert.strictEqual(moles(36, 18), 2);
  assert.strictEqual(round(moles(117, 58.5)), 2);
  assert.strictEqual(massOf(0.5, 44), 22);
  assert.strictEqual(gasVolume(2), 44.8);
  assert.strictEqual(fmtParticles(particles(1)), "6,02 · 10²³");
  assert.strictEqual(fmtParticles(particles(0.5)), "3,01 · 10²³");
});

test("deutsche Zahlen", () => {
  assert.strictEqual(fmt(7000), "7 000"); assert.strictEqual(fmt(0.25), "0,25"); assert.strictEqual(fmt(35.5), "35,5");
  assert.strictEqual(fmt(18), "18"); assert.strictEqual(fmt(2 / 3), "0,67"); assert.strictEqual(fmt(-1.5), "−1,5");
});
