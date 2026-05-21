/**
 * Reaction Rush – UI Component
 *
 * Renders the game UI, manages stimulus/response DOM flow, and exposes
 * callbacks for game events.
 */

import type { RunHistory } from "./logic";

export type GamePhase = "idle" | "waiting" | "ready" | "clicked" | "too-early";

export interface ReactionRushCallbacks {
  /** Called when the player clicks during the "ready" phase with the reaction ms */
  onReact: (reactionMs: number) => void;
  /** Called when the player clicks too early (before stimulus appears) */
  onTooEarly: () => void;
  /** Called when the player starts a new run */
  onStart: () => void;
}

function formatMs(ms: number | null): string {
  if (ms === null) return "--";
  return `${ms} ms`;
}

function formatScore(score: number | null): string {
  if (score === null) return "--";
  return `${score}`;
}

export function renderReactionRush(
  container: HTMLElement,
  history: RunHistory,
  callbacks: ReactionRushCallbacks,
  phase: GamePhase
): void {
  container.innerHTML = "";
  container.classList.add("reaction-rush");

  // --- Header ---
  const header = document.createElement("div");
  header.className = "reaction-rush__header";

  const title = document.createElement("h1");
  title.textContent = "Reaction Rush";
  header.appendChild(title);

  const desc = document.createElement("p");
  desc.className = "reaction-rush__description";
  desc.textContent =
    "Test your reflexes! Click as fast as you can when the screen flashes.";
  header.appendChild(desc);

  container.appendChild(header);

  // --- Game Arena ---
  const arena = document.createElement("div");
  arena.className = "reaction-rush__arena";

  // Phase-specific classes for styling
  arena.classList.add(`reaction-rush__arena--${phase}`);

  const message = document.createElement("div");
  message.className = "reaction-rush__message";

  switch (phase) {
    case "idle":
      message.textContent = 'Press "Start" to begin a new run.';
      break;
    case "waiting":
      message.textContent = "Wait for the flash...";
      break;
    case "ready":
      message.textContent = "CLICK NOW!";
      break;
    case "clicked":
      message.textContent = "Run complete!";
      break;
    case "too-early":
      message.textContent = "Too early! Wait for the flash to appear.";
      break;
  }

  arena.appendChild(message);

  // Action button
  const actionBtn = document.createElement("button");
  actionBtn.className = "reaction-rush__action-btn";

  if (phase === "idle") {
    actionBtn.textContent = "Start";
    actionBtn.addEventListener("click", () => callbacks.onStart());
  } else if (phase === "waiting" || phase === "ready") {
    actionBtn.textContent = phase === "ready" ? "Click!" : "...";
    actionBtn.addEventListener("click", () => {
      // The click handler is wired at the game controller level
      // This DOM button click is just one way to trigger it
    });
  } else if (phase === "clicked") {
    actionBtn.textContent = "Play Again";
    actionBtn.addEventListener("click", () => callbacks.onStart());
  } else if (phase === "too-early") {
    actionBtn.textContent = "Try Again";
    actionBtn.addEventListener("click", () => callbacks.onStart());
  }

  arena.appendChild(actionBtn);
  container.appendChild(arena);

  // --- Run History ---
  const historySection = document.createElement("div");
  historySection.className = "reaction-rush__history";

  const historyTitle = document.createElement("h2");
  historyTitle.textContent = "Run History";
  historySection.appendChild(historyTitle);

  const stats = document.createElement("div");
  stats.className = "reaction-rush__stats";

  const best = document.createElement("div");
  best.className = "reaction-rush__stat";
  best.innerHTML = `<span class="reaction-rush__stat-label">Best</span><span class="reaction-rush__stat-value">${formatMs(history.bestMs)}</span>`;
  stats.appendChild(best);

  const avg = document.createElement("div");
  avg.className = "reaction-rush__stat";
  avg.innerHTML = `<span class="reaction-rush__stat-label">Average</span><span class="reaction-rush__stat-value">${formatMs(history.averageMs)}</span>`;
  stats.appendChild(avg);

  const last = document.createElement("div");
  last.className = "reaction-rush__stat";
  last.innerHTML = `<span class="reaction-rush__stat-label">Last</span><span class="reaction-rush__stat-value">${formatMs(history.lastMs)}</span>`;
  stats.appendChild(last);

  historySection.appendChild(stats);

  // Show last run details
  const lastRun = history.runs[history.runs.length - 1];
  if (lastRun) {
    const lastDetail = document.createElement("p");
    lastDetail.className = "reaction-rush__last-run";
    lastDetail.textContent = `Last run: ${formatMs(lastRun.reactionMs)} → Score: ${formatScore(lastRun.score)}`;
    historySection.appendChild(lastDetail);
  }

  container.appendChild(historySection);

  // --- Back to Hub ---
  const backBtn = document.createElement("button");
  backBtn.className = "reaction-rush__back-btn";
  backBtn.textContent = "← Back to Arcade";
  backBtn.addEventListener("click", () => {
    // Dispatch a custom event so the app shell can handle navigation
    window.dispatchEvent(new CustomEvent("navigate", { detail: { view: "hub" } }));
  });
  container.appendChild(backBtn);
}