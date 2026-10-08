// Bühne der Atom-Ansicht: spielt einen Ablauf (Clip) ab und zeigt danach das Standbild.
// Kamera: Ein Ablauf beginnt im Ausschnitt seines ersten Bilds (Überblick) und fährt während des ersten Schritts zum ruhigen
// Ausschnitt des restlichen Ablaufs (Umriss aller weiteren Bilder); jeder Wechsel – neuer Ablauf, Ende, Zurück – wird in
// 550 ms weich angefahren, eine andere Bühnengröße ohne Fahrt. Bewegung reduziert: gleich das Endbild.
// Kleine Bühne (Handy): Atomzeichen mindestens 14 px – der Ausschnitt zoomt dann auf die Reaktionsstelle (Atome an Pfeilen,
// geladene und hervorgehobene Atome, Elektronen); was hinausragt, endet an einer Wellenlinie. Ecke oben rechts (`corner`, z. B. der
// Umschalter Atome | Kügelchen) bleibt nur frei, wenn dort sonst ein Atom läge.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@lern/ui";
import { boxOf, clipBox, clipLength, fitBox, labelHalf, lerpBox, poseAt, snapBox, still, type Anchor, type Box, type Clip, type Snap } from "../chem/scene.ts";
import { MechSvg, U } from "./MechSvg.tsx";

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const FALLBACK: Box = { x0: -3, y0: -2, x1: 3, y1: 2 };
/** Bildpunkte je Bindungslänge, bei denen die Atomzeichen (22 Einheiten bei U je Bindung) 14 px groß sind */
const MIN_SCALE = (14 / 22) * U;

/** Reaktionsstelle: Atome an Pfeilen, geladene, hervorgehobene und freie Stellen, Atome mit Elektronen daneben */
function coreOf(snaps: { snap: Snap; arrows?: { from: Anchor; to: Anchor }[] }[], mark?: string): Set<string> {
  const out = new Set<string>(mark ? [mark] : []);
  const ids = (an: Anchor) => ("a" in an ? [an.a] : "b" in an ? an.b : []);
  for (const k of snaps) {
    for (const ar of k.arrows ?? []) for (const i of [...ids(ar.from), ...ids(ar.to)]) out.add(i);
    const vis = k.snap.atoms.filter(a => (a.op ?? 1) > 0.05);
    for (const a of vis) if (a.q || a.hl || a.vac) out.add(a.id);
    for (const d of k.snap.dots) {
      let best: string | null = null, bd = 0.9;
      for (const a of vis) { const dd = Math.hypot(a.x - d.x, a.y - d.y); if (dd < bd) { bd = dd; best = a.id; } }
      if (best) out.add(best);
    }
  }
  return out;
}

/** Ausschnitt für eine Bühne W × H (px): ganzer Inhalt, wenn die Atomzeichen dabei mindestens 14 px groß sind; sonst ein Fenster in
 *  dieser Größe um die Reaktionsstelle (so nah wie möglich an der Mitte des Inhalts) */
function frameFor(b: Box | null, W: number, H: number, core: Box | null): Box {
  const box = fitBox(b ?? FALLBACK, W / H, 7, 4.4);
  if (W / (box.x1 - box.x0) >= MIN_SCALE || !core) return box;
  const ww = W / MIN_SCALE, hh = H / MIN_SCALE;
  if (core.x1 - core.x0 > ww || core.y1 - core.y0 > hh) return fitBox(core, W / H, 0, 0, 0.2);
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
  const cx = clamp((box.x0 + box.x1) / 2, core.x1 - ww / 2, core.x0 + ww / 2), cy = clamp((box.y0 + box.y1) / 2, core.y1 - hh / 2, core.y0 + hh / 2);
  return { x0: cx - ww / 2, x1: cx + ww / 2, y0: cy - hh / 2, y1: cy + hh / 2 };
}

export function MechStage({ snap, snapKey, clip, clipKey, onEnd, halos, lp, label, speed = 1, mark, corner }: {
  /** Standbild, wenn kein Ablauf läuft */
  snap: Snap;
  /** neuer Wert = anderes Standbild (Zurück, Von vorn, anderer Ansatz) */
  snapKey: number;
  clip: Clip | null;
  /** neuer Wert = Ablauf neu starten */
  clipKey: number;
  onEnd: () => void;
  halos: boolean;
  lp: boolean;
  label: string;
  speed?: number;
  /** Atom gestrichelt einkreisen (z. B. das Kettenende, an das das nächste Molekül kommt) */
  mark?: string;
  /** Ecke oben rechts (px), über der etwas liegt (Umschalter): bleibt frei, wenn dort sonst ein Atom läge */
  corner?: { w: number; h: number };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 390, h: 300 });
  const aspect = Math.round((size.w / size.h) * 20) / 20;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const upd = () => { if (el.clientHeight > 20) setSize(o => (Math.abs(o.w - el.clientWidth) < 1 && Math.abs(o.h - el.clientHeight) < 1 ? o : { w: el.clientWidth, h: el.clientHeight })); };
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const reduced = useReducedMotion();
  // Abspielzeit gehört zu genau einem Ablauf (neuer Ablauf beginnt bei 0, kein Aufblitzen des alten Stands)
  const [play, setPlay] = useState({ key: -1, ms: 0 });
  const ms = play.key === clipKey ? play.ms : 0;
  const end = useRef(onEnd);
  end.current = onEnd;
  const len = clip ? clipLength(clip) : 0;

  useEffect(() => {
    if (!clip) return;
    if (reduced) { setPlay({ key: clipKey, ms: len }); end.current(); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const v = (t - t0) * speed;
      setPlay({ key: clipKey, ms: Math.min(v, len) });
      if (v < len) raf = requestAnimationFrame(tick);
      else end.current();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipKey]);

  // Ausschnitt: Inhalt b, Reaktionsstelle aus den Bildern ks; liegt ein Atom unter der Ecke oben rechts, Ausschnitt in der Fläche darunter
  const fit = (b: Box | null, ks: { snap: Snap; arrows?: { from: Anchor; to: Anchor }[] }[]) => {
    const core = coreOf(ks, mark);
    const cb = core.size ? ks.reduce<Box | null>((acc, k) => {
      const q = boxOf(k.snap.atoms, [...core]);
      return !q ? acc : !acc ? q : { x0: Math.min(acc.x0, q.x0), y0: Math.min(acc.y0, q.y0), x1: Math.max(acc.x1, q.x1), y1: Math.max(acc.y1, q.y1) };
    }, null) : null;
    const core2 = cb && { x0: cb.x0 - 0.5, x1: cb.x1 + 0.5, y0: cb.y0 - 0.45, y1: cb.y1 + 0.45 };
    const box = frameFor(b, size.w, size.h, core2);
    if (!corner) return box;
    const s = size.w / (box.x1 - box.x0), cx0 = box.x1 - corner.w / s, cy1 = box.y0 + corner.h / s;
    // wie weit ragen Atome unter die Ecke? Passt es, rückt der Inhalt einfach so weit nach unten (Rand unten reicht)
    let need = 0;
    for (const k of ks) for (const a of k.snap.atoms) {
      if ((a.op ?? 1) <= 0.05 || (a.text ?? a.el) === "" || a.x + labelHalf(a) <= cx0 || a.x - labelHalf(a) >= box.x1 || a.y + 0.3 <= box.y0) continue;
      need = Math.max(need, cy1 - (a.y - 0.3));
    }
    if (need <= 0) return box;
    const bottom = b ? b.y1 + 0.15 : box.y1;
    if (need <= box.y1 - bottom) return { ...box, y0: box.y0 - need, y1: box.y1 - need };
    const H2 = Math.max(40, size.h - corner.h), b2 = frameFor(b, size.w, H2, core2), s2 = size.w / (b2.x1 - b2.x0);
    return { ...b2, y0: b2.y0 - corner.h / s2 };
  };
  // Ablauf: Überblick (erstes Bild) → ruhiger Ausschnitt des Rests
  const cc = useMemo(() => {
    if (!clip) return null;
    const rest = clip.length > 1 ? clip.slice(1) : clip;
    return { b0: fit(snapBox(clip[0].snap) ?? clipBox(clip), [clip[0], ...rest.filter(k => k.arrows?.length).slice(0, 1)]), b1: fit(clipBox(rest), rest), t1: Math.max(1, clip[0].hold + clip[0].move) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip, size.w, size.h]);
  const stillBox = useMemo(() => fit(snapBox(snap), [{ snap }]), [snap, size.w, size.h]); // eslint-disable-line react-hooks/exhaustive-deps
  const target = cc ? lerpBox(cc.b0, cc.b1, ease(Math.min(1, ms / cc.t1))) : stillBox;

  // weicher Übergang bei jedem Wechsel (neuer Ablauf, Ende, anderes Standbild)
  const ev = clip ? `c${clipKey}` : `s${snapKey}`;
  const cam = useRef<{ ev: string; from: Box | null; t0: number; aspect: number } | null>(null);
  const shown = useRef<Box | null>(null);
  if (!cam.current || cam.current.ev !== ev || cam.current.aspect !== aspect) {
    const jump = !shown.current || (cam.current !== null && cam.current.aspect !== aspect);
    cam.current = { ev, from: jump ? null : shown.current, t0: performance.now(), aspect };
  }
  const from = cam.current.from;
  const u = reduced || !from ? 1 : Math.min(1, (performance.now() - cam.current.t0) / 550);
  const box = u >= 1 || !from ? target : lerpBox(from, target, ease(u));
  shown.current = box;
  // ohne laufenden Ablauf: Kamerafahrt selbst weiterzeichnen
  const [, frame] = useState(0);
  useEffect(() => {
    if (u >= 1 || clip) return;
    const r = requestAnimationFrame(() => frame(f => f + 1));
    return () => cancelAnimationFrame(r);
  });

  const pose = clip ? poseAt(clip, ms) : still(snap);
  return (
    <div className="pm-mech" ref={ref} data-busy={clip ? "1" : undefined}>
      <MechSvg pose={pose} box={box} label={label} halos={halos} lp={lp} mark={mark} />
    </div>
  );
}
