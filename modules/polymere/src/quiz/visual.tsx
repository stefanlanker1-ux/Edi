// Bilder für Lektionen und Aufgaben, beschrieben als reine Daten (Aufgaben werden gespeichert): Monomer, Baustein, Kettenausschnitt
// (iso-, syndio-, ataktisch), Standbild eines Mechanismus-Schritts mit Pfeilen, Kügelchen-Kette, zwei Monomere nebeneinander und
// Kettenbilder für Thermoplast, Elastomer, Duroplast, Gefäß mit Kügelchen (Ketten und freies Monomer).

import { useMemo } from "react";
import { tr } from "@lern/i18n";
import { isVinyl, monoHue, monoLetter, monoName, stepMono, vinyl, type StepId } from "../chem/data.ts";
import { group, vinylUnit } from "../chem/draw.ts";
import { replay } from "../chem/mech/index.ts";
import type { Bead, Recipe } from "../chem/mech/types.ts";
import { Scene, fitBox, snapBox, still, type Snap } from "../chem/scene.ts";
import { BeadDot, BeadStrip } from "../components/Beads.tsx";
import { MonomerSvg, SnapSvg, UnitSvg } from "../components/Formula.tsx";
import { MechSvg } from "../components/MechSvg.tsx";

export type Tact = "iso" | "syndio" | "atakt";
export type StructKind = "thermo" | "verzweigt" | "elast" | "duro";
/** Inhalt eines Gefäßes: nur Monomer, wenige lange Ketten + viel Monomer, viele kurze Ketten, ein Riesenmolekül */
export type PotKind = "mono" | "long" | "short" | "giant";

export type Vis =
  | { k: "mono"; id: string }
  /** gesättigtes Gegenstück eines Monomers (keine Zweifachbindung) */
  | { k: "sat"; id: string }
  | { k: "unit"; id: string; dbl?: boolean }
  | { k: "chain"; id: string; n: number; tact?: Tact; seed?: number }
  /** Mechanismus: Ansatz, Aktionen bis dahin; gezeigt wird Bild `key` des Ablaufs der letzten Aktion (mit Pfeilen) */
  | { k: "mech"; r: Recipe; acts: string[]; key: number }
  | { k: "beads"; seq: string[] }
  | { k: "pair"; a: string; b?: string }
  | { k: "struct"; s: StructKind }
  /** Gefäß mit Kügelchen; `seq` = Monomere, reihum gefärbt (zwei Monomere wechseln sich ab) */
  | { k: "pot"; s: PotKind; seq: string[] };

/** Kettenausschnitt aus n Bausteinen (ohne Zweifachbindung), Enden offen */
export function chainSnap(id: string, n: number, tact: Tact = "atakt", seed = 1): Snap {
  const sc = new Scene();
  const v = vinyl(id);
  const len = v.diene ? 4 : 2;
  let prev: string | null = null, first = "", last = "";
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const flip = tact === "iso" ? false : tact === "syndio" ? i % 2 === 1 : s / 233280 < 0.5;
    const u = vinylUnit(sc, v, i * len, 0, { pre: `k${i}`, unit: i, hue: v.hue }, { dbl: false, flip });
    if (prev) sc.bond(prev, u.ca);
    if (i === 0) first = u.ca;
    prev = u.cb; last = u.cb;
  }
  // offene Enden: kurze Striche ins Leere
  sc.add({ id: "e0", el: "", x: sc.at(first).x - 0.85, y: 0, text: "" });
  sc.add({ id: "e1", el: "", x: sc.at(last).x + 0.85, y: 0, text: "" });
  sc.bond("e0", first); sc.bond(last, "e1");
  return sc.snap();
}

export function ChainSvg({ id, n, tact, seed }: { id: string; n: number; tact?: Tact; seed?: number }) {
  const snap = useMemo(() => chainSnap(id, n, tact, seed), [id, n, tact, seed]);
  return <SnapSvg snap={snap} label={tr(`Kettenausschnitt aus ${n} Bausteinen`, `Chain section of ${n} units`)} aspect={2.2} halos minW={5} minH={2.6} className="pm-vis-svg" />;
}

/** Standbild eines Mechanismus-Schritts mit Elektronenpfeilen */
export function MechFrame({ r, acts, keyIndex, label }: { r: Recipe; acts: string[]; keyIndex: number; label: string }) {
  const frame = useMemo(() => {
    const m = replay(r, acts.slice(0, -1));
    const clip = m.run(acts[acts.length - 1]);
    const k = clip[Math.max(0, Math.min(clip.length - 1, keyIndex < 0 ? clip.length + keyIndex : keyIndex))];
    return k;
  }, [r, acts, keyIndex]);
  const pose = { ...still(frame.snap), arrows: (frame.arrows ?? []).map(arrow => ({ arrow, op: 1 })) };
  const box = fitBox(snapBox(frame.snap) ?? { x0: -3, y0: -2, x1: 3, y1: 2 }, 1.7, 6, 3.4, 0.45);
  return <MechSvg pose={pose} box={box} label={label} className="pm-vis-svg" />;
}

/** Kügelchen aus Monomer-Kennungen */
export const beadsOf = (seq: string[]): Bead[] => seq.map((m, i) => ({ kind: "unit", mono: m, hue: monoHue(m), letter: monoLetter(m), title: monoName(m), unit: i }));

/** Kettenbilder: Thermoplast (einzelne Ketten), verzweigt, Elastomer (wenige Brücken), Duroplast (dichtes Netz) */
export function StructPic({ s }: { s: StructKind }) {
  const LABEL: Record<StructKind, string> = tr(
    { thermo: "Einzelne, nicht verbundene Ketten", verzweigt: "Verzweigte Ketten", elast: "Ketten mit wenigen Brücken", duro: "Dichtes Netz aus Ketten" },
    { thermo: "Separate, unconnected chains", verzweigt: "Branched chains", elast: "Chains with a few bridges", duro: "Dense network of chains" },
  );
  const wave = (y: number, a: number, ph: number) => {
    let d = "";
    for (let x = 10; x <= 230; x += 5) d += `${x === 10 ? "M" : "L"}${x} ${(y + a * Math.sin(x / 17 + ph)).toFixed(1)} `;
    return d;
  };
  const ys = [22, 46, 70, 94, 118];
  const yAt = (i: number, x: number) => ys[i] + 7 * Math.sin(x / 17 + i * 1.7);
  const bridges: [number, number][] = s === "elast" ? [[0, 60], [1, 150], [2, 95], [3, 190]] : s === "duro" ? [] : [];
  if (s === "duro") for (let i = 0; i < 4; i++) for (let x = 25 + (i % 2) * 18; x < 230; x += 36) bridges.push([i, x]);
  return (
    <svg className="pm-struct-pic" viewBox="0 0 240 140" role="img" aria-label={LABEL[s]}>
      {ys.map((y, i) => <path key={i} d={wave(y, 7, i * 1.7)} className={`pm-sp-chain c${i % 3}`} />)}
      {s === "verzweigt" && ys.map((_, i) => [40, 110, 180].map((x, j) => {
        const y0 = yAt(i, x + i * 7), dir = (i + j) % 2 ? 1 : -1;
        return <path key={`${i}-${j}`} d={`M${x + i * 7} ${y0} l10 ${dir * 9} l10 ${dir * 2}`} className={`pm-sp-chain c${i % 3}`} />;
      }))}
      {bridges.map(([i, x], k) => <g key={k}><line x1={x} y1={yAt(i, x)} x2={x} y2={yAt(i + 1, x)} className="pm-sp-bridge" /><circle cx={x} cy={yAt(i, x)} r={3} className="pm-sp-node" /><circle cx={x} cy={yAt(i + 1, x)} r={3} className="pm-sp-node" /></g>)}
    </svg>
  );
}

type Pt = [number, number];
/** Kette von (x0, y0) nach (x1, y1) mit n Kügelchen, leicht gewellt */
function line(x0: number, y0: number, x1: number, y1: number, n: number, amp: number, ph = 0): Pt[] {
  const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len;
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1), o = amp * Math.sin(i * 1.3 + ph);
    return [x0 + (x1 - x0) * t - uy * o, y0 + (y1 - y0) * t + ux * o] as Pt;
  });
}
/** kurze Kette mit Mitte (x, y) und Richtung a */
const piece = (x: number, y: number, n: number, a: number, step = 9): Pt[] =>
  Array.from({ length: n }, (_, i) => [x + (i - (n - 1) / 2) * step * Math.cos(a), y + (i - (n - 1) / 2) * step * Math.sin(a)] as Pt);
/** einzelne Monomere auf freie, zufällig gewählte Plätze eines leicht verrückten Rasters (fester Startwert: immer dasselbe Bild) */
function fill(taken: Pt[], n: number): Pt[][] {
  let s = 7;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const cand: Pt[] = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) {
    const p: Pt = [18 + c * 12 + (r % 2) * 5 + (rnd() - 0.5) * 3, 14 + r * 12 + (rnd() - 0.5) * 3];
    if (p[0] <= 104) cand.push(p);
  }
  for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
  const out: Pt[][] = [], all = [...taken];
  for (const p of cand) {
    if (out.length >= n) break;
    if (all.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 11)) continue;
    out.push([p]); all.push(p);
  }
  return out;
}
function potPieces(s: PotKind): Pt[][] {
  if (s === "mono") return fill([], 24);
  if (s === "long") {
    const ch = [line(18, 20, 99, 31, 10, 2.4), line(100, 60, 21, 50, 10, 2.4, 2)];
    return [...ch, ...fill(ch.flat(), 13)];
  }
  if (s === "short") {
    // Stufenwachstum bei hohem Umsatz (≈ 90 %): mehrere kurze Ketten, fast kein freies Monomer mehr
    const spec: [number, number, number, number][] = [[38, 19, 4, 0.15], [84, 21, 4, -0.2], [36, 44, 5, -0.1], [86, 46, 3, 0.35], [40, 69, 4, 0.2], [86, 69, 4, -0.15]];
    const ch = spec.map(([x, y, n, a]) => piece(x, y, n, a));
    return [...ch, ...fill(ch.flat(), 1)];
  }
  // ein Riesenmolekül: Schlange über vier Reihen
  const pts: Pt[] = [];
  for (let r = 0; r < 4; r++) {
    const y = 15 + r * 16;
    for (let i = 0; i < 9; i++) pts.push([r % 2 ? 96 - i * 9 : 24 + i * 9, y + 1.4 * Math.sin(i * 1.3 + r)]);
    if (r < 3) pts.push([r % 2 ? 16 : 104, y + 8]);
  }
  return [pts];
}
export function PotPic({ s, seq }: { s: PotKind; seq: string[] }) {
  const LABEL: Record<PotKind, string> = tr(
    { mono: "Nur einzelne Monomere", long: "Wenige lange Ketten und viele einzelne Monomere", short: "Viele kurze Ketten, kaum einzelne Monomere", giant: "Ein einziges Riesenmolekül" },
    { mono: "Only single monomers", long: "A few long chains and many single monomers", short: "Many short chains, hardly any single monomers", giant: "One single giant molecule" },
  );
  const pieces = potPieces(s);
  let k = 0;
  return (
    <svg className="pm-pot" viewBox="0 0 120 84" role="img" aria-label={LABEL[s]}>
      <path className="pm-pot-glass" d="M8 5 V74 Q8 79 13 79 H107 Q112 79 112 74 V5" />
      {pieces.map((pc, i) => (
        <g key={i}>
          {pc.slice(1).map((p, j) => <line key={j} className="pm-pot-bond" x1={pc[j][0]} y1={pc[j][1]} x2={p[0]} y2={p[1]} />)}
          {pc.map((p, j) => { const m = seq[k++ % seq.length]; return <BeadDot key={j} cx={p[0]} cy={p[1]} r={3.2} hue={monoHue(m)} />; })}
        </g>
      ))}
    </svg>
  );
}

/** Bild einer Aufgabe bzw. eines Lektionsschritts */
export function VisView({ v }: { v: Vis }) {
  switch (v.k) {
    case "mono": return <MonomerSvg id={v.id} aspect={1.6} className="pm-vis-svg" />;
    case "sat": return <SnapSvg snap={saturatedSnap(v.id)} label={tr("Molekül ohne Zweifachbindung", "Molecule without a double bond")} aspect={1.6} className="pm-vis-svg" />;
    case "unit": return v.dbl ? <SnapSvg snap={unitWithDouble(v.id)} label={tr("Baustein mit Zweifachbindung", "Unit with double bond")} aspect={1.6} halos className="pm-vis-svg" /> : <UnitSvg id={v.id} aspect={1.6} className="pm-vis-svg" />;
    case "chain": return <ChainSvg id={v.id} n={v.n} tact={v.tact} seed={v.seed} />;
    case "mech": return <MechFrame r={v.r} acts={v.acts} keyIndex={v.key} label={tr("Mechanismus mit Elektronenpfeilen", "Mechanism with electron arrows")} />;
    case "beads": return <div className="pm-vis-beads"><BeadStrip beads={beadsOf(v.seq)} active={null} max={30} /></div>;
    case "pair": return (
      <div className="pm-vis-pair">
        <MonomerSvg id={v.a} aspect={1.5} className="pm-vis-svg" />
        {v.b && <><span className="pm-vis-plus" aria-hidden="true">+</span><MonomerSvg id={v.b} aspect={1.5} className="pm-vis-svg" /></>}
      </div>
    );
    case "struct": return <StructPic s={v.s} />;
    case "pot": return <PotPic s={v.s} seq={v.seq} />;
  }
}

/** gesättigtes Molekül: Monomer mit Einfachbindung und je einem H mehr an beiden C-Atomen (Ethan, Chlorethan …) */
export function saturatedSnap(id: string): Snap {
  const sc = new Scene();
  const v = vinyl(id);
  const u = vinylUnit(sc, v, 0, 0, { pre: "m" }, { dbl: false });
  group(sc, "H", u.ca, 180, { pre: "m" }, "hl");
  group(sc, "H", u.cb, 0, { pre: "m" }, "hr");
  return sc.snap();
}

/** Baustein, der die Zweifachbindung (fälschlich) behalten hat – für Distraktoren */
function unitWithDouble(id: string): Snap {
  const sc = new Scene();
  const v = vinyl(id);
  const u = vinylUnit(sc, v, 0, 0, { pre: "u", unit: 0, hue: v.hue }, { dbl: true });
  const L = sc.at(u.ca), R = sc.at(u.cb);
  sc.add({ id: "l", el: "", x: L.x - 0.85, y: 0, text: "" });
  sc.add({ id: "r", el: "", x: R.x + 0.85, y: 0, text: "" });
  sc.bond("l", u.ca); sc.bond(u.cb, "r");
  const ys = sc.snap().atoms.map(a => a.y);
  const top = Math.min(...ys), bot = Math.max(...ys), h = bot - top + 0.9, mid = (top + bot) / 2;
  sc.note({ id: "bl", x: L.x - 0.5, y: mid, text: "[", bracket: h });
  sc.note({ id: "br", x: R.x + 0.5, y: mid, text: "]", bracket: h });
  sc.note({ id: "n", x: R.x + 0.82, y: mid + h / 2 - 0.15, text: "n" });
  return sc.snap();
}

/** kurze Beschreibung (Vorlesen, Antworttext von Bild-Antworten) */
export function visText(v: Vis): string {
  switch (v.k) {
    case "mono": return monoName(v.id);
    case "sat": return tr(`gesättigt: ${monoName(v.id)}`, `saturated: ${monoName(v.id).toLowerCase()}`);
    case "unit": return v.dbl ? tr(`Baustein von ${monoName(v.id)} mit C=C`, `Unit of ${monoName(v.id).toLowerCase()} with C=C`) : tr(`Baustein von ${monoName(v.id)}`, `Unit of ${monoName(v.id).toLowerCase()}`);
    case "chain": return tr(`Kette aus ${monoName(v.id)}`, `Chain of ${monoName(v.id).toLowerCase()}`);
    case "beads": return v.seq.map(m => monoLetter(m)).join("–");
    case "pair": return v.b ? `${monoName(v.a)} + ${monoName(v.b)}` : monoName(v.a);
    case "struct": return v.s;
    case "pot": return tr({ mono: "nur Monomer", long: "wenige lange Ketten", short: "viele kurze Ketten", giant: "ein Riesenmolekül" }, { mono: "only monomer", long: "few long chains", short: "many short chains", giant: "one giant molecule" })[v.s];
    case "mech": return tr("Mechanismus", "Mechanism");
  }
}

/** Monomer der Kettenpolymerisation oder des Stufenwachstums (für Namen in Aufgaben) */
export const monoTitle = (id: string) => (isVinyl(id) ? vinyl(id).name : stepMono(id as StepId).name);
