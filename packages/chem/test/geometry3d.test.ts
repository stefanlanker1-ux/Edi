import { test, assert } from "vitest";
import { KNOWN, KNOWN_BY_ID as K, toMolecule, en } from "../src/molecules.ts";
import { embed3D, storedMol3D, dipoleVector, angleDeg, type Vec } from "../src/geometry3d.ts";
import { MOL3D } from "../src/mol3d.ts";

const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dist = (a: Vec, b: Vec) => Math.hypot(...sub(a, b));

test("Bindungswinkel nach EPA", () => {
  const ang = (id: string) => embed3D(toMolecule(K[id])).angles[0].deg;
  assert.approximately(ang("CH4"), 109.47, 0.1);
  assert.approximately(ang("NH3"), 107, 0.1);
  assert.approximately(ang("H2O"), 104.5, 0.1);
  assert.approximately(ang("CO2"), 180, 0.1);
  assert.approximately(ang("HCN"), 180, 0.1);
});

test("idealisiert: Idealwinkel des EPA-Modells", () => {
  const ang = (id: string) => embed3D(toMolecule(K[id]), "ideal").angles[0];
  for (const id of ["CH4", "NH3", "H2O", "H2S", "PH3"]) {
    assert.approximately(ang(id).deg, 109.47, 0.1);
    assert.equal(ang(id).label, "109,5°");
  }
  assert.approximately(ang("C2H4").deg, 120, 0.1);
  assert.approximately(ang("CH2O").deg, 120, 0.1);
});

test("real: gemessene Winkel mit Beschriftung", () => {
  const ang = (id: string) => embed3D(toMolecule(K[id]), "real").angles[0];
  assert.equal(ang("H2O").label, "104,5°");
  assert.equal(ang("NH3").label, "107°");
  assert.approximately(ang("H2S").deg, 92.1, 0.1);
  assert.approximately(ang("PH3").deg, 93.5, 0.1);
  assert.equal(ang("CH4").label, "109,5°");
  // Ethen/Methanal: Winkel H–C–H
  assert.approximately(ang("C2H4").deg, 117.4, 0.1);
  assert.approximately(ang("CH2O").deg, 116.5, 0.1);
  const h2o2 = embed3D(toMolecule(K.H2O2), "real").angles;
  assert.ok(h2o2.every(a => Math.abs(a.deg - 94.8) < 0.1));
});

test("alle Moleküle: sinnvolle Abstände, keine überlappenden Atome", () => {
  for (const k of KNOWN) for (const mode of ["real", "ideal"] as const) {
    const e = embed3D(toMolecule(k), mode);
    for (let i = 0; i < e.atoms.length; i++) for (let j = i + 1; j < e.atoms.length; j++) {
      const d = dist(e.atoms[i].pos, e.atoms[j].pos);
      assert.ok(d > 0.6, `${k.name}: Atome ${e.atoms[i].el}/${e.atoms[j].el} zu nah (${d.toFixed(2)})`);
    }
    for (const b of e.bonds) {
      const d = dist(e.atoms.find(a => a.id === b.a)!.pos, e.atoms.find(a => a.id === b.b)!.pos);
      assert.ok(d > 0.6 && d < 3, `${k.name}: Bindungslänge ${d}`);
    }
    // Bindungswinkel aller Zentralatome ≥ 90°
    for (const a of e.angles) assert.ok(a.deg >= 90, `${k.name}: Winkel ${a.deg}`);
  }
});

test("Ethen ist eben, Dipol von Wasser ≠ 0, von CO2 = 0", () => {
  const e = embed3D(toMolecule(K.C2H4));
  const [p0, p1, p2] = e.atoms.map(a => a.pos), e1 = sub(p1, p0), e2 = sub(p2, p0);
  const n: Vec = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], nl = Math.hypot(...n);
  for (const a of e.atoms) assert.ok(Math.abs((sub(a.pos, p0)[0] * n[0] + sub(a.pos, p0)[1] * n[1] + sub(a.pos, p0)[2] * n[2]) / nl) < 0.01, "Ethen nicht eben");
  const zi = embed3D(toMolecule(K.CH2O)).atoms.map(a => a.pos[2]);
  assert.ok(Math.max(...zi) - Math.min(...zi) < 1e-6, "Methanal nicht eben");
  const len = (v: Vec) => Math.hypot(...v);
  assert.ok(len(dipoleVector(embed3D(toMolecule(K.H2O)), en)) > 0.5);
  assert.ok(len(dipoleVector(embed3D(toMolecule(K.CO2)), en)) < 1e-6);
  assert.ok(len(dipoleVector(embed3D(toMolecule(K.CH4)), en)) < 1e-6);
  // H₂O₂ ist verdrillt (Diederwinkel ≈ 111°) und hat deshalb einen Dipol
  const hp = embed3D(toMolecule(K.H2O2));
  assert.ok(len(dipoleVector(hp, en)) > 0.5, "H2O2 muss polar sein");
  const P = (i: number) => hp.atoms[i].pos;
  const u = sub(P(2), P(1)), n1 = sub(P(0), P(1)), n2 = sub(P(3), P(2));
  const perp = (v: Vec) => { const k = (v[0] * u[0] + v[1] * u[1] + v[2] * u[2]) / (u[0] ** 2 + u[1] ** 2 + u[2] ** 2); return [v[0] - k * u[0], v[1] - k * u[1], v[2] - k * u[2]] as Vec; };
  assert.approximately(angleDeg(perp(n1), perp(n2)), 111.5, 0.5);
  const cl = embed3D(toMolecule(K.CCl4));
  assert.ok(len(dipoleVector(cl, en)) < 0.01, "CCl4 symmetrisch");
});

/** Ring aus C-Atomen (Raster-Koordinaten der Ecken im Uhrzeigersinn), jedes C mit Hs auf das Oktett aufgefüllt */
function ring(corners: [number, number][]) {
  const atoms = corners.map(([x, y], i) => ({ id: i + 1, el: "C", x, y }));
  const bonds = corners.map((_, i) => ({ a: i + 1, b: ((i + 1) % corners.length) + 1, order: 1 }));
  let id = corners.length;
  for (const c of [...atoms]) for (let k = 0; k < 2; k++) { atoms.push({ id: ++id, el: "H", x: 0, y: 0 }); bonds.push({ a: c.id, b: id, order: 1 }); }
  return { atoms, bonds };
}

test("Ringe: Cyclobutan knapp 90°, Cyclohexan nahe am Tetraederwinkel, Bindungen unverzerrt", () => {
  const cases = [
    { m: ring([[0, 0], [1, 0], [1, 1], [0, 1]]), lo: 85, hi: 91 },
    { m: ring([[0, 0], [1, 0], [2, 0], [2, 1], [1, 1], [0, 1]]), lo: 104, hi: 115 },
  ];
  for (const { m, lo, hi } of cases) for (const mode of ["real", "ideal"] as const) {
    const e = embed3D(m, mode);
    const P = (id: number) => e.atoms.find(a => a.id === id)!.pos;
    const cs = e.angles.filter(a => e.atoms.find(x => x.id === a.center)!.el === "C");
    for (const a of cs) {
      assert.ok(a.deg > lo && a.deg < hi, `Ringwinkel ${a.deg.toFixed(1)} (${mode})`);
      assert.equal(e.atoms.find(x => x.id === a.a)!.el + e.atoms.find(x => x.id === a.b)!.el, "CC");
    }
    // nur eine Beschriftung für die gleichen Ringwinkel
    assert.equal(cs.filter(a => a.label).length, 1);
    assert.match(cs.find(a => a.label)!.label, /^≈ \d+°$/);
    for (const b of e.bonds) {
      const d = dist(P(b.a), P(b.b)), soll = e.atoms.find(x => x.id === b.b)!.el === "H" ? 1.07 : 1.54;
      assert.ok(Math.abs(d - soll) / soll < 0.05, `Bindung ${d.toFixed(2)} statt ${soll}`);
    }
    for (let i = 0; i < e.atoms.length; i++) for (let j = i + 1; j < e.atoms.length; j++)
      assert.ok(dist(e.atoms[i].pos, e.atoms[j].pos) > 1.0 || e.bonds.some(b => [b.a, b.b].includes(e.atoms[i].id) && [b.a, b.b].includes(e.atoms[j].id)));
  }
});

test("Ring mit =O und CH₂ (Cyclohexantrion): =O auf der Winkelhalbierenden, H-Paare symmetrisch", () => {
  const atoms: { id: number; el: string; x: number; y: number }[] = [], bonds: { a: number; b: number; order: number }[] = [];
  let n = 0;
  const add = (el: string) => { atoms.push({ id: ++n, el, x: n, y: 0 }); return n; };
  const C = [0, 1, 2, 3, 4, 5].map(() => add("C"));
  C.forEach((c, i) => bonds.push({ a: c, b: C[(i + 1) % 6], order: 1 }));
  const subs: number[][] = C.map((_, i) => (i % 2 === 0 ? [add("O")] : [add("H"), add("H")]));
  C.forEach((c, i) => subs[i].forEach(s => bonds.push({ a: c, b: s, order: i % 2 === 0 ? 2 : 1 })));
  for (const mode of ["real", "ideal"] as const) {
    const e = embed3D({ atoms, bonds } as unknown as Parameters<typeof embed3D>[0], mode);
    const P = (id: number) => e.atoms.find(a => a.id === id)!.pos;
    const ang = (c: number, x: number, y: number) => angleDeg(sub(P(x), P(c)), sub(P(y), P(c)));
    C.forEach((c, i) => {
      const [l, r] = [C[(i + 5) % 6], C[(i + 1) % 6]];
      for (const s of subs[i]) assert.ok(Math.abs(ang(c, s, l) - ang(c, s, r)) < 1.5, `${mode}: C${i + 1} Substituent schief`);
      if (i % 2 === 0) assert.ok(Math.abs(ang(c, subs[i][0], l) + ang(c, subs[i][0], r) + ang(c, l, r) - 360) < 1, `${mode}: C${i + 1}=O nicht eben`);
      else assert.ok(Math.abs(ang(c, subs[i][0], subs[i][1]) - 109.5) < 1, `${mode}: H–C–H`);
    });
  }
});

test("jedes bekannte Molekül hat 3D-Daten (MMFF94) und wird daraus aufgebaut", () => {
  for (const k of KNOWN) {
    const d = MOL3D[k.formula];
    assert.ok(d, `${k.formula}: keine 3D-Daten`);
    const e = embed3D(toMolecule(k));
    // aus den Daten: Bindungslängen wie dort, keine geschätzten Winkel („ca.“)
    for (const b of e.bonds) {
      const len = dist(e.atoms.find(a => a.id === b.a)!.pos, e.atoms.find(a => a.id === b.b)!.pos);
      assert.ok(len > .6 && len < 2.4, `${k.formula}: Bindung ${len}`);
    }
    assert.ok(e.angles.every(a => !a.label.startsWith("ca.")), `${k.formula}: Winkel geschätzt`);
    assert.strictEqual(e.atoms.length, d.atoms.length);
  }
});

test("hinterlegte Strukturen auch für Moleküle, die keine Beispiele sind (Nachschlagen über den Bindungsgraphen)", () => {
  // CHCl₃ auf dem Raster, Atome in beliebiger Reihenfolge
  const m = {
    atoms: [{ id: 7, el: "Cl", x: 0, y: 1 }, { id: 2, el: "C", x: 1, y: 1 }, { id: 3, el: "H", x: 1, y: 0 }, { id: 4, el: "Cl", x: 2, y: 1 }, { id: 5, el: "Cl", x: 1, y: 2 }],
    bonds: [{ a: 2, b: 7, order: 1 }, { a: 2, b: 3, order: 1 }, { a: 2, b: 4, order: 1 }, { a: 2, b: 5, order: 1 }],
  };
  assert.strictEqual(storedMol3D(m), MOL3D.CHCl3);
  const e = embed3D(m);
  assert.ok(e.angles.every(a => !a.label.startsWith("ca.")));
  const P = (id: number) => e.atoms.find(a => a.id === id)!.pos;
  assert.approximately(dist(P(2), P(7)), 1.758, 0.005);
  // falsche Bindungsordnung → nicht hinterlegt
  assert.strictEqual(storedMol3D({ ...m, bonds: m.bonds.map((b, i) => (i ? b : { ...b, order: 2 })) }), null);
});

test("gemessene Werte in den hinterlegten Strukturen", () => {
  const d = (f: string, i: number, j: number) => { const A = MOL3D[f].atoms; return dist(A[i].slice(1) as Vec, A[j].slice(1) as Vec); };
  const bond = (f: string, a: string, b: string) => MOL3D[f].bonds.filter(([i, j]) => [MOL3D[f].atoms[i][0], MOL3D[f].atoms[j][0]].sort().join() === [a, b].sort().join()).map(([i, j]) => d(f, i, j));
  const cases: [string, string, string, number][] = [
    ["H2O", "H", "O", .958], ["NH3", "H", "N", 1.012], ["CH4", "C", "H", 1.087], ["CO2", "C", "O", 1.160], ["SO2", "O", "S", 1.431],
    ["C6H6", "C", "C", 1.397], ["C2H4", "C", "C", 1.339], ["C2H2", "C", "C", 1.203], ["HCN", "C", "N", 1.153], ["S8", "S", "S", 2.051],
    ["SF6", "F", "S", 1.561], ["BF3", "B", "F", 1.307], ["P4", "P", "P", 2.21], ["Br2", "Br", "Br", 2.281], ["H2O2", "O", "O", 1.475],
  ];
  for (const [f, a, b, r] of cases) for (const x of bond(f, a, b)) assert.approximately(x, r, 0.01, `${f} ${a}–${b}`);
  // Winkel: H₂O 104,5°, PCl₃ 100,3°, SO₂ 119,5°, S₈ 107,9°
  const ang = (f: string, i: number, c: number, j: number) => angleDeg(sub(MOL3D[f].atoms[i].slice(1) as Vec, MOL3D[f].atoms[c].slice(1) as Vec), sub(MOL3D[f].atoms[j].slice(1) as Vec, MOL3D[f].atoms[c].slice(1) as Vec));
  const center = (f: string, el: string) => MOL3D[f].atoms.findIndex(a => a[0] === el);
  const nb = (f: string, c: number) => MOL3D[f].bonds.filter(b => b[0] === c || b[1] === c).map(b => (b[0] === c ? b[1] : b[0]));
  for (const [f, el, deg] of [["H2O", "O", 104.5], ["PCl3", "P", 100.3], ["SO2", "S", 119.5], ["S8", "S", 107.9], ["NF3", "N", 102.2]] as const) {
    const c = center(f, el), [i, j] = nb(f, c);
    assert.approximately(ang(f, i, c, j), deg, 0.2, f);
  }
});
