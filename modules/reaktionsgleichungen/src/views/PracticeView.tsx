// Üben: zufällige Gleichungen der gewählten Stufe und des Niveaus (1–4). Nach ✓ „Nächste“, nach zwei Fehlversuchen „Lösung“.

import { Segmented } from "@lern/ui";
import { REACTION_BY_ID, type Niveau } from "@lern/chem";
import { useApp } from "../store.ts";
import { BalanceCard } from "../components/BalanceCard.tsx";

export function PracticeView() {
  const { niveau, pid, pCoeffs, setNiveau, setPractice, solvePractice, nextPractice } = useApp();
  const r = REACTION_BY_ID[pid];
  return (
    <BalanceCard key={r.id} r={r} coeffs={pCoeffs} onChange={setPractice} onNext={nextPractice} nextLabel="Nächste" onSolution={solvePractice}
      head={
        <div className="rg-head">
          <h2 className="rg-title">{r.title}</h2>
          <div className="rg-niveau">
            <span>Niveau</span>
            <Segmented<string> label="Niveau" value={String(niveau)} onChange={v => setNiveau(Number(v) as Niveau)}
              options={[1, 2, 3, 4].map(n => ({ value: String(n), label: String(n) }))} />
          </div>
        </div>
      } />
  );
}
