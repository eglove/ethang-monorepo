import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { TrainerInputSchema } from "./trainer-input.ts";

const VALID_STEP_DESCRIPTION = "parses a complete valid implementation step";
const INVALID_STEP_ZERO_DESCRIPTION =
  "throws ZodError when step number is 0 (must be >= 1)";
const EMPTY_FILES_DESCRIPTION =
  "throws ZodError when files array is empty (must touch at least one file)";
const MISSING_ACTION_DESCRIPTION =
  "throws ZodError when a file entry is missing the action field";
const NO_TLA_COVERAGE_DESCRIPTION =
  "throws ZodError when TLA+ coverage has no spec elements";
const EMPTY_DEPENDENCIES_DESCRIPTION =
  "parses an input with empty dependencies array (valid for Step 1)";

const validFixture = {
  dependencies: [1, 2],
  description: "Create the trainer-input schema and its tests",
  files: [
    { action: "create" as const, path: "src/schemas/trainer-input.ts" },
    { action: "modify" as const, path: "src/index.ts" },
  ],
  stepNumber: 3,
  testDescription:
    "Validate schema parsing for complete, invalid, and edge-case inputs",
  title: "Trainer-writer input contract schema",
  tlaCoverage: {
    invariants: ["TypeInvariant"],
    properties: [],
    states: ["Draft", "Submitted"],
    transitions: ["CreateOrder"],
  },
};

describe("TrainerInputSchema", () => {
  it(VALID_STEP_DESCRIPTION, () => {
    const result = TrainerInputSchema.parse(validFixture);

    expect(result).toStrictEqual(validFixture);
  });

  it(INVALID_STEP_ZERO_DESCRIPTION, () => {
    const input = { ...validFixture, stepNumber: 0 };

    expect(() => {
      TrainerInputSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(EMPTY_FILES_DESCRIPTION, () => {
    const input = { ...validFixture, files: [] };

    expect(() => {
      TrainerInputSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(MISSING_ACTION_DESCRIPTION, () => {
    const input = {
      ...validFixture,
      files: [{ path: "src/schemas/trainer-input.ts" }],
    };

    expect(() => {
      TrainerInputSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(NO_TLA_COVERAGE_DESCRIPTION, () => {
    const input = {
      ...validFixture,
      tlaCoverage: {
        invariants: [],
        properties: [],
        states: [],
        transitions: [],
      },
    };

    expect(() => {
      TrainerInputSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(EMPTY_DEPENDENCIES_DESCRIPTION, () => {
    const input = { ...validFixture, dependencies: [] };
    const result = TrainerInputSchema.parse(input);

    expect(result.dependencies).toStrictEqual([]);
  });
});
