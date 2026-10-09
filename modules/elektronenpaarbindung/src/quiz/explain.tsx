// Erklärkarten je Level mit einem Lewis-Beispiel.

import { RichText } from "@lern/ui";
import type { LevelKey } from "@lern/quiz";
import { LewisSvg } from "../components/LewisSvg.tsx";
import { StructureSvg } from "../components/StructureSvg.tsx";
import { COLS, ROWS, loadKnown } from "../edit.ts";
import { LEVELS, type Task } from "./tasks.ts";
import type { Stufe } from "../store.ts";
import { tr } from "@lern/i18n";

const TEXT_DE: Record<string, { points: string[]; mol: string }> = {
  "us-1": { mol: "CH4", points: [
    "Nichtmetall-Atome **teilen Elektronen**: Zwei ungepaarte **Außenelektronen** (Valenzelektronen) bilden ein gemeinsames **Elektronenpaar** = eine Bindung.",
    "Jedes Atom zählt die gemeinsamen Elektronen mit: C im Methan hat **8 (Oktett)** wie Ne, jedes H **2 (Duett)** wie He.",
    "Anzahl der Bindungen = ungepaarte Elektronen: H 1, O 2, N 3, C 4, Cl 1.",
  ] },
  "us-2": { mol: "O2", points: [
    "Haben zwei Atome mehrere ungepaarte Elektronen, teilen sie **zwei** (Zweifachbindung) oder **drei** Paare (Dreifachbindung).",
    "O₂: O=O (Zweifachbindung) · N₂: N≡N (Dreifachbindung) · CO₂: O=C=O.",
    "Nicht bindende Elektronen bleiben als **freie** (nichtbindende) **Elektronenpaare** am Atom.",
  ] },
  "us-3": { mol: "NH3", points: [
    "Die **Summenformel** zählt die Atome: NH₃ = 1 N und 3 H.",
    "Die **Strukturformel** (Valenzstrichformel) zeigt jede Bindung als Strich und freie Paare als kurze Striche.",
    "Wichtige Namen: H₂O Wasser, NH₃ Ammoniak, CH₄ Methan, HCl Chlorwasserstoff, HF Fluorwasserstoff, CO₂ Kohlendioxid, CCl₄ Tetrachlormethan.",
  ] },
  "os-1": { mol: "HCN", points: [
    "Kohlenstoff bildet immer **4 Bindungen**, Stickstoff 3, Sauerstoff 2, Wasserstoff und Halogene 1.",
    "Mehrfachbindungen: C=C (Ethen), C≡C (Ethin), C=O (Methanal), C≡N (Blausäure).",
    "Im Molekül hat jedes Atom außer H 8 Elektronen um sich – freie Paare mitzählen.",
  ] },
  "os-2": { mol: "H2O", points: [
    "**EPA-Modell:** Elektronenpaare am Zentralatom stoßen sich ab und gehen so weit wie möglich auseinander. Jede Bindung und jedes freie Paar ist ein **Bereich** – eine Mehrfachbindung zählt wie ein Bereich.",
    "4 Bereiche → Tetraeder-Grundform: CH₄ tetraedrisch 109,5°, NH₃ trigonal-pyramidal 107°, H₂O gewinkelt 104,5°.",
    "3 Bereiche → trigonal-planar, ca. 120° (Methanal); 2 Bereiche → linear 180° (CO₂, HCN).",
  ] },
  "os-3": { mol: "H2O", points: [
    "Eine Bindung ist **polar**, wenn die Elektronegativitäten deutlich verschieden sind (ΔEN ≥ 0,4): Das stärker ziehende Atom wird δ−, das andere δ+.",
    "**EN** (Pauling): H 2,20 · C 2,55 · N 3,04 · O 3,44 · F 3,98 · Cl 3,16 · Br 2,96 · I 2,66 – im PSE nach rechts steigend, nach unten sinkend (Hilfsmittel „EN-Tabelle“).",
    "Ein Molekül ist ein **Dipol**, wenn sich die Teilladungen nicht aufheben – z. B. H₂O (gewinkelt).",
    "Symmetrische Moleküle wie CO₂ (linear) oder CCl₄ (tetraedrisch) sind trotz polarer Bindungen **unpolar**. In CH₄ sind die C–H-Bindungen ohnehin kaum polar (ΔEN 0,35).",
  ] },
};
const TEXT_EN: typeof TEXT_DE = {
  "us-1": { mol: "CH4", points: [
    "Non-metal atoms **share electrons**: two unpaired **outer electrons** (valence electrons) form a shared **electron pair** = one bond.",
    "Each atom counts the shared electrons: C in methane has **8 (octet)** like Ne, each H **2 (duet)** like He.",
    "Number of bonds = unpaired electrons: H 1, O 2, N 3, C 4, Cl 1.",
  ] },
  "us-2": { mol: "O2", points: [
    "If two atoms have several unpaired electrons, they share **two** (double bond) or **three** pairs (triple bond).",
    "O₂: O=O (double bond) · N₂: N≡N (triple bond) · CO₂: O=C=O.",
    "Non-bonding electrons stay on the atom as **lone pairs**.",
  ] },
  "us-3": { mol: "NH3", points: [
    "The **molecular formula** counts the atoms: NH₃ = 1 N and 3 H.",
    "The **structural formula** shows each bond as a line and lone pairs as short lines.",
    "Important names: H₂O water, NH₃ ammonia, CH₄ methane, HCl hydrogen chloride, HF hydrogen fluoride, CO₂ carbon dioxide, CCl₄ tetrachloromethane.",
  ] },
  "os-1": { mol: "HCN", points: [
    "Carbon always forms **4 bonds**, nitrogen 3, oxygen 2, hydrogen and halogens 1.",
    "Multiple bonds: C=C (ethene), C≡C (ethyne), C=O (methanal), C≡N (hydrogen cyanide).",
    "In the molecule every atom except H has 8 electrons around it – count lone pairs too.",
  ] },
  "os-2": { mol: "H2O", points: [
    "**VSEPR model:** electron pairs on the central atom repel each other and spread as far apart as possible. Each bond and each lone pair is a **region** – a multiple bond counts as one region.",
    "4 regions → tetrahedral base shape: CH₄ tetrahedral 109.5°, NH₃ trigonal pyramidal 107°, H₂O bent 104.5°.",
    "3 regions → trigonal planar, approx. 120° (methanal); 2 regions → linear 180° (CO₂, HCN).",
  ] },
  "os-3": { mol: "H2O", points: [
    "A bond is **polar** if the electronegativities differ clearly (ΔEN ≥ 0.4): the more strongly attracting atom becomes δ−, the other δ+.",
    "**EN** (Pauling): H 2.20 · C 2.55 · N 3.04 · O 3.44 · F 3.98 · Cl 3.16 · Br 2.96 · I 2.66 – increasing to the right in the periodic table, decreasing downwards (tool “EN table”).",
    "A molecule is a **dipole** if the partial charges do not cancel – e.g. H₂O (bent).",
    "Symmetrical molecules like CO₂ (linear) or CCl₄ (tetrahedral) are **non-polar** despite polar bonds. In CH₄ the C–H bonds are hardly polar anyway (ΔEN 0.35).",
  ] },
};
const TEXT = tr(TEXT_DE, TEXT_EN);

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
