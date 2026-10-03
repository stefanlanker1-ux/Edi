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
  {
    part: tr("Kern und Hülle", "Nucleus and shell"),
    say: tr("Jedes Atom hat einen **Kern** aus Protonen (rot) und Neutronen (grau). Um den Kern bewegen sich **Elektronen** (blau).", "Every atom has a **nucleus** of protons (red) and neutrons (grey). **Electrons** (blue) move around the nucleus."),
    ask: tr("Tippe auf ein **Elektron**.", "Tap an **electron**."), answer: "electron",
    visual: c => <BohrPick c={c} Z={6} N={6} E={6} target="electron" />,
    why: { proton: tr("Das ist ein Proton – es sitzt im Kern.", "That is a proton – it sits in the nucleus."), neutron: tr("Das ist ein Neutron – es sitzt im Kern.", "That is a neutron – it sits in the nucleus.") },
    tip: tr("Elektronen sind blau und liegen außen auf den Ringen, nicht im Kern.", "Electrons are blue and lie outside on the rings, not in the nucleus."),
    labels: [{"at": ".bohr .nuc", "text": tr("Kern", "Nucleus"), "side": "left", "point": "left"}, {"at": ".bohr .ring", "text": tr("Hülle", "Shells"), "nth": -1, "point": "ne", "side": "top"}, {"at": ".bohr .el", "text": tr("Elektron", "Electron"), "side": "right", "afterSolved": true}],
    ok: tr("Elektronen sind in der Hülle, Protonen und Neutronen im Kern.", "Electrons are in the shells, protons and neutrons in the nucleus."),
  },
  {
    say: tr("Die Zahl der **Protonen** bestimmt, welches Element es ist.", "The number of **protons** decides which element it is."),
    ask: tr("Das ist der Kern, vergrößert. Zähle die roten **Protonen** (+). Wie viele sind es?", "This is the nucleus, enlarged. Count the red **protons** (+). How many are there?"), answer: 6, num: {},
    visual: () => <Nucleus p={6} n={6} />,
    why: { "12": tr("12 sind alle Teilchen im Kern. Zähle nur die roten (mit +).", "12 are all the particles in the nucleus. Count only the red ones (with +)."), "18": tr("Zähle nur die roten Teilchen im Kern.", "Count only the red particles in the nucleus.") },
    tip: tr("Zähle nur die roten Kugeln mit + – die grauen sind Neutronen.", "Count only the red balls with + – the grey ones are neutrons."),
    labels: [{"at": ".ab-g-np.proton", "text": "Proton", "side": "left"}, {"at": ".ab-g-np.neutron", "text": "Neutron", "side": "right"}],
    ok: tr("6 Protonen – damit ist es Kohlenstoff.", "6 protons – so it is carbon."),
  },
  {
    say: tr("Im Periodensystem steht **unten links** vor jedem Symbol die **Ordnungszahl** = Zahl der Protonen.", "In the periodic table the **atomic number** = number of protons is at the **bottom left** of each symbol."),
    ask: tr("Tippe das Element mit **6 Protonen** an.", "Tap the element with **6 protons**."), answer: "6",
    visual: c => <Pse c={c} stufe="us" answer={6} />,
    tip: tr("Die kleine Zahl unten links vor dem Symbol ist die Ordnungszahl.", "The small number at the bottom left of the symbol is the atomic number."),
    ok: tr("Ordnungszahl = Protonenzahl: 6 → Kohlenstoff (C).", "Atomic number = proton number: 6 → carbon (C)."),
  },
  {
    say: tr("Protonen sind **positiv** (+), Elektronen **negativ** (−). Ein Atom hat gleich viele – es ist **neutral**.", "Protons are **positive** (+), electrons **negative** (−). An atom has equal numbers – it is **neutral**."),
    ask: tr("Wie viele **Elektronen** hat ein Kohlenstoff-Atom?", "How many **electrons** does a carbon atom have?"), answer: 6, num: {},
    visual: () => <BohrOnly Z={6} N={6} E={6} />,
    why: { "12": tr("12 ist Protonen + Neutronen. Elektronen gibt es so viele wie Protonen.", "12 is protons + neutrons. There are as many electrons as protons.") },
    tip: tr("Im neutralen Atom gleichen sich Plus und Minus aus.", "In a neutral atom plus and minus balance out."),
    labels: [{"at": ".bohr .nuc", "text": tr("Kern", "Nucleus"), "side": "left", "point": "left"}, {"at": ".bohr .el", "text": tr("Elektron", "Electron"), "side": "right"}],
    ok: tr("Neutrales Atom: Elektronen = Protonen = Ordnungszahl, bei Kohlenstoff 6.", "Neutral atom: electrons = protons = atomic number, 6 for carbon."),
  },
  {
    say: tr("Elektronen sind fast masselos. **Massenzahl = Protonen + Neutronen.**", "Electrons have almost no mass. **Mass number = protons + neutrons.**"),
    ask: tr("Stickstoff hat **7 Protonen** und **7 Neutronen**. Wie groß ist die Massenzahl?", "Nitrogen has **7 protons** and **7 neutrons**. What is the mass number?"), answer: 14, num: {},
    visual: () => <BohrOnly Z={7} N={7} E={7} />,
    why: { "21": tr("Elektronen zählen nicht mit – nur Protonen und Neutronen.", "Electrons do not count – only protons and neutrons."), "7": tr("Zähle Protonen **und** Neutronen zusammen.", "Add protons **and** neutrons.") },
    tip: tr("Zähle alle Teilchen im Kern zusammen.", "Add up all particles in the nucleus."),
    labels: [{"at": ".bohr .nuc", "text": tr("Kern: Protonen + Neutronen", "Nucleus: protons + neutrons"), "side": "left", "point": "left"}],
    ok: tr("Massenzahl = Protonen + Neutronen = 7 + 7 = 14 (Stickstoff-14).", "Mass number = protons + neutrons = 7 + 7 = 14 (nitrogen-14)."),
  },
  {
    part: tr("Schalen", "Shells"),
    say: tr("Die Elektronen sitzen auf **Schalen**: in die 1. Schale passen **2**, in die 2. Schale **8**, dann geht es auf der 3. weiter.", "The electrons sit on **shells**: the 1st shell holds **2**, the 2nd shell **8**, then the 3rd shell continues."),
    ask: tr("Fluor hat 9 Elektronen. 2 sind auf der 1. Schale. Wie viele kommen auf die **2. Schale**?", "Fluorine has 9 electrons. 2 are on the 1st shell. How many go on the **2nd shell**?"), answer: 7, num: {},
    visual: () => <BohrOnly Z={9} N={10} E={9} shells={[2, 0]} />,
    why: { "8": tr("Fluor hat nur 9 Elektronen: 9 − 2 = 7.", "Fluorine only has 9 electrons: 9 − 2 = 7."), "9": tr("2 sind schon auf der 1. Schale.", "2 are already on the 1st shell.") },
    tip: tr("Ziehe die Elektronen der 1. Schale von allen Elektronen ab.", "Subtract the electrons of the 1st shell from all electrons."),
    labels: [{"at": ".bohr .ring", "text": tr("1. Schale", "1st shell"), "nth": 0, "point": "nw", "side": "top"}, {"at": ".bohr .ring", "text": tr("2. Schale", "2nd shell"), "nth": 1, "point": "ne", "side": "top"}],
    ok: tr("Fluor: 2 · 7. Die 2. Schale ist die äußerste.", "Fluorine: 2 · 7. The 2nd shell is the outer shell."),
  },
  {
    say: tr("Die Elektronen auf der äußersten Schale heißen **Außenelektronen**.", "The electrons on the outer shell are called **outer electrons**."),
    ask: tr("Wie viele Außenelektronen hat **Natrium**?", "How many outer electrons does **sodium** have?"), answer: 1, num: {},
    visual: () => <BohrOnly Z={11} N={12} E={11} />,
    why: { "11": tr("11 sind alle Elektronen. Zähle nur die äußerste Schale.", "11 are all the electrons. Count only the outer shell."), "8": tr("8 sind auf der 2. Schale – die äußerste ist die 3.", "8 are on the 2nd shell – the outer one is the 3rd.") },
    tip: tr("Zähle nur die Punkte auf dem äußersten Ring.", "Count only the dots on the outer ring."),
    labels: [{"at": ".bohr .ring", "text": tr("äußerste Schale", "outer shell"), "nth": -1, "point": "ne", "side": "top"}],
    ok: tr("Natrium: 2 · 8 · 1 – also 1 Außenelektron.", "Sodium: 2 · 8 · 1 – so 1 outer electron."),
  },
  {
    say: tr("Im Periodensystem gilt: **Periode** (Zeile) = Zahl der Schalen, **Hauptgruppe** (Spalte) = Zahl der Außenelektronen.", "In the periodic table: **period** (row) = number of shells, **main group** (column) = number of outer electrons."),
    ask: tr("Schwefel hat **3 Schalen** und **6 Außenelektronen**. Tippe Schwefel an.", "Sulfur has **3 shells** and **6 outer electrons**. Tap sulfur."), answer: "16",
    visual: c => <Pse c={c} stufe="us" answer={16} />,
    tip: tr("Zeile = Zahl der Schalen, Spalte = Zahl der Außenelektronen.", "Row = number of shells, column = number of outer electrons."),
    ok: tr("Schwefel: 3. Periode, VI. Hauptgruppe.", "Sulfur: period 3, main group VI."),
  },
  {
    say: tr("So liest du ab, ohne zu zeichnen.", "This is how to read it off without drawing."),
    ask: tr("Wie viele Außenelektronen hat **Calcium**? Schau, in welcher Hauptgruppe es steht.", "How many outer electrons does **calcium** have? Look at which main group it is in."), answer: 2, num: {},
    visual: c => <Pse c={c} stufe="us" mark={20} />,
    why: { "20": tr("20 ist die Ordnungszahl. Die Hauptgruppe sagt die Außenelektronen.", "20 is the atomic number. The main group tells you the outer electrons."), "4": tr("4 ist die Periode (Schalen). Gesucht ist die Hauptgruppe.", "4 is the period (shells). You need the main group.") },
    tip: tr("Lies die römische Zahl über der Spalte von Calcium ab.", "Read the Roman numeral above calcium's column."),
    ok: tr("II. Hauptgruppe → 2 Außenelektronen.", "Main group II → 2 outer electrons."),
  },
  {
    part: tr("Ionen", "Ions"),
    say: tr("Bei Reaktionen geben Atome Außenelektronen ab oder nehmen welche auf. Danach ist die äußerste Schale **voll** wie bei einem Edelgas (**Edelgaszustand**).", "In reactions atoms lose or gain outer electrons. Afterwards the outer shell is **full** like in a noble gas (**noble gas configuration**)."),
    ask: tr("Natrium hat 1 Außenelektron. Was passiert bei einer Reaktion?", "Sodium has 1 outer electron. What happens in a reaction?"), answer: tr("Es gibt 1 Elektron ab.", "It loses 1 electron."),
    options: [tr("Es gibt 1 Elektron ab.", "It loses 1 electron."), tr("Es nimmt 7 Elektronen auf.", "It gains 7 electrons.")],
    visual: c => <BohrOnly Z={11} N={12} E={c.solved ? 10 : 11} />,
    why: { [tr("Es nimmt 7 Elektronen auf.", "It gains 7 electrons.")]: tr("Metalle wie Natrium geben ihre wenigen Außenelektronen ab – 1 statt 7 Elektronen umzuordnen.", "Metals like sodium lose their few outer electrons – moving 1 electron instead of 7.") },
    ok: tr("Natrium gibt 1 Elektron ab. Dann ist die volle 2. Schale (8) außen.", "Sodium loses 1 electron. Then the full 2nd shell (8) is on the outside."),
  },
  {
    say: tr("Jetzt hat Natrium 11 Protonen (+), aber nur 10 Elektronen (−). Geladene Teilchen heißen **Ionen**.", "Now sodium has 11 protons (+) but only 10 electrons (−). Charged particles are called **ions**."),
    ask: tr("Welche Ladung hat dieses Teilchen?", "What is the charge of this particle?"), answer: "1+", options: ["1+", "1−", tr("neutral", "neutral"), "11+"],
    visual: () => <BohrOnly Z={11} N={12} E={10} />,
    why: { "1−": tr("Es fehlt ein Elektron (−) – also bleibt ein Plus übrig.", "One electron (−) is missing – so one plus is left over."), neutral: tr("11 Plus, 10 Minus: ein Plus bleibt übrig.", "11 plus, 10 minus: one plus is left over."), "11+": tr("Die 10 Elektronen gleichen 10 Protonen aus.", "The 10 electrons balance 10 protons.") },
    labels: [{"at": ".bohr .nuc", "text": tr("Kern: 11 Protonen", "Nucleus: 11 protons"), "side": "left", "point": "left"}],
    ok: tr("Natrium-Ion **Na⁺**: ein Elektron weniger als Protonen.", "Sodium ion **Na⁺**: one electron fewer than protons."),
  },
  {
    say: tr("Atome mit 5, 6 oder 7 Außenelektronen **nehmen** Elektronen auf und werden negativ.", "Atoms with 5, 6 or 7 outer electrons **gain** electrons and become negative."),
    ask: tr("Welches Ion bildet **Chlor** (VII. Hauptgruppe, 7 Außenelektronen)?", "Which ion does **chlorine** form (main group VII, 7 outer electrons)?"), answer: "Cl⁻", options: ["Cl⁻", "Cl⁺", "Cl⁷⁺", "Cl²⁻"],
    visual: () => <BohrOnly Z={17} N={18} E={17} />,
    why: { "Cl⁺": tr("Chlor fehlt 1 Elektron bis 8 – es nimmt eines auf.", "Chlorine is 1 electron short of 8 – it gains one."), "Cl⁷⁺": tr("7 abgeben ist viel schwerer als 1 aufnehmen.", "Losing 7 is much harder than gaining 1."), "Cl²⁻": tr("Chlor fehlt nur 1 Elektron bis 8.", "Chlorine is only 1 electron short of 8.") },
    labels: [{"at": ".bohr .ring", "text": tr("äußerste Schale", "outer shell"), "nth": -1, "point": "ne", "side": "top"}],
    ok: tr("Chlorid-Ion **Cl⁻**: ein Elektron mehr als Protonen.", "Chloride ion **Cl⁻**: one electron more than protons."),
  },
  {
    part: tr("Isotope", "Isotopes"),
    say: tr("Atome eines Elements haben immer gleich viele Protonen, aber manchmal verschieden viele **Neutronen**: **Isotope**. Die Zahl im Namen ist die Massenzahl.", "Atoms of one element always have the same number of protons but sometimes different numbers of **neutrons**: **isotopes**. The number in the name is the mass number."),
    ask: tr("Chlor hat 17 Protonen. Wie viele Neutronen hat **Chlor-37**?", "Chlorine has 17 protons. How many neutrons does **chlorine-37** have?"), answer: 20, num: {},
    visual: () => <Center><Nuclide Z={17} N={20} E={17} size="xl" /></Center>,
    why: { "37": tr("37 ist die Massenzahl: 37 − 17 = ?", "37 is the mass number: 37 − 17 = ?"), "17": tr("17 sind die Protonen. Neutronen = 37 − 17.", "17 are the protons. Neutrons = 37 − 17.") },
    tip: tr("Neutronen = Massenzahl − Protonen.", "Neutrons = mass number − protons."),
    labels: [{"at": ".nu-a", "text": tr("Massenzahl", "Mass number"), "side": "top", "point": "top"}, {"at": ".nu-z", "text": tr("Ordnungszahl", "Atomic number"), "side": "bottom", "point": "bottom"}],
    ok: tr("Neutronen = Massenzahl − Protonenzahl: 37 − 17 = 20.", "Neutrons = mass number − proton number: 37 − 17 = 20."),
  },
  {
    ask: tr("**Chlor-35** und **Chlor-37** sind Isotope. Was haben sie gemeinsam?", "**Chlorine-35** and **chlorine-37** are isotopes. What do they have in common?"), answer: tr("die Protonenzahl", "the number of protons"),
    options: [tr("die Protonenzahl", "the number of protons"), tr("die Neutronenzahl", "the number of neutrons"), tr("die Massenzahl", "the mass number")],
    visual: () => <Center><Nuclide Z={17} N={18} E={17} size="lg" /><Nuclide Z={17} N={20} E={17} size="lg" /></Center>,
    why: { [tr("die Neutronenzahl", "the number of neutrons")]: tr("18 und 20 Neutronen – darin unterscheiden sie sich.", "18 and 20 neutrons – that is how they differ."), [tr("die Massenzahl", "the mass number")]: tr("35 und 37 – darin unterscheiden sie sich.", "35 and 37 – that is how they differ.") },
    ok: tr("Gleiche Protonenzahl = gleiches Element. Verschieden ist nur die Neutronenzahl.", "Same proton number = same element. Only the neutron number differs."),
  },
];

const OS: GuideStep[] = [
  // ── Atomsymbol ────────────────────────────────────────────────────────────
  {
    part: tr("Atomsymbol", "Nuclide symbol"),
    say: tr("Atomsymbol: oben links die **Massenzahl** (Protonen + Neutronen), unten links die **Ordnungszahl** (Protonen).", "Nuclide symbol: **mass number** (protons + neutrons) at the top left, **atomic number** (protons) at the bottom left."),
    ask: tr("Wie viele **Neutronen** hat dieses Atom?", "How many **neutrons** does this atom have?"), answer: 20, num: {},
    visual: () => <Center><Nuclide Z={17} N={20} E={17} size="xl" /></Center>,
    why: { "37": tr("37 ist die Massenzahl. Neutronen = 37 − 17.", "37 is the mass number. Neutrons = 37 − 17."), "17": tr("17 sind die Protonen.", "17 are the protons.") },
    tip: tr("Neutronen = Massenzahl (oben) − Ordnungszahl (unten).", "Neutrons = mass number (top) − atomic number (bottom)."),
    labels: [{"at": ".nu-a", "text": tr("Massenzahl", "Mass number"), "side": "top", "point": "top"}, {"at": ".nu-z", "text": tr("Ordnungszahl", "Atomic number"), "side": "bottom", "point": "bottom"}],
    ok: tr("37 − 17 = 20 Neutronen (Chlor-37, ein Isotop).", "37 − 17 = 20 neutrons (chlorine-37, an isotope)."),
  },
  {
    say: tr("Rechts oben steht die **Ladung**. Elektronen = Protonen − Ladung.", "The **charge** is at the top right. Electrons = protons − charge."),
    ask: tr("Wie viele **Elektronen** hat dieses Teilchen?", "How many **electrons** does this particle have?"), answer: 18, num: {},
    visual: () => <Center><Nuclide Z={16} N={16} E={18} size="xl" /></Center>,
    why: { "14": tr("2− heißt: zwei Elektronen **mehr** als Protonen.", "2− means: two electrons **more** than protons."), "16": tr("Das Teilchen ist geladen (2−) – es hat mehr Elektronen als Protonen.", "The particle is charged (2−) – it has more electrons than protons.") },
    tip: tr("Eine negative Ladung heißt: mehr Elektronen als Protonen.", "A negative charge means: more electrons than protons."),
    labels: [{"at": ".nu-z", "text": tr("Ordnungszahl", "Atomic number"), "side": "bottom", "point": "bottom"}, {"at": ".nu-q", "text": tr("Ladung", "Charge"), "side": "right"}],
    ok: tr("16 − (−2) = 18 Elektronen: das Sulfid-Ion S²⁻.", "16 − (−2) = 18 electrons: the sulfide ion S²⁻."),
  },

  // ── Grenzen des Schalenmodells ───────────────────────────────────────────────
  {
    part: tr("Grenzen des Schalenmodells", "Limits of the shell model"),
    say: tr("Im **Schalenmodell** kreisen Elektronen auf festen Bahnen um den Kern. In die 1. Schale passen 2, in die 2. Schale 8 Elektronen.", "In the **shell model**, electrons circle the nucleus on fixed paths. The 1st shell holds 2, the 2nd shell 8 electrons."),
    ask: tr("Wie viele Elektronen hat Sauerstoff auf der **2. Schale**?", "How many electrons does oxygen have in the **2nd shell**?"), answer: 6, num: {},
    visual: () => <BohrOnly Z={8} N={8} E={8} />,
    why: { "8": tr("8 ist die Ordnungszahl. 2 davon sitzen auf der 1. Schale.", "8 is the atomic number. 2 of them sit in the 1st shell."), "2": tr("2 sitzen auf der 1. Schale. Zähle die äußeren.", "2 sit in the 1st shell. Count the outer ones.") },
    tip: tr("Sauerstoff hat 8 Elektronen. Die 1. Schale ist mit 2 voll.", "Oxygen has 8 electrons. The 1st shell is full with 2."),
    ok: tr("8 − 2 = 6 Außenelektronen.", "8 − 2 = 6 outer electrons."),
  },
  {
    say: tr("Das Schalenmodell erklärt Ionen und Gruppen gut. Doch es sagt nichts über die **Form** von Molekülen – etwa warum Wasser gewinkelt ist.", "The shell model explains ions and groups well. But it says nothing about the **shape** of molecules – such as why water is bent."),
    ask: tr("Was kann das Schalenmodell **nicht** erklären?", "What can the shell model **not** explain?"), answer: tr("die räumliche Form von Molekülen", "the spatial shape of molecules"),
    options: [tr("die räumliche Form von Molekülen", "the spatial shape of molecules"), tr("dass Natrium ein Elektron abgibt", "that sodium loses one electron"), tr("dass Atome einen Kern haben", "that atoms have a nucleus")],
    why: { [tr("dass Natrium ein Elektron abgibt", "that sodium loses one electron")]: tr("Das erklärt das Schalenmodell: 1 Außenelektron, danach volle Schale.", "The shell model explains that: 1 outer electron, then a full shell."), [tr("dass Atome einen Kern haben", "that atoms have a nucleus")]: tr("Den Kern hat schon das Rutherford-Modell erklärt.", "The nucleus was already explained by the Rutherford model.") },
    ok: tr("Für Formen braucht es ein besseres Modell: das **Orbitalmodell**.", "Shapes need a better model: the **orbital model**."),
  },

  // ── Elektronen als Welle ───────────────────────────────────────────────────────
  {
    part: tr("Elektronen als Welle", "Electrons as waves"),
    say: tr("Schießt man Elektronen durch einen Kristall, entstehen helle und dunkle **Ringe** – genau wie bei Licht. Das nennt man Beugung.", "If you fire electrons through a crystal, bright and dark **rings** appear – just as with light. This is called diffraction."),
    ask: tr("Was zeigt dieses Bild über Elektronen?", "What does this picture show about electrons?"), answer: tr("Sie verhalten sich auch wie Wellen.", "They also behave like waves."),
    options: [tr("Sie verhalten sich auch wie Wellen.", "They also behave like waves."), tr("Sie kreisen auf Bahnen.", "They circle on paths."), tr("Sie sind positiv geladen.", "They are positively charged.")],
    visual: () => <Diffraction />,
    why: { [tr("Sie kreisen auf Bahnen.", "They circle on paths.")]: tr("Ringe aus hell und dunkel entstehen durch Überlagerung von Wellen, nicht durch Bahnen.", "Bright and dark rings come from waves overlapping, not from paths."), [tr("Sie sind positiv geladen.", "They are positively charged.")]: tr("Elektronen sind negativ. Das Bild zeigt ihr Wellenverhalten.", "Electrons are negative. The picture shows their wave behaviour.") },
    ok: tr("Elektronen sind Teilchen **und** Welle (Welle-Teilchen-Dualismus).", "Electrons are particles **and** waves (wave–particle duality)."),
  },
  {
    say: tr("**Unschärferelation** (Heisenberg): Ort und Geschwindigkeit eines Elektrons lassen sich nie gleichzeitig genau bestimmen.", "**Uncertainty principle** (Heisenberg): the position and speed of an electron can never both be known exactly."),
    ask: tr("Kann man die **Bahn** eines Elektrons im Atom angeben?", "Can you state the **path** of an electron in an atom?"), answer: tr("Nein", "No"),
    options: [tr("Nein", "No"), tr("Ja, eine Kreisbahn", "Yes, a circle"), tr("Ja, eine Ellipse", "Yes, an ellipse")],
    why: { [tr("Ja, eine Kreisbahn", "Yes, a circle")]: tr("Für eine Bahn müsste man Ort und Geschwindigkeit genau kennen.", "A path would need exact position and speed."), [tr("Ja, eine Ellipse", "Yes, an ellipse")]: tr("Auch eine Ellipse ist eine Bahn – die gibt es nicht.", "An ellipse is a path too – there is none.") },
    ok: tr("Statt einer Bahn gibt es nur **Wahrscheinlichkeiten**, wo das Elektron ist.", "Instead of a path there are only **probabilities** of where the electron is."),
  },
  {
    say: tr("Die **Schrödinger-Gleichung** liefert eine Wellenfunktion ψ. Ihr Quadrat ψ² gibt an, wie wahrscheinlich das Elektron an einem Ort ist.", "The **Schrödinger equation** gives a wave function ψ. Its square ψ² gives how likely the electron is at a place."),
    ask: tr("Jeder Punkt ist eine Messung des Wasserstoff-Elektrons. Wo ist die **Punktdichte** am größten?", "Each dot is one measurement of the hydrogen electron. Where is the **dot density** highest?"), answer: tr("nahe am Kern", "near the nucleus"),
    options: [tr("nahe am Kern", "near the nucleus"), tr("auf einem Kreis", "on a circle"), tr("ganz außen", "far outside")],
    visual: () => <Cloud />,
    why: { [tr("auf einem Kreis", "on a circle")]: tr("Es gibt keine Kreisbahn – die Punkte werden nach außen gleichmäßig weniger.", "There is no circular path – the dots thin out evenly towards the outside."), [tr("ganz außen", "far outside")]: tr("Außen sind die Punkte am dünnsten.", "Outside the dots are sparsest.") },
    ok: tr("ψ² ist am Kern am größten und nimmt nach außen ab – ohne scharfe Grenze.", "ψ² is largest at the nucleus and falls off outwards – without a sharp edge."),
  },
  {
    say: tr("Ein **Orbital** ist der Raum, in dem sich ein Elektron mit **90 %** Wahrscheinlichkeit aufhält. Das Bild zeigt das 1s-Orbital von Wasserstoff.", "An **orbital** is the region in which an electron is found with **90 %** probability. The picture shows hydrogen's 1s orbital."),
    ask: tr("Was ist ein Orbital?", "What is an orbital?"), answer: tr("Raum, in dem es zu 90 % ist", "region where it is 90 % of the time"),
    options: [tr("Raum, in dem es zu 90 % ist", "region where it is 90 % of the time"), tr("die Bahn des Elektrons", "the path of the electron"), tr("das Elektron selbst", "the electron itself")],
    visual: () => <OrbView items={[orb(1, 1, 0, "s")]} />,
    why: { [tr("die Bahn des Elektrons", "the path of the electron")]: tr("Bahnen gibt es nicht. Das Orbital ist ein Raum, keine Linie.", "There are no paths. The orbital is a region, not a line."), [tr("das Elektron selbst", "the electron itself")]: tr("Das Elektron hält sich im Orbital auf – es ist nicht das Orbital.", "The electron is found in the orbital – it is not the orbital.") },
    ok: tr("Orbital = Aufenthaltsraum. Ziehen dreht das Modell.", "Orbital = region where it is found. Drag to rotate the model."),
  },
  {
    say: tr("**Pauli-Prinzip**: Ein Orbital fasst höchstens **zwei** Elektronen – und nur mit entgegengesetztem **Spin**, geschrieben ↑↓.", "**Pauli principle**: an orbital holds at most **two** electrons – and only with opposite **spin**, written ↑↓."),
    ask: tr("Wie viele Elektronen passen höchstens in **ein** Orbital?", "How many electrons fit into **one** orbital at most?"), answer: 2, num: {},
    why: { "8": tr("8 passen in eine ganze Schale aus s und p – nicht in ein Orbital.", "8 fit into a whole shell of s and p – not into one orbital."), "1": tr("Zwei passen – wenn ihr Spin entgegengesetzt ist.", "Two fit – if their spin is opposite.") },
    tip: tr("Denk an die Pfeile ↑↓ in einem Kästchen.", "Think of the arrows ↑↓ in one box."),
    ok: tr("Ein Orbital = ein Kästchen = höchstens ↑↓.", "One orbital = one box = at most ↑↓."),
  },

  // ── Quantenzahlen und Formen ──────────────────────────────────────────────────
  {
    part: tr("Quantenzahlen und Formen", "Quantum numbers and shapes"),
    say: tr("Jedes Orbital hat Quantenzahlen. Die **Hauptquantenzahl n** = 1, 2, 3 … entspricht der Schale. Größeres n heißt: größer und energiereicher.", "Each orbital has quantum numbers. The **principal quantum number n** = 1, 2, 3 … corresponds to the shell. Larger n means: bigger and higher in energy."),
    ask: tr("Im Bild: 1s, 2s und 3s von Wasserstoff. Welches ist am **größten**?", "In the picture: 1s, 2s and 3s of hydrogen. Which is the **largest**?"), answer: "3s", options: ["1s", "2s", "3s"],
    visual: () => <OrbView items={[orb(1, 1, 0, "s"), orb(1, 2, 0, "s"), orb(1, 3, 0, "s")]} />,
    why: { "1s": tr("1s ist das kleinste – innen im Bild.", "1s is the smallest – inside in the picture."), "2s": tr("2s ist mittel groß. n = 3 ist noch größer.", "2s is medium-sized. n = 3 is even bigger.") },
    ok: tr("n = 3 → größtes Orbital, Elektron im Mittel am weitesten vom Kern.", "n = 3 → largest orbital, electron on average furthest from the nucleus."),
  },
  {
    say: tr("Die **Nebenquantenzahl l** gibt die Form an: l = 0 heißt **s**, 1 heißt **p**, 2 heißt **d**, 3 heißt **f**. In Schale n gibt es l = 0 bis n − 1.", "The **azimuthal quantum number l** gives the shape: l = 0 is **s**, 1 is **p**, 2 is **d**, 3 is **f**. In shell n, l runs from 0 to n − 1."),
    ask: tr("Welche Unterschalen gibt es in der **2. Schale**?", "Which subshells exist in the **2nd shell**?"), answer: "2s, 2p", options: ["2s, 2p", "2s", "2s, 2p, 2d"],
    why: { "2s": tr("n = 2 erlaubt l = 0 **und** 1 – also auch 2p.", "n = 2 allows l = 0 **and** 1 – so 2p too."), "2s, 2p, 2d": tr("d braucht l = 2. Das gibt es erst ab n = 3.", "d needs l = 2. That only exists from n = 3.") },
    ok: tr("2. Schale: 2s und 2p. 3. Schale: 3s, 3p, 3d.", "2nd shell: 2s and 2p. 3rd shell: 3s, 3p, 3d."),
  },
  {
    say: tr("Alle **s**-Orbitale sind kugelförmig. Im Bild: das 2s-Orbital von Kohlenstoff.", "All **s** orbitals are spherical. In the picture: the 2s orbital of carbon."),
    ask: tr("Welche Form hat ein s-Orbital?", "What shape does an s orbital have?"), answer: tr("Kugel", "sphere"),
    options: [tr("Kugel", "sphere"), tr("Hantel", "dumbbell"), tr("Kreisbahn", "circular path")],
    visual: () => <OrbView items={[orb(6, 2, 0, "s")]} />,
    why: { [tr("Hantel", "dumbbell")]: tr("Hanteln sind p-Orbitale. Dreh das Modell – es sieht von überall gleich aus.", "Dumbbells are p orbitals. Rotate the model – it looks the same from everywhere."), [tr("Kreisbahn", "circular path")]: tr("Ein Orbital ist ein Raum, keine Bahn.", "An orbital is a region, not a path.") },
    ok: tr("s-Orbital = Kugel, in jeder Richtung gleich.", "s orbital = sphere, the same in every direction."),
  },
  {
    say: tr("**p**-Orbitale haben zwei Lappen (Hantel). Die Farben zeigen das Vorzeichen von ψ: dunkel +, hell −.", "**p** orbitals have two lobes (dumbbell). The colours show the sign of ψ: dark +, light −."),
    ask: tr("Wo ist beim 2p-Orbital die Aufenthaltswahrscheinlichkeit **null**?", "Where is the probability **zero** for the 2p orbital?"), answer: tr("in der Ebene zwischen den Lappen", "in the plane between the lobes"),
    options: [tr("in der Ebene zwischen den Lappen", "in the plane between the lobes"), tr("an den Spitzen der Lappen", "at the tips of the lobes"), tr("nirgends", "nowhere")],
    visual: () => <OrbView items={[orb(6, 2, 1, "pz")]} />,
    why: { [tr("an den Spitzen der Lappen", "at the tips of the lobes")]: tr("Dort wird ψ² nur klein, aber nicht null.", "There ψ² only gets small, not zero."), [tr("nirgends", "nowhere")]: tr("Zwischen den Lappen wechselt ψ das Vorzeichen – dort ist es genau null.", "Between the lobes ψ changes sign – there it is exactly zero.") },
    ok: tr("Diese **Knotenebene** geht durch den Kern.", "This **nodal plane** passes through the nucleus."),
  },
  {
    say: tr("Die **Magnetquantenzahl m** gibt die Ausrichtung an. Es gibt drei p-Orbitale: entlang x, y und z – gleich groß, gleiche Energie.", "The **magnetic quantum number m** gives the orientation. There are three p orbitals: along x, y and z – same size, same energy."),
    ask: tr("Wie viele **p-Orbitale** gibt es in einer Schale?", "How many **p orbitals** are there in a shell?"), answer: 3, num: {},
    visual: () => <OrbView items={[orb(6, 2, 1, "px"), orb(6, 2, 1, "py"), orb(6, 2, 1, "pz")]} />,
    why: { "6": tr("6 Elektronen passen hinein – verteilt auf die Orbitale.", "6 electrons fit in – spread over the orbitals."), "1": tr("Dreh das Modell: Es sind Hanteln in drei Richtungen.", "Rotate the model: there are dumbbells in three directions.") },
    tip: tr("Zähle die Achsen, entlang denen Hanteln liegen.", "Count the axes along which dumbbells lie."),
    ok: tr("pₓ, p_y, p_z – drei Orbitale, zusammen 6 Elektronen.", "pₓ, p_y, p_z – three orbitals, 6 electrons together."),
  },
  {
    say: tr("Ab n = 3 gibt es **d**-Orbitale: fünf Stück, meist mit vier Lappen. Im Bild: 3d_xy und 3d_z² von Eisen.", "From n = 3 there are **d** orbitals: five of them, mostly with four lobes. In the picture: 3d_xy and 3d_z² of iron."),
    ask: tr("Wie viele **d-Orbitale** gibt es in einer Schale?", "How many **d orbitals** are there in a shell?"), answer: 5, num: {},
    visual: () => <OrbView items={[orb(26, 3, 2, "dxy"), orb(26, 3, 2, "dz2")]} />,
    why: { "10": tr("10 Elektronen passen in die d-Unterschale – je 2 pro Orbital.", "10 electrons fit into the d subshell – 2 per orbital."), "3": tr("3 sind es bei p. Bei d sind es mehr.", "3 is for p. d has more.") },
    tip: tr("l = 2 erlaubt m = −2, −1, 0, 1, 2.", "l = 2 allows m = −2, −1, 0, 1, 2."),
    ok: tr("5 d-Orbitale × 2 = 10 Elektronen.", "5 d orbitals × 2 = 10 electrons."),
  },
  {
    say: tr("Die **Spinquantenzahl s** = +½ oder −½ unterscheidet die zwei Elektronen in einem Orbital (↑ und ↓).", "The **spin quantum number s** = +½ or −½ tells apart the two electrons in an orbital (↑ and ↓)."),
    ask: tr("Zwei Elektronen im **selben** Orbital haben …", "Two electrons in the **same** orbital have …"), answer: tr("entgegengesetzten Spin", "opposite spin"),
    options: [tr("entgegengesetzten Spin", "opposite spin"), tr("gleichen Spin", "the same spin"), tr("verschiedene Hauptquantenzahlen", "different principal quantum numbers")],
    why: { [tr("gleichen Spin", "the same spin")]: tr("Dann wären alle vier Quantenzahlen gleich – das verbietet Pauli.", "Then all four quantum numbers would be equal – Pauli forbids that."), [tr("verschiedene Hauptquantenzahlen", "different principal quantum numbers")]: tr("Im selben Orbital sind n, l und m gleich.", "In the same orbital n, l and m are equal.") },
    ok: tr("Keine zwei Elektronen stimmen in allen **vier** Quantenzahlen überein.", "No two electrons agree in all **four** quantum numbers."),
  },

  // ── Wie viele Elektronen? ────────────────────────────────────────────────────
  {
    part: tr("Wie viele Elektronen?", "How many electrons?"),
    say: tr("Im **Kästchenschema** ist jedes Orbital ein Kästchen. s hat 1, p 3, d 5, f 7 Kästchen – je höchstens ↑↓.", "In the **box diagram** each orbital is a box. s has 1, p 3, d 5, f 7 boxes – each at most ↑↓."),
    ask: tr("Wie viele Elektronen passen in eine **p**-Unterschale?", "How many electrons fit into a **p** subshell?"), answer: "6", options: ["2", "6", "10", "8"],
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(18)} /></Fit>,
    why: { "2": tr("2 passen in eine s-Unterschale (1 Kästchen).", "2 fit into an s subshell (1 box)."), "10": tr("10 passen in eine d-Unterschale.", "10 fit into a d subshell."), "8": tr("8 ist eine ganze Schale (s + p).", "8 is a whole shell (s + p).") },
    ok: tr("p: 3 Kästchen × 2 = 6 Elektronen.", "p: 3 boxes × 2 = 6 electrons."),
  },
  {
    say: tr("Eine Schale n hat n² Orbitale, also höchstens **2n²** Elektronen.", "A shell n has n² orbitals, so at most **2n²** electrons."),
    ask: tr("Wie viele Elektronen fasst die **3. Schale** höchstens?", "How many electrons can the **3rd shell** hold at most?"), answer: 18, num: {},
    why: { "8": tr("8 sind nur 3s und 3p. Dazu kommt 3d.", "8 is only 3s and 3p. 3d comes on top."), "9": tr("9 sind die Orbitale. Je Orbital passen 2 Elektronen.", "9 is the number of orbitals. Each holds 2 electrons."), "6": tr("6 passen allein in 3p.", "6 fit in 3p alone.") },
    tip: tr("3s (1) + 3p (3) + 3d (5) Orbitale, je 2 Elektronen.", "3s (1) + 3p (3) + 3d (5) orbitals, 2 electrons each."),
    ok: tr("2 · 3² = 18: 3s² 3p⁶ 3d¹⁰.", "2 · 3² = 18: 3s² 3p⁶ 3d¹⁰."),
  },

  // ── Energie und Aufbau ─────────────────────────────────────────────────────────
  {
    part: tr("Energie und Aufbau", "Energy and filling order"),
    say: tr("Bei Atomen mit mehreren Elektronen haben s, p und d einer Schale **verschiedene Energie**. s-Elektronen kommen dem Kern näher und sind weniger abgeschirmt.", "In atoms with several electrons, s, p and d of a shell have **different energies**. s electrons get closer to the nucleus and are less shielded."),
    ask: tr("Was liegt energetisch **tiefer**?", "Which is **lower** in energy?"), answer: "2s", options: ["2s", "2p", tr("beide gleich", "both equal")],
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(10)} /></Fit>,
    why: { "2p": tr("Im Schema steht 2p über 2s – also höher.", "In the diagram 2p is above 2s – so higher."), [tr("beide gleich", "both equal")]: tr("Nur beim Wasserstoff mit einem Elektron. Sonst liegt s tiefer.", "Only for hydrogen with one electron. Otherwise s is lower.") },
    ok: tr("2s liegt tiefer als 2p – oben im Schema heißt energiereicher.", "2s is lower than 2p – higher in the diagram means more energy."),
  },
  {
    say: tr("**Aufbauprinzip**: Elektronen besetzen die Orbitale nach steigender Energie – vom untersten Kästchen nach oben.", "**Aufbau principle**: electrons occupy orbitals in order of increasing energy – from the lowest box upwards."),
    ask: tr("Welche Konfiguration hat **Lithium** (3 Elektronen)?", "What is the configuration of **lithium** (3 electrons)?"), answer: "1s² 2s¹", options: ["1s² 2s¹", "1s³", "1s² 2p¹", "1s¹ 2s²"],
    visual: c => <FillScheme Z={3} upTo={2} reveal={c.solved || c.show} />,
    why: { "1s³": tr("Ein Orbital fasst nur 2 Elektronen (Pauli).", "An orbital holds only 2 electrons (Pauli)."), "1s² 2p¹": tr("2s liegt tiefer als 2p und kommt zuerst.", "2s is lower than 2p and comes first."), "1s¹ 2s²": tr("Zuerst wird das tiefste Orbital 1s voll.", "First the lowest orbital 1s is filled.") },
    ok: tr("Li: 1s² 2s¹ – das Außenelektron sitzt in 2s.", "Li: 1s² 2s¹ – the outer electron sits in 2s."),
  },
  {
    say: tr("Achtung: **4s** liegt energetisch tiefer als 3d und wird zuerst gefüllt.", "Careful: **4s** is lower in energy than 3d and is filled first."),
    ask: tr("Im Bild: Argon, 18 Elektronen. Kalium hat eines mehr. Wohin kommt das **19.** Elektron?", "In the picture: argon, 18 electrons. Potassium has one more. Where does the **19th** electron go?"), answer: "4s", options: ["4s", "3d", "4p"],
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(18)} lastIndex={7} /></Fit>,
    why: { "3d": tr("3d liegt höher als 4s – es kommt erst nach 4s dran.", "3d is higher than 4s – it comes after 4s."), "4p": tr("4p kommt erst nach 4s und 3d.", "4p comes only after 4s and 3d.") },
    ok: tr("Kalium: … 3p⁶ 4s¹.", "Potassium: … 3p⁶ 4s¹."),
  },
  {
    say: tr("**Hund'sche Regel**: Gleich energiereiche Orbitale werden erst **einzeln** mit gleichem Spin besetzt, dann gepaart. So stoßen sich die Elektronen am wenigsten ab.", "**Hund's rule**: orbitals of equal energy are first filled **singly** with the same spin, then paired. This way the electrons repel each other least."),
    ask: tr("Stickstoff hat **3 Elektronen** in 2p. Welches Schema stimmt?", "Nitrogen has **3 electrons** in 2p. Which diagram is right?"), answer: "↑ ↑ ↑", options: ["↑ ↑ ↑", "↑↓ ↑ _", "↑↓ ↑↓ ↑"],
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(6)} /></Fit>,
    why: { "↑↓ ↑ _": tr("Erst jedes Kästchen einzeln besetzen, dann paaren.", "First put one in each box, then pair."), "↑↓ ↑↓ ↑": tr("Das wären 5 Elektronen.", "That would be 5 electrons.") },
    ok: tr("Stickstoff: 2p mit drei einzelnen Elektronen.", "Nitrogen: 2p with three single electrons."),
  },
  {
    ask: tr("Wie viele **ungepaarte** Elektronen hat Sauerstoff (2p⁴)?", "How many **unpaired** electrons does oxygen (2p⁴) have?"), answer: 2, num: {},
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(8)} /></Fit>,
    why: { "4": tr("Das 4. Elektron paart sich mit einem – zähle die Kästchen mit nur einem Pfeil.", "The 4th electron pairs up with one – count the boxes with only one arrow."), "0": tr("In 2p sind zwei Kästchen nur einfach besetzt.", "In 2p two boxes are only singly occupied.") },
    tip: tr("Zähle in 2p die Kästchen mit nur einem Pfeil.", "In 2p count the boxes with only one arrow."),
    ok: tr("2p⁴ = ↑↓ ↑ ↑ → 2 ungepaarte Elektronen.", "2p⁴ = ↑↓ ↑ ↑ → 2 unpaired electrons."),
  },
  {
    say: tr("Fülle das Schema selbst: Tippe die Kästchen von **unten nach oben** an (↑, dann ↑↓), bis **15** Elektronen drin sind.", "Fill the diagram yourself: tap the boxes from **bottom to top** (↑, then ↑↓) until **15** electrons are in."),
    ask: tr("Welche Elektronenkonfiguration hat **Phosphor** (Z = 15)?", "What is the electron configuration of **phosphorus** (Z = 15)?"), answer: "1s² 2s² 2p⁶ 3s² 3p³",
    visual: c => <FillScheme Z={15} upTo={6} reveal={c.solved || c.show} />,
    options: ["1s² 2s² 2p⁶ 3s² 3p³", "1s² 2s² 2p⁶ 3p⁵", "1s² 2s² 2p⁶ 3s² 3d³", "1s² 2s⁸ 3s⁵"],
    why: { "1s² 2s² 2p⁶ 3p⁵": tr("3s kommt vor 3p – es wird zuerst gefüllt.", "3s comes before 3p – it is filled first."), "1s² 2s² 2p⁶ 3s² 3d³": tr("Nach 3s folgt 3p, nicht 3d.", "After 3s comes 3p, not 3d."), "1s² 2s⁸ 3s⁵": tr("s fasst nur 2 Elektronen.", "s holds only 2 electrons.") },
    ok: tr("Hochzahlen zusammen: 2 + 2 + 6 + 2 + 3 = 15.", "Superscripts together: 2 + 2 + 6 + 2 + 3 = 15."),
  },

  // ── Das Atom in 3D ────────────────────────────────────────────────────────────
  {
    part: tr("Das Atom in 3D", "The atom in 3D"),
    say: tr("So sieht **Sauerstoff** im Orbitalmodell aus – alle Flächen bei gleicher Elektronendichte. Schalte die Orbitale oben ein und aus.", "This is **oxygen** in the orbital model – all surfaces at the same electron density. Switch the orbitals on and off at the top."),
    ask: tr("Welche Orbitale reichen am **weitesten** nach außen?", "Which orbitals reach **furthest** out?"), answer: "2p", options: ["2p", "2s", "1s"],
    visual: () => <AtomView Z={8} />,
    why: { "2s": tr("Schalte nur 2s und 2p ein: Die Hanteln ragen aus der Kugel.", "Switch on only 2s and 2p: the dumbbells stick out of the sphere."), "1s": tr("1s ist ganz innen und klein – es liegt dem Kern am nächsten.", "1s is right inside and small – it is closest to the nucleus.") },
    ok: tr("Die 2p-Hanteln ragen über die 2s-Kugel hinaus. 1s ist klein und innen.", "The 2p dumbbells reach beyond the 2s sphere. 1s is small and inside."),
  },
  {
    say: tr("**Kohlenstoff**: 1s² 2s² 2p². Die zwei 2p-Elektronen sitzen nach Hund in zwei verschiedenen p-Orbitalen.", "**Carbon**: 1s² 2s² 2p². By Hund's rule the two 2p electrons sit in two different p orbitals."),
    ask: tr("Wie viele **2p-Orbitale** enthalten bei Kohlenstoff Elektronen?", "How many **2p orbitals** contain electrons in carbon?"), answer: 2, num: {},
    visual: () => <AtomView Z={6} />,
    why: { "1": tr("Zwei Elektronen gehen nach Hund in zwei Orbitale, nicht in eines.", "By Hund's rule two electrons go into two orbitals, not one."), "3": tr("Für drei Orbitale bräuchte es drei p-Elektronen (Stickstoff).", "Three orbitals would need three p electrons (nitrogen).") },
    tip: tr("Die Schalter oben zeigen alle besetzten Orbitale.", "The switches at the top show all occupied orbitals."),
    ok: tr("2pₓ¹ und 2p_y¹ – ein p-Orbital bleibt leer.", "2pₓ¹ and 2p_y¹ – one p orbital stays empty."),
  },
  {
    say: tr("**Eisen** (Fe): [Ar] 4s² 3d⁶. Die 3d-Orbitale haben meist vier Lappen. Schalte 4s dazu: 3d liegt weit innen.", "**Iron** (Fe): [Ar] 4s² 3d⁶. Most 3d orbitals have four lobes. Switch on 4s: 3d lies far inside."),
    ask: tr("Wie viele 3d-Orbitale sind bei Eisen nur **einfach** besetzt?", "How many 3d orbitals are only **singly** occupied in iron?"), answer: 4, num: {},
    visual: () => <AtomView Z={26} only={["4s", "3d"]} initial={["3dxy", "3dxz", "3dyz", "3dx2-y2", "3dz2"]} spins={false} />,
    why: { "6": tr("6 sind alle 3d-Elektronen. Eines davon paart sich.", "6 is all the 3d electrons. One of them pairs up."), "5": tr("Das 6. Elektron paart sich mit einem – dann sind es 4 einzelne.", "The 6th electron pairs with one – then 4 are single.") },
    tip: tr("Hund: erst 5 einzeln, das nächste paart sich.", "Hund: 5 singly first, the next one pairs."),
    ok: tr("3d⁶ = ↑↓ ↑ ↑ ↑ ↑ → 4 ungepaarte Elektronen.", "3d⁶ = ↑↓ ↑ ↑ ↑ ↑ → 4 unpaired electrons."),
  },

  // ── Kurzschreibweise und PSE ───────────────────────────────────────────────────
  {
    part: tr("Kurzschreibweise und PSE", "Short notation and periodic table"),
    say: tr("Kurzschreibweise: der **Edelgaskern** in eckigen Klammern ersetzt alle inneren Elektronen.", "Short notation: the **noble gas core** in square brackets replaces all inner electrons."),
    ask: tr("Wie schreibt man Kalium (Z = 19) kurz?", "How do you write potassium (Z = 19) in short?"), answer: "[Ar] 4s¹", options: ["[Ar] 4s¹", "[Ne] 4s¹", "[Ar] 3d¹", "[Kr] 4s¹"],
    why: { "[Ne] 4s¹": tr("Nach Neon fehlen noch 3s und 3p – der nächste Edelgaskern ist Argon (18).", "After neon, 3s and 3p are still missing – the next noble gas core is argon (18)."), "[Ar] 3d¹": tr("Nach Argon kommt zuerst 4s.", "After argon comes 4s first."), "[Kr] 4s¹": tr("Krypton (36) hat mehr Elektronen als Kalium.", "Krypton (36) has more electrons than potassium.") },
    ok: tr("[Ar] = die 18 Elektronen von Argon, dazu 4s¹.", "[Ar] = the 18 electrons of argon, plus 4s¹."),
  },
  {
    say: tr("Der **Block** sagt, welche Unterschale zuletzt gefüllt wird: s (Gruppe 1–2), d (3–12), p (13–18).", "The **block** tells you which subshell is filled last: s (groups 1–2), d (3–12), p (13–18)."),
    ask: tr("In welchem Block steht **Eisen** (Fe, Gruppe 8)?", "Which block is **iron** (Fe, group 8) in?"), answer: tr("d-Block", "d block"), options: [tr("s-Block", "s block"), tr("p-Block", "p block"), tr("d-Block", "d block"), tr("f-Block", "f block")],
    visual: c => <Pse c={c} stufe="os" mark={26} blocks />,
    why: { [tr("s-Block", "s block")]: tr("s-Block sind nur die Gruppen 1 und 2.", "The s block is only groups 1 and 2."), [tr("p-Block", "p block")]: tr("p-Block sind die Gruppen 13–18.", "The p block is groups 13–18."), [tr("f-Block", "f block")]: tr("f-Block sind Lanthanoide und Actinoide.", "The f block is the lanthanides and actinides.") },
    ok: tr("Eisen: [Ar] 4s² 3d⁶ – zuletzt wird 3d gefüllt.", "Iron: [Ar] 4s² 3d⁶ – 3d is filled last."),
  },
  {
    say: tr("Aus der Konfiguration liest du die Stelle im PSE: höchste Schale = **Periode**.", "From the configuration you can read the place in the periodic table: highest shell = **period**."),
    ask: tr("Welches Element hat **[Ne] 3s² 3p⁴**? Tippe es an.", "Which element has **[Ne] 3s² 3p⁴**? Tap it."), answer: "16",
    visual: c => <Pse c={c} stufe="os" answer={16} />,
    tip: tr("Höchstes n = Periode. Im p-Block gilt: Außenelektronen + 10 = Gruppe.", "Highest n = period. In the p block: outer electrons + 10 = group."),
    ok: tr("3. Periode, 2 + 4 = 6 Außenelektronen → Gruppe 16: Schwefel.", "Period 3, 2 + 4 = 6 outer electrons → group 16: sulfur."),
  },
  {
    part: tr("Ionen", "Ions"),
    say: tr("Hauptgruppen-Atome bilden Ionen mit **Edelgaskonfiguration**: Gruppe 1, 2, 13 geben 1, 2, 3 Elektronen ab; Gruppe 15, 16, 17 nehmen 3, 2, 1 auf.", "Main group atoms form ions with a **noble gas configuration**: groups 1, 2, 13 lose 1, 2, 3 electrons; groups 15, 16, 17 gain 3, 2, 1."),
    ask: tr("Welches Ion bildet **Aluminium** (Gruppe 13)?", "Which ion does **aluminium** (group 13) form?"), answer: "Al³⁺", options: ["Al³⁺", "Al³⁻", "Al⁺", "Al⁵⁻"],
    why: { "Al³⁻": tr("Aluminium ist ein Metall – es gibt seine 3 Außenelektronen ab.", "Aluminium is a metal – it loses its 3 outer electrons."), "Al⁺": tr("Alle 3 Außenelektronen gehen weg.", "All 3 outer electrons go."), "Al⁵⁻": tr("5 aufnehmen ist viel mehr als 3 abgeben.", "Gaining 5 is much more than losing 3.") },
    ok: tr("Al³⁺ hat 10 Elektronen – wie Neon.", "Al³⁺ has 10 electrons – like neon."),
  },
  {
    say: tr("Teilchen mit **gleicher Elektronenkonfiguration** heißen isoelektronisch.", "Particles with the **same electron configuration** are called isoelectronic."),
    ask: tr("Welches Teilchen hat dieselbe Konfiguration wie **Neon** (10 Elektronen)?", "Which particle has the same configuration as **neon** (10 electrons)?"), answer: "Mg²⁺", options: ["Mg²⁺", "Mg", "Na", "Cl⁻"],
    why: { Mg: tr("Magnesium-Atom: 12 Elektronen.", "Magnesium atom: 12 electrons."), Na: tr("Natrium-Atom: 11 Elektronen.", "Sodium atom: 11 electrons."), "Cl⁻": tr("Cl⁻ hat 18 Elektronen – wie Argon.", "Cl⁻ has 18 electrons – like argon.") },
    ok: tr("Mg²⁺: 12 − 2 = 10 Elektronen.", "Mg²⁺: 12 − 2 = 10 electrons."),
  },
  {
    say: tr("Kationen geben zuerst die Elektronen der **äußersten** Schale ab – bei Übergangsmetallen also **4s vor 3d**.", "Cations first lose the electrons of the **outer** shell – for transition metals **4s before 3d**."),
    ask: tr("Eisen ist [Ar] 4s² 3d⁶. Welche Konfiguration hat **Fe²⁺**?", "Iron is [Ar] 4s² 3d⁶. What is the configuration of **Fe²⁺**?"), answer: "[Ar] 3d⁶", options: ["[Ar] 3d⁶", "[Ar] 4s² 3d⁴", "[Ar] 4s¹ 3d⁵"],
    why: { "[Ar] 4s² 3d⁴": tr("4s ist die äußerste Schale – diese Elektronen gehen zuerst.", "4s is the outer shell – these electrons go first."), "[Ar] 4s¹ 3d⁵": tr("Beide Elektronen kommen aus 4s.", "Both electrons come from 4s.") },
    ok: tr("Fe²⁺ = [Ar] 3d⁶.", "Fe²⁺ = [Ar] 3d⁶."),
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
      tr("Aufbauprinzip 1s 2s 2p 3s 3p **4s 3d** 4p …; **Hund'sche Regel**: gleichwertige Orbitale erst einzeln, dann gepaart.", "Aufbau principle 1s 2s 2p 3s 3p **4s 3d** 4p …; **Hund's rule**: equivalent orbitals singly first, then paired."),
      tr("Kurzschreibweise mit Edelgaskern; s-, p-, d-Block; Periode und Gruppe aus der Konfiguration.", "Short notation with noble gas core; s, p, d block; period and group from the configuration."),
      tr("Ionen: Edelgaskonfiguration, Kationen geben 4s vor 3d ab, isoelektronische Teilchen.", "Ions: noble gas configuration, cations lose 4s before 3d, isoelectronic particles."),
    ] };
}
