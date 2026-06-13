import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { compile } from "../../compiler-core.ts";
import { GLOBAL_RULES } from "../rules/global.ts";
import { SKILLS } from "./index.ts";

describe("eslintFixerSkill integration tests", () => {
  let temporaryDirectory = "";

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(
      path.join(tmpdir(), "eslint-fixer-integration-")
    );
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  it("compiles eslint-fixer skill and writes it to the temporary directory", () => {
    const rulesDirectory = path.join(temporaryDirectory, "rules");
    const skillsDirectory = path.join(temporaryDirectory, "skills");
    const manifestPath = path.join(temporaryDirectory, "manifest.json");

    expect(() => {
      compile({
        manifestPath,
        rootDir: temporaryDirectory,
        rules: GLOBAL_RULES,
        rulesDir: rulesDirectory,
        skills: SKILLS,
        skillsDir: skillsDirectory
      });
    }).not.toThrow();

    const generatedSkillPath = path.join(
      skillsDirectory,
      "eslint-fixer",
      "SKILL.md"
    );

    expect(existsSync(generatedSkillPath)).toBe(true);

    const content = readFileSync(generatedSkillPath, "utf8");
    // Frontmatter check
    expect(content).toContain("name: eslint-fixer");
    expect(content).toContain("description:");
  });
});
