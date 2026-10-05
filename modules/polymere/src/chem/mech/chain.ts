// Kettenpolymerisation in der Atom-Ansicht: radikalisch (DBPO, AIBN), anionisch (Butyllithium), kationisch (BF₃ + H₂O).
// Die Kette wächst nach rechts: Start (Starter zerfällt bzw. bildet die angreifende Teilchenart), Wachstum (ein Monomer nach dem anderen),
// Abbruch (Rekombination, Disproportionierung, Methanol, H⁺-Abspaltung). Elektronen, die wandern, werden als Punkte gezeigt;
// Pfeile zeigen vorher, wohin sie gehen (halber Pfeil = ein Elektron, voller Pfeil = Elektronenpaar).

import { tr } from "@lern/i18n";
import { method, vinyl, type MechKind, type VinylId } from "../data.ts";
import { compat } from "../rules.ts";
import { aibn, bf3, buli, dbpo, group, methanol, vinylUnit, water, type UnitIds } from "../draw.ts";
import { Scene, dirOf, rad, type Arrow, type Clip, type Key, type Snap } from "../scene.ts";
import type { Action, Bead, Mech, Phase, Recipe, Status } from "./types.ts";

/** Zufall mit festem Startwert (gleicher Ablauf beim Wiederherstellen) */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

interface U { m: VinylId; flip: boolean; ids: UnitIds }

export const STEP = tr(
  { start: "Start", zerfall: "Zerfall des Starters", saeure: "Säure entsteht", kettenstart: "Kettenstart", wachstum: "Kettenwachstum",
    rekombination: "Abbruch: Rekombination", disproportionierung: "Abbruch: Disproportionierung", methanol: "Abbruch mit Methanol",
    hplus: "Kettenende: H⁺ abgespalten", allyl: "H‑Atom abgerissen", nebenreaktion: "Nebenreaktion", keine: "keine Reaktion", lebend: "lebende Kette" },
  { start: "Start", zerfall: "Initiator decomposes", saeure: "Acid forms", kettenstart: "Chain initiation", wachstum: "Propagation",
    rekombination: "Termination: combination", disproportionierung: "Termination: disproportionation", methanol: "Termination with methanol",
    hplus: "Chain end: H⁺ split off", allyl: "H atom pulled off", nebenreaktion: "Side reaction", keine: "No reaction", lebend: "living chain" },
);

export class ChainMech implements Mech {
  sc = new Scene();
  keys: Key[] = [];
  units: U[] = [];
  /** aktives Ende (Atom) und seine Elektronen-Punkte */
  end = "";
  edots: string[] = [];
  xe = 0;
  phase: Phase = "init";
  kind: Exclude<MechKind, "koord">;
  stepName = STEP.start;
  fail?: string;
  note?: string;
  /** Bedingung (Temperatur) */
  cond?: string;
  /** linker Rand des Ausschnitts */
  fx = -99;
  private seq = 0;
  private rand: () => number;
  /** Kennung des Starter-Rests am Kettenanfang */
  private startBead: Bead | null = null;
  /** Gegenion (Li⁺) */
  private li = "";
  /** Rekombination: die zweite Kette hängt jetzt am Ende (Kügelchen-Leiste zeigt beide, Starter-Rest an beiden Enden) */
  private merged = false;

  constructor(public recipe: Recipe) {
    this.kind = method(recipe.method ?? "dbpo").kind as Exclude<MechKind, "koord">;
    this.rand = rng(7 + recipe.a.length * 31 + (recipe.b?.length ?? 0) * 7);
    const me = recipe.method ?? "dbpo";
    if (me === "dbpo") dbpo(this.sc, 0, 0);
    else if (me === "aibn") aibn(this.sc, 0, 0);
    else if (me === "buli") {
      const b = buli(this.sc, -1.45, 0);
      this.end = b.bu; this.li = b.li; this.xe = -1.2; this.phase = "bereit";
      this.sc.note({ id: "dm", x: -1.45, y: 0.62, text: "δ−" });
      this.sc.note({ id: "dp", x: 0.05, y: 0.62, text: "δ+" });
      this.startBead = { kind: "init", hue: "init", letter: "Bu", title: "C₄H₉–" };
    } else if (me === "bf3") {
      bf3(this.sc, -3.2, 0);
      water(this.sc, -1.0, 0);
    }
  }

  private id(p: string) { return `${p}${++this.seq}`; }
  monos(): VinylId[] { return [this.recipe.a, this.recipe.b].filter((x): x is VinylId => !!x) as VinylId[]; }

  // ── Ausgabe ──
  snap(): Snap { return this.frame(); }
  status(): Status {
    const beads: Bead[] = [];
    if (this.startBead) beads.push(this.startBead);
    this.units.forEach((u, i) => { const v = vinyl(u.m); beads.push({ kind: "unit", mono: u.m, hue: v.hue, letter: v.letter, title: v.name, unit: i }); });
    if (this.merged) beads.push(...beads.map(b => ({ ...b, unit: undefined })).reverse());
    const active = this.phase === "bereit" || this.phase === "wachsend" ? (this.kind === "radikal" ? "rad" : this.kind === "anion" ? "an" : "kat") : null;
    return { phase: this.phase, n: this.units.length, step: this.stepName, active, fail: this.fail, beads, living: this.kind === "anion" && this.phase === "wachsend", note: this.note, cond: this.cond };
  }

  actions(): Action[] {
    const out: Action[] = [];
    if (this.phase === "init") {
      if (this.kind === "radikal") out.push({ id: "heat", kind: "start", label: tr("Erwärmen", "Heat") });
      if (this.kind === "kation") out.push({ id: "acid", kind: "start", label: tr("Säure bilden", "Form acid") });
      return out;
    }
    if (this.phase === "bereit" || this.phase === "wachsend") {
      for (const m of this.monos()) out.push({ id: `add:${m}`, kind: "add", mono: m, label: `+ ${vinyl(m).name}` });
      if (this.phase === "wachsend") {
        if (this.kind === "radikal") {
          const lastU = this.units[this.units.length - 1], last = vinyl(lastU.m);
          const comb: Action = { id: "comb", kind: "stop", label: tr("Rekombination", "Combination") };
          const disp: Action = { id: "disp", kind: "stop", label: tr("Disproportionierung", "Disproportionation") };
          // MMA endet überwiegend durch Disproportionierung (etwa 3 : 1), Styrol überwiegend durch Rekombination – das Häufigere zuerst
          if (!last.diene && last.a.includes("H")) out.push(...(lastU.m === "mma" ? [disp, comb] : [comb, disp]));
          else out.push(comb);
        }
        if (this.kind === "anion") out.push({ id: "meoh", kind: "stop", label: tr("+ Methanol", "+ methanol") });
        if (this.kind === "kation") out.push({ id: "hplus", kind: "stop", label: tr("H⁺ abspalten", "Split off H⁺") });
      }
    }
    return out;
  }

  run(id: string): Clip {
    this.keys = [];
    this.key(120, 450);
    if (id === "heat") this.heat();
    else if (id === "acid") this.acid();
    else if (id.startsWith("add:")) this.add(id.slice(4) as VinylId);
    else if (id === "comb") this.terminateRad(false);
    else if (id === "disp") this.terminateRad(true);
    else if (id === "meoh") this.methanolStop();
    else if (id === "hplus") this.cationStop();
    // letzter Schlüssel = neuer Zustand
    this.key(0, 0);
    return this.keys;
  }

  /** Schnappschuss mit Ausschnitt ab fx */
  /** Standbild mit Ausschnitt */
  private frame(): Snap {
    const s = this.sc.snap();
    s.focus = s.atoms.filter(a => a.x >= this.fx && (a.op ?? 1) > 0.05 && !a.vac).map(a => a.id);
    return s;
  }

  private key(hold: number, move: number, arrows?: Arrow[]) {
    this.keys.push({ snap: this.frame(), hold, move, ...(arrows ? { arrows } : {}) });
  }

  // ── Start ──

  /** DBPO: O–O spaltet homolytisch; links spaltet CO₂ ab (Phenylradikal), rechts wandert das zweite Radikal weg.
   *  AIBN: beide C–N-Bindungen spalten, N₂ entweicht. */
  private heat() {
    const sc = this.sc, me = this.recipe.method;
    this.cond = me === "aibn" ? "70 °C" : "80 °C";
    if (me === "dbpo") {
      this.fx = -5;
      this.key(500, 300, [
        { from: { b: ["io1", "io2"], off: -0.12 }, to: { a: "io1", ang: -100, r: 0.4 }, half: true, bend: -0.5 },
        { from: { b: ["io1", "io2"], off: -0.12 }, to: { a: "io2", ang: -80, r: 0.4 }, half: true, bend: 0.5 },
      ]);
      sc.unbond("io1", "io2");
      sc.dot("eL", -0.17, 0); sc.dot("eR", 0.17, 0);
      this.key(120, 900);
      const left = ["io1", "ic1", "iod1", ...[0, 1, 2, 3, 4, 5].map(k => `ipa${k}`)], right = ["io2", "ic2", "iod2", ...[0, 1, 2, 3, 4, 5].map(k => `ipb${k}`)];
      sc.move(left, -0.6, 0); sc.move(right, 0.6, 0);
      sc.dotAt("eL", "io1", 0); sc.dotAt("eR", "io2", 180);
      this.stepName = STEP.zerfall;
      this.key(700, 300, [
        { from: { d: "eL" }, to: { b: ["io1", "ic1"], off: -0.16 }, half: true, bend: 0.6 },
        { from: { b: ["ic1", "ipa0"], off: 0.14 }, to: { b: ["io1", "ic1"], off: 0.16 }, half: true, bend: -0.5 },
        { from: { b: ["ic1", "ipa0"], off: 0.14 }, to: { a: "ipa0", ang: 60, r: 0.4 }, half: true, bend: 0.5 },
      ]);
      // Decarboxylierung links: C–C(Ring) spaltet, CO₂ entsteht
      sc.unbond("ic1", "ipa0");
      sc.dot("eC", -2.25, 0.02); sc.dot("eP", -2.95, 0.02);
      // das zweite Radikal (rechts) gleitet beschriftet zur Seite – es startet eine eigene Kette
      sc.move(right, 1.2, 0); sc.dotAt("eR", "io2", 180);
      const rx = sc.at("io2").x + 1.3;
      sc.note({ id: "r2", x: rx - 0.6, y: 0.85, text: tr("2. Radikal", "2nd radical"), tone: "plain" });
      this.key(120, 1000);
      // CO₂ rückt ab; die zwei Elektronen (eins vom O, eins vom C) bilden die zweite C=O-Bindung
      sc.set("ic1", { x: -1.6, y: -1.7 }); sc.set("io1", { x: -0.6, y: -1.7, lp: [-90, 90] }); sc.set("iod1", { x: -2.6, y: -1.7, lp: [-90, 90] });
      sc.dot("eL", -1.16, -1.7); sc.dot("eC", -1.04, -1.7);
      sc.dotAt("eP", "ipa0", 0);
      sc.note({ id: "co2", x: -1.6, y: -2.45, text: "CO₂", tone: "gas" });
      sc.move(right, 1.6, 0); right.forEach(i => sc.set(i, { op: 0 })); sc.dotAt("eR", "io2", 180); sc.dots.get("eR")!.op = 0;
      sc.note({ id: "r2", x: rx + 1.0, y: 0.85, text: tr("2. Radikal", "2nd radical"), tone: "plain", op: 0 });
      this.key(250, 700);
      sc.order("ic1", "io1", 2);
      sc.undot("eL"); sc.undot("eC"); sc.undot("eR"); sc.unnote("r2");
      for (const i of right) sc.remove(i);
      this.key(350, 600);
      for (const i of ["ic1", "io1", "iod1"]) sc.set(i, { y: -2.9, op: 0 });
      sc.note({ id: "co2", x: -1.6, y: -3.6, text: "CO₂", tone: "gas", op: 0 });
      this.key(200, 0);
      for (const i of ["ic1", "io1", "iod1"]) sc.remove(i);
      sc.unnote("co2");
      this.end = "ipa0"; this.edots = ["eP"]; this.xe = sc.at("ipa0").x;
      this.startBead = { kind: "init", hue: "init", letter: "Ph", title: "C₆H₅–" };
    } else {
      this.fx = -5;
      this.key(500, 300, [
        { from: { b: ["ic1", "in1"], off: -0.12 }, to: { a: "ic1", ang: -60, r: 0.42 }, half: true, bend: 0.5 },
        { from: { b: ["ic1", "in1"], off: -0.12 }, to: { a: "in1", ang: -130, r: 0.42 }, half: true, bend: -0.5 },
        { from: { b: ["ic2", "in2"], off: 0.12 }, to: { a: "ic2", ang: 120, r: 0.42 }, half: true, bend: 0.5 },
        { from: { b: ["ic2", "in2"], off: 0.12 }, to: { a: "in2", ang: 50, r: 0.42 }, half: true, bend: -0.5 },
      ]);
      sc.unbond("ic1", "in1"); sc.unbond("ic2", "in2");
      sc.dot("e1", -1.18, 0); sc.dot("e2", -0.82, 0); sc.dot("e3", 0.82, 0); sc.dot("e4", 1.18, 0);
      this.key(120, 1000);
      // N₂ entsteht (Dreifachbindung) und steigt auf; die beiden Radikale bleiben
      sc.set("in1", { x: -0.5, y: -1.7, lp: [180] }); sc.set("in2", { x: 0.5, y: -1.7, lp: [0] });
      sc.dot("e2", 0, -1.82); sc.dot("e3", 0, -1.58);
      const right = sc.component("ic2");
      sc.move(right, 0.5, 0);
      sc.dotAt("e1", "ic1", 0); sc.dotAt("e4", "ic2", 180);
      sc.note({ id: "n2", x: 0, y: -2.45, text: "N₂", tone: "gas" });
      this.stepName = STEP.zerfall;
      this.key(300, 900);
      sc.order("in1", "in2", 3); sc.undot("e2"); sc.undot("e3");
      // das zweite Radikal gleitet beschriftet zur Seite – es startet eine eigene Kette
      sc.move(right, 1.0, 0); sc.dotAt("e4", "ic2", 180);
      const rx = sc.at("ic2").x + 1.4;
      sc.note({ id: "r2", x: rx - 0.6, y: 1.65, text: tr("2. Radikal", "2nd radical"), tone: "plain" });
      this.key(300, 900);
      sc.move(right, 1.6, 0); right.forEach(i => sc.set(i, { op: 0 })); sc.dotAt("e4", "ic2", 180); sc.dots.get("e4")!.op = 0;
      sc.note({ id: "r2", x: rx + 1.0, y: 1.65, text: tr("2. Radikal", "2nd radical"), tone: "plain", op: 0 });
      this.key(300, 700);
      sc.unnote("r2");
      for (const i of ["in1", "in2"]) sc.set(i, { y: -3.0, op: 0 });
      sc.note({ id: "n2", x: 0, y: -3.7, text: "N₂", tone: "gas", op: 0 });
      this.key(200, 0);
      for (const i of [...right, "in1", "in2"]) sc.remove(i);
      sc.undot("e4"); sc.unnote("n2");
      this.end = "ic1"; this.edots = ["e1"]; this.xe = sc.at("ic1").x;
      this.startBead = { kind: "init", hue: "init", letter: "R", title: "(CH₃)₂C(CN)–" };
    }
    this.phase = "bereit";
  }

  /** BF₃ + H₂O: O bindet an B, dann löst sich H⁺ */
  private acid() {
    const sc = this.sc;
    this.fx = -5;
    this.key(500, 300, [{ from: { a: "wo", ang: 180, r: 0.42 }, to: { a: "bb", ang: 0, r: 0.35 }, bend: -0.4 }]);
    sc.set("wo", { x: -2.0, lp: [180] }); sc.move(["wh1", "wh2"], -1.0, 0);
    [120, 180, 240].forEach((a, k) => { const d = dirOf(a); sc.set(`bf${k === 0 ? 1 : k === 1 ? 0 : 2}`, { x: -3.2 + d.x, y: d.y }); });
    sc.bond("bb", "wo");
    sc.set("bb", { q: -1, qa: -90 }); sc.set("wo", { q: 1, qa: 90 });
    for (const f of ["bf0", "bf1", "bf2"]) sc.autoLp(f, 3);
    sc.autoLp("wo", 1, 180);
    this.stepName = STEP.saeure;
    this.key(500, 300, [{ from: { b: ["wo", "wh1"], off: -0.12 }, to: { a: "wo", ang: -120, r: 0.42 }, bend: 0.5 }]);
    sc.unbond("wo", "wh1");
    sc.set("wh1", { x: 0, y: 0, q: 1, qa: -90 });
    sc.set("wo", { q: 0 });
    sc.autoLp("wo", 2, -90);
    this.key(400, 0);
    this.end = "wh1"; this.xe = 0; this.phase = "bereit";
    this.startBead = { kind: "init", hue: "init", letter: "H", title: "H–" };
  }

  // ── Wachstum ──

  private flipFor(): boolean { return this.rand() < 0.5; }

  private add(m: VinylId) {
    const c = compat(m, this.recipe.method ?? "dbpo");
    if (c.fit === "none") { this.reject(m, c.fail === "side"); this.fail = c.why; return; }
    if (c.fit === "short" && c.fail === "allyl") { this.allyl(m); this.fail = c.why; return; }
    this.fail = undefined;
    this.grow(m);
    // nur kurze Ketten (kationisch: Propen, Butadien): nach dem zweiten Baustein bricht die Kette ab
    if (c.fit === "short" && this.units.length >= 2) {
      if (vinyl(m).diene) this.sideStop(); else this.cationStop();
      this.fail = c.why; this.phase = "aus";
    }
  }

  private grow(m: VinylId) {
    const sc = this.sc, v = vinyl(m), k = this.units.length;
    const ctx = { pre: `u${k}`, unit: k, hue: v.hue };
    const flip = v.diene ? false : this.flipFor();
    const first = this.phase === "bereit";
    // Ausschnitt: das Ende und rechts davon
    this.fx = this.xe - 2.6;
    const kind = this.kind;
    // Anion-Start: Monomer kommt von oben und schiebt sich zwischen C₄H₉ und Li
    const fromTop = kind === "anion" && first;
    const xa = this.xe + (kind === "kation" && first ? 0.8 : 1);
    if (fromTop) this.xe = sc.at(this.end).x + 0.25;
    const ids = vinylUnit(sc, v, xa + 2.0, fromTop ? -2.6 : 0, ctx, { dbl: true, flip });
    if (fromTop) sc.move(ids.atoms, -2.0, 0);
    const all = ids.atoms;
    const bonds = v.diene ? [[ids.ca, ids.mid![0]], [ids.mid![1], ids.cb]] : [[ids.ca, ids.cb]];
    this.key(80, 650);
    // nähern
    if (fromTop) sc.move(all, 0, 1.15); else sc.move(all, -1.25, 0);
    const mid = { x: (sc.at(this.end).x + xa) / 2, y: 0 };
    const pi = (a: string, b: string): Arrow => ({ from: { b: [a, b], off: -0.13 }, to: { a: b, ang: 0, r: 0.42 }, half: kind === "radikal", bend: -0.5 });
    const arrows: Arrow[] = [];
    if (kind === "radikal") {
      arrows.push({ from: { d: this.edots[0] }, to: { p: { x: mid.x + 0.05, y: -0.08 } }, half: true, bend: -0.5 });
      arrows.push({ from: { b: [ids.ca, v.diene ? ids.mid![0] : ids.cb], off: -0.13 }, to: { p: { x: mid.x + 0.18, y: -0.12 } }, half: true, bend: 0.6 });
      if (v.diene) {
        arrows.push({ from: { b: [ids.ca, ids.mid![0]], off: -0.13 }, to: { b: [ids.mid![0], ids.mid![1]], off: -0.14 }, half: true, bend: -0.6 });
        arrows.push({ from: { b: [ids.mid![1], ids.cb], off: -0.13 }, to: { b: [ids.mid![0], ids.mid![1]], off: -0.14 }, half: true, bend: 0.6 });
        arrows.push({ from: { b: [ids.mid![1], ids.cb], off: -0.13 }, to: { a: ids.cb, ang: 0, r: 0.42 }, half: true, bend: -0.5 });
      } else arrows.push(pi(ids.ca, ids.cb));
    } else if (kind === "anion") {
      if (first) arrows.push({ from: { b: [this.end, this.li], off: 0.13 }, to: { p: { x: sc.at(ids.ca).x - 0.45, y: sc.at(ids.ca).y + 0.55 } }, bend: 0.5 });
      else arrows.push({ from: { d: this.edots[0] }, to: { p: { x: mid.x + 0.05, y: -0.1 } }, bend: -0.5 });
      if (v.diene) {
        arrows.push({ from: { b: [ids.ca, ids.mid![0]], off: -0.13 }, to: { b: [ids.mid![0], ids.mid![1]], off: -0.14 }, bend: -0.6 });
        arrows.push({ from: { b: [ids.mid![1], ids.cb], off: -0.13 }, to: { a: ids.cb, ang: 0, r: 0.42 }, bend: -0.5 });
      } else arrows.push(pi(ids.ca, ids.cb));
    } else {
      // kationisch: die π-Elektronen des Monomers greifen das H⁺ bzw. das positive Kettenende an
      arrows.push({ from: { b: [ids.ca, v.diene ? ids.mid![0] : ids.cb], off: -0.13 }, to: { a: this.end, ang: 0, r: 0.38 }, bend: -0.7 });
      if (v.diene) arrows.push({ from: { b: [ids.mid![1], ids.cb], off: -0.13 }, to: { b: [ids.mid![0], ids.mid![1]], off: -0.14 }, bend: 0.6 });
    }
    this.stepName = first ? STEP.kettenstart : STEP.wachstum;
    this.key(900, 320, arrows);
    // π-Bindung(en) in Elektronen zerlegen
    const e = (n: number) => this.id(`e${n}`);
    const pd: string[] = [];
    for (const [a, b] of bonds) {
      sc.order(a, b, 1);
      const A = sc.at(a), B = sc.at(b);
      const d1 = e(1), d2 = e(2);
      sc.dot(d1, A.x + (B.x - A.x) * 0.32, A.y + (B.y - A.y) * 0.32 - 0.13);
      sc.dot(d2, A.x + (B.x - A.x) * 0.68, A.y + (B.y - A.y) * 0.68 - 0.13);
      pd.push(d1, d2);
    }
    // Anion-Start: die C–Li-Bindung wird zum Elektronenpaar
    let liPair: string[] = [];
    if (fromTop) {
      sc.unbond(this.end, this.li);
      const B = sc.at(this.end), L = sc.at(this.li);
      liPair = [e(3), e(4)];
      sc.dot(liPair[0], (B.x + L.x) / 2 - 0.08, 0.12); sc.dot(liPair[1], (B.x + L.x) / 2 + 0.08, 0.12);
      for (const n of ["dm", "dp"]) sc.notes.get(n)!.op = 0;
    }
    this.key(140, 950);
    // an den Platz rücken
    if (fromTop) { sc.move(all, 0, 1.45); sc.set(this.li, { x: sc.at(ids.cb).x + 1.25, q: 1, qa: -90 }); }
    else sc.move(all, -0.75, 0);
    const E = sc.at(this.end), CA = sc.at(ids.ca), CB = sc.at(ids.cb);
    const bm = { x: (E.x + CA.x) / 2, y: (E.y + CA.y) / 2 };
    const mergeTo = (ids2: string[], p: { x: number; y: number }) => ids2.forEach((d, i) => sc.dot(d, p.x + (i - (ids2.length - 1) / 2) * 0.12, p.y));
    if (kind === "radikal") {
      mergeTo([this.edots[0], pd[0]], bm);
      if (v.diene) {
        const M0 = sc.at(ids.mid![0]), M1 = sc.at(ids.mid![1]);
        mergeTo([pd[1], pd[2]], { x: (M0.x + M1.x) / 2, y: -0.13 });
        sc.dotAt(pd[3], ids.cb, 0);
      } else sc.dotAt(pd[1], ids.cb, 0);
    } else if (kind === "anion") {
      mergeTo(first ? liPair : this.edots, bm);
      const pair = v.diene ? [pd[2], pd[3]] : pd;
      if (v.diene) mergeTo([pd[0], pd[1]], { x: (sc.at(ids.mid![0]).x + sc.at(ids.mid![1]).x) / 2, y: -0.13 });
      sc.dot(pair[0], CB.x + 0.36, -0.1); sc.dot(pair[1], CB.x + 0.36, 0.1);
      if (!first) sc.set(this.li, { x: CB.x + 1.25 });
      sc.set(this.end, { q: 0 });
      sc.set(ids.cb, { q: -1, qa: -45 });
    } else {
      if (v.diene) { mergeTo([pd[0], pd[1]], bm); mergeTo([pd[2], pd[3]], { x: (sc.at(ids.mid![0]).x + sc.at(ids.mid![1]).x) / 2, y: -0.13 }); }
      else mergeTo(pd, bm);
      sc.set(this.end, { q: 0 });
      sc.set(ids.cb, { q: 1, qa: -45 });
    }
    this.key(60, 380);
    // Bindung entsteht, verbrauchte Elektronen verschwinden
    sc.bond(this.end, ids.ca);
    if (v.diene) sc.order(ids.mid![0], ids.mid![1], 2);
    let keep: string[] = [];
    if (kind === "radikal") keep = [v.diene ? pd[3] : pd[1]];
    if (kind === "anion") keep = v.diene ? [pd[2], pd[3]] : pd;
    for (const d of [...this.edots, ...pd, ...liPair]) if (!keep.includes(d)) sc.undot(d);
    if (fromTop) { sc.unnote("dm"); sc.unnote("dp"); }
    if (kind === "kation" && first) sc.set(this.end, { q: 0 });
    this.edots = keep;
    this.end = ids.cb; this.xe = sc.at(ids.cb).x;
    this.units.push({ m, flip, ids });
    this.phase = "wachsend";
    this.key(300, 0);
    // alte Bausteine weit links entfernen (bleiben in der Kügelchen-Leiste)
    this.prune();
  }

  /** Atome weit links vom Ausschnitt werden entfernt (die Kette ist trotzdem vollständig in der Leiste) */
  private prune() {
    const lim = this.xe - 11;
    for (const a of [...this.sc.atoms.values()]) if (a.x < lim) this.sc.remove(a.id);
  }

  /** Nebenreaktion am Kettenende: die Ladung bzw. das Radikal geht verloren */
  private sideStop() {
    const sc = this.sc;
    sc.note({ id: "x", x: this.xe + 0.6, y: -0.8, text: "✗", tone: "bad" });
    for (const d of this.edots) sc.undot(d);
    sc.set(this.end, { q: 0 });
    this.edots = [];
    this.stepName = STEP.nebenreaktion;
    this.key(900, 500);
    sc.unnote("x");
  }

  /** Monomer nähert sich und reagiert nicht (bzw. Nebenreaktion: das aktive Ende geht verloren) */
  private reject(m: VinylId, side: boolean) {
    const sc = this.sc, v = vinyl(m), k = this.units.length;
    this.fx = this.xe - 2.6;
    const ids = vinylUnit(sc, v, this.xe + 3.0, 0, { pre: `x${this.seq++}`, unit: k, hue: v.hue }, { dbl: true });
    this.key(80, 650);
    sc.move(ids.atoms, -1.0, 0);
    this.key(300, 400);
    sc.note({ id: "x", x: this.xe + 1.05, y: -0.75, text: "✗", tone: "bad" });
    this.stepName = side ? STEP.nebenreaktion : STEP.keine;
    if (side) {
      for (const d of this.edots) sc.undot(d);
      sc.set(this.end, { q: 0 });
      this.edots = [];
      this.phase = "aus";
    }
    this.key(900, 700);
    sc.move(ids.atoms, 1.8, 0.8);
    ids.atoms.forEach(i => sc.set(i, { op: 0 }));
    this.key(0, 0);
    ids.atoms.forEach(i => sc.remove(i));
    sc.unnote("x");
  }

  /** Radikal + Propen/Isobuten: H‑Atom der CH₃-Gruppe wird abgerissen, das neue Radikal wächst kaum weiter */
  private allyl(m: VinylId) {
    const sc = this.sc, v = vinyl(m), k = this.units.length;
    this.fx = this.xe - 2.6;
    const pre = `x${this.seq++}`;
    // Monomer schräg unten rechts, CH₃-Gruppe zeigt nach oben zum Radikal
    const ids = vinylUnit(sc, v, this.xe + 2.4, 1.9, { pre, unit: k, hue: v.hue }, { dbl: true });
    this.key(80, 650);
    sc.move(ids.atoms, -1.0, 0.3);
    const me = ids.atoms.find(i => sc.at(i).text === "CH₃")!;
    const M = sc.at(me);
    // das abgerissene H einzeln zeigen (C–H-Strich zum Radikal hin): Pfeile beginnen an der Bindung
    const h = this.id("ha");
    const dx = this.xe - M.x, dy = 0 - M.y, dl = Math.hypot(dx, dy) || 1;
    const hp = { x: M.x + (dx / dl) * 1.0, y: M.y + (dy / dl) * 1.0 };
    sc.set(me, { text: "CH₂" });
    sc.add({ id: h, el: "H", x: hp.x, y: hp.y });
    sc.bond(me, h);
    this.key(300, 300);
    const mid = { x: (this.xe + hp.x) / 2, y: (0 + hp.y) / 2 };
    this.key(800, 300, [
      { from: { d: this.edots[0] }, to: { p: { x: mid.x - 0.1, y: mid.y - 0.05 } }, half: true, bend: -0.5 },
      // C–H-Bindung bricht: ein Elektron geht mit dem H zur neuen Bindung, eins bleibt am C (neues, beständiges Radikal)
      { from: { b: [me, h] }, to: { p: { x: mid.x + 0.1, y: mid.y + 0.05 } }, half: true, bend: 0.5 },
      { from: { b: [me, h] }, to: { a: me, ang: -20, r: 0.5 }, half: true, bend: -0.6 },
    ]);
    this.key(100, 900);
    const E = sc.at(this.end);
    sc.unbond(me, h);
    sc.set(h, { x: E.x + 0.8, y: E.y });
    sc.bond(this.end, h);
    const r = this.edots[0];
    sc.undot(r);
    const nd = this.id("ea");
    sc.dot(nd, M.x + 0.42, M.y - 0.1);
    sc.note({ id: "x", x: M.x + 1.1, y: M.y - 0.5, text: "✗", tone: "bad" });
    this.stepName = STEP.allyl;
    this.key(900, 900);
    // das Allylradikal bleibt im Bild (es ist das Produkt dieses Schritts): beständig, startet kaum eine neue Kette
    sc.unnote("x");
    sc.note({ id: "allyl", x: M.x - 0.5, y: M.y + 3.3, text: tr("Allyl-Radikal:\nzu träge zum\nWeiterwachsen", "allyl radical:\ntoo sluggish to\nkeep growing") });
    this.key(0, 0);
    this.edots = [];
    this.phase = "aus";
  }

  // ── Abbruch ──

  /** zweite wachsende Kette (senkrecht, weg von der Hauptgruppe des letzten Bausteins), ihr Radikal-Ende bei (x, 0) */
  private secondChain(x: number) {
    const sc = this.sc, last = this.units[this.units.length - 1], m = last?.m ?? this.recipe.a as VinylId, v = vinyl(m);
    // Hauptgruppe des letzten Bausteins unten → zweite Kette nach oben (Vorzeichen s spiegelt die senkrechte Lage)
    const s = last && last.flip && !v.diene ? -1 : 1;
    const ctx1 = { pre: "z1", unit: 90, hue: v.hue }, ctx2 = { pre: "z2", unit: 91, hue: v.hue };
    // Baustein 1: Ende oben (cb) bei (x, 0), ca darunter
    const cb = "z1cb", ca = "z1ca", cb2 = "z2cb", ca2 = "z2ca";
    sc.add({ id: cb, el: "C", x, y: 0, unit: 90, hue: v.hue });
    sc.add({ id: ca, el: "C", x, y: s, unit: 90, hue: v.hue });
    sc.add({ id: cb2, el: "C", x, y: 2 * s, unit: v.diene ? 90 : 91, hue: v.hue });
    sc.add({ id: ca2, el: "C", x, y: 3 * s, unit: v.diene ? 90 : 91, hue: v.hue });
    // Butadien: ein Baustein –CH₂–CH=CH–CH₂• (Zweifachbindung in der Mitte)
    sc.bond(cb, ca); sc.bond(ca, cb2, v.diene ? 2 : 1); sc.bond(cb2, ca2);
    const ga = v.diene ? [group(sc, "H", ca, 0, ctx1, "a0")] : [group(sc, v.a[0], ca, 0, ctx1, "a0"), group(sc, v.a[1], ca, 180, ctx1, "a1")];
    const gb = v.diene ? [group(sc, "H", cb, 0, ctx1, "b0"), group(sc, "H", cb, -60 * s, ctx1, "b1")] : [group(sc, v.b[0], cb, 0, ctx1, "b0"), group(sc, v.b[1], cb, -60 * s, ctx1, "b1")];
    const g2 = v.diene ? [group(sc, "H", cb2, 0, ctx1, "c0"), group(sc, "H", ca2, 0, ctx1, "d0"), group(sc, "H", ca2, 180, ctx1, "d1")]
      : [group(sc, v.b[0], cb2, 0, ctx2, "b0"), group(sc, v.b[1], cb2, 180, ctx2, "b1"), group(sc, v.a[0], ca2, 0, ctx2, "a0"), group(sc, v.a[1], ca2, 180, ctx2, "a1")];
    const atoms = [cb, ca, cb2, ca2, ...ga.flatMap(g => g.atoms), ...gb.flatMap(g => g.atoms), ...g2.flatMap(g => g.atoms)];
    // schräg nach außen gedreht: senkrecht lägen die Gruppen am zweiten C genau auf denen des ersten Kettenendes
    const ang = -s * 30;
    sc.rotate(atoms, { x, y: 0 }, ang);
    sc.note({ id: "zdots", x: x - 3.85 * s * Math.sin(rad(ang)), y: 3.85 * s * Math.cos(rad(ang)), text: "⋮" });
    // H links an C_a (wandert bei der Disproportionierung)
    const hLeft = (ga[1] ?? ga[0]).atoms[0];
    return { cb, ca, atoms, hLeft };
  }

  private terminateRad(disp: boolean) {
    const sc = this.sc;
    this.fx = this.xe - 2.6;
    const z = this.secondChain(this.xe + 2.9);
    sc.dotAt("zr", z.cb, 180);
    const zAll = [...z.atoms];
    this.key(80, 700);
    sc.move(zAll, -1.2, 0); sc.dotAt("zr", z.cb, 180); sc.notes.get("zdots")!.x -= 1.2;
    const r = this.edots[0];
    if (!disp) {
      const mid = { x: this.xe + 0.85, y: 0 };
      this.key(900, 300, [
        { from: { d: r }, to: { p: { x: mid.x - 0.06, y: -0.1 } }, half: true, bend: -0.6 },
        { from: { d: "zr" }, to: { p: { x: mid.x + 0.06, y: -0.1 } }, half: true, bend: 0.6 },
      ]);
      sc.move(zAll, -0.7, 0); sc.notes.get("zdots")!.x -= 0.7;
      sc.dot(r, this.xe + 0.44, 0); sc.dot("zr", this.xe + 0.56, 0);
      this.key(60, 380);
      sc.bond(this.end, z.cb);
      sc.undot(r); sc.undot("zr");
      this.stepName = STEP.rekombination;
      this.merged = true;
      this.note = tr("Zwei Kettenenden verbinden sich.", "Two chain ends join.");
    } else {
      const H = sc.at(z.hLeft);
      this.key(900, 300, [
        { from: { d: r }, to: { p: { x: (this.xe + H.x) / 2 + 0.1, y: H.y / 2 - 0.1 } }, half: true, bend: -0.6 },
        { from: { b: [z.ca, z.hLeft], off: 0.12 }, to: { a: z.hLeft, ang: -60, r: 0.35 }, half: true, bend: 0.6 },
        { from: { b: [z.ca, z.hLeft], off: 0.12 }, to: { b: [z.cb, z.ca], off: 0.14 }, half: true, bend: -0.6 },
        // das Radikal-Elektron der zweiten Kette bildet mit dem übrigen C–H-Elektron die neue C=C
        { from: { d: "zr" }, to: { b: [z.cb, z.ca], off: 0.14 }, half: true, bend: 0.6 },
      ]);
      sc.unbond(z.ca, z.hLeft);
      const dh = this.id("dh"), dc = this.id("dc"), C = sc.at(z.ca);
      sc.dot(dh, H.x + 0.25, H.y); sc.dot(dc, C.x - 0.25, C.y);
      this.key(120, 950);
      const E = sc.at(this.end);
      sc.set(z.hLeft, { x: E.x + 0.8, y: E.y, unit: undefined, hue: undefined });
      sc.dot(r, E.x + 0.34, E.y); sc.dot(dh, E.x + 0.46, E.y);
      sc.dot(dc, C.x + 0.13, C.y * 0.42); sc.dot("zr", C.x + 0.13, C.y * 0.58);
      this.key(60, 380);
      sc.bond(this.end, z.hLeft);
      sc.order(z.cb, z.ca, 2);
      for (const d of [r, dh, dc, "zr"]) sc.undot(d);
      this.key(300, 700);
      sc.move(zAll.filter(i => i !== z.hLeft), 0.7, 0.4 * Math.sign(sc.at(z.ca).y || 1)); sc.notes.get("zdots")!.x += 0.7;
      this.stepName = STEP.disproportionierung;
      this.note = tr("Ein H‑Atom wandert: ein Ende gesättigt, das andere mit C=C.", "An H atom moves: one end saturated, the other with C=C.");
    }
    this.edots = [];
    this.phase = "ende";
  }

  /** Anion + Methanol: das Kettenende nimmt H⁺ auf, die Kette ist fertig */
  private methanolStop() {
    const sc = this.sc;
    this.fx = this.xe - 2.6;
    const E = sc.at(this.end);
    const mo = methanol(sc, E.x + 3.2, 0);
    sc.move([this.li], 0, 1.0);
    this.key(80, 650);
    sc.move([mo.me, mo.o, mo.h], -0.8, 0);
    this.key(900, 300, [
      { from: { d: this.edots[0] }, to: { a: mo.h, ang: 180, r: 0.25 }, bend: -0.6 },
      { from: { b: [mo.o, mo.h], off: -0.12 }, to: { a: mo.o, ang: -120, r: 0.42 }, bend: 0.6 },
    ]);
    sc.unbond(mo.o, mo.h);
    const O = sc.at(mo.o);
    const d1 = this.id("dm"), d2 = this.id("dm");
    sc.dot(d1, O.x - 0.35, -0.1); sc.dot(d2, O.x - 0.35, 0.1);
    this.key(100, 900);
    sc.set(mo.h, { x: E.x + 0.8 });
    sc.dot(this.edots[0], E.x + 0.34, -0.06); sc.dot(this.edots[1], E.x + 0.46, 0.06);
    sc.move([mo.o, mo.me], 0.5, 0);
    sc.dot(d1, sc.at(mo.o).x - 0.36, -0.1); sc.dot(d2, sc.at(mo.o).x - 0.36, 0.1);
    this.key(60, 380);
    sc.bond(this.end, mo.h);
    for (const d of this.edots) sc.undot(d);
    sc.undot(d1); sc.undot(d2);
    sc.set(this.end, { q: 0 });
    sc.set(mo.o, { q: -1, qa: -45, lp: [-90, 90, 180] });
    sc.set(this.li, { x: sc.at(mo.o).x + 0.2, y: 1.1 });
    this.edots = [];
    this.stepName = STEP.methanol;
    this.note = tr("Methanol gibt H⁺ ab – die lebende Kette endet.", "Methanol gives off H⁺ – the living chain ends.");
    this.phase = "ende";
    this.key(400, 800);
    sc.move([mo.o, mo.me, this.li], 1.5, 0.6);
    for (const i of [mo.o, mo.me, this.li]) sc.set(i, { op: 0 });
    this.key(0, 0);
    for (const i of [mo.o, mo.me, this.li]) sc.remove(i);
  }

  /** Kation: ein H⁺ vom CH₂ neben dem Kettenende löst sich, es entsteht eine C=C-Bindung (H⁺ kann eine neue Kette starten) */
  private cationStop() {
    const sc = this.sc, u = this.units[this.units.length - 1];
    if (!u) return;
    const v = vinyl(u.m);
    this.fx = this.xe - 3.2;
    const ca = v.diene ? u.ids.mid![1] : u.ids.ca;
    const h = sc.nb(ca).find(i => sc.at(i).el === "H" && sc.at(i).y < sc.at(ca).y) ?? sc.nb(ca).find(i => sc.at(i).el === "H");
    if (!h) return;
    const cb = this.end;
    this.key(800, 300, [
      { from: { b: [ca, h], off: -0.12 }, to: { b: [ca, cb], off: -0.14 }, bend: 0.7 },
    ]);
    sc.unbond(ca, h);
    const A = sc.at(ca), B = sc.at(cb);
    const d1 = this.id("dk"), d2 = this.id("dk");
    sc.dot(d1, A.x - 0.08, A.y - 0.4); sc.dot(d2, A.x + 0.08, A.y - 0.4);
    this.key(100, 900);
    sc.dot(d1, (A.x + B.x) / 2 - 0.08, A.y - 0.13); sc.dot(d2, (A.x + B.x) / 2 + 0.08, A.y - 0.13);
    sc.set(h, { y: A.y - 1.8, q: 1, qa: 0 });
    this.key(60, 380);
    sc.order(ca, cb, 2);
    sc.undot(d1); sc.undot(d2);
    sc.set(cb, { q: 0 });
    this.stepName = STEP.hplus;
    this.note = tr("Das H⁺ kann eine neue Kette starten.", "The H⁺ can start a new chain.");
    this.phase = "ende";
    this.key(500, 800);
    sc.set(h, { y: A.y - 2.6, op: 0 });
    this.key(0, 0);
    sc.remove(h);
  }
}
