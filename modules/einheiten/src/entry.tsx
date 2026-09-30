// Inhalt des Moduls – eigene Datei im Build, wird erst beim Öffnen geladen.
// Die Stile in app.css gelten nur, solange das Modul offen ist (<html data-modul="einheiten">, siehe scripts/modul-scope.ts).
// Kreideschrift für die Tafel (lokal eingebunden, funktioniert offline)
import "@fontsource/kalam/latin-400.css";
import "@fontsource/kalam/latin-700.css";
import "@fontsource/cabin-sketch/latin-700.css";
import "./app.css";
export { App as default } from "./App.tsx";
