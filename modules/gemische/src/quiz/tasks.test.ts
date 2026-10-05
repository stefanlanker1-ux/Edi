import { test, assert } from "vitest";
import { GENS, makeRound, LEVELS, TYPE_NAMES, distinctColors, type Pic, type Task } from "./tasks.ts";
import { PART_NAME } from "./trennen.ts";
import { MISS } from "./misconceptions.ts";
import { analyse, isElement, pictureKind, PICTURE_LABEL } from "../mixtures.ts";
import { initial } from "../mixing.ts";

const all = (level: number | "mix", rounds: number) => Array.from({ length: rounds }, () => makeRound("us", level)).flat();
const picsOf = (t: Task): Pic[] => [...(t.pic ? [t.pic] : []), ...Object.values(t.pics ?? {})];

test("alle Level erzeugen gültige, speicherbare Aufgaben", () => {
  for (const level of [0, 1, 2, 3, 4, "mix" as const]) {
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
      } else if (t.kind === "tap") {
        assert.ok(t.parts.includes(t.answer) && new Set(t.parts).size === t.parts.length && t.parts.length >= 2, t.prompt);
        assert.ok(t.pic || t.sep, "Bild zum Antippen fehlt");
        if (t.pic) for (const p of t.parts) assert.ok(t.pic.mix.some(([f]) => f === p), p);
      } else {
        assert.fail(`Zahl eintippen soll es nicht mehr geben: ${t.type}`);
      }
    }
  }
  assert.strictEqual(LEVELS.length, 5);
});

test("keine Moleküle aus nur einer Atomsorte (O₂, O₃, N₂ …) in Bildern und Texten", () => {
  for (const t of all("mix", 200)) {
    for (const p of picsOf(t)) for (const [f] of p.mix) assert.ok(!isElement(f) || !/\d/.test(f), `${t.type}: ${f}`);
    assert.ok(!/(^|[^A-Za-z₀-₉])(O₂|O₃|N₂|H₂|Cl₂)(?![A-Za-z₀-₉])/.test(t.prompt + (t.kind === "mc" ? t.options.join() : "")), t.prompt);
  }
});

test("Zählaufgaben stimmen mit der Auswertung überein", () => {
  for (const t of all("mix", 200) as Task[]) {
    if (t.kind !== "mc" || !t.pic || !["teilchen", "stoffe", "atomsorten", "verbindungen", "elemente"].includes(t.type!)) continue;
    const a = analyse(t.pic.mix);
    const want: Record<string, number> = { teilchen: a.teilchen, stoffe: a.stoffe.length, atomsorten: a.atomsorten.length, verbindungen: a.verbindungen.length, elemente: a.elemente.length };
    assert.strictEqual(t.options[t.answer], String(want[t.type!]), `${t.type}: ${JSON.stringify(t.pic.mix)}`);
    assert.deepEqual([...t.options].map(Number), [...t.options].map(Number).sort((x, y) => x - y), "Zahlen aufsteigend");
  }
});

test("Teilchen bleiben erhalten: Antwort = Teilchen des gelösten Stoffs im Bild vorher", () => {
  for (const t of all("mix", 300)) {
    if (t.type !== "erhalten" || t.kind !== "mc") continue;
    assert.strictEqual(t.pic!.arrange, "vorher");
    assert.strictEqual(t.options[t.answer], String(t.pic!.mix.find(([f]) => f !== "H2O")![1]));
  }
});

test("Teilchenbilder einordnen: die richtige Antwort passt zur Art des Bildes", () => {
  for (const t of all("mix", 300)) {
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
  for (const t of all(2, 200)) {
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
    if (t.kind === "tap") {
      if (t.traps?.length) withDiag++;
      for (const tr of t.traps ?? []) { assert.ok(MISS[tr.miss], tr.miss); assert.ok(tr.why.length > 10, tr.why); seen.add(tr.miss); }
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
    // Stofftrennung: eine feste Zahl echter Fälle (Gemisch → Verfahren, Teile im Bild) statt Zufallsbildern
    const min = LEVELS[lv].id === "gm-k5" ? 25 : 80;
    assert.ok(keys.size >= min, `${LEVELS[lv].name}: nur ${keys.size} verschiedene Aufgaben`);
  }
});

test("keine zwei Atomsorten mit ähnlicher Farbe in einer Aufgabe (z. B. He und Ne, Cu und Fe)", () => {
  for (const t of all("mix", 300)) assert.ok(distinctColors(t), `${t.type}: ${JSON.stringify(t.pic ?? t.pics)}`);
}, 60_000);

test("Kapitel 1–5: feste Reihenfolge, Merksatz je Aufgabe, keine Frage doppelt, Tipp zugeschnitten", () => {
  assert.deepEqual(LEVELS.map(l => l.name), ["Teilchen und Atomsorten", "Elemente und Verbindungen", "Reinstoffe und Gemische", "Gemische im Alltag", "Stofftrennung"]);
  for (let lv = 0; lv < LEVELS.length; lv++) {
    const L = LEVELS[lv];
    assert.strictEqual(L.seq.length, 10);
    assert.strictEqual(L.leads.length, 10);
    assert.strictEqual(new Set(L.leads).size, 10, `${L.name}: Merksätze doppelt`);
    for (let r = 0; r < 60; r++) {
      const round = makeRound("us", lv);
      assert.deepEqual(round.map(t => t.type), L.seq);
      // Merksatz des Platzes – außer die Variante bringt ihren eigenen mit (Bild nach dem Mischen, Trennverfahren mit Ziel)
      round.forEach((t, i) => { assert.ok(t.lead, `${L.name} ${i}: Merksatz fehlt`); if (!["nachher", "trennWahl"].includes(t.type!)) assert.strictEqual(t.lead, L.leads[i]); });
      const keys = round.map(t => t.prompt + JSON.stringify(t.pic ?? t.pics ?? null));
      assert.strictEqual(new Set(keys).size, keys.length, `doppelt in ${L.name}`);
      for (const t of round) {
        assert.ok(!("tip" in t), "tip bleibt intern");
        assert.ok(t.hintCue, `${t.type}: hintCue`);
      }
    }
  }
  // Tipp mit Hervorhebung unterscheidet sich vom allgemeinen Tipp (Alles gemischt)
  const plainAll = all("mix", 40);
  for (const id of new Set(LEVELS.flatMap(l => l.seq))) {
    const cue = all(LEVELS.findIndex(l => l.seq.includes(id)), 1).find(t => t.type === id)!;
    const plain = plainAll.find(t => t.type === id);
    if (plain) assert.ok(cue.hint && plain.hint && cue.hint !== plain.hint, id);
  }
  // Alles gemischt: ohne Merksatz und ohne zugeschnittenen Tipp
  for (const t of all("mix", 20)) assert.ok(!t.hintCue && !("tip" in t) && !t.lead);
});

// Merksatz (lead) und Tipp (hint/tip) nennen den Blickpunkt, nie die gefragte Aussage: kein Inhaltswort der richtigen Antwort
const STOP = new Set(["eine", "einer", "einen", "einem", "der", "die", "das", "den", "dem", "des", "und", "mit", "ohne", "nicht", "kein", "keine", "keines", "wird", "werden", "sich", "nur", "sind",
  "ist", "aus", "zur", "zum", "von", "beim", "alle", "jede", "jeder", "mehr", "aber", "dann", "noch", "auch", "sie", "ihre", "ihren",
  // Oberbegriff, der in fast jeder Frage und Antwort steht (der Tipp darf ihn als Blickpunkt nennen)
  "teilchen"]);
const words = (x: string) => x.replace(/\*\*|⁠/g, "").toLowerCase().split(/[^\p{L}\p{N}₀-₉-]+/u).filter(w => w.length >= 4 && !STOP.has(w));
const answerText = (t: Task) => (t.kind === "mc" ? (t.pics ? "" : t.options[t.answer]) : t.kind === "tap" ? (t.sep ? PART_NAME[t.answer]?.() ?? t.answer : "") : String(t.answer));

test("Merksatz vor der Aufgabe verrät die Antwort nicht (kein Wort der richtigen Antwort im Merksatz)", () => {
  const bad = new Set<string>();
  for (let lv = 0; lv < LEVELS.length; lv++) for (let k = 0; k < 40; k++) for (const t of makeRound("us", lv)) {
    if (!t.lead) continue;
    const lead = new Set(words(t.lead));
    for (const w of words(answerText(t))) if (lead.has(w)) bad.add(`${LEVELS[lv].id} ${t.type}: „${w}“ in „${t.lead}“`);
  }
  assert.deepEqual([...bad], []);
}, 60_000);

test("Tipp und erster Schritt (hint und tip) verraten die Antwort nicht – in jedem Generator", () => {
  const bad = new Set<string>();
  for (const [id, g] of Object.entries(GENS)) for (let k = 0; k < 60; k++) {
    const t = g();
    for (const f of [t.hint, (t as { tip?: string }).tip]) {
      if (!f) continue;
      const w = new Set(words(f));
      for (const a of words(answerText(t))) if (w.has(a)) bad.add(`${id}: „${a}“ in „${f}“`);
    }
  }
  assert.deepEqual([...bad], []);
}, 60_000);
