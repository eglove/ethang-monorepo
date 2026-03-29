import type { JSX } from "hono/jsx/jsx-runtime";

import { Hono } from "hono";
import isArray from "lodash/isArray.js";
import { describe, expect, it, vi } from "vitest";

import { globalStore } from "../../stores/global-store-properties.ts";

vi.mock(import("../../models/blog-model.ts"), () => ({
  BlogModel: vi.fn(),
}));

import { BlogModel } from "../../models/blog-model.ts";

const RENDERS_FULL_HTML = "renders a full HTML document";
import { coursePathData } from "../../stores/course-path-store.ts";
import { Blog } from "./blog.tsx";
import { Courses } from "./courses.tsx";
import { Home } from "./home.tsx";
import { NotFound } from "./not-found.tsx";
import { SignIn } from "./sign-in.tsx";
import { allTips, Tips } from "./tips.tsx";
import { ScrollbarGutter } from "./tips/scrollbar-gutter.tsx";

const render = async (component: JSX.Element): Promise<string> => {
  const testApp = new Hono();
  testApp.get("/", async (c) => c.html(component));
  const response = await testApp.request("/");
  return response.text();
};

const mockBlogModelWith = (getAllBlogs: ReturnType<typeof vi.fn>) => {
  vi.mocked(BlogModel).mockImplementation(
    class {
      public getAllBlogs = getAllBlogs;
    } as never,
  );
};

describe(Home, () => {
  it(RENDERS_FULL_HTML, async () => {
    const html = await render(<Home />);

    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  it("includes EthanG in the title", async () => {
    const html = await render(<Home />);

    expect(html).toContain("EthanG");
  });
});

describe(SignIn, () => {
  it("renders a full HTML document with sign-in form", async () => {
    const html = await render(<SignIn />);

    expect(html).toContain("<html");
    expect(html).toContain("<form");
    expect(html).toContain('id="sign-in-form"');
  });

  it("includes email and password inputs", async () => {
    const html = await render(<SignIn />);

    expect(html).toContain('type="email"');
    expect(html).toContain('type="password"');
  });

  it("includes a submit button", async () => {
    const html = await render(<SignIn />);

    expect(html).toContain('type="submit"');
  });

  it("declares sign-in script via data-script on the form", async () => {
    const html = await render(<SignIn />);

    expect(html).toContain('data-script="components/routes/sign-in"');
  });
});

describe(NotFound, () => {
  it(RENDERS_FULL_HTML, async () => {
    const html = await render(<NotFound />);

    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  it("includes 404 not found text", async () => {
    const html = await render(<NotFound />);

    expect(html).toContain("404 Not Found");
  });
});

describe(Tips, () => {
  it(RENDERS_FULL_HTML, async () => {
    const html = await render(<Tips />);

    expect(html).toContain("<html");
    expect(html).toContain("Tips");
  });

  it("includes links to tip pages", async () => {
    const html = await render(<Tips />);

    expect(html).toContain("/tips/scroll-containers");
    expect(html).toContain("/tips/scrollbar-gutter");
  });

  it("exports the allTips array with two tips", () => {
    expect(isArray(allTips)).toBe(true);
    expect(allTips).toHaveLength(2);
  });

  it("allTips contains href and title properties", () => {
    for (const tip of allTips) {
      expect(tip).toHaveProperty("href");
      expect(tip).toHaveProperty("title");
    }
  });
});

describe(ScrollbarGutter, () => {
  it("declares scrollbar-gutter script via data-script on the demo container", async () => {
    const html = await render(<ScrollbarGutter />);

    expect(html).toContain(
      'data-script="components/routes/tips/scrollbar-gutter"',
    );
  });
});

describe(Blog, () => {
  it("renders HTML page listing blogs", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(
      vi.fn().mockResolvedValue([
        {
          _createdAt: "2024-01-01T00:00:00Z",
          _id: "blog-1",
          _updatedAt: "2024-02-01T00:00:00Z",
          author: "Author",
          blogCategory: { _id: "cat-1", title: "Blog" },
          description: "A post",
          slug: { current: "my-post" },
          title: "My Post",
        },
      ]),
    );

    const html = await render(<Blog />);

    expect(html).toContain("<html");
    expect(html).toContain("Blog");
  });

  it("renders empty state when no blogs", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(vi.fn().mockResolvedValue([]));

    const html = await render(<Blog />);

    expect(html).toContain("<html");
  });

  it("applies sky-300 class for Dev Reads category", async () => {
    vi.clearAllMocks();
    mockBlogModelWith(
      vi.fn().mockResolvedValue([
        {
          _createdAt: "2024-01-01T00:00:00Z",
          _id: "blog-2",
          _updatedAt: "2024-02-01T00:00:00Z",
          blogCategory: { _id: "cat-2", title: "Dev Reads" },
          description: "A dev reads post",
          slug: { current: "dev-reads-post" },
          title: "Dev Reads Post",
        },
      ]),
    );

    const html = await render(<Blog />);

    expect(html).toContain("Dev Reads");
    expect(html).toContain("text-sky-300");
  });
});

describe(Courses, () => {
  it("renders HTML page with courses content", async () => {
    vi.clearAllMocks();
    coursePathData.learningPaths = [];
    coursePathData.latestUpdate = undefined;

    const html = await render(<Courses />);

    expect(html).toContain("<html");
    expect(html).toContain("Recommended Courses");
  });

  it("includes last updated date when latestUpdate is set", async () => {
    vi.clearAllMocks();
    coursePathData.learningPaths = [];
    coursePathData.latestUpdate = {
      _id: "update-1",
      _updatedAt: "2024-06-01T00:00:00Z",
    };

    const html = await render(<Courses />);

    expect(html).toContain("Last Updated:");
  });

  it("declares course-completion script via data-script on the courses container", async () => {
    const html = await render(<Courses />);

    expect(html).toContain(
      'data-script="components/courses/course-completion"',
    );
  });

  it("hides sign-in prompt and shows progress section when authenticated", async () => {
    vi.clearAllMocks();
    coursePathData.learningPaths = [];
    coursePathData.latestUpdate = undefined;
    globalStore.isAuthenticated = true;

    let html = "";

    try {
      html = await render(<Courses />);
    } finally {
      globalStore.isAuthenticated = false;
    }

    expect(html).toContain('id="sign-in-prompt"');
    expect(html).toContain('id="auth-section-header"');
  });
});
