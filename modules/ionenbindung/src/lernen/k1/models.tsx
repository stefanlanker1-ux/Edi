// Modelle für Kapitel 1 „Vom Atom zum Ion“: Bohrmodell (Unterstufe, Schalen K·L·M·N mit 2·8·8·…) mit antippbaren Elektronen,
// Ion bauen (abgeben/aufnehmen), Ladungsrechner (Protonen/Elektronen), PSE mit Ionen, Elektronenübergang zwischen Atomen.
// Schalenradien sind fest: ein Kation mit einer Schale weniger ist sichtbar kleiner; ein Anion zeigt die Außenschale etwas
// weiter außen (Modell: mehr Elektronen stoßen sich ab) – der gestrichelte Kreis zeigt die Größe des Atoms zum Vergleich.

import { Fragment, useState, type ReactNode } from "react";
import { Button, Icon, Stepper, buzz, type GuideCtx } from "@lern/ui";
import { BY_Z, chargeSup, mainGroupNumber, signed } from "@lern/chem";
import { PeriodicTable } from "@lern/chem-ui";
import { tr } from "@lern/i18n";
import { ModelFrame, useModel } from "../model.tsx";

/** Schalenbesetzung nach dem Modell der Unterstufe (bis Z = 20): K 2, L 8, M 8, dann N */
export function shellsOf(E: number): number[] {
  const s = [Math.min(E, 2), Math.min(Math.max(E - 2, 0), 8), Math.min(Math.max(E - 10, 0), 8), Math.max(E - 18, 0)];
  while (s.length > 1 && !s[s.length - 1]) s.pop();
  return s;
}
export const outerOf = (E: number) => { const s = shellsOf(E); return s[s.length - 1]; };
/** Außenschale voll wie bei einem Edelgas (He 2, sonst 8) */
export const isNoble = (E: number) => { const s = shellsOf(E); return E > 0 && (s.length === 1 ? s[0] === 2 : s[s.length - 1] === 8); };
export const NOBLE: Record<number, string> = { 2: "He", 10: "Ne", 18: "Ar" };
export const nobleName = (E: number) => ({ 2: tr("Helium He", "helium He"), 10: tr("Neon Ne", "neon Ne"), 18: tr("Argon Ar", "argon Ar") } as Record<number, string>)[E] ?? "";
export const sym = (Z: number, E: number) => BY_Z[Z].symbol + chargeSup(Z - E);
export const shellText = (E: number) => shellsOf(E).join(" · ");
/** Ladung als Text: „1+“, „2−“, „neutral“ */
export const chargeWord = (q: number) => (q === 0 ? tr("neutral", "neutral") : `${Math.abs(q)}${q > 0 ? "+" : "−"}`);
const valence = (Z: number) => outerOf(Z);

const R = [22, 38, 54, 70];
const ER = 5.2;
/** Trefferfläche eines Elektrons beim Markieren (Einheiten der Zeichnung) */
const HIT = 13;
// Reihenfolge der Plätze auf einer Schale mit 8 Plätzen (oben, unten, rechts, links, dann die Diagonalen) bzw. K (links, rechts)
const ORDER8 = [0, 4, 2, 6, 1, 5, 3, 7];
const pos = (shell: number, k: number, r: number): [number, number] => {
  const a = shell === 0 ? (k === 0 ? Math.PI : 0) : -Math.PI / 2 + (ORDER8[k] * Math.PI) / 4;
  return [r * Math.cos(a), r * Math.sin(a)];
};
/** Radius der Außenschale: Anion etwas weiter außen (Modell: Elektronen stoßen sich ab) */
const ringR = (Z: number, E: number, shell: number, last: boolean) => R[shell] * (last && E > Z ? 1 + 0.16 * Math.min(E - Z, 3) : 1);
/** halbe Breite des Bildes für ein Atom/Ion (gemeinsamer Maßstab mehrerer Atome: größter Wert) */
export const extentOf = (Z: number, E = Z) => { const n = shellsOf(Math.max(Z, E)).length; return ringR(Z, Math.max(Z, E), n - 1, true) + 14; };

export interface AtomProps {
  Z: number; E: number;
  /** halbe Breite der viewBox (gleicher Maßstab für mehrere Atome) */
  ext?: number;
  /** die letzten `got` Elektronen sind aufgenommen (Ring drumherum) */
  got?: number;
  /** freie Plätze der Außenschale gestrichelt zeigen */
  slots?: boolean;
  /** Markieren: Schlüssel "Schale-Platz" */
  marked?: Set<string>;
  onMark?: (key: string) => void;
  /** Lösung markieren (gestrichelt grün) */
  hint?: Set<string>;
  label?: string;
  /** leere Schalen eines Kations gestrichelt zeigen (Standard) */
  ghost?: boolean;
}

/** Bohrmodell der Unterstufe: Kern mit Ladung, Schalen mit festen Radien, Hülle als Fläche (Größe des Teilchens) */
export function Atom({ Z, E, ext, got = 0, slots, marked, onMark, hint, label, ghost = true }: AtomProps) {
  const sh = shellsOf(E), neutral = shellsOf(Z);
  const last = sh.length - 1;
  const rOut = ringR(Z, E, last, true);
  const X = ext ?? extentOf(Z, E);
  const outerFree = slots && last > 0 ? 8 - sh[last] : 0;
  // aufgenommene Elektronen: die letzten in der Füllreihenfolge
  const gotFrom = E - got;
  let idx = 0;
  return (
    <svg className="k1-atom" viewBox={`${-X} ${-X} ${2 * X} ${2 * X}`} role="img"
      aria-label={label ?? tr(`${BY_Z[Z].name}: ${Z} Protonen, ${E} Elektronen, Schalen ${shellText(E)}`, `${BY_Z[Z].name}: ${Z} protons, ${E} electrons, shells ${shellText(E)}`)}>
      <circle r={rOut + 8} className={`k1-halo${E > Z ? " an" : E < Z ? " cat" : ""}`} />
      {ghost && neutral.map((_, i) => i > last && <circle key={`g${i}`} r={R[i]} className="k1-ring ghost" />)}
      {sh.map((_, i) => <circle key={`r${i}`} r={ringR(Z, E, i, i === last)} className={`k1-ring${i === last ? " outer" : ""}`} />)}
      {/* Anion: Außenschale des Atoms gestrichelt zum Vergleich */}
      {E > Z && <circle r={R[neutral.length - 1]} className="k1-outline" />}
      <circle r={13} className="k1-nuc" />
      <text className="k1-nuc-t" y={0.5}>{Z}+</text>
      {outerFree > 0 && Array.from({ length: outerFree }, (_, j) => {
        const [x, y] = pos(last, sh[last] + j, rOut);
        return (
          <circle key={`s${j}`} cx={x} cy={y} r={ER} className="k1-slot-c" />
        );
      })}
      {sh.map((n, s) => Array.from({ length: n }, (_, k) => {
        const i = idx++;
        const [x, y] = pos(s, k, ringR(Z, E, s, s === last));
        const key = `${s}-${k}`;
        // nur beim Markieren ist jedes Elektron ein Tippziel; sonst bedient man das Modell mit den Knöpfen darunter
        const tap = onMark ? () => onMark(key) : undefined;
        const m = marked?.has(key), h = hint?.has(key);
        return (
          <g key={key} data-s={s} className={`k1-e${i >= gotFrom ? " got" : ""}${m ? " mark" : ""}${h ? " hint" : ""}${tap ? " tap" : ""}`} onClick={tap}
            role={tap ? "button" : undefined} tabIndex={tap ? 0 : undefined} aria-pressed={onMark ? !!m : undefined}
            aria-label={tap ? tr(`Elektron auf Schale ${s + 1}`, `Electron in shell ${s + 1}`) : undefined}
            onKeyDown={tap ? e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); } } : undefined}>
            {(m || h) && <circle cx={x} cy={y} r={ER + 3.2} className="k1-e-ring" />}
            <circle cx={x} cy={y} r={ER} className="k1-e-c" />
            {i >= gotFrom && <circle cx={x} cy={y} r={ER * 0.42} className="k1-e-dot" />}
            {tap && <circle cx={x} cy={y} r={HIT} className="k1-hit" />}
          </g>
        );
      }))}
    </svg>
  );
}

/** Beschriftung unter einem Teilchen: Symbol mit Ladung, Protonen · Elektronen → Ladung, Schalen */
export function Caption({ Z, E, noble, big, compact }: { Z: number; E: number; noble?: boolean; big?: boolean; compact?: boolean }) {
  return (
    <div className={`k1-cap${big ? " big" : ""}`}>
      <span className="k1-sym">{sym(Z, E)}</span>
      {!compact && <span className="k1-pe"><b className="k1-p">{Z} p⁺</b> · <b className="k1-el">{E} e⁻</b> → {chargeWord(Z - E)}</span>}
      <span className="k1-sh">{shellText(E)}{noble && isNoble(E) && NOBLE[E] && E !== Z ? <> · <Icon name="check" size={14} /> {tr(`wie ${NOBLE[E]}`, `like ${NOBLE[E]}`)}</> : null}</span>
    </div>
  );
}

/** Teilchen mit Beschriftung (für Bilder ohne Bedienung) */
export function Particle({ Z, E, ext, got, slots, noble, title, compact, ghost }: { Z: number; E: number; ext?: number; got?: number; slots?: boolean; noble?: boolean; title?: string; compact?: boolean; ghost?: boolean }) {
  return (
    <figure className="k1-fig">
      <div className="k1-fig-svg"><Atom Z={Z} E={E} ext={ext} got={got} slots={slots} ghost={ghost} /></div>
      <figcaption>{title && <span className="k1-title">{title}</span>}<Caption Z={Z} E={E} noble={noble} compact={compact} /></figcaption>
    </figure>
  );
}

/** mehrere Teilchen nebeneinander im gleichen Maßstab, dazwischen optional Pfeile */
export function Row({ items, arrows }: { items: { Z: number; E: number; got?: number; title?: string; noble?: boolean; slots?: boolean; ghost?: boolean }[]; arrows?: ReactNode[] }) {
  const ext = Math.max(...items.map(i => extentOf(i.Z, i.E)));
  return (
    <div className={`k1-row n${items.length}`}>
      {items.map((it, k) => (
        <Fragment key={k}>
          {k > 0 && arrows?.[k - 1] && <span className="k1-arrow">{arrows[k - 1]}</span>}
          <Particle {...it} ext={ext} compact={items.length > 2} />
        </Fragment>
      ))}
    </div>
  );
}

// ── Außenelektronen markieren ────────────────────────────────────────────────────────────────

const outerKeys = (Z: number) => { const s = shellsOf(Z); return new Set(Array.from({ length: s[s.length - 1] }, (_, k) => `${s.length - 1}-${k}`)); };

/** Elektronen antippen = markieren; „Prüfen“ meldet die Zahl der markierten Außenelektronen oder „innen“ */
export function MarkOuter({ c, Z }: { c: GuideCtx; Z: number }) {
  const sol = [...outerKeys(Z)];
  const [m, set] = useModel<string[]>(c, [], sol);
  const marked = new Set(m);
  const last = shellsOf(Z).length - 1;
  const toggle = (k: string) => { if (c.solved) return; set(marked.has(k) ? m.filter(x => x !== k) : [...m, k]); };
  const result = () => (m.some(k => Number(k.split("-")[0]) !== last) ? "innen" : String(m.length));
  return (
    <ModelFrame c={c} className="k1-m"
      stage={
        <div className="k1-one">
          <div className="k1-one-svg"><Atom Z={Z} E={Z} ext={R[last] + ER + 4} marked={marked} onMark={c.solved ? undefined : toggle} /></div>
          <div className="k1-cap big">
            <span className="k1-sym">{BY_Z[Z].symbol}</span>
            <span className="k1-pe">{BY_Z[Z].name}</span>
            <span className="k1-count" aria-live="polite">{tr("markiert", "marked")}: <b>{m.length}</b></span>
          </div>
        </div>
      }
      controls={c.solved ? undefined : <Button icon="reset" onClick={() => set([])} disabled={!m.length}>{tr("Löschen", "Clear")}</Button>}
      onCheck={() => c.pick(result())} />
  );
}

// ── Ion bauen: Elektronen abgeben / aufnehmen ───────────────────────────────────────────────

/** Elektronen abgeben (Außenelektron antippen) oder aufnehmen (freien Platz antippen); „Prüfen“ meldet das Teilchen, z. B. "Na⁺" */
export function IonBuilder({ c, Z, solution }: { c: GuideCtx; Z: number; solution: number }) {
  const [E, set] = useModel<number>(c, Z, solution);
  const v = valence(Z);
  // Metall-Atome: höchstens 2 aufnehmen (falscher Weg sichtbar), Nichtmetall-Atome: bis die Außenschale voll ist; abgeben bis 1 über die Außenelektronen hinaus
  const lo = Math.max(1, Z - v - 1), hi = Z + (v <= 3 ? 2 : 8 - v);
  const lose = () => { if (c.solved) return; if (E > lo) set(E - 1); else buzz(); };
  const gain = () => { if (c.solved) return; if (E < hi) set(E + 1); else buzz(); };
  return (
    <ModelFrame c={c} className="k1-m"
      stage={
        <div className="k1-one">
          <div className="k1-one-svg"><Atom Z={Z} E={E} ext={extentOf(Z, hi)} got={Math.max(0, E - Z)} slots={!c.solved} /></div>
          <Caption Z={Z} E={E} big noble={c.solved} />
        </div>
      }
      controls={c.solved ? undefined : <>
        <Button icon="minus" onClick={lose} disabled={c.solved || E <= lo}>{tr("e⁻ abgeben", "lose e⁻")}</Button>
        <Button icon="plus" onClick={gain} disabled={c.solved || E >= hi}>{tr("e⁻ aufnehmen", "gain e⁻")}</Button>
        <Button icon="reset" onClick={() => set(Z)} disabled={c.solved || E === Z} aria-label={tr("Zurück zum Atom", "Back to the atom")} />
      </>}
      onCheck={() => c.pick(sym(Z, E))} />
  );
}

// ── Ladungsrechner: Protonen und Elektronen einstellen ───────────────────────────────────────

export function ChargeCalc({ c, start, solution }: { c: GuideCtx; start: [number, number]; solution: [number, number] }) {
  const [[p, e], set] = useModel<[number, number]>(c, start, solution);
  const lock = c.solved;
  return (
    <ModelFrame c={c} className="k1-m"
      stage={
        <div className="k1-one">
          <div className="k1-one-svg"><Atom Z={p} E={e} ext={extentOf(20, 20)} /></div>
          <div className="k1-cap big">
            <span className="k1-sym">{sym(p, e)}</span>
            <span className="k1-pe">{BY_Z[p].name}</span>
            <span className="k1-pe"><b className="k1-p">{p} p⁺</b> · <b className="k1-el">{e} e⁻</b> → {chargeWord(p - e)}</span>
            <span className="k1-sh">{shellText(e)}</span>
          </div>
        </div>
      }
      controls={c.solved ? undefined : <div className="k1-steppers">
        <Stepper stack label={tr("Protonen", "Protons")} tone="proton" value={p} min={lock ? p : 1} max={lock ? p : 20} editable={false} onChange={x => set([x, e])} />
        <Stepper stack label={tr("Elektronen", "Electrons")} tone="electron" value={e} min={lock ? e : 1} max={lock ? e : 20} editable={false} onChange={x => set([p, x])} />
      </div>}
      onCheck={() => c.pick(sym(p, e))} />
  );
}

// ── PSE: Element antippen → Ion erscheint ───────────────────────────────────────────────────

/** Ion nach der Regel der Unterstufe: I.–III. Hauptgruppe → Ladung = Hauptgruppe, V.–VII. → 8 − Hauptgruppe (negativ);
 *  IV., VIII., Wasserstoff und Bor bilden hier keine Ionen („–“) */
export function ionOf(Z: number): string {
  const g = mainGroupNumber(Z);
  if (!g || Z === 1 || Z === 5 || g === 4 || g === 8) return "–";
  return BY_Z[Z].symbol + chargeSup(g <= 3 ? g : g - 8);
}

/** Elemente antippen (an/aus) – unter dem PSE erscheint das Ion jedes angetippten Elements; „Prüfen“ meldet die Symbole, z. B. "O S" */
export function PseIons({ c, answer }: { c: GuideCtx; answer: number[] }) {
  const [picked, set] = useModel<number[]>(c, [], answer);
  const has = (Z: number) => picked.includes(Z);
  const toggle = (Z: number) => { if (c.solved) return; set(has(Z) ? picked.filter(x => x !== Z) : [...picked, Z].sort((a, b) => a - b)); };
  const result = () => picked.map(Z => BY_Z[Z].symbol).join(" ") || "–";
  return (
    <ModelFrame c={c} className="k1-m"
      stage={
        <div className="k1-pse">
          <div className="pse-fit pse-z k1-pse-fit">
            <PeriodicTable stufe="us" fit names={false} onPick={toggle} disabled={c.solved}
              cellState={Z => (has(Z) ? (c.solved ? "right" : "sel") : c.show && answer.includes(Z) ? "hit" : undefined)} />
          </div>
          <p className="k1-pse-sel" aria-live="polite">{picked.length
            ? picked.map((Z, k) => <span key={Z}>{k > 0 && " · "}{BY_Z[Z].symbol} → <b>{ionOf(Z)}</b></span>)
            : tr("Tippe Elemente an.", "Tap elements.")}</p>
        </div>
      }
      controls={c.solved ? undefined : <Button icon="reset" onClick={() => set([])} disabled={!picked.length}>{tr("Löschen", "Clear")}</Button>}
      onCheck={() => c.pick(result())} />
  );
}

// ── Elektronenübergang zwischen Atomen ───────────────────────────────────────────────────────

export interface TrState { nm: number; nn: number; gave: number[]; got: number[] }
const fresh = (nm: number, nn: number): TrState => ({ nm, nn, gave: Array(nm).fill(0), got: Array(nn).fill(0) });

/** Teilchen gruppieren: "2 Li⁺ + O²⁻" */
function group(list: string[]): string[] {
  const out: [string, number][] = [];
  for (const s of list) { const g = out.find(o => o[0] === s); if (g) g[1]++; else out.push([s, 1]); }
  return out.map(([s, n]) => (n > 1 ? `${n} ${s}` : s));
}
export const trResult = (M: number, N: number, s: TrState) =>
  [...group(s.gave.map(g => sym(M, M - g))), ...group(s.got.map(g => sym(N, N + g)))].join(" + ");

/** Metall-Atome links, Nichtmetall-Atome rechts; Außenelektron eines Metall-Atoms antippen → es geht zum Nichtmetall-Atom
 *  mit den meisten freien Plätzen über. `adjust` = Zahl der Metall- ("m") oder Nichtmetall-Atome ("n") einstellbar (1–3). */
export function Transfer({ c, M, N, start, solution, adjust }: {
  c: GuideCtx; M: number; N: number; start: [number, number]; solution: [number, number]; adjust?: "m" | "n";
}) {
  const vm = valence(M), vn = valence(N);
  const solved = (): TrState => {
    const s = fresh(...solution);
    // Elektronen der Reihe nach verteilen
    for (let i = 0; i < s.nm; i++) for (let k = 0; k < vm; k++) { const j = s.got.findIndex(g => vn + g < 8); if (j >= 0) { s.gave[i]++; s.got[j]++; } }
    return s;
  };
  const [s, set] = useModel<TrState>(c, fresh(...start), solved());
  const [fly, setFly] = useState(0);
  const lock = c.solved;
  const give = (i: number) => {
    if (lock) return;
    if (s.gave[i] >= vm) { buzz(); return; }
    // Ziel: Nichtmetall-Atom mit den meisten freien Plätzen
    let j = -1;
    s.got.forEach((g, k) => { if (vn + g < 8 && (j < 0 || g < s.got[j])) j = k; });
    if (j < 0) { buzz(); return; }
    set({ ...s, gave: s.gave.map((g, k) => (k === i ? g + 1 : g)), got: s.got.map((g, k) => (k === j ? g + 1 : g)) });
    setFly(f => f + 1);
  };
  /** ein Elektron übertragen: vom ersten Metall-Atom, das noch Außenelektronen hat */
  const transfer = () => { const i = s.gave.findIndex(g => g < vm); if (i < 0) buzz(); else give(i); };
  const canGive = s.gave.some(g => g < vm) && s.got.some(g => vn + g < 8);
  const count = (n: number) => { if (lock) return; set(adjust === "m" ? fresh(n, s.nn) : fresh(s.nm, n)); };
  const ext = Math.max(extentOf(M), extentOf(N, N + (8 - vn)));
  const total = s.gave.reduce((a, b) => a + b, 0);
  const rows = Math.max(s.nm, s.nn);
  return (
    <ModelFrame c={c} className="k1-m"
      stage={
        <div className="k1-tr" style={{ ["--rows" as string]: rows }}>
          <div className="k1-tr-col">
            {s.gave.map((g, i) => (
              <figure key={`m${i}`} className="k1-fig">
                <div className="k1-fig-svg"><Atom Z={M} E={M - g} ext={ext} /></div>
                <figcaption><Caption Z={M} E={M - g} noble={c.solved} /></figcaption>
              </figure>
            ))}
          </div>
          <div className="k1-tr-mid" aria-hidden="true">
            <span key={fly} className={`k1-tr-e${fly ? " go" : ""}`}>e⁻</span>
            <span className="k1-tr-arrow">→</span>
          </div>
          <div className="k1-tr-col">
            {s.got.map((g, j) => (
              <figure key={`n${j}`} className="k1-fig">
                <div className="k1-fig-svg"><Atom Z={N} E={N + g} ext={ext} got={g} slots={!lock} /></div>
                <figcaption><Caption Z={N} E={N + g} noble={c.solved} /></figcaption>
              </figure>
            ))}
          </div>
          <p className="k1-tr-sum">
            <span>{tr(`übergegangen: ${total} e⁻`, `transferred: ${total} e⁻`)}</span>
            <span>{tr("Gesamtladung", "Total charge")}: {[...s.gave.map(g => g), ...s.got.map(g => -g)].map(q => `(${signed(q)})`).join(" + ")} = 0</span>
          </p>
        </div>
      }
      controls={c.solved ? undefined : <>
        {adjust && <Stepper stack={false} compact label={adjust === "m" ? tr(`${BY_Z[M].name}-Atome`, `${BY_Z[M].name} atoms`) : tr(`${BY_Z[N].name}-Atome`, `${BY_Z[N].name} atoms`)}
          value={adjust === "m" ? s.nm : s.nn} min={1} max={3} editable={false} onChange={count} />}
        <Button icon="arrow" onClick={transfer} disabled={!canGive}>{tr("e⁻ übertragen", "transfer e⁻")}</Button>
        <Button icon="reset" onClick={() => set(fresh(s.nm, s.nn))} disabled={!total} aria-label={tr("Zurück zu den Atomen", "Back to the atoms")} />
      </>}
      onCheck={() => c.pick(trResult(M, N, s))} />
  );
}
