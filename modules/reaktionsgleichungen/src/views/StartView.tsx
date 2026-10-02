// Start: 5 Beispielreaktionen zum Kennenlernen – Zahl vor jedem Stoff antippen und prüfen, bis beide Kästen gleich viele Atome haben.

import { REACTION_BY_ID } from "@lern/chem";
import { useApp, START } from "../store.ts";
import { BalanceCard } from "../components/BalanceCard.tsx";
import { NameLine } from "../components/Substance.tsx";
import { tr } from "@lern/i18n";

export function StartView() {
  const { si, sCoeffs, sDone, pickStart, setStart, solvedStart, setTab } = useApp();
  const r = REACTION_BY_ID[START[si]];
  const last = si === START.length - 1;
  return (
    <BalanceCard key={r.id} r={r} coeffs={sCoeffs[si]} onChange={setStart} onSolved={solvedStart}
      onNext={() => (last ? setTab("quiz") : pickStart(si + 1))} nextLabel={last ? tr("Zum Quiz", "To the quiz") : tr("Nächstes Beispiel", "Next example")}
      head={
        <div className="rg-head">
          <h2 className="rg-title">{r.title}</h2>
          <NameLine eq={r} />
          <div className="rg-steps" role="group" aria-label={tr("Beispiel", "Example")}>
            {START.map((id, i) => (
              <button key={id} type="button" aria-pressed={i === si} aria-label={`${tr("Beispiel", "Example")} ${i + 1}: ${REACTION_BY_ID[id].title}${sDone[i] ? tr(", gelöst", ", solved") : ""}`}
                className={`${i === si ? "on" : ""}${sDone[i] ? " done" : ""}`} onClick={() => pickStart(i)}>
                {sDone[i] ? "✓" : i + 1}
              </button>
            ))}
          </div>
        </div>
      } />
  );
}
