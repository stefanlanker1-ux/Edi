// Kurze Erklärkarten je Level mit einem Beispiel (Strukturformel mit Hauptkette und Nummern).

import { RichText } from "@lern/ui";
import type { LevelKey } from "@lern/quiz";
import { exampleMol } from "../chem/examples.ts";
import { name } from "../chem/naming.ts";
import { MolSvg } from "../components/MolSvg.tsx";
import { useApp } from "../store.ts";
import { LEVELS, type Task } from "./tasks.ts";

const TEXT: Record<string, { points: string[]; ex: string }> = {
  "og-n1": { ex: "CCC(C)C(CC)CCC", points: [
    "**Stamm** nach der Zahl der C: Meth, Eth, Prop, But, Pent, Hex, Hept, Oct, Non, Dec + **-an**.",
    "**Längste Kette** suchen – sie muss nicht gerade gezeichnet sein.",
    "So nummerieren, dass die **Äste kleine Nummern** haben. Äste alphabetisch, gleiche mit di, tri.",
  ] },
  "og-n2": { ex: "CC(C)=CC", points: [
    "Doppelbindung → **-en**, Dreifachbindung → **-in**.",
    "Die Mehrfachbindung bekommt die **kleinste Nummer**. Sie steht vor der Endung: But-2-en.",
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
};

function Example({ smiles }: { smiles: string }) {
  const { view } = useApp();
  const m = exampleMol(smiles), r = name(m);
  return (
    <figure className="ex-example og-ex-fig">
      <MolSvg mol={m} view={view} label={r.ok ? r.name : "Beispiel"} parent={r.ok ? r.parent.atoms : undefined} parentRing={r.ok && r.parent.kind === "ring"}
        numbers={r.ok} group={r.ok ? r.principalAtoms : undefined} minW={4} minH={2.4} />
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
