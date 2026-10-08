import { test, assert } from "vitest";
import { GENS, makeRound, LEVELS, TYPE_NAMES, distinctColors, type Pic, type Task } from "./tasks.ts";
import { K5_METHODS, PART_NAME } from "./trennen.ts";
import { METHODS, METHOD_NAME } from "../components/Separation.tsx";
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
      if (lattice && /nicht (miteinander )?verbunden|einzelne Atome/.test(w)) bad.add(`${t.type}: ${w}`);
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
  const names = new Set([...METHODS.map(METHOD_NAME), "Lösen"]);
  for (let k = 0; k < 200; k++) {
    const t = GENS.trennReihe();
    if (t.kind === "mc") for (const o of t.options) for (const s of o.split(" → ")) assert.ok(names.has(s), `${s} in ${o}`);
  }
});

test("Frage und Lösungsweg beginnen groß", () => {
  for (const t of [...all("mix", 200), ...chapters(20).flat()]) {
    for (const x of [t.prompt, t.explain]) assert.ok(!/^[a-zäöüß]/.test(x.replace(/^\*+/, "")), x);
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
