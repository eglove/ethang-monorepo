import { Effect } from "effect";
import isNil from "lodash/isNil.js";

import type { Status } from "../domain/job-application/status.ts";

import {
  type ApplicationCursor,
  encodeApplicationCursor
} from "./application-cursor.ts";
import { JobApplicationRepository } from "./ports/job-application-repository.ts";

export const listApplications = (parameters: {
  readonly after: ApplicationCursor | null;
  readonly email: string;
  readonly first: number;
  readonly status: null | Status;
}) => {
  return Effect.gen(function* () {
    const repo = yield* JobApplicationRepository;
    const items = yield* repo.list(parameters);
    const last = items.at(-1);
    return {
      items,
      nextCursor:
        !isNil(last) && items.length === parameters.first
          ? encodeApplicationCursor({
              appliedDate: last.appliedDate,
              id: last.id
            })
          : null
    };
  });
};
