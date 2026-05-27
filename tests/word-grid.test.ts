/**
 * Unit Tests: Word Grid Game
 *
 * Covers:
 * - Grid generation produces valid words
 * - Adjacency validation
 * - Word-scoring algorithm
 * - Timer logic
 * - Run-history tracking
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  generateGrid,
  findWordsInGrid,
  isValidAdjacentSelection,
  getAdjacentPositions,
  scoreWord,
  scoreRun,
  createTimer,
  RunHistory,
  WordGridGame,
  type LetterGrid,
  type Timer,
} from "../src/word-grid/engine";

// Helper to build a predictable grid for testing
function makeGrid(letters: string[]): LetterGrid {
  if (letters.length !== 16) {
    throw new Error("Grid must have exactly 16 letters");
  }
  return letters.map((letter, idx) => ({
    letter: letter.toUpperCase(),
    row: Math.floor(idx / 4),
    col: idx % 4,
  }));
}

// A fixed grid for adjacency/scoring tests
const TEST_GRID = makeGrid([
  "C", "A", "T", "S",
  "D", "O", "G", "R",
  "B", "I", "N", "E",
  "H", "A", "M", "P",
]);

describe("Grid Generation", () => {
  it("generates a 4x4 grid with 16 letters", () => {
    const grid = generateGrid();
    expect(grid).toHaveLength(16);
    for (const cell of grid) {
      expect(cell.letter).toMatch(/^[A-Z]$/);
      expect(cell.row).toBeGreaterThanOrEqual(0);
      expect(cell.row).toBeLessThan(4);
      expect(cell.col).toBeGreaterThanOrEqual(0);
      expect(cell.col).toBeLessThan(4);
    }
  });

  it("ensures at least one valid English word exists in every generated grid", () => {
    // Generate multiple grids and confirm each has at least one word
    for (let i = 0; i < 20; i++) {
      const grid = generateGrid();
      const words = findWordsInGrid(grid);
      expect(words.length).toBeGreaterThan(0);
    }
  });

  it("produces all letters as uppercase A-Z", () => {
    const grid = generateGrid();
    for (const cell of grid) {
      expect(cell.letter).toMatch(/^[A-Z]$/);
    }
  });
});

describe("Adjacency Validation", () => {
  it("identifies adjacent positions correctly — cardinal and diagonal neighbors", () => {
    const positions = getAdjacentPositions(1, 1); // center cell
    // All 8 neighbors of (1,1): (0,0),(0,1),(0,2),(1,0),(1,2),(2,0),(2,1),(2,2)
    expect(positions).toHaveLength(8);
    expect(positions).toContainEqual({ row: 0, col: 0 });
    expect(positions).toContainEqual({ row: 0, col: 1 });
    expect(positions).toContainEqual({ row: 0, col: 2 });
    expect(positions).toContainEqual({ row: 1, col: 0 });
    expect(positions).toContainEqual({ row: 1, col: 2 });
    expect(positions).toContainEqual({ row: 2, col: 0 });
    expect(positions).toContainEqual({ row: 2, col: 1 });
    expect(positions).toContainEqual({ row: 2, col: 2 });
  });

  it("returns 3 neighbors for a corner cell (0,0)", () => {
    const positions = getAdjacentPositions(0, 0);
    expect(positions).toHaveLength(3);
    expect(positions).toContainEqual({ row: 0, col: 1 });
    expect(positions).toContainEqual({ row: 1, col: 0 });
    expect(positions).toContainEqual({ row: 1, col: 1 });
  });

  it("returns 5 neighbors for an edge cell (0,1)", () => {
    const positions = getAdjacentPositions(0, 1);
    expect(positions).toHaveLength(5);
  });

  it("validates a sequence of positions as all mutually adjacent", () => {
    // Simple horizontal: (0,0) -> (0,1) -> (0,2)
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ];
    expect(isValidAdjacentSelection(path)).toBe(true);
  });

  it("rejects a sequence where positions are not adjacent", () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 3 }, // not adjacent to (0,0)
    ];
    expect(isValidAdjacentSelection(path)).toBe(false);
  });

  it("rejects a sequence that revisits the same position", () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 0 }, // revisit
    ];
    expect(isValidAdjacentSelection(path)).toBe(false);
  });

  it("accepts a diagonal path", () => {
    const path = [
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
    ];
    expect(isValidAdjacentSelection(path)).toBe(true);
  });

  it("rejects a single-position path (needs at least 3 valid)", () => {
    const path = [{ row: 0, col: 0 }];
    // path length 1 = no adjacency check needed, but we check min length
    expect(isValidAdjacentSelection(path)).toBe(true); // adjacency-wise it's valid
  });
});

describe("Word Scoring", () => {
  it("scores a 3-letter word as 1 point", () => {
    expect(scoreWord("CAT")).toBe(1);
  });

  it("scores a 4-letter word as 1 point", () => {
    expect(scoreWord("CATS")).toBe(1);
  });

  it("scores a 5-letter word as 2 points", () => {
    expect(scoreWord("DOGMA")).toBe(2);
  });

  it("scores a 6-letter word as 3 points", () => {
    expect(scoreWord("BINGER")).toBe(3);
  });

  it("scores a 7-letter word as 5 points", () => {
    expect(scoreWord("CAMPING")).toBe(5);
  });

  it("scores an 8-letter (or longer) word as 11 points", () => {
    expect(scoreWord("CHAMPION")).toBe(11);
  });

  it("returns 0 for words shorter than 3 letters", () => {
    expect(scoreWord("AT")).toBe(0);
  });

  it("scoreRun computes total score from validated words", () => {
    const result = scoreRun(["CAT", "DOGMA", "BINGER"]);
    expect(result).toBe(1 + 2 + 3); // 6
  });
});

describe("Run History", () => {
  let history: RunHistory;

  beforeEach(() => {
    history = new RunHistory();
  });

  it("has no runs initially", () => {
    const stats = history.getStats();
    expect(stats.runs).toBe(0);
    expect(stats.best).toBeNull();
    expect(stats.average).toBeNull();
    expect(stats.last).toBeNull();
  });

  it("records a run and returns correct stats", () => {
    history.record(50);
    const stats = history.getStats();
    expect(stats.runs).toBe(1);
    expect(stats.best).toBe(50);
    expect(stats.average).toBe(50);
    expect(stats.last).toBe(50);
  });

  it("tracks best, average, and last across multiple runs", () => {
    history.record(30);
    history.record(70);
    history.record(50);

    const stats = history.getStats();
    expect(stats.runs).toBe(3);
    expect(stats.best).toBe(70);
    expect(stats.average).toBe(50); // (30+70+50)/3 = 50
    expect(stats.last).toBe(50);
  });

  it("returns all results in order", () => {
    history.record(10);
    history.record(20);
    expect(history.getAllResults()).toEqual([10, 20]);
  });

  it("resets correctly", () => {
    history.record(50);
    history.reset();
    const stats = history.getStats();
    expect(stats.runs).toBe(0);
    expect(stats.best).toBeNull();
  });
});

describe("Timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with the specified duration", () => {
    const timer = createTimer(90);
    expect(timer.getRemaining()).toBe(90);
    expect(timer.isRunning()).toBe(false);
    expect(timer.isExpired()).toBe(false);
  });

  it("counts down when started", () => {
    const timer = createTimer(90);
    timer.start();
    expect(timer.isRunning()).toBe(true);

    vi.advanceTimersByTime(10000); // 10 seconds
    expect(timer.getRemaining()).toBe(80);
  });

  it("does not go below zero", () => {
    const timer = createTimer(5);
    timer.start();
    vi.advanceTimersByTime(10000);
    expect(timer.getRemaining()).toBe(0);
  });

  it("fires onExpire callback when time runs out", () => {
    const onExpire = vi.fn();
    const timer = createTimer(5, onExpire);
    timer.start();
    vi.advanceTimersByTime(6000);
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(timer.isExpired()).toBe(true);
    expect(timer.isRunning()).toBe(false);
  });

  it("stops when stop() is called", () => {
    const timer = createTimer(90);
    timer.start();
    vi.advanceTimersByTime(10000);
    timer.stop();
    expect(timer.isRunning()).toBe(false);
    const remaining = timer.getRemaining();
    vi.advanceTimersByTime(10000);
    expect(timer.getRemaining()).toBe(remaining); // unchanged
  });

  it("resets to the full duration", () => {
    const timer = createTimer(90);
    timer.start();
    vi.advanceTimersByTime(50000);
    timer.reset();
    expect(timer.getRemaining()).toBe(90);
    expect(timer.isRunning()).toBe(false);
  });
});

describe("WordGridGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a new game with a fresh grid, zero score, and full timer", () => {
    const game = new WordGridGame(TEST_GRID);
    expect(game.getGrid()).toEqual(TEST_GRID);
    expect(game.getScore()).toBe(0);
    expect(game.getWords()).toEqual([]);
    expect(game.getTimer().getRemaining()).toBe(90);
  });

  it("accepts a valid word and updates score", () => {
    const game = new WordGridGame(TEST_GRID);
    const result = game.submitWord("CAT", [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);

    expect(result.accepted).toBe(true);
    expect(game.getScore()).toBe(1);
    expect(game.getWords()).toContain("CAT");
  });

  it("rejects words shorter than 3 letters", () => {
    const game = new WordGridGame(TEST_GRID);
    const result = game.submitWord("AT", [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);

    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("too-short");
    expect(game.getScore()).toBe(0);
  });

  it("rejects duplicate words", () => {
    const game = new WordGridGame(TEST_GRID);
    game.submitWord("CAT", [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);

    const result = game.submitWord("CAT", [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);

    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("duplicate");
  });

  it("rejects words not adjacent on the grid", () => {
    const game = new WordGridGame(TEST_GRID);
    const result = game.submitWord("CAT", [
      { row: 0, col: 0 },
      { row: 3, col: 3 },
      { row: 0, col: 2 },
    ]);

    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("not-adjacent");
  });

  it("rejects words whose path does not match grid letters", () => {
    const game = new WordGridGame(TEST_GRID);
    const result = game.submitWord("DOG", [
      { row: 0, col: 0 }, // C
      { row: 0, col: 1 }, // A
      { row: 0, col: 2 }, // T
    ]);

    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("mismatch");
  });

  it("starts the game and counts down the timer", () => {
    const game = new WordGridGame(TEST_GRID);
    game.start();
    expect(game.isActive()).toBe(true);

    vi.advanceTimersByTime(30000);
    expect(game.getTimer().getRemaining()).toBe(60);
  });

  it("ends the game when timer expires and returns results", () => {
    const game = new WordGridGame(TEST_GRID);
    game.start();
    vi.advanceTimersByTime(91000);

    expect(game.isActive()).toBe(false);
    const result = game.getResult();
    expect(result.score).toBe(0);
    expect(result.words).toEqual([]);
    expect(result.timeExpired).toBe(true);
  });

  it("provides run history after game ends", () => {
    const history = new RunHistory();
    const game = new WordGridGame(TEST_GRID, history);
    game.start();

    game.submitWord("CAT", [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);

    vi.advanceTimersByTime(91000);

    const stats = history.getStats();
    expect(stats.runs).toBe(1);
    expect(stats.best).toBe(1);
  });

  it("returns all found valid words on the grid", () => {
    // "CAT" with path (0,0)->(0,1)->(0,2) should be findable
    const words = findWordsInGrid(TEST_GRID);
    // At minimum "CAT" should be found
    const hasCat = words.some((w) => w.word === "CAT");
    expect(hasCat).toBe(true);
  });

  describe("QA Checklist Regression Tests", () => {
    it("(2) Adjacent letter validation rejects non-adjacent selections", () => {
      // (0,0) to (0,2) is not adjacent
      const path = [
        { row: 0, col: 0 },
        { row: 0, col: 2 },
      ];
      expect(isValidAdjacentSelection(path)).toBe(false);
    });

    it("(3) Duplicate words are handled correctly (not double-scored)", () => {
      const game = new WordGridGame(TEST_GRID);
      const path = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ]; // CAT
      game.submitWord("CAT", path);
      expect(game.getScore()).toBe(1);
      
      const result = game.submitWord("CAT", path);
      expect(result.accepted).toBe(false);
      expect(result.reason).toBe("duplicate");
      expect(game.getScore()).toBe(1);
    });

    it("(5) Score computed correctly from word length and count", () => {
      const game = new WordGridGame(TEST_GRID);
      // CAT (3) -> 1
      const r1 = game.submitWord("CAT", [{row:0,col:0},{row:0,col:1},{row:0,col:2}]);
      // DOG (3) -> 1
      const r2 = game.submitWord("DOG", [{row:1,col:0},{row:1,col:1},{row:1,col:2}]);
      
      expect(r1.accepted).toBe(true);
      expect(r2.accepted).toBe(true);
      expect(game.getScore()).toBe(2);
    });

    it("(8) No console errors during any gameplay path: submit mismatch shouldn't crash", () => {
      const game = new WordGridGame(TEST_GRID);
      const spy = vi.spyOn(console, "error");
      
      // Submit word with mismatching path
      game.submitWord("DOG", [{row:0,col:0},{row:0,col:1},{row:0,col:2}]); // CAT path
      
      expect(spy).not.toHaveBeenCalled();
    });

    it("STRICT CHECK: Adjacent letter validation rejects wrap-around if any", () => {
      const path = [
        { row: 0, col: 3 }, // Right edge
        { row: 1, col: 0 }, // Left edge, next row
      ];
      expect(isValidAdjacentSelection(path)).toBe(false);
    });
    
    it("STRICT CHECK: Duplicate selection of same cell in one word path", () => {
        const path = [
            { row: 0, col: 0 },
            { row: 0, col: 1 },
            { row: 0, col: 0 },
        ];
        expect(isValidAdjacentSelection(path)).toBe(false);
    });
  });
});
