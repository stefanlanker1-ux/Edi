// Vorlesen nur mit einer Stimme des Geräts: Netzwerkstimmen (localService false) schickten den Text an einen fremden Dienst.
import { test, expect } from "vitest";
import { localVoice } from "../src/index.ts";

const v = (lang: string, localService: boolean, name = lang) => ({ lang, localService, name, voiceURI: name, default: false }) as SpeechSynthesisVoice;

test("nur lokale Stimmen, die übliche Variante zuerst", () => {
  expect(localVoice([v("de-DE", false, "Google Deutsch"), v("de-DE", true, "Anna")], "de")?.name).toBe("Anna");
  expect(localVoice([v("de-DE", true, "Anna"), v("de-AT", true, "Michael")], "de")?.name).toBe("Michael");
  expect(localVoice([v("en_GB", true, "Daniel"), v("de-DE", true, "Anna")], "en")?.name).toBe("Daniel");
});

test("ohne lokale Stimme der Sprache: keine (Vorlesen wird nicht angeboten)", () => {
  expect(localVoice([v("de-DE", false, "Google Deutsch"), v("en-US", true, "Samantha")], "de")).toBeUndefined();
  expect(localVoice([], "de")).toBeUndefined();
});
