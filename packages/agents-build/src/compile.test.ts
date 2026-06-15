import noop from "lodash/noop.js";
import { describe, expect, it, vi } from "vitest";

import { mockState } from "./compile-mock-state.ts";

vi.mock("./compiler-core.ts", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const original = await importOriginal<typeof import("./compiler-core.ts")>();
  return {
    ...original,
    compile: () => {
      mockState.compileFn?.();
    }
  };
});

describe("compile.ts success path", () => {
  it("runs compile without crashing on success", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noop);
    mockState.compileFn = noop;

    await expect(import("./compile.ts")).resolves.toBeDefined();

    expect(logSpy).toHaveBeenCalled();
  });
});
