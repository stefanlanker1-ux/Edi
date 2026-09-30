import { test, assert } from "vitest";
import { KNOWN, KNOWN_BY_ID as K, toMolecule, type Molecule } from "../src/molecules.ts";
import { wedgeLayout } from "../src/wedge.ts";
import { embed3D, type Vec } from "../src/geometry3d.ts";

const kinds = (id: string) => wedgeLayout(toMolecule(K[id])).bonds.map(b => b.kind).sort().join(",");

/** Molekül aus Bindungsliste (Rasterlage spielt für die Keilstrichformel keine Rolle) */
function mol(els: string[], bonds: [number, number, number?][]): Molecule {
  return { atoms: els.map((el, i) => ({ id: i + 1, el, x: i, y: 0 })), bonds: bonds.map(([a, b, o]) => ({ a: a + 1, b: b + 1, order: o ?? 1 })) };
}
const EXTRA: Record<string, Molecule> = {
  propan: mol(["C", "C", "C", "H", "H", "H", "H", "H", "H", "H", "H"], [[0, 1], [1, 2], [0, 3], [0, 4], [0, 5], [1, 6], [1, 7], [2, 8], [2, 9], [2, 10]]),
  cyclobutan: mol(["C", "C", "C", "C", "H", "H", "H", "H", "H", "H", "H", "H"], [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [0, 5], [1, 6], [1, 7], [2, 8], [2, 9], [3, 10], [3, 11]]),
  dichlormethan: mol(["C", "Cl", "Cl", "H", "H"], [[0, 1], [0, 2], [0, 3], [0, 4]]),
  methylamin: mol(["C", "N", "H", "H", "H", "H", "H"], [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [1, 6]]),
  ameisensaeure: mol(["C", "O", "O", "H", "H"], [[0, 1, 2], [0, 2], [2, 3], [0, 4]]),
  hydroxylamin: mol(["N", "O", "H", "H", "H"], [[0, 1], [0, 2], [0, 3], [1, 4]]),
};

test("ebene und lineare Moleküle: nur Striche, echte Winkel", () => {
  for (const id of ["H2O", "H2S", "CO2", "C2H4", "C2H2", "HCN", "CH2O", "HCl", "N2"]) assert.notMatch(kinds(id), /wedge|dash/, id);
  const w = wedgeLayout(toMolecule(K.H2O));
  const [o, h1, h2] = w.atoms;
  const ang = (Math.acos(((h1.x - o.x) * (h2.x - o.x) + (h1.y - o.y) * (h2.y - o.y)) / (Math.hypot(h1.x - o.x, h1.y - o.y) * Math.hypot(h2.x - o.x, h2.y - o.y))) * 180) / Math.PI;
  assert.approximately(ang, 104.5, 0.5);
  // gewinkelt nach unten geöffnet, freie Paare oben
  assert.isBelow(o.y, h1.y);
  for (const a of w.lone.get(o.id)!) assert.isAbove(a, 180);
});

test("Tetraeder: zwei Striche, ein Keil, ein gestrichelter Keil", () => {
  for (const id of ["CH4", "CCl4", "CH3Cl"]) assert.equal(kinds(id), "dash,plain,plain,wedge", id);
  // Cl liegt in der Papierebene
  const w = wedgeLayout(toMolecule(K.CH3Cl));
  const cl = w.atoms.find(a => a.el === "Cl")!;
  assert.equal(w.bonds.find(b => b.a === cl.id || b.b === cl.id)!.kind, "plain");
});

test("Pyramide (NH₃, PH₃): freies Paar oben, ein H nach hinten", () => {
  for (const id of ["NH3", "PH3"]) {
    assert.equal(kinds(id), "dash,plain,plain", id);
    const w = wedgeLayout(toMolecule(K[id]));
    assert.deepEqual(w.lone.get(w.atoms[0].id), [270]);
    for (const h of w.atoms.slice(1)) assert.isAbove(h.y, w.atoms[0].y);
  }
});

test("Ketten: jedes Tetraeder-C mit Keil und gestricheltem Keil", () => {
  for (const [id, m] of [["C2H6", toMolecule(K.C2H6)], ["propan", EXTRA.propan]] as const) {
    const w = wedgeLayout(m);
    for (const c of w.atoms.filter(a => a.el === "C")) {
      const at = w.bonds.filter(b => b.from === c.id && b.kind !== "plain").map(b => b.kind).sort();
      assert.deepEqual(at, ["dash", "wedge"], `${id} C${c.id}`);
    }
  }
});

test("keine Überlappungen, keine sich kreuzenden Bindungen", () => {
  const all: [string, Molecule][] = [...KNOWN.map(k => [k.id, toMolecule(k)] as [string, Molecule]), ...Object.entries(EXTRA)];
  for (const [id, m] of all) {
    const w = wedgeLayout(m);
    for (const a of w.atoms) assert.isTrue(Number.isFinite(a.x) && Number.isFinite(a.y), id);
    for (let i = 0; i < w.atoms.length; i++) for (let j = i + 1; j < w.atoms.length; j++) {
      const d = Math.hypot(w.atoms[i].x - w.atoms[j].x, w.atoms[i].y - w.atoms[j].y);
      assert.isAbove(d, 0.5, `${id}: ${w.atoms[i].el}${w.atoms[i].id} / ${w.atoms[j].el}${w.atoms[j].id}`);
    }
    const P = new Map(w.atoms.map(a => [a.id, a]));
    const o = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    for (const A of w.bonds) for (const B of w.bonds) {
      if ([A.a, A.b].some(x => x === B.a || x === B.b)) continue;
      const [p, q, r, s] = [P.get(A.a)!, P.get(A.b)!, P.get(B.a)!, P.get(B.b)!];
      assert.isFalse(o(p, q, r) * o(p, q, s) < 0 && o(r, s, p) * o(r, s, q) < 0, `${id}: Bindungen kreuzen sich`);
    }
    // Mehrfachbindungen nie als Keil
    for (const b of w.bonds) if (b.order > 1) assert.equal(b.kind, "plain", id);
  }
});

test("Ethan gestaffelt (Diederwinkel H–C–C–H 60° / 180°)", () => {
  const e = embed3D(toMolecule(K.C2H6));
  const P = new Map(e.atoms.map(a => [a.id, a.pos]));
  const [c1, c2] = e.atoms.filter(a => a.el === "C").map(a => a.id);
  const hs = (c: number) => e.bonds.filter(b => (b.a === c || b.b === c) && e.atoms.find(a => a.id === (b.a === c ? b.b : b.a))!.el === "H").map(b => (b.a === c ? b.b : b.a));
  const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const u = sub(P.get(c2)!, P.get(c1)!);
  for (const h1 of hs(c1)) for (const h2 of hs(c2)) {
    const n1 = cross(u, sub(P.get(h1)!, P.get(c1)!)), n2 = cross(u, sub(P.get(h2)!, P.get(c2)!));
    const dih = (Math.acos(Math.max(-1, Math.min(1, dot(n1, n2) / Math.hypot(...n1) / Math.hypot(...n2)))) * 180) / Math.PI;
    assert.isTrue(Math.abs(dih - 60) < 2 || Math.abs(dih - 180) < 2, `Diederwinkel ${dih.toFixed(1)}°`);
  }
});
