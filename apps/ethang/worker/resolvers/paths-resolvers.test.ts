import get from "lodash/get.js";
import { describe, expect, it, vi } from "vitest";

import { path, paths } from "./paths-resolvers.ts";

const mockPrisma = {
  path: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
};

vi.mock("../prisma-client.ts", () => ({
  getPrismaClient: () => mockPrisma,
}));

describe("path resolvers", () => {
  describe("path", () => {
    it("returns a single path by id", async () => {
      mockPrisma.path.findUnique.mockResolvedValue({
        _count: { courses: 3 },
        id: "path-1",
        name: "Frontend",
        order: 1,
      });

      const result = await path(
        {},
        { id: "path-1" },
        // @ts-expect-error env mock
        { env: {} },
      );

      expect(mockPrisma.path.findUnique).toHaveBeenCalledWith({
        include: {
          _count: {
            select: { courses: true },
          },
        },
        where: { id: "path-1" },
      });
      expect(get(result, ["id"])).toBe("path-1");
      expect(get(result, ["courseCount"])).toBe(3);
    });
  });

  describe("paths", () => {
    it("returns paths with course count", async () => {
      mockPrisma.path.findMany.mockResolvedValue([
        {
          _count: { courses: 10 },
          id: "1",
          name: "Backend",
          order: 2,
        },
      ]);

      const result = await paths(
        {},
        {},
        // @ts-expect-error env mock
        { env: {} },
      );

      expect(mockPrisma.path.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: { courses: true },
          },
        },
        orderBy: {
          order: "asc",
        },
      });
      expect(get(result, [0, "courseCount"])).toBe(10);
      expect(get(result, [0, "name"])).toBe("Backend");
    });
  });
});
