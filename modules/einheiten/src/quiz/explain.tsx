// Erklärkarten je Niveau: Umrechnungszahlen als Formeln und ein Beispiel als Pfeilkette (Flächen/Volumen mit Längen darüber).

import { RichText } from "@lern/ui";
import { solve } from "@lern/units";
import type { LevelKey } from "@lern/quiz";
import { LEVELS, tableFor, type Stufe, type Task } from "./tasks.ts";
import { LiveHelp } from "../components/LiveHelp.tsx";
import { DimChain } from "../components/DimChain.tsx";
import { scaleMode } from "../help.ts";
import { tr } from "@lern/i18n";

// Nur das Nötigste als Formel – das Bild erklärt den Rest.
const TEXT_DE: Record<string, { points: string[]; ex: [string, string, string] }> = {
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
const TEXT_EN: typeof TEXT_DE = {
  n1: { ex: ["1", "m", "mm"], points: [
    "Large → small unit: **multiply**, small → large: **divide**",
    "· 10: decimal point **one place right** · ÷ 10: one place left",
    "km → m **· 1000** · m → dm → cm → mm **· 10** each · t → kg → g → mg **· 1000** each",
  ] },
  n2: { ex: ["1.5", "g", "kg"], points: [
    "Same as steps of ten: find the conversion factor, then **move the decimal point**",
    "1.5 g ÷ 1000 = **0.0015 kg** – fill missing places with 0",
  ] },
  n3: { ex: ["2.5", "m²", "cm²"], points: [
    "Area = length · length: 1 m² = 10 dm · 10 dm = **100 dm²**",
    "Each step **· 10 · 10 = · 100** – decimal point **two** places",
    "1 a = 10 m · 10 m = 100 m² · 1 ha = 100 m · 100 m = 10 000 m²",
  ] },
  n4: { ex: ["3", "dm³", "cm³"], points: [
    "Volume = length · length · length: 1 dm³ = 10 cm · 10 cm · 10 cm = **1000 cm³**",
    "Each step **· 10 · 10 · 10 = · 1000** – decimal point **three** places",
    "1 l = 1 dm³ · 1 ml = 1 cm³",
  ] },
  t5: { ex: ["1.5", "h", "min"], points: [
    "1 d = **24 h** · 1 h = **60 min** · 1 min = **60 s**",
    "Time does **not work in tens**: 1.5 h = 1.5 · 60 min = **90 min**, not 150 min",
    "0.5 h = 30 min · 0.25 h = 15 min",
  ] },
  n5: { ex: ["72", "km/h", "m/s"], points: [
    "1 h = 60 min = 3600 s",
    "**Replace each unit separately**: 1 km/h = 1000 m / 3600 s = **1/3.6 m/s**",
    "1 g/cm³ = **1000 kg/m³** · 1 bar = 1000 hPa · 1 kWh = 3600 kJ",
  ] },
};
const TEXT = tr(TEXT_DE, TEXT_EN);

/** Oberstufe: Vorsilben als Zehnerpotenzen auf der Skala statt Pfeilkette */
const OS_TEXT_DE: Record<string, string[]> = {
  n1: [
    "Vorsilben sind Zehnerpotenzen: k = 10³, d = 10⁻¹, c = 10⁻², m = 10⁻³, µ = 10⁻⁶",
    "Umrechnungszahl = 10^(Hochzahl vorher − Hochzahl nachher): mm → m: 10^(−3 − 0) = **10⁻³**",
    "1 m = 10³ mm · 1 kg = 10³ g",
  ],
  n2: [
    "Gleich wie Zehnerschritte: Umrechnungszahl als Zehnerpotenz, dann **mal** rechnen",
    "1,5 g = 1,5 · 10⁻³ kg = **0,0015 kg**",
  ],
  n3: [
    "Fläche: Hochzahl der Vorsilbe **mal 2** – 1 m² = (10² cm)² = **10⁴ cm²**",
    "2,5 m² = 2,5 · 10⁴ cm² = 25 000 cm²",
    "1 a = 100 m² · 1 ha = 10 000 m² (ohne Vorsilbe merken)",
  ],
  n4: [
    "Volumen: Hochzahl der Vorsilbe **mal 3** – 1 dm³ = (10 cm)³ = **10³ cm³**",
    "1 l = 1 dm³ · 1 ml = 1 cm³",
  ],
};
const OS_TEXT_EN: typeof OS_TEXT_DE = {
  n1: [
    "Prefixes are powers of ten: k = 10³, d = 10⁻¹, c = 10⁻², m = 10⁻³, µ = 10⁻⁶",
    "Conversion factor = 10^(exponent before − exponent after): mm → m: 10^(−3 − 0) = **10⁻³**",
    "1 m = 10³ mm · 1 kg = 10³ g",
  ],
  n2: [
    "Same as steps of ten: conversion factor as a power of ten, then **multiply**",
    "1.5 g = 1.5 · 10⁻³ kg = **0.0015 kg**",
  ],
  n3: [
    "Area: exponent of the prefix **times 2** – 1 m² = (10² cm)² = **10⁴ cm²**",
    "2.5 m² = 2.5 · 10⁴ cm² = 25 000 cm²",
    "1 a = 100 m² · 1 ha = 10 000 m² (learn without a prefix)",
  ],
  n4: [
    "Volume: exponent of the prefix **times 3** – 1 dm³ = (10 cm)³ = **10³ cm³**",
    "1 l = 1 dm³ · 1 ml = 1 cm³",
  ],
};
const OS_TEXT = tr(OS_TEXT_DE, OS_TEXT_EN);

export function explainFor(stufe: Stufe, level: LevelKey, task?: Task) {
  const levels = LEVELS[stufe];
  const lid = typeof level === "number" ? levels[level].id
    : (levels.find(l => task?.type && l.types.includes(task.type)) ?? levels[0]).id;
  // Oberstufe hat dieselben Erklärungen (Kennung mit „os-“); Unterstufe Niveau 5 = Zeit
  const id = stufe === "us" && lid === "n5" ? "t5" : lid.replace(/^os-/, "");
  const e = stufe === "os" && OS_TEXT[id] ? { ...TEXT[id], points: OS_TEXT[id] } : TEXT[id];
  const [, from, to] = e.ex;
  const scale = scaleMode(stufe === "os", from, to);
  return (
    <div className="explain">
      <ul className="ex-points">{e.points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      {!scale && (id === "n3" || id === "n4") ? <DimChain from={from} to={to} /> : <LiveHelp s={solve(...e.ex)} os={scale} table={tableFor(from, to)} part="calc" />}
    </div>
  );
}
