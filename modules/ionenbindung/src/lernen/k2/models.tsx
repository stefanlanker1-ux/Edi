// Kapitel 2 „Formel und Name“ – Modelle der Folien: Ionenwand mit Anzahl-Steppern, Formel-Baukasten (Index-Stepper, Reihenfolge),
// Namens-Baukasten (Wortteile antippen) und Ionenwahl (Ladung aus dem PSE einstellen, dann ausgleichen). Jede Änderung zeigt das Modell sofort,
// „Prüfen“ meldet das Gebaute als Text (Schlüssel für `why` über die Funktionen hier – dieselben Texte wie beim Prüfen).

import type { CSSProperties, ReactNode } from "react";
import { Fit, Icon, type GuideCtx } from "@lern/ui";
import { ION_BY_ID, formula, ionText, toSubscript, type Ion } from "@lern/chem";
import { getLang, tr } from "@lern/i18n";
import { IonWall } from "../../components/IonWall.tsx";
import { IonLabel, IonTile } from "../../components/IonTile.tsx";
import { IonLattice } from "../../components/IonLattice.tsx";
import { ModelFrame, useModel } from "../model.tsx";

/** Ion nach Kennung – auch mit einer Ladung, die das Element nicht bildet (Ionenwahl: „Ca+“, „N2-“) */
export function ionOf(id: string): Ion {
  if (ION_BY_ID[id]) return ION_BY_ID[id];
  const m = /^([A-Z][a-z]?)(\d*)([+-])$/.exec(id);
  if (!m) throw new Error(`Ion ${id}`);
  const base = Object.values(ION_BY_ID).find(i => i.formula === m[1] && i.Z !== undefined);
  if (!base) throw new Error(`Ion ${id}`);
  return { ...base, id, charge: (m[3] === "+" ? 1 : -1) * Number(m[2] || 1) };
}
const idOf = (sym: string, charge: number) => `${sym}${Math.abs(charge) > 1 ? Math.abs(charge) : ""}${charge > 0 ? "+" : "-"}`;

/** Ionenwand ohne Formel: „2 Na⁺ + 1 O²⁻“ */
export const wallKey = (cat: string, an: string, nC: number, nA: number) => `${nC} ${ionText(ionOf(cat))} + ${nA} ${ionText(ionOf(an))}`;

/** gebaute Formel: neutral → „Na₂O“ (wie gebaut, auch ungekürzt), sonst mit den Ladungssummen „NaO (1+ / 2−)“ */
export function builtKey(cat: string, an: string, nC: number, nA: number) {
  const ci = ionOf(cat), ai = ionOf(an);
  const pos = nC * ci.charge, neg = nA * -ai.charge;
  const f = toSubscript(formula(ci, ai, nC, nA));
  return pos === neg ? f : `${f} (${pos}+ / ${neg}−)`;
}

/** Formel aus dem Baukasten: Indizes wie eingestellt, Reihenfolge wie gewählt („Cl₂Ca“) */
export function formulaKey(cat: string, an: string, nC: number, nA: number, swap = false) {
  const p = (sym: string, n: number) => sym + (n > 1 ? toSubscript(String(n)) : "");
  const a = p(ionOf(cat).formula, nC), b = p(ionOf(an).formula, nA);
  return swap ? b + a : a + b;
}

/* ── Ionenwand ─────────────────────────────────────────────────────────── */

function Wall({ cat, an, nC, nA, formula: f = false }: { cat: Ion; an: Ion; nC: number; nA: number; formula?: boolean }) {
  return <Fit className="k2-fit" min={0.3}><IonWall cation={cat} anion={an} nC={nC} nA={nA} showFormula={f} showName={false} /></Fit>;
}

/** Bild ohne Bedienung: Ionenwand */
export function StaticWall({ cat, an, nC, nA, calc = true }: { cat: string; an: string; nC: number; nA: number; calc?: boolean }) {
  return <div className={`k2-static${calc ? "" : " k2-nocalc"}`}><Wall cat={ionOf(cat)} an={ionOf(an)} nC={nC} nA={nA} /></div>;
}

/** Bild ohne Bedienung: Ausschnitt aus dem Kochsalz-Kristall */
export function Crystal() {
  return <div className="k2-static k2-crystal"><IonLattice cols={5} rows={3} /></div>;
}

/** schmaler Zähler [Beschriftung] − n + (Tippziele 44 px): zwei passen nebeneinander, auch am schmalen Handy */
function Count({ label, aria, value, set, max, tone }: { label?: ReactNode; aria: string; value: number; set: (v: number) => void; max: number; tone?: "cation" | "anion" }) {
  return (
    <div className={`k2-count${tone ? ` ${tone}` : ""}`} role="group" aria-label={aria}>
      {label && <span className="k2-count-l">{label}</span>}
      <button type="button" className="k2-key" aria-label={tr(`${aria}: weniger`, `${aria}: less`)} disabled={value <= 1} onClick={() => set(value - 1)}><Icon name="minus" size={18} /></button>
      <output>{value}</output>
      <button type="button" className="k2-key" aria-label={tr(`${aria}: mehr`, `${aria}: more`)} disabled={value >= max} onClick={() => set(value + 1)}><Icon name="plus" size={18} /></button>
    </div>
  );
}

function Counts({ cat, an, n, set, max }: { cat: Ion; an: Ion; n: [number, number]; set: (n: [number, number]) => void; max: number }) {
  return (
    <>
      <Count tone="cation" label={<IonLabel ion={cat} />} aria={tr(`Anzahl ${cat.name}`, `Number of ${cat.name}`)} value={n[0]} max={max} set={v => set([v, n[1]])} />
      <Count tone="anion" label={<IonLabel ion={an} />} aria={tr(`Anzahl ${an.name}`, `Number of ${an.name}`)} value={n[1]} max={max} set={v => set([n[0], v])} />
    </>
  );
}

/** Ionenwand mit Steppern: Kationen und Anionen hinzufügen – die Wand (und mit `formula` die Formel) ändert sich sofort */
export function WallModel({ c, cat, an, start, sol, formula: f = false, max = 4 }: {
  c: GuideCtx; cat: string; an: string; start: [number, number]; sol: [number, number]; formula?: boolean; max?: number;
}) {
  const [n, set] = useModel<[number, number]>(c, start, sol);
  const ci = ionOf(cat), ai = ionOf(an);
  return (
    <ModelFrame c={c} className="k2-m"
      stage={<Wall cat={ci} an={ai} nC={n[0]} nA={n[1]} formula={f} />}
      controls={<fieldset className="k2-ctl k2-pair" disabled={c.solved}><Counts cat={ci} an={ai} n={n} set={set} max={max} /></fieldset>}
      onCheck={() => c.pick(f ? builtKey(cat, an, n[0], n[1]) : wallKey(cat, an, n[0], n[1]))} />
  );
}

/* ── Formel-Baukasten ──────────────────────────────────────────────────── */

interface FState { i: [number, number]; swap: boolean }

/** Formel mit Indizes bauen: Stepper je Symbol, Reihenfolge tauschen; darunter die Ionenwand dazu (zeigt sofort, ob neutral) */
export function FormulaModel({ c, cat, an, start, sol, max = 4 }: { c: GuideCtx; cat: string; an: string; start: [number, number]; sol: [number, number]; max?: number }) {
  const [s, set] = useModel<FState>(c, { i: start, swap: false }, { i: sol, swap: false });
  const ci = ionOf(cat), ai = ionOf(an);
  const part = (ion: Ion, n: number) => (
    <span key={ion.id} className={`k2-fm-el ${ion.charge > 0 ? "cation" : "anion"}`}>{ion.formula}{n > 1 && <sub className="k2-idx">{n}</sub>}</span>
  );
  const parts = [part(ci, s.i[0]), part(ai, s.i[1])];
  return (
    <ModelFrame c={c} className="k2-m"
      stage={
        <div className="k2-fm">
          <div className="k2-fm-f" aria-label={tr(`Formel ${formulaKey(cat, an, s.i[0], s.i[1], s.swap)}`, `Formula ${formulaKey(cat, an, s.i[0], s.i[1], s.swap)}`)}>
            {s.swap ? parts.reverse() : parts}
          </div>
          <Wall cat={ci} an={ai} nC={s.i[0]} nA={s.i[1]} />
        </div>
      }
      controls={
        <fieldset className="k2-ctl k2-fm-ctl" disabled={c.solved}>
          <Count tone="cation" label={ci.formula} aria={tr(`Index ${ci.formula}`, `Subscript ${ci.formula}`)} value={s.i[0]} max={max} set={v => set({ ...s, i: [v, s.i[1]] })} />
          <Count tone="anion" label={ai.formula} aria={tr(`Index ${ai.formula}`, `Subscript ${ai.formula}`)} value={s.i[1]} max={max} set={v => set({ ...s, i: [s.i[0], v] })} />
          <button type="button" className="k2-key k2-swap" aria-pressed={s.swap} aria-label={tr("Reihenfolge tauschen", "Swap order")} onClick={() => set({ ...s, swap: !s.swap })}>
            <Icon name="swap" size={18} /> <span className="k2-swap-t">{tr("Reihenfolge", "Order")}</span>
          </button>
        </fieldset>
      }
      onCheck={() => c.pick(formulaKey(cat, an, s.i[0], s.i[1], s.swap))} />
  );
}

/* ── Namens-Baukasten ──────────────────────────────────────────────────── */

/** Wortteil: m = Metall, s = Nichtmetall (Name oder Wortstamm), e = Endung, n = Zahlwort */
export interface Piece { t: string; k: "m" | "s" | "e" | "n" }

/** Name aus Wortteilen: deutsch zusammengeschrieben („Calciumchlorid“), englisch Metall als eigenes Wort („Calcium chloride“) */
export function nameOf(pieces: Piece[], idx: number[]) {
  const ps = idx.map(i => pieces[i]);
  let out = "";
  ps.forEach((p, j) => {
    const t = p.t.replace(/^-/, "");
    if (getLang() === "en" && j > 0 && (p.k === "m" || ps[j - 1].k === "m")) out += " ";
    out += t;
  });
  return out ? out[0].toUpperCase() + out.slice(1).toLowerCase() : "";
}

const MAX_PIECES = 4;

/** Namen aus Wortteilen zusammensetzen: Antippen hängt den Teil an, ⌫ nimmt den letzten weg – der Name steht sofort neben der Formel */
export function NameModel({ c, f, pieces, sol }: { c: GuideCtx; f: string; pieces: Piece[]; sol: number[] }) {
  const [s, set] = useModel<number[]>(c, [], sol);
  const name = nameOf(pieces, s);
  return (
    <ModelFrame c={c} className="k2-m"
      stage={
        <div className="k2-nm">
          <div className="k2-nm-f">{toSubscript(f)}</div>
          <Icon name="arrow" size={24} className="k2-nm-arrow" />
          <div className="k2-nm-parts" aria-hidden="true">
            {s.length ? s.map((i, j) => <span key={j} className={`k2-part k-${pieces[i].k}`}>{pieces[i].t}</span>) : <span className="k2-part k-empty">?</span>}
          </div>
          <div className={`k2-nm-name${name ? "" : " empty"}`} aria-live="polite">{name || tr("Name …", "Name …")}</div>
        </div>
      }
      controls={
        <fieldset className="k2-ctl k2-tray" disabled={c.solved}>
          {pieces.map((p, i) => (
            <button key={i} type="button" className={`k2-key k2-piece k-${p.k}`} disabled={s.length >= MAX_PIECES} onClick={() => set([...s, i])}>{p.t}</button>
          ))}
          <button type="button" className="k2-key k2-back" disabled={!s.length} onClick={() => set(s.slice(0, -1))} aria-label={tr("letzten Teil löschen", "delete last part")}>⌫</button>
        </fieldset>
      }
      onCheck={() => c.pick(name || "—")} />
  );
}

/* ── Ionenwahl: Ladung einstellen, dann ausgleichen ─────────────────────── */

interface PState { z: [number, number]; n: [number, number] }

/** Ergebnis der Ionenwahl, solange eine Ladung noch nicht gewählt ist */
export const PICK_NONE = "?";

/** Wand, solange nicht beide Ionen stimmen: nicht gewählte Ladung = gestrichelter Baustein „Ca ?“, gewählte = Baustein in seiner Breite;
 *  keine Ladungsrechnung, kein ✓ und keine Formel (ein Ion wie Ca⁺ gibt es nicht) */
function PendingWall({ sym, z, n }: { sym: [string, string]; z: [number, number]; n: [number, number] }) {
  const row = (k: 0 | 1) => {
    const ion = z[k] ? ionOf(idOf(sym[k], z[k])) : null;
    const cls = k ? "anion" : "cation";
    return Array.from({ length: n[k] }, (_, i) => ion
      ? <IonTile key={i} ion={ion} />
      : <span key={i} className={`ion-tile ${cls} k2-q`} style={{ gridColumn: "span 1" }}>{sym[k]} ?</span>);
  };
  const width = (k: 0 | 1) => n[k] * Math.max(1, Math.abs(z[k]));
  return (
    <Fit className="k2-fit" min={0.3}>
      <div className="ion-wall k2-pw">
        <div className="iw-stack" style={{ "--cols": Math.max(width(0), width(1)) } as CSSProperties}>
          <div className="iw-row">{row(0)}</div>
          <div className="iw-row">{row(1)}</div>
        </div>
        {(!z[0] || !z[1]) && <p className="iw-balance">{tr("Ladungen wählen", "Choose the charges")}</p>}
      </div>
    </Fit>
  );
}

/**
 * Vom Namen zur Formel: Ladung des Metall- und des Nichtmetall-Ions wählen (anfangs keine; die Bausteine werden sofort breiter/schmaler),
 * dann die Anzahlen einstellen. Ausgleich, ✓ und Formel erst, wenn beide Ladungen stimmen. Prüfen meldet „?“ (Ladung fehlt),
 * ein Ion, das das Element nicht bildet („Ca⁺“), oder die gebaute Formel (`builtKey`).
 */
export function PickModel({ c, cat, an, sol, max = 4 }: {
  c: GuideCtx; cat: string; an: string; sol: [[number, number], [number, number]]; max?: number;
}) {
  const [s, set] = useModel<PState>(c, { z: [0, 0], n: [1, 1] }, { z: sol[0], n: sol[1] });
  const real = s.z[0] === sol[0][0] && s.z[1] === sol[0][1];
  const cId = idOf(cat, s.z[0] || 1), aId = idOf(an, s.z[1] || -1);
  const result = () => (!s.z[0] || !s.z[1] ? PICK_NONE
    : s.z[0] !== sol[0][0] ? ionText(ionOf(cId)) : s.z[1] !== sol[0][1] ? ionText(ionOf(aId)) : builtKey(cId, aId, s.n[0], s.n[1]));
  const charges = (sym: string, k: 0 | 1): ReactNode => (
    <div className={`k2-z ${k ? "anion" : "cation"}`} role="group" aria-label={tr(`Ladung ${sym}`, `Charge ${sym}`)}>
      {[1, 2, 3].map(v => {
        const z = k ? -v : v;
        return (
          <button key={v} type="button" className="k2-key" aria-pressed={s.z[k] === z} onClick={() => set({ ...s, z: k ? [s.z[0], z] : [z, s.z[1]] })}>
            {ionText(ionOf(idOf(sym, z)))}
          </button>
        );
      })}
    </div>
  );
  return (
    <ModelFrame c={c} className="k2-m"
      stage={real ? <Wall cat={ionOf(cId)} an={ionOf(aId)} nC={s.n[0]} nA={s.n[1]} formula /> : <PendingWall sym={[cat, an]} z={s.z} n={s.n} />}
      controls={
        <fieldset className="k2-ctl k2-pick" disabled={c.solved}>
          <div className="k2-col">{charges(cat, 0)}<Count aria={tr(`Anzahl ${cat}`, `Number of ${cat}`)} value={s.n[0]} max={max} set={v => set({ ...s, n: [v, s.n[1]] })} /></div>
          <div className="k2-col">{charges(an, 1)}<Count aria={tr(`Anzahl ${an}`, `Number of ${an}`)} value={s.n[1]} max={max} set={v => set({ ...s, n: [s.n[0], v] })} /></div>
        </fieldset>
      }
      onCheck={() => c.pick(result())} />
  );
}
