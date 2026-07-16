import { render, screen } from "@testing-library/react";
import isNil from "lodash/isNil.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { coursesAllQueryOptions, LearningPath } from "./learning-path.tsx";

const CONSTRUCTION_PATH_NAME = "Software Construction Path";
const CONSTRUCTION_PATH_URL = "https://example.com/construction";
const CONSTRUCTION_FOCUS = "construction";
const AUTHOR_A = "Author A";
const AUTHOR_B = "Author B";
const COURSE_1_UPDATED_AT = "2024-01-01";
const COURSE_2_UPDATED_AT = "2024-01-02";
const COURSE_3_UPDATED_AT = "2024-01-03";

const mockAllCoursesData: {
  data: unknown;
  isPending: boolean;
} = {
  data: null,
  isPending: false
};

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();
  type QueryOptions = {
    queryKey?: unknown[];
    select?: (data: unknown) => unknown;
  };

  return {
    // @ts-expect-error for tests
    ...actual,
    useQuery: (options: QueryOptions) => {
      let { data } = mockAllCoursesData;
      if (!isNil(data) && options.select) {
        data = options.select(data);
      }
      return {
        data,
        isPending: mockAllCoursesData.isPending
      };
    }
  };
});

describe("LearningPath", () => {
  beforeEach(() => {
    mockAllCoursesData.data = null;
    mockAllCoursesData.isPending = false;
  });

  it("renders loaders when query is pending", () => {
    mockAllCoursesData.isPending = true;
    render(<LearningPath learningPathId="path-1" />);

    const heading = screen.queryByRole("heading");
    expect(heading).toBeNull();
  });

  it("renders learning path metadata and list of courses", () => {
    mockAllCoursesData.data = [
      {
        author: AUTHOR_A,
        courseId: "course-1",
        courseIndex: 35,
        learningPathId: "path-1",
        learningPathName: CONSTRUCTION_PATH_NAME,
        learningPathOrder: 1,
        learningPathUrl: CONSTRUCTION_PATH_URL,
        name: "Code Construction Basics",
        swebokFocus: CONSTRUCTION_FOCUS,
        updatedAt: COURSE_1_UPDATED_AT,
        url: `${CONSTRUCTION_PATH_URL}/basics`
      },
      {
        author: AUTHOR_B,
        courseId: "course-2",
        courseIndex: 36,
        learningPathId: "path-1",
        learningPathName: CONSTRUCTION_PATH_NAME,
        learningPathOrder: 2,
        learningPathUrl: CONSTRUCTION_PATH_URL,
        name: "Refactoring and Patterns",
        swebokFocus: CONSTRUCTION_FOCUS,
        updatedAt: COURSE_2_UPDATED_AT,
        url: "https://example.com/refactoring"
      },
      {
        author: "Author C",
        courseId: "course-3",
        courseIndex: 50,
        learningPathId: "other-path",
        learningPathName: "Other Path",
        learningPathOrder: 1,
        learningPathUrl: CONSTRUCTION_PATH_URL,
        name: "Other Course",
        swebokFocus: null,
        updatedAt: COURSE_3_UPDATED_AT,
        url: "https://example.com/other"
      }
    ];

    render(<LearningPath learningPathId="path-1" />);

    const pathLink = screen.getByRole("link", {
      name: CONSTRUCTION_PATH_NAME
    });
    expect(pathLink.getAttribute("href")).toBe(CONSTRUCTION_PATH_URL);
    expect(screen.getByText("Software Construction")).toBeDefined();
    expect(screen.getByText("2 courses")).toBeDefined();

    expect(screen.getByText("35.")).toBeDefined();
    expect(screen.getByText("36.")).toBeDefined();

    expect(screen.getByText("Code Construction Basics")).toBeDefined();
    expect(screen.getByText("Refactoring and Patterns")).toBeDefined();
  });

  it("executes the coursesAll query function", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json([], { status: 200 })
    );

    const options = coursesAllQueryOptions();
    // @ts-expect-error for tests
    const result = await options.queryFn();

    expect(result).toEqual([]);
  });

  it("falls back to a generic badge when the focus key is unknown", () => {
    mockAllCoursesData.data = [
      {
        author: AUTHOR_A,
        courseId: "course-1",
        courseIndex: 1,
        learningPathId: "path-1",
        learningPathName: CONSTRUCTION_PATH_NAME,
        learningPathOrder: 1,
        learningPathUrl: null,
        name: "Mystery Course",
        swebokFocus: "unknown-focus",
        updatedAt: COURSE_1_UPDATED_AT,
        url: "https://example.com/x"
      }
    ];

    render(<LearningPath learningPathId="path-1" />);
    expect(screen.getByText("unknown-focus")).toBeDefined();
  });

  it("renders singular course label when there is one course", () => {
    mockAllCoursesData.data = [
      {
        author: AUTHOR_A,
        courseId: "course-1",
        courseIndex: 1,
        learningPathId: "path-1",
        learningPathName: CONSTRUCTION_PATH_NAME,
        learningPathOrder: 1,
        learningPathUrl: null,
        name: "Solo Course",
        swebokFocus: null,
        updatedAt: COURSE_1_UPDATED_AT,
        url: "https://example.com/x"
      }
    ];

    render(<LearningPath learningPathId="path-1" />);
    expect(screen.getByText("1 course")).toBeDefined();
  });
});
