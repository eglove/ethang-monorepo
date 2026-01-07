import type { GraphQLResolveInfo } from "graphql/type";

import get from "lodash/get.js";
import { describe, expect, it, vi } from "vitest";

import { project, projects } from "./projects-resolvers";

const mockPrisma = {
  project: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
};

vi.mock("../prisma-client", () => ({
  getPrismaClient: () => mockPrisma,
  prismaSelect: vi.fn().mockReturnValue({ id: true, title: true }),
}));

const testProject = "Test Project";
const ethangStore = "@ethang/store";

describe("projects resolver", () => {
  it("returns projects connection", async () => {
    mockPrisma.project.count.mockResolvedValue(1);
    mockPrisma.project.findMany.mockResolvedValue([
      {
        id: "1",
        techs: [{ id: "1", name: "React" }],
        title: testProject,
      },
    ]);

    const result = await projects(
      {},
      { take: 10 },
      // @ts-expect-error env mock
      { env: {} },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as GraphQLResolveInfo,
    );

    expect(result.length).toBe(1);
    expect(get(result, [0, "title"])).toBe(testProject);
  });

  it("filters projects by titles", async () => {
    mockPrisma.project.count.mockResolvedValue(1);
    mockPrisma.project.findMany.mockResolvedValue([
      {
        id: "1",
        techs: [{ id: "1", name: "React" }],
        title: ethangStore,
      },
    ]);

    const result = await projects(
      {},
      { where: { title: { in: [ethangStore] } } },
      // @ts-expect-error env mock
      { env: {} },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as GraphQLResolveInfo,
    );

    expect(mockPrisma.project.findMany).toHaveBeenCalled();
    expect(get(result, [0, "title"])).toBe(ethangStore);
  });

  it("returns a single project", async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: "1",
      techs: [{ id: "1", name: "React" }],
      title: testProject,
    });

    const result = await project(
      {},
      { id: "1" },
      // @ts-expect-error env mock
      { env: {} },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as GraphQLResolveInfo,
    );

    expect(get(result, ["id"])).toBe("1");
    expect(get(result, ["title"])).toBe(testProject);
  });
});
