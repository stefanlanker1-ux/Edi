// Erklärkarten je Level: Umrechnungszahlen als Formeln und ein Beispiel als Pfeilkette bzw. Vorsilben-Skala.

import { RichText } from "@lern/ui";
import { solve, QUANTITIES } from "@lern/units";
import type { LevelKey } from "@lern/quiz";
import { LEVELS, type Task } from "./tasks.ts";
import { LiveHelp } from "../components/LiveHelp.tsx";
import type { Stufe } from "../store.ts";

// Nur das Nötigste als Formel – das Bild (Pfeilkette bzw. Skala) erklärt den Rest.
const TEXT: Record<string, { points: string[]; ex: [string, string, string] }> = {
  "us-1": { ex: ["3,45", "m", "cm"], points: [
    "km → m **· 1000** · m → dm → cm → mm je **· 10**",
    "t → kg → g → mg je **· 1000** · kg → dag **· 100**",
  ] },
  "us-2": { ex: ["2,5", "m²", "dm²"], points: [
    "m² → dm² → cm² → mm² je **· 100**",
    "m³ → dm³ → cm³ → mm³ je **· 1000**",
    "1 l = 1 dm³ · 1 ml = 1 cm³ · 1 ha = 100 a = 10 000 m²",
  ] },
  "us-3": { ex: ["1,5", "h", "min"], points: [
    "1 d = 24 h · 1 h = 60 min · 1 min = 60 s",
    "Vergleichen: zuerst **gleiche Einheit**",
  ] },
  "os-1": { ex: ["2,5", "km", "mm"], points: [
    "Umrechnungszahl = **10^(Hochzahl vorher − nachher)**",
    "m²: Hochzahl **· 2** · m³: Hochzahl **· 3**",
  ] },
  "os-2": { ex: ["72", "km/h", "m/s"], points: [
    "1 km/h = 1000 m / 3600 s = **1/3,6 m/s**",
    "1 g/cm³ = **1000 kg/m³** = 1 kg/l",
  ] },
  "os-3": { ex: ["1", "kWh", "kJ"], points: [
    "1 J = 1 W·s · 1 Pa = 1 N/m² · 1 bar = 100 000 Pa · 1 C = 1 A·s",
    "1 kWh = 1000 W · 3600 s = **3600 kJ**",
  ] },
};

export function explainFor(stufe: Stufe, level: LevelKey, task?: Task) {
  const id = typeof level === "number" ? LEVELS[stufe][level].id
    : (LEVELS[stufe].find(l => task?.type && l.types.includes(task.type)) ?? LEVELS[stufe][0]).id;
  const e = TEXT[id];
  return (
    <div className="explain">
      <ul className="ex-points">{e.points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      <LiveHelp s={solve(...e.ex)} os={stufe === "os"} table={QUANTITIES.find(x => x.units.some(u => u.sym === e.ex[1]))?.table} part="calc" />
    </div>
  );
}
