import { describe, expect, it } from "vitest";
import { parseFormula, balance, isBalanced, unbalancedElements, equationText, REACTIONS, sideCounts, elementsOf, formulaElements, SPECIES_NAMES } from "../src/reactions.ts";

describe("parseFormula", () => {
  it("zählt Atome, auch mit Klammern und tiefgestellten Ziffern", () => {
    expect(parseFormula("H2O")).toEqual({ H: 2, O: 1 });
    expect(parseFormula("Ca(OH)2")).toEqual({ Ca: 1, O: 2, H: 2 });
    expect(parseFormula("Al₂(SO₄)₃")).toEqual({ Al: 2, S: 3, O: 12 });
    expect(parseFormula("Fe2O3")).toEqual({ Fe: 2, O: 3 });
  });
  it("zählt Atome einer Seite mit Koeffizienten", () => {
    expect(sideCounts(["CH4", "O2"], [1, 2])).toEqual({ C: 1, H: 4, O: 4 });
    expect(elementsOf({ left: ["CH4", "O2"], right: ["CO2", "H2O"] })).toEqual(["C", "H", "O"]);
  });
});

describe("balance", () => {
  it("findet kleinste ganzzahlige Koeffizienten", () => {
    expect(balance({ left: ["H2", "O2"], right: ["H2O"] })).toEqual([2, 1, 2]);
    expect(balance({ left: ["Fe", "O2"], right: ["Fe2O3"] })).toEqual([4, 3, 2]);
    expect(balance({ left: ["CH4", "O2"], right: ["CO2", "H2O"] })).toEqual([1, 2, 1, 2]);
    expect(balance({ left: ["C3H8", "O2"], right: ["CO2", "H2O"] })).toEqual([1, 5, 3, 4]);
    expect(balance({ left: ["C2H6", "O2"], right: ["CO2", "H2O"] })).toEqual([2, 7, 4, 6]);
    expect(balance({ left: ["Ca", "H2O"], right: ["Ca(OH)2", "H2"] })).toEqual([1, 2, 1, 1]);
    expect(balance({ left: ["Fe2O3", "CO"], right: ["Fe", "CO2"] })).toEqual([1, 3, 2, 3]);
  });
  it("erkennt unmögliche Gleichungen", () => {
    expect(balance({ left: ["H2"], right: ["O2"] })).toBeNull();
  });
  it("alle Reaktionen sind ausgeglichen und minimal", () => {
    for (const r of REACTIONS) {
      expect(isBalanced(r, r.coeffs), r.id).toBe(true);
      expect(unbalancedElements(r, r.coeffs), r.id).toEqual([]);
      const g = r.coeffs.reduce((a, b) => { while (b) [a, b] = [b, a % b]; return a; });
      expect(g, r.id).toBe(1);
    }
    expect(new Set(REACTIONS.map(r => r.id)).size).toBe(REACTIONS.length);
    expect(REACTIONS.length).toBeGreaterThanOrEqual(80);
    for (const s of ["us", "os"]) for (const nv of [1, 2, 3, 4]) expect(REACTIONS.filter(r => r.stufe === s && r.niveau === nv).length, `${s} ${nv}`).toBeGreaterThanOrEqual(6);
  });
  it("Unterstufe: Niveau 1 höchstens eine Zahl ≠ 1, Niveau 2 zwei bis drei (2 H₂ + O₂ → 2 H₂O ist Niveau 2)", () => {
    const n = (r: (typeof REACTIONS)[number]) => r.coeffs.filter(c => c > 1).length;
    for (const r of REACTIONS.filter(x => x.stufe === "us" && x.niveau === 1)) expect(n(r), r.id).toBeLessThanOrEqual(1);
    for (const r of REACTIONS.filter(x => x.stufe === "us" && x.niveau === 2)) expect([2, 3], r.id).toContain(n(r));
  });
  it("Stoffnamen ohne ungenaue Trivialnamen: CaSO₄ ist nicht Gips (CaSO₄ · 2 H₂O)", () => {
    expect(SPECIES_NAMES.CaSO4).toBe("Calciumsulfat");
  });
  it("Phosphor in der Unterstufe einheitlich als P₄ (nie als einzelnes Atom P neben P₄)", () => {
    const us = REACTIONS.filter(r => r.stufe === "us").flatMap(r => [...r.left, ...r.right]);
    expect(us).toContain("P4");
    expect(us).not.toContain("P");
  });
  it("Phosphorpentoxid als Molekül P₄O₁₀, nie P₂O₅ (nur Verhältnisformel)", () => {
    expect(REACTIONS.flatMap(r => [...r.left, ...r.right])).not.toContain("P2O5");
    expect(REACTIONS.find(r => r.id === "p4o10")!.coeffs).toEqual([1, 5, 1]);
    expect(REACTIONS.find(r => r.id === "ph3-o2")!.coeffs).toEqual([4, 8, 1, 6]);
  });
  it("keine Gleichung doppelt (auch nicht in beiden Stufen)", () => {
    const key = (r: { left: string[]; right: string[] }) => `${[...r.left].sort().join("+")}→${[...r.right].sort().join("+")}`;
    const seen = new Map<string, string>();
    for (const r of REACTIONS) {
      expect(seen.get(key(r)), `${r.id} = ${seen.get(key(r))}`).toBeUndefined();
      seen.set(key(r), r.id);
    }
  });
  it("nennt die Elemente mit falscher Bilanz", () => {
    expect(unbalancedElements({ left: ["H2", "O2"], right: ["H2O"] }, [1, 1, 1])).toEqual(["O"]);
    expect(unbalancedElements({ left: ["H2", "O2"], right: ["H2O"] }, [2, 1, 1])).toEqual(["H", "O"]);
  });
});

describe("equationText", () => {
  it("schreibt Koeffizienten üblich (1 weglassen, ? für Lücke)", () => {
    expect(equationText({ left: ["H2", "O2"], right: ["H2O"] }, [2, 1, 2])).toBe("2 H₂ + O₂ → 2 H₂O");
    expect(equationText({ left: ["H2", "O2"], right: ["H2O"] }, [null, 1, 2])).toBe("? H₂ + O₂ → 2 H₂O");
    expect(equationText({ left: ["CaCO3"], right: ["CaO", "CO2"] })).toBe("CaCO₃ → CaO + CO₂");
  });
});

describe("formulaElements", () => {
  it("liefert die Ordnungszahlen aller Elemente in Formeln (ohne Doppelte)", () => {
    expect(formulaElements("H3PO4", "Ba(OH)2")).toEqual([1, 15, 8, 56]);
    expect(formulaElements("H₂O")).toEqual([1, 8]);
    expect(formulaElements()).toEqual([]);
  });
});
