import { test, assert } from "vitest";
import { makeRound, LEVELS, TYPE_NAMES, type Pic, type Task } from "./tasks.ts";
import { MISS } from "./misconceptions.ts";
import { analyse, isElement, pictureKind, PICTURE_LABEL } from "../mixtures.ts";
import { initial } from "../mixing.ts";

const all = (level: number | "mix", rounds: number) => Array.from({ length: rounds }, () => makeRound("us", level)).flat();
const picsOf = (t: Task): Pic[] => [...(t.pic ? [t.pic] : []), ...Object.values(t.pics ?? {})];

test("alle Level erzeugen gültige, speicherbare Aufgaben", () => {
  for (const level of [0, 1, 2, 3, "mix" as const]) {
    for (const t of all(level, 120)) {
      assert.ok(t.prompt && t.hint && t.explain, "Texte fehlen");
      assert.ok(TYPE_NAMES[t.type!], t.type);
      assert.deepEqual(JSON.parse(JSON.stringify(t)), t, "nicht JSON-fähig");
      assert.ok(!/undefined|\bNaN\b|\bnull\b|\[object/.test(t.prompt + t.explain + t.hint), t.prompt + t.explain);
      for (const p of picsOf(t)) {
        const a = analyse(p.mix);
        assert.ok(a.teilchen >= 3 && a.teilchen <= 25, `${a.teilchen} Teilchen`);
        // Bild lässt sich zeichnen: jede Zelle höchstens einmal, alle Teilchen da
        const s = initial({ items: p.mix, state: p.state, floats: p.floats, before: p.before, solute: p.solute }, 1, p.arrange);
        assert.strictEqual(new Set(s.ps.map(x => x.cell)).size, a.teilchen, JSON.stringify(p));
      }
      if (t.kind === "mc") {
        assert.ok(t.options.length >= 3, `zu wenige Optionen: ${t.prompt} ${t.options}`);
        assert.strictEqual(new Set(t.options).size, t.options.length, `doppelt: ${t.options}`);
        assert.ok(t.answer >= 0 && t.answer < t.options.length);
        if (t.pics) for (const o of t.options) assert.ok(t.pics[o], `Bild fehlt: ${o}`);
      } else {
        assert.ok(Number.isInteger(t.answer) && t.answer >= 0, t.prompt);
      }
    }
  }
  assert.strictEqual(LEVELS.length, 4);
});

test("keine Moleküle aus nur einer Atomsorte (O₂, O₃, N₂ …) in Bildern und Texten", () => {
  for (const t of all("mix", 200)) {
    for (const p of picsOf(t)) for (const [f] of p.mix) assert.ok(!isElement(f) || !/\d/.test(f), `${t.type}: ${f}`);
    assert.ok(!/(^|[^A-Za-z₀-₉])(O₂|O₃|N₂|H₂|Cl₂)(?![A-Za-z₀-₉])/.test(t.prompt + (t.kind === "mc" ? t.options.join() : "")), t.prompt);
  }
});

test("Zählaufgaben stimmen mit der Auswertung überein", () => {
  for (const t of all("mix", 200) as Task[]) {
    if (t.kind !== "num" || !t.pic || t.type === "erhalten") continue;
    const a = analyse(t.pic.mix);
    const want: Record<string, number> = { teilchen: a.teilchen, stoffe: a.stoffe.length, atomsorten: a.atomsorten.length, verbindungen: a.verbindungen.length, elemente: a.elemente.length };
    assert.strictEqual(t.answer, want[t.type!], `${t.type}: ${JSON.stringify(t.pic.mix)}`);
  }
});

test("Teilchen bleiben erhalten: Antwort = Teilchen des gelösten Stoffs im Bild vorher", () => {
  for (const t of all(3, 200)) {
    if (t.type !== "erhalten" || t.kind !== "num") continue;
    assert.strictEqual(t.pic!.arrange, "vorher");
    assert.strictEqual(t.answer, t.pic!.mix.find(([f]) => f !== "H2O")![1]);
  }
});

test("Teilchenbilder einordnen: die richtige Antwort passt zur Art des Bildes", () => {
  for (const t of all(1, 200)) {
    if (t.kind !== "mc") continue;
    if (t.type === "bildArt") assert.strictEqual(t.options[t.answer], PICTURE_LABEL[pictureKind(t.pic!.mix)]);
    if (t.type === "bildWahl") {
      const kinds = t.options.map(o => pictureKind(t.pics![o].mix));
      assert.strictEqual(new Set(kinds).size, kinds.length, "zwei Bilder derselben Art");
      const k = kinds[t.answer];
      assert.ok(k === "E" ? /ein Element/.test(t.prompt) : k === "V" ? /eine Verbindung/.test(t.prompt) : t.prompt.includes(PICTURE_LABEL[k]), t.prompt);
    }
    if (t.type === "einordnen") {
      const f = t.pic!.mix[0][0];
      assert.strictEqual(t.options[t.answer], isElement(f) ? "Element" : "Verbindung", t.prompt);
    }
  }
});

test("Masse beim Lösen: Wasser + gelöster Stoff", () => {
  for (const t of all(3, 200)) {
    if (t.type !== "masse" || t.kind !== "mc") continue;
    const [w, z] = [...t.prompt.matchAll(/\*\*(\d+) g\*\*/g)].map(m => Number(m[1]));
    assert.strictEqual(t.options[t.answer], `${w + z} g`);
  }
});

test("diagnostische Distraktoren: Schlüssel im Katalog, Rückmeldung zu jedem Stolperstein, Fallen nie die Lösung", () => {
  let withDiag = 0, total = 0;
  const seen = new Set<string>();
  for (const t of all("mix", 300)) {
    total++;
    if (t.kind === "mc" && t.miss) {
      if (Object.keys(t.miss).length) withDiag++;
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
  assert.ok(withDiag / total > .8, `nur ${withDiag} von ${total} mit Diagnose`);
  // jeder Stolperstein des Katalogs kommt vor
  for (const k of Object.keys(MISS)) assert.ok(seen.has(k), `Stolperstein nie verwendet: ${k}`);
});

test("genug verschiedene Aufgaben je Level (keine Wiederholungen)", () => {
  for (let lv = 0; lv < LEVELS.length; lv++) {
    const keys = new Set(all(lv, 60).map(t => JSON.stringify({ ...t, options: undefined, answer: undefined, why: undefined, miss: undefined })));
    assert.ok(keys.size >= 80, `${LEVELS[lv].name}: nur ${keys.size} verschiedene Aufgaben`);
  }
});
