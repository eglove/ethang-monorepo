import omit from "lodash/omit.js";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  VitestWriterInputSchema,
  VitestWriterOutputSchema,
} from "./vitest-writer.ts";

const VALID_INPUT_DESCRIPTION =
  "parses a valid input with codeWriter via VitestWriterInputSchema";
const MISSING_CODE_WRITER_DESCRIPTION =
  "throws ZodError when codeWriter is missing";
const VALID_OUTPUT_DESCRIPTION =
  "parses a valid output via VitestWriterOutputSchema";

const validInput = {
  codeWriter: "typescript-writer",
  dependencies: [1],
  description: "Write unit tests for the user entity",
  files: [{ action: "create" as const, path: "src/domain/user.test.ts" }],
  stepNumber: 2,
  testDescription: "Validate user entity test coverage",
  title: "User entity tests",
  tlaCoverage: {
    invariants: ["TypeInvariant"],
    properties: [],
    states: ["Active"],
    transitions: ["CreateUser"],
  },
};

const validOutput = {
  allPass: true,
  testCount: 5,
  testFilesWritten: ["src/domain/user.test.ts"],
};

describe("VitestWriterInputSchema", () => {
  it(VALID_INPUT_DESCRIPTION, () => {
    const result = VitestWriterInputSchema.parse(validInput);

    expect(result).toStrictEqual(validInput);
  });

  it(MISSING_CODE_WRITER_DESCRIPTION, () => {
    expect(() => {
      VitestWriterInputSchema.parse(omit(validInput, ["codeWriter"]));
    }).toThrow(ZodError);
  });
});

describe("VitestWriterOutputSchema", () => {
  it(VALID_OUTPUT_DESCRIPTION, () => {
    const result = VitestWriterOutputSchema.parse(validOutput);

    expect(result).toStrictEqual(validOutput);
  });
});
