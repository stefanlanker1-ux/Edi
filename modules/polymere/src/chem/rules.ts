// Welche Kombination funktioniert – und warum: Monomer × Starter/Katalysator (Polymerisation), Gruppe × Gruppe (Stufenwachstum).
// Ergebnis ist das Produkt (Name, Kurzzeichen, Aufbau, Verwendung) oder die fachliche Begründung, warum keine (lange) Kette entsteht.

import { tr } from "@lern/i18n";
import { ART_NAME, method, stepMono, vinyl, type Art, type FG, type Klasse, type MechKind, type MethodId, type StepId, type VinylId } from "./data.ts";

// ── Polymerisation: Monomer × Verfahren ──────────────────────────────────────

/** ok = lange Ketten; short = nur kurze Ketten (Öl, Nebenreaktionen); none = keine Kette */
export type Fit = "ok" | "short" | "none";
/** Art des Misserfolgs – bestimmt die Animation: Allyl = H-Abspaltung an CH₃, poison = Gruppe besetzt die freie Stelle am Titan,
 *  bulky = zu sperrig, bounce = keine Anlagerung, side = Nebenreaktion, short = Kette bricht früh ab */
export type Fail = "allyl" | "poison" | "bulky" | "bounce" | "side" | "short";
export type Tact = "iso" | "atakt";

export interface Compat {
  fit: Fit;
  fail?: Fail;
  /** Begründung (immer gesetzt): warum es klappt bzw. nicht */
  why: string;
  /** Taktizität des Produkts */
  tact?: Tact;
  /** verzweigte Ketten (Hochdruck-Polyethen) */
  branched?: boolean;
  /** lebende Ketten: kein Abbruch von selbst (anionisch) */
  living?: boolean;
  /** Bedingung oder Besonderheit */
  note?: string;
}

const T = (de: string, en: string) => tr(de, en);

/** Begründungen je Verfahren und Monomer (Fachstand: Polar → vergiftet Ziegler-Natta; Allyl-H → radikalisch nur kurze Ketten …) */
const RULES: Record<MechKind, Record<VinylId, Compat>> = {
  radikal: {
    ethen: { fit: "ok", branched: true, why: T("Radikale lagern sich an die Zweifachbindung an. Unter hohem Druck entstehen lange, verzweigte Ketten.", "Radicals add to the double bond. Under high pressure long, branched chains form."), note: T("nur unter hohem Druck (1000–3000 bar) – LDPE, verzweigt", "only under high pressure (1000–3000 bar) – LDPE, branched") },
    propen: { fit: "short", fail: "allyl", why: T("Das Radikal reißt ein H‑Atom von der CH₃-Gruppe ab. Das neue Radikal ist zu stabil und wächst kaum weiter – nur ölige, kurze Ketten.", "The radical pulls an H atom off the CH₃ group. The new radical is too stable and hardly grows – only oily, short chains.") },
    styrol: { fit: "ok", tact: "atakt", why: T("Der Benzolring stabilisiert das Radikal am Kettenende. Die Ketten wachsen schnell.", "The benzene ring stabilises the radical at the chain end. The chains grow fast.") },
    vinylchlorid: { fit: "ok", tact: "atakt", why: T("Radikale lagern sich an die Zweifachbindung an. So wird PVC hergestellt.", "Radicals add to the double bond. This is how PVC is made.") },
    mma: { fit: "ok", tact: "atakt", why: T("Die Estergruppe stabilisiert das Radikal am Kettenende. So entsteht Acrylglas.", "The ester group stabilises the radical at the chain end. This is how acrylic glass is made.") },
    acrylnitril: { fit: "ok", tact: "atakt", why: T("Die Nitrilgruppe stabilisiert das Radikal am Kettenende.", "The nitrile group stabilises the radical at the chain end.") },
    tfe: { fit: "ok", why: T("Radikale lagern sich an die Zweifachbindung an.", "Radicals add to the double bond."), note: T("technisch in Wasser mit Peroxodisulfat", "made in water with peroxodisulfate") },
    isobuten: { fit: "short", fail: "allyl", why: T("Das Radikal reißt ein H‑Atom von einer CH₃-Gruppe ab. Das neue Radikal ist zu stabil – es entstehen nur sehr kurze Ketten.", "The radical pulls an H atom off a CH₃ group. The new radical is too stable – only very short chains form.") },
    butadien: { fit: "ok", why: T("Radikale lagern sich an. Ein Teil wird 1,4 eingebaut (C=C in der Kette), ein Teil 1,2.", "Radicals add. Some units are built in 1,4 (C=C in the chain), some 1,2."), note: T("Synthesekautschuk", "synthetic rubber") },
    vinylacetat: { fit: "ok", tact: "atakt", why: T("Radikale lagern sich an die Zweifachbindung an. So entsteht Holzleim.", "Radicals add to the double bond. This is how wood glue is made.") },
  },
  koord: {
    ethen: { fit: "ok", why: T("Ethen lagert sich an das Titan an und wird zwischen Titan und Kette eingebaut. Die Ketten bleiben unverzweigt.", "Ethene attaches to the titanium and is inserted between titanium and chain. The chains stay unbranched."), note: T("Niederdruck – HDPE, unverzweigt, dicht und fest", "low pressure – HDPE, unbranched, dense and stiff") },
    propen: { fit: "ok", tact: "iso", why: T("Jedes Propen lagert sich gleich herum an das Titan an. Alle CH₃-Gruppen zeigen zur selben Seite: isotaktisch.", "Every propene attaches to the titanium the same way round. All CH₃ groups point to the same side: isotactic.") },
    styrol: { fit: "ok", tact: "iso", why: T("Styrol wird am Titan eingebaut – immer gleich herum. Es entsteht isotaktisches Polystyrol.", "Styrene is inserted at the titanium – always the same way round. Isotactic polystyrene forms.") },
    vinylchlorid: { fit: "none", fail: "poison", why: T("Das Cl‑Atom bindet mit einem freien Elektronenpaar an das Titan. Es besetzt die freie Stelle: Der Katalysator ist vergiftet.", "The Cl atom binds to the titanium with a lone pair. It blocks the free site: the catalyst is poisoned.") },
    mma: { fit: "none", fail: "poison", why: T("Das O der C=O-Gruppe bindet mit einem freien Elektronenpaar an das Titan. Es besetzt die freie Stelle: Der Katalysator ist vergiftet.", "The O of the C=O group binds to the titanium with a lone pair. It blocks the free site: the catalyst is poisoned.") },
    acrylnitril: { fit: "none", fail: "poison", why: T("Das N‑Atom der Nitrilgruppe bindet mit seinem freien Elektronenpaar an das Titan. Der Katalysator ist vergiftet.", "The N atom of the nitrile group binds to the titanium with its lone pair. The catalyst is poisoned.") },
    tfe: { fit: "none", fail: "poison", why: T("Ein F‑Atom bindet an das Titan und besetzt die freie Stelle. Der Katalysator ist vergiftet.", "An F atom binds to the titanium and blocks the free site. The catalyst is poisoned.") },
    isobuten: { fit: "none", fail: "bulky", why: T("Zwei CH₃-Gruppen am selben C‑Atom sind zu sperrig. Isobuten wird am Titan nicht eingebaut.", "Two CH₃ groups on the same C atom are too bulky. Isobutene is not inserted at the titanium.") },
    butadien: { fit: "ok", why: T("Butadien wird am Metall 1,4 eingebaut. Mit passendem Katalysator (z. B. Neodym) fast nur cis-1,4: ein Kautschuk wie Naturkautschuk.", "Butadiene is inserted 1,4 at the metal. With a suitable catalyst (e.g. neodymium) almost only cis-1,4: a rubber like natural rubber."), note: "cis-1,4" },
    vinylacetat: { fit: "none", fail: "poison", why: T("Das O der C=O-Gruppe bindet mit einem freien Elektronenpaar an das Titan. Es besetzt die freie Stelle: Der Katalysator ist vergiftet.", "The O of the C=O group binds to the titanium with a lone pair. It blocks the free site: the catalyst is poisoned.") },
  },
  anion: {
    ethen: { fit: "none", fail: "bounce", why: T("Kaum Reaktion: Keine Gruppe stabilisiert die negative Ladung am Kettenende.", "Hardly any reaction: no group stabilises the negative charge at the chain end.") },
    propen: { fit: "none", fail: "bounce", why: T("Die CH₃-Gruppe schiebt Elektronen zur Zweifachbindung. Eine negative Ladung am Kettenende wäre zu instabil.", "The CH₃ group pushes electrons towards the double bond. A negative charge at the chain end would be too unstable.") },
    styrol: { fit: "ok", tact: "atakt", living: true, why: T("Der Benzolring stabilisiert die negative Ladung. Die Ketten brechen nicht von selbst ab: lebende Ketten.", "The benzene ring stabilises the negative charge. The chains do not stop by themselves: living chains.") },
    vinylchlorid: { fit: "none", fail: "side", why: T("Butyllithium reagiert mit dem Cl‑Atom (Cl⁻ wird abgespalten), statt sich anzulagern.", "Butyllithium reacts with the Cl atom (Cl⁻ is split off) instead of adding.") },
    mma: { fit: "ok", tact: "atakt", living: true, why: T("Die Estergruppe stabilisiert die negative Ladung. Nur bei −78 °C – sonst greift das Anion die Estergruppe an.", "The ester group stabilises the negative charge. Only at −78 °C – otherwise the anion attacks the ester group."), note: "−78 °C" },
    acrylnitril: { fit: "ok", tact: "atakt", why: T("Die Nitrilgruppe stabilisiert die negative Ladung am Kettenende.", "The nitrile group stabilises the negative charge at the chain end.") },
    tfe: { fit: "none", fail: "side", why: T("Das Anion verdrängt ein Fluorid-Ion (F⁻) – eine Nebenreaktion statt einer Kette.", "The anion pushes out a fluoride ion (F⁻) – a side reaction instead of a chain.") },
    isobuten: { fit: "none", fail: "bounce", why: T("Zwei CH₃-Gruppen schieben Elektronen zur Zweifachbindung. Eine negative Ladung am Kettenende wäre sehr instabil.", "Two CH₃ groups push electrons towards the double bond. A negative charge at the chain end would be very unstable.") },
    butadien: { fit: "ok", living: true, why: T("Die negative Ladung verteilt sich über zwei C‑Atome. Die Ketten brechen nicht von selbst ab: lebende Ketten.", "The negative charge spreads over two C atoms. The chains do not stop by themselves: living chains.") },
    vinylacetat: { fit: "none", fail: "side", why: T("Das Anion greift die Estergruppe an – eine Nebenreaktion statt einer Kette.", "The anion attacks the ester group – a side reaction instead of a chain.") },
  },
  kation: {
    ethen: { fit: "none", fail: "bounce", why: T("Eine positive Ladung am Kettenende (–CH₂⁺) wäre zu instabil.", "A positive charge at the chain end (–CH₂⁺) would be too unstable.") },
    propen: { fit: "short", fail: "short", why: T("Das Kettenende gibt schnell ein H⁺ ab. Es entstehen nur kurze Ketten.", "The chain end quickly gives off an H⁺. Only short chains form.") },
    styrol: { fit: "ok", tact: "atakt", why: T("Der Benzolring stabilisiert die positive Ladung am Kettenende.", "The benzene ring stabilises the positive charge at the chain end.") },
    vinylchlorid: { fit: "none", fail: "bounce", why: T("Das Cl‑Atom zieht Elektronen ab – eine positive Ladung am Kettenende wäre zu instabil.", "The Cl atom withdraws electrons – a positive charge at the chain end would be too unstable.") },
    mma: { fit: "none", fail: "bounce", why: T("Die Estergruppe zieht Elektronen ab – eine positive Ladung am Kettenende wäre zu instabil.", "The ester group withdraws electrons – a positive charge at the chain end would be too unstable.") },
    acrylnitril: { fit: "none", fail: "bounce", why: T("Die Nitrilgruppe zieht Elektronen ab – eine positive Ladung am Kettenende wäre zu instabil.", "The nitrile group withdraws electrons – a positive charge at the chain end would be too unstable.") },
    tfe: { fit: "none", fail: "bounce", why: T("Die F‑Atome ziehen Elektronen ab – eine positive Ladung am Kettenende wäre zu instabil.", "The F atoms withdraw electrons – a positive charge at the chain end would be too unstable.") },
    isobuten: { fit: "ok", why: T("Zwei CH₃-Gruppen stabilisieren die positive Ladung am Kettenende. Bei −100 °C entstehen lange Ketten.", "Two CH₃ groups stabilise the positive charge at the chain end. At −100 °C long chains form."), note: "−100 °C" },
    butadien: { fit: "short", fail: "short", why: T("Nebenreaktionen verknüpfen und verkürzen die Ketten – kein brauchbarer Kautschuk.", "Side reactions link and shorten the chains – no usable rubber.") },
    vinylacetat: { fit: "none", fail: "side", why: T("Die positive Ladung reagiert mit der Estergruppe – eine Nebenreaktion statt einer Kette.", "The positive charge reacts with the ester group – a side reaction instead of a chain.") },
  },
};

/** Name mit Kurzzeichen: „Polyamid 6.6 (PA 6.6, Nylon)“ statt zweier Klammern hintereinander; ohne Kurzzeichen („—“) nur der Name */
export const withAbbr = (name: string, abbr: string) => {
  if (!abbr || abbr === "—") return name;
  const i = name.lastIndexOf(" (");
  return i > 0 && name.endsWith(")") ? `${name.slice(0, i)} (${abbr}, ${name.slice(i + 2)}` : `${name} (${abbr})`;
};

export function compat(m: VinylId, me: MethodId): Compat {
  return RULES[method(me).kind][m];
}

/** alle Verfahren, mit denen ein Monomer lange Ketten bildet */
export const methodsFor = (m: VinylId): MethodId[] => (["dbpo", "aibn", "zn", "buli", "bf3"] as MethodId[]).filter(x => compat(m, x).fit === "ok");

// ── Produkte der Polymerisation ──────────────────────────────────────────────

export type Struktur = "linear" | "verzweigt" | "vernetzt" | "klein";
export type CopoKind = "stat" | "block" | "alt";

export interface Product {
  /** vollständiger Name, z. B. „isotaktisches Polypropen (PP)“ */
  name: string;
  abbr: string;
  klasse: Klasse;
  struktur: Struktur;
  uses: string;
  /** Recycling-Code (Dreieck mit Zahl) */
  code?: string;
  tact?: Tact;
  copo?: CopoKind;
  note?: string;
}

const TACT_ADJ = tr({ iso: "isotaktisches", atakt: "ataktisches" }, { iso: "isotactic", atakt: "atactic" });

/** Produkt einer Homopolymerisation (nur sinnvoll, wenn compat(...).fit === "ok") */
export function homoProduct(m: VinylId, me: MethodId): Product {
  const v = vinyl(m), c = compat(m, me);
  let name = v.polymer, abbr = v.abbr, code: string | undefined, uses = v.uses, note = c.note;
  if (m === "ethen") {
    const hd = method(me).kind === "koord";
    abbr = hd ? "PE-HD" : "PE-LD";
    name = hd ? tr("Polyethen hoher Dichte", "High-density polyethene") : tr("Polyethen niedriger Dichte", "Low-density polyethene");
    uses = hd ? tr("Flaschen, Kanister, Rohre", "bottles, canisters, pipes") : tr("Folien, Tüten, Kabelhüllen", "films, bags, cable sheaths");
    code = hd ? "2" : "4";
  }
  if (m === "propen") code = "5";
  if (m === "styrol") code = "6";
  if (m === "vinylchlorid") code = "3";
  if (m === "butadien" && method(me).kind === "koord") name = tr("cis-1,4-Polybutadien", "cis-1,4-Polybutadiene");
  const tact = c.tact && (m === "propen" || m === "styrol") ? c.tact : undefined;
  if (tact) name = `${TACT_ADJ[tact]} ${name}`;
  return {
    name: `${capFirst(name)} (${abbr})`, abbr, klasse: v.klasse, struktur: c.branched ? "verzweigt" : "linear", uses, code, tact, note,
  };
}

const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** bekannte Copolymere (Paare ungeordnet) */
const COPOS: { a: VinylId; b: VinylId; stat?: [string, string, string]; block?: [string, string, string] }[] = [
  { a: "styrol", b: "butadien", stat: tr(["SBR", "Styrol-Butadien-Kautschuk", "Autoreifen"], ["SBR", "Styrene–butadiene rubber", "car tyres"]),
    block: tr(["SB", "Styrol-Butadien-Blockcopolymer", "mit drei Blöcken (SBS): Schuhsohlen, Zusatz für Straßenasphalt"], ["SB", "Styrene–butadiene block copolymer", "with three blocks (SBS): shoe soles, additive for road asphalt"]) },
  { a: "styrol", b: "acrylnitril", stat: tr(["SAN", "Styrol-Acrylnitril-Copolymer", "Gehäuse, Schüsseln für Küchengeräte"], ["SAN", "Styrene–acrylonitrile copolymer", "housings, bowls for kitchen appliances"]) },
  { a: "acrylnitril", b: "butadien", stat: tr(["NBR", "Nitrilkautschuk", "Dichtungen, Schutzhandschuhe"], ["NBR", "Nitrile rubber", "seals, protective gloves"]) },
  { a: "ethen", b: "propen", stat: tr(["EPM", "Ethen-Propen-Kautschuk", "Dichtungen an Autotüren, Kabel"], ["EPM", "Ethene–propene rubber", "car door seals, cables"]) },
  { a: "ethen", b: "vinylacetat", stat: tr(["EVA", "Ethen-Vinylacetat-Copolymer", "Schuhsohlen, Heißkleber"], ["EVA", "Ethene–vinyl acetate copolymer", "shoe soles, hot glue"]) },
  { a: "styrol", b: "mma", stat: tr(["SMMA", "Styrol-Methylmethacrylat-Copolymer", "durchsichtige Becher und Dosen"], ["SMMA", "Styrene–methyl methacrylate copolymer", "clear cups and boxes"]) },
  { a: "vinylchlorid", b: "vinylacetat", stat: tr(["PVC/VAc", "Vinylchlorid-Vinylacetat-Copolymer", "Lacke, früher Schallplatten"], ["PVC/VAc", "Vinyl chloride–vinyl acetate copolymer", "paints, formerly records"]) },
];

export interface PolyOutcome {
  fit: Fit;
  /** Monomer, an dem es scheitert */
  failing?: VinylId;
  compat: Compat;
  product?: Product;
  /** nacheinander zugegeben, aber nicht lebend: zwei getrennte Polymere statt Blöcken */
  separate?: boolean;
  why: string;
}

/**
 * Polymerisation mit einem oder zwei Monomeren. `seq`: zwei Monomere nacheinander zugeben (nur lebende Ketten ergeben Blöcke).
 */
export function polymerise(ms: VinylId[], me: MethodId, seq = false): PolyOutcome {
  const list = [...new Set(ms)];
  for (const m of list) {
    const c = compat(m, me);
    if (c.fit !== "ok") return { fit: c.fit, failing: m, compat: c, why: c.why };
  }
  const c = compat(list[0], me);
  if (list.length === 1) return { fit: "ok", compat: c, product: homoProduct(list[0], me), why: c.why };
  const [a, b] = list;
  const living = list.every(m => compat(m, me).living);
  const known = COPOS.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  const va = vinyl(a), vb = vinyl(b);
  const elast = va.klasse === "elast" || vb.klasse === "elast";
  if (seq && !living) {
    return {
      fit: "ok", compat: c, separate: true,
      why: tr(`Die ersten Ketten sind schon abgebrochen, wenn ${vb.name} dazukommt. Es entstehen zwei getrennte Polymere statt Blöcken.`,
        `The first chains have already stopped when ${vb.name.toLowerCase()} is added. Two separate polymers form instead of blocks.`),
      product: {
        name: tr(`Gemisch aus ${va.abbr} und ${vb.abbr}`, `Mixture of ${va.abbr} and ${vb.abbr}`), abbr: `${va.abbr} + ${vb.abbr}`, klasse: elast ? "elast" : "thermo",
        struktur: "linear", uses: "–",
      },
    };
  }
  const kind: CopoKind = seq ? "block" : "stat";
  const named = kind === "block" ? known?.block : known?.stat;
  const KIND = tr({ stat: "statistisches Copolymer", block: "Blockcopolymer", alt: "alternierendes Copolymer" }, { stat: "statistical copolymer", block: "block copolymer", alt: "alternating copolymer" });
  return {
    fit: "ok", compat: c,
    why: kind === "block"
      ? tr("Die Ketten leben weiter: Erst wächst ein Block aus dem ersten Monomer, dann ein Block aus dem zweiten.", "The chains stay alive: first a block of the first monomer grows, then a block of the second.")
      : tr("Beide Monomere lagern sich an dasselbe Kettenende an – in zufälliger Reihenfolge.", "Both monomers add to the same chain end – in random order."),
    product: named
      ? { name: withAbbr(named[1], named[0]), abbr: named[0], klasse: elast ? "elast" : "thermo", struktur: "linear", uses: named[2], copo: kind }
      : { name: tr(`${capFirst(KIND[kind])} aus ${va.name} und ${vb.name}`, `${capFirst(KIND[kind])} of ${va.name.toLowerCase()} and ${vb.name.toLowerCase()}`), abbr: `${va.letter}/${vb.letter}`, klasse: elast ? "elast" : "thermo", struktur: "linear", uses: "–", copo: kind },
  };
}

// ── Stufenwachstum: Gruppe × Gruppe ──────────────────────────────────────────

export type Link = "ester" | "amid" | "urethan" | "harnstoff" | "aminoalkohol" | "methylen";
export type Byp = "H2O" | "HCl" | null;

export const LINK_NAME: Record<Link, string> = tr(
  { ester: "Esterbindung", amid: "Amidbindung (wie die Peptidbindung in Proteinen)", urethan: "Urethangruppe", harnstoff: "Harnstoffgruppe", aminoalkohol: "Aminoalkohol-Brücke", methylen: "CH₂-Brücke" },
  { ester: "ester bond", amid: "amide bond (peptide bond)", urethan: "urethane group", harnstoff: "urea group", aminoalkohol: "amino alcohol bridge", methylen: "CH₂ bridge" },
);
/** kurzer Name für die Statuszeile */
export const LINK_SHORT: Record<Link, string> = tr(
  { ester: "Esterbindung", amid: "Amidbindung", urethan: "Urethangruppe", harnstoff: "Harnstoffgruppe", aminoalkohol: "Epoxidring geöffnet", methylen: "CH₂-Brücke" },
  { ester: "ester bond", amid: "amide bond", urethan: "urethane group", harnstoff: "urea group", aminoalkohol: "epoxide ring opened", methylen: "CH₂ bridge" },
);
export const LINK_FORMULA: Record<Link, string> = { ester: "–CO–O–", amid: "–CO–NH–", urethan: "–NH–CO–O–", harnstoff: "–NH–CO–NH–", aminoalkohol: "–CH(OH)–CH₂–NH–", methylen: "–CH₂–" };
export const BYP_NAME: Record<"H2O" | "HCl", string> = tr({ H2O: "Wasser (H₂O)", HCl: "Chlorwasserstoff (HCl)" }, { H2O: "water (H₂O)", HCl: "hydrogen chloride (HCl)" });

interface Pair { link: Link; byp: Byp; art: Art }
/** Reaktion zweier funktioneller Gruppen (ohne Katalysator, wie im Unterricht) */
export function reactGroups(x: FG, y: FG): Pair | null {
  const k = [x, y].sort().join("+");
  switch (k) {
    case "COOH+OH": return { link: "ester", byp: "H2O", art: "kond" };
    case "COOH+NH2": return { link: "amid", byp: "H2O", art: "kond" };
    case "COCl+OH": return { link: "ester", byp: "HCl", art: "kond" };
    case "COCl+NH2": return { link: "amid", byp: "HCl", art: "kond" };
    case "NCO+OH": return { link: "urethan", byp: null, art: "add" };
    case "NCO+NH2": return { link: "harnstoff", byp: null, art: "add" };
    case "EPOX+NH2": return { link: "aminoalkohol", byp: null, art: "add" };
    case "ArH+CHO": return { link: "methylen", byp: "H2O", art: "kond" };
    default: return null;
  }
}

export interface StepOutcome {
  /** lange Ketten (linear), Netz (vernetzt), nur kleine Moleküle (Kettenstopper) oder keine Reaktion */
  struktur: Struktur | "none";
  art?: Art;
  link?: Link;
  byp?: Byp;
  /** reagierende Gruppen (Monomer a, Monomer b) */
  groups?: [FG, FG];
  product?: Product;
  why: string;
}

/** Funktionalität gegenüber dem Partner: eine NH₂-Gruppe reagiert mit zwei Epoxidgruppen (zwei N–H) */
export function functionality(id: StepId, partner: FG | null): number {
  const g = stepMono(id).groups;
  return g.reduce((s, x) => s + (x === "NH2" && partner === "EPOX" ? 2 : 1), 0);
}

const STEP_PRODUCTS: { a: StepId; b?: StepId; p: [string, string, string]; klasse?: Klasse; code?: string; note?: string }[] = [
  { a: "terephthalsaeure", b: "ethandiol", code: "1", p: tr(["PET", "Polyethylenterephthalat", "Getränkeflaschen, Polyesterfasern für Kleidung"], ["PET", "Poly(ethylene terephthalate)", "drinks bottles, polyester fibres for clothes"]) },
  { a: "terephthaloylchlorid", b: "ethandiol", code: "1", p: tr(["PET", "Polyethylenterephthalat", "Getränkeflaschen, Polyesterfasern für Kleidung"], ["PET", "Poly(ethylene terephthalate)", "drinks bottles, polyester fibres for clothes"]) },
  { a: "terephthalsaeure", b: "butandiol", p: tr(["PBT", "Polybutylenterephthalat", "Stecker und Gehäuse für Elektrogeräte"], ["PBT", "Poly(butylene terephthalate)", "plugs and housings for electrical devices"]) },
  { a: "terephthaloylchlorid", b: "butandiol", p: tr(["PBT", "Polybutylenterephthalat", "Stecker und Gehäuse für Elektrogeräte"], ["PBT", "Poly(butylene terephthalate)", "plugs and housings for electrical devices"]) },
  { a: "adipinsaeure", b: "ethandiol", p: tr(["PEA", "Polyethylenadipat (Polyester)", "Ausgangsstoff für weiche Polyurethane"], ["PEA", "Poly(ethylene adipate) (polyester)", "raw material for soft polyurethanes"]) },
  { a: "adipoylchlorid", b: "ethandiol", p: tr(["PEA", "Polyethylenadipat (Polyester)", "Ausgangsstoff für weiche Polyurethane"], ["PEA", "Poly(ethylene adipate) (polyester)", "raw material for soft polyurethanes"]) },
  { a: "adipinsaeure", b: "butandiol", p: tr(["PBA", "Polybutylenadipat (Polyester)", "verwandt mit PBAT in kompostierbaren Folien"], ["PBA", "Poly(butylene adipate) (polyester)", "related to PBAT in compostable films"]) },
  { a: "adipoylchlorid", b: "butandiol", p: tr(["PBA", "Polybutylenadipat (Polyester)", "verwandt mit PBAT in kompostierbaren Folien"], ["PBA", "Poly(butylene adipate) (polyester)", "related to PBAT in compostable films"]) },
  { a: "adipinsaeure", b: "hexandiamin", p: tr(["PA 6.6", "Polyamid 6.6 (Nylon)", "Strumpfhosen, Seile, Zahnräder, Kabelbinder"], ["PA 6.6", "Polyamide 6.6 (nylon)", "tights, ropes, gear wheels, cable ties"]) },
  { a: "adipoylchlorid", b: "hexandiamin", p: tr(["PA 6.6", "Polyamid 6.6 (Nylon)", "Strumpfhosen, Seile, Zahnräder, Kabelbinder"], ["PA 6.6", "Polyamide 6.6 (nylon)", "tights, ropes, gear wheels, cable ties"]) },
  { a: "terephthaloylchlorid", b: "phenylendiamin", p: tr(["PPTA", "Aramid (Poly-p-phenylenterephthalamid)", "schusssichere Westen, Feuerwehrkleidung, Seile"], ["PPTA", "Aramid (poly-p-phenylene terephthalamide)", "bulletproof vests, firefighter clothing, ropes"]) },
  { a: "terephthalsaeure", b: "phenylendiamin", p: tr(["PPTA", "Aramid (Poly-p-phenylenterephthalamid)", "schusssichere Westen, Feuerwehrkleidung, Seile"], ["PPTA", "Aramid (poly-p-phenylene terephthalamide)", "bulletproof vests, firefighter clothing, ropes"]),
    note: tr("technisch aus dem Säurechlorid hergestellt", "made industrially from the acid chloride") },
  { a: "terephthalsaeure", b: "hexandiamin", p: tr(["PA 6T", "Polyamid 6T", "hitzefeste Bauteile im Motorraum"], ["PA 6T", "Polyamide 6T", "heat-resistant parts in the engine compartment"]) },
  { a: "terephthaloylchlorid", b: "hexandiamin", p: tr(["PA 6T", "Polyamid 6T", "hitzefeste Bauteile im Motorraum"], ["PA 6T", "Polyamide 6T", "heat-resistant parts in the engine compartment"]) },
  { a: "milchsaeure", code: "7", p: tr(["PLA", "Polymilchsäure (Polylactid)", "kompostierbare Becher und Folien, 3D-Druck"], ["PLA", "Poly(lactic acid) (polylactide)", "compostable cups and films, 3D printing"]),
    note: tr("technisch meist über das ringförmige Lactid", "made industrially mostly via the ring-shaped lactide") },
  { a: "aminohexansaeure", p: tr(["PA 6", "Polyamid 6", "Fasern, Teppiche, Strümpfe"], ["PA 6", "Polyamide 6", "fibres, carpets, stockings"]),
    note: tr("technisch aus dem ringförmigen Caprolactam", "made industrially from the ring-shaped caprolactam") },
  { a: "phenol", b: "methanal", klasse: "duro", p: tr(["PF", "Phenoplast (Phenol-Formaldehyd-Harz)", "Griffe von Töpfen, Steckdosen, Leiterplatten"], ["PF", "Phenolic resin (phenol–formaldehyde)", "pan handles, sockets, circuit boards"]) },
  { a: "hdi", b: "ethandiol", p: tr(["PUR", "Polyurethan", "lichtechte Lacke, Klebstoffe"], ["PUR", "Polyurethane", "lightfast paints, adhesives"]) },
  { a: "hdi", b: "butandiol", p: tr(["PUR", "Polyurethan", "lichtechte Lacke, Klebstoffe"], ["PUR", "Polyurethane", "lightfast paints, adhesives"]) },
  { a: "mdi", b: "ethandiol", p: tr(["TPU", "Thermoplastisches Polyurethan", "Skischuhe, Kabelmäntel, Handyhüllen"], ["TPU", "Thermoplastic polyurethane", "ski boots, cable sheaths, phone cases"]) },
  { a: "mdi", b: "butandiol", p: tr(["TPU", "Thermoplastisches Polyurethan", "Skischuhe, Kabelmäntel, Handyhüllen"], ["TPU", "Thermoplastic polyurethane", "ski boots, cable sheaths, phone cases"]) },
  { a: "hdi", b: "glycerin", klasse: "duro", p: tr(["PUR", "Vernetztes Polyurethan", "harte, lichtechte Lacke"], ["PUR", "Cross-linked polyurethane", "hard, lightfast paints"]) },
  { a: "mdi", b: "glycerin", klasse: "duro", p: tr(["PUR", "Vernetztes Polyurethan", "Hartschaum zum Dämmen"], ["PUR", "Cross-linked polyurethane", "rigid insulation foam"]) },
  { a: "hdi", b: "hexandiamin", p: tr(["PUA", "Polyharnstoff", "Schutzbeschichtungen für Böden und Ladeflächen"], ["PUA", "Polyurea", "protective coatings for floors and truck beds"]) },
  { a: "mdi", b: "hexandiamin", p: tr(["PUA", "Polyharnstoff", "Schutzbeschichtungen für Böden und Ladeflächen"], ["PUA", "Polyurea", "protective coatings for floors and truck beds"]) },
  { a: "badge", b: "hexandiamin", klasse: "duro", p: tr(["EP", "Epoxidharz", "Zweikomponentenkleber, Bootsbau mit Glasfasern"], ["EP", "Epoxy resin", "two-component adhesives, boat building with glass fibres"]) },
];

/** Polyester aus einer Säure und Glycerin: vernetzt */
const NET_ESTER = tr(["—", "Vernetzter Polyester (Glycerin-Polyesterharz, Alkydharz-Typ)", "Lackharze"], ["—", "Cross-linked polyester (glycerol polyester resin, alkyd type)", "paint resins"]);

/** Stufenwachstum aus einem Monomer (AB-Monomer) oder zwei Monomeren */
export function stepReact(a: StepId, b?: StepId): StepOutcome {
  const A = stepMono(a), B = b ? stepMono(b) : undefined;
  const NONE = (why: string): StepOutcome => ({ struktur: "none", why });
  if (!B || a === b) {
    // ein Monomer allein: nur AB-Monomere reagieren mit sich selbst
    const [x, y] = A.groups;
    const r = A.groups.length === 2 && x !== y ? reactGroups(x, y) : null;
    if (!r) return NONE(tr(`${A.name} allein reagiert nicht: Gleiche Gruppen verbinden sich nicht miteinander.`, `${A.name} alone does not react: identical groups do not join each other.`));
    const p = STEP_PRODUCTS.find(s => s.a === a && !s.b);
    return {
      struktur: "linear", art: r.art, link: r.link, byp: r.byp, groups: [x, y],
      why: tr(`${A.name} trägt zwei verschiedene Gruppen. Das eine Ende reagiert mit dem anderen Ende des nächsten Moleküls.`, `${A.name} carries two different groups. One end reacts with the other end of the next molecule.`),
      product: p && { name: withAbbr(p.p[1], p.p[0]), abbr: p.p[0], klasse: p.klasse ?? "thermo", struktur: "linear", uses: p.p[2], code: p.code, note: p.note },
    };
  }
  // passende Gruppen suchen
  let pair: { x: FG; y: FG; r: Pair } | undefined;
  for (const x of A.groups) for (const y of B.groups) { const r = reactGroups(x, y); if (r && !pair) pair = { x, y, r }; }
  if (!pair) {
    const epoxOh = (A.groups.includes("EPOX") && B.groups.includes("OH")) || (B.groups.includes("EPOX") && A.groups.includes("OH"));
    return NONE(epoxOh
      ? tr("Epoxidgruppen reagieren mit Hydroxygruppen nur mit Katalysator und Hitze – hier entsteht keine Kette.", "Epoxide groups only react with hydroxy groups with a catalyst and heat – no chain forms here.")
      : tr(`${A.name} und ${B.name} haben keine Gruppen, die miteinander reagieren.`, `${A.name} and ${B.name.toLowerCase()} have no groups that react with each other.`));
  }
  const fa = functionality(a, pair.y), fb = functionality(b!, pair.x);
  const base = { art: pair.r.art, link: pair.r.link, byp: pair.r.byp, groups: [pair.x, pair.y] as [FG, FG] };
  if (fa < 2 || fb < 2) {
    const mono = fa < 2 ? A : B;
    return {
      ...base, struktur: "klein",
      why: tr(`${mono.name} hat nur eine reaktive Gruppe. Nach der ersten Verknüpfung ist das Ende blockiert – es entsteht kein Polymer.`, `${mono.name} has only one reactive group. After the first link the end is blocked – no polymer forms.`),
    };
  }
  const net = fa >= 3 || fb >= 3;
  const known = STEP_PRODUCTS.find(s => (s.a === a && s.b === b) || (s.a === b && s.b === a));
  const linkName = LINK_NAME[pair.r.link];
  let product: Product;
  if (known) product = { name: withAbbr(known.p[1], known.p[0]), abbr: known.p[0], klasse: known.klasse ?? (net ? "duro" : "thermo"), struktur: net ? "vernetzt" : "linear", uses: known.p[2], code: known.code, note: known.note };
  else if (net && pair.r.link === "ester") product = { name: withAbbr(NET_ESTER[1], NET_ESTER[0]), abbr: NET_ESTER[0], klasse: "duro", struktur: "vernetzt", uses: NET_ESTER[2] };
  else {
    const kind = pair.r.link === "ester" ? tr("Polyester", "Polyester") : pair.r.link === "amid" ? tr("Polyamid", "Polyamide") : pair.r.link === "urethan" ? tr("Polyurethan", "Polyurethane") : pair.r.link === "harnstoff" ? tr("Polyharnstoff", "Polyurea") : tr("Polymer", "Polymer");
    product = { name: tr(`${kind} aus ${A.name} und ${B.name}`, `${kind} of ${A.name.toLowerCase()} and ${B.name.toLowerCase()}`), abbr: kind, klasse: net ? "duro" : "thermo", struktur: net ? "vernetzt" : "linear", uses: "–" };
  }
  return {
    ...base, struktur: net ? "vernetzt" : "linear", product,
    why: net
      ? tr(`Ein Monomer hat drei oder mehr reaktive Stellen. Die Ketten verknüpfen sich zu einem Netz: ${linkName}.`, `One monomer has three or more reactive sites. The chains link up into a network: ${linkName}.`)
      : tr(`Jedes Monomer hat zwei reaktive Gruppen. Sie verknüpfen sich abwechselnd zu langen Ketten: ${linkName}.`, `Each monomer has two reactive groups. They join alternately into long chains: ${linkName}.`),
  };
}

/** Name der Reaktionsart einer Verknüpfung (Polykondensation: mit Nebenprodukt, Polyaddition: ohne) */
export const artOfLink = (l: Link): Art => (l === "urethan" || l === "harnstoff" || l === "aminoalkohol" ? "add" : "kond");
export const artName = (a: Art) => ART_NAME[a];
