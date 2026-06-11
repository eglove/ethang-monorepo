import { getTableConfig } from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vitest";

import {
  coursesTable,
  curriculumLearningPathsTable,
  curriculumsTable,
  generateCourseTrackingId,
  generateId,
  learningPathCoursesTable,
  learningPathsTable
} from "./schema.ts";

describe("schema", () => {
  it("generates correct ids", () => {
    expect(generateCourseTrackingId()).toHaveLength(36);
    expect(generateId()).toHaveLength(36);
  });

  it("coursesTable has default functions", () => {
    expect(typeof coursesTable.createdAt.defaultFn).toBe("function");
    // @ts-expect-error test double
    expect(typeof coursesTable.createdAt.defaultFn()).toBe("string");

    expect(typeof coursesTable.updatedAt.defaultFn).toBe("function");
    // @ts-expect-error test double
    expect(typeof coursesTable.updatedAt.defaultFn()).toBe("string");
  });

  it("learningPathsTable has default functions", () => {
    expect(typeof learningPathsTable.createdAt.defaultFn).toBe("function");
    // @ts-expect-error test double
    expect(typeof learningPathsTable.createdAt.defaultFn()).toBe("string");

    expect(typeof learningPathsTable.updatedAt.defaultFn).toBe("function");
    // @ts-expect-error test double
    expect(typeof learningPathsTable.updatedAt.defaultFn()).toBe("string");
  });

  it("learningPathCoursesTable has default functions and references", () => {
    const config = getTableConfig(learningPathCoursesTable);

    expect(typeof learningPathCoursesTable.createdAt.defaultFn).toBe(
      "function"
    );
    // @ts-expect-error test double
    expect(typeof learningPathCoursesTable.createdAt.defaultFn()).toBe(
      "string"
    );

    // Evaluate the references thunk
    // @ts-expect-error test double
    expect(config.foreignKeys[0].reference().columns[0].name).toBeDefined();
    // @ts-expect-error test double
    expect(config.foreignKeys[1].reference().columns[0].name).toBeDefined();
  });

  it("curriculumsTable has default functions", () => {
    expect(typeof curriculumsTable.createdAt.defaultFn).toBe("function");
    // @ts-expect-error test double
    expect(typeof curriculumsTable.createdAt.defaultFn()).toBe("string");

    expect(typeof curriculumsTable.updatedAt.defaultFn).toBe("function");
    // @ts-expect-error test double
    expect(typeof curriculumsTable.updatedAt.defaultFn()).toBe("string");
  });

  it("curriculumLearningPathsTable has default functions and references", () => {
    const config = getTableConfig(curriculumLearningPathsTable);

    expect(typeof curriculumLearningPathsTable.createdAt.defaultFn).toBe(
      "function"
    );
    // @ts-expect-error test double
    expect(typeof curriculumLearningPathsTable.createdAt.defaultFn()).toBe(
      "string"
    );

    // Evaluate the references thunk
    // @ts-expect-error test double
    expect(config.foreignKeys[0].reference().columns[0].name).toBeDefined();
    // @ts-expect-error test double
    expect(config.foreignKeys[1].reference().columns[0].name).toBeDefined();
  });
});
