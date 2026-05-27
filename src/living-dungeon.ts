/**
 * Living Dungeon Mini - Game Engine
 *
 * Manages game state: player position, score, turns, encounters.
 * Delegates dungeon generation to the dungeon module.
 */

import {
  generateDungeon,
  findPlayerStart,
  type Dungeon,
  type CellType,
  type Position,
} from "./dungeon";
import { recordRun } from "./run-history";

export type Direction = "up" | "down" | "left" | "right";
export type GameStatus = "playing" | "won" | "dead";

export interface MoveResult {
  moved: boolean;
  encountered: CellType | null;
}

export interface GameState {
  dungeon: Dungeon;
  playerPos: Position;
  score: number;
  turns: number;
  status: GameStatus;
}

const TREASURE_SCORE = 10;
const HAZARD_PENALTY = 5;

/**
 * Create a new game instance with a freshly generated dungeon.
 */
export function createGame(): GameState {
  const dungeon = generateDungeon();
  const playerPos = findPlayerStart(dungeon);

  if (!playerPos) {
    throw new Error("Generated dungeon has no player start position");
  }

  return {
    dungeon,
    playerPos: { ...playerPos },
    score: 0,
    turns: 0,
    status: "playing",
  };
}

/**
 * Move the player in the given direction.
 * Returns details about what happened.
 */
export function movePlayer(
  state: GameState,
  direction: Direction
): MoveResult {
  if (state.status !== "playing") {
    return { moved: false, encountered: null };
  }

  const dx =
    direction === "left" ? -1 : direction === "right" ? 1 : 0;
  const dy = direction === "up" ? -1 : direction === "down" ? 1 : 0;

  const nx = state.playerPos.x + dx;
  const ny = state.playerPos.y + dy;

  // Check bounds
  if (
    nx < 0 ||
    nx >= state.dungeon.width ||
    ny < 0 ||
    ny >= state.dungeon.height
  ) {
    return { moved: false, encountered: null };
  }

  const targetCell = state.dungeon.cells[ny][nx];

  // Cannot walk into walls
  if (targetCell === "wall") {
    return { moved: false, encountered: null };
  }

  // Move player
  state.playerPos.x = nx;
  state.playerPos.y = ny;
  state.turns += 1;

  // Handle encounters
  let encountered: CellType = targetCell;

  if (targetCell === "treasure") {
    state.score += TREASURE_SCORE;
    // Replace treasure with empty floor after pickup
    state.dungeon.cells[ny][nx] = "empty";
  } else if (targetCell === "hazard") {
    state.score -= HAZARD_PENALTY;
    // Hazard can be fatal: if score drops below 0, player dies
    if (state.score < 0) {
      state.score = 0;
      state.status = "dead";
    }
    // Record run immediately if dead
    if (state.status === "dead") {
        recordRun(state.score);
    }
    // Replace hazard with empty floor
    state.dungeon.cells[ny][nx] = "empty";
  } else if (targetCell === "exit") {
    state.status = "won";
    recordRun(state.score);
  }

  return { moved: true, encountered };
}

/**
 * Get the current score.
 */
export function getScore(state: GameState): number {
  return state.score;
}

/**
 * Get the current turn count.
 */
export function getTurns(state: GameState): number {
  return state.turns;
}

/**
 * Get the current game status.
 */
export function getStatus(state: GameState): GameStatus {
  return state.status;
}

/**
 * Get a defensive copy of the dungeon state for rendering.
 */
export function getDungeonState(state: GameState): Dungeon {
  return state.dungeon;
}

/**
 * Get the current player position.
 */
export function getPlayerPosition(state: GameState): Position {
  return { ...state.playerPos };
}