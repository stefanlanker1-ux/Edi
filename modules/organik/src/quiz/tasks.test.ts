import { describe, expect, test } from "vitest";
import { GENS, LEVELS, makeRound, nameDistractors, TYPE_NAMES, type Task } from "./tasks.ts";
import { MISS } from "./misconceptions.ts";
import type { Diag } from "@lern/quiz";
import { keepEnding, name, type NameOk } from "../chem/naming.ts";
import { freeValence, type Mol } from "../chem/mol.ts";
import { smilesMol } from "../chem/smiles.ts";

const many = (id: string, n = 40) => Array.from({ length: n }, () => GENS[id]());

describe("Aufgaben", () => {
  test.each(Object.keys(GENS))("%s: lösbar, Distraktoren mit Diagnose", id => {
    for (const t of many(id)) {
      expect(t.prompt.length).toBeGreaterThan(5);
      if (t.kind === "mc") {
        expect(t.options.length).toBeGreaterThanOrEqual(id === "ez" ? 2 : 3);
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
  test("jedes Molekül aller Aufgaben ist chemisch möglich (Wertigkeit nie überschritten)", () => {
    for (const id of Object.keys(GENS)) for (const t of many(id, id === "gruppen" ? 300 : 60)) {
      for (const m of [t.mol, ...Object.values(t.mols ?? {})].filter((x): x is Mol => !!x))
        expect(m.atoms.filter(a => freeValence(m, a.id) < 0), `${id}: ${t.prompt}`).toEqual([]);
    }
  }, 120_000);
  test("Mehrere Gruppen: auch Oxo als Vorsilbe, Namen richtig", () => {
    const ts = [...many("mehrere", 150), ...many("prio", 60)];
    const oxo = ts.filter(t => (name(t.mol!) as NameOk).prefixes.some(p => p.name === "oxo"));
    expect(oxo.length).toBeGreaterThan(10);
    for (const t of many("mehrere", 60) as (Task & { kind: "mc" })[]) expect(t.options[t.answer]).toBe((name(t.mol!) as NameOk).name);
  }, 60_000);
  test("andere Seite nummeriert: Rückmeldung nennt die Regel, die hier entscheidet", () => {
    const why = (s: string, wrong: string) => {
      const m = smilesMol(s), r = name(m) as NameOk;
      const x = nameDistractors(m, r).find((d): d is Diag => typeof d === "object" && d?.text === wrong);
      expect(x?.miss, `${s}: ${wrong}`).toBe("nummer");
      return x!.why;
    };
    expect(why("CC(C)CCC=O", "2-Methylpentanal")).toMatch(/–CHO-Gruppe ist immer C1/);
    expect(why("OC(=O)CCC(C)C", "2-Methylpentansäure")).toMatch(/–COOH-Gruppe ist immer C1/);
    expect(why("CCC(CC)CC(C)CC", "5-Ethyl-3-methylheptan")).toMatch(/Alphabet: Ethyl bekommt die 3/);
    expect(why("CC(O)CCC(C)C", "2-Methylhexan-5-ol")).toMatch(/–OH bekommt die kleinste Nummer: 2 statt 5/);
    expect(why("C=CCCC", "Pent-4-en")).toMatch(/Doppelbindung bekommt die kleinste Nummer: 1 statt 4/);
    expect(why("CC(C)CC", "3-Methylbutan")).toMatch(/Der Ast bekommt die kleinste Nummer: 2 statt 3/);
    expect(why("CC(C)CCC(C)(C)CC", "3,3,6-Trimethylheptan")).toMatch(/2,5,5 statt 3,3,6\. Der erste Unterschied entscheidet/);
    for (const id of ["alkan", "alken", "gruppen", "mehrere"]) for (const t of many(id, 40) as (Task & { kind: "mc" })[])
      t.options.forEach((o, i) => { if (t.miss?.[i] === "nummer") expect(t.why![i], o).not.toMatch(/Dann sind die Nummern kleiner/); });
  }, 60_000);
  test("ohne di/tri: Rückmeldung mit dem Rest der Aufgabe", () => {
    const m = smilesMol("CCC(CC)C(CC)CCC"), r = name(m) as NameOk;
    expect(nameDistractors(m, r).find((d): d is Diag => typeof d === "object" && d?.miss === "multi")?.why).toBe("Gleiche Äste zusammenfassen: Diethyl statt 2 × Ethyl.");
  });
  test("andere Gruppe an derselben Stelle: nur die Endung ist anders", () => {
    const head = (n: string) => n.slice(0, n.search(/(meth|eth|prop|but|pent|hex)an/i));
    for (const t of many("gruppen", 200) as (Task & { kind: "mc" })[])
      t.options.forEach((o, i) => { if (t.miss?.[i] === "endung") expect(head(o), `${t.options[t.answer]} → ${o}`).toBe(head(t.options[t.answer])); });
  }, 60_000);
  test("Name → Formel: COOH bleibt ganz, Stolperstein passt zur Änderung", () => {
    for (const t of many("struktur", 80) as (Task & { kind: "mc" })[]) {
      t.options.forEach((o, i) => {
        expect(o).not.toMatch(/(\d+),\1-diol/);
        if (t.miss?.[i] === "nummer") expect((name(t.mols![o]) as NameOk).parent.size).toBe((name(t.mols![t.options[t.answer]]) as NameOk).parent.size);
      });
    }
  }, 60_000);
  test("Endungen in Texten mit geschütztem Bindestrich (kein Umbruch „→ -⏎in“)", () => {
    for (const id of Object.keys(GENS)) for (const t of many(id, 10)) {
      const texts = [t.prompt, t.hint, t.explain, ...Object.values(t.kind === "mc" ? t.why ?? {} : {}), ...(t.traps ?? []).map(x => x.why)];
      for (const s of texts) expect(s, id).not.toMatch(/(^|[\s(*])-\p{L}/u);
    }
  }, 60_000);
  test("Formeln wie –COO– und –OH: kein Umbruch nach dem Strich", () => {
    expect(keepEnding("Ester –COO– zwischen, R–O–R, (–OH)")).toBe("Ester –\u2060COO– zwischen, R–\u2060O–\u2060R, (–\u2060OH)");
    expect(keepEnding("Säure – Endung")).toBe("Säure – Endung"); // Gedankenstrich bleibt Umbruchstelle
    for (const id of ["klasse", "endung", "prio", "ester"]) for (const t of many(id, 20)) {
      const texts = [t.prompt, t.hint, t.explain, ...Object.values(t.kind === "mc" ? t.why ?? {} : {})];
      for (const s of texts) expect(s, id).not.toMatch(/–[A-Z(]/);
    }
  });
  test("Tipps sind Denkschritte: keine Zuordnung Gruppe → Endung, keine Rangfolge, nicht die Antwort", () => {
    for (const id of Object.keys(GENS)) for (const t of many(id, 15)) {
      const h = t.hint.replace(/\u2011/g, "-");
      expect(h, id).not.toMatch(/→ ?-|vor \p{L}+ vor|>|Meth 1/u);
      if (t.kind === "mc" && ["stamm", "klasse", "endung", "prio"].includes(id)) expect(h, id).not.toContain(t.options[t.answer]);
    }
  });
  test("Stoffklasse: Rückmeldung zur falschen Klasse wiederholt nicht die Erklärung", () => {
    for (const t of many("klasse", 40) as (Task & { kind: "mc" })[])
      t.options.forEach((o, i) => { if (i !== t.answer) expect(t.why![i], o).not.toContain(t.explain); });
  });
  test("Mehrere Gruppen: bei Säuren kein Name, der die COOH-Gruppe zerlegt (1-Hydroxy-…-1-oxo)", () => {
    for (const t of many("mehrere", 120) as (Task & { kind: "mc" })[]) for (const o of t.options) expect(o).not.toMatch(/1-Hydroxy.*1-oxo/i);
  }, 60_000);
  test("Level: Typen bekannt, Runden mit 10 Aufgaben", () => {
    for (const l of LEVELS) for (const ty of l.types) expect(TYPE_NAMES[ty]).toBeTruthy();
    for (let i = 0; i < LEVELS.length; i++) expect(makeRound("us", i)).toHaveLength(10);
    expect(makeRound("us", "mix")).toHaveLength(10);
  });
});
