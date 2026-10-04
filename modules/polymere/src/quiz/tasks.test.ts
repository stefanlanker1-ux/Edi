// Aufgaben: speicherbar, Antwort unter den Optionen, keine doppelten Optionen, Bilder zu Bild-Antworten,
// Fehlvorstellungen aus dem Katalog, jede falsche Antwort mit Rückmeldung, Level-Reihenfolge.
import { test, assert } from "vitest";
import { GENERATORS, LEVELS, TYPE_NAMES, makeRound, type Task } from "./tasks.ts";
import { MISS } from "./misconceptions.ts";

const all = (level: number | "mix", rounds: number) => Array.from({ length: rounds }, () => makeRound("us", level)).flat();

test("sechs Kapitel mit je zehn Aufgaben und Merksatz", () => {
  assert.strictEqual(LEVELS.length, 6);
  for (const l of LEVELS) {
    assert.strictEqual(l.seq.length, 10, l.id);
    assert.strictEqual(l.leads.length, 10, l.id);
    for (const t of l.seq) assert.ok(GENERATORS[t], `${l.id}: ${t} fehlt`);
  }
  for (const id of Object.keys(GENERATORS)) assert.ok(TYPE_NAMES[id], `Name fehlt: ${id}`);
  // jeder Aufgabentyp kommt in einem Kapitel vor
  for (const id of Object.keys(GENERATORS)) assert.ok(LEVELS.some(l => l.types.includes(id)), `${id} in keinem Kapitel`);
});

test("alle Aufgaben gültig und speicherbar", () => {
  for (const level of [0, 1, 2, 3, 4, 5, "mix" as const]) {
    for (const t of all(level, 40) as Task[]) {
      assert.ok(t.prompt && t.hint && t.explain, `${t.type}: Texte fehlen`);
      assert.ok(TYPE_NAMES[t.type!], t.type);
      assert.deepEqual(JSON.parse(JSON.stringify(t)), t, "nicht JSON-fähig");
      assert.ok(!/undefined|\bNaN\b|\bnull\b|\[object/.test(t.prompt + t.explain + t.hint + t.options.join()), `${t.type}: ${t.prompt} ${t.explain}`);
      assert.ok(t.options.length >= 3, `${t.type}: zu wenige Optionen ${t.options}`);
      assert.strictEqual(new Set(t.options).size, t.options.length, `${t.type}: doppelt ${t.options}`);
      assert.ok(t.answer >= 0 && t.answer < t.options.length);
      if (t.pics) for (const o of t.options) assert.ok(t.pics[o], `${t.type}: Bild fehlt für ${o}`);
      for (const m of Object.values(t.miss ?? {})) assert.ok(MISS[m], `${t.type}: Schlüssel ${m} fehlt im Katalog`);
      // jede falsche Antwort mit Diagnose: mindestens zwei je Aufgabe
      const diag = t.options.filter((_, i) => i !== t.answer && t.why?.[i]).length;
      assert.ok(diag >= 2, `${t.type}: nur ${diag} Rückmeldungen (${t.options})`);
    }
  }
}, 60_000);

test("Mechanismus-Bilder lassen sich nachstellen", async () => {
  const { replay } = await import("../chem/mech/index.ts");
  for (const t of all("mix", 30) as Task[]) {
    if (t.vis?.k !== "mech") continue;
    const m = replay(t.vis.r, t.vis.acts.slice(0, -1));
    assert.ok(m.actions().some(a => a.id === t.vis!.k && false) || m.actions().some(a => a.id === (t.vis as { acts: string[] }).acts.at(-1)), `${t.type}: Aktion nicht möglich`);
  }
});

test("Stufenwachstum bei hohem Umsatz: kaum Monomer, im Mittel 10 Bausteine (bei 50 % wäre noch die Hälfte Monomer)", () => {
  const ts = Array.from({ length: 60 }, () => GENERATORS.wachstum()).filter(t => /Polykondensation/.test(t.prompt));
  assert.ok(ts.length > 0);
  for (const t of ts) {
    assert.match(t.prompt, /90 % Umsatz/);
    assert.match(t.explain, /10 Bausteine/);
    assert.ok(!/50 %|halbe/.test(t.prompt + t.explain + Object.values(t.why ?? {}).join()), t.prompt);
  }
});
