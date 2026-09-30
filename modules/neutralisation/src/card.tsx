// Bild auf der Kachel der Übersicht (wird sofort geladen – klein halten, keine Stile aus app.css).

export function Card() {
  return (
    <svg style={{ width: "min(100cqw, 220cqh, 240px)" }} viewBox="0 0 300 130" aria-hidden="true">
      {/* Ba(OH)₂ + H₂SO₄: Ba²⁺ mit 2 OH⁻, darunter 2 H⁺ mit SO₄²⁻ → BaSO₄ + 2 H₂O */}
      <rect x="20" y="8" width="120" height="26" rx="3" style={{ fill: "var(--hue-yellow)" }} stroke="#111111" strokeWidth="2" />
      <text x="80" y="27" fontSize="16" fontWeight="800" textAnchor="middle" fill="#111111">Ba²⁺</text>
      {[0, 1].map(i => <g key={`o${i}`}><rect x={20 + i * 62} y="38" width="58" height="22" rx="3" style={{ fill: "var(--hue-blue-light)" }} stroke="#111111" strokeWidth="2" /><text x={49 + i * 62} y="54" fontSize="14" fontWeight="800" textAnchor="middle" fill="#111111">OH⁻</text></g>)}
      {[0, 1].map(i => <g key={`h${i}`}><rect x={20 + i * 62} y="70" width="58" height="22" rx="3" style={{ fill: "var(--hue-blue-light)" }} stroke="#111111" strokeWidth="2" strokeDasharray="4 3" /><text x={49 + i * 62} y="86" fontSize="14" fontWeight="800" textAnchor="middle" fill="#111111">H⁺</text></g>)}
      <rect x="20" y="96" width="120" height="26" rx="3" style={{ fill: "var(--hue-green)" }} stroke="#111111" strokeWidth="2" />
      <text x="80" y="115" fontSize="16" fontWeight="800" textAnchor="middle" fill="#111111">SO₄²⁻</text>
      <path d="M158 65h30m-10-9 10 9-10 9" stroke="#111111" strokeWidth="3" fill="none" />
      <text x="244" y="58" fontSize="20" fontWeight="800" textAnchor="middle" fill="#111111">BaSO₄</text>
      <text x="244" y="86" fontSize="18" fontWeight="800" textAnchor="middle" fill="#e30613">+ 2 H₂O</text>
    </svg>
  );
}
