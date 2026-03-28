import { writeFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { updateReadme } from "./update-readme.ts";

vi.mock(import("node:fs"));

describe("update-readme", () => {
  it("should generate and write README.md", () => {
    updateReadme();

    expect(writeFileSync).toHaveBeenCalledTimes(1);

    // eslint-disable-next-line @typescript-eslint/prefer-destructuring
    const call = (writeFileSync as unknown as { mock: { calls: string[][] } })
      .mock.calls[0];
    const path = call?.[0];
    const content = call?.[1];

    expect(path).toContain("README.md");
    expect(content).toContain("# Relentless. Unapologetic.");
    expect(content).toContain("config.vitest.js");
  });

  it("should execute if it is the main module", async () => {
    const originalFilename = import.meta.filename;
    const [, script] = process.argv;
    // @ts-expect-error mocking read-only
    import.meta.filename = script;

    const before = (writeFileSync as unknown as { mock: { calls: string[][] } })
      .mock.calls.length;

    await import("./update-readme.ts");

    const after = (writeFileSync as unknown as { mock: { calls: string[][] } })
      .mock.calls.length;

    expect(after).toBeGreaterThanOrEqual(before);

    import.meta.filename = originalFilename;
  });

  it("should NOT execute if it is NOT the main module", async () => {
    vi.clearAllMocks();
    // @ts-expect-error for test
    await import("./update-readme.ts?test-branch-false");

    expect(writeFileSync).not.toHaveBeenCalled();
  });
});
