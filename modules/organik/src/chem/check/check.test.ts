// Schnelle Tests der Prüfwerkzeuge (laufen immer): Generator, englische Namen, Molfile, Trivialnamen.
// Die eigentliche Prüfung gegen OPSIN und RDKit: python3 scripts/organik-oracle.py (siehe modules/organik/CLAUDE.md).

import { describe, expect, test } from "vitest";
import { name, nameEnOrder, TRIVIAL, type NameOk } from "../naming.ts";
import { setLang } from "@lern/i18n";
import { parseSmiles, smilesMol } from "../smiles.ts";
import { alkaneTrees, TRIVIAL_SMILES } from "./generate.ts";
import { altEnglish, toEnglish } from "../english.ts";
import { toMolblock } from "./molfile.ts";

const nm = (s: string, stereo = false) => {
  const r = name(stereo ? smilesMol(s) : parseSmiles(s));
  if (!r.ok) throw new Error(`${s}: ${r.reason}`);
  return r;
};

describe("Generator", () => {
  test("alle Alkan-Isomere bis C10 (1, 1, 1, 2, 3, 5, 9, 18, 35, 75)", () => {
    const n = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (const t of alkaneTrees(10)) n[t.length - 1]++;
    expect(n).toEqual([1, 1, 1, 2, 3, 5, 9, 18, 35, 75]);
  });
});

describe("Englische Namen für OPSIN", () => {
  test.each([
    ["CC(O)C", "propan-2-ol"], ["CCCC(=O)OCC", "ethyl butanoate"], ["OC(=O)C1=CC=CC=C1", "benzoic acid"], ["ClC(Cl)Cl", "trichloromethane"],
    ["C=CCC#C", "pent-1-en-4-yne"], ["CC#N", "ethanenitrile"], ["OC(=O)CC(O)(CC(=O)O)C(=O)O", "2-hydroxypropane-1,2,3-tricarboxylic acid"],
    ["C1=CC=NC=C1", "pyridine"], ["OC(=O)C1=CN=CC=C1", "pyridine-3-carboxylic acid"], ["O=C1CCCO1", "oxolan-2-one"],
    ["CN(C)C", "N,N-dimethylmethanamine"], ["OCCO", "ethane-1,2-diol"], ["CC(C)=O", "propan-2-one"], ["C#CC", "propyne"],
    ["OC(=O)CCC(=O)OCC", "4-ethoxy-4-oxobutanoic acid"], ["CCOC(=O)CCC(=O)OC", "1-ethyl 4-methyl butanedioate"],
    ["ClCOC", "chloro(methoxy)methane"], ["OCN1CCCCC1", "(piperidin-1-yl)methanol"], ["CC1OC1Cl", "2-chloro-3-methyloxirane"],
  ])("%s → %s", (s, en) => expect(toEnglish(nm(s))).toBe(en));
  // englisches Alphabet: ethyl vor ethynyl, propyl vor prop-2-ynyl (deutsch Ethinyl vor Ethyl) – Reihenfolge und Nummern neu
  test.each([
    ["CCCC(CC)CC(C#C)CCC", "4-Ethinyl-6-ethylnonan", "4-ethyl-6-ethynylnonane"],
    ["CCCCCC(CCC)CC(CC#C)CCCCC", "6-(Prop-2-inyl)-8-propyltridecan", "6-propyl-8-(prop-2-ynyl)tridecane"],
    ["CCCC(OCC)CC(C#C)CCC", "4-Ethinyl-6-ethoxynonan", "4-ethoxy-6-ethynylnonane"],
    ["COC(=O)C(C)CC(=O)OCC", "2-Methylbutandisäure-4-ethyl-1-methylester", "4-ethyl 1-methyl 2-methylbutanedioate"],
  ])("%s → %s / %s", (s, de, en) => {
    expect(nm(s).name).toBe(de);
    const r = nameEnOrder(parseSmiles(s));
    expect(r.ok && toEnglish(r)).toBe(en);
    setLang("en", false);
    try { expect(name(parseSmiles(s)).ok && (name(parseSmiles(s)) as NameOk).name).toBe(en); } finally { setLang("de", false); }
  });
  test("E/Z, cis/trans, ältere Schreibweise, Trivialname", () => {
    const r = nm("C/C=C/C", true);
    const en = toEnglish(r);
    expect(en).toBe("(E)-but-2-ene");
    expect(altEnglish("trans-But-2-en", r, en)).toBe("trans-but-2-ene");
    const d = nm("C=CC=C");
    expect(d.alt).toContain("1,3-Butadien");
    expect(altEnglish("1,3-Butadien", d, toEnglish(d))).toBe("1,3-butadiene");
    const a = nm("CC(=O)O");
    expect(altEnglish("Essigsäure", a, toEnglish(a))).toBe("acetic acid");
  });
});

describe("Molfile", () => {
  test("Atome, Bindungen, Nitrogruppe mit Ladungen", () => {
    const mb = toMolblock(parseSmiles("CC[NO2]"));
    const lines = mb.split("\n");
    expect(lines[3]).toMatch(/^\s+5\s+4 /);
    expect(mb).toContain("M  CHG  2   3   1   5  -1");
    expect(lines.at(-1)).toBe("M  END");
  });
});

describe("Trivialnamen", () => {
  test.each(Object.entries(TRIVIAL_SMILES))("%s", (sys, s) => {
    const r = name(smilesMol(s)) as NameOk;
    expect(r.name).toBe(sys);
    for (const t of TRIVIAL[sys] ?? []) expect(r.alt).toContain(t);
  });
});
