// Bühne der Atom-Ansicht: spielt einen Ablauf (Clip) ab und zeigt danach das Standbild.
// Kamera: Ein Ablauf beginnt im Ausschnitt seines ersten Bilds (Überblick) und fährt während des ersten Schritts zum ruhigen
// Ausschnitt des restlichen Ablaufs (Umriss aller weiteren Bilder); jeder Wechsel – neuer Ablauf, Ende, Zurück – wird in
// 550 ms weich angefahren, eine andere Bühnengröße ohne Fahrt. Bewegung reduziert: gleich das Endbild.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@lern/ui";
import { clipBox, clipLength, fitBox, lerpBox, poseAt, snapBox, still, type Box, type Clip, type Snap } from "../chem/scene.ts";
import { MechSvg } from "./MechSvg.tsx";

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const FALLBACK: Box = { x0: -3, y0: -2, x1: 3, y1: 2 };

export function MechStage({ snap, snapKey, clip, clipKey, onEnd, halos, lp, label, speed = 1, mark }: {
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
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(1.3);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const upd = () => { if (el.clientHeight > 20) setAspect(Math.round((el.clientWidth / el.clientHeight) * 20) / 20); };
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

  const fit = (b: Box | null) => fitBox(b ?? FALLBACK, aspect, 7, 4.4);
  // Ablauf: Überblick (erstes Bild) → ruhiger Ausschnitt des Rests
  const cc = useMemo(() => {
    if (!clip) return null;
    const rest = clip.length > 1 ? clip.slice(1) : clip;
    return { b0: fit(snapBox(clip[0].snap) ?? clipBox(clip)), b1: fit(clipBox(rest)), t1: Math.max(1, clip[0].hold + clip[0].move) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip, aspect]);
  const stillBox = useMemo(() => fit(snapBox(snap)), [snap, aspect]); // eslint-disable-line react-hooks/exhaustive-deps
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
