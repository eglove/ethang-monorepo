import { render, screen } from "@testing-library/react";
import isNil from "lodash/isNil.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Course } from "./course.tsx";

type QueryKey = [string, ...unknown[]];

const mockAllCoursesStore: {
  allCoursesData: unknown;
  isPending: boolean;
} = {
  allCoursesData: null,
  isPending: false
};
const introductionToTesting = "Introduction to Testing";
const testingUrl = "https://example.com/testing";

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    // @ts-expect-error for test
    ...actual,
    useQuery: (options: {
      queryKey: QueryKey;
      select?: (data: unknown) => unknown;
    }) => {
      let data = mockAllCoursesStore.allCoursesData;
      if (!isNil(data) && options.select) {
        data = options.select(data);
      }
      return {
        data,
        isPending: mockAllCoursesStore.isPending
      };
    }
  };
});

describe("Course", () => {
  beforeEach(() => {
    mockAllCoursesStore.allCoursesData = null;
    mockAllCoursesStore.isPending = false;
  });

  it("renders loader skeleton when query is pending", () => {
    mockAllCoursesStore.isPending = true;
    render(
      <ul>
        <Course courseId="1" />
      </ul>
    );

    // Skeleton should be active (e.g. elements are wrapped/styled as skeleton, or we can check index is not present/skeleton class is there)
    const listElement = screen.getByRole("listitem", { hidden: true });
    expect(listElement).toBeDefined();
  });

  it("renders course details when data is loaded", () => {
    mockAllCoursesStore.allCoursesData = [
      {
        author: "John Doe",
        courseId: "0",
        courseIndex: 1,
        name: "Course Zero",
        url: "https://example.com/0"
      },
      {
        author: "John Doe",
        courseId: "1",
        courseIndex: 2,
        name: introductionToTesting,
        url: testingUrl
      }
    ];

    render(
      <ul>
        <Course courseId="1" />
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
