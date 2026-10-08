// „Ablauf ansehen“: Knopf, der ein Blatt mit dem animierten Übergang Edukte → Produkte öffnet (ReactionMorph).
// Nur für ausgeglichene Gleichungen mit Teilchenbild; Experimentieren und Üben erst nach ✓ (verrät sonst die Zahlen).

import { useState } from "react";
import { Button, Sheet, buzz } from "@lern/ui";
import type { Reaction } from "@lern/chem";
import { EquationRow } from "./Equation.tsx";
import { ReactionMorph } from "./Morph.tsx";
import { tr } from "@lern/i18n";

export function AnimButton({ r, coeffs }: { r: Reaction; coeffs: number[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button className="rg-anim" icon="play" onClick={() => { buzz(); setOpen(true); }}>{tr("Ablauf ansehen", "Watch it react")}</Button>
      <Sheet open={open} title={r.title} onClose={() => setOpen(false)}>
        <EquationRow eq={r} coeffs={coeffs} />
        <div className="rg-anim-box"><ReactionMorph eq={r} coeffs={coeffs} autoplay /></div>
      </Sheet>
    </>
  );
}
