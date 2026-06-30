import { eq } from "drizzle-orm";
import { Effect } from "effect";

import type { Database } from "../../data/types.ts";
import type { CourseTrackingCommand } from "../../domain/course-tracking/commands.ts";
import type { CourseTrackingState } from "../../domain/course-tracking/state.ts";

import { courseTrackingTable } from "../../db/schema.ts";
import { FetchError } from "../../errors/fetch-error.ts";
import { SaveError } from "../../errors/save-error.ts";

export type CourseTrackingRepo = {
  readonly fetch: (
    command: CourseTrackingCommand
  ) => Effect.Effect<
    ({ readonly id: string } & CourseTrackingState) | null,
    FetchError
  >;
  readonly save: (
    state: CourseTrackingState,
    version: null | string
  ) => Effect.Effect<{ readonly id: string } & CourseTrackingState, SaveError>;
};

const parseStatus = (value: string) => {
  switch (value) {
    case "COMPLETE":
    case "INCOMPLETE":
    case "REVISIT": {
      return value;
    }
    default: {
      throw new Error(`Unknown status: ${value}`);
    }
  }
};

const toState = (row: {
  courseUrl: string;
  id: string;
  status: string;
  userId: string;
}) => {
  return {
    courseUrl: row.courseUrl,
    id: row.id,
    status: parseStatus(row.status),
    userId: row.userId
  };
};

export const createCourseTrackingRepo = (database: Database) => {
  return {
    fetch: (command: CourseTrackingCommand) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new FetchError(String(cause));
        },
        try: async () => {
          const row = await database.query.courseTrackingTable.findFirst({
            where: (table, operators) => {
              return operators.and(
                operators.eq(table.userId, command.userId),
                operators.eq(table.courseUrl, command.courseUrl)
              );
            }
          });

          return row ? toState(row) : null;
        }
      });
    },
    save: (state: CourseTrackingState, version: null | string) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new SaveError(String(cause));
        },
        try: async () => {
          if (null === version) {
            const [record] = await database
              .insert(courseTrackingTable)
              .values({
                courseUrl: state.courseUrl,
                status: state.status,
                userId: state.userId
              })
              .returning();
            if (!record) {
              throw new Error("Insert returned no rows");
            }
            return toState(record);
          }

          await database
            .update(courseTrackingTable)
            .set({ status: state.status })
            .where(eq(courseTrackingTable.id, version))
            .run();

          return { ...state, id: version };
        }
      });
    }
  };
};
