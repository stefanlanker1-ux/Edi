// Becherglas zweimal: so wie man es sieht (Schichten, Bodensatz, Trübung, Tröpfchen) und im Teilchenmodell
// (übliches Teilchenmodell: Wasser als H₂O-Teilchen, Gelöstes verteilt, Feststoffe als Gitter, Gase weit auseinander).
// Beide nutzen dieselbe Aufteilung in Bereiche (layout), damit Phasen links und rechts übereinstimmen.

import { useLayoutEffect, useRef, useState } from "react";
import { STOFF, alloyName, isAlloy, mix, type Item } from "@lern/chem";

// ── Aufteilung in Bereiche ───────────────────────────────────────────────────

export const W = 120, H = 150;
const X0 = 15, X1 = 105, TOP = 24, BOTTOM = 140;

interface Region {
  kind: "gas" | "liquid" | "solid" | "alloy" | "mixed";
  y0: number; y1: number;
  /** Hauptstoff(e) des Bereichs */
  parts: string[];
  /** gelöst bzw. (geschüttelt) verteilt: Feststoffkörner, Öltröpfchen */
  dissolved?: string[];
  grains?: string[];
  drops?: string[];
}

function layout(items: Item[], shaken: boolean) {
  const m = mix(items);
  const regions: Region[] = [];
  const solids = m.phases.filter(p => p.role === "fest");
  const alloy = m.phases.find(p => p.alloy);
  const polar = m.phases.find(p => p.role === "wasser" || p.role === "alkohol");
  const oils = m.phases.filter(p => p.role === "oel");
  const gas = m.phases.find(p => p.role === "gas");
  const liquid = !!(polar || oils.length);
  let y = BOTTOM;
  const suspend = shaken && liquid && solids.length > 0;
  const emulsify = shaken && !!polar && oils.length > 0;
  if (alloy) { regions.push({ kind: "alloy", y0: y - 26, y1: y, parts: alloy.parts }); y -= 26; }
  if (!suspend) {
    if (shaken && !liquid && solids.length > 1) {
      const h = 18 * solids.length;
      regions.push({ kind: "mixed", y0: y - h, y1: y, parts: solids.map(p => p.parts[0]) });
      y -= h;
    } else {
      for (const p of solids) { regions.push({ kind: "solid", y0: y - 18, y1: y, parts: p.parts }); y -= 18; }
    }
  }
  if (liquid) {
    const top = 56;
    const grains = suspend ? solids.map(p => p.parts[0]) : undefined;
    if (polar && oils.length && !emulsify) {
      const mid = y - (y - top) * .55;
      regions.push({ kind: "liquid", y0: mid, y1: y, parts: polar.parts.filter(id => !polar.dissolved.includes(id)), dissolved: polar.dissolved, grains });
      regions.push({ kind: "liquid", y0: top, y1: mid, parts: oils.map(p => p.parts[0]) });
    } else if (polar) {
      regions.push({ kind: "liquid", y0: top, y1: y, parts: polar.parts.filter(id => !polar.dissolved.includes(id)), dissolved: polar.dissolved, grains, drops: emulsify ? oils.map(p => p.parts[0]) : undefined });
    } else {
      regions.push({ kind: "liquid", y0: top, y1: y, parts: oils.map(p => p.parts[0]), grains });
    }
    y = top;
  }
  if (gas) regions.push({ kind: "gas", y0: TOP, y1: y, parts: gas.parts });
  return { regions, lid: !!gas, info: m };
}

// ── Zufall (fest je Inhalt, damit sich nichts beim Neuzeichnen verschiebt) ─────

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
const keyOf = (items: Item[], shaken: boolean) => items.map(x => (isAlloy(x) ? `[${x.alloy.join("+")}]` : x)).join(",") + (shaken ? "!" : "");

// ── Glas ─────────────────────────────────────────────────────────────────────

function Glass({ lid, children, clip }: { lid: boolean; children: React.ReactNode; clip: string }) {
  return (
    <>
      <defs><clipPath id={clip}><path d={`M${X0} ${TOP - 4}V${BOTTOM - 4}q0 4 4 4h${X1 - X0 - 8}q4 0 4-4V${TOP - 4}z`} /></clipPath></defs>
      <g clipPath={`url(#${clip})`}>{children}</g>
      <path className="bk-glass" d={`M${X0 - 5} ${TOP - 8}l5 4V${BOTTOM - 4}q0 4 4 4h${X1 - X0 - 8}q4 0 4-4V${TOP - 4}l6-7`} />
      {lid && <rect className="bk-lid" x={X0 - 7} y={TOP - 11} width={X1 - X0 + 14} height={5} rx={1.5} />}
    </>
  );
}

// ── Becher (so wie man es sieht) ─────────────────────────────────────────────

const ALLOY_COLOR: Record<string, string> = { Messing: "messing", Bronze: "bronze", Stahl: "stahl", Legierung: "legierung" };
const liquidColor = (r: Region) => (r.parts.includes("oel") ? "oel" : r.dissolved?.includes("cuso4") ? "cuso4-sol" : r.parts.includes("h2o") ? "water" : "ethanol");
const CRYSTAL = new Set(["nacl", "zucker", "cuso4"]);

function Grains({ ids, x0, x1, y0, y1, n, rand, big = false }: { ids: string[]; x0: number; x1: number; y0: number; y1: number; n: number; rand: () => number; big?: boolean }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const id = ids[i % ids.length], x = x0 + rand() * (x1 - x0), y = y0 + rand() * (y1 - y0), r = (big ? 1.5 : 1) * (.9 + rand() * .9);
        return CRYSTAL.has(id)
          ? <rect key={i} className="bk-grain" x={x - r} y={y - r} width={2 * r} height={2 * r} transform={`rotate(${Math.round(rand() * 90)} ${x} ${y})`} style={{ fill: `var(--st-${STOFF[id].color})` }} />
          : <circle key={i} className="bk-grain" cx={x} cy={y} r={r} style={{ fill: `var(--st-${STOFF[id].color})` }} />;
      })}
    </>
  );
}

export function MacroBeaker({ items, shaken, id }: { items: Item[]; shaken: boolean; id: string }) {
  const { regions, lid } = layout(items, shaken);
  const rand = rng(keyOf(items, shaken) + "m");
  return (
    <Glass lid={lid} clip={`${id}-mc`}>
      {regions.map((r, i) => {
        const h = r.y1 - r.y0;
        if (r.kind === "gas") return <rect key={i} className="bk-gas" x={X0} y={r.y0} width={X1 - X0} height={h} />;
        if (r.kind === "alloy") {
          const name = alloyName(r.parts);
          return <rect key={i} className="bk-alloy" x={X0 + 18} y={r.y0 + 2} width={X1 - X0 - 36} height={h - 3} rx={2} style={{ fill: `var(--st-${ALLOY_COLOR[name]})` }} />;
        }
        if (r.kind === "solid" || r.kind === "mixed") {
          const base = STOFF[r.parts[0]];
          return (
            <g key={i}>
              {r.kind === "solid" && <rect x={X0} y={r.y0 + 2} width={X1 - X0} height={h - 2} style={{ fill: `var(--st-${base.color})` }} className="bk-layer" />}
              {r.kind === "mixed" && <rect x={X0} y={r.y0 + 2} width={X1 - X0} height={h - 2} className="bk-layer mixed" />}
              <Grains ids={r.parts} x0={X0 + 1} x1={X1 - 1} y0={r.y0 + 2.5} y1={r.y1 - 1} n={r.kind === "mixed" ? 90 * r.parts.length : 60} rand={rand} big />
            </g>
          );
        }
        // Flüssigkeit: klar, gefärbt (Kupfersulfat), trüb (Suspension) oder milchig (Emulsion)
        return (
          <g key={i}>
            <rect className={`bk-liquid${r.grains ? " turbid" : ""}${r.drops ? " milky" : ""}`} x={X0} y={r.y0} width={X1 - X0} height={h} style={{ fill: `var(--st-${liquidColor(r)})` }} />
            <line className="bk-meniscus" x1={X0} x2={X1} y1={r.y0} y2={r.y0} />
            {r.grains && <Grains ids={r.grains} x0={X0 + 2} x1={X1 - 2} y0={r.y0 + 3} y1={r.y1 - 2} n={70 * r.grains.length} rand={rand} />}
            {r.drops && Array.from({ length: 30 }, (_, k) => (
              <circle key={k} className="bk-drop" cx={X0 + 4 + rand() * (X1 - X0 - 8)} cy={r.y0 + 4 + rand() * (h - 8)} r={1.3 + rand() * 2.2} style={{ fill: "var(--st-oel)" }} />
            ))}
          </g>
        );
      })}
    </Glass>
  );
}

// ── Teilchenmodell ───────────────────────────────────────────────────────────

type Glyph = [el: string, dx: number, dy: number][];
const G: Record<string, Glyph> = {
  h2o: [["O", 0, 0], ["H", -2.7, 2], ["H", 2.7, 2]],
  ethanol: [["C", -3.4, .6], ["C", .4, -.8], ["O", 4, .8], ["H", 6.4, -.6]],
  oel: [["C", -8, 1], ["C", -4, -1], ["C", 0, 1], ["C", 4, -1], ["C", 8, 1], ["O", 11.5, -.5]],
  o2: [["O", -1.6, 0], ["O", 1.6, 0]], n2: [["N", -1.6, 0], ["N", 1.6, 0]], h2: [["H", -1.2, 0], ["H", 1.2, 0]], he: [["He", 0, 0]],
  co2: [["O", -3.3, 0], ["C", 0, 0], ["O", 3.3, 0]],
  zucker: [["C", -3.4, -2], ["C", 0, -3.8], ["C", 3.4, -2], ["C", 3.4, 2], ["O", 0, 3.8], ["C", -3.4, 2], ["O", -6.4, -3.5], ["O", 6.4, 3.5]],
  so4: [["S", 0, 0], ["O", -2.4, -2.4], ["O", 2.4, -2.4], ["O", -2.4, 2.4], ["O", 2.4, 2.4]],
  co3: [["C", 0, 0], ["O", 0, -2.9], ["O", -2.5, 1.5], ["O", 2.5, 1.5]],
};
const R: Record<string, number> = { H: 1.8, He: 2.1, C: 2.5, N: 2.5, O: 2.4, S: 2.8, Na: 2.8, Cl: 3, Cu: 2.8, Fe: 2.8, Zn: 2.8, Sn: 3, Si: 2.8, Ca: 3 };
/** Teilchen etwas größer als im Heft üblich, damit sie am Handy gut erkennbar sind */
const K = 1.25;
const rad = (el: string) => (R[el] ?? 2.7) * K;

/** Gitterbausteine eines Feststoffs (abwechselnd) */
const LATTICE: Record<string, (string | Glyph)[]> = {
  fe: ["Fe"], cu: ["Cu"], zn: ["Zn"], sn: ["Sn"], s: ["S"], c: ["C"],
  nacl: ["Na", "Cl"], cuso4: ["Cu", G.so4], sand: ["Si", "O"], kalk: ["Ca", G.co3], fes: ["Fe", "S"], zucker: [G.zucker],
};
/** Teilchen eines gelösten Stoffs (Ionen getrennt) */
const SOLUTE: Record<string, (string | Glyph)[]> = { nacl: ["Na", "Cl"], cuso4: ["Cu", G.so4], zucker: [G.zucker], co2: [G.co2] };

function Atom({ el, x, y }: { el: string; x: number; y: number }) {
  return <circle className="pt" cx={x} cy={y} r={rad(el)} style={{ fill: `var(--atom-${el})`, stroke: `color-mix(in srgb, var(--atom-${el}) 55%, var(--atom-edge))` }} />;
}
function Particle({ g, x, y, turn = 0 }: { g: string | Glyph; x: number; y: number; turn?: number }) {
  if (typeof g === "string") return <Atom el={g} x={x} y={y} />;
  const c = Math.cos(turn), s = Math.sin(turn);
  return <g>{g.map(([el, dx, dy], i) => <Atom key={i} el={el} x={x + K * (dx * c - dy * s)} y={y + K * (dx * s + dy * c)} />)}</g>;
}
const glyphOf = (id: string): string | Glyph => G[id] ?? (LATTICE[id]?.[0] ?? "C");
const size = (g: string | Glyph) => (typeof g === "string" ? rad(g) : Math.max(...g.map(([el, dx, dy]) => K * Math.hypot(dx, dy) + rad(el))));

/** Plätze im Bereich mit Mindestabstand (einfaches Einstreuen) */
function scatter(rand: () => number, x0: number, x1: number, y0: number, y1: number, n: number, gap: number, taken: [number, number, number][] = []) {
  const out: [number, number][] = [];
  for (let t = 0; t < n * 40 && out.length < n; t++) {
    const x = x0 + rand() * (x1 - x0), y = y0 + rand() * (y1 - y0);
    if (taken.every(([a, b, r]) => Math.hypot(a - x, b - y) > r + gap / 2) && out.every(([a, b]) => Math.hypot(a - x, b - y) > gap)) out.push([x, y]);
  }
  return out;
}

function Lattice({ ids, x0, x1, y0, y1, block = 0, rand }: { ids: string[]; x0: number; x1: number; y0: number; y1: number; block?: number; rand: () => number }) {
  const step = 6.2 * K, cols = Math.floor((x1 - x0) / step), rows = Math.max(1, Math.floor((y1 - y0) / step));
  const out: React.ReactNode[] = [];
  // Legierung: Metallatome zufällig gemischt (homogen); Gemenge geschüttelt: Körner (Blöcke) je Stoff (heterogen)
  const blockOf = new Map<string, string>();
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    let id: string;
    if (block) {
      const k = `${Math.floor(c / block)},${Math.floor(r / block)}`;
      if (!blockOf.has(k)) blockOf.set(k, ids[Math.floor(rand() * ids.length)]);
      id = blockOf.get(k)!;
    } else id = ids.length > 1 ? ids[Math.floor(rand() * ids.length)] : ids[0];
    const units = LATTICE[id] ?? ["C"];
    const u = units[(r + c) % units.length];
    const x = x0 + step * (c + .5) + (r % 2 ? step / 2 : 0), y = y1 - step * (r + .5);
    if (x > x1 - 1) continue;
    out.push(<Particle key={`${r}-${c}`} g={typeof u === "string" ? u : u} x={x} y={y} turn={typeof u === "string" ? 0 : (r + c) % 2 ? .6 : 0} />);
  }
  return <>{out}</>;
}

export function ParticleBeaker({ items, shaken, id }: { items: Item[]; shaken: boolean; id: string }) {
  const { regions, lid } = layout(items, shaken);
  const rand = rng(keyOf(items, shaken) + "p");
  return (
    <Glass lid={lid} clip={`${id}-pc`}>
      {regions.map((r, i) => {
        if (r.kind === "alloy") return <g key={i}><Lattice ids={r.parts} x0={X0 + 18} x1={X1 - 18} y0={r.y0 + 1} y1={r.y1} rand={rand} /></g>;
        if (r.kind === "solid") return <g key={i}><Lattice ids={r.parts} x0={X0} x1={X1} y0={r.y0 + 1} y1={r.y1} rand={rand} /></g>;
        if (r.kind === "mixed") return <g key={i}><Lattice ids={r.parts} x0={X0} x1={X1} y0={r.y0 + 1} y1={r.y1} block={3} rand={rand} /></g>;
        if (r.kind === "gas") {
          const per = Math.max(3, Math.round(10 / r.parts.length));
          const spots = scatter(rand, X0 + 6, X1 - 6, r.y0 + 6, r.y1 - 5, per * r.parts.length, 17);
          return <g key={i}>{spots.map(([x, y], k) => <Particle key={k} g={glyphOf(r.parts[k % r.parts.length])} x={x} y={y} turn={rand() * 6.28} />)}</g>;
        }
        // Flüssigkeit: dichte Teilchen; Gelöstes eingestreut; geschüttelt: Körner bzw. Öltröpfchen
        const taken: [number, number, number][] = [];
        const extra: React.ReactNode[] = [];
        for (const d of r.drops ?? []) {
          for (const [x, y] of scatter(rand, X0 + 16, X1 - 16, r.y0 + 15, r.y1 - 15, 2, 36, taken)) {
            taken.push([x, y, 15]);
            extra.push(<circle key={`dz${x}`} className="pt-drop" cx={x} cy={y} r={14.5} />);
            extra.push(<Particle key={`d${x}a`} g={G.oel} x={x - 1} y={y - 4} turn={.1} />, <Particle key={`d${x}b`} g={G.oel} x={x + 1} y={y + 4.5} turn={-.1} />);
            void d;
          }
        }
        for (const gid of r.grains ?? []) {
          for (const [x, y] of scatter(rand, X0 + 8, X1 - 8, r.y0 + 8, r.y1 - 6, 3, 20, taken)) {
            taken.push([x, y, 10]);
            const units = LATTICE[gid] ?? ["C"];
            [[-3.1, -2.7], [3.1, -2.7], [-3.1, 2.7], [3.1, 2.7], [0, 0]].forEach(([dx, dy], k) =>
              extra.push(<Particle key={`g${x}${k}`} g={units[k % units.length]} x={x + K * dx} y={y + K * dy} />));
          }
        }
        const solutes = (r.dissolved ?? []).flatMap(d => (SOLUTE[d] ?? [glyphOf(d)]).map(g => ({ g, n: typeof g === "string" || g.length < 6 ? 3 : 2 })));
        const soluteSpots = scatter(rand, X0 + 6, X1 - 6, r.y0 + 6, r.y1 - 5, solutes.reduce((a, s) => a + s.n, 0), 15, taken);
        let k = 0;
        for (const s of solutes) for (let j = 0; j < s.n && k < soluteSpots.length; j++, k++) {
          const [x, y] = soluteSpots[k];
          taken.push([x, y, size(s.g)]);
          extra.push(<Particle key={`s${k}`} g={s.g} x={x} y={y} turn={rand() * 6.28} />);
        }
        const main = r.parts.map(glyphOf);
        const gap = Math.max(...main.map(size)) * 2 + 1.8;
        const n = Math.round((X1 - X0) * (r.y1 - r.y0) / (gap * gap) * .95);
        const spots = scatter(rand, X0 + 4, X1 - 4, r.y0 + 4, r.y1 - 3, n, gap, taken);
        return (
          <g key={i}>
            <rect className={`pt-liquid${r.parts.includes("oel") ? " oel" : ""}`} x={X0} y={r.y0} width={X1 - X0} height={r.y1 - r.y0} />
            {spots.map(([x, y], j) => <Particle key={j} g={main[j % main.length]} x={x} y={y} turn={rand() * 6.28} />)}
            {extra}
          </g>
        );
      })}
    </Glass>
  );
}

/** Beide Becher: nebeneinander oder – wenn größer (Handy hochkant) – übereinander. Füllt den verfügbaren Platz. */
export function BeakerPair({ items, shaken, id }: { items: Item[]; shaken: boolean; id: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<[number, number] | null>(null);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize([el.clientWidth, el.clientHeight]));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const PW = 2 * W + 14, PH = H + 16, SW = W, SH = 2 * (H + 16) + 6;
  const across = !size || Math.min(size[0] / PW, size[1] / PH) >= Math.min(size[0] / SW, size[1] / SH);
  const [vw, vh] = across ? [PW, PH] : [SW, SH];
  const second = across ? `translate(${W + 14} 0)` : `translate(0 ${H + 22})`;
  return (
    <div className="bk-wrap" ref={wrap}>
      <svg className="bk" viewBox={`0 0 ${vw} ${vh}`} role="img" aria-label="Becherglas und Teilchenmodell">
        <g><MacroBeaker items={items} shaken={shaken} id={id} /></g>
        <g transform={second}><ParticleBeaker items={items} shaken={shaken} id={id} /></g>
        <text className="bk-cap" x={W / 2} y={H + 12}>Becherglas</text>
        <text className="bk-cap" x={across ? W + 14 + W / 2 : W / 2} y={across ? H + 12 : 2 * H + 34}>Teilchenmodell</text>
      </svg>
    </div>
  );
}
