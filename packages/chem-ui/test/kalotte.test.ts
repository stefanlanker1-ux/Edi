import { readFileSync } from "node:fs";
import { test, assert } from "vitest";
import { MOL3D, SPECIES_NAMES, parseFormula } from "@lern/chem";

test("jedes Element jedes benannten Stoffs hat eine Atomfarbe (Token --atom-X)", () => {
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  const els = new Set([...Object.keys(SPECIES_NAMES), ...Object.keys(MOL3D)].flatMap(f => Object.keys(parseFormula(f))));
  for (const el of els) assert.match(css, new RegExp(`--atom-${el}:`), el);
});
