import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { CodeWriterOutputSchema } from "./code-writer-output.ts";

const SAMPLE_FILE = "src/foo.ts";
const VALID_OUTPUT_DESCRIPTION = "parses a valid code writer output";
const EMPTY_FILES_DESCRIPTION = "throws ZodError when filesWritten is empty";
const ZERO_CYCLES_DESCRIPTION = "throws ZodError when tddCycles is 0";
const MISSING_TESTS_PASS_DESCRIPTION =
  "throws ZodError when testsPass is missing";

describe("CodeWriterOutputSchema", () => {
  it(VALID_OUTPUT_DESCRIPTION, () => {
    const input = {
      filesWritten: [SAMPLE_FILE],
      tddCycles: 1,
      testsPass: true,
    };
    const result = CodeWriterOutputSchema.parse(input);

    expect(result).toStrictEqual(input);
  });

  it(EMPTY_FILES_DESCRIPTION, () => {
    const input = { filesWritten: [], tddCycles: 1, testsPass: true };

    expect(() => {
      CodeWriterOutputSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(ZERO_CYCLES_DESCRIPTION, () => {
    const input = {
      filesWritten: [SAMPLE_FILE],
      tddCycles: 0,
      testsPass: true,
    };

    expect(() => {
      CodeWriterOutputSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(MISSING_TESTS_PASS_DESCRIPTION, () => {
    const input = { filesWritten: [SAMPLE_FILE], tddCycles: 1 };

    expect(() => {
      CodeWriterOutputSchema.parse(input);
    }).toThrow(ZodError);
  });
});
