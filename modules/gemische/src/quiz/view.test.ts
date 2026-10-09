// Aufgabenbild (Nachprüfung Runde 3): vorgemachte Beispiele zum Antippen mit Bild und markierter Lösung; das Bild bleibt im Beispiel
// auch auf niedrigen Handys; Bildantworten füllen die Taste.
import { test, assert } from "vitest";
import { readFileSync } from "node:fs";
import { isValidElement, type ReactElement } from "react";
import { minPic, visualFor } from "./QuizView.tsx";
import { GENS, type Task } from "./tasks.ts";

const css = readFileSync(new URL("../app.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

test("Antippen: im vorgemachten Beispiel steht das Bild mit markierter Lösung, sonst ist das Bild die Antwortfläche", () => {
  for (const id of ["tippAtome", "tippElement", "tippVerbindung", "trennTipp", "loesTipp"]) for (let k = 0; k < 20; k++) {
    const t = GENS[id]() as Extract<Task, { kind: "tap" }>;
    assert.strictEqual(visualFor(t), null, `${id}: Bild doppelt`);
    const v = visualFor({ ...t, stage: "worked" });
    assert.ok(isValidElement(v), `${id}: Beispiel ohne Bild`);
    const props = (v as ReactElement<{ t: Task }>).props;
    assert.strictEqual(props.t.answer, t.answer);
  }
});

test("Aufgabenbild weicht nach der Antwort der Rückmeldung – nie im vorgemachten Beispiel", () => {
  const rules = [...css.matchAll(/([^{}]*\.task-card\.answered[^{}]*)\{[^}]*display:\s*none/g)].map(m => m[1].trim());
  const pics = rules.filter(r => /\.q-visual/.test(r));
  assert.ok(pics.length >= 2, "Regeln fehlen");
  for (const r of pics) assert.ok(/\.answered:not\(\.worked\)/.test(r), r);
  // Teilchenbild füllt die Höhe des Bildbereichs (Grid mit einer Zeile, sonst bleibt der Becher in voller Höhe und wird abgeschnitten)
  assert.ok(/\.q-gm \{[^}]*grid-template-rows: minmax\(0, 1fr\)/.test(css));
  // mit Tipp darf das Bild bis 56 px (MIN_PIC) schrumpfen – sonst ragte der Tipp knapp über die Aufgabe, ohne ins Blatt zu wechseln
  assert.ok(/\.q-body > \.q-visual:has\(\.q-gm\) \{ min-height: 56px; \}/.test(css));
});

test("Bildantworten: das Bild füllt die Taste, der Kennbuchstabe liegt klein darüber", () => {
  assert.ok(/\.mc-btn:has\(\.gm-pic:not\(\.gm-method\)\) \.mc-key \{[^}]*position: absolute/.test(css));
  assert.ok(/\.mc-btn:has\(\.gm-pic:not\(\.gm-method\)\) \.mc-own \{[^}]*width: 100%/.test(css));
});

test("Aufgabenbilder nennen ihre Mindesthöhe (data-min-h): Tipp und erster Schritt gehen ins Blatt, statt das Bild zu stauchen", () => {
  for (const id of ["teilchen", "zwischen", "homogenBild", "trennWahl", "trennEigenschaft", "loesEigenschaft", "trennReihe"]) for (let k = 0; k < 20; k++) {
    const t = GENS[id]();
    const v = visualFor(t) as ReactElement<Record<string, unknown>>;
    assert.ok(isValidElement(v), id);
    assert.strictEqual(v.props["data-min-h"], minPic(t), id);
    assert.ok(minPic(t) >= 56, id);
    if (t.sep?.m === "destillieren") assert.ok(minPic(t) >= 100, "Temperatur sonst unter 14 px");
  }
});
