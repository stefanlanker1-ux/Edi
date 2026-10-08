// Kurze Erklärkarten je Level mit einem Beispiel (Strukturformel mit Hauptkette und Nummern).

import { RichText } from "@lern/ui";
import type { LevelKey } from "@lern/quiz";
import { smilesMol } from "../chem/smiles.ts";
import { keepEnding, name } from "../chem/naming.ts";
import { MolSvg } from "../components/MolSvg.tsx";
import { useApp } from "../store.ts";
import { LEVELS, type Task } from "./tasks.ts";
import { tr } from "@lern/i18n";

const TEXT: Record<string, { points: string[]; ex: string }> = tr({
  "og-n1": { ex: "CCC(C)C(CC)CCC", points: [
    "**Stamm** nach der Zahl der C: Meth, Eth, Prop, But, Pent, Hex, Hept, Oct, Non, Dec + **-an**.",
    "**Längste Kette** suchen – sie muss nicht gerade gezeichnet sein.",
    "So nummerieren, dass die **Äste kleine Nummern** haben. Äste alphabetisch, gleiche mit di, tri.",
  ] },
  "og-n2": { ex: "C/C=C\\CC", points: [
    "Doppelbindung → **-en** (**Alken**), Dreifachbindung → **-in** (**Alkin**).",
    "Die Mehrfachbindung bekommt die **kleinste Nummer**. Sie steht vor der Endung: But-2-en.",
    "**E/Z:** An jedem C der Doppelbindung hat die Gruppe mit größerer Ordnungszahl Vorrang. Gleiche Seite = **Z**, verschiedene = **E**.",
  ] },
  "og-n3": { ex: "CCC(C)=O", points: [
    "Die Gruppe bestimmt die **Stoffklasse**: **Alkohol** –OH (-ol), **Aldehyd** –CHO (-al), **Keton** C=O in der Kette (-on), **Carbonsäure** –COOH (-säure), **Amin** –NH₂ (-amin).",
    "Das C von –CHO und –COOH gehört zur Kette und ist **C1**.",
    "**Ester** –COO–: Säureteil + Alkylteil + ester, z. B. Butansäureethylester. **Ether**: ein O zwischen zwei C, z. B. Ethoxyethan.",
  ] },
  "og-n4": { ex: "OC(=O)C(C)C(=O)C(O)C(C)CC", points: [
    "Die Gruppe mit dem höchsten Rang ist die **ranghöchste Gruppe**. Sie gibt die Endung: Säure > Aldehyd > Keton > Alkohol > Amin.",
    "Alle anderen werden **Vorsilben**: Oxo-, Hydroxy-, Amino-, Methyl-, Chlor-.",
    "Die ranghöchste Gruppe bekommt die kleinste Nummer. Vorsilben **alphabetisch**.",
  ] },
}, {
  "og-n1": { ex: "CCC(C)C(CC)CCC", points: [
    "**Stem** from the number of C: meth, eth, prop, but, pent, hex, hept, oct, non, dec + **-ane**.",
    "Find the **longest chain** – it does not have to be drawn straight.",
    "Number so that the **branches get low numbers**. Branches alphabetically, identical ones with di, tri.",
  ] },
  "og-n2": { ex: "C/C=C\\CC", points: [
    "Double bond → **-ene** (**alkene**), triple bond → **-yne** (**alkyne**).",
    "The multiple bond gets the **lowest number**. It stands before the ending: but-2-ene.",
    "**E/Z:** On each C of the double bond, the group with the higher atomic number has priority. Same side = **Z**, opposite = **E**.",
  ] },
  "og-n3": { ex: "CCC(C)=O", points: [
    "The group decides the **compound class**: **alcohol** –OH (-ol), **aldehyde** –CHO (-al), **ketone** C=O in the chain (-one), **carboxylic acid** –COOH (-oic acid), **amine** –NH₂ (-amine).",
    "The C of –CHO and –COOH belongs to the chain and is **C1**.",
    "**Ester** –COO–: alkyl part + acid part ending in -oate, e.g. ethyl butanoate. **Ether**: an O between two C, e.g. ethoxyethane.",
  ] },
  "og-n4": { ex: "OC(=O)C(C)C(=O)C(O)C(C)CC", points: [
    "The group with the highest rank is the **principal group**. It gives the ending: acid > aldehyde > ketone > alcohol > amine.",
    "All others become **prefixes**: oxo-, hydroxy-, amino-, methyl-, chloro-.",
    "The principal group gets the lowest number. Prefixes **alphabetical**.",
  ] },
});

function Example({ smiles }: { smiles: string }) {
  const { view } = useApp();
  const m = smilesMol(smiles), r = name(m);
  return (
    <figure className="ex-example og-ex-fig">
      <MolSvg mol={m} view={view} label={r.ok ? r.name : tr("Beispiel", "Example")} parent={r.ok ? r.parent.atoms : undefined} parentRing={r.ok && r.parent.kind === "ring"}
        numbers={r.ok} group={r.ok ? r.principalAtoms : undefined} ez={r.ok ? r.stereo.filter(x => x.desc) : undefined} minW={4} minH={2.4} />
      {r.ok && <figcaption>{r.name}</figcaption>}
    </figure>
  );
}

/** Gruppen und Endungen nicht mitten im Zeichen umbrechen: –COOH (Wortverbinder), (-amin) (geschützter Bindestrich) */
const keep = (s: string) => keepEnding(s).replace(/–(?=[A-Z])/g, "–\u2060");

export function explainFor(level: LevelKey, task?: Task) {
  const id = typeof level === "number" ? LEVELS[level].id : (LEVELS.find(l => task?.type && l.types.includes(task.type)) ?? LEVELS[0]).id;
  const e = TEXT[id];
  return (
    <div className="explain">
      <ul className="ex-points">{e.points.map((p, i) => <li key={i}><RichText text={keep(p)} /></li>)}</ul>
      <Example smiles={e.ex} />
    </div>
  );
}
