import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { ValidationError } from "../errors/validation-error.ts";
import { CreateApplicationInputSchema } from "./schemas/create-application-input-schema.ts";
import { ListApplicationsParamsSchema } from "./schemas/list-applications-params-schema.ts";
import { UpdateApplicationChangesSchema } from "./schemas/update-application-changes-schema.ts";
import { decodeInput } from "./schemas/utils.ts";

const APPLIED_DATE = "2026-08-01";
const TOKEN = "jwt";

const VALID = {
  applicationUrl: "https://example.com/jobs/1",
  appliedDate: APPLIED_DATE,
  company: "Acme",
  title: "Engineer",
  token: TOKEN,
};

describe("schemas", () => {
  it("decodes a valid create input and applies defaults", () => {
    const result = Effect.runSync(
      decodeInput(CreateApplicationInputSchema, VALID),
    );
    expect(result.company).toBe("Acme");
    expect(result.status).toBeUndefined();
  });

  it.each([
    { ...VALID, company: "" },
    { ...VALID, title: "" },
    { ...VALID, token: "" },
    { ...VALID, status: "hired" },
  ])("rejects invalid create input %#", (input) => {
    const result = Effect.runSync(
      Effect.flip(decodeInput(CreateApplicationInputSchema, input)),
    );
    expect(result).toBeInstanceOf(ValidationError);
  });

  it("decodes list params with an applied date", () => {
    const result = Effect.runSync(
      decodeInput(ListApplicationsParamsSchema, {
        appliedDate: APPLIED_DATE,
        token: TOKEN,
      }),
    );
    expect(result.appliedDate).toBe("2026-08-01");
    expect(result.status).toBeUndefined();
  });

  it("rejects a list with a missing applied date", () => {
    const result = Effect.runSync(
      Effect.flip(decodeInput(ListApplicationsParamsSchema, { token: TOKEN })),
    );
    expect(result).toBeInstanceOf(ValidationError);
  });

  it.each(["", "2026-08-1", "2026-13-01", "not-a-date"])(
    "rejects a malformed applied date %j",
    (appliedDate) => {
      const result = Effect.runSync(
        Effect.flip(
          decodeInput(ListApplicationsParamsSchema, {
            appliedDate,
            token: TOKEN,
          }),
        ),
      );
      expect(result).toBeInstanceOf(ValidationError);
    },
  );

  it("rejects a list with an invalid status", () => {
    const result = Effect.runSync(
      Effect.flip(
        decodeInput(ListApplicationsParamsSchema, {
          appliedDate: APPLIED_DATE,
          status: "nope",
          token: TOKEN,
        }),
      ),
    );
    expect(result).toBeInstanceOf(ValidationError);
  });

  it("rejects an empty update change set (no id)", () => {
    const result = Effect.runSync(
      Effect.flip(
        decodeInput(UpdateApplicationChangesSchema, { token: TOKEN }),
      ),
    );
    expect(result).toBeInstanceOf(ValidationError);
  });
});
