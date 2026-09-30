// Bild auf der Kachel der Übersicht (wird sofort geladen – klein halten, keine Stile aus app.css).

export function Card() {
  return (
    <div aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "repeat(2, min(36cqw, 72px))", gap: 4 }}>
      <Tile ion="Ca" charge="2+" color="var(--hue-yellow)" wide />
      <Tile ion="Cl" charge="−" color="var(--hue-green)" />
      <Tile ion="Cl" charge="−" color="var(--hue-green)" />
    </div>
  );
}

function Tile({ ion, charge, color, wide }: { ion: string; charge: string; color: string; wide?: boolean }) {
  return (
    <span style={{ gridColumn: wide ? "span 2" : undefined, display: "grid", placeItems: "center", height: "min(28cqh, 46px)", borderRadius: 2,
      border: "1.5px solid #111", background: color, color: "#111", fontWeight: 800, fontSize: "min(1rem, 14cqh)" }}>
      <span>{ion}<sup style={{ fontSize: ".62em" }}>{charge}</sup></span>
    </span>
  );
}
