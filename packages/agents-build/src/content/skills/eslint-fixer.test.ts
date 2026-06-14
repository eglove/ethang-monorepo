import noop from "lodash/noop.js";
import { describe, expect, it, vi } from "vitest";

import { compile, fsProxy } from "../../compiler-core.ts";
import { eslintFixerSkill } from "./eslint-fixer.ts";
import { SKILLS } from "./index.ts";

describe("eslintFixerSkill unit tests", () => {
  it("is present in SKILLS array", () => {
    expect(SKILLS).toContain(eslintFixerSkill);
  });

  it("does not exceed 12,000 characters in content length", () => {
    expect(eslintFixerSkill.content.length).toBeLessThanOrEqual(12_000);
  });

  it("does not contain the forbidden word 'Angular' (case-insensitive)", () => {
    expect(/angular/iu.test(eslintFixerSkill.content)).toBe(false);
  });

  const styleGuidelines = [
    "Yoda comparisons",
    "Arrow function blocks",
    "Arrow functions",
    "Explicit member accessibility",
    "typescript type definitions",
    "consistent-type-imports",
    "isNil",
    "lodash/",
    "React 19 rules",
    "Ng signals and DI",
    "Vitest spec checks"
  ];

  it.each(styleGuidelines)(
    "contains key style/quality guideline: %s",
    (guideline) => {
      expect(eslintFixerSkill.content).toContain(guideline);
    }
  );

  const conflictSolutions = [
    "lodash noop for mocking",
    "use lodash over native array methods",
    "use isNil, isString instead of !!",
    "perfectionist object sorting vs partition comments"
  ];

  it.each(conflictSolutions)(
    "contains linter conflict solution: %s",
    (solution) => {
      expect(eslintFixerSkill.content).toContain(solution);
    }
  );

  describe("skill compilation", () => {
    it("should compile eslintFixerSkill successfully", () => {
      const existsMock = vi.spyOn(fsProxy, "existsSync").mockReturnValue(false);
      const mkdirMock = vi
        .spyOn(fsProxy, "mkdirSync")
        .mockImplementation(() => {
          const stubValue = "stub";
          return fsProxy.existsSync(stubValue) ? "" : undefined;
        });
      const readdirMock = vi.spyOn(fsProxy, "readdirSync").mockReturnValue([]);
      const readMock = vi.spyOn(fsProxy, "readFileSync").mockReturnValue("");
      const writeMock = vi
        .spyOn(fsProxy, "writeFileSync")
        .mockImplementation(noop);
      const rmSyncMock = vi.spyOn(fsProxy, "rmSync").mockImplementation(noop);

      expect(() => {
        compile({
          manifestPath: "/fake/agents/.manifest.json",
          rootDir: "/fake",
          rules: [],
          rulesDir: "/fake/agents/rules",
          skills: [eslintFixerSkill],
          skillsDir: "/fake/agents/skills"
        });
      }).not.toThrow();

      // Verify that writeFileSync was called to write the compiled skill MD file
      expect(writeMock).toHaveBeenCalled();

      existsMock.mockRestore();
      mkdirMock.mockRestore();
      readdirMock.mockRestore();
      readMock.mockRestore();
      writeMock.mockRestore();
      rmSyncMock.mockRestore();
    });
  });
});
