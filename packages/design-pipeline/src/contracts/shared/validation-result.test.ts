import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { ValidationResultSchema } from "./validation-result.ts";

const VALID_TRUE_EMPTY_ERRORS = "parses valid=true with empty errors";
const VALID_FALSE_WITH_ERRORS = "parses valid=false with non-empty errors";
const FAILS_VALID_FALSE_EMPTY_ERRORS =
  "fails refine when valid=false but errors is empty";
const FAILS_VALID_TRUE_WITH_ERRORS =
  "fails refine when valid=true but errors is non-empty";
const FAILS_EMPTY_CODE = "fails when error code is empty string";
const PARSES_STRUCTURAL_CODE = "parses structural error code";
const PARSES_HEURISTIC_CODE = "parses heuristic error code";

const SAMPLE_ERROR = {
  code: "HEURISTIC_MISSING_EXPERT",
  expected: "expert-tdd, expert-ddd",
  hint: "Debate synthesis must include all selected experts",
  path: "experts",
  received: "expert-tdd",
};

describe("ValidationResultSchema", () => {
  it(VALID_TRUE_EMPTY_ERRORS, () => {
    const input = { errors: [], valid: true };
    const result = ValidationResultSchema.parse(input);

    expect(result).toStrictEqual(input);
  });

  it(VALID_FALSE_WITH_ERRORS, () => {
    const input = {
      errors: [SAMPLE_ERROR],
      valid: false,
    };
    const result = ValidationResultSchema.parse(input);

    expect(result).toStrictEqual(input);
  });

  it(FAILS_VALID_FALSE_EMPTY_ERRORS, () => {
    const input = { errors: [], valid: false };

    expect(() => {
      ValidationResultSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(FAILS_VALID_TRUE_WITH_ERRORS, () => {
    const input = {
      errors: [SAMPLE_ERROR],
      valid: true,
    };

    expect(() => {
      ValidationResultSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(FAILS_EMPTY_CODE, () => {
    const input = {
      errors: [
        {
          code: "",
          expected: "some-field",
          hint: "Field is required",
          path: "root",
          received: "",
        },
      ],
      valid: false,
    };

    expect(() => {
      ValidationResultSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(PARSES_STRUCTURAL_CODE, () => {
    const input = {
      errors: [
        {
          code: "STRUCTURAL_MISSING_FIELD",
          expected: "name field present",
          hint: "Add the required name field",
          path: "frontmatter.name",
          received: "undefined",
        },
      ],
      valid: false,
    };
    const result = ValidationResultSchema.parse(input);
    const [firstError] = result.errors;

    expect(firstError?.code).toBe("STRUCTURAL_MISSING_FIELD");
  });

  it(PARSES_HEURISTIC_CODE, () => {
    const input = {
      errors: [
        {
          code: "HEURISTIC_WRONG_EXTENSION",
          expected: ".md",
          hint: "File must use markdown extension",
          path: "outputPath",
          received: ".txt",
        },
      ],
      valid: false,
    };
    const result = ValidationResultSchema.parse(input);
    const [firstError] = result.errors;

    expect(firstError?.code).toBe("HEURISTIC_WRONG_EXTENSION");
  });
});
