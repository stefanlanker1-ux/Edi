// Umrechnen (Werkbank): eine Rechenzeile [Zahl] [von ▾] ⇄ [in ▾], darunter das Ergebnis und die Pfeilkette bzw. Vorsilben-Skala.
// Werkzeuge: Stellenwerttafel | Tafel (Rechenweg in Kreide) | Bild (Lineal, Fläche …).

import { Fit, IconButton, Workbench, buzz, type WorkbenchTool } from "@lern/ui";
import { QUANTITY, unitsFor, parseQ, solve, unitSi, mul, isTerminating, fmt, ladderFor } from "@lern/units";
import { useApp } from "../store.ts";
import { QuantitySelect, UnitSelect } from "../components/Pickers.tsx";
import { ChalkBoard } from "../components/ChalkBoard.tsx";
import { VisualFor } from "../components/Visuals.tsx";
import { LiveHelp, hasTable } from "../components/LiveHelp.tsx";
import { Num, sci, sciNeeded, timeMixed } from "../format.tsx";
import { rare } from "../help.ts";

/** Beispiel je Größe (beim Wechsel der Größe) */
export const EXAMPLES: Record<string, [string, string, string]> = {
  len: ["0,1", "m", "cm"], area: ["2,5", "m²", "dm²"], vol: ["1,5", "l", "ml"], mass: ["2,5", "kg", "g"], time: ["1,5", "h", "min"],
  speed: ["72", "km/h", "m/s"], density: ["2,7", "g/cm³", "kg/m³"], pressure: ["1013", "hPa", "bar"], force: ["2,5", "kN", "N"],
  energy: ["1", "kWh", "kJ"], power: ["150", "PS", "kW"], voltage: ["230", "V", "kV"], current: ["250", "mA", "A"],
  resistance: ["4,7", "kΩ", "Ω"], charge: ["3000", "mAh", "C"], freq: ["88,5", "MHz", "kHz"], conc: ["150", "mmol/l", "mol/l"], flow: ["12", "l/min", "m³/h"],
};

export function ConvertView() {
  const { conv, setConv, stufe } = useApp();
  // seltene Vorsilben (µm, MHz …): Vorsilben-Skala und Zehnerpotenzen, sonst Pfeilkette und Stellenwerttafel
  const os = rare(conv.from, conv.to);
  const qt = QUANTITY[conv.qty];
  const units = unitsFor(qt, stufe === "os");
  const v = parseQ(conv.value);
  const s = v ? solve(v, conv.from, conv.to) : null;
  const pickQty = (id: string) => { buzz(); const [value, from, to] = EXAMPLES[id]; setConv({ qty: id, value, from, to }); };
  const mixed = s && qt.kind === "time" ? timeMixed(mul(s.result, unitSi(s.to))) : null;

  const same = !s || s.from === s.to;
  const tools: WorkbenchTool[] = same ? [] : [
    ...(hasTable(s!, os, qt.table) ? [{ id: "table", label: "Stellenwerttafel", icon: "table" as const, wide: true, content: <LiveHelp s={s!} os={os} table={qt.table} part="table" /> }] : []),
    { id: "board", label: "Tafel", icon: "board", wide: true, title: "Rechenweg", content: <ChalkBoard s={s!} os={os} /> },
    ...(!os && ladderFor(s!.from, s!.to) ? [{ id: "viz", label: "Bild", icon: "cube" as const, content: <VisualFor s={s!} os={os} /> }] : []),
  ];

  return (
    <Workbench className="cv-wb" label="Rechenweg" tools={tools}
      head={<QuantitySelect value={conv.qty} os={stufe === "os"} onChange={pickQty} />}
      stage={
        <div className="cv-stage">
          <div className="cv-line">
            <input className="cv-num" value={conv.value} inputMode="decimal" autoComplete="off" spellCheck={false} aria-invalid={!v} aria-label="Zahl"
              onChange={e => setConv({ value: e.target.value })} placeholder="3,45" />
            <UnitSelect label="von" units={units} value={conv.from} onChange={u => { buzz(); setConv({ from: u }); }} />
            <IconButton icon="swap" label="Einheiten tauschen" onClick={() => { buzz(); setConv({ from: conv.to, to: conv.from, value: s && isTerminating(s.result) ? fmt(s.result).text : conv.value }); }} />
            <UnitSelect label="in" units={units} value={conv.to} onChange={u => { buzz(); setConv({ to: u }); }} />
          </div>
          {s && (
            <div className="cv-result" aria-live="polite">
              <span className="cv-from"><Num v={s.value} /> {s.from}</span>
              <span className="cv-eq">{isTerminating(s.result) ? "=" : "≈"}</span>
              <span className="cv-to">{isTerminating(s.result) ? <Num v={s.result} /> : fmt(s.result).text} {s.to}</span>
              {sciNeeded(s.result) && <span className="cv-sci">= {sci(s.result)} {s.to}</span>}
              {mixed && <span className="cv-sci">= {mixed}</span>}
            </div>
          )}
          {!same && <div className="cv-viz"><Fit><LiveHelp s={s!} os={os} table={qt.table} part="calc" /></Fit></div>}
        </div>
      } />
  );
}
