// Geführte Erklärung Benennung: Stamm, längste Kette, Nummerierung, di/tri, Mehrfachbindung, Endungen, Rangfolge –
// mit Lewis-Formeln der App (Atome antippbar).

import { Fit, type GuideCtx, type GuideDef, type GuideStep } from "@lern/ui";
import { exampleMol } from "./chem/examples.ts";
import { smilesMol } from "./chem/smiles.ts";
import { MolSvg, U } from "./components/MolSvg.tsx";
import type { Mol } from "./chem/mol.ts";

/** 3-Methylhexan so gezeichnet, dass die längste Kette um die Ecke geht: 5 C in einer Reihe, Ethyl-Ast nach oben */
const BENT: Mol = (() => {
  const h = Math.sqrt(3) / 2;
  const pts: [number, number][] = [[0, 0], [h, -0.5], [2 * h, 0], [3 * h, -0.5], [4 * h, 0], [h, -1.5], [2 * h, -2]];
  const bonds: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6]];
  return { atoms: pts.map(([x, y], id) => ({ id, el: "C" as const, x, y })), bonds: bonds.map(([a, b]) => ({ a, b, order: 1 as const })) };
})();

/** Lewis-Formel; mit `target` sind die Atome antippbar (Ziel = Atomnummer in der Kurzschreibweise) */
function Pic({ s, c, target }: { s: string; c?: GuideCtx; target?: number }) {
  // mit / oder \ in der Kurzschreibweise: E/Z wie angegeben gezeichnet
  const m = s === "bent" ? BENT : /[/\\]/.test(s) ? smilesMol(s) : exampleMol(s);
  return (
    <Fit className="og-g" min={0.3}>
      <MolSvg mol={m} view="lewis" label="Strukturformel" minW={4} minH={2.6} className="og-g-svg">
        {target !== undefined && c && m.atoms.map(a => (
          <circle key={a.id} className={`og-g-hit${c.show && a.id === target ? " g-sol" : ""}`} cx={a.x * U} cy={a.y * U} r={0.38 * U}
            role="button" tabIndex={0} aria-label={`Atom ${a.el}`} onClick={() => c.pick(String(a.id))}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); c.pick(String(a.id)); } }} />
        ))}
      </MolSvg>
    </Fit>
  );
}

const STEPS: GuideStep[] = [
  {
    say: "Der Name beginnt mit dem **Stamm**. Er sagt, wie viele C-Atome die Kette hat.",
    ask: "Wie viele **C-Atome** hat die Kette?", answer: 4, num: {},
    visual: () => <Pic s="CCCC" />,
    why: { "10": "10 sind die H-Atome. Gezählt werden nur die C.", "14": "14 sind alle Atome. Gezählt werden nur die C." },
    tip: "Zähle nur die C-Atome, nicht die H.",
    labels: [{ at: ".mol-h", text: "H-Atom", side: "right" }],
    ok: "4 C-Atome in einer Kette.",
  },
  {
    say: "Stämme: Meth 1, Eth 2, Prop 3, But 4, Pent 5, Hex 6. Nur Einfachbindungen → Endung **-an**.",
    ask: "Wie heißt dieses Alkan?", answer: "Butan", options: ["Butan", "Propan", "Pentan", "Tetran"],
    visual: () => <Pic s="CCCC" />,
    why: { Propan: "Propan hat 3 C. Hier sind es 4.", Pentan: "Pentan hat 5 C. Hier sind es 4.", Tetran: "Bis 4 C gibt es eigene Stämme: Meth, Eth, Prop, But." },
    ok: "4 C → **But** + **an** = Butan.",
  },
  {
    say: "Die **Hauptkette** ist die längste Kette. Sie darf um die Ecke gehen.",
    ask: "Wie viele C hat die **längste** Kette?", answer: 6, num: {},
    visual: () => <Pic s="bent" />,
    why: { "5": "So viele C liegen in einer Reihe. Über den Ast geht es länger.", "7": "7 sind alle C. Ein C bleibt als Ast übrig." },
    tip: "Starte an jedem Kettenende und zähle bis zum anderen Ende.",
    ok: "Die längste Kette hat 6 C → **Hexan**.",
  },
  {
    say: "Was nicht zur Hauptkette gehört, ist ein **Ast**. Ein C als Ast heißt **Methyl**.",
    ask: "Tippe auf das C der Hauptkette, an dem der **Methyl-Ast** hängt.", answer: "1",
    visual: c => <Pic s="bent" c={c} target={1} />,
    why: { "0": "Das ist der Ast selbst. Gesucht ist das C, an dem er hängt." },
    tip: "Suche das C mit drei C-Nachbarn.",
    show: "Markiert: das C mit drei C-Nachbarn.",
    ok: "Genau: Dort hängt der Methyl-Ast.",
  },
  {
    say: "Nummeriert wird vom Ende, das dem Ast **näher** ist. Die Nummer soll klein sein.",
    ask: "Welche **Nummer** bekommt das C mit dem Ast?", answer: 3, num: {},
    visual: () => <Pic s="bent" />,
    why: { "4": "Das ist von der anderen Seite gezählt. Von hier aus wird die Nummer kleiner." },
    tip: "Zähle vom näheren Ende der Hauptkette bis zum Ast.",
    ok: "Der Ast sitzt an C3.",
  },
  {
    say: "Zusammensetzen: **Nummer – Ast – Stamm**.",
    ask: "Wie heißt das Molekül?", answer: "3-Methylhexan", options: ["3-Methylhexan", "4-Methylhexan", "2-Ethylpentan", "3-Methylheptan"],
    visual: () => <Pic s="bent" />,
    why: {
      "4-Methylhexan": "Von der falschen Seite gezählt. Die Nummer soll klein sein.",
      "2-Ethylpentan": "Die Kette mit 5 C ist nicht die längste. Es gibt eine mit 6 C.",
      "3-Methylheptan": "Heptan hätte 7 C. Die Hauptkette hat 6 C.",
    },
    ok: "**3-Methylhexan**.",
  },
  {
    say: "Gleiche Äste fasst man zusammen: **di** = 2, **tri** = 3. Jeder Ast bekommt seine Nummer.",
    ask: "Wie heißt das Molekül?", answer: "2,3-Dimethylbutan", options: ["2,3-Dimethylbutan", "2-Methyl-3-methylbutan", "2,3-Methylbutan", "2,3-Dimethylpentan"],
    visual: () => <Pic s="CC(C)C(C)C" />,
    why: {
      "2-Methyl-3-methylbutan": "Gleiche Äste fasst man zusammen: Dimethyl.",
      "2,3-Methylbutan": "Bei zwei gleichen Ästen fehlt das di: Dimethyl.",
      "2,3-Dimethylpentan": "Pentan hätte 5 C. Die Hauptkette hat 4 C.",
    },
    ok: "Zwei Methyl-Äste an C2 und C3 → **2,3-Dimethylbutan**.",
  },
  {
    say: "Doppelbindung → **-en**, Dreifachbindung → **-in**. Sie bekommt die kleinste Nummer.",
    ask: "Wie heißt das Molekül?", answer: "Pent-2-en", options: ["Pent-2-en", "Pent-3-en", "Pent-2-in", "Pentan"],
    visual: () => <Pic s="CC=CCC" />,
    why: {
      "Pent-3-en": "Von der falschen Seite gezählt. Die Doppelbindung soll eine kleine Nummer haben.",
      "Pent-2-in": "-in steht für eine Dreifachbindung. Hier ist eine Doppelbindung.",
      Pentan: "-an heißt: nur Einfachbindungen. Hier ist eine Doppelbindung.",
    },
    ok: "Doppelbindung ab C2 → **Pent-2-en**.",
  },
  {
    say: "An C=C gibt es zwei Formen. Die vorrangigen Gruppen liegen auf **derselben** Seite (**Z**) oder **gegenüber** (**E**).",
    ask: "Ist diese Doppelbindung **E** oder **Z**?", answer: "Z", options: ["Z", "E"],
    visual: () => <Pic s={"C/C=C\\C"} />,
    why: { E: "Beide CH₃ liegen auf derselben Seite der Doppelbindung. Das ist Z (zusammen)." },
    ok: "Beide CH₃ auf einer Seite → **(Z)-But-2-en** (cis).",
  },
  {
    say: "**Funktionelle Gruppen** geben die Endung. Die Hydroxygruppe –OH macht einen **Alkohol**: Endung -ol.",
    ask: "Tippe auf das **O-Atom** der OH-Gruppe.", answer: "2",
    visual: c => <Pic s="CC(O)C" c={c} target={2} />,
    tip: "Suche das Atom, das nicht C oder H ist.",
    show: "Markiert: das O-Atom.",
    labels: [{ at: "[data-a=\"2\"]", text: "Hydroxygruppe", side: "right", afterSolved: true }],
    ok: "Die OH-Gruppe sitzt am mittleren C.",
  },
  {
    say: "Die Nummer der Gruppe steht vor der Endung: Propan-**2**-ol.",
    ask: "Wie heißt dieser Alkohol?", answer: "Propan-2-ol", options: ["Propan-2-ol", "Propan-1-ol", "Propan-2-al", "Propan-2-on"],
    visual: () => <Pic s="CC(O)C" />,
    why: {
      "Propan-1-ol": "Die OH-Gruppe sitzt am mittleren C, also C2.",
      "Propan-2-al": "-al steht für Aldehyd –CHO. Hier ist eine OH-Gruppe.",
      "Propan-2-on": "-on steht für Keton C=O. Hier ist eine OH-Gruppe.",
    },
    ok: "**Propan-2-ol**.",
  },
  {
    say: "Bei der Säuregruppe –COOH gehört das C **zur Kette**. Es ist immer C1.",
    ask: "Wie viele C hat die Kette?", answer: 4, num: {},
    visual: () => <Pic s="CCCC(=O)O" />,
    why: { "3": "Das C der COOH-Gruppe zählt mit." },
    tip: "Zähle auch das C, an dem die beiden O hängen.",
    ok: "4 C mit der Säuregruppe.",
  },
  {
    say: "Carbonsäuren enden auf **-säure**. Die Nummer 1 schreibt man nicht.",
    ask: "Wie heißt die Säure?", answer: "Butansäure", options: ["Butansäure", "Propansäure", "Butan-1-säure", "Butanol"],
    visual: () => <Pic s="CCCC(=O)O" />,
    why: {
      Propansäure: "Das C der COOH-Gruppe gehört zur Kette. Es sind 4 C.",
      "Butan-1-säure": "Die Säuregruppe ist immer C1. Die 1 lässt man weg.",
      Butanol: "-ol steht für einen Alkohol. Hier ist eine COOH-Gruppe.",
    },
    ok: "**Butansäure** (Buttersäure).",
  },
  {
    say: "Mehrere Gruppen: Die mit dem **höchsten Rang** gibt die Endung. Säure > Aldehyd > Keton > Alkohol > Amin.",
    ask: "Welche Gruppe gibt hier die Endung?", answer: "Keton C=O", options: ["Keton C=O", "Alkohol –OH"],
    visual: () => <Pic s="CC(=O)CC(O)C" />,
    why: { "Alkohol –OH": "Keton steht in der Rangfolge vor Alkohol. Die OH-Gruppe wird Vorsilbe." },
    ok: "Keton → Endung **-on**. OH wird **Hydroxy-**.",
  },
  {
    say: "Die Hauptgruppe bekommt die kleinste Nummer. Die anderen Gruppen stehen als Vorsilbe vorn.",
    ask: "Wie heißt die Verbindung?", answer: "4-Hydroxypentan-2-on", options: ["4-Hydroxypentan-2-on", "4-Oxopentan-2-ol", "2-Hydroxypentan-4-on", "Pentan-2-on-4-ol"],
    visual: () => <Pic s="CC(=O)CC(O)C" />,
    why: {
      "4-Oxopentan-2-ol": "Keton geht vor Alkohol. Darum Endung -on, nicht -ol.",
      "2-Hydroxypentan-4-on": "Die Hauptgruppe C=O soll die kleinste Nummer haben.",
      "Pentan-2-on-4-ol": "Nur eine Endung. Die zweite Gruppe wird Vorsilbe: Hydroxy.",
    },
    ok: "**4-Hydroxypentan-2-on**.",
  },
];

export const GUIDE: GuideDef = {
  title: "Nomenklatur",
  steps: STEPS,
  outro: [
    "Stamm nach der Zahl der C in der **längsten Kette**.",
    "Nummerieren: kleinste Nummern für Hauptgruppe, Mehrfachbindung, Äste.",
    "Gleiche Äste mit **di, tri**, Vorsilben **alphabetisch**.",
    "Endung von der Gruppe mit dem **höchsten Rang**: -säure, -al, -on, -ol, -amin.",
  ],
};
