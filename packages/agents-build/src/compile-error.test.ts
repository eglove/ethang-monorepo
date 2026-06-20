import noop from "lodash/noop.js";
import { describe, expect, it, vi } from "vitest";

import { mockState } from "./compile-mock-state.ts";
import { CompileError } from "./compiler-core.ts";

vi.mock("./compiler-core.ts", async (importOriginal) => {
  const original = await importOriginal<typeof import("./compiler-core.ts")>();
  return {
    ...original,
    compile: () => {
      mockState.compileFn?.();
    }
  };
});

describe("compile.ts error path", () => {
  it("handles CompileError and exits", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(noop);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit: ${String(code)}`);
    });
    mockState.compileFn = () => {
      // @ts-expect-error for test
      throw new CompileError(["Failed to validate schema"]);
    };

    await expect(import("./compile.ts")).rejects.toThrow("process.exit: 1");

    expect(errorSpy).toHaveBeenCalledWith("FAIL: Failed to validate schema");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
