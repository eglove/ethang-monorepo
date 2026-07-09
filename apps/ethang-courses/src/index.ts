import { createCachedJsonResponse } from "@ethang/toolbelt/cache/cache-control.ts";
import { WorkerEntrypoint } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { Effect } from "effect";

import type { Database } from "./data/types.ts";

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

const PUBLIC_READ_CACHE = { maxAge: 300, scope: "public" as const, swr: 3600 };
const PRIVATE_NO_STORE = { maxAge: 0, scope: "private" as const, swr: 0 };
const NO_STORE = { scope: "no-store" as const };

const runQuery = async <A>(effect: Effect.Effect<A, unknown>): Promise<A> => {
  return Effect.runPromise(effect);
};

// eslint-disable-next-line unicorn/no-anonymous-default-export
export default class extends WorkerEntrypoint<Env> {
  public async course(parameters: { id: string }) {
    const data = await runQuery(courseQuery(this.getDb(), parameters.id));
    return createCachedJsonResponse(data, {
      cacheControl: PUBLIC_READ_CACHE,
      tags: ["courses", `course:${parameters.id}`]
    });
  }

  public async courses() {
    const data = await runQuery(coursesQuery(this.getDb(), null));
    return createCachedJsonResponse(data, {
      cacheControl: PUBLIC_READ_CACHE,
      tags: ["courses"]
    });
  }

  // New method: Return all courses with stable indices and learning path context
  public async coursesAll() {
    const data = await runQuery(coursesAllQuery(this.getDb(), null));
    return createCachedJsonResponse(data, {
      cacheControl: PUBLIC_READ_CACHE,
      tags: ["courses"]
    });
  }

  public async courseTracking(parameters: {
    courseId: string;
    userId: string;
  }) {
    const data = await runQuery(courseTrackingQuery(this.getDb(), parameters));
    return createCachedJsonResponse(data, { cacheControl: PRIVATE_NO_STORE });
  }

  public async courseTrackings(parameters: {
    // eslint-disable-next-line unicorn/no-unused-properties
    after?: string;
    // eslint-disable-next-line unicorn/no-unused-properties
    first?: number;
    userId: string;
  }) {
    const data = await runQuery(
      courseTrackingsQuery(this.getDb(), parameters.userId)
    );
    return createCachedJsonResponse(data, { cacheControl: PRIVATE_NO_STORE });
  }

  public async createCurriculum(parameters: {
    learningPathIds?: null | string[];
    name: string;
    url?: null | string;
  }) {
    const data = await createCurriculumMutation(this.getDb(), parameters);
    return createCachedJsonResponse(data, { cacheControl: NO_STORE });
  }

  public async curriculum(parameters: { id: string }) {
    const data = await runQuery(curriculumQuery(this.getDb(), parameters.id));
    return createCachedJsonResponse(data, {
      cacheControl: PUBLIC_READ_CACHE,
      tags: ["curriculums", `curriculum:${parameters.id}`]
    });
  }

  public async curriculums() {
    const data = await runQuery(curriculumsQuery(this.getDb(), null));
    return createCachedJsonResponse(data, {
      cacheControl: PUBLIC_READ_CACHE,
      tags: ["curriculums"]
    });
  }

  public async cycleCourseTrackingStatus(parameters: {
    courseId: string;
    userId: string;
  }) {
    const data = await cycleCourseTrackingStatusMutation(
      this.getDb(),
      parameters
    );
    return createCachedJsonResponse(data, { cacheControl: NO_STORE });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public override async fetch() {
    return new Response("OK", { status: 200 });
  }

  public async learningPath(parameters: { id: string }) {
    const data = await runQuery(learningPathQuery(this.getDb(), parameters.id));
    return createCachedJsonResponse(data, {
      cacheControl: PUBLIC_READ_CACHE,
      tags: ["learningPaths", `learningPath:${parameters.id}`]
    });
  }

  public async learningPaths() {
    const data = await runQuery(learningPathsQuery(this.getDb(), null));
    return createCachedJsonResponse(data, {
      cacheControl: PUBLIC_READ_CACHE,
      tags: ["learningPaths"]
    });
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
