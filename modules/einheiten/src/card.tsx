// Bild auf der Kachel der Übersicht (wird sofort geladen – klein halten, keine Stile aus app.css).

export function Card() {
  return (
    <svg style={{ width: "min(100cqw, 220cqh, 240px)" }} viewBox="0 0 300 130" aria-hidden="true">
      <rect x="20" y="10" width="260" height="34" rx="2" fill="#ffffff" stroke="#111111" strokeWidth="2" />
      <rect x="30" y="10" width="48" height="34" fill="rgba(227,6,19,.14)" />
      {Array.from({ length: 51 }, (_, i) => <line key={i} x1={30 + i * 4.8} x2={30 + i * 4.8} y1={10} y2={i % 10 === 0 ? 26 : i % 5 === 0 ? 21 : 16} stroke="#111111" strokeWidth={i % 10 === 0 ? 1.6 : 0.9} />)}
      {[0, 1, 2, 3, 4, 5].map(i => <text key={i} x={30 + i * 48} y={40} fontSize="10" textAnchor="middle" fill="#111111" fontWeight="700">{i}</text>)}
      <path d="M30 44 L30 74 M78 44 L270 74" stroke="#e30613" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
      <rect x="20" y="74" width="260" height="34" rx="2" fill="#ffffff" stroke="#111111" strokeWidth="2" />
      {Array.from({ length: 11 }, (_, i) => <line key={i} x1={30 + i * 24} x2={30 + i * 24} y1={74} y2={90} stroke="#111111" strokeWidth="1.4" />)}
      <text x="150" y="126" fontSize="14" textAnchor="middle" fill="#e30613" fontWeight="800">1 cm = 10 mm</text>
    </svg>
  );
}
