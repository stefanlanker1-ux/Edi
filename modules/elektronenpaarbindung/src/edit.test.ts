import { test, assert } from "vitest";
import { isComplete, identify } from "@lern/chem";
import { empty, place, move, cycleBond, remove } from "./edit.ts";

test("Wasser bauen: Bindungen entstehen automatisch", () => {
  let m = empty();
  m = place(m, "O", 2, 2);
  m = place(m, "H", 1, 2);
  m = place(m, "H", 2, 3);
  assert.strictEqual(m.bonds.length, 2);
  assert.ok(isComplete(m));
  assert.strictEqual(identify(m)?.id, "H2O");
});

test("Kohlendioxid: Zweifachbindungen per Tipp", () => {
  let m = empty();
  m = place(m, "O", 1, 1); m = place(m, "C", 2, 1); m = place(m, "O", 3, 1);
  assert.ok(!isComplete(m));
  m = cycleBond(m, 1, 2).mol; m = cycleBond(m, 2, 3).mol;
  assert.ok(isComplete(m));
  assert.strictEqual(identify(m)?.id, "CO2");
  // weiter tippen: C hat keine freien Elektronen mehr → Bindung wird gelöst
  const r = cycleBond(m, 1, 2);
  assert.strictEqual(r.action, "removed");
});

test("Verschieben löst Bindungen, Entfernen auch", () => {
  let m = place(place(empty(), "H", 0, 0), "Cl", 1, 0);
  assert.strictEqual(identify(m)?.id, "HCl");
  m = move(m, 2, 3, 3);
  assert.strictEqual(m.bonds.length, 0);
  m = move(m, 2, 0, 1);
  assert.strictEqual(m.bonds.length, 1);
  m = remove(m, 1);
  assert.strictEqual(m.atoms.length, 1);
  assert.strictEqual(m.bonds.length, 0);
});
