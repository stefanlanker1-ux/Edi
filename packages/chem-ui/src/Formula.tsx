// Summenformel mit echten tiefgestellten Zahlen: "Al2(SO4)3" → Al₂(SO₄)₃
export function Formula({ f, className }: { f: string; className?: string }) {
  return (
    <span className={`formula${className ? ` ${className}` : ""}`}>
      {f.split(/(\d+)/).map((p, i) => (/^\d+$/.test(p) ? <sub key={i}>{p}</sub> : p))}
    </span>
  );
}
