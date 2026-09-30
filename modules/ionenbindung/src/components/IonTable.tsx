// Ionentabelle als Hilfsmittel im Quiz (Oberstufe): Nebengruppen- und mehratomige Ionen, Ionen aus der Aufgabe markiert.

import { CATIONS, ANIONS, ionsFor, ionText, type Ion } from "@lern/chem";
import { IonLabel } from "./IonTile.tsx";

export function IonTable({ text, os }: { text: string; os: boolean }) {
  const hit = (ion: Ion) => text.includes(ion.name.replace(/-Ion$/, "")) || text.includes(ionText(ion));
  const group = (title: string, list: Ion[]) => (
    <section className="it-group">
      <h3>{title}</h3>
      <ul className="it-list">
        {list.map(ion => (
          <li key={ion.id} className={`it-item ${ion.charge > 0 ? "cation" : "anion"}${hit(ion) ? " hit" : ""}`}>
            <b><IonLabel ion={ion} /></b><span>{ion.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
  const cats = ionsFor(CATIONS, os), ans = ionsFor(ANIONS, os);
  return (
    <div className="ion-table">
      {group("Kationen", cats)}
      {group("Anionen", ans)}
    </div>
  );
}
