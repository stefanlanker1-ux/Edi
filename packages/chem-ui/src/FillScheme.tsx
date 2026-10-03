// Kästchenschema zum Selbst-Befüllen (Hilfe neben Konfigurationsaufgaben): Kästchen antippen – leer → ↑ → ↑↓;
// darunter die Elektronenzahl und die Konfiguration, die gerade entsteht. `reveal` zeigt die richtige Füllung.

import { useState } from "react";
import { MADELUNG, configuration, hundBoxes } from "@lern/chem";
import { Fit } from "@lern/ui";
import { tr } from "@lern/i18n";
import { EnergyDiagram } from "./EnergyDiagram.tsx";

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (k: number) => String(k).split("").map(d => SUP[+d]).join("");

/** Index der höchsten Unterschale, die für `electrons` gebraucht wird, plus eine darüber (verrät nicht, wo Schluss ist) */
export function schemeTop(electrons: number) {
  let cap = 0, i = 0;
  for (; i < MADELUNG.length && cap < electrons; i++) cap += MADELUNG[i].max;
  return Math.min(MADELUNG.length - 1, i);
}

export function FillScheme({ Z, electrons = Z, upTo = schemeTop(electrons), reveal = false }: { Z: number; electrons?: number; upTo?: number; reveal?: boolean }) {
  const shells = MADELUNG.slice(0, upTo + 1);
  const [boxes, setBoxes] = useState<Record<string, number[]>>(() => Object.fromEntries(shells.map(o => [o.key, new Array<number>(2 * o.l + 1).fill(0)])));
  const right = Object.fromEntries(configuration(Z, electrons).map(o => [o.key, o.count]));
  const shown = reveal ? Object.fromEntries(shells.map(o => [o.key, hundBoxes(o.l, right[o.key] ?? 0)])) : boxes;
  const count = (key: string) => (shown[key] ?? []).reduce((a, b) => a + b, 0);
  const total = shells.reduce((t, o) => t + count(o.key), 0);
  const text = shells.filter(o => count(o.key)).map(o => o.key + sup(count(o.key))).join(" ");
  const tap = (key: string, i: number) => { if (!reveal) setBoxes(b => ({ ...b, [key]: b[key].map((v, k) => (k === i ? (v + 1) % 3 : v)) })); };
  return (
    <div className="fill-scheme">
      <Fit className="fill-scheme-fit" min={0.2}>
        <EnergyDiagram cfg={[]} lastIndex={upTo} boxes={shown} onBox={tap} />
      </Fit>
      <p className={`fill-scheme-sum${total === electrons ? " full" : total > electrons ? " over" : ""}`} aria-live="polite">
        <b>{total} / {electrons}</b> {tr("Elektronen", "electrons")}{text && <> · <span>{text}</span></>}
      </p>
    </div>
  );
}
