// Geführte Erklärung Atombau (Knopf „Erklärung“): mit den Bausteinen der App – Bohrmodell, Periodensystem, Atomsymbol,
// Kästchenschema. Jeder Schritt verlangt eine Handlung; deckt alle Aufgabentypen des Quiz der jeweiligen Stufe ab.

import { lazy, Suspense, type ReactNode } from "react";
import { Fit, type GuideCtx, type GuideDef, type GuideStep } from "@lern/ui";
import { configuration, slaterZeff } from "@lern/chem";
import { Bohr, EnergyDiagram, FillScheme, Nuclide, OrbitalAtom, PeriodicTable, type Particle } from "@lern/chem-ui";
import type { OrbitalItem } from "@lern/chem-ui/orbitals3d";
import { tr } from "@lern/i18n";

/** Bohrmodell mit Legende; Teilchen im Modell oder in der Legende antippen */
function BohrPick({ c, Z, N, E, counts = false, target }: { c: GuideCtx; Z: number; N: number; E: number; counts?: boolean; target?: Particle }) {
  const legend: [Particle, string][] = [["proton", "Proton"], ["neutron", "Neutron"], ["electron", tr("Elektron", "Electron")]];
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
    <svg className="ab-g-nuc" viewBox={`${-ext} ${-ext} ${2 * ext} ${2 * ext}`} role="img" aria-label={tr(`Atomkern mit ${p} Protonen und ${n} Neutronen`, `Nucleus with ${p} protons and ${n} neutrons`)}>
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

const Orbital3D = lazy(() => import("@lern/chem-ui/orbitals3d"));
/** Orbitale in 3D (jedes mit seiner 90-%-Fläche), ziehen dreht */
const OrbView = ({ items }: { items: OrbitalItem[] }) => (
  <div className="ab-g-orb">
    <Suspense fallback={<div className="m3d m3d-loading">{tr("3D-Ansicht wird geladen …", "Loading 3D view …")}</div>}>
      <Orbital3D items={items} />
    </Suspense>
  </div>
);
/** Orbital (n, l, Name) eines Atoms mit Ordnungszahl Z – effektive Kernladung nach Slater */
const orb = (Z: number, n: number, l: number, m: string): OrbitalItem => ({ o: { n, l, m }, Zeff: slaterZeff(Z, n, l) });
const AtomView = ({ Z, only, initial, spins }: { Z: number; only?: string[]; initial?: string[]; spins?: boolean }) => (
  <div className="ab-g-orb"><OrbitalAtom Z={Z} only={only} initial={initial} spins={spins} /></div>
);

/** Elektronenbeugung an einem Kristall: Ringe wie bei Licht (Interferenz) */
function Diffraction() {
  return (
    <svg className="ab-g-svg" viewBox="-120 -120 240 240" role="img" aria-label={tr("Beugungsbild von Elektronen: helle und dunkle Ringe", "Electron diffraction pattern: bright and dark rings")}>
      <rect x="-120" y="-120" width="240" height="240" rx="4" className="ab-g-screen" />
      {[18, 42, 64, 84, 102].map((r, i) => <circle key={r} r={r} className="ab-g-ring" style={{ opacity: 0.9 - i * 0.15, strokeWidth: 9 - i }} />)}
      <circle r="7" className="ab-g-spot" />
    </svg>
  );
}

/** 1s-Elektron als Punktwolke (Momentaufnahmen vieler Messungen, in die Ebene projiziert) */
function Cloud() {
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pts: [number, number][] = [];
  for (let i = 0; i < 900; i++) {
    // r aus r²·e^(−2r) (Summe von drei Exponentialverteilungen), Richtung gleichmäßig im Raum
    const r = -(Math.log(rnd()) + Math.log(rnd()) + Math.log(rnd())) / 2;
    const z = 2 * rnd() - 1, f = 2 * Math.PI * rnd(), q = Math.sqrt(1 - z * z);
    pts.push([r * q * Math.cos(f), r * q * Math.sin(f)]);
  }
  return (
    <svg className="ab-g-svg" viewBox="-4 -4 8 8" role="img" aria-label={tr("Punktwolke: viele Punkte nahe am Kern, nach außen immer weniger", "Dot cloud: many dots near the nucleus, fewer and fewer further out")}>
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.035" className="ab-g-dot-e" />)}
      <circle r="0.09" className="ab-g-nucdot" />
    </svg>
  );
}


const US: GuideStep[] = [
  // ── Kern und Hülle ──
  {
    mode: "worked", part: tr("Kern und Hülle", "Nucleus and shell"),
    say: tr("Jedes Atom hat einen **Kern** und eine **Hülle**.", "Every atom has a **nucleus** and a **shell**."),
    ask: tr("Woraus besteht ein Kohlenstoff-Atom?", "What is a carbon atom made of?"),
    visual: () => <BohrOnly Z={6} N={6} E={6} />,
    labels: [{ at: ".bohr .nuc", text: tr("Kern", "Nucleus"), side: "left", point: "left" }, { at: ".bohr .el", text: tr("Elektron", "Electron"), side: "right" }],
    lines: [tr("Kern (Mitte): **Protonen** (rot, +) und **Neutronen** (grau, ohne Ladung).", "Nucleus (centre): **protons** (red, +) and **neutrons** (grey, no charge)."), tr("Hülle: **Elektronen** (blau, −) auf Ringen um den Kern.", "Shell: **electrons** (blue, −) on rings around the nucleus."), tr("Kohlenstoff: 6 Protonen, 6 Neutronen, 6 Elektronen.", "Carbon: 6 protons, 6 neutrons, 6 electrons.")],
    ok: tr("Protonen und Neutronen innen, Elektronen außen.", "Protons and neutrons inside, electrons outside."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wo sind die **Elektronen**?", "Complete: where are the **electrons**?"), answer: tr("in der Hülle", "in the shell"), options: [tr("in der Hülle", "in the shell"), tr("im Kern", "in the nucleus")],
    visual: () => <BohrOnly Z={8} N={8} E={8} />,
    lines: [tr("Protonen und Neutronen: im Kern.", "Protons and neutrons: in the nucleus."), tr("Elektronen: {?}", "Electrons: {?}")],
    why: { [tr("im Kern", "in the nucleus")]: tr("Im Kern sind nur Protonen (rot) und Neutronen (grau).", "Only protons (red) and neutrons (grey) are in the nucleus.") },
    ok: tr("Elektronen bewegen sich in der Hülle um den Kern.", "Electrons move in the shell around the nucleus."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Tippe auf ein **Elektron**.", "Your turn: tap an **electron**."), answer: "electron",
    visual: c => <BohrPick c={c} Z={6} N={6} E={6} target="electron" />,
    why: { proton: tr("Das ist ein Proton – es sitzt im Kern.", "That is a proton – it sits in the nucleus."), neutron: tr("Das ist ein Neutron – es sitzt im Kern.", "That is a neutron – it sits in the nucleus.") },
    tip: tr("Elektronen sind blau und liegen außen auf den Ringen, nicht im Kern.", "Electrons are blue and lie outside on the rings, not in the nucleus."),
    ok: tr("Genau – ein Elektron in der Hülle.", "Exactly – an electron in the shell."),
  },
  {
    mode: "worked",
    say: tr("Die Zahl der **Protonen** bestimmt das Element. Sie heißt **Ordnungszahl**.", "The number of **protons** decides the element. It is called the **atomic number**."),
    ask: tr("Welches Element ist das? (Kern vergrößert)", "Which element is this? (nucleus enlarged)"),
    visual: () => <Nucleus p={6} n={6} />,
    labels: [{ at: ".ab-g-np.proton", text: "Proton", side: "left" }, { at: ".ab-g-np.neutron", text: "Neutron", side: "right" }],
    lines: [tr("Nur die roten Kugeln (+) zählen: **6 Protonen**.", "Count only the red balls (+): **6 protons**."), tr("Ordnungszahl = Protonenzahl = 6.", "Atomic number = number of protons = 6."), tr("Im Periodensystem ist Nr. 6 **Kohlenstoff** (C).", "In the periodic table, no. 6 is **carbon** (C).")],
    ok: tr("Neutronen zählen für das Element nicht.", "Neutrons do not count for the element."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie viele **Protonen** hat dieser Kern?", "Complete: how many **protons** does this nucleus have?"), answer: 8, num: {},
    visual: () => <Nucleus p={8} n={8} />,
    lines: [tr("Rote Kugeln (+) zählen: {?} Protonen", "Count the red balls (+): {?} protons"), tr("Ordnungszahl = Protonenzahl → Sauerstoff (O).", "Atomic number = number of protons → oxygen (O).")],
    why: { "16": tr("16 sind alle Teilchen im Kern. Zähle nur die roten (mit +).", "16 are all the particles in the nucleus. Count only the red ones (with +).") },
    tip: tr("Zähle nur die roten Kugeln mit + – die grauen sind Neutronen.", "Count only the red balls with + – the grey ones are neutrons."),
    ok: tr("8 Protonen → Sauerstoff.", "8 protons → oxygen."),
  },
  {
    mode: "free",
    say: tr("Im Periodensystem steht die **Ordnungszahl** unten links vor jedem Symbol.", "In the periodic table the **atomic number** is at the bottom left of each symbol."),
    ask: tr("Jetzt du: Tippe das Element mit **7 Protonen** an.", "Your turn: tap the element with **7 protons**."), answer: "7",
    visual: c => <Pse c={c} stufe="us" answer={7} />,
    tip: tr("Die kleine Zahl unten links vor dem Symbol ist die Ordnungszahl.", "The small number at the bottom left of the symbol is the atomic number."),
    lines: [tr("Ordnungszahl 7 → Stickstoff (N).", "Atomic number 7 → nitrogen (N).")],
    ok: tr("Richtig: Stickstoff.", "Right: nitrogen."),
  },
  // ── Elektronen und Massenzahl ──
  {
    mode: "worked", part: tr("Elektronen und Masse", "Electrons and mass"),
    say: tr("Protonen sind **positiv** (+), Elektronen **negativ** (−).", "Protons are **positive** (+), electrons **negative** (−)."),
    ask: tr("Wie viele **Elektronen** hat ein Kohlenstoff-Atom?", "How many **electrons** does a carbon atom have?"),
    visual: () => <BohrOnly Z={6} N={6} E={6} />,
    lines: [tr("Protonen: 6 (also 6 Plus).", "Protons: 6 (so 6 plus)."), tr("Ein Atom ist **neutral**: gleich viele Minus.", "An atom is **neutral**: the same number of minus."), tr("→ **6 Elektronen**.", "→ **6 electrons**.")],
    ok: tr("Im Atom: Elektronen = Protonen = Ordnungszahl.", "In an atom: electrons = protons = atomic number."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze für **Sauerstoff**.", "Complete for **oxygen**."), answer: 8, num: {},
    visual: () => <Nucleus p={8} n={8} />,
    lines: [tr("Protonen: 8.", "Protons: 8."), tr("Neutral → Elektronen = {?}", "Neutral → electrons = {?}")],
    why: { "16": tr("16 ist Protonen + Neutronen. Elektronen gibt es so viele wie Protonen.", "16 is protons + neutrons. There are as many electrons as protons.") },
    tip: tr("Im neutralen Atom gleichen sich Plus und Minus aus.", "In a neutral atom plus and minus balance out."),
    ok: tr("8 Protonen, 8 Elektronen.", "8 protons, 8 electrons."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Wie viele **Elektronen** hat ein **Magnesium**-Atom?", "Your turn: how many **electrons** does a **magnesium** atom have?"), answer: 12, num: {},
    visual: c => <Pse c={c} stufe="us" mark={12} />,
    why: { "24": tr("24 ist die Massenzahl. Elektronen = Protonen = Ordnungszahl.", "24 is the mass number. Electrons = protons = atomic number."), "2": tr("2 sind die Außenelektronen. Gefragt sind alle.", "2 are the outer electrons. The question asks for all of them.") },
    tip: tr("Lies die Ordnungszahl von Magnesium ab.", "Read off magnesium's atomic number."),
    lines: [tr("Ordnungszahl 12 → 12 Protonen → 12 Elektronen.", "Atomic number 12 → 12 protons → 12 electrons.")],
    ok: tr("Genau: 12 Elektronen.", "Exactly: 12 electrons."),
  },
  {
    mode: "worked",
    say: tr("Elektronen sind fast masselos. Die **Massenzahl** zählt nur den Kern.", "Electrons have almost no mass. The **mass number** counts only the nucleus."),
    ask: tr("Massenzahl von Stickstoff (7 Protonen, 7 Neutronen)?", "Mass number of nitrogen (7 protons, 7 neutrons)?"),
    visual: () => <BohrOnly Z={7} N={7} E={7} />,
    lines: [tr("Protonen: 7.", "Protons: 7."), tr("Neutronen: 7.", "Neutrons: 7."), tr("Elektronen zählen nicht mit.", "Electrons do not count."), tr("Massenzahl = 7 + 7 = **14**.", "Mass number = 7 + 7 = **14**.")],
    ok: tr("Massenzahl = Protonen + Neutronen.", "Mass number = protons + neutrons."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze für Sauerstoff (8 Protonen, 8 Neutronen).", "Complete for oxygen (8 protons, 8 neutrons)."), answer: 16, num: {},
    visual: () => <Nucleus p={8} n={8} />,
    lines: [tr("Protonen: 8.", "Protons: 8."), tr("Neutronen: 8.", "Neutrons: 8."), tr("Massenzahl = 8 + 8 = {?}", "Mass number = 8 + 8 = {?}")],
    why: { "24": tr("Elektronen zählen nicht mit – nur der Kern.", "Electrons do not count – only the nucleus.") },
    tip: tr("Rechne die letzte Zeile aus.", "Work out the last line."),
    ok: tr("Sauerstoff-16.", "Oxygen-16."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Natrium hat **11 Protonen** und **12 Neutronen**. Massenzahl?", "Your turn: sodium has **11 protons** and **12 neutrons**. Mass number?"), answer: 23, num: {},
    visual: () => <BohrOnly Z={11} N={12} E={11} />,
    why: { "34": tr("Elektronen zählen nicht mit – nur Protonen und Neutronen.", "Electrons do not count – only protons and neutrons."), "11": tr("Zähle Protonen **und** Neutronen zusammen.", "Add protons **and** neutrons.") },
    tip: tr("Zähle alle Teilchen im Kern zusammen.", "Add up all particles in the nucleus."),
    lines: [tr("11 + 12 = 23 → Natrium-23.", "11 + 12 = 23 → sodium-23.")],
    ok: tr("Richtig: 23.", "Right: 23."),
  },
  // ── Schalen ──
  {
    mode: "worked", part: tr("Schalen", "Shells"),
    say: tr("Elektronen sitzen auf **Schalen**: in die 1. passen **2**, in die 2. passen **8**.", "Electrons sit on **shells**: the 1st holds **2**, the 2nd holds **8**."),
    ask: tr("Wie verteilen sich die 9 Elektronen von **Fluor**?", "How are the 9 electrons of **fluorine** arranged?"),
    visual: () => <BohrOnly Z={9} N={10} E={9} />,
    labels: [{ at: ".bohr .ring", text: tr("1. Schale", "1st shell"), nth: 0, point: "nw", side: "top" }, { at: ".bohr .ring", text: tr("2. Schale", "2nd shell"), nth: 1, point: "ne", side: "top" }],
    lines: [tr("1. Schale: 2 – jetzt voll.", "1st shell: 2 – now full."), tr("2. Schale: 9 − 2 = **7**.", "2nd shell: 9 − 2 = **7**."), tr("Kurz: **2 · 7**. Die äußerste Schale hat 7 **Außenelektronen**.", "In short: **2 · 7**. The outer shell has 7 **outer electrons**."), tr("Die Schalen heißen von innen auch **K**, **L**, **M**, **N**.", "From the inside the shells are also called **K**, **L**, **M**, **N**.")],
    ok: tr("Erst die innere Schale füllen, dann die nächste.", "Fill the inner shell first, then the next."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze für **Aluminium** (13 Elektronen).", "Complete for **aluminium** (13 electrons)."), answer: 3, num: {},
    visual: () => <BohrOnly Z={13} N={14} E={13} shells={[2, 8, 0]} />,
    lines: [tr("1. Schale: 2.", "1st shell: 2."), tr("2. Schale: 8.", "2nd shell: 8."), tr("Äußerste Schale: 13 − 2 − 8 = {?}", "Outer shell: 13 − 2 − 8 = {?}")],
    why: { "5": tr("Auch die 8 der 2. Schale abziehen: 13 − 2 − 8.", "Subtract the 8 of the 2nd shell too: 13 − 2 − 8."), "11": tr("Auch die 8 der 2. Schale abziehen.", "Subtract the 8 of the 2nd shell too.") },
    tip: tr("Rechne die letzte Zeile aus.", "Work out the last line."),
    ok: tr("Aluminium: 2 · 8 · 3 – 3 Außenelektronen.", "Aluminium: 2 · 8 · 3 – 3 outer electrons."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Wie viele Außenelektronen hat **Natrium**?", "Your turn: how many outer electrons does **sodium** have?"), answer: 1, num: {},
    visual: () => <BohrOnly Z={11} N={12} E={11} />,
    why: { "11": tr("11 sind alle Elektronen. Zähle nur die äußerste Schale.", "11 are all the electrons. Count only the outer shell."), "8": tr("8 sind auf der 2. Schale – die äußerste ist die 3.", "8 are on the 2nd shell – the outer one is the 3rd.") },
    tip: tr("Zähle nur die Punkte auf dem äußersten Ring.", "Count only the dots on the outer ring."),
    lines: [tr("Natrium: 2 · 8 · 1 → 1 Außenelektron.", "Sodium: 2 · 8 · 1 → 1 outer electron.")],
    ok: tr("Genau: 1 Außenelektron.", "Exactly: 1 outer electron."),
  },
  {
    mode: "worked",
    say: tr("Das Periodensystem verrät die Schalen, ohne zu zeichnen.", "The periodic table tells you the shells without drawing."),
    ask: tr("Wo steht **Schwefel** (2 · 8 · 6)?", "Where is **sulfur** (2 · 8 · 6)?"),
    visual: c => <Pse c={c} stufe="us" mark={16} />,
    lines: [tr("3 Schalen → **3. Periode** (Zeile).", "3 shells → **period 3** (row)."), tr("6 Außenelektronen → **VI. Hauptgruppe** (Spalte).", "6 outer electrons → **main group VI** (column).")],
    ok: tr("Periode = Schalen, Hauptgruppe = Außenelektronen.", "Period = shells, main group = outer electrons."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze für **Calcium**.", "Complete for **calcium**."), answer: 2, num: {},
    visual: c => <Pse c={c} stufe="us" mark={20} />,
    lines: [tr("Calcium steht in der II. Hauptgruppe.", "Calcium is in main group II."), tr("Außenelektronen: {?}", "Outer electrons: {?}")],
    why: { "20": tr("20 ist die Ordnungszahl. Die Hauptgruppe sagt die Außenelektronen.", "20 is the atomic number. The main group tells you the outer electrons."), "4": tr("4 ist die Periode (Schalen). Gesucht ist die Hauptgruppe.", "4 is the period (shells). You need the main group.") },
    tip: tr("Römische Zahl der Hauptgruppe = Außenelektronen.", "Roman numeral of the main group = outer electrons."),
    ok: tr("II. Hauptgruppe → 2 Außenelektronen.", "Main group II → 2 outer electrons."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Tippe das Element mit **3 Schalen** und **5 Außenelektronen** an.", "Your turn: tap the element with **3 shells** and **5 outer electrons**."), answer: "15",
    visual: c => <Pse c={c} stufe="us" answer={15} />,
    tip: tr("Zeile = Zahl der Schalen, Spalte = Zahl der Außenelektronen.", "Row = number of shells, column = number of outer electrons."),
    lines: [tr("3. Periode, V. Hauptgruppe → Phosphor (P).", "Period 3, main group V → phosphorus (P).")],
    ok: tr("Richtig: Phosphor.", "Right: phosphorus."),
  },
  // ── Ionen ──
  {
    mode: "worked", part: tr("Ionen", "Ions"),
    say: tr("Bei Reaktionen geben Atome Außenelektronen ab oder nehmen welche auf, bis die äußerste Schale **voll** ist (**Edelgaskonfiguration**).", "In reactions atoms lose or gain outer electrons until the outer shell is **full** (**noble gas configuration**)."),
    ask: tr("Was wird aus **Natrium** (2 · 8 · 1)?", "What does **sodium** (2 · 8 · 1) become?"),
    visual: () => <BohrOnly Z={11} N={12} E={10} />,
    lines: [tr("1 Außenelektron abgeben ist leichter als 7 aufnehmen.", "Losing 1 outer electron is easier than gaining 7."), tr("Danach außen: die volle 2. Schale (8).", "Afterwards on the outside: the full 2nd shell (8)."), tr("11 Plus, 10 Minus → Ladung **1+**: das Ion **Na⁺**.", "11 plus, 10 minus → charge **1+**: the ion **Na⁺**.")],
    ok: tr("Geladene Teilchen heißen **Ionen**: positive **Kationen**, negative **Anionen**.", "Charged particles are called **ions**: positive **cations**, negative **anions**."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze für **Magnesium** (2 · 8 · 2).", "Complete for **magnesium** (2 · 8 · 2)."), answer: "2+", options: ["2+", "2−", tr("neutral", "neutral"), "12+"],
    visual: () => <BohrOnly Z={12} N={12} E={10} />,
    lines: [tr("Magnesium gibt seine 2 Außenelektronen ab.", "Magnesium loses its 2 outer electrons."), tr("12 Plus, 10 Minus → Ladung {?}", "12 plus, 10 minus → charge {?}")],
    why: { "2−": tr("Es fehlen Elektronen (−) – also bleibt Plus übrig.", "Electrons (−) are missing – so plus is left over."), [tr("neutral", "neutral")]: tr("12 Plus, 10 Minus: zwei Plus bleiben übrig.", "12 plus, 10 minus: two plus are left over."), "12+": tr("Die 10 Elektronen gleichen 10 Protonen aus.", "The 10 electrons balance 10 protons.") },
    ok: tr("Magnesium-Ion **Mg²⁺**.", "Magnesium ion **Mg²⁺**."),
  },
  {
    mode: "free",
    say: tr("Atome mit 5, 6 oder 7 Außenelektronen **nehmen** Elektronen auf und werden negativ.", "Atoms with 5, 6 or 7 outer electrons **gain** electrons and become negative."),
    ask: tr("Jetzt du: Welches Ion bildet **Chlor** (7 Außenelektronen)?", "Your turn: which ion does **chlorine** (7 outer electrons) form?"), answer: "Cl⁻", options: ["Cl⁻", "Cl⁺", "Cl⁷⁺", "Cl²⁻"],
    visual: () => <BohrOnly Z={17} N={18} E={17} />,
    why: { "Cl⁺": tr("Chlor fehlt 1 Elektron bis 8 – es nimmt eines auf.", "Chlorine is 1 electron short of 8 – it gains one."), "Cl⁷⁺": tr("7 abgeben ist viel schwerer als 1 aufnehmen.", "Losing 7 is much harder than gaining 1."), "Cl²⁻": tr("Chlor fehlt nur 1 Elektron bis 8.", "Chlorine is only 1 electron short of 8.") },
    lines: [tr("7 + 1 = 8 außen; 17 Plus, 18 Minus → Cl⁻ (Chlorid-Ion).", "7 + 1 = 8 outside; 17 plus, 18 minus → Cl⁻ (chloride ion).")],
    ok: tr("Chlorid-Ion **Cl⁻**.", "Chloride ion **Cl⁻**."),
  },
  {
    mode: "free",
    ask: tr("Welches Ion bildet **Sauerstoff** (6 Außenelektronen)?", "Which ion does **oxygen** (6 outer electrons) form?"), answer: "O²⁻", options: ["O²⁻", "O²⁺", "O⁶⁺", "O⁻"],
    visual: () => <BohrOnly Z={8} N={8} E={8} />,
    why: { "O²⁺": tr("Sauerstoff fehlen 2 Elektronen bis 8 – er nimmt sie auf (−).", "Oxygen is 2 electrons short of 8 – it gains them (−)."), "O⁶⁺": tr("6 abgeben ist viel schwerer als 2 aufnehmen.", "Losing 6 is much harder than gaining 2."), "O⁻": tr("Bis 8 fehlen 2 Elektronen, nicht 1.", "2 electrons are missing to reach 8, not 1.") },
    lines: [tr("6 + 2 = 8 außen; 8 Plus, 10 Minus → O²⁻ (Oxid-Ion).", "6 + 2 = 8 outside; 8 plus, 10 minus → O²⁻ (oxide ion).")],
    ok: tr("Oxid-Ion **O²⁻**.", "Oxide ion **O²⁻**."),
  },
  // ── Isotope ──
  {
    mode: "worked", part: tr("Isotope", "Isotopes"),
    say: tr("Atome eines Elements haben immer gleich viele Protonen, aber manchmal verschieden viele **Neutronen**: **Isotope**.", "Atoms of one element always have the same number of protons but sometimes different numbers of **neutrons**: **isotopes**."),
    ask: tr("Wie viele Neutronen hat **Chlor-37**?", "How many neutrons does **chlorine-37** have?"),
    visual: () => <Center><Nuclide Z={17} N={20} E={17} size="xl" /></Center>,
    labels: [{ at: ".nu-a", text: tr("Massenzahl", "Mass number"), side: "top", point: "top" }, { at: ".nu-z", text: tr("Ordnungszahl", "Atomic number"), side: "bottom", point: "bottom" }],
    lines: [tr("Massenzahl (oben): 37 = Protonen + Neutronen.", "Mass number (top): 37 = protons + neutrons."), tr("Ordnungszahl (unten): 17 Protonen.", "Atomic number (bottom): 17 protons."), tr("Neutronen = 37 − 17 = **20**.", "Neutrons = 37 − 17 = **20**.")],
    ok: tr("Die Zahl im Namen (Chlor-37) ist die Massenzahl.", "The number in the name (chlorine-37) is the mass number."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze für **Chlor-35**.", "Complete for **chlorine-35**."), answer: 18, num: {},
    visual: () => <Center><Nuclide Z={17} N={18} E={17} size="xl" /></Center>,
    lines: [tr("Massenzahl: 35.", "Mass number: 35."), tr("Protonen: 17.", "Protons: 17."), tr("Neutronen = 35 − 17 = {?}", "Neutrons = 35 − 17 = {?}")],
    why: { "52": tr("Abziehen, nicht addieren: 35 − 17.", "Subtract, do not add: 35 − 17.") },
    tip: tr("Rechne die letzte Zeile aus.", "Work out the last line."),
    ok: tr("Chlor-35 hat 18 Neutronen, Chlor-37 hat 20.", "Chlorine-35 has 18 neutrons, chlorine-37 has 20."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Wie viele Neutronen hat **Kohlenstoff-14**?", "Your turn: how many neutrons does **carbon-14** have?"), answer: 8, num: {},
    visual: () => <Center><Nuclide Z={6} N={8} E={6} size="xl" /></Center>,
    why: { "14": tr("14 ist die Massenzahl. Neutronen = 14 − 6.", "14 is the mass number. Neutrons = 14 − 6."), "6": tr("6 sind die Protonen.", "6 are the protons."), "20": tr("Abziehen, nicht addieren.", "Subtract, do not add.") },
    tip: tr("Neutronen = Massenzahl − Protonen.", "Neutrons = mass number − protons."),
    lines: [tr("14 − 6 = 8 Neutronen.", "14 − 6 = 8 neutrons.")],
    ok: tr("Genau: 8 Neutronen.", "Exactly: 8 neutrons."),
  },
  {
    mode: "free",
    ask: tr("**Chlor-35** und **Chlor-37** sind Isotope. Was haben sie gemeinsam?", "**Chlorine-35** and **chlorine-37** are isotopes. What do they have in common?"), answer: tr("die Protonenzahl", "the number of protons"),
    options: [tr("die Protonenzahl", "the number of protons"), tr("die Neutronenzahl", "the number of neutrons"), tr("die Massenzahl", "the mass number")],
    visual: () => <Center><Nuclide Z={17} N={18} E={17} size="lg" /><Nuclide Z={17} N={20} E={17} size="lg" /></Center>,
    why: { [tr("die Neutronenzahl", "the number of neutrons")]: tr("18 und 20 Neutronen – darin unterscheiden sie sich.", "18 and 20 neutrons – that is how they differ."), [tr("die Massenzahl", "the mass number")]: tr("35 und 37 – darin unterscheiden sie sich.", "35 and 37 – that is how they differ.") },
    lines: [tr("Gleiche Protonenzahl → gleiches Element. Nur die Neutronen sind verschieden.", "Same number of protons → same element. Only the neutrons differ.")],
    ok: tr("Isotope: gleiches Element, andere Neutronenzahl.", "Isotopes: same element, different number of neutrons."),
  },
];

const OS: GuideStep[] = [
  {
    mode: "worked",
    part: tr("Atomsymbol", "Nuclide symbol"),
    say: tr("Atomsymbol: oben links die **Massenzahl**, unten links die **Ordnungszahl**, oben rechts die **Ladung**.", "Nuclide symbol: **mass number** top left, **atomic number** bottom left, **charge** top right."),
    ask: tr("Was steckt in diesem Teilchen?", "What is inside this particle?"),
    visual: () => <Center><Nuclide Z={16} N={18} E={18} size="xl" /></Center>,
    labels: [{ at: ".nu-a", text: tr("Massenzahl", "Mass number"), side: "top", point: "top" }, { at: ".nu-z", text: tr("Ordnungszahl", "Atomic number"), side: "bottom", point: "bottom" }, { at: ".nu-q", text: tr("Ladung", "Charge"), side: "right" }],
    lines: [tr("Ordnungszahl (unten): **16 Protonen** → Schwefel.", "Atomic number (bottom): **16 protons** → sulfur."), tr("Neutronen = Massenzahl − Protonen = 34 − 16 = **18**.", "Neutrons = mass number − protons = 34 − 16 = **18**."), tr("Ladung 2−: zwei Elektronen **mehr** als Protonen → **18 Elektronen**.", "Charge 2−: two electrons **more** than protons → **18 electrons**.")],
    ok: tr("Das Sulfid-Ion ³⁴S²⁻: 16 p, 18 n, 18 e.", "The sulfide ion ³⁴S²⁻: 16 p, 18 n, 18 e."),
  },
  {
    mode: "faded",
    say: tr("Atomsymbol: oben links die **Massenzahl** (Protonen + Neutronen), unten links die **Ordnungszahl** (Protonen).", "Nuclide symbol: **mass number** (protons + neutrons) at the top left, **atomic number** (protons) at the bottom left."),
    ask: tr("Ergänze: Wie viele **Neutronen** hat dieses Atom?", "Complete: how many **neutrons** does this atom have?"), answer: 20, num: {},
    visual: () => <Center><Nuclide Z={17} N={20} E={17} size="xl" /></Center>,
    why: { "37": tr("37 ist die Massenzahl. Neutronen = 37 − 17.", "37 is the mass number. Neutrons = 37 − 17."), "17": tr("17 sind die Protonen.", "17 are the protons.") },
    tip: tr("Neutronen = Massenzahl (oben) − Ordnungszahl (unten).", "Neutrons = mass number (top) − atomic number (bottom)."),
    labels: [{"at": ".nu-a", "text": tr("Massenzahl", "Mass number"), "side": "top", "point": "top"}, {"at": ".nu-z", "text": tr("Ordnungszahl", "Atomic number"), "side": "bottom", "point": "bottom"}],
    ok: tr("Chlor-37 hat 20 Neutronen.", "Chlorine-37 has 20 neutrons."),
    lines: [tr("Massenzahl 37 (oben), Protonen 17 (unten).", "Mass number 37 (top), protons 17 (bottom)."), tr("Neutronen = 37 − 17 = {?}", "Neutrons = 37 − 17 = {?}")],
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Wie viele **Elektronen** hat dieses Teilchen?", "Your turn: how many **electrons** does this particle have?"), answer: 10, num: {},
    visual: () => <Center><Nuclide Z={13} N={14} E={10} size="xl" /></Center>,
    why: { "16": tr("3+ heißt: drei Elektronen **weniger** als Protonen.", "3+ means: three electrons **fewer** than protons."), "13": tr("Das Teilchen ist geladen (3+) – es hat weniger Elektronen als Protonen.", "The particle is charged (3+) – it has fewer electrons than protons."), "14": tr("14 sind die Neutronen (27 − 13).", "14 are the neutrons (27 − 13).") },
    tip: tr("Eine positive Ladung heißt: weniger Elektronen als Protonen.", "A positive charge means: fewer electrons than protons."),
    lines: [tr("13 Protonen, Ladung 3+ → 13 − 3 = 10 Elektronen (Al³⁺).", "13 protons, charge 3+ → 13 − 3 = 10 electrons (Al³⁺).")],
    ok: tr("Genau: Al³⁺ hat 10 Elektronen.", "Exactly: Al³⁺ has 10 electrons."),
  },
  {
    mode: "worked",
    part: tr("Grenzen des Schalenmodells", "Limits of the shell model"),
    say: tr("Im **Schalenmodell** kreisen Elektronen auf festen Bahnen um den Kern.", "In the **shell model**, electrons circle the nucleus on fixed paths."),
    ask: tr("Wie sieht Sauerstoff im Schalenmodell aus?", "What does oxygen look like in the shell model?"),
    visual: () => <BohrOnly Z={8} N={8} E={8} />,
    lines: [tr("8 Elektronen: 2 auf der 1. Schale (voll).", "8 electrons: 2 in the 1st shell (full)."), tr("8 − 2 = **6** auf der 2. Schale.", "8 − 2 = **6** in the 2nd shell."), tr("Das Modell erklärt Ionen und Gruppen gut – aber alles liegt flach auf Kreisen.", "The model explains ions and groups well – but everything lies flat on circles.")],
    ok: tr("Kreisbahnen in einer Ebene – damit gibt es keine Raumform.", "Circular paths in one plane – so there is no shape in space."),
  },
  {
    mode: "faded",
    say: tr("Das Schalenmodell erklärt Ionen und Gruppen gut. Doch es sagt nichts über die **Form** von Molekülen – etwa warum Wasser gewinkelt ist.", "The shell model explains ions and groups well. But it says nothing about the **shape** of molecules – such as why water is bent."),
    ask: tr("Ergänze: Was kann das Schalenmodell **nicht** erklären?", "Complete: what can the shell model **not** explain?"), answer: tr("die räumliche Form von Molekülen", "the spatial shape of molecules"),
    options: [tr("die räumliche Form von Molekülen", "the spatial shape of molecules"), tr("dass Natrium ein Elektron abgibt", "that sodium loses one electron"), tr("dass Atome einen Kern haben", "that atoms have a nucleus")],
    why: { [tr("dass Natrium ein Elektron abgibt", "that sodium loses one electron")]: tr("Das erklärt das Schalenmodell: 1 Außenelektron, danach volle Schale.", "The shell model explains that: 1 outer electron, then a full shell."), [tr("dass Atome einen Kern haben", "that atoms have a nucleus")]: tr("Den Kern hat schon das Rutherford-Modell erklärt.", "The nucleus was already explained by the Rutherford model.") },
    ok: tr("Für Formen braucht es ein besseres Modell: das **Orbitalmodell**.", "Shapes need a better model: the **orbital model**."),
    lines: [tr("Das Schalenmodell zeichnet Kreise in einer Ebene.", "The shell model draws circles in one plane."), tr("Moleküle sind räumlich – Wasser ist gewinkelt.", "Molecules are three-dimensional – water is bent."), tr("Nicht erklärbar: {?}", "Not explainable: {?}")],
  },
  {
    mode: "worked",
    part: tr("Elektronen als Welle", "Electrons as waves"),
    say: tr("Schießt man Elektronen durch einen dünnen Kristall, entstehen helle und dunkle **Ringe**.", "If you fire electrons through a thin crystal, bright and dark **rings** appear."),
    ask: tr("Was zeigt dieses Bild über Elektronen?", "What does this picture show about electrons?"),
    visual: () => <Diffraction />,
    lines: [tr("Solche Ringe heißen **Beugungsmuster** – man kennt sie von Licht.", "Such rings are called a **diffraction pattern** – known from light."), tr("Beugung entsteht nur, wenn sich **Wellen** überlagern.", "Diffraction only happens when **waves** overlap."), tr("→ Elektronen verhalten sich auch wie Wellen.", "→ Electrons also behave like waves.")],
    ok: tr("Elektronen sind Teilchen **und** Welle (Welle-Teilchen-Dualismus).", "Electrons are particles **and** waves (wave–particle duality)."),
  },
  {
    mode: "faded",
    say: tr("**Unschärferelation** (Heisenberg): Ort und Geschwindigkeit eines Elektrons lassen sich nie gleichzeitig genau bestimmen.", "**Uncertainty principle** (Heisenberg): the position and speed of an electron can never both be known exactly."),
    ask: tr("Ergänze: Kann man die **Bahn** eines Elektrons angeben?", "Complete: can you state the **path** of an electron?"), answer: tr("Nein", "No"),
    options: [tr("Nein", "No"), tr("Ja, eine Kreisbahn", "Yes, a circle"), tr("Ja, eine Ellipse", "Yes, an ellipse")],
    why: { [tr("Ja, eine Kreisbahn", "Yes, a circle")]: tr("Für eine Bahn müsste man Ort und Geschwindigkeit genau kennen.", "A path would need exact position and speed."), [tr("Ja, eine Ellipse", "Yes, an ellipse")]: tr("Auch eine Ellipse ist eine Bahn – die gibt es nicht.", "An ellipse is a path too – there is none.") },
    ok: tr("Statt einer Bahn gibt es nur **Wahrscheinlichkeiten**, wo das Elektron ist.", "Instead of a path there are only **probabilities** of where the electron is."),
    lines: [tr("Heisenberg: Ort und Geschwindigkeit nie gleichzeitig genau messbar.", "Heisenberg: position and speed are never both measurable exactly."), tr("Eine Bahn bräuchte beides zu jedem Zeitpunkt.", "A path would need both at every moment."), tr("Bahn angeben? {?}", "State a path? {?}")],
  },
  {
    mode: "free",
    say: tr("Die **Schrödinger-Gleichung** liefert eine Wellenfunktion ψ. Ihr Quadrat ψ² gibt an, wie wahrscheinlich das Elektron an einem Ort ist.", "The **Schrödinger equation** gives a wave function ψ. Its square ψ² gives how likely the electron is at a place."),
    ask: tr("Jeder Punkt ist eine Messung des Wasserstoff-Elektrons. Wo ist die **Punktdichte** am größten?", "Each dot is one measurement of the hydrogen electron. Where is the **dot density** highest?"), answer: tr("nahe am Kern", "near the nucleus"),
    options: [tr("nahe am Kern", "near the nucleus"), tr("auf einem Kreis", "on a circle"), tr("ganz außen", "far outside")],
    visual: () => <Cloud />,
    why: { [tr("auf einem Kreis", "on a circle")]: tr("Es gibt keine Kreisbahn – die Punkte werden nach außen gleichmäßig weniger.", "There is no circular path – the dots thin out evenly towards the outside."), [tr("ganz außen", "far outside")]: tr("Außen sind die Punkte am dünnsten.", "Outside the dots are sparsest.") },
    ok: tr("ψ² ist am Kern am größten und nimmt nach außen ab – ohne scharfe Grenze.", "ψ² is largest at the nucleus and falls off outwards – without a sharp edge."),
    lines: [tr("Viele Punkte nahe am Kern, nach außen immer weniger – ohne scharfe Grenze.", "Many dots near the nucleus, fewer and fewer further out – no sharp edge.")],
  },
  {
    mode: "worked",
    say: tr("**ψ²** (Schrödinger) gibt an, wie wahrscheinlich das Elektron an einem Ort ist.", "**ψ²** (Schrödinger) gives how likely the electron is at a place."),
    ask: tr("Wie zeichnet man, wo das Elektron ist?", "How do you draw where the electron is?"),
    visual: () => <OrbView items={[orb(1, 1, 0, "s")]} />,
    lines: [tr("Eine scharfe Grenze gibt es nicht.", "There is no sharp edge."), tr("Man zeichnet die Fläche, innerhalb der es zu **90 %** ist.", "You draw the surface inside which it is **90 %** of the time."), tr("Dieser Raum heißt **Orbital**. Im Bild: 1s von Wasserstoff.", "This region is called an **orbital**. In the picture: hydrogen 1s.")],
    ok: tr("Orbital = Aufenthaltsraum, keine Bahn. Ziehen dreht das Modell.", "Orbital = region, not a path. Drag to rotate the model."),
  },
  {
    mode: "faded",
    say: tr("**Pauli-Prinzip**: Ein Orbital fasst höchstens **zwei** Elektronen – und nur mit entgegengesetztem **Spin**, geschrieben ↑↓.", "**Pauli principle**: an orbital holds at most **two** electrons – and only with opposite **spin**, written ↑↓."),
    ask: tr("Ergänze: Wie viele Elektronen passen in **ein** Orbital?", "Complete: how many electrons fit into **one** orbital?"), answer: 2, num: {},
    why: { "8": tr("8 passen in eine ganze Schale aus s und p – nicht in ein Orbital.", "8 fit into a whole shell of s and p – not into one orbital."), "1": tr("Zwei passen – wenn ihr Spin entgegengesetzt ist.", "Two fit – if their spin is opposite.") },
    tip: tr("Denk an die Pfeile ↑↓ in einem Kästchen.", "Think of the arrows ↑↓ in one box."),
    ok: tr("Ein Orbital = ein Kästchen = höchstens ↑↓.", "One orbital = one box = at most ↑↓."),
    lines: [tr("Elektronen haben einen **Spin**: ↑ oder ↓.", "Electrons have a **spin**: ↑ or ↓."), tr("Je Orbital höchstens ein ↑ und ein ↓.", "Per orbital at most one ↑ and one ↓."), tr("Höchstens {?} Elektronen je Orbital", "At most {?} electrons per orbital")],
  },
  {
    mode: "worked",
    part: tr("Quantenzahlen und Formen", "Quantum numbers and shapes"),
    say: tr("Jedes Orbital hat Quantenzahlen. Die **Hauptquantenzahl n** = 1, 2, 3 … entspricht der Schale.", "Each orbital has quantum numbers. The **principal quantum number n** = 1, 2, 3 … corresponds to the shell."),
    ask: tr("Was ändert sich von 1s über 2s zu 3s?", "What changes from 1s to 2s to 3s?"),
    visual: () => <OrbView items={[orb(1, 1, 0, "s"), orb(1, 2, 0, "s"), orb(1, 3, 0, "s")]} />,
    lines: [tr("Form: immer eine **Kugel**.", "Shape: always a **sphere**."), tr("Größe: 1s < 2s < 3s.", "Size: 1s < 2s < 3s."), tr("Größeres **n** → größer und energiereicher.", "Larger **n** → bigger and higher in energy.")],
    ok: tr("n = Schale = Größe.", "n = shell = size."),
  },
  {
    mode: "faded",
    say: tr("Die **Nebenquantenzahl l** gibt die Form an: l = 0 heißt **s**, 1 heißt **p**, 2 heißt **d**, 3 heißt **f**. In Schale n gibt es l = 0 bis n − 1.", "The **azimuthal quantum number l** gives the shape: l = 0 is **s**, 1 is **p**, 2 is **d**, 3 is **f**. In shell n, l runs from 0 to n − 1."),
    ask: tr("Ergänze: Welche Unterschalen gibt es in der **2. Schale**?", "Complete: which subshells exist in the **2nd shell**?"), answer: "2s, 2p", options: ["2s, 2p", "2s", "2s, 2p, 2d"],
    why: { "2s": tr("n = 2 erlaubt l = 0 **und** 1 – also auch 2p.", "n = 2 allows l = 0 **and** 1 – so 2p too."), "2s, 2p, 2d": tr("d braucht l = 2. Das gibt es erst ab n = 3.", "d needs l = 2. That only exists from n = 3.") },
    ok: tr("2. Schale: 2s und 2p. 3. Schale: 3s, 3p, 3d.", "2nd shell: 2s and 2p. 3rd shell: 3s, 3p, 3d."),
    lines: [tr("l = 0, 1, … bis n − 1 (s, p, d …).", "l = 0, 1, … up to n − 1 (s, p, d …)."), tr("n = 1: nur l = 0 → 1s.", "n = 1: only l = 0 → 1s."), tr("n = 2: l = 0 und 1 → {?}", "n = 2: l = 0 and 1 → {?}")],
  },
  {
    mode: "free",
    say: tr("Alle **s**-Orbitale sind kugelförmig. Im Bild: das 2s-Orbital von Kohlenstoff.", "All **s** orbitals are spherical. In the picture: the 2s orbital of carbon."),
    ask: tr("Welche Form hat ein s-Orbital?", "What shape does an s orbital have?"), answer: tr("Kugel", "sphere"),
    options: [tr("Kugel", "sphere"), tr("Hantel", "dumbbell"), tr("Kreisbahn", "circular path")],
    visual: () => <OrbView items={[orb(6, 2, 0, "s")]} />,
    why: { [tr("Hantel", "dumbbell")]: tr("Hanteln sind p-Orbitale. Dreh das Modell – es sieht von überall gleich aus.", "Dumbbells are p orbitals. Rotate the model – it looks the same from everywhere."), [tr("Kreisbahn", "circular path")]: tr("Ein Orbital ist ein Raum, keine Bahn.", "An orbital is a region, not a path.") },
    ok: tr("s-Orbital = Kugel, in jeder Richtung gleich.", "s orbital = sphere, the same in every direction."),
    lines: [tr("s-Orbitale sind Kugeln – von jeder Seite gleich.", "s orbitals are spheres – the same from every side.")],
  },
  {
    mode: "worked",
    say: tr("**p**-Orbitale haben zwei Lappen (Hantel).", "**p** orbitals have two lobes (dumbbell)."),
    ask: tr("Wie ist ein 2p-Orbital gebaut?", "How is a 2p orbital built?"),
    visual: () => <OrbView items={[orb(6, 2, 1, "pz")]} />,
    lines: [tr("Zwei Lappen entlang einer Achse (hier z).", "Two lobes along one axis (here z)."), tr("Dunkel: ψ > 0, hell: ψ < 0.", "Dark: ψ > 0, light: ψ < 0."), tr("Dazwischen ψ = 0: eine **Knotenebene** durch den Kern – dort ist das Elektron nie.", "In between ψ = 0: a **nodal plane** through the nucleus – the electron is never there.")],
    ok: tr("Das Vorzeichen von ψ zählt beim Binden – nicht die Ladung.", "The sign of ψ matters for bonding – not the charge."),
  },
  {
    mode: "faded",
    say: tr("Die **Magnetquantenzahl m** gibt die Ausrichtung an. Es gibt drei p-Orbitale: entlang x, y und z – gleich groß, gleiche Energie.", "The **magnetic quantum number m** gives the orientation. There are three p orbitals: along x, y and z – same size, same energy."),
    ask: tr("Ergänze: Wie viele **p-Orbitale** gibt es in einer Schale?", "Complete: how many **p orbitals** are there in a shell?"), answer: 3, num: {},
    visual: () => <OrbView items={[orb(6, 2, 1, "px"), orb(6, 2, 1, "py"), orb(6, 2, 1, "pz")]} />,
    why: { "6": tr("6 Elektronen passen hinein – verteilt auf die Orbitale.", "6 electrons fit in – spread over the orbitals."), "1": tr("Dreh das Modell: Es sind Hanteln in drei Richtungen.", "Rotate the model: there are dumbbells in three directions.") },
    tip: tr("Zähle die Achsen, entlang denen Hanteln liegen.", "Count the axes along which dumbbells lie."),
    ok: tr("Je ein p-Orbital entlang x, y und z – zusammen 6 Elektronen.", "One p orbital each along x, y and z – 6 electrons together."),
    lines: [tr("Die **Magnetquantenzahl m** gibt die Ausrichtung an.", "The **magnetic quantum number m** gives the orientation."), tr("p-Hanteln liegen entlang x, y und z.", "p dumbbells lie along x, y and z."), tr("Zahl der p-Orbitale: {?}", "Number of p orbitals: {?}")],
  },
  {
    mode: "free",
    say: tr("Ab n = 3 gibt es **d**-Orbitale: fünf Stück, meist mit vier Lappen. Im Bild: zwei der fünf 3d-Orbitale von Eisen.", "From n = 3 there are **d** orbitals: five of them, mostly with four lobes. In the picture: two of the five 3d orbitals of iron."),
    ask: tr("Wie viele **d-Orbitale** gibt es in einer Schale?", "How many **d orbitals** are there in a shell?"), answer: 5, num: {},
    visual: () => <OrbView items={[orb(26, 3, 2, "dxy"), orb(26, 3, 2, "dz2")]} />,
    why: { "10": tr("10 Elektronen passen in die d-Unterschale – je 2 pro Orbital.", "10 electrons fit into the d subshell – 2 per orbital."), "3": tr("3 sind es bei p. Bei d sind es mehr.", "3 is for p. d has more.") },
    tip: tr("l = 2 erlaubt m = −2, −1, 0, 1, 2.", "l = 2 allows m = −2, −1, 0, 1, 2."),
    ok: tr("5 d-Orbitale × 2 = 10 Elektronen.", "5 d orbitals × 2 = 10 electrons."),
    lines: [tr("l = 2 → m = −2, −1, 0, 1, 2 → 5 d-Orbitale.", "l = 2 → m = −2, −1, 0, 1, 2 → 5 d orbitals.")],
  },
  {
    mode: "free",
    say: tr("Die **Spinquantenzahl s** = +½ oder −½ unterscheidet die zwei Elektronen in einem Orbital (↑ und ↓).", "The **spin quantum number s** = +½ or −½ tells apart the two electrons in an orbital (↑ and ↓)."),
    ask: tr("Zwei Elektronen im **selben** Orbital haben …", "Two electrons in the **same** orbital have …"), answer: tr("entgegengesetzten Spin", "opposite spin"),
    options: [tr("entgegengesetzten Spin", "opposite spin"), tr("gleichen Spin", "the same spin"), tr("verschiedene Hauptquantenzahlen", "different principal quantum numbers")],
    why: { [tr("gleichen Spin", "the same spin")]: tr("Dann wären alle vier Quantenzahlen gleich – das verbietet Pauli.", "Then all four quantum numbers would be equal – Pauli forbids that."), [tr("verschiedene Hauptquantenzahlen", "different principal quantum numbers")]: tr("Im selben Orbital sind n, l und m gleich.", "In the same orbital n, l and m are equal.") },
    ok: tr("Keine zwei Elektronen stimmen in allen **vier** Quantenzahlen überein.", "No two electrons agree in all **four** quantum numbers."),
    lines: [tr("Pauli: keine zwei Elektronen mit allen vier Quantenzahlen gleich → ↑↓.", "Pauli: no two electrons with all four quantum numbers equal → ↑↓.")],
  },
  {
    mode: "worked",
    part: tr("Wie viele Elektronen?", "How many electrons?"),
    say: tr("Im **Kästchenschema** ist jedes Orbital ein Kästchen – je höchstens ↑↓.", "In the **box diagram** each orbital is a box – each at most ↑↓."),
    ask: tr("Wie viele Elektronen fasst eine **p**-Unterschale?", "How many electrons does a **p** subshell hold?"),
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(18)} /></Fit>,
    lines: [tr("p: 3 Orbitale = 3 Kästchen.", "p: 3 orbitals = 3 boxes."), tr("Je Kästchen 2 Elektronen.", "2 electrons per box."), tr("3 · 2 = **6** Elektronen.", "3 · 2 = **6** electrons.")],
    ok: tr("s fasst 2, p 6, d 10, f 14.", "s holds 2, p 6, d 10, f 14."),
  },
  {
    mode: "faded",
    say: tr("Eine Schale n hat n² Orbitale, also höchstens **2n²** Elektronen.", "A shell n has n² orbitals, so at most **2n²** electrons."),
    ask: tr("Ergänze: Wie viele Elektronen fasst die **3. Schale** höchstens?", "Complete: how many electrons can the **3rd shell** hold at most?"), answer: 18, num: {},
    why: { "8": tr("8 sind nur 3s und 3p. Dazu kommt 3d.", "8 is only 3s and 3p. 3d comes on top."), "9": tr("9 sind die Orbitale. Je Orbital passen 2 Elektronen.", "9 is the number of orbitals. Each holds 2 electrons."), "6": tr("6 passen allein in 3p.", "6 fit in 3p alone.") },
    tip: tr("3s (1) + 3p (3) + 3d (5) Orbitale, je 2 Elektronen.", "3s (1) + 3p (3) + 3d (5) orbitals, 2 electrons each."),
    ok: tr("2 · 3² = 18: 3s² 3p⁶ 3d¹⁰.", "2 · 3² = 18: 3s² 3p⁶ 3d¹⁰."),
    lines: [tr("3. Schale: 3s (1) + 3p (3) + 3d (5) = 9 Orbitale.", "3rd shell: 3s (1) + 3p (3) + 3d (5) = 9 orbitals."), tr("Elektronen: 9 · 2 = {?}", "Electrons: 9 · 2 = {?}")],
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Wie viele Elektronen fasst eine **d**-Unterschale?", "Your turn: how many electrons does a **d** subshell hold?"), answer: 10, num: {},
    why: { "5": tr("5 sind die d-Orbitale. Jedes fasst 2 Elektronen.", "5 is the number of d orbitals. Each holds 2 electrons."), "18": tr("18 fasst die ganze 3. Schale (s, p und d).", "18 is the whole 3rd shell (s, p and d).") },
    tip: tr("Zahl der d-Orbitale mal 2.", "Number of d orbitals times 2."),
    lines: [tr("5 Orbitale · 2 = 10 Elektronen.", "5 orbitals · 2 = 10 electrons.")],
    ok: tr("Genau: 10.", "Exactly: 10."),
  },
  {
    mode: "worked",
    part: tr("Energie und Aufbau", "Energy and filling order"),
    say: tr("Im **Energieniveauschema** liegt jede Unterschale auf ihrer Energiestufe.", "In the **energy level diagram** each subshell sits on its energy level."),
    ask: tr("In welcher Reihenfolge werden die Orbitale gefüllt?", "In which order are the orbitals filled?"),
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(10)} /></Fit>,
    lines: [tr("Weiter oben = mehr Energie: 2p liegt über 2s.", "Higher up = more energy: 2p is above 2s."), tr("Reihenfolge: 1s 2s 2p 3s 3p **4s 3d** 4p …", "Order: 1s 2s 2p 3s 3p **4s 3d** 4p …"), tr("**Aufbauprinzip**: jedes Elektron besetzt die tiefste freie Stufe.", "**Aufbau principle**: each electron takes the lowest free level."), tr("Wenige **Ausnahmen** zeigt die Messung: Chrom endet auf 4s¹ 3d⁵ (halb besetzte d-Unterschale), nicht auf 4s² 3d⁴.", "Measurements show a few **exceptions**: chromium ends in 4s¹ 3d⁵ (half-filled d subshell), not in 4s² 3d⁴.")],
    ok: tr("Von unten nach oben auffüllen.", "Fill from the bottom up."),
  },
  {
    mode: "faded",
    say: tr("**Aufbauprinzip**: Elektronen besetzen die Orbitale nach steigender Energie – vom untersten Kästchen nach oben.", "**Aufbau principle**: electrons occupy orbitals in order of increasing energy – from the lowest box upwards."),
    ask: tr("Ergänze: Wohin kommt das 3. Elektron von **Lithium**?", "Complete: where does lithium's 3rd electron go?"), answer: "2s", options: ["2s", "1s", "2p"],
    visual: c => <FillScheme Z={3} upTo={2} reveal={c.solved || c.show} />,
    why: { "1s": tr("1s ist mit 2 Elektronen schon voll.", "1s is already full with 2 electrons."), "2p": tr("2s liegt tiefer als 2p – es kommt zuerst.", "2s is lower than 2p – it comes first.") },
    ok: tr("Li: 1s² 2s¹ – das Außenelektron sitzt in 2s.", "Li: 1s² 2s¹ – the outer electron sits in 2s."),
    lines: [tr("Lithium: 3 Elektronen.", "Lithium: 3 electrons."), tr("1s: ↑↓ – voll.", "1s: ↑↓ – full."), tr("Das 3. Elektron kommt nach {?}", "The 3rd electron goes into {?}")],
  },
  {
    mode: "free",
    say: tr("Achtung: **4s** liegt energetisch tiefer als 3d und wird zuerst gefüllt.", "Careful: **4s** is lower in energy than 3d and is filled first."),
    ask: tr("Im Bild: Argon, 18 Elektronen. Kalium hat eines mehr. Wohin kommt das **19.** Elektron?", "In the picture: argon, 18 electrons. Potassium has one more. Where does the **19th** electron go?"), answer: "4s", options: ["4s", "3d", "4p"],
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(18)} lastIndex={7} /></Fit>,
    why: { "3d": tr("3d liegt höher als 4s – es kommt erst nach 4s dran.", "3d is higher than 4s – it comes after 4s."), "4p": tr("4p kommt erst nach 4s und 3d.", "4p comes only after 4s and 3d.") },
    ok: tr("Kalium: … 3p⁶ 4s¹.", "Potassium: … 3p⁶ 4s¹."),
    lines: [tr("4s liegt tiefer als 3d → Kalium: [Ar] 4s¹.", "4s is lower than 3d → potassium: [Ar] 4s¹.")],
  },
  {
    mode: "worked",
    say: tr("Gleich hohe Kästchen (z. B. die drei 2p) haben dieselbe Energie.", "Boxes at the same height (e.g. the three 2p) have the same energy."),
    ask: tr("Wie verteilen sich 3 Elektronen auf die drei 2p-Kästchen (Stickstoff)?", "How do 3 electrons spread over the three 2p boxes (nitrogen)?"),
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(7)} /></Fit>,
    lines: [tr("**Hund'sche Regel**: gleich hohe Kästchen erst **einzeln** besetzen.", "**Hund's rule**: fill boxes of equal height **singly** first."), tr("Die einzelnen Elektronen haben gleichen Spin.", "The single electrons have the same spin."), tr("Stickstoff 2p³: **↑ ↑ ↑**.", "Nitrogen 2p³: **↑ ↑ ↑**.")],
    ok: tr("Erst einzeln, dann paaren – so stoßen sich die Elektronen am wenigsten ab.", "Singly first, then pair – this way the electrons repel each other least."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie viele **ungepaarte** Elektronen hat Sauerstoff?", "Complete: how many **unpaired** electrons does oxygen have?"), answer: 2, num: {},
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(8)} /></Fit>,
    why: { "4": tr("Das 4. Elektron paart sich mit einem – zähle die Kästchen mit nur einem Pfeil.", "The 4th electron pairs up with one – count the boxes with only one arrow."), "0": tr("In 2p sind zwei Kästchen nur einfach besetzt.", "In 2p two boxes are only singly occupied.") },
    tip: tr("Zähle in 2p die Kästchen mit nur einem Pfeil.", "In 2p count the boxes with only one arrow."),
    ok: tr("2p⁴ = ↑↓ ↑ ↑ → 2 ungepaarte Elektronen.", "2p⁴ = ↑↓ ↑ ↑ → 2 unpaired electrons."),
    lines: [tr("2p⁴: erst drei einzeln – ↑ ↑ ↑.", "2p⁴: three singly first – ↑ ↑ ↑."), tr("Das 4. paart sich – ↑↓ ↑ ↑.", "The 4th pairs up – ↑↓ ↑ ↑."), tr("Ungepaarte Elektronen: {?}", "Unpaired electrons: {?}")],
  },
  {
    mode: "free",
    say: tr("Fülle das Schema selbst: Tippe die Kästchen von **unten nach oben** an (↑, dann ↑↓), bis **15** Elektronen drin sind.", "Fill the diagram yourself: tap the boxes from **bottom to top** (↑, then ↑↓) until **15** electrons are in."),
    ask: tr("Welche Elektronenkonfiguration hat **Phosphor** (Z = 15)?", "What is the electron configuration of **phosphorus** (Z = 15)?"), answer: "1s² 2s² 2p⁶ 3s² 3p³",
    visual: c => <FillScheme Z={15} upTo={6} reveal={c.solved || c.show} />,
    options: ["1s² 2s² 2p⁶ 3s² 3p³", "1s² 2s² 2p⁶ 3p⁵", "1s² 2s² 2p⁶ 3s² 3d³", "1s² 2s⁸ 3s⁵"],
    why: { "1s² 2s² 2p⁶ 3p⁵": tr("3s kommt vor 3p – es wird zuerst gefüllt.", "3s comes before 3p – it is filled first."), "1s² 2s² 2p⁶ 3s² 3d³": tr("Nach 3s folgt 3p, nicht 3d.", "After 3s comes 3p, not 3d."), "1s² 2s⁸ 3s⁵": tr("s fasst nur 2 Elektronen.", "s holds only 2 electrons.") },
    ok: tr("Hochzahlen zusammen: 2 + 2 + 6 + 2 + 3 = 15.", "Superscripts together: 2 + 2 + 6 + 2 + 3 = 15."),
    lines: [tr("1s² 2s² 2p⁶ 3s² 3p³: zusammen 15 Elektronen, 3p nach Hund ↑ ↑ ↑.", "1s² 2s² 2p⁶ 3s² 3p³: 15 electrons in total, 3p by Hund ↑ ↑ ↑.")],
  },
  {
    mode: "worked",
    part: tr("Das Atom in 3D", "The atom in 3D"),
    say: tr("So sieht **Sauerstoff** im Orbitalmodell aus – alle Flächen bei gleicher Elektronendichte.", "This is **oxygen** in the orbital model – all surfaces at the same electron density."),
    ask: tr("Was sieht man beim Sauerstoff-Atom?", "What do you see in the oxygen atom?"),
    visual: () => <AtomView Z={8} />,
    lines: [tr("1s: klein, ganz innen.", "1s: small, right inside."), tr("2s: Kugel um den Kern.", "2s: sphere around the nucleus."), tr("2p: drei Hanteln – sie ragen **über die 2s-Kugel hinaus**.", "2p: three dumbbells – they reach **beyond the 2s sphere**.")],
    ok: tr("Schalte die Orbitale oben ein und aus und dreh das Atom.", "Switch the orbitals on and off at the top and rotate the atom."),
  },
  {
    mode: "faded",
    say: tr("**Kohlenstoff**: 1s² 2s² 2p². Die zwei 2p-Elektronen sitzen nach Hund in zwei verschiedenen p-Orbitalen.", "**Carbon**: 1s² 2s² 2p². By Hund's rule the two 2p electrons sit in two different p orbitals."),
    ask: tr("Ergänze: Wie viele **2p-Orbitale** enthalten bei Kohlenstoff Elektronen?", "Complete: how many **2p orbitals** contain electrons in carbon?"), answer: 2, num: {},
    visual: () => <AtomView Z={6} />,
    why: { "1": tr("Zwei Elektronen gehen nach Hund in zwei Orbitale, nicht in eines.", "By Hund's rule two electrons go into two orbitals, not one."), "3": tr("Für drei Orbitale bräuchte es drei p-Elektronen (Stickstoff).", "Three orbitals would need three p electrons (nitrogen).") },
    tip: tr("Die Schalter oben zeigen alle besetzten Orbitale.", "The switches at the top show all occupied orbitals."),
    ok: tr("Zwei 2p-Orbitale mit je einem Elektron – das dritte bleibt leer.", "Two 2p orbitals with one electron each – the third stays empty."),
    lines: [tr("Kohlenstoff: 2p² – zwei p-Elektronen.", "Carbon: 2p² – two p electrons."), tr("Nach Hund: jedes in ein eigenes p-Orbital.", "By Hund: each in its own p orbital."), tr("Besetzte 2p-Orbitale: {?}", "Occupied 2p orbitals: {?}")],
  },
  {
    mode: "free",
    say: tr("**Eisen** (Fe): [Ar] 4s² 3d⁶. Die 3d-Orbitale haben meist vier Lappen. Schalte 4s dazu: 3d liegt weit innen.", "**Iron** (Fe): [Ar] 4s² 3d⁶. Most 3d orbitals have four lobes. Switch on 4s: 3d lies far inside."),
    ask: tr("Wie viele 3d-Orbitale sind bei Eisen nur **einfach** besetzt?", "How many 3d orbitals are only **singly** occupied in iron?"), answer: 4, num: {},
    visual: () => <AtomView Z={26} only={["4s", "3d"]} initial={["3dxy", "3dxz", "3dyz", "3dx2-y2", "3dz2"]} spins={false} />,
    why: { "6": tr("6 sind alle 3d-Elektronen. Eines davon paart sich.", "6 is all the 3d electrons. One of them pairs up."), "5": tr("Das 6. Elektron paart sich mit einem – dann sind es 4 einzelne.", "The 6th electron pairs with one – then 4 are single.") },
    tip: tr("Hund: erst 5 einzeln, das nächste paart sich.", "Hund: 5 singly first, the next one pairs."),
    ok: tr("Genau: 4 ungepaarte Elektronen.", "Exactly: 4 unpaired electrons."),
    lines: [tr("3d⁶ = ↑↓ ↑ ↑ ↑ ↑ → 4 einzeln.", "3d⁶ = ↑↓ ↑ ↑ ↑ ↑ → 4 single.")],
  },
  {
    mode: "worked",
    part: tr("Kurzschreibweise und PSE", "Short notation and periodic table"),
    say: tr("Kurzschreibweise: der **Edelgaskern** in eckigen Klammern ersetzt alle inneren Elektronen.", "Short notation: the **noble gas core** in square brackets replaces all inner electrons."),
    ask: tr("Wie schreibt man **Natrium** (Z = 11) kurz?", "How do you write **sodium** (Z = 11) in short?"),
    lines: [tr("Natrium: 1s² 2s² 2p⁶ 3s¹.", "Sodium: 1s² 2s² 2p⁶ 3s¹."), tr("1s² 2s² 2p⁶ ist Neon (10 Elektronen) → [Ne].", "1s² 2s² 2p⁶ is neon (10 electrons) → [Ne]."), tr("Kurz: **[Ne] 3s¹**.", "In short: **[Ne] 3s¹**.")],
    ok: tr("Edelgas davor, dann nur die äußeren Elektronen.", "Noble gas first, then only the outer electrons."),
  },
  {
    mode: "faded",
    say: tr("Kurzschreibweise: der **Edelgaskern** in eckigen Klammern ersetzt alle inneren Elektronen.", "Short notation: the **noble gas core** in square brackets replaces all inner electrons."),
    ask: tr("Ergänze: Wie schreibt man Kalium (Z = 19) kurz?", "Complete: how do you write potassium (Z = 19) in short?"), answer: "[Ar] 4s¹", options: ["[Ar] 4s¹", "[Ne] 4s¹", "[Ar] 3d¹", "[Kr] 4s¹"],
    why: { "[Ne] 4s¹": tr("Nach Neon fehlen noch 3s und 3p – der nächste Edelgaskern ist Argon (18).", "After neon, 3s and 3p are still missing – the next noble gas core is argon (18)."), "[Ar] 3d¹": tr("Nach Argon kommt zuerst 4s.", "After argon comes 4s first."), "[Kr] 4s¹": tr("Krypton (36) hat mehr Elektronen als Kalium.", "Krypton (36) has more electrons than potassium.") },
    ok: tr("[Ar] = die 18 Elektronen von Argon, dazu 4s¹.", "[Ar] = the 18 electrons of argon, plus 4s¹."),
    lines: [tr("Kalium: 19 Elektronen; die ersten 18 wie Argon → [Ar].", "Potassium: 19 electrons; the first 18 like argon → [Ar]."), tr("Das 19. kommt nach 4s (tiefer als 3d).", "The 19th goes into 4s (lower than 3d)."), tr("Kurz: {?}", "In short: {?}")],
  },
  {
    mode: "free",
    say: tr("Der **Block** sagt, welche Unterschale zuletzt gefüllt wird: s (Gruppe 1–2), d (3–12, die **Übergangsmetalle**), p (13–18), f (Lanthanoide).", "The **block** tells you which subshell is filled last: s (groups 1–2), d (3–12, the **transition metals**), p (13–18), f (lanthanoids)."),
    ask: tr("In welchem Block steht **Eisen** (Fe, Gruppe 8)?", "Which block is **iron** (Fe, group 8) in?"), answer: tr("d-Block", "d block"), options: [tr("s-Block", "s block"), tr("p-Block", "p block"), tr("d-Block", "d block"), tr("f-Block", "f block")],
    visual: c => <Pse c={c} stufe="os" mark={26} blocks />,
    why: { [tr("s-Block", "s block")]: tr("s-Block sind nur die Gruppen 1 und 2.", "The s block is only groups 1 and 2."), [tr("p-Block", "p block")]: tr("p-Block sind die Gruppen 13–18.", "The p block is groups 13–18."), [tr("f-Block", "f block")]: tr("f-Block sind Lanthanoide und Actinoide.", "The f block is the lanthanoids and actinoids.") },
    ok: tr("Eisen: [Ar] 4s² 3d⁶ – zuletzt wird 3d gefüllt.", "Iron: [Ar] 4s² 3d⁶ – 3d is filled last."),
    lines: [tr("Zuletzt gefüllt: 3d → d-Block (Gruppen 3–12).", "Filled last: 3d → d block (groups 3–12).")],
  },
  {
    mode: "free",
    say: tr("Aus der Konfiguration liest du die Stelle im PSE: höchste Schale = **Periode**.", "From the configuration you can read the place in the periodic table: highest shell = **period**."),
    ask: tr("Welches Element hat **[Ne] 3s² 3p⁴**? Tippe es an.", "Which element has **[Ne] 3s² 3p⁴**? Tap it."), answer: "16",
    visual: c => <Pse c={c} stufe="os" answer={16} />,
    tip: tr("Höchstes n = Periode. Im p-Block gilt: Außenelektronen + 10 = Gruppe.", "Highest n = period. In the p block: outer electrons + 10 = group."),
    ok: tr("3. Periode, 2 + 4 = 6 Außenelektronen → Gruppe 16: Schwefel.", "Period 3, 2 + 4 = 6 outer electrons → group 16: sulfur."),
    lines: [tr("Höchstes n = 3 → 3. Periode; 2 + 4 = 6 Außenelektronen → Gruppe 16: Schwefel.", "Highest n = 3 → period 3; 2 + 4 = 6 outer electrons → group 16: sulfur.")],
  },
  {
    mode: "worked",
    part: tr("Ionen", "Ions"),
    say: tr("Hauptgruppen-Atome bilden Ionen mit **Edelgaskonfiguration**.", "Main group atoms form ions with a **noble gas configuration**."),
    ask: tr("Welches Ion bildet **Natrium** ([Ne] 3s¹)?", "Which ion does **sodium** ([Ne] 3s¹) form?"),
    lines: [tr("Natrium gibt das eine 3s-Elektron ab.", "Sodium loses its one 3s electron."), tr("Übrig: [Ne] – wie das Edelgas Neon.", "Left: [Ne] – like the noble gas neon."), tr("11 Protonen, 10 Elektronen → **Na⁺**, ein **Kation**.", "11 protons, 10 electrons → **Na⁺**, a **cation**.")],
    ok: tr("Gruppe 1, 2, 13 geben 1, 2, 3 ab; Gruppe 15, 16, 17 nehmen 3, 2, 1 auf.", "Groups 1, 2, 13 lose 1, 2, 3; groups 15, 16, 17 gain 3, 2, 1."),
  },
  {
    mode: "faded",
    say: tr("Hauptgruppen-Atome bilden Ionen mit **Edelgaskonfiguration**: Gruppe 1, 2, 13 geben 1, 2, 3 Elektronen ab; Gruppe 15, 16, 17 nehmen 3, 2, 1 auf.", "Main group atoms form ions with a **noble gas configuration**: groups 1, 2, 13 lose 1, 2, 3 electrons; groups 15, 16, 17 gain 3, 2, 1."),
    ask: tr("Ergänze: Welches Ion bildet **Aluminium**?", "Complete: which ion does **aluminium** form?"), answer: "Al³⁺", options: ["Al³⁺", "Al³⁻", "Al⁺", "Al⁵⁻"],
    why: { "Al³⁻": tr("Aluminium ist ein Metall – es gibt seine 3 Außenelektronen ab.", "Aluminium is a metal – it loses its 3 outer electrons."), "Al⁺": tr("Alle 3 Außenelektronen gehen weg.", "All 3 outer electrons go."), "Al⁵⁻": tr("5 aufnehmen ist viel mehr als 3 abgeben.", "Gaining 5 is much more than losing 3.") },
    ok: tr("Al³⁺ hat 10 Elektronen – wie Neon.", "Al³⁺ has 10 electrons – like neon."),
    lines: [tr("Aluminium: [Ne] 3s² 3p¹ – 3 Außenelektronen.", "Aluminium: [Ne] 3s² 3p¹ – 3 outer electrons."), tr("Alle 3 abgeben → [Ne].", "Lose all 3 → [Ne]."), tr("Ion: {?}", "Ion: {?}")],
  },
  {
    mode: "free",
    say: tr("Teilchen mit gleicher Elektronenkonfiguration heißen **isoelektronisch**.", "Particles with the same electron configuration are called **isoelectronic**."),
    ask: tr("Welches Teilchen hat dieselbe Konfiguration wie **Neon** (10 Elektronen)?", "Which particle has the same configuration as **neon** (10 electrons)?"), answer: "Mg²⁺", options: ["Mg²⁺", "Mg", "Na", "Cl⁻"],
    why: { Mg: tr("Magnesium-Atom: 12 Elektronen.", "Magnesium atom: 12 electrons."), Na: tr("Natrium-Atom: 11 Elektronen.", "Sodium atom: 11 electrons."), "Cl⁻": tr("Cl⁻ hat 18 Elektronen – wie Argon.", "Cl⁻ has 18 electrons – like argon.") },
    ok: tr("Mg²⁺: 12 − 2 = 10 Elektronen.", "Mg²⁺: 12 − 2 = 10 electrons."),
    lines: [tr("Mg²⁺: 12 − 2 = 10 Elektronen = [Ne] → isoelektronisch mit Neon.", "Mg²⁺: 12 − 2 = 10 electrons = [Ne] → isoelectronic with neon.")],
  },
  {
    mode: "worked",
    say: tr("Bei Übergangsmetallen gilt: Kationen geben zuerst die Elektronen der **äußersten** Schale ab.", "For transition metals: cations first lose the electrons of the **outermost** shell."),
    ask: tr("Welche Konfiguration hat **Fe²⁺**?", "What is the configuration of **Fe²⁺**?"),
    lines: [tr("Eisen: [Ar] 4s² 3d⁶.", "Iron: [Ar] 4s² 3d⁶."), tr("Äußerste Schale ist n = 4 → die 2 Elektronen kommen aus **4s**.", "The outermost shell is n = 4 → the 2 electrons come from **4s**."), tr("Fe²⁺ = **[Ar] 3d⁶**.", "Fe²⁺ = **[Ar] 3d⁶**.")],
    ok: tr("Gefüllt wird 4s vor 3d – abgegeben aber auch 4s zuerst.", "4s is filled before 3d – but 4s is also lost first."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Welche Konfiguration hat **Fe³⁺**?", "Complete: what is the configuration of **Fe³⁺**?"), answer: "[Ar] 3d⁵", options: ["[Ar] 3d⁵", "[Ar] 4s² 3d³", "[Ar] 4s¹ 3d⁴"],
    lines: [tr("Fe²⁺: [Ar] 3d⁶ – 4s ist schon leer.", "Fe²⁺: [Ar] 3d⁶ – 4s is already empty."), tr("Das dritte Elektron kommt jetzt aus 3d.", "The third electron now comes from 3d."), tr("Fe³⁺ = {?}", "Fe³⁺ = {?}")],
    why: { "[Ar] 4s² 3d³": tr("4s ist die äußerste Schale – diese Elektronen gehen zuerst.", "4s is the outer shell – these electrons go first."), "[Ar] 4s¹ 3d⁴": tr("Beide 4s-Elektronen gehen vor den 3d-Elektronen.", "Both 4s electrons go before the 3d electrons.") },
    ok: tr("Fe³⁺ = [Ar] 3d⁵ – halb besetzte d-Unterschale.", "Fe³⁺ = [Ar] 3d⁵ – half-filled d subshell."),
  },
];

export function guideFor(stufe: "us" | "os"): GuideDef {
  return stufe === "us"
    ? { title: tr("Atombau", "Atomic Structure"), steps: US, outro: [
      tr("Ein Atom hat **Protonen** und **Neutronen** im Kern, **Elektronen** in der Hülle.", "An atom has **protons** and **neutrons** in the nucleus, **electrons** in the shells."),
      tr("**Ordnungszahl** = Protonen = Elektronen (im Atom). **Massenzahl** = Protonen + Neutronen.", "**Atomic number** = protons = electrons (in an atom). **Mass number** = protons + neutrons."),
      tr("Schalen: 2 · 8 · 8 … **Periode** = Schalen, **Hauptgruppe** = Außenelektronen.", "Shells: 2 · 8 · 8 … **period** = shells, **main group** = outer electrons."),
      tr("**Ionen**: Elektronen abgeben (+) oder aufnehmen (−) bis zur vollen Schale.", "**Ions**: lose (+) or gain (−) electrons until the shell is full."),
      tr("**Isotope**: gleiche Protonenzahl, verschiedene Neutronenzahl.", "**Isotopes**: same proton number, different neutron number."),
    ] }
    : { title: tr("Atombau", "Atomic Structure"), steps: OS, outro: [
      tr("Atomsymbol lesen: Massenzahl, Ordnungszahl, Ladung → p, n, e.", "Reading the nuclide symbol: mass number, atomic number, charge → p, n, e."),
      tr("Elektronen verhalten sich wie **Wellen**: kein Ort, keine Bahn – nur Aufenthaltswahrscheinlichkeit |ψ|². **Orbital** = Raum mit 90 % davon, höchstens 2 Elektronen (**Pauli**).", "Electrons behave like **waves**: no position, no path – only probability |ψ|². **Orbital** = region with 90 % of it, at most 2 electrons (**Pauli**)."),
      tr("Quantenzahlen: **n** Größe/Schale, **l** Form (s Kugel, p Hantel, d Rosette), **m** Ausrichtung (1 s, 3 p, 5 d), **s** Spin ↑↓. Schale n fasst 2n² Elektronen.", "Quantum numbers: **n** size/shell, **l** shape (s sphere, p dumbbell, d cloverleaf), **m** orientation (1 s, 3 p, 5 d), **s** spin ↑↓. Shell n holds 2n² electrons."),
      tr("Aufbauprinzip 1s 2s 2p 3s 3p **4s 3d** 4p … (wenige Ausnahmen wie Cr, Cu); **Hund'sche Regel**: gleichwertige Orbitale erst einzeln, dann gepaart.", "Aufbau principle 1s 2s 2p 3s 3p **4s 3d** 4p … (a few exceptions such as Cr, Cu); **Hund's rule**: equivalent orbitals singly first, then paired."),
      tr("Kurzschreibweise mit Edelgaskern; s-, p-, d-, f-Block; Periode und Gruppe aus der Konfiguration.", "Short notation with noble gas core; s, p, d, f block; period and group from the configuration."),
      tr("Ionen: Edelgaskonfiguration, Kationen geben 4s vor 3d ab, isoelektronische Teilchen.", "Ions: noble gas configuration, cations lose 4s before 3d, isoelectronic particles."),
    ] };
}
