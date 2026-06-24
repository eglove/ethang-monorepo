import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LearningPath, learningPathQueryOptions } from "./learning-path.tsx";

const mockLearningPathStore = {
  courseDataMap: {} as Record<string, unknown>,
  data: null as unknown,
  isPending: false
};

const softwareConstructionPath = "Software Construction Path";
const consturctionUrl = "https://example.com/construction";

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    // @ts-expect-error for tests
    ...actual,
    useQuery: (options: { queryKey: string[] }) => {
      const [key, courseId = ""] = options.queryKey;
      if ("learningPath" === key) {
        return {
          data: mockLearningPathStore.data,
          isPending: mockLearningPathStore.isPending
        };
      }

      return {
        data: mockLearningPathStore.courseDataMap[courseId] ?? null,
        isPending: false
      };
    }
  };
});

describe("LearningPath", () => {
  beforeEach(() => {
    mockLearningPathStore.data = null;
    mockLearningPathStore.isPending = false;
    mockLearningPathStore.courseDataMap = {};
  });

  it("executes the query function", async () => {
    const mockData = {
      courses: [],
      id: "path-1",
      name: softwareConstructionPath,
      swebokFocus: "construction",
      url: consturctionUrl
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(mockData, { status: 200 })
    );

    const options = learningPathQueryOptions("path-1");
    // @ts-expect-error for test
    const result = await options.queryFn();

    expect(result).toEqual(mockData);
  });

  it("renders loaders when query is pending", () => {
    mockLearningPathStore.isPending = true;
    render(<LearningPath courseOffset={0} learningPathId="path-1" />);

    const heading = screen.queryByRole("heading");
    expect(heading).toBeNull();
  });

  it("renders learning path metadata and list of courses", () => {
    mockLearningPathStore.data = {
      courses: [{ id: "course-1" }, { id: "course-2" }],
      id: "path-1",
      name: softwareConstructionPath,
      swebokFocus: "construction",
      url: consturctionUrl
    };

    mockLearningPathStore.courseDataMap["course-1"] = {
      author: "Author One",
      id: "course-1",
      name: "Code Construction Basics",
      url: "https://example.com/c1"
    };

    mockLearningPathStore.courseDataMap["course-2"] = {
      author: "Author Two",
      id: "course-2",
      name: "Refactoring and Patterns",
      url: "https://example.com/c2"
    };

    render(<LearningPath courseOffset={5} learningPathId="path-1" />);

    const pathLink = screen.getByRole("link", {
      name: softwareConstructionPath
    });
    expect(pathLink.getAttribute("href")).toBe(consturctionUrl);
    expect(screen.getByText("Software Construction")).toBeDefined(); // swebokFocusMap translates "construction"
    expect(screen.getByText("2 courses")).toBeDefined();

    // Verify individual courses are rendered with offset course index
    expect(screen.getByText("6.")).toBeDefined();
    expect(screen.getByText("7.")).toBeDefined();

    expect(
      screen.getByRole("link", { name: "Code Construction Basics" })
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Refactoring and Patterns" })
    ).toBeDefined();
  });
});
