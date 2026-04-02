import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { TestWriterOutputSchema } from "./test-writer-output.ts";

const VALID_OUTPUT_DESCRIPTION = "parses a valid test writer output";
const EMPTY_FILES_DESCRIPTION =
  "throws ZodError when testFilesWritten is empty";
const ZERO_COUNT_DESCRIPTION = "throws ZodError when testCount is 0";

describe("TestWriterOutputSchema", () => {
  it(VALID_OUTPUT_DESCRIPTION, () => {
    const input = {
      allPass: true,
      testCount: 3,
      testFilesWritten: ["src/foo.test.ts"],
    };
    const result = TestWriterOutputSchema.parse(input);

    expect(result).toStrictEqual(input);
  });

  it(EMPTY_FILES_DESCRIPTION, () => {
    const input = { allPass: true, testCount: 3, testFilesWritten: [] };

    expect(() => {
      TestWriterOutputSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(ZERO_COUNT_DESCRIPTION, () => {
    const input = {
      allPass: true,
      testCount: 0,
      testFilesWritten: ["src/foo.test.ts"],
    };

    expect(() => {
      TestWriterOutputSchema.parse(input);
    }).toThrow(ZodError);
  });
});
