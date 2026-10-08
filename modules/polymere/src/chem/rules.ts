// Welche Kombination funktioniert – und warum: Monomer × Starter/Katalysator (Polymerisation), Gruppe × Gruppe (Stufenwachstum).
// Ergebnis ist das Produkt (Name, Kurzzeichen, Aufbau, Verwendung) oder die fachliche Begründung, warum keine (lange) Kette entsteht.

import { tr } from "@lern/i18n";
import { ART_NAME, FG_FORMULA, lc, method, stepMono, vinyl, type Art, type FG, type Klasse, type MechKind, type MethodId, type Rubber, type StepId, type StepMono, type VinylId } from "./data.ts";

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
    ethen: { fit: "ok", branched: true, why: T("Radikale lagern sich an die Zweifachbindung an. Unter hohem Druck entstehen lange, verzweigte Ketten.", "Radicals add to the double bond. Under high pressure long, branched chains form."), note: T("nur unter hohem Druck (1000–3000 bar) – PE-LD, verzweigt", "only under high pressure (1000–3000 bar) – PE-LD (LDPE), branched") },
    propen: { fit: "short", fail: "allyl", why: T("Das Radikal reißt ein H‑Atom von der CH₃-Gruppe ab. Das neue Radikal ist zu stabil und wächst kaum weiter – nur ölige, kurze Ketten.", "The radical pulls an H atom off the CH₃ group. The new radical is too stable and hardly grows – only oily, short chains.") },
    styrol: { fit: "ok", tact: "atakt", why: T("Der Benzolring stabilisiert das Radikal am Kettenende. Die Ketten wachsen schnell.", "The benzene ring stabilises the radical at the chain end. The chains grow fast.") },
    vinylchlorid: { fit: "ok", tact: "atakt", why: T("Radikale lagern sich an die Zweifachbindung an. So wird PVC hergestellt.", "Radicals add to the double bond. This is how PVC is made.") },
    mma: { fit: "ok", tact: "atakt", why: T("Die COOCH₃-Gruppe stabilisiert das Radikal am Kettenende. So entsteht Acrylglas.", "The COOCH₃ group stabilises the radical at the chain end. This is how acrylic glass is made.") },
    acrylnitril: { fit: "ok", tact: "atakt", why: T("Die C≡N-Gruppe stabilisiert das Radikal am Kettenende.", "The C≡N group stabilises the radical at the chain end.") },
    tfe: { fit: "ok", why: T("Radikale lagern sich an die Zweifachbindung an.", "Radicals add to the double bond."), note: T("technisch in Wasser mit Peroxodisulfat", "made in water with peroxodisulfate") },
    isobuten: { fit: "short", fail: "allyl", why: T("Das Radikal reißt ein H‑Atom von einer CH₃-Gruppe ab. Das neue Radikal ist zu stabil – es entstehen nur sehr kurze Ketten.", "The radical pulls an H atom off a CH₃ group. The new radical is too stable – only very short chains form.") },
    butadien: { fit: "ok", why: T("Radikale lagern sich an. Ein Teil wird 1,4 eingebaut (C=C in der Kette), ein Teil 1,2.", "Radicals add. Some repeat units are built in 1,4 (C=C in the chain), some 1,2."), note: T("Synthesekautschuk", "synthetic rubber") },
    vinylacetat: { fit: "ok", tact: "atakt", why: T("Radikale lagern sich an die Zweifachbindung an. So entsteht Holzleim.", "Radicals add to the double bond. This is how wood glue is made.") },
  },
  koord: {
    ethen: { fit: "ok", why: T("Ethen lagert sich an das Titan an und wird zwischen Titan und Kette eingebaut. Die Ketten bleiben unverzweigt.", "Ethene attaches to the titanium and is inserted between titanium and chain. The chains stay unbranched."), note: T("Niederdruck – PE-HD, unverzweigt, dicht und fest", "low pressure – PE-HD (HDPE), unbranched, dense and stiff") },
    propen: { fit: "ok", tact: "iso", why: T("Jedes Propen lagert sich gleich herum an das Titan an. Alle CH₃-Gruppen zeigen zur selben Seite: isotaktisch.", "Every propene attaches to the titanium the same way round. All CH₃ groups point to the same side: isotactic.") },
    styrol: { fit: "ok", tact: "iso", why: T("Styrol wird am Titan eingebaut – immer gleich herum. Es entsteht isotaktisches Polystyrol.", "Styrene is inserted at the titanium – always the same way round. Isotactic polystyrene forms.") },
    vinylchlorid: { fit: "none", fail: "poison", why: T("Das Cl‑Atom bindet mit einem freien Elektronenpaar an das Titan. Es besetzt die freie Stelle: Der Katalysator ist vergiftet.", "The Cl atom binds to the titanium with a lone pair. It blocks the vacant site: the catalyst is poisoned.") },
    mma: { fit: "none", fail: "poison", why: T("Das O der C=O-Gruppe bindet mit einem freien Elektronenpaar an das Titan. Es besetzt die freie Stelle: Der Katalysator ist vergiftet.", "The O of the C=O group binds to the titanium with a lone pair. It blocks the vacant site: the catalyst is poisoned.") },
    acrylnitril: { fit: "none", fail: "poison", why: T("Das N‑Atom der C≡N-Gruppe bindet mit seinem freien Elektronenpaar an das Titan. Der Katalysator ist vergiftet.", "The N atom of the C≡N group binds to the titanium with its lone pair. The catalyst is poisoned.") },
    tfe: { fit: "none", fail: "poison", why: T("Ein F‑Atom bindet an das Titan und besetzt die freie Stelle. Der Katalysator ist vergiftet.", "An F atom binds to the titanium and blocks the vacant site. The catalyst is poisoned.") },
    isobuten: { fit: "none", fail: "bulky", why: T("Zwei CH₃-Gruppen am selben C‑Atom sind zu sperrig. Isobuten wird am Titan nicht eingebaut.", "Two CH₃ groups on the same C atom are too bulky. Isobutene is not inserted at the titanium.") },
    butadien: { fit: "ok", why: T("Butadien wird am Titan überwiegend 1,4 eingebaut. Fast nur cis-1,4 – ein Kautschuk wie Naturkautschuk – gibt erst ein passender Katalysator (z. B. mit Neodym).", "Butadiene is inserted mostly 1,4 at the titanium. Almost only cis-1,4 – a rubber like natural rubber – needs a suitable catalyst (e.g. with neodymium).") },
    vinylacetat: { fit: "none", fail: "poison", why: T("Das O der C=O-Gruppe bindet mit einem freien Elektronenpaar an das Titan. Es besetzt die freie Stelle: Der Katalysator ist vergiftet.", "The O of the C=O group binds to the titanium with a lone pair. It blocks the vacant site: the catalyst is poisoned.") },
  },
  anion: {
    ethen: { fit: "none", fail: "bounce", why: T("Kaum Reaktion: Keine Gruppe stabilisiert die negative Ladung am Kettenende.", "Hardly any reaction: no group stabilises the negative charge at the chain end.") },
    propen: { fit: "none", fail: "bounce", why: T("Die CH₃-Gruppe schiebt Elektronen zur Zweifachbindung. Eine negative Ladung am Kettenende wäre zu instabil.", "The CH₃ group pushes electrons towards the double bond. A negative charge at the chain end would be too unstable.") },
    styrol: { fit: "ok", tact: "atakt", living: true, why: T("Der Benzolring stabilisiert die negative Ladung. Die Ketten brechen nicht von selbst ab: lebende Ketten.", "The benzene ring stabilises the negative charge. The chains do not stop by themselves: living chains.") },
    vinylchlorid: { fit: "none", fail: "side", why: T("Butyllithium reagiert mit dem Cl‑Atom statt mit der C=C – es entsteht keine Kette.", "Butyllithium reacts with the Cl atom instead of the C=C – no chain forms.") },
    mma: { fit: "ok", tact: "atakt", living: true, why: T("Die COOCH₃-Gruppe stabilisiert die negative Ladung. Nur bei −78 °C – sonst greift das Anion die COOCH₃-Gruppe an.", "The COOCH₃ group stabilises the negative charge. Only at −78 °C – otherwise the anion attacks the COOCH₃ group."), note: "−78 °C" },
    acrylnitril: { fit: "ok", tact: "atakt", why: T("Die C≡N-Gruppe stabilisiert die negative Ladung am Kettenende. Nebenreaktionen an der C≡N-Gruppe beenden die Ketten aber nach und nach: Sie leben nicht.", "The C≡N group stabilises the negative charge at the chain end. But side reactions at the C≡N group stop the chains bit by bit: they are not living.") },
    tfe: { fit: "none", fail: "side", why: T("Das Anion verdrängt ein Fluorid-Ion (F⁻) – eine Nebenreaktion statt einer Kette.", "The anion pushes out a fluoride ion (F⁻) – a side reaction instead of a chain.") },
    isobuten: { fit: "none", fail: "bounce", why: T("Zwei CH₃-Gruppen schieben Elektronen zur Zweifachbindung. Eine negative Ladung am Kettenende wäre sehr instabil.", "Two CH₃ groups push electrons towards the double bond. A negative charge at the chain end would be very unstable.") },
    butadien: { fit: "ok", living: true, why: T("Die negative Ladung verteilt sich über zwei C‑Atome. Die Ketten brechen nicht von selbst ab: lebende Ketten.", "The negative charge spreads over two C atoms. The chains do not stop by themselves: living chains.") },
    vinylacetat: { fit: "none", fail: "side", why: T("Das Anion greift die Acetatgruppe an – eine Nebenreaktion statt einer Kette.", "The anion attacks the acetate group – a side reaction instead of a chain.") },
  },
  kation: {
    ethen: { fit: "none", fail: "bounce", why: T("Eine positive Ladung am Kettenende (–CH₂⁺) wäre zu instabil.", "A positive charge at the chain end (–CH₂⁺) would be too unstable.") },
    propen: { fit: "short", fail: "short", why: T("Das Kettenende gibt schnell ein H⁺ ab. Es entstehen nur kurze Ketten.", "The chain end quickly gives off an H⁺. Only short chains form.") },
    styrol: { fit: "ok", tact: "atakt", why: T("Der Benzolring stabilisiert die positive Ladung am Kettenende.", "The benzene ring stabilises the positive charge at the chain end.") },
    vinylchlorid: { fit: "none", fail: "bounce", why: T("Das Cl‑Atom zieht Elektronen ab – eine positive Ladung am Kettenende wäre zu instabil.", "The Cl atom withdraws electrons – a positive charge at the chain end would be too unstable.") },
    mma: { fit: "none", fail: "bounce", why: T("Die COOCH₃-Gruppe zieht Elektronen ab – eine positive Ladung am Kettenende wäre zu instabil.", "The COOCH₃ group withdraws electrons – a positive charge at the chain end would be too unstable.") },
    acrylnitril: { fit: "none", fail: "bounce", why: T("Die C≡N-Gruppe zieht Elektronen ab – eine positive Ladung am Kettenende wäre zu instabil.", "The C≡N group withdraws electrons – a positive charge at the chain end would be too unstable.") },
    tfe: { fit: "none", fail: "bounce", why: T("Die F‑Atome ziehen Elektronen ab – eine positive Ladung am Kettenende wäre zu instabil.", "The F atoms withdraw electrons – a positive charge at the chain end would be too unstable.") },
    isobuten: { fit: "ok", why: T("Zwei CH₃-Gruppen stabilisieren die positive Ladung am Kettenende – so entstehen lange Ketten.", "Two CH₃ groups stabilise the positive charge at the chain end – so long chains form."), note: "−100 °C" },
    butadien: { fit: "short", fail: "short", why: T("Nebenreaktionen verknüpfen und verkürzen die Ketten – kein brauchbarer Kautschuk.", "Side reactions link and shorten the chains – no usable rubber.") },
    vinylacetat: { fit: "none", fail: "side", why: T("Die positive Ladung reagiert mit der Acetatgruppe – eine Nebenreaktion statt einer Kette.", "The positive charge reacts with the acetate group – a side reaction instead of a chain.") },
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
export type CopoKind = "stat" | "block" | "alt" | "gradient";

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
  /** Kautschuk: wie er vernetzt wird (nur Klasse elast) */
  rubber?: Rubber;
  /** zwei getrennte Polymere (nacheinander zugegeben, Ketten nicht lebend) */
  mix?: boolean;
  /** sternförmig verzweigt (AB-Monomer + Monomer mit drei Gruppen): Arme ab einem Kern, kein Netz */
  star?: boolean;
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
  const tact = c.tact && (m === "propen" || m === "styrol") ? c.tact : undefined;
  // englisch: Polymername mitten im Satz klein („Isotactic polypropene“)
  if (tact) name = tr(`${TACT_ADJ[tact]} ${name}`, `${TACT_ADJ[tact]} ${lc(name)}`);
  return {
    name: `${capFirst(name)} (${abbr})`, abbr, klasse: v.klasse, ...(v.rubber ? { rubber: v.rubber } : {}), struktur: c.branched ? "verzweigt" : "linear", uses, code, tact, note,
  };
}

const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** bekanntes Copolymer: Kurzzeichen, Name, Verwendung und Art des Kunststoffs */
interface Copo { p: [string, string, string]; klasse: Klasse; rubber?: Rubber }
/** bekannte Copolymere (Paare ungeordnet) */
const COPOS: { a: VinylId; b: VinylId; stat?: Copo; block?: Copo }[] = [
  { a: "styrol", b: "butadien", stat: { klasse: "elast", rubber: "dien", p: tr(["SBR", "Styrol-Butadien-Kautschuk", "Autoreifen"], ["SBR", "Styrene–butadiene rubber", "car tyres"]) },
    block: { klasse: "elast", rubber: "zweiblock", p: tr(["SB", "Styrol-Butadien-Blockcopolymer", "mit drei Blöcken (SBS): Schuhsohlen, Zusatz für Straßenasphalt"], ["SB", "Styrene–butadiene block copolymer", "with three blocks (SBS): shoe soles, additive for road asphalt"]) } },
  { a: "styrol", b: "acrylnitril", stat: { klasse: "thermo", p: tr(["SAN", "Styrol-Acrylnitril-Copolymer", "Gehäuse, Schüsseln für Küchengeräte"], ["SAN", "Styrene–acrylonitrile copolymer", "housings, bowls for kitchen appliances"]) } },
  { a: "acrylnitril", b: "butadien", stat: { klasse: "elast", rubber: "dien", p: tr(["NBR", "Nitrilkautschuk", "Dichtungen, Schutzhandschuhe"], ["NBR", "Nitrile rubber", "seals, protective gloves"]) } },
  // EPM: Kautschuk ohne C=C in der Kette – vernetzt wird mit Peroxid, nicht mit Schwefel
  { a: "ethen", b: "propen", stat: { klasse: "elast", rubber: "peroxid", p: tr(["EPM", "Ethen-Propen-Kautschuk", "Dichtungen an Autotüren, Kabel"], ["EPM", "Ethene–propene rubber", "car door seals, cables"]) } },
  { a: "ethen", b: "vinylacetat", stat: { klasse: "thermo", p: tr(["EVA", "Ethen-Vinylacetat-Copolymer", "Schuhsohlen, Heißkleber"], ["EVA", "Ethene–vinyl acetate copolymer", "shoe soles, hot glue"]) } },
  { a: "styrol", b: "mma", stat: { klasse: "thermo", p: tr(["SMMA", "Styrol-Methylmethacrylat-Copolymer", "durchsichtige Becher und Dosen"], ["SMMA", "Styrene–methyl methacrylate copolymer", "clear cups and boxes"]) } },
  { a: "vinylchlorid", b: "vinylacetat", stat: { klasse: "thermo", p: tr(["PVC/VAc", "Vinylchlorid-Vinylacetat-Copolymer", "Lacke, früher Schallplatten"], ["PVC/VAc", "Vinyl chloride–vinyl acetate copolymer", "paints, formerly records"]) } },
];

/** Art eines unbekannten Copolymers: mit Butadien ein Kautschuk mit C=C, sonst wie das gummiartige Homopolymer (falls eines dabei ist) */
function copoClass(a: VinylId, b: VinylId): { klasse: Klasse; rubber?: Rubber } {
  if (vinyl(a).diene || vinyl(b).diene) return { klasse: "elast", rubber: "dien" };
  const el = [a, b].map(vinyl).find(v => v.klasse === "elast");
  return el ? { klasse: "elast", ...(el.rubber ? { rubber: el.rubber } : {}) } : { klasse: "thermo" };
}

/** anionisch: Stärke des Kettenendes (Carbanion). Ein Ende startet nur Monomere mit gleicher oder kleinerer Zahl:
 *  Styrol, Butadien → Methylmethacrylat → Acrylnitril; umgekehrt nicht (das Kettenende aus MMA ist zu schwach für Styrol) */
const ANION_LEVEL: Partial<Record<VinylId, number>> = { styrol: 3, butadien: 3, mma: 2, acrylnitril: 1 };
export const anionStarts = (end: VinylId, m: VinylId) => (ANION_LEVEL[end] ?? 0) >= (ANION_LEVEL[m] ?? 0);

/** anionisch gleichzeitig: welches Monomer lagert sich zuerst an? Das mit dem schwächeren Kettenende (MMA vor Styrol, Acrylnitril vor MMA);
 *  Styrol + Butadien (in Kohlenwasserstoff): Butadien viel schneller (r(B) ≈ 12, r(S) ≈ 0,03) – erst Butadien, zum Schluss Styrol */
export function anionFirst(a: VinylId, b: VinylId): VinylId {
  const la = ANION_LEVEL[a] ?? 0, lb = ANION_LEVEL[b] ?? 0;
  if (la !== lb) return la < lb ? a : b;
  return b === "butadien" ? b : a;
}

/** zwei Monomere nacheinander: block = Blöcke (anionisch, die Kette lebt und ihr Ende startet das zweite Monomer);
 *  first = das zweite Monomer reagiert nicht mehr (Kettenende zu schwach bzw. Ketten tot, Butyllithium verbraucht);
 *  separate = die ersten Ketten sind fertig, neue Ketten aus dem zweiten Monomer (radikalisch, kationisch, Ziegler-Natta) */
export type SeqKind = "block" | "first" | "separate";
export function seqKind(a: VinylId, b: VinylId, me: MethodId): SeqKind {
  if (method(me).kind !== "anion") return "separate";
  return compat(a, me).living && anionStarts(a, b) ? "block" : "first";
}

export interface PolyOutcome {
  fit: Fit;
  /** Monomer, an dem es scheitert */
  failing?: VinylId;
  compat: Compat;
  product?: Product;
  /** nacheinander zugegeben, aber nicht lebend: zwei getrennte Polymere statt Blöcken */
  separate?: boolean;
  /** Monomer, das (fast) nicht eingebaut wird */
  unreacted?: VinylId;
  why: string;
}

/** Wiederholeinheiten fürs Produktbild: beim Gemisch beide, beim Copolymer keine, sonst die des Monomers, das tatsächlich eingebaut wird */
export function productUnits(ms: VinylId[], out: PolyOutcome): VinylId[] {
  if (!out.product || out.product.copo) return [];
  return out.product.mix ? ms : ms.filter(m => m !== out.unreacted).slice(0, 1);
}

/** warum nacheinander keine Blöcke entstehen (je Verfahren) */
const SEP_WHY = (k: MechKind, b: string) => tr(
  { radikal: `Radikal-Ketten brechen nach Bruchteilen einer Sekunde ab. Mit ${b} starten neue Radikale neue Ketten: zwei getrennte Polymere statt Blöcken.`,
    kation: `Die Ketten enden schnell, indem sie ein H⁺ abgeben. Dieses H⁺ startet neue Ketten aus ${b}: zwei getrennte Polymere statt Blöcken.`,
    koord: `Die Ketten lösen sich nach und nach vom Titan. Danach wachsen dort Ketten aus ${b}: überwiegend zwei getrennte Polymere statt Blöcken.`,
    anion: "" },
  { radikal: `Radical chains stop within a fraction of a second. With ${lc(b)}, new radicals start new chains: two separate polymers instead of blocks.`,
    kation: `The chains end quickly by giving off an H⁺. This H⁺ starts new chains of ${lc(b)}: two separate polymers instead of blocks.`,
    koord: `The chains come off the titanium bit by bit. Then chains of ${lc(b)} grow there: mostly two separate polymers instead of blocks.`,
    anion: "" },
)[k];

/** Ansatz, in dem ein Monomer mit dem Verfahren keine langen Ketten bildet. Bildet das andere Ketten, entsteht dessen Homopolymer
 *  (wie in Atom-Ansicht und Reaktor); kein Polymer nur, wenn der Katalysator von Anfang an vergiftet bzw. der Starter vorher verbraucht ist */
function withFailing(list: VinylId[], me: MethodId, seq: boolean): PolyOutcome {
  const good = list.filter(m => compat(m, me).fit === "ok");
  const x = list.find(m => compat(m, me).fit === "none")!, cx = compat(x, me), vx = vinyl(x);
  const y = list.find(m => m !== x);
  if (y && cx.fail === "side" && seq && x === list[0])
    return { fit: "none", failing: x, compat: cx, why: cx.why + tr(` Kommt danach ${vinyl(y).name} dazu, ist kein Starter mehr übrig.`, ` When ${lc(vinyl(y).name)} is added afterwards, no initiator is left.`) };
  if (!good.length) {
    // beide passen nicht: kurze Ketten, wenn das andere kurze Ketten bildet
    const sh = list.find(m => m !== x && compat(m, me).fit === "short");
    if (sh) return { fit: "short", failing: sh, compat: compat(sh, me), unreacted: x, why: tr(`${vx.name} wird nicht eingebaut. Mit ${vinyl(sh).name}: `, `${vx.name} is not incorporated. With ${lc(vinyl(sh).name)}: `) + compat(sh, me).why };
    return { fit: cx.fit, failing: x, compat: cx, why: cx.why };
  }
  const g = good[0], vg = vinyl(g), cg = compat(g, me);
  const early = !seq || x === list[0];
  if (cx.fail === "poison" && early)
    return { fit: "none", failing: x, compat: cx, why: cx.why + tr(` So wird auch ${vg.name} nicht eingebaut.`, ` So ${lc(vg.name)} is not incorporated either.`) };
  const product = homoProduct(g, me), P = product.abbr;
  const live = cg.living ? tr("lebende ", "living ") : "";
  const why = cx.fail === "poison"
    ? tr(`Erst wächst ${P}. Dann kommt ${vx.name} dazu: ${cx.why} ${vx.name} wird nicht eingebaut – es bleibt bei ${P}.`,
      `First ${P} grows. Then ${lc(vx.name)} is added: ${cx.why} The ${lc(vx.name)} is not incorporated – it stays ${P}.`)
    : cx.fail === "side"
      ? seq
        ? tr(`Erst wachsen ${live}${P}-Ketten. Dann reagiert ${vx.name} in einer Nebenreaktion mit den Kettenenden: Die Ketten enden, ${vx.name} wird nicht eingebaut. Es bleibt bei ${P}.`,
          `First ${live}${P} chains grow. Then ${lc(vx.name)} reacts with the chain ends in a side reaction: the chains stop, the ${lc(vx.name)} is not incorporated. It stays ${P}.`)
        : tr(`${vx.name} wird nicht eingebaut: Es reagiert in einer Nebenreaktion mit dem Starter und den Kettenenden. Diese Ketten enden früh – es entsteht ${P} mit kürzeren Ketten.`,
          `${vx.name} is not incorporated: it reacts with the initiator and the chain ends in a side reaction. These chains stop early – ${P} with shorter chains forms.`)
      : tr(`${vx.name} passt nicht zum Verfahren. ${cx.why} Es entsteht nur ${P}.`, `${vx.name} does not suit this method. ${cx.why} Only ${P} forms.`);
  return { fit: "ok", compat: cg, unreacted: x, product, why };
}

/**
 * Polymerisation mit einem oder zwei Monomeren. `seq`: zwei Monomere nacheinander zugeben (Blöcke nur bei lebenden Ketten, deren Ende das zweite Monomer startet).
 */
export function polymerise(ms: VinylId[], me: MethodId, seq = false): PolyOutcome {
  const list = [...new Set(ms)];
  if (list.some(m => compat(m, me).fit === "none")) return withFailing(list, me, seq);
  const short = list.filter(m => compat(m, me).fit === "short");
  if (short.length === list.length) { const c0 = compat(short[0], me); return { fit: c0.fit, failing: short[0], compat: c0, why: c0.why }; }
  if (short.length) {
    // ein Monomer bildet nur kurze Ketten (Allyl-H, H⁺-Abgabe): wird wenig eingebaut und bremst – vor allem das Homopolymer des anderen
    const sh = short[0], g = list.find(m => m !== sh)!, vs = vinyl(sh), product = homoProduct(g, me), P = product.abbr;
    const cs = compat(sh, me);
    const reason = cs.fail === "allyl"
      ? tr("Oft reißt das Radikal ein H‑Atom von seiner CH₃-Gruppe ab, und die Kette wächst kaum weiter.", "The radical often pulls an H atom off its CH₃ group, and the chain hardly grows on.")
      : vs.diene ? tr("Nebenreaktionen am Butadien verknüpfen und verkürzen die Ketten.", "Side reactions at the butadiene link and shorten the chains.")
        : tr(`An einem ${vs.name}-Ende geht schnell ein H⁺ ab – die Kette endet.`, `A ${lc(vs.name)} chain end quickly gives off an H⁺ – the chain stops.`);
    return {
      fit: "ok", compat: compat(g, me), product,
      why: tr(`${vs.name} wird nur wenig eingebaut und bremst: ${reason} Es entsteht vor allem ${P} mit kürzeren Ketten.`, `${vs.name} is incorporated only a little and slows things down: ${reason} Mostly ${P} with shorter chains forms.`),
    };
  }
  const c = compat(list[0], me);
  if (list.length === 1) return { fit: "ok", compat: c, product: homoProduct(list[0], me), why: c.why };
  const [a, b] = list;
  const kind0 = method(me).kind;
  const known = COPOS.find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  const va = vinyl(a), vb = vinyl(b);
  if (seq && seqKind(a, b, me) === "first") {
    return {
      fit: "ok", compat: c, unreacted: b, product: homoProduct(a, me),
      why: c.living
        ? tr(`Das Kettenende aus ${va.name} ist zu schwach, um ${vb.name} zu starten. ${vb.name} bleibt übrig – es entsteht nur ${va.abbr}.`,
          `The chain end made of ${lc(va.name)} is too weak to start ${lc(vb.name)}. The ${lc(vb.name)} is left over – only ${va.abbr} forms.`)
        : tr(`Die ${va.abbr}-Ketten enden durch Nebenreaktionen, und das Butyllithium ist verbraucht. ${vb.name} bleibt übrig – es entsteht nur ${va.abbr}.`,
          `The ${va.abbr} chains stop through side reactions, and the butyllithium is used up. The ${lc(vb.name)} is left over – only ${va.abbr} forms.`),
    };
  }
  if (seq && seqKind(a, b, me) === "separate") {
    const both = [va, vb].every(v => v.klasse === "thermo");
    return {
      fit: "ok", compat: c, separate: true, why: SEP_WHY(kind0, vb.name),
      product: {
        name: tr(`Gemisch aus ${va.abbr} und ${vb.abbr}`, `Mixture of ${va.abbr} and ${vb.abbr}`), abbr: `${va.abbr} + ${vb.abbr}`, klasse: both ? "thermo" : "elast",
        struktur: "linear", uses: "–", mix: true,
        note: tr(`Ist vom ${va.name} noch etwas übrig, bauen die neuen Ketten es mit ein: Sie enthalten dann beide Monomere in zufälliger Folge.`,
          `If some ${lc(va.name)} is left, the new chains take it up too: they then contain both monomers in random order.`),
      },
    };
  }
  if (!seq && kind0 === "anion" && !(anionStarts(a, b) && anionStarts(b, a))) {
    // gleichzeitig, aber verschieden starke Kettenenden: das Monomer mit dem schwächeren Ende lagert sich viel schneller an und setzt sich durch
    const [dom, oth] = anionStarts(a, b) ? [b, a] : [a, b];
    const vd = vinyl(dom), vo = vinyl(oth);
    return {
      fit: "ok", compat: compat(dom, me), unreacted: oth, product: homoProduct(dom, me),
      why: tr(`${vd.name} lagert sich viel schneller an. Sein Kettenende startet ${vo.name} nicht: Es entsteht fast nur ${vd.abbr}.`,
        `${vd.name} adds much faster. Its chain end does not start ${lc(vo.name)}: almost only ${vd.abbr} forms.`),
    };
  }
  if (!seq && kind0 === "anion") {
    // gleich starke Kettenenden (Styrol + Butadien): Butadien lagert sich viel schneller an – erst fast nur Butadien, zum Schluss Styrol
    const [vf, vs] = anionFirst(a, b) === a ? [va, vb] : [vb, va];
    return {
      fit: "ok", compat: c,
      why: tr(`${vf.name} lagert sich viel schneller an als ${vs.name}. Die Ketten wachsen erst fast nur mit ${vf.name}, zum Schluss mit ${vs.name}: ein Gradienten-Copolymer – beinahe ein Blockcopolymer. Statistisch gemischte Ketten entstehen anionisch nur mit einem polaren Zusatz.`,
        `${vf.name} adds much faster than ${lc(vs.name)}. The chains first grow almost only with ${lc(vf.name)}, at the end with ${lc(vs.name)}: a gradient copolymer – almost a block copolymer. Randomly mixed chains only form anionically with a polar additive.`),
      product: { name: tr(`Gradienten-Copolymer aus ${vf.name} und ${vs.name}`, `Gradient copolymer of ${lc(vf.name)} and ${lc(vs.name)}`), abbr: `${vf.letter}/${vs.letter}`, ...copoClass(a, b), struktur: "linear", uses: "–", copo: "gradient" },
    };
  }
  const kind = seq ? "block" : "stat";
  const named = kind === "block" ? known?.block : known?.stat;
  const cls = named ? { klasse: named.klasse, ...(named.rubber ? { rubber: named.rubber } : {}) } : copoClass(a, b);
  const KIND = tr({ stat: "statistisches Copolymer", block: "Blockcopolymer" }, { stat: "random copolymer", block: "block copolymer" });
  return {
    fit: "ok", compat: c,
    why: kind === "block"
      ? tr("Die Ketten leben weiter: Erst wächst ein Block aus dem ersten Monomer, dann ein Block aus dem zweiten.", "The chains stay alive: first a block of the first monomer grows, then a block of the second.")
        + (compat(b, me).living ? "" : tr(` Die Ketten aus ${vb.name} enden danach durch Nebenreaktionen.`, ` The ${lc(vb.name)} chains then stop through side reactions.`))
      : tr("Beide Monomere lagern sich an dasselbe Kettenende an – in zufälliger Reihenfolge.", "Both monomers add to the same chain end – in random order."),
    product: named
      ? { name: withAbbr(named.p[1], named.p[0]), abbr: named.p[0], ...cls, struktur: "linear", uses: named.p[2], copo: kind }
      : { name: tr(`${capFirst(KIND[kind])} aus ${va.name} und ${vb.name}`, `${capFirst(KIND[kind])} of ${lc(va.name)} and ${lc(vb.name)}`), abbr: `${va.letter}/${vb.letter}`, ...cls, struktur: "linear", uses: "–", copo: kind },
  };
}

// ── Stufenwachstum: Gruppe × Gruppe ──────────────────────────────────────────

export type Link = "ester" | "amid" | "urethan" | "harnstoff" | "aminoalkohol" | "methylen";
export type Byp = "H2O" | "HCl" | null;

export const LINK_NAME: Record<Link, string> = tr(
  { ester: "Esterbindung", amid: "Amidbindung (wie die Peptidbindung in Proteinen)", urethan: "Urethangruppe", harnstoff: "Harnstoffgruppe", aminoalkohol: "Aminoalkohol-Brücke", methylen: "CH₂-Brücke" },
  { ester: "ester bond", amid: "amide bond (like the peptide bond in proteins)", urethan: "urethane group", harnstoff: "urea group", aminoalkohol: "amino alcohol bridge", methylen: "CH₂ bridge" },
);
/** kurzer Name für die Statuszeile */
export const LINK_SHORT: Record<Link, string> = tr(
  { ester: "Esterbindung", amid: "Amidbindung", urethan: "Urethangruppe", harnstoff: "Harnstoffgruppe", aminoalkohol: "Epoxidring geöffnet", methylen: "CH₂-Brücke" },
  { ester: "ester bond", amid: "amide bond", urethan: "urethane group", harnstoff: "urea group", aminoalkohol: "epoxide ring opened", methylen: "CH₂ bridge" },
);
export const LINK_FORMULA: Record<Link, string> = { ester: "–CO–⁠O–⁠", amid: "–CO–⁠NH–⁠", urethan: "–NH–⁠CO–⁠O–⁠", harnstoff: "–NH–⁠CO–⁠NH–⁠", aminoalkohol: "–CH(OH)–CH₂–NH–", methylen: "–CH₂–" };
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
  /** lange Ketten (linear), verzweigt, Netz (vernetzt), nur kleine Moleküle (Kettenstopper) oder keine Reaktion */
  struktur: Struktur | "none";
  art?: Art;
  link?: Link;
  byp?: Byp;
  /** reagierende Gruppen (Monomer a, Monomer b) */
  groups?: [FG, FG];
  /** alle Verknüpfungen und Nebenprodukte (Monomer mit zwei verschiedenen Gruppen: auch die mit sich selbst) */
  links?: Link[];
  byps?: ("H2O" | "HCl")[];
  product?: Product;
  /** Partner, der nicht reagiert (das Monomer mit zwei verschiedenen Gruppen reagiert dann nur mit sich selbst) */
  unreacted?: StepId;
  why: string;
}

/** Funktionalität gegenüber dem Partner: nur Gruppen, die mit der Gruppe des Partners reagieren;
 *  eine NH₂-Gruppe reagiert mit zwei Epoxidgruppen (zwei N–H) */
export function functionality(id: StepId, partner: FG | null): number {
  const g = stepMono(id).groups;
  if (!partner) return g.length;
  return g.reduce((s, x) => s + (!reactGroups(x, partner) ? 0 : x === "NH2" && partner === "EPOX" ? 2 : 1), 0);
}

/** Monomer mit zwei verschiedenen Gruppen, die miteinander reagieren (Milchsäure, 6-Aminohexansäure): reagiert mit sich selbst */
export const isAB = (id: StepId) => { const g = stepMono(id).groups; return g.length === 2 && g[0] !== g[1] && !!reactGroups(g[0], g[1]); };

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
    note: tr("technisch aus dem Säurechlorid hergestellt", "made industrially from the acyl chloride") },
  { a: "terephthalsaeure", b: "hexandiamin", p: tr(["PA 6T", "Polyamid 6T", "hitzefeste Bauteile im Motorraum"], ["PA 6T", "Polyamide 6T", "heat-resistant parts in the engine compartment"]) },
  { a: "terephthaloylchlorid", b: "hexandiamin", p: tr(["PA 6T", "Polyamid 6T", "hitzefeste Bauteile im Motorraum"], ["PA 6T", "Polyamide 6T", "heat-resistant parts in the engine compartment"]) },
  { a: "milchsaeure", code: "7", p: tr(["PLA", "Polymilchsäure (Polylactid)", "industriell kompostierbare Becher und Folien, 3D-Druck"], ["PLA", "Poly(lactic acid) (polylactide)", "industrially compostable cups and films, 3D printing"]),
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

/** „sternförmig verzweigt“ in der Form passend zum Geschlecht des Namens (der Polyester, das Polyamid) */
const STAR_ADJ: Record<string, string> = { Polyester: "Sternförmig verzweigter", Polyharnstoff: "Sternförmig verzweigter" };

/** Art des Polymers nach seinen Verknüpfungen */
const kindOf = (ls: Link[]) => (ls.includes("ester") && ls.includes("amid") ? tr("Polyesteramid", "Poly(ester amide)")
  : ls[0] === "ester" ? tr("Polyester", "Polyester") : ls[0] === "amid" ? tr("Polyamid", "Polyamide") : ls[0] === "urethan" ? tr("Polyurethan", "Polyurethane") : ls[0] === "harnstoff" ? tr("Polyharnstoff", "Polyurea") : tr("Polymer", "Polymer"));
const fgText = (gs: FG[]) => [...new Set(gs)].map(g => (g === "ArH" ? tr("H am Ring", "H on the ring") : g === "CHO" ? "C=O" : FG_FORMULA[g])).join(tr(" und ", " and "));

/** warum zwei Monomere keine Kette bilden (keine passenden Gruppen im Modell) – ehrlich, wo es in Wirklichkeit doch eine Reaktion gibt */
function noLink(A: StepMono, B: StepMono): string {
  const has = (m: StepMono, g: FG) => m.groups.includes(g);
  const pair = (id: StepId) => (A.id === id ? [A, B] : B.id === id ? [B, A] : null);
  const ph = pair("phenol"), me = pair("methanal");
  if (ph) return has(ph[1], "COCl")
    ? tr(`Phenol reagiert mit ${ph[1].name} nur über seine eine –OH-Gruppe: Es entsteht ein kleiner Ester, keine Kette.`, `Phenol reacts with ${lc(ph[1].name)} only through its single –OH group: a small ester forms, no chain.`)
    : tr(`Phenol bildet mit ${ph[1].name} keine Kette: Die H‑Atome am Ring reagieren nur mit Methanal.`, `Phenol forms no chain with ${lc(ph[1].name)}: the H atoms on the ring react only with methanal.`);
  if (me) return has(me[1], "NH2")
    ? tr("Methanal reagiert auch mit Aminogruppen: So entstehen Harnstoff- und Melaminharze (Aminoplaste). Dieses Modell zeigt Methanal nur mit Phenol.", "Methanal also reacts with amino groups: this is how urea and melamine resins (aminoplastics) form. This model only shows methanal with phenol.")
    : tr(`Methanal bildet mit ${me[1].name} keine Kette. In diesem Modell verbrückt Methanal nur Phenol-Ringe.`, `Methanal forms no chain with ${lc(me[1].name)}. In this model methanal only bridges phenol rings.`);
  if ((has(A, "EPOX") && has(B, "OH")) || (has(B, "EPOX") && has(A, "OH")))
    return tr("Epoxidgruppen reagieren mit Hydroxygruppen nur mit Katalysator und Hitze – hier entsteht keine Kette.", "Epoxide groups only react with hydroxy groups with a catalyst and heat – no chain forms here.");
  if ((has(A, "EPOX") && has(B, "NCO")) || (has(B, "EPOX") && has(A, "NCO")))
    return tr("Epoxid- und Isocyanatgruppen reagieren nur mit Katalysator – hier entsteht keine Kette.", "Epoxide and isocyanate groups only react with a catalyst – no chain forms here.");
  const ga = [...new Set(A.groups)], gb = [...new Set(B.groups)];
  if (ga.length === 1 && gb.length === 1 && ga[0] === gb[0])
    return tr(`${A.name} und ${B.name} tragen nur ${FG_FORMULA[ga[0]]}-Gruppen. Gleiche Gruppen reagieren nicht miteinander.`, `${A.name} and ${lc(B.name)} only carry ${FG_FORMULA[ga[0]]} groups. Identical groups do not react with each other.`);
  return tr(`${A.name} (${fgText(A.groups)}) und ${B.name} (${fgText(B.groups)}): Diese Gruppen verknüpfen sich in diesem Modell nicht.`, `${A.name} (${fgText(A.groups)}) and ${lc(B.name)} (${fgText(B.groups)}): these groups do not link up in this model.`);
}

/** Stufenwachstum aus einem Monomer (AB-Monomer) oder zwei Monomeren */
export function stepReact(a: StepId, b?: StepId): StepOutcome {
  const A = stepMono(a), B = b ? stepMono(b) : undefined;
  const NONE = (why: string): StepOutcome => ({ struktur: "none", why });
  if (!B || a === b) {
    // ein Monomer allein: nur AB-Monomere reagieren mit sich selbst
    if (a === "methanal") return NONE(tr("Methanal allein bildet hier keine Kette. Über seine C=O kann es zwar zu Polyoxymethylen (POM) polymerisieren – das ist aber eine Polymerisation, keine Polykondensation.", "Methanal alone forms no chain here. It can polymerise through its C=O to polyoxymethylene (POM) – but that is a polymerisation, not a polycondensation."));
    if (a === "phenol") return NONE(tr("Phenol allein bildet keine Kette: Erst Methanal verbrückt die Ringe.", "Phenol alone forms no chain: only methanal bridges the rings."));
    const [x, y] = A.groups;
    const r = isAB(a) ? reactGroups(x, y) : null;
    if (!r) return NONE(A.groups.some(g => g === "NCO" || g === "EPOX")
      ? tr(`${A.name} allein bildet ohne Katalysator keine Kette: Gleiche Gruppen reagieren nicht miteinander.`, `${A.name} alone forms no chain without a catalyst: identical groups do not react with each other.`)
      : tr(`${A.name} allein reagiert nicht: Gleiche Gruppen verbinden sich nicht miteinander.`, `${A.name} alone does not react: identical groups do not join each other.`));
    const p = STEP_PRODUCTS.find(s => s.a === a && !s.b);
    return {
      struktur: "linear", art: r.art, link: r.link, byp: r.byp, groups: [x, y], links: [r.link], byps: r.byp ? [r.byp] : [],
      why: tr(`${A.name} trägt zwei verschiedene Gruppen. Das eine Ende reagiert mit dem anderen Ende des nächsten Moleküls.`, `${A.name} carries two different groups. One end reacts with the other end of the next molecule.`),
      product: p && { name: withAbbr(p.p[1], p.p[0]), abbr: p.p[0], klasse: p.klasse ?? "thermo", struktur: "linear", uses: p.p[2], code: p.code, note: p.note },
    };
  }
  // passende Gruppen suchen (Monomer a mit Monomer b)
  let pair: { x: FG; y: FG; r: Pair } | undefined;
  for (const x of A.groups) for (const y of B.groups) { const r = reactGroups(x, y); if (r && !pair) pair = { x, y, r }; }
  const abA = isAB(a), abB = isAB(b!);
  if (!pair) {
    const self = abA ? A : abB ? B : null;
    if (!self) return NONE(noLink(A, B));
    // das Monomer mit zwei verschiedenen Gruppen reagiert trotzdem mit sich selbst: dessen Polymer entsteht (wie im Reaktor)
    const solo = stepReact(self.id), other = self === A ? B : A;
    const P = solo.product?.abbr ?? self.name;
    return { ...solo, unreacted: other.id, why: noLink(A, B) + tr(` ${self.name} reagiert nur mit sich selbst: Es entsteht ${P}.`, ` ${self.name} only reacts with itself: ${P} forms.`) };
  }
  const base = { art: pair.r.art, link: pair.r.link, byp: pair.r.byp, groups: [pair.x, pair.y] as [FG, FG] };
  // alle Verknüpfungen: mit dem Partner und – bei Monomeren mit zwei verschiedenen Gruppen – mit sich selbst
  const all: Pair[] = [];
  for (const x of A.groups) for (const y of B.groups) { const r = reactGroups(x, y); if (r) all.push(r); }
  for (const m of [a, b!]) if (isAB(m)) all.push(reactGroups(stepMono(m).groups[0], stepMono(m).groups[1])!);
  const links = [...new Set(all.map(r => r.link))], byps = [...new Set(all.flatMap(r => (r.byp ? [r.byp] : [])))];
  const more = { links, byps };
  const named = (struktur: Struktur, why: string, klasse: Klasse = "thermo"): StepOutcome => ({
    ...base, ...more, struktur, why,
    product: { name: tr(`${kindOf(links)} aus ${A.name} und ${B.name}`, `${kindOf(links)} of ${lc(A.name)} and ${lc(B.name)}`), abbr: kindOf(links), klasse, struktur, uses: "–" },
  });
  if (abA && abB) {
    // beide reagieren mit sich selbst und miteinander: lineare Ketten, Bausteine in zufälliger Folge
    return named("linear", tr(`${A.name} und ${B.name} tragen je zwei verschiedene Gruppen. Jedes reagiert mit sich selbst und mit dem anderen: lineare Ketten, die Bausteine folgen zufällig aufeinander.`,
      `${A.name} and ${lc(B.name)} each carry two different groups. Each reacts with itself and with the other: linear chains, the units follow in random order.`));
  }
  if (abA || abB) {
    // ein Monomer reagiert mit sich selbst (AB), der Partner nur mit einer seiner beiden Gruppen
    const ab = abA ? A : B, p = abA ? B : A, gAb = abA ? pair.x : pair.y;
    const fp = functionality(p.id, gAb), other = FG_FORMULA[ab.groups.find(g => g !== gAb)!];
    if (fp < 2) return { ...base, ...more, struktur: "klein",
      why: tr(`${p.name} hat nur eine passende Gruppe. Sie blockiert das ${FG_FORMULA[gAb]}-Ende der ${ab.name}-Ketten: Mit viel ${p.name} entstehen nur kleine Moleküle.`,
        `${p.name} has only one matching group. It blocks the ${FG_FORMULA[gAb]} end of the ${lc(ab.name)} chains: with a lot of ${lc(p.name)} only small molecules form.`) };
    if (fp < 3) return named("linear", tr(`${ab.name} reagiert auch mit sich selbst. ${p.name} verbindet zwei ${ab.name}-Ketten an ihren ${FG_FORMULA[gAb]}-Enden: lineare Ketten, die Bausteine wechseln sich nicht ab. Je mehr ${p.name}, desto kürzer die Ketten.`,
      `${ab.name} also reacts with itself. ${p.name} joins two ${lc(ab.name)} chains at their ${FG_FORMULA[gAb]} ends: linear chains, the units do not alternate. The more ${lc(p.name)}, the shorter the chains.`));
    // Monomer mit drei Gruppen + AB-Monomer: sternförmige Moleküle (Arme enden mit der anderen Gruppe des AB-Monomers) – kein Netz, schmelzbar
    const n = tr(["", "eine", "zwei", "drei"], ["", "one", "two", "three"])[fp] ?? String(fp);
    const star = named("verzweigt", tr(`${ab.name} reagiert auch mit sich selbst. ${p.name} bindet bis zu ${n} ${ab.name}-Ketten an ihren ${FG_FORMULA[gAb]}-Enden: sternförmige Moleküle – ${p.name} in der Mitte, bis zu ${n} Arme. Ein Netz entsteht nicht: Jeder Arm endet mit einer ${other}-Gruppe, und die reagiert weder mit einem anderen Arm noch mit ${p.name}. Zwei Sterne verbinden sich nie.`,
      `${ab.name} also reacts with itself. ${p.name} binds up to ${n} ${lc(ab.name)} chains at their ${FG_FORMULA[gAb]} ends: star-shaped molecules – ${lc(p.name)} in the middle, up to ${n} arms. No network forms: every arm ends with an ${other} group, and it reacts neither with another arm nor with ${lc(p.name)}. Two stars never join.`));
    const kind = kindOf(links);
    star.product = {
      ...star.product!, star: true,
      name: tr(`${STAR_ADJ[kind] ?? "Sternförmig verzweigtes"} ${kind} aus ${A.name} und ${B.name}`, `Star-branched ${lc(kind)} of ${lc(A.name)} and ${lc(B.name)}`),
      note: tr("Schmelzbar wie ein Thermoplast – kein Duroplast, denn die Sterne bilden kein Netz.", "Meltable like a thermoplastic – not a thermoset, because the stars form no network."),
    };
    return star;
  }
  const fa = functionality(a, pair.y), fb = functionality(b!, pair.x);
  if (fa < 2 || fb < 2) {
    const mono = fa < 2 ? A : B;
    return {
      ...base, ...more, struktur: "klein",
      why: tr(`${mono.name} hat nur eine reaktive Gruppe. Nach der ersten Verknüpfung ist das Ende blockiert – es entsteht kein Polymer.`, `${mono.name} has only one reactive group. After the first link the end is blocked – no polymer forms.`),
    };
  }
  const net = fa >= 3 || fb >= 3;
  const known = STEP_PRODUCTS.find(s => (s.a === a && s.b === b) || (s.a === b && s.b === a));
  const linkName = LINK_NAME[pair.r.link];
  let product: Product;
  if (known) product = { name: withAbbr(known.p[1], known.p[0]), abbr: known.p[0], klasse: known.klasse ?? (net ? "duro" : "thermo"), struktur: net ? "vernetzt" : "linear", uses: known.p[2], code: known.code, note: known.note };
  else if (net && pair.r.link === "ester") product = { name: withAbbr(NET_ESTER[1], NET_ESTER[0]), abbr: NET_ESTER[0], klasse: "duro", struktur: "vernetzt", uses: NET_ESTER[2] };
  else return named(net ? "vernetzt" : "linear", net
    ? tr(`Ein Monomer hat drei oder mehr reaktive Stellen. Die Ketten verknüpfen sich zu einem Netz: ${linkName}.`, `One monomer has three or more reactive sites. The chains link up into a network: ${linkName}.`)
    : tr(`Jedes Monomer hat zwei reaktive Gruppen. Sie verknüpfen sich abwechselnd zu langen Ketten: ${linkName}.`, `Each monomer has two reactive groups. They join alternately into long chains: ${linkName}.`), net ? "duro" : "thermo");
  return {
    ...base, ...more, struktur: net ? "vernetzt" : "linear", product,
    why: net
      ? tr(`Ein Monomer hat drei oder mehr reaktive Stellen. Die Ketten verknüpfen sich zu einem Netz: ${linkName}.`, `One monomer has three or more reactive sites. The chains link up into a network: ${linkName}.`)
      : tr(`Jedes Monomer hat zwei reaktive Gruppen. Sie verknüpfen sich abwechselnd zu langen Ketten: ${linkName}.`, `Each monomer has two reactive groups. They join alternately into long chains: ${linkName}.`),
  };
}

/** Name der Reaktionsart einer Verknüpfung (Polykondensation: mit Nebenprodukt, Polyaddition: ohne) */
export const artOfLink = (l: Link): Art => (l === "urethan" || l === "harnstoff" || l === "aminoalkohol" ? "add" : "kond");
export const artName = (a: Art) => ART_NAME[a];
