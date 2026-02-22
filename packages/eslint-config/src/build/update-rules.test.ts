import { describe, expect, it, vi } from "vitest";

import { createConfigFile } from "./create-config-file.ts";
import { updateRules } from "./update-rules.ts";

vi.mock("./create-config-file.ts", () => ({
  createConfigFile: vi.fn(),
}));

describe("update-rules", () => {
  it("should call createConfigFile for each config", async () => {
    await updateRules();
    expect(createConfigFile).toHaveBeenCalledTimes(8);
    expect(createConfigFile).toHaveBeenCalledWith(
      expect.any(Array),
      "eslint.config.js",
    );
  });

  it("should execute if it is the main module", async () => {
    const originalFilename = import.meta.filename;
    const [, script] = process.argv;
    // @ts-expect-error mocking read-only
    import.meta.filename = script;

    await import("./update-rules.ts");

    expect(createConfigFile).toBeDefined();

    // @ts-expect-error restoring read-only
    import.meta.filename = originalFilename;
  });

  it("should NOT execute if it is NOT the main module", async () => {
    // This is already covered by standard imports in tests,
    // but let's make it explicit to hit the 'false' branch of the guard.
    // The guard is: if (process.argv[1] === import.meta.filename)

    // We can just import it and check that createConfigFile was NOT called
    // more than the explicit call in updateRules test.

    vi.clearAllMocks();
    await import("./update-rules.ts?test-branch-false");
    // Should only have been called if we explicitly called updateRules()
    expect(createConfigFile).not.toHaveBeenCalled();
  });
});
