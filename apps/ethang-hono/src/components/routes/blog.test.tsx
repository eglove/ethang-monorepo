import { describe, expect, it } from "vitest";

describe("blog module", () => {
  it("exports Blog component", async () => {
    const { Blog } = await import("./blog.tsx");

    expect(Blog).toBeDefined();
  });
});
