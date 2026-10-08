import { test, assert } from "vitest";
import { setLang } from "@lern/i18n";
import { fmt, parseQ, eq, mul, div, toNumber, pow10, q } from "@lern/units";
import { makeRound, LEVELS, TYPE_NAMES, solutionOf, checkInput, readInput, storedText, storedValue, type Task } from "./tasks.ts";
import { rare } from "../help.ts";
import { dimOf } from "../components/DimChain.tsx";

type Input = Extract<Task, { kind: "input" }>;
const inp = (value: string, from: string, to: string) => ({ kind: "input", value, from, to, prompt: "", hint: "", explain: "" }) as Input;
/** viele Runden aller Niveaus beider Stufen */
const many = (rounds: number) => (["us", "os"] as const).flatMap(st => Array.from({ length: rounds }, () => [0, 1, 2, 3, 4].flatMap(l => makeRound(st, l))).flat());

test("alle Niveaus erzeugen gültige, lösbare Aufgaben", () => {
  const seen = new Set<string>();
  for (const stufe of ["us", "os"] as const) for (const level of [0, 1, 2, 3, 4, "mix" as const]) {
    for (let r = 0; r < 80; r++) {
      const tasks: Task[] = makeRound(stufe, level);
      assert.strictEqual(tasks.length, 10);
      for (const t of tasks) {
        seen.add(t.type!);
        assert.ok(t.prompt && t.hint && t.explain, "Texte fehlen");
        assert.deepEqual(JSON.parse(JSON.stringify(t)), t, "nicht JSON-fähig");
        assert.ok(!/NaN|undefined|null|Infinity/.test(t.prompt + t.explain + (t.kind === "mc" ? t.options.join() : "")), t.prompt + t.explain);
        if (t.kind === "mc") {
          assert.ok(t.options.length >= 3, `zu wenige Optionen: ${t.prompt} ${t.options}`);
          assert.strictEqual(new Set(t.options).size, t.options.length, `doppelt: ${t.options}`);
          assert.ok(t.answer >= 0 && t.answer < t.options.length);
        } else {
          assert.ok(parseQ(t.value), `Wert ${t.value}`);
          const s = solutionOf(t);
          const shown = t.round !== undefined ? fmt(s.result, { digits: t.round }).text : fmt(s.result).text;
          assert.strictEqual(checkInput(t, shown), true, `${t.prompt} → ${shown}`);
          assert.strictEqual(checkInput(t, "999999"), false);
        }
      }
    }
  }
  for (const st of ["us", "os"] as const) {
    assert.strictEqual(LEVELS[st].length, 5);
    for (const l of LEVELS[st]) for (const id of l.types) { assert.ok(seen.has(id), `Typ ${id} nie erzeugt`); assert.ok(TYPE_NAMES[id], id); }
  }
});

test("Unterstufe: keine seltenen Vorsilben, keine zusammengesetzten Einheiten; Niveau 5 = Zeit", () => {
  for (let r = 0; r < 100; r++) for (const level of [0, 1, 2, 3, 4, "mix" as const]) for (const t of makeRound("us", level)) {
    const c = t.kind === "input" ? t : t.conv;
    if (c) assert.ok(!rare(c.from, c.to) && !/[/·]/.test(c.from + c.to), `${t.prompt}`);
    assert.ok(c || t.type?.endsWith("_est"), `ohne Umrechnung: ${t.prompt}`);
  }
  for (let r = 0; r < 40; r++) for (const t of makeRound("us", 4)) assert.ok(/\b(h|min|s|d)\b/.test(t.prompt), t.prompt);
});

test("Vergleichen: richtige Antwort verteilt, jede falsche Antwort mit Rückmeldung", () => {
  const count: Record<string, number> = { gleich: 0, a: 0, b: 0 };
  for (let r = 0; r < 300; r++) {
    const t = makeRound("us", 1).find(x => x.type === "k_compare");
    if (!t || t.kind !== "mc") continue;
    const right = t.options[t.answer];
    count[right.startsWith("gleich") ? "gleich" : t.prompt.indexOf(right) < t.prompt.indexOf(" oder ") ? "a" : "b"]++;
    t.options.forEach((_, i) => i !== t.answer && assert.ok(t.why?.[i], `ohne Rückmeldung: ${t.prompt} ${t.options[i]}`));
  }
  const n = count.gleich + count.a + count.b;
  assert.ok(n > 50 && count.gleich / n < 0.4 && count.a / n > 0.2 && count.b / n > 0.2, JSON.stringify(count));
});

test("Liter und dm³: Tipp sagt „gleich groß“", () => {
  for (let r = 0; r < 200; r++) for (const t of makeRound("us", 3)) if (t.kind === "input" && ["l>dm³", "dm³>l", "ml>cm³", "cm³>ml"].includes(`${t.from}>${t.to}`))
    assert.match(t.hint, /gleich groß/, t.prompt);
});

test("zusammengesetzte Werte sind alltagsnah (Dichte ≤ 23 g/cm³)", () => {
  for (let r = 0; r < 200; r++) for (const t of makeRound("os", 4)) {
    if (t.kind !== "input") continue;
    const s = solutionOf(t);
    if (/^(g\/cm³|mg\/cm³|kg\/dm³|g\/ml|kg\/m³|g\/l|kg\/l|mg\/ml|g\/dm³)$/.test(t.from)) {
      const gcm = t.to === "g/cm³" ? Number(fmt(s.result, { group: false }).text.replace(",", ".")) : null;
      if (gcm !== null) assert.ok(gcm <= 23, t.prompt);
    }
  }
});

test("Niveau 1 nur Zehnerpotenzen, Niveau 3 nur Flächen, Niveau 4 nur Volumen", () => {
  for (let r = 0; r < 100; r++) {
    for (const st of ["us", "os"]) for (const t of makeRound(st, 0)) if (t.kind === "input") assert.match(t.value, /^(1|10|100|1000|0,0*1)$/, t.prompt);
    for (const t of makeRound("us", 2)) assert.ok(/²|\ba\b|ha|Fläche|Fußballfeld|Bauernhof/.test(t.prompt), t.prompt);
    for (const t of makeRound("us", 3)) assert.ok(/³|\bl\b|ml|cl|dl|hl|Glas|Badewanne|Volumen|fasst/.test(t.prompt), t.prompt);
  }
});

test("Oberstufe Niveau 5 stufenweise: Zeit zuerst, Einheiten mit eigenem Namen zuletzt", () => {
  const order = ["c_time", "c_num", "c_den", "c_both", "c_factor", "c_named"];
  const stage = (id: string) => ({ c_time: 0, c_num: 1, c_den: 2, c_both: 3, c_factor: 3, c_named: 4 } as Record<string, number>)[id];
  const kinds = new Set<string>();
  for (let r = 0; r < 60; r++) {
    const ts = makeRound("os", 4);
    for (let i = 1; i < ts.length; i++) assert.ok(stage(ts[i - 1].type!) <= stage(ts[i].type!), ts.map(t => t.type).join());
    for (const t of ts) if (t.kind === "input") kinds.add(`${t.from}>${t.to}`);
  }
  assert.ok(order.every(Boolean));
  // viele verschiedene Aufgaben
  assert.ok(kinds.size > 60, `nur ${kinds.size} verschiedene Umrechnungen`);
});

test("Eingaben: Komma, Punkt, Leerzeichen, Zehnerpotenz", () => {
  const t = { kind: "input", value: "14", from: "cm", to: "km", prompt: "", hint: "", explain: "" } as Extract<Task, { kind: "input" }>;
  for (const s of ["0,00014", "0.00014", "0,000 14", "1,4·10^-4", "1,4 · 10⁻⁴", "1,4e-4"]) assert.strictEqual(checkInput(t, s), true, s);
  assert.strictEqual(checkInput(t, "0,0014"), false);
  assert.strictEqual(checkInput(t, "abc"), null);
});

test("Tausenderpunkt: „1.000“ ist im Deutschen 1000, nie 1 – und umgekehrt im Englischen", () => {
  const km = inp("1000", "m", "km"), g = inp("0,1", "kg", "g");
  assert.strictEqual(checkInput(km, "1.000"), false);
  assert.strictEqual(checkInput(km, "1"), true);
  assert.strictEqual(checkInput(km, "1,000"), true); // deutsches Dezimalkomma
  assert.strictEqual(checkInput(g, "100.000"), false);
  assert.strictEqual(checkInput(g, "100"), true);
  assert.strictEqual(checkInput(inp("48", "km", "m"), "48.000"), true);
  setLang("en", false);
  try {
    assert.strictEqual(checkInput(inp("1", "km", "m"), "1,000"), true);
    assert.strictEqual(checkInput(km, "1,000"), false);
    assert.strictEqual(checkInput(km, "1.000"), true); // englischer Dezimalpunkt
    assert.strictEqual(checkInput(inp("0.1", "kg", "g"), "100,000"), false);
  } finally { setLang("de", false); }
});

test("Antwort wird so gespeichert und gezeigt, wie sie gelesen wurde", () => {
  const cases: [Input, string, string][] = [
    [inp("6", "cm", "m"), "0,06 m", "0,06"], [inp("2,5", "dm²", "m²"), "2,5·10⁻⁴", "0,000\u202f25"], [inp("1,2505", "km", "m"), "1.250,5", "1250,5"],
    [inp("1000", "m", "km"), "1.000", "1000"], [inp("1", "km", "m"), "1000", "1000"], [inp("3", "m", "cm"), "-0,5", "−0,5"],
  ];
  for (const [t, input, shown] of cases) {
    const v = readInput(t, input)!;
    assert.ok(v, input);
    const saved = JSON.parse(JSON.stringify(storedValue(v)));
    assert.ok(Object.values(saved).every(x => typeof x === "number" && Number.isFinite(x)), input);
    assert.strictEqual(storedText(saved), shown, input);
    assert.ok(eq(parseQ(storedText(saved))!, v), input);
  }
  assert.strictEqual(storedText({ v: 0.25 }), "0,25"); // Speicherform früherer Versionen
});

test("Rechenweg in der Erklärung ist exakt (kein gerundeter Faktor ohne ≈)", () => {
  let n = 0, viaDiv = 0;
  for (const t of many(30)) {
    if (t.kind !== "input") continue;
    const how = t.explain.split(" → ").pop()!;
    const m = how.match(/^(.+?) (·|:) (≈ )?(.+?) = \*\*(≈ )?(.+?) (\S+)\*\*/);
    assert.ok(m, t.explain);
    const [, a, op, approxF, f, approxR, r] = m!;
    const exact = op === "·" ? mul(parseQ(a)!, parseQ(f)!) : div(parseQ(a)!, parseQ(f)!);
    if (op === ":") viaDiv++;
    assert.ok(eq(exact, solutionOf(t).result) || approxF, `Faktor gerundet ohne ≈: ${t.explain}`);
    if (!approxR) assert.ok(eq(exact, parseQ(r)!), `Rechenweg stimmt nicht: ${t.explain}`);
    else {
      assert.ok(Math.abs(toNumber(solutionOf(t).result) - toNumber(parseQ(r)!)) <= toNumber(pow10(-(t.round ?? 0))) / 2 + 1e-12, t.explain);
      if (toNumber(solutionOf(t).result) >= 0.1) assert.ok((r.split(",")[1] ?? "").replace(/\s/g, "").length <= t.round!, `nicht auf ${t.round} Stellen gerundet: ${t.explain}`);
    }
    n++;
  }
  assert.ok(n > 500 && viaDiv > 50, `${n} / ${viaDiv}`);
});

test("Umrechnungszahl: Rückmeldungen stimmen für ungleich große Stufen (kg → dag · 100, hl → l · 100)", () => {
  let seen = 0;
  for (const t of many(40)) {
    if (t.kind !== "mc" || !/_factor$/.test(t.type!) || t.type === "t_factor" || t.type === "c_factor") continue;
    seen++;
    const right = parseQ(t.options[t.answer])!;
    const dim = t.type === "f_factor" ? 100 : t.type === "v_factor" ? 1000 : 10;
    t.options.forEach((o, i) => {
      const why = t.why?.[i] ?? "";
      if (i === t.answer) return;
      if (t.type === "z_factor") assert.ok(!/Stufe zu/.test(why), `${t.prompt} ${o}: ${why}`);
      if (/zu viel/.test(why)) assert.ok(eq(parseQ(o)!, mul(right, q(dim))), `${t.prompt} ${o}: ${why}`);
      if (/zu wenig/.test(why)) assert.ok(eq(parseQ(o)!, div(right, q(dim))), `${t.prompt} ${o}: ${why}`);
    });
    // Erklärung zeigt den Weg über die Nachbareinheiten, nicht nur das Ergebnis noch einmal
    const m = t.explain.match(/([^:→]*) → \*\*(.+?)\*\*/);
    if (m) assert.notStrictEqual(m[1].trim(), m[2].trim(), t.explain);
  }
  assert.ok(seen > 100, `nur ${seen}`);
  // „Mal oder geteilt?“: Rückmeldung zeigt den Weg über die Nachbareinheiten statt „zähle die Stufen“
  for (const t of many(20)) if (t.kind === "mc" && t.type === "k_rule")
    for (const w of Object.values(t.why ?? {})) assert.ok(!/zähle die Stufen/i.test(w), w);
  const hl = makeRoundOf("z_factor").find(t => t.kind === "mc" && /1 hl = \? l/.test(t.prompt));
  if (hl && hl.kind === "mc") assert.ok(!hl.options.some((o, i) => o === "10" && /Stufe/.test(hl.why?.[i] ?? "")), hl.options.join());
});
const makeRoundOf = (type: string) => Array.from({ length: 400 }, () => makeRound("us", 0)).flat().filter(t => t.type === type);

test("Größenvorstellung: Tipp nennt nicht das Ding aus der Frage", () => {
  const STOP = new Set(["welche", "einheit", "passt", "etwa", "fläche", "volumen", "fasst", "eine", "einen", "ein", "von", "hat", "große", "voll", "volle"]);
  const words = (s: string) => new Set(s.toLowerCase().replace(/[*▢?.,]/g, " ").split(/\s+/).filter(w => w.length >= 4 && !STOP.has(w)));
  const items = new Set<string>();
  for (const t of many(40)) {
    if (!t.type?.endsWith("_est")) continue;
    items.add(t.prompt);
    const p = words(t.prompt), h = words(t.hint);
    assert.deepEqual([...p].filter(w => h.has(w)), [], `${t.prompt} | ${t.hint}`);
    if (/Zuckerwürfel/.test(t.prompt)) assert.ok(!/zucker/i.test(t.hint), t.hint);
    if (/Milchpackung/.test(t.prompt)) assert.ok(!/Liter|Milch/.test(t.hint), t.hint);
    assert.ok(!/Klassenzimmer/.test(t.hint), t.hint);
  }
  assert.strictEqual(items.size, 12);
});

test("Pfeile: Liter und Milliliter auf der Hohlmaß-Kette, Volumen nur mit einem echten Längen³-Maß", () => {
  assert.strictEqual(dimOf("l", "ml"), null);
  assert.strictEqual(dimOf("ml", "l"), null);
  assert.strictEqual(dimOf("hl", "dm³"), null);
  assert.strictEqual(dimOf("l", "cm³"), 3);
  assert.strictEqual(dimOf("m³", "dm³"), 3);
  assert.strictEqual(dimOf("m²", "cm²"), 2);
});
