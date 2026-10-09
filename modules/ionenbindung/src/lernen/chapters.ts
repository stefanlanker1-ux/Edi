// Kapitel des Bereichs „Lernen“ je Stufe: Level I = Kapitel 1–3, Level II = Kapitel 4–5 (bauen auf Level I auf).

import type { Stufe } from "../store.ts";
import type { Kapitel } from "./types.ts";
import { kapitel1 } from "./k1.tsx";
import { kapitel2 } from "./k2.tsx";
import { kapitel3 } from "./k3.tsx";
import { kapitel4 } from "./k4.tsx";
import { kapitel5 } from "./k5.tsx";

export const allKapitel = (): Kapitel[] => [kapitel1(), kapitel2(), kapitel3(), kapitel4(), kapitel5()];
export const kapitelFor = (stufe: Stufe): Kapitel[] => allKapitel().filter(k => k.stufe === stufe);
