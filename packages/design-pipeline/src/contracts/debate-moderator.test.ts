// cspell:ignore PKCE
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  DebateModeratorInputSchema,
  DebateModeratorOutputSchema,
} from "./debate-moderator.ts";

const VALID_INPUT_DESCRIPTION = "parses a valid debate moderator input";
const EMPTY_EXPERTS_DESCRIPTION = "throws ZodError when experts array is empty";
const EMPTY_TOPIC_DESCRIPTION = "throws ZodError when topic is empty";
const VALID_OUTPUT_DESCRIPTION = "parses a valid debate moderator output";
const ZERO_ROUNDS_DESCRIPTION = "throws ZodError when rounds is 0 (min 1)";
const EMPTY_PARTICIPATING_EXPERTS_DESCRIPTION =
  "throws ZodError when participatingExperts is empty";
const EMPTY_SYNTHESIS_DESCRIPTION = "throws ZodError when synthesis is empty";

const validInput = {
  context: "We need to decide on the authentication strategy",
  experts: ["security-expert", "ux-expert"],
  topic: "Authentication approach for the new API",
};

const validOutput = {
  consensusReached: true,
  participatingExperts: ["security-expert", "ux-expert"],
  rounds: 3,
  synthesis: "The council recommends OAuth2 with PKCE flow",
  unresolvedDissents: [],
};

describe("DebateModeratorInputSchema", () => {
  it(VALID_INPUT_DESCRIPTION, () => {
    const result = DebateModeratorInputSchema.parse(validInput);

    expect(result).toStrictEqual(validInput);
  });

  it(EMPTY_EXPERTS_DESCRIPTION, () => {
    const input = { ...validInput, experts: [] };

    expect(() => {
      DebateModeratorInputSchema.parse(input);
    }).toThrow(ZodError);
  });

  it(EMPTY_TOPIC_DESCRIPTION, () => {
    const input = { ...validInput, topic: "" };

    expect(() => {
      DebateModeratorInputSchema.parse(input);
    }).toThrow(ZodError);
  });
});

describe("DebateModeratorOutputSchema", () => {
  it(VALID_OUTPUT_DESCRIPTION, () => {
    const result = DebateModeratorOutputSchema.parse(validOutput);

    expect(result).toStrictEqual(validOutput);
  });

  it(ZERO_ROUNDS_DESCRIPTION, () => {
    const output = { ...validOutput, rounds: 0 };

    expect(() => {
      DebateModeratorOutputSchema.parse(output);
    }).toThrow(ZodError);
  });

  it(EMPTY_PARTICIPATING_EXPERTS_DESCRIPTION, () => {
    const output = { ...validOutput, participatingExperts: [] };

    expect(() => {
      DebateModeratorOutputSchema.parse(output);
    }).toThrow(ZodError);
  });

  it(EMPTY_SYNTHESIS_DESCRIPTION, () => {
    const output = { ...validOutput, synthesis: "" };

    expect(() => {
      DebateModeratorOutputSchema.parse(output);
    }).toThrow(ZodError);
  });
});
