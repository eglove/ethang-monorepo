import { describe, expect, it } from "vitest";

import { UiWriterInputSchema, UiWriterOutputSchema } from "./ui-writer.ts";

const VALID_INPUT_DESCRIPTION = "parses a valid input via UiWriterInputSchema";
const VALID_OUTPUT_DESCRIPTION =
  "parses a valid output via UiWriterOutputSchema";

const validInput = {
  dependencies: [1],
  description: "Implement the dashboard component",
  files: [{ action: "create" as const, path: "src/components/dashboard.tsx" }],
  stepNumber: 3,
  testDescription: "Validate dashboard rendering",
  title: "Dashboard component",
  tlaCoverage: {
    invariants: ["TypeInvariant"],
    properties: [],
    states: ["Idle", "Loading"],
    transitions: ["FetchData"],
  },
};

const validOutput = {
  filesWritten: ["src/components/dashboard.tsx"],
  tddCycles: 1,
  testsPass: true,
};

describe("UiWriterInputSchema", () => {
  it(VALID_INPUT_DESCRIPTION, () => {
    const result = UiWriterInputSchema.parse(validInput);

    expect(result).toStrictEqual(validInput);
  });
});

describe("UiWriterOutputSchema", () => {
  it(VALID_OUTPUT_DESCRIPTION, () => {
    const result = UiWriterOutputSchema.parse(validOutput);

    expect(result).toStrictEqual(validOutput);
  });
});
