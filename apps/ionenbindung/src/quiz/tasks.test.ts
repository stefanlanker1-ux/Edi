import { test, assert } from "vitest";
import { makeRound, LEVELS, type Task } from "./tasks.ts";
import { ION_BY_ID, ratio, isKnownCompound } from "@lern/chem";
import { MISS } from "./misconceptions.ts";

test("alle Level erzeugen gültige Aufgaben", () => {
  for (const stufe of ["us", "os"] as const) {
    for (const level of [0, 1, 2, "mix" as const]) {
      for (let r = 0; r < 200; r++) {
        const tasks: Task[] = makeRound(stufe, level);
        assert.strictEqual(tasks.length, 10);
        for (const t of tasks) {
          assert.ok(t.prompt && t.hint && t.explain);
          assert.deepEqual(JSON.parse(JSON.stringify(t)), t);
          // keine Stoffe, die es nicht gibt (Name steht in Frage oder Erklärung)
          for (const bad of ["Eisen(III)-iodid", "Kupfer(II)-iodid", "Aluminiumcarbonat", "Ammoniumoxid", "Silberhydroxid"])
            assert.ok(!t.prompt.includes(bad) && !t.explain.includes(bad), `${bad}: ${t.prompt}`);
          assert.ok(!/\b1 Außenelektronen|fehlen \*\*1\*\*|auf 1 Metall-Ion/.test(t.explain), t.explain);
          if (t.kind === "mc") {
            assert.ok(t.options.length >= 3, `zu wenige Optionen: ${t.prompt} ${t.options}`);
            assert.strictEqual(new Set(t.options).size, t.options.length);
            assert.ok(t.answer >= 0);
            // Rückmeldungssätze je Option (an der Lösung der Bestätigungssatz), Stolpersteine nur an falschen Optionen
            for (const [i, why] of Object.entries(t.why ?? {})) {
              assert.ok(Number(i) >= 0 && Number(i) < t.options.length, `why am falschen Index: ${t.prompt}`);
              assert.ok(why.length > 10, `leere Fehlvorstellung: ${t.prompt}`);
              assert.ok(!/\b1 Elektronen|\b1 Außenelektronen/.test(why), why);
            }
            if (["charge", "electrons", "count"].includes(t.type!))
              assert.ok(Object.keys(t.miss ?? {}).length >= 1, `keine Fehlvorstellung: ${t.prompt} ${t.options}`);
          } else {
            assert.ok(ION_BY_ID[t.cation] && ION_BY_ID[t.anion]);
            if (stufe === "us") assert.ok(!ION_BY_ID[t.cation].os && !ION_BY_ID[t.anion].os, "Unterstufe nur einfache Ionen");
            assert.ok(ratio(ION_BY_ID[t.cation], ION_BY_ID[t.anion]).nC >= 1);
            assert.ok(isKnownCompound(ION_BY_ID[t.cation], ION_BY_ID[t.anion]), `gibt es nicht: ${t.prompt}`);
          }
        }
      }
    }
    assert.strictEqual(LEVELS[stufe].length, 3);
  }
});

test("diagnostische Distraktoren: Schlüssel im Katalog, Listen passen zu den Optionen, Fallen zeigen auf nC/nA", () => {
  let withDiag = 0, total = 0;
  for (const stufe of ["us", "os"] as const) {
    for (const level of [0, 1, 2, "mix" as const]) {
      for (let r = 0; r < 60; r++) {
        for (const t of makeRound(stufe, level)) {
          total++;
          if (t.kind === "mc" && t.miss) {
            withDiag++;
            for (const [i, m] of Object.entries(t.miss)) {
              const idx = Number(i);
              assert.ok(idx >= 0 && idx < t.options.length && idx !== t.answer, `Stolperstein am falschen Index: ${t.prompt}`);
              assert.ok(MISS[m], `unbekannter Stolperstein ${m}`);
              assert.ok(t.why?.[idx], `Rückmeldung fehlt: ${m}`);
            }
          }
          if (t.traps?.length) {
            withDiag++;
            for (const tr of t.traps) {
              assert.ok(MISS[tr.miss], `unbekannter Stolperstein ${tr.miss}`);
              assert.ok(tr.values && Object.keys(tr.values).every(k => k === "nC" || k === "nA"), t.prompt);
              // die Falle darf nie die richtige Lösung sein
              const r = ratio(ION_BY_ID[(t as { cation: string }).cation], ION_BY_ID[(t as { anion: string }).anion]);
              assert.ok(tr.values!.nC !== r.nC || tr.values!.nA !== r.nA, `Falle = Lösung: ${t.prompt}`);
            }
          }
        }
      }
    }
  }
  assert.ok(withDiag / total > 0.6, `zu wenige Aufgaben mit Diagnose: ${withDiag}/${total}`);
});
