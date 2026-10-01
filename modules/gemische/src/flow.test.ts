import { test, assert } from "vitest";
import { parseFormula } from "@lern/chem";
import { EXAMPLES, analyse } from "./mixtures.ts";
import { ACID, SHAKE, STIR, boundaryY, gasTarget, openBottle, liquidLevel, makeWorld, oilOnTop, separatedFlow, settledFlow, shakeWorld, startMixing, stepFlow, type FP, type World } from "./flow.ts";

const ex = (id: string) => EXAMPLES.find(e => e.id === id)!;
const counts = (w: World) => { const c: Record<string, number> = {}; for (const p of w.ps) c[p.f] = (c[p.f] ?? 0) + 1; return c; };
const inside = (w: World) => w.ps.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= w.W && p.y >= 0 && p.y <= w.H);
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const atomCounts = (w: World) => {
  const c: Record<string, number> = {};
  for (const p of w.ps) for (const [el, n] of Object.entries(parseFormula(p.f))) c[el] = (c[el] ?? 0) + (n as number);
  return c;
};
test("alle Beispiele: gleiche Teilchen vorher und nachher, alle im Gefäß, nichts überlappt stark", () => {
  for (const e of EXAMPLES) for (const phase of ["nachher", "vorher"] as const) {
    const w = makeWorld(e, 5, phase);
    assert.strictEqual(w.ps.length, analyse(e.items).teilchen, e.id);
    assert.deepEqual(counts(w), Object.fromEntries(e.items), `${e.id} ${phase}`);
    if (e.before) startMixing(w); else shakeWorld(w);
    for (let k = 0; k < 600; k++) stepFlow(w);
    assert.ok(inside(w), `${e.id} ${phase}: Teilchen außerhalb`);
    // Atome bleiben erhalten (beim Sprudel wird aus CO₂ und Wasser zum Teil Kohlensäure – die Moleküle ändern sich)
    assert.deepEqual(atomCounts(w), atomCounts(makeWorld(e, 5, phase)), `${e.id}: Atome verloren`);
    if (e.id !== "sprudel") assert.deepEqual(counts(w), Object.fromEntries(e.items), `${e.id}: Teilchen verloren`);
    // im Mittel kaum Überlappung
    let close = 0;
    for (const p of w.ps) for (const q of w.ps) if (p.id < q.id && !p.gas && !q.gas && Math.hypot(p.x - q.x, p.y - q.y) < w.rc) close++;
    assert.ok(close < w.ps.length * .05, `${e.id}: ${close} Teilchen übereinander`);
  }
}, 60_000);

test("Bewegung ist fließend: kleine Schritte je Bild, keine Sprünge", () => {
  for (const e of EXAMPLES) {
    const w = makeWorld(e, 2);
    for (let k = 0; k < 300; k++) {
      // nach Nummer (beim Sprudel entstehen und verschwinden Teilchen: Kohlensäure)
      const before = new Map(w.ps.map(p => [p.id, [p.x, p.y]]));
      stepFlow(w);
      const jump = Math.max(...w.ps.map(p => { const b = before.get(p.id); return b ? Math.hypot(p.x - b[0], p.y - b[1]) : 0; }));
      assert.ok(jump < w.rc * 1.2, `${e.id}: Sprung ${jump.toFixed(2)}`);
    }
  }
}, 60_000);

/** Hauptknopf so oft drücken, bis alles gelöst ist (Umrühren bzw. Schütteln) */
function mixUntilDone(w: World, id: string) {
  let k = 0;
  while (!settledFlow(w) && k < 3000) {
    if (w.stir === 0 && w.shake === 0 && k % 240 === 0) { if (id === "sprudel") shakeWorld(w); else w.stir = STIR; }
    stepFlow(w); k++;
  }
  return k;
}

test("Mischen: Zucker, Alkohol und CO₂ verteilen sich gleichmäßig; der Vorgang kommt zur Ruhe", () => {
  for (const id of ["zucker", "alkohol", "sprudel"]) for (let seed = 1; seed <= 5; seed++) {
    const e = ex(id), w = makeWorld(e, seed, "vorher");
    mixUntilDone(w, id);
    assert.ok(settledFlow(w), `${id}: nicht fertig (Startwert ${seed})`);
    // Zucker und Alkohol: noch einmal umrühren; Sprudel (nur Schütteln möglich): in Ruhe verteilen lassen
    if (id === "sprudel") for (let j = 0; j < 900; j++) stepFlow(w);
    else { w.stir = STIR; for (let j = 0; j < 400; j++) stepFlow(w); }
    const hl = liquidLevel(w);
    // nur Gelöstes (beim Sprudel bleibt im Gleichgewicht etwas CO₂ im Gasraum)
    const d = mean(w.ps.filter(p => p.f !== e.solute).map(p => p.y)) - mean(w.ps.filter(p => p.f === e.solute && !p.gas).map(p => p.y));
    assert.ok(Math.abs(d) < hl * .12, `${id}: nicht gemischt (${(d / hl).toFixed(2)})`);
  }
}, 120_000);

/** Zeitschritte, bis sich der Zuckerkristall ganz gelöst hat */
function dissolve(temp: number, stir: boolean, seed: number) {
  const w = makeWorld(ex("zucker"), seed, "vorher");
  w.temp = temp;
  let k = 0, loose = 0;
  while (w.ps.some(p => p.bound) && k < 20000) {
    if (stir && w.stir === 0) w.stir = STIR;
    stepFlow(w); k++;
    // von außen nach innen: Kristallteilchen ohne Nachbarn im Kristall gibt es höchstens vereinzelt
    const b = w.ps.filter(p => p.bound), at = new Set(b.map(p => `${p.gi},${p.gj}`));
    loose = Math.max(loose, b.filter(p => ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, c]) => at.has(`${p.gi! + a},${p.gj! + c}`))).length);
  }
  return { k, loose };
}

test("Zucker: geordneter Kristall, löst sich von selbst von außen; warm und gerührt schneller", () => {
  const w = makeWorld(ex("zucker"), 1, "vorher");
  const crystal = w.ps.filter(p => p.bound);
  assert.strictEqual(crystal.length, 30);
  assert.ok(crystal.every(p => p.a === 0), "alle gleich ausgerichtet");
  assert.strictEqual(new Set(crystal.map(p => p.gj)).size * new Set(crystal.map(p => p.gi)).size >= 30, true, "Gitter");
  // ohne Rühren: löst sich von selbst, aber langsam (etwa eine halbe Minute)
  const slow = [1, 2, 3].map(s => dissolve(20, false, s));
  for (const r of slow) { assert.ok(r.k < 20000, "löst sich nicht"); assert.ok(r.k > 600, `zu schnell (${r.k})`); assert.ok(r.loose <= 3, `zerfällt nicht von außen (${r.loose})`); }
  const avg = (rs: { k: number }[]) => rs.reduce((s, r) => s + r.k, 0) / rs.length;
  const warm = avg([1, 2, 3].map(s => dissolve(80, false, s))), stirred = avg([1, 2, 3].map(s => dissolve(20, true, s)));
  assert.ok(warm < avg(slow) * .5, `warm nicht schneller (${warm} / ${avg(slow)})`);
  assert.ok(stirred < avg(slow) * .5, `gerührt nicht schneller (${stirred} / ${avg(slow)})`);
  const cold = avg([1, 2].map(s => dissolve(0, false, s)));
  assert.ok(cold > avg(slow) * 1.5, "kalt nicht langsamer");
}, 240_000);

test("Sprudel: nach einmal Schütteln ist das Gleichgewicht erreicht – kalt bleibt wenig CO₂ im Gasraum, warm mehr", () => {
  const left: number[] = [];
  for (const T of [0, 20, 100]) {
    const w = makeWorld(ex("sprudel"), 2, "vorher");
    w.temp = T;
    shakeWorld(w);
    for (let k = 0; k < SHAKE + 60; k++) stepFlow(w);
    const n = w.ps.filter(p => p.gas).length;
    assert.ok(Math.abs(n - gasTarget(w)) <= 2, `${T} °C: ${n} im Gasraum, Gleichgewicht ${gasTarget(w)}`);
    // bleibt im Gleichgewicht (Austausch, aber keine Drift)
    for (let k = 0; k < 1800; k++) stepFlow(w);
    assert.ok(Math.abs(w.ps.filter(p => p.gas).length - gasTarget(w)) <= 3, `${T} °C: driftet weg`);
    left.push(n);
  }
  assert.ok(left[0] < left[1] && left[1] < left[2], `kalt löst mehr: ${left.join(" < ")}`);
  // deutlich zu sehen: warm mindestens die Hälfte des CO₂ mehr im Gasraum als kalt
  assert.ok(left[2] - left[0] >= 20, `Unterschied kalt/warm zu klein: ${left.join(" / ")}`);
}, 60_000);

test("Sprudel: erwärmt perlt CO₂ aus, gelöstes verteilt sich im ganzen Wasser", () => {
  // gelöstes CO₂ und Kohlensäure im Mittel so tief wie das Wasser (drei Startwerte, sonst zu wenige Teilchen für einen Mittelwert)
  const diff: number[] = [];
  let w = makeWorld(ex("sprudel"), 3, "vorher");
  for (const seed of [3, 5, 6]) {
    w = makeWorld(ex("sprudel"), seed, "vorher");
    shakeWorld(w);
    for (let k = 0; k < 900; k++) stepFlow(w);
    const hl = liquidLevel(w), depth = (f: (p: FP) => boolean) => mean(w.ps.filter(p => !p.gas && f(p)).map(p => (p.y - w.top) / hl));
    diff.push(depth(p => p.f === "CO2" || p.f === ACID) - depth(p => p.f === "H2O"));
  }
  assert.ok(Math.abs(mean(diff)) < .08, `CO₂ nicht verteilt (${diff.map(d => d.toFixed(2)).join(", ")})`);
  const cold = w.ps.filter(p => p.gas).length;
  w.temp = 90;
  for (let k = 0; k < 1200; k++) stepFlow(w);
  assert.ok(w.ps.filter(p => p.gas).length > cold + 15, `warm: ${w.ps.filter(p => p.gas).length} statt mehr als ${cold + 15}`);
}, 60_000);

test("Sprudel: geöffnet entweicht das CO₂ – geschüttelt viel schneller; Kohlensäure bildet sich und zerfällt", () => {
  const aq = (w: World) => w.ps.filter(p => !p.gas && (p.f === "CO2" || p.f === ACID)).length;
  const left: number[] = [];
  let acidSeen = 0;
  for (const shake of [false, true]) {
    const w = makeWorld(ex("sprudel"), 4, "vorher");
    shakeWorld(w);
    for (let k = 0; k < 1200; k++) { stepFlow(w); acidSeen = Math.max(acidSeen, w.ps.filter(p => p.f === ACID).length); }
    const before = aq(w);
    openBottle(w);
    if (shake) shakeWorld(w);
    for (let k = 0; k < 600; k++) stepFlow(w);
    assert.ok(aq(w) < before, `${shake ? "geschüttelt" : "ruhig"}: nichts entwichen`);
    assert.ok(!w.ps.some(p => p.gas && p.y < -3 * w.rc), "Gas außerhalb des Bilds nicht entfernt");
    left.push(aq(w));
  }
  assert.ok(left[1] < left[0] / 3, `geschüttelt nicht schneller: ${left.join(" / ")}`);
  assert.ok(acidSeen >= 1, "keine Kohlensäure");
}, 60_000);

test("Sprudel: abgekühlt löst sich das CO₂ zügig wieder (ohne Schütteln)", () => {
  const w = makeWorld(ex("sprudel"), 2, "vorher");
  w.temp = 100;
  shakeWorld(w);
  for (let k = 0; k < 900; k++) stepFlow(w);
  const hot = w.ps.filter(p => p.gas).length;
  w.temp = 0;
  for (let k = 0; k < 600; k++) stepFlow(w);
  const cold = w.ps.filter(p => p.gas).length;
  assert.ok(hot >= 28 && cold <= 12, `100 °C: ${hot}, nach 10 s bei 0 °C: ${cold}`);
}, 60_000);

test("Sprudel: CO₂ löst sich von selbst langsam, geschüttelt schnell", () => {
  const gas = (w: World) => w.ps.filter(p => p.gas).length;
  const a = makeWorld(ex("sprudel"), 1, "vorher"), b = makeWorld(ex("sprudel"), 1, "vorher");
  for (let k = 0; k < 600; k++) stepFlow(a);
  shakeWorld(b);
  for (let k = 0; k < 600; k++) stepFlow(b);
  assert.ok(gas(a) < 40 && gas(a) > 20, `von selbst: ${gas(a)} Gas`);
  assert.ok(gas(b) < gas(a) / 2, `geschüttelt: ${gas(b)} Gas`);
});

test("Umrühren: die Flüssigkeit bleibt überall etwa gleich dicht (kein Stau an Wand oder Kristall)", () => {
  for (const [id, phase] of [["wasser", "nachher"], ["alkohol", "vorher"], ["zucker", "vorher"]] as const) {
    const w = makeWorld(ex(id), 2, phase);
    const worst: number[] = [];
    for (let k = 1; k <= 480; k++) {
      if (w.stir === 0) w.stir = STIR;
      stepFlow(w);
      if (k < 120 || k % 30) continue;
      // Belegung in 4 × 3 Feldern oberhalb des Kristalls
      const floor = Math.min(w.H, ...w.ps.filter(p => p.bound).map(p => p.y - (p.rad ?? w.rc)));
      const cells = Array(12).fill(0);
      for (const p of w.ps) {
        if (p.gas || p.bound || p.y > floor) continue;
        const i = Math.min(3, Math.floor(p.x / w.W * 4)), j = Math.min(2, Math.floor((p.y - w.top) / (floor - w.top) * 3));
        cells[j * 4 + i] += (p.rad ?? w.rc) ** 2;
      }
      const m = mean(cells);
      worst.push(Math.max(...cells.map(c => Math.abs(c / m - 1))));
    }
    // je Feld nur etwa 15 Teilchen (Zucker zählt 3-fach): einzelne Ausreißer sind Zufall – im Mittel klein, nie ein Stau (doppelt so dicht)
    assert.ok(mean(worst) < .5, `${id}: im Mittel ungleich dicht (${mean(worst).toFixed(2)})`);
    assert.ok(Math.max(...worst) < .95, `${id}: Stau (${Math.max(...worst).toFixed(2)})`);
  }
}, 120_000);

test("Öl und Wasser: nach dem Schütteln gemischt, danach wieder getrennt (Öl oben, Grenze gerade)", () => {
  for (let seed = 1; seed <= 5; seed++) {
    const w = makeWorld(ex("oel"), seed);
    assert.ok(separatedFlow(w), "Anfang getrennt");
    shakeWorld(w);
    for (let k = 0; k < 50; k++) stepFlow(w);
    assert.ok(oilOnTop(w) < .9, `nach dem Schütteln noch getrennt (${oilOnTop(w).toFixed(2)})`);
    let k = 0;
    while (!separatedFlow(w) && k < 1800) { stepFlow(w); k++; }
    assert.ok(separatedFlow(w), `entmischt sich nicht (Startwert ${seed})`);
    assert.ok(k > 60, "entmischt sich zu schnell (soll sichtbar aufsteigen)");
    const y = boundaryY(w);
    assert.ok(y > w.top && y < w.H);
  }
}, 60_000);

test("Öl und Wasser: geschüttelt fein verteilt (keine Klumpen), danach sammeln sich Tröpfchen", () => {
  // Anteil Öl unter den 6 nächsten Nachbarn eines Ölmoleküls, bezogen auf den Zufall (1 = ganz gleichmäßig verteilt)
  const clumping = (w: World) => {
    const oil = w.ps.filter(p => p.f === "C12H26"), share = (oil.length - 1) / (w.ps.length - 1);
    const dist = (p: FP, q: FP) => Math.hypot(q.x - p.x, q.y - p.y);
    let same = 0;
    for (const p of oil) same += w.ps.filter(q => q !== p).sort((a, b) => dist(p, a) - dist(p, b)).slice(0, 6).filter(q => q.f === "C12H26").length / 6;
    return same / oil.length / share;
  };
  const shaken: number[] = [], later: number[] = [];
  for (let seed = 1; seed <= 4; seed++) {
    const w = makeWorld(ex("oel"), seed);
    const start = clumping(w);
    shakeWorld(w);
    while (w.shake > 0) stepFlow(w);
    shaken.push(clumping(w));
    assert.ok(shaken[shaken.length - 1] < start * .7, `nicht fein verteilt (${start.toFixed(2)} → ${shaken[shaken.length - 1].toFixed(2)})`);
    for (let k = 0; k < 90; k++) stepFlow(w);
    later.push(clumping(w));
  }
  assert.ok(mean(shaken) < 2, `beim Schütteln Klumpen (${shaken.map(x => x.toFixed(2)).join(", ")})`);
  assert.ok(mean(later) > mean(shaken) * 1.2, `danach keine Tröpfchen (${later.map(x => x.toFixed(2)).join(", ")})`);
}, 60_000);

test("Öl: am Anfang liegen keine Stäbe übereinander (gekreuzte Stäbe ließen sich nicht mehr trennen)", () => {
  // kleinster Abstand zweier Strecken, abgetastet
  const ends = (p: FP) => { const c = Math.cos(p.a) * p.len!, s = Math.sin(p.a) * p.len!; return [p.x - c, p.y - s, p.x + c, p.y + s]; };
  const gap = (a: number[], b: number[]) => {
    let m = Infinity;
    for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) {
      const s = i / 12, t = j / 12;
      m = Math.min(m, Math.hypot(a[0] + (a[2] - a[0]) * s - b[0] - (b[2] - b[0]) * t, a[1] + (a[3] - a[1]) * s - b[1] - (b[3] - b[1]) * t));
    }
    return m;
  };
  for (let seed = 1; seed <= 5; seed++) {
    const oil = makeWorld(ex("oel"), seed).ps.filter(p => p.len);
    for (let i = 0; i < oil.length; i++) for (let j = i + 1; j < oil.length; j++)
      assert.ok(gap(ends(oil[i]), ends(oil[j])) > .5 * (oil[i].cap! + oil[j].cap!), `Stäbe ${oil[i].id} und ${oil[j].id} überlappen (Startwert ${seed})`);
  }
});

test("Gase: Trennwände halten die Teilchen zurück; ohne Wände mischen sie sich", () => {
  for (const id of ["schutzgas", "erdgas", "modell"]) {
    const e = ex(id), w = makeWorld(e, 3, "vorher");
    const side = (x: number) => w.walls.filter(v => x > v).length;
    const home = new Map(w.ps.map(p => [p.id, side(p.x)]));
    for (let k = 0; k < 300; k++) stepFlow(w);
    assert.ok(w.ps.every(p => side(p.x) === home.get(p.id)), `${id}: durch die Trennwand`);
    const walls = w.walls.slice();
    startMixing(w);
    for (let k = 0; k < 1500; k++) stepFlow(w);
    const moved = w.ps.filter(p => walls.filter(v => p.x > v).length !== home.get(p.id)).length;
    // gleichmäßig verteilt wären so viele im Bereich eines anderen Stoffs
    const n = w.ps.length, expected = e.items.reduce((s, [, k]) => s + k * (1 - k / n), 0);
    assert.ok(moved > expected * .7, `${id}: nur ${moved} von ${expected.toFixed(0)} Teilchen gewandert`);
  }
}, 60_000);

test("Messing: beim Erstarren gleiten die Atome auf ihre Plätze, keiner springt", () => {
  for (let seed = 1; seed <= 3; seed++) {
    const w = makeWorld(ex("messing"), seed, "vorher");
    startMixing(w);
    const prev = new Map(w.ps.map(p => [p.id, [p.x, p.y]]));
    let jump = 0;
    for (let k = 0; k < 800; k++) {
      stepFlow(w);
      for (const p of w.ps) { const [x, y] = prev.get(p.id)!; jump = Math.max(jump, Math.hypot(p.x - x, p.y - y) / w.rc); prev.set(p.id, [p.x, p.y]); }
    }
    assert.ok(jump < 1, `Sprung ${jump.toFixed(2)} Radien`);
  }
});

test("Messing: vorher zwei Blöcke, geschmolzen gemischt, danach wieder ein Gitter", () => {
  const w = makeWorld(ex("messing"), 4, "vorher");
  const split = w.walls[0];
  assert.ok(split > 0);
  startMixing(w);
  let k = 0;
  while (!settledFlow(w) && k < 1000) { stepFlow(w); k++; }
  assert.ok(settledFlow(w) && w.ps.every(p => p.bound));
  const homes = new Set(w.ps.map(p => `${p.hx},${p.hy}`));
  assert.strictEqual(homes.size, w.ps.length, "zwei Atome auf einem Platz");
  for (let j = 0; j < 200; j++) stepFlow(w);
  assert.ok(w.ps.every(p => Math.hypot(p.x - p.hx!, p.y - p.hy!) < w.rc * .6), "nicht am Gitterplatz");
  // Zink nicht mehr nur rechts
  const xs = w.ps.filter(p => p.f === "Zn").map(p => p.x);
  assert.ok(Math.min(...xs) < w.W / 3, "nicht gemischt");
}, 60_000);

test("Temperatur: je wärmer, desto schneller bewegen sich die Teilchen", () => {
  const dist = (id: string, temp: number) => {
    const w = makeWorld(ex(id), 7);
    w.temp = temp;
    for (let k = 0; k < 120; k++) stepFlow(w);
    const start = w.ps.map(p => [p.x, p.y]);
    for (let k = 0; k < 300; k++) stepFlow(w);
    return w.ps.reduce((s, p, i) => s + Math.hypot(p.x - start[i][0], p.y - start[i][1]), 0) / w.ps.length;
  };
  for (const id of ["wasser", "helium"]) assert.ok(dist(id, 100) > dist(id, 0) * 1.1, id);
}, 60_000);
