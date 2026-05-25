/**
 * Word Grid – Game UI Component
 *
 * Renders the 4x4 letter grid, word input, found words, timer, score,
 * and run-history into a container. Delegates game logic to the engine.
 */

import {
  generateGrid,
  WordGridGame,
  RunHistory,
  type LetterGrid,
  type SubmitResult,
  type RunStats,
  type Position,
  isValidAdjacentSelection,
} from "./engine";
import { getPlayerId } from "../identity";

export function renderWordGridGame(container: HTMLElement): void {
  container.innerHTML = "";
  container.classList.add("word-grid-game");

  const playerId = getPlayerId();
  const grid = generateGrid();
  const history = new RunHistory();
  const game = new WordGridGame(grid, history);

  let selectedCells: { row: number; col: number }[] = [];
  let currentWord = "";

  // ── Header ──
  const header = document.createElement("div");
  header.className = "word-grid-game__header";

  const backBtn = document.createElement("button");
  backBtn.className = "word-grid-game__back";
  backBtn.textContent = "← Back to Hub";
  backBtn.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("navigate", { detail: { route: "hub" } }));
  });
  header.appendChild(backBtn);

  const title = document.createElement("h1");
  title.className = "word-grid-game__title";
  title.textContent = "Word Grid";
  header.appendChild(title);
  container.appendChild(header);

  // ── Info bar: score + timer ──
  const infoBar = document.createElement("div");
  infoBar.className = "word-grid-game__info";

  const scoreEl = document.createElement("span");
  scoreEl.className = "word-grid-game__score";
  scoreEl.textContent = `Score: ${game.getScore()}`;

  const timerEl = document.createElement("span");
  timerEl.className = "word-grid-game__timer";
  timerEl.textContent = "Time: 90s";

  infoBar.appendChild(scoreEl);
  infoBar.appendChild(timerEl);
  container.appendChild(infoBar);

  // ── Player ID ──
  const playerIdEl = document.createElement("div");
  playerIdEl.className = "word-grid-game__player-id";
  playerIdEl.textContent = `Player: ${playerId}`;
  container.appendChild(playerIdEl);

  // ── Grid ──
  const gridContainer = document.createElement("div");
  gridContainer.className = "word-grid-game__grid";
  container.appendChild(gridContainer);

  // ── Word input + feedback ──
  const inputArea = document.createElement("div");
  inputArea.className = "word-grid-game__input-area";

  const wordDisplay = document.createElement("div");
  wordDisplay.className = "word-grid-game__word-display";
  wordDisplay.textContent = "";
  inputArea.appendChild(wordDisplay);

  const messageEl = document.createElement("div");
  messageEl.className = "word-grid-game__message";
  inputArea.appendChild(messageEl);

  const submitBtn = document.createElement("button");
  submitBtn.className = "word-grid-game__submit-btn";
  submitBtn.textContent = "Submit Word";
  inputArea.appendChild(submitBtn);

  const newGameBtn = document.createElement("button");
  newGameBtn.className = "word-grid-game__new-game-btn";
  newGameBtn.textContent = "New Game";
  inputArea.appendChild(newGameBtn);

  container.appendChild(inputArea);

  // ── Found words ──
  const wordList = document.createElement("div");
  wordList.className = "word-grid-game__word-list";
  wordList.innerHTML = "<h3>Found Words</h3>";
  container.appendChild(wordList);

  // ── Run History ──
  const historyContainer = document.createElement("div");
  historyContainer.className = "word-grid-game__history";
  container.appendChild(historyContainer);

  // ── Helpers ──
  function renderGrid(): void {
    gridContainer.innerHTML = "";
    const gridData = game.getGrid();

    for (let r = 0; r < 4; r++) {
      const row = document.createElement("div");
      row.className = "word-grid-row";

      for (let c = 0; c < 4; c++) {
        const cell = gridData.find((lc) => lc.row === r && lc.col === c);
        if (!cell) continue;

        const cellEl = document.createElement("button");
        cellEl.className = "word-grid-cell";
        cellEl.textContent = cell.letter;

        const isSelected = selectedCells.some((sc) => sc.row === r && sc.col === c);
        if (isSelected) {
          cellEl.classList.add("word-grid-cell--selected");
        }

        cellEl.addEventListener("click", () => {
          if (!game.isActive()) return;

          const idx = selectedCells.findIndex((sc) => sc.row === r && sc.col === c);
          if (idx >= 0) {
            // Deselect: remove this cell and any after it
            selectedCells = selectedCells.slice(0, idx);
          } else {
            selectedCells.push({ row: r, col: c });
          }

          // Build current word
          currentWord = selectedCells
            .map((sc) => {
              const c = gridData.find((lc) => lc.row === sc.row && lc.col === sc.col);
              return c?.letter ?? "";
            })
            .join("");
          wordDisplay.textContent = currentWord;
          messageEl.textContent = "";
          renderGrid();
        });

        row.appendChild(cellEl);
      }
      gridContainer.appendChild(row);
    }
  }

  function renderWordList(): void {
    const words = game.getWords();
    const listHTML = words.length === 0
      ? "<h3>Found Words</h3><p>No words found yet.</p>"
      : `<h3>Found Words (${words.length})</h3><p>${words.join(", ")}</p>`;
    wordList.innerHTML = listHTML;
  }

  function renderHistory(): void {
    const stats = history.getStats();
    historyContainer.innerHTML = `<h3>Run History</h3>
      <div class="word-grid-game__history-stats">
        <span>Best: ${stats.best ?? "-"}</span>
        <span>Avg: ${stats.average ?? "-"}</span>
        <span>Last: ${stats.last ?? "-"}</span>
        <span>Runs: ${stats.runs}</span>
      </div>`;
  }

  function updateInfo(): void {
    scoreEl.textContent = `Score: ${game.getScore()}`;
    const timer = game.getTimer();
    const remaining = Math.max(0, timer.getRemaining());
    timerEl.textContent = `Time: ${remaining}s`;
  }

  function checkGameOver(): void {
    if (!game.isActive()) {
      submitBtn.disabled = true;
      newGameBtn.textContent = "Play Again";
      messageEl.textContent = "Time's up!";
      renderHistory();
    }
  }

  // ── Submit handler ──
  submitBtn.addEventListener("click", () => {
    if (!game.isActive()) return;

    const path: Position[] = selectedCells.map((sc) => ({ row: sc.row, col: sc.col }));
    const result: SubmitResult = game.submitWord(currentWord, path);

    if (result.accepted) {
      messageEl.textContent = `"${currentWord}" accepted!`;
      selectedCells = [];
      currentWord = "";
      wordDisplay.textContent = "";
      renderGrid();
      renderWordList();
      updateInfo();
    } else {
      messageEl.textContent =
        result.reason === "too-short"
          ? "Word too short (min 3 letters)"
          : result.reason === "duplicate"
            ? "Already found!"
            : result.reason === "not-adjacent"
              ? "Letters must be adjacent"
              : result.reason === "not-in-dictionary"
                ? "Not in dictionary"
                : "Invalid word";
    }
    checkGameOver();
  });

  // ── New Game handler ──
  newGameBtn.addEventListener("click", () => {
    const newGrid = generateGrid();
    const newHistory = new RunHistory();
    // Re-assign the game
    renderWordGridGame(container);
  });

  // ── Timer tick ──
  const tickInterval = setInterval(() => {
    if (game.isActive()) {
      updateInfo();
    } else {
      updateInfo();
      checkGameOver();
      clearInterval(tickInterval);
    }
  }, 1000);

  // ── Start game ──
  game.start();

  // ── Initial render ──
  renderGrid();
  renderWordList();
  renderHistory();

  // Store cleanup
  (container as any).__wordGridCleanup = () => {
    clearInterval(tickInterval);
  };
}