import { test, assert } from "vitest";
import { buildRound, d, freshRound, mc, taskKey, type BaseTask } from "../src/types.ts";

// Generator mit kleinem Vorrat: 6 verschiedene Fragen je Typ
const gen = (type: string) => (): BaseTask => {
  const n = Math.floor(Math.random() * 6);
  return { kind: "mc", type, prompt: `${type} ${n}`, hint: "", explain: "" };
};
const make = () => ["a", "b", "a", "b"].map(t => gen(t)());

test("taskKey: gleiche Frage, gleiche Kennung – Reihenfolge der Antworten egal", () => {
  const t = { kind: "mc", prompt: "Wie viele?", hint: "h", explain: "e" };
  assert.strictEqual(taskKey({ ...t, options: ["1", "2"], answer: 0 } as BaseTask), taskKey({ ...t, options: ["2", "1"], answer: 1 } as BaseTask));
  assert.notStrictEqual(taskKey(t), taskKey({ ...t, prompt: "Wie viele noch?" }));
});

test("freshRound: keine Frage aus den letzten Runden, solange es neue gibt", () => {
  for (let r = 0; r < 200; r++) {
    const recent = ["a 0", "a 1", "a 2", "b 0", "b 1"].map(p => taskKey({ kind: "mc", type: "x", prompt: p, hint: "", explain: "" }));
    const round = freshRound(make, recent);
    assert.deepEqual(round.map(t => t.type), ["a", "b", "a", "b"]);
    for (const t of round) assert.ok(!recent.includes(taskKey(t)), t.prompt);
    assert.strictEqual(new Set(round.map(taskKey)).size, round.length);
  }
});

test("freshRound: Vorrat erschöpft → die am längsten zurückliegende Frage", () => {
  const all = [0, 1, 2, 3, 4, 5].map(n => taskKey({ kind: "mc", prompt: `a ${n}`, hint: "", explain: "" }));
  const recent = [all[3], all[0], all[1], all[2], all[4], all[5]]; // a 3 am längsten her
  const round = freshRound(() => [gen("a")()], recent, 40);
  assert.strictEqual(round[0].prompt, "a 3");
});

test("viele Runden hintereinander: über 6 Fragen hinweg keine Wiederholung", () => {
  let recent: string[] = [];
  const asked: string[] = [];
  for (let r = 0; r < 3; r++) {
    const round = freshRound(() => [gen("a")(), gen("a")()], recent, 40);
    for (const t of round) { asked.push(t.prompt); recent = [...recent, taskKey(t)]; }
  }
  assert.strictEqual(new Set(asked).size, 6);
});

// Distraktoren mit Diagnose: mc() mischt, Rückmeldung (`why`) und Stolperstein (`miss`) hängen am Index der Antwort
const genMc = (n = Math.floor(Math.random() * 6)): BaseTask =>
  ({ ...mc(`${n}`, [d(`${n + 1}`, "plus-eins", "eins zu viel"), d(`${n + 2}`, "plus-zwei", "zwei zu viel"), `${n + 3}`]), type: "a", prompt: `Frage ${n}`, hint: "h", explain: "e" });

test("taskKey: gemischte Distraktoren, gelöstes Beispiel, Merksatz und Tipp-Hervorhebung ändern die Kennung nicht", () => {
  const a = genMc(2);
  let b = genMc(2);
  while (JSON.stringify((b as BaseTask & { miss?: unknown }).miss) === JSON.stringify((a as BaseTask & { miss?: unknown }).miss)) b = genMc(2);
  assert.strictEqual(taskKey(a), taskKey(b));
  assert.strictEqual(taskKey(a), taskKey({ ...b, stage: "faded", lead: "Merksatz des Platzes", hintCue: true }));
  assert.notStrictEqual(taskKey(a), taskKey(genMc(3)));
});

test("viele Runden mit Distraktoren: über 6 Fragen hinweg keine Wiederholung (auch nach einem gelösten Beispiel)", () => {
  for (let run = 0; run < 100; run++) {
    let recent: string[] = [];
    const asked: string[] = [];
    for (let r = 0; r < 3; r++) {
      const round = freshRound(() => [genMc(), genMc()], recent, 40);
      // so merkt sich der Store die Fragen: mit `stage` (die erste Aufgabe einer neuen Fertigkeit zeigt den ersten Schritt)
      round.forEach((t, i) => { asked.push(t.prompt); recent = [...recent, taskKey(i === 0 ? { ...t, stage: "faded" } : t)]; });
    }
    assert.strictEqual(new Set(asked).size, 6, asked.join(" | "));
  }
});

test("buildRound: dieselbe Frage mit anders gemischten Antworten kommt nicht doppelt", () => {
  for (let r = 0; r < 100; r++) {
    const round = buildRound(["a"], { a: () => genMc() }, 3);
    assert.strictEqual(new Set(round.map(t => t.prompt)).size, 3, round.map(t => t.prompt).join(" | "));
  }
});

test("feste Reihenfolge: ersetzte Fragen kommen vom selben Platz – der Merksatz bleibt an seinem Platz", () => {
  const seq = ["a", "a", "b", "a"], leads = ["L0", "L1", "L2", "L3"];
  const make = () => seq.map((type, i) => ({ ...gen(type)(), lead: leads[i] }));
  for (let run = 0; run < 20; run++) {
    let recent: string[] = [];
    for (let r = 0; r < 12; r++) {
      const round = freshRound(make, recent, 10, true);
      assert.deepEqual(round.map(t => t.type), seq);
      assert.deepEqual(round.map(t => t.lead), leads);
      recent = [...recent, ...round.map(taskKey)];
    }
  }
});
