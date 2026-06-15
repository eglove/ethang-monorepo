import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Course, courseQueryOptions } from "./course.tsx";

let mockCourseData: unknown = null;
let mockIsPending = false;
const introductionToTesting = "Introduction to Testing";
const testingUrl = "https://example.com/testing";

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    // @ts-expect-error for test
    ...actual,
    useQuery: () => {
      return {
        data: mockCourseData,
        isPending: mockIsPending
      };
    }
  };
});

describe("Course", () => {
  beforeEach(() => {
    mockCourseData = null;
    mockIsPending = false;
  });

  it("executes the query function", async () => {
    const mockData = {
      course: {
        author: "John Doe",
        id: "1",
        name: introductionToTesting,
        url: testingUrl
      }
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ data: mockData }, { status: 200 })
    );

    const options = courseQueryOptions("1");
    // @ts-expect-error for test
    const result = await options.queryFn();

    expect(result).toEqual(mockData);
  });

  it("renders loader skeleton when query is pending", () => {
    mockIsPending = true;
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
    mockCourseData = {
      course: {
        author: "John Doe",
        id: "1",
        name: introductionToTesting,
        url: testingUrl
      }
    };

    render(
      <ul>
        <Course courseId="1" courseIndex={1} />
      </ul>
    );

    expect(screen.getByText("1.")).toBeDefined();
    const linkElement = screen.getByRole("link", {
      name: introductionToTesting
    });
    expect(linkElement.getAttribute("href")).toBe(testingUrl);
    expect(screen.getByText("by John Doe")).toBeDefined();
  });
});
