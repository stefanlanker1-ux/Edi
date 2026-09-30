import { describe, expect, it } from "vitest";
import { isBalanced, reactionsFor, NIVEAUS, REACTION_BY_ID, SPECIES_NAMES } from "@lern/chem";
import { GENERATORS, LEVELS, makeRound, type Task } from "./tasks.ts";

const STUFEN = ["us", "os"] as const;
const gen = (s: "us" | "os", id: string, n = 60): Task[] => Array.from({ length: n }, () => GENERATORS[s][id]());

describe("Aufgaben Reaktionsgleichungen", () => {
  it("jede Stufe hat je Niveau 1–4 genug Reaktionen mit Namen für alle Stoffe", () => {
    for (const s of STUFEN) for (const nv of NIVEAUS) {
      const rs = reactionsFor(s, nv);
      expect(rs.filter(r => r.coeffs.some(c => c > 1)).length, `${s} ${nv}`).toBeGreaterThanOrEqual(5);
      for (const r of rs) for (const f of [...r.left, ...r.right]) expect(SPECIES_NAMES[f], f).toBeTruthy();
    }
    // Niveau 4 braucht größere Zahlen als Niveau 1
    for (const s of STUFEN) expect(Math.max(...reactionsFor(s, 4).flatMap(r => r.coeffs))).toBeGreaterThan(Math.max(...reactionsFor(s, 1).flatMap(r => r.coeffs)));
  });
  it("jede Fertigkeit liefert vollständige Aufgaben", () => {
    for (const s of STUFEN) for (const id of Object.keys(GENERATORS[s])) {
      for (const t of gen(s, id)) {
        expect(t.prompt.length, id).toBeGreaterThan(8);
        expect(t.hint.length, id).toBeGreaterThan(8);
        expect(t.explain.length, id).toBeGreaterThan(8);
        if (t.kind === "mc") {
          expect(t.options.length, id).toBeGreaterThanOrEqual(3);
          expect(new Set(t.options).size).toBe(t.options.length);
          expect(t.answer).toBeGreaterThanOrEqual(0);
        }
        if (t.kind === "balance") {
          const r = REACTION_BY_ID[t.reaction];
          expect(r.stufe, id).toBe(s);
          expect(isBalanced(r, r.coeffs)).toBe(true);
          if (id.startsWith("aus")) expect(r.niveau, id).toBe(id === "ausgleichen" ? 2 : Number(id.slice(-1)));
        }
        if (t.kind === "num") expect(t.answer).toBeGreaterThan(0);
      }
    }
  });
  it("≥ 12 verschiedene Aufgaben je Fertigkeit und ≥ 3 Antwortformen insgesamt", () => {
    for (const s of STUFEN) {
      const forms = new Set<string>();
      for (const id of Object.keys(GENERATORS[s])) {
        const ts = gen(s, id, 300);
        ts.forEach(t => forms.add(t.kind));
        const min = id.startsWith("aus") ? 5 : 12;
        expect(new Set(ts.map(t => t.prompt + ("eq" in t ? t.eq : ""))).size, `${s} ${id}`).toBeGreaterThanOrEqual(min);
      }
      expect(forms.size).toBeGreaterThanOrEqual(3);
    }
  });
  it("Distraktoren beim Atome zählen erklären den Fehler", () => {
    for (const s of STUFEN) for (const t of gen(s, "zaehlen", 200)) {
      if (t.kind !== "mc") continue;
      for (const [i, why] of Object.entries(t.why ?? {})) if (Number(i) !== t.answer) expect(why).toMatch(/\d/);
    }
  });
  it("Einzahl/Mehrzahl in Texten", () => {
    for (const s of STUFEN) {
      for (const t of gen(s, "zaehlen", 200)) {
        expect(t.explain).not.toMatch(/\b1 [A-Z][a-z]?-Atome\b/);
        expect(t.explain).not.toMatch(/stecken 1 /);
      }
      for (const t of gen(s, "pruefen", 200)) if (t.kind === "mc") for (const o of t.options) { expect(o).not.toMatch(/ und .* stimmt nicht/); expect(o).not.toMatch(/^Nein – [A-Za-zäöü]+ stimmen nicht/); }
    }
  });
  it("Runden haben 10 Aufgaben mit Typ, vier Niveaus je Stufe", () => {
    for (const s of STUFEN) {
      expect(LEVELS[s].map(l => l.name)).toEqual(["Niveau 1", "Niveau 2", "Niveau 3", "Niveau 4"]);
      for (const l of LEVELS[s].keys()) {
        const round = makeRound(s, l);
        expect(round.length).toBe(10);
        round.forEach(t => expect(LEVELS[s][l].types).toContain(t.type));
      }
      expect(makeRound(s, "mix").length).toBe(10);
    }
  });
});
