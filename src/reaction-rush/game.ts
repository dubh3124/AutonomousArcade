/**
 * Reaction Rush – Game Controller
 *
 * Orchestrates game phases, connects logic to UI, and manages
 * stimulus timing.
 */

import {
  createRunHistory,
  loadRunHistory,
  saveRunHistory,
  recordRun,
  randomDelayMs,
  measureReaction,
  type RunHistory,
} from "./logic";
import { renderReactionRush, type GamePhase } from "./ui";

/** Default min delay before stimulus (ms) */
const DEFAULT_MIN_DELAY_MS = 1000;
/** Default max delay before stimulus (ms) */
const DEFAULT_MAX_DELAY_MS = 4000;

export class ReactionRushGame {
  private container: HTMLElement;
  private history: RunHistory;
  private phase: GamePhase;
  private stimulusTime: number;
  private timeoutId: ReturnType<typeof setTimeout> | null;
  private minDelay: number;
  private maxDelay: number;

  constructor(container: HTMLElement) {
    this.container = container;
    this.history = loadRunHistory();
    this.phase = "idle";
    this.stimulusTime = 0;
    this.timeoutId = null;
    this.minDelay = DEFAULT_MIN_DELAY_MS;
    this.maxDelay = DEFAULT_MAX_DELAY_MS;
    this.render();
  }

  /** Start a new run. Transitions to "waiting" and schedules the stimulus. */
  startRun(): void {
    this.clearTimer();
    this.phase = "waiting";
    this.render();

    const delay = randomDelayMs(this.minDelay, this.maxDelay);
    this.timeoutId = setTimeout(() => {
      this.showStimulus();
    }, delay);
  }

  /** The stimulus appears; start measuring reaction time. */
  private showStimulus(): void {
    this.phase = "ready";
    this.stimulusTime = performance.now();
    this.render();
  }

  /** Handle a click from the player. */
  handleClick(): void {
    switch (this.phase) {
      case "waiting":
        // Player clicked before the stimulus appeared
        this.clearTimer();
        this.phase = "too-early";
        this.render();
        break;
      case "ready":
        // Player reacted to the stimulus
        const clickTime = performance.now();
        const reactionMs = measureReaction(this.stimulusTime, clickTime);
        this.history = recordRun(this.history, reactionMs);
        saveRunHistory(this.history);
        this.phase = "clicked";
        this.render();
        break;
      case "idle":
        // Starting from idle state
        this.startRun();
        break;
      case "clicked":
      case "too-early":
        // Button will handle restart via onStart callback
        break;
    }
  }

  /** Clean up any pending timer. */
  private clearTimer(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /** Render the current game state. */
  private render(): void {
    renderReactionRush(this.container, this.history, {
      onReact: () => {},
      onTooEarly: () => {},
      onStart: () => this.startRun(),
    }, this.phase);
  }

  /** Get the current run history (for testing). */
  getHistory(): RunHistory {
    return this.history;
  }

  /** Get the current game phase (for testing). */
  getPhase(): GamePhase {
    return this.phase;
  }

  /** Destroy the game, cleaning up timers. */
  destroy(): void {
    this.clearTimer();
    this.container.innerHTML = "";
  }
}

export interface MountReactionRushOptions {
  playerId: string;
  onBack: () => void;
}

export function mountReactionRush(
  container: HTMLElement,
  options: MountReactionRushOptions
): ReactionRushGame {
  const game = new ReactionRushGame(container);

  // Add player ID display
  const playerIdEl = document.createElement("div");
  playerIdEl.className = "player-identity";
  playerIdEl.innerHTML = `<span class="player-identity__label">Player ID:</span> <span>${options.playerId}</span>`;
  container.insertBefore(playerIdEl, container.firstChild);

  // Add back button handler
  const backBtn = container.querySelector(".reaction-rush__back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      game.destroy();
      options.onBack();
    });
  }

  // Wire up the action button click handler
  const actionBtn = container.querySelector(".reaction-rush__action-btn");
  if (actionBtn) {
    actionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      game.handleClick();
    });
  }

  const hitArea = container.querySelector(".reaction-rush__hit-area");
  if (hitArea) {
    hitArea.addEventListener("click", (e) => {
      e.stopPropagation();
      game.handleClick();
    });
  }

  return game;
}