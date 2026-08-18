import { Array, type Context, Effect, Layer } from "effect";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
import overEvery from "lodash/overEvery.js";

import type { JobApplication as JobApp } from "../../domain/job-application/aggregate.ts";

import { DuplicateApplicationError as DuplicateAppError } from "../../errors/duplicate-application-error.ts";
import { JobApplicationRepository as JobAppRepo } from "../ports/job-application-repository.ts";

type Repo = Context.Tag.Service<typeof JobAppRepo>;

export const createFakeRepository = (initial: readonly JobApp[] = []) => {
  const rows = new Map<string, JobApp>();
  for (const row of initial) {
    rows.set(row.id, row);
  }
  const repo: Repo = {
    delete: (id, email) => {
      const row = rows.get(id);
      // eslint-disable-next-line no-undefined, @typescript-eslint/prefer-optional-chain
      if (row === undefined || row.email !== email) {
        return Effect.succeed(false);
      }
      rows.delete(id);
      return Effect.succeed(true);
    },
    findByEmailAndUrl: (email, appUrl) => {
      for (const row of rows.values()) {
        if (row.email === email && row.applicationUrl === appUrl) {
          return Effect.succeed(row);
        }
      }
      return Effect.succeed(null);
    },
    findById: (id, email) => {
      const row = rows.get(id);
      // eslint-disable-next-line no-undefined, @typescript-eslint/prefer-optional-chain
      if (row === undefined || row.email !== email) {
        return Effect.succeed(null);
      }
      return Effect.succeed(row);
    },
    insert: (app) => {
      for (const row of rows.values()) {
        if (
          row.email === app.email &&
          row.applicationUrl === app.applicationUrl
        ) {
          return Effect.fail(
            new DuplicateAppError("application already exists"),
          );
        }
      }
      rows.set(app.id, app);
      return Effect.succeed(app);
    },
    list: ({ after, email, first, status }) => {
      const predicates = [
        (row: JobApp) => {
          return row.email === email;
        },
        (row: JobApp) => {
          return null === status || row.status === status;
        },
      ];
      const allRows: JobApp[] = Array.fromIterable(rows.values());
      let items: JobApp[] = filter(allRows, (row: JobApp) => {
        return overEvery(predicates)(row);
      });
      if (!isNil(after)) {
        items = filter(items, (row: JobApp) => {
          // eslint-disable-next-line sonar/strings-comparison -- uuid v7 ids are lexicographically ordered
          return row.id < after;
        });
      }
      items = items
        .toSorted((a, b) => {
          return b.id.localeCompare(a.id);
        })
        .slice(0, first);
      return Effect.succeed(items);
    },
    update: (app) => {
      rows.set(app.id, app);
      return Effect.succeed(app);
    },
  };
  return { layer: Layer.succeed(JobAppRepo, repo), rows };
};
