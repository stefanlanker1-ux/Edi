// Android-Zurück-Taste (src/native.ts): geht im Verlauf zurück, solange es einen gibt (schließt so Blätter), sonst beendet sie die App; nur in der Android-App.
import { test, expect, beforeEach, vi } from "vitest";
import { initBackButton } from "../src/native.ts";

const cap = vi.hoisted(() => ({ native: true, handler: undefined as ((e: { canGoBack: boolean }) => void) | undefined, exitApp: vi.fn(async () => {}) }));
vi.mock("@lern/ui", () => ({ get isNative() { return cap.native; } }));
vi.mock("@capacitor/app", () => ({ App: { addListener: (_: string, h: (e: { canGoBack: boolean }) => void) => { cap.handler = h; }, exitApp: cap.exitApp } }));

const back = vi.fn();
const start = async (native: boolean, platform: string) => {
  cap.native = native;
  vi.stubGlobal("Capacitor", { isNativePlatform: () => native, getPlatform: () => platform });
  initBackButton();
  await vi.dynamicImportSettled();
};
beforeEach(() => { cap.handler = undefined; cap.exitApp.mockClear(); back.mockClear(); vi.stubGlobal("history", { back }); });

test("Android: mit Verlauf zurück (Blatt schließt, Modul → Übersicht), ohne Verlauf beendet die Taste die App", async () => {
  await start(true, "android");
  expect(cap.handler).toBeTypeOf("function");
  cap.handler!({ canGoBack: true });
  expect(back).toHaveBeenCalledTimes(1);
  expect(cap.exitApp).not.toHaveBeenCalled();
  cap.handler!({ canGoBack: false });
  expect(back).toHaveBeenCalledTimes(1);
  expect(cap.exitApp).toHaveBeenCalledTimes(1);
});

test("iOS und Web: kein Listener (keine Zurück-Taste, Capacitor-Code wird nicht geladen)", async () => {
  await start(true, "ios");
  await start(false, "web");
  expect(cap.handler).toBeUndefined();
});
