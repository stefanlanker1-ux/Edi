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
  // Sieb schüttelt; feine Sandkörner fallen durch die Maschen in die Schale, Kiesel bleiben liegen
  const shake = t < .9 ? Math.sin(t * 70) * 4 * (1 - seg(t, .75, .9)) : 0;
  const stones = Array.from({ length: 6 }, (_, i) => ({ x: 70 + i * 20 + rnd(i) * 6, y: 58 - rnd(i + 3) * 4 }));
  const grains = Array.from({ length: 26 }, (_, i) => {
    const x = 60 + rnd(i + 20) * 120, k = seg(t, .1 + rnd(i + 40) * .55, .25 + rnd(i + 40) * .55);
    return { x: x + shake * (1 - k), y: lerp(56 + rnd(i + 60) * 6, 136 - rnd(i + 80) * 10, k) };
  });
  return (
    <>
      <path className="sp-bowl" d="M52 120 Q52 152 120 152 Q188 152 188 120 Z" data-part="schale" />
      <g transform={`translate(${shake} 0)`} data-part="sieb">
        <path className="sp-frame" d="M48 48 L48 66 L192 66 L192 48" />
        <line className="sp-mesh" x1={48} y1={66} x2={192} y2={66} />
      </g>
      <g data-part="sand">{grains.map((g, i) => <circle key={i} className="sp-sand" cx={g.x} cy={g.y} r={1.8} />)}</g>
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
  // Salzwasser im Kolben siedet; Wasserdampf steigt in den Kühler, kondensiert und tropft als Destillat in die Vorlage; Salz bleibt
  const k = seg(t, .08, .95);
  const left = lerp(80, 98, k), right = lerp(152, 132, k);
  const bubbles = Array.from({ length: 6 }, (_, i) => { const ph = (t * 4 + rnd(i)) % 1; return { x: 44 + rnd(i + 3) * 28, y: lerp(108, left + 2, ph), on: k > 0 && k < 1 }; });
  const vapor = Array.from({ length: 5 }, (_, i) => { const ph = (t * 2.5 + i / 5) % 1; return { x: lerp(66, 168, ph), y: lerp(44, 92, ph), on: k > .02 && k < 1 }; });
  const drop = { y: 108 + ((t * 5) % 1) * (right - 108), on: k > .05 && k < 1 };
  return (
    <>
      <defs><clipPath id={`${id}-in`}><circle cx={58} cy={92} r={22} /></clipPath></defs>
      <rect className="sp-water" x={30} y={left} width={60} height={60} clipPath={`url(#${id}-in)`} data-part="rueckstand" />
      {bubbles.map((b, i) => b.on && <circle key={i} className="sp-bubble" cx={b.x} cy={b.y} r={1.6} />)}
      <path className="sp-glass" d="M52 72 A22 22 0 1 0 64 72 L64 44 L52 44 Z" data-part="kolben" />
      <path className="sp-cooler" d="M84 44 L174 86 L168 98 L78 56 Z" data-part="kuehler" />
      <path className="sp-glass" d="M64 48 L176 100" />
      <path className="sp-cool-arrow" d="M170 104 l6 4 M86 40 l-6 -4" />
      {vapor.map((v, i) => v.on && <circle key={i} className="sp-vapor" cx={v.x} cy={v.y} r={1.8} data-part="dampf" />)}
      {drop.on && <circle className="sp-drop" cx={178} cy={drop.y} r={2} />}
      <rect className="sp-water sp-clear" x={160} y={right} width={36} height={160 - right} data-part="destillat" />
      <Beaker x0={160} y0={106} x1={196} y1={160} />
      <Flame x={58} y={130} t={t} on={k < .98} />
    </>
  );
}

function chromatografie(t: number) {
  // Papierstreifen steht im Laufmittel; die Front steigt, der schwarze Farbfleck trennt sich in blau, rot und gelb
  const k = seg(t, .05, .95);
  const start = 128, front = lerp(start + 6, 30, k);
  const dye = (rf: number) => start - (start - front) * rf;
  const sep = seg(k, .1, 1);
  return (
    <>
      <rect className="sp-water" x={70} y={136} width={100} height={22} data-part="laufmittel" />
      <rect className="sp-paper-strip" x={104} y={20} width={32} height={140} />
      <rect className="sp-wet" x={104} y={front} width={32} height={160 - front} data-part="front" />
      <line className="sp-start" x1={104} y1={start} x2={136} y2={start} data-part="start" />
      <circle className="sp-ink" cx={120} cy={start} r={5 * (1 - sep) + .01} />
      <ellipse className="sp-dye-yellow" cx={120} cy={dye(.3)} rx={5} ry={4} style={{ opacity: sep }} data-part="gelb" />
      <ellipse className="sp-dye-red" cx={120} cy={dye(.55)} rx={5} ry={4} style={{ opacity: sep }} data-part="rot" />
      <ellipse className="sp-dye-blue" cx={120} cy={dye(.85)} rx={5} ry={4} style={{ opacity: sep }} data-part="blau" />
      <Beaker x0={70} y0={60} x1={170} y1={160} />
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
