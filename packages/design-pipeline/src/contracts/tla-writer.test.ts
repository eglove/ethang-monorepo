// cspell:ignore PKCE
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { TlaWriterInputSchema, TlaWriterOutputSchema } from "./tla-writer.ts";

const VALID_INPUT_DESCRIPTION = "parses a valid TLA writer input";
const EMPTY_BRIEFING_PATH_DESCRIPTION =
  "throws ZodError when briefingPath is empty";
const EMPTY_DESIGN_CONSENSUS_DESCRIPTION =
  "throws ZodError when designConsensus is empty";
const VALID_OUTPUT_DESCRIPTION = "parses a valid TLA writer output";
const UNKNOWN_TLC_RESULT_DESCRIPTION =
  "throws ZodError when tlcResult is UNKNOWN (not in enum)";
const EMPTY_SPEC_CONTENT_DESCRIPTION =
  "throws ZodError when specContent is empty";
const EMPTY_SPEC_PATH_DESCRIPTION = "throws ZodError when specPath is empty";

const validInput = {
  briefingPath: "docs/briefings/auth-design.md",
  designConsensus: "Use OAuth2 with PKCE flow for all public clients",
};

const validOutput = {
  cfgPath: "specs/auth-workflow.cfg",
  specContent: "---- MODULE AuthWorkflow ----\nEXTENDS Integers\n====",
  specPath: "specs/auth-workflow.tla",
  tlcOutput: "Model checking completed. No error found.",
  tlcResult: "PASS" as const,
};

describe("TlaWriterInputSchema", () => {
  it(VALID_INPUT_DESCRIPTION, () => {
    const result = TlaWriterInputSchema.parse(validInput);

    expect(result).toStrictEqual(validInput);
  });

  it(EMPTY_BRIEFING_PATH_DESCRIPTION, () => {
    const input = { ...validInput, briefingPath: "" };

    expect(() => {
      TlaWriterInputSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(EMPTY_DESIGN_CONSENSUS_DESCRIPTION, () => {
    const input = { ...validInput, designConsensus: "" };

    expect(() => {
      TlaWriterInputSchema.parse(input);
    }).toThrow(ZodError);
  });
});

describe("TlaWriterOutputSchema", () => {
  it(VALID_OUTPUT_DESCRIPTION, () => {
    const result = TlaWriterOutputSchema.parse(validOutput);

    expect(result).toStrictEqual(validOutput);
  });

  it(UNKNOWN_TLC_RESULT_DESCRIPTION, () => {
    const output = { ...validOutput, tlcResult: "UNKNOWN" };

    expect(() => {
      TlaWriterOutputSchema.parse(output);
    }).toThrow(ZodError);
  });

  it(EMPTY_SPEC_CONTENT_DESCRIPTION, () => {
    const output = { ...validOutput, specContent: "" };

    expect(() => {
      TlaWriterOutputSchema.parse(output);
    }).toThrow(ZodError);
  });

  it(EMPTY_SPEC_PATH_DESCRIPTION, () => {
    const output = { ...validOutput, specPath: "" };

    expect(() => {
      TlaWriterOutputSchema.parse(output);
    }).toThrow(ZodError);
  });
});
