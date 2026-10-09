// Bereich „Lernen“: die Kapitel der Stufe als Karten (Nummer, Titel, ein Satz, Fortschritt). Antippen öffnet das Kapitel an der zuletzt
// gezeigten Folie (Vollbild wie die Erklärung). Jede Folie hat dieselben Hilfsmittel: PSE, Tipp (zur Frage, kostet nichts), Erklärung (Merksätze des Abschnitts).

import { useMemo, useState } from "react";
import { Guide, Icon, RichText, type GuideStep, type GuideTool } from "@lern/ui";
import { elementsIn } from "@lern/chem";
import { pseTool } from "@lern/chem-ui";
import { tr } from "@lern/i18n";
import { useApp } from "../store.ts";
import { kapitelFor } from "./chapters.ts";
import { useLernen } from "./progress.ts";
import type { Kapitel } from "./types.ts";

/** Abschnitt (0, 1, …) einer Folie: Zahl der Abschnittsanfänge bis dahin */
const partOf = (k: Kapitel, i: number) => Math.max(0, k.def.steps.slice(0, i + 1).filter((s, j) => s.part || j === 0).length - 1);

function tools(k: Kapitel, step: GuideStep, i: number): GuideTool[] {
  const text = [step.say ?? "", step.ask].join(" ");
  const pse = pseTool({ stufe: k.stufe, mark: elementsIn(text) });
  const rules = k.explain[partOf(k, i)] ?? [];
  return [
    { id: "pse", label: tr("PSE", "PT"), icon: "grid", title: pse.title, content: pse.content, wide: pse.wide },
    { id: "tipp", label: tr("Tipp", "Tip"), icon: "bulb", disabled: !step.tip, title: tr("Tipp", "Tip"),
      content: <p className="lk-tip"><RichText text={step.tip ?? ""} /></p> },
    { id: "erkl", label: tr("Erklärung", "Explanation"), icon: "book", title: tr("Erklärung", "Explanation"),
      content: <ul className="lk-rules">{rules.map((r, j) => <li key={j}><RichText text={r} /></li>)}</ul> },
  ];
}

export function LernenView() {
  const stufe = useApp(s => s.stufe);
  const list = useMemo(() => kapitelFor(stufe), [stufe]);
  const { pos, best, done, step } = useLernen();
  const [openId, setOpenId] = useState<string | null>(null);
  const k = list.find(x => x.id === openId);
  const next = k && list[list.indexOf(k) + 1];

  return (
    <div className="lk ui-screen">
      <h1 className="lk-title">{tr("Lernen", "Learn")} <span>· {stufe === "us" ? "Level I" : "Level II"}</span></h1>
      {stufe === "os" && <p className="lk-note">{tr("Baut auf Kapitel 1–3 (Level I) auf.", "Builds on chapters 1–3 (Level I).")}</p>}
      <ol className="lk-list">
        {list.map(x => {
          const n = x.def.steps.length, b = Math.min(best[x.id] ?? 0, n), fin = !!done[x.id];
          return (
            <li key={x.id}>
              <button type="button" className={`lk-card${fin ? " done" : ""}`} onClick={() => setOpenId(x.id)}>
                <span className="lk-nr" aria-hidden="true">{x.nr}</span>
                <span className="lk-txt">
                  <span className="lk-name">{x.title}</span>
                  <span className="lk-desc">{x.desc}</span>
                  <span className="lk-prog" aria-label={tr(`${b} von ${n} Folien`, `${b} of ${n} slides`)}><i style={{ width: `${(b / n) * 100}%` }} /></span>
                </span>
                <span className="lk-state">
                  {fin ? <><Icon name="check" size={18} /> {tr("fertig", "done")}</> : (pos[x.id] ?? 0) > 0 ? tr(`Folie ${(pos[x.id] ?? 0) + 1}`, `Slide ${(pos[x.id] ?? 0) + 1}`) : tr(`${n} Folien`, `${n} slides`)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {k && (
        <Guide key={k.id} def={k.def} open onClose={() => setOpenId(null)} badge={tr(`Kapitel ${k.nr}`, `Chapter ${k.nr}`)}
          start={pos[k.id] ?? 0} onStep={i => step(k.id, i, k.def.steps.length)} tools={(s, i) => tools(k, s, i)}
          finishLabel={next ? tr(`Kapitel ${next.nr}`, `Chapter ${next.nr}`) : tr("Zu den Kapiteln", "To the chapters")}
          onFinish={() => setOpenId(next ? next.id : null)} />
      )}
    </div>
  );
}
