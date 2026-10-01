import { test, assert } from "vitest";
import { KNOWN, KNOWN_BY_ID as K, toMolecule, isComplete, electronsOf, sumFormula, identify, shapeAt, isPolar, canBond, sideLayout, loneLayout, type Molecule } from "../src/molecules.ts";

test("alle bekannten Moleküle erfüllen die Oktettregel und werden erkannt", () => {
  for (const k of KNOWN) {
    const m = toMolecule(k, 2, 1);
    assert.ok(isComplete(m), `${k.name} nicht vollständig`);
    assert.strictEqual(identify(m)?.id, k.id, `${k.name} nicht erkannt`);
    for (const a of m.atoms) {
      const e = electronsOf(m, a.id);
      assert.strictEqual(e.singles, 0, `${k.name}: ungepaartes Elektron an ${a.el}`);
      const L = sideLayout(m, a.id);
      const shown = Object.values(L).reduce((s, v) => s + ("lone" in v ? v.lone : 0), 0);
      assert.strictEqual(shown, e.lone, `${k.name}: Lewis-Darstellung ${a.el}`);
    }
  }
});

test("Lewis-Elektronen freier Atome", () => {
  const one = (el: string): Molecule => ({ atoms: [{ id: 1, el, x: 0, y: 0 }], bonds: [] });
  const e = (el: string) => { const r = electronsOf(one(el), 1); return [r.pairs, r.singles]; };
  assert.deepEqual(e("H"), [0, 1]);
  assert.deepEqual(e("C"), [0, 4]);
  assert.deepEqual(e("N"), [1, 3]);
  assert.deepEqual(e("O"), [2, 2]);
  assert.deepEqual(e("Cl"), [3, 1]);
});

test("Bindungen nur mit ungepaarten Elektronen", () => {
  const m = toMolecule(K.H2O);
  assert.ok(!canBond(m, 1, 2), "H hat schon Duett");
  const cl2: Molecule = { atoms: [{ id: 1, el: "Cl", x: 0, y: 0 }, { id: 2, el: "Cl", x: 1, y: 0 }], bonds: [] };
  assert.ok(canBond(cl2, 1, 2));
  cl2.bonds.push({ a: 1, b: 2, order: 1 });
  assert.ok(!canBond(cl2, 1, 2), "keine Zweifachbindung bei Cl2");
});

test("Formel, Geometrie, Polarität", () => {
  assert.strictEqual(sumFormula(toMolecule(K.NH3)), "NH3");
  assert.strictEqual(sumFormula(toMolecule(K.H2O)), "H2O");
  assert.strictEqual(sumFormula(toMolecule(K.CH4)), "CH4");
  const g = (id: string, c = 1) => shapeAt(toMolecule(K[id]), c)!.geometry;
  assert.strictEqual(g("CH4"), "tetraedrisch");
  assert.strictEqual(g("NH3"), "trigonal-pyramidal");
  assert.strictEqual(g("H2O"), "gewinkelt");
  assert.strictEqual(g("CO2", 2), "linear");
  assert.strictEqual(g("CH2O", 2), "trigonal-planar");
  const p = (id: string) => isPolar(toMolecule(K[id]));
  assert.ok(p("H2O")); assert.ok(p("NH3")); assert.ok(p("HCl")); assert.ok(p("CH3Cl"));
  assert.ok(!p("CO2")); assert.ok(!p("CH4")); assert.ok(!p("CCl4")); assert.ok(!p("Cl2")); assert.ok(!p("C2H4"));
});

test("freie Elektronenpaare symmetrisch (O in CO2 schräg gegenüber der Bindung)", () => {
  const m = toMolecule(K.CO2);
  const oLeft = loneLayout(m, 1).map(g => g.angle).sort((a, b) => a - b);
  assert.deepEqual(oLeft, [135, 225]);       // Bindung nach rechts → Paare links oben und links unten
  const oRight = loneLayout(m, 3).map(g => g.angle).sort((a, b) => a - b);
  assert.deepEqual(oRight, [45, 315]);
  for (const k of KNOWN) {
    const mol = toMolecule(k);
    for (const a of mol.atoms) {
      const total = loneLayout(mol, a.id).reduce((s, g) => s + g.n, 0);
      assert.strictEqual(total, electronsOf(mol, a.id).lone, `${k.name}/${a.el}`);
    }
  }
});

test("fachliche Details: Winkel, Summenformel, schwach polar", async () => {
  const { KNOWN_BY_ID: K, toMolecule, shapeAt, sumFormula, isPolar, isWeaklyPolar } = await import("../src/molecules.ts");
  const center = (id: string) => {
    const m = toMolecule(K[id]);
    const c = [...m.atoms].sort((a, b) => m.bonds.filter(x => x.a === b.id || x.b === b.id).length - m.bonds.filter(x => x.a === a.id || x.b === a.id).length)[0];
    return shapeAt(m, c.id)!;
  };
  assert.strictEqual(center("H2O").angle, "104,5°");
  assert.strictEqual(center("NH3").angle, "107°");
  assert.strictEqual(center("H2S").angle, "92,1°");
  assert.strictEqual(center("PH3").angle, "93,5°");
  assert.strictEqual(center("CH4").angle, "109,5°");
  assert.strictEqual(sumFormula(toMolecule(K.CH3OH)), "CH4O");
  assert.strictEqual(sumFormula(toMolecule(K.C2H5OH)), "C2H6O");
  assert.strictEqual(sumFormula(toMolecule(K.NH3)), "NH3");
  assert.strictEqual(sumFormula(toMolecule(K.H2O)), "H2O");
  assert.strictEqual(isWeaklyPolar(toMolecule(K.H2S)), true);
  for (const id of ["H2O", "CH4", "PH3", "CO2", "Cl2", "C2H6"]) assert.strictEqual(isWeaklyPolar(toMolecule(K[id])), false, id);
  assert.strictEqual(isPolar(toMolecule(K.H2S)), false);
});
