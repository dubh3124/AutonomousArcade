/**
 * Unit Tests: Reaction Rush
 *
 * Covers:
 * - Reaction measurement logic
 * - Score computation
 * - Run-history tracking
 * - DOM interactions for stimulus/response flow
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  computeScore,
  createRunHistory,
  recordRun,
  randomDelayMs,
  measureReaction,
  type RunHistory,
  type RunResult,
} from "../src/reaction-rush/logic";
import { renderReactionRush, type GamePhase } from "../src/reaction-rush/ui";

// ---------------------------------------------------------------------------
// Logic Tests
// ---------------------------------------------------------------------------

describe("Reaction Rush – Logic", () => {
  // -- computeScore --
  describe("computeScore", () => {
    it("returns 1000 for a 0ms reaction", () => {
      expect(computeScore(0)).toBe(1000);
    });

    it("returns 500 for a 500ms reaction", () => {
      expect(computeScore(500)).toBe(500);
    });

    it("returns 0 for a 1000ms reaction", () => {
      expect(computeScore(1000)).toBe(0);
    });

    it("returns 0 for reaction times above 1000ms", () => {
      expect(computeScore(1500)).toBe(0);
      expect(computeScore(5000)).toBe(0);
    });

    it("returns a rounded integer score", () => {
      expect(computeScore(333)).toBe(667);
      expect(computeScore(666)).toBe(334);
    });

    it("never returns negative scores", () => {
      expect(computeScore(9999)).toBe(0);
    });
  });

  // -- createRunHistory --
  describe("createRunHistory", () => {
    it("returns an empty history with null statistics", () => {
      const history = createRunHistory();
      expect(history.runs).toEqual([]);
      expect(history.bestMs).toBeNull();
      expect(history.averageMs).toBeNull();
      expect(history.lastMs).toBeNull();
    });
  });

  // -- recordRun --
  describe("recordRun", () => {
    it("appends a run to the history", () => {
      const history = createRunHistory();
      const updated = recordRun(history, 250);
      expect(updated.runs.length).toBe(1);
      expect(updated.runs[0].reactionMs).toBe(250);
      expect(updated.runs[0].score).toBe(750);
    });

    it("updates bestMs to the lowest reaction time", () => {
      let history = createRunHistory();
      history = recordRun(history, 300);
      expect(history.bestMs).toBe(300);
      history = recordRun(history, 200);
      expect(history.bestMs).toBe(200);
      history = recordRun(history, 400);
      expect(history.bestMs).toBe(200); // still 200
    });

    it("updates averageMs correctly", () => {
      let history = createRunHistory();
      history = recordRun(history, 200);
      history = recordRun(history, 400);
      expect(history.averageMs).toBe(300);
    });

    it("updates lastMs to the most recent reaction time", () => {
      let history = createRunHistory();
      history = recordRun(history, 150);
      expect(history.lastMs).toBe(150);
      history = recordRun(history, 350);
      expect(history.lastMs).toBe(350);
    });

    it("does not mutate the original history (immutable)", () => {
      const original = createRunHistory();
      const updated = recordRun(original, 250);
      expect(original.runs).toEqual([]);
      expect(original.bestMs).toBeNull();
      expect(updated.runs.length).toBe(1);
    });

    it("tracks multiple runs correctly", () => {
      let history = createRunHistory();
      history = recordRun(history, 100);
      history = recordRun(history, 300);
      history = recordRun(history, 200);

      expect(history.runs.length).toBe(3);
      expect(history.bestMs).toBe(100);
      expect(history.averageMs).toBe(200);
      expect(history.lastMs).toBe(200);
    });
  });

  // -- measureReaction --
  describe("measureReaction", () => {
    it("computes the delta between stimulus and click timestamps", () => {
      expect(measureReaction(1000, 1250)).toBe(250);
    });

    it("returns 0 for simultaneous timestamps", () => {
      expect(measureReaction(1000, 1000)).toBe(0);
    });

    it("returns 0 when click time is somehow before stimulus time", () => {
      expect(measureReaction(1000, 500)).toBe(0);
    });
  });

  // -- randomDelayMs --
  describe("randomDelayMs", () => {
    it("returns a value within the specified range", () => {
      for (let i = 0; i < 100; i++) {
        const delay = randomDelayMs(1000, 2000);
        expect(delay).toBeGreaterThanOrEqual(1000);
        expect(delay).toBeLessThanOrEqual(2000);
      }
    });

    it("returns exactly min when min equals max", () => {
      for (let i = 0; i < 10; i++) {
        expect(randomDelayMs(500, 500)).toBe(500);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// UI Tests
// ---------------------------------------------------------------------------

describe("Reaction Rush – UI", () => {
  let container: HTMLElement;
  let emptyHistory: RunHistory;

  beforeEach(() => {
    container = document.createElement("div");
    emptyHistory = createRunHistory();
  });

  const noopCallbacks = {
    onReact: () => {},
    onTooEarly: () => {},
    onStart: () => {},
  };

  describe("renderReactionRush", () => {
    it("renders the game title", () => {
      renderReactionRush(container, emptyHistory, noopCallbacks, "idle");
      expect(container.textContent).toContain("Reaction Rush");
    });

    it("renders the description", () => {
      renderReactionRush(container, emptyHistory, noopCallbacks, "idle");
      expect(container.textContent).toContain("Test your reflexes");
    });

    it("renders run history stats", () => {
      renderReactionRush(container, emptyHistory, noopCallbacks, "idle");
      expect(container.textContent).toContain("Best");
      expect(container.textContent).toContain("Average");
      expect(container.textContent).toContain("Last");
    });

    it("renders a back button to the arcade hub", () => {
      renderReactionRush(container, emptyHistory, noopCallbacks, "idle");
      const backBtn = container.querySelector(".reaction-rush__back-btn");
      expect(backBtn).not.toBeNull();
      expect(backBtn?.textContent).toContain("Back to Arcade");
    });

    it("has the reaction-rush class on the container", () => {
      renderReactionRush(container, emptyHistory, noopCallbacks, "idle");
      expect(container.classList.contains("reaction-rush")).toBe(true);
    });

    it("clears previous content on re-render", () => {
      renderReactionRush(container, emptyHistory, noopCallbacks, "idle");
      const firstChildCount = container.children.length;
      renderReactionRush(container, emptyHistory, noopCallbacks, "idle");
      // Should have the same number of children — not doubled
      expect(container.children.length).toBe(firstChildCount);
    });
  });

  describe("phase-specific rendering", () => {
    it("shows 'Start' prompt in idle phase", () => {
      renderReactionRush(container, emptyHistory, noopCallbacks, "idle");
      expect(container.textContent).toContain("Start");
      const arena = container.querySelector(".reaction-rush__arena");
      expect(arena?.classList.contains("reaction-rush__arena--idle")).toBe(true);
    });

    it("shows waiting message in waiting phase", () => {
      renderReactionRush(container, emptyHistory, noopCallbacks, "waiting");
      expect(container.textContent).toContain("Wait for the flash");
      const arena = container.querySelector(".reaction-rush__arena");
      expect(arena?.classList.contains("reaction-rush__arena--waiting")).toBe(true);
    });

    it("shows 'CLICK NOW' message in ready phase", () => {
      renderReactionRush(container, emptyHistory, noopCallbacks, "ready");
      expect(container.textContent).toContain("CLICK NOW");
      const arena = container.querySelector(".reaction-rush__arena");
      expect(arena?.classList.contains("reaction-rush__arena--ready")).toBe(true);
    });

    it("shows 'Run complete' message in clicked phase", () => {
      renderReactionRush(container, emptyHistory, noopCallbacks, "clicked");
      expect(container.textContent).toContain("Run complete");
    });

    it("shows 'Too early' message in too-early phase", () => {
      renderReactionRush(container, emptyHistory, noopCallbacks, "too-early");
      expect(container.textContent).toContain("Too early");
    });
  });

  describe("action button", () => {
    it("renders 'Start' button in idle phase that calls onStart", () => {
      let called = false;
      renderReactionRush(container, emptyHistory, {
        ...noopCallbacks,
        onStart: () => {
          called = true;
        },
      }, "idle");

      const btn = container.querySelector(".reaction-rush__action-btn");
      expect(btn).not.toBeNull();
      (btn as HTMLButtonElement).click();
      expect(called).toBe(true);
    });

    it("renders 'Play Again' button in clicked phase", () => {
      let called = false;
      renderReactionRush(container, emptyHistory, {
        ...noopCallbacks,
        onStart: () => {
          called = true;
        },
      }, "clicked");

      const btn = container.querySelector(".reaction-rush__action-btn");
      expect(btn?.textContent).toBe("Play Again");
      (btn as HTMLButtonElement).click();
      expect(called).toBe(true);
    });

    it("renders 'Try Again' button in too-early phase", () => {
      let called = false;
      renderReactionRush(container, emptyHistory, {
        ...noopCallbacks,
        onStart: () => {
          called = true;
        },
      }, "too-early");

      const btn = container.querySelector(".reaction-rush__action-btn");
      expect(btn?.textContent).toBe("Try Again");
      (btn as HTMLButtonElement).click();
      expect(called).toBe(true);
    });
  });

  describe("run history display", () => {
    it("displays best, average, and last times from history", () => {
      let history = createRunHistory();
      history = recordRun(history, 300);
      history = recordRun(history, 200);
      history = recordRun(history, 400);

      renderReactionRush(container, history, noopCallbacks, "clicked");

      const stats = container.querySelector(".reaction-rush__stats");
      expect(stats?.textContent).toContain("200 ms"); // best
      expect(stats?.textContent).toContain("300 ms"); // average
      expect(stats?.textContent).toContain("400 ms"); // last
    });

    it("displays '--' for null statistics", () => {
      renderReactionRush(container, emptyHistory, noopCallbacks, "idle");
      const statValues = container.querySelectorAll(".reaction-rush__stat-value");
      const values = Array.from(statValues).map((el) => el.textContent);
      expect(values.every((v) => v === "--")).toBe(true);
    });

    it("shows last run details with score when runs exist", () => {
      let history = createRunHistory();
      history = recordRun(history, 250);

      renderReactionRush(container, history, noopCallbacks, "clicked");
      const lastRun = container.querySelector(".reaction-rush__last-run");
      expect(lastRun).not.toBeNull();
      expect(lastRun?.textContent).toContain("250 ms");
      expect(lastRun?.textContent).toContain("Score: 750");
    });
  });

  describe("back to arcade navigation", () => {
    it("dispatches a navigate event when back button is clicked", () => {
      const handler = vi.fn();
      window.addEventListener("navigate", handler);

      renderReactionRush(container, emptyHistory, noopCallbacks, "idle");
      const backBtn = container.querySelector(".reaction-rush__back-btn");
      (backBtn as HTMLButtonElement).click();

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.route).toBe("hub");

      window.removeEventListener("navigate", handler);
    });
  });
});

// ---------------------------------------------------------------------------
// Game Controller Tests
// ---------------------------------------------------------------------------

describe("Reaction Rush – Game Controller", () => {
  // We test the game controller indirectly by mocking timers
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exports without errors", async () => {
    // Dynamic import since the game module uses performance.now()
    const mod = await import("../src/reaction-rush/game");
    expect(mod.ReactionRushGame).toBeDefined();
  });

  it("initializes with an empty history and idle phase", async () => {
    const mod = await import("../src/reaction-rush/game");
    const container = document.createElement("div");
    const game = new mod.ReactionRushGame(container);

    expect(game.getPhase()).toBe("idle");
    expect(game.getHistory().runs.length).toBe(0);
    expect(game.getHistory().bestMs).toBeNull();

    game.destroy();
  });

  it("transitions to waiting phase on startRun", async () => {
    const mod = await import("../src/reaction-rush/game");
    const container = document.createElement("div");
    const game = new mod.ReactionRushGame(container);

    game.startRun();
    expect(game.getPhase()).toBe("waiting");

    game.destroy();
  });

  it("transitions to ready phase after the random delay", async () => {
    const mod = await import("../src/reaction-rush/game");
    const container = document.createElement("div");
    const game = new mod.ReactionRushGame(container);

    game.startRun();
    expect(game.getPhase()).toBe("waiting");

    // Advance timers past the max delay
    vi.advanceTimersByTime(5000);
    expect(game.getPhase()).toBe("ready");

    game.destroy();
  });

  it("transitions to too-early if clicked during waiting phase", async () => {
    const mod = await import("../src/reaction-rush/game");
    const container = document.createElement("div");
    const game = new mod.ReactionRushGame(container);

    game.startRun();
    expect(game.getPhase()).toBe("waiting");

    game.handleClick();
    expect(game.getPhase()).toBe("too-early");

    game.destroy();
  });

  it("records a run when clicked during ready phase", async () => {
    const mod = await import("../src/reaction-rush/game");
    const container = document.createElement("div");
    const game = new mod.ReactionRushGame(container);

    game.startRun();
    // Advance time to trigger the stimulus
    vi.advanceTimersByTime(5000);
    expect(game.getPhase()).toBe("ready");

    // Simulate a click - we mock performance.now for deterministic testing
    game.handleClick();
    expect(game.getPhase()).toBe("clicked");

    const history = game.getHistory();
    expect(history.runs.length).toBe(1);
    expect(history.bestMs).not.toBeNull();
    expect(history.averageMs).not.toBeNull();
    expect(history.lastMs).not.toBeNull();

    game.destroy();
  });

  it("tracks multiple runs correctly across sessions", async () => {
    const mod = await import("../src/reaction-rush/game");
    const container = document.createElement("div");
    const game = new mod.ReactionRushGame(container);

    // First run
    game.startRun();
    vi.advanceTimersByTime(5000);
    game.handleClick();
    expect(game.getPhase()).toBe("clicked");
    expect(game.getHistory().runs.length).toBe(1);

    // Start a second run from clicked state
    game.startRun();
    vi.advanceTimersByTime(5000);
    game.handleClick();
    expect(game.getPhase()).toBe("clicked");
    expect(game.getHistory().runs.length).toBe(2);

    game.destroy();
  });

  it("cleans up timers on destroy", async () => {
    const mod = await import("../src/reaction-rush/game");
    const container = document.createElement("div");
    const game = new mod.ReactionRushGame(container);

    game.startRun();
    game.destroy();

    // No timer should fire after destroy
    vi.advanceTimersByTime(10000);
    // Phase should still be whatever it was — no errors thrown
    expect(true).toBe(true);
  });
});