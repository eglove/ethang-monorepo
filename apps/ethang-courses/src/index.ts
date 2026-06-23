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

// eslint-disable-next-line unicorn/no-anonymous-default-export
export default class extends WorkerEntrypoint<Env> {
  public async course(parameters: { id: string }) {
    return courseQuery(this.getDb(), parameters);
  }

  public async courses() {
    return coursesQuery(this.getDb());
  }

  public async courseTracking(parameters: {
    courseId: string;
    userId: string;
  }) {
    return courseTrackingQuery(this.getDb(), parameters);
  }

  public async courseTrackings(parameters: {
    after?: string;
    first?: number;
    userId: string;
  }) {
    return courseTrackingsQuery(this.getDb(), parameters);
  }

  public async createCurriculum(parameters: {
    learningPathIds?: null | string[];
    name: string;
    url?: null | string;
  }) {
    return createCurriculumMutation(this.getDb(), parameters);
  }

  public async curriculum(parameters: { id: string }) {
    return curriculumQuery(this.getDb(), parameters);
  }

  public async curriculums() {
    return curriculumsQuery(this.getDb());
  }

  public async cycleCourseTrackingStatus(parameters: {
    courseId: string;
    userId: string;
  }) {
    return cycleCourseTrackingStatusMutation(this.getDb(), parameters);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public override async fetch(): Promise<Response> {
    return new Response("OK", { status: 200 });
  }

  public async learningPath(parameters: { id: string }) {
    return learningPathQuery(this.getDb(), parameters);
  }

  public async learningPaths() {
    return learningPathsQuery(this.getDb());
  }

  private getDb(): Database {
    return drizzle(this.env.ethang_courses, {
      schema: {
        coursesTable,
        courseTrackingTable,
        curriculumLearningPathsTable,
        curriculumsTable,
        learningPathCoursesTable,
        learningPathsTable
      }
    });
  }
}
