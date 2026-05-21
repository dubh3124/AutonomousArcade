/**
 * Word Grid Game Engine
 *
 * Core game logic: grid generation, word finding, adjacency validation,
 * scoring, timer, and run-history tracking.
 */

export interface LetterCell {
  letter: string;
  row: number;
  col: number;
}

export type LetterGrid = LetterCell[];

export interface Position {
  row: number;
  col: number;
}

export interface SubmitResult {
  accepted: boolean;
  reason?: "too-short" | "duplicate" | "not-adjacent" | "mismatch" | "not-in-dictionary";
}

export interface RunStats {
  runs: number;
  best: number | null;
  average: number | null;
  last: number | null;
}

export interface GameResult {
  score: number;
  words: string[];
  timeExpired: boolean;
}

// ---------- Grid Generation ----------

export function generateGrid(): LetterGrid {
  throw new Error("Not implemented");
}

// ---------- Word Finding ----------

export function findWordsInGrid(_grid: LetterGrid): { word: string; path: Position[] }[] {
  throw new Error("Not implemented");
}

// ---------- Adjacency ----------

export function getAdjacentPositions(row: number, col: number): Position[] {
  throw new Error("Not implemented");
}

export function isValidAdjacentSelection(_path: Position[]): boolean {
  throw new Error("Not implemented");
}

// ---------- Scoring ----------

export function scoreWord(_word: string): number {
  throw new Error("Not implemented");
}

export function scoreRun(_words: string[]): number {
  throw new Error("Not implemented");
}

// ---------- Timer ----------

export interface Timer {
  getRemaining(): number;
  isRunning(): boolean;
  isExpired(): boolean;
  start(): void;
  stop(): void;
  reset(): void;
}

export function createTimer(_durationSeconds: number, _onExpire?: () => void): Timer {
  throw new Error("Not implemented");
}

// ---------- Run History ----------

export class RunHistory {
  record(_score: number): void {
    throw new Error("Not implemented");
  }

  getStats(): RunStats {
    throw new Error("Not implemented");
  }

  getAllResults(): number[] {
    throw new Error("Not implemented");
  }

  reset(): void {
    throw new Error("Not implemented");
  }
}

// ---------- Game Controller ----------

export class WordGridGame {
  constructor(_grid: LetterGrid, _history?: RunHistory) {
    throw new Error("Not implemented");
  }

  getGrid(): LetterGrid {
    throw new Error("Not implemented");
  }

  getScore(): number {
    throw new Error("Not implemented");
  }

  getWords(): string[] {
    throw new Error("Not implemented");
  }

  getTimer(): Timer {
    throw new Error("Not implemented");
  }

  isActive(): boolean {
    throw new Error("Not implemented");
  }

  start(): void {
    throw new Error("Not implemented");
  }

  submitWord(_word: string, _path: Position[]): SubmitResult {
    throw new Error("Not implemented");
  }

  getResult(): GameResult {
    throw new Error("Not implemented");
  }
}
