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
  // Elektronegativität (Allred-Rochow) für die 7. Periode nicht abgeglichen → null, nie 0
  for (let Z = 87; Z <= 118; Z++) assert.strictEqual(BY_Z[Z].en, null, BY_Z[Z].symbol);
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

test("Elektronegativität nach Allred-Rochow: Kontrollwerte, Edelgase ohne EN, Trend in Periode und Gruppe", () => {
  const ref: Record<string, number> = {
    H: 2.20, Li: 0.97, B: 2.01, C: 2.50, N: 3.07, O: 3.50, F: 4.10, Na: 1.01, Mg: 1.23, Al: 1.47, Si: 1.74, P: 2.06, S: 2.44, Cl: 2.83,
    K: 0.91, Ca: 1.04, Br: 2.74, I: 2.21,
  };
  for (const [el, v] of Object.entries(ref)) assert.strictEqual(BY_SYMBOL[el].en, v, el);
  for (const el of ["He", "Ne", "Ar", "Kr", "Xe", "Rn"]) assert.strictEqual(BY_SYMBOL[el].en, null, el);
  // Hauptgruppen bis Z = 86 vollständig; EN steigt in der Periode (2. und 3.), sinkt in der Gruppe (Halogene)
  for (const e of ELEMENTS) if (e.Z <= 86 && e.category !== "noble" && e.category !== "lanthanoid") assert.ok(e.en !== null, e.symbol);
  const en = (s: string) => BY_SYMBOL[s].en!;
  for (const row of [["Li", "Be", "B", "C", "N", "O", "F"], ["Na", "Mg", "Al", "Si", "P", "S", "Cl"]])
    for (let i = 1; i < row.length; i++) assert.ok(en(row[i]) >= en(row[i - 1]), row[i]);
  // (nicht jede Gruppe streng: Li 0,97 < Na 1,01, S 2,44 < Se 2,48 – Werte wie veröffentlicht)
  for (const col of [["F", "Cl", "Br", "I"], ["Na", "K", "Rb", "Cs"]])
    for (let i = 1; i < col.length; i++) assert.ok(en(col[i]) < en(col[i - 1]), col[i]);
});

test("Elektronegativität überall nach Allred-Rochow: kein „Pauling“ und keine Grenze 0,4 in Quelltexten der App", async () => {
  const { readdirSync, readFileSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const root = join(__dirname, "../../..");
  const files: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (f === "node_modules" || f === "dist" || f.startsWith(".")) continue;
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f)) files.push(p);
    }
  };
  for (const d of ["modules", "packages", "apps/edi/src"]) walk(join(root, d));
  assert.ok(files.length > 50);
  assert.deepEqual(files.filter(f => /Pauling|ΔEN ≥ 0[,.]4/.test(readFileSync(f, "utf8"))), []);
});
