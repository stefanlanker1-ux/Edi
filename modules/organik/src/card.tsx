// Bild auf der Kachel der Übersicht (wird sofort geladen – klein halten, keine Stile aus app.css): Zickzack-Kette mit OH.

export function Card() {
  const pts = [[14, 62], [38, 48], [62, 62], [86, 48]];
  return (
    <svg viewBox="0 0 120 100" aria-hidden="true" style={{ width: "min(100cqw, 130cqh, 170px)", overflow: "visible" }}>
      <polyline points={pts.map(p => p.join(",")).join(" ")} fill="none" stroke="#111" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <line x1="86" y1="48" x2="98" y2="33" stroke="#111" strokeWidth="3" strokeLinecap="round" />
      <text x="104" y="30" fontSize="17" fontWeight="800" fill="var(--hue-red-deep)" fontFamily="inherit">OH</text>
      {pts.map(([x, y], i) => <text key={i} x={x} y={y + (i % 2 ? -10 : 18)} fontSize="11" fontWeight="800" fill="#e30613" textAnchor="middle" fontFamily="inherit">{4 - i}</text>)}
    </svg>
  );
}
