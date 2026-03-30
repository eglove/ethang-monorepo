// cspell:ignore initialises
import { describe, expect, it } from "vitest";

describe("script-ids module", () => {
  it("module initialises without error", async () => {
    const module = await import("./script-ids.ts");

    expect(module).toBeDefined();
  });
});
