// Kapitel 5: Modell-Ergebnisse passen zu den Fachdaten (Konfiguration aus `configuration`, Formeln aus `formula`), nur beständige Stoffe.
import { test, expect } from "vitest";
import { ION_BY_ID, isKnownCompound, shortConfigString } from "@lern/chem";
import { cfgAfter, cfgText, metalIon, nameWith, outerShells, wallFormula } from "./models.tsx";

test("Kästchenschema: abgeben zuerst aus ns, dann (n−1)d – wie configuration()", () => {
  expect(outerShells(26)).toMatchObject({ s: 2, d: 6, core: "Ar" });
  expect(outerShells(29)).toMatchObject({ s: 1, d: 10, core: "Ar" }); // Ausnahme Cu [Ar] 4s¹ 3d¹⁰
  for (const [Z, q] of [[26, 2], [26, 3], [29, 1], [29, 2], [30, 2], [47, 1]]) expect(cfgText(Z, cfgAfter(Z, q))).toBe(shortConfigString(Z, Z - q));
  expect(cfgText(26, cfgAfter(26, 3))).toBe("[Ar] 3d⁵");
  expect(cfgText(26, { s: 2, d: 4 })).toBe("[Ar] 4s² 3d⁴"); // „3d zuerst abgegeben“
  expect(cfgText(29, cfgAfter(29, 2))).toBe("[Ar] 3d⁹");
  expect(cfgText(30, cfgAfter(30, 2))).toBe("[Ar] 3d¹⁰");
});

test("Ionenwand: gebaute Formeln und Namen, nur beständige Stoffe", () => {
  const cases: [number, string, number, number, number, string][] = [
    [26, "Cl-", 2, 1, 2, "FeCl₂"], [26, "Cl-", 3, 1, 3, "FeCl₃"], [29, "O2-", 1, 2, 1, "Cu₂O"], [26, "O2-", 3, 2, 3, "Fe₂O₃"], [30, "Cl-", 2, 1, 2, "ZnCl₂"],
    [26, "SO42-", 3, 2, 3, "Fe₂(SO₄)₃"], [29, "NO3-", 2, 1, 2, "Cu(NO₃)₂"], [26, "OH-", 2, 1, 2, "Fe(OH)₂"], [82, "O2-", 2, 1, 1, "PbO"], [29, "Cl-", 2, 1, 2, "CuCl₂"], [26, "PO43-", 3, 1, 1, "FePO₄"],
  ];
  for (const [Z, an, q, nC, nA, f] of cases) {
    expect(wallFormula(Z, an, { q, nC, nA })).toBe(f);
    expect(isKnownCompound(metalIon(Z, q), ION_BY_ID[an])).toBe(true);
    expect(ION_BY_ID[metalIon(Z, q).id]).toBeDefined(); // Ion aus ions.ts
  }
  expect(wallFormula(26, "Cl-", { q: 3, nC: 1, nA: 2 })).toBe("≠");
  expect(nameWith(29, 2, ION_BY_ID["Cl-"])).toBe("Kupfer(II)-chlorid");
  expect(nameWith(26, 3, ION_BY_ID["PO43-"])).toBe("Eisen(III)-phosphat");
  // weitere Stoffe aus Folien und Merksätzen
  for (const [c, a] of [["Ag+", "Cl-"], ["Ag+", "NO3-"], ["Cu+", "S2-"], ["Fe3+", "OH-"], ["Cu2+", "SO42-"], ["Zn2+", "O2-"], ["Fe2+", "S2-"], ["Cu2+", "OH-"], ["Fe2+", "SO42-"]])
    expect(isKnownCompound(ION_BY_ID[c], ION_BY_ID[a])).toBe(true);
});
