// Hintergrund-Thread für das Kraftfeld MMFF94: die Oberfläche bleibt bedienbar, auch wenn große Moleküle einige Sekunden brauchen.

import { setup, embed } from "@lern/chem/mmff";
import type { FFInput } from "./forcefield.ts";

export function compute(input: FFInput) {
  const s = setup({ el: input.el, q: input.q, b: input.b });
  if (!s) return null;
  const r = embed(s.typed, s.ff, input.stereo ?? { c: [], d: [] }, 2);
  return Array.from(r.x);
}

// nur im Worker auf Nachrichten hören (direkt importiert, z. B. in Tests, bleibt es eine gewöhnliche Funktion)
if (typeof window === "undefined" && typeof self !== "undefined") {
  self.onmessage = (e: MessageEvent<{ id: number; input: FFInput }>) => {
    let x: number[] | null = null;
    try { x = compute(e.data.input); } catch { x = null; }
    self.postMessage({ id: e.data.id, x });
  };
}
