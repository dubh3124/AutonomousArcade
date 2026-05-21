/**
 * Reaction Rush – Game Logic
 *
 * Pure functions for reaction measurement, score computation, and run-history tracking.
 */

/** A single run result */
export interface RunResult {
  /** Reaction time in milliseconds */
  reactionMs: number;
  /** Computed score (lower ms = higher score) */
  score: number;
}

/** Aggregate run-history statistics */
export interface RunHistory {
  /** All run results in order */
  runs: RunResult[];
  /** Best (lowest) reaction time in ms, or null if no runs */
  bestMs: number | null;
  /** Average reaction time in ms, or null if no runs */
  averageMs: number | null;
  /** Last reaction time in ms, or null if no runs */
  lastMs: number | null;
}

/** Creates an empty run history */
export function createRunHistory(): RunHistory {
  return {
    runs: [],
    bestMs: null,
    averageMs: null,
    lastMs: null,
  };
}

/**
 * Computes a score from a reaction time in milliseconds.
 * Lower reaction time → higher score.
 * Formula: max(0, round(1000 - ms))
 *   0 ms → 1000 points
 *   500 ms → 500 points
 *   1000+ ms → 0 points
 */
export function computeScore(reactionMs: number): number {
  return Math.max(0, Math.round(1000 - reactionMs));
}

/**
 * Records a new run result into the run history.
 * Returns a new RunHistory (immutable update).
 */
export function recordRun(history: RunHistory, reactionMs: number): RunHistory {
  const score = computeScore(reactionMs);
  const result: RunResult = { reactionMs, score };
  const runs = [...history.runs, result];

  const times = runs.map((r) => r.reactionMs);
  const bestMs = Math.min(...times);
  const averageMs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const lastMs = reactionMs;

  return { runs, bestMs, averageMs, lastMs };
}

/**
 * Generates a random delay in milliseconds between min and max (inclusive).
 * Used for the random interval before the stimulus appears.
 */
export function randomDelayMs(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Measures the delta between two timestamps in milliseconds.
 */
export function measureReaction(
  stimulusTime: number,
  clickTime: number
): number {
  return Math.max(0, clickTime - stimulusTime);
}