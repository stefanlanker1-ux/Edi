// Eine Gleichung ausgleichen (Start): oben Titel (und Auswahl), dann das Teilchenbild,
// darunter die Gleichung (Zahl antippen = ändern) und genau ein Hauptknopf: „Prüfen“, nach ✓ „Weiter“.
// Nach ✓ öffnet „Ablauf ansehen“ (unten rechts auf dem Bild) ein Blatt: wie die Edukte zerfallen und sich die Atome zu den Produkten verbinden (AnimButton).
// Mit `hint` (Üben) zusätzlich der Knopf „Tipp“: zeigt den Hinweis zu dieser Gleichung über der Gleichungszeile.

import { useState, type ReactNode } from "react";
import { Button, Icon, Reserve, Tag, Workbench, buzz, ding } from "@lern/ui";
import { isBalanced, unbalancedElements, type Reaction } from "@lern/chem";
import { EquationRow, maxCoef } from "./Equation.tsx";
import { MoleculeScene, hasModel } from "./Molecules.tsx";
import { AnimButton } from "./AnimSheet.tsx";
import { tr } from "@lern/i18n";

const gcdAll = (xs: number[]) => xs.reduce((g, x) => { while (x) [g, x] = [x, g % x]; return g; }, 0);

export function BalanceCard({ r, coeffs, onChange, head, onNext, nextLabel = tr("Weiter", "Next"), onSolved, onSolution, peeked = false, hint, model = true }: {
  r: Reaction; coeffs: number[]; onChange: (k: number, v: number) => void;
  head: ReactNode;
  onNext?: () => void; nextLabel?: string;
  onSolved?: () => void;
  /** nach zwei Fehlversuchen: Lösung zeigen */
  onSolution?: () => void;
  /** Lösung angesehen: nach „Prüfen“ steht dabei, warum das Kästchen im Fortschritt leer bleibt */
  peeked?: boolean;
  /** Hinweis zu dieser Gleichung (Knopf „Tipp“) */
  hint?: string;
  /** Teilchenbild zeigen (Üben: einklappbar, nur Text) */
  model?: boolean;
}) {
  const [checked, setChecked] = useState<string | null>(null);
  const [fails, setFails] = useState<Record<string, number>>({});
  const [hintOn, setHintOn] = useState(false);
  const balanced = isBalanced(r, coeffs), g = gcdAll(coeffs), ok = balanced && g === 1;
  // Ergebnis nur nach „Prüfen“ und nur, solange die Zahlen gleich bleiben
  const key = `${r.id}:${coeffs.join(",")}`;
  const shown = checked === key;
  const tries = fails[r.id] ?? 0;
  // Ablauf nur für eine ausgeglichene, gekürzte Gleichung mit Teilchenbild
  const canAnim = shown && ok && hasModel(r);
  const check = () => {
    buzz(); setChecked(key);
    if (ok) { ding(true); onSolved?.(); } else { ding(false); setFails({ ...fails, [r.id]: tries + 1 }); }
  };
  return (
    <Workbench className="rg-wb" tools={[]}
      head={head}
      stage={<>
        {model && hasModel(r) ? <MoleculeScene eq={r} coeffs={coeffs} state={shown ? (ok ? "ok" : "bad") : undefined} /> : null}
        {/* Tipp über dem unteren Rand des Bilds: Bild und Gleichung bleiben stehen, wenn er erscheint */}
        {hint && hintOn && !(shown && ok) && <p className="rg-hint" role="status"><Icon name="bulb" size={18} /> {hint}</p>}
        {/* nach ✓: „Ablauf ansehen“ unten rechts auf dem Bild (statt in der Statuszeile – dort bräche er die Zeile um, die Bühne spränge) */}
        {canAnim && <div className="rg-anim-at"><AnimButton r={r} coeffs={coeffs} /></div>}
      </>}
      // Platz für die Kennzeichen nach „Prüfen“ reserviert: die Bühne springt nicht, wenn sie erscheinen
      statusReserve={[<><Tag tone="ok">✓ {tr("ausgeglichen", "balanced")}</Tag>{peeked && <Tag>{tr("Lösung angesehen – kein ✓", "Solution viewed – no ✓")}</Tag>}</>]}
      status={shown ? <>
        {!balanced && unbalancedElements(r, coeffs).map(el => <Tag key={el} tone="signal">≠ {el}</Tag>)}
        {balanced && !ok && <Tag tone="signal">{tr("kürzen :", "simplify ÷")} {g}</Tag>}
        {ok && <Tag tone="ok">✓ {tr("ausgeglichen", "balanced")}</Tag>}
        {ok && peeked && <Tag>{tr("Lösung angesehen – kein ✓", "Solution viewed – no ✓")}</Tag>}
      </> : undefined}
      controls={
        <div className="rg-controls" data-screen={r.id}>
          <EquationRow eq={r} coeffs={coeffs} onChange={(k, v) => { onChange(k, v); }} max={maxCoef(r)} />
          {/* feste Plätze: „Tipp“ und „Lösung“ stehen von Anfang an (unsichtbar, solange es sie nicht gibt) – kein Knopf rückt, wenn einer erscheint */}
          <div className={`rg-actions${hint || onSolution ? " slots" : ""}`}>
            {shown && ok && onNext
              ? <Button variant="primary" iconRight="arrow" onClick={() => { buzz(); onNext(); }}>{nextLabel}</Button>
              : <Button variant="primary" icon="check" onClick={check} disabled={shown}>{tr("Prüfen", "Check")}</Button>}
            {/* Tipp ein- und wieder ausblenden */}
            {hint && <Button icon="bulb" className={shown && ok ? "rg-off" : undefined} aria-hidden={shown && ok ? true : undefined} tabIndex={shown && ok ? -1 : undefined}
              aria-pressed={hintOn} onClick={() => { buzz(); setHintOn(!hintOn); }}>
              <Reserve alts={[tr("Tipp aus", "Hide hint"), tr("Tipp", "Hint")]}>{hintOn ? tr("Tipp aus", "Hide hint") : tr("Tipp", "Hint")}</Reserve>
            </Button>}
            {onSolution && (() => { const on = !ok && tries >= 2; return (
              <Button className={on ? undefined : "rg-off"} aria-hidden={on ? undefined : true} tabIndex={on ? undefined : -1} onClick={on ? () => { buzz(); onSolution(); } : undefined}>{tr("Lösung", "Solution")}</Button>
            ); })()}
          </div>
        </div>
      } />
  );
}
