/**
 * App Shell Entry Point
 *
 * Wires together: player identity, game hub, score display, and footer.
 */

import { getPlayerId } from "./identity";
import { renderGameHub } from "./game-hub";
import { renderScoreDisplay } from "./score-display";
import { renderFooter } from "./footer";

function bootstrap(): void {
  const app = document.getElementById("app");
  if (!app) {
    throw new Error("Missing #app element");
  }

  // Player Identity
  const playerId = getPlayerId();
  const playerIdEl = document.getElementById("player-id");
  if (playerIdEl) {
    playerIdEl.textContent = playerId;
  }

  // Game Hub
  const hubEl = document.getElementById("game-hub");
  if (hubEl) {
    renderGameHub(hubEl);
  }

  // Score Display (shared component, empty state)
  const scoreEl = document.getElementById("score-display");
  if (scoreEl) {
    renderScoreDisplay(scoreEl, { score: 0, runs: 0 });
  }

  // Footer
  const footerEl = document.getElementById("site-footer");
  if (footerEl) {
    renderFooter(footerEl);
  }
}

bootstrap();
