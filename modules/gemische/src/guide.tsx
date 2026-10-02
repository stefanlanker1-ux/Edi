// Geführte Erklärung Gemische: mit den Teilchenbildern der App (Kalotten im Gefäß). Teilchen, Stoffe, Element und
// Verbindung, Reinstoff und Gemisch, homogen/heterogen, Arten von Gemischen, „rein“ im Alltag, Lösen im Teilchenmodell.

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

const MIX: Pic = { mix: [["H2O", 4], ["He", 3]], state: "modell" };
const SORTEN: Pic = { mix: [["H2O", 3], ["CO2", 2], ["CO", 2], ["CH4", 1]], state: "modell" };
const ZUCKER: Pic = { mix: [["H2O", 17], ["C12H22O11", 3]], state: "fluessig", solute: "C12H22O11", arrange: "nachher" };

const STEPS: GuideStep[] = [
  {
    say: tr("Im Teilchenmodell ist jedes Molekül und jedes einzelne Atom **ein Teilchen**.", "In the particle model every molecule and every single atom is **one particle**."),
    ask: tr("Wie viele **Teilchen** sind im Bild?", "How many **particles** are in the picture?"), answer: 7, num: {},
    visual: () => <Picture p={MIX} />,
    why: { "15": tr("15 sind alle Atome. Ein Molekül zählt als **ein** Teilchen.", "15 is the number of all atoms. A molecule counts as **one** particle."), "2": tr("2 sind die Stoffe. Zähle jedes Teilchen.", "2 is the number of substances. Count every particle.") },
    tip: tr("Zähle jedes Molekül und jedes einzelne Atom als ein Teilchen.", "Count every molecule and every single atom as one particle."),
    labels: [{"at": "[data-f=\"H2O\"]", "text": tr("Molekül = 1 Teilchen", "Molecule = 1 particle"), "side": "left"}, {"at": "[data-f=\"He\"]", "text": tr("Atom = 1 Teilchen", "Atom = 1 particle"), "side": "right"}],
    ok: tr("4 Wassermoleküle + 3 Heliumatome = 7 Teilchen.", "4 water molecules + 3 helium atoms = 7 particles."),
  },
  {
    say: tr("Gleiche Teilchen gehören zum **selben Stoff**.", "Identical particles belong to the **same substance**."),
    ask: tr("Wie viele **verschiedene Stoffe** sind im Bild?", "How many **different substances** are in the picture?"), answer: 2, num: {},
    visual: () => <Picture p={MIX} />,
    why: { "7": tr("7 sind alle Teilchen. Gleiche Teilchen = ein Stoff.", "7 is the number of all particles. Identical particles = one substance."), "3": tr("3 sind die Atomsorten (H, O, He). Gezählt werden Teilchensorten.", "3 is the number of kinds of atoms (H, O, He). Count kinds of particles.") },
    tip: tr("Gleich aussehende Teilchen gehören zum selben Stoff.", "Particles that look the same belong to the same substance."),
    ok: tr("Wasser und Helium: 2 Stoffe.", "Water and helium: 2 substances."),
  },
  {
    say: tr("**Reinstoff**: nur eine Teilchensorte. **Gemisch**: mehrere Teilchensorten.", "**Pure substance**: only one kind of particle. **Mixture**: several kinds of particles."),
    ask: tr("Reinstoff oder Gemisch?", "Pure substance or mixture?"), answer: tr("Gemisch", "Mixture"), options: [tr("Gemisch", "Mixture"), tr("Reinstoff", "Pure substance")],
    visual: () => <Picture p={MIX} />,
    why: { [tr("Reinstoff", "Pure substance")]: tr("Es gibt zwei verschiedene Teilchen – also zwei Stoffe.", "There are two different particles – so two substances.") },
    ok: tr("Zwei Stoffe → Gemisch.", "Two substances → mixture."),
  },
  {
    say: tr("**Element**: Teilchen aus nur **einer** Atomsorte. **Verbindung**: mehrere Atomsorten fest in einem Teilchen.", "**Element**: particles of only **one** kind of atom. **Compound**: several kinds of atoms firmly in one particle."),
    ask: tr("Tippe auf ein Teilchen, das zu einem **Element** gehört.", "Tap a particle that belongs to an **element**."), answer: "Ne",
    visual: c => <Picture p={{ mix: [["CO2", 3], ["Ne", 4]], state: "modell" }} c={c} target="Ne" />,
    why: { "CO2": tr("CO₂ hat zwei Atomsorten (C und O) – eine Verbindung.", "CO₂ has two kinds of atoms (C and O) – a compound.") },
    show: tr("So geht's: tippe auf ein einzelnes Neon-Atom (Ne).", "Here's how: tap a single neon atom (Ne)."),
    tip: tr("Ein Element-Teilchen hat Kugeln in nur einer Farbe.", "An element particle has spheres of only one colour."),
    labels: [{"at": "[data-f=\"Ne\"]", "text": tr("Element", "Element"), "side": "right", "afterSolved": true}, {"at": "[data-f=\"CO2\"]", "text": tr("Verbindung", "Compound"), "side": "left", "afterSolved": true}],
    ok: tr("Neon: nur eine Atomsorte → Element. CO₂ → Verbindung.", "Neon: only one kind of atom → element. CO₂ → compound."),
  },
  {
    say: tr("**Atomsorten** erkennt man an den Farben der Kugeln.", "You can recognise **kinds of atoms** by the colours of the spheres."),
    ask: tr("Wie viele **Atomsorten** kommen im Bild vor?", "How many **kinds of atoms** appear in the picture?"), answer: 3, num: {},
    visual: () => <Picture p={SORTEN} />,
    why: { "4": tr("4 sind die Stoffe. Gezählt werden die Farben.", "4 is the number of substances. Count the colours."), "8": tr("8 sind die Teilchen.", "8 is the number of particles.") },
    tip: tr("Zähle die verschiedenen Kugelfarben.", "Count the different sphere colours."),
    ok: tr("H, O und C: 3 Atomsorten.", "H, O and C: 3 kinds of atoms."),
  },
  {
    ask: tr("Wie viele der Stoffe im Bild sind **Verbindungen**?", "How many of the substances in the picture are **compounds**?"), answer: 2, num: {},
    visual: () => <Picture p={{ mix: [["He", 3], ["H2O", 3], ["CO2", 2]], state: "modell" }} />,
    why: { "3": tr("Helium hat nur eine Atomsorte – ein Element.", "Helium has only one kind of atom – an element."), "5": tr("Gefragt sind Stoffe, nicht Teilchen.", "The question asks for substances, not particles.") },
    tip: tr("Eine Verbindung hat Kugeln in mehreren Farben. Zähle Stoffe, nicht Teilchen.", "A compound has spheres of several colours. Count substances, not particles."),
    ok: tr("Wasser und CO₂ sind Verbindungen, Helium ist ein Element.", "Water and CO₂ are compounds, helium is an element."),
  },
  {
    ask: tr("**Kupfer** (Cu): Element, Verbindung oder Gemisch?", "**Copper** (Cu): element, compound or mixture?"), answer: tr("Element", "Element"), options: [tr("Element", "Element"), tr("Verbindung", "Compound"), tr("Gemisch", "Mixture")],
    visual: () => <Picture p={{ mix: [["Cu", 8]], state: "fest" }} />,
    why: { [tr("Verbindung", "Compound")]: tr("Die Atome sind im Gitter verbunden – aber alle gleich. Eine Atomsorte: Element.", "The atoms are bonded in a lattice – but all the same. One kind of atom: element."), [tr("Gemisch", "Mixture")]: tr("Alle Teilchen sind gleich – ein Reinstoff.", "All particles are the same – a pure substance.") },
    ok: tr("Kupfer: nur Cu-Atome → Element.", "Copper: only Cu atoms → element."),
  },
  {
    say: tr("**Homogen**: überall gleich, keine Grenze zu sehen. **Heterogen**: Teile, Tröpfchen oder Schichten sind zu erkennen.", "**Homogeneous**: the same everywhere, no boundary visible. **Heterogeneous**: pieces, droplets or layers can be seen."),
    ask: tr("Was ist **Zuckerwasser**?", "What is **sugar water**?"), answer: tr("homogenes Gemisch", "homogeneous mixture"), options: [tr("homogenes Gemisch", "homogeneous mixture"), tr("heterogenes Gemisch", "heterogeneous mixture"), tr("Reinstoff", "Pure substance")],
    visual: () => <Picture p={ZUCKER} />,
    why: { [tr("heterogenes Gemisch", "heterogeneous mixture")]: tr("Der Zucker ist gelöst – man sieht keine Teile.", "The sugar is dissolved – you cannot see any pieces."), [tr("Reinstoff", "Pure substance")]: tr("Klar heißt nicht rein: Zucker und Wasser sind zwei Stoffe.", "Clear does not mean pure: sugar and water are two substances.") },
    labels: [{"at": "[data-f=\"C12H22O11\"]", "text": tr("Zucker-Molekül", "Sugar molecule"), "side": "left"}, {"at": "[data-f=\"H2O\"]", "text": tr("Wasser-Molekül", "Water molecule"), "side": "right"}],
    ok: tr("Gelöster Zucker ist überall gleich verteilt.", "Dissolved sugar is spread evenly everywhere."),
  },
  {
    ask: tr("Was ist **Milch**?", "What is **milk**?"), answer: tr("heterogenes Gemisch", "heterogeneous mixture"), options: [tr("homogenes Gemisch", "homogeneous mixture"), tr("heterogenes Gemisch", "heterogeneous mixture"), tr("Reinstoff", "Pure substance")],
    why: { [tr("homogenes Gemisch", "homogeneous mixture")]: tr("Milch sieht einheitlich aus – unter dem Mikroskop sieht man Fetttröpfchen.", "Milk looks uniform – under the microscope you can see fat droplets."), [tr("Reinstoff", "Pure substance")]: tr("Milch enthält Wasser, Fett, Eiweiß und mehr.", "Milk contains water, fat, protein and more.") },
    ok: tr("Fetttröpfchen in Wasser → heterogen (Emulsion).", "Fat droplets in water → heterogeneous (emulsion)."),
  },
  {
    say: tr("Arten: fest **gelöst** in flüssig = Lösung, feste **Körner** in flüssig = Suspension, **Tröpfchen** in flüssig = Emulsion, **Blasen** = Schaum, Metalle = Legierung, feste Teile = Gemenge.", "Types: **dissolved** = solution, **grains** in liquid = suspension, **droplets** = emulsion, **bubbles** = foam, metals = alloy, solid pieces = coarse mixture."),
    ask: tr("Welche Art von Gemisch ist **Sand in Wasser**?", "What type of mixture is **sand in water**?"), answer: tr("Suspension", "Suspension"), options: [tr("Suspension", "Suspension"), tr("Lösung", "Solution"), tr("Emulsion", "Emulsion"), tr("Gemenge", "Coarse mixture")],
    why: { [tr("Lösung", "Solution")]: tr("Sand löst sich nicht – man sieht die Körner.", "Sand does not dissolve – you can see the grains."), [tr("Emulsion", "Emulsion")]: tr("Sand ist fest – Körner, keine Tröpfchen.", "Sand is solid – grains, not droplets."), [tr("Gemenge", "Coarse mixture")]: tr("Im Gemenge sind nur Feststoffe – hier ist Wasser dabei.", "A coarse mixture has only solids – here there is water.") },
    ok: tr("Feste Körner in einer Flüssigkeit → Suspension.", "Solid grains in a liquid → suspension."),
  },
  {
    ask: tr("Welche Art von Gemisch ist **Müsli**?", "What type of mixture is **muesli**?"), answer: tr("Gemenge", "Coarse mixture"), options: [tr("Gemenge", "Coarse mixture"), tr("Suspension", "Suspension"), tr("Legierung", "Alloy")],
    visual: () => <div className="gm-g"><MuesliBowl mixed={1} shaking={false} /></div>,
    why: { [tr("Suspension", "Suspension")]: tr("Im Müsli ist keine Flüssigkeit – nur feste Teile.", "There is no liquid in muesli – only solid pieces."), [tr("Legierung", "Alloy")]: tr("Legierungen sind Metalle, bis zu den Atomen gemischt.", "Alloys are metals mixed down to the atoms.") },
    ok: tr("Feste Teile nebeneinander → Gemenge. Das gilt auch für große Stücke.", "Solid pieces side by side → coarse mixture. This also applies to large pieces."),
  },
  {
    say: tr("„Rein“ heißt auf der Packung: nichts dazugegeben. In der Chemie heißt **Reinstoff**: nur **ein** Stoff.", "On a package “pure” means: nothing added. In chemistry a **pure substance** means: only **one** substance."),
    ask: tr("„100 % reiner Orangensaft“ – was ist das chemisch?", "“100 % pure orange juice” – what is it chemically?"), answer: tr("Gemisch", "Mixture"), options: [tr("Gemisch", "Mixture"), tr("Reinstoff", "Pure substance")],
    why: { [tr("Reinstoff", "Pure substance")]: tr("Saft enthält Wasser, Zucker, Säuren und Farbstoffe – viele Stoffe.", "Juice contains water, sugar, acids and dyes – many substances.") },
    ok: tr("Ein Gemisch – auch wenn nichts dazugegeben wurde.", "A mixture – even if nothing was added."),
  },
  {
    say: tr("Beim Lösen verteilen sich die Teilchen zwischen den Wasserteilchen. Sie **verschwinden nicht** und bleiben gleich groß.", "When dissolving, the particles spread out between the water particles. They **do not disappear** and stay the same size."),
    ask: tr("In **200 g** Wasser lösen sich **20 g** Zucker. Wie schwer ist das Zuckerwasser?", "**20 g** of sugar dissolve in **200 g** of water. How heavy is the sugar water?"), answer: 220, num: { unit: "g" },
    visual: () => <Picture p={ZUCKER} />,
    why: { "200": tr("Der Zucker ist noch da – seine 20 g zählen mit.", "The sugar is still there – its 20 g count too."), "210": tr("Die Masse bleibt ganz erhalten: 200 g + 20 g.", "The mass is fully conserved: 200 g + 20 g.") },
    tip: tr("Zähle die Masse von Wasser und Zucker zusammen.", "Add the masses of water and sugar together."),
    labels: [{"at": "[data-f=\"C12H22O11\"]", "text": tr("Zucker-Molekül", "Sugar molecule"), "side": "left"}, {"at": "[data-f=\"H2O\"]", "text": tr("Wasser-Molekül", "Water molecule"), "side": "right"}],
    ok: tr("200 g + 20 g = 220 g – alle Teilchen sind noch da.", "200 g + 20 g = 220 g – all particles are still there."),
  },
  {
    say: tr("Teilchen bewegen sich **ständig** – darum mischen sich Gase und Lösungen von selbst.", "Particles move **all the time** – that is why gases and solutions mix by themselves."),
    ask: tr("Was ist **zwischen** den Teilchen?", "What is **between** the particles?"), answer: tr("Nichts – leerer Raum", "Nothing – empty space"), options: [tr("Nichts – leerer Raum", "Nothing – empty space"), tr("Luft", "Air"), tr("Wasser", "Water")],
    visual: () => <Picture p={MIX} />,
    why: { [tr("Luft", "Air")]: tr("Luft besteht selbst aus Teilchen.", "Air itself consists of particles."), [tr("Wasser", "Water")]: tr("Wasser besteht aus diesen Teilchen – dazwischen ist nichts.", "Water consists of these particles – there is nothing in between.") },
    labels: [{"at": "[data-f=\"H2O\"]", "text": tr("Teilchen", "Particle"), "side": "left"}],
    ok: tr("Zwischen den Teilchen ist leerer Raum.", "Between the particles there is empty space."),
  },
  {
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
