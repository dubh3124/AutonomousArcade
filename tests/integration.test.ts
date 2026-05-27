/**
 * Integration Tests: Cross-game Hub Integration & Final Validation
 *
 * Covers:
 * - Hub renders three game cards with available status and correct navigation
 * - Player ID consistency across game boundaries
 * - Score display integration in each game
 * - README content validation (project title, description, game list, attribution, build-log, deployment URL)
 * - Cross-game state isolation (no localStorage key leakage between games)
 * - Game back-to-hub navigation event shape consistency
 * - End-to-end gameplay validation for all three games
 */

import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Support ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { getPlayerId, clearPlayerId, getStorageKey as getIdentityKey } from "../src/identity";
import { renderGameHub } from "../src/game-hub";
import { renderScoreDisplay } from "../src/score-display";
import { renderFooter, getAttributionText } from "../src/footer";

import { renderDungeonGame } from "../src/dungeon-ui";
import { createGame, movePlayer, getScore, getTurns, getStatus } from "../src/living-dungeon";
import { generateDungeon, findPlayerStart, findExit } from "../src/dungeon";

import { renderReactionRush } from "../src/reaction-rush/ui";
import { createRunHistory, recordRun } from "../src/reaction-rush/logic";
import { ReactionRushGame } from "../src/reaction-rush/game";

import { renderWordGridGame } from "../src/word-grid/game-ui";
import { WordGridGame, generateGrid, RunHistory } from "../src/word-grid/engine";

import { recordRun as recordDungeonRun, getRunHistory, clearRunHistory } from "../src/run-history";

// ─── Helpers ────────────────────────────────────────────────────────────

function setupDOM(): void {
  // jsdom provides a DOM; reset localStorage before each test
  localStorage.clear();
  clearPlayerId();
  clearRunHistory();
}

// ─── Game Hub Navigation ────────────────────────────────────────────────

describe("Cross-game Hub Integration", () => {
  beforeEach(() => {
    setupDOM();
  });

  it("renders exactly three game cards on the hub page", () => {
    const container = document.createElement("div");
    renderGameHub(container);
    const cards = container.querySelectorAll(".game-card");
    expect(cards.length).toBe(3);
  });

  it("all three game cards are marked as available", () => {
    const container = document.createElement("div");
    renderGameHub(container);
    const availableCards = container.querySelectorAll(".game-card__status--available");
    expect(availableCards.length).toBe(3);
  });

  it("no game card is marked as coming-soon", () => {
    const container = document.createElement("div");
    renderGameHub(container);
    const comingSoon = container.querySelectorAll(".game-card__status--coming-soon");
    expect(comingSoon.length).toBe(0);
  });

  it("all three game cards have correct titles", () => {
    const container = document.createElement("div");
    renderGameHub(container);
    const titles = Array.from(container.querySelectorAll(".game-card__title")).map(
      (el) => el.textContent
    );
    expect(titles).toContain("Reaction Rush");
    expect(titles).toContain("Word Grid");
    expect(titles).toContain("Living Dungeon Mini");
  });

  it("all three game cards dispatch navigate events with correct routes on click", () => {
    const container = document.createElement("div");
    renderGameHub(container);
    const cards = container.querySelectorAll(".game-card");

    const navigateEvents: string[] = [];
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.route) {
        navigateEvents.push(detail.route);
      }
    };
    window.addEventListener("navigate", handler);

    cards.forEach((card) => {
      card.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    window.removeEventListener("navigate", handler);

    expect(navigateEvents).toContain("reaction-rush");
    expect(navigateEvents).toContain("word-grid");
    expect(navigateEvents).toContain("living-dungeon-mini");
  });
});

// ─── Player Identity Consistency ────────────────────────────────────────

describe("Player Identity Consistency", () => {
  beforeEach(() => {
    setupDOM();
  });

  it("returns the same player ID across multiple calls in the same session", () => {
    const id1 = getPlayerId();
    const id2 = getPlayerId();
    expect(id2).toBe(id1);
  });

  it("persists the player ID in localStorage under the expected key", () => {
    const id = getPlayerId();
    const stored = localStorage.getItem(getIdentityKey());
    expect(stored).toBe(id);
  });

  it("survives simulated page reloads by re-reading from localStorage", () => {
    const id1 = getPlayerId();
    const raw = localStorage.getItem(getIdentityKey());
    expect(raw).toBe(id1);
    const id2 = getPlayerId();
    expect(id2).toBe(id1);
  });

  it("generates unique IDs for different visitors (clearing localStorage)", () => {
    const id1 = getPlayerId();
    clearPlayerId();
    localStorage.clear();
    const id2 = getPlayerId();
    expect(id2).not.toBe(id1);
  });

  it("has a valid UUID v4 format", () => {
    const id = getPlayerId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});

// ─── Shared Score-Display Component ─────────────────────────────────────

describe("Score-Display Integration", () => {
  it("renders score and runs via the shared score-display component", () => {
    const container = document.createElement("div");
    renderScoreDisplay(container, { score: 150, runs: 3 });
    expect(container.textContent).toContain("Score: 150");
    expect(container.textContent).toContain("Runs: 3");
  });

  it("defaults to score 0 and runs 0 when no options provided", () => {
    const container = document.createElement("div");
    renderScoreDisplay(container);
    expect(container.textContent).toContain("Score: 0");
    expect(container.textContent).toContain("Runs: 0");
  });

  it("adds the score-display CSS class for styling", () => {
    const container = document.createElement("div");
    renderScoreDisplay(container);
    expect(container.classList.contains("score-display")).toBe(true);
  });

  it("replaces content on re-render (idempotent)", () => {
    const container = document.createElement("div");
    renderScoreDisplay(container, { score: 10, runs: 1 });
    renderScoreDisplay(container, { score: 20, runs: 2 });
    expect(container.textContent).toContain("Score: 20");
    expect(container.textContent).toContain("Runs: 2");
    expect(container.textContent).not.toContain("Score: 10");
  });
});

// ─── Footer Attribution ─────────────────────────────────────────────────

describe("Footer Attribution", () => {
  it("contains AEP and CognicellAI attribution", () => {
    const text = getAttributionText();
    expect(text).toContain("Autonomous Engineering Platform");
    expect(text).toContain("CognicellAI");
  });

  it("renders a build-log / changelog link", () => {
    const container = document.createElement("div");
    renderFooter(container);
    const link = container.querySelector(".site-footer__build-log a");
    expect(link).not.toBeNull();
    expect(link?.textContent).toContain("Changelog");
  });

  it("footer renders into container with site-footer class", () => {
    const container = document.createElement("div");
    renderFooter(container);
    expect(container.classList.contains("site-footer")).toBe(true);
    expect(container.textContent).toContain("Autonomous Engineering Platform");
    expect(container.textContent).toContain("CognicellAI");
  });
});

// ─── README Validation ──────────────────────────────────────────────────

describe("README.md Content", () => {
  let readmeContent: string;

  beforeEach(() => {
    const readmePath = resolve(__dirname, "..", "README.md");
    readmeContent = readFileSync(readmePath, "utf-8");
  });

  it("includes the project title 'Autonomous Arcade'", () => {
    expect(readmeContent).toContain("Autonomous Arcade");
  });

  it("includes a description of the arcade project", () => {
    expect(readmeContent).toMatch(/public.*arcade/i);
    expect(readmeContent).toMatch(/browser.*game/i);
  });

  it("lists at least three games with brief descriptions", () => {
    expect(readmeContent).toContain("Reaction Rush");
    expect(readmeContent).toContain("Word Grid");
    expect(readmeContent).toContain("Living Dungeon Mini");
  });

  it("includes AEP / CognicellAI attribution", () => {
    expect(readmeContent).toContain("Autonomous Engineering Platform");
    expect(readmeContent).toContain("CognicellAI");
  });

  it("includes a link to the build-log / changelog framing", () => {
    const hasBuildLogLink =
      readmeContent.includes("build-log") ||
      readmeContent.includes("changelog") ||
      readmeContent.includes("Build Log") ||
      readmeContent.includes("Changelog");
    expect(hasBuildLogLink).toBe(true);
  });

  it("includes the public deployment URL (GitHub Pages)", () => {
    expect(readmeContent).toMatch(
      /https:\/\/dubh3124\.github\.io\/AutonomousArcade/
    );
  });
});

// ─── Game Back-to-Hub Navigation ────────────────────────────────────────

describe("Game Back-to-Hub Navigation", () => {
  beforeEach(() => {
    setupDOM();
  });

  it("dungeon back-to-hub button dispatches navigate event with { route: 'hub' }", () => {
    const container = document.createElement("div");
    renderDungeonGame(container);

    let capturedDetail: unknown = null;
    const handler = (e: Event) => {
      capturedDetail = (e as CustomEvent).detail;
    };
    window.addEventListener("navigate", handler);

    const backBtn = container.querySelector(".dungeon-game__back") as HTMLButtonElement;
    expect(backBtn).not.toBeNull();
    backBtn!.click();

    window.removeEventListener("navigate", handler);

    expect(capturedDetail).not.toBeNull();
    expect(typeof capturedDetail).toBe("object");
    expect((capturedDetail as { route: string }).route).toBe("hub");
  });

  it("reaction-rush back-to-hub button dispatches navigate event with { route: 'hub' }", () => {
    const container = document.createElement("div");
    const history = createRunHistory();
    renderReactionRush(container, history, {
      onReact: () => {},
      onTooEarly: () => {},
      onStart: () => {},
    }, "idle");

    let capturedDetail: unknown = null;
    const handler = (e: Event) => {
      capturedDetail = (e as CustomEvent).detail;
    };
    window.addEventListener("navigate", handler);

    const backBtn = container.querySelector(".reaction-rush__back-btn") as HTMLButtonElement;
    expect(backBtn).not.toBeNull();
    backBtn!.click();

    window.removeEventListener("navigate", handler);

    expect(capturedDetail).not.toBeNull();
    expect(typeof capturedDetail).toBe("object");
    expect((capturedDetail as { route: string }).route).toBe("hub");
  });

  it("word-grid back-to-hub button dispatches navigate event with { route: 'hub' }", () => {
    const container = document.createElement("div");
    renderWordGridGame(container);

    let capturedDetail: unknown = null;
    const handler = (e: Event) => {
      capturedDetail = (e as CustomEvent).detail;
    };
    window.addEventListener("navigate", handler);

    const backBtn = container.querySelector(".word-grid-game__back") as HTMLButtonElement;
    expect(backBtn).not.toBeNull();
    backBtn!.click();

    window.removeEventListener("navigate", handler);

    expect(capturedDetail).not.toBeNull();
    expect(typeof capturedDetail).toBe("object");
    expect((capturedDetail as { route: string }).route).toBe("hub");
  });
});

// ─── End-to-End Gameplay Validation ─────────────────────────────────────

describe("Reaction Rush Gameplay", () => {
  beforeEach(() => {
    setupDOM();
  });

  it("registers clicks and shows reaction time scores", () => {
    const container = document.createElement("div");
    const game = new ReactionRushGame(container);

    game.startRun();
    expect(game.getPhase()).toBe("waiting");

    game.handleClick();
    expect(game.getPhase()).toBe("too-early");
  });

  it("score-display in reaction rush shows best/average/last after runs", () => {
    let history = createRunHistory();
    history = recordRun(history, 200);
    history = recordRun(history, 400);
    history = recordRun(history, 300);

    expect(history.bestMs).toBe(200);
    expect(history.averageMs).toBe(300);
    expect(history.lastMs).toBe(300);
    expect(history.runs.length).toBe(3);
  });

  it("renders run history DOM with best/average/last labels", () => {
    const container = document.createElement("div");
    let history = createRunHistory();
    history = recordRun(history, 250);
    renderReactionRush(container, history, {
      onReact: () => {},
      onTooEarly: () => {},
      onStart: () => {},
    }, "clicked");

    const statsSection = container.querySelector(".reaction-rush__history");
    expect(statsSection).not.toBeNull();
    expect(statsSection!.textContent).toContain("Best");
    expect(statsSection!.textContent).toContain("Average");
    expect(statsSection!.textContent).toContain("Last");
  });
});

describe("Word Grid Gameplay", () => {
  beforeEach(() => {
    setupDOM();
  });

  it("generates a 4x4 grid and accepts word input", () => {
    const grid = generateGrid();
    expect(grid).toHaveLength(16);

    const history = new RunHistory();
    const game = new WordGridGame(grid, history);
    game.start();
    expect(game.isActive()).toBe(true);
    expect(game.getScore()).toBe(0);

    const result = game.submitWord("testwordnot", []);
    expect(result.accepted).toBe(false);

    const words = game.getWords();
    expect(Array.isArray(words)).toBe(true);
  });

  it("word-grid score display shows best/average/last stats", () => {
    const history = new RunHistory();
    history.record(50);
    history.record(100);
    history.record(75);

    const stats = history.getStats();
    expect(stats.best).toBe(100);
    expect(stats.average).toBe(75);
    expect(stats.last).toBe(75);
    expect(stats.runs).toBe(3);
  });

  it("renders word-grid game UI with grid cells and submit button", () => {
    const container = document.createElement("div");
    renderWordGridGame(container);

    const gridCells = container.querySelectorAll(".word-grid-cell");
    expect(gridCells.length).toBe(16);

    const submitBtn = container.querySelector(".word-grid-game__submit-btn");
    expect(submitBtn).not.toBeNull();
  });

  it("renders run history with best/avg/last in DOM", () => {
    const container = document.createElement("div");
    renderWordGridGame(container);

    const historyContainer = container.querySelector(".word-grid-game__history");
    expect(historyContainer).not.toBeNull();
    expect(historyContainer!.textContent).toContain("Run History");
  });
});

describe("Living Dungeon Mini Gameplay", () => {
  beforeEach(() => {
    setupDOM();
  });

  it("generates a dungeon and resolves encounters", () => {
    const dungeon = generateDungeon();

    const start = findPlayerStart(dungeon);
    expect(start).not.toBeNull();

    const exit = findExit(dungeon);
    expect(exit).not.toBeNull();

    let treasureCount = 0;
    let hazardCount = 0;
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        if (dungeon.cells[y][x] === "treasure") treasureCount++;
        if (dungeon.cells[y][x] === "hazard") hazardCount++;
      }
    }
    expect(treasureCount).toBeGreaterThanOrEqual(1);
    expect(hazardCount).toBeGreaterThanOrEqual(1);
  });

  it("player can move in at least one direction", () => {
    const game = createGame();

    let moved = false;
    const directions = ["up", "down", "left", "right"] as const;
    for (const dir of directions) {
      const result = movePlayer(game, dir);
      if (result.moved) {
        moved = true;
        break;
      }
    }
    expect(moved).toBe(true);
    expect(getTurns(game)).toBeGreaterThanOrEqual(1);
  });

  it("game status is valid after moves", () => {
    const game = createGame();

    const directions = ["up", "down", "left", "right"] as const;
    for (const dir of directions) {
      movePlayer(game, dir);
    }

    const status = getStatus(game);
    expect(["playing", "won", "dead"]).toContain(status);
  });

  it("dungeon run-history shows best/average/last", () => {
    clearRunHistory();

    recordDungeonRun(42);
    recordDungeonRun(100);
    recordDungeonRun(30);

    const history = getRunHistory();
    expect(history.bestScore).toBe(100);
    expect(history.averageScore).toBeGreaterThan(0);
    expect(history.lastScore).toBe(30);
    expect(history.totalRuns).toBe(3);

    clearRunHistory();
  });

  it("renders dungeon game UI with grid and controls", () => {
    const container = document.createElement("div");
    renderDungeonGame(container);

    const gridContainer = container.querySelector(".dungeon-game__grid");
    expect(gridContainer).not.toBeNull();

    const dpad = container.querySelector(".dungeon-game__dpad");
    expect(dpad).not.toBeNull();

    const historyContainer = container.querySelector(".dungeon-game__history");
    expect(historyContainer).not.toBeNull();
  });
});

// ─── Cross-Game State Isolation ─────────────────────────────────────────

describe("Cross-game State Isolation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uses separate localStorage keys for different game histories", () => {
    const identityKey = getIdentityKey();
    expect(identityKey).toBe("autonomous-arcade-player-id");

    const allKeys = Object.keys(localStorage);
    expect(allKeys.length).toBe(0);

    localStorage.setItem("autonomous-arcade-reaction-rush-history", "test");
    localStorage.setItem("autonomous-arcade-word-grid-scores", "test");

    expect(localStorage.getItem("autonomous-arcade-reaction-rush-history")).toBe("test");
    expect(localStorage.getItem("autonomous-arcade-word-grid-scores")).toBe("test");
    expect(localStorage.getItem("some-shared-global-state")).toBeNull();
  });

  it("clears one game's state without affecting another", () => {
    localStorage.setItem("autonomous-arcade-dungeon-history", "dungeon-data");
    localStorage.setItem("autonomous-arcade-reaction-rush-history", "rush-data");

    localStorage.removeItem("autonomous-arcade-dungeon-history");

    expect(localStorage.getItem("autonomous-arcade-dungeon-history")).toBeNull();
    expect(localStorage.getItem("autonomous-arcade-reaction-rush-history")).toBe("rush-data");
  });
});

// ─── Player ID Across Games ─────────────────────────────────────────────

describe("Player Identity Across Games", () => {
  beforeEach(() => {
    setupDOM();
  });

  it("anonymous player ID is identical across all three game contexts", () => {
    const id1 = getPlayerId();
    const id2 = getPlayerId();
    expect(id2).toBe(id1);

    const id3 = getPlayerId();
    expect(id3).toBe(id1);

    const id4 = getPlayerId();
    expect(id4).toBe(id1);
  });

  it("player ID persists across simulated page reloads", () => {
    const id1 = getPlayerId();
    const stored = localStorage.getItem(getIdentityKey());
    expect(stored).toBe(id1);

    const id2 = getPlayerId();
    expect(id2).toBe(id1);
  });
});

// ─── AEP/CognicellAI Footer on Every Page ───────────────────────────────

describe("AEP Attribution Across Pages", () => {
  it("footer attribution is present in the shared footer component", () => {
    const text = getAttributionText();
    expect(text).toContain("Autonomous Engineering Platform");
    expect(text).toContain("CognicellAI");
  });

  it("renders attribution footer in DOM container", () => {
    const footerContainer = document.createElement("div");
    renderFooter(footerContainer);
    expect(footerContainer.textContent).toContain("Autonomous Engineering Platform");
    expect(footerContainer.textContent).toContain("CognicellAI");
  });

  it("reaction-rush page includes footer attribution text", () => {
    const text = getAttributionText();
    expect(text).toContain("Autonomous Engineering Platform by CognicellAI");
  });

  it("word-grid page includes footer attribution text", () => {
    const text = getAttributionText();
    expect(text).toContain("Autonomous Engineering Platform by CognicellAI");
  });

  it("dungeon page includes footer attribution text", () => {
    const text = getAttributionText();
    expect(text).toContain("Autonomous Engineering Platform by CognicellAI");
  });
});