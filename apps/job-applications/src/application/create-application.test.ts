/* eslint-disable unicorn/name-replacements */
import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { DuplicateApplicationError as DuplicateAppError } from "../errors/duplicate-application-error.ts";
import { ValidationError } from "../errors/validation-error.ts";
import { createApplication as createApp } from "./create-application.ts";
import { createFakeRepository as createFakeRepo } from "./test/fake-repository.ts";

const INPUT = {
  applicationUrl: "https://example.com/jobs/1",
  appliedDate: "2026-08-01",
  company: "Acme",
  email: "me@example.com",
  title: "Engineer"
};

// eslint-disable-next-line unicorn/name-replacements
describe("createApplication", () => {
  it("creates and persists an application", () => {
    const { layer, rows } = createFakeRepo();
    const app = Effect.runSync(createApp(INPUT).pipe(Effect.provide(layer)));
    expect(app.status).toBe("applied");
    expect(rows.get(app.id)?.title).toBe("Engineer");
  });

  it("fails with DuplicateApplicationError on (email, url) collision", () => {
    const { layer, rows } = createFakeRepo();
    Effect.runSync(createApp(INPUT).pipe(Effect.provide(layer)));
    expect(rows.size).toBe(1);
    const result = Effect.runSync(
      Effect.flip(createApp(INPUT).pipe(Effect.provide(layer)))
    );
    expect(result).toBeInstanceOf(DuplicateAppError);
  });

  it("propagates ValidationError for invalid input", () => {
    const { layer } = createFakeRepo();
    const result = Effect.runSync(
      Effect.flip(
        createApp({ ...INPUT, company: "" }).pipe(Effect.provide(layer))
      )
    );
    expect(result).toBeInstanceOf(ValidationError);
  });
});
