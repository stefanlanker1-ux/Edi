// Mechanismus zum Ansatz wählen, Abläufe ohne Animation nachspielen (Zurück, Wiederherstellen) und „Automatisch“.

import { method, stepMono, vinyl, type FG, type VinylId } from "../data.ts";
import { altPair, anionFirst, compat, radicalFirst, reactGroups, seqKind } from "../rules.ts";
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
    const me = r.method ?? "dbpo";
    // Monomer, das keine Ketten bildet: einmal zeigen (abprallend zuerst, mit Nebenreaktion nach zwei Bausteinen), sonst nur das andere
    const bad = [r.a, r.b].find(m => m && compat(m as VinylId, me).fit === "none") as VinylId | undefined;
    const badKind = bad && compat(bad, me).fail;
    if (st.fail) {
      // nach dem Fehlschlag weiter mit dem passenden Monomer – außer es kommt erst danach (nacheinander) oder es gibt keins
      const good = bad && !(r.seq && bad === r.b) ? adds.find(a => a.mono !== bad && compat(a.mono as VinylId, me).fit !== "none") : undefined;
      return good && st.n < target ? good.id : null;
    }
    // nacheinander ohne lebende Ketten: je Monomer eine eigene Kette aus drei Bausteinen, dazwischen Abbruch bzw. Ablösen
    const sep = !!(r.b && r.seq && r.b !== r.a && seqKind(r.a as VinylId, r.b as VinylId, r.method ?? "dbpo") === "separate");
    // Ziegler-Natta: nach dem Ablösen der (letzten) Kette ist der Ablauf fertig – der Katalysator könnte weitere Ketten bilden
    if ((st.done ?? 0) >= (sep ? 2 : 1) && !st.n) return null;
    if (st.n < (sep ? target / 2 : target) && adds.length) {
      let pool = adds;
      if (bad && adds.some(a => a.mono !== bad)) {
        const show = r.seq ? (bad === r.a ? st.n === 0 : st.n >= target / 2) : badKind === "side" ? st.n === 2 : st.n === 0;
        pool = adds.filter(a => (a.mono === bad) === show);
      }
      if (pool.length === 1) return pool[0].id;
      // nacheinander: Block aus a, dann Block aus b; gleichzeitig: zufällig (fest gewürfelt)
      let pick = r.seq ? (st.n < target / 2 ? r.a : r.b!) : ((st.n * 7 + 3) % 5 < 3 ? r.a : r.b!);
      if (!r.seq && r.b && r.b !== r.a && method(me).kind === "anion" && !bad) {
        // anionisch gleichzeitig: das schnellere Monomer zuerst (MMA vor Styrol; Butadien vor Styrol), das andere erst zum Schluss
        const f = anionFirst(r.a as VinylId, r.b as VinylId);
        pick = st.n < target - 2 ? f : f === r.a ? r.b : r.a;
      }
      if (!r.seq && r.b && r.b !== r.a && method(me).kind === "radikal" && !bad) {
        // radikalisch: stark ungleich schnelle Monomere – das schnelle zuerst; ETFE abwechselnd
        const f = radicalFirst(r.a as VinylId, r.b as VinylId);
        if (f) pick = st.n < target - 2 ? f : f === r.a ? r.b : r.a;
        else if (altPair(r.a as VinylId, r.b as VinylId)) pick = st.n % 2 ? r.b : r.a;
      }
      return pool.find(a => a.mono === pick)?.id ?? pool[0].id;
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
