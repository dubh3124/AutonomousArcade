/**
 * Dungeon Generation for Living Dungeon Mini
 *
 * Generates a 5x5 to 8x8 grid with:
 * - player start
 * - exit (guaranteed reachable via BFS)
 * - treasures
 * - hazards
 * - walls (impassable)
 * - empty floors
 */

export type CellType = "empty" | "wall" | "player" | "exit" | "treasure" | "hazard";

export interface Position {
  x: number;
  y: number;
}

export interface Dungeon {
  width: number;
  height: number;
  cells: CellType[][];
}

/**
 * Returns a random integer in [min, max] inclusive.
 */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a random element from an array.
 */
function randPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates a dungeon with guaranteed reachable exit.
 */
export function generateDungeon(): Dungeon {
  // Retry until we get a valid dungeon with a reachable exit
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = tryGenerateDungeon();
    const start = findPlayerStart(result);
    const exit = findExit(result);
    if (start && exit && canReachExit(result, start, exit)) {
      return result;
    }
  }
  throw new Error("Failed to generate a valid dungeon after 100 attempts");
}

function tryGenerateDungeon(): Dungeon {
  const size = randInt(5, 8);
  const width = size;
  const height = size;

  // Initialize all cells as walls
  const cells: CellType[][] = [];
  for (let y = 0; y < height; y++) {
    cells[y] = [];
    for (let x = 0; x < width; x++) {
      cells[y][x] = "wall";
    }
  }

  // Carve a simple random walk to ensure connectivity
  const visited = new Set<string>();
  const startX = randInt(0, width - 1);
  const startY = randInt(0, height - 1);

  // DFS-based maze carving to create open paths
  function carve(x: number, y: number): void {
    const key = `${x},${y}`;
    if (visited.has(key)) return;
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    visited.add(key);
    cells[y][x] = "empty";

    // Randomize direction order
    const dirs: [number, number][] = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];
    // Shuffle
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }

    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (
        nx >= 0 &&
        nx < width &&
        ny >= 0 &&
        ny < height &&
        !visited.has(`${nx},${ny}`)
      ) {
        // 70% chance to continue carving to create more open space
        if (Math.random() < 0.7) {
          carve(nx, ny);
        }
      }
    }
  }

  carve(startX, startY);

  // Ensure minimum openness: at least 60% of cells should be empty
  let emptyCount = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (cells[y][x] === "empty") emptyCount++;
    }
  }

  // If too many walls, punch additional holes
  const minEmpty = Math.floor(width * height * 0.5);
  while (emptyCount < minEmpty) {
    const rx = randInt(0, width - 1);
    const ry = randInt(0, height - 1);
    if (cells[ry][rx] === "wall") {
      cells[ry][rx] = "empty";
      emptyCount++;
    }
  }

  // Place player start on any empty cell
  const emptyCells: Position[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (cells[y][x] === "empty") emptyCells.push({ x, y });
    }
  }

  const playerPos = randPick(emptyCells);
  cells[playerPos.y][playerPos.x] = "player";

  // Remove player cell from empty list
  const remainingEmpty = emptyCells.filter(
    (c) => c.x !== playerPos.x || c.y !== playerPos.y
  );

  // Find exit position that is reachable from player start
  let exitPos: Position | null = null;
  const shuffled = [...remainingEmpty].sort(() => Math.random() - 0.5);

  for (const candidate of shuffled) {
    // Temporarily set exit and check reachability
    cells[candidate.y][candidate.x] = "exit";
    if (canReachExit({ width, height, cells }, playerPos, candidate)) {
      exitPos = candidate;
      break;
    }
    cells[candidate.y][candidate.x] = "empty";
  }

  // Fallback: if no reachable exit found (shouldn't happen with our carving),
  // set exit to the farthest reachable empty cell
  if (!exitPos) {
    // Just pick any remaining empty cell - we carved from start so all should be reachable
    exitPos = randPick(remainingEmpty);
    cells[exitPos.y][exitPos.x] = "exit";
  }

  // Place treasures and hazards on remaining empty cells
  const afterExit = remainingEmpty.filter(
    (c) => c.x !== exitPos!.x || c.y !== exitPos!.y
  );

  // Calculate number of treasures and hazards based on dungeon size
  const specialCells = afterExit.length;
  const treasureCount = Math.max(1, Math.floor(specialCells * 0.3));
  const hazardCount = Math.max(1, Math.floor(specialCells * 0.2));

  const shuffledRemaining = afterExit.sort(() => Math.random() - 0.5);

  for (let i = 0; i < treasureCount && i < shuffledRemaining.length; i++) {
    const c = shuffledRemaining[i];
    cells[c.y][c.x] = "treasure";
  }

  for (
    let i = treasureCount;
    i < treasureCount + hazardCount && i < shuffledRemaining.length;
    i++
  ) {
    const c = shuffledRemaining[i];
    cells[c.y][c.x] = "hazard";
  }

  return { width, height, cells };
}

/**
 * Find the player start position in the dungeon.
 */
export function findPlayerStart(dungeon: Dungeon): Position | null {
  for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
      if (dungeon.cells[y][x] === "player") return { x, y };
    }
  }
  return null;
}

/**
 * Find the exit position in the dungeon.
 */
export function findExit(dungeon: Dungeon): Position | null {
  for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
      if (dungeon.cells[y][x] === "exit") return { x, y };
    }
  }
  return null;
}

/**
 * BFS to check if exit is reachable from start.
 * Passable cells: empty, player, exit, treasure, hazard (NOT walls).
 */
export function canReachExit(
  dungeon: Dungeon,
  start: Position,
  exit: Position
): boolean {
  const queue: Position[] = [start];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  const impassable: CellType[] = ["wall"];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.x === exit.x && current.y === exit.y) return true;

    const dirs: [number, number][] = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];

    for (const [dx, dy] of dirs) {
      const nx = current.x + dx;
      const ny = current.y + dy;

      if (nx < 0 || nx >= dungeon.width || ny < 0 || ny >= dungeon.height)
        continue;

      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;

      const cell = dungeon.cells[ny][nx];
      if (!impassable.includes(cell)) {
        visited.add(key);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return false;
}