import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@lern/ui/styles.css";
import "@lern/chem-ui/styles.css";
import "./start.css";
import { Start } from "./Start.tsx";

document.documentElement.dataset.theme = "light";
createRoot(document.getElementById("root")!).render(<StrictMode><Start /></StrictMode>);

if (import.meta.env.PROD && "serviceWorker" in navigator && location.protocol.startsWith("http")) {
  import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: true }));
}
