// Kapitel 5 (Nebengruppenmetalle): Modell-Bausteine.
// ConfigModel – Kästchenschema der äußeren Unterschalen (ns, (n−1)d) eines Übergangsmetalls; Antippen gibt ein Elektron dieser Unterschale ab,
//   Symbol, Ladung, Elektronenzahl und Kurzschreibweise ändern sich sofort. Fachdaten aus `configuration` (gemessener Grundzustand, Cu [Ar] 4s¹ 3d¹⁰).
// WallModel – Ionenwand mit wählbarer Ladung des Metall-Ions (römische Zahl bzw. Ladung) und Zählern: Wand, Formel, Name und Rechnung sofort.

import { CATIONS, ION_BY_ID, ROMAN, BY_Z, chargeSup, chargeText, compoundName, configuration, formula, hundBoxes, isKnownCompound, sup, toSubscript, type Ion } from "@lern/chem";
import { Formula } from "@lern/chem-ui";
import { Button, Segmented, Stepper, Tag, type GuideCtx } from "@lern/ui";
import { getLang, tr } from "@lern/i18n";
import { ModelFrame, useModel } from "../model.tsx";
import { IonWall } from "../../components/IonWall.tsx";

// ── Kästchenschema ─────────────────────────────────────────────────────────

/** äußere s- und d-Unterschale des neutralen Atoms (Fe: 4s², 3d⁶; Ag: 5s¹, 4d¹⁰) und der Edelgaskern davor */
export function outerShells(Z: number) {
  const cfg = configuration(Z);
  const n = Math.max(...cfg.map(o => o.n));
  const s = cfg.find(o => o.key === `${n}s`)?.count ?? 0, d = cfg.find(o => o.key === `${n - 1}d`)?.count ?? 0;
  const core = n === 4 ? "Ar" : n === 5 ? "Kr" : "Xe";
  return { n, s, d, core, sKey: `${n}s`, dKey: `${n - 1}d` };
}

export interface Cfg { s: number; d: number }

/** Kurzschreibweise aus den Elektronen in ns und (n−1)d, z. B. „[Ar] 4s² 3d⁴“ (s vor d wie in der Kurzschreibweise des Atoms) */
export function cfgText(Z: number, c: Cfg) {
  const o = outerShells(Z);
  return `[${o.core}]` + (c.s ? ` ${o.sKey}${sup(c.s)}` : "") + (c.d ? ` ${o.dKey}${sup(c.d)}` : "");
}

/** Elektronen ab: `give` = Anzahl, vorgemacht bzw. Lösung = zuerst ns, dann (n−1)d */
export function cfgAfter(Z: number, give: number): Cfg {
  const o = outerShells(Z);
  const fromS = Math.min(o.s, give);
  return { s: o.s - fromS, d: o.d - (give - fromS) };
}

function Boxes({ l, count, label, onTap, off }: { l: number; count: number; label: string; onTap: () => void; off: boolean }) {
  const boxes = hundBoxes(l, count);
  return (
    <div className="k5-sub">
      <span className="k5-sub-key">{label}</span>
      <div className="k5-boxes">
        {boxes.map((v, i) => (
          <button key={i} type="button" className="k5-box" disabled={off || count === 0} onClick={onTap}
            aria-label={tr(`${label}: ${count} Elektronen – ein Elektron abgeben`, `${label}: ${count} electrons – remove one electron`)}>
            {v > 0 && <span className="k5-up">↑</span>}{v > 1 && <span className="k5-dn">↓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ConfigModel({ c, Z, give }: { c: GuideCtx; Z: number; give: number }) {
  const o = outerShells(Z);
  const [st, set] = useModel<Cfg>(c, { s: o.s, d: o.d }, cfgAfter(Z, give));
  const q = o.s + o.d - st.s - st.d;
  const sym = BY_Z[Z].symbol;
  const off = c.solved;
  const half = st.s === 0 && st.d === 5, full = st.s === 0 && st.d === 10;
  const stage = (
    <div className="k5-cfg">
      <div className="k5-ion" aria-live="polite">
        <span className="k5-ion-sym">{sym}{q > 0 && <sup>{chargeText(q)}</sup>}</span>
        <span className="k5-ion-n">{Z} p⁺ · {Z - q} e⁻</span>
      </div>
      <div className="k5-scheme">
        <div className="k5-core" aria-label={tr(`Edelgaskern ${o.core}`, `noble gas core ${o.core}`)}>[{o.core}]</div>
        <div className="k5-subs">
          <Boxes l={0} count={st.s} label={o.sKey} off={off} onTap={() => set({ ...st, s: st.s - 1 })} />
          <Boxes l={2} count={st.d} label={o.dKey} off={off} onTap={() => set({ ...st, d: st.d - 1 })} />
        </div>
      </div>
      <p className="k5-cfgtext"><span>{cfgText(Z, st)}</span></p>
      <div className="k5-tags">
        <Tag>{q ? tr(`${q} e⁻ abgegeben`, `${q} e⁻ removed`) : tr("Atom, neutral", "atom, neutral")}</Tag>
        {c.solved && half && <Tag tone="ok">{tr("✓ 3d halb besetzt", "✓ 3d half-filled")}</Tag>}
        {c.solved && full && <Tag tone="ok">{tr(`✓ ${o.dKey} voll besetzt`, `✓ ${o.dKey} full`)}</Tag>}
      </div>
    </div>
  );
  return (
    <ModelFrame c={c} className="k5-lm" stage={stage}
      controls={!c.solved && <Button icon="reset" onClick={() => set({ s: o.s, d: o.d })} disabled={q === 0}>{tr("Neu", "Reset")}</Button>}
      onCheck={() => c.pick(cfgText(Z, st))} />
  );
}

// ── Ionenwand mit Ladungswahl ──────────────────────────────────────────────

export interface Wall { q: number; nC: number; nA: number }

/** Metall-Ion mit Ladung q: das echte Ion aus `ions.ts`, sonst ein gedachtes (nur als Versuch in der Wand, nie als Lösung) */
export function metalIon(Z: number, q: number): Ion {
  const real = CATIONS.find(x => x.Z === Z && x.charge === q);
  if (real) return real;
  const sym = BY_Z[Z].symbol;
  return { id: `${sym}${q}+`, formula: sym, charge: q, Z, name: sym, part: sym, os: true };
}
/** Metallname ohne Zahl: „Eisen“, „Kupfer“ */
const metalBase = (Z: number) => (CATIONS.find(x => x.Z === Z)?.part ?? BY_Z[Z].symbol).replace(/\(.*\)$/, "");
/** Name mit gewählter römischer Zahl: „Kupfer(II)-chlorid“ / „Copper(II) chloride“ */
export function nameWith(Z: number, q: number, anion: Ion) {
  const part = `${metalBase(Z)}(${ROMAN[q]})`;
  return getLang() === "en" ? `${part} ${anion.part}` : `${part}-${anion.part}`;
}
/** gebaute Formel (Text mit Tiefstellung) oder „≠“, solange die Wand nicht ausgeglichen ist */
export function wallFormula(Z: number, anionId: string, w: Wall) {
  const cat = metalIon(Z, w.q), an = ION_BY_ID[anionId];
  if (w.nC * w.q !== w.nA * -an.charge) return "≠";
  return toSubscript(formula(cat, an, w.nC, w.nA));
}

export function WallModel({ c, Z, anion, init, sol, charges, numerals = false, stepC = false, stepA = false, report, given }: {
  c: GuideCtx; Z: number; anion: string; init: Wall; sol: Wall;
  /** wählbare Ladungen des Metall-Ions (sonst fest) */
  charges?: number[];
  /** Auswahl als römische Zahl beschriften (Name) statt als Ladung */
  numerals?: boolean;
  stepC?: boolean; stepA?: boolean;
  /** was „Prüfen“ meldet: gebaute Formel, gewählte Ladung („3+“) oder gebauter Name */
  report: "formula" | "charge" | "name";
  /** vorgegebener Name bzw. vorgegebene Formel über der Wand */
  given?: string;
}) {
  const [w, set] = useModel<Wall>(c, init, sol);
  const an = ION_BY_ID[anion], cat = metalIon(Z, w.q);
  const balanced = w.nC * w.q === w.nA * -an.charge;
  const real = CATIONS.some(x => x.Z === Z && x.charge === w.q);
  // gedachte Ionen (Fe⁴⁺) und nicht beständige Stoffe (CuNO₃) bekommen keinen Namen, sondern einen Hinweis
  const known = real && isKnownCompound(cat, an);
  const sym = BY_Z[Z].symbol;
  const result = report === "formula" ? wallFormula(Z, anion, w) : report === "charge" ? `${w.q}+` : nameWith(Z, w.q, an);
  const stage = (
    <div className="k5-wall">
      {given && <p className={`k5-given${report === "formula" ? " name" : ""}`}>{report === "formula" ? given : <Formula f={given} />}</p>}
      <div className="k5-wall-fit">
        <IonWall cation={cat} anion={an} nC={w.nC} nA={w.nA} showFormula={report === "formula"} showName={known} />
      </div>
      {balanced && real && !known && <Tag tone="bad">✗ {tr("gibt es nicht (nicht beständig)", "does not exist (not stable)")}</Tag>}
      {report === "name" && <p className="k5-name" aria-live="polite">{nameWith(Z, w.q, an)}</p>}
      {report === "charge" && <p className={`k5-name${balanced ? " ok" : ""}`} aria-live="polite">{balanced && known ? compoundName(cat, an) : `${sym}${chargeSup(w.q)}`}</p>}
    </div>
  );
  const seg = charges && (
    <Segmented<string> label={numerals ? tr("Römische Zahl", "Roman numeral") : tr(`Ladung von ${sym}`, `Charge of ${sym}`)} value={String(w.q)}
      options={charges.map(q => ({ value: String(q), label: numerals ? `(${ROMAN[q]})` : `${q}+` }))} onChange={v => set({ ...w, q: Number(v) })} />
  );
  const controls = (seg || stepC || stepA) && (
    <fieldset className="k5-ctl" disabled={c.solved}>
      {seg}
      {(stepC || stepA) && (
        <div className="k5-steps">
          {stepC && <Stepper compact tone="cation" label={tr(`${sym}-Ionen`, `${sym} ions`)} value={w.nC} min={1} max={4} editable={false} onChange={v => set({ ...w, nC: v })} />}
          {stepA && <Stepper compact tone="anion" label={<>{toSubscript(an.formula)}<sup>{an.charge === -1 ? "−" : `${-an.charge}−`}</sup></>} value={w.nA} min={1} max={6} editable={false} onChange={v => set({ ...w, nA: v })} />}
        </div>
      )}
    </fieldset>
  );
  return <ModelFrame c={c} className="k5-lm" stage={stage} controls={controls || undefined} onCheck={() => c.pick(result)} />;
}

