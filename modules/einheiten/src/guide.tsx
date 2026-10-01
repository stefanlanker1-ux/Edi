// Geführte Erklärung Einheiten: mit Pfeilkette und Stellenwerttafel (Unterstufe) bzw. Vorsilben-Skala (Oberstufe),
// Flächen- und Würfelbild, Uhr. Umrechnungszahl, mal oder geteilt, vergleichen, Flächen, Volumen, Zeit, zusammengesetzt.

import type { ReactNode } from "react";
import type { GuideDef, GuideStep } from "@lern/ui";
import { parseQ } from "@lern/units";
import { ArrowChain } from "./components/ArrowChain.tsx";
import { PlaceValueTable } from "./components/PlaceValueTable.tsx";
import { PowerScale } from "./components/PowerScale.tsx";
import { DimChain } from "./components/DimChain.tsx";
import { AreaGrid, Clock, Cube } from "./components/Visuals.tsx";
import { tableFor } from "./quiz/tasks.ts";

const Box = ({ children }: { children: ReactNode }) => <div className="eh-g">{children}</div>;
/** Pfeilkette nur mit den Schritten (ohne Ergebniszeile) – die Rechnung macht der Schüler */
const Chain = ({ from, to }: { from: string; to: string }) => <Box><ArrowChain from={from} to={to} value={null} showValues={false} caption={false} /></Box>;
const Table = ({ from, to, v }: { from: string; to: string; v: string }) =>
  <Box><PlaceValueTable value={parseQ(v)!} from={from} to={to} units={tableFor(from, to)!} showResult={false} label={`${v} ${from} → ${to}`} /></Box>;
const Scale = ({ from, to, v }: { from: string; to: string; v?: string }) => <Box><PowerScale from={from} to={to} value={v ? parseQ(v) : null} showResult={false} showFactor={false} /></Box>;

const US: GuideStep[] = [
  {
    say: "Längen in Nachbarschritten: km → m: · 1000, m → dm → cm → mm: je · 10. Die Pfeilkette zeigt den Weg.",
    ask: "Setze die **Umrechnungszahl** ein: 1 m = ? cm", answer: 100, num: { unit: "cm" },
    visual: () => <Chain from="m" to="cm" />,
    why: { "10": "m → dm → cm: zwei Schritte mit je · 10.", "1000": "1000 wäre km → m." },
    tip: "Zähle in der Pfeilkette die Schritte von m bis cm. Jeder Schritt ist · 10.",
    ok: "1 m = 100 cm (· 10 · 10).",
  },
  {
    say: "Von der **großen** zur **kleinen** Einheit wird die Zahl größer: **mal**. Von klein zu groß: **geteilt**.",
    ask: "Du rechnest **7,5 cm** in **mm** um. Wie rechnest du?", answer: "· 10", options: ["· 10", ": 10", "· 100", ": 100"],
    visual: () => <Chain from="cm" to="mm" />,
    why: { ": 10": "mm ist kleiner als cm – es werden mehr: mal.", "· 100": "cm → mm ist nur ein Schritt.", ": 100": "Kleinere Einheit → mehr Stück: mal." },
    ok: "cm → mm: · 10.",
  },
  {
    say: "In der **Stellenwerttafel** steht die Einerziffer in der Spalte der Einheit. Umrechnen heißt: das Komma in die neue Spalte setzen.",
    ask: "7,5 cm = ? mm", answer: 75, num: { unit: "mm" },
    visual: () => <Table from="cm" to="mm" v="7.5" />,
    why: { "750": "Nur ein Schritt (· 10): 7,5 · 10.", "0.75": "mm ist kleiner – die Zahl wird größer." },
    tip: "cm → mm ist ein Schritt: Komma eine Stelle nach rechts.",
    ok: "Ein Schritt nach rechts: Komma eine Stelle weiter – 7,5 cm = 75 mm.",
  },
  {
    say: "Massen: t → kg: · 1000, kg → dag: · 100, dag → g: · 10.",
    ask: "0,3 kg = ? dag", answer: 30, num: { unit: "dag" },
    visual: () => <Table from="kg" to="dag" v="0.3" />,
    why: { "3": "kg → dag ist · 100, nicht · 10.", "300": "300 wäre in g (· 1000)." },
    tip: "kg → dag ist · 100: Komma zwei Stellen nach rechts.",
    ok: "0,3 kg = 30 dag.",
  },
  {
    say: "Hohlmaße: hl → l: · 100, l → dl → cl → ml: je · 10.",
    ask: "1 l = ? ml", answer: 1000, num: { unit: "ml" },
    visual: () => <Chain from="l" to="ml" />,
    why: { "100": "l → dl → cl → ml: drei Schritte · 10.", "10": "Das ist nur l → dl." },
    tip: "Zähle die Schritte l → dl → cl → ml. Jeder ist · 10.",
    ok: "1 l = 1000 ml.",
  },
  {
    say: "Zum **Vergleichen** beide Angaben in **dieselbe** Einheit umrechnen.",
    ask: "Was ist mehr: **1,2 cm** oder **10,8 mm**?", answer: "1,2 cm", options: ["1,2 cm", "10,8 mm", "gleich viel"],
    why: { "10,8 mm": "1,2 cm = 12 mm – das ist mehr als 10,8 mm.", "gleich viel": "1,2 cm = 12 mm, nicht 10,8 mm." },
    ok: "1,2 cm = 12 mm > 10,8 mm.",
  },
  {
    say: "**Fläche** = Länge · Länge. 1 dm = 10 cm, also 1 dm² = 10 · 10 = **100 cm²**. Flächen-Nachbarn: **· 100**.",
    ask: "1 m² = ? dm²", answer: 100, num: { unit: "dm²" },
    visual: () => <Box><AreaGrid big="dm²" small="cm²" /></Box>,
    why: { "10": "Ein Quadrat 10 × 10 hat 100 kleine Quadrate.", "1000": "1000 ist der Schritt bei Volumen." },
    tip: "Ein Flächenschritt ist 10 · 10.",
    ok: "Flächen-Nachbarn: · 100. 1 m² = 100 dm².",
  },
  {
    say: "1 **ha** = 100 a, 1 **a** = 100 m².",
    ask: "3 a = ? m²", answer: 300, num: { unit: "m²" },
    visual: () => <Box><DimChain from="a" to="m²" /></Box>,
    why: { "30": "Flächen-Schritt: · 100.", "3000": "a → m² ist ein Flächenschritt: · 100." },
    tip: "a → m² ist ein Flächenschritt.",
    ok: "3 a = 300 m².",
  },
  {
    say: "**Volumen** = Länge · Länge · Länge: 1 dm³ = 10 · 10 · 10 = **1000 cm³**. Volumen-Nachbarn: **· 1000**.",
    ask: "1 m³ = ? dm³", answer: 1000, num: { unit: "dm³" },
    visual: () => <Box><Cube big="dm³" small="cm³" /></Box>,
    why: { "100": "100 ist der Schritt bei Flächen. Ein Würfel: 10 · 10 · 10.", "10": "10 ist der Schritt bei Längen." },
    tip: "Ein Volumenschritt ist 10 · 10 · 10.",
    ok: "Volumen-Nachbarn: · 1000. 1 m³ = 1000 dm³.",
  },
  {
    say: "**1 l = 1 dm³**, **1 ml = 1 cm³**.",
    ask: "0,5 l = ? cm³", answer: 500, num: { unit: "cm³" },
    why: { "50": "0,5 l = 0,5 dm³ = 500 cm³ (· 1000).", "5": "dm³ → cm³: · 1000." },
    tip: "Erst l = dm³, dann dm³ → cm³: ein Volumenschritt.",
    ok: "0,5 l = 500 ml = 500 cm³.",
  },
  {
    say: "Größenvorstellung hilft beim Prüfen.",
    ask: "Welche Einheit passt? Eine **Briefmarke** hat etwa 6 ▢.", answer: "cm²", options: ["cm²", "mm²", "dm²", "m²"],
    why: { "mm²": "6 mm² wäre kleiner als ein Stecknadelkopf.", "dm²": "6 dm² wäre so groß wie ein Heft.", "m²": "6 m² ist ein kleines Zimmer." },
    ok: "Etwa 2 cm × 3 cm = 6 cm².",
  },
  {
    say: "Zeit geht **nicht** in Zehnerschritten: 1 h = **60** min, 1 min = 60 s, 1 d = 24 h.",
    ask: "1,5 h = ? min", answer: 90, num: { unit: "min" },
    visual: () => <Box><Clock big="h" small="min" /></Box>,
    why: { "15": "Keine Zehnerschritte: 1,5 · 60.", "150": "1 h = 60 min, nicht 100 min." },
    tip: "Jede Stunde hat 60 Minuten: Stunden · 60.",
    ok: "1,5 h = 90 min.",
  },
  {
    ask: "Was dauert länger: **2,5 h** oder **150 min**?", answer: "gleich lang", options: ["2,5 h", "150 min", "gleich lang"],
    why: { "2,5 h": "2,5 · 60 = 150 min.", "150 min": "150 : 60 = 2,5 h." },
    ok: "2,5 h = 150 min.",
  },
];

const OS: GuideStep[] = [
  {
    say: "**Vorsilben** sind Zehnerpotenzen: G 10⁹, M 10⁶, k 10³, d 10⁻¹, c 10⁻², m 10⁻³, µ 10⁻⁶, n 10⁻⁹.",
    ask: "Welche Zehnerpotenz steht für **m** (Milli)?", answer: "10⁻³", options: ["10⁻³", "10³", "10⁻⁶", "10⁻²"],
    visual: () => <Scale from="mm" to="m" />,
    why: { "10³": "10³ ist k (Kilo).", "10⁻⁶": "10⁻⁶ ist µ (Mikro).", "10⁻²": "10⁻² ist c (Zenti)." },
    ok: "1 mm = 10⁻³ m.",
  },
  {
    say: "Umrechnungszahl = 10^(Hochzahl **vorher** − Hochzahl **nachher**).",
    ask: "1 nm = ? cm", answer: "10⁻⁷ cm", options: ["10⁻⁷ cm", "10⁷ cm", "10⁻¹¹ cm", "10⁻⁹ cm"],
    visual: () => <Scale from="nm" to="cm" />,
    why: { "10⁷ cm": "Vorher −9, nachher −2: −9 − (−2) = −7.", "10⁻¹¹ cm": "Abziehen, nicht addieren: −9 − (−2).", "10⁻⁹ cm": "10⁻⁹ wäre in m. In cm: −9 − (−2)." },
    ok: "1 nm = 10⁻⁷ cm.",
  },
  {
    ask: "250 MHz = ? GHz", answer: 0.25, num: { unit: "GHz" },
    visual: () => <Scale from="MHz" to="GHz" v="250" />,
    why: { "250000": "GHz ist größer – die Zahl wird kleiner: 250 · 10⁻³.", "2.5": "10^(6 − 9) = 10⁻³: drei Stellen." },
    tip: "Hochzahl vorher (M) minus Hochzahl nachher (G). Das Komma wandert nach links.",
    ok: "250 · 10⁻³ = 0,25 GHz.",
  },
  {
    ask: "0,01 MΩ = ? kΩ", answer: 10, num: { unit: "kΩ" },
    visual: () => <Scale from="MΩ" to="kΩ" v="0.01" />,
    why: { "0.00001": "kΩ ist kleiner – die Zahl wird größer: · 10³.", "1": "10^(6 − 3) = 10³: drei Stellen." },
    tip: "Hochzahl vorher (M) minus Hochzahl nachher (k). Das Komma wandert nach rechts.",
    ok: "0,01 · 10³ = 10 kΩ.",
  },
  {
    say: "Bei **Flächen** zählt die Hochzahl doppelt, bei **Volumen** dreifach: 1 mm² = (10⁻³)² m² = 10⁻⁶ m².",
    ask: "1 cm² = ? m²", answer: "10⁻⁴ m²", options: ["10⁻⁴ m²", "10⁻² m²", "10⁻⁶ m²", "10² m²"],
    why: { "10⁻² m²": "Bei m² doppelt: (10⁻²)² = 10⁻⁴.", "10⁻⁶ m²": "10⁻⁶ wäre mm².", "10² m²": "cm² ist kleiner als m²." },
    ok: "1 cm² = 10⁻⁴ m².",
  },
  {
    ask: "1 mm³ = ? m³", answer: "10⁻⁹ m³", options: ["10⁻⁹ m³", "10⁻³ m³", "10⁻⁶ m³"],
    why: { "10⁻³ m³": "Bei m³ dreifach: (10⁻³)³.", "10⁻⁶ m³": "Das wäre bei m² (doppelt)." },
    ok: "1 mm³ = 10⁻⁹ m³.",
  },
  {
    say: "1 l = 1 dm³ = 10⁻³ m³, 1 ml = 1 cm³.",
    ask: "2,5 l = ? cm³", answer: 2500, num: { unit: "cm³" },
    why: { "25": "dm³ → cm³: · 10³.", "250": "Bei Volumen dreifach: · 1000." },
    tip: "1 l = 1 dm³, und dm³ → cm³ ist ein Volumenschritt.",
    ok: "2,5 l = 2500 cm³ = 2500 ml.",
  },
  {
    say: "Zeit: 1 h = 60 min = 3600 s, 1 d = 24 h.",
    ask: "1 h = ? s", answer: 3600, num: { unit: "s" },
    why: { "60": "60 sind die Minuten. Jede Minute hat 60 s.", "100": "Zeit hat keine Zehnerschritte." },
    tip: "Erst h → min, dann min → s: zweimal · 60.",
    ok: "60 · 60 = 3600 s.",
  },
  {
    say: "**Zusammengesetzte** Einheiten: Zähler und Nenner einzeln umrechnen und einsetzen: 1 km/h = 1000 m / 3600 s.",
    ask: "1 km/h = ? m/s", answer: "1/3,6", options: ["1/3,6", "3,6", "1/60", "1000"],
    why: { "3,6": "Umgekehrt: 1 m/s = 3,6 km/h.", "1/60": "1 h hat 3600 s, nicht 60.", "1000": "Der Nenner ändert sich auch: h → s." },
    ok: "1000 : 3600 = 1/3,6.",
  },
  {
    ask: "**36 km/h** = ? m/s", answer: 10, num: { unit: "m/s" },
    why: { "129.6": "km/h → m/s: geteilt durch 3,6.", "0.01": "36 : 3,6." },
    tip: "km/h → m/s: durch 3,6 teilen.",
    ok: "36 : 3,6 = 10 m/s.",
  },
  {
    say: "Nur der **Nenner** ändert sich: pro Stunde passiert 60-mal so viel wie pro Minute.",
    ask: "0,5 l/min = ? l/h", answer: 30, num: { unit: "l/h" },
    why: { "0.0083": "Pro Stunde ist es mehr, nicht weniger: · 60.", "50": "1 h = 60 min, nicht 100 min." },
    tip: "Pro Stunde passiert 60-mal so viel wie pro Minute.",
    ok: "0,5 · 60 = 30 l/h.",
  },
  {
    ask: "1 g/cm³ = ? kg/m³", answer: 1000, num: { unit: "kg/m³" },
    why: { "0.001": "1 m³ = 10⁶ cm³ – oben 10⁻³, unten 10⁻⁶: 10⁻³ / 10⁻⁶ = 10³.", "1": "Zähler und Nenner ändern sich verschieden." },
    tip: "Zähler g → kg: · 10⁻³. Nenner cm³ → m³: · 10⁻⁶. Dann teilen.",
    ok: "Wasser: 1 g/cm³ = 1000 kg/m³.",
  },
  {
    say: "Druck: 1 bar = 100 000 Pa = 100 000 N/m² = **10 N/cm²**.",
    ask: "2,5 bar = ? N/cm²", answer: 25, num: { unit: "N/cm²" },
    why: { "250000": "In N/m² wären es 250 000. 1 m² = 10 000 cm².", "2.5": "1 bar = 10 N/cm²: 2,5 · 10." },
    tip: "1 bar = 10 N/cm². Mit dem Wert malnehmen.",
    ok: "2,5 · 10 = 25 N/cm².",
  },
];

export function guideFor(stufe: "us" | "os"): GuideDef {
  return stufe === "us"
    ? { title: "Einheiten", steps: US, outro: [
      "Umrechnungszahl aus der Pfeilkette: Länge · 10, Fläche · 100, Volumen · 1000 je Schritt.",
      "Groß → klein: mal; klein → groß: geteilt. Stellenwerttafel: Komma in die neue Spalte.",
      "Vergleichen in derselben Einheit; ha, a, Liter = dm³.",
      "Zeit: 60 und 24 statt Zehnerschritte.",
    ] }
    : { title: "Einheiten", steps: OS, outro: [
      "Vorsilben als Zehnerpotenzen: 10^(vorher − nachher).",
      "Flächen doppelte, Volumen dreifache Hochzahl.",
      "Zusammengesetzt: Zähler und Nenner einzeln (km/h → m/s: : 3,6).",
      "Dichte, Druck, Durchfluss: einsetzen und ausrechnen.",
    ] };
}
