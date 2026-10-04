import type { CapacitorConfig } from "@capacitor/cli";

// Android/iOS-App aus derselben Web-Version (Ordner dist/).
// appId ist die eindeutige Kennung im Play Store / App Store – festgelegt, nie mehr ändern (sonst gilt es als neue App).
const config: CapacitorConfig = {
  appId: "app.edi.lernen",
  appName: "Edi",
  webDir: "dist",
  backgroundColor: "#ffffff",
};

export default config;
