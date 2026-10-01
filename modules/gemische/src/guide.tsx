// Geführte Erklärung Gemische: mit den Teilchenbildern der App (Kalotten im Gefäß). Teilchen, Stoffe, Element und
// Verbindung, Reinstoff und Gemisch, homogen/heterogen, Arten von Gemischen, „rein“ im Alltag, Lösen im Teilchenmodell.

import { Fit, type GuideCtx, type GuideDef, type GuideStep } from "@lern/ui";
import { toSubscript } from "@lern/chem";
import { Beaker } from "./components/Beaker.tsx";
import { MuesliBowl } from "./components/MuesliBowl.tsx";
import { initial, seedOf } from "./mixing.ts";
import type { Pic } from "./quiz/tasks.ts";
import { nameOf } from "./mixtures.ts";

/** Teilchenbild; mit `target` sind Teilchen antippbar (Ziel = Formel), darunter dieselben Stoffe als Knöpfe */
function Picture({ p, c, target }: { p: Pic; c?: GuideCtx; target?: string }) {
  const sim = initial({ items: p.mix, state: p.state, floats: p.floats, before: p.before, solute: p.solute }, seedOf(JSON.stringify(p)), p.arrange ?? "nachher");
  const label = `Teilchenbild: ${p.mix.map(([f, n]) => `${n} × ${nameOf(f)}`).join(", ")}`;
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
    say: "Im Teilchenmodell ist jedes Molekül und jedes einzelne Atom **ein Teilchen**.",
    ask: "Wie viele **Teilchen** sind im Bild?", answer: 7, num: {},
    visual: () => <Picture p={MIX} />,
    why: { "15": "15 sind alle Atome. Ein Molekül zählt als **ein** Teilchen.", "2": "2 sind die Stoffe. Zähle jedes Teilchen." },
    tip: "Zähle jedes Molekül und jedes einzelne Atom als ein Teilchen.",
    labels: [{"at": "[data-f=\"H2O\"]", "text": "Molekül = 1 Teilchen", "side": "left"}, {"at": "[data-f=\"He\"]", "text": "Atom = 1 Teilchen", "side": "right"}],
    ok: "4 Wassermoleküle + 3 Heliumatome = 7 Teilchen.",
  },
  {
    say: "Gleiche Teilchen gehören zum **selben Stoff**.",
    ask: "Wie viele **verschiedene Stoffe** sind im Bild?", answer: 2, num: {},
    visual: () => <Picture p={MIX} />,
    why: { "7": "7 sind alle Teilchen. Gleiche Teilchen = ein Stoff.", "3": "3 sind die Atomsorten (H, O, He). Gezählt werden Teilchensorten." },
    tip: "Gleich aussehende Teilchen gehören zum selben Stoff.",
    ok: "Wasser und Helium: 2 Stoffe.",
  },
  {
    say: "**Reinstoff**: nur eine Teilchensorte. **Gemisch**: mehrere Teilchensorten.",
    ask: "Reinstoff oder Gemisch?", answer: "Gemisch", options: ["Gemisch", "Reinstoff"],
    visual: () => <Picture p={MIX} />,
    why: { Reinstoff: "Es gibt zwei verschiedene Teilchen – also zwei Stoffe." },
    ok: "Zwei Stoffe → Gemisch.",
  },
  {
    say: "**Element**: Teilchen aus nur **einer** Atomsorte. **Verbindung**: mehrere Atomsorten fest in einem Teilchen.",
    ask: "Tippe auf ein Teilchen, das zu einem **Element** gehört.", answer: "Ne",
    visual: c => <Picture p={{ mix: [["CO2", 3], ["Ne", 4]], state: "modell" }} c={c} target="Ne" />,
    why: { CO2: "CO₂ hat zwei Atomsorten (C und O) – eine Verbindung." },
    show: "So geht's: tippe auf ein einzelnes Neon-Atom (Ne).",
    tip: "Ein Element-Teilchen hat Kugeln in nur einer Farbe.",
    labels: [{"at": "[data-f=\"Ne\"]", "text": "Element", "side": "right", "afterSolved": true}, {"at": "[data-f=\"CO2\"]", "text": "Verbindung", "side": "left", "afterSolved": true}],
    ok: "Neon: nur eine Atomsorte → Element. CO₂ → Verbindung.",
  },
  {
    say: "**Atomsorten** erkennt man an den Farben der Kugeln.",
    ask: "Wie viele **Atomsorten** kommen im Bild vor?", answer: 3, num: {},
    visual: () => <Picture p={SORTEN} />,
    why: { "4": "4 sind die Stoffe. Gezählt werden die Farben.", "8": "8 sind die Teilchen." },
    tip: "Zähle die verschiedenen Kugelfarben.",
    ok: "H, O und C: 3 Atomsorten.",
  },
  {
    ask: "Wie viele der Stoffe im Bild sind **Verbindungen**?", answer: 2, num: {},
    visual: () => <Picture p={{ mix: [["He", 3], ["H2O", 3], ["CO2", 2]], state: "modell" }} />,
    why: { "3": "Helium hat nur eine Atomsorte – ein Element.", "5": "Gefragt sind Stoffe, nicht Teilchen." },
    tip: "Eine Verbindung hat Kugeln in mehreren Farben. Zähle Stoffe, nicht Teilchen.",
    ok: "Wasser und CO₂ sind Verbindungen, Helium ist ein Element.",
  },
  {
    ask: "**Kupfer** (Cu): Element, Verbindung oder Gemisch?", answer: "Element", options: ["Element", "Verbindung", "Gemisch"],
    visual: () => <Picture p={{ mix: [["Cu", 8]], state: "fest" }} />,
    why: { Verbindung: "Die Atome sind im Gitter verbunden – aber alle gleich. Eine Atomsorte: Element.", Gemisch: "Alle Teilchen sind gleich – ein Reinstoff." },
    ok: "Kupfer: nur Cu-Atome → Element.",
  },
  {
    say: "**Homogen**: überall gleich, keine Grenze zu sehen. **Heterogen**: Teile, Tröpfchen oder Schichten sind zu erkennen.",
    ask: "Was ist **Zuckerwasser**?", answer: "homogenes Gemisch", options: ["homogenes Gemisch", "heterogenes Gemisch", "Reinstoff"],
    visual: () => <Picture p={ZUCKER} />,
    why: { "heterogenes Gemisch": "Der Zucker ist gelöst – man sieht keine Teile.", Reinstoff: "Klar heißt nicht rein: Zucker und Wasser sind zwei Stoffe." },
    labels: [{"at": "[data-f=\"C12H22O11\"]", "text": "Zucker-Molekül", "side": "left"}, {"at": "[data-f=\"H2O\"]", "text": "Wasser-Molekül", "side": "right"}],
    ok: "Gelöster Zucker ist überall gleich verteilt.",
  },
  {
    ask: "Was ist **Milch**?", answer: "heterogenes Gemisch", options: ["homogenes Gemisch", "heterogenes Gemisch", "Reinstoff"],
    why: { "homogenes Gemisch": "Milch sieht einheitlich aus – unter dem Mikroskop sieht man Fetttröpfchen.", Reinstoff: "Milch enthält Wasser, Fett, Eiweiß und mehr." },
    ok: "Fetttröpfchen in Wasser → heterogen (Emulsion).",
  },
  {
    say: "Arten: fest **gelöst** in flüssig = Lösung, feste **Körner** in flüssig = Suspension, **Tröpfchen** in flüssig = Emulsion, **Blasen** = Schaum, Metalle = Legierung, feste Teile = Gemenge.",
    ask: "Welche Art von Gemisch ist **Sand in Wasser**?", answer: "Suspension", options: ["Suspension", "Lösung", "Emulsion", "Gemenge"],
    why: { "Lösung": "Sand löst sich nicht – man sieht die Körner.", Emulsion: "Sand ist fest – Körner, keine Tröpfchen.", Gemenge: "Im Gemenge sind nur Feststoffe – hier ist Wasser dabei." },
    ok: "Feste Körner in einer Flüssigkeit → Suspension.",
  },
  {
    ask: "Welche Art von Gemisch ist **Müsli**?", answer: "Gemenge", options: ["Gemenge", "Suspension", "Legierung"],
    visual: () => <div className="gm-g"><MuesliBowl mixed={1} shaking={false} /></div>,
    why: { Suspension: "Im Müsli ist keine Flüssigkeit – nur feste Teile.", Legierung: "Legierungen sind Metalle, bis zu den Atomen gemischt." },
    ok: "Feste Teile nebeneinander → Gemenge. Das gilt auch für große Stücke.",
  },
  {
    say: "„Rein“ heißt auf der Packung: nichts dazugegeben. In der Chemie heißt **Reinstoff**: nur **ein** Stoff.",
    ask: "„100 % reiner Orangensaft“ – was ist das chemisch?", answer: "Gemisch", options: ["Gemisch", "Reinstoff"],
    why: { Reinstoff: "Saft enthält Wasser, Zucker, Säuren und Farbstoffe – viele Stoffe." },
    ok: "Ein Gemisch – auch wenn nichts dazugegeben wurde.",
  },
  {
    say: "Beim Lösen verteilen sich die Teilchen zwischen den Wasserteilchen. Sie **verschwinden nicht** und bleiben gleich groß.",
    ask: "In **200 g** Wasser lösen sich **20 g** Zucker. Wie schwer ist das Zuckerwasser?", answer: 220, num: { unit: "g" },
    visual: () => <Picture p={ZUCKER} />,
    why: { "200": "Der Zucker ist noch da – seine 20 g zählen mit.", "210": "Die Masse bleibt ganz erhalten: 200 g + 20 g." },
    tip: "Zähle die Masse von Wasser und Zucker zusammen.",
    labels: [{"at": "[data-f=\"C12H22O11\"]", "text": "Zucker-Molekül", "side": "left"}, {"at": "[data-f=\"H2O\"]", "text": "Wasser-Molekül", "side": "right"}],
    ok: "200 g + 20 g = 220 g – alle Teilchen sind noch da.",
  },
  {
    say: "Teilchen bewegen sich **ständig** – darum mischen sich Gase und Lösungen von selbst.",
    ask: "Was ist **zwischen** den Teilchen?", answer: "Nichts – leerer Raum", options: ["Nichts – leerer Raum", "Luft", "Wasser"],
    visual: () => <Picture p={MIX} />,
    why: { Luft: "Luft besteht selbst aus Teilchen.", Wasser: "Wasser besteht aus diesen Teilchen – dazwischen ist nichts." },
    labels: [{"at": "[data-f=\"H2O\"]", "text": "Teilchen", "side": "left"}],
    ok: "Zwischen den Teilchen ist leerer Raum.",
  },
  {
    say: "Die Farben im Modell sind nur zur Unterscheidung.",
    ask: "Kupfer ist rotbraun. Welche Farbe hat ein **einzelnes Kupferatom**?", answer: "Keine – Farbe hat erst der Stoff",
    options: ["Keine – Farbe hat erst der Stoff", "Rotbraun wie Kupfer", "Orange wie im Modell"],
    why: { "Rotbraun wie Kupfer": "Die Farbe entsteht erst durch sehr viele Atome.", "Orange wie im Modell": "Modellfarben unterscheiden nur die Atomsorten." },
    ok: "Farbe, fest, flüssig – das sind Eigenschaften des Stoffs, nicht eines Teilchens.",
  },
];

export const GUIDE: GuideDef = {
  title: "Gemische", steps: STEPS, outro: [
    "Teilchen zählen, gleiche Teilchen = ein Stoff, Farben = Atomsorten.",
    "Reinstoff (Element oder Verbindung) oder Gemisch (mehrere Stoffe).",
    "Homogen oder heterogen; Lösung, Suspension, Emulsion, Schaum, Legierung, Gemenge.",
    "„Rein“ auf der Packung ist kein Reinstoff.",
    "Beim Lösen bleiben Teilchen und Masse erhalten; dazwischen ist leerer Raum.",
  ],
};
