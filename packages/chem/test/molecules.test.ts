import { test, assert } from "vitest";
import { KNOWN, KNOWN_BY_ID as K, toMolecule, isComplete, electronsOf, sumFormula, identify, shapeAt, isPolar, isWeaklyPolar, polarBonds, canBond, sideLayout, loneLayout, en, type Molecule } from "../src/molecules.ts";
import { embed3D, dipoleVector, gridCisTrans, storedMol3D, DIPOLE_MIN, type Vec } from "../src/geometry3d.ts";

test("alle bekannten Moleküle erfüllen die Oktettregel und werden erkannt", () => {
  for (const k of KNOWN) {
    const m = toMolecule(k, 2, 1);
    assert.ok(isComplete(m), `${k.name} nicht vollständig`);
    assert.strictEqual(identify(m)?.id, k.id, `${k.name} nicht erkannt`);
    for (const a of m.atoms) {
      const e = electronsOf(m, a.id);
      assert.strictEqual(e.singles, 0, `${k.name}: ungepaartes Elektron an ${a.el}`);
      const L = sideLayout(m, a.id);
      const shown = Object.values(L).reduce((s, v) => s + ("lone" in v ? v.lone : 0), 0);
      assert.strictEqual(shown, e.lone, `${k.name}: Lewis-Darstellung ${a.el}`);
    }
  }
});

test("Lewis-Elektronen freier Atome", () => {
  const one = (el: string): Molecule => ({ atoms: [{ id: 1, el, x: 0, y: 0 }], bonds: [] });
  const e = (el: string) => { const r = electronsOf(one(el), 1); return [r.pairs, r.singles]; };
  assert.deepEqual(e("H"), [0, 1]);
  assert.deepEqual(e("C"), [0, 4]);
  assert.deepEqual(e("N"), [1, 3]);
  assert.deepEqual(e("O"), [2, 2]);
  assert.deepEqual(e("Cl"), [3, 1]);
});

test("Bindungen nur mit ungepaarten Elektronen", () => {
  const m = toMolecule(K.H2O);
  assert.ok(!canBond(m, 1, 2), "H hat schon Duett");
  const cl2: Molecule = { atoms: [{ id: 1, el: "Cl", x: 0, y: 0 }, { id: 2, el: "Cl", x: 1, y: 0 }], bonds: [] };
  assert.ok(canBond(cl2, 1, 2));
  cl2.bonds.push({ a: 1, b: 2, order: 1 });
  assert.ok(!canBond(cl2, 1, 2), "keine Zweifachbindung bei Cl2");
});

test("Formel, Geometrie, Polarität", () => {
  assert.strictEqual(sumFormula(toMolecule(K.NH3)), "NH3");
  assert.strictEqual(sumFormula(toMolecule(K.H2O)), "H2O");
  assert.strictEqual(sumFormula(toMolecule(K.CH4)), "CH4");
  const g = (id: string, c = 1) => shapeAt(toMolecule(K[id]), c)!.geometry;
  assert.strictEqual(g("CH4"), "tetraedrisch");
  assert.strictEqual(g("NH3"), "trigonal-pyramidal");
  assert.strictEqual(g("H2O"), "gewinkelt");
  assert.strictEqual(g("CO2", 2), "linear");
  assert.strictEqual(g("CH2O", 2), "trigonal-planar");
  const p = (id: string) => isPolar(toMolecule(K[id]));
  assert.ok(p("H2O")); assert.ok(p("NH3")); assert.ok(p("HCl")); assert.ok(p("CH3Cl"));
  assert.ok(!p("CO2")); assert.ok(!p("CH4")); assert.ok(!p("CCl4")); assert.ok(!p("Cl2")); assert.ok(!p("C2H4"));
});

test("freie Elektronenpaare symmetrisch (O in CO2 schräg gegenüber der Bindung)", () => {
  const m = toMolecule(K.CO2);
  const oLeft = loneLayout(m, 1).map(g => g.angle).sort((a, b) => a - b);
  assert.deepEqual(oLeft, [135, 225]);       // Bindung nach rechts → Paare links oben und links unten
  const oRight = loneLayout(m, 3).map(g => g.angle).sort((a, b) => a - b);
  assert.deepEqual(oRight, [45, 315]);
  for (const k of KNOWN) {
    const mol = toMolecule(k);
    for (const a of mol.atoms) {
      const total = loneLayout(mol, a.id).reduce((s, g) => s + g.n, 0);
      assert.strictEqual(total, electronsOf(mol, a.id).lone, `${k.name}/${a.el}`);
    }
  }
});

test("fachliche Details: Winkel, Summenformel, schwach polar", async () => {
  const { KNOWN_BY_ID: K, toMolecule, shapeAt, sumFormula, isPolar, isWeaklyPolar } = await import("../src/molecules.ts");
  const center = (id: string) => {
    const m = toMolecule(K[id]);
    const c = [...m.atoms].sort((a, b) => m.bonds.filter(x => x.a === b.id || x.b === b.id).length - m.bonds.filter(x => x.a === a.id || x.b === a.id).length)[0];
    return shapeAt(m, c.id)!;
  };
  assert.strictEqual(center("H2O").angle, "104,5°");
  assert.strictEqual(center("NH3").angle, "107°");
  assert.strictEqual(center("H2S").angle, "92,1°");
  assert.strictEqual(center("PH3").angle, "93,5°");
  assert.strictEqual(center("CH4").angle, "109,5°");
  // trigonal-planar mit verschiedenen Partnern nur ungefähr 120° (Methanal H–C–H gemessen 116,5°)
  assert.strictEqual(center("CH2O").angle, "ca. 120°");
  assert.strictEqual(sumFormula(toMolecule(K.CH3OH)), "CH4O");
  assert.strictEqual(sumFormula(toMolecule(K.C2H5OH)), "C2H6O");
  assert.strictEqual(sumFormula(toMolecule(K.NH3)), "NH3");
  assert.strictEqual(sumFormula(toMolecule(K.H2O)), "H2O");
  // ohne polare Bindung, aber mit freiem Paar am Zentralatom: gemessen H₂S 0,97 D, PH₃ 0,57 D → schwach polar
  for (const id of ["H2S", "PH3"]) assert.strictEqual(isWeaklyPolar(toMolecule(K[id])), true, id);
  for (const id of ["H2O", "CH4", "CO2", "Cl2", "C2H6", "C2H4", "C2H2", "O2", "N2"]) assert.strictEqual(isWeaklyPolar(toMolecule(K[id])), false, id);
  assert.strictEqual(isPolar(toMolecule(K.H2S)), false);
  assert.strictEqual(isPolar(toMolecule(K.PH3)), false);
});

/** Molekül aus Rasterpositionen [Element, x, y] und Bindungen [Index, Index, Ordnung] */
const grid = (atoms: [string, number, number][], bonds: [number, number, number][]): Molecule =>
  ({ atoms: atoms.map(([el, x, y], i) => ({ id: i + 1, el, x, y })), bonds: bonds.map(([a, b, order]) => ({ a: a + 1, b: b + 1, order })) });

test("Polarität aus der Vektorsumme der Bindungsdipole – auch mit mehreren Zentralatomen", () => {
  // bekannte Moleküle wie bisher
  const polar = KNOWN.filter(k => isPolar(toMolecule(k))).map(k => k.id).sort();
  assert.deepEqual(polar, ["C2H5OH", "CH2O", "CH3Cl", "CH3OH", "H2O", "H2O2", "HCN", "HCl", "HF", "NH3"].sort());
  const C2Cl4 = grid([["C", 1, 1], ["C", 2, 1], ["Cl", 0, 1], ["Cl", 1, 0], ["Cl", 3, 1], ["Cl", 2, 0]], [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]]);
  const NCCN = grid([["N", 0, 0], ["C", 1, 0], ["C", 2, 0], ["N", 3, 0]], [[0, 1, 3], [1, 2, 1], [2, 3, 3]]);
  const C2Cl6 = grid([["C", 1, 1], ["C", 2, 1], ["Cl", 0, 1], ["Cl", 1, 0], ["Cl", 1, 2], ["Cl", 3, 1], ["Cl", 2, 0], ["Cl", 2, 2]], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1], [1, 6, 1], [1, 7, 1]]);
  for (const [name, m] of Object.entries({ C2Cl4, NCCN, C2Cl6 })) {
    assert.ok(isComplete(m), name);
    assert.strictEqual(isPolar(m), false, `${name}: Dipole heben sich auf`);
  }
  // cis/trans wie gebaut: Cl auf derselben Seite → polar, gegenüber → unpolar
  const dce = (y2: number) => grid([["C", 1, 1], ["C", 2, 1], ["Cl", 1, 0], ["H", 0, 1], ["Cl", 2, y2], ["H", 3, 1]], [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]]);
  assert.strictEqual(isPolar(dce(0)), true, "cis-1,2-Dichlorethen");
  assert.strictEqual(isPolar(dce(2)), false, "trans-1,2-Dichlorethen");
  // Angabe für das Kraftfeld (3D frei gebauter Moleküle): Cl an C1 und Cl an C2, cis bzw. trans
  assert.deepEqual(gridCisTrans(dce(0)), [{ a: 3, b: 1, c: 2, d: 5, cis: true }]);
  assert.deepEqual(gridCisTrans(dce(2)), [{ a: 3, b: 1, c: 2, d: 5, cis: false }]);
  // kumulierte Zweifachbindungen (H₂C=C=C=CH₂): die mittleren C sind linear, dort keine cis/trans-Angabe
  const cumulene = grid([["C", 0, 1], ["C", 1, 1], ["C", 2, 1], ["C", 3, 1], ["H", 0, 0], ["H", 0, 2], ["H", 3, 0], ["H", 3, 2]], [[0, 1, 2], [1, 2, 2], [2, 3, 2], [0, 4, 1], [0, 5, 1], [3, 6, 1], [3, 7, 1]]);
  assert.deepEqual(gridCisTrans(cumulene), []);
  // drehbare Einfachbindung mit schrägen Dipolen auf beiden Seiten: im Mittel polar (auch wenn eine Lage symmetrisch wäre)
  const N2H4 = grid([["N", 1, 1], ["N", 2, 1], ["H", 0, 1], ["H", 1, 0], ["H", 3, 1], ["H", 2, 2]], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]]);
  const DCA = grid([["C", 1, 1], ["C", 2, 1], ["Cl", 0, 1], ["H", 1, 0], ["H", 1, 2], ["Cl", 3, 1], ["H", 2, 0], ["H", 2, 2]], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1], [1, 6, 1], [1, 7, 1]]);
  assert.strictEqual(isPolar(N2H4), true, "Hydrazin");
  assert.strictEqual(isPolar(DCA), true, "1,2-Dichlorethan");
  // Polarität und 3D-Dipol widersprechen sich nicht
  for (const m of [C2Cl4, NCCN, dce(2), ...KNOWN.map(k => toMolecule(k))]) {
    const d = dipoleVector(embed3D(m), en);
    if (Math.hypot(...d) > DIPOLE_MIN) assert.ok(isPolar(m), JSON.stringify(m.atoms.map(a => a.el)));
  }
});

test("Polarität: ΔEN gerundet wie die Teilladungen, kleine Restdipole, schwach polar, Kohlenwasserstoffe unpolar", () => {
  const line = (els: string[], orders: number[]) => grid(els.map((el, i) => [el, i, 0]), orders.map((o, i) => [i, i + 1, o]));
  // N=O: ΔEN 3,44 − 3,04 = 0,40 (gerundet wie in polarBonds) → polar, auch als Dipol
  for (const X of ["Cl", "Br", "I"]) {
    const m = line([X, "N", "O"], [1, 2]);
    assert.ok(polarBonds(m).some(b => b.delta === 0.4), `NO${X}: N=O polar`);
    assert.strictEqual(isPolar(m), true, `NO${X}`);
  }
  // kleine Restdipole (ClCN 0,61 − 0,49, BrCN 0,41 − 0,49, CBrCl₃ 0,61 − 0,41) bleiben polar – gemessen 2,8 / 2,9 / 0,2 D
  const T4 = (a: string, b: string, c: string, d: string) => grid([["C", 1, 1], [a, 1, 0], [b, 0, 1], [c, 2, 1], [d, 1, 2]], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]);
  const transClBr = grid([["C", 1, 1], ["C", 2, 1], ["Cl", 1, 0], ["H", 1, 2], ["H", 2, 0], ["Br", 2, 2]], [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]]);
  for (const [name, m] of Object.entries({ ClCN: line(["Cl", "C", "N"], [1, 3]), BrCN: line(["Br", "C", "N"], [1, 3]), CBrCl3: T4("Br", "Cl", "Cl", "Cl"), BrCCCl: line(["Br", "C", "C", "Cl"], [1, 3, 1]), transClBr })) {
    assert.strictEqual(isPolar(m), true, name);
  }
  // ohne polare Bindung, aber mit Dipol aus kleinen ΔEN (C–I, C=S, S–H) oder freien Paaren: schwach polar
  const CH3SH = grid([["C", 1, 1], ["H", 1, 0], ["H", 0, 1], ["H", 1, 2], ["S", 2, 1], ["H", 3, 1]], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [4, 5, 1]]);
  const SMe2 = grid([["C", 0, 1], ["S", 1, 1], ["C", 2, 1], ["H", 0, 0], ["H", 0, 2], ["H", -1, 1], ["H", 2, 0], ["H", 2, 2], ["H", 3, 1]], [[0, 1, 1], [1, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1], [2, 6, 1], [2, 7, 1], [2, 8, 1]]);
  const H2CS = grid([["S", 1, 0], ["C", 1, 1], ["H", 0, 1], ["H", 2, 1]], [[0, 1, 2], [1, 2, 1], [1, 3, 1]]);
  for (const [name, m] of Object.entries({ CH3I: T4("H", "H", "I", "H"), CH2I2: T4("I", "I", "H", "H"), CHI3: T4("I", "I", "I", "H"), H2CS, CH3SH, SMe2 })) {
    assert.ok(isComplete(m), name);
    assert.strictEqual(isPolar(m), false, name);
    assert.strictEqual(isWeaklyPolar(m), true, name);
  }
  // Kohlenwasserstoffe (C–H zählt wie in der Schule als unpolar) und symmetrische Moleküle: unpolar
  const propene = grid([["C", 0, 1], ["C", 1, 1], ["C", 2, 1], ["H", 0, 0], ["H", -1, 1], ["H", 1, 0], ["H", 2, 0], ["H", 3, 1], ["H", 2, 2]], [[0, 1, 2], [1, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1], [2, 6, 1], [2, 7, 1], [2, 8, 1]]);
  const cyclobutane = grid([["C", 1, 1], ["C", 2, 1], ["C", 2, 2], ["C", 1, 2], ["H", 0, 1], ["H", 1, 0], ["H", 3, 1], ["H", 2, 0], ["H", 3, 2], ["H", 2, 3], ["H", 0, 2], ["H", 1, 3]], [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 0, 1], [0, 4, 1], [0, 5, 1], [1, 6, 1], [1, 7, 1], [2, 8, 1], [2, 9, 1], [3, 10, 1], [3, 11, 1]]);
  for (const [name, m] of Object.entries({ propene, cyclobutane, CH4: toMolecule(K.CH4), C2H6: toMolecule(K.C2H6), CCl4: toMolecule(K.CCl4), CO2: toMolecule(K.CO2) })) {
    assert.strictEqual(isPolar(m) || isWeaklyPolar(m), false, name);
  }
});

test("Räumliche Lage: Glyoxal s-trans, Allen mit senkrechten Endgruppen, Hydrazin gauche", () => {
  const P = (e: ReturnType<typeof embed3D>, id: number) => e.atoms.find(a => a.id === id)!.pos;
  const dihedral = (p: Vec[]) => {
    const s = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const c = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const d = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const b1 = s(p[1], p[0]), b2 = s(p[2], p[1]), b3 = s(p[3], p[2]);
    const n1 = c(b1, b2), n2 = c(b2, b3), l = Math.hypot(...b2);
    return Math.abs((Math.atan2(d(c(n1, n2), b2) / l, d(n1, n2)) * 180) / Math.PI);
  };
  // Glyoxal O=CH–CH=O: Einfachbindung zwischen zwei Zweifachbindungen ist eben und s-trans → Dipole heben sich auf (gemessen 0 D)
  const glyoxal = grid([["O", 0, 0], ["C", 1, 0], ["C", 2, 0], ["O", 3, 0], ["H", 1, 1], ["H", 2, 1]], [[0, 1, 2], [1, 2, 1], [2, 3, 2], [1, 4, 1], [2, 5, 1]]);
  const eg = embed3D(glyoxal, "ideal");
  assert.ok(Math.abs(dihedral([1, 2, 3, 4].map(id => P(eg, id))) - 180) < 1);
  assert.strictEqual(isPolar(glyoxal), false);
  // Allen: H–C1…C3–H 90°; 1,3-Dichlorallen dadurch polar
  const allene = (X: string) => grid([["C", 0, 1], ["C", 1, 1], ["C", 2, 1], [X, 0, 0], ["H", -1, 1], ["H", 2, 0], [X, 3, 1]], [[0, 1, 2], [1, 2, 2], [0, 3, 1], [0, 4, 1], [2, 5, 1], [2, 6, 1]]);
  for (const mode of ["real", "ideal"] as const) {
    const e = embed3D(allene("H"), mode);
    assert.ok(Math.abs(dihedral([4, 1, 3, 7].map(id => P(e, id))) - 90) < 1, mode);
  }
  assert.strictEqual(isPolar(allene("Cl")), true);
  // Hydrazin: hinterlegte Struktur gauche (gemessen 1,75 D) – der Dipol der gespeicherten Lage ist deutlich
  const N2H4 = grid([["N", 1, 1], ["N", 2, 1], ["H", 0, 1], ["H", 1, 0], ["H", 3, 1], ["H", 2, 2]], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]]);
  assert.ok(storedMol3D(N2H4));
  assert.ok(Math.hypot(...dipoleVector(embed3D(N2H4), en)) > DIPOLE_MIN);
});

test("Bindungswinkel: gemessene Werte (Dimethylether, Trimethylamin), Tetraeder mit verschiedenen Partnern „ca. 109,5°“", () => {
  const ether = grid([["C", 0, 1], ["O", 1, 1], ["C", 2, 1], ["H", 0, 0], ["H", 0, 2], ["H", -1, 1], ["H", 2, 0], ["H", 2, 2], ["H", 3, 1]], [[0, 1, 1], [1, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1], [2, 6, 1], [2, 7, 1], [2, 8, 1]]);
  assert.strictEqual(shapeAt(ether, 2)!.angle, "111,7°");
  const amine = grid([["N", 1, 1], ["C", 0, 1], ["C", 2, 1], ["C", 1, 2], ["H", -1, 1], ["H", 0, 0], ["H", 0, 2], ["H", 3, 1], ["H", 2, 0], ["H", 2, 2], ["H", 1, 3], ["H", 0, 3], ["H", 2, 3]],
    [[0, 1, 1], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1], [1, 6, 1], [2, 7, 1], [2, 8, 1], [2, 9, 1], [3, 10, 1], [3, 11, 1], [3, 12, 1]]);
  assert.strictEqual(shapeAt(amine, 1)!.angle, "110,9°");
  const ch3cl = toMolecule(K.CH3Cl), c = ch3cl.atoms.find(a => a.el === "C")!;
  assert.strictEqual(shapeAt(ch3cl, c.id)!.angle, "ca. 109,5°");
  const ch4 = toMolecule(K.CH4);
  assert.strictEqual(shapeAt(ch4, ch4.atoms.find(a => a.el === "C")!.id)!.angle, "109,5°");
});
