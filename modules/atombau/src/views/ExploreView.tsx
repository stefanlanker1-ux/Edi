// Periodensystem (Werkbank): das ganze PSE ist immer sichtbar, darüber die Suche.
// Werkzeuge: Element (Steckbrief des gewählten Elements) und Farben (Kategorien; Oberstufe auch Blöcke s/p/d/f und Trends).

import { useEffect, useState } from "react";
import { Button, FitDown, Panel, Segmented, Tag, Workbench, useNarrow, useReducedMotion } from "@lern/ui";
import {
  BY_Z, CATEGORIES, groupName, searchElements, standardNeutrons, configuration, configString, shortConfigString,
  shells, shellLines, blockOf, valenceElectrons, typicalIonCharge, chargeSup, unpairedElectrons, configException,
  ELEMENTS, TRENDS, trendScale, kindLabel, type Category, type TrendKey, mainGroupNumber, ROMAN,
} from "@lern/chem";
import { useApp, maxZFor } from "../store.ts";
import { PeriodicTable, Legend, BlockLegend } from "@lern/chem-ui";
import { SearchBox } from "../components/ElementPicker.tsx";
import { ExceptionTag } from "../components/ConfigNote.tsx";
import { Bohr, Nuclide, EnergyDiagram } from "@lern/chem-ui";
import { tr } from "@lern/i18n";

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
        <Segmented<"cat" | "blk" | TrendKey> label={tr("Färben nach", "Colour by")} value={color} onChange={setColor}
          options={[{ value: "cat", label: tr("Kategorien", "Categories"), short: tr("Art", "Type") }, { value: "blk", label: tr("Blöcke", "Blocks"), short: "Block" }, ...(Object.keys(TRENDS) as TrendKey[]).map(k => ({ value: k, label: TRENDS[k].label, short: TRENDS[k].short }))]} />
      )}
      {trend
        ? <div className="trend-legend">
            <div className="tl-scale"><span>{tr("niedrig", "low")}</span><i /><span>{tr("hoch", "high")}</span></div>
            <p><b>{TRENDS[trend.key].label}{TRENDS[trend.key].unit && ` (${TRENDS[trend.key].unit})`}</b></p>
          </div>
        : blocks ? <BlockLegend /> : <Legend stufe={stufe} active={cat} onToggle={c => setCat(cat === c ? null : c)} />}
    </>
  );

  return (
    <Workbench className="explore-wb" active={tool} onActive={setTool}
      head={<SearchBox value={q} onChange={setQ} placeholder={tr("Element suchen …", "Search element …")} onEnter={() => { const h = searchElements(q, maxZFor(stufe))[0]; if (h) pick(h.Z); }} />}
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
        { id: "element", label: BY_Z[Z].name, icon: "atom", title: tr("Steckbrief", "Profile"), content: <ElementDetail Z={Z} onAction={() => setTool(null)} /> },
        { id: "farben", label: tr("Farben", "Colours"), icon: "grid", content: colors },
      ]} />
  );
}

export function ElementDetail({ Z, onAction }: { Z: number; onAction?: () => void }) {
  const { stufe, animate, orbitalColors, buildElement } = useApp();
  const reduced = useReducedMotion();
  const LOC = tr("de-AT", "en-GB");
  const os = stufe === "os";
  const el = BY_Z[Z];
  const N = standardNeutrons(Z);
  const cfg = configuration(Z);
  const sh = shells(Z);
  const val = valenceElectrons(Z);
  const ion = typicalIonCharge(Z);
  const rows: [string, string | number][] = [
    [tr("Ordnungszahl", "Atomic number"), Z],
    [tr("Atommasse", "Atomic mass"), `${el.mass.toLocaleString(LOC)} u`],
    // Teilchen mit Zeichen an jeder Zahl („11 · 12 · 11“ sähe aus wie eine Rechnung)
    [tr("Teilchen", "Particles"), `${Z} p⁺, ${N} n, ${Z} e⁻`],
    // Pd [Kr] 4d¹⁰: Periode 5, aber die 5s-Unterschale ist leer
    [tr("Periode", "Period"), sh.length < el.period
      ? tr(`${el.period} (${sh.length} besetzte Schalen, ${el.period}s leer)`, `${el.period} (${sh.length} occupied shells, ${el.period}s empty)`)
      : tr(`${el.period} (${sh.length} Schale${sh.length > 1 ? "n" : ""})`, `${el.period} (${sh.length} shell${sh.length > 1 ? "s" : ""})`)],
    os || mainGroupNumber(Z) === null
      ? [tr("Gruppe", "Group"), el.group === null ? tr("Lanthanoide", "Lanthanoids") : `${el.group}${groupName(Z) ? ` · ${groupName(Z)}` : ""}`]
      : [tr("Hauptgruppe", "Main group"), `${ROMAN[mainGroupNumber(Z)!]}${groupName(Z) ? ` · ${groupName(Z)}` : ""}`],
    [tr("Art", "Type"), kindLabel(CATEGORIES[el.category].kind)],
  ];
  if (val !== null) rows.push([tr("Außenelektronen", "Outer electrons"), val]);
  if (os) {
    rows.push(["Block", `${blockOf(Z)}${tr("-Block", " block")}`]);
    rows.push([tr("Elektronegativität", "Electronegativity"), el.en === null ? "–" : el.en.toLocaleString(LOC)]);
    rows.push([tr("Ungepaarte e⁻", "Unpaired e⁻"), unpairedElectrons(cfg)]);
    rows.push([tr("Atomradius", "Atomic radius"), `${TRENDS.radius.value(Z)} pm`]);
    rows.push([tr("Ionisierungsenergie", "Ionisation energy"), `${TRENDS.ie.value(Z)!.toLocaleString(LOC)} eV`]);
  }
  if (el.radioactive) rows.push([tr("Besonderheit", "Note"), tr("radioaktiv", "radioactive")]);
  const go = (charge = 0) => { buildElement(Z, charge); onAction?.(); };

  const key = rows.slice(0, 4);
  const overview = (
    <FitDown min={0.5}>
      <div className="d-visual">
        <div className="d-bohr"><Bohr Z={Z} N={N} E={Z} slots={os ? 6 : 4} colorByOrbital={os && orbitalColors} animate={animate && !reduced} /></div>
        <div className="d-nuc">
          <Nuclide Z={Z} N={N} E={Z} size="lg" />
          <div className="shell-lines">{shellLines(sh).map((l, i) => <span key={i}>{l}</span>)}</div>
        </div>
      </div>
      {os && configException(Z) && <div className="ui-tags d-exc"><ExceptionTag Z={Z} /></div>}
      <dl className="d-facts">{key.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    </FitDown>
  );
  const tabs = [
    { id: "info", label: tr("Überblick", "Overview"), content: overview },
    { id: "daten", label: tr("Daten", "Data"), content: <FitDown min={0.6}><dl className="d-facts">{rows.slice(4).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></FitDown> },
    ...(os ? [{
      id: "cfg", label: tr("Konfig.", "Config."), content: (
        <>
          <p className="cfg-line"><span className="cfg-k">{tr("Ausführlich", "Full")}</span><code>{configString(cfg)}</code></p>
          <p className="cfg-line"><span className="cfg-k">{tr("Kurz", "Short")}</span><code>{shortConfigString(Z)}</code></p>
          {configException(Z) && <div className="ui-tags"><ExceptionTag Z={Z} /></div>}
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
              <Tag>{ion > 0 ? tr(`gibt ${ion} e⁻ ab`, `loses ${ion} e⁻`) : tr(`nimmt ${-ion} e⁻ auf`, `gains ${-ion} e⁻`)}</Tag>
              <Tag tone="ok">✓ {tr("Edelgaskonfiguration", "Noble gas configuration")}</Tag>
              {os && <Tag><code>{shortConfigString(Z, Z - ion)}</code></Tag>}
            </div>
          </div>
          <Button onClick={() => go(ion)}>{tr("Ion", "Build ion")} {el.symbol}{chargeSup(ion)}{tr(" bauen", "")}</Button>
        </>
      ),
    }] : []),
  ];

  return (
    <div className="detail">
      <div className={`d-head cat-${el.category}`}>
        <div className="d-sym"><span className="d-z">{Z}</span><span className="d-s">{el.symbol}</span></div>
        <div className="d-title"><h2 className="d-name">{el.name}</h2><span className="ui-badge">{CATEGORIES[el.category].label}</span></div>
        <Button variant="primary" icon="atom" onClick={() => go()}>{tr("Bauen", "Build")}</Button>
      </div>
      <Panel className="flat" tabs={tabs} label={tr("Steckbrief", "Profile")} />
    </div>
  );
}
