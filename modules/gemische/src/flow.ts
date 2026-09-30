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
  /** im Kristall bzw. Gitter (Platz hx, hy) */
  bound?: boolean;
  hx?: number; hy?: number;
  /** Gas über der Flüssigkeit */
  gas?: boolean;
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
  /** Zeitschritte, die noch umgerührt / geschüttelt / geschmolzen wird */
  stir: number; shake: number; melt: number;
  /** Temperatur in °C: je wärmer, desto schneller bewegen sich die Teilchen */
  temp: number;
  /** Stärke von Schütteln/Umrühren (0 … 1): steigt und fällt sanft, damit sich die Bewegung nie ruckartig ändert */
  agit: number;
  /** vorher: noch nichts löst sich (Kristall, Gas warten) */
  hold: boolean;
  /** geschlossenes Gefäß */
  closed: boolean;
  /** Metallgitter: Plätze */
  sites: [number, number][];
  /** Lücke zwischen den Metallblöcken vorher */
  gap: number;
  /** Grenze Öl/Wasser (geglättet) */
  lineY?: number;
  t: number;
  r: () => number;
}

type Spec = Pick<Example, "items" | "state" | "floats" | "before" | "solute">;

const LIQ_PHI = .42; // Flächenanteil der Stoßkreise in der Flüssigkeit (gezeichnet werden die Teilchen größer)
const LIQ_RC = 2.6, GAS_RC = 2.2, GAS_V = .7;

const shuffle = <T,>(a: T[], r: () => number) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
};
const count = (items: [string, number][]) => items.reduce((s, [, n]) => s + n, 0);

/** Höhe der Flüssigkeit mit n Teilchen */
export const liquidHeight = (n: number, W = 100) => (n * Math.PI * LIQ_RC * LIQ_RC) / LIQ_PHI / W;

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
  const W = ex.state === "fluessig" ? Math.round(Math.sqrt((n * Math.PI * LIQ_RC * LIQ_RC) / LIQ_PHI / .8)) : 100;
  const base = { floats, walls: [] as number[], stir: 0, shake: 0, melt: 0, temp: 20, agit: 0, hold: !!vorher, closed: ex.before === "gasraum", sites: [] as [number, number][], gap: 0, t: 0, r };

  if (ex.state === "fluessig") {
    const head = ex.before === "gasraum" ? 26 : floats.length ? 14 : 8;
    const hl = liquidHeight(n, W), H = head + hl, rc = LIQ_RC;
    const w: World = { ...base, state: "fluessig", W, H, top: head, rc, ps: [] };
    if (vorher === "gasraum" && ex.solute) {
      const others = shuffle(list.filter(f => f !== ex.solute), r);
      const spots = packed(others.length, W, H - liquidHeight(others.length, W), H, rc, r);
      others.forEach((f, i) => w.ps.push(particle(i, f, spots[i][0], spots[i][1], r)));
      list.filter(f => f === ex.solute).forEach((f, i) => {
        const ang = r() * Math.PI * 2;
        w.ps.push(particle(others.length + i, f, rc + r() * (W - 2 * rc), rc + r() * (head - 2 * rc), r, { gas: true, vx: Math.cos(ang) * GAS_V, vy: Math.sin(ang) * GAS_V }));
      });
      return w;
    }
    const spots = packed(n, W, head, H, rc, r); // von unten nach oben
    if (vorher === "kristall" && ex.solute) {
      // Kristall: die Plätze unten in der Mitte, dicht gepackt
      const k = list.filter(f => f === ex.solute).length;
      const cols = Math.ceil(Math.sqrt(k * 1.4)), rows = Math.ceil(k / cols), s = 2 * rc;
      const sites: [number, number][] = [];
      for (let i = 0; i < k; i++) sites.push([W / 2 + (i % cols - (cols - 1) / 2) * s, H - rc - Math.floor(i / cols) * s]);
      const blockTop = H - rows * s - rc * .5, x0 = W / 2 - cols * s / 2 - rc * .5, x1 = W / 2 + cols * s / 2 + rc * .5;
      const free = spots.filter(([x, y]) => !(y > blockTop && x > x0 && x < x1));
      const extra = packed(n + 40, W, head, H, rc, r).filter(([x, y]) => !(y > blockTop && x > x0 && x < x1));
      const place = [...free, ...extra];
      const others = shuffle(list.filter(f => f !== ex.solute), r);
      sites.forEach(([x, y], i) => w.ps.push(particle(i, ex.solute!, x, y, r, { bound: true, hx: x, hy: y })));
      others.forEach((f, i) => w.ps.push(particle(k + i, f, place[i][0], place[i][1], r)));
      return w;
    }
    const up = (f: string) => (vorher === "schicht" ? f === ex.solute : floats.includes(f));
    const order = [...shuffle(list.filter(f => !up(f)), r), ...shuffle(list.filter(up), r)];
    order.forEach((f, i) => w.ps.push(particle(i, f, spots[i][0], spots[i][1], r)));
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

/** Mischen beginnt: Trennwände weg, Metall schmilzt, Flüssigkeit wird umgerührt */
export function startMixing(w: World) {
  w.hold = false;
  if (w.state === "fest") { w.walls = []; w.melt = 420; for (const p of w.ps) p.bound = false; return; }
  w.walls = [];
  if (w.state === "fluessig") w.stir = 300;
}
/** Schütteln (Flüssigkeit): kräftige Stöße, danach Ruhe */
export const SHAKE = 180; // Schütteln dauert 3 s und ist gemächlich (gut zu verfolgen)
export function shakeWorld(w: World) { w.shake = SHAKE; }
/**
 * Faktor der Teilchengeschwindigkeit bei der eingestellten Temperatur, bezogen auf 20 °C.
 * Echt wäre √(T in K): von 0 °C bis 100 °C nur + 17 % – das sieht man nicht. Im Modell deutlich verstärkt:
 * 0 °C halb so schnell, 100 °C dreimal so schnell wie bei 20 °C (Richtung stimmt, Ausmaß ist übertrieben).
 */
export const heat = (w: World) => .5 + .025 * Math.max(0, w.temp);

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
  if (w.ps.some(p => p.gas || p.bound)) return false;
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
        // geschmolzen: fließt und wird gerührt
        const sx = -(p.y - H / 2) * .0025, sy = (p.x - W / 2) * .0025;
        p.vx = p.vx * .9 + (r() - .5) * .5 + sx; p.vy = p.vy * .9 + (r() - .5) * .5 + sy;
      } else {
        // am Gitterplatz schwingen (bzw. dorthin gleiten)
        const h = heat(w);
        p.vx = p.vx * .8 + ((p.hx ?? p.x) - p.x) * .06 + (r() - .5) * .06 * h;
        p.vy = p.vy * .8 + ((p.hy ?? p.y) - p.y) * .06 + (r() - .5) * .06 * h;
      }
      p.x += p.vx; p.y += p.vy;
      turn(p, melting ? .02 : .002);
    }
    if (melting) {
      separate(w, w.ps, 2);
      clamp(w, w.ps, rc, W - rc, rc, H - rc);
      if (--w.melt === 0) {
        // erstarrt: jedes Teilchen sucht sich den nächsten freien Gitterplatz
        const free = new Set(w.sites.map((_, i) => i));
        for (const p of shuffle(w.ps, r)) {
          let best = -1, bd = Infinity;
          for (const i of free) { const d = (w.sites[i][0] - p.x) ** 2 + (w.sites[i][1] - p.y) ** 2; if (d < bd) { bd = d; best = i; } }
          free.delete(best);
          p.hx = w.sites[best][0]; p.hy = w.sites[best][1]; p.bound = true;
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
      for (const x of w.walls) {
        if (ox < x && p.x > x - rc) { p.x = x - rc; p.vx = -Math.abs(p.vx); }
        else if (ox > x && p.x < x + rc) { p.x = x + rc; p.vx = Math.abs(p.vx); }
      }
      turn(p, .004);
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
  const liquid = w.ps.filter(p => !p.gas);
  const cy = (w.top + H) / 2;
  const line = w.floats.length ? rawBoundary(w) : 0;
  for (const p of w.ps) {
    if (p.gas) {
      // Gas über der Flüssigkeit: fliegt; trifft es auf die Oberfläche, löst es sich (vorher prallt es ab)
      veer(p, r);
      if (w.hold) toSpeed(p, GAS_V * heat(w));
      else p.vy += .012; // CO₂ ist schwerer als Luft
      p.x += p.vx; p.y += p.vy;
      if (p.x < rc || p.x > W - rc) { p.vx = -p.vx; p.x = Math.min(W - rc, Math.max(rc, p.x)); }
      if (p.y < rc) { p.vy = Math.abs(p.vy); p.y = rc; }
      if (p.y > w.top - rc) {
        if (!w.hold && r() < .7) { p.gas = false; p.vx *= .3; p.vy = 1.6; }
        else { p.vy = -Math.abs(p.vy); p.y = w.top - rc; }
      }
      turn(p, .004);
      continue;
    }
    if (p.bound) continue;
    // Wärmebewegung (mit der Temperatur) plus Schütteln/Umrühren; Geschwindigkeit ändert sich nur allmählich (fließend)
    const kick = .29 * heat(w) + (w.shake > 0 ? 1 : 1.35) * w.agit;
    p.vx = p.vx * .93 + (r() - .5) * kick;
    // Auftrieb: nur das Öl steigt (das Wasser füllt den Rest gleichmäßig – keine Lücke)
    // Auftrieb nur für Teilchen auf der falschen Seite der Grenze: Öl darunter steigt, Wasser darüber sinkt
    // (in der eigenen Schicht wirkt nichts – so wird nichts zusammengedrückt)
    const buoy = !w.floats.length || w.agit > .3 ? 0 : w.floats.includes(p.f) ? (p.y > line - rc ? -.09 : 0) : (p.y < line + rc ? .09 : 0);
    p.vy = p.vy * .93 + (r() - .5) * kick + buoy;
    if (w.agit > .01) {
      // Umrühren (und Schütteln): zwei Wirbel, die fließend abwechselnd stärker werden (so wird es durchmischt, nicht nur gedreht)
      const s1 = (1 + Math.sin(w.t / 10)) / 2, k = .0015 * w.agit;
      p.vx += -(p.y - cy) * k;
      p.vy += ((p.x - W / 3) * s1 + (p.x - 2 * W / 3) * (1 - s1)) * k;
    }
    p.x += p.vx; p.y += p.vy;
    turn(p, .01);
  }
  // Druck: Nachbarn näher als der mittlere Abstand stoßen sich sanft ab – die Flüssigkeit bleibt überall gleich dicht
  {
    const R = Math.sqrt(Math.PI * rc * rc / LIQ_PHI), near = grid(liquid, R);
    for (const p of liquid) near(p, q => {
      if (q.id < p.id) return;
      const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
      if (d >= R || d === 0) return;
      const f = .4 * (R - d) / R, nx = dx / d * f, ny = dy / d * f;
      if (!p.bound) { p.vx -= nx; p.vy -= ny; }
      if (!q.bound) { q.vx += nx; q.vy += ny; }
    });
  }
  // Kristall löst sich von außen
  if (!w.hold) {
    const near = grid(liquid, 2.4 * rc);
    for (const p of liquid) {
      if (!p.bound) continue;
      let wet = false;
      near(p, q => { if (!q.bound && (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < (2.4 * rc) ** 2) wet = true; });
      if (wet && r() < (w.stir > 0 ? .02 : .006) * heat(w) ** 2) p.bound = false;
    }
  }
  separate(w, liquid, 3);
  clamp(w, liquid, rc, W - rc, w.top + rc, H - rc);
  // gerührt wird, bis sich alles gelöst hat
  if (!w.hold && w.stir > 0 && w.stir < 60 && w.ps.some(p => p.bound || p.gas)) w.stir = 60;
  if (w.stir > 0) w.stir--;
  if (w.shake > 0) w.shake--;
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

/** Teilchen, die sich überlappen, auseinanderschieben (Kristallteilchen bleiben stehen) */
function separate(w: World, ps: FP[], rounds: number) {
  const d = 2 * w.rc;
  for (let k = 0; k < rounds; k++) {
    const near = grid(ps, d);
    for (const p of ps) near(p, q => {
      if (q.id < p.id) return;
      const dx = q.x - p.x, dy = q.y - p.y, dist = Math.hypot(dx, dy);
      if (dist >= d || dist === 0) return;
      const o = (d - dist) / dist * .5;
      const pb = !!p.bound && w.state === "fluessig", qb = !!q.bound && w.state === "fluessig";
      if (pb && qb) return;
      const fp = pb ? 0 : qb ? 2 : 1, fq = qb ? 0 : pb ? 2 : 1;
      p.x -= dx * o * fp * .5; p.y -= dy * o * fp * .5;
      q.x += dx * o * fq * .5; q.y += dy * o * fq * .5;
    });
  }
}

function clamp(_w: World, ps: FP[], x0: number, x1: number, y0: number, y1: number) {
  for (const p of ps) {
    if (p.bound) continue;
    if (p.x < x0) { p.x = x0; p.vx = Math.abs(p.vx) * .3; }
    if (p.x > x1) { p.x = x1; p.vx = -Math.abs(p.vx) * .3; }
    if (p.y < y0) { p.y = y0; p.vy = Math.abs(p.vy) * .3; }
    if (p.y > y1) { p.y = y1; p.vy = -Math.abs(p.vy) * .3; }
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
    const o = (d - dist) / 2;
    p.x -= nx * o; p.y -= ny * o; q.x += nx * o; q.y += ny * o;
  });
}
