import { test, assert } from "vitest";
import { mc, dis } from "../src/types.ts";

test("mc: Distraktoren mit Fehlvorstellung landen unter ihrem Options-Index in why", () => {
  for (let r = 0; r < 200; r++) {
    const t = mc("8", [dis("6", "nur eigene"), dis("2", "Duett"), "4"]);
    assert.strictEqual(t.options.length, 4);
    assert.strictEqual(t.options[t.answer], "8");
    assert.ok(t.why && !(t.answer in t.why), "die richtige Antwort hat keine Fehlvorstellung");
    for (const [i, why] of Object.entries(t.why!)) {
      const o = t.options[Number(i)];
      assert.strictEqual(why, o === "6" ? "nur eigene" : "Duett", `${o} → ${why}`);
    }
    assert.strictEqual(Object.keys(t.why!).length, 2);
  }
});

test("mc: ohne Fehlvorstellungen kein why, Duplikate und die richtige Antwort werden entfernt", () => {
  const t = mc("a", ["b", "a", "b", null, undefined, dis("a", "x"), "c"]);
  assert.strictEqual(t.why, undefined);
  assert.deepEqual([...t.options].sort(), ["a", "b", "c"]);
});

test("mc: diagnostische Distraktoren werden vor bloßen Zahlen gewählt", () => {
  for (let r = 0; r < 100; r++) {
    const t = mc("1", [dis("2", "w2"), dis("3", "w3"), dis("4", "w4"), "5", "6", "7"]);
    assert.deepEqual([...t.options].sort(), ["1", "2", "3", "4"]);
    assert.strictEqual(Object.keys(t.why!).length, 3);
  }
});
