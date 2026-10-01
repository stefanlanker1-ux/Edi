// Periodensystem als Hilfsmittel (Quiz, Üben): Elemente aus der Aufgabe sind markiert,
// Antippen zeigt die Daten wie auf einem gedruckten PSE (Z, Gruppe, Periode, Atommasse) – nicht mehr, sonst wäre die Lösung verraten.

import { useState, type ReactNode } from "react";
import { BY_Z, groupLabel } from "@lern/chem";
import { BlockLegend, PeriodicTable } from "./PeriodicTable.tsx";

export function PseHelp({ stufe, mark = [], sub, facts, blocks }: {
  stufe: "us" | "os";
  /** nach s-, p-, d-, f-Block färben (Elektronenkonfiguration) */
  blocks?: boolean;
  /** markierte Elemente (Ordnungszahlen) */
  mark?: number[];
  /** Zusatzangabe in jeder Zelle (Ionenladung, Außenelektronen …) */
  sub?: (Z: number) => ReactNode;
  /** eigene Angaben zum angetippten Element */
  facts?: (Z: number) => ReactNode;
}) {
  const [sel, setSel] = useState<number | null>(mark[0] ?? null);
  const el = sel ? BY_Z[sel] : null;
  return (
    <div className="pse-help">
      <div className={`pse-fit ph-box ${stufe}`}>
        <PeriodicTable fit stufe={stufe} names={!sub} sub={sub} onPick={setSel} blocks={blocks}
          cellState={Z => (Z === sel ? "sel" : mark.includes(Z) ? "hit" : undefined)} />
      </div>
      {blocks && <BlockLegend />}
      {el && (
        <div className="ph-facts" aria-live="polite">
          <b className="ph-name">{el.name}</b>
          <span>Z = {el.Z}</span>
          <span>{groupLabel(el.Z, stufe === "os")}</span>
          <span>{el.period}. Periode</span>
          <span>{el.mass.toLocaleString("de-AT")} u</span>
          {facts?.(el.Z)}
        </div>
      )}
    </div>
  );
}

/** Das PSE als Werkzeug – für Werkbank (`Workbench tools`) und Quiz (`QuizScreen tools`) gleich:
 *  `tools={[pseTool({ stufe, mark: formulaElements(formel) }), …]}` (Namen im Text: `elementsIn`). Markierte Elemente sind hervorgehoben, das erste ist ausgewählt. */
export function pseTool({ stufe, mark = [], wide = stufe === "os", sub, facts, blocks }: {
  stufe: "us" | "os"; mark?: number[]; blocks?: boolean;
  /** breites Blatt am Handy (Oberstufe: mehr Spalten) */
  wide?: boolean;
  sub?: (Z: number) => ReactNode; facts?: (Z: number) => ReactNode;
}) {
  // Unterstufen-PSE zeigt nur Z 1–20: kommt ein schwereres Element vor (Ba, Fe …), das ganze PSE zeigen
  const table = stufe === "us" && mark.some(z => z > 20) ? "os" : stufe;
  return {
    id: "pse", label: "PSE", title: "Periodensystem", icon: "grid" as const, wide: wide || table === "os",
    // key: neue Markierung → Auswahl neu setzen
    content: <PseHelp key={mark.join(",")} stufe={table} mark={mark} sub={sub} facts={facts} blocks={blocks} />,
  };
}
