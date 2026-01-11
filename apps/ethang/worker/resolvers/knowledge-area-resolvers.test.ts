import type { GraphQLResolveInfo } from "graphql/type";

import get from "lodash/get.js";
import { describe, expect, it, vi } from "vitest";

import {
  createKnowledgeArea,
  deleteKnowledgeArea,
  knowledgeArea,
  knowledgeAreas,
  updateKnowledgeArea,
} from "./knowledge-area-resolvers.ts";

const mockPrisma = {
  knowledgeArea: {
    create: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("../prisma-client.ts", () => ({
  getPrismaClient: () => mockPrisma,
  prismaSelect: vi.fn().mockReturnValue({ id: true, name: true }),
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        {} as GraphQLResolveInfo,
      );

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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        {} as GraphQLResolveInfo,
      );

      expect(get(result, [0, "courseCount"])).toBe(2);
      expect(get(result, [0, "name"])).toBe("React");
    });
  });

  describe("createKnowledgeArea", () => {
    it("creates a knowledge area", async () => {
      const mockKA = { id: "1", name: "New KA" };
      mockPrisma.knowledgeArea.create.mockResolvedValue(mockKA);

      const result = await createKnowledgeArea(
        {},
        {
          data: {
            name: "New KA",
            order: 1,
          },
        },
        // @ts-expect-error env mock
        { env: {} },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        {} as GraphQLResolveInfo,
      );

      expect(result).toEqual(mockKA);
    });
  });

  describe("updateKnowledgeArea", () => {
    it("updates a knowledge area", async () => {
      const mockKA = { id: "1", name: "Updated KA" };
      mockPrisma.knowledgeArea.update.mockResolvedValue(mockKA);

      const result = await updateKnowledgeArea(
        {},
        {
          data: { name: "Updated KA" },
          id: "1",
        },
        // @ts-expect-error env mock
        { env: {} },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        {} as GraphQLResolveInfo,
      );

      expect(result).toEqual(mockKA);
    });
  });

  describe("deleteKnowledgeArea", () => {
    it("deletes a knowledge area", async () => {
      const mockKA = { id: "1" };
      mockPrisma.knowledgeArea.delete.mockResolvedValue(mockKA);

      const result = await deleteKnowledgeArea(
        {},
        { id: "1" },
        // @ts-expect-error env mock
        { env: {} },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        {} as GraphQLResolveInfo,
      );

      expect(result).toEqual(mockKA);
    });
  });
});
