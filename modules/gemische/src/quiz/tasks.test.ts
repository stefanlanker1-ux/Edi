import { test, assert } from "vitest";
import { GENS, makeRound, LEVELS, TYPE_NAMES, distinctColors, type Pic, type Task } from "./tasks.ts";
import { K5_METHODS, PART_NAME } from "./trennen.ts";
import { METHODS, METHOD_NAME } from "../components/Separation.tsx";
import { MISS } from "./misconceptions.ts";
import { analyse, isElement, pictureKind, PICTURE_LABEL } from "../mixtures.ts";
import { gridFor, initial, seedOf } from "../mixing.ts";
import { LESSONS } from "../lessons.tsx";

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
  assert.strictEqual(LEVELS.length, 6);
});

test("Moleküle aus nur einer Atomsorte nur in der Aufgabe „Element oder Verbindung“ (O₂, N₂ mit Falle element-molekuel), sonst nie", () => {
  let seen = 0;
  for (const t of all("mix", 200)) {
    const allowed = t.type === "einordnen";
    for (const p of picsOf(t)) for (const [f] of p.mix) {
      if (allowed && ["O2", "N2"].includes(f)) { seen++; assert.ok(t.kind === "mc" && Object.values(t.miss ?? {}).includes("element-molekuel"), "Falle fehlt"); continue; }
      assert.ok(!isElement(f) || !/\d/.test(f), `${t.type}: ${f}`);
    }
    if (!allowed) assert.ok(!/(^|[^A-Za-z₀-₉])(O₂|O₃|N₂|H₂|Cl₂)(?![A-Za-z₀-₉])/.test(t.prompt + (t.kind === "mc" ? t.options.join() : "")), t.prompt);
  }
  assert.ok(seen > 0, "O₂/N₂-Variante kommt nie vor");
  // in Kapitel 2 mindestens einmal je drei Runden (im Mittel; tatsächlich etwa 43 %) – 600 Runden, damit Zufall den Test nicht kippt
  let rounds = 0, hit = 0;
  for (let k = 0; k < 600; k++) { rounds++; if (makeRound("us", 1).some(t => t.type === "einordnen" && t.pic?.mix.some(([f]) => ["O2", "N2"].includes(f)))) hit++; }
  assert.ok(hit / rounds > 1 / 3, `${hit} von ${rounds}`);
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
    const min = ["gm-k5", "gm-k6"].includes(LEVELS[lv].id) ? 25 : 80;
    assert.ok(keys.size >= min, `${LEVELS[lv].name}: nur ${keys.size} verschiedene Aufgaben`);
  }
});

test("keine zwei Atomsorten mit ähnlicher Farbe in einer Aufgabe (z. B. He und Ne, Cu und Fe)", () => {
  for (const t of all("mix", 300)) assert.ok(distinctColors(t), `${t.type}: ${JSON.stringify(t.pic ?? t.pics)}`);
}, 60_000);

test("Kapitel 1–6: feste Reihenfolge, Merksatz je Aufgabe, keine Frage doppelt, Tipp zugeschnitten", () => {
  assert.deepEqual(LEVELS.map(l => l.name), ["Teilchen und Atomsorten", "Elemente und Verbindungen", "Reinstoffe und Gemische", "Gemische im Alltag", "Trennen nach Größe, Magnet, Dichte", "Lösungen trennen"]);
  for (let lv = 0; lv < LEVELS.length; lv++) {
    const L = LEVELS[lv];
    assert.strictEqual(L.seq.length, 10);
    assert.strictEqual(L.leads.length, 10);
    assert.strictEqual(new Set(L.leads).size, 10, `${L.name}: Merksätze doppelt`);
    for (let r = 0; r < 60; r++) {
      const round = makeRound("us", lv);
      assert.deepEqual(round.map(t => t.type), L.seq);
      // Merksatz des Platzes – außer die Variante bringt ihren eigenen mit (Bild nach dem Mischen, Trennverfahren mit Ziel)
      round.forEach((t, i) => { assert.ok(t.lead, `${L.name} ${i}: Merksatz fehlt`); if (!["nachher", "trennWahl", "loesWahl"].includes(t.type!)) assert.strictEqual(t.lead, L.leads[i]); });
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

test("Art des Gemischs: das Antwortwort steht nicht im Namen des Beispiels (sonst ohne Nachdenken lösbar)", () => {
  const bad = new Set<string>();
  for (let k = 0; k < 400; k++) {
    const t = GENS.gemischart();
    if (t.kind !== "mc") continue;
    const name = (t.prompt.match(/\*\*(.+?)\*\*/)?.[1] ?? "").toLowerCase().split(/[^\p{L}]+/u);
    if (name.includes(t.options[t.answer].toLowerCase())) bad.add(t.prompt);
  }
  assert.deepEqual([...bad], []);
});

// ── Prüfungen gegen gefundene Fehlerarten (Bild ↔ Text, Stolperstein ↔ Antwort, Begriffe, Tipps) ──

/** alle Texte, die Lernende zu einer Aufgabe lesen (ohne Bild-Schlüssel) */
const textsOf = (t: Task) => [t.prompt, t.hint, t.explain, t.lead ?? "", t.praise ?? "", ...(t.kind === "mc" && !t.pics ? t.options : []),
  ...(t.kind === "mc" ? Object.values(t.why ?? {}) : []), ...(t.traps ?? []).map(x => x.why)];
const chapters = (rounds: number) => LEVELS.map((_, lv) => Array.from({ length: rounds }, () => makeRound("us", lv)).flat());

test("Reihenfolge der Trennschritte: das Bild zeigt die Stoffe der Frage (mit Eisen: Eisen im Bild)", () => {
  let iron = 0;
  for (let k = 0; k < 200; k++) {
    const t = GENS.trennReihe();
    const withIron = /Eisen/.test(t.prompt);
    if (withIron) iron++;
    assert.strictEqual(t.mixPic, withIron ? "eisensalzsand" : "salzsand", t.prompt);
  }
  assert.ok(iron > 0, "Variante mit Eisen kommt nie vor");
});

test("Rückmeldungen passen zum Bild: Metallatome im Gitter sind verbunden, einzelne Atome sind keine Moleküle", () => {
  const bad = new Set<string>();
  let alloys = 0;
  for (const t of all("mix", 300)) {
    if (t.kind !== "mc") continue;
    for (const [i, w] of Object.entries(t.why ?? {})) {
      const p = t.pics?.[t.options[Number(i)]] ?? t.pic;
      if (!p) continue;
      const lattice = p.state === "fest" && p.mix.length > 1;
      if (lattice) alloys++;
      if (lattice && /nicht (miteinander )?verbunden|einzeln/.test(w)) bad.add(`${t.type}: ${w}`);
    }
    if (t.pic && t.pic.state !== "fest" && t.pic.mix.some(([f]) => isElement(f))) {
      for (const o of t.options) if (/Moleküle/.test(o)) bad.add(`${t.type}: Antwort „${o}“ bei einzelnen Atomen`);
      for (const w of Object.values(t.why ?? {})) if (/Die Moleküle sind/.test(w)) bad.add(`${t.type}: ${w}`);
    }
  }
  assert.ok(alloys > 0, "kein Legierungsbild geprüft");
  assert.deepEqual([...bad], []);
});

test("Stolpersteine passen zur gewählten Antwort (z. B. Legierung für Gemenge gehalten ≠ „fein verteilt für homogen“)", () => {
  const PURE = /^(Reinstoff|Element|Verbindung)/;
  const HOM = new Set(["homogenes Gemisch", "Lösung", "Legierung", "Gasgemisch"]);
  const HET = new Set(["heterogenes Gemisch", "Suspension", "Emulsion", "Schaum", "Nebel", "Rauch", "Gemenge"]);
  const fits: Record<string, (o: string) => boolean> = {
    "klar-reinstoff": o => PURE.test(o), "nur-elemente-rein": o => PURE.test(o), "alltag-rein": o => PURE.test(o),
    "sieht-einheitlich": o => HOM.has(o), "entmischt-homogen": o => HOM.has(o), "geloest-heterogen": o => HET.has(o),
    "legierung-gemenge": o => o === "Gemenge" || o === "Legierung",
    "verbindung-gemisch": o => /Gemisch/.test(o), "gemisch-verbindung": o => /Verbindung/.test(o), "legierung-verbindung": o => /Verbindung/.test(o),
    "element-verbindung": o => /Verbindung/.test(o), "verbindung-element": o => /Element/.test(o),
  };
  const bad = new Set<string>();
  for (const t of all("mix", 300)) {
    if (t.kind !== "mc" || t.pics) continue;
    for (const [i, m] of Object.entries(t.miss ?? {})) {
      const o = t.options[Number(i)];
      if (fits[m] && !/^\d+$/.test(o) && !fits[m](o)) bad.add(`${t.type} ${m}: „${o}“ (${t.prompt})`);
    }
  }
  // Bild nach dem Mischen: „verschwindet“ nur, wenn der Stoff im Bild fehlt; nie „sieht einheitlich aus“
  for (let k = 0; k < 300; k++) {
    const t = GENS.nachher();
    if (t.kind !== "mc" || !t.pics) continue;
    for (const [i, m] of Object.entries(t.miss ?? {})) {
      const p = t.pics[t.options[Number(i)]];
      if (m === "verschwindet" && p.mix.length > 1) bad.add(`nachher verschwindet: ${t.options[Number(i)]}`);
      if (m === "sieht-einheitlich") bad.add(`nachher sieht-einheitlich: ${t.prompt}`);
    }
  }
  assert.deepEqual([...bad], []);
});

test("Sprudelwasser nicht im Üben (ein Teil des CO₂ reagiert zu Kohlensäure)", () => {
  for (const t of [...all("mix", 200), ...chapters(20).flat()]) {
    assert.ok(!textsOf(t).some(x => /Sprudel|Kohlensäure/.test(x)), t.prompt);
    assert.ok(!picsOf(t).some(p => p.before === "gasraum"), t.prompt);
  }
});

test("Tipps zu Formeln: Atomsorten zählen, nicht Großbuchstaben (C₂H₅OH: vier Großbuchstaben, drei Atomsorten)", () => {
  const bad = /jeder Großbuchstabe ist|Großbuchstaben zählst|each capital letter is|capital letters do you count/i;
  for (const l of LEVELS) for (const lead of l.leads) assert.ok(!bad.test(lead), lead);
  for (const [id, g] of Object.entries(GENS)) for (let k = 0; k < 40; k++) {
    const t = g() as Task & { tip?: string };
    for (const x of [t.hint, t.tip ?? ""]) assert.ok(!bad.test(x), `${id}: ${x}`);
  }
});

test("Art des Gemischs: eindeutige Beispiele – nichts mit Milch oder Sahne (Emulsion), wenn „Emulsion“ falsch ist", () => {
  for (let k = 0; k < 400; k++) {
    const t = GENS.gemischart();
    if (t.kind !== "mc") continue;
    const name = t.prompt.match(/\*\*(.+?)\*\*/)?.[1] ?? "";
    if (t.options[t.answer] !== "Emulsion") assert.ok(!/sahne|milch|kakao/i.test(name), name);
  }
});

test("Trennverfahren wählen: Rückmeldungen mit „behalten“ oder „verloren“ nur, wenn die Frage ein Ziel nennt", () => {
  for (const g of [GENS.trennWahl, GENS.loesWahl]) for (let k = 0; k < 200; k++) {
    const t = g();
    if (t.kind !== "mc") continue;
    if (Object.values(t.why ?? {}).some(w => /behalten|verloren|gewinnen/.test(w))) assert.ok(/Ziel:/.test(t.prompt), t.prompt);
  }
});

test("„Rein“ im Alltag: Reinstoff nur bei eindeutigen Beispielen (keine Begründung mit „fast“ oder „so gut wie“)", () => {
  for (let k = 0; k < 300; k++) {
    const t = GENS.reinAlltag();
    if (t.kind === "mc" && t.options[t.answer] === "Reinstoff") assert.ok(!/fast|so gut wie/.test(t.explain), t.explain);
  }
});

test("Kapitel 5: falsche Verfahren nur aus Kapitel 5 (Eindampfen, Destillieren, Chromatografie erst in Kapitel 6)", () => {
  const k5 = new Set(K5_METHODS.map(METHOD_NAME));
  for (let r = 0; r < 100; r++) for (const t of makeRound("us", 4)) {
    if (t.type === "trennWahl" && t.kind === "mc") for (const o of t.options) assert.ok(k5.has(o), `${t.prompt}: ${o}`);
  }
  for (let k = 0; k < 200; k++) {
    const t = GENS.trennWahl();
    if (t.kind === "mc") assert.ok(t.options.length >= 3 && t.options.every(o => k5.has(o)), t.prompt);
  }
});

test("Begriffe erst ab dem Kapitel, das sie einführt (z. B. „Legierung“ erst ab Kapitel 4, „Gitter“ ab Kapitel 2)", () => {
  // Kapitel (Index), ab dem ein Begriff vorkommen darf; „Gemisch“ ist der Name des Moduls und steht schon in Kapitel 2 zur Wahl
  const FROM: [number, RegExp][] = [
    [1, /\b(Elemente?n?|Verbindung(en)?|Gitter)\b/],
    [2, /\b(Reinstoffe?|homogene?[sn]?|heterogene?[sn]?|Lösung)\b/],
    [3, /\b(Legierung|Gemenge|Suspension|Emulsion|Schaum|Rauch|Nebel)\b/],
    [4, /\b(Magnet­?trennung|Sieben|Auslesen|Dekantieren|Filtrieren|Filtrat|Rückstand|Bodensatz|Dichte)\b/],
    [5, /\b(Eindampfen|Destillieren|Destillat|Chromato­?grafie|Siedetemperatur|Kühler|Vorlage|Laufmittel)\b/],
  ];
  const bad = new Set<string>();
  chapters(30).forEach((round, lv) => {
    for (const t of round) for (const x of textsOf(t)) for (const [from, re] of FROM) {
      if (lv < from && re.test(x)) bad.add(`${LEVELS[lv].id} ${t.type}: „${x.match(re)![0]}“ in „${x}“`);
    }
  });
  assert.deepEqual([...bad], []);
}, 60_000);

test("Tipps zu „Nach dem Mischen“ sind Fragen (Denkschritt), keine Lösungssätze", () => {
  for (let r = 0; r < 60; r++) for (const t of makeRound("us", 2)) if (t.type === "nachher") assert.ok(/\?$/.test(t.hint.trim()), t.hint);
});

test("Merksatz des Platzes passt zu jeder Variante (kein Kristall bei Alkohol, kein Metallgitter ohne Metall, kein Rühren ohne Rühren)", () => {
  chapters(60).forEach(round => {
    for (const t of round) {
      if (!t.lead) continue;
      const pics = picsOf(t);
      if (/Kristall/.test(t.lead)) assert.ok(pics.some(p => p.before === "kristall") || /Kristall/.test(t.prompt), `${t.lead} – ${t.prompt}`);
      if (/Metallgitter/.test(t.lead)) assert.ok(pics.some(p => p.state === "fest"), `${t.lead} – ${t.prompt}`);
      if (/Rühren/.test(t.lead)) assert.ok(/Rühren/.test(t.prompt), `${t.lead} – ${t.prompt}`);
    }
  });
}, 60_000);

test("Trennverfahren wählen: eigener Merksatz nur mit Ziel, sonst der des Platzes", () => {
  for (const lv of [4, 5]) for (let r = 0; r < 60; r++) makeRound("us", lv).forEach((t, i) => {
    if (t.type !== "trennWahl" && t.type !== "loesWahl") return;
    assert.strictEqual(t.lead, /Ziel:/.test(t.prompt) ? "Was willst du am Ende behalten?" : LEVELS[lv].leads[i], t.prompt);
  });
});

test("Homogen oder heterogen: Tipp bei Reinstoffen ohne „im Glas vorstellen“", () => {
  for (let r = 0; r < 200; r++) for (const t of makeRound("us", 2)) {
    if (t.type === "homogenBild" && t.kind === "mc" && t.options[t.answer] === "Reinstoff") assert.ok(!/im Glas/.test(t.hint), t.hint);
  }
});

test("Reihenfolge der Trennschritte: Schritte heißen wie die Verfahren (Magnettrennung, nicht „Magnet“)", () => {
  const names = new Set([...METHODS.map(m => METHOD_NAME(m).replace(/\u00ad/g, "")), "Lösen"]);
  for (let k = 0; k < 200; k++) {
    const t = GENS.trennReihe();
    if (t.kind === "mc") for (const o of t.options) for (const s of o.split(" → ")) assert.ok(names.has(s), `${s} in ${o}`);
  }
});

test("Frage und Lösungsweg beginnen groß", () => {
  for (const t of [...all("mix", 200), ...chapters(20).flat()]) {
    for (const x of [t.prompt, t.explain]) assert.ok(!/^[a-zäöüß]/.test(x.replace(/^[*„“"”]+/, "")), x);
  }
});

test("Masse beim Lösen: Auswahl aufsteigend", () => {
  for (let k = 0; k < 200; k++) {
    const t = GENS.masse();
    if (t.kind !== "mc") continue;
    const ns = t.options.map(o => parseFloat(o));
    assert.deepEqual(ns, [...ns].sort((a, b) => a - b), t.options.join(", "));
  }
});

// ── Runde 2: Gitterbilder, Rückmeldung zu jeder falschen Antwort, Begriffe aus den Lektionen, kurze Tipps ──

/** Zink im Gitterbild, so gezeichnet wie im Quiz (gleicher Startwert wie PicBeaker) */
function zincOf(p: Pic) {
  const s = initial({ items: p.mix, state: p.state, floats: p.floats, before: p.before, solute: p.solute }, seedOf(JSON.stringify(p)), p.arrange ?? "nachher");
  const g = s.grid, at = (f: string) => s.ps.filter(x => x.f === f).map(x => [x.cell % g.cols, Math.floor(x.cell / g.cols)] as [number, number]);
  return { g, zn: at("Zn"), cu: at("Cu") };
}
const key = (xs: [number, number][]) => xs.map(([c, r]) => `${c},${r}`).sort().join(" ");
/** Zink auf einem regelmäßigen Untergitter (jede sx-te Spalte in jeder sy-ten Reihe) */
function regular({ g, zn }: ReturnType<typeof zincOf>) {
  for (let sx = 1; sx <= 3; sx++) for (let sy = 1; sy <= 3; sy++) for (let ox = 0; ox < sx; ox++) for (let oy = 0; oy < sy; oy++) {
    const want: [number, number][] = [];
    for (let c = 0; c < g.cols; c++) for (let r = 0; r < g.rows; r++) if (c % sx === ox && r % sy === oy) want.push([c, r]);
    if (key(want) === key(zn)) return true;
  }
  return false;
}
/** zufällig aussehend: keine ganze Zn-Reihe oder -Spalte, nicht gespiegelt oder gedreht gleich, kein Muster, nicht ein zusammenhängender Block */
function irregular(z: ReturnType<typeof zincOf>) {
  const { g, zn } = z, k = key(zn);
  const fullRow = [...Array(g.rows).keys()].some(r => zn.filter(([, y]) => y === r).length === g.cols);
  const fullCol = [...Array(g.cols).keys()].some(c => zn.filter(([x]) => x === c).length === g.rows);
  const mirror = key(zn.map(([c, r]) => [g.cols - 1 - c, r])) === k || key(zn.map(([c, r]) => [c, g.rows - 1 - r])) === k || key(zn.map(([c, r]) => [g.cols - 1 - c, g.rows - 1 - r])) === k;
  const seen = new Set([`${zn[0][0]},${zn[0][1]}`]), todo = [zn[0]];
  while (todo.length) { const [c, r] = todo.pop()!; for (const [x, y] of zn) if (!seen.has(`${x},${y}`) && Math.abs(x - c) + Math.abs(y - r) === 1) { seen.add(`${x},${y}`); todo.push([x, y]); } }
  return !fullRow && !fullCol && !mirror && !regular(z) && seen.size < zn.length;
}

test("Messing nach dem Erstarren: 12 Atome; „abwechselnd“ ist ein festes Muster, „getrennt“ zwei Blöcke, das richtige Bild sichtbar zufällig", () => {
  let seen = 0;
  for (let k = 0; k < 200; k++) {
    const t = GENS.nachher();
    if (t.kind !== "mc" || !t.pics || !/Messing/.test(t.prompt)) continue;
    seen++;
    for (const [o, p] of Object.entries(t.pics)) {
      assert.strictEqual(analyse(p.mix).teilchen, 12, o);
      const z = zincOf(p);
      if (p.arrange === "abwechselnd") assert.ok(regular(z), `kein Muster: ${o}`);
      else if (p.arrange === "getrennt") assert.ok(Math.max(...z.cu.map(([c]) => c)) <= Math.min(...z.zn.map(([c]) => c)), `nicht getrennt: ${o}`);
      else assert.ok(irregular(z), `richtiges Bild wirkt geordnet: ${o}`);
    }
  }
  assert.ok(seen > 0);
});

test("Legierungsbilder: 12 Atome, Kupfer mit 3–4 Zink, jede mögliche Anordnung sichtbar zufällig", () => {
  const bad = new Set<string>();
  let n = 0;
  for (const t of all("mix", 300)) for (const p of picsOf(t)) {
    if (p.state !== "fest" || p.mix.length < 2) continue;
    n++;
    const a = analyse(p.mix), zn = p.mix.find(([f]) => f === "Zn")?.[1] ?? 0;
    // erzeugte Legierungsbilder (ohne Anordnung); Messing aus „Experimentieren“ hat 12 : 6 Atome
    if (!p.arrange && (a.teilchen !== 12 || zn < 3 || zn > 4 || !p.mix.some(([f]) => f === "Cu"))) bad.add(JSON.stringify(p.mix));
    if ((p.arrange ?? "nachher") === "nachher" && !irregular(zincOf(p))) bad.add(`geordnet: ${JSON.stringify(p)}`);
  }
  assert.ok(n > 0, "kein Legierungsbild");
  assert.deepEqual([...bad], []);
});

test("Kapitel 1: keine Metallgitter (der Begriff „Gitter“ kommt erst in Kapitel 2)", () => {
  for (const t of chapters(60)[0]) for (const p of picsOf(t)) assert.notStrictEqual(p.state, "fest", `${t.type}: ${JSON.stringify(p.mix)}`);
  for (const id of ["teilchen", "stoffe", "atomsorten", "zwischen"]) for (let k = 0; k < 100; k++) for (const p of picsOf(GENS[id]())) assert.notStrictEqual(p.state, "fest", id);
});

test("Jede falsche Antwort hat eine eigene Rückmeldung (auch Nachbarzahlen und zufällige Ablenker)", () => {
  const bad = new Set<string>();
  for (const t of [...all("mix", 200), ...chapters(30).flat()]) {
    if (t.kind !== "mc") continue;
    t.options.forEach((o, i) => { if (i !== t.answer && !(t.why?.[i] ?? "").trim()) bad.add(`${t.type}: „${o}“ (${t.prompt})`); });
  }
  assert.deepEqual([...bad].slice(0, 20), []);
}, 60_000);

test("Stolpersteine gehen nie zugunsten allgemeiner Rückmeldungen verloren (Fallen stehen immer zur Wahl)", () => {
  for (let k = 0; k < 300; k++) {
    const t = GENS.teilchen();
    if (t.kind !== "mc") continue;
    const a = analyse(t.pic!.mix);
    for (const v of [a.atome, a.stoffe.length]) if (v !== a.teilchen) assert.ok(t.options.includes(String(v)), `${v} fehlt: ${t.options}`);
  }
  for (let k = 0; k < 300; k++) {
    const t = GENS.gemischart();
    if (t.kind === "mc") assert.ok(Object.keys(t.miss ?? {}).length >= 1, t.prompt);
  }
});

test("Begriffe der Aufgaben stehen in einer Lektion bis zu diesem Kapitel fett (die Erklärkarte erscheint dort nicht von selbst)", () => {
  const TERMS = ["Molekül", "Atomsorte", "Element", "Verbindung", "Gitter", "Zahlenverhältnis", "Reinstoff", "homogen", "heterogen", "Lösung", "Legierung", "Gemenge",
    "Suspension", "Emulsion", "Schaum", "Rauch", "Nebel", "Gasgemisch", "Magnettrennung", "Sieben", "Auslesen", "Dekantieren", "Filtrieren", "Filtrat", "Rückstand",
    "Bodensatz", "Dichte", "Eindampfen", "Destillieren", "Destillat", "Chromatografie", "Siedetemperatur", "Kühler", "Vorlage", "Laufmittel"];
  const boldIn = (lv: number) => LESSONS.slice(0, lv + 1).flatMap(l => l.steps).flatMap(st => [st.say, st.ask, ...(st.lines ?? []), st.ok, st.tip, st.show, ...Object.values(st.why ?? {})])
    .flatMap(x => [...(x ?? "").matchAll(/\*\*(.+?)\*\*/g)].map(m => m[1].replace(/­/g, "").toLowerCase()));
  const bad = new Set<string>();
  chapters(30).forEach((round, lv) => {
    const bold = boldIn(lv);
    for (const t of round) for (const x of textsOf(t)) for (const term of TERMS) {
      if (!new RegExp(`\\b${term}`, "i").test(x.replace(/­/g, ""))) continue;
      if (!bold.some(b => b.includes(term.toLowerCase()) || term.toLowerCase().startsWith(b))) bad.add(`${LEVELS[lv].id}: ${term} (${t.type})`);
    }
  });
  assert.deepEqual([...bad], []);
}, 60_000);

test("Tipps im Kapitel passen ins Tippfeld (höchstens 85 Zeichen)", () => {
  const bad = new Set<string>();
  for (const round of chapters(30)) for (const t of round) if (t.hint.replace(/\*\*/g, "").length > 85) bad.add(`${t.type}: ${t.hint}`);
  assert.deepEqual([...bad], []);
}, 60_000);

test("Bilder nach dem Mischen: jedes Bild mit Anordnung in Worten (sonst verriete das Vorlesen das richtige)", () => {
  for (let k = 0; k < 200; k++) {
    const t = GENS.nachher();
    if (t.kind === "mc") for (const o of t.options) assert.ok(/ – \S/.test(o), o);
  }
});

// ── Runde 3: Tipps ohne Antwort, Beispiele ohne Antwort-Muster, Löslichkeit, Begriffe, Grammatik ──

test("Stoffe im Alltag: derselbe Tipp für Element, Verbindung und Gemisch (nur „mit Formel“ oder „ohne“ unterscheidet sich)", () => {
  const tips = new Map<string, Set<string>>(), kinds = new Map<string, Set<string>>();
  for (let k = 0; k < 600; k++) {
    const t = GENS.alltag() as Task & { tip?: string };
    if (t.kind !== "mc") continue;
    const key = /\(.*[A-Z].*\)/.test(t.prompt) ? "Formel" : "ohne";
    if (!tips.has(key)) { tips.set(key, new Set()); kinds.set(key, new Set()); }
    tips.get(key)!.add(t.tip!);
    kinds.get(key)!.add(t.options[t.answer]);
  }
  for (const [k, v] of tips) assert.strictEqual(v.size, 1, `${k}: ${[...v].join(" | ")}`);
  // ohne Formel kommen alle drei Antworten vor – der Tipp verrät also nichts
  assert.strictEqual(kinds.get("ohne")!.size, 3);
  // kein „reiner Alkohol“ als Reinstoff (handelsüblich etwa 96 %)
  for (let k = 0; k < 300; k++) assert.ok(!/reiner Alkohol/.test(GENS.alltag().prompt));
});

test("Homogen oder heterogen: ein Tipp für alle Beispiele; „Klar heißt nicht rein“ und „Sieht einheitlich aus“ mit wechselnden Antworten", () => {
  for (const id of ["homogenBild", "homogenKlar", "homogenSieht"]) {
    const tips = new Set<string>(), answers = new Set<string>();
    for (let k = 0; k < 400; k++) {
      const t = GENS[id]() as Task & { tip?: string };
      if (t.kind !== "mc") continue;
      tips.add(t.tip!);
      answers.add(t.options[t.answer]);
    }
    assert.strictEqual(tips.size, 1, `${id}: ${[...tips].join(" | ")}`);
    assert.strictEqual(answers.size, 3, `${id}: nur ${[...answers]}`);
  }
});

test("Masse beim Lösen: nie mehr Salz, als sich in dem Wasser löst (etwa 36 g in 100 g Wasser)", () => {
  let salt = 0;
  for (let k = 0; k < 600; k++) {
    const t = GENS.masse();
    if (!/Salz/.test(t.prompt)) continue;
    salt++;
    const [w, z] = [...t.prompt.matchAll(/\*\*(\d+) g\*\*/g)].map(m => Number(m[1]));
    assert.ok(z <= .36 * w, t.prompt);
  }
  assert.ok(salt > 0);
});

test("Sterlingsilber: eigene Rückmeldung (Silber und Kupfer, frei wählbare Anteile) – kein „Rein heißt im Alltag“", () => {
  let n = 0;
  for (let k = 0; k < 600; k++) {
    const t = GENS.reinAlltag();
    if (t.kind !== "mc" || !/Sterling/.test(t.prompt)) continue;
    n++;
    assert.ok(/^Auf einem Ring steht/.test(t.prompt), t.prompt);
    for (const w of Object.values(t.why ?? {})) assert.ok(!/„Rein“/.test(w), w);
    assert.ok(Object.values(t.why ?? {}).some(w => /Kupfer/.test(w) && /Zahlenverhältnis/.test(w)), "Verbindung: Zahlenverhältnis fehlt");
  }
  assert.ok(n > 0);
});

test("Teilchen und Stoff in Kapitel 1: keine Metalle und keine Metallfarben; „Eigenschaften des Stoffs“ in Lektion 1 fett eingeführt", () => {
  let n = 0;
  for (const t of chapters(40)[0]) if (t.type === "farbe") { n++; for (const x of textsOf(t)) assert.ok(!/Kupfer|Messing|Zink|Orange|blaugrau/.test(x), x); }
  assert.ok(n > 0);
  const k1 = LESSONS[0].steps.flatMap(st => [st.say, ...(st.lines ?? [])]).join(" ");
  assert.ok(/\*\*Eigenschaften des Stoffs\*\*/.test(k1), "Begriff fehlt in Lektion 1");
});

test("Nach dem Mischen, Messing: Lösungsweg „zufällig verteilt“ (nicht „gleichmäßig“), Rückmeldungen kurz", () => {
  let n = 0;
  for (let k = 0; k < 300; k++) {
    const t = GENS.nachher();
    if (!/Messing/.test(t.prompt)) continue;
    n++;
    assert.ok(/zufällig/.test(t.explain) && !/gleichmäßig/.test(t.explain), t.explain);
    for (const w of t.kind === "mc" ? Object.values(t.why ?? {}) : []) assert.ok(w.length <= 90, w);
  }
  assert.ok(n > 0);
});

test("Atome im Teilchen: „hat ein Atom“ / „hat 4 Atome“, „aus einem Atom“ / „aus 4 Atomen“", () => {
  for (let k = 0; k < 300; k++) {
    const t = GENS.tippAtome();
    assert.ok(/ hat \*\*(ein Atom|\d+ Atome)\*\*\./.test(t.explain), t.explain);
    assert.ok(/aus \*\*(einem Atom|\d+ Atomen)\*\*/.test(t.prompt), t.prompt);
  }
});

test("Lektion 1, Atomsorten zählen: jede falsche Antwort ist ein echter Zählfehler (Teilchen, Teilchensorten oder Atome)", () => {
  const step = LESSONS[0].steps.find(st => st.mode === "faded" && /Atomsorten/.test(st.ask ?? "") && st.visual)!;
  const el = step.visual!({ pick: () => {}, show: false, solved: false } as never) as { props: { p: Pic } };
  const a = analyse(el.props.p.mix);
  for (const o of step.options ?? []) if (o !== step.answer) assert.ok([a.teilchen, a.stoffe.length, a.atome].includes(Number(o)), `„${o}“ ist kein Zählfehler`);
});

test("Lektion 6: Alkohol und Wasser mit Heizhaube (Knopf „Heizen an“, Begriff eingeführt), kein Brenner", () => {
  const steps = LESSONS[5].steps.filter(st => /Alkohol/.test(`${st.say ?? ""} ${st.ask ?? ""}`) && st.visual);
  let device = 0;
  for (const st of steps) {
    const el = st.visual!({ pick: () => {}, show: false, solved: false } as never) as { props: { alk?: boolean; start?: string } };
    if (el.props.alk && el.props.start) { device++; assert.strictEqual(el.props.start, "Heizen an"); }
    assert.ok(!/Brenner/.test(`${st.say ?? ""} ${st.ask ?? ""} ${(st.lines ?? []).join(" ")}`), st.ask);
  }
  assert.strictEqual(device, 1);
  assert.ok(steps.some(st => /\*\*Heizhaube\*\*/.test(st.say ?? "")));
});

test("Metallgitter ohne Lücke: Messing-Beispiel (18 Atome) und alle Gitter im Quiz füllen ihr Raster", () => {
  for (const n of [6, 8, 12, 18, 180]) { const g = gridFor(n, "fest"); assert.strictEqual(g.cols * g.rows, n, `${n}: ${g.cols} × ${g.rows}`); }
  for (const t of all("mix", 200)) for (const p of picsOf(t)) if (p.state === "fest") {
    const g = gridFor(analyse(p.mix).teilchen, "fest");
    assert.strictEqual(g.cols * g.rows, analyse(p.mix).teilchen, JSON.stringify(p.mix));
  }
});
