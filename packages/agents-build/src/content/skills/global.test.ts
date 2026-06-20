import { generateMarkdown } from "@ethang/markdown-generator/markdown-generator.js";
import find from "lodash/find.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import { describe, expect, it } from "vitest";

import { GLOBAL_SKILLS } from "./global.ts";

const getSkillContent = (skill: any): string => {
  if (isNil(skill?.content)) {
    return "";
  }
  return isString(skill.content)
    ? skill.content
    : generateMarkdown({ blocks: skill.content });
};

describe("GLOBAL_SKILLS verification", () => {
  it("should contain the sdlc skill with all 6 merged phases and subagent instructions", () => {
    const sdlc = find(GLOBAL_SKILLS, (skill) => {
      return "sdlc" === skill.name;
    });

    expect(sdlc).toBeDefined();
    expect(sdlc?.name).toBe("sdlc");

    const content = getSkillContent(sdlc);
    expect(content).toContain("Phase 1: Requirements & Analysis");
    expect(content).toContain("Phase 2: Architecture & Design");
    expect(content).toContain("Phase 3: Implementation & Development");
    expect(content).toContain("Phase 4: Verification & Testing");
    expect(content).toContain("Phase 5: Release & Deployment");
    expect(content).toContain("Phase 6: Maintenance & Operations");

    expect(content).toContain("execute all phases in the main window");
  });

  it("should contain the swebok skill with resources", () => {
    const swebok = find(GLOBAL_SKILLS, (skill) => {
      return "swebok" === skill.name;
    });

    expect(swebok).toBeDefined();
    expect(swebok?.name).toBe("swebok");
    expect(swebok?.resources).toBeDefined();
    expect(swebok?.resources?.length).toBe(110);
  });

  it("should contain the ddd skill with resources", () => {
    const dddSkill = find(GLOBAL_SKILLS, (skill) => {
      return "ddd" === skill.name;
    });

    expect(dddSkill).toBeDefined();
    expect(dddSkill?.name).toBe("ddd");
    expect(dddSkill?.resources).toBeDefined();
    expect(dddSkill?.resources?.length).toBe(6);
  });

  it("should contain the commit skill", () => {
    const commitSkill = find(GLOBAL_SKILLS, (skill) => {
      return "commit" === skill.name;
    });

    expect(commitSkill).toBeDefined();
    expect(commitSkill?.name).toBe("commit");

    const content = getSkillContent(commitSkill);
    expect(content).toContain(
      "Git Staging and Commit Workflow Guide (/commit)"
    );
    expect(content).toContain("Conventional Commits specification");
    expect(content).toContain("RFC 2119");
  });

  it("should contain the lint skill", () => {
    const lintSkill = find(GLOBAL_SKILLS, (skill) => {
      return "lint" === skill.name;
    });

    expect(lintSkill).toBeDefined();
    expect(lintSkill?.name).toBe("lint");

    const content = getSkillContent(lintSkill);
    expect(content).toContain("ESLint Fixer and Config Manager (/lint)");
  });

  it("should have exactly thirteen registered skills", () => {
    expect(GLOBAL_SKILLS).toHaveLength(13);
  });
});
