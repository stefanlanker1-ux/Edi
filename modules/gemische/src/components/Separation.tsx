// Trennverfahren als Animation (Lernen, Kapitel Stofftrennung): Auslesen, Sieben, Magnet, Dekantieren, Filtrieren, Eindampfen,
// Destillieren, Chromatografie. Jedes Bild ist eine reine Funktion des Fortschritts t (0 = vorher, 1 = getrennt) – so lässt es sich
// abspielen, an einer Stelle anhalten (Auswahlbild) und prüfen. Teile tragen `data-part` (Rückstand, Filtrat, Destillat …):
// Ziele für Beschriftungen und für Aufgaben zum Antippen. Farben nur aus der Palette; bei reduzierter Bewegung gleich das Endbild.

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { IconButton, useReducedMotion } from "@lern/ui";
import { tr } from "@lern/i18n";

export type Method = "auslesen" | "sieben" | "magnet" | "dekantieren" | "filtrieren" | "eindampfen" | "destillieren" | "chromatografie";
export const METHODS: Method[] = ["auslesen", "sieben", "magnet", "dekantieren", "filtrieren", "eindampfen", "destillieren", "chromatografie"];

export const METHOD_NAME = (m: Method) => ({
  auslesen: tr("Auslesen", "Picking out"), sieben: tr("Sieben", "Sieving"), magnet: tr("Magnet\u00adtrennung", "Magnetic separation"),
  dekantieren: tr("Dekantieren", "Decanting"), filtrieren: tr("Filtrieren", "Filtering"), eindampfen: tr("Eindampfen", "Evaporating"),
  destillieren: tr("Destillieren", "Distilling"), chromatografie: tr("Chromato\u00adgrafie", "Chromato\u00adgraphy"),
})[m];

/** Was im Bild getrennt wird (für Vorlesen und Aufgabentexte) */
export const METHOD_MIX = (m: Method) => ({
  auslesen: tr("Erbsen und Linsen", "peas and lentils"), sieben: tr("Sand und Kies", "sand and gravel"), magnet: tr("Eisenpulver und Schwefel", "iron powder and sulfur"),
  dekantieren: tr("Sand und Wasser", "sand and water"), filtrieren: tr("Sand und Wasser", "sand and water"), eindampfen: tr("Salzwasser", "salt water"),
  destillieren: tr("Salzwasser", "salt water"), chromatografie: tr("Filzstift-Farbe", "felt-tip ink"),
})[m];

const W = 240, H = 170;
const clamp = (x: number) => Math.min(1, Math.max(0, x));
/** Abschnitt a…b von t auf 0…1, sanft */
const seg = (t: number, a: number, b: number) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** feste Pseudo-Zufallszahlen (gleiches Bild bei jedem Aufruf) */
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** Becherglas (offen) mit Ausguss, Innenraum x0…x1, Boden bei y1 */
const beakerPath = (x0: number, y0: number, x1: number, y1: number) => `M${x0 - 4} ${y0 - 2} L${x0} ${y0} L${x0} ${y1 - 3} Q${x0} ${y1} ${x0 + 3} ${y1} L${x1 - 3} ${y1} Q${x1} ${y1} ${x1} ${y1 - 3} L${x1} ${y0}`;
const Beaker = ({ x0, y0, x1, y1, part }: { x0: number; y0: number; x1: number; y1: number; part?: string }) => <path className="sp-glass" d={beakerPath(x0, y0, x1, y1)} data-part={part} />;
/** Flamme eines Brenners, flackert leicht */
const Flame = ({ x, y, t, on = true }: { x: number; y: number; t: number; on?: boolean }) => {
  if (!on) return null;
  const f = 1 + .08 * Math.sin(t * 90);
  return (
    <g data-part="flamme">
      <path className="sp-flame" d={`M${x - 7} ${y} Q${x - 8} ${y - 12 * f} ${x} ${y - 22 * f} Q${x + 8} ${y - 12 * f} ${x + 7} ${y} Z`} />
      <path className="sp-flame-in" d={`M${x - 3} ${y} Q${x - 3} ${y - 7} ${x} ${y - 12 * f} Q${x + 3} ${y - 7} ${x + 3} ${y} Z`} />
      <rect className="sp-burner" x={x - 6} y={y} width={12} height={14} rx={1} />
    </g>
  );
};

function auslesen(t: number) {
  // Teller mit Erbsen (grün, rund) und Linsen (orange, flach); eine Pinzette legt die Erbsen nacheinander in die Schale rechts
  const peas = Array.from({ length: 6 }, (_, i) => ({ x: 40 + rnd(i) * 70, y: 112 + rnd(i + 9) * 18 }));
  const lentils = Array.from({ length: 12 }, (_, i) => ({ x: 34 + rnd(i + 30) * 84, y: 110 + rnd(i + 50) * 22, a: rnd(i + 70) * 180 }));
  const at = (i: number) => {
    const k = seg(t, .08 + i * .14, .2 + i * .14), tx = 168 + (i % 3) * 14, ty = 128 + Math.floor(i / 3) * 9;
    return { x: lerp(peas[i].x, tx, k), y: lerp(peas[i].y, ty, k) - Math.sin(k * Math.PI) * 40, moving: k > 0 && k < 1 };
  };
  const mv = peas.map((_, i) => at(i)).find(p => p.moving);
  return (
    <>
      <ellipse className="sp-plate" cx={76} cy={124} rx={58} ry={18} />
      <path className="sp-bowl" d="M140 118 Q140 150 182 150 Q224 150 224 118 Z" data-part="schale" />
      <g data-part="linsen">{lentils.map((l, i) => <ellipse key={i} className="sp-lentil" cx={l.x} cy={l.y} rx={4.5} ry={2.6} transform={`rotate(${l.a} ${l.x} ${l.y})`} />)}</g>
      <g data-part="erbsen">{peas.map((_, i) => { const p = at(i); return <circle key={i} className="sp-pea" cx={p.x} cy={p.y} r={5} />; })}</g>
      {mv && <path className="sp-tool" d={`M${mv.x - 2} ${mv.y - 5} L${mv.x - 10} ${mv.y - 50} M${mv.x + 2} ${mv.y - 5} L${mv.x - 4} ${mv.y - 50}`} />}
    </>
  );
}

function sieben(t: number) {
  // Sieb schüttelt; die Maschen (Drähte im Querschnitt) lassen nur Körner durch, die kleiner als die Lücken sind:
  // Sandkörner rutschen zur nächsten Lücke, fallen hindurch und häufen sich in der Schale; Kiesel bleiben liegen
  const shake = Math.sin(t * 70) * 4 * (1 - seg(t, .78, .92));
  const wires = Array.from({ length: 19 }, (_, i) => 48 + i * 8);
  const stones = [62, 86, 110, 134, 158, 180].map((x, i) => ({ x: x + rnd(i) * 3, y: 56.5 }));
  const grains = Array.from({ length: 56 }, (_, i) => {
    const x0 = 52 + rnd(i + 20) * 136, gx = 52 + Math.min(17, Math.max(0, Math.floor((x0 - 48) / 8))) * 8;
    const ts = .06 + rnd(i + 40) * .62, slide = seg(t, ts, ts + .07), fall = clamp((t - ts - .07) / .12);
    // Sand häuft sich in der Mitte der Schale
    const lx = 120 + (gx - 120) * .5 + (rnd(i + 90) - .5) * 10, heap = Math.max(0, 1 - ((lx - 120) / 46) ** 2);
    const land = 149 - rnd(i + 80) * 2 - heap * rnd(i + 70) * 8;
    const onSieve = fall <= 0;
    return {
      x: onSieve ? lerp(x0, gx, slide) + shake : lerp(gx, lx, seg(fall, .55, 1)),
      y: onSieve ? lerp(62 - rnd(i + 60) * 4, 63, slide) : lerp(63, land, fall * fall),
    };
  });
  return (
    <>
      <path className="sp-bowl" d="M52 120 Q52 152 120 152 Q188 152 188 120 Z" data-part="schale" />
      <g transform={`translate(${shake} 0)`} data-part="sieb">
        <path className="sp-frame" d="M44 40 L44 66 M196 66 L196 40" />
        {wires.map(x => <circle key={x} className="sp-wire" cx={x} cy={66} r={2} />)}
      </g>
      <g data-part="sand">{grains.map((g, i) => <circle key={i} className="sp-sand" cx={g.x} cy={g.y} r={1.6} />)}</g>
      <g data-part="kies" transform={`translate(${shake} 0)`}>{stones.map((s, i) => <circle key={i} className="sp-stone" cx={s.x} cy={s.y} r={7} />)}</g>
    </>
  );
}

function magnet(t: number) {
  // Magnet senkt sich über das Gemenge, Eisenteilchen springen hoch und haften, Magnet hebt sie heraus; Schwefel bleibt liegen
  const down = seg(t, 0, .3), up = seg(t, .65, 1);
  const my = lerp(10, 66, down) - up * 50;
  const iron = Array.from({ length: 14 }, (_, i) => ({ x: 70 + rnd(i) * 100, y: 120 + rnd(i + 5) * 16, a: rnd(i + 9) * 180 }));
  const sulfur = Array.from({ length: 16 }, (_, i) => ({ x: 66 + rnd(i + 30) * 108, y: 118 + rnd(i + 45) * 20 }));
  const pole = (i: number) => (i % 2 ? 132 : 108) + (rnd(i + 90) - .5) * 14;
  return (
    <>
      <ellipse className="sp-plate" cx={120} cy={128} rx={64} ry={16} />
      <g data-part="schwefel">{sulfur.map((s, i) => <circle key={i} className="sp-sulfur" cx={s.x} cy={s.y} r={2.6} />)}</g>
      <g data-part="eisen">{iron.map((p, i) => {
        const k = seg(t, .3 + rnd(i + 99) * .2, .4 + rnd(i + 99) * .2);
        const x = lerp(p.x, pole(i), k), y = lerp(p.y, my + 42 + rnd(i + 7) * 5, k);
        return <line key={i} className="sp-iron" x1={x - 3} y1={y} x2={x + 3} y2={y} transform={`rotate(${lerp(p.a, 90, k)} ${x} ${y})`} />;
      })}</g>
      <g data-part="magnet" transform={`translate(0 ${my})`}>
        <path className="sp-magnet" d="M100 0 L100 34 Q100 40 108 40 L112 40 L112 12 L128 12 L128 40 L132 40 Q140 40 140 34 L140 0 Z" />
        <rect className="sp-magnet-pole" x={100} y={30} width={12} height={10} /><rect className="sp-magnet-pole" x={128} y={30} width={12} height={10} />
      </g>
    </>
  );
}

function dekantieren(t: number, id: string) {
  // Sand hat sich abgesetzt; das Glas kippt, das klare Wasser fließt ins zweite Glas, der Sand bleibt zurück
  const tilt = seg(t, 0, .2) * (1 - seg(t, .85, 1)), pour = seg(t, .2, .85);
  const ang = -38 * tilt, cx = 104, cy = 54; // Drehpunkt am Ausguss
  const rot = (x: number, y: number) => { const a = ang * Math.PI / 180, dx = x - cx, dy = y - cy; return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)]; };
  // Wasserspiegel im gekippten Glas (waagrecht), sinkt beim Ausgießen
  const surf = lerp(78, 112, pour);
  const inner = [[44, 54], [44, 128], [104, 128], [104, 54]].map(([x, y]) => rot(x, y));
  const flow = tilt > .9 && pour > 0 && pour < 1;
  const lip = rot(104, 54);
  const level = lerp(140, 112, pour);
  return (
    <>
      <defs><clipPath id={`${id}-in`}><path d={`M${inner.map(p => p.join(" ")).join(" L")} Z`} /></clipPath></defs>
      <rect className="sp-water" x={0} y={surf} width={W} height={H} clipPath={`url(#${id}-in)`} data-part="wasser" />
      <g transform={`rotate(${ang} ${cx} ${cy})`}>
        <path className="sp-sand-layer" d="M44 116 Q74 110 104 116 L104 125 Q104 128 101 128 L47 128 Q44 128 44 125 Z" data-part="sand" />
        <Beaker x0={44} y0={54} x1={104} y1={128} />
      </g>
      {flow && <path className="sp-stream" d={`M${lip[0]} ${lip[1]} Q${lip[0] + 40} ${lip[1] - 2} ${lip[0] + 52} ${level}`} />}
      <rect className="sp-water" x={142} y={level} width={60} height={150 - level} data-part="wasser2" />
      <Beaker x0={142} y0={84} x1={202} y1={150} />
    </>
  );
}

function filtrieren(t: number) {
  // Trichter mit Filterpapier: Wasser tropft durch, Sand bleibt im Filter (Rückstand), unten sammelt sich das klare Filtrat
  const k = seg(t, .05, .95);
  const top = lerp(34, 72, k); // Flüssigkeitsspiegel im Trichter
  const hw = (y: number) => (88 - y) * 50 / 66; // halbe Breite des Trichters bei Höhe y (Spitze bei 88)
  const level = lerp(160, 128, k);
  const sand = Array.from({ length: 22 }, (_, i) => {
    const s = seg(t, rnd(i) * .5, .3 + rnd(i) * .5), y0 = 40 + rnd(i + 3) * 26, y1 = 74 + rnd(i + 6) * 10;
    const y = lerp(y0, y1, s), w = Math.max(2, (88 - y) * .62);
    return { x: 120 + (rnd(i + 9) - .5) * w * 1.2, y };
  });
  const drops = [0, 1, 2].map(i => { const ph = (t * 6 + i / 3) % 1; return { y: 100 + ph * (level - 100), on: t > .05 && t < .97 }; });
  return (
    <>
      <path className="sp-muddy" d={`M${120 - hw(top)} ${top} L120 88 L${120 + hw(top)} ${top} Z`} />
      <path className="sp-paper" d="M80 30 L120 86 L160 30" data-part="filter" />
      <path className="sp-glass" d="M66 22 L174 22 L124 88 L124 104 L116 104 L116 88 Z" data-part="trichter" />
      <g data-part="rueckstand">{sand.map((s, i) => <circle key={i} className="sp-sand" cx={s.x} cy={s.y} r={2} />)}</g>
      {drops.map((d, i) => d.on && <circle key={i} className="sp-drop" cx={120} cy={d.y} r={2} />)}
      <rect className="sp-water sp-clear" x={86} y={level} width={68} height={160 - level} data-part="filtrat" />
      <Beaker x0={86} y0={112} x1={154} y1={160} />
    </>
  );
}

function eindampfen(t: number, id: string) {
  // Salzwasser in der Schale wird erhitzt: Wasser verdampft (Dampf steigt auf), Salzkristalle bleiben zurück
  const k = seg(t, .05, .9);
  const surf = lerp(86, 101, k); // Spiegel in der Schale (tiefster Punkt bei 101)
  const crystals = Array.from({ length: 14 }, (_, i) => ({ x: 98 + rnd(i) * 44, y: 98 - rnd(i + 4) * 3, on: k > .35 + rnd(i + 8) * .5 }));
  const steam = [0, 1, 2].map(i => { const ph = (t * 3 + i / 3) % 1; return { x: 104 + i * 16, y: 80 - ph * 50, o: (1 - ph) * (k < .95 ? 1 : 0) }; });
  return (
    <>
      <g data-part="dampf">{steam.map((s, i) => <path key={i} className="sp-steam" style={{ opacity: s.o }} d={`M${s.x} ${s.y + 14} q-5 -5 0 -9 q5 -5 0 -9`} />)}</g>
      <defs><clipPath id={`${id}-in`}><path d="M78 82 Q120 120 162 82 Z" /></clipPath></defs>
      <rect className="sp-water" x={70} y={surf} width={100} height={30} clipPath={`url(#${id}-in)`} data-part="loesung" />
      <g data-part="salz">{crystals.map((c, i) => c.on && <rect key={i} className="sp-salt" x={c.x - 2} y={c.y - 2} width={4} height={4} />)}</g>
      <path className="sp-dish" d="M78 82 Q120 120 162 82" data-part="schale" />
      <path className="sp-stand" d="M84 110 L156 110 M92 110 L84 150 M148 110 L156 150" />
      <Flame x={120} y={136} t={t} on={k < .98} />
    </>
  );
}

function destillieren(t: number, id: string) {
  // Destillationsapparatur: Rundkolben mit Salzwasser über dem Brenner, Thermometer am Abzweig, Liebig-Kühler (Kühlwasser
  // im Gegenstrom: unten hinein, oben heraus), Vorlage. Erst steigt die Temperatur auf 100 °C, dann bleibt sie dort:
  // Wasserdampf zieht in den Kühler, wird dort wieder flüssig und tropft als Destillat in die Vorlage; das Salz bleibt im Kolben.
  const heat = seg(t, 0, .2), k = seg(t, .2, .95), boiling = t > .2 && k < 1;
  const temp = Math.round(lerp(20, 100, heat));
  const level = lerp(95, 119, k), recv = lerp(160, 140, k);
  const A = [56, 50], B = [192, 114];
  const len = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / len, uy = (B[1] - A[1]) / len, nx = -uy, ny = ux;
  const at = (s: number, o = 0) => [A[0] + ux * len * s + nx * o, A[1] + uy * len * s + ny * o];
  const p = (q: number[]) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
  const j0 = .16, j1 = .84, jw = 7;
  const jacket = `M${p(at(j0, -jw))} L${p(at(j1, -jw))} L${p(at(j1, jw))} L${p(at(j0, jw))} Z`;
  const inP = at(.76, jw), outP = at(.24, -jw);
  const travel = Array.from({ length: 7 }, (_, i) => {
    const ph = (t * 1.6 + i / 7) % 1;
    if (ph < .3) { const q = ph / .3; return { x: 50 + Math.sin(i + q * 6) * 2, y: lerp(level - 2, 50, q), wet: false }; }
    const s = (ph - .3) / .7, q = at(s);
    return { x: q[0], y: q[1], wet: s > .5 };
  });
  const bubbles = Array.from({ length: 6 }, (_, i) => { const ph = (t * 4 + rnd(i)) % 1; return { x: 40 + rnd(i + 3) * 20, y: lerp(122, level + 2, ph) }; });
  const salt = Array.from({ length: 9 }, (_, i) => ({ x: 40 + rnd(i + 30) * 20, y: 121 - rnd(i + 50) * 3 }));
  const drop = { y: lerp(116, recv, (t * 5) % 1), on: boiling && k > .05 };
  const mercury = lerp(6, 30, heat);
  return (
    <>
      <defs>
        <clipPath id={`${id}-in`}><circle cx={50} cy={104} r={21} /></clipPath>
        <clipPath id={`${id}-er`}><path d="M186 120 L186 128 L172 158 L212 158 L198 128 L198 120 Z" /></clipPath>
      </defs>
      <g data-part="kolben">
        <rect className="sp-water" x={26} y={level} width={48} height={40} clipPath={`url(#${id}-in)`} />
        {k > .55 && salt.map((c, i) => <rect key={i} className="sp-salt" x={c.x} y={c.y} width={2.6} height={2.6} style={{ opacity: seg(k, .55 + i * .03, .7 + i * .03) }} />)}
        {boiling && bubbles.map((b, i) => <circle key={i} className="sp-bubble" cx={b.x} cy={b.y} r={1.5} />)}
        <path className="sp-glass" d="M44 83 A22 22 0 1 0 56 83 L56 38 M44 83 L44 38" />
      </g>
      <rect className="sp-stopper" x={41} y={32} width={18} height={6} rx={1} />
      <g data-part="thermometer">
        <rect className="sp-thermo" x={48.2} y={10} width={3.6} height={44} rx={1.8} />
        <rect className="sp-mercury" x={49.2} y={53 - mercury} width={1.6} height={mercury} />
        <circle className="sp-mercury" cx={50} cy={53} r={2.6} />
        <text className="sp-temp" x={57} y={20}>{temp} °C</text>
      </g>
      <path className="sp-tube" d={`M${p(A)} L${p(B)}`} />
      <g data-part="kuehler">
        <path className="sp-cooler" d={jacket} />
        <path className="sp-tube" d={`M${p(at(j0))} L${p(at(j1))}`} />
        <path className="sp-glass" d={`M${p(inP)} l0 9 M${p(outP)} l0 -9`} />
        <path className="sp-cool-arrow" d={`M${inP[0] - 3} ${inP[1] + 14} l3 -4 l3 4 M${outP[0] - 3} ${outP[1] - 12} l3 -4 l3 4`} />
      </g>
      {boiling && t > .22 && travel.map((v, i) => <circle key={i} className={v.wet ? "sp-drop" : "sp-vapor"} cx={v.x} cy={v.y} r={v.wet ? 1.7 : 1.9} data-part="dampf" />)}
      {drop.on && <circle className="sp-drop" cx={192} cy={drop.y} r={1.8} />}
      <g data-part="destillat">
        <rect className="sp-water sp-clear" x={170} y={recv} width={44} height={160 - recv} clipPath={`url(#${id}-er)`} />
        <path className="sp-glass" d="M186 118 L186 128 L172 156 Q171 158 174 158 L210 158 Q213 158 212 156 L198 128 L198 118" />
      </g>
      <path className="sp-stand" d="M26 129 L74 129 M32 129 L28 160 M68 129 L72 160" />
      <Flame x={50} y={150} t={t} on={t < .97} />
    </>
  );
}

function chromatografie(t: number) {
  // Papierstreifen hängt im abgedeckten Becherglas, unten im Laufmittel. Der schwarze Startpunkt ist ein Gemisch aus drei Farbstoffen
  // (übereinander erscheinen sie schwarz). Das Laufmittel steigt; jeder Farbstoff wandert verschieden weit mit (unterschiedlich stark
  // vom Papier festgehalten) – der Punkt läuft auseinander in Gelb, Rot und Blau.
  const k = seg(t, .04, .96);
  const start = 126, front = lerp(139, 56, k), run = Math.max(0, start - front);
  const dye = (rf: number) => start - run * rf;
  const spread = run * (.85 - .3), black = clamp(1 - spread / 11), col = 1 - black;
  const ry = (rf: number) => 3.6 + rf * 2.2 * clamp(run / 60);
  return (
    <>
      <rect className="sp-water" x={72} y={140} width={96} height={18} data-part="laufmittel" />
      <rect className="sp-paper-strip" x={108} y={30} width={24} height={126} />
      <rect className="sp-wet" x={108} y={front} width={24} height={156 - front} data-part="front" />
      <line className="sp-start" x1={108} y1={start} x2={132} y2={start} data-part="start" />
      <ellipse className="sp-dye-yellow" cx={120} cy={dye(.3)} rx={5} ry={ry(.3)} style={{ opacity: col }} data-part="gelb" />
      <ellipse className="sp-dye-red" cx={120} cy={dye(.55)} rx={5} ry={ry(.55)} style={{ opacity: col }} data-part="rot" />
      <ellipse className="sp-dye-blue" cx={120} cy={dye(.85)} rx={5} ry={ry(.85)} style={{ opacity: col }} data-part="blau" />
      <ellipse className="sp-ink" cx={120} cy={start - run * .55} rx={5} ry={3.6 + spread / 2} style={{ opacity: black }} />
      <rect className="sp-lid" x={64} y={44} width={112} height={4} rx={1} />
      <rect className="sp-clip" x={115} y={26} width={10} height={18} rx={1.5} />
      <Beaker x0={70} y0={50} x1={170} y1={160} />
    </>
  );
}

const SCENES: Record<Method, (t: number, id: string) => ReactNode> = { auslesen, sieben, magnet, dekantieren, filtrieren, eindampfen, destillieren, chromatografie };

/** Ein Bild des Verfahrens zum Zeitpunkt t (0 vorher … 1 getrennt) */
export function SepScene({ m, t, label, onPick }: { m: Method; t: number; label?: string; onPick?: (part: string) => void }) {
  const id = "sp" + useId().replace(/:/g, "");
  return (
    <svg className={`sp sp-${m}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label ?? `${METHOD_NAME(m)}: ${METHOD_MIX(m)}`}
      onClick={onPick ? e => { const p = (e.target as Element).closest("[data-part]")?.getAttribute("data-part"); if (p) onPick(p); } : undefined}>
      {SCENES[m](t, id)}
    </svg>
  );
}

/** Animation abspielen (einmal, `dur` ms); Knopf „Nochmal“ rechts oben. `still` = fest bei diesem t (Auswahlbild). */
export function SepAnim({ m, dur = 6000, still, onEnd, onPick, label }: { m: Method; dur?: number; still?: number; onEnd?: () => void; onPick?: (part: string) => void; label?: string }) {
  const reduced = useReducedMotion();
  const [t, setT] = useState(still ?? (reduced ? 1 : 0));
  const [run, setRun] = useState(0);
  const end = useRef(onEnd);
  end.current = onEnd;
  useEffect(() => {
    if (still !== undefined) { setT(still); return; }
    if (reduced) { setT(1); end.current?.(); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const v = Math.min(1, (now - t0) / dur);
      setT(v);
      if (v < 1) raf = requestAnimationFrame(tick); else end.current?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [m, dur, still, reduced, run]);
  return (
    <div className="sp-wrap">
      <SepScene m={m} t={t} onPick={onPick} label={label} />
      {still === undefined && !reduced && t >= 1 && (
        <IconButton icon="reset" className="sp-again" label={tr("Nochmal abspielen", "Play again")} onClick={() => setRun(r => r + 1)} />
      )}
    </div>
  );
}

/** Gemisch vor dem Trennen – ohne Geräte, damit das Bild das Verfahren nicht verrät */
export function MixPic({ k, label }: { k: "eisen" | "kies" | "erbsen" | "absetzen" | "trueb" | "salz" | "alkohol" | "tinte" | "salzsand"; label: string }) {
  const dots = (n: number, cls: string, x0: number, x1: number, y0: number, y1: number, r: number, off = 0) =>
    Array.from({ length: n }, (_, i) => <circle key={cls + i} className={cls} cx={x0 + rnd(i + off) * (x1 - x0)} cy={y0 + rnd(i + off + 50) * (y1 - y0)} r={r} />);
  const glass = (fill: ReactNode) => <>{fill}<Beaker x0={80} y0={40} x1={160} y1={150} /></>;
  const body = {
    eisen: <><ellipse className="sp-plate" cx={120} cy={110} rx={78} ry={24} />{dots(18, "sp-sulfur", 64, 176, 98, 120, 2.8)}
      {Array.from({ length: 16 }, (_, i) => { const x = 66 + rnd(i + 7) * 108, y = 98 + rnd(i + 17) * 22; return <line key={i} className="sp-iron" x1={x - 3} y1={y} x2={x + 3} y2={y} transform={`rotate(${rnd(i + 27) * 180} ${x} ${y})`} />; })}</>,
    kies: <><ellipse className="sp-plate" cx={120} cy={110} rx={78} ry={24} />{dots(7, "sp-stone", 66, 174, 100, 118, 7, 3)}{dots(36, "sp-sand", 60, 180, 96, 124, 1.8, 11)}</>,
    erbsen: <><ellipse className="sp-plate" cx={120} cy={110} rx={78} ry={24} />{dots(9, "sp-pea", 66, 174, 98, 122, 5, 5)}
      {Array.from({ length: 14 }, (_, i) => { const x = 64 + rnd(i + 40) * 112, y = 98 + rnd(i + 60) * 24; return <ellipse key={i} className="sp-lentil" cx={x} cy={y} rx={4.5} ry={2.6} transform={`rotate(${rnd(i + 80) * 180} ${x} ${y})`} />; })}</>,
    absetzen: glass(<><rect className="sp-water" x={80} y={64} width={80} height={86} /><path className="sp-sand-layer" d="M80 132 Q120 126 160 132 L160 147 Q160 150 157 150 L83 150 Q80 150 80 147 Z" /></>),
    trueb: glass(<><rect className="sp-muddy" x={80} y={64} width={80} height={86} />{dots(26, "sp-sand", 84, 156, 70, 146, 1.6, 21)}</>),
    salz: glass(<rect className="sp-water" x={80} y={64} width={80} height={86} />),
    alkohol: glass(<rect className="sp-water" x={80} y={64} width={80} height={86} />),
    tinte: <><rect className="sp-paper-strip" x={96} y={20} width={48} height={140} /><line className="sp-start" x1={96} y1={130} x2={144} y2={130} /><circle className="sp-ink" cx={120} cy={130} r={6} /></>,
    salzsand: <><ellipse className="sp-plate" cx={120} cy={110} rx={78} ry={24} />{dots(30, "sp-sand", 62, 178, 96, 124, 2, 31)}
      {Array.from({ length: 22 }, (_, i) => <rect key={i} className="sp-salt" x={64 + rnd(i + 90) * 110} y={96 + rnd(i + 120) * 24} width={3.4} height={3.4} />)}</>,
  }[k];
  return <svg className="sp sp-mix" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>{body}</svg>;
}
