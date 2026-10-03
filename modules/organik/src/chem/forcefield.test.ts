import { test, assert } from "vitest";
import { storedFor } from "@lern/chem-ui";
import { setup, embed, stereoMatches } from "@lern/chem/mmff";
import { EXAMPLES, exampleMol } from "./examples.ts";
import { smilesMol } from "./smiles.ts";
import { ffInput } from "./forcefield.ts";

test("Kraftfeld: jedes Beispielmolekül hat MMFF94-Typen", () => {
  for (const g of EXAMPLES) for (const smi of g.items) {
    const inp = ffInput(exampleMol(smi));
    assert.ok(setup(inp), smi);
  }
});

test("Kraftfeld: E/Z wie gezeichnet bleibt in 3D erhalten", () => {
  for (const smi of ["C/C=C/C", "C/C=C\\C", "C/C=C/C(=O)O", "Cl/C=C\\Cl"]) {
    const inp = ffInput(smilesMol(smi));
    assert.equal(inp.stereo!.d.length, 1, smi);
    const s = setup(inp)!;
    const r = embed(s.typed, s.ff, inp.stereo!, 1);
    assert.ok(r.stereoOk && stereoMatches(r.x, inp.stereo!), smi);
  }
  // E und Z unterscheiden sich
  const e = ffInput(smilesMol("C/C=C/C")).stereo!.d[0][4], z = ffInput(smilesMol("C/C=C\\C")).stereo!.d[0][4];
  assert.notEqual(e, z);
});

test("hinterlegte Strukturen (gemessene Werte) werden auch für gezeichnete Moleküle gefunden", () => {
  for (const smi of ["CCO", "CC(=O)O", "CC(C)=O", "C1=CC=CC=C1", "CC=O", "OC=O", "CC", "C=C", "C#C", "CO", "ClC(Cl)Cl"])
    assert.ok(storedFor(ffInput(smilesMol(smi))), smi);
  // nicht hinterlegt → in der App mit dem Kraftfeld
  for (const smi of ["CCCO", "CC(C)O", "CC1=CC=CC=C1"]) assert.equal(storedFor(ffInput(smilesMol(smi))), null, smi);
});
