import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  Course,
  courseQueryOptions,
  coursesAllQueryOptions
} from "./course.tsx";

type QueryKey = [string, ...unknown[]];

const mockCourseStore: {
  allCoursesData: unknown;
  courseData: unknown;
  isLoading: boolean;
  isPending: boolean;
} = {
  allCoursesData: null,
  courseData: null,
  isLoading: false,
  isPending: false
};
const introductionToTesting = "Introduction to Testing";
const testingUrl = "https://example.com/testing";

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    // @ts-expect-error for test
    ...actual,
    useQuery: (options: { queryKey: QueryKey }) => {
      const [key] = options.queryKey;
      if ("coursesAll" === key) {
        return {
          data: mockCourseStore.allCoursesData,
          isLoading: mockCourseStore.isLoading,
          isPending: false
        };
      }
      return {
        data: mockCourseStore.courseData,
        isLoading: false,
        isPending: mockCourseStore.isPending
      };
    }
  };
});

describe("Course", () => {
  beforeEach(() => {
    mockCourseStore.courseData = null;
    mockCourseStore.allCoursesData = null;
    mockCourseStore.isPending = false;
    mockCourseStore.isLoading = false;
  });

  it("executes the query function", async () => {
    const mockData = {
      author: "John Doe",
      id: "1",
      name: introductionToTesting,
      url: testingUrl
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(mockData, { status: 200 })
    );

    const options = courseQueryOptions("1");
    // @ts-expect-error for test
    const result = await options.queryFn();

    expect(result).toEqual(mockData);
  });

  it("executes the coursesAll query function", async () => {
    const mockData = [
      {
        author: "John",
        id: "1",
        name: "Course 1",
        url: "https://example.com/1"
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

  it("renders loader skeleton when query is pending", () => {
    mockCourseStore.isPending = true;
    render(
      <ul>
        <Course courseId="1" courseIndex={1} />
      </ul>
    );

    // Skeleton should be active (e.g. elements are wrapped/styled as skeleton, or we can check index is not present/skeleton class is there)
    const listElement = screen.getByRole("listitem", { hidden: true });
    expect(listElement).toBeDefined();
  });

  it("renders course details when data is loaded", () => {
    mockCourseStore.courseData = {
      author: "John Doe",
      id: "1",
      name: introductionToTesting,
      url: testingUrl
    };

    mockCourseStore.allCoursesData = [
      { id: "0", name: "Course Zero" },
      { id: "1", name: introductionToTesting }
    ];

    render(
      <ul>
        <Course courseId="1" courseIndex={1} />
      </ul>
    );

    expect(screen.getByText("2.")).toBeDefined();
    const linkElement = screen.getByRole("link", {
      name: introductionToTesting
    });
    expect(linkElement.getAttribute("href")).toBe(testingUrl);
    expect(screen.getByText("by John Doe")).toBeDefined();
  });
});
