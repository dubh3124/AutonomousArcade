/**
 * Anonymous Player Identity
 *
 * Generates a UUID v4 on first visit and persists it in localStorage.
 * Subsequent visits return the stored ID.
 */

const STORAGE_KEY = "autonomous-arcade-player-id";

function generateUUIDv4(): string {
  // crypto.randomUUID() is available in all modern browsers and Node 19+
  // Fallback for environments that don't support it
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Manual UUID v4 generation fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getPlayerId(): string {
  let playerId = localStorage.getItem(STORAGE_KEY);
  if (!playerId) {
    playerId = generateUUIDv4();
    localStorage.setItem(STORAGE_KEY, playerId);
  }
  return playerId;
}

export function clearPlayerId(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getStorageKey(): string {
  return STORAGE_KEY;
}
