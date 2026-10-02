import { describe, expect, test } from "vitest";
import { GENS, LEVELS, makeRound, TYPE_NAMES, type Task } from "./tasks.ts";
import { MISS } from "./misconceptions.ts";
import { name } from "../chem/naming.ts";

const many = (id: string, n = 40) => Array.from({ length: n }, () => GENS[id]());

describe("Aufgaben", () => {
  test.each(Object.keys(GENS))("%s: lösbar, Distraktoren mit Diagnose", id => {
    for (const t of many(id)) {
      expect(t.prompt.length).toBeGreaterThan(5);
      if (t.kind === "mc") {
        expect(t.options.length).toBeGreaterThanOrEqual(3);
        expect(new Set(t.options).size).toBe(t.options.length);
        for (const [i, k] of Object.entries(t.miss ?? {})) {
          expect(MISS[k], k).toBeTruthy();
          expect(Number(i)).not.toBe(t.answer);
        }
        // jede falsche Antwort mit Rückmeldung
        t.options.forEach((_, i) => { if (i !== t.answer) expect(t.why?.[i], `${id}: ${t.options[i]}`).toBeTruthy(); });
      } else {
        expect(Number.isInteger(t.answer)).toBe(true);
        for (const tr of t.traps ?? []) { expect(MISS[tr.miss]).toBeTruthy(); expect(tr.value).not.toBe(t.answer); }
      }
      if (t.mol) expect(name(t.mol).ok).toBe(true);
    }
  });
  test("Namensaufgaben: richtige Antwort = berechneter Name, falsche ≠ anderer Name desselben Moleküls", () => {
    for (const id of ["stamm", "alkan", "alken", "gruppen", "ester", "mehrere"]) for (const t of many(id, 30) as (Task & { kind: "mc" })[]) {
      const r = name(t.mol!);
      if (!r.ok) throw new Error(r.reason);
      expect(t.options[t.answer]).toBe(r.name);
      for (const o of t.options) if (o !== r.name) expect(r.alt).not.toContain(o);
    }
  });
  test("Name → Formel: jede Formel hat ihren Namen", () => {
    for (const t of many("struktur", 20) as (Task & { kind: "mc" })[]) {
      for (const o of t.options) { const r = name(t.mols![o]); expect(r.ok && r.name).toBe(o); }
    }
  });
  test("Level: Typen bekannt, Runden mit 10 Aufgaben", () => {
    for (const l of LEVELS) for (const ty of l.types) expect(TYPE_NAMES[ty]).toBeTruthy();
    for (let i = 0; i < LEVELS.length; i++) expect(makeRound("us", i)).toHaveLength(10);
    expect(makeRound("us", "mix")).toHaveLength(10);
  });
});
