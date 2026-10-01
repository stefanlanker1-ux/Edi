// Kurze Erklärkarten je Level mit einem Beispiel aus Ionen-Bausteinen.

import { RichText } from "@lern/ui";
import { ION_BY_ID, ratio } from "@lern/chem";
import type { LevelKey } from "@lern/quiz";
import { IonWall } from "../components/IonWall.tsx";
import { LEVELS, type Task } from "./tasks.ts";
import type { Stufe } from "../store.ts";

interface Ex { points: string[]; c: string; a: string }

const TEXT: Record<string, Ex> = {
  "us-1": { c: "Mg2+", a: "O2-", points: [
    "Metalle **geben** Außenelektronen **ab** → positive Ionen (Kationen). Nichtmetalle **nehmen** Elektronen **auf** → negative Ionen (Anionen).",
    "Die Ionen haben dann eine volle Außenschale wie ein Edelgas: Mg²⁺ wie Ne.",
    "Hauptgruppe I, II, III → Ladung 1+, 2+, 3+. Hauptgruppe V, VI, VII → Ladung 3−, 2−, 1−.",
  ] },
  "us-2": { c: "Ca2+", a: "Cl-", points: [
    "Eine Ionenverbindung ist nach außen **neutral**: Die positiven und negativen Ladungen gleichen sich aus.",
    "Jeder Baustein ist so breit wie seine Ladung. Nimm so viele goldene und grüne Bausteine, bis **beide Reihen gleich lang** sind.",
    "Die Anzahl der Ionen steht als kleine Zahl (Index) in der Formel – die 1 schreibt man nicht.",
  ] },
  "us-3": { c: "Al3+", a: "O2-", points: [
    "Im Namen kommt zuerst das **Metall**, dann das Nichtmetall mit der Endung **-id**: Natrium + Chlor → Natrium**chlorid**.",
    "Endungen: Fluor → Fluorid, Chlor → Chlorid, Brom → Bromid, Iod → Iodid, Sauerstoff → Oxid, Schwefel → Sulfid, Stickstoff → Nitrid.",
    "In der Formel steht das Metall vorne: Aluminiumoxid → Al₂O₃.",
  ] },
  "os-1": { c: "Fe3+", a: "O2-", points: [
    "Hauptgruppen-Ionen haben Edelgaskonfiguration: Na⁺ wie Ne, Cl⁻ wie Ar.",
    "Nebengruppenmetalle bilden oft mehrere Ionen – die **römische Zahl** nennt die Ladung: Eisen(II) = Fe²⁺, Eisen(III) = Fe³⁺.",
    "**Mehratomige Ionen** tragen die Ladung als Ganzes: NH₄⁺, OH⁻, NO₃⁻, SO₄²⁻, CO₃²⁻, PO₄³⁻.",
  ] },
  "os-2": { c: "Al3+", a: "SO42-", points: [
    "Wie in der Unterstufe: Ladungen ausgleichen, bis beide Reihen gleich lang sind (kleinstes gemeinsames Vielfaches).",
    "Braucht man ein mehratomiges Ion mehrmals, kommt es **in Klammern**: Ca(OH)₂, Al₂(SO₄)₃ – nicht CaOH₂!",
    "Die Zahlen im Ion (z. B. die 4 in SO₄) ändern sich nie.",
  ] },
  "os-3": { c: "Fe2+", a: "SO42-", points: [
    "Einatomige Anionen enden auf **-id** (Chlorid, Oxid, Sulfid). Mehratomige enden meist auf **-at** (Sulfat, Nitrat, Carbonat).",
    "Achtung: Sulfid (S²⁻) ≠ Sulfat (SO₄²⁻), Nitrid (N³⁻) ≠ Nitrat (NO₃⁻).",
    "Bei Nebengruppenmetallen die Ladung als römische Zahl angeben: FeSO₄ = Eisen(II)-sulfat.",
  ] },
};

export function explainFor(stufe: Stufe, level: LevelKey, task?: Task) {
  const id = typeof level === "number" ? LEVELS[stufe][level].id
    : (LEVELS[stufe].find(l => task?.type && l.types.includes(task.type)) ?? LEVELS[stufe][0]).id;
  const e = TEXT[id];
  return (
    <div className="explain">
      <ul className="ex-points">{e.points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      <figure className="ex-example">
        <IonWall cation={ION_BY_ID[e.c]} anion={ION_BY_ID[e.a]} {...ratioOf(e.c, e.a)} />
      </figure>
    </div>
  );
}

const ratioOf = (c: string, a: string) => ratio(ION_BY_ID[c], ION_BY_ID[a]);
