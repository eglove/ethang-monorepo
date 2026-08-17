import { Effect } from "effect";
import isNil from "lodash/isNil.js";

import { attachResume } from "../domain/job-application/aggregate.ts";
import { NotFoundError } from "../errors/not-found-error.ts";
import { ResumeError } from "../errors/resume-error.ts";
import { JobApplicationRepository, ResumeStore } from "./ports.ts";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const PDF_MAGIC = "%PDF";

export const uploadResume = (parameters: {
  readonly data: ArrayBuffer;
  readonly email: string;
  readonly filename: string;
  readonly id: string;
}) => {
  return Effect.gen(function* () {
    const repo = yield* JobApplicationRepository;
    const store = yield* ResumeStore;
    const existing = yield* repo.findById(parameters.id, parameters.email);
    if (isNil(existing)) {
      return yield* Effect.fail(new NotFoundError("application not found"));
    }
    const bytes = new Uint8Array(parameters.data);
    if (bytes.byteLength > MAX_RESUME_BYTES) {
      return yield* Effect.fail(new ResumeError("resume exceeds 5 MB"));
    }
    const decoder = new TextDecoder();
    const header = decoder.decode(bytes.subarray(0, PDF_MAGIC.length));
    if (header !== PDF_MAGIC) {
      return yield* Effect.fail(new ResumeError("resume must be a PDF"));
    }
    const key = `${parameters.email}/${parameters.id}`;
    yield* store.put(key, parameters.data, parameters.filename);
    const updated = attachResume(existing, {
      filename: parameters.filename,
      key,
      size: bytes.byteLength
    });
    return yield* repo.update(updated);
  });
};
