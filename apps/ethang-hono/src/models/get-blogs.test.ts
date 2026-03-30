// cspell:ignore initialises
import { describe, expect, it } from "vitest";

describe("get-blogs module", () => {
  it("module initialises without error", async () => {
    const module = await import("./get-blogs.ts");

    expect(module).toBeDefined();
  });
});
