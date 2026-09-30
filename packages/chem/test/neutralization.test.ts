import { test, assert } from "vitest";
import {
  PROTIC_ACIDS, HYDROXIDES, neutralEquation, restOf, isKnownSalt, protolysis, hydroxideDissociation, neutralWords,
} from "../src/neutralization.ts";
import { parseFormula, balance, isBalanced } from "../src/reactions.ts";

test("alle Säuren der Tabelle sind dabei", () => {
  assert.deepEqual(PROTIC_ACIDS.map(a => a.formula),
    ["HCl", "HClO4", "HCOOH", "HBr", "HNO3", "CH3COOH", "H2S", "H2SO3", "H2SO4", "H2CO3", "H3PO4"]);
  assert.deepEqual(PROTIC_ACIDS.map(a => a.protons), [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3]);
  const names = PROTIC_ACIDS.flatMap(a => a.rests.map(r => r.name.replace(/-Ion$/, "")));
  assert.deepEqual(names, ["Chlorid", "Perchlorat", "Formiat", "Bromid", "Nitrat", "Acetat", "Hydrogensulfid", "Sulfid",
    "Hydrogensulfit", "Sulfit", "Hydrogensulfat", "Sulfat", "Hydrogencarbonat", "Carbonat", "Dihydrogenphosphat", "Hydrogenphosphat", "Phosphat"]);
});

test("Säurerest = Säure minus abgegebene H, Ladung = Zahl der abgegebenen H⁺", () => {
  for (const a of PROTIC_ACIDS) {
    assert.strictEqual(a.rests.length, a.protons, a.id);
    a.rests.forEach((r, i) => {
      const k = i + 1;
      assert.strictEqual(r.charge, -k, `${a.id} Stufe ${k}`);
      const acid = parseFormula(a.formula), ion = parseFormula(r.formula);
      assert.strictEqual((acid.H ?? 0) - k, ion.H ?? 0, `${a.id}: H im Rest`);
      for (const el of Object.keys(acid)) if (el !== "H") assert.strictEqual(acid[el], ion[el], `${a.id}: ${el}`);
    });
  }
});

test("jede Neutralisation ist ausgeglichen und hat die kleinsten Zahlen", () => {
  for (const b of HYDROXIDES) for (const a of PROTIC_ACIDS) for (let k = 1; k <= a.protons; k++) {
    const n = neutralEquation(b, a, k);
    assert.ok(isBalanced(n.eq, n.coeffs), `${b.formula} + ${a.formula} (${k})`);
    assert.deepEqual(balance(n.eq), n.coeffs, `${b.formula} + ${a.formula} (${k}): nicht die kleinsten Zahlen`);
    assert.strictEqual(n.water, n.nBase * b.cation.charge);
    assert.strictEqual(n.water, n.nAcid * k);
    assert.strictEqual(n.rest, restOf(a, k));
  }
});

test("Beispiele wie im Heft", () => {
  const B = (id: string) => HYDROXIDES.find(b => b.id === id)!, A = (id: string) => PROTIC_ACIDS.find(a => a.id === id)!;
  const ba = neutralEquation(B("baoh2"), A("h3po4"));
  assert.deepEqual([ba.nBase, ba.nAcid, ba.water, ba.salt, ba.saltName], [3, 2, 6, "Ba3(PO4)2", "Bariumphosphat"]);
  const na = neutralEquation(B("naoh"), A("h2so4"));
  assert.deepEqual([na.nBase, na.nAcid, na.water, na.salt], [2, 1, 2, "Na2SO4"]);
  const ca = neutralEquation(B("caoh2"), A("ch3cooh"));
  assert.deepEqual([ca.salt, ca.saltName], ["Ca(CH3COO)2", "Calciumacetat"]);
  const hp = neutralEquation(B("naoh"), A("h3po4"), 1);
  assert.deepEqual([hp.nBase, hp.nAcid, hp.water, hp.salt, hp.saltName], [1, 1, 1, "NaH2PO4", "Natriumdihydrogenphosphat"]);
  const hc = neutralEquation(B("caoh2"), A("h2co3"), 1);
  assert.deepEqual([hc.salt, hc.saltName], ["Ca(HCO3)2", "Calciumhydrogencarbonat"]);
  assert.strictEqual(neutralWords(na), "Natronlauge + Schwefelsäure → Natriumsulfat + Wasser");
  assert.strictEqual(neutralWords(neutralEquation(B("naoh"), A("hcl"))), "Natronlauge + Salzsäure → Natriumchlorid + Wasser");
  assert.strictEqual(protolysis(A("h3po4")), "H₃PO₄ → 3 H⁺ + PO₄³⁻");
  assert.strictEqual(protolysis(A("h3po4"), 2), "H₃PO₄ → 2 H⁺ + HPO₄²⁻");
  assert.strictEqual(hydroxideDissociation(B("baoh2")), "Ba(OH)₂ → Ba²⁺ + 2 OH⁻");
  assert.ok(!isKnownSalt(B("aloh3"), restOf(A("h2co3"))));
  assert.ok(isKnownSalt(B("aloh3"), restOf(A("h3po4"))));
});
