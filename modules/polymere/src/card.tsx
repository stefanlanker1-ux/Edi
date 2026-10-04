// Bild auf der Kachel der Übersicht (wird sofort geladen – klein halten, keine Stile aus app.css).

/** Kette aus Kügelchen: ein Block aus zwei Sorten (Blockcopolymer), daneben ein Monomer mit Zweifachbindung */
export function Card() {
  const v = "var(--hue-violet)", o = "var(--hue-orange)";
  const pts = [[14, 70], [27, 60], [40, 66], [53, 56], [66, 62], [79, 52], [92, 58], [105, 48]];
  return (
    <svg viewBox="0 0 120 100" aria-hidden="true" style={{ width: "min(100cqw, 130cqh, 170px)", overflow: "visible" }}>
      <polyline points={pts.map(p => p.join(",")).join(" ")} fill="none" stroke="#111" strokeWidth="2.2" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6.5" fill={i < 4 ? v : o} stroke="#111" strokeWidth="1.2" />)}
      <circle cx="30" cy="22" r="6.5" fill={v} stroke="#111" strokeWidth="1.2" />
      <path d="M26 33h8M26 36.5h8" stroke="#111" strokeWidth="1.8" />
      <path d="M44 26h14M54 21l5 5-5 5" fill="none" stroke="#111" strokeWidth="2" />
    </svg>
  );
}
