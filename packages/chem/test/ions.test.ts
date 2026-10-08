import { test, assert } from "vitest";
import { ION_BY_ID as I, formula, toSubscript, compoundName, ratio, ionText, composition, isKnownCompound } from "../src/ions.ts";

test("Formeln durch Ladungsausgleich", () => {
  assert.strictEqual(formula(I["Ca2+"], I["Cl-"]), "CaCl2");
  assert.strictEqual(formula(I["Al3+"], I["O2-"]), "Al2O3");
  assert.strictEqual(formula(I["Na+"], I["Cl-"]), "NaCl");
  assert.strictEqual(formula(I["Mg2+"], I["O2-"]), "MgO");
  assert.strictEqual(formula(I["Ca2+"], I["OH-"]), "Ca(OH)2");
  assert.strictEqual(formula(I["NH4+"], I["SO42-"]), "(NH4)2SO4");
  assert.strictEqual(formula(I["Al3+"], I["SO42-"]), "Al2(SO4)3");
  assert.strictEqual(formula(I["Fe3+"], I["O2-"]), "Fe2O3");
  assert.strictEqual(formula(I["Mg2+"], I["N3-"]), "Mg3N2");
  assert.strictEqual(toSubscript("Al2(SO4)3"), "Al₂(SO₄)₃");
  assert.deepEqual(ratio(I["Al3+"], I["O2-"]), { nC: 2, nA: 3 });
});

test("Namen und Schreibweisen", () => {
  assert.strictEqual(compoundName(I["Ca2+"], I["Cl-"]), "Calciumchlorid");
  assert.strictEqual(compoundName(I["Fe3+"], I["O2-"]), "Eisen(III)-oxid");
  assert.strictEqual(compoundName(I["NH4+"], I["NO3-"]), "Ammoniumnitrat");
  assert.strictEqual(ionText(I["SO42-"]), "SO₄²⁻");
  assert.strictEqual(ionText(I["Na+"]), "Na⁺");
  assert.deepEqual(composition("NH4"), [["N", 1], ["H", 4]]);
});

test("nicht beständige Verbindungen werden erkannt", () => {
  assert.strictEqual(isKnownCompound(I["Fe3+"], I["I-"]), false);
  assert.strictEqual(isKnownCompound(I["Cu2+"], I["I-"]), false);
  assert.strictEqual(isKnownCompound(I["Al3+"], I["CO32-"]), false);
  assert.strictEqual(isKnownCompound(I["Cu+"], I["I-"]), true);
  assert.strictEqual(isKnownCompound(I["Na+"], I["Cl-"]), true);
  // Nitride: Li₃N, Mg₃N₂ beständig, Na₃N und K₃N nicht
  assert.strictEqual(isKnownCompound(I["Li+"], I["N3-"]), true);
  assert.strictEqual(isKnownCompound(I["Mg2+"], I["N3-"]), true);
  assert.strictEqual(isKnownCompound(I["Na+"], I["N3-"]), false);
  assert.strictEqual(isKnownCompound(I["K+"], I["N3-"]), false);
});

test("ionText kann jede Ladung schreiben (Distraktoren wie Na⁷⁻)", () => {
  const na = I["Na+"];
  for (const q of [-7, -6, -5, 5, 6, 7, 1, -1]) assert.ok(!/undefined/.test(ionText({ ...na, charge: q })), String(q));
  assert.strictEqual(ionText({ ...na, charge: -7 }), "Na⁷⁻");
  assert.strictEqual(ionText({ ...na, charge: 1 }), "Na⁺");
});
