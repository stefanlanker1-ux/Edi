// Rechenweg als Tafelbild (Kreideschrift). Immer dieselben drei Schritte – zum Abschreiben ins Heft.
//   ① Umrechnungszahl   ② Einsetzen und ausrechnen (eine Zeile)   + Merksatz
// Seltene Vorsilben (nm, km, MW …) direkt als Zehnerpotenz, sonst die Kette über die Nachbareinheiten.

import { mul, unitSi, div, eq, ONE, isTerminating, fmt, prefixStep, type Solution } from "@lern/units";
import { Num, RowChain, RowView, sciNeeded, sci, timeMixed, numText } from "../format.tsx";

export function ChalkBoard({ s, os, title = "Rechenweg" }: { s: Solution; os: boolean; title?: string }) {
  const { value, from, to, rel, result, divisor } = s;
  const approx = !isTerminating(result);
  const inSeconds = to === "s" || ["min", "h", "d", "ms"].includes(to) ? mul(result, unitSi(to)) : null;
  const mixed = inSeconds ? timeMixed(inSeconds) : null;
  // Vorsilben als Zehnerpotenzen (km → mm: 10^(3 − (−3)) = 10⁶)
  // Seltene Vorsilben: kurz und direkt – 1 nm = 10⁻⁷ cm, 50 nm = 50 · 10⁻⁷ cm (keine Kette über µm, mm …)
  const st = os ? prefixStep(from, to) : null;
  const short = !!st && st.diff !== 0;
  const P = ({ k }: { k: number }) => <>10<sup>{k < 0 ? `−${-k}` : k}</sup></>;
  return (
    <figure className="chalkboard" aria-label={`Rechenweg: ${numText(value)} ${from} = ${numText(result)} ${to}`}>
      <figcaption className="cb-title">{title}</figcaption>
      <div className="cb-task">
        <span><Num v={value} /> {from} = <span className="cb-q">?</span> {to}</span>
      </div>

      <div className="cb-step"><span className="cb-n">1</span>Umrechnungszahl</div>
      {short ? (
        <>
          <div className="cb-eq">1 <span className="t-unit">{from}</span> = <P k={st.exp} /> <span className="t-unit">{to}</span></div>
          {st.alias.length > 0 && <div className="cb-note">denn {st.alias.join(" und ")}</div>}
        </>
      ) : (
        <>
          <div className="cb-eq"><RowChain rows={rel.rows} /></div>
          {rel.notes.length > 0 && <div className="cb-note">denn {rel.notes.join(" und ")}</div>}
        </>
      )}

      <div className="cb-step"><span className="cb-n">2</span>Einsetzen und ausrechnen</div>
      <div className="cb-eq cb-result">
        <span className="chain">
          <span className="chain-part"><Num v={value} /> {from}</span>
          {short
            ? <span className="chain-part"><span className="eq">=</span><Num v={value} /><span className="op"> · </span><P k={st.exp} /> {to}</span>
            : <span className="chain-part"><span className="eq">=</span><Num v={value} /><span className="op"> · </span><Num v={rel.F} /> {to}</span>}
          {!short && divisor && !eq(divisor, ONE) && <span className="chain-part"><span className="eq">=</span><Num v={value} /><span className="op"> : </span><Num v={divisor} /> {to}</span>}
          <span className="chain-part"><span className="eq">{approx ? "≈" : "="}</span><span className="cb-res">{approx ? fmt(result).text : <Num v={result} className="res-num" />} {to}</span></span>
          {os && sciNeeded(result) && <span className="chain-part"><span className="eq">=</span>{sci(result)} {to}</span>}
          {mixed && <span className="chain-part"><span className="eq">=</span>{mixed}</span>}
        </span>
      </div>

    </figure>
  );
}

/** Kompakte Einzeiler-Form (für Karten): „1 km = 1000 m“ */
export function RelationLine({ s }: { s: Solution }) {
  const last = s.rel.rows[s.rel.rows.length - 1];
  return <span className="rel-line"><RowView row={{ coef: ONE, unit: s.from }} /> = <RowView row={last} /></span>;
}

/** Faktor als Text: „· 100“ oder „: 100“ */
export function factorText(s: Solution): string {
  if (s.divisor) return `: ${numText(s.divisor)}`;
  return `· ${numText(s.rel.F)}`;
}
export const siRatio = (a: string, b: string) => div(unitSi(a), unitSi(b));
