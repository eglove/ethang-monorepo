import { WorkerEntrypoint } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import type { Database } from "./data/types.ts";

import { createCurriculumMutation } from "./data/mutations/create-curriculum.ts";
import { cycleCourseTrackingStatusMutation } from "./data/mutations/cycle-course-tracking-status.ts";
import { courseTrackingQuery } from "./data/queries/course-tracking.ts";
import { courseTrackingsQuery } from "./data/queries/course-trackings.ts";
import {
  courseQuery,
  coursesQuery,
  learningPathQuery,
  learningPathsQuery
} from "./data/queries/courses-learning-paths.ts";
import {
  curriculumQuery,
  curriculumsQuery
} from "./data/queries/curriculums.ts";
import {
  coursesTable,
  courseTrackingTable,
  curriculumLearningPathsTable,
  curriculumsTable,
  learningPathCoursesTable,
  learningPathsTable
} from "./db/schema.ts";

const createDatabase = (databaseBinding: D1Database): Database => {
  return drizzle(databaseBinding, {
    schema: {
      coursesTable,
      courseTrackingTable,
      curriculumLearningPathsTable,
      curriculumsTable,
      learningPathCoursesTable,
      learningPathsTable
    }
  });
};

// eslint-disable-next-line unicorn/no-anonymous-default-export
export default class extends WorkerEntrypoint<Env> {
  public async course(parameters: { id: string }) {
    const database = createDatabase(this.env.ethang_courses);
    return courseQuery(database, parameters);
  }

  public async courses() {
    const database = createDatabase(this.env.ethang_courses);
    return coursesQuery(database);
  }

  public async courseTracking(parameters: {
    courseId: string;
    userId: string;
  }) {
    const database = createDatabase(this.env.ethang_courses);
    return courseTrackingQuery(database, parameters);
  }

  public async courseTrackings(parameters: {
    after?: string;
    first?: number;
    userId: string;
  }) {
    const database = createDatabase(this.env.ethang_courses);
    return courseTrackingsQuery(database, parameters);
  }

  public async createCurriculum(parameters: {
    learningPathIds?: null | string[];
    name: string;
    url?: null | string;
  }) {
    const database = createDatabase(this.env.ethang_courses);
    return createCurriculumMutation(database, parameters);
  }

  public async curriculum(parameters: { id: string }) {
    const database = createDatabase(this.env.ethang_courses);
    return curriculumQuery(database, parameters);
  }

  public async curriculums() {
    const database = createDatabase(this.env.ethang_courses);
    return curriculumsQuery(database);
  }

  public async cycleCourseTrackingStatus(parameters: {
    courseId: string;
    userId: string;
  }) {
    const database = createDatabase(this.env.ethang_courses);
    return cycleCourseTrackingStatusMutation(database, parameters);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public override async fetch(): Promise<Response> {
    return new Response("OK", { status: 200 });
  }

  public async learningPath(parameters: { id: string }) {
    const database = createDatabase(this.env.ethang_courses);
    return learningPathQuery(database, parameters);
  }

  public async learningPaths() {
    const database = createDatabase(this.env.ethang_courses);
    return learningPathsQuery(database);
  }
}
