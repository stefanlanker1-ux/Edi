// Elementdaten der 7. Periode (Fr–Og): Ordnungszahlen, Gruppe, Periode, Block, Kategorien, keine erfundenen Werte
import { test, assert } from "vitest";
import { ELEMENTS, BY_Z, BY_SYMBOL, CATEGORIES, groupName, fSeriesName, standardNeutrons, searchElements } from "../src/elements.ts";
import { blockOf, groupLabel, elementsIn, CONFIG_MAX_Z, AUFBAU_EXCEPTIONS } from "../src/config.ts";
import { TRENDS } from "../src/trends.ts";

test("118 Elemente, Ordnungszahlen lückenlos, Symbole und Namen eindeutig", () => {
  assert.strictEqual(ELEMENTS.length, 118);
  ELEMENTS.forEach((e, i) => assert.strictEqual(e.Z, i + 1));
  assert.strictEqual(new Set(ELEMENTS.map(e => e.symbol)).size, 118);
  assert.strictEqual(new Set(ELEMENTS.map(e => e.name)).size, 118);
  assert.deepEqual([87, 92, 103, 104, 118].map(Z => BY_Z[Z].symbol), ["Fr", "U", "Lr", "Rf", "Og"]);
  assert.deepEqual(["Uran", "Tenness", "Oganesson", "Roentgenium"].map(n => ELEMENTS.find(e => e.name === n)?.Z), [92, 117, 118, 111]);
});

test("Periode, Gruppe und Block der 7. Periode", () => {
  for (let Z = 87; Z <= 118; Z++) assert.strictEqual(BY_Z[Z].period, 7, BY_Z[Z].symbol);
  assert.strictEqual(BY_Z[86].period, 6);
  const g = (Z: number) => BY_Z[Z].group;
  assert.deepEqual([87, 88].map(g), [1, 2]);
  for (let Z = 104; Z <= 118; Z++) assert.strictEqual(g(Z), Z - 100, BY_Z[Z].symbol);
  // f-Block: Lanthanoide 57–71 und Actinoide 89–103 ohne Gruppe, alle übrigen mit
  for (const e of ELEMENTS) {
    const f = (e.Z >= 57 && e.Z <= 71) || (e.Z >= 89 && e.Z <= 103);
    assert.strictEqual(e.group === null, f, e.symbol);
    assert.strictEqual(blockOf(e.Z) === "f", f, e.symbol);
  }
  assert.deepEqual([87, 88, 104, 112, 113, 118].map(blockOf), ["s", "s", "d", "d", "p", "p"]);
  // jede Gruppe kommt in Periode 7 genau einmal vor – außer Gruppe 3: dort steht wie in Periode 6 der Platzhalter der f-Reihe (Ac–Lr)
  const groups = Array.from({ length: 18 }, (_, i) => i + 1).filter(x => x !== 3);
  for (const p of [6, 7]) assert.deepEqual(ELEMENTS.filter(e => e.period === p && e.group !== null).map(e => e.group), groups, `Periode ${p}`);
  assert.strictEqual(groupLabel(92, true), "Actinoide");
  assert.strictEqual(groupLabel(60, true), "Lanthanoide");
  assert.deepEqual([57, 71, 89, 103, 72, 104].map(fSeriesName), ["Lanthanoide", "Lanthanoide", "Actinoide", "Actinoide", null, null]);
});

test("Kategorien: Fr Alkalimetall, Ra Erdalkalimetall, Actinoide, Rf–Hs Übergangsmetalle, ab Mt unbekannt", () => {
  const c = (Z: number) => BY_Z[Z].category;
  assert.strictEqual(c(87), "alkali");
  assert.strictEqual(c(88), "earth");
  for (let Z = 89; Z <= 103; Z++) assert.strictEqual(c(Z), "actinoid");
  for (let Z = 104; Z <= 108; Z++) assert.strictEqual(c(Z), "transition");
  for (let Z = 109; Z <= 118; Z++) assert.strictEqual(c(Z), "unknown");
  assert.strictEqual(CATEGORIES.unknown.kind, "unbekannt");
  // keine Gruppennamen für Elemente mit unbekannten Eigenschaften (Og ist nicht als Edelgas belegt); Fr ist Alkalimetall
  assert.strictEqual(groupName(118), null);
  assert.strictEqual(groupName(117), null);
  assert.strictEqual(groupName(87), "Alkalimetalle");
  for (let Z = 87; Z <= 118; Z++) assert.ok(BY_Z[Z].radioactive, BY_Z[Z].symbol);
  // bis Radon unverändert
  assert.ok(ELEMENTS.filter(e => e.Z <= 86).every(e => e.category !== "actinoid" && e.category !== "unknown"));
});

test("Massen der 7. Periode: Standardatommasse (Th, Pa, U) bzw. Massenzahl – keine erfundenen Werte", () => {
  assert.deepEqual([90, 91, 92].map(Z => BY_Z[Z].mass), [232.04, 231.04, 238.03]);
  for (let Z = 87; Z <= 118; Z++) {
    const e = BY_Z[Z];
    if (![90, 91, 92].includes(Z)) assert.ok(Number.isInteger(e.mass), `${e.symbol}: Massenzahl`);
    assert.strictEqual(Z + standardNeutrons(Z), Math.round(e.mass), e.symbol);
  }
  // Elektronegativität nur, wo aus Messdaten bestimmt (Ra–Pu), sonst null – nie 0
  for (let Z = 87; Z <= 118; Z++) assert.strictEqual(BY_Z[Z].en !== null, Z >= 88 && Z <= 94, BY_Z[Z].symbol);
  for (const e of ELEMENTS) assert.ok(e.en === null || e.en > 0, e.symbol);
  assert.strictEqual(TRENDS.ie.value(103), 4.96);
  assert.strictEqual(TRENDS.radius.value(87), 260);
});

test("Konfigurationen nur bis Radon; Aufgabentexte erkennen die 7. Periode nicht", () => {
  assert.strictEqual(CONFIG_MAX_Z, 86);
  assert.ok(AUFBAU_EXCEPTIONS.every(Z => Z <= CONFIG_MAX_Z));
  assert.deepEqual(elementsIn("Uran und Francium"), []);
  assert.deepEqual(searchElements("Uran", 86), []);
  assert.deepEqual(searchElements("Uran").map(e => e.Z), [92]);
  assert.strictEqual(BY_SYMBOL.Og.Z, 118);
});
