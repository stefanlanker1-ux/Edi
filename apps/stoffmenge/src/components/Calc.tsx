// Rechenweg als Bühne: Stoff, molare Masse aus dem PSE, dann n = m / M bzw. m = n · M – wie im Heft, Zeile für Zeile.

import { MOLE_BY_FORMULA, molarMass, molarMassSteps, moles, massOf, particles, gasVolume, fmt, fmtParticles, toSubscript } from "@lern/chem";
import type { Mode } from "../store.ts";

export function MolarMassLine({ formula }: { formula: string }) {
  const steps = molarMassSteps(formula);
  return (
    <p className="calc-line">
      <span className="calc-lhs">M({toSubscript(formula)})</span>
      <span>= {steps.map((s, i) => <span key={s.el}>{i > 0 && " + "}{s.n > 1 && <>{s.n} · </>}<b className="calc-el">{fmt(s.mass)}</b></span>)}</span>
      <span>= <b>{fmt(molarMass(formula))} g/mol</b></span>
    </p>
  );
}

/** Ganzer Rechenweg für die Werkbank */
export function CalcStage({ formula, mode, value }: { formula: string; mode: Mode; value: number }) {
  const s = MOLE_BY_FORMULA[formula];
  const M = molarMass(formula);
  const n = mode === "m" ? moles(value, M) : value;
  const m = mode === "m" ? value : massOf(value, M);
  return (
    <div className="calc">
      <p className="calc-given">
        <b>{s.name}</b> · {toSubscript(formula)}{s.everyday ? <span className="calc-every"> · {s.everyday}</span> : null}
      </p>
      <p className="calc-line calc-step"><span className="calc-num">①</span><MolarMassLine formula={formula} /></p>
      <p className="calc-line calc-step">
        <span className="calc-num">②</span>
        {mode === "m"
          ? <><span className="calc-lhs">n</span><span>= m / M = {fmt(value)} g / {fmt(M)} g/mol</span><span>= <b className="calc-res">{fmt(n)} mol</b></span></>
          : <><span className="calc-lhs">m</span><span>= n · M = {fmt(value)} mol · {fmt(M)} g/mol</span><span>= <b className="calc-res">{fmt(m)} g</b></span></>}
      </p>
      <p className="calc-line calc-more">
        <span>N = n · N<sub>A</sub> = <b>{fmtParticles(particles(n))}</b> Teilchen</span>
        {s.gas && <span>V = n · 22,4 l/mol = <b>{fmt(gasVolume(n))} l</b> (Gas, Normbedingungen)</span>}
      </p>
    </div>
  );
}
