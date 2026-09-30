import type { CapacitorConfig } from "@capacitor/cli";

// Android/iOS-App aus derselben Web-Version (Ordner dist/).
// appId ist die eindeutige Kennung im Play Store / App Store – vor der ersten Veröffentlichung festlegen.
const config: CapacitorConfig = {
  appId: "io.github.stefanlanker1ux.elektronenpaarbindung",
  appName: "Elektronenpaarbindung",
  webDir: "dist",
  backgroundColor: "#ffffff",
};

export default config;
