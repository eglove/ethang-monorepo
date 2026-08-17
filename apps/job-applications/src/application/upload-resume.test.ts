/* eslint-disable unicorn/name-replacements */
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { createJobApplication } from "../domain/job-application/aggregate.ts";
import { NotFoundError } from "../errors/not-found-error.ts";
import { ResumeError } from "../errors/resume-error.ts";
import { createFakeRepository } from "./test/fake-repo.ts";
import { createFakeResumeStore } from "./test/fake-resume-store.ts";
import { uploadResume } from "./upload-resume.ts";

const EMAIL = "me@example.com";
const encoder = new TextEncoder();
const PDF = encoder.encode("%PDF-1.7 fake resume").buffer;

const make = () => {
  return Effect.runSync(
    createJobApplication({
      applicationUrl: "https://example.com/jobs/1",
      appliedDate: "2026-08-01",
      company: "Acme",
      email: EMAIL,
      title: "Engineer",
    }),
  );
};

const provided = (app: ReturnType<typeof make>) => {
  const { layer: repoLayer, rows } = createFakeRepository([app]);
  const { layer: storeLayer, objects } = createFakeResumeStore();
  return { layer: Layer.mergeAll(repoLayer, storeLayer), objects, rows };
};

describe("uploadResume", () => {
  it("stores the PDF under email/id and persists metadata", () => {
    const app = make();
    const { layer, objects, rows } = provided(app);
    const result = Effect.runSync(
      uploadResume({
        data: PDF,
        email: EMAIL,
        filename: "resume.pdf",
        id: app.id,
      }).pipe(Effect.provide(layer)),
    );
    expect(result.resumeKey).toBe(`${EMAIL}/${app.id}`);
    expect(result.resumeFilename).toBe("resume.pdf");
    expect(result.resumeSize).toBe(PDF.byteLength);
    expect(objects.has(`${EMAIL}/${app.id}`)).toBe(true);
    expect(rows.get(app.id)?.resumeKey).toBe(`${EMAIL}/${app.id}`);
  });

  it("rejects a payload over 5 MB", () => {
    const app = make();
    const { layer } = provided(app);
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    const pdfMagic = encoder.encode("%PDF");
    big.set(pdfMagic);
    const result = Effect.runSync(
      Effect.flip(
        uploadResume({
          data: big.buffer,
          email: EMAIL,
          filename: "r.pdf",
          id: app.id,
        }).pipe(Effect.provide(layer)),
      ),
    );
    expect(result).toBeInstanceOf(ResumeError);
  });

  it("accepts a payload of exactly 5 MB", () => {
    const app = make();
    const { layer } = provided(app);
    const exact = new Uint8Array(5 * 1024 * 1024);
    const pdfMagic = encoder.encode("%PDF");
    exact.set(pdfMagic);
    const result = Effect.runSync(
      uploadResume({
        data: exact.buffer,
        email: EMAIL,
        filename: "r.pdf",
        id: app.id,
      }).pipe(Effect.provide(layer)),
    );
    expect(result.resumeSize).toBe(5 * 1024 * 1024);
  });

  it("rejects a non-PDF payload", () => {
    const app = make();
    const { layer } = provided(app);
    const notPdf = encoder.encode("not a pdf").buffer;
    const result = Effect.runSync(
      Effect.flip(
        uploadResume({
          data: notPdf,
          email: EMAIL,
          filename: "r.txt",
          id: app.id,
        }).pipe(Effect.provide(layer)),
      ),
    );
    expect(result).toBeInstanceOf(ResumeError);
  });

  it("overwrites the existing resume in place", () => {
    const app = make();
    const { layer, objects } = provided(app);
    const second = encoder.encode("%PDF-1.7 second").buffer;
    Effect.runSync(
      uploadResume({
        data: PDF,
        email: EMAIL,
        filename: "a.pdf",
        id: app.id,
      }).pipe(Effect.provide(layer)),
    );
    Effect.runSync(
      uploadResume({
        data: second,
        email: EMAIL,
        filename: "b.pdf",
        id: app.id,
      }).pipe(Effect.provide(layer)),
    );
    expect(objects.size).toBe(1);
    expect(objects.get(`${EMAIL}/${app.id}`)?.size).toBe(second.byteLength);
  });

  it("fails NOT_FOUND for a foreign id", () => {
    const app = make();
    const { layer } = provided(app);
    const result = Effect.runSync(
      Effect.flip(
        uploadResume({
          data: PDF,
          email: "other@example.com",
          filename: "r.pdf",
          id: app.id,
        }).pipe(Effect.provide(layer)),
      ),
    );
    expect(result).toBeInstanceOf(NotFoundError);
  });
});
