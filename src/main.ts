/**
 * App Shell Entry Point
 *
 * Wires together: player identity, game hub, score display, and footer.
 * Handles navigation between hub and game views.
 */

import { getPlayerId } from "./identity";
import { renderGameHub } from "./game-hub";
import { renderScoreDisplay } from "./score-display";
import { renderFooter } from "./footer";
import { renderDungeonGame } from "./dungeon-ui";

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

  // Set up navigation listener
  window.addEventListener("navigate", ((e: CustomEvent) => {
    const target = e.detail;
    if (target === "hub") {
      showHub();
    } else if (target === "Living Dungeon Mini") {
      showDungeonGame();
    }
  }) as EventListener);

  // Start on hub
  showHub();
}

function showHub(): void {
  const app = document.getElementById("app")!;
  app.innerHTML = "";

  // Player Identity
  const playerIdentity = document.createElement("div");
  playerIdentity.className = "player-identity";
  const playerLabel = document.createElement("span");
  playerLabel.className = "player-identity__label";
  playerLabel.textContent = "Player ID: ";
  const playerIdSpan = document.createElement("span");
  playerIdSpan.id = "player-id";
  playerIdSpan.textContent = getPlayerId();
  playerIdentity.appendChild(playerLabel);
  playerIdentity.appendChild(playerIdSpan);
  app.appendChild(playerIdentity);

  // Game Hub
  const hubEl = document.createElement("div");
  hubEl.id = "game-hub";
  app.appendChild(hubEl);
  renderGameHub(hubEl);

  // Score Display
  const scoreEl = document.createElement("div");
  scoreEl.id = "score-display";
  app.appendChild(scoreEl);
  renderScoreDisplay(scoreEl, { score: 0, runs: 0 });

  // Footer
  const footerEl = document.createElement("footer");
  footerEl.id = "site-footer";
  app.appendChild(footerEl);
  renderFooter(footerEl);
}

function showDungeonGame(): void {
  const app = document.getElementById("app")!;
  app.innerHTML = "";

  // Player Identity (compact)
  const playerIdentity = document.createElement("div");
  playerIdentity.className = "player-identity";
  const playerLabel = document.createElement("span");
  playerLabel.className = "player-identity__label";
  playerLabel.textContent = "Player ID: ";
  const playerIdSpan = document.createElement("span");
  playerIdSpan.id = "player-id";
  playerIdSpan.textContent = getPlayerId();
  playerIdentity.appendChild(playerLabel);
  playerIdentity.appendChild(playerIdSpan);
  app.appendChild(playerIdentity);

  // Dungeon Game
  const dungeonContainer = document.createElement("div");
  dungeonContainer.id = "dungeon-game-container";
  app.appendChild(dungeonContainer);
  renderDungeonGame(dungeonContainer);

  // Footer (compact)
  const footerEl = document.createElement("footer");
  footerEl.id = "site-footer";
  app.appendChild(footerEl);
  renderFooter(footerEl);
}

bootstrap();
