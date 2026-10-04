// Strukturformeln als Standbild: Monomer (mit Zweifachbindung bzw. funktionellen Gruppen) und Baustein in der Kette
// (Wiederholungseinheit in eckigen Klammern mit n). Gleiche Zeichnung wie die Atom-Ansicht (MechSvg).

import { useMemo } from "react";
import { tr } from "@lern/i18n";
import { isVinyl, stepMono, vinyl, type StepId } from "../chem/data.ts";
import { vinylUnit } from "../chem/draw.ts";
import { stepMolecule } from "../chem/stepdraw.ts";
import { Scene, boxOf, fitBox, still, type Snap } from "../chem/scene.ts";
import { MechSvg } from "./MechSvg.tsx";

export function SnapSvg({ snap, label, aspect = 1.4, halos = false, minW = 3, minH = 2.2, className }: { snap: Snap; label: string; aspect?: number; halos?: boolean; minW?: number; minH?: number; className?: string }) {
  const b = boxOf(snap.atoms) ?? { x0: -1, y0: -1, x1: 1, y1: 1 };
  // aspect 0: Seitenverhältnis der Zeichnung selbst (füllt eine Antwortkarte, statt klein in der Mitte zu stehen)
  const natural = (b.x1 - b.x0 + 0.7) / (b.y1 - b.y0 + 0.7);
  const box = aspect > 0 ? fitBox(b, aspect, minW, minH, 0.35) : fitBox(b, natural, 0, 0, 0.35);
  return <MechSvg pose={still(snap)} box={box} label={label} halos={halos} lp className={className} />;
}

/** Monomer als Strukturformel */
export function monomerSnap(id: string): Snap {
  const sc = new Scene();
  if (isVinyl(id)) vinylUnit(sc, vinyl(id), 0, 0, { pre: "m" }, { dbl: true });
  else stepMolecule(sc, id as StepId, 0, 0, { pre: "m" });
  return sc.snap();
}

export function MonomerSvg({ id, aspect, className }: { id: string; aspect?: number; className?: string }) {
  const snap = useMemo(() => monomerSnap(id), [id]);
  const name = isVinyl(id) ? vinyl(id).name : stepMono(id).name;
  return <SnapSvg snap={snap} label={tr(`Strukturformel von ${name}`, `Structural formula of ${name}`)} aspect={aspect} className={className} />;
}

/** Baustein in der Kette (Polymerisation): ohne Zweifachbindung, Bindungen nach links und rechts, eckige Klammern und n */
export function unitSnap(id: string, flip = false, hue = true): Snap {
  const sc = new Scene();
  const v = vinyl(id);
  const u = vinylUnit(sc, v, 0, 0, { pre: "u", ...(hue ? { unit: 0, hue: v.hue } : {}) }, { dbl: false, flip });
  const L = sc.at(u.ca), R = sc.at(u.cb);
  // Bindungen zu den Nachbarn: Striche ins Leere (unsichtbare Endpunkte)
  sc.add({ id: "l", el: "", x: L.x - 0.85, y: 0, text: "" });
  sc.add({ id: "r", el: "", x: R.x + 0.85, y: 0, text: "" });
  sc.bond("l", u.ca); sc.bond(u.cb, "r");
  const ys = sc.snap().atoms.map(a => a.y);
  const top = Math.min(...ys), bot = Math.max(...ys);
  const h = bot - top + 0.9, mid = (top + bot) / 2;
  sc.note({ id: "bl", x: L.x - 0.5, y: mid, text: "[", bracket: h });
  sc.note({ id: "br", x: R.x + 0.5, y: mid, text: "]", bracket: h });
  sc.note({ id: "n", x: R.x + 0.82, y: mid + h / 2 - 0.15, text: "n" });
  return sc.snap();
}

export function UnitSvg({ id, flip, aspect, className }: { id: string; flip?: boolean; aspect?: number; className?: string }) {
  const snap = useMemo(() => unitSnap(id, flip), [id, flip]);
  return <SnapSvg snap={snap} label={tr(`Baustein von ${vinyl(id).polymer}`, `Repeat unit of ${vinyl(id).polymer.toLowerCase()}`)} aspect={aspect} halos className={`pm-unit${className ? " " + className : ""}`} />;
}
