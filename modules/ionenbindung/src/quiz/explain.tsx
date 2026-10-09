// Kurze Erklärkarten je Level mit einem Beispiel aus Ionen-Bausteinen.

import { RichText } from "@lern/ui";
import { ION_BY_ID, ratio } from "@lern/chem";
import type { LevelKey } from "@lern/quiz";
import { IonWall } from "../components/IonWall.tsx";
import { LEVELS, type Task } from "./tasks.ts";
import type { Stufe } from "../store.ts";
import { tr } from "@lern/i18n";

interface Ex { points: string[]; c: string; a: string }

const TEXT_DE: Record<string, Ex> = {
  "us-1": { c: "Mg2+", a: "O2-", points: [
    "Metalle **geben** Außenelektronen **ab** → positive Ionen (Kationen). Nichtmetalle **nehmen** Elektronen **auf** → negative Ionen (Anionen).",
    "Die Ionen haben dann eine volle Außenschale wie ein Edelgas: Mg²⁺ wie Ne.",
    "Hauptgruppe I, II, III → Ladung 1+, 2+, 3+. Hauptgruppe V, VI, VII → Ladung 3−, 2−, 1−.",
  ] },
  "us-2": { c: "Ca2+", a: "Cl-", points: [
    "Eine Ionenverbindung ist nach außen **neutral**: Die positiven und negativen Ladungen gleichen sich aus.",
    "Jeder Baustein ist so breit wie seine Ladung. Nimm so viele goldene und grüne Bausteine, bis **beide Reihen gleich lang** sind.",
    "Die Anzahl der Ionen steht als kleine Zahl (Index) in der Formel – die 1 schreibt man nicht.",
    "Im Salz gibt es keine Paare oder Moleküle: Jedes Ion ist von vielen Gegen-Ionen umgeben (**Ionengitter**). Ihre Anziehung ist die **Ionenbindung**.",
  ] },
  "us-3": { c: "Al3+", a: "O2-", points: [
    "Im Namen kommt zuerst das **Metall**, dann das Nichtmetall mit der Endung **-id**: Natrium + Chlor → Natrium**chlorid**.",
    "Endungen: Fluor → Fluorid, Chlor → Chlorid, Brom → Bromid, Iod → Iodid, Sauerstoff → Oxid, Schwefel → Sulfid, Stickstoff → Nitrid.",
    "In der Formel steht das Metall vorne: Aluminiumoxid → Al₂O₃.",
  ] },
  "os-1": { c: "Fe3+", a: "O2-", points: [
    "Hauptgruppen-Ionen haben Edelgaskonfiguration: Na⁺ wie Ne, Cl⁻ wie Ar.",
    "**Übergangsmetalle** (Gruppe 3–12) und Blei bilden oft mehrere Ionen – die **römische Zahl** nennt die Ladung: Eisen(II) = Fe²⁺, Eisen(III) = Fe³⁺.",
    "**Mehratomige Ionen** tragen die Ladung als Ganzes: NH₄⁺, OH⁻, NO₃⁻, NO₂⁻ (Nitrit), HCO₃⁻ (Hydrogencarbonat), SO₄²⁻, SO₃²⁻ (Sulfit), CO₃²⁻, PO₄³⁻.",
  ] },
  "os-2": { c: "Al3+", a: "SO42-", points: [
    "Wie in Level I: Ladungen ausgleichen, bis beide Reihen gleich lang sind (kleinstes gemeinsames Vielfaches).",
    "Braucht man ein mehratomiges Ion mehrmals, kommt es **in Klammern**: Ca(OH)₂, Al₂(SO₄)₃ – nicht CaOH₂!",
    "Die Zahlen im Ion (z. B. die 4 in SO₄) ändern sich nie.",
  ] },
  "os-3": { c: "Fe2+", a: "SO42-", points: [
    "Einatomige Anionen enden auf **-id** (Chlorid, Oxid, Sulfid; F⁻, Cl⁻, Br⁻, I⁻ = **Halogenid**-Ionen). Mehratomige enden meist auf **-at** (Sulfat, Nitrat, Carbonat).",
    "Achtung: Sulfid (S²⁻) ≠ Sulfat (SO₄²⁻), Nitrid (N³⁻) ≠ Nitrat (NO₃⁻).",
    "Bilden Metalle mehrere Ionen (Eisen, Kupfer, Blei), die Ladung als römische Zahl angeben: FeSO₄ = Eisen(II)-sulfat.",
  ] },
};
const TEXT_EN: Record<string, Ex> = {
  "us-1": { c: "Mg2+", a: "O2-", points: [
    "Metals **lose** outer electrons → positive ions (cations). Non-metals **gain** electrons → negative ions (anions).",
    "The ions then have a full outer shell like a noble gas: Mg²⁺ like Ne.",
    "Main group I, II, III → charge 1+, 2+, 3+. Main group V, VI, VII → charge 3−, 2−, 1−.",
  ] },
  "us-2": { c: "Ca2+", a: "Cl-", points: [
    "An ionic compound is **neutral** overall: the positive and negative charges balance.",
    "Each tile is as wide as its charge. Take gold and green tiles until **both rows are the same length**.",
    "The number of ions is the small number (subscript) in the formula – the 1 is not written.",
    "A salt has no pairs or molecules: each ion is surrounded by many oppositely charged ions (**ionic lattice**). Their attraction is the **ionic bond**.",
  ] },
  "us-3": { c: "Al3+", a: "O2-", points: [
    "In the name the **metal** comes first, then the non-metal with the ending **-ide**: sodium + chlorine → sodium **chloride**.",
    "Endings: fluorine → fluoride, chlorine → chloride, bromine → bromide, iodine → iodide, oxygen → oxide, sulfur → sulfide, nitrogen → nitride.",
    "In the formula the metal comes first: aluminium oxide → Al₂O₃.",
  ] },
  "os-1": { c: "Fe3+", a: "O2-", points: [
    "Main group ions have a noble gas configuration: Na⁺ like Ne, Cl⁻ like Ar.",
    "**Transition metals** (groups 3–12) and lead often form several ions – the **Roman numeral** gives the charge: iron(II) = Fe²⁺, iron(III) = Fe³⁺.",
    "**Polyatomic ions** carry the charge as a whole: NH₄⁺, OH⁻, NO₃⁻, NO₂⁻ (nitrite), HCO₃⁻ (hydrogen carbonate), SO₄²⁻, SO₃²⁻ (sulfite), CO₃²⁻, PO₄³⁻.",
  ] },
  "os-2": { c: "Al3+", a: "SO42-", points: [
    "As in Level I: balance charges until both rows are the same length (lowest common multiple).",
    "If a polyatomic ion is needed more than once, it goes **in brackets**: Ca(OH)₂, Al₂(SO₄)₃ – not CaOH₂!",
    "The numbers inside the ion (e.g. the 4 in SO₄) never change.",
  ] },
  "os-3": { c: "Fe2+", a: "SO42-", points: [
    "Monatomic anions end in **-ide** (chloride, oxide, sulfide; F⁻, Cl⁻, Br⁻, I⁻ = **halide** ions). Polyatomic ones usually end in **-ate** (sulfate, nitrate, carbonate).",
    "Careful: sulfide (S²⁻) ≠ sulfate (SO₄²⁻), nitride (N³⁻) ≠ nitrate (NO₃⁻).",
    "If a metal forms several ions (iron, copper, lead), give the charge as a Roman numeral: FeSO₄ = iron(II) sulfate.",
  ] },
};
const TEXT = tr(TEXT_DE, TEXT_EN);

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
