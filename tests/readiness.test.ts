import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

describe("Repository Readiness", () => {
    it("package.json should have packageManager field", () => {
        const pkgPath = resolve(__dirname, "../package.json");
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        expect(pkg.packageManager).toBeDefined();
        expect(pkg.packageManager).toMatch(/^npm@\d+/);
    });

    it("README.md or CONTRIBUTING.md should document the test command", () => {
        const readmePath = resolve(__dirname, "../README.md");
        const contributingPath = resolve(__dirname, "../CONTRIBUTING.md");
        
        let content = "";
        if (existsSync(readmePath)) {
            content += readFileSync(readmePath, "utf-8");
        }
        if (existsSync(contributingPath)) {
            content += readFileSync(contributingPath, "utf-8");
        }
        
        const testCommandRegex = /(npm test|npx vitest run)/;
        expect(content).toMatch(testCommandRegex);
    });
});
