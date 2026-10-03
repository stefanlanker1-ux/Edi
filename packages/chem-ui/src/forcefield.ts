// Räumliche Lage: hinterlegte Strukturen (gemessene Werte, mol3d.ts); für alle übrigen Moleküle das Kraftfeld MMFF94.
// Das Rechenpaket wird erst bei Bedarf nachgeladen und läuft in einem Hintergrund-Thread (Web Worker).

import { storedMol3D, type Mol3D, type Molecule } from "@lern/chem";

/** Kraftfeld verfügbar (Web und App) */
export const forceFieldAvailable = true;

export interface FFInput {
  el: string[];
  q?: number[];
  b: [number, number, number][];
  /** Stereo: Zentren [Atom, Nachbar 1, 2, 3, Vorzeichen], Doppelbindungen [a, b, c, d, cis 1|0] */
  stereo?: { c: number[][]; d: number[][] };
}

let worker: Worker | null = null, nextId = 0;
const waiting = new Map<number, (x: number[] | null) => void>();

async function inWorker(input: FFInput): Promise<number[] | null> {
  if (!worker) {
    const { default: FFWorker } = await import("./ff.worker.ts?worker&inline");
    worker = new FFWorker();
    worker.onmessage = (e: MessageEvent<{ id: number; x: number[] | null }>) => { waiting.get(e.data.id)?.(e.data.x); waiting.delete(e.data.id); };
  }
  const id = nextId++;
  return new Promise(res => { waiting.set(id, res); worker!.postMessage({ id, input }); });
}

/** berechnete Lage (Å) oder null, wenn MMFF94 das Molekül nicht beschreibt */
export async function computeMol3D(input: FFInput): Promise<Mol3D | null> {
  let x: number[] | null;
  if (typeof Worker !== "undefined") x = await inWorker(input);
  else x = (await import("./ff.worker.ts")).compute(input); // ohne Worker (z. B. Tests): direkt
  return x && { atoms: input.el.map((el, i) => [el, x[3 * i], x[3 * i + 1], x[3 * i + 2]]), bonds: input.b };
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
