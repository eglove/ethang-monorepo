import isArray from "lodash/isArray.js";
import isObject from "lodash/isObject.js";
import { z } from "zod";

import { courseStatusSchema } from "./course-completion-types.client.js";

export class CourseTrackingService {
  public async fetchStoredStatuses(userId: string) {
    const response = await fetch(
      `/api/course-tracking?userId=${encodeURIComponent(userId)}`
    );

    if (!response.ok) return null;

    const json = await response.json();

    let trackingsData: unknown = [];
    if (isObject(json) && "data" in json && isArray(json.data)) {
      trackingsData = json.data;
    }

    const trackingsResult = z
      .array(courseStatusSchema)
      .safeParse(trackingsData);

    if (!trackingsResult.success) return null;

    return trackingsResult.data;
  }

  public async updateCourseStatus(courseId: string, userId: string) {
    const response = await fetch(
      `/api/course-tracking/${encodeURIComponent(courseId)}?userId=${encodeURIComponent(userId)}`,
      {
        body: JSON.stringify({}),
        method: "PUT"
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    let courseStatusData: unknown;
    if (isObject(data) && "data" in data) {
      courseStatusData = data.data;
    }

    const courseStatusResult = courseStatusSchema.safeParse(courseStatusData);

    if (courseStatusResult.success) {
      return courseStatusResult.data.status;
    }

    return null;
  }
}
