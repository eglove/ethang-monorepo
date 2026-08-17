/* eslint-disable unicorn/name-replacements */
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import {
  attachResume,
  createJobApplication
} from "../domain/job-application/aggregate.ts";
import { NotFoundError } from "../errors/not-found-error.ts";
import { getResume } from "./get-resume.ts";
import { createFakeRepository } from "./test/fake-repo.ts";
import { createFakeResumeStore } from "./test/fake-resume-store.ts";

const EMAIL = "me@example.com";
const FILENAME = "resume.pdf";
const encoder = new TextEncoder();
const DATA = encoder.encode("%PDF-1.7").buffer;

const make = () => {
  let app = Effect.runSync(
    createJobApplication({
      applicationUrl: "https://example.com/jobs/1",
      appliedDate: "2026-08-01",
      company: "Acme",
      email: EMAIL,
      title: "Engineer"
    })
  );
  app = attachResume(app, {
    filename: FILENAME,
    key: `${EMAIL}/${app.id}`,
    size: DATA.byteLength
  });
  return app;
};

describe("getResume", () => {
  it("returns the stored object", () => {
    const app = make();
    const { layer: repoLayer } = createFakeRepository([app]);
    const { layer: storeLayer, objects } = createFakeResumeStore();
    const key = app.resumeKey ?? "";
    objects.set(key, {
      data: DATA,
      filename: FILENAME,
      size: DATA.byteLength
    });
    const result = Effect.runSync(
      getResume(app.id, EMAIL).pipe(
        Effect.provide(Layer.mergeAll(repoLayer, storeLayer))
      )
    );
    expect(result?.filename).toBe("resume.pdf");
    expect(result?.contentType).toBe("application/pdf");
  });

  it("returns null when the application has no resume", () => {
    const app = Effect.runSync(
      createJobApplication({
        applicationUrl: "https://example.com/jobs/1",
        appliedDate: "2026-08-01",
        company: "Acme",
        email: EMAIL,
        title: "Engineer"
      })
    );
    const { layer: repoLayer } = createFakeRepository([app]);
    const { layer: storeLayer } = createFakeResumeStore();
    const result = Effect.runSync(
      getResume(app.id, EMAIL).pipe(
        Effect.provide(Layer.mergeAll(repoLayer, storeLayer))
      )
    );
    expect(result).toBeNull();
  });

  it("returns null when the stored object is missing", () => {
    const app = make();
    const { layer: repoLayer } = createFakeRepository([app]);
    const { layer: storeLayer } = createFakeResumeStore();
    const result = Effect.runSync(
      getResume(app.id, EMAIL).pipe(
        Effect.provide(Layer.mergeAll(repoLayer, storeLayer))
      )
    );
    expect(result).toBeNull();
  });

  it("fails NOT_FOUND for a foreign id", () => {
    const app = make();
    const { layer: repoLayer } = createFakeRepository([app]);
    const { layer: storeLayer } = createFakeResumeStore();
    const result = Effect.runSync(
      Effect.flip(
        getResume(app.id, "other@example.com").pipe(
          Effect.provide(Layer.mergeAll(repoLayer, storeLayer))
        )
      )
    );
    expect(result).toBeInstanceOf(NotFoundError);
  });
});
