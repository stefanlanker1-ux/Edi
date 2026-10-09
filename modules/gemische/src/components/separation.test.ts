// Bilder der Trennverfahren (Nachprüfung Runde 3): Dekantieren physikalisch stimmig, Eindampfen mit Drahtnetz, Alkohol ohne Flamme,
// antippbare Teile wirklich im Bild, Temperatur lesbar. Die Szenen sind reine Funktionen von t – hier als Baum aus React-Elementen geprüft.
import { test, assert } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { SCENES, dekState, tempFont, type Method } from "./Separation.tsx";
import { GENS } from "../quiz/tasks.ts";

/** alle Elemente einer Szene (Funktionskomponenten wie Beaker, Flame, Mantle aufgelöst – sie sind rein) */
function flat(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(flat);
  if (!isValidElement(node)) return [];
  const el = node as ReactElement<Record<string, unknown>>;
  if (typeof el.type === "function") return flat((el.type as (p: unknown) => ReactNode)(el.props));
  return [el, ...flat(el.props.children as ReactNode)];
}
const scene = (m: Method, t: number, alk = false, off = false) => flat(SCENES[m](t, "x", alk, off));
const parts = (m: Method, t: number) => new Set(scene(m, t).map(e => e.props["data-part"]).filter(Boolean));

test("Dekantieren: im Uhrzeigersinn um den Ausguss gekippt (50–60°), Strahl aus dem Ausguss, Glas 2 anfangs leer, Gläser berühren sich nie", () => {
  const ts = Array.from({ length: 201 }, (_, i) => i / 200);
  const st = ts.map(dekState);
  const max = Math.max(...st.map(s => s.ang));
  assert.ok(max >= 50 && max <= 60, `größter Winkel ${max}`);
  assert.ok(st.every(s => s.ang >= 0), "nur im Uhrzeigersinn (positiver Winkel im Bild)");
  assert.strictEqual(st[0].ang, 0);
  assert.strictEqual(st[0].level, st[0].g2.y1, "Glas 2 am Anfang leer");
  assert.ok(!scene("dekantieren", 0).some(e => e.props["data-part"] === "wasser2"), "kein Wasser in Glas 2 am Anfang");
  for (const s of st) {
    // Drehpunkt ist die Spitze des Ausgusses: sie bleibt, wo sie ist, und ist der Punkt von Glas 1, der Glas 2 am nächsten ist
    const xs = s.glass.map(p => p[0]);
    assert.ok(Math.abs(s.glass.at(-1)![0] - s.spout[0]) < 1e-9 && Math.abs(s.glass.at(-1)![1] - s.spout[1]) < 1e-9, "Ausguss wandert");
    assert.ok(Math.max(...xs) <= s.spout[0] + 1e-9, "Ausguss nicht auf der Gießseite");
    assert.ok(Math.max(...xs) < s.g2.x0 - 6, `Gläser berühren sich (t, x = ${Math.max(...xs)})`);
    // Wasser waagrecht und nie über dem Ausguss
    assert.ok(s.surface >= s.spout[1] - 1e-6, "Wasserspiegel über dem Ausguss");
    if (s.flow) assert.ok(s.surface - s.spout[1] < .5, "Strahl, obwohl das Wasser den Ausguss nicht erreicht");
  }
  // es fließt wirklich etwas, und am Ende steht Glas 1 wieder mit dem Bodensatz (und etwas Wasser), Glas 2 hat das Wasser
  assert.ok(st.some(s => s.flow));
  const end = st.at(-1)!;
  assert.strictEqual(end.ang, 0);
  assert.ok(end.g2.y1 - end.level > 15, "zu wenig Wasser in Glas 2");
  // Strahl beginnt an der Spitze des Ausgusses
  const stream = scene("dekantieren", .6).find(e => e.props.className === "sp-stream");
  assert.ok(stream && String(stream.props.d).startsWith(`M${end.spout[0]} ${end.spout[1]} `), String(stream?.props.d));
});

test("Eindampfen: die Schale liegt auf dem Drahtnetz, die Flamme reicht bis ans Netz", () => {
  const els = scene("eindampfen", .5);
  const dish = els.find(e => e.props.className === "sp-dish")!, gauze = els.find(e => e.props.className === "sp-gauze");
  assert.ok(gauze, "kein Drahtnetz");
  const [, y0, , cy, , y1] = String(dish.props.d).match(/-?\d+(\.\d+)?/g)!.map(Number);
  const bottom = .25 * y0 + .5 * cy + .25 * y1; // tiefster Punkt der Schale (quadratische Kurve)
  assert.ok(Math.abs(bottom - Number(gauze.props.y)) <= .5, `Schale schwebt: ${bottom} über ${gauze.props.y}`);
  const flame = els.find(e => e.props.className === "sp-flame")!;
  const tip = Math.min(...String(flame.props.d).match(/-?\d+(\.\d+)?/g)!.map(Number).filter((_, i) => i % 2 === 1));
  const net = Number(gauze.props.y) + Number(gauze.props.height);
  assert.ok(tip >= net - .5 && tip - net < 6, `Flammenspitze ${tip}, Netz unten ${net}`);
});

test("Destillieren: Alkohol (brennbar) mit Heizhaube statt offener Flamme, Salzwasser über dem Brenner", () => {
  for (const t of [0, .3, .9]) {
    const alk = scene("destillieren", t, true);
    assert.ok(!alk.some(e => e.props["data-part"] === "flamme" || e.props.className === "sp-flame"), `Flamme bei Alkohol (t = ${t})`);
    assert.ok(alk.some(e => e.props["data-part"] === "heizung"), "Heizhaube fehlt");
    assert.ok(scene("destillieren", t).some(e => e.props["data-part"] === "flamme"), "Salzwasser ohne Brenner");
  }
  // eingeschaltet glüht die Mulde, ausgeschaltet nicht
  assert.ok(scene("destillieren", .5, true).some(e => e.props.className === "sp-heat"));
  assert.ok(!scene("destillieren", 0, true, true).some(e => e.props.className === "sp-heat"));
});

test("Antippen: jedes antippbare Teil ist im Bild, je Verfahren mehrere Ziele, die richtige Antwort wechselt", () => {
  const seen = new Map<string, Set<string>>();
  for (const g of [GENS.trennTipp, GENS.loesTipp]) for (let k = 0; k < 400; k++) {
    const t = g();
    if (t.kind !== "tap" || !t.sep) continue;
    const have = parts(t.sep.m, t.sep.t);
    for (const p of t.parts) assert.ok(have.has(p), `${t.sep.m} (t = ${t.sep.t}): Teil „${p}“ fehlt im Bild`);
    if (!seen.has(t.sep.m)) seen.set(t.sep.m, new Set());
    seen.get(t.sep.m)!.add(t.answer);
  }
  for (const [m, answers] of seen) assert.ok(answers.size >= 2, `${m}: nur ${[...answers]}`);
  assert.ok([...seen.values()].reduce((s, a) => s + a.size, 0) >= 18, "zu wenige Varianten");
});

test("Temperatur am Thermometer auf dem Bildschirm mindestens 14 px groß", () => {
  for (const k of [.65, .8, 1, 1.5, 2.5]) assert.ok(tempFont(k) * k >= 14, `bei ${k} px je Einheit: ${tempFont(k) * k} px`);
});
