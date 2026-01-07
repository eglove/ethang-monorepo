import { describe, expect, it, vi } from "vitest";

import { courses } from "./courses-resolvers.ts";

const mockPrisma = {
  course: {
    findMany: vi.fn(),
  },
};

vi.mock("../prisma-client", () => ({
  getPrismaClient: () => mockPrisma,
}));

describe("courses resolver", () => {
  it("returns all courses", async () => {
    const mockCourses = [
      {
        author: "Author 1",
        id: "1",
        name: "Course 1",
        url: "url-1",
      },
    ];
    mockPrisma.course.findMany.mockResolvedValue(mockCourses);

    const result = await courses(
      {},
      {},
      // @ts-expect-error env mock
      { env: {} },
    );

    expect(result).toEqual(mockCourses);
    expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
      include: {
        knowledgeAreas: true,
        path: true,
      },
      orderBy: {
        order: "asc",
      },
      where: {},
    });
  });

  it("filters courses by knowledge area", async () => {
    const mockCourses = [
      {
        author: "Author 1",
        id: "1",
        knowledgeAreas: [{ id: "ka1", name: "KA 1" }],
        name: "Course 1",
        url: "url-1",
      },
    ];
    mockPrisma.course.findMany.mockResolvedValue(mockCourses);

    const where = {
      knowledgeAreas: { some: { id: { in: ["ka1"] } } },
    };

    const result = await courses(
      {},
      { where },
      // @ts-expect-error env mock
      { env: {} },
    );

    expect(result).toEqual(mockCourses);
    expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
      include: {
        knowledgeAreas: true,
        path: true,
      },
      orderBy: {
        order: "asc",
      },
      where,
    });
  });
});
