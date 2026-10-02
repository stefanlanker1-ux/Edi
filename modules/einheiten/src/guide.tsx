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
import { tr } from "@lern/i18n";

const Box = ({ children }: { children: ReactNode }) => <div className="eh-g">{children}</div>;
/** Pfeilkette nur mit den Schritten (ohne Ergebniszeile) – die Rechnung macht der Schüler */
const Chain = ({ from, to }: { from: string; to: string }) => <Box><ArrowChain from={from} to={to} value={null} showValues={false} caption={false} /></Box>;
const Table = ({ from, to, v }: { from: string; to: string; v: string }) =>
  <Box><PlaceValueTable value={parseQ(v)!} from={from} to={to} units={tableFor(from, to)!} showResult={false} label={`${v} ${from} → ${to}`} /></Box>;
const Scale = ({ from, to, v }: { from: string; to: string; v?: string }) => <Box><PowerScale from={from} to={to} value={v ? parseQ(v) : null} showResult={false} showFactor={false} /></Box>;

const US: GuideStep[] = [
  {
    part: tr("Längen", "Lengths"),
    say: tr("Längen in Nachbarschritten: km → m: · 1000, m → dm → cm → mm: je · 10. Die Pfeilkette zeigt den Weg.", "Lengths in neighbouring steps: km → m: · 1000, m → dm → cm → mm: · 10 each. The arrow chain shows the way."),
    ask: tr("Setze die **Umrechnungszahl** ein: 1 m = ? cm", "Fill in the **conversion factor**: 1 m = ? cm"), answer: 100, num: { unit: "cm" },
    visual: () => <Chain from="m" to="cm" />,
    why: { "10": tr("m → dm → cm: zwei Schritte mit je · 10.", "m → dm → cm: two steps of · 10 each."), "1000": tr("1000 wäre km → m.", "1000 would be km → m.") },
    tip: tr("Zähle in der Pfeilkette die Schritte von m bis cm. Jeder Schritt ist · 10.", "Count the steps from m to cm on the arrow chain. Each step is · 10."),
    ok: tr("1 m = 100 cm (· 10 · 10).", "1 m = 100 cm (· 10 · 10)."),
  },
  {
    say: tr("Von der **großen** zur **kleinen** Einheit wird die Zahl größer: **mal**. Von klein zu groß: **geteilt**.", "From the **large** to the **small** unit the number gets bigger: **multiply**. From small to large: **divide**."),
    ask: tr("Du rechnest **7,5 cm** in **mm** um. Wie rechnest du?", "You convert **7.5 cm** to **mm**. What do you do?"), answer: "· 10", options: ["· 10", tr(": 10", "÷ 10"), "· 100", tr(": 100", "÷ 100")],
    visual: () => <Chain from="cm" to="mm" />,
    why: { [tr(": 10", "÷ 10")]: tr("mm ist kleiner als cm – es werden mehr: mal.", "mm is smaller than cm – you get more: multiply."), "· 100": tr("cm → mm ist nur ein Schritt.", "cm → mm is only one step."), [tr(": 100", "÷ 100")]: tr("Kleinere Einheit → mehr Stück: mal.", "Smaller unit → more of them: multiply.") },
    ok: tr("cm → mm: · 10.", "cm → mm: · 10."),
  },
  {
    say: tr("In der **Stellenwerttafel** steht die Einerziffer in der Spalte der Einheit. Umrechnen heißt: das Komma in die neue Spalte setzen.", "In the **place value chart** the ones digit sits in the column of the unit. Converting means moving the decimal point to the new column."),
    ask: tr("7,5 cm = ? mm", "7.5 cm = ? mm"), answer: 75, num: { unit: "mm" },
    visual: () => <Table from="cm" to="mm" v="7.5" />,
    why: { "750": tr("Nur ein Schritt (· 10): 7,5 · 10.", "Only one step (· 10): 7.5 · 10."), "0.75": tr("mm ist kleiner – die Zahl wird größer.", "mm is smaller – the number gets bigger.") },
    tip: tr("cm → mm ist ein Schritt: Komma eine Stelle nach rechts.", "cm → mm is one step: decimal point one place to the right."),
    ok: tr("Ein Schritt nach rechts: Komma eine Stelle weiter – 7,5 cm = 75 mm.", "One step to the right: decimal point one place on – 7.5 cm = 75 mm."),
  },
  {
    part: tr("Masse und Hohlmaße", "Mass and capacity"),
    say: tr("Massen: t → kg: · 1000, kg → dag: · 100, dag → g: · 10.", "Masses: t → kg: · 1000, kg → dag: · 100, dag → g: · 10."),
    ask: tr("0,3 kg = ? dag", "0.3 kg = ? dag"), answer: 30, num: { unit: "dag" },
    visual: () => <Table from="kg" to="dag" v="0.3" />,
    why: { "3": tr("kg → dag ist · 100, nicht · 10.", "kg → dag is · 100, not · 10."), "300": tr("300 wäre in g (· 1000).", "300 would be in g (· 1000).") },
    tip: tr("kg → dag ist · 100: Komma zwei Stellen nach rechts.", "kg → dag is · 100: decimal point two places to the right."),
    ok: tr("0,3 kg = 30 dag.", "0.3 kg = 30 dag."),
  },
  {
    say: tr("Hohlmaße: hl → l: · 100, l → dl → cl → ml: je · 10.", "Capacity: hl → l: · 100, l → dl → cl → ml: · 10 each."),
    ask: tr("1 l = ? ml", "1 l = ? ml"), answer: 1000, num: { unit: "ml" },
    visual: () => <Chain from="l" to="ml" />,
    why: { "100": tr("l → dl → cl → ml: drei Schritte · 10.", "l → dl → cl → ml: three steps of · 10."), "10": tr("Das ist nur l → dl.", "That is only l → dl.") },
    tip: tr("Zähle die Schritte l → dl → cl → ml. Jeder ist · 10.", "Count the steps l → dl → cl → ml. Each is · 10."),
    ok: tr("1 l = 1000 ml.", "1 l = 1000 ml."),
  },
  {
    say: tr("Zum **Vergleichen** beide Angaben in **dieselbe** Einheit umrechnen.", "To **compare**, convert both to the **same** unit."),
    ask: tr("Was ist mehr: **1,2 cm** oder **10,8 mm**?", "Which is more: **1.2 cm** or **10.8 mm**?"), answer: tr("1,2 cm", "1.2 cm"), options: [tr("1,2 cm", "1.2 cm"), tr("10,8 mm", "10.8 mm"), tr("gleich viel", "the same")],
    why: { [tr("10,8 mm", "10.8 mm")]: tr("1,2 cm = 12 mm – das ist mehr als 10,8 mm.", "1.2 cm = 12 mm – that is more than 10.8 mm."), [tr("gleich viel", "the same")]: tr("1,2 cm = 12 mm, nicht 10,8 mm.", "1.2 cm = 12 mm, not 10.8 mm.") },
    ok: tr("1,2 cm = 12 mm > 10,8 mm.", "1.2 cm = 12 mm > 10.8 mm."),
  },
  {
    part: tr("Fläche und Volumen", "Area and volume"),
    say: tr("Ein Quadrat mit 1 dm Seitenlänge hat **1 dm²**. 1 dm = 10 cm.", "A square with sides of 1 dm has **1 dm²**. 1 dm = 10 cm."),
    ask: tr("Wie viele **cm²**-Kästchen passen in **1 dm²**? Schätze!", "How many **cm²** squares fit into **1 dm²**? Estimate!"), answer: "100", options: ["10", "100", "1000"],
    visual: c => <Box><AreaGrid big="dm²" small="cm²" guess={!c.solved} /></Box>,
    why: { "10": tr("10 Kästchen füllen nur die erste Reihe. Es gibt 10 Reihen.", "10 squares only fill the first row. There are 10 rows."), "1000": tr("1000 kleine Würfel passen in einen Würfel – beim Quadrat sind es 10 · 10.", "1000 small cubes fit in a cube – a square holds 10 · 10.") },
    ok: tr("10 Reihen mit je 10 Kästchen: 1 dm² = **100 cm²**.", "10 rows of 10 squares: 1 dm² = **100 cm²**."),
    hold: true,
  },
  {
    say: tr("**Fläche** = Länge · Länge. Darum sind Flächen-Nachbarn **· 100** voneinander entfernt.", "**Area** = length · length. So area neighbours are **· 100** apart."),
    ask: "1 m² = ? dm²", answer: 100, num: { unit: "dm²" },
    visual: () => <Box><AreaGrid big="dm²" small="cm²" /></Box>,
    why: { "10": tr("Ein Quadrat 10 × 10 hat 100 kleine Quadrate.", "A 10 × 10 square has 100 small squares."), "1000": tr("1000 ist der Schritt bei Volumen.", "1000 is the step for volumes.") },
    tip: tr("Ein Flächenschritt ist 10 · 10.", "An area step is 10 · 10."),
    ok: tr("Flächen-Nachbarn: · 100. 1 m² = 100 dm².", "Area neighbours: · 100. 1 m² = 100 dm²."),
  },
  {
    say: tr("1 **ha** = 100 a, 1 **a** = 100 m².", "1 **ha** = 100 a, 1 **a** = 100 m²."),
    ask: "3 a = ? m²", answer: 300, num: { unit: "m²" },
    visual: () => <Box><DimChain from="a" to="m²" /></Box>,
    why: { "30": tr("Flächen-Schritt: · 100.", "Area step: · 100."), "3000": tr("a → m² ist ein Flächenschritt: · 100.", "a → m² is one area step: · 100.") },
    tip: tr("a → m² ist ein Flächenschritt.", "a → m² is one area step."),
    ok: "3 a = 300 m².",
  },
  {
    say: tr("**Volumen** = Länge · Länge · Länge: 1 dm³ = 10 · 10 · 10 = **1000 cm³**. Volumen-Nachbarn: **· 1000**.", "**Volume** = length · length · length: 1 dm³ = 10 · 10 · 10 = **1000 cm³**. Volume neighbours: **· 1000**."),
    ask: "1 m³ = ? dm³", answer: 1000, num: { unit: "dm³" },
    visual: () => <Box><Cube big="dm³" small="cm³" /></Box>,
    why: { "100": tr("100 ist der Schritt bei Flächen. Ein Würfel: 10 · 10 · 10.", "100 is the step for areas. A cube: 10 · 10 · 10."), "10": tr("10 ist der Schritt bei Längen.", "10 is the step for lengths.") },
    tip: tr("Ein Volumenschritt ist 10 · 10 · 10.", "A volume step is 10 · 10 · 10."),
    ok: tr("Volumen-Nachbarn: · 1000. 1 m³ = 1000 dm³.", "Volume neighbours: · 1000. 1 m³ = 1000 dm³."),
  },
  {
    say: "**1 l = 1 dm³**, **1 ml = 1 cm³**.",
    ask: tr("0,5 l = ? cm³", "0.5 l = ? cm³"), answer: 500, num: { unit: "cm³" },
    why: { "50": tr("0,5 l = 0,5 dm³ = 500 cm³ (· 1000).", "0.5 l = 0.5 dm³ = 500 cm³ (· 1000)."), "5": tr("dm³ → cm³: · 1000.", "dm³ → cm³: · 1000.") },
    tip: tr("Erst l = dm³, dann dm³ → cm³: ein Volumenschritt.", "First l = dm³, then dm³ → cm³: one volume step."),
    ok: tr("0,5 l = 500 ml = 500 cm³.", "0.5 l = 500 ml = 500 cm³."),
  },
  {
    say: tr("Größenvorstellung hilft beim Prüfen.", "A sense of size helps you check."),
    ask: tr("Welche Einheit passt? Eine **Briefmarke** hat etwa 6 ▢.", "Which unit fits? A **postage stamp** has about 6 ▢."), answer: "cm²", options: ["cm²", "mm²", "dm²", "m²"],
    why: { "mm²": tr("6 mm² wäre kleiner als ein Stecknadelkopf.", "6 mm² would be smaller than a pinhead."), "dm²": tr("6 dm² wäre so groß wie ein Heft.", "6 dm² would be as big as an exercise book."), "m²": tr("6 m² ist ein kleines Zimmer.", "6 m² is a small room.") },
    ok: tr("Etwa 2 cm × 3 cm = 6 cm².", "About 2 cm × 3 cm = 6 cm²."),
  },
  {
    part: tr("Zeit", "Time"),
    say: tr("Zeit geht **nicht** in Zehnerschritten: 1 h = **60** min, 1 min = 60 s, 1 d = 24 h.", "Time does **not** go in steps of ten: 1 h = **60** min, 1 min = 60 s, 1 d = 24 h."),
    ask: tr("1,5 h = ? min", "1.5 h = ? min"), answer: 90, num: { unit: "min" },
    visual: () => <Box><Clock big="h" small="min" /></Box>,
    why: { "15": tr("Keine Zehnerschritte: 1,5 · 60.", "No steps of ten: 1.5 · 60."), "150": tr("1 h = 60 min, nicht 100 min.", "1 h = 60 min, not 100 min.") },
    tip: tr("Jede Stunde hat 60 Minuten: Stunden · 60.", "Every hour has 60 minutes: hours · 60."),
    ok: tr("1,5 h = 90 min.", "1.5 h = 90 min."),
  },
  {
    ask: tr("Was dauert länger: **2,5 h** oder **150 min**?", "Which takes longer: **2.5 h** or **150 min**?"), answer: tr("gleich lang", "the same"), options: [tr("2,5 h", "2.5 h"), "150 min", tr("gleich lang", "the same")],
    why: { [tr("2,5 h", "2.5 h")]: tr("2,5 · 60 = 150 min.", "2.5 · 60 = 150 min."), "150 min": tr("150 : 60 = 2,5 h.", "150 ÷ 60 = 2.5 h.") },
    ok: tr("2,5 h = 150 min.", "2.5 h = 150 min."),
  },
];

const OS: GuideStep[] = [
  {
    part: tr("Vorsilben", "Prefixes"),
    say: tr("**Vorsilben** sind Zehnerpotenzen: G 10⁹, M 10⁶, k 10³, d 10⁻¹, c 10⁻², m 10⁻³, µ 10⁻⁶, n 10⁻⁹.", "**Prefixes** are powers of ten: G 10⁹, M 10⁶, k 10³, d 10⁻¹, c 10⁻², m 10⁻³, µ 10⁻⁶, n 10⁻⁹."),
    ask: tr("Welche Zehnerpotenz steht für **m** (Milli)?", "Which power of ten stands for **m** (milli)?"), answer: "10⁻³", options: ["10⁻³", "10³", "10⁻⁶", "10⁻²"],
    visual: () => <Scale from="mm" to="m" />,
    why: { "10³": tr("10³ ist k (Kilo).", "10³ is k (kilo)."), "10⁻⁶": tr("10⁻⁶ ist µ (Mikro).", "10⁻⁶ is µ (micro)."), "10⁻²": tr("10⁻² ist c (Zenti).", "10⁻² is c (centi).") },
    ok: tr("1 mm = 10⁻³ m.", "1 mm = 10⁻³ m."),
  },
  {
    say: tr("Umrechnungszahl = 10^(Hochzahl **vorher** − Hochzahl **nachher**).", "Conversion factor = 10^(exponent **before** − exponent **after**)."),
    ask: tr("1 nm = ? cm", "1 nm = ? cm"), answer: "10⁻⁷ cm", options: ["10⁻⁷ cm", "10⁷ cm", "10⁻¹¹ cm", "10⁻⁹ cm"],
    visual: () => <Scale from="nm" to="cm" />,
    why: { "10⁷ cm": tr("Vorher −9, nachher −2: −9 − (−2) = −7.", "Before −9, after −2: −9 − (−2) = −7."), "10⁻¹¹ cm": tr("Abziehen, nicht addieren: −9 − (−2).", "Subtract, don't add: −9 − (−2)."), "10⁻⁹ cm": tr("10⁻⁹ wäre in m. In cm: −9 − (−2).", "10⁻⁹ would be in m. In cm: −9 − (−2).") },
    ok: tr("1 nm = 10⁻⁷ cm.", "1 nm = 10⁻⁷ cm."),
  },
  {
    ask: tr("250 MHz = ? GHz", "250 MHz = ? GHz"), answer: 0.25, num: { unit: "GHz" },
    visual: () => <Scale from="MHz" to="GHz" v="250" />,
    why: { "250000": tr("GHz ist größer – die Zahl wird kleiner: 250 · 10⁻³.", "GHz is larger – the number gets smaller: 250 · 10⁻³."), "2.5": tr("10^(6 − 9) = 10⁻³: drei Stellen.", "10^(6 − 9) = 10⁻³: three places.") },
    tip: tr("Hochzahl vorher (M) minus Hochzahl nachher (G). Das Komma wandert nach links.", "Exponent before (M) minus exponent after (G). The decimal point moves left."),
    ok: tr("250 · 10⁻³ = 0,25 GHz.", "250 · 10⁻³ = 0.25 GHz."),
  },
  {
    ask: tr("0,01 MΩ = ? kΩ", "0.01 MΩ = ? kΩ"), answer: 10, num: { unit: "kΩ" },
    visual: () => <Scale from="MΩ" to="kΩ" v="0.01" />,
    why: { "0.00001": tr("kΩ ist kleiner – die Zahl wird größer: · 10³.", "kΩ is smaller – the number gets bigger: · 10³."), "1": tr("10^(6 − 3) = 10³: drei Stellen.", "10^(6 − 3) = 10³: three places.") },
    tip: tr("Hochzahl vorher (M) minus Hochzahl nachher (k). Das Komma wandert nach rechts.", "Exponent before (M) minus exponent after (k). The decimal point moves right."),
    ok: tr("0,01 · 10³ = 10 kΩ.", "0.01 · 10³ = 10 kΩ."),
  },
  {
    part: tr("Flächen und Volumen", "Areas and volumes"),
    say: tr("Bei **Flächen** zählt die Hochzahl doppelt, bei **Volumen** dreifach: 1 mm² = (10⁻³)² m² = 10⁻⁶ m².", "For **areas** the exponent counts twice, for **volumes** three times: 1 mm² = (10⁻³)² m² = 10⁻⁶ m²."),
    ask: tr("1 cm² = ? m²", "1 cm² = ? m²"), answer: "10⁻⁴ m²", options: ["10⁻⁴ m²", "10⁻² m²", "10⁻⁶ m²", "10² m²"],
    why: { "10⁻² m²": tr("Bei m² doppelt: (10⁻²)² = 10⁻⁴.", "For m² twice: (10⁻²)² = 10⁻⁴."), "10⁻⁶ m²": tr("10⁻⁶ wäre mm².", "10⁻⁶ would be mm²."), "10² m²": tr("cm² ist kleiner als m².", "cm² is smaller than m².") },
    ok: tr("1 cm² = 10⁻⁴ m².", "1 cm² = 10⁻⁴ m²."),
  },
  {
    ask: tr("1 mm³ = ? m³", "1 mm³ = ? m³"), answer: "10⁻⁹ m³", options: ["10⁻⁹ m³", "10⁻³ m³", "10⁻⁶ m³"],
    why: { "10⁻³ m³": tr("Bei m³ dreifach: (10⁻³)³.", "For m³ three times: (10⁻³)³."), "10⁻⁶ m³": tr("Das wäre bei m² (doppelt).", "That would be for m² (twice).") },
    ok: tr("1 mm³ = 10⁻⁹ m³.", "1 mm³ = 10⁻⁹ m³."),
  },
  {
    say: tr("1 l = 1 dm³ = 10⁻³ m³, 1 ml = 1 cm³.", "1 l = 1 dm³ = 10⁻³ m³, 1 ml = 1 cm³."),
    ask: tr("2,5 l = ? cm³", "2.5 l = ? cm³"), answer: 2500, num: { unit: "cm³" },
    why: { "25": tr("dm³ → cm³: · 10³.", "dm³ → cm³: · 10³."), "250": tr("Bei Volumen dreifach: · 1000.", "For volumes three times: · 1000.") },
    tip: tr("1 l = 1 dm³, und dm³ → cm³ ist ein Volumenschritt.", "1 l = 1 dm³, and dm³ → cm³ is one volume step."),
    ok: tr("2,5 l = 2500 cm³ = 2500 ml.", "2.5 l = 2500 cm³ = 2500 ml."),
  },
  {
    part: tr("Zeit und zusammengesetzte Einheiten", "Time and derived units"),
    say: tr("Zeit: 1 h = 60 min = 3600 s, 1 d = 24 h.", "Time: 1 h = 60 min = 3600 s, 1 d = 24 h."),
    ask: tr("1 h = ? s", "1 h = ? s"), answer: 3600, num: { unit: "s" },
    why: { "60": tr("60 sind die Minuten. Jede Minute hat 60 s.", "60 are the minutes. Each minute has 60 s."), "100": tr("Zeit hat keine Zehnerschritte.", "Time has no steps of ten.") },
    tip: tr("Erst h → min, dann min → s: zweimal · 60.", "First h → min, then min → s: · 60 twice."),
    ok: tr("60 · 60 = 3600 s.", "60 · 60 = 3600 s."),
  },
  {
    say: tr("**Zusammengesetzte** Einheiten: Zähler und Nenner einzeln umrechnen und einsetzen: 1 km/h = 1000 m / 3600 s.", "**Derived** units: convert numerator and denominator separately and substitute: 1 km/h = 1000 m / 3600 s."),
    ask: tr("1 km/h = ? m/s", "1 km/h = ? m/s"), answer: tr("1/3,6", "1/3.6"), options: [tr("1/3,6", "1/3.6"), tr("3,6", "3.6"), "1/60", "1000"],
    why: { [tr("3,6", "3.6")]: tr("Umgekehrt: 1 m/s = 3,6 km/h.", "The other way round: 1 m/s = 3.6 km/h."), "1/60": tr("1 h hat 3600 s, nicht 60.", "1 h has 3600 s, not 60."), "1000": tr("Der Nenner ändert sich auch: h → s.", "The denominator changes too: h → s.") },
    ok: tr("1000 : 3600 = 1/3,6.", "1000 ÷ 3600 = 1/3.6."),
  },
  {
    ask: tr("**36 km/h** = ? m/s", "**36 km/h** = ? m/s"), answer: 10, num: { unit: "m/s" },
    why: { "129.6": tr("km/h → m/s: geteilt durch 3,6.", "km/h → m/s: divided by 3.6."), "0.01": tr("36 : 3,6.", "36 ÷ 3.6.") },
    tip: tr("km/h → m/s: durch 3,6 teilen.", "km/h → m/s: divide by 3.6."),
    ok: tr("36 : 3,6 = 10 m/s.", "36 ÷ 3.6 = 10 m/s."),
  },
  {
    say: tr("Nur der **Nenner** ändert sich: pro Stunde passiert 60-mal so viel wie pro Minute.", "Only the **denominator** changes: per hour is 60 times as much as per minute."),
    ask: tr("0,5 l/min = ? l/h", "0.5 l/min = ? l/h"), answer: 30, num: { unit: "l/h" },
    why: { "0.0083": tr("Pro Stunde ist es mehr, nicht weniger: · 60.", "Per hour it is more, not less: · 60."), "50": tr("1 h = 60 min, nicht 100 min.", "1 h = 60 min, not 100 min.") },
    tip: tr("Pro Stunde passiert 60-mal so viel wie pro Minute.", "Per hour is 60 times as much as per minute."),
    ok: tr("0,5 · 60 = 30 l/h.", "0.5 · 60 = 30 l/h."),
  },
  {
    ask: tr("1 g/cm³ = ? kg/m³", "1 g/cm³ = ? kg/m³"), answer: 1000, num: { unit: "kg/m³" },
    why: { "0.001": tr("1 m³ = 10⁶ cm³ – oben 10⁻³, unten 10⁻⁶: 10⁻³ / 10⁻⁶ = 10³.", "1 m³ = 10⁶ cm³ – top 10⁻³, bottom 10⁻⁶: 10⁻³ / 10⁻⁶ = 10³."), "1": tr("Zähler und Nenner ändern sich verschieden.", "Numerator and denominator change differently.") },
    tip: tr("Zähler g → kg: · 10⁻³. Nenner cm³ → m³: · 10⁻⁶. Dann teilen.", "Numerator g → kg: · 10⁻³. Denominator cm³ → m³: · 10⁻⁶. Then divide."),
    ok: tr("Wasser: 1 g/cm³ = 1000 kg/m³.", "Water: 1 g/cm³ = 1000 kg/m³."),
  },
  {
    say: tr("Druck: 1 bar = 100 000 Pa = 100 000 N/m² = **10 N/cm²**.", "Pressure: 1 bar = 100 000 Pa = 100 000 N/m² = **10 N/cm²**."),
    ask: tr("2,5 bar = ? N/cm²", "2.5 bar = ? N/cm²"), answer: 25, num: { unit: "N/cm²" },
    why: { "250000": tr("In N/m² wären es 250 000. 1 m² = 10 000 cm².", "In N/m² it would be 250 000. 1 m² = 10 000 cm²."), "2.5": tr("1 bar = 10 N/cm²: 2,5 · 10.", "1 bar = 10 N/cm²: 2.5 · 10.") },
    tip: tr("1 bar = 10 N/cm². Mit dem Wert malnehmen.", "1 bar = 10 N/cm². Multiply by the value."),
    ok: tr("2,5 · 10 = 25 N/cm².", "2.5 · 10 = 25 N/cm²."),
  },
];

export function guideFor(stufe: "us" | "os"): GuideDef {
  return stufe === "us"
    ? { title: tr("Einheiten", "Units"), steps: US, outro: [
      tr("Umrechnungszahl aus der Pfeilkette: Länge · 10, Fläche · 100, Volumen · 1000 je Schritt.", "Conversion factor from the arrow chain: length · 10, area · 100, volume · 1000 per step."),
      tr("Groß → klein: mal; klein → groß: geteilt. Stellenwerttafel: Komma in die neue Spalte.", "Large → small: multiply; small → large: divide. Place value chart: decimal point into the new column."),
      tr("Vergleichen in derselben Einheit; ha, a, Liter = dm³.", "Compare in the same unit; ha, a, litre = dm³."),
      tr("Zeit: 60 und 24 statt Zehnerschritte.", "Time: 60 and 24 instead of steps of ten."),
    ] }
    : { title: tr("Einheiten", "Units"), steps: OS, outro: [
      tr("Vorsilben als Zehnerpotenzen: 10^(vorher − nachher).", "Prefixes as powers of ten: 10^(before − after)."),
      tr("Flächen doppelte, Volumen dreifache Hochzahl.", "Areas double, volumes triple the exponent."),
      tr("Zusammengesetzt: Zähler und Nenner einzeln (km/h → m/s: : 3,6).", "Derived: numerator and denominator separately (km/h → m/s: ÷ 3.6)."),
      tr("Dichte, Druck, Durchfluss: einsetzen und ausrechnen.", "Density, pressure, flow: substitute and calculate."),
    ] };
}
