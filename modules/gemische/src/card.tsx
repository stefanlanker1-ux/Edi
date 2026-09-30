// Bild auf der Kachel der Übersicht (wird sofort geladen – klein halten, keine Stile aus app.css).

const H = "#f5f4f0";
/** Wasser: O mit zwei H */
const Water = ({ x, y }: { x: number; y: number }) => (
  <g>
    <circle cx={x} cy={y} r="7" fill="var(--hue-red)" stroke="#111" strokeWidth="1" />
    <circle cx={x - 6} cy={y + 6} r="4.4" fill={H} stroke="#111" strokeWidth="1" />
    <circle cx={x + 6} cy={y + 6} r="4.4" fill={H} stroke="#111" strokeWidth="1" />
  </g>
);

export function Card() {
  return (
    <svg viewBox="0 0 120 100" aria-hidden="true" style={{ width: "min(100cqw, 130cqh, 170px)", overflow: "visible" }}>
      <path d="M22 6v80a6 6 0 0 0 6 6h64a6 6 0 0 0 6-6V6" fill="none" stroke="#111" strokeWidth="2.5" />
      <line x1="22" x2="98" y1="40" y2="40" stroke="#111" strokeWidth="1" strokeDasharray="3 3" />
      {/* Öl oben: kurze Kette */}
      {[0, 1, 2, 3, 4].map(i => <circle key={i} cx={38 + i * 9} cy={32} r="5" fill="#3a3a3a" stroke="#111" strokeWidth="1" />)}
      <Water x={40} y={56} /><Water x={72} y={58} /><Water x={55} y={76} /><Water x={84} y={78} />
      <circle cx="30" cy="80" r="6.5" fill="var(--hue-blue)" stroke="#111" strokeWidth="1" />
    </svg>
  );
}
