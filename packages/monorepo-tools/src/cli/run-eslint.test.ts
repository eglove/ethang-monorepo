import { Effect } from "effect";
import { ESLint } from "eslint";
import { describe, expect, it, vi } from "vitest";

import { ESLintExecutionError, runEslint } from "./run-eslint.ts";

const { lintFilesMock, outputFixesMock } = vi.hoisted(() => {
  return {
    lintFilesMock: vi.fn(),
    outputFixesMock: vi.fn()
  };
});

// @ts-expect-error mock class signature differs from real ESLint
vi.mock(import("eslint"), () => {
  return {
    ESLint: class {
      public static readonly outputFixes = outputFixesMock;
      public lintFiles = lintFilesMock;
    }
  };
});

describe(runEslint, () => {
  const TEST_PATH = "src/foo.ts";
  const FIXED_PATH = "src/bar.ts";

  it("returns empty array when no files need fixing", async () => {
    lintFilesMock.mockResolvedValue([]);
    outputFixesMock.mockResolvedValue(undefined);

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* runEslint([TEST_PATH]);
      })
    );

    expect(result).toStrictEqual([]);
  });

  it("returns fixed file messages when files need fixing", async () => {
    lintFilesMock.mockResolvedValue([
      { filePath: TEST_PATH, output: "fixed" },
      { filePath: FIXED_PATH, output: "fixed" }
    ]);
    outputFixesMock.mockResolvedValue(undefined);

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* runEslint(["src/*.ts"]);
      })
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toContain(TEST_PATH);
    expect(result[1]).toContain(FIXED_PATH);
  });

  it("skips files with no output (not fixed)", async () => {
    lintFilesMock.mockResolvedValue([
      { filePath: TEST_PATH, output: null },
      { filePath: FIXED_PATH, output: "fixed" }
    ]);
    outputFixesMock.mockResolvedValue(undefined);

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* runEslint(["src/*.ts"]);
      })
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toContain(FIXED_PATH);
  });

  it("throws ESLintExecutionError when eslint fails", async () => {
    lintFilesMock.mockRejectedValue(new Error("eslint crashed"));

    const result = await Effect.runPromise(
      Effect.either(
        Effect.gen(function* () {
          return yield* runEslint([TEST_PATH]);
        })
      )
    );

    expect(result._tag).toBe("Left");
    expect((result as any).left).toBeInstanceOf(ESLintExecutionError);
  });

  it("calls outputFixes with lint results", async () => {
    const mockResults = [{ filePath: TEST_PATH, output: "fixed" }];
    lintFilesMock.mockResolvedValue(mockResults);
    outputFixesMock.mockResolvedValue(undefined);

    await Effect.runPromise(
      Effect.gen(function* () {
        return yield* runEslint([TEST_PATH]);
      })
    );

    expect(ESLint.outputFixes).toHaveBeenCalledWith(mockResults);
  });
});
