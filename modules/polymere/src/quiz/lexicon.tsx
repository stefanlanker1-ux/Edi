// Stoffe in den Aufgaben: Name im Text antippen → kurze Karte „Was ist das?“ (Strukturformel, ein Satz, weiterer Name).
// Die Karten beschreiben nur, was ein Stoff ist – nie, wie er reagiert, was daraus wird oder wofür er gut ist,
// wenn genau das gefragt ist (`HIDE`): sie sind ein Nachschlagewerk wie das PSE, keine Lösung.

import { tr } from "@lern/i18n";
import { termsIn, type TermDef } from "@lern/ui";
import { FG_FORMULA, FG_NAME, METHODS, STEPS, VINYLS, type FG, type Hue, type MethodId, type StepId, type VinylId } from "../chem/data.ts";
import { BeadDot } from "../components/Beads.tsx";
import { MonomerSvg } from "../components/Formula.tsx";
import { isBuild, isOrder, isTap, type Task } from "./tasks.ts";

/** Was ist das? – ein Satz je Monomer der Polymerisation */
export const VINYL_WHAT = (): Record<VinylId, string> => tr(
  { ethen: "Einfachstes Monomer: zwei C‑Atome mit Zweifachbindung, sonst nur H‑Atome.",
    propen: "Wie Ethen, aber ein H‑Atom ist durch eine CH₃-Gruppe ersetzt.",
    styrol: "Wie Ethen, aber ein H‑Atom ist durch einen Benzolring ersetzt.",
    vinylchlorid: "Wie Ethen, aber ein H‑Atom ist durch ein Cl‑Atom ersetzt.",
    mma: "Wie Ethen, an einem C‑Atom sitzen eine CH₃- und eine COOCH₃-Gruppe.",
    acrylnitril: "Wie Ethen, aber ein H‑Atom ist durch eine C≡N-Gruppe ersetzt.",
    tfe: "Wie Ethen, aber alle vier H‑Atome sind durch F‑Atome ersetzt.",
    isobuten: "Wie Ethen, an einem C‑Atom sitzen zwei CH₃-Gruppen.",
    butadien: "Kette aus vier C‑Atomen mit zwei Zweifachbindungen.",
    vinylacetat: "Wie Ethen, aber ein H‑Atom ist durch eine Acetatgruppe ersetzt." },
  { ethen: "Simplest monomer: two C atoms with a double bond, otherwise only H atoms.",
    propen: "Like ethene, but one H atom is replaced by a CH₃ group.",
    styrol: "Like ethene, but one H atom is replaced by a benzene ring.",
    vinylchlorid: "Like ethene, but one H atom is replaced by a Cl atom.",
    mma: "Like ethene, with a CH₃ and a COOCH₃ group on one C atom.",
    acrylnitril: "Like ethene, but one H atom is replaced by a C≡N group.",
    tfe: "Like ethene, but all four H atoms are replaced by F atoms.",
    isobuten: "Like ethene, with two CH₃ groups on one C atom.",
    butadien: "Chain of four C atoms with two double bonds.",
    vinylacetat: "Like ethene, but one H atom is replaced by an acetate group." },
);

/** Was ist das? – Monomere mit funktionellen Gruppen */
export const STEP_WHAT = (): Record<StepId, string> => tr(
  { terephthalsaeure: "Benzolring mit zwei Carboxygruppen an gegenüberliegenden Ecken.",
    adipinsaeure: "Kette aus vier CH₂-Gruppen mit einer Carboxygruppe an jedem Ende.",
    adipoylchlorid: "Wie Adipinsäure, aber an jedem Ende –COCl statt –COOH.",
    terephthaloylchlorid: "Wie Terephthalsäure, aber zweimal –COCl statt –COOH.",
    essigsaeure: "Die Säure im Essig: eine CH₃-Gruppe mit einer Carboxygruppe.",
    ethandiol: "Alkohol aus zwei C‑Atomen, an jedem eine –OH-Gruppe.",
    butandiol: "Kette aus vier CH₂-Gruppen mit einer –OH-Gruppe an jedem Ende.",
    glycerin: "Alkohol aus drei C‑Atomen, an jedem eine –OH-Gruppe.",
    ethanol: "Der Alkohol in Wein und Bier: CH₃–CH₂ mit einer –OH-Gruppe.",
    hexandiamin: "Kette aus sechs CH₂-Gruppen mit einer Aminogruppe an jedem Ende.",
    phenylendiamin: "Benzolring mit zwei Aminogruppen an gegenüberliegenden Ecken.",
    milchsaeure: "Säure aus saurer Milch mit einer –OH- und einer –COOH-Gruppe.",
    aminohexansaeure: "Kette aus fünf CH₂-Gruppen: an einem Ende –NH₂, am anderen –COOH.",
    phenol: "Benzolring mit einer –OH-Gruppe.",
    methanal: "Kleinster Aldehyd: ein C‑Atom mit Zweifachbindung zum O‑Atom.",
    hdi: "Kette aus sechs CH₂-Gruppen mit einer Isocyanatgruppe an jedem Ende.",
    mdi: "Zwei Benzolringe, über CH₂ verbunden, jeder mit einer Isocyanatgruppe.",
    badge: "Großes Molekül mit einem Epoxidring an jedem Ende." },
  { terephthalsaeure: "Benzene ring with two carboxy groups on opposite corners.",
    adipinsaeure: "Chain of four CH₂ groups with a carboxy group at each end.",
    adipoylchlorid: "Like adipic acid, but –COCl instead of –COOH at each end.",
    terephthaloylchlorid: "Like terephthalic acid, but –COCl instead of –COOH twice.",
    essigsaeure: "The acid in vinegar: a CH₃ group with a carboxy group.",
    ethandiol: "Alcohol with two C atoms, each carrying an –OH group.",
    butandiol: "Chain of four CH₂ groups with an –OH group at each end.",
    glycerin: "Alcohol with three C atoms, each carrying an –OH group.",
    ethanol: "The alcohol in wine and beer: CH₃–CH₂ with an –OH group.",
    hexandiamin: "Chain of six CH₂ groups with an amino group at each end.",
    phenylendiamin: "Benzene ring with two amino groups on opposite corners.",
    milchsaeure: "Acid from sour milk with an –OH and a –COOH group.",
    aminohexansaeure: "Chain of five CH₂ groups: –NH₂ at one end, –COOH at the other.",
    phenol: "Benzene ring with an –OH group.",
    methanal: "Smallest aldehyde: one C atom with a double bond to O.",
    hdi: "Chain of six CH₂ groups with an isocyanate group at each end.",
    mdi: "Two benzene rings joined by CH₂, each with an isocyanate group.",
    badge: "Large molecule with an epoxide ring at each end." },
);

/** Was ist das? – Starter und Katalysatoren (Aufbau und Verfahren, nicht ob verbraucht) */
export const METHOD_WHAT = (): Record<MethodId, string> => tr(
  { dbpo: "Starter der radikalischen Polymerisation: zwei Benzoylgruppen, verbunden über O–O.",
    aibn: "Starter der radikalischen Polymerisation: zwei gleiche Hälften, verbunden über N=N.",
    zn: "Titanchlorid mit einer Aluminiumverbindung. Die Ketten wachsen am Titan.",
    buli: "Starter der anionischen Polymerisation: Lithium mit einer Butylgruppe.",
    bf3: "Starter der kationischen Polymerisation: Bortrifluorid mit einer Spur Wasser." },
  { dbpo: "Initiator for radical polymerisation: two benzoyl groups joined by O–O.",
    aibn: "Initiator for radical polymerisation: two identical halves joined by N=N.",
    zn: "Titanium chloride with an aluminium compound. The chains grow at the titanium.",
    buli: "Initiator for anionic polymerisation: lithium with a butyl group.",
    bf3: "Initiator for cationic polymerisation: boron trifluoride with a trace of water." },
);

/** funktionelle Gruppen und Ringe, die in Aufgaben vorkommen */
const GROUPS: FG[] = ["COOH", "OH", "NH2", "COCl", "NCO", "EPOX"];
export const GROUP_WHAT = (): Partial<Record<FG, string>> => tr(
  { COOH: "Säuregruppe organischer Säuren.", OH: "Kennzeichen der Alkohole.", NH2: "Kennzeichen der Amine – wie Ammoniak, ein H‑Atom fehlt.",
    COCl: "Säuregruppe mit Cl statt –OH.", NCO: "N, C und O mit zwei Zweifachbindungen: sehr reaktionsfreudig.", EPOX: "Dreierring aus zwei C‑Atomen und einem O‑Atom." },
  { COOH: "Acid group of organic acids.", OH: "Mark of the alcohols.", NH2: "Mark of the amines – like ammonia with one H atom missing.",
    COCl: "Acid group with Cl instead of –OH.", NCO: "N, C and O with two double bonds: very reactive.", EPOX: "Three-membered ring of two C atoms and one O atom." },
);
const GROUP_ALSO = (): Partial<Record<FG, string[]>> => tr(
  { COOH: ["Säuregruppe"], NCO: ["Isocyanat"], EPOX: ["Epoxidring", "Epoxid"], COCl: ["Säurechlorid"] },
  { COOH: ["acid group"], NCO: ["isocyanate"], EPOX: ["epoxide ring", "epoxide"], COCl: ["acyl chloride"] },
);

/** was eine Karte bei einer Fertigkeit nicht zeigen darf: Monomer zum Polymer bzw. Verwendung */
const HIDE: Record<string, { mono?: boolean; uses?: boolean }> = {
  monomerVon: { mono: true }, polyName: { mono: true }, bauenHomo: { mono: true }, bauenCopo: { mono: true }, kunststoffAlltag: { uses: true }, klasseAlltag: { uses: true }, recycling: { uses: true },
};

const Struct = ({ id }: { id: string }) => <div className="pm-lex-pic"><MonomerSvg id={id} aspect={0} /></div>;
const Bead = ({ hue, letter }: { hue: Hue; letter: string }) => (
  <svg className="pm-lex-bead" viewBox="0 0 30 30" aria-hidden="true"><BeadDot cx={15} cy={15} r={13} hue={hue} letter={letter} /></svg>
);
const Also = ({ text }: { text: string }) => <p className="pm-lex-also">{tr("auch: ", "also: ")}{text}</p>;

/** alle Karten; `type` = Fertigkeit der Aufgabe (für `HIDE`) */
export function lexicon(type?: string): TermDef[] {
  const hide = HIDE[type ?? ""] ?? {};
  const VW = VINYL_WHAT(), SW = STEP_WHAT(), MW = METHOD_WHAT(), GW = GROUP_WHAT(), GA = GROUP_ALSO();
  const out: TermDef[] = [];
  for (const v of VINYLS) {
    out.push({ term: v.name, also: [v.alt], title: v.name, body: <>
      <Struct id={v.id} />
      <p className="pm-lex-what"><Bead hue={v.hue} letter={v.letter} />{VW[v.id]}</p>
      <Also text={v.alt} />
    </> });
    out.push({ term: v.polymer, also: [v.abbr], title: `${v.polymer} (${v.abbr})`, body: <>
      <p className="pm-lex-what">{tr("Kunststoff, eine Kette aus sehr vielen Bausteinen.", "A plastic: a chain of very many repeat units.")}</p>
      {!hide.mono && <p className="pm-lex-what"><Bead hue={v.hue} letter={v.letter} />{tr(`Monomer: ${v.name}`, `Monomer: ${v.name.toLowerCase()}`)} – {VW[v.id]}</p>}
      {!hide.uses && <p className="pm-lex-also">{tr("Verwendung: ", "Used for: ")}{v.uses}</p>}
    </> });
  }
  for (const s of STEPS) {
    out.push({ term: s.name, also: [s.alt], title: s.name, body: <>
      {s.id !== "badge" && <Struct id={s.id} />}
      <p className="pm-lex-what"><Bead hue={s.hue} letter={s.letter} />{SW[s.id]}</p>
      <Also text={s.alt} />
    </> });
  }
  for (const m of METHODS) {
    out.push({ term: m.name, also: [m.short], title: `${m.name} (${m.short})`, body: <>
      <p className="pm-lex-formula">{m.formula}</p>
      <p className="pm-lex-what">{MW[m.id]}</p>
    </> });
  }
  for (const g of GROUPS) {
    out.push({ term: FG_NAME[g], also: GA[g], title: FG_NAME[g], body: <>
      <p className="pm-lex-formula">{FG_FORMULA[g]}</p>
      <p className="pm-lex-what">{GW[g]}</p>
    </> });
  }
  return out;
}

/** Karten zu einer Aufgabe: nur Begriffe aus Text, der zu sehen ist – vor der Antwort Frage, Merksatz, Tipp und Antworten in Worten
 *  (Antworten als Bild zählen nicht: ihr Schlüssel nennt den Stoff), danach auch Rückmeldung und Erklärung */
export function termsFor(t: Task, answered: boolean): TermDef[] {
  const mc = !isTap(t) && !isOrder(t) && !isBuild(t) ? t : null;
  const shown = [t.lead ?? "", t.prompt, t.hint, t.tip ?? "", ...(mc && !mc.pics ? mc.options : [])];
  if (answered) shown.push(t.explain, t.rule ?? "", ...(mc ? Object.values(mc.why ?? {}) : []), ...(t.traps ?? []).map(x => x.why ?? ""));
  return termsIn(shown.join(" \n "), lexicon(t.type));
}
