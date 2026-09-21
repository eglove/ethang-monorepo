import { and, desc, eq, type SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Effect, Layer } from "effect";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import type { JobApplication } from "../../domain/job-application/aggregate.ts";

import { JobApplicationRepository } from "../../application/ports/job-application-repository.ts";
import { jobApplicationsTable } from "../../db/schema.ts";
import { isStatus } from "../../domain/job-application/status.ts";
import { DuplicateApplicationError } from "../../errors/duplicate-application-error.ts";
import { FetchError } from "../../errors/fetch-error.ts";
import { SaveError } from "../../errors/save-error.ts";

type Row = typeof jobApplicationsTable.$inferSelect;

const parseStatus = (value: string) => {
  return isStatus(value)
    ? value
    : Effect.runSync(Effect.die(new Error(`Unknown status: ${value}`)));
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
  let current = cause;
  while (Error.isError(current)) {
    if (current.message.includes(UNIQUE_CONSTRAINT_MSG)) {
      return true;
    }
    current = current.cause;
  }

  return String(current).includes(UNIQUE_CONSTRAINT_MSG);
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
          return isUniqueViolation(cause)
            ? new DuplicateApplicationError("application already exists")
            : new SaveError(String(cause));
        },
        try: async () => {
          const [row] = await db
            .insert(jobApplicationsTable)
            .values(toRow(application))
            .returning();
          return row
            ? toAggregate(row)
            : Effect.runSync(Effect.die(new Error("insert returned no rows")));
        }
      });
    },
    list: ({ appliedDate, email, status }) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new FetchError(String(cause));
        },
        try: async () => {
          const conditions: (SQL | undefined)[] = [
            eq(jobApplicationsTable.appliedDate, appliedDate),
            eq(jobApplicationsTable.email, email)
          ];
          if (!isNil(status)) {
            conditions.push(eq(jobApplicationsTable.status, status));
          }
          const rows = await db
            .select()
            .from(jobApplicationsTable)
            .where(and(...conditions))
            .orderBy(desc(jobApplicationsTable.id));
          return map(rows, toAggregate);
        }
      });
    },
    listAppliedDates: (email) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new FetchError(String(cause));
        },
        try: async () => {
          const rows = await db
            .selectDistinct({
              appliedDate: jobApplicationsTable.appliedDate
            })
            .from(jobApplicationsTable)
            .where(eq(jobApplicationsTable.email, email))
            .orderBy(desc(jobApplicationsTable.appliedDate));
          return map(rows, "appliedDate");
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
