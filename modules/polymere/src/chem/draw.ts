// Zeichenvorlagen der Atom-Ansicht: Gruppen, Monomere, Kettenbausteine, Starter und Katalysator.
// Lage in Bindungslängen (C–C = 1, C–H = 0,8); die Kette liegt waagrecht, Gruppen stehen senkrecht darüber bzw. darunter
// (übliche Valenzstrichformel). Taktizität: Gruppe oben oder unten (wie in einer Fischer-Projektion der Kette).

import type { Grp, Hue, Vinyl } from "./data.ts";
import { dirOf, type Scene } from "./scene.ts";

export interface Ctx { pre: string; unit?: number; hue?: Hue }

const sub = (ctx: Ctx, id: string, el: string, x: number, y: number, extra: object = {}) =>
  ({ id: ctx.pre + id, el, x, y, ...(ctx.unit !== undefined ? { unit: ctx.unit } : {}), ...(ctx.hue ? { hue: ctx.hue } : {}), ...extra });

/** Gruppe an Atom c in Richtung ang (Grad); Rückgabe: Kennungen wichtiger Atome (erstes Atom, Heteroatom) */
export function group(sc: Scene, g: Grp, c: string, ang: number, ctx: Ctx, tag: string): { first: string; hetero?: string; atoms: string[] } {
  const C = sc.at(c), d = dirOf(ang), at = (r: number, a = ang) => { const e = dirOf(a); return { x: C.x + e.x * r, y: C.y + e.y * r }; };
  const left = d.x < -0.5;
  const P = (s: string) => `${tag}${s}`;
  switch (g) {
    case "H": {
      const p = at(0.8);
      sc.add(sub(ctx, P("h"), "H", p.x, p.y));
      sc.bond(c, ctx.pre + P("h"));
      return { first: ctx.pre + P("h"), atoms: [ctx.pre + P("h")] };
    }
    case "CH3": {
      const p = at(1);
      sc.add(sub(ctx, P("me"), "C", p.x, p.y, { text: left ? "H₃C" : "CH₃" }));
      sc.bond(c, ctx.pre + P("me"));
      return { first: ctx.pre + P("me"), atoms: [ctx.pre + P("me")] };
    }
    case "Cl": case "F": {
      const p = at(1), id = ctx.pre + P("x");
      sc.add(sub(ctx, P("x"), g, p.x, p.y));
      sc.bond(c, id);
      sc.autoLp(id, 3, ang);
      return { first: id, hetero: id, atoms: [id] };
    }
    case "CN": {
      const p = at(1), q = at(2), cc = ctx.pre + P("c"), n = ctx.pre + P("n");
      sc.add(sub(ctx, P("c"), "C", p.x, p.y));
      sc.add(sub(ctx, P("n"), "N", q.x, q.y, { lp: [ang] }));
      sc.bond(c, cc); sc.bond(cc, n, 3);
      return { first: cc, hetero: n, atoms: [cc, n] };
    }
    case "Ph": {
      const v = at(1), r = 0.72, cx = v.x + d.x * r, cy = v.y + d.y * r, ids: string[] = [];
      for (let k = 0; k < 6; k++) {
        const e = dirOf(ang + 180 + 60 * k);
        const id = ctx.pre + P(`r${k}`);
        sc.add(sub(ctx, P(`r${k}`), "C", cx + e.x * r, cy + e.y * r, { text: "" }));
        ids.push(id);
      }
      const ring = ctx.pre + P("ring");
      for (let k = 0; k < 6; k++) sc.bond(ids[k], ids[(k + 1) % 6], k % 2 === 1 ? 2 : 1, undefined, ring);
      sc.ring(ring, ids);
      sc.bond(c, ids[0]);
      return { first: ids[0], atoms: ids };
    }
    case "COOMe": {
      // Estergruppe schmal (Nachbarn in der Kette stehen nur zwei Bindungslängen entfernt): =O schräg zur einen Seite,
      // O–CH₃ gerade weiter, CH₃ schräg zur anderen Seite
      const p = at(1), cc = ctx.pre + P("c"), od = ctx.pre + P("od"), oe = ctx.pre + P("oe"), me = ctx.pre + P("me");
      sc.add(sub(ctx, P("c"), "C", p.x, p.y));
      const e1 = dirOf(ang - 60), e2 = dirOf(ang + 60);
      sc.add(sub(ctx, P("od"), "O", p.x + e1.x, p.y + e1.y));
      sc.add(sub(ctx, P("oe"), "O", p.x + d.x, p.y + d.y));
      const m = { x: p.x + d.x + e2.x, y: p.y + d.y + e2.y };
      sc.add(sub(ctx, P("me"), "C", m.x, m.y, { text: m.x < p.x - 0.3 ? "H₃C" : "CH₃" }));
      sc.bond(c, cc); sc.bond(cc, od, 2); sc.bond(cc, oe); sc.bond(oe, me);
      sc.autoLp(od, 2, ang); sc.autoLp(oe, 2, ang);
      return { first: cc, hetero: od, atoms: [cc, od, oe, me] };
    }
    case "OAc": {
      // Acetatgruppe: O, C, darüber CH₃ gerade weiter, =O quer zur Seite
      const p = at(1), q = at(2), o = ctx.pre + P("o"), cc = ctx.pre + P("c"), od = ctx.pre + P("od"), me = ctx.pre + P("me");
      sc.add(sub(ctx, P("o"), "O", p.x, p.y));
      sc.add(sub(ctx, P("c"), "C", q.x, q.y));
      const e1 = dirOf(ang - 90);
      sc.add(sub(ctx, P("od"), "O", q.x + e1.x, q.y + e1.y));
      sc.add(sub(ctx, P("me"), "C", q.x + d.x, q.y + d.y, { text: d.x < -0.5 ? "H₃C" : "CH₃" }));
      sc.bond(c, o); sc.bond(o, cc); sc.bond(cc, od, 2); sc.bond(cc, me);
      sc.autoLp(o, 2, ang); sc.autoLp(od, 2, ang);
      return { first: o, hetero: od, atoms: [o, cc, od, me] };
    }
  }
}

export interface UnitIds {
  /** CH₂-Ende (bindet an die Kette bzw. ans Metall) */
  ca: string;
  /** anderes Ende (trägt das Radikal, die Ladung bzw. bindet an die alte Kette) */
  cb: string;
  /** alle Atome des Bausteins */
  atoms: string[];
  /** Heteroatom mit freiem Elektronenpaar (vergiftet Ziegler-Natta) */
  hetero?: string;
  /** Atome der Hauptgruppe (oben bzw. unten) */
  r?: string[];
  /** Butadien: mittlere C‑Atome */
  mid?: [string, string];
}

/**
 * Monomer (dbl: mit Zweifachbindung) oder Baustein in der Kette an Position (x, y), Richtung s = +1 (nach rechts) bzw. −1.
 * flip: Hauptgruppe nach unten statt nach oben. Die Gruppen stehen senkrecht (wie in der Kette), damit beim Einbau nur verschoben wird.
 */
export function vinylUnit(sc: Scene, m: Vinyl, x: number, y: number, ctx: Ctx, o: { dbl: boolean; flip?: boolean; s?: 1 | -1; vertical?: boolean }): UnitIds {
  const s = o.s ?? 1, along = o.vertical ? 90 * s : s > 0 ? 0 : 180;
  const step = dirOf(along);
  // senkrecht zur Kette: waagrechte Kette – Hauptgruppe oben; senkrechte Kette – Hauptgruppe rechts
  const up = o.vertical ? 0 : -90, down = o.vertical ? 180 : 90;
  const pos = (k: number) => ({ x: x + step.x * k, y: y + step.y * k });
  if (m.diene) {
    const ids = [0, 1, 2, 3].map(k => ctx.pre + `c${k}`);
    ids.forEach((_, k) => { const p = pos(k); sc.add(sub(ctx, `c${k}`, "C", p.x, p.y)); });
    sc.bond(ids[0], ids[1], o.dbl ? 2 : 1); sc.bond(ids[1], ids[2], o.dbl ? 1 : 2); sc.bond(ids[2], ids[3], o.dbl ? 2 : 1);
    const atoms = [...ids];
    const hs = (c: number, angs: number[]) => angs.forEach((a, j) => atoms.push(...group(sc, "H", ids[c], a, ctx, `h${c}${j}`).atoms));
    hs(0, [up, down]); hs(1, [up]); hs(2, [up]); hs(3, [up, down]);
    return { ca: ids[0], cb: ids[3], atoms, mid: [ids[1], ids[2]] };
  }
  const ca = ctx.pre + "ca", cb = ctx.pre + "cb";
  const p0 = pos(0), p1 = pos(1);
  sc.add(sub(ctx, "ca", "C", p0.x, p0.y));
  sc.add(sub(ctx, "cb", "C", p1.x, p1.y));
  sc.bond(ca, cb, o.dbl ? 2 : 1);
  const atoms = [ca, cb];
  let hetero: string | undefined, r: string[] | undefined;
  const ga = group(sc, m.a[0], ca, up, ctx, "a0"), gb = group(sc, m.a[1], ca, down, ctx, "a1");
  atoms.push(...ga.atoms, ...gb.atoms);
  hetero = ga.hetero ?? gb.hetero;
  const [b0, b1] = o.flip ? [m.b[1], m.b[0]] : m.b;
  const g0 = group(sc, b0, cb, up, ctx, "b0"), g1 = group(sc, b1, cb, down, ctx, "b1");
  atoms.push(...g0.atoms, ...g1.atoms);
  hetero = hetero ?? g0.hetero ?? g1.hetero;
  r = o.flip ? g1.atoms : g0.atoms;
  return { ca, cb, atoms, hetero, r };
}

// ── Starter und Katalysator ───────────────────────────────────────────────────

/** Benzolring (Ecken ohne Beschriftung), Ecke 0 bei (x, y), Ring in Richtung ang */
export function benzene(sc: Scene, x: number, y: number, ang: number, ctx: Ctx, tag: string, r = 0.72): string[] {
  const d = dirOf(ang), cx = x + d.x * r, cy = y + d.y * r, ids: string[] = [];
  for (let k = 0; k < 6; k++) {
    const e = dirOf(ang + 180 + 60 * k), id = ctx.pre + `${tag}${k}`;
    sc.add(sub(ctx, `${tag}${k}`, "C", cx + e.x * r, cy + e.y * r, { text: "" }));
    ids.push(id);
  }
  const ring = ctx.pre + tag;
  for (let k = 0; k < 6; k++) sc.bond(ids[k], ids[(k + 1) % 6], k % 2 === 1 ? 2 : 1, undefined, ring);
  sc.ring(ring, ids);
  return ids;
}

/** Dibenzoylperoxid: Ph–C(=O)–O–O–C(=O)–Ph, Mitte der O–O-Bindung bei (x, y) */
export function dbpo(sc: Scene, x: number, y: number, pre = "i") {
  const ctx: Ctx = { pre };
  const ids = { o1: pre + "o1", o2: pre + "o2", c1: pre + "c1", c2: pre + "c2", od1: pre + "od1", od2: pre + "od2" };
  sc.add(sub(ctx, "o1", "O", x - 0.5, y)); sc.add(sub(ctx, "o2", "O", x + 0.5, y));
  sc.add(sub(ctx, "c1", "C", x - 1.5, y)); sc.add(sub(ctx, "c2", "C", x + 1.5, y));
  sc.add(sub(ctx, "od1", "O", x - 1.5, y - 1)); sc.add(sub(ctx, "od2", "O", x + 1.5, y - 1));
  sc.bond(ids.o1, ids.o2); sc.bond(ids.c1, ids.o1); sc.bond(ids.c2, ids.o2); sc.bond(ids.c1, ids.od1, 2); sc.bond(ids.c2, ids.od2, 2);
  const r1 = benzene(sc, x - 2.5, y, 180, ctx, "pa"), r2 = benzene(sc, x + 2.5, y, 0, ctx, "pb");
  sc.bond(ids.c1, r1[0]); sc.bond(ids.c2, r2[0]);
  sc.at(ids.o1).lp = [-90, 90]; sc.at(ids.o2).lp = [-90, 90];
  sc.autoLp(ids.od1, 2, -90); sc.autoLp(ids.od2, 2, -90);
  return { ...ids, ring1: r1, ring2: r2 };
}

/** AIBN: (CH₃)₂C(CN)–N=N–C(CN)(CH₃)₂, Mitte der N=N-Bindung bei (x, y) */
export function aibn(sc: Scene, x: number, y: number, pre = "i") {
  const ctx: Ctx = { pre };
  const n1 = pre + "n1", n2 = pre + "n2", c1 = pre + "c1", c2 = pre + "c2";
  sc.add(sub(ctx, "n1", "N", x - 0.5, y, { lp: [-90] })); sc.add(sub(ctx, "n2", "N", x + 0.5, y, { lp: [90] }));
  sc.add(sub(ctx, "c1", "C", x - 1.5, y)); sc.add(sub(ctx, "c2", "C", x + 1.5, y));
  sc.bond(n1, n2, 2); sc.bond(c1, n1); sc.bond(c2, n2);
  const g = [
    group(sc, "CH3", c1, -90, ctx, "m1"), group(sc, "CH3", c1, 90, ctx, "m2"), group(sc, "CN", c1, 180, ctx, "cn1"),
    group(sc, "CH3", c2, -90, ctx, "m3"), group(sc, "CH3", c2, 90, ctx, "m4"), group(sc, "CN", c2, 0, ctx, "cn2"),
  ];
  return { n1, n2, c1, c2, left: [c1, ...g[0].atoms, ...g[1].atoms, ...g[2].atoms], right: [c2, ...g[3].atoms, ...g[4].atoms, ...g[5].atoms] };
}

/** Butyllithium: C₄H₉–Li */
export function buli(sc: Scene, x: number, y: number, pre = "i") {
  const bu = pre + "bu", li = pre + "li";
  sc.add({ id: bu, el: "C", x, y, text: "C₄H₉" });
  sc.add({ id: li, el: "Li", x: x + 1.5, y });
  sc.bond(bu, li);
  return { bu, li };
}

/** Bortrifluorid (eben, offene Seite rechts) */
export function bf3(sc: Scene, x: number, y: number, pre = "b") {
  const b = pre + "b", fs = [0, 1, 2].map(k => pre + `f${k}`);
  sc.add({ id: b, el: "B", x, y });
  [180, 60, -60].forEach((a, k) => { const d = dirOf(a); sc.add({ id: fs[k], el: "F", x: x + d.x, y: y + d.y }); sc.bond(b, fs[k]); });
  fs.forEach(f => sc.autoLp(f, 3));
  return { b, fs };
}

/** Wasser, O bei (x, y), H nach rechts geneigt (freie Paare links) */
export function water(sc: Scene, x: number, y: number, pre = "w", ang = 0) {
  const o = pre + "o", h1 = pre + "h1", h2 = pre + "h2";
  const d1 = dirOf(ang - 52), d2 = dirOf(ang + 52);
  sc.add({ id: o, el: "O", x, y });
  sc.add({ id: h1, el: "H", x: x + d1.x * 0.8, y: y + d1.y * 0.8 });
  sc.add({ id: h2, el: "H", x: x + d2.x * 0.8, y: y + d2.y * 0.8 });
  sc.bond(o, h1); sc.bond(o, h2);
  sc.autoLp(o, 2, ang + 180);
  return { o, h1, h2 };
}

/** Methanol CH₃–O–H, O bei (x, y), H zeigt nach links (zum Kettenende) */
export function methanol(sc: Scene, x: number, y: number, pre = "m") {
  const me = pre + "me", o = pre + "o", h = pre + "h";
  sc.add({ id: o, el: "O", x, y });
  sc.add({ id: me, el: "C", x: x + 1, y, text: "CH₃" });
  sc.add({ id: h, el: "H", x: x - 0.8, y });
  sc.bond(o, me); sc.bond(o, h);
  sc.at(o).lp = [-90, 90];
  return { me, o, h };
}

/** Wasserstoff H–H (senkrecht) */
export function hydrogen(sc: Scene, x: number, y: number, pre = "hh") {
  const h1 = pre + "1", h2 = pre + "2";
  sc.add({ id: h1, el: "H", x, y }); sc.add({ id: h2, el: "H", x, y: y - 0.8 });
  sc.bond(h1, h2);
  return { h1, h2 };
}

/**
 * Titan-Zentrum an der Oberfläche eines TiCl₃-Kristalls: vier Cl (links, unten, schräg vorn/hinten), rechts die Kette,
 * oben die freie Koordinationsstelle (gestrichelter Kreis). Ti bei (x, y).
 */
export function titanium(sc: Scene, x: number, y: number, pre = "t") {
  const ti = pre + "ti", vac = pre + "vac";
  sc.add({ id: ti, el: "Ti", x, y });
  const cls = [[180, 1.15, undefined], [90, 1.15, undefined], [140, 0.95, "wedge"], [-140, 0.95, "hash"]] as const;
  const ids = cls.map(([a, r, k], i) => {
    const d = dirOf(a), id = pre + `cl${i}`;
    sc.add({ id, el: "Cl", x: x + d.x * r, y: y + d.y * r });
    sc.bond(ti, id, 1, k);
    return id;
  });
  sc.add({ id: vac, el: "", x, y: y - 1.15, vac: true, text: "" });
  return { ti, vac, cls: ids };
}

/** Triethylaluminium Al(C₂H₅)₃ (Ethylgruppen als Kurzformel), Al bei (x, y) */
export function triethylAl(sc: Scene, x: number, y: number, pre = "al") {
  const al = pre, e = [0, 1, 2].map(k => pre + `e${k}`);
  sc.add({ id: al, el: "Al", x, y });
  [[180, 1.2], [-60, 1.15], [60, 1.15]].forEach(([a, r], k) => {
    const d = dirOf(a);
    sc.add({ id: e[k], el: "C", x: x + d.x * r, y: y + d.y * r, text: a === 180 ? "H₅C₂" : "C₂H₅" });
    sc.bond(al, e[k]);
  });
  return { al, e };
}
