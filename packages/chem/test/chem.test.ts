import { test, assert } from "vitest";
import { elementsIn } from "../src/config.ts";
import { ELEMENTS, BY_Z, standardNeutrons, isStable } from "../src/elements.ts";
import {
  configuration, configString, shortConfigString, shells, unpairedElectrons,
  blockOf, valenceElectrons, chargeSup, hundBoxes,
} from "../src/config.ts";

test("86 Elemente, lückenlos", () => {
  assert.strictEqual(ELEMENTS.length, 86);
  ELEMENTS.forEach((e, i) => assert.strictEqual(e.Z, i + 1));
});

test("Periode und Gruppe", () => {
  const pg = (Z: number) => [BY_Z[Z].period, BY_Z[Z].group];
  assert.deepEqual(pg(1), [1, 1]);
  assert.deepEqual(pg(2), [1, 18]);
  assert.deepEqual(pg(13), [3, 13]);
  assert.deepEqual(pg(26), [4, 8]);
  assert.deepEqual(pg(55), [6, 1]);
  assert.deepEqual(pg(60), [6, null]);
  assert.deepEqual(pg(72), [6, 4]);
  assert.deepEqual(pg(86), [6, 18]);
});

test("Konfigurationen Hauptgruppen", () => {
  assert.strictEqual(configString(configuration(8)), "1s² 2s² 2p⁴");
  assert.strictEqual(shortConfigString(20), "[Ar] 4s²");
  assert.strictEqual(shortConfigString(10), "[He] 2s² 2p⁶");
  assert.strictEqual(shortConfigString(1), "1s¹");
  assert.strictEqual(shortConfigString(86), "[Xe] 6s² 4f¹⁴ 5d¹⁰ 6p⁶");
});

test("Ausnahmen Cr, Cu, Pd, Au", () => {
  assert.strictEqual(shortConfigString(24), "[Ar] 4s¹ 3d⁵");
  assert.strictEqual(shortConfigString(29), "[Ar] 4s¹ 3d¹⁰");
  assert.strictEqual(shortConfigString(46), "[Kr] 4d¹⁰");
  assert.strictEqual(shortConfigString(79), "[Xe] 6s¹ 4f¹⁴ 5d¹⁰");
  assert.strictEqual(shortConfigString(24, 24, { exceptions: false }), "[Ar] 4s² 3d⁴");
});

test("Ionen", () => {
  assert.strictEqual(shortConfigString(26, 24), "[Ar] 3d⁶");      // Fe²⁺
  assert.strictEqual(shortConfigString(26, 23), "[Ar] 3d⁵");      // Fe³⁺
  assert.strictEqual(configString(configuration(11, 10)), "1s² 2s² 2p⁶"); // Na⁺
  assert.strictEqual(configString(configuration(17, 18)), "1s² 2s² 2p⁶ 3s² 3p⁶"); // Cl⁻
});

test("Schalen", () => {
  assert.deepEqual(shells(6), [2, 4]);
  assert.deepEqual(shells(19), [2, 8, 8, 1]);
  assert.deepEqual(shells(26), [2, 8, 14, 2]);
  assert.deepEqual(shells(86), [2, 8, 18, 32, 18, 8]);
  assert.deepEqual(shells(11, 10), [2, 8]);
  for (const e of ELEMENTS) assert.strictEqual(shells(e.Z).reduce((a, b) => a + b, 0), e.Z);
});

test("Ungepaarte Elektronen, Block, Valenz", () => {
  assert.strictEqual(unpairedElectrons(configuration(8)), 2);
  assert.strictEqual(unpairedElectrons(configuration(7)), 3);
  assert.strictEqual(unpairedElectrons(configuration(24)), 6);
  assert.strictEqual(unpairedElectrons(configuration(26)), 4);
  assert.strictEqual(blockOf(2), "s"); assert.strictEqual(blockOf(26), "d");
  assert.strictEqual(blockOf(60), "f"); assert.strictEqual(blockOf(35), "p");
  assert.strictEqual(valenceElectrons(17), 7); assert.strictEqual(valenceElectrons(2), 2);
  assert.deepEqual(hundBoxes(1, 4), [2, 1, 1]);
});

test("Ionennamen", async () => {
  const { ionName } = await import("../src/config.ts");
  assert.strictEqual(ionName(11, 1), "Natrium-Ion");
  assert.strictEqual(ionName(17, -1), "Chlorid-Ion");
  assert.strictEqual(ionName(7, -3), "Nitrid-Ion");
  assert.strictEqual(ionName(8, -2), "Oxid-Ion");
  assert.strictEqual(ionName(26, 3), "Eisen(III)-Ion");
  assert.strictEqual(ionName(30, 2), "Zink-Ion");
});

test("Kationen: Elektronen von außen nach innen abgeben", async () => {
  const { shortConfigString } = await import("../src/config.ts");
  assert.strictEqual(shortConfigString(26, 24), "[Ar] 3d⁶");
  assert.strictEqual(shortConfigString(29, 28), "[Ar] 3d¹⁰");
  assert.strictEqual(shortConfigString(24, 21), "[Ar] 3d³");
  assert.strictEqual(shortConfigString(63, 60), "[Xe] 4f⁶");
  assert.strictEqual(shortConfigString(58, 55), "[Xe] 4f¹");
  assert.strictEqual(shortConfigString(82, 80), "[Xe] 6s² 4f¹⁴ 5d¹⁰");
  assert.strictEqual(shortConfigString(50, 46), "[Kr] 4d¹⁰");
  assert.strictEqual(shortConfigString(31, 28), "[Ar] 3d¹⁰");
  assert.strictEqual(shortConfigString(11, 10), "[He] 2s² 2p⁶");
});

test("Neutronen, Stabilität, Ladung", () => {
  assert.strictEqual(standardNeutrons(6), 6);
  assert.strictEqual(standardNeutrons(17), 18);
  // häufigstes Isotop, nicht gerundete Atommasse: Cu-63, Br-79, Ni-58, Zn-64, Ag-107
  assert.strictEqual(29 + standardNeutrons(29), 63);
  assert.strictEqual(35 + standardNeutrons(35), 79);
  assert.strictEqual(28 + standardNeutrons(28), 58);
  assert.strictEqual(30 + standardNeutrons(30), 64);
  assert.strictEqual(47 + standardNeutrons(47), 107);
  for (const e of ELEMENTS) assert.ok(standardNeutrons(e.Z) >= 0 && Math.abs(e.Z + standardNeutrons(e.Z) - e.mass) < 5, e.symbol);
  // für Z ≤ 20 ist das häufigste Isotop stabil
  for (let Z = 1; Z <= 20; Z++) assert.strictEqual(isStable(Z, standardNeutrons(Z)), true, `Z ${Z}`);
  assert.strictEqual(isStable(6, 8), false);
  assert.strictEqual(isStable(6, 7), true);
  assert.strictEqual(isStable(30, 34), null);
  assert.strictEqual(chargeSup(2), "²⁺"); assert.strictEqual(chargeSup(-1), "⁻"); assert.strictEqual(chargeSup(0), "");
});

test("Trends: Daten vollständig und plausibel", async () => {
  const { TRENDS, trendScale } = await import("../src/trends.ts");
  for (const e of ELEMENTS) {
    assert.ok(TRENDS.radius.value(e.Z)! > 0, `Radius ${e.symbol}`);
    assert.ok(TRENDS.ie.value(e.Z)! > 3, `IE ${e.symbol}`);
  }
  assert.strictEqual(TRENDS.ie.value(2), 24.59);   // Helium höchste
  assert.strictEqual(TRENDS.radius.value(55), 244); // Caesium größter
  const s = trendScale("en", ELEMENTS.map(e => e.Z));
  assert.strictEqual(s(9), 1);                      // Fluor = Maximum
  assert.strictEqual(s(2), null);                   // Helium ohne EN
});

test("Elemente in Aufgabentexten erkennen", () => {
  const z = (t: string) => elementsIn(t).sort((a, b) => a - b);
  assert.deepEqual(z("Baue ein **Sauerstoff**-Atom."), [8]);
  assert.deepEqual(z("Wie viele Elektronen hat das Chlorid-Ion?"), [17]);
  assert.deepEqual(z("Welche Ladung hat Fe³⁺ und Cl⁻?"), [17, 26]);
  assert.deepEqual(z("Natriumchlorid"), [11, 17]);
  assert.deepEqual(z("Kohlenstoff"), [6]);
  assert.deepEqual(z("Wie viele Protonen hat dieses Atom?"), []);
});
