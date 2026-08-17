/* eslint-disable unicorn/name-replacements */
import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { DuplicateApplicationError } from "../errors/duplicate-application-error.ts";
import { ValidationError } from "../errors/validation-error.ts";
import { createApplication } from "./create-application.ts";
import { createFakeRepository } from "./test/fake-repository.ts";

const INPUT = {
  applicationUrl: "https://example.com/jobs/1",
  appliedDate: "2026-08-01",
  company: "Acme",
  email: "me@example.com",
  title: "Engineer",
};

describe("createApplication", () => {
  it("creates and persists an application", () => {
    const { layer, rows } = createFakeRepository();
    const app = Effect.runSync(
      createApplication(INPUT).pipe(Effect.provide(layer)),
    );
    expect(app.status).toBe("applied");
    expect(rows.get(app.id)?.title).toBe("Engineer");
  });

  it("fails with DuplicateApplicationError on (email, url) collision", () => {
    const { layer, rows } = createFakeRepository();
    Effect.runSync(createApplication(INPUT).pipe(Effect.provide(layer)));
    expect(rows.size).toBe(1);
    const result = Effect.runSync(
      Effect.flip(createApplication(INPUT).pipe(Effect.provide(layer))),
    );
    expect(result).toBeInstanceOf(DuplicateApplicationError);
  });

  it("propagates ValidationError for invalid input", () => {
    const { layer } = createFakeRepository();
    const result = Effect.runSync(
      Effect.flip(
        createApplication({ ...INPUT, company: "" }).pipe(
          Effect.provide(layer),
        ),
      ),
    );
    expect(result).toBeInstanceOf(ValidationError);
  });
});
