// Elektronegativität (Pauling) der Elemente im Baukasten, angeordnet wie im Periodensystem – mit dem Trend:
// nach rechts steigt die EN, nach unten sinkt sie. Werte aus @lern/chem (`en`), markierte Elemente hervorgehoben.

import { en, elementName } from "@lern/chem";
import { num, tr } from "@lern/i18n";

/** Zeilen wie im PSE (Gruppen 1, 14–17); null = leeres Feld */
const ROWS: (string | null)[][] = [
  ["H", null, null, null, null],
  [null, "C", "N", "O", "F"],
  [null, null, "P", "S", "Cl"],
  [null, null, null, null, "Br"],
  [null, null, null, null, "I"],
];

export function EnTable({ mark = [] }: { mark?: string[] }) {
  return (
    <figure className="en-table">
      <div className="en-grid" role="table" aria-label={tr("Elektronegativität (EN)", "Electronegativity (EN)")}>
        {ROWS.flatMap((row, r) => row.map((el, c) => el && (
          <div key={el} role="cell" className={`en-cell${mark.includes(el) ? " on" : ""}`} title={elementName(el)} style={{ gridRow: r + 1, gridColumn: c + 1 }}>
            <b>{el}</b><span>{num(en(el).toFixed(2))}</span>
          </div>
        )))}
        <span className="en-arrow en-right" aria-hidden="true">{tr("EN steigt →", "EN increases →")}</span>
        <span className="en-arrow en-down" aria-hidden="true">{tr("EN sinkt ↓", "EN decreases ↓")}</span>
      </div>
      <figcaption>{tr("EN nach Pauling – Fluor zieht am stärksten", "EN (Pauling) – fluorine attracts most strongly")}</figcaption>
    </figure>
  );
}
