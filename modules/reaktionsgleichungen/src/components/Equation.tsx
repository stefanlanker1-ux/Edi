// Gleichung mit Koeffizienten – immer in einer Zeile wie im Heft (nie umbrechen). Die Schrift passt sich der Breite an
// (Fit-Text: erst messen, dann verkleinern, mindestens 10 px). Jeder Stoff ist als Ganzes das Tippziel (Zahl + Formel,
// mindestens 44 px hoch) – antippen öffnet die Zahlenauswahl. Ohne onChange nur die Zahlen (Anzeige).

import { useLayoutEffect, useRef, useState } from "react";
import { Sheet, buzz } from "@lern/ui";
import { toSubscript, type Equation as Eq } from "@lern/chem";
import { tr } from "@lern/i18n";

/** Größte wählbare Zahl: bis 12, bei kniffligen Gleichungen (Niveau 4) bis 40 (Dodecan braucht 37) */
export const maxCoef = (r: { niveau: number }) => (r.niveau >= 4 ? 40 : 12);

const MIN = 10;

/** Schriftgröße so wählen, dass die Zeile in den Platz passt (bei Größenänderung und neuem Inhalt neu gemessen).
 *  Die Größe wird direkt am Element gesetzt – so misst jeder Durchgang denselben Zustand, den man sieht.
 *  Nie eine Rückkopplung: beobachtet wird nur die Breite des Platzes (nicht die Zeile selbst, deren Größe wir ja setzen), angepasst wird nur,
 *  wenn sie sich wirklich geändert hat, und höchstens 8-mal ohne 2 s Pause. Der Platz hängt nicht vom Inhalt ab (`.eq-fit` mit `contain: inline-size`) –
 *  in Safari wuchs der Rahmen sonst mit der großen Schrift, die Zeile wurde winzig, der Rahmen schrumpfte … (Gleichung sprang hin und her). */
function useFitFont(deps: unknown[], BASE = 26) {
  const box = useRef<HTMLDivElement>(null), line = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const outer = box.current, inner = line.current;
    if (!outer || !inner) return;
    let lastW = -1, runs = 0, last = 0;
    const fit = () => {
      // Notbremse gegen Aufschaukeln: höchstens 8 Anpassungen ohne Pause; erst nach 2 s Ruhe wieder frei
      const now = performance.now();
      if (now - last > 2000) runs = 0;
      last = now;
      if (++runs > 8) return;
      // 1 px Luft: Rundung der Textbreite (Safari misst in Bruchteilen) kippt die Zeile nicht über den Rand
      const have = outer.clientWidth - 1;
      lastW = outer.clientWidth;
      // bei voller Größe messen, dann in bis zu vier Schritten annähern (feste Mindestbreiten skalieren nicht linear)
      let s = BASE;
      inner.style.transform = "";
      inner.style.fontSize = `${s}px`;
      for (let i = 0; i < 4; i++) {
        const need = inner.scrollWidth;
        if (need <= have || s <= MIN) break;
        s = Math.max(MIN, Math.floor(s * have / need * 10) / 10);
        inner.style.fontSize = `${s}px`;
      }
      // Notbremse: passt es selbst mit der kleinsten Schrift nicht, als Ganzes verkleinern – nie abschneiden
      const need = inner.scrollWidth;
      if (have > 0 && need > have) { inner.style.transformOrigin = "left center"; inner.style.transform = `scale(${have / need})`; }
    };
    fit();
    // neu messen, wenn sich die Breite des Platzes ändert und wenn die Schrift (Inter) fertig geladen ist
    const ro = new ResizeObserver(() => { if (Math.abs(outer.clientWidth - lastW) >= 1) fit(); });
    ro.observe(outer);
    const fonts = document.fonts;
    let alive = true;
    const refit = () => { if (alive) { runs = 0; fit(); } };
    fonts?.ready.then(refit);
    fonts?.addEventListener?.("loadingdone", refit);
    return () => { alive = false; ro.disconnect(); fonts?.removeEventListener?.("loadingdone", refit); };
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
        <div className={`eq-row${onChange ? " edit" : ""}`} ref={line} role="group" aria-label={tr("Gleichung", "Equation")}>
          {all.map((f, k) => {
            const op = k === n ? <span className="eq-op eq-arrow" aria-hidden="true">→</span> : k > 0 ? <span className="eq-op" aria-hidden="true">+</span> : null;
            const body = <>{(onChange || coeffs[k] !== 1) && <span className={`eq-num${coeffs[k] === 1 ? " one" : ""}`}>{coeffs[k]}</span>}<span className="eq-formula">{toSubscript(f)}</span></>;
            return (
              <span key={k} className="eq-part">
                {op}
                {onChange
                  ? <button type="button" className="eq-term" aria-label={tr(`${coeffs[k]} ${toSubscript(f)} – Zahl ändern`, `${coeffs[k]} ${toSubscript(f)} – change number`)} onClick={() => { buzz(); setOpen(k); }}>{body}</button>
                  : <span className="eq-term">{body}</span>}
              </span>
            );
          })}
        </div>
      </div>
      {onChange && (
        <Sheet open={open !== null} title={open !== null ? tr(`Wie viele ${toSubscript(all[open])}?`, `How many ${toSubscript(all[open])}?`) : ""} onClose={() => setOpen(null)}>
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
