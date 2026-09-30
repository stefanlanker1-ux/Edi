import { boot } from "@lern/ui";
import "@lern/ui/styles.css";
import "@lern/quiz/styles.css";
// Kreideschrift für die Tafel (lokal eingebunden, funktioniert offline)
import "@fontsource/kalam/latin-400.css";
import "@fontsource/kalam/latin-700.css";
import "@fontsource/cabin-sketch/latin-700.css";
import "./app.css";
import { App } from "./App.tsx";

boot(<App />);