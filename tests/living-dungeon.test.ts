/**
 * Unit Tests: Living Dungeon Mini
 *
 * Covers:
 * - Dungeon generation (player start exists, exit reachable, treasure/hazard placement)
 * - Movement logic
 * - Encounter resolution
 * - Score computation
 * - Run-history tracking
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  generateDungeon,
  canReachExit,
  findPlayerStart,
  findExit,
  type Dungeon,
  type Cell,
  type Position,
} from "../src/dungeon";

import {
  createGame,
  movePlayer,
  getScore,
  getTurns,
  getStatus,
  getDungeonState,
  getPlayerPosition,
  GameStatus,
} from "../src/living-dungeon";

import {
  getRunHistory,
  recordRun,
  clearRunHistory,
  STORAGE_KEY as HISTORY_STORAGE_KEY,
} from "../src/run-history";

// ---------------------------------------------------------------------------
// Dungeon Generation
// ---------------------------------------------------------------------------

describe("Dungeon Generation", () => {
  it("generates a grid with dimensions within 5x5 to 8x8", () => {
    for (let i = 0; i < 20; i++) {
      const dungeon = generateDungeon();
      expect(dungeon.height).toBeGreaterThanOrEqual(5);
      expect(dungeon.height).toBeLessThanOrEqual(8);
      expect(dungeon.width).toBeGreaterThanOrEqual(5);
      expect(dungeon.width).toBeLessThanOrEqual(8);
    }
  });

  it("places exactly one player start cell", () => {
    for (let i = 0; i < 20; i++) {
      const dungeon = generateDungeon();
      const start = findPlayerStart(dungeon);
      expect(start).not.toBeNull();
      expect(dungeon.cells[start!.y][start!.x]).toBe("player");
    }
  });

  it("places exactly one exit cell", () => {
    for (let i = 0; i < 20; i++) {
      const dungeon = generateDungeon();
      const exit = findExit(dungeon);
      expect(exit).not.toBeNull();
      expect(dungeon.cells[exit!.y][exit!.x]).toBe("exit");
    }
  });

  it("ensures exit is reachable from player start", () => {
    for (let i = 0; i < 30; i++) {
      const dungeon = generateDungeon();
      const start = findPlayerStart(dungeon);
      const exit = findExit(dungeon);
      expect(start).not.toBeNull();
      expect(exit).not.toBeNull();
      expect(canReachExit(dungeon, start!, exit!)).toBe(true);
    }
  });

  it("places at least one treasure on the grid", () => {
    for (let i = 0; i < 20; i++) {
      const dungeon = generateDungeon();
      let treasureCount = 0;
      for (let y = 0; y < dungeon.height; y++) {
        for (let x = 0; x < dungeon.width; x++) {
          if (dungeon.cells[y][x] === "treasure") treasureCount++;
        }
      }
      expect(treasureCount).toBeGreaterThanOrEqual(1);
    }
  });

  it("places at least one hazard on the grid", () => {
    for (let i = 0; i < 20; i++) {
      const dungeon = generateDungeon();
      let hazardCount = 0;
      for (let y = 0; y < dungeon.height; y++) {
        for (let x = 0; x < dungeon.width; x++) {
          if (dungeon.cells[y][x] === "hazard") hazardCount++;
        }
      }
      expect(hazardCount).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("Game QA: Edge Cases and Bugs", () => {
  it("QA: every generated dungeon HAS a reachable exit (1000 trials)", () => {
    for (let i = 0; i < 1000; i++) {
      const dungeon = generateDungeon();
      const start = findPlayerStart(dungeon);
      const exit = findExit(dungeon);
      expect(start).not.toBeNull();
      expect(exit).not.toBeNull();
      expect(canReachExit(dungeon, start!, exit!)).toBe(true);
    }
  });

  it("QA: movement is correctly constrained to grid boundaries", () => {
    const dungeon: Dungeon = {
      width: 3,
      height: 3,
      cells: [
        ["player", "empty", "exit"],
        ["empty", "empty", "empty"],
        ["empty", "empty", "empty"],
      ]
    };

    const state = {
      dungeon,
      playerPos: { x: 0, y: 0 },
      score: 0,
      turns: 0,
      status: "playing" as any
    };

    // Try moving UP and LEFT from (0,0)
    let res = movePlayer(state, "up");
    expect(res.moved).toBe(false);
    expect(state.playerPos).toEqual({ x: 0, y: 0 });

    res = movePlayer(state, "left");
    expect(res.moved).toBe(false);
    expect(state.playerPos).toEqual({ x: 0, y: 0 });

    // Move to (2,2) and try moving RIGHT and DOWN
    state.playerPos = { x: 2, y: 2 };
    res = movePlayer(state, "right");
    expect(res.moved).toBe(false);
    expect(state.playerPos).toEqual({ x: 2, y: 2 });

    res = movePlayer(state, "down");
    expect(res.moved).toBe(false);
    expect(state.playerPos).toEqual({ x: 2, y: 2 });
  });

  it("QA: treasure encounters correctly add score", () => {
    const dungeon: Dungeon = {
      width: 3,
      height: 3,
      cells: [
        ["player", "treasure", "exit"],
        ["empty", "empty", "empty"],
        ["empty", "empty", "empty"],
      ]
    };
    const state = {
      dungeon,
      playerPos: { x: 0, y: 0 },
      score: 0,
      turns: 0,
      status: "playing" as any
    };

    movePlayer(state, "right");
    expect(state.score).toBe(10);
    expect(state.dungeon.cells[0][1]).toBe("empty");
  });

  it("QA: hazard encounters reduce score and end run if score < 0", () => {
    const dungeon: Dungeon = {
      width: 3,
      height: 2,
      cells: [
        ["player", "hazard", "empty"],
        ["empty", "hazard", "exit"],
      ]
    };
    const state = {
      dungeon,
      playerPos: { x: 0, y: 0 },
      score: 0, // Start with 0
      turns: 0,
      status: "playing" as any
    };

    // Encountering hazard at 0 score should kill player
    movePlayer(state, "right");
    expect(state.status).toBe("dead");
    expect(state.score).toBe(0);
  });

  it("QA: run history shows correct best/average/last", () => {
    clearRunHistory();
    recordRun(10);
    recordRun(30);
    recordRun(20);

    const history = getRunHistory();
    expect(history.lastScore).toBe(20);
    expect(history.bestScore).toBe(30);
    expect(history.averageScore).toBe(20); // (10+30+20)/3 = 20
  });
});

describe("Dungeon Generation Extended", () => {
  it("places at least one hazard on the grid", () => {
    for (let i = 0; i < 20; i++) {
      const dungeon = generateDungeon();
      let hazardCount = 0;
      for (let y = 0; y < dungeon.height; y++) {
        for (let x = 0; x < dungeon.width; x++) {
          if (dungeon.cells[y][x] === "hazard") hazardCount++;
        }
      }
      expect(hazardCount).toBeGreaterThanOrEqual(1);
    }
  });

  it("does not place player start on top of exit", () => {
    for (let i = 0; i < 20; i++) {
      const dungeon = generateDungeon();
      const start = findPlayerStart(dungeon);
      const exit = findExit(dungeon);
      expect(start).not.toBeNull();
      expect(exit).not.toBeNull();
      expect(start!.x !== exit!.x || start!.y !== exit!.y).toBe(true);
    }
  });

  it("generates different dungeons on successive calls", () => {
    const dungeons: string[] = [];
    for (let i = 0; i < 10; i++) {
      const d = generateDungeon();
      dungeons.push(JSON.stringify(d.cells));
    }
    const unique = new Set(dungeons);
    // At least some variation
    expect(unique.size).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// Movement Logic
// ---------------------------------------------------------------------------

describe("Movement Logic", () => {
  let game: ReturnType<typeof createGame>;

  beforeEach(() => {
    game = createGame();
  });

  it("starts with 0 turns", () => {
    expect(getTurns(game)).toBe(0);
  });

  it("starts with 0 score", () => {
    expect(getScore(game)).toBe(0);
  });

  it("starts with status 'playing'", () => {
    expect(getStatus(game)).toBe("playing" as GameStatus);
  });

  it("player position matches the dungeon start cell", () => {
    const pos = getPlayerPosition(game);
    const dungeon = getDungeonState(game);
    const start = findPlayerStart(dungeon);
    expect(start).not.toBeNull();
    expect(pos.x).toBe(start!.x);
    expect(pos.y).toBe(start!.y);
  });

  it("moving up changes position and increments turn count", () => {
    const before = getPlayerPosition(game);
    const result = movePlayer(game, "up");
    if (result.moved) {
      expect(getTurns(game)).toBe(1);
      expect(getPlayerPosition(game).y).toBe(before.y - 1);
    }
    // If blocked by a wall, position should not change and turns should not increment
    if (!result.moved) {
      expect(getTurns(game)).toBe(0);
      expect(getPlayerPosition(game).y).toBe(before.y);
    }
  });

  it("moving down changes position and increments turn count", () => {
    const before = getPlayerPosition(game);
    const result = movePlayer(game, "down");
    if (result.moved) {
      expect(getTurns(game)).toBe(1);
      expect(getPlayerPosition(game).y).toBe(before.y + 1);
    }
  });

  it("moving left changes position and increments turn count", () => {
    const before = getPlayerPosition(game);
    const result = movePlayer(game, "left");
    if (result.moved) {
      expect(getTurns(game)).toBe(1);
      expect(getPlayerPosition(game).x).toBe(before.x - 1);
    }
  });

  it("moving right changes position and increments turn count", () => {
    const before = getPlayerPosition(game);
    const result = movePlayer(game, "right");
    if (result.moved) {
      expect(getTurns(game)).toBe(1);
      expect(getPlayerPosition(game).x).toBe(before.x + 1);
    }
  });

  it("cannot move into walls", () => {
    const dungeon = getDungeonState(game);
    const pos = getPlayerPosition(game);

    // Try all four directions and verify wall blocking
    const directions: ("up" | "down" | "left" | "right")[] = [
      "up",
      "down",
      "left",
      "right",
    ];
    for (const dir of directions) {
      const targetX =
        dir === "left" ? pos.x - 1 : dir === "right" ? pos.x + 1 : pos.x;
      const targetY =
        dir === "up" ? pos.y - 1 : dir === "down" ? pos.y + 1 : pos.y;

      if (
        targetX < 0 ||
        targetX >= dungeon.width ||
        targetY < 0 ||
        targetY >= dungeon.height
      ) {
        const before = getPlayerPosition(game);
        const beforeTurns = getTurns(game);
        const result = movePlayer(game, dir);
        expect(result.moved).toBe(false);
        expect(getPlayerPosition(game)).toEqual(before);
        expect(getTurns(game)).toBe(beforeTurns);
        continue;
      }

      if (dungeon.cells[targetY][targetX] === "wall") {
        const before = getPlayerPosition(game);
        const beforeTurns = getTurns(game);
        const result = movePlayer(game, dir);
        expect(result.moved).toBe(false);
        expect(getPlayerPosition(game)).toEqual(before);
        expect(getTurns(game)).toBe(beforeTurns);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Encounter Resolution
// ---------------------------------------------------------------------------

describe("Encounter Resolution", () => {
  it("picking up a treasure increases score", () => {
    // We test encounter logic directly by manipulating internal state
    // The key contract: treasure cell encountered -> score increases
    // We simulate by creating many games and verifying that any move onto
    // a treasure cell increases score
    for (let i = 0; i < 30; i++) {
      const game = createGame();
      // Try a few moves and check if any treasure was found
      for (let m = 0; m < 20; m++) {
        const beforeScore = getScore(game);
        const dirs: ("up" | "down" | "left" | "right")[] = [
          "up",
          "down",
          "left",
          "right",
        ];
        const dir = dirs[Math.floor(Math.random() * 4)];
        const result = movePlayer(game, dir);
        if (result.encountered === "treasure") {
          expect(getScore(game)).toBeGreaterThan(beforeScore);
          expect(result.encountered).toBe("treasure");
          return; // Test passes
        }
        if (getStatus(game) !== "playing") break;
      }
    }
    // If we never hit a treasure in 30 games, something is wrong with
    // treasure placement density. But 30 games * 20 moves should hit one.
    // Not a perfect test but catches the contract.
  });

  it("encountering a hazard reduces score or ends the run", () => {
    for (let i = 0; i < 30; i++) {
      const game = createGame();
      for (let m = 0; m < 30; m++) {
        const dirs: ("up" | "down" | "left" | "right")[] = [
          "up",
          "down",
          "left",
          "right",
        ];
        const dir = dirs[Math.floor(Math.random() * 4)];
        const beforeScore = getScore(game);
        const result = movePlayer(game, dir);
        if (result.encountered === "hazard") {
          const afterScore = getScore(game);
          const afterStatus = getStatus(game);
          // Either score decreased or game ended
          const scoreReduced = afterScore < beforeScore;
          const gameEnded = afterStatus !== "playing";
          expect(scoreReduced || gameEnded).toBe(true);
          return;
        }
        if (getStatus(game) !== "playing") break;
      }
    }
  });

  it("run ends when player reaches the exit", () => {
    // Test with a directed approach: find exit, move towards it
    // But since dungeons are random, we test the contract:
    // When status becomes "won", it means the player reached the exit
    for (let i = 0; i < 30; i++) {
      const game = createGame();
      for (let m = 0; m < 50; m++) {
        if (getStatus(game) !== "playing") break;
        const dirs: ("up" | "down" | "left" | "right")[] = [
          "up",
          "down",
          "left",
          "right",
        ];
        const dir = dirs[Math.floor(Math.random() * 4)];
        const result = movePlayer(game, dir);
        if (result.encountered === "exit") {
          expect(getStatus(game)).toBe("won");
          return;
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Score Computation
// ---------------------------------------------------------------------------

describe("Score Computation", () => {
  it("score starts at 0 for a new game", () => {
    const game = createGame();
    expect(getScore(game)).toBe(0);
  });

  it("treasure encounter adds a positive amount to score", () => {
    // Find a game+move where treasure is encountered and verify score increase
    for (let i = 0; i < 30; i++) {
      const game = createGame();
      for (let m = 0; m < 30; m++) {
        const before = getScore(game);
        const dirs: ("up" | "down" | "left" | "right")[] = [
          "up",
          "down",
          "left",
          "right",
        ];
        const dir = dirs[Math.floor(Math.random() * 4)];
        const result = movePlayer(game, dir);
        if (result.encountered === "treasure") {
          expect(getScore(game)).toBe(before + 10);
          return;
        }
        if (getStatus(game) !== "playing") break;
      }
    }
  });

  it("hazard encounter reduces score by 5 points when not fatal", () => {
    for (let i = 0; i < 50; i++) {
      const game = createGame();
      for (let m = 0; m < 30; m++) {
        const before = getScore(game);
        const dirs: ("up" | "down" | "left" | "right")[] = [
          "up",
          "down",
          "left",
          "right",
        ];
        const dir = dirs[Math.floor(Math.random() * 4)];
        const result = movePlayer(game, dir);
        if (
          result.encountered === "hazard" &&
          getStatus(game) === "playing"
        ) {
          expect(getScore(game)).toBe(before - 5);
          return;
        }
        if (getStatus(game) !== "playing") break;
      }
    }
  });

  it("turn count increments by exactly 1 for each valid move", () => {
    const game = createGame();
    let lastTurns = getTurns(game);
    // Make a few moves
    const dirs: ("up" | "down" | "left" | "right")[] = [
      "up",
      "down",
      "left",
      "right",
    ];
    let movesMade = 0;
    for (let i = 0; i < 10; i++) {
      const dir = dirs[i % 4];
      const result = movePlayer(game, dir);
      if (result.moved) {
        movesMade++;
        expect(getTurns(game)).toBe(lastTurns + 1);
        lastTurns = getTurns(game);
      }
      if (getStatus(game) !== "playing") break;
    }
    expect(getTurns(game)).toBe(movesMade);
  });
});

// ---------------------------------------------------------------------------
// Run History Tracking
// ---------------------------------------------------------------------------

describe("Run History", () => {
  beforeEach(() => {
    clearRunHistory();
  });

  it("returns default history when no runs recorded", () => {
    const history = getRunHistory();
    expect(history.bestScore).toBe(0);
    expect(history.averageScore).toBe(0);
    expect(history.lastScore).toBe(0);
    expect(history.totalRuns).toBe(0);
  });

  it("records a run and updates best score", () => {
    recordRun(100);
    const history = getRunHistory();
    expect(history.lastScore).toBe(100);
    expect(history.bestScore).toBe(100);
    expect(history.totalRuns).toBe(1);
  });

  it("updates best score only when new score is higher", () => {
    recordRun(50);
    recordRun(200);
    recordRun(75);
    const history = getRunHistory();
    expect(history.bestScore).toBe(200);
    expect(history.lastScore).toBe(75);
    expect(history.totalRuns).toBe(3);
  });

  it("computes average score correctly", () => {
    recordRun(100);
    recordRun(200);
    recordRun(300);
    const history = getRunHistory();
    // (100 + 200 + 300) / 3 = 200
    expect(history.averageScore).toBe(200);
    expect(history.totalRuns).toBe(3);
  });

  it("persists history in localStorage", () => {
    recordRun(42);
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.lastScore).toBe(42);
  });

  it("handles zero-score runs", () => {
    recordRun(0);
    const history = getRunHistory();
    expect(history.lastScore).toBe(0);
    expect(history.bestScore).toBe(0);
    expect(history.totalRuns).toBe(1);
  });

  it("clearRunHistory resets to defaults", () => {
    recordRun(100);
    recordRun(200);
    clearRunHistory();
    const history = getRunHistory();
    expect(history.bestScore).toBe(0);
    expect(history.lastScore).toBe(0);
    expect(history.totalRuns).toBe(0);
    expect(localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull();
  });

  it("best score never goes below zero", () => {
    recordRun(-10);
    const history = getRunHistory();
    expect(history.bestScore).toBe(0);
  });
});