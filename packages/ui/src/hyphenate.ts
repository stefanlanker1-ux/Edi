// Weiche Trennstellen (U+00AD) in langen zusammengesetzten Wörtern – für schmale Kacheln und Knöpfe.
// Unabhängig davon, ob der Browser Deutsch trennen kann (hyphens: auto fehlt auf manchen Geräten).

const STEMS = /(stoff|wasser|silicium|calcium|magnesium|natrium|kalium|aluminium|schwefel|chlor|trauben|haushalts|hydrogen|phosphor|salpeter|kohlen(?=säure|dioxid|monoxid))(?=[a-zäöüß])/gi;

/** „Kohlendioxid“ → „Kohlen­dioxid“, „Chlorwasserstoff“ → „Chlor­wasser­stoff“ */
export function softHyphens(text: string): string {
  return text.replace(STEMS, "$1­");
}
