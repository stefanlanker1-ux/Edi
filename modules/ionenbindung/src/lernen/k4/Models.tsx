// Kapitel 4 – Modelle: mehratomiges Ion aus Atomkugeln (Anzahl und Ladung einstellen), Namensbaukasten, Ionenwand mit Klammern,
// Formel schreiben (Klammer und Zahl) mit Atomzählung, Ionen wählen. Jede Eingabe ändert das Modell sofort; „Prüfen“ meldet das Gebaute.

import type { ReactNode } from "react";
import { Fit, Icon, type GuideCtx } from "@lern/ui";
import { ANIONS, CATIONS, ION_BY_ID, chargeSup, formula, ratio, signed, toSubscript, type Ion } from "@lern/chem";
import { Formula } from "@lern/chem-ui";
import { getLang, tr } from "@lern/i18n";
import { IonWall } from "../../components/IonWall.tsx";
import { IonLabel } from "../../components/IonTile.tsx";
import { ModelFrame, useModel } from "../model.tsx";

const ion = (id: string) => ION_BY_ID[id];

/* ── Zähler: [−] Wert [+] ─────────────────────────────────────────────── */
export function Count({ label, value, set, min, max, disabled, show }: {
  label: ReactNode; value: number; set: (v: number) => void; min: number; max: number; disabled?: boolean; show?: (v: number) => string;
}) {
  return (
    <div className="k4-step" role="group">
      <button type="button" disabled={disabled || value <= min} onClick={() => set(value - 1)} aria-label={tr("weniger", "less")}><Icon name="minus" /></button>
      <span className="k4-step-v"><small>{label}</small><b>{show ? show(value) : value}</b></span>
      <button type="button" disabled={disabled || value >= max} onClick={() => set(value + 1)} aria-label={tr("mehr", "more")}><Icon name="plus" /></button>
    </div>
  );
}

/* ── Atome zählen: „Ca(OH)2“ → { Ca: 1, O: 2, H: 2 } (Klammern mit Zahl dahinter) ── */
export function atomsOf(f: string): Record<string, number> {
  const out: Record<string, number> = {};
  const re = /\(([^()]*)\)(\d*)|([A-Z][a-z]?)(\d*)/g;
  for (const m of f.matchAll(re)) {
    if (m[1] !== undefined) {
      const k = m[2] ? Number(m[2]) : 1;
      for (const [el, n] of Object.entries(atomsOf(m[1]))) out[el] = (out[el] ?? 0) + n * k;
    } else out[m[3]] = (out[m[3]] ?? 0) + (m[4] ? Number(m[4]) : 1);
  }
  return out;
}

/** Ion als Text: Formel mit tiefgestellten Zahlen, Ladung hochgestellt – "SO₄²⁻", ohne Ladung "SO₄" */
export const ionStr = (f: string, q: number) => toSubscript(f) + chargeSup(q);

/* ── mehratomiges Ion als Atomkugeln in eckigen Klammern, Ladung oben rechts ── */
const R: Record<string, number> = { S: 27, P: 27, C: 23, N: 22, O: 21, H: 14 };
const elName = (el: string) => ({ S: tr("Schwefel", "sulfur"), P: tr("Phosphor", "phosphorus"), C: tr("Kohlenstoff", "carbon"), N: tr("Stickstoff", "nitrogen"), O: tr("Sauerstoff", "oxygen"), H: tr("Wasserstoff", "hydrogen") } as Record<string, string>)[el] ?? el;

const ANGLES: Record<number, number[]> = { 0: [], 1: [0], 2: [-150, -30], 3: [-90, 30, 150], 4: [-45, 45, 135, 225], 5: [-90, -18, 54, 126, 198] };

interface Ball { el: string; x: number; y: number; r: number }
function layout(center: string, lig: string, n: number, extra: number): Ball[] {
  const rc = R[center], rl = R[lig];
  const d = (rc + rl) * 0.8;
  const out: Ball[] = [];
  const angs = ANGLES[Math.min(n, 5)] ?? [];
  angs.forEach(a => out.push({ el: lig, x: d * Math.cos((a * Math.PI) / 180), y: d * Math.sin((a * Math.PI) / 180), r: rl }));
  // H am ersten Liganden (Hydrogencarbonat: H am O), sonst am Zentralatom
  for (let k = 0; k < extra; k++) {
    const host = out[k] ?? { el: center, x: 0, y: 0, r: rc };
    const base = host === out[k] ? (angs[k] ?? 0) : 180;
    const a = ((base + 35) * Math.PI) / 180, dd = (host.r + R.H) * 0.8;
    out.push({ el: "H", x: host.x + dd * Math.cos(a), y: host.y + dd * Math.sin(a), r: R.H });
  }
  out.push({ el: center, x: 0, y: 0, r: rc });
  // Liganden hinter das Zentralatom, H zuoberst
  return out.sort((p, q) => (p.el === "H" ? 1 : 0) - (q.el === "H" ? 1 : 0));
}

export function IonBlock({ center, lig, n, extra = 0, q, hideCharge = false }: { center: string; lig: string; n: number; extra?: number; q: number; hideCharge?: boolean }) {
  const balls = layout(center, lig, n, extra);
  const S = 80; // fester Rahmen: das Bild springt nicht, wenn sich die Anzahl ändert
  const label = tr(`${balls.length} Atome, Ladung ${q ? signed(q) : "keine"}`, `${balls.length} atoms, charge ${q ? signed(q) : "none"}`);
  return (
    <svg className="k4-block" viewBox={`${-S - 14} ${-S - 6} ${2 * S + 70} ${2 * S + 12}`} role="img" aria-label={label}>
      <path className="k4-brk" d={`M ${-S + 12} ${-S} h -14 v ${2 * S} h 14 M ${S - 12} ${-S} h 14 v ${2 * S} h -14`} />
      {balls.map((b, i) => (
        <g key={i} className={`k4-at ${b.el}`} aria-label={elName(b.el)}>
          <circle cx={b.x} cy={b.y} r={b.r} />
          <text x={b.x} y={b.y} dy=".35em" style={{ fontSize: b.r * 0.95 }}>{b.el}</text>
        </g>
      ))}
      {!hideCharge && <text className={`k4-charge${q ? "" : " none"}`} x={S + 10} y={-S + 22}>{q ? (Math.abs(q) > 1 ? Math.abs(q) : "") + (q > 0 ? "+" : "−") : "0"}</text>}
    </svg>
  );
}

/* ── Modell 1: Ion bauen – Atome und Ladung einstellen, Formel (und Name) erscheinen ── */
export interface IonState { n: number; h: number; q: number }
/** bekanntes mehratomiges Ion zur Formel (oder keins) */
const polyByFormula = (f: string) => [...CATIONS, ...ANIONS].find(i => i.Z === undefined && i.formula === f);

export function IonModel({ c, center, lig, init, sol, steps, showFormula = true, showName = false, maxN = 5 }: {
  c: GuideCtx; center: string; lig: string; init: IonState; sol: IonState;
  /** welche Zähler: n = Liganden, h = H-Atome, q = Ladung (ohne q: Ladung aus der Liste der Ionen) */
  steps: ("n" | "h" | "q")[]; showFormula?: boolean; showName?: boolean; maxN?: number;
}) {
  const [s, set] = useModel<IonState>(c, init, sol);
  const f = `${s.h ? `H${s.h > 1 ? s.h : ""}` : ""}${center}${s.n ? `${lig}${s.n > 1 ? s.n : ""}` : ""}`;
  const known = polyByFormula(f);
  const q = steps.includes("q") ? s.q : known ? known.charge : 0;
  const auto = !steps.includes("q");
  const dis = c.solved;
  const shown = showFormula || c.solved;
  return (
    <ModelFrame c={c} className={`k4-m${c.solved ? " k4-solved" : ""}`}
      stage={
        <div className="k4-ion">
          <div className="k4-ion-pic"><IonBlock center={center} lig={lig} n={s.n} extra={s.h} q={q} hideCharge={auto && !known} /></div>
          <div className="k4-ion-f" aria-live="polite">{shown ? (auto && !known ? <span className="k4-none">{toSubscript(f)} ?</span> : ionStr(f, q)) : "?"}</div>
          {(showName || c.solved) && <div className="k4-ion-n">{known && (!steps.includes("q") || known.charge === q) ? known.name : auto ? tr("kein Ion aus diesem Kapitel", "no ion from this chapter") : "–"}</div>}
        </div>
      }
      controls={
        <div className="k4-ctl">
          {steps.includes("n") && <Count label={tr(`${lig}-Atome`, `${lig} atoms`)} value={s.n} min={0} max={maxN} disabled={dis} set={n => set({ ...s, n })} />}
          {steps.includes("h") && <Count label={tr("H-Atome", "H atoms")} value={s.h} min={0} max={2} disabled={dis} set={h => set({ ...s, h })} />}
          {steps.includes("q") && <Count label={tr("Ladung", "Charge")} value={s.q} min={-4} max={3} disabled={dis} set={v => set({ ...s, q: v })} show={v => (v ? signed(v) : "0")} />}
        </div>
      }
      onCheck={() => c.pick(ionStr(f, q))} />
  );
}

/* ── Modell 2: Namensbaukasten – je Reihe ein Baustein, der Name entsteht sofort ── */
export interface Slot { id: string; items: string[] }
export function NameKit({ c, figure, slots, sol, join = "" }: {
  c: GuideCtx; figure: ReactNode; slots: Slot[]; sol: string[];
  /** zwischen den Bausteinen (Englisch: Leerzeichen zwischen Kation und Anion) */
  join?: string;
}) {
  const [s, set] = useModel<string[]>(c, slots.map(() => ""), sol);
  const name = s.filter(Boolean).join(join);
  return (
    <ModelFrame c={c} className={`k4-m${c.solved ? " k4-solved" : ""}`}
      stage={
        <div className="k4-name">
          <div className="k4-name-fig">{figure}</div>
          <div className="k4-name-out" aria-live="polite">
            {s.every(Boolean) ? <span className="on">{name}</span> : s.map((p, i) => <span key={i} className={p ? "on" : "gap"}>{p || "?"}</span>)}
          </div>
        </div>
      }
      controls={
        <div className="k4-kit">
          {slots.map((sl, i) => (
            <div key={sl.id} className="k4-kit-row" role="group">
              {sl.items.map(t => (
                <button key={t} type="button" className="k4-chip" aria-pressed={s[i] === t} disabled={c.solved}
                  onClick={() => set(s.map((v, j) => (j === i ? (v === t ? "" : t) : v)))}>{t}</button>
              ))}
            </div>
          ))}
        </div>
      }
      onCheck={() => c.pick(s.every(Boolean) ? name : "–")} />
  );
}

/* ── Modell 3: Ionenwand mit Zählern – Wand und Formel (mit Klammern) sofort ── */
export function wallResult(ci: Ion, ai: Ion, nC: number, nA: number) {
  if (nC * ci.charge !== nA * -ai.charge) return "≠";
  const r = ratio(ci, ai);
  return toSubscript(nC === r.nC && nA === r.nA ? formula(ci, ai) : formula(ci, ai, nC, nA));
}
/** Rückmeldungen für die Ionenwand: nicht ausgeglichen, ausgeglichen mit zu großen Zahlen */
export function wallWhy(cat: string, an: string): Record<string, string> {
  const ci = ion(cat), ai = ion(an), r = ratio(ci, ai);
  const out: Record<string, string> = {
    "≠": tr("Die Reihen sind noch nicht gleich lang: Plus und Minus gleichen sich nicht aus.", "The rows are not the same length yet: plus and minus do not balance."),
  };
  for (let k = 2; k <= 4; k++) out[toSubscript(formula(ci, ai, r.nC * k, r.nA * k))] = tr("Ausgeglichen, aber nicht mit den kleinsten Zahlen. Nimm weniger Bausteine.", "Balanced, but not with the smallest numbers. Use fewer tiles.");
  return out;
}

export function WallModel({ c, cat, an, init, sol, name = false }: { c: GuideCtx; cat: string; an: string; init: [number, number]; sol: [number, number]; name?: boolean }) {
  const [s, set] = useModel<[number, number]>(c, init, sol);
  const ci = ion(cat), ai = ion(an);
  return (
    <ModelFrame c={c} className={`k4-m${c.solved ? " k4-solved" : ""}`}
      stage={<Fit className="k4-wall" min={0.3}><IonWall cation={ci} anion={ai} nC={s[0]} nA={s[1]} showName={name || c.solved} /></Fit>}
      controls={
        <div className="k4-ctl">
          <Count label={<IonLabel ion={ci} />} value={s[0]} min={1} max={4} disabled={c.solved} set={v => set([v, s[1]])} />
          <Count label={<IonLabel ion={ai} />} value={s[1]} min={1} max={4} disabled={c.solved} set={v => set([s[0], v])} />
        </div>
      }
      onCheck={() => c.pick(wallResult(ci, ai, s[0], s[1]))} />
  );
}

/* ── Modell 4: Formel schreiben – Klammer an/aus, Zahl dahinter; Atome laut Formel und laut Wand im Vergleich ── */
export interface WriteState { br: boolean; k: number }
export function written(ci: Ion, ai: Ion, nC: number, nA: number, which: "C" | "A", s: WriteState) {
  const part = (i: Ion, n: number, mine: boolean) => {
    if (!mine) return n === 1 ? i.formula : i.Z !== undefined ? `${i.formula}${n}` : `(${i.formula})${n}`;
    const k = s.k > 1 ? String(s.k) : "";
    return s.br ? `(${i.formula})${k}` : `${i.formula}${k}`;
  };
  return part(ci, nC, which === "C") + part(ai, nA, which === "A");
}

export function WriteModel({ c, cat, an, nC, nA, which, init, sol }: {
  c: GuideCtx; cat: string; an: string; nC: number; nA: number; which: "C" | "A"; init: WriteState; sol: WriteState;
}) {
  const [s, set] = useModel<WriteState>(c, init, sol);
  const ci = ion(cat), ai = ion(an);
  const f = written(ci, ai, nC, nA, which, s);
  const have = atomsOf(f);
  const want = atomsOf(`(${ci.formula})${nC}(${ai.formula})${nA}`);
  const els = Object.keys(want);
  const mine = which === "C" ? ci : ai;
  return (
    <ModelFrame c={c} className={`k4-m${c.solved ? " k4-solved" : ""}`}
      stage={
        <div className="k4-write">
          <Fit className="k4-wall" min={0.3}><IonWall cation={ci} anion={ai} nC={nC} nA={nA} showFormula={false} /></Fit>
          <div className="k4-write-f" aria-live="polite"><Formula f={f} /></div>
          <table className="k4-cnt">
            <tbody>
              <tr><th scope="row">{tr("Ionen", "Ions")}</th>{els.map(e => <td key={e}>{e} {want[e]}</td>)}</tr>
              <tr><th scope="row">{tr("Formel", "Formula")}</th>{els.map(e => {
                const ok = (have[e] ?? 0) === want[e];
                return <td key={e} className={ok ? "ok" : "bad"}>{ok ? "✓" : "≠"} {e} {have[e] ?? 0}</td>;
              })}</tr>
            </tbody>
          </table>
        </div>
      }
      controls={
        <div className="k4-ctl">
          <button type="button" className="k4-chip k4-br" aria-pressed={s.br} disabled={c.solved} onClick={() => set({ ...s, br: !s.br })}>
            ( {toSubscript(mine.formula)} ) <small>{s.br ? tr("mit Klammer", "brackets") : tr("ohne Klammer", "no brackets")}</small>
          </button>
          <Count label={tr("Index", "Subscript")} value={s.k} min={1} max={4} disabled={c.solved} set={k => set({ ...s, k })} />
        </div>
      }
      onCheck={() => c.pick(toSubscript(f))} />
  );
}

/* ── Modell 5: Ionen wählen – die Wand gleicht aus, Formel erscheint ── */
export function PickModel({ c, cats, ans, sol }: { c: GuideCtx; cats: string[]; ans: string[]; sol: [string, string] }) {
  const [s, set] = useModel<[string, string]>(c, ["", ""], sol);
  const ci = s[0] ? ion(s[0]) : undefined, ai = s[1] ? ion(s[1]) : undefined;
  const r = ci && ai ? ratio(ci, ai) : undefined;
  return (
    <ModelFrame c={c} className={`k4-m${c.solved ? " k4-solved" : ""}`}
      stage={ci && ai && r
        ? <Fit className="k4-wall" min={0.3}><IonWall cation={ci} anion={ai} nC={r.nC} nA={r.nA} showName={c.solved} /></Fit>
        : <div className="k4-empty" aria-hidden="true"><span className="k4-slot cation">{ci ? <IonLabel ion={ci} /> : "+"}</span><span className="k4-slot anion">{ai ? <IonLabel ion={ai} /> : "−"}</span></div>}
      controls={
        <div className="k4-kit">
          {([[cats, 0, "cation"], [ans, 1, "anion"]] as const).map(([list, k, cls]) => (
            <div key={k} className="k4-kit-row" role="group" aria-label={k === 0 ? tr("Kation", "Cation") : "Anion"}>
              {list.map(id => (
                <button key={id} type="button" className={`k4-chip ${cls}`} aria-pressed={s[k] === id} disabled={c.solved}
                  onClick={() => set(k === 0 ? [id, s[1]] : [s[0], id])}><IonLabel ion={ion(id)} /></button>
              ))}
            </div>
          ))}
        </div>
      }
      onCheck={() => c.pick(ci && ai ? toSubscript(formula(ci, ai)) : "–")} />
  );
}

/* ── Bild: nicht aus einzelnen Ionen zusammengesetzt ── */
export function NotMixture() {
  return (
    <div className="k4-mix">
      <figure className="k4-mix-no">
        <div className="k4-mix-ions" aria-hidden="true">
          <span className="k4-mix-i S">S<sup>2−</sup></span>
          {[0, 1, 2, 3].map(i => <span key={i} className="k4-mix-i O">O<sup>2−</sup></span>)}
        </div>
        <figcaption><b>✗</b> {tr("einzelne Ionen: 10−", "single ions: 10−")}</figcaption>
      </figure>
      <figure className="k4-mix-yes">
        <div className="k4-ion-pic"><IonBlock center="S" lig="O" n={4} q={-2} /></div>
        <figcaption><b>✓</b> {tr("eine Atomgruppe: 2−", "one atom group: 2−")}</figcaption>
      </figure>
    </div>
  );
}

/** großes Ion als Formel (für Zählaufgaben) – nach dem Lösen zusätzlich die Atome */
export function BigIon({ c, center, lig, n, q }: { c: GuideCtx; center: string; lig: string; n: number; q: number }) {
  return (
    <div className="k4-big">
      <div className="k4-big-f">{ionStr(`${center}${lig}${n}`, q)}</div>
      {c.solved && <div className="k4-ion-pic"><IonBlock center={center} lig={lig} n={n} q={q} /></div>}
    </div>
  );
}

/** Englisch: Name einer Verbindung mit Leerzeichen */
export const nameJoin = () => (getLang() === "en" ? " " : "");
