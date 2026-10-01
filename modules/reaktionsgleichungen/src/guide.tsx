// Geführte Erklärung Reaktionsgleichungen: Teilchenbild der App (Kalotten) und die einzeilige Gleichung.
// Atome zählen, Koeffizient an die richtige Stelle setzen (Stoff antippen), ausgleichen, Wortgleichung, Klammern, kürzen.

import type { GuideCtx, GuideDef, GuideStep } from "@lern/ui";
import { toSubscript, type Equation } from "@lern/chem";
import { FitLine } from "./components/Equation.tsx";
import { MoleculeScene } from "./components/Molecules.tsx";

const KNALLGAS: Equation = { left: ["H2", "O2"], right: ["H2O"] };

/** Gleichungstext: Koeffizient 1 weglassen, `null` = „?“ */
function text(eq: Equation, k: (number | null)[]) {
  const part = (fs: string[], off: number) => fs.map((f, i) => { const c = k[off + i]; return `${c === null ? "? " : c === 1 ? "" : `${c} `}${toSubscript(f)}`; }).join(" + ");
  return `${part(eq.left, 0)} → ${part(eq.right, eq.left.length)}`;
}

/** Teilchenbild und Gleichung darunter */
const Scene = ({ eq, k }: { eq: Equation; k: number[] }) => (
  <div className="rg-g">
    <div className="rg-g-scene"><MoleculeScene eq={eq} coeffs={k} /></div>
    <FitLine text={text(eq, k)} />
  </div>
);

/** nur die Gleichung (groß) */
const Line = ({ eq, k }: { eq: Equation; k: (number | null)[] }) => <div className="rg-g rg-g-only"><FitLine text={text(eq, k)} base={30} /></div>;

/** Gleichung mit antippbaren Stoffen (Ziel = Index des Stoffs als Text) */
function Pick({ c, eq, k, answer }: { c: GuideCtx; eq: Equation; k: number[]; answer: number }) {
  const all = [...eq.left, ...eq.right];
  return (
    <div className="rg-g">
      <div className="rg-g-scene"><MoleculeScene eq={eq} coeffs={k} /></div>
      <div className="rg-g-pick">
        {all.map((f, i) => (
          <span key={i} className="rg-g-term">
            {i === eq.left.length ? <span className="rg-g-op">→</span> : i > 0 ? <span className="rg-g-op">+</span> : null}
            <button type="button" className={`rg-g-sp${c.show && i === answer ? " g-sol" : ""}${c.solved && i === answer ? " right" : ""}`} onClick={() => c.pick(String(i))}>
              {k[i] > 1 && <b>{k[i]} </b>}{toSubscript(f)}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

const eqOf = (l: string[], r: string[]): Equation => ({ left: l, right: r });

const US: GuideStep[] = [
  {
    say: "**Gesetz der Massenerhaltung:** Bei einer Reaktion werden Atome nur **neu verbunden**. Keines geht verloren, keines kommt dazu.",
    ask: "Zähle die **roten** O-Atome **links** vom Pfeil. Wie viele sind es?", answer: 2, num: {},
    visual: () => <Scene eq={KNALLGAS} k={[1, 1, 1]} />,
    why: { "1": "Ein O₂-Molekül hat 2 O-Atome.", "3": "Zähle nur links vom Pfeil." },
    tip: "Ein O₂-Molekül besteht aus zwei roten Kugeln. Zähle nur links vom Pfeil.",
    labels: [{"at": ".ms-box", "text": "Edukte", "nth": 0, "point": "top", "side": "above"}, {"at": ".ms-box", "text": "Produkte", "nth": -1, "point": "top", "side": "above"}, {"at": "[data-el=\"O\"]", "text": "O-Atom", "side": "left"}],
    ok: "Links: 2 O-Atome.",
  },
  {
    ask: "Und **rechts** vom Pfeil?", answer: 1, num: {},
    visual: () => <Scene eq={KNALLGAS} k={[1, 1, 1]} />,
    why: { "2": "Rechts ist nur ein H₂O mit einem O-Atom." },
    tip: "Zähle die roten Kugeln rechts vom Pfeil.",
    labels: [{"at": ".ms-box", "text": "Edukte", "nth": 0, "point": "top", "side": "above"}, {"at": ".ms-box", "text": "Produkte", "nth": -1, "point": "top", "side": "above"}],
    ok: "Links 2 O, rechts 1 O: Die Gleichung ist **nicht ausgeglichen**.",
  },
  {
    say: "Die Formeln darf man **nie** ändern – H₂O bleibt H₂O. Man setzt **Zahlen davor** (Koeffizienten): 2 H₂O sind zwei Wasser-Moleküle.",
    ask: "Vor welchen Stoff muss eine **2**, damit rechts auch 2 O-Atome stehen? Tippe ihn an.", answer: "2",
    visual: c => <Pick c={c} eq={KNALLGAS} k={[1, 1, 1]} answer={2} />,
    why: { "0": "Vor H₂ ändert sich die Zahl der O-Atome nicht.", "1": "Links stimmt O schon. Rechts fehlt ein O." },
    tip: "Suche rechts den Stoff, der O-Atome enthält.",
    labels: [{"at": ".ms-box", "text": "Edukte", "nth": 0, "point": "top", "side": "above"}, {"at": ".ms-box", "text": "Produkte", "nth": -1, "point": "top", "side": "above"}],
    ok: "2 H₂O: rechts jetzt 2 O – aber auch 4 H.",
  },
  {
    ask: "Rechts sind jetzt **4 H**. Welche Zahl gehört vor **H₂**?", answer: 2, num: {},
    visual: () => <Scene eq={KNALLGAS} k={[1, 1, 2]} />,
    why: { "4": "Ein H₂ hat schon 2 H-Atome: 2 · 2 = 4.", "1": "Links sind dann nur 2 H." },
    tip: "Links müssen so viele H-Atome stehen wie rechts. Jedes H₂ hat zwei.",
    labels: [{"at": ".ms-box", "text": "Edukte", "nth": 0, "point": "top", "side": "above"}, {"at": ".ms-box", "text": "Produkte", "nth": -1, "point": "top", "side": "above"}, {"at": "[data-el=\"H\"]", "text": "H-Atom", "side": "left"}],
    ok: "2 H₂: links 4 H, rechts 4 H.",
  },
  {
    ask: "Ist die Gleichung jetzt ausgeglichen?", answer: "Ja – H und O stimmen", options: ["Ja – H und O stimmen", "Nein – H stimmt nicht", "Nein – O stimmt nicht"],
    visual: () => <Scene eq={KNALLGAS} k={[2, 1, 2]} />,
    why: { "Nein – H stimmt nicht": "Links 2 · 2 = 4 H, rechts 2 · 2 = 4 H.", "Nein – O stimmt nicht": "Links 2 O, rechts 2 · 1 = 2 O." },
    labels: [{"at": ".ms-box", "text": "Edukte", "nth": 0, "point": "top", "side": "above"}, {"at": ".ms-box", "text": "Produkte", "nth": -1, "point": "top", "side": "above"}],
    ok: "**2 H₂ + O₂ → 2 H₂O** – links und rechts gleich viele Atome.",
  },
  {
    say: "Die Zahl **davor** gilt für das ganze Molekül, die **kleine** Zahl nur für das Atom davor.",
    ask: "Wie viele H-Atome stecken in **3 C₃H₈**?", answer: 24, num: {},
    why: { "8": "Die 3 davor gilt für jedes Atom: 3 · 8.", "11": "Nicht addieren: 3 Moleküle mit je 8 H.", "9": "9 sind die C-Atome (3 · 3)." },
    tip: "Zahl davor mal kleine Zahl hinter dem H.",
    ok: "Koeffizient · Index: 3 · 8 = 24 H-Atome.",
  },
  {
    ask: "Ist **Fe + 2 S → FeS** ausgeglichen?", answer: "Nein – S stimmt nicht", options: ["Ja", "Nein – S stimmt nicht", "Nein – Fe stimmt nicht"],
    visual: () => <Line eq={eqOf(["Fe", "S"], ["FeS"])} k={[1, 2, 1]} />,
    why: { Ja: "Links 2 S, rechts nur 1 S.", "Nein – Fe stimmt nicht": "Fe: links 1, rechts 1 – stimmt." },
    ok: "Richtig wäre Fe + S → FeS.",
  },
  {
    ask: "Welche Zahl gehört vor **Mg**?", answer: 2, num: {},
    visual: () => <Line eq={eqOf(["Mg", "CO2"], ["MgO", "C"])} k={[null, 1, 2, 1]} />,
    why: { "1": "Rechts sind 2 Mg (in 2 MgO)." },
    tip: "Zähle die Mg-Atome rechts – die Zahl vor MgO gilt mit.",
    ok: "**2 Mg** + CO₂ → 2 MgO + C.",
  },
  {
    say: "Verbrennungen: erst C, dann H, **zuletzt O** ausgleichen.",
    ask: "Welche Zahl gehört vor **O₂**?", answer: 2, num: {},
    visual: () => <Line eq={eqOf(["CH4", "O2"], ["CO2", "H2O"])} k={[1, null, 1, 2]} />,
    why: { "4": "Rechts 4 O-Atome – das sind 2 O₂-Moleküle.", "3": "Rechts: 2 O in CO₂ + 2 O in 2 H₂O = 4 O." },
    tip: "Zähle alle O-Atome rechts. Jedes O₂ bringt zwei davon.",
    ok: "CH₄ + 2 O₂ → CO₂ + 2 H₂O.",
  },
  {
    say: "Links vom Pfeil stehen die **Edukte** (Ausgangsstoffe), rechts die **Produkte**.",
    ask: "Welche Gleichung passt zu: **Stickstoff + Wasserstoff → Ammoniak**?", answer: "N₂ + 3 H₂ → 2 NH₃",
    options: ["N₂ + 3 H₂ → 2 NH₃", "N + 3 H → NH₃", "N₂ + H₂ → NH₃", "2 NH₃ → N₂ + 3 H₂"],
    why: { "N + 3 H → NH₃": "Stickstoff und Wasserstoff kommen als Moleküle N₂ und H₂ vor.", "N₂ + H₂ → NH₃": "Nicht ausgeglichen: links 2 N, rechts 1 N.", "2 NH₃ → N₂ + 3 H₂": "Ammoniak ist das Produkt – es steht rechts." },
    ok: "Edukte N₂ und H₂, Produkt NH₃.",
  },
  {
    say: "Manchmal geht es nur mit einer **halben** Zahl: Für 3 H-Atome bräuchte man 1½ H₂.",
    ask: "Wie viele H₂ wären hier rechts nötig?", answer: "1½", options: ["1½", "3", "1", "2"],
    visual: () => <Line eq={eqOf(["Al", "HCl"], ["AlCl3", "H2"])} k={[1, 3, 1, null]} />,
    why: { "3": "3 H₂ wären 6 H-Atome – links sind nur 3.", "1": "1 H₂ hat nur 2 H-Atome.", "2": "2 H₂ wären 4 H-Atome." },
    ok: "1½ H₂ – halbe Moleküle gibt es aber nicht.",
  },
  {
    say: "Dann **verdoppelt** man alle Zahlen: 2 Al + 6 HCl → 2 AlCl₃ + ? H₂.",
    ask: "Welche Zahl gehört jetzt vor **H₂**?", answer: 3, num: {},
    visual: () => <Line eq={eqOf(["Al", "HCl"], ["AlCl3", "H2"])} k={[2, 6, 2, null]} />,
    why: { "6": "6 H₂ wären 12 H-Atome – links sind 6.", "1.5": "Verdoppelt: 2 · 1½ = 3." },
    tip: "Zähle die H-Atome links. Jedes H₂ trägt zwei davon.",
    ok: "**2 Al + 6 HCl → 2 AlCl₃ + 3 H₂**.",
  },
];

const OS: GuideStep[] = [
  {
    say: "Atome bleiben bei der Reaktion erhalten. Die Zahl davor gilt für das ganze Teilchen.",
    ask: "Wie viele O-Atome stecken in **2 Fe₂O₃**?", answer: 6, num: {},
    why: { "3": "Die 2 davor verdoppelt alles: 2 · 3.", "5": "Nicht addieren: 2 Teilchen mit je 3 O." },
    tip: "Zahl davor mal Zahl der O-Atome in einem Fe₂O₃.",
    ok: "Koeffizient · Index: 2 · 3 = 6 O-Atome.",
  },
  {
    say: "Eine Zahl hinter der **Klammer** gilt für alles in der Klammer.",
    ask: "Wie viele O-Atome stecken in **Ca(NO₃)₂**?", answer: 6, num: {},
    why: { "3": "Die 2 hinter der Klammer verdoppelt NO₃: 2 · 3.", "5": "Nicht addieren: 3 · 2." },
    tip: "Zahl hinter der Klammer mal O-Atome in einem NO₃.",
    ok: "(NO₃)₂: 2 · 3 = 6 O.",
  },
  {
    ask: "Wie viele **Ca**-Atome stecken in **3 Ca₃(PO₄)₂**?", answer: 9, num: {},
    why: { "3": "Ca₃ hat schon 3 – davor steht noch eine 3.", "6": "Die 2 gehört zur Klammer (PO₄), nicht zu Ca." },
    tip: "Zahl davor mal Index von Ca. Die Zahl hinter der Klammer gilt nur für PO₄.",
    ok: "3 · 3 = 9 Ca.",
  },
  {
    say: "Mehratomige Ionen, die erhalten bleiben (SO₄, NO₃, PO₄), zählt man als **Block** – das spart Arbeit.",
    ask: "Welche Zahl gehört vor **NaOH**?", answer: 2, num: {},
    visual: () => <Line eq={eqOf(["NaOH", "H2SO4"], ["Na2SO4", "H2O"])} k={[null, 1, 1, 2]} />,
    why: { "1": "Rechts sind 2 Na (in Na₂SO₄)." },
    tip: "Zähle die Na-Atome rechts in Na₂SO₄.",
    ok: "2 NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O.",
  },
  {
    ask: "**Fällung**: Welche Zahl gehört vor **KI**?", answer: 2, num: {},
    visual: () => <Line eq={eqOf(["Pb(NO3)2", "KI"], ["PbI2", "KNO3"])} k={[1, null, 1, 2]} />,
    why: { "1": "Rechts 2 I (in PbI₂) und 2 K (in 2 KNO₃)." },
    tip: "Zähle die I-Atome rechts in PbI₂.",
    ok: "Pb(NO₃)₂ + 2 KI → PbI₂ + 2 KNO₃ (NO₃ als Block).",
  },
  {
    ask: "Ist **CaCO₃ + HCl → CaCl₂ + H₂O + CO₂** ausgeglichen?", answer: "Nein – H und Cl stimmen nicht",
    options: ["Ja", "Nein – H und Cl stimmen nicht", "Nein – O stimmt nicht"],
    visual: () => <Line eq={eqOf(["CaCO3", "HCl"], ["CaCl2", "H2O", "CO2"])} k={[1, 1, 1, 1, 1]} />,
    why: { Ja: "Links 1 Cl, rechts 2 Cl.", "Nein – O stimmt nicht": "O: links 3, rechts 1 + 2 = 3 – stimmt." },
    ok: "H und Cl: links je 1, rechts je 2.",
  },
  {
    ask: "Welche Zahl gehört vor **HCl**?", answer: 2, num: {},
    visual: () => <Line eq={eqOf(["CaCO3", "HCl"], ["CaCl2", "H2O", "CO2"])} k={[1, null, 1, 1, 1]} />,
    why: { "1": "Rechts stehen 2 Cl in CaCl₂ – links braucht es genauso viele." },
    tip: "Zähle die Cl-Atome rechts in CaCl₂.",
    ok: "CaCO₃ + 2 HCl → CaCl₂ + H₂O + CO₂ – mit H gegenprüfen: links 2, rechts 2.",
  },
  {
    ask: "Welcher Stoff ist ein **Edukt**?", answer: "NO₂", options: ["NO₂", "HNO₃", "NO"],
    visual: () => <Line eq={eqOf(["NO2", "H2O"], ["HNO3", "NO"])} k={[3, 1, 2, 1]} />,
    why: { "HNO₃": "HNO₃ steht rechts – es ist ein Produkt.", NO: "NO steht rechts – es ist ein Produkt." },
    ok: "Edukte links: NO₂ und H₂O.",
  },
  {
    say: "Verbrennung: erst C, dann H, zuletzt O. Ergibt sich eine halbe Zahl, **alles verdoppeln**.",
    ask: "Welche Zahl gehört vor **O₂**?", answer: 7, num: {},
    visual: () => <Line eq={eqOf(["C2H6", "O2"], ["CO2", "H2O"])} k={[2, null, 4, 6]} />,
    why: { "14": "14 sind die O-Atome rechts – das sind 7 O₂.", "3.5": "Mit 2 C₂H₆ wird es ganzzahlig: 14 O-Atome = 7 O₂." },
    tip: "Zähle die O-Atome rechts in 4 CO₂ und 6 H₂O, dann durch 2 teilen.",
    ok: "2 C₂H₆ + 7 O₂ → 4 CO₂ + 6 H₂O.",
  },
  {
    say: "Große Gleichungen: Element für Element, **H und O zuletzt**, mit H gegenprüfen.",
    ask: "Welche Zahl gehört vor **H₂O**?", answer: 4, num: {},
    visual: () => <Line eq={eqOf(["Cu", "HNO3"], ["Cu(NO3)2", "NO", "H2O"])} k={[3, 8, 3, 2, null]} />,
    why: { "8": "8 sind die H-Atome links – das sind 4 H₂O.", "2": "Links 8 H → rechts 8 H = 4 H₂O." },
    tip: "Zähle die H-Atome links in 8 HNO₃. Jedes H₂O trägt zwei.",
    ok: "3 Cu + 8 HNO₃ → 3 Cu(NO₃)₂ + 2 NO + 4 H₂O.",
  },
  {
    say: "Zum Schluss **kürzen**, wenn alle Zahlen durch dieselbe Zahl teilbar sind.",
    ask: "**4 H₂ + 2 O₂ → 4 H₂O** – was ist noch zu tun?", answer: "durch 2 kürzen", options: ["durch 2 kürzen", "nichts – stimmt so", "verdoppeln"],
    why: { "nichts – stimmt so": "Ausgeglichen ja – aber 4, 2, 4 sind alle durch 2 teilbar.", verdoppeln: "Verdoppeln nur bei halben Zahlen." },
    ok: "2 H₂ + O₂ → 2 H₂O.",
  },
  {
    ask: "Welche Gleichung passt zu: **Calciumcarbonat → Calciumoxid + Kohlendioxid**?", answer: "CaCO₃ → CaO + CO₂",
    options: ["CaCO₃ → CaO + CO₂", "CaCO₃ → Ca + C + O₃", "CaCO₃ → CaO₂ + C", "CaO + CO₂ → CaCO₃"],
    why: { "CaCO₃ → Ca + C + O₃": "Es entstehen Calciumoxid und Kohlendioxid, nicht die Elemente.", "CaCO₃ → CaO₂ + C": "Calciumoxid ist CaO, Kohlendioxid CO₂.", "CaO + CO₂ → CaCO₃": "Calciumcarbonat ist das Edukt – es steht links." },
    ok: "Zerlegung: CaCO₃ → CaO + CO₂.",
  },
];

export function guideFor(stufe: "us" | "os"): GuideDef {
  return stufe === "us"
    ? { title: "Reaktionsgleichungen", steps: US, outro: [
      "Massenerhaltung: links und rechts gleich viele Atome von jeder Sorte.",
      "Formeln nie ändern – nur **Zahlen davor** setzen.",
      "Zahl davor × kleine Zahl = Atome (3 C₃H₈ → 24 H).",
      "Verbrennung: C, H, zuletzt O. Halbe Zahl → alles verdoppeln.",
      "Edukte links, Produkte rechts; Wortgleichung → Formelgleichung.",
    ] }
    : { title: "Reaktionsgleichungen", steps: OS, outro: [
      "Klammern: Zahl dahinter gilt für die ganze Gruppe (Ca(NO₃)₂ → 6 O).",
      "Mehratomige Ionen als Block ausgleichen (Salze, Säuren, Fällung).",
      "Verbrennung und große Gleichungen: H und O zuletzt, mit H prüfen.",
      "Halbe Zahlen verdoppeln, am Ende kürzen.",
    ] };
}
