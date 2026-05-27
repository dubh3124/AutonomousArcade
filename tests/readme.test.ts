/**
 * Tests: README.md Validation
 *
 * Validates that README.md meets all acceptance criteria for the
 * "README & Public Attribution Polish" ChangeSet.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const readmePath = resolve(__dirname, "..", "README.md");
const readme = readFileSync(readmePath, "utf-8");

/** Count sentences in a string by splitting on period-space or period at end */
function sentenceCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\.(?:\s|$)/).filter(Boolean).length;
}

/** Extract the game description section from the readme */
function extractGameSection(content: string): string {
  const match = content.match(/## Games\n([\s\S]*?)(?=\n## |\n# |$)/);
  return match ? match[1] : "";
}

/** Parse individual game entries from the games section */
function parseGameEntries(gamesSection: string): Map<string, string> {
  const entries = new Map<string, string>();
  const lines = gamesSection.split("\n");
  let currentGame = "";
  let currentDesc = "";
  for (const line of lines) {
    const gameMatch = line.match(/^### (.+)/);
    if (gameMatch) {
      if (currentGame && currentDesc) {
        entries.set(currentGame.trim(), currentDesc.trim());
      }
      currentGame = gameMatch[1];
      currentDesc = "";
    } else if (currentGame && line.trim()) {
      currentDesc += (currentDesc ? " " : "") + line.trim();
    }
  }
  if (currentGame && currentDesc) {
    entries.set(currentGame.trim(), currentDesc.trim());
  }
  return entries;
}

describe("README.md Acceptance Criteria", () => {
  // AC1: Project title 'Autonomous Arcade'
  it("AC1: contains project title 'Autonomous Arcade' as the H1 heading", () => {
    expect(readme).toMatch(/^#\s+Autonomous Arcade/m);
  });

  // AC2: Description of the arcade as a public browser arcade built by AEP
  it("AC2: describes the arcade as a public browser arcade built by the Autonomous Engineering Platform by CognicellAI", () => {
    expect(readme).toMatch(/public browser arcade/i);
    expect(readme).toMatch(/Autonomous Engineering Platform/i);
    expect(readme).toMatch(/CognicellAI/i);
  });

  // AC3: List of three games with one-sentence descriptions
  it("AC3: lists exactly three games: Reaction Rush, Word Grid, and Living Dungeon Mini", () => {
    const gameSection = extractGameSection(readme);
    const entries = parseGameEntries(gameSection);
    expect(entries.has("Reaction Rush"), "Reaction Rush must be listed").toBe(true);
    expect(entries.has("Word Grid"), "Word Grid must be listed").toBe(true);
    expect(entries.has("Living Dungeon Mini"), "Living Dungeon Mini must be listed").toBe(true);
    expect(entries.size, "Exactly 3 games must be listed").toBe(3);
  });

  it("AC3: each game has a one-sentence description", () => {
    const gameSection = extractGameSection(readme);
    const entries = parseGameEntries(gameSection);
    for (const [game, desc] of entries) {
      const count = sentenceCount(desc);
      expect(count, `${game} description must be exactly 1 sentence, got ${count}`).toBe(1);
    }
  });

  // AC4: Public deployment URL
  it("AC4: includes the public deployment URL", () => {
    expect(readme).toMatch(/https:\/\/dubh3124\.github\.io\/AutonomousArcade/);
  });

  // AC5: AEP/CognicellAI attribution consistent with site footer
  it("AC5: AEP/CognicellAI attribution is consistent with the site footer", () => {
    // The site footer uses: "Developed by the Autonomous Engineering Platform by CognicellAI"
    const footerAttribution = "Developed by the Autonomous Engineering Platform by CognicellAI";
    // README must contain text consistent with the footer attribution
    // Must reference CognicellAI and Autonomous Engineering Platform
    expect(readme).toMatch(/Developed by the Autonomous Engineering Platform by CognicellAI/);
    // Also check the "Built With AEP" section references the same
    expect(readme).toMatch(/Autonomous Engineering Platform/);
    expect(readme).toMatch(/CognicellAI/);
  });

  // AC6: Link or reference to build-log/changelog framing
  it("AC6: includes a link or reference to build-log/changelog", () => {
    expect(readme).toMatch(/Build Log|build.log|changelog/i);
    expect(readme).toMatch(/docs\/build-log\.md/);
  });
});