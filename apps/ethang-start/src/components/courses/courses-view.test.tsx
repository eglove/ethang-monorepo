import { render, screen } from "@testing-library/react";
import { Array as EffectArray } from "effect";
import map from "lodash/map.js";
import some from "lodash/some.js";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { CoursesView } from "./courses-view.tsx";

const { mockCourses } = vi.hoisted(() => {
  return {
    mockCourses: [
      {
        author: "Test Author",
        courseId: "course-1",
        courseIndex: 1,
        learningPathId: "path-1",
        learningPathName: "Learning Path One",
        learningPathOrder: 1,
        learningPathUrl: null,
        name: "Course Two",
        swebokFocus: "architecture",
        updatedAt: "2024-01-10T10:00:00Z",
        url: "https://example.com/course-2"
      },
      {
        author: "Test Author",
        courseId: "course-0",
        courseIndex: 0,
        learningPathId: "path-1",
        learningPathName: "Learning Path One",
        learningPathOrder: 1,
        learningPathUrl: null,
        name: "Course One",
        swebokFocus: null,
        updatedAt: "2024-01-15T10:00:00Z",
        url: "https://example.com/course-1"
      },
      {
        author: "Other Author",
        courseId: "course-2",
        courseIndex: 0,
        learningPathId: "path-2",
        learningPathName: "Learning Path Two",
        learningPathOrder: 2,
        learningPathUrl: "https://example.com/path-2",
        name: "Course Three",
        swebokFocus: "testing",
        updatedAt: "2024-01-20T10:00:00Z",
        url: "https://example.com/course-3"
      }
    ]
  };
});

vi.mock("@astryxdesign/core", () => {
  return {
    Badge: ({ label }: { label: React.ReactNode }) => {
      return <span data-testid="badge">{label}</span>;
    },
    Card: ({ children, ...properties }: { children: React.ReactNode }) => {
      return (
        <div data-testid="card" {...properties}>
          {children}
        </div>
      );
    },
    Heading: ({
      children,
      level
    }: {
      children: React.ReactNode;
      level?: number;
    }) => {
      const Tag = `h${level ?? 1}` as any;
      return <Tag>{children}</Tag>;
    },
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => {
      return <a href={href}>{children}</a>;
    },
    Text: ({ children, ...properties }: { children: React.ReactNode }) => {
      return (
        <span data-testid="text" {...properties}>
          {children}
        </span>
      );
    },
    VStack: ({ children, ...properties }: { children: React.ReactNode }) => {
      return (
        <div data-testid="vstack" {...properties}>
          {children}
        </div>
      );
    }
  };
});

describe("CoursesView", () => {
  it("renders the page heading", () => {
    render(<CoursesView courses={mockCourses} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Courses" })
    ).toBeDefined();
  });

  it("renders one card per learning path", () => {
    const { container } = render(<CoursesView courses={mockCourses} />);
    expect(container.querySelectorAll("[data-learning-path]")).toHaveLength(2);
  });

  it("renders a badge for swebok focus", () => {
    render(<CoursesView courses={mockCourses} />);
    const badges = screen.getAllByTestId("badge");
    expect(some(badges, { textContent: "Software Architecture" })).toBe(true);
  });

  it("renders the course count per learning path", () => {
    render(<CoursesView courses={mockCourses} />);
    expect(screen.getByText(/2 courses/iu)).toBeDefined();
    expect(screen.getByText(/1 course/iu)).toBeDefined();
  });

  it("sorts courses within a path by courseIndex", () => {
    const { container } = render(<CoursesView courses={mockCourses} />);
    const firstPathCourses = EffectArray.fromIterable(
      container.querySelectorAll(":scope [data-learning-path='path-1'] li")
    );
    expect(firstPathCourses[0]?.textContent).toContain("Course One");
    expect(firstPathCourses[1]?.textContent).toContain("Course Two");
  });

  it("shows the most recent updated timestamp", () => {
    render(<CoursesView courses={mockCourses} />);
    expect(
      screen.getByText(
        "Last Updated: Saturday, January 20, 2024 at 10:00:00 AM UTC"
      )
    ).toBeDefined();
  });

  it("formats the course author", () => {
    render(<CoursesView courses={mockCourses} />);
    expect(screen.getAllByText(/by Test Author/u).length).toBeGreaterThan(0);
  });

  it("uses an external link for a learning path url", () => {
    render(<CoursesView courses={mockCourses} />);
    const link = screen.getByText("Learning Path Two").closest("a");
    expect(link).toBeDefined();
    expect(link?.getAttribute("href")).toBe("https://example.com/path-2");
  });

  it("omits the last-updated line when no course has an updatedAt", () => {
    const noDates = map(mockCourses, (course) => {
      return { ...course, updatedAt: "" };
    });
    render(<CoursesView courses={noDates} />);
    expect(screen.queryByText(/Last Updated/u)).toBeNull();
  });
});
