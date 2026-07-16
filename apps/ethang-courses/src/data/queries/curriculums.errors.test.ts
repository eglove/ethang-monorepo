import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import {
  makeSelectMock,
  MockSelectChain
} from "./curriculums.test-fixtures.ts";
import { curriculumQuery, curriculumsQuery } from "./curriculums.ts";

const NON_EXISTENT_CURRICULUM = "non-existent";
const PLAIN_STRING_FAILURE = "plain string failure";
const CONNECTION_LOST = "Connection lost";
const QUERY_FAILED = "Query failed";
const BAD_CURRICULUM_ID = "bad-id";

describe("curriculum error paths", () => {
  it("wraps non-Error cause into an Error in curriculumsQuery", async () => {
    const mockCurriculumsSelectResult: MockSelectChain = {
      from: vi.fn().mockRejectedValue(PLAIN_STRING_FAILURE)
    };

    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockCurriculumsSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumsQuery(mockDatabase, null).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain(PLAIN_STRING_FAILURE);
  });

  it("wraps non-Error cause into an Error in curriculumQuery", async () => {
    const mockSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockRejectedValue(PLAIN_STRING_FAILURE),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumQuery(mockDatabase, BAD_CURRICULUM_ID).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain(PLAIN_STRING_FAILURE);
  });

  it("fails when curriculumsQuery database select throws", async () => {
    const mockCurriculumsSelectResult: MockSelectChain = {
      from: vi.fn().mockRejectedValue(new Error(CONNECTION_LOST))
    };

    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockCurriculumsSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumsQuery(mockDatabase, null).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain(CONNECTION_LOST);
  });

  it("fails when curriculumQuery database select throws", async () => {
    const mockSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockRejectedValue(new Error(QUERY_FAILED)),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumQuery(mockDatabase, BAD_CURRICULUM_ID).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain(QUERY_FAILED);
  });

  it("does not crash when the curriculumsQuery result is empty", async () => {
    const mockCurriculumsSelectResult: MockSelectChain = {
      from: vi.fn().mockResolvedValue([])
    };

    const mockDatabase = makeSelectMock([mockCurriculumsSelectResult]);

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumsQuery(mockDatabase, null)
    );

    expect(result).toStrictEqual([]);
  });

  it("returns null on a non-existent curriculum in curriculumQuery", async () => {
    const mockSelectResult: MockSelectChain = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnThis()
    };

    const mockDatabase = {
      select: vi.fn().mockReturnValue(mockSelectResult)
    };

    const result = await Effect.runPromise(
      // @ts-expect-error test double
      curriculumQuery(mockDatabase, NON_EXISTENT_CURRICULUM)
    );

    expect(result).toBeNull();
  });
});
