import type { GraphQLResolveInfo } from "graphql/type";

import { describe, expect, it, vi } from "vitest";

import {
  course,
  courses,
  createCourse,
  deleteCourse,
  updateCourse,
} from "./courses-resolvers.ts";

const mockPrisma = {
  course: {
    create: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("../prisma-client", () => ({
  getPrismaClient: () => mockPrisma,
  prismaSelect: vi.fn().mockReturnValue({ id: true, name: true }),
}));

describe("courses resolver", () => {
  it("returns a single course", async () => {
    const mockCourse = {
      author: "Author 1",
      id: "1",
      name: "Course 1",
      url: "url-1",
    };
    mockPrisma.course.findUnique.mockResolvedValue(mockCourse);

    const result = await course(
      {},
      { id: "1" },
      // @ts-expect-error env mock
      { env: {} },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as GraphQLResolveInfo,
    );

    expect(result).toEqual(mockCourse);
  });

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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as GraphQLResolveInfo,
    );

    expect(result).toEqual(mockCourses);
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as GraphQLResolveInfo,
    );

    expect(result).toEqual(mockCourses);
  });

  it("creates a course", async () => {
    const mockCourse = { id: "1", name: "New Course" };
    mockPrisma.course.create.mockResolvedValue(mockCourse);

    const result = await createCourse(
      {},
      {
        data: {
          author: "Author",
          name: "New Course",
          order: 1,
          pathId: "path-id",
          url: "url",
        },
      },
      // @ts-expect-error env mock
      { env: {} },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as GraphQLResolveInfo,
    );

    expect(result).toEqual(mockCourse);
  });

  it("updates a course", async () => {
    const mockCourse = { id: "1", name: "Updated Course" };
    mockPrisma.course.update.mockResolvedValue(mockCourse);

    const result = await updateCourse(
      {},
      {
        data: {
          author: "Author",
          name: "Updated Course",
          order: 1,
          pathId: "path-id",
          url: "url",
        },
        id: "1",
      },
      // @ts-expect-error env mock
      { env: {} },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as GraphQLResolveInfo,
    );

    expect(result).toEqual(mockCourse);
  });

  it("deletes a course", async () => {
    const mockCourse = { id: "1" };
    mockPrisma.course.delete.mockResolvedValue(mockCourse);

    const result = await deleteCourse(
      {},
      { id: "1" },
      // @ts-expect-error env mock
      { env: {} },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as GraphQLResolveInfo,
    );

    expect(result).toEqual(mockCourse);
  });
});
