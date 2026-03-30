// cspell:ignore initialises
import { describe, expect, it } from "vitest";

describe("get-blog-by-slug module", () => {
  it("module initialises without error", async () => {
    const module = await import("./get-blog-by-slug.ts");

    expect(module).toBeDefined();
  });
});
