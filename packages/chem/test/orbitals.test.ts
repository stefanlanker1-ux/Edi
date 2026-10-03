import { test, assert } from "vitest";
import { slaterZeff, orbitalGrid, occupiedOrbitals, reachOf, atomIso } from "../src/orbitals.ts";

test("Slater-Regeln: bekannte Werte", () => {
  assert.approximately(slaterZeff(8, 2, 1), 4.55, 1e-9);   // O 2p
  assert.approximately(slaterZeff(8, 1, 0), 7.70, 1e-9);   // O 1s
  assert.approximately(slaterZeff(6, 2, 1), 3.25, 1e-9);   // C 2p
  assert.approximately(slaterZeff(11, 3, 0), 2.20, 1e-9);  // Na 3s
  assert.approximately(slaterZeff(26, 3, 2), 6.25, 1e-9);  // Fe 3d
  assert.approximately(slaterZeff(26, 4, 0), 3.75, 1e-9);  // Fe 4s
});

test("ψ ist normiert (∫|ψ|² dV ≈ 1)", () => {
  for (const o of [{ n: 1, l: 0, m: "s" }, { n: 2, l: 1, m: "pz" }, { n: 3, l: 2, m: "dz2" }, { n: 3, l: 2, m: "dx2-y2" }, { n: 4, l: 3, m: "fxyz" }]) {
    const Z = 3, g = orbitalGrid(o, Z, 64), d = (2 * g.half) / (g.res - 1);
    let sum = 0;
    for (const v of g.psi) sum += v * v * d * d * d;
    assert.approximately(sum, 1, 0.03, `${o.n}${o.m}`);
  }
});

test("Sauerstoff (gleiche Elektronendichte): die 2p-Hanteln ragen aus der 2s-Kugel heraus, 1s ist klein", () => {
  const orbs = occupiedOrbitals(8), iso = atomIso(orbs);
  const z2 = slaterZeff(8, 2, 1), z1 = slaterZeff(8, 1, 0);
  const p = reachOf({ n: 2, l: 1, m: "pz" }, z2, iso);
  const s = reachOf({ n: 2, l: 0, m: "s" }, z2, iso);
  const s1 = reachOf({ n: 1, l: 0, m: "s" }, z1, iso);
  assert.ok(p > s * 1.04, `2p ${p} Å, 2s ${s} Å`);
  assert.ok(s1 < s * 0.75, `1s ${s1} Å, 2s ${s} Å`);
});

test("Besetzung nach Hund: O hat 2p mit 2, 1, 1 Elektronen; Fe 3d mit 2, 1, 1, 1, 1", () => {
  const o = occupiedOrbitals(8).filter(x => x.n === 2 && x.l === 1).map(x => x.electrons);
  assert.deepEqual(o, [2, 1, 1]);
  const fe = occupiedOrbitals(26).filter(x => x.l === 2).map(x => x.electrons);
  assert.deepEqual(fe, [2, 1, 1, 1, 1]);
});
