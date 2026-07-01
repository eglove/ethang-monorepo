import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { coursesAllQueryOptions, Route } from "./courses.tsx";

const mockStore = {
  data: null as unknown,
  isPending: false
};

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    // @ts-expect-error for test
    ...actual,
    useQuery: () => {
      return {
        data: mockStore.data,
        isPending: mockStore.isPending
      };
    }
  };
});

vi.mock("../components/courses/learning-path.tsx", () => {
  return {
    LearningPath: ({
      courseOffset,
      learningPathId
    }: {
      courseOffset: number;
      learningPathId: string;
    }) => {
      return (
        <div
          data-id={learningPathId}
          data-offset={courseOffset}
          data-testid="learning-path"
        >
          Mocked Learning Path {learningPathId}
        </div>
      );
    }
  };
});

// We need a Router provider/context since Route is created with createFileRoute("/courses")
vi.mock("@tanstack/react-router", () => {
  return {
    createFileRoute: (path: string) => {
      return (config: { component: React.ComponentType }) => {
        return {
          component: config.component,
          path
        };
      };
    },
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => {
      return <a href={to}>{children}</a>;
    }
  };
});

describe("Courses Route Component", () => {
  beforeEach(() => {
    mockStore.data = null;
    mockStore.isPending = false;
  });

  it("executes the query function", async () => {
    const mockData = [
      {
        author: "John Doe",
        courseId: "c1",
        courseIndex: 1,
        learningPathId: "path-1",
        learningPathName: "Software Construction",
        learningPathOrder: 1,
        learningPathUrl: null,
        name: "Introduction to Testing",
        swebokFocus: "construction",
        url: "https://example.com/testing"
      }
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(mockData, { status: 200 })
    );

    const options = coursesAllQueryOptions();
    // @ts-expect-error for test
    const result = await options.queryFn();

    expect(result).toEqual(mockData);
  });

  it("renders loader when query is pending", () => {
    mockStore.isPending = true;
    // @ts-expect-error for test
    const Component = Route.component;
    render(<Component />);

    const headings = screen.queryAllByRole("heading");
    expect(headings).toHaveLength(0);
  });

  it("renders curriculum metadata and learning paths with correct offsets", () => {
    mockStore.data = [
      {
        author: "Author One",
        courseId: "c1",
        courseIndex: 1,
        learningPathId: "path-1",
        learningPathName: "Software Construction",
        learningPathOrder: 1,
        learningPathUrl: null,
        name: "Course 1",
        swebokFocus: "construction",
        url: "https://example.com/c1"
      },
      {
        author: "Author Two",
        courseId: "c2",
        courseIndex: 2,
        learningPathId: "path-1",
        learningPathName: "Software Construction",
        learningPathOrder: 2,
        learningPathUrl: null,
        name: "Course 2",
        swebokFocus: "construction",
        url: "https://example.com/c2"
      },
      {
        author: "Author Three",
        courseId: "c3",
        courseIndex: 1,
        learningPathId: "path-2",
        learningPathName: "Software Design",
        learningPathOrder: 1,
        learningPathUrl: null,
        name: "Course 3",
        swebokFocus: "design",
        url: "https://example.com/c3"
      }
    ];

    // @ts-expect-error for test
    const Component = Route.component;
    render(<Component />);

    const learningPaths = screen.getAllByTestId("learning-path");
    expect(learningPaths).toHaveLength(2);

    expect(learningPaths[0]?.dataset["id"]).toBe("path-1");
    expect(learningPaths[0]?.dataset["offset"]).toBe("0");

    expect(learningPaths[1]?.dataset["id"]).toBe("path-2");
    expect(learningPaths[1]?.dataset["offset"]).toBe("0"); // courseIndex 1 - 1 = 0
  });
});
