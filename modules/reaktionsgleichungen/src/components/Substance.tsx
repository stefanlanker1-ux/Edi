// Stoffnamen als Knöpfe zur Stoff-Info (@lern/chem-ui): Wortgleichung im Start, Liste im Quiz-Hilfsmittel „Stoffe“.

import { useState } from "react";
import { Button, buzz } from "@lern/ui";
import { speciesName, toSubscript, type Equation } from "@lern/chem";
import { SubstanceDetail, SubstanceSheet } from "@lern/chem-ui";
import { tr } from "@lern/i18n";

/** Wortgleichung, jeder Stoffname ist ein Knopf zur Stoff-Info */
export function NameLine({ eq, className = "rg-names" }: { eq: Equation; className?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  // „+“ und „→“ hängen am Stoff davor – beim Umbrechen steht nie ein Pfeil allein in einer Zeile
  const items = [...eq.left.map((f, i) => ({ f, op: i < eq.left.length - 1 ? "+" : "→" })), ...eq.right.map((f, i) => ({ f, op: i < eq.right.length - 1 ? "+" : "" }))];
  return (
    <>
      <p className={className}>{items.map(({ f, op }, i) => (
        <span key={f + i} className="rg-name-item">
          <button type="button" className="sub-name" onClick={() => { buzz(); setOpen(f); }} aria-label={`${speciesName(f)} – Info`}>{speciesName(f)}</button>
          {op && <span className={op === "→" ? "rg-arrow" : "rg-plus"} aria-hidden="true">{op}</span>}
        </span>
      ))}</p>
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
