// Modelle für Kapitel 1 „Vom Atom zum Ion“: Bohrmodell (Unterstufe: 1. Schale bis 2, 2. und 3. Schale bis 8 Elektronen, dann die 4.) mit antippbaren Elektronen,
// Ion bauen (abgeben/aufnehmen), Ladungsrechner (Protonen/Elektronen), PSE mit Ionen, Elektronenübergang zwischen Atomen.
// Jede Schale hat immer denselben Radius (R), egal wie viele Protonen und Elektronen: Das Teilchen wird nur kleiner, wenn eine Schale
// wegfällt (Kation), und nur größer, wenn eine neue dazukommt. Ein Anion ist im Modell so groß wie sein Atom.

import { Fragment, useState, type ReactNode } from "react";
import { Button, Icon, Stepper, buzz, type GuideCtx } from "@lern/ui";
import { BY_Z, ROMAN, chargeSup, mainGroupNumber, shellLines, shellSentence, signed } from "@lern/chem";
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
/** Schalen im Satz: „1. Schale 2, 2. Schale 8, 3. Schale 1 Elektron“ (nie „2 · 8 · 1“ – das sähe aus wie eine Rechnung) */
export const shellText = (E: number) => shellSentence(shellsOf(E));
/** Ladung als Text: „1+“, „2−“, „neutral“ */
export const chargeWord = (q: number) => (q === 0 ? tr("neutral", "neutral") : `${Math.abs(q)}${q > 0 ? "+" : "−"}`);
const valence = (Z: number) => outerOf(Z);

/** feste Schalenradien K, L, M, N (Einheiten der Zeichnung) */
export const R = [22, 38, 54, 70];
const ER = 5.2;
/** Trefferfläche eines Elektrons beim Markieren (Einheiten der Zeichnung) */
const HIT = 13;
// Reihenfolge der Plätze auf einer Schale mit 8 Plätzen (oben, unten, rechts, links, dann die Diagonalen) bzw. K (links, rechts)
const ORDER8 = [0, 4, 2, 6, 1, 5, 3, 7];
const pos = (shell: number, k: number, r: number): [number, number] => {
  const a = shell === 0 ? (k === 0 ? Math.PI : 0) : -Math.PI / 2 + (ORDER8[k] * Math.PI) / 4;
  return [r * Math.cos(a), r * Math.sin(a)];
};
/** halbe Breite des Bildes für ein Atom/Ion: Platz für seine Schalen und die des Atoms (gemeinsamer Maßstab mehrerer Atome: größter Wert) */
export const extentOf = (Z: number, E = Z) => R[shellsOf(Math.max(Z, E)).length - 1] + 14;

export interface AtomProps {
  Z: number; E: number;
  /** halbe Breite der viewBox (gleicher Maßstab für mehrere Atome) */
  ext?: number;
  /** die letzten `got` Elektronen sind gerade aufgenommen: sie gleiten beim Erscheinen auf ihren Platz – danach sehen sie aus wie alle anderen */
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

/** Bohrmodell der Unterstufe: Kern mit Ladung, Schalen mit festen Radien (R). Alle Elektronen sehen gleich aus (aufgenommene und eigene) –
 *  was sich ändert, steht in der Beschriftung; keine Fläche hinter dem Atom, die mitwächst. */
export function Atom({ Z, E, ext, got = 0, slots, marked, onMark, hint, label, ghost = true }: AtomProps) {
  const sh = shellsOf(E), neutral = shellsOf(Z);
  const last = sh.length - 1;
  const rOut = R[last];
  const X = ext ?? extentOf(Z, E);
  const outerFree = slots && last > 0 ? 8 - sh[last] : 0;
  // aufgenommene Elektronen: die letzten in der Füllreihenfolge
  const gotFrom = E - got;
  let idx = 0;
  return (
    <svg className="k1-atom" viewBox={`${-X} ${-X} ${2 * X} ${2 * X}`} role="img"
      aria-label={label ?? tr(`${BY_Z[Z].name}: ${Z} Protonen, ${E} Elektronen; ${shellText(E)}`, `${BY_Z[Z].name}: ${Z} protons, ${E} electrons; ${shellText(E)}`)}>
      {ghost && neutral.map((_, i) => i > last && <circle key={`g${i}`} r={R[i]} className="k1-ring ghost" />)}
      {sh.map((_, i) => <circle key={`r${i}`} r={R[i]} className={`k1-ring${i === last ? " outer" : ""}`} />)}
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
        const [x, y] = pos(s, k, R[s]);
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
            {tap && <circle cx={x} cy={y} r={HIT} className="k1-hit" />}
          </g>
        );
      }))}
    </svg>
  );
}

/** größte Zahl der Schalen unter den Elektronenzahlen von `lo` bis `hi` (so viele Zeilen hält die Beschriftung frei) */
export const shellRows = (lo: number, hi: number) => { let n = 1; for (let E = lo; E <= hi; E++) n = Math.max(n, shellsOf(E).length); return n; };

/** Beschriftung eines Teilchens: Symbol mit Ladung, Protonen · Elektronen → Ladung, Schalen als Zeilen („1. Schale: 2 Elektronen“).
 *  Feste Größe: `rows` Zeilen für die Schalen sind immer frei, „✓ wie Ne“ (`noble`) steht neben dem Symbol in einer eigenen Spalte –
 *  ändert sich der Text, verschiebt sich nichts daneben (das Bild bleibt stehen). */
export function Caption({ Z, E, noble, big, compact, shells = true, rows, name }: {
  Z: number; E: number; noble?: boolean; big?: boolean; compact?: boolean; shells?: boolean; rows?: number; name?: boolean;
}) {
  const sh = shellsOf(E);
  const like = noble && isNoble(E) && NOBLE[E] && E !== Z;
  return (
    <div className={`k1-cap${big ? " big" : ""}`} style={rows ? { ["--sh-rows" as string]: rows } : undefined}>
      <span className="k1-symrow"><span /><span className="k1-sym">{sym(Z, E)}</span>
        <span className="k1-like">{like ? <><Icon name="check" size={14} /> {tr(`wie ${NOBLE[E]}`, `like ${NOBLE[E]}`)}</> : null}</span></span>
      {name && <span className="k1-pe">{BY_Z[Z].name}</span>}
      {!compact && <span className="k1-pe"><b className="k1-p">{Z} p⁺</b> · <b className="k1-el">{E} e⁻</b> → {chargeWord(Z - E)}</span>}
      {!compact && shells && <span className="k1-sh">{shellLines(sh).map((l, i) => <span key={i}>{l}</span>)}</span>}
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
const SHELL = ["K", "L", "M", "N"];
const plural = (n: number, de1: string, deN: string, en1: string, enN: string) => tr(`${n} ${n === 1 ? de1 : deN}`, `${n} ${n === 1 ? en1 : enN}`);

/** Rückmeldungen beim Markieren: innere Schale, nichts markiert, nur ein Teil des äußersten Rings */
export function markWhy(Z: number): Record<string, string> {
  const out: Record<string, string> = {
    innen: tr("Ein markiertes Elektron sitzt auf einer inneren Schale. Markiere nur den äußersten Ring.", "A marked electron is on an inner shell. Mark only the outermost ring."),
    "0": tr("Du hast noch nichts markiert. Tippe die Elektronen auf dem äußersten Ring an.", "You have not marked anything yet. Tap the electrons on the outermost ring."),
  };
  for (let k = 1; k < outerOf(Z); k++) out[String(k)] = tr(`Du hast ${k} markiert. Auf dem äußersten Ring sitzen noch unmarkierte Elektronen.`, `You marked ${k}. There are still unmarked electrons on the outermost ring.`);
  return out;
}

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
        <div className="k1-one k1-one-slim">
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

/** Spielraum beim Ion bauen: abgeben bis 1 über die Außenelektronen hinaus; Metall-Atome nehmen höchstens 2 auf,
 *  Nichtmetall-Atome bis 1 über die volle Außenschale (dann zeigt das Modell eine neue Schale) – nie ist der Anschlag die Lösung */
export function ionRange(Z: number) {
  const v = valence(Z), metal = v <= 3;
  return { v, metal, lo: Math.max(1, Z - v - 1), hi: Z + (metal ? 2 : 8 - v + 1), target: metal ? Z - v : Z + 8 - v };
}

/** Rückmeldung zu jedem Teilchen, das man beim Ion bauen erreichen kann – mit dem Denkfehler und den Zahlen */
export function ionWhy(Z: number): Record<string, string> {
  const { v, metal, lo, hi, target } = ionRange(Z);
  const name = BY_Z[Z].name, full = SHELL[shellsOf(target).length - 1], out: Record<string, string> = {};
  for (let E = lo; E <= hi; E++) {
    if (E === target) continue;
    const pe = `${Z} p⁺ · ${E} e⁻ → ${chargeWord(Z - E)}`;
    let m: string;
    if (E === Z) m = metal
      ? tr(`${name} ist noch neutral (${pe}). Gib die Außenelektronen ab.`, `${name} is still neutral (${pe}). Remove the outer electrons.`)
      : tr(`${name} ist noch neutral (${pe}). Fülle die freien Plätze außen.`, `${name} is still neutral (${pe}). Fill the empty spaces on the outside.`);
    else if (metal && E < Z && E > target) m = tr(`Noch ${plural(E - target, "Außenelektron", "Außenelektronen", "", "")} übrig – außen sind so keine 8.`, `${plural(E - target, "", "", "outer electron is", "outer electrons are")} left – so there are not 8 on the outside.`);
    else if (metal && E < target) m = tr(`Eins zu viel: Jetzt fehlt ein Elektron der ${full}-Schale mit 8 Elektronen. Gib nur die ${v} Außenelektronen ab.`, `One too many: now an electron of the ${full} shell with 8 electrons is missing. Lose only the ${v} outer electrons.`);
    else if (metal) m = tr(`${name} ist ein Metall: Aufnehmen gibt außen ${outerOf(E)} – keine volle Außenschale. Abgeben wären nur ${plural(v, "Elektron", "Elektronen", "", "")} – der kürzere Weg.`,
      `${name} is a metal: gaining gives ${outerOf(E)} on the outside – not a full outer shell. Losing would be only ${plural(v, "", "", "electron", "electrons")} – the shorter way.`);
    else if (E > Z && E < target) m = tr(`Noch ${plural(target - E, "Platz", "Plätze", "", "")} außen frei: ${outerOf(E)} sind keine 8.`, `${plural(target - E, "", "", "space is", "spaces are")} still empty on the outside: ${outerOf(E)} is not 8.`);
    else if (E > target) m = tr(`Die ${full}-Schale ist mit 8 schon voll – mehr passen nicht. Das zusätzliche Elektron müsste auf eine neue Schale.`, `The ${full} shell is already full with 8 – no more fit. The extra electron would have to go on a new shell.`);
    else m = tr(`Du hast abgegeben statt aufgenommen: ${pe}. Aufnehmen wären nur ${plural(8 - v, "Elektron", "Elektronen", "", "")} – der kürzere Weg.`,
      `You lost electrons instead of gaining them: ${pe}. Gaining would be only ${plural(8 - v, "", "", "electron", "electrons")} – the shorter way.`);
    out[sym(Z, E)] = m;
  }
  return out;
}

/** Elektronen abgeben oder aufnehmen (Knöpfe); „Prüfen“ meldet das Teilchen, z. B. "Na⁺" */
export function IonBuilder({ c, Z, solution }: { c: GuideCtx; Z: number; solution: number }) {
  const [E, set] = useModel<number>(c, Z, solution);
  const { lo, hi, metal } = ionRange(Z);
  // gleicher Maßstab für alle erreichbaren Teilchen: das Bild wächst bzw. schrumpft sichtbar
  let ext = 0;
  for (let k = lo; k <= hi; k++) ext = Math.max(ext, extentOf(Z, k));
  const lose = () => { if (c.solved) return; if (E > lo) set(E - 1); else buzz(); };
  const gain = () => { if (c.solved) return; if (E < hi) set(E + 1); else buzz(); };
  return (
    <ModelFrame c={c} className="k1-m"
      stage={
        <div className="k1-one">
          {/* freie Plätze nur bei Nichtmetallen (dort werden sie gefüllt); bei Metallen lenkten sie zum Aufnehmen hin */}
          <div className="k1-one-svg"><Atom Z={Z} E={E} ext={ext} got={Math.max(0, E - Z)} slots={!c.solved && !metal} /></div>
          <Caption Z={Z} E={E} big noble={c.solved} rows={shellRows(lo, hi)} />
        </div>
      }
      controls={c.solved ? undefined : <>
        <Button icon="minus" onClick={lose} disabled={E <= lo}>{tr("e⁻ abgeben", "lose e⁻")}</Button>
        <Button icon="plus" onClick={gain} disabled={E >= hi}>{tr("e⁻ aufnehmen", "gain e⁻")}</Button>
        <Button icon="reset" onClick={() => set(Z)} disabled={E === Z} aria-label={tr("Zurück zum Atom", "Reset")} />
      </>}
      onCheck={() => c.pick(sym(Z, E))} />
  );
}

// ── Ladungsrechner: Protonen und Elektronen einstellen ───────────────────────────────────────

/** höchstens 3 Elektronen mehr oder weniger als Protonen (größere Ladungen gibt es bei diesen Ionen nicht) */
const MAXQ = 3;
const clampE = (p: number, e: number) => Math.max(Math.max(1, p - MAXQ), Math.min(p + MAXQ, e));

/** Rückmeldung zu jedem einstellbaren Teilchen: falsches Element (Protonen) oder falsche Ladung (Elektronen) */
export function calcWhy(Zt: number, Et: number): Record<string, string> {
  const out: Record<string, string> = {}, target = sym(Zt, Et), tname = BY_Z[Zt].name;
  for (let p = 1; p <= 20; p++) for (let e = Math.max(1, p - MAXQ); e <= p + MAXQ; e++) {
    if (p === Zt && e === Et) continue;
    out[sym(p, e)] = p !== Zt
      ? tr(`${p} Protonen sind ${BY_Z[p].name} (${BY_Z[p].symbol}). ${tname} hat die Ordnungszahl ${Zt} – stelle zuerst die Protonen ein.`, `${p} protons are ${BY_Z[p].name} (${BY_Z[p].symbol}). ${tname} has atomic number ${Zt} – set the protons first.`)
      : e === p
        ? tr(`Das ist das neutrale Atom: ${p} p⁺ · ${e} e⁻. ${target} ist geladen.`, `That is the neutral atom: ${p} p⁺ · ${e} e⁻. ${target} is charged.`)
        : tr(`${p} p⁺ · ${e} e⁻ → ${chargeWord(p - e)}. ${target} hat die Ladung ${chargeWord(Zt - Et)}: Ladung = Protonen − Elektronen.`, `${p} p⁺ · ${e} e⁻ → ${chargeWord(p - e)}. ${target} has the charge ${chargeWord(Zt - Et)}: charge = protons − electrons.`);
  }
  return out;
}

export function ChargeCalc({ c, start, solution }: { c: GuideCtx; start: [number, number]; solution: [number, number] }) {
  const [[p, e], set] = useModel<[number, number]>(c, start, solution);
  return (
    <ModelFrame c={c} className="k1-m"
      stage={
        <div className="k1-one">
          <div className="k1-one-svg"><Atom Z={p} E={e} ext={extentOf(20, 20)} /></div>
          <Caption Z={p} E={e} big name rows={shellRows(1, 20 + MAXQ)} />
        </div>
      }
      controls={c.solved ? undefined : <div className="k1-steppers">
        <Stepper stack label={tr("Protonen", "Protons")} tone="proton" value={p} min={1} max={20} editable={false} onChange={x => set([x, clampE(x, e)])} />
        <Stepper stack label={tr("Elektronen", "Electrons")} tone="electron" value={e} min={Math.max(1, p - MAXQ)} max={p + MAXQ} editable={false} onChange={x => set([p, x])} />
      </div>}
      onCheck={() => c.pick(sym(p, e))} />
  );
}

// ── PSE: Element antippen → Hauptgruppe und Außenelektronen, nach dem Lösen das Ion ───────────

/** Ion nach der Regel der Unterstufe: I.–III. Hauptgruppe → Ladung = Hauptgruppe, V.–VII. → 8 − Hauptgruppe (negativ);
 *  IV., VIII., Wasserstoff und Bor bilden in diesem Modell keine einfachen Ionen („–“) */
export function ionOf(Z: number): string {
  const g = mainGroupNumber(Z);
  if (!g || Z === 1 || Z === 5 || g === 4 || g === 8) return "–";
  return BY_Z[Z].symbol + chargeSup(g <= 3 ? g : g - 8);
}

/** was beim Antippen erscheint: Hauptgruppe und Außenelektronen (das Ion selbst erst nach dem Lösen) */
function pseInfo(Z: number) {
  const g = mainGroupNumber(Z) ?? 0, n = outerOf(Z), e = BY_Z[Z];
  const base = tr(`${e.name} ${e.symbol}: ${ROMAN[g]}. Hauptgruppe, ${plural(n, "Außenelektron", "Außenelektronen", "", "")}`, `${e.name} ${e.symbol}: main group ${ROMAN[g]}, ${plural(n, "", "", "outer electron", "outer electrons")}`);
  return Z === 1 || Z === 5 ? `${base} – ${tr("kein Metall, bildet hier kein einfaches Ion", "not a metal, forms no simple ion here")}` : base;
}

/** Elemente antippen (an/aus); „Prüfen“ meldet die Symbole, z. B. "O S" */
export function PseIons({ c, answer }: { c: GuideCtx; answer: number[] }) {
  const [picked, set] = useModel<number[]>(c, [], answer);
  const has = (Z: number) => picked.includes(Z);
  const toggle = (Z: number) => { if (c.solved) return; set(has(Z) ? picked.filter(x => x !== Z) : [...picked, Z]); };
  const sorted = [...picked].sort((a, b) => a - b);
  const result = () => sorted.map(Z => BY_Z[Z].symbol).join(" ") || "–";
  const last = picked[picked.length - 1];
  return (
    <ModelFrame c={c} className="k1-m"
      stage={
        <div className="k1-pse">
          <div className="pse-fit pse-z k1-pse-fit">
            <PeriodicTable stufe="us" fit names={false} onPick={toggle} disabled={c.solved}
              cellState={Z => (has(Z) ? (c.solved ? "right" : "sel") : c.show && answer.includes(Z) ? "hit" : undefined)} />
          </div>
          <div className="k1-pse-sel" aria-live="polite">
            {c.solved
              ? <p>{sorted.map((Z, k) => <span key={Z}>{k > 0 && " · "}{BY_Z[Z].symbol} → <b>{ionOf(Z)}</b></span>)}</p>
              : <>
                <p>{last ? pseInfo(last) : tr("Tippe Elemente an.", "Tap elements.")}</p>
                {picked.length > 0 && <p className="k1-dim2">{tr("angetippt", "tapped")}: {sorted.map(Z => BY_Z[Z].symbol).join(", ")}</p>}
              </>}
          </div>
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

/** ein Elektron übertragen: vom ersten Metall-Atom mit Außenelektronen zum Nichtmetall-Atom mit den meisten freien Plätzen (null: geht nicht) */
function nextTransfer(s: TrState, vm: number, vn: number): TrState | null {
  const i = s.gave.findIndex(g => g < vm);
  let j = -1;
  s.got.forEach((g, k) => { if (vn + g < 8 && (j < 0 || g < s.got[j])) j = k; });
  if (i < 0 || j < 0) return null;
  return { ...s, gave: s.gave.map((g, k) => (k === i ? g + 1 : g)), got: s.got.map((g, k) => (k === j ? g + 1 : g)) };
}

/** Rückmeldung zu jedem erreichbaren Zustand des Übergangs (Zahl der Atome 1–3, beliebig viele Übertragungen) */
export function trWhy(M: number, N: number, start: [number, number], solution: [number, number], adjust?: "m" | "n"): Record<string, string> {
  const vm = valence(M), vn = valence(N), ms = BY_Z[M].symbol, ns = BY_Z[N].symbol, out: Record<string, string> = {};
  const counts: [number, number][] = adjust === "m" ? [1, 2, 3].map(n => [n, start[1]]) : adjust === "n" ? [1, 2, 3].map(n => [start[0], n]) : [start];
  let sol: TrState | null = fresh(...solution);
  for (let t: TrState | null = sol; t; t = nextTransfer(t, vm, vn)) sol = t;
  const answer = trResult(M, N, sol!);
  for (const [nm, nn] of counts) for (let s: TrState | null = fresh(nm, nn); s; s = nextTransfer(s, vm, vn)) {
    const r = trResult(M, N, s);
    if (r === answer) continue;
    const total = s.gave.reduce((a, b) => a + b, 0);
    const left = s.gave.reduce((a, g) => a + vm - g, 0), free = s.got.reduce((a, g) => a + 8 - vn - g, 0);
    const restN = s.got.filter(g => g === 0).length, restM = s.gave.filter(g => g === 0).length;
    const eL = plural(left, "Außenelektron", "Außenelektronen", "outer electron", "outer electrons");
    const fP = plural(free, "freien Platz", "freie Plätze", "empty space", "empty spaces");
    out[r] = total === 0 ? tr("Noch ist kein Elektron übergegangen. Tippe auf „e⁻ übertragen“.", "No electron has passed over yet. Tap “transfer e⁻”.")
      : left > 0 && free > 0 ? tr(`Es geht weiter: ${ms} hat noch ${eL}, ${ns} hat noch ${fP}.`, `Keep going: ${ms} still has ${eL}, ${ns} still has ${fP}.`)
      : left > 0 ? (adjust === "n"
        ? tr(`${ms} hat noch ${eL}, aber alle ${ns}-Atome sind voll. Nimm ein ${ns}-Atom dazu.`, `${ms} still has ${eL}, but all ${ns} atoms are full. Add a ${ns} atom.`)
        : tr(`${plural(restM, `${ms}-Atom bleibt`, `${ms}-Atome bleiben`, `${ms} atom is`, `${ms} atoms are`)} übrig: ${ns} nimmt nur ${8 - vn} auf. Nimm weniger ${ms}-Atome.`, `${plural(restM, "", "", `${ms} atom is`, `${ms} atoms are`)} left over: ${ns} gains only ${8 - vn}. Use fewer ${ms} atoms.`))
      : adjust === "m"
        ? tr(`${ns} hat noch ${fP}, aber alle ${ms}-Atome haben abgegeben. Nimm ein ${ms}-Atom dazu.`, `${ns} still has ${fP}, but all ${ms} atoms have given theirs. Add a ${ms} atom.`)
        : tr(`${plural(restN, `${ns}-Atom bleibt`, `${ns}-Atome bleiben`, "", "")} übrig: ${ms} gibt nur ${vm} ab. Nimm weniger ${ns}-Atome.`, `${plural(restN, "", "", `${ns} atom is`, `${ns} atoms are`)} left over: ${ms} loses only ${vm}. Use fewer ${ns} atoms.`);
  }
  return out;
}

/** Metall-Atome links, Nichtmetall-Atome rechts; „e⁻ übertragen“ gibt ein Außenelektron eines Metall-Atoms an das Nichtmetall-Atom
 *  mit den meisten freien Plätzen. `adjust` = Zahl der Metall- ("m") oder Nichtmetall-Atome ("n") einstellbar (1–3).
 *  Leere Schalen der Kationen sind nicht gezeichnet; jede Schale behält ihren Radius. */
export function Transfer({ c, M, N, start, solution, adjust }: {
  c: GuideCtx; M: number; N: number; start: [number, number]; solution: [number, number]; adjust?: "m" | "n";
}) {
  const vm = valence(M), vn = valence(N);
  const solved = (): TrState => { let s = fresh(...solution); for (let t = nextTransfer(s, vm, vn); t; t = nextTransfer(t, vm, vn)) s = t; return s; };
  const [s, set] = useModel<TrState>(c, fresh(...start), solved());
  const [fly, setFly] = useState(0);
  const next = nextTransfer(s, vm, vn);
  const transfer = () => { if (c.solved) return; if (!next) { buzz(); return; } set(next); setFly(f => f + 1); };
  const count = (n: number) => { if (c.solved) return; set(adjust === "m" ? fresh(n, s.nn) : fresh(s.nm, n)); };
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
                <div className="k1-fig-svg"><Atom Z={M} E={M - g} ext={ext} ghost={false} /></div>
                <figcaption><Caption Z={M} E={M - g} noble={c.solved} shells={false} /></figcaption>
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
                <div className="k1-fig-svg"><Atom Z={N} E={N + g} ext={ext} got={g} slots={!c.solved} /></div>
                <figcaption><Caption Z={N} E={N + g} noble={c.solved} shells={false} /></figcaption>
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
        <Button icon="arrow" onClick={transfer} disabled={!next}>{tr("e⁻ übertragen", "transfer e⁻")}</Button>
        <Button icon="reset" onClick={() => set(fresh(s.nm, s.nn))} disabled={!total} aria-label={tr("Zurück zu den Atomen", "Reset")} />
      </>}
      onCheck={() => c.pick(trResult(M, N, s))} />
  );
}
