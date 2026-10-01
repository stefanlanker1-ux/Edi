// Kurze Erklärkarten je Level (≤ 5 Zeilen) mit einem Beispiel als Atombilanz.

import { RichText } from "@lern/ui";
import { REACTION_BY_ID } from "@lern/chem";
import type { LevelKey } from "@lern/quiz";
import { EquationRow } from "../components/Equation.tsx";
import { MoleculeScene, hasModel } from "../components/Molecules.tsx";
import { LEVELS, type Task } from "./tasks.ts";

interface Ex { points: string[]; reaction: string }

const TEXT: Record<string, Ex> = {
  "us-1": { reaction: "knallgas", points: [
    "Die **kleine Zahl** (Index) zählt Atome **im** Teilchen: H₂O = 2 H und 1 O.",
    "Die **große Zahl** davor (Koeffizient) zählt die Teilchen: 2 H₂O = 2 · 2 H und 2 · 1 O.",
    "**Gesetz der Massenerhaltung:** jedes Element kommt links und rechts **gleich oft** vor – die Gleichung ist dann ausgeglichen.",
  ] },
  "us-2": { reaction: "fe2o3", points: [
    "Formeln nie ändern – nur die **Zahl davor**.",
    "Ein Element nach dem anderen; zuerst eines, das nur in je einem Stoff steht. O und H meist zuletzt.",
    "Am Ende **kleinste ganze Zahlen**: 4 Fe + 3 O₂ → 2 Fe₂O₃, nicht 8 Fe + 6 O₂ → 4 Fe₂O₃.",
  ] },
  "us-3": { reaction: "propan", points: [
    "**Edukte** (Ausgangsstoffe) links, **Produkte** rechts vom Pfeil →.",
    "Verbrennung: C wird zu CO₂, H zu H₂O. Zuerst C, dann H, **zuletzt O₂**.",
    "C₃H₈: 3 CO₂ und 4 H₂O → rechts 10 O → **5 O₂**.",
    "Metalloxid (Hochofen, Thermit): der **Sauerstoff wechselt den Partner** – zuerst das Metall, dann O zählen.",
  ] },
  "us-4": { reaction: "ethan", points: [
    "Manchmal braucht O₂ eine **halbe Zahl**: C₂H₆ + 3½ O₂ → 2 CO₂ + 3 H₂O.",
    "Halbe Moleküle gibt es nicht → **alle Zahlen verdoppeln**.",
    "2 C₂H₆ + 7 O₂ → 4 CO₂ + 6 H₂O – dann nochmals jedes Element zählen.",
  ] },
  "os-1": { reaction: "h2so4-naoh", points: [
    "Zahl hinter der Klammer gilt für alles darin: Ca(OH)₂ = 1 Ca, 2 O, 2 H.",
    "Bleibt ein Ion wie **SO₄, NO₃, PO₄** erhalten, zähle es als **Block**.",
    "Zuerst Metall und Ionen-Block, **H und O (Wasser) zuletzt**.",
  ] },
  "os-2": { reaction: "kclo3", points: [
    "Zerfall: ein Stoff links, mehrere rechts – vom Stoff mit den meisten Atomen ausgehen.",
    "KClO₃ → KCl + O₂: 3 O links, O₂ rechts → kgV 6 → **2 KClO₃ → 2 KCl + 3 O₂**.",
    "Neutralisation: so viele OH⁻ wie H⁺ → so viele H₂O.",
  ] },
  "os-3": { reaction: "ostwald", points: [
    "Mehrere Produkte: jedes Element nur über **einen** Stoff einstellen, wenn möglich.",
    "N zuerst (NH₃ → NO), dann H (→ H₂O), **O₂ zuletzt**.",
    "4 NH₃ + 5 O₂ → 4 NO + 6 H₂O: rechts 4 + 6 = 10 O → 5 O₂.",
  ] },
  "os-4": { reaction: "cu-hno3", points: [
    "Redox mit Säure: **nicht jedes N** landet im Salz – ein Teil wird zu NO.",
    "Zuerst Metall, dann das Element, das sich teilt (N, Cl), dann H → H₂O, O prüfen.",
    "3 Cu + 8 HNO₃ → 3 Cu(NO₃)₂ + 2 NO + 4 H₂O: 6 N ins Salz, 2 N ins NO.",
  ] },
};

export function explainFor(stufe: "us" | "os", level: LevelKey, task?: Task) {
  const levels = LEVELS[stufe];
  const id = typeof level === "number" ? levels[level].id : (levels.find(l => task?.type && l.types.includes(task.type)) ?? levels[0]).id;
  const e = TEXT[id];
  const r = REACTION_BY_ID[e.reaction];
  return (
    <div className="explain">
      <ul className="ex-points">{e.points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      <figure className="ex-example">
        {hasModel(r) && <div className="ex-scene"><MoleculeScene eq={r} coeffs={r.coeffs} state="ok" /></div>}
        <EquationRow eq={r} coeffs={r.coeffs} />
      </figure>
    </div>
  );
}
