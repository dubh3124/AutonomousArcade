/**
 * Living Dungeon Mini - UI Renderer
 *
 * Renders the dungeon grid, controls, score, turns, and run history.
 * Handles keyboard and on-screen button input.
 */

import { type Dungeon, type CellType, type Position } from "./dungeon";
import {
  type GameState,
  type Direction,
  type GameStatus,
  createGame,
  movePlayer,
  getScore,
  getTurns,
  getStatus,
  getDungeonState,
  getPlayerPosition,
} from "./living-dungeon";
import { getRunHistory } from "./run-history";
import { getPlayerId } from "./identity";

const CELL_SYMBOLS: Record<CellType, string> = {
  empty: "·",
  wall: "█",
  player: "🧝",
  exit: "🚪",
  treasure: "💎",
  hazard: "⚠️",
};

const CELL_CLASSES: Record<CellType, string> = {
  empty: "cell--empty",
  wall: "cell--wall",
  player: "cell--player",
  exit: "cell--exit",
  treasure: "cell--treasure",
  hazard: "cell--hazard",
};

/**
 * Render the complete Living Dungeon Mini game into a container.
 */
export function renderDungeonGame(container: HTMLElement): void {
  container.innerHTML = "";
  container.classList.add("dungeon-game");

  const game = createGame();
  let gameOver = false;

  // -- Header: back button + title --
  const header = document.createElement("div");
  header.className = "dungeon-game__header";

  const backBtn = document.createElement("button");
  backBtn.className = "dungeon-game__back";
  backBtn.textContent = "← Back to Hub";
  backBtn.addEventListener("click", () => {
    // Dispatch a custom event for the app shell to handle routing
    window.dispatchEvent(new CustomEvent("navigate", { detail: { route: "hub" } }));
  });
  header.appendChild(backBtn);

  const title = document.createElement("h1");
  title.className = "dungeon-game__title";
  title.textContent = "Living Dungeon Mini";
  header.appendChild(title);
  container.appendChild(header);

  // -- Info bar: score + turns + status --
  const infoBar = document.createElement("div");
  infoBar.className = "dungeon-game__info";

  const scoreEl = document.createElement("span");
  scoreEl.className = "dungeon-game__score";
  scoreEl.textContent = `Score: ${getScore(game)}`;

  const turnsEl = document.createElement("span");
  turnsEl.className = "dungeon-game__turns";
  turnsEl.textContent = `Turns: ${getTurns(game)}`;

  const statusEl = document.createElement("span");
  statusEl.className = "dungeon-game__status";
  statusEl.textContent = "";

  infoBar.appendChild(scoreEl);
  infoBar.appendChild(turnsEl);
  infoBar.appendChild(statusEl);
  container.appendChild(infoBar);

  // -- Grid --
  const gridContainer = document.createElement("div");
  gridContainer.className = "dungeon-game__grid";
  container.appendChild(gridContainer);

  // -- On-screen D-pad --
  const dpad = document.createElement("div");
  dpad.className = "dungeon-game__dpad";

  const createDpadBtn = (dir: Direction, label: string): HTMLButtonElement => {
    const btn = document.createElement("button");
    btn.className = `dpad-btn dpad-btn--${dir}`;
    btn.textContent = label;
    btn.addEventListener("click", () => handleMove(dir));
    return btn;
  };

  dpad.appendChild(createDpadBtn("up", "↑"));
  const midRow = document.createElement("div");
  midRow.className = "dpad-row";
  midRow.appendChild(createDpadBtn("left", "←"));
  midRow.appendChild(createDpadBtn("down", "↓"));
  midRow.appendChild(createDpadBtn("right", "→"));
  dpad.appendChild(midRow);
  container.appendChild(dpad);

  // -- New Game button --
  const newGameBtn = document.createElement("button");
  newGameBtn.className = "dungeon-game__new-game";
  newGameBtn.textContent = "New Game";
  newGameBtn.addEventListener("click", () => {
    const newGame = createGame();
    // Replace the game state by re-rendering
    renderDungeonGame(container);
  });
  container.appendChild(newGameBtn);

  // -- Run History --
  const historyContainer = document.createElement("div");
  historyContainer.className = "dungeon-game__history";
  container.appendChild(historyContainer);

  // -- Helper: render grid --
  function renderGrid(): void {
    gridContainer.innerHTML = "";
    const dungeon = getDungeonState(game);
    const playerPos = getPlayerPosition(game);

    for (let y = 0; y < dungeon.height; y++) {
      const row = document.createElement("div");
      row.className = "dungeon-row";

      for (let x = 0; x < dungeon.width; x++) {
        const cell = document.createElement("div");
        cell.className = `dungeon-cell ${CELL_CLASSES[dungeon.cells[y][x]]}`;

        // Show player at current position
        if (x === playerPos.x && y === playerPos.y) {
          cell.textContent = CELL_SYMBOLS["player"];
          cell.className = `dungeon-cell ${CELL_CLASSES["player"]}`;
        } else {
          cell.textContent = CELL_SYMBOLS[dungeon.cells[y][x]];
        }

        row.appendChild(cell);
      }
      gridContainer.appendChild(row);
    }
  }

  // -- Helper: update info --
  function updateInfo(): void {
    scoreEl.textContent = `Score: ${getScore(game)}`;
    turnsEl.textContent = `Turns: ${getTurns(game)}`;

    const status = getStatus(game);
    if (status === "won") {
      statusEl.textContent = "🎉 You escaped!";
      statusEl.className = "dungeon-game__status dungeon-game__status--won";
    } else if (status === "dead") {
      statusEl.textContent = "💀 You perished!";
      statusEl.className = "dungeon-game__status dungeon-game__status--dead";
    } else {
      statusEl.textContent = "";
      statusEl.className = "dungeon-game__status";
    }
  }

  // -- Helper: render history --
  function renderHistory(): void {
    historyContainer.innerHTML = "";
    const history = getRunHistory();

    const heading = document.createElement("h3");
    heading.textContent = "Run History";
    historyContainer.appendChild(heading);

    const stats = document.createElement("div");
    stats.className = "dungeon-game__history-stats";

    const best = document.createElement("span");
    best.textContent = `Best: ${history.bestScore}`;
    stats.appendChild(best);

    const avg = document.createElement("span");
    avg.textContent = `Avg: ${history.averageScore}`;
    stats.appendChild(avg);

    const last = document.createElement("span");
    last.textContent = `Last: ${history.lastScore}`;
    stats.appendChild(last);

    const runs = document.createElement("span");
    runs.textContent = `Runs: ${history.totalRuns}`;
    stats.appendChild(runs);

    historyContainer.appendChild(stats);
  }

  // -- Move handler --
  function handleMove(dir: Direction): void {
    if (gameOver) return;

    const result = movePlayer(game, dir);
    if (result.moved || getStatus(game) !== "playing") {
      renderGrid();
      updateInfo();
      renderHistory();

      if (getStatus(game) !== "playing") {
        gameOver = true;
      }
    }
  }

  // -- Keyboard handler --
  function handleKeyDown(e: KeyboardEvent): void {
    if (gameOver) return;
    const keyMap: Record<string, Direction> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
      W: "up",
      S: "down",
      A: "left",
      D: "right",
    };
    const dir = keyMap[e.key];
    if (dir) {
      e.preventDefault();
      handleMove(dir);
    }
  }

  window.addEventListener("keydown", handleKeyDown, { once: false });

  // Clean up old listeners on re-render
  const cleanup = () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
  container.dataset.cleanup = "true";
  // Store cleanup reference
  (container as any).__dungeonCleanup = cleanup;

  // Initial render
  renderGrid();
  renderHistory();
}