// Start: 5 Beispielreaktionen zum Kennenlernen – Zahl vor jedem Stoff antippen und prüfen, bis beide Kästen gleich viele Atome haben.

import { REACTION_BY_ID } from "@lern/chem";
import { useApp, START } from "../store.ts";
import { BalanceCard } from "../components/BalanceCard.tsx";

export function StartView() {
  const { si, sCoeffs, sDone, pickStart, setStart, solvedStart, setTab } = useApp();
  const r = REACTION_BY_ID[START[si]];
  const last = si === START.length - 1;
  return (
    <BalanceCard key={r.id} r={r} coeffs={sCoeffs[si]} onChange={setStart} onSolved={solvedStart}
      onNext={() => (last ? setTab("ueben") : pickStart(si + 1))} nextLabel={last ? "Zum Üben" : "Nächstes Beispiel"}
      head={
        <div className="rg-head">
          <h2 className="rg-title">{r.title}</h2>
          <div className="rg-steps" role="group" aria-label="Beispiel">
            {START.map((id, i) => (
              <button key={id} type="button" aria-pressed={i === si} aria-label={`Beispiel ${i + 1}: ${REACTION_BY_ID[id].title}${sDone[i] ? ", gelöst" : ""}`}
                className={`${i === si ? "on" : ""}${sDone[i] ? " done" : ""}`} onClick={() => pickStart(i)}>
                {sDone[i] ? "✓" : i + 1}
              </button>
            ))}
          </div>
        </div>
      } />
  );
}
