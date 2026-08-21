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
            new DuplicateAppError("application already exists")
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
        }
      ];
      if (!isNil(after)) {
        predicates.push((row: JobApp) => {
          const dateOrder = row.appliedDate.localeCompare(after.appliedDate);
          return (
            0 > dateOrder ||
            (0 === dateOrder && 0 > row.id.localeCompare(after.id))
          );
        });
      }
      const allRows: JobApp[] = Array.fromIterable(rows.values());
      const items = filter(allRows, (row: JobApp) => {
        return overEvery(predicates)(row);
      });
      return Effect.succeed(
        items
          .toSorted((a, b) => {
            return a.appliedDate === b.appliedDate
              ? b.id.localeCompare(a.id)
              : b.appliedDate.localeCompare(a.appliedDate);
          })
          .slice(0, first)
      );
    },
    update: (app) => {
      rows.set(app.id, app);
      return Effect.succeed(app);
    }
  };
  return { layer: Layer.succeed(JobAppRepo, repo), rows };
};
