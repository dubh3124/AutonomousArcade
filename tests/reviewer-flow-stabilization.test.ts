
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Product Reviewer Flow Stabilization", () => {
  it("verifies the base path in index.html is compatible with the live environment", () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf8");
    // The live environment at https://dubh3124.github.io/AutonomousArcade/ fails to render buttons.
    // This is because the absolute path "/src/main.ts" resolves to https://dubh3124.github.io/src/main.ts (404)
    // instead of https://dubh3124.github.io/AutonomousArcade/src/main.ts
    // In dev mode, Vite serves from root, but for production/GH Pages, absolute paths in index.html are risky.
    expect(html).not.toContain('src="/src/main.ts"');
    expect(html).toContain('src="./src/main.ts"');
  });

  it("ensures core shell elements exist for rendering", () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf8");
    expect(html).toContain('id="app"');
    expect(html).toContain('id="game-hub"');
  });
});
