import { describe, expect, it } from "vitest";

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
});
