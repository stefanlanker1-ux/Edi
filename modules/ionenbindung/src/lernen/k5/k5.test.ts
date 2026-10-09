// Kapitel 5: ohne Elektronenkonfiguration und ohne Auswendigwissen (kein Ag/Zn), Formeln/Namen/Ladungen aus `ions.ts`, nur beständige Stoffe,
// Rückmeldungen zu jedem Zustand der Modelle, nie zur Lösung.
import { test, expect } from "vitest";
import { ION_BY_ID, isKnownCompound } from "@lern/chem";
import { kapitel5 } from "../k5.tsx";
import { chargeFromGroup, isReal, metalIon, nameWith, pseResult, pseWhy, wallFormula, wallName, wallWhy } from "./models.tsx";

const texts = () => {
  const out: string[] = [];
  const walk = (x: unknown): void => {
    if (typeof x === "string") out.push(x);
    else if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object") Object.values(x).forEach(walk);
  };
  const k = kapitel5();
  walk([k.title, k.desc, k.explain, k.def]);
  return out;
};

test("keine Elektronenkonfiguration, kein Kästchenschema, kein Silber/Zink im Kapitel", () => {
  const bad = texts().filter(t => /3d|4s|\[Ar\]|\[Kr\]|Kästchen|Unterschale|besetzt|\bAg\b|\bZn\b|Ag⁺|Zn²⁺|Silber|Zink|silver|zinc/i.test(t));
  expect(bad).toEqual([]);
});

test("Ionenwand: gebaute Formeln und Namen, nur Ionen aus ions.ts und beständige Stoffe", () => {
  const cases: [number, string, number, number, number, string][] = [
    [26, "Cl-", 2, 1, 2, "FeCl₂"], [26, "Cl-", 3, 1, 3, "FeCl₃"], [29, "O2-", 1, 2, 1, "Cu₂O"], [29, "O2-", 2, 1, 1, "CuO"], [26, "O2-", 3, 2, 3, "Fe₂O₃"],
    [26, "O2-", 2, 1, 1, "FeO"], [82, "Cl-", 2, 1, 2, "PbCl₂"], [29, "Br-", 2, 1, 2, "CuBr₂"], [29, "S2-", 1, 2, 1, "Cu₂S"], [26, "S2-", 2, 1, 1, "FeS"],
    [29, "Cl-", 2, 1, 2, "CuCl₂"], [26, "SO42-", 3, 2, 3, "Fe₂(SO₄)₃"], [29, "NO3-", 2, 1, 2, "Cu(NO₃)₂"], [26, "OH-", 2, 1, 2, "Fe(OH)₂"], [26, "PO43-", 3, 1, 1, "FePO₄"],
  ];
  for (const [Z, an, q, nC, nA, f] of cases) {
    expect(wallFormula(Z, an, { q, nC, nA })).toBe(f);
    expect(isReal(Z, q)).toBe(true);
    expect(isKnownCompound(metalIon(Z, q), ION_BY_ID[an])).toBe(true);
  }
  // Stoffe aus Auswahl, Merksätzen und Zusammenfassung
  for (const [c, a] of [["Fe3+", "OH-"], ["Cu2+", "SO42-"], ["Cu2+", "S2-"], ["Fe3+", "F-"], ["Cu2+", "OH-"], ["Fe2+", "SO42-"]]) expect(isKnownCompound(ION_BY_ID[c], ION_BY_ID[a])).toBe(true);
  expect(nameWith(29, 2, ION_BY_ID["Cl-"])).toBe("Kupfer(II)-chlorid");
  expect(wallName(29, "Cl-", 3)).toBe("Cu³⁺"); // erfundenes Ion: kein Name
  expect(isReal(29, 3) || isReal(26, 1) || isReal(82, 4)).toBe(false);
});

test("Rückmeldungen der Wand: jeder andere Zustand mit Zahlen, nie die Lösung", () => {
  const why = wallWhy(26, "O2-", { q: 3, nC: 2, nA: 3 }, [2, 3]);
  expect(why["Fe₂O₃"]).toBeUndefined();
  expect(why["≠ 3|1|1"]).toContain("1 · (3+) = 3+");
  expect(why["FeO"]).toContain("(II)");
  expect(why["Fe₂O₂"]).toContain("(II)"); // ausgeglichen, nicht gekürzt, falsche römische Zahl
  expect(why["Fe₄O₆"]).toContain("4 : 6");
});

test("PSE: Ladung aus der Gruppe nur bei Gruppe 1, 2, 13 – Rückmeldung zu jeder Auswahl", () => {
  expect([3, 11, 12, 13, 19, 20, 56].every(chargeFromGroup)).toBe(true);
  expect([26, 29, 82].some(chargeFromGroup)).toBe(false);
  expect(pseResult([29, 26])).toBe("Fe Cu");
  const cands = [3, 13, 20, 26, 29], why = pseWhy(cands, [26, 29]);
  expect(why["Fe Cu"]).toBeUndefined();
  expect(Object.keys(why).length).toBe(2 ** cands.length - 1);
  expect(why["Al Fe Cu"]).toContain("13");
  expect(why["Fe"]).toContain("fehlt");
});
