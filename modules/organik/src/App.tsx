import { LernApp, type ShellTab } from "@lern/ui";
import { useApp, type Tab } from "./store.ts";
import { DrawView } from "./views/DrawView.tsx";
import { QuizView } from "./quiz/QuizView.tsx";
import { GUIDE } from "./guide.tsx";

const TABS: ShellTab<Tab>[] = [
  { id: "zeichnen", label: "Zeichnen", icon: "bond" },
  { id: "quiz", label: "Quiz", icon: "quiz" },
];

// Logo: Zickzack-Kette mit Nummern
const Logo = () => (
  <span className="logo" aria-hidden="true">
    <svg viewBox="0 0 32 32" width="34" height="34">
      <rect width="32" height="32" rx="3" fill="var(--accent)" />
      <polyline points="6,20 12,13 19,20 26,13" fill="none" stroke="var(--on-accent)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="26" cy="13" r="2.6" fill="var(--hue-red)" />
    </svg>
  </span>
);

export function App() {
  const { tab, setTab } = useApp();
  return (
    <LernApp name="Nomenklatur" logo={<Logo />} tabs={TABS} tab={tab} onTab={setTab} storage={["organik-v1", "organik-quiz"]} guide={GUIDE}>
      {tab === "zeichnen" && <DrawView />}
      {tab === "quiz" && <QuizView />}
    </LernApp>
  );
}
