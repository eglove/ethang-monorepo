import { getCookieValue } from "@ethang/toolbelt/http/cookie.js";
import isArray from "lodash/isArray.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import { z } from "zod";

import {
  courseStatusSchema,
  userTokenSchema
} from "./course-completion-types.client.js";

const AUTH_COOKIE_NAME = "ethang-auth-token";

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

  public async verifyToken() {
    const tokenValue = getCookieValue(AUTH_COOKIE_NAME, document.cookie);

    if (isError(tokenValue) || isNil(tokenValue)) {
      return null;
    }

    const verification = await fetch("https://auth.ethang.dev/verify", {
      headers: {
        "X-Token": tokenValue
      }
    });

    if (!verification.ok) {
      if ("cookieStore" in globalThis) {
        await cookieStore.delete(AUTH_COOKIE_NAME);
      } else {
        document.cookie = `${AUTH_COOKIE_NAME}=; Max-Age=0; path=/`;
      }
      location.reload();
      return null;
    }

    const json = await verification.json();
    const userDataResult = userTokenSchema.safeParse(json);

    if (!userDataResult.success) {
      return null;
    }

    return userDataResult.data.sub;
  }
}
