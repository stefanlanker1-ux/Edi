// „Zurück“ schließt Blätter (useBackClose in @lern/ui): eigener Verlaufseintrag je Blatt; Schließen und Öffnen im selben Durchlauf;
// Eintrag, der vom Neuladen stehen blieb.
import { test, expect, beforeEach, vi } from "vitest";
import { closeBackEntry, dropStaleBackEntry, openBackEntry } from "@lern/ui";

class FakeHistory {
  entries: unknown[] = [null];
  i = 0;
  backs = 0;
  get state() { return this.entries[this.i]; }
  get length() { return this.entries.length; }
  pushState(s: unknown) { this.entries = [...this.entries.slice(0, this.i + 1), s]; this.i++; }
  replaceState(s: unknown) { this.entries[this.i] = s; }
  back() { this.backs++; if (this.i > 0) this.i--; }
}
let h: FakeHistory;
beforeEach(() => { h = new FakeHistory(); vi.stubGlobal("history", h); });
const tick = () => new Promise<void>(r => queueMicrotask(r));

test("Blatt öffnen und mit dem Knopf schließen: eigener Eintrag, danach wieder zurück", async () => {
  const id = openBackEntry("uiSheet");
  expect(h.length).toBe(2);
  closeBackEntry("uiSheet", id);
  await tick();
  expect(h.backs).toBe(1);
  expect(h.i).toBe(0);
});

test("Schließen und Öffnen im selben Durchlauf: das neue Blatt übernimmt den Eintrag, kein nachlaufendes Zurück", async () => {
  const a = openBackEntry("uiSheet");
  closeBackEntry("uiSheet", a);
  const b = openBackEntry("uiGuide");
  await tick();
  expect(h.backs).toBe(0);
  expect(h.length).toBe(2);
  expect((h.state as Record<string, unknown>).uiGuide).toBe(b);
  // „Zurück“ schließt danach das neue Blatt (der Eintrag gehört ihm)
  closeBackEntry("uiGuide", b);
  await tick();
  expect(h.backs).toBe(1);
});

test("Eintrag eines Blatts, das vor dem Neuladen offen war: beim Start einmal zurück", () => {
  h.pushState({ uiSheet: "alt", overlay: true });
  dropStaleBackEntry();
  expect(h.backs).toBe(1);
  // früheres Format
  h.pushState({ uiGuide: true });
  dropStaleBackEntry();
  expect(h.backs).toBe(2);
  // fremder Zustand bleibt
  h.pushState({ other: 1 });
  dropStaleBackEntry();
  expect(h.backs).toBe(2);
});
