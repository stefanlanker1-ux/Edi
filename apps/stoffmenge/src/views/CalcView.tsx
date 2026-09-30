// Rechnen (Werkbank): Rechenweg als Bühne, Eingabe (Masse oder Stoffmenge) darunter, Stoff / PSE / So geht's in der Werkzeugleiste.

import { useState } from "react";
import { Segmented, Tag, Workbench, RichText, softHyphens } from "@lern/ui";
import { MOLE_SUBSTANCES, molarMass, moles, massOf, fmt, toSubscript, formulaElements } from "@lern/chem";
import { pseTool } from "@lern/chem-ui";
import { useApp, type Mode } from "../store.ts";
import { CalcStage } from "../components/Calc.tsx";

export function CalcView() {
  const { formula, mode, value, choose, setMode, setValue } = useApp();
  const [tool, setTool] = useState<string | null>(null);
  const M = molarMass(formula);
  const n = mode === "m" ? moles(value, M) : value;
  const m = mode === "m" ? value : massOf(value, M);
  const unit = mode === "m" ? "g" : "mol";
  return (
    <Workbench className="sm-wb" label="Werkzeuge" active={tool} onActive={setTool}
      head={<h2 className="sm-title">{mode === "m" ? "Masse → Stoffmenge" : "Stoffmenge → Masse"}</h2>}
      stage={<CalcStage formula={formula} mode={mode} value={value} />}
      status={<>
        <Tag tone="signal">M = {fmt(M)} g/mol</Tag>
        <Tag>{fmt(m)} g</Tag>
        <Tag tone="ok">{fmt(n)} mol</Tag>
      </>}
      controls={
        <div className="sm-controls">
          <Segmented<Mode> label="Gegeben" value={mode} onChange={setMode} options={[{ value: "m", label: "Masse m" }, { value: "n", label: "Stoffmenge n" }]} />
          <label className="sm-input">
            <span>{mode === "m" ? "m" : "n"}</span>
            <input type="number" inputMode="decimal" min={0} max={9999} step={mode === "m" ? 1 : 0.5} value={value} aria-label={mode === "m" ? "Masse in Gramm" : "Stoffmenge in mol"}
              onChange={e => setValue(Number(e.target.value))} />
            <span>{unit}</span>
          </label>
        </div>
      }
      tools={[
        { id: "stoff", label: "Stoff", icon: "sample", title: "Stoff wählen",
          content: (
            <div className="sm-list" role="radiogroup" aria-label="Stoff wählen">
              {MOLE_SUBSTANCES.map(s => (
                <button key={s.formula} type="button" role="radio" aria-checked={s.formula === formula} className={`sm-item${s.formula === formula ? " on" : ""}`}
                  onClick={() => { choose(s.formula); setTool(null); }}>
                  <span className="sm-f">{toSubscript(s.formula)}{s.gas && <small> (g)</small>}</span>
                  <span className="sm-name">{softHyphens(s.name)}</span>
                </button>
              ))}
            </div>
          ) },
        pseTool({ stufe: "us", mark: formulaElements(formula), wide: true }),
        { id: "how", label: "So geht's", icon: "bulb", title: "Stoffmenge – so geht's",
          content: (
            <ol className="sm-how">
              <li><RichText text="**1 mol** = 6,022 · 10²³ Teilchen – eine Packungseinheit, wie „ein Dutzend“." /></li>
              <li><RichText text="**Molare Masse M** in g/mol: Atommassen aus dem PSE addieren (H₂O: 2 · 1 + 16 = 18)." /></li>
              <li><RichText text="**n = m / M** – Masse durch molare Masse. Umgekehrt **m = n · M**." /></li>
              <li><RichText text="Gase: **1 mol = 22,4 l** (Normbedingungen), egal welches Gas." /></li>
            </ol>
          ) },
      ]} />
  );
}
