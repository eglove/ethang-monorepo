import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { curriculumQueryOptions, Route } from "./courses.tsx";

const mockCurriculumStore = {
  data: null as unknown,
  isPending: false
};
const fullStackCurriculum = "Full Stack Curriculum";

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    // @ts-expect-error for test
    ...actual,
    useQuery: () => {
      return {
        data: mockCurriculumStore.data,
        isPending: mockCurriculumStore.isPending
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
    mockCurriculumStore.data = null;
    mockCurriculumStore.isPending = false;
  });

  it("executes the query function", async () => {
    const mockData = {
      id: "curriculum-1",
      learningPaths: [],
      name: fullStackCurriculum,
      updatedAt: "2026-06-15T20:00:00.000Z"
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(mockData, { status: 200 })
    );

    const options = curriculumQueryOptions();
    // @ts-expect-error for test
    const result = await options.queryFn();

    expect(result).toEqual(mockData);
  });

  it("renders loader when query is pending", () => {
    mockCurriculumStore.isPending = true;
    // @ts-expect-error for test
    const Component = Route.component;
    render(<Component />);

    const headings = screen.queryAllByRole("heading");
    expect(headings).toHaveLength(0);
  });

  it("renders curriculum metadata and learning paths with correct offsets", () => {
    mockCurriculumStore.data = {
      id: "curriculum-1",
      learningPaths: [
        {
          courses: [{ id: "c1" }, { id: "c2" }],
          id: "path-1"
        },
        {
          courses: [{ id: "c3" }],
          id: "path-2"
        }
      ],
      name: fullStackCurriculum,
      updatedAt: "2026-06-15T20:00:00.000Z"
    };

    // @ts-expect-error for test
    const Component = Route.component;
    render(<Component />);

    expect(screen.getByText(fullStackCurriculum)).toBeDefined();
    expect(screen.getByText(/Last Updated:/u)).toBeDefined();

    const learningPaths = screen.getAllByTestId("learning-path");
    expect(learningPaths).toHaveLength(2);

    expect(learningPaths[0]?.dataset["id"]).toBe("path-1");
    expect(learningPaths[0]?.dataset["offset"]).toBe("0");

    expect(learningPaths[1]?.dataset["id"]).toBe("path-2");
    expect(learningPaths[1]?.dataset["offset"]).toBe("2"); // first path had 2 courses, so offset is 2
  });
});
