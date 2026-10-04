// Mechanismus zum Ansatz wählen, Abläufe ohne Animation nachspielen (Zurück, Wiederherstellen) und „Automatisch“.

import { method, vinyl, type VinylId } from "../data.ts";
import { compat } from "../rules.ts";
import { ChainMech } from "./chain.ts";
import { StepMech } from "./step.ts";
import { ZnMech } from "./zn.ts";
import type { Mech, Recipe } from "./types.ts";

export function makeMech(r: Recipe): Mech {
  if (r.art !== "poly") return new StepMech(r);
  return method(r.method ?? "dbpo").kind === "koord" ? new ZnMech(r) : new ChainMech(r);
}

/** Ansatz neu aufbauen und die Aktionen ohne Animation ausführen */
export function replay(r: Recipe, actions: string[]): Mech {
  const m = makeMech(r);
  for (const a of actions) if (m.actions().some(x => x.id === a)) m.run(a);
  return m;
}

/** nächster Schritt für „Automatisch“ (null = fertig) */
export function nextAuto(m: Mech, r: Recipe): string | null {
  const acts = m.actions();
  if (!acts.length) return null;
  const st = m.status();
  const start = acts.find(a => a.kind === "start");
  if (start) return start.id;
  const adds = acts.filter(a => a.kind === "add");
  const target = r.art === "poly" ? (r.b ? 6 : 5) : 5;
  if (r.art === "poly") {
    // Monomer, das nicht reagiert, nur einmal zeigen – dann Ende
    if (st.fail) return null;
    if (st.n < target && adds.length) {
      const ms = adds.map(a => a.mono as VinylId);
      if (ms.length === 1) return adds[0].id;
      // nacheinander: Block aus a, dann Block aus b; gleichzeitig: zufällig (fest gewürfelt)
      const pick = r.seq ? (st.n < target / 2 ? r.a : r.b!) : ((st.n * 7 + 3) % 5 < 3 ? r.a : r.b!);
      return adds.find(a => a.mono === pick)?.id ?? adds[0].id;
    }
    const stop = acts.find(a => a.kind === "stop");
    return stop && st.n >= 1 ? stop.id : null;
  }
  if (st.n >= target) return null;
  // Stufenwachstum: das Monomer nehmen, das zum Kettenende passt (sonst das erste)
  return adds.find(a => a.mono !== st.beads[st.beads.length - 1]?.mono)?.id ?? adds[0]?.id ?? null;
}

/** passt das Verfahren zu allen Monomeren des Ansatzes? (für Kennzeichen in der Auswahl) */
export const recipeFit = (r: Recipe) => {
  if (r.art !== "poly") return "ok";
  const ms = [r.a, r.b].filter(Boolean) as VinylId[];
  const fits = ms.map(m => compat(m, r.method ?? "dbpo").fit);
  return fits.includes("none") ? "none" : fits.includes("short") ? "short" : "ok";
};

export const isDiene = (id: string) => vinyl(id).diene === true;
export { type Mech, type Recipe } from "./types.ts";
