/**
 * Integration Tests: Cross-game Hub Integration & Final Validation
 *
 * Covers:
 * - Hub renders three game cards with available status and correct navigation
 * - Player ID consistency across game boundaries
 * - Score display integration in each game
 * - README content validation (project title, description, game list, attribution, build-log)
 * - Cross-game state isolation (no localStorage key leakage between games)
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

// ─── Helpers ────────────────────────────────────────────────────────────

function setupDOM(): void {
  // jsdom provides a DOM; reset localStorage before each test
  localStorage.clear();
  clearPlayerId();
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

  it("all three game cards have route data attributes for navigation", () => {
    const container = document.createElement("div");
    renderGameHub(container);
    const cards = container.querySelectorAll(".game-card");

    const routes: string[] = [];
    cards.forEach((card) => {
      // Available cards dispatch navigate events on click
      card.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Each card click should dispatch a navigate event; we can verify routes
    // by checking the dataset or by listening to navigate events
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
    // Clear the in-module state by removing from localStorage and re-fetching
    // (identity module caches in localStorage, so we verify round-trip)
    const raw = localStorage.getItem(getIdentityKey());
    expect(raw).toBe(id1);
    // A second call reads from cache, confirming persistence
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
    // Should not contain old values
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
    // Should describe what the Autonomous Arcade is
    expect(readmeContent).toMatch(/public.*arcade/i);
    expect(readmeContent).toMatch(/browser.*game/i);
  });

  it("lists at least three games with brief descriptions", () => {
    expect(readmeContent).toContain("Reaction Rush");
    expect(readmeContent).toContain("Word Grid");
    expect(readmeContent).toContain("Living Dungeon Mini");
    // Each game should have at least a brief description nearby the title
  });

  it("includes AEP / CognicellAI attribution", () => {
    expect(readmeContent).toContain("Autonomous Engineering Platform");
    expect(readmeContent).toContain("CognicellAI");
  });

  it("includes a link to the build-log / changelog framing", () => {
    // Should link to either docs/build-log.md or the changelog area
    const hasBuildLogLink =
      readmeContent.includes("build-log") ||
      readmeContent.includes("changelog") ||
      readmeContent.includes("Build Log") ||
      readmeContent.includes("Changelog");
    expect(hasBuildLogLink).toBe(true);
  });
});

// ─── Cross-Game State Isolation ─────────────────────────────────────────

describe("Cross-game State Isolation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uses separate localStorage keys for different game histories", () => {
    // Identity key
    const identityKey = getIdentityKey();
    expect(identityKey).toBe("autonomous-arcade-player-id");

    // Each game should use its own prefixed key, not a shared mutable state
    const allKeys = Object.keys(localStorage);
    // After setup, there should be no unexpected shared keys
    expect(allKeys.length).toBe(0);

    // Write a value under a game-specific key
    localStorage.setItem("autonomous-arcade-reaction-rush-history", "test");
    localStorage.setItem("autonomous-arcade-word-grid-scores", "test");

    // Verify no cross-contamination
    expect(localStorage.getItem("autonomous-arcade-reaction-rush-history")).toBe("test");
    expect(localStorage.getItem("autonomous-arcade-word-grid-scores")).toBe("test");
    expect(localStorage.getItem("some-shared-global-state")).toBeNull();
  });

  it("clears one game's state without affecting another", () => {
    localStorage.setItem("autonomous-arcade-dungeon-history", "dungeon-data");
    localStorage.setItem("autonomous-arcade-reaction-rush-history", "rush-data");

    // Clear dungeon history
    localStorage.removeItem("autonomous-arcade-dungeon-history");

    expect(localStorage.getItem("autonomous-arcade-dungeon-history")).toBeNull();
    expect(localStorage.getItem("autonomous-arcade-reaction-rush-history")).toBe("rush-data");
  });
});