import { Effect } from "effect";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

const { loadAutofixResults } = vi.hoisted(() => {
  return { loadAutofixResults: vi.fn() };
});

vi.mock(import("../src/infrastructure/eslint-loader.ts"), () => {
  return { loadAutofixResults };
});

import { runAutofix } from "../src/application/run-autofix.ts";

describe(runAutofix, () => {
  const options = { cwd: path.resolve("."), files: ["src/example.ts"] };

  it("returns the infrastructure result", async () => {
    const result = { cwd: options.cwd, files: [], results: [] };
    loadAutofixResults.mockReturnValueOnce(Effect.succeed(result));

    await expect(Effect.runPromise(runAutofix(options))).resolves.toStrictEqual(
      result
    );
    expect(loadAutofixResults).toHaveBeenCalledWith(options);
  });

  it.each([new Error("loader failed"), "unavailable"])(
    "maps a failed loader cause into RunAutofixError: %s",
    async (cause) => {
      loadAutofixResults.mockReturnValueOnce(Effect.fail(cause));

      await expect(Effect.runPromise(runAutofix(options))).rejects.toThrow(
        `run-autofix: load failed for ${options.cwd}: ${String(cause)}`
      );
    }
  );
});
