import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { ValidationError } from "../errors/validation-error.ts";
import {
  CreateApplicationInputSchema,
  decodeInput,
  ListApplicationsParamsSchema,
  UpdateApplicationChangesSchema
} from "./schemas.ts";

const VALID = {
  applicationUrl: "https://example.com/jobs/1",
  appliedDate: "2026-08-01",
  company: "Acme",
  title: "Engineer",
  token: "jwt"
};

describe("schemas", () => {
  it("decodes a valid create input and applies defaults", () => {
    const result = Effect.runSync(
      decodeInput(CreateApplicationInputSchema, VALID)
    );
    expect(result.company).toBe("Acme");
    expect(result.status).toBeUndefined();
  });

  it.each([
    { ...VALID, company: "" },
    { ...VALID, title: "" },
    { ...VALID, token: "" },
    { ...VALID, status: "hired" }
  ])("rejects invalid create input %#", (input) => {
    const result = Effect.runSync(
      Effect.flip(decodeInput(CreateApplicationInputSchema, input))
    );
    expect(result).toBeInstanceOf(ValidationError);
  });

  it("decodes list params with first defaulting to 50", () => {
    const result = Effect.runSync(
      decodeInput(ListApplicationsParamsSchema, { token: "jwt" })
    );
    expect(result.first).toBe(50);
  });

  it("rejects a list with an invalid status", () => {
    const result = Effect.runSync(
      Effect.flip(
        decodeInput(ListApplicationsParamsSchema, {
          status: "nope",
          token: "jwt"
        })
      )
    );
    expect(result).toBeInstanceOf(ValidationError);
  });

  it("rejects an empty update change set (no id)", () => {
    const result = Effect.runSync(
      Effect.flip(decodeInput(UpdateApplicationChangesSchema, { token: "jwt" }))
    );
    expect(result).toBeInstanceOf(ValidationError);
  });
});
