// „Ionenwand“: Kationen oben, Anionen unten. Sind beide Reihen gleich lang, ist die Verbindung neutral.

import { Icon } from "@lern/ui";
import { formula, ratio, chargeFull, compoundName, type Ion } from "@lern/chem";
import { Formula } from "@lern/chem-ui";
import { IonTile } from "./IonTile.tsx";

export function balanceText(cation: Ion, anion: Ion, nC: number, nA: number) {
  const pos = nC * cation.charge, neg = nA * -anion.charge;
  return `${nC} · (${chargeFull(cation.charge)}) = ${pos}+ ${pos === neg ? "und" : "aber"} ${nA} · (${chargeFull(anion.charge)}) = ${neg}−`;
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
          {neg > pos && <span className="iw-gap" style={{ gridColumn: `span ${neg - pos}` }} role="img" aria-label={`es fehlen ${neg - pos} positive Ladungen`} />}
        </div>
        <div className="iw-row" aria-label={`${nA} × ${anion.name}`}>
          {Array.from({ length: nA }, (_, i) => <IonTile key={i} ion={anion} onClick={onTile && (() => onTile(anion))} />)}
          {pos > neg && <span className="iw-gap" style={{ gridColumn: `span ${pos - neg}` }} role="img" aria-label={`es fehlen ${pos - neg} negative Ladungen`} />}
        </div>
      </div>
      {showFormula && (
        <div className="iw-result">
          <Icon name="arrow" size={34} className="iw-arrow" />
          <div>
            <div className="iw-formula">{balanced ? <Formula f={simplest ? formula(cation, anion) : formula(cation, anion, nC, nA)} /> : "?"}</div>
            {showName && balanced && <div className="iw-name">{compoundName(cation, anion)}</div>}
          </div>
        </div>
      )}
      <p className={`iw-balance${balanced ? " ok" : ""}`}>
        {balanced ? "✓ " : "≠ "}{balanceText(cation, anion, nC, nA)}
      </p>
    </div>
  );
}
