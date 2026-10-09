// Kurze Hilfe auf Abruf („So geht's“, ⓘ im Kopf von Üben und Experimentieren): die Regeln des Ausgleichens mit einem Mini-Beispiel.
// Bewusst keine eigene Erklärung als Bereich und keine Frage – nur zum Nachlesen.

import { useState } from "react";
import { Icon, RichText, Sheet, buzz } from "@lern/ui";
import { tr } from "@lern/i18n";

export const HOWTO_RULES = tr([
  "Die **Zahl vor einem Stoff** gilt für alle seine Atome: 2\u00a0H₂O sind 4\u00a0H und 2\u00a0O.",
  "**Formeln nie ändern** – nur die Zahlen davor. Aus H₂O wird nie H₂O₂.",
  "Links und rechts stehen von jeder Atomsorte gleich viele Atome.",
  "**Kürzen**: Lassen sich alle Zahlen durch dieselbe Zahl teilen, nimm die kleinsten. 4\u00a0H₂ + 2\u00a0O₂ → 4\u00a0H₂O wird 2\u00a0H₂ + O₂ → 2\u00a0H₂O.",
], [
  "The **number in front of a substance** counts for all its atoms: 2\u00a0H₂O are 4\u00a0H and 2\u00a0O.",
  "**Never change a formula** – only the numbers in front. H₂O never becomes H₂O₂.",
  "Each kind of atom appears equally often on the left and on the right.",
  "**Simplify**: if all numbers can be divided by the same number, use the smallest. 4\u00a0H₂ + 2\u00a0O₂ → 4\u00a0H₂O becomes 2\u00a0H₂ + O₂ → 2\u00a0H₂O.",
]);
export const HOWTO_EXAMPLE = tr([
  "H₂ + O₂ → H₂O: links 2\u00a0O, rechts 1\u00a0O.",
  "Zahl vor H₂O: 2\u00a0H₂O – jetzt 2\u00a0O, aber 4\u00a0H rechts.",
  "Zahl vor H₂: 2\u00a0H₂ – links auch 4\u00a0H.",
  "**2\u00a0H₂ + O₂ → 2\u00a0H₂O** ✓",
], [
  "H₂ + O₂ → H₂O: 2\u00a0O on the left, 1\u00a0O on the right.",
  "Number in front of H₂O: 2\u00a0H₂O – now 2\u00a0O, but 4\u00a0H on the right.",
  "Number in front of H₂: 2\u00a0H₂ – 4\u00a0H on the left too.",
  "**2\u00a0H₂ + O₂ → 2\u00a0H₂O** ✓",
]);

export function HowTo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="rg-howto" aria-haspopup="dialog" aria-label={tr("So geht's: Regeln zum Ausgleichen", "How it works: rules for balancing")}
        title={tr("So geht's", "How it works")} onClick={() => { buzz(); setOpen(true); }}>
        <Icon name="info" size={20} />
      </button>
      <Sheet open={open} title={tr("So gleichst du aus", "How to balance")} onClose={() => setOpen(false)}>
        <div className="rg-howto-body">
          <ul>{HOWTO_RULES.map((t, i) => <li key={i}><RichText text={t} /></li>)}</ul>
          <h3>{tr("Beispiel", "Example")}</h3>
          <ol>{HOWTO_EXAMPLE.map((t, i) => <li key={i}><RichText text={t} /></li>)}</ol>
        </div>
      </Sheet>
    </>
  );
}
