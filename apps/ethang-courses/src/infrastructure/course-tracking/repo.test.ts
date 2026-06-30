import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "../../data/types.ts";
import type { CourseTrackingCommand } from "../../domain/course-tracking/commands.ts";
import type { CourseTrackingState } from "../../domain/course-tracking/state.ts";

import { FetchError } from "../../errors/fetch-error.ts";
import { SaveError } from "../../errors/save-error.ts";
import { createCourseTrackingRepo } from "./repo.ts";

const COURSE_URL = "https://example.com/c";
const TRACKING_ID = "tracking-1";
const USER_ID = "user-1";

const COMMAND: CourseTrackingCommand = {
  courseUrl: COURSE_URL,
  kind: "CycleStatus",
  userId: USER_ID
};

const ROW = {
  courseUrl: COURSE_URL,
  id: TRACKING_ID,
  status: "COMPLETE",
  userId: USER_ID
};

const EXPECTED_STATE: { readonly id: string } & CourseTrackingState = {
  courseUrl: COURSE_URL,
  id: TRACKING_ID,
  status: "COMPLETE",
  userId: USER_ID
};

const STATE: CourseTrackingState = {
  courseUrl: COURSE_URL,
  status: "COMPLETE",
  userId: USER_ID
};

const createMockDatabase = () => {
  const { findFirstMock, insertReturningMock, updateRunMock } = {
    findFirstMock: vi.fn(),
    insertReturningMock: vi.fn(),
    updateRunMock: vi.fn()
  };

  const database = {
    insert: vi.fn(() => {
      return {
        values: vi.fn(() => {
          return {
            returning: insertReturningMock
          };
        })
      };
    }),
    query: {
      courseTrackingTable: {
        findFirst: findFirstMock
      }
    },
    update: vi.fn(() => {
      return {
        set: vi.fn(() => {
          return {
            where: vi.fn(() => {
              return {
                run: updateRunMock
              };
            })
          };
        })
      };
    })
  } as unknown as Database;

  return {
    database,
    findFirstMock,
    insertReturningMock,
    updateRunMock
  };
};

describe("createCourseTrackingRepo", () => {
  describe("fetch", () => {
    it("returns state when row is found", async () => {
      const { database, findFirstMock } = createMockDatabase();
      findFirstMock.mockResolvedValue(ROW);

      const repo = createCourseTrackingRepo(database);
      const result = await Effect.runPromise(repo.fetch(COMMAND));

      expect(result).toStrictEqual(EXPECTED_STATE);
    });

    it("returns null when no row is found", async () => {
      const { database, findFirstMock } = createMockDatabase();
      findFirstMock.mockResolvedValue(undefined);

      const repo = createCourseTrackingRepo(database);
      const result = await Effect.runPromise(repo.fetch(COMMAND));

      expect(result).toBeNull();
    });

    it("fails with FetchError on database error", async () => {
      const { database, findFirstMock } = createMockDatabase();
      findFirstMock.mockRejectedValue(new Error("Connection lost"));

      const repo = createCourseTrackingRepo(database);
      const result = await Effect.runPromise(
        repo.fetch(COMMAND).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(FetchError);
      expect(result.message).toContain("Connection lost");
    });

    it("fails with FetchError when parseStatus throws on invalid status", async () => {
      const { database, findFirstMock } = createMockDatabase();
      findFirstMock.mockResolvedValue({ ...ROW, status: "INVALID_STATUS" });

      const repo = createCourseTrackingRepo(database);
      const result = await Effect.runPromise(
        repo.fetch(COMMAND).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(FetchError);
      expect(result.message).toContain("Unknown status");
    });
  });

  describe("save", () => {
    it("inserts new record when version is null", async () => {
      const { database, insertReturningMock } = createMockDatabase();
      insertReturningMock.mockResolvedValue([ROW]);

      const repo = createCourseTrackingRepo(database);
      const result = await Effect.runPromise(repo.save(STATE, null));

      expect(result).toStrictEqual(EXPECTED_STATE);
    });

    it("fails with SaveError when insert returns no rows", async () => {
      const { database, insertReturningMock } = createMockDatabase();
      insertReturningMock.mockResolvedValue([]);

      const repo = createCourseTrackingRepo(database);
      const result = await Effect.runPromise(
        repo.save(STATE, null).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(SaveError);
      expect(result.message).toContain("Insert returned no rows");
    });

    it("updates existing record when version is provided", async () => {
      const { database, updateRunMock } = createMockDatabase();
      updateRunMock.mockResolvedValue(undefined);

      const repo = createCourseTrackingRepo(database);
      const result = await Effect.runPromise(repo.save(STATE, TRACKING_ID));

      expect(result).toStrictEqual({ ...STATE, id: TRACKING_ID });
    });

    it("fails with SaveError on database error during insert", async () => {
      const { database, insertReturningMock } = createMockDatabase();
      insertReturningMock.mockRejectedValue(new Error("Insert failed"));

      const repo = createCourseTrackingRepo(database);
      const result = await Effect.runPromise(
        repo.save(STATE, null).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(SaveError);
      expect(result.message).toContain("Insert failed");
    });
  });
});
