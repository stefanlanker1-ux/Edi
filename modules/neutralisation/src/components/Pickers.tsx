// Auswahl von Lauge und Säure, Säuretabelle (nach Anzahl abgebbarer H⁺: einprotonig, zweiprotonig, dreiprotonig) und
// Blatt „Zerfall in Ionen“ beim Antippen einer Formeleinheit.

import { Sheet, Tag } from "@lern/ui";
import { Formula } from "@lern/chem-ui";
import {
  PROTIC_ACIDS, hydroxidesFor, hydroxideDissociation, protolysis, proticWord, restName, parseFormula, type Hydroxide, type ProticAcid,
} from "@lern/chem";
import { IonLabel, catTile, hTile, ohTile, restTile } from "./NeutralWall.tsx";
import { tr } from "@lern/i18n";

export function BasePicker({ value, os, onPick }: { value: string; os: boolean; onPick: (id: string) => void }) {
  return (
    <div className="ip-list" role="radiogroup" aria-label={tr("Metallhydroxid", "Metal hydroxide")}>
      {hydroxidesFor(os).map(b => (
        <button key={b.id} type="button" role="radio" aria-checked={b.id === value} className={`ip-chip base${b.id === value ? " on" : ""}`} onClick={() => onPick(b.id)}>
          <b><Formula f={b.formula} /></b><span>{b.lauge ?? b.name}</span>
        </button>
      ))}
    </div>
  );
}

const GROUPS: [number, string][] = [[1, tr("Einprotonig", "Monoprotic")], [2, tr("Zweiprotonig", "Diprotic")], [3, tr("Dreiprotonig", "Triprotic")]];

/**
 * Säuretabelle. Mit `onPick` ist jede Zeile wählbar (Säure), in der Oberstufe zusätzlich jeder Säurerest
 * (= wie viele H⁺ die Säure abgibt). `mark` hebt Säuren hervor (Quiz).
 */
export function AcidTable({ os, acid, step, onPick, mark = [] }: {
  os: boolean; acid?: string; step?: number; onPick?: (acid: string, step: number) => void; mark?: string[];
}) {
  return (
    <div className="acid-table">
      {GROUPS.map(([p, title]) => (
        <section key={p} className="at-group">
          <h3>{title}</h3>
          <ul>
            {PROTIC_ACIDS.filter(a => a.protons === p).map(a => {
              const on = a.id === acid, hit = mark.includes(a.id);
              const rests = a.rests.map((r, i) => ({ r, k: i + 1 })).filter(x => os || x.k === a.protons);
              const acidCell = <><b><Formula f={a.formula} /></b><span title={a.alt}>{a.name}</span></>;
              return (
                <li key={a.id} className={`at-row${on ? " on" : ""}${hit ? " hit" : ""}`}>
                  {onPick
                    ? <button type="button" className="at-acid" aria-pressed={on} onClick={() => onPick(a.id, a.protons)}>{acidCell}</button>
                    : <span className="at-acid">{acidCell}</span>}
                  <span className="at-rests">
                    {rests.map(({ r, k }) => {
                      const cell = <><b><IonLabel ion={r} /></b><span>{restName(r)}</span></>;
                      const sel = on && step === k;
                      return onPick && os
                        ? <button key={r.id} type="button" className={`at-rest${sel ? " on" : ""}`} aria-pressed={sel} aria-label={tr(`${a.name}, ${k} H⁺ abgegeben: ${restName(r)}`, `${a.name}, ${k} H⁺ given off: ${restName(r)}`)} onClick={() => onPick(a.id, k)}>{cell}</button>
                        : <span key={r.id} className={`at-rest${sel && os ? " on" : ""}`}>{cell}</span>;
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Zerfall einer Formeleinheit in Ionen */
export function UnitSheet({ which, base, acid, step, os, onClose }: {
  which: "base" | "acid" | null; base: Hydroxide; acid: ProticAcid; step: number; os: boolean; onClose: () => void;
}) {
  const title = which === "base" ? <><Formula f={base.formula} /> · {base.name}</> : which === "acid" ? <><Formula f={acid.formula} /> · {acid.name}</> : "";
  const hAtoms = parseFormula(acid.formula).H ?? 0;
  return (
    <Sheet open={!!which} title={title} onClose={onClose}>
      {which === "base" && (
        <div className="unit-sheet">
          <div className="us-tiles" style={{ "--w": base.cation.charge } as React.CSSProperties}>
            {catTile(base)}
            <span className="nw-sub">{Array.from({ length: base.cation.charge }, (_, i) => <span key={i}>{ohTile()}</span>)}</span>
          </div>
          <p className="us-eq">{hydroxideDissociation(base)}</p>
          <div className="ui-tags us-tags">
            {base.lauge && <Tag>{tr("in Wasser", "in water")}: {base.lauge}</Tag>}
            {base.poor && <Tag>{tr("in Wasser kaum löslich", "barely soluble in water")}</Tag>}
            <Tag tone="signal">{base.cation.charge} OH⁻ {tr("je", "per")} <Formula f={base.formula} /></Tag>
            <Tag>{tr("Ladung", "Charge")} <IonLabel ion={base.cation} /> = {tr("Zahl der OH⁻", "number of OH⁻")}</Tag>
          </div>
        </div>
      )}
      {which === "acid" && (
        <div className="unit-sheet">
          <ul className="us-steps">
            {acid.rests.map((r, i) => (os || i + 1 === acid.protons) && (
              <li key={r.id} className={i + 1 === step ? "on" : undefined}>
                <span className="us-tiles" style={{ "--w": i + 1 } as React.CSSProperties}>
                  <span className="nw-sub">{Array.from({ length: i + 1 }, (_, j) => <span key={j}>{hTile()}</span>)}</span>
                  {restTile(r)}
                </span>
                <span className="us-eq">{protolysis(acid, i + 1)}</span>
              </li>
            ))}
          </ul>
          <div className="ui-tags us-tags">
            <Tag tone="signal">{proticWord(acid.protons)}</Tag>
            <Tag>{tr(`${acid.protons} H⁺ abgebbar`, `${acid.protons} H⁺ can be given off`)}{hAtoms > acid.protons && tr(` (von ${hAtoms} H)`, ` (of ${hAtoms} H)`)}</Tag>
            <Tag>{tr("Säurerest", "Acid anion")}: {restName(acid.rests[acid.protons - 1])}</Tag>
          </div>
        </div>
      )}
    </Sheet>
  );
}
