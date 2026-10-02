// Stoffnamen als Knöpfe zur Stoff-Info (@lern/chem-ui): Wortgleichung im Start, Liste im Quiz-Hilfsmittel „Stoffe“.

import { Fragment, useState } from "react";
import { Button, buzz } from "@lern/ui";
import { speciesName, toSubscript, type Equation } from "@lern/chem";
import { SubstanceDetail, SubstanceSheet } from "@lern/chem-ui";
import { tr } from "@lern/i18n";

/** Wortgleichung, jeder Stoffname ist ein Knopf zur Stoff-Info */
export function NameLine({ eq, className = "rg-names" }: { eq: Equation; className?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const side = (fs: string[]) => fs.map((f, i) => (
    <Fragment key={f + i}>
      {i > 0 && <span className="rg-plus" aria-hidden="true">+</span>}
      <button type="button" className="sub-name" onClick={() => { buzz(); setOpen(f); }} aria-label={`${speciesName(f)} – Info`}>{speciesName(f)}</button>
    </Fragment>
  ));
  return (
    <>
      <p className={className}>{side(eq.left)}<span className="rg-arrow" aria-hidden="true">→</span>{side(eq.right)}</p>
      <SubstanceSheet f={open} onClose={() => setOpen(null)} />
    </>
  );
}

/** Stoffe einer Aufgabe als Knöpfe; Antippen zeigt die Info im selben Blatt (Quiz-Hilfsmittel „Stoffe“) */
export function SubstanceList({ fs }: { fs: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (open) return (
    <div className="sub-detail">
      <div className="sub-detail-head">
        <Button variant="quiet" icon="back" onClick={() => { buzz(); setOpen(null); }}>{tr("Alle Stoffe", "All substances")}</Button>
        <h3>{speciesName(open)}</h3>
      </div>
      <SubstanceDetail key={open} f={open} />
    </div>
  );
  return (
    <div className="sub-list">
      {fs.map(f => (
        <button key={f} type="button" className="sub-item" onClick={() => { buzz(); setOpen(f); }}>
          <b>{speciesName(f)}</b><span>{toSubscript(f)}</span>
        </button>
      ))}
    </div>
  );
}
