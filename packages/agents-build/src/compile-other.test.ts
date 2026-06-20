import { describe, expect, it, vi } from "vitest";

import { mockState } from "./compile-mock-state.ts";

vi.mock("./compiler-core.ts", async (importOriginal) => {
  const original = await importOriginal<typeof import("./compiler-core.ts")>();
  return {
    ...original,
    compile: () => {
      mockState.compileFn?.();
    }
  };
});

describe("compile.ts other error path", () => {
  it("throws other errors", async () => {
    mockState.compileFn = () => {
      throw new Error("Generic compile failure");
    };

    await expect(import("./compile.ts")).rejects.toThrow(
      "Generic compile failure"
    );
  });
});
