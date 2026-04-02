import { describe, expect, it } from "vitest";

import {
  TypescriptWriterInputSchema,
  TypescriptWriterOutputSchema,
} from "./typescript-writer.ts";

const VALID_INPUT_DESCRIPTION =
  "parses a valid input via TypescriptWriterInputSchema";
const VALID_OUTPUT_DESCRIPTION =
  "parses a valid output via TypescriptWriterOutputSchema";

const validInput = {
  dependencies: [1],
  description: "Implement the user entity",
  files: [{ action: "create" as const, path: "src/domain/user.ts" }],
  stepNumber: 1,
  testDescription: "Validate user entity creation",
  title: "User entity",
  tlaCoverage: {
    invariants: ["TypeInvariant"],
    properties: [],
    states: ["Active"],
    transitions: ["CreateUser"],
  },
};

const validOutput = {
  filesWritten: ["src/domain/user.ts"],
  tddCycles: 2,
  testsPass: true,
};

describe("TypescriptWriterInputSchema", () => {
  it(VALID_INPUT_DESCRIPTION, () => {
    const result = TypescriptWriterInputSchema.parse(validInput);

    expect(result).toStrictEqual(validInput);
  });
});

describe("TypescriptWriterOutputSchema", () => {
  it(VALID_OUTPUT_DESCRIPTION, () => {
    const result = TypescriptWriterOutputSchema.parse(validOutput);

    expect(result).toStrictEqual(validOutput);
  });
});
