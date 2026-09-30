// „Neutralisationswand“ wie die Ionenwand der Ionenbindung – Breite eines Bausteins = Ladung:
//   Reihe 1  Kationen der Lauge (gold)        Ba²⁺ Ba²⁺ Ba²⁺
//   Reihe 2  OH⁻ der Lauge (blau)              OH⁻ ×6
//            ─ je Spalte trifft ein OH⁻ auf ein H⁺ → H₂O ─
//   Reihe 3  H⁺ der Säure (blau)               H⁺ ×6
//   Reihe 4  Säurereste (grün)                 PO₄³⁻ PO₄³⁻
// Neutral, wenn die OH⁻- und die H⁺-Reihe gleich lang sind. „Reaktion“ zeigt die Produkte: Salz (Reihe 1 + 4) und Wasser.

import type { CSSProperties, ReactNode } from "react";
import { Formula } from "@lern/chem-ui";
import { ionChargeText, neutralCounts, neutralEquation, equationText, restOf, type Hydroxide, type Ion, type ProticAcid } from "@lern/chem";

type Kind = "cat" | "an" | "oh" | "h" | "water";

/** Formel + Ladung, z. B. PO₄³⁻ */
export function IonLabel({ ion }: { ion: Pick<Ion, "formula" | "charge"> }) {
  return <span className="ion-label"><Formula f={ion.formula} /><sup>{ionChargeText(ion.charge)}</sup></span>;
}
const H: Pick<Ion, "formula" | "charge"> = { formula: "H", charge: 1 };
const OH: Pick<Ion, "formula" | "charge"> = { formula: "OH", charge: -1 };

/** Gleichung als Text, umbrechen nur zwischen den Stoffen (nie „6 / H₂O“) */
export function EqLine({ text }: { text: string }) {
  return <>{text.split(/( \+ | → )/).map((p, i) => (i % 2 ? <span key={i}>{p}</span> : <span key={i} className="nw-term">{p}</span>))}</>;
}

/** Ein Baustein; `w` = Breite in Spalten, Schrift passt sich der Länge der Beschriftung an */
export function Tile({ kind, w = 1, label, len }: { kind: Kind; w?: number; label: ReactNode; len: number }) {
  return <span className={`nt nt-${kind}`} style={{ "--w": w, "--len": Math.max(3, len) } as CSSProperties}>{label}</span>;
}
const ionLen = (ion: Pick<Ion, "formula" | "charge">) => ion.formula.length + (Math.abs(ion.charge) > 1 ? 1.4 : 0.8);

export const catTile = (b: Hydroxide) => <Tile kind="cat" w={b.cation.charge} label={<IonLabel ion={b.cation} />} len={ionLen(b.cation)} />;
export const restTile = (r: Ion) => <Tile kind="an" w={-r.charge} label={<IonLabel ion={r} />} len={ionLen(r)} />;
export const ohTile = () => <Tile kind="oh" label={<IonLabel ion={OH} />} len={3} />;
export const hTile = () => <Tile kind="h" label={<IonLabel ion={H} />} len={2} />;
export const waterTile = () => <Tile kind="water" label={<Formula f="H2O" />} len={3.2} />;

/** Eine Formeleinheit (Lauge oder Säure) als Block über `w` Spalten und zwei Reihen */
function Unit({ w, col, row, top, bottom, label, onClick }: {
  w: number; col: number; row: number; top: ReactNode; bottom: ReactNode; label: string; onClick?: () => void;
}) {
  const style = { gridColumn: `${col + 1} / span ${w}`, gridRow: `${row} / span 2`, "--w": w } as CSSProperties;
  const inner = <>{top}{bottom}</>;
  if (!onClick) return <span className="nw-unit" style={style} aria-label={label}>{inner}</span>;
  return <button type="button" className="nw-unit" style={style} aria-label={`${label} – Zerfall in Ionen anzeigen`} onClick={onClick}>{inner}</button>;
}

export function NeutralWall({ base, acid, step, nB, nA, products = false, showResult = true, onUnit }: {
  base: Hydroxide; acid: ProticAcid; step: number; nB: number; nA: number;
  /** Produkte zeigen (nur wenn neutral) */
  products?: boolean;
  showResult?: boolean;
  onUnit?: (which: "base" | "acid") => void;
}) {
  const q = base.cation.charge, r = restOf(acid, step), k = step;
  const { oh, h, balanced } = neutralCounts(base, k, nB, nA);
  const cols = Math.max(oh, h);
  const n = neutralEquation(base, acid, k);
  const salts = balanced ? nB / n.nBase : 0;
  const showProducts = products && balanced;
  const pairs = Math.min(oh, h);
  const grid = { "--cols": cols } as CSSProperties;

  return (
    <div className={`nw${balanced ? " balanced" : ""}${showProducts ? " products" : ""}`}>
      {showProducts ? (
        <div className="nw-grid" style={grid} key="p">
          {/* Salz: Kationen und Säurereste bleiben als Ionen zusammen */}
          {Array.from({ length: nB }, (_, i) => <span key={`c${i}`} className="nw-cell" style={{ gridColumn: `${i * q + 1} / span ${q}`, gridRow: 1 }}>{catTile(base)}</span>)}
          {Array.from({ length: nA }, (_, i) => <span key={`a${i}`} className="nw-cell" style={{ gridColumn: `${i * k + 1} / span ${k}`, gridRow: 2 }}>{restTile(r)}</span>)}
          <span className="nw-tag" style={{ gridColumn: `1 / span ${cols}`, gridRow: 3 }}>Salz · <Formula f={n.salt} />{salts > 1 && ` × ${salts}`}</span>
          {Array.from({ length: oh }, (_, i) => <span key={`w${i}`} className="nw-cell" style={{ gridColumn: i + 1, gridRow: 4 }}>{waterTile()}</span>)}
          <span className="nw-tag" style={{ gridColumn: `1 / span ${cols}`, gridRow: 5 }}>Wasser · {oh} H<sub>2</sub>O</span>
        </div>
      ) : (
        <div className="nw-grid" style={grid} key="e">
          {Array.from({ length: nB }, (_, i) => (
            <Unit key={`b${i}`} w={q} col={i * q} row={1} label={base.name} onClick={onUnit && (() => onUnit("base"))}
              top={catTile(base)} bottom={<span className="nw-sub">{Array.from({ length: q }, (_, j) => <span key={j}>{ohTile()}</span>)}</span>} />
          ))}
          {h > oh && <span className="nw-gap" style={{ gridColumn: `${oh + 1} / span ${h - oh}`, gridRow: 2 }} role="img" aria-label={`es fehlen ${h - oh} OH⁻`} />}
          {/* Verbindungen: je H⁺ + OH⁻ ein Wassermolekül */}
          {Array.from({ length: cols }, (_, i) => <i key={`l${i}`} className={`nw-link${i < pairs ? " on" : ""}`} style={{ gridColumn: i + 1, gridRow: 3 }} />)}
          {Array.from({ length: nA }, (_, i) => (
            <Unit key={`s${i}`} w={k} col={i * k} row={4} label={acid.name} onClick={onUnit && (() => onUnit("acid"))}
              top={<span className="nw-sub">{Array.from({ length: k }, (_, j) => <span key={j}>{hTile()}</span>)}</span>} bottom={restTile(r)} />
          ))}
          {oh > h && <span className="nw-gap" style={{ gridColumn: `${h + 1} / span ${oh - h}`, gridRow: 4 }} role="img" aria-label={`es fehlen ${oh - h} H⁺`} />}
        </div>
      )}
      {showResult && (
        <div className="nw-result">
          <p className="nw-eq">
            {balanced
              ? <EqLine text={equationText(n.eq, [nB, nA, salts, oh])} />
              : <><EqLine text={equationText({ left: n.eq.left, right: [] }, [nB, nA]).replace(/ →\s*$/, "")} /><span>{" → "}</span><span>?</span></>}
          </p>
          <p className={`nw-balance${balanced ? " ok" : ""}`}>
            {balanced ? `✓ ${oh} OH⁻ + ${h} H⁺ → ${oh} H₂O` : `≠ ${nB} · ${q} OH⁻ = ${oh} OH⁻  aber  ${nA} · ${k} H⁺ = ${h} H⁺`}
          </p>
          {balanced && <p className="nw-name">{n.saltName} + Wasser</p>}
        </div>
      )}
    </div>
  );
}
