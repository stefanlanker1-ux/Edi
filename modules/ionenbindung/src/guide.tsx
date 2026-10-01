// Geführte Erklärung Ionenbindung: Ionen aus dem PSE ableiten, mit der Ionenwand (Breite = Ladung) ausgleichen,
// Formel und Name ablesen. Jeder Schritt verlangt eine Handlung; deckt die Quiz-Aufgaben der Stufe ab.

import { Fit, type GuideCtx, type GuideDef, type GuideStep } from "@lern/ui";
import { ION_BY_ID } from "@lern/chem";
import { PeriodicTable } from "@lern/chem-ui";
import { IonWall } from "./components/IonWall.tsx";
import { IonLabel } from "./components/IonTile.tsx";

const ion = (id: string) => ION_BY_ID[id];

/** Ionenwand mit zwei Bausteinen darunter: „noch ein Kation“ / „noch ein Anion“ (Ziele "C" und "A") */
function Wall({ c, cat, an, nC, nA, target, formula = false }: { c: GuideCtx; cat: string; an: string; nC: number; nA: number; target?: "C" | "A"; formula?: boolean }) {
  const ci = ion(cat), ai = ion(an);
  return (
    <div className="ib-g">
      <Fit className="ib-g-wall" min={0.3}><IonWall cation={ci} anion={ai} nC={nC} nA={nA} showFormula={formula} showName={false} /></Fit>
      {target && (
        <div className="ib-g-add">
          {([["C", ci], ["A", ai]] as const).map(([id, i]) => (
            <button key={id} type="button" className={`ib-g-btn ${id === "C" ? "cation" : "anion"}${c.show && target === id ? " g-sol" : ""}`} onClick={() => c.pick(id)}>
              + <IonLabel ion={i} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const Pse = ({ mark }: { mark: number }) => (
  <div className="pse-fit"><PeriodicTable stufe="us" fit disabled cellState={Z => (Z === mark ? "sel" : undefined)} /></div>
);

/** Ionenwand-Schritt: welcher Baustein fehlt noch? */
const missing = (cat: string, an: string, nC: number, nA: number, answer: "C" | "A", say: string, ok: string): GuideStep => ({
  say, ask: "Welcher Baustein fehlt, damit beide Reihen **gleich lang** sind? Tippe ihn an.", answer,
  visual: c => <Wall c={c} cat={cat} an={an} nC={nC} nA={nA} target={answer} />,
  why: { [answer === "C" ? "A" : "C"]: "Dann wird die andere Reihe noch länger. Vergleiche die Breiten." },
  ok,
});

const US: GuideStep[] = [
  {
    say: "**Metalle** geben Außenelektronen ab → positive Ionen (**Kationen**). Die Ladung = Hauptgruppe (I, II, III).",
    ask: "Welches Ion bildet **Magnesium** (II. Hauptgruppe)?", answer: "Mg²⁺", options: ["Mg²⁺", "Mg²⁻", "Mg⁺", "Mg⁶⁻"],
    visual: () => <Pse mark={12} />,
    why: { "Mg²⁻": "Metalle geben Elektronen ab – sie werden positiv.", "Mg⁺": "Magnesium hat 2 Außenelektronen – beide gehen weg.", "Mg⁶⁻": "6 aufnehmen ist viel mehr als 2 abgeben." },
    ok: "Mg gibt 2 Elektronen ab → **Mg²⁺**.",
  },
  {
    say: "**Nichtmetalle** nehmen Elektronen auf, bis 8 außen sind → negative Ionen (**Anionen**): 8 − Hauptgruppe.",
    ask: "Wie viele Elektronen nimmt ein **Sauerstoff**-Atom (VI. Hauptgruppe) auf?", answer: 2, num: {},
    visual: () => <Pse mark={8} />,
    why: { "6": "6 hat es schon außen. Bis 8 fehlen 8 − 6.", "8": "Es fehlen nur so viele, bis 8 außen sind." },
    ok: "8 − 6 = 2 → Oxid-Ion **O²⁻**.",
  },
  {
    ask: "Welches Ion bildet **Stickstoff** (V. Hauptgruppe)?", answer: "N³⁻", options: ["N³⁻", "N⁵⁺", "N³⁺", "N⁵⁻"],
    visual: () => <Pse mark={7} />,
    why: { "N⁵⁺": "Nichtmetalle nehmen auf – 3 aufnehmen ist leichter als 5 abgeben.", "N³⁺": "Aufnehmen macht negativ.", "N⁵⁻": "Es fehlen 8 − 5 = 3 Elektronen." },
    ok: "Nitrid-Ion **N³⁻**.",
  },
  missing("Ca2+", "Cl-", 1, 1, "A",
    "Eine Ionenverbindung ist **neutral**: Plus und Minus gleichen sich aus. In der Ionenwand ist die **Breite = Ladung**.",
    "1 · 2+ = 2+ und 2 · 1− = 2−: ausgeglichen."),
  {
    say: "Die Anzahlen werden zu **tiefgestellten Zahlen** hinter dem Symbol. Eine 1 schreibt man nicht.",
    ask: "Welche Formel hat diese Verbindung?", answer: "CaCl₂", options: ["CaCl₂", "Ca₂Cl", "CaCl", "Ca₂Cl₂"],
    visual: c => <Wall c={c} cat="Ca2+" an="Cl-" nC={1} nA={2} />,
    why: { "Ca₂Cl": "1 Calcium-Ion, 2 Chlorid-Ionen – die 2 gehört zum Cl.", CaCl: "So wäre es nicht neutral: 2+ und 1−.", "Ca₂Cl₂": "Man kürzt auf das kleinste Verhältnis 1 : 2." },
    ok: "**CaCl₂**: Calciumchlorid.",
  },
  missing("Al3+", "O2-", 2, 2, "A",
    "Manchmal braucht man von beiden Ionen mehrere: hier 2 · 3+ = 6+, aber erst 2 · 2− = 4−.",
    "2 · 3+ = 6+ und 3 · 2− = 6−: ausgeglichen."),
  {
    ask: "Welche Formel hat diese Verbindung?", answer: "Al₂O₃", options: ["Al₂O₃", "AlO", "Al₃O₂", "Al₂O₂"],
    visual: c => <Wall c={c} cat="Al3+" an="O2-" nC={2} nA={3} />,
    why: { AlO: "3+ und 2− gleichen sich nicht aus.", "Al₃O₂": "Zähle: 2 Aluminium-Ionen, 3 Oxid-Ionen.", "Al₂O₂": "2 · 3+ = 6+, aber 2 · 2− = 4−." },
    ok: "**Al₂O₃**: Aluminiumoxid.",
  },
  {
    ask: "Aus **K⁺** und **S²⁻**: Wie viele Kalium-Ionen braucht man für ein Sulfid-Ion?", answer: 2, num: {},
    visual: c => <Wall c={c} cat="K+" an="S2-" nC={1} nA={1} />,
    why: { "1": "1 · 1+ gleicht 2− nicht aus." },
    ok: "2 K⁺ gleichen 1 S²⁻ aus → **K₂S**.",
  },
  {
    say: "Name: Metall + Wortstamm des Nichtmetalls + **-id**: Chlor → Chlor**id**, Sauerstoff → **Oxid**, Schwefel → **Sulfid**, Stickstoff → **Nitrid**.",
    ask: "Wie heißt **MgO**?", answer: "Magnesiumoxid", options: ["Magnesiumoxid", "Magnesiumsauerstoff", "Magnesiumsulfid"],
    why: { Magnesiumsauerstoff: "Das Anion heißt nach dem Wortstamm mit -id: Oxid.", Magnesiumsulfid: "Sulfid kommt von Schwefel (S). O ist Sauerstoff." },
    ok: "MgO = Magnesiumoxid.",
  },
  {
    ask: "Wie heißt **Na₂S**?", answer: "Natriumsulfid", options: ["Natriumsulfid", "Dinatriumsulfid", "Natriumschwefel"],
    why: { Dinatriumsulfid: "Bei Ionenverbindungen nennt man keine Anzahl – sie folgt aus den Ladungen.", Natriumschwefel: "Das Anion bekommt -id: Sulfid." },
    ok: "Na₂S = Natriumsulfid (2 Na⁺ für 1 S²⁻).",
  },
  {
    ask: "Welche Formel hat **Calciumbromid**?", answer: "CaBr₂", options: ["CaBr₂", "CaBr", "Ca₂Br", "CaBr₃"],
    visual: () => <Pse mark={20} />,
    why: { CaBr: "Ca²⁺ braucht zwei Br⁻.", "Ca₂Br": "Es braucht mehr Bromid-Ionen, nicht mehr Calcium-Ionen.", "CaBr₃": "Ca²⁺ hat nur 2+ – zwei Br⁻ reichen." },
    ok: "Ca²⁺ + 2 Br⁻ → **CaBr₂**.",
  },
  {
    say: "Im Feststoff liegen sehr viele Ionen abwechselnd im **Ionengitter**. Die Formel nennt nur das **Verhältnis**.",
    ask: "Was bedeutet **CaCl₂**?", answer: "Auf 1 Ca²⁺ kommen 2 Cl⁻.",
    options: ["Auf 1 Ca²⁺ kommen 2 Cl⁻.", "Ein Molekül aus 3 Atomen.", "Calcium und Chlor gemischt."],
    why: { "Ein Molekül aus 3 Atomen.": "Ionenverbindungen bilden keine Moleküle, sondern ein Gitter.", "Calcium und Chlor gemischt.": "Es sind Ionen, fest im Gitter gebunden – kein Gemisch." },
    ok: "Ionengitter: immer 2 Cl⁻ je Ca²⁺.",
  },
];

const OS: GuideStep[] = [
  {
    say: "Hauptgruppen-Ionen erreichen Edelgaskonfiguration: Gruppe 1, 2, 13 → 1+, 2+, 3+; Gruppe 15, 16, 17 → 3−, 2−, 1−.",
    ask: "Welches Ion bildet **Barium** (Gruppe 2)?", answer: "Ba²⁺", options: ["Ba²⁺", "Ba⁺", "Ba²⁻", "Ba⁶⁻"],
    why: { "Ba⁺": "Gruppe 2: zwei Außenelektronen gehen weg.", "Ba²⁻": "Metalle geben Elektronen ab.", "Ba⁶⁻": "6 aufnehmen ist viel mehr als 2 abgeben." },
    ok: "**Ba²⁺**.",
  },
  {
    say: "**Mehratomige Ionen** bleiben als Block zusammen: OH⁻ Hydroxid, NO₃⁻ Nitrat, CO₃²⁻ Carbonat, SO₄²⁻ Sulfat, PO₄³⁻ Phosphat, NH₄⁺ Ammonium.",
    ask: "Welche Ladung hat das **Sulfat-Ion** (SO₄)?", answer: "2−", options: ["2−", "1−", "3−", "4−"],
    why: { "1−": "1− hat Nitrat (NO₃⁻).", "3−": "3− hat Phosphat (PO₄³⁻).", "4−": "Die 4 gehört zu den O-Atomen, nicht zur Ladung." },
    ok: "Sulfat: **SO₄²⁻**.",
  },
  missing("Ca2+", "OH-", 1, 1, "A",
    "Mit mehratomigen Ionen gleicht man genauso aus – der ganze Block zählt als ein Baustein.",
    "1 · 2+ = 2+ und 2 · 1− = 2−."),
  {
    say: "Braucht man einen mehratomigen Block mehrmals, kommt er in **Klammern**, die Anzahl dahinter.",
    ask: "Welche Formel hat **Calciumhydroxid**?", answer: "Ca(OH)₂", options: ["Ca(OH)₂", "CaOH₂", "CaOH", "Ca₂OH"],
    visual: c => <Wall c={c} cat="Ca2+" an="OH-" nC={1} nA={2} />,
    why: { "CaOH₂": "OH₂ hieße: 1 O und 2 H. Gemeint ist zweimal das ganze OH⁻.", CaOH: "Ca²⁺ braucht zwei OH⁻.", "Ca₂OH": "Es braucht mehr Hydroxid-, nicht mehr Calcium-Ionen." },
    ok: "**Ca(OH)₂**.",
  },
  {
    ask: "Aus **Al³⁺** und **SO₄²⁻**: Wie viele Sulfat-Ionen gleichen **2** Al³⁺ aus?", answer: 3, num: {},
    visual: c => <Wall c={c} cat="Al3+" an="SO42-" nC={2} nA={1} />,
    why: { "2": "2 · 2− = 4−, aber 2 · 3+ = 6+.", "6": "6 ist die Ladung. Jedes Sulfat bringt 2−." },
    ok: "2 · 3+ = 6+ und 3 · 2− = 6−.",
  },
  {
    ask: "Welche Formel hat **Aluminiumsulfat**?", answer: "Al₂(SO₄)₃", options: ["Al₂(SO₄)₃", "Al₂SO₄₃", "Al₃(SO₄)₂", "AlSO₄"],
    visual: c => <Wall c={c} cat="Al3+" an="SO42-" nC={2} nA={3} />,
    why: { "Al₂SO₄₃": "Ohne Klammer stünde da „43 O-Atome“. Der Block SO₄ kommt in Klammern.", "Al₃(SO₄)₂": "Zähle: 2 Aluminium-Ionen, 3 Sulfat-Ionen.", "AlSO₄": "3+ und 2− gleichen sich nicht aus." },
    ok: "**Al₂(SO₄)₃**.",
  },
  {
    say: "Nebengruppen-Metalle bilden verschiedene Ionen. Die Ladung steht als **römische Zahl** im Namen: Eisen(III) = Fe³⁺.",
    ask: "Welche Formel hat **Eisen(III)-chlorid**?", answer: "FeCl₃", options: ["FeCl₃", "FeCl₂", "Fe₃Cl", "FeCl"],
    why: { "FeCl₂": "FeCl₂ wäre Eisen(II)-chlorid.", "Fe₃Cl": "Die III ist die Ladung von Fe, nicht die Anzahl der Fe-Ionen.", FeCl: "Fe³⁺ braucht drei Cl⁻." },
    ok: "Fe³⁺ + 3 Cl⁻ → **FeCl₃**.",
  },
  {
    say: "Umgekehrt: aus dem Anion auf die Ladung des Metalls schließen.",
    ask: "Welche Ladung hat das Kupfer-Ion in **CuO**?", answer: "2+", options: ["2+", "1+", "2−", "3+"],
    why: { "1+": "O²⁻ braucht 2+ – ein Cu muss 2+ tragen.", "2−": "Metall-Ionen sind positiv.", "3+": "Dann wäre CuO nicht neutral." },
    ok: "CuO = Kupfer(II)-oxid.",
  },
  {
    say: "Endungen: **-id** einatomig (Sulfid S²⁻), **-at** mit Sauerstoff (Sulfat SO₄²⁻), **-it** ein O weniger (Sulfit SO₃²⁻).",
    ask: "Wie heißt **Na₂SO₃**?", answer: "Natriumsulfit", options: ["Natriumsulfit", "Natriumsulfat", "Natriumsulfid"],
    why: { Natriumsulfat: "Sulfat ist SO₄ – hier sind nur 3 O.", Natriumsulfid: "Sulfid ist S²⁻ ohne Sauerstoff." },
    ok: "SO₃²⁻ = Sulfit.",
  },
  {
    ask: "Wie heißt **FeSO₄**?", answer: "Eisen(II)-sulfat", options: ["Eisen(II)-sulfat", "Eisen(III)-sulfat", "Eisen(II)-sulfid", "Eisen(IV)-sulfat"],
    why: { "Eisen(III)-sulfat": "SO₄²⁻ ist 2− – ein Fe muss 2+ tragen.", "Eisen(II)-sulfid": "SO₄ enthält Sauerstoff: Sulfat.", "Eisen(IV)-sulfat": "Die 4 gehört zum Sauerstoff, nicht zum Eisen." },
    ok: "Fe²⁺ + SO₄²⁻ → Eisen(II)-sulfat.",
  },
  {
    ask: "Aus **Zn²⁺** und **PO₄³⁻**: Wie viele Zink-Ionen braucht man für **2** Phosphat-Ionen?", answer: 3, num: {},
    visual: c => <Wall c={c} cat="Zn2+" an="PO43-" nC={1} nA={2} />,
    why: { "2": "2 · 2+ = 4+, aber 2 · 3− = 6−.", "6": "6 ist die Ladung. Jedes Zink-Ion bringt 2+." },
    ok: "3 · 2+ = 6+ = 2 · 3− → **Zn₃(PO₄)₂**.",
  },
];

export function guideFor(stufe: "us" | "os"): GuideDef {
  return stufe === "us"
    ? { title: "Ionenbindung", steps: US, outro: [
      "Metalle geben Elektronen ab (Kationen, + Hauptgruppe), Nichtmetalle nehmen auf (Anionen, 8 − Hauptgruppe).",
      "Plus und Minus gleichen sich aus: beide Reihen der Ionenwand **gleich lang**.",
      "Formel: Anzahlen tiefgestellt, kleinstes Verhältnis, 1 weglassen.",
      "Name: Metall + Nichtmetall-Stamm + **-id** (Chlorid, Oxid, Sulfid, Nitrid).",
    ] }
    : { title: "Ionenbindung", steps: OS, outro: [
      "Ladungen der Hauptgruppen-Ionen und der mehratomigen Ionen (Nitrat, Sulfat, Phosphat …).",
      "Mehratomige Ionen als Block, mehrfach in **Klammern**: Ca(OH)₂, Al₂(SO₄)₃.",
      "**Römische Zahl** = Ladung des Metall-Ions: Eisen(III)-chlorid FeCl₃.",
      "-id, -at, -it unterscheiden: Sulfid, Sulfat, Sulfit.",
    ] };
}
