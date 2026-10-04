// Kurze Erklärkarten je Kapitel mit einem Bild als Beispiel; die Kapitel haben einen zugeschnittenen Tipp je Aufgabe.

import { RichText } from "@lern/ui";
import type { LevelKey } from "@lern/quiz";
import { tr } from "@lern/i18n";
import { LEVELS, type Task } from "./tasks.ts";
import { VisView, type Vis } from "./visual.tsx";

const TEXT: Record<string, { points: string[]; vis: Vis[] }> = tr({
  k1: { vis: [{ k: "mono", id: "propen" }, { k: "unit", id: "propen" }], points: [
    "Ein **Polymer** ist ein Riesenmolekül aus vielen **Monomeren**. Name: Poly + Monomer.",
    "Monomere der Polymerisation haben eine **C=C-Zweifachbindung**. Im Polymer ist sie zur Einfachbindung geworden.",
    "Der **Baustein** steht in [ ]ₙ. Im **Kügelchenmodell** ist jeder Baustein eine Kugel.",
  ] },
  k2: { vis: [{ k: "mech", r: { art: "poly", a: "styrol", method: "dbpo" }, acts: ["heat", "add:styrol"], key: 1 }], points: [
    "**Start**: Der Starter zerfällt beim Erwärmen in **Radikale** (ungepaartes Elektron).",
    "**Kettenwachstum**: Radikal + C=C → neues Radikal am Kettenende. Halber Pfeil = ein Elektron.",
    "**Abbruch**: zwei Radikale – **Rekombination** (Enden verbinden sich) oder **Disproportionierung** (H wandert).",
  ] },
  k3: { vis: [{ k: "chain", id: "propen", n: 4, tact: "iso" }], points: [
    "**Ziegler-Natta**: Einbau an der **freien Stelle** am Titan, Katalysator wird nicht verbraucht.",
    "O-, N-, Cl- oder F-Atome **vergiften** das Titan. Ergebnis: unverzweigt (PE-HD), **isotaktisch** (PP).",
    "**Anionisch**: lebende Ketten → Blockcopolymere. **Kationisch**: Isobuten bei −100 °C.",
  ] },
  k4: { vis: [{ k: "pair", a: "terephthalsaeure", b: "ethandiol" }], points: [
    "**Polykondensation**: Gruppen reagieren, ein kleines Molekül geht ab (**H₂O**, mit Säurechlorid **HCl**).",
    "Säure + Alkohol → **Esterbindung** (Polyester, PET). Säure + Amin → **Amidbindung** (Nylon).",
    "Zwei Gruppen je Monomer: Kette. Eine: **Kettenstopper**. Drei: **Netz**.",
  ] },
  k5: { vis: [{ k: "pair", a: "hdi", b: "butandiol" }], points: [
    "**Polyaddition**: **kein Nebenprodukt** – ein H-Atom wandert.",
    "Isocyanat + Alkohol → **Urethan** (PUR). Isocyanat + Amin → **Harnstoff**.",
    "**Epoxidharz**: Ring öffnet sich, jede –NH₂ reagiert zweimal → Netz.",
  ] },
  k6: { vis: [{ k: "struct", s: "elast" }], points: [
    "**Thermoplast**: einzelne Ketten, schmelzbar. **Elastomer**: wenige Brücken, dehnbar. **Duroplast**: dichtes Netz, hart.",
    "**Copolymere**: statistisch, alternierend oder in **Blöcken**.",
    "**Kettenwachstum**: lange Ketten sofort. **Stufenwachstum**: lange Ketten erst am Ende.",
  ] },
}, {
  k1: { vis: [{ k: "mono", id: "propen" }, { k: "unit", id: "propen" }], points: [
    "A **polymer** is a giant molecule made of many **monomers**. Name: poly + monomer.",
    "Monomers for polymerisation have a **C=C double bond**. In the polymer it has become a single bond.",
    "The **unit** stands in [ ]ₙ. In the **bead model** each unit is one bead.",
  ] },
  k2: { vis: [{ k: "mech", r: { art: "poly", a: "styrol", method: "dbpo" }, acts: ["heat", "add:styrol"], key: 1 }], points: [
    "**Initiation**: the initiator splits into **radicals** (unpaired electron) on heating.",
    "**Chain growth**: radical + C=C → new radical at the chain end. Half arrow = one electron.",
    "**Termination**: two radicals – **combination** (ends join) or **disproportionation** (H moves).",
  ] },
  k3: { vis: [{ k: "chain", id: "propen", n: 4, tact: "iso" }], points: [
    "**Ziegler–Natta**: insertion at the **free site** on titanium, the catalyst is not used up.",
    "O, N, Cl or F atoms **poison** the titanium. Result: unbranched (PE-HD), **isotactic** (PP).",
    "**Anionic**: living chains → block copolymers. **Cationic**: isobutene at −100 °C.",
  ] },
  k4: { vis: [{ k: "pair", a: "terephthalsaeure", b: "ethandiol" }], points: [
    "**Polycondensation**: groups react, a small molecule leaves (**H₂O**, with acid chloride **HCl**).",
    "Acid + alcohol → **ester bond** (polyester, PET). Acid + amine → **amide bond** (nylon).",
    "Two groups per monomer: chain. One: **chain stopper**. Three: **network**.",
  ] },
  k5: { vis: [{ k: "pair", a: "hdi", b: "butandiol" }], points: [
    "**Polyaddition**: **no by-product** – an H atom moves.",
    "Isocyanate + alcohol → **urethane** (PUR). Isocyanate + amine → **urea**.",
    "**Epoxy resin**: the ring opens, each –NH₂ reacts twice → network.",
  ] },
  k6: { vis: [{ k: "struct", s: "elast" }], points: [
    "**Thermoplastic**: separate chains, meltable. **Elastomer**: a few bridges, stretchy. **Thermoset**: dense network, hard.",
    "**Copolymers**: statistical, alternating or in **blocks**.",
    "**Chain growth**: long chains at once. **Step growth**: long chains only at the end.",
  ] },
});
const TOPIC: Record<string, string> = { "pm-k1": "k1", "pm-k2": "k2", "pm-k3": "k3", "pm-k4": "k4", "pm-k5": "k5", "pm-k6": "k6" };
const CUE = tr("In diesem Kapitel hilft der **Tipp** genau bei der Aufgabe. Tipp antippen kostet keine Punkte.", "In this chapter the **hint** helps with exactly this task. Tapping the hint costs no points.");

export function explainFor(level: LevelKey, task?: Task) {
  const id = typeof level === "number" ? LEVELS[level].id : (LEVELS.find(l => task?.type && l.types.includes(task.type)) ?? LEVELS[0]).id;
  const e = TEXT[TOPIC[id]];
  return (
    <div className="explain">
      <ul className="ex-points">{[CUE, ...e.points].map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      <figure className="ex-example pm-ex-fig">
        {e.vis.map((v, i) => <span key={i} className="pm-ex-step">{i > 0 && <span className="pm-ex-arrow" aria-hidden="true">→</span>}<VisView v={v} /></span>)}
      </figure>
    </div>
  );
}
