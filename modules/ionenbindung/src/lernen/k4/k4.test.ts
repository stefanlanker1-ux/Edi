// Kapitel 4: Atomzählung mit Klammern, Ergebnisse der Modelle in der Lösungsstellung = Antworten, nur beständige Verbindungen zur Auswahl.
import { test, expect } from "vitest";
import { ION_BY_ID, isKnownCompound } from "@lern/chem";
import { atomsOf, ionStr, wallResult, wallWhy, written } from "./Models.tsx";

const I = (id: string) => ION_BY_ID[id];

test("Atome aus Formeln mit Klammern zählen", () => {
  expect(atomsOf("Ca(OH)2")).toEqual({ Ca: 1, O: 2, H: 2 });
  expect(atomsOf("CaOH2")).toEqual({ Ca: 1, O: 1, H: 2 });
  expect(atomsOf("(NH4)2SO4")).toEqual({ N: 2, H: 8, S: 1, O: 4 });
  expect(atomsOf("NH42SO4")).toEqual({ N: 1, H: 42, S: 1, O: 4 });
  expect(atomsOf("Al2(SO4)3")).toEqual({ Al: 2, S: 3, O: 12 });
});

test("Ion als Text", () => {
  expect(ionStr("SO4", -2)).toBe("SO₄²⁻");
  expect(ionStr("NH4", 1)).toBe("NH₄⁺");
  expect(ionStr("PO4", 0)).toBe("PO₄");
});

test("Ionenwand und Formel schreiben: Lösungsstellung ergibt die Antwort", () => {
  expect(wallResult(I("Mg2+"), I("NO3-"), 1, 2)).toBe("Mg(NO₃)₂");
  expect(wallResult(I("Al3+"), I("SO42-"), 2, 3)).toBe("Al₂(SO₄)₃");
  expect(wallResult(I("Na+"), I("PO43-"), 3, 1)).toBe("Na₃PO₄");
  expect(wallResult(I("Ca2+"), I("CO32-"), 1, 1)).toBe("CaCO₃");
  expect(wallResult(I("Al3+"), I("SO42-"), 1, 1)).toBe("≠");
  expect(wallResult(I("Mg2+"), I("NO3-"), 2, 4)).toBe("Mg₂(NO₃)₄");
  expect(Object.keys(wallWhy("Mg2+", "NO3-"))).toContain("Mg₂(NO₃)₄");
  expect(written(I("NH4+"), I("SO42-"), 2, 1, "C", { br: true, k: 2 })).toBe("(NH4)2SO4");
  expect(written(I("NH4+"), I("SO42-"), 2, 1, "C", { br: false, k: 2 })).toBe("NH42SO4");
  expect(written(I("Na+"), I("OH-"), 1, 1, "A", { br: false, k: 1 })).toBe("NaOH");
  expect(written(I("Ca2+"), I("OH-"), 1, 2, "A", { br: true, k: 2 })).toBe("Ca(OH)2");
});

test("zur Auswahl nur beständige Verbindungen", () => {
  const sets: [string[], string[]][] = [
    [["Na+", "Ca2+", "NH4+"], ["CO32-", "HCO3-", "NO3-"]],
    [["K+", "NH4+", "Mg2+"], ["SO42-", "NO3-", "Cl-"]],
    [["K+", "Ca2+", "Na+"], ["NO2-", "SO32-", "NO3-"]],
  ];
  for (const [cs, as] of sets) for (const c of cs) for (const a of as) expect(isKnownCompound(I(c), I(a)), `${c} ${a}`).toBe(true);
  for (const [c, a] of [["Mg2+", "NO3-"], ["Al3+", "SO42-"], ["Na+", "PO43-"], ["Ca2+", "CO32-"], ["NH4+", "SO42-"], ["Na+", "OH-"], ["Ca2+", "OH-"], ["Mg2+", "OH-"]])
    expect(isKnownCompound(I(c), I(a)), `${c} ${a}`).toBe(true);
});
