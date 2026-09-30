// Bild auf der Kachel der Übersicht (wird sofort geladen – klein halten, keine Stile aus app.css).

export function Card() {
  return (
    <svg style={{ width: "min(100cqw, 180cqh, 200px)" }} viewBox="0 0 320 170" aria-hidden="true">
      {/* Wasser gewinkelt (104,5°) – nie linear zeichnen */}
      <rect x="28.3" y="73.1" width="170" height="54" rx="27" transform="rotate(142.2 113.3 100.1)" fill="#e9eef3" stroke="#a9b3bd" strokeWidth="3" />
      <rect x="121.7" y="73.1" width="170" height="54" rx="27" transform="rotate(37.8 206.7 100.1)" fill="#e9eef3" stroke="#a9b3bd" strokeWidth="3" />
      <circle cx="160" cy="64" r="30" fill="#e9eef3" />
      <circle cx="160" cy="64" r="56" fill="none" style={{ stroke: "var(--hue-red)" }} strokeWidth="4" />
      <text x="160" y="78" fontSize="40" fontWeight="800" textAnchor="middle" fill="#25271f">O</text>
      <text x="66.7" y="150.2" fontSize="40" fontWeight="800" textAnchor="middle" fill="#25271f">H</text>
      <text x="253.3" y="150.2" fontSize="40" fontWeight="800" textAnchor="middle" fill="#25271f">H</text>
      <circle cx="120.3" cy="84.6" r="6" style={{ fill: "var(--hue-blue)" }} /><circle cx="130.1" cy="97.3" r="6" style={{ fill: "var(--hue-blue)" }} />
      <circle cx="189.9" cy="97.3" r="6" style={{ fill: "var(--hue-blue)" }} /><circle cx="199.7" cy="84.6" r="6" style={{ fill: "var(--hue-blue)" }} />
      <circle cx="136.4" cy="35.6" r="6" style={{ fill: "var(--hue-blue)" }} /><circle cx="126.6" cy="48.3" r="6" style={{ fill: "var(--hue-blue)" }} />
      <circle cx="193.4" cy="48.3" r="6" style={{ fill: "var(--hue-blue)" }} /><circle cx="183.6" cy="35.6" r="6" style={{ fill: "var(--hue-blue)" }} />
    </svg>
  );
}
