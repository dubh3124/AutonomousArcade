/**
 * App Shell Entry Point
 *
 * Wires together: player identity, game hub, score display, and footer.
 * Supports navigation to individual games via the "navigate" custom event.
 */

import { getPlayerId } from "./identity";
import { renderGameHub } from "./game-hub";
import { renderScoreDisplay } from "./score-display";
import { renderFooter } from "./footer";
import { mountReactionRush } from "./reaction-rush/game";

function bootstrap(): void {
  const app = document.getElementById("app");
  if (!app) {
    throw new Error("Missing #app element");
  }

  const playerId = getPlayerId();

  const shellView = document.getElementById("shell-view");
  const gameView = document.getElementById("game-view");

  window.addEventListener("navigate", (event: Event) => {
    const { route } = (event as CustomEvent).detail as { route: string };

    if (shellView) shellView.style.display = "none";
    if (gameView) gameView.style.display = "block";

    if (route === "reaction-rush" && gameView) {
      mountReactionRush(gameView, {
        playerId,
        onBack: () => navigateToHub(),
      });
    }
  });

  function navigateToHub(): void {
    if (shellView) shellView.style.display = "block";
    if (gameView) {
      gameView.innerHTML = "";
      gameView.style.display = "none";
    }
    // Re-render shell components (idempotent)
    if (shellView) {
      const playerIdEl = document.getElementById("player-id");
      if (playerIdEl) playerIdEl.textContent = playerId;

      const hubEl = document.getElementById("game-hub");
      if (hubEl) renderGameHub(hubEl);

      const scoreEl = document.getElementById("score-display");
      if (scoreEl) renderScoreDisplay(scoreEl, { score: 0, runs: 0 });

      const footerEl = document.getElementById("site-footer");
      if (footerEl) renderFooter(footerEl);
    }
  }

  // Initial render
  const playerIdEl = document.getElementById("player-id");
  if (playerIdEl) {
    playerIdEl.textContent = playerId;
  }

  const hubEl = document.getElementById("game-hub");
  if (hubEl) {
    renderGameHub(hubEl);
  }

  const scoreEl = document.getElementById("score-display");
  if (scoreEl) {
    renderScoreDisplay(scoreEl, { score: 0, runs: 0 });
  }

  const footerEl = document.getElementById("site-footer");
  if (footerEl) {
    renderFooter(footerEl);
  }
}

bootstrap();
