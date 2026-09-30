// Erklärkarten je Level mit einem Lewis-Beispiel.

import { RichText } from "@lern/ui";
import type { LevelKey } from "@lern/quiz";
import { LewisSvg } from "../components/LewisSvg.tsx";
import { StructureSvg } from "../components/StructureSvg.tsx";
import { COLS, ROWS, loadKnown } from "../edit.ts";
import { LEVELS, type Task } from "./tasks.ts";
import type { Stufe } from "../store.ts";

const TEXT: Record<string, { points: string[]; mol: string }> = {
  "us-1": { mol: "CH4", points: [
    "Nichtmetall-Atome erreichen die Edelgaskonfiguration, indem sie **Elektronen teilen**: Zwei ungepaarte Elektronen bilden ein gemeinsames **Elektronenpaar** = eine Bindung.",
    "Jedes Atom zählt die gemeinsamen Elektronen mit: So hat C im Methan **8 Elektronen (Oktett)**, jedes H **2 (Duett)**.",
    "Anzahl der Bindungen = ungepaarte Elektronen: H 1, O 2, N 3, C 4, Cl 1.",
  ] },
  "us-2": { mol: "O2", points: [
    "Reicht ein Paar nicht fürs Oktett? Dann teilen die Atome **zwei** (Doppelbindung) oder **drei** Paare (Dreifachbindung).",
    "O₂: O=O (Doppelbindung) · N₂: N≡N (Dreifachbindung) · CO₂: O=C=O.",
    "Nicht bindende Elektronen bleiben als **freie Elektronenpaare** am Atom.",
  ] },
  "us-3": { mol: "NH3", points: [
    "Die **Summenformel** zählt die Atome: NH₃ = 1 N und 3 H.",
    "Die **Valenzstrichformel** zeigt jede Bindung als Strich und freie Paare als kurze Striche.",
    "Wichtige Namen: H₂O Wasser, NH₃ Ammoniak, CH₄ Methan, HCl Chlorwasserstoff, CO₂ Kohlenstoffdioxid.",
  ] },
  "os-1": { mol: "HCN", points: [
    "Kohlenstoff bildet immer **4 Bindungen**, Stickstoff 3, Sauerstoff 2, Wasserstoff und Halogene 1.",
    "Mehrfachbindungen: C=C (Ethen), C≡C (Ethin), C=O (Methanal), C≡N (Blausäure).",
    "Jedes Atom außer H braucht am Ende 8 Elektronen – freie Paare mitzählen.",
  ] },
  "os-2": { mol: "H2O", points: [
    "**EPA-Modell:** Elektronenpaare am Zentralatom stoßen sich ab und gehen so weit wie möglich auseinander. Eine Mehrfachbindung zählt wie ein Paar.",
    "4 Paare → Tetraeder-Grundform: CH₄ tetraedrisch 109,5°, NH₃ trigonal-pyramidal 107°, H₂O gewinkelt 104,5°.",
    "3 Paare → trigonal-planar 120° (Methanal); 2 Paare → linear 180° (CO₂, HCN).",
  ] },
  "os-3": { mol: "H2O", points: [
    "Eine Bindung ist **polar**, wenn die Elektronegativitäten deutlich verschieden sind (ΔEN ≥ 0,4): Das stärker ziehende Atom wird δ−, das andere δ+.",
    "Ein Molekül ist ein **Dipol**, wenn sich die Teilladungen nicht aufheben – z. B. H₂O (gewinkelt).",
    "Symmetrische Moleküle wie CO₂ (linear) oder CCl₄ (tetraedrisch) sind trotz polarer Bindungen **unpolar**. In CH₄ sind die C–H-Bindungen ohnehin kaum polar (ΔEN 0,35).",
  ] },
};

export function explainFor(stufe: Stufe, level: LevelKey, task?: Task) {
  const id = typeof level === "number" ? LEVELS[stufe][level].id
    : (LEVELS[stufe].find(l => task?.type && l.types.includes(task.type)) ?? LEVELS[stufe][0]).id;
  const e = TEXT[id];
  const m = loadKnown(e.mol);
  return (
    <div className="explain">
      <ul className="ex-points">{e.points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      <figure className="ex-example ex-mol">
        <div className="ex-lewis"><LewisSvg mol={m} cols={COLS} rows={ROWS} crop /></div>
        <div className="ex-struct"><StructureSvg mol={m} deltas={id === "os-3"} /></div>
      </figure>
    </div>
  );
}
