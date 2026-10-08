// Üben: Wer die Lösung angesehen hat, bekommt dafür kein ✓ („Prüfen“ zeigt nur, dass die Gleichung stimmt).
import { describe, expect, it } from "vitest";
import { REACTION_BY_ID } from "@lern/chem";

const mem = new Map<string, string>();
globalThis.localStorage ??= {
  getItem: k => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: k => void mem.delete(k),
  clear: () => mem.clear(), key: () => null, length: 0,
} as Storage;
const { useUeben, coeffsOf } = await import("./store.ts");

describe("Üben: Lösung angesehen", () => {
  it("„Lösung“, dann „Prüfen“ zählt nicht als gelöst; beim Weitergehen beginnt die Gleichung von vorn und kann dann selbst gelöst werden", () => {
    const id = "hf", r = REACTION_BY_ID[id], s = () => useUeben.getState();
    s().showSolution(id, r.coeffs);
    expect(coeffsOf(s(), id)).toEqual(r.coeffs);
    s().solved(id);
    expect(s().done[id]).toBeUndefined();
    // gespeichert: auch nach dem Neuladen zählt es nicht
    expect(JSON.parse(localStorage.getItem("reaktionsgleichungen-ueben")!).state.peeked[id]).toBe(true);
    s().setAt("us", "einfach", 1);
    expect(s().peeked[id]).toBeUndefined();
    expect(coeffsOf(s(), id)).toEqual(r.coeffs.map(() => 1));
    r.coeffs.forEach((c, k) => s().setCoeff(id, k, c));
    s().solved(id);
    expect(s().done[id]).toBe(true);
  });
});
