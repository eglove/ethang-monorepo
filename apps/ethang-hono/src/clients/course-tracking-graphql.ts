import type { Context, Input } from "hono";

import isArray from "lodash/isArray.js";
import isFunction from "lodash/isFunction.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";

import {
  type AppContext,
  globalStore
} from "../stores/global-store-properties.ts";

export type CourseTrackingRecord = {
  courseUrl: string;
  id: string;
  status: string;
  userId: string;
};

const executeQuery = async <P extends string, I extends Input>(
  context: Context<AppContext, P, I>,
  query: string,
  variables: Record<string, string>
) => {
  const headers = new Headers({
    "Content-Type": "application/json"
  });

  if (!isNil(globalStore.authToken)) {
    headers.set("X-Token", globalStore.authToken);
  }

  const request = new Request("https://ethang-graphql/graphql", {
    body: JSON.stringify({ query, variables }),
    headers,
    method: "POST"
  });

  const service = Reflect.get(context.env, "ethang_graphql");
  const serviceFetch = isObject(service)
    ? Reflect.get(service, "fetch")
    : undefined;

  if (isFunction(serviceFetch)) {
    const response = serviceFetch.call(service, request);

    if (!(response instanceof Promise)) {
      throw new TypeError(
        "ethang_graphql service returned non-promise response"
      );
    }

    return response.then((value) => {
      if (!(value instanceof Response)) {
        throw new TypeError("ethang_graphql service returned invalid response");
      }

      return value;
    });
  }

  return fetch(request);
};

const extractGraphqlData = async <T>(response: Response) => {
  const payload = await response.json<{
    data?: T;
    errors?: { message?: string }[];
  }>();

  if (!response.ok) {
    throw new Error("Course tracking GraphQL request failed");
  }

  if (isArray(payload.errors) && 0 < payload.errors.length) {
    throw new Error(
      payload.errors[0]?.message ?? "Course tracking GraphQL error"
    );
  }

  if (!isObject(payload) || isNil(payload.data)) {
    throw new Error("Course tracking GraphQL response missing data");
  }

  return payload.data;
};

export const getCourseTrackingsByUserId = async <
  P extends string,
  I extends Input
>(
  context: Context<AppContext, P, I>,
  userId: string
) => {
  const response = await executeQuery(
    context,
    `query CourseTrackings($userId: String!) {
      courseTrackings(userId: $userId) {
        courseUrl
        id
        status
        userId
      }
    }`,
    { userId }
  );

  const data = await extractGraphqlData<{
    courseTrackings?: CourseTrackingRecord[];
  }>(response);

  return data.courseTrackings ?? [];
};

export const getCourseTrackingByUserIdCourseId = async <
  P extends string,
  I extends Input
>(
  context: Context<AppContext, P, I>,
  userId: string,
  courseId: string
) => {
  const response = await executeQuery(
    context,
    `query CourseTracking($courseId: String!, $userId: String!) {
      courseTracking(courseId: $courseId, userId: $userId) {
        courseUrl
        id
        status
        userId
      }
    }`,
    { courseId, userId }
  );

  const data = await extractGraphqlData<{
    courseTracking?: CourseTrackingRecord;
  }>(response);

  return data.courseTracking;
};

export const cycleCourseTrackingStatus = async <
  P extends string,
  I extends Input
>(
  context: Context<AppContext, P, I>,
  userId: string,
  courseId: string
) => {
  const response = await executeQuery(
    context,
    `mutation CycleCourseTrackingStatus($courseId: String!, $userId: String!) {
      cycleCourseTrackingStatus(courseId: $courseId, userId: $userId) {
        courseUrl
        id
        status
        userId
      }
    }`,
    { courseId, userId }
  );

  const data = await extractGraphqlData<{
    cycleCourseTrackingStatus?: CourseTrackingRecord;
  }>(response);

  return data.cycleCourseTrackingStatus;
};
