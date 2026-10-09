// Üben: je Stufe drei Schwierigkeiten mit je 10 Gleichungen. Oben Schwierigkeit und Aufgabe (‹ 3 / 10 ›, Fortschritt als Kästchen),
// darunter dieselbe Karte wie im Experimentieren (Teilchenbild, Gleichung, Prüfen). „Tipp“ zeigt den Hinweis zu genau dieser Gleichung,
// nach ✓ zeigt „Ablauf ansehen“ die Animation. „Teilchen“ klappt das Kugelbild ein (nur Text) und wieder aus – Standard: an.
// Zahlen und ✓ bleiben gespeichert. Nach „Lösung“ zählt „Prüfen“ nicht als gelöst (kein ✓); beim Weitergehen beginnt die Gleichung von vorn.

import { REACTION_BY_ID } from "@lern/chem";
import { Icon, Segmented, buzz } from "@lern/ui";
import { tr } from "@lern/i18n";
import { useApp, useUeben, coeffsOf } from "../store.ts";
import { BalanceCard } from "../components/BalanceCard.tsx";
import { NameLine } from "../components/Substance.tsx";
import { HowTo } from "../components/HowTo.tsx";
import { EXERCISES, HINTS, LVLS, LVL_NAMES, type Lvl } from "./exercises.ts";

export function UebenView() {
  const { stufe, model, setModel } = useApp();
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
    <BalanceCard key={id} r={r} coeffs={coeffs} hint={HINTS[id]} model={model}
      onChange={(k, v) => u.setCoeff(id, k, v)}
      onSolved={() => u.solved(id)}
      onSolution={() => u.showSolution(id, r.coeffs)} peeked={!!u.peeked[id]}
      onNext={onNext} nextLabel={nextLabel}
      head={
        <div className="rg-head rg-ueben-head">
          <div className="rg-ueben-bar">
            {/* „So geht's“ neben der Schwierigkeit: dort ist auch am schmalen Handy Platz (keine eigene Zeile) */}
            <div className="rg-seg-row">
              <Segmented<Lvl> label={tr("Schwierigkeit", "Difficulty")} value={lvl} onChange={l => { buzz(); u.setLvl(stufe, l); }}
                options={LVLS.map(l => ({ value: l, label: LVL_NAMES[l] }))} />
              <HowTo />
            </div>
            <div className="rg-nav">
              <button type="button" className="rg-nav-btn" onClick={() => go(i - 1)} disabled={i === 0} aria-label={tr("Vorige Aufgabe", "Previous exercise")}>‹</button>
              <span className="rg-nav-n" aria-label={`${tr("Aufgabe", "Exercise")} ${i + 1} / ${ids.length}, ${doneN} ${tr("gelöst", "solved")}`}>{i + 1} / {ids.length}</span>
              <button type="button" className="rg-nav-btn" onClick={() => go(i + 1)} disabled={last} aria-label={tr("Nächste Aufgabe", "Next exercise")}>›</button>
            </div>
            <button type="button" className="rg-model-btn" aria-pressed={model} onClick={() => { buzz(); setModel(!model); }}
              aria-label={model ? tr("Teilchenbild ausblenden", "Hide particle model") : tr("Teilchenbild einblenden", "Show particle model")}>
              <Icon name="molecule" size={18} /> {tr("Teilchen", "Particles")}
            </button>
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
