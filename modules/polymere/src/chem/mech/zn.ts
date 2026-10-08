// Ziegler-Natta-Katalysator in der Atom-Ansicht (Cossee-Arlman): Titan an der Oberfläche eines TiCl₃-Kristalls mit einer freien
// Koordinationsstelle (gestrichelter Kreis). Aktivieren: Al(C₂H₅)₃ überträgt eine Ethylgruppe auf das Titan. Dann je Monomer:
// Anlagerung an die freie Stelle (π-Komplex) → Vierring-Übergang → Einbau zwischen Titan und Kette → die Kette rückt zurück,
// die Stelle ist wieder frei. Die Kette wächst also am Titan, nicht am freien Ende. Propen lagert sich immer gleich herum an:
// alle CH₃-Gruppen auf einer Seite (isotaktisch). Polare Monomere besetzen die freie Stelle mit einem freien Elektronenpaar
// (vergiftet), Isobuten ist zu sperrig. H₂ löst die fertige Kette ab; der Katalysator startet die nächste.

import { tr } from "@lern/i18n";
import { vinyl, type VinylId } from "../data.ts";
import { compat, seqKind } from "../rules.ts";
import { titanium, triethylAl, vinylUnit, type UnitIds } from "../draw.ts";
import { Scene, type Arrow, type Clip, type Key, type Snap } from "../scene.ts";
import type { Action, Bead, Mech, Phase, Recipe, Status } from "./types.ts";

interface U { m: VinylId; ids: UnitIds; rel: Map<string, { x: number; y: number }> }

export const ZN_STEP = tr(
  { start: "Katalysator", aktiv: "Katalysator aktiviert", anlagerung: "Anlagerung am Titan", einbau: "Einbau am Titan",
    vergiftet: "Katalysator vergiftet", sperrig: "kein Einbau – zu sperrig", h2: "Kette abgelöst (H₂)" },
  { start: "Catalyst", aktiv: "Catalyst activated", anlagerung: "Attachment at titanium", einbau: "Insertion at titanium",
    vergiftet: "Catalyst poisoned", sperrig: "no insertion – too bulky", h2: "Chain released (H₂)" },
);

/** Abstand Ti – erstes C‑Atom der Kette */
const TI_C = 1.25;

export class ZnMech implements Mech {
  sc = new Scene();
  keys: Key[] = [];
  /** Bausteine vom Titan aus nach außen (0 = zuletzt eingebaut) */
  units: U[] = [];
  phase: Phase = "init";
  stepName = ZN_STEP.start;
  fail?: string;
  note?: string;
  /** Endgruppe der Kette (Ethyl bzw. H) */
  endGroup = "";
  startBead: Bead = { kind: "init", hue: "init", letter: "Et", title: "C₂H₅–" };
  done = 0;
  private seq = 0;

  constructor(public recipe: Recipe) {
    const sc = this.sc;
    titanium(sc, 0, 0, "t");
    sc.add({ id: "tcl4", el: "Cl", x: 1.15, y: 0 });
    sc.bond("tti", "tcl4");
    triethylAl(sc, 3.7, 0, "al");
    sc.note({ id: "cryst", x: -1.2, y: 1.6, text: tr("TiCl₃-Oberfläche", "TiCl₃ surface"), tone: "plain" });
  }

  /** nacheinander zugegeben: Ziegler-Natta-Ketten leben nicht – erst eine Kette aus dem ersten Monomer bis zum Ablösen (H₂),
   *  danach wachsen am Titan neue Ketten aus dem zweiten (zwei getrennte Polymere, keine Blöcke) */
  private sepSeq(): boolean {
    const r = this.recipe;
    return !!(r.seq && r.b && r.b !== r.a && seqKind(r.a as VinylId, r.b as VinylId, "zn") === "separate");
  }
  monos(): VinylId[] {
    if (this.sepSeq()) return [(this.done ? this.recipe.b : this.recipe.a) as VinylId];
    return [this.recipe.a, this.recipe.b].filter((x): x is VinylId => !!x) as VinylId[];
  }
  snap(): Snap { return this.frame(); }

  status(): Status {
    const beads: Bead[] = [this.startBead];
    [...this.units].reverse().forEach((u, i) => { const v = vinyl(u.m); beads.push({ kind: "unit", mono: u.m, hue: v.hue, letter: v.letter, title: v.name, unit: i }); });
    if (this.phase !== "init") beads.push({ kind: "cat", hue: "init", letter: "Ti", title: tr("Titan (Katalysator)", "titanium (catalyst)") });
    return {
      phase: this.phase, n: this.units.length, step: this.stepName, active: this.phase === "bereit" || this.phase === "wachsend" ? "ti" : null,
      fail: this.fail, beads, note: this.note, done: this.done, ...(this.sepSeq() && this.done ? { second: true } : {}),
    };
  }

  actions(): Action[] {
    if (this.phase === "init") return [{ id: "act", kind: "start", label: tr("Aktivieren", "Activate") }];
    if (this.phase === "aus") return [];
    const out: Action[] = this.monos().map(m => ({ id: `add:${m}`, kind: "add" as const, mono: m, label: `+ ${vinyl(m).name}` }));
    if (this.units.length) out.push({ id: "h2", kind: "stop", label: "+ H₂" });
    return out;
  }

  run(id: string): Clip {
    this.keys = [];
    this.key(120, 450);
    if (id === "act") this.activate();
    else if (id.startsWith("add:")) this.add(id.slice(4) as VinylId);
    else if (id === "h2") this.hydrogen();
    this.key(0, 0);
    return this.keys;
  }

  /** Standbild mit Ausschnitt */
  private frame(): Snap {
    const s = this.sc.snap();
    // Ausschnitt: Titan-Zentrum, die ersten zwei Bausteine und alles, was sich nähert
    s.focus = s.atoms.filter(a => a.x <= TI_C + 4.4 && (a.op ?? 1) > 0.05).map(a => a.id);
    return s;
  }

  private key(hold: number, move: number, arrows?: Arrow[]) {
    this.keys.push({ snap: this.frame(), hold, move, ...(arrows ? { arrows } : {}) });
  }

  /** Lage aller Bausteine: waagrecht nach rechts, der neueste am Titan */
  private layout() {
    const sc = this.sc;
    // Breite je Baustein aus seinen Atomen (Butadien: vier C der Hauptkette statt zwei)
    const width = (u: (typeof this.units)[number]) => Math.max(2, Math.round(Math.max(...[...u.rel.values()].map(r => r.x)) + 1));
    let ox = TI_C;
    this.units.forEach(u => {
      for (const [id, r] of u.rel) if (sc.has(id)) sc.set(id, { x: ox + r.x, y: r.y });
      ox += width(u);
    });
    if (this.endGroup && sc.has(this.endGroup)) sc.set(this.endGroup, { x: ox + (this.endGroup === "eth" ? 0.25 : -0.2), y: 0 });
    // weit entfernte Bausteine ausblenden (die Leiste zeigt die ganze Kette)
    this.units.forEach((u, i) => { if (i > 5) for (const id of u.rel.keys()) if (sc.has(id)) sc.remove(id); });
  }

  /** erstes C‑Atom der Kette (am Titan) */
  private first(): string { return this.units[0]?.ids.ca ?? this.endGroup; }

  private activate() {
    const sc = this.sc;
    // Al(C₂H₅)₃ nähert sich, tauscht eine Ethylgruppe gegen das Cl am Titan
    sc.move(["al", "ale0", "ale1", "ale2"], -0.5, 0);
    this.key(300, 900);
    sc.unbond("tti", "tcl4"); sc.unbond("al", "ale0");
    sc.set("ale0", { x: TI_C + 0.25, y: 0, text: "C₂H₅" });
    sc.set("tcl4", { x: 2.65 - 1.2, y: 0.05 });
    sc.bond("tti", "ale0"); sc.bond("al", "tcl4");
    sc.move(["al", "ale1", "ale2", "tcl4"], 0.9, 0);
    sc.set("tcl4", { x: sc.at("al").x - 1.15, y: 0 });
    this.key(500, 900);
    for (const i of ["al", "ale1", "ale2", "tcl4"]) sc.set(i, { op: 0 });
    sc.move(["al", "ale1", "ale2", "tcl4"], 1.8, 0.6);
    this.key(0, 0);
    for (const i of ["al", "ale1", "ale2", "tcl4"]) sc.remove(i);
    // Ethylgruppe heißt ab jetzt „eth“
    const e = sc.at("ale0");
    sc.remove("ale0");
    sc.add({ ...e, id: "eth" });
    sc.bond("tti", "eth");
    this.endGroup = "eth";
    this.phase = "bereit";
    this.stepName = ZN_STEP.aktiv;
    this.note = tr("Al(C₂H₅)₃ macht aus TiCl₄ festes TiCl₃ und setzt eine Ethylgruppe ans Titan. Dort beginnt die Kette.", "Al(C₂H₅)₃ turns TiCl₄ into solid TiCl₃ and puts an ethyl group on the titanium. The chain starts there.");
  }

  private add(m: VinylId) {
    const c = compat(m, "zn");
    if (c.fail === "poison") { this.poison(m); this.fail = c.why; return; }
    if (c.fit !== "ok") { this.bounce(m); this.fail = c.why; return; }
    this.fail = undefined;
    this.insert(m);
  }

  /** Monomer in Standardlage bauen, relative Lage merken */
  private build(m: VinylId, x: number, y: number) {
    const v = vinyl(m), k = this.seq++;
    const ids = vinylUnit(this.sc, v, x, y, { pre: `n${k}`, unit: 100 + k, hue: v.hue }, { dbl: true, flip: false });
    const rel = new Map(ids.atoms.map(id => { const a = this.sc.at(id); return [id, { x: a.x - x, y: a.y - y }]; }));
    return { ids, rel };
  }

  private insert(m: VinylId) {
    const sc = this.sc, v = vinyl(m);
    const { ids, rel } = this.build(m, 0, -1.3);
    // Gruppen unten zur Seite drehen (sie würden sonst in Titan und Kette ragen)
    const pre = ids.ca.slice(0, -2);
    const grp = (tag: string) => ids.atoms.filter(i => i.startsWith(pre + tag));
    if (!v.diene) { sc.rotate(grp("a1"), sc.at(ids.ca), 90); sc.rotate(grp("b1"), sc.at(ids.cb), -130); }
    // Butadien: die unteren H an C1 und C4 nach außen (sonst lägen sie auf dem Titan bzw. auf den H der Kette)
    else { sc.rotate(grp("h01"), sc.at(ids.ca), 90); sc.rotate(grp("h31"), sc.at(ids.cb), -90); }
    const all = ids.atoms;
    // erscheint oben rechts
    sc.move(all, 2.1, -1.4);
    all.forEach(i => sc.set(i, { op: 0 }));
    this.key(80, 600);
    all.forEach(i => sc.set(i, { op: 1 }));
    sc.move(all, -2.1, 0.95);
    // π-Komplex: gestrichelt vom Titan zur Zweifachbindung, die freie Stelle ist besetzt
    const CA = sc.at(ids.ca), CB = sc.at(v.diene ? ids.mid![0] : ids.cb);
    sc.add({ id: "pi", el: "", x: (CA.x + CB.x) / 2, y: CA.y, text: "" });
    sc.bond("tti", "pi", 1, "coord");
    sc.set("tvac", { op: 0 });
    this.stepName = ZN_STEP.anlagerung;
    this.key(700, 700);
    // Vierring: Ti···C_a und C_b···C1 bilden sich
    sc.remove("pi");
    // Butadien liegt über der ganzen Kette: etwas höher, damit seine C‑Atome nicht an die H der Kette stoßen
    sc.move(all, 0, v.diene ? 0.25 : 0.45);
    const c1 = this.first();
    sc.bond("tti", ids.ca, 1, "ts");
    sc.bond(v.diene ? ids.cb : ids.cb, c1, 1, "ts");
    this.key(900, 300, [
      { from: { b: [ids.ca, v.diene ? ids.mid![0] : ids.cb], off: 0.13 }, to: { b: ["tti", ids.ca], f: 0.55, off: -0.12 }, bend: -0.5 },
      { from: { b: ["tti", c1], off: -0.13 }, to: { b: [c1, ids.cb], f: 0.5, off: 0.12 }, bend: 0.5 },
      // Butadien (Einbau 1,4): die zweite π-Bindung wandert in die Mitte (C2=C3) – sonst fehlte am C2 eine Bindung
      ...(v.diene ? [{ from: { b: [ids.mid![1], ids.cb], off: -0.13 }, to: { b: [ids.mid![0], ids.mid![1]], off: -0.14 }, bend: 0.6 } as Arrow] : []),
    ]);
    // Elektronenpaare wandern: π → Ti–C_a, Ti–C1 → C1–C_b
    sc.unbond("tti", ids.ca); sc.unbond(ids.cb, c1);
    const T = sc.at("tti"), C1 = sc.at(c1), A = sc.at(ids.ca), B = sc.at(ids.cb);
    const d = (v.diene ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3]).map(() => `ez${this.seq++}`);
    sc.order(ids.ca, v.diene ? ids.mid![0] : ids.cb, 1);
    if (v.diene) sc.order(ids.mid![1], ids.cb, 1);
    sc.unbond("tti", c1);
    const mid = (P: { x: number; y: number }, Q: { x: number; y: number }, f = 0.5) => ({ x: P.x + (Q.x - P.x) * f, y: P.y + (Q.y - P.y) * f });
    const m1 = mid(A, v.diene ? sc.at(ids.mid![0]) : B), m2 = mid(T, C1);
    sc.dot(d[0], m1.x - 0.08, m1.y + 0.12); sc.dot(d[1], m1.x + 0.08, m1.y + 0.12);
    sc.dot(d[2], m2.x - 0.08, m2.y - 0.12); sc.dot(d[3], m2.x + 0.08, m2.y - 0.12);
    // Butadien: das Elektronenpaar der zweiten π-Bindung (C3=C4)
    if (v.diene) { const m3 = mid(sc.at(ids.mid![1]), B); sc.dot(d[4], m3.x - 0.08, m3.y + 0.12); sc.dot(d[5], m3.x + 0.08, m3.y + 0.12); }
    this.key(120, 900);
    const n1 = mid(T, A), n2 = mid(C1, B);
    sc.dot(d[0], n1.x - 0.08, n1.y); sc.dot(d[1], n1.x + 0.08, n1.y);
    sc.dot(d[2], n2.x - 0.08, n2.y); sc.dot(d[3], n2.x + 0.08, n2.y);
    if (v.diene) { const M = mid(sc.at(ids.mid![0]), sc.at(ids.mid![1])); sc.dot(d[4], M.x - 0.08, M.y + 0.12); sc.dot(d[5], M.x + 0.08, M.y + 0.12); }
    this.key(60, 380);
    sc.bond("tti", ids.ca); sc.bond(ids.cb, c1);
    if (v.diene) sc.order(ids.mid![0], ids.mid![1], 2);
    for (const k of [...sc.dots.keys()]) sc.undot(k);
    this.stepName = ZN_STEP.einbau;
    this.key(300, 1000);
    // Kette rückt zurück, freie Stelle wieder oben
    this.units.unshift({ m, ids, rel });
    for (const id of ids.atoms) sc.set(id, { unit: 0 });
    this.units.forEach((u, i) => { for (const id of u.ids.atoms) if (sc.has(id)) sc.set(id, { unit: i }); });
    this.layout();
    sc.set("tvac", { op: 1 });
    this.phase = "wachsend";
    this.note = undefined;
    this.key(300, 0);
  }

  /** polares Monomer: ein freies Elektronenpaar besetzt die freie Stelle – der Katalysator ist vergiftet */
  private poison(m: VinylId) {
    const sc = this.sc;
    const { ids } = this.build(m, 3.0, -1.5);
    const het = ids.hetero ?? ids.cb;
    // hohe Monomere (MMA) quer legen: im kleinen Bild bleibt alles groß genug
    {
      const xs = ids.atoms.map(i => sc.at(i).x), ys = ids.atoms.map(i => sc.at(i).y);
      if (Math.max(...ys) - Math.min(...ys) > Math.max(...xs) - Math.min(...xs) + 0.5)
        sc.rotate(ids.atoms, { x: (Math.max(...xs) + Math.min(...xs)) / 2, y: (Math.max(...ys) + Math.min(...ys)) / 2 }, 90);
    }
    // zuerst in Standardlage neben dem Titan (noch ohne Ausrichtung), dann dreht es sich
    this.key(80, 500);
    // drehen: das Heteroatom zeigt nach unten zum Titan
    const cx = ids.atoms.reduce((s, i) => s + sc.at(i).x, 0) / ids.atoms.length, cy = ids.atoms.reduce((s, i) => s + sc.at(i).y, 0) / ids.atoms.length;
    const H = sc.at(het);
    const ang = (Math.atan2(H.y - cy, H.x - cx) * 180) / Math.PI;
    sc.rotate(ids.atoms, { x: cx, y: cy }, 90 - ang);
    const H2 = sc.at(het);
    sc.move(ids.atoms, 1.6 - H2.x, -2.3 - H2.y);
    this.key(500, 300);
    const H3 = sc.at(het);
    sc.move(ids.atoms, 0 - H3.x + 0.35, -1.75 - H3.y);
    this.key(500, 300, [{ from: { a: het, ang: 110, r: 0.4 }, to: { a: "tti", ang: -80, r: 0.45 }, bend: 0.4 }]);
    const H4 = sc.at(het);
    sc.move(ids.atoms, -H4.x, -1.4 - H4.y);
    // stößt ein Teil des Monomers an die Liganden des Titans, spiegeln (senkrechte Achse durch das bindende Atom)
    {
      const lig = [...sc.atoms.values()].filter(x => !ids.atoms.includes(x.id) && !x.vac && (x.op ?? 1) > 0.5 && Math.hypot(x.x, x.y) < 2.5);
      const clash = () => ids.atoms.some(i => { const A = sc.at(i); return lig.some(L => Math.abs(L.x - A.x) < 0.8 && Math.abs(L.y - A.y) < 0.5); });
      if (clash()) { const hx = sc.at(het).x; ids.atoms.forEach(i => sc.set(i, { x: 2 * hx - sc.at(i).x })); if (clash()) ids.atoms.forEach(i => sc.set(i, { x: 2 * hx - sc.at(i).x })); }
    }
    sc.bond(het, "tti", 1, "coord");
    const lp = sc.at(het).lp;
    if (lp?.length) {
      // das Paar, das jetzt bindet, verschwindet
      const down = lp.reduce((b, l) => (Math.abs(((l - 90 + 540) % 360) - 180) < Math.abs(((b - 90 + 540) % 360) - 180) ? l : b), lp[0]);
      sc.set(het, { lp: lp.filter(l => l !== down) });
    }
    sc.set("tvac", { op: 0 });
    sc.note({ id: "x", x: 1.25, y: -1.0, text: "✗", tone: "bad" });
    this.stepName = ZN_STEP.vergiftet;
    this.phase = "aus";
    this.key(600, 0);
  }

  /** Isobuten: nähert sich der freien Stelle, wird aber nicht eingebaut */
  private bounce(m: VinylId) {
    const sc = this.sc;
    const { ids } = this.build(m, 2.1, -2.6);
    ids.atoms.forEach(i => sc.set(i, { op: 0 }));
    this.key(80, 600);
    ids.atoms.forEach(i => sc.set(i, { op: 1 }));
    sc.move(ids.atoms, -1.6, 0.5);
    this.key(300, 500);
    sc.note({ id: "x", x: 1.6, y: -1.1, text: "✗", tone: "bad" });
    this.stepName = ZN_STEP.sperrig;
    this.key(900, 700);
    sc.move(ids.atoms, 2.0, -0.8);
    ids.atoms.forEach(i => sc.set(i, { op: 0 }));
    this.key(0, 0);
    ids.atoms.forEach(i => sc.remove(i));
    sc.unnote("x");
  }

  /** H₂: σ-Bindungsmetathese – Ti–H und die fertige Kette mit H am Ende; der Katalysator startet die nächste Kette */
  private hydrogen() {
    const sc = this.sc;
    const c1 = this.first();
    const h1 = `h${this.seq++}`, h2 = `h${this.seq++}`;
    sc.add({ id: h1, el: "H", x: 1.6, y: -2.9, op: 0 }); sc.add({ id: h2, el: "H", x: 2.4, y: -2.9, op: 0 });
    sc.bond(h1, h2);
    this.key(80, 600);
    sc.set(h1, { op: 1, x: 0.2, y: -1.15 }); sc.set(h2, { op: 1, x: 0.75, y: -1.75 });
    sc.set("tvac", { op: 0 });
    this.key(800, 300, [
      { from: { b: [h1, h2], off: -0.12 }, to: { b: ["tti", h1], f: 0.5, off: -0.12 }, bend: 0.5 },
      { from: { b: ["tti", c1], off: 0.12 }, to: { b: [c1, h2], f: 0.5, off: 0.12 }, bend: -0.5 },
    ]);
    sc.unbond(h1, h2); sc.unbond("tti", c1);
    sc.bond("tti", h1); sc.bond(c1, h2);
    sc.set(h1, { x: 0.82, y: 0 });
    const C = sc.at(c1);
    sc.set(h2, { x: C.x - 0.8, y: C.y });
    // fertige Kette löst sich und gleitet sichtbar vom Titan weg (Titan bleibt mit H und freier Stelle)
    const chain = sc.component(c1);
    const abbr = this.recipe.b ? tr("Kette", "chain") : vinyl(this.recipe.a as VinylId).abbr;
    sc.move(chain, 0.9, 0.5);
    sc.set(h2, { x: sc.at(c1).x - 0.8, y: sc.at(c1).y });
    sc.note({ id: "done", x: sc.at(c1).x + 2.2, y: sc.at(c1).y + 1.9, text: tr(`${abbr} abgelöst`, `${abbr} released`), tone: "ok" });
    this.stepName = ZN_STEP.h2;
    this.key(900, 900);
    sc.move(chain, 1.8, 0.9);
    sc.notes.get("done")!.x += 1.8; sc.notes.get("done")!.y += 0.9;
    this.key(500, 1400);
    for (const id of chain) sc.set(id, { op: 0 });
    sc.move(chain, 1.2, 0.6);
    sc.notes.get("done")!.op = 0;
    sc.set("tvac", { op: 1 });
    this.key(0, 0);
    for (const id of chain) sc.remove(id);
    sc.unnote("done");
    this.units = [];
    this.endGroup = h1;
    this.done++;
    this.startBead = { kind: "init", hue: "init", letter: "H", title: "H–" };
    this.phase = "bereit";
    this.note = tr(`Der Katalysator arbeitet weiter: ${this.done} Kette${this.done === 1 ? "" : "n"} fertig.`, `The catalyst keeps working: ${this.done} chain${this.done === 1 ? "" : "s"} finished.`);
  }
}

