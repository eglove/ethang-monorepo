/* eslint-disable unicorn/name-replacements */
import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { createJobApplication } from "../domain/job-application/aggregate.ts";
import { NotFoundError } from "../errors/not-found-error.ts";
import { ValidationError } from "../errors/validation-error.ts";
import { createFakeRepository } from "./test/fake-repository.ts";
import { updateApplication } from "./update-application.ts";

const EMAIL = "me@example.com";

const make = () => {
  return Effect.runSync(
    createJobApplication({
      applicationUrl: "https://example.com/jobs/1",
      appliedDate: "2026-08-01",
      company: "Acme",
      email: EMAIL,
      title: "Engineer"
    })
  );
};

describe("updateApplication", () => {
  it("merges changes and persists", () => {
    const app = make();
    const { layer, rows } = createFakeRepository([app]);
    const result = Effect.runSync(
      updateApplication(app.id, EMAIL, {
        salary: "$140k",
        status: "interview"
      }).pipe(Effect.provide(layer))
    );
    expect(result.salary).toBe("$140k");
    expect(result.status).toBe("interview");
    expect(rows.get(app.id)?.salary).toBe("$140k");
  });

  it("allows setting any valid status directly (explicit intent)", () => {
    const app = make();
    const { layer } = createFakeRepository([app]);
    const result = Effect.runSync(
      updateApplication(app.id, EMAIL, { status: "rejected" }).pipe(
        Effect.provide(layer)
      )
    );
    expect(result.status).toBe("rejected");
  });

  it("fails NOT_FOUND for a missing or foreign id", () => {
    const app = make();
    const { layer } = createFakeRepository([app]);
    const result = Effect.runSync(
      Effect.flip(
        updateApplication(app.id, "other@example.com", { salary: "$1" }).pipe(
          Effect.provide(layer)
        )
      )
    );
    expect(result).toBeInstanceOf(NotFoundError);
  });

  it("propagates ValidationError for an empty change set", () => {
    const app = make();
    const { layer } = createFakeRepository([app]);
    const result = Effect.runSync(
      Effect.flip(
        updateApplication(app.id, EMAIL, {}).pipe(Effect.provide(layer))
      )
    );
    expect(result).toBeInstanceOf(ValidationError);
  });
});
