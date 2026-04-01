import get from "lodash/get.js";
import includes from "lodash/includes.js";
import map from "lodash/map.js";
import some from "lodash/some.js";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { TrainerInputSchema } from "./trainer-input.ts";
import { TrainerOutputSchema } from "./trainer-output.ts";

const getZodPaths = (error: unknown): string[] => {
  if (error instanceof ZodError) {
    return map(error.issues, (issue) => {
      return issue.path.join(".");
    });
  }

  return [];
};

const FRONTMATTER_PATH = "frontmatter";
const SECTIONS_PATH = "sections";
const SKILL_ARTIFACT_TYPE = "skill";

const validFrontmatter = {
  description: "A code review skill",
  name: "code-review",
};

const validHandoff = {
  passes: "Review report markdown",
  passesTo: "implementation-writer",
};

const validManifest = [
  {
    action: "create" as const,
    filePath: ".claude/skills/code-review/SKILL.md",
  },
];

const validSections = [{ heading: "## When to Use", required: true }];

const validTrainerOutput = {
  // @ts-expect-error for test
  artifactType: SKILL_ARTIFACT_TYPE as const,
  frontmatter: validFrontmatter,
  handoff: validHandoff,
  manifest: validManifest,
  noTbdPlaceholders: true as const,
  sections: validSections,
};

const validTrainerInput = {
  dependencies: [1],
  description: "Create the trainer-input schema",
  files: [{ action: "create" as const, path: "src/schemas/trainer-input.ts" }],
  stepNumber: 2,
  testDescription: "Validate schema parsing",
  title: "Trainer input contract",
  tlaCoverage: {
    invariants: ["TypeInvariant"],
    properties: [],
    states: ["Draft"],
    transitions: ["CreateOrder"],
  },
};

describe("contract validation failures", () => {
  it("rejects trainer output with null frontmatter and ZodError path includes frontmatter", () => {
    const input = { ...validTrainerOutput, frontmatter: null };

    try {
      TrainerOutputSchema.parse(input);
      expect.unreachable("should have thrown");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ZodError);
      const paths = getZodPaths(error);

      expect(
        some(paths, (p) => {
          return includes(p, FRONTMATTER_PATH);
        }),
      ).toBe(true);
    }
  });

  it("rejects trainer output with sections as string instead of array", () => {
    const input = { ...validTrainerOutput, sections: "not-an-array" };

    try {
      TrainerOutputSchema.parse(input);
      expect.unreachable("should have thrown");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ZodError);
      const paths = getZodPaths(error);

      expect(
        some(paths, (p) => {
          return includes(p, SECTIONS_PATH);
        }),
      ).toBe(true);
    }
  });

  it("accepts trainer input with backslashes in file path (structural validation only)", () => {
    const input = {
      ...validTrainerInput,
      files: [
        {
          action: "create" as const,
          path: String.raw`src\schemas\trainer-input.ts`,
        },
      ],
    };

    const result = TrainerInputSchema.parse(input);

    expect(get(result, ["files", 0, "path"])).toBe(
      String.raw`src\schemas\trainer-input.ts`,
    );
  });

  it("demonstrates retry pattern: two failures then corrected fixture passes", () => {
    const invalidFixture = { ...validTrainerOutput, frontmatter: null };
    const maxContractRetries = 1;
    const errors: ZodError[] = [];

    for (let attempt = 0; attempt <= maxContractRetries; attempt += 1) {
      try {
        TrainerOutputSchema.parse(invalidFixture);
      } catch (error: unknown) {
        if (error instanceof ZodError) {
          errors.push(error);
        }
      }
    }

    expect(errors).toHaveLength(2);

    const correctedFixture = { ...validTrainerOutput };
    const result = TrainerOutputSchema.parse(correctedFixture);

    expect(result).toStrictEqual(correctedFixture);
  });

  it("rejects completely empty object with ZodError", () => {
    expect(() => {
      TrainerOutputSchema.parse({});
    }).toThrow(ZodError);
  });
});
