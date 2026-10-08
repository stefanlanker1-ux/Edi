// Baukasten: Atome aus Protonen, Neutronen und Elektronen zusammensetzen.
// Hinzufügen per Tippen, Ziehen oder +; Entfernen per − oder Herausziehen aus dem Atom.

import { useRef, useState } from "react";
import { Button, FitDown, IconButton, Stepper, Switch, Tag, Workbench, buzz, useReducedMotion, type WorkbenchTool } from "@lern/ui";
import {
  BY_Z, CATEGORIES, STABLE_N, standardNeutrons, ionName, isStable, configuration, configString, shortConfigString,
  shells, SHELL_NAMES, chargeSup, signed, mainGroupNumber, ROMAN, configException,
} from "@lern/chem";
import { useApp, maxZFor } from "../store.ts";
import { ElementPicker } from "../components/ElementPicker.tsx";
import { ExceptionTag } from "../components/ConfigNote.tsx";
import { Bohr, type Particle, Nuclide, EnergyDiagram, OrbitalAtom } from "@lern/chem-ui";
import { tr } from "@lern/i18n";

const PARTS: { key: "Z" | "N" | "E"; type: Particle; label: string }[] = [
  { key: "Z", type: "proton", label: tr("Protonen", "Protons") },
  { key: "N", type: "neutron", label: tr("Neutronen", "Neutrons") },
  { key: "E", type: "electron", label: tr("Elektronen", "Electrons") },
];
const KEY: Record<Particle, "Z" | "N" | "E"> = { proton: "Z", neutron: "N", electron: "E" };

export function BuildView() {
  const { build, stufe, animate, orbitalColors, setBuild, setOpt } = useApp();
  const reduced = useReducedMotion();
  const [picker, setPicker] = useState(false);
  const { Z, N, E } = build;
  const os = stufe === "os";
  const el = BY_Z[Z];
  const q = Z - E;
  const limits = { Z: [0, maxZFor(stufe)], N: [0, os ? 140 : 30], E: [0, Math.max(0, Z + 3)] } as const;

  const change = (key: "Z" | "N" | "E", value: number) => {
    const [lo, hi] = limits[key];
    if (value < lo || value > hi) { buzz(30); return; }
    const next = { ...build, [key]: value };
    if (key === "Z") next.E = Math.min(next.E, next.Z + 3);
    buzz();
    setBuild(next);
  };
  const add = (t: Particle, d: number) => change(KEY[t], build[KEY[t]] + d);
  const drag = useParticleDrag(add);
  const sh = shells(Z, E);

  const tags = statusTags(Z, N, E);
  const tools: WorkbenchTool[] = [
    {
      id: "teilchen", label: tr("Teilchen", "Particles"), icon: "pm", content: (
        <>
          <div className="steppers">
            {PARTS.map(p => (
              <Stepper key={p.key} compact tone={p.type} label={p.label} value={build[p.key]}
                min={limits[p.key][0]} max={limits[p.key][1]} onChange={v => change(p.key, v)} />
            ))}
          </div>
          <div className="btn-row">
            <Button onClick={() => setBuild({ E: Z })} disabled={!Z}>{tr("Neutral machen", "Make neutral")}</Button>
            <Button onClick={() => setBuild({ N: standardNeutrons(Z) })} disabled={!Z}>{tr("Häufigstes Isotop", "Most common isotope")}</Button>
            <Button variant="quiet" icon="reset" onClick={() => setBuild({ Z: 0, N: 0, E: 0 })}>{tr("Leeren", "Clear")}</Button>
          </div>
        </>
      ),
    },
    {
      id: "steckbrief", label: tr("Steckbrief", "Profile"), icon: "info", content: (
        <>
          <dl className="facts">
            <div><dt>{tr("Ordnungszahl Z", "Atomic number Z")}</dt><dd>{Z}</dd></div>
            <div><dt>{tr("Massenzahl A", "Mass number A")}</dt><dd>{Z + N}</dd></div>
            <div><dt>{tr("Ladung", "Charge")}</dt><dd>{signed(q)}</dd></div>
            {el && <div><dt>{tr("Periode", "Period")} · {os ? tr("Gruppe", "Group") : tr("Hauptgruppe", "Main group")}</dt><dd>{el.period} · {os ? (el.group ?? "La–Lu") : (mainGroupNumber(Z) ? ROMAN[mainGroupNumber(Z)!] : `${tr("Gruppe", "Group")} ${el.group ?? "La–Lu"}`)}</dd></div>}
            <div><dt>{tr("Schalen", "Shells")}</dt><dd>{sh.length ? sh.map((c, i) => `${SHELL_NAMES[i]}${c}`).join(" ") : "–"}</dd></div>
            {el && isStable(Z, N) === false && <div><dt>{tr("Stabile Isotope", "Stable isotopes")}</dt><dd>{STABLE_N[Z].map(n => `${el.symbol}-${Z + n}`).join(", ")}</dd></div>}
          </dl>
          {os && el && E > 0 && configException(Z, E) && <div className="ui-tags"><ExceptionTag Z={Z} E={E} /></div>}
        </>
      ),
    },
    ...(os && E > 0 ? [{
      id: "konfig", label: tr("Konfiguration", "Configuration"), icon: "layers" as const, content: (
        <>
          <p className="cfg-line"><span className="cfg-k">{tr("Ausführlich", "Full")}</span><code>{configString(configuration(Z, E))}</code></p>
          <p className="cfg-line"><span className="cfg-k">{tr("Kurz", "Short")}</span><code>{shortConfigString(Z, E)}</code></p>
          {((q > 0 && Z > 20) || configException(Z, E)) && (
            <div className="ui-tags">
              {q > 0 && Z > 20 && <Tag>{tr("Kation: zuerst höchstes n abgeben", "Cation: highest n is lost first")}</Tag>}
              <ExceptionTag Z={Z} E={E} />
            </div>
          )}
          <FitDown className="scroll-x" min={0.33}><EnergyDiagram cfg={configuration(Z, E)} color={orbitalColors} /></FitDown>
          <Switch checked={orbitalColors} onChange={v => setOpt({ orbitalColors: v })}>
            {tr("Nach Orbital färben", "Colour by orbital")} (<b className="t-s">s</b> <b className="t-p">p</b> <b className="t-d">d</b> <b className="t-f">f</b>)
          </Switch>
        </>
      ),
    }] : []),
    // Orbitalmodell: das Atom in 3D (Wellenmechanik), nur Level II
    ...(os && E > 0 && Z > 0 ? [{
      id: "wellen", label: tr("Wellenmechanik", "Wave mechanics"), title: tr("Orbitalmodell", "Orbital model"), icon: "atom" as const, wide: true, content: (
        <div className="orb-tool"><OrbitalAtom key={`${Z}-${E}`} Z={Z} E={E} /></div>
      ),
    }] : []),
    { id: "element", label: "Element", icon: "grid", onClick: () => setPicker(true) },
  ];

  return (
    <>
      <Workbench className="build-wb" tools={tools}
        head={<>
          <div className="stage-id">
            <Nuclide Z={Z} N={N} E={E} size="lg" />
            <div className="stage-names">
              <h2>{el ? (q ? ionName(Z, q) : el.name) : tr("Noch kein Element", "No element yet")}</h2>
              {el && <span className={`ui-badge cat-${el.category}`}>{CATEGORIES[el.category].label}</span>}
            </div>
          </div>
          <IconButton icon="play" className={animate ? "pressed" : ""} aria-pressed={animate} label={tr("Elektronen kreisen lassen", "Let electrons orbit")} onClick={() => setOpt({ animate: !animate })} />
        </>}
        stage={
          <div ref={drag.stageRef} className={`stage${drag.over ? ` ${drag.over}` : ""}`}>
            <Bohr Z={Z} N={N} E={E} ghost colorByOrbital={os && orbitalColors} animate={animate && !reduced} onParticleDown={drag.fromAtom} />
          </div>
        }
        status={tags.length > 0 ? tags : undefined}
        controls={
          <div className="pools" aria-label={tr("Teilchen-Vorrat: antippen oder ins Atom ziehen", "Particle supply: tap or drag into the atom")}>
            {PARTS.map(p => (
              <button key={p.type} type="button" className={`pool pool-${p.type}`} aria-label={tr(`${p.label} hinzufügen`, `Add ${p.label.toLowerCase()}`)}
                onPointerDown={e => drag.fromPool(p.type, e)} onClick={e => { if (e.detail === 0) add(p.type, 1); }}>
                <span className="pool-dots">{Array.from({ length: 3 }, (_, i) => <i key={i} />)}</span>
                <span className="pool-lbl">{p.label}</span>
              </button>
            ))}
          </div>
        } />

      <ElementPicker open={picker} stufe={stufe} selected={Z} title={tr("Welches Atom möchtest du bauen?", "Which atom do you want to build?")}
        onPick={z => setBuild({ Z: z, N: standardNeutrons(z), E: z })} onClose={() => setPicker(false)} />
      {drag.ghost && <div className={`drag-ghost ${drag.ghost.type}`} style={{ transform: `translate(${drag.ghost.x}px, ${drag.ghost.y}px)` }} />}
    </>
  );
}

/** Kurze Statusmarken statt Sätzen: neutral/Kation/Anion, Edelgaskonfiguration, stabil/radioaktiv */
function statusTags(Z: number, N: number, E: number) {
  const el = BY_Z[Z];
  if (!el) return [];
  const q = Z - E;
  const out = [
    q === 0 ? <Tag key="q" tone="ok">✓ neutral</Tag> : <Tag key="q">{q > 0 ? tr("Kation", "Cation") : "Anion"} {el.symbol}{chargeSup(q)}</Tag>,
  ];
  if ([2, 10, 18, 36, 54, 86].includes(E)) out.push(<Tag key="n" tone="ok">✓ {tr("Edelgaskonfiguration", "Noble gas configuration")}</Tag>);
  const stable = isStable(Z, N);
  if (stable === true) out.push(<Tag key="s" tone="ok">✓ {tr("Kern stabil", "Stable nucleus")}</Tag>);
  else if (stable === false || el.radioactive) out.push(<Tag key="s" tone="bad">✗ {tr("radioaktiv", "radioactive")}</Tag>);
  return out;
}

// ── Ziehen mit Pointer Events (Maus, Finger, Stift) ─────────────────────────

function useParticleDrag(add: (t: Particle, d: number) => void) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [ghost, setGhost] = useState<{ type: Particle; x: number; y: number } | null>(null);
  const [over, setOver] = useState<"drop-in" | "drop-in over" | "drop-out" | "drop-out over" | null>(null);

  const inside = (x: number, y: number) => {
    const r = stageRef.current!.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };
  const start = (type: Particle, dir: "in" | "out", e: React.PointerEvent) => {
    if (e.button > 0) return;
    e.preventDefault();
    const x0 = e.clientX, y0 = e.clientY;
    let moved = false;
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6) moved = true;
      if (!moved) return;
      setGhost({ type, x: ev.clientX, y: ev.clientY });
      const on = inside(ev.clientX, ev.clientY);
      setOver(dir === "in" ? (on ? "drop-in over" : "drop-in") : (on ? "drop-out" : "drop-out over"));
    };
    const end = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      setGhost(null); setOver(null);
      if (ev.type === "pointercancel") return;
      const on = inside(ev.clientX, ev.clientY);
      if (dir === "in" && (!moved || on)) add(type, 1);
      if (dir === "out" && moved && !on) add(type, -1);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };
  return {
    stageRef, ghost, over,
    fromPool: (t: Particle, e: React.PointerEvent) => start(t, "in", e),
    fromAtom: (t: Particle, e: React.PointerEvent) => start(t, "out", e),
  };
}
