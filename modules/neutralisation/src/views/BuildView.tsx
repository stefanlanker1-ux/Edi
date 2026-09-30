// Neutralisieren (Werkbank): Die Neutralisationswand ist die Bühne, darunter die Anzahl von Lauge und Säure und „Reaktion“.
// Lauge und Säure wählen über die Werkzeugleiste; Antippen einer Formeleinheit zeigt ihren Zerfall in Ionen.

import { useState } from "react";
import { Fit, FitDown, Icon, Stepper, Tag, Workbench, buzz } from "@lern/ui";
import { Formula, pseTool } from "@lern/chem-ui";
import { HYDROXIDE_BY_ID, PROTIC_BY_ID, formulaElements, neutralCounts, neutralEquation, isKnownSalt } from "@lern/chem";
import { useApp } from "../store.ts";
import { NeutralWall } from "../components/NeutralWall.tsx";
import { AcidTable, BasePicker, UnitSheet } from "../components/Pickers.tsx";

const FINE_POINTER = typeof matchMedia !== "undefined" && matchMedia("(pointer: fine)").matches;

export function BuildView() {
  const { stufe, base: bId, acid: aId, step, nB, nA, choose, setCounts } = useApp();
  const [tool, setTool] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"base" | "acid" | null>(null);
  const [react, setReact] = useState(false);
  const os = stufe === "os";
  const base = HYDROXIDE_BY_ID[bId], acid = PROTIC_BY_ID[aId];
  const { oh, h, balanced } = neutralCounts(base, step, nB, nA);
  const n = neutralEquation(base, acid, step);
  const simplest = balanced && nB === n.nBase && nA === n.nAcid;
  const set = (p: { nB?: number; nA?: number }) => { buzz(); setReact(false); setCounts(p); };
  const pick = (p: { base?: string; acid?: string; step?: number }) => { setReact(false); choose(p); setTool(null); };

  return (
    <>
      <Workbench className="nw-wb" label="Lauge und Säure wählen" active={tool} onActive={setTool}
        stage={<Fit min={0.5}><NeutralWall base={base} acid={acid} step={step} nB={nB} nA={nA} products={react} onUnit={setSheet} /></Fit>}
        status={<>
          {!balanced && <Tag tone="signal">{oh < h ? <>+ <Formula f={base.formula} /></> : <>+ <Formula f={acid.formula} /></>}</Tag>}
          {balanced && !simplest && <Tag tone="signal">kürzen auf {n.nBase} : {n.nAcid}</Tag>}
          {simplest && <Tag tone="ok">✓ neutral</Tag>}
          {balanced && step < acid.protons && <Tag>noch {acid.protons - step} H im Säurerest</Tag>}
          {balanced && !isKnownSalt(base, n.rest) && <Tag tone="bad">✗ Salz zersetzt sich in Wasser</Tag>}
        </>}
        controls={
          <div className="nw-controls">
            <Stepper compact tone="base" label={<Formula f={base.formula} />} value={nB} min={1} max={6} onChange={v => set({ nB: v })} />
            <Stepper compact tone="acid" label={<Formula f={acid.formula} />} value={nA} min={1} max={6} onChange={v => set({ nA: v })} />
            <button type="button" className={`nw-go${react ? " on" : ""}`} disabled={!balanced} aria-pressed={react}
              aria-label={react ? "Ausgangsstoffe zeigen" : "Reaktion: Salz und Wasser zeigen"} onClick={() => { buzz(); setReact(!react); }}>
              <Icon name={react ? "back" : "play"} size={22} /><span>{react ? "Zurück" : "Reaktion"}</span>
            </button>
          </div>
        }
        tools={[
          { id: "b", label: <>Lauge <Formula f={base.formula} /></>, title: "Lauge", icon: "anion",
            content: <BasePicker value={bId} os={os} onPick={id => pick({ base: id })} /> },
          { id: "a", label: <>Säure <Formula f={acid.formula} /></>, title: "Säure", icon: "table", wide: true,
            content: FINE_POINTER
              // niedriges Laptop-Fenster (Maus): Tabelle etwas kleiner statt scrollen; am Touchscreen bleiben die Tippziele 44 px
              ? <FitDown min={0.7}><AcidTable os={os} acid={aId} step={step} onPick={(id, k) => pick({ acid: id, step: k })} /></FitDown>
              : <AcidTable os={os} acid={aId} step={step} onPick={(id, k) => pick({ acid: id, step: k })} /> },
          pseTool({ stufe, mark: formulaElements(base.formula, acid.formula) }),
          { id: "ok", label: "Aus\u00ADgleichen", icon: "check", disabled: simplest, onClick: () => set({ nB: n.nBase, nA: n.nAcid }) },
          { id: "reset", label: "Von vorn", icon: "reset", onClick: () => set({ nB: 1, nA: 1 }) },
        ]} />
      <UnitSheet which={sheet} base={base} acid={acid} step={step} os={os} onClose={() => setSheet(null)} />
    </>
  );
}
