import { describe, expect, test } from "vitest";
import { parseSmiles } from "./smiles.ts";
import { name, type NameOk } from "./naming.ts";
import { formula, freeValence, type El, type Mol, type Order } from "./mol.ts";

const nm = (s: string) => {
  const r = name(parseSmiles(s));
  if (!r.ok) throw new Error(`${s}: ${r.reason}`);
  return r;
};
const N = (s: string) => nm(s).name;

describe("Kohlenwasserstoffe", () => {
  test.each([
    ["C", "Methan"], ["CC", "Ethan"], ["CCC", "Propan"], ["CCCC", "Butan"], ["CCCCCCCCCC", "Decan"],
    ["CC(C)CC", "2-Methylbutan"], ["CC(C)C", "2-Methylpropan"], ["CC(C)(C)C", "2,2-Dimethylpropan"],
    ["CCC(CC)CC", "3-Ethylpentan"], ["CC(C)C(C)CC(C)C", "2,3,5-Trimethylhexan"],
    ["CCC(C)C(CC)CCC", "4-Ethyl-3-methylheptan"], ["CC(C)CC(CC)CC(C)C", "4-Ethyl-2,6-dimethylheptan"],
    ["C=C", "Ethen"], ["C#C", "Ethin"], ["C=CC", "Propen"], ["C=CCC", "But-1-en"], ["CC=CC", "But-2-en"],
    ["C=CC=C", "Buta-1,3-dien"], ["C=CCC#C", "Pent-1-en-4-in"], ["CC(C)=CC", "2-Methylbut-2-en"],
    ["C1CCCCC1", "Cyclohexan"], ["CC1CCCCC1", "Methylcyclohexan"], ["C1=CCCCC1", "Cyclohexen"],
    ["C1=CC=CC=C1", "Benzen"], ["CC1=CC=CC=C1", "Methylbenzen"], ["CC1=CC=CC=C1C", "1,2-Dimethylbenzen"],
    ["CCCCCCC1=CC=CC=C1", "Hexylbenzen"], ["CC(C)C1CCCCC1", "(1-Methylethyl)cyclohexan"],
  ])("%s → %s", (s, n) => expect(N(s)).toBe(n));
});

describe("Sauerstoff, Stickstoff, Halogene", () => {
  test.each([
    ["CO", "Methanol"], ["CCO", "Ethanol"], ["CCCO", "Propan-1-ol"], ["CC(O)C", "Propan-2-ol"], ["OCC(O)CO", "Propan-1,2,3-triol"],
    ["OCCO", "Ethan-1,2-diol"], ["C=O", "Methanal"], ["CC=O", "Ethanal"], ["CC(C)=O", "Propan-2-on"], ["CCC(C)=O", "Butan-2-on"],
    ["OC=O", "Methansäure"], ["CC(=O)O", "Ethansäure"], ["CCCC(=O)O", "Butansäure"], ["OC(=O)CC(=O)O", "Propandisäure"],
    ["CCOCC", "Ethoxyethan"], ["COC(C)(C)C", "2-Methoxy-2-methylpropan"], ["CCN", "Ethanamin"], ["CN", "Methanamin"],
    ["CCNCC", "N-Ethylethanamin"], ["CN(C)C", "N,N-Dimethylmethanamin"], ["CCCl", "Chlorethan"], ["ClC(Cl)Cl", "Trichlormethan"],
    ["CC(Cl)CBr", "1-Brom-2-chlorpropan"], ["CCS", "Ethanthiol"], ["CC#N", "Ethannitril"], ["CC(N)=O", "Ethanamid"],
    ["OC1=CC=CC=C1", "Phenol"], ["NC1=CC=CC=C1", "Anilin"], ["OC(=O)C1=CC=CC=C1", "Benzoesäure"], ["O=CC1=CC=CC=C1", "Benzaldehyd"],
    ["OC1CCCCC1", "Cyclohexanol"], ["O=C1CCCCC1", "Cyclohexanon"], ["OC(=O)C1CCCCC1", "Cyclohexancarbonsäure"],
    ["C1CCSC1", "Thiolan"], ["C1CCOC1", "Oxolan"], ["O=C1CCCO1", "Oxolan-2-on"], ["C1=CC=NC=C1", "Pyridin"],
    ["OC(=O)C1=CN=CC=C1", "Pyridin-3-carbonsäure"], ["C1=CSC=C1", "Thiophen"],
    ["OCC1=CC=CC=C1", "Phenylmethanol"], ["CC(=O)C1=CC=CC=C1", "1-Phenylethan-1-on"], ["C=CC(=O)O", "Prop-2-ensäure"],
    ["CC=CC=O", "But-2-enal"], ["C=CCO", "Prop-2-en-1-ol"], ["OCCCl", "2-Chlorethan-1-ol"],
    ["OC(=O)CC(O)(CC(=O)O)C(=O)O", "2-Hydroxypropan-1,2,3-tricarbonsäure"],
    ["OC(=O)CC(CCC)C(=O)O", "2-Propylbutandisäure"], ["OC(=O)CC(=O)OC", "3-Methoxy-3-oxopropansäure"],
    ["NCC(=O)O", "2-Aminoethansäure"], ["CC(N)C(=O)O", "2-Aminopropansäure"], ["OC(=O)C(N)CC1=CC=CC=C1", "2-Amino-3-phenylpropansäure"],
    ["CC(=O)NC", "N-Methylethanamid"], ["CNC1=CC=CC=C1", "N-Methylanilin"], ["COC1=CC=CC=C1", "Methoxybenzen"],
    ["OCC(O)C=O", "2,3-Dihydroxypropanal"], ["C=C(C)C(=O)OC", "2-Methylprop-2-ensäuremethylester"],
  ])("%s → %s", (s, n) => expect(N(s)).toBe(n));
});

describe("Übliche Übungsmoleküle", () => {
  test.each([
    ["CC(=O)O", "Ethansäure", "Essigsäure"],
    ["CC(C)=O", "Propan-2-on", "Aceton"],
    ["CCCC(=O)OCC", "Butansäureethylester", "Ethylbutanoat"],
    ["CCCO", "Propan-1-ol", "1-Propanol"],
    ["OC(=O)C1=CC=CC=C1", "Benzoesäure", undefined],
    ["CC(C)CC", "2-Methylbutan", undefined],
    ["C1CCSC1", "Thiolan", undefined],
    ["CCOCC", "Ethoxyethan", "Diethylether"],
    ["CC(=O)OC1=CC=CC=C1C(=O)O", "2-(Acetyloxy)benzoesäure", "Acetylsalicylsäure"],
    ["CC(C)=CCCC(C)CC=O", "3,7-Dimethyloct-6-enal", "Citronellal"],
    ["COC(C)(C)C", "2-Methoxy-2-methylpropan", "MTBE"],
    ["OCC(O)CO", "Propan-1,2,3-triol", "Glycerin"],
    ["CC1=C(C=C(C=C1[NO2])[NO2])[NO2]", "2-Methyl-1,3,5-trinitrobenzen", "TNT"],
    ["CCCC(=O)OC", "Butansäuremethylester", "Methylbutanoat"],
    ["O=COCC", "Methansäureethylester", "Ethylmethanoat"],
    ["CCCCC(=O)OCCCCC", "Pentansäurepentylester", "Pentylpentanoat"],
    ["CCN", "Ethanamin", "Ethylamin"],
    ["NCC(=O)O", "2-Aminoethansäure", "Glycin"],
    ["CC(N)C(=O)O", "2-Aminopropansäure", "Alanin"],
    ["OC(=O)C(C)(C)CCC", "2,2-Dimethylpentansäure", undefined],
    ["OC(=O)C(C)C(=O)C(O)C(C)CC", "4-Hydroxy-2,5-dimethyl-3-oxoheptansäure", undefined],
    ["O=CC(N)C(=O)C(CC)C(CC)CCC", "2-Amino-4,5-diethyl-3-oxooctanal", undefined],
    ["OC(=O)C(C)(C)C(O)C(O)C(O)C", "3,4,5-Trihydroxy-2,2-dimethylhexansäure", undefined],
    ["CC(C)C(C)C(C)(CC)C(=O)CCC(N)C(N)C", "8,9-Diamino-4-ethyl-2,3,4-trimethyldecan-5-on", undefined],
    ["CC(=O)CC(O)C", "4-Hydroxypentan-2-on", undefined],
    ["OC(=O)CC(=O)C(O)CN", "5-Amino-4-hydroxy-3-oxopentansäure", undefined],
    ["OC(=O)C(C)(O)C(C)(O)C=CC", "2,3-Dihydroxy-2,3-dimethylhex-4-ensäure", undefined],
    ["COC(=O)CC", "Propansäuremethylester", "Methylpropanoat"],
    ["CCCOC=O", "Methansäurepropylester", "Propylmethanoat"],
    ["CCCOC(=O)CC", "Propansäurepropylester", "Propylpropanoat"],
  ])("%s → %s", (s, n, alt) => {
    const r = nm(s);
    expect(r.name).toBe(n);
    if (alt) expect(r.alt).toContain(alt);
  });
});

describe("Ergebnis", () => {
  test("Summenformel nach Hill", () => {
    expect(formula(parseSmiles("CC(=O)OC1=CC=CC=C1C(=O)O"))).toBe("C9H8O4");
    expect(formula(parseSmiles("CC1=C(C=C(C=C1[NO2])[NO2])[NO2]"))).toBe("C7H5N3O6");
    expect(formula(parseSmiles("CCN"))).toBe("C2H7N");
  });
  test("Stoffklassen", () => {
    expect(nm("CC(N)C(=O)O").classes).toContain("Aminosäure");
    expect(nm("CCOCC").classes).toEqual(["Ether"]);
    expect(nm("CC=CC").classes).toEqual(["Alken"]);
    expect(nm("CC(=O)OC1=CC=CC=C1C(=O)O").classes).toEqual(expect.arrayContaining(["Carbonsäure", "Ester", "Aromat"]));
  });
  test("Hauptkette und Nummern", () => {
    const r = nm("CC(C)CC") as NameOk;
    expect(r.parent.size).toBe(4);
    expect(r.prefixes).toEqual([{ name: "methyl", locs: ["2"] }]);
  });
  test("nicht benennbar", () => {
    const r = name(parseSmiles("C1CC2CCC1C2"));
    expect(r.ok).toBe(false);
    expect(name(parseSmiles("O")).ok).toBe(false);
    expect(name(parseSmiles("COOC")).ok).toBe(false);
  });
  test("falsche Varianten für das Quiz", () => {
    const s = parseSmiles("CC(C)CC");
    const rev = name(s, { pick: "reverse" });
    expect(rev.ok && rev.name).toBe("3-Methylbutan");
    const t = parseSmiles("CC(C)C(C)CC(C)C");
    expect((name(t, { noAlpha: true }) as NameOk).name).toBe("2,3,5-Trimethylhexan");
    expect((name(t, { noMult: true }) as NameOk).name).toBe("2-Methyl-3-methyl-5-methylhexan");
    const k = parseSmiles("CC(=O)CC(O)C");
    expect((name(k, { principal: "ol" }) as NameOk).name).toBe("4-Oxopentan-2-ol");
  });
  test("Lösungsweg nennt Hauptgruppe und Kette", () => {
    const r = nm("OC(=O)C(C)C(=O)C(O)C(C)CC");
    expect(r.steps.join(" ")).toMatch(/Carbonsäure/);
    expect(r.steps.join(" ")).toMatch(/7 C/);
  });
});

describe("Zufallsmoleküle", () => {
  /** zufällig wachsen lassen wie beim Zeichnen: Atom anhängen, ab und zu Ring schließen oder Bindung erhöhen */
  function random(seed: number, size: number): Mol {
    let x = seed;
    const r = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
    const els: El[] = ["C", "C", "C", "C", "C", "C", "O", "N", "Cl", "S", "NO2", "Br"];
    const mol: Mol = { atoms: [{ id: 0, el: "C", x: 0, y: 0 }], bonds: [] };
    for (let i = 1; i < size; i++) {
      const free = mol.atoms.filter(a => freeValence(mol, a.id) > 0);
      if (!free.length) break;
      const a = free[Math.floor(r() * free.length)];
      const el = els[Math.floor(r() * els.length)];
      mol.atoms.push({ id: i, el, x: 0, y: 0 });
      mol.bonds.push({ a: a.id, b: i, order: 1 });
      if (freeValence(mol, i) < 0) { mol.atoms.pop(); mol.bonds.pop(); continue; }
      if (r() < .15) {
        const b = mol.bonds[Math.floor(r() * mol.bonds.length)];
        if (freeValence(mol, b.a) > 0 && freeValence(mol, b.b) > 0) b.order = (b.order + 1) as Order;
      }
    }
    return mol;
  }
  /** Atome umnummerieren – der Name darf nicht von der Reihenfolge abhängen */
  function shuffled(mol: Mol, seed: number): Mol {
    const ids = mol.atoms.map(a => a.id);
    let x = seed;
    const r = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    const map = new Map(mol.atoms.map((a, i) => [a.id, ids[i] + 100]));
    return {
      atoms: [...mol.atoms].reverse().map(a => ({ ...a, id: map.get(a.id)! })),
      bonds: [...mol.bonds].reverse().map(b => ({ a: map.get(b.b)!, b: map.get(b.a)!, order: b.order })),
    };
  }
  test("kein Absturz, Name unabhängig von der Reihenfolge, schnell genug", () => {
    let named = 0;
    const t0 = Date.now();
    for (let s = 1; s <= 300; s++) {
      const m = random(s, 3 + (s % 18));
      const a = name(m), b = name(shuffled(m, s * 7));
      expect(b.ok).toBe(a.ok);
      if (a.ok && b.ok) { named++; expect(`${s}: ${b.name}`).toBe(`${s}: ${a.name}`); }
    }
    expect(named).toBeGreaterThan(100);
    expect(Date.now() - t0).toBeLessThan(8000);
  });
});
