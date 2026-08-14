import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";

const coursesAll = vi.hoisted(() => {
  return vi.fn();
});

vi.mock("cloudflare:workers", () => {
  return { env: { ethang_courses: { coursesAll }, ethang_rss: {} } };
});

import Courses from "../pages/courses.astro";

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(Courses as never);
};

type Course = Record<string, unknown>;

const NAME_ARCHITECTURE = "Architecture";
const NAME_SOFTWARE_ARCHITECTURE = "Software Architecture";

const makeCourse = (overrides: Course = {}) => {
  return {
    author: "Ada",
    courseId: "c1",
    courseIndex: 0,
    learningPathId: "lp1",
    learningPathName: NAME_ARCHITECTURE,
    learningPathOrder: 0,
    name: NAME_SOFTWARE_ARCHITECTURE,
    updatedAt: "2024-01-01T00:00:00.000Z",
    url: "https://x/course",
    ...overrides
  };
};

describe("courses page", () => {
  it("renders the updated date, learning path name, and course", async () => {
    coursesAll.mockResolvedValue([makeCourse()]);
    const html = await render();

    expect(html).toContain("Courses");
    expect(html).toContain("Updated");
    expect(html).toContain(NAME_ARCHITECTURE);
    expect(html).toContain(NAME_SOFTWARE_ARCHITECTURE);
    expect(html).toContain("by Ada");
  });

  it("groups multiple courses into their learning path", async () => {
    coursesAll.mockResolvedValue([
      makeCourse({ courseId: "c1", courseIndex: 0 }),
      makeCourse({ courseId: "c2", courseIndex: 1 })
    ]);
    const html = await render();

    expect(html).toContain("2 course");
    expect(html).toContain("s");
  });

  it("uses the singular for a course count of one", async () => {
    coursesAll.mockResolvedValue([makeCourse()]);
    const html = await render();

    expect(html).toMatch(/1 course/u);
  });

  it("renders a link when the learning path has a url", async () => {
    coursesAll.mockResolvedValue([
      makeCourse({ learningPathUrl: "https://x/path" })
    ]);
    const html = await render();

    expect(html).toContain('href="https://x/path"');
  });

  it("renders the name as text when the learning path has no url", async () => {
    coursesAll.mockResolvedValue([
      makeCourse({ learningPathName: "Plain", learningPathUrl: null })
    ]);
    const html = await render();

    expect(html).toContain("Plain");
  });

  it("maps known swebok foci to their label", async () => {
    coursesAll.mockResolvedValue([makeCourse({ swebokFocus: "architecture" })]);
    const html = await render();

    expect(html).toContain("Software Architecture");
  });

  it("renders the raw swebok focus when it is not in the map", async () => {
    coursesAll.mockResolvedValue([makeCourse({ swebokFocus: "custom" })]);
    const html = await render();

    expect(html).toContain("custom");
  });

  it("omits the updated date when the latest course has no updatedAt", async () => {
    coursesAll.mockResolvedValue([makeCourse({ updatedAt: null })]);
    const html = await render();

    expect(html).not.toContain("Updated");
  });
});
