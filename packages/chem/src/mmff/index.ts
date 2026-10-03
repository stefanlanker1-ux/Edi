// Kraftfeld MMFF94 (nur in der App zugeschaltet): Atomtypen, Ladungen, Energie, Optimierung, 3D-Startgeometrie.

import { Mol, type MolInput } from "./mol.ts";
import { typeMolecule, type Typed } from "./typer.ts";
import { buildFF, type FF } from "./ff.ts";
import { energy, type Energy } from "./energy.ts";
import { minimize, type MinResult } from "./minimize.ts";
import { embed, stereoMatches, type Stereo, type Embedded } from "./embed.ts";

export type { MolInput, FF, Energy, Typed, MinResult, Stereo, Embedded };
export { Mol, typeMolecule, buildFF, energy, minimize, embed, stereoMatches };

/** Atomtypen, Ladungen und Kraftfeld; null, wenn MMFF94 das Molekül nicht beschreiben kann */
export function setup(input: MolInput): { typed: Typed; ff: FF } | null {
  const typed = typeMolecule(new Mol(input));
  return typed ? { typed, ff: buildFF(typed) } : null;
}
