// Kurze Erklärkarten je Level (≤ 5 Zeilen) mit einem Beispiel: Becher + Teilchenbild bzw. die Einteilung.

import { useId } from "react";
import { RichText } from "@lern/ui";
import type { Item } from "@lern/chem";
import type { LevelKey } from "@lern/quiz";
import { BeakerPair } from "../components/Beaker.tsx";
import { ConceptMap } from "../components/ConceptMap.tsx";
import { LEVELS, type Task } from "./tasks.ts";

interface Ex { points: string[]; items?: Item[]; shaken?: boolean; map?: "top" | "gemische" }

const TEXT: Record<string, Ex> = {
  "rg-1": { map: "top", points: [
    "**Reinstoff:** nur eine Sorte Teilchen. **Element:** eine Atomsorte (Fe, O₂, He). **Verbindung:** mehrere Atomsorten fest verbunden (H₂O, NaCl).",
    "**Gemisch:** mehrere Reinstoffe, nur vermischt – auch wenn es klar aussieht (Leitungswasser, Luft).",
  ] },
  "rg-2": { map: "gemische", points: [
    "**Homogen:** überall gleich, auch unter dem Mikroskop. **Heterogen:** Tröpfchen, Körner, Bläschen oder Schichten.",
    "Gemischtyp nach Aggregatzuständen (s fest, l flüssig, g gasförmig): zuerst der verteilte Stoff, dann der Stoff rundherum.",
  ] },
  "rg-3": { items: ["h2o", "nacl", "sand"], points: [
    "**Phasen:** einheitliche Bereiche (Schicht, Bodensatz, Gasraum). Gelöstes bildet keine eigene Phase.",
    "**Elemente / Verbindungen:** Teilchensorten zählen – nicht Atome. O₂ ist ein Element, H₂O eine Verbindung.",
    "Beispiel: Wasser, Salz (gelöst), Sand → 2 Phasen, 0 Elemente, 3 Verbindungen.",
  ] },
  "rg-4": { items: ["fe", "s"], points: [
    "Trennen nutzt Unterschiede: **Magnet** (Eisen), **Filtrieren/Dekantieren** (ungelöste Feststoffe), **Scheidetrichter** (Schichten), **Eindampfen** (Gelöstes bleibt), **Destillieren** (Siedetemperatur).",
    "Erhitzen: Eisen + Schwefel **reagieren** zu Eisensulfid (Verbindung, nicht mehr trennbar); Metalle schmelzen zur **Legierung** (homogen).",
  ] },
};

export function explainFor(level: LevelKey, task?: Task) {
  const id = typeof level === "number" ? LEVELS[level].id : (LEVELS.find(l => task?.type && l.types.includes(task.type)) ?? LEVELS[0]).id;
  return <Card e={TEXT[id]} />;
}

function Card({ e }: { e: Ex }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="explain">
      <ul className="ex-points">{e.points.map((p, i) => <li key={i}><RichText text={p} /></li>)}</ul>
      {e.items && <div className="ex-beaker"><BeakerPair items={e.items} shaken={!!e.shaken} id={id} /></div>}
      {e.map && <div className="ex-map"><ConceptMap part={e.map} /></div>}
    </div>
  );
}
