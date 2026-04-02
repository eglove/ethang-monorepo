import { describe, expect, it } from "vitest";

import {
  HonoWriterInputSchema,
  HonoWriterOutputSchema,
} from "./hono-writer.ts";

const VALID_INPUT_DESCRIPTION =
  "parses a valid input via HonoWriterInputSchema";
const VALID_OUTPUT_DESCRIPTION =
  "parses a valid output via HonoWriterOutputSchema";

const validInput = {
  dependencies: [1],
  description: "Implement the Hono route handler",
  files: [{ action: "create" as const, path: "src/routes/users.ts" }],
  stepNumber: 2,
  testDescription: "Validate route handler behavior",
  title: "User route handler",
  tlaCoverage: {
    invariants: ["TypeInvariant"],
    properties: [],
    states: ["Active"],
    transitions: ["HandleRequest"],
  },
};

const validOutput = {
  filesWritten: ["src/routes/users.ts"],
  tddCycles: 1,
  testsPass: true,
};

describe("HonoWriterInputSchema", () => {
  it(VALID_INPUT_DESCRIPTION, () => {
    const result = HonoWriterInputSchema.parse(validInput);

    expect(result).toStrictEqual(validInput);
  });
});

describe("HonoWriterOutputSchema", () => {
  it(VALID_OUTPUT_DESCRIPTION, () => {
    const result = HonoWriterOutputSchema.parse(validOutput);

    expect(result).toStrictEqual(validOutput);
  });
});
