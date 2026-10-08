// Ausschnitt aus dem Natriumchlorid-Gitter (eine Schicht): Na⁺ und Cl⁻ im Wechsel, jedes Ion zwischen entgegengesetzt
// geladenen Nachbarn. Größen im Verhältnis der Ionenradien (Na⁺ 102 pm, Cl⁻ 181 pm), Abstände zur Deutlichkeit vergrößert;
// die Linien zu den Nachbarn deuten die Anziehung an, gestrichelt am Rand: das Gitter geht weiter.

import { tr } from "@lern/i18n";

const D = 64;                         // Abstand Nachbar–Nachbar
const R_CL = 28, R_NA = (R_CL * 102) / 181;
const OUT = D * 0.6;                  // Linie über den Rand hinaus

export function IonLattice({ cols = 4, rows = 3, focus = false }: { cols?: number; rows?: number; focus?: boolean }) {
  const pad = OUT + 4;
  const W = (cols - 1) * D + 2 * pad, H = (rows - 1) * D + 2 * pad;
  const at = (i: number) => pad + i * D;
  const cation = (i: number, j: number) => (i + j) % 2 === 1;
  // hervorgehoben: ein Na⁺ in der Mitte, seine vier Nachbarn und die Linien zu ihnen
  let fi = Math.floor((cols - 1) / 2);
  const fj = Math.floor((rows - 1) / 2);
  if (!cation(fi, fj)) fi++;
  const hot = (i: number, j: number) => focus && Math.abs(i - fi) + Math.abs(j - fj) <= 1;
  const lines: { x1: number; y1: number; x2: number; y2: number; cls?: string }[] = [];
  for (let j = 0; j < rows; j++) {
    lines.push({ x1: at(0), y1: at(j), x2: at(cols - 1), y2: at(j) });
    lines.push({ x1: at(0) - OUT, y1: at(j), x2: at(0), y2: at(j), cls: "more" }, { x1: at(cols - 1), y1: at(j), x2: at(cols - 1) + OUT, y2: at(j), cls: "more" });
  }
  for (let i = 0; i < cols; i++) {
    lines.push({ x1: at(i), y1: at(0), x2: at(i), y2: at(rows - 1) });
    lines.push({ x1: at(i), y1: at(0) - OUT, x2: at(i), y2: at(0), cls: "more" }, { x1: at(i), y1: at(rows - 1), x2: at(i), y2: at(rows - 1) + OUT, cls: "more" });
  }
  if (focus) for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) lines.push({ x1: at(fi), y1: at(fj), x2: at(fi + di), y2: at(fj + dj), cls: "hot" });
  return (
    <figure className="ib-lat">
      <svg viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={tr("Ausschnitt aus dem Natriumchlorid-Gitter: Natrium-Ionen und Chlorid-Ionen liegen abwechselnd nebeneinander.", "Section of the sodium chloride lattice: sodium ions and chloride ions alternate.")}>
        <g className="ib-lat-lines">
          {lines.map(({ cls, ...l }, k) => <line key={k} {...l} className={cls} />)}
        </g>
        {Array.from({ length: rows }, (_, j) => Array.from({ length: cols }, (_, i) => {
          const na = cation(i, j);
          return (
            <g key={`${i}-${j}`} className={`ib-lat-ion ${na ? "cation" : "anion"}${hot(i, j) ? " hot" : ""}`}>
              <circle cx={at(i)} cy={at(j)} r={na ? R_NA : R_CL} />
              <text x={at(i)} y={at(j)} dy=".35em">{na ? "Na⁺" : "Cl⁻"}</text>
            </g>
          );
        }))}
      </svg>
      <figcaption>{tr("Natriumchlorid: Ausschnitt aus einer Schicht", "Sodium chloride: section of one layer")}</figcaption>
    </figure>
  );
}
