import get from "lodash/get.js";
import { describe, expect, it, vi } from "vitest";

import { projects } from "./projects-resolvers";

const mockPrisma = {
  project: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
};

vi.mock("../prisma-client", () => ({
  getPrismaClient: () => mockPrisma,
}));

describe("projects resolver", () => {
  it("returns projects connection", async () => {
    mockPrisma.project.count.mockResolvedValue(1);
    mockPrisma.project.findMany.mockResolvedValue([
      {
        id: "1",
        techs: [{ id: "1", name: "React" }],
        title: "Test Project",
      },
    ]);

    const result = await projects(
      {},
      { first: 10 },
      // @ts-expect-error env mock
      { env: {} },
    );

    expect(get(result, ["edges"])).toHaveLength(1);
    const firstEdge = get(result, ["edges", 0]);
    expect(get(firstEdge, ["node", "title"])).toBe("Test Project");
    expect(get(result, ["totalCount"])).toBe(1);
    expect(get(result, ["pageInfo", "hasNextPage"])).toBe(false);
  });
});
