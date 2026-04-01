import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { TrainerOutputSchema } from "../index.ts";

const VALID_SKILL_DESCRIPTION =
  "parses a complete valid SKILL.md-shaped output";
const MISSING_HANDOFF_DESCRIPTION =
  "throws ZodError when handoff contract is missing for a skill";
const EMPTY_MANIFEST_DESCRIPTION =
  "throws ZodError when file manifest is empty";
const MISSING_SECTIONS_DESCRIPTION =
  "throws ZodError identifying missing sections when frontmatter present but sections missing";
const VALID_AGENT_DESCRIPTION =
  "parses a valid AGENT.md-shaped output with different required sections";

const SKILL_ARTIFACT_TYPE = "skill";
const SKILL_DESCRIPTION = "A code review skill";
const SKILL_NAME = "code-review";
const SKILL_FILE_PATH = ".claude/skills/code-review/SKILL.md";
const CREATE_ACTION = "create";
const REVIEW_PASSES = "Review report markdown";
const IMPLEMENTATION_WRITER = "implementation-writer";
const WHEN_TO_USE_HEADING = "## When to Use";

const validSkillFrontmatter = {
  description: SKILL_DESCRIPTION,
  name: SKILL_NAME,
};

const validSkillHandoff = {
  passes: REVIEW_PASSES,
  passesTo: IMPLEMENTATION_WRITER,
};

const validSkillManifest = [
  { action: CREATE_ACTION, filePath: SKILL_FILE_PATH },
];

const requiredSection = { heading: WHEN_TO_USE_HEADING, required: true };

describe("TrainerOutputSchema", () => {
  it(VALID_SKILL_DESCRIPTION, () => {
    const input = {
      artifactType: SKILL_ARTIFACT_TYPE,
      frontmatter: validSkillFrontmatter,
      handoff: validSkillHandoff,
      manifest: validSkillManifest,
      noTbdPlaceholders: true,
      sections: [requiredSection, { heading: "## Process", required: true }],
    };
    const result = TrainerOutputSchema.parse(input);

    expect(result).toStrictEqual(input);
  });

  it(MISSING_HANDOFF_DESCRIPTION, () => {
    const input = {
      artifactType: SKILL_ARTIFACT_TYPE,
      frontmatter: validSkillFrontmatter,
      manifest: validSkillManifest,
      noTbdPlaceholders: true,
      sections: [requiredSection],
    };

    expect(() => {
      TrainerOutputSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(EMPTY_MANIFEST_DESCRIPTION, () => {
    const input = {
      artifactType: SKILL_ARTIFACT_TYPE,
      frontmatter: validSkillFrontmatter,
      handoff: validSkillHandoff,
      manifest: [],
      noTbdPlaceholders: true,
      sections: [requiredSection],
    };

    expect(() => {
      TrainerOutputSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(MISSING_SECTIONS_DESCRIPTION, () => {
    const input = {
      artifactType: SKILL_ARTIFACT_TYPE,
      frontmatter: validSkillFrontmatter,
      handoff: validSkillHandoff,
      manifest: validSkillManifest,
      noTbdPlaceholders: true,
      sections: [],
    };

    expect(() => {
      TrainerOutputSchema.parse(input);
    }).toThrow(ZodError);

    try {
      TrainerOutputSchema.parse(input);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ZodError);
      expect(String(error)).toContain("sections");
    }
  });

  it("parses a valid hook artifact without handoff contract", () => {
    const input = {
      artifactType: "hook",
      frontmatter: {
        description: "Pre-commit quality check hook",
        name: "quality-check",
      },
      manifest: [
        { action: CREATE_ACTION, filePath: ".claude/hooks/quality-check.sh" },
      ],
      noTbdPlaceholders: true,
      sections: [requiredSection],
    };
    const result = TrainerOutputSchema.parse(input);

    expect(result).toStrictEqual(input);
  });

  it(VALID_AGENT_DESCRIPTION, () => {
    const input = {
      artifactType: "agent",
      frontmatter: {
        description: "An implementation writer agent",
        name: IMPLEMENTATION_WRITER,
      },
      handoff: {
        passes: "Generated source files",
        passesTo: "code-reviewer",
      },
      manifest: [
        {
          action: CREATE_ACTION,
          filePath: ".claude/agents/implementation-writer/AGENT.md",
        },
        { action: "modify", filePath: ".claude/settings.json" },
      ],
      noTbdPlaceholders: true,
      sections: [
        { heading: "## Role", required: true },
        { heading: "## Capabilities", required: true },
        { heading: "## Constraints", required: false },
      ],
    };
    const result = TrainerOutputSchema.parse(input);

    expect(result).toStrictEqual(input);
  });
});
