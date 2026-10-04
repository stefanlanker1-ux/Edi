// Zeichenvorlagen für das Stufenwachstum: Moleküle mit funktionellen Gruppen, waagrecht (linke Gruppe – Gerüst – rechte Gruppe).
// Jede reaktive Gruppe liefert ein „Ende“: das Atom, das die neue Bindung eingeht, und die Atome, die abgespalten werden.
// Lage wie bei der Kette: Bindungslänge 1, Gruppen senkrecht (=O oben, OH bzw. Cl unten), damit beim Verknüpfen
// das Wasser bzw. HCl unterhalb der neuen Bindung entsteht.

import { stepMono, type FG, type StepId } from "./data.ts";
import { benzene, type Ctx } from "./draw.ts";
import type { Scene } from "./scene.ts";

export interface End {
  fg: FG;
  /** Atom, das die neue Bindung eingeht (C der Säuregruppe, O, N, mittleres C der Isocyanatgruppe, CH₂ des Epoxidrings) */
  anchor: string;
  /** abgespaltene Atome (OH bzw. Cl der Säure, H des Alkohols/Amins) */
  leave: string[];
  /** weitere Atome der Gruppe (Isocyanat: N, O; Epoxid: CH, O) */
  extra: Record<string, string>;
  /** Seite: +1 rechts, −1 links */
  s: 1 | -1;
}
export interface StepMol { atoms: string[]; ends: End[]; x0: number; x1: number }

const add = (sc: Scene, ctx: Ctx, id: string, el: string, x: number, y: number, extra: object = {}) => {
  sc.add({ id: ctx.pre + id, el, x, y, ...(ctx.unit !== undefined ? { unit: ctx.unit } : {}), ...(ctx.hue ? { hue: ctx.hue } : {}), ...extra });
  return ctx.pre + id;
};

/** reaktive Gruppe am Gerüstatom k; erstes Atom bei (x, y), Richtung s */
function grp(sc: Scene, ctx: Ctx, k: string, fg: FG, x: number, y: number, s: 1 | -1, tag: string, out: string[]): End {
  const A = (id: string, el: string, ax: number, ay: number, e: object = {}) => { const r = add(sc, ctx, tag + id, el, ax, ay, e); out.push(r); return r; };
  switch (fg) {
    case "COOH": case "COCl": {
      const c = A("c", "C", x, y), od = A("od", "O", x, y - 1);
      sc.bond(k, c); sc.bond(c, od, 2); sc.autoLp(od, 2, -90);
      if (fg === "COOH") {
        const o = A("o", "O", x, y + 1), h = A("h", "H", x + 0.8 * s, y + 1);
        sc.bond(c, o); sc.bond(o, h); sc.autoLp(o, 2, 90);
        return { fg, anchor: c, leave: [o, h], extra: { od }, s };
      }
      const cl = A("cl", "Cl", x, y + 1);
      sc.bond(c, cl); sc.autoLp(cl, 3, 90);
      return { fg, anchor: c, leave: [cl], extra: { od }, s };
    }
    case "OH": {
      const o = A("o", "O", x, y), h = A("h", "H", x, y + 0.8);
      sc.bond(k, o); sc.bond(o, h); sc.autoLp(o, 2, -90);
      return { fg, anchor: o, leave: [h], extra: {}, s };
    }
    case "NH2": {
      const n = A("n", "N", x, y), hu = A("hu", "H", x, y - 0.8), hd = A("hd", "H", x, y + 0.8);
      sc.bond(k, n); sc.bond(n, hu); sc.bond(n, hd); sc.autoLp(n, 1, 0);
      return { fg, anchor: n, leave: [hd], extra: { hu }, s };
    }
    case "NCO": {
      const n = A("n", "N", x, y), c = A("c", "C", x + s, y), o = A("o", "O", x + 2 * s, y);
      sc.bond(k, n); sc.bond(n, c, 2); sc.bond(c, o, 2);
      sc.autoLp(n, 1, 90); sc.at(o).lp = [s > 0 ? -60 : -120, s > 0 ? 60 : 120];
      return { fg, anchor: c, leave: [], extra: { n, o }, s };
    }
    case "EPOX": {
      const ch = A("ch", "C", x, y), c2 = A("c2", "C", x + s, y), o = A("o", "O", x + 0.5 * s, y + 0.87);
      const h1 = A("h1", "H", x, y - 0.8), h2 = A("h2", "H", x + s, y - 0.8), h3 = A("h3", "H", x + 1.8 * s, y);
      sc.bond(k, ch); sc.bond(ch, c2); sc.bond(ch, o); sc.bond(c2, o); sc.bond(ch, h1); sc.bond(c2, h2); sc.bond(c2, h3);
      sc.at(o).lp = [60, 120];
      return { fg, anchor: c2, leave: [], extra: { ch, o }, s };
    }
    default:
      return { fg, anchor: k, leave: [], extra: {}, s };
  }
}

/** Breite einer Gruppe nach außen (für die Lage des nächsten Moleküls) */
export const groupReach = (fg: FG) => (fg === "NCO" ? 3 : fg === "EPOX" ? 2 : 1);

/**
 * Molekül des Stufenwachstums ab x (linke Gruppe beginnt bei x), Mittellinie y. Ends: links (s = −1), rechts (s = +1), ggf. dritte Gruppe (unten).
 */
export function stepMolecule(sc: Scene, id: StepId, x: number, y: number, ctx: Ctx): StepMol {
  const m = stepMono(id), out: string[] = [], ends: End[] = [];
  const A = (aid: string, el: string, ax: number, ay: number, e: object = {}) => { const r = add(sc, ctx, aid, el, ax, ay, e); out.push(r); return r; };
  const H = (c: string, ang: number, tag: string) => { const C = sc.at(c), r = (ang * Math.PI) / 180; const h = A(tag, "H", C.x + Math.cos(r) * 0.8, C.y + Math.sin(r) * 0.8); sc.bond(c, h); return h; };
  const [gl, gr] = m.groups;
  // linke Gruppe liegt links vom Gerüst: ihr erstes Atom bei xl, das Gerüst beginnt bei xl + Abstand
  const lw = gl ? groupReach(gl) : 0;
  let xc = x + lw;
  let left = "", right = "";
  const core = m.core;
  if (core.k === "ring") {
    const r = benzene(sc, xc, y, 0, ctx, "r");
    out.push(...r); left = r[0]; right = r[3];
    xc += 1.44;
  } else if (core.k === "chain") {
    if (id === "essigsaeure") { left = right = A("me", "C", xc, y, { text: "H₃C" }); }
    else if (id === "ethanol") {
      const me = A("me", "C", xc, y, { text: "H₃C" }), c = A("c1", "C", xc + 1, y);
      sc.bond(me, c); H(c, -90, "h1"); H(c, 90, "h2");
      left = me; right = c; xc += 1;
    } else if (core.n <= 2) {
      const cs = Array.from({ length: core.n }, (_, i) => A(`c${i}`, "C", xc + i, y));
      cs.forEach((c, i) => { if (i) sc.bond(cs[i - 1], c); H(c, -90, `hu${i}`); H(c, 90, `hd${i}`); });
      left = cs[0]; right = cs[cs.length - 1]; xc += core.n - 1;
    } else {
      // längere CH₂-Ketten als Kurzformel (CH₂)ₙ
      const sub = String(core.n).replace(/\d/g, d => "₀₁₂₃₄₅₆₇₈₉"[+d]);
      const k = A("k", "C", xc + 0.85, y, { text: `(CH₂)${sub}` });
      left = right = k; xc += 1.7;
    }
  } else if (core.k === "chiral") {
    const c = A("c", "C", xc, y);
    H(c, -90, "h");
    const me = A("me", "C", xc, y + 1, { text: "CH₃" }); sc.bond(c, me);
    left = right = c;
  } else if (core.k === "glycerin") {
    const cs = [0, 1, 2].map(i => A(`c${i}`, "C", xc + i, y));
    sc.bond(cs[0], cs[1]); sc.bond(cs[1], cs[2]);
    H(cs[0], -90, "h0u"); H(cs[0], 90, "h0d"); H(cs[1], -90, "h1u"); H(cs[2], -90, "h2u"); H(cs[2], 90, "h2d");
    left = cs[0]; right = cs[2]; xc += 2;
    // dritte OH-Gruppe unten am mittleren C
    const o = A("o3", "O", xc - 1, y + 1), h = A("h3", "H", xc - 0.2, y + 1);
    sc.bond(cs[1], o); sc.bond(o, h); sc.autoLp(o, 2, 90);
    ends.push({ fg: "OH", anchor: o, leave: [h], extra: {}, s: 1 });
  } else if (core.k === "mdi") {
    const r1 = benzene(sc, xc, y, 0, ctx, "ra");
    const ch2 = A("ch2", "C", xc + 2.44, y);
    const r2 = benzene(sc, xc + 3.44, y, 0, ctx, "rb");
    out.push(...r1, ...r2);
    sc.bond(r1[3], ch2); sc.bond(ch2, r2[0]); H(ch2, -90, "hu"); H(ch2, 90, "hd");
    left = r1[0]; right = r2[3]; xc += 4.88;
  } else if (core.k === "badge") {
    // Bisphenol-A-Gerüst als Rest R (Kurzform), daneben –O–CH₂–
    const o1 = A("o1", "O", xc, y), c1 = A("c1", "C", xc - 1, y);
    const r = A("r", "C", xc + 1.2, y, { text: "R" });
    const o2 = A("o2", "O", xc + 2.4, y), c2 = A("c2", "C", xc + 3.4, y);
    sc.bond(c1, o1); sc.bond(o1, r); sc.bond(r, o2); sc.bond(o2, c2);
    for (const [c, t] of [[c1, "a"], [c2, "b"]] as const) { H(c, -90, `h${t}u`); H(c, 90, `h${t}d`); }
    sc.autoLp(o1, 2, -90); sc.autoLp(o2, 2, -90);
    left = c1; right = c2; xc += 3.4;
  } else if (core.k === "phenol") {
    const r = benzene(sc, xc, y, 0, ctx, "r");
    out.push(...r);
    // OH oben am Ring (Ecke 2 zeigt nach oben-rechts → Ecke oben: Mittelpunkt − 0,72 nach oben)
    const top = r[2];
    const o = A("o", "O", sc.at(top).x, sc.at(top).y - 1), h = A("ho", "H", sc.at(top).x + 0.8, sc.at(top).y - 1);
    sc.bond(top, o); sc.bond(o, h); sc.autoLp(o, 2, -90);
    left = r[0]; right = r[3];
    // reaktive H‑Atome an beiden Seiten (Stellungen neben der OH-Gruppe sind gezeichnet als links/rechts)
    const hl = A("hl", "H", sc.at(left).x - 0.8, y), hr = A("hr", "H", sc.at(right).x + 0.8, y);
    sc.bond(left, hl); sc.bond(right, hr);
    ends.push({ fg: "ArH", anchor: left, leave: [hl], extra: {}, s: -1 }, { fg: "ArH", anchor: right, leave: [hr], extra: {}, s: 1 });
    return { atoms: out, ends, x0: x, x1: xc + 1.44 + 0.8 };
  } else if (core.k === "methanal") {
    const c = A("c", "C", xc, y), o = A("o", "O", xc, y - 1);
    sc.bond(c, o, 2); sc.autoLp(o, 2, -90);
    const h1 = A("h1", "H", xc - 0.8, y), h2 = A("h2", "H", xc + 0.8, y);
    sc.bond(c, h1); sc.bond(c, h2);
    ends.push({ fg: "CHO", anchor: c, leave: [o], extra: { h1, h2 }, s: 1 });
    return { atoms: out, ends, x0: xc - 0.8, x1: xc + 0.8 };
  }
  // Gruppen links und rechts (Kurzformel (CH₂)ₙ ist breit: Gruppe weiter weg)
  const gap = (k: string) => (sc.at(k).text?.startsWith("(") ? 1.6 : 1);
  const third = ends.splice(0);
  if (m.groups.length >= 2 && gl) ends.push(grp(sc, ctx, left, gl, sc.at(left).x - gap(left), y, -1, "L", out));
  const rightFg = m.groups.length === 1 ? gl : gr;
  if (rightFg) ends.push(grp(sc, ctx, right, rightFg, sc.at(right).x + gap(right), y, 1, "R", out));
  ends.push(...third);
  const xs = out.map(i => sc.at(i).x);
  return { atoms: out, ends, x0: Math.min(...xs), x1: Math.max(...xs) };
}
