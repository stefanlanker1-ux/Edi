import { test, assert } from "vitest";
import { elementsIn } from "../src/config.ts";
import { ELEMENTS, BY_Z, standardNeutrons, isStable, groupName, elementPronoun } from "../src/elements.ts";
import {
  configuration, configString, shortConfigString, shells, unpairedElectrons,
  blockOf, valenceElectrons, chargeSup, hundBoxes, ruleConfiguration, configException, AUFBAU_EXCEPTIONS,
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
  // Wasserstoff steht in Gruppe 1, ist aber kein Alkalimetall
  assert.strictEqual(groupName(1), null);
  assert.strictEqual(groupName(3), "Alkalimetalle");
  assert.strictEqual(groupName(2), "Edelgase");
  assert.strictEqual(groupName(26), null);
  // Pronomen zum Elementnamen: der Sauerstoff → er, das Natrium → es
  assert.deepEqual([8, 7, 16, 15, 11, 17].map(elementPronoun), ["Er", "Er", "Er", "Er", "Es", "Es"]);
});

test("Konfigurationen Hauptgruppen", () => {
  assert.strictEqual(configString(configuration(8)), "1s² 2s² 2p⁴");
  assert.strictEqual(shortConfigString(20), "[Ar] 4s²");
  assert.strictEqual(shortConfigString(10), "[He] 2s² 2p⁶");
  assert.strictEqual(shortConfigString(1), "1s¹");
  assert.strictEqual(shortConfigString(86), "[Xe] 6s² 4f¹⁴ 5d¹⁰ 6p⁶");
});

test("gemessene Grundzustände: die 13 Ausnahmen vom Aufbauprinzip bis Z = 86", () => {
  const ref: Record<number, string> = {
    24: "[Ar] 4s¹ 3d⁵", 29: "[Ar] 4s¹ 3d¹⁰", 41: "[Kr] 5s¹ 4d⁴", 42: "[Kr] 5s¹ 4d⁵", 44: "[Kr] 5s¹ 4d⁷", 45: "[Kr] 5s¹ 4d⁸",
    46: "[Kr] 4d¹⁰", 47: "[Kr] 5s¹ 4d¹⁰", 57: "[Xe] 6s² 5d¹", 58: "[Xe] 6s² 4f¹ 5d¹", 64: "[Xe] 6s² 4f⁷ 5d¹",
    78: "[Xe] 6s¹ 4f¹⁴ 5d⁹", 79: "[Xe] 6s¹ 4f¹⁴ 5d¹⁰",
  };
  assert.deepEqual([...AUFBAU_EXCEPTIONS].sort((a, b) => a - b), Object.keys(ref).map(Number));
  for (const [Z, c] of Object.entries(ref)) assert.strictEqual(shortConfigString(Number(Z)), c, BY_Z[Number(Z)].symbol);
  // Schalen und ungepaarte Elektronen aus dem gemessenen Grundzustand
  assert.deepEqual(shells(24), [2, 8, 13, 1]);
  assert.deepEqual(shells(29), [2, 8, 18, 1]);
  assert.deepEqual(shells(46), [2, 8, 18, 18]);
  assert.deepEqual(shells(47), [2, 8, 18, 18, 1]);
  assert.deepEqual(shells(79), [2, 8, 18, 32, 18, 1]);
  const u = (Z: number) => unpairedElectrons(configuration(Z));
  assert.deepEqual([24, 29, 41, 42, 44, 45, 46, 47, 57, 58, 64, 78, 79].map(u), [6, 1, 5, 6, 4, 3, 0, 1, 1, 2, 8, 2, 1]);
  // daneben die Regel allein (für Aufgaben zum Aufbauprinzip)
  assert.strictEqual(configString(ruleConfiguration(24)), "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁴");
  // Nachbarn ohne Ausnahme bleiben beim Aufbauprinzip
  assert.strictEqual(shortConfigString(25), "[Ar] 4s² 3d⁵");
  assert.strictEqual(shortConfigString(30), "[Ar] 4s² 3d¹⁰");
  assert.strictEqual(shortConfigString(63), "[Xe] 6s² 4f⁷");
  assert.strictEqual(shortConfigString(71), "[Xe] 6s² 4f¹⁴ 5d¹");
});

test("Kationen der Übergangsmetalle aus dem gemessenen Grundzustand: zuerst die ns-Elektronen", () => {
  const ion = (Z: number, q: number) => shortConfigString(Z, Z - q);
  assert.strictEqual(ion(29, 1), "[Ar] 3d¹⁰");      // Cu⁺
  assert.strictEqual(ion(29, 2), "[Ar] 3d⁹");       // Cu²⁺
  assert.deepEqual(shells(29, 28), [2, 8, 18]);
  assert.strictEqual(ion(47, 1), "[Kr] 4d¹⁰");      // Ag⁺
  assert.deepEqual(shells(47, 46), [2, 8, 18, 18]);
  assert.strictEqual(ion(79, 1), "[Xe] 4f¹⁴ 5d¹⁰"); // Au⁺
  assert.strictEqual(ion(79, 3), "[Xe] 4f¹⁴ 5d⁸");  // Au³⁺
  assert.strictEqual(ion(78, 2), "[Xe] 4f¹⁴ 5d⁸");  // Pt²⁺
  assert.strictEqual(ion(46, 2), "[Kr] 4d⁸");       // Pd²⁺
  assert.strictEqual(ion(24, 2), "[Ar] 3d⁴");       // Cr²⁺
  assert.strictEqual(ion(24, 3), "[Ar] 3d³");       // Cr³⁺
  assert.strictEqual(ion(26, 2), "[Ar] 3d⁶");       // Fe²⁺
  assert.strictEqual(ion(58, 3), "[Xe] 4f¹");       // Ce³⁺
  assert.strictEqual(ion(64, 3), "[Xe] 4f⁷");       // Gd³⁺
  assert.strictEqual(ion(57, 3), "[Xe]");           // La³⁺
  // gemessene Grundzustände einfach geladener Kationen, die von der Regel abweichen (NIST)
  assert.strictEqual(ion(23, 1), "[Ar] 3d⁴");       // V⁺
  assert.strictEqual(ion(27, 1), "[Ar] 3d⁸");       // Co⁺
  assert.strictEqual(ion(28, 1), "[Ar] 3d⁹");       // Ni⁺
  assert.strictEqual(ion(39, 1), "[Kr] 5s²");       // Y⁺
  assert.strictEqual(ion(57, 1), "[Xe] 5d²");       // La⁺
  assert.strictEqual(ion(58, 2), "[Xe] 4f²");       // Ce²⁺
  assert.strictEqual(ion(71, 1), "[Xe] 6s² 4f¹⁴");  // Lu⁺
  assert.strictEqual(ion(72, 1), "[Xe] 6s² 4f¹⁴ 5d¹"); // Hf⁺
  assert.strictEqual(ion(23, 2), "[Ar] 3d³");       // V²⁺ nach Regel
  assert.strictEqual(ion(26, 1), "[Ar] 4s¹ 3d⁶");   // Fe⁺ nach Regel
});

test("Ausnahmen sind gekennzeichnet (halb/voll besetzte d-Unterschale …)", () => {
  assert.strictEqual(configException(24), "d5");
  assert.strictEqual(configException(42), "d5");
  for (const Z of [29, 46, 47, 79]) assert.strictEqual(configException(Z), "d10", String(Z));
  assert.strictEqual(configException(64), "f7");
  for (const Z of [41, 44, 45, 57, 58, 78]) assert.strictEqual(configException(Z), "other", String(Z));
  // Ionen: das Atom ist die Ausnahme, das Ion folgt der Regel (Cu⁺ = Cu [Ar] 4s¹ 3d¹⁰ ohne 4s) – bzw. das Ion selbst (V⁺)
  assert.strictEqual(configException(29, 28), "atom");  // Cu⁺
  assert.strictEqual(configException(29, 27), "atom");  // Cu²⁺
  assert.strictEqual(configException(23, 22), "ion");   // V⁺ [Ar] 3d⁴
  assert.strictEqual(configException(23, 21), null);    // V²⁺
  assert.strictEqual(configException(26, 24), null);    // Fe²⁺
  assert.strictEqual(configException(26), null);
  assert.strictEqual(configException(11, 10), null);
});

test("Ionen mit Edelgas-Elektronenzahl: Edelgas als ganzer Kern", () => {
  const ion = (Z: number, q: number) => shortConfigString(Z, Z - q);
  assert.strictEqual(ion(11, 1), "[Ne]");
  assert.strictEqual(ion(8, -2), "[Ne]");
  assert.strictEqual(ion(13, 3), "[Ne]");
  assert.strictEqual(ion(17, -1), "[Ar]");
  assert.strictEqual(ion(20, 2), "[Ar]");
  assert.strictEqual(ion(35, -1), "[Kr]");
  assert.strictEqual(ion(3, 1), "[He]");
  // das Edelgas-Atom selbst mit dem vorigen Kern
  assert.strictEqual(shortConfigString(10), "[He] 2s² 2p⁶");
  assert.strictEqual(shortConfigString(36), "[Ar] 4s² 3d¹⁰ 4p⁶");
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
  // Baukasten: bis zu 3 Elektronen mehr oder weniger – jedes Elektron bekommt einen Platz (auch Rn mit 89)
  for (const e of ELEMENTS) for (let E = Math.max(0, e.Z - 3); E <= e.Z + 3; E++) assert.strictEqual(shells(e.Z, E).reduce((a, b) => a + b, 0), E, `${e.symbol} ${E}`);
});

test("Ungepaarte Elektronen, Block, Valenz", () => {
  assert.strictEqual(unpairedElectrons(configuration(8)), 2);
  assert.strictEqual(unpairedElectrons(configuration(7)), 3);
  assert.strictEqual(unpairedElectrons(configuration(24)), 6); // gemessen 4s¹ 3d⁵
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
  assert.strictEqual(shortConfigString(30, 28), "[Ar] 3d¹⁰");
  assert.strictEqual(shortConfigString(24, 21), "[Ar] 3d³");
  assert.strictEqual(shortConfigString(63, 60), "[Xe] 4f⁶");
  assert.strictEqual(shortConfigString(58, 55), "[Xe] 4f¹");
  assert.strictEqual(shortConfigString(82, 80), "[Xe] 6s² 4f¹⁴ 5d¹⁰");
  assert.strictEqual(shortConfigString(50, 46), "[Kr] 4d¹⁰");
  assert.strictEqual(shortConfigString(31, 28), "[Ar] 3d¹⁰");
  assert.strictEqual(shortConfigString(11, 10), "[Ne]");
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
