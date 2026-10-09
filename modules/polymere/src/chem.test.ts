import { test, assert } from "vitest";

import { METHODS, STEPS, VINYLS, stepMono, vinyl, type MethodId, type StepId, type VinylId } from "./chem/data.ts";
import { compat, polymerise, stepReact } from "./chem/rules.ts";
import { makeMech, nextAuto, replay } from "./chem/mech/index.ts";
import type { Recipe } from "./chem/mech/types.ts";
import { Reactor } from "./chem/reactor.ts";
import { anchorPt } from "./chem/scene.ts";

const METHOD_IDS = METHODS.map(m => m.id);

test("Monomere: Buchstabe, Farbe, Halbstrukturformel mit reagierendem Teil", () => {
  for (const m of [...VINYLS, ...STEPS]) {
    assert.ok(m.letter && m.letter.length <= 2, `${m.id}: Buchstabe`);
    assert.ok(m.name && m.alt, `${m.id}: Namen`);
    assert.match(m.struct, /\{[^}]+\}/, `${m.id}: reagierender Teil fehlt`);
  }
  // Kettenpolymerisation: reagierender Teil ist die Zweifachbindung
  for (const v of VINYLS) assert.ok(/\{[^}]*=[^}]*\}/.test(v.struct), v.id);
  // Farben innerhalb einer Auswahl unterscheidbar
  assert.strictEqual(new Set(VINYLS.map(v => v.hue)).size, VINYLS.length);
});

test("Verträglichkeit: Ziegler-Natta, radikalisch, ionisch", () => {
  // polare Monomere vergiften Ziegler-Natta
  for (const m of ["mma", "vinylchlorid", "acrylnitril", "vinylacetat", "tfe"] as VinylId[]) assert.strictEqual(compat(m, "zn").fail, "poison", m);
  assert.strictEqual(compat("isobuten", "zn").fail, "bulky");
  for (const m of ["ethen", "propen", "styrol", "butadien"] as VinylId[]) assert.strictEqual(compat(m, "zn").fit, "ok", m);
  assert.strictEqual(compat("propen", "zn").tact, "iso");
  // Allyl-H: radikalisch nur kurze Ketten
  assert.strictEqual(compat("propen", "dbpo").fail, "allyl");
  assert.strictEqual(compat("isobuten", "aibn").fail, "allyl");
  // anionisch lebend, kationisch nur mit Elektronen schiebenden Gruppen
  assert.ok(compat("styrol", "buli").living);
  assert.ok(compat("butadien", "buli").living);
  assert.strictEqual(compat("isobuten", "bf3").fit, "ok");
  assert.strictEqual(compat("mma", "bf3").fit, "none");
  assert.strictEqual(compat("ethen", "buli").fit, "none");
  // jede Begründung vorhanden
  for (const v of VINYLS) for (const me of METHOD_IDS) assert.ok(compat(v.id, me).why.length > 20, `${v.id}/${me}`);
});

test("Produkte der Polymerisation: Dichte des Polyethens, Blöcke nur bei lebenden Ketten", () => {
  assert.match(polymerise(["ethen"], "zn").product!.name, /PE-HD/);
  assert.match(polymerise(["ethen"], "dbpo").product!.name, /PE-LD/);
  assert.strictEqual(polymerise(["ethen"], "dbpo").product!.struktur, "verzweigt");
  assert.match(polymerise(["propen"], "zn").product!.name, /^Isotaktisches Polypropen/);
  assert.strictEqual(polymerise(["mma"], "zn").fit, "none");
  const block = polymerise(["styrol", "butadien"], "buli", true);
  assert.strictEqual(block.product!.copo, "block");
  assert.match(block.product!.name, /SB/);
  const sep = polymerise(["styrol", "butadien"], "dbpo", true);
  assert.ok(sep.separate);
  assert.strictEqual(polymerise(["styrol", "butadien"], "dbpo").product!.abbr, "SBR");
});

test("Stufenwachstum: Ketten, Netze, Kettenstopper, keine Reaktion", () => {
  const r = (a: StepId, b?: StepId) => stepReact(a, b);
  assert.strictEqual(r("terephthalsaeure", "ethandiol").product!.abbr, "PET");
  assert.strictEqual(r("terephthalsaeure", "ethandiol").byp, "H2O");
  assert.strictEqual(r("adipoylchlorid", "hexandiamin").byp, "HCl");
  assert.strictEqual(r("adipinsaeure", "hexandiamin").product!.abbr, "PA 6.6");
  assert.strictEqual(r("hdi", "butandiol").byp, null);
  assert.strictEqual(r("hdi", "butandiol").link, "urethan");
  assert.strictEqual(r("adipinsaeure", "glycerin").struktur, "vernetzt");
  assert.strictEqual(r("phenol", "methanal").struktur, "vernetzt");
  assert.strictEqual(r("badge", "hexandiamin").struktur, "vernetzt");
  assert.strictEqual(r("terephthalsaeure", "ethanol").struktur, "klein");
  assert.strictEqual(r("ethandiol").struktur, "none");
  assert.strictEqual(r("ethandiol", "butandiol").struktur, "none");
  assert.strictEqual(r("badge", "ethandiol").struktur, "none");
  assert.strictEqual(r("milchsaeure").product!.abbr, "PLA");
  assert.strictEqual(r("aminohexansaeure").struktur, "linear");
});

/** alle Ansätze der Experimentier-Ansicht */
function recipes(): Recipe[] {
  const out: Recipe[] = [];
  for (const v of VINYLS) for (const me of METHOD_IDS) {
    out.push({ art: "poly", a: v.id, method: me });
    for (const w of VINYLS) if (w.id !== v.id) for (const seq of [false, true]) out.push({ art: "poly", a: v.id, b: w.id, seq, method: me as MethodId });
  }
  for (const art of ["kond", "add"] as const) {
    const ms = STEPS.filter(s => s.arts.includes(art)).map(s => s.id);
    for (const a of ms) { out.push({ art, a }); for (const b of ms) if (b !== a) out.push({ art, a, b }); }
  }
  return out;
}

test("Atom-Ansicht: jeder Ansatz läuft automatisch durch, Zurück stellt denselben Stand her", () => {
  let n = 0;
  for (const r of recipes()) {
    const m = makeMech(r);
    const acts: string[] = [];
    for (let k = 0; k < 14; k++) {
      const id = nextAuto(m, r);
      if (!id) break;
      assert.ok(m.actions().some(a => a.id === id), `${JSON.stringify(r)}: ${id} nicht angeboten`);
      const clip = m.run(id);
      assert.ok(clip.length >= 2, `${JSON.stringify(r)}: Ablauf ${id} leer`);
      acts.push(id);
    }
    const st = m.status();
    assert.ok(st.step, JSON.stringify(r));
    assert.ok(st.beads.every(b => b.hue && b.title), JSON.stringify(r));
    // Zurück: Aktionen ohne Animation nachspielen → gleicher Stand
    const again = replay(r, acts).status();
    assert.strictEqual(again.n, st.n, JSON.stringify(r));
    assert.strictEqual(again.beads.map(b => b.letter).join(""), st.beads.map(b => b.letter).join(""), JSON.stringify(r));
    n++;
  }
  assert.ok(n > 1000, `${n} Ansätze`);
}, 120_000);

test("Atom-Ansicht: jede angebotene Aktion läuft an jeder Stelle des Ablaufs", () => {
  for (const r of recipes()) {
    if (r.art === "poly" && r.b) continue;
    const m = makeMech(r), acts: string[] = [];
    for (let k = 0; k < 8; k++) {
      for (const a of m.actions()) {
        try { replay(r, [...acts, a.id]); } catch (e) { assert.fail(`${JSON.stringify(r)} ${acts.join(" ")} → ${a.id}: ${e}`); }
      }
      const id = nextAuto(m, r);
      if (!id) break;
      m.run(id); acts.push(id);
    }
  }
}, 120_000);

test("Atom-Ansicht: Elektronen-Punkte nur am aktiven Ende (keiner bleibt an CO₂, N₂, H₂O, HCl oder der fertigen Kette)", () => {
  for (const r of recipes()) {
    if (r.art === "poly" && r.b) continue;
    const m = makeMech(r);
    for (let k = 0; k < 10; k++) {
      const id = nextAuto(m, r);
      if (!id) break;
      const clip = m.run(id), st = m.status();
      const dots = clip[clip.length - 1].snap.dots.filter(d => (d.op ?? 1) > 0.05).length;
      // Allyl-H-Abriss: das beständige Allylradikal behält seinen Punkt (die Kette ist trotzdem zu Ende)
      const allyl = r.art === "poly" && compat(r.a as VinylId, r.method as MethodId).fail === "allyl" && id.startsWith("add:");
      const want = st.active === "rad" || allyl ? 1 : st.active === "an" && st.n > 0 ? 2 : 0;
      assert.strictEqual(dots, want, `${JSON.stringify(r)} nach ${id}: ${dots} Punkte`);
    }
  }
}, 60_000);

test("Atom-Ansicht: Fehlschläge zeigen die Begründung", () => {
  const run = (r: Recipe, ids: string[]) => { const m = makeMech(r); for (const id of ids) m.run(id); return m.status(); };
  const zn = run({ art: "poly", a: "mma", method: "zn" }, ["act", "add:mma"]);
  assert.ok(zn.fail && /Titan/.test(zn.fail));
  const pp = run({ art: "poly", a: "propen", method: "dbpo" }, ["heat", "add:propen"]);
  assert.ok(pp.fail && /CH₃/.test(pp.fail));
  const diol = run({ art: "kond", a: "ethandiol", b: "butandiol" }, ["join"]);
  assert.ok(diol.fail);
  // Polykondensation zählt das abgespaltene Wasser
  const pet = run({ art: "kond", a: "terephthalsaeure", b: "ethandiol" }, ["join", "add:terephthalsaeure"]);
  assert.strictEqual(pet.byp, "2 H₂O");
  const pur = run({ art: "add", a: "hdi", b: "butandiol" }, ["join", "add:hdi"]);
  assert.strictEqual(pur.byp, undefined);
});

test("Reaktor: Kettenwachstum, lebende Ketten, Vergiftung", () => {
  const sim = (r: Recipe, steps: number, extra: Record<number, string> = {}) => {
    const R = new Reactor(r, 48, 52, 5);
    R.run("start");
    for (let s = 1; s <= steps; s++) { if (extra[s]) R.run(extra[s]); R.step(); }
    return R.stats();
  };
  const ps = sim({ art: "poly", a: "styrol", method: "dbpo" }, 900);
  assert.ok(ps.conv > 0.35 && ps.chains >= 3, `PS: ${ps.conv} / ${ps.chains}`);
  assert.ok(ps.hist[0] > 0, "Kettenwachstum: freies Monomer bleibt übrig");
  const pp = sim({ art: "poly", a: "propen", method: "dbpo" }, 900);
  assert.ok(pp.max <= 8 && pp.why, `PP radikal nur kurz: ${pp.max}`);
  const zn = sim({ art: "poly", a: "mma", method: "zn" }, 400);
  assert.strictEqual(zn.phase, "aus");
  assert.strictEqual(zn.poisoned, 4);
  const an = sim({ art: "poly", a: "styrol", method: "buli" }, 600);
  assert.ok(an.living && an.active === 5, "anionisch: alle Ketten leben");
  const stopped = sim({ art: "poly", a: "styrol", method: "buli" }, 1400, { 600: "meoh" });
  assert.ok(stopped.active < 5, "Methanol beendet Ketten");
  const none = sim({ art: "poly", a: "ethen", method: "buli" }, 300);
  assert.strictEqual(none.phase, "aus");
}, 60_000);

test("Reaktor: Stufenwachstum, Netz, Kettenstopper", () => {
  const sim = (r: Recipe, steps: number) => { const R = new Reactor(r, 48, 52, 5); R.run("start"); R.advance(steps); return R.stats(); };
  const pet = sim({ art: "kond", a: "terephthalsaeure", b: "ethandiol" }, 1200);
  assert.ok(pet.conv > 0.8, `PET Umsatz ${pet.conv}`);
  assert.ok(pet.byp > 30 && pet.bypName === "H₂O");
  assert.ok(!pet.network);
  const up = sim({ art: "kond", a: "adipinsaeure", b: "glycerin" }, 1200);
  assert.ok(up.network, "Glycerin → Netz");
  const stop = sim({ art: "kond", a: "terephthalsaeure", b: "ethanol" }, 900);
  assert.ok(stop.max <= 3, `Kettenstopper: höchstens Dreier (${stop.max})`);
  const diol = sim({ art: "kond", a: "ethandiol" }, 300);
  assert.strictEqual(diol.phase, "aus");
  const pur = sim({ art: "add", a: "hdi", b: "butandiol" }, 900);
  assert.strictEqual(pur.byp, 0);
}, 60_000);

test("Namen der Monomere im Reaktor und in der Auswahl gleich", () => {
  for (const v of VINYLS) assert.strictEqual(vinyl(v.id).name, v.name);
  for (const s of STEPS) assert.strictEqual(stepMono(s.id).name, s.name);
});

test("Stufenwachstum: Monomer mit zwei verschiedenen Gruppen wendet der Kette die passende Gruppe zu (Milchsäure an –OH-Ende)", async () => {
  const { reactGroups } = await import("./chem/rules.ts");
  const ab = STEPS.filter(s => s.groups.length === 2 && s.groups[0] !== s.groups[1]).map(s => s.id);
  let checked = 0;
  for (const art of ["kond", "add"] as const) {
    const ms = STEPS.filter(s => s.arts.includes(art)).map(s => s.id);
    for (const x of ab.filter(id => ms.includes(id))) for (const y of ms) for (const [a, b] of [[x, y], [y, x]]) {
      if (a === b) continue;
      const r: Recipe = { art, a, b };
      const m = makeMech(r);
      assert.ok(m.actions().some(t => t.id === "join"), `${a}+${b}: kein Verknüpfen`);
      m.run("join");
      // meldet die Karte eine Kette, muss die erste Verknüpfung gelingen (nicht still überspringen)
      const sr = stepReact(a as StepId, b as StepId);
      if (sr.struktur !== "none" && !sr.unreacted) assert.ok(m.status().n >= 2 && !m.status().fail, `${a}+${b}: Karte ${sr.struktur}, Atom-Ansicht verknüpft nicht (${m.status().fail ?? ""})`);
      for (let k = 0; k < 4; k++) {
        const st = m.status();
        if (!st.end || st.phase !== "wachsend") break;
        const end = st.end as never;
        const fits = stepMono(x).groups.some(g => reactGroups(end, g as never));
        const before = st.n;
        m.run(`add:${x}`);
        assert.strictEqual(m.status().n > before, fits, `${JSON.stringify(r)}: ${x} an Ende ${end}`);
        checked++;
        if (!fits) break;
      }
    }
  }
  assert.ok(checked > 10, `${checked} Fälle`);
});

test("Atom-Ansicht: Moleküle überlappen sich nicht (Stufenwachstum, Endbild jedes Schritts)", () => {
  const bad: string[] = [];
  for (const r of recipes()) {
    if (r.art === "poly") continue;
    const m = makeMech(r);
    for (let k = 0; k < 6; k++) {
      const id = nextAuto(m, r);
      if (!id) break;
      m.run(id);
      const s = m.snap(), at = s.atoms.filter(a => (a.op ?? 1) > 0.5 && (a.text ?? a.el));
      const bonded = new Set(s.bonds.map(b => [b.a, b.b].sort().join("|")));
      for (let i = 0; i < at.length; i++) for (let j = i + 1; j < at.length; j++) {
        const a = at[i], b = at[j];
        if (bonded.has([a.id, b.id].sort().join("|"))) continue;
        if (Math.hypot(a.x - b.x, a.y - b.y) < 0.6) bad.push(`${r.a}+${r.b ?? ""} ${id}: ${a.text ?? a.el}/${b.text ?? b.el}`);
      }
    }
  }
  assert.deepEqual([...new Set(bad)].slice(0, 12), []);
}, 120_000);

test("Glycerin: dritte –OH als Ast nach unten, nie in der Hauptkette (Weg Verknüpfen, +T, +T, Zweierkette, +T, Ast)", () => {
  for (const acid of ["terephthalsaeure", "adipinsaeure"]) {
    const r: Recipe = { art: "kond", a: acid, b: "glycerin" };
    const m = makeMech(r);
    for (const id of ["join", `add:${acid}`, `add:${acid}`, "add:glycerin", `add:${acid}`, `branch:${acid}`]) if (m.actions().some(a => a.id === id)) m.run(id);
    const st = m.status();
    const main = st.beads.filter(b => b.branchOf === undefined).map(b => b.mono);
    for (let i = 1; i < main.length; i++) assert.ok(!(main[i] === acid && main[i - 1] === acid), `${acid}: zwei Säuren nebeneinander ${main}`);
    const br = st.beads.filter(b => b.branchOf !== undefined);
    assert.strictEqual(br.length, 1, `${acid}: ein Ast`);
    assert.strictEqual(main[br[0].branchOf!], "glycerin");
    const s = m.snap(), at = s.atoms.filter(a => (a.op ?? 1) > 0.5 && (a.text ?? a.el));
    const bonded = new Set(s.bonds.map(b => [b.a, b.b].sort().join("|")));
    for (let i = 0; i < at.length; i++) for (let j = i + 1; j < at.length; j++) {
      if (bonded.has([at[i].id, at[j].id].sort().join("|"))) continue;
      assert.ok(Math.hypot(at[i].x - at[j].x, at[i].y - at[j].y) >= 0.6, `${acid}: ${at[i].id}/${at[j].id} überlappen`);
    }
  }
});

test("Allyl-H-Abriss: das Allylradikal (Propen bzw. Isobuten) bleibt im Endbild, mit Radikal-Punkt", () => {
  for (const [a, method] of [["propen", "dbpo"], ["isobuten", "aibn"]] as const) {
    const m = replay({ art: "poly", a, method }, ["heat"]);
    const before = m.snap().atoms.length;
    m.run(`add:${a}`);
    const s = m.snap();
    // Starter-Bruchstück + H, dazu das ganze Monomer (3 bzw. 4 C) – nicht nur Benzol
    assert.ok(s.atoms.length > before + 2, `${a}: Monomer fehlt im Endbild`);
    assert.ok(s.atoms.some(x => x.text === "CH₂"), `${a}: CH₂ des Allylradikals fehlt`);
    assert.ok(s.dots.length >= 1, `${a}: Radikal-Punkt fehlt`);
    assert.ok(s.notes.some(n => /Allyl/.test(n.text)), `${a}: Beschriftung fehlt`);
  }
});

test("Beschriftungen im Bild: ganz im Ausschnitt, Zeilen kurz (passt bei 390 px)", async () => {
  const { noteBox, snapBox } = await import("./chem/scene.ts");
  for (const r of recipes()) {
    if (r.art === "poly" && r.b) continue;
    const m = makeMech(r);
    for (let k = 0; k < 10; k++) {
      const id = nextAuto(m, r);
      if (!id) break;
      const clip = m.run(id);
      for (const key of [clip[clip.length - 1].snap, m.snap()]) {
        const b = snapBox(key);
        for (const n of key.notes) {
          if ((n.op ?? 1) <= 0.05 || n.bracket || n.text.length <= 4) continue;
          for (const l of n.text.split("\n")) assert.ok(l.length <= 18, `${JSON.stringify(r)} ${id}: Zeile zu lang „${l}“`);
          const q = noteBox(n);
          assert.ok(b && q.x0 >= b.x0 - 1e-9 && q.x1 <= b.x1 + 1e-9 && q.y0 >= b.y0 - 1e-9 && q.y1 <= b.y1 + 1e-9, `${JSON.stringify(r)} ${id}: „${n.text}“ ragt hinaus`);
        }
      }
    }
  }
}, 60_000);

test("Atom-Ansicht: Kettenabläufe ohne überlappende Beschriftungen (alle Bilder jedes Schritts, mit Ladungszeichen)", async () => {
  const { labelHalf, dirOf } = await import("./chem/scene.ts");
  const bad: string[] = [];
  type Box = { id: string; t: string; x: number; y: number; w: number; h: number; of: string };
  for (const r of recipes()) {
    if (r.art !== "poly" || r.b) continue;
    const m = makeMech(r);
    for (let k = 0; k < 8; k++) {
      const id = nextAuto(m, r);
      if (!id) break;
      const clip = m.run(id);
      // ruhende Bilder (mit Haltezeit) – während einer Bewegung dürfen sich Teile kurz kreuzen
      for (const key of clip.filter(c => c.hold >= 250)) {
        const s = key.snap, at = s.atoms.filter(a => (a.op ?? 1) > 0.5 && (a.text ?? a.el) && !a.vac);
        const bonded = new Set(s.bonds.map(b => [b.a, b.b].sort().join("|")));
        const boxes: Box[] = at.map(a => ({ id: a.id, t: a.text ?? a.el, x: a.x, y: a.y, w: labelHalf(a), h: 0.21, of: a.id }));
        for (const a of at) if (a.q) { const d = dirOf(a.qa ?? -45), rr = 0.46 + Math.abs(d.x) * Math.max(0, labelHalf(a) - 0.2); boxes.push({ id: a.id + "q", t: a.q > 0 ? "⊕" : "⊖", x: a.x + d.x * rr, y: a.y + d.y * rr, w: 0.13, h: 0.13, of: a.id }); }
        for (let i2 = 0; i2 < boxes.length; i2++) for (let j2 = i2 + 1; j2 < boxes.length; j2++) {
          const a = boxes[i2], b = boxes[j2];
          if (a.of === b.of || bonded.has([a.of, b.of].sort().join("|"))) continue;
          const ox = a.w + b.w - Math.abs(a.x - b.x), oy = a.h + b.h - Math.abs(a.y - b.y);
          if (ox > 0.04 && oy > 0.04) bad.push(`${r.a}/${r.method} ${id}: ${a.t}/${b.t} ${a.id}@${a.x.toFixed(2)},${a.y.toFixed(2)} ${b.id}@${b.x.toFixed(2)},${b.y.toFixed(2)}`);
        }
      }
    }
  }
  assert.deepEqual([...new Set(bad)].slice(0, 30), []);
}, 120_000);

test("Stufenwachstum: Monomer mit zwei verschiedenen Gruppen und Partner – nur Gruppen zählen, die mit dem Partner reagieren (kein Netz, nicht abwechselnd)", async () => {
  const { isAB, functionality } = await import("./chem/rules.ts");
  const r = (a: StepId, b?: StepId) => stepReact(a, b);
  // Funktionalität gegenüber dem Partner: die –OH der Milchsäure reagiert nicht mit –NH₂
  assert.strictEqual(functionality("milchsaeure", "NH2"), 1);
  assert.strictEqual(functionality("glycerin", "COOH"), 3);
  assert.strictEqual(functionality("hexandiamin", "EPOX"), 4);
  // AB + B₃: verzweigt, kein Netz (an den Enden nur –OH)
  for (const ab of ["milchsaeure", "aminohexansaeure"] as StepId[]) {
    const g = r(ab, "glycerin");
    assert.strictEqual(g.struktur, "verzweigt", ab);
    assert.notStrictEqual(g.product?.klasse, "duro", ab);
  }
  // AB + BB: lineare Ketten, die Bausteine wechseln sich nicht ab
  const pe = r("milchsaeure", "ethandiol");
  assert.strictEqual(pe.struktur, "linear");
  assert.ok(!/abwechselnd/.test(pe.why), pe.why);
  // Milchsäure + Diamin: Amid (mit dem Partner) und Ester (mit sich selbst) – kein reines Polyamid
  const pa = r("milchsaeure", "hexandiamin");
  assert.deepEqual([...(pa.links ?? [])].sort(), ["amid", "ester"]);
  assert.match(pa.product!.name, /Polyesteramid/);
  // Kettenstopper bleibt Kettenstopper
  assert.strictEqual(r("milchsaeure", "ethanol").struktur, "klein");
  // alle Paare: mit einem AB-Monomer nie Netz und nie „abwechselnd“
  for (const art of ["kond", "add"] as const) {
    const ms = STEPS.filter(s => s.arts.includes(art)).map(s => s.id);
    for (const a of ms) for (const b of ms) {
      if (a === b) continue;
      const o = r(a, b);
      if (isAB(a) || isAB(b)) {
        assert.notStrictEqual(o.struktur, "vernetzt", `${a}+${b}`);
        assert.ok(!/abwechselnd/.test(o.why), `${a}+${b}: ${o.why}`);
      }
      // keine pauschale Behauptung, die Gruppen reagierten nicht (Phenol + Säurechlorid, Methanal + Amin reagieren in Wirklichkeit)
      assert.ok(!/keine Gruppen, die miteinander reagieren/.test(o.why), `${a}+${b}: ${o.why}`);
    }
  }
  assert.match(r("phenol", "adipoylchlorid").why, /–OH/);
  assert.match(r("methanal", "hexandiamin").why, /Aminogruppen/);
  assert.match(r("methanal").why, /POM/);
});

test("Anionisch nacheinander: Blöcke nur, wenn das Kettenende das zweite Monomer starten kann (Styrol/Butadien → MMA, nicht umgekehrt)", async () => {
  const { seqKind } = await import("./chem/rules.ts");
  assert.strictEqual(seqKind("styrol", "mma", "buli"), "block");
  assert.strictEqual(seqKind("butadien", "styrol", "buli"), "block");
  assert.strictEqual(seqKind("mma", "styrol", "buli"), "first");
  assert.strictEqual(seqKind("acrylnitril", "styrol", "buli"), "first");
  const bad = polymerise(["mma", "styrol"], "buli", true);
  assert.notStrictEqual(bad.product!.copo, "block");
  assert.strictEqual(bad.unreacted, "styrol");
  assert.strictEqual(polymerise(["styrol", "mma"], "buli", true).product!.copo, "block");
  // gleichzeitig: MMA setzt sich durch (kein statistisches Copolymer)
  assert.strictEqual(polymerise(["styrol", "mma"], "buli").product!.abbr, "PMMA");
  // Atom-Ansicht: das MMA-Kettenende baut Styrol nicht ein
  const m = replay({ art: "poly", a: "mma", b: "styrol", seq: true, method: "buli" }, ["add:mma", "add:mma"]);
  m.run("add:styrol");
  assert.strictEqual(m.status().n, 2);
  assert.ok(m.status().fail && /zu schwach/.test(m.status().fail!));
  // Reaktor: kein Styrol in den Ketten
  const R = new Reactor({ art: "poly", a: "mma", b: "styrol", seq: true, method: "buli" }, 48, 52, 5);
  R.run("start"); R.advance(300); R.run("add:styrol"); R.advance(600);
  assert.ok(R.beads.filter(b => b.kind === "mono" && b.m === "styrol").every(b => !b.nb.length), "Styrol eingebaut");
}, 60_000);

test("Nacheinander ohne lebende Ketten: erst Abbruch, dann neue Kette aus dem zweiten Monomer (keine Blöcke) – Atom-Ansicht und Reaktor", () => {
  for (const r of [{ art: "poly", a: "styrol", b: "mma", seq: true, method: "dbpo" }, { art: "poly", a: "propen", b: "ethen", seq: true, method: "zn" }, { art: "poly", a: "isobuten", b: "styrol", seq: true, method: "bf3" }] as Recipe[]) {
    const m = makeMech(r);
    let second = false, k = 0;
    for (let id = nextAuto(m, r); id && k < 30; id = nextAuto(m, r), k++) {
      if (m.status().n) assert.ok(m.actions().filter(a => a.kind === "add").length <= 1, `${r.a}: nur ein Monomer zur Wahl`);
      m.run(id);
      const st = m.status(), monos = new Set(st.beads.filter(b => b.kind === "unit").map(b => b.mono));
      assert.ok(monos.size <= 1, `${r.a}/${r.method} nach ${id}: Kette aus zwei Monomeren`);
      if (st.second) second = true;
      if (second && st.n) assert.ok(monos.has(r.b!), `${r.a}: zweite Kette aus ${r.b}`);
    }
    assert.ok(second, `${r.a}/${r.method}: keine zweite Kette`);
    assert.ok(polymerise([r.a, r.b!] as VinylId[], r.method!, true).separate);
  }
  // Reaktor: die Ketten des ersten Monomers sind beendet, das zweite baut neue Ketten (nicht an die alten)
  for (const r of [{ art: "poly", a: "styrol", b: "mma", seq: true, method: "dbpo" }, { art: "poly", a: "styrol", b: "mma", seq: true, method: "aibn" },
    { art: "poly", a: "isobuten", b: "styrol", seq: true, method: "bf3" }, { art: "poly", a: "propen", b: "ethen", seq: true, method: "zn" }] as Recipe[]) {
    const R = new Reactor(r, 48, 52, 5);
    R.run("start"); R.advance(600);
    const old = R.beads.filter(b => b.kind === "mono" && b.nb.length).map(b => b.id);
    assert.ok(old.length > 3, `${r.a}/${r.method}: erste Ketten`);
    R.run(`add:${r.b}`); R.advance(900);
    const oldMols = new Set(old.map(id => R.bead(id)?.mol));
    const grown = R.beads.filter(b => b.kind === "mono" && b.m === r.b && !b.dead && b.nb.length);
    assert.ok(grown.length >= 2, `${r.a} → ${r.b} (${r.method}): keine Kette aus ${r.b}`);
    for (const b of grown) assert.ok(!oldMols.has(b.mol), `${r.a} → ${r.b} (${r.method}): ${r.b} an einer alten Kette`);
  }
}, 60_000);

test("Kautschuk: EPM ist Kautschuk ohne C=C (Peroxid), PIB nicht vernetzbar, SB-Zweiblock (noch kein thermoplastisches Elastomer, das erst SBS), Dien-Kautschuke vulkanisierbar", () => {
  const p = (ms: VinylId[], me: MethodId, seq = false) => polymerise(ms, me, seq).product!;
  assert.deepEqual([p(["ethen", "propen"], "zn").klasse, p(["ethen", "propen"], "zn").rubber], ["elast", "peroxid"]);
  assert.strictEqual(p(["isobuten"], "bf3").rubber, "nein");
  assert.strictEqual(p(["styrol", "butadien"], "buli", true).rubber, "zweiblock");
  for (const x of [p(["butadien"], "dbpo"), p(["styrol", "butadien"], "dbpo"), p(["acrylnitril", "butadien"], "dbpo")]) assert.strictEqual(x.rubber, "dien", x.name);
  // Ziegler-Natta mit TiCl₄/Al(C₂H₅)₃: nicht pauschal cis-1,4
  assert.ok(!/cis/i.test(p(["butadien"], "zn").name));
  assert.ok(polymerise(["styrol", "mma"], "dbpo", true).product!.mix);
});

test("Phenoplast: CH₂-Brücken nur in ortho- oder para-Stellung zur –OH (Ringnachbarschaft)", () => {
  const r: Recipe = { art: "kond", a: "phenol", b: "methanal" };
  const m = replay(r, ["join", "add:pf", "add:pf"]);
  const s = m.snap();
  const nb = (id: string) => s.bonds.filter(b => b.a === id || b.b === id).map(b => (b.a === id ? b.b : b.a));
  const el = (id: string) => s.atoms.find(a => a.id === id)?.el;
  let bridges = 0;
  for (const ring of Object.values(s.rings)) {
    if (!ring.every(id => s.atoms.some(a => a.id === id))) continue;
    const iO = ring.findIndex(id => nb(id).some(x => el(x) === "O"));
    if (iO < 0) continue;
    ring.forEach((id, i) => {
      // Brücke: Ring-C mit einem C außerhalb des Rings
      if (!nb(id).some(x => el(x) === "C" && !ring.includes(x))) return;
      const d = Math.min(Math.abs(i - iO), 6 - Math.abs(i - iO));
      assert.ok(d === 1 || d === 3, `Brücke in Stellung ${d} zur –OH (1 = ortho, 3 = para)`);
      bridges++;
    });
  }
  assert.ok(bridges >= 4, `${bridges} Brücken geprüft`);
});

test("Pfeile: Ziegler-Natta-Einbau von Butadien mit drei Pfeilen, kationisch H⁺ vom Butadien ohne Allen", () => {
  const zn = replay({ art: "poly", a: "butadien", method: "zn" }, ["act"]);
  const clip = zn.run("add:butadien");
  assert.ok(clip.some(k => (k.arrows?.length ?? 0) === 3), "Einbau: drei Pfeile (π C1=C2, Ti–C, π C3=C4)");
  // Elektronen wandern paarweise
  for (const k of clip) assert.strictEqual(k.snap.dots.length % 2, 0, "Elektronen paarweise");
  const cat = replay({ art: "poly", a: "butadien", method: "bf3" }, ["acid", "add:butadien"]);
  cat.run("hplus");
  const s = cat.snap();
  for (const a of s.atoms.filter(x => x.el === "C")) {
    const bs = s.bonds.filter(b => (b.a === a.id || b.b === a.id) && !b.k);
    assert.ok(bs.filter(b => b.o === 2).length <= 1, `${a.id}: zwei Zweifachbindungen (Allen)`);
    assert.ok(bs.reduce((t, b) => t + b.o, 0) <= 4, `${a.id}: mehr als vier Bindungen`);
  }
});

test("Polykondensation: Ester- und Amidbindung mit Pfeilen in drei Schritten, Ladungen ausgeglichen", () => {
  for (const r of [{ art: "kond", a: "terephthalsaeure", b: "ethandiol" }, { art: "kond", a: "adipinsaeure", b: "hexandiamin" }, { art: "kond", a: "adipoylchlorid", b: "hexandiamin" }, { art: "kond", a: "milchsaeure" }] as Recipe[]) {
    for (const acts of [["join"], ["join", `add:${r.a}`]]) {
      const m = replay(r, acts.slice(0, -1)), clip = m.run(acts[acts.length - 1]);
      const withArrows = clip.filter(k => k.arrows?.length);
      assert.strictEqual(withArrows.length, 3, `${r.a}+${r.b ?? ""} ${acts.at(-1)}: Schritte mit Pfeilen`);
      for (const k of clip) assert.strictEqual(k.snap.atoms.reduce((t, a) => t + (a.q ?? 0), 0), 0, `${r.a}: Ladung nicht ausgeglichen`);
      for (const k of withArrows) for (const ar of k.arrows!) assert.ok(anchorPt(k.snap, ar.from) && anchorPt(k.snap, ar.to), "Pfeil ohne Anker");
    }
  }
});

test("Produktbild: Wiederholeinheit des Monomers, das wirklich eingebaut wird (Gemisch: beide, Copolymer: keine)", async () => {
  const { productUnits } = await import("./chem/rules.ts");
  const u = (ms: VinylId[], me: MethodId, seq = false) => productUnits(ms, polymerise(ms, me, seq));
  // gleichzeitig anionisch: es entsteht fast nur PMMA – nicht das Bild von Polystyrol
  assert.deepEqual(u(["styrol", "mma"], "buli"), ["mma"]);
  assert.deepEqual(u(["mma", "styrol"], "buli", true), ["mma"]);
  assert.deepEqual(u(["styrol", "mma"], "dbpo", true), ["styrol", "mma"]);
  assert.deepEqual(u(["styrol", "mma"], "dbpo"), []);
  assert.deepEqual(u(["propen"], "zn"), ["propen"]);
});

test("Glycerin: mit Disäure bzw. Säurechlorid (A₂ + B₃) vernetzter Polyester; mit AB-Monomer (Milchsäure, 6-Aminohexansäure) sternförmig, kein Netz", () => {
  // A₂ + B₃: Netz, Duroplast – in Regeln und Reaktor
  for (const acid of ["adipinsaeure", "terephthalsaeure", "adipoylchlorid", "terephthaloylchlorid"] as StepId[]) {
    const o = stepReact(acid, "glycerin");
    assert.strictEqual(o.struktur, "vernetzt", acid);
    assert.strictEqual(o.product?.klasse, "duro", acid);
    assert.ok(!o.product?.star, acid);
  }
  // AB + B₃: Stern mit Glycerin in der Mitte, kein Netz, schmelzbar
  for (const ab of ["milchsaeure", "aminohexansaeure"] as StepId[]) {
    const o = stepReact(ab, "glycerin"), p = o.product!;
    assert.strictEqual(o.struktur, "verzweigt", ab);
    assert.notStrictEqual(p.klasse, "duro", ab);
    assert.ok(p.star, ab);
    assert.match(p.name, /^Sternförmig verzweigte[rs] Poly/, ab);
    assert.match(o.why, /sternförmig/);
    assert.match(o.why, /Zwei Sterne verbinden sich nie/);
    assert.deepEqual(stepReact("glycerin", ab).product?.star, true, `glycerin+${ab}`);
  }
  assert.strictEqual(stepReact("milchsaeure", "glycerin").product!.name, "Sternförmig verzweigter Polyester aus Milchsäure und Glycerin");
  assert.match(stepReact("aminohexansaeure", "glycerin").product!.name, /^Sternförmig verzweigtes Polyesteramid/);
  const sim = (r: Recipe) => { const R = new Reactor(r, 48, 52, 5); R.run("start"); R.advance(1500); return R.stats(); };
  assert.ok(sim({ art: "kond", a: "terephthalsaeure", b: "glycerin" }).network, "A₂ + B₃: Netz");
  assert.ok(!sim({ art: "kond", a: "milchsaeure", b: "glycerin" }).network, "AB + B₃: kein Netz");
}, 60_000);

test("Ein Monomer bildet keine Ketten: das andere ergibt sein Homopolymer (Karte, Atom-Ansicht und Reaktor stimmen überein); kein Polymer nur bei Vergiftung von Anfang an bzw. verbrauchtem Starter", () => {
  const P = (ms: VinylId[], me: MethodId, seq = false) => polymerise(ms, me, seq);
  assert.strictEqual(P(["ethen", "isobuten"], "zn").product?.abbr, "PE-HD");
  assert.strictEqual(P(["ethen", "isobuten"], "zn").unreacted, "isobuten");
  assert.strictEqual(P(["styrol", "ethen"], "buli").product?.abbr, "PS");
  assert.strictEqual(P(["ethen", "styrol"], "buli", true).product?.abbr, "PS");
  assert.strictEqual(P(["ethen", "vinylchlorid"], "zn", true).product?.abbr, "PE-HD");
  assert.match(P(["ethen", "vinylchlorid"], "zn", true).why, /Erst wächst PE-HD/);
  // Katalysator von Anfang an vergiftet bzw. Starter vorher verbraucht: kein Polymer
  assert.isUndefined(P(["vinylchlorid", "ethen"], "zn").product);
  assert.isUndefined(P(["vinylchlorid", "ethen"], "zn", true).product);
  assert.isUndefined(P(["vinylchlorid", "styrol"], "buli", true).product);
  // beide passen nicht, eines bildet kurze Ketten
  assert.strictEqual(P(["ethen", "propen"], "bf3").fit, "short");
  // Stufenwachstum: Monomer mit zwei verschiedenen Gruppen + Partner, der nicht reagiert → dessen Polymer
  const pla = stepReact("milchsaeure", "phenol"), pa6 = stepReact("methanal", "aminohexansaeure");
  assert.strictEqual(pla.product?.abbr, "PLA"); assert.strictEqual(pla.unreacted, "phenol");
  assert.strictEqual(pa6.product?.abbr, "PA 6"); assert.strictEqual(pa6.unreacted, "methanal");
  // Atom-Ansicht: die Kette wächst ohne den Partner, Reaktor: der Partner bleibt frei
  for (const r of [{ art: "kond", a: "phenol", b: "milchsaeure" }, { art: "kond", a: "aminohexansaeure", b: "methanal" }] as Recipe[]) {
    const m = makeMech(r);
    for (let id = nextAuto(m, r), k = 0; id && k < 12; id = nextAuto(m, r), k++) m.run(id);
    const o = stepReact(r.a as StepId, r.b as StepId);
    assert.ok(m.status().n >= 3, `${r.a}+${r.b}: Kette wächst nicht`);
    assert.ok(!m.status().beads.some(b => b.mono === o.unreacted), `${r.a}+${r.b}: ${o.unreacted} in der Kette`);
    const R = new Reactor(r, 48, 52, 5); R.run("start"); R.advance(900);
    assert.ok(R.beads.filter(b => b.m === o.unreacted).every(b => !b.nb.length), `${r.a}+${r.b}: Reaktor verknüpft ${o.unreacted}`);
    assert.ok(R.stats().max >= 3);
  }
  // Reaktor und Karte: Kette ⇔ Produkt (bzw. kurze Ketten)
  const chains = (r: Recipe) => {
    const R = new Reactor(r, 48, 52, 5); R.run("start"); R.advance(r.seq ? 400 : 700);
    if (r.seq) { R.run(`add:${r.b}`); R.advance(700); }
    const by = new Map(R.beads.map(b => [b.id, b]));
    return R.beads.filter(b => b.kind === "mono" && !b.dead && b.nb.some(j => by.get(j)?.kind === "mono"));
  };
  for (const r of [{ a: "ethen", b: "isobuten", method: "zn" }, { a: "vinylchlorid", b: "ethen", method: "zn" }, { a: "ethen", b: "vinylchlorid", seq: true, method: "zn" },
    { a: "styrol", b: "ethen", method: "buli" }, { a: "isobuten", b: "ethen", method: "bf3" }, { a: "styrol", b: "mma", method: "buli" }].map(x => ({ art: "poly", ...x })) as Recipe[]) {
    const out = P([r.a, r.b] as VinylId[], r.method!, !!r.seq), c = chains(r);
    assert.strictEqual(c.length > 0, !!out.product, `${r.a}${r.seq ? "→" : "+"}${r.b}/${r.method}: Reaktor ${c.length} Kettenglieder, Karte ${out.product?.abbr ?? "kein Polymer"}`);
    if (out.unreacted) assert.ok(!c.some(b => b.m === out.unreacted), `${r.a}+${r.b}/${r.method}: ${out.unreacted} im Reaktor eingebaut`);
  }
}, 60_000);

test("Atom-Ansicht: Monomer mit zwei verschiedenen Gruppen als erstes Monomer verknüpft sich mit Disäure bzw. Säurechlorid (Molekül gewendet)", () => {
  for (const ab of ["milchsaeure", "aminohexansaeure"] as StepId[]) for (const acid of ["terephthalsaeure", "adipinsaeure", "adipoylchlorid", "terephthaloylchlorid"] as StepId[]) {
    const r: Recipe = { art: "kond", a: ab, b: acid };
    assert.strictEqual(stepReact(ab, acid).struktur, "linear");
    const m = replay(r, ["join"]);
    assert.ok(m.status().n >= 2 && !m.status().fail, `${ab}+${acid}: ${m.status().fail}`);
  }
});

test("Anionisch gleichzeitig: Styrol + Butadien ergibt ein Gradienten-Copolymer (Butadien zuerst), Styrol + MMA fast nur PMMA – auch in Atom-Ansicht und Reaktor", () => {
  const sb = polymerise(["styrol", "butadien"], "buli");
  assert.strictEqual(sb.product?.copo, "gradient");
  assert.match(sb.why, /Butadien lagert sich viel schneller an/);
  assert.match(sb.why, /polaren Zusatz/);
  const r: Recipe = { art: "poly", a: "styrol", b: "butadien", method: "buli" };
  const m = makeMech(r);
  for (let id = nextAuto(m, r), k = 0; id && k < 20; id = nextAuto(m, r), k++) m.run(id);
  const seq = m.status().beads.filter(b => b.kind === "unit").map(b => b.mono);
  assert.strictEqual(seq[0], "butadien", seq.join(","));
  assert.ok(seq.includes("styrol") && seq.lastIndexOf("butadien") < seq.indexOf("styrol"), `Atom-Ansicht: ${seq.join(",")}`);
  // Reaktor: am Anfang wird fast nur Butadien eingebaut
  const R = new Reactor(r, 48, 52, 5); R.run("start"); R.advance(120);
  const used = R.beads.filter(b => b.kind === "mono" && b.nb.length);
  assert.ok(used.filter(b => b.m === "butadien").length > 3 * used.filter(b => b.m === "styrol").length, "Reaktor: Butadien nicht bevorzugt");
});

test("Reaktor: Säurechlorid + Milchsäure spaltet HCl und Wasser ab – beide Nebenprodukte gezählt", () => {
  const R = new Reactor({ art: "kond", a: "adipoylchlorid", b: "milchsaeure" }, 48, 52, 5);
  R.run("start"); R.advance(1500);
  const parts = new Map(R.stats().bypParts ?? []);
  assert.ok((parts.get("HCl") ?? 0) > 0 && (parts.get("H₂O") ?? 0) > 0, JSON.stringify([...parts]));
  assert.match(stepReact("methanal", "hexandiamin").why, /Aminoplaste/);
});

test("Formalladung aus Bindungen und freien Elektronenpaaren = gezeichnete Ladung (O, N, Cl, F in allen Bildern; Cl⁻ mit vier Paaren)", () => {
  const V: Record<string, number> = { O: 6, N: 5, Cl: 7, F: 7 };
  const bad = new Set<string>();
  const rs = recipes().filter(r => r.art !== "poly" || !r.b);
  for (const r of rs) {
    const m = makeMech(r);
    for (let id = nextAuto(m, r), k = 0; id && k < 14; id = nextAuto(m, r), k++) {
      for (const key of m.run(id)) {
        const s = key.snap;
        for (const a of s.atoms) {
          if (!(a.el in V) || !a.lp || (a.op ?? 1) < 0.05 || (a.text !== undefined && a.text !== a.el)) continue;
          const bs = s.bonds.filter(b => b.a === a.id || b.b === a.id);
          if (bs.some(b => b.k === "coord" || b.k === "ts") || s.dots.some(d => Math.hypot(d.x - a.x, d.y - a.y) < 0.75)) continue;
          const fc = V[a.el] - 2 * a.lp.length - bs.reduce((t, b) => t + b.o, 0);
          if (fc !== (a.q ?? 0)) bad.add(`${r.a}${r.b ? "+" + r.b : ""} ${id}: ${a.el} q ${a.q ?? 0}, Formalladung ${fc}`);
        }
      }
    }
  }
  assert.deepEqual([...bad].slice(0, 8), []);
}, 120_000);

test("Pfeile gut sichtbar: H⁺-Wanderung mit einem Bogen (nicht winzig), Abgangsgruppe – Pfeil endet am abgehenden O bzw. Cl; Ziegler-Natta-Butadien: neue Bindung nicht über ein H; kationisch außen um das C", async () => {
  const { curlyArrow } = await import("@lern/chem-ui");
  for (const r of [{ art: "kond", a: "terephthalsaeure", b: "ethandiol" }, { art: "kond", a: "milchsaeure" }, { art: "kond", a: "adipoylchlorid", b: "hexandiamin" }, { art: "kond", a: "adipinsaeure", b: "hexandiamin" }] as Recipe[]) {
    const clip = replay(r, []).run("join");
    for (const k of clip.filter(x => x.arrows?.length)) for (const ar of k.arrows!) {
      const a = anchorPt(k.snap, ar.from)!, b = anchorPt(k.snap, ar.to)!;
      assert.ok(Math.hypot(b.x - a.x, b.y - a.y) >= 0.55, `${r.a}: Pfeil zu kurz (${Math.hypot(b.x - a.x, b.y - a.y).toFixed(2)})`);
      // Spitze an einem Atom bzw. einer Bindung, nicht auf einem fremden beschrifteten Atom
      for (const at of k.snap.atoms) {
        if ((at.op ?? 1) < 0.5 || !(at.text ?? at.el) || ("a" in ar.to && ar.to.a === at.id) || ("b" in ar.to && ar.to.b.includes(at.id))) continue;
        assert.ok(Math.hypot(at.x - b.x, at.y - b.y) > 0.3, `${r.a}: Pfeilspitze auf ${at.text ?? at.el}`);
      }
    }
  }
  const zn = replay({ art: "poly", a: "butadien", method: "zn" }, ["act", "add:butadien"]);
  const clip = zn.run("add:butadien"), k = clip.find(x => (x.arrows?.length ?? 0) === 3)!;
  const ts = k.snap.bonds.filter(b => b.k === "ts");
  for (const b of ts) {
    const A = k.snap.atoms.find(a => a.id === b.a)!, B = k.snap.atoms.find(a => a.id === b.b)!;
    for (const h of k.snap.atoms.filter(a => a.el === "H" && a.id !== b.a && a.id !== b.b)) {
      const t = Math.max(0, Math.min(1, ((h.x - A.x) * (B.x - A.x) + (h.y - A.y) * (B.y - A.y)) / ((B.x - A.x) ** 2 + (B.y - A.y) ** 2)));
      assert.ok(Math.hypot(A.x + t * (B.x - A.x) - h.x, A.y + t * (B.y - A.y) - h.y) > 0.35, `Ziegler-Natta: Übergangsbindung über ${h.id}`);
    }
  }
  const kat = replay({ art: "poly", a: "isobuten", method: "bf3" }, ["acid", "add:isobuten"]).run("hplus").find(x => x.arrows?.length)!;
  const ar = kat.arrows![0], C = kat.snap.atoms.find(a => "b" in ar.from && a.id === ar.from.b[0])!;
  const g = curlyArrow(anchorPt(kat.snap, ar.from)!, anchorPt(kat.snap, ar.to)!, { bend: ar.bend });
  assert.ok(Math.hypot(g.mid.x - C.x, g.mid.y - C.y) > 0.4, "kationisch: Pfeil läuft durch das C");
});

test("Nacheinander mit kurzkettigem Monomer: Karte wie Atom-Ansicht – erst das passende Monomer als eigenes Polymer, das andere nur in kurzen eigenen Ketten", () => {
  let n = 0;
  for (const me of METHOD_IDS) for (const a of VINYLS.map(v => v.id)) for (const b of VINYLS.map(v => v.id)) {
    if (a === b) continue;
    const fits = [compat(a, me).fit, compat(b, me).fit];
    if (!(fits.includes("short") && fits.includes("ok"))) continue;
    const out = polymerise([a, b], me, true);
    assert.ok(out.product && !out.product.copo, `${a}→${b}/${me}: Karte sagt Copolymer`);
    assert.ok(!/nur wenig eingebaut/.test(out.why), `${a}→${b}/${me}: ${out.why}`);
    assert.match(out.why, /Erst/);
    // Atom-Ansicht: keine Kette aus beiden Monomeren
    const r: Recipe = { art: "poly", a, b, seq: true, method: me };
    const m = makeMech(r);
    for (let id = nextAuto(m, r), k = 0; id && k < 30; id = nextAuto(m, r), k++) {
      m.run(id);
      assert.ok(new Set(m.status().beads.filter(x => x.kind === "unit").map(x => x.mono)).size <= 1, `${a}→${b}/${me}: Atom-Ansicht mischt`);
    }
    n++;
  }
  assert.ok(n >= 20, `${n} Ansätze`);
});

test("Radikalisch stark ungleich schnelle Monomere: fast nur das schnelle (Styrol + Vinylacetat → PS), ETFE alternierend – Karte, Atom-Ansicht und Reaktor", () => {
  const sv = polymerise(["styrol", "vinylacetat"], "dbpo");
  assert.strictEqual(sv.product?.abbr, "PS");
  assert.match(sv.why, /viel schneller/);
  assert.match(sv.why, /bremst die Polymerisation des Vinylacetats/);
  for (const [x, y, f] of [["mma", "vinylacetat", "PMMA"], ["styrol", "vinylchlorid", "PS"], ["butadien", "vinylchlorid", "BR"], ["acrylnitril", "ethen", "PAN"]] as [VinylId, VinylId, string][])
    assert.strictEqual(polymerise([x, y], "dbpo").product?.abbr, f, `${x}+${y}`);
  // bekannte statistische Copolymere bleiben (SAN, SBR, EVA)
  assert.strictEqual(polymerise(["styrol", "acrylnitril"], "dbpo").product?.copo, "stat");
  assert.strictEqual(polymerise(["ethen", "vinylacetat"], "dbpo").product?.abbr, "EVA");
  const etfe = polymerise(["ethen", "tfe"], "dbpo").product!;
  assert.strictEqual(etfe.abbr, "ETFE"); assert.strictEqual(etfe.copo, "alt");
  // Atom-Ansicht: erst nur Styrol; ETFE abwechselnd
  const run = (r: Recipe) => { const m = makeMech(r); for (let id = nextAuto(m, r), k = 0; id && k < 20; id = nextAuto(m, r), k++) m.run(id); return m.status().beads.filter(b => b.kind === "unit").map(b => b.mono); };
  const s1 = run({ art: "poly", a: "vinylacetat", b: "styrol", method: "dbpo" });
  assert.deepEqual(s1.slice(0, 3), ["styrol", "styrol", "styrol"], s1.join(","));
  // nur die erste Kette (nach dem Abbruch durch Rekombination hängt die zweite Kette dran)
  const s2 = run({ art: "poly", a: "ethen", b: "tfe", method: "dbpo" }).slice(0, 6);
  for (let i = 1; i < s2.length; i++) assert.notStrictEqual(s2[i], s2[i - 1], s2.join(","));
  // Reaktor: am Anfang fast nur Styrol eingebaut
  const R = new Reactor({ art: "poly", a: "styrol", b: "vinylacetat", method: "dbpo" }, 48, 52, 5); R.run("start"); R.advance(700);
  const used = R.beads.filter(b => b.kind === "mono" && b.nb.length);
  assert.ok(used.filter(b => b.m === "styrol").length > 5 * Math.max(1, used.filter(b => b.m === "vinylacetat").length), "Reaktor: Vinylacetat zu oft eingebaut");
}, 60_000);

test("Isobuten + Butadien kationisch: wenig Dien bringt C=C – vulkanisierbar wie Butylkautschuk (nicht „nicht vernetzbar“)", () => {
  const p = polymerise(["isobuten", "butadien"], "bf3").product!;
  assert.strictEqual(p.rubber, "butyl");
  assert.strictEqual(polymerise(["isobuten"], "bf3").product!.rubber, "nein");
});
