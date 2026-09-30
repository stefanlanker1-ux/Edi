import { test, assert } from "vitest";
import { makeRound, weakTypes, LEVELS, TYPES, type Stufe } from "./tasks.ts";
import { commonCharges } from "@lern/chem";
import { MISS } from "./misconceptions.ts";

test("alle Level erzeugen gültige, speicherbare Aufgaben", () => {
  for (const stufe of ["us", "os"] as Stufe[]) {
    for (const level of [...LEVELS[stufe].keys(), "mix" as const, "weak" as const]) {
      for (let r = 0; r < 150; r++) {
        const tasks = makeRound(stufe, level);
        assert.strictEqual(tasks.length, 10);
        for (const t of tasks) {
          assert.ok(t.prompt && t.explain && t.hint, "Texte fehlen");
          assert.deepEqual(JSON.parse(JSON.stringify(t)), t, "nicht JSON-fähig");
          // fachlich: keine negativen Teilchenzahlen, nur Ionen, die es gibt
          const v = t.visual ?? (t.kind === "build" ? { kind: "nuclide", ...t.target } : null);
          if (v) {
            assert.ok(v.N >= 0 && v.E >= 0, `negative Teilchenzahl: ${JSON.stringify(v)}`);
            const q = v.Z - v.E;
            if (q !== 0) assert.ok(commonCharges(v.Z).includes(q), `unübliches Ion Z=${v.Z} Ladung ${q}: ${t.prompt}`);
          }
          if (t.kind === "numbers") for (const f of t.fields) if (f.id !== "q") assert.ok(f.answer >= 0, t.prompt);
          // Konfigurationen: keine falsche Option, die nur eine andere Reihenfolge derselben Besetzung ist
          if (t.kind === "mc" && t.type === "config") {
            const norm = (o: string) => o.split(" ").sort().join(" ");
            t.options.forEach((o, i) => { if (i !== t.answer) assert.notStrictEqual(norm(o), norm(t.options[t.answer]), t.prompt); });
          }
          // Einzahl: nie „1 Protonen“, „1 Außenelektronen“ …
          assert.ok(!/\b1\** (Protonen|Neutronen|Elektronen|Außenelektronen|ungepaarte )/.test(t.prompt + t.explain), t.prompt + t.explain);
          if (t.kind === "mc") {
            assert.ok(t.options.length >= 3, `zu wenige Optionen: ${t.prompt}`);
            assert.ok(t.answer >= 0 && t.answer < t.options.length);
            assert.strictEqual(new Set(t.options).size, t.options.length, `doppelte Optionen: ${t.options}`);
            // Rückmeldungssätze je Option (an der Lösung der Bestätigungssatz), Stolpersteine nur an falschen Optionen
            for (const [i, why] of Object.entries(t.why ?? {})) {
              assert.ok(Number(i) >= 0 && Number(i) < t.options.length, `why am falschen Index: ${t.prompt}`);
              assert.ok(why.length > 10, `leere Fehlvorstellung: ${t.prompt}`);
            }
            if (["outer", "period", "ionCharge", "typicalIon"].includes(t.type!))
              assert.ok(Object.keys(t.miss ?? {}).length >= 1, `keine Fehlvorstellung: ${t.prompt} ${t.options}`);
          }
        }
      }
    }
  }
});

test("Schwächen üben wählt die Typen mit der höchsten Fehlerquote", () => {
  const stats = { config: { right: 1, wrong: 5 }, block: { right: 8, wrong: 1 }, short: { right: 0, wrong: 2 }, boxes: { right: 5, wrong: 0 }, unpaired: { right: 3, wrong: 3 } };
  assert.deepEqual(weakTypes("os", stats), ["config", "short", "unpaired"]);
  assert.ok(makeRound("os", "weak", 10, stats).every(t => ["config", "short", "unpaired"].includes(t.type!)));
  assert.deepEqual(weakTypes("us", {}), []);
});

test("jeder Level-Typ existiert", () => {
  for (const stufe of ["us", "os"] as Stufe[]) for (const l of LEVELS[stufe]) for (const id of l.types) assert.ok(TYPES[stufe][id], id);
});

test("diagnostische Distraktoren: Schlüssel im Katalog, Listen passen zu den Optionen, Fallen zeigen auf Felder", () => {
  let withDiag = 0, total = 0;
  for (const stufe of ["us", "os"] as Stufe[]) {
    for (const level of [...LEVELS[stufe].keys(), "mix" as const]) {
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
            const fields = t.kind === "numbers" ? t.fields.map(f => f.id) : t.kind === "shells" ? t.target.map((_, i) => `s${i}`) : t.kind === "build" ? ["Z", "N", "E"] : [];
            for (const tr of t.traps) {
              assert.ok(MISS[tr.miss], `unbekannter Stolperstein ${tr.miss}`);
              assert.ok(tr.why, tr.miss);
              if (tr.field) assert.ok(fields.includes(tr.field), `Falle zeigt auf fremdes Feld ${tr.field}: ${t.prompt}`);
              else assert.ok(tr.values && Object.keys(tr.values).every(k => fields.includes(k)), t.prompt);
            }
          }
        }
      }
    }
  }
  assert.ok(withDiag / total > 0.6, `zu wenige Aufgaben mit Diagnose: ${withDiag}/${total}`);
});

test("Fallen zeigen nie auf den richtigen Wert (H-1: Massenzahl 1 = Elektronenzahl 1)", () => {
  for (const stufe of ["us", "os"] as Stufe[]) for (const level of LEVELS[stufe].keys()) for (let r = 0; r < 200; r++) for (const t of makeRound(stufe, level)) {
    const correct: Record<string, number> = t.kind === "numbers" ? Object.fromEntries(t.fields.map(f => [f.id, f.answer]))
      : t.kind === "build" ? { ...t.target } : t.kind === "shells" ? Object.fromEntries(t.target.map((v, i) => [`s${i}`, v])) : {};
    for (const tr of t.traps ?? []) if (tr.field) {
      assert.notStrictEqual(tr.value, correct[tr.field], `${t.prompt}: Falle ${tr.field}`);
      if (tr.min !== undefined) assert.ok(correct[tr.field] < tr.min, t.prompt);
    }
  }
});
