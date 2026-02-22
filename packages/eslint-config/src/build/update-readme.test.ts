import { writeFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { updateReadme } from "./update-readme.ts";

vi.mock("node:fs");

describe("update-readme", () => {
  it("should generate and write README.md", () => {
    updateReadme();
    expect(writeFileSync).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/prefer-destructuring
    const call = (writeFileSync as unknown as { mock: { calls: string[][] } })
      .mock.calls[0];
    const path = call?.[0];
    const content = call?.[1];
    expect(path).toContain("README.md");
    expect(content).toContain("# Relentless. Unapologetic.");
  });

  it("should execute if it is the main module", async () => {
    const originalFilename = import.meta.filename;
    const [, script] = process.argv;
    // @ts-expect-error mocking read-only
    import.meta.filename = script;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const before = (writeFileSync as unknown as { mock: { calls: string[][] } })
      .mock.calls.length;

    await import("./update-readme.ts");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const after = (writeFileSync as unknown as { mock: { calls: string[][] } })
      .mock.calls.length;
    expect(after).toBeGreaterThanOrEqual(before);

    // @ts-expect-error restoring read-only
    import.meta.filename = originalFilename;
  });

  it("should NOT execute if it is NOT the main module", async () => {
    vi.clearAllMocks();
    await import("./update-readme.ts?test-branch-false");
    expect(writeFileSync).not.toHaveBeenCalled();
  });
});
