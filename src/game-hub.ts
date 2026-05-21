/**
 * Game Selection Hub
 *
 * Renders placeholder slots for at least three games.
 */

export interface GameSlot {
  title: string;
  description: string;
  status: "available" | "coming-soon";
}

const PLACEHOLDER_GAMES: GameSlot[] = [
  {
    title: "Reaction Rush",
    description: "Test your reflexes — click as fast as you can!",
    status: "coming-soon",
  },
  {
    title: "Word Grid",
    description: "Find words in a grid of letters before time runs out.",
    status: "coming-soon",
  },
  {
    title: "Living Dungeon Mini",
    description: "Explore a tiny procedural dungeon. Survive if you can.",
    status: "coming-soon",
  },
];

export function renderGameHub(container: HTMLElement): void {
  container.innerHTML = "";
  container.classList.add("game-hub");

  const heading = document.createElement("h1");
  heading.textContent = "Autonomous Arcade";
  container.appendChild(heading);

  const grid = document.createElement("div");
  grid.className = "game-hub__grid";

  for (const game of PLACEHOLDER_GAMES) {
    const card = createGameCard(game);
    grid.appendChild(card);
  }

  container.appendChild(grid);
}

function createGameCard(game: GameSlot): HTMLElement {
  const card = document.createElement("div");
  card.className = "game-card";

  const title = document.createElement("h2");
  title.className = "game-card__title";
  title.textContent = game.title;
  card.appendChild(title);

  const desc = document.createElement("p");
  desc.className = "game-card__description";
  desc.textContent = game.description;
  card.appendChild(desc);

  const badge = document.createElement("span");
  badge.className = `game-card__status game-card__status--${game.status}`;
  badge.textContent =
    game.status === "available" ? "Play Now" : "Coming Soon";
  card.appendChild(badge);

  return card;
}
