import type { GraphQLResolveInfo } from "graphql/type";

import { describe, expect, it, vi } from "vitest";

import { resolvers } from "./resolvers";

vi.mock("../prisma-client", () => ({
  getPrismaClient: vi.fn(),
  prismaSelect: vi.fn(),
}));

describe("Mutation Authentication", () => {
  it("should throw an error if user is not authenticated for createProject", async () => {
    await expect(
      resolvers.Mutation.createProject(
        {},
        {
          data: {
            code: "test",
            description: "test",
            title: "test",
          },
        },
        // @ts-expect-error mock context
        { env: {} },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        {} as GraphQLResolveInfo,
      ),
    ).rejects.toThrow("Not Authenticated");
  });

  it("should succeed if user is authenticated", async () => {
    const mockPrisma = {
      project: {
        create: vi.fn().mockResolvedValue({ id: "1" }),
      },
    };

    // I need to mock getPrismaClient to return my mockPrisma
    const { getPrismaClient } = await import("../prisma-client");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    vi.mocked(getPrismaClient).mockReturnValue(mockPrisma as unknown as never);

    const result = await resolvers.Mutation.createProject(
      {},
      {
        data: {
          code: "test",
          description: "test",
          title: "test",
        },
      },
      // @ts-expect-error mock context
      { env: {}, user: { id: "user_1" } },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as GraphQLResolveInfo,
    );

    expect(result).toEqual({ id: "1" });
  });

  it("should allow queries without authentication", async () => {
    const mockPrisma = {
      project: {
        findUnique: vi.fn().mockResolvedValue({ id: "1", title: "Test" }),
      },
    };
    const { getPrismaClient } = await import("../prisma-client");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    vi.mocked(getPrismaClient).mockReturnValue(mockPrisma as unknown as never);

    const result = await resolvers.Query.project(
      {},
      { id: "1" },
      // @ts-expect-error mock context
      { env: {} },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      {} as GraphQLResolveInfo,
    );

    expect(result).toEqual({ id: "1", title: "Test" });
  });
});
