// Einstieg der App Edi: gemeinsame Stile, Hülle mit Übersicht und Modulen, Service Worker (im Web).
import { boot } from "@lern/ui";
import "@lern/ui/styles.css";
import "@lern/chem-ui/styles.css";
import "@lern/quiz/styles.css";
import "./shell.css";
import { Shell, preloadModules } from "./Shell.tsx";

boot(<Shell />);
if (import.meta.env.PROD) preloadModules();
