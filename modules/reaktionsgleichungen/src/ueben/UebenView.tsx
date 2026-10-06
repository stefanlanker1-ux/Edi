// Üben: je Stufe drei Schwierigkeiten mit je 10 Gleichungen. Oben Schwierigkeit und Aufgabe (‹ 3 / 10 ›, Fortschritt als Kästchen),
// darunter dieselbe Karte wie im Experimentieren (Teilchenbild, Gleichung, Prüfen). „Tipp“ zeigt den Hinweis zu genau dieser Gleichung,
// nach ✓ zeigt „Ablauf ansehen“ die Animation. Zahlen und ✓ bleiben gespeichert.

import { REACTION_BY_ID } from "@lern/chem";
import { Segmented, buzz } from "@lern/ui";
import { tr } from "@lern/i18n";
import { useApp, useUeben, coeffsOf } from "../store.ts";
import { BalanceCard } from "../components/BalanceCard.tsx";
import { NameLine } from "../components/Substance.tsx";
import { EXERCISES, HINTS, LVLS, LVL_NAMES, type Lvl } from "./exercises.ts";

export function UebenView() {
  const stufe = useApp(s => s.stufe);
  const u = useUeben();
  const lvl = u.lvl[stufe];
  const ids = EXERCISES[stufe][lvl];
  const i = Math.min(Math.max(u.at[`${stufe}-${lvl}`] ?? 0, 0), ids.length - 1);
  const id = ids[i], r = REACTION_BY_ID[id];
  const coeffs = coeffsOf(u, id);
  const go = (j: number) => { buzz(); u.setAt(stufe, lvl, j); };
  const nextLvl = LVLS[LVLS.indexOf(lvl) + 1] as Lvl | undefined;
  const last = i === ids.length - 1;
  const onNext = !last ? () => u.setAt(stufe, lvl, i + 1) : nextLvl ? () => u.setLvl(stufe, nextLvl) : undefined;
  const nextLabel = !last ? tr("Nächste Aufgabe", "Next exercise") : nextLvl ? `${tr("Weiter zu", "On to")} ${LVL_NAMES[nextLvl]}` : undefined;
  const doneN = ids.filter(x => u.done[x]).length;
  return (
    <BalanceCard key={id} r={r} coeffs={coeffs} hint={HINTS[id]}
      onChange={(k, v) => u.setCoeff(id, k, v)}
      onSolved={() => u.solved(id)}
      onSolution={() => u.setCoeffs(id, r.coeffs)}
      onNext={onNext} nextLabel={nextLabel}
      head={
        <div className="rg-head rg-ueben-head">
          <div className="rg-ueben-bar">
            <Segmented<Lvl> label={tr("Schwierigkeit", "Difficulty")} value={lvl} onChange={l => { buzz(); u.setLvl(stufe, l); }}
              options={LVLS.map(l => ({ value: l, label: LVL_NAMES[l] }))} />
            <div className="rg-nav">
              <button type="button" className="rg-nav-btn" onClick={() => go(i - 1)} disabled={i === 0} aria-label={tr("Vorige Aufgabe", "Previous exercise")}>‹</button>
              <span className="rg-nav-n" aria-label={`${tr("Aufgabe", "Exercise")} ${i + 1} / ${ids.length}, ${doneN} ${tr("gelöst", "solved")}`}>{i + 1} / {ids.length}</span>
              <button type="button" className="rg-nav-btn" onClick={() => go(i + 1)} disabled={last} aria-label={tr("Nächste Aufgabe", "Next exercise")}>›</button>
            </div>
          </div>
          <div className="rg-dots" aria-hidden="true">
            {ids.map((x, j) => <span key={x} className={`${j === i ? "on" : ""}${u.done[x] ? " done" : ""}`}>{u.done[x] ? "✓" : ""}</span>)}
          </div>
          <h2 className="rg-title">{r.title}</h2>
          <NameLine eq={r} />
        </div>
      } />
  );
}
