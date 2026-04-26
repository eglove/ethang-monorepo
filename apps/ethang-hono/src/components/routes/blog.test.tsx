import { describe, expect, it, vi } from "vitest";

import { app } from "../../index.tsx";
import { BlogModel } from "../../models/blog-model.ts";

vi.mock(import("../../models/blog-model.ts"), () => {
  return {
    BlogModel: vi.fn(),
  };
});

const mockBlogModel = (maxPages: number) => {
  vi.mocked(BlogModel).mockImplementation(
    class {
      public getPaginatedBlogs = vi.fn().mockResolvedValue({
        maxPages,
        posts: [],
        total: 100,
      });
    } as never,
  );
};

describe("blog module", () => {
  it("exports Blog component", async () => {
    const { Blog } = await import("./blog.tsx");

    expect(Blog).toBeDefined();
  });

  it("renders pagination with ellipsis for many pages", async () => {
    vi.clearAllMocks();
    mockBlogModel(10);

    const response = await app.request("https://ethang.dev/blog/page/5");
    const html = await response.text();

    expect(html).toContain("…");
    expect(html).toContain("/blog/page/10");
    expect(html).toContain("/blog/page/3");
    expect(html).toContain("/blog/page/7");
  });

  it("renders empty pagination for single page", async () => {
    vi.clearAllMocks();
    mockBlogModel(1);

    const response = await app.request("https://ethang.dev/blog");
    const html = await response.text();

    expect(html).not.toContain("Pagination");
  });
});
