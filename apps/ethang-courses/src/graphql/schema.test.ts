import map from "lodash/map.js";
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
  const createResolversReturn = {
    Mutation: {
      cycleCourseTrackingStatus: vi.fn()
    },
    Query: {
      courseTracking: vi.fn(),
      courseTrackings: vi.fn()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds a schema with pagination types and arguments", () => {
    const database = {
      marker: "database"
    };
    drizzleMock.mockReturnValue(database);
    createResolversMock.mockReturnValue(createResolversReturn);

    // @ts-expect-error minimal binding test double for this unit test
    const schema = createSchema({});
    const queryType = schema.getQueryType();
    const courseTrackings = queryType?.getFields()["courseTrackings"];

    expect(String(courseTrackings?.type)).toBe("CourseTrackingConnection!");
    expect(
      map(courseTrackings?.args, (argument) => {
        return argument.name;
      })
    ).toStrictEqual(["userId", "first", "after"]);
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
    createResolversMock.mockReturnValue(createResolversReturn);

    // @ts-expect-error minimal binding test double for this unit test
    createSchema(databaseBinding);

    expect(drizzleMock).toHaveBeenCalledTimes(1);
    expect(drizzleMock).toHaveBeenCalledWith(
      databaseBinding,
      expect.anything()
    );
    expect(createResolversMock).toHaveBeenCalledWith(database);
  });
});
