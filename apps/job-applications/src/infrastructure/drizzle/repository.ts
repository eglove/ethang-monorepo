/* eslint-disable unicorn/name-replacements */
import { and, desc, eq, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Effect, Layer } from "effect";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import type { JobApplication } from "../../domain/job-application/aggregate.ts";

import { JobApplicationRepository } from "../../application/ports.ts";
import { jobApplicationsTable } from "../../db/schema.ts";
import { isStatus } from "../../domain/job-application/status.ts";
import { DuplicateApplicationError } from "../../errors/duplicate-application-error.ts";
import { FetchError } from "../../errors/fetch-error.ts";
import { SaveError } from "../../errors/save-error.ts";

type Row = typeof jobApplicationsTable.$inferSelect;

const parseStatus = (value: string) => {
  if (isStatus(value)) {
    return value;
  }
  return Effect.runSync(Effect.die(new Error(`Unknown status: ${value}`)));
};

const toAggregate = (row: Row) => {
  return {
    applicationUrl: row.applicationUrl,
    appliedDate: row.appliedDate,
    company: row.company,
    createdAt: row.createdAt,
    email: row.email,
    id: row.id,
    location: row.location,
    nextInterviewDate: row.nextInterviewDate,
    notes: row.notes,
    resumeFilename: row.resumeFilename,
    resumeKey: row.resumeKey,
    resumeSize: row.resumeSize,
    salary: row.salary,
    status: parseStatus(row.status),
    title: row.title,
    updatedAt: row.updatedAt
  };
};

const toRow = (application: JobApplication) => {
  return {
    applicationUrl: application.applicationUrl,
    appliedDate: application.appliedDate,
    company: application.company,
    createdAt: application.createdAt,
    email: application.email,
    id: application.id,
    location: application.location,
    nextInterviewDate: application.nextInterviewDate,
    notes: application.notes,
    resumeFilename: application.resumeFilename,
    resumeKey: application.resumeKey,
    resumeSize: application.resumeSize,
    salary: application.salary,
    status: application.status,
    title: application.title,
    updatedAt: application.updatedAt
  };
};

const UNIQUE_CONSTRAINT_MSG = "UNIQUE constraint failed";

const isUniqueViolation = (cause: unknown) => {
  if (!Error.isError(cause)) {
    return String(cause).includes(UNIQUE_CONSTRAINT_MSG);
  }
  if (cause.message.includes(UNIQUE_CONSTRAINT_MSG)) {
    return true;
  }
  // Miniflare wraps the SQLite error in a parent error; check the cause chain
  if (Error.isError(cause.cause)) {
    return isUniqueViolation(cause.cause);
  }
  return String(cause).includes(UNIQUE_CONSTRAINT_MSG);
};

export const createJobApplicationRepositoryLayer = (database: D1Database) => {
  const db = drizzle(database, { schema: { jobApplicationsTable } });
  return Layer.succeed(JobApplicationRepository, {
    delete: (id, email) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new FetchError(String(cause));
        },
        try: async () => {
          const result = await db
            .delete(jobApplicationsTable)
            .where(
              and(
                eq(jobApplicationsTable.id, id),
                eq(jobApplicationsTable.email, email)
              )
            )
            .run();
          return 0 < result.meta.changes;
        }
      });
    },
    findByEmailAndUrl: (email, applicationUrl) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new FetchError(String(cause));
        },
        try: async () => {
          const row = await db.query.jobApplicationsTable.findFirst({
            where: (table, operators) => {
              return operators.and(
                operators.eq(table.email, email),
                operators.eq(table.applicationUrl, applicationUrl)
              );
            }
          });
          return row ? toAggregate(row) : null;
        }
      });
    },
    findById: (id, email) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new FetchError(String(cause));
        },
        try: async () => {
          const row = await db.query.jobApplicationsTable.findFirst({
            where: (table, operators) => {
              return operators.and(
                operators.eq(table.id, id),
                operators.eq(table.email, email)
              );
            }
          });
          return row ? toAggregate(row) : null;
        }
      });
    },
    insert: (application) => {
      return Effect.tryPromise({
        catch: (cause) => {
          if (isUniqueViolation(cause)) {
            return new DuplicateApplicationError("application already exists");
          }
          return new SaveError(String(cause));
        },
        try: async () => {
          const [row] = await db
            .insert(jobApplicationsTable)
            .values(toRow(application))
            .returning();
          if (!row) {
            return Effect.runSync(
              Effect.die(new Error("insert returned no rows"))
            );
          }
          return toAggregate(row);
        }
      });
    },
    list: ({ after, email, first, status }) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new FetchError(String(cause));
        },
        try: async () => {
          const conditions = [eq(jobApplicationsTable.email, email)];
          if (!isNil(status)) {
            conditions.push(eq(jobApplicationsTable.status, status));
          }
          if (!isNil(after)) {
            conditions.push(lt(jobApplicationsTable.id, after));
          }
          const rows = await db
            .select()
            .from(jobApplicationsTable)
            .where(and(...conditions))
            .orderBy(desc(jobApplicationsTable.id))
            .limit(first);
          return map(rows, toAggregate);
        }
      });
    },
    update: (application) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new SaveError(String(cause));
        },
        try: async () => {
          await db
            .update(jobApplicationsTable)
            .set(toRow(application))
            .where(eq(jobApplicationsTable.id, application.id))
            .run();
          return application;
        }
      });
    }
  });
};
