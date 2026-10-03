// Räumliche Lage: hinterlegte Strukturen (gemessene Werte, mol3d.ts) überall; für alle übrigen Moleküle
// das Kraftfeld MMFF94 – nur in der Android/iOS-App zugeschaltet (im Web nie geladen), Rechenpaket wird erst bei Bedarf nachgeladen.

import { storedMol3D, type Mol3D, type Molecule } from "@lern/chem";
import { isNative } from "@lern/ui";

/** Kraftfeld verfügbar (App) */
export const forceFieldAvailable = isNative;

export interface FFInput {
  el: string[];
  q?: number[];
  b: [number, number, number][];
  /** Stereo: Zentren [Atom, Nachbar 1, 2, 3, Vorzeichen], Doppelbindungen [a, b, c, d, cis 1|0] */
  stereo?: { c: number[][]; d: number[][] };
}

/** berechnete Lage (Å) oder null, wenn MMFF94 das Molekül nicht beschreibt */
export async function computeMol3D(input: FFInput): Promise<Mol3D | null> {
  const { setup, embed } = await import("@lern/chem/mmff");
  const s = setup({ el: input.el, q: input.q, b: input.b });
  if (!s) return null;
  const r = embed(s.typed, s.ff, input.stereo ?? { c: [], d: [] }, 2);
  return { atoms: input.el.map((el, i) => [el, r.x[3 * i], r.x[3 * i + 1], r.x[3 * i + 2]]), bonds: input.b };
}

/** hinterlegte Struktur zu einer Kraftfeld-Eingabe (ohne Ladungen), sonst null */
export function storedFor(input: FFInput): Mol3D | null {
  if (input.q?.some(Boolean)) return null;
  return storedMol3D({
    atoms: input.el.map((el, i) => ({ id: i + 1, el, x: 0, y: 0 })),
    bonds: input.b.map(([a, b, order]) => ({ a: a + 1, b: b + 1, order })),
  });
}

/** Molekül vom Raster (Elektronenpaarbindung) als Eingabe für das Kraftfeld */
export function moleculeInput(m: Molecule): FFInput {
  const idx = new Map(m.atoms.map((a, i) => [a.id, i]));
  return { el: m.atoms.map(a => a.el), b: m.bonds.map(b => [idx.get(b.a)!, idx.get(b.b)!, b.order]) };
}
