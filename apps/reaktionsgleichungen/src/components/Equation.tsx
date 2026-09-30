// Gleichung mit Koeffizienten – immer in einer Zeile wie im Heft (nie umbrechen). Die Schrift passt sich der Breite an
// (Fit-Text: erst messen, dann verkleinern, mindestens 10 px). Jeder Stoff ist als Ganzes das Tippziel (Zahl + Formel,
// mindestens 44 px hoch) – antippen öffnet die Zahlenauswahl. Ohne onChange nur die Zahlen (Anzeige).

import { useLayoutEffect, useRef, useState } from "react";
import { Sheet, buzz } from "@lern/ui";
import { toSubscript, type Equation as Eq } from "@lern/chem";

/** Größte wählbare Zahl: bis 12, bei kniffligen Gleichungen (Niveau 4) bis 30 */
export const maxCoef = (r: { niveau: number }) => (r.niveau >= 4 ? 30 : 12);

const MIN = 10;

/** Schriftgröße so wählen, dass die Zeile in den Platz passt (bei Größenänderung und neuem Inhalt neu gemessen).
 *  Die Größe wird direkt am Element gesetzt – so misst jeder Durchgang denselben Zustand, den man sieht. */
function useFitFont(deps: unknown[], BASE = 26) {
  const box = useRef<HTMLDivElement>(null), line = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const outer = box.current, inner = line.current;
    if (!outer || !inner) return;
    const fit = () => {
      // bei voller Größe messen, dann in bis zu vier Schritten annähern (feste Mindestbreiten skalieren nicht linear)
      let s = BASE;
      inner.style.transform = "";
      inner.style.fontSize = `${s}px`;
      for (let i = 0; i < 4; i++) {
        const need = inner.scrollWidth, have = outer.clientWidth;
        if (need <= have || s <= MIN) break;
        s = Math.max(MIN, Math.floor(s * have / need * 10) / 10);
        inner.style.fontSize = `${s}px`;
      }
      // Notbremse: passt es selbst mit der kleinsten Schrift nicht, als Ganzes verkleinern – nie abschneiden
      const need = inner.scrollWidth, have = outer.clientWidth;
      if (have > 0 && need > have) { inner.style.transformOrigin = "left center"; inner.style.transform = `scale(${have / need})`; }
    };
    fit();
    // neu messen, wenn sich der Platz oder der Inhalt ändert und wenn die Schrift (Inter) fertig geladen ist
    const ro = new ResizeObserver(() => fit());
    ro.observe(outer);
    ro.observe(inner);
    const fonts = document.fonts;
    let alive = true;
    fonts?.ready.then(() => alive && fit());
    fonts?.addEventListener?.("loadingdone", fit);
    return () => { alive = false; ro.disconnect(); fonts?.removeEventListener?.("loadingdone", fit); };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return { box, line };
}

export function EquationRow({ eq, coeffs, onChange, max = 12 }: { eq: Eq; coeffs: number[]; onChange?: (k: number, v: number) => void; max?: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const all = [...eq.left, ...eq.right], n = eq.left.length;
  const { box, line } = useFitFont([all.join("+"), coeffs.join(",")]);
  return (
    <>
      <div className="eq-fit" ref={box}>
        <div className={`eq-row${onChange ? " edit" : ""}`} ref={line} role="group" aria-label="Gleichung">
          {all.map((f, k) => {
            const op = k === n ? <span className="eq-op eq-arrow" aria-hidden="true">→</span> : k > 0 ? <span className="eq-op" aria-hidden="true">+</span> : null;
            const body = <>{(onChange || coeffs[k] !== 1) && <span className={`eq-num${coeffs[k] === 1 ? " one" : ""}`}>{coeffs[k]}</span>}<span className="eq-formula">{toSubscript(f)}</span></>;
            return (
              <span key={k} className="eq-part">
                {op}
                {onChange
                  ? <button type="button" className="eq-term" aria-label={`${coeffs[k]} ${toSubscript(f)} – Zahl ändern`} onClick={() => { buzz(); setOpen(k); }}>{body}</button>
                  : <span className="eq-term">{body}</span>}
              </span>
            );
          })}
        </div>
      </div>
      {onChange && (
        <Sheet open={open !== null} title={open !== null ? `Wie viele ${toSubscript(all[open])}?` : ""} onClose={() => setOpen(null)}>
          <div className="eq-pick" role="radiogroup">
            {Array.from({ length: max }, (_, i) => i + 1).map(v => (
              <button key={v} type="button" role="radio" aria-checked={open !== null && coeffs[open] === v}
                className={open !== null && coeffs[open] === v ? "on" : undefined}
                onClick={() => { buzz(); onChange(open!, v); setOpen(null); }}>{v}</button>
            ))}
          </div>
        </Sheet>
      )}
    </>
  );
}

/** Einzeilige Formelgleichung als Text (Quiz): Schrift passt sich der Breite an, nie umbrechen */
export function FitLine({ text, className = "", base = 26 }: { text: string; className?: string; base?: number }) {
  const { box, line } = useFitFont([text, base], base);
  return (
    <div className="eq-fit" ref={box}>
      <div className={`fit-line ${className}`} ref={line}>{text}</div>
    </div>
  );
}
