// Auswahl von Größe und Einheiten als native Auswahllisten: eine Zeile statt vieler Chips
// (am Handy öffnet sich die gewohnte Systemauswahl, Tippziel ≥ 44 px).

import { useLayoutEffect, useRef } from "react";
import { quantitiesFor, unitName, QUANTITY } from "@lern/units";

export function QuantitySelect({ value, os, onChange }: { value: string; os: boolean; onChange: (id: string) => void }) {
  const list = quantitiesFor(os);
  const base = list.filter(x => x.kind !== "compound");
  const comp = list.filter(x => x.kind === "compound");
  const hint = QUANTITY[value]?.kind === "compound" ? QUANTITY[value].hint?.split(" – ")[0] : undefined;
  return (
    <div className="qty-row">
    <label className="sel sel-qty">
      <select value={value} onChange={e => onChange(e.target.value)} aria-label="Größe">
        {comp.length
          ? <>
              <optgroup label="Grundgrößen">{base.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>
              <optgroup label="Zusammengesetzt">{comp.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>
            </>
          : base.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
    </label>
    {hint && <span className="sel-hint">{hint}</span>}
    </div>
  );
}

/** Angezeigte Einheit passt immer ganz hinein (m/min, kg/m³ am schmalen Handy): Schrift wird kleiner statt „m/…“ */
function useFitFace(value: string) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = "";
      for (let k = 0.95; k >= 0.5 && el.scrollWidth > el.clientWidth + 1; k -= 0.05) el.style.fontSize = `${k * 1.2}rem`;
    };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);
  return ref;
}

export function UnitSelect({ label, units, value, onChange }: { label: string; units: string[]; value: string; onChange: (u: string) => void }) {
  const face = useFitFace(value);
  return (
    <label className="sel sel-unit">
      <select value={value} onChange={e => onChange(e.target.value)} aria-label={label} style={{ width: `calc(${Math.max(2, value.length) * 1.2}ch + 48px)` }}>
        {units.map(u => <option key={u} value={u}>{u} – {unitName(u)}</option>)}
      </select>
      <span className="sel-face" aria-hidden="true" ref={face}>{value}</span>
    </label>
  );
}
