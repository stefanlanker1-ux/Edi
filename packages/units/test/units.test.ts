import { test, assert } from "vitest";
import { getLang, setLang } from "@lern/i18n";
import { parseQ, parseAnswer, fmt, fmtSci, q, eq, mul, div, pow10, type Q } from "../src/rational.ts";
import { QUANTITIES, unitSi, unitDim, unitName, chainFor } from "../src/units.ts";
import { relation, solve, sameValue, type Row } from "../src/convert.ts";
import { pvColumns, placeValue, pvPlace } from "../src/placevalue.ts";
import { prefixStep, splitPrefix, supExp } from "../src/prefix.ts";

const Qs = (s: string) => parseQ(s)!;
const txt = (r: Row) => {
  const t = (x: { v?: Q; sym: string; pow?: number }) => (x.v ? `${fmt(x.v).text} ${x.sym}` : x.sym) + ((x.pow ?? 1) > 1 ? `^${x.pow}` : "");
  if (r.unit) return `${fmt(r.coef).text} ${r.unit}`;
  const num = (r.num ?? []).map(t).join(" · "), den = (r.den ?? []).map(t).join(" · ");
  return (eq(r.coef, q(1)) ? "" : fmt(r.coef).text + " · ") + num + (den ? " / " + den : "");
};
const chain = (from: string, to: string) => relation(from, to).rows.map(txt).join(" = ");

test("Zahlen lesen und deutsch schreiben", () => {
  assert.ok(eq(Qs("0,1"), q(1, 10)));
  assert.ok(eq(Qs("10 000"), q(10000)));
  assert.ok(eq(Qs("1,4·10^-4"), q(14, 100000)));
  assert.ok(eq(Qs("1,4 · 10⁻⁴"), q(14, 100000)));
  assert.ok(eq(Qs("2e3"), q(2000)));
  assert.strictEqual(Qs("abc"), null);
  assert.strictEqual(fmt(q(100000)).text, "100 000");
  assert.strictEqual(fmt(q(3450)).text, "3450");
  assert.strictEqual(fmt(q(1, 100000)).text, "0,000 01");
  assert.strictEqual(fmt(q(1, 3)).text, "0,3333"); assert.ok(fmt(q(1, 3)).approx);
  assert.strictEqual(fmtSci(q(14, 100000)), "1,4 · 10⁻⁴");
});

test("Beispiele aus dem Unterricht", () => {
  const s = solve("0,1", "m", "cm");
  assert.ok(eq(s.result, q(10))); assert.strictEqual(s.shift, 2);
  const t = solve("14", "cm", "km");
  assert.ok(eq(t.result, Qs("0,00014"))); assert.strictEqual(t.shift, -5); assert.ok(eq(t.divisor!, q(100000)));
  assert.ok(eq(solve("3,45", "m", "mm").result, q(3450)));
  assert.ok(eq(solve("72", "km/h", "m/s").result, q(20)));
  assert.ok(eq(solve("1", "l", "cm³").result, q(1000)));
  assert.ok(eq(solve("2,7", "g/cm³", "kg/m³").result, q(2700)));
  assert.ok(eq(solve("1", "kWh", "J").result, q(3600000)));
  assert.ok(eq(solve("1", "bar", "N/cm²").result, q(10)));
  assert.ok(eq(solve("1", "km²", "ha").result, q(100)));
  assert.ok(eq(solve("2", "h", "min").result, q(120)));
  assert.ok(eq(solve("2500", "mAh", "C").result, q(9000)));
});

test("genaue Werte: 1 PS = 735,498 75 W; endet die Umrechnungszahl nicht, wird durch den Kehrwert geteilt", () => {
  assert.strictEqual(chain("PS", "W"), "1 PS = 735,498\u202f75 W");
  const s = solve("0,072", "km/h", "cm/s");
  assert.ok(eq(s.divisor!, Qs("0,036")) && eq(s.result, q(2)));
  assert.strictEqual(solve("1", "m/s", "km/h").divisor, null); // 3,6 endet: mal 3,6
  assert.ok(eq(solve("72", "km/h", "m/s").divisor!, Qs("3,6")));
});

test("Rechenwege sehen aus wie an der Tafel", () => {
  assert.strictEqual(chain("km", "cm"), "1 km = 1000 m = 10 000 dm = 100 000 cm");
  assert.strictEqual(chain("cm", "km"), "1 cm = 0,1 dm = 0,01 m = 0,000 01 km");
  assert.strictEqual(chain("m²", "cm²"), "1 m² = 1 m · 1 m = 100 cm · 100 cm = 10 000 cm²");
  assert.strictEqual(chain("dm³", "cm³"), "1 dm³ = 1 dm · 1 dm · 1 dm = 10 cm · 10 cm · 10 cm = 1000 cm³");
  assert.strictEqual(chain("km/h", "m/s"), "1 km/h = 1 km / 1 h = 1000 m / 3600 s = 0,2778 m/s");
  assert.strictEqual(chain("kWh", "J"), "1 kWh = 1 kW·h = 1000 W · 3600 s = 3 600 000 W·s = 3 600 000 J");
  assert.strictEqual(chain("l", "cm³"), "1 l = 1 dm³ = 1 dm · 1 dm · 1 dm = 10 cm · 10 cm · 10 cm = 1000 cm³");
  assert.strictEqual(chain("h", "s"), "1 h = 60 min = 3600 s");
  assert.strictEqual(chain("t", "g"), "1 t = 1000 kg = 100 000 dag = 1 000 000 g");
});

test("jede Umrechnung innerhalb jeder Größe hat eine korrekte Herleitung", () => {
  let n = 0;
  for (const qt of QUANTITIES) for (const a of qt.units) for (const b of qt.units) {
    assert.deepEqual(unitDim(a.sym), unitDim(b.sym), `${qt.name}: ${a.sym}/${b.sym}`);
    const r = relation(a.sym, b.sym); // wirft, wenn die Herleitung nicht zum SI-Faktor passt
    assert.ok(eq(r.F, div(unitSi(a.sym), unitSi(b.sym))));
    assert.ok(r.rows.length >= 1 && r.rows[r.rows.length - 1].unit === b.sym);
    n++;
  }
  assert.ok(n > 300);
});

test("Namen", () => {
  assert.strictEqual(unitName("km/h"), "Kilometer pro Stunde");
  assert.strictEqual(unitName("cm²"), "Quadratzentimeter");
  assert.strictEqual(unitName("m³"), "Kubikmeter");
  assert.strictEqual(unitName("W·s"), "Wattsekunde");
});

test("Stellenwerttafel", () => {
  const len = pvColumns(["km", "m", "dm", "cm", "mm"]);
  assert.deepEqual(len.map(c => c.unit + c.place).join(" "), "kmH kmZ kmE mH mZ mE dmE cmE mmE");
  const area = pvColumns(["km²", "ha", "a", "m²", "dm²", "cm²", "mm²"]);
  assert.strictEqual(area.length, 14);
  const vol = pvColumns(["m³", "dm³", "cm³", "mm³"]);
  assert.deepEqual(vol.filter(c => c.sub).map(c => c.sub), ["hl", "l", "dl", "cl", "ml"]);
  const mass = pvColumns(["t", "kg", "dag", "g", "mg"]);
  assert.deepEqual(mass.map(c => c.unit + c.place).join(" "), "tH tZ tE kgH kgZ kgE dagZ dagE gE mgH mgZ mgE");
  // Beispiel: 3,45 m → 3450 mm
  const p = placeValue(Qs("3,45"), "m", "mm", ["km", "m", "dm", "cm", "mm"]);
  assert.ok(p.fits);
  assert.strictEqual(p.cells.map(c => c.digit ?? "·").join(""), "·····3450");
  assert.deepEqual(p.cells.map(c => c.kind[0]).join(""), "eeeeeggga");
  const k = placeValue(Qs("14"), "cm", "km", ["km", "m", "dm", "cm", "mm"]);
  assert.strictEqual(k.cells.map(c => c.digit ?? "·").join(""), "··00001 4·".replace(" ", ""));
  assert.ok(eq(k.result, Qs("0,00014")));
});

test("Quiz-Vergleich mit Rundung", () => {
  assert.ok(sameValue(Qs("0,28"), div(q(1000), q(3600)), 2));
  assert.ok(!sameValue(Qs("0,27"), div(q(1000), q(3600)), 2));
  assert.ok(sameValue(mul(q(1), q(1)), q(1)));
});

test("Vorsilben-Skala: Hochzahl vorher − Hochzahl nachher", () => {
  const e = (a: string, b: string) => prefixStep(a, b)?.exp ?? null;
  assert.strictEqual(e("km", "mm"), 6);
  assert.strictEqual(e("µm", "km"), -9);
  assert.strictEqual(e("km²", "m²"), 6);
  assert.strictEqual(e("cm³", "m³"), -6);
  assert.strictEqual(e("dag", "g"), 1);
  assert.strictEqual(e("GHz", "kHz"), 6);
  assert.strictEqual(e("mbar", "bar"), -3);
  assert.strictEqual(e("l", "cm³"), 3); // über 1 l = 1 dm³
  assert.deepEqual(prefixStep("l", "cm³")!.alias, ["1 l = 1 dm³"]);
  for (const [a, b] of [["h", "min"], ["t", "kg"], ["ha", "m²"], ["kcal", "J"], ["km/h", "m/s"], ["m", "m²"], ["hPa", "mbar"]]) assert.strictEqual(e(a, b), null, `${a} ${b}`);
  assert.strictEqual(splitPrefix("min"), null);
  assert.strictEqual(splitPrefix("mol")!.prefix.exp, 0);
  assert.strictEqual(splitPrefix("mmol")!.prefix.exp, -3);
  assert.strictEqual(supExp(-9), "⁻⁹");
  // jede Umrechnung, für die es eine Skala gibt, stimmt mit dem Katalog überein
  let n = 0;
  for (const qt of QUANTITIES) for (const a of qt.units) for (const b of qt.units) {
    const st = prefixStep(a.sym, b.sym);
    if (!st) continue;
    assert.ok(eq(pow10(st.exp), div(unitSi(a.sym), unitSi(b.sym))), `${a.sym} → ${b.sym}`);
    n++;
  }
  assert.ok(n > 150, `nur ${n}`);
});

test("Stellenwerttafel: Hohlmaße und einzelne Zahlen", () => {
  const vol = ["m³", "dm³", "cm³", "mm³"];
  const p = placeValue(Qs("1,5"), "l", "ml", vol);
  assert.ok(p.fits); assert.ok(eq(p.result, q(1500)));
  assert.strictEqual(pvColumns(vol)[p.fromE].sub, "l");
  const len = ["km", "m", "dm", "cm", "mm"];
  const d = (v: string, u: string) => pvPlace(Qs(v), u, len).digits.map(x => x ?? "·").join("");
  assert.strictEqual(d("3,45", "m"), "·····345·");
  assert.strictEqual(d("3450", "mm"), "·····3450");
  assert.strictEqual(d("3", "m"), "·····3···");
  assert.strictEqual(d("0,5", "m"), "·····05··");
  assert.strictEqual(d("137", "m"), "···137···");
  assert.strictEqual(pvPlace(Qs("0,001"), "mm", len).fits, false);
});

test("Pfeilkette: passende Einheitentreppe", () => {
  assert.deepEqual(chainFor("m", "cm")!.units.slice(0, 5), ["km", "m", "dm", "cm", "mm"]);
  const a = chainFor("l", "cm³")!;
  assert.strictEqual(a.id, "vol"); assert.strictEqual(a.from, "dm³"); assert.deepEqual(a.notes, ["1 l = 1 dm³"]);
  const b = chainFor("hl", "dm³")!;
  assert.strictEqual(b.id, "liter"); assert.strictEqual(b.to, "l");
  assert.strictEqual(chainFor("hl", "m³"), null);
  assert.strictEqual(chainFor("km/h", "m/s"), null);
});

test("Schülereingaben: Tausenderpunkte, Einheit dahinter, mehrdeutiger Punkt", () => {
  assert.ok(eq(parseQ("40.000.000")!, Qs("40000000")));
  assert.ok(eq(parseQ("1.250,5")!, Qs("1250,5")));
  assert.ok(eq(parseQ("0.5")!, Qs("0,5")));
  assert.ok(eq(parseAnswer("0,0605 m", "m")[0], Qs("0,0605")));
  assert.ok(eq(parseAnswer("0,0605m", "m")[0], Qs("0,0605")));
  assert.ok(eq(parseAnswer("3 m²", "m²")[0], Qs("3")));
  assert.strictEqual(parseAnswer("abc", "m").length, 0);
});

test("Schülereingaben: Trennzeichen nach der Sprache, mehrdeutige Eingaben nur eine Lesart", () => {
  const read = (s: string, unit?: string) => { const v = parseAnswer(s, unit); assert.ok(v.length <= 1, `${s}: mehrere Lesarten`); return v[0] ?? null; };
  const is = (s: string, want: string, unit?: string) => { const v = read(s, unit); assert.ok(v && eq(v, Qs(want)), `${getLang()}: ${s} → ${v && fmt(v).text}, erwartet ${want}`); };
  // Deutsch: „,“ Dezimalkomma, „.“ Tausenderpunkt – d.ddd nur als Tausender
  setLang("de", false);
  is("1.000", "1000"); is("48.000", "48000"); is("100.000", "100000"); is("1.250,5", "1250,5"); is("40.000.000", "40000000");
  is("1,000", "1"); is("0,1", "0,1"); is("1 000", "1000"); is("1.000 m", "1000", "m"); is("1.000·10^3", "1000000");
  is("0.5", "0,5"); is("0.00014", "0,00014"); is("1.5", "1,5"); is("0.001", "0,001"); // eindeutig: so kein Tausenderpunkt
  is("2,5·10^-4", "0,00025"); is("2,5 · 10⁻⁴", "0,00025"); is("1,4e-4", "0,00014");
  // Englisch: „.“ Dezimalpunkt, „,“ Tausenderkomma
  setLang("en", false);
  try {
    is("1,000", "1000"); is("48,000", "48000"); is("1,250.5", "1250,5"); is("1,000,000", "1000000");
    is("1.000", "1"); is("1.125", "1,125"); is("0,5", "0,5"); is("2.5·10^-4", "0,00025");
  } finally { setLang("de", false); }
});
