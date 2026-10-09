// Android-App: die Zurück-Taste geht im Verlauf der WebView zurück – wie „Zurück“ im Browser schließt sie so ein offenes Blatt bzw. die Erklärung
// (`useBackClose`) und führt vom Modul zur Übersicht; erst auf der Startseite beendet sie die App. Ohne Listener ginge `@capacitor/app` zwar ebenfalls
// zurück, bliebe am Anfang aber stehen. Nachgeladen nur in der Android-App (im Web nie geladen, die Einzeldatei enthält es nicht).
import { isNative } from "@lern/ui";

export function initBackButton() {
  if (import.meta.env.MODE === "single" || !isNative) return;
  if ((globalThis as { Capacitor?: { getPlatform?: () => string } }).Capacitor?.getPlatform?.() !== "android") return;
  void import("@capacitor/app").then(({ App }) =>
    App.addListener("backButton", ({ canGoBack }) => { if (canGoBack) history.back(); else void App.exitApp(); }));
}
