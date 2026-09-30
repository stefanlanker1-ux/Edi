import { test, assert } from "vitest";
import { MOL3D, REACTIONS, REACTION_BY_ID, atoms3D, atomRadius as radius, hasShape, isMolecular, parseFormula, visibleShare } from "@lern/chem";
import { shapeOf } from "@lern/chem-ui";
import { hasModel } from "./Molecules.tsx";
import { START } from "../store.ts";

const species = new Set(REACTIONS.flatMap(r => [...r.left, ...r.right]));

test("jeder Stoff der Reaktionen hat ein Teilchenbild mit den richtigen Atomen", () => {
  for (const f of species) {
    const count: Record<string, number> = {};
    for (const [el] of shapeOf(f)) count[el] = (count[el] ?? 0) + 1;
    assert.deepEqual(count, parseFormula(f), f);
    assert.ok(hasShape(f), `${f}: eigene Anordnung fehlt`);
    // Kugeln dürfen sich überlappen (Kalottenmodell), aber nie ineinander verschwinden
    const s = shapeOf(f);
    for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
      const d = Math.hypot(s[i][1] - s[j][1], s[i][2] - s[j][2], s[i][3] - s[j][3]);
      assert.ok(d > .45 * Math.max(radius(s[i][0]), radius(s[j][0])), `${f}: ${s[i][0]}–${s[j][0]} zu nah (${d.toFixed(2)})`);
    }
  }
});

test("Teilchenbild nur für Moleküle – Salze und Metalle ohne Kalottenmodell", () => {
  assert.ok(START.every(id => hasModel(REACTION_BY_ID[id])), "Start-Beispiele brauchen ein Teilchenbild");
  for (const f of ["Zn", "ZnCl2", "NaCl", "MgO", "Fe2O3", "NaOH", "NH4Cl"]) assert.ok(!isMolecular(f), f);
  for (const f of ["H2O", "HCl", "CO2", "CH4", "H2SO4", "NH3", "C", "S"]) assert.ok(isMolecular(f), f);
});

test("Moleküle aus den 3D-Daten: gebundene Kugeln überlappen (nichts fällt auseinander)", () => {
  for (const f of species) {
    const d = MOL3D[f];
    // P₄O₁₀: feste ebene Zeichnung, die O-Brücken der Außenkanten liegen bewusst frei zwischen zwei P
    if (!d || d.flatFixed) continue;
    const s = atoms3D(f);
    for (const [i, j] of d.bonds) {
      const r = Math.hypot(s[i][1] - s[j][1], s[i][2] - s[j][2], s[i][3] - s[j][3]);
      assert.ok(r < radius(s[i][0]) + radius(s[j][0]), `${f}: Bindung ${i}–${j} klafft`);
    }
  }
});

test("Teilchenbild: jedes Atom jedes Moleküls ist gut zu sehen (≥ 65 %; P₄ als Tetraeder und der P₄O₁₀-Käfig ≥ 55 %)", () => {
  for (const f of species) {
    if (!isMolecular(f)) continue;
    const v = visibleShare(atoms3D(f));
    assert.ok(Math.min(...v) >= (f === "P4" || f === "P4O10" ? .55 : .65), `${f}: ein Atom nur zu ${Math.round(Math.min(...v) * 100)} % sichtbar`);
  }
});
