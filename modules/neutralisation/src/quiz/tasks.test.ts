import { test, assert } from "vitest";
import { HYDROXIDE_BY_ID, PROTIC_ACIDS, PROTIC_BY_ID, neutralEquation, isKnownSalt, restOf, toSubscript } from "@lern/chem";
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
          if (stufe === "us") assert.ok(!/Aluminium|Al\(OH\)|[Hh]ydrogen(sulf|carbonat|phosphat)|nur \*\*\d\sH⁺|nur \d\sH⁺/.test(t.prompt + t.explain + (t.kind === "mc" ? t.options[t.answer] : "")), `Oberstufen-Inhalt in der Unterstufe: ${t.prompt}`);
        }
      }
    }
    assert.strictEqual(LEVELS[stufe].length, 3);
  }
}, 30_000); // viele Aufgaben – unter Last länger als die üblichen 5 s

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

test("jede falsche Antwort hat eine eigene Rückmeldung und einen Stolperstein (alle Typen, beide Level)", () => {
  let n = 0;
  for (const stufe of ["us", "os"] as const) for (let r = 0; r < 80; r++) for (const t of [0, 1, 2].flatMap(l => makeRound(stufe, l))) {
    if (t.kind !== "mc") continue;
    t.options.forEach((o, i) => {
      if (i === t.answer) return;
      n++;
      assert.ok((t.why?.[i] ?? "").length > 10, `${stufe} ${t.type}: ${t.prompt} → ${o} ohne Rückmeldung`);
      assert.ok(MISS[t.miss?.[i] ?? ""], `${stufe} ${t.type}: ${o} ohne Stolperstein`);
    });
  }
  assert.ok(n > 3000, `nur ${n}`);
}, 30_000);

/** alle Texte einer Aufgabe, die Schüler sehen: Frage, Tipp, Erklärung, Antworten, Rückmeldungen */
const allTexts = (t: Task) => [t.prompt, t.hint, t.explain, ...(t.kind === "mc" ? [...t.options, ...Object.values(t.why ?? {})] : (t.traps ?? []).map(x => x.why))];
const roundsOf = (stufe: "us" | "os", n: number) => Array.from({ length: n }, () => [0, 1, 2].flatMap(l => makeRound(stufe, l))).flat();

test("Level I: keine Perchlorsäure, keine Hydrogen-Namen, kein „einprotonig“ oder „Formeleinheit“ (erst Level II) – auch nicht in Tipps, Antworten, Rückmeldungen", () => {
  for (const t of roundsOf("us", 150)) for (const s of allTexts(t))
    assert.ok(!/Perchlor|HClO₄|[Hh]ydrogen|Formeleinheit|protonig/.test(s), `${t.type}: ${s}`);
});

test("Säurerest-Fallen mit -id/-it/-at stammen aus derselben Familie (keine Schwefel-Namen bei Phosphat oder Carbonat)", () => {
  const root = (s: string) => ["sulf", "nitr", "chlor", "brom", "phosph", "carbon", "format", "acetat"].find(r => s.toLowerCase().includes(r));
  let n = 0;
  for (const st of ["us", "os"] as const) for (const t of roundsOf(st, 150)) {
    if (t.kind !== "mc" || !t.miss) continue;
    for (const [i, m] of Object.entries(t.miss)) if (m === "endung-id-at-it") {
      n++;
      assert.strictEqual(root(t.options[Number(i)]), root(t.options[t.answer]), `${t.prompt}: ${t.options[Number(i)]} ↔ ${t.options[t.answer]}`);
    }
  }
  assert.ok(n > 100, `nur ${n}`);
});

test("Salz, Salzname, Gleichung, Bauen: bei mehrprotonigen Säuren steht in der Frage, wie viele H⁺ jede Säure abgibt", () => {
  let n = 0;
  for (const st of ["us", "os"] as const) for (const t of roundsOf(st, 150)) {
    if (!["salz", "salzName", "gleichung", "bauen"].includes(t.type!)) continue;
    if (t.type === "salzName" && !t.prompt.includes("→")) continue; // Frage nach dem Namen einer Formel: eindeutig
    const acid = PROTIC_ACIDS.find(a => t.f?.includes(a.formula))!;
    assert.ok(acid, t.prompt);
    // als eigener Satz, nicht mitten in der Frage („… – jedes H₂CO₃ gibt nur 1 H⁺ ab ist richtig ausgeglichen?“)
    assert.ok(!/ – jedes/.test(t.prompt), t.prompt);
    if (acid.protons === 1) continue;
    n++;
    assert.match(t.prompt, /Jedes \S+ gibt (nur \*\*\d\u00a0H⁺\*\*|\*\*alle \d\u00a0H⁺\*\*) ab\./, t.prompt);
  }
  assert.ok(n > 300, `nur ${n}`);
});

test("Tipps und Rückmeldungen zu COOH-Säuren sprechen nicht von „H vorne in der Formel“ ohne die COOH-Gruppe", () => {
  for (const st of ["us", "os"] as const) for (const t of roundsOf(st, 100)) {
    if (!t.f?.some(f => /COOH/.test(f))) continue;
    for (const s of [t.hint, ...(t.kind === "mc" ? Object.values(t.why ?? {}) : [])])
      if (/vorne in der Formel/.test(s)) assert.match(s, /COOH/, `${t.prompt}: ${s}`);
  }
});

test("„schweflige Säure“ mitten im Satz klein (groß nur am Satzanfang und als eigene Antwort)", () => {
  for (const st of ["us", "os"] as const) for (const t of roundsOf(st, 100))
    for (const s of [t.prompt, t.hint, t.explain, ...(t.kind === "mc" ? Object.values(t.why ?? {}) : [])])
      assert.ok(!/Schweflige/.test(s.replace(/(^|[.!?] )Schweflige/g, "$1")), s);
});

/** Wörter (nur Buchstaben, ab 4) der richtigen Antwort, die im Tipp stehen – auch als „Erster Schritt“ sichtbar, darf die Lösung nicht nennen */
const hintLeaks = (t: Task) => {
  if (t.kind !== "mc") return [];
  const hint = t.hint.toLowerCase();
  return (t.options[t.answer].replace(/\*/g, "").match(/\p{L}{4,}/gu) ?? []).filter(w => hint.includes(w.toLowerCase()));
};

test("Tipp nennt kein Wort der richtigen Antwort (alle Typen, beide Level)", () => {
  for (const st of ["us", "os"] as const) for (const t of roundsOf(st, 150))
    assert.deepEqual(hintLeaks(t), [], `${t.type}: ${t.kind === "mc" ? t.options[t.answer] : ""} | ${t.hint}`);
}, 30_000); // viele Aufgaben – unter Last länger als die üblichen 5 s

test("Wortgleichungen nennen Lauge und Säure mit Formel; Level I nur eingeführte Laugennamen", () => {
  let n = 0;
  for (const st of ["us", "os"] as const) for (const t of roundsOf(st, 150)) {
    if (t.type === "gleichung" || (t.type === "salzName" && t.prompt.includes("→"))) {
      n++;
      const acid = PROTIC_ACIDS.find(a => t.f?.includes(a.formula))!;
      const base = Object.values(HYDROXIDE_BY_ID).find(b => t.f?.includes(b.formula))!;
      assert.ok(t.prompt.includes(toSubscript(acid.formula)) && t.prompt.includes(toSubscript(base.formula)), t.prompt);
      if (st === "us") assert.ok(!/Kalkwasser|Barytwasser|Kalilauge/.test(t.prompt), t.prompt);
    }
  }
  assert.ok(n > 200, `nur ${n}`);
}, 30_000); // viele Aufgaben – unter Last länger als die üblichen 5 s

test("Koeffizient: „Zahl der H₂O genommen“ hat einen eigenen Stolperstein", () => {
  for (const t of roundsOf("os", 100)) if (t.kind === "mc" && t.type === "koeffizient")
    for (const [i, m] of Object.entries(t.miss ?? {})) if (m === "wasser-summe") assert.fail(`${t.prompt}: ${t.options[Number(i)]}`);
});
