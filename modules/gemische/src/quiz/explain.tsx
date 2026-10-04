// Kurze Erklärkarten je Thema mit Teilchenbildern als Beispiel (Lösen: vorher → nachher); Level mit Tipp nennen den Tipp-Knopf.

import { RichText } from "@lern/ui";
import type { LevelKey } from "@lern/quiz";
import { Beaker } from "../components/Beaker.tsx";
import { initial, seedOf, type Arrange } from "../mixing.ts";
import { EXAMPLES, small } from "../mixtures.ts";
import { LEVELS, type Task } from "./tasks.ts";
import { SepScene, type Method } from "../components/Separation.tsx";
import { tr } from "@lern/i18n";

const TEXT: Record<string, { points: string[]; ex: string; arr: Arrange[]; sep?: Method }> = tr({
  k1: { ex: "modell", arr: ["nachher"], points: [
    "Ein **Teilchen** ist ein **Molekül** oder ein einzelnes Atom. Jede Kugel im Bild ist ein Atom.",
    "Jede **Atomsorte** hat eine eigene Farbe. Gleiche Teilchen bilden einen **Stoff**.",
    "Zwischen den Teilchen ist **nichts**. Ein einzelnes Teilchen hat keine Farbe.",
  ] },
  k2: { ex: "schutzgas", arr: ["nachher"], points: [
    "**Element:** nur **eine** Atomsorte (He, Cu, O₂).",
    "**Verbindung:** mehrere Atomsorten fest in einem Teilchen (H₂O, CO₂).",
    "Zähle **Stoffe**, nicht Teilchen: gleiche Teilchen sind ein Stoff.",
  ] },
  k3: { ex: "zucker", arr: ["vorher", "nachher"], points: [
    "**Reinstoff:** nur ein Stoff. **Gemisch:** mehrere Stoffe.",
    "**Homogen:** überall gleich. **Heterogen:** Teile, Tröpfchen oder Schichten zu sehen.",
    "Beim **Lösen** verteilen sich die Teilchen. Sie verschwinden nicht, die **Masse bleibt gleich**.",
  ] },
  k4: { ex: "messing", arr: ["nachher"], points: [
    "Homogen: **Lösung** (s/l), **Legierung** (s/s), **Gasgemisch** (g/g).",
    "Heterogen: **Emulsion** (l/l), **Suspension** (s/l), **Gemenge** (s/s), **Rauch** (s/g), **Nebel** (l/g), **Schaum** (g/l).",
    "„Rein“ auf einer Packung heißt: nichts dazugegeben. Ein **Reinstoff** ist nur **ein** Stoff.",
  ] },
  k5: { ex: "", arr: [], sep: "filtrieren", points: [
    "Jedes Verfahren nutzt eine **Eigenschaft**: Korngröße (**Sieben**, **Filtrieren**), Magnetismus (**Magnet**), Dichte (**Dekantieren**), Siedetemperatur (**Eindampfen**, **Destillieren**).",
    "Filtrieren: **Rückstand** bleibt im Filter, **Filtrat** läuft durch. Gelöstes geht durch den Filter.",
    "Destillieren: Dampf wird im **Kühler** flüssig, das **Destillat**. **Chromatografie** trennt Farbstoffe.",
  ] },
}, {
  k1: { ex: "modell", arr: ["nachher"], points: [
    "A **particle** is a **molecule** or a single atom. Each sphere in the picture is an atom.",
    "Each **kind of atom** has its own colour. Identical particles form a **substance**.",
    "Between the particles there is **nothing**. A single particle has no colour.",
  ] },
  k2: { ex: "schutzgas", arr: ["nachher"], points: [
    "**Element:** only **one** kind of atom (He, Cu, O₂).",
    "**Compound:** several kinds of atoms bonded in one particle (H₂O, CO₂).",
    "Count **substances**, not particles: identical particles are one substance.",
  ] },
  k3: { ex: "zucker", arr: ["vorher", "nachher"], points: [
    "**Pure substance:** only one substance. **Mixture:** several substances.",
    "**Homogeneous:** the same everywhere. **Heterogeneous:** pieces, droplets or layers visible.",
    "When **dissolving**, the particles spread out. They do not disappear, the **mass stays the same**.",
  ] },
  k4: { ex: "messing", arr: ["nachher"], points: [
    "Homogeneous: **solution** (s/l), **alloy** (s/s), **gas mixture** (g/g).",
    "Heterogeneous: **emulsion** (l/l), **suspension** (s/l), **coarse mixture** (s/s), **smoke** (s/g), **fog** (l/g), **foam** (g/l).",
    "“Pure” on a package means: nothing added. A **pure substance** is only **one** substance.",
  ] },
  k5: { ex: "", arr: [], sep: "filtrieren", points: [
    "Each method uses a **property**: grain size (**sieving**, **filtering**), magnetism (**magnet**), density (**decanting**), boiling point (**evaporating**, **distilling**).",
    "Filtering: the **residue** stays in the filter, the **filtrate** runs through. Dissolved things pass through.",
    "Distilling: vapour turns liquid in the **condenser**, the **distillate**. **Chromatography** separates dyes.",
  ] },
});
const TOPIC: Record<string, string> = { "gm-k1": "k1", "gm-k2": "k2", "gm-k3": "k3", "gm-k4": "k4", "gm-k5": "k5" };
const CUE = tr("In diesem Niveau hilft der **Tipp** genau bei der Aufgabe. Tipp antippen kostet keine Punkte.", "At this stage the **hint** helps with exactly this task. Tapping the hint costs no points.");

export function explainFor(level: LevelKey, task?: Task) {
  const id = typeof level === "number" ? LEVELS[level].id : (LEVELS.find(l => task?.type && l.types.includes(task.type)) ?? LEVELS[0]).id;
  const e = TEXT[TOPIC[id]];
  const points = LEVELS.find(l => l.id === id)?.cue ? [CUE, ...e.points] : e.points;
  const ex = EXAMPLES.find(x => x.id === e.ex);
  return (
    <div className="explain">
      <ul className="ex-points">{points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      <figure className="ex-example gm-ex-fig">
        {e.sep && <span className="gm-ex-step"><SepScene m={e.sep} t={1} /></span>}
        {ex && e.arr.map((a, i) => (
          <span key={a} className="gm-ex-step">
            {i > 0 && <span className="gm-ex-arrow" aria-hidden="true">→</span>}
            <Beaker sim={initial({ ...ex, items: small(ex.items) }, seedOf(ex.id), a)} label={`${ex.title}${e.arr.length > 1 ? ` ${a === "vorher" ? tr("vorher", "before") : tr("nachher", "after")}` : ""}`} />
          </span>
        ))}
      </figure>
    </div>
  );
}
