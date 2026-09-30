import { test, assert } from "vitest";
import { fmt, parseQ } from "@lern/units";
import { makeRound, LEVELS, TYPE_NAMES, solutionOf, checkInput, type Task } from "./tasks.ts";

test("alle Niveaus erzeugen gültige, lösbare Aufgaben", () => {
  const seen = new Set<string>();
  for (const level of [0, 1, 2, 3, 4, "mix" as const]) {
    for (let r = 0; r < 120; r++) {
      const tasks: Task[] = makeRound("us", level);
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
  assert.strictEqual(LEVELS.length, 5);
  for (const l of LEVELS) for (const id of l.types) { assert.ok(seen.has(id), `Typ ${id} nie erzeugt`); assert.ok(TYPE_NAMES[id], id); }
});

test("Niveau 1 nur Zehnerpotenzen, Niveau 3 nur Flächen, Niveau 4 nur Volumen", () => {
  for (let r = 0; r < 100; r++) {
    for (const t of makeRound("us", 0)) if (t.kind === "input") assert.match(t.value, /^(1|10|100|1000|0,0*1)$/, t.prompt);
    for (const t of makeRound("us", 2)) assert.ok(/²|\ba\b|ha|Fläche|Fußballfeld|Bauernhof/.test(t.prompt), t.prompt);
    for (const t of makeRound("us", 3)) assert.ok(/³|\bl\b|ml|cl|dl|hl|Glas|Badewanne|Volumen|fasst/.test(t.prompt), t.prompt);
  }
});

test("Niveau 5 stufenweise: Zeit zuerst, Einheiten mit eigenem Namen zuletzt", () => {
  const order = ["c_time", "c_num", "c_den", "c_both", "c_factor", "c_named"];
  const stage = (id: string) => ({ c_time: 0, c_num: 1, c_den: 2, c_both: 3, c_factor: 3, c_named: 4 } as Record<string, number>)[id];
  const kinds = new Set<string>();
  for (let r = 0; r < 60; r++) {
    const ts = makeRound("us", 4);
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
