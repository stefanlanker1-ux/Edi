import { describe, expect, test } from "vitest";
import { EXAMPLES, exampleMol } from "./examples.ts";
import { name } from "./naming.ts";
import { addRing, append, connect, cycleBond, replace, start } from "./edit.ts";
import type { Mol } from "./mol.ts";
import { smilesMol } from "./smiles.ts";
import { orient } from "./layout.ts";
import { U, viewBoxOf } from "../components/MolSvg.tsx";

const minDist = (m: Mol) => {
  let d = Infinity;
  for (const a of m.atoms) for (const b of m.atoms) if (a.id < b.id) d = Math.min(d, Math.hypot(a.x - b.x, a.y - b.y));
  return d;
};

describe("Beispiele", () => {
  const all = EXAMPLES.flatMap(g => g.items);
  test.each(all)("%s: benennbar, Atome mit Abstand, Bindungen gleich lang", s => {
    const m = exampleMol(s);
    expect(name(m).ok).toBe(true);
    if (m.atoms.length > 1) expect(minDist(m)).toBeGreaterThan(0.7);
    for (const b of m.bonds) {
      const p = m.atoms.find(a => a.id === b.a)!, q = m.atoms.find(a => a.id === b.b)!;
      expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThan(0.9);
      expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeLessThan(1.1);
    }
  });
  test("keine doppelten Beispiele", () => expect(new Set(all).size).toBe(all.length));
});

describe("Gedrängte Moleküle", () => {
  // vorher lagen Halogene übereinander (Perchlorhexan 0,35, Heptachlorbutan 0,52)
  test.each([
    "ClC(Cl)(Cl)C(Cl)(Cl)C(Cl)(Cl)C(Cl)(Cl)C(Cl)(Cl)C(Cl)(Cl)Cl", "ClC(Cl)(Cl)C(Cl)(Cl)C(Cl)(Cl)C(Cl)(Cl)Cl", "ClC(Cl)(Cl)C(Cl)(Cl)C(Cl)(Cl)C",
    "FC(F)(F)C(F)(F)C(F)(F)C(F)(F)F", "BrC(Br)(Br)C(Br)(Br)Br", "CC(C)(C)C(C)(C)C(C)(C)C(C)(C)C", "OC(=O)C(C)(C)C(O)C(O)C(O)C",
    // ganze Äste und Ringe als Ast werden gedreht (vorher 0,35 bzw. 0)
    "CCC(CC)(CC)C(C)C(C)(C)CC", "C1CCCCC1C1(C2CCCCC2)CCCCCCC1",
  ])("%s: Atome mit Abstand", s => {
    expect(minDist(smilesMol(s))).toBeGreaterThan(0.7);
  });
});

test("orient: in 30°-Schritten gedreht, Bindungen gleich lang, passt besser in die Fläche", () => {
  const m = smilesMol("CCCCCCC"), r = orient({ ...m, atoms: m.atoms.map(a => ({ ...a, x: -a.y, y: a.x })) }, 3);
  const w = (x: Mol) => Math.max(...x.atoms.map(a => a.x)) - Math.min(...x.atoms.map(a => a.x));
  const h = (x: Mol) => Math.max(...x.atoms.map(a => a.y)) - Math.min(...x.atoms.map(a => a.y));
  expect(w(r)).toBeGreaterThan(h(r));
  for (const b of r.bonds) {
    const p = r.atoms.find(a => a.id === b.a)!, q = r.atoms.find(a => a.id === b.b)!;
    expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeCloseTo(1, 2);
  }
});

test("viewBoxOf: jede Beschriftung liegt ganz im Bild, auch vergrößert (Aufgabenbild Level 4)", () => {
  for (const s of ["NC(C)C(Cl)C(C)C=O", "OC(=O)C(O)CC(C)CC", "CC(N)CCC(=O)O"]) for (const k of [1, 1.4, 1.8]) {
    const m = smilesMol(s), [x, y, w, h] = viewBoxOf(m, "skelett", 3, 2, k).map(v => v / U);
    for (const a of m.atoms.filter(a => a.el !== "C")) {
      expect(a.y - 0.22 * k, s).toBeGreaterThan(y);
      expect(a.y + 0.22 * k, s).toBeLessThan(y + h);
      expect(a.x - 0.2 * k, s).toBeGreaterThan(x);
      expect(a.x + 0.2 * k, s).toBeLessThan(x + w);
    }
  }
});

describe("Zeichnen", () => {
  test("Kette durch Antippen, Zickzack", () => {
    let m = start("C");
    for (let i = 0; i < 3; i++) m = append(m, i, "C")!;
    expect((name(m) as { name: string }).name).toBe("Butan");
    expect(minDist(m)).toBeGreaterThan(0.9);
    // Zickzack: C1 und C3 auf gleicher Höhe
    expect(Math.abs(m.atoms[0].y - m.atoms[2].y)).toBeLessThan(0.01);
  });
  test("Verzweigen, Element tauschen, Doppelbindung", () => {
    let m = start("C");
    m = append(m, 0, "C")!; m = append(m, 1, "C")!; m = append(m, 1, "C")!;
    expect((name(m) as { name: string }).name).toBe("2-Methylpropan");
    m = replace(m, 3, "O")!;
    expect((name(m) as { name: string }).name).toBe("Propan-2-ol");
    const d = cycleBond(m, 0, 1)!;
    expect((name(d) as { name: string }).name).toBe("Prop-1-en-2-ol");
    expect(cycleBond(cycleBond(d, 0, 1)!, 0, 1)).not.toBeNull();
  });
  test("Wertigkeit: nichts an volle Atome", () => {
    let m = start("Cl");
    m = append(m, 0, "C")!;
    expect(append(m, 0, "C")).toBeNull();
    expect(replace(m, 1, "Cl")).not.toBeNull();
    const o = append(start("O"), 0, "C")!;
    expect(cycleBond(o, 0, 1)!.bonds[0].order).toBe(2);
    expect(connect(o, 0, 1)!.bonds[0].order).toBe(2);
  });
  test("Ringe", () => {
    const b = addRing({ atoms: [], bonds: [] }, null, "benzol")!;
    expect((name(b) as { name: string }).name).toBe("Benzen");
    const t = addRing(start("C"), 0, "benzol")!;
    expect((name(t) as { name: string }).name).toBe("Methylbenzen");
    const c = addRing(start("O"), 0, "ring5")!;
    expect((name(c) as { name: string }).name).toBe("Cyclopentanol");
    expect(minDist(t)).toBeGreaterThan(0.9);
  });
});
