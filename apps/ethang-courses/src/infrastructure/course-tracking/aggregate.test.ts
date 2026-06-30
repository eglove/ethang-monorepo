import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { CourseTrackingCommand } from "../../domain/course-tracking/commands.ts";
import type { CourseTrackingState } from "../../domain/course-tracking/state.ts";
import type { CourseTrackingRepo } from "./repo.ts";

import { FetchError } from "../../errors/fetch-error.ts";
import { SaveError } from "../../errors/save-error.ts";
import { carryCourseTrackingCommand } from "./aggregate.ts";

const COURSE_URL = "https://example.com/c";
const TRACKING_ID = "tracking-1";
const USER_ID = "user-1";

const COMMAND: CourseTrackingCommand = {
  courseUrl: COURSE_URL,
  kind: "CycleStatus",
  userId: USER_ID
};

const EXISTING_STATE: { readonly id: string } & CourseTrackingState = {
  courseUrl: COURSE_URL,
  id: TRACKING_ID,
  status: "COMPLETE",
  userId: USER_ID
};

const createMockRepo = (overrides?: Partial<CourseTrackingRepo>) => {
  return {
    fetch: vi.fn().mockReturnValue(Effect.succeed(null)),
    save: vi.fn().mockReturnValue(Effect.succeed(EXISTING_STATE)),
    ...overrides
  };
};

describe("carryCourseTrackingCommand", () => {
  it("creates new tracking when no existing state is found", async () => {
    const repo = createMockRepo();

    const result = await Effect.runPromise(
      carryCourseTrackingCommand(COMMAND, repo)
    );

    expect(result).toStrictEqual(EXISTING_STATE);
    expect(repo.save).toHaveBeenCalledWith(
      { courseUrl: COURSE_URL, status: "COMPLETE", userId: USER_ID },
      null
    );
  });

  it("cycles status for existing tracking", async () => {
    const repo = createMockRepo({
      fetch: vi.fn().mockReturnValue(Effect.succeed(EXISTING_STATE)),
      save: vi
        .fn()
        .mockReturnValue(
          Effect.succeed({ ...EXISTING_STATE, status: "REVISIT" as const })
        )
    });

    const result = await Effect.runPromise(
      carryCourseTrackingCommand(COMMAND, repo)
    );

    expect(result.status).toBe("REVISIT");
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: "REVISIT" }),
      TRACKING_ID
    );
  });

  it("propagates fetch errors", async () => {
    const fetchMock = vi
      .fn()
      .mockReturnValue(Effect.fail(new FetchError("DB error")));
    const repo = createMockRepo({ fetch: fetchMock });

    await expect(
      Effect.runPromise(carryCourseTrackingCommand(COMMAND, repo))
    ).rejects.toThrow("DB error");
  });

  it("propagates save errors", async () => {
    const saveMock = vi
      .fn()
      .mockReturnValue(Effect.fail(new SaveError("Save failed")));
    const repo = createMockRepo({ save: saveMock });

    await expect(
      Effect.runPromise(carryCourseTrackingCommand(COMMAND, repo))
    ).rejects.toThrow("Save failed");
  });
});
