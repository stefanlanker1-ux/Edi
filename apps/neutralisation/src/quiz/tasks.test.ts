import { test, assert } from "vitest";
import { HYDROXIDE_BY_ID, PROTIC_BY_ID, neutralEquation, isKnownSalt, restOf } from "@lern/chem";
import { makeRound, LEVELS, TYPE_NAMES, type Task } from "./tasks.ts";
import { MISS } from "./misconceptions.ts";

test("alle Level erzeugen gültige, speicherbare Aufgaben", () => {
  for (const stufe of ["us", "os"] as const) {
    for (const level of [0, 1, 2, "mix" as const]) {
      for (let r = 0; r < 150; r++) {
        const tasks: Task[] = makeRound(stufe, level);
        assert.strictEqual(tasks.length, 10);
        for (const t of tasks) {
          assert.ok(t.prompt && t.hint && t.explain, "Texte fehlen");
          assert.ok(TYPE_NAMES[t.type!], t.type);
          assert.deepEqual(JSON.parse(JSON.stringify(t)), t, "nicht JSON-fähig");
          assert.ok(!/undefined|\bNaN\b|\bnull\b/.test(t.prompt + t.explain), t.prompt + t.explain);
          if (t.kind === "mc") {
            assert.ok(t.options.length >= 3, `zu wenige Optionen: ${t.prompt} ${t.options}`);
            assert.strictEqual(new Set(t.options).size, t.options.length, `doppelt: ${t.options}`);
            assert.ok(t.answer >= 0 && t.answer < t.options.length);
            assert.ok(!t.options.some(o => /undefined|\bNaN\b/.test(o)), t.options.join(" | "));
          } else {
            const b = HYDROXIDE_BY_ID[t.base], a = PROTIC_BY_ID[t.acid];
            assert.ok(b && a && t.step >= 1 && t.step <= a.protons, t.prompt);
            if (stufe === "us") assert.ok(!b.os && t.step === a.protons, "Unterstufe: nur vollständig, ohne Al(OH)₃");
            assert.ok(isKnownSalt(b, restOf(a, t.step)), `Salz gibt es nicht: ${t.prompt}`);
            const n = neutralEquation(b, a, t.step);
            assert.ok(n.nBase <= 6 && n.nAcid <= 6, "Stepper reicht bis 6");
          }
          if (stufe === "us") assert.ok(!/Aluminium|Al\(OH\)|[Hh]ydrogen(sulf|carbonat|phosphat)|nur \*\*\d H⁺|nur \d H⁺/.test(t.prompt + t.explain + (t.kind === "mc" ? t.options[t.answer] : "")), `Oberstufen-Inhalt in der Unterstufe: ${t.prompt}`);
        }
      }
    }
    assert.strictEqual(LEVELS[stufe].length, 3);
  }
});

test("diagnostische Distraktoren: Schlüssel im Katalog, Rückmeldung zu jedem Stolperstein, Fallen nie die Lösung", () => {
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
              assert.ok((t.why?.[idx] ?? "").length > 10, `Rückmeldung fehlt: ${m}`);
            }
          }
          if (t.kind === "build") {
            if (t.traps?.length) withDiag++;
            const n = neutralEquation(HYDROXIDE_BY_ID[t.base], PROTIC_BY_ID[t.acid], t.step);
            for (const tr of t.traps ?? []) {
              assert.ok(MISS[tr.miss], tr.miss);
              assert.ok(tr.values && (tr.values.nB !== n.nBase || tr.values.nA !== n.nAcid), `Falle = Lösung: ${t.prompt}`);
              assert.ok(tr.values!.nB <= 6 && tr.values!.nA <= 6);
            }
          }
        }
      }
    }
  }
  assert.ok(withDiag / total > 0.85, `zu wenige Aufgaben mit Diagnose: ${withDiag}/${total}`);
});
