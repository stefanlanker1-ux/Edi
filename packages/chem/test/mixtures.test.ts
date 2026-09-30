import { describe, expect, it } from "vitest";
import { STOFFE, STOFF, isElement, mix, separate, heat, classText, EVERYDAY, MIX_TYPES, type Item } from "../src/mixtures.ts";

const types = (items: Item[]) => mix(items).types.map(t => `${t.type} ${t.states}`);

describe("Stoffregal", () => {
  it("Elemente und Verbindungen nach der Formel", () => {
    expect(STOFFE.filter(s => !s.product).length).toBeGreaterThanOrEqual(20);
    for (const id of ["fe", "o2", "h2", "he", "s", "c"]) expect(isElement(STOFF[id]), id).toBe(true);
    for (const id of ["h2o", "nacl", "co2", "zucker", "sand", "fes"]) expect(isElement(STOFF[id]), id).toBe(false);
  });
});

describe("Mischen", () => {
  it("Reinstoffe", () => {
    expect(classText(mix(["o2"]))).toBe("Element");
    expect(classText(mix(["h2o"]))).toBe("Verbindung");
    expect(mix(["h2o"]).counts).toEqual({ phases: 1, elements: 0, compounds: 1 });
  });
  it("Lösungen sind homogen (s/l, l/l, g/l)", () => {
    expect(mix(["h2o", "nacl"]).homogen).toBe(true);
    expect(types(["h2o", "nacl"])).toEqual(["loesung s/l"]);
    expect(types(["h2o", "ethanol"])).toEqual(["loesung l/l"]);
    expect(types(["h2o", "co2"])).toEqual(["loesung g/l"]);
    expect(mix(["h2o", "cuso4"]).counts).toEqual({ phases: 1, elements: 0, compounds: 2 });
  });
  it("Gasgemisch und Legierung", () => {
    expect(types(["n2", "o2"])).toEqual(["gasgemisch g/g"]);
    expect(mix(["n2", "o2"]).counts).toEqual({ phases: 1, elements: 2, compounds: 0 });
    const m = mix([{ alloy: ["cu", "zn"] }]);
    expect(m.homogen).toBe(true);
    expect(m.label).toBe("Messing");
    expect(m.counts).toEqual({ phases: 1, elements: 2, compounds: 0 });
  });
  it("heterogen: Emulsion, Suspension, Gemenge", () => {
    expect(types(["h2o", "oel"])).toEqual(["emulsion l/l"]);
    expect(types(["h2o", "sand"])).toEqual(["suspension s/l"]);
    expect(types(["fe", "s"])).toEqual(["gemenge s/s"]);
    expect(mix(["fe", "s"]).counts).toEqual({ phases: 2, elements: 2, compounds: 0 });
    // Salz löst sich, Sand nicht: 2 Phasen, 3 Verbindungen
    expect(mix(["h2o", "nacl", "sand"]).counts).toEqual({ phases: 2, elements: 0, compounds: 3 });
    // Gas, das sich nicht löst: eigene Phase
    expect(mix(["h2o", "o2"]).counts.phases).toBe(2);
  });
});

describe("Trennen und Erhitzen", () => {
  it("passende Verfahren trennen", () => {
    expect(separate(["fe", "s"], "magnet")).toMatchObject({ ok: true, fractions: [{ items: ["fe"] }, { items: ["s"] }] });
    expect(separate(["h2o", "sand"], "filtrieren")).toMatchObject({ ok: true, fractions: [{ items: ["sand"] }, { items: ["h2o"] }] });
    expect(separate(["h2o", "nacl"], "eindampfen")).toMatchObject({ ok: true, fractions: [{ items: ["nacl"] }] });
    expect(separate(["h2o", "oel"], "scheidetrichter")).toMatchObject({ ok: true, fractions: [{ items: ["h2o"] }, { items: ["oel"] }] });
    expect(separate(["h2o", "ethanol"], "destillieren")).toMatchObject({ ok: true, fractions: [{ items: ["ethanol"] }, { items: ["h2o"] }] });
  });
  it("unpassende Verfahren mit Begründung", () => {
    expect(separate(["h2o", "nacl"], "filtrieren")).toMatchObject({ ok: false });
    expect(separate(["h2o", "sand"], "magnet")).toMatchObject({ ok: false });
    expect(separate(["fes"], "magnet")).toMatchObject({ ok: false });
    expect(separate(["h2o", "sand"], "dekantieren", false)).toMatchObject({ ok: false });
  });
  it("Erhitzen: Reaktion, Legierung, Zersetzung", () => {
    expect(heat(["fe", "s"])).toMatchObject({ ok: true, items: ["fes"], kind: "reaktion" });
    expect(heat(["cu", "zn"])).toMatchObject({ ok: true, items: [{ alloy: ["cu", "zn"] }], kind: "legierung" });
    expect(heat(["fe", "c"])).toMatchObject({ ok: true, kind: "legierung" });
    expect(heat(["zucker"])).toMatchObject({ ok: true, items: ["c"] });
    expect(heat(["h2o", "nacl"]).ok).toBe(false);
  });
});

describe("Alltagsbeispiele", () => {
  it("jeder Gemischtyp hat Beispiele, Reinstoffe haben Formeln", () => {
    for (const t of Object.keys(MIX_TYPES)) expect(EVERYDAY.filter(e => e.kind === t).length, t).toBeGreaterThanOrEqual(2);
    for (const e of EVERYDAY.filter(e => e.kind === "element" || e.kind === "verbindung")) expect(e.formula, e.name).toBeTruthy();
  });
});
