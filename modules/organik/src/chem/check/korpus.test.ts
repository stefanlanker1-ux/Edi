// Regressionstest: Namen, die die Prüfung gegen OPSIN und RDKit bestanden haben (korpus.tsv: Kekulé-SMILES mit E/Z, Name).
// Neu erzeugen nach gewollten Änderungen: python3 scripts/organik-oracle.py --corpus modules/organik/src/chem/check/korpus.tsv

import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { name } from "../naming.ts";
import { smilesMol } from "../smiles.ts";

const rows = readFileSync(new URL("./korpus.tsv", import.meta.url), "utf8").split("\n").filter(Boolean).map(l => l.split("\t"));

test(`geprüfte Namen (${rows.length} Moleküle)`, () => {
  expect(rows.length).toBeGreaterThan(3000);
  const wrong: string[] = [];
  for (const [smi, want] of rows) {
    const r = name(smilesMol(smi));
    const got = r.ok ? r.name : r.reason;
    if (got !== want) wrong.push(`${smi}: ${got} ≠ ${want}`);
  }
  expect(wrong.slice(0, 10)).toEqual([]);
}, 120_000);
