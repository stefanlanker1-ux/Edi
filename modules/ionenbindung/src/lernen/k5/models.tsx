// Kapitel 5 (Nebengruppenmetalle): Modell-Bausteine – ohne Elektronenkonfiguration, alles über Stoffe, PSE und Ionenwand.
// Sample   – Stoffprobe auf dem Uhrglas in der echten Farbe (FeO schwarz, Fe₂O₃ rotbraun, Cu₂O rot, CuO schwarz).
// OxidePair – zwei Stoffe aus denselben Elementen nebeneinander (Probe, Formel, Ionenwand, Name).
// PseMetals – Metalle wählen (Knöpfe unter dem PSE oder im PSE): Ladung aus der Hauptgruppe (I.–III. = Gruppe 1, 2, 13) oder im Namen (alle anderen).
// WallModel – Ionenwand mit wählbarer Ladung des Metall-Ions (römische Zahl bzw. Ladung) und Zählern: Wand sofort (ausgeglichen oder nicht),
//   ✓-Rechnung und Name erst nach dem Lösen. Begründet wird nur über die Ladungsbilanz und den Namen.

import { CATIONS, ION_BY_ID, ROMAN, BY_Z, chargeFull, chargeSup, compoundName, formula, ionChargeText, ratio, toSubscript, typicalIonCharge, type Ion } from "@lern/chem";
import { useState } from "react";
import { Formula, PeriodicTable } from "@lern/chem-ui";
import { Button, Fit, Icon, Segmented, Stepper, type GuideCtx } from "@lern/ui";
import { getLang, tr } from "@lern/i18n";
import { ModelFrame, useModel } from "../model.tsx";

// ── Stoffproben ────────────────────────────────────────────────────────────

/** Farben der Stoffe (Pulver): FeO schwarz, Fe₂O₃ rotbraun (Rost), Cu₂O rot, CuO schwarz */
export type SampleKey = "FeO" | "Fe2O3" | "Cu2O" | "CuO";
export const SAMPLE_COLOR: Record<SampleKey, () => string> = {
  FeO: () => tr("schwarz", "black"), Fe2O3: () => tr("rotbraun", "red-brown"), Cu2O: () => tr("rot", "red"), CuO: () => tr("schwarz", "black"),
};

/** Probe auf dem Uhrglas: Pulverhaufen in der Farbe des Stoffs */
export function Sample({ k }: { k: SampleKey }) {
  return (
    <svg className={`k5-sample s-${k}`} viewBox="0 0 84 46" role="img" aria-label={tr(`Probe, ${SAMPLE_COLOR[k]()}`, `sample, ${SAMPLE_COLOR[k]()}`)}>
      <path className="k5-heap" d="M15 33 C20 20 30 12 42 11 C54 12 64 20 69 33 Z" />
      <circle className="k5-grain" cx="13" cy="33.5" r="1.4" /><circle className="k5-grain" cx="71" cy="33.2" r="1.2" /><circle className="k5-grain" cx="75" cy="34" r=".9" />
      <path className="k5-glass" d="M3 31 Q42 48 81 31" />
    </svg>
  );
}

// ── Ionenwand ──────────────────────────────────────────────────────────────

export interface Wall { q: number; nC: number; nA: number }

/** Metall-Ion mit Ladung q: das Ion aus `ions.ts`, sonst eines mit der gewählten Ladung (nur als Versuch in der Wand, nie als Lösung) */
export function metalIon(Z: number, q: number): Ion {
  const real = CATIONS.find(x => x.Z === Z && x.charge === q);
  if (real) return real;
  const sym = BY_Z[Z].symbol;
  return { id: `${sym}${q}+`, formula: sym, charge: q, Z, name: sym, part: sym, os: true };
}
export const isReal = (Z: number, q: number) => CATIONS.some(x => x.Z === Z && x.charge === q);
/** Metallname ohne Zahl: „Eisen“, „Kupfer“ */
const metalBase = (Z: number) => (CATIONS.find(x => x.Z === Z)?.part ?? BY_Z[Z].symbol).replace(/\(.*\)$/, "");
/** Name mit gewählter römischer Zahl: „Kupfer(II)-chlorid“ / „Copper(II) chloride“ */
export function nameWith(Z: number, q: number, anion: Ion) {
  const part = `${metalBase(Z)}(${ROMAN[q]})`;
  return getLang() === "en" ? `${part} ${anion.part}` : `${part}-${anion.part}`;
}
/** gekürzte, ausgeglichene Wand? */
const simplest = (Z: number, an: Ion, w: Wall) => { const r = ratio(metalIon(Z, w.q), an); return w.nC === r.nC && w.nA === r.nA; };

/** Ergebnis der Formel-Wand: gebaute Formel (Text mit Tiefstellung), sonst „≠ q|nC|nA“ (nicht ausgeglichen, je Zustand eigene Rückmeldung) */
export function wallFormula(Z: number, anionId: string, w: Wall) {
  const cat = metalIon(Z, w.q), an = ION_BY_ID[anionId];
  if (w.nC * w.q !== w.nA * -an.charge) return `≠ ${w.q}|${w.nC}|${w.nA}`;
  return toSubscript(formula(cat, an, w.nC, w.nA));
}

/**
 * Rückmeldungen zu jedem möglichen Zustand der Formel-Wand (Name → Formel), mit den Zahlen der Aufgabe:
 * nicht ausgeglichen (obere/untere Reihe), falsche römische Zahl, nicht gekürzt.
 */
export function wallWhy(Z: number, anionId: string, sol: Wall, charges: number[]): Record<string, string> {
  const an = ION_BY_ID[anionId], a = -an.charge, sym = BY_Z[Z].symbol, out: Record<string, string> = {};
  const right = wallFormula(Z, anionId, sol);
  for (const q of charges) for (let nC = 1; nC <= 4; nC++) for (let nA = 1; nA <= 6; nA++) {
    const w = { q, nC, nA }, id = wallFormula(Z, anionId, w);
    if (id === right || out[id]) continue;
    if (nC * q !== nA * a) {
      out[id] = tr(`Noch nicht neutral: obere Reihe ${nC} · (${chargeFull(q)}) = ${nC * q}+, untere Reihe ${nA} · (${chargeFull(-a)}) = ${nA * a}−.`,
        `Not neutral yet: top row ${nC} · (${chargeFull(q)}) = ${nC * q}+, bottom row ${nA} · (${chargeFull(-a)}) = ${nA * a}−.`);
    } else if (q !== sol.q) {
      out[id] = tr(`Neutral, aber mit (${ROMAN[q]}) baust du ${sym}${chargeSup(q)}. Gesucht ist (${ROMAN[sol.q]}) = ${sym}${chargeSup(sol.q)}.`,
        `Neutral, but with (${ROMAN[q]}) you build ${sym}${chargeSup(q)}. You need (${ROMAN[sol.q]}) = ${sym}${chargeSup(sol.q)}.`);
    } else if (!simplest(Z, an, w)) {
      out[id] = tr(`Neutral, aber nicht das kleinste Verhältnis: ${nC} : ${nA} lässt sich kürzen.`, `Neutral, but not the smallest ratio: ${nC} : ${nA} can be reduced.`);
    }
  }
  return out;
}

/** Baustein der Ionenwand (Breite = Ladung) */
function Tile({ ion }: { ion: Ion }) {
  return (
    <span className={`k5-tile ${ion.charge > 0 ? "cat" : "an"}`} style={{ gridColumn: `span ${Math.abs(ion.charge)}` }}>
      <span className="k5-tl"><Formula f={ion.formula} /><sup>{ionChargeText(ion.charge)}</sup></span>
    </span>
  );
}

export function IonWall5({ cat, an, nC, nA, small = false }: { cat: Ion; an: Ion; nC: number; nA: number; small?: boolean }) {
  const pos = nC * cat.charge, neg = nA * -an.charge;
  return (
    <div className={`k5-iw${small ? " small" : ""}`} style={{ "--cols": Math.max(pos, neg) } as React.CSSProperties}>
      <div className="k5-row" aria-label={`${nC} × ${cat.formula}${chargeSup(cat.charge)}`}>
        {Array.from({ length: nC }, (_, i) => <Tile key={i} ion={cat} />)}
        {neg > pos && <span className="k5-gap" style={{ gridColumn: `span ${neg - pos}` }} role="img" aria-label={tr(`es fehlen ${neg - pos} positive Ladungen`, `${neg - pos} positive charges missing`)} />}
      </div>
      <div className="k5-row" aria-label={`${nA} × ${an.formula}${chargeSup(an.charge)}`}>
        {Array.from({ length: nA }, (_, i) => <Tile key={i} ion={an} />)}
        {pos > neg && <span className="k5-gap" style={{ gridColumn: `span ${pos - neg}` }} role="img" aria-label={tr(`es fehlen ${pos - neg} negative Ladungen`, `${pos - neg} negative charges missing`)} />}
      </div>
    </div>
  );
}

/** Zwei Stoffe aus denselben Elementen (vorgemacht): Probe, Formel, Ionenwand, Name */
export function OxidePair({ c, items }: { c: GuideCtx; items: { Z: number; q: number; nC: number; nA: number; sample: SampleKey }[] }) {
  const an = ION_BY_ID["O2-"];
  const stage = (
    <Fit className="k5-fit" min={0.3}>
      <div className="k5-pair">
        {items.map(it => {
          const cat = metalIon(it.Z, it.q);
          return (
            <figure key={it.sample} className="k5-pair-item">
              <Sample k={it.sample} />
              <figcaption>
                <span className="k5-pair-f"><Formula f={formula(cat, an, it.nC, it.nA)} /></span>
                <span className="k5-pair-c">{SAMPLE_COLOR[it.sample]()}</span>
              </figcaption>
              <IonWall5 cat={cat} an={an} nC={it.nC} nA={it.nA} small />
              <p className="k5-pair-n">{compoundName(cat, an)}</p>
            </figure>
          );
        })}
      </div>
    </Fit>
  );
  return <ModelFrame c={c} className="k5-lm" stage={stage} />;
}

/** Ergebnis, wenn die Anzahlen nicht zur vorgegebenen Formel passen (Ladung bzw. Name aus der Formel: erst die Anzahlen wie in der Formel einstellen) */
export const WRONG_COUNTS = "≠ Anzahl";

export function WallModel({ c, Z, anion, init, sol, charges, numerals = false, stepC = false, stepA = false, report, given, sample, sampleAlways = false }: {
  c: GuideCtx; Z: number; anion: string; init: Wall; sol: Wall;
  /** wählbare Ladungen des Metall-Ions (sonst fest) */
  charges?: number[];
  /** Auswahl als römische Zahl beschriften (Name) statt als Ladung */
  numerals?: boolean;
  stepC?: boolean; stepA?: boolean;
  /** was „Prüfen“ meldet: gebaute Formel, gewählte Ladung („3+“) oder gebauter Name; bei Ladung/Name zuerst die Anzahlen der Formel */
  report: "formula" | "charge" | "name";
  /** vorgegebener Name bzw. vorgegebene Formel über der Wand */
  given?: string;
  /** Probe des Stoffs: bei vorgegebener Formel von Anfang an (`sampleAlways`), beim Formel-Bauen erst nach dem Lösen */
  sample?: SampleKey; sampleAlways?: boolean;
}) {
  const [w, set] = useModel<Wall>(c, init, sol);
  const an = ION_BY_ID[anion], cat = metalIon(Z, w.q);
  const balanced = w.nC * w.q === w.nA * -an.charge;
  const sym = BY_Z[Z].symbol;
  const countsOk = w.nC === sol.nC && w.nA === sol.nA;
  const result = report === "formula" ? wallFormula(Z, anion, w) : !countsOk ? WRONG_COUNTS : report === "charge" ? `${w.q}+` : nameWith(Z, w.q, an);
  const calc = `${w.nC} · (${chargeFull(w.q)}) = ${w.nC * w.q}+ ${balanced ? tr("und", "and") : tr("aber", "but")} ${w.nA} · (${chargeFull(an.charge)}) = ${w.nA * -an.charge}−`;
  // Vor dem Lösen nie ✓, Grün oder der fertige Name: Formel bauen zeigt die Rechnung neutral („ausgeglichen“ bzw. „≠“), Ladung/Name suchen nur die Wand.
  // Nach dem Lösen: ✓-Rechnung und Name.
  const showSample = sample && (sampleAlways || c.solved);
  const stage = (
    <Fit className="k5-fit" min={0.3}><div className="k5-wall">
      {(given || showSample) && (
        <div className="k5-head">
          {showSample && <Sample k={sample!} />}
          {given && <p className={`k5-given${report === "formula" ? " name" : ""}`}>{report === "formula" ? given : <Formula f={given} />}
            {showSample && <span className="k5-given-c">{SAMPLE_COLOR[sample!]()}</span>}</p>}
        </div>
      )}
      <IonWall5 cat={cat} an={an} nC={w.nC} nA={w.nA} />
      {report === "formula" && (
        <p className="k5-built"><Icon name="arrow" size={26} /> <span className="k5-built-f">{balanced ? <Formula f={formula(cat, an, w.nC, w.nA)} /> : "?"}</span>
          {c.solved && <span className="k5-built-n">{compoundName(cat, an)}</span>}</p>
      )}
      {c.solved
        ? <p className="k5-calc ok">✓ {calc}</p>
        : report === "formula" && <p className="k5-calc">{balanced ? `${tr("ausgeglichen", "balanced")}: ` : "≠ "}{calc}</p>}
      {report === "name" && !c.solved && <p className="k5-name" aria-live="polite">{nameWith(Z, w.q, an)}</p>}
      {report !== "formula" && c.solved && <p className="k5-name ok">{compoundName(cat, an)}</p>}
    </div></Fit>
  );
  const seg = charges && (
    <Segmented<string> label={numerals ? tr("Römische Zahl", "Roman numeral") : tr(`Ladung von ${sym}`, `Charge of ${sym}`)} value={String(w.q)}
      options={charges.map(q => ({ value: String(q), label: numerals ? `(${ROMAN[q]})` : `${q}+` }))} onChange={v => set({ ...w, q: Number(v) })} />
  );
  // gelöst bzw. vorgemacht: nur das Modell (Zahl und Anzahlen stehen in Wand und Name), mehr Platz für das Bild
  const controls = !c.solved && (seg || stepC || stepA) && (
    <fieldset className="k5-ctl">
      {seg}
      {(stepC || stepA) && (
        <div className="k5-steps">
          {stepC && <Stepper compact tone="cation" label={tr(`${sym}-Ionen`, `${sym} ions`)} value={w.nC} min={1} max={4} editable={false} onChange={v => set({ ...w, nC: v })} />}
          {stepA && <Stepper compact tone="anion" label={<span className="k5-an">{toSubscript(an.formula)}<sup>{an.charge === -1 ? "−" : `${-an.charge}−`}</sup></span>} value={w.nA} min={1} max={6} editable={false} onChange={v => set({ ...w, nA: v })} />}
        </div>
      )}
    </fieldset>
  );
  return <ModelFrame c={c} className="k5-lm" stage={stage} controls={controls || undefined} onCheck={() => c.pick(result)} />;
}

// ── PSE: Ladung aus der Hauptgruppe oder im Namen ──────────────────────────

/** Ladung aus der Hauptgruppe ablesbar: Metalle der I. bis III. Hauptgruppe (Gruppe 1, 2, 13: Na⁺, Mg²⁺, Al³⁺); alle anderen Metalle tragen sie als römische Zahl im Namen */
export const chargeFromGroup = (Z: number) => { const g = BY_Z[Z].group; return g === 1 || g === 2 || g === 13; };
/** Ergebnis: gewählte Symbole nach Ordnungszahl, z. B. "Fe Cu" */
export const pseResult = (picked: number[]) => [...picked].sort((a, b) => a - b).map(Z => BY_Z[Z].symbol).join(" ") || "–";
const groupOf = (Z: number) => BY_Z[Z].group ?? 0;
/** Gruppe mit Brücke zu den Hauptgruppen aus Kapitel 1: „Gruppe 13 = III. Hauptgruppe“, „Gruppe 8 (Nebengruppe)“ */
export function groupText(Z: number) {
  const g = groupOf(Z);
  if (g >= 3 && g <= 12) return tr(`Gruppe ${g} (Nebengruppe)`, `group ${g} (transition metal)`);
  const h = g <= 2 ? g : g - 10;
  return tr(`Gruppe ${g} = ${ROMAN[h]}. Hauptgruppe`, `group ${g} = main group ${ROMAN[h]}`);
}
const elText = (Z: number) => `${BY_Z[Z].name} ${BY_Z[Z].symbol}`;

/** Rückmeldung zu jeder Auswahl unter den angebotenen Metallen: zuerst ein Metall zu viel (mit Gruppe und Grund), sonst eines, das fehlt */
export function pseWhy(cands: number[], answer: number[]): Record<string, string> {
  const out: Record<string, string> = {}, right = pseResult(answer);
  const wanted = (Z: number) => answer.includes(Z);
  for (let m = 0; m < 1 << cands.length; m++) {
    const pick = cands.filter((_, i) => m & (1 << i)), id = pseResult(pick);
    if (id === right) continue;
    const extra = pick.find(Z => !wanted(Z)), miss = cands.find(Z => wanted(Z) && !pick.includes(Z));
    if (!pick.length) { out[id] = tr("Noch nichts gewählt. Tippe Metalle an.", "Nothing chosen yet. Tap metals."); continue; }
    if (extra) {
      out[id] = chargeFromGroup(extra)
        ? tr(`${elText(extra)}: ${groupText(extra)} – die Ladung liest du aus der Hauptgruppe ab.`, `${elText(extra)}: ${groupText(extra)} – you read the charge from the main group.`)
        : tr(`${elText(extra)}: ${groupText(extra)} – nur die I. bis III. Hauptgruppe verraten die Ladung.`, `${elText(extra)}: ${groupText(extra)} – only main groups I to III give the charge.`);
    } else if (miss) {
      out[id] = tr(`${elText(miss)} (${groupText(miss)}) fehlt noch.`, `${elText(miss)} (${groupText(miss)}) is still missing.`);
    }
  }
  return out;
}

/** Metalle wählen: große Knöpfe unter dem PSE (an/aus) oder im PSE antippen; „Prüfen“ meldet die Symbole, z. B. "Fe Cu".
 *  Alle angebotenen Zellen gleich gefärbt (die PSE-Farben verrieten die Einordnung), die Einordnung erst nach dem Lösen. */
export function PseMetals({ c, cands, answer }: { c: GuideCtx; cands: number[]; answer: number[] }) {
  const [picked, set] = useModel<number[]>(c, [], answer);
  const [info, setInfo] = useState<string>("");
  const has = (Z: number) => picked.includes(Z);
  const byZ = [...cands].sort((a, b) => a - b);
  const sym = (Z: number) => BY_Z[Z].symbol;
  const toggle = (Z: number) => {
    if (c.solved) return;
    if (!cands.includes(Z)) { setInfo(tr(`${sym(Z)} ist hier nicht dabei.`, `${sym(Z)} is not on offer here.`)); return; }
    setInfo(`${elText(Z)}: ${groupText(Z)}`);
    set(has(Z) ? picked.filter(x => x !== Z) : [...picked, Z]);
  };
  const chips = (
    <div className="k5-chips" role="group" aria-label={tr("Metalle", "Metals")}>
      {byZ.map(Z => (
        <button key={Z} type="button" className={`k5-chip${has(Z) ? " on" : ""}`} aria-pressed={has(Z)} aria-label={BY_Z[Z].name} onClick={() => toggle(Z)}>{sym(Z)}</button>
      ))}
    </div>
  );
  return (
    <ModelFrame c={c} className="k5-lm"
      stage={
        <div className="k5-pse">
          {/* PSE füllt den Platz (Container-Einheiten); bleibt es zu hoch (viel Text darunter), verkleinert Fit es, statt den Text zu überdecken */}
          <div className="pse-fit k5-pse-fit">
            <Fit className="k5-fit" min={0.3}>
              <PeriodicTable stufe="os" fit names={false} onPick={toggle} disabled={c.solved}
                cellState={Z => (!cands.includes(Z) ? "dim" : has(Z) ? (c.solved ? "right" : "sel") : c.show && answer.includes(Z) ? "hit" : undefined)} />
            </Fit>
          </div>
          <div className="k5-pse-sel" aria-live="polite">
            {c.solved ? (
              <>
                <p><b>{tr("Ladung aus der Hauptgruppe", "Charge from the main group")}:</b> {byZ.filter(chargeFromGroup).map(Z => sym(Z) + chargeSup(typicalIonCharge(Z) ?? 0)).join(", ")}</p>
                <p><b>{tr("Ladung im Namen", "Charge in the name")}:</b> {byZ.filter(Z => !chargeFromGroup(Z)).map(sym).join(", ")}</p>
              </>
            ) : <p>{info || tr("Wähle Metalle unten oder im PSE.", "Choose metals below or in the table.")}</p>}
          </div>
        </div>
      }
      controls={c.solved ? undefined : <>{chips}<Button icon="reset" onClick={() => { set([]); setInfo(""); }} disabled={!picked.length}>{tr("Löschen", "Clear")}</Button></>}
      onCheck={() => c.pick(pseResult(picked))} />
  );
}

// ── Spalten des großen PSE und Hauptgruppen (Brücke zu Kapitel 1) ──────────

/** Die 18 Gruppen des großen PSE mit den Hauptgruppen I–VIII darunter und den Nebengruppen dazwischen; Beispiel-Metalle in ihrer Spalte.
 *  Vorgemacht: zeigt, wie Gruppe 13 zur III. Hauptgruppe wird und wo Eisen und Kupfer stehen. */
export function GroupStrip({ c, metals }: { c: GuideCtx; metals: number[] }) {
  const main = (g: number) => (g <= 2 ? g : g >= 13 ? g - 10 : 0);
  const col = (g: number, row: number) => ({ gridColumn: `${g} / span 1`, gridRow: row });
  const stage = (
    <Fit className="k5-fit" min={0.3}>
      <div className="k5-strip" role="img" aria-label={tr("Gruppen 1 bis 18 des PSE: Gruppe 1, 2 und 13 bis 18 sind die I. bis VIII. Hauptgruppe, Gruppen 3 bis 12 die Nebengruppen.",
        "Groups 1 to 18 of the periodic table: groups 1, 2 and 13 to 18 are main groups I to VIII, groups 3 to 12 the transition metals.")}>
        <span className="k5-strip-cap" style={{ gridColumn: "1 / -1", gridRow: 1 }}>{tr("Gruppe im großen PSE", "Group in the large periodic table")}</span>
        {Array.from({ length: 18 }, (_, i) => <span key={`g${i}`} className={`k5-strip-g${main(i + 1) ? " main" : ""}`} style={col(i + 1, 2)}>{i + 1}</span>)}
        {/* I–IV einzeln (dort stehen die Metalle), V–VIII zusammen – „VIII“ passt am Handy nicht in eine Spalte */}
        {[1, 2, 13, 14].map(g => <span key={`h${g}`} className="k5-strip-h" style={col(g, 4)}>{ROMAN[main(g)]}</span>)}
        <span className="k5-strip-h" style={{ gridColumn: "15 / span 4", gridRow: 4 }}>V–VIII</span>
        <span className="k5-strip-n" style={{ gridColumn: "3 / span 10", gridRow: 4 }}>{tr("Nebengruppen", "transition metals")}</span>
        <span className="k5-strip-cap" style={{ gridColumn: "1 / -1", gridRow: 3 }}>{tr("Hauptgruppe (Kapitel 1)", "Main group (chapter 1)")}</span>
        {metals.map(Z => {
          const g = BY_Z[Z].group ?? 0;
          return (
            <span key={Z} className={`k5-strip-m${chargeFromGroup(Z) ? " grp" : " name"}`} style={col(g, 5)}>
              <b>{BY_Z[Z].symbol}</b>
              <small>{chargeFromGroup(Z) ? chargeFull(typicalIonCharge(Z) ?? 0) : "?"}</small>
            </span>
          );
        })}
      </div>
      <div className="k5-strip-key">
        <span><i className="grp" /> {tr("Ladung aus der Hauptgruppe", "charge from the main group")}</span>
        <span><i className="name" /> {tr("? = Ladung im Namen", "? = charge in the name")}</span>
      </div>
    </Fit>
  );
  return <ModelFrame c={c} className="k5-lm" stage={stage} />;
}
