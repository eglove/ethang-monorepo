import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";

vi.mock("cloudflare:workers", () => {
  return {
    env: {
      ethang_courses: {
        coursesAll: async () => {
          return [];
        }
      },
      ethang_rss: {}
    }
  };
});

import BlogIndex from "./blog/index.astro";
import BlogPage from "./blog/page/[page].astro";
import Courses from "./courses.astro";
import Index from "./index.astro";
import Login from "./login.astro";
import Rss from "./rss.astro";
import TipsIndex from "./tips/index.astro";
import ScrollContainers from "./tips/scroll-containers.astro";
import ScrollbarGutter from "./tips/scrollbar-gutter.astro";

const render = async <T>(
  component: T,
  properties?: Record<string, unknown>
) => {
  const container = await AstroContainer.create();
  return container.renderToString(
    component as never,
    { props: properties } as never
  );
};

describe("tips index page", () => {
  it("renders the tips heading", async () => {
    const html = await render(TipsIndex);
    expect(html).toContain("Tips");
  });
});

describe("scroll-containers tip", () => {
  it("renders the tip content", async () => {
    const html = await render(ScrollContainers);
    expect(html).toContain("Scroll container");
  });
});

describe("scrollbar-gutter tip", () => {
  it("renders the tip content", async () => {
    const html = await render(ScrollbarGutter);
    expect(html).toContain("scrollbar-gutter");
  });
});

describe("index (home) page", () => {
  it("renders the profile name", async () => {
    const html = await render(Index);
    expect(html).toContain("Ethan Glover");
  });
});

describe("blog index page", () => {
  it("renders the blog heading", async () => {
    const html = await render(BlogIndex);
    expect(html).toContain("Blog");
  });
});

describe("blog page [page] page", () => {
  it("renders the paginated blog list", async () => {
    const html = await render(BlogPage, { params: { page: "1" } });
    expect(html).toContain("Blog");
  });
});

describe("login page", () => {
  it("renders the sign-in form", async () => {
    const html = await render(Login);
    expect(html).toContain("Sign In to Your Account");
  });
});

describe("rss page", () => {
  it("renders the signed-out state", async () => {
    const html = await render(Rss);
    expect(html).toContain("Sign in to manage RSS feeds.");
  });
});

describe("courses page", () => {
  it("renders the courses heading with an empty list", async () => {
    const html = await render(Courses);
    expect(html).toContain("Courses");
  });
});
