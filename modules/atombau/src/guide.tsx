// Geführte Erklärung Atombau (Knopf „Erklärung“): mit den Bausteinen der App – Bohrmodell, Periodensystem, Atomsymbol,
// Kästchenschema. Jeder Schritt verlangt eine Handlung; deckt alle Aufgabentypen des Quiz der jeweiligen Stufe ab.

import type { ReactNode } from "react";
import { Fit, type GuideCtx, type GuideDef, type GuideStep } from "@lern/ui";
import { configuration } from "@lern/chem";
import { Bohr, EnergyDiagram, Nuclide, PeriodicTable, type Particle } from "@lern/chem-ui";
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

const US: GuideStep[] = [
  {
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
    say: tr("Bei Reaktionen geben Atome Außenelektronen ab oder nehmen welche auf. Danach ist die äußerste Schale **voll** wie bei einem Edelgas (**Edelgaszustand**).", "In reactions atoms lose or gain outer electrons. Afterwards the outer shell is **full** like in a noble gas (**noble gas configuration**)."),
    ask: tr("Natrium hat 1 Außenelektron. Was passiert bei einer Reaktion?", "Sodium has 1 outer electron. What happens in a reaction?"), answer: tr("Es gibt 1 Elektron ab.", "It loses 1 electron."),
    options: [tr("Es gibt 1 Elektron ab.", "It loses 1 electron."), tr("Es nimmt 7 Elektronen auf.", "It gains 7 electrons.")],
    visual: () => <BohrOnly Z={11} N={12} E={11} />,
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
  {
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
  {
    say: tr("Langperiodensystem: **Gruppen 1–18** (Spalten), **Perioden 1–6** (Zeilen).", "Long periodic table: **groups 1–18** (columns), **periods 1–6** (rows)."),
    ask: tr("Tippe auf das Element in der **4. Periode** und **Gruppe 16**.", "Tap the element in **period 4** and **group 16**."), answer: "34",
    visual: c => <Pse c={c} stufe="os" answer={34} />,
    tip: tr("Perioden sind die Zeilen (links nummeriert), Gruppen die Spalten (oben nummeriert).", "Periods are the rows (numbered on the left), groups the columns (numbered at the top)."),
    ok: tr("4. Zeile, 16. Spalte: Selen (Z = 34).", "Row 4, column 16: selenium (Z = 34)."),
  },
  {
    say: tr("Elektronen füllen **Unterschalen** nach steigender Energie: 1s 2s 2p 3s 3p **4s 3d** 4p … Eine s-Unterschale fasst 2, p 6, d 10 Elektronen.", "Electrons fill **subshells** by increasing energy: 1s 2s 2p 3s 3p **4s 3d** 4p. An s subshell holds 2, p 6, d 10 electrons."),
    ask: tr("Wie viele Elektronen passen in eine **p**-Unterschale?", "How many electrons fit into a **p** subshell?"), answer: "6", options: ["2", "6", "10", "8"],
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(18)} /></Fit>,
    why: { "2": tr("2 passen in eine s-Unterschale (1 Kästchen).", "2 fit into an s subshell (1 box)."), "10": tr("10 passen in eine d-Unterschale.", "10 fit into a d subshell."), "8": tr("8 ist eine ganze Schale (s + p).", "8 is a whole shell (s + p).") },
    ok: tr("p: 3 Kästchen × 2 = 6 Elektronen.", "p: 3 boxes × 2 = 6 electrons."),
  },
  {
    ask: tr("Welche Elektronenkonfiguration hat **Phosphor** (Z = 15)?", "What is the electron configuration of **phosphorus** (Z = 15)?"), answer: "1s² 2s² 2p⁶ 3s² 3p³",
    options: ["1s² 2s² 2p⁶ 3s² 3p³", "1s² 2s² 2p⁶ 3p⁵", "1s² 2s² 2p⁶ 3s² 3d³", "1s² 2s⁸ 3s⁵"],
    why: { "1s² 2s² 2p⁶ 3p⁵": tr("3s kommt vor 3p – es wird zuerst gefüllt.", "3s comes before 3p – it is filled first."), "1s² 2s² 2p⁶ 3s² 3d³": tr("Nach 3s folgt 3p, nicht 3d.", "After 3s comes 3p, not 3d."), "1s² 2s⁸ 3s⁵": tr("s fasst nur 2 Elektronen.", "s holds only 2 electrons.") },
    ok: tr("Hochzahlen zusammen: 2 + 2 + 6 + 2 + 3 = 15.", "Superscripts together: 2 + 2 + 6 + 2 + 3 = 15."),
  },
  {
    say: tr("Achtung: **4s** liegt energetisch tiefer als 3d und wird zuerst gefüllt.", "Careful: **4s** is lower in energy than 3d and is filled first."),
    ask: tr("Im Bild: Argon, 18 Elektronen. Kalium hat eines mehr. Wohin kommt das **19.** Elektron?", "In the picture: argon, 18 electrons. Potassium has one more. Where does the **19th** electron go?"), answer: "4s", options: ["4s", "3d", "4p"],
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(18)} lastIndex={7} /></Fit>,
    why: { "3d": tr("3d liegt höher als 4s – es kommt erst nach 4s dran.", "3d is higher than 4s – it comes after 4s."), "4p": tr("4p kommt erst nach 4s und 3d.", "4p comes only after 4s and 3d.") },
    ok: tr("Kalium: … 3p⁶ 4s¹.", "Potassium: … 3p⁶ 4s¹."),
  },
  {
    say: tr("Kurzschreibweise: der **Edelgaskern** in eckigen Klammern ersetzt alle inneren Elektronen.", "Short notation: the **noble gas core** in square brackets replaces all inner electrons."),
    ask: tr("Wie schreibt man Kalium (Z = 19) kurz?", "How do you write potassium (Z = 19) in short?"), answer: "[Ar] 4s¹", options: ["[Ar] 4s¹", "[Ne] 4s¹", "[Ar] 3d¹", "[Kr] 4s¹"],
    why: { "[Ne] 4s¹": tr("Nach Neon fehlen noch 3s und 3p – der nächste Edelgaskern ist Argon (18).", "After neon, 3s and 3p are still missing – the next noble gas core is argon (18)."), "[Ar] 3d¹": tr("Nach Argon kommt zuerst 4s.", "After argon comes 4s first."), "[Kr] 4s¹": tr("Krypton (36) hat mehr Elektronen als Kalium.", "Krypton (36) has more electrons than potassium.") },
    ok: tr("[Ar] = die 18 Elektronen von Argon, dazu 4s¹.", "[Ar] = the 18 electrons of argon, plus 4s¹."),
  },
  {
    say: tr("**Hund'sche Regel**: Gleichwertige Kästchen werden erst **einzeln** besetzt, dann gepaart. Im Bild: Kohlenstoff mit 2p².", "**Hund's rule**: boxes of equal energy are first filled **singly**, then paired. In the picture: carbon with 2p²."),
    ask: tr("Stickstoff hat **3 Elektronen** in 2p. Welches Schema stimmt?", "Nitrogen has **3 electrons** in 2p. Which diagram is right?"), answer: "↑ ↑ ↑", options: ["↑ ↑ ↑", "↑↓ ↑ _", "↑↓ ↑↓ ↑"],
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(6)} /></Fit>,
    why: { "↑↓ ↑ _": tr("Erst jedes Kästchen einzeln besetzen, dann paaren.", "First put one in each box, then pair."), "↑↓ ↑↓ ↑": tr("Das wären 5 Elektronen.", "That would be 5 electrons.") },
    ok: tr("Stickstoff: 2p mit drei einzelnen Elektronen.", "Nitrogen: 2p with three single electrons."),
  },
  {
    ask: tr("Wie viele **ungepaarte** Elektronen hat Sauerstoff (2p⁴)?", "How many **unpaired** electrons does oxygen (2p⁴) have?"), answer: 2, num: {},
    visual: () => <Fit className="ab-g-fit" min={0.2}><EnergyDiagram cfg={configuration(8)} /></Fit>,
    why: { "4": tr("Das 4. Elektron paart sich mit einem – zähle die Kästchen mit nur einem Pfeil.", "The 4th electron pairs up with one – count the boxes with only one arrow."), "0": tr("In 2p sind zwei Kästchen nur einfach besetzt.", "In 2p two boxes have only one electron.") },
    tip: tr("Zähle in 2p die Kästchen mit nur einem Pfeil.", "In 2p count the boxes with only one arrow."),
    ok: tr("2p⁴ = ↑↓ ↑ ↑ → 2 ungepaarte Elektronen.", "2p⁴ = ↑↓ ↑ ↑ → 2 unpaired electrons."),
  },
  {
    say: tr("Der **Block** sagt, welche Unterschale zuletzt gefüllt wird: s (Gruppe 1–2), d (3–12), p (13–18).", "The **block** tells you which subshell is filled last: s (groups 1–2), d (3–12), p (13–18)."),
    ask: tr("In welchem Block steht **Eisen** (Fe, Gruppe 8)?", "Which block is **iron** (Fe, group 8) in?"), answer: tr("d-Block", "d block"), options: [tr("s-Block", "s block"), tr("p-Block", "p block"), tr("d-Block", "d block"), tr("f-Block", "f block")],
    visual: c => <Pse c={c} stufe="os" mark={26} blocks />,
    why: { [tr("s-Block", "s block")]: tr("s-Block sind nur die Gruppen 1 und 2.", "The s block is only groups 1 and 2."), [tr("p-Block", "p block")]: tr("p-Block sind die Gruppen 13–18.", "The p block is groups 13–18."), [tr("f-Block", "f block")]: tr("f-Block sind die Lanthanoide (unten).", "The f block is the lanthanoids (at the bottom).") },
    ok: tr("Eisen: [Ar] 4s² 3d⁶ – zuletzt wird 3d gefüllt.", "Iron: [Ar] 4s² 3d⁶ – 3d is filled last."),
  },
  {
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
  {
    say: tr("Aus der Konfiguration liest du die Stelle im PSE: höchste Schale = **Periode**.", "From the configuration you can read the place in the periodic table: highest shell = **period**."),
    ask: tr("Welches Element hat **[Ne] 3s² 3p⁴**? Tippe es an.", "Which element has **[Ne] 3s² 3p⁴**? Tap it."), answer: "16",
    visual: c => <Pse c={c} stufe="os" answer={16} />,
    tip: tr("Höchstes n = Periode. Im p-Block gilt: Außenelektronen + 10 = Gruppe.", "Highest n = period. In the p block: outer electrons + 10 = group."),
    ok: tr("3. Periode, 2 + 4 = 6 Außenelektronen → Gruppe 16: Schwefel.", "Period 3, 2 + 4 = 6 outer electrons → group 16: sulfur."),
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
      tr("Aufbauprinzip 1s 2s 2p 3s 3p **4s 3d** 4p …, Kurzschreibweise mit Edelgaskern.", "Aufbau principle 1s 2s 2p 3s 3p **4s 3d** 4p …, short notation with noble gas core."),
      tr("**Hund'sche Regel**: erst einzeln, dann gepaart – ungepaarte Elektronen zählen.", "**Hund's rule**: singly first, then paired – counting unpaired electrons."),
      tr("s-, p-, d-Block; Periode und Gruppe aus der Konfiguration.", "s, p, d block; period and group from the configuration."),
      tr("Ionen: Edelgaskonfiguration, Kationen geben 4s vor 3d ab, isoelektronische Teilchen.", "Ions: noble gas configuration, cations lose 4s before 3d, isoelectronic particles."),
    ] };
}
