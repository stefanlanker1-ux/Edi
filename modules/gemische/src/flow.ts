// Fließende Teilchenbewegung für „Probieren“ (getestet in flow.test.ts): Teilchen mit Ort und Geschwindigkeit statt Rasterzellen.
// Flüssigkeit – Geschwindigkeit ändert sich langsam und zufällig (Brownsche Bewegung, gleitend), Teilchen stoßen sich ab,
//   Öl erfährt Auftrieb, Wasser sinkt; Umrühren = Wirbel; Schütteln = kräftige Stöße. Kristallteilchen lösen sich am Rand,
//   wenn Flüssigkeit daneben ist. Gas über der Flüssigkeit löst sich beim Auftreffen auf die Oberfläche.
// Gas – Teilchen fliegen geradeaus, prallen an Wänden, Trennwänden und aneinander ab.
// Fest – Teilchen schwingen um ihren Gitterplatz; geschmolzen fließen sie, danach suchen sie sich wieder Gitterplätze.

import type { Example, State } from "./mixtures.ts";
import { rng } from "./mixing.ts";

export interface FP {
  id: number;
  f: string;
  x: number; y: number;
  vx: number; vy: number;
  /** Drehwinkel im Bild und seine Änderung */
  a: number; va: number;
  /** im Kristall bzw. Gitter (Platz hx, hy; im Zuckerkristall Spalte gi, Reihe gj von unten) */
  bound?: boolean;
  hx?: number; hy?: number;
  gi?: number; gj?: number;
  /** Stoßradius (Flüssigkeit: je nach Molekülgröße, sonst rc) */
  rad?: number;
  /** lange Moleküle (Öl): Stoßform ist ein Stab mit runden Enden – halbe Länge und Dicke (Radius) */
  len?: number; cap?: number;
  /** eben vom Kristall gelöst: noch so viele Schritte ohne Stoß mit dem Kristall (gleitet hinaus statt weggestoßen zu werden) */
  leave?: number;
  /** Gas über der Flüssigkeit */
  gas?: boolean;
  /** beim Schütteln gelöst: sinkt wie ein mitgerissenes Bläschen sanft bis zu dieser Tiefe (verteilt sich im ganzen Wasser) */
  sink?: number;
  /** ausgeperlt: steigt als Bläschen durch das Wasser bis an die Oberfläche */
  rise?: boolean;
}

export interface World {
  state: State;
  /** Breite und Höhe des Gefäßes */
  W: number; H: number;
  /** Flüssigkeit: Oberkante des Bereichs der Flüssigkeit (darüber Luft bzw. Gasraum) */
  top: number;
  /** Stoßradius der Teilchen */
  rc: number;
  ps: FP[];
  floats: string[];
  /** Trennwände (x) */
  walls: number[];
  /** Trennwand wird hochgezogen: unteres Ende (y); darunter können die Teilchen durch */
  wallEnd?: number;
  /** Schritt, an dem die Schmelze erstarrt ist (Übergang zum Gitter wird sanft) */
  frozeAt?: number;
  /** Zeitschritte, die noch umgerührt / geschüttelt / geschmolzen wird */
  stir: number; shake: number; melt: number;
  /** Temperatur in °C: je wärmer, desto schneller bewegen sich die Teilchen */
  temp: number;
  /** Stärke von Schütteln/Umrühren (0 … 1): steigt und fällt sanft, damit sich die Bewegung nie ruckartig ändert */
  agit: number;
  /** Sprudel: zuletzt gerechnete Temperatur und ob seitdem abgekühlt wurde (dann löst sich das Gas zügig) */
  lastTemp?: number; cooled?: boolean;
  /** vorher: noch nichts löst sich (Kristall, Gas warten) */
  hold: boolean;
  /** geschlossenes Gefäß */
  closed: boolean;
  /** geschlossene Flasche: welcher Stoff zwischen Gasraum und Wasser wechselt */
  closedGas?: string;
  /** im Gleichgewicht gelöste Gasteilchen, für die noch ein gelöstes ausperlt (Austausch ohne Änderung der Menge) */
  swap?: number;
  /** Flasche geöffnet: Gas entweicht nach oben, gelöstes CO₂ perlt aus (geschüttelt viel schneller) */
  opened?: boolean;
  /** nächste freie Teilchennummer (Kohlensäure zerfällt in CO₂ und ein neues Wassermolekül) */
  nextId?: number;
  /** Metallgitter: Plätze */
  sites: [number, number][];
  /** Lücke zwischen den Metallblöcken vorher */
  gap: number;
  /** Grenze Öl/Wasser (geglättet) */
  lineY?: number;
  /** Zeitschritt, in dem sich alles gelöst hat (Kristall weg, kein Gas mehr über der Flüssigkeit) */
  doneAt?: number;
  t: number;
  r: () => number;
}

type Spec = Pick<Example, "items" | "state" | "floats" | "before" | "solute">;

const LIQ_PHI = .42; // Flächenanteil der Stoßkreise in der Flüssigkeit (gezeichnet werden die Teilchen größer)
const LIQ_RC = 2.6, GAS_RC = 2.2, GAS_V = .7;
/** Stoßradius in der Flüssigkeit im Verhältnis zu Wasser: Zucker (Saccharose) ist ein großes Molekül, Ethanol etwas größer als Wasser */
const SIZE: Record<string, number> = { C12H22O11: 1.8, C2H5OH: 1.3, CO2: 1.15, H2CO3: 1.3 };
export const sizeOf = (f: string) => SIZE[f] ?? 1;
/** lange Moleküle (je rc): halbe Länge und Radius des Stabs – passend zur gezeichneten Kette (Dodecan) */
const LONG: Record<string, [number, number]> = { C12H26: [1.95, .5] };
/** gezeichneter Durchmesser in der Flüssigkeit je Stoßradius (Stoßkreise bedecken nur 42 %, gezeichnet dichter) */
export const DRAW = 2.6;
/** Gitterabstand im Kristall (waagrecht, senkrecht) je gezeichnetem Durchmesser: Saccharose liegt flach (breiter als hoch),
 *  so berühren sich die Moleküle in beiden Richtungen */
const CELL: Record<string, [number, number]> = { C12H22O11: [1, .7] };

const shuffle = <T,>(a: T[], r: () => number) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
};
const count = (items: [string, number][]) => items.reduce((s, [, n]) => s + n, 0);

/** Höhe der Flüssigkeit mit n Teilchen (alle so groß wie Wasser) */
export const liquidHeight = (n: number, W = 100) => (n * Math.PI * LIQ_RC * LIQ_RC) / LIQ_PHI / W;
/** Fläche, die Teilchen dieser Stoffe in der Flüssigkeit brauchen */
const liquidArea = (fs: string[]) => fs.reduce((a, f) => a + Math.PI * (LIQ_RC * sizeOf(f)) ** 2, 0) / LIQ_PHI;
/** Höhe des Flüssigkeitsbereichs der Welt */
export const liquidLevel = (w: World) => w.H - w.top;

/** Plätze in einer Fläche, von unten nach oben gefüllt (leicht versetzt wie in einer Flüssigkeit) */
function packed(n: number, W: number, y0: number, y1: number, rc: number, r: () => number): [number, number][] {
  const area = W * (y1 - y0), s = Math.sqrt(area / n);
  const cols = Math.max(1, Math.floor((W - 2 * rc) / s) + 1), dx = (W - 2 * rc) / Math.max(1, cols - 1);
  const rows = Math.ceil(n / cols), dy = Math.min(s, (y1 - y0 - 2 * rc) / Math.max(1, rows - 1));
  const out: [number, number][] = [];
  for (let k = 0; out.length < n; k++) {
    const row = Math.floor(k / cols), col = k % cols;
    const x = rc + col * dx + (row % 2 ? dx / 2 : 0) * .5 + (r() - .5) * .3 * dx;
    out.push([Math.min(W - rc, Math.max(rc, x)), y1 - rc - row * dy + (r() - .5) * .2 * dy]);
  }
  return out;
}

function particle(id: number, f: string, x: number, y: number, r: () => number, extra: Partial<FP> = {}): FP {
  return { id, f, x, y, vx: 0, vy: 0, a: r() * Math.PI * 2, va: 0, ...extra };
}

/** Anordnung vor dem Mischen (vorher) oder fertiges Gemisch (nachher) */
export function makeWorld(ex: Spec, seed = 1, phase: "nachher" | "vorher" = "nachher"): World {
  const r = rng(seed);
  const floats = ex.floats ?? [];
  const n = count(ex.items);
  const list = ex.items.flatMap(([f, k]) => Array.from({ length: k }, () => f));
  const vorher = phase === "vorher" ? ex.before : undefined;
  // Flüssigkeit: Gefäß etwas breiter als die Flüssigkeit hoch ist
  const W = ex.state === "fluessig" ? Math.round(Math.sqrt(liquidArea(list) / .8)) : 100;
  // Flüssigkeiten lösen und mischen sich auch von selbst (langsam); Gase und Metalle halten Trennwände bzw. das Gitter zusammen
  const base = { floats, walls: [] as number[], stir: 0, shake: 0, melt: 0, temp: 20, agit: 0, hold: !!vorher && ex.state !== "fluessig", closed: ex.before === "gasraum", closedGas: ex.before === "gasraum" ? ex.solute : undefined, sites: [] as [number, number][], gap: 0, t: 0, r };

  if (ex.state === "fluessig") {
    const head = ex.before === "gasraum" ? 26 : floats.length ? 14 : 8;
    const hl = liquidArea(list) / W, H = head + hl, rc = LIQ_RC;
    const w: World = { ...base, state: "fluessig", W, H, top: head, rc, ps: [] };
    const add = (p: FP) => {
      p.rad = rc * sizeOf(p.f);
      if (LONG[p.f]) { p.len = LONG[p.f][0] * rc; p.cap = LONG[p.f][1] * rc; }
      w.ps.push(p);
    };
    if (vorher === "gasraum" && ex.solute) {
      const others = shuffle(list.filter(f => f !== ex.solute), r);
      const spots = packed(others.length, W, H - liquidArea(others) / W, H, rc, r);
      others.forEach((f, i) => add(particle(i, f, spots[i][0], spots[i][1], r)));
      list.filter(f => f === ex.solute).forEach((f, i) => {
        const ang = r() * Math.PI * 2;
        // Platz suchen, an dem noch kein anderes Gasteilchen ist
        let x = 0, y = 0;
        for (let tries = 0; tries < 200; tries++) {
          x = rc + r() * (W - 2 * rc); y = rc + r() * (head - 2 * rc);
          if (w.ps.every(q => !q.gas || (q.x - x) ** 2 + (q.y - y) ** 2 > (2.2 * rc) ** 2)) break;
        }
        const g = particle(others.length + i, f, x, y, r, { gas: true, vx: Math.cos(ang) * GAS_V, vy: Math.sin(ang) * GAS_V });
        w.ps.push(g); g.rad = rc; // als Gas klein wie die anderen Gasteilchen, gelöst so groß wie das Molekül
      });
      return w;
    }
    if (vorher === "kristall" && ex.solute) {
      // Kristall: geordnet, dicht an dicht, alle Moleküle gleich ausgerichtet – unten in der Mitte, breiter als hoch
      const k = list.filter(f => f === ex.solute).length, rs = rc * sizeOf(ex.solute);
      const [cx, cy] = CELL[ex.solute] ?? [.9, .9], sx = DRAW * rs * cx, sy = DRAW * rs * cy;
      const cols = Math.ceil(Math.sqrt(k * 1.2)), rows = Math.ceil(k / cols);
      const x0 = W / 2 - (cols - 1) * sx / 2;
      for (let i = 0; i < k; i++) {
        const gi = i % cols, gj = Math.floor(i / cols), x = x0 + gi * sx, y = H - sy / 2 - gj * sy;
        add(particle(i, ex.solute, x, y, r, { bound: true, hx: x, hy: y, gi, gj, a: 0 }));
      }
      // Wasser rundherum: Plätze außerhalb des Kristalls
      const bx0 = x0 - sx / 2 - rc, bx1 = x0 + (cols - .5) * sx + rc, by0 = H - rows * sy - rc;
      const others = shuffle(list.filter(f => f !== ex.solute), r);
      let spots: [number, number][] = [];
      for (let extra = 0; spots.length < others.length && extra < 400; extra += 20)
        spots = packed(others.length + extra, W, head, H, rc, r).filter(([x, y]) => !(y > by0 && x > bx0 && x < bx1));
      others.forEach((f, i) => add(particle(k + i, f, spots[i][0], spots[i][1], r)));
      return w;
    }
    const spots = packed(n, W, head, H, rc, r); // von unten nach oben
    const up = (f: string) => (vorher === "schicht" ? f === ex.solute : floats.includes(f));
    const order = [...shuffle(list.filter(f => !up(f)), r), ...shuffle(list.filter(up), r)];
    order.forEach((f, i) => add(particle(i, f, spots[i][0], spots[i][1], r)));
    // Anfangslage vor dem ersten Bild zurechtrücken (lange Moleküle liegen kreuz und quer, große stoßen an): sonst würden sie auseinanderrutschen
    settle(w);
    return w;
  }

  if (ex.state === "fest") {
    const cols = Math.ceil(Math.sqrt(n * 1.25)), rows = Math.ceil(n / cols);
    const s = W / (cols + 1.5), rc = s / 2, H = rows * s + s;
    const w: World = { ...base, state: "fest", W, H, top: 0, rc, ps: [], gap: s };
    const sitesAt = (shiftFrom: number) => {
      const out: [number, number][] = [];
      for (let row = 0; row < rows; row++) for (let c = 0; c < cols; c++) {
        const shift = shiftFrom < cols && c >= shiftFrom ? s : 0;
        out.push([s * .75 + (c + .5) * s + shift - (shiftFrom < cols ? s / 2 : 0), H - s / 2 - (row + .5) * s]);
      }
      return out;
    };
    if (vorher === "getrennt") {
      // Blöcke nebeneinander, mit Lücke
      const k1 = ex.items[0][1], split = Math.round(cols * k1 / n);
      const sites = sitesAt(split);
      const left = sites.filter((_, i) => i % cols < split), right = sites.filter((_, i) => i % cols >= split);
      let id = 0;
      ex.items.forEach(([f, k], j) => (j === 0 ? left : right).slice(0, k).forEach(([x, y]) => w.ps.push(particle(id++, f, x, y, r, { bound: true, hx: x, hy: y }))));
      w.walls = [split];
      w.sites = sitesAt(cols);
      return w;
    }
    w.sites = sitesAt(cols);
    shuffle(list, r).forEach((f, i) => { const [x, y] = w.sites[i]; w.ps.push(particle(i, f, x, y, r, { bound: true, hx: x, hy: y })); });
    return w;
  }

  // Gas und Modell: Teilchen verteilt, fliegen mit gleicher Geschwindigkeit in zufällige Richtungen
  const H = 100, rc = GAS_RC;
  const w: World = { ...base, state: ex.state, W, H, top: 0, rc, ps: [] };
  let bands: [number, number][] = [[0, W]];
  if (vorher === "getrennt") {
    let x = 0;
    bands = ex.items.map(([, k]) => { const b: [number, number] = [x, x + W * k / n]; x += W * k / n; return b; });
    w.walls = bands.slice(1).map(([a]) => a);
  }
  const items = vorher === "getrennt" ? ex.items.map(([f, k], i) => ({ f, k, band: bands[i] })) : [{ f: "", k: n, band: bands[0] }];
  const order = shuffle(list, r);
  let id = 0;
  for (const it of items) {
    const [a, b] = it.band;
    for (let i = 0; i < it.k; i++) {
      let x = 0, y = 0;
      for (let tries = 0; tries < 200; tries++) {
        x = a + rc + r() * (b - a - 2 * rc); y = rc + r() * (H - 2 * rc);
        if (w.ps.every(p => (p.x - x) ** 2 + (p.y - y) ** 2 > (2.2 * rc) ** 2)) break;
      }
      const ang = r() * Math.PI * 2;
      w.ps.push(particle(id, it.f || order[id], x, y, r, { vx: Math.cos(ang) * GAS_V, vy: Math.sin(ang) * GAS_V }));
      id++;
    }
  }
  return w;
}

/** Metallschmelze: Wärmebewegung (Stoßstärke, Dämpfung), langsame Wärmeströmung, Druck (gleich dicht, keine Lücken) */
const JIG = .9, DAMP = .95, CONV = .9, PRESS = 1;
/** Schmelzen und wieder Erstarren (Metall): 10 s */
export const MELT = 600;
/** Umrühren (Flüssigkeit): 3 s */
export const STIR = 180;
/** Hauptvorgang des Beispiels: Trennwände weg (Gase), Metall schmilzt, Flüssigkeit wird umgerührt */
export function startMixing(w: World) {
  w.hold = false;
  if (w.state === "fest") { w.walls = []; w.melt = MELT; for (const p of w.ps) p.bound = false; return; }
  // Gase: Trennwand wird in etwa einer Sekunde hochgezogen (sichtbar), die Gase strömen unten durch
  if (w.state !== "fluessig" && w.walls.length) { w.wallEnd = w.H; return; }
  w.walls = [];
  if (w.state === "fluessig") w.stir = STIR;
}
/** Schütteln (Flüssigkeit): kräftige Stöße, danach Ruhe */
export const SHAKE = 180; // Schütteln dauert 3 s und ist gemächlich (gut zu verfolgen)
/** Öl und Wasser länger (5 s): so wird das Öl ganz fein verteilt, bevor es sich wieder sammelt */
export function shakeWorld(w: World) { w.shake = w.state === "fluessig" && w.floats.length ? Math.round(SHAKE * 5 / 3) : SHAKE; }
/** Sprudelflasche öffnen: Deckel weg, Gleichgewicht mit der Luft (dort fast kein CO₂) – das Gas entweicht */
export function openBottle(w: World) { if (!w.closedGas) return; w.closed = false; w.opened = true; w.doneAt = undefined; w.swap = 0; }
/** Kohlensäure: im Modell reagiert etwa jedes sechste gelöste CO₂-Molekül mit Wasser (echt nur etwa 0,2 %) */
export const ACID = "H2CO3";
/**
 * Faktor der Teilchengeschwindigkeit bei der eingestellten Temperatur, bezogen auf 20 °C.
 * Echt wäre √(T in K): von 0 °C bis 100 °C nur + 17 % – das sieht man nicht. Im Modell deutlich verstärkt:
 * 0 °C halb so schnell, 100 °C dreimal so schnell wie bei 20 °C (Richtung stimmt, Ausmaß ist übertrieben).
 */
export const heat = (w: World) => .5 + .025 * Math.max(0, w.temp);

/**
 * Sprudel (geschlossene Flasche): Anteil des CO₂, der im Gleichgewicht im Gasraum bleibt. Gase lösen sich in kaltem Wasser besser:
 * 0 °C 5 %, 20 °C 21 %, 50 °C 45 %, 100 °C 85 % (Richtung wie in echt, im Modell verstärkt, damit man den Unterschied sieht).
 */
export const gasShare = (temp: number) => .05 + .8 * Math.min(1, Math.max(0, temp) / 100);
/** Zahl der CO₂-Teilchen, die im Gleichgewicht im Gasraum sind */
export function gasTarget(w: World): number {
  if (!w.closed) return 0;
  const k = w.ps.filter(p => p.f === w.closedGas).length;
  return Math.round(k * gasShare(w.temp));
}
/** Gleichgewicht erreicht: im Gasraum etwa so viel CO₂ wie bei dieser Temperatur (± 1) */
export function atEquilibrium(w: World): boolean {
  return !w.closed || Math.abs(w.ps.filter(p => p.gas).length - gasTarget(w)) <= 1;
}

/** Anteil des Öls unter den obersten Teilchen (so viele, wie es Öl-Teilchen gibt): 1 = alles Öl ganz oben */
export function oilOnTop(w: World): number {
  const liquid = w.ps.filter(p => !p.gas), k = liquid.filter(p => w.floats.includes(p.f)).length;
  if (!k) return 1;
  return [...liquid].sort((a, b) => a.y - b.y).slice(0, k).filter(p => w.floats.includes(p.f)).length / k;
}
/** Grenze zwischen Öl und Wasser: zwischen den obersten k Teilchen und dem Rest (geglättet, damit die Linie ruhig bleibt) */
export function boundaryY(w: World): number {
  return w.lineY ?? rawBoundary(w);
}
function rawBoundary(w: World): number {
  const liquid = w.ps.filter(p => !p.gas), k = liquid.filter(p => w.floats.includes(p.f)).length;
  const ys = liquid.map(p => p.y).sort((a, b) => a - b);
  return k > 0 && k < ys.length ? (ys[k - 1] + ys[k]) / 2 : w.H;
}
export const separatedFlow = (w: World) => !w.floats.length || oilOnTop(w) >= .9;

/** Vorgang abgeschlossen: nichts mehr im Kristall oder Gasraum, nichts wird mehr umgerührt, Metall erstarrt, Öl oben */
export function settledFlow(w: World): boolean {
  if (w.state === "fest") return w.melt <= 0 && !w.walls.length;
  if (w.walls.length || w.hold || w.stir > 0 || w.shake > 0) return false;
  if (w.ps.some(p => p.bound) || (w.opened ? w.ps.some(p => p.f === w.closedGas || p.f === ACID) : w.closed ? !atEquilibrium(w) : w.ps.some(p => p.gas))) return false;
  return separatedFlow(w);
}

/** Nachbarn in der Nähe (Raster zum schnellen Suchen) */
function grid(ps: FP[], size: number) {
  const m = new Map<number, FP[]>();
  for (const p of ps) {
    const k = Math.floor(p.x / size) + Math.floor(p.y / size) * 1000;
    let c = m.get(k);
    if (!c) m.set(k, c = []);
    c.push(p);
  }
  return (p: FP, fn: (q: FP) => void) => {
    const cx = Math.floor(p.x / size), cy = Math.floor(p.y / size);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const c = m.get(cx + dx + (cy + dy) * 1000);
      if (c) for (const q of c) if (q !== p) fn(q);
    }
  };
}

/** Ein Zeitschritt (etwa 1/60 s) */
export function stepFlow(w: World) {
  const { r, rc, W, H } = w;
  w.t++;
  const turn = (p: FP, k: number) => { p.va = p.va * .96 + (r() - .5) * k; p.a += p.va; };

  if (w.state === "fest") {
    const melting = w.melt > 0;
    for (const p of w.ps) {
      if (melting) {
        // geschmolzen: jedes Atom bewegt sich ungeordnet (Wärmebewegung) und gleitet an den Nachbarn vorbei – keine gemeinsame
        // Strömung, die Gruppen von Atomen verschiebt. So vermischen sich Kupfer und Zink gleichmäßig nach und nach (Diffusion).
        // Gegen Ende (Erstarren) wird die Bewegung ruhiger – kein abrupter Übergang zum Gitter.
        const jig = JIG * Math.min(1, .25 + w.melt / 80);
        // dazu eine langsame, gleichmäßige Wärmeströmung (warme Schmelze steigt auf, kühlere sinkt) – ohne Stöße
        const X = Math.PI * p.x / W, Y = Math.PI * p.y / H, s1 = (1 + Math.sin(w.t / 90)) / 2;
        const u = CONV * (s1 * Math.sin(X) * Math.cos(Y) + (1 - s1) * Math.sin(2 * X) * Math.cos(Y));
        const v0 = -CONV * H / W * (s1 * Math.cos(X) * Math.sin(Y) + (1 - s1) * 2 * Math.cos(2 * X) * Math.sin(Y));
        const calm = Math.min(1, w.melt / 60, (MELT - w.melt) / 60);
        p.vx = p.vx * DAMP + (r() - .5) * jig + (u - p.vx) * .04 * calm;
        p.vy = p.vy * DAMP + (r() - .5) * jig + (v0 - p.vy) * .04 * calm;
        // ruhig gleiten: höchstens ein knapper halber Radius je Schritt
        const v = Math.hypot(p.vx, p.vy), vmax = .4 * rc;
        if (v > vmax) { p.vx *= vmax / v; p.vy *= vmax / v; }
      } else {
        // am Gitterplatz schwingen (bzw. dorthin gleiten)
        // gleich nach dem Erstarren erst sanft gebremst (wie eben noch in der Schmelze), dann wie im Gitter
        const h = heat(w), e = w.frozeAt === undefined ? 1 : Math.min(1, (w.t - w.frozeAt) / 60);
        const damp = .93 - .13 * e, pull = .02 + .04 * e;
        p.vx = p.vx * damp + ((p.hx ?? p.x) - p.x) * pull + (r() - .5) * .06 * h;
        p.vy = p.vy * damp + ((p.hy ?? p.y) - p.y) * pull + (r() - .5) * .06 * h;
        // nach dem Erstarren gleiten die Atome ruhig auf ihre Plätze (nicht schneller als ein Viertel Radius je Schritt)
        const v = Math.hypot(p.vx, p.vy), vmax = .25 * rc;
        if (v > vmax) { p.vx *= vmax / v; p.vy *= vmax / v; }
      }
      p.x += p.vx; p.y += p.vy;
      turn(p, melting ? .02 : .002);
    }
    if (melting) {
      // Druck: gleichmäßig dicht (keine Löcher in der Schmelze)
      const R = Math.sqrt(W * H / w.ps.length), near = grid(w.ps, R);
      for (const p of w.ps) near(p, q => {
        if (q.id < p.id) return;
        const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
        if (d >= R || d === 0) return;
        const f = PRESS * (R - d) / R, nx = dx / d * f, ny = dy / d * f;
        p.vx -= nx; p.vy -= ny; q.vx += nx; q.vy += ny;
      });
      separate(w, w.ps, 2);
      clamp(w, w.ps, rc, W - rc, rc, H - rc);
      if (--w.melt === 0) {
        w.frozeAt = w.t;
        // erstarrt: Gitterplätze nach kürzesten Wegen verteilen (erst die nächsten Paare aus Atom und Platz) – so wandert keiner weit
        const pairs: [number, number, number][] = [];
        w.ps.forEach((p, a) => w.sites.forEach(([x, y], i) => pairs.push([(x - p.x) ** 2 + (y - p.y) ** 2, a, i])));
        pairs.sort((u, v) => u[0] - v[0]);
        const doneA = new Set<number>(), doneS = new Set<number>();
        for (const [, a, i] of pairs) {
          if (doneA.has(a) || doneS.has(i)) continue;
          doneA.add(a); doneS.add(i);
          const p = w.ps[a]; p.hx = w.sites[i][0]; p.hy = w.sites[i][1]; p.bound = true;
        }
      }
    }
    return;
  }

  if (w.state !== "fluessig") {
    // Gas: geradeaus fliegen, an Wänden und Trennwänden abprallen, aneinander abprallen
    for (const p of w.ps) {
      const ox = p.x;
      veer(p, r);
      p.x += p.vx; p.y += p.vy;
      if (p.x < rc) { p.x = 2 * rc - p.x; p.vx = Math.abs(p.vx); }
      if (p.x > W - rc) { p.x = 2 * (W - rc) - p.x; p.vx = -Math.abs(p.vx); }
      if (p.y < rc) { p.y = 2 * rc - p.y; p.vy = Math.abs(p.vy); }
      if (p.y > H - rc) { p.y = 2 * (H - rc) - p.y; p.vy = -Math.abs(p.vy); }
      const end = w.wallEnd ?? H;
      if (p.y - rc < end) for (const x of w.walls) {
        if (ox < x && p.x > x - rc) { p.x = x - rc; p.vx = -Math.abs(p.vx); }
        else if (ox > x && p.x < x + rc) { p.x = x + rc; p.vx = Math.abs(p.vx); }
      }
      turn(p, .004);
    }
    if (w.wallEnd !== undefined) {
      w.wallEnd -= H / 50;
      if (w.wallEnd <= 0) { w.walls = []; w.wallEnd = undefined; }
    }
    collide(w, w.ps);
    // Geschwindigkeit passt sich langsam der Temperatur an
    for (const p of w.ps) toSpeed(p, GAS_V * heat(w));
    if (w.shake > 0) {
      // geschüttelt: neue Richtungen
      if (w.shake-- === SHAKE) for (const p of w.ps) { const ang = r() * Math.PI * 2, v = Math.hypot(p.vx, p.vy) || GAS_V; p.vx = Math.cos(ang) * v; p.vy = Math.sin(ang) * v; }
    }
    return;
  }

  // ── Flüssigkeit ──
  // Schütteln/Umrühren setzt sanft ein und klingt sanft aus
  const target = w.shake > 0 || w.stir > 0 ? Math.min(1, Math.max(w.shake, w.stir) / 40) : 0;
  w.agit += (target - w.agit) * .06;
  const hf = heat(w);
  const liquid = w.ps.filter(p => !p.gas);
  // geschlossene Flasche: Gas löst sich, gelöstes perlt aus – beides, bis das Gleichgewicht der Temperatur erreicht ist
  const nGas = w.closed ? w.ps.filter(p => p.gas).length : 0, eqGas = gasTarget(w);
  const inFactor = w.opened ? .05 : !w.closed || nGas > eqGas ? 1 : .12;
  if (w.closed) {
    if (w.lastTemp !== undefined && w.temp < w.lastTemp) w.cooled = true;
    if (nGas <= eqGas + 1) w.cooled = false;
    w.lastTemp = w.temp;
  }
  const rad = (p: FP) => p.rad ?? rc;
  // Umrühren reicht bis zum Boden bzw. bis zur Oberkante des Kristalls (sonst staut sich das Wasser am Kristall)
  let floor = H;
  for (const p of liquid) if (p.bound) floor = Math.min(floor, p.y - rad(p));
  const hl = floor - w.top;
  const line = w.floats.length ? rawBoundary(w) : 0;
  for (const p of w.ps) {
    if (p.gas) {
      // ausgeperlt: steigt als Bläschen durch das Wasser in den Gasraum (geschüttelt schneller)
      if (p.rise) {
        if (p.y > w.top - rc) { p.y = Math.max(w.top - rc, p.y - .6 - .8 * w.agit); p.x = Math.min(W - rc, Math.max(rc, p.x + p.vx)); turn(p, .004); continue; }
        p.rise = false;
      }
      // Gas über der Flüssigkeit fliegt; trifft es auf die Oberfläche, löst es sich manchmal (geschüttelt: fast immer) –
      // in der geschlossenen Flasche nur selten, wenn schon so viel gelöst ist wie im Gleichgewicht
      veer(p, r);
      toSpeed(p, GAS_V * hf);
      // geschüttelt: Gasraum und Wasser werden durchgewirbelt – das Gas wird zur Oberfläche gerissen
      if (w.shake > 0 && !w.opened) p.vy += .06 * w.agit;
      p.x += p.vx; p.y += p.vy;
      if (p.x < rc || p.x > W - rc) { p.vx = -p.vx; p.x = Math.min(W - rc, Math.max(rc, p.x)); }
      // offene Flasche: oben hinaus (wird unten entfernt), sonst prallt das Gas am Deckel ab
      if (p.y < rc && !w.opened) { p.vy = Math.abs(p.vy); p.y = rc; }
      if (p.y > w.top - rc) {
        // eben abgekühlt (weit über dem Gleichgewicht): das Gas löst sich zügig, auch ohne Schütteln
        if (r() < (.025 * hf + .6 * w.agit + (w.cooled ? .35 : 0)) * inFactor) {
          if (w.closed && inFactor < 1) w.swap = (w.swap ?? 0) + 1; p.gas = false; p.rad = rc * sizeOf(p.f); p.vx *= .3; p.vy = inFactor === 1 ? .8 + 2 * w.agit : .4; p.leave = 30; if (w.shake > 0 && w.agit > .2 && inFactor === 1) p.sink = w.top + .7 * r() * hl; } // geschüttelt: wie ein Bläschen tief hineingerissen
        else { p.vy = -Math.abs(p.vy); p.y = w.top - rc; }
      }
      turn(p, .004);
      continue;
    }
    if (p.leave) p.leave--;
    if (p.bound) {
      // im Kristall: schwingt nur ein wenig um seinen Platz, Ausrichtung bleibt (geordnet)
      p.vx = p.vx * .8 + ((p.hx ?? p.x) - p.x) * .08 + (r() - .5) * .025 * hf;
      p.vy = p.vy * .8 + ((p.hy ?? p.y) - p.y) * .08 + (r() - .5) * .025 * hf;
      p.x += p.vx; p.y += p.vy;
      continue;
    }
    // Wärmebewegung (mit der Temperatur) plus Schütteln/Umrühren; Geschwindigkeit ändert sich nur allmählich (fließend).
    // Große Moleküle (Zucker) bewegen sich langsamer.
    // Öl wird beim Schütteln stärker herumgeworfen (sonst wandern die langen Moleküle nur als Klumpen mit)
    const kick = (.29 * hf + (w.shake > 0 ? (w.floats.includes(p.f) ? 2.2 : 1) : 1.35) * w.agit) / Math.sqrt(sizeOf(p.f));
    p.vx = p.vx * .96 + (r() - .5) * kick * 0.76;
    // Auftrieb nur für Teilchen auf der falschen Seite der Grenze: Öl darunter steigt, Wasser darüber sinkt
    // (in der eigenen Schicht wirkt nichts – so wird nichts zusammengedrückt)
    const buoy = !w.floats.length || w.agit > .3 ? 0 : w.floats.includes(p.f) ? (p.y > line - rc ? -.09 : 0) : (p.y < line + rc ? .09 : 0);
    p.vy = p.vy * .96 + (r() - .5) * kick * 0.76 + buoy;
    if (p.sink !== undefined) { if (p.y < p.sink) { if (p.vy < .25) p.vy += .04; } else p.sink = undefined; }
    if (w.agit > .01 && p.y < floor) {
      // Umrühren (und Schütteln): Strömung, die überall gleich dicht bleibt und nie gegen die Wand drückt (Stromfunktion
      // ψ = sin(πx) · sin(πy) bzw. zwei Walzen sin(2πx) · sin(πy)); beide wechseln fließend ab – so wird durchmischt, nicht nur gedreht
      const X = Math.PI * p.x / W, Y = Math.PI * (p.y - w.top) / hl, s1 = (1 + Math.sin(w.t / 25)) / 2;
      const amp = 1.1 * (w.shake > 0 ? .8 : 1);
      const u = amp * (s1 * Math.sin(X) + (1 - s1) * Math.sin(2 * X)) * Math.cos(Y);
      const v = -amp * hl / W * (s1 * Math.cos(X) + (1 - s1) * 2 * Math.cos(2 * X)) * Math.sin(Y);
      const k = .12 * w.agit;
      let eu = 0, ev = 0;
      if (w.shake > 0) {
        // Schütteln: zusätzlich kleine Wirbel, die ständig wandern (ψ = sin(3πx + a) · sin(3πy + b)) – zieht Schichten in feine Fäden und Tröpfchen
        const a = w.t / 9 + 2 * Math.sin(w.t / 37), b = w.t / 13 - 2 * Math.sin(w.t / 29), X3 = 3 * X + a, Y3 = 3 * Y + b;
        eu = 2 * Math.sin(X3) * Math.cos(Y3);
        ev = -2 * hl / W * Math.cos(X3) * Math.sin(Y3);
      }
      p.vx += (u + eu - p.vx) * k; p.vy += (v + ev - p.vy) * k;
    }
    // nie schneller als etwa ein halber Durchmesser je Schritt (auch beim Rühren gleiten die Teilchen)
    const v = Math.hypot(p.vx, p.vy);
    if (v > 1.3) { p.vx *= 1.3 / v; p.vy *= 1.3 / v; }
    p.x += p.vx; p.y += p.vy;
    turn(p, .01 / sizeOf(p.f));
  }
  // Druck: Nachbarn näher als der mittlere Abstand stoßen sich sanft ab – die Flüssigkeit bleibt überall gleich dicht
  {
    // mittlerer Abstand zweier Nachbarn: aus der Fläche, die jedes Teilchen in der Flüssigkeit braucht
    const reach = (p: FP) => rad(p) * Math.sqrt(Math.PI / LIQ_PHI);
    const maxRad = Math.max(...liquid.map(rad));
    // Öl: Ölmoleküle ziehen sich schwach an, Wasser und Öl stoßen sich etwas stärker ab (wasserabweisend) –
    // so bilden sich beim Schütteln Tröpfchen (Emulsion), die sich danach zusammenschließen und aufsteigen
    const oily = w.floats.length > 0, isOil = (p: FP) => w.floats.includes(p.f);
    // geschüttelt: Anziehung und Abstoßung fast weg – das Öl wird fein verteilt (keine Klumpen), erst danach finden sich Tröpfchen
    const calm = (1 - w.agit) ** 2, pull = .15 * calm;
    const near = grid(liquid, maxRad * Math.sqrt(Math.PI / LIQ_PHI) * (oily ? 1.5 : 1));
    for (const p of liquid) near(p, q => {
      if (q.id < p.id) return;
      let Rm = (reach(p) + reach(q)) / 2;
      const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
      if (d === 0) return;
      if (oily) {
        const po = isOil(p), qo = isOil(q);
        if (po !== qo) Rm *= 1 + .15 * calm;
        else if (po) {
          // Anziehung zwischen den Oberflächen der Stäbe (nicht der Mittelpunkte) – so ziehen sie sich nicht ineinander
          const sp = shape(w, p), sq = shape(w, q), [ax, ay, bx, by] = closest(sp, sq);
          const gx = bx - ax, gy = by - ay, g = Math.hypot(gx, gy), gap = g - sp[4] - sq[4], span = sp[4] + sq[4];
          if (g < 1e-6) return;
          // zu nah: sanft abstoßen (Druck), etwas weiter weg: anziehen
          const f = gap < .25 * span ? -.4 * (.25 * span - gap) / span
            : gap < span ? pull * (1 - Math.abs(gap - .6 * span) / (.4 * span)) : 0;
          if (f) { const nx = gx / g * f, ny = gy / g * f; p.vx += nx; p.vy += ny; q.vx -= nx; q.vy -= ny; }
          // berühren sich: aufeinander zu gerichtete Geschwindigkeit fällt weg (kein Hineinschieben im nächsten Schritt)
          if (gap < 0) {
            const ux = gx / g, uy = gy / g, vn = (q.vx - p.vx) * ux + (q.vy - p.vy) * uy;
            if (vn < 0) { p.vx += ux * vn / 2; p.vy += uy * vn / 2; q.vx -= ux * vn / 2; q.vy -= uy * vn / 2; }
          }
        }
      }
      if (d >= Rm) return;
      const f = .4 * (Rm - d) / Rm, nx = dx / d * f, ny = dy / d * f;
      if (!p.bound) { p.vx -= nx; p.vy -= ny; }
      if (!q.bound) { q.vx += nx; q.vy += ny; }
    });
  }
  // Kristall löst sich von außen: Moleküle mit freien Seiten lösen sich, Ecken (zwei freie Seiten) zuerst.
  // Schneller bei Wärme und beim Umrühren (frisches Wasser kommt an den Kristall).
  const crystal = liquid.filter(p => p.bound && p.gi !== undefined);
  if (crystal.length) {
    const at = new Set(crystal.map(p => `${p.gi},${p.gj}`));
    const rate = .0009 * hf ** 1.5 * (1 + 3 * w.agit);
    for (const p of crystal) {
      const i = p.gi!, j = p.gj!;
      const open: [number, number][] = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][])
        .filter(([di, dj]) => !(j + dj < 0) && !at.has(`${i + di},${j + dj}`));
      if (!open.length || r() >= rate * open.length * open.length) continue;
      p.bound = false; p.gi = p.gj = undefined; p.leave = 45;
      // löst sich nach außen weg
      const ox = open.reduce((a, [di]) => a + di, 0), oy = -open.reduce((a, [, dj]) => a + dj, 0), l = Math.hypot(ox, oy) || 1;
      p.vx = ox / l * .35; p.vy = oy / l * .35;
      at.delete(`${i},${j}`);
    }
  }
  // Gas über der Flüssigkeit: Teilchen prallen aneinander ab (wie im Gasbehälter)
  const gas = w.ps.filter(p => p.gas);
  if (gas.length > 1) collide(w, gas);
  separate(w, liquid, w.floats.length ? 6 : 3);
  clamp(w, liquid, rc, W - rc, w.top + rc, H - rc);
  // Ausperlen: gelöstes CO₂ nahe der Oberfläche geht in den Gasraum (warm häufiger, geschüttelt schneller);
  // offene Flasche: es perlt ständig aus, geschüttelt bilden sich Bläschen im ganzen Wasser
  if (w.closedGas) {
    const swap = w.closed && nGas >= eqGas && (w.swap ?? 0) > 0;
    // weit unter dem Gleichgewicht (z. B. eben erwärmt): Bläschen bilden sich auch tiefer im Wasser – es perlt sichtbar aus
    const depth = w.opened ? 4 + 30 * w.agit : w.closed && nGas < eqGas - 2 ? 2 + 2 * Math.min(4, eqGas - nGas) : 2;
    const near = liquid.filter(p => p.f === w.closedGas && !p.leave && !p.bound && p.y < w.top + depth * rc);
    const want = w.opened || nGas < eqGas || swap;
    const tries = w.opened ? 1 + Math.round(w.agit) : 1;
    for (let t = 0; t < tries && near.length && want; t++) {
      if (r() >= (swap ? .05 * hf : w.opened ? .04 * hf + .08 * w.agit : .03 * hf + .4 * w.agit)) continue;
      const p = near.splice(Math.floor(r() * near.length), 1)[0];
      p.gas = true; p.rad = rc; p.vx *= .3; p.vy = -.6; p.rise = true; p.sink = undefined;
      if (swap) w.swap!--;
    }
    if (nGas < eqGas - 1) w.swap = 0;
    // Kohlensäure: CO₂ + H₂O ⇌ H₂CO₃ (ein Wassermolekül in der Nähe wird verbraucht bzw. wieder frei)
    const co2 = liquid.filter(p => p.f === w.closedGas && !p.leave && !p.gas);
    const acid = liquid.filter(p => p.f === ACID);
    const gone = new Set<FP>();
    for (const p of co2) {
      if (r() >= .002 * hf) continue;
      const q = liquid.find(q => q.f === "H2O" && !gone.has(q) && Math.hypot(q.x - p.x, q.y - p.y) < 2.6 * rc);
      if (!q) continue;
      gone.add(q); p.f = ACID; p.rad = rc * sizeOf(ACID); p.leave = 20;
    }
    for (const p of acid) {
      if (r() >= .01 * hf) continue;
      p.f = w.closedGas; p.rad = rc * sizeOf(w.closedGas); p.leave = 20;
      const ang = r() * Math.PI * 2, d = 2.2 * rc;
      const x = Math.min(W - rc, Math.max(rc, p.x + Math.cos(ang) * d)), y = Math.min(H - rc, Math.max(w.top + rc, p.y + Math.sin(ang) * d));
      w.nextId ??= Math.max(...w.ps.map(q => q.id)) + 1;
      w.ps.push(particle(w.nextId++, "H2O", x, y, r, { rad: rc, leave: 20, vx: p.vx, vy: p.vy }));
    }
    if (gone.size) w.ps = w.ps.filter(q => !gone.has(q));
    // offene Flasche: entwichenes Gas verlässt das Bild
    if (w.opened) w.ps = w.ps.filter(q => !(q.gas && q.y < -2 * rc));
  }
  if (w.stir > 0) w.stir--;
  if (w.shake > 0) w.shake--;
  // fertig: gelöst bzw. im Gleichgewicht; offene Flasche: alles CO₂ entwichen (abgestanden)
  const flat = () => !w.ps.some(p => p.f === w.closedGas || p.f === ACID);
  if (w.doneAt === undefined && w.shake === 0 && !w.ps.some(p => p.bound) && (w.opened ? flat() : w.closed ? atEquilibrium(w) : !w.ps.some(p => p.gas))) w.doneAt = w.t;
  if (w.floats.length) { const y = rawBoundary(w); w.lineY = w.lineY === undefined ? y : w.lineY + (y - w.lineY) * .03; }
}

/** Betrag der Geschwindigkeit sanft zum Ziel ziehen (Richtung bleibt) */
function toSpeed(p: FP, target: number) {
  const v = Math.hypot(p.vx, p.vy);
  if (v < 1e-6) return;
  const f = 1 + (target / v - 1) * .03;
  p.vx *= f; p.vy *= f;
}

/** Flugrichtung ändert sich ein wenig (Stöße mit Teilchen, die nicht gezeichnet sind) */
function veer(p: FP, r: () => number) {
  const t = (r() - .5) * .08, c = Math.cos(t), s = Math.sin(t);
  [p.vx, p.vy] = [p.vx * c - p.vy * s, p.vx * s + p.vy * c];
}

/** Stoßform eines Teilchens: Strecke (bei runden Teilchen ein Punkt) und Radius */
function shape(w: World, p: FP): [number, number, number, number, number] {
  if (!p.len) { const r = p.rad ?? w.rc; return [p.x, p.y, p.x, p.y, r]; }
  const c = Math.cos(p.a) * p.len, s = Math.sin(p.a) * p.len;
  return [p.x - c, p.y - s, p.x + c, p.y + s, p.cap!];
}
/** nächste Punkte zweier Strecken (für runde Teilchen sind die Strecken Punkte) */
function closest(a: number[], b: number[]): [number, number, number, number] {
  const [ax, ay, bx, by] = a, [cx, cy, dx, dy] = b;
  const ux = bx - ax, uy = by - ay, vx = dx - cx, vy = dy - cy, wx = ax - cx, wy = ay - cy;
  const A = ux * ux + uy * uy, B = ux * vx + uy * vy, C = vx * vx + vy * vy, D = ux * wx + uy * wy, E = vx * wx + vy * wy;
  const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
  let s = 0, t = 0;
  if (A < 1e-9 && C < 1e-9) { s = 0; t = 0; }
  else if (A < 1e-9) { t = clamp01(E / C); }
  else if (C < 1e-9) { s = clamp01(-D / A); }
  else {
    const den = A * C - B * B;
    s = den > 1e-9 ? clamp01((B * E - C * D) / den) : 0;
    t = (B * s + E) / C;
    if (t < 0) { t = 0; s = clamp01(-D / A); } else if (t > 1) { t = 1; s = clamp01((B - D) / A); }
  }
  return [ax + ux * s, ay + uy * s, cx + vx * t, cy + vy * t];
}
/** Teilchen um (ox, oy) verschieben, angreifend am Punkt (px, py): lange Moleküle drehen sich dabei mit */
function push(p: FP, px: number, py: number, ox: number, oy: number) {
  p.x += ox; p.y += oy;
  if (!p.len) return;
  const rx = px - p.x, ry = py - p.y;
  p.a += (rx * oy - ry * ox) / (p.len * p.len) * .6;
}

/** Anfangslage entwirren: lange Moleküle so drehen, dass sie die schon liegenden möglichst wenig berühren
 * (gekreuzte Stäbe ließen sich später nicht mehr trennen), dann Überlappungen auflösen, bevor etwas gezeichnet wird */
function settle(w: World) {
  const liquid = w.ps.filter(p => !p.gas);
  const long = liquid.filter(p => p.len);
  // erste Runde gegen die schon liegenden, zweite gegen alle
  for (let pass = 0; pass < 2; pass++) long.forEach((p, i) => {
    const a0 = p.a;
    let best = a0, bestGap = -Infinity;
    for (let k = 0; k < 24; k++) {
      p.a = a0 + k * Math.PI / 24;
      const sp = shape(w, p);
      let gap = Infinity;
      for (const q of pass ? long : long.slice(0, i)) {
        if (q === p) continue;
        if (Math.abs(q.x - p.x) > 2 * (p.len! + p.cap!) || Math.abs(q.y - p.y) > 2 * (p.len! + p.cap!)) continue;
        const sq = shape(w, q), [ax, ay, bx, by] = closest(sp, sq);
        gap = Math.min(gap, Math.hypot(bx - ax, by - ay) - sp[4] - sq[4]);
      }
      if (gap > bestGap + 1e-9) { bestGap = gap; best = p.a; }
    }
    p.a = best;
  });
  for (let k = 0; k < 60; k++) { separate(w, liquid, 1); clamp(w, liquid, w.rc, w.W - w.rc, w.top + w.rc, w.H - w.rc); }
}

/** Teilchen, die sich überlappen, auseinanderschieben (Kristallteilchen bleiben stehen) */
function separate(w: World, ps: FP[], rounds: number) {
  const reach = (p: FP) => (p.len ? p.len + p.cap! : p.rad ?? w.rc);
  const cell = 2 * Math.max(w.rc, ...ps.map(reach));
  for (let k = 0; k < rounds; k++) {
    const near = grid(ps, cell);
    for (const p of ps) near(p, q => {
      if (q.id < p.id) return;
      if (Math.abs(q.x - p.x) > reach(p) + reach(q) || Math.abs(q.y - p.y) > reach(p) + reach(q)) return;
      const sp = shape(w, p), sq = shape(w, q);
      const [px, py, qx, qy] = closest(sp, sq);
      const d = sp[4] + sq[4];
      let dx = qx - px, dy = qy - py, dist = Math.hypot(dx, dy);
      if (dist >= d) return;
      if (dist < 1e-6) { dx = q.x - p.x || 1e-3; dy = q.y - p.y; dist = Math.hypot(dx, dy); }
      const pb = !!p.bound && w.state === "fluessig", qb = !!q.bound && w.state === "fluessig";
      if (pb && qb) return;
      // eben gelöst (aus dem Kristall bzw. aus dem Gas): nur sanft wegschieben, damit nichts springt;
      // sonst höchstens ein Drittel Radius je Runde
      const soft = p.leave || q.leave ? .15 : 1;
      const o = Math.min((d - dist) * .5 * soft, w.rc * .35) / dist;
      const fp = pb ? 0 : qb ? 2 : 1, fq = qb ? 0 : pb ? 2 : 1;
      if (fp) push(p, px, py, -dx * o * fp * .5, -dy * o * fp * .5);
      if (fq) push(q, qx, qy, dx * o * fq * .5, dy * o * fq * .5);
    });
  }
}

function clamp(w: World, ps: FP[], x0: number, x1: number, y0: number, y1: number) {
  for (const p of ps) {
    if (p.bound) continue;
    // lange Moleküle: beide Enden bleiben im Gefäß (drehen sich an der Wand)
    if (p.len) {
      for (const end of [-1, 1]) {
        const ex = p.x + Math.cos(p.a) * p.len * end, ey = p.y + Math.sin(p.a) * p.len * end, e = p.cap! - w.rc;
        const ox = ex < x0 + e ? x0 + e - ex : ex > x1 - e ? x1 - e - ex : 0;
        const oy = ey < y0 + e ? y0 + e - ey : ey > y1 - e ? y1 - e - ey : 0;
        const lim = (v: number) => Math.max(-w.rc * .3, Math.min(w.rc * .3, v * .5));
        if (ox || oy) push(p, ex, ey, lim(ox), lim(oy));
      }
    }
    const e = (p.rad ?? w.rc) - w.rc; // große Moleküle bleiben weiter vom Rand weg
    // eben gelöst (CO₂ an der Oberfläche): gleitet hinein statt zu springen
    const lim = (v: number, to: number) => (p.leave ? v + Math.max(-.5, Math.min(.5, to - v)) : to);
    if (p.x < x0 + e) { p.x = lim(p.x, x0 + e); p.vx = Math.abs(p.vx) * .3; }
    if (p.x > x1 - e) { p.x = lim(p.x, x1 - e); p.vx = -Math.abs(p.vx) * .3; }
    if (p.y < y0 + e) { p.y = lim(p.y, y0 + e); p.vy = Math.abs(p.vy) * .3; }
    if (p.y > y1 - e) { p.y = lim(p.y, y1 - e); p.vy = -Math.abs(p.vy) * .3; }
  }
}

/** Gas: elastischer Stoß zweier Teilchen (Geschwindigkeiten entlang der Verbindungslinie tauschen) */
function collide(w: World, ps: FP[]) {
  const d = 2 * w.rc;
  const near = grid(ps, d);
  for (const p of ps) near(p, q => {
    if (q.id < p.id) return;
    const dx = q.x - p.x, dy = q.y - p.y, dist = Math.hypot(dx, dy);
    if (dist >= d || dist === 0) return;
    const nx = dx / dist, ny = dy / dist;
    const rel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
    if (rel > 0) { p.vx -= rel * nx; p.vy -= rel * ny; q.vx += rel * nx; q.vy += rel * ny; }
    const o = Math.min((d - dist) / 2, w.rc * .35); // sanft trennen, damit nichts springt
    p.x -= nx * o; p.y -= ny * o; q.x += nx * o; q.y += ny * o;
  });
}
