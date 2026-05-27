import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

describe("Readiness Criteria", () => {
  it("package.json includes packageManager field", () => {
    const pkgPath = join(process.cwd(), "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    expect(pkg.packageManager).toBeDefined();
    expect(pkg.packageManager).toMatch(/^npm@10/);
  });

  it("test command is documented in README.md or CONTRIBUTING.md", () => {
    const readmePath = join(process.cwd(), "README.md");
    const contributingPath = join(process.cwd(), "CONTRIBUTING.md");
    
    let content = "";
    if (existsSync(readmePath)) {
      content += readFileSync(readmePath, "utf-8");
    }
    if (existsSync(contributingPath)) {
      content += readFileSync(contributingPath, "utf-8");
    }
    
    const testCommandRegex = /(npm test|npx vitest run)/i;
    expect(content).toMatch(testCommandRegex);
  });
});
