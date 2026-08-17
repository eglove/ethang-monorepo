/* eslint-disable unicorn/name-replacements */
import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { createJobApplication } from "../domain/job-application/aggregate.ts";
import { InvalidStatusTransitionError } from "../errors/invalid-status-transition-error.ts";
import { NotFoundError } from "../errors/not-found-error.ts";
import { cycleStatus } from "./cycle-status.ts";
import { createFakeRepository } from "./test/fake-repo.ts";

const EMAIL = "me@example.com";

const make = (status: "applied" | "interview" | "offer" | "screening") => {
  return Effect.runSync(
    createJobApplication({
      applicationUrl: "https://example.com/jobs/1",
      appliedDate: "2026-08-01",
      company: "Acme",
      email: EMAIL,
      status,
      title: "Engineer"
    })
  );
};

describe("cycleStatus", () => {
  it.each([
    ["applied", "screening"],
    ["screening", "interview"],
    ["interview", "offer"]
  ] as const)("advances %s -> %s", (from, to) => {
    const app = make(from);
    const { layer, rows } = createFakeRepository([app]);
    const result: unknown = Effect.runSync(
      cycleStatus(app.id, EMAIL).pipe(Effect.provide(layer))
    );
    expect(result).toHaveProperty("status", to);
    expect(rows.get(app.id)?.status).toBe(to);
  });

  it("fails INVALID_TRANSITION on a terminal status", () => {
    const app = make("offer");
    const { layer } = createFakeRepository([app]);
    const result = Effect.runSync(
      Effect.flip(cycleStatus(app.id, EMAIL).pipe(Effect.provide(layer)))
    );
    expect(result).toBeInstanceOf(InvalidStatusTransitionError);
  });

  it("fails NOT_FOUND for a missing id", () => {
    const { layer } = createFakeRepository();
    const result = Effect.runSync(
      Effect.flip(cycleStatus("missing", EMAIL).pipe(Effect.provide(layer)))
    );
    expect(result).toBeInstanceOf(NotFoundError);
  });
});
