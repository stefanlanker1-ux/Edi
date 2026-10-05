// Lektionen der Gemische (Lernen, je Kapitel eine): mit den Teilchenbildern der App und den Animationen der Trennverfahren.
// Je Gedanke vorgemacht → halb gelöst → selbst. Keine Zahlen eintippen: Auswahl oder im Bild antippen.

import { useEffect, useState } from "react";
import { Fit, type GuideCtx, type GuideDef, type GuideStep } from "@lern/ui";
import { toSubscript } from "@lern/chem";
import { Beaker } from "./components/Beaker.tsx";
import { MuesliBowl } from "./components/MuesliBowl.tsx";
import { initial, seedOf } from "./mixing.ts";
import type { Pic } from "./quiz/tasks.ts";
import { nameOf } from "./mixtures.ts";
import { tr } from "@lern/i18n";
import { SepAnim, SepScene, type Method } from "./components/Separation.tsx";
import { MiniParticle } from "./views/MixView.tsx";

/** Legende unter jedem Teilchenbild: welches Teilchen zu welchem Stoff gehört (Name und Formel) */
function Key({ p }: { p: Pic }) {
  return (
    <ul className="gm-g-legend" aria-label={tr("Legende", "Key")}>
      {p.mix.map(([f]) => <li key={f}><MiniParticle f={f} size={24} /><span>{nameOf(f)} <b>{toSubscript(f)}</b></span></li>)}
    </ul>
  );
}

/** Teilchenbild; mit `target` sind Teilchen antippbar (Ziel = Formel), darunter dieselben Stoffe als Knöpfe */
function Picture({ p, c, target }: { p: Pic; c?: GuideCtx; target?: string }) {
  const sim = initial({ items: p.mix, state: p.state, floats: p.floats, before: p.before, solute: p.solute }, seedOf(JSON.stringify(p)), p.arrange ?? "nachher");
  const label = `${tr("Teilchenbild", "Particle picture")}: ${p.mix.map(([f, n]) => `${n} × ${nameOf(f)}`).join(", ")}`;
  return (
    <div className="gm-g">
      <Fit className="gm-g-pic" min={0.2}><Beaker sim={sim} label={label} onPick={target && c ? f => c.pick(f) : undefined} /></Fit>
      <Key p={p} />
      {target && c && (
        <div className="gm-g-keys">
          {p.mix.map(([f]) => (
            <button key={f} type="button" className={`gm-g-key${c.show && f === target ? " g-sol" : ""}`} onClick={() => c.pick(f)}>{toSubscript(f)}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Vorher-Bild; nach der richtigen Vorhersage gleiten die Teilchen langsam in die Lage „nachher“ (gleiche Teilchen, CSS-Übergang) */
function Glide({ p, c }: { p: Pic; c: GuideCtx }) {
  const sim = initial({ items: p.mix, state: p.state, floats: p.floats, before: p.before, solute: p.solute }, seedOf(JSON.stringify(p)), c.solved ? "nachher" : "vorher");
  const label = `${tr("Teilchenbild", "Particle picture")}: ${p.mix.map(([f, n]) => `${n} × ${nameOf(f)}`).join(", ")}`;
  return <div className="gm-g gm-slow"><Fit className="gm-g-pic" min={0.2}><Beaker sim={sim} label={label} /></Fit><Key p={p} /></div>;
}

/** Milch: im Glas einheitlich weiß, unter dem Mikroskop Fetttröpfchen in Wasser (Emulsion) */
function Milk() {
  // Tröpfchen fest verteilt (verschiedene Größen, keine Überlappung)
  const drops: [number, number, number][] = [[214, 62, 9], [246, 84, 13], [278, 58, 7], [205, 104, 11], [238, 124, 8], [272, 110, 10], [300, 92, 8], [226, 158, 10], [262, 150, 12], [296, 140, 7], [192, 136, 7], [252, 186, 8], [284, 176, 9]];
  return (
    <div className="gm-g">
      <Fit className="gm-g-pic" min={0.3}>
        <svg className="gm-milk" viewBox="0 0 340 236" role="img" aria-label={tr("Milch im Glas und unter dem Mikroskop: Fetttröpfchen in Wasser", "Milk in a glass and under the microscope: fat droplets in water")}>
          <path d="M24 38 L34 196 Q36 206 46 206 L94 206 Q104 206 106 196 L116 38" className="gm-milk-glass" />
          <path d="M28 70 L34 196 Q36 206 46 206 L94 206 Q104 206 106 196 L112 70 Z" className="gm-milk-liq" />
          <text x={70} y={228} className="gm-milk-cap">{tr("Glas", "Glass")}</text>
          <circle cx={70} cy={130} r={16} className="gm-milk-zoom" />
          <path d="M86 126 L176 96 M86 136 L176 170" className="gm-milk-ray" />
          <circle cx={248} cy={120} r={84} className="gm-milk-water" />
          {drops.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} className="gm-milk-fat" />)}
          <circle cx={248} cy={120} r={84} className="gm-milk-lens" />
          <text x={248} y={228} className="gm-milk-cap">{tr("Mikroskop", "Microscope")}</text>
        </svg>
      </Fit>
    </div>
  );
}

const LOESEN: Pic = { mix: [["H2O", 17], ["C12H22O11", 3]], state: "fluessig", before: "kristall", solute: "C12H22O11" };

/** Vorgemacht: erst „vorher“, kurz darauf gleiten die Teilchen von selbst in die Lage „nachher“ */
function Play({ p }: { p: Pic }) {
  const [after, setAfter] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAfter(true), 900); return () => clearTimeout(t); }, []);
  return <Glide p={p} c={{ pick: () => {}, show: false, solved: after }} />;
}

const MIX: Pic = { mix: [["H2O", 4], ["He", 3]], state: "modell" };
const MIX2: Pic = { mix: [["CO2", 3], ["Ne", 5]], state: "modell" };
const SORTEN: Pic = { mix: [["H2O", 3], ["CO2", 2], ["CO", 2], ["CH4", 1]], state: "modell" };
const NUR_CO2: Pic = { mix: [["CO2", 6]], state: "modell" };
const ZUCKER: Pic = { mix: [["H2O", 17], ["C12H22O11", 3]], state: "fluessig", solute: "C12H22O11", arrange: "nachher" };
const LUFT: Pic = { mix: [["Ar", 9], ["CO2", 4]], state: "gas" };


/** Animation eines Trennverfahrens (spielt beim Erscheinen ab) bzw. Standbild mit antippbaren Teilen */
const Sep = ({ m }: { m: Method }) => <div className="gm-g"><SepAnim m={m} /></div>;
const SepTap = ({ m, c, target }: { m: Method; c: GuideCtx; target: string }) => (
  <div className="gm-g"><Fit className="gm-g-pic" min={0.3}><SepScene m={m} t={1} onPick={p => c.pick(p)} mark={c.show || c.solved ? target : undefined} /></Fit></div>
);

const HOM = () => tr("homogenes Gemisch", "homogeneous mixture"), HET = () => tr("heterogenes Gemisch", "heterogeneous mixture"), REIN = () => tr("Reinstoff", "Pure substance");
const EL = () => tr("Element", "Element"), VB = () => tr("Verbindung", "Compound"), GM = () => tr("Gemisch", "Mixture");
const EVEN = () => tr("überall gleich gefärbt", "evenly coloured everywhere"), BOTTOM = () => tr("Tinte bleibt unten", "ink stays at the bottom"), GONE = () => tr("Tinte verschwindet", "the ink disappears");
const M = {
  sieben: () => tr("Sieben", "Sieving"), magnet: () => tr("Magnettrennung", "Magnetic separation"), auslesen: () => tr("Auslesen", "Picking out"),
  filtrieren: () => tr("Filtrieren", "Filtering"), eindampfen: () => tr("Eindampfen", "Evaporating"), destillieren: () => tr("Destillieren", "Distilling"),
};

// ── 1 Teilchen und Atomsorten ──
const K1: GuideStep[] = [
  {
    mode: "worked",
    say: tr("Im Teilchenmodell ist jedes **Molekül** und jedes einzelne Atom **ein Teilchen**.", "In the particle model every **molecule** and every single atom is **one particle**."),
    ask: tr("Wie viele **Teilchen** sind im Bild?", "How many **particles** are in the picture?"),
    visual: () => <Picture p={MIX} />,
    labels: [{ at: "[data-f=\"H2O\"]", text: tr("Molekül = 1 Teilchen", "Molecule = 1 particle"), side: "left" }, { at: "[data-f=\"He\"]", text: tr("Atom = 1 Teilchen", "Atom = 1 particle"), side: "right" }],
    lines: [tr("Wassermoleküle H₂O: **4** – jedes zählt als ein Teilchen.", "Water molecules H₂O: **4** – each counts as one particle."), tr("Einzelne Heliumatome He: **3**.", "Single helium atoms He: **3**."), tr("4 + 3 = **7 Teilchen**.", "4 + 3 = **7 particles**.")],
    ok: tr("Ein Molekül ist ein Teilchen – egal aus wie vielen Atomen.", "A molecule is one particle – no matter how many atoms it has."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie viele **Teilchen** sind hier?", "Complete: how many **particles** are here?"), answer: "8", options: ["2", "8", "14"],
    visual: () => <Picture p={MIX2} />,
    lines: [tr("Kohlendioxid-Moleküle CO₂: **3**.", "Carbon dioxide molecules CO₂: **3**."), tr("Einzelne Neonatome Ne: **5**.", "Single neon atoms Ne: **5**."), tr("3 + 5 = {?} Teilchen", "3 + 5 = {?} particles")],
    why: { "14": tr("14 sind alle Atome. Ein Molekül zählt als **ein** Teilchen.", "14 is the number of atoms. A molecule counts as **one** particle."), "2": tr("2 sind die Sorten. Zähle jedes Teilchen.", "2 is the number of kinds. Count every particle.") },
    ok: tr("3 Moleküle + 5 Atome = 8 Teilchen.", "3 molecules + 5 atoms = 8 particles."),
  },
  {
    mode: "free",
    say: tr("Jede Kugel im Bild ist ein Atom.", "Each sphere in the picture is an atom."),
    ask: tr("Jetzt du: Tippe auf ein Teilchen aus **5 Atomen**.", "Your turn: tap a particle made of **5 atoms**."), answer: "CH4",
    visual: c => <Picture p={{ mix: [["CO", 3], ["CH4", 2], ["He", 3]], state: "modell" }} c={c} target="CH4" />,
    why: { "CO": tr("Kohlenmonoxid CO hat 2 Atome: C und O.", "Carbon monoxide CO has 2 atoms: C and O."), "He": tr("Helium He ist ein einzelnes Atom.", "Helium He is a single atom.") },
    tip: tr("Zähle die Kugeln in einem Teilchen.", "Count the spheres in one particle."),
    show: tr("So geht's: tippe auf ein Methan-Molekül (CH₄).", "Here's how: tap a methane molecule (CH₄)."),
    lines: [tr("Methan CH₄: 1 C + 4 H = 5 Atome.", "Methane CH₄: 1 C + 4 H = 5 atoms.")],
    ok: tr("Richtig: CH₄ hat 5 Atome.", "Right: CH₄ has 5 atoms."),
  },
  {
    mode: "worked",
    say: tr("Jede **Atomsorte** hat im Bild eine eigene Farbe.", "Each **kind of atom** has its own colour in the picture."),
    ask: tr("Wie viele **Atomsorten** sind im Bild?", "How many **kinds of atoms** are in the picture?"),
    visual: () => <Picture p={SORTEN} />,
    lines: [tr("Weiß = Wasserstoff (H).", "White = hydrogen (H)."), tr("Rot = Sauerstoff (O).", "Red = oxygen (O)."), tr("Schwarz = Kohlenstoff (C).", "Black = carbon (C)."), tr("→ **3 Atomsorten**.", "→ **3 kinds of atoms**.")],
    ok: tr("Jede Farbe zählt einmal – egal wie oft sie vorkommt.", "Each colour counts once – however often it appears."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie viele **Atomsorten**?", "Complete: how many **kinds of atoms**?"), answer: "3", options: ["2", "3", "9"],
    visual: () => <Picture p={{ mix: [["H2O", 3], ["NH3", 2]], state: "modell" }} />,
    lines: [tr("Weiß (H), rot (O), blau (N).", "White (H), red (O), blue (N)."), tr("Atomsorten: {?}", "Kinds of atoms: {?}")],
    why: { "2": tr("2 sind die Teilchensorten (Wasser H₂O, Ammoniak NH₃). Zähle die Farben.", "2 is the number of kinds of particles (water H₂O, ammonia NH₃). Count the colours."), "9": tr("Gleiche Farben zählen nur einmal.", "Identical colours count only once.") },
    ok: tr("Drei Farben → 3 Atomsorten.", "Three colours → 3 kinds of atoms."),
  },
  {
    mode: "worked",
    say: tr("Gleiche Teilchen gehören zum **selben Stoff**.", "Identical particles belong to the **same substance**."),
    ask: tr("Wie viele **Stoffe** sind im Bild?", "How many **substances** are in the picture?"),
    visual: () => <Picture p={MIX} />,
    lines: [tr("Alle Wassermoleküle H₂O sehen gleich aus → Stoff 1.", "All water molecules H₂O look the same → substance 1."), tr("Alle Heliumatome He sehen gleich aus → Stoff 2.", "All helium atoms He look the same → substance 2."), tr("→ **2 Stoffe**.", "→ **2 substances**.")],
    ok: tr("Zähle Teilchen**sorten**, nicht Teilchen.", "Count **kinds** of particles, not particles."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie viele **Stoffe** sind im Bild?", "Complete: how many **substances** are in the picture?"), answer: "4", options: ["3", "4", "8"],
    visual: () => <Picture p={SORTEN} />,
    lines: [tr("Sorten: Wasser H₂O, Kohlendioxid CO₂, Kohlenmonoxid CO, Methan CH₄.", "Kinds: water H₂O, carbon dioxide CO₂, carbon monoxide CO, methane CH₄."), tr("Anzahl der Stoffe: {?}", "Number of substances: {?}")],
    why: { "8": tr("8 sind die Teilchen. Gleiche Teilchen = ein Stoff.", "8 is the number of particles. Identical particles = one substance."), "3": tr("3 sind die Atomsorten. Gezählt werden Teilchensorten.", "3 is the number of kinds of atoms. Count kinds of particles.") },
    ok: tr("4 Teilchensorten = 4 Stoffe.", "4 kinds of particles = 4 substances."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Was ist **zwischen** den Teilchen?", "Your turn: what is **between** the particles?"), answer: tr("Nichts – leerer Raum", "Nothing – empty space"), options: [tr("Luft", "Air"), tr("Nichts – leerer Raum", "Nothing – empty space"), tr("Wasser", "Water")],
    visual: () => <Picture p={MIX} />,
    why: { [tr("Luft", "Air")]: tr("Luft besteht selbst aus Teilchen.", "Air itself consists of particles."), [tr("Wasser", "Water")]: tr("Wasser besteht aus diesen Teilchen – dazwischen ist nichts.", "Water consists of these particles – there is nothing in between.") },
    lines: [tr("Alle Stoffe bestehen aus Teilchen – dazwischen ist leerer Raum.", "All substances consist of particles – in between is empty space.")],
    ok: tr("Zwischen den Teilchen ist nichts. Die Farben im Modell helfen nur beim Unterscheiden.", "Between the particles there is nothing. The model colours only help to tell them apart."),
  },
];

// ── 2 Elemente und Verbindungen ──
const K2: GuideStep[] = [
  {
    mode: "worked",
    say: tr("**Element**: nur **eine** Atomsorte. **Verbindung**: mehrere Atomsorten fest verbunden – als Molekül wie Wasser oder im Gitter wie Kochsalz.", "**Element**: only **one** kind of atom. **Compound**: several kinds of atoms firmly bonded – as a molecule like water or in a lattice like table salt."),
    ask: tr("Element oder Verbindung?", "Element or compound?"),
    visual: () => <Picture p={{ mix: [["CO2", 3], ["Ne", 4]], state: "modell" }} />,
    labels: [{ at: "[data-f=\"Ne\"]", text: tr("Element", "Element"), side: "right" }, { at: "[data-f=\"CO2\"]", text: tr("Verbindung", "Compound"), side: "left" }],
    lines: [tr("Neon Ne: Kugeln in **einer** Farbe → eine Atomsorte → **Element**.", "Neon Ne: spheres of **one** colour → one kind of atom → **element**."), tr("Kohlendioxid CO₂: **zwei** Farben fest verbunden → **Verbindung**.", "Carbon dioxide CO₂: **two** colours firmly joined → **compound**.")],
    ok: tr("Die Farben der Kugeln zeigen die Atomsorten.", "The colours of the spheres show the kinds of atoms."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Was ist Helium He?", "Complete: what is helium He?"), answer: EL(), options: [VB(), EL()],
    visual: () => <Picture p={{ mix: [["H2O", 3], ["He", 4]], state: "modell" }} />,
    lines: [tr("Wasser H₂O: zwei Farben (H, O) → Verbindung.", "Water H₂O: two colours (H, O) → compound."), tr("Helium He: eine Farbe → {?}", "Helium He: one colour → {?}")],
    why: { [VB()]: tr("Eine Verbindung braucht mehrere Atomsorten. Helium hat nur eine.", "A compound needs several kinds of atoms. Helium has only one.") },
    ok: tr("Eine Atomsorte → Element.", "One kind of atom → element."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Tippe auf ein Teilchen, das zu einem **Element** gehört.", "Your turn: tap a particle that belongs to an **element**."), answer: "Ar",
    visual: c => <Picture p={{ mix: [["CH4", 3], ["Ar", 4]], state: "modell" }} c={c} target="Ar" />,
    why: { "CH4": tr("Methan CH₄ hat zwei Atomsorten (C und H) – eine Verbindung.", "Methane CH₄ has two kinds of atoms (C and H) – a compound.") },
    show: tr("So geht's: tippe auf ein einzelnes Argon-Atom (Ar).", "Here's how: tap a single argon atom (Ar)."),
    tip: tr("Ein Element-Teilchen hat Kugeln in nur einer Farbe.", "An element particle has spheres of only one colour."),
    lines: [tr("Argon Ar: eine Atomsorte → Element. Methan CH₄: C und H → Verbindung.", "Argon Ar: one kind of atom → element. Methane CH₄: C and H → compound.")],
    ok: tr("Richtig: Argon Ar ist ein Element.", "Right: argon Ar is an element."),
  },
  {
    mode: "worked",
    ask: tr("Wie viele der Stoffe sind **Verbindungen**?", "How many of the substances are **compounds**?"),
    visual: () => <Picture p={{ mix: [["He", 3], ["H2O", 3], ["CO2", 2]], state: "modell" }} />,
    lines: [tr("Helium He: eine Atomsorte → Element.", "Helium He: one kind of atom → element."), tr("Wasser H₂O: H und O → Verbindung.", "Water H₂O: H and O → compound."), tr("Kohlendioxid CO₂: C und O → Verbindung.", "Carbon dioxide CO₂: C and O → compound."), tr("→ **2 Verbindungen**, 1 Element.", "→ **2 compounds**, 1 element.")],
    ok: tr("Jeden Stoff einzeln prüfen – nicht die Teilchen zählen.", "Check each substance – do not count particles."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie viele Stoffe sind **Verbindungen**?", "Complete: how many substances are **compounds**?"), answer: "2", options: ["2", "3", "5"],
    visual: () => <Picture p={{ mix: [["Ne", 3], ["CO", 3], ["CH4", 2]], state: "modell" }} />,
    lines: [tr("Neon Ne: eine Farbe → Element.", "Neon Ne: one colour → element."), tr("Kohlenmonoxid CO: C und O → Verbindung.", "Carbon monoxide CO: C and O → compound."), tr("Methan CH₄: C und H → Verbindung.", "Methane CH₄: C and H → compound."), tr("Verbindungen: {?}", "Compounds: {?}")],
    why: { "3": tr("Neon hat nur eine Atomsorte – ein Element.", "Neon has only one kind of atom – an element."), "5": tr("Gefragt sind Stoffe, nicht Teilchen.", "The question asks for substances, not particles.") },
    ok: tr("Kohlenmonoxid CO und Methan CH₄: 2 Verbindungen.", "Carbon monoxide CO and methane CH₄: 2 compounds."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: **Kupfer** (Cu) – Element oder Verbindung?", "Your turn: **copper** (Cu) – element or compound?"), answer: EL(), options: [EL(), VB()],
    visual: () => <Picture p={{ mix: [["Cu", 8]], state: "fest" }} />,
    why: { [VB()]: tr("Die Atome sind im Gitter verbunden – aber alle gleich. Eine Atomsorte: Element.", "The atoms are bonded in a lattice – but all the same. One kind of atom: element.") },
    lines: [tr("Nur Cu-Atome → eine Atomsorte → Element.", "Only Cu atoms → one kind of atom → element.")],
    ok: tr("Kupfer ist ein Element.", "Copper is an element."),
  },
];

// ── 3 Reinstoffe und Gemische ──
const K3: GuideStep[] = [
  {
    mode: "worked",
    say: tr("**Reinstoff** = nur **ein** Stoff. **Gemisch** = mehrere Stoffe.", "**Pure substance** = only **one** substance. **Mixture** = several substances."),
    ask: tr("Reinstoff oder Gemisch?", "Pure substance or mixture?"),
    visual: () => <Picture p={MIX} />,
    lines: [tr("Wasser H₂O und Helium He: 2 Teilchensorten → 2 Stoffe.", "Water H₂O and helium He: 2 kinds of particles → 2 substances."), tr("→ **Gemisch**.", "→ **mixture**.")],
    ok: tr("Mehrere Stoffe → Gemisch.", "Several substances → mixture."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Reinstoff oder Gemisch?", "Complete: pure substance or mixture?"), answer: REIN(), options: [GM(), REIN()],
    visual: () => <Picture p={NUR_CO2} />,
    lines: [tr("Alle Teilchen gleich (Kohlendioxid CO₂) → ein Stoff.", "All particles identical (carbon dioxide CO₂) → one substance."), tr("Ein Stoff → {?}", "One substance → {?}")],
    why: { [GM()]: tr("Jedes Teilchen hat zwei Atomsorten – aber alle Teilchen sind gleich. Ein Stoff.", "Each particle has two kinds of atoms – but all particles are identical. One substance.") },
    ok: tr("Reinstoff – auch wenn ein Teilchen aus mehreren Atomen besteht.", "Pure substance – even if a particle consists of several atoms."),
  },
  {
    mode: "worked",
    say: tr("**Homogen**: Die Bestandteile sind auch unter dem Mikroskop nicht zu erkennen. **Heterogen**: Mit Auge, Lupe oder Mikroskop sieht man Teile, Tröpfchen oder Schichten.", "**Homogeneous**: the components cannot be seen even under a microscope. **Heterogeneous**: with the eye, a magnifier or a microscope you see pieces, droplets or layers."),
    ask: tr("Ist **Zuckerwasser** homogen oder heterogen?", "Is **sugar water** homogeneous or heterogeneous?"),
    visual: () => <Picture p={ZUCKER} />,
    labels: [{ at: "[data-f=\"C12H22O11\"]", text: tr("Zucker-Molekül", "Sugar molecule"), side: "left" }, { at: "[data-f=\"H2O\"]", text: tr("Wasser-Molekül", "Water molecule"), side: "right" }],
    lines: [tr("Zwei Stoffe: Zucker C₁₂H₂₂O₁₁ und Wasser H₂O → Gemisch.", "Two substances: sugar C₁₂H₂₂O₁₁ and water H₂O → mixture."), tr("Man sieht keine Teile – der Zucker ist bis zu den Teilchen verteilt.", "No pieces are visible – the sugar is spread down to the particles."), tr("→ **homogenes Gemisch**. Ein gelöster Stoff in Flüssigkeit heißt **Lösung**.", "→ **homogeneous mixture**. A substance dissolved in a liquid is called a **solution**.")],
    ok: tr("Klar heißt nicht rein: Zuckerwasser ist ein Gemisch.", "Clear does not mean pure: sugar water is a mixture."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Was ist **Milch**?", "Complete: what is **milk**?"), answer: HET(), options: [HOM(), HET(), REIN()],
    visual: () => <Milk />,
    labels: [{ at: ".gm-milk-fat", text: tr("Fetttröpfchen", "Fat droplet"), side: "right" }],
    lines: [tr("Im Glas: weiß, sieht überall gleich aus.", "In the glass: white, looks the same everywhere."), tr("Unter dem Mikroskop: Fetttröpfchen in Wasser.", "Under the microscope: fat droplets in water."), tr("Tröpfchen zu erkennen → {?}", "Droplets visible → {?}")],
    why: { [HOM()]: tr("Unter dem Mikroskop sieht man die Tröpfchen – also nicht überall gleich.", "Under the microscope you see the droplets – so not the same everywhere."), [REIN()]: tr("Milch enthält Wasser, Fett, Eiweiß und mehr.", "Milk contains water, fat, protein and more.") },
    ok: tr("Fetttröpfchen in Wasser → heterogen.", "Fat droplets in water → heterogeneous."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Argon Ar und Kohlendioxid CO₂ haben sich gemischt. Was ist das?", "Your turn: argon Ar and carbon dioxide CO₂ have mixed. What is it?"), answer: HOM(), options: [HET(), REIN(), HOM()],
    visual: () => <Picture p={LUFT} />,
    why: { [HET()]: tr("Gase mischen sich bis zu den Teilchen – es gibt keine Grenze.", "Gases mix down to the particles – there is no boundary."), [REIN()]: tr("Zwei Teilchensorten – also zwei Stoffe.", "Two kinds of particles – so two substances.") },
    lines: [tr("Zwei Stoffe, überall gleich verteilt → homogen (wie Luft).", "Two substances, spread evenly → homogeneous (like air).")],
    ok: tr("Gasgemische sind immer homogen.", "Gas mixtures are always homogeneous."),
  },
  {
    mode: "worked",
    say: tr("Ein Zuckerkristall liegt im Wasser. Niemand rührt um.", "A sugar crystal lies in water. Nobody stirs."),
    ask: tr("Was passiert mit den **Zuckerteilchen**?", "What happens to the **sugar particles**?"),
    visual: () => <Play p={LOESEN} />,
    lines: [tr("Vorher: Zuckerteilchen dicht gepackt im Kristall.", "Before: sugar particles packed tightly in the crystal."), tr("Alle Teilchen bewegen sich **ständig** – Wasserteilchen stoßen sie heraus.", "All particles move **all the time** – water particles knock them out."), tr("Nachher: überall zwischen den Wasserteilchen. Keines ist verschwunden.", "After: everywhere between the water particles. None has disappeared.")],
    ok: tr("Lösen = Teilchen verteilen sich. Sie bleiben erhalten.", "Dissolving = particles spread out. They are conserved."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: **20 g** Zucker lösen sich in **200 g** Wasser.", "Complete: **20 g** of sugar dissolve in **200 g** of water."), answer: "220 g", options: ["180 g", "200 g", "220 g"],
    visual: () => <Picture p={ZUCKER} />,
    lines: [tr("Wasser: 200 g. Zucker: 20 g – alle Teilchen sind noch da.", "Water: 200 g. Sugar: 20 g – all particles are still there."), tr("Zuckerwasser: {?}", "Sugar water: {?}")],
    why: { "200 g": tr("Der Zucker ist noch da – seine 20 g zählen mit.", "The sugar is still there – its 20 g count too."), "180 g": tr("Beim Lösen geht nichts verloren – addieren, nicht abziehen.", "Nothing is lost when dissolving – add, do not subtract.") },
    ok: tr("220 g – die Masse bleibt erhalten.", "220 g – the mass is conserved."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Ein Tropfen Tinte fällt in Wasser. Niemand rührt um.", "Your turn: a drop of ink falls into water. Nobody stirs."), answer: EVEN(), options: [BOTTOM(), GONE(), EVEN()],
    why: { [BOTTOM()]: tr("Die Teilchen bewegen sich in alle Richtungen – auch nach oben.", "The particles move in all directions – upwards too."), [GONE()]: tr("Teilchen verschwinden nicht – sie verteilen sich.", "Particles do not disappear – they spread out.") },
    lines: [tr("Tinten- und Wasserteilchen bewegen sich ständig → die Tinte verteilt sich von selbst.", "Ink and water particles move all the time → the ink spreads out by itself.")],
    ok: tr("Ständige Teilchenbewegung mischt Lösungen und Gase.", "Constant particle motion mixes solutions and gases."),
  },
];

// ── 4 Gemische im Alltag ──
const K4: GuideStep[] = [
  {
    mode: "worked",
    say: tr("Heterogene Gemische haben eigene Namen. Man fragt: **was** ist verteilt, und **worin**?", "Heterogeneous mixtures have their own names. Ask: **what** is spread out, and **in what**?"),
    ask: tr("Welche Arten von Gemischen gibt es?", "What types of mixtures are there?"),
    lines: [tr("Feste Körner in Flüssigkeit → **Suspension** (Sand in Wasser).", "Solid grains in a liquid → **suspension** (sand in water)."), tr("Tröpfchen in Flüssigkeit → **Emulsion** (Milch).", "Droplets in a liquid → **emulsion** (milk)."), tr("Gasblasen in Flüssigkeit → **Schaum** (Schlagsahne).", "Gas bubbles in a liquid → **foam** (whipped cream)."), tr("Nur feste Stücke nebeneinander → **Gemenge** (Müsli).", "Only solid pieces side by side → **coarse mixture** (muesli)."), tr("Homogen: Metalle bis zu den Atomen gemischt → **Legierung** (Messing).", "Homogeneous: metals mixed down to the atoms → **alloy** (brass).")],
    ok: tr("Zwei Fragen genügen: Was ist verteilt? Worin?", "Two questions are enough: what is spread out? In what?"),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: **Öl in Wasser**, kräftig geschüttelt.", "Complete: **oil in water**, shaken hard."), answer: tr("Emulsion", "Emulsion"), options: [tr("Lösung", "Solution"), tr("Emulsion", "Emulsion"), tr("Suspension", "Suspension")],
    lines: [tr("Was ist verteilt? Öl – **flüssig**, als Tröpfchen.", "What is spread out? Oil – **liquid**, as droplets."), tr("Worin? Wasser – **flüssig**.", "In what? Water – **liquid**."), tr("Tröpfchen in Flüssigkeit → {?}", "Droplets in a liquid → {?}")],
    why: { [tr("Suspension", "Suspension")]: tr("Suspension heißt: **feste** Körner. Öl ist flüssig.", "Suspension means **solid** grains. Oil is liquid."), [tr("Lösung", "Solution")]: tr("Öl löst sich nicht in Wasser – man sieht Tröpfchen.", "Oil does not dissolve in water – you can see droplets.") },
    ok: tr("Flüssig in flüssig, als Tröpfchen → Emulsion.", "Liquid in liquid, as droplets → emulsion."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Welche Art von Gemisch ist **Müsli**?", "Your turn: what type of mixture is **muesli**?"), answer: tr("Gemenge", "Coarse mixture"), options: [tr("Legierung", "Alloy"), tr("Suspension", "Suspension"), tr("Gemenge", "Coarse mixture")],
    visual: () => <div className="gm-g"><MuesliBowl mixed={1} shaking={false} /></div>,
    why: { [tr("Suspension", "Suspension")]: tr("Im Müsli ist keine Flüssigkeit – nur feste Teile.", "There is no liquid in muesli – only solid pieces."), [tr("Legierung", "Alloy")]: tr("Legierungen sind Metalle, bis zu den Atomen gemischt.", "Alloys are metals mixed down to the atoms.") },
    lines: [tr("Fest neben fest, Stücke sichtbar → Gemenge.", "Solid beside solid, pieces visible → coarse mixture.")],
    ok: tr("Feste Teile nebeneinander → Gemenge.", "Solid pieces side by side → coarse mixture."),
  },
  {
    mode: "free",
    say: tr("„Rein“ heißt auf der Packung: nichts dazugegeben. Chemisch heißt Reinstoff: nur **ein** Stoff.", "On a package “pure” means: nothing added. In chemistry a pure substance means: only **one** substance."),
    ask: tr("„100 % reiner Orangensaft“ – was ist das chemisch?", "“100 % pure orange juice” – what is it chemically?"), answer: GM(), options: [REIN(), GM()],
    why: { [REIN()]: tr("Saft enthält Wasser, Zucker, Säuren und Farbstoffe – viele Stoffe.", "Juice contains water, sugar, acids and dyes – many substances.") },
    lines: [tr("Wasser, Zucker, Säuren, Farbstoffe → viele Stoffe → Gemisch.", "Water, sugar, acids, dyes → many substances → mixture.")],
    ok: tr("Ein Gemisch – auch wenn nichts dazugegeben wurde.", "A mixture – even if nothing was added."),
  },
];

// ── 5 Stofftrennung ──
const K5: GuideStep[] = [
  {
    mode: "worked",
    say: tr("Gemische kann man trennen: **Stofftrennung**. Man nutzt eine **Eigenschaft**, in der sich die Stoffe unterscheiden.", "Mixtures can be separated: **separation**. You use a **property** in which the substances differ."),
    ask: tr("Wie trennt man **Sand und Kies**?", "How do you separate **sand and gravel**?"),
    visual: () => <Sep m="sieben" />,
    lines: [tr("Kies: große Körner. Sand: feine Körner.", "Gravel: large grains. Sand: fine grains."), tr("Das Sieb lässt nur die feinen Körner durch.", "The sieve only lets the fine grains through."), tr("→ **Sieben** nutzt die **Korngröße**.", "→ **Sieving** uses the **grain size**.")],
    ok: tr("Große Teile mit der Hand oder Pinzette herausnehmen heißt **Auslesen**.", "Taking large pieces out by hand or with tweezers is called **picking out**."),
  },
  {
    mode: "worked",
    ask: tr("Wie trennt man **Eisenpulver und Schwefel**?", "How do you separate **iron powder and sulfur**?"),
    visual: () => <Sep m="magnet" />,
    lines: [tr("Beide Pulver sind gleich fein – ein Sieb hilft nicht.", "Both powders are equally fine – a sieve does not help."), tr("Eisen wird vom Magneten angezogen, Schwefel nicht.", "Iron is attracted by the magnet, sulfur is not."), tr("→ **Magnettrennung** nutzt den **Magnetismus**.", "→ **Magnetic separation** uses **magnetism**.")],
    ok: tr("Jedes Verfahren nutzt eine andere Eigenschaft.", "Each method uses a different property."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: **rote und weiße Bohnen** trennen.", "Complete: separate **red and white beans**."), answer: M.auslesen(), options: [M.magnet(), M.sieben(), M.auslesen()],
    visual: () => <Sep m="auslesen" />,
    lines: [tr("Gleich große Teile, die verschieden aussehen.", "Pieces of the same size that look different."), tr("Mit der Pinzette herausnehmen → {?}", "Take them out with tweezers → {?}")],
    why: { [M.magnet()]: tr("Bohnen sind nicht magnetisch.", "Beans are not magnetic."), [M.sieben()]: tr("Die Bohnen sind gleich groß – sie bleiben alle zusammen im Sieb.", "The beans are the same size – they all stay in the sieve together.") },
    ok: tr("Auslesen: Teile einzeln herausnehmen.", "Picking out: take the pieces out one by one."),
  },
  {
    mode: "worked",
    say: tr("Sand in Wasser: Der **Filter** hält die festen Körner zurück.", "Sand in water: the **filter** holds back the solid grains."),
    ask: tr("Was passiert beim **Filtrieren**?", "What happens when **filtering**?"),
    visual: () => <Sep m="filtrieren" />,
    labels: [{ at: "[data-part=\"filtrat\"]", text: tr("Filtrat", "Filtrate"), side: "right" }],
    lines: [tr("Der Sand bleibt im Filter: der **Rückstand**.", "The sand stays in the filter: the **residue**."), tr("Das Wasser läuft durch: das **Filtrat**.", "The water runs through: the **filtrate**."), tr("Hat sich der Sand schon abgesetzt, gießt man das Wasser ab: **Dekantieren**.", "If the sand has already settled, you pour off the water: **decanting**.")],
    ok: tr("Filtrieren trennt Feststoff von Flüssigkeit.", "Filtering separates a solid from a liquid."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Was läuft durch den Filter?", "Complete: what runs through the filter?"), answer: tr("Filtrat", "Filtrate"), options: [tr("Rückstand", "Residue"), tr("Filtrat", "Filtrate")],
    visual: () => <div className="gm-g"><Fit className="gm-g-pic" min={0.3}><SepScene m="filtrieren" t={1} /></Fit></div>,
    lines: [tr("Oben im Filter: Sand = Rückstand.", "At the top in the filter: sand = residue."), tr("Unten im Glas: {?}", "At the bottom in the glass: {?}")],
    why: { [tr("Rückstand", "Residue")]: tr("Der Rückstand bleibt im Filter liegen.", "The residue stays in the filter.") },
    ok: tr("Das Filtrat ist die klare Flüssigkeit.", "The filtrate is the clear liquid."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Tippe auf den **Rückstand**.", "Your turn: tap the **residue**."), answer: "rueckstand",
    visual: c => <SepTap m="filtrieren" c={c} target="rueckstand" />,
    why: { "filtrat": tr("Das ist das Filtrat. Der Rückstand bleibt im Filter.", "That is the filtrate. The residue stays in the filter."), "filter": tr("Das ist das Filterpapier. Gesucht ist, was darin liegt.", "That is the filter paper. Wanted: what lies in it.") },
    tip: tr("Schau in die Spitze des Trichters.", "Look into the tip of the funnel."),
    show: tr("So geht's: tippe auf den Sand in der Trichterspitze.", "Here's how: tap the sand in the tip of the funnel."),
    ok: tr("Richtig: Der Sand im Filter ist der Rückstand.", "Right: the sand in the filter is the residue."),
  },
  {
    mode: "worked",
    say: tr("Gelöstes Salz geht durch Filterpapier. Hier hilft die **Siedetemperatur**: Wasser verdampft, Salz nicht.", "Dissolved salt passes through filter paper. Here the **boiling point** helps: water evaporates, salt does not."),
    ask: tr("Wie bekommt man Salz bzw. Wasser aus Salzwasser?", "How do you get salt or water from salt water?"),
    visual: () => <Sep m="destillieren" />,
    lines: [tr("Nur das Salz gewinnen: erhitzen, bis das Wasser weg ist → **Eindampfen**.", "Get only the salt: heat until the water is gone → **evaporating**."), tr("Auch das Wasser gewinnen: der Dampf wird im **Kühler** wieder flüssig → **Destillieren**.", "Get the water too: the vapour turns liquid in the **condenser** → **distilling**."), tr("Das aufgefangene Wasser heißt **Destillat**.", "The collected water is called the **distillate**.")],
    ok: tr("Eindampfen und Destillieren nutzen die Siedetemperatur.", "Evaporating and distilling use the boiling point."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Aus Salzwasser nur das **Salz** gewinnen.", "Complete: get only the **salt** from salt water."), answer: M.eindampfen(), options: [M.filtrieren(), M.eindampfen(), M.sieben()],
    visual: () => <Sep m="eindampfen" />,
    lines: [tr("Wasser verdampft beim Erhitzen, Salz nicht.", "Water evaporates when heated, salt does not."), tr("Das Wasser darf weg → {?}", "The water may go → {?}")],
    why: { [M.filtrieren()]: tr("Gelöstes Salz geht mit dem Wasser durch den Filter.", "Dissolved salt passes through the filter with the water."), [M.sieben()]: tr("Gelöstes Salz geht durch jedes Sieb.", "Dissolved salt passes through any sieve.") },
    ok: tr("Eindampfen: Das Salz bleibt in der Schale.", "Evaporating: the salt stays in the dish."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Aus Salzwasser **sauberes Wasser** gewinnen.", "Your turn: get **clean water** from salt water."), answer: M.destillieren(), options: [M.eindampfen(), M.filtrieren(), M.destillieren()],
    why: { [M.eindampfen()]: tr("Beim Eindampfen geht das Wasser als Dampf verloren.", "When evaporating, the water is lost as vapour."), [M.filtrieren()]: tr("Gelöstes Salz geht mit dem Wasser durch den Filter.", "Dissolved salt passes through the filter with the water.") },
    lines: [tr("Der Dampf wird im Kühler aufgefangen → Destillat = sauberes Wasser.", "The vapour is caught in the condenser → distillate = clean water.")],
    ok: tr("Destillieren: Das Wasser geht nicht verloren.", "Distilling: the water is not lost."),
  },
  {
    mode: "worked",
    say: tr("Schwarze Filzstift-Farbe ist ein Gemisch aus Farbstoffen.", "Black felt-tip ink is a mixture of dyes."),
    ask: tr("Was passiert bei der **Chromatografie**?", "What happens in **chromatography**?"),
    visual: () => <Sep m="chromatografie" />,
    lines: [tr("Das **Laufmittel** (Wasser) steigt im Papier hoch.", "The **solvent** (water) rises up the paper."), tr("Es nimmt die Farbstoffe mit – verschieden weit.", "It carries the dyes along – different distances."), tr("Wer schwach am Papier haftet, wandert weit.", "Whatever sticks weakly to the paper moves far.")],
    ok: tr("Aus einem schwarzen Fleck werden mehrere Farben.", "One black spot turns into several colours."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Welcher Farbstoff haftet **am stärksten**?", "Complete: which dye sticks **most strongly**?"), answer: tr("Gelb", "Yellow"), options: [tr("Blau", "Blue"), tr("Rot", "Red"), tr("Gelb", "Yellow")],
    visual: () => <div className="gm-g"><Fit className="gm-g-pic" min={0.3}><SepScene m="chromatografie" t={1} /></Fit></div>,
    lines: [tr("Gelb ist am wenigsten weit gewandert.", "Yellow has moved the least."), tr("Am stärksten haftet: {?}", "Sticks most strongly: {?}")],
    why: { [tr("Blau", "Blue")]: tr("Blau ist am weitesten gewandert – es haftet am schwächsten.", "Blue moved furthest – it sticks least."), [tr("Rot", "Red")]: tr("Rot liegt in der Mitte.", "Red is in the middle.") },
    ok: tr("Kurzer Weg = starkes Haften.", "Short way = strong sticking."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Tippe auf den Farbstoff, der **am weitesten** gewandert ist.", "Your turn: tap the dye that moved **the furthest**."), answer: "blau",
    visual: c => <SepTap m="chromatografie" c={c} target="blau" />,
    why: { "rot": tr("Rot ist weiter als Gelb, aber nicht am weitesten.", "Red moved further than yellow, but not the furthest."), "gelb": tr("Gelb haftet stark und wandert am wenigsten.", "Yellow sticks strongly and moves least.") },
    tip: tr("Der Start ist die gestrichelte Linie unten.", "The start is the dashed line at the bottom."),
    show: tr("So geht's: tippe auf den obersten Fleck.", "Here's how: tap the top spot."),
    ok: tr("Blau haftet am schwächsten und wandert am weitesten.", "Blue sticks least and moves furthest."),
  },
];

const T = (de: string, en: string) => tr(de, en);
/** Lektionen der fünf Kapitel (Index = Level) */
export const LESSONS: GuideDef[] = [
  { title: T("Teilchen und Atomsorten", "Particles and kinds of atoms"), steps: K1, outro: [T("Molekül und einzelnes Atom = ein Teilchen.", "Molecule and single atom = one particle."), T("Farben zeigen Atomsorten, gleiche Teilchen = ein Stoff.", "Colours show kinds of atoms, identical particles = one substance.")] },
  { title: T("Elemente und Verbindungen", "Elements and compounds"), steps: K2, known: [T("Teilchen", "particle"), T("Stoff", "substance"), T("Atomsorte", "kind of atom")], outro: [T("Element: eine Atomsorte. Verbindung: mehrere in einem Teilchen.", "Element: one kind of atom. Compound: several in one particle.")] },
  { title: T("Reinstoffe und Gemische", "Pure substances and mixtures"), steps: K3, known: [T("Element", "element"), T("Verbindung", "compound")], outro: [T("Reinstoff oder Gemisch, homogen oder heterogen.", "Pure substance or mixture, homogeneous or heterogeneous."), T("Beim Lösen bleiben Teilchen und Masse erhalten.", "When dissolving, particles and mass are conserved.")] },
  { title: T("Gemische im Alltag", "Mixtures in everyday life"), steps: K4, known: [T("Reinstoff", "pure substance"), T("Gemisch", "mixture"), T("Lösung", "solution"), T("homogen", "homogeneous"), T("heterogen", "heterogeneous")], outro: [T("Suspension, Emulsion, Schaum, Gemenge, Legierung.", "Suspension, emulsion, foam, coarse mixture, alloy."), T("„Rein“ auf der Packung ist kein Reinstoff.", "“Pure” on the package is not a pure substance.")] },
  { title: T("Stofftrennung", "Separating mixtures"), steps: K5, known: [T("Gelb", "Yellow"), T("Blau", "Blue"), T("Rot", "Red")], outro: [T("Sieben, Auslesen, Magnet, Filtrieren, Dekantieren.", "Sieving, picking out, magnet, filtering, decanting."), T("Eindampfen, Destillieren, Chromatografie.", "Evaporating, distilling, chromatography.")] },
];
