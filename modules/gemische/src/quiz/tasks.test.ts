import { test, assert } from "vitest";
import { makeRound, LEVELS, TYPE_NAMES, type Task } from "./tasks.ts";
import { MISS } from "./misconceptions.ts";
import { analyse } from "../mixtures.ts";

const all = (level: number | "mix", rounds: number) => Array.from({ length: rounds }, () => makeRound("us", level)).flat();

test("alle Level erzeugen gültige, speicherbare Aufgaben", () => {
  for (const level of [0, 1, 2, "mix" as const]) {
    for (const t of all(level, 120)) {
      assert.ok(t.prompt && t.hint && t.explain, "Texte fehlen");
      assert.ok(TYPE_NAMES[t.type!], t.type);
      assert.deepEqual(JSON.parse(JSON.stringify(t)), t, "nicht JSON-fähig");
      assert.ok(!/undefined|\bNaN\b|\bnull\b|\[object/.test(t.prompt + t.explain + t.hint), t.prompt + t.explain);
      if (t.mix) {
        const a = analyse(t.mix);
        assert.ok(a.teilchen >= 3 && a.teilchen <= 15, `${a.teilchen} Teilchen`);
      }
      if (t.kind === "mc") {
        assert.ok(t.options.length >= 3, `zu wenige Optionen: ${t.prompt} ${t.options}`);
        assert.strictEqual(new Set(t.options).size, t.options.length, `doppelt: ${t.options}`);
        assert.ok(t.answer >= 0 && t.answer < t.options.length);
      } else {
        assert.ok(Number.isInteger(t.answer) && t.answer >= 0, t.prompt);
      }
    }
  }
  assert.strictEqual(LEVELS.length, 3);
});

test("Zählaufgaben stimmen mit der Auswertung überein", () => {
  for (const t of all("mix", 200) as Task[]) {
    if (t.kind !== "num" || !t.mix) continue;
    const a = analyse(t.mix);
    const want: Record<string, number> = { teilchen: a.teilchen, stoffe: a.stoffe.length, atomsorten: a.atomsorten.length, verbindungen: a.verbindungen.length, elemente: a.elemente.length };
    assert.strictEqual(t.answer, want[t.type!], `${t.type}: ${JSON.stringify(t.mix)}`);
  }
});

test("diagnostische Distraktoren: Schlüssel im Katalog, Rückmeldung zu jedem Stolperstein, Fallen nie die Lösung", () => {
  let withDiag = 0, total = 0;
  const seen = new Set<string>();
  for (const t of all("mix", 300)) {
    total++;
    if (t.kind === "mc" && t.miss) {
      withDiag++;
      for (const [i, m] of Object.entries(t.miss)) {
        const idx = Number(i);
        assert.ok(idx !== t.answer, `Stolperstein bei der richtigen Antwort: ${t.prompt}`);
        assert.ok(MISS[m], `unbekannter Stolperstein ${m}`);
        assert.ok((t.why?.[idx] ?? "").length > 10, `Rückmeldung fehlt: ${m}`);
        seen.add(m);
      }
    }
    if (t.kind === "num") {
      if (t.traps?.length) withDiag++;
      for (const tr of t.traps ?? []) {
        assert.ok(MISS[tr.miss], tr.miss);
        assert.notStrictEqual(tr.value, t.answer, `Falle = Lösung: ${t.prompt}`);
        assert.ok(tr.why.length > 10 && !/^\s*:/.test(tr.why), tr.why);
        seen.add(tr.miss);
      }
    }
  }
  assert.ok(withDiag / total > .7, `nur ${withDiag} von ${total} mit Diagnose`);
  // jeder Stolperstein des Katalogs kommt vor
  for (const k of Object.keys(MISS)) assert.ok(seen.has(k), `Stolperstein nie verwendet: ${k}`);
});

test("Ozon und Sauerstoff sind Elemente, Wasser eine Verbindung", () => {
  for (const t of all(1, 200)) {
    if (t.type !== "einordnen" || t.kind !== "mc") continue;
    const right = t.options[t.answer];
    if (/\(O₃\)|\(O₂\)|\(He\)|\(N₂\)|\(H₂\)/.test(t.prompt)) assert.strictEqual(right, "Element", t.prompt);
    if (/\(H₂O\)|\(CO₂\)|\(CH₄\)/.test(t.prompt)) assert.strictEqual(right, "Verbindung", t.prompt);
  }
});
