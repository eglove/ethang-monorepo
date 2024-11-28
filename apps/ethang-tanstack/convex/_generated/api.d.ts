/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as blogs from "../blogs.js";
import type * as certifications from "../certifications.js";
import type * as courses from "../courses.js";
import type * as jobs from "../jobs.js";
import type * as learningProfile from "../learningProfile.js";
import type * as project from "../project.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  blogs: typeof blogs;
  certifications: typeof certifications;
  courses: typeof courses;
  jobs: typeof jobs;
  learningProfile: typeof learningProfile;
  project: typeof project;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
