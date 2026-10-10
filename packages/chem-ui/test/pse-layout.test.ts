// Periodensystem: Lage der Zellen und Platzhalter; 7. Periode und Actinoide nur mit `period7` (großes PSE im Atombau), sonst unverändert
import { test, assert } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BY_Z, TRENDS, trendScale } from "@lern/chem";
import { cellPosition, placeholders, pseElements, psePeriods } from "../src/pseLayout.ts";
import { PeriodicTable } from "../src/PeriodicTable.tsx";

const US = { us: true }, OS = { us: false }, P7 = { us: false, period7: true };

test("welche Elemente: Unterstufe bis Calcium, Oberstufe bis Radon, mit 7. Periode bis Oganesson", () => {
  assert.deepEqual(pseElements(US), Array.from({ length: 20 }, (_, i) => i + 1));
  assert.deepEqual(pseElements(OS), Array.from({ length: 86 }, (_, i) => i + 1));
  assert.deepEqual(pseElements(P7), Array.from({ length: 118 }, (_, i) => i + 1));
  // period7 gilt nur in der Oberstufe
  assert.deepEqual(pseElements({ us: true, period7: true }), pseElements(US));
  assert.deepEqual([US, OS, P7].map(psePeriods), [4, 6, 7]);
});

test("Positionen: Hauptgruppen, Gruppen 1–18, f-Block-Zeilen unter der Tabelle", () => {
  // Unterstufe: Spalte = Hauptgruppe + 1
  assert.deepEqual(cellPosition(20, US), { col: 3, row: 5 });
  assert.deepEqual(cellPosition(13, US), { col: 4, row: 4 });
  // Oberstufe ohne 7. Periode: wie bisher (La–Lu in Zeile 9)
  assert.deepEqual(cellPosition(86, OS), { col: 19, row: 7 });
  assert.deepEqual(cellPosition(57, OS), { col: 4, row: 9 });
  assert.deepEqual(cellPosition(71, OS), { col: 18, row: 9 });
  // mit 7. Periode: Fr–Og in Zeile 8, Lanthanoide Zeile 10, Actinoide Zeile 11 (La bzw. Ac unter Gruppe 3)
  assert.deepEqual(cellPosition(87, P7), { col: 2, row: 8 });
  assert.deepEqual(cellPosition(104, P7), { col: 5, row: 8 });
  assert.deepEqual(cellPosition(118, P7), { col: 19, row: 8 });
  assert.deepEqual(cellPosition(57, P7), { col: 4, row: 10 });
  assert.deepEqual(cellPosition(89, P7), { col: 4, row: 11 });
  assert.deepEqual(cellPosition(103, P7), { col: 18, row: 11 });
  // keine zwei Elemente auf demselben Platz, kein Element auf einem Platzhalter
  for (const o of [US, OS, P7]) {
    const used = new Set(placeholders(o).map(p => `${p.col}/${p.row}`));
    for (const Z of pseElements(o)) {
      const { col, row } = cellPosition(Z, o), k = `${col}/${row}`;
      assert.ok(!used.has(k), `${BY_Z[Z].symbol} ${k}`);
      used.add(k);
      assert.ok(col >= 2 && col <= (o.us ? 9 : 19), `${BY_Z[Z].symbol} Spalte ${col}`);
    }
  }
});

test("Platzhalter: 57–71 in Periode 6 und 89–103 in Periode 7, Gruppe 3", () => {
  assert.deepEqual(placeholders(US), []);
  assert.deepEqual(placeholders(OS).map(p => [p.range, p.col, p.row, p.labelRow]), [["57–71", 4, 7, 9]]);
  assert.deepEqual(placeholders(P7).map(p => [p.range, p.col, p.row, p.labelRow]), [["57–71", 4, 7, 10], ["89–103", 4, 8, 11]]);
  // die Zeile einer Reihe beginnt unter ihrem Platzhalter (Spalte 4) und enthält genau ihre 15 Elemente
  for (const p of placeholders(P7)) {
    const row = pseElements(P7).filter(Z => cellPosition(Z, P7).row === p.labelRow);
    assert.deepEqual(row, Array.from({ length: 15 }, (_, i) => p.first + i));
  }
});

test("Darstellung: Standard unverändert (bis Radon, ein Platzhalter), mit period7 Actinoide und keine NaN in Trends", () => {
  const html = (props: Record<string, unknown>) => renderToStaticMarkup(createElement(PeriodicTable, { stufe: "os", ...props } as Parameters<typeof PeriodicTable>[0]));
  const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;
  const os = html({ fit: true });
  assert.strictEqual(count(os, /<button/g), 86);
  assert.ok(os.includes("57–71") && !os.includes("89–103") && !os.includes(">Fr<") && !os.includes("pse-p7"));
  const p7 = html({ fit: true, period7: true });
  assert.strictEqual(count(p7, /<button/g), 118);
  assert.ok(p7.includes("89–103") && p7.includes(">Og<") && p7.includes("cat-actinoid") && p7.includes("cat-unknown"));
  // Unterstufe ignoriert period7
  assert.strictEqual(count(renderToStaticMarkup(createElement(PeriodicTable, { stufe: "us", period7: true })), /<button/g), 20);
  for (const key of Object.keys(TRENDS) as (keyof typeof TRENDS)[]) {
    const t = html({ fit: true, period7: true, trend: { key, scale: trendScale(key, pseElements(P7)) } });
    assert.ok(!/NaN|null|undefined/.test(t), key);
    // ohne Messwert: gestrichelt („no-data“) mit „–“, nie als Wert 0
    assert.ok(t.includes("no-data"), key);
  }
  // Platzhalter abgeblendet, wenn die ganze Reihe abgeblendet ist (nur im großen PSE)
  const dimAct = html({ period7: true, cellState: (Z: number) => (Z >= 89 && Z <= 103 ? "dim" : undefined) });
  assert.match(dimAct, /pse-ph cat-actinoid dim/);
  assert.notMatch(dimAct, /pse-ph cat-lanthanoid dim/);
  assert.notMatch(html({ cellState: () => "dim" }), /pse-ph[^"]* dim/);
});
