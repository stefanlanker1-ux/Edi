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

test("taskKey: gleicher Fragetext mit anderer richtiger Antwort ist eine andere Frage", () => {
  const q = (right: string) => ({ ...mc(right, ["K⁺", "Ca²⁺", "S²⁻", "Cl⁻"].filter(x => x !== right)), prompt: "Welches Ion hat so viele Elektronen wie das Edelgas Argon?", hint: "", explain: "" });
  assert.notStrictEqual(taskKey(q("K⁺")), taskKey(q("Ca²⁺")));
  assert.strictEqual(taskKey(q("K⁺")), taskKey(q("K⁺")));
  // Eingabe-Aufgaben: die gesuchte Zahl zählt ebenfalls
  assert.notStrictEqual(taskKey({ kind: "num", prompt: "Wie viele?", hint: "", explain: "", answer: 3 } as BaseTask), taskKey({ kind: "num", prompt: "Wie viele?", hint: "", explain: "", answer: 4 } as BaseTask));
});

// kleiner Vorrat: Typ „a“ hat nur zwei Fragen, beide zuletzt gestellt; „b“ hat viele
const small = () => [0, 1].map(n => ({ kind: "mc", type: "a", prompt: `a ${n}`, hint: "", explain: "" }) as BaseTask);
const pickSmall = (type: string): BaseTask => (type === "a" ? small()[Math.floor(Math.random() * 2)] : { ...gen("b")(), prompt: `b ${Math.floor(Math.random() * 1000)}` });

test("„Heute fällig“ (keepType): eine fällige Fertigkeit mit erschöpftem Vorrat bleibt in der Runde – die am längsten zurückliegende Frage", () => {
  const recent = [taskKey(small()[1]), taskKey(small()[0])]; // a 1 am längsten her
  for (let r = 0; r < 50; r++) {
    const round = freshRound(() => ["a", "b", "a", "b"].map(pickSmall), recent, 10, { keepType: true });
    assert.deepEqual(round.map(t => t.type), ["a", "b", "a", "b"]);
    assert.strictEqual(round[0].prompt, "a 1");
  }
});

test("Level ohne feste Reihenfolge: ein erschöpfter Typ verliert höchstens einen Platz je Runde", () => {
  const recent = small().map(taskKey);
  for (let r = 0; r < 50; r++) {
    const round = freshRound(() => ["a", "b", "a", "b", "a", "b"].map(pickSmall), recent, 10);
    assert.ok(round.filter(t => t.type === "a").length >= 2, round.map(t => t.type).join());
  }
});

test("Suche begrenzt: bei erschöpftem Vorrat nur wenige weitere Runden erzeugen (Rundenstart bleibt schnell)", () => {
  const recent = small().map(taskKey);
  for (const opts of [{ keepType: true, samePlace: true }, { keepType: true }, {}]) {
    let calls = 0;
    freshRound(() => { calls++; return ["a", "a", "a"].map(pickSmall); }, recent, 10, opts);
    // erste Runde + erste Suche (5 ohne Neues) + gezielte Suche (10 ohne Neues) – vorher bis zu 41
    assert.ok(calls <= 16, `${JSON.stringify(opts)}: ${calls} Runden erzeugt (vorher bis zu 41)`);
  }
});

test("feste Reihenfolge ohne Merksatz: Fragen desselben Typs von anderen Plätzen sind erlaubt (größerer Vorrat)", () => {
  // drei Plätze desselben Typs, je Platz nur zwei mögliche Fragen – zusammen sechs
  const make = () => [0, 1, 2].map(i => ({ kind: "mc", type: "s", prompt: `s ${2 * i + Math.floor(Math.random() * 2)}`, hint: "", explain: "" }) as BaseTask);
  let recent: string[] = [];
  const asked: string[] = [];
  for (let r = 0; r < 2; r++) { const round = freshRound(make, recent, 20, true); for (const t of round) { asked.push(t.prompt); recent = [...recent, taskKey(t)]; } }
  assert.strictEqual(new Set(asked).size, 6, asked.join(" | "));
});

test("kein Platz doppelt: ist der Vorrat erschöpft, wird die Runde kürzer statt dieselbe Frage zweimal zu stellen („Schwächen üben“)", () => {
  // eine schwache Fertigkeit mit nur drei möglichen Fragen, die Runde hätte zehn Plätze
  const make = () => Array.from({ length: 10 }, () => ({ kind: "mc", type: "w", prompt: `w ${Math.floor(Math.random() * 3)}`, hint: "", explain: "" }) as BaseTask);
  for (let r = 0; r < 50; r++) {
    const round = freshRound(make, [], 10, { keepType: true });
    assert.strictEqual(new Set(round.map(taskKey)).size, round.length, round.map(t => t.prompt).join(" | "));
    assert.ok(round.length >= 1 && round.length <= 3);
  }
});

test("nach Typ geordnetes Level (z. B. nach Schwierigkeit): eine getauschte Frage steht bei ihrem Typ, die Reihenfolge bleibt", () => {
  const order = ["leicht", "leicht", "mittel", "mittel", "schwer", "schwer"];
  const make = () => order.map(type => ({ kind: "mc", type, prompt: type === "leicht" ? "leicht 0" : `${type} ${Math.floor(Math.random() * 50)}`, hint: "", explain: "" }) as BaseTask);
  // „leicht“ hat nur eine Frage und war zuletzt dran → ein Platz wird getauscht
  for (let r = 0; r < 30; r++) {
    const round = freshRound(make, [taskKey(make()[0])], 10);
    const rank = round.map(t => order.indexOf(t.type!));
    assert.deepEqual(rank, [...rank].sort((a, b) => a - b), round.map(t => t.type).join(","));
  }
});
