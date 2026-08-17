/* eslint-disable unicorn/name-replacements */
import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { createJobApplication } from "../domain/job-application/aggregate.ts";
import { NotFoundError } from "../errors/not-found-error.ts";
import { getApplication } from "./get-application.ts";
import { createFakeRepository } from "./test/fake-repository.ts";

const EMAIL = "me@example.com";

const makeDefaults = () => {
  return {
    applicationUrl: "https://example.com/jobs/1",
    appliedDate: "2026-08-01",
    company: "Acme",
    email: EMAIL,
    title: "Engineer",
  };
};

const make = (
  overrides?: Partial<Parameters<typeof createJobApplication>[0]>,
) => {
  return Effect.runSync(
    createJobApplication({ ...makeDefaults(), ...overrides }),
  );
};

describe("getApplication", () => {
  it("returns the owned application", () => {
    const app = make();
    const { layer } = createFakeRepository([app]);
    const result = Effect.runSync(
      getApplication(app.id, EMAIL).pipe(Effect.provide(layer)),
    );
    expect(result.id).toBe(app.id);
  });

  it("fails NOT_FOUND for a missing id", () => {
    const { layer } = createFakeRepository();
    const result = Effect.runSync(
      Effect.flip(getApplication("missing", EMAIL).pipe(Effect.provide(layer))),
    );
    expect(result).toBeInstanceOf(NotFoundError);
  });

  it("fails NOT_FOUND for another user's id (no existence leak)", () => {
    const app = make();
    const { layer } = createFakeRepository([app]);
    const result = Effect.runSync(
      Effect.flip(
        getApplication(app.id, "other@example.com").pipe(Effect.provide(layer)),
      ),
    );
    expect(result).toBeInstanceOf(NotFoundError);
  });
});
