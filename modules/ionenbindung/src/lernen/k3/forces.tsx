// Kapitel 3, Teil 1–2: Anziehung und Abstoßung zweier Ionen, ein Ion in einer Reihe verschieben, Gitter-Schicht füllen,
// Nachbarn antippen, räumliches Gitter (6 Nachbarn), Formel aus dem Gitterausschnitt. Jede Eingabe ändert das Bild sofort.

import { Button, Segmented, Stepper, Tag, type GuideCtx } from "@lern/ui";
import { tr } from "@lern/i18n";
import { ModelFrame, useModel } from "../model.tsx";
import { Arrow, Ball, CL, ForceIcon, MG, NA, O, bondCls, ionText, rad, useTall, type Ion } from "./draw.tsx";

const att = () => tr("Anziehung", "attraction");
const rep = () => tr("Abstoßung", "repulsion");

/** Zwei Ionen: links fest, rechts wählbar – sie rücken zusammen (Anziehung) oder auseinander (Abstoßung) */
export function ChargePair({ c, left, choices, start, sol, demo }: { c: GuideCtx; left: Ion; choices: Ion[]; start: number; sol: number; demo?: boolean }) {
  const [k, set] = useModel(c, start, sol);
  const right = choices[k];
  const pull = left.q * right.q < 0;
  const ref = [left, ...choices].reduce((a, b) => (b.pm > a.pm ? b : a));
  const rl = rad(left, ref, 34), rr = rad(right, ref, 34);
  const cx = 150, cy = 58, d = pull ? rl + rr + 30 : 176;
  const xl = cx - d / 2, xr = cx + d / 2, ay = cy + 56;
  return (
    <ModelFrame c={c} className="k3-m"
      stage={
        <svg className="k3-svg" viewBox="0 0 300 150" role="img" aria-label={`${ionText(left)} – ${ionText(right)}: ${pull ? att() : rep()}`}>
          <Ball ion={left} x={xl} y={cy} r={rl} cls="k3-slide" />
          <Ball ion={right} x={xr} y={cy} r={rr} cls="k3-slide" />
          <g key={`${k}`} className={`k3-fade k3-force ${pull ? "att" : "rep"}`}>
            {pull
              ? <><Arrow x1={xl} y1={ay} x2={cx - 6} y2={ay} /><Arrow x1={xr} y1={ay} x2={cx + 6} y2={ay} /></>
              : <><Arrow x1={xl + 10} y1={ay} x2={xl - 34} y2={ay} /><Arrow x1={xr - 10} y1={ay} x2={xr + 34} y2={ay} /></>}
            <text className="k3-cap" x={cx} y={ay + 28}>{pull ? att() : rep()}</text>
          </g>
        </svg>
      }
      controls={demo ? undefined :
        <fieldset className="k3-fs" disabled={c.solved}>
          <Segmented label={tr("Ion rechts", "Ion on the right")} value={String(k)} onChange={v => set(Number(v))}
            options={choices.map((x, j) => ({ value: String(j), label: ionText(x) }))} />
        </fieldset>
      }
      onCheck={() => c.pick(pull ? att() : rep())} />
  );
}

/** zwei Ionen nebeneinander, ohne Kräfte (Bild zu einer Frage) */
export function PairStatic({ a, b }: { a: Ion; b: Ion }) {
  const ref = a.pm > b.pm ? a : b, ra = rad(a, ref, 34), rb = rad(b, ref, 34);
  return (
    <svg className="k3-svg k3-static" viewBox="0 0 300 100" role="img" aria-label={`${ionText(a)}, ${ionText(b)}`}>
      <Ball ion={a} x={150 - ra - 14} y={50} r={ra} />
      <Ball ion={b} x={150 + rb + 14} y={50} r={rb} />
    </svg>
  );
}

export const onlyAtt = () => tr("nur Anziehung", "only attraction");
export const onlyRep = () => tr("nur Abstoßung", "only repulsion");
export const both = () => tr("Anziehung und Abstoßung", "attraction and repulsion");

/** Eine Reihe fester Ionen mit Lücken; ein Ion wandert von Lücke zu Lücke – Kräfte zu den beiden Nachbarn sofort.
 *  Quer bei breiter Bühne, hochkant bei schmaler (zwei Zeichnungen, CSS zeigt die passende). */
export function IonRow({ c, mover, fixed, start, sol, demo }: { c: GuideCtx; mover: Ion; fixed: Ion[]; start: number; sol: number; demo?: boolean }) {
  const [g, set] = useModel(c, start, sol);
  const [box, vert] = useTall();
  const n = fixed.length, L = fixed[g], R = fixed[g + 1];
  const kinds = [bondCls(mover, L), bondCls(mover, R)];
  const label = tr(`Reihe aus Ionen, ${ionText(mover)} zwischen ${ionText(L)} und ${ionText(R)}`, `Row of ions, ${ionText(mover)} between ${ionText(L)} and ${ionText(R)}`);
  return (
    <ModelFrame c={c} className="k3-m"
      stage={<div className="k3-fill" ref={box}><RowSvg vert={vert} mover={mover} fixed={fixed} g={g} kinds={kinds} label={label} /></div>}
      controls={demo ? undefined :
        <fieldset className="k3-fs" disabled={c.solved}>
          <Button icon={vert ? "up" : "back"} aria-label={tr("einen Platz zurück", "one place back")} onClick={() => set(Math.max(0, g - 1))} disabled={g === 0} />
          <Tag>{tr(`Platz ${g + 1} von ${n - 1}`, `Place ${g + 1} of ${n - 1}`)}</Tag>
          <Button icon={vert ? "down" : "arrow"} aria-label={tr("einen Platz weiter", "one place on")} onClick={() => set(Math.min(n - 2, g + 1))} disabled={g === n - 2} />
        </fieldset>
      }
      onCheck={() => c.pick(kinds[0] === kinds[1] ? (kinds[0] === "att" ? onlyAtt() : onlyRep()) : both())} />
  );
}

function RowSvg({ vert, mover, fixed, g, kinds, label }: { vert: boolean; mover: Ion; fixed: Ion[]; g: number; kinds: string[]; label: string }) {
  const ref = [mover, ...fixed].reduce((a, b) => (b.pm > a.pm ? b : a));
  const u = 56, pad = 34, cy = vert ? 70 : 92, n = fixed.length, W = (n - 1) * 2 * u + 2 * pad;
  const P = (a: number, b: number) => (vert ? [b, a] : [a, b]);
  const fx = (i: number) => pad + i * 2 * u, gx = (j: number) => pad + (2 * j + 1) * u;
  const xm = gx(g), r = (x: Ion) => rad(x, ref, 27);
  const icon = (a: number, att: boolean) => { const [x, y] = P(a, cy - 48); return <g transform={vert ? `rotate(90 ${x} ${y})` : undefined}><ForceIcon x={x} y={y} att={att} /></g>; };
  const line = (a1: number, a2: number, cls: string) => { const [x1, y1] = P(a1, cy), [x2, y2] = P(a2, cy); return <line className={cls} x1={x1} y1={y1} x2={x2} y2={y2} />; };
  const ball = (a: number, ion: Ion, cls?: string) => { const [x, y] = P(a, cy); return <Ball ion={ion} x={x} y={y} r={r(ion)} cls={cls} />; };
  return (
    <svg className="k3-svg" viewBox={vert ? `0 0 ${cy + 40} ${W}` : `0 0 ${W} ${cy + 40}`} role="img" aria-label={label}>
      {line(pad - 30, W - pad + 30, "k3-axis")}
      {fixed.slice(1).map((_, j) => { if (j === g) return null; const [x, y] = P(gx(j), cy); return <circle key={j} className="k3-slot" cx={x} cy={y} r={r(mover)} />; })}
      <g key={g} className="k3-fade">
        {line(fx(g), xm, `k3-bond ${kinds[0]}`)}
        {line(xm, fx(g + 1), `k3-bond ${kinds[1]}`)}
        {icon((fx(g) + xm) / 2, kinds[0] === "att")}
        {icon((xm + fx(g + 1)) / 2, kinds[1] === "att")}
      </g>
      {fixed.map((x, i) => <g key={i}>{ball(fx(i), x)}</g>)}
      {ball(xm, mover, "k3-slide mover")}
    </svg>
  );
}

/** Gitter-Schicht: Kation an (i + j) gerade */
const isCat = (i: number, j: number, flip = false) => ((i + j) % 2 === 0) !== flip;

export const allCounter = () => tr("nur Gegen-Ionen", "only counter-ions");
export const likeNb = () => tr("gleiche Nachbarn", "like neighbours");
export const gapRes = () => tr("Lücke", "gap");

/** Schicht eines Ionengitters selbst füllen: offene Plätze antippen (leer → Kation → Anion → leer); Linien sofort */
export function LatticeFill({ c, cat, an, cols, rows, open, caption }: { c: GuideCtx; cat: Ion; an: Ion; cols: number; rows: number; open: number[]; caption?: string }) {
  const sol = open.map(p => (isCat(p % cols, Math.floor(p / cols)) ? 1 : 2));
  const [st, set] = useModel<number[]>(c, open.map(() => 0), sol);
  const u = 62, pad = 40, W = (cols - 1) * u + 2 * pad, H = (rows - 1) * u + 2 * pad;
  const at = (i: number) => pad + i * u;
  const ionAt = (i: number, j: number): Ion | null => {
    const p = j * cols + i, o = open.indexOf(p);
    if (o < 0) return isCat(i, j) ? cat : an;
    return st[o] === 1 ? cat : st[o] === 2 ? an : null;
  };
  const R = (x: Ion) => rad(x, an, 27);
  const bonds: { x1: number; y1: number; x2: number; y2: number; k: string }[] = [];
  let same = false, empty = st.some(v => v === 0);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const a = ionAt(i, j);
    if (!a) continue;
    for (const [di, dj] of [[1, 0], [0, 1]]) {
      if (i + di >= cols || j + dj >= rows) continue;
      const b = ionAt(i + di, j + dj);
      if (!b) continue;
      const k = bondCls(a, b);
      if (k === "rep") same = true;
      bonds.push({ x1: at(i), y1: at(j), x2: at(i + di), y2: at(j + dj), k });
    }
  }
  const tap = (o: number) => { if (c.solved) return; const nx = st.slice(); nx[o] = (nx[o] + 1) % 3; set(nx); };
  const name = (v: number) => (v === 1 ? ionText(cat) : v === 2 ? ionText(an) : tr("leer", "empty"));
  return (
    <ModelFrame c={c} className="k3-m"
      stage={
        <svg className="k3-svg" viewBox={`0 0 ${W} ${H}`} role="group" aria-label={tr("Schicht eines Ionengitters zum Füllen", "Layer of an ionic lattice to fill")}>
          {/* gestrichelt am Rand: das Gitter geht weiter (nur an besetzten Plätzen) */}
          <g className="k3-more">
            {Array.from({ length: rows }, (_, j) => <g key={`r${j}`}>
              {ionAt(0, j) && <line x1={at(0) - 30} y1={at(j)} x2={at(0)} y2={at(j)} />}
              {ionAt(cols - 1, j) && <line x1={at(cols - 1)} y1={at(j)} x2={at(cols - 1) + 30} y2={at(j)} />}
            </g>)}
            {Array.from({ length: cols }, (_, i) => <g key={`c${i}`}>
              {ionAt(i, 0) && <line x1={at(i)} y1={at(0) - 30} x2={at(i)} y2={at(0)} />}
              {ionAt(i, rows - 1) && <line x1={at(i)} y1={at(rows - 1)} x2={at(i)} y2={at(rows - 1) + 30} />}
            </g>)}
          </g>
          {bonds.map((b, k) => <line key={k} className={`k3-bond ${b.k}`} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />)}
          {Array.from({ length: rows }, (_, j) => Array.from({ length: cols }, (_, i) => {
            const x = ionAt(i, j), o = open.indexOf(j * cols + i);
            return (
              <g key={`${i}-${j}`}>
                {x && <Ball ion={x} x={at(i)} y={at(j)} r={R(x)} cls={o >= 0 ? "k3-pop" : undefined} />}
                {o >= 0 && <circle className="k3-open" cx={at(i)} cy={at(j)} r={R(an) + 4} />}
                {o >= 0 && (
                  <rect className="k3-hit" x={at(i) - u / 2} y={at(j) - u / 2} width={u} height={u} role="button" tabIndex={c.solved ? -1 : 0}
                    aria-label={tr(`Platz ${o + 1}: ${name(st[o])}`, `Place ${o + 1}: ${name(st[o])}`)} onClick={() => tap(o)}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(o); } }} />
                )}
              </g>
            );
          }))}
          {/* gleiche Ladungen nebeneinander: Abstoßung über den Kugeln (← →) */}
          {bonds.filter(b => b.k === "rep").map((b, k) => {
            const x = (b.x1 + b.x2) / 2, y = (b.y1 + b.y2) / 2;
            return <g key={`f${k}`} className="k3-fade" transform={b.x1 === b.x2 ? `rotate(90 ${x} ${y})` : undefined}><ForceIcon x={x} y={y} att={false} /></g>;
          })}
        </svg>
      }
      controls={open.length ? <Tag>{tr("Platz antippen: leer → ", "Tap a place: empty → ")}{ionText(cat)} → {ionText(an)}</Tag> : caption ? <Tag>{caption}</Tag> : undefined}
      onCheck={open.length ? () => c.pick(empty ? gapRes() : same ? likeNb() : allCounter()) : undefined} />
  );
}

export const diag = () => tr("schräg", "diagonal");
export const far = () => tr("weiter weg", "further away");

/** Nachbarn eines markierten Ions antippen – Linien zu ihnen erscheinen sofort, Zähler darunter */
export function NeighborTap({ c, cat, an }: { c: GuideCtx; cat: Ion; an: Ion }) {
  const N = 5, m = 2;
  const sol = [m * N + m - 1, m * N + m + 1, (m - 1) * N + m, (m + 1) * N + m];
  const [sel, set] = useModel<number[]>(c, [], sol);
  const u = 60, pad = 36, W = (N - 1) * u + 2 * pad;
  const at = (i: number) => pad + i * u;
  const ion = (i: number, j: number) => (isCat(i, j, true) ? cat : an);   // Mitte: Anion
  const R = (x: Ion) => rad(x, an, 25);
  const center = ion(m, m);
  const toggle = (p: number) => { if (c.solved || p === m * N + m) return; set(sel.includes(p) ? sel.filter(q => q !== p) : [...sel, p]); };
  const result = () => {
    let d = false, f = false;
    for (const p of sel) { const di = Math.abs((p % N) - m), dj = Math.abs(Math.floor(p / N) - m); if (di + dj === 1) continue; if (di === 1 && dj === 1) d = true; else f = true; }
    return d ? diag() : f ? far() : String(sel.length);
  };
  return (
    <ModelFrame c={c} className="k3-m"
      stage={
        <svg className="k3-svg" viewBox={`0 0 ${W} ${W}`} role="group" aria-label={tr("Gitter-Schicht, ein Ion in der Mitte markiert", "Lattice layer, one ion marked in the middle")}>
          <g className="k3-grid">
            {Array.from({ length: N }, (_, k) => <g key={k}><line x1={at(0) - 24} y1={at(k)} x2={at(N - 1) + 24} y2={at(k)} /><line x1={at(k)} y1={at(0) - 24} x2={at(k)} y2={at(N - 1) + 24} /></g>)}
          </g>
          {sel.map(p => <line key={p} className={`k3-bond strong ${bondCls(center, ion(p % N, Math.floor(p / N)))}`} x1={at(m)} y1={at(m)} x2={at(p % N)} y2={at(Math.floor(p / N))} />)}
          {Array.from({ length: N * N }, (_, p) => {
            const i = p % N, j = Math.floor(p / N), x = ion(i, j), mid = p === m * N + m, on = sel.includes(p);
            return (
              <g key={p}>
                {(on || mid) && <circle className={`k3-mark${mid ? " mid" : ""}`} cx={at(i)} cy={at(j)} r={R(x) + 5} />}
                <Ball ion={x} x={at(i)} y={at(j)} r={R(x)} />
                {!mid && <rect className="k3-hit" x={at(i) - u / 2} y={at(j) - u / 2} width={u} height={u} role="button" tabIndex={c.solved ? -1 : 0}
                  aria-pressed={on} aria-label={ionText(x)} onClick={() => toggle(p)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(p); } }} />}
              </g>
            );
          })}
        </svg>
      }
      controls={<Tag>{tr(`markiert: ${sel.length}`, `marked: ${sel.length}`)}</Tag>}
      onCheck={() => c.pick(result())} />
  );
}

/** Räumliches Natriumchlorid-Gitter (schräg von vorn): ein Na⁺ in der Mitte und seine 6 Cl⁻-Nachbarn; Linien = Anziehung,
 *  gestrichelt: das Gitter geht in alle Richtungen weiter */
export function Lattice3D() {
  const u = 92, dx = 0.5 * u, dy = 0.36 * u, ox = 170, oy = 158, R = 27;
  const P = (x: number, y: number, z: number) => [ox + x * u + z * dx, oy - y * u - z * dy] as const;
  const nbs = [[0, 0, 1], [0, 1, 0], [-1, 0, 0], [0, 0, 0], [1, 0, 0], [0, -1, 0], [0, 0, -1]] as const;   // von hinten nach vorn
  const [cx, cy] = P(0, 0, 0);
  return (
    <figure className="k3-fig">
      <svg className="k3-svg" viewBox="0 0 340 316" role="img"
        aria-label={tr("Natriumchlorid-Gitter im Raum: ein Natrium-Ion ist von 6 Chlorid-Ionen umgeben – links, rechts, oben, unten, vorn, hinten.", "Sodium chloride lattice in space: a sodium ion is surrounded by 6 chloride ions – left, right, above, below, front, back.")}>
        {/* Würfel der 8 Ecken (gedachte Hilfslinien) */}
        <g className="k3-grid faint">
          {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b], k) => {
            const e = [[P(-1, a, b), P(1, a, b)], [P(a, -1, b), P(a, 1, b)], [P(a, b, -1), P(a, b, 1)]];
            return <g key={k}>{e.map(([p, q], j) => <line key={j} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} />)}</g>;
          })}
        </g>
        {nbs.map(([x, y, z], k) => {
          if (!x && !y && !z) return <g key={k}><Ball ion={NA} x={cx} y={cy} r={rad(NA, CL, R)} cls="k3-hot" /></g>;
          const [px, py] = P(x, y, z), [mx, my] = P(1.45 * x, 1.45 * y, 1.45 * z);
          return (
            <g key={k}>
              <line className="k3-more-l" x1={px} y1={py} x2={mx} y2={my} />
              <line className="k3-bond att strong" x1={cx} y1={cy} x2={px} y2={py} />
              <Ball ion={CL} x={px} y={py} r={R} />
            </g>
          );
        })}
        <Ball ion={NA} x={cx} y={cy} r={rad(NA, CL, R)} cls="k3-hot" />
      </svg>
      <figcaption>{tr("Natriumchlorid NaCl: Na⁺ in der Mitte, 6 Cl⁻ als Nachbarn; das Gitter geht weiter", "Sodium chloride NaCl: Na⁺ in the middle, 6 Cl⁻ as neighbours; the lattice continues")}</figcaption>
    </figure>
  );
}

const SUB = "₀₁₂₃₄₅₆₇₈₉";
const sub = (n: number) => (n === 1 ? "" : String(n).split("").map(d => SUB[Number(d)]).join(""));

export const unreduced = () => tr("ungekürzt", "not reduced");
export const notNeutral = () => tr("nicht neutral", "not neutral");

/** Formel aus dem Gitterausschnitt (Magnesiumoxid 4 × 4): Anzahl Mg²⁺ und O²⁻ einstellen – markierte Ionen und Formel sofort */
export function FormulaModel({ c }: { c: GuideCtx }) {
  const [s, set] = useModel(c, { a: 8, b: 8 }, { a: 1, b: 1 });
  const N = 4, u = 58, pad = 38, W = (N - 1) * u + 2 * pad, RO = 31;
  const at = (i: number) => pad + i * u;
  let na = 0, nb = 0;
  const f = `Mg${sub(s.a)}O${sub(s.b)}`;
  const q = 2 * s.a - 2 * s.b;
  return (
    <ModelFrame c={c} className="k3-m"
      stage={
        <div className="k3-row">
          <svg className="k3-svg" viewBox={`0 0 ${W} ${W}`} role="img" aria-label={tr(`Ausschnitt aus dem Magnesiumoxid-Gitter, markiert: ${s.a} Mg²⁺ und ${s.b} O²⁻`, `Section of the magnesium oxide lattice, marked: ${s.a} Mg²⁺ and ${s.b} O²⁻`)}>
            <g className="k3-grid">{Array.from({ length: N }, (_, k) => <g key={k}><line x1={at(0) - 24} y1={at(k)} x2={at(N - 1) + 24} y2={at(k)} /><line x1={at(k)} y1={at(0) - 24} x2={at(k)} y2={at(N - 1) + 24} /></g>)}</g>
            {Array.from({ length: N * N }, (_, p) => {
              const i = p % N, j = Math.floor(p / N), ion = isCat(i, j) ? MG : O;
              const on = ion === MG ? ++na <= s.a : ++nb <= s.b;
              return (
                <g key={p}>
                  {on && <circle className="k3-mark dash" cx={at(i)} cy={at(j)} r={rad(ion, O, RO) + 4} />}
                  <Ball ion={ion} x={at(i)} y={at(j)} r={rad(ion, O, RO)} />
                </g>
              );
            })}
          </svg>
          <div className="k3-formula" aria-live="polite">
            <span className="k3-f">{f}</span>
            <span className="k3-q">{`${s.a} · (2+) + ${s.b} · (2−) = ${q === 0 ? "0" : q > 0 ? `${q}+` : `${-q}−`}`}</span>
          </div>
        </div>
      }
      controls={
        <fieldset className="k3-fs" disabled={c.solved}>
          <Stepper compact editable={false} tone="cation" label="Mg²⁺" value={s.a} min={1} max={8} onChange={v => set({ ...s, a: v })} />
          <Stepper compact editable={false} tone="anion" label="O²⁻" value={s.b} min={1} max={8} onChange={v => set({ ...s, b: v })} />
        </fieldset>
      }
      onCheck={() => c.pick(s.a !== s.b ? notNeutral() : s.a > 1 ? unreduced() : "MgO")} />
  );
}
