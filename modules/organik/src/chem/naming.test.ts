import { describe, expect, test } from "vitest";
import { setLang } from "@lern/i18n";
import { parseSmiles } from "./smiles.ts";
import { name, type NameOk } from "./naming.ts";
import { smilesMol } from "./smiles.ts";
import { flipBond, keepStereo } from "./stereo.ts";
import { layout } from "./layout.ts";
import { formula, freeValence, type El, type Mol, type Order } from "./mol.ts";
import { MULT, MULT_X } from "./rings.ts";

const nm = (s: string) => {
  const r = name(parseSmiles(s));
  if (!r.ok) throw new Error(`${s}: ${r.reason}`);
  return r;
};
const N = (s: string) => nm(s).name;
const ez = (s: string) => { const r = name(smilesMol(s)); if (!r.ok) throw new Error(r.reason); return r; };
/** Nummerieren-Schritt in der gerade eingestellten Sprache */
const line2 = (s: string) => nm(s).steps.find(x => /^Numbering|^The heteroatom/.test(x));

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
  const reason = (s: string) => { const r = name(parseSmiles(s)); return r.ok ? r.name : r.reason; };
  test("überschrittene Wertigkeit wird abgelehnt (C mit fünf Bindungen)", () => {
    expect(reason("CC(C)(=O)CC")).toBe("Zu viele Bindungen an einem Atom");
    expect(reason("CC(C)(C)(C)C")).toBe("Zu viele Bindungen an einem Atom");
  });
  test("Ketten bis 30 C, längere mit Meldung statt Absturz", () => {
    expect(reason("C".repeat(30))).toBe("Triacontan");
    expect(reason("C".repeat(31))).toBe("Kette mit mehr als 30 C – zu lang für diese App");
    expect(reason("C".repeat(40))).toBe("Kette mit mehr als 30 C – zu lang für diese App");
    // längster Weg über einen Ast: 16 + 16 C = 32 C
    expect(reason("C".repeat(15) + "C(C)" + "C".repeat(15))).toMatch(/zu lang/);
    expect(reason("CC(C)" + "C".repeat(28))).toBe("2-Methyltriacontan");
    expect(reason("C1" + "C".repeat(30) + "1")).toBe("Ring mit mehr als 30 Atomen – zu groß für diese App");
  });
  test("mehr als zehn gleiche Teile: Zahlwörter nach IUPAC statt „undefined“", () => {
    expect(MULT.slice(11, 13)).toEqual(["undeca", "dodeca"]);
    expect([MULT[14], MULT[20], MULT[21], MULT[22], MULT[31], MULT_X[4], MULT_X[12]]).toEqual(["tetradeca", "icosa", "henicosa", "docosa", "hentriaconta", "tetrakis", "dodecakis"]);
    expect(reason("ClC(Cl)(Cl)C(Cl)(Cl)C(Cl)(Cl)C(Cl)(Cl)C(Cl)(Cl)C(Cl)(Cl)Cl")).toBe("1,1,1,2,2,3,3,4,4,5,5,6,6,6-Tetradecachlorhexan");
    expect(reason("OCC(O)C(O)C(O)C(O)C(O)C(O)C(O)C(O)C(O)C(O)CO")).toBe("Dodecan-1,2,3,4,5,6,7,8,9,10,11,12-dodecaol");
  });
  test("Dreifachbindung im Ring: eigene Meldung", () => {
    expect(reason("C1#CCCCCCC1")).toBe("Dreifachbindung im Ring");
    expect(reason("C1#CCCCC1")).toBe("Dreifachbindung im Ring");
    expect(reason("C1=CCOC=C1")).toBe("Teilweise ungesättigter Heterocyclus");
  });
  test("Stoffklassen: Lacton, Lactam, exocyclische Doppelbindung, OH am Aromaten", () => {
    expect(nm("O=C1CCCO1").classes).toEqual(["Lacton", "Heterocyclus"]);
    expect(nm("O=C1CCCO1").steps[0]).toMatch(/\*\*Lacton\*\* \(ringförmiger Ester\).*\*\*\u2011on\*\*/);
    expect(nm("O=C1CCCCN1").classes).toEqual(["Lactam", "Heterocyclus"]);
    expect(nm("O=C1CCOCC1").classes).toEqual(["Keton", "Heterocyclus"]);
    expect(nm("O=C1CCC(=O)O1").classes).toEqual(["Säureanhydrid", "Heterocyclus"]);
    expect(nm("O=C1CCC(=O)N1C").classes).toEqual(["Imid", "Heterocyclus"]);
    expect(nm("C=C1CCCCC1").classes).toEqual(["Alken"]);
    expect(nm("C1CCCCC1=C").classes).toEqual(["Alken"]);
    expect(nm("C1=CCCCC1").classes).toEqual(["Cycloalken"]);
    expect(nm("OC1=CC=NC=C1").classes).toEqual(["Heterocyclus", "Aromat"]);
    expect(nm("OC1=CC=NC=C1").steps[0]).toMatch(/Hydroxygruppe.*am aromatischen Ring/);
    expect(nm("OC1=CC=CC=C1").classes).toEqual(["Phenol"]);
    expect(nm("C=C(O)C").classes).toEqual(["Enol"]);
    expect(nm("CSCC(N)C(=O)O").classes).toEqual(["Aminosäure", "Thioether"]);
  });
  test("Benzol-Schreibweise auch am Namensanfang, Ester-Name Alkyl…oat mit Bindestrich", () => {
    expect(nm("C1=CC=CC=C1").alt).toContain("Benzol");
    expect(nm("OC1=CC=C(O)C=C1").alt).toContain("Benzol-1,4-diol");
    expect(nm("OC(=O)C1=CC=CC=C1C(=O)O").alt).toContain("Benzol-1,2-dicarbonsäure");
    expect(nm("CC1=CC=CC=C1").alt).toContain("Methylbenzol");
    expect(nm("COC(=O)C(C)C").alt).toContain("Methyl-2-methylpropanoat");
    expect(nm("CC(C)COC(=O)C").alt).toContain("2-Methylpropylacetat");
    expect(nm("COC(=O)CCC(=O)OCC").alt).toContain("1-Ethyl-4-methylbutandioat");
  });
  test("Ester-Name Alkyl…oat: ein Alkyl ohne Klammer, gemischter Ester mit Vorsilben am Säureteil ohne irreführende Form", () => {
    expect(ez("CC(C)COC(=O)/C=C\\C").alt).toContain("2-Methylpropyl-(Z)-but-2-enoat");
    // „4-Ethyl-1-methyl-2-methylbutandioat“ sähe aus wie drei Vorsilben an einer Kette
    expect(nm("COC(=O)C(C)CC(=O)OCC").alt).toEqual([]);
  });
  test("Lösungsweg: Heterocyclus ohne Endung, ranghöchste Gruppe", () => {
    expect(nm("C1=CC=NC=C1").steps[0]).toBe("Keine Gruppe mit Endung: Der Ring mit Heteroatom hat einen eigenen Namen.");
    expect(nm("CC(O)C").steps[0]).toMatch(/^Ranghöchste Gruppe: \*\*Alkohol\*\*/);
    expect(nm("CC(O)C").steps.join(" ")).not.toMatch(/Hauptgruppe/);
  });
  test("Lösungsweg „Nummerieren“: die Regel, die entscheidet, mit beiden Nummern", () => {
    const line = (s: string) => nm(s).steps.find(x => /^Nummerieren|^Das Heteroatom|^Das C mit/.test(x));
    expect(line("CC(C)C(=O)CC")).toBe("Nummerieren: Die **ranghöchste Gruppe** hat von beiden Seiten C3. Dann entscheidet der **Ast**: 2 statt 4.");
    expect(line("CCC(CC)CC(C)CC")).toBe("Nummerieren: Die **Äste** haben von beiden Seiten C3 und C5. Dann entscheidet das Alphabet: **Ethyl** bekommt die 3.");
    expect(line("CC(C)CCC=O")).toBe("Nummerieren: so, dass die **ranghöchste Gruppe** die kleinste Nummer bekommt: 1 statt 5.");
    // Ring mit einer ranghöchsten Gruppe: ihr C ist C1 (kein „1 statt 2“)
    expect(line("CC1=CC=CC(O)=C1")).toBe("Das C mit der ranghöchsten Gruppe ist C1. Weiter so zählen, dass der **Ast** die kleinste Nummer bekommt: 3 statt 5.");
    expect(line("CC1=CC=C(C(=O)O)C=C1")).toMatch(/^Das C mit der ranghöchsten Gruppe ist C1\./);
    expect(line("CC1(O)CCCCC1")).toMatch(/^Das C mit der ranghöchsten Gruppe ist C1\./);
    for (const s of ["CC1=CC=C(C(=O)O)C=C1", "CC1(O)CCCCC1", "OC1CCCCC1"]) expect(nm(s).steps.join(" ")).not.toMatch(/1 statt 2/);
    // Heterocyclus: das Heteroatom ist immer 1, erst dann die anderen Regeln
    expect(line("CC1=CN=CC=C1")).toBe("Das Heteroatom im Ring hat immer die Nummer 1. Weiter so zählen, dass der **Ast** die kleinste Nummer bekommt: 3 statt 5.");
    expect(line("O=C1CCCO1")).toMatch(/^Das Heteroatom im Ring hat immer die Nummer 1\. Weiter so zählen, dass die \*\*ranghöchste Gruppe\*\* .*: 2 statt 5\.$/);
    // Name ohne Nummer: kein „1 statt 2“, sondern der Grund
    expect(line("CCO")).toBe("Nummerieren: so, dass die **ranghöchste Gruppe** die kleinste Nummer bekommt. Die Nummer steht nicht im Namen: Er ist auch ohne eindeutig.");
    expect(nm("OC1=CC=CC=C1").steps.join(" ")).not.toMatch(/statt 2/);
    setLang("en", false);
    try {
      expect(line2("CC(C)C(=O)CC")).toBe("Numbering: The **principal group** is at C3 from both ends. Then the **branch** decides: 2 instead of 4.");
      expect(line2("CC1=CN=CC=C1")).toBe("The heteroatom in the ring always gets number 1. Then count so that the **branch** gets the lowest number: 3 instead of 5.");
    } finally { setLang("de", false); }
  });
  test("Lösungsweg: zusammengesetzte Vorsilben in Klammern wie im Namen, Gruppe des Amins/Amids nach den H am N", () => {
    const pre = (s: string) => nm(s).steps.find(x => x.startsWith("Vorsilben"));
    expect(pre("CCCC(C(C)C)CCC")).toBe("Vorsilben: **4-(1-Methylethyl)**.");
    expect(pre("CCCC(C(C)C)C(C(C)C)CCC")).toBe("Vorsilben: **4,5-Bis(1-methylethyl)**.");
    expect(nm("CCNC").steps[0]).toMatch(/\*\*Amin\*\* –\u2060?NH–/);
    expect(nm("CN(C)CCC").steps[0]).toMatch(/\*\*Amin\*\* –\u2060?N</);
    expect(nm("CC(=O)NC").steps[0]).toMatch(/\*\*Amid\*\* –\u2060?CONH–/);
    expect(nm("CCN").steps[0]).toMatch(/\*\*Amin\*\* –\u2060?NH₂/);
  });
  test("Lösungsweg: eingeführter Name am Benzolring, Säureteil und Alkylteil", () => {
    expect(nm("OC1=CC=CC=C1").steps).toContain("Statt Benzenol heißt es **Phenol** (eingeführter Name).");
    expect(nm("NC1=CC=CC=C1").steps).toContain("Statt Benzenamin heißt es **Anilin** (eingeführter Name).");
    const e = nm("CCCC(=O)OCC").steps.join(" ");
    expect(e).toMatch(/Säureteil \+ Alkylteil/);
    expect(e).not.toMatch(/Säure-Teil|Alkyl-Teil/);
  });
  test("andere Richtung: Regel, die entscheidet", () => {
    const rv = (s: string) => (name(parseSmiles(s), { pick: "reverse" }) as NameOk).reverse;
    expect(rv("CC(C)CCC=O")).toMatchObject({ rule: "principal", right: [1], wrong: [5] });
    expect(rv("CCC(CC)CC(C)CC")).toMatchObject({ rule: "alpha", right: [3], wrong: [5], prefix: "ethyl" });
    expect(rv("C#CC(C)C")).toMatchObject({ rule: "multiple", right: [1], wrong: [3], bond: "triple" });
    expect(rv("CC(C)CC(C)(C)C")).toMatchObject({ rule: "prefixes", right: [2, 2, 4], wrong: [2, 4, 4] });
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
  test("Lösungsweg nennt ranghöchste Gruppe und Kette", () => {
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

describe("Name in Teilen (Farben)", () => {
  test("Teile ergeben den Namen, jede Kennung hat Atome", () => {
    for (const s of ["OC(=O)C(C)C(=O)C(O)C(C)CC", "CC(C)CC", "CCCC(=O)OCC", "CC(=O)OC1=CC=CC=C1C(=O)O", "CCNCC", "OC1=CC=CC=C1", "CC(C)C(C)C(C)(CC)C(=O)CCC(N)C(N)C"]) {
      const r = nm(s);
      expect(r.parts.map(p => p.text).join("")).toBe(r.name);
      for (const p of r.parts) if (p.key) expect(r.groupsByKey[p.key]?.length, `${s} ${p.key}`).toBeGreaterThan(0);
    }
    const r = nm("OC(=O)C(C)C(=O)C(O)C(C)CC");
    expect(r.parts.filter(p => p.key).map(p => [p.text, p.key])).toEqual([
      ["4-Hydroxy", "hydroxy"], ["2,5-dimethyl", "methyl"], ["3-oxo", "oxo"], ["heptan", "parent"], ["säure", "principal"],
    ]);
    expect(r.groupsByKey.methyl).toHaveLength(2);
  });
});

describe("E/Z-Isomerie", () => {
  test.each([
    ["C/C=C/C", "(E)-But-2-en", "trans-But-2-en"],
    ["C/C=C\\C", "(Z)-But-2-en", "cis-But-2-en"],
    ["Cl/C=C/Cl", "(E)-1,2-Dichlorethen", "trans-1,2-Dichlorethen"],
    ["OC(=O)/C=C\\C(=O)O", "(Z)-But-2-endisäure", "Maleinsäure"],
    ["OC(=O)/C=C/C(=O)O", "(E)-But-2-endisäure", "Fumarsäure"],
    ["C/C=C/C(=O)O", "(E)-But-2-ensäure", "Crotonsäure"],
    ["C/C=C/C=C/C", "(2E,4E)-Hexa-2,4-dien", undefined],
    ["C/C=C\\C=C\\C", "(2Z,4E)-Hexa-2,4-dien", undefined],
    ["CC/C(C)=C/C", "(E)-3-Methylpent-2-en", undefined],
    ["Cl/C(Br)=C/C", "(Z)-1-Brom-1-chlorprop-1-en", undefined],
    ["CC(C)=C/CC/C(C)=C/C=O", "(E)-3,7-Dimethylocta-2,6-dienal", "Geranial (Citral A)"],
    ["C/C=C/C1CCCCC1", "[(E)-Prop-1-enyl]cyclohexan", undefined],
    ["OC(=O)/C=C/C1=CC=CC=C1", "(E)-3-Phenylprop-2-ensäure", "Zimtsäure"],
  ])("%s → %s", (s, n, alt) => {
    const r = ez(s);
    expect(r.name).toBe(n);
    if (alt) expect(r.alt).toContain(alt);
  });
  test("kein E/Z ohne zwei verschiedene Gruppen an beiden C", () => {
    expect(ez("C=CC").name).toBe("Propen");
    expect(ez("CC(C)=CC").name).toBe("2-Methylbut-2-en");
    expect(ez("CC=C1CCCCC1").name).toBe("Ethylidencyclohexan");
    expect(ez("CC(C)=CCCC(C)CC=O").name).toBe("3,7-Dimethyloct-6-enal");
  });
  test("ohne Lage (alle Atome an derselben Stelle) kein E/Z", () => {
    expect(nm("CC=CC").name).toBe("But-2-en");
  });
  test("Spiegeln an der Doppelbindung tauscht E und Z", () => {
    const m = smilesMol("C/C=C/CC");
    const b = m.bonds.find(x => x.order === 2)!;
    expect(name(m).ok && (name(m) as NameOk).name).toBe("(E)-Pent-2-en");
    const f = flipBond(m, b.a, b.b)!;
    expect((name(f) as NameOk).name).toBe("(Z)-Pent-2-en");
    // Neu zeichnen (Ordnen) behält E/Z
    expect((name(keepStereo(f, layout(f))) as NameOk).name).toBe("(Z)-Pent-2-en");
  });
  test("Lösungsweg „Nummerieren“: bei sonst gleichen Nummern bekommt Z die kleinere", () => {
    expect(ez("C/C=C\\C(C)/C=C/C").steps.find(x => x.startsWith("Nummerieren"))).toBe(
      "Nummerieren: Doppelbindungen (C2 und C5) und Ast (C4) liegen von beiden Seiten gleich. Dann bekommt **Z** die kleinere Nummer: 2 statt 5.");
  });
  test("Lösungsweg erklärt E/Z", () => {
    expect(ez("C/C=C\\C").steps.join(" ")).toMatch(/derselben.*\*\*Z\*\*/);
    expect(ez("Cl/C(Br)=C/C").steps.join(" ")).toMatch(/Br vor Cl/);
  });
  test("CIP: Nachbarn entscheiden bei gleichem erstem Atom (CH₂OH vor CH(CH₃)₂)", () => {
    // an C2: CH2OH und CH(CH3)2; an C3: CH3 und H; CH2OH und CH3 auf derselben Seite → Z
    const r = ez("OC/C(C(C)C)=C\\C");
    expect(r.name).toMatch(/^\(Z\)-/);
  });
});

describe("Regeln aus der automatischen Prüfung (OPSIN, RDKit)", () => {
  const nz = (s: string) => { const r = name(smilesMol(s)); if (!r.ok) throw new Error(`${s}: ${r.reason}`); return r; };
  test.each([
    // Ringe: N vor O vor S, Heterocyclus vor Carbocyclus
    ["C(C1CN1)C1=CC=CS1", "2-[(Thiophen-2-yl)methyl]aziridin"],
    ["C1COC1C1CCCCS1", "2-(Thian-2-yl)oxetan"],
    // gleich lange Ketten: kleinere Nummer der Hauptgruppe vor mehr Vorsilben
    ["CCCCNC(C)(C)CC", "N-(1,1-Dimethylpropyl)butan-1-amin"],
    // ohne Nummern: Klammern um Vorsilben, die selbst Substituenten tragen können
    ["ClCOC", "Chlor(methoxy)methan"], ["CCN(C)CC(=O)O", "2-[Ethyl(methyl)amino]ethansäure"], ["ClC(F)(Br)OC", "Bromchlorfluor(methoxy)methan"],
    // N, N′, N″ …
    ["NCC(N)CC(NC)N(C)C", "N,N,N′-Trimethylbutan-1,1,3,4-tetraamin"],
    // verschiedene Alkylreste: Nummern, die kleinere für den alphabetisch ersten Rest
    ["CCOC(=O)CCC(=O)OC", "Butandisäure-1-ethyl-4-methylester"],
    // Ring-N als Anknüpfung
    ["OCN1CCCCC1", "(Piperidin-1-yl)methanol"], ["OC(=O)C1=CC=C(C=C1)N1CCCC1", "4-(Pyrrolidin-1-yl)benzoesäure"],
    // E/Z im Ring ab 8 Atomen; gleiche Buchstaben: kleinere Nummer zuerst
    ["C1=C\\CCCCCC/1", "(Z)-Cycloocten"], ["C=CCC1(/C=C\\C)CO1", "2-[(Z)-Prop-1-enyl]-2-(prop-2-enyl)oxiran"],
    // zwei gleichwertige Säureteile: gleicher Name bei jeder Reihenfolge der Atome
    ["CC(=O)OCC(C)OC(C)=O", "Ethansäure[2-(acetyloxy)-1-methylethyl]ester"], ["CC(=O)OC(C)COC(C)=O", "Ethansäure[2-(acetyloxy)-1-methylethyl]ester"],
  ])("%s → %s", (s, n) => expect(nz(s).name).toBe(n));
  test("ältere Schreibweise mit Vervielfachung, Keten nicht benennbar", () => {
    expect(nz("C=CC=C").alt).toContain("1,3-Butadien");
    expect(nz("C1=C\\CCCCCC/1").alt).toContain("cis-Cycloocten");
    expect(name(smilesMol("O=C=C1CC1")).ok).toBe(false);
  });
});
