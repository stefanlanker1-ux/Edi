// Trennverfahren als Animation (Lernen, Kapitel Stofftrennung): Auslesen, Sieben, Magnet, Dekantieren, Filtrieren, Eindampfen,
// Destillieren, Chromatografie. Jedes Bild ist eine reine Funktion des Fortschritts t (0 = vorher, 1 = getrennt) – so lässt es sich
// abspielen, an einer Stelle anhalten (Auswahlbild) und prüfen. Teile tragen `data-part` (Rückstand, Filtrat, Destillat …):
// Ziele für Beschriftungen und für Aufgaben zum Antippen. Farben nur aus der Palette; bei reduzierter Bewegung gleich das Endbild.

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Button, IconButton, useReducedMotion } from "@lern/ui";
import { tr } from "@lern/i18n";

export type Method = "auslesen" | "sieben" | "magnet" | "dekantieren" | "filtrieren" | "eindampfen" | "destillieren" | "chromatografie";
export const METHODS: Method[] = ["auslesen", "sieben", "magnet", "dekantieren", "filtrieren", "eindampfen", "destillieren", "chromatografie"];

export const METHOD_NAME = (m: Method) => ({
  auslesen: tr("Auslesen", "Hand-picking"), sieben: tr("Sieben", "Sieving"), magnet: tr("Magnet\u00adtrennung", "Magnetic separation"),
  dekantieren: tr("Dekantieren", "Decanting"), filtrieren: tr("Filtrieren", "Filtration"), eindampfen: tr("Eindampfen", "Evaporation"),
  destillieren: tr("Destillieren", "Distillation"), chromatografie: tr("Chromato\u00adgrafie", "Chromato\u00adgraphy"),
})[m];

/** Was im Bild getrennt wird (für Vorlesen und Aufgabentexte) */
export const METHOD_MIX = (m: Method) => ({
  auslesen: tr("rote und weiße Bohnen", "red and white beans"), sieben: tr("Sand und Kies", "sand and gravel"), magnet: tr("Eisenpulver und Schwefel", "iron powder and sulfur"),
  dekantieren: tr("Sand und Wasser", "sand and water"), filtrieren: tr("Sand und Wasser", "sand and water"), eindampfen: tr("Salzwasser", "salt water"),
  destillieren: tr("Salzwasser", "salt water"), chromatografie: tr("Filzstift-Farbe", "felt-tip ink"),
})[m];

/** Bildausschnitt je Verfahren (Umriss aller Zeitpunkte t ∈ [0, 1] mit etwas Rand): das Gerät füllt das Bild, Teile werden größer */
const BOX: Record<Method, [number, number, number, number]> = {
  auslesen: [14, 56, 216, 100], sieben: [34, 30, 170, 128], magnet: [48, 4, 144, 146], dekantieren: [6, 2, 174, 156],
  filtrieren: [58, 14, 124, 150], eindampfen: [62, 22, 116, 132], destillieren: [16, 2, 204, 162], chromatografie: [58, 18, 124, 146],
};
const viewOf = (m: Method) => BOX[m].join(" ");
const clamp = (x: number) => Math.min(1, Math.max(0, x));
/** Abschnitt a…b von t auf 0…1, sanft */
const seg = (t: number, a: number, b: number) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** feste Pseudo-Zufallszahlen (gleiches Bild bei jedem Aufruf) */
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** Becherglas (offen) mit Ausguss (links oder rechts), Innenraum x0…x1, Boden bei y1 */
const beakerPath = (x0: number, y0: number, x1: number, y1: number, spout: "left" | "right" = "left") => spout === "left"
  ? `M${x0 - 4} ${y0 - 2} L${x0} ${y0} L${x0} ${y1 - 3} Q${x0} ${y1} ${x0 + 3} ${y1} L${x1 - 3} ${y1} Q${x1} ${y1} ${x1} ${y1 - 3} L${x1} ${y0}`
  : `M${x0} ${y0} L${x0} ${y1 - 3} Q${x0} ${y1} ${x0 + 3} ${y1} L${x1 - 3} ${y1} Q${x1} ${y1} ${x1} ${y1 - 3} L${x1} ${y0} L${x1 + 4} ${y0 - 2}`;
const Beaker = ({ x0, y0, x1, y1, part, spout }: { x0: number; y0: number; x1: number; y1: number; part?: string; spout?: "left" | "right" }) =>
  <path className="sp-glass" d={beakerPath(x0, y0, x1, y1, spout)} data-part={part} />;
/** Flamme eines Brenners, flackert leicht */
const Flame = ({ x, y, t, on = true, h = 14 }: { x: number; y: number; t: number; on?: boolean; h?: number }) => {
  // aus: nur der Brenner, ohne Flamme
  if (!on) return <g data-part="flamme"><rect className="sp-burner" x={x - 6} y={y} width={12} height={h} rx={1} /></g>;
  const f = 1 + .08 * Math.sin(t * 90);
  return (
    <g data-part="flamme">
      <path className="sp-flame" d={`M${x - 7} ${y} Q${x - 8} ${y - 12 * f} ${x} ${y - 22 * f} Q${x + 8} ${y - 12 * f} ${x + 7} ${y} Z`} />
      <path className="sp-flame-in" d={`M${x - 3} ${y} Q${x - 3} ${y - 7} ${x} ${y - 12 * f} Q${x + 3} ${y - 7} ${x + 3} ${y} Z`} />
      <rect className="sp-burner" x={x - 6} y={y} width={12} height={h} rx={1} />
    </g>
  );
};

/**
 * Heizhaube (für Brennbares wie Alkohol: keine offene Flamme): Mulde, in der der Rundkolben sitzt, Kontrolllampe; eingeschaltet
 * glüht die Mulde. Kolben: Mittelpunkt (cx, cy), Radius der Mulde r
 */
const Mantle = ({ cx, cy, r, on }: { cx: number; cy: number; r: number; on: boolean }) => {
  const top = cy - 4, dx = Math.sqrt(r * r - 16), x0 = cx - r - 5, x1 = cx + r + 5, y1 = cy + r + 22;
  const cavity = `M${(cx - dx).toFixed(1)} ${top} A${r} ${r} 0 1 0 ${(cx + dx).toFixed(1)} ${top}`;
  return (
    <g data-part="heizung">
      <path className="sp-mantle" d={`M${x0} ${top} L${(cx - dx).toFixed(1)} ${top} A${r} ${r} 0 1 0 ${(cx + dx).toFixed(1)} ${top} L${x1} ${top} L${x1} ${y1} L${x0} ${y1} Z`} />
      {on && <path className="sp-heat" d={cavity} />}
      <circle className={`sp-lamp${on ? " on" : ""}`} cx={x1 - 7} cy={y1 - 6} r={2.6} />
    </g>
  );
};

/** Bohne (Nierenform, gleich groß für beide Sorten – nur die Farbe unterscheidet sie) */
const Bean = ({ x, y, a, cls }: { x: number; y: number; a: number; cls: string }) => (
  <path className={cls} transform={`translate(${x} ${y}) rotate(${a})`} d="M-6 -.6 Q-6 -4 -2 -3.6 Q0 -2.4 2 -3.6 Q6 -4 6 -.6 Q6 3.6 0 3.6 Q-6 3.6 -6 -.6 Z" />
);

function auslesen(t: number) {
  // Teller mit roten und weißen Bohnen (gleich groß, gleich schwer – sie unterscheiden sich nur im Aussehen); eine Pinzette legt die roten Bohnen
  // nacheinander in die Schale rechts
  const red = Array.from({ length: 6 }, (_, i) => ({ x: 40 + rnd(i) * 70, y: 112 + rnd(i + 9) * 18, a: rnd(i + 20) * 180 }));
  const white = Array.from({ length: 8 }, (_, i) => ({ x: 34 + rnd(i + 30) * 84, y: 110 + rnd(i + 50) * 22, a: rnd(i + 70) * 180 }));
  const at = (i: number) => {
    const k = seg(t, .08 + i * .14, .2 + i * .14), tx = 166 + (i % 3) * 15, ty = 128 + Math.floor(i / 3) * 10;
    return { x: lerp(red[i].x, tx, k), y: lerp(red[i].y, ty, k) - Math.sin(k * Math.PI) * 40, a: lerp(red[i].a, 0, k), moving: k > 0 && k < 1 };
  };
  const mv = red.map((_, i) => at(i)).find(p => p.moving);
  return (
    <>
      <ellipse className="sp-plate" cx={76} cy={124} rx={58} ry={18} />
      <path className="sp-bowl" d="M140 118 Q140 150 182 150 Q224 150 224 118 Z" data-part="schale" />
      <g data-part="bohnen-weiss">{white.map((l, i) => <Bean key={i} x={l.x} y={l.y} a={l.a} cls="sp-bean-white" />)}</g>
      <g data-part="bohnen-rot">{red.map((_, i) => { const p = at(i); return <Bean key={i} x={p.x} y={p.y} a={p.a} cls="sp-bean-red" />; })}</g>
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
      <g data-part="feinsand">{grains.map((g, i) => <circle key={i} className="sp-sand" cx={g.x} cy={g.y} r={1.6} />)}</g>
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

/** Dekantieren: Glas 1 (Ausguss rechts) kippt im Uhrzeigersinn um den Ausguss, das Wasser bleibt waagrecht. Was über den Ausguss
 *  steigt, fließt ins leere Glas 2 – so viel, wie bei diesem Winkel nicht mehr ins Glas passt (Flächen im Bild). */
const DEK = { x0: 44, y0: 62, x1: 100, y1: 132, sand: 117, surf: 80, max: 60 };
const DEK_P: [number, number] = [DEK.x1 + 4, DEK.y0 - 2]; // Drehpunkt = Spitze des Ausgusses
const DEK_IN: [number, number][] = [[DEK.x0, DEK.y0], [DEK.x0, DEK.y1], [DEK.x1, DEK.y1], [DEK.x1, DEK.y0]];
const DEK_SAND: [number, number][] = [[DEK.x0, DEK.sand], [DEK.x0, DEK.y1], [DEK.x1, DEK.y1], [DEK.x1, DEK.sand]];
const turn = (ang: number, [x, y]: [number, number]): [number, number] => {
  const a = ang * Math.PI / 180, dx = x - DEK_P[0], dy = y - DEK_P[1];
  return [DEK_P[0] + dx * Math.cos(a) - dy * Math.sin(a), DEK_P[1] + dx * Math.sin(a) + dy * Math.cos(a)];
};
/** Teil eines Vielecks unterhalb der Höhe y = s (Bild: y nach unten) */
const below = (poly: [number, number][], s: number) => {
  const out: [number, number][] = [];
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length], ina = a[1] >= s, inb = b[1] >= s;
    if (ina) out.push(a);
    if (ina !== inb) out.push([a[0] + (b[0] - a[0]) * (s - a[1]) / (b[1] - a[1]), s]);
  });
  return out;
};
const areaOf = (p: [number, number][]) => Math.abs(p.reduce((sum, a, i) => { const b = p[(i + 1) % p.length]; return sum + a[0] * b[1] - b[0] * a[1]; }, 0)) / 2;
/** Wasser im gekippten Glas unterhalb der Höhe s (ohne Sand) */
const dekWater = (ang: number, s: number) => areaOf(below(DEK_IN.map(p => turn(ang, p)), s)) - areaOf(below(DEK_SAND.map(p => turn(ang, p)), s));
const DEK_V0 = dekWater(0, DEK.surf);
/** Wasserspiegel zu einer Wassermenge (Bisektion; höchstens bis zum Ausguss) */
const dekSurface = (ang: number, v: number) => {
  let lo = DEK_P[1], hi = DEK.y1 + 80;
  for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (dekWater(ang, mid) > v) lo = mid; else hi = mid; }
  return lo;
};

/** Glas 2 (Innenraum), bekommt das ausgegossene Wasser */
const DEK_G2 = { x0: 118, x1: 172, y0: 98, y1: 152 };
/** Zustand beim Dekantieren zum Zeitpunkt t (für Bild und Test): Winkel (im Uhrzeigersinn), Wasser in Glas 1 (Fläche, Spiegel),
 *  Strahl, Wasserstand in Glas 2, Umriss von Glas 1 mit Ausguss */
export function dekState(t: number) {
  const up = seg(t, .02, .78), back = seg(t, .84, .98);
  const ang = DEK.max * up * (1 - back);
  // Wasser im Glas: was beim größten bisher erreichten Winkel noch hineinpasst (der Rest ist über den Ausguss geflossen)
  const fits = dekWater(DEK.max * up, DEK_P[1]);
  const v = Math.min(DEK_V0, fits);
  const surface = dekSurface(ang, v);
  return {
    ang, surface, v,
    water: below(DEK_IN.map(p => turn(ang, p)), surface),
    flow: up > 0 && up < 1 && back === 0 && fits < DEK_V0,
    level: DEK_G2.y1 - (DEK_V0 - v) / (DEK_G2.x1 - DEK_G2.x0),
    glass: [...DEK_IN, DEK_P].map(p => turn(ang, p)),
    spout: DEK_P, g2: DEK_G2,
  };
}

function dekantieren(t: number) {
  // Sand hat sich abgesetzt; das Glas kippt langsam (bis 60°), das klare Wasser fließt über den Ausguss ins zweite Glas,
  // der Sand bleibt als Bodensatz zurück; danach wird das Glas wieder aufgestellt
  const { ang, water, flow, level, g2 } = dekState(t);
  const [px, py] = DEK_P, end = 130;
  return (
    <>
      {water.length > 2 && <path className="sp-water" d={`M${water.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L")} Z`} data-part="wasser" />}
      <g transform={`rotate(${ang.toFixed(2)} ${px} ${py})`}>
        <path className="sp-sand-layer" d={`M${DEK.x0} ${DEK.sand + 1} Q${(DEK.x0 + DEK.x1) / 2} ${DEK.sand - 4} ${DEK.x1} ${DEK.sand + 1} L${DEK.x1} ${DEK.y1 - 3} Q${DEK.x1} ${DEK.y1} ${DEK.x1 - 3} ${DEK.y1} L${DEK.x0 + 3} ${DEK.y1} Q${DEK.x0} ${DEK.y1} ${DEK.x0} ${DEK.y1 - 3} Z`} data-part="sand" />
        <Beaker x0={DEK.x0} y0={DEK.y0} x1={DEK.x1} y1={DEK.y1} spout="right" />
      </g>
      {flow && <path className="sp-stream" d={`M${px} ${py} C${px + 9} ${py} ${end - 3} ${py + 14} ${end} ${level.toFixed(1)}`} />}
      {level < g2.y1 - .5 && <rect className="sp-water" x={g2.x0} y={level} width={g2.x1 - g2.x0} height={g2.y1 - level} data-part="wasser2" />}
      <Beaker x0={g2.x0} y0={g2.y0} x1={g2.x1} y1={g2.y1} spout="right" />
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

function eindampfen(t: number, id: string, _alk = false, off = false) {
  // Salzwasser in der Schale wird erhitzt: Wasser verdampft (Dampf steigt auf), Salzkristalle bleiben zurück
  const k = seg(t, .05, .9);
  const surf = lerp(86, 101, k); // Spiegel in der Schale (tiefster Punkt bei 101)
  const crystals = Array.from({ length: 14 }, (_, i) => ({ x: 98 + rnd(i) * 44, y: 98 - rnd(i + 4) * 3, on: k > .35 + rnd(i + 8) * .5 }));
  // Dampf erst, wenn das Wasser warm ist (nie vor dem Einschalten des Brenners)
  const warm = off ? 0 : seg(t, .03, .15);
  const steam = [0, 1, 2].map(i => { const ph = (t * 3 + i / 3) % 1; return { x: 104 + i * 16, y: 80 - ph * 50, o: (1 - ph) * warm * (k < .95 ? 1 : 0) }; });
  return (
    <>
      <g data-part="dampf">{steam.map((s, i) => <path key={i} className="sp-steam" style={{ opacity: s.o }} d={`M${s.x} ${s.y + 14} q-5 -5 0 -9 q5 -5 0 -9`} />)}</g>
      <defs><clipPath id={`${id}-in`}><path d="M78 82 Q120 120 162 82 Z" /></clipPath></defs>
      <rect className="sp-water" x={70} y={surf} width={100} height={30} clipPath={`url(#${id}-in)`} data-part="loesung" />
      <g data-part="salz">{crystals.map((c, i) => c.on && <rect key={i} className="sp-salt" x={c.x - 2} y={c.y - 2} width={4} height={4} />)}</g>
      <path className="sp-dish" d="M78 82 Q120 120 162 82" data-part="schale" />
      {/* Drahtnetz auf dem Dreifuß – die Schale liegt mit ihrem tiefsten Punkt darauf */}
      <rect className="sp-gauze" x={86} y={101} width={68} height={3} rx={1} />
      <path className="sp-stand" d="M88 104 L82 150 M152 104 L158 150" />
      <Flame x={120} y={128} h={22} t={t} on={!off && k < .98} />
    </>
  );
}

function destillieren(t: number, id: string, alk = false, off = false) {
  // Destillationsapparatur: Rundkolben mit Salzwasser über dem Brenner, Thermometer am Abzweig, Liebig-Kühler (Kühlwasser
  // im Gegenstrom: unten hinein, oben heraus), Vorlage. Erst steigt die Temperatur auf 100 °C, dann bleibt sie dort:
  // Wasserdampf zieht in den Kühler, wird dort wieder flüssig und tropft als Destillat in die Vorlage; das Salz bleibt gelöst im Kolben (nie bis zur Trockne).
  // Alkohol und Wasser (`alk`): ein Gemisch siedet nicht bei einer festen Temperatur – sie steigt nach dem Sieden langsam weiter (von etwa 80 °C an)
  const heat = seg(t, 0, .2), k = seg(t, .2, .95), boiling = t > .2 && k < 1;
  const temp = Math.round(alk ? (t < .2 ? lerp(20, 80, heat) : lerp(80, 90, k)) : lerp(20, 100, heat));
  // nie bis zur Trockne: Salzwasser bleibt im Kolben (immer salziger), Alkohol und Wasser wird schon bei halb vollem Kolben beendet
  // (sonst hätte das Destillat wieder fast die Zusammensetzung des Gemischs)
  const level = lerp(95, alk ? 104 : 110, k), recv = lerp(160, alk ? 151 : 146, k);
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
        {boiling && bubbles.map((b, i) => <circle key={i} className="sp-bubble" cx={b.x} cy={b.y} r={1.5} />)}
        <path className="sp-glass" d="M44 83 A22 22 0 1 0 56 83 L56 38 M44 83 L44 38" />
      </g>
      <rect className="sp-stopper" x={41} y={32} width={18} height={6} rx={1} />
      <g data-part="thermometer">
        <rect className="sp-thermo" x={48.2} y={10} width={3.6} height={44} rx={1.8} />
        <rect className="sp-mercury" x={49.2} y={53 - mercury} width={1.6} height={mercury} />
        <circle className="sp-mercury" cx={50} cy={53} r={2.6} />
        <text className="sp-temp" x={57} y={24}>{temp} °C</text>
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
      {alk ? <Mantle cx={50} cy={104} r={23} on={!off && t < .97} /> : <>
        <path className="sp-stand" d="M26 129 L74 129 M32 129 L28 160 M68 129 L72 160" />
        <Flame x={50} y={150} t={t} on={!off && t < .97} />
      </>}
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
  const spread = run * (.92 - .25), black = clamp(1 - spread / 11), col = 1 - black;
  const ry = (rf: number) => 3.6 + rf * 2.2 * clamp(run / 60);
  return (
    <>
      <rect className="sp-water" x={72} y={140} width={96} height={18} data-part="laufmittel" />
      <rect className="sp-paper-strip" x={108} y={30} width={24} height={126} />
      <rect className="sp-wet" x={108} y={front} width={24} height={156 - front} data-part="front" />
      <line className="sp-start" x1={108} y1={start} x2={132} y2={start} data-part="start" />
      <ellipse className="sp-dye-yellow" cx={120} cy={dye(.25)} rx={5} ry={ry(.25)} style={{ opacity: col }} data-part="gelb" />
      <ellipse className="sp-dye-red" cx={120} cy={dye(.55)} rx={5} ry={ry(.55)} style={{ opacity: col }} data-part="rot" />
      <ellipse className="sp-dye-blue" cx={120} cy={dye(.92)} rx={5} ry={ry(.92)} style={{ opacity: col }} data-part="blau" />
      <ellipse className="sp-ink" cx={120} cy={start - run * .55} rx={5} ry={3.6 + spread / 2} style={{ opacity: black }} />
      <rect className="sp-lid" x={64} y={44} width={112} height={4} rx={1} />
      <rect className="sp-clip" x={115} y={26} width={10} height={18} rx={1.5} />
      <Beaker x0={70} y0={50} x1={170} y1={160} />
    </>
  );
}

export const SCENES: Record<Method, (t: number, id: string, alk?: boolean, off?: boolean) => ReactNode> = { auslesen, sieben, magnet, dekantieren, filtrieren, eindampfen, destillieren, chromatografie };

/** Trefferfläche eines Teils: sein sichtbarer Umriss, mindestens 44 × 44 px groß (in Bild-Einheiten) */
interface Hit { part: string; x: number; y: number; w: number; h: number }
/** kleinste Trefferfläche in px (Tippziel) */
const HIT_PX = 44;

/** antippbare Teile je Verfahren (Aufgaben „Tippe auf …“); Hilfslinien wie die Startlinie oder das Gefäß gehören nicht dazu */
export const TAP_PARTS: Partial<Record<Method, string[]>> = {
  filtrieren: ["rueckstand", "filtrat", "filter"], destillieren: ["destillat", "kolben", "kuehler"], eindampfen: ["salz", "schale"],
  magnet: ["eisen", "schwefel", "magnet"], chromatografie: ["blau", "rot", "gelb"], dekantieren: ["sand", "wasser2"], sieben: ["kies", "feinsand"],
};

/** Rechteck-Schnitt (null = leer) */
const cut = (a: DOMRect, b: DOMRect) => {
  const x0 = Math.max(a.x, b.x), y0 = Math.max(a.y, b.y), x1 = Math.min(a.right, b.right), y1 = Math.min(a.bottom, b.bottom);
  return x1 > x0 && y1 > y0 ? new DOMRect(x0, y0, x1 - x0, y1 - y0) : null;
};

/** sichtbarer Umriss eines Elements im Bild: getBBox, durch clipPath begrenzt, mit den Transformationen der Eltern */
function visibleBox(svg: SVGSVGElement, e: SVGGraphicsElement): DOMRect | null {
  let b: DOMRect;
  // getBBox liefert ein SVGRect ohne right/bottom – als DOMRect weiterrechnen
  try { const r = e.getBBox(); b = new DOMRect(r.x, r.y, r.width, r.height); } catch { return null; }
  if (!b.width && !b.height) return null;
  const clip = e.getAttribute("clip-path")?.match(/url\(#([^)]+)\)/)?.[1];
  // Form im clipPath (ein Kreis, Pfad oder Rechteck) begrenzt den sichtbaren Teil
  const shape = clip ? svg.querySelector<SVGGraphicsElement>(`[id="${clip}"] > *`) : null;
  if (shape) { try { const r = shape.getBBox(), c = cut(b, new DOMRect(r.x, r.y, r.width, r.height)); if (!c) return null; b = c; } catch { /* ohne Begrenzung */ } }
  // über die Bildschirm-Matrizen: lokal → Bildschirm → Bild-Einheiten (getCTM des äußeren svg ist je Browser verschieden)
  const local = e.getScreenCTM(), root = svg.getScreenCTM();
  if (!local || !root) return b;
  const k = root.inverse().multiply(local);
  const pts = [[b.x, b.y], [b.right, b.y], [b.x, b.bottom], [b.right, b.bottom]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(k));
  const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
  return new DOMRect(Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
}

/** Trefferflächen messen: je Teil der sichtbare Umriss, auf mindestens `min` vergrößert, im Bild; überlappende kleine Flächen teilen sich an der Mitte */
function measureHits(svg: SVGSVGElement, parts: string[], m: Method): Hit[] {
  const ctm = svg.getScreenCTM(), scale = ctm ? Math.hypot(ctm.a, ctm.b) : 1, min = HIT_PX / Math.max(.01, scale);
  const [X0, Y0, BW, BH] = BOX[m], X1 = X0 + BW, Y1 = Y0 + BH;
  const view = new DOMRect(X0, Y0, BW, BH);
  const box = new Map<string, DOMRect>();
  for (const part of parts) {
    for (const e of svg.querySelectorAll<SVGGraphicsElement>(`.sp-shapes [data-part="${part}"]`)) {
      const b = visibleBox(svg, e);
      const v = b && cut(b, view);
      if (!v) continue;
      const o = box.get(part);
      box.set(part, o ? new DOMRect(Math.min(o.x, v.x), Math.min(o.y, v.y), Math.max(o.right, v.right) - Math.min(o.x, v.x), Math.max(o.bottom, v.bottom) - Math.min(o.y, v.y)) : v);
    }
  }
  const hits = [...box].map(([part, b]) => {
    const w = Math.min(BW, Math.max(b.width, min)), h = Math.min(BH, Math.max(b.height, min));
    // vergrößert um die Mitte, aber im Bild
    const x = Math.min(X1 - w, Math.max(X0, b.x + b.width / 2 - w / 2)), y = Math.min(Y1 - h, Math.max(Y0, b.y + b.height / 2 - h / 2));
    return { part, x, y, w, h, grown: b.width < min || b.height < min };
  });
  // kleine, vergrößerte Flächen, die sich überlappen (Farbflecken übereinander): an der Mitte zwischen den Teilen teilen
  // (nur bei etwa gleich großen Teilen; ein viel kleineres Teil liegt einfach oben auf dem größeren, z. B. das Salz in der Schale)
  const area = (h: { w: number; h: number }) => h.w * h.h;
  for (const a of hits) for (const c of hits) {
    if (a === c || !a.grown || !c.grown || Math.max(area(a), area(c)) > 1.8 * Math.min(area(a), area(c))) continue;
    const ov = cut(new DOMRect(a.x, a.y, a.w, a.h), new DOMRect(c.x, c.y, c.w, c.h));
    if (!ov) continue;
    const ay = a.y + a.h / 2, cy = c.y + c.h / 2, ax = a.x + a.w / 2, cx = c.x + c.w / 2;
    if (Math.abs(ay - cy) >= Math.abs(ax - cx)) {
      const mid = (ay + cy) / 2;
      if (ay < cy) { a.h = Math.min(a.h, mid - a.y); } else { const y1 = a.y + a.h; a.y = Math.max(a.y, mid); a.h = y1 - a.y; }
    } else {
      const mid = (ax + cx) / 2;
      if (ax < cx) { a.w = Math.min(a.w, mid - a.x); } else { const x1 = a.x + a.w; a.x = Math.max(a.x, mid); a.w = x1 - a.x; }
    }
  }
  // ist eine geteilte Fläche dabei unter `min` geschrumpft, wächst sie auf der freien Seite wieder auf `min` (nur wenn sie dort niemanden überdeckt)
  const free = (h: typeof hits[number]) => hits.every(o => o === h || !o.grown || area(o) > 1.8 * area(h) || !cut(new DOMRect(h.x, h.y, h.w, h.h), new DOMRect(o.x, o.y, o.w, o.h)));
  for (const a of hits) {
    if (!a.grown) continue;
    if (a.h < min) {
      const up = { ...a, y: Math.max(Y0, a.y + a.h - min), h: min }, down = { ...a, h: Math.min(min, Y1 - a.y) };
      const g = [up, down].find(free); if (g) { a.y = g.y; a.h = g.h; }
    }
    if (a.w < min) {
      const left = { ...a, x: Math.max(X0, a.x + a.w - min), w: min }, right = { ...a, w: Math.min(min, X1 - a.x) };
      const g = [left, right].find(free); if (g) { a.x = g.x; a.w = g.w; }
    }
  }
  return hits.map(({ grown: _g, ...h }) => h).sort((p, q) => q.w * q.h - p.w * p.h);
}

/** Schriftgröße der Temperatur in Bild-Einheiten bei `k` px je Einheit: auf dem Bildschirm 15 px (mindestens 14 px), höchstens 24 Einheiten */
export const tempFont = (k: number) => Math.min(24, Math.max(10, Math.ceil(15 / k)));

/**
 * Ein Bild des Verfahrens zum Zeitpunkt t (0 vorher … 1 getrennt). Mit `onPick` sind die Teile antippbar: nur die antippbaren Teile
 * (`parts`, sonst `TAP_PARTS`) nehmen Klicks an – Verzierungen wie der schwarze Startpunkt der Chromatografie, Gefäße und Hilfslinien nie –,
 * dazu unter dem Bild unsichtbare Trefferflächen je Teil (sichtbarer Umriss, mindestens 44 px, nie über das Bild hinaus; überlappende
 * kleine Flächen teilen sich an der Mitte).
 */
export function SepScene({ m, t, label, onPick, mark, parts, alk, off }: { m: Method; t: number; label?: string; onPick?: (part: string) => void;
  /** Brenner aus (Gerät selbst bedienen: vor dem Einschalten) */
  off?: boolean;
  /** Destillieren: Alkohol und Wasser statt Salzwasser (Temperatur steigt langsam, kein Salz im Kolben) */
  alk?: boolean;
  /** Teil gestrichelt grün umrahmen (Lösung nach der Antwort) */
  mark?: string;
  /** antippbare Teile (Standard: TAP_PARTS des Verfahrens) */
  parts?: string[] }) {
  const id = "sp" + useId().replace(/:/g, "");
  const svg = useRef<SVGSVGElement>(null);
  const [hits, setHits] = useState<Hit[]>([]);
  const tap = !!onPick;
  const live = [...new Set([...(parts ?? TAP_PARTS[m] ?? []), ...(mark ? [mark] : [])])];
  const key = live.join();
  // Schriftgröße der Temperatur (Destillieren) in Bild-Einheiten: auf dem Bildschirm mindestens 14 px, egal wie groß das Bild ist
  const [temp, setTemp] = useState(12);
  const thermo = m === "destillieren";
  useLayoutEffect(() => {
    const el = svg.current;
    // Trefferflächen auch ohne Antippen messen, wenn ein Teil markiert wird (vorgemachtes Beispiel: Lösung im Bild)
    if ((!tap && !mark && !thermo) || !el) return;
    const measure = () => {
      if (tap || mark) {
        const next = measureHits(el, key ? key.split(",") : [], m);
        setHits(old => (JSON.stringify(old) === JSON.stringify(next) ? old : next));
      }
      if (thermo) {
        const r = el.getBoundingClientRect(), [, , bw, bh] = BOX[m], k = Math.min(r.width / bw, r.height / bh);
        if (k > 0) setTemp(tempFont(k));
      }
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    // Fit skaliert per CSS-Transform (löst kein ResizeObserver aus): Größe in px regelmäßig nachmessen, damit Trefferflächen 44 px bleiben
    const tick = setInterval(measure, 400);
    return () => { ro?.disconnect(); clearInterval(tick); };
  }, [m, t, tap, key, mark, thermo]);
  const sel = (p: string) => `#${id} .sp-shapes [data-part="${p}"]`;
  return (
    <svg ref={svg} id={id} className={`sp sp-${m}${tap ? " sp-tap" : ""}`} viewBox={viewOf(m)} role="img" aria-label={label ?? `${METHOD_NAME(m)}: ${METHOD_MIX(m)}`}
      style={thermo ? ({ "--sp-temp": `${temp}px` } as CSSProperties) : undefined}
      onClick={onPick ? e => { const p = (e.target as Element).closest("[data-part]")?.getAttribute("data-part"); if (p && live.includes(p)) onPick(p); } : undefined}>
      {tap && live.length > 0 && <style>{`${live.map(p => `${sel(p)}, ${sel(p)} *`).join(", ")} { pointer-events: auto; }`}</style>}
      {tap && <g className="sp-hits">{hits.map(h => <rect key={h.part} className="sp-hit" data-part={h.part} x={h.x} y={h.y} width={h.w} height={h.h} />)}</g>}
      <g className="sp-shapes">{SCENES[m](t, id, alk, off)}</g>
      {mark && hits.filter(h => h.part === mark).map(h => <rect key="mark" className="sp-mark" x={h.x - 2} y={h.y - 2} width={h.w + 4} height={h.h + 4} rx={3} />)}
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

/**
 * Gerät selbst bedienen (Lernen): das Bild steht zuerst bei t = 0, der Knopf (z. B. „Brenner an“) startet den Ablauf; danach „Nochmal“.
 * Bei reduzierter Bewegung springt das Bild gleich ans Ende.
 */
export function SepDevice({ m, start, alk, dur = 6000, label }: { m: Method; start: string; alk?: boolean; dur?: number; label?: string }) {
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (reduced) { setT(1); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => { const v = Math.min(1, (now - t0) / dur); setT(v); if (v < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, reduced, dur]);
  const busy = run > 0 && t < 1;
  return (
    <div className="sp-device" data-run={run ? 1 : 0}>
      <div className="sp-wrap"><SepScene m={m} t={t} alk={alk} off={!run} label={label} /></div>
      <Button className="sp-device-btn" variant={run ? "soft" : "primary"} icon={run ? "reset" : "fire"} disabled={busy} onClick={() => { setT(0); setRun(r => r + 1); }}>
        {run ? tr("Nochmal", "Again") : start}
      </Button>
    </div>
  );
}

/** Gemisch vor dem Trennen – ohne Geräte, damit das Bild das Verfahren nicht verrät */
export function MixPic({ k, label }: { k: "eisen" | "kies" | "bohnen" | "absetzen" | "trueb" | "salz" | "alkohol" | "tinte" | "salzsand" | "eisensalzsand"; label: string }) {
  const dots = (n: number, cls: string, x0: number, x1: number, y0: number, y1: number, r: number, off = 0) =>
    Array.from({ length: n }, (_, i) => <circle key={cls + i} className={cls} cx={x0 + rnd(i + off) * (x1 - x0)} cy={y0 + rnd(i + off + 50) * (y1 - y0)} r={r} />);
  const glass = (fill: ReactNode) => <>{fill}<Beaker x0={80} y0={40} x1={160} y1={150} /></>;
  const body = {
    eisen: <><ellipse className="sp-plate" cx={120} cy={110} rx={78} ry={24} />{dots(18, "sp-sulfur", 64, 176, 98, 120, 2.8)}
      {Array.from({ length: 16 }, (_, i) => { const x = 66 + rnd(i + 7) * 108, y = 98 + rnd(i + 17) * 22; return <line key={i} className="sp-iron" x1={x - 3} y1={y} x2={x + 3} y2={y} transform={`rotate(${rnd(i + 27) * 180} ${x} ${y})`} />; })}</>,
    kies: <><ellipse className="sp-plate" cx={120} cy={110} rx={78} ry={24} />{dots(7, "sp-stone", 66, 174, 100, 118, 7, 3)}{dots(36, "sp-sand", 60, 180, 96, 124, 1.8, 11)}</>,
    bohnen: <><ellipse className="sp-plate" cx={120} cy={110} rx={78} ry={24} />
      {Array.from({ length: 18 }, (_, i) => <Bean key={i} x={66 + rnd(i + 40) * 108} y={98 + rnd(i + 60) * 22} a={rnd(i + 80) * 180} cls={i % 2 ? "sp-bean-white" : "sp-bean-red"} />)}</>,
    absetzen: glass(<><rect className="sp-water" x={80} y={64} width={80} height={86} /><path className="sp-sand-layer" d="M80 132 Q120 126 160 132 L160 147 Q160 150 157 150 L83 150 Q80 150 80 147 Z" /></>),
    trueb: glass(<><rect className="sp-muddy" x={80} y={64} width={80} height={86} />{dots(26, "sp-sand", 84, 156, 70, 146, 1.6, 21)}</>),
    salz: glass(<rect className="sp-water" x={80} y={64} width={80} height={86} />),
    alkohol: glass(<rect className="sp-water" x={80} y={64} width={80} height={86} />),
    tinte: <><rect className="sp-paper-strip" x={96} y={20} width={48} height={140} /><line className="sp-start" x1={96} y1={130} x2={144} y2={130} /><circle className="sp-ink" cx={120} cy={130} r={6} /></>,
    salzsand: <><ellipse className="sp-plate" cx={120} cy={110} rx={78} ry={24} />{dots(30, "sp-sand", 62, 178, 96, 124, 2, 31)}
      {Array.from({ length: 22 }, (_, i) => <rect key={i} className="sp-salt" x={64 + rnd(i + 90) * 110} y={96 + rnd(i + 120) * 24} width={3.4} height={3.4} />)}</>,
    eisensalzsand: <><ellipse className="sp-plate" cx={120} cy={110} rx={78} ry={24} />{dots(26, "sp-sand", 62, 178, 96, 124, 2, 31)}
      {Array.from({ length: 18 }, (_, i) => <rect key={i} className="sp-salt" x={64 + rnd(i + 90) * 110} y={96 + rnd(i + 120) * 24} width={3.4} height={3.4} />)}
      {Array.from({ length: 14 }, (_, i) => { const x = 66 + rnd(i + 7) * 108, y = 98 + rnd(i + 17) * 22; return <line key={`e${i}`} className="sp-iron" x1={x - 3} y1={y} x2={x + 3} y2={y} transform={`rotate(${rnd(i + 27) * 180} ${x} ${y})`} />; })}</>,
  }[k];
  // Ausschnitt um das Gemisch (Schale, Glas, Papierstreifen) – die Stoffe füllen das Bild, Eisenspäne und Körner sind gut zu sehen
  const view = ["absetzen", "trueb", "salz", "alkohol"].includes(k) ? "64 32 112 124" : k === "tinte" ? "84 14 72 152" : "36 82 168 56";
  return <svg className="sp sp-mix" viewBox={view} role="img" aria-label={label}>{body}</svg>;
}
