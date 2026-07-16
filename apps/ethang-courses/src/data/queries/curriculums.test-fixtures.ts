import { vi } from "vitest";

export const CREATED_AT = "2023-01-01";
export const UPDATED_AT = "2023-01-01";
export const COURSE_1 = "course-1";
export const LP_1 = "lp-1";
export const CURRICULUM_1 = "curriculum-1";
export const TEST_COURSE = "Test Course";
export const TEST_AUTHOR = "Test Author";
export const EXAMPLE_COURSE = "https://example.com/course-1";
export const TEST_LP = "Test Learning Path";
export const TEST_FOCUS = "testing";
export const EXAMPLE_LP = "https://example.com/lp-1";
export const TEST_CURRICULUM = "Test Curriculum";
export const EXAMPLE_CURRICULUM = "https://example.com/curriculum-1";

export const mockCourseData = {
  author: TEST_AUTHOR,
  createdAt: CREATED_AT,
  id: COURSE_1,
  name: TEST_COURSE,
  updatedAt: UPDATED_AT,
  url: EXAMPLE_COURSE
};

export const mockLpDataWithUrl = {
  createdAt: CREATED_AT,
  id: LP_1,
  name: TEST_LP,
  swebokFocus: TEST_FOCUS,
  updatedAt: UPDATED_AT,
  url: EXAMPLE_LP
};

export const mockLpData = mockLpDataWithUrl;

export const mockLpDataWithoutUrl = {
  ...mockLpDataWithUrl,
  url: null
};

export const mockCurriculumData = {
  createdAt: CREATED_AT,
  id: CURRICULUM_1,
  name: TEST_CURRICULUM,
  updatedAt: UPDATED_AT,
  url: EXAMPLE_CURRICULUM
};

export const mockCurriculumDataWithoutUrl = {
  ...mockCurriculumData,
  url: null
};

export type MockDatabase = {
  select: ReturnType<typeof vi.fn>;
};

export type MockSelectChain = {
  from: ReturnType<typeof vi.fn>;
  limit?: ReturnType<typeof vi.fn>;
  orderBy?: ReturnType<typeof vi.fn>;
  where?: ReturnType<typeof vi.fn>;
};

export const makeSelectMock = (results: readonly MockSelectChain[]) => {
  const select = vi.fn();
  for (const result of results) {
    select.mockReturnValueOnce(result);
  }
  return { select };
};
