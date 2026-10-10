// Ionen-Bausteine: Kationen oben, Anionen unten, jeder Baustein so breit wie seine Ladung. Sind beide Reihen gleich lang, ist die Verbindung neutral.
// Darunter der Zustand in Worten („ausgeglichen: 2 positive und 2 negative Ladungen“) – keine Rechnung mit Klammern.

import { Icon } from "@lern/ui";
import { formula, ratio, compoundName, type Ion } from "@lern/chem";
import { Formula } from "@lern/chem-ui";
import { IonTile } from "./IonTile.tsx";
import { tr } from "@lern/i18n";

/** Ladungen in Worten: „1 positive Ladung“, „2 negative Ladungen“ */
export function chargesText(n: number, positive: boolean) {
  const de = `${n} ${positive ? "positive" : "negative"} ${n === 1 ? "Ladung" : "Ladungen"}`;
  const en = `${n} ${positive ? "positive" : "negative"} ${n === 1 ? "charge" : "charges"}`;
  return tr(de, en);
}

/** Zustand unter den Bausteinen, in Worten statt als Rechnung: „ausgeglichen: 2 positive und 2 negative Ladungen“
 *  bzw. „noch nicht ausgeglichen: 1 positive, 2 negative Ladungen“ */
export function balanceText(cation: Ion, anion: Ion, nC: number, nA: number) {
  const pos = nC * cation.charge, neg = nA * -anion.charge;
  return pos === neg
    ? tr(`ausgeglichen: ${pos} positive und ${neg} negative ${pos === 1 ? "Ladung" : "Ladungen"}`, `balanced: ${pos} positive and ${neg} negative ${pos === 1 ? "charge" : "charges"}`)
    : tr(`noch nicht ausgeglichen: ${pos} positive, ${neg} negative Ladungen`, `not balanced yet: ${pos} positive, ${neg} negative charges`);
}

export function IonWall({ cation, anion, nC, nA, onTile, showFormula = true, showName = true }: {
  cation: Ion; anion: Ion; nC: number; nA: number; onTile?: (ion: Ion) => void; showFormula?: boolean; showName?: boolean;
}) {
  const pos = nC * cation.charge, neg = nA * -anion.charge;
  const cols = Math.max(pos, neg);
  const balanced = pos === neg;
  const r = ratio(cation, anion);
  const simplest = balanced && nC === r.nC && nA === r.nA;
  return (
    <div className={`ion-wall${balanced ? " balanced" : ""}`}>
      <div className="iw-stack" style={{ "--cols": cols } as React.CSSProperties}>
        <div className="iw-row" aria-label={`${nC} × ${cation.name}`}>
          {Array.from({ length: nC }, (_, i) => <IonTile key={i} ion={cation} onClick={onTile && (() => onTile(cation))} />)}
          {neg > pos && <span className="iw-gap" style={{ gridColumn: `span ${neg - pos}` }} role="img" aria-label={tr(`es fehlen ${neg - pos} positive Ladungen`, `${neg - pos} positive charges missing`)} />}
        </div>
        <div className="iw-row" aria-label={`${nA} × ${anion.name}`}>
          {Array.from({ length: nA }, (_, i) => <IonTile key={i} ion={anion} onClick={onTile && (() => onTile(anion))} />)}
          {pos > neg && <span className="iw-gap" style={{ gridColumn: `span ${pos - neg}` }} role="img" aria-label={tr(`es fehlen ${pos - neg} negative Ladungen`, `${pos - neg} negative charges missing`)} />}
        </div>
      </div>
      {showFormula && (
        <div className="iw-result">
          <Icon name="arrow" size={34} className="iw-arrow" />
          <div>
            <div className="iw-formula">{balanced ? <Formula f={simplest ? formula(cation, anion) : formula(cation, anion, nC, nA)} /> : "?"}</div>
            {/* Name: Zeile immer da (vor dem Ausgleich bzw. solange er gesucht ist leer) – die Wand rückt nicht, wenn er erscheint */}
            <div className="iw-name" aria-hidden={!(showName && balanced) || undefined}>{showName && balanced ? compoundName(cation, anion) : "\u00a0"}</div>
          </div>
        </div>
      )}
      <p className={`iw-balance${balanced ? " ok" : ""}`}>
        {balanced ? "✓ " : ""}{balanceText(cation, anion, nC, nA)}
      </p>
    </div>
  );
}
