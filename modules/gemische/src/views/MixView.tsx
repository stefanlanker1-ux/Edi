// Probieren: zehn fertige Beispiele im Teilchenmodell (kein Baukasten). Teilchen antippen = Stoff-Info mit 3D-Modell.
// Schütteln verteilt die Teilchen neu – Öl und Wasser entmischen sich danach wieder (Öl steigt auf), Lösungen bleiben gemischt.
// Werkzeuge: Elemente (Atomsorten mit Farbe), Stoffe (Reinstoffe: Verbindungen | Elemente), Zählen, Beispiele.

import { useEffect, useId, useRef, useState } from "react";
import { Button, IconButton, Tag, Workbench, buzz, useReducedMotion } from "@lern/ui";
import { Kalotte, KalotteShades, SubstanceSheet, kalotteBox, kalotteElements } from "@lern/chem-ui";
import { toSubscript } from "@lern/chem";
import { EXAMPLES, MIX_LABEL, analyse, elementName, mixKind, nameOf, type Example } from "../mixtures.ts";
import { initial, rng, seedOf, separated, shake, step } from "../mixing.ts";
import { Beaker } from "../components/Beaker.tsx";
import { useApp } from "../store.ts";

/** kleines Bild eines Teilchens (Liste der Stoffe) */
export function MiniParticle({ f, size = 40 }: { f: string; size?: number }) {
  const gid = useId().replace(/:/g, "");
  const b = kalotteBox(f), e = Math.max(b.w, b.h) + .4;
  return (
    <svg className="gm-mini" viewBox={`${-e / 2} ${-e / 2} ${e} ${e}`} width={size} height={size} aria-hidden="true">
      <KalotteShades gid={gid} els={kalotteElements([f])} />
      <Kalotte f={f} cx={0} cy={0} gid={gid} />
    </svg>
  );
}

function Legend({ ex }: { ex: Example }) {
  const a = analyse(ex.items);
  return (
    <ul className="gm-legend">
      {a.atomsorten.map(el => (
        <li key={el}><MiniParticle f={el} size={30} /><span>{elementName(el)} <b>({el})</b></span></li>
      ))}
    </ul>
  );
}

function Substances({ ex, onPick }: { ex: Example; onPick: (f: string) => void }) {
  const a = analyse(ex.items);
  const n = Object.fromEntries(ex.items);
  const col = (title: string, fs: string[]) => (
    <div className="gm-col">
      <h3>{title} <span>{fs.length}</span></h3>
      {fs.length ? fs.map(f => (
        <button key={f} type="button" className="gm-sub" onClick={() => { buzz(); onPick(f); }}>
          <MiniParticle f={f} size={36} />
          <span><b>{nameOf(f)}</b><small>{toSubscript(f)} · {n[f]} Teilchen</small></span>
        </button>
      )) : <p className="gm-none">–</p>}
    </div>
  );
  return (
    <div className="gm-subs">
      <p className="gm-cap">Reinstoffe</p>
      <div className="gm-cols">{col("Verbindungen", a.verbindungen)}{col("Elemente", a.elemente)}</div>
    </div>
  );
}

function Counts({ ex }: { ex: Example }) {
  const a = analyse(ex.items);
  const rows: [string, number][] = [["Teilchen", a.teilchen], ["Reinstoffe", a.stoffe.length], ["davon Verbindungen", a.verbindungen.length],
    ["davon Elemente", a.elemente.length], ["Atomsorten", a.atomsorten.length]];
  return (
    <dl className="gm-counts">
      {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
    </dl>
  );
}

function ExampleList({ current, onPick }: { current: number; onPick: (i: number) => void }) {
  return (
    <div className="gm-examples">
      {EXAMPLES.map((e, i) => (
        <button key={e.id} type="button" aria-pressed={i === current} className="gm-ex" onClick={() => { buzz(); onPick(i); }}>
          <span className="gm-ex-n">{i + 1}</span><span>{e.title}</span>
        </button>
      ))}
    </div>
  );
}

function Mix({ ex, index }: { ex: Example; index: number }) {
  const setEx = useApp(s => s.setEx);
  const reduced = useReducedMotion();
  const [sim, setSim] = useState(() => initial(ex.items, ex.state, ex.floats, seedOf(ex.id)));
  const [shaking, setShaking] = useState(false);
  const [ticks, setTicks] = useState(0); // verbleibende Zeitschritte nach dem Schütteln
  const [pick, setPick] = useState<string | null>(null);
  const [tool, setTool] = useState<string | null>(null);
  const r = useRef(rng(seedOf(ex.id) + 1));
  const floats = ex.floats ?? [];

  useEffect(() => {
    if (!ticks) return;
    const t = setTimeout(() => {
      const ps = step(sim.ps, sim.grid, floats, r.current);
      setSim({ ...sim, ps });
      // entmischt: Bewegung endet
      setTicks(floats.length && separated(ps, sim.grid, floats) ? 0 : ticks - 1);
    }, 480);
    return () => clearTimeout(t);
  }, [ticks, sim]); // eslint-disable-line react-hooks/exhaustive-deps

  const doShake = () => {
    buzz();
    const shaken = shake(sim.ps, sim.grid, r.current);
    if (reduced) {
      // ohne Bewegung: gleich das Ergebnis zeigen
      let ps = shaken;
      for (let k = 0; k < 80 && floats.length && !separated(ps, sim.grid, floats); k++) ps = step(ps, sim.grid, floats, r.current);
      setSim({ ...sim, ps });
      return;
    }
    setShaking(true);
    setSim({ ...sim, ps: shaken });
    setTimeout(() => { setShaking(false); setTicks(floats.length ? 80 : 8); }, 650);
  };

  const a = analyse(ex.items);
  const kind = mixKind(ex);
  const moving = ticks > 0 || shaking;
  return (
    <>
      <Workbench className="gm-wb" active={tool} onActive={setTool}
        head={
          <div className="gm-head">
            <h2 className="gm-title">{ex.title}</h2>
            <span className="gm-num">{index + 1} / {EXAMPLES.length}</span>
            {ex.note && <p className="gm-note">{ex.note}</p>}
          </div>
        }
        stage={<Beaker grid={sim.grid} ps={sim.ps} state={ex.state} shaking={shaking} onPick={f => { buzz(); setPick(f); }}
          label={`${ex.title}: ${ex.items.map(([f, n]) => `${n} × ${nameOf(f)}`).join(", ")}`} />}
        status={<>
          {MIX_LABEL[kind].map(l => <Tag key={l}>{l}</Tag>)}
          <Tag>{a.teilchen} Teilchen</Tag>
        </>}
        controls={
          <div className="gm-controls">
            <IconButton icon="back" label="Voriges Beispiel" onClick={() => { buzz(); setEx(index - 1); }} />
            <Button variant="primary" icon="shake" onClick={doShake} disabled={moving}>Schütteln</Button>
            <IconButton icon="arrow" label="Nächstes Beispiel" onClick={() => { buzz(); setEx(index + 1); }} />
          </div>
        }
        tools={[
          { id: "elemente", label: "Elemente", icon: "atom", content: <Legend ex={ex} /> },
          { id: "stoffe", label: "Stoffe", icon: "molecule", content: <Substances ex={ex} onPick={f => setPick(f)} /> },
          { id: "zaehlen", label: "Zählen", icon: "table", content: <Counts ex={ex} /> },
          { id: "beispiele", label: "Beispiele", icon: "grid", content: <ExampleList current={index} onPick={i => { setEx(i); setTool(null); }} /> },
        ]} />
      <SubstanceSheet f={pick} onClose={() => setPick(null)} />
    </>
  );
}

export function MixView() {
  const ex = useApp(s => s.ex);
  // key: neues Beispiel → Anfangslage neu
  return <Mix key={ex} ex={EXAMPLES[ex]} index={ex} />;
}
