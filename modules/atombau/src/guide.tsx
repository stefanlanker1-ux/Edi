// Geführte Erklärung Atombau (Knopf „Erklärung“): mit den Bausteinen der App – Bohrmodell, Periodensystem, Atomsymbol,
// Kästchenschema. Jeder Schritt verlangt eine Handlung; deckt alle Aufgabentypen des Quiz der jeweiligen Stufe ab.

import type { ReactNode } from "react";
import { Fit, type GuideCtx, type GuideDef, type GuideStep } from "@lern/ui";
import { configuration } from "@lern/chem";
import { Bohr, EnergyDiagram, Nuclide, PeriodicTable, type Particle } from "@lern/chem-ui";

/** Bohrmodell mit Legende; Teilchen im Modell oder in der Legende antippen */
function BohrPick({ c, Z, N, E, counts = false, target }: { c: GuideCtx; Z: number; N: number; E: number; counts?: boolean; target?: Particle }) {
  const legend: [Particle, string][] = [["proton", "Proton"], ["neutron", "Neutron"], ["electron", "Elektron"]];
  return (
    <div className="ab-g">
      <div className="ab-g-bohr"><Bohr Z={Z} N={N} E={E} counts={counts} labels={false} onParticleDown={target ? t => c.pick(t) : undefined} /></div>
      <div className="ab-g-legend">
        {legend.map(([t, label]) => (
          <button key={t} type="button" className={`ab-g-chip${c.show && t === target ? " g-sol" : ""}`} disabled={!target} onClick={() => c.pick(t)}>
            <i className={`ab-g-dot ${t}`} />{label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** vergrößerter Kern: Protonen und Neutronen zum Zählen (gemischt angeordnet) */
function Nucleus({ p, n }: { p: number; n: number }) {
  const all = Array.from({ length: p + n }, (_, i) => (i % 2 === 0 && i / 2 < p) || i >= 2 * n ? "proton" : "neutron");
  const r = 11, pos = all.map((_, i) => { const d = 13 * Math.sqrt(i + .5), a = i * 2.39996; return [d * Math.cos(a), d * Math.sin(a)]; });
  const ext = Math.max(...pos.map(([x, y]) => Math.hypot(x, y))) + r + 4;
  return (
    <svg className="ab-g-nuc" viewBox={`${-ext} ${-ext} ${2 * ext} ${2 * ext}`} role="img" aria-label={`Atomkern mit ${p} Protonen und ${n} Neutronen`}>
      {all.map((t, i) => <circle key={i} cx={pos[i][0]} cy={pos[i][1]} r={r} className={`ab-g-np ${t}`} />)}
      {all.map((t, i) => t === "proton" && <text key={`t${i}`} x={pos[i][0]} y={pos[i][1] + 4.5} className="ab-g-plus">+</text>)}
    </svg>
  );
}

const BohrOnly = ({ Z, N, E, shells }: { Z: number; N: number; E: number; shells?: number[] }) => (
  <div className="ab-g-bohr"><Bohr Z={Z} N={N} E={E} counts={false} labels={false} shellCounts={shells} /></div>
);

/** Periodensystem: Element antippen (Ziel = Ordnungszahl als Text); `mark` hebt ein Element hervor */
function Pse({ c, stufe, answer, mark, blocks }: { c: GuideCtx; stufe: "us" | "os"; answer?: number; mark?: number; blocks?: boolean }) {
  return (
    <div className="pse-fit">
      <PeriodicTable stufe={stufe} fit blocks={blocks} names={stufe === "us"}
        onPick={answer ? Z => c.pick(String(Z)) : undefined} disabled={!answer}
        cellState={Z => (c.solved && Z === answer ? "right" : c.show && Z === answer ? "hit" : Z === mark ? "sel" : undefined)} />
    </div>
  );
}

const Center = ({ children }: { children: ReactNode }) => <div className="ab-g-center">{children}</div>;

const US: GuideStep[] = [
  {
    say: "Jedes Atom hat einen **Kern** aus Protonen (rot) und Neutronen (grau). Um den Kern bewegen sich **Elektronen** (blau).",
    ask: "Tippe auf ein **Elektron**.", answer: "electron",
    visual: c => <BohrPick c={c} Z={6} N={6} E={6} target="electron" />,
    why: { proton: "Das ist ein Proton – es sitzt im Kern.", neutron: "Das ist ein Neutron – es sitzt im Kern." },
    tip: "Elektronen sind blau und liegen außen auf den Ringen, nicht im Kern.",
    ok: "Elektronen sind in der Hülle, Protonen und Neutronen im Kern.",
  },
  {
    say: "Die Zahl der **Protonen** bestimmt, welches Element es ist.",
    ask: "Das ist der Kern, vergrößert. Zähle die roten **Protonen** (+). Wie viele sind es?", answer: 6, num: {},
    visual: () => <Nucleus p={6} n={6} />,
    why: { "12": "12 sind alle Teilchen im Kern. Zähle nur die roten (mit +).", "18": "Zähle nur die roten Teilchen im Kern." },
    tip: "Zähle nur die roten Kugeln mit + – die grauen sind Neutronen.",
    ok: "6 Protonen – damit ist es Kohlenstoff.",
  },
  {
    say: "Im Periodensystem steht über jedem Element die **Ordnungszahl** = Zahl der Protonen.",
    ask: "Tippe das Element mit **6 Protonen** an.", answer: "6",
    visual: c => <Pse c={c} stufe="us" answer={6} />,
    tip: "Die kleine Zahl oben links in jedem Feld ist die Ordnungszahl.",
    ok: "Ordnungszahl = Protonenzahl: 6 → Kohlenstoff (C).",
  },
  {
    say: "Protonen sind **positiv** (+), Elektronen **negativ** (−). Ein Atom hat gleich viele – es ist **neutral**.",
    ask: "Wie viele **Elektronen** hat ein Kohlenstoff-Atom?", answer: 6, num: {},
    visual: () => <BohrOnly Z={6} N={6} E={6} />,
    why: { "12": "12 ist Protonen + Neutronen. Elektronen gibt es so viele wie Protonen." },
    tip: "Im neutralen Atom gleichen sich Plus und Minus aus.",
    ok: "Neutrales Atom: Elektronen = Protonen = Ordnungszahl, bei Kohlenstoff 6.",
  },
  {
    say: "Elektronen sind fast masselos. **Massenzahl = Protonen + Neutronen.**",
    ask: "Stickstoff hat **7 Protonen** und **7 Neutronen**. Wie groß ist die Massenzahl?", answer: 14, num: {},
    visual: () => <BohrOnly Z={7} N={7} E={7} />,
    why: { "21": "Elektronen zählen nicht mit – nur Protonen und Neutronen.", "7": "Zähle Protonen **und** Neutronen zusammen." },
    tip: "Zähle alle Teilchen im Kern zusammen.",
    ok: "Massenzahl = Protonen + Neutronen = 7 + 7 = 14 (Stickstoff-14).",
  },
  {
    say: "Die Elektronen sitzen auf **Schalen**: in die 1. Schale passen **2**, in die 2. Schale **8**, dann geht es auf der 3. weiter.",
    ask: "Fluor hat 9 Elektronen. 2 sind auf der 1. Schale. Wie viele kommen auf die **2. Schale**?", answer: 7, num: {},
    visual: () => <BohrOnly Z={9} N={10} E={9} shells={[2, 0]} />,
    why: { "8": "Fluor hat nur 9 Elektronen: 9 − 2 = 7.", "9": "2 sind schon auf der 1. Schale." },
    tip: "Ziehe die Elektronen der 1. Schale von allen Elektronen ab.",
    ok: "Fluor: 2 · 7. Die 2. Schale ist die äußerste.",
  },
  {
    say: "Die Elektronen auf der äußersten Schale heißen **Außenelektronen**.",
    ask: "Wie viele Außenelektronen hat **Natrium**?", answer: 1, num: {},
    visual: () => <BohrOnly Z={11} N={12} E={11} />,
    why: { "11": "11 sind alle Elektronen. Zähle nur die äußerste Schale.", "8": "8 sind auf der 2. Schale – die äußerste ist die 3." },
    tip: "Zähle nur die Punkte auf dem äußersten Ring.",
    ok: "Natrium: 2 · 8 · 1 – also 1 Außenelektron.",
  },
  {
    say: "Im Periodensystem gilt: **Periode** (Zeile) = Zahl der Schalen, **Hauptgruppe** (Spalte) = Zahl der Außenelektronen.",
    ask: "Schwefel hat **3 Schalen** und **6 Außenelektronen**. Tippe Schwefel an.", answer: "16",
    visual: c => <Pse c={c} stufe="us" answer={16} />,
    tip: "Zeile = Zahl der Schalen, Spalte = Zahl der Außenelektronen.",
    ok: "Schwefel: 3. Periode, VI. Hauptgruppe.",
  },
  {
    say: "So liest du ab, ohne zu zeichnen.",
    ask: "Wie viele Außenelektronen hat **Calcium**? Schau, in welcher Hauptgruppe es steht.", answer: 2, num: {},
    visual: c => <Pse c={c} stufe="us" mark={20} />,
    why: { "20": "20 ist die Ordnungszahl. Die Hauptgruppe sagt die Außenelektronen.", "4": "4 ist die Periode (Schalen). Gesucht ist die Hauptgruppe." },
    tip: "Lies die römische Zahl über der Spalte von Calcium ab.",
    ok: "II. Hauptgruppe → 2 Außenelektronen.",
  },
  {
    say: "Bei Reaktionen geben Atome Außenelektronen ab oder nehmen welche auf. Danach ist die äußerste Schale **voll** wie bei einem Edelgas (**Edelgaszustand**).",
    ask: "Natrium hat 1 Außenelektron. Was passiert bei einer Reaktion?", answer: "Es gibt 1 Elektron ab.",
    options: ["Es gibt 1 Elektron ab.", "Es nimmt 7 Elektronen auf."],
    visual: () => <BohrOnly Z={11} N={12} E={11} />,
    why: { "Es nimmt 7 Elektronen auf.": "Metalle wie Natrium geben ihre wenigen Außenelektronen ab – 1 statt 7 Elektronen umzuordnen." },
    ok: "Natrium gibt 1 Elektron ab. Dann ist die volle 2. Schale (8) außen.",
  },
  {
    say: "Jetzt hat Natrium 11 Protonen (+), aber nur 10 Elektronen (−). Geladene Teilchen heißen **Ionen**.",
    ask: "Welche Ladung hat dieses Teilchen?", answer: "1+", options: ["1+", "1−", "neutral", "11+"],
    visual: () => <BohrOnly Z={11} N={12} E={10} />,
    why: { "1−": "Es fehlt ein Elektron (−) – also bleibt ein Plus übrig.", neutral: "11 Plus, 10 Minus: ein Plus bleibt übrig.", "11+": "Die 10 Elektronen gleichen 10 Protonen aus." },
    ok: "Natrium-Ion **Na⁺**: ein Elektron weniger als Protonen.",
  },
  {
    say: "Atome mit 5, 6 oder 7 Außenelektronen **nehmen** Elektronen auf und werden negativ.",
    ask: "Welches Ion bildet **Chlor** (VII. Hauptgruppe, 7 Außenelektronen)?", answer: "Cl⁻", options: ["Cl⁻", "Cl⁺", "Cl⁷⁺", "Cl²⁻"],
    visual: () => <BohrOnly Z={17} N={18} E={17} />,
    why: { "Cl⁺": "Chlor fehlt 1 Elektron bis 8 – es nimmt eines auf.", "Cl⁷⁺": "7 abgeben ist viel schwerer als 1 aufnehmen.", "Cl²⁻": "Chlor fehlt nur 1 Elektron bis 8." },
    ok: "Chlorid-Ion **Cl⁻**: ein Elektron mehr als Protonen.",
  },
  {
    say: "Atome eines Elements haben immer gleich viele Protonen, aber manchmal verschieden viele **Neutronen**: **Isotope**. Die Zahl im Namen ist die Massenzahl.",
    ask: "Chlor hat 17 Protonen. Wie viele Neutronen hat **Chlor-37**?", answer: 20, num: {},
    visual: () => <Center><Nuclide Z={17} N={20} E={17} size="xl" /></Center>,
    why: { "37": "37 ist die Massenzahl: 37 − 17 = ?", "17": "17 sind die Protonen. Neutronen = 37 − 17." },
    tip: "Neutronen = Massenzahl − Protonen.",
    ok: "Neutronen = Massenzahl − Protonenzahl: 37 − 17 = 20.",
  },
  {
    ask: "**Chlor-35** und **Chlor-37** sind Isotope. Was haben sie gemeinsam?", answer: "die Protonenzahl",
    options: ["die Protonenzahl", "die Neutronenzahl", "die Massenzahl"],
    visual: () => <Center><Nuclide Z={17} N={18} E={17} size="lg" /><Nuclide Z={17} N={20} E={17} size="lg" /></Center>,
    why: { "die Neutronenzahl": "18 und 20 Neutronen – darin unterscheiden sie sich.", "die Massenzahl": "35 und 37 – darin unterscheiden sie sich." },
    ok: "Gleiche Protonenzahl = gleiches Element. Verschieden ist nur die Neutronenzahl.",
  },
];

const OS: GuideStep[] = [
  {
    say: "Atomsymbol: oben links die **Massenzahl** (Protonen + Neutronen), unten links die **Ordnungszahl** (Protonen).",
    ask: "Wie viele **Neutronen** hat dieses Atom?", answer: 20, num: {},
    visual: () => <Center><Nuclide Z={17} N={20} E={17} size="xl" /></Center>,
    why: { "37": "37 ist die Massenzahl. Neutronen = 37 − 17.", "17": "17 sind die Protonen." },
    tip: "Neutronen = Massenzahl (oben) − Ordnungszahl (unten).",
    ok: "37 − 17 = 20 Neutronen (Chlor-37, ein Isotop).",
  },
  {
    say: "Rechts oben steht die **Ladung**. Elektronen = Protonen − Ladung.",
    ask: "Wie viele **Elektronen** hat dieses Teilchen?", answer: 18, num: {},
    visual: () => <Center><Nuclide Z={16} N={16} E={18} size="xl" /></Center>,
    why: { "14": "2− heißt: zwei Elektronen **mehr** als Protonen.", "16": "Das Teilchen ist geladen (2−) – es hat mehr Elektronen als Protonen." },
    tip: "Eine negative Ladung heißt: mehr Elektronen als Protonen.",
    ok: "16 − (−2) = 18 Elektronen: das Sulfid-Ion S²⁻.",
  },
  {
    say: "Langperiodensystem: **Gruppen 1–18**, **Perioden 1–6**. Die Ordnungszahl steht über jedem Element.",
    ask: "Tippe auf das Element in der **4. Periode** und **Gruppe 16**.", answer: "34",
    visual: c => <Pse c={c} stufe="os" answer={34} />,
    tip: "Perioden sind die Zeilen (links nummeriert), Gruppen die Spalten (oben nummeriert).",
    ok: "4. Zeile, 16. Spalte: Selen (Z = 34).",
  },
  {
    say: "Elektronen füllen **Unterschalen** nach steigender Energie: 1s 2s 2p 3s 3p **4s 3d** 4p … Eine s-Unterschale fasst 2, p 6, d 10 Elektronen.",
    ask: "Wie viele Elektronen passen in eine **p**-Unterschale?", answer: "6", options: ["2", "6", "10", "8"],
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(18)} /></Fit>,
    why: { "2": "2 passen in eine s-Unterschale (1 Kästchen).", "10": "10 passen in eine d-Unterschale.", "8": "8 ist eine ganze Schale (s + p)." },
    ok: "p: 3 Kästchen × 2 = 6 Elektronen.",
  },
  {
    ask: "Welche Elektronenkonfiguration hat **Phosphor** (Z = 15)?", answer: "1s² 2s² 2p⁶ 3s² 3p³",
    options: ["1s² 2s² 2p⁶ 3s² 3p³", "1s² 2s² 2p⁶ 3p⁵", "1s² 2s² 2p⁶ 3s² 3d³", "1s² 2s⁸ 3s⁵"],
    why: { "1s² 2s² 2p⁶ 3p⁵": "3s kommt vor 3p – es wird zuerst gefüllt.", "1s² 2s² 2p⁶ 3s² 3d³": "Nach 3s folgt 3p, nicht 3d.", "1s² 2s⁸ 3s⁵": "s fasst nur 2 Elektronen." },
    ok: "Hochzahlen zusammen: 2 + 2 + 6 + 2 + 3 = 15.",
  },
  {
    say: "Achtung: **4s** liegt energetisch tiefer als 3d und wird zuerst gefüllt.",
    ask: "Im Bild: Argon, 18 Elektronen. Kalium hat eines mehr. Wohin kommt das **19.** Elektron?", answer: "4s", options: ["4s", "3d", "4p"],
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(18)} lastIndex={7} /></Fit>,
    why: { "3d": "3d liegt höher als 4s – es kommt erst nach 4s dran.", "4p": "4p kommt erst nach 4s und 3d." },
    ok: "Kalium: … 3p⁶ 4s¹.",
  },
  {
    say: "Kurzschreibweise: der **Edelgaskern** in eckigen Klammern ersetzt alle inneren Elektronen.",
    ask: "Wie schreibt man Kalium (Z = 19) kurz?", answer: "[Ar] 4s¹", options: ["[Ar] 4s¹", "[Ne] 4s¹", "[Ar] 3d¹", "[Kr] 4s¹"],
    why: { "[Ne] 4s¹": "Nach Neon fehlen noch 3s und 3p – der nächste Edelgaskern ist Argon (18).", "[Ar] 3d¹": "Nach Argon kommt zuerst 4s.", "[Kr] 4s¹": "Krypton (36) hat mehr Elektronen als Kalium." },
    ok: "[Ar] = die 18 Elektronen von Argon, dazu 4s¹.",
  },
  {
    say: "**Hund'sche Regel**: Gleichwertige Kästchen werden erst **einzeln** besetzt, dann gepaart. Im Bild: Kohlenstoff mit 2p².",
    ask: "Stickstoff hat **3 Elektronen** in 2p. Welches Schema stimmt?", answer: "↑ ↑ ↑", options: ["↑ ↑ ↑", "↑↓ ↑ _", "↑↓ ↑↓ ↑"],
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(6)} /></Fit>,
    why: { "↑↓ ↑ _": "Erst jedes Kästchen einzeln besetzen, dann paaren.", "↑↓ ↑↓ ↑": "Das wären 5 Elektronen." },
    ok: "Stickstoff: 2p mit drei einzelnen Elektronen.",
  },
  {
    ask: "Wie viele **ungepaarte** Elektronen hat Sauerstoff (2p⁴)?", answer: 2, num: {},
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(8)} /></Fit>,
    why: { "4": "Das 4. Elektron paart sich mit einem – zähle die Kästchen mit nur einem Pfeil.", "0": "In 2p sind zwei Kästchen nur einfach besetzt." },
    tip: "Zähle in 2p die Kästchen mit nur einem Pfeil.",
    ok: "2p⁴ = ↑↓ ↑ ↑ → 2 ungepaarte Elektronen.",
  },
  {
    say: "Der **Block** sagt, welche Unterschale zuletzt gefüllt wird: s (Gruppe 1–2), d (3–12), p (13–18).",
    ask: "In welchem Block steht **Eisen** (Fe, Gruppe 8)?", answer: "d-Block", options: ["s-Block", "p-Block", "d-Block", "f-Block"],
    visual: c => <Pse c={c} stufe="os" mark={26} blocks />,
    why: { "s-Block": "s-Block sind nur die Gruppen 1 und 2.", "p-Block": "p-Block sind die Gruppen 13–18.", "f-Block": "f-Block sind die Lanthanoide (unten)." },
    ok: "Eisen: [Ar] 4s² 3d⁶ – zuletzt wird 3d gefüllt.",
  },
  {
    say: "Hauptgruppen-Atome bilden Ionen mit **Edelgaskonfiguration**: Gruppe 1, 2, 13 geben 1, 2, 3 Elektronen ab; Gruppe 15, 16, 17 nehmen 3, 2, 1 auf.",
    ask: "Welches Ion bildet **Aluminium** (Gruppe 13)?", answer: "Al³⁺", options: ["Al³⁺", "Al³⁻", "Al⁺", "Al⁵⁻"],
    why: { "Al³⁻": "Aluminium ist ein Metall – es gibt seine 3 Außenelektronen ab.", "Al⁺": "Alle 3 Außenelektronen gehen weg.", "Al⁵⁻": "5 aufnehmen ist viel mehr als 3 abgeben." },
    ok: "Al³⁺ hat 10 Elektronen – wie Neon.",
  },
  {
    say: "Teilchen mit **gleicher Elektronenkonfiguration** heißen isoelektronisch.",
    ask: "Welches Teilchen hat dieselbe Konfiguration wie **Neon** (10 Elektronen)?", answer: "Mg²⁺", options: ["Mg²⁺", "Mg", "Na", "Cl⁻"],
    why: { Mg: "Magnesium-Atom: 12 Elektronen.", Na: "Natrium-Atom: 11 Elektronen.", "Cl⁻": "Cl⁻ hat 18 Elektronen – wie Argon." },
    ok: "Mg²⁺: 12 − 2 = 10 Elektronen.",
  },
  {
    say: "Kationen geben zuerst die Elektronen der **äußersten** Schale ab – bei Übergangsmetallen also **4s vor 3d**.",
    ask: "Eisen ist [Ar] 4s² 3d⁶. Welche Konfiguration hat **Fe²⁺**?", answer: "[Ar] 3d⁶", options: ["[Ar] 3d⁶", "[Ar] 4s² 3d⁴", "[Ar] 4s¹ 3d⁵"],
    why: { "[Ar] 4s² 3d⁴": "4s ist die äußerste Schale – diese Elektronen gehen zuerst.", "[Ar] 4s¹ 3d⁵": "Beide Elektronen kommen aus 4s." },
    ok: "Fe²⁺ = [Ar] 3d⁶.",
  },
  {
    say: "Aus der Konfiguration liest du die Stelle im PSE: höchste Schale = **Periode**.",
    ask: "Welches Element hat **[Ne] 3s² 3p⁴**? Tippe es an.", answer: "16",
    visual: c => <Pse c={c} stufe="os" answer={16} />,
    tip: "Höchstes n = Periode. Im p-Block gilt: Außenelektronen + 10 = Gruppe.",
    ok: "3. Periode, 2 + 4 = 6 Außenelektronen → Gruppe 16: Schwefel.",
  },
];

export function guideFor(stufe: "us" | "os"): GuideDef {
  return stufe === "us"
    ? { title: "Atombau", steps: US, outro: [
      "Ein Atom hat **Protonen** und **Neutronen** im Kern, **Elektronen** in der Hülle.",
      "**Ordnungszahl** = Protonen = Elektronen (im Atom). **Massenzahl** = Protonen + Neutronen.",
      "Schalen: 2 · 8 · 8 … **Periode** = Schalen, **Hauptgruppe** = Außenelektronen.",
      "**Ionen**: Elektronen abgeben (+) oder aufnehmen (−) bis zur vollen Schale.",
      "**Isotope**: gleiche Protonenzahl, verschiedene Neutronenzahl.",
    ] }
    : { title: "Atombau", steps: OS, outro: [
      "Atomsymbol lesen: Massenzahl, Ordnungszahl, Ladung → p, n, e.",
      "Aufbauprinzip 1s 2s 2p 3s 3p **4s 3d** 4p …, Kurzschreibweise mit Edelgaskern.",
      "**Hund'sche Regel**: erst einzeln, dann gepaart – ungepaarte Elektronen zählen.",
      "s-, p-, d-Block; Periode und Gruppe aus der Konfiguration.",
      "Ionen: Edelgaskonfiguration, Kationen geben 4s vor 3d ab, isoelektronische Teilchen.",
    ] };
}
