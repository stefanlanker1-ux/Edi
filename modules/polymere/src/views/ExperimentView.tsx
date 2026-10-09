// Experimentieren: am Anfang Polymerisation, Polykondensation oder Polyaddition wählen, dann den Ansatz bauen
// (Monomer[e], bei der Polymerisation Starter bzw. Katalysator) und die Entstehung Schritt für Schritt auslösen –
// in Atomen (Mechanismus mit Elektronen) oder als Kügelchen (Reaktor mit vielen Ketten). Eine Aktion spielt ihren Ablauf
// sofort ab – Experimentieren stellt keine Fragen.

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button, Icon, IconButton, Segmented, Sheet, Switch, Tag, buzz, tr, useMediaQuery, useReducedMotion, Workbench } from "@lern/ui";
import { ART_NAME, KIND_NAME, METHODS, STEPS, VINYLS, isVinyl, lc, method, monoHue, monoLetter, monoName, monoStruct, stepMono, vinyl, type Art, type MethodId, type Rubber, type StepId, type VinylId } from "../chem/data.ts";
import { compat, methodsFor, polymerise, productUnits, stepReact, LINK_NAME, BYP_NAME, type Product } from "../chem/rules.ts";
import { makeMech, nextAuto, replay, type Mech, type Recipe } from "../chem/mech/index.ts";
import type { Clip } from "../chem/scene.ts";
import type { Action, Bead } from "../chem/mech/types.ts";
import { MechStage } from "../components/MechStage.tsx";
import { BeadDot, BeadStrip } from "../components/Beads.tsx";
import { MonomerSvg, UnitSvg } from "../components/Formula.tsx";
import { ReactorView } from "../components/Reactor.tsx";
import { PARTICLE, Reactor, type RBead, type RStats } from "../chem/reactor.ts";
import { DEFAULT_RECIPES, useApp } from "../store.ts";

const ARTS: Art[] = ["poly", "kond", "add"];
/** Vorschlag nach einem Fehlschlag: mit diesem Verfahren klappt es */
const KIND_TRY = tr({ radikal: "Radikalisch", anion: "Anionisch", kation: "Kationisch", koord: "Ziegler-Natta" },
  { radikal: "Radical", anion: "Anionic", kation: "Cationic", koord: "Ziegler–Natta" });
const ART_SHORT: Record<Art, string> = tr({ poly: "Polymeri­sation", kond: "Polykonden­sation", add: "Poly­addition" }, { poly: "Polymeri­sation", kond: "Polycon­densation", add: "Poly­addition" });
const ART_TAG: Record<Art, string> = tr({ poly: "C=C wird zur Kette", kond: "Nebenprodukt H₂O bzw.\u00A0HCl", add: "ohne Nebenprodukt" }, { poly: "C=C becomes a chain", kond: "by-product H₂O or\u00A0HCl", add: "no by-product" });

// ── Kleine Bilder für die Auswahl am Anfang ──
function ArtPic({ art }: { art: Art }) {
  const b = (x: number, y: number, h: string, k: number) => <circle key={k} className={`pm-pic-b hue-${h}`} cx={x} cy={y} r={7} />;
  return (
    <svg className="pm-artpic" viewBox="0 0 120 54" aria-hidden="true">
      {art === "poly" && <>
        {[0, 1, 2].map(i => <g key={i}>{b(8 + i * 16, 14, "violet", i)}<path className="pm-pic-dbl" d={`M${4 + i * 16} 24h8M${4 + i * 16} 27h8`} /></g>)}
        <path className="pm-pic-arrow" d="M52 20h12M60 16l4 4-4 4" />
        <path className="pm-pic-l" d="M76 20h36" />
        {[0, 1, 2, 3].map(i => b(76 + i * 12, 20, "violet", 10 + i))}
      </>}
      {art !== "poly" && <>
        {b(10, 20, "red", 1)}{b(30, 20, "teal", 2)}
        <path className="pm-pic-arrow" d="M44 20h12M52 16l4 4-4 4" />
        <path className="pm-pic-l" d="M68 20h42" />
        {[0, 1, 2, 3].map(i => b(68 + i * 14, 20, i % 2 ? "teal" : "red", 10 + i))}
        {art === "kond" && <text className="pm-pic-t" x="118" y="44" textAnchor="end">+ H₂O</text>}
      </>}
    </svg>
  );
}

function Chooser({ onPick }: { onPick: (a: Art) => void }) {
  return (
    <div className="pm-choose">
      <p className="pm-choose-h">{tr("Art der Reaktion wählen", "Choose the type of reaction")}</p>
      {ARTS.map(a => (
        <button key={a} type="button" className="pm-choose-card" onClick={() => { buzz(); onPick(a); }}>
          <ArtPic art={a} />
          <b>{ART_NAME[a]}</b>
          <span>{ART_TAG[a]}</span>
        </button>
      ))}
    </div>
  );
}

// ── Auswahl-Blätter ──
/** Halbstrukturformel; {…} = reagierender Teil, hinterlegt in der Farbe des Monomers */
export function Struct({ text, hue }: { text: string; hue: string }) {
  const parts = text.split(/(\{[^}]*\})/).filter(Boolean);
  return <span className={`pm-struct hue-${hue}`}>{parts.map((t, i) => (t.startsWith("{") ? <b key={i}>{t.slice(1, -1)}</b> : <span key={i}>{t}</span>))}</span>;
}

function BeadIcon({ id, size = 18 }: { id: string; size?: number }) {
  return <svg viewBox="-10 -10 20 20" className="pm-bead-ic" style={{ width: size, height: size }} aria-hidden="true"><BeadDot cx={0} cy={0} r={9} hue={monoHue(id)} letter={monoLetter(id)} /></svg>;
}

/** lange zusammengesetzte Namen an den Wortfugen trennbar machen (weiches Trennzeichen) */
const hyph = (name: string) => name.replace(/([a-zäöü]{3})(säure|dichlorid|chlorid|diamin|diisocyanat|diglycidylether|methacrylat|nitril|acetat|diol)/g, "$1\u00AD$2");

/** `fits`: passender Partner (nach dem Vorschlag „Partner …“ gestrichelt umrandet mit ✓ „passt“; andere bleiben wählbar) */
function MonoCard({ id, active, onClick, fits }: { id: string; active: boolean; onClick: () => void; fits?: boolean }) {
  return (
    <button type="button" className={`pm-mono${active ? " on" : ""}${fits ? " fits" : ""}`} aria-pressed={active} onClick={onClick}>
      <span className="pm-mono-name"><BeadIcon id={id} /><span>{hyph(monoName(id))}</span></span>
      <Struct text={monoStruct(id)} hue={monoHue(id)} />
      {fits && <span className="pm-fits">✓ {tr("passt", "matches")}</span>}
    </button>
  );
}

function MethodCard({ id, active, onClick }: { id: MethodId; active: boolean; onClick: () => void }) {
  const m = method(id);
  return (
    <button type="button" className={`pm-meth${active ? " on" : ""}`} aria-pressed={active} onClick={onClick}>
      <b>{m.name}</b>
      <span className="pm-meth-f">{m.formula}</span>
      <span className="pm-meth-k">{KIND_NAME[m.kind]} · {m.role === "kat" ? tr("Katalysator", "catalyst") : tr("Initiator", "initiator")}</span>
    </button>
  );
}

/** Kautschuk (noch unvernetzt): Kennzeichen und ein Satz, wie daraus ein Elastomer wird – Schwefel vernetzt nur Ketten mit C=C */
const RUBBER = (): Record<Rubber, { tags: string[]; text: string }> => tr({
  dien: { tags: ["Kautschuk", "Elastomer nach dem Vulkanisieren"], text: "Kautschuk wird durch Vulkanisieren zum Elastomer: Schwefelbrücken verbinden die Ketten an ihren C=C." },
  peroxid: { tags: ["Kautschuk", "Elastomer nach dem Vernetzen"], text: "Ohne C=C in der Kette vernetzt Schwefel nicht. Peroxide verbinden die Ketten – so wird daraus ein Elastomer." },
  nein: { tags: ["Kautschuk", "nicht vernetzbar"], text: "Ohne C=C in der Kette vernetzen weder Schwefel noch Peroxide: Der Kautschuk bleibt weich und klebrig." },
  butyl: { tags: ["Kautschuk", "Elastomer nach dem Vulkanisieren"], text: "Die wenigen Dien-Bausteine bringen C=C in die Kette – genug zum Vulkanisieren mit Schwefel. So funktioniert Butylkautschuk (Isobuten mit wenig Isopren)." },
  zweiblock: { tags: ["Blockcopolymer (zwei Blöcke)"], text: "Ein thermoplastisches Elastomer wird daraus erst mit drei Blöcken (SBS: Styrol → Butadien → Styrol): Die harten Styrol-Blöcke an beiden Enden halten die weichen Butadien-Blöcke zusammen – ohne Vulkanisieren. Mit zwei Blöcken fehlt dieser Halt." },
}, {
  dien: { tags: ["rubber", "elastomer after vulcanisation"], text: "Raw rubber becomes an elastomer by vulcanisation: sulfur bridges link the chains at their C=C." },
  peroxid: { tags: ["rubber", "elastomer after cross-linking"], text: "Without C=C in the chain, sulfur does not cross-link. Peroxides link the chains – this makes an elastomer." },
  nein: { tags: ["rubber", "cannot be cross-linked"], text: "Without C=C in the chain, neither sulfur nor peroxides cross-link it: the rubber stays soft and sticky." },
  butyl: { tags: ["rubber", "elastomer after vulcanisation"], text: "The few diene units bring C=C into the chain – enough for vulcanisation with sulfur. This is how butyl rubber works (isobutene with a little isoprene)." },
  zweiblock: { tags: ["block copolymer (two blocks)"], text: "It only becomes a thermoplastic elastomer with three blocks (SBS: styrene → butadiene → styrene): the hard styrene blocks at both ends hold the soft butadiene blocks together – without vulcanisation. With two blocks this hold is missing." },
});

/** Kennzeichen einheitlich mit großem Anfangsbuchstaben (auch auf Englisch: „Living“, „Long, unbranched chains“) */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function ProductCard({ recipe, mech }: { recipe: Recipe; mech: Mech }) {
  const st = mech.status();
  let product: Product | undefined, why = "", extra: ReactNode = null, pics: VinylId[] = [], short = false;
  if (recipe.art === "poly") {
    const ms = [recipe.a, recipe.b].filter(m => m && isVinyl(m)) as VinylId[];
    const out = polymerise(ms, recipe.method ?? "dbpo", !!recipe.seq);
    product = out.product; why = out.why; short = out.fit === "short";
    pics = productUnits(ms, out);
  } else {
    const out = stepReact(recipe.a as StepId, recipe.b as StepId | undefined);
    product = out.product; why = out.why;
    // Monomer mit zwei verschiedenen Gruppen und Partner: Verknüpfungen mit sich selbst und mit dem Partner
    const and = tr(" und ", " and "), byps = out.byps ?? (out.byp ? [out.byp] : []);
    if (out.link) extra = <dl className="pm-facts"><div><dt>{tr("Verknüpfung", "Link")}</dt><dd>{(out.links ?? [out.link]).map(l => LINK_NAME[l]).join(and)}</dd></div>
      <div><dt>{tr("Nebenprodukt", "By-product")}</dt><dd>{byps.length ? byps.map(b => BYP_NAME[b]).join(and) : tr("keines", "none")}</dd></div></dl>;
  }
  const KL = tr({ thermo: "Thermoplast", elast: "Elastomer", duro: "Duroplast" }, { thermo: "Thermoplastic", elast: "Elastomer", duro: "Thermoset" });
  // unvernetzter Kautschuk: wie er zum Elastomer wird (Vulkanisieren nur mit C=C in der Kette)
  const rub = product?.klasse === "elast" && product.struktur !== "vernetzt" && !product.mix ? RUBBER()[product.rubber ?? "dien"] : null;
  const ST = tr({ linear: "lange, unverzweigte Ketten", verzweigt: "verzweigte Ketten", vernetzt: "Netz aus Ketten", klein: "nur kleine Moleküle" },
    { linear: "long, unbranched chains", verzweigt: "branched chains", vernetzt: "network of chains", klein: "only small molecules" });
  return (
    <div className="pm-product">
      {product ? <h3>{product.name}</h3> : <h3>{short ? tr("Nur kurze Ketten", "Only short chains") : tr("Kein Polymer", "No polymer")}</h3>}
      {pics.length > 0 && <div className="pm-product-pic">{pics.map(m => <UnitSvg key={m} id={m} aspect={1.6} />)}</div>}
      {product && <div className="pm-tags">
        {product.mix ? <Tag>{cap(tr("zwei getrennte Polymere", "two separate polymers"))}</Tag>
          : rub ? rub.tags.map(t => <Tag key={t}>{cap(t)}</Tag>)
          : <Tag>{KL[product.klasse]}</Tag>}
        <Tag>{cap(product.star ? tr("sternförmige Moleküle", "star-shaped molecules") : ST[product.struktur])}</Tag>
        {product.code && <Tag>{tr("Recycling-Code", "Recycling code")} {product.code}</Tag>}
      </div>}
      {extra}
      <p className="pm-why">{st.fail ?? why}</p>
      {product?.uses && product.uses !== "–" && <p><b>{tr("Verwendung", "Uses")}:</b> {product.uses}</p>}
      {product?.note && <p className="pm-small">{product.note}</p>}
      {rub && <p className="pm-small">{rub.text}</p>}
    </div>
  );
}

/** Kurzinfo zu Teilchen im Reaktor (Antippen) */
const PARTICLE_INFO = () => tr<Record<string, string>>(
  {
    dbpo: "Zerfällt beim Erwärmen in zwei Radikale; dabei entweicht CO₂.", aibn: "Zerfällt beim Erwärmen in zwei Radikale; dabei entweicht N₂.",
    frag: "Radikal aus dem Starter – es sitzt danach am Anfang der Kette.", buli: "Startet eine Kette: Das Butyl-Anion lagert sich an das Monomer an.",
    bf3: "Bildet mit Wasser eine Säure; ihr H⁺ startet die Kette.", h: "H⁺ (Proton): Es lagert sich an ein Monomer an und startet eine Kette.",
    ti: "Titan mit einer freien Stelle: Dort lagert sich jedes Monomer an und wird zwischen Titan und Kette eingebaut.",
    co2: "Gas aus dem zerfallenden Starter.", n2: "Gas aus dem zerfallenden Starter.",
    h2o: "Nebenprodukt der Verknüpfung – es steigt auf und wird entfernt.", hcl: "Nebenprodukt der Verknüpfung – es steigt auf und wird entfernt.",
    meoh: "Methanol gibt ein H⁺ an das Kettenende ab – die lebende Kette endet.",
  },
  {
    dbpo: "Splits into two radicals when heated; CO₂ escapes.", aibn: "Splits into two radicals when heated; N₂ escapes.",
    frag: "Radical from the initiator – it then sits at the start of the chain.", buli: "Starts a chain: the butyl anion adds to the monomer.",
    bf3: "Forms an acid with water; its H⁺ starts the chain.", h: "H⁺ (proton): it adds to a monomer and starts a chain.",
    ti: "Titanium with a vacant site: every monomer attaches there and is inserted between titanium and chain.",
    co2: "Gas from the decomposing initiator.", n2: "Gas from the decomposing initiator.",
    h2o: "By-product of the linking – it rises and is removed.", hcl: "By-product of the linking – it rises and is removed.",
    meoh: "Methanol gives an H⁺ to the chain end – the living chain stops.",
  },
);

/** Umsatz als Balken, Zahl der Ketten bzw. Moleküle, mittlere und größte Länge */
function ReactorStats({ st, step }: { st: RStats; step: boolean }) {
  const pct = Math.round(st.conv * 100);
  const avg = st.avg >= 10 ? Math.round(st.avg) : Math.round(st.avg * 10) / 10;
  return (
    <div className="pm-rstats">
      <span className="pm-rs-l">{tr("Umsatz", "Conversion")}</span>
      <span className="pm-rs-bar" role="meter" aria-label={tr("Umsatz", "Conversion")} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></span>
      <b className="pm-rs-pct">{pct} %</b>
      <span className="pm-rs-n">{st.chains} {step ? tr("Moleküle", "molecules") : tr("Ketten", "chains")}</span>
      <span className="pm-rs-n pm-rs-len">Ø {String(avg).replace(".", tr(",", "."))} · {tr("längste", "longest")} {st.max} {tr("Bausteine", "units")}</span>
    </div>
  );
}

/** Legende der Kügelchen-Ansicht: was die Kügelchen, Ringe und Bläschen bedeuten */
function BeadLegend({ recipe }: { recipe: Recipe }) {
  const poly = recipe.art === "poly", kind = poly ? method(recipe.method ?? "dbpo").kind : null;
  const row = (pic: ReactNode, text: string) => <li><svg viewBox="-12 -12 24 24" className="pm-leg-pic" aria-hidden="true">{pic}</svg><span>{text}</span></li>;
  const m = recipe.a;
  return (
    <ul className="pm-legend">
      {([recipe.a, recipe.b].filter(Boolean) as string[]).map(x => <Fragment key={x}>{row(<BeadDot cx={0} cy={0} r={8} hue={monoHue(x)} letter={monoLetter(x)} />, tr(`ein Baustein ${monoName(x)}`, `one repeat unit of ${lc(monoName(x))}`))}</Fragment>)}
      {row(<><BeadDot cx={-5} cy={0} r={5} hue={monoHue(m)} /><BeadDot cx={5} cy={0} r={5} hue={monoHue(recipe.b ?? m)} /></>, tr("verbundene Kügelchen = Kette", "joined beads = chain"))}
      {poly && kind !== "koord" && row(<BeadDot cx={0} cy={0} r={6.5} hue="init" />, tr("Starter bzw. sein Bruchstück am Kettenanfang", "initiator or its fragment at the chain start"))}
      {kind === "koord" && row(<BeadDot cx={0} cy={0} r={6.5} hue="init" />, tr("Ethylgruppe bzw. H am Kettenanfang", "ethyl group or H at the chain start"))}
      {kind === "radikal" && row(<BeadDot cx={0} cy={0} r={6.5} hue={monoHue(m)} active="rad" />, tr("rot gestrichelt: Radikal – hier wächst die Kette", "red dashes: radical – the chain grows here"))}
      {kind === "anion" && row(<><BeadDot cx={0} cy={0} r={6.5} hue={monoHue(m)} active="an" /><text className="pm-leg-plus an" x={8} y={-8} textAnchor="middle" dominantBaseline="central">−</text></>, tr("blau gestrichelt mit −: negatives Kettenende (lebend)", "blue dashes with −: negative chain end (living)"))}
      {kind === "kation" && row(<><BeadDot cx={0} cy={0} r={6.5} hue={monoHue(m)} active="kat" /><text className="pm-leg-plus" x={8} y={-8} textAnchor="middle" dominantBaseline="central">+</text></>, tr("dunkelroter Ring mit +: positives Kettenende", "dark red ring with +: positive chain end"))}
      {kind === "koord" && row(<BeadDot cx={0} cy={0} r={9} hue="init" letter="Ti" />, tr("Titan (Katalysator): die Kette wächst hier", "titanium (catalyst): the chain grows here"))}
      {poly && (recipe.method === "dbpo" || recipe.method === "aibn") && row(<circle className="pm-leg-gas" r={4} />, tr(`Bläschen: ${recipe.method === "dbpo" ? "CO₂" : "N₂"} aus dem Starter`, `bubbles: ${recipe.method === "dbpo" ? "CO₂" : "N₂"} from the initiator`))}
      {!poly && row(<circle className="pm-leg-byp" r={4} />, tr("blaue Bläschen: abgespaltenes Wasser H₂O bzw. HCl", "blue bubbles: split-off water H₂O or HCl"))}
    </ul>
  );
}

function MonomerSheet({ id, onClose, chain }: { id: string | null; onClose: () => void; chain?: number }) {
  if (!id) return <Sheet open={false} title="" onClose={onClose}>{null}</Sheet>;
  const v = isVinyl(id) ? vinyl(id) : null, s = !v ? stepMono(id as StepId) : null;
  return (
    <Sheet open={!!id} title={monoName(id)} onClose={onClose}>
      <div className="pm-monoinfo">
        {chain !== undefined && <p className="pm-monoinfo-chain"><b>{chain > 1 ? tr(`Dieses Molekül: ${chain} Bausteine`, `This molecule: ${chain} repeat units`) : tr("Noch ein einzelnes Monomer", "Still a single monomer")}</b></p>}
        <div className="pm-monoinfo-pic"><MonomerSvg id={id} aspect={1.6} /></div>
        <p><b>{v?.alt ?? s?.alt}</b> · {(v?.formula ?? s!.formula).replace(/\d/g, d => "₀₁₂₃₄₅₆₇₈₉"[+d])}</p>
        {v && <>
          <p className="pm-small">{tr("Baustein in der Kette:", "Repeat unit in the chain:")}</p>
          <div className="pm-monoinfo-pic"><UnitSvg id={id} aspect={1.6} /></div>
          <p>{tr(`Polymer: ${v.polymer} (${v.abbr})`, `Polymer: ${v.polymer.toLowerCase()} (${v.abbr})`)}</p>
        </>}
      </div>
    </Sheet>
  );
}

// ── Ansicht ──
export function ExperimentView() {
  const { art, setArt, recipes, setRecipe, view, setView, halos, lp, setHalos, setLp} = useApp();
  const [tool, setTool] = useState<string | null>(null);
  // nach „Partner …“: passende Partner im Blatt Monomer 2 hervorheben (bis das Blatt wieder zu ist)
  const [partners, setPartners] = useState(false);
  useEffect(() => { if (tool !== "mono2") setPartners(false); }, [tool]);
  const [info, setInfo] = useState<string | null>(null);
  const [why, setWhy] = useState(false);
  /** Abbruch: Auswahl der Abbruchart offen */
  const [stopOpen, setStopOpen] = useState(false);
  const reduced = useReducedMotion();
  /** niedrige Handys: keine Ansatz-Zeile, die Werkzeugleiste zeigt die Auswahl */
  const low = useMediaQuery("(max-height: 700px)");
  // Umschalter Atome | Kügelchen liegt über der Bühne (oben rechts): seine Größe, damit die Atom-Ansicht die Ecke bei Bedarf freihält
  const viewRef = useRef<HTMLDivElement>(null);
  const [corner, setCorner] = useState<{ w: number; h: number }>({ w: 170, h: 46 });
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const upd = () => setCorner(o => { const w = Math.ceil(el.offsetWidth) + 6, h = Math.ceil(el.offsetHeight) + 6; return o.w === w && o.h === h ? o : { w, h }; });
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, [art]);
  const recipe = art ? recipes[art] : DEFAULT_RECIPES.poly;
  const rkey = JSON.stringify(recipe);
  // Ablauf: Mechanismus, ausgeführte Aktionen, laufender Clip
  const mech = useRef<Mech>(makeMech(recipe));
  const [acts, setActs] = useState<string[]>([]);
  const [clip, setClip] = useState<Clip | null>(null);
  const [clipKey, setClipKey] = useState(0);
  const [auto, setAuto] = useState(false);
  /** Stand des Mechanismus (jede Änderung zählt hoch) */
  const [ver, force] = useState(0);
  const lastClip = useRef<Clip | null>(null);
  // Kügelchen-Ansicht: Reaktor (bleibt beim Wechsel der Ansicht erhalten)
  const reactor = useRef<Reactor | null>(null);
  const [rstats, setRstats] = useState<RStats | null>(null);
  const [rwake, setRwake] = useState(0);
  const [rpaused, setRpaused] = useState(false);
  const [particle, setParticle] = useState<string | null>(null);
  const [legend, setLegend] = useState(false);
  /** Kügelchen: anderer Ansatz hat den laufenden Reaktor zurückgesetzt (Kennzeichen bis zur nächsten Aktion) */
  const [restarted, setRestarted] = useState(false);

  // neuer Ansatz → von vorn
  useEffect(() => {
    mech.current = makeMech(recipe); setActs([]); setClip(null); setAuto(false); force(v => v + 1); setRpaused(false);
    setRestarted(!!rstats && rstats.phase !== "bereit");
  }, [rkey]); // eslint-disable-line react-hooks/exhaustive-deps

  const rrun = (id: string) => {
    buzz();
    const R = reactor.current;
    if (!R) return;
    R.run(id);
    setRstats(R.stats()); setRwake(w => w + 1); setRpaused(false); setRestarted(false);
  };
  const rreset = () => {
    buzz();
    const R = reactor.current;
    if (R) reactor.current = new Reactor(recipe, R.W, R.H);
    setRstats(reactor.current?.stats() ?? null); setRwake(w => w + 1); setRpaused(false);
  };
  const [chainN, setChainN] = useState<number | undefined>(undefined);
  const pickBead = (b: RBead, n: number) => { if (b.kind === "mono") { setChainN(n); setInfo(b.m); } else setParticle(b.m); };

  const run = (id: string) => {
    buzz();
    setStopOpen(false);
    const c = mech.current.run(id);
    lastClip.current = c;
    setActs(a => [...a, id]);
    setClip(c); setClipKey(k => k + 1);
  };
  /** Aktion gewählt: gleich abspielen */
  const ask = (id: string) => { setAuto(false); run(id); };
  const ended = () => {
    setClip(null);
    force(v => v + 1);
  };
  // Automatisch: nach jedem Ablauf den nächsten Schritt
  useEffect(() => {
    if (!auto || clip) return;
    const next = nextAuto(mech.current, recipe);
    if (!next) { setAuto(false); return; }
    const t = setTimeout(() => run(next), reduced ? 0 : 350);
    return () => clearTimeout(t);
  }, [auto, clip, acts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const back = () => {
    buzz();
    setStopOpen(false);
    const a = acts.slice(0, -1);
    mech.current = replay(recipe, a);
    setActs(a); setClip(null); setAuto(false); force(v => v + 1);
  };
  const reset = () => { buzz(); setStopOpen(false); mech.current = makeMech(recipe); setActs([]); setClip(null); setAuto(false); force(v => v + 1); };
  const again = () => { if (lastClip.current) { setClip(lastClip.current); setClipKey(k => k + 1); } };

  const snap = useMemo(() => mech.current.snap(), [ver]); // eslint-disable-line react-hooks/exhaustive-deps
  const st = mech.current.status();
  const actions = mech.current.actions();
  const busy = !!clip;

  const head = (
    <div className="pm-head">
      <Segmented label={tr("Art der Reaktion", "Type of reaction")} value={art ?? ("none" as Art)} onChange={v => { buzz(); setArt(v); setTool(null); }}
        options={ARTS.map(a => ({ value: a, label: ART_SHORT[a] }))} />
    </div>
  );

  if (!art) {
    return <Workbench className="pm-wb" head={head} stage={<Chooser onPick={a => setArt(a)} />} tools={[]} />;
  }

  const label = tr(`${ART_NAME[art]} in Atomen`, `${ART_NAME[art]} in atoms`);
  const stage = (
    <div className="pm-stage">
      <div className="pm-view" ref={viewRef}>
        <Segmented label={tr("Ansicht", "View")} value={view} onChange={v => { buzz(); setView(v); }}
          options={[{ value: "atome", label: tr("Atome", "Atoms") }, { value: "kugeln", label: tr("Kügelchen", "Beads") }]} />
      </div>
      {view === "atome"
        ? <>
            <MechStage snap={snap} snapKey={ver} clip={clip} clipKey={clipKey} onEnd={ended} halos={halos} lp={lp} label={label} speed={auto ? 1.35 : 1} corner={corner} />
            {st.beads.length > 0 && <BeadStrip beads={st.beads} active={st.active} onPick={(b: Bead) => { if (b.mono) { setChainN(undefined); setInfo(b.mono); } }} />}
          </>
        : <>
            <ReactorView recipe={recipe} rkey={rkey} store={reactor} wake={rwake} paused={rpaused} onStats={setRstats} onPick={pickBead} />
            {rstats && <ReactorStats st={rstats} step={art !== "poly"} />}
          </>}
    </div>
  );

  // Kurzinfo als Kennzeichen (keine Sätze); Begründung nach einem Fehlschlag bzw. Besonderheit über „ⓘ“
  const tags: ReactNode[] = [];
  const done = st.phase === "ende" || st.phase === "aus";
  const whyBtn = (bad: boolean) => (
    <button key="w" type="button" className={`pm-why-btn${bad ? " bad" : ""}`} onClick={() => { buzz(); setWhy(true); }} aria-label={tr("Warum?", "Why?")}>
      <Icon name="info" size={18} />
    </button>
  );
  if (view === "kugeln" && rstats) {
    const ev = rstats.phase === "bereit" ? tr("bereit", "ready") : rstats.event ?? (rstats.phase === "fertig" ? tr("fertig", "done") : tr("läuft", "running"));
    tags.push(<Tag key="e" tone={rstats.phase === "aus" ? "bad" : "plain"}>{rstats.phase === "aus" ? `✗ ${cap(ev)}` : cap(ev)}</Tag>);
    if (restarted && rstats.phase === "bereit") tags.push(<Tag key="neu">{cap(tr("neuer Ansatz – von vorn", "new mix – starts again"))}</Tag>);
    if (rstats.living) tags.push(<Tag key="l" tone="ok">{cap(tr("lebend", "living"))}</Tag>);
    if (rstats.network) tags.push(<Tag key="v">{cap(tr("vernetzt", "network"))}</Tag>);
    if (rstats.poisoned) tags.push(<Tag key="p" tone="bad">{tr(`${rstats.poisoned} × Ti vergiftet`, `${rstats.poisoned} × Ti poisoned`)}</Tag>);
    if (rstats.byp) tags.push(<Tag key="b">+ {(rstats.bypParts?.length ? rstats.bypParts : [[rstats.bypName ?? "", rstats.byp] as [string, number]]).map(([n, c]) => `${c} ${n}`).join(" + ")}</Tag>);
    if (rstats.released) tags.push(<Tag key="r">{tr(`${rstats.released} abgelöst`, `${rstats.released} released`)}</Tag>);
    if (rstats.why) tags.push(whyBtn(rstats.phase === "aus"));
    tags.push(<button key="leg" type="button" className="pm-why-btn" onClick={() => { buzz(); setLegend(true); }} aria-label={tr("Legende", "Key")}><span className="pm-leg-q" aria-hidden="true">?</span></button>);
  }
  if (view === "atome") {
    tags.push(<Tag key="s" tone={st.fail ? "bad" : "plain"}>{st.fail ? `✗ ${cap(st.step)}` : cap(st.step)}</Tag>);
    if (st.n) tags.push(<Tag key="n">n = {st.n}</Tag>);
    if (st.byp) tags.push(<Tag key="b">+ {st.byp}</Tag>);
    if (st.cond && st.phase !== "init" && !done) tags.push(<Tag key="c">{st.cond}</Tag>);
    if (st.living) tags.push(<Tag key="l" tone="ok">{cap(tr("lebend", "living"))}</Tag>);
    if ((st.fail || st.note) && !busy) tags.push(whyBtn(!!st.fail));
  }

  const chip = (lbl: string, value: ReactNode, onClick: () => void, hue?: string) => (
    <button type="button" className="pm-chip" onClick={onClick}>
      <span className="pm-chip-l">{lbl}</span>
      <span className="pm-chip-v">{hue && <i className={`pm-chip-dot hue-${hue}`} />}<span>{typeof value === "string" ? hyph(value) : value}</span></span>
    </button>
  );
  // lange Namen im Chip als übliches Kürzel (sonst abgeschnitten)
  const chipName = (id: string) => (id === "mma" ? "MMA" : monoName(id));
  const recipeRow = (
    <div className="pm-recipe">
      {chip(art === "poly" ? tr("Monomer", "Monomer") : tr("Monomer 1", "Monomer 1"), chipName(recipe.a), () => setTool("mono"), monoHue(recipe.a))}
      {art === "poly"
        ? chip(tr("Zweites", "Second"), recipe.b ? chipName(recipe.b) : "–", () => setTool("copo"), recipe.b ? monoHue(recipe.b) : undefined)
        : chip(tr("Monomer 2", "Monomer 2"), recipe.b ? monoName(recipe.b) : "–", () => setTool("mono2"), recipe.b ? monoHue(recipe.b) : undefined)}
      {art === "poly" && chip(tr("Verfahren", "Method"), method(recipe.method ?? "dbpo").short, () => setTool("verfahren"))}
    </div>
  );

  // Aktionen in einer Zeile: Start, Monomer anlagern (Kügelchen), Abbruch (mehrere Arten → Auswahl)
  const adds = actions.filter(a => a.kind === "add" || a.pair);
  const stops = actions.filter(a => a.kind === "stop");
  const firsts = actions.filter(a => !adds.includes(a) && !stops.includes(a));
  const nBtn = firsts.length + adds.length + (stops.length ? 1 : 0);
  const compact = nBtn > 2;
  const button = (a: Action, small: boolean, disabled: boolean, onRun: (id: string) => void) => {
    const add = a.kind === "add" || !!a.pair;
    const ids = a.pair ?? (a.mono ? [a.mono] : []);
    return (
      <Button key={a.id} variant={a.kind === "stop" ? "soft" : "primary"} className={`pm-act${add ? " add" : ""}${a.kind === "other" ? " other" : ""}${a.id.startsWith("branch:") ? " branch" : ""}`} disabled={disabled}
        aria-label={a.label} title={a.label} onClick={() => onRun(a.id)}>
        {add && <span className="pm-plus" aria-hidden="true">+</span>}
        {!(small && a.kind === "other") && ids.map(m => <BeadIcon key={m} id={m} size={22} />)}
        {(!add || !small || a.kind === "other") && <span className={add ? "pm-name" : undefined}>{add ? (a.pair ? a.label.replace(/^\+ /, "") : monoName(a.mono!)) : a.label}</span>}
      </Button>
    );
  };
  // während eines Ablaufs bleibt alles bedienbar: eine neue Aktion beendet den laufenden Ablauf und startet die nächste
  // nach einem Fehlschlag: Vorschlag, womit es klappt (passendes Verfahren bzw. anderer Partner)
  const suggest = (() => {
    if (!st.fail || actions.length) return null;
    if (art === "poly") {
      const me = recipe.method ?? "dbpo";
      const bad = ([recipe.a, recipe.b].filter(Boolean) as VinylId[]).find(m => compat(m, me).fit !== "ok");
      const alt = bad && methodsFor(bad).find(x => x !== me && ([recipe.a, recipe.b].filter(Boolean) as VinylId[]).every(m => compat(m, x).fit === "ok"));
      if (!alt) return null;
      const name = KIND_TRY[method(alt).kind];
      return { label: name, go: () => { buzz(); setRecipe({ ...recipe, method: alt }); } };
    }
    return { label: tr("Partner …", "Partner …"), go: () => { buzz(); setPartners(true); setTool("mono2"); } };
  })();
  const actBtn = (a: Action) => button(a, compact, false, ask);
  const actRow = view === "atome" && (stopOpen
    ? (
      <div className="pm-acts-stop">
        {stops.map(actBtn)}
        <IconButton icon="close" label={tr("Kein Abbruch", "No stop")} onClick={() => { buzz(); setStopOpen(false); }} />
      </div>
    ) : (
      <div className="pm-acts">
        <IconButton icon="back" label={tr("Einen Schritt zurück", "One step back")} onClick={back} disabled={!acts.length} />
        <div className={`pm-acts-main n${nBtn}${compact ? " compact" : ""}`}>
          {actions.length
            ? <>
                {firsts.map(actBtn)}
                {adds.map(actBtn)}
                {stops.length === 1 && actBtn(stops[0])}
                {stops.length > 1 && <Button variant="soft" className="pm-act" onClick={() => { buzz(); setAuto(false); setStopOpen(true); }}>{tr("Abbruch …", "Stop …")}</Button>}
              </>
            : <>
                {suggest
                  ? <Button variant="soft" className="pm-act" icon="arrow" aria-label={tr(`Vorschlag: ${suggest.label}`, `Suggestion: ${suggest.label}`)} onClick={suggest.go}>{suggest.label}</Button>
                  : <Button variant="soft" className="pm-act" onClick={() => { buzz(); setTool("produkt"); }}>{tr("Produkt", "Product")}</Button>}
                {suggest
                  ? <IconButton icon="reset" label={tr("Von vorn", "Start again")} onClick={reset} />
                  : <Button variant="primary" className="pm-act" icon="reset" onClick={reset}>{tr("Von vorn", "Start again")}</Button>}
              </>}
        </div>
        <IconButton icon={auto ? "close" : "play"} label={auto ? tr("Anhalten", "Stop") : tr("Automatisch abspielen", "Play automatically")} onClick={() => { buzz(); setAuto(a => !a); }} disabled={!actions.length && !auto} className={auto ? "pm-auto on" : "pm-auto"} />
      </div>
    ));

  const ractions = view === "kugeln" ? reactor.current?.actions() ?? [] : [];
  const rRow = view === "kugeln" && (
    <div className="pm-acts">
      <IconButton icon="reset" label={tr("Von vorn", "Start again")} onClick={rreset} disabled={!rstats || rstats.phase === "bereit"} />
      <div className={`pm-acts-main n${ractions.length}${ractions.length > 2 ? " compact" : ""}`}>
        {ractions.map(a => button(a, ractions.length > 2, false, rrun))}
      </div>
      <IconButton icon={rpaused ? "play" : "pause"} label={rpaused ? tr("Weiter", "Resume") : tr("Anhalten", "Pause")}
        onClick={() => { buzz(); setRpaused(p => !p); }} className={rpaused ? "pm-auto on" : "pm-auto"} />
    </div>
  );

  // Monomer mit zwei verschiedenen Gruppen (Milchsäure) reagiert allein: zweites Monomer dann zunächst „ohne“
  const isAB = (id: string) => art !== "poly" && new Set(stepMono(id as StepId).groups).size === 2 && stepMono(id as StepId).groups.length === 2;
  const pickMono = (id: string) => { buzz(); setRecipe({ ...recipe, a: id, ...(recipe.b === id || isAB(id) ? { b: undefined } : {}) }); setTool(null); };
  const pickB = (id: string | undefined) => { buzz(); setRecipe({ ...recipe, b: id }); setTool(null); };
  const monoList = art === "poly" ? VINYLS.map(v => v.id as string) : STEPS.filter(s => s.arts.includes(art)).map(s => s.id as string);

  const tools = [
    { id: "mono", label: low ? hyph(monoName(recipe.a)) : art === "poly" ? tr("Monomer", "Monomer") : tr("Monomer 1", "Monomer 1"),
      title: art === "poly" ? tr("Monomer", "Monomer") : tr("Monomer 1", "Monomer 1"), icon: "molecule" as const, wide: true,
      content: <div className="pm-grid">{monoList.map(id => <MonoCard key={id} id={id} active={recipe.a === id} onClick={() => pickMono(id)} />)}</div> },
    art === "poly"
      ? { id: "copo", label: low && recipe.b ? `+ ${hyph(monoName(recipe.b))}` : tr("Copolymer", "Copolymer"), title: tr("Copolymer", "Copolymer"), icon: "layers" as const, wide: true, content: (
          <div className="pm-copo">
            <Segmented label={tr("Zugabe", "Addition")} value={recipe.seq ? "seq" : "stat"} onChange={v => { buzz(); setRecipe({ ...recipe, seq: v === "seq" }); }}
              options={[{ value: "stat", label: tr("gleichzeitig", "together") }, { value: "seq", label: tr("nacheinander", "one after another") }]} />
            <div className="pm-grid">
              <button type="button" className={`pm-mono none${!recipe.b ? " on" : ""}`} onClick={() => pickB(undefined)}><span className="pm-mono-name">{tr("ohne – nur ein Monomer", "none – one monomer only")}</span></button>
              {VINYLS.filter(v => v.id !== recipe.a).map(v => <MonoCard key={v.id} id={v.id} active={recipe.b === v.id} onClick={() => pickB(v.id)} />)}
            </div>
          </div>
        ) }
      : { id: "mono2", label: low && recipe.b ? hyph(monoName(recipe.b)) : tr("Monomer 2", "Monomer 2"), title: tr("Monomer 2", "Monomer 2"), icon: "layers" as const, wide: true,
          content: <div className="pm-grid">
            <button type="button" className={`pm-mono none${!recipe.b ? " on" : ""}`} onClick={() => pickB(undefined)}><span className="pm-mono-name">{tr("ohne – Monomer allein", "none – monomer alone")}</span></button>
            {(() => {
              // nach „Partner …“: passende zuerst
              const fits = (id: string) => partners && id !== recipe.a && (() => { const o = stepReact(recipe.a as StepId, id as StepId); return o.struktur !== "none" && o.struktur !== "klein" && o.art === art; })();
              return [...monoList].sort((x, y) => Number(fits(y)) - Number(fits(x))).map(id => <MonoCard key={id} id={id} active={recipe.b === id} onClick={() => pickB(id)} fits={fits(id)} />);
            })()}
          </div> },
    ...(art === "poly" ? [{ id: "verfahren", label: low ? method(recipe.method ?? "dbpo").short : tr("Verfahren", "Method"), title: tr("Verfahren", "Method"), icon: "fire" as const, wide: true,
      content: <div className="pm-meths">{METHODS.map(m => <MethodCard key={m.id} id={m.id} active={recipe.method === m.id} onClick={() => { buzz(); setRecipe({ ...recipe, method: m.id }); setTool(null); }} />)}</div> }] : []),
    { id: "produkt", label: tr("Produkt", "Product"), icon: "grid" as const, content: <ProductCard recipe={recipe} mech={mech.current} /> },
    { id: "ansicht", label: tr("Ansicht", "View"), icon: "screen" as const, content: (
      <div className="pm-switches">
        <Switch checked={halos} onChange={setHalos}>{tr("Bausteine farbig", "Colour the repeat units")}</Switch>
        <Switch checked={lp} onChange={setLp}>{tr("Freie Elektronenpaare", "Lone pairs")}</Switch>
        <Button variant="soft" icon="reset" onClick={again} disabled={busy || !lastClip.current}>{tr("Letzten Schritt nochmal", "Replay last step")}</Button>
      </div>
    ) },
  ];

  const whyText = view === "atome" ? st.fail ?? st.note : rstats?.why;
  const whyTitle = view === "atome" ? (st.fail ? `✗ ${cap(st.step)}` : cap(st.step)) : rstats?.event ? cap(rstats.event) : tr("Warum?", "Why?");

  return (
    <>
      <Workbench className="pm-wb" active={tool} onActive={setTool} head={head} stage={stage}
        status={tags.length ? <div className="pm-status">{tags}</div> : undefined}
        controls={<div className="pm-controls">{recipeRow}{actRow}{rRow}</div>}
        tools={tools} />
      <MonomerSheet id={info} chain={chainN} onClose={() => setInfo(null)} />
      <Sheet open={legend} title={tr("Legende", "Key")} onClose={() => setLegend(false)}><BeadLegend recipe={recipe} /></Sheet>
      <Sheet open={why && !!whyText} title={whyTitle} onClose={() => setWhy(false)}>
        <p className="pm-why">{whyText}</p>
      </Sheet>
      <Sheet open={!!particle} title={particle ? PARTICLE[particle]?.name ?? "" : ""} onClose={() => setParticle(null)}>
        <p className="pm-why">{particle ? PARTICLE_INFO()[particle] ?? "" : ""}</p>
      </Sheet>
    </>
  );
}
