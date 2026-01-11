import type { GraphQLResolveInfo } from "graphql/type";

import get from "lodash/get.js";
import { describe, expect, it, vi } from "vitest";

import {
  createProject,
  deleteProject,
  project,
  projects,
  updateProject,
} from "./projects-resolvers";

const mockPrisma = {
  project: {
    count: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("../prisma-client", () => ({
  getPrismaClient: () => mockPrisma,
  prismaSelect: vi.fn().mockReturnValue({ id: true, title: true }),
}));

const testProject = "Test Project";
const ethangStore = "@ethang/store";
const id1 = "1";
const updatedProject = "Updated Project";

describe("projects resolver", () => {
  it("returns projects connection", async () => {
    mockPrisma.project.count.mockResolvedValue(1);
    mockPrisma.project.findMany.mockResolvedValue([
      {
        id: id1,
        techs: [{ id: id1, name: "React" }],
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
        id: id1,
        techs: [{ id: id1, name: "React" }],
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
      id: id1,
      techs: [{ id: id1, name: "React" }],
      title: testProject,
    });

    const result = await project(
      {},
      { id: id1 },
      // @ts-expect-error env mock
      { env: {} },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as GraphQLResolveInfo,
    );

    expect(get(result, ["id"])).toBe(id1);
    expect(get(result, ["title"])).toBe(testProject);
  });

  it("creates a project", async () => {
    mockPrisma.project.create.mockResolvedValue({
      id: id1,
      title: testProject,
    });

    const result = await createProject(
      {},
      {
        data: {
          code: "test-project",
          description: "A test project",
          title: testProject,
        },
      },
      // @ts-expect-error env mock
      { env: {} },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as GraphQLResolveInfo,
    );

    expect(get(result, ["title"])).toBe(testProject);
  });

  it("updates a project", async () => {
    mockPrisma.project.update.mockResolvedValue({
      id: id1,
      title: updatedProject,
    });

    const result = await updateProject(
      {},
      {
        data: {
          title: updatedProject,
        },
        id: id1,
      },
      // @ts-expect-error env mock
      { env: {} },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as GraphQLResolveInfo,
    );

    expect(get(result, ["title"])).toBe(updatedProject);
  });

  it("deletes a project", async () => {
    mockPrisma.project.delete.mockResolvedValue({
      id: id1,
      title: testProject,
    });

    const result = await deleteProject(
      {},
      { id: id1 },
      // @ts-expect-error env mock
      { env: {} },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as GraphQLResolveInfo,
    );

    expect(get(result, ["id"])).toBe(id1);
  });
});
