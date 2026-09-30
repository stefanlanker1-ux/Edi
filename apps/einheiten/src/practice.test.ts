import { test, assert } from "vitest";
import { parseQ, fmt, placeValue, pvPlace, prefixStep } from "@lern/units";
import { TOPICS, HELPS, makeRound, check, tipFor, resultOf, suitable } from "./practice.ts";

test("jedes Thema erzeugt lösbare Aufgaben mit kurzem Ergebnis", () => {
  for (const topic of TOPICS) {
    for (let r = 0; r < 40; r++) {
      const round = makeRound(topic);
      assert.strictEqual(round.length, 8);
      assert.strictEqual(new Set(round.map(t => `${t.value}|${t.from}|${t.to}`)).size, 8, `${topic.id}: doppelt`);
      for (const t of round) {
        assert.ok(suitable(t, topic), `${topic.id}: ${t.value} ${t.from} → ${t.to}`);
        const res = resultOf(t);
        assert.strictEqual(check(t, fmt(res).text), true);
        assert.strictEqual(check(t, fmt(res, { group: false }).text), true);
        if (topic.os) assert.ok(prefixStep(t.from, t.to), `${t.from} ${t.to} ohne Skala`);
        else {
          assert.ok(placeValue(parseQ(t.value)!, t.from, t.to, topic.table!).fits);
          assert.ok(pvPlace(res, t.to, topic.table!).fits);
          assert.ok(!/µ|n/.test(t.from + t.to), "Oberstufen-Einheit in der Unterstufe");
        }
      }
    }
  }
  assert.deepEqual(HELPS.us.map(h => h.id), ["table", "arrows", "none"]);
});

test("Tipps nach falscher Antwort", () => {
  const t = { value: "3,45", from: "m", to: "mm" };
  assert.strictEqual(check(t, "3450"), true);
  assert.match(tipFor(t, "345"), /Komma/);
  assert.match(tipFor(t, "0,00345"), /Falsche Richtung/);
  assert.match(tipFor(t, "3,45"), /ändert sich/);
  assert.match(tipFor(t, "17"), /mal/);
  assert.strictEqual(check(t, "abc"), null);
});
