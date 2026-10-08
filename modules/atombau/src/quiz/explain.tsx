// Kurze Erklärkarten je Level: das Wichtigste in wenigen Sätzen und ein Beispiel.

import { configuration } from "@lern/chem";
import { LEVELS, type LevelKey, type Stufe } from "./tasks.ts";
import { Bohr, Nuclide, EnergyDiagram } from "@lern/chem-ui";
import { RichText } from "@lern/ui";
import { tr } from "@lern/i18n";

type Example =
  | { kind: "nuclide"; Z: number; N: number; E: number }
  | { kind: "bohr"; Z: number; N: number; E: number }
  | { kind: "energy"; Z: number };

interface Explanation { points: string[]; example?: Example; caption?: string }

const TEXT_DE: Record<string, Explanation> = {
  "us-1": {
    points: [
      "Im **Kern** sind Protonen (p⁺) und Neutronen (n). In der **Hülle** sind die Elektronen (e⁻).",
      "Die **Ordnungszahl Z** (Protonenzahl, Kernladungszahl) ist die Anzahl der Protonen. Sie legt fest, welches Element es ist.",
      "Die **Massenzahl A** zählt alle Kernteilchen: A = Protonen + Neutronen. Also: Neutronen = A − Z.",
      "Im **neutralen Atom** gibt es gleich viele Elektronen wie Protonen.",
    ],
    example: { kind: "nuclide", Z: 6, N: 6, E: 6 },
    caption: "Kohlenstoff-12: 6 Protonen, 12 − 6 = 6 Neutronen, 6 Elektronen",
  },
  "us-2": {
    points: [
      "Die Elektronen sind auf **Schalen** verteilt – von innen nach außen K, L, M, N.",
      "Die K-Schale fasst **2**, die L-Schale **8** und die M-Schale (bis Calcium) **8** Elektronen.",
      "Die Elektronen der äußersten Schale heißen **Außenelektronen** (Valenzelektronen). Ihre Anzahl ist die Nummer der Hauptgruppe (Spalte).",
      "Die Anzahl der Schalen ist die Nummer der **Periode** (Zeile).",
    ],
    example: { kind: "bohr", Z: 11, N: 12, E: 11 },
    caption: "Natrium: K 2, L 8, M 1 → 3. Periode, I. Hauptgruppe",
  },
  "us-3": {
    points: [
      "**Ionen** sind geladene Teilchen. Gibt ein Atom Elektronen ab, wird es positiv (**Kation**), nimmt es welche auf, negativ (**Anion**).",
      "Ladung = Protonen − Elektronen.",
      "Ionen der Hauptgruppen haben eine volle Außenschale wie ein Edelgas (**Edelgaskonfiguration**): Na⁺ wie Ne, Cl⁻ wie Ar.",
      "**Isotope** haben gleich viele Protonen, aber unterschiedlich viele Neutronen, z. B. Kohlenstoff-12 und Kohlenstoff-14.",
    ],
    example: { kind: "nuclide", Z: 11, N: 12, E: 10 },
    caption: "Natrium-Ion: 11 Protonen, 10 Elektronen → Ladung 1+",
  },
  "os-1": {
    points: [
      "Nuklidschreibweise: **Massenzahl A** oben links, **Ordnungszahl Z** unten links, **Ladung** oben rechts.",
      "Neutronen = A − Z. Elektronen = Z − Ladung.",
      "**Isotope** haben dasselbe Z, aber ein anderes A.",
    ],
    example: { kind: "nuclide", Z: 26, N: 30, E: 23 },
    caption: "Eisen(III)-Ion: 26 Protonen, 30 Neutronen, 23 Elektronen",
  },
  "os-2": {
    points: [
      "Die Unterschalen **s, p, d, f** fassen 2, 6, 10 und 14 Elektronen – je Kästchen (Orbital) höchstens 2.",
      "**Aufbauprinzip:** nach steigender Energie füllen: 1s 2s 2p 3s 3p **4s 3d** 4p 5s 4d 5p 6s 4f 5d 6p.",
      "**Pauli-Prinzip:** zwei Elektronen in einem Kästchen haben entgegengesetzten Spin (↑↓).",
      "**Hund'sche Regel:** Kästchen gleicher Energie zuerst einzeln besetzen.",
      "Kurzschreibweise mit Edelgaskern: `[Ne] 3s² 3p³` für Phosphor.",
      "Wenige **Ausnahmen** (gemessen): Chrom `[Ar] 4s¹ 3d⁵`, Kupfer `[Ar] 4s¹ 3d¹⁰`.",
    ],
    example: { kind: "energy", Z: 7 },
    caption: "Stickstoff: 1s² 2s² 2p³ – drei ungepaarte Elektronen",
  },
  "os-3": {
    points: [
      "Hauptgruppen-Ionen haben Edelgaskonfiguration: Na⁺, Mg²⁺ und O²⁻ sind **isoelektronisch** mit Neon – kurz `[Ne]`.",
      "**Übergangsmetalle** (d-Block, Gruppe 3–12) geben zuerst die **4s**-Elektronen ab: Fe²⁺ = `[Ar] 3d⁶`, Cu⁺ = `[Ar] 3d¹⁰` (aus Cu `[Ar] 4s¹ 3d¹⁰`).",
      "Aus der Konfiguration ablesen: höchstes n = **Periode**; Außenelektronen (s + p) = **Gruppe**, im p-Block + 10; zuletzt befüllte Unterschale = **Block**.",
    ],
    example: { kind: "energy", Z: 26 },
    caption: "Eisen: [Ar] 4s² 3d⁶ – für Fe²⁺ fallen die beiden 4s-Elektronen weg",
  },
};
const TEXT_EN: Record<string, Explanation> = {
  "us-1": {
    points: [
      "The **nucleus** contains protons (p⁺) and neutrons (n). The **shells** contain the electrons (e⁻).",
      "The **atomic number Z** (proton number) is the number of protons. It decides which element it is.",
      "The **mass number A** counts all particles in the nucleus: A = protons + neutrons. So: neutrons = A − Z.",
      "A **neutral atom** has as many electrons as protons.",
    ],
    example: { kind: "nuclide", Z: 6, N: 6, E: 6 },
    caption: "Carbon-12: 6 protons, 12 − 6 = 6 neutrons, 6 electrons",
  },
  "us-2": {
    points: [
      "The electrons are arranged in **shells** – from the inside out K, L, M, N.",
      "The K shell holds **2**, the L shell **8** and the M shell (up to calcium) **8** electrons.",
      "The electrons in the outer shell are the **outer electrons** (valence electrons). Their number is the main group number (column).",
      "The number of shells is the number of the **period** (row).",
    ],
    example: { kind: "bohr", Z: 11, N: 12, E: 11 },
    caption: "Sodium: K 2, L 8, M 1 → period 3, main group I",
  },
  "us-3": {
    points: [
      "**Ions** are charged particles. If an atom loses electrons it becomes positive (**cation**), if it gains some it becomes negative (**anion**).",
      "Charge = protons − electrons.",
      "Main group ions have a full outer shell like a noble gas (**noble gas configuration**): Na⁺ like Ne, Cl⁻ like Ar.",
      "**Isotopes** have the same number of protons but different numbers of neutrons, e.g. carbon-12 and carbon-14.",
    ],
    example: { kind: "nuclide", Z: 11, N: 12, E: 10 },
    caption: "Sodium ion: 11 protons, 10 electrons → charge 1+",
  },
  "os-1": {
    points: [
      "Nuclide notation: **mass number A** top left, **atomic number Z** bottom left, **charge** top right.",
      "Neutrons = A − Z. Electrons = Z − charge.",
      "**Isotopes** have the same Z but a different A.",
    ],
    example: { kind: "nuclide", Z: 26, N: 30, E: 23 },
    caption: "Iron(III) ion: 26 protons, 30 neutrons, 23 electrons",
  },
  "os-2": {
    points: [
      "The subshells **s, p, d, f** hold 2, 6, 10 and 14 electrons – at most 2 per box (orbital).",
      "**Aufbau principle:** fill in order of increasing energy: 1s 2s 2p 3s 3p **4s 3d** 4p 5s 4d 5p 6s 4f 5d 6p.",
      "**Pauli principle:** two electrons in one box have opposite spin (↑↓).",
      "**Hund's rule:** fill boxes of equal energy singly first.",
      "Short notation with noble gas core: `[Ne] 3s² 3p³` for phosphorus.",
      "A few **exceptions** (measured): chromium `[Ar] 4s¹ 3d⁵`, copper `[Ar] 4s¹ 3d¹⁰`.",
    ],
    example: { kind: "energy", Z: 7 },
    caption: "Nitrogen: 1s² 2s² 2p³ – three unpaired electrons",
  },
  "os-3": {
    points: [
      "Main group ions have a noble gas configuration: Na⁺, Mg²⁺ and O²⁻ are **isoelectronic** with neon – in short `[Ne]`.",
      "**Transition metals** (d block, groups 3–12) lose the **4s** electrons first: Fe²⁺ = `[Ar] 3d⁶`, Cu⁺ = `[Ar] 3d¹⁰` (from Cu `[Ar] 4s¹ 3d¹⁰`).",
      "Reading the configuration: highest n = **period**; outer electrons (s + p) = **group**, in the p block + 10; last subshell filled = **block**.",
    ],
    example: { kind: "energy", Z: 26 },
    caption: "Iron: [Ar] 4s² 3d⁶ – for Fe²⁺ the two 4s electrons are removed",
  },
};
const TEXT = tr(TEXT_DE, TEXT_EN);

/** Level, zu dem ein Aufgabentyp gehört (für „gemischt“ und „Schwächen üben“) */
export function explainLevelId(stufe: Stufe, level: LevelKey, type?: string): string {
  if (typeof level === "number") return LEVELS[stufe][level].id;
  return (LEVELS[stufe].find(l => type && l.types.includes(type)) ?? LEVELS[stufe][0]).id;
}

export function ExplainCard({ id }: { id: string }) {
  const e = TEXT[id];
  if (!e) return null;
  const ex = e.example;
  return (
    <div className="explain">
      <ul className="ex-points">{e.points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      {ex && (
        <figure className="ex-example">
          <div className="ex-visual">
            {ex.kind === "nuclide" && <Nuclide Z={ex.Z} N={ex.N} E={ex.E} size="lg" />}
            {ex.kind === "bohr" && <div className="ex-bohr"><Bohr Z={ex.Z} N={ex.N} E={ex.E} /></div>}
            {ex.kind === "energy" && <div className="scroll-x"><EnergyDiagram cfg={configuration(ex.Z)} /></div>}
          </div>
          {e.caption && <figcaption>{e.caption}</figcaption>}
        </figure>
      )}
    </div>
  );
}
