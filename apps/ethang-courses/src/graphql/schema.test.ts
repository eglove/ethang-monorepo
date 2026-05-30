import { beforeEach, describe, expect, it, vi } from "vitest";

const { createResolversMock, drizzleMock } = vi.hoisted(() => {
  return {
    createResolversMock: vi.fn(),
    drizzleMock: vi.fn()
  };
});

vi.mock("drizzle-orm/d1", () => {
  return {
    drizzle: drizzleMock
  };
});
vi.mock("./resolvers.ts", () => {
  return {
    createResolvers: createResolversMock
  };
});

import { createSchema } from "./schema.ts";

describe("createSchema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds a schema with pagination types and arguments", () => {
    const database = {
      marker: "database"
    };
    drizzleMock.mockReturnValue(database);
    createResolversMock.mockReturnValue({
      Mutation: {
        cycleCourseTrackingStatus: vi.fn()
      },
      Query: {
        courseTracking: vi.fn(),
        courseTrackings: vi.fn()
      }
    });

    const schema = createSchema({} as never);
    const queryType = schema.getQueryType();
    const courseTrackings = queryType?.getFields()["courseTrackings"];

    expect(String(courseTrackings?.type)).toBe("CourseTrackingConnection!");
    expect(courseTrackings?.args.map((argument) => {
      return argument.name;
    })).toStrictEqual(["userId", "first", "after"]);
    expect(schema.getType("CourseTrackingConnection")).toBeDefined();
    expect(schema.getType("CourseTrackingEdge")).toBeDefined();
    expect(schema.getType("PageInfo")).toBeDefined();
  });

  it("wires drizzle output into resolver creation", () => {
    const databaseBinding = {
      marker: "binding"
    };
    const database = {
      marker: "database"
    };
    drizzleMock.mockReturnValue(database);
    createResolversMock.mockReturnValue({
      Mutation: {
        cycleCourseTrackingStatus: vi.fn()
      },
      Query: {
        courseTracking: vi.fn(),
        courseTrackings: vi.fn()
      }
    });

    createSchema(databaseBinding as never);

    expect(drizzleMock).toHaveBeenCalledWith(databaseBinding, {
      schema: expect.objectContaining({
        courseTrackingTable: expect.anything()
      })
    });
    expect(createResolversMock).toHaveBeenCalledWith(database);
  });
});
