/**
 * Shared Score-Display Component
 *
 * Renders a numeric score and a runs counter into a container element.
 */

export interface ScoreDisplayOptions {
  score?: number;
  runs?: number;
}

export function renderScoreDisplay(
  container: HTMLElement,
  options: ScoreDisplayOptions = {}
): void {
  const { score = 0, runs = 0 } = options;

  container.innerHTML = "";
  container.classList.add("score-display");

  const scoreEl = document.createElement("span");
  scoreEl.className = "score-display__score";
  scoreEl.textContent = `Score: ${score}`;

  const runsEl = document.createElement("span");
  runsEl.className = "score-display__runs";
  runsEl.textContent = `Runs: ${runs}`;

  container.appendChild(scoreEl);
  container.appendChild(runsEl);
}

export function updateScoreDisplay(
  container: HTMLElement,
  options: ScoreDisplayOptions
): void {
  renderScoreDisplay(container, options);
}
