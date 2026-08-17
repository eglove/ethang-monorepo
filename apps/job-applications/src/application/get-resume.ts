/* eslint-disable unicorn/name-replacements */
import { Effect } from "effect";
import isNil from "lodash/isNil.js";

import { NotFoundError } from "../errors/not-found-error.ts";
import { JobApplicationRepository, ResumeStore } from "./ports.ts";

export const getResume = (id: string, email: string) => {
  return Effect.gen(function* () {
    const repo = yield* JobApplicationRepository;
    const store = yield* ResumeStore;
    const existing = yield* repo.findById(id, email);
    if (isNil(existing)) {
      return yield* Effect.fail(new NotFoundError("application not found"));
    }
    if (isNil(existing.resumeKey)) {
      return null;
    }
    const object = yield* store.get(existing.resumeKey);
    if (isNil(object)) {
      return null;
    }
    return {
      contentType: "application/pdf",
      data: object.data,
      filename: object.filename,
      size: object.size
    };
  });
};
