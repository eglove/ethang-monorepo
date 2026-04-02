import omit from "lodash/omit.js";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  PlaywrightWriterInputSchema,
  PlaywrightWriterOutputSchema,
} from "./playwright-writer.ts";

const VALID_INPUT_DESCRIPTION =
  "parses a valid input with codeWriter via PlaywrightWriterInputSchema";
const MISSING_CODE_WRITER_DESCRIPTION =
  "throws ZodError when codeWriter is missing";
const VALID_OUTPUT_DESCRIPTION =
  "parses a valid output via PlaywrightWriterOutputSchema";

const validInput = {
  codeWriter: "hono-writer",
  dependencies: [1, 2],
  description: "Write e2e tests for login flow",
  files: [{ action: "create" as const, path: "tests/login.spec.ts" }],
  stepNumber: 4,
  testDescription: "Validate login e2e test coverage",
  title: "Login e2e tests",
  tlaCoverage: {
    invariants: [],
    properties: ["EventualCompletion"],
    states: ["LoggedOut", "LoggedIn"],
    transitions: ["Login"],
  },
};

const validOutput = {
  allPass: true,
  testCount: 3,
  testFilesWritten: ["tests/login.spec.ts"],
};

describe("PlaywrightWriterInputSchema", () => {
  it(VALID_INPUT_DESCRIPTION, () => {
    const result = PlaywrightWriterInputSchema.parse(validInput);

    expect(result).toStrictEqual(validInput);
  });

  it(MISSING_CODE_WRITER_DESCRIPTION, () => {
    expect(() => {
      PlaywrightWriterInputSchema.parse(omit(validInput, ["codeWriter"]));
    }).toThrow(ZodError);
  });
});

describe("PlaywrightWriterOutputSchema", () => {
  it(VALID_OUTPUT_DESCRIPTION, () => {
    const result = PlaywrightWriterOutputSchema.parse(validOutput);

    expect(result).toStrictEqual(validOutput);
  });
});
