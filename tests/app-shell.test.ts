/**
 * Unit Tests: App Shell
 *
 * Covers:
 * - Player ID generation
 * - localStorage persistence
 * - Footer content
 * - Score-display rendering
 * - Game hub rendering
 */

import { describe, it, expect, beforeEach } from "vitest";
import { getPlayerId, clearPlayerId, getStorageKey } from "../src/identity";
import { renderFooter, getAttributionText } from "../src/footer";
import { renderScoreDisplay } from "../src/score-display";
import { renderGameHub } from "../src/game-hub";

describe("Player Identity", () => {
  beforeEach(() => {
    localStorage.clear();
    clearPlayerId();
  });

  it("generates a UUID v4 format player ID on first visit", () => {
    const id = getPlayerId();
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("persists the player ID in localStorage", () => {
    const id = getPlayerId();
    const stored = localStorage.getItem(getStorageKey());
    expect(stored).toBe(id);
  });

  it("returns the same ID on subsequent calls", () => {
    const id1 = getPlayerId();
    const id2 = getPlayerId();
    expect(id2).toBe(id1);
  });

  it("survives page reloads (reads from localStorage)", () => {
    const id1 = getPlayerId();
    // Simulate page reload: clear the module cache by re-reading from localStorage
    const stored = localStorage.getItem(getStorageKey());
    expect(stored).toBe(id1);
    // Clear any in-memory state — just confirm localStorage has it
    const id2 = getPlayerId();
    expect(id2).toBe(id1);
  });

  it("generates unique IDs for different visitors", () => {
    const id1 = getPlayerId();
    // Simulate a different visitor by clearing and reading again
    clearPlayerId();
    localStorage.clear();
    const id2 = getPlayerId();
    expect(id2).not.toBe(id1);
  });
});

describe("Footer", () => {
  it("contains AEP / CognicellAI attribution text", () => {
    const text = getAttributionText();
    expect(text).toContain("Autonomous Engineering Platform");
    expect(text).toContain("CognicellAI");
  });

  it("renders attribution into the container", () => {
    const container = document.createElement("div");
    renderFooter(container);
    expect(container.textContent).toContain("Autonomous Engineering Platform");
    expect(container.textContent).toContain("CognicellAI");
  });

  it("renders a build-log / changelog link", () => {
    const container = document.createElement("div");
    renderFooter(container);
    const link = container.querySelector(".site-footer__build-log a");
    expect(link).not.toBeNull();
    expect(link?.getAttribute("href")).toBe("#changelog");
    expect(link?.textContent).toContain("Changelog");
  });

  it("has the site-footer class on the container", () => {
    const container = document.createElement("div");
    renderFooter(container);
    expect(container.classList.contains("site-footer")).toBe(true);
  });
});

describe("Score Display", () => {
  it("renders a numeric score", () => {
    const container = document.createElement("div");
    renderScoreDisplay(container, { score: 42, runs: 0 });
    expect(container.textContent).toContain("Score: 42");
  });

  it("renders a runs counter", () => {
    const container = document.createElement("div");
    renderScoreDisplay(container, { score: 0, runs: 7 });
    expect(container.textContent).toContain("Runs: 7");
  });

  it("renders both score and runs together", () => {
    const container = document.createElement("div");
    renderScoreDisplay(container, { score: 100, runs: 5 });
    expect(container.textContent).toContain("Score: 100");
    expect(container.textContent).toContain("Runs: 5");
  });

  it("defaults to score 0 and runs 0", () => {
    const container = document.createElement("div");
    renderScoreDisplay(container);
    expect(container.textContent).toContain("Score: 0");
    expect(container.textContent).toContain("Runs: 0");
  });

  it("has score-display class on the container", () => {
    const container = document.createElement("div");
    renderScoreDisplay(container);
    expect(container.classList.contains("score-display")).toBe(true);
  });
});

describe("Game Hub", () => {
  it("renders at least three game placeholder slots", () => {
    const container = document.createElement("div");
    renderGameHub(container);
    const cards = container.querySelectorAll(".game-card");
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });

  it("renders game titles", () => {
    const container = document.createElement("div");
    renderGameHub(container);
    const titles = container.querySelectorAll(".game-card__title");
    expect(titles.length).toBeGreaterThanOrEqual(3);
    const titleTexts = Array.from(titles).map((el) => el.textContent);
    expect(titleTexts).toContain("Reaction Rush");
    expect(titleTexts).toContain("Word Grid");
    expect(titleTexts).toContain("Living Dungeon Mini");
  });

  it("renders 'Coming Soon' badges for future games", () => {
    const container = document.createElement("div");
    renderGameHub(container);
    const badges = container.querySelectorAll(".game-card__status--coming-soon");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("renders a 'Play Now' badge for available games", () => {
    const container = document.createElement("div");
    renderGameHub(container);
    const badge = container.querySelector(".game-card__status--available");
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe("Play Now");
  });
});
