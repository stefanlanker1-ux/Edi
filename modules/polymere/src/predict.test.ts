// Vorhersage in der Atom-Ansicht: jede Frage hat genau eine richtige Antwort, jede falsche eine Rückmeldung,
// die richtige Antwort passt zum Ablauf (Fachlogik), kurze Texte.
import { test, assert } from "vitest";
import { METHODS, STEPS, VINYLS, type MethodId } from "./chem/data.ts";
import { makeMech, nextAuto } from "./chem/mech/index.ts";
import { predict, type Prediction } from "./chem/mech/predict.ts";
import type { Recipe } from "./chem/mech/types.ts";

function recipes(copo: boolean): Recipe[] {
  const out: Recipe[] = [];
  for (const v of VINYLS) for (const me of METHODS.map(m => m.id)) {
    out.push({ art: "poly", a: v.id, method: me });
    if (copo) for (const w of VINYLS) if (w.id !== v.id) out.push({ art: "poly", a: v.id, b: w.id, seq: false, method: me as MethodId });
  }
  for (const art of ["kond", "add"] as const) {
    const ms = STEPS.filter(s => s.arts.includes(art)).map(s => s.id);
    for (const a of ms) { out.push({ art, a }); for (const b of ms) if (b !== a) out.push({ art, a, b }); }
  }
  return out;
}

/** alle Fragen entlang des automatischen Ablaufs, dazu jede angebotene Aktion an jeder Stelle */
function questions(copo: boolean) {
  const out: { r: Recipe; acts: string[]; id: string; p: Prediction }[] = [];
  for (const r of recipes(copo)) {
    const m = makeMech(r), acts: string[] = [];
    for (let k = 0; k < 8; k++) {
      for (const a of m.actions()) { const p = predict(r, acts, a.id); if (p) out.push({ r, acts: [...acts], id: a.id, p }); }
      const id = nextAuto(m, r);
      if (!id) break;
      m.run(id); acts.push(id);
    }
  }
  return out;
}

const words = (s: string) => s.split(/[.!?]\s+/).map(x => x.split(/\s+/).filter(w => /\p{L}/u.test(w)).length);

test("Vorhersage: eine richtige Antwort, Rückmeldung zu jeder falschen, kurze Texte", () => {
  const qs = questions(true);
  assert.ok(qs.length > 2000, `${qs.length} Fragen`);
  // richtige Antwort nicht immer oben (gemischt, außer der Ergebnis-Skala)
  const mixed = qs.filter(x => !x.p.options.some(o => o.text === "wird eingebaut" || o.text === "wird verknüpft"));
  const first = new Set(mixed.map(x => x.p.ask)).size;
  const top = new Set(mixed.filter(x => x.p.options[0].ok).map(x => x.p.ask)).size;
  assert.ok(top < first * 0.7, `${top} von ${first} Fragen mit der richtigen Antwort oben`);
  for (const { r, id, p } of qs) {
    const where = `${JSON.stringify(r)} ${id}`;
    assert.strictEqual(p.options.filter(o => o.ok).length, 1, where);
    assert.ok(p.options.length >= 2 && p.options.length <= 4, where);
    assert.ok(p.ask && p.ok, where);
    for (const o of p.options) {
      assert.ok(o.text.length <= 26, `${where}: Antwort zu lang „${o.text}“`);
      if (!o.ok) assert.ok(o.why, `${where}: keine Rückmeldung zu „${o.text}“`);
    }
    for (const s of [p.ask, p.ok, ...p.options.map(o => o.why ?? "")]) for (const n of words(s)) assert.ok(n <= 22, `${where}: Satz zu lang „${s}“`);
  }
}, 120_000);

test("Vorhersage: richtige Antwort folgt der Fachlogik, je Aktion höchstens zweimal gefragt", () => {
  const right = (r: Recipe, acts: string[], id: string) => predict(r, acts, id)!.options.find(o => o.ok)!.text;
  const sty: Recipe = { art: "poly", a: "styrol", method: "dbpo" };
  assert.strictEqual(right(sty, [], "heat"), "je eins zu jedem O");
  assert.strictEqual(right(sty, ["heat"], "add:styrol"), "wird eingebaut");
  assert.strictEqual(right(sty, ["heat", "add:styrol"], "add:styrol"), "am neuen Kettenende");
  assert.strictEqual(predict(sty, ["heat", "add:styrol", "add:styrol"], "add:styrol"), null);
  // Propen radikalisch: H-Atom wird abgerissen – die Kette endet
  assert.strictEqual(right({ art: "poly", a: "propen", method: "dbpo" }, ["heat"], "add:propen"), "Kette endet");
  // Ziegler-Natta: polares Monomer blockiert das Titan, Isobuten zu sperrig, Einbau zwischen Titan und Kette
  assert.strictEqual(right({ art: "poly", a: "vinylchlorid", method: "zn" }, ["act"], "add:vinylchlorid"), "Titan wird vergiftet");
  assert.strictEqual(right({ art: "poly", a: "isobuten", method: "zn" }, ["act"], "add:isobuten"), "keine Reaktion");
  assert.strictEqual(right({ art: "poly", a: "propen", method: "zn" }, ["act", "add:propen"], "add:propen"), "zwischen Titan und Kette");
  // Stufenwachstum: Nebenprodukt bzw. keine Reaktion
  assert.strictEqual(right({ art: "kond", a: "terephthalsaeure", b: "ethandiol" }, [], "join"), "Verknüpfung + H₂O");
  assert.strictEqual(right({ art: "kond", a: "adipoylchlorid", b: "hexandiamin" }, [], "join"), "Verknüpfung + HCl");
  assert.strictEqual(right({ art: "add", a: "hdi", b: "butandiol" }, [], "join"), "Verknüpfung, sonst nichts");
  assert.strictEqual(right({ art: "kond", a: "ethandiol" }, [], "join"), "keine Reaktion");
  const pet: Recipe = { art: "kond", a: "terephthalsaeure", b: "ethandiol" };
  assert.strictEqual(right(pet, ["join"], "add:ethandiol"), "keine Reaktion");
  assert.strictEqual(right(pet, ["join"], "add:terephthalsaeure"), "wird verknüpft");
});
