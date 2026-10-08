// Formeln bauen (Werkbank): die Ionenwand ist die Bühne, die Anzahl direkt darunter; Ionen wählen über die Werkzeugleiste.
// Statt Sätzen kurze Statusmarken; Antippen eines Bausteins zeigt, wie aus dem Atom das Ion wird.

import { useState } from "react";
import { Fit, Stepper, Tag, Workbench, buzz } from "@lern/ui";
import { CATIONS, ANIONS, ION_BY_ID, formulaElements, ionsFor, ratio, isKnownCompound, type Ion } from "@lern/chem";
import { pseTool } from "@lern/chem-ui";
import { useApp } from "../store.ts";
import { IonWall } from "../components/IonWall.tsx";
import { IonLabel } from "../components/IonTile.tsx";
import { IonSheet } from "../components/IonSheet.tsx";
import { tr } from "@lern/i18n";

function IonPicker({ label, list, value, onPick }: { label: string; list: Ion[]; value: string; onPick: (id: string) => void }) {
  return (
    <div className="ip-list" role="radiogroup" aria-label={label}>
      {list.map(ion => (
        <button key={ion.id} type="button" role="radio" aria-checked={ion.id === value} aria-label={ion.name}
          className={`ip-chip ${ion.charge > 0 ? "cation" : "anion"}${ion.id === value ? " on" : ""}`} onClick={() => onPick(ion.id)}>
          <IonLabel ion={ion} />
        </button>
      ))}
    </div>
  );
}

export function BuildView() {
  const { stufe, cation: cId, anion: aId, nC, nA, choose, setCounts } = useApp();
  const [sheet, setSheet] = useState<Ion | null>(null);
  const [tool, setTool] = useState<string | null>(null);
  const os = stufe === "os";
  const cation = ION_BY_ID[cId], anion = ION_BY_ID[aId];
  const r = ratio(cation, anion);
  const pos = nC * cation.charge, neg = nA * -anion.charge;
  const balanced = pos === neg;
  const simplest = balanced && nC === r.nC && nA === r.nA;
  const set = (p: { nC?: number; nA?: number }) => { buzz(); setCounts(p); };

  return (
    <>
      <Workbench className="ib-wb" label={tr("Ionen wählen", "Choose ions")} active={tool} onActive={setTool}
        stage={<Fit min={0.55}><IonWall cation={cation} anion={anion} nC={nC} nA={nA} onTile={setSheet} /></Fit>}
        status={<>
          {!balanced && <Tag tone="signal">{pos < neg ? `+ ${cation.name}` : `+ ${anion.name}`}</Tag>}
          {balanced && !simplest && <Tag tone="signal">{tr("kürzen auf", "simplify to")} {r.nC} : {r.nA}</Tag>}
          {simplest && <Tag tone="ok">✓ neutral</Tag>}
          {simplest && !isKnownCompound(cation, anion) && <Tag tone="bad">✗ {tr("gibt es nicht (nicht beständig)", "does not exist (not stable)")}</Tag>}
        </>}
        controls={
          <div className="wall-controls">
            <Stepper compact tone="cation" label={<IonLabel ion={cation} />} value={nC} min={1} max={6} onChange={v => set({ nC: v })} />
            <Stepper compact tone="anion" label={<IonLabel ion={anion} />} value={nA} min={1} max={6} onChange={v => set({ nA: v })} />
          </div>
        }
        tools={[
          { id: "c", label: <>{tr("Kation", "Cation")} <IonLabel ion={cation} /></>, title: tr("Kation", "Cation"), icon: "cation",
            content: <IonPicker label={tr("Kation (positiv)", "Cation (positive)")} list={ionsFor(CATIONS, os)} value={cId} onPick={id => { choose({ cation: id }); setTool(null); }} /> },
          { id: "a", label: <>Anion <IonLabel ion={anion} /></>, title: "Anion", icon: "anion",
            content: <IonPicker label={tr("Anion (negativ)", "Anion (negative)")} list={ionsFor(ANIONS, os)} value={aId} onPick={id => { choose({ anion: id }); setTool(null); }} /> },
          pseTool({ stufe, mark: formulaElements(cation.formula, anion.formula) }),
          { id: "ok", label: tr("Aus\u00ADgleichen", "Balance"), icon: "check", disabled: simplest, onClick: () => set({ nC: r.nC, nA: r.nA }) },
          { id: "reset", label: tr("Zurück", "Reset"), icon: "reset", onClick: () => set({ nC: 1, nA: 1 }) },
        ]} />
      <IonSheet ion={sheet} os={os} onClose={() => setSheet(null)} />
    </>
  );
}
