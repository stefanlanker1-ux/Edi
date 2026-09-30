// Mischen (Werkbank): Becherglas und Teilchenmodell als Bühne, darunter der Inhalt (antippen = heraus) mit Schütteln und Leeren.
// Werkzeuge: Stoffe (Regal), Trennen (6 Verfahren), Erhitzen, Übersicht (Einteilung, aktueller Inhalt markiert), So geht's.
// Status: Einteilung, Gemischtyp mit Aggregatzuständen und die Zählung Phasen / Elemente / Verbindungen.

import { useId, useState } from "react";
import { Button, Icon, RichText, Tag, Workbench, buzz } from "@lern/ui";
import { Formula, pseTool } from "@lern/chem-ui";
import { METHODS, MIX_TYPES, STOFF, STOFFE, alloyName, classText, formulaElements, isAlloy, isElement, mix, separate, type Item, type Method } from "@lern/chem";
import { useApp } from "../store.ts";
import { BeakerPair, MacroBeaker, W, H } from "../components/Beaker.tsx";
import { ConceptMap, pathOf } from "../components/ConceptMap.tsx";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
export const itemName = (x: Item) => (isAlloy(x) ? alloyName(x.alloy) : STOFF[x].name);
/** Öl als Name statt Riesenformel (C₅₇H₁₀₄O₆) */
export const shownFormula = (id: string) => (id === "oel" ? "Öl" : STOFF[id].formula);
const itemFormula = (x: Item) => (isAlloy(x) ? x.alloy.map(shownFormula).join(" + ") : shownFormula(x));

function Shelf({ items, onToggle }: { items: Item[]; onToggle: (id: string) => void }) {
  const group = (el: boolean) => STOFFE.filter(s => isElement(s) === el);
  return (
    <div className="shelf">
      {([true, false] as const).map(el => (
        <section key={String(el)} className="shelf-group">
          <h3>{el ? "Elemente" : "Verbindungen"}</h3>
          <div className="shelf-grid">
            {group(el).map(s => {
              const on = items.includes(s.id);
              return (
                <button key={s.id} type="button" className={`shelf-item${on ? " on" : ""}`} aria-pressed={on} onClick={() => onToggle(s.id)}>
                  <i className="sw" style={{ background: `var(--st-${s.color})` }} aria-hidden="true" />
                  <b data-st={s.state === "s" ? "(s)" : s.state === "l" ? "(l)" : "(g)"}><Formula f={shownFormula(s.id)} /></b>
                  <span>{s.name.replace(/stoff(?=[a-zäöü])/g, "stoff\u00AD")}</span>
                  <small>{s.state === "s" ? "fest" : s.state === "l" ? "flüssig" : "gasförmig"}</small>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function Methods({ items, settled, onPick }: { items: Item[]; settled: boolean; onPick: (m: Method) => void }) {
  return (
    <div className="methods">
      {(Object.keys(METHODS) as Method[]).map(m => {
        const ok = separate(items, m, settled).ok;
        return (
          <button key={m} type="button" className={`method${ok ? " fits" : ""}`} onClick={() => onPick(m)}>
            <b>{METHODS[m].name}</b>
            <span>{METHODS[m].idea}</span>
          </button>
        );
      })}
    </div>
  );
}

const HOW = [
  "**Reinstoff:** nur eine Sorte Teilchen – **Element** (eine Atomsorte: Fe, O₂) oder **Verbindung** (verschiedene Atome fest verbunden: H₂O, NaCl).",
  "**Gemisch:** mehrere Reinstoffe, nur vermischt. **Homogen** = überall gleich (auch unter dem Mikroskop), **heterogen** = Teilchen, Tröpfchen oder Schichten erkennbar.",
  "**Phase:** jeder einheitliche Bereich (Schicht, Bodensatz, Gasraum). Gelöstes bildet keine eigene Phase.",
  "Zählen: **Phasen** – **Elemente** (Stoffe aus einer Atomsorte) – **Verbindungen** (Stoffe aus mehreren Atomsorten).",
];

export function MixView() {
  const { items, shaken, fractions, note, toggle, remove, clear, setShaken, trennen, pick, back, erhitzen } = useApp();
  const [tool, setTool] = useState<string | null>(null);
  const id = useId().replace(/:/g, "");
  const m = mix(items);
  const c = m.counts;
  const hasLoose = m.phases.some(p => p.role === "fest") && m.phases.some(p => p.state === "l");
  const hasTwoLiquids = m.phases.filter(p => p.state === "l").length > 1;
  const canShake = hasLoose || hasTwoLiquids || m.phases.filter(p => p.role === "fest").length > 1;

  const stage = fractions
    ? (
      <div className="frac">
        {fractions.list.map((f, i) => (
          <figure key={i} className="frac-item">
            <svg className="bk small" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${f.label}: ${f.items.map(itemName).join(", ")}`}>
              <MacroBeaker items={f.items} shaken={false} id={`${id}f${i}`} />
            </svg>
            <figcaption><b>{f.label}</b><span>{f.items.map(itemName).join(", ")}</span></figcaption>
          </figure>
        ))}
      </div>
    )
    : <BeakerPair items={items} shaken={shaken} id={id} />;

  return (
    <Workbench className="mx-wb" label="Stoffe mischen" active={tool} onActive={setTool}
      head={<h2 className="mx-title">{fractions ? `${METHODS[fractions.method].name}` : items.length ? (m.label ?? classText(m)) : "Becher leer"}</h2>}
      stage={stage}
      status={fractions
        ? <>{fractions.gone && <Tag>{fractions.gone}</Tag>}<Tag tone="ok">✓ getrennt</Tag></>
        : items.length ? <>
          <Tag tone="signal">{classText(m)}</Tag>
          {m.types.map(t => <Tag key={t.type + t.states}>{MIX_TYPES[t.type].name} ({t.states})</Tag>)}
          <Tag>{plural(c.phases, "Phase", "Phasen")} · {plural(c.elements, "Element", "Elemente")} · {plural(c.compounds, "Verbindung", "Verbindungen")}</Tag>
          {note && <Tag tone={note.tone === "ok" ? "ok" : note.tone === "signal" ? "signal" : undefined}>{note.text}</Tag>}
        </> : <Tag>Stoffe aus dem Regal wählen</Tag>}
      controls={fractions
        ? (
          <div className="mx-controls">
            <div className="mx-items">
              {fractions.list.map((f, i) => (
                <Button key={i} variant={i === 0 ? "primary" : undefined} onClick={() => { buzz(); pick(f); }}>Weiter mit {f.items.map(itemName).join(" + ")}</Button>
              ))}
            </div>
            <Button icon="back" onClick={back}>Zurück</Button>
          </div>
        )
        : (
          <div className="mx-controls">
            <div className="mx-items" aria-label="Inhalt (antippen = herausnehmen)">
              {items.map((x, i) => (
                <button key={i} type="button" className="mx-chip" onClick={() => { buzz(); remove(i); }} aria-label={`${itemName(x)} herausnehmen`}>
                  <i className="sw" style={{ background: `var(--st-${isAlloy(x) ? "legierung" : STOFF[x].color})` }} aria-hidden="true" />
                  <Formula f={itemFormula(x)} /><Icon name="close" size={14} />
                </button>
              ))}
              <button type="button" className="mx-chip add" onClick={() => setTool("stoffe")} aria-label="Stoff dazugeben"><Icon name="plus" size={18} /></button>
            </div>
            <div className="mx-actions">
              <Button icon="shake" disabled={!canShake} aria-pressed={shaken} onClick={() => { buzz(); setShaken(!shaken); }}>{shaken ? "Absetzen" : "Schütteln"}</Button>
              <Button icon="reset" disabled={!items.length} onClick={clear}>Leeren</Button>
            </div>
          </div>
        )}
      tools={[
        { id: "stoffe", label: "Stoffe", icon: "beaker", title: "Stoffregal", wide: true, content: <Shelf items={items} onToggle={sid => { buzz(); toggle(sid); }} /> },
        { id: "trennen", label: "Trennen", icon: "funnel", title: "Trennverfahren",
          content: <Methods items={items} settled={!shaken} onPick={mt => { buzz(); trennen(mt); setTool(null); }} /> },
        { id: "heat", label: "Erhitzen", icon: "fire", disabled: !items.length || !!fractions, onClick: () => { buzz(); erhitzen(); } },
        pseTool({ stufe: "us", mark: formulaElements(...items.flatMap(x => (isAlloy(x) ? x.alloy : [x])).filter(s => s !== "oel").map(s => STOFF[s].formula)) }),
        { id: "map", label: "Über\u00ADsicht", icon: "layers", title: "Einteilung der Stoffe", wide: true, content: <ConceptMap on={pathOf(items.length && !fractions ? m : null)} /> },
        { id: "how", label: "So geht's", icon: "bulb", title: "Reinstoffe und Gemische",
          content: <ul className="mx-how">{HOW.map((t, i) => <li key={i}><RichText text={t} /></li>)}</ul> },
      ]} />
  );
}
