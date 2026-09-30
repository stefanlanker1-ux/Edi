// Live-Hilfe zu einer Umrechnung – überall gleich (Umrechnen, Quiz-Rückmeldung, Erklärkarten):
//   Oberstufe mit Vorsilben: Vorsilben-Skala · sonst Pfeilkette (+ Stellenwerttafel in der Unterstufe) · zusammengesetzt: Einsetz-Kette

import { prefixStep, chainFor, pvColumns, pvIndex, type Solution } from "@lern/units";
import { SubstFlow } from "./Visuals.tsx";
import { ArrowChain } from "./ArrowChain.tsx";
import { PowerScale } from "./PowerScale.tsx";
import { PlaceValueTable, PvLegend } from "./PlaceValueTable.tsx";

/** Live-Hilfe zur aktuellen Umrechnung */
export function LiveHelp({ s, os, table, part = "all" }: { s: Solution; os: boolean; table?: string[]; part?: "all" | "calc" | "table" }) {
  if (s.from === s.to) return null;
  const inTable = table && pvIndex(pvColumns(table), s.from) >= 0 && pvIndex(pvColumns(table), s.to) >= 0;
  if (part !== "table" && os && prefixStep(s.from, s.to)) return <PowerScale from={s.from} to={s.to} value={s.value} />;
  const chain = chainFor(s.from, s.to);
  return (
    <div className="live-help">
      {part !== "table" && (chain ? <ArrowChain from={s.from} to={s.to} value={s.value} os={os} /> : <SubstFlow s={s} />)}
      {part !== "calc" && !os && inTable && (
        <>
          <PlaceValueTable value={s.value} from={s.from} to={s.to} units={table!} />
          <PvLegend />
        </>
      )}
    </div>
  );
}


/** Gibt es für diese Umrechnung eine Stellenwerttafel (Unterstufe, beide Einheiten in der Tafel)? */
export const hasTable = (s: Solution, os: boolean, table?: string[]) =>
  !os && !!table && pvIndex(pvColumns(table), s.from) >= 0 && pvIndex(pvColumns(table), s.to) >= 0;
