// Quiz-Store des Atombaus über das gemeinsame Grundgerüst (@lern/quiz).
// Fortschritt und Statistik aus der alten Speicherung (atombau-v3) werden einmalig übernommen.

import { createQuizStore, type LevelKey, type TypeStats } from "@lern/quiz";
import { makeRound, levelId, type Stufe, type Task } from "./tasks.ts";

function seed() {
  try {
    const old = JSON.parse(localStorage.getItem("atombau-v3") ?? "null")?.state;
    if (!old?.progress && !old?.typeStats) return {};
    return { progress: old.progress ?? {}, typeStats: old.typeStats ?? {} };
  } catch { return {}; }
}

export const useQuiz = createQuizStore<Task>({
  storageKey: "atombau-quiz",
  levelId: (stufe, level) => levelId(stufe as Stufe, level),
  makeRound: (stufe, level: LevelKey, stats?: TypeStats, due?: string[]) => makeRound(stufe as Stufe, level, 10, stats, due),
  seed,
});
