// Bild auf der Kachel der Übersicht (wird sofort geladen – klein halten, keine Stile aus app.css).
import { Bohr } from "@lern/chem-ui";

export function Card() {
  return (
    <div style={{ width: "min(100cqw, 100cqh, 150px)", aspectRatio: "1" }}><Bohr Z={6} N={6} E={6} slots={2} labels={false} /></div>
  );
}
