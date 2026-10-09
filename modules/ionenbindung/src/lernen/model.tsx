// Modell-Folien: das Modell (Bohrmodell, Ionenwand, Gitter …) ändert sich sofort mit jeder Eingabe; „Prüfen“ meldet,
// was gebaut wurde (`c.pick(ergebnis)`), die Erklärung vergleicht mit `answer` und gibt zu bekannten Fehlern die Rückmeldung aus `why`.
// Nach vier Fehlversuchen steht die Lösung im Modell (gestrichelt markiertes „Prüfen“) – selbst prüfen; gelöst bleibt das Modell stehen.

import { useEffect, useState, type ReactNode } from "react";
import { Button, type GuideCtx, type GuideStep } from "@lern/ui";
import { tr } from "@lern/i18n";

const MODELS = new WeakSet<GuideStep>();

/** Schritt als Modell-Folie kennzeichnen (Test: mindestens die Hälfte jedes Kapitels) */
export function model(step: GuideStep): GuideStep {
  MODELS.add(step);
  return step;
}
export const isModel = (s: GuideStep) => MODELS.has(s);

/** Zustand des Modells: vorgemacht bzw. schon gelöst → Lösung; nach vier Fehlversuchen → Lösung zum selbst Prüfen */
export function useModel<S>(c: GuideCtx, init: S, solution: S): [S, (s: S) => void] {
  const [s, set] = useState<S>(c.solved ? solution : init);
  useEffect(() => { if (c.show) set(solution); }, [c.show]);
  return [s, set];
}

/** Rahmen einer Modell-Folie: Modell (füllt den Platz), Bedienung darunter, „Prüfen“ */
export function ModelFrame({ c, stage, controls, onCheck, className }: {
  c: GuideCtx; stage: ReactNode; controls?: ReactNode; onCheck?: () => void; className?: string;
}) {
  return (
    <div className={`lm${className ? ` ${className}` : ""}`}>
      <div className="lm-stage">{stage}</div>
      {(controls || onCheck) && (
        <div className="lm-controls">
          {controls}
          {onCheck && !c.solved && (
            <Button variant="primary" icon="check" className={`lm-check${c.show ? " g-sol" : ""}`} onClick={onCheck}>{tr("Prüfen", "Check")}</Button>
          )}
        </div>
      )}
    </div>
  );
}
