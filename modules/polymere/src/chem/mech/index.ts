// Mechanismus zum Ansatz wählen, Abläufe ohne Animation nachspielen (Zurück, Wiederherstellen) und „Automatisch“.

import { method, stepMono, vinyl, type FG, type VinylId } from "../data.ts";
import { compat, reactGroups, seqKind } from "../rules.ts";
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
    // nacheinander ohne lebende Ketten: je Monomer eine eigene Kette aus drei Bausteinen, dazwischen Abbruch bzw. Ablösen
    const sep = !!(r.b && r.seq && r.b !== r.a && seqKind(r.a as VinylId, r.b as VinylId, r.method ?? "dbpo") === "separate");
    // Ziegler-Natta: nach dem Ablösen der (letzten) Kette ist der Ablauf fertig – der Katalysator könnte weitere Ketten bilden
    if ((st.done ?? 0) >= (sep ? 2 : 1) && !st.n) return null;
    if (st.n < (sep ? target / 2 : target) && adds.length) {
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
  // Stufenwachstum: ein Monomer, dessen Gruppe zum Kettenende passt – möglichst ein anderes als das letzte; passt keins, ist Schluss
  const last = st.beads.filter(b => b.branchOf === undefined).at(-1)?.mono;
  const fits = adds.filter(a => !a.mono || !st.end || stepMono(a.mono).groups.some(g => reactGroups(st.end as FG, g)));
  return (fits.find(a => a.mono !== last) ?? fits[0])?.id ?? null;
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
