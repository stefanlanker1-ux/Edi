// pH-Skala (Werkbank): Skala und Reagenzglas als Bühne, pH-Zähler und Indikator-Wahl darunter,
// Alltagsstoffe / Säuren & Laugen / Indikatoren / So geht's in der Werkzeugleiste.

import { useState } from "react";
import { FitDown, Segmented, Stepper, Tag, Workbench, RichText } from "@lern/ui";
import { ACIDS, BASES, INDICATORS, SUBSTANCES, acidDissociation, baseDissociation, indicatorColor, ionsAtPh, phClass, phLabel } from "@lern/chem";
import { useApp } from "../store.ts";
import { PhScale, Swatch, Tube } from "../components/Ph.tsx";

const SHORT: Record<string, string> = { universal: "Universal", lackmus: "Lackmus", phenolphthalein: "Phenolph.", rotkohl: "Rotkohl" };

export function PhView() {
  const { ph, indicator, substance, setPh, setIndicator, water } = useApp();
  const [tool, setTool] = useState<string | null>(null);
  const cls = phClass(ph);
  const more = ionsAtPh(ph).more;
  return (
    <Workbench className="sb-wb" label="Werkzeuge" active={tool} onActive={setTool}
      head={<h2 className="sb-title">{substance || `pH ${ph}`}</h2>}
      stage={
        <div className="sb-stage">
          <PhScale ph={ph} />
          <Tube indicator={indicator} ph={ph} label={INDICATORS.find(i => i.id === indicator)?.name} />
        </div>
      }
      status={<>
        <Tag tone={cls === "neutral" ? "ok" : "signal"}>{phLabel(ph)}</Tag>
        {more ? <Tag>mehr {more}</Tag> : <Tag tone="ok">H⁺ = OH⁻</Tag>}
      </>}
      controls={
        <div className="sb-controls">
          <Stepper label="pH" value={ph} min={0} max={14} onChange={v => setPh(v)} />
          <Segmented label="Indikator" value={indicator} onChange={setIndicator}
            options={INDICATORS.map(i => ({ value: i.id, label: SHORT[i.id] ?? i.name }))} />
        </div>
      }
      tools={[
        { id: "stoffe", label: "Stoffe", icon: "sample", title: "Alltagsstoffe",
          content: (
            <div className="sb-list-box"><div className="sb-list" role="radiogroup" aria-label="Stoff wählen">
              {SUBSTANCES.map(s => (
                <button key={s.name} type="button" role="radio" aria-checked={s.name === substance} className={`sb-item${s.name === substance ? " on" : ""}`}
                  onClick={() => { setPh(s.ph, s.name); setTool(null); }}>
                  <i className="sb-dot" style={{ background: `var(--c-${indicatorColor("universal", s.ph).replace(/ü/g, "ue")})` }} aria-hidden="true" />
                  <span className="sb-name">{s.name}</span>
                  <span className="sb-ph">pH {s.ph}</span>
                </button>
              ))}
            </div></div>
          ) },
        { id: "sl", label: "Säuren & Laugen", icon: "table", title: "Säuren und Laugen", wide: true,
          content: (
            // reine Lesetabelle (keine Tippziele): darf zum Einpassen etwas kleiner werden
            <FitDown min={0.75} className="sb-table">
              <h3 className="sb-kind">Säuren – geben in Wasser H⁺ ab</h3>
              <ul className="sb-dl">
                {ACIDS.map(a => <li key={a.id}><span><b>{a.name}</b>{a.pure ? ` (${a.pure})` : ""} · {a.everyday}</span><code>{acidDissociation(a)}</code></li>)}
              </ul>
              <h3 className="sb-kind">Laugen – enthalten OH⁻</h3>
              <ul className="sb-dl">
                {BASES.map(b => <li key={b.id}><span><b>{b.name}</b> ({b.solid}) · {b.everyday}</span><code>{baseDissociation(b)}</code></li>)}
              </ul>
            </FitDown>
          ) },
        { id: "ind", label: "Indikatoren", icon: "leaf", title: "Indikatorfarben",
          content: (
            <table className="sb-ind">
              <thead><tr><th>Indikator</th><th>sauer<br />pH 2</th><th>neutral<br />pH 7</th><th>basisch<br />pH 12</th></tr></thead>
              <tbody>
                {INDICATORS.map(i => <tr key={i.id}><th>{i.name.replace("indikator", "\u00ADindikator").replace("Phenolphthalein", "Phenol\u00ADphthalein")}</th>{[2, 7, 12].map(p => <td key={p}><Swatch color={indicatorColor(i.id, p)} /></td>)}</tr>)}
              </tbody>
            </table>
          ) },
        { id: "how", label: "So geht's", icon: "bulb", title: "pH-Wert – so geht's",
          content: (
            <ol className="sb-how">
              <li><RichText text="**pH 0–6 sauer, 7 neutral, 8–14 basisch.** Je kleiner die Zahl, desto saurer." /></li>
              <li><RichText text="Sauer heißt: **mehr H⁺** als OH⁻ in der Lösung. Basisch: mehr OH⁻. Neutral: gleich viele." /></li>
              <li><RichText text="**Indikatoren** zeigen den pH-Wert durch ihre Farbe (Universalindikator: rot → grün → violett)." /></li>
              <li><RichText text="**Verdünnen** mit Wasser rückt den pH-Wert Richtung 7 – 10-mal so viel Wasser ≈ ein Schritt auf der Skala." /></li>
            </ol>
          ) },
        { id: "water", label: "Wasser dazu", icon: "plus", disabled: ph === 7, onClick: water },
      ]} />
  );
}
