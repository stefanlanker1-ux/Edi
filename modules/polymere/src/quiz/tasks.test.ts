// Aufgaben: speicherbar, Antwort unter den Optionen, keine doppelten Optionen, Bilder zu Bild-Antworten,
// Fehlvorstellungen aus dem Katalog, jede falsche Antwort mit Rückmeldung, Level-Reihenfolge.
import { test, assert } from "vitest";
import { GENERATORS, LATER, LEVELS, PAT, klMiss, sameTask, TYPE_NAMES, buildPattern, buildResult, isBuild, isOrder, isTap, makeRound, type Task } from "./tasks.ts";
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
  for (const id of Object.keys(GENERATORS)) if (!LATER.includes(id)) assert.ok(LEVELS.some(l => l.types.includes(id)), `${id} in keinem Kapitel`);
});

test("alle Aufgaben gültig und speicherbar", () => {
  for (const level of [0, 1, 2, 3, 4, 5, "mix" as const]) {
    for (const t of all(level, 40) as Task[]) {
      assert.ok(t.prompt && t.hint && t.explain, `${t.type}: Texte fehlen`);
      assert.ok(TYPE_NAMES[t.type!], t.type);
      assert.deepEqual(JSON.parse(JSON.stringify(t)), t, "nicht JSON-fähig");
      if (isBuild(t)) {
        // Kette bauen: Beispiel ist richtig, jede falsche Bauart hat eine Rückmeldung
        assert.ok(t.pool.length === 2 && t.n === 8 && t.example.length === 8 && t.sol);
        assert.ok(buildResult(t, t.example).ok, `${t.type}: Beispiel falsch`);
        for (const tr of t.traps ?? []) assert.ok(MISS[tr.miss] && tr.why);
        const [a, b] = t.pool.map(p => p.id);
        const tries = [Array(8).fill(a), Array(8).fill(b), [a, a, a, a, b, b, b, b], [a, b, a, b, a, b, a, b], [a, b, b, a, b, a, a, b], [a, a, a, b, a, a, a, a], [b, b, a, b, b, b, b, b]];
        for (const seq of tries) {
          const r = buildResult(t, seq);
          if (!r.ok) assert.ok((t.traps ?? []).some(tr => Object.entries(tr.values ?? {}).every(([k, v]) => r.values[k] === v)), `${t.type} ${t.goal}: keine Rückmeldung für ${seq}`);
        }
        continue;
      }
      if (isOrder(t)) {
        assert.strictEqual(t.cards.length, 4); assert.deepEqual([...t.correct].sort(), [0, 1, 2, 3]);
        assert.ok(!t.correct.some((x, i) => x === i), "ein Bild schon am richtigen Platz");
        for (const tr of t.traps ?? []) assert.ok(MISS[tr.miss] && tr.why);
        continue;
      }
      if (isTap(t)) {
        // Antippen: Teile vorhanden, Lösung unter den Teilen, jede Falle mit Katalog-Schlüssel, jedes falsche Teil mit Rückmeldung
        assert.ok(t.parts.length >= 3 && t.labels.length === t.parts.length && t.sol, `${t.type}: Teile`);
        assert.ok(t.mode === "pair" || (t.answer.length > 0 && t.answer.every(a => t.parts.includes(a))), `${t.type}: Lösung fehlt ${t.answer}`);
        for (const tr of t.traps ?? []) assert.ok(MISS[tr.miss] && tr.why, `${t.type}: Falle ohne Schlüssel`);
        if (t.mode !== "pair") t.parts.forEach((p, i) => { if (!t.answer.includes(p)) assert.ok((t.traps ?? []).some(tr => tr.values?.[t.mode && t.mode !== "any" ? "wrong" : "pick"] === i), `${t.type}: keine Rückmeldung für ${p}`); });
        continue;
      }
      assert.ok(!/undefined|\bNaN\b|\bnull\b|\[object/.test(t.prompt + t.explain + t.hint + t.options.join()), `${t.type}: ${t.prompt} ${t.explain}`);
      assert.ok(t.options.length >= 3, `${t.type}: zu wenige Optionen ${t.options}`);
      assert.strictEqual(new Set(t.options).size, t.options.length, `${t.type}: doppelt ${t.options}`);
      assert.ok(t.answer >= 0 && t.answer < t.options.length);
      if (t.pics) for (const o of t.options) assert.ok(t.pics[o], `${t.type}: Bild fehlt für ${o}`);
      for (const m of Object.values(t.miss ?? {})) assert.ok(MISS[m], `${t.type}: Schlüssel ${m} fehlt im Katalog`);
      // jede falsche Antwort mit Diagnose: mindestens zwei je Aufgabe
      const diag = t.options.filter((_, i) => i !== t.answer && t.why?.[i]).length;
      assert.strictEqual(diag, t.options.length - 1, `${t.type}: nur ${diag} Rückmeldungen (${t.options})`);
      // kein Wort zweimal direkt hintereinander („Isotaktisch: Isotaktisch …“)
      const words = t.explain.replace(/\*\*/g, "").toLowerCase().split(/[^\p{L}\p{N}‑-]+/u).filter(Boolean);
      assert.ok(!words.some((w, i) => i > 0 && w.length > 2 && w === words[i - 1]), `${t.type}: doppeltes Wort in „${t.explain}“`);
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
    assert.match(t.prompt, /90\s% Umsatz/);
    assert.match(t.explain, /10 Bausteine/);
    assert.ok(!/50\s%|halbe/.test(t.prompt + t.explain + (isTap(t) || isOrder(t) || isBuild(t) ? "" : Object.values(t.why ?? {}).join())), t.prompt);
  }
}, 60_000);

test("keine Aufgabe zweimal in einem Kapitel (auch nicht mit anders gemischten Antworten)", () => {
  for (let lv = 0; lv < LEVELS.length; lv++) for (let k = 0; k < 20; k++) {
    const sig = makeRound("us", lv).map(t => t.prompt + (isBuild(t) ? JSON.stringify(t.pool) + t.goal : isOrder(t) ? JSON.stringify(t.cards) : isTap(t) ? JSON.stringify(t.scene) : [...t.options].sort().join("|") + JSON.stringify(t.vis ?? null)));
    assert.strictEqual(new Set(sig).size, sig.length, `${LEVELS[lv].id}: doppelte Aufgabe`);
  }
}, 60_000);

test("Bausteine in Bildern: kein C-Atom mit mehr als vier Bindungen (außer im Distraktor „C=C bleibt“, der genau das zeigt)", async () => {
  const { unitWithDouble, chainSnap, saturatedSnap } = await import("./visual.tsx");
  const { unitSnap } = await import("../components/Formula.tsx");
  for (const id of ["propen", "styrol", "vinylchlorid", "acrylnitril"]) {
    const dbl = unitWithDouble(id), five = dbl.atoms.filter(a => a.el === "C" && !a.text && dbl.bonds.filter(b => b.a === a.id || b.b === a.id).reduce((t, b) => t + b.o, 0) === 5);
    assert.strictEqual(five.length, 2, `${id}: Distraktor zeigt zwei C mit fünf Bindungen`);
    for (const s of [unitSnap(id), chainSnap(id, 4), saturatedSnap(id)]) {
      for (const a of s.atoms.filter(x => x.el === "C" && !x.text)) {
        const n = s.bonds.filter(b => b.a === a.id || b.b === a.id).reduce((t, b) => t + b.o, 0);
        assert.ok(n <= 4, `${id}: C mit ${n} Bindungen`);
      }
    }
  }
});

test("Antippen: Rückmeldung passt zum Teil (Benzolring nur bei Ring-Atomen)", async () => {
  const { tapFrame } = await import("./tap.ts");
  for (let k = 0; k < 20; k++) {
    const t = GENERATORS.radikalTap();
    if (!isTap(t)) continue;
    const rings = Object.values(tapFrame(t.scene).snap.rings).flat();
    for (const tr of t.traps ?? []) {
      const id = t.parts[tr.values!.pick];
      assert.strictEqual(/Benzolring/.test(tr.why), rings.includes(id), `${id}: ${tr.why}`);
    }
  }
});

test("Kette bauen: Muster erkennen (Block auch als Dreiblock, zufällig = weder Block noch abwechselnd)", () => {
  const t = { kind: "build", goal: "stat", n: 8, example: [], sol: "", prompt: "", hint: "", explain: "",
    pool: [{ id: "a", ok: true }, { id: "b", ok: true }, { id: "s", ok: false }] } as unknown as Parameters<typeof buildPattern>[0];
  const p = (x: string) => buildPattern(t, x.split(""));
  assert.strictEqual(p("aaaabbbb"), PAT.block); assert.strictEqual(p("aabbbbaa"), PAT.block); assert.strictEqual(p("abababab"), PAT.alt);
  assert.strictEqual(p("abbababa"), PAT.stat); assert.strictEqual(p("aaaaaaab"), PAT.few); assert.strictEqual(p("aabaaaba"), PAT.few); assert.strictEqual(p("aabbbaba"), PAT.stat); assert.strictEqual(p("aaaaaaaa"), PAT.one); assert.strictEqual(p("aaaasaaa"), PAT.sat);
});

test("Kette bauen: „fast nur ein Monomer“ antwortet zur verlangten Art", () => {
  for (let k = 0; k < 60; k++) {
    const t = GENERATORS.bauenCopo();
    if (!isBuild(t)) continue;
    const [a, b] = t.pool.map(p => p.id);
    const r = buildResult(t, [a, a, a, b, a, a, a, a]);
    const trap = (t.traps ?? []).find(tr => Object.entries(tr.values ?? {}).every(([x, v]) => r.values[x] === v));
    assert.ok(trap, t.goal);
    const want = { stat: /Statistisch/, block: /Blockcopolymer/, alt: /Alternierend/ }[t.goal as "stat" | "block" | "alt"];
    assert.match(trap!.why, want, `${t.goal}: ${trap!.why}`);
  }
});

test("Kunststoffart: Stolperstein nach dem Paar (richtig, gewählt)", () => {
  const table: [Parameters<typeof klMiss>[0], Parameters<typeof klMiss>[1], string][] = [
    ["elast", "duro", "elast-duro"], ["duro", "elast", "elast-duro"], ["thermo", "elast", "elast-thermo"], ["elast", "thermo", "elast-thermo"],
    ["duro", "thermo", "netz-schmilzt"], ["thermo", "duro", "thermo-duro"],
  ];
  for (const [r, c, want] of table) { assert.strictEqual(klMiss(r, c), want, `${r}/${c}`); assert.ok(MISS[want]); }
  // in den Aufgaben: Gummiband → Duroplast ergibt „Elastomer und Duroplast verwechselt“
  for (let k = 0; k < 80; k++) {
    const t = GENERATORS.klasseAlltag();
    if (isTap(t) || isOrder(t) || isBuild(t) || !/Gummiband/.test(t.prompt)) continue;
    const i = t.options.indexOf("Duroplast");
    assert.strictEqual(t.miss?.[i], "elast-duro");
    return;
  }
});

test("Merksatz vor der Aufgabe verrät die Antwort nicht (kein Wort der richtigen Antwort im Lead)", () => {
  const STOP = new Set(["eine", "einer", "einen", "einem", "der", "die", "das", "den", "dem", "des", "und", "mit", "ohne", "nicht", "kein", "keine", "wird", "werden", "sich", "nur", "sind", "ist", "aus", "zur", "zum", "von", "beim", "alle", "jede", "jeder", "mehr", "aber", "dann", "noch", "auch"]);
  const words = (x: string) => x.replace(/\*\*|⁠/g, "").toLowerCase().split(/[^\p{L}\p{N}₀-₉-]+/u).filter(w => w.length >= 4 && !STOP.has(w));
  const bad = new Set<string>();
  for (let lv = 0; lv < LEVELS.length; lv++) for (let k = 0; k < 30; k++) for (const t of makeRound("us", lv)) {
    if (!t.lead || isTap(t) || isOrder(t) || isBuild(t)) continue;
    const lead = new Set(words(t.lead));
    for (const w of words(t.options[t.answer])) if (lead.has(w)) bad.add(`${LEVELS[lv].id} ${t.type}: „${w}“ in „${t.lead}“`);
  }
  assert.deepEqual([...bad], []);
}, 60_000);

test("Gelöstes Beispiel unterscheidet sich von der folgenden Aufgabe (Frage, Antworten, Bild)", async () => {
  const { withExamples } = await import("@lern/quiz");
  // gleich = gleiche Frage mit gleichem Bild (andere Antwortauswahl reicht nicht: es wäre dasselbe Monomer)
  const sig = (t: Task) => t.prompt + (isBuild(t) ? JSON.stringify(t.pool) + t.goal : isOrder(t) ? JSON.stringify(t.cards) : isTap(t) ? JSON.stringify(t.scene) : JSON.stringify(t.vis ?? null) + t.options[t.answer]);
  const bad: string[] = [];
  for (let lv = 0; lv < LEVELS.length; lv++) for (let k = 0; k < 40; k++) {
    const r = withExamples(makeRound("us", lv), {}, () => makeRound("us", lv), sameTask);
    r.forEach((t, i) => { if (t.stage === "worked" && r[i + 1] && sig(t) === sig(r[i + 1])) bad.push(`${LEVELS[lv].id} ${t.type}: ${t.prompt.slice(0, 60)}`); });
  }
  assert.deepEqual([...new Set(bad)], []);
}, 60_000);

test("Schwächen üben: alle schwachen Fertigkeiten, je höchstens zweimal, keine Frage doppelt", () => {
  const ids = ["polyName", "doppelbindung", "radikal", "pfeil", "katalysator", "gruppen", "urethan", "klasse"];
  const stats = Object.fromEntries(ids.map(id => [id, { right: 1, wrong: 2 }]));
  for (let k = 0; k < 20; k++) {
    const r = makeRound("us", "weak", stats);
    const n = new Map<string, number>();
    for (const t of r) n.set(t.type!, (n.get(t.type!) ?? 0) + 1);
    assert.ok(n.size >= 5, `nur ${n.size} Fertigkeiten`);
    assert.ok([...n.values()].every(x => x <= 2));
  }
  const few = makeRound("us", "weak", { polyName: { right: 0, wrong: 3 } });
  assert.ok(few.length <= 2);
});
