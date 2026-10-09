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
    "Zwischen den Teilchen ist **nichts**. Farbe, fest und flüssig sind Eigenschaften des **Stoffs** – ein einzelnes Teilchen hat sie nicht.",
  ] },
  k2: { ex: "schutzgas", arr: ["nachher"], points: [
    "**Element:** nur **eine** Atomsorte – als einzelne Atome (He), als Moleküle (O₂) oder im Gitter (Cu).",
    "**Verbindung:** **mehrere** Atomsorten, fest verbunden und immer im gleichen **Zahlenverhältnis** – in Molekülen (Wasser H₂O, 2 : 1) oder in einem Gitter (Kochsalz NaCl, 1 : 1).",
    "Zähle **Stoffe**, nicht Teilchen: gleiche Teilchen sind ein Stoff.",
  ] },
  k3: { ex: "zucker", arr: ["vorher", "nachher"], points: [
    "**Reinstoff:** nur ein Stoff. **Gemisch:** mehrere Stoffe.",
    "**Homogen:** auch unter dem Mikroskop keine Bestandteile zu erkennen. **Heterogen:** mit Auge, Lupe oder Mikroskop Teile, Tröpfchen oder Schichten zu sehen.",
    "Beim **Lösen** lagern sich Wasserteilchen an und lösen die Teilchen heraus; sie verteilen sich. Nichts verschwindet, die **Masse bleibt gleich**.",
  ] },
  k4: { ex: "messing", arr: ["nachher"], points: [
    "Homogen: **Lösung** (Flüssigkeit mit gelöstem Stoff), **Gasgemisch** (Gase). **Legierung**: Metall mit anderen Elementen zusammen geschmolzen, Anteile frei wählbar – oft homogen (Messing).",
    "Heterogen: **Emulsion** (Tröpfchen in Flüssigkeit), **Suspension** (Körner in Flüssigkeit), **Gemenge** (feste Stücke), **Rauch** (fest in Gas), **Nebel** (Tröpfchen in Gas), **Schaum** (Gas in Flüssigkeit).",
    "„Rein“ auf einer Packung heißt: nichts dazugegeben. Ein **Reinstoff** ist nur **ein** Stoff.",
  ] },
  k5: { ex: "", arr: [], sep: "filtrieren", points: [
    "Jedes Verfahren nutzt eine **Eigenschaft**: Aussehen (**Auslesen**), Korngröße (**Sieben**, **Filtrieren**), Magnetismus (**Magnettrennung**), Dichte (**Dekantieren**).",
    "**Dichte**: Sand sinkt in Wasser und bildet den **Bodensatz** – das Wasser darüber abgießen.",
    "Filtrieren: **Rückstand** bleibt im Filter, **Filtrat** läuft durch. Gelöstes geht durch das Filterpapier.",
  ] },
  k6: { ex: "", arr: [], sep: "destillieren", points: [
    "Gelöstes geht durch das Filterpapier. Salz und Wasser trennt man über die **Siedetemperatur**: **Eindampfen** (das Salz bleibt) oder **Destillieren** (auch das Wasser wird aufgefangen).",
    "Destillieren: Dampf wird im **Kühler** flüssig und tropft als **Destillat** in die **Vorlage**. Alkohol (78 °C) verdampft leichter als Wasser (100 °C) – im Dampf ist mehr Alkohol.",
    "**Chromatografie** trennt Farbstoffe. Manche Gemische brauchen **mehrere Schritte**: lösen, filtrieren, eindampfen.",
  ] },
}, {
  k1: { ex: "modell", arr: ["nachher"], points: [
    "A **particle** is a **molecule** or a single atom. Each sphere in the picture is an atom.",
    "Each **kind of atom** has its own colour. Identical particles form a **substance**.",
    "Between the particles there is **nothing**. Colour, solid and liquid are properties of the **substance** – a single particle does not have them.",
  ] },
  k2: { ex: "schutzgas", arr: ["nachher"], points: [
    "**Element:** only **one** kind of atom – as single atoms (He), as molecules (O₂) or in a lattice (Cu).",
    "**Compound:** **several** kinds of atoms, firmly bonded and always in the same **number ratio** – in molecules (water H₂O, 2 : 1) or in a lattice (table salt NaCl, 1 : 1).",
    "Count **substances**, not particles: identical particles are one substance.",
  ] },
  k3: { ex: "zucker", arr: ["vorher", "nachher"], points: [
    "**Pure substance:** only one substance. **Mixture:** several substances.",
    "**Homogeneous:** no components visible even under a microscope. **Heterogeneous:** pieces, droplets or layers visible with the eye, a magnifier or a microscope.",
    "When **dissolving**, water particles attach themselves and pull the particles out; they spread out. Nothing disappears, the **mass stays the same**.",
  ] },
  k4: { ex: "messing", arr: ["nachher"], points: [
    "Homogeneous: **solution** (liquid with a dissolved substance), **gas mixture** (gases). **Alloy**: a metal melted together with other elements, proportions freely chosen – often homogeneous (brass).",
    "Heterogeneous: **emulsion** (droplets in a liquid), **suspension** (grains in a liquid), **coarse mixture** (solid pieces), **smoke** (solid in gas), **fog** (droplets in gas), **foam** (gas in a liquid).",
    "“Pure” on a package means: nothing added. A **pure substance** is only **one** substance.",
  ] },
  k5: { ex: "", arr: [], sep: "filtrieren", points: [
    "Each method uses a **property**: appearance (**hand-picking**), grain size (**sieving**, **filtration**), magnetism (**magnetic separation**), density (**decanting**).",
    "**Density**: sand sinks in water and forms the **sediment** – pour off the water above it.",
    "Filtration: the **residue** stays in the filter, the **filtrate** runs through. Dissolved things pass through the filter paper.",
  ] },
  k6: { ex: "", arr: [], sep: "destillieren", points: [
    "Dissolved substances pass through filter paper. Salt and water are separated by their **boiling point**: **evaporation** (the salt stays) or **distillation** (the water is collected too).",
    "Distillation: vapour turns liquid in the **condenser** and drips into the **receiver** as the **distillate**. Alcohol (78 °C) evaporates more easily than water (100 °C) – the vapour contains more alcohol.",
    "**Chromatography** separates dyes. Some mixtures need **several steps**: dissolve, filter, evaporate.",
  ] },
});
const TOPIC: Record<string, string> = { "gm-k1": "k1", "gm-k2": "k2", "gm-k3": "k3", "gm-k4": "k4", "gm-k5": "k5", "gm-k6": "k6" };
const CUE = tr("In diesem Kapitel hilft der **Tipp** genau bei der Aufgabe. Tipp antippen kostet keine Punkte.", "In this chapter the **hint** helps with exactly this task. Tapping the hint costs no points.");

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
