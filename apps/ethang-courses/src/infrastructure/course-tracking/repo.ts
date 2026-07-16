import { eq } from "drizzle-orm";
import { Effect } from "effect";
import isNil from "lodash/isNil.js";

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

const parseStatus = (
  value: string
): Effect.Effect<CourseTrackingState["status"], Error> => {
  switch (value) {
    case "COMPLETE":
    case "INCOMPLETE":
    case "REVISIT": {
      return Effect.succeed(value);
    }
    default: {
      return Effect.fail(new Error(`Unknown status: ${value}`));
    }
  }
};

const toState = (row: {
  courseUrl: string;
  id: string;
  status: string;
  userId: string;
}) => {
  return Effect.gen(function* () {
    const status = yield* parseStatus(row.status);
    return {
      courseUrl: row.courseUrl,
      id: row.id,
      status,
      userId: row.userId
    };
  });
};

const insertTracking = (database: Database, state: CourseTrackingState) => {
  return Effect.tryPromise({
    catch: (cause) => {
      return new SaveError(String(cause));
    },
    try: () => {
      return database
        .insert(courseTrackingTable)
        .values({
          courseUrl: state.courseUrl,
          status: state.status,
          userId: state.userId
        })
        .returning();
    }
  });
};

const updateTracking = (
  database: Database,
  state: CourseTrackingState,
  version: string
) => {
  return Effect.tryPromise({
    catch: (cause) => {
      return new SaveError(String(cause));
    },
    try: async () => {
      return database
        .update(courseTrackingTable)
        .set({ status: state.status })
        .where(eq(courseTrackingTable.id, version))
        .run();
    }
  });
};

const fetchTracking = (database: Database, command: CourseTrackingCommand) => {
  return Effect.tryPromise({
    catch: (cause) => {
      return new FetchError(String(cause));
    },
    try: () => {
      return database.query.courseTrackingTable.findFirst({
        where: (table, operators) => {
          return operators.and(
            operators.eq(table.userId, command.userId),
            operators.eq(table.courseUrl, command.courseUrl)
          );
        }
      });
    }
  });
};

export const createCourseTrackingRepo = (database: Database) => {
  return {
    fetch: (command: CourseTrackingCommand) => {
      return Effect.gen(function* () {
        const row = yield* fetchTracking(database, command);

        if (!row) {
          return null;
        }

        return yield* toState(row).pipe(
          Effect.mapError((error) => {
            return new FetchError(error.message);
          })
        );
      });
    },
    save: (state: CourseTrackingState, version: null | string) => {
      return Effect.gen(function* () {
        if (isNil(version)) {
          const [record] = yield* insertTracking(database, state);
          if (!record) {
            return yield* Effect.fail(new SaveError("Insert returned no rows"));
          }
          return yield* toState(record).pipe(
            Effect.mapError((error) => {
              return new SaveError(error.message);
            })
          );
        }

        yield* updateTracking(database, state, version);

        return { ...state, id: version };
      });
    }
  };
};
