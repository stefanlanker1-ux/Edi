import { test, assert } from "vitest";
import { fmt, parseQ } from "@lern/units";
import { makeRound, LEVELS, solutionOf, checkInput, type Task } from "./tasks.ts";

test("alle Level erzeugen gültige, lösbare Aufgaben", () => {
  const seen = new Set<string>();
  for (const stufe of ["us", "os"] as const) {
    for (const level of [0, 1, 2, "mix" as const]) {
      for (let r = 0; r < 120; r++) {
        const tasks: Task[] = makeRound(stufe, level);
        assert.strictEqual(tasks.length, 10);
        for (const t of tasks) {
          seen.add(t.type!);
          assert.ok(t.prompt && t.hint && t.explain, "Texte fehlen");
          assert.deepEqual(JSON.parse(JSON.stringify(t)), t, "nicht JSON-fähig");
          assert.ok(!/NaN|undefined|null/.test(t.prompt + t.explain), t.prompt + t.explain);
          if (t.kind === "mc") {
            assert.ok(t.options.length >= 3, `zu wenige Optionen: ${t.prompt} ${t.options}`);
            assert.strictEqual(new Set(t.options).size, t.options.length, `doppelt: ${t.options}`);
            assert.ok(t.answer >= 0 && t.answer < t.options.length);
          } else {
            assert.ok(parseQ(t.value), `Wert ${t.value}`);
            const s = solutionOf(t);
            // die eigene Lösung (wie angezeigt) wird als richtig erkannt
            const shown = t.round !== undefined ? fmt(s.result, { digits: t.round }).text : fmt(s.result).text;
            assert.strictEqual(checkInput(t, shown), true, `${t.prompt} → ${shown}`);
            assert.strictEqual(checkInput(t, "999999"), false);
            if (stufe === "us") assert.ok(!/µ|nm|km\/h|10⁻/.test(t.prompt), t.prompt);
          }
        }
      }
    }
    assert.strictEqual(LEVELS[stufe].length, 3);
  }
  for (const l of [...LEVELS.us, ...LEVELS.os]) for (const id of l.types) assert.ok(seen.has(id), `Typ ${id} nie erzeugt`);
});

test("Eingaben: Komma, Punkt, Leerzeichen, Zehnerpotenz", () => {
  const t = { kind: "input", value: "14", from: "cm", to: "km", prompt: "", hint: "", explain: "" } as Extract<Task, { kind: "input" }>;
  for (const s of ["0,00014", "0.00014", "0,000 14", "1,4·10^-4", "1,4 · 10⁻⁴", "1,4e-4"]) assert.strictEqual(checkInput(t, s), true, s);
  assert.strictEqual(checkInput(t, "0,0014"), false);
  assert.strictEqual(checkInput(t, "abc"), null);
});
