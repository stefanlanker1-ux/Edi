import { test, assert } from "vitest";

import { METHODS, STEPS, VINYLS, stepMono, vinyl, type MethodId, type StepId, type VinylId } from "./chem/data.ts";
import { compat, polymerise, stepReact } from "./chem/rules.ts";
import { makeMech, nextAuto, replay } from "./chem/mech/index.ts";
import type { Recipe } from "./chem/mech/types.ts";
import { Reactor } from "./chem/reactor.ts";

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
      const want = st.active === "rad" ? 1 : st.active === "an" && st.n > 0 ? 2 : 0;
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
