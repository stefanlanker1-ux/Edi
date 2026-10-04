// Stufenwachstum in der Atom-Ansicht: Polykondensation (Ester, Amid, CH₂-Brücke – Wasser bzw. HCl wird abgespalten) und
// Polyaddition (Urethan, Harnstoff, Epoxid + Amin – ein H‑Atom wandert, nichts wird abgespalten).
// Die Kette wächst nach rechts: das neue Molekül nähert sich, die reagierenden Atome sind hinterlegt, dann verknüpfen sie sich.
// „Zweierkette“: zwei schon verknüpfte Monomere verbinden sich mit der Kette – beim Stufenwachstum reagieren auch Ketten miteinander.

import { tr } from "@lern/i18n";
import { stepMono, type FG, type StepId } from "../data.ts";
import { LINK_SHORT, reactGroups, stepReact, type Link } from "../rules.ts";
import { stepMolecule, type End, type StepMol } from "../stepdraw.ts";
import { Scene, type Arrow, type Clip, type Key, type Snap } from "../scene.ts";
import type { Action, Bead, Mech, Phase, Recipe, Status } from "./types.ts";

export const STEP_STEP = tr(
  { start: "Ausgangsstoffe", keine: "keine Reaktion", blockiert: "Kettenende blockiert", zwei: "Ketten verbinden sich" },
  { start: "Starting materials", keine: "No reaction", blockiert: "Chain end blocked", zwei: "Chains join" },
);

interface Mol { mol: StepMol; ids: StepId[] }

/** Gruppen in Formelschreibweise */
const FG_TEXT = (): Record<FG, string> => ({ COOH: "–COOH", COCl: "–COCl", OH: "–OH", NH2: "–NH₂", NCO: "–N=C=O", EPOX: tr("eine Epoxidgruppe", "an epoxide group"), ArH: "Ar–H", CHO: "–CHO" });
/** Begründung, wenn das neue Molekül nicht an das Kettenende passt – mit den Gruppen genau dieser Stelle */
function groupWhy(r: FG, l: FG): string {
  const t = FG_TEXT(), a = t[r], b = t[l];
  if (r === l) return tr(`Am Kettenende sitzt schon ${a}. Zwei gleiche Gruppen reagieren nicht miteinander.`, `There is already ${a} at the chain end. Two identical groups do not react with each other.`);
  return tr(`Am Kettenende sitzt ${a}, das neue Molekül bringt ${b}. Diese beiden Gruppen reagieren hier nicht miteinander.`, `The chain end carries ${a}, the new molecule brings ${b}. These two groups do not react with each other here.`);
}

/** Monomer mit lauter gleichen Gruppen (Disäure, Diol, Diamin …): nur dann ist eine Zweierkette aus beiden eindeutig gebaut
 *  (mit Milchsäure oder 6-Aminohexansäure hinge es von der Richtung ab, welche Gruppen sich verbinden) */
const sameGroups = (id: StepId) => stepMono(id).groups.every(g => g === stepMono(id).groups[0]);

export class StepMech implements Mech {
  sc = new Scene();
  keys: Key[] = [];
  phase: Phase = "bereit";
  stepName = STEP_STEP.start;
  fail?: string;
  note?: string;
  /** Bausteine der Kette (links → rechts) */
  units: StepId[] = [];
  /** rechtes Ende der Kette */
  right: End | null = null;
  /** Molekül, das schon bereitsteht (vor der ersten Verknüpfung) */
  pending: Mol | null = null;
  byp = 0;
  bypName = "";
  /** Atome des Nebenprodukts (entweichen nach der Verknüpfung) */
  private bypIds: string[] = [];
  private seq = 0;
  private a: StepId;
  private b: StepId;
  private fx = -99;
  /** Breite des Ausschnitts (Kettenende + Platz für das nächste Molekül) */
  private fw = 8.2;

  constructor(public recipe: Recipe) {
    this.a = recipe.a as StepId;
    this.b = (recipe.b ?? recipe.a) as StepId;
    const sc = this.sc;
    if (this.isPhenoplast()) {
      // Phenol – Methanal – Phenol
      const p1 = stepMolecule(sc, "phenol", 0, 0, this.ctx("phenol"));
      this.units.push("phenol");
      this.right = p1.ends.find(e => e.s === 1) ?? null;
      const me = stepMolecule(sc, "methanal", p1.x1 + 0.6, -1.9, this.ctx("methanal"));
      const p2 = stepMolecule(sc, "phenol", p1.x1 + 1.6, 0, this.ctx("phenol"));
      this.pending = { mol: { atoms: [...me.atoms, ...p2.atoms], ends: [...me.ends, ...p2.ends], x0: me.x0, x1: p2.x1 }, ids: ["methanal", "phenol"] };
      this.fx = p1.x0 - 0.2;
      this.fw = p2.x1 + 0.2 - this.fx;
      return;
    }
    const A = stepMolecule(sc, this.a, 0, 0, this.ctx(this.a));
    this.units.push(this.a);
    this.right = A.ends.find(e => e.s === 1) ?? null;
    // zweites Molekül unter dem ersten (etwas eingerückt): so passen beide auch hochkant groß ins Bild; beim Verknüpfen gleitet es an das Kettenende
    const B0 = stepMolecule(sc, this.b, 0, 2.5, this.ctx(this.b));
    const B = { ...B0, x0: B0.x0 + A.x0 + 1.2 - B0.x0, x1: B0.x1 + A.x0 + 1.2 - B0.x0 };
    sc.move(B0.atoms, A.x0 + 1.2 - B0.x0, 0);
    this.pending = { mol: B, ids: [this.b] };
    // zu Beginn beide Ausgangsstoffe ganz zeigen
    this.fx = A.x0 - 0.2;
    this.fw = Math.max(A.x1, B.x1) + 0.2 - this.fx;
  }

  /** Ausschnitt: Kettenende links, Platz für das nächste Molekül rechts */
  private aim() {
    if (!this.right) return;
    this.fx = this.sc.at(this.right.anchor).x - 3.4;
    this.fw = 8.2;
  }

  private isPhenoplast() { return (this.a === "phenol" && this.b === "methanal") || (this.a === "methanal" && this.b === "phenol"); }
  private ctx(id: StepId) { const u = this.seq++; return { pre: `s${u}`, unit: u, hue: stepMono(id).hue }; }

  snap(): Snap { return this.frame(); }

  status(): Status {
    const beads: Bead[] = this.units.map((u, i) => { const m = stepMono(u); return { kind: "unit", mono: u, hue: m.hue, letter: m.letter, title: m.name, unit: i }; });
    return {
      phase: this.phase, n: this.units.length, step: this.stepName, active: null, fail: this.fail, beads, note: this.note, end: this.right?.fg,
      ...(this.byp ? { byp: `${this.byp} ${this.bypName}` } : {}),
    };
  }

  actions(): Action[] {
    if (this.phase === "aus" || this.phase === "ende") return [];
    if (this.pending) return [{ id: "join", kind: "start", label: tr("Verknüpfen", "Link") }];
    const out: Action[] = [];
    if (this.isPhenoplast()) out.push({ id: "add:pf", kind: "add", pair: ["methanal", "phenol"], label: tr("+ Methanal + Phenol", "+ methanal + phenol") });
    else for (const m of [...new Set([this.a, this.b])]) out.push({ id: `add:${m}`, kind: "add", mono: m, label: `+ ${stepMono(m).name}` });
    if (this.units.length >= 2 && !this.isPhenoplast() && this.a !== this.b && sameGroups(this.a) && sameGroups(this.b)) out.push({ id: "dimer", kind: "other", pair: [this.a, this.b], label: tr("+ Zweier\u00ADkette", "+ chain of two") });
    return out;
  }

  run(id: string): Clip {
    this.keys = [];
    if (id !== "join") this.aim();
    this.key(120, 450);
    if (id === "join") this.aim();
    if (id === "join" && this.pending) { const p = this.pending; this.pending = null; if (this.isPhenoplast()) this.joinPf(p, true); else this.join(p, true); }
    else if (id === "add:pf") this.addPf();
    else if (id.startsWith("add:")) this.addMono(id.slice(4) as StepId);
    else if (id === "dimer") this.addDimer();
    this.key(0, 0);
    return this.keys;
  }

  /** Standbild mit Ausschnitt */
  private frame(): Snap {
    const s = this.sc.snap();
    // Ausschnitt: die Reaktionsstelle (lange Moleküle ragen hinaus)
    s.focus = s.atoms.filter(a => a.x >= this.fx && a.x <= this.fx + this.fw && (a.op ?? 1) > 0.05).map(a => a.id);
    s.span = [this.fx, this.fx + this.fw];
    return s;
  }

  private key(hold: number, move: number, arrows?: Arrow[]) {
    this.keys.push({ snap: this.frame(), hold, move, ...(arrows ? { arrows } : {}) });
  }

  /** neues Molekül rechts der Kette bauen (Lage so, dass die Verknüpfung passt) */
  private build(ids: StepId[]): Mol | null {
    const R = this.right;
    if (!R) return null;
    const first = stepMono(ids[0]);
    // passende Gruppe links am neuen Molekül
    const lfg = first.groups[0];
    const X = this.sc.at(R.anchor);
    const nucR = R.fg === "OH" || R.fg === "NH2";
    const x0 = nucR && lfg === "NCO" ? X.x : X.x + 1;
    let mol = stepMolecule(this.sc, ids[0], x0, 0, this.ctx(ids[0]));
    // weitere Monomere (Zweierkette) gleich anhängen, ohne Ablauf
    for (let i = 1; i < ids.length; i++) {
      const r = mol.ends.find(e => e.s === 1)!;
      const nb = stepMolecule(this.sc, ids[i], this.sc.at(r.anchor).x + 1 + (stepMono(ids[i]).groups[0] === "NCO" && (r.fg === "OH" || r.fg === "NH2") ? -1 : 0), 0, this.ctx(ids[i]));
      const l = nb.ends.find(e => e.s === -1)!;
      this.link(r, l, false);
      mol = { atoms: [...mol.atoms, ...nb.atoms], ends: [...mol.ends.filter(e => e !== r), ...nb.ends.filter(e => e !== l)], x0: mol.x0, x1: nb.x1 };
    }
    return { mol: { ...mol, atoms: mol.atoms.filter(i => this.sc.has(i)) }, ids };
  }

  private addMono(id: StepId) {
    const m = this.build([id]);
    if (!m) return;
    this.join(m, false);
  }

  private addDimer() {
    if (!this.right) return;
    const nucR = this.right.fg === "OH" || this.right.fg === "NH2";
    const acidA = stepMono(this.a).groups.some(g => g === "COOH" || g === "COCl" || g === "NCO" || g === "EPOX");
    // passt das erste Monomer zum Kettenende?
    const firstA = nucR === acidA;
    const m = this.build(firstA ? [this.a, this.b] : [this.b, this.a]);
    if (!m) return;
    this.join(m, false, true);
  }

  /** Molekül spiegeln (links ↔ rechts): ein Monomer mit zwei verschiedenen Gruppen (Milchsäure) wendet der Kette die passende Gruppe zu */
  private mirror(m: Mol) {
    const sc = this.sc, c = (m.mol.x0 + m.mol.x1) / 2;
    for (const id of m.mol.atoms) {
      if (!sc.has(id)) continue;
      const a = sc.at(id);
      sc.set(id, { x: 2 * c - a.x, ...(a.lp ? { lp: a.lp.map(l => 180 - l) } : {}), ...(a.qa !== undefined ? { qa: 180 - a.qa } : {}) });
    }
    m.mol = { ...m.mol, ends: m.mol.ends.map(e => ({ ...e, s: -e.s as 1 | -1 })) };
  }

  /** Molekül nähert sich und verknüpft sich mit dem rechten Kettenende */
  private join(m: Mol, initial: boolean, dimer = false) {
    const sc = this.sc;
    const R = this.right;
    let L = m.mol.ends.find(e => e.s === -1) ?? m.mol.ends[0];
    if (!R || !L) return;
    // passt die linke Gruppe nicht, aber die rechte, wird das Molekül gewendet
    const other = m.mol.ends.find(e => e.s === 1);
    if (!reactGroups(R.fg, L.fg) && other && reactGroups(R.fg, other.fg)) { this.mirror(m); L = m.mol.ends.find(e => e.s === -1)!; }
    const r = reactGroups(R.fg, L.fg);
    const all = m.mol.atoms;
    if (!initial) {
      sc.move(all, 2.2, 0);
      all.forEach(i => sc.set(i, { op: 0 }));
      this.key(60, 600);
      all.forEach(i => sc.set(i, { op: 1 }));
      sc.move(all, r ? -1.2 : 0.4, 0);
      this.key(200, 600);
    } else {
      // vom Platz der Ausgangsstoffe an die Kette heranrücken
      // passen die Gruppen nicht, bleibt sichtbar Abstand (die Moleküle dürfen sich nicht überdecken)
      const want = this.placeX(R, L) + (r ? 0 : 1.6);
      sc.move(all, want - sc.at(L.anchor).x + 1.0, sc.at(R.anchor).y - sc.at(L.anchor).y);
      this.key(200, 600);
    }
    if (!r) {
      // keine Reaktion: gleiche Gruppen bzw. Epoxid + Alkohol
      // ✗ über der Lücke, oberhalb aller Atome dort
      const gx = (sc.at(R.anchor).x + sc.at(L.anchor).x) / 2;
      const top = Math.min(0, ...[...sc.atoms.values()].filter(a => Math.abs(a.x - gx) < 1.2 && (a.op ?? 1) > 0.05).map(a => a.y));
      sc.note({ id: "x", x: gx, y: top - 0.8, text: "✗", tone: "bad" });
      this.stepName = STEP_STEP.keine;
      this.fail = initial ? stepReact(this.units[this.units.length - 1], m.ids[0]).why : groupWhy(R.fg, L.fg);
      this.key(900, 700);
      sc.move(all, 1.6, 0.6); all.forEach(i => sc.set(i, { op: 0 }));
      this.key(0, 0);
      all.forEach(i => sc.remove(i));
      sc.unnote("x");
      if (initial) this.phase = "aus";
      return;
    }
    this.fail = undefined;
    // reagierende Atome hinterlegen
    const hl = [R.anchor, L.anchor, ...R.leave, ...L.leave, ...Object.values(R.extra), ...Object.values(L.extra)].filter(i => sc.has(i));
    hl.forEach(i => sc.set(i, { hl: true }));
    const arrows = this.arrowsFor(r.link, R, L);
    this.key(950, 300, arrows);
    // an den Platz rücken und verknüpfen
    const dx = this.placeX(R, L) - sc.at(L.anchor).x;
    sc.move(all, dx, 0);
    this.link(R, L, true);
    hl.forEach(i => sc.has(i) && sc.set(i, { hl: false }));
    this.units.push(...m.ids);
    this.stepName = dimer ? STEP_STEP.zwei : LINK_SHORT[r.link];
    this.key(700, 900);
    this.release();
    // neues rechtes Ende
    this.right = m.mol.ends.find(e => e.s === 1 && e !== L) ?? null;
    this.phase = this.right ? "wachsend" : "ende";
    if (!this.right) { this.stepName = STEP_STEP.blockiert; this.note = tr("Nur eine reaktive Gruppe – die Kette kann hier nicht weiterwachsen.", "Only one reactive group – the chain cannot grow on here."); }
  }

  /** Nebenprodukt sinkt weg und verschwindet */
  private release() {
    const sc = this.sc, byp = this.bypIds.filter(i => sc.has(i));
    this.bypIds = [];
    if (!byp.length) return;
    sc.move(byp, 0, 1.2); byp.forEach(i => sc.set(i, { op: 0 }));
    const n = sc.notes.get("bypn"); if (n) { n.y += 1.2; n.op = 0; }
    this.key(0, 0);
    byp.forEach(i => sc.remove(i)); sc.unnote("bypn");
  }

  /** x des verknüpfenden Atoms des neuen Moleküls nach der Verknüpfung */
  private placeX(R: End, L: End): number {
    const X = this.sc.at(R.anchor);
    if ((R.fg === "OH" || R.fg === "NH2") && L.fg === "NCO") return X.x + 1; // mittleres C des Isocyanats
    return X.x + 1;
  }

  private arrowsFor(link: Link, R: End, L: End): Arrow[] | undefined {
    const sc = this.sc;
    // Polyaddition: freies Elektronenpaar greift an, die Zweifachbindung bzw. der Ring öffnet sich
    if (link === "urethan" || link === "harnstoff") {
      const nco = R.fg === "NCO" ? R : L, nuc = R.fg === "NCO" ? L : R;
      const s = nco === R ? 1 : -1;
      return [
        { from: { a: nuc.anchor, ang: s > 0 ? 200 : -20, r: 0.42 }, to: { a: nco.anchor, ang: s > 0 ? -20 : 200, r: 0.38 }, bend: 0.5 * s },
        { from: { b: [nco.extra.n, nco.anchor], off: -0.13 }, to: { a: nco.extra.n, ang: -90, r: 0.45 }, bend: -0.5 * s },
      ];
    }
    if (link === "aminoalkohol") {
      const ep = R.fg === "EPOX" ? R : L, n = R.fg === "EPOX" ? L : R;
      void sc;
      return [
        { from: { a: n.anchor, ang: R === ep ? 180 : 0, r: 0.42 }, to: { a: ep.anchor, ang: R === ep ? 0 : 180, r: 0.38 }, bend: 0.5 },
        { from: { b: [ep.anchor, ep.extra.o], off: 0.12 }, to: { a: ep.extra.o, ang: 90, r: 0.45 }, bend: 0.5 },
      ];
    }
    return undefined;
  }

  /** Bindungen umbauen (am Ziel), Nebenprodukt bilden; anim = Nebenprodukt mit Beschriftung */
  private link(R: End, L: End, anim: boolean) {
    const sc = this.sc;
    const r = reactGroups(R.fg, L.fg)!;
    const acidR = R.fg === "COOH" || R.fg === "COCl";
    if (r.link === "ester" || r.link === "amid") {
      const acid = acidR ? R : L, nuc = acidR ? L : R;
      sc.bond(acid.anchor, nuc.anchor);
      // abgespaltene Atome: OH (bzw. Cl) der Säure + H des Alkohols/Amins
      const lo = acid.leave, h = nuc.leave[0];
      for (const x of lo) sc.unbond(acid.anchor, x);
      sc.unbond(nuc.anchor, h);
      const C = sc.at(acid.anchor), N = sc.at(nuc.anchor);
      const mx = (C.x + N.x) / 2, y = C.y + 1.75;
      const free = { unit: undefined, hue: undefined, hl: false };
      if (lo.length === 2) {
        // Wasser: O mit zwei H
        const [o, ha] = lo;
        sc.set(o, { x: mx, y, ...free });
        sc.set(ha, { x: mx - 0.62, y: y + 0.5, ...free });
        sc.set(h, { x: mx + 0.62, y: y + 0.5, ...free });
        sc.bond(o, h);
        sc.autoLp(o, 2, -90);
        this.bypName = "H₂O";
      } else {
        const [cl] = lo;
        sc.set(cl, { x: mx + 0.45, y, ...free });
        sc.set(h, { x: mx - 0.45, y, ...free });
        sc.bond(cl, h);
        sc.autoLp(cl, 3, 0);
        this.bypName = "HCl";
      }
      const gone = [...lo, h];
      if (!anim) gone.forEach(i => sc.remove(i)); else this.bypIds.push(...gone);
      if (anim) { sc.note({ id: "bypn", x: mx + 1.25, y: y + 0.2, text: this.bypName, tone: "gas" }); this.byp++; }
      sc.autoLp(nuc.anchor, sc.at(nuc.anchor).el === "N" ? 1 : 2, 90);
      return;
    }
    if (r.link === "urethan" || r.link === "harnstoff") {
      const nco = R.fg === "NCO" ? R : L, nuc = R.fg === "NCO" ? L : R;
      const C = sc.at(nco.anchor), n = nco.extra.n, o = nco.extra.o, h = nuc.leave[0];
      sc.bond(nco.anchor, nuc.anchor);
      sc.order(n, nco.anchor, 1);
      sc.set(o, { x: C.x, y: C.y - 1 });
      sc.unbond(nuc.anchor, h);
      const N = sc.at(n);
      sc.set(h, { x: N.x, y: N.y + 0.8 });
      sc.bond(n, h);
      sc.autoLp(o, 2, -90); sc.autoLp(n, 1, -90);
      sc.autoLp(nuc.anchor, sc.at(nuc.anchor).el === "N" ? 1 : 2, 90);
      return;
    }
    if (r.link === "aminoalkohol") {
      const ep = R.fg === "EPOX" ? R : L, nuc = R.fg === "EPOX" ? L : R;
      const o = ep.extra.o, ch = ep.extra.ch, h = nuc.leave[0];
      sc.bond(ep.anchor, nuc.anchor);
      sc.unbond(ep.anchor, o);
      const CH = sc.at(ch);
      sc.set(o, { x: CH.x, y: CH.y + 1 });
      sc.unbond(nuc.anchor, h);
      sc.set(h, { x: CH.x + 0.8 * (ep === R ? 1 : -1), y: CH.y + 1 });
      sc.bond(o, h);
      sc.autoLp(o, 2, 90);
      sc.autoLp(nuc.anchor, 1, 90);
      return;
    }
  }

  /** Phenoplast: Methanal und Phenol verbinden sich mit der Kette über eine CH₂-Brücke */
  private addPf() {
    const sc = this.sc;
    const R = this.right;
    if (!R) return;
    const X = sc.at(R.anchor);
    const me = stepMolecule(sc, "methanal", X.x + 1, -1.9, this.ctx("methanal"));
    const p2 = stepMolecule(sc, "phenol", X.x + 2, 0, this.ctx("phenol"));
    this.joinPf({ mol: { atoms: [...me.atoms, ...p2.atoms], ends: [...me.ends, ...p2.ends], x0: me.x0, x1: p2.x1 }, ids: ["methanal", "phenol"] });
  }

  /** Phenol – CH₂ – Phenol: das C des Methanals verbrückt zwei Ringe; O des Methanals + je ein H der Ringe → Wasser */
  private joinPf(m: Mol, initial = false) {
    const sc = this.sc, R = this.right;
    if (!R) return;
    const meEnd = m.mol.ends.find(e => e.fg === "CHO")!, pL = m.mol.ends.find(e => e.fg === "ArH" && e.s === -1)!;
    const all = m.mol.atoms;
    const X = sc.at(R.anchor);
    if (!initial) {
      sc.move(all, 2.2, 0); all.forEach(i => sc.set(i, { op: 0 }));
      this.key(60, 600);
      all.forEach(i => sc.set(i, { op: 1 })); sc.move(all, -2.2, 0);
    }
    // Abstand halten, dann reagierende Atome zeigen
    const target = X.x + 2;
    sc.move(all, target + 1.0 - sc.at(pL.anchor).x, 0);
    const meAtoms = all.filter(i => i.startsWith(meEnd.anchor.replace(/c$/, "")));
    sc.move(meAtoms, -1.0, 0);
    this.key(200, 600);
    const hl = [R.leave[0], meEnd.leave[0], pL.leave[0], meEnd.anchor];
    hl.forEach(i => sc.set(i, { hl: true }));
    this.key(950, 300);
    // Ring B an den Platz, C des Methanals zwischen die Ringe
    sc.move(all.filter(i => !meAtoms.includes(i)), target - sc.at(pL.anchor).x, 0);
    const cx = X.x + 1;
    sc.set(meEnd.anchor, { x: cx, y: 0, hl: false });
    sc.set(meEnd.extra.h1, { x: cx, y: -0.8 }); sc.set(meEnd.extra.h2, { x: cx, y: 0.8 });
    const o = meEnd.leave[0], ha = R.leave[0], hb = pL.leave[0];
    sc.unbond(meEnd.anchor, o); sc.unbond(R.anchor, ha); sc.unbond(pL.anchor, hb);
    sc.bond(R.anchor, meEnd.anchor); sc.bond(meEnd.anchor, pL.anchor);
    const free = { unit: undefined, hue: undefined, hl: false };
    sc.set(o, { x: cx, y: 1.75, ...free }); sc.set(ha, { x: cx - 0.62, y: 2.25, ...free }); sc.set(hb, { x: cx + 0.62, y: 2.25, ...free });
    sc.bond(o, ha); sc.bond(o, hb); sc.autoLp(o, 2, -90);
    this.bypName = "H₂O"; this.byp++;
    sc.note({ id: "bypn", x: cx + 1.25, y: 1.95, text: "H₂O", tone: "gas" });
    this.bypIds.push(o, ha, hb);
    this.units.push(...m.ids);
    this.stepName = LINK_SHORT.methylen;
    this.key(700, 900);
    this.release();
    this.right = m.mol.ends.find(e => e.fg === "ArH" && e.s === 1) ?? null;
    this.phase = "wachsend";
    this.note = tr("Jeder Phenolring kann drei Brücken bilden – es entsteht ein Netz.", "Each phenol ring can form three bridges – a network forms.");
  }
}
