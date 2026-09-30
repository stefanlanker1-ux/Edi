// Erklärkarten je Niveau: Umrechnungszahlen als Formeln und ein Beispiel als Pfeilkette (Flächen/Volumen mit Längen darüber).

import { RichText } from "@lern/ui";
import { solve } from "@lern/units";
import type { LevelKey } from "@lern/quiz";
import { LEVELS, tableFor, type Task } from "./tasks.ts";
import { LiveHelp } from "../components/LiveHelp.tsx";
import { DimChain } from "../components/DimChain.tsx";
import { rare } from "../help.ts";

// Nur das Nötigste als Formel – das Bild erklärt den Rest.
const TEXT: Record<string, { points: string[]; ex: [string, string, string] }> = {
  n1: { ex: ["1", "m", "mm"], points: [
    "Große → kleine Einheit: **mal**, kleine → große: **geteilt**",
    "· 10: Komma **eine Stelle nach rechts** · : 10: eine Stelle nach links",
    "km → m **· 1000** · m → dm → cm → mm je **· 10** · t → kg → g → mg je **· 1000**",
  ] },
  n2: { ex: ["1,5", "g", "kg"], points: [
    "Gleich wie Zehnerschritte: Umrechnungszahl suchen, dann **Komma verschieben**",
    "1,5 g : 1000 = **0,0015 kg** – fehlende Stellen mit 0 auffüllen",
  ] },
  n3: { ex: ["2,5", "m²", "cm²"], points: [
    "Fläche = Länge · Länge: 1 m² = 10 dm · 10 dm = **100 dm²**",
    "Jede Stufe **· 10 · 10 = · 100** – Komma **zwei** Stellen",
    "1 a = 10 m · 10 m = 100 m² · 1 ha = 100 m · 100 m = 10 000 m²",
  ] },
  n4: { ex: ["3", "dm³", "cm³"], points: [
    "Volumen = Länge · Länge · Länge: 1 dm³ = 10 cm · 10 cm · 10 cm = **1000 cm³**",
    "Jede Stufe **· 10 · 10 · 10 = · 1000** – Komma **drei** Stellen",
    "1 l = 1 dm³ · 1 ml = 1 cm³",
  ] },
  n5: { ex: ["72", "km/h", "m/s"], points: [
    "1 h = 60 min = 3600 s",
    "**Jede Einheit einzeln ersetzen**: 1 km/h = 1000 m / 3600 s = **1/3,6 m/s**",
    "1 g/cm³ = **1000 kg/m³** · 1 bar = 1000 hPa · 1 kWh = 3600 kJ",
  ] },
};

export function explainFor(level: LevelKey, task?: Task) {
  const id = typeof level === "number" ? LEVELS[level].id
    : (LEVELS.find(l => task?.type && l.types.includes(task.type)) ?? LEVELS[0]).id;
  const e = TEXT[id];
  const [, from, to] = e.ex;
  return (
    <div className="explain">
      <ul className="ex-points">{e.points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      {id === "n3" || id === "n4" ? <DimChain from={from} to={to} /> : <LiveHelp s={solve(...e.ex)} os={rare(from, to)} table={tableFor(from, to)} part="calc" />}
    </div>
  );
}
