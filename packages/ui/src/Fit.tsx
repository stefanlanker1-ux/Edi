// Passt den Inhalt in den verfügbaren Platz ein (verkleinert ihn bei Bedarf) – statt zu scrollen oder abzuschneiden.
// Der Inhalt wird in voller Breite gesetzt und nur verkleinert, wenn er zu hoch ist.

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export function Fit({ children, className, min = 0.4, minHeight = 0 }: {
  children: ReactNode; className?: string;
  /** kleinster Verkleinerungsfaktor */
  min?: number;
  /** verkleinert niedriger als so viele Pixel: zu klein, um etwas zu erkennen – wie abgeschnitten (data-cut) */
  minHeight?: number;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ k: 1, y: 0, cut: false });
  useLayoutEffect(() => {
    const o = outer.current, i = inner.current;
    if (!o || !i) return;
    const update = () => {
      // ausgeblendet (display: none): Stand behalten, sonst schaltete das Ausblenden sich selbst wieder ab
      if (!o.clientWidth && !o.clientHeight) return;
      const h = Math.max(1, i.scrollHeight);
      const s = Math.min(1, o.clientWidth / Math.max(1, i.scrollWidth), o.clientHeight / h);
      const k = Number.isFinite(s) && s > 0 ? Math.max(min, s) : 1;
      // passt der Inhalt selbst verkleinert nicht (bzw. nur unter minHeight): data-cut am Rahmen – wer Fit nutzt, kann das Bild dann ganz
      // ausblenden statt einen Rest zu zeigen
      setT({ k, y: Math.max(0, (o.clientHeight - h * k) / 2), cut: Number.isFinite(s) && (s < min || (s < 1 && h * k < minHeight)) });
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(o); ro.observe(i);
    return () => ro.disconnect();
  }, [min, minHeight]);
  return (
    <div ref={outer} className={`ui-fit${className ? " " + className : ""}`} data-cut={t.cut || undefined}>
      <div ref={inner} className="ui-fit-inner" style={{ transform: `translateY(${t.y}px)${t.k < 1 ? ` scale(${t.k})` : ""}` }}>{children}</div>
    </div>
  );
}

/** Verkleinert den Inhalt nur so weit, dass sein scrollbarer Rahmen (z. B. ein Blatt) nicht mehr scrollt – für lange Zeichnungen wie das Energieschema von Rn */
export function FitDown({ children, className, min = 0.45 }: { children: ReactNode; className?: string; min?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // alle scrollbaren Rahmen (verschachtelte Register: der äußere kann überlaufen, der innere nicht)
    const boxes: HTMLElement[] = [];
    for (let a = el.parentElement; a; a = a.parentElement) if (/(auto|scroll)/.test(getComputedStyle(a).overflowY)) boxes.push(a);
    const fit = () => {
      el.style.zoom = ""; el.style.overflowY = "hidden";
      // Überlauf der Seite, der scrollbaren Rahmen darüber oder des eigenen (von einem Raster gestauchten) Rahmens
      const over = Math.max(document.documentElement.scrollHeight - innerHeight, el.scrollHeight - el.clientHeight, ...boxes.map(b => b.scrollHeight - b.clientHeight));
      if (over <= 1) return;
      const h = el.scrollHeight, z = (h - over - 2) / h;
      el.style.zoom = String(Math.max(min, z));
      // reicht die kleinste Stufe nicht, lieber scrollen als etwas abschneiden
      if (z < min) el.style.overflowY = "visible";
    };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => requestAnimationFrame(fit));
    boxes.forEach(b => ro.observe(b));
    return () => ro.disconnect();
  });
  return <div ref={ref} className={className} style={{ overflowY: "hidden" }}>{children}</div>;
}
