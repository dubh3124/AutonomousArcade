/**
 * Word Grid Game Engine
 *
 * Core game logic: grid generation, word finding, adjacency validation,
 * scoring, timer, and run-history tracking.
 */

import { isDictionaryWord, hasPrefix } from "./dictionary";

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

const VOWELS = ["A", "E", "I", "O", "U"];
const CONSONANTS_COMMON = ["T", "N", "S", "R", "H", "L", "D", "C", "M", "P"];
const CONSONANTS_EXTRA = ["B", "F", "G", "J", "K", "Q", "V", "W", "X", "Y", "Z"];

function randomLetter(): string {
  const roll = Math.random();
  if (roll < 0.35) {
    return VOWELS[Math.floor(Math.random() * VOWELS.length)];
  }
  if (roll < 0.70) {
    return CONSONANTS_COMMON[Math.floor(Math.random() * CONSONANTS_COMMON.length)];
  }
  return CONSONANTS_EXTRA[Math.floor(Math.random() * CONSONANTS_EXTRA.length)];
}

export function getCell(grid: LetterGrid, row: number, col: number): LetterCell | undefined {
  return grid.find((c) => c.row === row && c.col === col);
}

/**
 * Generate a 4x4 grid of random letters, ensuring at least one valid
 * English word exists in the grid. Retries until a valid word is found.
 */
export function generateGrid(): LetterGrid {
  const maxAttempts = 200;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid: LetterGrid = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        grid.push({ letter: randomLetter(), row, col });
      }
    }
    const words = findWordsInGrid(grid);
    if (words.length > 0) {
      return grid;
    }
  }
  // Fallback: force a guaranteed word
  const grid: LetterGrid = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      grid.push({ letter: "X", row, col });
    }
  }
  // Override first three cells to spell "CAT"
  grid[0] = { letter: "C", row: 0, col: 0 };
  grid[1] = { letter: "A", row: 0, col: 1 };
  grid[2] = { letter: "T", row: 0, col: 2 };
  return grid;
}

// ---------- Word Finding ----------

/**
 * Depth-first search on the grid to find all valid dictionary words (3-8 letters).
 */
export function findWordsInGrid(grid: LetterGrid): { word: string; path: Position[] }[] {
  const results: { word: string; path: Position[] }[] = [];
  const found = new Set<string>();

  for (const cell of grid) {
    const visited = new Set<string>();
    const path: Position[] = [];
    dfs(grid, cell.row, cell.col, "", path, visited, found, results);
  }

  results.sort((a, b) => b.word.length - a.word.length);
  return results;
}

function posKey(row: number, col: number): string {
  return `${row},${col}`;
}

function dfs(
  grid: LetterGrid,
  row: number,
  col: number,
  prefix: string,
  path: Position[],
  visited: Set<string>,
  found: Set<string>,
  results: { word: string; path: Position[] }[],
): void {
  const cell = getCell(grid, row, col);
  if (!cell) return;

  const key = posKey(row, col);
  if (visited.has(key)) return;

  const word = prefix + cell.letter;

  // Prefix pruning: only continue if this could form a valid word
  if (!hasPrefix(word)) return;

  visited.add(key);
  path.push({ row, col });

  if (word.length >= 3 && isDictionaryWord(word) && !found.has(word)) {
    found.add(word);
    results.push({ word, path: [...path] });
  }

  // Only recurse up to 8 letters
  if (word.length < 8) {
    const neighbors = getAdjacentPositions(row, col);
    for (const n of neighbors) {
      dfs(grid, n.row, n.col, word, path, visited, found, results);
    }
  }

  visited.delete(key);
  path.pop();
}

// ---------- Adjacency ----------

/**
 * Get all valid adjacent positions (cardinal + diagonal) for a given cell.
 */
export function getAdjacentPositions(row: number, col: number): Position[] {
  const positions: Position[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < 4 && nc >= 0 && nc < 4) {
        positions.push({ row: nr, col: nc });
      }
    }
  }
  return positions;
}

/**
 * Check if a path of positions forms valid Boggle-style adjacency:
 * consecutive positions must be adjacent, and no position may be reused.
 */
export function isValidAdjacentSelection(path: Position[]): boolean {
  if (path.length <= 1) return true;

  const visited = new Set<string>();
  visited.add(posKey(path[0].row, path[0].col));

  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const key = posKey(curr.row, curr.col);

    if (visited.has(key)) return false;
    visited.add(key);

    const dr = Math.abs(curr.row - prev.row);
    const dc = Math.abs(curr.col - prev.col);
    if (dr > 1 || dc > 1 || (dr === 0 && dc === 0)) {
      return false;
    }
  }
  return true;
}

// ---------- Scoring ----------

/**
 * Score a single word by length:
 *   3-4 letters: 1 point
 *   5 letters:   2 points
 *   6 letters:   3 points
 *   7 letters:   5 points
 *   8+ letters:  11 points
 */
export function scoreWord(word: string): number {
  const len = word.length;
  if (len < 3) return 0;
  if (len <= 4) return 1;
  if (len === 5) return 2;
  if (len === 6) return 3;
  if (len === 7) return 5;
  return 11;
}

/**
 * Sum the scores of a list of words.
 */
export function scoreRun(words: string[]): number {
  return words.reduce((total, w) => total + scoreWord(w), 0);
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

export function createTimer(durationSeconds: number, onExpire?: () => void): Timer {
  let remaining = durationSeconds;
  let running = false;
  let expired = false;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function tick() {
    if (remaining > 0) {
      remaining--;
    }
    if (remaining === 0) {
      stopInternal(true);
    }
  }

  function stopInternal(didExpire: boolean) {
    running = false;
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (didExpire) {
      expired = true;
      onExpire?.();
    }
  }

  return {
    getRemaining(): number {
      return remaining;
    },
    isRunning(): boolean {
      return running;
    },
    isExpired(): boolean {
      return expired;
    },
    start(): void {
      if (running || expired) return;
      running = true;
      intervalId = setInterval(tick, 1000);
    },
    stop(): void {
      if (!running) return;
      stopInternal(false);
    },
    reset(): void {
      stopInternal(false);
      remaining = durationSeconds;
      expired = false;
    },
  };
}

// ---------- Run History ----------

export class RunHistory {
  private scores: number[] = [];

  record(score: number): void {
    this.scores.push(score);
  }

  getStats(): RunStats {
    if (this.scores.length === 0) {
      return { runs: 0, best: null, average: null, last: null };
    }
    const best = Math.max(...this.scores);
    const sum = this.scores.reduce((a, b) => a + b, 0);
    const average = Math.round(sum / this.scores.length);
    const last = this.scores[this.scores.length - 1];
    return {
      runs: this.scores.length,
      best,
      average,
      last,
    };
  }

  getAllResults(): number[] {
    return [...this.scores];
  }

  reset(): void {
    this.scores = [];
  }
}

// ---------- Word Grid Game Controller ----------

export class WordGridGame {
  private grid: LetterGrid;
  private words: string[] = [];
  private score: number = 0;
  private timer: Timer;
  private active: boolean = false;
  private history: RunHistory | null;
  private handledExpire: boolean = false;

  constructor(grid: LetterGrid, history?: RunHistory) {
    this.grid = grid;
    this.history = history ?? null;
    this.timer = createTimer(90, () => {
      this.active = false;
      this.handledExpire = true;
      if (this.history) {
        this.history.record(this.score);
      }
    });
  }

  getGrid(): LetterGrid {
    return this.grid;
  }

  getScore(): number {
    return this.score;
  }

  getWords(): string[] {
    return [...this.words];
  }

  getTimer(): Timer {
    return this.timer;
  }

  isActive(): boolean {
    return this.active;
  }

  start(): void {
    if (this.active || this.timer.isExpired()) return;
    this.active = true;
    this.timer.start();
  }

  submitWord(word: string, path: Position[]): SubmitResult {
    const upper = word.toUpperCase();

    if (upper.length < 3) {
      return { accepted: false, reason: "too-short" };
    }

    if (this.words.includes(upper)) {
      return { accepted: false, reason: "duplicate" };
    }

    if (!isValidAdjacentSelection(path)) {
      return { accepted: false, reason: "not-adjacent" };
    }

    if (path.length !== upper.length) {
      return { accepted: false, reason: "mismatch" };
    }
    for (let i = 0; i < path.length; i++) {
      const cell = getCell(this.grid, path[i].row, path[i].col);
      if (!cell || cell.letter.toUpperCase() !== upper[i]) {
        return { accepted: false, reason: "mismatch" };
      }
    }

    if (!isDictionaryWord(upper)) {
      return { accepted: false, reason: "not-in-dictionary" };
    }

    this.words.push(upper);
    this.score += scoreWord(upper);
    return { accepted: true };
  }

  getResult(): GameResult {
    return {
      score: this.score,
      words: [...this.words],
      timeExpired: this.handledExpire || this.timer.isExpired(),
    };
  }
}
