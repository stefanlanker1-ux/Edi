// Kapitel 3 – kleine Teilchensimulation für Schmelzen und Leiten (ohne React, getestet in sim.test.ts).
// Fest: jedes Ion schwingt um seinen Gitterplatz (Weite `amp`). Beweglich (Schmelze, Lösung): die Gitterplätze lösen sich,
// die Ionen bewegen sich ungeordnet (Zufallskraft, langsam veränderlich), Gegen-Ionen ziehen sich an, gleiche Ladungen stoßen sich ab,
// keine Kugel überlappt eine andere. Unter die Schmelztemperatur zurück: jedes Ion bekommt den nächsten freien Gitterplatz seiner Ladung
// und gleitet dorthin. Gefäß = Wände (links, rechts, unten; oben eine unsichtbare Decke knapp über der Schmelze) oder periodischer
// Ausschnitt (was rechts hinausgleitet, kommt links wieder herein – außerhalb des sichtbaren Kreises).

export interface Body {
  x: number; y: number; vx: number; vy: number;
  /** Radius im Bild, Ladungsvorzeichen (+1 Kation, −1 Anion) */
  r: number; q: number;
  /** zugewiesener Gitterplatz */
  hx: number; hy: number;
  /** Zufallskraft (Ornstein-Uhlenbeck: ändert sich weich) */
  nx: number; ny: number;
  /** Schwingen im Gitter: Kreisfrequenzen und Phasen (x1, x2, y1, y2) */
  w: number[]; p: number[];
  /** zurückgelegter Weg ohne Umbruch am Rand (für Tests) */
  dx: number; dy: number;
}

export interface Site { x: number; y: number; q: number }

export interface World {
  b: Body[];
  sites: Site[];
  /** Gitterabstand = bevorzugter Abstand von Gegen-Ionen */
  u: number;
  /** x0, y0, x1, y1: Innenraum des Gefäßes bzw. periodischer Ausschnitt */
  box: [number, number, number, number];
  periodic: boolean;
  /** 0 = Gitter … 1 = beweglich */
  m: number;
  /** Zeit (s) */
  t: number;
  /** Zielzustand beim letzten Schritt (Wechsel beweglich → fest verteilt die Gitterplätze neu) */
  free: boolean;
  rnd: () => number;
}

export interface Drive {
  /** beweglich (geschmolzen bzw. gelöst) */
  free: boolean;
  /** Wärmebewegung relativ zur Schmelztemperatur (Kelvin / Kelvin), 1 = am Schmelzpunkt */
  heat: number;
  /** Schwingungsweite im Gitter (px) */
  amp: number;
  /** Wandern im Strom (px/s): Kationen nach +x bei > 0, Anionen umgekehrt */
  drift?: number;
  /** gelöst: keine Anziehung, die Ionen bleiben auf Abstand (dazwischen Wasser) */
  apart?: boolean;
  /** schwache Schwerkraft im Gefäß (die Schmelze bleibt unten) */
  gravity?: boolean;
  /** Stärke der Anziehung (1 = Gefäß mit Oberfläche; im Ausschnitt ohne Oberfläche schwächer, damit die Schmelze im Strom fließt) */
  cohesion?: number;
  /** Mindestabstand gleicher Ladungen in u (Standard 1,32 – im Gitter stehen sie √2 u auseinander); kleiner = flüssiger */
  like?: number;
}

/** Zufallszahlen 0…1, fest je Startwert (gleiche Bilder bei jedem Öffnen) */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gauss = (rnd: () => number) => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());

/** Welt aus Gitterplätzen: jedes Ion sitzt auf seinem Platz; `radius(q)` = Radius im Bild */
export function makeWorld(sites: Site[], radius: (q: number) => number, u: number, box: World["box"], periodic: boolean, seed = 7, bodies?: Site[]): World {
  const rnd = seeded(seed);
  const b = (bodies ?? sites).map(s => ({
    x: s.x, y: s.y, vx: 0, vy: 0, r: radius(s.q), q: s.q, hx: s.x, hy: s.y, nx: 0, ny: 0,
    w: [0, 0, 0, 0].map(() => 7 + 6 * rnd()), p: [0, 0, 0, 0].map(() => 2 * Math.PI * rnd()), dx: 0, dy: 0,
  }));
  return { b, sites, u, box, periodic, m: 0, t: 0, free: false, rnd };
}

/** Gitterplätze: `cols` × `rows`, Abstand u, Kation an (0, 0); x0/y0 = Mitte des ersten Platzes */
export function grid(cols: number, rows: number, u: number, x0: number, y0: number): Site[] {
  return Array.from({ length: cols * rows }, (_, k) => {
    const i = k % cols, j = Math.floor(k / cols);
    return { x: x0 + i * u, y: y0 + j * u, q: (i + j) % 2 === 0 ? 1 : -1 };
  });
}

/** Abstand mit periodischem Rand (kürzester Weg) */
function wrapD(w: World, d: number, axis: 0 | 1) {
  if (!w.periodic) return d;
  const L = axis === 0 ? w.box[2] - w.box[0] : w.box[3] - w.box[1];
  return d - L * Math.round(d / L);
}

/** Gitterplätze neu verteilen: jedes Ion bekommt einen Platz seiner Ladung, insgesamt möglichst kurze Wege (Tausch, bis nichts kürzer wird) */
export function assignSites(w: World) {
  for (const q of [1, -1]) {
    const ions = w.b.filter(b => b.q === q), sites = w.sites.filter(s => s.q === q);
    if (ions.length > sites.length) continue;
    const d2 = (b: Body, s: Site) => wrapD(w, s.x - b.x, 0) ** 2 + wrapD(w, s.y - b.y, 1) ** 2;
    // gierig: kürzeste Paare zuerst
    const pairs: [number, number, number][] = [];
    ions.forEach((b, i) => sites.forEach((s, j) => pairs.push([d2(b, s), i, j])));
    pairs.sort((a, c) => a[0] - c[0]);
    const of = new Array<number>(ions.length).fill(-1), used = new Set<number>();
    for (const [, i, j] of pairs) if (of[i] < 0 && !used.has(j)) { of[i] = j; used.add(j); }
    // verbessern: zwei Ionen tauschen ihre Plätze, wenn die Wege zusammen kürzer werden
    for (let pass = 0, better = true; better && pass < 20; pass++) {
      better = false;
      for (let a = 0; a < ions.length; a++) for (let c = a + 1; c < ions.length; c++) {
        const now = d2(ions[a], sites[of[a]]) + d2(ions[c], sites[of[c]]);
        const swap = d2(ions[a], sites[of[c]]) + d2(ions[c], sites[of[a]]);
        if (swap < now - 1e-6) { [of[a], of[c]] = [of[c], of[a]]; better = true; }
      }
    }
    ions.forEach((b, i) => { b.hx = sites[of[i]].x; b.hy = sites[of[i]].y; });
  }
}

// Kräfte (px/s², Masse 1), skaliert mit dem Gitterabstand u – gleiches Verhalten in jeder Zeichengröße
const K_HOME = 700;   // Feder zum Platz (fest)
const GAMMA = 3;      // Reibung in der Flüssigkeit (1/s)
const K_REP = 45;     // Abstoßung bei zu kleinem Abstand (1/s²)
const K_ATT = 0.9;    // Anziehung der Gegen-Ionen (· u)
const NOISE = 2.0;    // Zufallskraft (· u · √heat)
const TAU = 0.45;     // Zeitskala der Zufallskraft (s)
const GRAV = 0.45;    // Schwerkraft im Gefäß (· u)
const K_WALL = 400;   // Wand (1/s²)

/** einen Zeitschritt h (s) rechnen */
function substep(w: World, d: Drive, h: number) {
  const { b, u } = w;
  // Zustand fest ↔ beweglich weich überblenden: Schmelzen ≈ 0,8 s, Erstarren ≈ 1,6 s
  if (d.free !== w.free) { if (!d.free) assignSites(w); w.free = d.free; }
  w.m = d.free ? Math.min(1, w.m + h / 0.8) : Math.max(0, w.m - h / 1.6);
  const m = w.m, kh = K_HOME * (1 - m) ** 2, damp = 2 * Math.sqrt(K_HOME) * (1 - m) + GAMMA * m;
  const heat = Math.min(2, Math.max(0.2, d.heat));
  const sigma = NOISE * u * Math.sqrt(heat);
  const n = b.length;
  const ax = new Float64Array(n), ay = new Float64Array(n);
  const t = w.t;
  for (let i = 0; i < n; i++) {
    const p = b[i];
    // Platz + Schwingen
    if (kh > 0) {
      const tx = p.hx + d.amp * (0.62 * Math.sin(p.w[0] * t + p.p[0]) + 0.38 * Math.sin(p.w[1] * t + p.p[1]));
      const ty = p.hy + d.amp * (0.62 * Math.sin(p.w[2] * t + p.p[2]) + 0.38 * Math.sin(p.w[3] * t + p.p[3]));
      ax[i] += kh * wrapD(w, tx - p.x, 0); ay[i] += kh * wrapD(w, ty - p.y, 1);
    }
    ax[i] -= damp * p.vx; ay[i] -= damp * p.vy;
    if (m > 0) {
      // Zufallskraft (weich veränderlich)
      const f = Math.sqrt(2 * h / TAU);
      p.nx += -p.nx * h / TAU + sigma * f * gauss(w.rnd);
      p.ny += -p.ny * h / TAU + sigma * f * gauss(w.rnd);
      ax[i] += m * p.nx; ay[i] += m * p.ny;
      if (d.drift) ax[i] += m * GAMMA * d.drift * p.q;
      if (d.gravity) ay[i] += m * GRAV * u;
    }
  }
  // Paare: Gegen-Ionen bevorzugen den Gitterabstand (Anziehung bis 1,7 u), gleiche Ladungen halten Abstand
  if (m > 0) {
    const d0 = 0.92 * u, dc = 1.7 * u, dl = (d.like ?? 1.32) * u, da = 1.55 * u;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const A = b[i], B = b[j];
      const dx = wrapD(w, B.x - A.x, 0), dy = wrapD(w, B.y - A.y, 1);
      const dd = dx * dx + dy * dy;
      if (dd > dc * dc) continue;
      const dist = Math.sqrt(dd) || 1e-6;
      let f = 0; // > 0 stößt ab
      if (d.apart) { if (dist < da) f = K_REP * (da - dist); }
      else if (A.q * B.q < 0) {
        if (dist < d0) f = K_REP * (d0 - dist);
        else { const s = (dist - d0) / (dc - d0); f = -K_ATT * (d.cohesion ?? 1) * u * Math.sin(Math.PI * s); }
      } else if (dist < dl) f = K_REP * (dl - dist);
      f *= m;
      const fx = (f * dx) / dist, fy = (f * dy) / dist;
      ax[i] -= fx; ay[i] -= fy; ax[j] += fx; ay[j] += fy;
    }
  }
  // Wände (Gefäß)
  const [x0, y0, x1, y1] = w.box;
  if (!w.periodic) for (let i = 0; i < n; i++) {
    const p = b[i];
    if (p.x - p.r < x0) ax[i] += K_WALL * (x0 - p.x + p.r);
    if (p.x + p.r > x1) ax[i] -= K_WALL * (p.x + p.r - x1);
    if (p.y - p.r < y0) ay[i] += K_WALL * (y0 - p.y + p.r);
    if (p.y + p.r > y1) ay[i] -= K_WALL * (p.y + p.r - y1);
  }
  // bewegen (Geschwindigkeit begrenzt: nichts springt)
  const vmax = 3 * u;
  for (let i = 0; i < n; i++) {
    const p = b[i];
    p.vx += ax[i] * h; p.vy += ay[i] * h;
    const v = Math.hypot(p.vx, p.vy);
    if (v > vmax) { p.vx *= vmax / v; p.vy *= vmax / v; }
    p.x += p.vx * h; p.y += p.vy * h; p.dx += p.vx * h; p.dy += p.vy * h;
  }
  separate(w);
  w.t += h;
}

/** Kugeln überlappen nie: zu nahe Paare auseinanderschieben, Annäherung bremsen; im Gefäß an den Wänden halten, im Ausschnitt umbrechen */
function separate(w: World) {
  const { b } = w, n = b.length;
  const [x0, y0, x1, y1] = w.box;
  for (let it = 0; it < 3; it++) {
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const A = b[i], B = b[j];
      const dx = wrapD(w, B.x - A.x, 0), dy = wrapD(w, B.y - A.y, 1);
      const min = A.r + B.r + 2;
      const dd = dx * dx + dy * dy;
      if (dd >= min * min) continue;
      const dist = Math.sqrt(dd) || 1e-6, nx = dx / dist, ny = dy / dist, push = (min - dist) / 2;
      A.x -= nx * push; A.y -= ny * push; B.x += nx * push; B.y += ny * push;
      const vn = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
      if (vn < 0) { A.vx += (vn / 2) * nx; A.vy += (vn / 2) * ny; B.vx -= (vn / 2) * nx; B.vy -= (vn / 2) * ny; }
    }
    for (const p of b) {
      if (w.periodic) {
        const L = x1 - x0, H = y1 - y0;
        if (p.x < x0) p.x += L; else if (p.x >= x1) p.x -= L;
        if (p.y < y0) p.y += H; else if (p.y >= y1) p.y -= H;
      } else {
        if (p.x < x0 + p.r) { p.x = x0 + p.r; p.vx = Math.max(0, p.vx); }
        if (p.x > x1 - p.r) { p.x = x1 - p.r; p.vx = Math.min(0, p.vx); }
        if (p.y < y0 + p.r) { p.y = y0 + p.r; p.vy = Math.max(0, p.vy); }
        if (p.y > y1 - p.r) { p.y = y1 - p.r; p.vy = Math.min(0, p.vy); }
      }
    }
  }
}

const H = 1 / 120;

/** Zeit dt (s) weiterrechnen, in festen kleinen Schritten (stabil bei jeder Bildrate) */
export function advance(w: World, d: Drive, dt: number) {
  const k = Math.max(1, Math.round(Math.min(dt, 0.05) / H));
  for (let i = 0; i < k; i++) substep(w, d, H);
}

/** ohne Zeichnen vorausrechnen (Startbild der Schmelze, ruhiges Endbild bei reduzierter Bewegung) */
export function warm(w: World, d: Drive, seconds: number) {
  for (let s = 0; s < seconds; s += H) substep(w, d, H);
  return w;
}

/** Deckkraft der Anziehungs-Linie zwischen zwei Gegen-Ionen im Abstand dist: voll bis 1,25 u, weich aus bis 1,6 u (nichts springt) */
export const bondAlpha = (dist: number, u: number) => Math.max(0, Math.min(1, (1.6 * u - dist) / (0.35 * u)));
