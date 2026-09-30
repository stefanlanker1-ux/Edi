// Kurze Erklärkarten je Level: das Wichtigste in wenigen Sätzen und ein Beispiel.

import { configuration } from "@lern/chem";
import { LEVELS, type LevelKey, type Stufe } from "./tasks.ts";
import { Bohr, Nuclide, EnergyDiagram } from "@lern/chem-ui";
import { RichText } from "@lern/ui";

type Example =
  | { kind: "nuclide"; Z: number; N: number; E: number }
  | { kind: "bohr"; Z: number; N: number; E: number }
  | { kind: "energy"; Z: number };

interface Explanation { points: string[]; example?: Example; caption?: string }

const TEXT: Record<string, Explanation> = {
  "us-1": {
    points: [
      "Im **Kern** sind Protonen (p⁺) und Neutronen (n). In der **Hülle** sind die Elektronen (e⁻).",
      "Die **Ordnungszahl Z** ist die Anzahl der Protonen. Sie legt fest, welches Element es ist.",
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
      "Die Elektronen der äußersten Schale heißen **Außenelektronen**. Ihre Anzahl ist die Nummer der Hauptgruppe.",
      "Die Anzahl der Schalen ist die Nummer der **Periode**.",
    ],
    example: { kind: "bohr", Z: 11, N: 12, E: 11 },
    caption: "Natrium: K 2, L 8, M 1 → 3. Periode, I. Hauptgruppe",
  },
  "us-3": {
    points: [
      "**Ionen** sind geladene Teilchen. Gibt ein Atom Elektronen ab, wird es positiv (**Kation**), nimmt es welche auf, negativ (**Anion**).",
      "Ladung = Protonen − Elektronen.",
      "Atome bilden Ionen, um eine volle Außenschale wie die Edelgase zu bekommen: Na → Na⁺, Cl → Cl⁻.",
      "**Isotope** haben gleich viele Protonen, aber unterschiedlich viele Neutronen, z. B. Kohlenstoff-12 und Kohlenstoff-14.",
    ],
    example: { kind: "nuclide", Z: 11, N: 12, E: 10 },
    caption: "Natrium-Ion: 11 Protonen, 10 Elektronen → Ladung +1",
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
    ],
    example: { kind: "energy", Z: 7 },
    caption: "Stickstoff: 1s² 2s² 2p³ – drei ungepaarte Elektronen",
  },
  "os-3": {
    points: [
      "Hauptgruppen-Ionen haben Edelgaskonfiguration: Na⁺, Mg²⁺ und O²⁻ sind **isoelektronisch** mit Neon.",
      "Übergangsmetalle geben zuerst die **4s**-Elektronen ab: Fe²⁺ = `[Ar] 3d⁶`.",
      "Aus der Konfiguration ablesen: höchstes n = **Periode**, Außenelektronen (s + p) = **Hauptgruppe**, zuletzt befüllte Unterschale = **Block**.",
    ],
    example: { kind: "energy", Z: 26 },
    caption: "Eisen: [Ar] 4s² 3d⁶ – für Fe²⁺ fallen die beiden 4s-Elektronen weg",
  },
};

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
