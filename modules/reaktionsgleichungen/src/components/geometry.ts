// Räumliche Anordnung (3D, in Å) für jeden Stoff der Reaktionen – Grundlage für das Teilchenbild (Kalottenmodell).
// · Moleküle aus Nichtmetallen: berechnete Lage aus @lern/chem (MOL3D, Kraftfeld MMFF94)
// · Salze, Metalloxide, Säuren mit Ionen: kleine Bausteine (Tetraeder SO₄, Dreieck NO₃ …, Kationen liegen an)
// Danach wird jeder Stoff einheitlich ausgerichtet (längste Ausdehnung waagrecht, leicht gekippt, damit er räumlich wirkt).

import { MOL3D, parseFormula, type Mol3D } from "@lern/chem";

export type Vec = [number, number, number];
export type Atom3 = [el: string, x: number, y: number, z: number];

/** Darstellungsradien (Å, ≈ 0,55 · Van-der-Waals bzw. Ionenradius) – H klein, Metalle groß */
const RAD: Record<string, number> = {
  H: .6, C: .92, N: .86, O: .84, F: .8, Cl: 1, S: 1.02, P: 1.02, I: 1.12, Br: 1.06,
  Li: .95, Na: 1.12, K: 1.3, Mg: 1, Ca: 1.18, Ba: 1.36, Al: .96, Fe: .95, Cu: .92, Zn: .93, Ag: 1.04, Hg: 1.06, Pb: 1.14, Mn: .95, Cr: .93,
};
export const radius = (el: string) => RAD[el] ?? 1;

// ── Vektoren ─────────────────────────────────────────────────────────────────
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: Vec): Vec => mul(a, 1 / (Math.hypot(...a) || 1));
const pos = (a: Atom3): Vec => [a[1], a[2], a[3]];
const at = (el: string, p: Vec): Atom3 => [el, p[0], p[1], p[2]];
const move = (atoms: Atom3[], d: Vec): Atom3[] => atoms.map(a => at(a[0], add(pos(a), d)));
/** Abstand zweier Ionen/Atome, die sich berühren (Kugeln überlappen leicht) */
const touch = (a: string, b: string) => .82 * (radius(a) + radius(b));

/** Tetraeder- und Dreiecksrichtungen */
const TET: Vec[] = [norm([1, 1, 1]), norm([1, -1, -1]), norm([-1, 1, -1]), norm([-1, -1, 1])];
const TRI: Vec[] = [0, 120, 240].map(d => [Math.cos((d - 90) * Math.PI / 180), Math.sin((d - 90) * Math.PI / 180), 0] as Vec);

/** Zentralatom mit Liganden in den gegebenen Richtungen */
const star = (c: string, lig: string, dirs: Vec[], d: number): Atom3[] => [at(c, [0, 0, 0]), ...dirs.map(v => at(lig, mul(v, d)))];
/** Atom außen an eine Gruppe legen: in Richtung `dir`, berührend */
function beside(atoms: Atom3[], el: string, dir: Vec): Atom3[] {
  const u = norm(dir);
  const far = Math.max(...atoms.map(a => dot(pos(a), u) + radius(a[0])));
  return [...atoms, at(el, mul(u, far + radius(el) * .72))];
}
/** H an das i-te Atom (O) hängen: vom Zentrum weg, gewinkelt (≈ 109°) */
function hOn(atoms: Atom3[], i: number, turn: Vec = [0, 0, 1]): Atom3[] {
  const o = pos(atoms[i]), u = norm(o);
  let t = sub(turn, mul(u, dot(turn, u)));
  if (Math.hypot(...t) < 1e-6) t = [0, 1, 0];
  return [...atoms, at("H", add(o, mul(norm(add(mul(u, .34), mul(norm(t), .94))), .97)))];
}
/** Kette im Zickzack (Ionengitter-Ausschnitt), Abstand = Berührung */
function zig(els: string[]): Atom3[] {
  let x = 0;
  return els.map((el, i) => {
    if (i) x += touch(els[i - 1], el) * .92;
    return at(el, [x, i % 2 ? .45 : -.45, 0]);
  });
}
/** Gruppen (Ionen) nebeneinander, Reihen zu je `cols` */
function pack(parts: Atom3[][], cols = 3): Atom3[] {
  const ext = (p: Atom3[], k: 0 | 1) => [Math.min(...p.map(a => pos(a)[k] - radius(a[0]))), Math.max(...p.map(a => pos(a)[k] + radius(a[0])))];
  const out: Atom3[] = [];
  let y = 0;
  for (let r = 0; r < parts.length; r += cols) {
    const row = parts.slice(r, r + cols);
    let x = 0, h = 0;
    for (const p of row) {
      const [x0, x1] = ext(p, 0), [y0, y1] = ext(p, 1);
      out.push(...move(p, [x - x0, y - (y0 + y1) / 2, 0]));
      x += (x1 - x0) * .97; h = Math.max(h, y1 - y0);
    }
    y += h * .95;
  }
  return out;
}

// ── Oxo-Ionen ────────────────────────────────────────────────────────────────
const SO4 = () => star("S", "O", TET, 1.49), PO4 = () => star("P", "O", TET, 1.54), MnO4 = () => star("Mn", "O", TET, 1.63);
const NO3 = () => star("N", "O", TRI, 1.25), CO3 = () => star("C", "O", TRI, 1.29);
const ClO3 = () => star("Cl", "O", TET.slice(1), 1.49);
const one = (el: string): Atom3[] => [at(el, [0, 0, 0])];
const pair = (a: string, b: string): Atom3[] => [at(a, [0, 0, 0]), at(b, [touch(a, b), 0, 0])];
const lin = (c: string, x: string, d = touch(c, x)): Atom3[] => [at(c, [0, 0, 0]), at(x, [-d, 0, 0]), at(x, [d, 0, 0])];
const bent = (c: string, x: string, deg: number, d = touch(c, x)): Atom3[] => {
  const h = deg / 2 * Math.PI / 180;
  return [at(c, [0, 0, 0]), at(x, [-d * Math.sin(h), d * Math.cos(h), 0]), at(x, [d * Math.sin(h), d * Math.cos(h), 0])];
};
const tri = (c: string, x: string, d = touch(c, x)): Atom3[] => star(c, x, TRI, d);
/** Metallhydroxid M(OH)n: OH-Gruppen um das Metall */
function hydroxide(m: string, n: 1 | 2): Atom3[] {
  const dirs: Vec[] = n === 1 ? [[1, 0, 0]] : [[1, 0, 0], [-1, 0, 0]];
  const out: Atom3[] = [at(m, [0, 0, 0])];
  for (const d of dirs) {
    const o = mul(d, touch(m, "O"));
    out.push(at("O", o), at("H", add(o, [d[0] * .45, -.85, .2])));
  }
  return out;
}
function p4(): Atom3[] { return TET.map(v => at("P", mul(v, 1.35))); }
function p4o10(): Atom3[] {
  const s = 1.72, out: Atom3[] = TET.map(v => at("P", mul(v, s)));
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) out.push(at("O", mul(norm(add(TET[i], TET[j])), 1.9)));
  TET.forEach(v => out.push(at("O", mul(v, s + 1.45))));
  return out;
}
function dichromate(): Atom3[] {
  const a: Atom3[] = [at("Cr", [-1.6, 0, 0]), at("Cr", [1.6, 0, 0]), at("O", [0, .55, 0])];
  for (const [cx, sx] of [[-1.6, -1], [1.6, 1]] as const) {
    for (const v of [[sx * .6, -.4, .7], [sx * .6, -.4, -.7], [sx * .9, .6, 0]] as Vec[]) a.push(at("O", add([cx, 0, 0], mul(norm(v), 1.63))));
  }
  return pack([one("K"), a, one("K")], 3);
}

/** Salze, Metalloxide, Säuren und Stoffe, die das Molekülmodell nicht abdeckt */
const INORGANIC: Record<string, () => Atom3[]> = {
  NaCl: () => pair("Na", "Cl"), KCl: () => pair("K", "Cl"), AgCl: () => pair("Ag", "Cl"), KI: () => pair("K", "I"),
  MgO: () => pair("Mg", "O"), CaO: () => pair("Ca", "O"), CuO: () => pair("Cu", "O"), HgO: () => pair("Hg", "O"),
  ZnS: () => pair("Zn", "S"), FeS: () => pair("Fe", "S"),
  MgCl2: () => lin("Mg", "Cl"), CaCl2: () => lin("Ca", "Cl"), BaCl2: () => lin("Ba", "Cl"), MnCl2: () => lin("Mn", "Cl"),
  ZnCl2: () => lin("Zn", "Cl"), PbI2: () => lin("Pb", "I"), MnO2: () => lin("Mn", "O"),
  AlCl3: () => tri("Al", "Cl"), FeCl3: () => tri("Fe", "Cl"), CrCl3: () => tri("Cr", "Cl"),
  Na2O: () => bent("O", "Na", 140), Ag2O: () => bent("O", "Ag", 140),
  FeS2: () => [at("Fe", [-1.2, 0, 0]), at("S", [.45, -.5, .2]), at("S", [.45, 1.05, -.2])],
  Fe2O3: () => { const z = zig(["O", "Fe", "O", "Fe", "O"]); return z; },
  Al2O3: () => zig(["O", "Al", "O", "Al", "O"]),
  Fe3O4: () => zig(["O", "Fe", "O", "Fe", "O", "Fe", "O"]),
  P2O5: () => { const z = zig(["O", "P", "O", "P", "O"]); return [...z, at("O", [z[1][1], z[1][2] - 1.45, .3]), at("O", [z[3][1], z[3][2] - 1.45, -.3])]; },
  P4: p4, P4O10: p4o10,
  NaOH: () => hydroxide("Na", 1), KOH: () => hydroxide("K", 1), LiOH: () => hydroxide("Li", 1), "Ca(OH)2": () => hydroxide("Ca", 2),
  NaClO: () => [at("Na", [-touch("Na", "O"), 0, 0]), at("O", [0, 0, 0]), at("Cl", [1.1, .75, 0])],
  CaCO3: () => beside(CO3(), "Ca", [1, 1, 0]),
  Na2CO3: () => beside(beside(CO3(), "Na", [-1, .6, 0]), "Na", [1, .6, 0]),
  NaHCO3: () => beside(hOn(CO3(), 2), "Na", [-1, .6, 0]),
  H2SO4: () => hOn(hOn(SO4(), 1), 2),
  HNO3: () => hOn(NO3(), 2),
  H3PO4: () => hOn(hOn(hOn(PO4(), 1), 2), 3),
  Na2SO4: () => beside(beside(SO4(), "Na", [-1, 0, 0]), "Na", [1, 0, 0]),
  BaSO4: () => beside(SO4(), "Ba", [-1, 0, 0]), CaSO4: () => beside(SO4(), "Ca", [-1, 0, 0]),
  CuSO4: () => beside(SO4(), "Cu", [-1, 0, 0]), FeSO4: () => beside(SO4(), "Fe", [-1, 0, 0]),
  NaNO3: () => beside(NO3(), "Na", [1, .6, 0]), KNO3: () => beside(NO3(), "K", [1, .6, 0]), AgNO3: () => beside(NO3(), "Ag", [1, .6, 0]),
  KClO3: () => beside(ClO3(), "K", [0, 0, -1]), KMnO4: () => beside(MnO4(), "K", [-1, 0, 0]),
  Na3PO4: () => beside(beside(beside(PO4(), "Na", [-1, 0, 0]), "Na", [1, 0, 0]), "Na", [0, -1, .3]),
  "Pb(NO3)2": () => pack([NO3(), one("Pb"), NO3()]), "Ca(NO3)2": () => pack([NO3(), one("Ca"), NO3()]), "Cu(NO3)2": () => pack([NO3(), one("Cu"), NO3()]),
  "Al2(SO4)3": () => pack([SO4(), one("Al"), SO4(), one("Al"), SO4()], 3),
  "Ca3(PO4)2": () => pack([one("Ca"), PO4(), one("Ca"), PO4(), one("Ca")], 3),
  K2Cr2O7: dichromate,
};

const perp = (v: Vec): Vec => norm(Math.abs(v[0]) < .9 ? [0, -v[2], v[1]] : [-v[2], 0, v[0]]);
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/**
 * Einheitliche Ansicht, bei der möglichst kein Atom verdeckt ist (Methan: alle vier H rund um das C sichtbar):
 * 80 Blickrichtungen gleichmäßig auf der Kugel ausprobieren, die mit der besten Sichtbarkeit nehmen
 * (bei Gleichstand die schräge, räumlich wirkende). Danach längste Ausdehnung waagrecht, größtes Atom oben.
 */
/**
 * Kettenmoleküle CₙH₂ₙ₊₂ (Ethan, Propan, Butan, Pentan, Octan): als gerade Kette wie die Strukturformel
 * (übersichtlicher als Zickzack) – C in einer Reihe, die H genau darüber und darunter, an den Enden auch nach außen.
 * So ist jedes Atom ganz zu sehen.
 */
function chainView(d: Mol3D): Atom3[] | null {
  const el = d.atoms.map(a => a[0]);
  const Cs = el.flatMap((e, i) => (e === "C" ? [i] : []));
  const n = Cs.length;
  if (n < 2 || el.some(e => e !== "C" && e !== "H") || el.length - n !== 2 * n + 2) return null;
  const nb = (i: number) => d.bonds.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : []));
  // Reihenfolge entlang der Kette: von einem Ende (nur ein C-Nachbar) aus
  const order: number[] = [Cs.find(c => nb(c).filter(x => el[x] === "C").length === 1)!];
  while (order.length < n) order.push(nb(order[order.length - 1]).find(x => el[x] === "C" && !order.includes(x))!);
  const dCC = .9 * 2 * radius("C"), dCH = .85 * (radius("C") + radius("H"));
  const out: Atom3[] = d.atoms.map(a => [a[0], 0, 0, 0]);
  order.forEach((c, k) => {
    const x = (k - (n - 1) / 2) * dCC;
    out[c] = ["C", x, 0, 0];
    const hs = nb(c).filter(h => el[h] === "H");
    const spots: [number, number][] = [[0, -dCH], [0, dCH]];
    if (k === 0) spots.push([-dCH, 0]);
    if (k === n - 1) spots.push([dCH, 0]);
    hs.forEach((h, j) => { out[h] = ["H", x + spots[j][0], spots[j][1], .5]; });
  });
  return out;
}

/** in der Bildebene drehen: längste Ausdehnung waagrecht (2D-Hauptachse), größtes Atom nach oben (Wasser: O oben) */
function level(atoms: Atom3[]): Atom3[] {
  const w = atoms.map(a => radius(a[0]) ** 3), W = w.reduce((s, x) => s + x, 0);
  const c = atoms.reduce((s, a, i) => add(s, mul(pos(a), w[i] / W)), [0, 0, 0] as Vec);
  const Q = atoms.map(a => sub(pos(a), c));
  let sxx = 0, syy = 0, sxy = 0;
  Q.forEach(([x, y]) => { sxx += x * x; syy += y * y; sxy += x * y; });
  const ang = .5 * Math.atan2(2 * sxy, sxx - syy), co = Math.cos(ang), si = Math.sin(ang);
  let R: Vec[] = Q.map(([x, y, z]) => [x * co + y * si, -x * si + y * co, z]);
  // y zeigt im Bild nach unten
  const big = w.indexOf(Math.max(...w));
  if (R[big][1] > 1e-6) R = R.map(q => [q[0], -q[1], q[2]]);
  return atoms.map((a, i) => at(a[0], R[i]));
}

/**
 * Räumliche Ansicht, bei der jedes Atom möglichst gut zu sehen ist (Methan: alle vier H rund um das C):
 * 160 Blickrichtungen gleichmäßig auf der Kugel ausprobieren, bewertet nach dem am meisten verdeckten Atom
 * (dann dem Durchschnitt, leicht schräg bevorzugt, damit es räumlich wirkt).
 */
function orient(atoms: Atom3[]): Atom3[] {
  if (atoms.length === 1) return [at(atoms[0][0], [0, 0, 0])];
  const c = mul(atoms.reduce((s, a) => add(s, pos(a)), [0, 0, 0] as Vec), 1 / atoms.length);
  const P = atoms.map(a => sub(pos(a), c));
  let best: { Q: Atom3[]; score: number } | null = null;
  const N = 160, golden = Math.PI * (3 - Math.sqrt(5));
  for (let k = 0; k < N; k++) {
    const y = 1 - (k + .5) / N * 2, r = Math.sqrt(1 - y * y), t = golden * k;
    const v: Vec = [Math.cos(t) * r, y, Math.sin(t) * r];
    const ux = perp(v), uy = cross(v, ux);
    const Q = atoms.map((a, i) => at(a[0], [dot(P[i], ux), dot(P[i], uy), dot(P[i], v)]));
    const vis = visibleShare(Q);
    const tilt = P.reduce((m, p) => Math.max(m, Math.abs(dot(norm(p), v))), 0);
    const score = Math.min(...vis) + .2 * vis.reduce((s, x) => s + x, 0) / vis.length - .02 * tilt;
    if (!best || score > best.score + 1e-9) best = { Q, score };
  }
  return level(best!.Q);
}

/**
 * Ebene Zeichnung wie eine Strukturformel (aus den Daten, RDKit): für Moleküle, bei denen räumlich
 * ein Atom verdeckt wäre (Glucose, P₄O₁₀). Bindungen zwischen schweren Atomen überlappen leicht,
 * H sitzt nah an seinem Atom; Atome mit vielen Bindungen liegen vorn.
 */
export function flatView(d: Mol3D): Atom3[] {
  const F = d.flat!, el = d.atoms.map(a => a[0]);
  const len = (i: number, j: number) => Math.hypot(F[i][0] - F[j][0], F[i][1] - F[j][1]);
  const heavy = d.bonds.filter(([i, j]) => el[i] !== "H" && el[j] !== "H");
  const ratios = (heavy.length ? heavy : d.bonds).map(([i, j]) => .92 * (radius(el[i]) + radius(el[j])) / len(i, j)).sort((x, y) => x - y);
  // Maßstab: alle Bindungen überlappen; bei der festen Zeichnung (längere Außenkanten) nach der typischen Bindung
  const k = d.flatFixed ? ratios[Math.floor(ratios.length / 2)] : ratios[0];
  const P: Vec[] = F.map(([x, y]) => [x * k, -y * k, 0]);
  for (const [i, j] of d.bonds) {
    const [h, p] = el[i] === "H" ? [i, j] : el[j] === "H" ? [j, i] : [-1, -1];
    if (h < 0) continue;
    const u = norm(sub(P[h], P[p]));
    P[h] = add(P[p], mul(u, .85 * (radius("H") + radius(el[p]))));
  }
  // Auseinanderschieben: Bindungen behalten ihre Länge, nicht gebundene Atome überlappen nicht (in der Ebene)
  const bonded = new Set(d.bonds.map(([i, j]) => `${Math.min(i, j)}-${Math.max(i, j)}`));
  const target = (i: number, j: number) => (el[i] === "H" || el[j] === "H" ? .85 : .92) * (radius(el[i]) + radius(el[j]));
  // abwechselnd: alles ausgleichen, dann Bindungen nachziehen (damit keine auseinanderklafft); feste Zeichnung (P₄O₁₀) bleibt
  for (let round = 0; round < (d.flatFixed ? 0 : 8); round++) {
  for (let it = 0; it < 120; it++) {
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const dv = sub(P[j], P[i]), L = Math.hypot(dv[0], dv[1]) || 1e-6;
      const isBond = bonded.has(`${i}-${j}`), want = isBond ? target(i, j) : 1.02 * (radius(el[i]) + radius(el[j]));
      if (!isBond && L >= want) continue;
      const f = (isBond ? .5 : .3) * (L - want) / L / 2;
      P[i] = add(P[i], mul(dv, f)); P[j] = sub(P[j], mul(dv, f));
    }
  }
  for (let it = 0; it < 60; it++) for (const [i, j] of d.bonds) {
    const dv = sub(P[j], P[i]), L = Math.hypot(dv[0], dv[1]) || 1e-6, want = target(i, j);
    if (L <= want) continue;
    const f = (L - want) / L / 2;
    P[i] = add(P[i], mul(dv, f)); P[j] = sub(P[j], mul(dv, f));
  }
  }
  // Reihenfolge: Atome mit vielen Bindungen vorn (sonst verschwände z. B. das mittlere P von P₄O₁₀ hinter seinen O)
  const deg = el.map((_, i) => d.bonds.filter(([a, b]) => a === i || b === i).length);
  // liegt ein Atom mitten auf seinem Nachbarn (zeigt zum Betrachter, z. B. das obere O von P₄O₁₀), ganz nach vorn
  d.bonds.forEach(([i, j]) => {
    const L = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]);
    if (L < .8 * Math.max(radius(el[i]), radius(el[j]))) deg[radius(el[i]) < radius(el[j]) ? i : j] = 99;
  });
  return level(el.map((e, i) => at(e, [P[i][0], P[i][1], (deg[i] - radius(e) / 10) * .01])));
}

/**
 * Wie viel von jedem Atom im Bild zu sehen ist (0–1): Punkte auf der Kreisscheibe, verdeckt, wenn ein
 * weiter vorn liegendes Atom (größeres z) darüber liegt. Atome in derselben Tiefe: das später gezeichnete deckt.
 */
export function visibleShare(atoms: Atom3[]): number[] {
  const order = atoms.map((_, i) => i).sort((i, j) => atoms[i][3] - atoms[j][3]);
  const rank = new Map(order.map((i, k) => [i, k]));
  const pts: [number, number][] = [];
  for (let r = 1; r <= 4; r++) for (let k = 0; k < 6 * r; k++) { const t = 2 * Math.PI * k / (6 * r); pts.push([Math.cos(t) * r / 4.2, Math.sin(t) * r / 4.2]); }
  pts.push([0, 0]);
  return atoms.map(([el, x, y], i) => {
    const R = radius(el);
    let seen = 0;
    for (const [u, v] of pts) {
      const px = x + u * R, py = y + v * R;
      if (!atoms.some((b, j) => rank.get(j)! > rank.get(i)! && Math.hypot(px - b[1], py - b[2]) < radius(b[0]))) seen++;
    }
    return seen / pts.length;
  });
}

const cache = new Map<string, Atom3[]>();

/** 3D-Anordnung eines Stoffs (ausgerichtet; y nach unten, z zum Betrachter) */
export function atoms3D(f: string): Atom3[] {
  if (cache.has(f)) return cache.get(f)!;
  let raw: Atom3[];
  // Moleküle: berechnete Lage (MMFF94) aus @lern/chem; Bindungen etwas gestreckt (× 1,15):
  // Kalottenmodell bleibt, aber kein Atom verschwindet fast ganz hinter einem anderen
  // (höchstens so weit, dass gebundene Kugeln sich noch überlappen – sonst fiele z. B. Cl₂ auseinander)
  const d = MOL3D[f];
  if (d) {
    const k = Math.min(1.15, ...d.bonds.map(([i, j]) => {
      const [ei, ...pi] = d.atoms[i], [ej, ...pj] = d.atoms[j];
      return .9 * (radius(ei) + radius(ej)) / Math.hypot(pi[0] - pj[0], pi[1] - pj[1], pi[2] - pj[2]);
    }));
    raw = d.atoms.map(([el, x, y, z]) => at(el, mul([x, y, z], k)));
  }
  else if (INORGANIC[f]) raw = INORGANIC[f]();
  else {
    const els = Object.entries(parseFormula(f)).flatMap(([el, n]) => Array.from({ length: n }, () => el));
    raw = els.length === 1 ? one(els[0]) : zig(els);
  }
  const chain = d && chainView(d);
  let out = chain ?? orient(raw);
  // Jedes Atom muss gut zu sehen sein (Vorrang vor echtem 3D): sonst die ebene Zeichnung wie eine Strukturformel
  if (!chain && d?.flat && Math.min(...visibleShare(out)) < .7) {
    const flat = flatView(d);
    // nur, wenn in der Ebene alle Bindungen halten (P₄ als Tetraeder geht flach nicht)
    const holds = d.bonds.every(([i, j]) => Math.hypot(flat[i][1] - flat[j][1], flat[i][2] - flat[j][2]) < radius(flat[i][0]) + radius(flat[j][0]));
    if ((holds || d.flatFixed) && Math.min(...visibleShare(flat)) > Math.min(...visibleShare(out))) out = flat;
  }
  cache.set(f, out);
  return out;
}

/** nur für Tests: gibt es eine eigene Anordnung? */
export const hasShape = (f: string) => !!(MOL3D[f] || INORGANIC[f]) || Object.values(parseFormula(f)).reduce((a, b) => a + b, 0) === 1;
