// Ionen-Baustein: Breite = Ladung (in Einheiten), Kationen gold, Anionen grün.

import type { Ion } from "@lern/chem";
import { ionChargeText } from "@lern/chem";
import { Formula } from "@lern/chem-ui";
import { tr } from "@lern/i18n";

export function IonLabel({ ion }: { ion: Ion }) {
  return <span className="ion-label"><Formula f={ion.formula} /><sup>{ionChargeText(ion.charge)}</sup></span>;
}

export function IonTile({ ion, onClick, ghost }: { ion: Ion; onClick?: () => void; ghost?: boolean }) {
  const cls = `ion-tile ${ion.charge > 0 ? "cation" : "anion"}${ghost ? " ghost" : ""}`;
  const span = { gridColumn: `span ${Math.abs(ion.charge)}` };
  if (!onClick) return <span className={cls} style={span}><IonLabel ion={ion} /></span>;
  return (
    <button type="button" className={cls} style={span} onClick={onClick} aria-label={tr(`${ion.name} – Atom anzeigen`, `${ion.name} – show atom`)}>
      <IonLabel ion={ion} />
    </button>
  );
}
