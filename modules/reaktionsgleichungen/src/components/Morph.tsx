// Animierter Übergang von den Edukten zu den Produkten (Logik in morph.ts): Abspielen oder selbst mit dem Regler
// Edukte ↔ Produkte schieben. Darunter der Abschnitt (Bindungen brechen · Atome ordnen sich neu · neue Bindungen) und die
// Atome je Element – die Zahlen bleiben während des ganzen Übergangs gleich. Bei reduzierter Bewegung springt
// „Abspielen“ ohne Animation ans Ende; der Regler geht immer.

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button, Tag, tr, useReducedMotion } from "@lern/ui";
import { atomRadius, parseFormula, toSubscript, type Equation } from "@lern/chem";
import { KalotteShades, kalotteElements } from "@lern/chem-ui";
import { atomAt, morphPhase, morphScene } from "./morph.ts";

const DURATION = 3600;

const PHASE = () => ({
  edukte: tr("Edukte", "Reactants"), lockern: tr("Bindungen brechen", "Bonds break"), wandern: tr("Atome ordnen sich neu", "Atoms regroup"),
  binden: tr("Neue Bindungen", "New bonds"), produkte: tr("Produkte", "Products"),
});

/** Atome je Element auf einer Seite der Gleichung (Kohlenstoff, Wasserstoff, dann alphabetisch) */
function atomCounts(fs: string[], coeffs: number[]): [string, number][] {
  const c: Record<string, number> = {};
  fs.forEach((f, k) => { for (const [el, m] of Object.entries(parseFormula(f))) c[el] = (c[el] ?? 0) + m * coeffs[k]; });
  const rank = (el: string) => (el === "C" ? "0" : el === "H" ? "1" : "2" + el);
  return Object.entries(c).sort((a, b) => rank(a[0]).localeCompare(rank(b[0])));
}

export function ReactionMorph({ eq, coeffs, autoplay = false, controls = true, onEnd }: {
  eq: Equation; coeffs: number[];
  /** Regler und Knopf zeigen (aus: nur das Bild der Edukte, z. B. vor einer Vorhersage) */
  controls?: boolean;
  /** beim Erscheinen einmal abspielen */
  autoplay?: boolean;
  /** Produkte erreicht (abgespielt oder Regler ganz rechts) */
  onEnd?: () => void;
}) {
  const gid = useId().replace(/:/g, "");
  // Seitenverhältnis des Bildes (gerundet): hochkant mehrere Reihen, damit die Teilchen groß werden
  const box = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(1.6);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { if (el.clientHeight > 0) setAspect(Math.round((el.clientWidth / el.clientHeight) * 4) / 4 || .25); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scene = useMemo(() => morphScene(eq, coeffs, aspect), [eq, coeffs, aspect]);
  const els = useMemo(() => kalotteElements([...eq.left, ...eq.right]), [eq]);
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0), ended = useRef(false);
  const endCb = useRef(onEnd);
  endCb.current = onEnd;

  useEffect(() => { if (t >= 1 && !ended.current) { ended.current = true; endCb.current?.(); } }, [t]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const play = () => {
    cancelAnimationFrame(raf.current);
    if (reduced) { setT(1); return; }
    const t0 = t >= 1 ? 0 : t, start = performance.now() - t0 * DURATION;
    setPlaying(true);
    const tick = (now: number) => {
      const v = Math.min(1, (now - start) / DURATION);
      setT(v);
      if (v < 1) raf.current = requestAnimationFrame(tick); else setPlaying(false);
    };
    raf.current = requestAnimationFrame(tick);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (autoplay) play(); }, []);

  const atoms = scene.atoms.map(a => ({ el: a.el, p: atomAt(a, t) })).sort((a, b) => a.p[2] - b.p[2]);
  const phase = morphPhase(t), names = PHASE();
  const n = eq.left.length;
  const side = (fs: string[], cs: number[]) => fs.map((f, k) => `${cs[k] > 1 ? cs[k] + " " : ""}${toSubscript(f)}`).join(" + ");
  return (
    <div className="mo">
      <div className="mo-box" ref={box}><svg className="mo-svg" viewBox={`${-scene.w / 2} ${-scene.h / 2} ${scene.w} ${scene.h}`} role="img" preserveAspectRatio="xMidYMid meet"
        aria-label={`${names[phase]}: ${t < .5 ? side(eq.left, coeffs.slice(0, n)) : side(eq.right, coeffs.slice(n))}`}>
        <KalotteShades gid={gid} els={els} />
        {atoms.map((a, i) => (
          <circle key={i} className="kal-atom" style={{ fill: `url(#${gid}-${a.el})`, stroke: `color-mix(in srgb, var(--atom-${a.el}) 55%, var(--atom-edge))` }}
            cx={a.p[0]} cy={a.p[1]} r={atomRadius(a.el)} />
        ))}
      </svg></div>
      {controls && <div className="mo-ctrl">
        <Button variant="primary" icon={t >= 1 && !playing ? "reset" : "play"} onClick={play} disabled={playing}>
          {t >= 1 && !playing ? tr("Noch einmal", "Again") : tr("Abspielen", "Play")}
        </Button>
        <label className="mo-range">
          <span>{tr("Edukte", "Reactants")}</span>
          <input type="range" min={0} max={100} step={1} value={Math.round(t * 100)} aria-label={tr("Übergang Edukte zu Produkten", "Transition from reactants to products")}
            onChange={e => { cancelAnimationFrame(raf.current); setPlaying(false); setT(Number(e.target.value) / 100); }} />
          <span>{tr("Produkte", "Products")}</span>
        </label>
      </div>}
      <div className="mo-status">
        <Tag>{names[phase]}</Tag>
        <span className="mo-count" aria-label={tr("Atome", "Atoms")}>{atomCounts(eq.left, coeffs.slice(0, n)).map(([el, c]) => <span key={el}><b>{c}</b> {el}</span>)}</span>
      </div>
    </div>
  );
}
