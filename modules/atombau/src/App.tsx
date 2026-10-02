import { LernApp, type ShellTab } from "@lern/ui";
import { useApp, type Tab } from "./store.ts";
import { BuildView } from "./views/BuildView.tsx";
import { ExploreView } from "./views/ExploreView.tsx";
import { QuizView } from "./quiz/QuizView.tsx";
import { guideFor } from "./guide.tsx";
import { tr } from "@lern/i18n";

const TABS: ShellTab<Tab>[] = [
  { id: "build", label: tr("Bauen", "Build"), icon: "atom" },
  { id: "pse", label: tr("Periodensystem", "Periodic table"), short: tr("PSE", "PT"), icon: "grid" },
  { id: "quiz", label: "Quiz", icon: "quiz" },
];

const Logo = () => (
  <span className="logo" aria-hidden="true">
    <svg viewBox="0 0 32 32" width="34" height="34">
      <rect width="32" height="32" rx="3" fill="var(--accent)" />
      <g fill="none" stroke="var(--on-accent)" strokeWidth="1.6" opacity=".95">
        <ellipse cx="16" cy="16" rx="11" ry="4.2" /><ellipse cx="16" cy="16" rx="11" ry="4.2" transform="rotate(60 16 16)" /><ellipse cx="16" cy="16" rx="11" ry="4.2" transform="rotate(120 16 16)" />
      </g>
      <circle cx="16" cy="16" r="2.6" fill="var(--proton)" />
    </svg>
  </span>
);

export function App() {
  const { tab, setTab, stufe, setStufe } = useApp();

  return (
    <LernApp name={tr("Atombau", "Atomic Structure")} logo={<Logo />} tabs={TABS} tab={tab} onTab={setTab} storage={["atombau-v3", "atombau-quiz"]} stufe={{ value: stufe, onChange: setStufe }} guide={guideFor(stufe)}>
      {tab === "build" && <BuildView />}
      {tab === "pse" && <ExploreView />}
      {tab === "quiz" && <QuizView />}
    </LernApp>
  );
}
