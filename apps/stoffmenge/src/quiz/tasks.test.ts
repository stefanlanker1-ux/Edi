import { test, assert } from "vitest";
import { makeRound, LEVELS, GENERATORS, TYPE_NAMES, type Task } from "./tasks.ts";

test("alle Level erzeugen gültige, speicherbare Aufgaben", () => {
  for (const level of [0, 1, 2, "mix" as const]) {
    for (let r = 0; r < 150; r++) {
      const tasks: Task[] = makeRound("us", level);
      assert.strictEqual(tasks.length, 10);
      for (const t of tasks) {
        assert.ok(t.prompt && t.hint && t.explain, `Texte fehlen: ${t.prompt}`);
        assert.deepEqual(JSON.parse(JSON.stringify(t)), t, "nicht JSON-fähig");
        assert.ok(TYPE_NAMES[t.type!], `Typ ohne Namen: ${t.type}`);
        assert.ok(!/undefined|\bNaN\b|\bnull\b|Infinity/.test(t.prompt + t.hint + t.explain), t.prompt + t.explain);
        if (t.kind === "mc") {
          assert.ok(t.options.length >= 3, `zu wenige Optionen: ${t.prompt} ${t.options}`);
          assert.strictEqual(new Set(t.options).size, t.options.length, `doppelt: ${t.options}`);
          assert.ok(t.answer >= 0 && t.answer < t.options.length);
          for (const [i, why] of Object.entries(t.why ?? {})) {
            assert.ok(Number(i) !== t.answer && Number(i) < t.options.length, `why am falschen Index: ${t.prompt}`);
            assert.ok(why.length > 10, `Fehlvorstellung fehlt: ${t.prompt}`);
          }
        } else if (t.kind === "num") {
          assert.ok(Number.isFinite(t.answer) && t.answer > 0 && t.unit, t.prompt);
        } else {
          assert.strictEqual(t.fields.length, 2);
          for (const f of t.fields) assert.ok(Number.isFinite(f.answer) && f.answer > 0, t.prompt);
        }
      }
    }
  }
  assert.strictEqual(LEVELS.length, 3);
});

test("jede Fertigkeit hat ≥ 12 verschiedene Aufgaben und diagnostische Distraktoren", () => {
  for (const [id, gen] of Object.entries(GENERATORS)) {
    const seen = new Set<string>();
    let withWhy = 0;
    for (let i = 0; i < 400; i++) {
      const t = gen();
      seen.add(t.prompt);
      if (t.kind === "mc" && t.why && Object.keys(t.why).length) withWhy++;
    }
    assert.ok(seen.size >= 12, `${id}: nur ${seen.size} verschiedene Aufgaben`);
    assert.ok(withWhy > 0, `${id}: keine diagnostischen Distraktoren`);
  }
});

test("mindestens drei Antwortformen im Quiz", () => {
  const kinds = new Set<string>();
  for (let i = 0; i < 40; i++) for (const t of makeRound("us", "mix")) kinds.add(t.kind);
  assert.ok(kinds.has("mc") && kinds.has("num") && kinds.has("steps"), [...kinds].join(","));
});
