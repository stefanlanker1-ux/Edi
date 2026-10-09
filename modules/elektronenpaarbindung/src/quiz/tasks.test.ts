import { test, assert } from "vitest";
import { makeRound, LEVELS, KNOWN_BY_ID, TYPE_NAMES, type Task } from "./tasks.ts";
import { KNOWN } from "@lern/chem";
import { MISS } from "./misconceptions.ts";

test("alle Level erzeugen gültige Aufgaben mit sauberen Texten", () => {
  for (const stufe of ["us", "os"] as const) {
    for (const level of [0, 1, 2, "mix" as const]) {
      for (let r = 0; r < 150; r++) {
        const tasks: Task[] = makeRound(stufe, level);
        assert.strictEqual(tasks.length, 10);
        for (const t of tasks) {
          assert.ok(t.prompt && t.hint && t.explain);
          assert.deepEqual(JSON.parse(JSON.stringify(t)), t);
          const text = t.prompt + " " + t.explain;
          assert.ok(!/\b1\** (freie Paare|Valenzelektronen|Bindungen\b)|fehlen 1\b/.test(text), text);
          if (t.kind === "mc") {
            assert.ok(t.options.length >= 3, `zu wenige Optionen: ${t.prompt}`);
            assert.strictEqual(new Set(t.options).size, t.options.length, `doppelt: ${t.options}`);
            assert.ok(t.answer >= 0 && t.answer < t.options.length);
            // Rückmeldungssätze je Option (an der Lösung der Bestätigungssatz), Stolpersteine nur an falschen Optionen
            for (const [i, why] of Object.entries(t.why ?? {})) {
              assert.ok(Number(i) >= 0 && Number(i) < t.options.length, `why am falschen Index: ${t.prompt}`);
              assert.ok(why.length > 10, `leere Fehlvorstellung: ${t.prompt}`);
            }
            if (["bindigkeit", "around", "lonePairs", "bondType"].includes(t.type!))
              assert.ok(Object.keys(t.miss ?? {}).length >= 1, `keine Fehlvorstellung: ${t.prompt} ${t.options}`);
          } else {
            assert.ok(KNOWN_BY_ID[t.molecule], t.molecule);
            if (stufe === "us") assert.ok(!KNOWN_BY_ID[t.molecule].os, "Unterstufe nur einfache Moleküle");
          }
        }
      }
    }
    assert.strictEqual(LEVELS[stufe].length, 3);
  }
}, 30_000); // viele Aufgaben – unter Last länger als die üblichen 5 s

test("diagnostische Distraktoren: Schlüssel im Katalog, Listen passen zu den Optionen, Fallen zeigen auf die gemeldeten Werte", () => {
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
              assert.ok(["atomsOff", "multi", "complete"].includes(tr.field!), `Falle zeigt auf fremdes Feld ${tr.field}`);
            }
          }
        }
      }
    }
  }
  assert.ok(withDiag / total > 0.6, `zu wenige Aufgaben mit Diagnose: ${withDiag}/${total}`);
});

test("Rückmeldung zur Bindungsart: H hat 1 ungepaartes Elektron (nicht 7)", () => {
  for (let r = 0; r < 400; r++) for (const t of makeRound("us", 1)) {
    const all = JSON.stringify(t);
    assert.ok(!/H hat 1 Valenzelektronen|davon 7 ungepaarte/.test(all), all);
  }
});

test("Unterstufe: Namen nur von Molekülen der Unterstufe (keine Oberstufen-Stoffe als falsche Antwort)", () => {
  const osNames = new Set(KNOWN.filter(k => k.os).map(k => k.name));
  for (let r = 0; r < 400; r++) for (const t of makeRound("us", 2)) {
    if (t.type !== "name" || t.kind !== "mc") continue;
    for (const o of t.options) assert.ok(!osNames.has(o), `${t.prompt}: ${o}`);
  }
});

test("Polarität und Molekülform: passende Stolpersteine, Mehrzahl, ein Begriff", () => {
  assert.strictEqual(TYPE_NAMES.geometry, "Molekülform");
  for (let r = 0; r < 300; r++) for (const t of makeRound("os", "mix")) {
    if (t.kind !== "mc") continue;
    const all = JSON.stringify(t);
    assert.ok(!/Molekülgeometrie|Richtungen|wie \*\*ein\*\* Partner|die Partner\b|Paare, das mitzählt/.test(all), all);
    // Chlormethan: Grund sind die verschiedenen Bindungspartner, nicht ein gewinkelter Bau
    if (t.type === "polar" && /Chlormethan/.test(t.prompt)) assert.ok(Object.values(t.miss ?? {}).includes("partner-ungleich"), all);
    if (t.type === "angle" && /Methanal/.test(t.prompt)) {
      assert.strictEqual(t.options[t.answer], "ca. 120°");
      assert.ok(!t.options.includes("120°"), "120° und ca. 120° zugleich");
    }
  }
});

test("Unterstufe: jeder abgefragte Molekülname steht in der Erklärung (Level I)", async () => {
  const { guideFor } = await import("../guide.tsx");
  const text = JSON.stringify(guideFor("us"));
  // Elemente (H₂, Cl₂ …) heißen wie das Element – die Regel steht in der Erklärung
  const missing = KNOWN.filter(k => !k.os && new Set(k.atoms.map(a => a[0])).size > 1 && !text.includes(k.name)).map(k => k.name);
  assert.deepEqual(missing, []);
});

test("Molekülform: jede falsche Form hat eine eigene Rückmeldung", () => {
  let n = 0;
  for (let r = 0; r < 200; r++) for (const t of makeRound("os", "mix")) {
    if (t.type !== "geometry" || t.kind !== "mc") continue;
    n++;
    t.options.forEach((o, i) => { if (i !== t.answer) assert.ok(t.why?.[i], `${t.prompt}: ${o}`); });
  }
  assert.ok(n > 0);
}, 30_000); // viele Aufgaben – unter Last länger als die üblichen 5 s

