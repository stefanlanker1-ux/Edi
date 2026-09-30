// Bild auf der Kachel der Übersicht (wird sofort geladen – klein halten, keine Stile aus app.css).

export function Card() {
  return (
    <svg style={{ width: "min(100cqw, 220cqh, 240px)" }} viewBox="0 0 300 130" aria-hidden="true">
      {/* Atombilanz 2 H₂ + O₂ → 2 H₂O: H 4 | 4, O 2 | 2 */}
      <text x="24" y="52" fontSize="26" fontWeight="800" fill="#111111">H</text>
      {[0, 1, 2, 3].map(i => <rect key={i} x={60 + i * 22} y={32} width="18" height="18" rx="2" fill="#111111" />)}
      <text x="160" y="50" fontSize="24" fontWeight="800" textAnchor="middle" fill="#1a7f37">✓</text>
      {[0, 1, 2, 3].map(i => <rect key={i} x={182 + i * 22} y={32} width="18" height="18" rx="2" fill="#ffffff" stroke="#111111" strokeWidth="2" />)}
      <text x="24" y="96" fontSize="26" fontWeight="800" fill="#111111">O</text>
      {[0, 1].map(i => <rect key={i} x={104 + i * 22} y={76} width="18" height="18" rx="2" fill="#111111" />)}
      <text x="160" y="94" fontSize="24" fontWeight="800" textAnchor="middle" fill="#1a7f37">✓</text>
      {[0, 1].map(i => <rect key={i} x={182 + i * 22} y={76} width="18" height="18" rx="2" fill="#ffffff" stroke="#111111" strokeWidth="2" />)}
      <text x="150" y="124" fontSize="14" textAnchor="middle" fill="#e30613" fontWeight="800">2 H₂ + O₂ → 2 H₂O</text>
    </svg>
  );
}
