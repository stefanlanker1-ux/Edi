// Periodensystem (Werkbank): das ganze PSE ist immer sichtbar, darüber die Suche.
// Werkzeuge: Element (Steckbrief des gewählten Elements) und Farben (Kategorien; Oberstufe auch Blöcke s/p/d/f und Trends).

import { useEffect, useState } from "react";
import { Button, Chip, FitDown, Panel, Segmented, Tag, Workbench, useNarrow, useReducedMotion } from "@lern/ui";
import {
  BY_Z, CATEGORIES, GROUP_NAMES, searchElements, standardNeutrons, configuration, configString, shortConfigString,
  shells, SHELL_NAMES, blockOf, valenceElectrons, typicalIonCharge, chargeSup, unpairedElectrons,
  ELEMENTS, TRENDS, trendScale, type Category, type TrendKey, mainGroupNumber, ROMAN,
} from "@lern/chem";
import { useApp, maxZFor } from "../store.ts";
import { PeriodicTable, Legend, BlockLegend } from "@lern/chem-ui";
import { SearchBox } from "../components/ElementPicker.tsx";
import { Bohr, Nuclide, EnergyDiagram } from "@lern/chem-ui";

export function ExploreView() {
  const { stufe, selectedZ, select } = useApp();
  const narrow = useNarrow();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | null>(null);
  const [tool, setTool] = useState<string | null>(null);
  const [color, setColor] = useState<"cat" | "blk" | TrendKey>("cat");
  const blocks = stufe === "os" && color === "blk";
  const trend = stufe === "os" && color !== "cat" && color !== "blk" ? { key: color, scale: trendScale(color, ELEMENTS.map(e => e.Z)) } : undefined;
  const hits = new Set(searchElements(q, maxZFor(stufe)).map(e => e.Z));
  const Z = selectedZ > maxZFor(stufe) ? 6 : selectedZ;

  useEffect(() => { setCat(null); setQ(""); setColor("cat"); }, [stufe]);

  const pick = (z: number) => { select(z); setTool(narrow ? "element" : tool ?? "element"); };
  const colors = (
    <>
      {stufe === "os" && (
        <Segmented<"cat" | "blk" | TrendKey> label="Färben nach" value={color} onChange={setColor}
          options={[{ value: "cat", label: "Kategorien", short: "Art" }, { value: "blk", label: "Blöcke", short: "Block" }, ...(Object.keys(TRENDS) as TrendKey[]).map(k => ({ value: k, label: TRENDS[k].label, short: TRENDS[k].short }))]} />
      )}
      {trend
        ? <div className="trend-legend">
            <div className="tl-scale"><span>niedrig</span><i /><span>hoch</span></div>
            <p><b>{TRENDS[trend.key].label}{TRENDS[trend.key].unit && ` (${TRENDS[trend.key].unit})`}</b></p>
          </div>
        : blocks ? <BlockLegend /> : <Legend stufe={stufe} active={cat} onToggle={c => setCat(cat === c ? null : c)} />}
    </>
  );

  return (
    <Workbench className="explore-wb" active={tool} onActive={setTool}
      head={<SearchBox value={q} onChange={setQ} placeholder="Element suchen …" onEnter={() => { const h = searchElements(q, maxZFor(stufe))[0]; if (h) pick(h.Z); }} />}
      stage={
        <div className="pse-fit">
          <PeriodicTable fit stufe={stufe} onPick={pick} trend={trend} blocks={blocks} cellState={z => {
            const e = BY_Z[z];
            if (hits.size) return hits.has(z) ? "hit" : "dim";
            if (cat && !trend && !blocks && e.category !== cat) return "dim";
            return z === Z ? "sel" : undefined;
          }} />
        </div>
      }
      status={trend ? <Tag>{TRENDS[trend.key].label}</Tag> : blocks ? <Tag>s · p · d · f</Tag> : cat ? <Tag>{CATEGORIES[cat].label}</Tag> : undefined}
      tools={[
        { id: "element", label: BY_Z[Z].name, icon: "atom", title: "Steckbrief", content: <ElementDetail Z={Z} onAction={() => setTool(null)} /> },
        { id: "farben", label: "Farben", icon: "grid", content: colors },
      ]} />
  );
}

export function ElementDetail({ Z, onAction }: { Z: number; onAction?: () => void }) {
  const { stufe, animate, orbitalColors, buildElement } = useApp();
  const reduced = useReducedMotion();
  const os = stufe === "os";
  const el = BY_Z[Z];
  const N = standardNeutrons(Z);
  const cfg = configuration(Z);
  const sh = shells(Z);
  const val = valenceElectrons(Z);
  const ion = typicalIonCharge(Z);
  const rows: [string, string | number][] = [
    ["Ordnungszahl", Z],
    ["Atommasse", `${el.mass.toLocaleString("de-AT")} u`],
    ["p⁺ · n · e⁻", `${Z} · ${N} · ${Z}`],
    ["Periode", `${el.period} (${sh.length} Schale${sh.length > 1 ? "n" : ""})`],
    os || mainGroupNumber(Z) === null
      ? ["Gruppe", el.group === null ? "Lanthanoide" : `${el.group}${GROUP_NAMES[el.group] ? ` · ${GROUP_NAMES[el.group]}` : ""}`]
      : ["Hauptgruppe", `${ROMAN[mainGroupNumber(Z)!]}${el.group && GROUP_NAMES[el.group] ? ` · ${GROUP_NAMES[el.group]}` : ""}`],
    ["Art", CATEGORIES[el.category].kind],
  ];
  if (val !== null) rows.push(["Außenelektronen", val]);
  if (os) {
    rows.push(["Block", `${blockOf(Z)}-Block`]);
    rows.push(["Elektronegativität", el.en === null ? "–" : el.en.toLocaleString("de-AT")]);
    rows.push(["Ungepaarte e⁻", unpairedElectrons(cfg)]);
    rows.push(["Atomradius", `${TRENDS.radius.value(Z)} pm`]);
    rows.push(["Ionisierungsenergie", `${TRENDS.ie.value(Z)!.toLocaleString("de-AT")} eV`]);
  }
  if (el.radioactive) rows.push(["Besonderheit", "radioaktiv"]);
  const go = (charge = 0) => { buildElement(Z, charge); onAction?.(); };

  const key = rows.slice(0, 4);
  const overview = (
    <FitDown min={0.5}>
      <div className="d-visual">
        <div className="d-bohr"><Bohr Z={Z} N={N} E={Z} colorByOrbital={os && orbitalColors} animate={animate && !reduced} /></div>
        <div className="d-nuc">
          <Nuclide Z={Z} N={N} E={Z} size="lg" />
          <div className="shell-chips">{sh.map((c, i) => <Chip key={i}><b>{SHELL_NAMES[i]}</b>{c}</Chip>)}</div>
        </div>
      </div>
      <dl className="d-facts">{key.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    </FitDown>
  );
  const tabs = [
    { id: "info", label: "Überblick", content: overview },
    { id: "daten", label: "Daten", content: <FitDown min={0.6}><dl className="d-facts">{rows.slice(4).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></FitDown> },
    ...(os ? [{
      id: "cfg", label: "Konfig.", content: (
        <>
          <p className="cfg-line"><span className="cfg-k">Ausführlich</span><code>{configString(cfg)}</code></p>
          <p className="cfg-line"><span className="cfg-k">Kurz</span><code>{shortConfigString(Z)}</code></p>
          <FitDown className="scroll-x" min={0.33}><EnergyDiagram cfg={cfg} /></FitDown>
        </>
      ),
    }] : []),
    ...(ion ? [{
      id: "ion", label: "Ion", content: (
        <>
          <div className="d-ion">
            <Nuclide Z={Z} N={N} E={Z - ion} size="lg" />
            <div className="ui-tags">
              <Tag>{ion > 0 ? `gibt ${ion} e⁻ ab` : `nimmt ${-ion} e⁻ auf`}</Tag>
              <Tag tone="ok">✓ Edelgaskonfiguration</Tag>
              {os && <Tag><code>{shortConfigString(Z, Z - ion)}</code></Tag>}
            </div>
          </div>
          <Button onClick={() => go(ion)}>Ion {el.symbol}{chargeSup(ion)} bauen</Button>
        </>
      ),
    }] : []),
  ];

  return (
    <div className="detail">
      <div className={`d-head cat-${el.category}`}>
        <div className="d-sym"><span className="d-z">{Z}</span><span className="d-s">{el.symbol}</span></div>
        <div className="d-title"><h2 className="d-name">{el.name}</h2><span className="ui-badge">{CATEGORIES[el.category].label}</span></div>
        <Button variant="primary" icon="atom" onClick={() => go()}>Bauen</Button>
      </div>
      <Panel className="flat" tabs={tabs} label="Steckbrief" />
    </div>
  );
}
