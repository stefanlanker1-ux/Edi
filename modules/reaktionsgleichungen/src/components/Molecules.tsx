// Teilchenbild: links Kasten mit den Edukten, Pfeil, rechts Kasten mit den Produkten
// (bei hohem, schmalem Platz – Handy hochkant – übereinander mit Pfeil nach unten).
// Jeder Stoff steht als eigener Stapel – so viele Moleküle, wie der Koeffizient sagt. Kalottenmodell aus echter 3D-Geometrie
// (@lern/chem-ui Kalotte): Kugeln nach Tiefe sortiert und dezent schattiert, Farben aus der gemeinsamen Palette.

import { useId, useLayoutEffect, useRef, useState } from "react";
import { isMolecular, type Equation } from "@lern/chem";
import { Kalotte, KalotteShades, kalotteBox, kalotteElements } from "@lern/chem-ui";
import { Icon, Sheet, buzz } from "@lern/ui";
import { tr } from "@lern/i18n";

/** Teilchenbild nur, wenn alle Stoffe der Gleichung Moleküle sind */
export const hasModel = (eq: Equation) => [...eq.left, ...eq.right].every(isMolecular);

const NOBLE = new Set(["He", "Ne", "Ar", "Kr", "Xe", "Rn"]);
/** Elemente, die die Gleichung als einzelnes Atom schreibt, die aber aus vielen verbundenen Atomen bestehen (Kohlenstoff C, Schwefel S) –
 *  das Teilchenbild zeigt sie als eine Kugel, das wird als Modell gekennzeichnet */
export const singleAtoms = (eq: Equation) => [...new Set([...eq.left, ...eq.right].filter(f => /^[A-Z][a-z]?$/.test(f) && !NOBLE.has(f)))];

const PAD = .8, GAP = .45;
/** kleinste Darstellung: 10 px je Einheit (H-Atom ≥ 12 px) und Bildhöhe ≥ 56 px – sonst wird das Bild ausgeblendet statt zerdrückt */
const MIN_SCALE = 10, MIN_H = 56;

/**
 * Beide Kästen mit Pfeil. Jeder Stoff steht als Stapel, bei vielen Molekülen in mehreren Spalten.
 * Die Kästen passen sich dem Inhalt an (wenige Moleküle → groß dargestellt).
 */
export function MoleculeScene({ eq, coeffs, rows = 2, state }: {
  eq: Equation; coeffs: number[]; rows?: number;
  /** nach „Prüfen“: Rahmen grün (✓) bzw. gestrichelt rot */
  state?: "ok" | "bad";
}) {
  const n = eq.left.length, gid = useId().replace(/:/g, "");
  const all = [...eq.left, ...eq.right], boxes = all.map(kalotteBox);
  const colW = all.map((_, k) => boxes[k].w + GAP);
  // Zeilenhöhe je Stoff: ein großes Molekül (P₄O₁₀) macht nicht auch die Stapel der kleinen hoch
  const rowH = all.map((_, k) => boxes[k].h + GAP);
  const AR = 3.2; // Platz für den Pfeil
  // Hoch- oder Querformat: je nachdem, was im verfügbaren Platz größer wird (Handy hochkant → Kästen übereinander)
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<[number, number] | null>(null);
  const [big, setBig] = useState(false);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize([el.clientWidth, el.clientHeight]));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  /** Anordnung mit höchstens R Zeilen je Stapel: Spalten je Stoff, Breite und Höhe eines Kastens (so hoch wie der höchste Stapel) */
  const layout = (R: number) => {
    const cols = all.map((_, k) => Math.max(1, Math.ceil(coeffs[k] / R)));
    const sideW = (from: number, to: number) => colW.slice(from, to).reduce((a, w, i) => a + w * cols[from + i], 0);
    const H = Math.max(...all.map((_, k) => Math.ceil(coeffs[k] / cols[k]) * rowH[k])) + 2 * PAD;
    return { R, cols, sideW, W: Math.max(sideW(0, n), sideW(n, all.length)) + 2 * PAD, H };
  };
  const across1 = (L: ReturnType<typeof layout>) => !size || Math.min(size[0] / (2 * L.W + AR), size[1] / L.H) >= Math.min(size[0] / L.W, size[1] / (2 * L.H + AR)) * .92;
  const scale = (L: ReturnType<typeof layout>) => (!size ? 0 : across1(L) ? Math.min(size[0] / (2 * L.W + AR), size[1] / L.H) : Math.min(size[0] / L.W, size[1] / (2 * L.H + AR)));
  // so viele Zeilen, dass die Moleküle am größten werden (ein großes Molekül wie P₄O₁₀ macht jede Zeile hoch – dann lieber breiter)
  const maxR = Math.max(rows, Math.ceil(Math.sqrt(1.5 * Math.max(...coeffs))));
  let L = layout(maxR);
  for (let r = rows; size && r < maxR; r++) { const c = layout(r); if (scale(c) > scale(L) * 1.05) L = c; }
  const { R, cols, sideW, W, H } = L;
  const across = across1(L);
  const [ox, oy] = across ? [W + AR, 0] : [0, H + AR];
  const side = (from: number, to: number, x0: number, y0: number) => {
    let x = x0 + (W - sideW(from, to)) / 2;
    return all.slice(from, to).map((f, i) => {
      const k = from + i, p = Math.max(1, Math.ceil(coeffs[k] / R)), left = x + colW[k] * (cols[k] - p) / 2;
      x += colW[k] * cols[k];
      return Array.from({ length: coeffs[k] }, (_, j) => (
        <Kalotte key={`${k}-${j}`} f={f} gid={gid} cx={left + colW[k] * (j % p + .5)} cy={y0 + H - PAD - rowH[k] * (Math.floor(j / p) + .5)} />
      ));
    });
  };
  const frame = (x: number, y: number) => <rect className={`ms-box${state ? ` ${state}` : ""}`} x={x + .1} y={y + .1} width={W - .2} height={H - .2} rx={.25} />;
  const arrow = across
    ? `M${W + .5} ${H / 2 - .35}h${AR - 1.9}v-.55l1.1 .9-1.1 .9v-.55h-${AR - 1.9}z`
    : `M${W / 2 - .35} ${H + .5}v${AR - 1.9}h-.55l.9 1.1 .9-1.1h-.55v-${AR - 1.9}z`;
  const single = singleAtoms(eq), list = single.join(tr(" und ", " and "));
  // Platz für das Bild (ohne den Modell-Hinweis darunter, am schmalen Handy zweizeilig)
  const noteH = single.length ? (size && size[0] < 330 ? 44 : 24) : 0;
  const avail = size ? [size[0], size[1] - noteH] : null;
  const sc = avail ? (across ? Math.min(avail[0] / (2 * W + AR), avail[1] / H) : Math.min(avail[0] / W, avail[1] / (2 * H + AR))) : Infinity;
  if (avail && (sc < MIN_SCALE || avail[1] < MIN_H)) {
    return (
      <div className="ms-wrap ms-off" ref={wrap}>
        {/* zu wenig Platz: das Bild groß im Blatt statt zerdrückt in der Karte */}
        {size![1] >= 44
          ? <button type="button" className="ms-open" onClick={() => { buzz(); setBig(true); }}><Icon name="molecule" size={18} /> {tr("Teilchenbild ansehen", "Show particle picture")}</button>
          : size![1] >= 24 && <p className="ms-off-note">{tr("Teilchenbild: zu wenig Platz", "Particle picture: not enough room")}</p>}
        <Sheet open={big} title={tr("Teilchenbild", "Particle picture")} onClose={() => setBig(false)}>
          <div className="rg-anim-box"><MoleculeScene eq={eq} coeffs={coeffs} rows={rows} state={state} /></div>
        </Sheet>
      </div>
    );
  }
  return (
    <div className="ms-wrap" ref={wrap}>
      <svg className="ms" viewBox={across ? `0 0 ${2 * W + AR} ${H}` : `0 0 ${W} ${2 * H + AR}`} role="img" preserveAspectRatio="xMidYMid meet"
        aria-label={`${tr("Links", "Left")} ${eq.left.map((f, k) => `${coeffs[k]} × ${f}`).join(", ")}; ${tr("rechts", "right")} ${eq.right.map((f, k) => `${coeffs[n + k]} × ${f}`).join(", ")}`}>
        <KalotteShades gid={gid} els={kalotteElements(all)} />
        {frame(0, 0)}
        {frame(ox, oy)}
        <g className="ms-edukte">{side(0, n, 0, 0)}</g>
        <g className="ms-produkte">{side(n, all.length, ox, oy)}</g>
        <path className="ms-arrow" d={arrow} />
      </svg>
      {single.length > 0 && <p className="ms-note">{tr(`Modell: ${list} als ${single.length > 1 ? "einzelne Atome" : "einzelnes Atom"} gezeichnet`, `Model: ${list} drawn as ${single.length > 1 ? "single atoms" : "a single atom"}`)}</p>}
    </div>
  );
}
