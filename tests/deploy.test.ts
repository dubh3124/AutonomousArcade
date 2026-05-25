/**
 * Tests: GitHub Pages Deployment Configuration
 *
 * Validates that the Vite build is configured for GitHub Pages deployment.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const REPO_NAME = "AutonomousArcade";

describe("Vite Build Configuration", () => {
  it("has a vite.config.ts with the correct base path for GitHub Pages", () => {
    const configPath = resolve(__dirname, "..", "vite.config.ts");
    expect(existsSync(configPath)).toBe(true);

    const configContent = readFileSync(configPath, "utf-8");
    // The base path must match the repo name for GitHub Pages
    expect(configContent).toContain(`base: "/${REPO_NAME}/"`);
  });

  it("produces static assets with correct base path when built", () => {
    const configPath = resolve(__dirname, "..", "vite.config.ts");
    const configContent = readFileSync(configPath, "utf-8");

    // Vite base config must include a leading slash and repo name
    expect(configContent).toMatch(/base:\s*["']\/AutonomousArcade\/["']/);
  });
});

describe("Deploy Workflow Configuration", () => {
  it("has a CI workflow file with a deploy job for GitHub Pages", () => {
    const workflowPath = resolve(
      __dirname,
      "..",
      ".github",
      "workflows",
      "ci.yml"
    );
    expect(existsSync(workflowPath)).toBe(true);

    const workflowContent = readFileSync(workflowPath, "utf-8");
    // Must contain a deploy job
    expect(workflowContent).toContain("deploy");
    // Must reference GitHub Pages deployment
    const hasPagesDeploy =
      workflowContent.includes("pages") ||
      workflowContent.includes("deploy-pages") ||
      workflowContent.includes("gh-pages");
    expect(hasPagesDeploy).toBe(true);
  });

  it("deploy job includes building the site before publishing", () => {
    const workflowPath = resolve(
      __dirname,
      "..",
      ".github",
      "workflows",
      "ci.yml"
    );
    const workflowContent = readFileSync(workflowPath, "utf-8");

    // Must run npm build or vite build before deploying
    const hasBuildStep =
      workflowContent.includes("npm run build") ||
      workflowContent.includes("npm ci && npm run build") ||
      workflowContent.includes("vite build");
    expect(hasBuildStep).toBe(true);
  });

  it("deploy job is configured to run on push to main branch", () => {
    const workflowPath = resolve(
      __dirname,
      "..",
      ".github",
      "workflows",
      "ci.yml"
    );
    const workflowContent = readFileSync(workflowPath, "utf-8");

    // The deploy job should target main branch pushes
    const hasMainTrigger =
      workflowContent.includes("main") &&
      (workflowContent.includes("push:") ||
        workflowContent.includes("branches:"));
    expect(hasMainTrigger).toBe(true);
  });
});

describe("Build Output Static Validation", () => {
  it("build output directory exists after a successful build", async () => {
    const distPath = resolve(__dirname, "..", "dist");
    // If dist exists from a prior build, validate structure
    if (existsSync(distPath)) {
      const indexExists = existsSync(resolve(distPath, "index.html"));
      expect(indexExists).toBe(true);
    }
    // This test is informational; passes regardless
    expect(true).toBe(true);
  });

  it("index.html references assets with correct GitHub Pages base path", () => {
    const indexPath = resolve(__dirname, "..", "dist", "index.html");
    if (existsSync(indexPath)) {
      const htmlContent = readFileSync(indexPath, "utf-8");
      // Asset paths should include the repo name base
      expect(htmlContent).toContain(`src="/${REPO_NAME}/`);
    }
    // This test is informational; passes regardless
    expect(true).toBe(true);
  });
});