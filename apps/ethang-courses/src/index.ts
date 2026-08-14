import { WorkerEntrypoint } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { Effect } from "effect";

import { createCurriculumMutation } from "./data/mutations/create-curriculum.ts";
import { cycleCourseTrackingStatusMutation } from "./data/mutations/cycle-course-tracking-status.ts";
import { courseTrackingQuery } from "./data/queries/course-tracking.ts";
import { courseTrackingsQuery } from "./data/queries/course-trackings.ts";
import {
  courseQuery,
  coursesAllQuery,
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

const runQuery = async <A>(effect: Effect.Effect<A, unknown>) => {
  return Effect.runPromise(effect);
};

export class CoursesService extends WorkerEntrypoint<Env> {
  public async course(parameters: { id: string }) {
    return runQuery(courseQuery(this.getDb(), parameters.id));
  }

  public async courses() {
    return runQuery(coursesQuery(this.getDb(), null));
  }

  // New method: Return all courses with stable indices and learning path context
  public async coursesAll() {
    return runQuery(coursesAllQuery(this.getDb(), null));
  }

  public async courseTracking(parameters: {
    courseId: string;
    userId: string;
  }) {
    return runQuery(courseTrackingQuery(this.getDb(), parameters));
  }

  public async courseTrackings(parameters: {
    // eslint-disable-next-line unicorn/no-unused-properties
    after?: string;
    // eslint-disable-next-line unicorn/no-unused-properties
    first?: number;
    userId: string;
  }) {
    return runQuery(courseTrackingsQuery(this.getDb(), parameters.userId));
  }

  public async createCurriculum(parameters: {
    learningPathIds?: null | string[];
    name: string;
    url?: null | string;
  }) {
    return createCurriculumMutation(this.getDb(), parameters);
  }

  public async curriculum(parameters: { id: string }) {
    return runQuery(curriculumQuery(this.getDb(), parameters.id));
  }

  public async curriculums() {
    return runQuery(curriculumsQuery(this.getDb(), null));
  }

  public async cycleCourseTrackingStatus(parameters: {
    courseId: string;
    userId: string;
  }) {
    return cycleCourseTrackingStatusMutation(this.getDb(), parameters);
  }

  public override fetch(_request: Request) {
    return new Response("OK", { status: 200 });
  }

  public async learningPath(parameters: { id: string }) {
    return runQuery(learningPathQuery(this.getDb(), parameters.id));
  }

  public async learningPaths() {
    return runQuery(learningPathsQuery(this.getDb(), null));
  }

  private getDb() {
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

export default CoursesService;
