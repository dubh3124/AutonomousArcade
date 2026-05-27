
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ReactionRushGame } from "../src/reaction-rush/game";

describe("Reaction Rush – QA Regression Tests", () => {
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

  it("persists run history across page reloads (simulated)", () => {
    const game1 = new ReactionRushGame(container);
    
    // Simulate a successful run
    // @ts-ignore - accessing private for test
    game1.phase = "ready";
    // @ts-ignore - accessing private for test
    game1.stimulusTime = performance.now() - 250; 
    game1.handleClick();

    const history1 = game1.getHistory();
    expect(history1.runs.length).toBe(1);
    expect(history1.lastMs).toBeGreaterThan(0);

    // Create a new instance (simulating reload)
    container.innerHTML = "";
    const game2 = new ReactionRushGame(container);
    const history2 = game2.getHistory();

    // This is expected to FAIL currently as persistence is not implemented in ReactionRushGame
    expect(history2.runs.length).toBe(1);
    expect(history2.bestMs).toBe(history1.bestMs);
  });

  it("resets cleanly between runs with no state leakage", () => {
    const game = new ReactionRushGame(container);
    
    // Fail a run
    // @ts-ignore
    game.phase = "waiting";
    game.handleClick();
    expect(game.getPhase()).toBe("too-early");

    // Start New
    game.startRun();
    expect(game.getPhase()).toBe("waiting");
    
    // Ensure no old timers trigger showStimulus early if we were to keep track
    // (This is more of a logic check)
  });

  it("tracks best, average, and last correctly after 3+ runs", () => {
     const game = new ReactionRushGame(container);
     
     const runs = [200, 400, 300];
     runs.forEach(ms => {
         // @ts-ignore
         game.phase = "ready";
         // @ts-ignore
         game.stimulusTime = performance.now() - ms;
         game.handleClick();
         game.startRun();
     });

     const history = game.getHistory();
     expect(history.runs.length).toBe(3);
     expect(Math.round(history.bestMs!)).toBe(200);
     expect(Math.round(history.lastMs!)).toBe(300);
     expect(Math.round(history.averageMs!)).toBe(300); // (200+400+300)/3
  });
});
