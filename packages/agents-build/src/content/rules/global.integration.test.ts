import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { compile } from "../../compiler-core.ts";
import { GLOBAL_RULES } from "./global.ts";

describe("global rules integration tests", () => {
  let temporaryDirectory = "";

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), "rules-integration-"));
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  it("compiles rules and writes them to the temporary directory", () => {
    const rulesDirectory = path.join(temporaryDirectory, "rules");
    const manifestPath = path.join(temporaryDirectory, "manifest.json");

    expect(() => {
      compile({
        manifestPath,
        rootDir: temporaryDirectory,
        rules: GLOBAL_RULES,
        rulesDir: rulesDirectory
      });
    }).not.toThrow();

    const generatedRulePath = path.join(rulesDirectory, "lint.md");
    expect(existsSync(generatedRulePath)).toBe(true);
    const ruleContent = readFileSync(generatedRulePath, "utf8");
    expect(ruleContent).toContain("trigger: model_decision");
    expect(ruleContent).toContain("Linting and TypeScript Rules");
  });
});
