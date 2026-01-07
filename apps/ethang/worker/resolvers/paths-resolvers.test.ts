import type { GraphQLResolveInfo } from "graphql/type";

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
});
