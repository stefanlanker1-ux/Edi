// Elektronenpfeile (gebogene Pfeile in Reaktionsmechanismen): voller Pfeil = Elektronenpaar, halber Pfeil (Angelhaken) = ein Elektron.
// Eine Stelle für alle Module: gleichmäßiger Bogen (kubische Kurve, symmetrisch), Höhe passend zur Länge, Bogen weicht beschrifteten Atomen aus,
// Spitze als gefülltes Dreieck bzw. gefüllter halber Widerhaken (gut sichtbar, auch klein), der Strich endet unter der Spitze.
// Koordinaten in Modell-Einheiten (eine Bindung ≈ 1), gezeichnet mit Maßstab `scale`.

export interface APt { x: number; y: number }

export interface CurlyGeom {
  /** Pfad des Bogens (SVG, schon skaliert) */
  d: string;
  /** Spitze als geschlossenes Vieleck (SVG, schon skaliert) */
  head: string;
  /** Mittelpunkt des Bogens (für Tests und Beschriftung) */
  mid: APt;
}

export interface CurlyOpts {
  /** halber Pfeil: ein Elektron */
  half?: boolean;
  /** Seite und Stärke des Bogens: Vorzeichen = Seite (links/rechts der Verbindungslinie), Betrag ≈ Höhe im Verhältnis zur Länge */
  bend?: number;
  /** beschriftete Atome (Mittelpunkt, Radius): der Bogen hält Abstand, Anfang und Ende dürfen nah sein */
  avoid?: { x: number; y: number; r: number }[];
  /** Maßstab Modell → SVG */
  scale?: number;
}

const cub = (p0: APt, p1: APt, p2: APt, p3: APt, t: number): APt => {
  const u = 1 - t;
  return { x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x, y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y };
};

/** Abstand eines Bogens zu den Atomen (ohne die Atome an Anfang und Ende): wie weit er ein Atom-Feld schneidet (0 = frei) */
function overlap(p0: APt, p1: APt, p2: APt, p3: APt, avoid: CurlyOpts["avoid"]): number {
  if (!avoid?.length) return 0;
  let worst = 0;
  for (let k = 2; k <= 18; k++) {
    const q = cub(p0, p1, p2, p3, k / 20);
    for (const a of avoid) {
      // Atome direkt an Anfang oder Ende gehören zum Pfeil (er beginnt an ihrer Bindung bzw. zeigt auf sie)
      if (Math.hypot(a.x - p0.x, a.y - p0.y) < a.r + 0.05 || Math.hypot(a.x - p3.x, a.y - p3.y) < a.r + 0.05) continue;
      worst = Math.max(worst, a.r - Math.hypot(q.x - a.x, q.y - a.y));
    }
  }
  return worst;
}

/** Bogen und Spitze eines Elektronenpfeils von `from` nach `to` */
export function curlyArrow(from: APt, to: APt, o: CurlyOpts = {}): CurlyGeom {
  const S = o.scale ?? 1;
  const dx = to.x - from.x, dy = to.y - from.y, L = Math.hypot(dx, dy) || 1e-6;
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const side = Math.sign(o.bend ?? 0.5) || 1;
  // Höhe: deutlich gebogen, auch bei kurzen Pfeilen (sonst wirken sie wie Striche); lange Pfeile nicht zu flach, nicht zu bauchig
  // sehr kurze Pfeile: flacher Bogen (halbe Länge), sonst werden sie zu Kringeln
  const base = Math.min(Math.max(Math.abs(o.bend ?? 0.5) * 0.55 * L, Math.min(0.3, 0.5 * L)), 1.1);
  let h = base, p1 = from, p2 = to;
  // bei Atomen im Weg: Bogen höher (bis knapp das Doppelte), Seite bleibt (gepaarte Halbpfeile zeigen bewusst in verschiedene Richtungen)
  for (const f of [1, 1.3, 1.6, 1.9]) {
    h = base * f;
    // kubische Kurve mit Stützpunkten bei 1/4 und 3/4: höchster Punkt = 0,75 · Versatz der Stützpunkte
    const k = (h / 0.75) * side;
    p1 = { x: from.x + dx * 0.2 + nx * k, y: from.y + dy * 0.2 + ny * k };
    p2 = { x: from.x + dx * 0.8 + nx * k, y: from.y + dy * 0.8 + ny * k };
    if (overlap(from, p1, p2, to, o.avoid) <= 0.02) break;
  }
  // Spitze: Richtung = Tangente am Ende; Größe passt sich kurzen Pfeilen an
  const tx = to.x - p2.x, ty = to.y - p2.y, tl = Math.hypot(tx, ty) || 1e-6;
  const ax = tx / tl, ay = ty / tl, bx = -ay, by = ax;
  // Spitze wie in Lehrbüchern: deutlich (etwa ein Drittel Bindungslänge), Widerhaken weit offen
  const len = Math.min(0.32, Math.max(0.18, L * 0.36)), wid = len * 0.56;
  const back = { x: to.x - ax * len, y: to.y - ay * len };
  // Kerbe hinten: Spitze wirkt schlanker, der Strich läuft in die Kerbe
  const notch = { x: to.x - ax * len * 0.72, y: to.y - ay * len * 0.72 };
  // Widerhaken des halben Pfeils außen am Bogen (auf der Seite, zu der sich der Bogen wölbt)
  const out = (bx * nx + by * ny) * side >= 0 ? 1 : -1;
  const barbA = { x: back.x + bx * wid * out, y: back.y + by * wid * out };
  const barbB = { x: back.x - bx * wid * out, y: back.y - by * wid * out };
  const P = (p: APt) => `${(p.x * S).toFixed(2)} ${(p.y * S).toFixed(2)}`;
  const head = o.half
    ? `M${P(to)} L${P(barbA)} L${P(notch)} Z`
    : `M${P(to)} L${P(barbA)} L${P(notch)} L${P(barbB)} Z`;
  // Strich endet in der Kerbe (läuft nicht durch die Spitze); die Kurve wird dafür am Ende gekürzt (Teilkurve bis t)
  // t, bei dem die Kurve 0,7 · Spitzenlänge vor dem Ziel liegt (Halbierungssuche)
  let lo = 0.5, hi = 1;
  for (let k = 0; k < 24; k++) { const t = (lo + hi) / 2, q = cub(from, p1, p2, to, t); if (Math.hypot(q.x - to.x, q.y - to.y) > len * 0.7) lo = t; else hi = t; }
  const tEnd = lo, end = cub(from, p1, p2, to, tEnd);
  // Teilkurve 0..tEnd (de Casteljau)
  const lerp = (a: APt, b: APt, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const q1 = lerp(from, p1, tEnd), m = lerp(p1, p2, tEnd), q2 = lerp(q1, m, tEnd);
  return { d: `M${P(from)} C${P(q1)} ${P(q2)} ${P(end)}`, head, mid: cub(from, p1, p2, to, 0.5) };
}

/** Elektronenpfeil als SVG-Gruppe (Farbe über die Klasse `cu-arrow`, weißer Rand für Lesbarkeit auf Bindungen) */
export function CurlyArrow({ from, to, opacity = 1, className, ...o }: CurlyOpts & { from: APt; to: APt; opacity?: number; className?: string }) {
  const g = curlyArrow(from, to, o);
  return (
    <g className={`cu-arrow${o.half ? " half" : ""}${className ? " " + className : ""}`} opacity={opacity}>
      <path className="cu-arrow-bg" d={g.d} />
      <path className="cu-arrow-bg" d={g.head} />
      <path className="cu-arrow-line" d={g.d} />
      <path className="cu-arrow-head" d={g.head} />
    </g>
  );
}
