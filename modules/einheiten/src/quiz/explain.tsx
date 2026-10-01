// Erklärkarten je Niveau: Umrechnungszahlen als Formeln und ein Beispiel als Pfeilkette (Flächen/Volumen mit Längen darüber).

import { RichText } from "@lern/ui";
import { solve } from "@lern/units";
import type { LevelKey } from "@lern/quiz";
import { LEVELS, tableFor, type Stufe, type Task } from "./tasks.ts";
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
  t5: { ex: ["1,5", "h", "min"], points: [
    "1 d = **24 h** · 1 h = **60 min** · 1 min = **60 s**",
    "Zeit rechnet **nicht in Zehnern**: 1,5 h = 1,5 · 60 min = **90 min**, nicht 150 min",
    "0,5 h = 30 min · 0,25 h = 15 min",
  ] },
  n5: { ex: ["72", "km/h", "m/s"], points: [
    "1 h = 60 min = 3600 s",
    "**Jede Einheit einzeln ersetzen**: 1 km/h = 1000 m / 3600 s = **1/3,6 m/s**",
    "1 g/cm³ = **1000 kg/m³** · 1 bar = 1000 hPa · 1 kWh = 3600 kJ",
  ] },
};

export function explainFor(stufe: Stufe, level: LevelKey, task?: Task) {
  const levels = LEVELS[stufe];
  const lid = typeof level === "number" ? levels[level].id
    : (levels.find(l => task?.type && l.types.includes(task.type)) ?? levels[0]).id;
  // Oberstufe hat dieselben Erklärungen (Kennung mit „os-“); Unterstufe Niveau 5 = Zeit
  const id = stufe === "us" && lid === "n5" ? "t5" : lid.replace(/^os-/, "");
  const e = TEXT[id];
  const [, from, to] = e.ex;
  return (
    <div className="explain">
      <ul className="ex-points">{e.points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      {id === "n3" || id === "n4" ? <DimChain from={from} to={to} /> : <LiveHelp s={solve(...e.ex)} os={rare(from, to)} table={tableFor(from, to)} part="calc" />}
    </div>
  );
}
