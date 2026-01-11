import type { GraphQLResolveInfo } from "graphql/type";

import get from "lodash/get.js";
import { describe, expect, it, vi } from "vitest";

import {
  createPath,
  deletePath,
  path,
  paths,
  updatePath,
} from "./paths-resolvers.ts";

const mockPrisma = {
  path: {
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        {} as GraphQLResolveInfo,
      );

      expect(get(result, ["id"])).toBe("path-1");
      expect(get(result, ["_count", "courses"])).toBe(3);
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        {} as GraphQLResolveInfo,
      );

      expect(get(result, [0, "_count", "courses"])).toBe(10);
      expect(get(result, [0, "name"])).toBe("Backend");
    });
  });

  describe("createPath", () => {
    it("creates a path", async () => {
      const mockPath = { id: "1", name: "New Path" };
      mockPrisma.path.create.mockResolvedValue(mockPath);

      const result = await createPath(
        {},
        {
          data: {
            name: "New Path",
            order: 1,
            url: "url",
          },
        },
        // @ts-expect-error env mock
        { env: {} },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        {} as GraphQLResolveInfo,
      );

      expect(result).toEqual(mockPath);
    });
  });

  describe("updatePath", () => {
    it("updates a path", async () => {
      const mockPath = { id: "1", name: "Updated Path" };
      mockPrisma.path.update.mockResolvedValue(mockPath);

      const result = await updatePath(
        {},
        {
          data: { name: "Updated Path" },
          id: "1",
        },
        // @ts-expect-error env mock
        { env: {} },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        {} as GraphQLResolveInfo,
      );

      expect(result).toEqual(mockPath);
    });
  });

  describe("deletePath", () => {
    it("deletes a path", async () => {
      const mockPath = { id: "1" };
      mockPrisma.path.delete.mockResolvedValue(mockPath);

      const result = await deletePath(
        {},
        { id: "1" },
        // @ts-expect-error env mock
        { env: {} },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        {} as GraphQLResolveInfo,
      );

      expect(result).toEqual(mockPath);
    });
  });
});
