import { describe, expect, it, vi } from "vitest";

import { getCourseUrlByCourseId } from "./get-course-url-by-course-id.ts";

describe("getCourseUrlByCourseId", () => {
  it("returns course url when course exists", async () => {
    // Mock the database object with a select method that returns the expected course
    const mockDatabase = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ url: "https://example.com/course" }]),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis()
    };

    // @ts-expect-error for test
    const result = await getCourseUrlByCourseId(mockDatabase, "course-1");

    expect(result).toBe("https://example.com/course");
    expect(mockDatabase.select).toHaveBeenCalled();
    expect(mockDatabase.from).toHaveBeenCalledWith(expect.any(Object)); // coursesTable
    expect(mockDatabase.limit).toHaveBeenCalledWith(1);
  });

  it("throws when course is missing", async () => {
    // Mock the database object with a select method that returns an empty array
    const mockDatabase = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis()
    };

    try {
      // @ts-expect-error for test
      await getCourseUrlByCourseId(mockDatabase, "missing");
      expect.fail("Should have thrown 'Course not found' error");
    } catch (error) {
      expect((error as Error).message).toBe("Course not found");
    }
  });

  it("throws when course is undefined at index 0", async () => {
    // Mock the database object with a select method that returns an array with undefined
    const mockDatabase = {
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([undefined]),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis()
    };

    try {
      // @ts-expect-error for test
      await getCourseUrlByCourseId(mockDatabase, "missing");
      expect.fail("Should have thrown 'Course not found' error");
    } catch (error) {
      expect((error as Error).message).toBe("Course not found");
    }
  });
});
