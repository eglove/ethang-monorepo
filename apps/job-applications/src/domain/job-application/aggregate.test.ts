import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import type { Status } from "./status.ts";

import { InvalidStatusTransitionError } from "../../errors/invalid-status-transition-error.ts";
import { ValidationError } from "../../errors/validation-error.ts";
import {
  advanceStatus,
  attachResume,
  createJobApp,
  type JobApp,
  withChanges
} from "./aggregate.ts";

const VALID_INPUT = {
  applicationUrl: "https://example.com/jobs/1",
  appliedDate: "2026-08-01",
  company: "Acme",
  email: "me@example.com",
  title: "Engineer"
};

const run = <A>(effect: Effect.Effect<A, unknown>) => {
  return Effect.runSync(effect);
};

const make = (overrides: Partial<JobApp> = {}) => {
  const app = run(createJobApp(VALID_INPUT));
  return { ...app, ...overrides };
};

describe("createJobApplication", () => {
  it("creates with defaults and timestamps", () => {
    const app = run(createJobApp(VALID_INPUT));
    expect(app.id).toMatch(/^[0-9a-f]{8}-/u);
    expect(app.status).toBe("applied");
    expect(app.location).toBeNull();
    expect(app.resumeKey).toBeNull();
    expect(app.createdAt).toBe(app.updatedAt);
    expect(app.email).toBe("me@example.com");
  });

  it.each(["company", "title", "applicationUrl"])(
    "rejects empty %s",
    (field) => {
      const result = Effect.runSync(
        Effect.flip(createJobApp({ ...VALID_INPUT, [field]: "" }))
      );
      expect(result).toBeInstanceOf(ValidationError);
    }
  );

  it.each(["2026-8-1", "01/08/2026", "not-a-date", "2026-13-01"])(
    "rejects malformed appliedDate %s",
    (appliedDate) => {
      const result = Effect.runSync(
        Effect.flip(createJobApp({ ...VALID_INPUT, appliedDate }))
      );
      expect(result).toBeInstanceOf(ValidationError);
    }
  );

  it("rejects an invalid status", () => {
    const result = Effect.runSync(
      Effect.flip(createJobApp({ ...VALID_INPUT, status: "hired" as Status }))
    );
    expect(result).toBeInstanceOf(ValidationError);
  });

  it("honors an explicit status and optional fields", () => {
    const app = run(
      createJobApp({
        ...VALID_INPUT,
        location: "Remote",
        notes: "referral",
        salary: "$150k",
        status: "interview"
      })
    );
    expect(app.status).toBe("interview");
    expect(app.location).toBe("Remote");
    expect(app.salary).toBe("$150k");
    expect(app.notes).toBe("referral");
  });
});

describe("advanceStatus", () => {
  it.each([
    ["applied", "screening"],
    ["screening", "interview"],
    ["interview", "offer"]
  ] as const)("advances %s -> %s", (from, to) => {
    const app = make({ status: from });
    const next = run(advanceStatus(app));
    expect(next.status).toBe(to);
    expect(next.updatedAt).not.toBe(app.updatedAt);
  });

  it.each(["offer", "rejected", "withdrawn"] as const)(
    "fails from terminal %s",
    (status) => {
      const app = make({ status });
      const result = Effect.runSync(Effect.flip(advanceStatus(app)));
      expect(result).toBeInstanceOf(InvalidStatusTransitionError);
    }
  );

  it("rejects an unknown status at runtime", () => {
    const app = make({ status: "hired" as Status });
    const result = Effect.runSync(Effect.flip(advanceStatus(app)));
    expect(result).toBeInstanceOf(InvalidStatusTransitionError);
  });
});

describe("withChanges", () => {
  it("merges provided fields and bumps updatedAt", () => {
    const app = make({ salary: "$100k" });
    const next = run(
      withChanges(app, { notes: "screening done", salary: "$120k" })
    );
    expect(next.salary).toBe("$120k");
    expect(next.notes).toBe("screening done");
    expect(next.company).toBe("Acme");
    expect(next.updatedAt).not.toBe(app.updatedAt);
  });

  it("rejects an empty change set", () => {
    const app = make();
    const result = Effect.runSync(Effect.flip(withChanges(app, {})));
    expect(result).toBeInstanceOf(ValidationError);
  });

  it("rejects an empty company and invalid status", () => {
    const app = make();
    expect(
      Effect.runSync(Effect.flip(withChanges(app, { company: "" })))
    ).toBeInstanceOf(ValidationError);
    expect(
      Effect.runSync(
        Effect.flip(withChanges(app, { status: "hired" as Status }))
      )
    ).toBeInstanceOf(ValidationError);
  });
});

describe("attachResume", () => {
  it("sets resume metadata and bumps updatedAt", () => {
    const app = make();
    const next = attachResume(app, {
      filename: "resume.pdf",
      key: "me@example.com/abc",
      size: 2048
    });
    expect(next.resumeKey).toBe("me@example.com/abc");
    expect(next.resumeFilename).toBe("resume.pdf");
    expect(next.resumeSize).toBe(2048);
    expect(next.updatedAt).not.toBe(app.updatedAt);
  });
});
