// Eine Gleichung ausgleichen (Start): oben Titel (und Auswahl), dann das Teilchenbild,
// darunter die Gleichung (Zahl antippen = ändern) und genau ein Hauptknopf: „Prüfen“, nach ✓ „Weiter“.
// Nach ✓ öffnet „Ablauf ansehen“ ein Blatt: wie die Edukte zerfallen und sich die Atome zu den Produkten verbinden (AnimButton).
// Mit `hint` (Üben) zusätzlich der Knopf „Tipp“: zeigt den Hinweis zu dieser Gleichung über der Gleichungszeile.

import { useState, type ReactNode } from "react";
import { Button, Icon, Tag, Workbench, buzz, ding } from "@lern/ui";
import { isBalanced, unbalancedElements, type Reaction } from "@lern/chem";
import { EquationRow, maxCoef } from "./Equation.tsx";
import { MoleculeScene, hasModel } from "./Molecules.tsx";
import { AnimButton } from "./AnimSheet.tsx";
import { tr } from "@lern/i18n";

const gcdAll = (xs: number[]) => xs.reduce((g, x) => { while (x) [g, x] = [x, g % x]; return g; }, 0);

export function BalanceCard({ r, coeffs, onChange, head, onNext, nextLabel = tr("Weiter", "Next"), onSolved, onSolution, hint }: {
  r: Reaction; coeffs: number[]; onChange: (k: number, v: number) => void;
  head: ReactNode;
  onNext?: () => void; nextLabel?: string;
  onSolved?: () => void;
  /** nach zwei Fehlversuchen: Lösung zeigen */
  onSolution?: () => void;
  /** Hinweis zu dieser Gleichung (Knopf „Tipp“) */
  hint?: string;
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
      stage={hasModel(r) ? <MoleculeScene eq={r} coeffs={coeffs} state={shown ? (ok ? "ok" : "bad") : undefined} /> : null}
      status={shown ? <>
        {!balanced && unbalancedElements(r, coeffs).map(el => <Tag key={el} tone="signal">≠ {el}</Tag>)}
        {balanced && !ok && <Tag tone="signal">{tr("kürzen :", "simplify ÷")} {g}</Tag>}
        {ok && <Tag tone="ok">✓ {tr("ausgeglichen", "balanced")}</Tag>}
        {canAnim && <AnimButton r={r} coeffs={coeffs} />}
      </> : undefined}
      controls={
        <div className="rg-controls">
          {hint && hintOn && !(shown && ok) && <p className="rg-hint" role="status"><Icon name="bulb" size={18} /> {hint}</p>}
          <EquationRow eq={r} coeffs={coeffs} onChange={(k, v) => { onChange(k, v); }} max={maxCoef(r)} />
          <div className="rg-actions">
            {shown && ok && onNext
              ? <Button variant="primary" iconRight="arrow" onClick={() => { buzz(); onNext(); }}>{nextLabel}</Button>
              : <Button variant="primary" icon="check" onClick={check} disabled={shown}>{tr("Prüfen", "Check")}</Button>}
            {hint && !(shown && ok) && <Button icon="bulb" aria-pressed={hintOn} onClick={() => { buzz(); setHintOn(true); }} disabled={hintOn}>{tr("Tipp", "Hint")}</Button>}
            {onSolution && !ok && tries >= 2 && <Button onClick={() => { buzz(); onSolution(); }}>{tr("Lösung", "Solution")}</Button>}
          </div>
        </div>
      } />
  );
}
