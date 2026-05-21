/**
 * Run History Tracking for Living Dungeon Mini
 *
 * Persists run history (best score, average score, last score) in localStorage.
 */

export const STORAGE_KEY = "autonomous-arcade-dungeon-history";

export interface RunHistory {
  bestScore: number;
  averageScore: number;
  lastScore: number;
  totalRuns: number;
  /** Internal: sum of all scores for computing average */
  _totalScoreSum: number;
}

const DEFAULT_HISTORY: RunHistory = {
  bestScore: 0,
  averageScore: 0,
  lastScore: 0,
  totalRuns: 0,
  _totalScoreSum: 0,
};

function loadHistory(): RunHistory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_HISTORY };
    const parsed = JSON.parse(raw);
    return {
      bestScore: parsed.bestScore ?? 0,
      averageScore: parsed.averageScore ?? 0,
      lastScore: parsed.lastScore ?? 0,
      totalRuns: parsed.totalRuns ?? 0,
      _totalScoreSum: parsed._totalScoreSum ?? 0,
    };
  } catch {
    return { ...DEFAULT_HISTORY };
  }
}

function saveHistory(history: RunHistory): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

/**
 * Record a completed run with the given score.
 */
export function recordRun(score: number): void {
  const history = loadHistory();
  const safeScore = Math.max(0, score);

  history.totalRuns += 1;
  history.lastScore = safeScore;
  history._totalScoreSum += safeScore;

  if (safeScore > history.bestScore) {
    history.bestScore = safeScore;
  }

  history.averageScore =
    history.totalRuns > 0
      ? Math.round(history._totalScoreSum / history.totalRuns)
      : 0;

  saveHistory(history);
}

/**
 * Get the current run history.
 */
export function getRunHistory(): RunHistory {
  const history = loadHistory();
  return { ...history };
}

/**
 * Clear all run history (for testing or user reset).
 */
export function clearRunHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}