import { BaseStore } from "@ethang/store";
import isNil from "lodash/isNil.js";

import type {
  CourseCompletionState,
  CourseStatusValue,
} from "./course-completion-types.client.js";

export class CourseCompletionStore extends BaseStore<CourseCompletionState> {
  public constructor() {
    super({ courses: {}, isAuthenticated: false, userId: null });
  }

  public override reset() {
    this.update((draft) => {
      draft.courses = {};
      draft.isAuthenticated = false;
      draft.userId = null;
    });
  }

  public setAuthenticated(userId: null | string) {
    this.update((draft) => {
      draft.isAuthenticated = null !== userId;
      draft.userId = userId;
    });
  }

  public setLoading(courseUrl: string, isLoading: boolean) {
    this.update((draft) => {
      if (isNil(draft.courses[courseUrl])) {
        draft.courses[courseUrl] = { isLoading, status: "Incomplete" };
      } else {
        draft.courses[courseUrl].isLoading = isLoading;
      }
    });
  }

  public setStatus(courseUrl: string, status: CourseStatusValue) {
    this.update((draft) => {
      if (isNil(draft.courses[courseUrl])) {
        draft.courses[courseUrl] = { isLoading: false, status };
      } else {
        draft.courses[courseUrl].status = status;
      }
    });
  }

  public setStatuses(
    trackings: { courseUrl: string; status: CourseStatusValue }[],
  ) {
    this.update((draft) => {
      for (const tracking of trackings) {
        const course = draft.courses[tracking.courseUrl];
        if (isNil(course)) {
          draft.courses[tracking.courseUrl] = {
            isLoading: false,
            status: tracking.status,
          };
        } else {
          course.status = tracking.status;
        }
      }
    });
  }
}
