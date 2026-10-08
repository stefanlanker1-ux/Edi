// Reaktor (Kügelchen-Ansicht): viele Moleküle in einem Becherglas. Jedes Kügelchen ist ein Baustein (Farbe und Buchstabe je
// Monomer), Striche sind Bindungen. Die Simulation rechnet in Kügelchen-Radien: Wärmebewegung (gedämpfte Zufallsschritte),
// Federn zwischen gebundenen Kügelchen, Abstoßung, Wände. Reaktionen bei Berührung, je mit einer Wahrscheinlichkeit:
//  • Kettenwachstum: nur aktive Kettenenden (Radikal, Anion, Kation, Titan) lagern Monomere an – wenige lange Ketten, freies Monomer
//    bleibt bis zum Schluss übrig. Radikalisch: der Starter zerfällt beim Erwärmen (CO₂ bzw. N₂ steigt auf), zwei Radikalenden
//    brechen ab (Rekombination oder Disproportionierung). Anionisch: alle Ketten starten gleichzeitig und leben weiter – ein zweites
//    Monomer ergibt Blöcke, wenn das Kettenende es starten kann (Styrol/Butadien → MMA → Acrylnitril, nicht umgekehrt; Acrylnitril-Ketten
//    enden durch Nebenreaktionen), Methanol beendet. Kationisch: Kettenenden geben H⁺ ab, das eine neue Kette startet. Ziegler-Natta:
//    Einbau am Titan (der neue Baustein sitzt zwischen Titan und Kette), H₂ löst die fertige Kette, polare Monomere vergiften.
//    Nacheinander zugegeben ohne lebende Ketten: ein Kettenende baut das andere Monomer nicht ein – zwei getrennte Polymere.
//  • Stufenwachstum: jede freie Gruppe reagiert mit jeder passenden Gruppe eines anderen Moleküls – erst Zweier-, Dreierketten,
//    lange Ketten erst bei hohem Umsatz; Wasser bzw. HCl steigt als Bläschen auf; drei reaktive Stellen an einem Monomer → Netz.
// Rein rechnerisch (kein DOM): Zeichnen und Bedienung in components/Reactor.tsx.

import { tr } from "@lern/i18n";
import { method, monoName, stepMono, type FG, type MechKind, type StepId, type VinylId } from "./data.ts";
import { anionFirst, anionStarts, compat, functionality, polymerise, reactGroups, seqKind, stepReact } from "./rules.ts";
import { rng } from "./mech/chain.ts";
import type { Action, Recipe } from "./mech/types.ts";

/** Baustein (Monomer), Starter, Katalysator, Gasbläschen, Nebenprodukt, Abbruchmittel */
export type RKind = "mono" | "init" | "cat" | "gas" | "byp" | "stop";
export type Act = "rad" | "an" | "kat" | "ti";

export interface RBead {
  id: number;
  kind: RKind;
  /** Monomer (mono) bzw. Teilchen: dbpo, aibn, frag (Starter-Bruchstück), buli, bf3, h (H⁺), ti, co2, n2, h2o, hcl, meoh */
  m: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  nb: number[];
  act?: Act;
  /** vergifteter Katalysator bzw. Monomer, das ihn blockiert */
  dead?: boolean;
  /** freie funktionelle Gruppen (Stufenwachstum) */
  fg?: FG[];
  /** Molekül (zusammenhängende Kügelchen) */
  mol: number;
  born: number;
  /** wird mit dem Finger gezogen */
  held?: boolean;
}

export type RPhase = "bereit" | "läuft" | "fertig" | "aus";

export interface RStats {
  phase: RPhase;
  /** Umsatz 0…1 (Kettenwachstum: eingebaute Monomere; Stufenwachstum: verbrauchte Gruppen) */
  conv: number;
  /** Ketten (Kettenwachstum, ab 2 Bausteinen) bzw. Moleküle (Stufenwachstum, auch einzelne Monomere) */
  chains: number;
  /** mittlere Zahl der Bausteine je Kette bzw. Molekül */
  avg: number;
  max: number;
  /** aktive Kettenenden */
  active: number;
  living: boolean;
  network: boolean;
  poisoned: number;
  /** abgespaltene Nebenprodukt-Moleküle */
  byp: number;
  bypName?: string;
  /** Nebenprodukte je Art (Säurechlorid + Milchsäure: HCl und H₂O) */
  bypParts?: [string, number][];
  /** fertige Ketten am Katalysator (Ziegler-Natta) */
  released: number;
  /** letzter Vorgang (Kennzeichen) */
  event?: string;
  /** Begründung, warum nichts bzw. wenig passiert */
  why?: string;
  /** Kettenlängen: Anzahl in den Klassen 1 | 2–3 | 4–7 | 8–15 | 16–31 | ab 32 */
  hist: number[];
}

const EV = tr(
  { zerfall: "Starter zerfällt", start: "Ketten starten", wachstum: "Kettenwachstum", rekombination: "Rekombination", disproportionierung: "Disproportionierung",
    uebertragung: "H⁺ wandert weiter", vergiftet: "Katalysator vergiftet", h2: "Ketten abgelöst (H₂)", methanol: "Abbruch mit Methanol", methanolZu: "Methanol zugegeben", verknuepfung: "Verknüpfung",
    keine: "keine Reaktion", allyl: "H‑Atom abgerissen", neben: "Nebenreaktion", netz: "Netz entsteht", neu: "neue Ketten starten" },
  { zerfall: "Initiator decomposes", start: "Chains start", wachstum: "Propagation", rekombination: "Combination", disproportionierung: "Disproportionation",
    uebertragung: "H⁺ moves on", vergiftet: "Catalyst poisoned", h2: "Chains released (H₂)", methanol: "Stopped with methanol", methanolZu: "Methanol added", verknuepfung: "Linking",
    keine: "No reaction", allyl: "H atom pulled off", neben: "Side reaction", netz: "Network forms", neu: "New chains start" },
);

/** Wahrscheinlichkeiten je Berührung bzw. Schritt */
const KD = 0.008, KP = 0.45, KT = 0.5, KS = 0.006, KPOISON = 0.35;
/** Kügelchen-Radien */
const R_MONO = 1, R_INIT = 0.8, R_CAT = 1.7, R_GAS = 0.55;

const GAS_OF: Record<string, string> = { dbpo: "co2", aibn: "n2" };
/** kurze Bezeichnung der Teilchen (Kügelchen-Beschriftung) */
export const PARTICLE: Record<string, { letter: string; name: string }> = tr(
  {
    dbpo: { letter: "I", name: "Dibenzoylperoxid (Starter)" }, aibn: { letter: "I", name: "AIBN (Starter)" }, frag: { letter: "R", name: "Starter-Bruchstück" },
    buli: { letter: "Bu", name: "Butyllithium (Starter)" }, bf3: { letter: "BF₃", name: "BF₃ mit Wasser (Starter)" }, h: { letter: "H⁺", name: "H⁺ (Proton)" },
    ti: { letter: "Ti", name: "Ziegler-Natta-Katalysator" }, co2: { letter: "", name: "Kohlenstoffdioxid (CO₂)" }, n2: { letter: "", name: "Stickstoff (N₂)" },
    h2o: { letter: "", name: "Wasser (H₂O)" }, hcl: { letter: "", name: "Chlorwasserstoff (HCl)" }, meoh: { letter: "M", name: "Methanol" },
  },
  {
    dbpo: { letter: "I", name: "Dibenzoyl peroxide (initiator)" }, aibn: { letter: "I", name: "AIBN (initiator)" }, frag: { letter: "R", name: "Initiator fragment" },
    buli: { letter: "Bu", name: "Butyllithium (initiator)" }, bf3: { letter: "BF₃", name: "BF₃ with water (initiator)" }, h: { letter: "H⁺", name: "H⁺ (proton)" },
    ti: { letter: "Ti", name: "Ziegler–Natta catalyst" }, co2: { letter: "", name: "Carbon dioxide (CO₂)" }, n2: { letter: "", name: "Nitrogen (N₂)" },
    h2o: { letter: "", name: "Water (H₂O)" }, hcl: { letter: "", name: "Hydrogen chloride (HCl)" }, meoh: { letter: "M", name: "Methanol" },
  },
);

export class Reactor {
  beads: RBead[] = [];
  /** Zeit in Schritten (30 je Sekunde) */
  t = 0;
  started = false;
  /** Zeitpunkt der letzten Reaktion (für „Ruhe“: nichts passiert mehr) */
  lastEvent = 0;
  W: number;
  H: number;
  readonly kind: MechKind | "step";
  private byId = new Map<number, RBead>();
  private molSize = new Map<number, number>();
  private nextId = 1;
  private nextMol = 1;
  private rand: () => number;
  private heat = false;
  private event?: string;
  private why?: string;
  private bypCount = 0;
  private released = 0;
  private groups0 = 0;
  /** Monomere, die zugegeben werden können (Reihenfolge des Ansatzes) */
  readonly monos: string[];
  /** zweites Monomer noch nicht im Gefäß (nacheinander zugeben) */
  private pendingB: string | null = null;
  /** Stufenwachstum: welche Gruppen miteinander reagieren */
  private partners = new Map<FG, FG[]>();
  /** Stufenwachstum: entsteht nach den Regeln ein Netz? */
  private netPossible = false;
  /** Stufenwachstum: Partner, der nicht reagiert (das andere Monomer reagiert nur mit sich selbst) */
  private idleStep?: string;
  /** Nebenprodukte je Art */
  private bypKinds = new Map<string, number>();
  /** freie Monomere je Art (anionisch gleichzeitig: das schnellere Monomer zuerst) */
  private free = new Map<string, number>();

  constructor(public recipe: Recipe, W: number, H: number, seed = 7) {
    this.W = W; this.H = H;
    this.rand = rng(seed);
    this.kind = recipe.art === "poly" ? method(recipe.method ?? "dbpo").kind : "step";
    this.monos = [...new Set([recipe.a, recipe.b].filter(Boolean) as string[])];
    if (this.kind === "step") {
      const gs = [...new Set(this.monos.flatMap(m => stepMono(m).groups))];
      for (const x of gs) this.partners.set(x, gs.filter(y => reactGroups(x, y)));
      const out = stepReact(recipe.a as StepId, recipe.b as StepId | undefined);
      this.netPossible = out.struktur === "vernetzt";
      this.idleStep = out.unreacted;
      this.fillStep();
    } else this.fillChain();
  }

  /** passende Gruppen zweier Kügelchen (Stufenwachstum) */
  private match(a: RBead, b: RBead): [FG, FG] | null {
    for (const x of a.fg ?? []) { const ps = this.partners.get(x); if (ps?.length) for (const y of b.fg ?? []) if (ps.includes(y)) return [x, y]; }
    return null;
  }

  // ── Befüllen ──

  private area() { return this.W * this.H; }

  private fillChain() {
    const r = this.recipe;
    const n = clamp(Math.round(this.area() * 0.05), 40, 120);
    if (r.b && r.b !== r.a && r.seq) {
      this.spawn(r.a, Math.round(n * 0.55), "all");
      this.pendingB = r.b;
    } else if (r.b && r.b !== r.a) {
      this.spawn(r.a, Math.round(n / 2), "all");
      this.spawn(r.b, n - Math.round(n / 2), "all");
    } else this.spawn(r.a, n, "all");
    const me = r.method ?? "dbpo";
    if (this.kind === "koord") {
      for (let i = 0; i < 4; i++) {
        const b = this.add({ kind: "cat", m: "ti", r: R_CAT, x: this.W * (0.16 + 0.226 * i), y: this.H * (0.56 + 0.16 * (i % 2)) });
        b.vx = b.vy = 0;
      }
    } else {
      const m = me === "buli" ? "buli" : me === "bf3" ? "bf3" : me;
      for (let i = 0; i < (m === "dbpo" || m === "aibn" ? 6 : 5); i++) this.place({ kind: "init", m, r: R_INIT });
    }
  }

  private fillStep() {
    const r = this.recipe;
    const a = r.a as StepId, b = (r.b && r.b !== r.a ? r.b : undefined) as StepId | undefined;
    const n = clamp(Math.round(this.area() * 0.045), 36, 100);
    if (!b) { this.spawn(a, n, "all"); }
    else {
      // Gruppen ausgleichen: nA · fA ≈ nB · fB
      const out = stepReact(a, b);
      const fa = Math.max(1, functionality(a, out.groups?.[1] ?? null)), fb = Math.max(1, functionality(b, out.groups?.[0] ?? null));
      const na = clamp(Math.round(n * fb / (fa + fb)), 6, n - 6);
      this.spawn(a, na, "all");
      this.spawn(b, n - na, "all");
    }
    this.groups0 = this.beads.reduce((s, x) => s + (x.fg?.length ?? 0), 0);
  }

  /** Monomere ins Gefäß geben (Ort: ganzes Gefäß oder oben einströmend) */
  private spawn(m: string, n: number, where: "all" | "top") {
    const step = this.kind === "step";
    const partner = step ? this.partnerGroup(m) : null;
    for (let i = 0; i < n; i++) {
      const b = this.place({ kind: "mono", m, r: R_MONO }, where);
      if (step) b.fg = m === this.idleStep ? [] : stepMono(m).groups.flatMap(g => (g === "NH2" && partner === "EPOX" ? ["NH2", "NH2"] as FG[] : [g]));
    }
  }

  /** Gruppe des anderen Monomers, mit der dieses reagiert */
  private partnerGroup(m: string): FG | null {
    const other = this.monos.find(x => x !== m);
    if (!other) return null;
    for (const x of stepMono(m).groups) for (const y of stepMono(other).groups) if (reactGroups(x, y)) return y;
    return null;
  }

  private add(p: { kind: RKind; m: string; r: number; x: number; y: number }): RBead {
    const b: RBead = { id: this.nextId++, kind: p.kind, m: p.m, x: p.x, y: p.y, vx: 0, vy: 0, r: p.r, nb: [], mol: this.nextMol++, born: this.t };
    this.beads.push(b);
    this.byId.set(b.id, b);
    this.molSize.set(b.mol, 1);
    return b;
  }

  /** an freier Stelle einsetzen */
  private place(p: { kind: RKind; m: string; r: number }, where: "all" | "top" = "all"): RBead {
    let best = { x: this.W / 2, y: this.H / 2 }, bestD = -1;
    for (let k = 0; k < 24; k++) {
      const x = p.r + this.rand() * (this.W - 2 * p.r);
      const y = where === "top" ? p.r + this.rand() * Math.min(this.H * 0.3, this.H - 2 * p.r) : p.r + this.rand() * (this.H - 2 * p.r);
      let d = Infinity;
      for (const o of this.beads) d = Math.min(d, Math.hypot(o.x - x, o.y - y) - o.r - p.r);
      if (d > bestD) { bestD = d; best = { x, y }; }
      if (d > 0.6) break;
    }
    return this.add({ ...p, ...best });
  }

  private remove(b: RBead) {
    for (const j of b.nb) { const o = this.byId.get(j); if (o) o.nb = o.nb.filter(x => x !== b.id); }
    this.beads = this.beads.filter(x => x !== b);
    this.byId.delete(b.id);
    const s = (this.molSize.get(b.mol) ?? 1) - 1;
    if (s > 0) this.molSize.set(b.mol, s); else this.molSize.delete(b.mol);
  }

  bead(id: number) { return this.byId.get(id); }

  // ── Bindungen und Moleküle ──

  private bond(a: RBead, b: RBead) {
    if (a.nb.includes(b.id)) return;
    a.nb.push(b.id); b.nb.push(a.id);
    if (a.mol !== b.mol) {
      // kleineres Molekül umbenennen
      const [keep, drop] = (this.molSize.get(a.mol) ?? 1) >= (this.molSize.get(b.mol) ?? 1) ? [a.mol, b.mol] : [b.mol, a.mol];
      let n = 0;
      for (const x of this.beads) if (x.mol === drop) { x.mol = keep; n++; }
      this.molSize.set(keep, (this.molSize.get(keep) ?? 0) + n);
      this.molSize.delete(drop);
    }
  }

  private unbond(a: RBead, b: RBead) {
    a.nb = a.nb.filter(x => x !== b.id); b.nb = b.nb.filter(x => x !== a.id);
    // getrennt? → Teil von b bekommt ein neues Molekül
    const seen = this.component(b);
    if (seen.has(a.id)) return;
    const mol = this.nextMol++;
    for (const id of seen) this.byId.get(id)!.mol = mol;
    this.molSize.set(mol, seen.size);
    this.molSize.set(a.mol, (this.molSize.get(a.mol) ?? seen.size) - seen.size);
  }

  /** alle Kügelchen, die mit b verbunden sind */
  component(b: RBead): Set<number> {
    const seen = new Set([b.id]), stack = [b.id];
    while (stack.length) {
      const x = this.byId.get(stack.pop()!)!;
      for (const j of x.nb) if (!seen.has(j)) { seen.add(j); stack.push(j); }
    }
    return seen;
  }

  // ── Aktionen ──

  actions(): Action[] {
    const out: Action[] = [];
    const k = this.kind;
    if (!this.started) {
      const label = k === "radikal" || k === "step" ? tr("Erwärmen", "Heat") : k === "koord" ? tr("Aktivieren", "Activate") : k === "kation" ? tr("Säure bilden", "Form acid") : tr("Starten", "Start");
      return [{ id: "start", kind: "start", label }];
    }
    for (const m of this.monos) out.push({ id: `add:${m}`, kind: "add", mono: m, label: `+ ${monoName(m)}` });
    // Methanol nur einmal zugeben (wirkt dann, bis alle Ketten beendet sind)
    if (k === "anion" && !this.beads.some(b => b.kind === "stop")) out.push({ id: "meoh", kind: "stop", label: tr("+ Methanol", "+ methanol") });
    if (k === "koord") out.push({ id: "h2", kind: "stop", label: "+ H₂" });
    return out;
  }

  run(id: string) {
    const k = this.kind;
    if (id === "start" && !this.started) {
      this.started = true;
      this.lastEvent = this.t;
      if (k === "radikal" || k === "step") this.heat = true;
      for (const b of this.beads) {
        if (k === "anion" && b.m === "buli") b.act = "an";
        if (k === "kation" && b.m === "bf3") { b.m = "h"; b.act = "kat"; b.r = 0.7; }
        if (k === "koord" && b.kind === "cat") b.act = "ti";
      }
      this.event = k === "radikal" ? EV.zerfall : k === "step" ? undefined : EV.start;
      if (k === "koord") this.poisonAll();
      return;
    }
    if (id.startsWith("add:")) {
      const m = id.slice(4);
      if (m === this.pendingB) { this.pendingB = null; if (this.started && this.sepSeq()) this.restart(); }
      const n = clamp(Math.round(this.area() * (this.kind === "step" ? 0.012 : 0.02)), 10, 40);
      const before = this.beads.length;
      this.spawn(m, n, "top");
      for (const b of this.beads.slice(before)) this.groups0 += b.fg?.length ?? 0;
      this.lastEvent = this.t;
      if (k === "koord" && compat(m as VinylId, "zn").fail === "poison" && !this.beads.some(b => b.kind === "cat" && !b.dead && b.nb.length)) this.poisonAll();
      return;
    }
    if (id === "meoh") {
      // fallen sichtbar von oben hinein; das Kennzeichen erscheint sofort
      for (let i = 0; i < 14; i++) this.place({ kind: "stop", m: "meoh", r: 0.7 }, "top");
      this.event = EV.methanolZu;
      this.lastEvent = this.t;
      return;
    }
    if (id === "h2") {
      let n = 0;
      for (const ti of this.beads.filter(b => b.kind === "cat" && !b.dead)) {
        const c = ti.nb.map(j => this.byId.get(j)!).find(x => x.kind === "mono");
        if (c) { this.unbond(ti, c); n++; c.vx += 0.3; }
      }
      this.released += n;
      this.event = EV.h2;
      this.lastEvent = this.t;
    }
  }

  /** nacheinander, Ketten nicht lebend: bis das zweite Monomer da ist, sind die Ketten des ersten längst beendet bzw. abgelöst;
   *  neue Ketten starten (Starter zerfällt weiter, H⁺ aus der Übertragung, frei gewordenes Titan) – mit dem zweiten und übrigem ersten Monomer */
  private restart() {
    const k = this.kind;
    for (const b of this.beads) {
      if (b.kind !== "mono" || !b.act || b.dead) continue;
      b.act = undefined;
      if (k === "kation") { const h = this.add({ kind: "init", m: "h", r: 0.7, x: b.x + 1.2, y: b.y }); h.act = "kat"; }
    }
    if (k === "radikal") {
      // der Starter zerfällt über Stunden: es ist immer noch welcher da
      const me = this.recipe.method ?? "dbpo";
      const left = this.beads.filter(b => b.kind === "init" && b.m === me).length;
      for (let i = left; i < 3; i++) this.place({ kind: "init", m: me, r: R_INIT }, "top");
    }
    if (k === "koord") {
      for (const ti of this.beads.filter(b => b.kind === "cat" && !b.dead)) {
        const c = ti.nb.map(j => this.byId.get(j)!).find(x => x.kind === "mono");
        if (c) { this.unbond(ti, c); this.released++; c.vx += 0.3; }
      }
    }
    this.why = this.polyWhy();
    this.fire(EV.neu);
  }

  /** Katalysator vergiftet, sobald ein Monomer mit O, N, Cl oder F im Gefäß ist: jedes freie Titan bindet eines (der Einbau ist viel langsamer) */
  private poisonAll() {
    const poison = this.beads.filter(b => b.kind === "mono" && !b.nb.length && !b.dead && compat(b.m as VinylId, "zn").fail === "poison");
    if (!poison.length) return;
    for (const ti of this.beads.filter(b => b.kind === "cat" && !b.dead)) {
      const n = poison.filter(p => !p.dead).sort((x, y) => Math.hypot(x.x - ti.x, x.y - ti.y) - Math.hypot(y.x - ti.x, y.y - ti.y))[0];
      if (!n) break;
      ti.dead = true; ti.act = undefined; n.dead = true;
      this.bond(ti, n);
    }
    this.why = this.polyWhy() ?? compat(poison[0].m as VinylId, "zn").why;
    this.fire(EV.vergiftet);
  }

  /** Begründung aus den Regeln (zwei Monomere: was entsteht und warum) */
  private polyWhy(): string | undefined {
    if (this.kind === "step") return undefined;
    return polymerise(this.monos as VinylId[], this.recipe.method ?? "dbpo", !!this.recipe.seq).why;
  }

  // ── Simulation ──

  /** ein Zeitschritt (1/30 s) */
  step() {
    this.t++;
    if (this.started) this.drift();
    this.move();
    for (let i = 0; i < 2; i++) this.constrain();
    if (this.started) {
      if (this.kind === "step") this.reactStep();
      else this.reactChain();
    }
  }

  /** mehrere Schritte ohne Zeichnen (Bewegung reduziert, Tests) */
  advance(n: number) { for (let i = 0; i < n; i++) this.step(); }

  private move() {
    const rnd = this.rand;
    const gone: RBead[] = [];
    for (const b of this.beads) {
      if (b.held) { b.vx = b.vy = 0; continue; }
      if (b.kind === "gas" || b.kind === "byp") {
        b.vx = b.vx * 0.9 + (rnd() - 0.5) * 0.08;
        b.vy = b.vy * 0.9 - (b.kind === "gas" ? 0.03 : 0.012);
        b.x += b.vx; b.y += b.vy;
        if (b.y < b.r + 0.2) gone.push(b);
        continue;
      }
      const size = this.molSize.get(b.mol) ?? 1;
      const mob = b.kind === "cat" ? 0.2 : size > 1 ? 0.6 + 0.4 / Math.sqrt(size) : 1;
      b.vx = b.vx * 0.86 + (rnd() - 0.5) * 0.17 * mob;
      b.vy = b.vy * 0.86 + (rnd() - 0.5) * 0.17 * mob;
      b.x += b.vx; b.y += b.vy;
    }
    for (const b of gone) this.remove(b);
  }

  /** Reaktionspartner in der Nähe kommen sich etwas schneller näher (sonst dauert es auf dem Bildschirm zu lange) */
  private drift() {
    const pull = (a: RBead, b: RBead, k: number) => {
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      if (!a.held) { a.vx += (dx / d) * k; a.vy += (dy / d) * k; }
    };
    if (this.kind === "step") {
      if (![...this.partners.values()].some(p => p.length)) return;
      for (const a of this.beads) {
        if (!a.fg?.length) continue;
        let best: RBead | null = null, bd = 144;
        for (const o of this.beads) {
          if (o === a || !o.fg?.length || o.mol === a.mol) continue;
          const d2 = (o.x - a.x) ** 2 + (o.y - a.y) ** 2;
          if (d2 >= bd || !this.match(a, o)) continue;
          bd = d2; best = o;
        }
        if (best) pull(a, best, 0.008);
      }
      return;
    }
    const me = this.recipe.method ?? "dbpo";
    for (const e of this.beads) {
      if (!e.act || e.dead) continue;
      for (const o of this.beads) {
        if (o.kind !== "mono" || o.nb.length || o.dead) continue;
        const d2 = (o.x - e.x) ** 2 + (o.y - e.y) ** 2;
        if (d2 > 36 || compat(o.m as VinylId, me).fit === "none") continue;
        pull(o, e, 0.014);
      }
    }
  }

  /** Bindungslänge, Streckung der Ketten, Abstoßung, Wände */
  private constrain() {
    const bs = this.beads;
    // Bindungen
    for (const a of bs) for (const j of a.nb) {
      if (j < a.id) continue;
      const b = this.byId.get(j)!;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6;
      const d0 = (a.r + b.r) * 1.08;
      const k = ((d - d0) / d) * 0.5 * 0.7;
      const wa = a.held ? 0 : b.held ? 2 : 1, wb = b.held ? 0 : a.held ? 2 : 1;
      a.x += dx * k * wa; a.y += dy * k * wa;
      b.x -= dx * k * wb; b.y -= dy * k * wb;
    }
    // Ketten leicht gestreckt: Nachbarn eines Bausteins mit genau zwei Bindungen auseinander
    for (const m of bs) {
      if (m.nb.length !== 2) continue;
      const a = this.byId.get(m.nb[0])!, c = this.byId.get(m.nb[1])!;
      const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy) || 1e-6;
      const want = (a.r + 2 * m.r + c.r) * 0.92;
      if (d >= want) continue;
      const k = ((want - d) / d) * 0.06;
      if (!a.held) { a.x -= dx * k; a.y -= dy * k; }
      if (!c.held) { c.x += dx * k; c.y += dy * k; }
    }
    // Abstoßung über ein Gitter
    const cell = 3.6, cols = Math.max(1, Math.ceil(this.W / cell)), rows = Math.max(1, Math.ceil(this.H / cell));
    const grid = new Map<number, RBead[]>();
    for (const b of bs) {
      // Bläschen steigen durch, ohne etwas anzuschieben
      if (b.kind === "gas" || b.kind === "byp") continue;
      const key = clamp(Math.floor(b.y / cell), 0, rows - 1) * cols + clamp(Math.floor(b.x / cell), 0, cols - 1);
      const g = grid.get(key); if (g) g.push(b); else grid.set(key, [b]);
    }
    for (const b of bs) {
      if (b.kind === "gas" || b.kind === "byp") continue;
      const cx = clamp(Math.floor(b.x / cell), 0, cols - 1), cy = clamp(Math.floor(b.y / cell), 0, rows - 1);
      for (let yy = cy - 1; yy <= cy + 1; yy++) for (let xx = cx - 1; xx <= cx + 1; xx++) {
        if (yy < 0 || xx < 0 || yy >= rows || xx >= cols) continue;
        for (const o of grid.get(yy * cols + xx) ?? []) {
          if (o.id <= b.id) continue;
          const dx = o.x - b.x, dy = o.y - b.y, min = b.r + o.r;
          if (Math.abs(dx) > min || Math.abs(dy) > min) continue;
          const d = Math.hypot(dx, dy) || 1e-6;
          if (d >= min) continue;
          const k = ((min - d) / d) * 0.5 * 0.8;
          const wb = b.held ? 0 : o.held ? 2 : 1, wo = o.held ? 0 : b.held ? 2 : 1;
          b.x -= dx * k * wb; b.y -= dy * k * wb;
          o.x += dx * k * wo; o.y += dy * k * wo;
        }
      }
    }
    // Wände (Bläschen dürfen oben hinaus)
    for (const b of bs) {
      if (b.held) continue;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); }
      if (b.x > this.W - b.r) { b.x = this.W - b.r; b.vx = -Math.abs(b.vx); }
      if (b.y > this.H - b.r) { b.y = this.H - b.r; b.vy = -Math.abs(b.vy); }
      if (b.y < b.r && b.kind !== "gas" && b.kind !== "byp") { b.y = b.r; b.vy = Math.abs(b.vy); }
    }
  }

  /** Nachbarn in Reichweite (Berührung) */
  private near(b: RBead, extra = 0.35): RBead[] {
    const out: RBead[] = [];
    for (const o of this.beads) {
      if (o === b) continue;
      const min = b.r + o.r + extra, dx = o.x - b.x, dy = o.y - b.y;
      if (Math.abs(dx) < min && Math.abs(dy) < min && dx * dx + dy * dy < min * min) out.push(o);
    }
    return out;
  }

  private fire(ev: string) { this.event = ev; this.lastEvent = this.t; }

  private reactChain() {
    const rnd = this.rand;
    if (this.kind === "anion" && this.monos.length > 1) {
      this.free.clear();
      for (const b of this.beads) if (b.kind === "mono" && !b.nb.length && !b.dead) this.free.set(b.m, (this.free.get(b.m) ?? 0) + 1);
    }
    // Starter zerfällt beim Erwärmen: zwei Radikale (Bruchstücke) + Gas
    if (this.heat && this.kind === "radikal") {
      for (const b of this.beads.filter(x => x.kind === "init" && (x.m === "dbpo" || x.m === "aibn"))) {
        if (rnd() >= KD) continue;
        const ang = rnd() * Math.PI * 2, dx = Math.cos(ang) * 1.3, dy = Math.sin(ang) * 1.3;
        const gas = GAS_OF[b.m];
        this.remove(b);
        for (const s of [-1, 1]) {
          const f = this.add({ kind: "init", m: "frag", r: 0.75, x: b.x + dx * s, y: b.y + dy * s });
          f.act = "rad"; f.vx = dx * s * 0.3; f.vy = dy * s * 0.3;
        }
        const nGas = b.m === "dbpo" ? 2 : 1;
        for (let i = 0; i < nGas; i++) this.add({ kind: "gas", m: gas, r: R_GAS, x: b.x + (i - 0.5) * 0.8, y: b.y - 0.6 });
        this.fire(EV.zerfall);
      }
    }
    for (const e of [...this.beads]) {
      if (!e.act || e.dead || !this.byId.has(e.id)) continue;
      for (const n of this.near(e, 0.55)) {
        if (!this.byId.has(n.id) || e.nb.includes(n.id)) continue;
        if (e.act === "ti") { if (this.tiContact(e, n)) break; continue; }
        if (n.kind === "mono" && !n.nb.length && !n.act && !n.dead) { if (this.tryAdd(e, n)) break; continue; }
        if (e.act === "rad" && n.act === "rad" && n.mol !== e.mol) {
          // vereinfacht: zwei Starter-Bruchstücke ohne Baustein reagieren nicht miteinander
          const grown = e.kind === "mono" || n.kind === "mono";
          if (grown && rnd() < KT) { this.terminate(e, n); break; }
          continue;
        }
        if (e.act === "an" && n.kind === "stop") { e.act = undefined; this.remove(n); this.fire(EV.methanol); break; }
      }
      // Methanol verteilt sich schnell: ohne Berührung nach kurzer Zeit
      if (e.act === "an" && this.beads.some(b => b.kind === "stop") && rnd() < 0.03) {
        e.act = undefined;
        const st = this.beads.find(b => b.kind === "stop");
        if (st) this.remove(st);
        this.fire(EV.methanol);
      }
    }
  }

  /** nacheinander zugegeben, Ketten nicht lebend: ein Kettenende baut nur sein eigenes Monomer ein (getrennte Polymere) */
  private sepSeq(): boolean {
    const r = this.recipe;
    return !!(r.seq && r.b && r.b !== r.a && seqKind(r.a as VinylId, r.b as VinylId, r.method ?? "dbpo") === "separate");
  }

  /** kann das Kettenende (Baustein end, sonst Starter bzw. leeres Titan) das Monomer m einbauen? */
  private canGrow(end: RBead | undefined, m: string): boolean {
    if (!end || end.kind !== "mono") return true;
    if (this.kind === "anion" && !anionStarts(end.m as VinylId, m as VinylId)) {
      if (!this.why) this.why = tr(`Das Kettenende aus ${monoName(end.m)} ist zu schwach, um ${monoName(m)} zu starten.`, `The chain end made of ${monoName(end.m).toLowerCase()} is too weak to start ${monoName(m).toLowerCase()}.`);
      return false;
    }
    return true;
  }

  /** Monomer an aktives Ende (Radikal, Anion, Kation) */
  private tryAdd(e: RBead, n: RBead): boolean {
    const rnd = this.rand;
    const c = compat(n.m as VinylId, this.recipe.method ?? "dbpo");
    if (c.fit !== "none" && !this.canGrow(e, n.m)) return false;
    if (c.fit === "none") {
      if (!this.why) this.why = this.polyWhy();
      if (c.fail === "side" && rnd() < KP * 0.6) {
        // Nebenreaktion: Starter bzw. Kettenende reagiert mit dem Monomer und ist danach verbraucht
        this.bond(e, n); e.act = undefined; n.dead = true;
        this.why = c.why; this.fire(EV.neben);
        return true;
      }
      if (!this.why) this.why = c.why;
      return false;
    }
    if (rnd() >= KP) return false;
    if (this.kind === "anion" && !this.recipe.seq && this.monos.length > 1) {
      // anionisch gleichzeitig: solange das schnellere Monomer da ist, lagert sich das andere kaum (MMA vor Styrol: gar nicht) an
      const other = this.monos.find(x => x !== n.m) as VinylId;
      if (compat(other, "buli").fit === "ok" && anionFirst(n.m as VinylId, other) === other && (this.free.get(other) ?? 0) > 0) {
        const same = anionStarts(n.m as VinylId, other) && anionStarts(other, n.m as VinylId);
        if (!same || rnd() >= 0.015) return false;
      }
    }
    this.bond(e, n);
    n.act = e.act; e.act = undefined;
    this.fire(EV.wachstum);
    if (c.fail === "allyl" && rnd() < 0.45) { n.act = undefined; this.why = c.why; this.fire(EV.allyl); }
    // anionisch, aber nicht lebend (Acrylnitril): Nebenreaktionen beenden die Kette nach und nach
    if (this.kind === "anion" && !c.living && rnd() < 0.05) { n.act = undefined; this.why = c.why; this.fire(EV.neben); }
    if (this.kind === "kation" && rnd() < (c.fit === "short" ? 0.35 : 0.035)) {
      // Kettenende gibt H⁺ ab (C=C am Ende) – das H⁺ startet eine neue Kette
      n.act = undefined;
      const h = this.add({ kind: "init", m: "h", r: 0.7, x: n.x + 1.2, y: n.y });
      h.act = "kat";
      if (c.fit === "short") this.why = c.why;
      this.fire(EV.uebertragung);
    }
    return true;
  }

  private terminate(a: RBead, b: RBead) {
    const m = [a, b].find(x => x.kind === "mono")?.m;
    const pComb = m === "styrol" ? 0.9 : m === "mma" ? 0.25 : m === "acrylnitril" ? 0.9 : 0.55;
    a.act = undefined; b.act = undefined;
    if (this.rand() < pComb) { this.bond(a, b); this.fire(EV.rekombination); }
    else this.fire(EV.disproportionierung);
  }

  /** Berührung am Titan: Einbau, Vergiftung oder nichts */
  private tiContact(ti: RBead, n: RBead): boolean {
    if (ti.dead || n.kind !== "mono" || n.nb.length || n.dead) return false;
    const c = compat(n.m as VinylId, "zn");
    if (c.fail === "poison") {
      if (this.rand() >= KPOISON) return false;
      ti.dead = true; ti.act = undefined; n.dead = true;
      this.bond(ti, n);
      this.why = c.why; this.fire(EV.vergiftet);
      return true;
    }
    if (c.fit !== "ok") { if (!this.why) this.why = this.polyWhy() ?? c.why; return false; }
    // Einbau zwischen Titan und Kette
    const c0 = ti.nb.map(j => this.byId.get(j)!).find(x => x.kind === "mono");
    if (!this.canGrow(c0, n.m)) return false;
    if (this.rand() >= KP * 1.3) return false;
    if (c0) { this.unbondKeep(ti, c0); this.bond(n, c0); }
    this.bond(ti, n);
    this.fire(EV.wachstum);
    return true;
  }

  /** Bindung lösen, ohne das Molekül zu teilen (gleich danach neu verbunden) */
  private unbondKeep(a: RBead, b: RBead) { a.nb = a.nb.filter(x => x !== b.id); b.nb = b.nb.filter(x => x !== a.id); }

  private reactStep() {
    const rnd = this.rand;
    for (const a of [...this.beads]) {
      if (a.kind !== "mono" || !a.fg?.length || !this.byId.has(a.id)) continue;
      for (const n of this.near(a, 0.6)) {
        if (n.kind !== "mono" || !n.fg?.length || n.id < a.id || n.mol === a.mol) continue;
        const m = this.match(a, n);
        if (!m || rnd() >= KS) continue;
        const pair = { x: m[0], y: m[1], byp: reactGroups(m[0], m[1])!.byp };
        this.bond(a, n);
        a.fg.splice(a.fg.indexOf(pair.x), 1);
        n.fg.splice(n.fg.indexOf(pair.y), 1);
        // Nebenprodukt; Methanal: ein Wasser je CH₂-Brücke (wenn beide Seiten verknüpft sind)
        const cho = a.m === "methanal" ? a : n.m === "methanal" ? n : null;
        if (pair.byp && (!cho || !cho.fg?.length)) {
          this.add({ kind: "byp", m: pair.byp === "HCl" ? "hcl" : "h2o", r: R_GAS, x: (a.x + n.x) / 2, y: (a.y + n.y) / 2 - 0.5 });
          this.bypCount++;
          const bn = pair.byp === "HCl" ? "HCl" : "H₂O";
          this.bypKinds.set(bn, (this.bypKinds.get(bn) ?? 0) + 1);
        }
        this.fire(EV.verknuepfung);
        break;
      }
    }
  }

  /** Molekül eines Kügelchens hervorheben (Ids) */
  molOf(id: number): number[] {
    const b = this.byId.get(id);
    if (!b) return [];
    return this.beads.filter(x => x.mol === b.mol).map(x => x.id);
  }

  /** Gefäßgröße ändern (Bühne gedreht/verändert): Lagen mitskalieren */
  resize(W: number, H: number) {
    if (Math.abs(W - this.W) < 0.01 && Math.abs(H - this.H) < 0.01) return;
    const sx = W / this.W, sy = H / this.H;
    for (const b of this.beads) { b.x *= sx; b.y *= sy; }
    this.W = W; this.H = H;
  }

  // ── Auswertung ──

  /** kann noch etwas reagieren? */
  private canReact(): boolean {
    if (!this.started) return true;
    const bs = this.beads;
    if (this.kind === "step") {
      // gibt es zwei Moleküle mit passenden freien Gruppen?
      const groups = new Map<FG, Set<number>>();
      for (const b of bs) for (const g of b.fg ?? []) { const s = groups.get(g) ?? new Set<number>(); s.add(b.mol); groups.set(g, s); }
      for (const [x, sx] of groups) for (const [y, sy] of groups) {
        if (!reactGroups(x, y)) continue;
        for (const m of sx) for (const k of sy) if (m !== k) return true;
      }
      return false;
    }
    const free = bs.some(b => b.kind === "mono" && !b.nb.length && !b.dead && compat(b.m as VinylId, this.recipe.method ?? "dbpo").fit !== "none");
    const active = bs.some(b => b.act && !b.dead);
    const initLeft = bs.some(b => b.kind === "init" && (b.m === "dbpo" || b.m === "aibn"));
    if (this.kind === "anion" && active && bs.some(b => b.kind === "stop")) return true;
    return free && (active || initLeft);
  }

  stats(): RStats {
    const bs = this.beads;
    const monos = bs.filter(b => b.kind === "mono");
    const byMol = new Map<number, number>();
    for (const b of monos) byMol.set(b.mol, (byMol.get(b.mol) ?? 0) + 1);
    const sizes = [...byMol.values()];
    const hist = [0, 0, 0, 0, 0, 0];
    for (const s of sizes) hist[s >= 32 ? 5 : s >= 16 ? 4 : s >= 8 ? 3 : s >= 4 ? 2 : s >= 2 ? 1 : 0]++;
    const step = this.kind === "step";
    let conv: number, chains: number, avg: number;
    if (step) {
      const free = monos.reduce((s, b) => s + (b.fg?.length ?? 0), 0);
      conv = this.groups0 ? 1 - free / this.groups0 : 0;
      chains = sizes.length;
      avg = chains ? monos.length / chains : 0;
    } else {
      // Kette = Molekül mit mindestens zwei Bausteinen oder Baustein am Starter/Katalysator
      const inChain = new Map<number, number>();
      for (const b of monos) {
        const size = byMol.get(b.mol) ?? 1;
        const attached = size > 1 || b.nb.length > 0;
        if (attached && !b.dead) inChain.set(b.mol, (inChain.get(b.mol) ?? 0) + 1);
      }
      const used = [...inChain.values()].reduce((s, x) => s + x, 0);
      conv = monos.length ? used / monos.length : 0;
      chains = inChain.size;
      avg = chains ? used / chains : 0;
    }
    const max = sizes.length ? Math.max(...sizes) : 0;
    // Netz nur, wo die Regeln eines vorhersagen (z. B. nicht bei Milchsäure + Glycerin: verzweigt, aber kein Netz)
    const network = step && this.netPossible && max >= monos.length * 0.4;
    const active = bs.filter(b => b.act && !b.dead).length;
    // lebend: nur Enden, die von selbst nicht abbrechen (anionisch, nicht Acrylnitril)
    const living = this.kind === "anion" && bs.some(b => b.act === "an" && !b.dead && (b.kind !== "mono" || !!compat(b.m as VinylId, this.recipe.method ?? "buli").living));
    const poisoned = bs.filter(b => b.kind === "cat" && b.dead).length;
    const can = this.canReact();
    let phase: RPhase = !this.started ? "bereit" : can ? "läuft" : "fertig";
    let why = this.why;
    if (this.started && !can && conv < 0.02) {
      phase = "aus";
      if (!why) why = step ? stepReact(this.recipe.a as StepId, this.recipe.b as StepId | undefined).why : this.firstFailWhy();
    }
    if (this.kind === "koord" && poisoned === bs.filter(b => b.kind === "cat").length) phase = "aus";
    // Stufenwachstum bei hohem Umsatz: mittlere Länge = 1/(1 − Umsatz) – lange Ketten erst, wenn fast jede Gruppe reagiert hat
    if (step && !why && conv >= 0.8 && !network) {
      const p = Math.round(conv * 100), n = Math.round(avg);
      why = stepReact(this.recipe.a as StepId, this.recipe.b as StepId | undefined).byp
        ? tr(`Bei ${p} %: im Mittel ${n} Bausteine. Für lange Ketten muss das Nebenprodukt weg – technisch unter Vakuum.`, `At ${p} %: about ${n} units on average. Long chains need the by-product removed – industrially under vacuum.`)
        : tr(`Bei ${p} %: im Mittel ${n} Bausteine. Für lange Ketten muss fast jede Gruppe reagieren.`, `At ${p} %: about ${n} units on average. Long chains need almost every group to react.`);
    }
    const ev = network ? EV.netz : phase === "aus" && !this.event ? EV.keine : this.event;
    return {
      phase, conv, chains, avg, max, active, living, network, poisoned,
      byp: this.bypCount, bypName: step ? (stepReact(this.recipe.a as StepId, this.recipe.b as StepId | undefined).byp === "HCl" ? "HCl" : "H₂O") : undefined,
      bypParts: [...this.bypKinds.entries()],
      released: this.released, event: ev, why, hist,
    };
  }

  private firstFailWhy(): string | undefined {
    for (const m of this.monos) { const c = compat(m as VinylId, this.recipe.method ?? "dbpo"); if (c.fit !== "ok") return c.why; }
    return undefined;
  }

  /** ruht: nichts mehr möglich bzw. seit 6 s keine Reaktion (Bewegung darf dann stehen bleiben) */
  idle(): boolean {
    if (this.beads.some(b => b.kind === "gas" || b.kind === "byp" || b.held)) return false;
    if (!this.started) return this.t > 180;
    return !this.canReact() ? this.t - this.lastEvent > 90 : this.t - this.lastEvent > 600;
  }
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
