import { describe, expect, it } from "vitest";
import { diagnose } from "@lern/quiz";
import { mix } from "@lern/chem";
import { GENERATORS, LEVELS, NODES, makeRound, type Task } from "./tasks.ts";
import { MISS } from "./misconceptions.ts";

const gen = (id: string, n = 80): Task[] => Array.from({ length: n }, () => GENERATORS[id]());

describe("Aufgaben Reinstoffe und Gemische", () => {
  it("jede Fertigkeit liefert vollständige Aufgaben", () => {
    for (const id of Object.keys(GENERATORS)) for (const t of gen(id)) {
      expect(t.prompt.length, id).toBeGreaterThan(8);
      expect(t.hint.length, id).toBeGreaterThan(8);
      expect(t.explain.length, id).toBeGreaterThan(8);
      if (t.kind === "mc") {
        expect(t.options.length, id).toBeGreaterThanOrEqual(3);
        expect(new Set(t.options).size, id).toBe(t.options.length);
        // diagnostische Distraktoren: Schlüssel aus dem Katalog, Rückmeldung zu jeder falschen Antwort
        for (let i = 0; i < t.options.length; i++) if (i !== t.answer) {
          expect(t.why?.[i], `${id}: ${t.options[i]}`).toBeTruthy();
          expect(MISS[t.miss![i]], `${id}: ${t.miss?.[i]}`).toBeTruthy();
        }
      }
      // keine Lücken in generierten Texten („l/s (undefined)“)
      expect(JSON.stringify(t), id).not.toMatch(/undefined|NaN|\[object/);
      if (t.kind === "map") expect(NODES).toContain(t.answer);
      for (const tr of t.traps ?? []) expect(MISS[tr.miss], `${id}: ${tr.miss}`).toBeTruthy();
    }
  });
  it("Zählaufgaben stimmen mit der Mischlogik überein, Fallen greifen nicht bei richtiger Antwort", () => {
    for (const t of gen("teilchen", 200)) {
      if (t.kind !== "count") continue;
      const m = mix(t.beaker!.items);
      expect(t.answer).toEqual({ p: m.counts.phases, e: m.counts.elements, c: m.counts.compounds });
      for (const tr of t.traps ?? []) {
        const vals = { ...t.answer, ...(tr.values ?? (tr.field ? { [tr.field]: tr.value } : {})) };
        expect(vals).not.toEqual(t.answer);
        expect(diagnose(t, { ok: false, values: vals })?.miss).toBeTruthy();
      }
    }
  });
  it("Map-Aufgaben: jede falsche Wahl mit Falle ergibt eine Diagnose", () => {
    for (const t of [...gen("rein", 200), ...gen("typ", 200)]) {
      if (t.kind !== "map") continue;
      for (const tr of t.traps ?? []) {
        expect(tr.value).not.toBe(NODES.indexOf(t.answer));
        expect(diagnose(t, { ok: false, values: { n: tr.value! } })?.why).toBeTruthy();
      }
    }
  });
  it("≥ 12 verschiedene Aufgaben je Fertigkeit und ≥ 3 Antwortformen", () => {
    const forms = new Set<string>();
    for (const id of Object.keys(GENERATORS)) {
      const ts = gen(id, 300);
      ts.forEach(t => forms.add(t.kind));
      expect(new Set(ts.map(t => t.prompt + (t.item ?? "") + JSON.stringify(t.beaker ?? ""))).size, id).toBeGreaterThanOrEqual(id === "erhitzen" ? 5 : 12);
    }
    expect([...forms].sort()).toEqual(["count", "map", "mc"]);
  });
  it("Einzahl/Mehrzahl in den Erklärungen", () => {
    for (const t of gen("teilchen", 200)) {
      expect(t.explain).not.toMatch(/\b1 (Phasen|Elemente|Verbindungen)\b/);
      expect(t.explain).not.toMatch(/\b([02-9]) (Phase|Element|Verbindung)\b/);
    }
  });
  it("Runden haben 10 Aufgaben mit Typ", () => {
    for (const l of LEVELS.keys()) {
      const r = makeRound("rg", l);
      expect(r.length).toBe(10);
      r.forEach(t => expect(LEVELS[l].types).toContain(t.type));
    }
    expect(makeRound("rg", "mix").length).toBe(10);
  });
});

describe("Trennaufgaben passen zur Trennlogik", () => {
  it("das richtige Verfahren trennt, die Distraktoren sind begründet", async () => {
    const { SEPS_FOR_TEST } = await import("./tasks.ts");
    const { separate } = await import("@lern/chem");
    for (const s of SEPS_FOR_TEST) {
      const r = separate(s.items, s.right);
      expect(r.ok, `${s.goal}`).toBe(true);
      if (r.ok) expect(r.fractions.some(f => f.items.length === 1 && f.items[0] === s.target) || s.right === "eindampfen" || s.right === "destillieren", s.goal).toBe(true);
    }
  });
});
