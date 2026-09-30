import { test, assert } from "vitest";
import { REACTIONS, MOL3D, ionText } from "@lern/chem";
import { layout2D, substanceInfo } from "../src/Substance.tsx";

const ALL = [...new Set(REACTIONS.flatMap(r => [...r.left, ...r.right]))];

test("jeder Stoff ist eingeordnet; Moleküle haben eine Strukturformel ohne überlappende Atome", () => {
  for (const f of ALL) {
    const s = substanceInfo(f);
    assert.ok(s.name && s.parts.length, f);
    if (s.kind !== "molekuel" || !MOL3D[f]) continue;
    const l = layout2D(f);
    if (f === "P4O10") { assert.strictEqual(l, null, "Käfig: nur 3D"); continue; }
    assert.ok(l, `${f}: keine Strukturformel`);
    assert.strictEqual(l.atoms.length, MOL3D[f].atoms.length, f);
    for (const [i, j] of l.bonds) {
      const d = Math.hypot(l.atoms[i][1] - l.atoms[j][1], l.atoms[i][2] - l.atoms[j][2]);
      assert.ok(d > .5 && d < 1.6, `${f}: Bindung ${i}-${j} ${d.toFixed(2)}`);
    }
    for (let i = 0; i < l.atoms.length; i++) for (let j = i + 1; j < l.atoms.length; j++) {
      const d = Math.hypot(l.atoms[i][1] - l.atoms[j][1], l.atoms[i][2] - l.atoms[j][2]);
      assert.ok(d > .45, `${f}: Atome ${i} und ${j} überlappen (${d.toFixed(2)})`);
    }
  }
});

test("Einordnung: Moleküle, Metalle, Ionenverbindungen mit ihren Ionen", () => {
  assert.strictEqual(substanceInfo("CH4").kind, "molekuel");
  assert.strictEqual(substanceInfo("O2").kind, "molekuel");
  assert.strictEqual(substanceInfo("H2SO4").kind, "molekuel");
  assert.strictEqual(substanceInfo("Mg").kind, "metall");
  assert.strictEqual(substanceInfo("S").kind, "element");
  const ions = (f: string) => substanceInfo(f).ions?.map(ionText).join(" ");
  assert.strictEqual(ions("NaCl"), "Na⁺ Cl⁻");
  assert.strictEqual(ions("MgO"), "Mg²⁺ O²⁻");
  assert.strictEqual(ions("CaCO3"), "Ca²⁺ CO₃²⁻");
  assert.strictEqual(ions("Al2(SO4)3"), "Al³⁺ SO₄²⁻");
  assert.strictEqual(substanceInfo("Fe2O3").kind, "ionen");
});

test("Element oder Verbindung, Teilchenart", () => {
  const k = (f: string) => { const s = substanceInfo(f); return `${s.klass}/${s.kind}`; };
  assert.strictEqual(k("O3"), "element/molekuel");
  assert.strictEqual(k("O2"), "element/molekuel");
  assert.strictEqual(k("He"), "element/atome");
  assert.strictEqual(k("C"), "element/element");
  assert.strictEqual(k("Fe"), "element/metall");
  assert.strictEqual(k("H2O2"), "verbindung/molekuel");
  assert.strictEqual(k("C12H26"), "verbindung/molekuel");
  assert.strictEqual(k("NaCl"), "verbindung/ionen");
});
