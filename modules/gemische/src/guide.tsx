// Geführte Erklärung Gemische: mit den Teilchenbildern der App (Kalotten im Gefäß). Je Gedanke vorgemacht → halb gelöst → selbst. Teilchen, Stoffe, Element und
// Verbindung, Reinstoff und Gemisch, homogen/heterogen, Arten von Gemischen, „rein“ im Alltag, Lösen im Teilchenmodell.

import { useEffect, useState } from "react";
import { Fit, type GuideCtx, type GuideDef, type GuideStep } from "@lern/ui";
import { toSubscript } from "@lern/chem";
import { Beaker } from "./components/Beaker.tsx";
import { MuesliBowl } from "./components/MuesliBowl.tsx";
import { initial, seedOf } from "./mixing.ts";
import type { Pic } from "./quiz/tasks.ts";
import { nameOf } from "./mixtures.ts";
import { tr } from "@lern/i18n";

/** Teilchenbild; mit `target` sind Teilchen antippbar (Ziel = Formel), darunter dieselben Stoffe als Knöpfe */
function Picture({ p, c, target }: { p: Pic; c?: GuideCtx; target?: string }) {
  const sim = initial({ items: p.mix, state: p.state, floats: p.floats, before: p.before, solute: p.solute }, seedOf(JSON.stringify(p)), p.arrange ?? "nachher");
  const label = `${tr("Teilchenbild", "Particle picture")}: ${p.mix.map(([f, n]) => `${n} × ${nameOf(f)}`).join(", ")}`;
  return (
    <div className="gm-g">
      <Fit className="gm-g-pic" min={0.2}><Beaker sim={sim} label={label} onPick={target && c ? f => c.pick(f) : undefined} /></Fit>
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
  return <div className="gm-g gm-slow"><Fit className="gm-g-pic" min={0.2}><Beaker sim={sim} label={label} /></Fit></div>;
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
const GASE: Pic = { mix: [["Ar", 9], ["CO2", 4]], state: "gas", before: "getrennt" };

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

const HOM = () => tr("homogenes Gemisch", "homogeneous mixture"), HET = () => tr("heterogenes Gemisch", "heterogeneous mixture"), REIN = () => tr("Reinstoff", "Pure substance");
const EL = () => tr("Element", "Element"), VB = () => tr("Verbindung", "Compound"), GM = () => tr("Gemisch", "Mixture");
const EVEN = () => tr("überall gleich gefärbt", "evenly coloured everywhere"), BOTTOM = () => tr("Tinte bleibt unten", "ink stays at the bottom"), GONE = () => tr("Tinte verschwindet", "the ink disappears");

const STEPS: GuideStep[] = [
  // ── Teilchen und Stoffe ──
  {
    mode: "worked", part: tr("Teilchen und Stoffe", "Particles and substances"),
    say: tr("Im Teilchenmodell ist jedes Molekül und jedes einzelne Atom **ein Teilchen**.", "In the particle model every molecule and every single atom is **one particle**."),
    ask: tr("Wie viele **Teilchen** sind im Bild?", "How many **particles** are in the picture?"),
    visual: () => <Picture p={MIX} />,
    labels: [{ at: "[data-f=\"H2O\"]", text: tr("Molekül = 1 Teilchen", "Molecule = 1 particle"), side: "left" }, { at: "[data-f=\"He\"]", text: tr("Atom = 1 Teilchen", "Atom = 1 particle"), side: "right" }],
    lines: [tr("Wassermoleküle: **4** – jedes zählt als ein Teilchen.", "Water molecules: **4** – each counts as one particle."), tr("Einzelne Heliumatome: **3**.", "Single helium atoms: **3**."), tr("4 + 3 = **7 Teilchen**.", "4 + 3 = **7 particles**.")],
    ok: tr("Ein Molekül ist ein Teilchen – egal aus wie vielen Atomen.", "A molecule is one particle – no matter how many atoms it has."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie viele **Teilchen** sind hier?", "Complete: how many **particles** are here?"), answer: 8, num: {},
    visual: () => <Picture p={MIX2} />,
    lines: [tr("CO₂-Moleküle: **3**.", "CO₂ molecules: **3**."), tr("Einzelne Neonatome: **5**.", "Single neon atoms: **5**."), tr("3 + 5 = {?} Teilchen", "3 + 5 = {?} particles")],
    why: { "14": tr("14 sind alle Atome. Ein Molekül zählt als **ein** Teilchen.", "14 is the number of atoms. A molecule counts as **one** particle.") },
    tip: tr("Zähle Moleküle und einzelne Atome zusammen.", "Add molecules and single atoms."),
    ok: tr("3 Moleküle + 5 Atome = 8 Teilchen.", "3 molecules + 5 atoms = 8 particles."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Wie viele **Teilchen** sind im Bild?", "Your turn: how many **particles** are in the picture?"), answer: 8, num: {},
    visual: () => <Picture p={SORTEN} />,
    why: { "24": tr("24 sind alle Atome. Ein Molekül zählt als **ein** Teilchen.", "24 is the number of atoms. A molecule counts as **one** particle."), "4": tr("4 sind die Stoffe. Zähle jedes Teilchen.", "4 is the number of substances. Count every particle.") },
    tip: tr("Jedes Molekül zählt einmal – egal wie viele Kugeln es hat.", "Each molecule counts once – however many spheres it has."),
    lines: [tr("3 Wasser + 2 CO₂ + 2 CO + 1 Methan = 8 Teilchen.", "3 water + 2 CO₂ + 2 CO + 1 methane = 8 particles.")],
    ok: tr("Genau: 8 Teilchen.", "Exactly: 8 particles."),
  },
  {
    mode: "worked",
    say: tr("Gleiche Teilchen gehören zum **selben Stoff**. **Reinstoff** = ein Stoff, **Gemisch** = mehrere Stoffe.", "Identical particles belong to the **same substance**. **Pure substance** = one substance, **mixture** = several."),
    ask: tr("Wie viele Stoffe – Reinstoff oder Gemisch?", "How many substances – pure substance or mixture?"),
    visual: () => <Picture p={MIX} />,
    lines: [tr("Alle Wassermoleküle sehen gleich aus → Stoff 1.", "All water molecules look the same → substance 1."), tr("Alle Heliumatome sehen gleich aus → Stoff 2.", "All helium atoms look the same → substance 2."), tr("2 Stoffe → **Gemisch**.", "2 substances → **mixture**.")],
    ok: tr("Zähle Teilchen**sorten**, nicht Teilchen.", "Count **kinds** of particles, not particles."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie viele **Stoffe** sind im Bild?", "Complete: how many **substances** are in the picture?"), answer: 4, num: {},
    visual: () => <Picture p={SORTEN} />,
    lines: [tr("Sorten: Wasser, Kohlendioxid, Kohlenstoffmonoxid, Methan.", "Kinds: water, carbon dioxide, carbon monoxide, methane."), tr("Anzahl der Stoffe: {?}", "Number of substances: {?}")],
    why: { "8": tr("8 sind die Teilchen. Gleiche Teilchen = ein Stoff.", "8 is the number of particles. Identical particles = one substance."), "3": tr("3 sind die Atomsorten. Gezählt werden Teilchensorten.", "3 is the number of kinds of atoms. Count kinds of particles.") },
    tip: tr("Zähle die Namen in der ersten Zeile.", "Count the names in the first line."),
    ok: tr("4 Teilchensorten = 4 Stoffe → Gemisch.", "4 kinds of particles = 4 substances → mixture."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Reinstoff oder Gemisch?", "Your turn: pure substance or mixture?"), answer: REIN(), options: [REIN(), GM()],
    visual: () => <Picture p={NUR_CO2} />,
    why: { [GM()]: tr("Jedes Teilchen hat zwei Atomsorten – aber alle Teilchen sind gleich. Ein Stoff.", "Each particle has two kinds of atoms – but all particles are identical. One substance.") },
    lines: [tr("Alle Teilchen gleich (CO₂) → ein Stoff → Reinstoff.", "All particles identical (CO₂) → one substance → pure substance.")],
    ok: tr("Reinstoff – auch wenn ein Teilchen aus mehreren Atomen besteht.", "Pure substance – even if a particle consists of several atoms."),
  },
  // ── Element und Verbindung ──
  {
    mode: "worked", part: tr("Element und Verbindung", "Element and compound"),
    say: tr("**Element**: Teilchen aus nur **einer** Atomsorte. **Verbindung**: mehrere Atomsorten fest in einem Teilchen.", "**Element**: particles of only **one** kind of atom. **Compound**: several kinds of atoms firmly in one particle."),
    ask: tr("Element oder Verbindung?", "Element or compound?"),
    visual: () => <Picture p={{ mix: [["CO2", 3], ["Ne", 4]], state: "modell" }} />,
    labels: [{ at: "[data-f=\"Ne\"]", text: tr("Element", "Element"), side: "right" }, { at: "[data-f=\"CO2\"]", text: tr("Verbindung", "Compound"), side: "left" }],
    lines: [tr("Neon: Kugeln in **einer** Farbe → eine Atomsorte → **Element**.", "Neon: spheres of **one** colour → one kind of atom → **element**."), tr("CO₂: **zwei** Farben fest verbunden → **Verbindung**.", "CO₂: **two** colours firmly joined → **compound**.")],
    ok: tr("Die Farben der Kugeln zeigen die Atomsorten.", "The colours of the spheres show the kinds of atoms."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Was ist Helium?", "Complete: what is helium?"), answer: EL(), options: [EL(), VB()],
    visual: () => <Picture p={{ mix: [["H2O", 3], ["He", 4]], state: "modell" }} />,
    lines: [tr("Wasser: zwei Farben (H, O) → Verbindung.", "Water: two colours (H, O) → compound."), tr("Helium: eine Farbe → {?}", "Helium: one colour → {?}")],
    why: { [VB()]: tr("Eine Verbindung braucht mehrere Atomsorten. Helium hat nur eine.", "A compound needs several kinds of atoms. Helium has only one.") },
    ok: tr("Eine Atomsorte → Element.", "One kind of atom → element."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Tippe auf ein Teilchen, das zu einem **Element** gehört.", "Your turn: tap a particle that belongs to an **element**."), answer: "Ar",
    visual: c => <Picture p={{ mix: [["CH4", 3], ["Ar", 4]], state: "modell" }} c={c} target="Ar" />,
    why: { "CH4": tr("Methan hat zwei Atomsorten (C und H) – eine Verbindung.", "Methane has two kinds of atoms (C and H) – a compound.") },
    show: tr("So geht's: tippe auf ein einzelnes Argon-Atom (Ar).", "Here's how: tap a single argon atom (Ar)."),
    tip: tr("Ein Element-Teilchen hat Kugeln in nur einer Farbe.", "An element particle has spheres of only one colour."),
    lines: [tr("Argon: eine Atomsorte → Element. Methan: C und H → Verbindung.", "Argon: one kind of atom → element. Methane: C and H → compound.")],
    ok: tr("Richtig: Argon ist ein Element.", "Right: argon is an element."),
  },
  {
    mode: "worked",
    ask: tr("Wie viele der Stoffe sind **Verbindungen**?", "How many of the substances are **compounds**?"),
    visual: () => <Picture p={{ mix: [["He", 3], ["H2O", 3], ["CO2", 2]], state: "modell" }} />,
    lines: [tr("Helium: eine Atomsorte → Element.", "Helium: one kind of atom → element."), tr("Wasser: H und O → Verbindung.", "Water: H and O → compound."), tr("CO₂: C und O → Verbindung.", "CO₂: C and O → compound."), tr("→ **2 Verbindungen**, 1 Element.", "→ **2 compounds**, 1 element.")],
    ok: tr("Jeden Stoff einzeln prüfen – nicht die Teilchen zählen.", "Check each substance – do not count particles."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Wie viele Stoffe sind **Verbindungen**?", "Complete: how many substances are **compounds**?"), answer: 2, num: {},
    visual: () => <Picture p={{ mix: [["Ne", 3], ["CO", 3], ["CH4", 2]], state: "modell" }} />,
    lines: [tr("Neon: eine Farbe → Element.", "Neon: one colour → element."), tr("CO: C und O → Verbindung.", "CO: C and O → compound."), tr("Methan: C und H → Verbindung.", "Methane: C and H → compound."), tr("Verbindungen: {?}", "Compounds: {?}")],
    why: { "3": tr("Neon hat nur eine Atomsorte – ein Element.", "Neon has only one kind of atom – an element."), "5": tr("Gefragt sind Stoffe, nicht Teilchen.", "The question asks for substances, not particles.") },
    tip: tr("Zähle die Zeilen, die mit „Verbindung“ enden.", "Count the lines ending in “compound”."),
    ok: tr("CO und Methan: 2 Verbindungen.", "CO and methane: 2 compounds."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: **Kupfer** (Cu) – Element, Verbindung oder Gemisch?", "Your turn: **copper** (Cu) – element, compound or mixture?"), answer: EL(), options: [EL(), VB(), GM()],
    visual: () => <Picture p={{ mix: [["Cu", 8]], state: "fest" }} />,
    why: { [VB()]: tr("Die Atome sind im Gitter verbunden – aber alle gleich. Eine Atomsorte: Element.", "The atoms are bonded in a lattice – but all the same. One kind of atom: element."), [GM()]: tr("Alle Teilchen sind gleich – ein Reinstoff.", "All particles are the same – a pure substance.") },
    lines: [tr("Nur Cu-Atome → eine Atomsorte → Element.", "Only Cu atoms → one kind of atom → element.")],
    ok: tr("Kupfer ist ein Element.", "Copper is an element."),
  },
  // ── Arten von Gemischen ──
  {
    mode: "worked", part: tr("Arten von Gemischen", "Types of mixtures"),
    say: tr("**Homogen**: überall gleich, keine Grenze zu sehen. **Heterogen**: Teile, Tröpfchen oder Schichten sind zu erkennen.", "**Homogeneous**: the same everywhere, no boundary visible. **Heterogeneous**: pieces, droplets or layers can be seen."),
    ask: tr("Ist **Zuckerwasser** homogen oder heterogen?", "Is **sugar water** homogeneous or heterogeneous?"),
    visual: () => <Picture p={ZUCKER} />,
    labels: [{ at: "[data-f=\"C12H22O11\"]", text: tr("Zucker-Molekül", "Sugar molecule"), side: "left" }, { at: "[data-f=\"H2O\"]", text: tr("Wasser-Molekül", "Water molecule"), side: "right" }],
    lines: [tr("Zwei Stoffe: Zucker und Wasser → Gemisch.", "Two substances: sugar and water → mixture."), tr("Man sieht keine Teile – der Zucker ist bis zu den Teilchen verteilt.", "No pieces are visible – the sugar is spread down to the particles."), tr("→ **homogenes Gemisch**. Ein gelöster Stoff in Flüssigkeit heißt **Lösung**.", "→ **homogeneous mixture**. A substance dissolved in a liquid is called a **solution**.")],
    ok: tr("Klar heißt nicht rein: Zuckerwasser ist ein Gemisch.", "Clear does not mean pure: sugar water is a mixture."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Was ist **Milch**?", "Complete: what is **milk**?"), answer: HET(), options: [HOM(), HET(), REIN()],
    visual: () => <Milk />,
    labels: [{ at: ".gm-milk-fat", text: tr("Fetttröpfchen", "Fat droplet"), side: "right" }],
    lines: [tr("Im Glas: weiß, sieht überall gleich aus.", "In the glass: white, looks the same everywhere."), tr("Unter dem Mikroskop: Fetttröpfchen in Wasser.", "Under the microscope: fat droplets in water."), tr("Tröpfchen zu erkennen → {?}", "Droplets visible → {?}")],
    why: { [HOM()]: tr("Unter dem Mikroskop sieht man die Tröpfchen – also nicht überall gleich.", "Under the microscope you see the droplets – so not the same everywhere."), [REIN()]: tr("Milch enthält Wasser, Fett, Eiweiß und mehr.", "Milk contains water, fat, protein and more.") },
    ok: tr("Fetttröpfchen in Wasser → heterogen (Emulsion).", "Fat droplets in water → heterogeneous (emulsion)."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Argon und CO₂ haben sich gemischt. Was ist das?", "Your turn: argon and CO₂ have mixed. What is it?"), answer: HOM(), options: [HOM(), HET(), REIN()],
    visual: () => <Picture p={LUFT} />,
    why: { [HET()]: tr("Gase mischen sich bis zu den Teilchen – es gibt keine Grenze.", "Gases mix down to the particles – there is no boundary."), [REIN()]: tr("Zwei Teilchensorten – also zwei Stoffe.", "Two kinds of particles – so two substances.") },
    lines: [tr("Zwei Stoffe, überall gleich verteilt → homogen (Gasgemisch, wie Luft).", "Two substances, spread evenly → homogeneous (gas mixture, like air).")],
    ok: tr("Gasgemische sind immer homogen.", "Gas mixtures are always homogeneous."),
  },
  {
    mode: "worked",
    say: tr("Heterogene Gemische haben eigene Namen. Man fragt: **was** ist verteilt, und **worin**?", "Heterogeneous mixtures have their own names. Ask: **what** is spread out, and **in what**?"),
    ask: tr("Welche Arten von Gemischen gibt es?", "What types of mixtures are there?"),
    lines: [tr("Feste Körner in Flüssigkeit → **Suspension** (Sand in Wasser).", "Solid grains in a liquid → **suspension** (sand in water)."), tr("Tröpfchen in Flüssigkeit → **Emulsion** (Milch, geschütteltes Öl in Wasser).", "Droplets in a liquid → **emulsion** (milk, shaken oil in water)."), tr("Gasblasen in Flüssigkeit → **Schaum** (Schlagsahne).", "Gas bubbles in a liquid → **foam** (whipped cream)."), tr("Nur feste Stücke nebeneinander → **Gemenge** (Müsli, Sand und Kies).", "Only solid pieces side by side → **coarse mixture** (muesli, sand and gravel)."), tr("Homogen dagegen: Metalle bis zu den Atomen gemischt → **Legierung** (Messing).", "Homogeneous instead: metals mixed down to the atoms → **alloy** (brass).")],
    ok: tr("Zwei Fragen genügen: Was ist verteilt? Worin?", "Two questions are enough: what is spread out? In what?"),
  },
  {
    mode: "worked",
    ask: tr("Welche Art von Gemisch ist **Sand in Wasser**?", "What type of mixture is **sand in water**?"),
    lines: [tr("Was ist verteilt? Sand – **fest**, als Körner.", "What is spread out? Sand – **solid**, as grains."), tr("Worin? Wasser – **flüssig**.", "In what? Water – **liquid**."), tr("Feste Körner in Flüssigkeit → **Suspension**.", "Solid grains in a liquid → **suspension**.")],
    ok: tr("Erst „was“, dann „worin“ – dann steht die Art fest.", "First “what”, then “in what” – then the type is clear."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: **Öl in Wasser**, kräftig geschüttelt.", "Complete: **oil in water**, shaken hard."), answer: tr("Emulsion", "Emulsion"), options: [tr("Emulsion", "Emulsion"), tr("Suspension", "Suspension"), tr("Lösung", "Solution")],
    lines: [tr("Was ist verteilt? Öl – **flüssig**, als Tröpfchen.", "What is spread out? Oil – **liquid**, as droplets."), tr("Worin? Wasser – **flüssig**.", "In what? Water – **liquid**."), tr("Tröpfchen in Flüssigkeit → {?}", "Droplets in a liquid → {?}")],
    why: { [tr("Suspension", "Suspension")]: tr("Suspension heißt: **feste** Körner. Öl ist flüssig.", "Suspension means **solid** grains. Oil is liquid."), [tr("Lösung", "Solution")]: tr("Öl löst sich nicht in Wasser – man sieht Tröpfchen.", "Oil does not dissolve in water – you can see droplets.") },
    ok: tr("Flüssig in flüssig, als Tröpfchen → Emulsion.", "Liquid in liquid, as droplets → emulsion."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Welche Art von Gemisch ist **Müsli**?", "Your turn: what type of mixture is **muesli**?"), answer: tr("Gemenge", "Coarse mixture"), options: [tr("Gemenge", "Coarse mixture"), tr("Suspension", "Suspension"), tr("Legierung", "Alloy")],
    visual: () => <div className="gm-g"><MuesliBowl mixed={1} shaking={false} /></div>,
    why: { [tr("Suspension", "Suspension")]: tr("Im Müsli ist keine Flüssigkeit – nur feste Teile.", "There is no liquid in muesli – only solid pieces."), [tr("Legierung", "Alloy")]: tr("Legierungen sind Metalle, bis zu den Atomen gemischt.", "Alloys are metals mixed down to the atoms.") },
    lines: [tr("Fest neben fest, Stücke sichtbar → Gemenge.", "Solid beside solid, pieces visible → coarse mixture.")],
    ok: tr("Feste Teile nebeneinander → Gemenge.", "Solid pieces side by side → coarse mixture."),
  },
  {
    mode: "free",
    say: tr("„Rein“ heißt auf der Packung: nichts dazugegeben. In der Chemie heißt **Reinstoff**: nur **ein** Stoff.", "On a package “pure” means: nothing added. In chemistry a **pure substance** means: only **one** substance."),
    ask: tr("„100 % reiner Orangensaft“ – was ist das chemisch?", "“100 % pure orange juice” – what is it chemically?"), answer: GM(), options: [GM(), REIN()],
    why: { [REIN()]: tr("Saft enthält Wasser, Zucker, Säuren und Farbstoffe – viele Stoffe.", "Juice contains water, sugar, acids and dyes – many substances.") },
    lines: [tr("Wasser, Zucker, Säuren, Farbstoffe → viele Stoffe → Gemisch.", "Water, sugar, acids, dyes → many substances → mixture.")],
    ok: tr("Ein Gemisch – auch wenn nichts dazugegeben wurde.", "A mixture – even if nothing was added."),
  },
  // ── Lösen und Mischen ──
  {
    mode: "worked", part: tr("Lösen und Mischen", "Dissolving and mixing"),
    say: tr("Ein Zuckerkristall liegt im Wasser. Niemand rührt um.", "A sugar crystal lies in water. Nobody stirs."),
    ask: tr("Was passiert mit den **Zuckerteilchen**?", "What happens to the **sugar particles**?"),
    visual: () => <Play p={LOESEN} />,
    lines: [tr("Vorher: Zuckerteilchen dicht gepackt im Kristall.", "Before: sugar particles packed tightly in the crystal."), tr("Alle Teilchen bewegen sich **ständig** – Wasserteilchen stoßen sie heraus.", "All particles move **all the time** – water particles knock them out."), tr("Nachher: überall zwischen den Wasserteilchen. Keines ist verschwunden.", "After: everywhere between the water particles. None has disappeared.")],
    ok: tr("Lösen = Teilchen verteilen sich. Sie bleiben erhalten.", "Dissolving = particles spread out. They are conserved."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: **20 g** Zucker lösen sich in **200 g** Wasser.", "Complete: **20 g** of sugar dissolve in **200 g** of water."), answer: 220, num: { unit: "g" },
    visual: () => <Picture p={ZUCKER} />,
    lines: [tr("Wasser: 200 g.", "Water: 200 g."), tr("Zucker: 20 g – alle Teilchen sind noch da.", "Sugar: 20 g – all particles are still there."), tr("Zuckerwasser: 200 g + 20 g = {?} g", "Sugar water: 200 g + 20 g = {?} g")],
    why: { "200": tr("Der Zucker ist noch da – seine 20 g zählen mit.", "The sugar is still there – its 20 g count too.") },
    tip: tr("Rechne die letzte Zeile aus.", "Work out the last line."),
    ok: tr("220 g – die Masse bleibt erhalten.", "220 g – the mass is conserved."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: **10 g** Salz lösen sich in **90 g** Wasser. Wie schwer ist das Salzwasser?", "Your turn: **10 g** of salt dissolve in **90 g** of water. How heavy is the salt water?"), answer: 100, num: { unit: "g" },
    why: { "90": tr("Das Salz ist nur verteilt – seine 10 g zählen mit.", "The salt is only spread out – its 10 g count too."), "80": tr("Beim Lösen geht nichts verloren – addieren, nicht abziehen.", "Nothing is lost when dissolving – add, do not subtract.") },
    tip: tr("Beim Lösen geht kein Teilchen verloren.", "No particle is lost when dissolving."),
    lines: [tr("90 g + 10 g = 100 g.", "90 g + 10 g = 100 g.")],
    ok: tr("Richtig – Masse bleibt erhalten.", "Right – mass is conserved."),
  },
  {
    mode: "worked",
    say: tr("Links Kohlendioxid, rechts Argon. Die Trennwand wird entfernt.", "Carbon dioxide on the left, argon on the right. The divider is removed."),
    ask: tr("Was passiert mit den Gasen?", "What happens to the gases?"),
    visual: () => <Play p={GASE} />,
    lines: [tr("Gasteilchen fliegen ständig umher.", "Gas particles fly around all the time."), tr("Ohne Wand fliegen sie auch auf die andere Seite.", "Without the wall they fly to the other side too."), tr("→ Die Gase mischen sich **von selbst**, ohne Schütteln.", "→ The gases mix **by themselves**, without shaking.")],
    ok: tr("Ständige Teilchenbewegung mischt Gase und Lösungen.", "Constant particle motion mixes gases and solutions."),
  },
  {
    mode: "faded",
    ask: tr("Ergänze: Ein Tropfen Tinte fällt in Wasser. Niemand rührt um.", "Complete: a drop of ink falls into water. Nobody stirs."), answer: EVEN(), options: [EVEN(), BOTTOM(), GONE()],
    lines: [tr("Tintenteilchen bewegen sich ständig.", "Ink particles move all the time."), tr("Wasserteilchen auch.", "Water particles too."), tr("Nach einiger Zeit: {?}", "After a while: {?}")],
    why: { [BOTTOM()]: tr("Die Teilchen bewegen sich in alle Richtungen – auch nach oben.", "The particles move in all directions – upwards too."), [GONE()]: tr("Teilchen verschwinden nicht – sie verteilen sich.", "Particles do not disappear – they spread out.") },
    ok: tr("Die Tinte verteilt sich von selbst.", "The ink spreads out by itself."),
  },
  {
    mode: "free",
    ask: tr("Jetzt du: Was ist **zwischen** den Teilchen?", "Your turn: what is **between** the particles?"), answer: tr("Nichts – leerer Raum", "Nothing – empty space"), options: [tr("Nichts – leerer Raum", "Nothing – empty space"), tr("Luft", "Air"), tr("Wasser", "Water")],
    visual: () => <Picture p={MIX} />,
    why: { [tr("Luft", "Air")]: tr("Luft besteht selbst aus Teilchen.", "Air itself consists of particles."), [tr("Wasser", "Water")]: tr("Wasser besteht aus diesen Teilchen – dazwischen ist nichts.", "Water consists of these particles – there is nothing in between.") },
    labels: [{ at: "[data-f=\"H2O\"]", text: tr("Teilchen", "Particle"), side: "left" }],
    lines: [tr("Alle Stoffe bestehen aus Teilchen – dazwischen ist leerer Raum.", "All substances consist of particles – in between is empty space.")],
    ok: tr("Zwischen den Teilchen ist nichts.", "Between the particles there is nothing."),
  },
  {
    mode: "free",
    say: tr("Die Farben im Modell sind nur zur Unterscheidung.", "The colours in the model are only to tell things apart."),
    ask: tr("Kupfer ist rotbraun. Welche Farbe hat ein **einzelnes Kupferatom**?", "Copper is reddish brown. What colour is a **single copper atom**?"), answer: tr("Keine – Farbe hat erst der Stoff", "None – only the substance has a colour"),
    options: [tr("Keine – Farbe hat erst der Stoff", "None – only the substance has a colour"), tr("Rotbraun wie Kupfer", "Reddish brown like copper"), tr("Orange wie im Modell", "Orange like in the model")],
    visual: () => <Picture p={{ mix: [["Cu", 8]], state: "fest" }} />,
    why: { [tr("Rotbraun wie Kupfer", "Reddish brown like copper")]: tr("Die Farbe entsteht erst durch sehr viele Atome.", "The colour only comes from very many atoms."), [tr("Orange wie im Modell", "Orange like in the model")]: tr("Modellfarben unterscheiden nur die Atomsorten.", "Model colours only tell the kinds of atoms apart.") },
    ok: tr("Farbe, fest, flüssig – das sind Eigenschaften des Stoffs, nicht eines Teilchens.", "Colour, solid, liquid – these are properties of the substance, not of a particle."),
  },
];

export const GUIDE: GuideDef = {
  title: tr("Gemische", "Mixtures"), steps: STEPS, outro: [
    tr("Teilchen zählen, gleiche Teilchen = ein Stoff, Farben = Atomsorten.", "Count particles, identical particles = one substance, colours = kinds of atoms."),
    tr("Reinstoff (Element oder Verbindung) oder Gemisch (mehrere Stoffe).", "Pure substance (element or compound) or mixture (several substances)."),
    tr("Homogen oder heterogen; Lösung, Suspension, Emulsion, Schaum, Legierung, Gemenge.", "Homogeneous or heterogeneous; solution, suspension, emulsion, foam, alloy, coarse mixture."),
    tr("„Rein“ auf der Packung ist kein Reinstoff.", "“Pure” on the package is not a pure substance."),
    tr("Beim Lösen bleiben Teilchen und Masse erhalten; dazwischen ist leerer Raum.", "When dissolving, particles and mass are conserved; in between there is empty space."),
  ],
};
