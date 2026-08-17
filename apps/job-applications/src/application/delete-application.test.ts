/* eslint-disable unicorn/name-replacements, unicorn/consistent-boolean-name, @typescript-eslint/no-non-null-assertion */
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import {
  attachResume,
  createJobApplication,
} from "../domain/job-application/aggregate.ts";
import { NotFoundError } from "../errors/not-found-error.ts";
import { ResumeError } from "../errors/resume-error.ts";
import { deleteApplication } from "./delete-application.ts";
import { createFakeRepository } from "./test/fake-repository.ts";
import { createFakeResumeStore } from "./test/fake-resume-store.ts";

export const EMAIL = "me@example.com";
const RESUME_FILENAME = "resume.pdf";

const make = (withResume = false) => {
  let app = Effect.runSync(
    createJobApplication({
      applicationUrl: "https://example.com/jobs/1",
      appliedDate: "2026-08-01",
      company: "Acme",
      email: EMAIL,
      title: "Engineer",
    }),
  );
  if (withResume) {
    app = attachResume(app, {
      filename: RESUME_FILENAME,
      key: `${EMAIL}/${app.id}`,
      size: 2048,
    });
  }
  return app;
};

describe("deleteApplication", () => {
  it("deletes the row and the resume object", () => {
    const app = make(true);
    const { layer: repoLayer, rows } = createFakeRepository([app]);
    const { layer: storeLayer, objects } = createFakeResumeStore();
    objects.set(app.resumeKey!, {
      data: new ArrayBuffer(0),
      filename: "resume.pdf",
      size: 0,
    });
    const result = Effect.runSync(
      deleteApplication(app.id, EMAIL).pipe(
        Effect.provide(Layer.mergeAll(repoLayer, storeLayer)),
      ),
    );
    expect(result).toBe(true);
    expect(rows.size).toBe(0);
    expect(objects.size).toBe(0);
  });

  it("deletes the row when there is no resume", () => {
    const app = make();
    const { layer, rows } = createFakeRepository([app]);
    const { layer: storeLayer } = createFakeResumeStore();
    const result = Effect.runSync(
      deleteApplication(app.id, EMAIL).pipe(
        Effect.provide(Layer.mergeAll(layer, storeLayer)),
      ),
    );
    expect(result).toBe(true);
    expect(rows.size).toBe(0);
  });

  it("fails NOT_FOUND for a foreign id", () => {
    const app = make();
    const { layer } = createFakeRepository([app]);
    const { layer: storeLayer } = createFakeResumeStore();
    const result = Effect.runSync(
      Effect.flip(
        deleteApplication(app.id, "other@example.com").pipe(
          Effect.provide(Layer.mergeAll(layer, storeLayer)),
        ),
      ),
    );
    expect(result).toBeInstanceOf(NotFoundError);
  });

  it("fails R2 delete failure and row survives", () => {
    const app = make(true);
    const { layer: repoLayer, rows } = createFakeRepository([app]);
    const { layer: storeLayer, objects } = createFakeResumeStore({
      failDelete: true,
    });
    objects.set(app.resumeKey!, {
      data: new ArrayBuffer(0),
      filename: RESUME_FILENAME,
      size: 0,
    });
    const result = Effect.runSync(
      Effect.flip(
        deleteApplication(app.id, EMAIL).pipe(
          Effect.provide(Layer.mergeAll(repoLayer, storeLayer)),
        ),
      ),
    );
    expect(result).toBeInstanceOf(ResumeError);
    expect(rows.size).toBe(1);
  });
});
