import isEqual from "lodash/isEqual.js";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { TrainerInputSchema } from "../trainer-input.ts";
import { CodeWriterInputSchema } from "./code-writer-input.ts";

const VALID_INPUT_DESCRIPTION = "parses a complete valid input with all fields";
const STEP_ZERO_DESCRIPTION =
  "throws ZodError when stepNumber is 0 (must be >= 1)";
const EMPTY_FILES_DESCRIPTION = "throws ZodError when files array is empty";
const EMPTY_TLA_COVERAGE_DESCRIPTION =
  "throws ZodError when tlaCoverage has all empty arrays";
const EMPTY_DEPENDENCIES_DESCRIPTION =
  "parses input with empty dependencies array (valid for Step 1)";
const DEPRECATED_REEXPORT_DESCRIPTION =
  "TrainerInputSchema (deprecated re-export) parses the same fixture identically";

const validFixture = {
  dependencies: [1, 2],
  description: "Create the code-writer-input schema and its tests",
  files: [
    {
      action: "create" as const,
      path: "src/contracts/shared/code-writer-input.ts",
    },
    { action: "modify" as const, path: "src/index.ts" },
  ],
  stepNumber: 3,
  testDescription:
    "Validate schema parsing for complete, invalid, and edge-case inputs",
  title: "Code-writer input contract schema",
  tlaCoverage: {
    invariants: ["TypeInvariant"],
    properties: [],
    states: ["Draft", "Submitted"],
    transitions: ["CreateOrder"],
  },
};

describe("CodeWriterInputSchema", () => {
  it(VALID_INPUT_DESCRIPTION, () => {
    const result = CodeWriterInputSchema.parse(validFixture);

    expect(result).toStrictEqual(validFixture);
  });

  it(STEP_ZERO_DESCRIPTION, () => {
    const input = { ...validFixture, stepNumber: 0 };

    expect(() => {
      CodeWriterInputSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(EMPTY_FILES_DESCRIPTION, () => {
    const input = { ...validFixture, files: [] };

    expect(() => {
      CodeWriterInputSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(EMPTY_TLA_COVERAGE_DESCRIPTION, () => {
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
      CodeWriterInputSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(EMPTY_DEPENDENCIES_DESCRIPTION, () => {
    const input = { ...validFixture, dependencies: [] };
    const result = CodeWriterInputSchema.parse(input);

    expect(result.dependencies).toStrictEqual([]);
  });

  it(DEPRECATED_REEXPORT_DESCRIPTION, () => {
    const codeWriterResult = CodeWriterInputSchema.parse(validFixture);
    const trainerResult = TrainerInputSchema.parse(validFixture);

    expect(isEqual(codeWriterResult, trainerResult)).toBe(true);
  });
});
