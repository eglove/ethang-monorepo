import get from "lodash/get.js";
import { describe, expect, it, vi } from "vitest";

import { knowledgeArea, knowledgeAreas } from "./knowledge-area-resolvers.ts";

const mockPrisma = {
  knowledgeArea: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
};

vi.mock("../prisma-client.ts", () => ({
  getPrismaClient: () => mockPrisma,
}));

describe("knowledgeArea resolvers", () => {
  describe("knowledgeArea", () => {
    it("returns a single knowledge area by id", async () => {
      mockPrisma.knowledgeArea.findUnique.mockResolvedValue({
        _count: { courses: 5 },
        id: "ka-1",
        name: "TypeScript",
        order: 2,
      });

      const result = await knowledgeArea(
        {},
        { id: "ka-1" },
        // @ts-expect-error env mock
        { env: {} },
      );

      expect(mockPrisma.knowledgeArea.findUnique).toHaveBeenCalledWith({
        include: {
          _count: {
            select: { courses: true },
          },
        },
        where: { id: "ka-1" },
      });
      expect(get(result, ["id"])).toBe("ka-1");
      expect(get(result, ["courseCount"])).toBe(5);
    });
  });

  describe("knowledgeAreas", () => {
    it("returns knowledge areas with course count", async () => {
      mockPrisma.knowledgeArea.findMany.mockResolvedValue([
        {
          _count: { courses: 2 },
          id: "1",
          name: "React",
          order: 1,
        },
      ]);

      const result = await knowledgeAreas(
        {},
        {},
        // @ts-expect-error env mock
        { env: {} },
      );

      expect(mockPrisma.knowledgeArea.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: { courses: true },
          },
        },
        orderBy: {
          order: "asc",
        },
      });
      expect(get(result, [0, "courseCount"])).toBe(2);
      expect(get(result, [0, "name"])).toBe("React");
    });
  });
});
