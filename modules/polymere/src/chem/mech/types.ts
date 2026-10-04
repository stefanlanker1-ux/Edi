// Gemeinsame Typen der Mechanismen (Atom-Ansicht): Rezept, Aktionen, Zustand, Kügelchen-Leiste.

import type { Art, Hue, MethodId } from "../data.ts";
import type { Clip, Snap } from "../scene.ts";

/** Ansatz: Art, Monomer(e) und – bei der Polymerisation – Starter bzw. Katalysator */
export interface Recipe {
  art: Art;
  a: string;
  b?: string;
  method?: MethodId;
  /** zwei Monomere nacheinander zugeben (Blöcke) statt gleichzeitig */
  seq?: boolean;
}

export type ActionKind = "start" | "add" | "stop" | "other";
export interface Action {
  id: string;
  kind: ActionKind;
  label: string;
  /** Monomer, das angelagert wird (Knopf zeigt sein Kügelchen) */
  mono?: string;
  /** zwei Monomere auf einmal (Zweierkette, Methanal + Phenol) */
  pair?: [string, string];
}

/** Abschnitt des Ablaufs */
export type Phase = "init" | "bereit" | "wachsend" | "ende" | "aus";

/** Kügelchen der Leiste: Starter-Rest, Baustein (Monomer) oder aktives Ende */
export interface Bead { kind: "init" | "unit" | "cat"; mono?: string; hue: Hue | "init"; letter: string; title: string; unit?: number }

export interface Status {
  phase: Phase;
  /** Zahl der eingebauten Bausteine */
  n: number;
  /** kurzer Name des letzten Schritts (Kettenstart, Kettenwachstum …) */
  step: string;
  /** aktives Kettenende: Radikal, Anion, Kation, am Titan, keins */
  active: "rad" | "an" | "kat" | "ti" | null;
  /** Misserfolg: Begründung */
  fail?: string;
  /** Kügelchen der Kette (vom Anfang zum Ende) */
  beads: Bead[];
  /** lebende Kette (anionisch) */
  living?: boolean;
  /** abgespaltenes Nebenprodukt bisher („2 H₂O“) */
  byp?: string;
  /** Abbruchart bzw. Besonderheit */
  note?: string;
  /** Bedingung (Temperatur, Druck) */
  cond?: string;
  /** Stufenwachstum: reaktive Gruppe am rechten Kettenende und ihr Atom (zum Markieren) */
  end?: string;
  endAtom?: string;
}

export interface Mech {
  actions(): Action[];
  /** Aktion ausführen: liefert den Ablauf vom jetzigen zum neuen Zustand */
  run(id: string): Clip;
  /** jetziger Zustand (Standbild) */
  snap(): Snap;
  status(): Status;
}
