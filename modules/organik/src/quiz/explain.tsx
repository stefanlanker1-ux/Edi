// Kurze Erklärkarten je Level mit einem Beispiel (Strukturformel mit Hauptkette und Nummern).

import { RichText } from "@lern/ui";
import type { LevelKey } from "@lern/quiz";
import { smilesMol } from "../chem/smiles.ts";
import { name } from "../chem/naming.ts";
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
    "Doppelbindung → **-en**, Dreifachbindung → **-in**.",
    "Die Mehrfachbindung bekommt die **kleinste Nummer**. Sie steht vor der Endung: But-2-en.",
    "**E/Z:** An jedem C der Doppelbindung hat die Gruppe mit größerer Ordnungszahl Vorrang. Gleiche Seite = **Z**, verschiedene = **E**.",
  ] },
  "og-n3": { ex: "CCC(C)=O", points: [
    "**-ol** Alkohol (–OH), **-al** Aldehyd (–CHO), **-on** Keton (C=O in der Kette), **-säure** Carbonsäure (–COOH), **-amin** Amin (–NH₂).",
    "Das C von –CHO und –COOH gehört zur Kette und ist **C1**.",
    "Ester: Säureteil + Alkylteil + **ester**, z. B. Butansäureethylester.",
  ] },
  "og-n4": { ex: "OC(=O)C(C)C(=O)C(O)C(C)CC", points: [
    "Die Gruppe mit dem **höchsten Rang** gibt die Endung: Säure > Aldehyd > Keton > Alkohol > Amin.",
    "Alle anderen werden **Vorsilben**: Oxo-, Hydroxy-, Amino-, Methyl-, Chlor-.",
    "Hauptgruppe kleinste Nummer, Vorsilben **alphabetisch**.",
  ] },
}, {
  "og-n1": { ex: "CCC(C)C(CC)CCC", points: [
    "**Stem** from the number of C: meth, eth, prop, but, pent, hex, hept, oct, non, dec + **-ane**.",
    "Find the **longest chain** – it does not have to be drawn straight.",
    "Number so that the **branches get low numbers**. Branches alphabetically, identical ones with di, tri.",
  ] },
  "og-n2": { ex: "C/C=C\\CC", points: [
    "Double bond → **-ene**, triple bond → **-yne**.",
    "The multiple bond gets the **lowest number**. It stands before the ending: but-2-ene.",
    "**E/Z:** On each C of the double bond, the group with the higher atomic number has priority. Same side = **Z**, opposite = **E**.",
  ] },
  "og-n3": { ex: "CCC(C)=O", points: [
    "**-ol** alcohol (–OH), **-al** aldehyde (–CHO), **-one** ketone (C=O in the chain), **-oic acid** carboxylic acid (–COOH), **-amine** amine (–NH₂).",
    "The C of –CHO and –COOH belongs to the chain and is **C1**.",
    "Ester: alkyl part + acid part ending in **-oate**, e.g. ethyl butanoate.",
  ] },
  "og-n4": { ex: "OC(=O)C(C)C(=O)C(O)C(C)CC", points: [
    "The group with the **highest rank** gives the ending: acid > aldehyde > ketone > alcohol > amine.",
    "All others become **prefixes**: oxo-, hydroxy-, amino-, methyl-, chloro-.",
    "Principal group lowest number, prefixes **alphabetical**.",
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

export function explainFor(level: LevelKey, task?: Task) {
  const id = typeof level === "number" ? LEVELS[level].id : (LEVELS.find(l => task?.type && l.types.includes(task.type)) ?? LEVELS[0]).id;
  const e = TEXT[id];
  return (
    <div className="explain">
      <ul className="ex-points">{e.points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      <Example smiles={e.ex} />
    </div>
  );
}
