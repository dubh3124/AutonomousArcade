import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ReactionRushGame } from "../src/reaction-rush/game";

describe("Product Reviewer Stability Regression Tests", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    localStorage.clear();
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it("ensures Reaction Rush title has the standard accessibility class .reaction-rush__title", () => {
    new ReactionRushGame(container);
    // At the baseline, this <h1> lacks the class .reaction-rush__title
    const title = container.querySelector(".reaction-rush__title");
    expect(title).not.toBeNull();
  });

  it("ensures interactive controls use stable selectors (e.g., .reaction-rush__back-btn)", () => {
    new ReactionRushGame(container);
    const backBtn = container.querySelector(".reaction-rush__back-btn");
    expect(backBtn).not.toBeNull();
    expect(backBtn?.textContent).toContain("Back");
  });
});
